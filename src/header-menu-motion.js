const MARK='data-dcb-header-menu',MOVING='data-dcb-header-menu-moving',GHOST='data-dcb-header-menu-ghost'
const resting={opacity:1,transform:'none',filter:'blur(0px)'},folded={opacity:0,transform:'translateY(-8px) scale(.96)',filter:'blur(3px)'}
const enterEase='cubic-bezier(.22,.8,.26,1)',exitEase='cubic-bezier(.4,0,.2,1)'
const catalogModules={subagent:'@deepseek-ai/dsh-client-ui-subagent/SubagentHeaderLineage.module.css',jobs:'@deepseek-ai/dsh-client-ui-jobs/JobListAction.module.css'}

export const headerMenuMotionCss=`
  [${MARK}],[${GHOST}] { transform-origin:50% 0; }
  [${MOVING}] { will-change:opacity,transform,filter; }
  [${GHOST}] { pointer-events:none!important; user-select:none!important; }
`

// Portals use the body boundary; inline menus use a short-lived observation of
// the triggering header. Never observe the transcript subtree for menu motion.
export function createHeaderMenuMotion(doc,win,{enabled=true}={}){
  const records=new Map(),ghosts=new Map(),headers=new Set(),quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let active=enabled,disposed=false,gesture=null,serial=0
  const allowed=()=>active&&!disposed&&!doc.hidden&&!quiet.matches
  const visual=node=>{const s=win.getComputedStyle(node);return{opacity:s.opacity,transform:s.transform,filter:s.filter}}
  function moduleClass(module,name){
    const css=doc.querySelector(`style[data-plugin-css="${module}"]`)?.textContent||''
    return css.match(new RegExp('\\.([\\w-]+_'+name+')(?=[\\s{.,:#>+~\\[])'))?.[1]
  }
  function triggerKind(node){
    if(!node?.closest)return null
    const button=node.closest('button')
    if(!button?.closest('header'))return null
    for(const [kind,module]of Object.entries(catalogModules)){
      const name=moduleClass(module,'trigger')
      if(name&&button.classList.contains(name))return {kind,button}
    }
    if(button.getAttribute('aria-haspopup')!=='menu')return null
    const seat=button.closest('[data-dcb-toolbar-item]'),marked=seat?.getAttribute('data-dcb-toolbar-item')
    if(marked==='folder'||marked==='more')return {kind:marked,button}
    const folderClass=moduleClass('@deepseek-ai/dsh-client-ui-open-in-app/OpenTargetButton.module.css','chevron')
    const moreClass=moduleClass('@deepseek-ai/dsh-client-ui-conversation/ConversationRoot.module.css','viewsMore')
    const actionsClass=moduleClass('@deepseek-ai/dsh-session-log-export/HeaderAction.module.css','moreButton')
    if(folderClass&&button.classList.contains(folderClass)&&button.closest('[data-open-target="directory"]'))return {kind:'folder',button}
    if(moreClass&&button.classList.contains(moreClass))return {kind:'more',button}
    if(actionsClass&&button.classList.contains(actionsClass))return {kind:'more',button}
    return null
  }
  function identify(node){
    if(node.nodeType!==1||node.hasAttribute(GHOST))return null
    for(const [kind,module]of Object.entries(catalogModules)){
      const name=moduleClass(module,'menu')
      if(name&&node.classList.contains(name))return kind
    }
    if(node.getAttribute('role')!=='menu'||!node.hasAttribute('data-menu-material'))return null
    const moreClass=moduleClass('@deepseek-ai/dsh-client-ui-conversation/ConversationRoot.module.css','viewsMoreMenu')
    if(moreClass&&node.classList.contains(moreClass))return 'more'
    if(node.closest('header')){
      const button=node.parentElement?.querySelector('button[aria-haspopup="menu"]')
      return button&&!node.contains(button)?triggerKind(button)?.kind:null
    }
    // Directory menus have no dedicated list class. Associate only the portal
    // created by the actual header chevron gesture, never every open Menu.
    if(gesture?.button.isConnected&&gesture.button.getAttribute('aria-expanded')==='true')return gesture.kind
    return null
  }
  function syncHeaders(){
    const wanted=new Set([...records.values()].map(record=>record.header).filter(header=>header?.isConnected))
    const pending=gesture?.button.closest('header');if(pending?.isConnected)wanted.add(pending)
    if(wanted.size===headers.size&&[...wanted].every(header=>headers.has(header)))return
    headerObserver.disconnect();headers.clear()
    for(const header of wanted){headers.add(header);headerObserver.observe(header,{childList:true,subtree:true})}
  }
  function layoutBox(node,style=win.getComputedStyle(node)){
    const rect=node.getBoundingClientRect(),matrix=new win.DOMMatrixReadOnly(style.transform==='none'?undefined:style.transform)
    const [x,y]=style.transformOrigin.split(' ').map(parseFloat)
    return{left:rect.left-matrix.e-(1-matrix.a)*x,top:rect.top-matrix.f-(1-matrix.d)*y,width:rect.width/Math.abs(matrix.a||1),height:rect.height/Math.abs(matrix.d||1)}
  }
  const backingFor=node=>{
    const anchor=node.style.getPropertyValue('--dsh-menu-anchor')
    return anchor?[...doc.body.children].find(el=>el.hasAttribute('data-menu-backing')&&el.style.getPropertyValue('--dsh-menu-anchor')===anchor):null
  }
  function cancelEntry(record){
    record.animation?.cancel();record.animation=null;record.backingAnimation?.cancel();record.backingAnimation=null
    record.node.removeAttribute(MOVING)
  }
  function endGhost(record){
    if(ghosts.get(record.kind)===record)ghosts.delete(record.kind)
    record.animation?.cancel();record.backingAnimation?.cancel();record.node.remove();record.backing?.remove()
  }
  function enter(record){
    const node=record.node,s=win.getComputedStyle(node)
    if(!node.isConnected||s.visibility==='hidden'||s.display==='none')return
    record.box=layoutBox(node,s)
    record.backing=backingFor(node)
    if(record.placed)return
    record.placed=true
    if(!allowed()||typeof node.animate!=='function')return
    const previous=ghosts.get(record.kind),from=previous?visual(previous.node):folded
    if(previous)endGhost(previous)
    node.setAttribute(MOVING,'')
    try{
      const animation=node.animate([from,resting],{id:'dcb-header-menu-enter',duration:240,easing:enterEase,fill:'both'})
      record.animation=animation
      if(record.backing)record.backingAnimation=record.backing.animate([{opacity:from.opacity},{opacity:1}],{duration:240,easing:enterEase,fill:'both'})
      animation.finished.then(()=>{if(record.animation===animation){record.snapshot=null;cancelEntry(record)}},()=>{})
    }catch{cancelEntry(record)}
  }
  function attach(node,animate=true){
    if(records.has(node))return
    const kind=identify(node);if(!kind)return
    if(gesture?.kind===kind)gesture=null
    const record={node,kind,header:node.closest('header'),placed:!animate,animation:null,backingAnimation:null,box:null,snapshot:null,backing:null}
    records.set(node,record);node.setAttribute(MARK,kind)
    record.observer=new win.MutationObserver(()=>enter(record));record.observer.observe(node,{attributes:true,attributeFilter:['style']})
    enter(record)
    syncHeaders()
  }
  function remove(record){
    records.delete(record.node);record.observer.disconnect()
    if(gesture?.kind===record.kind&&gesture.button.getAttribute('aria-expanded')!=='true')gesture=null
    // A removal callback runs after disconnection, where computed style loses
    // its stylesheet. Input capture retains the current in-flight visual frame.
    const from=record.snapshot||resting,box=record.box
    const visible=record.placed&&box?.width&&Number.isFinite(box.left)&&Number.isFinite(box.top)
    const previous=ghosts.get(record.kind);if(previous)endGhost(previous)
    const ghost=allowed()&&visible&&record.node.querySelectorAll('*').length<=400?record.node.cloneNode(true):null
    const backing=ghost&&record.backing?.cloneNode(true)
    cancelEntry(record);record.node.removeAttribute(MARK)
    if(!ghost)return
    for(const el of [ghost,...ghost.querySelectorAll('[id],[role],[aria-label],[aria-labelledby],[aria-describedby],[tabindex]')]){
      for(const name of ['id','role','aria-label','aria-labelledby','aria-describedby','tabindex',MARK,MOVING])el.removeAttribute(name)
    }
    ghost.setAttribute(GHOST,record.kind);ghost.setAttribute('aria-hidden','true');ghost.setAttribute('inert','')
    const anchor=`--dcb-header-menu-exit-${++serial}`
    Object.assign(ghost.style,{position:'fixed',left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px',minWidth:'0',maxWidth:'none',margin:'0',visibility:'visible',...from})
    ghost.style.setProperty('--dsh-menu-anchor',anchor)
    doc.body.append(ghost)
    const sourceNodes=[record.node,...record.node.querySelectorAll('*')],copyNodes=[ghost,...ghost.querySelectorAll('*')]
    for(let i=0;i<sourceNodes.length;i++){copyNodes[i].scrollTop=sourceNodes[i].scrollTop;copyNodes[i].scrollLeft=sourceNodes[i].scrollLeft}
    if(backing){backing.style.setProperty('--dsh-menu-anchor',anchor);backing.setAttribute('inert','');backing.setAttribute('aria-hidden','true');backing.style.pointerEvents='none';backing.style.opacity=String(from.opacity);doc.body.append(backing)}
    const exiting={node:ghost,kind:record.kind,backing,animation:null,backingAnimation:null};ghosts.set(record.kind,exiting)
    try{
      exiting.animation=ghost.animate([from,folded],{id:'dcb-header-menu-exit',duration:200,easing:exitEase,fill:'both'})
      if(backing)exiting.backingAnimation=backing.animate([{opacity:from.opacity},{opacity:0}],{duration:200,easing:exitEase,fill:'both'})
      exiting.animation.finished.then(()=>endGhost(exiting),()=>{})
    }catch{endGhost(exiting)}
  }
  function capture(event){
    if(event.type==='keydown'&&!['Escape','Enter',' ','Tab'].includes(event.key))return
    // Capture before the native React handler disposes its portal.
    for(const record of records.values())if(record.node.isConnected&&record.placed){record.snapshot=visual(record.node);record.box=layoutBox(record.node)}
    const activating=event.type!=='keydown'||event.key==='Enter'||event.key===' '
    const target=activating&&!(event.type==='pointerdown'&&event.button!==0)?triggerKind(event.target):null
    gesture=target
    syncHeaders()
    // The native catalog pins an open dropdown on every click. Route a second
    // activation through its own Escape handler so its state, timers and focus
    // settle together, including clicks generated by Enter or Space.
    if(active&&event.type==='click'&&target?.kind==='subagent'&&target.button.getAttribute('aria-expanded')==='true'){
      event.preventDefault();event.stopPropagation()
      target.button.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))
    }
  }
  function attachTree(node,animate=true){
    if(node.nodeType!==1)return
    attach(node,animate)
    const catalogs=Object.values(catalogModules).map(module=>moduleClass(module,'menu')).filter(Boolean).map(name=>'.'+name)
    for(const menu of node.querySelectorAll(['[role="menu"][data-menu-material]',...catalogs].join(',')))attach(menu,animate)
  }
  function changesReceived(changes){
    for(const record of [...records.values()])if(!record.node.isConnected)remove(record)
    for(const change of changes)for(const node of change.addedNodes)if(node.isConnected)attachTree(node)
    syncHeaders()
  }
  const observer=new win.MutationObserver(changesReceived),headerObserver=new win.MutationObserver(changesReceived)
  function settle(){for(const record of records.values()){cancelEntry(record);record.snapshot=null}for(const record of [...ghosts.values()])endGhost(record)}
  const accessibility=()=>{if(!allowed())settle()}
  attachTree(doc.body,false)
  observer.observe(doc.body,{childList:true})
  for(const type of ['pointerdown','click','keydown'])doc.addEventListener(type,capture,true)
  quiet.addEventListener('change',accessibility);doc.addEventListener('visibilitychange',accessibility)
  return{
    sync(value){active=value===true;if(!active)settle()},
    dispose(){disposed=true;observer.disconnect();headerObserver.disconnect();headers.clear();settle();for(const record of records.values()){record.observer.disconnect();record.node.removeAttribute(MARK)}records.clear();gesture=null;for(const type of ['pointerdown','click','keydown'])doc.removeEventListener(type,capture,true);quiet.removeEventListener('change',accessibility);doc.removeEventListener('visibilitychange',accessibility)},
  }
}
