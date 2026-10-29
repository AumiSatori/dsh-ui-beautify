import {motion} from './motion.js'
import {sidebarMotionCss} from './sidebar-motion.js'

const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`
const FRAME='data-dcb-sidebar-overlay',PART='data-dcb-sidebar-overlay-part'
const WIDTH='--dcb-overlay-left-width',RAIL='--dcb-overlay-rail',TOP='--dcb-overlay-top',BOTTOM='--dcb-overlay-bottom'

export const sidebarOverlayCss=`
  ${sidebarMotionCss}
  body [${FRAME}]:not([data-dcb-focus-frame=on]) { grid-template-columns:var(${RAIL},0px) minmax(0px,1fr) 0px!important; column-gap:0!important; transition:none!important; }
  [${FRAME}] > [${PART}=center] { grid-area:1/2; min-width:0; isolation:isolate; }
  [${FRAME}] > [${PART}=left] { position:absolute!important; top:var(${TOP},0px); bottom:var(${BOTTOM},0px); left:0; width:var(${WIDTH},280px); min-width:0; z-index:16; overflow:clip; box-shadow:6px 0 18px #0000000d; transition:none; }
  [${FRAME}][data-dcb-sidebar-frame-motion=true]:not([data-dragging],[data-dcb-sidebar-resizing],[data-rightbar-instant],[data-rightbar-fullscreen]) > [${PART}=left] { transition:width ${motion.time.sidebar}ms ${motion.ease.smooth}; }
  [${FRAME}][data-sidebar-collapsed=true] > [${PART}=left] { box-shadow:none; }
  [${FRAME}] > [${PART}=right] { grid-area:1/3; width:0; min-width:0; z-index:16; overflow:visible; }
  [${FRAME}] > [data-side] { z-index:18; }
  [${FRAME}] > [data-shell-leading] { z-index:19; }
  @media(forced-colors:active) { [${FRAME}] > [${PART}=left] { box-shadow:none; } }
  @media(prefers-reduced-motion:reduce), (forced-colors:active) { [${FRAME}] > [${PART}=left][${PART}=left] { transition:none; } }
`

// Keep native state, controls and occupants. Only remove their grid tracks;
// neither the transcript nor its input/canvas is moved, cloned or remounted.
export function createSidebarOverlay(doc,win,schedule=()=>{}){
  const records=new Map()
  const restore=(el,name,value)=>value===null?el.removeAttribute(name):el.setAttribute(name,value)
  const set=(el,key,value)=>{if(el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value)}
  function updateWidth(frame,root){
    const desktop=doc.documentElement.hasAttribute('data-windows-titlebar')||doc.documentElement.dataset.platform==='darwin',rail=desktop?0:56
    const collapsed=frame.getAttribute('data-sidebar-collapsed')==='true'
    const width=collapsed?rail:parseFloat(root?.style.width)||root?.getBoundingClientRect().width||280
    set(frame,RAIL,rail+'px');set(frame,WIDTH,Math.max(0,width)+'px')
  }
  function release(frame,record){
    record.observer.disconnect();record.resize.disconnect()
    restore(frame,FRAME,record.mark)
    for(const [node,previous]of record.parts)restore(node,PART,previous)
    for(const [key,value,priority]of record.variables){if(value)frame.style.setProperty(key,value,priority);else frame.style.removeProperty(key)}
    records.delete(frame)
  }
  function sync(enabled){
    const frames=enabled?[...doc.querySelectorAll(names('frame'))].filter(frame=>!frame.closest('[data-dcb-sidebar-layout-probe]')&&[...frame.children].some(child=>child.matches(names('centerCol')))):[]
    for(const [frame,record]of records)if(!frames.includes(frame))release(frame,record)
    for(const frame of frames){
      const children=[...frame.children],left=children.find(child=>child.matches(names('sidebarCol'))),center=children.find(child=>child.matches(names('centerCol'))),right=children.find(child=>child.matches('[data-rightbar-col],'+names('rightbarCol')))
      if(!left||!center){const previous=records.get(frame);if(previous)release(frame,previous);continue}
      let record=records.get(frame)
      if(record&&(record.left!==left||record.center!==center||record.right!==right||record.root!==left.firstElementChild)){release(frame,record);record=null}
      if(!record){
        record={left,center,right,root:left.firstElementChild,mark:frame.getAttribute(FRAME),parts:[],variables:[WIDTH,RAIL,TOP,BOTTOM].map(key=>[key,frame.style.getPropertyValue(key),frame.style.getPropertyPriority(key)])}
        record.observer=new win.MutationObserver(entries=>{
          // Retarget the running width transition as soon as the host flips
          // state. Deferring this to the next scan lets the drawer travel in
          // the old direction for another rendered frame on rapid reversal.
          if(entries.some(entry=>entry.type==='attributes'&&((entry.target===frame&&entry.attributeName==='data-sidebar-collapsed')||(entry.target===record.root&&entry.attributeName==='style'))))updateWidth(frame,record.root)
          schedule()
        })
        record.observer.observe(frame,{attributes:true,attributeFilter:['style','class','data-sidebar-collapsed','data-rightbar-collapsed','data-dcb-focus-frame'],childList:true})
        record.resize=new win.ResizeObserver(schedule);record.resize.observe(frame)
        // Native expanded width is published inline. Watching the collapsed
        // auto-width root would rescan the whole UI on every drawer frame.
        const root=left.firstElementChild;if(root)record.observer.observe(root,{attributes:true,attributeFilter:['style','class']})
        const bottom=children.find(child=>child.hasAttribute('data-shell-bottom'));if(bottom)record.resize.observe(bottom)
        for(const [node,kind]of [[left,'left'],[center,'center'],[right,'right']])if(node){record.parts.push([node,node.getAttribute(PART)]);node.setAttribute(PART,kind)}
        records.set(frame,record);frame.setAttribute(FRAME,'')
      }
      const root=left.firstElementChild
      const style=win.getComputedStyle(frame),bottom=children.find(child=>child.hasAttribute('data-shell-bottom'))
      updateWidth(frame,root);set(frame,TOP,style.paddingTop);set(frame,BOTTOM,(bottom?.getBoundingClientRect().height||0)+'px')
    }
  }
  return{sync,dispose(){for(const [frame,record]of records)release(frame,record)}}
}
