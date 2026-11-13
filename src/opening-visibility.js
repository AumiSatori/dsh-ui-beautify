// Decides when the opening may actually play. A window can be "visible" to
// the page while nobody can see it: Electron windows created hidden, windows
// covered by a fullscreen app, or a page that is not painting. Openings that
// run in that state finish their timers unseen and can leave their canvases
// in a degraded state, so the content starts only when the page is visible,
// focused and producing frames, and is replayed after it was lost.
export const OPENING_FRAMES=3,OPENING_FRAME_GAP=250,OPENING_STALL=1000,OPENING_BLUR_GRACE=1500

export function createOpeningGate(doc,win,{onOpen=()=>{},onLost=()=>{}}={}){
  let state='waiting',disposed=false,raf=0,last=0,smooth=0,blurTimer=0
  const listeners=[]
  const on=(target,type,fn,options)=>{target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options))}
  // hasFocus() stays true while focus is inside the opening iframe.
  const focused=()=>typeof doc.hasFocus!=='function'||doc.hasFocus()
  const cancelBlur=()=>{if(blurTimer){win.clearTimeout(blurTimer);blurTimer=0}}
  const lose=reason=>{
    if(disposed||state!=='open')return
    state='waiting';smooth=0;last=0;cancelBlur()
    onLost(reason)
    request()
  }
  function frame(stamp){
    raf=0
    if(disposed)return
    if(doc.hidden){if(state==='open')lose('hidden');return}
    const gap=last?stamp-last:0
    last=stamp
    if(state==='open'){
      // rAF that resumes after a long pause means the page was not painting.
      if(gap>OPENING_STALL){lose('stalled');return}
    }else{
      smooth=gap>0&&gap<=OPENING_FRAME_GAP?smooth+1:0
      if(smooth>=OPENING_FRAMES-1){
        if(focused()){state='open';onOpen()}
        // Painting but unfocused: park without a frame loop until the user
        // focuses or points at the window.
        else{state='parked';return}
      }
    }
    request()
  }
  function request(){if(!raf&&!disposed&&!doc.hidden)raf=win.requestAnimationFrame(frame)}
  on(doc,'visibilitychange',()=>{
    if(doc.hidden){win.cancelAnimationFrame(raf);raf=0;smooth=0;last=0;if(state==='parked')state='waiting';lose('hidden')}
    else request()
  })
  on(win,'focus',()=>{cancelBlur();if(state==='parked'){state='waiting';smooth=0;last=0}request()})
  on(win,'blur',()=>{
    if(state!=='open'||blurTimer)return
    blurTimer=win.setTimeout(()=>{blurTimer=0;if(!focused())lose('blur')},OPENING_BLUR_GRACE)
  })
  // Pointer or keyboard input means the user is looking at this window even
  // when the host did not grant it focus (for example showInactive).
  const engage=()=>{if(state==='parked'&&!disposed&&!doc.hidden){state='open';smooth=0;last=0;onOpen();request()}}
  on(doc,'pointermove',engage,{capture:true,passive:true})
  on(doc,'keydown',engage,{capture:true})
  request()
  return{
    get state(){return state},
    get open(){return state==='open'},
    dispose(){if(disposed)return;disposed=true;win.cancelAnimationFrame(raf);raf=0;cancelBlur();for(const off of listeners)off();listeners.length=0}
  }
}
