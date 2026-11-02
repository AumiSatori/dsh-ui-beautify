import {test} from 'node:test'
import assert from 'node:assert/strict'
import {summaryEntryState as state} from '../src/summary-entry-status.js'

test('entry has exactly the three requested labels and running takes priority',()=>{
  assert.equal(state().label,'空闲')
  assert.equal(state({completed:true}).label,'查看成果')
  assert.equal(state({running:true}).label,'处理中')
  assert.equal(state({running:true,completed:true}).label,'处理中')
})
test('tool details, task counts, end reasons and permission prompts do not classify the entry',()=>{
  const extra={pending:true,plan:[{status:'in_progress'}],files:[{path:'file.txt'}],category:'command',active:true,endReason:'error'}
  assert.equal(state(extra).label,'空闲')
  assert.equal(state({...extra,completed:true}).label,'查看成果')
  assert.equal(state({...extra,running:true}).label,'处理中')
})
