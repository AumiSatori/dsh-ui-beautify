import {motion} from './motion.js'
import {createTurnNavigation} from './turn-navigation.js'
import {normalizeTurnDivider,createTurnDivider,createTurnDividerSettings,turnDividerSettingsCss} from './turn-divider.js'

const FLOW='[data-chat-flow]:not([data-step-process-content])'
const ROW='data-dcb-turn-row',HEAD='data-dcb-turn-head',TAIL='data-dcb-turn-tail',FIRST='data-dcb-turn-first'
const SURFACE='data-dcb-turn-surface',VISIBLE='data-dcb-turn-visible',ARRIVING='data-dcb-turn-arriving'
const HEIGHT='--dcb-turn-height'
const ENABLED='data-dcb-turn-cards-enabled'
const OWNED=[ROW,HEAD,TAIL,FIRST,SURFACE,VISIBLE,ARRIVING,'data-dcb-turn-focused','data-dcb-turn-jump','data-dcb-divider-preset']
const OWNED_SELECTOR=OWNED.map(name=>`[${name}]`).concat(`[style*="${HEIGHT}"]`).join(',')
const ROOT=`body[${ENABLED}] [${SURFACE}]`,DARK=`body[data-ds-dark-theme][${ENABLED}] [${SURFACE}]`
const CARD=`${ROOT} [${HEAD}][${ROW}]`

export const turnCardsCss=`
  ${ROOT} { position:relative; isolation:isolate; --dcb-turn-fill:#f7f8fa; --dcb-turn-rim:#e5e7eb; }
  ${DARK} { --dcb-turn-fill:#23252a; --dcb-turn-rim:#373a41; }
  ${ROOT} [data-dcb-turn-row] { position:relative; box-sizing:border-box; padding-inline:clamp(16px,2.2vw,28px); }
  ${CARD} { padding-block-start:22px; }
  ${CARD}:not([data-dcb-turn-first]) { margin-block-start:24px!important; }
  ${ROOT} [data-dcb-turn-tail] { padding-block-end:22px; }
  ${CARD}::before { content:''; position:absolute; z-index:-1; top:0; left:0; width:100%; height:var(${HEIGHT},100%); box-sizing:border-box; border:1px solid var(--dcb-turn-rim); border-radius:20px; pointer-events:none; background:var(--dcb-turn-fill); box-shadow:none; filter:none; backdrop-filter:none; -webkit-backdrop-filter:none; }
  ${ROOT}[data-dcb-turn-surface="line"] [data-dcb-turn-row] { padding-inline:4px; }
  ${ROOT}[data-dcb-turn-surface="line"] [data-dcb-turn-head] { padding-block-start:12px; }
  ${ROOT}[data-dcb-turn-surface="line"] [data-dcb-turn-tail] { padding-block-end:12px; }
  ${ROOT}[data-dcb-turn-surface="line"] [data-dcb-turn-head]::before { content:none; }
  ${ROOT}[data-dcb-turn-surface="line"] [data-dcb-turn-first]::before { content:none; }
  ${ROOT}[data-dcb-turn-surface="line"][data-dcb-divider-preset="whale"] [data-dcb-turn-head]:not([data-dcb-turn-first]) { margin-block-start:56px!important; }
  ${ROOT}[data-dcb-turn-surface="line"][data-dcb-divider-preset="whale"] [data-dcb-turn-head]:not([data-dcb-turn-first]):has(> [data-dcb-turn-divider][data-custom-image]) { margin-block-start:112px!important; }
  ${CARD}[data-dcb-turn-arriving]::before { animation:dcb-turn-card-in ${motion.time.standard}ms ${motion.ease.smooth}; }
  ${CARD}[data-dcb-turn-focused]::before { border-color:#989fa9; }
  ${DARK} [data-dcb-turn-head][data-dcb-turn-row][data-dcb-turn-focused]::before { border-color:#818894; }
  ${ROOT}[data-dcb-turn-surface="line"] [data-dcb-turn-focused]::before { background:#989fa9; }
  ${CARD}[data-dcb-turn-jump="up"]::before { animation:dcb-turn-pull-down ${motion.time.scene}ms ${motion.ease.smooth}; }
  ${CARD}[data-dcb-turn-jump="down"]::before { animation:dcb-turn-pull-up ${motion.time.scene}ms ${motion.ease.smooth}; }
  @keyframes dcb-turn-pull-down { from { transform:translateY(-10px) scale(.985); } to { transform:translateY(0) scale(1); } }
  @keyframes dcb-turn-pull-up { from { transform:translateY(10px) scale(.985); } to { transform:translateY(0) scale(1); } }
  @keyframes dcb-turn-card-in { from { opacity:0; transform:translateY(10px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
  @media(max-width:600px) { ${ROOT} [data-dcb-turn-row] { padding-inline:14px; } ${CARD}::before { border-radius:18px; } }
  @media(prefers-reduced-motion:reduce) { ${CARD}::before { animation:none!important; transition:none!important; } }
  @media(forced-colors:active) { ${CARD}::before { background:Canvas!important; border-color:CanvasText!important; box-shadow:none!important; backdrop-filter:none!important; -webkit-backdrop-filter:none!important; animation:none!important; transition:none!important; } }
  @media(forced-colors:active) { ${ROOT}[data-dcb-turn-surface="line"] [data-dcb-turn-head]::before { background:CanvasText!important; } }
  .dcb-turn-style-picker { border:0; padding:0; margin:0 0 18px; min-width:0; }
  .dcb-turn-style-picker legend { font-size:14px; font-weight:600; padding:0; }
  .dcb-turn-style-picker>p { color:var(--dsh-settings-secondary); font-size:12px; line-height:1.65; margin:6px 0 14px; }
  .dcb-turn-style-options { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
  .dcb-turn-style-option { display:grid; gap:7px; justify-items:center; font:inherit; min-width:0; padding:14px 10px; background:var(--dsh-settings-subtle); color:inherit; border:1px solid #8884; border-radius:12px; cursor:pointer; }
  .dcb-turn-style-option:hover { border-color:#8889; }
  .dcb-turn-style-option[aria-checked=true] { border-color:currentColor; background:var(--dsh-settings-surface); }
  .dcb-turn-style-option:focus-visible { outline:2px solid currentColor; outline-offset:3px; }
  .dcb-turn-style-option strong { font-size:13px; }
  .dcb-turn-style-option small { color:var(--dsh-settings-secondary); font-size:11px; line-height:1.5; }
  .dcb-turn-style-preview { display:grid; align-content:center; gap:10px; width:100%; height:58px; padding:8px 12px; box-sizing:border-box; }
  .dcb-turn-style-preview i { display:block; width:70%; height:3px; background:currentColor; opacity:.22; border-radius:2px; }
  .dcb-turn-style-preview i:first-child { width:40%; margin-left:auto; }
  [data-turn-preview=soft] { background:#8888880b; border:1px solid #8883; border-radius:10px; }
  [data-turn-preview=line] { border-bottom:1px solid #8885; }
  @media(max-width:480px) { .dcb-turn-style-options { gap:6px; } .dcb-turn-style-option { padding:10px 6px; } .dcb-turn-style-option small { font-size:10px; } }
  @container dcb-settings-page (max-width:400px) {
    .dcb-turn-style-options { grid-template-columns:minmax(0,1fr); }
    .dcb-turn-style-option { grid-template-columns:60px minmax(0,1fr); grid-template-rows:auto auto; column-gap:12px; row-gap:3px; justify-items:start; text-align:left; padding:10px 12px; }
    .dcb-turn-style-preview { grid-column:1; grid-row:1 / 3; height:46px; padding-inline:6px; gap:7px; }
    .dcb-turn-style-option strong,.dcb-turn-style-option small { grid-column:2; align-self:center; }
  }
  ${turnDividerSettingsCss}
`

