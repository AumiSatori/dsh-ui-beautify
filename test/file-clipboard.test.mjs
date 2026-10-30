import {test} from 'node:test'
import assert from 'node:assert/strict'
import {Readable} from 'node:stream'
import {createServer} from 'node:http'
import {createFileClipboard,registerFileClipboard,FILE_CLIPBOARD_PATH,fileClipboardScript} from '../server/file-clipboard.js'

const path='D:\\workspace\\outputs\\报告 [终稿] & $(`name`)\' #.docx'
const valid={platform:'win32',canonical:async value=>value,inspect:async()=>({isFile:()=>true}),environment:{SystemRoot:'C:\\Windows',TASK_MARK:'retained'}}

test('native copy uses CF_HDROP, explicit copy effect and a hidden bounded STA process with the path only in the environment',async()=>{
 const calls=[],copy=createFileClipboard({...valid,run:async(...args)=>calls.push(args)})
 await copy(path)
 assert.equal(calls.length,1)
 const [program,args,options]=calls[0]
 assert.equal(program,'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe')
 assert.ok(args.includes('-STA'));assert.ok(args.includes('-NonInteractive'));assert.ok(args.includes('-NoProfile'))
 const source=Buffer.from(args[args.indexOf('-EncodedCommand')+1],'base64').toString('utf16le')
 assert.equal(source,fileClipboardScript)
 assert.match(source,/SetFileDropList\(\$files\)/)
 assert.match(source,/Preferred DropEffect', \$false, \$effect/)
 assert.match(source,/\[byte\[\]\]@\(1,0,0,0\)/)
 assert.match(source,/SetDataObject\(\$data, \$true, 5, 100\)/)
 assert.equal(source.includes(path),false)
 assert.equal(options.env.DSH_UI_COPY_FILE,path);assert.equal(options.env.TASK_MARK,'retained')
 assert.equal(options.windowsHide,true);assert.equal(options.timeout,10000);assert.equal(options.maxBuffer,65536)
})

test('native copy validates the platform, fully qualified path, canonical file and directory boundary before starting a process',async()=>{
 let calls=0
 const copy=createFileClipboard({...valid,run:async()=>calls++})
 for(const invalid of ['',null,'relative.docx','C:relative.docx','/current-drive.docx','\\current-drive.docx','C:\\bad\0.docx','C:\\'+ 'x'.repeat(32768)])await assert.rejects(copy(invalid),/有效/)
 await assert.rejects(createFileClipboard({...valid,platform:'linux',run:async()=>calls++})(path),/仅支持本机 Windows/)
 await assert.rejects(createFileClipboard({...valid,inspect:async()=>({isFile:()=>false}),run:async()=>calls++})(path),/不能复制文件夹/)
 assert.equal(calls,0)
 const canonical='D:\\resolved\\report.docx'
 await createFileClipboard({...valid,canonical:async()=>canonical,inspect:async value=>{assert.equal(value,canonical);return{isFile:()=>true}},run:async(_p,_a,options)=>assert.equal(options.env.DSH_UI_COPY_FILE,canonical)})(path)
})

test('a failed native copy releases its lock and reports a useful error without process output',async()=>{
 let count=0,resolve
 const copy=createFileClipboard({...valid,run:()=>++count===1?new Promise(done=>{resolve=done}):Promise.reject(Object.assign(Error('private process output'),{killed:true}))})
 const first=copy(path)
 await new Promise(done=>setImmediate(done))
 await assert.rejects(copy(path),/另一个文件正在复制/)
 resolve();await first
 await assert.rejects(copy(path),/剪贴板可能被占用/)
 await assert.rejects(copy(path),/剪贴板可能被占用/)
 assert.equal(count,3)
 for(const [code,message] of [['ENOENT',/文件不存在/],['EPERM',/没有权限/],['EACCES',/没有权限/]]){
  await assert.rejects(createFileClipboard({...valid,canonical:async()=>{throw Object.assign(Error('private path'),{code})}})(path),message)
 }
})

function fixture(copy=async()=>{},objectDisposer=false){
 let route,disposed=0
 const cleanup=registerFileClipboard({inject(keys,fn){assert.deepEqual(keys,['webServer']);return fn({get(name){assert.equal(name,'webServer');return{register(value){route=value;return objectDisposer?{dispose(){disposed++}}:()=>disposed++}}}})}},{copy})
 assert.equal(route.kind,'exact');assert.equal(route.path,FILE_CLIPBOARD_PATH)
 return{handler:route.handler,cleanup,get disposed(){return disposed}}
}
async function request(handler,{method='POST',address='127.0.0.1',headers={},body=JSON.stringify({path}),chunks}={}){
 const req=Readable.from(chunks||[Buffer.from(body)])
 Object.assign(req,{method,headers:{host:'127.0.0.1:65412',origin:'http://127.0.0.1:65412','content-type':'application/json',...headers},socket:{remoteAddress:address}})
 const response={status:0,headers:{},body:'',setHeader(name,value){this.headers[name.toLowerCase()]=value},writeHead(status,values){this.status=status;Object.assign(this.headers,values)},end(value){this.body=value||''}}
 await handler(req,response)
 response.json=JSON.parse(response.body)
 return response
}

test('the local route accepts a same-origin browser and Desktop origin and sends exactly the selected path',async()=>{
 const copied=[],{handler}=fixture(async value=>copied.push(value))
 for(const options of [{},{address:'::1',headers:{host:'[::1]:65412',origin:'http://[::1]:65412'}},{address:'::ffff:127.0.0.1',headers:{origin:'dsh-app://app'}},{headers:{host:'localhost:65412',origin:'http://localhost:65412'}},{headers:{origin:undefined,'sec-fetch-site':'same-origin'}}]){
  const response=await request(handler,options)
  assert.equal(response.status,200);assert.deepEqual(response.json,{ok:true})
  assert.equal(response.headers['cache-control'],'no-store')
 }
 assert.deepEqual(copied,Array(5).fill(path))
})

test('the local route rejects LAN clients, cross-site requests, foreign origins, changed ports and missing browser origin evidence',async()=>{
 let calls=0;const {handler}=fixture(async()=>calls++)
 for(const options of [
  {address:'192.0.2.1'},
  {headers:{origin:'dsh-app://app','sec-fetch-site':'cross-site'}},
  {headers:{origin:'https://example.invalid'}},
  {headers:{host:'example.invalid',origin:'http://example.invalid'}},
  {headers:{origin:'http://127.0.0.1:9999'}},
  {headers:{origin:'null'}},
  {headers:{origin:undefined}},
  {headers:{origin:'file://app'}},
 ])assert.equal((await request(handler,options)).status,403)
 assert.equal(calls,0)
})

test('the route rejects invalid methods, formats, oversized JSON and missing paths without copying',async()=>{
 let calls=0;const {handler}=fixture(async()=>calls++)
 for(const [options,status] of [
  [{method:'GET'},405],
  [{headers:{'content-type':'text/plain'}},415],
  [{body:'{broken'},400],
  [{body:'null'},400],
  [{body:JSON.stringify({path:42})},400],
  [{chunks:[Buffer.alloc(65530),Buffer.alloc(20)]},413],
 ]){
  const response=await request(handler,options)
  assert.equal(response.status,status);assert.equal(response.json.ok,false)
  if(status===405)assert.equal(response.headers.allow,'POST')
 }
 assert.equal(calls,0)
})

test('route copy errors remain errors, and disposal removes registration and prevents later work',async()=>{
 const service=fixture(async()=>{throw Error('剪贴板被占用')},true)
 const response=await request(service.handler)
 assert.equal(response.status,400);assert.deepEqual(response.json,{ok:false,message:'剪贴板被占用'})
 service.cleanup();assert.equal(service.disposed,1)
 assert.equal((await request(service.handler)).status,503)
 let finish
 const pending=fixture(async()=>{})
 const req=Readable.from((async function*(){await new Promise(done=>finish=done);yield Buffer.from(JSON.stringify({path}))})())
 Object.assign(req,{method:'POST',headers:{host:'127.0.0.1',origin:'dsh-app://app','content-type':'application/json'},socket:{remoteAddress:'127.0.0.1'}})
 let status;const task=pending.handler(req,{writeHead(code){status=code},end(){}})
 await new Promise(done=>setImmediate(done));pending.cleanup();finish();await task
 assert.equal(status,503)
 assert.equal(registerFileClipboard({}),undefined)
})

test('an oversized real HTTP request receives JSON 413 without a socket reset',async t=>{
 let calls=0;const service=fixture(async()=>calls++)
 const server=createServer(service.handler)
 await new Promise(done=>server.listen(0,'127.0.0.1',done))
 t.after(()=>new Promise(done=>{server.closeAllConnections();server.close(done)}))
 const origin=`http://127.0.0.1:${server.address().port}`
 const response=await fetch(origin+FILE_CLIPBOARD_PATH,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({path:'C:\\'+'x'.repeat(70000)})})
 assert.equal(response.status,413);assert.equal((await response.json()).ok,false);assert.equal(calls,0)
})
