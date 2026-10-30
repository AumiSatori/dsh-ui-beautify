import {motion} from './motion.js'

// Streaming answers grow by whole tokens or by bursts of a few hundred
// characters; both used to pop in at full ink. New text is painted through CSS
// Custom Highlights instead of wrapping it, so React keeps every text node it
// owns and nothing reflows. Arrived text waits hidden and is typed out at a
// smooth, adaptive pace (a burst drains in a fraction of a second), each newly
// shown run fading in briefly, like a desktop chat client.
// React replaces a text node's whole value on each update, collapsing live
// ranges, so pieces are kept as character offsets and re-resolved per frame.
const STRENGTHS=['soft','standard','vivid']
// fade: per-run fade-in; lag: how far the typed text trails what has arrived.
const PROFILES={
  soft:{fade:motion.time.quick,glow:1,lag:260},
  standard:{fade:motion.time.material,glow:1.8,lag:340},
  vivid:{fade:motion.time.standard+40,glow:2.6,lag:440},
}
const LEVELS=10,NAME='dcb-stream-',STYLE='data-dcb-stream-reveal'
const ROWS='[data-chat-flow-kind^="assistant"]'
// Only the answer body types out; thinking (its block and summary) stays native.
const THINKING='[data-chat-group-part="reasoning"], [data-variant="think"]'
// Another plugin (DS Bot) draws its own chat bubbles over the same rows; its
// content is left entirely to it.
const FOREIGN='.bt-msg, .bt-bubble, .bt-astack'
const ROOT='[class*="_markdown_"], [data-dcb-stream-demo]'
// Characters per millisecond: never slower than a brisk typist, never so fast
// that a burst still pops; huge arrivals are shown at once.
const MIN_RATE=.04,MAX_RATE=4,MAX_CHUNK=6000,MAX_PIECES=120,SETTLE=800

export function normalizeStreamReveal(value){
  return {
    streamReveal:value?.streamReveal!==false,
    streamRevealStrength:STRENGTHS.includes(value?.streamRevealStrength)?value.streamRevealStrength:'soft',
  }
}

// Level 0 hides text not typed yet; later levels fade the ink in while a
// same-colour glow shrinks, a short soft dissolve.
export function streamRevealCss(strength='soft'){
  const {glow}=PROFILES[strength]||PROFILES.soft
  return Array.from({length:LEVELS},(_,level)=>{
    const ink=level===0?0:1-(1-level/LEVELS)**2,blur=glow*(1-ink)
    return `::highlight(${NAME}${level}){color:color-mix(in srgb,currentColor ${Math.round(ink*100)}%,transparent);${blur>.2?`text-shadow:0 0 ${blur.toFixed(2)}px currentColor;`:''}}`
  }).join('\n')
}

