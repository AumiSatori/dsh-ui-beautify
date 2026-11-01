import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {realpath,rename,stat} from 'node:fs/promises'
import {win32} from 'node:path'
import {localRequest} from './file-clipboard.js'

const execute=promisify(execFile)
export const FILE_RENAME_PATH='/dsh-ui-beautify/rename-file'
export const FILE_DELETE_PATH='/dsh-ui-beautify/delete-file'
// Deletion always goes through the Recycle Bin so it can be undone from Explorer.
export const recycleScript=`
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName Microsoft.VisualBasic
[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($env:DSH_UI_RECYCLE_FILE, 'OnlyErrorDialogs', 'SendToRecycleBin')
`
const RESERVED=/^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\..*)?$/i

export function validFileName(value){
 if(typeof value!=='string')throw Error('请输入新的文件名。')
 const name=value.trim()
 if(!name)throw Error('请输入新的文件名。')
 if(name.length>255)throw Error('文件名太长。')
 if(/[\\/:*?"<>|\x00-\x1f]/.test(name))throw Error('文件名不能包含 \\ / : * ? " < > | 等字符。')
 if(/^\.+$/.test(name)||/[. ]$/.test(name))throw Error('文件名不能以点或空格结尾。')
 if(RESERVED.test(name))throw Error('这是 Windows 保留的名称，请换一个。')
 return name
}

function localFile(path){
 if(typeof path!=='string'||!win32.isAbsolute(path)||! /^(?:[a-z]:[\\/]|\\\\[^\\]+\\[^\\]+)/i.test(path)||path.includes('\0')||path.length>32767)throw Error('请选择有效的本机文件。')
 return path
}

function fileError(error){
 if(error.code==='ENOENT')return Error('文件不存在，可能已被移动或删除。')
 if(error.code==='EACCES'||error.code==='EPERM'||error.code==='EBUSY')return Error('文件正被占用或没有权限，请关闭使用它的程序后重试。')
 return error
}

export function createFileOperations({platform=process.platform,canonical=realpath,inspect=stat,move=rename,run=execute,environment=process.env}={}){
 let busy=false
 const exclusive=async work=>{
  if(platform!=='win32')throw Error('文件操作目前仅支持本机 Windows。')
  if(busy)throw Error('另一个文件操作正在进行，请稍后重试。')
  busy=true
  try{return await work()}finally{busy=false}
 }
 const existingFile=async path=>{
  const target=await canonical(localFile(path))
  if(!(await inspect(target)).isFile())throw Error('只能处理文件，不能处理文件夹。')
  return target
 }
 return {
  rename:(path,value)=>exclusive(async()=>{
   const name=validFileName(value)
   try{
    const source=await existingFile(path)
    const target=win32.join(win32.dirname(source),name)
    if(target===source)return source
    // A case-only rename points at the same file, so only refuse other files.
    if(target.toLowerCase()!==source.toLowerCase())try{await inspect(target);throw Object.assign(Error('同一位置已有同名文件，请换一个名称。'),{code:'EEXIST'})}catch(error){if(error.code!=='ENOENT')throw error}
    await move(source,target)
    return target
   }catch(error){throw error.code==='EEXIST'?error:fileError(error)}
  }),
  recycle:path=>exclusive(async()=>{
   let target
   try{target=await existingFile(path)}catch(error){throw fileError(error)}
   try{await run(win32.join(environment.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(recycleScript,'utf16le').toString('base64')],{windowsHide:true,timeout:15000,maxBuffer:65536,env:{...environment,DSH_UI_RECYCLE_FILE:target}})}
   catch(error){throw error.code==='ENOENT'?Error('系统回收站组件不可用。'):Error('移到回收站失败，文件可能正被占用，请重试。')}
  }),
 }
}

async function readJson(req){
 const parts=[];let bytes=0
 // Keep the socket so an oversized request still receives its JSON error.
 for await(const chunk of req.iterator({destroyOnReturn:false})){bytes+=chunk.length;if(bytes>65536){req.resume();return {tooLarge:true}}parts.push(chunk)}
 try{return {value:JSON.parse(Buffer.concat(parts).toString('utf8'))}}catch{return {}}
}

export function registerFileOperations(root,{operations=createFileOperations()}={}){
 if(typeof root?.inject!=='function')return
 return root.inject(['webServer'],scope=>{
  const server=scope.get?.('webServer')||scope.webServer
  if(!server?.register)return
  let live=true
  const route=(path,perform)=>server.register({kind:'exact',path,handler:async(req,res)=>{
   const reply=(status,value)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(value))}
   if(!live){reply(503,{ok:false,message:'文件操作服务已关闭。'});return}
   if(req.method!=='POST'){res.setHeader('Allow','POST');reply(405,{ok:false,message:'只支持 POST 请求。'});return}
   if(!localRequest(req)){reply(403,{ok:false,message:'文件操作只允许从本机 DSH 窗口进行。'});return}
   if(!/^application\/json(?:\s*;|$)/i.test(req.headers?.['content-type']||'')){reply(415,{ok:false,message:'请求格式无效。'});return}
   try{
    const {value:input,tooLarge}=await readJson(req)
    if(tooLarge){reply(413,{ok:false,message:'请求过大。'});return}
    if(typeof input?.path!=='string'){reply(400,{ok:false,message:'缺少文件路径。'});return}
    if(!live){reply(503,{ok:false,message:'文件操作服务已关闭。'});return}
    reply(200,{ok:true,...await perform(input)})
   }catch(error){reply(400,{ok:false,message:error.message||'文件操作失败，请重试。'})}
  }})
  const registrations=[
   route(FILE_RENAME_PATH,async input=>({path:await operations.rename(input.path,input.name)})),
   route(FILE_DELETE_PATH,async input=>{await operations.recycle(input.path);return {}}),
  ]
  return()=>{live=false;for(const registration of registrations)typeof registration==='function'?registration():registration?.dispose?.()}
 })
}
