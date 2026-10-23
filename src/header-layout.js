const MARK='data-dcb-header-centered'
const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`

export const headerLayoutCss=`
  header[${MARK}] { display:grid; grid-template-columns:auto minmax(0,1fr); padding-inline:max(24px,calc((100% - 1160px)/2)); }
  header[${MARK}] > ${names('headerLeading')} { grid-area:1/1; align-self:start; margin-right:10px; }
  header[${MARK}] > ${names('headerLeading')}:empty { display:none; margin:0; }
  header[${MARK}] > ${names('titleRow')} { grid-area:1/2; min-width:0; padding-inline-start:0; flex-wrap:wrap; gap:8px 12px; }
  header[${MARK}] ${names('titleCluster')} { flex:1 1 320px; min-width:0; flex-wrap:wrap; gap:6px 10px; }
  header[${MARK}] ${names('crumbs')} { flex:0 1 auto; max-width:100%; }
  header[${MARK}] ${names('headerActions')} { flex-wrap:wrap; }
  header[${MARK}] ${names('headerUtilities')} { flex:0 1 auto; min-width:0; max-width:100%; flex-wrap:wrap; gap:8px; margin-left:0; }
  header[${MARK}] ${names('headerCorner')} { margin:0 0 0 auto; }
  header[${MARK}] > [data-conversation-tabs] { grid-column:1/-1; justify-self:center; justify-content:center; max-width:100%; flex-wrap:wrap; gap:24px; padding-left:0; }
  @container (max-width:680px) {
    header[${MARK}] ${names('titleCluster')} { flex-basis:100%; }
    header[${MARK}] ${names('headerUtilities')} { flex:1 1 0; }
    header[${MARK}] ${names('headerCorner')} { align-self:flex-start; }
  }
`

// Keep the native controls, slots, menus and window drag region in place.
// Grid centers the whole header group; wrapping does not need a resize loop.
export function createHeaderLayout(doc){
  const records=new Map()
  const restore=(header,value)=>value===null?header.removeAttribute(MARK):header.setAttribute(MARK,value)
  function sync(enabled){
    const headers=enabled?[...doc.querySelectorAll('header:has(> [data-conversation-header-leading])')].filter(header=>!header.closest('[data-dcb-sidebar-layout-probe]')):[]
    for(const [header,value]of records)if(!headers.includes(header)){restore(header,value);records.delete(header)}
    for(const header of headers)if(!records.has(header)){records.set(header,header.getAttribute(MARK));header.setAttribute(MARK,'')}
  }
  return{sync,dispose(){for(const [header,value]of records)restore(header,value);records.clear()}}
}