export function createStreamReveal(doc,win,options={}){
  const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  const supported=typeof win.Highlight==='function'&&!!win.CSS?.highlights
  const states=new WeakMap(),flows=new WeakMap(),live=new Set(),levels=[]
  let wanted=true,enabled=false,strength='soft',profile=PROFILES.soft,frame=0,last=0,watchdog=0,observer=null,style=null,disposed=false
  const now=()=>win.performance.now()

  function rootOf(node){
    const element=node?.nodeType===1?node:node?.parentElement
    const root=element?.closest(ROOT)
    if(!root)return null
    if(root.hasAttribute('data-dcb-stream-demo'))return root
    return root.closest(ROWS)&&root.closest('[data-chat-flow]')&&!root.closest(FOREIGN)&&!root.closest(THINKING)?root:null
  }
  // The outermost chat flow and when its current session was first seen; a
  // session switch or a freshly mounted transcript restarts the clock.
  function flowOf(node){
    let flow=node.closest('[data-chat-flow]')
    while(flow?.parentElement?.closest('[data-chat-flow]'))flow=flow.parentElement.closest('[data-chat-flow]')
    if(!flow)return null
    const session=flow.closest('[data-conversation-session]')?.getAttribute('data-conversation-session')||''
    const known=flows.get(flow)
    if(!known||known.session!==session)flows.set(flow,{session,at:now()})
    return flow
  }
  function arrival(root){
    const flow=flowOf(root),known=flow&&flows.get(flow)
    if(!known||now()-known.at<SETTLE)return false
    // Only the newest item: history paged in above never replays.
    let item=root
    while(item.parentElement!==flow)item=item.parentElement
    for(let next=item.nextElementSibling;next;next=next.nextElementSibling)
      if(next.matches('[data-chat-flow-kind]')||next.querySelector('[data-chat-flow-kind]'))return false
    return true
  }
  // Text nodes covering [from, end) in document order, from a backward walk so
  // a long answer only pays for its still-animating tail.
  function tail(root,from,total){
    const walker=doc.createTreeWalker(root,win.NodeFilter.SHOW_TEXT),nodes=[]
    let end=total
    for(let node=walker.lastChild();node;node=walker.previousNode()){
      const start=end-node.length
      if(node.length)nodes.push([node,start])
      end=start
      if(start<=from)break
    }
    return nodes.reverse()
  }
  function place(nodes,offset,closing){
    for(let index=nodes.length-1;index>=0;index--){
      const [node,start]=nodes[index]
      if(offset>start||offset===start&&!closing||index===0)return [node,Math.max(0,Math.min(node.length,offset-start))]
    }
    return null
  }
  function resolve(state){
    if(state.hold)state.hold.end=state.length
    const items=state.hold?[...state.pieces,state.hold]:state.pieces
    const first=items.reduce((value,piece)=>Math.min(value,piece.start),Infinity)
    const nodes=first===Infinity?[]:tail(state.root,first,state.length)
    for(const piece of items){
      levels[piece.level]?.delete(piece.range)
      const start=place(nodes,piece.start,false),end=place(nodes,piece.end,true)
      if(!start||!end||piece.end>state.length){piece.done=true;continue}
      try{piece.range.setStart(...start);piece.range.setEnd(...end)}catch{piece.done=true;continue}
      if(piece.range.collapsed)piece.done=true
      else levels[piece.level].add(piece.range)
    }
    state.pieces=state.pieces.filter(piece=>!piece.done)
    if(state.hold?.done)state.hold=null
    if(!state.pieces.length&&!state.hold)live.delete(state)
  }
  // Arrived text joins the hidden backlog that the typing clock drains.
  function grow(state,from,to){
    if(to-from>MAX_CHUNK&&!state.hold){finish(state);return}
    if(!state.hold)state.hold={start:from,end:to,level:0,range:new win.Range()}
    state.hold.end=to
    live.add(state)
  }
  function finish(state){
    for(const piece of state.pieces)levels[piece.level]?.delete(piece.range)
    if(state.hold)levels[0]?.delete(state.hold.range)
    state.pieces=[];state.hold=null;state.carry=0;live.delete(state)
  }
  function animate(){
    if(live.size&&!frame){last=0;frame=win.requestAnimationFrame(tick)}
    if(live.size)arm()
  }
  function changed(records){
    if(!enabled)return
    const roots=new Set(),fresh=[],visible=!doc.hidden
    for(const record of records){
      const root=rootOf(record.target)
      if(root)roots.add(root)
      // A row inserted with its first words is seen at insertion, so the next
      // token is already typed out instead of waiting for a second sighting.
      else for(const node of record.addedNodes)if(node.nodeType===1&&node.closest('[data-chat-flow]')){
        flowOf(node)
        for(const found of node.matches(ROOT)?[node]:node.querySelectorAll(ROOT))if(!states.has(found)&&rootOf(found)===found)fresh.push(found)
      }
    }
    // A reply whose first chunk arrives with its row, one or two at the bottom
    // of a settled conversation, is typed out too.
    for(const found of fresh){
      const arriving=visible&&fresh.length<=2&&arrival(found)
      states.set(found,{root:found,length:arriving?0:found.textContent.length,pieces:[],hold:null,carry:0})
      if(arriving)roots.add(found)
    }
    if(!roots.size)return
    for(const root of roots){
      const length=root.textContent.length
      let state=states.get(root)
      // First sight records history or a session switch without replaying it;
      // the settings preview starts empty and animates from its first token.
      if(!state){
        state={root,length:root.hasAttribute('data-dcb-stream-demo')?0:length,pieces:[],hold:null,carry:0}
        states.set(root,state)
      }
      const previous=state.length
      state.length=length
      if(!visible)finish(state)
      else if(length>previous)grow(state,previous,length)
      if(state.pieces.length||state.hold)resolve(state)
    }
    animate()
  }
  // An occluded or throttled window may stop delivering frames; never leave
  // text hidden behind a paused clock.
  function arm(){
    win.clearTimeout(watchdog)
    watchdog=win.setTimeout(()=>{watchdog=0;clearAll()},profile.fade+profile.lag*4+400)
  }
  // One clock types every live answer: the backlog drains in about `lag`
  // (exponentially, so steady streams trail evenly and bursts catch up fast),
  // and each frame's run becomes one fading piece.
  function tick(time){
    frame=0
    const dt=last?Math.min(50,Math.max(0,time-last)):16.7,step=profile.fade/(LEVELS-1)
    last=time
    for(const state of live){
      if(!state.root.isConnected){finish(state);continue}
      const hold=state.hold
      if(hold){
        const backlog=hold.end-hold.start
        state.carry=(state.carry||0)+Math.min(MAX_RATE,Math.max(MIN_RATE,backlog/profile.lag))*dt
        const count=Math.min(backlog,Math.floor(state.carry))
        if(count>0){
          state.carry-=count
          state.pieces.push({start:hold.start,end:hold.start+count,born:time,level:0,range:new win.Range()})
          hold.start+=count
          while(state.pieces.length>MAX_PIECES)state.pieces.shift().done=true
          if(hold.start>=hold.end){levels[0].delete(hold.range);state.hold=null;state.carry=0}
          resolve(state)
        }
      }
      for(const piece of state.pieces){
        const age=time-piece.born,level=age<0?0:1+Math.floor(age/step)
        if(level===piece.level)continue
        levels[piece.level].delete(piece.range)
        if(level>=LEVELS)piece.done=true
        else{levels[level].add(piece.range);piece.level=level}
      }
      state.pieces=state.pieces.filter(piece=>!piece.done)
      if(!state.pieces.length&&!state.hold)live.delete(state)
    }
    if(live.size){frame=win.requestAnimationFrame(tick);arm()}
    else{win.clearTimeout(watchdog);watchdog=0;last=0}
  }
  function clearAll(){
    if(frame)win.cancelAnimationFrame(frame);frame=0
    win.clearTimeout(watchdog);watchdog=0
    for(const state of [...live])finish(state)
  }
  function stop(){
    clearAll();observer?.disconnect();observer=null
    for(let level=0;level<LEVELS;level++)win.CSS.highlights.delete(NAME+level)
    levels.length=0;style?.remove();style=null
  }
  function start(){
    style=doc.createElement('style');style.setAttribute(STYLE,'');style.textContent=streamRevealCss(strength)
    doc.head.append(style)
    for(let level=0;level<LEVELS;level++){
      const highlight=new win.Highlight()
      levels.push(highlight);win.CSS.highlights.set(NAME+level,highlight)
    }
    for(const flow of doc.querySelectorAll('[data-chat-flow]'))flowOf(flow)
    observer=new win.MutationObserver(changed)
    observer.observe(doc.body,{subtree:true,childList:true,characterData:true})
  }
  function sync(){
    const next=!disposed&&supported&&wanted&&!quiet.matches
    if(next===enabled){if(style)style.textContent=streamRevealCss(strength);return}
    enabled=next
    enabled?start():stop()
  }
  function setOptions(value){
    ({streamReveal:wanted,streamRevealStrength:strength}=normalizeStreamReveal(value))
    profile=PROFILES[strength]
    sync()
  }
  const hidden=()=>{if(doc.hidden)clearAll()}
  quiet.addEventListener('change',sync);doc.addEventListener('visibilitychange',hidden)
  setOptions(options)
  return {
    setOptions,
    get active(){return live.size},
    dispose(){
      disposed=true;quiet.removeEventListener('change',sync);doc.removeEventListener('visibilitychange',hidden)
      enabled=false;stop()
    },
  }
}

