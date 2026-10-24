import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'skills')
mkdirSync(output,{recursive:true})
const built=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',built.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const context=await browser.newContext({viewport:{width:1200,height:900}}),page=await context.newPage(),errors=[]
page.on('pageerror',error=>errors.push(error.message))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-ui-beautify:settings:v1'
const card=page.getByTestId('dcb-summary'),toggle=card.locator('.dcb-skill-summary'),details=card.getByRole('group',{name:'技能明细',includeHidden:true})
const events=(names=['browser-ops','browser-skill'])=>{
 let seq=0
 const event=(type,data)=>({event:{type,data,seq:++seq}})
 const rows=names.flatMap((name,index)=>[event('tool/call',{callId:`s${index}`,name:'skill',arguments:JSON.stringify({name})}),event('tool/result',{callId:`s${index}`})])
 rows.push(event('tool/call',{callId:'memory',name:'read',arguments:JSON.stringify({path:'/example/memory/example.md'})}),event('tool/result',{callId:'memory'}))
 rows.push(event('tool/call',{callId:'tool',name:'ops_bash',arguments:'{}'}),event('tool/result',{callId:'tool',isError:true}))
 return rows
}
async function settled(target=page){
 await target.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))
 await target.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))
}
async function boot(target=page){
 await target.goto(url);await target.getByTestId('todo-panel').waitFor()
 await target.evaluate(()=>{
  window.cleanups=[]
  window.__ModuleLoader__={load(spec){window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}}
  const animate=Element.prototype.animate
  Element.prototype.animate=function(frames,options){const result=animate.call(this,frames,options);if(window.pauseSkills&&options?.id?.startsWith('dcb-skills-')){result.pause();result.currentTime=0}return result}
 })
 await target.addScriptTag({url:url+'/client.js'})
 await target.evaluate(()=>{
  const ctx={slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}}
  window.plugin.apply(ctx);window.fixture.refresh();window.fixture.update([]);window.fixture.running(false)
 })
 await target.evaluate(rows=>window.fixtureBinding('a').eventSource.replace(rows),events())
 await target.getByRole('button',{name:'会话进度与输出',exact:true}).click();await settled(target)
}
async function replace(rows){await page.evaluate(rows=>window.fixtureBinding('a').eventSource.replace(rows),rows);await settled()}
async function patch(value){await page.evaluate(({key,value})=>{const next=JSON.stringify({...JSON.parse(localStorage.getItem(key)||'{}'),...value});localStorage.setItem(key,next);dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},{key,value});await settled()}
async function finish(){await page.evaluate(()=>{window.pauseSkills=false;for(const a of document.getAnimations().filter(a=>a.id.startsWith('dcb-skills-'))){a.currentTime=a.effect.getComputedTiming().endTime;a.play()}});await settled()}
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
try{
 await boot();await replace(events())
 await check('multiple successful skills occupy one collapsed summary while memory and ordinary tool statistics remain separate',async()=>{
  assert.equal(await toggle.count(),1);assert.match(await toggle.innerText(),/Skills\s*2 个/);assert.equal(await toggle.getAttribute('aria-expanded'),'false')
  assert.equal(await details.evaluate(el=>el.hidden&&el.inert&&el.getBoundingClientRect().height===0),true)
  assert.equal(await card.getByText('browser-ops',{exact:true}).isVisible(),false);assert.equal(await card.locator('.dcb-tool-summary').count(),1);assert.match(await card.locator('.dcb-tool-summary').innerText(),/失败 1/)
  assert.equal(await card.getByText('记忆',{exact:true}).isVisible(),true)
  await card.screenshot({path:resolve(output,'skills-merged.png')})
 })
 await check('keyboard expansion and collapse animate real height, blur and surrounding layout, then remove temporary styles',async()=>{
  await page.evaluate(()=>window.pauseSkills=true);await toggle.press('Enter')
  await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-skills-height'))
  await page.evaluate(()=>{for(const a of document.getAnimations().filter(a=>a.id.startsWith('dcb-skills-')))a.currentTime=100})
  const middle=await details.evaluate(el=>({height:el.getBoundingClientRect().height,natural:el.firstElementChild.offsetHeight,blur:getComputedStyle(el).filter,opacity:Number(getComputedStyle(el).opacity)}))
  assert.ok(middle.height>0&&middle.height<middle.natural&&middle.opacity>0&&middle.opacity<1);assert.match(middle.blur,/blur\(/)
  await finish();assert.deepEqual(await details.locator('.dcb-resource-label').allTextContents(),['browser-ops','browser-skill'])
  assert.equal(await details.evaluate(el=>el.style.willChange),'')
  const before=await card.locator('.dcb-tool-summary').evaluate(el=>el.getBoundingClientRect().top)
  await page.evaluate(()=>window.pauseSkills=true);await toggle.press('Space');await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-skills-height'))
  await page.evaluate(()=>{for(const a of document.getAnimations().filter(a=>a.id.startsWith('dcb-skills-')))a.currentTime=100})
  const after=await card.locator('.dcb-tool-summary').evaluate(el=>el.getBoundingClientRect().top)
  assert.ok(after<before,'the following rows move up while the skill details collapse')
  await finish();assert.equal(await details.evaluate(el=>el.hidden&&el.getBoundingClientRect().height===0),true)
 })
 await check('quick reversal continues at the current height and dynamic skill updates retain the existing group',async()=>{
  await page.evaluate(()=>window.pauseSkills=true);await toggle.click();await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-skills-height'))
  await page.evaluate(()=>{for(const a of document.getAnimations().filter(a=>a.id.startsWith('dcb-skills-')))a.currentTime=110})
  const before=await details.evaluate(el=>el.getBoundingClientRect().height);await toggle.click();const after=await details.evaluate(el=>el.getBoundingClientRect().height)
  assert.ok(Math.abs(before-after)<1);await finish();await toggle.click();await settled()
  await toggle.evaluate(el=>window.originalSkills=el)
  await replace(events(['browser-ops','browser-skill','video-skill']))
  assert.equal(await toggle.evaluate(el=>el===window.originalSkills),true);assert.match(await toggle.innerText(),/3 个/);assert.equal(await details.locator('.dcb-skill-row').count(),3)
 })
 await check('skill folding is independent from ordinary tool folding and survives reloads and cross-window updates',async()=>{
  await card.getByRole('button',{name:'展开工具明细',exact:true}).click();await settled();assert.equal(await toggle.getAttribute('aria-expanded'),'true')
  await toggle.click();await settled();assert.equal(await card.getByRole('button',{name:'收起工具明细',exact:true}).count(),1)
  const stored=await page.evaluate(key=>localStorage.getItem(key),key);assert.equal(JSON.parse(stored).skillDetails,false);assert.ok(!stored.includes('browser-ops'))
  await boot();await replace(events());assert.equal(await toggle.getAttribute('aria-expanded'),'false')
  const other=await context.newPage();await boot(other);await other.evaluate(rows=>window.fixtureBinding('a').eventSource.replace(rows),events());await settled(other)
  await toggle.click();await settled();await other.waitForFunction(()=>document.querySelector('.dcb-skill-summary')?.getAttribute('aria-expanded')==='true');await other.close()
 })
 await check('one skill remains a readable row, duplicates and failures do not inflate the group, and removing all skills removes it',async()=>{
  const one=events(['browser-ops']);one.push(...one.slice(0,2));await replace(one)
  assert.equal(await toggle.count(),0);assert.equal(await card.getByText('browser-ops',{exact:true}).isVisible(),true)
  await replace(events([]));assert.equal(await toggle.count(),0);assert.equal(await card.getByText('Skills',{exact:true}).count(),0)
  await replace([...events(),{event:{type:'tool/call',seq:50,data:{callId:'failed',name:'skill',arguments:'{"name":"failed-skill"}'}}},{event:{type:'tool/result',seq:51,data:{callId:'failed',isError:true}}}])
  assert.match(await toggle.innerText(),/2 个/);assert.equal(await card.getByText('failed-skill',{exact:true}).count(),0)
 })
 await check('all materials keep skill summaries readable in light, dark and narrow layouts',async()=>{
  for(const dark of [false,true])for(const cardStyle of ['milk','clear','css','glass']){
   await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);await patch({cardStyle,skillDetails:true})
   assert.equal(await toggle.evaluate(el=>el.scrollWidth<=el.clientWidth),true);assert.equal(await details.locator('.dcb-skill-row').count(),2)
  }
  await page.setViewportSize({width:390,height:844});await settled();assert.equal(await toggle.evaluate(el=>el.scrollWidth<=el.clientWidth),true)
  await card.screenshot({path:resolve(output,'skills-dark-narrow.png')});await page.setViewportSize({width:1200,height:900})
 })
 await check('changing sessions never mixes skill counts or names',async()=>{
  await page.evaluate(rows=>{window.fixtureBinding('b').eventSource.replace(rows);window.fixture.session('b');window.fixture.update([])},events(['other-one','other-two','other-three']));await settled()
  const entry=page.getByRole('button',{name:'会话进度与输出',exact:true})
  if(await entry.getAttribute('aria-expanded')!=='true')await entry.click();await settled()
  assert.match(await toggle.innerText(),/3 个/);assert.deepEqual(await details.locator('.dcb-resource-label').allTextContents(),['other-one','other-two','other-three'])
  await page.evaluate(()=>{window.fixture.session('a');window.fixture.update([])});await settled();if(await entry.getAttribute('aria-expanded')!=='true')await entry.click();await settled()
  assert.match(await toggle.innerText(),/2 个/);assert.equal(await card.getByText('other-one',{exact:true}).count(),0)
 })
 await check('reduced motion, forced colors and disposal release disclosure animations and preserve the host',async()=>{
  await patch({skillDetails:false});await page.evaluate(()=>window.pauseSkills=true);await toggle.click();await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-skills-height'))
  await page.emulateMedia({reducedMotion:'reduce'});await settled();assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-skills-')).length),0)
  await toggle.click();await settled();assert.equal(await details.evaluate(el=>el.hidden),true)
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'active'});await toggle.click();await settled();assert.equal(await details.evaluate(el=>el.hidden),false)
  await page.locator('[data-composer-seat]').evaluate(el=>window.originalComposerSeat=el)
  await page.emulateMedia({forcedColors:'none'});await page.evaluate(()=>{window.pauseSkills=false;window.fixtureHeader=null;window.fixture.refresh();for(const cleanup of [...window.cleanups].reverse())if(typeof cleanup==='function')cleanup()});await settled()
  assert.equal(await card.count(),0);assert.equal(await page.locator('[data-composer-seat]').evaluate(el=>el===window.originalComposerSeat),true)
 })
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
