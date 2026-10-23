import {motion} from './motion.js'
import {createTurnNavigation} from './turn-navigation.js'

const FLOW='[data-chat-flow]:not([data-step-process-content])'
const ROW='data-dcb-turn-row',HEAD='data-dcb-turn-head',TAIL='data-dcb-turn-tail',FIRST='data-dcb-turn-first'
const SURFACE='data-dcb-turn-surface',VISIBLE='data-dcb-turn-visible',ARRIVING='data-dcb-turn-arriving'
const HEIGHT='--dcb-turn-height'
const ENABLED='data-dcb-turn-cards-enabled'
const OWNED=[ROW,HEAD,TAIL,FIRST,SURFACE,VISIBLE,ARRIVING,'data-dcb-turn-focused','data-dcb-turn-jump']
const OWNED_SELECTOR=OWNED.map(name=>`[${name}]`).concat(`[style*="${HEIGHT}"]`).join(',')
const ROOT=`body[${ENABLED}] [${SURFACE}]`,DARK=`body[data-ds-dark-theme][${ENABLED}] [${SURFACE}]`
const CARD=`${ROOT} [${HEAD}][${ROW}]`

export const turnCardsCss=`
  ${ROOT} { position:relative; isolation:isolate; --dcb-turn-fill:rgba(255,255,255,.56); --dcb-turn-rim:rgba(255,255,255,.74); --dcb-turn-shadow:0 5px 18px rgba(26,34,46,.08),inset 0 1px 1px #ffffffe8; --dcb-turn-blur:2px; --dcb-turn-saturation:1.15; }
  ${DARK} { --dcb-turn-fill:rgba(24,28,36,.78); --dcb-turn-rim:rgba(255,255,255,.24); --dcb-turn-shadow:0 5px 18px #00000038,inset 0 1px 1px #ffffff42; }
  ${ROOT}[data-dcb-turn-surface="clear"] { --dcb-turn-blur:0px; }
  ${DARK}[data-dcb-turn-surface="clear"] { --dcb-turn-fill:rgba(24,28,36,.22); --dcb-turn-rim:rgba(255,255,255,.4); }
  ${ROOT}[data-dcb-turn-surface="glass"] { --dcb-turn-fill:rgba(236,242,248,.62); --dcb-turn-blur:22px; --dcb-turn-saturation:1.45; }
  ${DARK}[data-dcb-turn-surface="glass"] { --dcb-turn-fill:rgba(160,174,190,.26); --dcb-turn-rim:rgba(255,255,255,.34); }
  ${ROOT} [data-dcb-turn-row] { position:relative; box-sizing:border-box; padding-inline:clamp(16px,2.2vw,28px); }
  ${CARD} { padding-block-start:22px; }
  ${CARD}:not([data-dcb-turn-first]) { margin-block-start:24px!important; }
  ${ROOT} [data-dcb-turn-tail] { padding-block-end:22px; }
  ${CARD}::before { content:''; position:absolute; z-index:-1; top:0; left:0; width:100%; height:var(${HEIGHT},100%); box-sizing:border-box; border:1px solid var(--dcb-turn-rim); border-radius:22px; pointer-events:none; background:linear-gradient(135deg,#ffffff24,transparent 42%),var(--dcb-turn-fill); box-shadow:var(--dcb-turn-shadow); transition:background-color ${motion.time.material}ms ${motion.ease.color},border-color ${motion.time.material}ms ${motion.ease.color},box-shadow ${motion.time.material}ms ${motion.ease.color}; }
  ${CARD}[data-dcb-turn-visible]::before { backdrop-filter:blur(var(--dcb-turn-blur)) saturate(var(--dcb-turn-saturation)); -webkit-backdrop-filter:blur(var(--dcb-turn-blur)) saturate(var(--dcb-turn-saturation)); }
  ${CARD}[data-dcb-turn-arriving]::before { animation:dcb-turn-card-in ${motion.time.standard}ms ${motion.ease.smooth}; }
  ${CARD}[data-dcb-turn-focused]::before { border-color:rgba(99,111,128,.46); box-shadow:var(--dcb-turn-shadow),0 0 0 1px rgba(99,111,128,.18); }
  ${DARK} [data-dcb-turn-head][data-dcb-turn-row][data-dcb-turn-focused]::before { border-color:#ffffff8c; box-shadow:var(--dcb-turn-shadow),0 0 0 1px #ffffff26; }
  ${CARD}[data-dcb-turn-jump="up"]::before { animation:dcb-turn-pull-down ${motion.time.scene}ms ${motion.ease.smooth}; }
  ${CARD}[data-dcb-turn-jump="down"]::before { animation:dcb-turn-pull-up ${motion.time.scene}ms ${motion.ease.smooth}; }
  @keyframes dcb-turn-pull-down { from { transform:translateY(-10px) scale(.985); } to { transform:translateY(0) scale(1); } }
  @keyframes dcb-turn-pull-up { from { transform:translateY(10px) scale(.985); } to { transform:translateY(0) scale(1); } }
  @keyframes dcb-turn-card-in { from { opacity:0; transform:translateY(10px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
  @media(max-width:600px) { ${ROOT} [data-dcb-turn-row] { padding-inline:14px; } ${CARD}::before { border-radius:18px; } }
  @media(prefers-reduced-motion:reduce) { ${CARD}::before { animation:none!important; transition:none!important; } }
  @media(forced-colors:active) { ${CARD}::before { background:Canvas!important; border-color:CanvasText!important; box-shadow:none!important; backdrop-filter:none!important; -webkit-backdrop-filter:none!important; animation:none!important; transition:none!important; } }
`

