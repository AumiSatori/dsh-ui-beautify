const SIDEBAR=':is([class$="_sidebarCol"],[class*="_sidebarCol "])'
const LOCAL=`[data-composer-card], .dcb-summary, .dcb-settings, .dcb-style-swatch, [data-testid="todo-panel"], [data-conversation-tabs], [data-conversation-header-leading], ${SIDEBAR}`
const STRUCTURE=`${LOCAL}, [data-conversation-content], [data-chat-flow], [data-conversation-header-leading]`
const element=node=>node?.nodeType===1?node:node?.parentElement
const containsUI=node=>node?.nodeType===1&&(node.matches(STRUCTURE)||node.querySelector(STRUCTURE))

// Streaming text is owned by the message manager. The presentation manager only
// needs a rescan when controls, materials, panel structure or geometry can change.
export function affectsPresentation(records){
  return records.some(record=>{
    const target=element(record.target)
    if(!target)return false
    if(record.type==='attributes'){
      // Global classes can change theme typography and local sampled colors.
      if(target===target.ownerDocument.body||target===target.ownerDocument.documentElement)return true
      if(target.closest(LOCAL))return true
      if(target.closest('[data-chat-flow]'))return false
      return !!containsUI(target)
    }
    if(target.closest(LOCAL))return true
    return [...record.addedNodes,...record.removedNodes].some(containsUI)
  })
}

// A transcript scroll (or a thinking/code box scrolling inside it) moves no
// control. Only the task panel follows it, so it asks for geometry, not a rescan.
export function scrollScope(target,doc){
  if(target===doc||target===doc.documentElement||target===doc.body)return'full'
  const el=element(target)
  if(!el)return''
  if(el.closest(LOCAL))return'full'
  if(el.closest('[data-conversation-scroll]'))return'geometry'
  return el.querySelector(LOCAL)?'full':''
}

export function affectsScroll(target,doc){
  if(target===doc||target===doc.documentElement||target===doc.body)return true
  const el=element(target)
  return !!el&&(!!el.closest(`${LOCAL}, [data-conversation-scroll]`)||!!el.querySelector(LOCAL))
}
