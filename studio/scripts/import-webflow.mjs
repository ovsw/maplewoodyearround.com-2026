#!/usr/bin/env node
import { readFile, mkdir, open, unlink } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';
import { parseEnv } from 'node:util';
import { pathToFileURL } from 'node:url';
import { createClient } from '@sanity/client';
import { captureSource } from './webflow/source.mjs';
import { buildPlan } from './webflow/plan.mjs';
import { verifyTarget, backupDataset } from './lib/dataset-safety.mjs';
import { readManifest, importAssets, materialize, writeDocuments, verifyImport, savePrivate } from './webflow/write.mjs';

const studioDirectory=path.resolve(import.meta.dirname,'..');
const repository=path.resolve(studioDirectory,'..');
const privateRoot=path.join(homedir(),'backups/mdc/webflow-import');

export function argumentsFor(args) {
  const options={apply:false,dryRun:true};
  for(let i=0;i<args.length;i++) {
    if(args[i]==='--apply'){options.apply=true;options.dryRun=false;}
    else if(args[i]==='--dry-run')options.explicitDryRun=true;
    else if(['--snapshot','--capture'].includes(args[i])) {
      if(!args[i+1]||args[i+1].startsWith('--'))throw new Error('A snapshot filename is required');
      options[args[i].slice(2)]=path.resolve(args[++i]);
    }else throw new Error('Usage: import-webflow.mjs [--dry-run | --apply] [--snapshot private-file] [--capture private-file]');
  }
  if(options.explicitDryRun&&(options.apply||options.capture))throw new Error('--dry-run cannot be combined with a write mode');
  if(options.capture&&(options.apply||options.snapshot))throw new Error('--capture is a separate read-only-source operation');
  if(options.capture&&(options.capture===repository||options.capture.startsWith(repository+path.sep)))throw new Error('Raw snapshots must stay outside the repository');
  return options;
}

function environment() {
  const read=(filename)=>{try{return parseEnv(readFileSync(filename,'utf8'));}catch(error){if(error.code==='ENOENT')return {};throw error;}};
  const local=read(path.join(studioDirectory,'.env.local'));
  const privateValues=read(path.join(homedir(),'.config/ovs/secrets.env'));
  return {...privateValues,...local,...process.env};
}

export async function main(args=process.argv.slice(2)) {
  const options=argumentsFor(args);
  const env=environment();
  const snapshot=options.snapshot?JSON.parse(await readFile(options.snapshot,'utf8')):await captureSource(env.WEBFLOW_API_TOKEN,JSON.parse(await readFile(path.join(repository,'docs/migration/public-source-evidence.json'),'utf8')).pages,{progress:(summary)=>console.log(JSON.stringify(summary))});
  if(options.capture){await savePrivate(options.capture,snapshot);console.log('Complete source snapshot saved outside the repository.');return;}
  const plan=buildPlan(snapshot,JSON.parse(await readFile(path.join(studioDirectory,'schema.json'),'utf8')));
  const summary={collections:plan.counts.map(({prefix,...count})=>count),documents:plan.documents.length,mediaSources:plan.assets.length,mediaAliases:plan.assets.reduce((sum,a)=>sum+(a.aliases?.length??0),0),staticSections:plan.coverage.length,staticTextNodes:plan.coverage.reduce((sum,c)=>sum+c.textNodes,0),coveredStaticTextNodes:plan.coverage.reduce((sum,c)=>sum+c.covered,0),gaps:plan.gaps.map(({missing,...gap})=>({...gap,...(missing?{missingTextCount:missing.length}:{})})),warnings:plan.warnings,sourceRouteChanges:plan.missingRoutes};
  console.log(JSON.stringify({mode:options.apply?'apply':'dry-run',...summary},null,2));
  if(plan.gaps.length)throw new Error('Source content does not fit the import model; resolve reported gaps before writing');
  if(!options.apply)return summary;
  const client=createClient({projectId:env.SANITY_STUDIO_PROJECT_ID,dataset:env.SANITY_STUDIO_DATASET,token:env.SANITY_AUTH_TOKEN,apiVersion:'2026-03-23',useCdn:false,perspective:'raw'});
  console.log(JSON.stringify({target:await verifyTarget(client)}));
  await mkdir(privateRoot,{recursive:true,mode:0o700});
  const lockPath=path.join(privateRoot,'import.lock');
  const lock=await open(lockPath,'wx',0o600).catch(()=>{throw new Error('An import lock exists; verify the previous import has stopped before removing its lock');});
  try {
    await lock.writeFile(String(process.pid));
    const backup=await backupDataset({studioDirectory,token:env.SANITY_AUTH_TOKEN,root:path.join(homedir(),'backups/mdc'),label:'webflow-import'});
    console.log('Timestamped dataset backup passed gzip verification.');
    const manifestPath=path.join(privateRoot,'manifest.json');
    const manifest=await readManifest(manifestPath);
    const stamp=new Date().toISOString().replaceAll(':','-');
    await savePrivate(path.join(privateRoot,`${stamp}-source.json`),snapshot);
    const media=await importAssets(client,plan.assets,manifest,(progress)=>console.log(JSON.stringify(progress)),(state)=>savePrivate(manifestPath,state));
    await savePrivate(manifestPath,manifest);
    const documents=materialize(plan.documents,media.refs);
    const delta=await writeDocuments(client,documents,manifest);
    await savePrivate(manifestPath,manifest);
    const verification=await verifyImport(client,documents,plan.counts,manifest);
    const report={...summary,...delta,uploadedAssets:media.uploaded,reusedAssets:media.reused,...verification,backup,finishedAt:new Date().toISOString()};
    await savePrivate(path.join(privateRoot,`${stamp}-result.json`),report);
    console.log(JSON.stringify({...report,backup:'verified private backup'},null,2));
    return report;
  }finally{await lock.close();await unlink(lockPath);}
}

if(import.meta.url===pathToFileURL(process.argv[1]??'').href)main().catch((error)=>{console.error(error.message);process.exitCode=1;});
