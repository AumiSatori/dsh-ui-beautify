import {motion} from './motion.js'

const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`
const FRAME='data-dcb-focus-frame',PART='data-dcb-focus-part',HIDDEN='data-dcb-focus-hidden'
const STRUCTURE=`[data-composer-seat],[data-conversation-content],[data-rightbar-col],${names('sidebarCol')},${names('rightbarCol')},${names('titleCluster')},.dcb-summary,.dcb-file-viewer,.dcb-focus-toggle`
export const focusModeCss=`
  .dcb-focus-toggle { display:inline-grid; place-items:center; flex:none; width:30px; height:30px; padding:0; margin-left:6px; border:1px solid #8883; border-radius:9px; background:#ffffff66; color:var(--dsw-alias-label-primary,#303237); cursor:pointer; -webkit-app-region:no-drag; transition:background-color 180ms ${motion.ease.color},border-color 180ms ${motion.ease.color},transform 220ms ${motion.ease.smooth}; }
  .dcb-focus-toggle:hover { background:#8882; border-color:#8886; }
  .dcb-focus-toggle:active { transform:scale(.9); }
  .dcb-focus-toggle[aria-pressed=true] { color:#fff; background:#191919; border-color:#666; }
  .dcb-focus-toggle:focus-visible { outline:2px solid #888; outline-offset:3px; }
  .dcb-focus-toggle svg { display:block; width:17px; height:17px; }
  .dcb-focus-toggle path { transition:d 240ms ${motion.ease.smooth}; }
  body[data-ds-dark-theme] .dcb-focus-toggle { background:#ffffff0b; border-color:#ffffff36; }
  body[data-ds-dark-theme] .dcb-focus-toggle[aria-pressed=true] { background:#111; color:#fff; border-color:#aaa; }
  [${FRAME}] { transition:none!important; }
  [${FRAME}=on] { grid-template-columns:0px minmax(0px,1fr) 0px!important; column-gap:0!important; }
  [${FRAME}=on] > [${PART}=center] { grid-column:2!important; min-width:0; }
  [${FRAME}=on] header:has(> [data-conversation-header-leading]) { height:auto!important; min-height:0!important; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:0 12px; padding:8px 12px 8px 20px!important; }
  [${FRAME}=on] header > [data-conversation-header-leading] { position:static!important; grid-area:1/1!important; width:auto; min-width:0; margin:0; }
  [${FRAME}=on] header:has(> [data-conversation-header-leading]) > ${names('titleRow')} { grid-area:1/3!important; min-height:30px; display:flex; flex-wrap:nowrap; justify-self:end; padding:0!important; gap:8px; container-type:normal; }
  [${FRAME}=on] header:has(> [data-conversation-header-leading]) ${names('headerUtilities')},[${FRAME}=on] header:has(> [data-conversation-header-leading]) ${names('headerCorner')} { position:static!important; flex:none!important; width:auto; max-width:none!important; min-width:0; min-height:30px; height:30px; flex-wrap:nowrap!important; margin:0; }
  [${FRAME}=on] header > [data-conversation-tabs] { grid-area:1/2!important; min-width:0; max-width:100%; justify-self:stretch; align-items:center; flex-wrap:nowrap!important; gap:24px; margin:0; padding:0; overflow-x:auto; scrollbar-width:none; }
  [${FRAME}=on] header > [data-conversation-tabs] > button { flex:none; padding-block:7px; }
  [${HIDDEN}] { display:none!important; }
  [${PART}=composer][data-dcb-focus-moving] { pointer-events:none; }
  @media(prefers-reduced-motion:reduce) { .dcb-focus-toggle,.dcb-focus-toggle path { transition:none; } }
  @media(forced-colors:active) { .dcb-focus-toggle { background:ButtonFace; color:ButtonText; border-color:ButtonText; } .dcb-focus-toggle[aria-pressed=true] { background:Highlight; color:HighlightText; border-color:Highlight; } .dcb-focus-toggle,.dcb-focus-toggle path { transition:none; } }
`

// Presentation only. Host panel preferences, input nodes and drafts are never
// toggled, replaced or serialized. Input height and grid width change once at
// the handoff; per-frame height/padding would repeatedly resize glass and layout.
// Measure the destination once and animate its displacement before that handoff,
// so clearing the animation and releasing the layout land on the same pixels.
export function createFocusMode(React,doc,win,schedule=()=>{}){
  const h=React.createElement,listeners=new Set(),records=new Map(),animations=new Map(),reading=new Map()
  const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let snapshot={active:false},frame=null,center=null,frameMark=null,centerMark=null,disposed=false,revision=0,raf=0,readingWidth=0,handoff=null
  const restore=(element,key,value)=>value===null?element.removeAttribute(key):element.setAttribute(key,value)
  const publish=active=>{if(snapshot.active===active)return;snapshot={active};for(const listener of listeners)listener()}
  const subscribe=listener=>{listeners.add(listener);return()=>listeners.delete(listener)}
  const quietNow=()=>quiet.matches||doc.hidden
  const cancel=()=>{for(const animation of animations.values())animation.cancel();animations.clear();for(const record of records.values())restore(record.element,'data-dcb-focus-moving',record.moving)}
  function release(record){
    const {element}=record
    animations.get(element)?.cancel();animations.delete(element)
    restore(element,PART,record.part);restore(element,HIDDEN,record.hidden);restore(element,'inert',record.inert);restore(element,'aria-hidden',record.aria);restore(element,'data-dcb-focus-moving',record.moving)
    records.delete(element)
  }
  function collect(){
    if(!frame?.isConnected)return[]
    const parts=[]
    for(const child of frame.children){
      if(child.matches(`${names('sidebarCol')},.nav`))parts.push([child,'left'])
      else if(child.matches(`[data-rightbar-col],${names('rightbarCol')},.right`))parts.push([child,'right'])
      else if(child.matches(names('handle')))parts.push([child,'handle'])
    }
    for(const element of center.querySelectorAll('[data-composer-seat],.dcb-summary'))parts.push([element,element.matches('[data-composer-seat]')?'composer':'extra'])
    for(const element of center.querySelectorAll(`header:has(> [data-conversation-header-leading]) ${names('titleCluster')}`))parts.push([element,'extra'])
    for(const element of doc.querySelectorAll('.dcb-file-viewer'))parts.push([element,'extra'])
    return parts
  }
  function track(element,kind){
    let record=records.get(element)
    if(record)return record
    const copied=element.getAttribute(PART)===kind&&(element.hasAttribute(HIDDEN)||element.hasAttribute('data-dcb-focus-moving'))
    const previous=copied?[...records.values()].find(item=>item.kind===kind&&!item.element.isConnected):null
    record={element,kind,part:copied?previous?.part??null:element.getAttribute(PART),hidden:copied?previous?.hidden??null:element.getAttribute(HIDDEN),inert:copied?previous?.inert??null:element.getAttribute('inert'),aria:copied?previous?.aria??null:element.getAttribute('aria-hidden'),moving:copied?previous?.moving??null:element.getAttribute('data-dcb-focus-moving')}
    records.set(element,record);element.setAttribute(PART,kind);return record
  }
  function block(record){record.element.setAttribute('inert','');record.element.setAttribute('aria-hidden','true')}
  function restoreReading(element,record){
    for(const [name,value,priority,owned]of record){
      if(element.style.getPropertyValue(name)!==owned||element.style.getPropertyPriority(name)!=='important')continue
      if(value)element.style.setProperty(name,value,priority)
      else element.style.removeProperty(name)
    }
    reading.delete(element)
  }
  function holdReading(){
    const bodies=[...center.querySelectorAll('[data-conversation-content]')],wanted=new Set(bodies)
    for(const element of bodies){
      if(reading.has(element))continue
      const props=[['width',`min(100%, ${readingWidth}px)`],['max-width',readingWidth+'px'],['min-width','0px'],['align-self','center']]
      const previous=[...reading].find(([node])=>!node.isConnected)?.[1]
      const record=props.map(([name,value])=>{
        const original=previous?.find(([key,,,owned])=>key===name&&element.style.getPropertyValue(name)===owned&&element.style.getPropertyPriority(name)==='important')
        return[name,original?original[1]:element.style.getPropertyValue(name),original?original[2]:element.style.getPropertyPriority(name),value]
      })
      reading.set(element,record)
      for(const [name,,,value]of record)element.style.setProperty(name,value,'important')
    }
    for(const [element,record]of reading)if(!wanted.has(element))restoreReading(element,record)
  }
  function releaseReading(){for(const [element,record]of reading)restoreReading(element,record)}
  function geometry(){
    const values=new Map(),add=(element,axes)=>{
      if(!element?.getClientRects().length)return
      const box=element.getBoundingClientRect(),position={}
      if(axes.includes('x'))position.x=box.left
      if(axes.includes('y'))position.y=box.top
      values.set(element,position)
    }
    for(const body of center?.querySelectorAll('[data-conversation-content]')||[]){
      add(body,'x')
      // Transform the existing scroll content, never the scroll viewport or its
      // sticky input. This keeps the clipping edge and scrollbar stationary.
      const scroll=body.querySelector('[data-conversation-scroll]')
      for(const child of scroll?.children||[])if(!child.hasAttribute('data-composer-seat'))add(child,'y')
    }
    const header=center?.querySelector('[data-slot="conversation.header"]')||center?.querySelector('header')
    // The native title row stretches across the grid. Its left edge does not
    // describe the utilities aligned to its right; measure those seats instead.
    const seats=[...header?.querySelectorAll(['headerLeading','titleCluster','headerUtilities','headerCorner','viewTabs','tabs'].map(names).join(','))||[]]
    for(const child of seats.length?seats:header?.children||[])add(child,'xy')
    return values
  }
  const scrollTo=(scroll,top)=>scroll.scrollTo({top,behavior:'instant'})
  function pin(){
    const scroll=center?.querySelector('[data-conversation-scroll]')
    if(!scroll)return()=>{}
    const r=scroll.getBoundingClientRect(),top=scroll.scrollTop,tail=scroll.scrollHeight-top-scroll.clientHeight<4
    const hit=doc.elementsFromPoint(r.left+r.width*.5,Math.min(r.bottom-20,r.top+70)).find(el=>scroll.contains(el)&&!el.closest('[data-composer-seat]'))
    const anchor=hit?.closest('p,[data-chat-flow-key],[data-chat-turn],article'),y=anchor?.getBoundingClientRect().top
    return()=>{
      if(!scroll.isConnected)return
      if(tail)scrollTo(scroll,scroll.scrollHeight-scroll.clientHeight)
      else if(anchor?.isConnected)scrollTo(scroll,scroll.scrollTop+anchor.getBoundingClientRect().top-y)
      else scrollTo(scroll,top)
    }
  }
  function destination(keep){
    const mark=frame.getAttribute(FRAME),hidden=[...records.values()].map(record=>[record.element,record.element.getAttribute(HIDDEN)])
    const scroll=center.querySelector('[data-conversation-scroll]'),top=scroll?.scrollTop
    frame.setAttribute(FRAME,'on')
    for(const record of records.values())record.element.setAttribute(HIDDEN,'')
    keep()
    const target=geometry()
    restore(frame,FRAME,mark)
    for(const [element,value]of hidden)restore(element,HIDDEN,value)
    if(scroll)scrollTo(scroll,top)
    return target
  }
  function hide(record){block(record);record.element.setAttribute(HIDDEN,'')}
  function settle(active){
    cancel()
    if(active&&frame){const keep=handoff||pin();frame.setAttribute(FRAME,'on');for(const record of records.values())hide(record);keep()}
    else{
      const keep=pin()
      for(const record of [...records.values()])release(record)
      if(frame)restore(frame,FRAME,frameMark)
      if(center)restore(center,PART,centerMark)
      releaseReading()
      keep();frame=null;center=null;observer.disconnect()
    }
    handoff=null
    schedule()
  }
  function reconcile(){
    raf=0;if(disposed||!snapshot.active)return
    if(!frame?.isConnected||!frame.querySelector('.dcb-focus-toggle')){exit(false);return}
    holdReading()
    const parts=collect(),wanted=new Set(parts.map(([element])=>element))
    for(const [element,kind]of parts)if(!records.has(element)){const record=track(element,kind);hide(record)}
    for(const [element,record]of records)if(!wanted.has(element))release(record)
  }
  function queue(){if(!raf&&!disposed)raf=win.requestAnimationFrame(reconcile)}
  const observer=new win.MutationObserver(entries=>{
    if(!snapshot.active)return
    if(!frame?.isConnected){queue();return}
    if(entries.some(entry=>[...entry.addedNodes,...entry.removedNodes].some(node=>node.nodeType===1&&(node.matches(STRUCTURE)||!entry.target.closest?.('[data-chat-flow]')&&node.querySelector(STRUCTURE)))))queue()
  })
  function move(record,active,from){
    const element=record.element
    if(record.kind==='handle'||record.hidden!==null)return
    const s=win.getComputedStyle(element),to={opacity:active?0:s.opacity},start={opacity:active?s.opacity:0}
    if(s.display==='none')return
    if(record.kind==='composer'){
      record.element.setAttribute('data-dcb-focus-moving','')
      const shifted=`translateY(12px)${s.transform==='none'?'':' '+s.transform}`
      start.transform=active?s.transform:shifted;to.transform=active?shifted:s.transform
    }else{
      // Opacity is safe even for columns containing native fixed titlebar tools
      // or fullscreen panels; never turn them into a transformed containing block.
      start.opacity=active?s.opacity:0
    }
    if(from)Object.assign(start,from)
    try{const animation=element.animate([start,to],{duration:motion.time.scene,easing:motion.ease.smooth,fill:'both'});animation.id='dcb-focus-'+record.kind;animations.set(element,animation)}catch{/* Unsupported surfaces still settle. */}
  }
  function samples(){
    const values=new Map()
    for(const [element]of animations){
      const s=win.getComputedStyle(element),value={opacity:s.opacity}
      if(records.get(element)?.kind==='composer')value.transform=s.transform
      values.set(element,value)
    }
    return values
  }
  function transition(active,from,before,prepared=false){
    const token=++revision
    if(quietNow()){settle(active);return}
    const natural=geometry(),target=active?destination(handoff):natural
    for(const record of records.values())move(record,active,from?.get(record.element))
    for(const [element,end]of target){
      const base=natural.get(element),start=before?.get(element)||base
      if(!base||!start)continue
      const offset=position=>({x:position.x===undefined?0:position.x-base.x,y:position.y===undefined?0:position.y-base.y})
      const first=offset(start),last=offset(end)
      if([first.x,first.y,last.x,last.y].every(value=>Math.abs(value)<.1))continue
      const s=win.getComputedStyle(element),transform=s.transform==='none'?'':` ${s.transform}`
      const shifted=value=>`translate(${value.x}px, ${value.y}px)${transform}`
      try{const animation=element.animate([{transform:shifted(first)},{transform:shifted(last)}],{duration:motion.time.scene,easing:motion.ease.smooth,fill:'both'});animation.id='dcb-focus-position';animations.set(element,animation)}catch{/* Geometry still settles without motion support. */}
    }
    if(!active&&!prepared&&animations.size){
      // Restored native controls publish their size through ResizeObserver and
      // React layout updates. Keep incoming panels transparent while those
      // updates run, then measure the real destination before starting motion.
      for(const animation of animations.values()){animation.pause();animation.currentTime=0;animation.finished.catch(()=>{})}
      win.requestAnimationFrame(()=>win.requestAnimationFrame(()=>win.requestAnimationFrame(()=>{
        if(disposed||token!==revision)return
        const visible=geometry(),values=samples();cancel();transition(false,values,visible,true)
      })))
      return
    }
    Promise.allSettled([...animations.values()].map(animation=>animation.finished)).then(()=>{if(!disposed&&token===revision)settle(active)})
  }
  function enter(button){
    if(disposed)return
    if(frame){const from=samples(),before=geometry();cancel();holdReading();handoff=pin();publish(true);for(const record of records.values())block(record);transition(true,from,before);return}
    center=button.closest(names('centerCol'))||button.closest('main')
    frame=center?.parentElement
    if(!frame||!collect().length){frame=null;center=null;return}
    readingWidth=center.querySelector('[data-conversation-content]')?.getBoundingClientRect().width||center.getBoundingClientRect().width
    holdReading()
    frameMark=frame.getAttribute(FRAME);centerMark=center.getAttribute(PART)
    frame.setAttribute(FRAME,'entering');center.setAttribute(PART,'center')
    for(const [element,kind]of collect()){const record=track(element,kind);block(record)}
    handoff=pin()
    publish(true);observer.observe(doc.body,{childList:true,subtree:true});transition(true)
  }
  function exit(animated=true){
    if(!frame){publish(false);return}
    const from=samples(),before=geometry();cancel();handoff=null;const keep=pin();restore(frame,FRAME,frameMark)
    frame.setAttribute(FRAME,'leaving')
    for(const record of records.values())restore(record.element,HIDDEN,record.hidden)
    releaseReading()
    keep();publish(false)
    if(animated)transition(false,from,before)
    else{revision++;settle(false)}
  }
  function Button(){
    const state=React.useSyncExternalStore(subscribe,()=>snapshot,()=>snapshot)
    return h('button',{type:'button',className:'dcb-focus-toggle','aria-label':state.active?'退出专注模式':'进入专注模式','aria-pressed':state.active,title:state.active?'退出专注模式 · Esc':'专注阅读 · 隐藏输入框和左右面板',onClick:event=>state.active?exit():enter(event.currentTarget)},
      h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('rect',{x:3,y:4,width:18,height:16,rx:3}),h('path',{d:state.active?'M8 9h8v6H8Z':'M8 4v16m8-16v16M8 16h8'})))
  }
  const key=event=>{
    if(event.key!=='Escape'||event.defaultPrevented||!snapshot.active||event.isComposing)return
    // Let open menus/dialogs consume their first Escape normally.
    if(event.target.closest?.('[role=dialog],[role=menu],[role=listbox]'))return
    event.preventDefault();exit()
  }
  const preference=()=>{if(quietNow()&&frame){revision++;settle(snapshot.active)}}
  doc.addEventListener('keydown',key);quiet.addEventListener('change',preference);doc.addEventListener('visibilitychange',preference)
  return{Button,dispose(){if(disposed)return;disposed=true;revision++;observer.disconnect();win.cancelAnimationFrame(raf);settle(false);publish(false);listeners.clear();doc.removeEventListener('keydown',key);quiet.removeEventListener('change',preference);doc.removeEventListener('visibilitychange',preference)}}
}
