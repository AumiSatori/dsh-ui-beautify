import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url))
if(!process.env.DSH_SLIDER_CLIENT)throw new Error('Set DSH_SLIDER_CLIENT to the installed dsh-claude-slider lib/client.js')
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'../../outputs/dsh-ui-beautify'),'slider-glass')
mkdirSync(output,{recursive:true})
const built=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const css=`:root{--dsw-alias-label-primary:#20242a;--dsw-alias-label-secondary:#656d78;--dsw-alias-label-caption:#88909b;--dsw-alias-state-business-primary:#4d6bfe}.cf_root{width:100%}.cf_card{position:relative;display:flex;flex-direction:column;width:100%;padding:14px;gap:12px;border:0;border-radius:22px;background:#fff;box-shadow:0 4px 18px #0001}.cf_grow{position:relative}.cf_input{min-height:52px;padding:8px;outline:none}.cf_placeholder{position:absolute;inset:8px;pointer-events:none;color:#999}.cf_row,.cf_tools,.cf_trailing{display:flex;align-items:center;gap:10px}.cf_row{justify-content:space-between}.cf_tools{min-width:0}.cf_primary,.cf_add,.vf_voice,.vf_trigger{border:0;border-radius:50%;width:32px;height:32px;flex:none;display:grid;place-items:center}.cf_overlayAnchor{position:absolute;top:0;pointer-events:none}.dcs-trigger-text{max-width:min(240px,40vw);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body[data-ds-dark-theme]{--dsw-alias-label-primary:#f2f4f8;--dsw-alias-label-secondary:#c5cbd5;--dsw-alias-label-caption:#aab0bb}body[data-ds-dark-theme] .cf_card{background:#24272c}.composer-seat{background:linear-gradient(120deg,#c0c7d6,#eeece6)!important}body[data-ds-dark-theme] .composer-seat{background:linear-gradient(120deg,#1b2637,#36322e)!important}`
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8').replace('</style>',css+'</style>')],'/fixture.js':['text/javascript',built.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'))],'/slider.js':['text/javascript',readFileSync(process.env.DSH_SLIDER_CLIENT)]}
const server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),page=await browser.newPage({viewport:{width:1200,height:950}}),errors=[]
page.on('pageerror',error=>errors.push(error.message))
const url=`http://127.0.0.1:${server.address().port}/?composer=interactive`,key='dsh-ui-beautify:settings:v1'
const model=page.locator('.dcs-root .dcs-model-trigger'),menu=page.locator('.dcs-root .dcs-model-menu'),input=page.getByRole('textbox',{name:'合成消息输入'})
async function settled(){await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))}
async function patch(value){await page.evaluate(({key,value})=>{const next=JSON.stringify({...JSON.parse(localStorage.getItem(key)||'{}'),...value});localStorage.setItem(key,next);dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},{key,value});await settled()}
const measure=locator=>locator.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{x:r.x,y:r.y,width:r.width,height:r.height,radius:s.borderRadius,background:s.backgroundColor,backdrop:s.backdropFilter,shadow:s.boxShadow,outline:s.outlineColor}})
async function closeMenu(){if(await menu.count()){await model.click();await settled()}}
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
try{
 await page.goto(url);await page.getByTestId('todo-panel').waitFor()
 await page.evaluate(()=>{
  window.cleanups=[];window.registrations={};window.sliderSelections=[];window.sliderLoads=0
  localStorage.setItem('dsh-ui-beautify:settings:v1',JSON.stringify({welcomeEnabled:false}))
  window.__ModuleLoader__={load(spec){window.registrations[spec.id]=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}}
 })
 await page.addScriptTag({url:new URL('/slider.js',url).href})
 await page.evaluate(()=>{
  const R=window.fixtureReact,listeners=new Set()
  let snapshot={status:'ready',current:{provider:'demo',model:'flash',reasoningEffort:'max'},groups:[{id:'demo',name:'Synthetic models',models:[{id:'flash',name:'DeepSeek V4.1 Flash',reasoning:{defaultEffort:'max',efforts:[{id:'low',name:'Low'},{id:'max',name:'Max'}]}},{id:'pro',name:'Synthetic Pro',reasoning:{defaultEffort:'max',efforts:[{id:'low',name:'Low'},{id:'max',name:'Max'}]}}]}]}
  const controller={store:{subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},getSnapshot:()=>snapshot},load:async()=>{window.sliderLoads++},select:async selection=>{window.sliderSelections.push(selection);snapshot={...snapshot,current:selection};for(const fn of listeners)fn()}}
  const services={modelDirectories:{directoryFor:()=>controller},sessions:{subagentAddress:()=>undefined}}
  const ctx={get:name=>services[name],slots:{inject(_name,cb){return cb()},register(spec,Component){if(spec.name==='conversation.input.model'){const props=spec.inject('a');window.fixtureComposerModel=()=>{const [locked,setLocked]=R.useState(false);window.setSliderLocked=setLocked;return R.createElement(Component,{...props,locked})}}return()=>{}}},effect(cb){window.cleanups.push(cb())}}
  window.registrations['dsh-claude-slider'].configStore.update({themeMode:'system',enabled:true})
  window.registrations['dsh-claude-slider'].apply(ctx);window.fixture.refresh()
 })
 await model.waitFor()
 await page.addScriptTag({url:new URL('/client.js',url).href})
 await page.evaluate(()=>{
  const ctx={slots:{inject(_name,cb){cb()},register(spec,Component){if(spec.name==='settings.section')window.fixtureSettings=Component;else{window.fixtureHeader=Component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}}
  window.registrations['dsh-ui-beautify'].apply(ctx);window.fixture.refresh()
 });await settled()
 await check('the actual Claude Slider trigger receives glass without native model classes, ARIA links or changes to its layout',async()=>{
  assert.equal(await model.getAttribute('aria-controls'),null);assert.equal(await model.locator('[data-model-id]').count(),0)
  const native=await measure(model)
  await patch({composerButtonGlass:true})
  await page.waitForFunction(()=>document.querySelector('.dcs-model-trigger')?.hasAttribute('data-dcb-lens-ready'))
  assert.equal(await model.getAttribute('data-dcb-composer-action-kind'),'model')
  const glass=await measure(model)
  for(const key of ['x','y','width','height','radius'])assert.equal(glass[key],native[key],JSON.stringify({key,native,glass}))
  assert.notEqual(glass.shadow,native.shadow);assert.equal(glass.background,'rgba(0, 0, 0, 0)')
  assert.equal(await model.locator('.dcs-trigger-text').innerText(),'DeepSeek V4.1 Flash')
  assert.equal(await page.locator('[data-dcb-lens-stage]').count(),1,'the model selector shares the existing button renderer')
  assert.equal(await page.locator('.dcs-effort-trigger').getAttribute('data-dcb-composer-action'),null)
 })
 await check('its own menu gains translucent glass and real entrance frames while selection and existing reasoning controls still work',async()=>{
  await input.fill('保留输入中的草稿');await model.click();await settled()
  assert.equal(await menu.getAttribute('role'),null);assert.equal(await menu.getAttribute('data-dcb-model-menu-glass'),'css')
  const glass=await measure(menu);assert.match(glass.background,/rgba\(.+, 0\.\d+\)/);assert.match(glass.backdrop,/blur\(12px\)/)
  assert.equal(await menu.locator('canvas,[data-dcb-composer-action]').count(),0)
  const middle=await menu.evaluate(el=>{el.style.animation='none';void el.offsetWidth;el.style.removeProperty('animation');const a=el.getAnimations().find(a=>a.animationName==='dcb-model-menu-in');a.pause();a.currentTime=55;const s=getComputedStyle(el);return{opacity:Number(s.opacity),y:new DOMMatrix(s.transform).m42,filter:s.filter}})
  assert.ok(middle.opacity>0&&middle.opacity<1&&middle.y>0);assert.match(middle.filter,/blur\((?!0px)/)
  await menu.screenshot({path:resolve(output,'slider-menu-middle.png')});await menu.evaluate(el=>el.getAnimations().forEach(a=>a.finish()));await settled()
  await menu.getByRole('button',{name:'Synthetic Pro',exact:true}).click();await settled()
  assert.equal(await model.locator('.dcs-trigger-text').innerText(),'Synthetic Pro');assert.equal(await input.innerText(),'保留输入中的草稿')
  assert.equal(await page.evaluate(()=>window.sliderSelections.at(-1).model),'pro')
  assert.match(await page.locator('.dcs-effort-trigger').innerText(),/Max/)
 })
 await check('light and dark narrow menus preserve their native size and keep both trigger and options readable',async()=>{
  for(const dark of [false,true])for(const width of [1200,390]){
   await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);await page.setViewportSize({width,height:950});await settled()
   await patch({composerButtonGlass:false});await model.click();await settled();const native=await measure(menu)
   await patch({composerButtonGlass:true});await settled();const glass=await measure(menu)
   for(const key of ['width','height','radius'])assert.equal(glass[key],native[key])
   assert.equal(await menu.getAttribute('data-dcb-model-menu-glass'),'css');assert.match(glass.backdrop,/blur\(12px\)/)
   assert.equal(await menu.getByRole('button',{name:/^Synthetic Pro/}).isVisible(),true)
   await menu.screenshot({path:resolve(output,`slider-menu-${dark?'dark':'light'}-${width}.png`)});await closeMenu()
   await model.screenshot({path:resolve(output,`slider-trigger-${dark?'dark':'light'}-${width}.png`)})
  }
 })
 await check('switching glass off restores the open menu and button, and disabled or error-recovery buttons retain their native behavior',async()=>{
  await model.click();await settled();await patch({composerButtonGlass:false})
  assert.equal(await model.getAttribute('data-dcb-composer-action'),null);assert.equal(await menu.getAttribute('data-dcb-model-menu-glass'),null)
  assert.equal((await measure(menu)).backdrop,'none');assert.equal(await page.locator('[data-dcb-lens-stage]').count(),0)
  await patch({composerButtonGlass:true});await closeMenu()
  await page.evaluate(()=>window.setSliderLocked(true));await settled();assert.equal(await model.isDisabled(),true)
  await model.evaluate(el=>el.click());assert.equal(await menu.count(),0)
  await page.evaluate(()=>{window.setSliderLocked(false);const error=document.createElement('div');error.className='dcs-root dcs-error-fallback';error.innerHTML='<button class="dcs-model-trigger">恢复推理滑块</button>';document.querySelector('[data-composer-card]').append(error)});await settled()
  assert.equal(await page.locator('.dcs-error-fallback button').getAttribute('data-dcb-composer-action'),null)
  await page.locator('.dcs-error-fallback').evaluate(el=>el.remove())
 })
 await check('reduced motion and forced colors remain usable, and unloading beautify restores the still-open third-party menu',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});await model.click();await settled();assert.equal(await menu.evaluate(el=>getComputedStyle(el).animationName),'none')
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'active'});await settled();assert.equal((await measure(menu)).backdrop,'none')
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'});await settled()
  await page.evaluate(()=>window.cleanups.at(-1)());await settled()
  assert.equal(await menu.count(),1);assert.equal(await menu.getAttribute('data-dcb-model-menu-glass'),null)
  assert.equal(await model.getAttribute('data-dcb-composer-action'),null)
  await menu.getByRole('button',{name:'DeepSeek V4.1 Flash',exact:true}).click();assert.equal(await page.evaluate(()=>window.sliderSelections.at(-1).model),'flash')
 })
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,source:'installed Claude Slider browser plugin with synthetic directory and composer',output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
