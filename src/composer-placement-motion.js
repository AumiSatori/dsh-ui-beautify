import {motion} from './motion.js'

const OWNER='[data-conversation-content]',CARD='[data-composer-card]',MARK='data-dcb-composer-placement'
// Bridge the first native hero -> active layout commit with the real card.
// Its final layout, editor, focus and native scroll controller remain owned by
// the host. No duplicate input, transcript copy or lasting frame loop.
export function createComposerPlacementMotion(doc,win){
 const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
 let disposed=false,pending=null,active=null
 const session=owner=>owner.getAttribute('data-conversation-session')||''
 const box=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}
 const fits=r=>r.width>.5&&r.height>.5&&r.height<=win.innerHeight*.6&&r.width*r.height*(win.devicePixelRatio||1)**2<=4_000_000
 function clearPending(){if(pending){pending.observer.disconnect();win.clearTimeout(pending.timer);pending=null}}
 function stop(){if(active){const record=active;active=null;record.observer.disconnect();win.clearTimeout(record.timer);record.animation.cancel();record.mark===null?record.card.removeAttribute(MARK):record.card.setAttribute(MARK,record.mark)}}
 function clear(){clearPending();stop()}
 function commit(){
  const record=pending;if(!record)return
  const {owner,from}=record
  if(disposed||quiet.matches||doc.hidden||!owner.isConnected||session(owner)!==record.session){clear();return}
  if(owner.getAttribute('data-content-phase')!=='active')return
  const card=owner.querySelector(CARD);if(!card||!card.getClientRects().length||win.getComputedStyle(card).visibility==='hidden')return
  const to=box(card),css=win.getComputedStyle(card)
  clearPending()
  if(!fits(to)||typeof card.animate!=='function'||css.translate!=='none'||css.scale!=='none'||css.transform!=='none')return
  const dx=from.x-to.x,dy=from.y-to.y,sx=from.width/to.width,sy=from.height/to.height
  if(Math.abs(dx)+Math.abs(dy)<1&&Math.abs(sx-1)+Math.abs(sy-1)<.01)return
  const mark=card.getAttribute(MARK);card.setAttribute(MARK,'')
  const animation=card.animate([
   {translate:`${dx}px ${dy}px`,scale:`${sx} ${sy}`,transformOrigin:'0px 0px'},
   {translate:'0px 0px',scale:'1 1',transformOrigin:'0px 0px'},
  ],{duration:motion.time.standard,easing:motion.ease.smooth,id:'dcb-composer-placement'})
  const observer=new win.MutationObserver(()=>{if(!card.isConnected||!owner.isConnected||owner.getAttribute('data-content-phase')!=='active'||session(owner)!==record.session)stop()})
  observer.observe(owner,{attributes:true,attributeFilter:['data-content-phase','data-conversation-session'],childList:true,subtree:true})
  if(owner.parentElement)observer.observe(owner.parentElement,{childList:true})
  const running={card,animation,observer,mark,timer:win.setTimeout(stop,motion.time.standard+80)};active=running
  const finish=()=>{if(active===running)stop()};animation.finished.then(finish,finish)
 }
 function arm(event){
  if(disposed||quiet.matches||doc.hidden||event.defaultPrevented)return
  const target=event.target?.closest?.(CARD),owner=target?.closest(OWNER)
  if(!owner||owner.getAttribute('data-content-phase')!=='hero'||owner.querySelector('[data-conversation-composer-overlay]'))return
  const editor=target.querySelector('[data-composer-input]')
  if(!editor||editor.getAttribute('contenteditable')==='false'||editor.hasAttribute('disabled')||(!editor.textContent.trim()&&!target.querySelector('[data-attachment]')))return
  if(event.type==='keydown'){
   if(!editor.contains(event.target)||event.key!=='Enter'||event.shiftKey||event.altKey||event.ctrlKey||event.metaKey||event.repeat||event.isComposing||event.keyCode===229||editor.hasAttribute('data-composer-composing'))return
  }else{
   const button=event.target.closest('button')
   if(!button||button.disabled||!(/发送|send/i.test(button.getAttribute('aria-label')||button.title||'')||[...button.classList].some(name=>name.endsWith('_primary'))))return
  }
  const from=box(target);if(!fits(from)||from.y<0||from.y>=win.innerHeight)return
  clear()
  const observer=new win.MutationObserver(commit)
  observer.observe(owner,{attributes:true,attributeFilter:['data-content-phase','data-conversation-session'],childList:true,subtree:true})
  if(owner.parentElement)observer.observe(owner.parentElement,{childList:true})
  pending={owner,session:session(owner),from,observer,timer:win.setTimeout(clearPending,8000)}
 }
 const typing=event=>{if(event.target?.closest?.('[data-composer-input]'))clear()}
 const visibility=()=>{if(doc.hidden)clear()}
 doc.addEventListener('keydown',arm,true);doc.addEventListener('click',arm,true);doc.addEventListener('beforeinput',typing,true)
 doc.addEventListener('visibilitychange',visibility);win.addEventListener('resize',clear);quiet.addEventListener('change',clear)
 return{dispose(){disposed=true;clear();doc.removeEventListener('keydown',arm,true);doc.removeEventListener('click',arm,true);doc.removeEventListener('beforeinput',typing,true);doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('resize',clear);quiet.removeEventListener('change',clear)}}
}