export const streamRevealSettingsCss=`
  .dcb-stream-demo { box-sizing:border-box; min-height:92px; margin:0 0 16px; padding:14px 16px; border:1px solid var(--dsh-settings-border); border-radius:13px; background:var(--dsh-settings-subtle); color:var(--dsh-settings-text); font:400 13.5px/22px system-ui,sans-serif; }
  .dcb-stream-demo p { margin:0; min-height:44px; white-space:pre-wrap; }
  .dcb-stream-demo-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:0 0 8px; color:var(--dsh-settings-secondary); font-size:11px; line-height:16px; }
  .dcb-stream-reveal .dcb-welcome-speeds { margin-top:0; }
`

const SAMPLE=[...[...'新回答会以平滑的节奏逐字淡入，不再一顿一顿地跳出来；'.matchAll(/.{1,3}/gu)].map(match=>match[0]),'模型一口气吐出一大段时，也会均匀地打出来，已经输出的内容随之平滑上移，回答结束后不留下任何常驻动画。']

export function createStreamRevealSettings(React,win=globalThis.window){
  const h=React.createElement
  const choices=[['soft','轻柔'],['standard','标准'],['vivid','明显']]
  function Preview({enabled,strength}){
    const text=React.useRef(null),timer=React.useRef(0)
    const stop=()=>{win.clearTimeout(timer.current);timer.current=0}
    React.useEffect(()=>stop,[])
    React.useEffect(()=>{stop();if(text.current)text.current.textContent=''},[enabled,strength])
    const play=()=>{
      stop()
      const node=text.current
      if(!node)return
      node.textContent=''
      let index=0
      const next=()=>{
        if(!node.isConnected||index>=SAMPLE.length){timer.current=0;return}
        node.append(SAMPLE[index++])
        timer.current=win.setTimeout(next,index===SAMPLE.length-1?700:60+Math.random()*60)
      }
      next()
    }
    return h('div',{className:'dcb-stream-demo'},
      h('div',{className:'dcb-stream-demo-head'},h('small',null,'仅预览，不发送消息'),
        h('button',{type:'button',className:'dcb-count-button',onClick:play,disabled:!enabled,'aria-label':'播放流式文字预览'},'↻ 播放预览')),
      h('p',{ref:text,'data-dcb-stream-demo':'','aria-live':'off'}))
  }
  return function StreamRevealSettings({value,onChange}){
    const {streamReveal,streamRevealStrength}=normalizeStreamReveal(value)
    const chosen=choices.findIndex(([id])=>id===streamRevealStrength)
    return h('div',{className:'dcb-stream-reveal'},
      h('div',{className:'dcb-settings-row'},
        h('div',{className:'dcb-settings-copy'},h('span',{className:'dcb-settings-row-title'},'流式文字渐显',h('span',{className:'dcb-cost-tag'},'短时开销')),
          h('p',{className:'dcb-settings-row-desc'},'回答生成时新文字以平滑的节奏逐字淡入，模型一次吐出一大段也会均匀地打出来，不再一顿一顿地跳出；已输出的内容随之平滑上移。只绘制新增文字，不改动排版，回答结束后不留动画；减少动态效果时直接显示。')),
        h('button',{type:'button',role:'switch',className:'dcb-switch','aria-label':'流式文字渐显','aria-checked':streamReveal,onClick:()=>onChange({streamReveal:!streamReveal})})),
      h('div',{className:'dcb-welcome-speeds',role:'radiogroup','aria-label':'渐显强度'},choices.map(([id,name],index)=>h('button',{key:id,type:'button',role:'radio','aria-checked':streamRevealStrength===id,tabIndex:index===chosen?0:-1,disabled:!streamReveal,
        onClick:()=>onChange({streamRevealStrength:id}),
        onKeyDown:event=>{const size=choices.length,at={ArrowRight:(index+1)%size,ArrowDown:(index+1)%size,ArrowLeft:(index+size-1)%size,ArrowUp:(index+size-1)%size,Home:0,End:size-1}[event.key];if(at!==undefined){event.preventDefault();onChange({streamRevealStrength:choices[at][0]});event.currentTarget.parentElement.children[at].focus()}}},name))),
      h(Preview,{enabled:streamReveal,strength:streamRevealStrength}))
  }
}
