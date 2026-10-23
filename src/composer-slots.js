import {motion} from './motion.js'
const EMPTY='data-dcb-empty-composer-slot',MOTION='data-dcb-composer-slot-motion'
const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`
const SLOTS=`[data-composer-card] ${names('trailing')} > ${names('activity')}`

export const composerSlotsCss=`
  [${EMPTY}] { display: none !important; }
  [${MOTION}] { display: flex !important; box-sizing: border-box; min-width: 0; overflow: hidden; will-change: width, margin-inline-end, opacity, filter; }
`

// Optional plugins may leave a slot outlet mounted with no rendered control.
// Hide only that empty seat, so its parent's flex gap disappears with it.
export function createComposerSlots(doc,win,schedule){
  const records=new Map(),quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  const restore=(el,name,value)=>value===null?el.removeAttribute(name):el.setAttribute(name,value)
  const mark=(el,name,on)=>{if(el.hasAttribute(name)!==on)el.toggleAttribute(name,on)}
  const bounded=el=>win.getComputedStyle(el).visibility!=='hidden'&&[...el.getClientRects()].some(r=>r.width>.5&&r.height>.5)
  function content(root){
    const walker=doc.createTreeWalker(root,win.NodeFilter.SHOW_ELEMENT|win.NodeFilter.SHOW_TEXT)
    for(let node=walker.nextNode();node;node=walker.nextNode()){
      const el=node.nodeType===3?node.parentElement:node
      if(!el||el.closest('style,script,template')||!bounded(el))continue
      if(node.nodeType===3){
        if(!node.textContent.trim())continue
        const range=doc.createRange();range.selectNodeContents(node)
        if([...range.getClientRects()].some(r=>r.width>.5&&r.height>.5))return true
      }else if(el.matches('button,input,select,textarea,a[href],svg,img,canvas,video,audio,progress,meter,[role="button"],[role="status"],[role="progressbar"],[contenteditable="true"]'))return true
      else{
        const style=win.getComputedStyle(el)
        if(style.backgroundImage!=='none'||!['transparent','rgba(0, 0, 0, 0)'].includes(style.backgroundColor))return true
        for(const pseudo of ['::before','::after'])if(!['none','normal','""'].includes(win.getComputedStyle(el,pseudo).content))return true
      }
    }
    return false
  }
  function settle(record){
    record.animation?.cancel();record.animation=null
    mark(record.root,MOTION,false);mark(record.root,EMPTY,record.empty)
    record.width=record.empty?0:record.root.getBoundingClientRect().width
  }
  function change(record,empty){
    const first=record.empty===undefined,root=record.root,wasEmpty=record.empty
    const gap=parseFloat(win.getComputedStyle(root.parentElement).columnGap)||0
    const from=record.animation?root.getBoundingClientRect().width:record.width
    const margin=record.animation?parseFloat(win.getComputedStyle(root).marginInlineEnd)||0:wasEmpty?-gap:0
    record.animation?.cancel();record.animation=null
    mark(root,MOTION,false);mark(root,EMPTY,false)
    const to=empty?0:root.getBoundingClientRect().width
    record.empty=empty
    if(first||quiet.matches||!root.animate||(!from&&!to)){settle(record);return}
    mark(root,MOTION,true)
    const animation=root.animate([
      {width:`${from}px`,marginInlineEnd:`${margin}px`,opacity:wasEmpty?0:1,filter:wasEmpty?'blur(2px)':'blur(0px)'},
      {width:`${to}px`,marginInlineEnd:`${empty?-gap:0}px`,opacity:empty?0:1,filter:empty?'blur(2px)':'blur(0px)'},
    ],{duration:motion.time.material,easing:motion.ease.smooth,fill:'both'})
    record.animation=animation
    animation.finished.then(()=>{if(record.animation===animation){settle(record);schedule()}}).catch(()=>{})
  }
  function release(record){
    record.observer.disconnect();record.resize.disconnect();record.animation?.cancel()
    restore(record.root,EMPTY,record.originalEmpty);restore(record.root,MOTION,record.originalMotion)
  }
  function sync(){
    const incoming=new Set(doc.querySelectorAll(SLOTS))
    for(const [root,record]of records)if(!incoming.has(root)){release(record);records.delete(root)}
    for(const root of incoming){
      let record=records.get(root)
      if(!record){
        record={root,width:root.getBoundingClientRect().width,dirty:true,empty:undefined,animation:null,originalEmpty:root.getAttribute(EMPTY),originalMotion:root.getAttribute(MOTION)}
        record.observer=new win.MutationObserver(()=>{record.dirty=true;schedule()})
        record.observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden']})
        for(let parent=root.parentElement;parent;parent=parent.parentElement)record.observer.observe(parent,{attributes:true,attributeFilter:['class','style','hidden']})
        record.resize=new win.ResizeObserver(()=>{if(!record.animation){record.dirty=true;schedule()}});record.resize.observe(root)
        records.set(root,record)
      }
      if(!record.dirty)continue
      record.dirty=false
      mark(root,EMPTY,false)
      const empty=!content(root)
      if(record.empty!==empty)change(record,empty)
      else if(!record.animation){mark(root,EMPTY,empty);if(!empty)record.width=root.getBoundingClientRect().width}
    }
  }
  const preference=()=>{for(const record of records.values())if(record.animation)settle(record);schedule()}
  quiet.addEventListener('change',preference)
  return {sync,dispose(){quiet.removeEventListener('change',preference);for(const record of records.values())release(record);records.clear()}}
}
