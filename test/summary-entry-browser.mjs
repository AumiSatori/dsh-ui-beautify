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
const fixture=original.replace(sessionHook,sessionHook+' useSessionStatus={selector => selector(new Map([[session, {pendingInteraction: window.fixturePending || undefined}]]))}')
const built=await build({stdin:{contents:fixture,loader:'jsx',resolveDir:resolve(project,'test')},bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',built.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),page=await browser.newPage({viewport:{width:1240,height:800}}),errors=[]
page.on('pageerror',error=>errors.push(error.message))
const entry=()=>page.locator('.dcb-entry'),label=()=>entry().locator('.dcb-entry-label-text:not(.dcb-entry-label-ghost)')
const idle=()=>page.waitForFunction(()=>!document.getAnimations().some(animation=>animation.id.startsWith('dcb-entry-label-')))
async function patch(value){await page.evaluate(value=>{const key='dsh-ui-beautify:settings:v1',next=JSON.stringify({...JSON.parse(localStorage.getItem(key)||'{}'),...value});localStorage.setItem(key,next);dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},value);await idle()}
let seq=0,rows=[],passed=0
const event=(type,data)=>({event:{type,data,seq:++seq}})
async function show({events=[],running=false,plan=[],pending=false}={}){rows=events;await page.evaluate(({events,running,plan,pending})=>{window.fixturePending=pending?{kind:'approval'}:null;window.fixture.records(events);window.fixture.update(plan);window.fixture.running(running);window.fixture.refresh()},{events,running,plan,pending});await idle()}
async function expectLabel(expected){await idle();assert.equal(await label().innerText(),expected);assert.equal(await entry().locator('.dcb-entry-label-ghost').count(),0)}
async function check(name,run){await run();passed++;console.log('PASS '+name)}
async function screenshot(name){await page.locator('main > header').screenshot({path:resolve(output,name+'.png')})}
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
 await check('idle and all-round entries show an overview instead of mixed resource or round counts',async()=>{
  await expectLabel('概览');await patch({summaryScope:'all'});await expectLabel('概览');await patch({summaryScope:'turn'})
 })
 await check('real running and pending-interaction signals work without a plan or prior output',async()=>{
  await show({running:true});await expectLabel('处理中')
  await show({running:true,pending:true});await expectLabel('待确认')
  await show({running:false,pending:true});await expectLabel('待确认')
 })
 await check('only the current live plan supplies progress and a later planless turn never inherits an old count',async()=>{
  const plan=[{content:'Prepare synthetic data',status:'completed'},{content:'Process synthetic data',status:'in_progress'},{content:'Inspect result',status:'pending'}]
  const first=[event('turn/start',{turn:1}),event('todo/write',{todos:plan})]
  await show({running:true,plan,events:first});await expectLabel('2/3')
  await patch({summaryScope:'all'});await expectLabel('2/3');await patch({summaryScope:'turn'})
  await show({running:true,plan,events:[...first,event('turn/end',{reason:{kind:'complete'}}),event('turn/start',{turn:2})]});await expectLabel('处理中')
 })
 await check('parallel tool calls show the current action and settle back to processing after the last result',async()=>{
  const base=[event('turn/start',{turn:3}),event('tool/call',{callId:'read',name:'read_file',arguments:'{}'})]
  await show({running:true,events:base});await expectLabel('读取文件')
  const edit=event('tool/call',{callId:'edit',name:'apply_patch',arguments:'{}'})
  await show({running:true,events:[...base,edit]});await expectLabel('修改文件')
  const editDone=event('tool/result',{callId:'edit',isError:true})
  await show({running:true,events:[...base,edit,editDone]});await expectLabel('读取文件')
  await show({running:true,events:[...base,edit,editDone,event('tool/result',{callId:'read'})]});await expectLabel('处理中')
 })
 await check('finished outputs, stopped turns and errors receive distinct truthful labels',async()=>{
  const base=[event('turn/start',{turn:4}),event('deliverables/presented',{files:[{path:'outputs/synthetic.txt',description:'Synthetic output'}]})]
  await show({events:[...base,event('turn/end',{reason:{kind:'complete'}})]});await expectLabel('查看成果');await screenshot('light-output')
  await patch({summaryScope:'all'});await expectLabel('查看成果');await patch({summaryScope:'turn'})
  await show({events:[...base,event('turn/end',{reason:{kind:'interrupted'}})]});await expectLabel('已停止')
  await show({events:[event('turn/start',{turn:5}),event('turn/end',{reason:{kind:'error'}})]});await expectLabel('执行出错')
 })
 await check('text and intrinsic width render intermediate frames instead of snapping the neighboring controls',async()=>{
  await show({events:[event('turn/start',{turn:6}),event('todo/write',{todos:[{content:'Synthetic item',status:'completed'}]})]})
  await expectLabel('概览')
  const sample=await page.evaluate(async()=>{
   const host=document.querySelector('.dcb-entry-label'),text=host.querySelector('.dcb-entry-label-text'),width=()=>host.getBoundingClientRect().width
   const start=width();window.fixture.running(true);await new Promise(resolve=>setTimeout(resolve,65))
   const style=getComputedStyle(text),mid={width:width(),opacity:Number(style.opacity),transform:style.transform,filter:style.filter,ghosts:host.querySelectorAll('.dcb-entry-label-ghost').length,animations:document.getAnimations().filter(animation=>animation.id.startsWith('dcb-entry-label-')).length}
   await new Promise(resolve=>setTimeout(resolve,330));return{start,mid,end:width(),widthStyle:host.style.width,moving:host.hasAttribute('data-moving')}
  })
  assert.ok(Math.abs(sample.mid.width-sample.start)<1.5,JSON.stringify(sample))
  assert.ok(Math.abs(sample.end-sample.start)<1.5,JSON.stringify(sample))
  assert.ok(sample.mid.opacity>0&&sample.mid.opacity<1);assert.notEqual(sample.mid.transform,'none');assert.match(sample.mid.filter,/blur/);assert.ok(sample.mid.ghosts>0);assert.ok(sample.mid.animations>=2);assert.equal(await page.evaluate(()=>document.getAnimations().some(animation=>animation.id==='dcb-entry-label-width')),false)
  assert.equal(sample.widthStyle,'');assert.equal(sample.moving,false)
  writeFileSync(resolve(output,'intermediate-frames.json'),JSON.stringify(sample,null,2))
 })
 await check('rapid reversals reuse the visible old text frame, cap layers and cancel stale animations',async()=>{
  await show({events:[event('turn/start',{turn:7}),event('todo/write',{todos:[{content:'Synthetic item',status:'completed'}]})]})
  const sample=await page.evaluate(async()=>{
   const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),host=document.querySelector('.dcb-entry-label')
   window.fixture.running(true);await wait(80)
   const old=host.querySelector('.dcb-entry-label-ghost'),before={width:host.getBoundingClientRect().width,opacity:Number(getComputedStyle(old).opacity),transform:getComputedStyle(old).transform}
   window.fixture.running(false);await new Promise(resolve=>requestAnimationFrame(resolve))
   const main=host.querySelector('.dcb-entry-label-text:not(.dcb-entry-label-ghost)'),after={width:host.getBoundingClientRect().width,opacity:Number(getComputedStyle(main).opacity),transform:getComputedStyle(main).transform}
   let peak=0;for(let i=0;i<18;i++){window.fixturePending=i%2?{kind:'approval'}:null;window.fixture.running(true);window.fixture.refresh();await wait(18);peak=Math.max(peak,host.querySelectorAll('.dcb-entry-label-ghost').length)}
   window.fixturePending=null;window.fixture.running(false);window.fixture.refresh();await wait(400)
   return{before,after,peak,ghosts:host.querySelectorAll('.dcb-entry-label-ghost').length,remaining:document.getAnimations().filter(animation=>animation.id.startsWith('dcb-entry-label-')).length,label:main.textContent}
  })
  assert.ok(Math.abs(sample.before.width-sample.after.width)<3,JSON.stringify(sample));assert.ok(Math.abs(sample.before.opacity-sample.after.opacity)<.16,JSON.stringify(sample));assert.equal(sample.before.transform,sample.after.transform)
  assert.ok(sample.peak<=2);assert.equal(sample.ghosts,0);assert.equal(sample.remaining,0);assert.equal(sample.label,'概览')
  writeFileSync(resolve(output,'rapid-reversal.json'),JSON.stringify(sample,null,2))
 })
 await check('unchanged labels do not replay, scan layout on refresh, replace the entry, or steal keyboard focus',async()=>{
  await entry().focus()
  const result=await page.evaluate(async()=>{
   const button=document.querySelector('.dcb-entry'),host=button.querySelector('.dcb-entry-label');let scans=0
   const original=host.getBoundingClientRect.bind(host);host.getBoundingClientRect=()=>{scans++;return original()}
   for(let i=0;i<30;i++){window.fixture.refresh();await new Promise(resolve=>requestAnimationFrame(resolve))}
   return{scans,same:button===document.querySelector('.dcb-entry'),focused:document.activeElement===button,animations:document.getAnimations().filter(animation=>animation.id.startsWith('dcb-entry-label-')).length}
  })
  assert.deepEqual(result,{scans:0,same:true,focused:true,animations:0})
 })
 await check('dark and narrow layouts retain a readable entry and reduced-motion and forced-colors settle without optical animations',async()=>{
  await page.setViewportSize({width:520,height:800});await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await show({running:true,pending:true});await expectLabel('待确认');await screenshot('narrow-dark-waiting')
  const bounds=await entry().boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=520)
  for(const preference of [{reducedMotion:'reduce',forcedColors:'none'},{reducedMotion:'no-preference',forcedColors:'active'}]){
   await page.emulateMedia(preference);await show({running:true});await expectLabel('处理中')
   assert.equal(await page.evaluate(()=>document.getAnimations().filter(animation=>animation.id.startsWith('dcb-entry-label-')).length),0)
   await show({running:true,pending:true});await expectLabel('待确认')
  }
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
 })
 await check('hidden pages and plugin disposal release every label animation, ghost and temporary width',async()=>{
  const result=await page.evaluate(async()=>{
   window.fixturePending=null;window.fixture.running(true);window.fixture.refresh();await new Promise(resolve=>setTimeout(resolve,35))
   Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))
   const hidden=document.getAnimations().filter(animation=>animation.id.startsWith('dcb-entry-label-')).length
   Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))
   window.fixturePending={kind:'approval'};window.fixture.refresh();await new Promise(resolve=>setTimeout(resolve,35))
   for(const cleanup of window.cleanups.reverse())cleanup?.()
   const host=document.querySelector('.dcb-entry-label');return{hidden,remaining:document.getAnimations().filter(animation=>animation.id.startsWith('dcb-entry-label-')).length,ghosts:host.querySelectorAll('.dcb-entry-label-ghost').length,width:host.style.width,moving:host.hasAttribute('data-moving')}
  })
  assert.deepEqual(result,{hidden:0,remaining:0,ghosts:0,width:'',moving:false})
 })
 assert.deepEqual(errors,[])
 writeFileSync(resolve(output,'verification.json'),JSON.stringify({passed,errors},null,2))
 console.log(`${passed} summary entry browser groups passed`)
}finally{await browser.close();await new Promise(done=>server.close(done))}