export function normalizeTurnCards(value){
  return {turnGlass:value?.turnGlass===true,turnCardStyle:value?.turnCardStyle==='line'?'line':'soft',...normalizeTurnDivider(value)}
}

export function createTurnCardSettings(React,doc=globalThis.document,win=globalThis.window){
  const h=React.createElement
  const DividerSettings=createTurnDividerSettings(React,doc,win)
  const choices=[['default','默认','保留原始外观'],['soft','轻盈卡片','浅底色 · 细边框'],['line','极简分隔','留白 · 细分隔线']]
  return function TurnCardSettings({value,onChange,manager}){
    const selected=value.turnGlass?value.turnCardStyle:'default'
    const choose=style=>onChange({turnGlass:style!=='default',...(style!=='default'?{turnCardStyle:style}:{})})
    return h('fieldset',{className:'dcb-turn-style-picker'},
      h('legend',null,'对话分轮样式',h('span',{className:'dcb-cost-tag'},'低开销')),
      h('p',null,'用留白与细节区分每轮提问和回复，无背景模糊、折射或大面积阴影；独立于侧栏材质。'),
      h('div',{className:'dcb-turn-style-options',role:'radiogroup','aria-label':'对话分轮样式'},choices.map(([style,name,description],index)=>
        h('button',{type:'button',role:'radio',className:'dcb-turn-style-option',key:style,'aria-label':`对话分轮：${name}`,'aria-checked':selected===style,tabIndex:selected===style?0:-1,
          onClick:()=>choose(style),onKeyDown:event=>{
            let next=index
            if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%choices.length
            else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index+choices.length-1)%choices.length
            else if(event.key==='Home')next=0
            else if(event.key==='End')next=choices.length-1
            else return
            event.preventDefault();event.currentTarget.parentElement.children[next].focus();choose(choices[next][0])
          }},h('span',{className:'dcb-turn-style-preview','data-turn-preview':style,'aria-hidden':true},h('i'),h('i'),h('i')),h('strong',null,name),h('small',null,description)))),
      selected==='line'&&h(DividerSettings,{value,onChange,manager}))
  }
}

