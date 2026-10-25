import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../.scratch/desktop-underlay-jitter'),'composer-placement')
mkdirSync(out,{recursive:true})
assert.ok(process.env.DSH_ASAR,'Set DSH_ASAR to verify the installed native layout')
const fd=openSync(process.env.DSH_ASAR,'r');let host
try{const head=Buffer.alloc(16);readSync(fd,head,0,16,0);const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16);let entry=JSON.parse(json);for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js'.split('/'))entry=entry.files[part];const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset));host=bytes.toString()}finally{closeSync(fd)}
function sheet(name,prefix){const at=host.indexOf(name+'.module.css'),region=host.slice(host.lastIndexOf('//#region',at),host.indexOf('//#endregion',at)),literal=region.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/);assert.ok(literal,'Installed '+name+' CSS');const css=JSON.parse(literal[1]),original=css.match(/\.([\w]+)_\w+\{/)[1];return css.replaceAll(original+'_',prefix+'_')}
const css=sheet('ConversationRoot','cr')+sheet('InputBar','ib'),built=(await build({entryPoints:[resolve(root,'src/composer-placement-motion.js')],bundle:true,write:false,format:'iife',globalName:'Placement'})).outputFiles[0].text
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1400,height:900},deviceScaleFactor:1.25}),errors=[];let passed=0
page.on('pageerror',e=>errors.push(e.message))
const tick=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))
const check=async(name,run)=>{await run();passed++;console.log('PASS '+name)}
async function boot({dark=false,narrow=false,phase='hero',quiet=false,disabled=false}={}){
 await page.goto('about:blank');await page.setViewportSize(narrow?{width:430,height:900}:{width:1400,height:900});await page.emulateMedia({reducedMotion:quiet?'reduce':'no-preference',forcedColors:'none'})
 await page.setContent(`<!doctype html><style>${css}:root{--dsw-alias-bg-base:#f7f8fc;--dsw-alias-label-primary:#252733;--dsw-alias-label-secondary:#737786}*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:14px/22px system-ui}body.dark{--dsw-alias-bg-base:#15171d;--dsw-alias-label-primary:#e1e5ef}main{height:900px;display:flex;flex-direction:column}.cr_viewArea{padding:20px 28px}.headline{text-align:center;font-size:24px;padding:16px}.workspace{text-align:center;padding:4px}[data-composer-card]{width:100%;max-width:var(--dsh-composer-card-max-width);height:124px;padding:18px;margin:0 auto 8px;border:1px solid #8791aa55;border-radius:24px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 90%,white);box-shadow:0 6px 22px #17253a10}[data-composer-input]{min-height:42px;outline:0}.tools{display:flex;justify-content:space-between;align-items:center}button{border:0;padding:8px 14px;border-radius:16px;background:#8293c7;color:white;font:inherit}</style><body class="${dark?'dark':''}"><main><div class="cr_body cr_embeddedBody" data-conversation-content data-conversation-session="synthetic" data-content-phase="${phase}"><div class="cr_scrollBody" data-conversation-scroll><section class="cr_viewArea" ${phase==='hero'?'hidden':''}>合成的第一条消息</section><footer class="cr_composerSeat" data-composer-seat><div class="cr_composerStack ${phase==='hero'?'cr_composerHero':''}">${phase==='hero'?'<div class="headline">从一个想法开始</div><div class="workspace">测试工作区</div>':''}<div data-composer-card><div contenteditable="true" data-composer-input role="textbox" aria-label="合成输入">合成首条消息</div><div class="tools"><span>＋　模型与权限</span><button aria-label="发送消息" ${disabled?'disabled':''}>↑</button></div></div></div></footer></div></div></main></body>`)
 await page.addScriptTag({content:built})
 await page.evaluate(()=>{
  window.owner=document.querySelector('[data-conversation-content]');window.card=owner.querySelector('[data-composer-card]');window.editor=owner.querySelector('[data-composer-input]');window.scroller=owner.querySelector('[data-conversation-scroll]');window.before=card.getBoundingClientRect().toJSON();window.writes=0;window.rafCalls=0;window.freeze=false
  const scroll=Object.getOwnPropertyDescriptor(Element.prototype,'scrollTop');Object.defineProperty(scroller,'scrollTop',{configurable:true,get(){return scroll.get.call(this)},set(v){writes++;scroll.set.call(this,v)}})
  const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>{rafCalls++;return raf(fn)}
  const animate=Element.prototype.animate;Element.prototype.animate=function(frames,options){const a=animate.call(this,frames,options);if(freeze)a.pause();return a}
  window.manager=Placement.createComposerPlacementMotion(document,window)
  window.commit=({replace=false,settling=false}={})=>{if(settling){owner.dataset.contentPhase='settling';return}if(replace){const copy=card.cloneNode(true);card.replaceWith(copy);card=copy;editor=card.querySelector('[data-composer-input]')}editor.textContent='';owner.querySelector('.cr_viewArea').hidden=false;owner.querySelector('.cr_composerStack').classList.remove('cr_composerHero');owner.querySelectorAll('.headline,.workspace').forEach(n=>n.remove());owner.dataset.contentPhase='active';window.destination=card.getBoundingClientRect().toJSON()}
  window.submit=true;window.replaceCard=false;editor.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(submit)commit({replace:replaceCard})}});owner.querySelector('button').addEventListener('click',()=>{if(submit)commit()})
 });await tick()
}
try{
 await check('first send crosses a real middle frame in both themes and narrow layout',async()=>{
  for(const dark of [false,true])for(const narrow of [false,true]){
   await boot({dark,narrow});await page.evaluate(()=>freeze=true);await page.getByRole('textbox',{name:'合成输入'}).press('Enter')
   const result=await page.evaluate(()=>{const a=card.getAnimations().find(a=>a.id==='dcb-composer-placement');if(!a)return{missing:true};a.currentTime=0;const start=card.getBoundingClientRect().toJSON();a.currentTime=90;return{start,before,destination,middle:card.getBoundingClientRect().toJSON(),writes,range:scroller.scrollHeight,focus:document.activeElement===editor}})
   assert.ok(!result.missing);assert.ok(result.destination.y>result.before.y+80);assert.ok(Math.abs(result.start.y-result.before.y)<1);assert.ok(result.middle.y>result.before.y&&result.middle.y<result.destination.y);assert.equal(result.writes,0);assert.equal(result.focus,true)
   await page.screenshot({path:resolve(out,`first-send-${dark?'dark':'light'}-${narrow?'narrow':'wide'}-middle.png`)})
   await page.evaluate(()=>card.getAnimations().forEach(a=>a.finish()));await tick();assert.equal(await page.locator('[data-dcb-composer-placement]').count(),0)
  }
 })
 await check('click submission and a remounted native card use the same bridge',async()=>{
  for(const replace of [false,true]){await boot();await page.evaluate(replace=>{freeze=true;replaceCard=replace},replace);if(replace)await page.getByRole('textbox',{name:'合成输入'}).press('Enter');else await page.getByRole('button',{name:'发送消息'}).click();assert.equal(await page.locator('[data-dcb-composer-placement]').count(),1);await page.evaluate(()=>manager.dispose())}
 })
 await check('settling phase waits for the host to show its final card',async()=>{
  await boot();await page.evaluate(()=>{submit=false;freeze=true});await page.getByRole('textbox',{name:'合成输入'}).press('Enter');await page.evaluate(()=>commit({settling:true}));await tick();assert.equal(await page.locator('[data-dcb-composer-placement]').count(),0);await page.evaluate(()=>commit());await tick();assert.equal(await page.locator('[data-dcb-composer-placement]').count(),1)
 })
 await check('rejected Enter, line breaks, IME and existing conversations do not move',async()=>{
  for(const mode of ['reject','shift','ime','active']){await boot({phase:mode==='active'?'active':'hero'});if(mode==='reject')await page.evaluate(()=>submit=false);if(mode==='ime')await page.evaluate(()=>{submit=false;editor.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true}))});else await page.getByRole('textbox',{name:'合成输入'}).press(mode==='shift'?'Shift+Enter':'Enter');await tick();assert.equal(await page.locator('[data-dcb-composer-placement]').count(),0,mode);await page.evaluate(()=>manager.dispose())}
 })
 await check('quiet preferences preserve native layout with no animation',async()=>{
  for(const forced of [false,true]){await boot({quiet:!forced});if(forced)await page.emulateMedia({forcedColors:'active'});await page.getByRole('textbox',{name:'合成输入'}).press('Enter');await tick();assert.equal(await page.locator('[data-dcb-composer-placement]').count(),0)}
 })
 await check('navigation, typing, resize and disposal clean up immediately',async()=>{
  for(const mode of ['session','hero','typing','resize','dispose']){await boot();await page.evaluate(()=>freeze=true);await page.getByRole('textbox',{name:'合成输入'}).press('Enter');assert.equal(await page.locator('[data-dcb-composer-placement]').count(),1);await page.evaluate(mode=>{if(mode==='session')owner.dataset.conversationSession='other';if(mode==='hero')owner.dataset.contentPhase='hero';if(mode==='typing')editor.dispatchEvent(new InputEvent('beforeinput',{bubbles:true}));if(mode==='resize')window.dispatchEvent(new Event('resize'));if(mode==='dispose')manager.dispose()},mode);await tick();assert.equal(await page.locator('[data-dcb-composer-placement]').count(),0,mode)}
 })
 await check('completion keeps scroll geometry and styles intact, without an idle frame loop',async()=>{
  await boot();const original=await page.locator('[data-composer-card]').getAttribute('style');await page.getByRole('textbox',{name:'合成输入'}).press('Enter');const result=await page.evaluate(async()=>{const heights=[];for(const until=performance.now()+400;performance.now()<until;){await new Promise(requestAnimationFrame);heights.push(scroller.scrollHeight)}return{heights,writes,marked:card.hasAttribute('data-dcb-composer-placement')}});assert.equal(new Set(result.heights).size,1);assert.equal(result.writes,0);assert.equal(result.marked,false);assert.equal(await page.locator('[data-composer-card]').getAttribute('style'),original);const calls=await page.evaluate(()=>rafCalls);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>rafCalls),calls)
 })
 assert.deepEqual(errors,[]);writeFileSync(resolve(out,'result.json'),JSON.stringify({passed,errors,source:'Installed ConversationRoot/InputBar CSS; synthetic native hero-to-active commits, DPR 1.25'},null,2));console.log(JSON.stringify({passed,out}))
}finally{await browser.close()}
