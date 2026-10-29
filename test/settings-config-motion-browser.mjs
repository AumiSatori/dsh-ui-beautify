import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {selectSettingsCategory} from './settings-navigation.mjs'

const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/ui-beautify-044'),'config-motion')
mkdirSync(out,{recursive:true})
const fixture=await build({entryPoints:[resolve(root,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html',readFileSync(resolve(root,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];res.writeHead(route?200:404,{'Content-Type':(route?.[0]||'text/plain')+'; charset=utf-8'});res.end(route?.[1]||'')})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1200}}),errors=[],results=[]
page.on('pageerror',error=>errors.push(error.message))
async function boot({delay=0,dark=false,width=1440,quiet=false}={}){
 await page.goto('http://127.0.0.1:'+server.address().port+'/?composer')
 await page.setViewportSize({width,height:1200});await page.emulateMedia({reducedMotion:quiet?'reduce':'no-preference'})
 await page.getByTestId('todo-panel').waitFor()
 await page.evaluate(async({delay,dark})=>{
  localStorage.clear();localStorage.setItem('dsh-ui-beautify:settings:v1',JSON.stringify({welcomeEnabled:false,particleEnabled:false,runningAnimationEnabled:false}))
  document.body.toggleAttribute('data-ds-dark-theme',dark)
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('dsh-ui-beautify-presets',1);r.onupgradeneeded=()=>r.result.createObjectStore('presets',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
  await new Promise((resolve,reject)=>{const tx=db.transaction('presets','readwrite');tx.objectStore('presets').clear();tx.objectStore('presets').put({id:'motion-example',name:'合成预设',createdAt:0,blob:new Blob(['synthetic'])});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()
  const open=IDBFactory.prototype.open
  IDBFactory.prototype.open=function(name,...args){const request=open.call(this,name,...args);if(name!=='dsh-ui-beautify-presets'||!delay)return request;return new Proxy(request,{get(target,key){return Reflect.get(target,key,target)},set(target,key,value){target[key]=key==='onsuccess'?event=>setTimeout(()=>value.call(target,event),delay):value;return true}})}
  window.cleanups=[];window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true
  window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>window.fixtureReact.createElement('span',null,'◒')}:window.fixtureReact)}
 },{delay,dark})
 await page.addScriptTag({url:'http://127.0.0.1:'+server.address().port+'/client.js'})
 await page.evaluate(()=>{const ctx={slots:{inject(_n,cb){cb()},register(s,c){if(s.name==='settings.section')window.fixtureSettings=c;return()=>{}}},effect(cb){window.cleanups.push(cb())},inject(_n,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh();window.fixture.settings(true)})
 await page.addStyleTag({content:'.settings-dialog{inset:20px 7%;padding:20px;overflow:auto;overflow-anchor:none}.dcb-settings{min-width:0}'})
 await selectSettingsCategory(page,'输入栏')
}
async function sample(){
 await page.evaluate(()=>{window.motionFrames=[];window.motionSampling=true;const record=()=>{const section=document.querySelector('[data-dcb-settings-page=config]'),stage=document.querySelector('.dcb-settings-tab-stage'),transfer=section?.querySelector('.dcb-config-transfer'),list=section?.querySelector('.dcb-preset-list');if(transfer){const top=section.getBoundingClientRect().top;motionFrames.push({time:performance.now(),footer:transfer.getBoundingClientRect().top-top,list:list.getBoundingClientRect().height,stage:stage.getBoundingClientRect().height,natural:stage.firstElementChild.getBoundingClientRect().height,state:stage.dataset.state,rows:list.children.length,moving:list.getAnimations().some(a=>a.id==='dcb-preset-list-layout'),blur:getComputedStyle(list.lastElementChild).filter})}if(motionSampling)requestAnimationFrame(record)};requestAnimationFrame(record)})
 await page.getByRole('tab',{name:'全局配置',exact:true}).click()
 await page.waitForTimeout(1000)
 return page.evaluate(()=>{motionSampling=false;return motionFrames})
}
try{
 for(const [name,options]of Object.entries({immediate:{delay:0},duringEntry:{delay:120},afterEntry:{delay:380},darkNarrow:{delay:120,dark:true,width:520}})){
  await boot(options);const frames=await sample(),travel=frames.at(-1).footer-frames[0].footer,jumps=frames.slice(1).map((frame,i)=>frame.footer-frames[i].footer)
  const result={name,travel,maxJump:Math.max(...jumps),minJump:Math.min(...jumps),frames};results.push(result);writeFileSync(resolve(out,'frames.json'),JSON.stringify(results,null,2))
  assert.ok(travel>50,'the saved preset must really move the import/export section')
  assert.ok(result.maxJump<travel*.35,`${name}: footer jumped ${result.maxJump.toFixed(1)}px out of ${travel.toFixed(1)}px`)
  assert.ok(result.minJump>-.75,`${name}: footer reversed while the preset arrived`)
  assert.ok(frames.some(frame=>frame.rows===2&&frame.list>frames[0].list+2&&frame.list<frames.at(-1).list-2&&/blur/.test(frame.blur)),'height and blur must exist at a real intermediate frame')
  for(let i=1;i<frames.length;i++)if(frames[i-1].state==='entering'&&frames[i].state==='idle')assert.ok(Math.abs(frames[i].stage-frames[i-1].stage)<3,'releasing the page height must not jump')
  assert.equal(await page.locator('.dcb-settings-tab-stage').getAttribute('style'),'')
  assert.equal(await page.locator('.dcb-preset-list').getAttribute('style')||'','')
  assert.equal(await page.locator('select,input[type=checkbox],input[type=radio],input[type=range]').count(),0)
  console.log('PASS '+name+': async presets move the import/export section smoothly')
 }
 await boot({delay:120,quiet:true});const quiet=await sample();assert.ok(quiet.every(frame=>!frame.moving));assert.equal(quiet.at(-1).rows,2);console.log('PASS reduced motion loads presets without a layout animation')
 await boot({delay:380});await page.getByRole('tab',{name:'全局配置',exact:true}).click();await page.getByRole('region',{name:'配置预设'}).waitFor();await selectSettingsCategory(page,'输入栏');await page.waitForTimeout(700)
 assert.equal(await page.locator('[data-dcb-settings-page=config]').count(),0);assert.equal(await page.evaluate(()=>document.getAnimations().some(a=>a.id==='dcb-preset-list-layout'||a.id==='dcb-settings-tab')),false);assert.equal(await page.locator('.dcb-settings-tab-stage').getAttribute('style'),'');console.log('PASS leaving before IndexedDB responds releases the list and page animations')
 assert.deepEqual(errors,[])
}finally{await browser.close();await new Promise(done=>server.close(done))}
