import {motion} from './motion.js'

const MARK='data-dcb-stat-popover',MOVING='data-dcb-stat-moving',GHOST='data-dcb-stat-ghost'
const stats='[data-session-stats-details],[data-session-stats-usage]'
export const statPopoverCss=`
  [${MARK}],[${GHOST}] { transform-origin:50% 100%; }
  [${MOVING}] { will-change:opacity,transform,filter; }
  [${GHOST}] { pointer-events:none!important; user-select:none; }
`

// These native portals are direct body children. Watch that boundary only;
// streaming paragraphs and scroll events never trigger a page-wide scan.
export function createStatPopoverMotion(doc,win,{enabled=true}={}){
  const records=new Map(),ghosts=new Map(),quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let disposed=false,active=enabled
  const allowed=()=>!disposed&&active&&!doc.hidden&&!quiet.matches
  const panelClass=tag=>doc.querySelector(`style[data-plugin-css="${tag}"]`)?.textContent.match(/\.([\w-]+_panel)\s*\{/)?.[1]
  function kind(node){
    if(node.nodeType!==1||node.hasAttribute(GHOST)||node.getAttribute('role')!=='dialog')return null
    if(node.querySelector('[data-session-stats-details]'))return 'performance'
    if(node.querySelector('[data-session-stats-usage]'))return 'usage'
    const contextClass=panelClass('@deepseek-ai/dsh-client-ui-conversation/ContextMeter.module.css')
    return contextClass&&node.classList.contains(contextClass)?'context':null
  }
  const visual=node=>{const s=win.getComputedStyle(node);return{opacity:s.opacity,transform:s.transform,filter:s.filter}}
  const rest={opacity:1,transform:'none',filter:'blur(0px)'}
  const folded={opacity:0,transform:'translateY(8px)',filter:'blur(1px)'}
  function endGhost(record){
    if(ghosts.get(record.kind)===record)ghosts.delete(record.kind)
    record.animation?.cancel();record.node.remove()
  }
  function cancelEntry(record){record.animation?.cancel();record.animation=null;record.node.removeAttribute(MOVING)}
  function enter(record){
    const node=record.node
    if(!node.isConnected||win.getComputedStyle(node).visibility==='hidden')return
    // Native placement is measured before any transform. Keep its fixed seat,
    // including after viewport clamping, separate from the animated rectangle.
    record.box={left:parseFloat(node.style.left),top:parseFloat(node.style.top),width:node.offsetWidth,height:node.offsetHeight}
    if(record.placed)return
    record.placed=true
    if(!allowed()||typeof node.animate!=='function')return
    const previous=ghosts.get(record.kind),from=previous?visual(previous.node):folded
    if(previous)endGhost(previous)
    node.setAttribute(MOVING,'')
    try{
      const animation=node.animate([from,rest],{duration:motion.time.standard,easing:motion.ease.smooth,fill:'both'})
      animation.id='dcb-stat-popover-enter';record.animation=animation
      animation.finished.then(()=>{if(record.animation===animation){record.snapshot=null;cancelEntry(record)}},()=>{})
    }catch{cancelEntry(record)}
  }
  function attach(node,animate=true){
    if(records.has(node))return
    const type=kind(node);if(!type)return
    const record={node,kind:type,placed:!animate,animation:null,box:null,snapshot:null}
    records.set(node,record);node.setAttribute(MARK,type)
    record.observer=new win.MutationObserver(()=>enter(record));record.observer.observe(node,{attributes:true,attributeFilter:['style']})
    enter(record)
  }
  function remove(record){
    records.delete(record.node);record.observer.disconnect()
    const from=record.snapshot||rest,box=record.box,wasVisible=record.placed&&box?.width&&Number.isFinite(box.left)&&Number.isFinite(box.top)
    // Native React unmounts immediately. A bounded, inert visual copy lets the
    // small read-only table leave without delaying native focus or dismissal.
    let ghost=null
    if(allowed()&&wasVisible&&record.node.querySelectorAll('*').length<=120)ghost=record.node.cloneNode(true)
    cancelEntry(record);record.node.removeAttribute(MARK)
    const previous=ghosts.get(record.kind);if(previous)endGhost(previous)
    if(!ghost)return
    ghost.removeAttribute('role');ghost.removeAttribute('aria-label');ghost.removeAttribute('id');ghost.removeAttribute(MOVING);ghost.removeAttribute(MARK)
    ghost.setAttribute('aria-hidden','true');ghost.setAttribute('inert','');ghost.setAttribute(GHOST,record.kind)
    for(const el of ghost.querySelectorAll('[id],'+stats)){el.removeAttribute('id');el.removeAttribute('data-session-stats-details');el.removeAttribute('data-session-stats-usage')}
    Object.assign(ghost.style,{position:'fixed',left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px',minWidth:'0',maxWidth:'none',margin:'0',visibility:'visible',...from})
    doc.body.append(ghost)
    const exiting={node:ghost,kind:record.kind,animation:null};ghosts.set(record.kind,exiting)
    try{
      exiting.animation=ghost.animate([from,folded],{duration:motion.time.quick,easing:motion.ease.exit,fill:'both'})
      exiting.animation.id='dcb-stat-popover-exit';exiting.animation.finished.then(()=>endGhost(exiting),()=>{})
    }catch{endGhost(exiting)}
  }
  // Read current animation values at dismissal input, before React removes the
  // portal. This also makes an opening->closing reversal continuous.
  function capture(event){
    if(event.type==='keydown'&&event.key!=='Escape')return
    for(const record of records.values())if(record.node.isConnected&&record.placed)record.snapshot=visual(record.node)
  }
  const observer=new win.MutationObserver(changes=>{
    for(const change of changes)for(const node of change.removedNodes){const record=records.get(node);if(record&&!node.isConnected)remove(record)}
    for(const change of changes)for(const node of change.addedNodes)if(node.isConnected)attach(node)
  })
  function settle(){
    for(const record of records.values()){cancelEntry(record);record.snapshot=null}
    for(const record of [...ghosts.values()])endGhost(record)
  }
  const accessibility=()=>{if(!allowed())settle()}
  for(const node of doc.body.children)attach(node,false)
  observer.observe(doc.body,{childList:true})
  for(const type of ['pointerdown','click','keydown'])doc.addEventListener(type,capture,true)
  quiet.addEventListener('change',accessibility);doc.addEventListener('visibilitychange',accessibility)
  return{
    sync(value){active=value===true;if(!active)settle()},
    dispose(){disposed=true;observer.disconnect();settle();for(const record of records.values()){record.observer.disconnect();record.node.removeAttribute(MARK)}records.clear();for(const type of ['pointerdown','click','keydown'])doc.removeEventListener(type,capture,true);quiet.removeEventListener('change',accessibility);doc.removeEventListener('visibilitychange',accessibility)},
  }
}
