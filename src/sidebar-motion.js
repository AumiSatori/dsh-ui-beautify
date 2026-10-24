import {motion} from './motion.js'

const FRAME='data-dcb-sidebar-frame-motion',TOGGLE='data-dcb-sidebar-toggle'
const DOCK=':is([data-dockkit-host=dock],[data-dockkit-empty],[data-dockkit-divider])'
const PANEL='[data-sidebar-right-panel]:not([data-sidebar-right-panel=fullscreen])'
const BUTTON='[data-sidebar-right-expand],button:has([class$="_collapseGlyph"],[class*="_collapseGlyph "])'

// Match the left drawer's duration and curve without transforming floating
// windows, the panel root, or the fixed titlebar controls it may contain.
export const sidebarMotionCss=`
  [${FRAME}] ${PANEL} ${DOCK} { opacity:0; }
  [${FRAME}] ${PANEL}[data-sidebar-right-open] ${DOCK} { opacity:1; }
  [${FRAME}=true] ${PANEL} ${DOCK} { transition:transform ${motion.time.sidebar}ms ${motion.ease.smooth},opacity ${motion.time.sidebar}ms ${motion.ease.smooth},visibility 0s linear ${motion.time.sidebar}ms; }
  [${FRAME}=true] ${PANEL}[data-sidebar-right-open] ${DOCK} { transition:transform ${motion.time.sidebar}ms ${motion.ease.smooth},opacity ${motion.time.sidebar}ms ${motion.ease.smooth}; }
  [${FRAME}=false] ${PANEL} ${DOCK},[${FRAME}]:is([data-dragging],[data-dcb-sidebar-resizing],[data-rightbar-instant]) ${PANEL} ${DOCK} { transition:none!important; }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { [${FRAME}] ${PANEL} ${DOCK} { transition:none!important; } }
`

export function animateSidebarToggle(record,win,collapsed,side='left'){
  const button=record.button
  if(!button||typeof button.animate!=='function')return
  const icon=button.querySelector('[class$="_panelIcon"],[class*="_panelIcon "],svg')
  const scale=win.getComputedStyle(button).scale,fromIcon=icon&&win.getComputedStyle(icon).transform
  for(const animation of record.animations)animation.cancel()
  record.animations.clear()
  const options={duration:motion.time.standard,easing:motion.ease.smooth},direction=(collapsed?-1:1)*(side==='right'?-1:1)
  const nativeIcon=icon&&win.getComputedStyle(icon).transform
  const target=side==='right'?(nativeIcon==='none'?'':nativeIcon):`scaleX(${collapsed?-1:1})`
  const animations=[button.animate([{scale},{scale:'.97',offset:.2},{scale:'1'}],options)]
  if(icon)animations.push(icon.animate([{transform:fromIcon||'none',opacity:1},{transform:`translateX(${direction*2}px) ${target}`,opacity:.75,offset:.45},{transform:target||'none',opacity:1}],options))
  for(const animation of animations){record.animations.add(animation);animation.finished.then(()=>{record.animations.delete(animation);animation.cancel()},()=>record.animations.delete(animation))}
}

// The host swaps expand/collapse controls as the right panel changes state.
// Keep their events native and only attach the same restrained click response.
export function createRightSidebarMotion(doc,win){
  const records=new Map(),reduced=win.matchMedia('(prefers-reduced-motion:reduce)'),forced=win.matchMedia('(forced-colors:active)')
  const restore=(element,name,value)=>value===null?element.removeAttribute(name):element.setAttribute(name,value)
  function release(record){record.button.removeEventListener('click',record.click);for(const animation of record.animations)animation.cancel();restore(record.button,TOGGLE,record.mark);records.delete(record.button)}
  function sync(animate){
    const wanted=new Set([...doc.querySelectorAll(BUTTON)].filter(button=>!button.closest('[data-dcb-sidebar-layout-probe]')))
    for(const [button,record]of records)if(!wanted.has(button))release(record)
    for(const button of wanted){
      let record=records.get(button)
      if(!record){record={button,mark:button.getAttribute(TOGGLE),animations:new Set()};record.click=()=>{if(record.animate&&!reduced.matches&&!forced.matches)animateSidebarToggle(record,win,!button.hasAttribute('data-sidebar-right-expand'),'right')};button.addEventListener('click',record.click);records.set(button,record)}
      record.animate=animate
      if(button.getAttribute(TOGGLE)!==String(animate))button.setAttribute(TOGGLE,String(animate))
      if(!animate){for(const animation of record.animations)animation.cancel();record.animations.clear()}
    }
  }
  return{sync,dispose(){for(const record of records.values())release(record)}}
}
