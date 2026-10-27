import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url)),archive=process.env.DSH_ASAR
assert.ok(archive,'Set DSH_ASAR to the installed host')
const asar=readFileSync(archive),tree=JSON.parse(asar.subarray(16,16+asar.readUInt32LE(12)).toString())
let entry=tree;for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js'.split('/'))entry=entry.files[part]
const host=asar.subarray(8+asar.readUInt32LE(4)+Number(entry.offset),8+asar.readUInt32LE(4)+Number(entry.offset)+entry.size).toString()
for(const marker of ['"data-step-process": true','"data-step-process-body": true','"data-process-activity": activity','"aria-controls": bodyId','element.setAttribute("hidden", "until-found")'])assert.ok(host.includes(marker),`installed host has ${marker}`)
const start=host.indexOf('const css$15 = '),end=host.indexOf(';\n',start),nativeCss=JSON.parse(host.slice(start+'const css$15 = '.length,end))
const groupClass=host.match(/"root": "(\w+_root)",\s*"title": "\w+_title"\s*\};\s*\/\/#endregion\s*\/\/#region lib\/types\/client\/chat\/ChatGroupSeat.js/)
assert.ok(groupClass,'Find installed process CSS module')
const prefix=groupClass[1].replace(/_root$/,'')
const fixture=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{flushSync}from'react-dom';
function App(){const [open,setOpen]=React.useState(false),body=React.useRef(null);React.useLayoutEffect(()=>{if(open)body.current.removeAttribute('hidden');else body.current.setAttribute('hidden','until-found')},[open]);return <><div data-step-process data-chat-group-key="group" className="${prefix}_root"><div><button data-process-activity="thinking" aria-expanded={open} aria-controls="body" className="${prefix}_title" onClick={()=>setOpen(x=>!x)}>正在分析请求</button></div><div ref={body} id="body" className="${prefix}_body" data-step-process-body><div data-step-process-content data-chat-flow className="${prefix}_content"><div>正在思考和检查现有实现。</div><div>读取文件并检查执行结果。</div><div>验证动效中间帧。</div></div></div></div><div id="after">下面的对话</div></>};
flushSync(()=>createRoot(document.querySelector('#mount')).render(<App/>));`,loader:'jsx',resolveDir:project},bundle:true,write:false,format:'iife'})
const feature=await build({entryPoints:[resolve(project,'src/process-disclosure-motion.js')],bundle:true,write:false,format:'iife',globalName:'ProcessMotion'})
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1000,height:800}})
const tick=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))
const finish=async()=>{await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.id.startsWith('dcb-process-')).map(a=>a.finished.catch(()=>{}))));await tick()}
try{
 await page.setContent(`<style>${nativeCss} body{font:16px/26px system-ui}main{margin:40px;width:640px}[data-step-process-content]>div{padding:10px}#after{margin-top:12px}</style><main data-conversation-session="test"><div data-chat-flow><div id="mount"></div></div></main>`)
 await page.addScriptTag({content:fixture.outputFiles[0].text});await page.addScriptTag({content:feature.outputFiles[0].text});await page.evaluate(()=>window.controller=ProcessMotion.createProcessDisclosureMotion(document,window));await tick()
 const button=page.getByRole('button',{name:'正在分析请求'}),root=page.locator('[data-step-process]')
 const closed=await root.evaluate(el=>el.getBoundingClientRect().height),afterClosed=await page.locator('#after').evaluate(el=>el.getBoundingClientRect().top)
 await button.click();await tick();const opening=await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id.startsWith('dcb-process-')){a.pause();a.currentTime=70}const root=document.querySelector('[data-step-process]'),body=root.querySelector('[data-step-process-body]');return{height:root.getBoundingClientRect().height,natural:root.scrollHeight,opacity:Number(getComputedStyle(body).opacity),filter:getComputedStyle(body).filter,after:document.querySelector('#after').getBoundingClientRect().top}})
 assert.ok(opening.height>closed&&opening.height<opening.natural);assert.ok(opening.opacity>0&&opening.opacity<1);assert.match(opening.filter,/blur/);assert.ok(opening.after>afterClosed)
 await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));await finish()
 const expanded=await root.evaluate(el=>el.getBoundingClientRect().height)
 await button.click();await tick();const closing=await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id.startsWith('dcb-process-')){a.pause();a.currentTime=70}const root=document.querySelector('[data-step-process]'),ghost=root.querySelector('[data-dcb-process-ghost]');return{height:root.getBoundingClientRect().height,ghost:!!ghost,inert:ghost?.inert,opacity:ghost&&Number(getComputedStyle(ghost).opacity)}})
 assert.ok(closing.height>closed&&closing.height<expanded);assert.equal(closing.ghost,true);assert.equal(closing.inert,true);assert.ok(closing.opacity>0&&closing.opacity<1)
 await button.click();await tick();assert.equal(await button.getAttribute('aria-expanded'),'true');assert.ok(await page.locator('[data-dcb-process-ghost]').count()<=1)
 await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));await finish();assert.equal(await page.locator('[data-dcb-process-motion],[data-dcb-process-ghost]').count(),0)
 await page.evaluate(()=>window.controller.setEnabled(false));await button.click();await tick();assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-process-')).length),0)
 await page.evaluate(()=>window.controller.setEnabled(true));await button.focus();await page.keyboard.press('Enter');await tick();assert.ok(await page.evaluate(()=>document.getAnimations().some(a=>a.id==='dcb-process-height')))
 await page.locator('[data-step-process-content]').evaluate(node=>{const row=document.createElement('div');row.textContent='新的流式内容';node.append(row)});await tick();await tick();assert.equal(await page.locator('[data-dcb-process-motion]').count(),0)
 await page.emulateMedia({reducedMotion:'reduce'});await button.click();await tick();assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-process-')).length),0)
 await page.emulateMedia({reducedMotion:'no-preference'});await button.click();await tick();await finish()
 await button.evaluate(node=>node.addEventListener('click',()=>document.querySelector('[data-step-process-body]').setAttribute('data-chat-motion','collapse'),{once:true}));await button.click();await tick();assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-process-')).length),0)
 await page.evaluate(()=>window.controller.dispose());console.log('PASS installed process markers: opening, closing, intermediate height, following content, reversal and switch')
}finally{await browser.close()}
