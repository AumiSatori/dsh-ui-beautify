import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve,dirname,basename} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url)),workspace=resolve(project,basename(dirname(resolve(project)))==='.scratch'?'../..':'..')
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(workspace,'.scratch/summary-status-qa'),'entry')
mkdirSync(output,{recursive:true})
const original=readFileSync(resolve(project,'test/fixture.jsx'),'utf8'),sessionHook='useSession={selector => selector({ running })}'
assert.ok(original.includes(sessionHook))
const fixture=original.replace(sessionHook,'useSession={selector => selector({ running, blank: window.fixtureBlank ?? true })} useSessionStatus={() => { throw Error("Entry must not subscribe to session-status") }}')
const built=await build({stdin:{contents:fixture,loader:'jsx',resolveDir:resolve(project,'test')},bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',built.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),page=await browser.newPage({viewport:{width:1240,height:800}}),errors=[]
page.on('pageerror',error=>errors.push(error.message))
const entry=()=>page.locator('.dcb-entry'),label=()=>entry().locator('.dcb-entry-label-text:not(.dcb-entry-label-ghost)')
const idle=()=>page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))
async function patch(value){await page.evaluate(value=>{const key='dsh-ui-beautify:settings:v1',next=JSON.stringify({...JSON.parse(localStorage.getItem(key)||'{}'),...value});localStorage.setItem(key,next);dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},value);await idle()}
let seq=0,passed=0
const event=(type,data)=>({event:{type,data,seq:++seq}})
async function show({events=[],running=false,plan=[],blank=false}={}){await page.evaluate(({events,running,plan,blank})=>{window.fixtureBlank=blank;window.fixture.records(events);window.fixture.update(plan);window.fixture.running(running);window.fixture.refresh()},{events,running,plan,blank});await idle()}
async function expectLabel(expected){await idle();assert.equal(await label().innerText(),expected)}
async function check(name,run){await run();passed++;console.log('PASS '+name)}
try{
 await page.goto(url)
 await page.getByTestId('todo-panel').waitFor()
 await page.evaluate(()=>{window.cleanups=[];window.__ModuleLoader__={load(spec){window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:({className})=>window.fixtureReact.createElement('span',{className,'aria-hidden':true},'◈')}:window.fixtureReact)}}})
 await page.addScriptTag({url:url+'/client.js'})
 await page.evaluate(()=>{
  const ctx={slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}}
  window.plugin.apply(ctx);window.fixture.refresh()
 })
 await entry().waitFor();await idle()
 await check('empty, running and nonblank stopped sessions expose only the requested three labels',async()=>{
  await show({blank:true});await expectLabel('空闲')
  await patch({summaryScope:'all'});await expectLabel('空闲');await patch({summaryScope:'turn'})
  await show({running:true});await expectLabel('处理中')
  await show();await expectLabel('查看成果')
 })
 await check('plans, tool calls, failures and historical scope do not add an entry state',async()=>{
  const plan=[{content:'合成任务',status:'in_progress'}]
  for(const type of ['tool/call','tool/result','turn/end']){
   await show({running:true,plan,events:[event(type,{turn:1,callId:'a',name:'exec_command',reason:'error',arguments:'{}'})]});await expectLabel('处理中')
  }
  await show({events:[event('turn/start',{turn:2}),event('turn/end',{turn:2,reason:'interrupted'})]});await expectLabel('查看成果')
  await patch({summaryScope:'all'});await expectLabel('查看成果');await patch({summaryScope:'turn'})
 })
 await check('CSS motion renders an intermediate frame without width measurement or animation controllers',async()=>{
  await show({blank:true})
  const sample=await page.evaluate(async()=>{
   const host=document.querySelector('.dcb-entry-label'),width=host.getBoundingClientRect().width;let scans=0
   const original=host.getBoundingClientRect.bind(host);host.getBoundingClientRect=()=>{scans++;return original()}
   const paused=document.createElement('style');paused.textContent='.dcb-entry-label-text{animation-play-state:paused!important}';document.head.append(paused)
   window.fixture.running(true)
   for(let i=0;i<20&&host.querySelector('.dcb-entry-label-text')?.textContent!=='处理中';i++)await new Promise(done=>requestAnimationFrame(done))
   const text=host.querySelector('.dcb-entry-label-text'),animation=text.getAnimations().find(a=>a.animationName==='dcb-entry-label-enter')
   if(!animation)throw Error('No entry CSS transition');animation.pause();animation.currentTime=110
   const s=getComputedStyle(text),result={opacity:Number(s.opacity),transform:s.transform,filter:s.filter,width:original().width,before:width,scans,ghosts:host.querySelectorAll('.dcb-entry-label-ghost').length,inline:host.style.width}
   animation.finish();paused.remove();return result
  })
  assert.ok(sample.opacity>0&&sample.opacity<1);assert.notEqual(sample.transform,'none');assert.match(sample.filter,/blur/);assert.equal(sample.width,sample.before);assert.equal(sample.scans,0);assert.equal(sample.ghosts,0);assert.equal(sample.inline,'')
  writeFileSync(resolve(output,'intermediate-frames.json'),JSON.stringify(sample,null,2))
 })
 await check('unchanged labels neither replay motion nor steal focus during repeated refresh',async()=>{
  await show({running:true});await entry().focus()
  const result=await page.evaluate(async()=>{
   const button=document.querySelector('.dcb-entry'),text=button.querySelector('.dcb-entry-label-text');let scans=0
   const original=button.getBoundingClientRect.bind(button);button.getBoundingClientRect=()=>{scans++;return original()}
   for(let i=0;i<20;i++){window.fixture.refresh();await new Promise(done=>requestAnimationFrame(done))}
   return{scans,same:button===document.querySelector('.dcb-entry'),sameText:text===button.querySelector('.dcb-entry-label-text'),focused:document.activeElement===button,animations:text.getAnimations().length}
  });assert.deepEqual(result,{scans:0,same:true,sameText:true,focused:true,animations:0})
 })
 await check('rapid changes settle to the host state with no ghost layers or queued effects',async()=>{
  await page.evaluate(async()=>{for(let i=0;i<14;i++){window.fixture.running(i%2===0);await new Promise(done=>setTimeout(done,16))}window.fixture.running(false);window.fixtureBlank=false;window.fixture.refresh()});await idle();await expectLabel('查看成果')
  assert.equal(await entry().locator('.dcb-entry-label-ghost').count(),0)
  assert.equal(await entry().evaluate(el=>el.getAnimations({subtree:true}).length),0)
 })
 await check('narrow dark and accessibility modes retain readable static text and disposal removes its effects',async()=>{
  await page.setViewportSize({width:520,height:800});await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await show({running:true});await expectLabel('处理中')
  const bounds=await entry().boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=520)
  await page.locator('main > header').screenshot({path:resolve(output,'narrow-dark-processing.png')})
  for(const options of [{reducedMotion:'reduce',forcedColors:'none'},{reducedMotion:'no-preference',forcedColors:'active'}]){await page.emulateMedia(options);await show({blank:true});await expectLabel('空闲');assert.equal(await entry().evaluate(el=>el.getAnimations({subtree:true}).length),0)}
  await page.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'});await page.evaluate(()=>{window.fixture.running(true);for(const cleanup of window.cleanups.reverse())cleanup?.()});await idle();assert.equal(await entry().locator('.dcb-entry-label-ghost').count(),0)
 })
 assert.deepEqual(errors,[])
 writeFileSync(resolve(output,'verification.json'),JSON.stringify({passed,errors},null,2))
 console.log(`${passed} summary entry browser groups passed`)
}finally{await browser.close();await new Promise(done=>server.close(done))}
