const MARK='data-dcb-header-centered'
const COMPACT='data-dcb-header-compact',TOOLS='--dcb-header-tools-inset',RIGHT='--dcb-header-tools-right',CORNER='--dcb-header-corner-width'
const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`

export const headerLayoutCss=`
  header[${MARK}] { position:relative; display:grid; grid-template-columns:auto minmax(0,1fr); padding-inline:max(24px,calc((100% - 1160px)/2)); }
  header[${MARK}] > ${names('headerLeading')} { grid-area:1/1; align-self:start; margin-right:10px; }
  header[${MARK}] > ${names('headerLeading')}:empty { display:none; margin:0; }
  header[${MARK}] > ${names('titleRow')} { grid-area:1/2; min-width:0; padding-inline:0 var(${TOOLS},0px); gap:8px 12px; }
  header[${MARK}] ${names('titleCluster')} { flex:1 1 320px; min-width:0; flex-wrap:wrap; gap:6px 10px; }
  header[${MARK}] ${names('crumbs')} { flex:0 1 auto; max-width:100%; }
  header[${MARK}] ${names('headerActions')} { flex-wrap:wrap; }
  header[${MARK}] ${names('headerUtilities')} { position:absolute; inset-block-start:10px; inset-inline-end:var(${RIGHT},50px); min-width:0; max-width:calc(100% - 96px); min-height:30px; flex-wrap:nowrap; gap:8px; margin:0; }
  header[${MARK}] ${names('headerCorner')} { position:absolute; inset-block-start:10px; inset-inline-end:12px; height:30px; gap:8px; margin:0; }
  header[${MARK}] ${names('headerUtilities')} .dcb-focus-toggle { margin-left:0; }
  header[${MARK}] ${names('headerUtilities')} .dcb-anchor { align-items:center; height:30px; }
  header[${MARK}] ${names('headerUtilities')} .dcb-entry { height:30px; }
  header[${MARK}] > [data-conversation-tabs] { grid-column:1/-1; justify-self:center; justify-content:center; max-width:100%; flex-wrap:wrap; gap:24px; padding-left:0; }
  header[${COMPACT}] > ${names('titleRow')} { padding-inline-end:0; flex-wrap:wrap; }
  header[${COMPACT}] ${names('titleCluster')} { flex:1 1 100%; max-width:calc(100% - var(${CORNER},30px) - 8px); }
  header[${COMPACT}] ${names('headerUtilities')} { position:static; flex:1 1 100%; min-width:0; max-width:100%; flex-wrap:wrap; }
`

// Keep the native controls, slots, menus and window drag region in place.
// Only title/tabs use the centered width. Native right-hand tools stay at the
// actual conversation edge; resize publication reserves their measured width.
export function createHeaderLayout(doc,win){
  const records=new Map()
  const restore=(header,value)=>value===null?header.removeAttribute(MARK):header.setAttribute(MARK,value)
  const set=(node,key,value)=>{if(node.style.getPropertyValue(key)!==value)node.style.setProperty(key,value)}
  function update(header,record){
    if(!header.isConnected)return
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
    if(record.compact===null)header.removeAttribute(COMPACT);else header.setAttribute(COMPACT,record.compact)
    for(const [key,value,priority]of record.variables){if(value)header.style.setProperty(key,value,priority);else header.style.removeProperty(key)}
    records.delete(header)
  }
  function sync(enabled){
    const headers=enabled?[...doc.querySelectorAll('header:has(> [data-conversation-header-leading])')].filter(header=>!header.closest('[data-dcb-sidebar-layout-probe]')):[]
    for(const [header,record]of records)if(!headers.includes(header))release(header,record)
    for(const header of headers){
      const row=header.querySelector(names('titleRow')),tools=row?.querySelector(names('headerUtilities')),corner=row?.querySelector(names('headerCorner'))
      let record=records.get(header)
      if(record&&(record.row!==row||record.tools!==tools||record.corner!==corner)){release(header,record);record=null}
      if(record)continue
      record={row,tools,corner,mark:header.getAttribute(MARK),compact:header.getAttribute(COMPACT),variables:[TOOLS,RIGHT,CORNER].map(key=>[key,header.style.getPropertyValue(key),header.style.getPropertyPriority(key)])}
      record.resize=new win.ResizeObserver(()=>update(header,record))
      for(const node of [header,tools,corner])if(node)record.resize.observe(node)
      records.set(header,record);header.setAttribute(MARK,'');update(header,record)
    }
  }
  return{sync,dispose(){for(const [header,record]of records)release(header,record)}}
}
