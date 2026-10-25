import {motion} from './motion.js'

const stopped=new Set(['cancel','cancelled','canceled','abort','aborted','interrupted','stopped','stop'])
const actions={command:'执行命令',edit:'修改文件',read:'读取文件',image:'处理图像',search:'检索资料',web:'检索资料',agent:'协作中',plan:'整理任务'}

export function summaryEventStatus(entries=[]){
  const calls=new Map();let endReason=''
  for(const entry of entries){
    const event=entry?.event
    const data=event?.data;if(!data)continue
    const id=data.callId||data.subCallId||data.message?.source?.callId
    if(['tool/call','tool/ptc-dispatch-start'].includes(event.type)&&id&&typeof data.name==='string')calls.set(id,data.name)
    if(['tool/result','tool/ptc-dispatch'].includes(event.type))calls.delete(id)
    if(event.type==='turn/end')endReason=typeof data.reason==='string'?data.reason:data.reason?.kind||''
  }
  return{tool:[...calls.values()].at(-1)||'',endReason}
}

// Labels describe the selected payload. Live progress always belongs to the
// latest real plan, never the persistent projection left over from an old turn.
export function summaryEntryState({running=false,pending=false,plan=[],files=[],endReason='',category='',active=false}={}){
  if(pending)return{kind:'waiting',label:'待确认',detail:'等待处理提问或权限确认'}
  if(running){
    if(plan.length){
      const completed=plan.filter(item=>item.status==='completed').length,index=plan.findIndex(item=>item.status==='in_progress')
      if(completed<plan.length){const step=index<0?Math.min(completed+1,plan.length):index+1;return{kind:'progress',label:`${step}/${plan.length}`,detail:`任务进行中 · 已完成 ${completed} 项，共 ${plan.length} 项`}}
    }
    return{kind:'running',label:active?(category==='interaction'?'待确认':actions[category]||'处理中'):'处理中',detail:'查看当前任务与输出'}
  }
  if(stopped.has(endReason))return{kind:'stopped',label:'已停止',detail:'任务已停止，可展开查看已有记录与成果'}
  if(['error','failed','failure'].includes(endReason))return{kind:'error',label:'执行出错',detail:'任务执行出错，可展开查看已有记录'}
  return files.length?{kind:'outputs',label:'查看成果',detail:'查看生成的文件与任务记录'}:{kind:'overview',label:'概览',detail:'查看任务与已用资源'}
}

export const summaryEntryCss=`
  .dcb-entry-label { position:relative; display:inline-block; flex:none; min-width:4.5em; height:18px; overflow:hidden; vertical-align:middle; font-variant-numeric:tabular-nums; }
  .dcb-entry-label-text { display:inline-block; width:max-content; white-space:nowrap; vertical-align:top; }
  .dcb-entry-label-ghost { position:absolute; inset-block-start:0; inset-inline-start:0; pointer-events:none; user-select:none; }
  .dcb-entry-label[data-moving] { will-change:width; }
  .dcb-entry-label[data-moving] > span { will-change:opacity,transform,filter; }
  .dcb-entry { transition:background-color ${motion.time.quick}ms ${motion.ease.color},color ${motion.time.quick}ms ${motion.ease.color}; }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { .dcb-entry { transition:none; } }
`

const resting={opacity:'1',transform:'none',filter:'blur(0px)'}
const entering={opacity:'0',transform:'translateY(4px)',filter:'blur(1px)'}
const leaving={opacity:'0',transform:'translateY(-4px)',filter:'blur(1px)'}
const visual=(win,node)=>{const style=win.getComputedStyle(node);return{opacity:style.opacity,transform:style.transform,filter:style.filter}}

export function createSummaryEntryStatus(React,doc,win){
  const h=React.createElement,controllers=new Set(),quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let disposed=false
  function controller(host,text){
    let previous=text.textContent,context=null,animations=[],ghosts=[],revision=0,dead=false,lastWidth=text.getBoundingClientRect().width
    const cancel=()=>{for(const animation of animations)animation.cancel();animations=[]}
    function settle(){revision++;cancel();for(const node of ghosts)node.remove();ghosts=[];host.style.width='';host.removeAttribute('data-moving');lastWidth=text.getBoundingClientRect().width}
    function update(label,key){
      if(dead)return
      if(previous===label){if(context!==key)settle();context=key;return}
      const startWidth=animations.length?host.getBoundingClientRect().width:lastWidth,main={label:previous,frame:visual(win,text)},old=ghosts.map(node=>({label:node.textContent,frame:visual(win,node)}))
      const matching=old.find(item=>item.label===label),outgoing=[...old.filter(item=>item.label!==label),main].filter(item=>Number(item.frame.opacity)>.005).sort((a,b)=>Number(b.frame.opacity)-Number(a.frame.opacity)).slice(0,2)
      previous=label
      const sameContext=context===key;context=key;settle()
      if(disposed||!sameContext||quiet.matches||doc.hidden||!host.getClientRects().length||typeof text.animate!=='function')return
      const endWidth=text.getBoundingClientRect().width,token=revision
      // Keep the label's outer box stable while its wording changes. Animating
      // width repeatedly reflows the native summary row and can move the chat
      // scroll position when a generated answer settles.
      host.style.width=Math.max(startWidth,endWidth)+'px';host.setAttribute('data-moving','')
      const animate=(node,frames,id)=>{const animation=node.animate(frames,{duration:motion.time.standard,easing:motion.ease.smooth,fill:'both'});animation.id=id;animations.push(animation)}
      try{
        for(const item of outgoing){const node=doc.createElement('span');node.className='dcb-entry-label-text dcb-entry-label-ghost';node.textContent=item.label;node.setAttribute('aria-hidden','true');host.append(node);ghosts.push(node);animate(node,[item.frame,leaving],'dcb-entry-label-out')}
        animate(text,[matching?.frame||entering,resting],'dcb-entry-label-in')
        Promise.allSettled(animations.map(animation=>animation.finished)).then(()=>{if(!dead&&revision===token)settle()})
      }catch{settle()}
    }
    function calm(){if(quiet.matches||doc.hidden)settle()}
    quiet.addEventListener('change',calm);doc.addEventListener('visibilitychange',calm)
    const api={update,dispose(){if(dead)return;dead=true;settle();quiet.removeEventListener('change',calm);doc.removeEventListener('visibilitychange',calm);controllers.delete(api)}}
    controllers.add(api);return api
  }
  function Label({value,context}){
    const host=React.useRef(null),text=React.useRef(null),control=React.useRef(null)
    React.useLayoutEffect(()=>{if(disposed)return;control.current=controller(host.current,text.current);return()=>{control.current?.dispose();control.current=null}},[])
    React.useLayoutEffect(()=>control.current?.update(value.label,context),[value.label,context])
    return h('span',{ref:host,className:'dcb-entry-label','data-status':value.kind,'aria-live':'polite','aria-atomic':true},h('span',{ref:text,className:'dcb-entry-label-text'},value.label))
  }
  return{Label,dispose(){disposed=true;for(const item of [...controllers])item.dispose()}}
}
