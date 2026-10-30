export async function copyFileToClipboard(win,path){
 let response
 try{response=await win.fetch('/dsh-ui-beautify/copy-file',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({path})})}catch{throw Error('无法连接文件复制服务，请重启 DSH 后重试。')}
 if(response.status===404||response.status===503)throw Error('请重启 DSH 以载入文件复制服务，再重试。')
 let result;try{result=await response.json()}catch{throw Error('文件复制服务响应异常，请重启 DSH 后重试。')}
 if(!response.ok||result?.ok!==true)throw Error(result?.message||'文件复制失败，请重试。')
 return '已复制文件，可直接粘贴。'
}

export async function fileApplications(api,path){
 if(typeof api?.workspacePathApplications!=='function'||typeof api?.openWorkspacePath!=='function')throw Error('当前宿主不支持打开方式，请升级 DSH 后重试。')
 const result=await api.workspacePathApplications({path})
 const list=Array.isArray(result)?result:result?.ok===true?result.value:null
 if(!Array.isArray(list))throw Error('无法读取打开方式，请重试。')
 const seen=new Set(),applications=list.filter(item=>typeof item?.id==='string'&&item.id&&typeof item.name==='string'&&item.name.trim()&&!seen.has(item.id)&&seen.add(item.id)).slice(0,100).map(({id,name,default:isDefault})=>({id,name,default:isDefault===true}))
 if(!applications.length)throw Error('没有找到可用程序，请先为此类文件安装或关联应用。')
 return applications
}

export async function openFileWith(api,path,application){
 // Registered IDs are revalidated immediately before asking the host to open.
 const applications=await fileApplications(api,path)
 if(!applications.some(item=>item.id===application))throw Error('可用程序已变化，请返回后重新选择打开方式。')
 const result=await api.openWorkspacePath({path,application})
 if(result?.ok!==true&&result?.opened!==true)throw Error('使用所选程序打开失败，请重试。')
}
