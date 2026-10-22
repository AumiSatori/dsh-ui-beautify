import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

let registration
vm.runInNewContext(readFileSync(new URL('../client.js', import.meta.url), 'utf8'), {
  window: { __ModuleLoader__: { load: value => { registration = value } } },
})
const exports = registration.factory(() => ({}))
const { normalize, placement } = exports.__test
test('registers a client-only plugin with the matching loader id', () => {
  assert.equal(registration.id, 'dsh-claude-beautify')
  assert.equal(typeof exports.apply, 'function')
})
test('validates corrupted and out-of-range preferences', () => {
  assert.equal(normalize(null).width, 320)
  assert.equal(normalize({ width: '400', enabled: 'false' }).enabled, true)
  assert.equal(normalize({ width: Infinity }).width, 320)
  assert.equal(normalize({ width: 999 }).width, 480)
  assert.equal(normalize({ width: -1, enabled: false }).width, 280)
  const modules = normalize({ width: 400, modules: { progress: false, outputs: 'false', unrelated: false } }).modules
  assert.deepEqual(Object.entries(modules), [['progress', false], ['outputs', true], ['resources', true]])
  assert.equal(normalize({ enabled: false, width: 400 }).modules.progress, true, 'Existing preferences without module fields retain the expanded defaults')
  assert.deepEqual(Object.entries(normalize({ progressView: { count: 2, previous: true, future: 'true' } }).progressView), [['count', 2], ['previous', true], ['future', false]])
  assert.equal(normalize({ progressView: { count: 99 } }).progressView.count, 3)
  assert.equal(normalize(null).toolDetails, false)
  assert.equal(normalize({ toolDetails: 'true' }).toolDetails, false)
  assert.equal(normalize({ toolDetails: true }).toolDetails, true)
  assert.equal(normalize(null).composerGlass, true, 'Composer glass is enabled by default for this feature')
  assert.equal(normalize({ composerGlass: 'false' }).composerGlass, true)
  assert.equal(normalize({ composerGlass: false, enabled: true }).composerGlass, false)
  assert.equal(normalize({ composerGlass: true, enabled: false }).composerGlass, true, 'Composer appearance is independent of the task-panel switch')
})

test('card styles migrate to milk by default and retain all four supported presentation values', () => {
  for (const value of [null, {}, { cardStyle: 'unknown' }, { cardStyle: true }, { cardStyle: { kind: 'glass' } }]) assert.equal(normalize(value).cardStyle, 'milk')
  assert.equal(normalize({ cardStyle: 'milk' }).cardStyle, 'milk')
  assert.equal(normalize({ cardStyle: 'clear' }).cardStyle, 'clear')
  assert.equal(normalize({ cardStyle: 'css' }).cardStyle, 'css')
  assert.equal(normalize({ cardStyle: 'glass' }).cardStyle, 'glass', 'Existing frosted-glass preferences preserve their material')
  const migrated = normalize({ width: 400, modules: { resources: false }, toolDetails: true })
  assert.equal(migrated.cardStyle, 'milk')
  assert.equal(migrated.width, 400)
  assert.equal(migrated.modules.resources, false)
  assert.equal(migrated.toolDetails, true)
})

