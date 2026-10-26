import {motion} from './motion.js'
const TABS='[data-conversation-tabs]',MARK='data-dcb-conversation-tabs'
const INDICATOR='data-dcb-conversation-indicator',MOTION='data-dcb-conversation-motion',CLIP='data-dcb-conversation-clip'
const WIDTH='data-dcb-view-width'
const ROW='data-dcb-views-row',MORE='data-dcb-views-more',MORE_ACTIVE='data-dcb-views-more-active'
const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`
// The host's View-tab row is a wrapping flex line; its 「更多会话视图」 launcher
// is a sibling of the tablist, so it is the second thing that wraps. Match it
// without depending on the hashed module class.
const isMoreButton=el=>!!el&&el.tagName==='BUTTON'&&el.getAttribute('aria-haspopup')==='menu'&&
  (!el.getAttribute('role')||el.getAttribute('role')==='button')&&
  [...el.classList].some(name=>name.includes('viewsMore'))
const EASE=motion.ease.smooth
const MAX_NODES=96,MAX_ROOTS=8,MAX_PIXELS=4_000_000
const LIQUID_REST='M 1 5 C 24 5 76 5 99 5 C 100.333333 5 100.333333 7 99 7 C 76 7 24 7 1 7 C -.333333 7 -.333333 5 1 5 Z'
const LIQUID_RIGHT='M 1 5.4 C 20 5.5 64 5.8 86 3.5 C 100 1.4 104 10.6 86 8.5 C 64 6.2 20 6.5 1 6.6 C 0 6.6 0 5.4 1 5.4 Z'
const LIQUID_LEFT='M 14 3.5 C 36 5.8 80 5.5 99 5.4 C 100 5.4 100 6.6 99 6.6 C 80 6.5 36 6.2 14 8.5 C -4 10.6 0 1.4 14 3.5 Z'
const pathValue=value=>`path("${value}")`

export const conversationTabsCss=`
  [${WIDTH}=shared] { box-sizing:border-box; width:min(var(--dsh-chat-content-width,920px),calc(100% - var(--dsh-composer-side-clearance,16px) * 2 - 32px)); max-width:100%; min-width:0; align-self:center; }
  /* The host hides width handles for composer-overlay views such as Trace.
     Our shared column needs the same native controls, capture and preference. */
  [data-conversation-content]:has([${WIDTH}=shared]) > [data-width-handle] { display:block; }
  [${MARK}] { position: relative; }
  [${MARK}] > button[role="tab"]::after { background: transparent !important; }
  [${INDICATOR}] {
    position: absolute; left: 0; top: 0; width: 1px; height: 2px;
    transform-origin: 0 50%; pointer-events: none;
    color: var(--dsw-alias-state-business-primary, currentColor);
  }
  [${INDICATOR}] > svg { position: absolute; left: 0; top: -5px; width: 100%; height: 12px; overflow: visible; pointer-events: none; fill: currentColor; }
  [${INDICATOR}][hidden] { display: none; }
  [${INDICATOR}][data-moving] { will-change: transform, width; }
  [${CLIP}] { overflow: clip; }
  [${MOTION}="slide"] { will-change: opacity, transform; }
  [${MOTION}="fade"] { will-change: opacity; }
  @media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
    [${MARK}] > button[role="tab"] { transition: color ${motion.time.quick}ms ${motion.ease.color}; }
  }
  /* The row wraps natively (flex-wrap:wrap), so the small 「更多会话视图」 launcher
     fell to a second line whenever the row measured narrow: it landed on the
     header's 0.5px bottom border, far from the labels it belongs to. Pin the
     row to one line, let the tablist shrink first, and dress the launcher as a
     quiet companion of the labels instead of a stray square. */
  [${ROW}][${ROW}] { flex-wrap: nowrap; }
  [${ROW}][${ROW}] > [${TABS}] { flex: 0 1 auto; min-width: 0; align-self: flex-start; }
  [${MORE}] {
    position: relative; flex: none; border-radius: 8px;
    color: var(--dsw-alias-label-secondary);
    transition: background-color ${motion.time.quick}ms ${motion.ease.color},
      color ${motion.time.quick}ms ${motion.ease.color},
      transform ${motion.time.control}ms ${motion.ease.smooth};
  }
  [${MORE}]:hover, [${MORE}][aria-expanded="true"] {
    background-color: var(--dsw-alias-interactive-bg-hover);
    color: var(--dsw-alias-label-primary);
  }
  [${MORE}]:active { transform: scale(.9); }
  [${MORE}]:focus-visible {
    outline: 2px solid var(--dsw-alias-state-business-primary);
    outline-offset: 1px;
  }
  /* The active state means the current View lives inside that menu; a 4px dot
     says so without a second label next to the tabs. */
  [${MORE}]::after {
    content: ''; position: absolute; right: 3px; bottom: 3px; width: 4px; height: 4px;
    border-radius: 50%; background: var(--dsw-alias-state-business-primary);
    opacity: 0; transform: scale(.4);
    transition: opacity ${motion.time.quick}ms ${motion.ease.color},
      transform ${motion.time.quick}ms ${motion.ease.smooth};
  }
  [${MORE}][${MORE_ACTIVE}]::after { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
    [${MORE}] { animation: dcb-views-more-in ${motion.time.control}ms ${motion.ease.smooth} both; }
  }
  @keyframes dcb-views-more-in {
    from { opacity: 0; filter: blur(${motion.blur}px); }
    to { opacity: 1; filter: blur(0); }
  }
  @media (prefers-reduced-motion: reduce), (forced-colors: active) {
    [${MORE}], [${MORE}]::after { transition: none; }
  }
