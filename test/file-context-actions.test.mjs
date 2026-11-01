import {test} from 'node:test'
import assert from 'node:assert/strict'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {win32} from 'node:path'
import {copyFileToClipboard,fileApplications,openFileWith,renameFile,recycleFile} from '../src/file-context-actions.js'
import {fileClipboardScript} from '../server/file-clipboard.js'

test('copy file sends only the selected path and reports success only after the native endpoint accepts it',async()=>{
 const calls=[],path='D:/合成资料/报告 [终稿].xlsx'
 const win={fetch:async(...args)=>{calls.push(args);return new Response(JSON.stringify({ok:true}))}}
 assert.match(await copyFileToClipboard(win,path),/已复制文件/)
 assert.equal(calls[0][0],'/dsh-ui-beautify/copy-file');assert.equal(calls[0][1].method,'POST');assert.equal(calls[0][1].credentials,'same-origin')
 assert.deepEqual(JSON.parse(calls[0][1].body),{path})
 for(const status of [404,503])await assert.rejects(copyFileToClipboard({fetch:async()=>new Response('',{status})},path),/重启 DSH/)
 await assert.rejects(copyFileToClipboard({fetch:async()=>{throw Error('offline')}},path),/无法连接/)
 await assert.rejects(copyFileToClipboard({fetch:async()=>new Response('not-json')},path),/响应异常/)
 await assert.rejects(copyFileToClipboard({fetch:async()=>new Response(JSON.stringify({ok:false,message:'剪贴板被占用'}),{status:400})},path),/剪贴板被占用/)
 await assert.rejects(copyFileToClipboard({fetch:async()=>new Response(JSON.stringify({ok:false}))},path),/失败/)
})

test('rename and delete post only the selected path to the local endpoints and surface their errors',async()=>{
 const calls=[],path='D:/合成资料/报告 [终稿].xlsx'
 const win={fetch:async(...args)=>{calls.push(args);return new Response(JSON.stringify(args[0].endsWith('rename-file')?{ok:true,path:'D:\\合成资料\\终稿.xlsx'}:{ok:true}))}}
 assert.equal(await renameFile(win,path,'终稿.xlsx'),'D:\\合成资料\\终稿.xlsx')
 await recycleFile(win,path)
 assert.deepEqual(calls.map(([route,init])=>[route,init.method,init.credentials,JSON.parse(init.body)]),[['/dsh-ui-beautify/rename-file','POST','same-origin',{path,name:'终稿.xlsx'}],['/dsh-ui-beautify/delete-file','POST','same-origin',{path}]])
 for(const status of [404,503])await assert.rejects(recycleFile({fetch:async()=>new Response('',{status})},path),/重启 DSH/)
 await assert.rejects(renameFile({fetch:async()=>{throw Error('offline')}},path,'x'),/无法连接/)
 await assert.rejects(renameFile({fetch:async()=>new Response(JSON.stringify({ok:false,message:'同一位置已有同名文件'}),{status:400})},path,'x'),/同名文件/)
 await assert.rejects(recycleFile({fetch:async()=>new Response(JSON.stringify({ok:false}))},path),/删除失败/)
})

test('application discovery keeps valid unique registered handlers and handles unavailable/empty hosts',async()=>{
 const apps=[{id:'editor',name:'Editor',default:true},{id:'editor',name:'Duplicate'},{id:'viewer',name:'Viewer'},null,{id:'',name:'Bad'},{id:3,name:'Bad'}]
 const api={workspacePathApplications:async request=>{assert.deepEqual(request,{path:'D:/report.md'});return{ok:true,value:apps}},openWorkspacePath:async()=>({ok:true})}
 assert.deepEqual(await fileApplications(api,'D:/report.md'),[{id:'editor',name:'Editor',default:true},{id:'viewer',name:'Viewer',default:false}])
 await assert.rejects(fileApplications({},'D:/report.md'),/不支持打开方式/)
 await assert.rejects(fileApplications({...api,workspacePathApplications:async()=>({ok:false})},'D:/report.md'),/无法读取/)
 await assert.rejects(fileApplications({...api,workspacePathApplications:async()=>[]},'D:/report.md'),/没有找到/)
})

test('open with revalidates a registered ID and never falls back to opening through the default application',async()=>{
 const requests=[],api={workspacePathApplications:async()=>({ok:true,value:[{id:'registered',name:'Editor'}]}),openWorkspacePath:async request=>{requests.push(request);return{ok:true,value:{opened:true}}}}
 await assert.rejects(openFileWith(api,'D:/report.md','stale-id'),/已变化/);assert.equal(requests.length,0)
 await openFileWith(api,'D:/report.md','registered');assert.deepEqual(requests,[{path:'D:/report.md',application:'registered'}])
 await assert.rejects(openFileWith({...api,openWorkspacePath:async()=>({ok:false})},'D:/report.md','registered'),/打开失败/)
})

test('Windows builds native file-drop and copy-effect formats without writing the user clipboard',{skip:process.platform!=='win32'},async()=>{
 const path='D:\\synthetic\\报告 & $(`name`)\' [终稿].xlsx'
 const probe=fileClipboardScript.replace(/^\s*\[System\.Windows\.Forms\.Clipboard\]::SetDataObject[^\n]*$/m,"  $value = @{ paths = @($data.GetFileDropList()); effect = @($data.GetData('Preferred DropEffect', $false).ToArray()); formats = @($data.GetFormats()) }; [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); [Console]::WriteLine(($value | ConvertTo-Json -Compress))")
 assert.notEqual(probe,fileClipboardScript);assert.equal(probe.includes('Clipboard]::SetDataObject'),false)
 const {stdout}=await promisify(execFile)(win32.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoProfile','-NonInteractive','-STA','-EncodedCommand',Buffer.from(probe,'utf16le').toString('base64')],{windowsHide:true,timeout:15000,env:{...process.env,DSH_UI_COPY_FILE:path}})
 const data=JSON.parse(stdout.trim());assert.deepEqual(data.paths,[path]);assert.deepEqual(data.effect,[1,0,0,0]);assert.ok(data.formats.includes('FileDrop'));assert.ok(data.formats.includes('Preferred DropEffect'))
})
