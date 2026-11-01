import {test} from 'node:test'
import assert from 'node:assert/strict'
import {Readable} from 'node:stream'
import {createFileOperations,registerFileOperations,validFileName,recycleScript,FILE_RENAME_PATH,FILE_DELETE_PATH} from '../server/file-operations.js'

const path='D:\\workspace\\outputs\\报告 [终稿] & $(`name`)\' #.docx'
const missing=()=>Object.assign(Error('missing'),{code:'ENOENT'})
const valid={platform:'win32',canonical:async value=>value,inspect:async value=>{if(value===path)return{isFile:()=>true};throw missing()},environment:{SystemRoot:'C:\\Windows',TASK_MARK:'retained'}}

test('rename moves the canonical file within its own folder and returns the new path',async()=>{
 const moves=[],{rename}=createFileOperations({...valid,move:async(...args)=>moves.push(args)})
 assert.equal(await rename(path,'  final.docx  '),'D:\\workspace\\outputs\\final.docx')
 assert.deepEqual(moves,[[path,'D:\\workspace\\outputs\\final.docx']])
})

test('rename refuses unsafe names, an existing sibling and folders without moving anything',async()=>{
 let moves=0;const {rename}=createFileOperations({...valid,move:async()=>moves++})
 for(const name of ['','   ',null,'a/b.docx','a\\b.docx','..','.','report.','report .','CON','nul.txt','COM1.log','what?.docx','x'.repeat(256),'tab\there'])await assert.rejects(rename(path,name))
 assert.throws(()=>validFileName('a:b'),/不能包含/)
 const sibling='D:\\workspace\\outputs\\taken.docx'
 await assert.rejects(createFileOperations({...valid,inspect:async value=>value===path||value===sibling?{isFile:()=>true}:Promise.reject(missing()),move:async()=>moves++}).rename(path,'taken.docx'),/已有同名文件/)
 await assert.rejects(createFileOperations({...valid,inspect:async()=>({isFile:()=>false}),move:async()=>moves++}).rename(path,'x.docx'),/不能处理文件夹/)
 for(const invalid of ['relative.docx','C:relative.docx','\\current-drive.docx','C:\\bad\0.docx'])await assert.rejects(createFileOperations({...valid,move:async()=>moves++}).rename(invalid,'x.docx'),/有效/)
 await assert.rejects(createFileOperations({...valid,platform:'linux',move:async()=>moves++}).rename(path,'x.docx'),/仅支持本机 Windows/)
 assert.equal(moves,0)
})

test('a case-only rename is allowed even though Windows reports the target as existing',async()=>{
 const moves=[];const {rename}=createFileOperations({...valid,inspect:async()=>({isFile:()=>true}),move:async(...args)=>moves.push(args)})
 assert.equal(await rename(path,'报告 [终稿] & $(`NAME`)\' #.DOCX'),'D:\\workspace\\outputs\\报告 [终稿] & $(`NAME`)\' #.DOCX')
 assert.equal(moves.length,1)
 assert.equal(await rename(path,'报告 [终稿] & $(`name`)\' #.docx'),path)
 assert.equal(moves.length,1)
})

test('rename reports locked or missing files plainly',async()=>{
 await assert.rejects(createFileOperations({...valid,move:async()=>{throw Object.assign(Error('busy'),{code:'EBUSY'})}}).rename(path,'x.docx'),/正被占用/)
 await assert.rejects(createFileOperations({...valid,canonical:async()=>{throw missing()}}).rename(path,'x.docx'),/文件不存在/)
})

test('delete sends the canonical file to the Recycle Bin through a hidden process with the path only in the environment',async()=>{
 const calls=[],{recycle}=createFileOperations({...valid,run:async(...args)=>calls.push(args)})
 await recycle(path)
 const [program,args,options]=calls[0]
 assert.equal(program,'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe')
 const source=Buffer.from(args[args.indexOf('-EncodedCommand')+1],'base64').toString('utf16le')
 assert.equal(source,recycleScript)
 assert.match(source,/'SendToRecycleBin'/)
 assert.equal(source.includes(path),false)
 assert.equal(options.env.DSH_UI_RECYCLE_FILE,path);assert.equal(options.env.TASK_MARK,'retained');assert.equal(options.windowsHide,true)
 await assert.rejects(createFileOperations({...valid,inspect:async()=>({isFile:()=>false}),run:async()=>calls.push(1)}).recycle(path),/不能处理文件夹/)
 await assert.rejects(createFileOperations({...valid,run:async()=>{throw Object.assign(Error('x'),{cmd:'powershell'})}}).recycle(path),/移到回收站失败/)
 assert.equal(calls.length,1)
})

