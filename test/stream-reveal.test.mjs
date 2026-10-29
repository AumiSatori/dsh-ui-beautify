import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeStreamReveal, streamRevealCss } from '../src/stream-reveal.js'

test('stream reveal defaults on with the restrained strength', () => {
  assert.deepEqual(normalizeStreamReveal(null), { streamReveal: true, streamRevealStrength: 'soft' })
  assert.deepEqual(normalizeStreamReveal({ streamReveal: false, streamRevealStrength: 'vivid' }), { streamReveal: false, streamRevealStrength: 'vivid' })
  assert.equal(normalizeStreamReveal({ streamRevealStrength: 'loud' }).streamRevealStrength, 'soft')
})

test('stream reveal levels hide waiting text, then fade to full ink', () => {
  const css = streamRevealCss('standard')
  assert.match(css, /::highlight\(dcb-stream-0\)\{color:color-mix\(in srgb,currentColor 0%,transparent\);/)
  const inks = [...css.matchAll(/currentColor (\d+)%/g)].map(match => Number(match[1]))
  assert.equal(inks.length, 10)
  assert.ok(inks.every((ink, index) => index === 0 || ink > inks[index - 1]) && inks.at(-1) < 100)
  // The glow shrinks as ink rises and never lingers on the last level.
  assert.doesNotMatch(css.split('\n').at(-1), /text-shadow/)
})