// Paint one background across a run of native siblings. The host owns their
// parents, order, anchors, scroll and content; nothing is wrapped or copied.
export function createTurnCards(doc,win,{enabled=true,style='css'}={}){
  const records=new Map(),rowGroups=new WeakMap(),pending=new Set(),geometry=new Set()
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let disposed=false,frame=0,measureFrame=0,active=enabled,material=style==='milk'?'css':style,pendingKey=0
  const pendingIds=new WeakMap()
  const navigation=createTurnNavigation(doc,win,{
    groupById:(root,id)=>records.get(root)?.byId?.get(id),
    groupAt:(element,event)=>{
      const group=rowGroups.get(element.closest(`[${ROW}]`))
      if(group)return group
      const record=records.get(element.closest(FLOW))
      if(!record)return null
      // Gaps between native rows belong to the same painted card. Hit-test
      // only visible cards and only on double-click, never while streaming.
      for(const group of record.groups)if(group.visible.size){
        const a=group.head.getBoundingClientRect(),b=group.tail.getBoundingClientRect()
        if(event.clientX>=a.left&&event.clientX<=a.right&&event.clientY>=a.top&&event.clientY<=b.bottom)return group
      }
      return null
    },
  })
  const mark=(node,name,value='')=>{
    if(node.getAttribute(name)!==value)node.setAttribute(name,value)
  }
  const restore=(node)=>{
    // These names belong to this plugin. A retained/rebuilt DOM node may carry
    // an older decoration; restoring it as a host original revives the glass.
    for(const name of OWNED)node.removeAttribute(name)
    node.style.removeProperty(HEIGHT)
  }
  const sweep=root=>{restore(root);for(const node of root.querySelectorAll(OWNED_SELECTOR))restore(node)}
  const scheduleMeasure=group=>{geometry.add(group);if(!measureFrame&&!disposed)measureFrame=win.requestAnimationFrame(measure)}
  function measure(){
    measureFrame=0
    const reads=[]
    for(const group of geometry){
      if(!group.live||!group.head.isConnected)continue
      const a=group.head.getBoundingClientRect(),b=group.tail.getBoundingClientRect()
      if(a.width>0&&b.bottom>a.top)reads.push([group,Math.round((b.bottom-a.top)*100)/100+'px'])
    }
    geometry.clear()
    for(const [group,height]of reads)if(group.head.style.getPropertyValue(HEIGHT)!==height)group.head.style.setProperty(HEIGHT,height)
  }
  const resize=new win.ResizeObserver(entries=>{for(const {target}of entries){const group=rowGroups.get(target);if(group)scheduleMeasure(group)}})
  const exposure=new win.IntersectionObserver(entries=>{
    const changed=new Set()
    for(const entry of entries){const group=rowGroups.get(entry.target);if(!group)continue;entry.isIntersecting?group.visible.add(entry.target):group.visible.delete(entry.target);changed.add(group)}
    for(const group of changed)group.visible.size?mark(group.head,VISIBLE):group.head.removeAttribute(VISIBLE)
  },{rootMargin:'80px 0px'})
  function drop(group){
    group.live=false;geometry.delete(group);win.clearTimeout(group.timer)
    for(const row of group.rows){resize.unobserve(row);exposure.unobserve(row);rowGroups.delete(row);restore(row)}
  }
  const isEcho=row=>row.matches('[data-submission-echo], [data-pending-steering]')
  function idOf(row){
    const turn=row.getAttribute('data-chat-turn')
    if(turn!==null&&/^\d+$/.test(turn))return 'turn:'+turn
    if(isEcho(row)){if(!pendingIds.has(row))pendingIds.set(row,++pendingKey);return 'pending:'+pendingIds.get(row)}
    return null
  }
  function clear(record){navigation.clearRoot(record.root);for(const group of record.groups)drop(group);restore(record.root);record.groups=[];record.byId=new Map()}
  function scan(root){
    let record=records.get(root)
    if(!record){sweep(root);record={root,groups:[],maxTurn:-1,seeded:false,session:null};records.set(root,record)}
    const session=root.closest('[data-conversation-session]')?.getAttribute('data-conversation-session')||''
    if(record.session!==session){clear(record);record.seeded=false;record.maxTurn=-1;record.session=session}
    const list=[...root.children].find(el=>el.getAttribute('data-slot')==='conversation.chat.flow')||root
    record.list=list;mark(root,SURFACE,material)
    const runs=[]
    for(const row of list.children){
      const id=idOf(row)
      if(!id||row.matches('[hidden], [data-turn-process-hidden="true"], :empty, :has(>[data-slot="conversation.chat.node"]:empty)'))continue
      const previous=runs.at(-1)
      if(previous?.id===id)previous.rows.push(row)
      else runs.push({id,rows:[row]})
    }
    const acknowledged=record.groups.some(group=>group.id.startsWith('pending:')&&!group.head.isConnected)
    const old=new Map(record.groups.map(group=>[group.id,group])),groups=[]
    const changes=[]
    for(const run of runs){
      const group=old.get(run.id)
      if(group&&group.rows.length===run.rows.length&&group.rows.every((row,i)=>row===run.rows[i])){old.delete(run.id);groups.push(group)}
      else{if(group){old.delete(run.id);drop(group)}changes.push(run);groups.push(run)}
    }
    for(const group of old.values())drop(group)
    for(const group of changes){
      group.root=root
      group.head=group.rows[0];group.tail=group.rows.at(-1);group.visible=new Set();group.live=true
      for(const row of group.rows){restore(row);mark(row,ROW);rowGroups.set(row,group);resize.observe(row);exposure.observe(row)}
      mark(group.head,HEAD);mark(group.tail,TAIL);scheduleMeasure(group)
      const turn=Number(group.id.split(':')[1])
      if(!reduced.matches&&root.closest('[data-chat-following-tail]')&&(group.id.startsWith('pending:')||!acknowledged&&record.seeded&&turn>record.maxTurn)){
        mark(group.head,ARRIVING);group.timer=win.setTimeout(()=>{if(group.live)group.head.removeAttribute(ARRIVING)},motion.time.standard+30)
      }
    }
    for(let i=0;i<groups.length;i++)i===0?mark(groups[i].head,FIRST):groups[i].head.removeAttribute(FIRST)
    record.groups=groups
    record.byId=new Map(groups.map(group=>[group.id,group]))
    navigation.refresh()
    for(const group of groups)if(group.id.startsWith('turn:'))record.maxTurn=Math.max(record.maxTurn,Number(group.id.slice(5)))
    if(groups.length)record.seeded=true
  }
  function flush(){
    frame=0;if(disposed)return
    for(const [root,record]of records)if(!root.isConnected||!active){clear(record);records.delete(root)}
    const batch=[...pending];pending.clear()
    if(active)for(const root of batch)if(root.isConnected)scan(root)
  }
  const schedule=root=>{if(root)pending.add(root);if(!frame&&!disposed)frame=win.requestAnimationFrame(flush)}
  function discover(node){if(node.nodeType!==1)return;if(node.matches(FLOW))schedule(node);for(const root of node.querySelectorAll(FLOW))schedule(root)}
  const observer=new win.MutationObserver(entries=>{
    if(!active||disposed)return
    for(const entry of entries){
      const target=entry.target,root=target.closest(FLOW)
      if(root){const record=records.get(root);if(!record||target===root||target===record.list||entry.type==='attributes'&&target.parentElement===record.list)schedule(root)}
      else if(entry.type==='attributes')discover(target)
      else{for(const node of entry.addedNodes)discover(node);if(entry.removedNodes.length&&records.size)schedule()}
    }
  })
  observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-chat-turn','data-conversation-session','hidden','data-turn-process-hidden']})
  doc.body.removeAttribute(ENABLED);sweep(doc.body)
  if(active)doc.body.setAttribute(ENABLED,'')
  if(active)discover(doc.body)
  return {
    setOptions(options){
      const wasActive=active,next=options.style==='milk'?'css':options.style||'css',changed=active!==options.enabled||next!==material
      active=options.enabled;material=next
      if(!changed)return
      if(active){if(!wasActive)sweep(doc.body);doc.body.setAttribute(ENABLED,'');discover(doc.body)}
      else{doc.body.removeAttribute(ENABLED);win.cancelAnimationFrame(frame);frame=0;win.cancelAnimationFrame(measureFrame);measureFrame=0;pending.clear();for(const record of records.values())clear(record);records.clear();geometry.clear();sweep(doc.body)}
    },
    dispose(){disposed=true;doc.body.removeAttribute(ENABLED);navigation.dispose();observer.disconnect();resize.disconnect();exposure.disconnect();win.cancelAnimationFrame(frame);win.cancelAnimationFrame(measureFrame);for(const record of records.values())clear(record);records.clear();pending.clear();geometry.clear();sweep(doc.body)},
  }
}
