import {test} from 'node:test'
import assert from 'node:assert/strict'
import {summaryEntryState as state,summaryEventStatus as events} from '../src/summary-entry-status.js'

const plan=[{status:'completed'},{status:'in_progress'},{status:'pending'}]
test('entry uses meaningful states; only an active plan exposes progress',()=>{
  assert.equal(state().label,'概览')
  assert.equal(state({running:true}).label,'处理中')
  assert.equal(state({running:true,plan}).label,'2/3')
  assert.equal(state({running:false,plan}).label,'概览')
  assert.equal(state({running:true,plan:plan.map(()=>({status:'completed'}))}).label,'处理中')
  assert.equal(state({running:true,pending:true,plan}).label,'待确认')
  assert.equal(state({pending:true}).label,'待确认')
  assert.equal(state({files:[{path:'synthetic.txt'}]}).label,'查看成果')
  for(const endReason of ['interrupted','cancelled','stopped'])assert.equal(state({endReason,files:[{}]}).label,'已停止')
  assert.equal(state({endReason:'error'}).label,'执行出错')
  assert.equal(state({endReason:'complete'}).label,'概览')
  assert.equal(state({running:true,endReason:'interrupted'}).label,'处理中')
})
test('actions come only from unfinished real tool calls and never claim command success',()=>{
  for(const[category,label]of Object.entries({read:'读取文件',edit:'修改文件',command:'执行命令',web:'检索资料',interaction:'待确认'})){
    assert.equal(state({running:true,category,active:true}).label,label)
    assert.equal(state({running:true,category,active:false}).label,'处理中')
    assert.equal(state({running:false,category,active:true}).label,'概览')
  }
})
test('parallel and delegated tool results retain the latest remaining action and end reason',()=>{
  const entry=(type,data)=>({event:{type,data}})
  const rows=[entry('tool/call',{callId:'a',name:'read_file'}),entry('tool/ptc-dispatch-start',{subCallId:'b',name:'apply_patch'})]
  assert.equal(events(rows).tool,'apply_patch')
  rows.push(entry('tool/ptc-dispatch',{subCallId:'b',name:'apply_patch'}));assert.equal(events(rows).tool,'read_file')
  rows.push(entry('tool/result',{message:{source:{callId:'a'}}}),entry('turn/end',{reason:{kind:'interrupted'}}))
  assert.deepEqual(events(rows),{tool:'',endReason:'interrupted'})
  assert.deepEqual(events([null,{},entry('turn/end',{reason:'cancelled'})]),{tool:'',endReason:'cancelled'})
})
