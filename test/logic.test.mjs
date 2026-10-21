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
  assert.equal(normalize({ width: 999 }).width, 420)
  assert.equal(normalize({ width: -1, enabled: false }).width, 260)
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