// Paint one background across a run of native siblings. The host owns their
// parents, order, anchors, scroll and content; nothing is wrapped or copied.
export function createTurnCards(doc,win,{enabled=true,style='soft',...initial}={}){
  const records=new Map(),rowGroups=new WeakMap(),pending=new Set(),geometry=new Set()
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let disposed=false,frame=0,measureFrame=0,active=enabled,material=style==='line'?'line':'soft',pendingKey=0
  let dividerOptions=normalizeTurnDivider(initial)
  const divider=createTurnDivider(doc,win);divider.setOptions(dividerOptions)
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
    for(const child of node.querySelectorAll(':scope > [data-dcb-turn-divider]'))child.remove()
  }
  const sweep=root=>{restore(root);for(const node of root.querySelectorAll(OWNED_SELECTOR))restore(node)}
  const scheduleMeasure=group=>{if(material==='line')return;geometry.add(group);if(!measureFrame&&!disposed)measureFrame=win.requestAnimationFrame(measure)}
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
    for(const group of changed){group.visible.size?mark(group.head,VISIBLE):group.head.removeAttribute(VISIBLE);if(material==='line')divider.sync(group.head,{visible:!!group.visible.size,first:group.head.hasAttribute(FIRST)})}
  },{rootMargin:'80px 0px'})
  function drop(group){
    group.live=false;geometry.delete(group);win.clearTimeout(group.timer);divider.remove(group.head)
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
    record.list=list;mark(root,SURFACE,material);mark(root,'data-dcb-divider-preset',dividerOptions.turnDividerPreset)
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
      for(const row of group.rows){restore(row);mark(row,ROW);rowGroups.set(row,group);if(material!=='line')resize.observe(row);exposure.observe(row)}
      mark(group.head,HEAD);mark(group.tail,TAIL);scheduleMeasure(group)
      const turn=Number(group.id.split(':')[1])
      if(!reduced.matches&&root.closest('[data-chat-following-tail]')&&(group.id.startsWith('pending:')||!acknowledged&&record.seeded&&turn>record.maxTurn)){
        mark(group.head,ARRIVING);group.timer=win.setTimeout(()=>{if(group.live)group.head.removeAttribute(ARRIVING)},motion.time.standard+30)
      }
    }
    for(let i=0;i<groups.length;i++){
      const group=groups[i];i===0?mark(group.head,FIRST):group.head.removeAttribute(FIRST)
      if(material==='line')divider.sync(group.head,{visible:!!group.visible.size,first:i===0});else divider.remove(group.head)
    }
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
      const nextDivider=normalizeTurnDivider({...dividerOptions,...options}),dividerChanged=JSON.stringify(nextDivider)!==JSON.stringify(dividerOptions)
      dividerOptions=nextDivider;divider.setOptions(dividerOptions)
      const wasActive=active,next=options.style==='line'?'line':'soft',materialChanged=next!==material,changed=active!==options.enabled||materialChanged
      active=options.enabled;material=next
      if(dividerChanged)for(const record of records.values())mark(record.root,'data-dcb-divider-preset',dividerOptions.turnDividerPreset)
      if(!changed)return
      if(active){
        if(!wasActive)sweep(doc.body)
        if(materialChanged)for(const record of records.values())for(const group of record.groups){
          if(material==='line'){geometry.delete(group);group.head.style.removeProperty(HEIGHT);for(const row of group.rows)resize.unobserve(row)}
          else{for(const row of group.rows)resize.observe(row);scheduleMeasure(group)}
        }
        doc.body.setAttribute(ENABLED,'');discover(doc.body)
      }
      else{doc.body.removeAttribute(ENABLED);win.cancelAnimationFrame(frame);frame=0;win.cancelAnimationFrame(measureFrame);measureFrame=0;pending.clear();for(const record of records.values())clear(record);records.clear();geometry.clear();sweep(doc.body)}
    },
    importImage:file=>divider.importImage(file),resetImage:()=>divider.resetImage(),
    dispose(){disposed=true;doc.body.removeAttribute(ENABLED);navigation.dispose();observer.disconnect();resize.disconnect();exposure.disconnect();win.cancelAnimationFrame(frame);win.cancelAnimationFrame(measureFrame);for(const record of records.values())clear(record);records.clear();pending.clear();geometry.clear();sweep(doc.body);divider.dispose()},
  }
}
