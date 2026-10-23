const MARK='data-dcb-header-centered'
const COMPACT='data-dcb-header-compact',TOOLS='--dcb-header-tools-inset',RIGHT='--dcb-header-tools-right',CORNER='--dcb-header-corner-width'
const LEFT='--dcb-header-content-left',END='--dcb-header-content-right',EMPTY='data-dcb-header-leading-empty',LEADING_ROW='data-dcb-header-leading-row'
const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`

export const headerLayoutCss=`
  header[${MARK}] { position:relative; display:grid; grid-template-columns:minmax(0,1fr); padding-left:var(${LEFT},24px); padding-right:var(${END},24px); }
  header[${MARK}] > ${names('headerLeading')} { position:absolute; top:10px; inset-inline-start:12px; width:auto; min-width:0; margin:0; }
  header[${MARK}] > ${names('headerLeading')}[${EMPTY}] { display:none; }
  header[${MARK}] > ${names('titleRow')} { grid-area:1/1; min-width:0; padding-inline:0 var(${TOOLS},0px); gap:8px 12px; }
  header[${LEADING_ROW}] > ${names('headerLeading')} { position:static; grid-area:1/1; justify-self:start; }
  header[${LEADING_ROW}] > ${names('titleRow')} { grid-area:2/1; }
  header[${MARK}] ${names('titleCluster')} { flex:1 1 320px; min-width:0; flex-wrap:wrap; gap:6px 10px; }
  header[${MARK}] ${names('crumbs')} { flex:0 1 auto; max-width:100%; }
  header[${MARK}] ${names('headerActions')} { flex-wrap:wrap; }
  header[${MARK}] ${names('headerUtilities')} { position:absolute; inset-block-start:10px; inset-inline-end:var(${RIGHT},50px); min-width:0; max-width:calc(100% - 96px); min-height:30px; flex-wrap:nowrap; gap:8px; margin:0; }
  header[${MARK}] ${names('headerCorner')} { position:absolute; inset-block-start:10px; inset-inline-end:12px; height:30px; gap:8px; margin:0; }
  header[${MARK}] ${names('headerUtilities')} .dcb-focus-toggle { margin-left:0; }
  header[${MARK}] ${names('headerUtilities')} .dcb-anchor { align-items:center; height:30px; }
  header[${MARK}] ${names('headerUtilities')} .dcb-entry { height:30px; }
  header[${MARK}] > [data-conversation-tabs] { grid-column:1/-1; justify-self:stretch; justify-content:flex-start; max-width:100%; flex-wrap:wrap; gap:24px; padding-left:0; }
  header[${COMPACT}] > ${names('titleRow')} { padding-inline-end:0; flex-wrap:wrap; }
  header[${COMPACT}] ${names('titleCluster')} { flex:1 1 100%; max-width:calc(100% - var(${CORNER},30px) - 8px); }
  header[${COMPACT}] ${names('headerUtilities')} { position:static; flex:1 1 100%; min-width:0; max-width:100%; flex-wrap:wrap; }
  .dcb-header-project { display:inline-flex; align-items:center; gap:10px; flex:0 1 auto; min-width:0; max-width:min(40%,260px); color:var(--dsw-alias-label-secondary,#707580); font-size:13px; line-height:22px; }
  .dcb-header-project-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dcb-header-project-separator { flex:none; opacity:.55; }
`

// Match actual Workspace membership, including a subagent's owning ancestor.
// A cwd alone does not make an ungrouped conversation belong to a project.
export function headerProjectLabel(items,byId,sessionId){
  const seen=new Set()
  for(let id=sessionId;id&&!seen.has(id);){
    seen.add(id)
    const project=items?.find(item=>item.sessionIds?.includes(id))
    if(project)return String(project.title||String(project.path||'').replace(/[\\/]+$/,'').split(/[\\/]/).pop()||'').trim()
    const session=byId?.[id]
    id=session?.origin==='subagent'?session.parentId:null
  }
  return ''
}

// Keep the native controls, slots, menus and window drag region in place.
// Title and tabs follow the real text column. Native right-hand tools stay at the
// actual conversation edge; resize publication reserves their measured width.
export function createHeaderLayout(doc,win){
  const records=new Map(),projects=new Map()
  const restore=(header,value)=>value===null?header.removeAttribute(MARK):header.setAttribute(MARK,value)
  const set=(node,key,value)=>{if(node.style.getPropertyValue(key)!==value)node.style.setProperty(key,value)}
  function update(header,record){
    if(!header.isConnected)return
    const bounds=header.getBoundingClientRect(),chat=record.body?.querySelector('[data-chat-flow]'),flow=chat?.getClientRects().length?chat:record.body?.querySelector('[data-dcb-view-width=shared]')
    if(record.flow!==flow){if(record.flow)record.resize.unobserve(record.flow);if(flow)record.resize.observe(flow);record.flow=flow}
    let left=24,right=24
    if(flow?.getClientRects().length){const box=flow.getBoundingClientRect();left=Math.max(0,box.left-bounds.left);right=Math.max(0,bounds.right-box.right)}
    set(header,LEFT,left+'px');set(header,END,right+'px')
    const empty=!record.leading?.textContent.trim()&&!record.leading?.querySelector('button,a,input,svg,img,canvas,[tabindex]')
    record.leading?.toggleAttribute(EMPTY,empty)
    const leadingWidth=empty?0:record.leading?.getBoundingClientRect().width||0
    header.toggleAttribute(LEADING_ROW,leadingWidth>0&&left<leadingWidth+24)
    const compact=header.clientWidth<900,corner=record.corner?.getBoundingClientRect().width||0
    header.toggleAttribute(COMPACT,compact)
    set(header,CORNER,corner+'px');set(header,RIGHT,(corner?corner+20:12)+'px')
    let inset=0
    if(!compact&&record.row&&record.tools?.getClientRects().length){
      const row=record.row.getBoundingClientRect(),tools=record.tools.getBoundingClientRect()
      inset=Math.max(0,(win.getComputedStyle(header).direction==='rtl'?tools.right-row.left:row.right-tools.left)+12)
    }
    set(header,TOOLS,inset+'px')
  }
  function release(header,record){
    record.resize.disconnect();restore(header,record.mark)
    if(record.leadingRow===null)header.removeAttribute(LEADING_ROW);else header.setAttribute(LEADING_ROW,record.leadingRow)
    if(record.leading){if(record.empty===null)record.leading.removeAttribute(EMPTY);else record.leading.setAttribute(EMPTY,record.empty)}
    if(record.compact===null)header.removeAttribute(COMPACT);else header.setAttribute(COMPACT,record.compact)
    for(const [key,value,priority]of record.variables){if(value)header.style.setProperty(key,value,priority);else header.style.removeProperty(key)}
    records.delete(header)
  }
  function sync(enabled){
    for(const [header,project]of projects){if(!header.isConnected){project.node?.remove();projects.delete(header)}else paintProject(header,project)}
    const headers=enabled?[...doc.querySelectorAll('header:has(> [data-conversation-header-leading])')].filter(header=>!header.closest('[data-dcb-sidebar-layout-probe]')):[]
    for(const [header,record]of records)if(!headers.includes(header))release(header,record)
    for(const header of headers){
      const row=header.querySelector(names('titleRow')),tools=row?.querySelector(names('headerUtilities')),corner=row?.querySelector(names('headerCorner')),leading=header.querySelector('[data-conversation-header-leading]'),body=header.parentElement?.querySelector('[data-conversation-content]')
      let record=records.get(header)
      if(record&&(record.row!==row||record.tools!==tools||record.corner!==corner||record.body!==body||record.leading!==leading)){release(header,record);record=null}
      if(record){update(header,record);continue}
      record={row,tools,corner,body,leading,leadingRow:header.getAttribute(LEADING_ROW),empty:leading?.getAttribute(EMPTY)??null,mark:header.getAttribute(MARK),compact:header.getAttribute(COMPACT),variables:[TOOLS,RIGHT,CORNER,LEFT,END].map(key=>[key,header.style.getPropertyValue(key),header.style.getPropertyPriority(key)])}
      record.resize=new win.ResizeObserver(()=>update(header,record))
      for(const node of [header,tools,corner,body,body?.querySelector('[data-chat-flow]'),body?.querySelector('[data-conversation-scroll]')])if(node)record.resize.observe(node)
      records.set(header,record);header.setAttribute(MARK,'');update(header,record)
    }
  }
  function paintProject(header,project){
    const cluster=header.querySelector(names('titleCluster')),crumbs=cluster?.querySelector(names('crumbs'))
    if(!project.label||!crumbs){project.node?.remove();return}
    if(!project.node){
      const node=doc.createElement('span'),label=doc.createElement('span'),separator=doc.createElement('span')
      node.className='dcb-header-project';label.className='dcb-header-project-label';separator.className='dcb-header-project-separator';separator.textContent='/';separator.setAttribute('aria-hidden','true');node.append(label,separator);project.node=node
    }
    if(project.node.firstChild.textContent!==project.label)project.node.firstChild.textContent=project.label
    if(project.node.title!==project.label)project.node.title=project.label
    if(project.node.parentElement!==cluster||project.node.nextSibling!==crumbs)cluster.insertBefore(project.node,crumbs)
  }
  return{sync,publishProject(header,label,owner){const previous=projects.get(header);if(previous&&previous.owner!==owner)previous.node?.remove();const project=previous?.owner===owner?previous:{owner};project.label=label;projects.set(header,project);paintProject(header,project)},forgetProject(header,owner){const project=projects.get(header);if(project?.owner===owner){project.node?.remove();projects.delete(header)}},dispose(){for(const [header,record]of records)release(header,record);for(const project of projects.values())project.node?.remove();projects.clear()}}
}
