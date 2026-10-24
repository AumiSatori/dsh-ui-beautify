// Slot renderers may insert display:contents seats around the header and body.
// Resolve the nearest conversation instead of assuming they are direct siblings.
export function headerConversationBody(header){
  for(let owner=header?.parentElement;owner&&owner!==header.ownerDocument.body;owner=owner.parentElement){
    const candidates=[...owner.querySelectorAll('[data-conversation-content]')].filter(body=>!body.contains(header))
    const roots=candidates.filter(body=>!candidates.some(parent=>parent!==body&&parent.contains(body)))
    if(roots.length)return roots.length===1?roots[0]:null
    if(owner.hasAttribute('data-phase'))break
  }
  return null
}

export function conversationVisibleFlow(body){
  if(!body)return null
  const visible=element=>element?.closest('[data-conversation-content]')===body&&element.getClientRects().length>0
  for(const selector of ['[data-chat-flow]','[data-dcb-view-width=shared]']){
    const first=body.querySelector(selector)
    if(visible(first))return first
    if(first)for(const element of body.querySelectorAll(selector))if(visible(element))return element
  }
  return null
}
