import {motion} from './motion.js'

const HEADER='[data-disclosure-header]',GHOST='data-dcb-detail-ghost',MARK='data-dcb-detail-motion'
// Code the host has mounted but not yet swapped for its highlighted copy.
const PLAIN='[data-code-block-content] > pre:not(.shiki)',HOLD_MS=150

// Native DisclosureRow unmounts its body on close. A bounded, inert copy of
// just that body bridges the exit; React retains every real node and event.
// Layout jumps to its final size at once; the reveal is a clip-path inset and
// everything below rides on an additive translate, so a slow main-thread frame
// (the host swaps plain code for its Shiki copy right after mounting) never
// stalls the motion, and nothing re-lays out the transcript on every frame.
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
  // The bottom inset of an element's current clip-path (computed shorthand).
  function clipBottom(element){
    const values=/inset\(([^)]*)\)/.exec(win.getComputedStyle(element).clipPath)?.[1].split(/\s+/).map(value=>parseFloat(value)||0)
    return values?values[values.length>2?2:0]:0
  }
  // What the reader currently sees of the seat, including a closing ghost that
  // still hangs below it; a reversal continues from exactly there.
  function visible(seat,box,old){
    let height=box.height-clipBottom(seat)
    if(old?.ghost){const ghost=old.ghost.getBoundingClientRect();height=Math.max(height,ghost.bottom-clipBottom(old.ghost)-box.top)}
    return height
  }
  // Boxes laid out after the seat, up to the transcript flow, that are on or
  // near the screen; display:contents wrappers contribute their children.
  function followers(seat,reach){
    const flow=seat.closest('[data-chat-flow]:not([data-step-process-content])'),list=[],limit=win.innerHeight+Math.abs(reach)
    const add=element=>{
      if(list.length>=60||element.hasAttribute(GHOST))return true
      if(win.getComputedStyle(element).display==='contents'){for(const child of element.children)if(add(child))return true;return false}
      const box=element.getBoundingClientRect()
      if(box.top>limit)return true
      if(box.width||box.height)list.push(element)
      return false
    }
    for(let element=seat;element&&element!==flow;element=element.parentElement)
      for(let next=element.nextElementSibling;next;next=next.nextElementSibling)if(add(next))return list
    return list
  }
  function stop(record){
    if(active.get(record.root)!==record)return
    active.delete(record.root);record.resize?.disconnect();record.hold?.disconnect();win.clearTimeout(record.holdTimer)
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
    const old=active.get(root),source=old?.ghost||bodies(root)[0],shown=visible(seat,box,old)
    // A closing ghost fades on its outer layer and lifts on its inner one.
    const css=source?win.getComputedStyle(source):null,lift=old?.ghost?win.getComputedStyle(old.ghost.firstElementChild).translate:css?.translate,open=root.hasAttribute('data-open')
    const copies=open?snapshot(bodies(root),box):null
    if(open&&!copies)return
    pending.set(root,{root,seat,open,height:shown,session:session(seat),copies,
      opacity:css?.opacity??'1',translate:lift??'none'})
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
      const from=before.height,to=box.height,shift=from-to
      if(Math.abs(shift)<1&&!previous)continue
      const record={...before,open,effects:[],styleMark:seat.getAttribute('style'),styles:['overflow','position'].map(name=>[name,seat.style.getPropertyValue(name),seat.style.getPropertyPriority(name)]),mark:seat.getAttribute(MARK)}
      active.set(root,record)
      seat.setAttribute(MARK,open?'opening':'closing')
      const options={duration:motion.time.scene,easing:motion.ease.smooth,fill:'both'}
      let main
      if(open){
        // Reveal the grown seat from its previously visible edge downwards.
        main=seat.animate([{clipPath:`inset(0px 0px ${Math.max(0,to-from)}px 0px)`},{clipPath:'inset(0px 0px 0px 0px)'}],{...options,id:'dcb-detail-clip'})
      }else{
        if(win.getComputedStyle(seat).position==='static')seat.style.setProperty('position','relative','important')
        seat.style.setProperty('overflow','visible','important')
        if(before.copies?.length){
          // The copy keeps the old height and hangs below the shrunken seat;
          // its clip closes upwards to the seat's new edge.
          const ghost=doc.createElement('div');ghost.setAttribute(GHOST,'');ghost.setAttribute('aria-hidden','true');ghost.inert=true
          ghost.style.cssText=`position:absolute;left:0;right:0;top:0;height:${Math.max(from,to)}px;pointer-events:none;overflow:clip;`
          const lifted=doc.createElement('div');lifted.style.cssText='position:absolute;inset:0;'
          lifted.append(...before.copies);ghost.append(lifted);seat.append(ghost);record.ghost=ghost
          main=ghost.animate([{clipPath:'inset(0px 0px 0px 0px)'},{clipPath:`inset(0px 0px ${Math.max(0,from-to)}px 0px)`}],{...options,id:'dcb-detail-clip'})
        }
      }
      if(main)record.effects.push(main)
      // Content below keeps its painted place, then eases into its new layout.
      if(Math.abs(shift)>=1)for(const node of followers(seat,shift))
        record.effects.push(node.animate([{translate:`0px ${shift}px`},{translate:'0px 0px'}],{...options,composite:'add',id:'dcb-detail-follow'}))
      const fade=[{opacity:previous?before.opacity:open?0:1},{opacity:open?1:0}]
      const rise=[{translate:previous?before.translate:open?'0 -8px':'none'},{translate:open?'none':'0 -6px'}]
      if(open)for(const node of nodes)record.effects.push(node.animate(fade.map((frame,i)=>({...frame,...rise[i]})),{...options,id:'dcb-detail-content'}))
      else if(record.ghost){
        record.effects.push(record.ghost.animate(fade,{...options,id:'dcb-detail-content'}))
        record.effects.push(record.ghost.firstElementChild.animate(rise,{...options,id:'dcb-detail-lift'}))
      }
      if(!record.effects.length){stop(record);continue}
      if(open&&typeof win.ResizeObserver==='function'){
        const sizes=new Map(nodes.map(node=>[node,[node.offsetWidth,node.offsetHeight]]))
        record.resize=new win.ResizeObserver(entries=>{
          if(entries.some(({target})=>sizes.get(target)?.some((value,i)=>Math.abs(value-(i?target.offsetHeight:target.offsetWidth))>1)))stop(record)
        })
        for(const node of nodes)record.resize.observe(node)
      }
      // The host highlights visible code a few frames after mounting it and
      // replaces the whole block in one heavy frame. Hold the first frame until
      // that lands (bounded), so the slide itself never carries it.
      if(open){
        const waiting=()=>nodes.some(node=>[...node.querySelectorAll(PLAIN)].some(pre=>{const box=pre.getBoundingClientRect();return box.bottom>0&&box.top<win.innerHeight}))
        if(waiting()){
          for(const effect of record.effects)effect.pause()
          const go=()=>{
            if(active.get(root)!==record||!record.hold)return
            record.hold.disconnect();record.hold=null;win.clearTimeout(record.holdTimer)
            win.requestAnimationFrame(()=>{if(active.get(root)===record)for(const effect of record.effects)effect.play()})
          }
          record.hold=new win.MutationObserver(()=>{if(!waiting())go()})
          for(const node of nodes)record.hold.observe(node,{subtree:true,childList:true})
          record.holdTimer=win.setTimeout(go,HOLD_MS)
        }
      }
      record.effects[0].finished.then(()=>stop(record),()=>stop(record))
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
