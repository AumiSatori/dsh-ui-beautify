import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,mkdir,writeFile,readFile,readdir,unlink,rmdir} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {BUNDLE_START,BUNDLE_END,composeClientArtifact,validateClientArtifact,publishClientArtifact,withClientArtifactLock} from '../scripts/client-artifact.mjs'
const artifact=(bundle='var DcbLens={start(){},css:""}',outside='DcbLens.start();')=>`window.__ModuleLoader__.load({factory:()=>{\n${BUNDLE_START}\n${bundle}\n${BUNDLE_END}\n${outside}\n}})`
test('startup contract rejects new constructors paired with an older bundle before publication',()=>{
 assert.ok(validateClientArtifact(artifact()).used.includes('start'))
 assert.throws(()=>validateClientArtifact(artifact(undefined,'DcbLens.createChatDisclosureMotion(document,window)')),/missing exports: createChatDisclosureMotion/)
 assert.throws(()=>validateClientArtifact(artifact('var DcbLens={start:true}','DcbLens.start()')),/missing exports: start/)
 assert.throws(()=>validateClientArtifact(artifact()+'\ninvalid syntax !'))
 assert.throws(()=>validateClientArtifact(artifact().replace(BUNDLE_END,'')),/markers/)
})
test('staged template composes a complete matching artifact while preserving all outer changes',()=>{
 const draft=artifact(undefined,'// an unrelated change\nDcbLens.createChatDisclosureMotion(document,window)')
 const output=composeClientArtifact(draft,'var DcbLens={createChatDisclosureMotion(){}}')
 assert.ok(output.endsWith('// an unrelated change\nDcbLens.createChatDisclosureMotion(document,window)\n}})'))
 assert.deepEqual(validateClientArtifact(output).used,['createChatDisclosureMotion'])
})
async function fixture(t){
 const parent=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||fileURLToPath(new URL('../../boot-fix-qa',import.meta.url)));await mkdir(parent,{recursive:true})
 const directory=await mkdtemp(join(parent,'artifact-test-')),client=join(directory,'client.js');await writeFile(client,artifact())
 t.after(async()=>{assert.equal(resolve(directory).startsWith(join(parent,'artifact-test-')),true);for(const file of await readdir(directory))await unlink(join(directory,file));await rmdir(directory)})
 return {directory,client}
}
test('atomic publication preserves old bytes as backup and readers see only complete files',async t=>{
 const {directory,client}=await fixture(t),before=await readFile(client,'utf8'),next=artifact('var DcbLens={start(){},css:"new"}')
 let sampling=true;const seen=[]
 const reader=(async()=>{while(sampling){seen.push(await readFile(client,'utf8'));await new Promise(resolve=>setImmediate(resolve))}})()
 let result
 try{result=await withClientArtifactLock(client,()=>publishClientArtifact(client,next,{expected:before}))}finally{sampling=false;await reader}
 assert.equal(await readFile(client,'utf8'),next);assert.equal(await readFile(result.backup,'utf8'),before);assert.ok(seen.every(text=>text===before||text===next));assert.ok(seen.length>0)
 assert.ok((await readdir(directory)).every(file=>!file.endsWith('.tmp')&&!file.endsWith('.lock')))
 assert.equal((await publishClientArtifact(client,next,{expected:next})).changed,false)
})
test('invalid or concurrently edited files remain untouched; another publisher is refused',async t=>{
 const {directory,client}=await fixture(t),before=await readFile(client,'utf8'),next=artifact('var DcbLens={start(){},css:"next"}'),input=join(directory,'source.js')
 await assert.rejects(()=>publishClientArtifact(client,artifact(undefined,'DcbLens.missing()'),{expected:before}),/missing/);assert.equal(await readFile(client,'utf8'),before)
 await writeFile(client,before+'\n// another task')
 await assert.rejects(()=>publishClientArtifact(client,next,{expected:before}),/Concurrent change/);assert.equal(await readFile(client,'utf8'),before+'\n// another task')
 await writeFile(input,'newer source')
 await assert.rejects(()=>publishClientArtifact(client,next,{expected:before+'\n// another task',snapshots:new Map([[input,'old source']])}),/Concurrent change/)
 await withClientArtifactLock(client,async()=>{await assert.rejects(()=>withClientArtifactLock(client,()=>{}),/Another client build/)});assert.equal(await readFile(client,'utf8'),before+'\n// another task')
})
