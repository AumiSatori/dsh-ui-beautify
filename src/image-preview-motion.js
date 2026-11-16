const MOVING='data-dcb-image-preview-moving'
const GHOST='data-dcb-image-preview-ghost'
const nativeSelector='[role="dialog"][aria-modal="true"]',memeSelector='[data-meme-zoom]'
const subscriptionSelector='dialog.dcsiv-root,dialog.dcsLightbox'
const previewSelector=`${nativeSelector},${memeSelector},${subscriptionSelector}`
const ease='cubic-bezier(.22,.8,.26,1)'
const folded={opacity:0,scale:'.9',translate:'0 14px',filter:'blur(3px)'}
const shown={opacity:1,scale:'1',translate:'0 0',filter:'blur(0px)'}

export const imagePreviewMotionCss=`
  [${MOVING}="image"] { will-change:opacity,scale,translate,filter; }
  [${MOVING}="backdrop"] { will-change:opacity; }
  [${GHOST}] { pointer-events:none!important; user-select:none!important; }
  [${GHOST}]::backdrop { pointer-events:none!important; }
`

// Native portals use the body boundary. Nested subscription viewers share the
// existing presentation observer, without adding a transcript subtree watcher
// or intercepting the viewer's opening, closing, zoom and annotation gestures.
export function createImagePreviewMotion(doc,win,{enabled=true}={}){
  const records=new Map(),ghosts=new Set(),quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let active=enabled,disposed=false
  const allowed=()=>active&&!disposed&&!doc.hidden&&!quiet.matches
  function identify(node){
    if(node.nodeType!==1||node.hasAttribute(GHOST))return null
    if(node.matches(memeSelector)){
      const image=node.querySelector('img[data-meme-zoom-img]')
      return image?{image,meme:true}:null
    }
    if(node.matches('dialog.dcsiv-root')){
      const surface=node.querySelector(':scope > .dcsiv-workspace .dcsiv-stage > .dcsiv-surface')
      if(surface&&node.querySelector(':scope > button.dcsiv-close-floating'))return {image:surface.querySelector(':scope > img.dcsiv-image'),meme:false}
      return null
    }
    if(node.matches('dialog.dcsLightbox')){
      const image=node.querySelector(':scope > img')
      return image&&node.querySelector(':scope > button')?{image,meme:false}:null
    }
    if(!node.matches(nativeSelector))return null
    // The native lightbox has a stage, backdrop mask, image and close button.
    // Require that structure so settings and other image-bearing dialogs pass.
    const stage=node.firstElementChild,image=stage?.querySelector(':scope > img[class*="_image_"]')
    if(!stage?.getAttribute('class')?.includes('_stage_')||!image||!stage.querySelector(':scope > [aria-hidden="true"][class*="_mask_"]')||!stage.querySelector(':scope > button'))return null
    return {image,meme:false}
  }
  const paint=image=>{const s=win.getComputedStyle(image);return{opacity:s.opacity,scale:s.scale==='none'?'1':s.scale,translate:s.translate==='none'?'0 0':s.translate,filter:s.filter}}
  function remember(record){
    if(!record.image?.complete||!record.image.naturalWidth)return
    const box=record.node.getBoundingClientRect();if(!box.width||!box.height)return
    const s=win.getComputedStyle(record.node),style={}
    for(const key of ['display','padding','borderRadius','borderWidth','borderStyle','borderColor','backgroundColor','backgroundImage','backdropFilter','boxShadow','color','overflow'])style[key]=s[key]
    record.layout={box:{left:box.left,top:box.top,width:box.width,height:box.height},style,opacity:s.opacity,image:paint(record.image)}
  }
  function snapshot(record){
    const layout=record.layout;if(!layout||!record.image?.complete||!record.image.naturalWidth)return null
    const source=[record.node,...record.node.querySelectorAll('*')]
    if(source.length>600)return null
    const copy=record.node.cloneNode(true),nodes=[copy,...copy.querySelectorAll('*')],image=nodes[source.indexOf(record.image)]
    if(!image)return null
    for(let i=0;i<source.length;i++){
      nodes[i].scrollTop=source[i].scrollTop;nodes[i].scrollLeft=source[i].scrollLeft
      if(source[i].localName==='canvas'&&source[i].width*source[i].height<=4e6)try{nodes[i].getContext('2d')?.drawImage(source[i],0,0)}catch{}
    }
    return{copy,image,layout,source:record.source}
  }
  function endGhost(record){
    if(!ghosts.delete(record))return
    for(const animation of record.animations)animation.cancel()
    record.node.remove()
  }
  function leave(record){
    const copy=allowed()&&record.visible?(record.snapshot||snapshot(record)):null
    record.visible=false;record.snapshot=null;stop(record)
    if(!copy)return
    for(const previous of [...ghosts])endGhost(previous)
    let node=copy.copy
    // HTML dialogs cannot be kept open without delaying native focus recovery.
    // A manual, inert popover paints above remaining dialogs without blocking
    // interaction or changing the native modal stack.
    if(node.localName==='dialog'){
      const div=doc.createElement('div');for(const attribute of node.attributes)div.setAttribute(attribute.name,attribute.value)
      div.append(...node.childNodes);node=div
    }
    for(const el of [node,...node.querySelectorAll('*')]){
      for(const name of ['id','role','aria-label','aria-labelledby','aria-describedby','aria-controls','aria-modal','tabindex','autofocus','data-meme-zoom','data-meme-zoom-img','data-context-menu-trigger',MOVING])el.removeAttribute(name)
      for(const attribute of [...el.attributes])if(attribute.name.startsWith('on'))el.removeAttribute(attribute.name)
    }
    node.setAttribute(GHOST,'');node.setAttribute('aria-hidden','true');node.inert=true
    const {box,style,opacity,image:from}=copy.layout
    Object.assign(node.style,style,{position:'fixed',inset:'auto',left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px',boxSizing:'border-box',minWidth:'0',minHeight:'0',maxWidth:'none',maxHeight:'none',margin:'0',visibility:'visible',zIndex:'2147483647'})
    node.setAttribute(MOVING,'backdrop');copy.image.setAttribute(MOVING,'image')
    const ghost={node,image:copy.image,source:copy.source,animations:[]};ghosts.add(ghost)
    if(typeof node.showPopover==='function')node.setAttribute('popover','manual')
    doc.body.append(node)
    try{node.showPopover?.()}catch{node.removeAttribute('popover')}
    try{
      const options={duration:220,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'}
      ghost.animations.push(node.animate([{opacity},{opacity:0}],{...options,id:'dcb-image-preview-exit-backdrop'}))
      if(node.hasAttribute('popover'))try{ghost.animations.push(node.animate([{opacity},{opacity:0}],{...options,pseudoElement:'::backdrop',id:'dcb-image-preview-exit-shade'}))}catch{}
      const animation=copy.image.animate([from,folded],{...options,id:'dcb-image-preview-exit'})
      ghost.animations.push(animation)
      animation.finished.then(()=>endGhost(ghost),()=>{})
    }catch{endGhost(ghost)}
  }
  function stop(record){
    for(const animation of record.animations)animation.cancel()
    record.animations=[]
    record.pending=false;win.cancelAnimationFrame(record.frame);record.frame=0
    record.node.removeAttribute(MOVING);record.image?.removeAttribute(MOVING)
  }
  function enter(record){
    stop(record)
    if(!allowed()||typeof record.image.animate!=='function')return
    const previous=[...ghosts].find(ghost=>ghost.source===record.source)
    const from=previous?paint(previous.image):folded,opacity=previous?win.getComputedStyle(previous.node).opacity:0
    for(const ghost of [...ghosts])endGhost(ghost)
    record.snapshot=null;remember(record)
    record.node.setAttribute(MOVING,'backdrop');record.image.setAttribute(MOVING,'image')
    try{
      // Individual transform properties compose with the meme viewer's wheel
      // transform rather than freezing or resetting its current zoom value.
      const backdrop=record.node.animate([{opacity},{opacity:1}],{id:'dcb-image-preview-backdrop',duration:240,easing:ease})
      record.animations.push(backdrop)
      const image=record.image.animate([from,shown],{id:'dcb-image-preview-enter',duration:280,easing:ease})
      record.animations.push(image)
      image.finished.then(()=>{if(record.animations.includes(image)){stop(record);record.snapshot=null;remember(record)}},()=>{})
    }catch{stop(record)}
  }
  function sync(record,animate=true){
    const visible=record.node.isConnected&&!record.node.hidden&&(record.node.localName!=='dialog'||record.node.open)&&win.getComputedStyle(record.node).display!=='none'&&win.getComputedStyle(record.node).visibility!=='hidden'
    const source=record.image?.getAttribute('src')||''
    if(visible&&(!record.visible||source!==record.source))record.pending=animate&&allowed()&&!!source
    if(!visible){if(record.visible)leave(record);else stop(record)}
    record.visible=visible;record.source=source
    // A viewer can mount before the image arrives. Spend the entry animation
    // on the decoded picture, after its native load handler measures the fit.
    if(record.pending&&record.image?.complete&&record.image.naturalWidth>0)enter(record)
    else if(visible&&!record.animations.length)remember(record)
  }
  function unwatch(record){
    record.observer.disconnect()
    record.image?.removeEventListener('load',record.loaded);record.image?.removeEventListener('error',record.failed)
  }
  function watch(record){
    record.observer.observe(record.node,{attributes:true,attributeFilter:['style','hidden','class','open']})
    if(record.image){
      record.observer.observe(record.image,{attributes:true,attributeFilter:['src']})
      record.image.addEventListener('load',record.loaded);record.image.addEventListener('error',record.failed)
    }
  }
  function attach(node,animate=true){
    const found=identify(node);if(!found)return
    let record=records.get(node)
    if(record){
      if(record.image!==found.image){
        stop(record);unwatch(record);record.image=found.image;record.visible=false;record.source='';record.layout=null;record.snapshot=null;watch(record)
      }
      sync(record,animate);return
    }
    record={node,...found,animations:[],visible:false,source:'',pending:false,frame:0}
    records.set(node,record)
    record.observer=new win.MutationObserver(()=>sync(record))
    record.loaded=()=>{if(record.pending&&!record.frame)record.frame=win.requestAnimationFrame(()=>{record.frame=0;sync(record)})}
    record.failed=()=>stop(record)
    watch(record)
    sync(record,animate)
  }
  function attachTree(node,animate=true){
    if(node.nodeType!==1)return
    attach(node,animate)
    for(const child of node.querySelectorAll(previewSelector))attach(child,animate)
  }
  function detach(record){leave(record);unwatch(record);records.delete(record.node)}
  function receive(changes){
    if(disposed)return
    for(const record of records.values())if(!record.node.isConnected)detach(record)
    for(const change of changes){
      if(change.type!=='childList')continue
      const target=change.target.nodeType===1?change.target:null,owner=target?.closest(previewSelector)
      if(owner)attach(owner)
      const chat=target?.closest('[data-chat-flow],[data-composer-seat]')
      for(const node of change.addedNodes)if(node.isConnected&&node.nodeType===1){
        if(chat)attach(node)
        else attachTree(node)
      }
    }
  }
  const observer=new win.MutationObserver(receive)
  const settle=()=>{for(const record of records.values()){stop(record);record.snapshot=null}for(const ghost of [...ghosts])endGhost(ghost)}
  const accessibility=()=>{if(!allowed())settle()}
  const capture=event=>{
    if(!allowed())return
    if(event.type==='keydown'&&event.key!=='Escape')return
    for(const record of records.values())if(record.visible&&record.node.isConnected){remember(record);record.snapshot=snapshot(record)}
  }
  attachTree(doc.body,false)
  observer.observe(doc.body,{childList:true})
  quiet.addEventListener('change',accessibility);doc.addEventListener('visibilitychange',accessibility)
  doc.addEventListener('pointerdown',capture,true);doc.addEventListener('click',capture,true);win.addEventListener('keydown',capture,true)
  return{
    observeMutations:receive,
    sync(value){active=value===true;if(!active)settle()},
    dispose(){disposed=true;observer.disconnect();settle();for(const record of records.values())detach(record);quiet.removeEventListener('change',accessibility);doc.removeEventListener('visibilitychange',accessibility);doc.removeEventListener('pointerdown',capture,true);doc.removeEventListener('click',capture,true);win.removeEventListener('keydown',capture,true)},
  }
}
