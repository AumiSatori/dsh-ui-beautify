import {motion} from './motion.js'
import {createSidebarLayout} from './sidebar-layout.js'
const MARK='data-dcb-sidebar-style',COLUMN='data-dcb-sidebar-column',MOTION='data-dcb-sidebar-motion'
const TOGGLE='data-dcb-sidebar-toggle',STATE='data-dcb-sidebar-toggle-state',MOVING='data-dcb-sidebar-moving'
const FRAME='data-dcb-sidebar-frame-motion',RESIZING='data-dcb-sidebar-resizing',DURATION=motion.time.sidebar
const suffix=(el,name)=>[...el.classList].some(value=>value.endsWith('_'+name))
const visible=el=>el.isConnected&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'
export function createSidebarGlass(doc,win,schedule){
  const records=new Map()
  const layout=createSidebarLayout(doc,win)
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
    for(const el of clone.querySelectorAll('[class$="_toggle"], [class*="_toggle "], [class$="_topStrip"], [class*="_topStrip "], input, textarea, [contenteditable]'))el.remove()
    clone.setAttribute('data-dcb-sidebar-ghost','');clone.setAttribute('aria-hidden','true');clone.inert=true;clone.removeAttribute(MOVING)
    const styles={position:'absolute',left:`${bounds.left-origin.left}px`,top:`${bounds.top-origin.top}px`,width:`${bounds.width}px`,height:`${bounds.height}px`,margin:'0',padding:win.getComputedStyle(root).padding,'border-radius':win.getComputedStyle(root).borderRadius,'pointer-events':'none','z-index':'2'}
    for(const [key,value] of Object.entries(styles))clone.style.setProperty(key,value,'important')
    record.snapshot={clone,scroll}
  }
  function animateContent(record){
    const current=record.ghost||record.enterSeats?.find(el=>suffix(el,'regionArea'))||record.enterSeats?.[0]
    const sampled=current&&win.getComputedStyle(current),from=sampled?{opacity:sampled.opacity,transform:sampled.transform,filter:sampled.filter}:null
    stopContent(record)
    const options={duration:DURATION,easing:motion.ease.smooth},track=(animation,done)=>{
      record.contentAnimations.add(animation)
      animation.finished.then(()=>{record.contentAnimations.delete(animation);done?.();animation.cancel()},()=>record.contentAnimations.delete(animation))
    }
    if(record.collapsed){
      const snapshot=record.snapshot
      if(!snapshot)return
      record.ghost=snapshot.clone;record.column.append(record.ghost)
      for(const [el,top,left] of snapshot.scroll){el.scrollTop=top;el.scrollLeft=left}
      const ghost=record.ghost
      track(ghost.animate([from||{opacity:1,transform:'none',filter:'blur(0px)'},{opacity:0,transform:'translateX(-12px)',filter:'blur(2px)'}],{...options,fill:'forwards'}),()=>{ghost.remove();if(record.ghost===ghost)record.ghost=null})
    }else{
      // Never transform the root or logo row: the Windows titlebar toggle is
      // fixed inside them. Animate only their content seats.
      const seats=[...record.root.children].flatMap(el=>suffix(el,'logoRow')?[...el.children].filter(child=>suffix(child,'brand')):suffix(el,'newSession')||suffix(el,'panelList')||suffix(el,'regionArea')||suffix(el,'footArea')?[el]:[])
      record.enterSeats=seats
      for(const [index,seat] of seats.entries()){
        const delay=from?0:Math.min(index*motion.stagger,96)
        track(seat.animate([from||{opacity:0,transform:'translateX(-12px)',filter:'blur(2px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{...options,duration:DURATION-delay,delay,fill:'backwards'}))
      }
    }
  }
  function releaseGlass(record){
    if(!record.decorated)return
    record.indicator.remove();record.indicator=null;record.decorated=false;record.placed=false
    restore(record.root,MARK,record.style);restore(record.root,MOTION,record.motion);restore(record.column,COLUMN,record.columnMark)
  }
  function release(record){
    layout.release(record.frame)
    releaseGlass(record);stopAnimations(record);stopContent(record);record.resize.disconnect();record.observer.disconnect()
    win.clearTimeout(record.settleTimer)
    win.clearTimeout(record.resizeTimer);restore(record.frame,FRAME,record.frameMark);restore(record.frame,RESIZING,record.resizingMark)
    restore(record.root,MOVING,record.movingMark)
    releaseButton(record)
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
  function animateToggle(record,collapsed){
    const button=record.button
    if(!button||typeof button.animate!=='function')return
    const icon=button.querySelector('[class$="_panelIcon"], [class*="_panelIcon "], svg')
    const running=record.animations.size>0
    const scale=running?win.getComputedStyle(button).scale:'.94'
    const fromIcon=icon&&running?win.getComputedStyle(icon).transform:null
    stopAnimations(record)
    const options={duration:motion.time.standard,easing:motion.ease.snappy}
    const animations=[button.animate([{scale},{scale:'1'}],options)]
    if(icon)animations.push(icon.animate([{transform:fromIcon||`translateX(${collapsed?-6:6}px) scaleX(${collapsed?-1:1}) scale(.94)`,opacity:.65},{transform:`scaleX(${collapsed?-1:1})`,opacity:1}],options))
    for(const animation of animations){record.animations.add(animation);animation.finished.then(()=>{record.animations.delete(animation);animation.cancel()},()=>record.animations.delete(animation))}
  }
  function startMoving(record){
    win.clearTimeout(record.settleTimer)
    const revision=record.settleRevision=(record.settleRevision||0)+1
    if(record.animate)layout.hold(record.frame)
    else layout.release(record.frame)
    // Wait for the native grid track before initializing the refraction map.
    // Keep a bounded timer so interrupted transitions and hidden windows settle.
    const style=win.getComputedStyle(record.frame),times=value=>value.split(',').map(s=>parseFloat(s)*(s.trim().endsWith('ms')?1:1000)||0)
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
      const tracks=record.frame.getAnimations().filter(animation=>animation.transitionProperty==='grid-template-columns'&&['pending','running'].includes(animation.playState))
      if(tracks.length)Promise.allSettled(tracks.map(animation=>animation.finished)).then(settle)
      else settle()
    },Math.min(1000,duration+40))
  }
  function sync(style,motion){
    const incoming=roots(),wanted=new Set(incoming.map(item=>item.root)),animate=motion&&!reduced.matches&&!forced.matches
    for(const [root,record] of records)if(!wanted.has(root)){release(record);records.delete(root)}
    for(const {root,column} of incoming){
      const frame=column.parentElement,collapsed=frame.getAttribute('data-sidebar-collapsed')==='true'||suffix(root,'collapsed')
      let record=records.get(root)
      if(record&&(record.column!==column||record.frame!==frame)){release(record);records.delete(root);record=null}
      if(!record){
        record={root,column,frame,collapsed,inlineWidth:root.style.width,animations:new Set(),contentAnimations:new Set(),dirty:true,moving:false,movingMark:root.getAttribute(MOVING),frameMark:frame.getAttribute(FRAME),resizingMark:frame.getAttribute(RESIZING)}
        record.resize=new win.ResizeObserver(()=>{record.dirty=true;schedule()});record.resize.observe(root)
        record.observer=new win.MutationObserver(entries=>{
          if(frame.matches('[data-dragging], [data-rightbar-instant], [data-rightbar-fullscreen]'))layout.release(frame)
          else if(record.animate&&entries.some(entry=>entry.target===frame&&entry.attributeName==='data-sidebar-collapsed'))layout.hold(frame)
          const content=entries.some(entry=>entry.target!==frame&&entry.target!==root&&!record.indicator?.contains(entry.target)&&!record.ripple?.contains(entry.target))
          if(content)record.dirty=true
          if(content||entries.some(entry=>entry.target===frame)||record.inlineWidth!==root.style.width){record.inlineWidth=root.style.width;schedule()}
        })
        record.observer.observe(frame,{attributes:true,attributeFilter:['data-sidebar-collapsed','data-dragging','data-rightbar-instant','data-rightbar-fullscreen','style']})
        record.observer.observe(root,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['style','class','aria-selected','aria-current']})
        records.set(root,record)
      }
      set(frame,FRAME,String(animate))
      const button=root.querySelector('[class$="_toggle"], [class*="_toggle "]')
      if(button!==record.button){
        stopAnimations(record)
        releaseButton(record)
        record.button=button;record.buttonMark=button?.getAttribute(TOGGLE)??null;record.buttonState=button?.getAttribute(STATE)??null
        if(button){
          record.click=()=>{
            if(!record.animate||reduced.matches||forced.matches)return
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
      if(!animate){layout.release(frame);stopAnimations(record);stopContent(record)}
      if(record.collapsed!==collapsed){
        record.collapsed=collapsed;startMoving(record)
        if(animate&&!(win.performance.now()-record.clickedAt<DURATION+40))animateToggle(record,collapsed)
      }
      // Windows keeps fixed titlebar controls inside its zero-width column.
      // Release glass while collapsed, but retain the native toggle's motion.
      if(style==='milk'||(collapsed&&doc.documentElement.hasAttribute('data-windows-titlebar'))){releaseGlass(record);capture(record);continue}
      if(!record.decorated){
        const indicator=doc.createElement('span');indicator.className='dcb-sidebar-indicator';indicator.setAttribute('aria-hidden','true')
        Object.assign(record,{indicator,decorated:true,style:root.getAttribute(MARK),motion:root.getAttribute(MOTION),columnMark:column.getAttribute(COLUMN),placed:false})
      }
      // Keep the host's width, height, margins and padding unchanged. Its fixed
      // content width is already clipped by the native grid during transitions.
      set(root,MARK,style);set(root,MOTION,String(motion));set(column,COLUMN,'')
      if(record.indicator.parentElement!==root)root.append(record.indicator)
      if(record.moving){if(!record.indicator.hidden)record.indicator.hidden=true;continue}
      const selected=[...root.querySelectorAll('[aria-selected="true"], [aria-current="page"], [class$="_selected"], [class*="_selected "]')].find(el=>visible(el)&&(suffix(el,'sessionRow')||suffix(el,'searchResultRow')||el.getAttribute('role')==='treeitem'))
      const indicator=record.indicator
      if(!selected||!visible(root)){if(!indicator.hidden)indicator.hidden=true;capture(record);continue}
      const r=selected.getBoundingClientRect(),origin=root.getBoundingClientRect()
      let top=origin.top,bottom=origin.bottom
      for(let parent=selected.parentElement;parent&&parent!==root;parent=parent.parentElement){if(/auto|scroll|hidden|clip/.test(win.getComputedStyle(parent).overflowY)){const clip=parent.getBoundingClientRect();top=Math.max(top,clip.top);bottom=Math.min(bottom,clip.bottom)}}
      const clipped=r.top<top-.5||r.bottom>bottom+.5
      if(indicator.hidden!==clipped)indicator.hidden=clipped
      for(const [key,value] of Object.entries({width:`${r.width}px`,height:`${r.height}px`,borderRadius:win.getComputedStyle(selected).borderRadius,transform:`translate(${r.left-origin.left}px, ${r.top-origin.top}px)`}))if(indicator.style[key]!==value)indicator.style[key]=value
      if(!record.placed){record.placed=true;win.requestAnimationFrame(()=>{if(records.get(root)?.indicator===indicator)set(indicator,'data-ready','true')})}
      capture(record)
    }
    return [...records.values()].filter(record=>record.decorated&&!record.moving).map(record=>record.root)
  }
  const onResize=()=>{for(const record of records.values()){
    layout.release(record.frame)
    set(record.frame,RESIZING,'');stopContent(record);win.clearTimeout(record.resizeTimer)
    record.resizeTimer=win.setTimeout(()=>{record.resizeTimer=0;restore(record.frame,RESIZING,record.resizingMark);record.dirty=true;schedule()},180)
  }}
  const onScroll=event=>{for(const record of records.values())if(record.root.contains(event.target)){record.dirty=true;schedule()}}
  win.addEventListener('resize',onResize);doc.addEventListener('scroll',onScroll,true)
  reduced.addEventListener('change',schedule);forced.addEventListener('change',schedule)
  return {sync,dispose(){win.removeEventListener('resize',onResize);doc.removeEventListener('scroll',onScroll,true);reduced.removeEventListener('change',schedule);forced.removeEventListener('change',schedule);for(const record of records.values())release(record);records.clear();layout.dispose()}}
}
