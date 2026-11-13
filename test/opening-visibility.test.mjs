import test from 'node:test'
import assert from 'node:assert/strict'
import {createOpeningGate,OPENING_STALL,OPENING_BLUR_GRACE} from '../src/opening-visibility.js'

// A deterministic page: frames, timers, visibility and focus are driven by
// the test, so the hidden/occluded/fullscreen startup paths are reproducible.
function fakePage({hidden=false,focused=true}={}){
  const listeners=new Map(),timers=new Map()
  let frames=[],nextId=1,clock=0
  const target=name=>({addEventListener(type,fn){const key=name+':'+type;if(!listeners.has(key))listeners.set(key,new Set());listeners.get(key).add(fn)},removeEventListener(type,fn){listeners.get(name+':'+type)?.delete(fn)}})
  const doc={...target('doc'),hidden,hasFocus:()=>page.focused}
  const win={...target('win'),
    requestAnimationFrame(fn){const id=nextId++;frames.push({id,fn});return id},
    cancelAnimationFrame(id){frames=frames.filter(f=>f.id!==id)},
    setTimeout(fn,ms){const id=nextId++;timers.set(id,{fn,at:clock+ms});return id},
    clearTimeout(id){timers.delete(id)}}
  const emit=(name,type)=>{for(const fn of[...(listeners.get(name+':'+type)||[])])fn({type})}
  const page={doc,win,focused,
    get pendingFrames(){return frames.length},
    get listenerCount(){let n=0;for(const set of listeners.values())n+=set.size;return n},
    frame(gap=16){clock+=gap;for(const[id,t]of[...timers])if(t.at<=clock){timers.delete(id);t.fn()};const run=frames;frames=[];for(const f of run)f.fn(clock)},
    frames(n,gap=16){for(let i=0;i<n;i++)page.frame(gap)},
    wait(ms){clock+=ms;for(const[id,t]of[...timers])if(t.at<=clock){timers.delete(id);t.fn()}},
    setHidden(value){doc.hidden=value;emit('doc','visibilitychange')},
    blur(){page.focused=false;emit('win','blur')},
    focus(){page.focused=true;emit('win','focus')},
    pointer(){emit('doc','pointermove')}}
  return page
}
function gateOn(page){
  const log=[]
  const gate=createOpeningGate(page.doc,page.win,{onOpen:()=>log.push('open'),onLost:reason=>log.push('lost:'+reason)})
  return {gate,log}
}

test('a visible, focused, painting window opens after a few steady frames',()=>{
  const page=fakePage(),{gate,log}=gateOn(page)
  page.frames(2);assert.deepEqual(log,[])
  page.frames(2);assert.deepEqual(log,['open']);assert.equal(gate.open,true)
  gate.dispose();assert.equal(page.pendingFrames,0);assert.equal(page.listenerCount,0)
})

test('a window that starts hidden (minimized / covered by a fullscreen app) waits for visibility',()=>{
  const page=fakePage({hidden:true}),{gate,log}=gateOn(page)
  assert.equal(page.pendingFrames,0)
  page.wait(5000);assert.deepEqual(log,[])
  page.setHidden(false);page.frames(4)
  assert.deepEqual(log,['open']);gate.dispose()
})

test('throttled painting (frames seconds apart) never counts as visible',()=>{
  const page=fakePage(),{gate,log}=gateOn(page)
  page.frames(6,1000);assert.deepEqual(log,[])
  page.frames(4);assert.deepEqual(log,['open']);gate.dispose()
})

test('an unfocused window parks without a frame loop and opens on focus or pointer',()=>{
  const page=fakePage({focused:false}),{gate,log}=gateOn(page)
  page.frames(5);assert.deepEqual(log,[]);assert.equal(gate.state,'parked');assert.equal(page.pendingFrames,0)
  page.pointer();assert.deepEqual(log,['open'])
  gate.dispose()
  const other=fakePage({focused:false}),second=gateOn(other)
  other.frames(5);other.focus();other.frames(4)
  assert.deepEqual(second.log,['open']);second.gate.dispose()
})

test('hiding, a frame stall or a lasting blur during playback asks for a replay',()=>{
  const page=fakePage(),{gate,log}=gateOn(page)
  page.frames(4);page.setHidden(true)
  assert.deepEqual(log,['open','lost:hidden']);assert.equal(page.pendingFrames,0)
  page.setHidden(false);page.frames(4);assert.deepEqual(log.slice(2),['open'])
  page.frame(OPENING_STALL+400);assert.deepEqual(log.slice(3),['lost:stalled'])
  page.frames(4);assert.deepEqual(log.slice(4),['open'])
  page.blur();page.wait(OPENING_BLUR_GRACE+10);assert.deepEqual(log.slice(5),['lost:blur'])
  gate.dispose()
})

test('a short blur (alt-tab, focus moving into the opening iframe) keeps playing',()=>{
  const page=fakePage(),{gate,log}=gateOn(page)
  page.frames(4);page.blur();page.wait(300);page.focus();page.wait(OPENING_BLUR_GRACE+10)
  assert.deepEqual(log,['open'])
  // Focus inside the iframe: the window blurs but the document keeps focus.
  page.focused=true;page.doc.hasFocus=()=>true;page.blur();page.focused=true;page.wait(OPENING_BLUR_GRACE+10)
  assert.deepEqual(log,['open']);gate.dispose()
})
