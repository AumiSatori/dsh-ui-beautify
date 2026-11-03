const CONTENT = '[data-conversation-content][data-conversation-session]'
const EXCLUDE = '[hidden],[inert],[aria-hidden="true"],script,style,svg,textarea,input,select,[contenteditable="true"],[data-composer-seat],[data-dcb-summary-for],[data-dcb-sidebar-layout-probe],nav'
const BLOCK = 'p,li,pre,td,th,h1,h2,h3,h4,h5,h6,blockquote,[data-chat-flow-key]'
const ALL = 'dcb-conversation-find', CURRENT = 'dcb-conversation-find-current'
const icons = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  previous: '<path d="m6 14 6-6 6 6"/>', next: '<path d="m6 10 6 6 6-6"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
}
const svg = kind => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[kind]}</svg>`

export const conversationSearchCss = `
  ::highlight(${ALL}) { background:#e8c85a80; color:inherit; }
  ::highlight(${CURRENT}) { background:#ed9b3ce6; color:#191919; text-decoration:underline; }
  .dcb-find { position:fixed; z-index:2147482000; display:grid; gap:6px; width:350px; max-width:calc(100vw - 24px); padding:10px; border:1px solid #2222; border-radius:12px; color:#292b30; background:rgba(249,249,250,.97); box-shadow:0 12px 36px #0002; backdrop-filter:blur(16px); font:12px/18px system-ui,sans-serif; }
  .dcb-find,.dcb-find * { box-sizing:border-box; }
  .dcb-find-row { display:flex; align-items:center; gap:4px; }
  .dcb-find svg { display:block; width:17px; height:17px; flex:none; }
  .dcb-find input { width:0; min-width:0; flex:1; height:32px; padding:0 8px; border:1px solid #2223; border-radius:7px; outline:none; background:transparent; color:inherit; font:13px system-ui,sans-serif; transition:border-color 180ms,box-shadow 180ms; }
  .dcb-find input:focus { border-color:#5559; box-shadow:0 0 0 3px #8882; }
  .dcb-find button { display:grid; place-items:center; flex:none; width:28px; height:30px; padding:0; border:0; border-radius:7px; color:inherit; background:transparent; cursor:pointer; transition:background-color 180ms,transform 180ms; }
  .dcb-find button:hover:not(:disabled),.dcb-find button:focus-visible { background:#8882; outline:1px solid #8886; }
  .dcb-find button:active:not(:disabled) { transform:scale(.9); }
  .dcb-find button:disabled { opacity:.3; cursor:default; }
  .dcb-find-count { min-width:40px; text-align:center; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .dcb-find-note { padding-left:2px; color:#75777e; font-size:11px; }
  .dcb-find[data-empty] input { border-color:#b66a5c; }
  .dcb-find-entry { display:inline-grid; place-items:center; width:28px; height:28px; padding:5px; border:0; border-radius:8px; background:transparent; color:inherit; cursor:pointer; transition:background-color 180ms,transform 180ms; }
  .dcb-find-entry svg { width:17px; height:17px; }
  .dcb-find-entry:hover,.dcb-find-entry:focus-visible { background:#8882; }
  .dcb-find-entry:active { transform:scale(.9); }
  body[data-ds-dark-theme] .dcb-find { color:#e4e4e7; background:rgba(35,35,39,.97); border-color:#fff3; box-shadow:0 12px 36px #0006; }
  body[data-ds-dark-theme] .dcb-find input { border-color:#fff3; }
  body[data-ds-dark-theme] .dcb-find input:focus { border-color:#bbb9; }
  body[data-ds-dark-theme] .dcb-find-note { color:#a2a2aa; }
  @media(forced-colors:active) { .dcb-find { background:Canvas; color:CanvasText; border-color:CanvasText; box-shadow:none; backdrop-filter:none; } .dcb-find input { border-color:CanvasText; } ::highlight(${ALL}),::highlight(${CURRENT}) { background:Highlight; color:HighlightText; } }
  @media(prefers-reduced-motion:reduce) { .dcb-find input,.dcb-find button,.dcb-find-entry { transition:none; } }
`

// CSS Highlight ranges leave React's text nodes, links, selections and copy intact.
// Index only on demand; the transcript observer exists only while the bar is open.
export function createConversationSearch(doc, win) {
  const quiet = win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let enabled = true, disposed = false, root = null, session = null, bar = null, input = null, count = null, note = null
  let matches = [], current = -1, timer = 0, exitTimer = 0, animation = null, previous = null, last = null, capped = false
  const registry = win.CSS?.highlights, supported = !!registry && typeof win.Highlight === 'function'
  const visible = node => !!node?.isConnected && !node.closest('[hidden],[inert],[aria-hidden="true"],[data-dcb-sidebar-layout-probe]') && node.getClientRects().length > 0 && win.getComputedStyle(node).visibility !== 'hidden'
  const observer = new win.MutationObserver(() => { if (!timer) timer = win.setTimeout(() => { timer = 0; if (sync()) search(false) }, 120) })
  const resize = new win.ResizeObserver(() => { if (sync()) position() })
  const clearHighlights = () => { registry?.delete(ALL); registry?.delete(CURRENT); matches = []; current = -1 }
  function motion(out = false) {
    animation?.cancel(); animation = null
    if (quiet.matches || !bar?.animate) return
    const node = bar
    animation = node.animate(out ? [{opacity:1,transform:'none',filter:'blur(0)'},{opacity:0,transform:'translateY(-8px) scale(.94)',filter:'blur(3px)'}] : [{opacity:0,transform:'translateY(-8px) scale(.94)',filter:'blur(3px)'},{opacity:1,transform:'none',filter:'blur(0)'}], {duration:200,easing:'cubic-bezier(.22,.8,.26,1)',fill:'both'})
    animation.finished.then(() => { if (!out && node === bar) { animation?.cancel(); animation = null } }, () => {})
  }
  function close(restore = true, immediate = false) {
    if (!bar) return
    observer.disconnect(); resize.disconnect(); win.clearTimeout(timer); timer = 0
    clearHighlights(); root = null; session = null
    if (restore && previous?.isConnected && bar.contains(doc.activeElement)) previous.focus?.({preventScroll:true})
    previous = null
    const node = bar
    if (immediate || quiet.matches) { animation?.cancel(); node.remove(); bar = input = count = note = null; return }
    node.inert = true; node.setAttribute('aria-hidden','true'); motion(true)
    win.clearTimeout(exitTimer)
    exitTimer = win.setTimeout(() => { animation?.cancel(); animation = null; node.remove(); if (node === bar) bar = input = count = note = null; exitTimer = 0 }, 200)
  }
  function sync() {
    if (!root) return false
    if (!enabled || !visible(root) || root.dataset.conversationSession !== session || !visible(root.querySelector('[data-chat-flow]'))) { close(false); return false }
    return true
  }
  function position() {
    if (!bar || !root) return
    const box = root.getBoundingClientRect(), width = bar.offsetWidth
    bar.style.left = `${Math.max(12,Math.min(box.right-width-12,win.innerWidth-width-12))}px`
    bar.style.top = `${Math.max(12,Math.min(box.top+12,win.innerHeight-bar.offsetHeight-12))}px`
  }
  function render() {
    if (!bar) return
    count.textContent = `${current < 0 ? 0 : current+1}/${matches.length}${capped ? '+' : ''}`
    bar.toggleAttribute('data-empty', !!input.value && !matches.length)
    for (const button of bar.querySelectorAll('[data-find-direction]')) button.disabled = !matches.length
    note.textContent = !supported ? '当前浏览器不支持会话高亮搜索' : !input.value ? '当前会话 · 已加载内容' : matches.length ? 'Enter 下一处 · Shift+Enter 上一处' : '未找到匹配 · 仅搜索已加载且展开的内容'
  }
  function highlight() {
    registry?.delete(CURRENT)
    if (matches[current]) registry.set(CURRENT, new win.Highlight(matches[current]))
    render()
  }
  function reveal() {
    const range = matches[current]
    if (!range || !sync()) return
    // Move only the native conversation scrollport, never the page or composer.
    const node = range.startContainer.parentElement
    let scroll = node
    while (scroll && root.contains(scroll)) {
      const style = win.getComputedStyle(scroll)
      if (/(auto|scroll)/.test(style.overflowY) && scroll.scrollHeight > scroll.clientHeight) {
        const box = range.getBoundingClientRect(), viewport = scroll.getBoundingClientRect()
        scroll.scrollBy({top:box.top-viewport.top-scroll.clientHeight*.42,behavior:quiet.matches?'instant':'smooth'})
      }
      if (scroll === root) break
      scroll = scroll.parentElement
    }
  }
  function search(jump = true) {
    if (!sync()) return
    const old = matches[current], query = input.value
    clearHighlights(); capped = false
    if (!query || !supported) { render(); return }
    const flow = root.querySelector('[data-chat-flow]'), groups = [], hidden = new WeakMap()
    const excluded = node => {
      if (!node || node === root) return false
      if (hidden.has(node)) return hidden.get(node)
      const collapsed = node.parentElement?.closest('details:not([open])')
      const style = win.getComputedStyle(node), skip = node.matches(EXCLUDE) || (collapsed && !collapsed.querySelector(':scope > summary')?.contains(node)) || node.closest(CONTENT) !== root || style.display === 'none' || style.visibility === 'hidden' || style.contentVisibility === 'hidden' || excluded(node.parentElement)
      hidden.set(node,skip); return skip
    }
    const walker = doc.createTreeWalker(flow,win.NodeFilter.SHOW_TEXT), pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'giu')
    let text, group = null
    while ((text = walker.nextNode())) {
      if (!text.data || excluded(text.parentElement)) continue
      const block = text.parentElement.closest(BLOCK) || flow
      if (!group || group.block !== block) { group = {block,text:'',nodes:[]}; groups.push(group) }
      group.nodes.push({node:text,start:group.text.length}); group.text += text.data
    }
    outer: for (const group of groups) {
      const locate = (offset,ending = false) => {
        let low = 0, high = group.nodes.length
        while (low < high) { const mid = (low+high) >>> 1; if (ending ? group.nodes[mid].start < offset : group.nodes[mid].start <= offset) low = mid+1; else high = mid }
        return group.nodes[Math.max(0,low-1)]
      }
      for (const found of group.text.matchAll(pattern)) {
        const start = found.index, end = start + found[0].length
        const first = locate(start), last = locate(end,true)
        const range = doc.createRange(); range.setStart(first.node,start-first.start); range.setEnd(last.node,end-last.start); matches.push(range)
        if (matches.length >= 10000) { capped = true; break outer }
      }
    }
    const all = new win.Highlight(); for (const range of matches) all.add(range); registry.set(ALL,all)
    current = Math.max(0,matches.findIndex(range => old && range.startContainer === old.startContainer && range.startOffset === old.startOffset))
    if (!matches.length) current = -1
    highlight(); if (jump) reveal()
  }
  function step(direction) {
    if (!sync()) return
    if (timer) { win.clearTimeout(timer); timer = 0; search(false) }
    if (!matches.length) return
    current = (current + direction + matches.length) % matches.length; highlight(); reveal()
  }
  function open(sessionId, target) {
    if (!enabled || disposed) return false
    const roots = [...doc.querySelectorAll(CONTENT)].filter(node => visible(node) && visible(node.querySelector('[data-chat-flow]')))
    const near = target?.closest?.(CONTENT) || last?.closest?.(CONTENT)
    const next = roots.find(node => node === near && (!sessionId || node.dataset.conversationSession === sessionId)) || roots.find(node => !sessionId || node.dataset.conversationSession === sessionId)
    if (!next) return false
    const selection = win.getSelection(), selected = selection?.rangeCount && next.contains(selection.anchorNode) && next.contains(selection.focusNode) ? selection.toString().trim().slice(0,200) : ''
    if (root === next && bar && !bar.inert) { if (selected) { input.value = selected; search() } input.focus({preventScroll:true}); input.select(); return true }
    close(false,true); win.clearTimeout(exitTimer); exitTimer = 0
    previous = doc.activeElement; root = next; session = next.dataset.conversationSession
    bar = doc.createElement('section'); bar.className = 'dcb-find'; bar.setAttribute('role','search'); bar.setAttribute('aria-label','在当前会话中查找')
    bar.innerHTML = `<div class="dcb-find-row">${svg('search')}<input type="text" aria-label="搜索会话关键词" placeholder="搜索当前会话…" autocomplete="off" spellcheck="false"><span class="dcb-find-count" role="status" aria-live="polite"></span><button type="button" data-find-direction="-1" aria-label="上一处" title="上一处 · Shift+Enter">${svg('previous')}</button><button type="button" data-find-direction="1" aria-label="下一处" title="下一处 · Enter">${svg('next')}</button><button type="button" data-find-close aria-label="关闭搜索" title="关闭 · Esc">${svg('close')}</button></div><div class="dcb-find-note"></div>`
    input = bar.querySelector('input'); count = bar.querySelector('[role=status]'); note = bar.querySelector('.dcb-find-note'); input.value = selected
    input.addEventListener('input', () => { win.clearTimeout(timer); timer = win.setTimeout(() => {timer = 0; search()},80) })
    bar.addEventListener('click',event => { const button = event.target.closest('button'); if (button?.hasAttribute('data-find-close')) close(); else if (button?.dataset.findDirection) step(Number(button.dataset.findDirection)) })
    doc.body.append(bar); position(); motion(); input.focus({preventScroll:true}); input.select(); search()
    observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-conversation-session','hidden','inert','aria-hidden','class','style']}); resize.observe(root)
    return true
  }
  function key(event) {
    if (event.defaultPrevented || event.isComposing) return
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'f') {
      if (event.target.closest?.('[role="dialog"],[aria-modal="true"],.xterm,iframe,[data-shortcut-modal]')) return
      if (open(null,event.target)) { event.preventDefault(); event.stopPropagation() }
    } else if (root && (event.key === 'Escape' || (bar?.contains(event.target) && event.key === 'Enter') || event.key === 'F3' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'g'))) {
      if (event.target.closest?.('[role="menu"],[role="dialog"],[aria-modal="true"]')) return
      event.preventDefault(); event.stopPropagation()
      if (event.key === 'Escape') close(); else step(event.shiftKey?-1:1)
    }
  }
  const pointer = event => { if (event.target.closest?.(CONTENT)) last = event.target }
  doc.addEventListener('keydown',key,true); doc.addEventListener('pointerdown',pointer,true); win.addEventListener('resize',position)
  return {open,sync,setEnabled(value){ enabled = value === true; if (!enabled) close() },dispose(){ disposed = true; close(false,true); win.clearTimeout(exitTimer); win.clearTimeout(timer); observer.disconnect(); resize.disconnect(); clearHighlights(); doc.removeEventListener('keydown',key,true); doc.removeEventListener('pointerdown',pointer,true); win.removeEventListener('resize',position); last = null },
    createButton(React) { return function ConversationFindButton({sessionId}) { return React.createElement('button',{type:'button',className:'dcb-find-entry','aria-label':'搜索当前会话','aria-keyshortcuts':'Control+f Meta+f',title:'搜索当前会话 · Ctrl+F',onClick:()=>open(sessionId),dangerouslySetInnerHTML:{__html:svg('search')}}) } },
  }
}