test('liquid normal maps keep the center neutral and bend opposing edges smoothly in opposite directions', () => {
  const map = exports.__test.createLiquidNormalMap(320, 220, 14)
  const pixel = (x, y) => Array.from(map.data.slice((y * map.width + x) * 4, (y * map.width + x) * 4 + 4))
  assert.deepEqual([map.width, map.height, map.data.length], [320, 220, 320 * 220 * 4])
  for (const [x, y] of [[80, 60], [160, 110], [240, 160]]) assert.deepEqual(pixel(x, y), [128, 128, 128, 255], 'Interior pixels displace neither axis')
  const left = pixel(4, 110), right = pixel(315, 110), top = pixel(160, 4), bottom = pixel(160, 215)
  assert.ok((left[0] - 128) * (right[0] - 128) < 0, 'Opposite vertical rims refract in opposite horizontal directions')
  assert.ok((top[1] - 128) * (bottom[1] - 128) < 0, 'Opposite horizontal rims refract in opposite vertical directions')
  assert.equal(left[1], 128)
  assert.equal(top[0], 128)
  const edgeRamp = Array.from({ length: 25 }, (_, x) => pixel(x, 110)[0])
  assert.ok(new Set(edgeRamp).size >= 10, 'The curved edge has a graded normal instead of one hard displacement step')
  assert.ok(edgeRamp.slice(1).every((value, index) => Math.abs(value - edgeRamp[index]) < 40), 'Adjacent edge pixels avoid angular jumps')
  for (let index = 3; index < map.data.length; index += 4) assert.equal(map.data[index], 255)
})

test('liquid normal maps bound raster memory for large cards and retain a neutral center on small cards', () => {
  for (const [width, height] of [[4000, 12000], [10000, 20], [20, 10000]]) {
    const map = exports.__test.createLiquidNormalMap(width, height, 14)
    assert.ok(map.width > 0 && map.width <= 1024)
    assert.ok(map.height > 0 && map.height <= 2048)
    assert.ok(map.width * map.height <= 1048576)
    assert.equal(map.data.length, map.width * map.height * 4)
  }
  const small = exports.__test.createLiquidNormalMap(24, 18, 14)
  const center = (Math.floor(small.height / 2) * small.width + Math.floor(small.width / 2)) * 4
  assert.deepEqual(Array.from(small.data.slice(center, center + 4)), [128, 128, 128, 255])
})

const entry = (type, data, seq = 1) => ({ event: { type, data, seq } })
const call = (id, name, args) => entry('tool/call', { callId: id, name, arguments: JSON.stringify(args) })
const result = (id, isError = false) => entry('tool/result', { message: { source: { callId: id }, isError } })
test('outputs come only from recorded deliveries, with last declaration winning and no prose guesses', () => {
  const activity = exports.__test.activityFrom([
    call('1', 'write', { path: '/work/ignored.txt' }), result('1'),
    entry('assistant/message', { content: 'Here is final.zip' }),
    entry('deliverables/presented', { files: [{ path: '/work/final.zip', description: 'old' }] }),
    entry('deliverables/presented', { files: [{ path: '/work/final.zip', description: 'new' }] }),
  ])
  assert.equal(activity.files.length, 1)
  assert.equal(activity.files[0].description, 'new')
})
test('skills and memory reads require real successful results; tool calls and failures remain accurately labelled', () => {
  const activity = exports.__test.activityFrom([
    call('1', 'skill', { name: 'video' }), result('1'),
    call('2', 'skill', { name: 'failed' }), result('2', true),
    call('3', 'read', { path: '/work/memory/Setting.md' }), result('3'),
    call('4', 'web_search', {}), result('4'),
    call('5', 'memory_write', { action: 'save' }), result('5'),
    call('6', 'read', { path: '/work/memory/NeverRead.md' }), result('6', true),
  ])
  assert.ok(activity.resources.some(item => item.kind === 'skill' && item.detail === 'video'))
  assert.ok(!activity.resources.some(item => item.detail === 'failed' || item.path?.endsWith('NeverRead.md')))
  assert.ok(activity.resources.some(item => item.detail === '已读取 · Setting.md'))
  assert.ok(activity.resources.some(item => item.kind === 'memory' && item.detail === '已使用'))
})
test('PTC calls de-duplicate start/settlement and activity sources ignore token-only appends', () => {
  const rows = [entry('tool/ptc-dispatch-start', { subCallId: '1', name: 'skill', arguments: { name: 'video' } }),
    entry('tool/ptc-dispatch', { subCallId: '1', name: 'skill', arguments: { name: 'video' }, isError: false })]
  let snapshot = { entries: rows, hasMore: true, change: { kind: 'replace' } }
  const source = exports.__test.activitySource({ getSnapshot: () => snapshot })
  const first = source.getSnapshot()
  assert.equal(first.resources.length, 1)
  assert.equal(first.hasMore, true)
  snapshot = { ...snapshot, change: { kind: 'append', entries: [entry('assistant/live-chunk', {})] } }
  assert.equal(source.getSnapshot(), first)
})
test('a later completed call cannot hide an earlier concurrent invocation of the same tool', () => {
  const activity = exports.__test.activityFrom([
    call('earlier', 'ops_bash', { command: 'long task' }),
    call('later', 'ops_bash', { command: 'short task' }), result('later'),
  ])
  const tool = activity.resources.find(item => item.label === 'ops_bash')
  assert.equal(activity.resources.length, 1)
  assert.equal(tool.count, 2)
  assert.equal(tool.running, 1)
  assert.equal(tool.failed, 0)
  assert.equal(tool.detail, '调用中')
})