test('operations run one at a time and release their lock after failures',async()=>{
 let release,started;const moving=new Promise(resolve=>started=resolve)
 const operations=createFileOperations({...valid,move:()=>new Promise(resolve=>{release=resolve;started()}),run:async()=>{}})
 const first=operations.rename(path,'a.docx')
 await moving
 await assert.rejects(operations.recycle(path),/正在进行/)
 release();await first
 await operations.recycle(path)
})

function fixture(operations){
 const routes=new Map();let disposed=0
 const cleanup=registerFileOperations({inject(keys,fn){assert.deepEqual(keys,['webServer']);return fn({get(){return{register(value){routes.set(value.path,value);return()=>disposed++}}}})}},{operations})
 return{routes,cleanup,get disposed(){return disposed}}
}
async function request(handler,{headers={},body,address='127.0.0.1',localPort}={}){
 const req=Readable.from([Buffer.from(body)])
 Object.assign(req,{method:'POST',headers:{host:'127.0.0.1:65412',origin:'http://127.0.0.1:65412','content-type':'application/json',...headers},socket:{remoteAddress:address,localPort}})
 const response={status:0,headers:{},body:'',setHeader(){},writeHead(status,values){this.status=status;Object.assign(this.headers,values)},end(value){this.body=value||''}}
 await handler(req,response)
 return{...response,json:JSON.parse(response.body)}
}

test('routes perform the operation for local Desktop and same-origin requests and reject remote ones',async()=>{
 const calls=[],state=fixture({rename:async(file,name)=>{calls.push(['rename',file,name]);return 'D:\\x\\new.docx'},recycle:async file=>{calls.push(['recycle',file])}})
 const {routes,cleanup}=state
 assert.deepEqual([...routes.keys()],[FILE_RENAME_PATH,FILE_DELETE_PATH])
 const renamed=await request(routes.get(FILE_RENAME_PATH).handler,{body:JSON.stringify({path,name:'new.docx'})})
 assert.equal(renamed.status,200);assert.deepEqual(renamed.json,{ok:true,path:'D:\\x\\new.docx'})
 const desktop=await request(routes.get(FILE_DELETE_PATH).handler,{localPort:65412,headers:{origin:undefined},body:JSON.stringify({path})})
 assert.equal(desktop.status,200);assert.deepEqual(desktop.json,{ok:true})
 for(const options of [{address:'192.0.2.1'},{headers:{origin:'https://example.invalid'}},{localPort:65412,headers:{host:'localhost:8442',origin:undefined}}])
  assert.equal((await request(routes.get(FILE_DELETE_PATH).handler,{...options,body:JSON.stringify({path})})).status,403)
 assert.equal((await request(routes.get(FILE_RENAME_PATH).handler,{body:'{'})).status,400)
 assert.deepEqual(calls,[['rename',path,'new.docx'],['recycle',path]])
 cleanup();assert.equal(state.disposed,2)
 const closed=await request(routes.get(FILE_DELETE_PATH).handler,{body:JSON.stringify({path})})
 assert.equal(closed.status,503);assert.equal(calls.length,2)
})

test('operation errors become JSON messages',async()=>{
 const {routes}=fixture({rename:async()=>{throw Error('同一位置已有同名文件，请换一个名称。')},recycle:async()=>{}})
 const response=await request(routes.get(FILE_RENAME_PATH).handler,{body:JSON.stringify({path,name:'x'})})
 assert.equal(response.status,400);assert.deepEqual(response.json,{ok:false,message:'同一位置已有同名文件，请换一个名称。'})
})
