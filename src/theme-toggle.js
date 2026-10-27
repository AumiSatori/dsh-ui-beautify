import {motion,springSamples} from './motion.js'
// A full-window color change needs a gentler pace than its small switch.
// This is a web approximation, not an Apple system animation constant.
const REVEAL_TIME=600
const REVEAL_EASE=typeof CSS!=='undefined'&&CSS.supports?.('animation-timing-function','linear(0, 1)')
  ?`linear(${springSamples({frequency:5.5}).map(value=>Number(value.toFixed(5))).join(',')})`
  :'cubic-bezier(.25,0,.2,1)'
export const themeToggleCss = `
  .dcb-theme-toggle { position:relative; isolation:isolate; display:inline-flex; flex:none; width:70px; height:30px; padding:0; overflow:hidden; border:1px solid #ffffffb8; border-radius:999px; background:rgba(210,234,247,.54); box-shadow:inset 0 1px 1px #ffffffe0,inset 0 -1px 2px #7793a640,0 2px 8px #28394c12; backdrop-filter:blur(12px) saturate(1.25); -webkit-backdrop-filter:blur(12px) saturate(1.25); cursor:pointer; -webkit-app-region:no-drag; transition:background-color ${motion.time.standard}ms ${motion.ease.color},border-color ${motion.time.standard}ms ${motion.ease.color},box-shadow ${motion.time.standard}ms ${motion.ease.color}; }
  .dcb-theme-toggle[data-scheme="dark"] { background:rgba(35,43,70,.68); border-color:#d7e2ff52; box-shadow:inset 0 1px 1px #ffffff40,inset 0 -1px 2px #0a102c70,0 2px 9px #00000026; }
  .dcb-theme-toggle:hover { box-shadow:inset 0 1px 1px #fff,inset 0 -1px 2px #7793a640,0 3px 12px #28394c26; }
  .dcb-theme-toggle:focus-visible { outline:2px solid var(--dsw-alias-label-primary,#333); outline-offset:3px; }
  .dcb-theme-scene { position:absolute; inset:0; overflow:hidden; border-radius:inherit; pointer-events:none; }
  .dcb-theme-thumb { position:absolute; left:3px; top:2px; width:24px; height:24px; border:1px solid #ffffffb0; border-radius:50%; background:rgba(255,255,255,.56); box-shadow:inset 0 1px 2px #fff,0 2px 5px #34445c26; transform:translateX(0); transition:transform ${motion.time.standard}ms ${motion.ease.smooth},background-color ${motion.time.standard}ms ${motion.ease.color},box-shadow ${motion.time.standard}ms ${motion.ease.color}; }
  [data-scheme="dark"] .dcb-theme-thumb { transform:translateX(38px); background:rgba(199,212,248,.2); box-shadow:inset 0 1px 2px #ffffff8c,0 2px 6px #05091e45; }
  .dcb-theme-thumb svg { position:absolute; inset:3px; width:16px; height:16px; overflow:visible; transition:opacity ${motion.time.control}ms ${motion.ease.color},transform ${motion.time.standard}ms ${motion.ease.smooth}; }
  .dcb-theme-sun { color:#d49020; opacity:1; transform:translateY(0) rotate(0) scale(1); }
  .dcb-theme-moon { color:#e9edff; opacity:0; transform:translateY(8px) rotate(-55deg) scale(.65); }
  [data-scheme="dark"] .dcb-theme-sun { opacity:0; transform:translateY(-8px) rotate(90deg) scale(.65); }
  [data-scheme="dark"] .dcb-theme-moon { opacity:1; transform:translateY(0) rotate(0) scale(1); }
  .dcb-theme-rays { transform-box:fill-box; transform-origin:center; }
  [data-scheme="light"] .dcb-theme-rays { animation:dcb-theme-sun-rays 16s linear infinite; }
  .dcb-theme-clouds { position:absolute; right:7px; top:10px; width:25px; height:12px; opacity:.86; transform:translateY(0); transition:opacity ${motion.time.control}ms ${motion.ease.color},transform ${motion.time.standard}ms ${motion.ease.smooth}; }
  .dcb-theme-clouds::before,.dcb-theme-clouds::after { content:''; position:absolute; border-radius:999px; background:#ffffffbd; box-shadow:0 1px 2px #7c9cad15; }
  .dcb-theme-clouds::before { left:0; top:2px; width:19px; height:5px; }
  .dcb-theme-clouds::after { right:0; bottom:0; width:14px; height:4px; }
  [data-scheme="light"] .dcb-theme-clouds::before { animation:dcb-theme-cloud-drift 5s ease-in-out infinite alternate; }
  [data-scheme="light"] .dcb-theme-clouds::after { animation:dcb-theme-cloud-drift 6s ease-in-out -2s infinite alternate-reverse; }
  [data-scheme="dark"] .dcb-theme-clouds { opacity:0; transform:translateY(8px); }
  .dcb-theme-stars { position:absolute; left:8px; top:6px; width:23px; height:17px; opacity:0; transform:translateY(-8px) scale(.8); transition:opacity ${motion.time.material}ms ${motion.ease.color},transform ${motion.time.standard}ms ${motion.ease.smooth}; }
  [data-scheme="dark"] .dcb-theme-stars { opacity:1; transform:translateY(0) scale(1); }
  .dcb-theme-stars i { position:absolute; width:3px; height:3px; background:#e8efff; border-radius:1px; transform:rotate(45deg); }
  .dcb-theme-stars i:nth-child(1) { left:2px; top:2px; }
  .dcb-theme-stars i:nth-child(2) { left:16px; top:6px; width:2px; height:2px; }
  .dcb-theme-stars i:nth-child(3) { left:7px; top:12px; width:2px; height:2px; }
  [data-scheme="dark"] .dcb-theme-stars i { animation:dcb-theme-star 3s ease-in-out infinite; }
  [data-scheme="dark"] .dcb-theme-stars i:nth-child(2) { animation-delay:-1s; }
  [data-scheme="dark"] .dcb-theme-stars i:nth-child(3) { animation-delay:-2s; }
  .dcb-theme-notice { position:absolute; width:1px; height:1px; padding:0; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
  @keyframes dcb-theme-sun-rays { to { transform:rotate(360deg); } }
  @keyframes dcb-theme-cloud-drift { from { transform:translateX(-3px); } to { transform:translateX(3px); } }
  @keyframes dcb-theme-star { 0%,100% { opacity:.35; transform:rotate(45deg) scale(.7); } 50% { opacity:1; transform:rotate(45deg) scale(1); } }
  :root[data-dcb-theme-transition]::view-transition { pointer-events:none; }
  :root[data-dcb-theme-transition]::view-transition-old(root),:root[data-dcb-theme-transition]::view-transition-new(root) { animation:none; mix-blend-mode:normal; }
  :root[data-dcb-theme-transition]::view-transition-new(root) { z-index:1; }
  :root[data-dcb-theme-transition]::view-transition-group(dcb-theme-control),:root[data-dcb-theme-transition]::view-transition-group(dcb-theme-orb) { animation-duration:${motion.time.standard}ms; animation-timing-function:${motion.ease.smooth}; z-index:2; }
  :root[data-dcb-theme-transition]::view-transition-old(dcb-theme-control),:root[data-dcb-theme-transition]::view-transition-old(dcb-theme-orb) { animation:dcb-theme-old ${motion.time.standard}ms ${motion.ease.color} both; }
  :root[data-dcb-theme-transition]::view-transition-new(dcb-theme-control),:root[data-dcb-theme-transition]::view-transition-new(dcb-theme-orb) { animation:dcb-theme-new ${motion.time.standard}ms ${motion.ease.smooth} both; }
  :root[data-dcb-theme-transition] .dcb-theme-toggle[data-dcb-theme-source] .dcb-theme-thumb,:root[data-dcb-theme-transition] .dcb-theme-toggle[data-dcb-theme-source] .dcb-theme-thumb svg { transition:none!important; }
  @keyframes dcb-theme-old { to { opacity:0; } }
  @keyframes dcb-theme-new { from { opacity:0; } to { opacity:1; } }
  :root[data-dcb-theme-transition][data-dcb-theme-fallback] body { transition:background-color ${REVEAL_TIME}ms ${REVEAL_EASE},color ${REVEAL_TIME}ms ${REVEAL_EASE}; }
  @media(prefers-reduced-motion:reduce) { .dcb-theme-toggle,.dcb-theme-toggle *,.dcb-theme-toggle *::before,.dcb-theme-toggle *::after { animation:none!important; transition:none!important; } }
  @media(forced-colors:active) { .dcb-theme-toggle { background:ButtonFace; border-color:ButtonText; box-shadow:none; backdrop-filter:none; -webkit-backdrop-filter:none; } .dcb-theme-toggle,.dcb-theme-toggle *,.dcb-theme-toggle *::before,.dcb-theme-toggle *::after { animation:none!important; transition:none!important; } .dcb-theme-thumb { background:Canvas; border-color:CanvasText; box-shadow:none; } .dcb-theme-thumb svg { color:CanvasText; } .dcb-theme-clouds,.dcb-theme-stars { display:none; } }
`

