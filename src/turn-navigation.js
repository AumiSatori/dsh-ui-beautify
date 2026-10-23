import {motion,springSamples} from './motion.js'

const FOCUS='data-dcb-turn-focused',JUMP='data-dcb-turn-jump'
const CONTROLS='button,a,input,textarea,select,summary,pre,code,video,audio,iframe,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"],[role="menuitem"],[role="tab"],[role="switch"],[role="slider"],[data-step-process-header]'
const KEYS=new Set(['Escape','ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '])
const curve=springSamples()
const ease=progress=>{
  const sample=Math.min(1,Math.max(0,progress))*(curve.length-1),index=Math.floor(sample)
  return index>=curve.length-1?1:curve[index]+(curve[index+1]-curve[index])*(sample-index)
}

// One short scroll animation per user gesture. Native scroll events keep the
// host's reading position and turn navigator in charge; message nodes stay put.
export function createTurnNavigation(doc,win,{groupAt,groupById}){
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let selection=null,flight=null,frame=0,disposed=false
  const session=root=>root.closest('[data-conversation-session]')?.getAttribute('data-conversation-session')||''
  const valid=choice=>choice&&choice.root.isConnected&&session(choice.root)===choice.session?groupById(choice.root,choice.id):null
  const restoreHead=choice=>{
    if(!choice?.head)return
    choice.head.removeAttribute(FOCUS);choice.head.removeAttribute(JUMP)
  }
  function attach(choice,group){
    if(choice.head!==group.head){restoreHead(choice);choice.head=group.head}
    if(!choice.head.hasAttribute(FOCUS))choice.head.setAttribute(FOCUS,'')
    if(flight?.choice===choice&&choice.head.getAttribute(JUMP)!==flight.direction)choice.head.setAttribute(JUMP,flight.direction)
  }
  function restoreScroll(job){
    const [value,priority]=job.scrollStyle
    if(job.scroller.style.getPropertyValue('scroll-behavior')!=='auto'||job.scroller.style.getPropertyPriority('scroll-behavior')!=='important')return
    if(value)job.scroller.style.setProperty('scroll-behavior',value,priority)
    else job.scroller.style.removeProperty('scroll-behavior')
  }
  const target=(head,scroller)=>{
    const bounds=scroller.getBoundingClientRect(),row=head.getBoundingClientRect()
    return Math.max(0,Math.min(scroller.scrollHeight-scroller.clientHeight,scroller.scrollTop+row.top-bounds.top-scroller.clientTop-24))
  }
  function stop(clearFocus=true,land=false){
    win.cancelAnimationFrame(frame);frame=0
    const job=flight;flight=null
    if(job){
      const group=valid(job.choice)
      if(land&&group)job.scroller.scrollTo({top:target(group.head,job.scroller),behavior:'instant'})
      job.choice.head?.removeAttribute(JUMP);restoreScroll(job)
    }
    if(clearFocus){restoreHead(selection);selection=null}
  }
  function scrollPort(head){
    const owner=head.closest('[data-conversation-content]')
    for(let node=head.parentElement;node&&node!==owner?.parentElement;node=node.parentElement){
      if(/^(auto|scroll)$/.test(win.getComputedStyle(node).overflowY)&&node.clientHeight>0)return node
    }
    return null
  }
  function step(now){
    frame=0
    const job=flight,group=job&&valid(job.choice)
    if(!job||!group||!job.scroller.isConnected||doc.hidden){stop();return}
    attach(job.choice,group)
    job.to=target(group.head,job.scroller)
    const progress=Math.min(1,(now-job.start)/motion.time.scene)
    job.scroller.scrollTo({top:job.from+(job.to-job.from)*ease(progress),behavior:'instant'})
    if(progress===1){stop(false,true);return}
    frame=win.requestAnimationFrame(step)
  }
  function onDoubleClick(event){
    const element=event.target?.nodeType===1?event.target:event.target?.parentElement
    if(disposed||doc.hidden||event.defaultPrevented||event.button!==0||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!element||element.closest(CONTROLS))return
    const group=groupAt(element,event)
    if(!group?.head.isConnected)return
    const scroller=scrollPort(group.head)
    if(!scroller)return
    stop()
    selection={root:group.root,id:group.id,session:session(group.root),head:null}
    attach(selection,group)
    const from=scroller.scrollTop,to=target(group.head,scroller)
    if(reduced.matches){scroller.scrollTo({top:to,behavior:'instant'});return}
    flight={choice:selection,head:group.head,scroller,from,to,start:win.performance.now(),direction:to<from?'up':'down',scrollStyle:[scroller.style.getPropertyValue('scroll-behavior'),scroller.style.getPropertyPriority('scroll-behavior')]}
    scroller.style.setProperty('scroll-behavior','auto','important')
    group.head.setAttribute(JUMP,flight.direction)
    frame=win.requestAnimationFrame(step)
  }
  const onInput=event=>{
    if(!selection)return
    if(event.type==='keydown'&&!KEYS.has(event.key))return
    if(event.type!=='pointerdown'&&!selection.root.closest('[data-conversation-content]')?.contains(event.target)&&!flight?.scroller.contains(event.target))return
    stop()
  }
  const preferences=()=>{if(reduced.matches)stop(false,true)}
  const visibility=()=>{if(doc.hidden)stop()}
  const resize=()=>stop()
  doc.addEventListener('dblclick',onDoubleClick)
  for(const name of ['pointerdown','wheel','touchstart','keydown'])doc.addEventListener(name,onInput,{capture:true,passive:true})
  doc.addEventListener('visibilitychange',visibility);win.addEventListener('resize',resize);win.addEventListener('blur',resize)
  reduced.addEventListener('change',preferences)
  return {
    refresh(){
      if(!selection)return
      const group=valid(selection)
      if(!group)stop()
      else attach(selection,group)
    },
    clearRoot(root){if(selection?.root===root)stop()},
    dispose(){disposed=true;stop();doc.removeEventListener('dblclick',onDoubleClick);for(const name of ['pointerdown','wheel','touchstart','keydown'])doc.removeEventListener(name,onInput,true);doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('resize',resize);win.removeEventListener('blur',resize);reduced.removeEventListener('change',preferences)},
  }
}
