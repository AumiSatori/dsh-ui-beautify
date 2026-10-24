import {htmlDocument} from './background-html.js'
import {normalizeBackground,createBackgroundStore,inspectBackgroundMedia,backgroundThumbnail} from './background-media.js'
export {normalizeBackground} from './background-media.js'

const FLAG='data-dcb-background',SURFACE='data-dcb-background-surface'
const suffix=name=>`:is([class$="_${name}"],[class*="_${name} "])`
const SEEDS=`[data-conversation-content],[data-conversation-scroll],[data-composer-seat],[data-slot="conversation.header"],[data-shell-bottom],${suffix('sidebarCol')} > :first-child,${suffix('centerCol')},${suffix('rightbarCol')},.frame > .nav,.frame > .right`
export const fullBackgroundCss=`
  body[${FLAG}] { isolation:isolate; }
  [data-dcb-background-layer] { position:fixed; inset:0; z-index:-1; overflow:hidden; pointer-events:none!important; user-select:none; }
  [data-dcb-background-layer][hidden] { display:none; }
  [data-dcb-background-layer] > :is(img,video,iframe) { display:block; border:0; width:100%; height:100%; object-fit:var(--dcb-bg-fit,cover); object-position:var(--dcb-bg-position,center); opacity:var(--dcb-bg-opacity,.45); filter:blur(var(--dcb-bg-blur,0px)); }
  body[${FLAG}] [${SURFACE}] { background:transparent!important; }
  body[${FLAG}] ${suffix('sessionList')}::after { background:none!important; }
`