test('tool counts de-duplicate replayed calls, PTC start and settlement, and repeated results', () => {
  const activity = exports.__test.activityFrom([
    entry('tool/ptc-dispatch-start', { subCallId: 'ptc', name: 'ops_bash', arguments: { command: 'task' } }),
    entry('tool/ptc-dispatch-start', { subCallId: 'ptc', name: 'ops_bash', arguments: { command: 'task' } }),
    entry('tool/ptc-dispatch', { subCallId: 'ptc', name: 'ops_bash', arguments: { command: 'task' }, isError: false }),
    entry('tool/ptc-dispatch', { subCallId: 'ptc', name: 'ops_bash', arguments: { command: 'task' }, isError: false }),
    call('normal', 'ops_bash', {}), call('normal', 'ops_bash', {}), result('normal'), result('normal'),
  ])
  const tool = activity.resources.find(item => item.label === 'ops_bash')
  assert.equal(tool.count, 2, 'Only the two distinct invocation IDs contribute to the total')
  assert.equal(tool.running, 0)
  assert.equal(tool.failed, 0)
  assert.equal(tool.detail, '已使用')
})

test('a successful retry preserves the earlier failure in the grouped tool status', () => {
  const activity = exports.__test.activityFrom([
    call('failed', 'write', { path: '/work/example.md' }), result('failed', true),
    call('retry', 'write', { path: '/work/example.md' }), result('retry'),
  ])
  const tool = activity.resources.find(item => item.label === 'write')
  assert.equal(tool.count, 2)
  assert.equal(tool.running, 0)
  assert.equal(tool.failed, 1)
  assert.equal(tool.detail, '调用失败')
})

test('compact tool summaries retain featured resources and prioritize the newest active tool', () => {
  const activity = exports.__test.activityFrom([
    call('write', 'write', {}),
    call('skill', 'skill', { name: 'sample-skill' }), result('skill'),
    call('memory', 'read', { path: '/work/memory/sample.md' }), result('memory'),
    call('web', 'web_search', {}), result('web'),
    call('bash', 'ops_bash', {}),
    call('output', 'job_output', {}), result('output'),
  ])
  const summary = exports.__test.toolSummary(activity.resources)
  assert.deepEqual(Array.from(summary.featured, item => item.kind), ['skill', 'memory', 'web'])
  assert.deepEqual(Array.from(summary.tools, item => item.label), ['write', 'ops_bash', 'job_output'])
  assert.deepEqual(Array.from(summary.active, item => item.label), ['ops_bash', 'write'])
  assert.equal(summary.count, 3, 'Skills, memory and web resources are not ordinary tool kinds')
  assert.equal(summary.calls, 3)
  assert.equal(summary.failed, 0)
  assert.deepEqual(Array.from(activity.resources, item => item.label), ['write', 'Skills', '记忆', '网页搜索', 'ops_bash', 'job_output'], 'Deriving a compact view must not reorder its input')
})

