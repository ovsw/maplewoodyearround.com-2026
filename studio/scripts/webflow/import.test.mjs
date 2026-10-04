import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { webflowReader } from './source.mjs';
import { assetCollector, destination, portableText } from './html.mjs';
import { cmsDocuments, identityMap, mapItem } from './collections.mjs';
import { mediaAliases, buildPlan } from './plan.mjs';
import { changes, equal, materialize, writeDocuments, verifyTarget, backupDataset, savePrivate } from './write.mjs';
import { argumentsFor } from '../import-webflow.mjs';

const context = () => ({ ...assetCollector(), routes:new Map([['/known','known-page']]), warnings:new Set(), identities:new Map() });
const image = 'https://cdn.prod.website-files.com/site/image.jpg';

test('pagination retrieves every page and rejects changing or missing totals', async () => {
  const calls=[];
  const api=webflowReader('test',async (url,options)=>{
    calls.push({url,method:options.method});
    const offset=Number(new URL(url).searchParams.get('offset'));
    return Response.json({items:offset ? [{id:'last'}] : [{id:'first'},{id:'second'}],pagination:{total:3}});
  });
  assert.deepEqual((await api.list('/items','items')).map((i)=>i.id),['first','second','last']);
  assert.match(calls[1].url,/offset=2/);
  assert.ok(calls.every((call)=>call.method===undefined));
  await assert.rejects(webflowReader('test',async()=>Response.json({items:[]})).list('/items','items'),/no total/);
  let page=0;
  await assert.rejects(webflowReader('test',async()=>Response.json({items:[{}],pagination:{total:++page===1?3:2}})).list('/items','items'),/changed/);
  await assert.rejects(webflowReader('test',async()=>Response.json({items:[],pagination:{total:1}})).list('/items','items'),/Incomplete/);
});

test('portable text preserves marked prose, links, nested lists and images without scripts',()=>{
  const ctx=context();
  const result=portableText(`<h2>Heading</h2><p>Hello <strong>camp</strong> and <a href="/known">families</a>.<img src="${image}" alt="Pool"></p><ul><li>First<ul><li>Nested</li></ul></li></ul><!-- comment --><script>bad()</script>`,ctx);
  assert.equal(result[0].style,'h2');
  assert.equal(result[1].children.map((s)=>s.text).join(''),'Hello camp and families.');
  assert.deepEqual(result[1].children.find((s)=>s.text==='camp').marks,['strong']);
  assert.equal(result[1].markDefs[0].customLink.internal._ref,'known-page');
  assert.equal(result[2]._type,'image');
  assert.equal(result[2].alt,'Pool');
  assert.deepEqual(result.filter((b)=>b.listItem).map((b)=>b.level),[1,2]);
  assert.doesNotMatch(JSON.stringify(result),/bad\(\)/);
});

test('destinations reject executable and empty links and preserve fragments',()=>{
  const ctx=context();
  for(const value of ['','#','javascript:alert(1)','https://seasons']) assert.equal(destination(value,ctx),undefined);
  assert.equal(destination('/known#section',ctx).external,'/known#section');
  assert.equal(destination('https://cdn.prod.website-files.com/site/doc.pdf',ctx).kind,'file');
});

test('source variants reuse the complete original and keep alt text per placement',()=>{
  const variant=image.replace('.jpg','-p-500.jpg');
  const aliases=mediaAliases({original:image,variant});
  const ctx=assetCollector(aliases);
  const a=ctx.asset(variant,'image','First');const b=ctx.asset(image,'image','Second');
  assert.equal(a.asset._ref,b.asset._ref);assert.equal(ctx.assets.size,1);
  assert.equal(a.alt,'First');assert.equal(b.alt,'Second');
  assert.equal(mediaAliases({variant}).size,0);
});

