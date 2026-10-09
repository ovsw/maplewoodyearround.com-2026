import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { webflowReader } from './source.mjs';
import { assetCollector, destination, portableText, htmlDocument } from './html.mjs';
import { parentDashboard, staticTextNodes } from './pages.mjs';
import { cmsDocuments, identityMap, mapItem } from './collections.mjs';
import { mediaAliases, buildPlan, assertPublicPageCoverage } from './plan.mjs';
import { changes, equal, materialize, writeDocuments, savePrivate } from './write.mjs';
import { verifyTarget, backupDataset } from '../lib/dataset-safety.mjs';
import { argumentsFor } from '../import-webflow.mjs';

const context = () => ({ ...assetCollector(), routes:new Map([['/known','known-page']]), warnings:new Set(), identities:new Map() });
const image = 'https://cdn.prod.website-files.com/site/image.jpg';

test('coverage includes prose surrounding inline elements, not just leaf elements',()=>{
  assert.deepEqual(staticTextNodes(htmlDocument('<p>Before <strong>inside</strong> after.</p>').body),['Before','inside','after.']);
});

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
  assert.equal((await writeDocuments(client,[doc],{ownedIds:['wf-a'],documentRevisions:{'wf-a':'1'}})).unchanged,1);assert.equal(committed,0);
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
    await assert.rejects(backupDataset({studioDirectory:path.join(dir,'repo','studio'),token:'test',root:path.join(dir,'backups'),label:'test',run:()=>({status:1})}),/backup failed/);
    await assert.rejects(backupDataset({studioDirectory:path.join(dir,'repo','studio'),token:'test',root:path.join(dir,'backups'),label:'test',run:(command)=>({status:command==='gzip'?1:0})}),/gzip/);
    await assert.rejects(backupDataset({studioDirectory:path.join(dir,'repo','studio'),token:'test',root:path.join(dir,'repo','backups'),label:'test',run:()=>({status:0})}),/outside the repository/);
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


test('published static pages must be captured; only source system routes are exempt',()=>{
  const page={publishedPath:'/new-page',draft:false,archived:false};
  assert.throws(()=>assertPublicPageCoverage({pages:[],pageRecords:[page]}),/published source page/);
  assert.throws(()=>assertPublicPageCoverage({pages:[{path:'/new-page',status:404}],pageRecords:[page]}),/published source page/);
  assertPublicPageCoverage({pages:[{path:'/new-page',status:200}],pageRecords:[page]});
  assertPublicPageCoverage({pages:[],pageRecords:[{...page,draft:true},{...page,archived:true},{...page,collectionId:'cms'},{...page,publishedPath:'/401'},{...page,publishedPath:'/404'}]});
});

test('writer refuses editor changes, deletions, and missing revision history before transactions',async()=>{
  const doc={_id:'drafts.wf-a',_type:'page',title:'Editor change',_rev:'editor-rev'};
  const client={fetch:async()=>[doc],transaction:()=>{throw new Error('Must not start transaction');}};
  const manifest={ownedIds:[doc._id],documentRevisions:{[doc._id]:'import-rev'}};
  await assert.rejects(writeDocuments(client,[{...doc,title:'Source change'}],manifest),/edited or removed/);
  await assert.rejects(writeDocuments(client,[],manifest),/edited or removed/);
  await assert.rejects(writeDocuments(client,[doc],{ownedIds:[doc._id]}),/no recorded revision/);
  await assert.rejects(writeDocuments({...client,fetch:async()=>[]},[doc],manifest),/edited or removed/);
});

test('writer records transaction revisions and guards a later source update',async()=>{
  const source={_id:'wf-a',_type:'page',title:'Source'};let current=[];let guarded;
  const manifest={ownedIds:[],assets:{}};
  const transaction={create(){return this;},patch(id,callback){callback({ifRevisionId(rev){guarded=rev;return this;},set(){return this;},unset(){return this;}});return this;},serialize:()=>[],commit:async(options)=>{assert.equal(options.returnDocuments,true);current=[{...source,_rev:current.length?'import-2':'import-1'}];return current;}};
  const client={fetch:async()=>current,transaction:()=>transaction};
  assert.equal((await writeDocuments(client,[source],manifest)).created,1);
  assert.equal(manifest.documentRevisions['wf-a'],'import-1');
  assert.equal((await writeDocuments(client,[{...source,title:'Updated source'}],manifest)).changed,1);
  assert.equal(guarded,'import-1');assert.equal(manifest.documentRevisions['wf-a'],'import-2');
});

test('source asset URLs fail before even fetching target documents',async()=>{
  const client={fetch:async()=>{throw new Error('Must not fetch');}};
  for(const url of ['https://cdn.prod.website-files.com/site/missed.jpg','https://s3.amazonaws.com/webflow-prod-assets/site/missed.pdf']) {
    await assert.rejects(writeDocuments(client,[{_id:'page',link:url}],{ownedIds:[]}),/Webflow asset URL remains/);
  }
});

test('dashboard cards split by season, keep order, and match the shown link by exact heading',()=>{
  const pdf='https://cdn.prod.website-files.com/site/packing-list.pdf';
  const card=(id,name,order,season,extra={})=>({id,fieldData:{name,order,season,live:true,'link-text':'Visit Page','color-theme':'Green',...extra}});
  const snapshot={collections:[
    {displayName:'Seasons',live:[{id:'sy',fieldData:{name:'School Year'}},{id:'sc',fieldData:{name:'Summer Camp'}}]},
    {displayName:'Parent Dashboard Cards',live:[
      card('packing','Packing List',2,['sc'],{'use-link':true,'link-url':pdf,'use-attachment':true,attachment:{url:'https://cdn.prod.website-files.com/site/old.pdf'}}),
      card('vacation','Vacation Camp Packing List & Forms',1,['sc','sy'],{'use-attachment':true}),
      card('gift','Gift Card',3,['sy','sc'],{'use-link':true,'link-url':'https://shop.example/gift'}),
      card('hidden','Hidden',0,['sc'],{live:false,'use-link':true,'link-url':'https://example.test'}),
    ]},
  ]};
  const main=htmlDocument(`<main><section class="section_layout398"><div class="text-align-center"><div class="text-style-tagline">Maplewood</div><h2>Parent Dashboard</h2><p>Intro</p><p>Select <a href="/known">Season</a>:</p></div>
    <a data-w-tab="School Year">School Year</a><a data-w-tab="Summer Camp">Summer Camp</a>
    <div class="w-dyn-item"><h3>Vacation Camp Packing List &amp; Forms</h3><a href="#">Visit Page</a></div>
    <div class="w-dyn-item"><h3>Packing List</h3><a href="${pdf}">Download PDF</a></div></section></main>`).querySelector('main');
  const dashboard=parentDashboard(snapshot,context(),main,{title:'Parent Dashboard | Maplewood'});
  assert.deepEqual(dashboard.summerCampCards.map((c)=>c.title),['Vacation Camp Packing List & Forms','Packing List','Gift Card']);
  assert.deepEqual(dashboard.schoolYearCards.map((c)=>c.title),['Vacation Camp Packing List & Forms','Gift Card']);
  assert.equal(dashboard.summerCampCards[0].link.destination,undefined);
  assert.equal(dashboard.summerCampCards[1].link.destination.kind,'file');
  assert.equal(dashboard.summerCampCards[1].accent,'green');
  assert.equal(dashboard.title,'Parent Dashboard');
  assert.equal(dashboard.tabsPrompt[0].markDefs[0].customLink.internal._ref,'known-page');
});
