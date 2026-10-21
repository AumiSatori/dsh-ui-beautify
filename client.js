window.__ModuleLoader__.load({
  id: 'dsh-claude-beautify',
  factory: (require) => {
    const React = require('react')
    const NAME = 'dsh-claude-beautify'
    const KEY = `${NAME}:settings:v1`
    const PANEL = '[data-testid="todo-panel"]'
    const MARK = 'data-dcb-task-panel'
    const DEFAULTS = { enabled: true, width: 320 }
    const VARIABLES = ['--dcb-left', '--dcb-top', '--dcb-width', '--dcb-list-height']

    function normalize(value) {
      return {
        enabled: typeof value?.enabled === 'boolean' ? value.enabled : true,
        width: Number.isFinite(value?.width) ? Math.round(Math.max(280, Math.min(480, value.width))) : 320,
      }
    }

    function readSettings() {
      try { return normalize(JSON.parse(window.localStorage.getItem(KEY))) }
      catch { return { ...DEFAULTS } }
    }

    const h = React.createElement
    const emptyActivity = { files: [], resources: [], hasMore: false }
    const basename = path => path.replaceAll('\\', '/').split('/').filter(Boolean).at(-1) || path
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
          if (id) calls.set(id, { name: data.name, args: argumentsOf(data.arguments) })
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
        if (item) resources.set(`${item.kind}:${item.label}:${item.path || (item.kind === 'skill' ? item.detail : '')}`, item)
      }
      return { files: [...files.values()], resources: [...resources.values()], hasMore }
    }
    function activitySource(events) {
      let previous
      let current = emptyActivity
      const relevant = event => ['deliverables/presented', 'tool/call', 'tool/result', 'tool/ptc-dispatch-start', 'tool/ptc-dispatch'].includes(event?.type)
      function getSnapshot() {
        const next = events?.getSnapshot()
        if (!next || next === previous) return current
        const changed = next.change?.kind !== 'append' || next.change.entries?.some(entry => relevant(entry.event))
        previous = next
        if (current === emptyActivity || changed) current = activityFrom(next.entries || [], next.hasMore)
        return current
      }
      return { getSnapshot, subscribe: listener => events?.subscribe(() => { const old = current; if (getSnapshot() !== old) listener() }) || (() => {}) }
    }
    function progressItems(todos, expanded, working = false) {
      const active = todos.findIndex(item => item.status === 'in_progress')
      const pending = todos.findIndex(item => item.status === 'pending')
      const current = active >= 0 ? active : pending >= 0 ? pending : todos.length - 1
      const hidden = Math.max(0, current - (working ? 2 : 1))
      return { hidden, items: expanded ? todos : todos.slice(hidden), step: current + 1, total: todos.length }
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
        check: 'm7 12 3 3 7-7',
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
      [${MARK}] li[data-status="in_progress"] > span:last-child { color: #a65f43; font-weight: 500; }
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
      .dcb-settings { padding: 24px; max-width: 560px; color: var(--dsw-alias-label-primary); }
      .dcb-settings h2 { font-size: 18px; margin: 0 0 12px; }
      .dcb-settings p { font-size: 13px; line-height: 1.8; color: var(--dsw-alias-label-secondary); }
      .dcb-settings label { display: flex; align-items: center; gap: 10px; padding: 12px 0; font-size: 14px; }
      .dcb-settings input[type="range"] { flex: 1; accent-color: #a46950; }
      [data-dcb-native-hidden] { display: none !important; }
      [data-slot="conversation.header"]:has(.dcb-anchor) { position: relative; z-index: 20; }
      .dcb-anchor { position: relative; display: inline-flex; z-index: 20; -webkit-app-region: no-drag; }
      .dcb-entry { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 42px; height: 32px; padding: 4px 9px; border: 0; border-radius: 9px; background: transparent; color: var(--dsw-alias-label-primary, #343434); font: inherit; cursor: pointer; }
      .dcb-entry[aria-expanded="true"], .dcb-entry:hover { background: var(--dsw-alias-interactive-bg-hover, #f1f0ed); }
      .dcb-entry[data-working="true"] { background: var(--dsw-alias-interactive-bg-hover, #f1f0ed); white-space: nowrap; font-variant-numeric: tabular-nums; }
      .dcb-summary { box-sizing: border-box; position: absolute; top: calc(100% + 12px); right: 0; width: min(var(--dcb-card-width, 320px), calc(100vw - 24px)); height: 360px; max-height: var(--dcb-card-height, calc(100vh - 100px)); overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; border: 1px solid #e4e3df; border-radius: 14px; background: #fff; color: #242424; box-shadow: 0 2px 4px #0000000a; padding: 16px; text-align: left; font: 13px/1.6 system-ui, sans-serif; }
      .dcb-summary section + section { border-top: 1px solid #eeedeb; margin-top: 14px; padding-top: 14px; }
      .dcb-summary h3 { display: flex; align-items: center; justify-content: space-between; font-size: 13px; line-height: 20px; font-weight: 500; margin: 0 0 10px; }
      .dcb-summary button { font-family: inherit; cursor: pointer; }
      .dcb-summary button:focus-visible, .dcb-entry:focus-visible { outline: 2px solid #a46950; outline-offset: 3px; }
      .dcb-close { display: grid; place-items: center; width: 24px; height: 24px; margin: -2px -2px -2px 0; padding: 3px; border: 0; border-radius: 5px; background: transparent; color: inherit; }
      .dcb-close:hover { background: #f3f2ef; }
      .dcb-timeline { list-style: none; margin: 0; padding: 0; }
      .dcb-step, .dcb-history { position: relative; display: flex; gap: 10px; align-items: flex-start; min-height: 30px; padding: 4px 0; font-size: 13px; line-height: 21px; color: #66645f; }
      .dcb-step::before, .dcb-history::before { content: ''; position: absolute; width: 2px; background: #e8e7e4; top: 0; bottom: 0; left: 9px; }
      .dcb-step[data-status="completed"] { color: #96928b; }
      .dcb-step[data-status="completed"]::before { background: #c1bfb9; }
      .dcb-step[data-status="in_progress"] { color: #4d4b46; }
      .dcb-step[data-status="in_progress"]::before { background: #aaa79f; }
      .dcb-step[data-status="pending"] { color: #77736c; }
      .dcb-status { position: relative; display: grid; place-items: center; flex: 0 0 20px; width: 20px; height: 21px; }
      .dcb-status-dot { width: 12px; height: 12px; border: 1.5px solid #c4c1b9; border-radius: 50%; display: grid; place-items: center; }
      .dcb-step[data-status="completed"] .dcb-status-dot { color: white; border-color: #5a5b56; background: #5a5b56; }
      .dcb-step[data-finished="true"]::before { bottom: 50%; }
      .dcb-step-text { overflow-wrap: anywhere; min-width: 0; }
      .dcb-history { border: 0; background: transparent; width: 100%; text-align: left; color: #95918a; font-size: 12px; padding-top: 0; }
      .dcb-history::before { background: none; border-left: 2px dotted #dedbd5; width: 0; top: 2px; bottom: 2px; }
      .dcb-history .dcb-status { color: #d8d6d1; }
      .dcb-output { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 2px; background: transparent; border: 0; text-align: left; color: #66645f; border-radius: 6px; font-size: 13px; }
      .dcb-output:hover { background: #f6f5f2; }
      .dcb-file-name { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dcb-file-type { flex: none; color: #95918a; font-size: 11px; text-transform: uppercase; }
      .dcb-used-toggle { display: inline-flex; align-items: center; gap: 6px; background: none; border: 0; padding: 0; color: inherit; font-size: 13px; }
      .dcb-used-toggle svg { color: #9a9790; transition: transform .12s; }
      .dcb-used-toggle[aria-expanded="false"] svg { transform: rotate(-90deg); }
      .dcb-resource { display: flex; align-items: center; gap: 10px; padding: 7px 2px; color: #66645f; font-size: 13px; }
      .dcb-resource > svg, .dcb-output > svg { flex: 0 0 18px; }
      .dcb-resource-label { flex-shrink: 0; max-width: 50%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dcb-resource-detail { margin-left: auto; min-width: 0; color: #95918a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
      .dcb-note { font-size: 11px; color: #9a9790; margin: 8px 0 0; }
      body[data-ds-dark-theme] .dcb-summary { background: #292824; color: #eeeae2; border-color: #45423b; box-shadow: 0 2px 6px #0003; }
      body[data-ds-dark-theme] .dcb-summary section + section { border-color: #45423b; }
      body[data-ds-dark-theme] .dcb-step, body[data-ds-dark-theme] .dcb-output, body[data-ds-dark-theme] .dcb-resource { color: #cec9bd; }
      body[data-ds-dark-theme] .dcb-output:hover, body[data-ds-dark-theme] .dcb-close:hover { background: #37352f; }
      body[data-ds-dark-theme] .dcb-step::before { background: #48453d; }
      body[data-ds-dark-theme] .dcb-step[data-status="completed"] { color: #969084; }
      body[data-ds-dark-theme] .dcb-step[data-status="completed"]::before { background: #615d53; }
      body[data-ds-dark-theme] .dcb-step[data-status="in_progress"] { color: #eeeae2; }
      body[data-ds-dark-theme] .dcb-step[data-status="in_progress"]::before { background: #a29b8d; }
      body[data-ds-dark-theme] .dcb-step[data-status="pending"] { color: #b8b1a3; }
      body[data-ds-dark-theme] .dcb-history::before { border-color: #615d53; }
      @media (max-width: 600px) { .dcb-summary { padding: 14px; } }
    `

    function apply(ctx) {
      let settings = readSettings()
      let frame = 0
      let disposed = false
      const listeners = new Set()
      const originals = new Map()
      const observed = new Set()
      const summaryOwners = new Map()
      const openedBySession = new Map()
      const style = document.createElement('style')
      style.dataset.plugin = NAME
      style.textContent = css
      document.head.appendChild(style)

      function restore(panel) {
        panel.removeAttribute('data-dcb-native-hidden')
        const saved = originals.get(panel)
        if (!saved) return
        for (const [key, value, priority] of saved) {
          if (value) panel.style.setProperty(key, value, priority)
          else panel.style.removeProperty(key)
        }
        panel.removeAttribute(MARK)
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
            originals.set(panel, VARIABLES.map(key => [key, panel.style.getPropertyValue(key), panel.style.getPropertyPriority(key)]))
          }
          const values = [position.left, position.top, position.width, position.listHeight]
          VARIABLES.forEach((key, index) => {
            const next = `${values[index]}px`
            if (panel.style.getPropertyValue(key) !== next) panel.style.setProperty(key, next)
          })
          if (!panel.hasAttribute(MARK)) panel.setAttribute(MARK, '')
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

      function Settings() {
        const [, render] = React.useReducer(value => value + 1, 0)
        React.useEffect(() => { listeners.add(render); return () => listeners.delete(render) }, [])
        const h = React.createElement
        return h('div', { className: 'dcb-settings' },
          h('h2', null, 'Claude 风格 · 任务面板'),
          h('p', null, '在右上角查看当前会话的进度、输出和已使用的工具。点击入口按钮打开或收起面板，任务状态实时更新。'),
          h('label', null, h('input', { type: 'checkbox', checked: settings.enabled,
            onChange: event => update({ enabled: event.target.checked }) }), '启用右上角任务面板'),
          h('label', null, '面板宽度', h('input', { type: 'range', min: 280, max: 480, step: 10,
            value: settings.width, 'aria-label': '面板宽度',
            onChange: event => update({ width: Number(event.target.value) }) }), h('span', null, `${settings.width} px`)),
          h('p', null, '窄屏会自动缩小。关闭后立即恢复 DSH 原来的任务清单位置。设置只保存在当前浏览器。'))
      }
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section', id: NAME, order: 35, label: 'Claude 美化',
      }, Settings))
      function Summary({ sessionId, useProjection, useTaskActivity, useSession, openOutput }) {
        const todos = useProjection('todos') || []
        const activity = useTaskActivity(value => value)
        const running = useSession ? useSession(value => value.running) === true : todos.some(item => item.status === 'in_progress')
        const [openState, setOpenState] = React.useState(() => ({ sessionId, value: openedBySession.get(sessionId) ?? false }))
        const [history, setHistory] = React.useState(null)
        const [usedOpen, setUsedOpen] = React.useState(true)
        const [, refresh] = React.useReducer(value => value + 1, 0)
        const anchor = React.useRef(null)
        const button = React.useRef(null)
        const open = openState.sessionId === sessionId ? openState.value : openedBySession.get(sessionId) ?? false
        const hasContent = todos.length > 0 || activity.files.length > 0 || activity.resources.length > 0
        const visible = settings.enabled && hasContent
        const expanded = history === sessionId
        const working = running && todos.length > 0
        const finished = !running && todos.length > 0 && todos.every(item => item.status === 'completed')
        const progress = progressItems(todos, expanded, working)
        const entryLabel = working ? `第 ${progress.step} 步，共 ${progress.total} 步` : activity.files.length || todos.length || activity.resources.length
        React.useEffect(() => { listeners.add(refresh); return () => listeners.delete(refresh) }, [])
        React.useEffect(() => {
          if (!visible) return
          summaryOwners.set(sessionId, (summaryOwners.get(sessionId) || 0) + 1)
          schedule()
          return () => {
            const remaining = (summaryOwners.get(sessionId) || 1) - 1
            if (remaining) summaryOwners.set(sessionId, remaining)
            else summaryOwners.delete(sessionId)
            schedule()
          }
        }, [sessionId, visible])
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
        const setOpen = value => { openedBySession.set(sessionId, value); setOpenState({ sessionId, value }) }
        const close = () => { setOpen(false); button.current?.focus() }
        const closeControl = h('button', { type: 'button', className: 'dcb-close', 'aria-label': '关闭进度面板', onClick: close }, h(Icon, { kind: 'close', size: 16 }))
        const cardId = `${NAME}-summary-${sessionId}`
        return h('div', { className: 'dcb-anchor', ref: anchor, 'data-dcb-summary-for': sessionId,
          onKeyDown: event => { if (event.key === 'Escape' && open) { event.stopPropagation(); close() } } },
          h('button', { type: 'button', className: 'dcb-entry', ref: button, 'data-working': working, title: '会话进度与输出', 'aria-label': '会话进度与输出', 'aria-expanded': open, 'aria-controls': cardId, onClick: () => setOpen(!open) },
            h(Icon, { kind: 'file', size: 16 }), h('span', { 'aria-live': 'polite', 'aria-atomic': true }, entryLabel)),
          open && h('aside', { className: 'dcb-summary', id: cardId, 'aria-label': '会话进度与输出', 'data-testid': 'dcb-summary' },
            todos.length > 0 && h('section', { 'data-testid': 'dcb-progress' }, h('h3', null, '进度', closeControl),
              h(React.Fragment, null,
                progress.hidden > 0 && h('button', { type: 'button', className: 'dcb-history', 'aria-expanded': expanded, onClick: () => setHistory(expanded ? null : sessionId) }, h('span', { className: 'dcb-status', 'aria-hidden': true }), expanded ? '收起先前步骤' : `${progress.hidden} 个先前步骤`),
                h('ol', { className: 'dcb-timeline', 'data-working': working }, progress.items.map((item, index) => h('li', { key: `${index}:${item.content}`, className: 'dcb-step', 'data-status': item.status, 'aria-current': item.status === 'in_progress' ? 'step' : undefined, 'data-finished': finished && index === progress.items.length - 1 ? true : undefined },
                  h('span', { className: 'dcb-status', role: 'img', 'aria-label': { completed: '已完成', in_progress: '进行中', pending: '待处理' }[item.status] || item.status },
                    finished && index === progress.items.length - 1 ? h('span', { className: 'dcb-status-dot' }, h(Icon, { kind: 'check', size: 12 })) : null),
                  h('span', { className: 'dcb-step-text' }, item.content)))))),
            activity.files.length > 0 && h('section', { 'data-testid': 'dcb-outputs' }, h('h3', null, '输出', todos.length === 0 && closeControl), activity.files.map(file => {
              const name = basename(file.path)
              const extension = /\.([^.]+)$/.exec(name)?.[1] || '文件'
              return h('button', { type: 'button', key: file.path, className: 'dcb-output', title: file.description || name, onClick: () => openOutput(file.path) },
                h(Icon, { kind: /zip|7z|rar|tar|gz/i.test(extension) ? 'archive' : 'file' }), h('span', { className: 'dcb-file-name' }, name.replace(/\.[^.]+$/, '')), h('span', { className: 'dcb-file-type' }, extension))
            })),
            activity.resources.length > 0 && h('section', { 'data-testid': 'dcb-resources' },
              h('h3', null, h('button', { type: 'button', className: 'dcb-used-toggle', 'aria-expanded': usedOpen, onClick: () => setUsedOpen(!usedOpen) }, '本次会话中已使用', h(Icon, { kind: 'chevron', size: 16 })), todos.length === 0 && activity.files.length === 0 && closeControl),
              usedOpen && activity.resources.map((item, index) => h('div', { className: 'dcb-resource', key: index }, h(Icon, { kind: item.kind }), h('span', { className: 'dcb-resource-label', title: item.label }, item.label), h('span', { className: 'dcb-resource-detail', title: item.detail }, item.detail))),
              activity.hasMore && h('p', { className: 'dcb-note' }, '基于已加载的会话记录'))))
      }
      if (typeof ctx.inject === 'function') ctx.inject(['sessions', 'sidebarRight'], scope => {
        const sources = new WeakMap()
        scope.slots.inject('conversation.session.header.utilities', () => scope.slots.register({
          name: 'conversation.session.header.utilities', id: NAME, order: 5,
          inject: sessionId => {
            const binding = scope.sessions.binding(sessionId)
            if (!binding) throw new Error(`${NAME}: session binding unavailable`)
            let source = sources.get(binding)
            if (!source) { source = activitySource(binding.eventSource); sources.set(binding, source) }
            return { hooks: { taskActivity: source }, openOutput: path => scope.sidebarRight.openResource(fileAddress(sessionId, path)) }
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
        style.remove()
        listeners.clear()
      }, `${NAME}: presentation`)
    }
    return { apply, inject: ['slots'], __test: { normalize, placement, activityFrom, activitySource, progressItems, fileAddress } }
  },
})