// Theme changes go through the host preference service; DOM attributes are read
// only for the initial icon, never used as a replacement for its theme setter.
export function createThemeToggle(React, doc, win) {
  const h=React.createElement,root=doc.documentElement,reduced=win.matchMedia('(prefers-reduced-motion: reduce)'),forced=win.matchMedia('(forced-colors: active)')
  const listeners=new Set(),original=root.getAttribute('data-dcb-theme-transition'),originalFallback=root.getAttribute('data-dcb-theme-fallback')
  let service=null,disposed=false,sequence=0,pending=null,wanted=null
  let snapshot={available:false,dark:doc.body.hasAttribute('data-ds-dark-theme'),busy:false,error:''}
  const subscribe=listener=>{listeners.add(listener);return()=>listeners.delete(listener)}
  const getSnapshot=()=>snapshot
  const restore=(name,value)=>value===null?root.removeAttribute(name):root.setAttribute(name,value)
  function publish(patch) {
    const next={...snapshot,...patch}
    if(Object.keys(next).every(key=>next[key]===snapshot[key]))return
    snapshot=next;for(const listener of listeners)listener()
  }
  function sync(value) {
    if(disposed)return
    try {
      const theme=value||service?.getTheme()
      publish({available:!!service,dark:theme?.active?.colorScheme?theme.active.colorScheme==='dark':snapshot.dark})
    } catch { publish({available:false}) }
  }
  function clear(record) {
    if(pending!==record)return
    win.clearTimeout(record.timer)
    pending=null;wanted=null
    for(const [element,value,priority] of record.names||[]){if(value)element.style.setProperty('view-transition-name',value,priority);else element.style.removeProperty('view-transition-name')}
    if(record.button)restoreSource(record.button,record.source)
    restore('data-dcb-theme-transition',original);restore('data-dcb-theme-fallback',originalFallback)
    publish({busy:false})
  }
  const restoreSource=(button,value)=>value===null?button.removeAttribute('data-dcb-theme-source'):button.setAttribute('data-dcb-theme-source',value)
  function cancel() {
    const record=pending
    if(!record)return
    record.transition?.skipTransition();record.animation?.cancel();clear(record)
  }
  function connect(value) {
    if(disposed)return
    cancel();sequence++
    service=value&&typeof value.getTheme==='function'&&typeof value.setTheme==='function'?value:null
    sync()
  }
  function change(button,dark) {
    if(disposed||!service)return
    if(dark===snapshot.dark&&!pending)return
    const id=++sequence
    cancel();wanted=dark
    const record={id,dark,animation:null,transition:null,timer:0,committed:false}
    pending=record
    publish({busy:true,error:''})
    const commit=()=>{
      if(disposed||id!==sequence||record.committed)return
      record.committed=true;service.setTheme(dark?'dark':'light');sync()
    }
    const fail=()=>{if(pending===record){sync();publish({error:'主题切换失败，请重试'});clear(record)}}
    if(reduced.matches||forced.matches){try{commit();clear(record)}catch{fail()}return}
    root.setAttribute('data-dcb-theme-transition',dark?'dark':'light')
    const fallback=()=>{
      if(disposed||id!==sequence)return
      root.setAttribute('data-dcb-theme-fallback','')
      try{commit();record.timer=win.setTimeout(()=>clear(record),REVEAL_TIME)}catch{fail()}
    }
    if(typeof doc.startViewTransition!=='function'){fallback();return}
    const rect=button?.getBoundingClientRect?.()||{left:win.innerWidth/2-35,top:win.innerHeight/2-15,width:70,height:30},x=rect.left+rect.width/2,y=rect.top+rect.height/2
    const radius=Math.hypot(Math.max(x,win.innerWidth-x),Math.max(y,win.innerHeight-y))
    try {
      record.button=button;record.source=button?.getAttribute?.('data-dcb-theme-source')??null;record.names=[]
      for(const [element,name] of [[button,'dcb-theme-control'],[button?.querySelector?.('.dcb-theme-thumb'),'dcb-theme-orb']])if(element){record.names.push([element,element.style.getPropertyValue('view-transition-name'),element.style.getPropertyPriority('view-transition-name')]);element.style.setProperty('view-transition-name',name)}
      button?.setAttribute?.('data-dcb-theme-source','')
      record.transition=doc.startViewTransition(commit)
      record.transition.updateCallbackDone.catch(fail)
      record.transition.ready.then(()=>{
        if(disposed||id!==sequence)return
        record.animation=root.animate([{clipPath:`circle(0px at ${x}px ${y}px)`,opacity:.2},{clipPath:`circle(${radius}px at ${x}px ${y}px)`,opacity:1}],{duration:REVEAL_TIME,easing:REVEAL_EASE,pseudoElement:'::view-transition-new(root)'})
        record.animation.id='dcb-theme-reveal'
        record.animation.finished.catch(()=>{})
      }).catch(()=>{if(pending===record&&!record.committed)fallback()})
      record.transition.finished.then(()=>clear(record),()=>clear(record))
    } catch { fallback() }
  }
  function toggle(button) { change(button,!(wanted??snapshot.dark)) }
  function setTheme(value,source=null) {
    const dark=value==='dark'||value===true
    if(dark===snapshot.dark&&!pending)return
    change(source,dark)
  }
  function Button() {
    const state=React.useSyncExternalStore(subscribe,getSnapshot,getSnapshot)
    if(!state.available)return null
    return h(React.Fragment,null,
      h('button',{type:'button',className:'dcb-theme-toggle',role:'switch','aria-label':state.dark?'切换到日间主题':'切换到夜间主题','aria-checked':state.dark,'data-scheme':state.dark?'dark':'light','data-transitioning':state.busy,title:state.error||(state.dark?'夜间主题 · 切换到白天':'日间主题 · 切换到黑夜'),onClick:event=>toggle(event.currentTarget)},
        h('span',{className:'dcb-theme-scene','aria-hidden':true},
          h('span',{className:'dcb-theme-clouds'}),h('span',{className:'dcb-theme-stars'},h('i'),h('i'),h('i')),
          h('span',{className:'dcb-theme-thumb'},
            h('svg',{className:'dcb-theme-sun',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7},h('circle',{cx:12,cy:12,r:4,fill:'currentColor',stroke:'none'}),h('g',{className:'dcb-theme-rays'},h('path',{d:'M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',strokeLinecap:'round'}))),
            h('svg',{className:'dcb-theme-moon',viewBox:'0 0 24 24',fill:'currentColor'},h('path',{d:'M20.6 14.1A8.7 8.7 0 0 1 9.9 3.4a8.7 8.7 0 1 0 10.7 10.7Z'}))))),
      h('span',{className:'dcb-theme-notice',role:'status','aria-live':'polite'},state.error))
  }
  const preference=()=>{if(reduced.matches||forced.matches){sequence++;cancel();sync()}}
  reduced.addEventListener('change',preference);forced.addEventListener('change',preference)
  return {Button,connect,sync,setTheme,dispose(){if(disposed)return;sequence++;cancel();disposed=true;service=null;reduced.removeEventListener('change',preference);forced.removeEventListener('change',preference);listeners.clear()}}
}
