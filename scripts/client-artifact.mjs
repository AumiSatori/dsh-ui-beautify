import {readFile,writeFile,open,rename,unlink} from 'node:fs/promises'
import {dirname,basename,join,resolve} from 'node:path'
import {randomUUID,createHash} from 'node:crypto'
import vm from 'node:vm'
import {setTimeout as delay} from 'node:timers/promises'

export const BUNDLE_START='    /* DCB_LENS_BUNDLE_START */'
export const BUNDLE_END='    /* DCB_LENS_BUNDLE_END */'
export function splitClientArtifact(source){
  const start=source.indexOf(BUNDLE_START),end=source.indexOf(BUNDLE_END)
  if(start<0||end<=start||source.indexOf(BUNDLE_START,start+1)>=0||source.indexOf(BUNDLE_END,end+1)>=0)throw Error('Client bundle markers must occur exactly once')
  return {prefix:source.slice(0,start),bundle:source.slice(start+BUNDLE_START.length,end),suffix:source.slice(end+BUNDLE_END.length)}
}
export function validateClientArtifact(source){
  // Syntax alone cannot catch a new constructor paired with an older bundle.
  // Evaluate only the self-contained build in a bounded VM, never apply a UI.
  new vm.Script(source,{filename:'client.js'})
  const parts=splitClientArtifact(source),context=vm.createContext({}, {codeGeneration:{strings:false,wasm:false}})
  const api=new vm.Script(parts.bundle+'\n;DcbLens',{filename:'client-bundle.js'}).runInContext(context,{timeout:3000})
  if(!api||typeof api!=='object')throw Error('Client bundle did not expose DcbLens')
  const missing=new Set(),used=new Set(),outside=parts.prefix+parts.suffix
  for(const match of outside.matchAll(/\bDcbLens\.([\w$]+)(\s*\()?/g)){
    const [,name,call]=match;used.add(name)
    if(!Object.hasOwn(api,name)||call&&typeof api[name]!=='function')missing.add(name)
  }
  if(missing.size)throw Error(`Client bundle is incomplete; missing exports: ${[...missing].join(', ')}`)
  return {used:[...used].sort(),exports:Object.keys(api).sort(),sha256:createHash('sha256').update(source).digest('hex')}
}
export function composeClientArtifact(template,bundle){
  const {prefix,suffix}=splitClientArtifact(template)
  const next=prefix+BUNDLE_START+'\n    '+bundle.trim()+'\n'+BUNDLE_END+suffix
  validateClientArtifact(next);return next
}
export async function assertUnchanged(snapshots){
  for(const [path,expected]of snapshots){
    let actual;try{actual=await readFile(path)}catch{throw Error('Build input changed or disappeared: '+path)}
    if(!actual.equals(Buffer.isBuffer(expected)?expected:Buffer.from(expected)))throw Error('Concurrent change; preserving newer file: '+path)
  }
}
export async function withClientArtifactLock(client,run){
  const lock=join(dirname(client),'.client-artifact.lock'),identity=randomUUID();let handle
  try{handle=await open(lock,'wx')}catch(error){if(error.code==='EEXIST')throw Error('Another client build/publish holds '+lock);throw error}
  try{await handle.writeFile(JSON.stringify({pid:process.pid,identity,startedAt:new Date().toISOString()})+'\n');return await run()}
  finally{await handle.close();const current=JSON.parse(await readFile(lock,'utf8'));if(current.identity===identity)await unlink(lock)}
}
export async function publishClientArtifact(client,next,{expected,snapshots=new Map()}={}){
  client=resolve(client);validateClientArtifact(next)
  if(expected===undefined)expected=await readFile(client,'utf8')
  const inputs=new Map(snapshots);inputs.set(client,expected)
  await assertUnchanged(inputs)
  if(next===expected)return {changed:false}
  const id=randomUUID(),temp=join(dirname(client),`.${basename(client)}.${id}.tmp`),backup=client+'.bak-'+id
  let created=false
  try{
    // Backup the complete old artifact; publication replaces one directory entry.
    await writeFile(backup,expected,{flag:'wx'})
    const staged=await open(temp,'wx');created=true
    try{await staged.writeFile(next);await staged.sync()}finally{await staged.close()}
    await assertUnchanged(inputs)
    // No unlink/truncate fallback: a denied rename must leave the old client intact.
    // Windows can briefly deny replacement while the host/virus scanner reads
    // the old file. Retry without truncating it and recheck concurrent edits.
    for(let attempt=0;;attempt++){
      await assertUnchanged(inputs)
      try{await rename(temp,client);break}
      catch(error){if(!['EPERM','EACCES','EBUSY'].includes(error.code)||attempt>=8)throw error;await delay(25*(attempt+1))}
    }
    created=false
    return {changed:true,backup,sha256:createHash('sha256').update(next).digest('hex')}
  }finally{if(created)await unlink(temp)}
}