export function createFullBackground(doc,win){
  const store=createBackgroundStore(win),listeners=new Set(),surfaces=new Map(),forced=win.matchMedia('(forced-colors: active)'),reduced=win.matchMedia('(prefers-reduced-motion: reduce)')
  const priorFlag=doc.body.getAttribute(FLAG)
  let settings=normalizeBackground(null),snapshot={error:'',notice:'',preview:'',hasPrevious:false,recent:[]},layer=null,media=null,url=null,timer=0,loaded=false,disposed=false,generation=0,wanted='',assetKind='',htmlSource='',htmlActive=false,pointerTime=0,surfacesDirty=true,surfaceFrame=0,appearanceKey='',soundBlocked=false,infoRevision=null,importSequence=0
  const publish=patch=>{if(disposed)return;const next={...snapshot,...patch};if(Object.keys(next).every(key=>next[key]===snapshot[key]))return;snapshot=next;for(const listener of listeners)listener()}
  const restore=(el,key,value)=>value===null?el.removeAttribute(key):el.setAttribute(key,value)
  function releaseSurfaces(){for(const [node,previous]of surfaces)restore(node,SURFACE,previous);surfaces.clear();restore(doc.body,FLAG,priorFlag);surfacesDirty=true}
  function syncSurfaces(){
    const active=loaded&&settings.backgroundEnabled&&!forced.matches
    if(layer)layer.hidden=!active
    if(!active){releaseSurfaces();return}
    if(!doc.body.hasAttribute(FLAG))doc.body.setAttribute(FLAG,'')
    if(!surfacesDirty)return
    surfacesDirty=false
    const wanted=new Set()
    // Only layout paths are transparent. Dialogs, menus, cards and editable
    // message surfaces keep their own native fills and focus/contrast behavior.
    for(const seed of doc.querySelectorAll(SEEDS)){
      if(seed.closest('[role="dialog"],[role="menu"],.dcb-settings'))continue
      for(let node=seed;node&&node!==doc.body;node=node.parentElement)wanted.add(node)
    }
    const root=doc.getElementById('root');if(root)wanted.add(root)
    for(const [node,previous]of surfaces)if(!wanted.has(node)){restore(node,SURFACE,previous);surfaces.delete(node)}
    for(const node of wanted)if(!surfaces.has(node)){surfaces.set(node,node.getAttribute(SURFACE));node.setAttribute(SURFACE,'')}
  }
  function releaseMedia(){
    htmlSource='';htmlActive=false
    win.clearTimeout(timer);timer=0;loaded=false;appearanceKey='';soundBlocked=false
    if(media){media.onload=null;media.onloadeddata=null;media.onerror=null;if(assetKind==='video')media.pause();media.removeAttribute('src');if(assetKind==='video')media.load()}
    layer?.remove();layer=null;media=null
    if(url){win.URL.revokeObjectURL(url);url=null}
    releaseSurfaces()
  }
  function appearance(){
    if(!layer)return
    const key=[settings.backgroundFit,settings.backgroundPosition,settings.backgroundOpacity,settings.backgroundBlur].join(':')
    if(appearanceKey===key)return
    appearanceKey=key
    layer.style.setProperty('--dcb-bg-fit',settings.backgroundFit);layer.style.setProperty('--dcb-bg-position',settings.backgroundPosition)
    layer.style.setProperty('--dcb-bg-opacity',String(settings.backgroundOpacity/100));layer.style.setProperty('--dcb-bg-blur',settings.backgroundBlur+'px')
  }
  function playback(){
    if(media&&assetKind==='html'&&loaded){
      const active=!doc.hidden&&!forced.matches&&!reduced.matches&&settings.backgroundEnabled&&settings.backgroundOpacity>0;
      if(active!==htmlActive){htmlActive=active;media.srcdoc=active?htmlDocument(htmlSource):'<!doctype html><style>body{background:#061625}</style>'}
      return
    }
    if(!media||assetKind!=='video'||!loaded)return
    const player=media,token=generation
    player.muted=!settings.backgroundSound||soundBlocked
    if(doc.hidden||forced.matches||reduced.matches||!settings.backgroundEnabled||settings.backgroundOpacity===0){player.pause();return}
    if(!player.paused)return
    try{Promise.resolve(player.play()).catch(()=>{
      if(disposed||token!==generation||player!==media||doc.hidden||forced.matches||reduced.matches)return
      if(!player.muted){soundBlocked=true;player.muted=true;publish({notice:'自动播放未允许声音，背景已改为静音；可重新打开声音开关。'});Promise.resolve(player.play()).catch(()=>publish({notice:'视频尚未播放，请重新开启全图背景。'}))}
      else publish({notice:'视频尚未播放，请重新开启全图背景。'})
    })}catch{publish({notice:'视频尚未播放，请重新开启全图背景。'})}
  }
  const visibility=()=>{syncSurfaces();playback()}
  async function load(revision){
    const token=++generation
    try{
      const state=await store.read()
      if(disposed||token!==generation)return
      publish({hasPrevious:!!state.previous,recent:state.recent})
      const asset=state.current
      if(!asset?.blob||asset.revision!==revision)throw Error('找不到这张本机背景，请重新导入')
      releaseMedia();assetKind=asset.kind
      if(!['image','video','html'].includes(assetKind))throw Error('背景文件不可用，请重新导入')
      layer=doc.createElement('div');layer.setAttribute('data-dcb-background-layer','');layer.setAttribute('aria-hidden','true');layer.hidden=true
      if(assetKind==='html'){
        htmlSource=await asset.blob.text();if(disposed||token!==generation)return;
        media=doc.createElement('iframe');media.title='HTML 动态背景';media.setAttribute('sandbox','allow-scripts');media.setAttribute('referrerpolicy','no-referrer');media.tabIndex=-1;
        layer.append(media);appearance();doc.body.prepend(layer);loaded=true;publish({error:'',preview:''});syncSurfaces();playback();return
      }
      media=doc.createElement(assetKind==='video'?'video':'img');const player=media
      const fail=()=>{if(disposed||token!==generation)return;releaseMedia();publish({error:'背景加载失败，请重新导入兼容的图片或视频',preview:''})}
      const ready=()=>{
        if(disposed||token!==generation||loaded)return
        loaded=true;win.clearTimeout(timer);timer=0
        const preview=asset.preview||backgroundThumbnail(player,asset,doc)
        publish({error:'',preview});syncSurfaces();playback()
      }
      if(assetKind==='video'){player.muted=true;player.defaultMuted=true;player.loop=true;player.playsInline=true;player.preload='auto';player.disablePictureInPicture=true;player.onloadeddata=ready}
      else{player.alt='';player.onload=ready}
      player.onerror=fail;layer.append(player);appearance();doc.body.prepend(layer)
      url=win.URL.createObjectURL(asset.blob);timer=win.setTimeout(fail,10000);player.src=url
    }catch(error){if(disposed||token!==generation)return;releaseMedia();publish({error:error.message,preview:''})}
  }
  function sync(value){
    if(disposed)return
    const next=normalizeBackground(value)
    if(next.backgroundSound!==settings.backgroundSound){soundBlocked=false;publish({notice:''})}
    settings=next
    if(infoRevision!==settings.backgroundRevision){
      infoRevision=settings.backgroundRevision;const revision=infoRevision
      publish({preview:''})
      store.read().then(async state=>{
        if(disposed||infoRevision!==revision)return
        publish({hasPrevious:!!state.previous,recent:state.recent})
        if(state.current?.revision!==revision)return
        if(state.current.preview)publish({preview:state.current.preview})
        else if(!settings.backgroundEnabled&&state.current.kind!=='html'){
          // Upgrade older files once in memory. Decode only a first frame and
          // release it immediately; the settings page never loops a second video.
          try{const asset=await inspectBackgroundMedia(state.current.blob,doc,win);if(infoRevision===revision)publish({preview:asset.preview})}catch{/* The real player reports any asset error when enabled. */}
        }
      },()=>{})
    }
    const key=settings.backgroundEnabled?settings.backgroundRevision:''
    if(key!==wanted){wanted=key;publish({error:'',notice:''});if(key)load(key);else{generation++;releaseMedia()}}
    appearance();syncSurfaces();playback()
  }
  // Chat scrolling and streaming do not rescan the layout or redraw an image.
  const structure=new win.MutationObserver(records=>{
    if(!loaded||disposed)return
    const changed=records.some(record=>[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&(node.matches(SEEDS)||!record.target.closest?.('[data-conversation-scroll],[data-chat-flow]')&&node.querySelector(SEEDS))))
    if(!changed)return
    surfacesDirty=true
    if(!surfaceFrame)surfaceFrame=win.requestAnimationFrame(()=>{surfaceFrame=0;syncSurfaces()})
  })
  structure.observe(doc.body,{subtree:true,childList:true})
  const pointer=event=>{if(assetKind!=='html'||!htmlActive||!media||Date.now()-pointerTime<50)return;pointerTime=Date.now();media.contentWindow?.postMessage({type:'dcb-background-pointer',x:event.clientX/win.innerWidth,y:event.clientY/win.innerHeight},'*')}
  doc.addEventListener('pointermove',pointer,{passive:true});
  doc.addEventListener('visibilitychange',visibility);forced.addEventListener('change',visibility);reduced.addEventListener('change',visibility)
  return{
    sync,subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener)},getSnapshot:()=>snapshot,
    async readHtml(){const state=await store.read();if(state.current?.kind!=='html')throw Error('当前背景不是 HTML');return state.current.blob.text()},
    async importHtml(source,name){
      if(typeof source!=='string'||!source.trim())throw Error('请输入 HTML 代码');
      const blob=new win.Blob([source],{type:'text/html'});if(blob.size>2*1024*1024)throw Error('HTML 需小于 2MB');
      const request=++importSequence,asset={blob,type:'text/html',kind:'html',name,revision:win.crypto.randomUUID(),preview:''};
      if(disposed||request!==importSequence)throw Error('背景设置已关闭');
      const state=await store.replace(asset);publish({hasPrevious:!!state.previous,recent:state.recent});return asset
    },
    async import(file){const request=++importSequence,asset=await inspectBackgroundMedia(file,doc,win);if(disposed||request!==importSequence)throw Error('已取消较早的背景导入');const state=await store.replace(asset);if(disposed)throw Error('背景设置已关闭');publish({hasPrevious:!!state.previous,recent:state.recent});return asset},
    async select(revision){importSequence++;const state=await store.select(revision);publish({hasPrevious:!!state.previous,recent:state.recent});return state.current},
    async restore(){importSequence++;const state=await store.restore();publish({hasPrevious:!!state.previous,recent:state.recent});return state.current},
    async clear(){importSequence++;await store.clear();publish({hasPrevious:false,preview:''})},
    dispose(){doc.removeEventListener('pointermove',pointer);disposed=true;generation++;importSequence++;structure.disconnect();win.cancelAnimationFrame(surfaceFrame);releaseMedia();store.dispose();listeners.clear();doc.removeEventListener('visibilitychange',visibility);forced.removeEventListener('change',visibility);reduced.removeEventListener('change',visibility)},
  }
}
