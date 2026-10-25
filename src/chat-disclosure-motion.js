import {motion} from './motion.js'

const HEADER='[data-disclosure-header]',GHOST='data-dcb-detail-ghost',MARK='data-dcb-detail-motion'

// Native DisclosureRow unmounts its body on close. A bounded, inert copy of
// just that body bridges the exit; React retains every real node and event.
export function createChatDisclosureMotion(doc,win,initiallyEnabled=true){
  const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  const pending=new Map(),active=new Map()
  let enabled=initiallyEnabled,disposed=false,frame=0
  const bodies=root=>[...root.children].filter(child=>!child.matches(HEADER)&&!child.hasAttribute(GHOST))
  const session=seat=>seat.closest('[data-conversation-session]')?.getAttribute('data-conversation-session')||''
  const oversized=box=>box.height>win.innerHeight*1.5||box.width*box.height*(win.devicePixelRatio||1)**2>4_000_000
  const size=(node,box)=>{
    const css=win.getComputedStyle(node)
    return Math.max(0,box.height-(css.boxSizing==='border-box'?0:['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce((sum,key)=>sum+(parseFloat(css[key])||0),0)))
  }
  function stop(record){
    if(active.get(record.root)!==record)return
    active.delete(record.root);record.resize?.disconnect()
    for(const effect of record.effects)effect.cancel()
    record.ghost?.remove()
    for(const [name,value,priority] of record.styles)value?record.seat.style.setProperty(name,value,priority):record.seat.style.removeProperty(name)
    if(record.styleMark===null&&!record.seat.style.length)record.seat.removeAttribute('style')
    record.mark===null?record.seat.removeAttribute(MARK):record.seat.setAttribute(MARK,record.mark)
  }
  function clear(){
    for(const record of [...active.values()])stop(record)
    pending.clear();if(frame)win.cancelAnimationFrame(frame);frame=0
  }
  function snapshot(nodes,seatBox){
    const result=[];let count=0,characters=0
    for(const node of nodes){
      const walker=doc.createTreeWalker(node,win.NodeFilter.SHOW_ELEMENT|win.NodeFilter.SHOW_TEXT)
      do{
        const item=walker.currentNode
        if(++count>300||item.nodeType===1&&item.matches('iframe,video,audio,canvas,script'))return null
        if(item.nodeType===3&&(characters+=item.length)>80_000)return null
      }while(walker.nextNode())
      const box=node.getBoundingClientRect(),copy=node.cloneNode(true),shift=win.getComputedStyle(node).translate.split(' ').map(value=>parseFloat(value)||0)
      for(const element of [copy,...copy.querySelectorAll('*')]){
        element.removeAttribute('id');element.removeAttribute('name');element.removeAttribute('autofocus')
        for(const attr of [...element.attributes])if(attr.name.startsWith('data-chat-')||attr.name==='data-slot')element.removeAttribute(attr.name)
      }
      copy.style.cssText+=`;position:absolute!important;box-sizing:border-box!important;margin:0!important;left:${box.left-seatBox.left-shift[0]}px!important;top:${box.top-seatBox.top-(shift[1]||0)}px!important;width:${box.width}px!important;height:${box.height}px!important;`
      // Preserve an interrupted entry's current opacity/translation on reversal.
      copy.style.removeProperty('opacity');copy.style.removeProperty('translate')
      result.push(copy)
    }
    return result
  }
  function capture(event){
    if(disposed||!enabled||quiet.matches||doc.hidden||event.defaultPrevented)return
    if(event.type==='keydown'&&(event.repeat||event.isComposing||!['Enter',' '].includes(event.key)))return
    const target=event.target?.closest?.('[data-disclosure-row],button[aria-expanded]')
    const header=target?.closest(HEADER),root=header?.parentElement
    if(!root||!header.closest('[data-chat-flow]')||target.getAttribute('aria-expanded')===null||target.matches(':disabled,[aria-disabled="true"]'))return
    // Only the header's own native control, never a link in the expanded body.
    if(target.closest(HEADER)!==header)return
    const seat=root.closest('[data-variant="think"]')||root,box=seat.getBoundingClientRect()
    if(!box.width||!box.height||oversized(box)||seat.closest('[hidden],[inert]'))return
    const old=active.get(root),source=old?.ghost||bodies(root)[0]
    const css=source?win.getComputedStyle(source):null,open=root.hasAttribute('data-open')
    const copies=open?snapshot(bodies(root),box):null
    if(open&&!copies)return
    pending.set(root,{root,seat,open,height:box.height,session:session(seat),copies,
      opacity:css?.opacity??'1',translate:css?.translate??'none'})
    if(!frame)frame=win.requestAnimationFrame(flush)
  }
  function flush(){
    frame=0
    for(const before of pending.values()){
      const {root,seat}=before,open=root.hasAttribute('data-open')
      if(!root.isConnected||before.open===open||session(seat)!==before.session)continue
      const previous=active.get(root);if(previous)stop(previous)
      const box=seat.getBoundingClientRect(),nodes=bodies(root)
      if(oversized(box)||typeof seat.animate!=='function')continue
      if(open&&!nodes.length)continue
      while(active.size>=4)stop(active.values().next().value)
      const record={...before,open,effects:[],styleMark:seat.getAttribute('style'),styles:['overflow','position','contain'].map(name=>[name,seat.style.getPropertyValue(name),seat.style.getPropertyPriority(name)]),mark:seat.getAttribute(MARK)}
      active.set(root,record)
      seat.setAttribute(MARK,open?'opening':'closing')
      seat.style.setProperty('overflow','clip','important');seat.style.setProperty('contain','none','important')
      if(win.getComputedStyle(seat).position==='static')seat.style.setProperty('position','relative','important')
      const options={duration:motion.time.scene,easing:motion.ease.smooth,fill:'both'}
      const height=seat.animate([{height:`${size(seat,{height:before.height})}px`},{height:`${size(seat,box)}px`}],{...options,id:'dcb-detail-height'})
      record.effects.push(height)
      if(!open&&before.copies?.length){
        const ghost=doc.createElement('div');ghost.setAttribute(GHOST,'');ghost.setAttribute('aria-hidden','true');ghost.inert=true
        ghost.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:clip;'
        ghost.append(...before.copies);seat.append(ghost);record.ghost=ghost
      }
      const targets=open?nodes:record.ghost?[record.ghost]:[]
      for(const node of targets)record.effects.push(node.animate([
        {opacity:previous?before.opacity:open?0:1,translate:previous?before.translate:open?'0 -8px':'none'},
        {opacity:open?1:0,translate:open?'none':'0 -6px'},
      ],{...options,id:'dcb-detail-content'}))
      if(open&&typeof win.ResizeObserver==='function'){
        const sizes=new Map(nodes.map(node=>[node,[node.offsetWidth,node.offsetHeight]]))
        record.resize=new win.ResizeObserver(entries=>{
          if(entries.some(({target})=>sizes.get(target)?.some((value,i)=>Math.abs(value-(i?target.offsetHeight:target.offsetWidth))>1)))stop(record)
        })
        for(const node of nodes)record.resize.observe(node)
      }
      height.finished.then(()=>stop(record),()=>stop(record))
    }
    pending.clear()
  }
  // Observe only state/removal changes while an interaction is in flight.
  // Streamed text and initially loaded history never start an effect.
  const observer=new win.MutationObserver(()=>{
    if(!active.size)return
    for(const record of [...active.values()])if(!record.root.isConnected||record.session!==session(record.seat))stop(record)
  })
  observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-conversation-session']})
  const quietChanged=()=>{if(quiet.matches||doc.hidden)clear()}
  doc.addEventListener('click',capture,true);doc.addEventListener('keydown',capture,true)
  doc.addEventListener('visibilitychange',quietChanged);quiet.addEventListener('change',quietChanged)
  return{
    setEnabled(value){enabled=!!value;if(!enabled)clear()},
    dispose(){disposed=true;clear();observer.disconnect();doc.removeEventListener('click',capture,true);doc.removeEventListener('keydown',capture,true);doc.removeEventListener('visibilitychange',quietChanged);quiet.removeEventListener('change',quietChanged)},
  }
}
