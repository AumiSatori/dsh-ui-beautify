import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyPresentationOnce } from '../src/presentation-owner.js'

function fixture() {
  let style = false
  const observers = new Set(), events = []
  const win = { queueMicrotask, MutationObserver: class {
    constructor(callback) { this.callback = callback }
    observe() { observers.add(this) }
    disconnect() { observers.delete(this) }
  } }
  const doc = { head: {}, querySelector: () => style ? {} : null }
  const context = name => {
    const effects = [], ctx = { effect: fn => effects.push(fn()) }
    const mount = () => {
      events.push('start ' + name)
      ctx.effect(() => () => events.push('stop ' + name))
    }
    return { ctx, mount, dispose() { for (const stop of effects.splice(0).reverse()) stop?.() } }
  }
  return { win, doc, events, context, observers, style(value) { style = value; for (const observer of observers) observer.callback() } }
}
const tick = () => new Promise(resolve => queueMicrotask(resolve))

test('one context cannot install the presentation twice', () => {
  const f = fixture(), a = f.context('a')
  applyPresentationOnce(a.ctx, f.doc, f.win, a.mount)
  applyPresentationOnce(a.ctx, f.doc, f.win, a.mount)
  assert.deepEqual(f.events, ['start a'])
  a.dispose(); assert.deepEqual(f.events, ['start a', 'stop a'])
})

test('separate factories share the window lease and hand over after cleanup finishes', async () => {
  const f = fixture(), a = f.context('a'), b = f.context('b')
  const second = (await import('../src/presentation-owner.js?second-factory')).applyPresentationOnce
  applyPresentationOnce(a.ctx, f.doc, f.win, a.mount)
  second(b.ctx, f.doc, f.win, b.mount)
  assert.deepEqual(f.events, ['start a'])
  a.dispose(); assert.deepEqual(f.events, ['start a', 'stop a'])
  await tick(); assert.deepEqual(f.events, ['start a', 'stop a', 'start b'])
  b.dispose()
})

test('a disposed waiting context never takes over', async () => {
  const f = fixture(), a = f.context('a'), b = f.context('b')
  applyPresentationOnce(a.ctx, f.doc, f.win, a.mount)
  applyPresentationOnce(b.ctx, f.doc, f.win, b.mount)
  b.dispose(); a.dispose(); await tick()
  assert.deepEqual(f.events, ['start a', 'stop a'])
})

test('an older unguarded presentation keeps ownership until its own style is removed', async () => {
  const f = fixture(), a = f.context('a')
  f.style(true); applyPresentationOnce(a.ctx, f.doc, f.win, a.mount)
  assert.deepEqual(f.events, []); assert.equal(f.observers.size, 1)
  f.style(false); await tick()
  assert.deepEqual(f.events, ['start a']); assert.equal(f.observers.size, 0)
  a.dispose()
})

test('waiting on an old style releases its observer when the requesting plugin is disabled', async () => {
  const f = fixture(), a = f.context('a')
  f.style(true); applyPresentationOnce(a.ctx, f.doc, f.win, a.mount)
  a.dispose(); assert.equal(f.observers.size, 0)
  f.style(false); await tick(); assert.deepEqual(f.events, [])
})

test('independent windows do not block each other', () => {
  const f = fixture(), g = fixture(), a = f.context('a'), b = g.context('b')
  applyPresentationOnce(a.ctx, f.doc, f.win, a.mount)
  applyPresentationOnce(b.ctx, g.doc, g.win, b.mount)
  assert.deepEqual(f.events, ['start a']); assert.deepEqual(g.events, ['start b'])
  a.dispose(); b.dispose()
})

test('a synchronous startup failure relinquishes the lease for the next context', async () => {
  const f = fixture(), a = f.context('a'), b = f.context('b')
  assert.throws(() => applyPresentationOnce(a.ctx, f.doc, f.win, () => { throw Error('startup failed') }), /startup failed/)
  applyPresentationOnce(b.ctx, f.doc, f.win, b.mount)
  await tick(); assert.deepEqual(f.events, ['start b'])
  a.dispose(); b.dispose()
})
