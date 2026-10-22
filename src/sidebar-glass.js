const MARK='data-dcb-sidebar-style',COLUMN='data-dcb-sidebar-column',MOTION='data-dcb-sidebar-motion'
const suffix=(el,name)=>[...el.classList].some(value=>value.endsWith('_'+name))
const visible=el=>el.isConnected&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'
export function createSidebarGlass(doc,win,schedule){
  const records=new Map()
  const restore=(el,name,value)=>value===null?el.removeAttribute(name):el.setAttribute(name,value)
  const set=(el,name,value)=>{if(el.getAttribute(name)!==value)el.setAttribute(name,value)}
  function release(record){
    record.resize.disconnect();record.indicator.remove()
    restore(record.root,MARK,record.style);restore(record.root,MOTION,record.motion);restore(record.column,COLUMN,record.columnMark)
  }
  function roots(){
    return [...doc.querySelectorAll('[class$="_sidebarCol"], [class*="_sidebarCol "]')].flatMap(column=>{
      const root=[...column.querySelectorAll('[class$="_root"], [class*="_root "]')].find(el=>[...el.children].some(child=>suffix(child,'logoRow')))
      return root?[{column,root}]:[]
    })
  }
  function sync(style,motion){
    const incoming=style==='milk'?[]:roots(),wanted=new Set(incoming.map(item=>item.root))
    for(const [root,record] of records)if(!wanted.has(root)){release(record);records.delete(root)}
    for(const {root,column} of incoming){
      let record=records.get(root)
      if(!record){
        const indicator=doc.createElement('span');indicator.className='dcb-sidebar-indicator';indicator.setAttribute('aria-hidden','true')
        record={root,column,indicator,style:root.getAttribute(MARK),motion:root.getAttribute(MOTION),columnMark:column.getAttribute(COLUMN),placed:false}
        record.resize=new win.ResizeObserver(schedule);record.resize.observe(root);records.set(root,record)
      }
      set(root,MARK,style);set(root,MOTION,String(motion));set(column,COLUMN,'')
      if(record.indicator.parentElement!==root)root.append(record.indicator)
      const selected=[...root.querySelectorAll('[aria-selected="true"], [aria-current="page"], [class$="_selected"], [class*="_selected "]')].find(el=>visible(el)&&(suffix(el,'sessionRow')||suffix(el,'searchResultRow')||el.getAttribute('role')==='treeitem'))
      const indicator=record.indicator
      if(!selected||!visible(root)){indicator.hidden=true;continue}
      const r=selected.getBoundingClientRect(),origin=root.getBoundingClientRect()
      let top=origin.top,bottom=origin.bottom
      for(let parent=selected.parentElement;parent&&parent!==root;parent=parent.parentElement){if(/auto|scroll|hidden|clip/.test(win.getComputedStyle(parent).overflowY)){const clip=parent.getBoundingClientRect();top=Math.max(top,clip.top);bottom=Math.min(bottom,clip.bottom)}}
      indicator.hidden=r.top<top-.5||r.bottom>bottom+.5
      for(const [key,value] of Object.entries({width:`${r.width}px`,height:`${r.height}px`,transform:`translate(${r.left-origin.left}px, ${r.top-origin.top}px)`}))if(indicator.style[key]!==value)indicator.style[key]=value
      if(!record.placed){record.placed=true;win.requestAnimationFrame(()=>{if(records.has(root))set(indicator,'data-ready','true')})}
    }
    return [...records.keys()]
  }
  return {sync,dispose(){for(const record of records.values())release(record);records.clear()}}
}
