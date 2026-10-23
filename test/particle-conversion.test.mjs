import {test} from 'node:test'
import assert from 'node:assert/strict'
import {normalizeParticles,particleConversion} from '../src/context-particle-config.js'

test('existing particle preferences keep context tracking; manual conversion has its own bounded value',()=>{
  const previous=normalizeParticles({particleCount:12800,particleStart:20,particleFull:60})
  assert.equal(previous.particleProgressMode,'context')
  assert.equal(previous.particleManualProgress,50)
  assert.equal(previous.particleCount,12800)
  assert.equal(normalizeParticles({particleProgressMode:'other',particleManualProgress:Infinity}).particleProgressMode,'context')
  assert.equal(normalizeParticles({particleManualProgress:Infinity}).particleManualProgress,50)
  for(const [input,expected]of [[-40,0],[1000,100],[32.7,33]])assert.equal(normalizeParticles({particleManualProgress:input}).particleManualProgress,expected)
})

test('manual conversion is independent of occupancy, thresholds and particle quantity',()=>{
  for(const particleManualProgress of [0,23,100])for(const percent of [null,0,40,100]){
    const settings=normalizeParticles({particleProgressMode:'manual',particleManualProgress,particleStart:75,particleFull:90,particleCount:16800})
    assert.equal(particleConversion(percent,settings),particleManualProgress/100)
    assert.equal(settings.particleCount,16800)
  }
  const manual=normalizeParticles({particleProgressMode:'manual',particleManualProgress:73,particleStart:20,particleFull:60})
  const automatic={...manual,particleProgressMode:'context'}
  assert.deepEqual([null,0,20,40,60,100].map(percent=>particleConversion(percent,automatic)),[0,0,0,.5,1,1])
  assert.equal(automatic.particleManualProgress,73,'returning to context tracking preserves the manual choice')
})
