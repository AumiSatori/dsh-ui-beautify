const CONTENT = '[data-conversation-content][data-conversation-session]'
const decode = value => { try { return decodeURIComponent(value) } catch { return null } }

// Read the native reference's full title/address, never its abbreviated label.
export function chatFileTarget(element) {
  const source = element?.closest?.('a[href],button[title],[role="button"][title]')
  const content = source?.closest(CONTENT), sessionId = content?.dataset.conversationSession
  if (!sessionId || !source.closest('[data-chat-flow],[data-chat-turn]') || source.closest('[data-composer-seat],[data-dcb-summary-for],[hidden],[inert]')) return null
  let path = null
  const href = source.getAttribute('href') || ''
  if (href.startsWith('dsh-resource://file/session/')) {
    const rest = href.slice('dsh-resource://file/session/'.length), slash = rest.indexOf('/')
    if (slash < 0 || decode(rest.slice(0,slash)) !== sessionId) return null
    path = decode(rest.slice(slash+1))
  } else if (/^file:\/\//i.test(href)) {
    try { const url = new URL(href); path = decode(url.pathname); if (path === null) return null; if (url.hostname) path = `//${url.hostname}${path}`; else if (/^\/[a-z]:\//i.test(path)) path = path.slice(1) } catch { return null }
  } else if (href && !/^[a-z]:[/\\]/i.test(href) && /^[a-z][a-z\d+.-]*:/i.test(href)) return null
  else {
    const title = source.getAttribute('title')?.trim().replace(/^@(?:"([\s\S]*)"|([\s\S]*))$/,(_,quoted,plain)=>quoted??plain)
    const candidate = title || (source.tagName === 'A' ? decode(href) : '')
    if (candidate && (/^(?:[a-z]:[/\\]|\\\\|\/|\.\.?[/\\]|~[/\\])/i.test(candidate) || /^[^\s<>]+[/\\][^<>]+$/.test(candidate) || /^[^<>/\\]+\.[a-z\d]{1,12}(?::\d+(?::\d+)?)?$/i.test(candidate))) path = candidate
  }
  if (!path || /[\u0000-\u001f\u007f]/.test(path) || /^(?:javascript|data|https?):/i.test(path)) return null
  path = path.replace(/:\d+(?::\d+)?$/,'')
  return {source,content,sessionId,file:{path}}
}

export function createChatFileContextMenu(React,doc,win,FileContextMenu) {
  return function ChatFileContextMenu({sessionId,actionsFor}) {
    const [selection,setSelection] = React.useState(null)
    React.useEffect(() => {
      const open = event => {
        if (event.defaultPrevented) return
        const target = chatFileTarget(event.target)
        if (!target || target.sessionId !== sessionId || !target.content.getClientRects().length || win.getComputedStyle(target.content).visibility === 'hidden') return
        event.preventDefault(); event.stopPropagation()
        const box = target.source.getBoundingClientRect(), pointer = event.clientX !== 0 || event.clientY !== 0
        setSelection({...target,request:{x:pointer?event.clientX:box.left+8,y:pointer?event.clientY:box.bottom}})
      }
      doc.addEventListener('contextmenu',open)
      return () => doc.removeEventListener('contextmenu',open)
    },[sessionId])
    React.useEffect(() => { setSelection(null) },[sessionId])
    if (!selection || selection.sessionId !== sessionId || !selection.source.isConnected || selection.content.dataset.conversationSession !== sessionId) return null
    return React.createElement(FileContextMenu,{file:selection.file,request:selection.request,...actionsFor?.(sessionId,selection.file),onOpen:()=>{ if (selection.source.isConnected) selection.source.click() }})
  }
}
