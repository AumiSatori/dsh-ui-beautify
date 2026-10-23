import{test}from'node:test'
import assert from'node:assert/strict'
import{normalizeParticles,particleOccupancy,particleProgress}from'../src/context-particle-config.js'

test('context particles use bounded lightweight logo defaults and coherent thresholds',()=>{
  const defaults=normalizeParticles(null)
  assert.deepEqual([defaults.particleEnabled,defaults.particleShape,defaults.particleCount,defaults.particleStart,defaults.particleFull],[true,'logo',6400,0,80])
  const bad=normalizeParticles({particleShape:'other',particleCount:Infinity,particleStart:95,particleFull:40,particleSvgName:'x'.repeat(300)})
  assert.equal(bad.particleShape,'logo');assert.equal(bad.particleCount,6400);assert.equal(bad.particleFull,96);assert.equal(bad.particleSvgName.length,160)
  assert.equal(normalizeParticles({particleCount:100000}).particleCount,10000)
})
test('occupancy follows projected tokens, falls back to pressure tokens and waits for complete data',()=>{
  assert.equal(particleOccupancy({projectedTokens:0,pressureTokens:900,contextWindow:1000}),0)
  assert.equal(particleOccupancy({projectedTokens:344,pressureTokens:800,contextWindow:1000}),34)
  assert.equal(particleOccupancy({pressureTokens:755,contextWindow:1000}),76)
  assert.equal(particleOccupancy({projectedTokens:2000,contextWindow:1000}),100)
  for(const input of [null,{}, {pressureTokens:20},{pressureTokens:20,contextWindow:0},{projectedTokens:NaN,contextWindow:100}])assert.equal(particleOccupancy(input),null)
})
test('real occupancy maps continuously between configured thresholds, including compression',()=>{
  assert.equal(particleProgress(null,10,80),0)
  assert.deepEqual([0,10,45,80,100].map(p=>particleProgress(p,10,80)),[0,0,.5,1,1])
  assert.ok(particleProgress(20,10,80)<particleProgress(70,10,80))
})
