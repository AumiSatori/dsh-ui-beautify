// The host normally writes its fitted image dimensions inline. A durable
// attachment can arrive without those dimensions: its NaN inline size is then
// discarded by the browser, leaving only a 44px loading button. Reserve the
// host's own 240px unknown-image box before decoding; valid inline sizes win.
// Scope this to user-message attachment frames, never editor thumbnails,
// markdown illustrations, image viewers, tool outputs or other buttons.
const FRAME='[data-message-attachments] button[data-variant]:is([class$="_frame"],[class*="_frame "])'
const CODEX='[data-message-attachments] .codexMessageImages'
const SINGLE=`${CODEX}[data-single="true"]>.codexImageThumb`
const FIT='data-dcb-image-fit',BOX=240
export const messageImageLayoutCss=`
 ${FRAME}[data-variant="single"] { width:240px; height:240px; max-width:100%; max-height:240px; }
 ${FRAME}>img,${CODEX}>.codexImageThumb>img { min-width:0; min-height:0; max-width:100%; max-height:100%; }
 ${SINGLE} { width:240px; height:240px; max-width:100%; max-height:240px; }
 ${SINGLE}>img { width:100%; height:100%; object-fit:contain; }
 ${SINGLE}[${FIT}] { width:var(--dcb-image-width); height:auto; min-height:0; max-height:none; aspect-ratio:var(--dcb-image-ratio); }
 ${SINGLE}:has(>img) { border-color:transparent; background:transparent; }
 @media(forced-colors:active) { ${SINGLE}:has(>img) { border-color:CanvasText; } }
`
// The subscription adapter supplies no dimensions to its DOM, even when the
// attachment metadata is complete. Keep its single-image box identical across
// preview, authenticated loading, retry and decoded states. Contain the whole
// image inside it; do not crop portraits or interfere with its preview action.
//
// The fixed square left empty bands around landscape and portrait images. The
// adapter's own React props still carry the metadata size, so the box takes the
// image's shape in the same task the host commits it, before any paint, and
// keeps it through loading, retry and the preview-to-attachment handoff. Only
// an image without metadata falls back to the transparent square reservation.
function metadataSize(button){
  const key=Object.keys(button).find(name=>name.startsWith('__reactFiber$'))
  for(let fiber=key&&button[key],depth=0;fiber&&depth<4;fiber=fiber.return,depth++){
    const image=fiber.memoizedProps?.image
    if(!image||typeof image!=='object')continue
    for(const item of [image.attachment,image.preview]){
      const width=Number(item?.width),height=Number(item?.height)
      if(width>0&&height>0&&Number.isFinite(width/height))return[width,height]
    }
    return null
  }
  return null
}

export function createMessageImageLayout(doc,win){
  const fitted=new Set()
  function fit(button){
    const size=metadataSize(button)
    if(!size){release(button);return}
    const ratio=size[0]/size[1],width=Math.round(ratio>=1?BOX:BOX*ratio)
    const value=`${size[0]} / ${size[1]}`
    if(button.style.getPropertyValue('--dcb-image-ratio')!==value)button.style.setProperty('--dcb-image-ratio',value)
    if(button.style.getPropertyValue('--dcb-image-width')!==width+'px')button.style.setProperty('--dcb-image-width',width+'px')
    if(!button.hasAttribute(FIT))button.setAttribute(FIT,'')
    fitted.add(button)
  }
  function release(button){
    if(!fitted.delete(button))return
    button.removeAttribute(FIT);button.style.removeProperty('--dcb-image-ratio');button.style.removeProperty('--dcb-image-width')
  }
  function scan(node){
    if(node.nodeType!==1)return
    if(node.matches(SINGLE))fit(node)
    else if(node.firstElementChild)for(const button of node.querySelectorAll(SINGLE))fit(button)
  }
  // React commits the adapter's thumbnail and this observer runs in the same
  // task's microtask checkpoint, so the first painted frame already has its
  // final shape. Streaming text adds no element nodes and costs one check.
  const observer=new win.MutationObserver(records=>{
    for(const button of fitted)if(!button.isConnected)fitted.delete(button)
    for(const record of records){
      if(record.type==='attributes'){
        const target=record.target
        if(target.matches('.codexMessageImages'))for(const button of target.children)button.matches(SINGLE)?fit(button):release(button)
        continue
      }
      for(const node of record.addedNodes)scan(node)
    }
  })
  observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-single']})
  scan(doc.body)
  return {
    dispose(){observer.disconnect();for(const button of [...fitted])release(button)},
  }
}
