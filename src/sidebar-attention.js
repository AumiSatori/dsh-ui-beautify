const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`
const excluded='[data-dcb-sidebar-ghost],[data-dcb-sidebar-layout-probe]'
const labels={done:'其他会话已完成',waiting:'其他会话等待回答',error:'其他会话执行失败'}
const stopped=new Set(['cancel','cancelled','canceled','abort','aborted','interrupted','stopped','stop'])
const failed=new Set(['error','failed','failure'])

export const sidebarAttentionCss=`
  .dcb-sidebar-attention { position:fixed; left:26px; top:calc(50% - 46px); z-index:35; display:flex; align-items:center; padding:6px; border:1px solid #d8dce5; border-radius:15px; background:rgba(255,255,255,.96); box-shadow:0 7px 24px #25324a24,0 2px 5px #25324a0d; isolation:isolate; }
  .dcb-sidebar-attention::before { content:''; position:absolute; left:-5px; bottom:11px; width:8px; height:8px; background:inherit; border-left:1px solid #d8dce5; border-bottom:1px solid #d8dce5; transform:rotate(45deg); z-index:-1; }
  .dcb-attention-cell { flex:none; width:40px; overflow:hidden; }
  .dcb-attention-cell[data-kind=error] { order:0; }
  .dcb-attention-cell[data-kind=waiting] { order:1; }
  .dcb-attention-cell[data-kind=done] { order:2; }
  .dcb-attention-button { position:relative; display:grid; place-items:center; width:36px; height:36px; margin-inline:2px; padding:0; border:0; border-radius:10px; cursor:pointer; color:var(--attention-color); background:var(--attention-bg); transition:background-color 180ms,color 180ms; }
  .dcb-attention-button:hover { background:var(--attention-hover); }
  .dcb-attention-button:focus-visible { outline:2px solid currentColor; outline-offset:2px; }
  .dcb-attention-button[data-kind=done] { --attention-color:#218552; --attention-bg:#eaf7ef; --attention-hover:#d8f0e2; }
  .dcb-attention-button[data-kind=waiting] { --attention-color:#6861c3; --attention-bg:#efedfc; --attention-hover:#e3defb; }
  .dcb-attention-button[data-kind=error] { --attention-color:#cf424c; --attention-bg:#fcecee; --attention-hover:#f9dce0; }
  .dcb-attention-button svg { width:26px; height:26px; overflow:visible; fill:none; stroke:currentColor; stroke-width:2.3; stroke-linecap:round; stroke-linejoin:round; }
  .dcb-attention-count { position:absolute; top:0; right:0; min-width:15px; height:15px; padding:0 3px; border-radius:8px; background:var(--attention-color); color:white; font:600 10px/15px system-ui,sans-serif; text-align:center; }
  .dcb-attention-check { stroke-dasharray:24; animation:dcb-attention-check 3.2s cubic-bezier(.22,.8,.26,1) infinite; }
  .dcb-attention-orbit { opacity:.35; transform-origin:12px 12px; animation:dcb-attention-orbit 3.2s ease-in-out infinite; }
  .dcb-attention-dots circle { fill:currentColor; stroke:none; }
  .dcb-attention-dots circle:nth-child(1) { animation:dcb-attention-dot-one 1.5s steps(1,end) infinite; }
  .dcb-attention-dots circle:nth-child(2) { animation:dcb-attention-dot-two 1.5s steps(1,end) infinite; }
  .dcb-attention-dots circle:nth-child(3) { animation:dcb-attention-dot-three 1.5s steps(1,end) infinite; }
  .dcb-attention-alert { transform-origin:12px 12px; animation:dcb-attention-alert 2.6s ease-in-out infinite; }
  .dcb-attention-ring { transform-origin:12px 12px; animation:dcb-attention-ring 2.6s ease-out infinite; }
  @keyframes dcb-attention-check { 0%{stroke-dashoffset:24;opacity:0} 10%{opacity:1} 27%,88%{stroke-dashoffset:0;opacity:1} 100%{stroke-dashoffset:0;opacity:0} }
  @keyframes dcb-attention-orbit { 0%,100%{transform:scale(.82);opacity:.15} 30%{transform:scale(1.08);opacity:.5} 55%,85%{transform:scale(1);opacity:.3} }
  @keyframes dcb-attention-dot-one { 0%,100%{opacity:1;transform:translateY(0)} 8%{transform:translateY(-2px)} 22%{transform:translateY(0)} }
  @keyframes dcb-attention-dot-two { 0%,100%{opacity:0;transform:translateY(0)} 33%{opacity:1;transform:translateY(-2px)} 49%{opacity:1;transform:translateY(0)} }
  @keyframes dcb-attention-dot-three { 0%,100%{opacity:0;transform:translateY(0)} 66%{opacity:1;transform:translateY(-2px)} 82%{opacity:1;transform:translateY(0)} }
  @keyframes dcb-attention-alert { 0%,12%,100%{transform:rotate(0) scale(1)} 3%{transform:rotate(-12deg) scale(1.1)} 6%{transform:rotate(10deg) scale(1.1)} 9%{transform:rotate(-6deg) scale(1.04)} }
  @keyframes dcb-attention-ring { 0%{transform:scale(.86);opacity:.6} 38%{transform:scale(1.18);opacity:0} 100%{transform:scale(1.18);opacity:0} }
  body[data-ds-dark-theme] .dcb-sidebar-attention { background:rgba(40,42,48,.97); border-color:#595b67; box-shadow:0 7px 24px #0005; }
  body[data-ds-dark-theme] .dcb-sidebar-attention::before { border-color:#595b67; }
  body[data-ds-dark-theme] .dcb-attention-button[data-kind=done] { --attention-color:#78dba4; --attention-bg:#254536; --attention-hover:#315b44; }
  body[data-ds-dark-theme] .dcb-attention-button[data-kind=waiting] { --attention-color:#b6adff; --attention-bg:#393451; --attention-hover:#49426b; }
  body[data-ds-dark-theme] .dcb-attention-button[data-kind=error] { --attention-color:#ff969e; --attention-bg:#512f36; --attention-hover:#683b43; }
  [data-dcb-background-only] .dcb-sidebar-attention { visibility:hidden; }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { .dcb-sidebar-attention * { animation:none!important; transition:none!important; } .dcb-attention-check{stroke-dashoffset:0} .dcb-attention-dots circle{opacity:1} .dcb-attention-ring{opacity:0} }
  @media(forced-colors:active) { .dcb-sidebar-attention,.dcb-sidebar-attention::before { background:Canvas; border-color:CanvasText; box-shadow:none; } .dcb-attention-button { color:ButtonText!important; background:ButtonFace!important; border:1px solid ButtonText; } .dcb-attention-count { color:HighlightText; background:Highlight; } }
`

// Read only the host's root status sources and already-retained event tails.
// Never open another session, load its transcript, or alter its unread marker.
export function createSidebarAttention(doc,win){
  const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  const states=new Map(),acknowledged=new Map(),failures=new Map(),tails=new Map(),cells=new Map()
  let services=null,unsubscribers=[],root=null,rootAnimation=null,revision=0,frame=0,enabled=true,disposed=false
  const rest={opacity:1,transform:'none',filter:'blur(0px)'}
  function schedule(){if(!disposed&&!frame)frame=win.requestAnimationFrame(()=>{frame=0;sync()})}
  function animate(node,frames,id){
    if(quiet.matches||doc.hidden||typeof node.animate!=='function')return null
    const animation=node.animate(frames,{duration:260,easing:'cubic-bezier(.22,.8,.26,1)',fill:'both'});animation.id=id
    return animation
  }
  function cancelRoot(){rootAnimation?.cancel();rootAnimation=null}
  function hide(immediate=false){
    if(!root)return
    if(root.dataset.leaving&&!immediate)return
    const node=root,token=++revision,current=win.getComputedStyle(node)
    const start={opacity:current.opacity,transform:current.transform,filter:current.filter}
    cancelRoot();node.dataset.leaving='';node.style.pointerEvents='none';node.setAttribute('aria-hidden','true')
    rootAnimation=immediate?null:animate(node,[start,{opacity:0,transform:'translate(-12px,8px) scale(.84)',filter:'blur(3px)'}],'dcb-attention-out')
    const finish=()=>{if(token!==revision)return;cancelRoot();for(const cell of cells.values())cell.animation?.cancel();cells.clear();node.remove();root=null}
    if(rootAnimation)rootAnimation.finished.then(finish,()=>{});else finish()
  }
  function acknowledge(){for(const [id,state]of states)if(state.kind)acknowledged.set(id,state.token)}
  function open(){
    acknowledge();hide()
    if(services?.layout?.toggleSidebar)services.layout.toggleSidebar()
    else{
      const button=[...doc.querySelectorAll('[data-dcb-sidebar-toggle-right],'+names('sidebarCol')+' button'+names('toggle'))].find(node=>!node.closest(excluded))
      button?.click()
    }
  }
  function makeRoot(){
    root=doc.createElement('div');root.className='dcb-sidebar-attention';root.setAttribute('role','status');root.setAttribute('aria-live','polite');root.setAttribute('aria-label','其他会话有新状态，点击展开侧栏查看');doc.body.append(root)
    rootAnimation=animate(root,[{opacity:0,transform:'translate(-12px,8px) scale(.84)',filter:'blur(3px)'},rest],'dcb-attention-in')
    const animation=rootAnimation;animation?.finished.then(()=>{if(rootAnimation===animation)cancelRoot()},()=>{})
  }
  function addCell(kind){
    const node=doc.createElement('div'),button=doc.createElement('button'),count=doc.createElement('span')
    node.className='dcb-attention-cell';node.dataset.kind=kind;button.className='dcb-attention-button';button.type='button';button.dataset.kind=kind
    const shape=kind==='done'?'<circle class="dcb-attention-orbit" cx="12" cy="12" r="9.2" stroke-width="1.4"/><path class="dcb-attention-check" d="m6.5 12 3.5 3.6 7.5-7.4"/>':kind==='waiting'?'<g class="dcb-attention-dots"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></g>':'<circle class="dcb-attention-ring" cx="12" cy="12" r="9.3" stroke-width="1.4"/><g class="dcb-attention-alert"><path d="M12 5v8"/><circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/></g>'
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+shape+'</svg>';count.className='dcb-attention-count';count.setAttribute('aria-hidden','true');button.append(count);node.append(button);button.addEventListener('click',open);root.append(node)
    const cell={node,button,count,animation:null,leaving:false};cells.set(kind,cell);return cell
  }
  function render(groups){
    if(!root)makeRoot()
    else if(root.dataset.leaving){++revision;cancelRoot();delete root.dataset.leaving;root.style.pointerEvents='';root.removeAttribute('aria-hidden');rootAnimation=animate(root,[{opacity:0,transform:'translate(-12px,8px) scale(.84)',filter:'blur(3px)'},rest],'dcb-attention-in');const animation=rootAnimation;animation?.finished.then(()=>{if(rootAnimation===animation)cancelRoot()},()=>{})}
    for(const kind of ['error','waiting','done']){
      const total=groups[kind]||0,previous=cells.get(kind)
      if(total){
        const cell=previous||addCell(kind)
        if(cell.leaving){cell.animation?.cancel();cell.animation=null;cell.leaving=false}
        if(!previous){cell.animation=animate(cell.node,[{width:'0px',opacity:0,transform:'scale(.8)',filter:'blur(2px)'},{width:'40px',...rest}],'dcb-attention-cell-in');const animation=cell.animation;animation?.finished.then(()=>{if(cell.animation===animation){animation.cancel();cell.animation=null}},()=>{})}
        const label=`${labels[kind]}（${total}），点击展开侧栏查看`;cell.button.setAttribute('aria-label',label);cell.button.title=label;cell.count.hidden=total<2;cell.count.textContent=total>99?'99+':String(total)
      }else if(previous&&!previous.leaving){
        previous.leaving=true;previous.animation?.cancel();previous.animation=animate(previous.node,[{width:'40px',...rest},{width:'0px',opacity:0,transform:'scale(.8)',filter:'blur(2px)'}],'dcb-attention-cell-out')
        const finish=()=>{if(!previous.leaving)return;previous.animation?.cancel();previous.node.remove();cells.delete(kind)}
        if(previous.animation)previous.animation.finished.then(finish,()=>{});else finish()
      }
    }
  }
  function observeTail(id,binding){
    let record=tails.get(id)
    if(record?.source===binding?.eventSource)return record
    record?.off();tails.delete(id)
    if(!binding?.eventSource)return null
    record={source:binding.eventSource,off:()=>{},seq:-1,reason:''};record.off=record.source.subscribe(schedule);tails.set(id,record)
    return record
  }
  function sync(nextEnabled=enabled){
    enabled=nextEnabled;if(disposed)return
    const list=services?.sessions?.list?.getSnapshot(),statuses=services?.uiSession?.sessionStatus?.getSnapshot()
    if(!list||!statuses){hide(true);return}
    const ids=new Set(Object.keys(list.byId||{})),groups={}
    for(const [id,tail]of tails)if(!ids.has(id)){tail.off();tails.delete(id)}
    for(const id of states.keys())if(!ids.has(id)){states.delete(id);acknowledged.delete(id);failures.delete(id)}
    for(const id of failures.keys())if(!ids.has(id))failures.delete(id)
    const visible=new Set([...doc.querySelectorAll('[data-conversation-content][data-conversation-session]')].filter(node=>node.getClientRects().length&&!node.closest(excluded)).map(node=>node.dataset.conversationSession))
    const expanded=[...doc.querySelectorAll(names('frame'))].some(node=>!node.closest(excluded)&&node.getClientRects().length&&node.getAttribute('data-sidebar-collapsed')==='false')
    for(const id of ids){
      const row=list.byId[id],status=statuses.get(id)||{},old=states.get(id),running=status.running??row.running
      const previous=old||{generation:0,kind:null,token:{},running:false,pending:null}
      const newRun=running&&!previous.running
      if(newRun){previous.generation++;failures.delete(id)}
      const tail=observeTail(id,services.sessions.binding?.(id))
      if(tail){
        if(newRun)tail.reason=''
        // EventSource entries are contiguous; visit only new events, backwards.
        const entries=tail.source.getSnapshot()?.entries||[];let latest=tail.seq
        for(let i=entries.length-1;i>=0;i--){const event=entries[i]?.event;if(!event)continue;const seq=event.seq??i;if(seq<=tail.seq)break;latest=Math.max(latest,seq);if(event.type==='turn/end'){const reason=event.data?.reason;tail.reason=typeof reason==='string'?reason:reason?.kind||reason?.type||'';break}if(event.type==='turn/start'){tail.reason='';break}}
        tail.seq=latest
      }
      const reason=tail?.reason||'',isOther=!visible.has(id)&&!(row.retainedBy?.mainView>0),topLevel=row.origin!=='subagent'&&!row.parentSessionId
      const kind=topLevel&&isOther?(status.pendingInteraction?'waiting':!running&&(failures.has(id)||status.completionUnread&&failed.has(reason))?'error':!running&&status.completionUnread&&!stopped.has(reason)?'done':null):null
      const interaction=status.pendingInteraction,pending=interaction&&(interaction.key??interaction.id??interaction.requestId??interaction)
      const changed=kind!==previous.kind||previous.running!==running||(kind==='waiting'&&previous.pending!==pending)||(kind==='error'&&previous.failure!==failures.get(id))
      const state={generation:previous.generation,kind,running,pending,failure:failures.get(id),token:changed?{}:previous.token};states.set(id,state)
      if(expanded||!enabled||!isOther)acknowledged.set(id,state.token)
      if(kind&&acknowledged.get(id)!==state.token)groups[kind]=(groups[kind]||0)+1
    }
    const collapsed=[...doc.querySelectorAll(names('frame'))].some(node=>!node.closest(excluded)&&node.getClientRects().length&&node.getAttribute('data-sidebar-collapsed')==='true')
    if(!enabled||doc.hidden||expanded||!collapsed||!Object.keys(groups).length)hide()
    else{
      render(groups)
      const edge=[...doc.querySelectorAll('[data-dcb-sidebar-toggle-right]')].find(node=>!node.closest(excluded)&&node.getClientRects().length)
      if(edge){const bounds=edge.getBoundingClientRect(),left=Math.min(bounds.left+26,win.innerWidth-root.offsetWidth-8)+'px',top=Math.max(8,bounds.top+bounds.height/2-46)+'px';if(root.style.left!==left)root.style.left=left;if(root.style.top!==top)root.style.top=top}
    }
  }
  function disconnect(){for(const off of unsubscribers)off?.();unsubscribers=[];for(const tail of tails.values())tail.off();tails.clear();services=null}
  function connect(value){
    disconnect();services=value
    if(value?.sessions?.list&&value?.uiSession?.sessionStatus){
      unsubscribers.push(value.sessions.list.subscribe(schedule),value.uiSession.sessionStatus.subscribe(schedule))
      if(value.remote?.$on)unsubscribers.push(value.remote.$on('api-session/error',id=>{failures.set(id,{});schedule()}),value.remote.$on('api-session/status',(id,running)=>{if(running)failures.delete(id);schedule()}))
    }
    schedule();return()=>{if(services===value){disconnect();hide(true)}}
  }
  const observer=new win.MutationObserver(records=>{if(records.some(record=>!record.target.closest?.('.dcb-sidebar-attention')&&(record.type==='attributes'||[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&(node.matches(names('frame')+', [data-conversation-content]')||node.querySelector(names('frame')+', [data-conversation-content]'))))))schedule()})
  observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-sidebar-collapsed','data-conversation-session','data-dcb-focus-frame']})
  const visibility=()=>{if(doc.hidden)hide(true);else schedule()}
  const calm=()=>{if(quiet.matches){if(root?.dataset.leaving!==undefined)hide(true);else cancelRoot();for(const [kind,cell]of cells){cell.animation?.cancel();cell.animation=null;if(cell.leaving){cell.node.remove();cells.delete(kind)}}}schedule()}
  doc.addEventListener('visibilitychange',visibility);quiet.addEventListener('change',calm)
  return{connect,sync,dispose(){disposed=true;disconnect();observer.disconnect();win.cancelAnimationFrame(frame);doc.removeEventListener('visibilitychange',visibility);quiet.removeEventListener('change',calm);hide(true);states.clear();acknowledged.clear();failures.clear()}}
}
