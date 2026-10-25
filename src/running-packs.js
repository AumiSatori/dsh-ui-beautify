import {RUNNING_BASE,RUNNING_BUILTIN,RUNNING_LIMITS as L,normalizeRunningManifest,runningImageType,runningPath} from './running-animation-config.js'
import {readRunningZip} from './running-pack-zip.js'

function imageInfo(win,blob){
  return new Promise((resolve,reject)=>{
    const url=win.URL.createObjectURL(blob),image=new win.Image(),timer=win.setTimeout(()=>finish(Error('图片读取超时')),10000)
    function finish(error,result){win.clearTimeout(timer);image.onload=image.onerror=null;image.src='';win.URL.revokeObjectURL(url);error?reject(error):resolve(result)}
    image.onerror=()=>finish(Error('图片无法解码'))
    image.onload=()=>{
      const width=image.naturalWidth,height=image.naturalHeight
      if(!width||!height||width>4096||height>4096||width*height>8388608){finish(Error('图片尺寸过大（最长 4096 像素，最多 800 万像素）'));return}
      const canvas=win.document.createElement('canvas'),scale=Math.min(1,128/Math.max(width,height));canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height)
      canvas.toBlob(poster=>finish(poster?null:Error('无法生成预览'),{width,height,poster}),'image/png')
    }
    image.src=url
  })
}
export async function inspectRunningPack(input,win=globalThis){
  let files
  if(input?.size!==undefined&&/\.zip$/i.test(input.name))files=await readRunningZip(input,win)
  else{files=new Map();for(const file of Array.from(input||[])){const path=runningPath(file.webkitRelativePath||file.name);if(files.has(path))throw Error('存在重复文件');files.set(path,file)}}
  if(!files.size||files.size>L.entries)throw Error('动图包最多包含 100 个动作')
  const manifests=[...files.keys()].filter(path=>/(^|\/)manifest\.json$/i.test(path))
  if(manifests.length>1)throw Error('只保留一份 manifest.json')
  let manifest
  if(manifests.length){
    const path=manifests[0],file=files.get(path),base=path.slice(0,path.lastIndexOf('/')+1)
    if(file.size>L.manifestBytes)throw Error('manifest.json 过大')
    let parsed;try{parsed=JSON.parse(await file.text())}catch{throw Error('manifest.json 不是有效的 JSON')}
    manifest=normalizeRunningManifest(parsed,new Map([...files].filter(([key])=>key.startsWith(base)).map(([key,value])=>[key.slice(base.length),value])))
    files=new Map([...files].filter(([key])=>key.startsWith(base)).map(([key,value])=>[key.slice(base.length),value]))
  }else{
    const images=[...files.keys()].filter(path=>/\.(gif|png|apng|webp)$/i.test(path)).sort()
    manifest=normalizeRunningManifest({format:'dsh-running-pack',version:1,name:input.name?.replace(/\.zip$/i,'')||'我的动图包',actions:images.map((file,index)=>({id:`action-${index+1}`,name:file.split('/').at(-1).replace(/\.[^.]+$/,''),file}))},files)
  }
  let total=0;const assets=[]
  for(const action of manifest.actions){
    const file=files.get(action.file)
    if(!file.size||file.size>L.fileBytes||(total+=file.size)>L.totalBytes)throw Error('单张图片不能超过 8 MB，整包不能超过 96 MB')
    const type=runningImageType(new Uint8Array(await file.slice(0,16).arrayBuffer())),blob=new win.Blob([file],{type}),info=await imageInfo(win,blob)
    if(action.type==='sprite'&&(info.width%action.columns||info.height%action.rows||info.width/action.columns!==info.height/action.rows))throw Error(`精灵图须为等大的正方形格子：${action.name}`)
    assets.push({id:action.id,blob,poster:action.type==='sprite'?null:info.poster})
  }
  return {manifest,assets}
}

