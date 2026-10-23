const LOCK='data-dcb-sidebar-layout-lock'
const CENTER=':is([class$="_centerCol"],[class*="_centerCol "])'
const TEXT_WIDTH='--dsh-chat-content-width'
const COLUMN_WIDTH='--dsh-conversation-column-width'
const pixels=value=>/^\d+(?:\.\d+)?px$/.test(value)&&parseFloat(value)>0

// Keep the host's column, header and input within the live grid at every frame.
// Only hold the native text-width variable while the sidebar moves: forcing
// width/min-width/max-width on ConversationRoot can overflow the real column.
export function createSidebarLayout(doc,win){
  const records=new Map()
  const signature=frame=>['style','class','data-sidebar-collapsed'].map(name=>frame.getAttribute(name)).join('\n')
  function finalTextWidth(frame,record){
    // Let CSS solve the host's target grid (including minmax/rightbar/gaps),
    // independently of the in-flight interpolation. Clone only empty structural
    // seats and the short center-to-root chain; never read/copy history nodes.
    const shell=frame.cloneNode(false),center=record.center
    shell.removeAttribute('id');shell.setAttribute('aria-hidden','true');shell.inert=true
    shell.setAttribute('data-dcb-sidebar-layout-probe','')
    for(const [name,value]of Object.entries({position:'fixed',left:'-100000px',top:'0',width:win.getComputedStyle(frame).width,height:'0',minHeight:'0',maxHeight:'none',margin:'0',visibility:'hidden',pointerEvents:'none',contain:'layout style paint',transition:'none',animation:'none'})){
      shell.style.setProperty(name.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value,'important')
    }
    let seat=null
    for(const child of frame.children){
      const copy=child.cloneNode(false);copy.removeAttribute('id');shell.append(copy)
      if(child===center)seat=copy
    }
    if(!seat)return null
    const path=[]
    for(let el=record.body;el&&el!==center;el=el.parentElement)path.unshift(el)
    for(const el of path){const copy=el.cloneNode(false);copy.removeAttribute('id');seat.append(copy);seat=copy}
    seat.removeAttribute(LOCK)
    if(record.original)seat.style.setProperty(TEXT_WIDTH,record.original,record.priority)
    else seat.style.removeProperty(TEXT_WIDTH)
    try{
      frame.parentElement.append(shell)
      const width=win.getComputedStyle(seat).width
      if(!pixels(width))return null
      seat.style.setProperty(COLUMN_WIDTH,width)
      return win.getComputedStyle(seat).getPropertyValue(TEXT_WIDTH).trim()||null
    }finally{shell.remove()}
  }
  function release(frame){
    const record=records.get(frame)
    if(!record)return
    records.delete(frame);win.clearTimeout(record.timer)
    if(record.body.style.getPropertyValue(TEXT_WIDTH)===record.width&&record.body.style.getPropertyPriority(TEXT_WIDTH)==='important'){
      if(record.original)record.body.style.setProperty(TEXT_WIDTH,record.original,record.priority)
      else record.body.style.removeProperty(TEXT_WIDTH)
    }
    if(record.mark===null)record.root.removeAttribute(LOCK)
    else record.root.setAttribute(LOCK,record.mark)
  }
  function hold(frame,{prepare=false}={}){
    if(frame.matches('[data-dcb-sidebar-overlay], [data-dragging], [data-dcb-sidebar-resizing], [data-rightbar-instant], [data-rightbar-fullscreen]')){release(frame);return false}
    let record=records.get(frame)
    if(record&&(!record.root.isConnected||!record.body.isConnected||!frame.contains(record.root))){release(frame);record=null}
    if(!record){
      const center=[...frame.children].find(el=>el.matches(CENTER))
      const body=center?.querySelector('[data-conversation-content]'),root=body?.closest('[data-phase]')
      if(!root||!center.contains(root)||!root.getClientRects().length)return false
      const width=win.getComputedStyle(body).getPropertyValue(TEXT_WIDTH).trim()
      if(!width)return false
      record={root,body,center,width,mark:root.getAttribute(LOCK),original:body.style.getPropertyValue(TEXT_WIDTH),priority:body.style.getPropertyPriority(TEXT_WIDTH)}
      records.set(frame,record)
      body.style.setProperty(TEXT_WIDTH,width,'important')
      root.setAttribute(LOCK,'')
    }
    if(!prepare&&record.signature!==signature(frame)){
      const width=finalTextWidth(frame,record)
      if(!width){release(frame);return false}
      record.width=width;record.signature=signature(frame)
      record.body.style.setProperty(TEXT_WIDTH,width,'important')
    }
    // A canceled/blocked click must not leave the conversation frozen.
    win.clearTimeout(record.timer);record.timer=win.setTimeout(()=>release(frame),1000)
    return true
  }
  const interaction=event=>{
    for(const [frame,record]of records)if(record.root.contains(event.target))release(frame)
  }
  doc.addEventListener('pointerdown',interaction,true)
  doc.addEventListener('keydown',interaction,true)
  doc.addEventListener('wheel',interaction,{capture:true,passive:true})
  return {hold,release,dispose(){
    doc.removeEventListener('pointerdown',interaction,true)
    doc.removeEventListener('keydown',interaction,true)
    doc.removeEventListener('wheel',interaction,true)
    for(const frame of records.keys())release(frame)
  }}
}
