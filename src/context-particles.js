import whaleImage from '../assets/context-whale.jpg'
import {createParticleScene,sampleParticleArtwork} from './context-particle-renderer.js'
import {createParticleSVG} from './context-particle-svg.js'

import {normalizeParticles,particleOccupancy,particleProgress} from './context-particle-config.js'
export {normalizeParticles} from './context-particle-config.js'

export const contextParticlesCss=`
  [data-dcb-particles-host] { isolation:isolate; }
  .dcb-particle-layer { position:absolute; inset:0; z-index:-1; overflow:hidden; pointer-events:none!important; user-select:none; opacity:1; transition:opacity 260ms cubic-bezier(.4,0,.2,1); }
  .dcb-particle-layer canvas { display:block; position:absolute; inset:0; width:100%; height:100%; pointer-events:none!important; }
  .dcb-particle-layer[data-waiting] { opacity:0; }
  @media(prefers-reduced-motion:reduce) { .dcb-particle-layer { transition:none; } }
  @media(forced-colors:active) { .dcb-particle-layer { visibility:hidden; } }
`

function svgStorage(win){
  let opening=null,database=null,disposed=false
  const open=()=>{
    if(opening)return opening
    opening=new Promise((resolve,reject)=>{
      if(!win.indexedDB){reject(Error('浏览器未开放本机 SVG 存储'));return}
      const request=win.indexedDB.open('dsh-ui-context-particles',1)
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('artwork'))request.result.createObjectStore('artwork')}
      request.onerror=()=>{opening=null;reject(Error('无法打开本机 SVG 存储'))}
      request.onblocked=()=>{opening=null;reject(Error('SVG 存储被占用，请关闭其他设置窗口后重试'))}
      request.onsuccess=()=>{
        if(disposed){request.result.close();reject(Error('SVG 存储已关闭'));return}
        database=request.result;database.onversionchange=()=>{database.close();database=null;opening=null};resolve(database)
      }
    });return opening
  }
  async function run(mode,action){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('artwork',mode),request=action(tx.objectStore('artwork'));let result;request.onsuccess=()=>result=request.result;tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(Error('无法保存 SVG，请检查本机可用空间'))})}
  return{load:()=>run('readonly',store=>store.get('current')),save:asset=>run('readwrite',store=>store.put(asset,'current')),remove:()=>run('readwrite',store=>store.delete('current')),dispose(){disposed=true;database?.close();database=null}}
}

