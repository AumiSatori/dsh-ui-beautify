import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../.scratch/desktop-underlay-jitter'),'scroll-motion')
mkdirSync(out,{recursive:true})
let host
if(process.env.DSH_ASAR){
 const fd=openSync(process.env.DSH_ASAR,'r')
 try{const head=Buffer.alloc(16);readSync(fd,head,0,16,0);const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16);let entry=JSON.parse(json);for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js'.split('/'))entry=entry.files[part];const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset));host=bytes.toString()}finally{closeSync(fd)}
}else throw Error('Set DSH_ASAR to verify the installed native follow controller')
const start=host.indexOf('var ScrollFollow = class ScrollFollow'),end=host.indexOf('function useScrollFollow',start),native=host.slice(start,host.lastIndexOf('/**',end))+';window.NativeFollow=ScrollFollow;'
const built=(await build({entryPoints:[resolve(root,'src/composer-scroll-motion.js')],bundle:true,write:false,format:'iife',globalName:'ScrollMotion'})).outputFiles[0].text
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1400,height:1000},deviceScaleFactor:1.25}),errors=[]
page.on('pageerror',e=>errors.push(e.message));let passed=0
const tick=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))
const check=async(name,run)=>{await run();passed++;console.log('PASS '+name)}
async function boot(){
 await page.goto('about:blank');await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
 await page.setContent('<!doctype html><style>*{box-sizing:border-box}body{margin:0;background:#f4f6fb;color:#222;font:15px/24px system-ui}main{height:920px;overflow:auto;display:flex;flex-direction:column}[data-chat-flow]{width:1000px;margin:auto;flex:none;display:flex;flex-direction:column}[data-slot="conversation.chat.flow"]{display:contents}.row{height:180px;flex:none;padding:24px;border-bottom:1px solid #ccc}.seat{height:80px;flex:none;position:sticky;bottom:0;background:#ffffffc0;padding:16px 200px;backdrop-filter:blur(2px)}[data-composer-input]{outline:none}</style><div data-conversation-content data-conversation-session="fixture"><main data-conversation-scroll><section data-chat-following-tail><div data-chat-flow style="overflow:visible"><div data-slot="conversation.chat.flow"></div></div></section><footer class="seat" data-composer-seat><div contenteditable data-composer-input role=textbox aria-label="合成输入">1</div></footer></main></div>')
 await page.addScriptTag({content:native+built})
 await page.evaluate(()=>{
  window.scroll=document.querySelector('[data-conversation-scroll]');window.flow=document.querySelector('[data-chat-flow]');window.list=flow.firstElementChild;window.follow=new NativeFollow(true,48)
  window.row=(name,height=180)=>{const el=document.createElement('article');el.className='row';el.style.height=height+'px';el.textContent=name;el.dataset.chatTurn='1';return el}
  for(let i=0;i<12;i++)list.append(row('合成历史 '+i));scroll.scrollTop=scroll.scrollHeight
  window.nativeWrites=0;window.events=0;window.rafs=0
  const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>{rafs++;return raf(fn)}
  const desc=Object.getOwnPropertyDescriptor(Element.prototype,'scrollTop');Object.defineProperty(scroll,'scrollTop',{configurable:true,get(){return desc.get.call(this)},set(v){nativeWrites++;desc.set.call(this,v)}})
  window.manager=ScrollMotion.createComposerScrollMotion(document,window,true)
  window.metrics=()=>({top:scroll.scrollTop,height:scroll.clientHeight,floor:Math.max(0,scroll.scrollHeight-scroll.clientHeight)})
  window.grow=height=>{const el=list.lastElementChild;el.style.height=(el.offsetHeight+height)+'px';follow.toBottom(scroll,metrics(),'instant')}
  document.querySelector('[data-composer-input]').addEventListener('keydown',e=>{if(e.key!=='Enter'||e.shiftKey||e.isComposing)return;e.preventDefault();const el=row('新发送的合成消息',150);el.dataset.submissionEcho='true';list.append(el);follow.toBottom(scroll,metrics(),'instant')})
  scroll.addEventListener('scroll',()=>{events++;follow.sample(metrics(),false)})
 });await tick()
}
try{
 await check('native follow lands immediately while visible content has a real intermediate transition',async()=>{
  await boot();await page.getByRole('textbox',{name:'合成输入'}).press('Enter');await page.waitForFunction(()=>document.querySelector('[data-dcb-send-scroll-row]'))
  const result=await page.evaluate(()=>{const row=list.lastElementChild,a=row.getAnimations().find(a=>a.id==='dcb-send-scroll');a.pause();a.currentTime=90;return{top:scroll.scrollTop,floor:metrics().floor,active:follow.active,shift:parseFloat(getComputedStyle(row).translate.split(' ')[1]),writes:nativeWrites,events,range:scroll.scrollHeight}})
  assert.ok(Math.abs(result.top-result.floor)<.81);assert.equal(result.active,true);assert.equal(result.writes,1);assert.ok(result.events>0);assert.ok(result.shift>0&&result.shift<150)
  await page.screenshot({path:resolve(out,'send-middle.png')});await page.evaluate(()=>document.querySelectorAll('[data-dcb-send-scroll-row]').forEach(row=>row.getAnimations().forEach(a=>a.play())))
 })
 await check('animation never changes the native scroll range or writes the scroll offset',async()=>{
  const result=await page.evaluate(async()=>{const ranges=[],writes=nativeWrites;for(const until=performance.now()+380;performance.now()<until;){await new Promise(requestAnimationFrame);ranges.push(scroll.scrollHeight)}return{ranges,writes,after:nativeWrites,clean:!document.querySelector('[data-dcb-send-scroll-row]'),overflow:flow.style.overflow}})
  assert.equal(new Set(result.ranges).size,1);assert.equal(result.after,result.writes);assert.equal(result.clean,true);assert.equal(result.overflow,'visible')
 })
 await check('short messages do not shake when the composer creates a small scroll range, but a send crossing the boundary is smoothed',async()=>{
  async function prepare(count){
   await boot()
   await page.evaluate(count=>{
    list.replaceChildren(...Array.from({length:count},(_,i)=>row('短对话 '+i)))
    // Keep the message flow short while a composer seat and bottom inset create
    // a real, small native scroll range. This reproduces the underlay layout:
    // scrollHeight alone does not mean messages extend behind the composer.
    flow.parentElement.style.minHeight='840px'
    scroll.style.paddingBottom='20px'
    scroll.scrollTop=scroll.scrollHeight
    window.probe=list.firstElementChild
    window.shortFrames=[]
    document.addEventListener('keydown',e=>{
     if(e.key==='Enter')document.querySelector('[data-composer-seat]').style.height='90px'
    },{capture:true,once:true})
    window.recordShort=()=>{shortFrames.push({top:scroll.scrollTop,probe:probe.getBoundingClientRect().top,marked:document.querySelectorAll('[data-dcb-send-scroll-row]').length,shift:parseFloat(getComputedStyle(probe).translate.split(' ')[1])||0});if(shortFrames.length<32)requestAnimationFrame(recordShort)}
    recordShort()
   },count)
   await tick()
  }
  await prepare(2)
  await page.getByRole('textbox',{name:'合成输入'}).press('Enter')
  await page.waitForFunction(()=>shortFrames.length===32)
  const frames=await page.evaluate(()=>shortFrames)
  assert.ok(frames.at(-1).top>frames[0].top,'composer growth must exercise an actual native scroll')
  assert.ok(frames.every(frame=>frame.marked===0&&frame.shift===0),'short content must not get a paint compensation')
  const positions=frames.map(frame=>frame.probe)
  assert.ok(Math.max(...positions)-Math.min(...positions)<=12,'no replayed transcript movement')
  let direction=0
  for(let i=1;i<positions.length;i++){const delta=positions[i]-positions[i-1];if(Math.abs(delta)<.8)continue;const next=Math.sign(delta);assert.ok(!direction||next===direction,'the visible transcript must not reverse');direction=next}

  await prepare(4)
  await page.getByRole('textbox',{name:'合成输入'}).press('Enter')
  await page.waitForFunction(()=>document.querySelector('[data-dcb-send-scroll-row]'))
  const crossing=await page.evaluate(()=>{const animation=probe.getAnimations().find(a=>a.id==='dcb-send-scroll');if(!animation)return null;animation.pause();animation.currentTime=90;return{shift:parseFloat(getComputedStyle(probe).translate.split(' ')[1]),flowHeight:flow.scrollHeight,available:document.querySelector('[data-composer-seat]').getBoundingClientRect().top-scroll.getBoundingClientRect().top}})
  assert.ok(crossing&&crossing.flowHeight>crossing.available,'the sent message must actually cross the composer boundary')
  assert.ok(crossing.shift>0,'the crossing must have a real intermediate compensation frame')
 })
 await check('quick retarget and echoed-message replacement continue from the visible frame',async()=>{
  await boot();await page.getByRole('textbox',{name:'合成输入'}).press('Enter');await page.waitForFunction(()=>document.querySelector('[data-dcb-send-scroll-row]'))
  const result=await page.evaluate(async()=>{
   const probe=list.children[list.children.length-2];const before=probe.getBoundingClientRect().top;grow(40)
   await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);const after=probe.getBoundingClientRect().top
   const old=list.lastElementChild,copy=old.cloneNode(true);old.replaceWith(copy)
   await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)
   return{before,after,shift:parseFloat(getComputedStyle(copy).translate.split(' ')[1]),active:follow.active,writes:nativeWrites}
  })
  assert.ok(Math.abs(result.after-result.before)<55,'Retarget moves forward from its displayed frame, without replaying the full prior offset');assert.ok(result.shift>0);assert.equal(result.active,true);assert.equal(result.writes,2)
  await page.waitForTimeout(360);assert.equal(await page.locator('[data-dcb-send-scroll-row]').count(),0,'Acknowledged rows release their owned marker')
 })
 await check('wheel, pointer and reading keys immediately release effects without swallowing input',async()=>{
  for(const type of ['wheel','pointerdown','keydown']){
   await boot();await page.getByRole('textbox',{name:'合成输入'}).press('Enter');await page.waitForFunction(()=>document.querySelector('[data-dcb-send-scroll-row]'))
   const result=await page.evaluate(type=>{let delivered=0;document.addEventListener(type,()=>delivered++,{once:true});document.querySelector('[data-composer-input]').dispatchEvent(type==='keydown'?new KeyboardEvent(type,{key:'PageUp',bubbles:true}):new Event(type,{bubbles:true}));return{count:document.querySelectorAll('[data-dcb-send-scroll-row]').length,delivered,overflow:flow.style.overflow,writes:nativeWrites}},type)
   assert.deepEqual(result,{count:0,delivered:1,overflow:'visible',writes:1})
  }
 })
 await check('quiet preferences, large output and a reader away from the tail stay native',async()=>{
  for(const mode of ['reduced','forced','oversized','reading']){
   await boot();if(mode==='reduced')await page.emulateMedia({reducedMotion:'reduce'});if(mode==='forced')await page.emulateMedia({forcedColors:'active'})
   await page.evaluate(mode=>{if(mode==='oversized')list.lastElementChild.style.height='2500px';if(mode==='reading')scroll.scrollTop=0;else scroll.scrollTop=scroll.scrollHeight},mode)
   await page.getByRole('textbox',{name:'合成输入'}).press('Enter');await tick();assert.equal(await page.locator('[data-dcb-send-scroll-row]').count(),0,mode)
  }
 })
 await check('disable, session switch and disposal restore all styles and leave no frame loop',async()=>{
  for(const action of ['disable','session','dispose']){
   await boot();await page.getByRole('textbox',{name:'合成输入'}).press('Enter');await page.waitForFunction(()=>document.querySelector('[data-dcb-send-scroll-row]'))
   await page.evaluate(action=>{if(action==='disable')manager.setEnabled(false);if(action==='session')document.querySelector('[data-conversation-content]').dataset.conversationSession='other';if(action==='dispose')manager.dispose()},action)
   await tick();assert.equal(await page.locator('[data-dcb-send-scroll-row]').count(),0);assert.equal(await page.locator('[data-chat-flow]').getAttribute('style'),'overflow: visible;')
   const before=await page.evaluate(()=>rafs);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>rafs),before)
  }
 })
 await check('dense transcript keeps the correction past the row cap instead of bailing out',async()=>{
  await boot()
  // 一屏放得下 20 行以上的密集正文：旧实现在第 16 行就整批放弃，画面直接跳
  await page.evaluate(()=>{list.querySelectorAll('.row').forEach(el=>{el.style.height='44px'});for(let i=0;i<26;i++)list.append(row('密集历史 '+i,44));scroll.scrollTop=scroll.scrollHeight})
  await tick()
  await page.getByRole('textbox',{name:'合成输入'}).press('Enter')
  await page.waitForFunction(()=>document.querySelectorAll('[data-dcb-send-scroll-row]').length>16)
  const result=await page.evaluate(()=>{
   const marked=[...document.querySelectorAll('[data-dcb-send-scroll-row]')]
   const shifts=marked.map(el=>parseFloat(getComputedStyle(el).translate.split(' ')[1])||0)
   return {count:marked.length,min:Math.min(...shifts),max:Math.max(...shifts),overflow:flow.style.overflow}
  })
  assert.ok(result.count>16,'capped selection must not abort the whole correction')
  assert.ok(Math.abs(result.max-result.min)<1.5,'every carried row shares one offset')
  assert.ok(result.max>0,'the visible transcript is still compensated')
  assert.equal(result.overflow,'clip')
  await page.evaluate(()=>manager.setEnabled(false))
 })
 assert.deepEqual(errors,[]);writeFileSync(resolve(out,'result.json'),JSON.stringify({passed,errors,source:'Installed native ScrollFollow class; synthetic content and native browser scroll delivery'},null,2));console.log(JSON.stringify({passed,out}))
}finally{await browser.close()}
