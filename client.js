window.__ModuleLoader__.load({
  id: 'dsh-claude-beautify',
  factory: (require) => {
    const React = require('react')
    const { FishLogo } = require('@deepseek-ai/dsh-client-ui-primitives')
    const NAME = 'dsh-claude-beautify'
    // Host the reasoning-slider settings page here (see reasoningSliderPage) so the
    // settings sidebar keeps a single Claude entry; the slider plugin checks this
    // flag before registering its own section.
    try { window.__dsbHostsClaudeSettings = true } catch {}
    const KEY = `${NAME}:settings:v1`
    const PANEL = '[data-testid="todo-panel"]'
    const MARK = 'data-dcb-task-panel'
    const DEFAULTS = { enabled: true, width: 320, cardStyle: 'milk', modules: { progress: true, outputs: true, resources: true }, progressView: { count: 3, previous: false, future: false }, toolDetails: false }
    const VARIABLES = ['--dcb-left', '--dcb-top', '--dcb-width', '--dcb-list-height']

    function normalize(value) {
      return {
        enabled: typeof value?.enabled === 'boolean' ? value.enabled : true,
        width: Number.isFinite(value?.width) ? Math.round(Math.max(280, Math.min(480, value.width))) : 320,
        cardStyle: value?.cardStyle === 'glass' ? 'glass' : 'milk',
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
    function Icon({ kind, size = 16 }) {
      const paths = {
        file: 'M6 3h8l4 4v14H6z M14 3v5h4',
        archive: 'M4 4h16v5H4z M6 9v12h12V9 M10 13h4',
        web: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c-5 5-5 13 0 18 M12 3c5 5 5 13 0 18',
        memory: 'M4 8a9 9 0 1 1-1 7 M4 3v5h5 M8 12h.01 M12 14c2 0 3-1 4-2',
        skill: 'M4 4h10v12H4z M10 16v4h10V10h-6',
        github: 'M8 20v-3c-4 1-4-2-5-2 M16 20v-4c0-1-.3-2-1-2 4-.5 5-2 5-5 0-1-.3-2-1-3V3l-4 2c-2-.5-4-.5-6 0L5 3v3C4 7 4 8 4 9c0 3 1 4.5 5 5-.7 0-1 1-1 2',
        tool: 'M9 3H5v18h4 M15 3h4v18h-4 M8 12h8',
        close: 'M6 6l12 12 M18 6 6 18',
        chevron: 'm7 10 5 5 5-5',
      }
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, h('path', { d: paths[kind] || paths.tool }))
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
      .dcb-settings { padding: 24px; max-width: 800px; color: var(--dsw-alias-label-primary); }
      .dcb-settings-block + .dcb-settings-block { border-top: 1px solid #e7e3db; margin-top: 28px; padding-top: 8px; }
      body[data-ds-dark-theme] .dcb-settings-block + .dcb-settings-block { border-top-color: #45423b; }
      .dcb-settings h2 { font-size: 18px; margin: 0 0 12px; }
      .dcb-settings p { font-size: 13px; line-height: 1.8; color: var(--dsw-alias-label-secondary); }
      .dcb-settings label { display: flex; align-items: center; gap: 10px; padding: 12px 0; font-size: 14px; }
      .dcb-settings input[type="range"] { flex: 1; accent-color: #a46950; }
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
        .dcb-timeline[data-working="true"] .dcb-step[data-status="in_progress"] .dcb-step-text { background-image: linear-gradient(100deg, var(--dcb-shimmer-base, currentColor) 38%, #c5c5c5 46%, #fff 50%, #c5c5c5 54%, var(--dcb-shimmer-base, currentColor) 62%); background-size: 250% 100%; background-repeat: no-repeat; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: dcb-text-shimmer 2.4s linear infinite; }
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
      .dcb-tool-summary[data-working="true"], .dcb-tool-row[data-working="true"] { color: #202020; --dcb-shimmer-base: #202020; }
      @media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
        .dcb-tool-summary[data-working="true"] .dcb-tool-name { background-image: linear-gradient(100deg, var(--dcb-shimmer-base) 44%, var(--dcb-tool-sheen, #767676) 50%, var(--dcb-shimmer-base) 56%); background-size: 250% 100%; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: dcb-text-shimmer 2.4s linear infinite; }
      }
      @media (prefers-reduced-motion: reduce), (forced-colors: active) { .dcb-tool-chevron { transition: none; } }
      .dcb-note { font-size: 11px; color: #9a9790; margin: 8px 0 0; }
      @keyframes dcb-orbit { to { transform: rotate(360deg); } }
      @keyframes dcb-ripple { 0% { transform: scale(.85); opacity: .35; } 75%, 100% { transform: scale(1.8); opacity: 0; } }
      @keyframes dcb-text-shimmer { 0% { background-position: 100% 0; } 70%, 100% { background-position: 0% 0; } }
      @media (prefers-reduced-motion: reduce) { .dcb-collapse, .dcb-module-toggle svg, .dcb-history-label svg { transition: none; } }
      body[data-ds-dark-theme] .dcb-summary { --dcb-timeline-line: #4d4b46; background: #292824; color: #eeeae2; border-color: #45423b; box-shadow: 0 2px 6px #0003; }
      body[data-ds-dark-theme] .dcb-summary section + section { border-color: #45423b; }
      body[data-ds-dark-theme] .dcb-step, body[data-ds-dark-theme] .dcb-output, body[data-ds-dark-theme] .dcb-resource { color: #cec9bd; }
      body[data-ds-dark-theme] .dcb-tool-summary { color: #cec9bd; }
      body[data-ds-dark-theme] .dcb-tool-summary:hover { background: #37352f; }
      body[data-ds-dark-theme] .dcb-tool-summary[data-working="true"], body[data-ds-dark-theme] .dcb-tool-row[data-working="true"] { color: #f2f2f2; --dcb-shimmer-base: #d2d2d2; --dcb-tool-sheen: #fff; }
      body[data-ds-dark-theme] .dcb-tool-failed { color: #e9b0a9; }
      body[data-ds-dark-theme] .dcb-output:hover, body[data-ds-dark-theme] .dcb-close:hover { background: #37352f; }
      body[data-ds-dark-theme] .dcb-tile { background: #37352f; color: #b8b1a3; }
      body[data-ds-dark-theme] .dcb-step[data-status="completed"], body[data-ds-dark-theme] .dcb-step[data-status="pending"] { color: #8d8d8d; }
      body[data-ds-dark-theme] .dcb-step[data-status="in_progress"] { color: #f2f2f2; --dcb-shimmer-base: #d2d2d2; }
      @media (max-width: 600px) { .dcb-summary { padding: 14px; } }
      .dcb-style-picker { border: 0; padding: 0; margin: 10px 0 18px; min-width: 0; }
      .dcb-style-picker legend { padding: 0; margin-bottom: 10px; font-size: 14px; }
      .dcb-style-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr)); gap: 12px; }
      .dcb-settings .dcb-style-option { position: relative; display: grid; gap: 8px; min-width: 0; padding: 12px; border: 1px solid #e4e0d8; border-radius: 10px; cursor: pointer; transition: border-color 220ms cubic-bezier(.4,0,.2,1), background-color 220ms cubic-bezier(.4,0,.2,1), box-shadow 220ms cubic-bezier(.4,0,.2,1); }
      .dcb-style-option:has(input:checked) { background: #f7f4ef; border-color: #b8a08c; box-shadow: 0 0 0 1px #a4695018; }
      .dcb-style-option:has(input:focus-visible) { outline: 2px solid #a46950; outline-offset: 3px; }
      .dcb-style-option input { position: absolute; top: 12px; right: 12px; margin: 0; z-index: 1; accent-color: #a46950; }
      .dcb-style-scene { display: grid; place-items: center; height: 76px; overflow: hidden; border-radius: 6px; background: radial-gradient(ellipse at 15% 30%, #a6cbd0, transparent 60%), radial-gradient(ellipse at 85% 80%, #d9b59b, transparent 60%), #e8e4dc; }
      .dcb-style-swatch { position: relative; display: grid; align-content: center; justify-items: start; gap: 6px; width: 82px; height: 44px; padding: 13px; border: 1px solid; border-radius: 12px; opacity: .8; transform: translateY(0); transition: transform 240ms cubic-bezier(.22,.8,.26,1), opacity 240ms cubic-bezier(.22,.8,.26,1); }
      .dcb-style-option:has(input:checked) .dcb-style-swatch { opacity: 1; transform: translateY(-6px); }
      .dcb-style-swatch i { width: 45px; height: 3px; border-radius: 3px; background: #847b72; opacity: .5; }
      .dcb-style-swatch i:last-child { width: 30px; opacity: .3; }
      .dcb-style-name { font-size: 13px; color: var(--dsw-alias-label-primary, #343434); }
      .dcb-style-option small { color: var(--dsw-alias-label-secondary, #817b71); font-size: 11px; }
      body[data-ds-dark-theme] .dcb-style-option { border-color: #504b42; }
      body[data-ds-dark-theme] .dcb-style-option:has(input:checked) { background: #35312c; border-color: #b8a08c; }
      body[data-ds-dark-theme] .dcb-style-name { color: #eeeae2; }
      body[data-ds-dark-theme] .dcb-style-scene { background: radial-gradient(ellipse at 15% 30%, #416b72, transparent 60%), radial-gradient(ellipse at 85% 80%, #7b5540, transparent 60%), #302e29; }
      body[data-ds-dark-theme] .dcb-style-swatch i { background: #e3ddd4; }
      body :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style] {
        --dcb-surface-background: #fff; --dcb-surface-border: #e4e3df; --dcb-surface-shadow: 0 2px 4px #0000000a; --dcb-surface-filter: blur(0px) saturate(1);
        background: var(--dcb-surface-background) !important; border-color: var(--dcb-surface-border) !important; box-shadow: var(--dcb-surface-shadow) !important;
        backdrop-filter: var(--dcb-surface-filter) !important; -webkit-backdrop-filter: var(--dcb-surface-filter) !important;
        transition: background-color 240ms cubic-bezier(.4,0,.2,1), border-color 240ms cubic-bezier(.4,0,.2,1), box-shadow 240ms cubic-bezier(.4,0,.2,1), backdrop-filter 240ms cubic-bezier(.4,0,.2,1), -webkit-backdrop-filter 240ms cubic-bezier(.4,0,.2,1);
      }
      body[data-ds-dark-theme] :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style] { --dcb-surface-background: #292824; --dcb-surface-border: #45423b; --dcb-surface-shadow: 0 2px 6px #0003; }
      body :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style="glass"] {
        --dcb-surface-background: rgba(255,255,255,.62); --dcb-surface-border: rgba(255,255,255,.72); --dcb-surface-filter: blur(22px) saturate(1.45);
        --dcb-surface-shadow: 0 12px 32px rgba(28,32,40,.12), inset 0 1px 0 rgba(255,255,255,.9), inset 1px 0 0 rgba(255,255,255,.45), inset -1px -1px 0 rgba(255,255,255,.2);
      }
      body[data-ds-dark-theme] :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style="glass"] {
        --dcb-surface-background: rgba(41,40,36,.68); --dcb-surface-border: rgba(255,255,255,.18);
        --dcb-surface-shadow: 0 12px 32px #0005, inset 0 1px 0 #ffffff26, inset 1px 0 0 #ffffff14, inset -1px -1px 0 #ffffff0a;
      }
      body .dcb-style-swatch[data-card-style] { transition: background-color 240ms cubic-bezier(.4,0,.2,1), border-color 240ms cubic-bezier(.4,0,.2,1), box-shadow 240ms cubic-bezier(.4,0,.2,1), backdrop-filter 240ms cubic-bezier(.4,0,.2,1), transform 240ms cubic-bezier(.22,.8,.26,1), opacity 240ms cubic-bezier(.22,.8,.26,1); }
      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        body :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style="glass"] { --dcb-surface-background: rgba(255,255,255,.96); }
        body[data-ds-dark-theme] :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style="glass"] { --dcb-surface-background: rgba(41,40,36,.96); }
      }
      @media (prefers-reduced-motion: reduce), (forced-colors: active) {
        body :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style], .dcb-settings .dcb-style-option { transition: none; }
      }
      @media (forced-colors: active) {
        body :is(.dcb-summary, [${MARK}], .dcb-style-swatch)[data-card-style] { background: Canvas !important; border-color: CanvasText !important; box-shadow: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
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
      // Track real plan changes separately from tool/output activity and hover previews.
      const planRuns = new Map()
      const style = document.createElement('style')
      style.dataset.plugin = NAME
      style.textContent = css
      document.head.appendChild(style)

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
        attributeFilter: ['data-conversation-session', 'hidden', 'class'] })
      window.addEventListener('resize', schedule)
      // Capture scroll also handles embedded conversation columns and moved panes.
      document.addEventListener('scroll', schedule, true)
      window.addEventListener('storage', onStorage)
      sync()

      // dsh-claude-slider (npm) exports its settings page; render it inside this entry
      // so the sidebar shows one merged "Claude 美化" section instead of two.
      let sliderPageCache
      function reasoningSliderPage() {
        if (sliderPageCache) return sliderPageCache
        try { sliderPageCache = require('dsh-claude-slider')?.ClaudeSettingsPage || null }
        catch { sliderPageCache = null }
        return sliderPageCache
      }

      function Settings() {
        const [, render] = React.useReducer(value => value + 1, 0)
        React.useEffect(() => { listeners.add(render); return () => listeners.delete(render) }, [])
        React.useEffect(() => () => previewStyle(false), [])
        const h = React.createElement
        const SliderPage = reasoningSliderPage()
        return h('div', { className: 'dcb-settings' },
          h('section', { className: 'dcb-settings-block', 'data-dcb-settings-block': 'slider' },
            h('h2', null, '输入框推理滑块'),
            h('p', null, '由独立插件 dsh-claude-slider 提供，控制输入框附近的推理强度滑块。这里的外观模式只影响滑块。'),
            SliderPage
              ? h(SliderPage)
              : h('p', null, '滑块设置页暂不可用；若仍有单独的“推理滑块 (Claude)”入口，可在那里设置。右上角任务卡片设置在下方。')),
          h('section', { className: 'dcb-settings-block', 'data-dcb-settings-block': 'panel' },
            h('h2', null, '任务面板'),
            h('p', null, '鼠标移到右上角入口即可预览，移开后收起；点击入口或安排新的任务步骤时会保持展开。普通推理、调用工具、输出文件和更新完成状态不会触发自动展开。本轮手动收起后不再反复弹出。默认显示当前步骤附近的 3 步，可改为 2 步；先前步骤、后续步骤和各栏目的开合选择都会自动记住。'),
            h('label', null, h('input', { type: 'checkbox', checked: settings.enabled,
              onChange: event => update({ enabled: event.target.checked }) }), '启用右上角任务面板'),
            h('fieldset', { className: 'dcb-style-picker', 'data-dcb-card-style-picker': '' }, h('legend', null, '卡片样式'),
              h('p', null, '仅影响右上角任务卡片。选择时临时展开当前卡片供预览，关闭设置后结束预览；当前轮次没有内容时保持隐藏。'),
              h('div', { className: 'dcb-style-options' }, [['milk', '奶白块', '柔和纯色，清晰简洁'], ['glass', '液态玻璃', '通透柔光，轻盈层次']].map(([value, label, description]) =>
                h('label', { className: 'dcb-style-option', key: value },
                  h('input', { type: 'radio', name: `${NAME}-card-style`, value, checked: settings.cardStyle === value, 'aria-label': label, onClick: () => previewStyle(true), onChange: () => { update({ cardStyle: value }); previewStyle(true) } }),
                  h('span', { className: 'dcb-style-scene', 'aria-hidden': true }, h('span', { className: 'dcb-style-swatch', 'data-card-style': value }, h('i'), h('i'))),
                  h('span', { className: 'dcb-style-name' }, label), h('small', null, description))))),
            h('label', null, '面板宽度', h('input', { type: 'range', min: 280, max: 480, step: 10,
              value: settings.width, 'aria-label': '面板宽度',
              onChange: event => update({ width: Number(event.target.value) }) }), h('span', null, `${settings.width} px`)),
            h('label', null, '进度默认显示', h('select', { value: settings.progressView.count, 'aria-label': '默认显示步骤数',
              onChange: event => update({ progressView: { ...settings.progressView, count: Number(event.target.value) } }) },
              h('option', { value: 2 }, '2 个步骤'), h('option', { value: 3 }, '3 个步骤'))),
            h('p', null, '点击面板外部即可带动画收起，无需点关闭按钮。窄屏会自动缩小。关闭插件后立即恢复 DSH 原来的任务清单位置。设置只保存在当前浏览器。')))
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
        const count = `${summary.count} 种 · ${summary.calls} 次`
        const status = working ? `调用中 · ${summary.count} 种` : unresolved ? `未返回 · ${summary.count} 种` : count
        const title = `${working ? `正在调用 ${active.map(item => item.label).join('、')}，` : ''}${count}${summary.failed ? `，${summary.failed} 次失败` : ''}，${expanded ? '收起' : '展开'}工具明细`
        return h('div', { className: 'dcb-tools' },
          h('button', { type: 'button', className: 'dcb-tool-summary', 'aria-label': expanded ? '收起工具明细' : '展开工具明细', 'aria-expanded': expanded, 'aria-controls': id, 'data-working': working, title,
            onClick: () => update({ toolDetails: !settings.toolDetails }) },
            h(Icon, { kind: 'tool' }), h('span', { className: 'dcb-tool-name' }, name),
            h('span', { className: 'dcb-tool-count' }, status),
            summary.failed > 0 && h('span', { className: 'dcb-tool-failed' }, `失败 ${summary.failed}`),
            h('span', { className: 'dcb-tool-chevron', 'aria-hidden': true }, h(Icon, { kind: 'chevron', size: 12 }))),
          h('div', { id, className: 'dcb-tools-disclosure', ref: disclosure.viewport, role: 'group', 'aria-label': '工具明细', 'aria-hidden': !expanded, inert: !expanded },
            h('div', { className: 'dcb-tools-body', ref: disclosure.body }, summary.tools.map(item => {
              const state = item.running > 0 ? running ? `调用中${item.running > 1 ? ` ${item.running}` : ''}` : '未返回' : item.failed ? `失败 ${item.failed}` : '已使用'
              const detail = `${item.count} 次 · ${state}${item.running > 0 && item.failed ? ` · 失败 ${item.failed}` : ''}`
              return h('div', { className: 'dcb-resource dcb-tool-row', key: item.label, 'data-working': running && item.running > 0 }, h(Icon, { kind: 'tool' }), h('span', { className: 'dcb-resource-label', title: item.label }, item.label), h('span', { className: 'dcb-resource-detail', title: detail }, detail))
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
        const [openState, setOpenState] = React.useState(() => ({ sessionId, value: openedBySession.get(sessionId) ?? false }))
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
          if (!open || !visible) return
          const outside = event => {
            const node = anchor.current
            if (!node || event.composedPath().includes(node)) return
            if (event.target?.closest?.('[data-dcb-card-style-picker]')) return
            if (stylePreview && event.target?.closest?.('.dcb-settings')) return
            const navigation = event.target?.closest?.('nav')
            if (navigation?.querySelector('button[data-index]') && navigation.closest('[data-conversation-content]')?.dataset.conversationSession === sessionId) return
            window.clearTimeout(hoverTimer.current)
            openedBySession.set(sessionId, false)
            setOpenState({ sessionId, value: false })
            setHoverSession(null)
            setStylePreviewSession(null)
            setExitingSession(sessionId)
          }
          // Observe outside presses without blocking the clicked control or moving focus.
          document.addEventListener('pointerdown', outside, true)
          return () => document.removeEventListener('pointerdown', outside, true)
        }, [sessionId, open, visible, stylePreview])
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
          setOpenState({ sessionId, value: true })
          setExitingSession(null)
          setReveal(value => value + 1)
        }, [sessionId, visible, liveRunning, livePlanRevision, viewingHistory])
        React.useLayoutEffect(() => {
          const node = card.current
          const previous = dropdown.current
          const hidden = { opacity: 0, transform: 'translateY(-6px)', clipPath: 'inset(0 0 100% 0 round 14px)' }
          const shown = { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0 0 0 0 round 14px)' }
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
        const setOpen = value => { window.clearTimeout(hoverTimer.current); setHoverSession(null); setStylePreviewSession(null); setExitingSession(null); openedBySession.set(sessionId, value); setOpenState({ sessionId, value }) }
        const close = () => { setOpen(false); button.current?.focus() }
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
          onKeyDown: event => { if (event.key === 'Escape' && open) { event.stopPropagation(); close() } } },
          h('button', { type: 'button', className: 'dcb-entry', ref: button, 'data-working': working, title: selectedTurn === null ? '会话进度与输出' : `第 ${selectedTurn} 轮 · 会话进度与输出`, 'aria-label': '会话进度与输出', 'aria-expanded': open, 'aria-controls': cardId, onClick: () => setOpen(!pinned) },
            h(FishLogo, { size: 16, className: 'dcb-logo' }), h('span', { 'aria-live': 'polite', 'aria-atomic': true }, entryLabel)),
          present && h('aside', { key: sessionId, className: 'dcb-summary', ref: card, id: cardId, 'data-card-style': settings.cardStyle, 'aria-label': '会话进度与输出', 'aria-hidden': !open, inert: !open, 'data-dcb-turn': selectedTurn ?? undefined, 'data-state': open ? 'open' : 'closing', 'data-testid': 'dcb-summary' },
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
    return { apply, inject: ['slots'], __test: { normalize, placement, activityFrom, activitySource, turnActivityFrom, toolSummary, progressItems, fileAddress, imageExtension, tileLabel, mimeFor } }
  },
})
