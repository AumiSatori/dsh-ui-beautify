import {test} from 'node:test'
import assert from 'node:assert/strict'
import {motion,springSamples} from '../src/motion.js'

test('large surfaces settle monotonically with a finite slow tail and exact endpoints',()=>{
  const values=springSamples()
  assert.equal(values[0],0);assert.equal(values.at(-1),1)
  assert.ok(values.every((value,index)=>Number.isFinite(value)&&value>=0&&value<=1&&(!index||value>=values[index-1])))
  const halfway=values[Math.floor(values.length/2)]
  assert.ok(halfway>.8&&halfway<1)
  assert.ok(values.at(-1)-values.at(-3)<.01,'the final segment settles gently')
})
test('small controls have less than one percent overshoot and no sustained oscillation',()=>{
  const values=springSamples({damping:.86,frequency:9})
  assert.ok(Math.max(...values)>1&&Math.max(...values)<1.01)
  assert.equal(values.at(-1),1)
  assert.ok(values.slice(-8).every(value=>Math.abs(value-1)<.01))
})
test('shared movement timings are bounded and fallback curves remain available outside CSS environments',()=>{
  assert.ok(Object.entries(motion.time).every(([name,value])=>value>=180&&value<=(name==='sidebar'?500:300)))
  assert.ok(Object.isFrozen(motion)&&Object.isFrozen(motion.ease)&&Object.isFrozen(motion.time))
  assert.match(motion.ease.smooth,/^(linear|cubic-bezier)\(/)
  assert.match(motion.ease.snappy,/^(linear|cubic-bezier)\(/)
})
