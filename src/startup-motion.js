import {motion} from './motion.js'
import {createWelcomeArt} from './welcome-strokes.js'
import {normalizeWelcome,playWelcomeInk} from './welcome-font.js'
import {createWelcomeMediaPlayer,welcomeMediaCss} from './welcome-media.js'

const OPENING=Symbol.for('dsh-ui-beautify.startup-motion.v1')
const STATUS=Symbol.for('dsh-ui-beautify.startup-status.v2')
const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`
const suffix=(el,name)=>[...el.classList].some(value=>value.endsWith('_'+name))
const MAX_NODES=96,MAX_PIXELS=4_000_000,WAIT=30000,HOME_GRACE=1000,CONTENT_WAIT=6500
const HOLD=200,EXIT=300,STAGE='data-dcb-startup-stage'
const noop={dispose(){},setSessionState(){},setRestorationTarget(){},setEnabled(){}}

export const startupCss=`
  ${welcomeMediaCss}
  [data-dcb-welcome] { position:fixed; inset:var(--dsh-windows-titlebar-height,0px) 0 0; z-index:2147480000; display:grid; place-items:center; overflow:hidden; background:#fafbfc; color:#27292f; touch-action:manipulation; }
  body[data-ds-dark-theme] [data-dcb-welcome] { background:#1b1b1d; color:#ededf0; }
  [data-dcb-welcome-copy] { width:min(540px,72vw); margin:0; transform-origin:50% 55%; display:flex; flex-direction:column; align-items:center; gap:30px; }
  [data-dcb-welcome-copy][data-media] { width:100%; height:100%; gap:0; }
  [data-dcb-welcome-logo] { display:grid; place-items:center; height:96px; width:120px; color:#111; flex:none; }
  [data-dcb-welcome-logo] svg { display:block; width:100%; height:100%; }
  body[data-ds-dark-theme] [data-dcb-welcome-logo] { color:#ededf0; }
  [data-dcb-welcome-art] { display:block; width:100%; height:auto; overflow:visible; color:#111; }
  [data-dcb-welcome-stroke] { fill:none; stroke-width:5.3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:1; stroke-dashoffset:1; }
  body[data-ds-dark-theme] [data-dcb-welcome-art] { color:#ededf0; }
  [data-dcb-startup-hold] { opacity:0!important; pointer-events:none; }
  .dcb-welcome-sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
  button[data-dcb-welcome-skip] { position:absolute; right:28px; bottom:26px; border:1px solid #8883; border-radius:999px; padding:7px 16px; background:#88888809; color:inherit; font:12px/1.5 system-ui,sans-serif; cursor:pointer; transition:background-color 180ms ease,border-color 180ms ease; }
  button[data-dcb-welcome-skip]:hover { background:#8882; border-color:#8886; }
  button[data-dcb-welcome-skip]:focus-visible { outline:2px solid #888; outline-offset:3px; }
  @media(max-width:600px) { [data-dcb-welcome-copy]:not([data-media]) { width:84vw; } button[data-dcb-welcome-skip] { right:18px; bottom:20px; } }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { [data-dcb-welcome] { display:none; } }
`

// One visible welcome per document. Window activation, host startup, session
// restoration and DOM hydration are independent milestones, never one timer.
export function createStartupMotion(doc,win,options,services={}){
  if(win[OPENING])return noop
  win[OPENING]=true
  const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  const status={stage:'waiting-visible',reason:null,entrances:0,strokes:0}
  win[STATUS]=status
  const settings=normalizeWelcome(options)
  if(!settings.welcomeEnabled){status.stage='done';status.reason='disabled';return noop}
  const previousStage=doc.documentElement.getAttribute(STAGE)
  const active=new Map(),strokeAnimations=[],claimed=new Set(),listeners=[],timers=new Set(),held=new Map()
  let disposed=false,observer=null,raf=0,style=null,overlay=null,copy=null,writing=false,introDone=false,revealing=false,contentEntered=false
  let visibleAt=0,viewReadyAt=0,revealAt=0,deadline=0,settleTimer=0,waitTimer=0,restorationExpected=false,sessionState=null,identity=null,homeReady=false
  let mediaPlayer=null,logo=null,mediaPending=false,mediaLoadTimer=0
  const now=()=>win.performance.now()
  const setStage=value=>{status.stage=value;doc.documentElement.setAttribute(STAGE,value)}
  const on=(target,event,handler,options)=>{target.addEventListener(event,handler,options);listeners.push(()=>target.removeEventListener(event,handler,options))}
  const later=(fn,ms)=>{const id=win.setTimeout(()=>{timers.delete(id);fn()},ms);timers.add(id);return id}
  const cancelTimer=id=>{win.clearTimeout(id);timers.delete(id)}
  const visible=el=>{
    if(!el?.isConnected||!el.getClientRects().length)return false
    const s=win.getComputedStyle(el),r=el.getBoundingClientRect()
    return s.visibility!=='hidden'&&s.display!=='none'&&r.width>.5&&r.height>.5&&r.bottom>0&&r.right>0&&r.top<win.innerHeight&&r.left<win.innerWidth
  }
  const oversized=el=>{const r=el.getBoundingClientRect(),dpr=win.devicePixelRatio||1;return Math.max(r.height,el.scrollHeight)>win.innerHeight*1.5||Math.max(r.width,el.scrollWidth)*Math.max(r.height,el.scrollHeight)*dpr*dpr>MAX_PIXELS}
  function cancel(el){const a=active.get(el);if(a){active.delete(el);a.cancel()}}
  function releaseWelcome(){mediaPending=false;mediaPlayer?.dispose();mediaPlayer=null;logo?.dispose?.();logo=null}
  function hold(el,waiting){
    if(!el)return
    if(waiting){if(!held.has(el))held.set(el,el.getAttribute('data-dcb-startup-hold'));el.setAttribute('data-dcb-startup-hold','')}
    else if(held.has(el)){const previous=held.get(el);if(previous===null)el.removeAttribute('data-dcb-startup-hold');else el.setAttribute('data-dcb-startup-hold',previous);held.delete(el)}
  }
  function finish(reason='complete'){
    if(disposed)return
    disposed=true;status.reason=reason;status.stage='done'
    observer?.disconnect();win.cancelAnimationFrame(raf);raf=0
    for(const id of timers)win.clearTimeout(id);timers.clear()
    for(const remove of listeners)remove();listeners.length=0
    for(const a of strokeAnimations)a.cancel();strokeAnimations.length=0
    for(const el of active.keys())cancel(el)
    for(const el of held.keys())hold(el,false)
    releaseWelcome();overlay?.remove();style?.remove();overlay=null;style=null;copy=null;identity=null;sessionState=null
    if(previousStage===null)doc.documentElement.removeAttribute(STAGE)
    else doc.documentElement.setAttribute(STAGE,previousStage)
  }
  function animate(el,frames,options,key){
    cancel(el)
    try{
      const a=el.animate(frames,{...options,fill:'both'})
      a.id=`dcb-startup-${key}`;active.set(el,a)
      a.finished.then(()=>{if(active.get(el)===a)cancel(el)},()=>{if(active.get(el)===a)active.delete(el)})
      return a
    }catch{return null}
  }
  function showWelcome(){
    if(writing||disposed||doc.hidden)return
    writing=true;visibleAt=now();setStage('writing')
    style=doc.createElement('style');style.setAttribute('data-dcb-startup-style','');style.textContent=startupCss;doc.head.append(style)
    overlay=doc.createElement('div');overlay.setAttribute('data-dcb-welcome','');overlay.setAttribute('role','status');overlay.setAttribute('aria-label',settings.welcomeText)
    copy=doc.createElement('div');copy.setAttribute('data-dcb-welcome-copy','')
    const sr=doc.createElement('span');sr.className='dcb-welcome-sr';sr.textContent=settings.welcomeText;copy.append(sr)
    const skip=doc.createElement('button');skip.type='button';skip.textContent='跳过';skip.setAttribute('data-dcb-welcome-skip','');skip.setAttribute('aria-label','跳过欢迎动画')
    overlay.append(copy,skip);doc.body.append(overlay)
    on(overlay,'pointerdown',()=>finish('skip'))
    on(skip,'click',()=>finish('skip'))
    if(!animate(copy,[{opacity:0,transform:'translateY(10px) scale(.96)'},{opacity:1,transform:'none'}],{duration:300,easing:motion.ease.smooth},'welcome-in')){finish('unsupported');return}
    deadline=later(()=>finish('loading-timeout'),WAIT)
    if(settings.welcomeMode==='media'&&services.mediaStore){
      setStage('loading-media');mediaPending=true
      const fallback=()=>{if(!mediaPending||disposed||revealing)return;mediaPending=false;cancelTimer(mediaLoadTimer);try{showText()}catch{finish('error')}}
      mediaLoadTimer=later(fallback,800)
      services.mediaStore.load().then(asset=>{
        if(!mediaPending||disposed||revealing)return
        if(!asset){fallback();return}
        mediaPending=false;cancelTimer(mediaLoadTimer);copy.setAttribute('data-media','');setStage('playing-media')
        const fail=()=>{if(disposed||revealing)return;mediaPlayer?.dispose();mediaPlayer=null;copy.removeAttribute('data-media');copy.querySelector('[data-dcb-welcome-media]')?.remove();try{showText()}catch{finish('error')}}
        try{
          mediaPlayer=createWelcomeMediaPlayer(doc,win,asset,settings,{onComplete:()=>{if(!disposed){introDone=true;setStage('waiting-content');schedule()}},onError:fail})
          copy.append(mediaPlayer.node)
        }catch{fail()}
      },fallback)
    }else showText()
    schedule()
  }
  function showText(){
    if(disposed||revealing)return
    setStage('writing')
    if(settings.welcomeLogo&&services.createLogo){
      logo=services.createLogo()
      if(logo?.node){logo.node.setAttribute('data-dcb-welcome-logo','');copy.append(logo.node);animate(logo.node,[{opacity:0,transform:'translateY(-12px) scale(.9)',filter:'blur(2px)'},{opacity:1,transform:'none',filter:'none'}],{duration:420,easing:motion.ease.smooth},'logo-in')}
    }
    const art=createWelcomeArt(doc,settings);copy.append(art.svg)
    try{strokeAnimations.push(...playWelcomeInk(art,settings.welcomeDuration));status.strokes=art.strokes.length}catch{finish('unsupported');return}
    later(()=>{introDone=true;setStage('waiting-content');schedule()},settings.welcomeDuration+HOLD)
  }
  function candidates(){
    const body=doc.querySelector(`${names('centerCol')} [data-conversation-content]`)||doc.querySelector('[data-conversation-content]')
    const center=body?.closest(names('centerCol'))||doc.querySelector(names('centerCol'))||body?.closest('main')
    return {body,center,frame:center?.parentElement,id:body?.getAttribute('data-conversation-session')||null}
  }
  function ready({body,center,id}){
    if(!center||!visible(center))return false
    if(!body)return !![...center.children].find(visible)
    const phase=body.getAttribute('data-content-phase')
    if(phase==='settling')return false
    if(id){
      if(sessionState?.id===id&&sessionState.state==='loading')return false
      if(!(sessionState?.id===id&&sessionState.state==='open')&&body.querySelector(`[data-chat-flow] > ${names('hint')}`))return false
    }else if(restorationExpected&&!homeReady){
      if(!waitTimer)waitTimer=later(()=>{homeReady=true;waitTimer=0;schedule()},CONTENT_WAIT)
      return false
    }else if(now()-visibleAt<HOME_GRACE)return false
    return !!body.querySelector('[data-composer-card]')||!!body.querySelector('[data-chat-flow]')||!phase&&!![...body.querySelector('[data-conversation-scroll]')?.children||[]].find(visible)
  }
  function safeMotion(el){
    // Never transform a titlebar ancestor. Dense trees get a fade, without an
    // unbounded scan; long history is handled separately below.
    const walk=doc.createTreeWalker(el,win.NodeFilter.SHOW_ELEMENT)
    let visited=0
    for(let child=el;child;child=walk.nextNode()){
      if(++visited>MAX_NODES)return false
      if(win.getComputedStyle(child).position==='fixed')return false
    }
    return true
  }
  function enter(el,key,{duration=360,delay=0,x=0,y=16,blur=2}={}){
    if(!el||claimed.has(key)||!visible(el)||oversized(el)||el===doc.body)return
    claimed.add(key)
    const s=win.getComputedStyle(el),frames=[{opacity:0},{opacity:s.opacity}],moving=safeMotion(el)
    if(moving){frames[0].transform=`translate3d(${x}px,${y}px,0)${s.transform==='none'?'':` ${s.transform}`}`;frames[1].transform=s.transform;frames[0].filter=`blur(${blur}px)${s.filter==='none'?'':` ${s.filter}`}`;frames[1].filter=s.filter}
    if(animate(el,frames,{duration,delay:Math.max(0,delay-(now()-revealAt)),easing:motion.ease.smooth},key))status.entrances++
  }
  function visibleHistory(view,body){
    const scroll=body.querySelector('[data-conversation-scroll]'),r=scroll?.getBoundingClientRect()
    if(!r)return[]
    const seat=body.querySelector('[data-composer-seat]')?.getBoundingClientRect(),bottom=Math.min(win.innerHeight,r.bottom,seat?.top??r.bottom),top=Math.max(0,r.top),found=new Set()
    if(bottom<=top)return[]
    // The overlay intercepts pointer input, so use elementsFromPoint and ignore
    // it for sampling. Four viewport points; no full-history query or cloning.
    for(const fraction of[.15,.4,.65,.9]){
      const hit=doc.elementsFromPoint(Math.max(1,Math.min(win.innerWidth-1,r.left+r.width*.5)),top+(bottom-top)*fraction).find(el=>view.contains(el))
      if(!hit)continue
      const row=hit.closest('[data-chat-flow-kind], [data-chat-flow-key], [data-chat-turn], [data-slot="conversation.chat.node"]')
      const target=row&&!oversized(row)?row:hit.closest('p, pre, table, article')
      if(target&&view.contains(target)&&visible(target)&&!oversized(target))found.add(target)
    }
    return [...found].filter(el=>![...found].some(other=>other!==el&&other.contains(el))).slice(0,4)
  }
  function revealParts(parts,mainReady=true){
    const {body,center,frame}=parts
    for(const el of held.keys())if(el!==body)hold(el,false)
    const awaitingRestore=!!body&&!parts.id&&restorationExpected&&!homeReady
    hold(body,awaitingRestore)
    if(body&&!awaitingRestore){
      const scroll=body.querySelector('[data-conversation-scroll]'),view=scroll&&[...scroll.children].find(el=>!el.hasAttribute('data-composer-seat')&&visible(el))
      if(mainReady){
        if(view&&!oversized(view))enter(view,'main',{duration:300,delay:70,y:12})
        else if(view)for(const [i,el]of visibleHistory(view,body).entries())enter(el,'main-'+i,{duration:300,delay:70+i*24,y:12})
        else enter(body.querySelector(names('headline')),'main',{duration:300,delay:70,y:12})
      }
      enter(body.querySelector('[data-composer-card]'),'composer',{duration:420,delay:220,y:24,blur:3})
    }else if(!body&&center&&mainReady)enter([...center.children].find(visible),'main',{duration:300,delay:70,y:12})
    const column=frame?.querySelector(names('sidebarCol')),root=column&&[...column.querySelectorAll(names('root'))].find(el=>[...el.children].some(child=>suffix(child,'logoRow')))
    if(!root)return
    const keys=['brand','newSession','panelList','regionArea','footArea']
    if(frame.getAttribute('data-sidebar-collapsed')==='true'||suffix(root,'collapsed')){for(const key of keys)claimed.add('sidebar-'+key);return}
    for(const [index,key]of keys.entries()){
      const el=key==='brand'?root.querySelector(`${names('logoRow')} ${names(key)}`):[...root.children].find(el=>suffix(el,key))
      enter(el,'sidebar-'+key,{duration:420,delay:340+index*24,x:-22,y:0,blur:3})
    }
  }
  function reveal(parts,mainReady){
    if(disposed||revealing)return
    revealing=true;identity={body:parts.body,id:parts.id};revealAt=now();setStage('revealing')
    contentEntered=mainReady
    if(mainReady){cancelTimer(deadline);cancelTimer(waitTimer);later(()=>finish(),1000)}
    // Stage the live seats before the veil fades; they cannot flash fully on
    // screen and then jump back to the first frame.
    revealParts(parts,mainReady)
    mediaPlayer?.freeze()
    const exitFrames=copy.hasAttribute('data-media')?[{opacity:1},{opacity:0}]:[{opacity:1,transform:'none',filter:'blur(0px)'},{opacity:0,transform:'translateY(-18px) scale(1.035)',filter:'blur(3px)'}]
    animate(copy,exitFrames,{duration:EXIT,easing:motion.ease.color},'welcome-out')
    if(!animate(overlay,[{opacity:1},{opacity:0}],{duration:EXIT,easing:motion.ease.color},'veil-out')){finish('unsupported');return}
    later(()=>{releaseWelcome();overlay?.remove();overlay=null;copy=null;for(const a of strokeAnimations)a.cancel();strokeAnimations.length=0;setStage('entering')},EXIT)
  }
  function scan(){
    raf=0;if(disposed||doc.hidden)return
    if(quiet.matches){finish('reduced-motion');return}
    if(!writing){try{showWelcome()}catch{finish('error')}return}
    for(const el of active.keys())if(!el.isConnected||el!==overlay&&el!==copy&&oversized(el))cancel(el)
    const parts=candidates()
    if(revealing){
      if(contentEntered&&(parts.body!==identity.body||parts.id!==identity.id)){finish('navigation');return}
      identity={body:parts.body,id:parts.id}
      if(!contentEntered&&ready(parts)){contentEntered=true;cancelTimer(deadline);cancelTimer(waitTimer);later(()=>finish(),1000)}
      revealParts(parts,contentEntered);return
    }
    const mainReady=ready(parts)
    if(!mainReady){viewReadyAt=0;cancelTimer(settleTimer);settleTimer=0}
    // Let native restoration/scroll anchoring settle. A ready Session hint is
    // observed; a full transcript layout is never polled frame by frame.
    if(mainReady&&!viewReadyAt){viewReadyAt=now();settleTimer=later(schedule,80)}
    // Handwriting has a fixed ending. Slow history may arrive later, but it
    // must never extend the welcome screen or hold the whole app behind it.
    if(introDone)reveal(parts,mainReady&&now()-viewReadyAt>=60)
  }
  function schedule(){if(!raf&&!disposed)raf=win.requestAnimationFrame(scan)}
  function begin(){
    if(disposed||doc.hidden)return
    if(!observer){observer=new win.MutationObserver(schedule);observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','data-conversation-session','data-content-phase','data-sidebar-collapsed']})}
    schedule()
  }
  if(quiet.matches||!doc.body||typeof win.Element?.prototype.animate!=='function'){finish('unsupported');return noop}
  on(quiet,'change',()=>{if(quiet.matches)finish('reduced-motion')})
  on(doc,'keydown',()=>finish('keyboard'),true)
  on(doc,'pointerdown',event=>{if(!overlay||!overlay.contains(event.target))finish('interaction')},true)
  on(doc,'visibilitychange',()=>{if(doc.hidden){if(writing)finish('hidden')}else begin()})
  on(win,'pagehide',()=>finish('pagehide'))
  begin()
  return{dispose:()=>finish('dispose'),setEnabled(enabled){if(!enabled)finish('disabled')},setRestorationTarget(id){if(!disposed&&id){restorationExpected=true;schedule()}},setSessionState(id,state){if(!disposed){sessionState={id,state};schedule()}}}
}
