import React from 'react'
import { createRoot } from 'react-dom/client'
import * as jsxRuntime from 'react/jsx-runtime'
import { ComposerFixture } from './composer-fixture.jsx'

window.fixtureReact = React
window.fixtureBindings = new Map()
window.fixtureBinding = id => {
  if (!window.fixtureBindings.has(id)) {
    let snapshot = { entries: [], hasMore: false, change: { kind: 'replace' } }
    const listeners = new Set()
    window.fixtureBindings.set(id, { eventSource: { getSnapshot: () => snapshot, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener) },
      replace: (entries, hasMore = false) => { snapshot = { entries, hasMore, change: { kind: 'replace' } }; for (const listener of listeners) listener() } } })
  }
  return window.fixtureBindings.get(id)
}
const dot = ({ state }) => <span>{state === 'done' ? '✓' : state === 'ongoing' ? '◐' : '○'}</span>
const NativeTodoPanel = window.nativeTodoFactory?.(React, jsxRuntime,
  { root: 'native-todo', body: 'native-body', header: 'native-header', lead: 'native-lead', title: 'native-title', progress: 'native-progress', chevron: 'native-chevron', list: 'native-list', item: 'native-item', glyph: 'native-glyph', content: 'native-content' },
  { StateDot: dot, IconChecklistOutlineRegular: () => <span>☷</span>, IconChevronUpOutlineRegular: () => <span>⌃</span>, IconChevronDownOutlineRegular: () => <span>⌄</span> })
const t = (key, values = {}) => ({ 'todo.title': '任务', 'todo.progress.done': `${values.done} 已完成`, 'todo.progress.active': `${values.active} 进行中`, 'todo.progress.pending': `${values.pending} 待处理`, 'todo.status.completed': '已完成', 'todo.status.inProgress': '进行中', 'todo.status.pending': '待处理' }[key] || key)
const TodoView = NativeTodoPanel || TodoPanel

