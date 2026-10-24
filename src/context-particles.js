import whaleImage from '../assets/context-whale-cutout.png'
import {createParticleScene,sampleParticleArtwork} from './context-particle-renderer.js'
import {createParticleSVG} from './context-particle-svg.js'
import {inspectParticleImage} from './context-particle-image.js'
import {normalizeParticles,particleOccupancy,particleConversion} from './context-particle-config.js'
export {normalizeParticles} from './context-particle-config.js'

// Native sidebar transitions can briefly hide/remount the conversation or its
// header publisher. Keep at most two scenes alive across that layout gap.
const RETAIN_MS=1500,MAX_SCENES=2

export const contextParticlesCss=`
  [data-dcb-particles-host] { isolation:isolate; }
  .dcb-particle-layer { position:absolute; inset:0; z-index:-1; overflow:hidden; pointer-events:none!important; user-select:none; opacity:1; transition:opacity 260ms cubic-bezier(.4,0,.2,1); }
  .dcb-particle-layer canvas { display:block; position:absolute; inset:0; width:100%; height:100%; pointer-events:none!important; }
  .dcb-particle-layer[data-waiting] { opacity:0; }
  @media(prefers-reduced-motion:reduce) { .dcb-particle-layer { transition:none; } }
  @media(forced-colors:active) { .dcb-particle-layer { visibility:hidden; } }
`

function artworkStorage(win){
  let opening=null,database=null,disposed=false
  const open=()=>{
    if(disposed)return Promise.reject(Error('粒子素材存储已关闭'))
    if(opening)return opening
    opening=new Promise((resolve,reject)=>{
      if(!win.indexedDB){reject(Error('浏览器未开放本机素材存储'));return}
      const request=win.indexedDB.open('dsh-ui-context-particles',1)
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('artwork'))request.result.createObjectStore('artwork')}
      request.onerror=()=>{opening=null;reject(Error('无法打开本机粒子素材存储'))}
      request.onblocked=()=>{opening=null;reject(Error('粒子素材存储被占用，请关闭其他设置窗口后重试'))}
      request.onsuccess=()=>{
        if(disposed){request.result.close();reject(Error('粒子素材存储已关闭'));return}
        database=request.result;database.onversionchange=()=>{database.close();database=null;opening=null};resolve(database)
      }
    });return opening
  }
  async function run(mode,action){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('artwork',mode),request=action(tx.objectStore('artwork'));let result;request.addEventListener('success',()=>result=request.result);tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(Error('无法保存粒子素材，请检查本机可用空间'))})}
  return{
    load:(key='current')=>run('readonly',store=>store.get(key)),save:asset=>run('readwrite',store=>store.put(asset,'current')),remove:()=>run('readwrite',store=>store.delete('current')),
    saveImage:(asset,keep)=>run('readwrite',store=>{const request=store.getAllKeys();request.onsuccess=()=>{for(const key of request.result)if(typeof key==='string'&&key.startsWith('image:')&&key!=='image:'+keep)store.delete(key);store.put(asset,'image:'+asset.revision)};return request}),
    removeImages:()=>run('readwrite',store=>{const request=store.getAllKeys();request.onsuccess=()=>{for(const key of request.result)if(typeof key==='string'&&key.startsWith('image:'))store.delete(key)};return request}),
    dispose(){disposed=true;database?.close();database=null}
  }
}

