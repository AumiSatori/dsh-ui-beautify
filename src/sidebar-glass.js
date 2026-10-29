import {motion} from './motion.js'
import {createSidebarLayout} from './sidebar-layout.js'
import {animateSidebarToggle,createRightSidebarMotion} from './sidebar-motion.js'
const MARK='data-dcb-sidebar-style',COLUMN='data-dcb-sidebar-column',MOTION='data-dcb-sidebar-motion'
const TOGGLE='data-dcb-sidebar-toggle',STATE='data-dcb-sidebar-toggle-state',MOVING='data-dcb-sidebar-moving',RIGHT_TOGGLE='data-dcb-sidebar-toggle-right'
const FRAME='data-dcb-sidebar-frame-motion',RESIZING='data-dcb-sidebar-resizing',DURATION=motion.time.sidebar
const suffix=(el,name)=>[...el.classList].some(value=>value.endsWith('_'+name))
const visible=el=>el.isConnected&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'
export function createSidebarGlass(doc,win,schedule){
  const records=new Map()
  const layout=createSidebarLayout(doc,win)
  const rightMotion=createRightSidebarMotion(doc,win)
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)'),forced=win.matchMedia('(forced-colors: active)')
  const restore=(el,name,value)=>value===null?el.removeAttribute(name):el.setAttribute(name,value)
  const set=(el,name,value)=>{if(el.getAttribute(name)!==value)el.setAttribute(name,value)}
  const stopAnimations=record=>{for(const animation of record.animations)animation.cancel();record.animations.clear()}
  const stopContent=record=>{for(const animation of record.contentAnimations)animation.cancel();record.contentAnimations.clear();record.ghost?.remove();record.ghost=null;record.enterSeats=null}
  function capture(record){
    if(!record.animate||!record.dirty||record.collapsed||record.moving)return
    record.dirty=false
    const {root,column}=record,bounds=root.getBoundingClientRect(),origin=column.getBoundingClientRect()
    if(!bounds.width||!bounds.height)return
    const clone=root.cloneNode(true),sourceNodes=[root,...root.querySelectorAll('*')],cloneNodes=[clone,...clone.querySelectorAll('*')],scroll=[]
    for(let i=0;i<sourceNodes.length;i++){
      const source=sourceNodes[i],copy=cloneNodes[i]
      copy.removeAttribute('id')
      if(source.scrollTop||source.scrollLeft)scroll.push([copy,source.scrollTop,source.scrollLeft])
    }
    // This is a short-lived visual copy. Native controls stay in the live root;
    // no events, IDs, editable fields or duplicate titlebar buttons survive.
    for(const el of clone.querySelectorAll('[class$="_toggle"], [class*="_toggle "], .dcb-sidebar-toggle-right, [data-dcb-caption-button], [data-dcb-icon-group=caption], [class$="_topStrip"], [class*="_topStrip "], input, textarea, [contenteditable]'))el.remove()
    clone.setAttribute('data-dcb-sidebar-ghost','');clone.setAttribute('aria-hidden','true');clone.inert=true;clone.removeAttribute(MOVING)
    const styles={position:'absolute',left:`${bounds.left-origin.left}px`,top:`${bounds.top-origin.top}px`,width:`${bounds.width}px`,height:`${bounds.height}px`,margin:'0',padding:win.getComputedStyle(root).padding,'border-radius':win.getComputedStyle(root).borderRadius,'pointer-events':'none','z-index':'2'}
    for(const [key,value] of Object.entries(styles))clone.style.setProperty(key,value,'important')
    record.snapshot={clone,scroll}
  }
  function animateContent(record){
    const current=record.ghost||record.enterSeats?.find(el=>suffix(el,'regionArea'))||record.enterSeats?.[0]
    const sampled=current&&win.getComputedStyle(current),from=sampled?{opacity:sampled.opacity,transform:sampled.transform}:null
    const width=parseFloat(record.snapshot?.clone.style.width)||parseFloat(record.root.style.width)||record.root.getBoundingClientRect().width
    stopContent(record)
    const remaining=from?Math.min(1,Math.abs(new win.DOMMatrix(from.transform).m41)/Math.max(1,width)):1
    const duration=from?DURATION*(record.collapsed?1-remaining:remaining):DURATION
    const options={duration:Math.max(1,duration),easing:motion.ease.smooth},track=(animation,done)=>{
      record.contentAnimations.add(animation)
      animation.finished.then(()=>{record.contentAnimations.delete(animation);done?.();animation.cancel()},()=>record.contentAnimations.delete(animation))
    }
    if(record.collapsed){
      const snapshot=record.snapshot
      if(!snapshot)return
      // A cached content clone can predate a material switch or a newly ready
      // refraction map. Only transparent glass may retain the current live map;
      // blur-only materials must not inherit a removed SVG filter reference.
      const filter=record.root.getAttribute(MARK)==='clear'&&record.root.style.getPropertyValue('--dcb-liquid-filter')
      if(filter)snapshot.clone.style.setProperty('--dcb-liquid-filter',filter)
      else snapshot.clone.style.removeProperty('--dcb-liquid-filter')
      record.ghost=snapshot.clone;record.column.append(record.ghost)
      for(const [el,top,left] of snapshot.scroll){el.scrollTop=top;el.scrollLeft=left}
      const ghost=record.ghost
      track(ghost.animate([from||{opacity:1,transform:'none'},{opacity:0,transform:`translateX(${-width}px)`}],{...options,fill:'forwards'}),()=>{ghost.remove();if(record.ghost===ghost)record.ghost=null})
    }else{
      // Never transform the root or logo row: the Windows titlebar toggle is
      // fixed inside them. New chat is a content seat while expanded, even
      // when caption controls mark it for fixed positioning after collapse.
      const seats=[...record.root.children].flatMap(el=>suffix(el,'logoRow')?[...el.children].filter(child=>suffix(child,'brand')):suffix(el,'newSession')||suffix(el,'panelList')||suffix(el,'regionArea')||suffix(el,'footArea')?[el]:[])
      record.enterSeats=seats
      for(const seat of seats)track(seat.animate([from||{opacity:0,transform:`translateX(${-width}px)`},{opacity:1,transform:'none'}],{...options,fill:'backwards'}))
    }
  }
  function releaseGlass(record){
    if(!record.decorated)return
    record.decorated=false
    restore(record.root,MARK,record.style);restore(record.root,MOTION,record.motion);restore(record.column,COLUMN,record.columnMark)
  }
  function release(record){
    layout.release(record.frame)
    releaseGlass(record);stopAnimations(record);stopContent(record);record.resize.disconnect();record.observer.disconnect()
    win.clearTimeout(record.settleTimer)
    win.clearTimeout(record.resizeTimer);restore(record.frame,FRAME,record.frameMark);restore(record.frame,RESIZING,record.resizingMark)
    restore(record.root,MOVING,record.movingMark)
    releaseButton(record);releaseRightToggle(record)
  }
  function roots(){
    return [...doc.querySelectorAll('[class$="_sidebarCol"], [class*="_sidebarCol "]')].flatMap(column=>{
      const root=[...column.querySelectorAll('[class$="_root"], [class*="_root "]')].find(el=>!el.hasAttribute('data-dcb-sidebar-ghost')&&[...el.children].some(child=>suffix(child,'logoRow')))
      return root?[{column,root}]:[]
    })
  }
  function releaseButton(record){
    if(!record.button)return
    record.button.removeEventListener('click',record.click)
    restore(record.button,TOGGLE,record.buttonMark);restore(record.button,STATE,record.buttonState)
  }
  function releaseRightToggle(record){
    if(!record.rightToggle)return
    record.rightToggle.removeEventListener('click',record.rightClick);record.rightToggle.remove();record.rightToggle=null
  }
  function ensureRightToggle(record){
    if(record.rightToggle?.isConnected)return
    const handle=doc.createElement('button');handle.type='button';handle.className='dcb-sidebar-toggle-right';handle.setAttribute(RIGHT_TOGGLE,'');handle.innerHTML='<span aria-hidden="true"></span>'
    record.rightClick=()=>record.button?.click()
    // Keep the edge control outside the clipped sidebar column so it remains
    // reachable when the desktop host collapses that column to zero pixels.
    handle.addEventListener('click',record.rightClick);record.frame.append(handle);record.rightToggle=handle
  }
  function animateToggle(record,collapsed){
    animateSidebarToggle(record,win,collapsed)
  }
  function startMoving(record){
    win.clearTimeout(record.settleTimer)
    const revision=record.settleRevision=(record.settleRevision||0)+1
    if(record.animate)layout.hold(record.frame)
    else layout.release(record.frame)
    // Wait for the native grid track before initializing the refraction map.
    // Keep a bounded timer so interrupted transitions and hidden windows settle.
    const seat=record.frame.hasAttribute('data-dcb-sidebar-overlay')?record.column:record.frame
    const style=win.getComputedStyle(seat),times=value=>value.split(',').map(s=>parseFloat(s)*(s.trim().endsWith('ms')?1:1000)||0)
    const durations=times(style.transitionDuration),delays=times(style.transitionDelay)
    const duration=Math.max(0,...durations.map((value,i)=>value+delays[i%delays.length]))
    if(!duration){layout.release(record.frame);record.settleTimer=0;record.moving=false;restore(record.root,MOVING,record.movingMark);stopContent(record);return}
    record.moving=true;set(record.root,MOVING,'')
    if(record.animate&&!record.frame.hasAttribute(RESIZING))animateContent(record)
    const settle=()=>{
      if(records.get(record.root)!==record||record.settleRevision!==revision)return
      record.settleTimer=0;layout.release(record.frame);record.moving=false;stopContent(record);restore(record.root,MOVING,record.movingMark);record.dirty=true;schedule()
    }
    record.settleTimer=win.setTimeout(()=>{
      // Under long-history load, style resolution can start the grid transition
      // later than the click. Do not release against an estimated wall clock.
      const tracks=seat.getAnimations().filter(animation=>['width','grid-template-columns'].includes(animation.transitionProperty)&&['pending','running'].includes(animation.playState))
      if(tracks.length)Promise.allSettled(tracks.map(animation=>animation.finished)).then(settle)
      else settle()
    },Math.min(1000,duration+40))
  }
  function sync(style,motion){
    const incoming=roots(),wanted=new Set(incoming.map(item=>item.root)),animate=motion&&!reduced.matches&&!forced.matches
    rightMotion.sync(animate)
    for(const [root,record] of records)if(!wanted.has(root)){release(record);records.delete(root)}
    for(const {root,column} of incoming){
      const frame=column.parentElement,collapsed=frame.getAttribute('data-sidebar-collapsed')==='true'||suffix(root,'collapsed')
      let record=records.get(root)
      if(record&&(record.column!==column||record.frame!==frame)){release(record);records.delete(root);record=null}
      if(!record){
        record={root,column,frame,collapsed,inlineWidth:root.style.width,animations:new Set(),contentAnimations:new Set(),dirty:true,moving:false,movingMark:root.getAttribute(MOVING),frameMark:frame.getAttribute(FRAME),resizingMark:frame.getAttribute(RESIZING)}
        record.resize=new win.ResizeObserver(()=>{record.dirty=true;if(!record.moving)schedule()});record.resize.observe(root)
        record.observer=new win.MutationObserver(entries=>{
          if(frame.matches('[data-dragging], [data-rightbar-instant], [data-rightbar-fullscreen]'))layout.release(frame)
          else if(record.animate&&entries.some(entry=>entry.target===frame&&entry.attributeName==='data-sidebar-collapsed'))layout.hold(frame)
          const content=entries.some(entry=>entry.target!==frame&&entry.target!==root&&!record.ripple?.contains(entry.target))
          if(content)record.dirty=true
          if(content||entries.some(entry=>entry.target===frame)||record.inlineWidth!==root.style.width){record.inlineWidth=root.style.width;schedule()}
        })
        record.observer.observe(frame,{attributes:true,attributeFilter:['data-sidebar-collapsed','data-dragging','data-rightbar-instant','data-rightbar-fullscreen','style']})
        record.observer.observe(root,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['style','class','aria-selected','aria-current']})
        records.set(root,record)
      }
      ensureRightToggle(record)
      set(frame,FRAME,String(animate))
      const button=root.querySelector('[class$="_toggle"], [class*="_toggle "]')
      if(button!==record.button){
        stopAnimations(record)
        releaseButton(record)
        record.button=button;record.buttonMark=button?.getAttribute(TOGGLE)??null;record.buttonState=button?.getAttribute(STATE)??null
        if(button){
          record.click=()=>{
            if(!record.animate||reduced.matches||forced.matches)return
            if(record.frame.hasAttribute('data-dcb-sidebar-overlay')&&record.column.getAnimations().some(animation=>animation.transitionProperty==='width'&&['pending','running'].includes(animation.playState))){
              // Freeze the current visual width before React handles a rapid
              // second click; its state update can otherwise arrive a frame
              // later while the old transition continues in the wrong direction.
              const width=record.column.getBoundingClientRect().width
              record.frame.style.setProperty('--dcb-overlay-left-width',width+'px')
              win.getComputedStyle(record.column).width
            }
            layout.hold(record.frame,{prepare:true})
            const collapsed=record.frame.getAttribute('data-sidebar-collapsed')==='true'||suffix(record.root,'collapsed')
            if(!collapsed)capture(record)
            record.clickedAt=win.performance.now();animateToggle(record,!collapsed)
          }
          button.addEventListener('click',record.click)
        }
      }
      record.animate=animate
      if(button){set(button,TOGGLE,String(animate));set(button,STATE,collapsed?'collapsed':'expanded')}
      if(record.rightToggle){
        const label=collapsed?'展开左侧栏':'收起左侧栏'
        const desktop=doc.documentElement.hasAttribute('data-windows-titlebar')||doc.documentElement.dataset.platform==='darwin'
        const columnStyle=win.getComputedStyle(column)
        const inset=['borderLeftWidth','borderRightWidth','paddingLeft','paddingRight'].reduce((sum,key)=>sum+(parseFloat(columnStyle[key])||0),0)
        const width=(collapsed?(desktop?0:56):parseFloat(root.style.width)||root.offsetWidth)+inset
        const bounds=column.getBoundingClientRect(),settled=record.collapsed===collapsed&&!record.moving
        const left=(settled?bounds.right:bounds.left+width)-frame.getBoundingClientRect().left
        set(record.rightToggle,'data-state',collapsed?'collapsed':'expanded');set(record.rightToggle,'data-motion',String(animate))
        set(record.rightToggle,'aria-label',label);set(record.rightToggle,'aria-expanded',String(!collapsed));set(record.rightToggle,'title',label)
        if(record.rightToggle.style.left!==`${left}px`)record.rightToggle.style.left=`${left}px`
        const disabled=!button||button.disabled||button.getAttribute('aria-disabled')==='true'
        if(record.rightToggle.disabled!==disabled)record.rightToggle.disabled=disabled
      }
      if(!animate){layout.release(frame);stopAnimations(record);stopContent(record)}
      if(record.collapsed!==collapsed){
        record.collapsed=collapsed;startMoving(record)
        if(animate&&!(win.performance.now()-record.clickedAt<DURATION+40))animateToggle(record,collapsed)
      }
      if(record.decorated&&root.getAttribute(MARK)!==style)record.dirty=true
      // The outgoing snapshot still needs the material and its filter definition
      // until the drawer has finished closing. Only release a settled zero-width
      // desktop root, where fixed titlebar controls must stay unfiltered.
      if(style==='milk'||(collapsed&&!record.moving&&doc.documentElement.hasAttribute('data-windows-titlebar'))){releaseGlass(record);capture(record);continue}
      if(!record.decorated){
        Object.assign(record,{decorated:true,style:root.getAttribute(MARK),motion:root.getAttribute(MOTION),columnMark:column.getAttribute(COLUMN)})
      }
      // Keep the host's width, height, margins and padding unchanged. Its fixed
      // content width is already clipped by the native grid during transitions.
      set(root,MARK,style);set(root,MOTION,String(motion));set(column,COLUMN,'')
      // The native selected row paints its own flat fill; no floating layer
      // or scroll-time selection geometry is needed.
      capture(record)
    }
    return [...records.values()].filter(record=>record.decorated).map(record=>record.root)
  }
  const onResize=()=>{for(const record of records.values()){
    layout.release(record.frame)
    set(record.frame,RESIZING,'');stopContent(record);win.clearTimeout(record.resizeTimer)
    record.resizeTimer=win.setTimeout(()=>{record.resizeTimer=0;restore(record.frame,RESIZING,record.resizingMark);record.dirty=true;schedule()},180)
  }}
  const onScroll=event=>{for(const record of records.values())if(record.root.contains(event.target)){record.dirty=true;schedule()}}
  win.addEventListener('resize',onResize);doc.addEventListener('scroll',onScroll,true)
  reduced.addEventListener('change',schedule);forced.addEventListener('change',schedule)
  return {sync,dispose(){win.removeEventListener('resize',onResize);doc.removeEventListener('scroll',onScroll,true);reduced.removeEventListener('change',schedule);forced.removeEventListener('change',schedule);for(const record of records.values())release(record);records.clear();rightMotion.dispose();layout.dispose()}}
}
