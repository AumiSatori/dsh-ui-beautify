import {motion} from './motion.js'
const FLOW='[data-chat-flow]:not([data-step-process-content])',MARK='data-dcb-send-scroll-row'
const KEYS=new Set(['PageUp','PageDown','Home','End','ArrowUp','ArrowDown','Escape'])
// Rows are only the paint carrier for a send-time offset. The cap keeps the
// per-frame work bounded; it must never decide whether the send can be
// smoothed at all, because bailing out mid-flight used to drop a half-applied
// offset and paint a hard jump (measured up to 88px on a dense transcript).
const MAX_ROWS=48,AREA_BUDGET=4_000_000,FADE_MS=160
// Smooth only the painted, visible tail after a native send/follow jump. The
// host retains the real scroll offset, events, anchors and follow controller.
export function createComposerScrollMotion(doc,win,initiallyEnabled=false){
 const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)'),jobs=new Map()
 let enabled=initiallyEnabled,disposed=false,intent=null,frame=0,expiry=0
 const now=()=>win.performance.now()
 const current=job=>{for(const row of job.effects.keys())if(row.isConnected){const v=win.getComputedStyle(row).translate.split(' ');return parseFloat(v[1])||0}return 0}
 const translated=row=>parseFloat(win.getComputedStyle(row).translate.split(' ')[1])||0
 function restore(job){
  for(const [name,value,priority] of job.styles)if(job.flow.style.getPropertyValue(name)==='clip'){value?job.flow.style.setProperty(name,value,priority):job.flow.style.removeProperty(name)}
  if(job.styleMark===null&&!job.flow.style.length)job.flow.removeAttribute('style')
 }
 // Abandoning a compensation must never remove the offset in one frame: fading
 // the remaining paint back to its layout position reads as a short settle
 // instead of the snap that made dense transcripts shake.
 function fade(job){
  let pending=0
  for(const [row,record] of job.effects){
   const value=row.isConnected?translated(row):0
   record.animation.cancel()
   if(row.isConnected&&Math.abs(value)>=.5){
    const animation=row.animate([{translate:`0px ${value}px`},{translate:'0px 0px'}],{duration:FADE_MS,easing:motion.ease.smooth,id:'dcb-send-scroll-fade'})
    animation.finished.catch(()=>{}).finally(()=>row.removeAttribute(MARK))
    pending=Math.max(pending,value)
   }else row.removeAttribute(MARK)
  }
  if(!pending){restore(job);return}
  win.setTimeout(()=>restore(job),FADE_MS+40)
 }
 function release(job,reason){
  if(jobs.get(job.flow)!==job)return
  jobs.delete(job.flow);win.clearTimeout(job.timer)
  if(reason==='done'||reason==='cancel'){
   for(const [row,record] of job.effects){record.animation.cancel();record.mark===null?row.removeAttribute(MARK):row.setAttribute(MARK,record.mark)}
   restore(job)
   return
  }
  fade(job)
 }
 function clearIntent(){intent=null;size.disconnect();win.clearTimeout(expiry)}
 function clear(){clearIntent();win.cancelAnimationFrame(frame);frame=0;for(const job of [...jobs.values()])release(job,'cancel')}
 function candidates(job,offset){
  const view=job.scroll.getBoundingClientRect(),rows=[];let area=0,visited=0
  for(let row=job.list.lastElementChild;row&&visited++<60;row=row.previousElementSibling){
   if(row.matches('[hidden],[data-turn-process-hidden="true"]'))continue
   const box=row.getBoundingClientRect()
   if(!box.height)continue
   if(box.bottom<view.top-Math.abs(offset)-24)break
   if(box.top>view.bottom+Math.abs(offset)+24)continue
   const css=win.getComputedStyle(row)
   // 我们正在动的行不算 transform 冲突，否则第二次补偿会把整屏行全部跳过
   if(!job.effects.has(row)&&(css.translate!=='none'||css.transform!=='none'))return null
   if(box.height>win.innerHeight*1.5||area>AREA_BUDGET)return null
   if(rows.length>=MAX_ROWS)break
   rows.push(row)
   area+=box.width*box.height*(win.devicePixelRatio||1)**2
  }
  return rows
 }
 function schedule(){if(!frame)frame=win.requestAnimationFrame(flush)}
 function flush(){
  frame=0;if(disposed||!enabled||quiet.matches||doc.hidden){clear();return}
  for(const job of [...jobs.values()]){
   if(!job.flow.isConnected||job.session!==(job.owner.getAttribute('data-conversation-session')||'')||job.owner.querySelector('[data-input-fold], [data-chat-motion="collapse"]')){release(job,'abandon');continue}
   const offset=current(job)+job.delta;job.delta=0
   if(Math.abs(offset)<.5){release(job,'done');continue}
   const rows=candidates(job,offset)
   if(!rows||!rows.length){release(job,'abandon');continue}
   for(const [row,record]of job.effects){record.animation.cancel();record.mark===null?row.removeAttribute(MARK):row.setAttribute(MARK,record.mark)}
   job.effects.clear();win.clearTimeout(job.timer)
   // Clip overflow at its unchanged layout box so translated rows cannot grow
   // the native scroll range. No transcript wrapper, copy or screenshot.
   job.flow.style.setProperty('overflow-x','clip');job.flow.style.setProperty('overflow-y','clip')
   for(const row of rows){row.setAttribute(MARK,'');const animation=row.animate([{translate:`0px ${offset}px`},{translate:'0px 0px'}],{duration:motion.time.standard,easing:motion.ease.smooth,id:'dcb-send-scroll'});animation.finished.catch(()=>{});job.effects.set(row,{animation,mark:null})}
   job.timer=win.setTimeout(()=>release(job,'done'),motion.time.standard+35)
  }
 }
 function begin(event){
  if(disposed||!enabled||quiet.matches||doc.hidden||event.defaultPrevented)return
  const target=event.target?.closest?.('[data-composer-seat]');if(!target)return
  if(event.type==='keydown'){
   if(event.key!=='Enter'||event.shiftKey||event.altKey||event.ctrlKey||event.metaKey||event.isComposing||event.repeat||!event.target.closest('[data-composer-input],textarea,[contenteditable="true"]'))return
  }else{const button=event.target.closest('button');if(!button||button.disabled||!(/发送|send/i.test(button.getAttribute('aria-label')||button.title||'')))return}
  const owner=target.closest('[data-conversation-content]'),scroll=owner?.querySelector('[data-conversation-scroll]'),flow=owner?.querySelector(FLOW)
  if(!scroll||!flow||scroll.scrollHeight<=scroll.clientHeight+1)return
  const viewport=scroll.getBoundingClientRect(),composerBox=target.getBoundingClientRect(),availableHeight=Math.max(0,Math.min(viewport.bottom,composerBox.top)-viewport.top)
  // A short conversation can still have a few scrollable pixels because the
  // composer seat contributes to the scrollport. If the chat flow itself ends
  // above the composer, Enter only collapses the input and must remain native;
  // compensating that layout change is the visible wobble in short chats.
  if(flow.scrollHeight<=availableHeight+1)return
  // When the transcript fits entirely above the composer there is no native
  // tail jump to smooth. Starting a paint compensation in this case makes a
  // short conversation visibly wobble when the composer collapses after Enter.
  if(Math.abs(scroll.scrollHeight-scroll.clientHeight-scroll.scrollTop)>48)return
  size.disconnect()
  const composer=target.querySelector('[data-composer-card],[data-input-scroll]')||target
  intent={owner,scroll,flow,composer,top:scroll.scrollTop,session:owner.getAttribute('data-conversation-session')||'',until:now()+1900,layoutAt:0,flowHeight:flow.getBoundingClientRect().height,seatHeight:target.getBoundingClientRect().height,composerHeight:composer.getBoundingClientRect().height}
  size.observe(flow);size.observe(target);if(composer!==target)size.observe(composer)
  win.clearTimeout(expiry);expiry=win.setTimeout(clearIntent,1900)
 }
 function sample(){
  if(!intent||now()>intent.until||quiet.matches||!enabled||doc.hidden)return
  if(!intent.owner.isConnected||intent.session!==(intent.owner.getAttribute('data-conversation-session')||'')){clear();return}
  const value=intent.scroll.scrollTop,delta=value-intent.top;intent.top=value
  if(Math.abs(delta)<.01)return
  if(Math.abs(delta)>intent.scroll.clientHeight*.75){clear();return}
  if(!intent.owner.querySelector('[data-chat-following-tail]')||intent.owner.querySelector('[data-input-fold], [data-chat-motion="collapse"]'))return
  let job=jobs.get(intent.flow)
  if(!job){const flow=intent.flow;job={...intent,list:flow.querySelector(':scope > [data-slot="conversation.chat.flow"]')||flow,delta:0,direction:0,effects:new Map(),timer:0,styleMark:flow.getAttribute('style'),styles:['overflow-x','overflow-y'].map(name=>[name,flow.style.getPropertyValue(name),flow.style.getPropertyPriority(name)])};jobs.set(flow,job)}
  // Layout-driven contraction is part of the same send. Cancelling here used
  // to drop the still-visible offset when a multiline composer shrank.
  const sign=Math.sign(delta)
  // The native follow controller can retarget when the composer collapses or
  // the tail grows. Replaying a 280ms effect in the other direction is the
  // visible shake reported in the GIF. A direction change right after a
  // measured contraction is expected and stays part of the same correction; a
  // bare native reversal hands back to the host and settles instead of
  // snapping.
  if(sign&&job.direction&&sign!==job.direction&&now()-intent.layoutAt>240&&Math.abs(delta)>8){release(job,'abandon');intent.top=value;return}
  if(sign)job.direction=sign
  job.delta+=delta
  if(frame){win.cancelAnimationFrame(frame);frame=0}
  flush()
 }
 const scroll=event=>{if(event.target===intent?.scroll)sample()}
 // Native layout effects and ResizeObservers can move the viewport before a
 // scroll event is delivered. Catch those changes in the same render batch,
 // rather than painting the native jump and compensating one frame later.
 const size=new win.ResizeObserver(()=>{if(intent){const flowHeight=intent.flow.getBoundingClientRect().height,seatHeight=intent.owner.querySelector('[data-composer-seat]')?.getBoundingClientRect().height||0,composerHeight=intent.composer.getBoundingClientRect().height;if(flowHeight<intent.flowHeight-.5||seatHeight<intent.seatHeight-.5||composerHeight<intent.composerHeight-.5)intent.layoutAt=now();intent.flowHeight=flowHeight;intent.seatHeight=seatHeight;intent.composerHeight=composerHeight}win.queueMicrotask(sample)})
 const observer=new win.MutationObserver(records=>{
  sample()
  for(const job of [...jobs.values()]){
   if(!job.flow.isConnected||job.session!==(job.owner.getAttribute('data-conversation-session')||'')){release(job,'abandon');continue}
   if(job.effects.size&&records.some(record=>record.target===job.list||record.target===job.flow))schedule()
  }
 })
 observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-conversation-session']})
 const interrupt=event=>{if(event.type==='keydown'&&!KEYS.has(event.key))return;clear()}
 const visibility=()=>{if(doc.hidden)clear()},preferences=()=>{if(quiet.matches)clear()}
 doc.addEventListener('keydown',begin,true);doc.addEventListener('click',begin,true);doc.addEventListener('scroll',scroll,true)
 for(const name of ['wheel','touchstart','pointerdown','keydown'])doc.addEventListener(name,interrupt,{capture:true,passive:true})
 doc.addEventListener('visibilitychange',visibility);quiet.addEventListener('change',preferences);win.addEventListener('resize',clear)
 return{setEnabled(value){enabled=value;if(!enabled)clear()},dispose(){disposed=true;clear();observer.disconnect();doc.removeEventListener('keydown',begin,true);doc.removeEventListener('click',begin,true);doc.removeEventListener('scroll',scroll,true);for(const name of ['wheel','touchstart','pointerdown','keydown'])doc.removeEventListener(name,interrupt,true);doc.removeEventListener('visibilitychange',visibility);quiet.removeEventListener('change',preferences);win.removeEventListener('resize',clear)}}
}
