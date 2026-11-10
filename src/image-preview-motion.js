const MOVING='data-dcb-image-preview-moving'
const nativeSelector='[role="dialog"][aria-modal="true"]',memeSelector='[data-meme-zoom]'
const ease='cubic-bezier(.22,.8,.26,1)'

export const imagePreviewMotionCss=`
  [${MOVING}="image"] { will-change:opacity,scale,translate,filter; }
  [${MOVING}="backdrop"] { will-change:opacity; }
`

// Observe portal boundaries and the two preview nodes only. Do not scan chat
// mutations or intercept the host/plugin's opening, closing and zoom gestures.
export function createImagePreviewMotion(doc,win,{enabled=true}={}){
  const records=new Map(),quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let active=enabled,disposed=false
  const allowed=()=>active&&!disposed&&!doc.hidden&&!quiet.matches
  function identify(node){
    if(node.nodeType!==1)return null
    if(node.matches(memeSelector)){
      const image=node.querySelector('img[data-meme-zoom-img]')
      return image?{image,meme:true}:null
    }
    if(!node.matches(nativeSelector))return null
    // The native lightbox has a stage, backdrop mask, image and close button.
    // Require that structure so settings and other image-bearing dialogs pass.
    const stage=node.firstElementChild,image=stage?.querySelector(':scope > img[class*="_image_"]')
    if(!stage?.getAttribute('class')?.includes('_stage_')||!image||!stage.querySelector(':scope > [aria-hidden="true"][class*="_mask_"]')||!stage.querySelector(':scope > button'))return null
    return {image,meme:false}
  }
  function stop(record){
    for(const animation of record.animations)animation.cancel()
    record.animations=[]
    record.node.removeAttribute(MOVING);record.image.removeAttribute(MOVING)
  }
  function enter(record){
    stop(record)
    if(!allowed()||typeof record.image.animate!=='function')return
    record.node.setAttribute(MOVING,'backdrop');record.image.setAttribute(MOVING,'image')
    try{
      // Individual transform properties compose with the meme viewer's wheel
      // transform rather than freezing or resetting its current zoom value.
      const backdrop=record.node.animate([{opacity:0},{opacity:1}],{id:'dcb-image-preview-backdrop',duration:240,easing:ease})
      record.animations.push(backdrop)
      const image=record.image.animate([
        {opacity:0,scale:'.9',translate:'0 14px',filter:'blur(3px)'},
        {opacity:1,scale:'1',translate:'0 0',filter:'blur(0px)'},
      ],{id:'dcb-image-preview-enter',duration:280,easing:ease})
      record.animations.push(image)
      image.finished.then(()=>{if(record.animations.includes(image))stop(record)},()=>{})
    }catch{stop(record)}
  }
  function sync(record,animate=true){
    const visible=record.node.isConnected&&!record.node.hidden&&win.getComputedStyle(record.node).display!=='none'&&win.getComputedStyle(record.node).visibility!=='hidden'
    const source=record.image.getAttribute('src')||''
    if(visible&&source&&animate&&(!record.visible||source!==record.source))enter(record)
    if(!visible)stop(record)
    record.visible=visible;record.source=source
  }
  function attach(node,animate=true){
    if(records.has(node))return
    const found=identify(node);if(!found)return
    const record={node,...found,animations:[],visible:false,source:''}
    records.set(node,record)
    record.observer=new win.MutationObserver(()=>sync(record))
    record.observer.observe(node,{attributes:true,attributeFilter:['style','hidden','class']})
    record.observer.observe(record.image,{attributes:true,attributeFilter:['src']})
    sync(record,animate)
  }
  function attachTree(node,animate=true){
    if(node.nodeType!==1)return
    attach(node,animate)
    for(const child of node.querySelectorAll(`${nativeSelector},${memeSelector}`))attach(child,animate)
  }
  function detach(record){stop(record);record.observer.disconnect();records.delete(record.node)}
  const observer=new win.MutationObserver(changes=>{
    for(const record of records.values())if(!record.node.isConnected)detach(record)
    for(const change of changes)for(const node of change.addedNodes)if(node.isConnected)attachTree(node)
  })
  const settle=()=>{for(const record of records.values())stop(record)}
  const accessibility=()=>{if(!allowed())settle()}
  attachTree(doc.body,false)
  observer.observe(doc.body,{childList:true})
  quiet.addEventListener('change',accessibility);doc.addEventListener('visibilitychange',accessibility)
  return{
    sync(value){active=value===true;if(!active)settle()},
    dispose(){disposed=true;observer.disconnect();for(const record of records.values())detach(record);quiet.removeEventListener('change',accessibility);doc.removeEventListener('visibilitychange',accessibility)},
  }
}
