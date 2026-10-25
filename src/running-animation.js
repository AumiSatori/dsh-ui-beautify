import {normalizeRunningAnimation,chooseRunningAction,chooseRunningLabel,runningLabelLines,RUNNING_BUILTIN} from './running-animation-config.js'
const native=name=>`:is([class$="_${name}"],[class*="_${name} "])`
const ROW=`[data-chat-running]:not([data-chat-running="false"])${native('running')}`
const SELECTOR=`${ROW} > ${native('runningContent')} > ${native('runningIcon')}`
const EXCLUDED='[data-composer-seat],[data-composer-card],[data-dcb-sidebar-layout-probe],[data-dcb-sidebar-ghost]'
const eligible=host=>host.isConnected&&host.matches(SELECTOR)&&!host.closest(EXCLUDED)
export const runningAnimationCss=`
  /* The native glyph keeps its 14px layout box and the clock its native line
     height. Larger artwork is painted outside that box, never counted as extra
     vertical space that would collapse again when generation ends. */
  [data-dcb-running-reserve] { position:relative!important; contain:layout style!important; overflow:visible!important; margin-inline:max(0px,calc((var(--dcb-running-size,32px) - 14px - var(--dsh-content-font-delta,0px)) / 2)); }
  [data-dcb-running-ready] > .dcb-running-art { position:absolute; left:50%; top:50%; width:var(--dcb-running-size,32px); height:var(--dcb-running-size,32px); translate:-50% -50%; }
  [data-dcb-running-ready] > :not(.dcb-running-art) { display:none!important; }
  [data-dcb-running-content] { gap:var(--dcb-running-gap)!important; }
  .dcb-running-art { display:block; flex:none; width:100%; height:100%; overflow:hidden; position:relative; pointer-events:none; }
  .dcb-running-strip { position:absolute; left:0; top:0; background-repeat:no-repeat; background-position:0 0; background-size:100% 100%; pointer-events:none; will-change:transform; backface-visibility:hidden; }
  .dcb-running-art img { display:block; width:100%; height:100%; object-fit:contain; }

  /* The native shimmer paints a second label through a translated mask.
     Keep the live clock's single real text run: custom font metrics and
     fractional scaling must never expose a displaced duplicate of the time. */
  [data-chat-running] [data-shimmer] > [aria-hidden="true"] { display:none!important; }
  @supports ((background-clip:text) or (-webkit-background-clip:text)) {
    @media (prefers-reduced-motion:no-preference) and (forced-colors:none) {
      [data-chat-running] [data-shimmer="true"] > :not([aria-hidden]) > :only-child {
        background-image:linear-gradient(105deg,currentColor 38%,var(--dsw-alias-label-deep-diving-shimmer,currentColor) 50%,currentColor 62%);
        background-size:250% 100%; background-repeat:no-repeat; background-clip:text; -webkit-background-clip:text; -webkit-text-fill-color:transparent;
        animation:dcb-running-label-sheen 2.4s linear infinite;
      }
    }
  }
  @keyframes dcb-running-label-sheen { from { background-position:100% 0; } to { background-position:0% 0; } }
`
export function createRunningPlayer(doc,win,action,asset){
  const node=doc.createElement('span');node.className='dcb-running-art';node.setAttribute('aria-hidden','true')
  let animation=null,image=null,playing=false
  if(action.type==='sprite'){
    const strip=doc.createElement('span');strip.className='dcb-running-strip'
    strip.style.width=`${action.columns*100}%`;strip.style.height=`${action.rows*100}%`;strip.style.backgroundImage=`url("${asset.url}")`
    node.append(strip)
    // One cell is 100/columns % of the strip's own width. Driving the sprite with
    // transform keeps it on the compositor: background-position runs on the main
    // thread, and a stalled frame at the loop point showed a blank flash.
    const stepX=100/action.columns,stepY=100/action.rows
    const position=index=>`translate(${-(index%action.columns)*stepX}%, ${-Math.floor(index/action.columns)*stepY}%)`
    const frames=Array.from({length:action.frames},(_,index)=>({transform:position(index),offset:index/action.frames,easing:'steps(1,end)'}));frames.push({transform:position(0),offset:1})
    animation=strip.animate(frames,{duration:action.frames/action.fps*1000,iterations:Infinity,easing:'linear'})
    animation.id='dcb-running-sprite';animation.pause();animation.currentTime=0
  }else{image=doc.createElement('img');image.alt='';image.src=asset.poster;node.append(image)}
  return {node,setPlaying(next){if(next===playing)return;playing=next;if(animation)next?animation.play():animation.pause();if(image)image.src=next?asset.url:asset.poster},freeze(){playing=false;if(animation){animation.pause();animation.currentTime=0}if(image)image.src=asset.poster},dispose(){animation?.cancel();image?.removeAttribute('src');node.remove();asset.release()}}
}
function readyImage(win,url){return new Promise((resolve,reject)=>{const image=new win.Image(),timer=win.setTimeout(()=>end(Error('动图读取超时')),10000);function end(error){win.clearTimeout(timer);image.onload=image.onerror=null;image.src='';error?reject(error):resolve()}image.onload=()=>end();image.onerror=()=>end(Error('动图读取失败'));image.src=url})}
export function createRunningAnimations(doc,win,catalog,initial){
  let options=normalizeRunningAnimation(initial),disposed=false,observer=null,signature='',previous='',previousLabel=''
  const records=new Map(),quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  const intersection=new win.IntersectionObserver(entries=>{for(const entry of entries){const record=records.get(entry.target);if(record){record.visible=entry.isIntersecting;refresh(record)}}})
  const selectedPack=()=>catalog.getSnapshot().packs.find(pack=>pack.id===options.runningAnimationPack)||catalog.getSnapshot().packs.find(pack=>pack.id===RUNNING_BUILTIN)
  const actions=pack=>options.runningAnimationActions===null?pack.actions:pack.actions.filter(action=>options.runningAnimationActions.includes(action.id))
  // The host rewrites this line every second ("深度求索中，用时 14分35秒 …") and
  // paints it through a shimmer decoration that reads the text from an attribute.
  // Keep its DOM, swap only the wording and carry the elapsed-time tail along.
  function visibleRun(content){
    const walker=doc.createTreeWalker(content,win.NodeFilter.SHOW_TEXT)
    for(let node=walker.nextNode();node;node=walker.nextNode()){
      if(!node.nodeValue||!node.nodeValue.trim())continue
      const parent=node.parentElement
      if(!parent||parent.closest('.dcb-running-art,[aria-hidden="true"]'))continue
      return node
    }
    return null
  }
  function decoratedRun(content){
    return content.querySelector('[aria-hidden="true"] [data-shimmer-text]')||null
  }
  const TIME_TOKENS=['{time}','{用时}']
  function hostClock(hostText){
    const index=hostText.indexOf('用时')
    if(index<0)return null
    const tail=hostText.slice(index)
    return {tail,time:tail.replace(/^用时\s*/u,'').replace(/[\s…·]+$/u,'').trim()}
  }
  function composeLabel(hostText,label){
    if(!label)return hostText
    const clock=hostClock(hostText)
    if(!clock)return TIME_TOKENS.reduce((text,token)=>text.replaceAll(token,''),label).trim()
    if(TIME_TOKENS.some(token=>label.includes(token)))return TIME_TOKENS.reduce((text,token)=>text.replaceAll(token,clock.time),label).trim()
    return `${label}，${clock.tail}`
  }
  function clearLabel(record){
    const content=record.content
    if(content&&record.written&&record.hostText!==undefined){
      const run=visibleRun(content)
      if(run&&run.nodeValue===record.written)run.nodeValue=record.hostText
      const decorated=decoratedRun(content)
      if(decorated)decorated.setAttribute('data-shimmer-text',record.hostText)
    }
    record.written='';record.label='';record.hostText=undefined
  }
  function applyLabel(record){
    const content=record.content
    if(!content||record.dead)return
    if(record.labelKey!==options.runningAnimationLabel){record.labelKey=options.runningAnimationLabel;record.label=''}
    const run=visibleRun(content)
    if(!run)return
    const current=run.nodeValue
    if(current!==record.written)record.hostText=current
    const labels=runningLabelLines(options.runningAnimationLabel)
    const label=labels.length?(record.label||(record.label=chooseRunningLabel(labels,{random:options.runningAnimationLabelRandom,previous:previousLabel}))):''
    if(labels.length)previousLabel=label
    const next=composeLabel(record.hostText??current,label)
    if(current!==next){run.nodeValue=next;record.written=next}
    else if(record.written&&current===record.written)record.written=next
    const decorated=decoratedRun(content)
    if(decorated&&decorated.getAttribute('data-shimmer-text')!==next)decorated.setAttribute('data-shimmer-text',next)
  }
  function dimensions(record){
    record.host.style.setProperty('--dcb-running-size',`${options.runningAnimationSize}px`);record.host.style.setProperty('--dcb-running-opacity',String(options.runningAnimationOpacity));if(record.player)record.player.node.style.opacity=options.runningAnimationOpacity
    const content=record.host.closest('[class*="runningContent"]')
    if(content&&record.content!==content){clearLabel(record);record.content=content;record.label=''}
    if(content){content.setAttribute('data-dcb-running-content','');content.style.setProperty('--dcb-running-gap',`${options.runningAnimationGap}px`);applyLabel(record)}
    else{clearLabel(record);record.content=null}
  }
  function remove(record){
    record.dead=true;intersection.unobserve(record.host);record.player?.dispose();record.host.removeAttribute('data-dcb-running-reserve');record.host.removeAttribute('data-dcb-running-ready');record.host.style.removeProperty('--dcb-running-size');record.host.style.removeProperty('--dcb-running-opacity')
    clearLabel(record)
    if(record.content){record.content.removeAttribute('data-dcb-running-content');record.content.style.removeProperty('--dcb-running-gap')}
    records.delete(record.host)
  }
  async function prepare(record){
    if(record.loading||record.player||record.dead||!record.visible)return
    const pack=selectedPack();if(!pack)return
    const action=chooseRunningAction(actions(pack),{random:options.runningAnimationRandom,previous});if(!action)return
    previous=action.id;record.loading=true;record.action=action.id
    let asset
    try{
      asset=await catalog.acquire(pack,action);await readyImage(win,asset.poster)
      if(disposed||record.dead||!eligible(record.host)){asset.release();if(!record.dead)remove(record);return}
      record.player=createRunningPlayer(doc,win,action,asset);asset=null;record.host.append(record.player.node);record.host.setAttribute('data-dcb-running-ready','');dimensions(record);refresh(record)
    }catch{asset?.release();record.failed=true}finally{record.loading=false}
  }
  function refresh(record){
    if(record.dead)return
    if(!eligible(record.host)){remove(record);return}
    if(!record.player){if(!record.failed&&!doc.hidden)void prepare(record);return}
    if(quiet.matches)record.player.freeze();else record.player.setPlaying(record.visible&&!doc.hidden)
  }
  function add(host){
    if(records.has(host)||!eligible(host))return
    host.setAttribute('data-dcb-running-reserve','')
    // Publish paint size before asynchronous preparation without resizing the
    // native host box.
    host.style.setProperty('--dcb-running-size',`${options.runningAnimationSize}px`)
    host.style.setProperty('--dcb-running-opacity',String(options.runningAnimationOpacity))
    const record={host,visible:false};records.set(host,record);intersection.observe(host)
  }
  function discover(node){if(node.nodeType!==1||node.closest('.dcb-running-art'))return;if(node.matches(SELECTOR))add(node);for(const host of node.querySelectorAll(SELECTOR))add(host)}
  function connect(){
    if(observer||!options.runningAnimationEnabled||!selectedPack()||!actions(selectedPack()).length)return
    discover(doc.body)
    observer=new win.MutationObserver(changes=>{
      let removed=false
      for(const change of changes){
        if(change.target.closest?.('.dcb-running-art'))continue
        const target=change.target
        if(change.type==='attributes'&&(change.attributeName==='data-chat-running'||target.matches(`${native('running')},${native('runningContent')},${native('runningIcon')}`)))discover(target)
        const content=target.nodeType===1?target.closest?.('[data-dcb-running-content]'):target.parentElement?.closest?.('[data-dcb-running-content]')
        if(content)for(const record of records.values())if(record.content===content)applyLabel(record)
        for(const node of change.addedNodes)discover(node);if(change.removedNodes.length)removed=true
      }
      if(removed||changes.some(change=>change.type==='attributes'))for(const record of [...records.values()])if(!eligible(record.host))remove(record)
    });observer.observe(doc.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-shimmer-text','data-chat-running','class']})
  }
  function configure(value){
    options=normalizeRunningAnimation(value);const pack=selectedPack(),next=JSON.stringify([options.runningAnimationEnabled,pack?.id,options.runningAnimationActions,options.runningAnimationRandom])
    if(next!==signature){signature=next;observer?.disconnect();observer=null;for(const record of [...records.values()])remove(record);connect()}
    for(const record of records.values()){if(record.player)dimensions(record);refresh(record)}
  }
  const visibility=()=>{for(const record of [...records.values()])refresh(record)},unsubscribe=catalog.subscribe(()=>configure(options))
  doc.addEventListener('visibilitychange',visibility);quiet.addEventListener('change',visibility);configure(options);void catalog.load()
  return {setOptions:configure,status:()=>({records:records.size,playing:[...records.values()].filter(record=>record.player&&record.visible&&!doc.hidden&&!quiet.matches).length}),dispose(){disposed=true;unsubscribe();observer?.disconnect();intersection.disconnect();doc.removeEventListener('visibilitychange',visibility);quiet.removeEventListener('change',visibility);for(const record of [...records.values()])remove(record)}}
}
