import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(root,'../send-motion-jitter')
mkdirSync(out,{recursive:true})
function asarFile(name){const fd=openSync(process.env.DSH_ASAR,'r');try{const head=Buffer.alloc(16);readSync(fd,head,0,16,0);const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16);let entry=JSON.parse(json);for(const part of name.split('/'))entry=entry.files[part];const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset));return bytes.toString()}finally{closeSync(fd)}}
const conversation=asarFile('dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js'),chat=asarFile('dsh/node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js')
function sheet(name,prefix){const at=conversation.indexOf(name+'.module.css'),region=conversation.slice(conversation.lastIndexOf('//#region',at),conversation.indexOf('//#endregion',at)),css=JSON.parse(region.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)[1]),from=css.match(/\.([\w]+)_\w+\{/)[1];return css.replaceAll(from+'_',prefix+'_')}
const css=sheet('InputBar','ib')+sheet('ConversationRoot','cr'),start=chat.indexOf('var ScrollFollow = class ScrollFollow'),end=chat.indexOf('function useScrollFollow',start),native=chat.slice(start,chat.lastIndexOf('/**',end))+';window.NativeFollow=ScrollFollow;'
const client=readFileSync(process.env.DSH_MESSAGE_CLIENT||resolve(root,'client.js'),'utf8')
const scrollBuilt=(await build({entryPoints:[process.env.DSH_TAIL_SOURCE||resolve(root,'src/composer-scroll-motion.js')],bundle:true,write:false,format:'iife',globalName:'TailMotion'})).outputFiles[0].text
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:850},deviceScaleFactor:1.25}),results=[],errors=[]
page.on('pageerror',e=>errors.push(e.message))
try{
 for(const mode of ['single','multiline','late-commit','narrow-dark','short','overflow-boundary','image-overflow','image-boundary','native-reversal']){
  const collapse=true,tail=true,lines=['single','short','overflow-boundary'].includes(mode)?1:5,late=mode==='late-commit',narrow=mode==='narrow-dark',image=mode.startsWith('image-'),history=mode==='short'?2:mode==='overflow-boundary'?4:mode==='image-boundary'?3:15
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
   window.sample=label=>({label,time:performance.now(),top:scroller.scrollTop,floor:metrics().floor,probe:probe.getBoundingClientRect().top,cardTop:card.getBoundingClientRect().top,cardHeight:card.getBoundingClientRect().height})
   window.resize=new ResizeObserver(()=>{if(follow.active)follow.toBottom(scroller,metrics(),'instant');if(until)events.push(sample('resize'))});resize.observe(document.querySelector('[data-composer-seat]'));resize.observe(flow)
   scroller.addEventListener('scroll',()=>{follow.sample(metrics(),false);if(until)events.push(sample('scroll'))});scroller.scrollTop=scroller.scrollHeight
   if(collapse)window.submitMotion=plugin.__test.createComposerSubmitMotion(document,window)
   window.tailMotion=TailMotion.createComposerScrollMotion(document,window,tail)
   function commit(){editor.innerHTML='<p><br></p>';document.querySelector('#draft-image')?.remove();const sent=row();if(image)sent.style.height='300px';list.append(sent);follow.toBottom(scroller,metrics(),'instant');events.push(sample('native-commit'));if(mode==='native-reversal'){const floor=metrics().floor;[floor-18,floor-48,floor-24,floor-62,floor-40].forEach((target,index)=>setTimeout(()=>{scroller.scrollTop=target},index*34))}setTimeout(()=>{const old=list.lastElementChild;old.replaceWith(old.cloneNode(true));follow.toBottom(scroller,metrics(),'instant')},65)}
   function submit(){until=performance.now()+850;frames.push(sample('before'));if(late)requestAnimationFrame(commit);else commit();function step(){frames.push(sample('frame'));if(performance.now()<until)requestAnimationFrame(step)}requestAnimationFrame(step)}
   editor.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit()}})
  },{collapse,tail,lines,late,image,history,mode});await page.waitForTimeout(80);await page.getByRole('textbox',{name:'合成草稿'}).press('Enter');await page.waitForTimeout(950)
  const result=await page.evaluate(()=>({frames,events,final:{rows:document.querySelectorAll('[data-dcb-send-scroll-row]').length,range:scroller.scrollHeight,top:scroller.scrollTop,draft:editor.textContent}}));let reverse=0,lastSign=0;for(let i=1;i<result.frames.length;i++){const delta=result.frames[i].probe-result.frames[i-1].probe;if(Math.abs(delta)<=.8)continue;const sign=Math.sign(delta);if(lastSign&&sign!==lastSign)reverse++;lastSign=sign}
  results.push({mode,reverse,...result});console.log(JSON.stringify({mode,reverse,first:result.frames.slice(0,8).map(({probe,top,floor,cardHeight})=>({probe,top,floor,cardHeight}))}))
  if(narrow)await page.screenshot({path:resolve(out,'coordinated-dark-narrow.png')})
 }
 const report=resolve(out,process.env.DSH_TAIL_SOURCE?'coordination-before.json':'coordination-after.json')
 writeFileSync(report,JSON.stringify({results,errors},null,2))
 assert.deepEqual(errors,[])
 for(const result of results){if(result.mode!=='native-reversal')assert.equal(result.reverse,0,result.mode+' must not reverse the painted transcript during one send');assert.equal(result.final.rows,0);assert.equal(result.final.draft,'');assert.ok(Math.abs(result.frames.at(-1).top-result.frames.at(-1).floor)<.81)}
 console.log('PASS 9 coordinated native follow / collapse / acknowledgement / overflow-boundary / native-reversal cases')
}finally{await browser.close()}