`

// Decorate the host's top-level View tabs. The native buttons, View renderer,
// resident scrollport and composer keep their identity and event handlers.
export function createConversationTabs(doc,win,schedule){
  const records=new Map(),quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  const forced=win.matchMedia('(forced-colors: active)')
  let disposed=false
  const restore=(el,key,value)=>value===null?el.removeAttribute(key):el.setAttribute(key,value)
  const visible=el=>el?.isConnected&&el.getClientRects().length>0&&win.getComputedStyle(el).visibility!=='hidden'
  function binding(tabs,record){
    const anchor=tabs.closest('header')?.parentElement
    // Token appends and scroll events do not change the resident content seats.
    // Reuse them without repeatedly querying the entire conversation subtree.
    if(anchor===record.anchor&&record.panel?.contains(tabs)&&record.body?.isConnected&&
        record.panel.contains(record.body)&&record.scroll?.isConnected&&record.body.contains(record.scroll)&&
        record.area?.isConnected&&record.scroll.contains(record.area)){
      return {body:record.body,scroll:record.scroll,area:record.area,panel:record.panel,anchor,
        session:record.body.getAttribute('data-conversation-session')}
    }
    let body=null,owner=null
    // Stop at the nearest conversation panel. Nested conversation bodies must
    // neither disable their parent tabs nor bind their tabs to the outer view.
    for(let panel=anchor;panel&&panel!==doc.body;panel=panel.parentElement){
      const bodies=[...panel.querySelectorAll('[data-conversation-content]')].filter(el=>!el.contains(tabs))
      const outer=bodies.filter(el=>!bodies.some(other=>other!==el&&other.contains(el)))
      if(outer.length){if(outer.length===1){body=outer[0];owner=panel}break}
      if(panel.hasAttribute('data-phase'))break
    }
    const scroll=body?.querySelector('[data-conversation-scroll]')
    const area=scroll&&[...scroll.querySelectorAll(names('viewArea'))].find(el=>
      el.closest('[data-conversation-content]')===body&&!el.closest('[data-composer-seat]'))
    return {body,area,scroll,panel:owner,anchor,session:body?.getAttribute('data-conversation-session')}
  }
  // The 「更多会话视图」 launcher shares the tab row: keep it out of the wrap and
  // mirror the host's active class so the stylesheet can mark the current View.
  function bindRow(record){
    const row=record.tabs.parentElement
    const more=!row||row===doc.body?null:[...row.children].find(isMoreButton)||
      [...row.querySelectorAll('button[aria-haspopup="menu"]')].find(isMoreButton)
    if(!more){releaseRow(record);return}
    if(record.row!==row||record.more!==more){
      releaseRow(record)
      record.row=row;record.rowOriginal=row.getAttribute(ROW)
      record.more=more;record.moreOriginal=more.getAttribute(MORE)
      row.setAttribute(ROW,'');more.setAttribute(MORE,'')
    }
    const active=[...more.classList].some(name=>name.includes('viewsMoreActive'))
    restore(more,MORE_ACTIVE,active?'':null)
  }
  function releaseRow(record){
    if(record.row){restore(record.row,ROW,record.rowOriginal);record.row=null;record.rowOriginal=null}
    if(record.more){
      restore(record.more,MORE,record.moreOriginal);restore(record.more,MORE_ACTIVE,null)
      record.more=null;record.moreOriginal=null
    }
  }
  function stopIndicator(record){
    record.indicatorAnimation?.cancel();record.indicatorAnimation=null
    record.liquidAnimation?.cancel();record.liquidAnimation=null
    record.indicator.removeAttribute('data-moving')
  }
  function stopContent(record){
    const motion=record.motion
    if(!motion)return
    record.motion=null
    record.resize.unobserve(motion.target)
    motion.animation.cancel()
    restore(motion.target,MOTION,motion.originalMotion)
    restore(motion.area,CLIP,motion.originalClip)
  }
  function release(record){
    stopContent(record);stopIndicator(record);record.resize.disconnect()
    releaseWidth(record)
    releaseRow(record)
    record.indicator.remove();restore(record.tabs,MARK,record.originalMark)
  }
  function releaseWidth(record){
    if(record.widthArea)restore(record.widthArea,WIDTH,record.widthMark)
    record.widthArea=null;record.widthSelected=null;record.widthReady=false
  }
  function syncWidth(record,next,selected){
    if(record.widthArea!==next.area){releaseWidth(record);if(next.area){record.widthArea=next.area;record.widthMark=next.area.getAttribute(WIDTH)}}
    if(!next.area||record.widthSelected===selected&&record.widthReady)return
    // Classify once per selected view, not on every streamed token or scroll.
    // The native ChatView already applies this width inside its padded column.
    let seat=next.area
    for(let depth=0;depth<8&&seat.childElementCount===1&&seat.firstElementChild.hasAttribute('data-slot');depth++)seat=seat.firstElementChild
    record.widthReady=seat.childElementCount>0;record.widthSelected=selected
    const chat=[...next.area.querySelectorAll('[data-chat-flow]')].some(flow=>flow.closest('[data-conversation-content]')===next.body)
    if(chat)restore(next.area,WIDTH,record.widthMark)
    else next.area.setAttribute(WIDTH,'shared')
  }
  function move(record,selected,animate){
    const {tabs,indicator}=record
    if(!visible(tabs)||!visible(selected)||forced.matches){
      stopIndicator(record);indicator.hidden=true;restore(tabs,MARK,record.originalMark)
      record.geometry=null;return
    }
    const parent=tabs.getBoundingClientRect(),rect=selected.getBoundingClientRect(),style=win.getComputedStyle(tabs),button=win.getComputedStyle(selected),underline=win.getComputedStyle(selected,'::after')
    const px=value=>parseFloat(value)||0
    // DOMRects use rendered pixels; CSS positions use the unscaled padding box.
    // Keep fractional sizes rather than rounded offsetWidth/clientLeft values.
    const box=(style,axis)=>px(style[axis])+(style.boxSizing==='border-box'?0:axis==='width'?px(style.paddingLeft)+px(style.paddingRight)+px(style.borderLeftWidth)+px(style.borderRightWidth):px(style.paddingTop)+px(style.paddingBottom)+px(style.borderTopWidth)+px(style.borderBottomWidth))
    const sx=parent.width/box(style,'width')||1,sy=parent.height/box(style,'height')||1
    const inset=px(underline.left),right=px(underline.right),height=px(underline.height)||2
    const localWidth=rect.width/sx-px(button.borderLeftWidth)-px(button.borderRightWidth)
    const x=(rect.left-parent.left)/sx-px(style.borderLeftWidth)+tabs.scrollLeft+px(button.borderLeftWidth)+inset
    const y=(rect.bottom-parent.top)/sy-px(style.borderTopWidth)+tabs.scrollTop-px(button.borderBottomWidth)-px(underline.bottom)-height
    const width=localWidth-inset-right
    if(width<.5){stopIndicator(record);indicator.hidden=true;record.geometry=null;restore(tabs,MARK,record.originalMark);return}
    const old=record.geometry
    if(old&&Math.abs(old.x-x)<.1&&Math.abs(old.width-width)<.1&&Math.abs(old.y-y)<.1&&Math.abs(old.height-height)<.1)return
    const current=win.getComputedStyle(indicator),from={transform:current.transform,width:current.width}
    const shape=win.getComputedStyle(record.shape).d||pathValue(LIQUID_REST)
    const currentX=new win.DOMMatrix(current.transform).m41,currentWidth=px(current.width)
    stopIndicator(record)
    const to={transform:`translateX(${x}px)`,width:`${width}px`}
    indicator.style.transform=to.transform;indicator.style.width=to.width;indicator.style.top=`${y}px`;indicator.style.height=`${height}px`
    indicator.firstElementChild.style.top=`${-height*2.5}px`;indicator.firstElementChild.style.height=`${height*6}px`
    indicator.hidden=false;tabs.setAttribute(MARK,'')
    record.geometry={x,width,y,height}
    if(!animate||!old||quiet.matches||doc.hidden||typeof indicator.animate!=='function')return
    try{
      const rightward=x+width/2>=currentX+currentWidth/2
      const stretchX=rightward?currentX+(x-currentX)*.08:x
      const stretchRight=rightward?x+width:currentX+currentWidth+(x+width-currentX-currentWidth)*.08
      const leadingEase='cubic-bezier(.22,.8,.26,1)',trailingEase='cubic-bezier(.4,0,.2,1)'
      // Ease the two phases separately so the drop remains visible around the
      // middle of the switch, before the trailing edge catches up.
      const options={duration:motion.time.standard,easing:'linear',fill:'both'}
      const animation=indicator.animate([{...from,easing:leadingEase},{transform:`translateX(${stretchX}px)`,width:`${Math.max(width,stretchRight-stretchX)}px`,offset:.42,easing:trailingEase},to],options)
      animation.id='dcb-conversation-indicator';record.indicatorAnimation=animation
      // Morph only a tiny SVG underline; no filter, canvas, transcript snapshot
      // or JS frame loop is needed for the leading drop and trailing neck.
      if(win.CSS?.supports?.('d',pathValue(LIQUID_REST))){
        record.liquidAnimation=record.shape.animate([{d:shape,easing:leadingEase},{d:pathValue(rightward?LIQUID_RIGHT:LIQUID_LEFT),offset:.42,easing:trailingEase},{d:pathValue(LIQUID_REST)}],options)
        record.liquidAnimation.id='dcb-conversation-liquid'
      }
      indicator.setAttribute('data-moving','')
      animation.finished.then(()=>{if(record.indicatorAnimation===animation)stopIndicator(record)},()=>{
        if(record.indicatorAnimation===animation)stopIndicator(record)
      })
    }catch{stopIndicator(record)/* The static underline remains available without WAAPI. */}
  }
  function overSize(target){
    const rect=target.getBoundingClientRect(),dpr=win.devicePixelRatio||1
    const height=Math.max(rect.height,target.scrollHeight),width=Math.max(rect.width,target.scrollWidth)
    return height>win.innerHeight*1.5||width*height*dpr*dpr>MAX_PIXELS
  }
  function targetFor(area){
    // Slot outlets may be display:contents. Animate the one layout root below
    // them so clipping stays on the stationary View area, outside the composer.
    if(area.childElementCount>MAX_ROOTS)return null
    let candidates=[...area.children]
    for(let depth=0;depth<8;depth++){
      if(candidates.some(el=>el.childElementCount>MAX_ROOTS&&win.getComputedStyle(el).display==='contents'))return null
      const next=candidates.flatMap(el=>win.getComputedStyle(el).display==='contents'?[...el.children]:[el])
      if(next.length>MAX_ROOTS)return null
      if(next.length===candidates.length&&next.every((el,i)=>el===candidates[i]))break
      candidates=next
    }
    candidates=candidates.filter(el=>visible(el)&&el.getBoundingClientRect().height>.5)
    const target=candidates.length===1?candidates[0]:area
    // Even opacity/transform can promote an entire long transcript into an
    // enormous raster layer. The small tab underline is enough for those views.
    if(overSize(target))return null
    // Never enumerate all descendants, or read a style for every history node.
    // An over-budget view keeps native rendering and only animates its tabs.
    const walker=doc.createTreeWalker(target,win.NodeFilter.SHOW_ELEMENT)
    let visited=0,fixed=false
    for(let el=target;el;el=walker.nextNode()){
      if(++visited>MAX_NODES)return null
      if(win.getComputedStyle(el).position==='fixed')fixed=true
    }
    // Moving an ancestor would re-anchor fixed controls inside the active view.
    return {target,slide:target!==area&&!fixed}
  }
  function enter(record,direction){
    const {area}=record
    if(!area||!visible(area)||quiet.matches||doc.hidden)return
    const plan=targetFor(area)
    if(!plan){stopContent(record);return}
    const {target,slide}=plan
    if(!visible(target)||typeof target.animate!=='function')return
    const previous=record.motion,carry=previous?.target===target&&previous.slide===slide
    const from=carry?win.getComputedStyle(target):null
    const current=from&&{opacity:from.opacity,transform:from.transform}
    stopContent(record)
    const base=win.getComputedStyle(target),first={opacity:current?.opacity??0},last={opacity:base.opacity}
    if(slide){
      first.transform=current?.transform??`translateX(${direction*14}px)${base.transform==='none'?'':` ${base.transform}`}`
      last.transform=base.transform
    }
    const originalMotion=target.getAttribute(MOTION),originalClip=area.getAttribute(CLIP)
    try{
      const animation=target.animate([first,last],{duration:motion.time.standard,easing:EASE,fill:'both'})
      animation.id='dcb-conversation-view'
      record.motion={animation,target,area,slide,originalMotion,originalClip}
      record.resize.observe(target)
      target.setAttribute(MOTION,slide?'slide':'fade')
      if(slide)area.setAttribute(CLIP,'')
      animation.finished.then(()=>{if(record.motion?.animation===animation)stopContent(record)},()=>{
        if(record.motion?.animation===animation)stopContent(record)
      })
    }catch{/* Unsupported animation leaves native content visible. */}
  }
  function sync(){
    if(disposed)return
    const incoming=new Set(doc.querySelectorAll(TABS))
    for(const [tabs,record]of records)if(!incoming.has(tabs)){release(record);records.delete(tabs)}
    for(const tabs of incoming){
      const buttons=[...tabs.querySelectorAll(':scope > button[role="tab"]')]
      const selected=buttons.find(el=>el.getAttribute('aria-selected')==='true')
      let record=records.get(tabs)
      if(!record){
        const indicator=doc.createElement('span')
        indicator.setAttribute(INDICATOR,'');indicator.setAttribute('aria-hidden','true');indicator.hidden=true
        const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg'),shape=doc.createElementNS('http://www.w3.org/2000/svg','path')
        svg.setAttribute('viewBox','0 0 100 12');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');shape.setAttribute('d',LIQUID_REST);svg.append(shape);indicator.append(svg)
        record={tabs,indicator,shape,originalMark:tabs.getAttribute(MARK),geometry:null,selected:null,motion:null,body:null,session:null,row:null,rowOriginal:null,more:null,moreOriginal:null}
        record.resize=new win.ResizeObserver(schedule)
        record.resize.observe(tabs);record.buttons=[];records.set(tabs,record)
      }
      if(!record.indicator.isConnected)tabs.appendChild(record.indicator)
      bindRow(record)
      if(buttons.length!==record.buttons.length||buttons.some((el,i)=>el!==record.buttons[i])){
        for(const button of record.buttons)record.resize.unobserve(button)
        for(const button of buttons)record.resize.observe(button)
        record.buttons=buttons
      }
      const next=binding(tabs,record),sameSession=next.body===record.body&&next.session===record.session&&next.session!=null
      const changed=!!selected&&selected!==record.selected&&buttons.includes(record.selected)
      const direction=buttons.indexOf(selected)>=buttons.indexOf(record.selected)?1:-1
      if(!sameSession||!visible(tabs)){
        stopContent(record);record.pending=null
      }else if(next.area!==record.area||(record.motion&&(!record.motion.target.isConnected||overSize(record.motion.target))))stopContent(record)
      syncWidth(record,next,selected)
      Object.assign(record,next)
      move(record,selected,sameSession&&changed)
      if(changed&&sameSession&&visible(tabs))record.pending={direction,until:win.performance.now()+400}
      if(record.pending){
        if(quiet.matches||doc.hidden||win.performance.now()>record.pending.until)record.pending=null
        else if(next.area?.childElementCount){enter(record,record.pending.direction);record.pending=null}
      }
      record.selected=selected
    }
  }
  const preference=()=>{
    for(const record of records.values()){stopContent(record);stopIndicator(record);record.geometry=null;record.pending=null}
    schedule()
  }
  const interaction=event=>{
    for(const record of records.values())if(record.motion&&record.area.contains(event.target))stopContent(record)
  }
  quiet.addEventListener('change',preference)
  forced.addEventListener('change',preference)
  doc.addEventListener('pointerdown',interaction,true);doc.addEventListener('keydown',interaction,true)
  doc.addEventListener('visibilitychange',preference)
  return {sync,dispose(){
    if(disposed)return
    disposed=true;quiet.removeEventListener('change',preference)
    forced.removeEventListener('change',preference)
    doc.removeEventListener('pointerdown',interaction,true);doc.removeEventListener('keydown',interaction,true)
    doc.removeEventListener('visibilitychange',preference)
    for(const record of records.values())release(record)
    records.clear()
  }}
}
