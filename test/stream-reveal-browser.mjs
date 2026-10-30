import assert from 'node:assert/strict'
import {mkdirSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {chromium} from '@playwright/test'
import {build} from 'esbuild'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','.scratch','claude-beautify'),'stream-reveal')
mkdirSync(output,{recursive:true})
const bundle=(await build({entryPoints:[resolve(project,'src/stream-reveal.js')],bundle:true,write:false,format:'iife',globalName:'StreamReveal'})).outputFiles[0].text
// Public markers only: the native flow, an assistant row and a hashed Markdown class.
const fixture=`<!doctype html><body style="font:16px/24px system-ui;width:480px"><div data-chat-flow>
  <div data-chat-flow-kind="assistant-step"><div class="x_markdown_1"><p>已经在历史里的回答。</p></div></div>
  <div data-chat-flow-kind="user"><div class="x_markdown_2"><p>用户消息</p></div></div>
</div></body>`
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const page=await browser.newPage({viewport:{width:900,height:700}})
await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
await page.setContent(fixture)
await page.addScriptTag({content:bundle})
const levels=()=>page.evaluate(()=>Array.from({length:10},(_,level)=>CSS.highlights.get('dcb-stream-'+level)?.size??-1))
const idle=[0,0,0,0,0,0,0,0,0,0]
const settle=ms=>page.evaluate(ms=>new Promise(done=>setTimeout(done,ms)),ms)
const results=[]
const pass=name=>{results.push(name);console.log('PASS',name)}
// Characters still hidden (level 0) inside a root, and where the hidden part begins.
const hidden=selector=>page.evaluate(selector=>{
  const root=document.querySelector(selector),text=root.textContent
  let count=0,first=null
  for(const range of CSS.highlights.get('dcb-stream-0'))if(root.contains(range.startContainer)){
    count+=range.toString().length
    const probe=document.createRange();probe.setStart(root,0);probe.setEnd(range.startContainer,range.startOffset)
    const at=probe.toString().length;first=first===null?at:Math.min(first,at)
  }
  return {count,first,length:text.length}
},selector)

await page.evaluate(()=>{
  window.engine=StreamReveal.createStreamReveal(document,window,{streamReveal:true,streamRevealStrength:'soft'})
  let frames=0;const raf=window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame=callback=>{frames++;return raf(callback)}
  window.frames$=()=>frames
})
assert.equal((await levels()).length,10)
assert.equal(await page.locator('style[data-dcb-stream-reveal]').count(),1)
pass('installs one style element and ten highlight levels')

// First sight records history: a re-render that adds nothing never replays it.
await page.evaluate(()=>{const p=document.querySelector('.x_markdown_1 p');p.firstChild.nodeValue=p.firstChild.nodeValue})
await settle(30)
assert.deepEqual(await levels(),idle)
pass('history and unchanged re-renders are not animated')

// A live answer: React replaces the whole text value per token.
await page.evaluate(()=>{
  const row=document.createElement('div');row.setAttribute('data-chat-flow-kind','assistant-step')
  row.innerHTML='<div class="x_markdown_3"><p>开始</p></div>';document.querySelector('[data-chat-flow]').append(row)
})
await settle(30)
const structure=await page.evaluate(()=>document.querySelector('.x_markdown_3').innerHTML)
const tokens=await page.evaluate(async()=>{
  const text=document.querySelector('.x_markdown_3 p').firstChild,seen=[]
  for(const token of ['，新','的文字','以平滑','的节奏','逐字淡入。']){
    text.nodeValue+=token
    await new Promise(done=>queueMicrotask(done))
    // Arrived text starts hidden before it is painted.
    seen.push(CSS.highlights.get('dcb-stream-0').size)
    await new Promise(done=>setTimeout(done,40))
  }
  return seen
})
assert.ok(tokens.every(count=>count>=1),`each arrival is hidden until typed: ${tokens}`)
assert.ok((await levels()).slice(1).some(Boolean),'typed runs fade in')
assert.equal(await page.evaluate(()=>document.querySelector('.x_markdown_3').innerHTML),structure.replace('开始','开始，新的文字以平滑的节奏逐字淡入。'))
await settle(900)
assert.deepEqual(await levels(),idle)
pass('tokens are typed out and fade in without touching React text nodes')

// A burst is typed out evenly from its start instead of popping in.
await page.evaluate(()=>{const p=document.createElement('p');p.textContent='一大段文字同时到达，'.repeat(30);document.querySelector('.x_markdown_3').append(p)})
const burst0=await hidden('.x_markdown_3')
await settle(120)
const burst1=await hidden('.x_markdown_3')
await settle(160)
const burst2=await hidden('.x_markdown_3')
assert.ok(burst0.count>=240,`the whole burst starts hidden: ${JSON.stringify(burst0)}`)
assert.ok(burst1.count<burst0.count&&burst1.count>0&&burst2.count<burst1.count,`it drains progressively: ${burst0.count} → ${burst1.count} → ${burst2.count}`)
assert.ok(burst1.first>burst0.first,'typing proceeds from the start of the burst')
await page.screenshot({path:resolve(output,'burst-midframe.png')})
await settle(1400)
assert.deepEqual(await levels(),idle,'a burst is fully shown within about a second and a half')
pass('a burst is typed out evenly from its start within about a second')

// Code and table text arriving together are typed top to bottom.
const blocks=await page.evaluate(async()=>{
  const md=document.querySelector('.x_markdown_3'),pre=document.createElement('pre')
  pre.textContent='function demo(items) {\n  return items.map(item => item * 2)\n}\n'.repeat(3)
  const table=document.createElement('table');table.innerHTML='<tr><td>表格</td><td>单元</td></tr>'.repeat(3)
  md.append(pre,table)
  await new Promise(done=>setTimeout(done,90))
  const held=[...CSS.highlights.get('dcb-stream-0')].find(range=>md.contains(range.startContainer))
  return {preShown:!held||!pre.contains(held.startContainer)||held.startOffset>0,tableStillHidden:!!held&&(table.contains(held.startContainer)||pre.contains(held.startContainer))}
})
assert.ok(blocks.preShown&&blocks.tableStillHidden,`code is typed before the table below it: ${JSON.stringify(blocks)}`)
await settle(1500)
assert.deepEqual(await levels(),idle)
assert.equal(await page.evaluate(()=>engine.active),0)
const frames=await page.evaluate(()=>frames$())
await settle(300)
assert.equal(await page.evaluate(()=>frames$()),frames,'no frame loop remains after the answer settles')
pass('code and tables type top to bottom and settle with no resident frame loop')

// Other rows (user messages) are never touched.
await page.evaluate(()=>{document.querySelector('.x_markdown_2 p').append('追加')})
await settle(20)
assert.deepEqual(await levels(),idle)
pass('user rows are ignored')

// Thinking (the reasoning block and its summary) streams natively; only the answer body types out.
const thinking=await page.evaluate(async()=>{
  const flow=document.querySelector('[data-chat-flow]'),seen=[]
  const row=document.createElement('div');row.setAttribute('data-chat-flow-kind','assistant-step');row.setAttribute('data-chat-group-part','reasoning')
  row.innerHTML='<div data-variant="think"><div data-disclosure-header><div class="x_markdown_6"><p>思考摘要</p></div></div><div class="x_markdown_7"><p>思考</p></div></div>'
  flow.append(row)
  await new Promise(done=>setTimeout(done,30))
  for(const token of ['过程继续','写下去','一段很长的推理']){
    for(const selector of ['.x_markdown_6 p','.x_markdown_7 p'])document.querySelector(selector).firstChild.nodeValue+=token
    await new Promise(done=>queueMicrotask(done))
    seen.push(Array.from({length:10},(_,level)=>CSS.highlights.get('dcb-stream-'+level).size).reduce((a,b)=>a+b))
    await new Promise(done=>setTimeout(done,40))
  }
  return seen
})
assert.deepEqual(thinking,[0,0,0],'thinking text is never hidden or animated')
assert.equal(await page.evaluate(()=>engine.active),0,'no animation state remains for thinking')
pass('thinking block and summary stream natively')

// DS Bot bubbles belong to another plugin and are never touched, even on native rows.
await page.evaluate(()=>{
  const row=document.createElement('div');row.setAttribute('data-chat-flow-kind','assistant-step')
  row.innerHTML='<div class="bt-astack"><div class="bt-bubble"><div class="x_markdown_4"><p>机器人</p></div></div></div>'
  document.querySelector('[data-chat-flow]').append(row)
})
await settle(30)
await page.evaluate(()=>{document.querySelector('.x_markdown_4 p').firstChild.nodeValue+='的回复继续写'})
await settle(20)
assert.deepEqual(await levels(),idle)
pass('DS Bot bubbles are left untouched')

// A whole reply inserted at the bottom of a settled conversation is typed out;
// rows paged in above it and multi-row session loads stay as they are.
const arrived=await page.evaluate(async()=>{
  const flow=document.querySelector('[data-chat-flow]'),make=text=>{
    const row=document.createElement('div');row.setAttribute('data-chat-flow-kind','assistant-step')
    row.innerHTML=`<div class="x_markdown_5"><p>${text}</p></div>`
    return row
  }
  const count=()=>[...CSS.highlights.get('dcb-stream-0')].reduce((sum,range)=>sum+range.toString().length,0)
  flow.prepend(make('更早的历史消息被分页加载进来'))
  await new Promise(done=>queueMicrotask(done))
  const paged=count()
  flow.append(make('一整段回答首块一次到达，它会从开头开始均匀地打出来。'))
  await new Promise(done=>queueMicrotask(done))
  const whole=count()
  await new Promise(done=>setTimeout(done,1500))
  const after=count()
  flow.append(make('会话切换一'),make('会话切换二'),make('会话切换三'))
  await new Promise(done=>queueMicrotask(done))
  return {paged,whole,after,switched:count()}
})
assert.equal(arrived.paged,0,'history paged in above is not replayed')
assert.ok(arrived.whole>20,`a whole reply at the bottom starts hidden and is typed out: ${JSON.stringify(arrived)}`)
assert.equal(arrived.after,0)
assert.equal(arrived.switched,0,'several rows at once (a session load) are not replayed')
await settle(400)
pass('whole replies at the bottom are typed out; paged history and session loads are not')

// Reduced motion and forced colors show text immediately and release resources.
for(const preference of [{reducedMotion:'reduce'},{forcedColors:'active'}]){
  await page.evaluate(()=>document.querySelector('.x_markdown_3 p').append('还在生成的一大段文字'.repeat(4)))
  await page.emulateMedia(preference)
  await settle(30)
  assert.equal(await page.evaluate(()=>CSS.highlights.size),0)
  assert.equal(await page.locator('style[data-dcb-stream-reveal]').count(),0)
  await page.evaluate(()=>document.querySelector('.x_markdown_3 p').append('之后到达的文字'))
  await settle(20)
  assert.equal(await page.evaluate(()=>CSS.highlights.size),0)
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
  await settle(30)
  assert.equal(await page.evaluate(()=>CSS.highlights.size),10)
}
pass('reduced motion and forced colors cancel the reveal and show text directly')

await page.evaluate(()=>{document.querySelector('.x_markdown_3 p').append('关闭前的文字'.repeat(3));engine.setOptions({streamReveal:false})})
assert.equal(await page.evaluate(()=>CSS.highlights.size),0)
await page.evaluate(()=>engine.setOptions({streamReveal:true,streamRevealStrength:'vivid'}))
assert.match(await page.locator('style[data-dcb-stream-reveal]').textContent(),/text-shadow:0 0 2\.6/)
pass('the switch clears in-flight text; strength changes the dissolve')

await page.evaluate(()=>engine.dispose())
assert.equal(await page.evaluate(()=>CSS.highlights.size),0)
assert.equal(await page.locator('style[data-dcb-stream-reveal]').count(),0)
pass('dispose removes the observer, style and highlights')

await browser.close()
console.log(JSON.stringify({passed:results.length,output}))
