import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {realpath,stat} from 'node:fs/promises'
import {win32} from 'node:path'

const execute=promisify(execFile)
export const FILE_CLIPBOARD_PATH='/dsh-ui-beautify/copy-file'
// Paths travel through the environment, never through PowerShell source.
export const fileClipboardScript=`
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$files = New-Object System.Collections.Specialized.StringCollection
[void]$files.Add($env:DSH_UI_COPY_FILE)
$data = New-Object System.Windows.Forms.DataObject
$data.SetFileDropList($files)
$effect = [System.IO.MemoryStream]::new([byte[]]@(1,0,0,0))
try {
  $data.SetData('Preferred DropEffect', $false, $effect)
  [System.Windows.Forms.Clipboard]::SetDataObject($data, $true, 5, 100)
} finally { $effect.Dispose() }
`

export function createFileClipboard({platform=process.platform,canonical=realpath,inspect=stat,run=execute,environment=process.env}={}){
 let busy=false
 return async path=>{
  if(platform!=='win32')throw Error('复制文件目前仅支持本机 Windows。')
  if(typeof path!=='string'||!win32.isAbsolute(path)||! /^(?:[a-z]:[\\/]|\\\\[^\\]+\\[^\\]+)/i.test(path)||path.includes('\0')||path.length>32767)throw Error('请选择有效的本机文件。')
  if(busy)throw Error('另一个文件正在复制，请稍后重试。')
  busy=true
  try{
   const target=await canonical(path)
   if(!(await inspect(target)).isFile())throw Error('只能复制文件，不能复制文件夹。')
   await run(win32.join(environment.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoLogo','-NoProfile','-NonInteractive','-STA','-EncodedCommand',Buffer.from(fileClipboardScript,'utf16le').toString('base64')],{windowsHide:true,timeout:10000,maxBuffer:65536,env:{...environment,DSH_UI_COPY_FILE:target}})
  }catch(error){
   if(error.code==='ENOENT')throw Error('文件不存在，或系统剪贴板组件不可用。')
   if(error.code==='EACCES'||error.code==='EPERM')throw Error('没有权限读取这个文件。')
   if(error.killed||error.cmd)throw Error('文件复制失败，剪贴板可能被占用，请重试。')
   throw error
  }finally{busy=false}
 }
}

function localRequest(req){
 const address=req.socket?.remoteAddress
 if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address)||req.headers?.['sec-fetch-site']==='cross-site')return false
 const origin=req.headers?.origin
 if(origin==='dsh-app://app')return true
 if(!origin)return req.headers?.['sec-fetch-site']==='same-origin'
 try{const url=new URL(origin);return ['http:','https:'].includes(url.protocol)&&url.host===req.headers.host&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)}catch{return false}
}

export function registerFileClipboard(root,{copy=createFileClipboard()}={}){
 if(typeof root?.inject!=='function')return
 return root.inject(['webServer'],scope=>{
  const server=scope.get?.('webServer')||scope.webServer
  if(!server?.register)return
  let live=true
  const registration=server.register({kind:'exact',path:FILE_CLIPBOARD_PATH,handler:async(req,res)=>{
   const reply=(status,value)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(value))}
   if(!live){reply(503,{ok:false,message:'文件复制服务已关闭。'});return}
   if(req.method!=='POST'){res.setHeader('Allow','POST');reply(405,{ok:false,message:'只支持 POST 请求。'});return}
   if(!localRequest(req)){reply(403,{ok:false,message:'复制文件只允许从本机 DSH 窗口操作。'});return}
   if(!/^application\/json(?:\s*;|$)/i.test(req.headers?.['content-type']||'')){reply(415,{ok:false,message:'请求格式无效。'});return}
   try{
    const parts=[];let bytes=0
    // Do not destroy the HTTP socket when rejecting a large request: the
    // caller must still receive the error response instead of a reset.
    for await(const chunk of req.iterator({destroyOnReturn:false})){bytes+=chunk.length;if(bytes>65536){req.resume();reply(413,{ok:false,message:'请求过大。'});return}parts.push(chunk)}
    let input;try{input=JSON.parse(Buffer.concat(parts).toString('utf8'))}catch{reply(400,{ok:false,message:'请求格式无效。'});return}
    if(typeof input?.path!=='string'){reply(400,{ok:false,message:'缺少文件路径。'});return}
    if(!live){reply(503,{ok:false,message:'文件复制服务已关闭。'});return}
    await copy(input.path);reply(200,{ok:true})
   }catch(error){reply(400,{ok:false,message:error.message||'文件复制失败，请重试。'})}
  }})
  return()=>{live=false;if(typeof registration==='function')registration();else registration?.dispose?.()}
 })
}
