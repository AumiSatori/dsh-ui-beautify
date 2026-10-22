window.__ModuleLoader__.load({
  id: 'dsh-claude-beautify',
  factory: (require) => {
    const React = require('react')
    const { FishLogo } = require('@deepseek-ai/dsh-client-ui-primitives')
    const NAME = 'dsh-claude-beautify'
    const KEY = `${NAME}:settings:v1`
    const PANEL = '[data-testid="todo-panel"]'
    const MARK = 'data-dcb-task-panel'
    const DEFAULTS = { enabled: true, width: 320, cardStyle: 'milk', modules: { progress: true, outputs: true, resources: true }, progressView: { count: 3, previous: false, future: false }, toolDetails: false }
    const VARIABLES = ['--dcb-left', '--dcb-top', '--dcb-width', '--dcb-list-height']

    function normalize(value) {
      return {
        enabled: typeof value?.enabled === 'boolean' ? value.enabled : true,
        width: Number.isFinite(value?.width) ? Math.round(Math.max(280, Math.min(480, value.width))) : 320,
        // Keep the existing glass value for the frosted material when upgrading.
        cardStyle: ['clear', 'glass', 'milk'].includes(value?.cardStyle) ? value.cardStyle : 'milk',
        modules: Object.fromEntries(Object.keys(DEFAULTS.modules).map(key => [key, typeof value?.modules?.[key] === 'boolean' ? value.modules[key] : true])),
        progressView: { count: value?.progressView?.count === 2 ? 2 : 3, previous: value?.progressView?.previous === true, future: value?.progressView?.future === true },
        toolDetails: value?.toolDetails === true,
      }
    }

    function readSettings() {
      try { return normalize(JSON.parse(window.localStorage.getItem(KEY))) }
      catch { return normalize(null) }
    }

    const h = React.createElement
    const emptyActivity = { files: [], resources: [], hasMore: false }
    const basename = path => path.replaceAll('\\', '/').split('/').filter(Boolean).at(-1) || path
    const THUMBNAIL_LIMIT = 4 * 1024 * 1024
    const EXTENSION = /\.([^./\\]+)$/
    function imageExtension(name) {
      const extension = EXTENSION.exec(basename(String(name || '')))?.[1]?.toLowerCase() || ''
      return /^(?:png|jpe?g|webp|gif|avif|bmp)$/.test(extension) ? extension : ''
    }
    function tileLabel(name) {
      const extension = EXTENSION.exec(basename(String(name || '')))?.[1] || ''
      return (extension || '文件').slice(0, 4).toUpperCase()
    }
    function mimeFor(extension) {
      return `image/${extension === 'jpg' ? 'jpeg' : extension}`
    }
    // One blob URL per session+path: the card re-renders often, the bytes must not.
    const thumbnails = new Map()
    function thumbnailReader(binding, sessionId) {
      return async (path, extension, signal) => {
        const face = binding.current
        if (!face) return null
        const stat = await face.stat(sessionId, path, signal)
        if (!stat?.ok) return null
        const bytes = Number(stat.value?.bytes)
        if (Number.isFinite(bytes) && bytes > THUMBNAIL_LIMIT) return null
        const file = await face.readBytes(sessionId, path, {}, signal)
        if (!file?.ok || !file.value?.data) return null
        return { data: file.value.data, type: mimeFor(extension) }
      }
    }
    function useThumbnail(sessionId, path, read) {
      const extension = imageExtension(path)
      const key = `${sessionId}\u0000${path}`
      const [url, setUrl] = React.useState(() => thumbnails.get(key) || '')
      React.useEffect(() => {
        if (!extension || !read || thumbnails.has(key)) return undefined
        let live = true
        const controller = typeof AbortController === 'function' ? new AbortController() : null
        Promise.resolve(read(path, extension, controller?.signal)).then(result => {
          if (!live || !result?.data) return
          const bytes = result.data instanceof Uint8Array ? result.data : Uint8Array.from(result.data)
          const blob = URL.createObjectURL(new Blob([bytes], { type: result.type }))
          thumbnails.set(key, blob)
          setUrl(blob)
        }).catch(() => {})
        return () => { live = false; controller?.abort() }
      }, [key, extension, read])
      return url
    }
    function argumentsOf(value) {
      try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return parsed && typeof parsed === 'object' ? parsed : {} }
      catch { return {} }
    }
    function fileAddress(sessionId, path) {
      const normalized = path.replaceAll('\\', '/').replace(/^(?:\.\/)+/, '')
      return `dsh-resource://file/session/${encodeURIComponent(sessionId)}/${normalized.split('/').map(encodeURIComponent).join('/')}`
    }
    function activityFrom(entries, hasMore = false) {
      const files = new Map()
      const calls = new Map()
      const results = new Map()
      for (const entry of entries) {
        const event = entry?.event
        const data = event?.data
        if (!data) continue
        if (event.type === 'deliverables/presented' && Array.isArray(data.files)) {
          for (const file of data.files) if (typeof file?.path === 'string' && file.path.trim()) {
            files.set(file.path.replaceAll('\\', '/'), { path: file.path, description: typeof file.description === 'string' ? file.description : '', seq: event.seq })
          }
        }
        if (['tool/call', 'tool/ptc-dispatch-start', 'tool/ptc-dispatch'].includes(event.type) && typeof data.name === 'string') {
          const id = data.callId || data.subCallId
          if (id) calls.set(id, { name: data.name, args: argumentsOf(data.arguments), order: calls.get(id)?.order ?? calls.size })
          if (event.type === 'tool/ptc-dispatch') results.set(id, data.isError !== true)
        }
        if (event.type === 'tool/result') {
          const id = data.message?.source?.callId || data.callId
          if (id) results.set(id, data.message?.isError !== true && data.isError !== true)
        }
      }
      const resources = new Map()
      for (const [id, call] of calls) {
        const { name, args } = call
        const lower = name.toLowerCase()
        const path = args.path || args.file_path || args.filePath
        const success = results.get(id) === true
        let item
        if (/^(?:skill|load_skill|skill_load)$/.test(lower) && success && typeof args.name === 'string') {
          item = { kind: 'skill', label: 'Skills', detail: args.name }
        } else if (/^(?:read|read_file)$/.test(lower) && success && typeof path === 'string' && /(?:^|[/\\])SKILL\.md$/i.test(path)) {
          item = { kind: 'skill', label: 'Skills', detail: basename(path.replace(/[/\\]SKILL\.md$/i, '')), path }
        } else if (/(?:^|[_/.-])memor(?:y|ies)(?:$|[_/.-])/.test(lower)) {
          const modifies = /write|save|add|update|delete|create/.test(`${lower} ${args.action || ''}`)
          item = { kind: 'memory', label: '记忆', detail: success ? modifies ? '已使用' : '已读取' : results.has(id) ? '调用失败' : '调用中' }
        } else if (/^(?:read|read_file)$/.test(lower) && success && typeof path === 'string' && /(?:^|[/\\])(?:memory|memories)(?:[/\\]|\.md$)/i.test(path)) {
          item = { kind: 'memory', label: '记忆', detail: `已读取 · ${basename(path)}`, path }
        } else if (/web_search|web_fetch|search_web|browser_search/.test(lower)) {
          item = { kind: 'web', label: '网页搜索', detail: lower.includes('fetch') ? '网页读取' : '搜索' }
        } else if (/github/.test(lower)) {
          item = { kind: 'github', label: 'GitHub', detail: '仓库工具' }
        } else if (!/^(?:read|read_file|todo_write|present|skill|load_skill|skill_load)$/.test(lower)) {
          item = { kind: 'tool', label: name, detail: results.has(id) ? success ? '已使用' : '调用失败' : '调用中' }
        }
        if (item) {
          const key = `${item.kind}:${item.label}:${item.path || (item.kind === 'skill' ? item.detail : '')}`
          if (item.kind === 'tool') {
            const previous = resources.get(key)
            item.count = (previous?.count || 0) + 1
            item.running = (previous?.running || 0) + (results.has(id) ? 0 : 1)
            item.failed = (previous?.failed || 0) + (results.get(id) === false ? 1 : 0)
            item.lastActiveOrder = Math.max(previous?.lastActiveOrder ?? -1, results.has(id) ? -1 : call.order)
            item.detail = item.running ? '调用中' : item.failed ? '调用失败' : '已使用'
          }
          resources.set(key, item)
        }
      }
      return { files: [...files.values()], resources: [...resources.values()], hasMore }
    }
    const TOOL_CATEGORIES = {
      command: { id: 'command', label: '命令', icon: 'terminal' },
      edit: { id: 'edit', label: '编辑', icon: 'file-edit' },
      read: { id: 'read', label: '读取', icon: 'file-read' },
      image: { id: 'image', label: '图像', icon: 'image' },
      process: { id: 'process', label: '进程', icon: 'process' },
      interaction: { id: 'interaction', label: '交互', icon: 'message' },
      search: { id: 'search', label: '检索', icon: 'search' },
      agent: { id: 'agent', label: '协作', icon: 'network' },
      plan: { id: 'plan', label: '计划', icon: 'checklist' },
      other: { id: 'other', label: '其他', icon: 'tool' },
    }
    function toolCategory(name) {
      const normalized = typeof name === 'string' ? name.trim().toLowerCase() : ''
      const leaf = normalized.split(/__|[./:]/).filter(Boolean).at(-1)?.replace(/[\s-]+/g, '_') || ''
      // Match tool identifiers, not arbitrary substrings inside a provider's name.
      if (/^(?:todo[/_.-](?:write|read)|todo)$/.test(normalized) || /^(?:todo_(?:write|read)|write_todos|read_todos|update_plan|set_plan|plan)$/.test(leaf)) return TOOL_CATEGORIES.plan
      if (/^(?:ops_bash|bash|shell|terminal|exec|exec_command|run_command|execute_command|run_shell|execute_code|run_code|powershell|cmd)$/.test(leaf)) return TOOL_CATEGORIES.command
      if (/^(?:write|write_file|writefile|edit|edit_file|editfile|apply_patch|replace_in_file|multi_edit|str_replace|str_replace_editor|create_file|delete_file|move_file|rename_file|append_file)$/.test(leaf)) return TOOL_CATEGORIES.edit
      if (/^(?:read|read_file|readfile|read_text_file|cat|view_file|list_files|list_directory|directory_tree|get_file_info|ls)$/.test(leaf)) return TOOL_CATEGORIES.read
      if (/^(?:read_image|view_image|open_image|imagegen|image_gen|generate_image|edit_image)$/.test(leaf)) return TOOL_CATEGORIES.image
      if (/^(?:(?:job|process|background)_(?:kill|cancel|stop|terminate|output|status|list|wait|poll)|kill_process|list_processes|write_stdin)$/.test(leaf)) return TOOL_CATEGORIES.process
      if (/^(?:ask_user(?:_question)?|request_user_input(?:_async)?|ask_followup_question|ask_question|question)$/.test(leaf)) return TOOL_CATEGORIES.interaction
      if (/^(?:search|search_files|search_code|file_search|rg|grep|glob|find_files)$/.test(leaf)) return TOOL_CATEGORIES.search
      if (/^(?:(?:spawn|delegate|handoff|send_message_to|wait|list|interrupt|followup)_agents?|spawn_subagent|send_message_to_thread|create_thread)$/.test(leaf)) return TOOL_CATEGORIES.agent
      return TOOL_CATEGORIES.other
    }
    function toolSummary(resources) {
      const tools = resources.filter(item => item.kind === 'tool')
      return {
        featured: resources.filter(item => item.kind !== 'tool'), tools, count: tools.length,
        calls: tools.reduce((sum, item) => sum + item.count, 0),
        active: tools.filter(item => item.running > 0).sort((a, b) => b.lastActiveOrder - a.lastActiveOrder),
        failed: tools.reduce((sum, item) => sum + item.failed, 0),
      }
    }
    function activitySource(events) {
      let previous
      let current = emptyActivity
      const relevant = event => ['turn/start', 'turn/end', 'todo/write', 'deliverables/presented', 'tool/call', 'tool/result', 'tool/ptc-dispatch-start', 'tool/ptc-dispatch'].includes(event?.type)
      function getSnapshot() {
        const next = events?.getSnapshot()
        if (!next || next === previous) return current
        const changed = next.change?.kind !== 'append' || next.change.entries?.some(entry => relevant(entry.event))
        previous = next
        if (current === emptyActivity || changed) current = turnActivityFrom(next.entries || [], next.hasMore)
        return current
      }
      return { getSnapshot, subscribe: listener => events?.subscribe(() => { const old = current; if (getSnapshot() !== old) listener() }) || (() => {}) }
    }
    function turnActivityFrom(entries, hasMore = false) {
      const turns = new Map()
      const owners = new Map()
      let current = null
      for (const entry of entries) {
        const event = entry?.event
        const data = event?.data
        if (!data) continue
        if (event.type === 'turn/start' && Number.isSafeInteger(data.turn) && data.turn >= 0) {
          current = { turn: data.turn, todos: null, entries: [], ended: false, complete: true }
          turns.set(data.turn, current)
        }
        let owner = current
        if (Number.isSafeInteger(data.turn) && data.turn >= 0) {
          if (!turns.has(data.turn)) turns.set(data.turn, { turn: data.turn, todos: null, entries: [], ended: false, complete: false })
          owner = turns.get(data.turn)
        }
        const id = data.callId || data.subCallId || data.message?.source?.callId
        const toolEvent = ['tool/call', 'tool/result', 'tool/ptc-dispatch-start', 'tool/ptc-dispatch'].includes(event.type)
        if (toolEvent) owner = owners.get(id) || owners.get(data.parentCallId) || owners.get(data.rootCallId) || owner
        if (!owner) continue
        if (id && toolEvent && !owners.has(id)) owners.set(id, owner)
        owner.entries.push(entry)
        if (event.type === 'todo/write' && Array.isArray(data.todos)) owner.todos = data.todos.filter(item => typeof item?.content === 'string' && ['pending', 'in_progress', 'completed'].includes(item.status)).map(item => ({ content: item.content, status: item.status }))
        if (event.type === 'turn/end') owner.ended = true
      }
      if (!turns.size) return activityFrom(entries, hasMore)
      const snapshots = [...turns.values()].sort((a, b) => a.turn - b.turn).map(({ entries, ...turn }) => ({ ...turn, activity: activityFrom(entries, !turn.complete) }))
      return { ...snapshots.at(-1).activity, turns: snapshots, latestTurn: snapshots.at(-1).turn, hasMore }
    }
    function useReadingTurn(sessionId, outline, turns) {
      const [reading, setReading] = React.useState({ sessionId, turn: null })
      const outlineIds = (Array.isArray(outline) ? outline : []).filter(item => Number.isSafeInteger(item?.seq) && item.seq >= 0 && Number.isSafeInteger(item?.turn) && item.turn >= 0).map(item => item.turn)
      const ids = [...new Set([...outlineIds, ...(turns || []).map(item => item.turn)])].sort((a, b) => a - b)
      const key = `${[...outlineIds].sort((a, b) => a - b).join(',')}|${ids.join(',')}`
      React.useLayoutEffect(() => {
        let frame = 0
        const sample = () => {
          frame = 0
          const container = [...document.querySelectorAll('[data-conversation-content]')].find(node => node.dataset.conversationSession === sessionId && node.getClientRects().length)
          let turn = null
          if (container) {
            const column = container.querySelector('[data-chat-flow]')
            const flow = column?.querySelector(':scope > [data-slot="conversation.chat.flow"]') || column
            const rows = flow ? [...flow.children].filter(row => row.hasAttribute('data-chat-turn')) : [...container.querySelectorAll('[data-chat-turn]')].filter(row => !row.parentElement.closest('[data-chat-turn]'))
            // Event-only empty turns have no native rail item and must not shift its indices.
            const known = [...new Set([...outlineIds, ...rows.map(row => Number(row.dataset.chatTurn))].filter(value => Number.isSafeInteger(value) && value >= 0))].sort((a, b) => a - b)
            const mark = container.querySelector('nav button[data-index][aria-current="true"]')
            if (container.querySelector('[data-chat-following-tail]')) {
              const latest = Math.max(known.at(-1) ?? -1, ids.at(-1) ?? -1)
              turn = latest >= 0 ? latest : null
            }
            else if (mark) turn = known[Number(mark.dataset.index)] ?? null
            if (turn === null && rows.length) {
              const scroller = (flow || rows[0])?.closest('[data-conversation-scroll]') || container.querySelector('[data-conversation-scroll]') || container
              const bounds = scroller.getBoundingClientRect()
              const line = bounds.top + Math.min(96, bounds.height * .2)
              const visible = rows.filter(row => !row.closest('[hidden]') && row.getClientRects().length)
              const row = visible.findLast(item => item.getBoundingClientRect().top <= line) || visible[0]
              if (row) turn = Number(row.dataset.chatTurn)
            }
          }
          setReading(old => old.sessionId === sessionId && old.turn === turn ? old : { sessionId, turn })
        }
        const schedule = () => { if (!frame) frame = requestAnimationFrame(sample) }
        const observer = new MutationObserver(records => {
          if (records.some(record => {
            const target = record.target.nodeType === 1 ? record.target : record.target.parentElement
            if (!target || target.closest('[data-dcb-summary-for]')) return false
            return record.type === 'attributes' ? target.matches('nav button[data-index], [data-chat-turn]') || record.attributeName === 'data-chat-following-tail' : !!target.closest('[data-conversation-content]') || [...record.addedNodes].some(node => node.nodeType === 1 && (node.matches('[data-conversation-content]') || node.querySelector('[data-conversation-content]')))
          })) schedule()
        })
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current', 'data-index', 'data-chat-turn', 'data-chat-following-tail', 'hidden'] })
        const scroll = event => { if (!event.target?.closest?.('[data-dcb-summary-for]')) schedule() }
        document.addEventListener('scroll', scroll, true)
        window.addEventListener('resize', schedule)
        sample()
        return () => { observer.disconnect(); document.removeEventListener('scroll', scroll, true); window.removeEventListener('resize', schedule); if (frame) cancelAnimationFrame(frame) }
      }, [sessionId, key])
      return reading.sessionId === sessionId ? reading.turn : null
    }
    function useContextTransition(context, active) {
      const viewport = React.useRef(null)
      const content = React.useRef(null)
      const ghost = React.useRef(null)
      const state = React.useRef({ snapshot: null, animations: null, frame: 0, waiting: null })
      const stop = () => {
        const animations = state.current.animations
        state.current.animations = null
        animations?.forEach(animation => { animation.effect?.target?.style.removeProperty('will-change'); animation.cancel() })
        ghost.current?.replaceChildren()
      }
      const snapshot = () => {
        const current = state.current
        if (!current.snapshot || !content.current || current.frame || current.waiting) return
        current.frame = requestAnimationFrame(() => {
          current.frame = 0
          const node = content.current
          if (!current.snapshot || !node) return
          // A transition may mutate the small step stage every frame. Cache the
          // complete card once it settles, rather than cloning every intermediate.
          const moving = node.getAnimations({ subtree: true }).filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity && animation.playState !== 'finished' && animation.playState !== 'idle')
          if (current.animations || moving.length) {
            const pending = {}
            current.waiting = pending
            Promise.all([...moving, ...(current.animations || [])].map(animation => animation.finished.catch(() => {}))).then(() => {
              if (current.waiting === pending) { current.waiting = null; snapshot() }
            })
            return
          }
          current.snapshot.height = node.offsetHeight
          current.snapshot.clone = node.cloneNode(true)
        })
      }
      React.useLayoutEffect(() => {
        const node = content.current
        const old = state.current.snapshot
        if (!active || !node) { stop(); state.current.snapshot = null; return }
        if (old?.context === context) return
        const fromHeight = state.current.animations ? viewport.current.getBoundingClientRect().height : old?.height
        const fromStyle = state.current.animations ? getComputedStyle(node) : null
        const fromY = fromStyle ? new DOMMatrixReadOnly(fromStyle.transform).m42 : 0
        const fromOpacity = fromStyle?.opacity || 1
        const fromBlur = fromStyle?.filter || 'blur(0px)'
        stop()
        state.current.snapshot = { context, height: node.offsetHeight, clone: node.cloneNode(true) }
        if (!old || window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches) return
        for (const item of old.clone.querySelectorAll('.dcb-step-ghost')) item.replaceChildren()
        for (const item of old.clone.querySelectorAll('[id]')) item.removeAttribute('id')
        for (const item of old.clone.querySelectorAll('[data-working]')) item.setAttribute('data-working', 'false')
        ghost.current.replaceChildren(old.clone)
        const options = { duration: 280, easing: 'cubic-bezier(.22,.8,.26,1)', fill: 'both' }
        const exit = { ...options, easing: 'cubic-bezier(.4,0,.2,1)' }
        node.style.willChange = old.clone.style.willChange = 'opacity, transform, filter'
        viewport.current.style.willChange = 'height'
        const animations = [
          node.animate([{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(3px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }], { ...options, id: 'dcb-context-in' }),
          old.clone.animate([{ opacity: fromOpacity, transform: `translateY(${fromY}px)`, filter: fromBlur }, { opacity: 0, transform: 'translateY(-8px)', filter: 'blur(3px)' }], { ...exit, id: 'dcb-context-out' }),
          viewport.current.animate([{ height: `${fromHeight}px` }, { height: `${node.offsetHeight}px` }], { ...exit, id: 'dcb-context-height' }),
        ]
        const items = [...node.querySelectorAll('.dcb-recent-steps > li, .dcb-output, .dcb-resource')].filter(item => !item.closest('[inert]')).slice(0, 6)
        items.forEach((item, index) => {
          item.style.willChange = 'opacity, transform, filter'
          animations.push(item.animate([{ opacity: 0, transform: 'translateY(6px)', filter: 'blur(2px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }], { ...options, duration: 180, delay: index * 24, id: 'dcb-context-item' }))
        })
        state.current.animations = animations
        Promise.all(animations.map(animation => animation.finished)).then(() => { if (state.current.animations === animations) { stop(); snapshot() } }).catch(() => {})
      })
      React.useLayoutEffect(() => {
        const observer = new MutationObserver(records => {
          if (records.some(record => !record.target.closest?.('.dcb-step-ghost, .dcb-context-ghost'))) snapshot()
        })
        const resize = new ResizeObserver(snapshot)
        if (active && content.current) { observer.observe(content.current, { childList: true, subtree: true, attributes: true, characterData: true }); resize.observe(content.current) }
        const preference = window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
        const changed = () => { if (preference.matches) { stop(); snapshot() } }
        preference.addEventListener('change', changed)
        return () => {
          observer.disconnect(); resize.disconnect(); preference.removeEventListener('change', changed); stop()
          if (state.current.frame) cancelAnimationFrame(state.current.frame)
          state.current.frame = 0
          state.current.waiting = null
          state.current.snapshot = null
        }
      }, [active])
      return { viewport, content, ghost }
    }
    function useToolDisclosure(expanded, revision) {
      const viewport = React.useRef(null)
      const body = React.useRef(null)
      const latest = React.useRef(expanded)
      latest.current = expanded
      const state = React.useRef({ previous: null, animations: null })
      const stop = () => {
        const animations = state.current.animations
        state.current.animations = null
        animations?.forEach(animation => { animation.effect?.target?.style.removeProperty('will-change'); animation.cancel() })
      }
      const settle = () => {
        stop()
        if (viewport.current) viewport.current.hidden = !latest.current
        state.current.previous = { expanded: latest.current, height: latest.current ? body.current?.offsetHeight || 0 : 0 }
      }
      React.useLayoutEffect(() => {
        const node = viewport.current, content = body.current, previous = state.current.previous
        if (!node || !content) return
        const interrupted = state.current.animations !== null
        const style = interrupted ? getComputedStyle(node) : null
        const from = { height: `${interrupted ? node.getBoundingClientRect().height : previous?.height || 0}px`, opacity: style?.opacity || (previous?.expanded ? 1 : 0), filter: style?.filter || (previous?.expanded ? 'blur(0px)' : 'blur(2px)') }
        const fromY = interrupted ? getComputedStyle(content).transform : previous?.expanded ? 'translateY(0)' : 'translateY(-6px)'
        stop()
        node.hidden = false
        const height = content.offsetHeight
        state.current.previous = { expanded, height: expanded ? height : 0 }
        if (!previous || window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches || !expanded && !previous.expanded && !interrupted) { settle(); return }
        const options = { duration: expanded ? 280 : 240, easing: expanded ? 'cubic-bezier(.22,.8,.26,1)' : 'cubic-bezier(.4,0,.2,1)', fill: 'both' }
        node.style.willChange = 'height, opacity, filter'
        content.style.willChange = 'transform'
        const animations = [
          node.animate([from, { height: `${expanded ? height : 0}px`, opacity: expanded ? 1 : 0, filter: expanded ? 'blur(0px)' : 'blur(2px)' }], { ...options, id: 'dcb-tools-height' }),
          content.animate([{ transform: fromY }, { transform: expanded ? 'translateY(0)' : 'translateY(-6px)' }], { ...options, id: 'dcb-tools-body' }),
        ]
        if (expanded && !previous.expanded) [...content.children].forEach((item, index) => {
          item.style.willChange = 'opacity, transform, filter'
          animations.push(item.animate([{ opacity: 0, transform: 'translateY(6px)', filter: 'blur(2px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }], { ...options, duration: 180, delay: Math.min(index * 24, 120), id: 'dcb-tools-item' }))
        })
        state.current.animations = animations
        Promise.all(animations.map(animation => animation.finished)).then(() => { if (state.current.animations === animations) settle() }).catch(() => {})
      }, [expanded, revision])
      React.useLayoutEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
        const changed = () => { if (preference.matches) settle() }
        preference.addEventListener('change', changed)
        return () => { preference.removeEventListener('change', changed); stop() }
      }, [])
      return { viewport, body }
    }
    function progressItems(todos, count = 3, offset) {
      const active = todos.findIndex(item => item.status === 'in_progress')
      const pending = todos.findIndex(item => item.status === 'pending')
      const current = active >= 0 ? active : pending >= 0 ? pending : todos.length - 1
      const limit = count === 2 ? 2 : 3
      const start = Math.max(0, Math.min(Number.isInteger(offset) ? offset : current - (limit === 3 ? 1 : 0), todos.length - limit))
      const end = Math.min(todos.length, start + limit)
      return { previous: todos.slice(0, start), items: todos.slice(start, end), future: todos.slice(end), start, end, step: current + 1, total: todos.length }
    }
    function useStepRoll({ sessionId, plan, count, start, todos, active, folds, manual }) {
      const viewport = React.useRef(null)
      const list = React.useRef(null)
      const ghost = React.useRef(null)
      const previous = React.useRef(null)
      const future = React.useRef(null)
      const state = React.useRef({ snapshot: null, roll: null })
      const stop = (keepStage = false) => {
        const roll = state.current.roll
        state.current.roll = null
        roll?.forEach(animation => { animation.effect?.target?.style.removeProperty('will-change'); animation.cancel() })
        if (!keepStage) ghost.current?.replaceChildren()
      }
      React.useLayoutEffect(() => {
        const node = viewport.current
        const items = list.current
        const old = state.current.snapshot
        const interrupted = state.current.roll !== null
        if (interrupted && active && old?.sessionId === sessionId && old.plan === plan && old.count === count && old.start === start && old.folds === folds) {
          state.current.snapshot = { ...old, clone: items.cloneNode(true) }
          return
        }
        const y = interrupted && items ? new DOMMatrixReadOnly(getComputedStyle(items).transform).m42 : 0
        const height = interrupted && node ? node.getBoundingClientRect().height : old?.height
        const groupHeights = interrupted ? [previous.current?.getBoundingClientRect().height || 0, future.current?.getBoundingClientRect().height || 0] : old?.groups
        // Freeze only rows currently on screen. The stage stays flat and bounded
        // even if the next wheel frame arrives before this transition finishes.
        const candidates = new Map()
        if (old) [...old.clone.children].forEach((row, index) => {
          const geometry = old.rows[index]
          const top = geometry.top + y
          if (top < height && top + geometry.height > 0) candidates.set(geometry.index, { node: row, ...geometry, top })
        })
        const stage = ghost.current?.firstElementChild
        if (stage) {
          const stageY = new DOMMatrixReadOnly(getComputedStyle(stage).transform).m42
          for (const row of stage.children) {
            const top = parseFloat(row.style.top) + stageY
            const rowHeight = row.offsetHeight
            const index = Number(row.dataset.stepIndex)
            if (!candidates.has(index) && top < height && top + rowHeight > 0) candidates.set(index, { node: row, index, top, height: rowHeight })
          }
        }
        stop(true)
        if (!active || !node || !items) { stop(); state.current.snapshot = null; return }
        const rows = [...items.children].map(row => ({ index: Number(row.dataset.stepIndex), top: row.offsetTop, height: row.offsetHeight }))
        const next = { sessionId, plan, count, start, folds, rows, height: items.offsetHeight, groups: [previous.current?.offsetHeight || 0, future.current?.offsetHeight || 0], clone: items.cloneNode(true) }
        state.current.snapshot = next
        if (!old || old.sessionId !== sessionId || old.plan !== plan || old.count !== count || old.start === start || old.folds !== folds ||
            window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches) { stop(); return }
        const shared = rows.find(row => candidates.has(row.index))
        const distance = shared ? candidates.get(shared.index).top - shared.top : Math.sign(start - old.start) * Math.max(height, next.height)
        const outgoing = stage || document.createElement('ol')
        outgoing.className = 'dcb-timeline dcb-roll-stage'
        outgoing.setAttribute('data-working', 'false')
        outgoing.style.position = 'relative'
        outgoing.style.height = `${height}px`
        const leaving = [...candidates.values()].filter(row => !rows.some(item => item.index === row.index))
        for (const row of leaving) Object.assign(row.node.style, { position: 'absolute', boxSizing: 'border-box', top: `${row.top}px`, left: '0', right: '0', height: `${row.height}px` })
        outgoing.replaceChildren(...leaving.map(row => row.node))
        if (!stage) ghost.current.replaceChildren(outgoing)
        const options = { duration: manual ? 180 : 280, easing: 'cubic-bezier(.22,.8,.26,1)', fill: 'both' }
        items.style.willChange = outgoing.style.willChange = 'transform'
        const roll = [
          items.animate([{ transform: `translateY(${distance}px)` }, { transform: 'translateY(0)' }], { ...options, id: 'dcb-step-roll-in' }),
          outgoing.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-distance}px)` }], { ...options, id: 'dcb-step-roll-out' }),
        ]
        if (Math.abs(height - next.height) > .5) {
          node.style.willChange = 'height'
          roll.push(node.animate([{ height: `${height}px` }, { height: `${next.height}px` }], { ...options, id: 'dcb-step-roll-height' }))
        }
        for (const [index, group] of [previous.current, future.current].entries()) {
          if (group && Math.abs(groupHeights[index] - next.groups[index]) > .5) roll.push(group.animate([{ height: `${groupHeights[index]}px` }, { height: `${next.groups[index]}px` }], { ...options, id: 'dcb-step-roll-group' }))
        }
        state.current.roll = roll
        Promise.all(roll.map(animation => animation.finished)).then(() => { if (state.current.roll === roll) stop() }).catch(() => {})
      }, [sessionId, plan, count, start, todos, active, folds, manual])
      React.useLayoutEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
        const changed = () => { if (preference.matches) stop() }
        preference.addEventListener('change', changed)
        const observer = new ResizeObserver(() => {
          const snapshot = state.current.snapshot
          if (!snapshot || state.current.roll || !list.current) return
          snapshot.height = list.current.offsetHeight
          snapshot.rows = [...list.current.children].map(row => ({ index: Number(row.dataset.stepIndex), top: row.offsetTop, height: row.offsetHeight }))
          snapshot.groups = [previous.current?.offsetHeight || 0, future.current?.offsetHeight || 0]
        })
        if (active) for (const node of [list.current, previous.current, future.current]) if (node) observer.observe(node)
        return () => { observer.disconnect(); preference.removeEventListener('change', changed); stop(); state.current.snapshot = null }
      }, [sessionId, active])
      return { viewport, list, ghost, previous, future }
    }
    function useStepNavigation(viewport, navigate, active, sessionId, plan, count) {
      const latest = React.useRef(navigate)
      const cancelInput = React.useRef(() => {})
      latest.current = navigate
      React.useLayoutEffect(() => {
        const node = viewport.current
        if (!active || !node) return
        let accumulated = 0, lastInput = 0, frame = 0, kind = '', touch = null
        const cancel = () => { if (frame) cancelAnimationFrame(frame); frame = 0; accumulated = 0; kind = '' }
        cancelInput.current = cancel
        const flush = () => {
          frame = 0
          const rows = [...(node.querySelector(':scope > ol')?.children || [])]
          const pitch = Math.max(24, rows.length ? rows.reduce((sum, row) => sum + row.offsetHeight, 0) / rows.length : 30)
          const steps = Math.trunc(accumulated / pitch)
          if (!steps) return
          accumulated -= steps * pitch
          if (!latest.current(steps) || !latest.current(Math.sign(steps), true)) accumulated = 0
        }
        const reserve = (delta, source) => {
          if (!latest.current(Math.sign(delta), true)) { cancel(); return false }
          const now = performance.now()
          if (source !== kind || now - lastInput > 180 || Math.sign(delta) !== Math.sign(accumulated)) accumulated = 0
          kind = source
          lastInput = now
          accumulated += delta
          if (!frame) frame = requestAnimationFrame(flush)
          return true
        }
        const wheel = event => {
          if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return
          const delta = event.deltaY * (event.deltaMode === 1 ? parseFloat(getComputedStyle(node).lineHeight) || 16 : event.deltaMode === 2 ? node.clientHeight : 1)
          if (reserve(delta, 'wheel')) event.preventDefault()
        }
        const touchStart = event => { cancel(); touch = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null }
        const touchMove = event => {
          if (!touch || event.touches.length !== 1) return
          const finger = event.touches[0]
          const dy = touch.y - finger.clientY
          const dx = touch.x - finger.clientX
          touch = { x: finger.clientX, y: finger.clientY }
          if (Math.abs(dy) > Math.abs(dx) && dy && reserve(dy, 'touch')) event.preventDefault()
        }
        const touchEnd = () => { touch = null }
        const keyboard = event => {
          if (event.target !== node || event.altKey || event.ctrlKey || event.metaKey) return
          const delta = { ArrowUp: -1, ArrowDown: 1, Home: -Infinity, End: Infinity }[event.key]
          if (delta !== undefined) { cancel(); if (latest.current(delta)) event.preventDefault() }
        }
        node.addEventListener('wheel', wheel, { passive: false })
        node.addEventListener('touchstart', touchStart, { passive: true })
        node.addEventListener('touchmove', touchMove, { passive: false })
        node.addEventListener('touchend', touchEnd)
        node.addEventListener('touchcancel', touchEnd)
        node.addEventListener('keydown', keyboard)
        return () => {
          cancel()
          cancelInput.current = () => {}
          node.removeEventListener('wheel', wheel); node.removeEventListener('touchstart', touchStart); node.removeEventListener('touchmove', touchMove)
          node.removeEventListener('touchend', touchEnd); node.removeEventListener('touchcancel', touchEnd); node.removeEventListener('keydown', keyboard)
        }
      }, [active, sessionId, plan, count])
      return { cancel: () => cancelInput.current() }
    }
    function Icon({ kind, size = 16, className }) {
      const paths = {
        file: 'M6 3h8l4 4v14H6z M14 3v5h4',
        archive: 'M4 4h16v5H4z M6 9v12h12V9 M10 13h4',
        web: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c-5 5-5 13 0 18 M12 3c5 5 5 13 0 18',
        memory: 'M4 8a9 9 0 1 1-1 7 M4 3v5h5 M8 12h.01 M12 14c2 0 3-1 4-2',
        skill: 'M4 4h10v12H4z M10 16v4h10V10h-6',
        github: 'M8 20v-3c-4 1-4-2-5-2 M16 20v-4c0-1-.3-2-1-2 4-.5 5-2 5-5 0-1-.3-2-1-3V3l-4 2c-2-.5-4-.5-6 0L5 3v3C4 7 4 8 4 9c0 3 1 4.5 5 5-.7 0-1 1-1 2',
        toolbox: 'M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1 M3 12h7 M14 12h7 M10 11h4v3h-4z',
        terminal: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1 M7 9l3 3-3 3 M13 15h4',
        'file-edit': 'M13 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h6 M13 3v5h5V8l-5-5 M14 17l5.5-5.5a1.4 1.4 0 0 1 2 2L16 19l-3 1z M18 13l2 2',
        'file-read': 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5 M14 3v5h5 M9 12h6 M9 16h6',
        image: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1 M3 16l5-5 4 4 3-3 6 6 M16 8a1 1 0 1 0 0 .01',
        process: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M9 9h6v6H9z',
        message: 'M21 11a8 8 0 0 1-8 8H8l-5 3V7a4 4 0 0 1 4-4h6a8 8 0 0 1 8 8 M9.5 8a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4 M12 15h.01',
        search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',
        network: 'M12 8v5 M6 17v-4h12v4 M15 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M9 20a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 20a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
        checklist: 'm3 6 2 2 3-4 M11 6h10 m-18 8 2 2 3-4 M11 14h10 M4 21h3 M11 21h10',
        tool: 'M14 6a5 5 0 0 0-6 6L3.5 16.5a2.8 2.8 0 0 0 4 4L12 16a5 5 0 0 0 6-6l-3 3-4-4z',
        close: 'M6 6l12 12 M18 6 6 18',
        chevron: 'm7 10 5 5 5-5',
      }
      return h('svg', { key: kind, className, 'data-icon': kind, width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, h('path', { d: paths[kind] || paths.tool }))
    }

    // Anchor to the conversation column, so an open right sidebar stays clear.
    function placement(rect, viewport, width, composerTop) {
      const leftEdge = Math.max(0, rect.left)
      const rightEdge = Math.min(viewport.width, rect.right)
      const topEdge = Math.max(0, rect.top)
      const bottomEdge = Math.min(viewport.height, rect.bottom)
      if (rightEdge - leftEdge < 180 || bottomEdge - topEdge < 160) return null
      const margin = rightEdge - leftEdge < 480 ? 8 : 16
      const panelWidth = Math.min(width, rightEdge - leftEdge - margin * 2)
      const top = topEdge + margin
      const bottom = Number.isFinite(composerTop) && composerTop > top + 100
        ? Math.min(bottomEdge - margin, composerTop - 12) : bottomEdge - margin
      return {
        left: Math.round(rightEdge - margin - panelWidth),
        top: Math.round(top),
        width: Math.round(panelWidth),
        listHeight: Math.max(64, Math.min(310, Math.floor(bottom - top - 64))),
      }
    }

    function createLiquidNormalMap(width, height, radius = 14) {
      const requestedWidth = Number.isFinite(Number(width)) ? Math.max(1, Math.round(Number(width))) : 1
      const requestedHeight = Number.isFinite(Number(height)) ? Math.max(1, Math.round(Number(height))) : 1
      const ratio = Math.min(1, 1024 / requestedWidth, 2048 / requestedHeight, Math.sqrt(1048576 / (requestedWidth * requestedHeight)))
      width = Math.max(1, Math.floor(requestedWidth * ratio))
      height = Math.max(1, Math.floor(requestedHeight * ratio))
      radius = Math.max(0, Math.min((Number.isFinite(Number(radius)) ? Number(radius) : 0) * ratio, width / 2, height / 2))
      const band = Math.max(.5, Math.min(24 * ratio, width / 3, height / 3))
      const data = new Uint8ClampedArray(width * height * 4)
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const px = x + .5 - width / 2, py = y + .5 - height / 2
        const qx = Math.abs(px) - (width / 2 - radius), qy = Math.abs(py) - (height / 2 - radius)
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0), outside = Math.hypot(ox, oy)
        const distance = -(outside + Math.min(Math.max(qx, qy), 0) - radius)
        let nx = 0, ny = 0
        if (outside > 0) { nx = ox / outside * Math.sign(px); ny = oy / outside * Math.sign(py) }
        else if (qx > qy) nx = Math.sign(px)
        else ny = Math.sign(py)
        const weight = distance >= 0 && distance < band ? Math.cos(distance / band * Math.PI / 2) ** 2 : 0
        const offset = (y * width + x) * 4
        data[offset] = Math.round(128 + nx * 127 * weight)
        data[offset + 1] = Math.round(128 + ny * 127 * weight)
        data[offset + 2] = 128
        data[offset + 3] = 255
      }
      return { width, height, data }
    }

    function createLiquidGlassManager(document, window) {
      const supported = /(?:Chrome|Chromium)\//.test(window.navigator?.userAgent || '') &&
        window.CSS?.supports?.('backdrop-filter', 'url("#dcb-liquid-probe")') && typeof window.ResizeObserver === 'function'
      if (!supported) return { sync() {}, dispose() {} }
      const namespace = 'http://www.w3.org/2000/svg'
      const prefix = `dcb-liquid-${Math.random().toString(36).slice(2, 10)}`
      const records = new Map(), cache = new Map()
      const forced = window.matchMedia('(forced-colors: active)')
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
      let disposed = false, svg = null, defs = null, serial = 0, lastElements = []
      const create = (name, attributes = {}) => {
        const node = document.createElementNS(namespace, name)
        for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value))
        return node
      }
      const geometry = element => {
        const width = Math.round(element.offsetWidth), height = Math.round(element.offsetHeight)
        if (!width || !height || !element.getClientRects().length) return null
        const value = window.getComputedStyle(element).borderTopLeftRadius
        const radius = parseFloat(value) * (value.endsWith('%') ? Math.min(width, height) / 100 : 1) || 0
        return { width, height, radius, key: `${width}:${height}:${radius}` }
      }
      const ensureDefs = () => {
        if (defs) return
        svg = create('svg', { width: 0, height: 0, 'aria-hidden': true, focusable: false, 'data-dcb-liquid-defs': '' })
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
        defs = create('defs'); svg.append(defs); document.body.append(svg)
      }
      const cachedMap = shape => {
        if (cache.has(shape.key)) {
          const value = cache.get(shape.key); cache.delete(shape.key); cache.set(shape.key, value); return value
        }
        const map = createLiquidNormalMap(shape.width, shape.height, shape.radius)
        const canvas = document.createElement('canvas'); canvas.width = map.width; canvas.height = map.height
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas is unavailable')
        const image = context.createImageData(map.width, map.height); image.data.set(map.data); context.putImageData(image, 0, 0)
        const url = canvas.toDataURL('image/png')
        // Decode before exposing the SVG filter, so an empty map cannot shift the
        // whole backdrop while its image is still loading.
        const bitmap = new window.Image(); bitmap.src = url
        const ready = typeof bitmap.decode === 'function' ? bitmap.decode() : Promise.resolve()
        const value = { url, ready }; cache.set(shape.key, value)
        while (cache.size > 8) cache.delete(cache.keys().next().value)
        return value
      }
      const setScale = (record, scale) => {
        const value = String(Math.round(Math.max(0, Math.min(12, scale)) * 1000) / 1000)
        if (record.displacement.getAttribute('scale') !== value) record.displacement.setAttribute('scale', value)
      }
      const remove = record => {
        if (records.get(record.element) !== record) return
        records.delete(record.element); record.live = false
        resize.unobserve(record.element)
        if (record.frame) window.cancelAnimationFrame(record.frame)
        if (record.resizeTimer) window.clearTimeout(record.resizeTimer)
        record.filter.remove()
        if (record.previousFilter) record.element.style.setProperty('--dcb-liquid-filter', record.previousFilter, record.previousPriority)
        else record.element.style.removeProperty('--dcb-liquid-filter')
        for (const name of ['data-dcb-liquid', 'data-dcb-liquid-map', 'data-dcb-liquid-generation']) record.element.removeAttribute(name)
        if (!records.size) { svg?.remove(); svg = defs = null }
      }
      const eligible = element => element?.isConnected && element.getClientRects().length > 0
      const tick = record => {
        if (record.frame) window.cancelAnimationFrame(record.frame)
        record.frame = 0
        if (disposed || !record.live || forced.matches || !eligible(record.element)) { remove(record); return }
        if (!record.ready) return
        const style = window.getComputedStyle(record.element)
        const parsed = Number.parseFloat(style.getPropertyValue('--dcb-refraction-scale'))
        const scale = reduced.matches || !Number.isFinite(parsed) ? record.target : parsed
        setScale(record, scale)
        const transitions = record.element.getAnimations().filter(animation => animation.transitionProperty === '--dcb-refraction-scale' && !['finished', 'idle'].includes(animation.playState))
        for (const animation of transitions) if (!record.watched.has(animation)) {
          record.watched.add(animation)
          animation.finished.then(() => { if (record.live && !disposed) tick(record) }).catch(() => {})
        }
        if (!record.target && scale < .01 && !transitions.length) { remove(record); return }
        // Sampling is finite and runs only during a material handoff. A paused
        // test transition keeps its sampled value; its finish promise settles it.
        if (!reduced.matches && window.performance.now() < record.deadline && (transitions.length || Math.abs(scale - record.target) > .01)) record.frame = window.requestAnimationFrame(() => tick(record))
      }
      const applyGeometry = (record, shape) => {
        if (!shape || !record.live || shape.key === record.key) return
        let map
        try { map = cachedMap(shape) } catch { dispose(); return }
        record.key = shape.key; record.generation++; record.ready = false
        record.element.setAttribute('data-dcb-liquid-map', `${shape.width}x${shape.height}`)
        record.element.setAttribute('data-dcb-liquid-generation', String(record.generation))
        map.ready.then(() => {
          if (disposed || !record.live || record.key !== shape.key || !eligible(record.element)) return
          record.image.setAttribute('width', shape.width); record.image.setAttribute('height', shape.height)
          record.image.setAttribute('href', map.url)
          record.ready = true
          record.element.style.setProperty('--dcb-liquid-filter', `url("#${record.id}")`)
          tick(record)
        }, dispose)
      }
      const queueGeometry = record => {
        if (!record?.live) return
        if (record.resizeTimer) window.clearTimeout(record.resizeTimer)
        record.resizeTimer = window.setTimeout(() => {
          record.resizeTimer = 0
          if (!record.live || disposed) return
          if (!eligible(record.element)) { remove(record); return }
          applyGeometry(record, geometry(record.element))
        }, 100)
      }
      const resize = new window.ResizeObserver(entries => {
        for (const { target } of entries) {
          const record = records.get(target)
          if (record && geometry(target)?.key !== record.key) queueGeometry(record)
        }
      })
      const sync = elements => {
        if (disposed) return
        lastElements = Array.from(elements || [])
        const incoming = new Set(lastElements)
        for (const record of records.values()) if (forced.matches || !incoming.has(record.element) || !eligible(record.element)) remove(record)
        if (forced.matches) return
        for (const element of lastElements) {
          if (!eligible(element)) continue
          const target = element.getAttribute('data-card-style') === 'clear' ? 12 : 0
          let record = records.get(element)
          if (!target && !record) continue
          if (!record) {
            const shape = geometry(element)
            if (!shape) continue
            ensureDefs()
            const id = `${prefix}-${++serial}`
            const filter = create('filter', { id, x: 0, y: 0, width: '100%', height: '100%', 'color-interpolation-filters': 'sRGB' })
            const image = create('feImage', { x: 0, y: 0, preserveAspectRatio: 'none', result: 'normal' })
            const displacement = create('feDisplacementMap', { in: 'SourceGraphic', in2: 'normal', scale: 0, xChannelSelector: 'R', yChannelSelector: 'G' })
            filter.append(image, displacement); defs.append(filter)
            record = { element, id, filter, image, displacement, target: null, key: null, generation: 0, frame: 0, resizeTimer: 0, ready: false, live: true, watched: new WeakSet(), previousFilter: element.style.getPropertyValue('--dcb-liquid-filter'), previousPriority: element.style.getPropertyPriority('--dcb-liquid-filter') }
            records.set(element, record); resize.observe(element); applyGeometry(record, shape)
            if (disposed) return
          } else if (geometry(element)?.key !== record.key) queueGeometry(record)
          if (record.target !== target) {
            record.target = target; record.deadline = window.performance.now() + 400
            element.setAttribute('data-dcb-liquid', target ? 'active' : 'settling')
            if (record.frame) window.cancelAnimationFrame(record.frame)
            tick(record)
          }
        }
      }
      const preferences = () => {
        if (disposed) return
        if (forced.matches) { for (const record of [...records.values()]) remove(record) }
        else {
          sync(lastElements)
          if (reduced.matches) for (const record of [...records.values()]) { if (record.frame) window.cancelAnimationFrame(record.frame); tick(record) }
        }
      }
      forced.addEventListener('change', preferences); reduced.addEventListener('change', preferences)
      function dispose() {
        if (disposed) return
        disposed = true
        forced.removeEventListener('change', preferences); reduced.removeEventListener('change', preferences)
        for (const record of [...records.values()]) remove(record)
        resize.disconnect(); cache.clear(); lastElements = []
      }
      return { sync, dispose }
    }

    const GLASS_PANEL = `:is(.dcb-summary, [${MARK}]):is([data-card-style="clear"], [data-card-style="glass"])`
    const css = `
      [${MARK}] {
        position: fixed !important;
        inset: var(--dcb-top) auto auto var(--dcb-left) !important;
        width: var(--dcb-width) !important;
        max-width: none !important;
        margin: 0 !important;
        z-index: 8;
        box-sizing: border-box;
        border: 1px solid #dedbd4 !important;
        border-radius: 14px !important;
        background: #faf9f5 !important;
        color: #38362f;
        box-shadow: 0 4px 20px #29251c0b, 0 1px 3px #29251c08 !important;
        backdrop-filter: none !important;
        overflow: hidden;
        -webkit-app-region: no-drag;
      }
      [${MARK}] > div { padding: 12px 14px !important; gap: 12px !important; }
      [${MARK}] button {
        min-height: 28px;
        border-radius: 5px;
        gap: 8px !important;
        color: inherit;
      }
      [${MARK}] button:focus-visible { outline: 2px solid #b76e50; outline-offset: 3px; }
      [${MARK}] button > span:first-child { color: #a46950 !important; }
      [${MARK}] button > span:nth-child(2) { color: inherit !important; font-weight: 600 !important; }
      [${MARK}] button > span:nth-child(3) { color: #827d72 !important; font-size: 11px !important; }
      [${MARK}] button > span:last-child { color: #827d72 !important; }
      [${MARK}] ul {
        max-height: var(--dcb-list-height) !important;
        gap: 0 !important;
        padding-top: 6px !important;
        border-top: 1px solid #e7e3db;
        overscroll-behavior: contain;
        scrollbar-width: thin;
      }
      [${MARK}] li { align-items: flex-start !important; padding: 8px 0; gap: 9px !important; }
      [${MARK}] li > span:first-child { margin-top: 2px; }
      [${MARK}] li > span:last-child {
        white-space: normal !important;
        overflow-wrap: anywhere;
        text-overflow: clip !important;
        line-height: 21px;
        color: #57534b;
      }
      [${MARK}] li[data-status="completed"] > span:last-child { color: #918c82; }
      [${MARK}] li[data-status="in_progress"] > span:last-child { color: #a65f43; font-weight: 700; }
      body[data-ds-dark-theme] [${MARK}] {
        background: #292824 !important; border-color: #45423b !important; color: #eeeae2;
        box-shadow: 0 6px 24px #0003 !important;
      }
      body[data-ds-dark-theme] [${MARK}] ul { border-color: #423f38; }
      body[data-ds-dark-theme] [${MARK}] li > span:last-child { color: #d4cec2; }
      body[data-ds-dark-theme] [${MARK}] li[data-status="completed"] > span:last-child { color: #969084; }
      body[data-ds-dark-theme] [${MARK}] li[data-status="in_progress"] > span:last-child { color: #d99c7c; }
      body[data-ds-dark-theme] [${MARK}] button > span:first-child { color: #d99c7c !important; }
      body[data-ds-dark-theme] [${MARK}] button > span:nth-child(3),
      body[data-ds-dark-theme] [${MARK}] button > span:last-child { color: #aaa294 !important; }
      .dcb-settings { padding: 16px 20px; max-width: 800px; color: var(--dsw-alias-label-primary, #202124); }
      .dcb-settings-card { box-sizing: border-box; position: relative; width: 100%; padding: 20px 24px 24px; border: 1px solid #ffffffcc; border-radius: 20px; background: #ffffffeb; box-shadow: 0 16px 42px #00000012, 0 2px 8px #0000000a, inset 0 1px 1px #ffffffbf; animation: dcb-settings-enter 260ms cubic-bezier(.22,.8,.26,1); }
      .dcb-settings-header { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #0000000f; }
      .dcb-settings-header > div { min-width: 0; }
      .dcb-settings-card h2 { margin: 0; font-size: 18px; font-weight: 700; line-height: 1.4; letter-spacing: -.3px; }
      .dcb-settings-card p { margin: 4px 0 0; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary, #6f6f6f); }
      .dcb-settings-badge { flex: none; padding: 3px 10px; border: 1px solid #ffffff99; border-radius: 999px; background: #ffffff80; box-shadow: 0 1px 4px #0000000a; color: #6265fa; font-size: 11px; font-weight: 600; letter-spacing: .5px; white-space: nowrap; }
      .dcb-settings-section { margin-bottom: 18px; }
      .dcb-settings-section-title, .dcb-style-picker legend { display: block; padding: 0; margin: 0 0 10px; color: var(--dsw-alias-label-secondary, #6f6f6f); font-size: 12px; font-weight: 700; line-height: 1.5; }
      .dcb-settings-row { display: flex; align-items: center; gap: 16px; min-width: 0; padding: 12px 14px; border: 1px solid #0000000d; border-radius: 14px; background: #00000008; font-size: 14px; transition: background-color 220ms cubic-bezier(.4,0,.2,1), border-color 220ms cubic-bezier(.4,0,.2,1); }
      .dcb-settings-row + .dcb-settings-row { margin-top: 10px; }
      .dcb-settings-copy { flex: 1; min-width: 0; }
      .dcb-settings-row-title { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 14px; font-weight: 600; line-height: 1.5; }
      .dcb-settings-card .dcb-settings-row-desc { margin-top: 3px; line-height: 1.45; }
      .dcb-settings-status { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border: 1px solid #9ba1a529; border-radius: 7px; background: #9ba1a51a; color: #697078; font-size: 11px; font-weight: 600; line-height: 1.4; transition: background-color 220ms cubic-bezier(.4,0,.2,1), border-color 220ms cubic-bezier(.4,0,.2,1), color 220ms cubic-bezier(.4,0,.2,1); }
      .dcb-settings-status[data-enabled="true"] { border-color: #49b9954a; background: #49b99524; color: #26735b; }
      .dcb-settings-controls { display: flex; align-items: center; gap: 14px; flex: 0 1 48%; min-width: 150px; }
      .dcb-settings-info { display: flex; align-items: flex-start; gap: 9px; padding: 10px 14px; border: 1px solid #0000000d; border-radius: 10px; background: #00000008; color: var(--dsw-alias-label-secondary, #6f6f6f); font-size: 12px; line-height: 1.6; }
      .dcb-settings-info::before { content: ''; flex: none; width: 7px; height: 7px; margin-top: 6px; border-radius: 50%; background: #6265fa; box-shadow: 0 0 7px #6265fa55; }
      .dcb-settings-card .dcb-settings-footnote { margin-top: 12px; font-size: 11px; }
      @keyframes dcb-settings-enter { from { opacity: 0; transform: translateY(8px); filter: blur(3px); } to { opacity: 1; transform: translateY(0); filter: blur(0px); } }
      .dcb-settings-row button, .dcb-style-option, .dcb-count-option { font-family: inherit; }
      .dcb-switch { position: relative; flex: none; width: 42px; height: 24px; padding: 0; border: 1px solid #c9c9c9; border-radius: 999px; background: #d9dce0; box-shadow: inset 0 1px 2px #0000000a; cursor: pointer; transition: background-color 220ms cubic-bezier(.4,0,.2,1), border-color 220ms cubic-bezier(.4,0,.2,1), box-shadow 220ms cubic-bezier(.4,0,.2,1); }
      .dcb-switch::after { content: ''; position: absolute; left: 2px; top: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px #0003; transform: translateX(0); transition: transform 220ms cubic-bezier(.22,.8,.26,1); }
      .dcb-switch[aria-checked="true"] { background: #6265fa; border-color: #6265fa; box-shadow: 0 2px 10px #6265fa26; }
      .dcb-switch[aria-checked="true"]::after { transform: translateX(18px); }
      .dcb-settings :is(.dcb-switch, .dcb-width-slider, .dcb-count-button, .dcb-count-option):focus-visible { outline: 2px solid #777; outline-offset: 3px; }
      .dcb-width-slider { position: relative; flex: 1; min-width: 80px; height: 28px; cursor: ew-resize; touch-action: none; user-select: none; border-radius: 6px; }
      .dcb-width-track, .dcb-width-fill { position: absolute; top: 12px; left: 0; height: 4px; border-radius: 4px; background: #dedede; width: 100%; }
      .dcb-width-fill { width: var(--dcb-width-percent); background: #555; transition: width 180ms cubic-bezier(.22,.8,.26,1); }
      .dcb-width-thumb { position: absolute; left: var(--dcb-width-percent); top: 6px; width: 16px; height: 16px; border: 1px solid #bbb; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px #0002; transform: translateX(-50%); transition: left 180ms cubic-bezier(.22,.8,.26,1), box-shadow 180ms cubic-bezier(.4,0,.2,1); }
      .dcb-width-slider[data-dragging="true"] :is(.dcb-width-fill, .dcb-width-thumb) { transition-duration: 0ms; }
      .dcb-width-slider:hover .dcb-width-thumb { box-shadow: 0 0 0 4px #8882, 0 1px 4px #0002; }
      .dcb-width-value { min-width: 47px; padding: 4px 8px; border-radius: 6px; background: #0000000a; color: var(--dsw-alias-label-primary, #555); font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; text-align: center; white-space: nowrap; }
      .dcb-count-picker { position: relative; flex: none; }
      .dcb-count-button { display: flex; align-items: center; gap: 20px; min-width: 116px; height: 32px; padding: 0 10px; border: 1px solid #00000014; border-radius: 8px; background: #ffffff80; color: var(--dsw-alias-label-primary, #343434); font-size: 12px; font-weight: 500; cursor: pointer; transition: border-color 180ms cubic-bezier(.4,0,.2,1), box-shadow 180ms cubic-bezier(.4,0,.2,1); }
      .dcb-count-button:hover, .dcb-count-button[aria-expanded="true"] { border-color: #999; box-shadow: 0 0 0 2px #8881; }
      .dcb-count-caret { width: 6px; height: 6px; margin: -3px 2px 0 auto; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(45deg); transition: transform 200ms cubic-bezier(.22,.8,.26,1); }
      .dcb-count-button[aria-expanded="true"] .dcb-count-caret { transform: translateY(3px) rotate(225deg); }
      .dcb-count-menu { position: absolute; right: 0; top: calc(100% + 6px); z-index: 12; display: grid; gap: 2px; min-width: 132px; padding: 4px; border: 1px solid #ddd; border-radius: 8px; background: var(--dsw-alias-bg-layer-1, #fff); box-shadow: 0 8px 24px #0002; transform-origin: top right; }
      .dcb-count-option { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 8px 10px; border: 0; border-radius: 5px; background: transparent; color: var(--dsw-alias-label-primary, #343434); font-size: 13px; text-align: left; cursor: pointer; transition: background-color 180ms cubic-bezier(.4,0,.2,1); }
      .dcb-count-option:hover, .dcb-count-option[aria-selected="true"] { background: #8882; }
      body[data-ds-dark-theme] .dcb-switch { background: #444; border-color: #555; }
      body[data-ds-dark-theme] .dcb-settings { color: var(--dsw-alias-label-primary, #eee); }
      body[data-ds-dark-theme] .dcb-settings-card p, body[data-ds-dark-theme] .dcb-settings :is(.dcb-settings-section-title, .dcb-style-picker legend, .dcb-settings-info) { color: var(--dsw-alias-label-secondary, #a6a8b2); }
      body[data-ds-dark-theme] .dcb-settings :is(.dcb-count-button, .dcb-count-option, .dcb-width-value) { color: var(--dsw-alias-label-primary, #eee); }
      body[data-ds-dark-theme] .dcb-switch[aria-checked="true"] { background: #777aff; border-color: #777aff; }
      body[data-ds-dark-theme] .dcb-settings-card { background: #20232bec; border-color: #ffffff1c; box-shadow: 0 16px 42px #00000059, inset 0 1px 0 #ffffff29; }
      body[data-ds-dark-theme] .dcb-settings-header { border-color: #ffffff14; }
      body[data-ds-dark-theme] .dcb-settings-badge { background: #ffffff14; border-color: #ffffff1f; color: #a3a5ff; }
      body[data-ds-dark-theme] .dcb-settings-status { color: #adb3bb; }
      body[data-ds-dark-theme] .dcb-settings-status[data-enabled="true"] { color: #70d5b3; }
      body[data-ds-dark-theme] :is(.dcb-settings-row, .dcb-settings-info) { border-color: #ffffff12; background: #ffffff0a; }
      body[data-ds-dark-theme] .dcb-width-value { background: #ffffff14; }
      body[data-ds-dark-theme] .dcb-count-button { background: #ffffff0a; }
      body[data-ds-dark-theme] .dcb-width-track { background: #555; }
      body[data-ds-dark-theme] .dcb-width-fill { background: #bbb; }
      body[data-ds-dark-theme] .dcb-count-button, body[data-ds-dark-theme] .dcb-count-menu { border-color: #555; }
      body[data-ds-dark-theme] .dcb-count-menu { background: var(--dsw-alias-bg-layer-1, #292929); box-shadow: 0 8px 24px #0005; }
      @media (prefers-reduced-motion: reduce) {
        .dcb-settings-card { animation: none; }
        .dcb-settings :is(.dcb-switch, .dcb-width-fill, .dcb-width-thumb, .dcb-count-button, .dcb-count-caret, .dcb-count-option, .dcb-style-option), .dcb-settings .dcb-switch::after, .dcb-settings .dcb-style-option::after { transition: none; }
        .dcb-settings :is(.dcb-settings-row, .dcb-settings-status) { transition: none; }
      }
      [data-dcb-native-hidden] { display: none !important; }
      [data-slot="conversation.header"]:has(.dcb-anchor) { position: relative; z-index: 20; }
      .dcb-anchor { position: relative; display: inline-flex; z-index: 20; -webkit-app-region: no-drag; }
      .dcb-entry { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; flex: none; gap: 6px; min-width: 28px; height: 24px; padding: 0 7px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-primary, #343434); font-family: inherit; font-size: 13px; font-weight: 400; line-height: 18px; white-space: nowrap; cursor: pointer; }
      .dcb-entry .dcb-logo { display: block; flex: none; }
      .dcb-entry[aria-expanded="true"], .dcb-entry:hover { background: var(--dsw-alias-interactive-bg-hover, #f1f0ed); }
      .dcb-entry[data-working="true"] { background: var(--dsw-alias-interactive-bg-hover, #f1f0ed); white-space: nowrap; font-variant-numeric: tabular-nums; }
      .dcb-context-window { position: relative; overflow: hidden; }
      .dcb-context-ghost { position: absolute; inset: 0; pointer-events: none; }
      .dcb-context-ghost * { animation: none !important; }
      .dcb-context-empty { margin: 0; color: #95918a; font-size: 12px; line-height: 20px; }
      .dcb-summary { box-sizing: border-box; position: absolute; top: calc(100% + 12px); right: 0; width: min(var(--dcb-card-width, 320px), calc(100vw - 24px)); max-height: var(--dcb-card-height, calc(100vh - 100px)); overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; border: 1px solid #e4e3df; border-radius: 14px; background: #fff; color: #242424; box-shadow: 0 2px 4px #0000000a; padding: 16px; text-align: left; font: 13px/1.6 system-ui, sans-serif; }
      .dcb-summary section + section { border-top: 1px solid #eeedeb; margin-top: 14px; padding-top: 14px; }
      .dcb-summary h3 { display: flex; align-items: center; justify-content: space-between; font-size: 13px; line-height: 20px; font-weight: 500; margin: 0; }
      .dcb-summary button { font-family: inherit; cursor: pointer; }
      .dcb-summary button:focus-visible, .dcb-entry:focus-visible { outline: 2px solid #a46950; outline-offset: 3px; }
      .dcb-close { display: grid; place-items: center; width: 24px; height: 24px; margin: -2px -2px -2px 0; padding: 3px; border: 0; border-radius: 5px; background: transparent; color: inherit; }
      .dcb-close:hover { background: #f3f2ef; }
      .dcb-timeline { list-style: none; margin: 0; padding: 0; }
      .dcb-step-window { position: relative; overflow: hidden; }
      .dcb-step-window:focus-visible { outline: 1px solid #a46950; outline-offset: -1px; border-radius: 4px; }
      .dcb-recent-steps { position: relative; }
      .dcb-step-ghost { position: absolute; top: 0; right: 0; left: 0; pointer-events: none; }
      .dcb-step-group { overflow: hidden; }
      .dcb-summary .dcb-follow { border: 0; padding: 0 4px; background: transparent; color: #95918a; font-size: 11px; line-height: 20px; }
      .dcb-summary .dcb-follow:hover { color: inherit; }
      .dcb-step, .dcb-history { position: relative; display: flex; gap: 10px; align-items: flex-start; min-height: 30px; padding: 4px 0; font-size: 13px; line-height: 21px; color: #66645f; }
      .dcb-step { --dcb-line-gap: 8px; }
      .dcb-step[data-status="in_progress"] { --dcb-line-gap: 10px; }
      .dcb-step[data-link-before]::before, .dcb-step[data-link-after]::after, .dcb-history::before { content: ''; position: absolute; left: 9.25px; width: 0; border-left: 1.5px solid var(--dcb-timeline-line, #e5e5e5); pointer-events: none; }
      .dcb-step[data-link-before]::before { top: 0; height: calc(14.5px - var(--dcb-line-gap)); }
      .dcb-step[data-link-after]::after { top: calc(14.5px + var(--dcb-line-gap)); bottom: 0; }
      .dcb-step[data-link-before="dashed"]::before, .dcb-step[data-link-after="dashed"]::after, .dcb-history::before { border-left-style: dashed; }
      .dcb-history::before { top: 5px; bottom: 0; }
      .dcb-future::before { top: 0; bottom: 9px; }
      .dcb-future[aria-expanded="true"]::before { bottom: 0; }
      .dcb-step[data-status="completed"], .dcb-step[data-status="pending"] { color: #9a9a9a; }
      .dcb-step[data-status="in_progress"] { color: #202020; font-weight: 700; }
      .dcb-status { position: relative; z-index: 1; display: grid; place-items: center; flex: 0 0 20px; width: 20px; height: 21px; }
      .dcb-status > .dcb-status-dot { position: absolute; display: block; width: 24px; height: 24px; left: 50%; top: 50%; transform: translate(-50%, -50%); overflow: visible; shape-rendering: geometricPrecision; }
      .dcb-status-core { fill: none; stroke: currentColor; stroke-width: 1px; }
      .dcb-step[data-status="completed"] .dcb-status-core, .dcb-step[data-status="in_progress"] .dcb-status-core { fill: currentColor; }
      .dcb-status-orbit, .dcb-status-ripple { display: none; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; transform-box: view-box; transform-origin: 50% 50%; }
      .dcb-step-text { overflow-wrap: anywhere; min-width: 0; }
      @media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
        .dcb-timeline[data-working="true"] .dcb-step[data-status="in_progress"] .dcb-status-orbit { display: inline; animation: dcb-orbit 1.35s linear infinite; }
        .dcb-timeline[data-working="true"] .dcb-step[data-status="in_progress"] .dcb-status-ripple { display: inline; animation: dcb-ripple 1.9s cubic-bezier(.15,.6,.3,1) infinite; }
        .dcb-timeline[data-working="true"] .dcb-step[data-status="in_progress"] .dcb-step-text { background-image: linear-gradient(100deg, var(--dcb-shimmer-base, currentColor) 38%, var(--dcb-shimmer-shoulder, #c5c5c5) 46%, var(--dcb-shimmer-peak, #fff) 50%, var(--dcb-shimmer-shoulder, #c5c5c5) 54%, var(--dcb-shimmer-base, currentColor) 62%); background-size: 250% 100%; background-repeat: no-repeat; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: dcb-text-shimmer 2.4s linear infinite; }
      }
      @media (forced-colors: active) { .dcb-summary { --dcb-timeline-line: GrayText; } .dcb-step-text { -webkit-text-fill-color: CanvasText; } }
      .dcb-history { border: 0; background: transparent; width: 100%; text-align: left; color: #95918a; font-size: 12px; padding-top: 0; }
      .dcb-summary .dcb-history:focus-visible { outline-offset: -2px; border-radius: 5px; }
      .dcb-history .dcb-status { color: #d8d6d1; }
      .dcb-history-label { display: inline-flex; align-items: center; gap: 5px; }
      .dcb-history-label svg { transition: transform 280ms cubic-bezier(.22,.8,.25,1); }
      .dcb-history[aria-expanded="true"] svg { transform: rotate(180deg); }
      .dcb-output { display: flex; align-items: center; gap: 10px; width: 100%; padding: 5px 2px; background: transparent; border: 0; text-align: left; color: #66645f; border-radius: 6px; font-size: 13px; }
      .dcb-output:hover { background: #f6f5f2; }
      .dcb-tile { display: grid; place-items: center; flex: 0 0 30px; width: 30px; height: 30px; border-radius: 7px; overflow: hidden; background: #f1f0ec; color: #8b8679; font-size: 9px; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; }
      .dcb-tile > img { display: block; width: 100%; height: 100%; object-fit: cover; }
      .dcb-tile[data-kind="image"]:not(:has(img)) { color: #a8a294; }
      .dcb-file-name { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dcb-file-type { flex: none; color: #95918a; font-size: 11px; text-transform: uppercase; }
      .dcb-module-toggle { display: inline-flex; align-items: center; gap: 6px; background: none; border: 0; padding: 0; color: inherit; font-size: 13px; }
      .dcb-module-toggle svg { color: #9a9790; transition: transform 280ms cubic-bezier(.22,.8,.25,1); }
      .dcb-module-toggle[aria-expanded="false"] svg { transform: rotate(-90deg); }
      .dcb-collapse { display: grid; grid-template-rows: 1fr; opacity: 1; overflow: hidden; transition: grid-template-rows 280ms cubic-bezier(.22,.8,.25,1), opacity 200ms ease; }
      .dcb-collapse[aria-hidden="true"] { grid-template-rows: 0fr; opacity: 0; }
      .dcb-collapse-inner { min-height: 0; overflow: hidden; }
      .dcb-module-body { padding-top: 10px; }
      .dcb-resource { display: flex; align-items: center; gap: 10px; padding: 7px 2px; color: #66645f; font-size: 13px; }
      .dcb-resource > svg, .dcb-output > svg { flex: 0 0 18px; }
      .dcb-resource-label { flex-shrink: 0; max-width: 50%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dcb-resource-detail { margin-left: auto; min-width: 0; color: #95918a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
      .dcb-tool-summary { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 32px; padding: 5px 2px; border: 0; border-radius: 5px; background: transparent; text-align: left; color: #66645f; font-size: 13px; }
      .dcb-tool-summary:hover { background: #f6f5f2; }
      .dcb-tool-summary > svg { flex: none; }
      .dcb-tool-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dcb-tool-count { flex: none; color: #95918a; font-size: 11px; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .dcb-tool-failed { flex: none; color: #9b6662; font-size: 11px; white-space: nowrap; }
      .dcb-tool-chevron { color: #95918a; transition: transform 240ms cubic-bezier(.4,0,.2,1); }
      .dcb-tool-summary[aria-expanded="true"] .dcb-tool-chevron { transform: rotate(180deg); }
      .dcb-tools-disclosure { overflow: hidden; }
      .dcb-tools-body { padding-top: 4px; }
      .dcb-tools-body .dcb-resource { padding-block: 5px; }
      .dcb-tool-row .dcb-resource-label { flex: 1; min-width: 0; max-width: none; }
      .dcb-tool-category { flex: none; color: #95918a; font-size: 10px; line-height: 16px; }
      .dcb-tool-row .dcb-resource-detail { flex: 0 1 auto; }
      .dcb-tool-symbol { animation: dcb-tool-icon-in 220ms cubic-bezier(.22,.8,.26,1); }
      @keyframes dcb-tool-icon-in { from { opacity: 0; transform: translateY(6px) scale(.9); filter: blur(2px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
      .dcb-tool-summary[data-working="true"], .dcb-tool-row[data-working="true"] { color: #202020; --dcb-shimmer-base: #202020; }
      @media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
        .dcb-tool-summary[data-working="true"] .dcb-tool-name { background-image: linear-gradient(100deg, var(--dcb-shimmer-base) 44%, var(--dcb-tool-sheen, #767676) 50%, var(--dcb-shimmer-base) 56%); background-size: 250% 100%; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: dcb-text-shimmer 2.4s linear infinite; }
      }
      @media (prefers-reduced-motion: reduce), (forced-colors: active) { .dcb-tool-chevron { transition: none; } .dcb-tool-symbol { animation: none; } }
      .dcb-note { font-size: 11px; color: #9a9790; margin: 8px 0 0; }
      @keyframes dcb-orbit { to { transform: rotate(360deg); } }
      @keyframes dcb-ripple { 0% { transform: scale(.85); opacity: .35; } 75%, 100% { transform: scale(1.8); opacity: 0; } }
      @keyframes dcb-text-shimmer { 0% { background-position: 100% 0; } 70%, 100% { background-position: 0% 0; } }
      @media (prefers-reduced-motion: reduce) { .dcb-collapse, .dcb-module-toggle svg, .dcb-history-label svg { transition: none; } }
      body[data-ds-dark-theme] .dcb-summary { --dcb-timeline-line: #4d4b46; background: #292824; color: #eeeae2; border-color: #45423b; box-shadow: 0 2px 6px #0003; }
      body[data-ds-dark-theme] .dcb-summary section + section { border-color: #45423b; }
      body[data-ds-dark-theme] .dcb-step, body[data-ds-dark-theme] .dcb-output, body[data-ds-dark-theme] .dcb-resource { color: #cec9bd; }
      body[data-ds-dark-theme] .dcb-tool-summary { color: #cec9bd; }
      body[data-ds-dark-theme] .dcb-tool-category { color: #aaa294; }
      body[data-ds-dark-theme] .dcb-tool-summary:hover { background: #37352f; }
      body[data-ds-dark-theme] .dcb-tool-summary[data-working="true"], body[data-ds-dark-theme] .dcb-tool-row[data-working="true"] { color: #f2f2f2; --dcb-shimmer-base: #d2d2d2; --dcb-tool-sheen: #fff; }
      body[data-ds-dark-theme] .dcb-tool-failed { color: #e9b0a9; }
      body[data-ds-dark-theme] .dcb-output:hover, body[data-ds-dark-theme] .dcb-close:hover { background: #37352f; }
      body[data-ds-dark-theme] .dcb-tile { background: #37352f; color: #b8b1a3; }
      body[data-ds-dark-theme] .dcb-step[data-status="completed"], body[data-ds-dark-theme] .dcb-step[data-status="pending"] { color: #8d8d8d; }
      body[data-ds-dark-theme] .dcb-step[data-status="in_progress"] { color: #f2f2f2; --dcb-shimmer-base: #d2d2d2; }
      @media (max-width: 600px) { .dcb-summary { padding: 14px; } }
      .dcb-style-picker { border: 0; padding: 0; margin: 0 0 18px; min-width: 0; }
      .dcb-settings-card .dcb-style-picker > p { margin: -3px 0 12px; font-size: 11px; }
      .dcb-style-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
      .dcb-settings .dcb-style-option { position: relative; display: grid; grid-template-rows: 66px auto 1fr; justify-items: center; gap: 8px; min-width: 0; padding: 14px 12px 13px; border: 1.5px solid #00000014; border-radius: 14px; background: #00000008; text-align: center; cursor: pointer; transition: border-color 220ms cubic-bezier(.4,0,.2,1), background-color 220ms cubic-bezier(.4,0,.2,1), box-shadow 220ms cubic-bezier(.4,0,.2,1); }
      .dcb-settings .dcb-style-option:hover { background: #ffffffb3; border-color: #00000026; }
      .dcb-settings .dcb-style-option[aria-checked="true"] { background: #ffffffd9; border-color: #4d6bfe; box-shadow: 0 4px 16px #4d6bfe38; }
      .dcb-style-option:focus-visible { outline: 2px solid #777; outline-offset: 3px; }
      .dcb-style-option::after { content: ''; position: absolute; top: 11px; right: 11px; width: 7px; height: 7px; border: 1px solid #7f87926b; border-radius: 50%; background: #ffffff80; opacity: .65; transition: background-color 220ms cubic-bezier(.4,0,.2,1), border-color 220ms cubic-bezier(.4,0,.2,1), opacity 220ms cubic-bezier(.4,0,.2,1); }
      .dcb-style-option[aria-checked="true"]::after { background: #4d6bfe; border-color: #4d6bfe; opacity: 1; }
      .dcb-style-scene { display: grid; place-items: center; width: 100%; height: 66px; overflow: hidden; border-radius: 8px; background: linear-gradient(125deg, transparent 38%, #ffffffb3 38% 44%, transparent 44%), radial-gradient(ellipse at 15% 30%, #a6cbd0, transparent 60%), radial-gradient(ellipse at 85% 80%, #d9b59b, transparent 60%), #e8e4dc; }
      .dcb-style-swatch { box-sizing: border-box; position: relative; display: grid; align-content: center; justify-items: start; gap: 6px; width: 82px; height: 48px; padding: 12px; border: 1px solid; border-radius: 12px; opacity: 1; transform: translateY(0); transition: transform 240ms cubic-bezier(.22,.8,.26,1); }
      .dcb-style-option[aria-checked="true"] .dcb-style-swatch { transform: translateY(-6px); }
      .dcb-style-swatch i { width: 45px; height: 3px; border-radius: 3px; background: #847b72; opacity: .5; }
      .dcb-style-swatch i:last-child { width: 30px; opacity: .3; }
      .dcb-style-name { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary, #343434); line-height: 1.4; }
      .dcb-style-option small { color: var(--dsw-alias-label-secondary, #6f6f6f); font-size: 11px; line-height: 1.45; }
      body[data-ds-dark-theme] .dcb-settings .dcb-style-option { background: #ffffff08; border-color: #ffffff1f; }
      body[data-ds-dark-theme] .dcb-settings .dcb-style-option:hover { background: #ffffff10; border-color: #ffffff33; }
      body[data-ds-dark-theme] .dcb-settings .dcb-style-option[aria-checked="true"] { background: #4d6bfe14; border-color: #7f91ff; box-shadow: 0 4px 16px #00000033, 0 0 12px #4d6bfe1a; }
      body[data-ds-dark-theme] .dcb-style-option::after { background: #ffffff14; border-color: #aab0ba66; }
      body[data-ds-dark-theme] .dcb-style-option[aria-checked="true"]::after { background: #8b9bff; border-color: #8b9bff; }
      body[data-ds-dark-theme] .dcb-style-name { color: #eeeae2; }
      body[data-ds-dark-theme] .dcb-style-option small { color: var(--dsw-alias-label-secondary, #a6a8b2); }
      body[data-ds-dark-theme] .dcb-style-scene { background: linear-gradient(125deg, transparent 38%, #ffffff40 38% 44%, transparent 44%), radial-gradient(ellipse at 15% 30%, #416b72, transparent 60%), radial-gradient(ellipse at 85% 80%, #7b5540, transparent 60%), #302e29; }
      body[data-ds-dark-theme] .dcb-style-swatch i { background: #e3ddd4; }
      @media (max-width: 600px) {
        .dcb-settings { padding: 12px; }
        .dcb-settings-card { padding: 18px 16px 20px; }
        .dcb-settings-header { gap: 10px; }
        .dcb-settings-badge { font-size: 10px; padding-inline: 8px; }
        .dcb-style-options { grid-template-columns: minmax(0, 1fr); }
        .dcb-settings-controls { flex-basis: 100%; }
        .dcb-settings-row[data-setting="width"] { flex-wrap: wrap; gap: 8px; }
      }
      @media (forced-colors: active) {
        .dcb-settings-card, .dcb-settings :is(.dcb-settings-row, .dcb-settings-info, .dcb-settings-badge, .dcb-settings-status, .dcb-style-option, .dcb-count-button, .dcb-count-menu) { background: Canvas !important; border-color: CanvasText !important; color: CanvasText !important; box-shadow: none !important; }
        .dcb-settings-card p, .dcb-settings :is(.dcb-settings-section-title, .dcb-style-name, .dcb-style-option small, .dcb-style-picker legend) { color: CanvasText !important; }
        .dcb-settings .dcb-style-option[aria-checked="true"] { outline: 2px solid Highlight; outline-offset: -2px; }
        .dcb-settings .dcb-style-option[aria-checked="true"]::after, .dcb-settings-info::before { background: Highlight; border-color: Highlight; box-shadow: none; }
        .dcb-settings .dcb-switch { background: ButtonFace; border-color: ButtonText; box-shadow: none; }
        .dcb-settings .dcb-switch[aria-checked="true"] { background: Highlight; border-color: Highlight; }
        .dcb-settings .dcb-switch::after { background: ButtonText; }
        .dcb-settings .dcb-switch[aria-checked="true"]::after { background: HighlightText; }
        .dcb-settings :is(.dcb-width-track, .dcb-width-fill, .dcb-width-thumb) { background: ButtonText; border-color: ButtonText; }
      }
      @property --dcb-backdrop-blur { syntax: "<length>"; inherits: false; initial-value: 0px; }
      @property --dcb-backdrop-saturation { syntax: "<number>"; inherits: false; initial-value: 1; }
      @property --dcb-refraction-scale { syntax: "<number>"; inherits: false; initial-value: 0; }
      @property --dcb-sheen-opacity { syntax: "<number>"; inherits: false; initial-value: 0; }
      body :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style] {
        --dcb-surface-background: #fffdf9; --dcb-surface-border: #e8e4dc; --dcb-surface-shadow: 0 4px 14px rgba(38,32,24,.07);
        --dcb-backdrop-blur: 0px; --dcb-backdrop-saturation: 1; --dcb-refraction-scale: 0; --dcb-sheen-opacity: 0;
        background-color: var(--dcb-surface-background) !important;
        background-image: radial-gradient(ellipse at 8% 0%, rgb(255 255 255 / calc(var(--dcb-sheen-opacity) * .28)), transparent 56%), linear-gradient(123deg, rgb(255 255 255 / calc(var(--dcb-sheen-opacity) * .1)), transparent 28% 72%, rgb(255 255 255 / calc(var(--dcb-sheen-opacity) * .08))) !important;
        background-origin: border-box; border-color: var(--dcb-surface-border) !important; box-shadow: var(--dcb-surface-shadow) !important;
        /* A URL makes ordinary filter transitions discrete. Typed values retain smooth interpolation. */
        backdrop-filter: var(--dcb-liquid-filter,) blur(var(--dcb-backdrop-blur)) saturate(var(--dcb-backdrop-saturation)) !important;
        -webkit-backdrop-filter: var(--dcb-liquid-filter,) blur(var(--dcb-backdrop-blur)) saturate(var(--dcb-backdrop-saturation)) !important;
        transition: background-color 240ms cubic-bezier(.4,0,.2,1), border-color 240ms cubic-bezier(.4,0,.2,1), box-shadow 240ms cubic-bezier(.4,0,.2,1), --dcb-backdrop-blur 240ms cubic-bezier(.4,0,.2,1), --dcb-backdrop-saturation 240ms cubic-bezier(.4,0,.2,1), --dcb-refraction-scale 240ms cubic-bezier(.4,0,.2,1), --dcb-sheen-opacity 240ms cubic-bezier(.4,0,.2,1);
      }
      body[data-ds-dark-theme] :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style] { --dcb-surface-background: #292824; --dcb-surface-border: #45423b; --dcb-surface-shadow: 0 4px 16px #00000038; }
      body :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style="clear"] {
        --dcb-surface-background: rgba(255,255,255,.56); --dcb-surface-border: rgba(255,255,255,.74); --dcb-backdrop-saturation: 1.15; --dcb-refraction-scale: 12; --dcb-sheen-opacity: 1;
        --dcb-surface-shadow: 0 2px 6px rgba(28,32,40,.035), 0 10px 28px rgba(28,32,40,.09), inset 0 1px 0 rgba(255,255,255,.92), inset 1px 0 0 rgba(255,255,255,.42), inset -1px -1px 0 rgba(255,255,255,.18);
      }
      body[data-ds-dark-theme] :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style="clear"] {
        --dcb-surface-background: rgba(24,28,36,.22); --dcb-surface-border: rgba(255,255,255,.4); --dcb-sheen-opacity: .52;
        --dcb-surface-shadow: 0 2px 6px #00000014, 0 10px 28px #00000042, inset 0 1px 0 #ffffff42, inset 1px 0 0 #ffffff1a, inset -1px -1px 0 #ffffff0c;
      }
      body :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style="glass"] {
        --dcb-surface-background: rgba(236,242,248,.62); --dcb-surface-border: rgba(255,255,255,.72); --dcb-backdrop-blur: 22px; --dcb-backdrop-saturation: 1.45; --dcb-sheen-opacity: .22;
        --dcb-surface-shadow: 0 12px 32px rgba(28,32,40,.1), inset 0 1px 0 rgba(255,255,255,.9), inset 1px 0 0 rgba(255,255,255,.45), inset -1px -1px 0 rgba(255,255,255,.2);
      }
      body[data-ds-dark-theme] :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style="glass"] {
        --dcb-surface-background: rgba(160,174,190,.26); --dcb-surface-border: rgba(255,255,255,.34); --dcb-sheen-opacity: .32;
        --dcb-surface-shadow: 0 12px 32px #0005, inset 0 1px 0 #ffffff52, inset 1px 0 0 #ffffff24, inset -1px -1px 0 #ffffff14;
      }
      /* Glass needs its own foreground palette; the default material keeps its original colors. */
      body ${GLASS_PANEL} {
        --dcb-ink-primary: #20242a; --dcb-ink-body: #414852; --dcb-ink-muted: #59616d; --dcb-ink-active: #16191d;
        --dcb-ink-failure: #a3443d; --dcb-content-separator: rgba(30,42,58,.16); --dcb-timeline-line: #aab2bd;
        --dcb-content-hover: rgba(0,0,0,.045); --dcb-content-tile: rgba(30,42,58,.07);
        --dcb-ink-sheen-base: #16191d; --dcb-shimmer-shoulder: #b4bcc7; --dcb-shimmer-peak: #fff; --dcb-tool-sheen: #778494;
        color: var(--dcb-ink-primary);
      }
      body[data-ds-dark-theme] ${GLASS_PANEL} {
        --dcb-ink-primary: #f4f6f8; --dcb-ink-body: #dce2e9; --dcb-ink-muted: #c8d0da; --dcb-ink-active: #fff;
        --dcb-ink-failure: #ffc1ba; --dcb-content-separator: rgba(225,233,242,.22); --dcb-timeline-line: #818b98;
        --dcb-content-hover: rgba(255,255,255,.08); --dcb-content-tile: rgba(225,233,242,.1);
        --dcb-ink-sheen-base: #dce2e9; --dcb-shimmer-shoulder: #edf1f5; --dcb-tool-sheen: #fff;
      }
      body ${GLASS_PANEL} section + section { border-color: var(--dcb-content-separator); }
      body ${GLASS_PANEL} :is(.dcb-step, .dcb-output, .dcb-resource, .dcb-tool-summary) { color: var(--dcb-ink-body); }
      body ${GLASS_PANEL} :is(.dcb-step[data-status="completed"], .dcb-step[data-status="pending"], .dcb-history, .dcb-follow,
        .dcb-resource-detail, .dcb-file-type, .dcb-tool-count, .dcb-tool-category, .dcb-tool-chevron, .dcb-note, .dcb-context-empty) { color: var(--dcb-ink-muted); }
      body ${GLASS_PANEL} .dcb-history .dcb-status { color: var(--dcb-timeline-line); }
      body ${GLASS_PANEL} :is(.dcb-step[data-status="in_progress"], .dcb-tool-summary[data-working="true"], .dcb-tool-row[data-working="true"]) {
        color: var(--dcb-ink-active); --dcb-shimmer-base: var(--dcb-ink-sheen-base);
      }
      body ${GLASS_PANEL} .dcb-follow:hover { color: var(--dcb-ink-active); }
      body ${GLASS_PANEL} .dcb-tool-failed { color: var(--dcb-ink-failure); }
      body ${GLASS_PANEL} .dcb-tile { background: var(--dcb-content-tile); color: var(--dcb-ink-body); }
      body ${GLASS_PANEL} .dcb-tile[data-kind="image"]:not(:has(img)) { color: var(--dcb-ink-muted); }
      body ${GLASS_PANEL} :is(.dcb-step, .dcb-history, .dcb-follow, .dcb-output, .dcb-resource, .dcb-tool-summary,
        .dcb-resource-detail, .dcb-file-type, .dcb-tool-count, .dcb-tool-category, .dcb-note, .dcb-context-empty) {
        transition: color 180ms cubic-bezier(.4,0,.2,1), background-color 180ms cubic-bezier(.4,0,.2,1);
      }
      body ${GLASS_PANEL} :focus-visible { outline-color: var(--dcb-ink-muted); }
      body [${MARK}]:is([data-card-style="clear"], [data-card-style="glass"]) button > span { color: var(--dcb-ink-body) !important; }
      body [${MARK}]:is([data-card-style="clear"], [data-card-style="glass"]) button > span:first-child { color: var(--dcb-ink-body) !important; }
      body [${MARK}]:is([data-card-style="clear"], [data-card-style="glass"]) button > :is(span:nth-child(3), span:last-child) { color: var(--dcb-ink-muted) !important; }
      body [${MARK}]:is([data-card-style="clear"], [data-card-style="glass"]) li { color: var(--dcb-ink-muted); }
      body [${MARK}]:is([data-card-style="clear"], [data-card-style="glass"]) li[data-status="in_progress"] { color: var(--dcb-ink-active); font-weight: 700; }
      body [${MARK}]:is([data-card-style="clear"], [data-card-style="glass"]) li > span:last-child { color: inherit !important; }
      body .dcb-style-swatch[data-card-style] { transition: background-color 240ms cubic-bezier(.4,0,.2,1), border-color 240ms cubic-bezier(.4,0,.2,1), box-shadow 240ms cubic-bezier(.4,0,.2,1), --dcb-backdrop-blur 240ms cubic-bezier(.4,0,.2,1), --dcb-backdrop-saturation 240ms cubic-bezier(.4,0,.2,1), --dcb-refraction-scale 240ms cubic-bezier(.4,0,.2,1), --dcb-sheen-opacity 240ms cubic-bezier(.4,0,.2,1), transform 240ms cubic-bezier(.22,.8,.26,1); }
      .dcb-summary :is(.dcb-tool-summary, .dcb-output, .dcb-close) { transition: background-color 180ms cubic-bezier(.4,0,.2,1); }
      body ${GLASS_PANEL} :is(.dcb-tool-summary, .dcb-output, .dcb-close):hover { background: var(--dcb-content-hover); }
      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        body :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style="glass"] { --dcb-surface-background: rgba(236,242,248,.96); }
        body[data-ds-dark-theme] :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style="glass"] { --dcb-surface-background: rgba(65,72,81,.96); }
      }
      @media (prefers-reduced-motion: reduce), (forced-colors: active) {
        body :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style], .dcb-settings .dcb-style-option, .dcb-summary :is(.dcb-tool-summary, .dcb-output, .dcb-close) { transition: none; }
        body ${GLASS_PANEL} :is(.dcb-step, .dcb-history, .dcb-follow, .dcb-output, .dcb-resource, .dcb-tool-summary,
          .dcb-resource-detail, .dcb-file-type, .dcb-tool-count, .dcb-tool-category, .dcb-note, .dcb-context-empty) { transition: none; }
      }
      @media (forced-colors: active) {
        body :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style] { background: Canvas !important; border-color: CanvasText !important; box-shadow: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
        body ${GLASS_PANEL}, body[data-ds-dark-theme] ${GLASS_PANEL} {
          --dcb-ink-primary: CanvasText; --dcb-ink-body: CanvasText; --dcb-ink-muted: CanvasText; --dcb-ink-active: CanvasText;
          --dcb-ink-failure: CanvasText; --dcb-timeline-line: GrayText; --dcb-content-separator: GrayText; --dcb-content-hover: ButtonFace; --dcb-content-tile: ButtonFace;
        }
        body ${GLASS_PANEL} :focus-visible { outline-color: Highlight; }
      }
    `

    function apply(ctx) {
      let settings = readSettings()
      let frame = 0
      let disposed = false
      const listeners = new Set()
      const stylePreviewListeners = new Set()
      const previewStyle = active => { for (const listener of stylePreviewListeners) listener(active) }
      const originals = new Map()
      const observed = new Set()
      const summaryOwners = new Map()
      const openedBySession = new Map()
      const autoOpenedSessions = new Set()
      // Track real plan changes separately from tool/output activity and hover previews.
      const planRuns = new Map()
      const style = document.createElement('style')
      style.dataset.plugin = NAME
      style.textContent = css
      document.head.appendChild(style)
      const liquid = createLiquidGlassManager(document, window)

      function restore(panel) {
        panel.removeAttribute('data-dcb-native-hidden')
        const saved = originals.get(panel)
        if (!saved) return
        for (const [key, value, priority] of saved.variables) {
          if (value) panel.style.setProperty(key, value, priority)
          else panel.style.removeProperty(key)
        }
        panel.removeAttribute(MARK)
        if (saved.cardStyle === null) panel.removeAttribute('data-card-style')
        else panel.setAttribute('data-card-style', saved.cardStyle)
        originals.delete(panel)
      }

      const resize = new ResizeObserver(() => schedule())
      function sync() {
        frame = 0
        if (disposed) return
        const panels = settings.enabled ? [...document.querySelectorAll(PANEL)] : []
        for (const panel of document.querySelectorAll('[data-dcb-native-hidden]')) {
          if (!settings.enabled || !summaryOwners.has(panel.closest('[data-conversation-content]')?.dataset.conversationSession)) panel.removeAttribute('data-dcb-native-hidden')
        }
        const containers = new Set()
        for (const panel of [...originals.keys()]) if (!panels.includes(panel)) restore(panel)
        for (const panel of panels) {
          const container = panel.closest('[data-conversation-content]')
          if (!container || container.getClientRects().length === 0 ||
              window.getComputedStyle(container).visibility === 'hidden') {
            restore(panel)
            continue
          }
          containers.add(container)
          if (summaryOwners.has(container.dataset.conversationSession)) {
            restore(panel)
            panel.setAttribute('data-dcb-native-hidden', '')
            continue
          }
          const composer = panel.closest('[data-composer-seat]')
          const position = placement(container.getBoundingClientRect(), {
            width: window.innerWidth, height: window.innerHeight,
          }, settings.width, composer?.getBoundingClientRect().top)
          if (!position) { restore(panel); continue }
          if (!originals.has(panel)) {
            originals.set(panel, { variables: VARIABLES.map(key => [key, panel.style.getPropertyValue(key), panel.style.getPropertyPriority(key)]), cardStyle: panel.getAttribute('data-card-style') })
          }
          const values = [position.left, position.top, position.width, position.listHeight]
          VARIABLES.forEach((key, index) => {
            const next = `${values[index]}px`
            if (panel.style.getPropertyValue(key) !== next) panel.style.setProperty(key, next)
          })
          if (!panel.hasAttribute(MARK)) panel.setAttribute(MARK, '')
          if (panel.dataset.cardStyle !== settings.cardStyle) panel.dataset.cardStyle = settings.cardStyle
        }
        for (const container of observed) if (!containers.has(container)) { resize.unobserve(container); observed.delete(container) }
        for (const container of containers) if (!observed.has(container)) { resize.observe(container); observed.add(container) }
        liquid.sync([...document.querySelectorAll(`.dcb-summary[data-card-style], [${MARK}][data-card-style], .dcb-style-swatch[data-card-style]`)])
      }
      function schedule() { if (!frame && !disposed) frame = window.requestAnimationFrame(sync) }
      function update(patch, persist = true) {
        settings = normalize({ ...settings, ...patch })
        if (persist) {
          try { window.localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* private browsing */ }
        }
        schedule()
        for (const listener of listeners) listener()
      }
      const onStorage = event => { if (event.key === KEY || event.key === null) update(readSettings(), false) }
      const observer = new MutationObserver(schedule)
      observer.observe(document.body, { childList: true, subtree: true, attributes: true,
        attributeFilter: ['data-conversation-session', 'data-card-style', 'hidden', 'class'] })
      window.addEventListener('resize', schedule)
      // Capture scroll also handles embedded conversation columns and moved panes.
      document.addEventListener('scroll', schedule, true)
      window.addEventListener('storage', onStorage)
      sync()

      function WidthSlider() {
        const [dragging, setDragging] = React.useState(false)
        const setWidth = value => {
          const width = Math.max(280, Math.min(480, Math.round(value / 10) * 10))
          if (settings.width !== width) update({ width })
        }
        const move = event => {
          const box = event.currentTarget.getBoundingClientRect()
          if (box.width) setWidth(280 + Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)) * 200)
        }
        const stop = event => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
          setDragging(false)
        }
        return h('div', { className: 'dcb-width-slider', role: 'slider', tabIndex: 0, 'aria-label': '面板宽度',
          'aria-valuemin': 280, 'aria-valuemax': 480, 'aria-valuenow': settings.width, 'aria-valuetext': `${settings.width} 像素`,
          'data-dragging': dragging, style: { '--dcb-width-percent': `${(settings.width - 280) / 2}%` },
          onPointerDown: event => {
            if (event.button !== 0) return
            event.preventDefault()
            event.currentTarget.focus()
            event.currentTarget.setPointerCapture(event.pointerId)
            setDragging(true)
            move(event)
          },
          onPointerMove: event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event) },
          onPointerUp: stop, onPointerCancel: stop, onLostPointerCapture: () => setDragging(false),
          onKeyDown: event => {
            const value = { Home: 280, End: 480, ArrowRight: settings.width + 10, ArrowUp: settings.width + 10,
              ArrowLeft: settings.width - 10, ArrowDown: settings.width - 10, PageUp: settings.width + 50, PageDown: settings.width - 50 }[event.key]
            if (value === undefined) return
            event.preventDefault()
            setWidth(value)
          } }, h('span', { className: 'dcb-width-track', 'aria-hidden': true }), h('span', { className: 'dcb-width-fill', 'aria-hidden': true }), h('span', { className: 'dcb-width-thumb', 'aria-hidden': true }))
      }

      function StepCountPicker() {
        const [open, setOpen] = React.useState(false)
        const [present, setPresent] = React.useState(false)
        const box = React.useRef(null)
        const menu = React.useRef(null)
        const button = React.useRef(null)
        const focusIndex = React.useRef(null)
        const motion = React.useRef(null)
        const id = React.useId()
        const values = [2, 3]
        const show = index => {
          focusIndex.current = index
          if (open && index !== null) {
            menu.current?.querySelectorAll('[role="option"]')[index]?.focus()
            focusIndex.current = null
          }
          setPresent(true)
          setOpen(true)
        }
        const dismiss = restore => { setOpen(false); if (restore) button.current?.focus() }
        React.useLayoutEffect(() => () => { motion.current?.cancel(); motion.current = null }, [])
        React.useLayoutEffect(() => {
          const node = menu.current
          const previous = motion.current
          const hidden = { opacity: 0, transform: 'translateY(-8px) scale(.94)', filter: 'blur(3px)' }
          const visible = { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' }
          let from = open ? hidden : visible
          if (node && previous?.effect?.target === node) {
            const style = getComputedStyle(node)
            from = { opacity: style.opacity, transform: style.transform, filter: style.filter }
          }
          previous?.cancel()
          motion.current = null
          if (!present || !node) return
          const animation = node.animate([from, open ? visible : hidden], {
            duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : open ? 220 : 180,
            easing: open ? 'cubic-bezier(.22,.8,.26,1)' : 'cubic-bezier(.4,0,.2,1)', fill: 'both',
          })
          motion.current = animation
          if (open && focusIndex.current !== null) {
            node.querySelectorAll('[role="option"]')[focusIndex.current]?.focus()
            focusIndex.current = null
          }
          animation.finished.then(() => {
            if (motion.current !== animation) return
            if (open) { motion.current = null; animation.cancel() }
            else setPresent(false)
          }).catch(() => {})
        }, [open, present])
        React.useEffect(() => {
          if (!open) return
          const away = event => { if (!box.current?.contains(event.target)) dismiss(false) }
          const escape = event => { if (event.key === 'Escape') { event.preventDefault(); dismiss(true) } }
          document.addEventListener('pointerdown', away)
          document.addEventListener('keydown', escape)
          return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', escape) }
        }, [open])
        return h('div', { className: 'dcb-count-picker', ref: box,
          onKeyDown: event => { if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(true) } },
          onBlur: event => { if (!event.currentTarget.contains(event.relatedTarget)) dismiss(false) } },
          h('button', { type: 'button', className: 'dcb-count-button', ref: button, 'aria-label': '默认显示步骤数',
            'aria-haspopup': 'listbox', 'aria-expanded': open, 'aria-controls': present ? id : undefined,
            onClick: () => open ? dismiss(false) : show(null),
            onKeyDown: event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                if (open) dismiss(false)
                else show(values.indexOf(settings.progressView.count))
                return
              }
              if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              show(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : values.indexOf(settings.progressView.count))
            } }, `${settings.progressView.count} 个步骤`, h('span', { className: 'dcb-count-caret', 'aria-hidden': true })),
          present && h('div', { id, className: 'dcb-count-menu', ref: menu, role: 'listbox', 'aria-label': '默认显示步骤数选项', 'aria-hidden': !open, inert: !open, 'data-state': open ? 'open' : 'closing',
            onKeyDown: event => {
              const options = [...event.currentTarget.querySelectorAll('[role="option"]')]
              const index = options.indexOf(document.activeElement)
              const next = { ArrowDown: (index + 1) % 2, ArrowUp: (index + 1) % 2, Home: 0, End: 1 }[event.key]
              if (next === undefined) return
              event.preventDefault()
              options[next]?.focus()
            } }, values.map(value => h('button', { type: 'button', role: 'option', className: 'dcb-count-option', key: value,
              'aria-selected': settings.progressView.count === value, tabIndex: open ? 0 : -1,
              onClick: () => { update({ progressView: { ...settings.progressView, count: value } }); dismiss(true) } }, `${value} 个步骤`, h('span', { 'aria-hidden': true }, settings.progressView.count === value ? '✓' : '')))))
      }

      function Settings() {
        const [, render] = React.useReducer(value => value + 1, 0)
        React.useEffect(() => { listeners.add(render); return () => listeners.delete(render) }, [])
        React.useEffect(() => () => previewStyle(false), [])
        const h = React.createElement
        const materials = [['clear', '透明玻璃', '液态折射，通透亮边'], ['glass', '毛玻璃', '朦胧磨砂，柔和悬浮'], ['milk', '默认', '保留原始配色与样式']]
        const materialName = materials.find(([value]) => value === settings.cardStyle)?.[1] || '默认'
        return h('div', { className: 'dcb-settings' },
          h('section', { className: 'dcb-settings-block dcb-settings-card', 'data-dcb-settings-block': 'panel' },
            h('div', { className: 'dcb-settings-header' },
              h('div', null, h('h2', null, '任务面板'), h('p', null, '右上角任务卡片的显示、材质与进度布局')),
              h('span', { className: 'dcb-settings-badge' }, 'Task Panel')),
            h('div', { className: 'dcb-settings-section' },
              h('div', { className: 'dcb-settings-section-title' }, '面板开关'),
              h('div', { className: 'dcb-settings-row dcb-panel-toggle' },
                h('div', { className: 'dcb-settings-copy' },
                  h('div', { className: 'dcb-settings-row-title' }, '右上角任务面板',
                    h('span', { className: 'dcb-settings-status', 'data-enabled': settings.enabled }, settings.enabled ? '✓ 已开启' : '已关闭')),
                  h('p', { className: 'dcb-settings-row-desc' }, settings.enabled ? '悬浮预览；点击入口或安排新步骤时保持展开。' : '开启后，在右上角查看当前轮次的任务进度与输出。')),
                h('button', { type: 'button', role: 'switch', className: 'dcb-switch', 'aria-label': '启用右上角任务面板', 'aria-checked': settings.enabled,
                  onClick: () => update({ enabled: !settings.enabled }) }))),
            h('fieldset', { className: 'dcb-style-picker', 'data-dcb-card-style-picker': '' }, h('legend', null, '卡片样式'),
              h('p', null, '选择后实时预览当前任务卡片；当前轮次没有内容时保持隐藏。'),
              h('div', { className: 'dcb-style-options', role: 'radiogroup', 'aria-label': '卡片样式' }, materials.map(([value, label, description], index) =>
                h('button', { type: 'button', role: 'radio', className: 'dcb-style-option', key: value, 'aria-label': label, 'aria-checked': settings.cardStyle === value,
                  tabIndex: settings.cardStyle === value ? 0 : -1, onClick: () => { update({ cardStyle: value }); previewStyle(true) },
                  onKeyDown: event => {
                    const next = { ArrowRight: (index + 1) % 3, ArrowDown: (index + 1) % 3, ArrowLeft: (index + 2) % 3, ArrowUp: (index + 2) % 3, Home: 0, End: 2 }[event.key]
                    if (next === undefined) return
                    event.preventDefault()
                    update({ cardStyle: ['clear', 'glass', 'milk'][next] })
                    previewStyle(true)
                    event.currentTarget.parentElement.children[next]?.focus()
                  } },
                  h('span', { className: 'dcb-style-scene', 'aria-hidden': true }, h('span', { className: 'dcb-style-swatch', 'data-card-style': value }, h('i'), h('i'))),
                  h('span', { className: 'dcb-style-name' }, label), h('small', null, description))))),
            h('div', { className: 'dcb-settings-section' },
              h('div', { className: 'dcb-settings-section-title' }, '布局与显示'),
              h('div', { className: 'dcb-settings-row', 'data-setting': 'width' },
                h('div', { className: 'dcb-settings-copy' }, h('span', { className: 'dcb-settings-row-title dcb-width-label' }, '面板宽度'), h('p', { className: 'dcb-settings-row-desc' }, '窄屏会自动适应可用空间。')),
                h('div', { className: 'dcb-settings-controls' }, h(WidthSlider), h('span', { className: 'dcb-width-value' }, `${settings.width} px`))),
              h('div', { className: 'dcb-settings-row' },
                h('div', { className: 'dcb-settings-copy' }, h('span', { className: 'dcb-settings-row-title' }, '进度默认显示'), h('p', { className: 'dcb-settings-row-desc' }, '显示当前步骤附近的任务，支持上下滚动。')),
                h(StepCountPicker))),
            h('div', { className: 'dcb-settings-info', role: 'status' }, `${settings.enabled ? '当前生效' : '面板已关闭'}：${materialName} · ${settings.width} px · ${settings.progressView.count} 个步骤`),
            h('p', { className: 'dcb-settings-footnote' }, '展开偏好会自动记住。自动展开的面板仅点 X 收起，手动打开可点外部收起；普通推理或工具调用不会自动展开。设置保存在当前浏览器。')))
      }
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section', id: NAME, order: 26, label: 'Claude 美化',
      }, Settings))
      function OutputRow({ file, sessionId, readThumbnail, onOpen }) {
        const name = basename(file.path)
        const extension = (/\.([^.]+)$/.exec(name)?.[1] || '').toLowerCase()
        const image = imageExtension(name)
        const url = useThumbnail(sessionId, file.path, readThumbnail)
        return h('button', { type: 'button', className: 'dcb-output', title: file.description || name, 'data-thumbnail': image ? url ? 'image' : 'pending' : undefined, onClick: () => onOpen(file.path) },
          h('span', { className: 'dcb-tile', 'data-kind': image ? 'image' : 'file', 'aria-hidden': true },
            url ? h('img', { src: url, alt: '', loading: 'lazy' }) : tileLabel(name)),
          h('span', { className: 'dcb-file-name' }, name.replace(/\.[^.]+$/, '')), h('span', { className: 'dcb-file-type' }, extension || '文件'))
      }
      function ToolResources({ summary, running, id }) {
        const expanded = settings.toolDetails
        const disclosure = useToolDisclosure(expanded, summary.tools.map(item => item.label).join('\u0000'))
        const active = running ? summary.active : []
        const working = active.length > 0
        const unresolved = summary.active.reduce((sum, item) => sum + item.running, 0)
        const name = working ? `${active[0].label}${active.length > 1 ? ` +${active.length - 1}` : ''}` : '工具调用'
        const currentCategory = working ? toolCategory(active[0].label) : null
        const count = `${summary.count} 种 · ${summary.calls} 次`
        const status = working ? `调用中 · ${summary.count} 种` : unresolved ? `未返回 · ${summary.count} 种` : count
        const title = `${working ? `正在调用 ${active.map(item => item.label).join('、')}，` : ''}${count}${summary.failed ? `，${summary.failed} 次失败` : ''}，${expanded ? '收起' : '展开'}工具明细`
        return h('div', { className: 'dcb-tools' },
          h('button', { type: 'button', className: 'dcb-tool-summary', 'aria-label': expanded ? '收起工具明细' : '展开工具明细', 'aria-expanded': expanded, 'aria-controls': id, 'data-working': working, title,
            onClick: () => update({ toolDetails: !settings.toolDetails }) },
            h(Icon, { kind: currentCategory?.icon || 'toolbox', className: 'dcb-tool-symbol' }), h('span', { className: 'dcb-tool-name' }, name),
            h('span', { className: 'dcb-tool-count' }, status),
            summary.failed > 0 && h('span', { className: 'dcb-tool-failed' }, `失败 ${summary.failed}`),
            h('span', { className: 'dcb-tool-chevron', 'aria-hidden': true }, h(Icon, { kind: 'chevron', size: 12 }))),
          h('div', { id, className: 'dcb-tools-disclosure', ref: disclosure.viewport, role: 'group', 'aria-label': '工具明细', 'aria-hidden': !expanded, inert: !expanded },
            h('div', { className: 'dcb-tools-body', ref: disclosure.body }, summary.tools.map(item => {
              const state = item.running > 0 ? running ? `调用中${item.running > 1 ? ` ${item.running}` : ''}` : '未返回' : item.failed ? `失败 ${item.failed}` : '已使用'
              const detail = `${item.count} 次 · ${state}${item.running > 0 && item.failed ? ` · 失败 ${item.failed}` : ''}`
              const category = toolCategory(item.label)
              return h('div', { className: 'dcb-resource dcb-tool-row', key: item.label, 'data-tool-category': category.id, 'data-working': running && item.running > 0, title: `${category.label} · ${item.label}` }, h(Icon, { kind: category.icon, className: 'dcb-tool-symbol' }), h('span', { className: 'dcb-resource-label', title: item.label }, item.label), h('span', { className: 'dcb-tool-category' }, category.label), h('span', { className: 'dcb-resource-detail', title: detail }, detail))
            }))))
      }
      function Summary({ sessionId, useProjection, useTaskActivity, useSession, openOutput, readThumbnail }) {
        const liveTodos = useProjection('todos') || []
        const outline = useProjection('turnOutline')
        const history = useTaskActivity(value => value)
        const readingTurn = useReadingTurn(sessionId, outline, history.turns)
        const latestTurn = [history.latestTurn, ...(Array.isArray(outline) ? outline.filter(item => Number.isSafeInteger(item?.seq) && item.seq >= 0).map(item => item?.turn) : [])].filter(value => Number.isSafeInteger(value) && value >= 0).reduce((latest, turn) => latest === null || turn > latest ? turn : latest, null)
        const selectedTurn = readingTurn ?? latestTurn
        const turnSnapshot = history.turns?.find(item => item.turn === selectedTurn)
        const viewingHistory = selectedTurn !== null && selectedTurn !== latestTurn
        const todos = viewingHistory ? turnSnapshot?.todos || [] : liveTodos
        const activity = selectedTurn === null ? history : turnSnapshot?.activity || emptyActivity
        const resources = toolSummary(activity.resources)
        const liveRunning = useSession ? useSession(value => value.running) === true : liveTodos.some(item => item.status === 'in_progress')
        const running = liveRunning && !viewingHistory && turnSnapshot?.ended !== true
        const contextKey = `${sessionId}:${selectedTurn ?? 'live'}`
        const [openState, setOpenState] = React.useState(() => ({ sessionId, value: openedBySession.get(sessionId) ?? false, automatic: autoOpenedSessions.has(sessionId) }))
        const [hoverSession, setHoverSession] = React.useState(null)
        const [stylePreviewSession, setStylePreviewSession] = React.useState(null)
        const [exitingSession, setExitingSession] = React.useState(null)
        const [reveal, setReveal] = React.useState(0)
        const [browsing, setBrowsing] = React.useState(null)
        const [, refresh] = React.useReducer(value => value + 1, 0)
        const anchor = React.useRef(null)
        const button = React.useRef(null)
        const card = React.useRef(null)
        const hoverTimer = React.useRef(null)
        const dropdown = React.useRef(null)
        const pinned = openState.sessionId === sessionId ? openState.value : openedBySession.get(sessionId) ?? false
        const automaticallyOpened = pinned && (openState.sessionId === sessionId ? openState.automatic : autoOpenedSessions.has(sessionId))
        const stylePreview = stylePreviewSession === sessionId
        const open = pinned || hoverSession === sessionId || stylePreview
        const present = open || exitingSession === sessionId
        const modules = settings.modules
        const hasContent = todos.length > 0 || activity.files.length > 0 || activity.resources.length > 0
        const visible = settings.enabled && (hasContent || selectedTurn !== null && present)
        const ownsNative = settings.enabled && (visible || selectedTurn !== null)
        const working = running && todos.length > 0
        const planRevision = JSON.stringify(todos.map(item => item.content))
        const livePlanRevision = JSON.stringify(liveTodos.map(item => item.content))
        const automatic = progressItems(todos, settings.progressView.count)
        const browsingValid = browsing?.contextKey === contextKey && browsing.plan === planRevision && browsing.count === settings.progressView.count
        const progress = browsingValid ? progressItems(todos, settings.progressView.count, browsing.start) : automatic
        const cursor = React.useRef(progress.start)
        cursor.current = progress.start
        const rollActive = visible && open && modules.progress && todos.length > 0
        const roll = useStepRoll({ sessionId: contextKey, plan: planRevision, count: settings.progressView.count, start: progress.start, todos, active: rollActive, folds: `${settings.progressView.previous}:${settings.progressView.future}`, manual: browsingValid })
        const navigation = useStepNavigation(roll.viewport, (delta, probe = false) => {
          const start = Math.max(0, Math.min(Math.max(0, todos.length - settings.progressView.count), cursor.current + delta))
          if (start === cursor.current) return false
          if (!probe) { cursor.current = start; setBrowsing({ contextKey, plan: planRevision, count: settings.progressView.count, start }) }
          return true
        }, rollActive, contextKey, planRevision, settings.progressView.count)
        const transition = useContextTransition(contextKey, visible && open)
        const entryLabel = viewingHistory ? `第 ${selectedTurn} 轮` : working ? `第 ${progress.step} 步，共 ${progress.total} 步` : activity.files.length || todos.length || activity.resources.length
        React.useEffect(() => { listeners.add(refresh); return () => listeners.delete(refresh) }, [])
        // Appearance previews are temporary and never rewrite the per-chat pin state.
        React.useEffect(() => {
          const preview = active => {
            if (active) {
              if (!settings.enabled || !hasContent || !anchor.current?.getClientRects().length) return
              window.clearTimeout(hoverTimer.current)
              setHoverSession(null)
              setExitingSession(null)
              setStylePreviewSession(sessionId)
            } else {
              setStylePreviewSession(null)
              if (stylePreview && !pinned && hoverSession !== sessionId) setExitingSession(sessionId)
            }
          }
          stylePreviewListeners.add(preview)
          return () => stylePreviewListeners.delete(preview)
        }, [sessionId, hasContent, pinned, hoverSession, stylePreview])
        // Hover previews must not overwrite the persistent per-session open state.
        React.useEffect(() => {
          setHoverSession(null)
          setStylePreviewSession(null)
          setExitingSession(null)
          return () => window.clearTimeout(hoverTimer.current)
        }, [sessionId, visible])
        React.useLayoutEffect(() => () => {
          dropdown.current?.cancel()
          dropdown.current = null
        }, [sessionId, visible])
        React.useEffect(() => {
          if (!open || !visible || automaticallyOpened) return
          const outside = event => {
            if (autoOpenedSessions.has(sessionId)) return
            const node = anchor.current
            if (!node || event.composedPath().includes(node)) return
            if (event.target?.closest?.('[data-dcb-card-style-picker]')) return
            if (stylePreview && event.target?.closest?.('.dcb-settings')) return
            const navigation = event.target?.closest?.('nav')
            if (navigation?.querySelector('button[data-index]') && navigation.closest('[data-conversation-content]')?.dataset.conversationSession === sessionId) return
            window.clearTimeout(hoverTimer.current)
            openedBySession.set(sessionId, false)
            setOpenState({ sessionId, value: false, automatic: false })
            setHoverSession(null)
            setStylePreviewSession(null)
            setExitingSession(sessionId)
          }
          // Observe outside presses without blocking the clicked control or moving focus.
          document.addEventListener('pointerdown', outside, true)
          return () => document.removeEventListener('pointerdown', outside, true)
        }, [sessionId, open, visible, stylePreview, automaticallyOpened])
        // Only a new/edited plan during a run can pin the card open. Existing history,
        // status-only progress, generic inference, tools and outputs cannot trigger it.
        React.useEffect(() => {
          const run = planRuns.get(sessionId)
          if (!run) {
            planRuns.set(sessionId, { running: liveRunning, plan: livePlanRevision, revealed: false })
            return
          }
          const changed = run.plan !== livePlanRevision
          if (run.running !== liveRunning) run.revealed = false
          run.running = liveRunning
          run.plan = livePlanRevision
          if (!liveRunning || viewingHistory || !visible || liveTodos.length === 0 || !changed || run.revealed) return
          run.revealed = true
          openedBySession.set(sessionId, true)
          autoOpenedSessions.add(sessionId)
          setOpenState({ sessionId, value: true, automatic: true })
          setExitingSession(null)
          setReveal(value => value + 1)
        }, [sessionId, visible, liveRunning, livePlanRevision, viewingHistory])
        React.useLayoutEffect(() => {
          const node = card.current
          const previous = dropdown.current
          // Reveal the card and its shadow together; clipping at the border would
          // hide the outer shadow until the finished animation is removed.
          const hidden = { opacity: 0, transform: 'translateY(-6px)', clipPath: 'inset(-64px -64px calc(100% + 64px) -64px round 14px)' }
          const shown = { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(-64px -64px -64px -64px round 14px)' }
          let from = open ? hidden : shown
          // Read the current animated frame before canceling so rapid re-entry is continuous.
          if (previous?.effect?.target === node && node) {
            const style = getComputedStyle(node)
            from = { opacity: style.opacity, transform: style.transform, clipPath: style.clipPath }
          }
          previous?.cancel()
          dropdown.current = null
          if (!present || !visible || !node) return
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            if (!open) setExitingSession(null)
            return
          }
          const animation = node.animate([from, open ? shown : hidden], {
            id: open ? 'dcb-dropdown' : 'dcb-hover-dismiss', duration: open ? 240 : 180,
            easing: open ? 'cubic-bezier(.2,.7,.25,1)' : 'cubic-bezier(.4,0,.7,1)', fill: 'forwards',
          })
          dropdown.current = animation
          animation.finished.then(() => {
            if (dropdown.current !== animation) return
            if (open) { dropdown.current = null; animation.cancel() }
            else setExitingSession(null)
          }).catch(() => {})
        }, [sessionId, open, present, visible, reveal])
        React.useEffect(() => {
          if (!ownsNative) return
          summaryOwners.set(sessionId, (summaryOwners.get(sessionId) || 0) + 1)
          schedule()
          return () => {
            const remaining = (summaryOwners.get(sessionId) || 1) - 1
            if (remaining) summaryOwners.set(sessionId, remaining)
            else summaryOwners.delete(sessionId)
            schedule()
          }
        }, [sessionId, ownsNative])
        React.useLayoutEffect(() => {
          if (!visible || !anchor.current) return
          const node = anchor.current
          const container = [...document.querySelectorAll('[data-conversation-content]')].find(el => el.dataset.conversationSession === sessionId && el.getClientRects().length)
          const size = () => {
            const rect = node.getBoundingClientRect()
            const available = container?.getBoundingClientRect().width ?? window.innerWidth
            node.style.setProperty('--dcb-card-width', `${Math.max(200, Math.min(settings.width, available - 24, rect.right - 12))}px`)
            node.style.setProperty('--dcb-card-height', `${Math.max(160, window.innerHeight - rect.bottom - 32)}px`)
          }
          const observer = new ResizeObserver(size)
          observer.observe(container || node.parentElement)
          window.addEventListener('resize', size)
          size()
          return () => { observer.disconnect(); window.removeEventListener('resize', size) }
        }, [sessionId, visible, settings.width])
        if (!visible) return null
        const setOpen = value => { window.clearTimeout(hoverTimer.current); setHoverSession(null); setStylePreviewSession(null); setExitingSession(null); openedBySession.set(sessionId, value); autoOpenedSessions.delete(sessionId); setOpenState({ sessionId, value, automatic: false }) }
        const close = () => {
          const automatic = autoOpenedSessions.has(sessionId)
          setOpen(false)
          if (automatic) setExitingSession(sessionId)
          button.current?.focus()
        }
        const closeControl = h('button', { type: 'button', className: 'dcb-close', 'aria-label': '关闭进度面板', onClick: close }, h(Icon, { kind: 'close', size: 16 }))
        const cardId = `${NAME}-summary-${sessionId}-${selectedTurn ?? 'live'}`
        const collapsible = (id, expanded, children, className) =>
          h('div', { id, className: `dcb-collapse ${className}`, 'aria-hidden': !expanded, inert: !expanded },
            h('div', { className: 'dcb-collapse-inner' }, children))
        const step = (item, index) => {
          const hasPrevious = progress.previous.length > 0
          const hasFuture = progress.future.length > 0
          const dashedBefore = index === 0 || (index === progress.start && hasPrevious && !settings.progressView.previous) || (index === progress.end && hasFuture)
          const before = index > 0 || hasPrevious ? (dashedBefore ? 'dashed' : 'solid') : undefined
          const after = index < todos.length - 1 ? (index === progress.end - 1 && hasFuture ? 'dashed' : 'solid') : undefined
          return h('li', { key: `${index}:${item.content}`, className: 'dcb-step', 'data-step-index': index, 'data-status': item.status, 'data-link-before': before, 'data-link-after': after, 'aria-current': item.status === 'in_progress' ? 'step' : undefined },
          h('span', { className: 'dcb-status', role: 'img', 'aria-label': { completed: '已完成', in_progress: '进行中', pending: '待处理' }[item.status] || item.status },
            h('svg', { className: 'dcb-status-dot', width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false },
              item.status === 'in_progress' && h(React.Fragment, null,
                h('circle', { className: 'dcb-status-ripple', cx: 12, cy: 12, r: 6, strokeWidth: 1 }),
                h('g', { className: 'dcb-status-orbit' },
                  h('circle', { cx: 12, cy: 12, r: 7.5, pathLength: 100, strokeWidth: 1.4, strokeDasharray: '36 64' }))),
              h('circle', { className: 'dcb-status-core', cx: 12, cy: 12, r: 3.5 }))),
          h('span', { className: 'dcb-step-text' }, item.content))
        }
        const stepGroup = (kind, label, entries, offset) => {
          const expanded = settings.progressView[kind]
          const contentId = `${cardId}-${kind}`
          return h('div', { key: kind, className: 'dcb-step-group', ref: roll[kind], 'aria-hidden': !entries.length, inert: !entries.length }, entries.length > 0 && h(React.Fragment, null,
            h('button', { type: 'button', className: `dcb-history${kind === 'future' ? ' dcb-future' : ''}`, 'aria-expanded': expanded, 'aria-controls': contentId,
              onClick: () => update({ progressView: { ...settings.progressView, [kind]: !settings.progressView[kind] } }) },
              h('span', { className: 'dcb-status', 'aria-hidden': true }), h('span', { className: 'dcb-history-label' }, expanded ? `收起${label}` : `${entries.length} 个${label}`, h(Icon, { kind: 'chevron', size: 12 }))),
            collapsible(contentId, expanded, h('ol', { className: 'dcb-timeline', start: offset + 1 }, entries.map((item, index) => step(item, offset + index))), kind === 'previous' ? 'dcb-history-content' : 'dcb-future-content')))
        }
        const section = (kind, label, children, withClose) => {
          const expanded = modules[kind]
          const contentId = `${cardId}-${kind}`
          const toggle = () => {
            update({ modules: { ...settings.modules, [kind]: !settings.modules[kind] } })
          }
          return h('section', { key: kind, 'data-testid': `dcb-${kind}`, 'data-collapsed': !expanded },
            h('h3', null, h('button', { type: 'button', className: 'dcb-module-toggle', 'aria-expanded': expanded, 'aria-controls': contentId, onClick: toggle }, label, h(Icon, { kind: 'chevron', size: 14 })), kind === 'progress' && browsingValid && h('button', { type: 'button', className: 'dcb-follow', onClick: () => { navigation.cancel(); setBrowsing(null) } }, '回到当前步骤'), withClose && closeControl),
            collapsible(contentId, expanded, h('div', { className: 'dcb-module-body' }, children), 'dcb-module-content'))
        }
        return h('div', { className: 'dcb-anchor', ref: anchor, 'data-dcb-summary-for': sessionId,
          onPointerEnter: event => {
            if (event.pointerType !== 'mouse') return
            window.clearTimeout(hoverTimer.current)
            setExitingSession(null)
            if (!pinned) setHoverSession(sessionId)
          },
          onPointerLeave: event => {
            if (event.pointerType !== 'mouse' || hoverSession !== sessionId || pinned) return
            window.clearTimeout(hoverTimer.current)
            hoverTimer.current = window.setTimeout(() => {
              if (!openedBySession.get(sessionId) && !card.current?.contains(document.activeElement)) {
                setExitingSession(sessionId)
                setHoverSession(null)
              }
            }, 220)
          },
          onKeyDown: event => { if (event.key === 'Escape' && open) { event.stopPropagation(); if (autoOpenedSessions.has(sessionId)) event.preventDefault(); else close() } } },
          h('button', { type: 'button', className: 'dcb-entry', ref: button, 'data-working': working, title: selectedTurn === null ? '会话进度与输出' : `第 ${selectedTurn} 轮 · 会话进度与输出`, 'aria-label': '会话进度与输出', 'aria-expanded': open, 'aria-controls': cardId, onClick: () => { if (!autoOpenedSessions.has(sessionId)) setOpen(!pinned) } },
            h(FishLogo, { size: 16, className: 'dcb-logo' }), h('span', { 'aria-live': 'polite', 'aria-atomic': true }, entryLabel)),
          present && h('aside', { key: sessionId, className: 'dcb-summary', ref: card, id: cardId, 'data-card-style': settings.cardStyle, 'data-open-origin': open ? automaticallyOpened ? 'automatic' : pinned ? 'manual' : stylePreview ? 'preview' : 'hover' : undefined, 'aria-label': '会话进度与输出', 'aria-hidden': !open, inert: !open, 'data-dcb-turn': selectedTurn ?? undefined, 'data-state': open ? 'open' : 'closing', 'data-testid': 'dcb-summary' },
            h('div', { className: 'dcb-context-window', ref: transition.viewport }, h('div', { className: 'dcb-context-content', ref: transition.content },
            todos.length > 0 && section('progress', '进度',
              h(React.Fragment, null,
                stepGroup('previous', '先前步骤', progress.previous, 0),
                h('div', { className: 'dcb-step-window', ref: roll.viewport, tabIndex: 0, role: 'group', 'aria-label': '任务步骤，可上下滚动查看', 'aria-keyshortcuts': 'ArrowUp ArrowDown Home End' },
                  h('ol', { className: 'dcb-timeline dcb-recent-steps', ref: roll.list, 'data-working': working, start: progress.start + 1 }, progress.items.map((item, index) => step(item, index + progress.start))),
                  h('div', { className: 'dcb-step-ghost', ref: roll.ghost, 'aria-hidden': true, inert: true })),
                stepGroup('future', '后续步骤', progress.future, progress.end)), true),
            activity.files.length > 0 && section('outputs', '输出', activity.files.map(file =>
              h(OutputRow, { key: file.path, file, sessionId, readThumbnail, onOpen: openOutput })), todos.length === 0),
            activity.resources.length > 0 && section('resources', '本次会话中已使用', h(React.Fragment, null,
              resources.featured.map((item, index) => h('div', { className: 'dcb-resource', key: index }, h(Icon, { kind: item.kind }), h('span', { className: 'dcb-resource-label', title: item.label }, item.label), h('span', { className: 'dcb-resource-detail', title: item.detail }, item.detail))),
              resources.count > 0 && h(ToolResources, { summary: resources, running, id: `${cardId}-tools` }),
              activity.hasMore && selectedTurn === null && h('p', { className: 'dcb-note' }, '基于已加载的会话记录')), todos.length === 0 && activity.files.length === 0),
            hasContent && turnSnapshot?.complete === false && h('p', { className: 'dcb-note' }, '本轮记录尚未完整加载'),
            !hasContent && h(React.Fragment, null, h('h3', null, `第 ${selectedTurn} 轮`, closeControl), h('p', { className: 'dcb-context-empty' }, selectedTurn !== null && (!turnSnapshot || !turnSnapshot.complete) ? '本轮记录尚未完整加载' : '这一轮没有任务、输出或已用资源'))),
            h('div', { className: 'dcb-context-ghost', ref: transition.ghost, 'aria-hidden': true, inert: true }))))
      }
      if (typeof ctx.inject === 'function') ctx.inject(['sessions', 'sidebarRight'], scope => {
        const sources = new WeakMap()
        const readers = new Map()
        // Thumbnails are optional: without the workspace-files Remote the rows keep their type tile.
        const remote = { current: null }
        const bind = face => { if (face && typeof face.readBytes === 'function' && typeof face.stat === 'function') remote.current = face }
        try { bind(scope.get?.('remote')?.workspaceFiles) } catch { /* service not mounted yet */ }
        try {
          scope.inject?.(['remote', 'remote.workspaceFiles'], inner => {
            try { bind(inner.get?.('remote.workspaceFiles') || inner.remote?.workspaceFiles) } catch { /* dereferenced namespace */ }
          })
        } catch { /* optional injection unsupported */ }
        const readerFor = sessionId => {
          if (!readers.has(sessionId)) readers.set(sessionId, thumbnailReader(remote, sessionId))
          return readers.get(sessionId)
        }
        scope.slots.inject('conversation.session.header.utilities', () => scope.slots.register({
          name: 'conversation.session.header.utilities', id: NAME, order: 5,
          inject: sessionId => {
            const binding = scope.sessions.binding(sessionId)
            if (!binding) throw new Error(`${NAME}: session binding unavailable`)
            let source = sources.get(binding)
            if (!source) { source = activitySource(binding.eventSource); sources.set(binding, source) }
            return { hooks: { taskActivity: source }, readThumbnail: readerFor(sessionId), openOutput: path => scope.sidebarRight.openResource(fileAddress(sessionId, path)) }
          },
        }, Summary))
      })
      ctx.effect(() => () => {
        disposed = true
        observer.disconnect()
        resize.disconnect()
        liquid.dispose()
        if (frame) window.cancelAnimationFrame(frame)
        window.removeEventListener('resize', schedule)
        window.removeEventListener('storage', onStorage)
        document.removeEventListener('scroll', schedule, true)
        for (const panel of [...originals.keys()]) restore(panel)
        for (const panel of document.querySelectorAll('[data-dcb-native-hidden]')) panel.removeAttribute('data-dcb-native-hidden')
        for (const url of thumbnails.values()) URL.revokeObjectURL(url)
        thumbnails.clear()
        style.remove()
        listeners.clear()
        stylePreviewListeners.clear()
      }, `${NAME}: presentation`)
    }
    return { apply, inject: ['slots'], __test: { normalize, placement, activityFrom, activitySource, turnActivityFrom, toolSummary, toolCategory, createLiquidNormalMap, progressItems, fileAddress, imageExtension, tileLabel, mimeFor } }
  },
})
