import { mkdir, writeFile, readFile, rename, chmod } from 'node:fs/promises';
import path from 'node:path';
import { request } from './source.mjs';

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).filter((k) => !['_rev','_createdAt','_updatedAt'].includes(k)).sort().map((k) => [k,canonical(value[k])]));
  return value;
}
export const equal = (a,b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

export function changes(documents, current, previouslyOwned = []) {
  const existing = new Map(current.map((doc) => [doc._id,doc]));
  const ids = new Set(documents.map((doc) => doc._id));
  const created = documents.filter((doc) => !existing.has(doc._id));
  const changed = documents.filter((doc) => existing.has(doc._id) && !equal(doc,existing.get(doc._id)));
  const removed = previouslyOwned.filter((id) => !ids.has(id) && existing.has(id)).map((id) => existing.get(id));
  return {created,changed,removed,unchanged:documents.length-created.length-changed.length};
}

export async function readManifest(filename) {
  try { return JSON.parse(await readFile(filename,'utf8')); }
  catch(error) {if(error.code==='ENOENT')return {version:1,ownedIds:[],assets:{}};throw error;}
}

export async function importAssets(client, assets, manifest, progress = () => {}, checkpoint = async () => {}) {
  const existing = await client.fetch('*[_type in ["sanity.imageAsset","sanity.fileAsset"]]{_id,url,source}');
  const byId = new Map(existing.map((asset)=>[asset._id,asset]));
  const bySource = new Map(existing.filter((asset)=>asset.source?.url||asset.source?.id).map((asset)=>[asset.source.url||asset.source.id,asset]));
  const refs = new Map();
  let uploaded=0,reused=0;
  for(const [index,asset] of assets.entries()) {
    let target = bySource.get(asset.url) || byId.get(manifest.assets?.[asset.url]?.id);
    if(!target) {
      const response=await request(asset.url);
      if(!response.ok)throw new Error(`Source media download failed: HTTP ${response.status}`);
      const bytes=Buffer.from(await response.arrayBuffer());
      const filename=decodeURIComponent(new URL(asset.url).pathname.split('/').at(-1));
      target=await client.assets.upload(asset.kind,bytes,{filename,contentType:response.headers.get('content-type')?.split(';')[0],source:{name:'Webflow',id:asset.url,url:asset.url}});
      if(byId.has(target._id))reused++;else uploaded++;
      byId.set(target._id,target);
    }else reused++;
    refs.set(asset.token,target._id);
    manifest.assets[asset.url]={id:target._id,url:target.url};
    for(const alias of asset.aliases??[])manifest.assets[alias]={id:target._id,url:target.url};
    await checkpoint(manifest);
    if(index%25===0||index===assets.length-1)progress({mediaCompleted:index+1,total:assets.length,uploaded,reused});
  }
  return {refs,uploaded,reused};
}

export function materialize(documents, refs) {
  return JSON.parse(JSON.stringify(documents),(name,value)=>{
    if(name==='_ref'&&typeof value==='string'&&value.startsWith('import-asset-')) {
      if(!refs.has(value))throw new Error('Unresolved imported asset');
      return refs.get(value);
    }
    return value;
  });
}

export function assertNoSourceAssetUrls(documents) {
  if (/https?:[^"\s]*(?:website-files\.com|webflow-prod-assets)/i.test(JSON.stringify(documents))) throw new Error('Webflow asset URL remains in imported page content');
}

export async function writeDocuments(client, documents, manifest) {
  assertNoSourceAssetUrls(documents);
  const ids=[...new Set([...documents.map((doc)=>doc._id),...manifest.ownedIds])];
  const current=await client.fetch('*[_id in $ids]',{ids});
  const owned=new Set(manifest.ownedIds);
  if(current.some((doc)=>!owned.has(doc._id)))throw new Error('A target document already exists outside importer ownership; no content was changed');
  // Compare to the last imported revision, not the revision just fetched. The
  // transaction guards below then protect edits made after this preflight.
  const revisions=manifest.documentRevisions??{};
  if(current.some((doc)=>!revisions[doc._id]||revisions[doc._id]!==doc._rev)||
    manifest.ownedIds.some((id)=>!current.some((doc)=>doc._id===id)))throw new Error('Importer-owned content was edited or removed, or has no recorded revision; no content was changed');
  const delta=changes(documents,current,manifest.ownedIds);
  const existing=new Map(current.map((doc)=>[doc._id,doc]));
  const transaction=client.transaction();
  for(const doc of delta.created)transaction.create(doc);
  for(const doc of delta.changed) {
    const old=existing.get(doc._id);
    const {_id,_type,...fields}=doc;
    const removed=Object.keys(old).filter((name)=>!name.startsWith('_')&&!Object.hasOwn(fields,name));
    transaction.patch(_id,(patch)=>patch.ifRevisionId(old._rev).set(fields).unset(removed));
  }
  for(const doc of delta.removed)transaction.patch(doc._id,(patch)=>patch.ifRevisionId(doc._rev).set({})).delete(doc._id);
  // One atomic transaction resolves cyclic source references without publishing
  // temporary placeholder documents. Stop before writes if this exceeds budget.
  if(Buffer.byteLength(JSON.stringify(transaction.serialize()))>8*1024*1024)throw new Error('Import transaction exceeds safe size; split by dependency groups before applying');
  let written=[];
  if(delta.created.length+delta.changed.length+delta.removed.length)written=await transaction.commit({visibility:'sync',returnDocuments:true});
  const imported=new Map(current.map((doc)=>[doc._id,doc._rev]));
  for(const doc of written)if(doc?._id)imported.set(doc._id,doc._rev);
  if(documents.some((doc)=>!imported.get(doc._id)))throw new Error('Import committed without all document revisions; reconcile the verified transaction before retrying');
  manifest.ownedIds=documents.map((doc)=>doc._id);
  manifest.documentRevisions=Object.fromEntries(documents.map((doc)=>[doc._id,imported.get(doc._id)]));
  return {created:delta.created.length,changed:delta.changed.length,removed:delta.removed.length,unchanged:delta.unchanged};
}

export async function verifyImport(client, documents, counts, manifest) {
  const actual=await client.fetch('*[_id in $ids]',{ids:documents.map((d)=>d._id)});
  const stored=new Map(actual.map((doc)=>[doc._id,doc]));
  if(documents.some((doc)=>!stored.has(doc._id)||!equal(doc,stored.get(doc._id))))throw new Error('Stored content does not match the import plan');
  const comparisons=counts.map((count)=>{
    const members=actual.filter((doc)=>doc._id.replace(/^drafts\./,'').startsWith(count.prefix));
    return {...count,sanityUnique:new Set(members.map((doc)=>doc._id.replace(/^drafts\./,''))).size,
      sanityPublished:members.filter((doc)=>!doc._id.startsWith('drafts.')).length,
      sanityDrafts:members.filter((doc)=>doc._id.startsWith('drafts.')).length};
  });
  if(comparisons.some((count)=>count.sanityUnique!==count.unique||count.sanityPublished!==count.publishedDocuments||count.sanityDrafts!==count.draftDocuments))throw new Error('A collection publication count does not match');
  const urls=[...new Set(Object.values(manifest.assets).map((asset)=>asset.url))];
  for(const url of urls) {
    const response=await request(url,{method:'HEAD'});
    if(!response.ok)throw new Error(`Imported CDN asset is unavailable: HTTP ${response.status}`);
  }
  assertNoSourceAssetUrls(documents);
  return {collections:comparisons,cdnFilesChecked:urls.length};
}

export async function savePrivate(filename, data) {
  await mkdir(path.dirname(filename),{recursive:true,mode:0o700});
  const temporary=`${filename}.${process.pid}.tmp`;
  await writeFile(temporary,JSON.stringify(data,null,2),{mode:0o600});
  await chmod(temporary,0o600);
  await rename(temporary,filename);
}
