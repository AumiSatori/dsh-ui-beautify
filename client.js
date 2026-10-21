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
        width: Number.isFinite(value?.width) ? Math.round(Math.max(260, Math.min(420, value.width))) : 320,
      }
    }

    function readSettings() {
      try { return normalize(JSON.parse(window.localStorage.getItem(KEY))) }
      catch { return { ...DEFAULTS } }
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
    `

    function apply(ctx) {
      let settings = readSettings()
      let frame = 0
      let disposed = false
      const listeners = new Set()
      const originals = new Map()
      const observed = new Set()
      const style = document.createElement('style')
      style.dataset.plugin = NAME
      style.textContent = css
      document.head.appendChild(style)

      function restore(panel) {
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
          h('p', null, '将当前会话的任务清单固定在聊天区域右上角。点击任务标题可展开或折叠，任务状态随会话实时更新。'),
          h('label', null, h('input', { type: 'checkbox', checked: settings.enabled,
            onChange: event => update({ enabled: event.target.checked }) }), '启用右上角任务面板'),
          h('label', null, '面板宽度', h('input', { type: 'range', min: 260, max: 420, step: 10,
            value: settings.width, 'aria-label': '面板宽度',
            onChange: event => update({ width: Number(event.target.value) }) }), h('span', null, `${settings.width} px`)),
          h('p', null, '窄屏会自动缩小。关闭后立即恢复 DSH 原来的任务清单位置。设置只保存在当前浏览器。'))
      }
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section', id: NAME, order: 35, label: 'Claude 美化',
      }, Settings))
      ctx.effect(() => () => {
        disposed = true
        observer.disconnect()
        resize.disconnect()
        if (frame) window.cancelAnimationFrame(frame)
        window.removeEventListener('resize', schedule)
        window.removeEventListener('storage', onStorage)
        document.removeEventListener('scroll', schedule, true)
        for (const panel of [...originals.keys()]) restore(panel)
        style.remove()
        listeners.clear()
      }, `${NAME}: presentation`)
    }
    return { apply, inject: ['slots'], __test: { normalize, placement } }
  },
})
