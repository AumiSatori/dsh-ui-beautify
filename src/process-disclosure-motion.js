import {motion} from './motion.js'

const GROUP='[data-step-process]',BODY='[data-step-process-body]',CONTENT='[data-step-process-content]',GHOST='data-dcb-process-ghost',MARK='data-dcb-process-motion'

// The host owns the body, its hidden state and scrolling. Only decorate a
// deliberate header click; preserve the real subtree and host scroll policy.
export function createProcessDisclosureMotion(doc,win,initiallyEnabled=true){
  const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  const pending=new Map(),active=new Map();let enabled=initiallyEnabled,disposed=false,frame=0
  const session=node=>node.closest('[data-conversation-session]')?.getAttribute('data-conversation-session')||''
  const tooLarge=box=>box.height>win.innerHeight*1.5||box.height*box.width*(win.devicePixelRatio||1)**2>4_000_000
  const set=(node,name,value,priority)=>value?node.style.setProperty(name,value,priority):node.style.removeProperty(name)
  function stop(record){
    if(active.get(record.root)!==record)return
    active.delete(record.root);record.resize?.disconnect();for(const a of record.effects)a.cancel();record.ghost?.remove()
    for(const [name,value,priority] of record.styles)set(record.root,name,value,priority)
    if(record.styleMark===null&&!record.root.style.length)record.root.removeAttribute('style')
    record.mark===null?record.root.removeAttribute(MARK):record.root.setAttribute(MARK,record.mark)
  }
  function clear(){for(const record of [...active.values()])stop(record);pending.clear();if(frame)win.cancelAnimationFrame(frame);frame=0}
  function cloneBody(body,rootBox){
    const walker=doc.createTreeWalker(body,win.NodeFilter.SHOW_ELEMENT|win.NodeFilter.SHOW_TEXT);let count=0,chars=0
    do{const node=walker.currentNode;if(++count>300||node.nodeType===1&&node.matches('iframe,video,audio,canvas,script'))return null;if(node.nodeType===3&&(chars+=node.length)>80000)return null}while(walker.nextNode())
    const box=body.getBoundingClientRect(),copy=body.cloneNode(true)
    for(const node of [copy,...copy.querySelectorAll('*')]){node.removeAttribute('id');node.removeAttribute('name');node.removeAttribute('autofocus');for(const attr of [...node.attributes])if(attr.name.startsWith('data-chat-')||attr.name==='data-slot')node.removeAttribute(attr.name)}
    copy.removeAttribute('hidden');copy.setAttribute(GHOST,'');copy.setAttribute('aria-hidden','true');copy.inert=true
    copy.style.cssText+=`;position:absolute!important;box-sizing:border-box!important;pointer-events:none!important;overflow:hidden!important;margin:0!important;top:${box.top-rootBox.top}px!important;left:${box.left-rootBox.left}px!important;width:${box.width}px!important;height:${box.height}px!important;`
    return copy
  }
  function capture(event){
    if(disposed||!enabled||quiet.matches||doc.hidden||event.defaultPrevented)return
    const button=event.target?.closest?.('button[data-process-activity][aria-expanded]'),root=button?.closest(GROUP)
    if(!root||!root.closest('[data-chat-flow]')||root.hasAttribute('data-group-expanded-mode')||button.disabled||button.closest('[data-dcb-process-ghost]'))return
    const body=root.querySelector(`:scope > ${BODY}`)
    if(!body||button.getAttribute('aria-controls')!==body.id||root.closest('[hidden],[inert]'))return
    const box=root.getBoundingClientRect();if(!box.width||!box.height||tooLarge(box))return
    const wasOpen=button.getAttribute('aria-expanded')==='true',previous=active.get(root),content=previous?.ghost||body
    const css=win.getComputedStyle(content),ghost=wasOpen&&!body.hasAttribute('hidden')?cloneBody(body,box):null
    pending.set(root,{root,button,body,wasOpen,height:box.height,session:session(root),ghost,opacity:css.opacity,translate:css.translate,filter:css.filter})
    if(!frame)frame=win.requestAnimationFrame(flush)
  }
  function flush(){
    frame=0
    for(const before of pending.values()){
      const {root,button,body}=before,open=button.getAttribute('aria-expanded')==='true'
      if(!root.isConnected||before.wasOpen===open||before.session!==session(root))continue
      const previous=active.get(root);if(previous)stop(previous)
      // Native collapse coordinates scrolling and owns the body's height;
      // let that clock finish rather than competing for its geometry.
      if(body.getAttribute('data-chat-motion')==='collapse')continue
      const box=root.getBoundingClientRect();if(tooLarge(box)||typeof root.animate!=='function'||open&&body.hasAttribute('hidden'))continue
      while(active.size>=4)stop(active.values().next().value)
      const css=win.getComputedStyle(root),border=css.boxSizing==='border-box'?0:['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce((sum,key)=>sum+(parseFloat(css[key])||0),0)
      const record={...before,effects:[],ghost:null,styleMark:root.getAttribute('style'),mark:root.getAttribute(MARK),styles:['overflow','position'].map(name=>[name,root.style.getPropertyValue(name),root.style.getPropertyPriority(name)])}
      active.set(root,record);root.setAttribute(MARK,open?'opening':'closing');root.style.setProperty('overflow','clip','important');if(css.position==='static')root.style.setProperty('position','relative','important')
      if(!open&&before.ghost){record.ghost=before.ghost;root.append(record.ghost)}
      const duration=motion.time.scene,options={duration,easing:motion.ease.smooth,fill:'both'}
      const height=root.animate([{height:`${Math.max(0,before.height-border)}px`},{height:`${Math.max(0,box.height-border)}px`}],{...options,id:'dcb-process-height'});record.effects.push(height)
      const target=open?body:record.ghost
      if(target){const start=previous?{opacity:before.opacity,translate:before.translate,filter:before.filter}:open?{opacity:0,translate:'0 -8px',filter:'blur(2px)'}:{opacity:1,translate:'none',filter:'blur(0px)'}
        record.effects.push(target.animate([start,open?{opacity:1,translate:'none',filter:'blur(0px)'}:{opacity:0,translate:'0 -6px',filter:'blur(2px)'}],{...options,id:'dcb-process-content'}))}
      // Streaming is allowed to resize the content. Stop at the host's new
      // natural layout instead of leaving a stale fixed height behind.
      if(open&&typeof win.ResizeObserver==='function'){
        const content=body.querySelector(CONTENT),initial=content?.getBoundingClientRect().height
        if(content){record.resize=new win.ResizeObserver(()=>{if(Math.abs(content.getBoundingClientRect().height-initial)>1)stop(record)});record.resize.observe(content)}
      }
      height.finished.then(()=>stop(record),()=>stop(record))
    }
    pending.clear()
  }
  const observer=new win.MutationObserver(()=>{for(const record of [...active.values()])if(!record.root.isConnected||record.session!==session(record.root))stop(record)})
  observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-conversation-session']})
  const quietChanged=()=>{if(quiet.matches||doc.hidden)clear()}
  doc.addEventListener('click',capture,true);doc.addEventListener('visibilitychange',quietChanged);quiet.addEventListener('change',quietChanged)
  return{setEnabled(value){enabled=!!value;if(!enabled)clear()},dispose(){disposed=true;clear();observer.disconnect();doc.removeEventListener('click',capture,true);doc.removeEventListener('visibilitychange',quietChanged);quiet.removeEventListener('change',quietChanged)}}
}
