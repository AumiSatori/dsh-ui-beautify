const NATIVE_KEY='dsh.conversation.contentWidth'
const KEY='dsh-ui-beautify:conversation-width:v1'
const TEXT='--dsh-chat-content-width',USER='--dsh-chat-user-width',MARK='data-dcb-chat-width-mode'
const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`
const positive=value=>typeof value==='number'&&Number.isFinite(value)&&value>0?value:null

// Electron publishes real fullscreen on the document. It does not publish
// maximization, so only desktop windows matching BOTH work-area dimensions
// use the same wide-window preference. A merely wide restored window does not.
export function conversationWidthMode(doc,win){
  if(doc.fullscreenElement||doc.documentElement.hasAttribute('data-fullscreen')||win.matchMedia('(display-mode: fullscreen)').matches)return 'fullscreen'
  const desktop=doc.documentElement.hasAttribute('data-windows-titlebar')||doc.documentElement.dataset.platform==='darwin'
  const screen=win.screen
  const maximized=desktop&&screen?.availWidth>0&&screen?.availHeight>0&&
    Math.abs(win.outerWidth-screen.availWidth)<=16&&Math.abs(win.outerHeight-screen.availHeight)<=16
  return maximized?'fullscreen':'window'
}

export function createConversationWidth(doc,win){
  const records=new Map(),reserves=new WeakMap(),fullscreen=win.matchMedia('(display-mode: fullscreen)')
  let frame=0,disposed=false,drag=null,mode=conversationWidthMode(doc,win),preferences
  const read=key=>{try{return win.localStorage.getItem(key)}catch{return null}}
  const nativeWidth=()=>{const raw=read(NATIVE_KEY);return raw===null?null:positive(Number(raw))}
  const write=(key,value)=>{try{if(value===null)win.localStorage.removeItem(key);else win.localStorage.setItem(key,value)}catch{/* Session memory still works when storage is unavailable. */}}
  const persist=()=>write(KEY,JSON.stringify(preferences))
  function load(){
    try{const saved=JSON.parse(read(KEY));if(saved?.version===1)return {version:1,window:positive(saved.window),fullscreen:positive(saved.fullscreen)}}catch{/* Ignore malformed preferences. */}
    // Migrate the old shared width into the current mode once. The other mode
    // starts with the host's automatic width instead of inheriting a huge width.
    const result={version:1,window:null,fullscreen:null};result[mode]=nativeWidth();return result
  }
  preferences=load();persist()
  const restoreNative=()=>write(NATIVE_KEY,preferences[mode]===null?null:String(preferences[mode]))
  restoreNative()
  function schedule(){if(!frame&&!disposed)frame=win.requestAnimationFrame(sync)}
  function release(body,record){
    record.resize.disconnect();record.observer.disconnect()
    if(record.value)body.style.setProperty(TEXT,record.value,record.priority);else body.style.removeProperty(TEXT)
    // Leave the still-mounted native controls on the active mode's preference.
    // Otherwise their last temporary drag/resize publication can survive removal.
    if(body.isConnected){
      const preferred=preferences[mode]
      if(preferred===null)record.root.style.removeProperty(USER)
      else record.root.style.setProperty(USER,Math.min(Math.max(preferred,640),Math.max(640,body.offsetWidth-176))+'px')
    }
    if(record.mark===null)body.removeAttribute(MARK);else body.setAttribute(MARK,record.mark)
    if(drag?.record===record)drag=null
    records.delete(body)
  }
  function available(body){
    const box=body.getBoundingClientRect()
    let limit=Math.max(1,box.width-64)
    const shell=body.closest('[data-dcb-sidebar-overlay]:not([data-dcb-focus-frame=on])')
    // Reserve the expanded sidebar width even while it is closed: toggling it
    // still leaves the text, input and background in exactly the same place.
    // Below the host's 1024px breakpoint, retain its native drawer behavior.
    if(shell&&box.width>=1024){
      const left=[...shell.children].find(child=>child.matches(names('sidebarCol'))),root=left?.firstElementChild
      const inline=parseFloat(root?.style.width),expanded=shell.getAttribute('data-sidebar-collapsed')!=='true'
      const width=expanded?(inline||root?.getBoundingClientRect().width):inline
      if(width>56)reserves.set(shell,width)
      const reserve=reserves.get(shell)||280
      limit=Math.min(limit,Math.max(1,2*(box.left+box.width/2-shell.getBoundingClientRect().left-reserve-48)))
    }
    return limit
  }
  function sync(){
    if(frame){win.cancelAnimationFrame(frame);frame=0}
    if(disposed)return
    const next=conversationWidthMode(doc,win)
    if(next!==mode){mode=next;restoreNative()}
    const bodies=[...doc.querySelectorAll('[data-conversation-content]')].filter(body=>
      !body.closest('[data-dcb-sidebar-layout-probe]')&&body.closest(names('centerCol'))&&
      [...body.querySelectorAll('[data-width-handle]')].some(handle=>handle.closest('[data-conversation-content]')===body))
    for(const [body,record]of records)if(!bodies.includes(body)||record.root!==body.parentElement)release(body,record)
    for(const body of bodies){
      let record=records.get(body)
      if(!record){
        record={root:body.parentElement,mark:body.getAttribute(MARK),value:body.style.getPropertyValue(TEXT),priority:body.style.getPropertyPriority(TEXT)}
        record.resize=new win.ResizeObserver(schedule);record.resize.observe(body)
        record.observer=new win.MutationObserver(schedule);record.observer.observe(record.root,{attributes:true,attributeFilter:['style','data-dcb-sidebar-layout-lock']})
        const phase=body.closest('[data-phase]')
        if(phase&&phase!==record.root)record.observer.observe(phase,{attributes:true,attributeFilter:['data-dcb-sidebar-layout-lock']})
        const shell=body.closest(names('frame')),left=shell&&[...shell.children].find(child=>child.matches(names('sidebarCol')))
        if(shell)record.observer.observe(shell,{attributes:true,attributeFilter:['data-dcb-sidebar-overlay','data-dcb-focus-frame','data-sidebar-collapsed']})
        if(left?.firstElementChild)record.observer.observe(left.firstElementChild,{attributes:true,attributeFilter:['style']})
        records.set(body,record)
      }
      if(!body.getClientRects().length||!body.offsetWidth)continue
      // The parallel-sidebar animation already holds this variable to avoid
      // reflowing long transcripts at every frame. Resume when it releases.
      if(body.closest('[data-dcb-sidebar-layout-lock]'))continue
      const preferred=drag?.record===record&&drag.mode===mode?positive(parseFloat(record.root.style.getPropertyValue(USER))):preferences[mode]
      const requested=preferred??Math.max(680,Math.min(body.offsetWidth*.64,920))
      const width=Math.min(requested,available(body))
      record.width=width
      const value=width+'px'
      if(body.style.getPropertyValue(TEXT)!==value||body.style.getPropertyPriority(TEXT)!=='important')body.style.setProperty(TEXT,value,'important')
      if(body.getAttribute(MARK)!==mode)body.setAttribute(MARK,mode)
    }
  }
  function down(event){
    if(event.button!==0)return
    const handle=event.target.closest?.('[data-width-handle]'),body=handle?.closest('[data-conversation-content]'),record=records.get(body)
    if(!record||!record.width)return
    sync()
    drag={record,handle,mode,x:event.clientX,pointerId:event.pointerId,moved:false}
    // Native onStart reads its own persisted key. Start from the visible,
    // possibly constrained width so the first drag never jumps to an old size.
    write(NATIVE_KEY,String(record.width))
  }
  function move(event){if(drag?.pointerId===event.pointerId&&event.clientX!==drag.x)drag.moved=true}
  function end(event){
    if(drag?.pointerId!==event.pointerId)return
    const current=drag;drag=null
    if(event.type==='pointerup'&&current.moved&&current.mode===mode&&mode===conversationWidthMode(doc,win)){
      const width=nativeWidth()
      if(width!==null){preferences[mode]=width;persist()}
    }
    restoreNative();schedule()
  }
  function lost(event){win.queueMicrotask(()=>{if(drag?.pointerId===event.pointerId)end(event)})}
  function storage(event){
    if(event.key!==KEY&&event.key!==null)return
    preferences=load();restoreNative();schedule()
  }
  const html=new win.MutationObserver(schedule)
  html.observe(doc.documentElement,{attributes:true,attributeFilter:['data-fullscreen','data-windows-titlebar','data-platform']})
  win.addEventListener('resize',schedule);win.addEventListener('storage',storage)
  doc.addEventListener('fullscreenchange',schedule);fullscreen.addEventListener('change',schedule)
  doc.addEventListener('pointerdown',down,true);doc.addEventListener('pointermove',move,true)
  doc.addEventListener('pointerup',end);doc.addEventListener('pointercancel',end);doc.addEventListener('lostpointercapture',lost)
  const replacePreferences=value=>{
    drag=null
    preferences={version:1,window:positive(value?.window),fullscreen:positive(value?.fullscreen)}
    persist();restoreNative()
    for(const record of records.values())record.root.style.removeProperty(USER)
    sync()
  }
  return{sync,snapshot:()=>({...preferences}),reset:()=>replacePreferences(null),restore:replacePreferences,dispose(){
    disposed=true;win.cancelAnimationFrame(frame);html.disconnect();drag=null;restoreNative()
    win.removeEventListener('resize',schedule);win.removeEventListener('storage',storage)
    doc.removeEventListener('fullscreenchange',schedule);fullscreen.removeEventListener('change',schedule)
    doc.removeEventListener('pointerdown',down,true);doc.removeEventListener('pointermove',move,true)
    doc.removeEventListener('pointerup',end);doc.removeEventListener('pointercancel',end);doc.removeEventListener('lostpointercapture',lost)
    for(const [body,record]of records)release(body,record)
  }}
}