export function createContextParticles(doc,win,{logoPath,logoBox}={}){
  const readings=new Map(),scenes=new Map(),retained=new Set(),watchedHosts=new Set(),models=new Map(),listeners=new Set(),previews=new Set(),store=artworkStorage(win),sanitize=createParticleSVG(doc,win)
  const forced=win.matchMedia('(forced-colors: active)')
  // Keep watching connected hidden hosts even after their cached scene expires.
  // Restoring display alone otherwise has no publisher or DOM mount to wake us.
  const hostResize=new win.ResizeObserver(schedule)
  let settings=normalizeParticles(null),disposed=false,frame=0,retentionTimer=0,lastStatus='',svgCache=null,svgKey='',contextPercent=null,imageSequence=0
  const now=()=>win.performance.now()
  function readingFor(entry){
    const percent=[...entry.owners.values()].at(-1)??null
    if(percent!==null){entry.last=percent;entry.expires=0;win.clearTimeout(entry.timer);entry.timer=0;return percent}
    if(entry.last!==null&&entry.expires===0){
      entry.expires=now()+RETAIN_MS
      entry.timer=win.setTimeout(()=>{entry.last=null;entry.expires=0;entry.timer=0;if(!entry.owners.size)readings.delete(entry.session);schedule()},RETAIN_MS)
    }
    return entry.expires>now()?entry.last:null
  }
  const artworkKey=()=>settings.particleShape==='custom'?'custom:'+settings.particleSvgRevision:settings.particleShape==='image'?'image:'+settings.particleImageRevision:settings.particleShape
  const status=()=>[...scenes.values()].map(scene=>({percent:scene.percent,shape:scene.shape,waiting:scene.waiting,error:scene.error||null,...scene.renderer.snapshot()}))
  const emit=()=>{const key=JSON.stringify({contextPercent,progressMode:settings.particleProgressMode,manualProgress:settings.particleManualProgress,scenes:status().map(({percent,shape,waiting,error})=>({percent,shape,waiting,error}))});if(lastStatus===key)return;lastStatus=key;for(const listener of listeners)listener()}
  const diagnostic=Symbol.for('dsh-ui-beautify.context-particles.v1'),oldDiagnostic=Object.getOwnPropertyDescriptor(win,diagnostic)
  const probe=Object.freeze({snapshot:()=>({enabled:settings.particleEnabled,shape:settings.particleShape,start:settings.particleStart,full:settings.particleFull,count:settings.particleCount,progressMode:settings.particleProgressMode,manualProgress:settings.particleManualProgress,contextPercent,previewCount:previews.size,scenes:status()})})
  Object.defineProperty(win,diagnostic,{configurable:true,value:probe})
  async function custom(){
    const key=settings.particleSvgRevision
    if(!svgCache||svgKey!==key){svgKey=key;svgCache=store.load()}
    const asset=await svgCache
    if(!asset?.xml)throw Error('请先导入自定义 SVG')
    return sanitize.sanitize(asset.xml).source
  }
  function modelFor(key){
    if(!models.has(key)){
      const pending=(async()=>{
      if(key==='whale')return sampleParticleArtwork(whaleImage,{transparent:true,portrait:true})
        if(key.startsWith('image:')){
          const asset=await store.load(key)
          if(!asset?.blob||asset.revision!==key.slice(6))throw Error('找不到这张本机图片，请重新导入')
          const url=win.URL.createObjectURL(asset.blob)
          try{return await sampleParticleArtwork(url)}finally{win.URL.revokeObjectURL(url)}
        }
        if(key.startsWith('custom:'))return sampleParticleArtwork(await custom(),{vector:true})
        if(typeof logoPath!=='string'||!logoBox?.width||!logoBox?.height)throw Error('宿主 DeepSeek Logo 尚未就绪')
        // Brand geometry comes from the host's public primitive, not a redraw.
        const xml=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${logoBox.width} ${logoBox.height}"><path fill="#4d6bfe" d="${logoPath}"/></svg>`
        return sampleParticleArtwork('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml),{vector:true})
      })();models.set(key,pending);pending.catch(()=>{if(models.get(key)===pending)models.delete(key)})
    }
    return models.get(key)
  }
  function unbind(scene){
    scene.resize.disconnect();scene.phase.disconnect();scene.intersection.disconnect();scene.renderer.pause()
    if(scenes.get(scene.host)===scene){scenes.delete(scene.host);scene.host.removeAttribute('data-dcb-particles-host')}
    scene.layer.remove()
  }
  function release(scene){
    scene.released=true;scene.revision++;unbind(scene);retained.delete(scene);scene.renderer.dispose()
  }
  function armRetention(){
    win.clearTimeout(retentionTimer);retentionTimer=0
    if(retained.size)retentionTimer=win.setTimeout(()=>{
      retentionTimer=0
      for(const scene of retained)if(scene.expires<=now())release(scene)
      armRetention()
    },Math.max(1,Math.min(...[...retained].map(scene=>scene.expires))-now()))
  }
  function park(scene){unbind(scene);scene.expires=now()+RETAIN_MS;retained.add(scene);armRetention()}
  function bind(scene,host){
    retained.delete(scene);scene.resize.disconnect();scene.phase.disconnect();scene.host=host;scene.visible=true;scene.expires=0
    host.setAttribute('data-dcb-particles-host','');host.prepend(scene.layer)
    const composer=host.querySelector('[data-composer-seat]');if(composer)scene.resize.observe(composer)
    scene.phase.observe(host,{attributes:true,attributeFilter:['data-content-phase']})
    scene.intersection.observe(host);scenes.set(host,scene);armRetention();return scene
  }
  function create(host){
    const layer=doc.createElement('div');layer.className='dcb-particle-layer';layer.setAttribute('aria-hidden','true');layer.setAttribute('data-waiting','');
    const scene={host,session:host.dataset.conversationSession,layer,renderer:createParticleScene(layer,doc,win),key:null,percent:null,shape:null,waiting:true,visible:true,revision:0,released:false,expires:0,resize:new win.ResizeObserver(schedule),phase:new win.MutationObserver(schedule),intersection:new win.IntersectionObserver(entries=>{const entry=entries.find(entry=>entry.target===scene.host);if(entry&&scenes.get(scene.host)===scene){scene.visible=entry.isIntersecting;schedule()}})}
    return bind(scene,host)
  }
  async function changeModel(scene,key){
    scene.key=key;scene.waiting=true;scene.error=null;const token=++scene.revision
    try{const model=await modelFor(key);if(disposed||scene.released||token!==scene.revision)return;scene.renderer.setModel(model,key.startsWith('custom:')?'svg':key.startsWith('image:')?'image':key==='whale'?'whale':'default');scene.shape=key.startsWith('custom:')?'custom':key.startsWith('image:')?'image':key;scene.waiting=false}
    catch(error){if(token===scene.revision){scene.error=error.message;scene.waiting=true}}
    schedule();emit()
  }
  function sync(value=settings){
    if(disposed)return;settings=normalizeParticles(value)
    const enabled=settings.particleEnabled&&!forced.matches,manual=settings.particleProgressMode==='manual'
    const contentHosts=[...doc.querySelectorAll('[data-conversation-content][data-conversation-session]')].filter(host=>!host.closest('[data-dcb-sidebar-layout-probe]'))
    const visibleHosts=new Set(contentHosts.filter(host=>host.getClientRects().length)),currentHost=visibleHosts.values().next().value,currentReading=currentHost&&readings.get(currentHost.dataset.conversationSession)
    contextPercent=currentReading?readingFor(currentReading):null
    const candidates=enabled?contentHosts.filter(host=>manual||readings.has(host.dataset.conversationSession)):[]
    for(const host of watchedHosts)if(!candidates.includes(host)){hostResize.unobserve(host);watchedHosts.delete(host)}
    for(const host of candidates)if(!watchedHosts.has(host)){watchedHosts.add(host);hostResize.observe(host)}
    const hosts=candidates.filter(host=>visibleHosts.has(host)).slice(0,MAX_SCENES)
    if(!enabled){for(const scene of [...scenes.values(),...retained])release(scene);armRetention()}
    else for(const [host,scene]of scenes)if(!hosts.includes(host)){
      if(host.isConnected&&host.dataset.conversationSession!==scene.session)release(scene)
      else park(scene)
    }
    const previewOpen=!!doc.querySelector('.dcb-settings')?.getClientRects().length,key=artworkKey()
    for(const host of hosts){
      if(scenes.has(host)&&scenes.get(host).session!==host.dataset.conversationSession)release(scenes.get(host))
      let scene=scenes.get(host)
      if(!scene){
        const cached=[...retained].find(scene=>scene.session===host.dataset.conversationSession&&scene.expires>now())
        if(cached)scene=bind(cached,host)
        else{while(scenes.size+retained.size>=MAX_SCENES&&retained.size)release(retained.values().next().value);scene=create(host)}
      }
      const reading=readings.get(host.dataset.conversationSession)
      scene.percent=reading?readingFor(reading):null
      const canShow=manual||scene.percent!==null&&scene.percent>=settings.particleStart
      scene.layer.toggleAttribute('data-waiting',!canShow||scene.waiting)
      if(canShow&&scene.key!==key)changeModel(scene,key)
      const box=host.getBoundingClientRect(),composer=host.querySelector('[data-composer-seat]')?.getBoundingClientRect()
      // The hero composer is centered welcome content, not a bottom dock.
      // Keep its particles centered across the whole conversation background.
      const bottom=host.dataset.contentPhase!=='hero'&&composer&&composer.top>box.top+40?Math.min(box.height,composer.top-box.top):box.height
      scene.renderer.configure({progress:particleConversion(scene.percent,settings),count:settings.particleCount,light:!doc.body.hasAttribute('data-ds-dark-theme'),visible:scene.visible&&!previewOpen&&!scene.waiting&&canShow,width:Math.max(1,box.width),height:Math.max(1,box.height),bottom})
      scene.layer.style.opacity=canShow?'':'0'
    }
    emit()
  }
  function schedule(){if(!frame&&!disposed)frame=win.requestAnimationFrame(()=>{frame=0;sync()})}
  forced.addEventListener('change',schedule)
  const changed=()=>schedule();doc.addEventListener('visibilitychange',changed)
  return{
    sync,publish(sessionId,pressure,owner){if(disposed)return;if(!readings.has(sessionId))readings.set(sessionId,{session:sessionId,owners:new Map(),last:null,expires:0,timer:0});const entry=readings.get(sessionId);entry.owners.set(owner,particleOccupancy(pressure));readingFor(entry);schedule()},
    forget(sessionId,owner){if(disposed)return;const entry=readings.get(sessionId);if(entry){entry.owners.delete(owner);readingFor(entry);if(!entry.owners.size&&entry.last===null)readings.delete(sessionId)}schedule()},
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},getStatus:()=>lastStatus,
    snapshot:probe.snapshot,
    previewImage(root,revision,count,onError){
      let cancelled=false,renderer=null,budget=count
      const configure=()=>{if(!renderer||cancelled)return;const box=root.getBoundingClientRect(),referenceHeight=[...scenes.values()].find(scene=>scene.shape==='image')?.renderer.snapshot().rect[3]||Math.max(320,win.innerHeight*.75);renderer.configure({width:box.width,height:box.height,bottom:box.height,referenceHeight,progress:1,count:budget,light:!doc.body.hasAttribute('data-ds-dark-theme'),visible:!doc.hidden&&!forced.matches})}
      const resize=new win.ResizeObserver(configure),theme=new win.MutationObserver(configure)
      const release=()=>{if(cancelled)return;cancelled=true;resize.disconnect();theme.disconnect();forced.removeEventListener('change',configure);doc.removeEventListener('visibilitychange',configure);renderer?.dispose();previews.delete(release)}
      previews.add(release);resize.observe(root);theme.observe(doc.body,{attributes:true,attributeFilter:['data-ds-dark-theme']});forced.addEventListener('change',configure);doc.addEventListener('visibilitychange',configure)
      modelFor('image:'+revision).then(model=>{if(cancelled||disposed)return;renderer=createParticleScene(root,doc,win,{preview:true});renderer.setModel(model,'image');configure()}).catch(error=>{if(!cancelled&&!disposed)onError?.(error.message)})
      return{configure(count){budget=count;configure()},dispose:release}
    },
    async importImage(file){
      const token=++imageSequence,asset=await inspectParticleImage(file,doc,win),url=win.URL.createObjectURL(asset.blob)
      let model
      try{model=await sampleParticleArtwork(url)}finally{win.URL.revokeObjectURL(url)}
      if(disposed||token!==imageSequence)throw Error('图片导入已取消')
      await store.saveImage(asset,settings.particleImageRevision)
      if(disposed||token!==imageSequence)throw Error('图片导入已取消')
      for(const key of models.keys())if(key.startsWith('image:'))models.delete(key)
      models.set('image:'+asset.revision,Promise.resolve(model))
      return{particleShape:'image',particleImageRevision:asset.revision,particleImageName:asset.name}
    },
    async clearImage(){imageSequence++;await store.removeImages();for(const key of models.keys())if(key.startsWith('image:'))models.delete(key)},
    async importSVG(file){
      if(!file||file.size>2*1024*1024||!(/\.svg$/i.test(file.name)||file.type==='image/svg+xml'))throw Error('请选择不超过 2 MB 的 SVG 文件')
      const clean=sanitize.sanitize(await file.text());await sampleParticleArtwork(clean.source,{vector:true})
      const asset={xml:clean.xml,name:String(file.name||'自定义.svg').slice(0,160),revision:win.crypto?.randomUUID?.()||String(Date.now())}
      if(disposed)throw Error('粒子背景已关闭');await store.save(asset);svgCache=Promise.resolve(asset);svgKey=asset.revision
      for(const key of models.keys())if(key.startsWith('custom:'))models.delete(key)
      return{particleShape:'custom',particleSvgRevision:asset.revision,particleSvgName:asset.name}
    },
    async clearSVG(){await store.remove();svgCache=null;svgKey='';for(const key of models.keys())if(key.startsWith('custom:'))models.delete(key)},
    dispose(){disposed=true;for(const release of [...previews])release();win.cancelAnimationFrame(frame);win.clearTimeout(retentionTimer);hostResize.disconnect();watchedHosts.clear();for(const scene of [...scenes.values(),...retained])release(scene);for(const entry of readings.values())win.clearTimeout(entry.timer);readings.clear();models.clear();listeners.clear();store.dispose();forced.removeEventListener('change',schedule);doc.removeEventListener('visibilitychange',changed);if(win[diagnostic]===probe){if(oldDiagnostic)Object.defineProperty(win,diagnostic,oldDiagnostic);else delete win[diagnostic]}}
  }
}
