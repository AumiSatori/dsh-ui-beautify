import {motion} from './motion.js'

const MODE='data-dcb-background-only',RETURNING='data-dcb-background-returning',PATH='data-dcb-background-path',HIDDEN='data-dcb-focus-hidden'
const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`
const BACKGROUND='[data-dcb-background-layer],.dcb-particle-layer',CONTENT='[data-conversation-content]'
const PORTALS='.dcb-file-viewer,.dcb-summary,[data-shell-bottom]'
export const focusModeCss=`
  .dcb-focus-toggle { position:relative; display:inline-grid; place-items:center; flex:none; width:30px; height:30px; padding:0; margin-left:6px; border:1px solid #8883; border-radius:9px; background:#ffffff66; color:var(--dsw-alias-label-primary,#303237); cursor:pointer; -webkit-app-region:no-drag; transition:background-color ${motion.time.quick}ms ${motion.ease.color},border-color ${motion.time.quick}ms ${motion.ease.color},transform ${motion.time.control}ms ${motion.ease.smooth}; }
  .dcb-focus-toggle::before { content:''; position:absolute; inset:-7px; }
  .dcb-focus-toggle:hover { background:#8882; border-color:#8886; }
  .dcb-focus-toggle:active { transform:scale(.95); }
  .dcb-focus-toggle:focus-visible { outline:2px solid var(--dsh-settings-accent,#6c6cf6); outline-offset:3px; }
  .dcb-focus-toggle svg { display:block; width:17px; height:17px; }
  body[data-ds-dark-theme] .dcb-focus-toggle { background:#252830; color:#eef0f6; border-color:#ffffff36; }
  .dcb-background-tools { position:fixed; z-index:2147483000; top:calc(var(--dsh-windows-titlebar-height,0px) + 14px); right:max(18px,env(safe-area-inset-right)); display:flex; align-items:center; gap:8px; }
  .dcb-background-theme { position:relative; display:inline-grid; place-items:center; flex:none; width:44px; height:44px; padding:0; margin:0; border:1px solid #8883; border-radius:13px; background:#f5f6f9; color:var(--dsw-alias-label-primary,#303237); box-shadow:0 2px 10px #00000012; cursor:pointer; -webkit-app-region:no-drag; transition:background-color ${motion.time.quick}ms ${motion.ease.color},border-color ${motion.time.quick}ms ${motion.ease.color},transform ${motion.time.control}ms ${motion.ease.smooth}; }
  .dcb-background-theme:hover { background:#8883; }
  .dcb-background-theme:active { transform:scale(.95); }
  .dcb-background-theme:focus-visible { outline:2px solid var(--dsh-settings-accent,#6c6cf6); outline-offset:3px; }
  .dcb-background-theme svg { position:absolute; display:block; width:20px; height:20px; transition:opacity ${motion.time.control}ms ${motion.ease.color},transform ${motion.time.standard}ms ${motion.ease.smooth}; }
  .dcb-background-theme .dcb-background-moon { opacity:0; transform:rotate(-35deg) scale(.75); }
  body[data-ds-dark-theme] .dcb-background-theme { background:#252830; border-color:#ffffff36; color:#eef0f6; box-shadow:0 2px 10px #00000040; }
  body[data-ds-dark-theme] .dcb-background-theme:hover { background:#31353f; }
  body[data-ds-dark-theme] .dcb-background-theme .dcb-background-sun { opacity:0; transform:rotate(55deg) scale(.75); }
  body[data-ds-dark-theme] .dcb-background-theme .dcb-background-moon { opacity:1; transform:none; }
  .dcb-background-exit { position:relative; width:44px; height:44px; margin:0; border-radius:13px; background:#f5f6f9; box-shadow:0 2px 10px #00000012; }
  .dcb-background-exit::before { display:none; }
  [${HIDDEN}],[${HIDDEN}] * { visibility:hidden!important; pointer-events:none!important; }
  body[${MODE}] [${PATH}] { background:transparent!important; box-shadow:none!important; filter:none!important; backdrop-filter:none!important; -webkit-backdrop-filter:none!important; }
  /* Scope the optical transition to this mode, so normal background sliders
     still follow the pointer directly. CSS reverses from the current frame. */
  body[${MODE}] [data-dcb-background-layer] > :is(img,video,iframe) { transition:filter ${motion.time.material}ms ${motion.ease.smooth},opacity ${motion.time.material}ms ${motion.ease.color}; }
  body[${MODE}]:not([${RETURNING}]) [data-dcb-background-layer] > :is(img,video,iframe),body[${MODE}] .dcb-particle-layer { filter:none!important; backdrop-filter:none!important; -webkit-backdrop-filter:none!important; }
  body[${MODE}]:not([${RETURNING}]) [data-dcb-background-layer] > :is(img,video,iframe) { opacity:1!important; }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { body[${MODE}] [data-dcb-background-layer] > :is(img,video,iframe) { transition:none; } }
  @media(prefers-reduced-motion:reduce) { .dcb-focus-toggle { transition:none; } .dcb-focus-toggle:active { transform:none; } .dcb-background-theme { transition:none; } .dcb-background-theme:active { transform:none; } .dcb-background-theme svg { transition:none; } }
  @media(forced-colors:active) { .dcb-focus-toggle { background:ButtonFace; color:ButtonText; border-color:ButtonText; box-shadow:none; } .dcb-focus-toggle:focus-visible { outline-color:Highlight; } .dcb-background-theme { background:ButtonFace; color:ButtonText; border-color:ButtonText; box-shadow:none; } .dcb-background-theme:focus-visible { outline-color:Highlight; } }
`

// Preserve layout, drafts and mounted backgrounds. Only UI branches fade out;
// the independent exit stays outside the hidden header. No idle frame loop.
export function createFocusMode(React,doc,win,schedule=()=>{}){
  const h=React.createElement,listeners=new Set(),records=new Map(),paths=new Map(),animations=new Map()
  const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let snapshot={active:false},frame=null,trigger=null,tools=null,exitButton=null,themeButton=null,bodyMark=null,returnMark=null,disposed=false,revision=0,pending=0,scrolls=[]
  const restore=(node,key,value)=>value===null?node.removeAttribute(key):node.setAttribute(key,value)
  const publish=active=>{if(snapshot.active===active)return;snapshot={active};for(const listener of listeners)listener()}
  const subscribe=listener=>{listeners.add(listener);return()=>listeners.delete(listener)}
  const calm=()=>quiet.matches||doc.hidden
  const paint=()=>new Map([...animations.keys()].map(node=>[node,win.getComputedStyle(node).opacity]))
  const cancel=()=>{for(const animation of animations.values())animation.cancel();animations.clear()}
  function release(node,record){restore(node,HIDDEN,record.hidden);restore(node,'inert',record.inert);restore(node,'aria-hidden',record.aria);records.delete(node)}
  function path(node){if(!paths.has(node)){
    const copied=node.hasAttribute(PATH)?[...paths].find(([old])=>!old.isConnected&&old.tagName===node.tagName&&old.className===node.className):null
    paths.set(node,copied?copied[1]:node.getAttribute(PATH));node.setAttribute(PATH,'')
  }}
  function collect(){
    const result=new Set()
    const walk=node=>{
      if(node.matches(BACKGROUND)||node===exitButton)return
      if(node.matches(CONTENT)||node.querySelector(`${CONTENT},${BACKGROUND}`)||win.getComputedStyle(node).display==='contents'){
        path(node);for(const child of node.children)walk(child)
      }else result.add(node)
    }
    walk(frame)
    for(let node=frame.parentElement;node&&node!==doc.body;node=node.parentElement)path(node)
    for(const node of doc.querySelectorAll(PORTALS))if(!node.closest('[role=dialog],.dcb-settings')&&!frame.contains(node))result.add(node)
    return [...result].filter(node=>!node.closest(BACKGROUND)&&![...result].some(parent=>parent!==node&&parent.contains(node)))
  }
  function reconcile(){
    pending=0
    if(disposed||!snapshot.active)return
    if(!frame?.isConnected||!frame.querySelector('.dcb-focus-toggle')){exit(false);return}
    const wanted=new Set(collect())
    const detached=[...records].filter(([node])=>!node.isConnected)
    for(const[node,record]of records)if(!wanted.has(node))release(node,record)
    for(const node of wanted)if(!records.has(node)){
      const copied=node.hasAttribute(HIDDEN)?detached.find(([old])=>old.tagName===node.tagName&&old.className===node.className)?.[1]:null
      const record=copied?{...copied}:{hidden:node.getAttribute(HIDDEN),inert:node.getAttribute('inert'),aria:node.getAttribute('aria-hidden')}
      records.set(node,record);node.setAttribute('inert','');node.setAttribute('aria-hidden','true');node.setAttribute(HIDDEN,'')
    }
    for(const[node,value]of paths)if(!node.isConnected){restore(node,PATH,value);paths.delete(node)}
  }
  function queue(){if(!pending&&!disposed)pending=win.requestAnimationFrame(reconcile)}
  const observer=new win.MutationObserver(entries=>{
    if(!snapshot.active)return
    // Streaming words in an already hidden branch require no presentation work.
    if(entries.some(entry=>[...entry.removedNodes].some(node=>node.nodeType===1&&(node.matches(`.dcb-focus-toggle,${CONTENT}`)||node.querySelector(`.dcb-focus-toggle,${CONTENT}`)))||!entry.target.closest?.(`[${HIDDEN}],${BACKGROUND}`)&&[...entry.addedNodes,...entry.removedNodes].some(node=>node.nodeType===1)))queue()
  })
  function finish(active,instant=false){
    cancel()
    if(active){for(const node of records.keys())node.setAttribute(HIDDEN,'')}
    else{
      observer.disconnect();win.cancelAnimationFrame(pending);pending=0
      for(const[node,record]of [...records])release(node,record)
      for(const[node,value]of paths)restore(node,PATH,value);paths.clear()
      restore(doc.body,MODE,bodyMark);restore(doc.body,RETURNING,returnMark);tools?.remove();tools=null;exitButton=null;themeButton=null
      for(const{node,top,left,tail}of scrolls)if(node.isConnected){node.scrollTop=tail?node.scrollHeight-node.clientHeight:top;node.scrollLeft=left}
      scrolls=[];frame=null
      if(trigger?.isConnected)trigger.focus({preventScroll:true})
      trigger=null
    }
    if(instant)for(const node of doc.querySelectorAll('[data-dcb-background-layer] > :is(img,video,iframe)'))for(const animation of node.getAnimations()){
      if(['filter','opacity'].includes(animation.transitionProperty))try{animation.finish()}catch{/* A hidden or detached media node has already settled. */}
    }
    schedule()
  }
  function transition(active,from){
    const token=++revision
    if(calm()){finish(active,true);return}
    for(const[node,record]of records){
      if(record.hidden!==null||!node.getClientRects().length)continue
      const start=from?.get(node)??(active?win.getComputedStyle(node).opacity:'0'),end=active?'0':win.getComputedStyle(node).opacity
      try{const animation=node.animate([{opacity:start},{opacity:end}],{duration:motion.time.standard,easing:motion.ease.smooth,fill:'both'});animation.id='dcb-focus-visibility';animations.set(node,animation)}catch{}
    }
    Promise.allSettled([...animations.values()].map(animation=>animation.finished)).then(()=>{if(!disposed&&revision===token)finish(active)})
  }
  function enter(button){
    if(disposed||snapshot.active)return
    const from=paint();cancel()
    if(!frame){
      trigger=button
      const center=button.closest(names('centerCol'))||button.closest('main')
      frame=center?.parentElement
      if(!frame||!frame.querySelector(CONTENT)){frame=null;trigger=null;return}
      bodyMark=doc.body.getAttribute(MODE);returnMark=doc.body.getAttribute(RETURNING);doc.body.setAttribute(MODE,'')
      scrolls=[...frame.querySelectorAll('[data-conversation-scroll]')].map(node=>({node,top:node.scrollTop,left:node.scrollLeft,tail:node.scrollHeight-node.clientHeight-node.scrollTop<4}))
      tools=doc.createElement('div');tools.className='dcb-background-tools';tools.setAttribute('role','toolbar');tools.setAttribute('aria-label','背景模式工具')
      // Keep the black/white switch reachable while every other control is hidden.
      if(doc.querySelector('.dcb-theme-toggle')){
        themeButton=doc.createElement('button');themeButton.type='button';themeButton.className='dcb-background-theme';themeButton.setAttribute('aria-label','切换黑白主题');themeButton.title='切换黑白主题'
        themeButton.innerHTML='<svg class="dcb-background-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke-linecap="round"/></svg><svg class="dcb-background-moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.6 14.1A8.7 8.7 0 0 1 9.9 3.4a8.7 8.7 0 1 0 10.7 10.7Z"/></svg>'
        themeButton.addEventListener('click',()=>doc.querySelector('.dcb-theme-toggle')?.click())
        tools.append(themeButton)
      }
      exitButton=doc.createElement('button');exitButton.type='button';exitButton.className='dcb-focus-toggle dcb-background-exit';exitButton.setAttribute('aria-label','退出纯背景模式');exitButton.title='退出纯背景模式 · Esc'
      exitButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5M8 8l8 8m0-8-8 8"/></svg>'
      exitButton.addEventListener('click',()=>exit());tools.append(exitButton);doc.body.append(tools)
      for(const node of collect()){
        records.set(node,{hidden:node.getAttribute(HIDDEN),inert:node.getAttribute('inert'),aria:node.getAttribute('aria-hidden')})
        node.setAttribute('inert','');node.setAttribute('aria-hidden','true')
      }
      observer.observe(doc.body,{childList:true,subtree:true})
    }else for(const node of records.keys()){node.removeAttribute(HIDDEN);node.setAttribute('inert','');node.setAttribute('aria-hidden','true')}
    doc.body.removeAttribute(RETURNING)
    publish(true);exitButton.focus({preventScroll:true});transition(true,from)
  }
  function exit(animated=true){
    if(!frame){publish(false);return}
    const from=paint();cancel()
    doc.body.setAttribute(RETURNING,'')
    for(const[node,record]of records)restore(node,HIDDEN,record.hidden)
    publish(false)
    if(animated)transition(false,from)
    else{revision++;finish(false,true)}
  }
  function Button(){
    const state=React.useSyncExternalStore(subscribe,()=>snapshot,()=>snapshot)
    return h('button',{type:'button',className:'dcb-focus-toggle','aria-label':state.active?'退出纯背景模式':'进入纯背景模式','aria-pressed':state.active,title:'纯背景模式 · 隐藏对话与界面文字，清晰显示背景',onClick:event=>state.active?exit():enter(event.currentTarget)},
      h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('rect',{x:3,y:4,width:18,height:16,rx:3}),h('path',{d:'m4 16 5-5 4 4 3-3 5 5M16 8h.01'})))
  }
  const key=event=>{
    if(event.key!=='Escape'||event.defaultPrevented||!snapshot.active||event.isComposing)return
    if(event.target.closest?.('[role=dialog],[role=menu],[role=listbox]'))return
    event.preventDefault();exit()
  }
  const preference=()=>{if(calm()&&frame){revision++;finish(snapshot.active,true)}}
  doc.addEventListener('keydown',key);quiet.addEventListener('change',preference);doc.addEventListener('visibilitychange',preference)
  return{Button,dispose(){if(disposed)return;disposed=true;revision++;observer.disconnect();win.cancelAnimationFrame(pending);if(frame)finish(false,true);publish(false);listeners.clear();doc.removeEventListener('keydown',key);quiet.removeEventListener('change',preference);doc.removeEventListener('visibilitychange',preference)}}
}
