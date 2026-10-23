const DB='dsh-ui-beautify-background',STORE='wallpaper',KEY='selection'
const bound=(value,min,max,fallback)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback
export function normalizeBackground(value){
  return{
    backgroundEnabled:value?.backgroundEnabled===true,
    backgroundRevision:typeof value?.backgroundRevision==='string'?value.backgroundRevision.slice(0,100):'',
    backgroundName:typeof value?.backgroundName==='string'?value.backgroundName.slice(0,160):'',
    backgroundFit:['cover','contain','fill'].includes(value?.backgroundFit)?value.backgroundFit:'cover',
    backgroundPosition:['center','top','bottom','left','right'].includes(value?.backgroundPosition)?value.backgroundPosition:'center',
    backgroundOpacity:Math.round(bound(value?.backgroundOpacity,0,100,45)),
    backgroundBlur:Math.round(bound(value?.backgroundBlur,0,20,0)),
    backgroundSound:value?.backgroundSound===true,
  }
}

// Blobs live in a separate local database. Preferences contain no file payload.
// Replacement and undo update both slots in one transaction, including failures.
export function createBackgroundStore(win){
  let opening=null,database=null,disposed=false
  function open(){
    if(disposed)return Promise.reject(Error('背景存储已关闭'))
    if(database)return Promise.resolve(database)
    if(!opening)opening=new Promise((resolve,reject)=>{
      if(!win.indexedDB){reject(Error('当前环境无法保存本机背景'));return}
      const request=win.indexedDB.open(DB,1)
      request.onupgradeneeded=()=>request.result.createObjectStore(STORE)
      request.onerror=request.onblocked=()=>{opening=null;reject(Error('无法打开背景存储，请关闭其他设置窗口后重试'))}
      request.onsuccess=()=>{
        if(disposed){request.result.close();reject(Error('背景存储已关闭'));return}
        database=request.result;database.onversionchange=()=>{database?.close();database=null;opening=null};resolve(database)
      }
    })
    return opening
  }
  async function transact(change){
    const db=await open()
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,change?'readwrite':'readonly'),store=tx.objectStore(STORE),request=store.get(KEY)
      let result
      request.onsuccess=()=>{
        result=request.result||{current:null,previous:null}
        if(change)try{result=change(result);store.put(result,KEY)}catch{tx.abort()}
      }
      tx.oncomplete=()=>resolve(result)
      tx.onerror=tx.onabort=()=>reject(Error('无法保存背景，请检查本机可用空间；原背景仍保留'))
    })
  }
  return{
    read:()=>transact(),replace:asset=>transact(old=>({current:asset,previous:old.current})),
    restore:()=>transact(old=>old.previous?{current:old.previous,previous:old.current}:old),
    clear:()=>transact(()=>({current:null,previous:null})),
    dispose(){disposed=true;database?.close();database=null},
  }
}

export function backgroundMediaType(bytes){
  const text=(start,end)=>String.fromCharCode(...bytes.slice(start,end))
  if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return'image/jpeg'
  if(bytes[0]===137&&text(1,4)==='PNG'&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10)return'image/png'
  if(text(0,6)==='GIF87a'||text(0,6)==='GIF89a')return'image/gif'
  if(text(0,4)==='RIFF'&&text(8,12)==='WEBP')return'image/webp'
  if(text(4,8)==='ftyp')return'video/mp4'
  if(bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3)return'video/webm'
  return null
}

export function backgroundThumbnail(media,{width,height},doc){
  try{
    const canvas=doc.createElement('canvas'),scale=Math.min(1,480/width,300/height)
    canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale))
    canvas.getContext('2d').drawImage(media,0,0,canvas.width,canvas.height)
    return canvas.toDataURL('image/webp',.78)
  }catch{return''}
}

export async function inspectBackgroundMedia(file,doc,win){
  if(!file?.size)throw Error('请选择非空的图片或视频')
  const type=backgroundMediaType(new Uint8Array(await file.slice(0,32).arrayBuffer()))
  if(!type)throw Error('支持 JPG、PNG、WebP、GIF、MP4 和 WebM')
  const video=type.startsWith('video/'),limit=(video?256:32)*1024*1024
  if(file.size>limit)throw Error(video?'视频需小于 256MB':'图片需小于 32MB')
  const url=win.URL.createObjectURL(file),media=doc.createElement(video?'video':'img')
  try{
    const meta=await new Promise((resolve,reject)=>{
      const timer=win.setTimeout(()=>done(Error('读取背景超时，请换一个较小的文件')),8000)
      const done=error=>{
        win.clearTimeout(timer);media.onload=null;media.onloadeddata=null;media.onerror=null
        if(error){reject(error);return}
        const width=video?media.videoWidth:media.naturalWidth,height=video?media.videoHeight:media.naturalHeight,duration=video?media.duration:null
        if(!width||!height||width>16384||height>16384||width*height>33_554_432){reject(Error('画面过大，请缩小到 3300 万像素以内'));return}
        if(video&&(!Number.isFinite(duration)||duration<=0)){reject(Error('无法读取视频时长，请使用普通 MP4 或 WebM 文件'));return}
        resolve({width,height,duration})
      }
      media.onerror=()=>done(Error('无法解码这个背景，请换用常见图片、H.264 MP4 或 WebM'))
      if(video){media.muted=true;media.preload='auto';media.onloadeddata=()=>done()}
      else media.onload=()=>done()
      media.src=url
    })
    return{blob:new win.Blob([file],{type}),type,kind:video?'video':'image',name:String(file.name||'全图背景').slice(0,160),revision:win.crypto?.randomUUID?.()||String(Date.now()),preview:backgroundThumbnail(media,meta,doc),...meta}
  }finally{if(video)media.pause();media.removeAttribute('src');if(video)media.load();win.URL.revokeObjectURL(url)}
}
