const SIDEBAR=':is([class$="_sidebarCol"],[class*="_sidebarCol "])'
const LOCAL=`[data-composer-card], .dcb-summary, .dcb-settings, .dcb-style-swatch, [data-testid="todo-panel"], [data-conversation-tabs], ${SIDEBAR}`
const STRUCTURE=`${LOCAL}, [data-conversation-content], [data-chat-flow]`
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

export function affectsScroll(target,doc){
  if(target===doc||target===doc.documentElement||target===doc.body)return true
  const el=element(target)
  return !!el&&(!!el.closest(`${LOCAL}, [data-conversation-scroll]`)||!!el.querySelector(LOCAL))
}
