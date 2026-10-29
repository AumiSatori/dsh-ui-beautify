import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'../../outputs/sidebar-attention-qa'))
mkdirSync(output,{recursive:true})
const source=`import {createSidebarAttention,sidebarAttentionCss} from './src/sidebar-attention.js';
const style=document.createElement('style');style.textContent=sidebarAttentionCss;document.head.append(style);
function store(value){const listeners=new Set();return{getSnapshot:()=>value,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},set:next=>{value=next;for(const fn of listeners)fn()},size:()=>listeners.size}}
const rows={a:{id:'a',retainedBy:{mainView:1}},b:{id:'b'},c:{id:'c'},d:{id:'d'},e:{id:'e'},child:{id:'child',origin:'subagent',parentSessionId:'a'}};
const list=store({byId:rows}),status=store(new Map()),events=new Map(),remotes=new Map();let seq=0;
for(const id of Object.keys(rows))events.set(id,store({entries:[]}));
window.attention=createSidebarAttention(document,window);
const services={sessions:{list,binding:id=>({eventSource:events.get(id)})},uiSession:{sessionStatus:status},layout:{toggleSidebar(){window.fixture.expand()}},remote:{$on(name,fn){const handlers=remotes.get(name)||new Set();handlers.add(fn);remotes.set(name,handlers);return()=>handlers.delete(fn)}}};
window.fixture={set(id,value){const next=new Map(status.getSnapshot());next.set(id,{...next.get(id),...value});status.set(next)},event(id,type,data={}){const source=events.get(id);source.set({entries:[...source.getSnapshot().entries,{event:{type,data,seq:++seq}}]})},remote(name,id,value){for(const fn of remotes.get(name)||[])fn(id,value)},expand(){document.querySelector('.af_frame').setAttribute('data-sidebar-collapsed','false');document.querySelector('.dcb-sidebar-toggle-right').dataset.state='expanded'},collapse(){document.querySelector('.af_frame').setAttribute('data-sidebar-collapsed','true');document.querySelector('.dcb-sidebar-toggle-right').dataset.state='collapsed'},remove(id){const byId={...list.getSnapshot().byId};delete byId[id];list.set({byId})},size:()=>[list.size(),status.size(),...[...events.values()].map(s=>s.size()),...[...remotes.values()].map(s=>s.size)]};
const expand=fixture.expand,collapse=fixture.collapse;
fixture.motion=enabled=>{document.documentElement.toggleAttribute('data-fixture-motion',enabled);document.documentElement.toggleAttribute('data-windows-titlebar',enabled);document.querySelector('.af_frame').toggleAttribute('data-dcb-sidebar-frame-motion',enabled);document.querySelector('.dcb-sidebar-toggle-right').dataset.motion=String(enabled)};
fixture.expand=()=>{expand();document.querySelector('.dcb-sidebar-toggle-right').style.left='250px'};
fixture.collapse=()=>{collapse();document.querySelector('.dcb-sidebar-toggle-right').style.left='0px'};
attention.connect(services);`
const built=await build({stdin:{contents:source,resolveDir:project},bundle:true,write:false,format:'iife'})
const client=readFileSync(resolve(project,'client.js'),'utf8'),edgeStart=client.indexOf('      .dcb-sidebar-toggle-right {'),edgeEnd=client.indexOf('      [data-dcb-sidebar-toggle="true"]',edgeStart)
assert.ok(edgeStart>0&&edgeEnd>edgeStart)
const edgeCss=client.slice(edgeStart,edgeEnd).replace(/\$\{MOTION.time.\w+\}/g,'220').replace(/\$\{MOTION.ease.\w+\}/g,'cubic-bezier(.22,.8,.26,1)')
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#fafbfc;font:14px system-ui;color:#343740}body[data-ds-dark-theme]{background:#202126;color:#eee}.af_frame{height:100vh}.sb_sidebarCol{position:fixed;inset:0 auto 0 0;width:250px;background:#ddd}.af_frame[data-sidebar-collapsed=true] .sb_sidebarCol{width:0}main{padding:60px 180px}input{width:230px;padding:12px;border:1px solid #aaa;border-radius:9px}${edgeCss}</style><div class="af_frame" data-sidebar-collapsed="true"><div class="sb_sidebarCol"></div><button class="dcb-sidebar-toggle-right" style="left:0" data-dcb-sidebar-toggle-right data-state="collapsed" aria-label="展开侧栏" onclick="document.querySelector('.af_frame').getAttribute('data-sidebar-collapsed')==='true'?fixture.expand():fixture.collapse()"><span aria-hidden="true"></span></button><main><h2>对话工作区</h2><p>其他会话状态提醒</p><input aria-label="草稿" value="保留草稿与焦点"><div data-conversation-content data-conversation-session="a"></div></main></div><script src="/demo.js"></script>`
const drawerCss='<style>[data-fixture-motion] .sb_sidebarCol{transition:width 640ms linear}@media(prefers-reduced-motion:reduce),(forced-colors:active){[data-fixture-motion] .sb_sidebarCol{transition:none}}</style>'
const server=createServer((req,res)=>res.writeHead(200,{'Content-Type':req.url==='/demo.js'?'text/javascript':'text/html; charset=utf-8'}).end(req.url==='/demo.js'?built.outputFiles[0].text:html.replace('<div class="af_frame"',drawerCss+'<div class="af_frame"')))
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),page=await browser.newPage({viewport:{width:1000,height:760}}),errors=[],checks=[]
page.on('pageerror',error=>errors.push(error.message))
const root=()=>page.locator('.dcb-sidebar-attention'),icon=kind=>page.locator('.dcb-attention-button[data-kind='+kind+']')
const settle=async()=>{await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));await page.waitForFunction(()=>!document.getAnimations().some(a=>a.id.startsWith('dcb-attention-')))}
const set=async(id,value)=>{await page.evaluate(({id,value})=>fixture.set(id,value),{id,value});await page.waitForTimeout(35)}
const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS '+name)}
async function shot(name){await page.screenshot({path:resolve(output,name+'.png')})}
async function sample(){await page.evaluate(()=>{window.drawerSamples=[];window.sampleDrawer=true;const take=()=>{if(!window.sampleDrawer)return;attention.sync();const root=document.querySelector('.dcb-sidebar-attention'),exit=root?.getAnimations().find(a=>a.id==='dcb-attention-out');window.drawerSamples.push({time:performance.now(),width:document.querySelector('.sb_sidebarCol').getBoundingClientRect().width,left:root?.getBoundingClientRect().left??null,opacity:root?+getComputedStyle(root).opacity:0,exit:exit?.currentTime??null,collapsed:document.querySelector('.af_frame').getAttribute('data-sidebar-collapsed')==='true'});requestAnimationFrame(take)};take()})}
async function samples(name){const values=await page.evaluate(()=>{window.sampleDrawer=false;return window.drawerSamples});writeFileSync(resolve(output,name+'.json'),JSON.stringify(values,null,2));return values}
try{
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.fixture)
 await check('old idle, current-window and subagent statuses stay silent',async()=>{
  await set('b',{running:false});await set('a',{completionUnread:true,pendingInteraction:{id:'self'}});await set('child',{completionUnread:true});assert.equal(await root().count(),0)
 })
 await check('the edge arrow is always visible and reverses direction with a rendered transition',async()=>{
  const edge=page.locator('.dcb-sidebar-toggle-right'),span=edge.locator('span'),read=()=>span.evaluate(n=>{const s=getComputedStyle(n,'::before');return{transform:s.transform,opacity:s.opacity,width:getComputedStyle(n).width}})
  const collapsed=await read();assert.equal(collapsed.opacity,'1');assert.equal(collapsed.width,'18px')
  await edge.click();await page.waitForTimeout(70);const middle=await read();await page.waitForTimeout(240);const expanded=await read();assert.notEqual(collapsed.transform,expanded.transform);assert.notEqual(middle.transform,collapsed.transform);assert.notEqual(middle.transform,expanded.transform)
  await edge.press('Enter');await page.mouse.move(300,50);await page.waitForTimeout(280);assert.equal((await read()).transform,collapsed.transform)
 })
 await check('a new alert waits for the rendered drawer to fully collapse before entering at the screen edge',async()=>{
  await page.evaluate(()=>{fixture.motion(true);fixture.expand()});await page.waitForTimeout(700)
  await sample();await page.evaluate(()=>{fixture.collapse();fixture.set('c',{pendingInteraction:{key:'closing-question'}})});await page.waitForTimeout(990)
  const values=await samples('closing-frames'),moving=values.filter(v=>v.collapsed&&v.width>1)
  assert.ok(moving.length>12);assert.ok(moving.every(v=>v.left===null),'no popup is rendered at an intermediate drawer position')
  const shown=values.filter(v=>v.left!==null);assert.ok(shown.length>3);assert.ok(shown.every(v=>v.width<=1&&v.left<=28));await shot('after-collapse')
 })
 await check('opening fades the alert from its collapsed position once, despite per-frame host refreshes',async()=>{
  await sample();await page.evaluate(()=>fixture.expand());await page.waitForTimeout(700)
  const values=await samples('opening-frames'),shown=values.filter(v=>v.opacity>.01)
  assert.ok(shown.length>2);assert.ok(shown.every(v=>v.left<=28),'the exiting popup never follows the opening drawer into the transcript')
  const exits=values.filter(v=>v.exit!==null);assert.ok(exits.length>2);assert.ok(exits.slice(1).every((v,i)=>v.exit>=exits[i].exit),'refreshes do not restart the exit')
  assert.equal(await root().count(),0);await shot('opening-without-popup')
 })
 await check('rapid collapse/open reversals cancel stale arrivals, and the final collapse alone can show a new alert',async()=>{
  await sample();await page.evaluate(()=>{fixture.collapse();fixture.set('c',{pendingInteraction:{key:'reverse-1'}})});await page.waitForTimeout(120)
  await page.evaluate(()=>fixture.expand());await page.waitForTimeout(80)
  await page.evaluate(()=>{fixture.collapse();fixture.set('c',{pendingInteraction:{key:'reverse-2'}})});await page.waitForTimeout(100)
  await page.evaluate(()=>fixture.expand());await page.waitForTimeout(700)
  assert.ok((await samples('reversal-frames')).every(v=>v.left===null));assert.equal(await root().count(),0)
  await page.evaluate(()=>{fixture.collapse();fixture.set('c',{pendingInteraction:{key:'final-collapse'}})});await page.waitForTimeout(990);assert.equal(await icon('waiting').count(),1)
  await page.evaluate(()=>fixture.expand());await page.waitForTimeout(700);await page.evaluate(()=>{fixture.set('c',{pendingInteraction:null});fixture.motion(false);fixture.collapse()});await settle();assert.equal(await root().count(),0)
 })
 await check('completion animates in with a drawn green check and keeps the input focus',async()=>{
  await page.getByRole('textbox').focus();await set('b',{running:true})
  // Freeze the frame in the same browser task that creates the animation;
  // a protocol round trip can otherwise outlast the complete 260ms entrance.
  const frame=await page.evaluate(()=>{fixture.set('b',{running:false,completionUnread:true});attention.sync();const a=document.getAnimations().find(a=>a.id==='dcb-attention-in');a.pause();a.currentTime=110;const c=getComputedStyle(document.querySelector('.dcb-sidebar-attention'));return{opacity:+c.opacity,filter:c.filter,transform:c.transform}})
  assert.ok(frame.opacity>0&&frame.opacity<1);assert.notEqual(frame.filter,'blur(0px)');assert.notEqual(frame.transform,'none');await shot('entry-middle')
  await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-attention-')).forEach(a=>a.finish()));await settle()
  assert.equal(await icon('done').locator('svg path').count(),1);assert.equal(await page.getByRole('textbox').evaluate(n=>document.activeElement===n),true)
  const path=icon('done').locator('path'),positions=[];for(const time of [0,700])positions.push(await path.evaluate((n,time)=>{const a=n.getAnimations()[0];a.pause();a.currentTime=time;return getComputedStyle(n).strokeDashoffset},time));assert.notEqual(...positions);await shot('done-light')
 })
 await check('click fades and blurs out, opens the sidebar, and acknowledges that occurrence',async()=>{
  const middle=await icon('done').evaluate(node=>{node.click();attention.sync();const a=document.getAnimations().find(a=>a.id==='dcb-attention-out');a.pause();a.currentTime=120;const c=getComputedStyle(document.querySelector('.dcb-sidebar-attention'));return{opacity:+c.opacity,filter:c.filter}});assert.ok(middle.opacity>0&&middle.opacity<1);assert.notEqual(middle.filter,'blur(0px)')
  assert.equal(await page.locator('.af_frame').getAttribute('data-sidebar-collapsed'),'false')
  await page.evaluate(()=>document.getAnimations().find(a=>a.id==='dcb-attention-out').finish());await settle();assert.equal(await root().count(),0)
  await page.evaluate(()=>fixture.collapse());await page.waitForTimeout(70);assert.equal(await root().count(),0)
 })
 await check('waiting circles cycle through one, two, three visible dots',async()=>{
  await set('c',{pendingInteraction:{id:'question-1'}});await settle()
  const visible=[];for(const time of [150,700,1200])visible.push(await icon('waiting').evaluate((node,time)=>[...node.querySelectorAll('circle')].filter(circle=>{const a=circle.getAnimations()[0];a.pause();a.currentTime=time;return +getComputedStyle(circle).opacity>.5}).length,time))
  assert.deepEqual(visible,[1,2,3]);await shot('waiting-light')
 })
 await check('failure uses the root error event without reading or displaying its message',async()=>{
  await page.evaluate(()=>fixture.remote('api-session/error','d','synthetic-private-message'));await set('d',{running:false,completionUnread:true});await settle();assert.equal(await icon('error').count(),1);assert.equal(await page.getByText('synthetic-private-message').count(),0)
  const frames=[];for(const time of [0,80])frames.push(await icon('error').locator('.dcb-attention-alert').evaluate((n,time)=>{const a=n.getAnimations()[0];a.pause();a.currentTime=time;return getComputedStyle(n).transform},time));assert.notEqual(...frames)
 })
 await check('three statuses share a compact bubble with counts and dark-theme contrast',async()=>{
  await set('b',{running:true,completionUnread:false});await set('b',{running:false,completionUnread:true});await set('e',{pendingInteraction:{id:'question-2'}});await settle()
  assert.equal(await icon('waiting').locator('.dcb-attention-count').innerText(),'2');assert.equal(await root().locator('svg').count(),3);assert.equal(await root().locator('select,input').count(),0)
  const box=await root().boundingBox();assert.ok(box.width<=140&&box.height<=50);await shot('all-light')
  await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await shot('all-dark')
  await page.setViewportSize({width:390,height:720});const small=await root().boundingBox();assert.ok(small.x>=0&&small.x+small.width<=390);await shot('all-narrow')
 })
 await check('individual statuses collapse their width during removal without a jump',async()=>{
  await set('d',{running:true,completionUnread:false});const width=await page.evaluate(()=>{const a=document.getAnimations().find(a=>a.id==='dcb-attention-cell-out');a.pause();a.currentTime=100;return document.querySelector('.dcb-attention-button[data-kind=error]').parentElement.getBoundingClientRect().width});assert.ok(width>0&&width<40)
  await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-attention-')).forEach(a=>a.finish()));await settle();assert.equal(await icon('error').count(),0)
 })
 await check('manual expansion dismisses all existing alerts; only a new request returns',async()=>{
  await page.evaluate(()=>fixture.expand());await settle();assert.equal(await root().count(),0);await page.evaluate(()=>fixture.collapse());await page.waitForTimeout(50);assert.equal(await root().count(),0)
  await set('c',{pendingInteraction:{id:'question-1'}});await settle();assert.equal(await root().count(),0)
  await set('c',{pendingInteraction:null});await set('c',{pendingInteraction:{id:'question-3'}});await settle();assert.equal(await icon('waiting').count(),1)
 })
 await check('cancelled runs do not show success, and event tails distinguish failed endings',async()=>{
  await set('b',{running:true,completionUnread:false});await page.evaluate(()=>fixture.event('b','turn/end',{reason:'cancelled'}));await set('b',{running:false,completionUnread:true});await settle();assert.equal(await icon('done').count(),0)
  await set('b',{running:true,completionUnread:false});await page.evaluate(()=>{fixture.event('b','turn/end',{reason:'error'});fixture.event('b','telemetry/end',{})});await set('b',{running:false,completionUnread:true});await settle();assert.equal(await icon('error').count(),1)
 })
 await check('new runs clear errors; reduced motion, forced colors and disabling clean up',async()=>{
  await set('b',{running:true,completionUnread:false});await settle();assert.equal(await icon('error').count(),0)
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(35);assert.equal(await root().evaluate(n=>n.getAnimations({subtree:true}).length),0)
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await shot('forced-colors');await page.evaluate(()=>attention.sync(false));assert.equal(await root().count(),0)
  await page.evaluate(()=>attention.sync(true));await page.waitForTimeout(35);assert.equal(await root().count(),0)
  await set('e',{pendingInteraction:{id:'question-4'}});assert.equal(await icon('waiting').count(),1)
  await page.evaluate(()=>attention.dispose());assert.equal(await root().count(),0);assert.ok((await page.evaluate(()=>fixture.size())).every(n=>n===0));assert.equal(await page.getByRole('textbox').inputValue(),'保留草稿与焦点')
 })
 assert.deepEqual(errors,[]);writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
