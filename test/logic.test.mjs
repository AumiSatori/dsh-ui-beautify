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
test('prior completed steps fold and file addresses remain scoped and correctly encoded', () => {  const todos = ['completed', 'completed', 'completed', 'in_progress'].map((status, index) => ({ status, content: `step${index}` }))
  assert.equal(exports.__test.progressItems(todos, false).hidden, 2)
  assert.equal(exports.__test.progressItems(todos, false).items.length, 2)
  assert.equal(exports.__test.progressItems(todos, true).items.length, 4)
  const working = ['completed', 'completed', 'completed', 'completed', 'in_progress', 'pending'].map((status, index) => ({ status, content: `step${index}` }))
  assert.equal(exports.__test.progressItems(working, false, true).hidden, 2)
  assert.equal(exports.__test.progressItems(working, false, true).step, 5)
  assert.equal(exports.__test.progressItems(working, false, true).total, 6)
  assert.equal(exports.__test.progressItems(working, false, true).items.length, 4)
  assert.equal(exports.__test.progressItems([], false, true).step, 0)
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
