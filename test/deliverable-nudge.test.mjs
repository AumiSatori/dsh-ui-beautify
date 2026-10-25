import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registerDeliverableNudge } from '../server/deliverable-nudge.js'

// 假装是 cordis：只记下注册的 handlers，方便直接调用装配钩子。
const harness = (config) => {
  const handlers = []
  const root = { on: (name, handler) => { handlers.push({ name, handler }) } }
  registerDeliverableNudge(root, config)
  return handlers
}

const assemble = async (handlers, sections = []) => {
  const { handler } = handlers[0]
  return handler({}, {}, async () => ({ sections }))
}

test('injects exactly one deliverables section into the assembled prompt', async () => {
  const handlers = harness()
  assert.equal(handlers.length, 1)
  assert.equal(handlers[0].name, 'system-prompt/assemble')
  const assembled = await assemble(handlers)
  const ours = assembled.sections.filter((section) => section.name === 'dsh-ui-beautify:deliverables')
  assert.equal(ours.length, 1)
  assert.match(ours[0].text, /present/)
  assert.match(ours[0].text, /\.scratch\//)
})

test('keeps existing sections and never adds a second copy of the same section', async () => {
  const handlers = harness()
  const existing = [
    { name: 'other', text: 'keep me' },
    { name: 'dsh-ui-beautify:deliverables', text: 'already there' },
  ]
  const assembled = await assemble(handlers, existing)
  assert.equal(assembled.sections.length, 2)
  assert.equal(assembled.sections[1].text, 'already there')
})

test('leaves the assembly untouched when it has no section list', async () => {
  const handlers = harness()
  const { handler } = handlers[0]
  const empty = await handler({}, {}, async () => ({}))
  assert.deepEqual(empty, {})
})

test('deliverableNudge:false disables the injection entirely', () => {
  assert.equal(harness({ deliverableNudge: false }).length, 0)
})

test('deliverableNudgeText replaces the default wording', async () => {
  const handlers = harness({ deliverableNudgeText: '  只看这一句  ' })
  const assembled = await assemble(handlers)
  assert.equal(assembled.sections[0].text, '只看这一句')
})

test('a host without ctx.on is tolerated', () => {
  assert.doesNotThrow(() => registerDeliverableNudge({}, {}))
  assert.doesNotThrow(() => registerDeliverableNudge(null, {}))
})