const collection={id:'seasons',displayName:'Seasons',fields:[{slug:'name',type:'PlainText'},{slug:'slug',type:'PlainText'}]};
const item=(id,name,extra={})=>({id,fieldData:{name,slug:id},...extra});
test('live and staged records remain independent including archived live records',()=>{
  const snapshot={collections:[{...collection,live:[item('summer','Summer Camp')],staged:[item('summer','Summer Camp',{isArchived:true}),item('winter','School Year')]}]};
  const ctx={...context(),identities:identityMap(snapshot)};
  const result=cmsDocuments(snapshot,ctx);
  assert.deepEqual(result.documents.map((d)=>d._id),['wf-seasons-summer','drafts.wf-seasons-summer','drafts.wf-seasons-winter']);
  assert.equal(result.counts[0].live,1);assert.equal(result.counts[0].draftDocuments,2);
  snapshot.collections[0].staged=[{id:'summer',fieldData:{slug:'summer',name:'Summer Camp'}}];
  assert.equal(cmsDocuments(snapshot,ctx).documents.length,1);
});

test('unknown fields and unresolved references fail before any write',()=>{
  assert.throws(()=>mapItem(collection,{id:'a',fieldData:{unknown:'value'}},context()),/Unmapped field/);
  assert.throws(()=>mapItem({id:'faqs',displayName:'FAQs',fields:[{slug:'category',type:'MultiReference',validations:{collectionId:'missing'}}]},{id:'a',fieldData:{category:['lost']}},context()),/Unresolved reference/);
  assert.throws(()=>buildPlan({version:1,siteId:'673ebf0eedfc15a41bedc0c3',capturedAt:'now'},[]),/completeness/);
});

test('a second plan changes nothing and removes only previously owned documents',()=>{
  const doc={_id:'wf-a',_type:'page',title:'Title'};
  const actual={...doc,_rev:'1',_createdAt:'now',_updatedAt:'now'};
  assert.ok(equal(doc,actual));
  assert.deepEqual(changes([doc],[actual,{_id:'editor'}, {_id:'old'}],['old']),{created:[],changed:[],removed:[{_id:'old'}],unchanged:1});
});

test('writer leaves foreign content untouched and avoids a transaction commit on repeat',async()=>{
  const doc={_id:'wf-a',_type:'page',title:'Title'};let committed=0;
  const client={fetch:async()=>[{...doc,_rev:'1'}],transaction:()=>({serialize:()=>[],commit:async()=>{committed++;}})};
  await assert.rejects(writeDocuments(client,[doc],{ownedIds:[]}),/outside importer ownership/);
  assert.equal((await writeDocuments(client,[doc],{ownedIds:['wf-a']})).unchanged,1);assert.equal(committed,0);
});

test('asset replacement fails on missing mapping',()=>{
  const docs=[{_id:'page',image:{asset:{_ref:'import-asset-abc'}}}];
  assert.throws(()=>materialize(docs,new Map()),/Unresolved/);
  assert.equal(materialize(docs,new Map([['import-asset-abc','image-real']]))[0].image.asset._ref,'image-real');
});

test('target checks reject the source dataset and wrong project name',async()=>{
  await assert.rejects(verifyTarget({config:()=>({projectId:'wrong',dataset:'production'})}));
  await assert.rejects(verifyTarget({config:()=>({projectId:'193h5qm1',dataset:'production'}),projects:{getById:async()=>({displayName:'wrong'})}}),/name/);
});

test('backup must pass export and gzip before writes; private files use restricted permissions',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'webflow-test-'));
  try {
    await assert.rejects(backupDataset(dir,'test',dir,()=>({status:1})),/backup failed/);
    await assert.rejects(backupDataset(dir,'test',dir,(command)=>({status:command==='gzip'?1:0})),/gzip/);
    const file=path.join(dir,'private.json');await savePrivate(file,{safe:true});
    assert.equal((await stat(file)).mode&0o777,0o600);assert.deepEqual(JSON.parse(await readFile(file)),{safe:true});
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('dry run is default and cannot combine with write modes',()=>{
  assert.equal(argumentsFor([]).dryRun,true);
  assert.equal(argumentsFor(['--snapshot','/tmp/source.json']).snapshot,'/tmp/source.json');
  assert.throws(()=>argumentsFor(['--dry-run','--apply']),/write mode/);
  assert.throws(()=>argumentsFor(['--capture','/tmp/source','--apply']),/separate/);
  assert.throws(()=>argumentsFor(['--capture',process.cwd()+'/source.json']),/outside/);
});
