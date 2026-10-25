import {motion} from './motion.js'

const MARK='data-dcb-fullscreen',SIDEBAR='data-dcb-fullscreen-sidebar',TOGGLE='data-dcb-fullscreen-toggle',NEW='data-dcb-fullscreen-new'
const PILL='--dcb-fullscreen-pill-width'
const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`
const excluded='[data-dcb-sidebar-ghost],[data-dcb-sidebar-layout-probe],[aria-hidden="true"][inert]'
export const fullscreenControlsCss=`
  html[${MARK}] { --dsh-windows-titlebar-height:0px!important; --dsh-frame-top-clearance:0px!important; --dsh-frame-chrome-top:0px!important; --dsh-frame-overlay-top:20px!important; }
  html[${MARK}] [data-windows-menu] { display:none!important; }
  html[${MARK}] [${SIDEBAR}]:not(${names('collapsed')}) { padding-top:58px!important; }
  html[${MARK}] [${SIDEBAR}] > ${names('topStrip')} { display:none!important; }
  html[${MARK}] [${SIDEBAR}] { z-index:1102!important; }
  html[${MARK}] [${TOGGLE}],html[${MARK}] [${NEW}] { position:fixed!important; top:10px!important; right:auto!important; bottom:auto!important; inset-inline-end:auto!important; inset-block-end:auto!important; transform:none!important; width:30px!important; height:30px!important; min-width:30px!important; min-height:30px!important; margin:0!important; padding:0!important; z-index:1103!important; -webkit-app-region:no-drag; border-radius:8px!important; box-sizing:border-box!important; }
  html[${MARK}] [${TOGGLE}] { left:12px!important; }
  html[${MARK}] [${NEW}] { left:48px!important; }
  html[${MARK}] [${TOGGLE}]::before,html[${MARK}] [${NEW}]::before { inset:0!important; }
  html[${MARK}] [data-dcb-sidebar-ghost] :is([${TOGGLE}],[${NEW}]) { display:none!important; }
  html[${MARK}]:has(.dcb-fullscreen-tools[data-collapsed]) header:has(> [data-conversation-header-leading]) { padding-inline-start:max(152px,var(--dcb-header-content-left,20px))!important; }
  .dcb-fullscreen-tools { position:fixed; left:max(8px,env(safe-area-inset-left)); top:max(6px,env(safe-area-inset-top)); width:74px; height:38px; z-index:1100; pointer-events:none; color:var(--dsw-alias-label-primary,#303237); box-sizing:border-box; -webkit-app-region:no-drag; isolation:isolate; }
  .dcb-fullscreen-tools:is([data-collapsed],[data-has-new]) { width:106px; }
  .dcb-fullscreen-tools[data-no-sidebar] { width:38px; }
  /* Fullscreen controls share the same compact material as the right toolbar.
     The native buttons keep their SVG/text; this layer only unifies the tray.
     The native buttons live inside the host sidebar column, which owns its own
     stacking context (z-index 16). A body-level pane therefore painted *over*
     them and swallowed both icons while the buttons stayed clickable. So the
     shared material is drawn inside that column instead, behind the buttons;
     the body-level tray only carries the exit button (its ::before is off). */
  html[${MARK}] .dcb-fullscreen-tools:not([data-no-sidebar])::before { display:none; }
  html[${MARK}] [${SIDEBAR}]::after { content:''; position:fixed!important; left:max(8px,env(safe-area-inset-left))!important; top:max(6px,env(safe-area-inset-top))!important; right:auto!important; bottom:auto!important; inset-inline-end:auto!important; inset-block-end:auto!important; transform:none!important; display:block!important; box-sizing:border-box!important; width:var(--dcb-fullscreen-pill-width,110px)!important; height:38px!important; z-index:0; pointer-events:none; border:1px solid var(--dcb-icon-line,color-mix(in srgb,var(--dsw-alias-border-l3,#dce1e8) 72%,transparent)); border-radius:15px; background:var(--dcb-icon-fill,color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 72%,transparent)); box-shadow:inset 0 1px 0 #ffffff45,0 3px 12px #0000000b; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
  .dcb-fullscreen-tools::before { content:''; position:absolute; inset:0; z-index:-1; pointer-events:none; box-sizing:border-box; border:1px solid var(--dcb-icon-line,color-mix(in srgb,var(--dsw-alias-border-l3,#dce1e8) 72%,transparent)); border-radius:15px; background:var(--dcb-icon-fill,color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 72%,transparent)); box-shadow:inset 0 1px 0 #ffffff45,0 3px 12px #0000000b; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
  html[${MARK}] :is([${TOGGLE}],[${NEW}],.dcb-fullscreen-exit) { display:grid!important; place-items:center; width:30px!important; height:30px!important; min-width:30px!important; min-height:30px!important; padding:0!important; border:0!important; border-radius:8px!important; background-color:transparent!important; box-shadow:none!important; color:inherit; cursor:pointer; -webkit-app-region:no-drag; transition:background-color ${motion.time.quick}ms ${motion.ease.color},box-shadow ${motion.time.control}ms ${motion.ease.smooth},scale ${motion.time.control}ms ${motion.ease.smooth}; }
  html[${MARK}] .dcb-fullscreen-exit { position:absolute; top:4px; right:0; pointer-events:auto; z-index:2; }
  html[${MARK}] :is([${TOGGLE}],[${NEW}],.dcb-fullscreen-exit):hover { background-color:var(--dcb-icon-hover,var(--dsw-alias-interactive-bg-hover,#8882))!important; box-shadow:inset 0 0 0 1px var(--dcb-icon-line,#8884)!important; }
  html[${MARK}] :is([${TOGGLE}],[${NEW}],.dcb-fullscreen-exit):active { scale:.95; background-color:color-mix(in srgb,var(--dcb-icon-accent,var(--dsh-settings-accent,#6c6cf6)) 12%,var(--dcb-icon-hover,#8882))!important; }
  /* The native rail can inherit a transparent caption color after the header
     leaves the normal layout. Keep the original SVGs visible and clickable, but
     never rewrite their paint: filled glyphs turn invisible under fill:none. */
  html[${MARK}] :is([${TOGGLE}],[${NEW}]) { color:var(--dsw-alias-label-primary,#303237)!important; }
  html[${MARK}] [${TOGGLE}] > svg,html[${MARK}] [${NEW}] svg,html[${MARK}] [${TOGGLE}] svg *,html[${MARK}] [${NEW}] svg * { display:block!important; opacity:1!important; visibility:visible!important; color:inherit!important; stroke:currentColor!important; fill:none!important; }
  /* Expanded native buttons include a separate shortcut grid item. Hide both
     text items, otherwise even an opacity:0 shortcut consumes a second row. */
  html[${MARK}] [${NEW}] :is(${names('newSessionLabel')},${names('newSessionShortcut')}) { display:none!important; }
  html[${MARK}] [${NEW}] :is(${names('newSessionLabelMask')},${names('newSessionContent')}) { display:grid!important; place-items:center!important; width:100%!important; height:100%!important; min-width:0!important; gap:0!important; mask-image:none!important; overflow:visible!important; }
  html[${MARK}] [${NEW}] ${names('newSessionContent')} > svg { width:18px!important; height:18px!important; }
  html[${MARK}] :is([${TOGGLE}],[${NEW}],.dcb-fullscreen-exit):focus-visible { outline:2px solid var(--dsw-focus-ring-color,var(--dsh-settings-accent,#6c6cf6))!important; outline-offset:-3px; }
  .dcb-fullscreen-exit:focus-visible { outline:2px solid var(--dsw-focus-ring-color,var(--dsh-settings-accent,#6c6cf6)); outline-offset:-3px; }
  .dcb-fullscreen-exit svg { width:18px; height:18px; }
  .dcb-fullscreen-notice { position:fixed; top:60px; left:12px; max-width:calc(100vw - 24px); padding:10px 14px; z-index:2147483001; border:1px solid var(--dsw-alias-border-l3,#8883); border-radius:12px; background:var(--dsw-alias-bg-base,#fff); color:var(--dsw-alias-label-primary,#303237); font:13px/1.6 system-ui; box-shadow:0 4px 18px #0002; }
  @media(prefers-reduced-motion:reduce) { html[${MARK}] :is([${TOGGLE}],[${NEW}],.dcb-fullscreen-exit) { transition:none; } html[${MARK}] :is([${TOGGLE}],[${NEW}],.dcb-fullscreen-exit):active { scale:1; } }
  @media(prefers-reduced-transparency:reduce) { .dcb-fullscreen-tools::before { background:var(--dsw-alias-bg-base,#fff); backdrop-filter:none; -webkit-backdrop-filter:none; } }
  @media(forced-colors:active) { .dcb-fullscreen-tools::before,.dcb-fullscreen-exit,.dcb-fullscreen-notice { background:Canvas; color:CanvasText; border-color:CanvasText; box-shadow:none; backdrop-filter:none; -webkit-backdrop-filter:none; } html[${MARK}] :is([${TOGGLE}],[${NEW}],.dcb-fullscreen-exit):hover { background-color:Highlight!important; color:HighlightText; } html[${MARK}] :is([${TOGGLE}],[${NEW}],.dcb-fullscreen-exit):focus-visible,.dcb-fullscreen-exit:focus-visible { outline-color:Highlight; } }
`

// Fullscreen the document, so host dialogs and Artifact portals stay in the same
// top layer. Never replace the host's fullscreen marker or move React controls.
export function createFullscreenControls(doc,win){
  const root=doc.documentElement,records=new Map()
  let disposed=false,active=false,tools=null,exit=null,notice=null,timer=0,previous=null,original=null
  // A request may settle late or never when the native window transition is
  // interrupted, so the guard is time-bounded instead of a sticky flag.
  let askedAt=-Infinity,deferredAt=-Infinity
  const PENDING=450,RETRY=1400
  const now=()=>win.performance?.now?.()??Date.now()
  const owned=()=>doc.fullscreenElement===root
  const supported=()=>typeof root.requestFullscreen==='function'&&typeof doc.exitFullscreen==='function'&&doc.fullscreenEnabled!==false
  // The desktop shell mirrors its native window state onto <html data-fullscreen>,
  // and that mirror can lag behind an HTML fullscreen exit. Inside the desktop our
  // own element fullscreen is the only native-fullscreen source, so a stale mirror
  // must never veto F11; browsers keep their own native F11 path.
  const desktop=()=>!!win.dshDesktop||/Electron/i.test(win.navigator?.userAgent??'')
  const busy=()=>now()-askedAt<PENDING
  const other=()=>{const node=doc.fullscreenElement;return node&&node!==root?node:null}
  const native=()=>desktop()?false:!!(win.matchMedia?.('(display-mode: fullscreen)').matches||root.hasAttribute('data-fullscreen'))
  function mark(node,key){if(!records.has(node))records.set(node,new Map());const attrs=records.get(node);if(!attrs.has(key))attrs.set(key,node.getAttribute(key));if(!node.hasAttribute(key))node.setAttribute(key,'')}
  function restore(){for(const[node,attrs]of records)for(const[key,value]of attrs)value===null?node.removeAttribute(key):node.setAttribute(key,value);records.clear()}
  function dismiss(){win.clearTimeout(timer);timer=0;notice?.remove();notice=null}
  function failed(){
    if(disposed)return
    dismiss();notice=doc.createElement('div');notice.className='dcb-fullscreen-notice';notice.setAttribute('role','status');notice.textContent='暂时无法切换全屏，请再次按 F11。';doc.body.append(notice);timer=win.setTimeout(dismiss,3200)
  }
  function sync(){
    if(disposed)return
    const next=owned()
    if(!next){
      if(!active){if(original===null&&root.hasAttribute(MARK))root.removeAttribute(MARK);return}
      const returnFocus=doc.activeElement===exit
      restore();original===null?root.removeAttribute(MARK):root.setAttribute(MARK,original)
      root.style.removeProperty(PILL)
      tools?.remove();tools=null;exit=null;active=false
      if(returnFocus&&previous?.isConnected)previous.focus({preventScroll:true})
      previous=null;return
    }
    if(!active){
      active=true;original=root.getAttribute(MARK);root.setAttribute(MARK,'')
      tools=doc.createElement('div');tools.className='dcb-fullscreen-tools';tools.setAttribute('role','group');tools.setAttribute('aria-label','全屏操作')
      exit=doc.createElement('button');exit.type='button';exit.className='dcb-fullscreen-exit';exit.setAttribute('aria-label','退出全屏');exit.setAttribute('aria-keyshortcuts','F11');exit.title='退出全屏 · F11 / Esc'
      exit.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3v6H3m12-6v6h6M3 15h6v6m12-6h-6v6"/></svg>'
      exit.addEventListener('click',toggle);tools.append(exit);doc.body.append(tools)
    }
    const button=[...doc.querySelectorAll(`button${names('toggle')}`)].find(node=>!node.closest(excluded))
    const sidebar=button?.closest(names('root')),collapsed=!!sidebar?.matches(names('collapsed'))
    // A hidden/removed sidebar can leave the old collapsed marker behind while
    // fullscreen is active. In that case keep the single exit control snug to
    // the left edge instead of reserving empty slots for native buttons.
    const buttonVisible=!!button&&button.getClientRects().length>0&&win.getComputedStyle(button).display!=='none'&&win.getComputedStyle(button).visibility!=='hidden'
    // Keep the native new-session action in the fullscreen row as well. The
    // non-fullscreen caption row already exposes it; fullscreen must not drop
    // that action just because the host root is expanded or collapsed.
    const newSession=sidebar?[...sidebar.children].find(node=>node.matches(`button${names('newSession')}`)):null
    tools.toggleAttribute('data-no-sidebar',!sidebar||!buttonVisible);tools.toggleAttribute('data-collapsed',collapsed&&buttonVisible);tools.toggleAttribute('data-has-new',!!newSession&&buttonVisible)
    // The material inside the sidebar column is sized from the tray so the two
    // stay one shape when the new-session slot appears or disappears.
    const pill=Math.round(tools.getBoundingClientRect().width)+4
    if(pill>0&&root.style.getPropertyValue(PILL)!==pill+'px')root.style.setProperty(PILL,pill+'px')
    // Reconcile remounted native roots while full screen, restoring detached
    // records as well. Do not retain references to old session DOM.
    const wanted=new Set([sidebar,button,newSession].filter(Boolean))
    if(newSession)wanted.add(newSession)
    for(const[node,attrs]of records)if(!wanted.has(node)){for(const[key,value]of attrs)value===null?node.removeAttribute(key):node.setAttribute(key,value);records.delete(node)}
    if(sidebar)mark(sidebar,SIDEBAR)
    if(button)mark(button,TOGGLE)
    if(newSession)mark(newSession,NEW)
  }
  function toggle(){
    if(disposed||!supported())return
    const owner=other()
    if(owner){
      // A detached or discarded owner would otherwise lock every later request.
      if(owner.isConnected)return
      try{doc.exitFullscreen()}catch{}
    }
    if(busy())return
    const entering=!owned()
    dismiss()
    if(entering)previous=doc.activeElement
    askedAt=now()
    // Invoke synchronously inside the key/click gesture; delaying would lose
    // transient user activation in Chromium.
    let watchdog=0
    const settle=()=>{win.clearTimeout(watchdog);askedAt=-Infinity}
    watchdog=win.setTimeout(()=>{if(disposed)return;askedAt=-Infinity;sync()},PENDING+400)
    let operation
    try{operation=entering?root.requestFullscreen({navigationUI:'hide'}):doc.exitFullscreen()}catch{settle();failed();return}
    Promise.resolve(operation).then(()=>{
      settle()
      if(disposed&&owned())return doc.exitFullscreen().catch(()=>{})
      sync()
    },()=>{settle();failed()})
  }
  const key=event=>{
    if(event.key!=='F11'||event.defaultPrevented||event.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!supported()||win.top!==win)return
    // Fullscreen media/Artifact belongs to its owner; preserve its own exit.
    if(other()?.isConnected)return
    // Native window fullscreen has its own F11 exit; defer once, but never keep
    // deferring when nothing changed, so a stale marker cannot disable F11.
    if(!owned()&&native()){
      if(now()-deferredAt<RETRY)deferredAt=-Infinity
      else{deferredAt=now();return}
    }
    event.preventDefault()
    if(!event.repeat)toggle()
  }
  doc.addEventListener('keydown',key,true);doc.addEventListener('fullscreenchange',sync)
  win.addEventListener?.('focus',sync)
  sync()
  return{sync,dispose(){
    if(disposed)return
    const leave=owned();if(active){restore();original===null?root.removeAttribute(MARK):root.setAttribute(MARK,original)}
    root.style.removeProperty(PILL)
    disposed=true;askedAt=-Infinity;deferredAt=-Infinity;tools?.remove();tools=null;exit=null;previous=null;dismiss();doc.removeEventListener('keydown',key,true);doc.removeEventListener('fullscreenchange',sync);win.removeEventListener?.('focus',sync)
    if(leave)try{Promise.resolve(doc.exitFullscreen()).catch(()=>{})}catch{}
  }}
}
