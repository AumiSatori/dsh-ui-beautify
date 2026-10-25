import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../.scratch/desktop-underlay-jitter'),'handoff')
mkdirSync(out,{recursive:true})
let host
if(process.env.DSH_ASAR){
 const fd=openSync(process.env.DSH_ASAR,'r')
 try{const head=Buffer.alloc(16);readSync(fd,head,0,16,0);const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16);let entry=JSON.parse(json);for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js'.split('/'))entry=entry.files[part];const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset));host=bytes.toString()}finally{closeSync(fd)}
}else throw Error('Set DSH_ASAR to verify the installed host stylesheet')
const at=host.indexOf('ChatView.module.css'),region=host.slice(host.lastIndexOf('//#region',at),host.indexOf('//#endregion',at)),hostCss=JSON.parse(region.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)[1]),prefix=hostCss.match(/\.([\w]+)_column\{/)[1]
const built=(await build({entryPoints:[process.env.DSH_TURN_CARDS_SOURCE||resolve(root,'src/turn-cards.js')],bundle:true,write:false,format:'iife',globalName:'Cards'})).outputFiles[0].text
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],results=[]
try{
 const page=await browser.newPage({viewport:{width:2046,height:1104},deviceScaleFactor:1.25});page.on('pageerror',e=>errors.push(e.message))
 async function boot(style,preset,dark=false,reduced=false){
  await page.goto('about:blank');await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'})
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${hostCss}*{box-sizing:border-box}body{margin:0;font:14px/20px system-ui;background:#fff;color:#222}body[data-ds-dark-theme]{background:#15171c;color:#eee}main{height:988px;overflow:auto;display:flex;flex-direction:column}.history{height:2500px;flex:none}[data-slot="conversation.chat.flow"]{display:contents}.message{height:82px}.seat{height:98px;flex:none;position:sticky;bottom:0;background:#fff}</style><div data-conversation-content data-conversation-session="synthetic" data-content-phase="active"><main data-conversation-scroll><div data-chat-following-tail><div class="${prefix}_column" data-chat-flow><div data-slot="conversation.chat.flow"><div class="${prefix}_flowItem history" data-chat-turn="1" data-chat-flow-kind="assistant-step">合成历史</div></div></div></div><div class="seat" data-composer-seat>合成输入栏</div></main></div>`)
  await page.addScriptTag({content:built})
  await page.evaluate(({style,preset,dark,prefix})=>{
   document.body.toggleAttribute('data-ds-dark-theme',dark);const css=document.createElement('style');css.textContent=Cards.turnCardsCss;document.head.append(css)
   window.list=document.querySelector('[data-slot="conversation.chat.flow"]');window.scroller=document.querySelector('[data-conversation-scroll]');window.flow=document.querySelector('[data-chat-flow]')
   window.manager=Cards.createTurnCards(document,window,{enabled:true,style,turnDividerPreset:preset})
   window.row=(echo=false,empty=false)=>{const row=document.createElement('div');if(echo)row.setAttribute('data-submission-echo','true');else{row.className=prefix+'_flowItem';row.dataset.chatTurn='2';row.dataset.chatFlowKind='user'}row.innerHTML=empty?'<div data-slot="conversation.chat.node"></div>':'<div data-slot="conversation.chat.node"><div class="message">合成消息</div></div>';return row}
   window.frames=[];window.measure=()=>({floor:scroller.scrollHeight-scroller.clientHeight,top:scroller.scrollTop,head:list.lastElementChild?.hasAttribute('data-dcb-turn-head')||false,height:list.lastElementChild?.getBoundingClientRect().height||0,margin:list.lastElementChild?parseFloat(getComputedStyle(list.lastElementChild).marginTop):0})
   window.ro=new ResizeObserver(()=>{scroller.scrollTop=scroller.scrollHeight;frames.push(measure())});ro.observe(flow)
  },{style,preset,dark,prefix});await page.waitForTimeout(50)
 }
 async function commit(kind){return page.evaluate(kind=>new Promise(resolve=>requestAnimationFrame(()=>{
  window.frames.length=0
  if(kind==='insert')list.append(row(true))
  else if(kind==='ack')list.lastElementChild.replaceWith(row())
  else if(kind==='empty')list.lastElementChild.replaceWith(row(false,true))
  else list.lastElementChild.firstElementChild.innerHTML='<div class="message">延迟填充的消息</div>'
  const committed=measure();scroller.scrollTop=scroller.scrollHeight;
  queueMicrotask(()=>{const immediate=measure();requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({committed,immediate,observed:[...frames],after:measure()})))})
 })),kind)}
 for(const [style,preset]of [['line','whale'],['line','plain'],['soft','plain']])for(const dark of [false,true]){
  await boot(style,preset,dark)
  const insertion=await commit('insert'),before=insertion.after,ack=await commit('ack')
  assert.equal(insertion.immediate.head,true,'Insertion receives turn spacing in its mutation batch')
  assert.ok(insertion.observed.length<=1,'The native size observer must not see a second decoration-only layout')
  assert.equal(ack.committed.floor,before.floor,'React layout effects must see the final spacing before MutationObserver');
  assert.equal(ack.immediate.head,true,'The durable row inherits spacing before the next frame')
  assert.equal(ack.immediate.floor,before.floor,'Acknowledgement must not shrink the native scroll range')
  for(const sample of ack.observed)assert.equal(sample.floor,before.floor,'The native tail follower never follows a temporarily smaller range')
  assert.ok(Math.abs(ack.after.top-before.top)<.81,'Acknowledgement preserves the viewport at DPR 1.25')
  assert.equal(ack.after.height,before.height)
  results.push({style,preset,dark,insertion,ack});console.log('PASS stable '+style+'/'+preset+'/'+(dark?'dark':'light'))
 }
 await boot('line','whale',false,true);await commit('insert');await commit('empty');const filled=await commit('fill')
 assert.equal(filled.immediate.head,true,'An initially empty Factory seat is decorated as soon as it fills')
 assert.equal(filled.observed.length,1,'Delayed slot content gets its final spacing before native ResizeObserver')
 const streamed=await page.evaluate(async()=>{
  const original=Element.prototype.matches;let scans=0;Element.prototype.matches=function(...args){if(this.parentElement===list)scans++;return Reflect.apply(original,this,args)}
  for(let i=0;i<12;i++){list.lastElementChild.querySelector('.message').firstChild.appendData('。');await new Promise(requestAnimationFrame)}
  Element.prototype.matches=original;return scans
 });assert.equal(streamed,0,'Grouped token updates never rescan the transcript');console.log('PASS delayed Factory slot and bounded streaming work')


 for(const [style,preset]of [['line','whale'],['soft','plain']])for(const processTurn of ['2','3']){
  await boot(style,preset);await commit('insert')
  await page.evaluate(processTurn=>{const process=document.createElement('div');process.dataset.chatTurn=processTurn;process.dataset.chatFlowKind='turn-process';process.textContent='合成活动过程';list.append(process)},processTurn);await page.waitForTimeout(40)
  const ackWithProcess=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{
   const pending=list.querySelector('[data-submission-echo]'),user=row();const floor=scroller.scrollHeight-scroller.clientHeight,before=pending.getBoundingClientRect().height
   pending.replaceWith(user);const committed={floor:scroller.scrollHeight-scroller.clientHeight,height:user.getBoundingClientRect().height}
   queueMicrotask(()=>requestAnimationFrame(()=>resolve({before,floor,committed,after:{floor:scroller.scrollHeight-scroller.clientHeight,height:user.getBoundingClientRect().height}})))
  })))
  assert.equal(ackWithProcess.committed.height,ackWithProcess.before,'A running process cannot make the durable user shorter during its synchronous commit')
  assert.equal(ackWithProcess.committed.floor,ackWithProcess.floor,'No 12/22px reverse scroll target while a process seat exists')
  assert.equal(ackWithProcess.after.height,ackWithProcess.before,'The question inset stays fixed after grouping settles')
  results.push({style,processTurn,ackWithProcess});console.log('PASS acknowledgement beside process/'+style+'/'+processTurn)
 }
 for(const size of ['desktop','narrow']){
  await page.setViewportSize(size==='desktop'?{width:2046,height:1104}:{width:390,height:844});await boot('line','whale')
  await page.evaluate(()=>{list.replaceChildren()});await page.waitForTimeout(30)
  const first=await commit('insert');assert.equal(first.committed.floor,first.after.floor,'The first turn gets no transient inter-turn margin');await commit('ack')
  const joined=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{
   const user=list.lastElementChild;user.removeAttribute('data-dcb-turn-row');user.removeAttribute('data-dcb-turn-head');user.removeAttribute('data-dcb-turn-tail');user.removeAttribute('data-dcb-turn-first')
   const process=document.createElement('div');process.dataset.chatTurn='2';process.dataset.chatFlowKind='turn-process';process.textContent='合成过程';list.append(process)
   const before=measure();queueMicrotask(()=>{requestAnimationFrame(()=>resolve({before,after:measure(),userHeight:user.getBoundingClientRect().height}))})
  })))
  assert.equal(joined.before.floor,joined.after.floor,'The latest user seat already clears its tail padding when its same-turn process is present')
  results.push({size,first,joined});console.log('PASS first turn and joined process/'+size)
 }
 await page.screenshot({path:resolve(out,'handoff-stable.png')})
 await page.evaluate(()=>{ro.disconnect();manager.dispose()});assert.equal(await page.locator('[data-dcb-turn-row], [data-dcb-turn-head]').count(),0)
 assert.deepEqual(errors,[]);writeFileSync(resolve(out,'result.json'),JSON.stringify({passed:13,deviceScaleFactor:1.25,results,delayed:filled,streamingScans:streamed,errors},null,2));console.log(JSON.stringify({passed:13,out}))
}finally{await browser.close()}