export function createRunningPacks(win){
  let snapshot={packs:[],loading:true,error:''},dbPromise,builtinPromise,loadPromise,disposed=false
  const listeners=new Set(),leases=new Set()
  const notify=patch=>{if(disposed)return;snapshot={...snapshot,...patch};for(const listener of listeners)listener()}
  const db=()=>dbPromise||(dbPromise=new Promise((resolve,reject)=>{
    const request=win.indexedDB.open('dsh-ui-beautify-running-packs',1)
    request.onupgradeneeded=()=>{request.result.createObjectStore('packs',{keyPath:'id'});request.result.createObjectStore('assets',{keyPath:'key'})}
    request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();resolve(request.result)};request.onerror=()=>reject(Error('本机动图存储不可用'))
  }))
  async function read(store,key){const database=await db();return new Promise((resolve,reject)=>{const request=database.transaction(store).objectStore(store)[key===undefined?'getAll':'get'](key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
  async function builtin(){
    if(!builtinPromise)builtinPromise=win.fetch(`${RUNNING_BASE}/pack.json`,{credentials:'same-origin'}).then(async response=>{if(!response.ok)throw Error('内置素材尚未接入，请重启 DSH；也可先导入自己的动图包。');return {...normalizeRunningManifest(await response.json()),id:RUNNING_BUILTIN,builtin:true}})
    return builtinPromise
  }
  async function loadOnce(){
    const results=await Promise.allSettled([builtin(),read('packs')]),packs=[];let error=''
    for(const result of results)if(result.status==='fulfilled')packs.push(...(Array.isArray(result.value)?result.value:[result.value]));else error=result.reason.message
    notify({packs,loading:false,error});return packs
  }
  const load=()=>loadPromise||(loadPromise=loadOnce())
  async function importPack(input){
    await load()
    const {manifest,assets}=await inspectRunningPack(input,win),id=`local-${win.crypto.randomUUID()}`,pack={...manifest,id,createdAt:Date.now()},database=await db()
    if(disposed)throw Error('设置已关闭，请重新打开后导入')
    await new Promise((resolve,reject)=>{
      const tx=database.transaction(['packs','assets'],'readwrite');tx.objectStore('packs').put(pack)
      for(const asset of assets)tx.objectStore('assets').put({...asset,key:`${id}/${asset.id}`})
      tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(Error('保存失败，可能是本机存储空间不足'))
    })
    notify({packs:[...snapshot.packs,pack]});return pack
  }
  async function removePack(id){
    if(id===RUNNING_BUILTIN)return
    const pack=snapshot.packs.find(item=>item.id===id);if(!pack)return
    const database=await db();await new Promise((resolve,reject)=>{const tx=database.transaction(['packs','assets'],'readwrite');tx.objectStore('packs').delete(id);for(const action of pack.actions)tx.objectStore('assets').delete(`${id}/${action.id}`);tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(Error('删除动图包失败'))})
    notify({packs:snapshot.packs.filter(item=>item.id!==id)})
  }
  async function acquire(pack,action){
    let url,poster,owned=[]
    if(pack.builtin){url=`${RUNNING_BASE}/asset?id=${encodeURIComponent(action.id)}`;poster=url}
    else{const data=await read('assets',`${pack.id}/${action.id}`);if(!data)throw Error('动图素材已移除');url=win.URL.createObjectURL(data.blob);owned.push(url);poster=data.poster?win.URL.createObjectURL(data.poster):url;if(poster!==url)owned.push(poster)}
    let released=false
    const lease={url,poster,release(){if(released)return;released=true;for(const item of owned)win.URL.revokeObjectURL(item);leases.delete(lease)}}
    if(disposed){lease.release();throw Error('动图资源已关闭')}
    leases.add(lease);return lease
  }
  return {load,importPack,removePack,acquire,subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},getSnapshot:()=>snapshot,dispose(){disposed=true;listeners.clear();for(const lease of leases)lease.release();dbPromise?.then(database=>database.close(),()=>{})}}
}
