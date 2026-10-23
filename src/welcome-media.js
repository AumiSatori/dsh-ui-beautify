export const WELCOME_MEDIA_LIMIT=20*1024*1024
const DB='dsh-ui-beautify-welcome',STORE='media',KEY='opening'
const sizesOK=(width,height)=>width>0&&height>0&&width<=4096&&height<=4096&&width*height<=8_294_400
export function welcomeMediaType(bytes){
  const ascii=(start,end)=>String.fromCharCode(...bytes.slice(start,end))
  if(bytes.length>=10&&(ascii(0,6)==='GIF87a'||ascii(0,6)==='GIF89a'))return'image/gif'
  if(bytes.length>=24&&bytes[0]===137&&ascii(1,4)==='PNG'&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10)return'image/png'
  if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP')return'image/webp'
  if(ascii(4,8)==='ftyp')return'video/mp4'
  if(bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3)return'video/webm'
  return null
}

// Media stays in this device's IndexedDB. Preferences hold only the mode and
// a revision; no base64 payload, local path or remote upload enters settings.
export function createWelcomeMediaStore(win){
  let opening=null,db=null,disposed=false
  const open=()=>{
    if(disposed)return Promise.reject(Error('开屏存储已关闭'))
    if(db)return Promise.resolve(db)
    if(!opening)opening=new Promise((resolve,reject)=>{
      if(!win.indexedDB){reject(Error('当前环境无法保存开屏文件'));return}
      const request=win.indexedDB.open(DB,1)
      request.onupgradeneeded=()=>request.result.createObjectStore(STORE)
      request.onerror=()=>{opening=null;reject(Error('无法打开本机开屏存储'))}
      request.onblocked=()=>{opening=null;reject(Error('开屏存储被占用，请关闭其他设置窗口后重试'))}
      request.onsuccess=()=>{
        if(disposed){request.result.close();reject(Error('开屏存储已关闭'));return}
        db=request.result;db.onversionchange=()=>{db?.close();db=null;opening=null};resolve(db)
      }
    })
    return opening
  }
  const run=async(mode,action)=>{
    const database=await open()
    return new Promise((resolve,reject)=>{
      const tx=database.transaction(STORE,mode);let value
      const request=action(tx.objectStore(STORE));request.onsuccess=()=>{value=request.result}
      tx.oncomplete=()=>resolve(value)
      tx.onerror=tx.onabort=()=>reject(Error('无法保存开屏文件，请检查本机可用空间'))
    })
  }
  return{load:()=>run('readonly',store=>store.get(KEY)),save:asset=>run('readwrite',store=>store.put(asset,KEY)),remove:()=>run('readwrite',store=>store.delete(KEY)),dispose(){disposed=true;db?.close();db=null}}
}

export async function inspectWelcomeMedia(file,doc,win){
  if(!file?.size)throw Error('请选择非空的动图或视频文件')
  if(file.size>WELCOME_MEDIA_LIMIT)throw Error('文件需小于 20MB，建议使用较短、较小的素材')
  const bytes=new Uint8Array(await file.slice(0,32).arrayBuffer()),type=welcomeMediaType(bytes)
  if(!type)throw Error('支持 GIF、APNG/PNG、WebP、MP4 和 WebM 文件')
  if(type==='image/gif'){
    const w=bytes[6]+bytes[7]*256,h=bytes[8]+bytes[9]*256
    if(!sizesOK(w,h))throw Error('画面过大，请缩小到 4096 像素及 830 万像素以内')
  }
  if(type==='image/png'){
    const view=new DataView(bytes.buffer)
    if(!sizesOK(view.getUint32(16),view.getUint32(20)))throw Error('画面过大，请缩小到 4096 像素及 830 万像素以内')
  }
  const video=type.startsWith('video/'),url=win.URL.createObjectURL(file)
  const media=doc.createElement(video?'video':'img')
  try{
    const meta=await new Promise((resolve,reject)=>{
      const timer=win.setTimeout(()=>done(Error('读取素材超时，请换一个较小或兼容的文件')),5000)
      const done=(error)=>{
        win.clearTimeout(timer);media.onload=null;media.onloadedmetadata=null;media.onerror=null
        if(error){reject(error);return}
        const width=video?media.videoWidth:media.naturalWidth,height=video?media.videoHeight:media.naturalHeight,duration=video?media.duration:null
        if(!sizesOK(width,height)){reject(Error('画面过大，请缩小到 4096 像素及 830 万像素以内'));return}
        if(video&&(!Number.isFinite(duration)||duration<=0||duration>15)){reject(Error('短视频需在 15 秒以内'));return}
        resolve({width,height,duration})
      }
      media.onerror=()=>done(Error('无法解码这个素材，请换用 GIF、H.264 MP4 或 WebM'))
      if(video){media.preload='metadata';media.muted=true;media.onloadedmetadata=()=>done()}
      else media.onload=()=>done()
      media.src=url
    })
    return{blob:new win.Blob([file],{type}),type,kind:video?'video':'image',name:String(file.name||'开屏素材').slice(0,160),size:file.size,revision:win.crypto?.randomUUID?.()||String(Date.now()),...meta}
  }finally{if(video)media.pause();media.removeAttribute('src');if(video)media.load();win.URL.revokeObjectURL(url)}
}

