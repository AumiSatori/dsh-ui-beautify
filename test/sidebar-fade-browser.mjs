import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {hostFile,hostSheet} from './host-stylesheet.mjs'

const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/beautify-sidebar-fade'),'sidebar-fade')
mkdirSync(out,{recursive:true})
const host=hostSheet(hostFile('dsh/node_modules/@deepseek-ai/dsh-client-ui-sidebar/lib/client.js'),'SidebarRoot','sb')
const fixture=(await build({entryPoints:[resolve(root,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})).outputFiles[0].text
const extra=`.nav{padding:0!important;background:transparent!important}.sb_root{width:300px;height:540px}.sb_scrollRegion{height:420px;flex:none}.sb_logoRow{min-height:44px}.row{height:40px;flex:none;padding:10px 12px;background:#8994a344;color:var(--dsw-alias-label-primary);border-radius:8px}.sb_footArea{height:48px;padding:14px}.frame{background:repeating-linear-gradient(145deg,#8bc8e5 0 60px,#b5b4e7 60px 120px)}body[data-ds-dark-theme] .frame{background:repeating-linear-gradient(145deg,#284f68 0 60px,#48446b 60px 120px)}:root{--dsw-specific-sidebar-fill:#f7f7f7;--dsw-alias-label-primary:#222}body[data-ds-dark-theme]{--dsw-specific-sidebar-fill:#202024;--dsw-alias-label-primary:#eee}`
const routes={'/':['text/html',readFileSync(resolve(root,'test/fixture.html'),'utf8').replace('</style>',host+extra+'</style>')],'/fixture.js':['text/javascript',fixture],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[],results=[]
page.on('pageerror',error=>errors.push(error.message))
const key='dsh-ui-beautify:settings:v1',sidebar=page.locator('.sb_root:not([data-dcb-sidebar-ghost])'),scroll=sidebar.locator('.sb_scrollArea'),fade=sidebar.locator('.sb_scrollFade')
const settle=async()=>{await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))}
async function patch(value){await page.evaluate(({key,value})=>{const next=JSON.stringify({...JSON.parse(localStorage.getItem(key)),...value});localStorage.setItem(key,next);dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},{key,value});await settle()}
const geometry=()=>sidebar.evaluate(el=>{const s=el.querySelector('.sb_scrollArea');return{rect:el.getBoundingClientRect().toJSON(),height:s.scrollHeight,client:s.clientHeight,top:s.scrollTop}})
try{
 await page.goto(`http://127.0.0.1:${server.address().port}/?composer=interactive`)
 await page.getByTestId('todo-panel').waitFor()
 await page.evaluate(key=>{
  localStorage.setItem(key,JSON.stringify({sidebarStyle:'milk',sidebarOverlay:false,welcomeEnabled:false}))
  const nav=document.querySelector('.nav');nav.classList.add('host_sidebarCol')
  nav.innerHTML='<div class="sb_root"><div class="sb_logoRow"><span class="sb_brand">合成工作区</span><button class="sb_toggle">侧栏</button></div><div class="sb_scrollRegion"><div class="sb_scrollArea"><div class="sb_regionArea">'+Array.from({length:24},(_,i)=>'<div class="row" role="treeitem">测试会话 '+(i+1)+'</div>').join('')+'</div></div><span class="sb_scrollFade" aria-hidden="true"></span></div><div class="sb_footArea">账户与设置</div></div>'
  window.cleanups=[];window.__ModuleLoader__={load(spec){window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}}
 },key)
 await page.addScriptTag({url:'/client.js'})
 await page.evaluate(()=>{const ctx={slots:{inject(_n,cb){cb()},register(){return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},effect(cb){window.cleanups.push(cb())},inject(_n,cb){cb(ctx)}};window.plugin.apply(ctx)})
 await settle()
 for(const dark of [false,true]){
  await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark)
  for(const material of ['milk','clear','glass','css']){
   await patch({sidebarStyle:material})
   await scroll.evaluate(el=>el.scrollTop=245)
   const before=await geometry(),paint=await scroll.evaluate(el=>({mask:getComputedStyle(el).maskImage,filter:getComputedStyle(el).filter}))
   const image=await fade.evaluate(el=>getComputedStyle(el).backgroundImage)
   if(material==='milk'){assert.equal(paint.mask,'none');assert.ok(image.includes('linear-gradient'),'Default material retains the native gradient')}
   else{assert.ok(paint.mask.includes('linear-gradient'),'Glass fades content to the actual backdrop');assert.equal(image,'none','No flat white/dark paint covers the glass');assert.equal(paint.filter,'none','Keep scrolling text sharp')}
   assert.equal(await fade.evaluate(el=>getComputedStyle(el).pointerEvents),'none')
   await scroll.evaluate(el=>el.scrollTop+=80);assert.equal((await geometry()).top,before.top+80)
   const box=await scroll.boundingBox()
   await page.screenshot({path:resolve(out,`${dark?'dark':'light'}-${material}.png`),clip:{x:box.x,y:box.y+box.height-64,width:box.width,height:100}})
   assert.equal((await geometry()).height,before.height,'Fade never changes the scroll range')
   results.push({dark,material,paint,image})
  }
 }
 await patch({sidebarStyle:'glass'})
 const masked=await page.screenshot({clip:await scroll.boundingBox()})
 const override=await page.addStyleTag({content:'.sb_scrollArea{mask-image:none!important}'})
 const unmasked=await page.screenshot({clip:await scroll.boundingBox()})
 assert.notDeepEqual(masked,unmasked,'The content fade changes the rendered bottom edge')
 await override.evaluate(el=>el.remove())
 await page.emulateMedia({forcedColors:'active'});assert.equal(await scroll.evaluate(el=>getComputedStyle(el).maskImage),'none')
 await page.emulateMedia({forcedColors:'none',reducedMotion:'reduce'});assert.ok((await scroll.evaluate(el=>getComputedStyle(el).maskImage)).includes('linear-gradient'))
 await patch({sidebarStyle:'milk'});assert.equal(await scroll.evaluate(el=>getComputedStyle(el).maskImage),'none')
 assert.deepEqual(errors,[])
 writeFileSync(resolve(out,'result.json'),JSON.stringify({passed:results.length+4,results,errors},null,2))
 console.log(JSON.stringify({passed:results.length+4,out}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
