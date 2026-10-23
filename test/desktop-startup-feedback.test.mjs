import assert from 'node:assert/strict'
import {test} from 'node:test'
import {createHash} from 'node:crypto'
import {runInNewContext} from 'node:vm'
import {patchStartupFeedback,replacementHeader} from '../scripts/desktop-startup-feedback.mjs'

const source='const createMainWindow = () => { const window = createWindow(appPreload, false, true); return window; }; function focus() { if (window === mainWindow && !enteredWorkspace) return; window.show(); window.focus(); }'
test('startup feedback shows the native loading window and allows activation without changing archive entry length',()=>{
  const patched=patchStartupFeedback(source)
  assert.equal(Buffer.byteLength(patched),Buffer.byteLength(source))
  assert.match(patched,/createWindow\(appPreload, true , true\)/)
  assert.doesNotMatch(patched,/!enteredWorkspace/)
  const calls=[],window={show:()=>calls.push('show'),focus:()=>calls.push('focus')}
  runInNewContext(patched+'; createMainWindow(); focus();',{appPreload:'preload',enteredWorkspace:false,window,mainWindow:window,createWindow:(_preload,visible,primary)=>{calls.push({visible,primary});return window}})
  assert.deepEqual(calls,[{visible:true,primary:true},'show','focus'],'The loading window is visible and a repeated activation reaches the native show/focus handlers')
  assert.equal(patchStartupFeedback(patched),patched)
  assert.throws(()=>patchStartupFeedback(source+source),/anchor changed/)
  assert.throws(()=>patchStartupFeedback(source.replace('appPreload','anotherPreload')),/anchor changed/)
})
test('archive metadata updates only the main entry hashes and preserves all entry offsets and sizes',()=>{
  const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),bytes=Buffer.from(source)
  const header={files:{lib:{files:{'main.js':{offset:'512',size:bytes.length,integrity:{algorithm:'SHA256',hash:sha(bytes),blockSize:1024,blocks:[sha(bytes)]}},'other.js':{offset:'4096',size:80}}}}}
  const record={header,json:Buffer.from(JSON.stringify(header))},nextBytes=Buffer.from(patchStartupFeedback(source)),next=JSON.parse(replacementHeader(record,nextBytes))
  assert.equal(next.files.lib.files['main.js'].offset,'512')
  assert.equal(next.files.lib.files['main.js'].size,bytes.length)
  assert.equal(next.files.lib.files['main.js'].integrity.hash,sha(nextBytes))
  assert.deepEqual(next.files.lib.files['other.js'],header.files.lib.files['other.js'])
  assert.notEqual(next.files.lib.files['main.js'].integrity.hash,header.files.lib.files['main.js'].integrity.hash)
})