// Synthetic data only. Match DSH 0.2.1-rc.2's public DOM contract and React ownership.
const examples = {
  a: [
    { content: '整理需求与界面结构', status: 'completed' },
    { content: '实现右上角任务面板，并保留任务状态的实时更新', status: 'in_progress' },
    { content: '检查窗口缩放与浅色、深色主题', status: 'pending' },
    { content: '完成验证并交付', status: 'pending' },
  ],
  b: [{ content: '第二个会话的任务', status: 'pending' }],
  empty: [],
}
function TodoPanel({ todos }) {
  const [collapsed, setCollapsed] = React.useState(true)
  if (!todos.length) return null
  return <section data-testid="todo-panel" aria-label="任务" className="native-todo"><div>
    <button aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>
      <span aria-hidden="true">☷</span><span>任务</span>
      <span>{todos.filter(item => item.status === 'completed').length} 已完成 · {todos.filter(item => item.status === 'in_progress').length} 进行中</span>
      <span aria-hidden="true">{collapsed ? '⌃' : '⌄'}</span>
    </button>
    {!collapsed && <ul>{todos.map(item => <li key={item.content} data-status={item.status}>
      <span role="img" aria-label={item.status}>{item.status === 'completed' ? '✓' : item.status === 'in_progress' ? '◐' : '○'}</span><span>{item.content}</span>
    </li>)}</ul>}
  </div></section>
}
function App() {
  const interactiveComposer = new URLSearchParams(window.location.search).has('composer')
  const [, force] = React.useReducer(value => value + 1, 0)
  const [session, setSession] = React.useState('a')
  const [todos, setTodos] = React.useState(examples.a)
  const [running, setRunning] = React.useState(false)
  const [sidebar, setSidebar] = React.useState(false)
  const [settings, setSettings] = React.useState(false)
  const [detached, setDetached] = React.useState(false)
  const [history, setHistory] = React.useState(null)
  const [reading, setReading] = React.useState(null)
  const [pressure, setPressure] = React.useState({})
  const historyScroll = React.useRef(null)
  const goToTurn = turn => {
    const scroll = historyScroll.current
    const row = scroll?.querySelector(`[data-chat-turn="${turn}"]`)
    if (row) scroll.scrollTop += row.getBoundingClientRect().top - scroll.getBoundingClientRect().top
    setReading(turn)
  }
  React.useLayoutEffect(() => { if (history) goToTurn(history.initial ?? history.turns.at(-1)?.turn) }, [history])
  window.fixture = {
    session: id => { setSession(id); setTodos(examples[id]); setRunning(false); setHistory(null); setReading(null) },
    update: value => setTodos(value),
    running: value => setRunning(value),
    sidebar: value => setSidebar(value),
    settings: value => setSettings(value),
    detach: value => setDetached(value),
    history: value => setHistory(value),
    reading: goToTurn,
    records: (entries, hasMore) => window.fixtureBinding(session).eventSource.replace(entries, hasMore),
    refresh: force,
    pressure: (value, id = session) => setPressure(previous => ({ ...previous, [id]: value })),
  }
  const Settings = window.fixtureSettings
  const Header = window.fixtureHeader
  const injected = Header ? window.fixtureHeaderSpec.inject(session) : null
  const source = injected?.hooks.taskActivity
  return <div className={'frame' + (sidebar ? ' sidebar-open' : '')}>
    <aside className="nav"><strong>DeepSeek Harness</strong><small>工作区</small><p>界面优化</p><p>设计与开发</p><button onClick={() => setSettings(true)}>打开设置</button></aside>
    <main><header data-slot="conversation.header"><span>界面优化</span><span className="header-utilities">{Header && <Header sessionId={session} useProjection={name => name === 'contextPressure' ? pressure[session] ?? null : name === 'turnOutline' ? history?.outline || history?.turns || [] : todos} useSession={selector => selector({ running })}
      useTaskActivity={selector => React.useSyncExternalStore(source.subscribe, () => selector(source.getSnapshot()))} openOutput={injected.openOutput} readThumbnail={injected.readThumbnail} readPreview={injected.readPreview}/>}<span>···</span></span></header>
      {!detached && <div data-conversation-content="" data-conversation-session={session} data-content-phase={interactiveComposer ? 'active' : undefined} className={'conversation' + (interactiveComposer ? ' cr_body cr_embeddedBody' : '')}>
        {history?.rail !== false && history && <nav aria-label="聊天轮次" style={{ position: 'absolute', right: 12, top: 360, zIndex: 2, display: 'grid', gap: 8 }}>
          {(history.outline || history.turns).map((item, index) => <button key={item.turn} data-index={index} aria-label={`跳到第 ${item.turn} 轮`} aria-current={reading === item.turn ? 'true' : undefined} onClick={() => goToTurn(item.turn)}>{item.turn}</button>)}
        </nav>}
        <div data-conversation-scroll="" className={'scroll' + (interactiveComposer ? ' cr_scrollBody' : '')} ref={historyScroll} onScroll={() => {
          if (!history) return
          const scroll = historyScroll.current
          if (history.tail && scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 2) { setReading(history.turns.at(-1)?.turn); return }
          const line = scroll.getBoundingClientRect().top + Math.min(96, scroll.clientHeight * .2)
          const rows = [...scroll.querySelectorAll('[data-chat-turn]')]
          const row = rows.findLast(item => item.getBoundingClientRect().top <= line) || rows[0]
          if (row) setReading(Number(row.dataset.chatTurn))
        }}>
          {history ? history.turns.map(item => <article key={item.turn} data-chat-turn={item.turn} data-chat-flow-key={`turn-${item.turn}`} data-chat-flow-kind="message" style={{ minHeight: 650, flex: '0 0 650px', margin: '0 auto', padding: '32px 0' }}><p className="eyebrow">第 {item.turn} 轮</p><h1>{item.prompt || '历史消息'}</h1></article>) : <article><p className="eyebrow">ASSISTANT</p><h1>让任务进度，一眼可见。</h1><p>任务清单收在右上角，随时展开查看当前进度。</p><p>暖灰色卡片与细腻的边框，让聊天区域更清爽。</p></article>}
          {history?.tail && reading === history.turns.at(-1)?.turn && <span data-chat-following-tail=""/>}
          <div data-composer-seat="" className={'composer-seat' + (interactiveComposer ? ' cr_composerSeat' : '')}><TodoView key={session} todos={todos} t={t}/>{interactiveComposer ? <ComposerFixture/> : <div className="composer">发送消息…<small>DeepSeek　　＋</small></div>}</div>
        </div>
      </div>}
    </main>
    {sidebar && <aside className="right">预览面板</aside>}
    {settings && Settings && <div role="dialog" className="settings-dialog" style={{ overflowY: 'auto' }}><button aria-label="关闭设置" style={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setSettings(false)}>×</button><Settings/></div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App/> )