export function createContextParticles(doc,win,{logoPath,logoBox}={}){
  const readings=new Map(),scenes=new Map(),models=new Map(),listeners=new Set(),store=svgStorage(win),sanitize=createParticleSVG(doc,win)
  const forced=win.matchMedia('(forced-colors: active)')
  let settings=normalizeParticles(null),disposed=false,frame=0,lastStatus='',svgCache=null,svgKey=''
  const artworkKey=()=>settings.particleShape==='custom'?'custom:'+settings.particleSvgRevision:settings.particleShape
  const status=()=>[...scenes.values()].map(scene=>({percent:scene.percent,shape:scene.shape,waiting:scene.waiting,error:scene.error||null,...scene.renderer.snapshot()}))
  const emit=()=>{const key=JSON.stringify(status().map(({percent,shape,waiting,error})=>({percent,shape,waiting,error})));if(lastStatus===key)return;lastStatus=key;for(const listener of listeners)listener()}
  const diagnostic=Symbol.for('dsh-ui-beautify.context-particles.v1'),oldDiagnostic=Object.getOwnPropertyDescriptor(win,diagnostic)
  const probe=Object.freeze({snapshot:()=>({enabled:settings.particleEnabled,shape:settings.particleShape,start:settings.particleStart,full:settings.particleFull,count:settings.particleCount,scenes:status()})})
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
        if(key==='whale')return sampleParticleArtwork(whaleImage)
        if(key.startsWith('custom:'))return sampleParticleArtwork(await custom(),{vector:true})
        if(typeof logoPath!=='string'||!logoBox?.width||!logoBox?.height)throw Error('宿主 DeepSeek Logo 尚未就绪')
        // Brand geometry comes from the host's public primitive, not a redraw.
        const xml=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${logoBox.width} ${logoBox.height}"><path fill="#4d6bfe" d="${logoPath}"/></svg>`
        return sampleParticleArtwork('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml),{vector:true})
      })();models.set(key,pending);pending.catch(()=>{if(models.get(key)===pending)models.delete(key)})
    }
    return models.get(key)
  }
  function remove(host){const scene=scenes.get(host);if(!scene)return;scene.revision++;scene.resize.disconnect();scene.intersection.disconnect();scene.renderer.dispose();scene.layer.remove();host.removeAttribute('data-dcb-particles-host');scenes.delete(host)}
  function create(host){
    const layer=doc.createElement('div');layer.className='dcb-particle-layer';layer.setAttribute('aria-hidden','true');layer.setAttribute('data-waiting','');
    host.setAttribute('data-dcb-particles-host','');host.prepend(layer)
    const scene={host,session:host.dataset.conversationSession,layer,renderer:createParticleScene(layer,doc,win),key:null,percent:null,shape:null,waiting:true,visible:true,revision:0,resize:new win.ResizeObserver(schedule),intersection:new win.IntersectionObserver(entries=>{scene.visible=entries[0].isIntersecting;schedule()})}
    scene.resize.observe(host);const composer=host.querySelector('[data-composer-seat]');if(composer)scene.resize.observe(composer)
    scene.intersection.observe(host);scenes.set(host,scene);return scene
  }
  async function changeModel(scene,key){
    scene.key=key;scene.waiting=true;scene.error=null;const token=++scene.revision
    try{const model=await modelFor(key);if(disposed||token!==scene.revision||!scenes.has(scene.host))return;scene.renderer.setModel(model,key.startsWith('custom:')?'svg':'default');scene.shape=key.startsWith('custom:')?'custom':key;scene.waiting=false}
    catch(error){if(token===scene.revision){scene.error=error.message;scene.waiting=true}}
    schedule();emit()
  }
  function sync(value=settings){
    if(disposed)return;settings=normalizeParticles(value)
    const hosts=settings.particleEnabled&&!forced.matches?[...doc.querySelectorAll('[data-conversation-content][data-conversation-session]')].filter(host=>host.getClientRects().length&&readings.has(host.dataset.conversationSession)).slice(0,2):[]
    for(const host of scenes.keys())if(!hosts.includes(host))remove(host)
    const previewOpen=!!doc.querySelector('.dcb-settings')?.getClientRects().length,key=artworkKey()
    for(const host of hosts){
      if(scenes.has(host)&&scenes.get(host).session!==host.dataset.conversationSession)remove(host)
      const scene=scenes.get(host)||create(host),reading=readings.get(host.dataset.conversationSession)
      scene.percent=[...reading.values()].at(-1);scene.layer.toggleAttribute('data-waiting',scene.percent===null||scene.waiting)
      if(scene.percent!==null&&scene.key!==key)changeModel(scene,key)
      const box=host.getBoundingClientRect(),composer=host.querySelector('[data-composer-seat]')?.getBoundingClientRect()
      const bottom=composer&&composer.top>box.top+40?Math.min(box.height,composer.top-box.top):box.height
      scene.renderer.configure({progress:particleProgress(scene.percent,settings.particleStart,settings.particleFull),count:settings.particleCount,light:!doc.body.hasAttribute('data-ds-dark-theme'),visible:scene.visible&&!previewOpen&&scene.percent!==null&&!scene.waiting&&scene.percent>=settings.particleStart,width:Math.max(1,box.width),height:Math.max(1,box.height),bottom})
      scene.layer.style.opacity=scene.percent!==null&&scene.percent>=settings.particleStart?'':'0'
    }
    emit()
  }
  function schedule(){if(!frame&&!disposed)frame=win.requestAnimationFrame(()=>{frame=0;sync()})}
  forced.addEventListener('change',schedule)
  const changed=()=>schedule();doc.addEventListener('visibilitychange',changed)
  return{
    sync,publish(sessionId,pressure,owner){if(disposed)return;if(!readings.has(sessionId))readings.set(sessionId,new Map());readings.get(sessionId).set(owner,particleOccupancy(pressure));schedule()},
    forget(sessionId,owner){if(disposed)return;const owners=readings.get(sessionId);owners?.delete(owner);if(!owners?.size)readings.delete(sessionId);schedule()},
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},getStatus:()=>lastStatus,
    snapshot:probe.snapshot,
    async importSVG(file){
      if(!file||file.size>2*1024*1024||!(/\.svg$/i.test(file.name)||file.type==='image/svg+xml'))throw Error('请选择不超过 2 MB 的 SVG 文件')
      const clean=sanitize.sanitize(await file.text());await sampleParticleArtwork(clean.source,{vector:true})
      const asset={xml:clean.xml,name:String(file.name||'自定义.svg').slice(0,160),revision:win.crypto?.randomUUID?.()||String(Date.now())}
      if(disposed)throw Error('粒子背景已关闭');await store.save(asset);svgCache=Promise.resolve(asset);svgKey=asset.revision
      for(const key of models.keys())if(key.startsWith('custom:'))models.delete(key)
      return{particleShape:'custom',particleSvgRevision:asset.revision,particleSvgName:asset.name}
    },
    async clearSVG(){await store.remove();svgCache=null;svgKey='';for(const key of models.keys())if(key.startsWith('custom:'))models.delete(key)},
    dispose(){disposed=true;win.cancelAnimationFrame(frame);for(const host of scenes.keys())remove(host);readings.clear();models.clear();listeners.clear();store.dispose();forced.removeEventListener('change',schedule);doc.removeEventListener('visibilitychange',changed);if(win[diagnostic]===probe){if(oldDiagnostic)Object.defineProperty(win,diagnostic,oldDiagnostic);else delete win[diagnostic]}}
  }
}
