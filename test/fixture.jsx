import React from 'react'
import { createRoot } from 'react-dom/client'
import * as jsxRuntime from 'react/jsx-runtime'

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
  const [, force] = React.useReducer(value => value + 1, 0)
  const [session, setSession] = React.useState('a')
  const [todos, setTodos] = React.useState(examples.a)
  const [running, setRunning] = React.useState(false)
  const [sidebar, setSidebar] = React.useState(false)
  const [settings, setSettings] = React.useState(false)
  const [detached, setDetached] = React.useState(false)
  window.fixture = {
    session: id => { setSession(id); setTodos(examples[id]); setRunning(false) },
    update: value => setTodos(value),
    running: value => setRunning(value),
    sidebar: value => setSidebar(value),
    settings: value => setSettings(value),
    detach: value => setDetached(value),
    records: (entries, hasMore) => window.fixtureBinding(session).eventSource.replace(entries, hasMore),
    refresh: force,
  }
  const Settings = window.fixtureSettings
  const Header = window.fixtureHeader
  const injected = Header ? window.fixtureHeaderSpec.inject(session) : null
  const source = injected?.hooks.taskActivity
  return <div className={'frame' + (sidebar ? ' sidebar-open' : '')}>
    <aside className="nav"><strong>DeepSeek Harness</strong><small>工作区</small><p>界面优化</p><p>设计与开发</p></aside>
    <main><header data-slot="conversation.header"><span>界面优化</span><span className="header-utilities">{Header && <Header sessionId={session} useProjection={() => todos} useSession={selector => selector({ running })}
      useTaskActivity={selector => React.useSyncExternalStore(source.subscribe, () => selector(source.getSnapshot()))} openOutput={injected.openOutput}/>}<span>···</span></span></header>
      {!detached && <div data-conversation-content="" data-conversation-session={session} className="conversation">
        <div data-conversation-scroll="" className="scroll">
          <article><p className="eyebrow">ASSISTANT</p><h1>让任务进度，一眼可见。</h1><p>任务清单收在右上角，随时展开查看当前进度。</p><p>暖灰色卡片与细腻的边框，让聊天区域更清爽。</p></article>
          <div data-composer-seat="" className="composer-seat"><TodoView key={session} todos={todos} t={t}/><div className="composer">发送消息…<small>DeepSeek　　＋</small></div></div>
        </div>
      </div>}
    </main>
    {sidebar && <aside className="right">预览面板</aside>}
    {settings && Settings && <div role="dialog" className="settings-dialog"><Settings/></div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App/> )