test('empty tool summaries contain no fabricated calls or active tools', () => {
  const summary = exports.__test.toolSummary([])
  for (const key of ['featured', 'tools', 'active']) assert.equal(summary[key].length, 0)
  for (const key of ['count', 'calls', 'failed']) assert.equal(summary[key], 0)
})

test('tool categories distinguish actual tool aliases and namespaced leaves without guessing from substrings', () => {
  const categories = [
    ['command', '命令', 'terminal', ['ops_bash', 'BASH', 'exec_command', 'mcp__runner__ops_bash', 'functions.exec_command']],
    ['edit', '编辑', 'file-edit', ['write', 'edit', 'apply_patch', 'functions.write_file']],
    ['read', '读取', 'file-read', ['read', 'read_file', 'mcp__workspace__read_file']],
    ['image', '图像', 'image', ['read_image', 'view_image', 'mcp__assets__view_image']],
    ['process', '进程', 'process', ['job_kill', 'job_output']],
    ['interaction', '交互', 'message', ['ask_user', 'ask_user_question', 'request_user_input']],
    ['search', '检索', 'search', ['grep', 'rg', 'glob', 'search_files']],
    ['agent', '协作', 'network', ['spawn_agent']],
    ['plan', '计划', 'checklist', ['todo_write', 'update_plan']],
    ['other', '其他', 'tool', ['unknown_tool', 'rewrite_metric', 'readiness_probe', '', null]],
  ]
  for (const [id, label, icon, names] of categories) for (const name of names) {
    assert.deepEqual({ ...exports.__test.toolCategory(name) }, { id, label, icon }, String(name))
  }
})

test('grouped tool counts and failures stay scoped to the turn being viewed', () => {
  const activity = exports.__test.turnActivityFrom([
    entry('turn/start', { turn: 1 }),
    call('old-1', 'ops_bash', {}), result('old-1', true),
    call('old-2', 'ops_bash', {}), result('old-2'),
    entry('turn/end', {}),
    entry('turn/start', { turn: 2 }),
    call('new-1', 'ops_bash', {}),
  ])
  const first = exports.__test.toolSummary(activity.turns[0].activity.resources)
  const second = exports.__test.toolSummary(activity.turns[1].activity.resources)
  assert.equal(first.calls, 2)
  assert.equal(first.failed, 1)
  assert.equal(first.active.length, 0)
  assert.equal(second.calls, 1)
  assert.equal(second.failed, 0)
  assert.equal(second.active.length, 1)
})