// One bounded decoder, released on completion, skip, replacement or disposal.
export function createWelcomeMediaPlayer(doc,win,asset,settings,{autoplay=true,onReady=()=>{},onComplete=()=>{},onError=()=>{}}={}){
  const wrapper=doc.createElement('div');wrapper.setAttribute('data-dcb-welcome-media','');wrapper.setAttribute('data-fit',settings.welcomeMediaFit)
  const video=asset?.kind==='video',media=doc.createElement(video?'video':'img')
  let disposed=false,loaded=false,url=null,ended=false
  const timers=new Set(),listeners=[]
  const later=(fn,ms)=>{const id=win.setTimeout(()=>{timers.delete(id);fn()},ms);timers.add(id);return id}
  const listen=(event,fn)=>{media.addEventListener(event,fn);listeners.push(()=>media.removeEventListener(event,fn))}
  const release=()=>{
    for(const id of timers)win.clearTimeout(id);timers.clear()
    for(const remove of listeners)remove();listeners.length=0
    if(video)media.pause()
    media.removeAttribute('src');if(video)media.load()
    if(url){win.URL.revokeObjectURL(url);url=null}
  }
  const freeze=()=>{
    if(disposed)return
    if(loaded){
      try{
        const w=video?media.videoWidth:media.naturalWidth,h=video?media.videoHeight:media.naturalHeight,scale=Math.min(1,1024/w,768/h),canvas=doc.createElement('canvas')
        canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));canvas.getContext('2d').drawImage(media,0,0,canvas.width,canvas.height);wrapper.replaceChildren(canvas)
      }catch{/* A failed poster still releases the decoder. */}
    }
    disposed=true;release()
  }
  const fail=()=>{if(disposed||ended)return;ended=true;disposed=true;release();onError(Error('开屏素材播放失败'))}
  const complete=()=>{if(disposed||ended)return;ended=true;freeze();onComplete()}
  const ready=()=>{
    if(disposed||loaded)return
    loaded=true;for(const id of timers)win.clearTimeout(id);timers.clear();onReady()
    if(!autoplay){freeze();return}
    if(video){
      later(complete,Math.min(15500,Math.max(1000,(asset.duration||15)*1000+500)))
      try{Promise.resolve(media.play()).catch(fail)}catch{fail()}
    }else later(complete,settings.welcomeMediaDuration)
  }
  wrapper.append(media)
  if(video){media.muted=true;media.defaultMuted=true;media.playsInline=true;media.preload='auto';media.disablePictureInPicture=true;media.setAttribute('aria-label','开屏短视频');listen('loadeddata',ready);listen('ended',complete)}
  else{media.alt='自定义开屏动图';listen('load',ready)}
  listen('error',fail)
  if(!asset?.blob||!asset.type?.match(/^(image\/(gif|png|webp)|video\/(mp4|webm))$/))later(fail,0)
  else{url=win.URL.createObjectURL(asset.blob);later(fail,1500);media.src=url}
  return{node:wrapper,freeze,dispose(){if(disposed)return;disposed=true;release()}}
}

export const welcomeMediaCss=`
  [data-dcb-welcome-media] { width:100%; height:100%; min-height:0; display:grid; place-items:center; overflow:hidden; background:#000; }
  [data-dcb-welcome-media] > :is(img,video,canvas) { width:100%; height:100%; min-height:0; object-fit:contain; }
  [data-dcb-welcome-media][data-fit=cover] > :is(img,video,canvas) { object-fit:cover; }
`
