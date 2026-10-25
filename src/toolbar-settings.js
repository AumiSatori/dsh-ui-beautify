import {motion} from './motion.js'

export const toolbarItems=[
  {id:'folder',label:'项目文件夹',hint:'打开项目目录与打开方式菜单',icon:'folder'},
  {id:'more',label:'更多操作',hint:'会话的更多操作菜单',icon:'more'},
  {id:'theme',label:'昼夜切换',hint:'保留原有昼夜切换与过渡',icon:'sun'},
  {id:'focus',label:'纯背景入口',hint:'仅隐藏入口；纯背景模式仍可按 Esc 退出',icon:'image'},
  {id:'summary',label:'任务面板入口',hint:'仅控制入口，不改变任务面板与文件预览功能',icon:'tasks'},
  {id:'settings',label:'设置入口',hint:'隐藏后仍可从左下账号菜单打开设置',icon:'settings'},
  {id:'rightSidebar',label:'右侧栏开关',hint:'仅控制入口，不关闭已经打开的右侧栏',icon:'sidebar'},
]
export const toolbarDefaultOrder=toolbarItems.map(item=>item.id)
export function normalizeToolbar(value){
  const input=value?.toolbar||value||{},order=Array.isArray(input.order)?input.order:[],hidden=Array.isArray(input.hidden)?input.hidden:[]
  return {order:[...new Set([...order.filter(id=>toolbarDefaultOrder.includes(id)),...toolbarDefaultOrder])],hidden:[...new Set(hidden.filter(id=>toolbarDefaultOrder.includes(id)))]}
}
const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`
const controls=`${names('headerUtilities')},${names('headerCorner')},.dcb-welcome-tools`
const ITEM='data-dcb-toolbar-item',HIDDEN='data-dcb-toolbar-hidden',LAYOUT='data-dcb-toolbar-layout',CONTAINER='data-dcb-toolbar-container'
export const toolbarSettingsCss=`
  [${HIDDEN}] { display:none!important; }
  header[${LAYOUT}] { position:relative; display:flex!important; flex-wrap:wrap!important; align-items:center; justify-content:flex-end; column-gap:8px; row-gap:8px; padding-inline-end:12px!important; reading-flow:flex-visual; }
  header[${LAYOUT}]:has(.dcb-welcome-tools) { min-height:50px!important; padding-block:10px!important; }
  header[${LAYOUT}] [${CONTAINER}] { display:contents!important; position:static!important; inset:auto!important; margin:0!important; padding:0!important; }
  header[${LAYOUT}] ${names('titleCluster')} { flex:1 1 240px!important; min-width:0; max-width:none!important; order:-1; }
  header[${LAYOUT}][data-dcb-caption-host] ${names('titleCluster')} { margin-inline-start:var(--dcb-caption-inset,0px); }
  header[${LAYOUT}] :is(${names('tabs')},[data-conversation-tabs]) { flex:1 0 100%; order:10000; }
  header[${LAYOUT}] [${ITEM}] { position:relative!important; inset:auto!important; flex:none!important; margin:0!important; order:var(--dcb-toolbar-order,1000); z-index:1; }
  header[${LAYOUT}] [${ITEM}][${HIDDEN}] { display:none!important; }
  header[${LAYOUT}] [${ITEM}]:is(.dcb-theme-toggle,.dcb-focus-toggle,.dcb-anchor,.dcb-header-settings) { align-self:center; }
  header[${LAYOUT}] [data-dcb-icon-group=right]::before { display:none!important; }
  .dcb-toolbar-pane { position:absolute; z-index:0; pointer-events:none; border:1px solid var(--dcb-icon-line,#8883); border-radius:15px; background:var(--dcb-icon-fill,#ffffffb8); box-shadow:inset 0 1px 0 #ffffff45,0 3px 12px #0000000b; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
  .dcb-toolbar-preview { display:flex; align-items:center; justify-content:flex-end; flex-wrap:wrap; gap:8px; min-height:62px; padding:12px 14px; margin:16px 0; border:1px solid var(--dsh-settings-border); border-radius:13px; background:var(--dsh-settings-subtle); }
  .dcb-toolbar-preview > span { display:grid; place-items:center; width:32px; height:32px; border:1px solid var(--dsh-settings-border); border-radius:9px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); }
  .dcb-toolbar-preview svg,.dcb-toolbar-item-icon svg { width:17px; height:17px; }
  .dcb-toolbar-preview small { margin-inline-end:auto; color:var(--dsh-settings-secondary); font-size:12px; }
  .dcb-toolbar-list { display:grid; overflow:clip; border:1px solid var(--dsh-settings-border); border-radius:14px; background:var(--dsh-settings-subtle); }
  .dcb-toolbar-row { display:flex; align-items:center; gap:12px; min-width:0; min-height:78px; padding:12px 14px 12px 5px; }
  .dcb-toolbar-row + .dcb-toolbar-row { border-top:1px solid var(--dsh-settings-border); }
  .dcb-toolbar-row[data-dragging] { background:var(--dsh-settings-surface); outline:1px solid var(--dsh-settings-accent); outline-offset:-1px; }
  .dcb-toolbar-row[data-off] .dcb-toolbar-item-icon { opacity:.45; }
  .dcb-toolbar-handle { display:grid; place-items:center; flex:none; width:44px; min-height:44px; padding:0; border:0; border-radius:8px; color:var(--dsh-settings-secondary); background:transparent; cursor:grab; touch-action:none; }
  .dcb-toolbar-handle::before { content:''; width:10px; height:16px; background:radial-gradient(circle,currentColor 1.1px,transparent 1.4px) 0 0/5px 5px; opacity:.6; }
  .dcb-toolbar-handle:active { cursor:grabbing; }
  .dcb-toolbar-item-icon { display:grid; place-items:center; flex:none; width:32px; height:32px; border:1px solid var(--dsh-settings-border); border-radius:9px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); }
  .dcb-toolbar-copy { flex:1; min-width:0; }
  .dcb-toolbar-copy strong { display:block; color:var(--dsh-settings-text); font:600 13px/20px system-ui,sans-serif; }
  .dcb-toolbar-copy p { margin:3px 0 0; color:var(--dsh-settings-secondary); font:12px/18px system-ui,sans-serif; overflow-wrap:anywhere; }
  .dcb-toolbar-controls { display:flex; align-items:center; gap:14px; flex:none; }
  .dcb-toolbar-arrows { display:flex; gap:2px; }
  .dcb-toolbar-arrows button,.dcb-toolbar-reset { display:inline-flex; align-items:center; justify-content:center; min-width:44px; min-height:44px; padding:7px; border:0; border-radius:8px; background:transparent; color:var(--dsh-settings-secondary); font:13px/20px system-ui; cursor:pointer; }
  .dcb-toolbar-arrows button svg { width:15px; height:15px; }
  .dcb-toolbar-arrows button:hover:enabled,.dcb-toolbar-handle:hover { background:#8881; color:var(--dsh-settings-text); }
  .dcb-toolbar-arrows button:disabled { opacity:.25; cursor:default; }
  .dcb-toolbar-reset { gap:6px; border:1px solid var(--dsh-settings-border); padding:8px 12px; }
  .dcb-toolbar-footer { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-top:16px; }
  .dcb-toolbar-footer p { flex:1 1 240px; margin:0; color:var(--dsh-settings-secondary); font:12px/19px system-ui; }
  .dcb-toolbar-settings :is(.dcb-toolbar-handle,.dcb-toolbar-arrows button,.dcb-toolbar-reset):focus-visible { outline:2px solid var(--dsh-settings-accent); outline-offset:-2px; }
  @container dcb-settings-page (max-width:580px) { .dcb-toolbar-row { flex-wrap:wrap; column-gap:8px; padding-right:12px; } .dcb-toolbar-copy { flex-basis:calc(100% - 100px); } .dcb-toolbar-controls { margin-left:auto; } }
  @media(pointer:coarse) { .dcb-toolbar-handle,.dcb-toolbar-arrows button { min-width:44px; } }
  @media(prefers-reduced-transparency:reduce),(forced-colors:active) { .dcb-toolbar-pane { backdrop-filter:none; -webkit-backdrop-filter:none; background:Canvas; box-shadow:none; } }
  @media(forced-colors:active) { .dcb-toolbar-list,.dcb-toolbar-preview,.dcb-toolbar-item-icon,.dcb-toolbar-preview > span,.dcb-toolbar-reset { background:Canvas; color:CanvasText; border-color:CanvasText; } .dcb-toolbar-row[data-dragging] { outline-color:Highlight; } }
`

function classify(seat){
  const has=selector=>seat.matches(selector)||seat.querySelector(selector)
  if(has('.dcb-theme-toggle'))return 'theme'
  if(has('.dcb-focus-toggle'))return 'focus'
  if(has('.dcb-entry'))return 'summary'
  if(has('[data-dcb-header-settings]'))return 'settings'
  if(has('[data-sidebar-right-expand]'))return 'rightSidebar'
  const buttons=seat.matches('button')?[seat]:[...seat.querySelectorAll('button')]
  const text=buttons.map(button=>button.getAttribute('aria-label')||button.getAttribute('title')||'').join(' ')
  if(/右侧(?:边)?栏|右边栏|right sidebar/i.test(text))return 'rightSidebar'
  if(/文件资源管理器|打开目录|open.*(?:folder|explorer)/i.test(text)||has('[data-dcb-icon=folder]'))return 'folder'
  if(/更多|more/i.test(text)||has('[data-dcb-icon=more]'))return 'more'
  return null
}

// Controls stay in their native React seats. CSS changes visual order; menus,
// handlers, theme scenes and focus-mode exit controls are never cloned or moved.
export function createToolbarLayout(doc,win){
  const records=new Map(),listeners=new Set();let snapshot=[],config=normalizeToolbar(),iconStyle='glass',disposed=false,frame=0
  const set=(record,node,key,value)=>{
    if(!record.attrs.has(node))record.attrs.set(node,new Map())
    const attrs=record.attrs.get(node);if(!attrs.has(key))attrs.set(key,node.getAttribute(key))
    if(value===null){if(node.hasAttribute(key))node.removeAttribute(key)}else if(node.getAttribute(key)!==value)node.setAttribute(key,value)
  }
  const restore=(node,key,value)=>value===null?node.removeAttribute(key):node.setAttribute(key,value)
  const restoreNode=(record,node)=>{for(const[key,value]of record.attrs.get(node)||[])restore(node,key,value);record.attrs.delete(node);const previous=record.orders.get(node);if(previous){const[value,priority]=previous;if(value)node.style.setProperty('--dcb-toolbar-order',value,priority);else node.style.removeProperty('--dcb-toolbar-order');record.orders.delete(node)}record.resize.unobserve(node)}
  const queue=()=>{if(!disposed&&!frame)frame=win.requestAnimationFrame(()=>{frame=0;refresh()})}
  function clearPanes(record){for(const pane of record.panes)pane.remove();record.panes=[]}
  function release(header,record){record.observer.disconnect();record.resize.disconnect();clearPanes(record);for(const[node,attrs]of record.attrs)for(const[key,value]of attrs)restore(node,key,value);for(const[node,[value,priority]]of record.orders){if(value)node.style.setProperty('--dcb-toolbar-order',value,priority);else node.style.removeProperty('--dcb-toolbar-order')}records.delete(header)}
  function panes(header,record,ordered){
    if(!ordered||iconStyle!=='glass'){clearPanes(record);return}
    const boxes=record.seats.filter(({node})=>node.getClientRects().length).map(({node})=>node.getBoundingClientRect()),rows=[]
    for(const box of boxes){let row=rows.find(row=>Math.abs(row.top-box.top)<10);if(!row){row={top:box.top,left:box.left,right:box.right,bottom:box.bottom};rows.push(row)}else{row.left=Math.min(row.left,box.left);row.right=Math.max(row.right,box.right);row.bottom=Math.max(row.bottom,box.bottom)}}
    const origin=header.getBoundingClientRect();while(record.panes.length>rows.length)record.panes.pop().remove()
    rows.forEach((row,index)=>{let pane=record.panes[index];if(!pane){pane=doc.createElement('div');pane.className='dcb-toolbar-pane';pane.setAttribute('aria-hidden','true');header.append(pane);record.panes.push(pane)}for(const[key,value]of Object.entries({left:`${row.left-origin.left-4}px`,top:`${row.top-origin.top-4}px`,width:`${row.right-row.left+8}px`,height:`${row.bottom-row.top+8}px`}))if(pane.style[key]!==value)pane.style[key]=value})
  }
  function refresh(){
    if(disposed)return
    const headers=[...doc.querySelectorAll('header')].filter(header=>!header.closest('.dcb-settings,[data-dcb-sidebar-layout-probe],[data-dcb-sidebar-ghost]')&&header.querySelector(controls)),available=new Set(),ordered=config.order.some((id,index)=>id!==toolbarDefaultOrder[index])
    for(const[header,record]of records)if(!headers.includes(header))release(header,record)
    for(const header of headers){
      let record=records.get(header)
      if(!record){record={attrs:new Map(),orders:new Map(),panes:[],seats:[],observer:new win.MutationObserver(entries=>{if(entries.some(entry=>[...entry.addedNodes,...entry.removedNodes].some(node=>node.nodeType===1&&!node.matches('.dcb-toolbar-pane'))))queue()}),resize:new win.ResizeObserver(queue)};record.observer.observe(header,{subtree:true,childList:true});record.resize.observe(header);records.set(header,record)}
      const containers=[...header.querySelectorAll(controls)],seats=[]
      for(const container of containers)for(const node of container.children){if(node.matches('.dcb-toolbar-pane,[hidden],.dcb-header-project')||!node.matches('button')&&!node.querySelector('button'))continue;const id=classify(node);if(id){seats.push({node,id});available.add(id)}}
      for(const {node}of record.seats)if(!seats.some(seat=>seat.node===node))restoreNode(record,node)
      for(const node of record.attrs.keys())if(node!==header&&!header.contains(node))restoreNode(record,node)
      record.seats=seats
      set(record,header,LAYOUT,ordered&&seats.length>0?'':null)
      for(const container of containers)set(record,container,CONTAINER,ordered?'controls':null)
      for(const row of header.querySelectorAll(names('titleRow')))set(record,row,CONTAINER,ordered?'row':null)
      for(const leading of header.querySelectorAll(names('headerLeading')))if(leading.querySelector('.dcb-welcome-tools'))set(record,leading,CONTAINER,ordered?'leading':null)
      for(const {node,id}of seats){
        set(record,node,ITEM,id);set(record,node,HIDDEN,config.hidden.includes(id)?'':null)
        if(!record.orders.has(node))record.orders.set(node,[node.style.getPropertyValue('--dcb-toolbar-order'),node.style.getPropertyPriority('--dcb-toolbar-order')])
        const order=String(config.order.indexOf(id)+1);if(node.style.getPropertyValue('--dcb-toolbar-order')!==order)node.style.setProperty('--dcb-toolbar-order',order)
        record.resize.observe(node)
      }
      panes(header,record,ordered)
    }
    const next=[...available].sort();if(next.join('|')!==snapshot.join('|')){snapshot=next;for(const listener of listeners)listener()}
  }
  return {sync(value){config=normalizeToolbar(value);iconStyle=value.iconStyle;refresh()},subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},getSnapshot:()=>snapshot,dispose(){disposed=true;if(frame)win.cancelAnimationFrame(frame);for(const[header,record]of records)release(header,record);listeners.clear()}}
}

function icon(h,kind){
  const paths={folder:'M3 7V5a1 1 0 0 1 1-1h5l2 3h9a1 1 0 0 1 1 1v11H3Z',more:'M5 12h.01M12 12h.01M19 12h.01',sun:'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',image:'M3 4h18v16H3ZM3 16l5-5 4 4 3-3 6 6M16 8h.01',tasks:'M5 5h14v16H5ZM9 3h6v4H9ZM8 11h8m-8 4h5',settings:'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z',sidebar:'M3 4h18v16H3ZM15 4v16',up:'m6 14 6-6 6 6',down:'m6 10 6 6 6-6'}
  return h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('path',{d:paths[kind]}))
}

export function createToolbarSettings(React,manager){
  const h=React.createElement
  return function ToolbarSettings({value,onChange}){
    const config=normalizeToolbar(value),available=React.useSyncExternalStore(manager.subscribe,manager.getSnapshot,manager.getSnapshot),[dragging,setDragging]=React.useState(null),drag=React.useRef(null),list=React.useRef(null),positions=React.useRef(new Map()),animations=React.useRef([])
    const commit=next=>{if(list.current)positions.current=new Map([...list.current.children].map(node=>[node.dataset.toolbarSetting,node.getBoundingClientRect().top]));onChange({toolbar:normalizeToolbar(next)})}
    const move=(id,target)=>{if(id===target)return;const order=config.order.filter(item=>item!==id),at=config.order.indexOf(target);order.splice(at,0,id);commit({...config,order})}
    React.useLayoutEffect(()=>{const next=new Map([...list.current.children].map(node=>[node.dataset.toolbarSetting,node.getBoundingClientRect().top]));for(const a of animations.current)a.cancel();animations.current=[];if(!dragging&&!window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches)for(const node of list.current.children){const old=positions.current.get(node.dataset.toolbarSetting),delta=old-next.get(node.dataset.toolbarSetting);if(Number.isFinite(delta)&&Math.abs(delta)>1){const animation=node.animate([{translate:`0 ${delta}px`},{translate:'0 0'}],{duration:motion.time.control,easing:motion.ease.smooth});animations.current.push(animation)}}positions.current=next;return()=>{for(const a of animations.current)a.cancel()}},[config.order.join('|')])
    const pointerEnd=event=>{if(!drag.current)return;try{event.currentTarget.releasePointerCapture(event.pointerId)}catch{}drag.current=null;setDragging(null)}
    return h('section',{className:'dcb-settings-block dcb-settings-card dcb-toolbar-settings','data-dcb-settings-block':'toolbar'},
      h('div',{className:'dcb-settings-header'},h('div',null,h('h2',null,'右上工具栏'),h('p',null,'调整入口顺序与显示，保留每个按钮原有的操作和动效。'))),
      h('div',{className:'dcb-toolbar-preview','aria-label':'工具栏排列预览'},h('small',null,'排列预览'),config.order.filter(id=>!config.hidden.includes(id)&&(id!=='summary'||value.enabled)).map(id=>{const item=toolbarItems.find(item=>item.id===id);return h('span',{key:id,title:item.label},icon(h,item.icon))})),
      h('p',{className:'dcb-settings-footnote'},'拖动左侧把手，或用上下按钮调整顺序。开关只控制入口显示，不会更改功能本身的开关。'),
      h('div',{className:'dcb-toolbar-list',ref:list},config.order.map((id,index)=>{
        const item=toolbarItems.find(item=>item.id===id),blocked=id==='summary'&&!value.enabled,shown=!config.hidden.includes(id)
        const reason=blocked?'任务面板功能已关闭。到「任务面板」启用后，这里的入口设置才会生效。':!available.includes(id)?`${item.hint}；当前页面未提供此入口，出现后自动应用。`:item.hint
        return h('div',{key:id,className:'dcb-toolbar-row','data-toolbar-setting':id,'data-dragging':dragging===id?'':undefined,'data-off':!shown||blocked?'':undefined},
          h('button',{type:'button',className:'dcb-toolbar-handle','aria-label':`拖动${item.label}调整位置`,onKeyDown:event=>{if(!['ArrowUp','ArrowDown'].includes(event.key))return;const target=config.order[index+(event.key==='ArrowUp'?-1:1)];if(target){event.preventDefault();move(id,target)}},onPointerDown:event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);drag.current={id,start:event.clientY};setDragging(id)},onPointerMove:event=>{if(!drag.current||Math.abs(event.clientY-drag.current.start)<6)return;const row=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-toolbar-setting]');if(row&&row.parentElement===list.current)move(drag.current.id,row.dataset.toolbarSetting)},onPointerUp:pointerEnd,onPointerCancel:pointerEnd}),
          h('span',{className:'dcb-toolbar-item-icon','aria-hidden':true},icon(h,item.icon)),
          h('div',{className:'dcb-toolbar-copy'},h('strong',null,item.label),h('p',{id:`dcb-toolbar-note-${id}`},reason)),
          h('div',{className:'dcb-toolbar-controls'},h('div',{className:'dcb-toolbar-arrows'},h('button',{type:'button','aria-label':`上移${item.label}`,disabled:index===0,onClick:()=>move(id,config.order[index-1])},icon(h,'up')),h('button',{type:'button','aria-label':`下移${item.label}`,disabled:index===config.order.length-1,onClick:()=>move(id,config.order[index+1])},icon(h,'down'))),h('button',{type:'button',className:'dcb-switch',role:'switch','aria-label':`显示${item.label}`,'aria-describedby':`dcb-toolbar-note-${id}`,'aria-checked':shown&&!blocked,disabled:blocked,onClick:()=>commit({...config,hidden:shown?[...config.hidden,id]:config.hidden.filter(item=>item!==id)})})))
      })),
      h('div',{className:'dcb-toolbar-footer'},h('p',null,'任务面板的功能开关优先于入口显示。隐藏设置图标后，可从左下角账号菜单重新进入设置。其他插件自行提供的图标保持原有逻辑。'),h('button',{type:'button',className:'dcb-toolbar-reset',onClick:()=>commit({})},'恢复工具栏默认排列')))
  }
}