test('turn snapshots retain the latest valid plan and isolate delivered files and resources', () => {
  const firstPlan = [{ content: 'first draft', status: 'pending' }]
  const finalPlan = [{ content: 'first complete', status: 'completed' }]
  const activity = exports.__test.turnActivityFrom([
    entry('turn/start', { turn: 1 }),
    entry('todo/write', { todos: firstPlan }),
    call('old-skill', 'skill', { name: 'first-skill' }), result('old-skill'),
    entry('deliverables/presented', { files: [{ path: '/work/shared.zip', description: 'first turn' }] }),
    entry('todo/write', { todos: [...finalPlan, null, { content: 'invalid status', status: 'unknown' }, { status: 'pending' }] }),
    entry('todo/write', { todos: null }),
    entry('turn/end', {}),
    entry('turn/start', { turn: 2 }),
    entry('todo/write', { todos: [{ content: 'second active', status: 'in_progress' }] }),
    call('new-search', 'web_search', {}), result('new-search'),
    entry('deliverables/presented', { files: [{ path: '/work/shared.zip', description: 'second turn' }] }),
  ], true)
  assert.equal(activity.latestTurn, 2)
  assert.equal(activity.hasMore, true)
  assert.equal(activity.turns.length, 2)
  const [first, second] = activity.turns
  assert.equal(first.turn, 1)
  assert.equal(first.ended, true)
  assert.deepEqual(JSON.parse(JSON.stringify(first.todos)), finalPlan)
  assert.equal(second.ended, false)
  assert.equal(second.todos[0].content, 'second active')
  assert.equal(first.activity.files[0].description, 'first turn')
  assert.equal(second.activity.files[0].description, 'second turn')
  assert.equal(first.activity.resources.length, 1)
  assert.equal(first.activity.resources[0].detail, 'first-skill')
  assert.equal(second.activity.resources.length, 1)
  assert.equal(second.activity.resources[0].kind, 'web')
  assert.equal(activity.files[0].description, 'second turn', 'The compatibility activity fields represent only the latest turn')
  assert.equal(firstPlan[0].content, 'first draft', 'Projection snapshots must not mutate recorded plans')
})
test('new and explicitly cleared turns never inherit an earlier plan or outputs', () => {
  const activity = exports.__test.turnActivityFrom([
    entry('turn/start', { turn: 3 }),
    entry('todo/write', { todos: [{ content: 'old plan', status: 'completed' }] }),
    entry('deliverables/presented', { files: [{ path: '/work/old.zip' }] }),
    entry('turn/end', {}),
    entry('turn/start', { turn: 4 }),
    entry('turn/end', {}),
    entry('turn/start', { turn: 5 }),
    entry('todo/write', { todos: [{ content: 'discarded plan', status: 'pending' }] }),
    entry('todo/write', { todos: [] }),
  ])
  assert.equal(activity.turns[0].todos[0].content, 'old plan')
  assert.equal(activity.turns[1].todos, null, 'An empty turn is distinguishable from a recorded empty plan')
  assert.equal(activity.turns[1].activity.files.length, 0)
  assert.equal(activity.turns[1].activity.resources.length, 0)
  assert.equal(activity.turns[2].todos.length, 0)
  assert.equal(activity.files.length, 0)
  assert.equal(activity.resources.length, 0)
})
test('late tool results settle the calling turn without leaking resources into the next turn', () => {
  const activity = exports.__test.turnActivityFrom([
    entry('turn/start', { turn: 1 }),
    call('late-read', 'read', { path: '/work/memory/earlier.md' }),
    call('late-failure', 'memory_write', { action: 'save' }),
    entry('turn/end', {}),
    entry('turn/start', { turn: 2 }),
    result('late-read'), result('late-failure', true),
    call('current-skill', 'skill', { name: 'current' }), result('current-skill'),
  ])
  const [earlier, current] = activity.turns
  assert.ok(earlier.activity.resources.some(item => item.path === '/work/memory/earlier.md' && item.detail === '已读取 · earlier.md'))
  assert.ok(earlier.activity.resources.some(item => item.kind === 'memory' && item.detail === '调用失败'))
  assert.equal(current.activity.resources.length, 1)
  assert.equal(current.activity.resources[0].detail, 'current')
})
test('late PTC settlement retains the turn that dispatched the subcall', () => {
  const activity = exports.__test.turnActivityFrom([
    entry('turn/start', { turn: 1 }),
    entry('tool/ptc-dispatch-start', { subCallId: 'late-ptc', name: 'skill', arguments: { name: 'earlier-skill' } }),
    entry('turn/end', {}),
    entry('turn/start', { turn: 2 }),
    entry('tool/ptc-dispatch', { subCallId: 'late-ptc', name: 'skill', arguments: { name: 'earlier-skill' }, isError: false }),
  ])
  assert.equal(activity.turns[0].activity.resources.length, 1)
  assert.equal(activity.turns[0].activity.resources[0].detail, 'earlier-skill')
  assert.equal(activity.turns[1].activity.resources.length, 0)
})
test('partial history before a loaded turn boundary is not assigned to that turn', () => {
  const prefix = [
    call('unknown-read', 'read', { path: '/work/memory/unloaded.md' }),
    entry('todo/write', { todos: [{ content: 'unknown plan', status: 'completed' }] }),
    entry('deliverables/presented', { files: [{ path: '/work/unloaded.zip' }] }),
  ]
  const activity = exports.__test.turnActivityFrom([
    ...prefix,
    entry('turn/start', { turn: 7 }),
    result('unknown-read'),
    entry('todo/write', { todos: [{ content: 'known plan', status: 'pending' }] }),
  ], true)
  assert.equal(activity.turns.length, 1)
  assert.equal(activity.turns[0].turn, 7)
  assert.equal(activity.turns[0].todos[0].content, 'known plan')
  assert.equal(activity.turns[0].activity.files.length, 0)
  assert.equal(activity.turns[0].activity.resources.length, 0)
  assert.equal(activity.hasMore, true)
  const legacy = exports.__test.turnActivityFrom(prefix, true)
  assert.equal(legacy.turns, undefined, 'Boundary-free event sources retain their previous compatibility shape')
  assert.equal(legacy.files[0].path, '/work/unloaded.zip')
  assert.equal(legacy.hasMore, true)
})
test('explicit turn IDs recover partial activity without inheriting an unowned prefix plan', () => {
  const activity = exports.__test.turnActivityFrom([
    entry('todo/write', { todos: [{ content: 'unowned prefix plan', status: 'completed' }] }),
    entry('tool/call', { turn: 4, callId: 'partial-skill', name: 'skill', arguments: JSON.stringify({ name: 'partial-history' }) }),
    result('partial-skill'),
    entry('deliverables/presented', { turn: 4, files: [{ path: '/work/partial.zip' }] }),
    entry('turn/start', { turn: 5 }),
    entry('todo/write', { todos: [{ content: 'complete turn plan', status: 'pending' }] }),
  ], true)
  assert.equal(activity.turns.length, 2)
  const [partial, complete] = activity.turns
  assert.equal(partial.turn, 4)
  assert.equal(partial.complete, false, 'Activity with a turn ID does not prove the beginning of the turn was loaded')
  assert.equal(partial.todos, null, 'A plan without a known turn must not leak into a recovered partial turn')
  assert.equal(partial.activity.resources.length, 1)
  assert.equal(partial.activity.resources[0].detail, 'partial-history')
  assert.equal(partial.activity.files[0].path, '/work/partial.zip')
  assert.equal(complete.turn, 5)
  assert.equal(complete.complete, true)
  assert.equal(complete.todos[0].content, 'complete turn plan')
  assert.equal(complete.activity.files.length, 0)
  assert.equal(complete.activity.resources.length, 0)
})
test('PTC results with a new subcall ID inherit an existing root or parent call owner', () => {
  for (const link of ['rootCallId', 'parentCallId']) {
    const activity = exports.__test.turnActivityFrom([
      entry('turn/start', { turn: 1 }),
      call('known-root', 'execute', {}),
      entry('turn/end', {}),
      entry('turn/start', { turn: 2 }),
      entry('tool/ptc-dispatch', { subCallId: `new-child-${link}`, [link]: 'known-root', name: 'skill', arguments: { name: `earlier-${link}` }, isError: false }),
    ])
    assert.ok(activity.turns[0].activity.resources.some(item => item.kind === 'skill' && item.detail === `earlier-${link}`), `${link} retains the calling turn even when its subcall start is not recorded`)
    assert.equal(activity.turns[1].activity.resources.length, 0)
  }
})
test('turn-aware activity sources preserve reference on token appends and refresh on plan changes', () => {
  const rows = [entry('turn/start', { turn: 1 }), entry('todo/write', { todos: [{ content: 'old plan', status: 'pending' }] })]
  let snapshot = { entries: rows, hasMore: false, change: { kind: 'replace' } }
  const source = exports.__test.activitySource({ getSnapshot: () => snapshot })
  const first = source.getSnapshot()
  const token = entry('assistant/live-chunk', { text: 'streaming' })
  snapshot = { entries: [...rows, token], hasMore: false, change: { kind: 'append', entries: [token] } }
  assert.equal(source.getSnapshot(), first)
  const update = entry('todo/write', { todos: [{ content: 'new plan', status: 'in_progress' }] })
  snapshot = { entries: [...snapshot.entries, update], hasMore: false, change: { kind: 'append', entries: [update] } }
  const updated = source.getSnapshot()
  assert.notEqual(updated, first)
  assert.equal(first.turns[0].todos[0].content, 'old plan')
  assert.equal(updated.turns[0].todos[0].content, 'new plan')
})
test('progress windows keep the current step visible with separate previous and future groups', () => {  const todos = ['completed', 'completed', 'completed', 'in_progress'].map((status, index) => ({ status, content: `step${index}` }))
  assert.equal(exports.__test.progressItems(todos).previous.length, 1)
  assert.equal(exports.__test.progressItems(todos).items.length, 3)
  assert.equal(exports.__test.progressItems(todos, 2).items.length, 2)
  const working = ['completed', 'completed', 'completed', 'completed', 'in_progress', 'pending'].map((status, index) => ({ status, content: `step${index}` }))
  assert.equal(exports.__test.progressItems(working).previous.length, 3)
  assert.equal(exports.__test.progressItems(working).step, 5)
  assert.equal(exports.__test.progressItems(working).total, 6)
  assert.equal(exports.__test.progressItems(working).items.length, 3)
  assert.equal(exports.__test.progressItems([]).step, 0)
  for (const count of [2, 3]) for (let current = 0; current < 10; current++) {
    const list = Array.from({ length: 10 }, (_, index) => ({ content: `item${index}`, status: index < current ? 'completed' : index === current ? 'in_progress' : 'pending' }))
    const view = exports.__test.progressItems(list, count)
    assert.equal(view.items.length, count)
    assert.ok(view.items.includes(list[current]))
    assert.deepEqual([...view.previous, ...view.items, ...view.future], list, 'The two folded groups and visible window partition the list without omissions or duplicates')
    const manual = exports.__test.progressItems(list, count, 0)
    assert.equal(manual.start, 0)
    assert.equal(manual.step, current + 1, 'Browsing another window does not change the actual active task')
    assert.equal(exports.__test.progressItems(list, count, 99).start, 10 - count)
    assert.equal(exports.__test.progressItems(list, count, -9).start, 0)
  }
  const pending = exports.__test.progressItems(Array.from({ length: 8 }, (_, index) => ({ content: `item${index}`, status: 'pending' })))
  assert.equal(pending.future.length, 5)
  assert.equal(exports.__test.fileAddress('a/b', 'out/a b.zip'), 'dsh-resource://file/session/a%2Fb/out/a%20b.zip')
})
test('keeps tasks in the conversation column, away from a right sidebar and composer', () => {
  const result = placement({ left: 240, right: 1100, top: 88, bottom: 900 }, { width: 1500, height: 900 }, 320, 600)
  assert.equal(result.left + result.width, 1084)
  assert.equal(result.top, 104)
  assert.ok(result.top + result.listHeight + 64 < 600)
})
test('fits phone widths and releases unusable or hidden columns', () => {
  const result = placement({ left: 0, right: 390, top: 70, bottom: 844 }, { width: 390, height: 844 }, 420)
  assert.equal(result.left, 8)
  assert.equal(result.width, 374)
  assert.equal(placement({ left: 0, right: 100, top: 0, bottom: 600 }, { width: 500, height: 600 }, 320), null)
})
test('only real raster images earn a thumbnail; everything else falls back to a short type tile', () => {
  const { imageExtension, tileLabel, mimeFor } = exports.__test
  assert.equal(imageExtension('outputs/preview.png'), 'png')
  assert.equal(imageExtension('C:\\work\\Shot.JPG'), 'jpg')
  assert.equal(imageExtension('outputs/diagram.svg'), '')
  assert.equal(imageExtension('outputs/preview'), '')
  assert.equal(tileLabel('outputs/Animation preview.zip'), 'ZIP')
  assert.equal(tileLabel('outputs/report'), '文件')
  assert.equal(mimeFor('jpg'), 'image/jpeg')
  assert.equal(mimeFor('webp'), 'image/webp')
})
