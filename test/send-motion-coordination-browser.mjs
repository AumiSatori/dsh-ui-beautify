import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {hostFile,hostSheet,readableHost} from './host-stylesheet.mjs'
const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/beautify-send-motion'),'send-motion')
mkdirSync(out,{recursive:true})
const conversation=hostFile('dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js'),chat=readableHost(hostFile('dsh/node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js'))
const css=hostSheet(conversation,'InputBar','ib')+hostSheet(conversation,'ConversationRoot','cr'),start=chat.indexOf('var ScrollFollow = class'),end=chat.indexOf('function useScrollFollow',start)
assert.ok(start>=0&&end>start,'Installed native follow controller is discoverable')
const native=chat.slice(start,end)+';window.NativeFollow=ScrollFollow;'
const client=readFileSync(process.env.DSH_MESSAGE_CLIENT||resolve(root,'client.js'),'utf8')
const scrollBuilt=(await build({entryPoints:[process.env.DSH_TAIL_SOURCE||resolve(root,'src/composer-scroll-motion.js')],bundle:true,write:false,format:'iife',globalName:'TailMotion'})).outputFiles[0].text
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:850},deviceScaleFactor:1.25}),results=[],errors=[]
page.on('pageerror',e=>errors.push(e.message))
try{
 for(const mode of ['single','multiline','late-commit','narrow-dark','short','overflow-boundary','image-overflow','image-boundary','native-reversal','stream-single','stream-multiline','stream-echo-gap','stream-long-task']){
  const collapse=true,tail=true,lines=['single','short','overflow-boundary','stream-single'].includes(mode)?1:5,late=mode==='late-commit',narrow=mode==='narrow-dark',image=mode.startsWith('image-'),history=mode==='short'?2:mode==='overflow-boundary'?4:mode==='image-boundary'?3:15
  await page.setViewportSize(narrow?{width:520,height:850}:{width:1280,height:850})
  await page.goto('about:blank');await page.setContent(`<!doctype html><style>${css}*{box-sizing:border-box}body{margin:0;font:14px/24px system-ui}:root{--dsw-font-family:system-ui;--dsh-content-font-size:14px;--dsh-composer-card-max-width:720px;--dsw-radius-panel:20px;--dsw-alias-bg-base:#fff;--dsw-specific-input-major:#f4f5f7}.root{height:800px;display:flex;flex-direction:column}.cr_scrollBody{overflow-anchor:none}.ib_dock{height:24px}[data-chat-flow]{width:720px;margin:auto}.row{height:140px;border-bottom:1px solid #8884;padding:24px}.ib_input p{margin:0}.ib_card{line-height:24px}</style><main class=root><div class=cr_body data-conversation-content data-conversation-session=synthetic data-content-phase=active><div class=cr_scrollBody data-conversation-scroll><section data-chat-following-tail><div data-chat-flow><div data-slot="conversation.chat.flow"></div></div></section><footer class=cr_composerSeat data-composer-seat><div class=ib_root><div class=ib_card data-composer-card><div class=ib_scroll data-input-scroll><div class=ib_grow><div class=ib_input contenteditable=true role=textbox aria-label=合成草稿 data-composer-input></div></div></div><div class=ib_row><span>合成模型</span><button class=ib_primary aria-label=发送消息>↑</button></div></div><div class=ib_dock></div></div></footer></div></div></main>`)
  await page.evaluate(()=>{window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(()=>({}))}})
  await page.addScriptTag({content:client});await page.addScriptTag({content:native+scrollBuilt})
  await page.addStyleTag({content:'[data-chat-flow]{width:min(720px,100%)}.row{overflow:hidden}[data-composer-card]{max-width:100%}'+(narrow?'body{background:#17191e;color:#eceff5;--dsw-alias-bg-base:#17191e;--dsw-specific-input-major:#252830}':'')})
  await page.evaluate(({collapse,tail,lines,late,image,history,mode})=>{
   window.scroller=document.querySelector('[data-conversation-scroll]');window.flow=document.querySelector('[data-chat-flow]');window.list=flow.firstElementChild;window.editor=document.querySelector('[data-composer-input]');window.card=document.querySelector('[data-composer-card]');window.follow=new NativeFollow(true,48);window.frames=[];window.events=[];window.until=0
   const metrics=()=>({top:scroller.scrollTop,floor:Math.max(0,scroller.scrollHeight-scroller.clientHeight)})
   window.row=()=>{const el=document.createElement('article');el.className='row';el.textContent='合成消息';return el}
   for(let i=0;i<history;i++)list.append(row());editor.innerHTML=Array.from({length:lines},()=>'<p>合成验证草稿</p>').join('')
   if(image){const preview=document.createElement('div');preview.id='draft-image';preview.style.height='70px';preview.textContent='合成待发送图片';card.prepend(preview)}
   const probe=list.children[history-2]
   window.sample=label=>({label,time:performance.now(),top:scroller.scrollTop,floor:metrics().floor,probe:probe.getBoundingClientRect().top,cardTop:card.getBoundingClientRect().top,cardHeight:card.getBoundingClientRect().height,replaced:!!window.sentRow&&!window.sentRow.isConnected,entryCompensated:!!window.sentRow?.isConnected&&window.sentRow.getAnimations().some(animation=>animation.id==='dcb-send-scroll'),held:!!document.querySelector('[data-dcb-echo-hold]'),rows:list.children.length,seam:list.lastElementChild.getBoundingClientRect().top-list.lastElementChild.previousElementSibling.getBoundingClientRect().bottom})
   window.resize=new ResizeObserver(()=>{if(follow.active)follow.toBottom(scroller,metrics(),'instant');if(until)events.push(sample('resize'))});resize.observe(document.querySelector('[data-composer-seat]'));resize.observe(flow)
   scroller.addEventListener('scroll',()=>{follow.sample(metrics(),false);if(until)events.push(sample('scroll'))});scroller.scrollTop=scroller.scrollHeight
   if(collapse)window.submitMotion=plugin.__test.createComposerSubmitMotion(document,window)
   window.tailMotion=TailMotion.createComposerScrollMotion(document,window,tail);if(mode.startsWith('stream-'))tailMotion.setFollow(true)
   function commit(){editor.innerHTML='<p><br></p>';document.querySelector('#draft-image')?.remove();const sent=row();if(image)sent.style.height='300px';if(mode==='stream-echo-gap'){sent.dataset.chatFlowKind='user';sent.innerHTML='<div data-submission-echo>合成消息</div>'}list.append(sent);window.sentRow=sent;if(mode.startsWith('stream-'))sent.animate([{translate:'0px 18px'},{translate:'0px 0px'}],{duration:280,id:'fixture-entry'});follow.toBottom(scroller,metrics(),'instant');events.push(sample('native-commit'));if(mode==='native-reversal'){const floor=metrics().floor;[floor-18,floor-48,floor-24,floor-62,floor-40].forEach((target,index)=>setTimeout(()=>{scroller.scrollTop=target},index*34))}if(mode==='stream-echo-gap'){
    // First send after a host start: the echo row leaves a few frames before
    // the real row renders.
    setTimeout(()=>{sent.remove();follow.toBottom(scroller,metrics(),'instant')},65)
    setTimeout(()=>{const real=row();real.dataset.chatFlowKind='user';list.append(real);follow.toBottom(scroller,metrics(),'instant')},115)
   }else if(mode==='stream-long-task'){
    // After a session switch the host renders the next row inside a long task;
    // the glide kept playing on the compositor meanwhile.
    setTimeout(()=>{const end=performance.now()+160;while(performance.now()<end);const status=row();status.style.height='34px';list.append(status);follow.toBottom(scroller,metrics(),'instant')},90)
   }else setTimeout(()=>{const old=list.lastElementChild;old.replaceWith(old.cloneNode(true));follow.toBottom(scroller,metrics(),'instant')},65)}
   function submit(){until=performance.now()+850;frames.push(sample('before'));if(late)requestAnimationFrame(commit);else commit();function step(){frames.push(sample('frame'));if(performance.now()<until)requestAnimationFrame(step)}requestAnimationFrame(step)}
   editor.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit()}})
  },{collapse,tail,lines,late,image,history,mode});await page.waitForTimeout(80);await page.getByRole('textbox',{name:'合成草稿'}).press('Enter');await page.waitForTimeout(mode==='stream-long-task'?1800:950)
  const result=await page.evaluate(()=>({frames,events,final:{rows:document.querySelectorAll('[data-dcb-send-scroll-row]').length,range:scroller.scrollHeight,top:scroller.scrollTop,draft:editor.textContent}}));let reverse=0,lastSign=0;for(let i=1;i<result.frames.length;i++){const delta=result.frames[i].probe-result.frames[i-1].probe;if(Math.abs(delta)<=.8)continue;const sign=Math.sign(delta);if(lastSign&&sign!==lastSign)reverse++;lastSign=sign}
  // Frames where the composer is still collapsing but the painted transcript
  // stands still: the v0.5.0 spring retarget held it until the collapse ended.
  let stall=0;for(let i=1;i<result.frames.length;i++){const a=result.frames[i-1],b=result.frames[i];if(b.cardHeight<a.cardHeight-.5&&Math.abs(b.probe-a.probe)<.3)stall++}
  // The host replaces the echoed row mid-glide; it must move with its
  // neighbour, so the seam between the last two rows stays put.
  const settled=result.frames.filter(frame=>frame.label==="frame"&&frame.replaced&&frame.rows===result.frames.at(-1).rows),seams=settled.map(frame=>frame.seam),drift=seams.length?Math.max(...seams)-Math.min(...seams):0
  results.push({mode,reverse,stall,drift,...result});console.log(JSON.stringify({mode,reverse,stall,drift:+drift.toFixed(2),first:result.frames.slice(0,8).map(({probe,top,floor,cardHeight})=>({probe,top,floor,cardHeight}))}))
  if(narrow)await page.screenshot({path:resolve(out,'coordinated-dark-narrow.png')})
 }
 const report=resolve(out,process.env.DSH_TAIL_SOURCE?'coordination-before.json':'coordination-after.json')
 writeFileSync(report,JSON.stringify({results,errors},null,2))
 assert.deepEqual(errors,[])
 for(const result of results){if(result.mode!=='native-reversal')assert.equal(result.reverse,0,result.mode+' must not reverse the painted transcript during one send');if(result.mode!=='native-reversal'&&result.frames.some(frame=>frame.cardHeight>120))assert.ok(result.stall<=1,result.mode+' must keep moving while the composer collapses ('+result.stall+' still frames)');if(result.mode.startsWith('stream-')&&!['stream-echo-gap','stream-long-task'].includes(result.mode))assert.ok(result.frames.some(frame=>frame.entryCompensated),result.mode+' a row entering with its own motion still takes the send offset');if(result.mode==='stream-long-task'){const frames=result.frames.filter(frame=>frame.label==='frame'),gap=frames.findIndex((frame,i)=>i&&frame.time-frames[i-1].time>120);// The first frame after the task still carries the pre-task timeline time.
   const moved=gap>0?frames[gap-1].probe-frames[gap+1].probe:0;assert.ok(moved>20,`stream-long-task must keep gliding through a long host task (moved ${moved.toFixed(2)}px)`)}
  if(result.mode.startsWith('stream-')&&!['stream-echo-gap','stream-long-task'].includes(result.mode))assert.ok(result.drift<=1.5,result.mode+' replaced row must glide with its neighbour (seam drift '+result.drift.toFixed(2)+'px)');assert.equal(result.final.rows,0);assert.equal(result.final.draft,'');if(result.mode!=='native-reversal')assert.ok(Math.abs(result.frames.at(-1).top-result.frames.at(-1).floor)<.81)}
 // native-reversal ends where its own synthetic scroll writes leave it; it only
 // returned to the floor while the old height-animated collapse kept resizing.
 console.log('PASS 13 coordinated native follow / collapse / acknowledgement / overflow-boundary / native-reversal / stream-follow cases')
}finally{await browser.close()}
