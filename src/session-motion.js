import {motion} from './motion.js'

// Bring the new conversation in under the bounded native scroll viewport: its
// transcript content fades and rises a few pixels while the composer and its
// glass stay put. No snapshots, duplicated messages or route hooks.
export function createSessionMotion(doc,win){
  const records=new Map(),quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let disposed=false
  const stop=record=>{record.animation?.cancel();record.animation=null;record.target=null}
  const clear=record=>{stop(record);win.clearTimeout(record.timer);win.cancelAnimationFrame(record.wait);record.wait=0;record.pending=false}
  const contentOf=scroll=>[...scroll.children].find(el=>!el.hasAttribute('data-composer-seat'))
  const visible=el=>el?.isConnected&&el.getClientRects().length&&win.getComputedStyle(el).visibility!=='hidden'
  const seatFor=host=>{
    const main=host.closest('main')
    return host.closest('[class$="_centerCol"], [class*="_centerCol "]')||(main?.hasAttribute('data-phase')?main.parentElement:main)||host.parentElement
  }
  function ready(content){
    if(!content)return false
    const walker=doc.createTreeWalker(content,win.NodeFilter.SHOW_ELEMENT|win.NodeFilter.SHOW_TEXT)
    let visited=0
    for(let node=content;node&&visited++<48;node=walker.nextNode())if(node.nodeType===3?node.data.trim():node.matches('img,canvas,video'))return true
    return false
  }
  function enter(record,scroll,content){
    const box=scroll.getBoundingClientRect(),dpr=win.devicePixelRatio||1
    // Overflow clipping bounds the animation even for thousands of old rows.
    // A synthetic/non-scroll outlet or oversized viewport keeps native paint.
    if(!visible(scroll)||typeof content?.animate!=='function'||!/(auto|scroll|hidden|clip)/.test(win.getComputedStyle(scroll).overflowY)||box.width*box.height*dpr*dpr>8_000_000){clear(record);return}
    // A quick reverse continues from the frame on screen instead of restarting.
    const running=record.target===content&&record.animation,style=running?win.getComputedStyle(content):null
    const from={opacity:running?style.opacity:'0',translate:running?style.translate:'0 10px'}
    const end=running?record.opacity:win.getComputedStyle(content).opacity
    clear(record);record.opacity=end
    try{
      const animation=content.animate([from,{opacity:end,translate:'none'}],{duration:motion.time.scene,easing:motion.ease.smooth,fill:'both'})
      animation.id='dcb-conversation-session';record.animation=animation;record.target=content
      animation.finished.then(()=>{if(record.animation===animation)stop(record)},()=>{})
    }catch{/* Missing WAAPI leaves the native conversation usable. */}
  }
  // History often arrives a few frames after the route switch. Look again on
  // later frames, bounded by the 900ms switch window; no idle loop remains.
  function settle(record,host){
    win.cancelAnimationFrame(record.wait);record.wait=0
    const scroll=host.querySelector('[data-conversation-scroll]'),content=scroll&&contentOf(scroll)
    if(ready(content)){record.pending=false;enter(record,scroll,content);return}
    if(record.pending&&!disposed)record.wait=win.requestAnimationFrame(()=>{record.wait=0;if(record.pending&&record.host===host&&host.isConnected)settle(record,host)})
  }
  function sync(enabled=true){
    if(disposed)return
    const groups=new Map()
    for(const host of doc.querySelectorAll('[data-conversation-content][data-conversation-session]')){
      if(host.closest('[data-dcb-sidebar-layout-probe]'))continue
      const seat=seatFor(host);if(!groups.has(seat))groups.set(seat,[]);groups.get(seat).push(host)
    }
    for(const [seat,group]of records)if(!seat.isConnected){for(const record of group)clear(record);records.delete(seat)}
    for(const [seat,hosts]of groups){
      let group=records.get(seat);if(!group){group=[];records.set(seat,group)}
      for(let i=0;i<hosts.length;i++){
        const host=hosts[i],session=host.getAttribute('data-conversation-session'),scroll=host.querySelector('[data-conversation-scroll]')
        let record=group[i]
        if(!record){group[i]=record={session,host,pending:false};continue}
        const changed=session!==record.session
        if(changed){
          win.clearTimeout(record.timer);record.pending=!!record.session&&!!session
          record.session=session;record.timer=win.setTimeout(()=>{record.pending=false},900)
        }
        record.host=host
        if(!enabled||quiet.matches||doc.hidden||!visible(host)){clear(record);continue}
        if(record.target&&!record.target.isConnected)stop(record)
        if(record.pending&&scroll)settle(record,host)
      }
      for(const record of group.splice(hosts.length))clear(record)
    }
    for(const [seat,group]of records)if(!groups.has(seat))for(const record of group)clear(record)
  }
  const preference=()=>{for(const group of records.values())for(const record of group)clear(record)}
  quiet.addEventListener('change',preference);doc.addEventListener('visibilitychange',preference)
  return {sync,dispose(){disposed=true;preference();records.clear();quiet.removeEventListener('change',preference);doc.removeEventListener('visibilitychange',preference)}}
}
