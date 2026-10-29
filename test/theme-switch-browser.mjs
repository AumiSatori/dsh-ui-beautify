import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'theme-switch')
mkdirSync(output,{recursive:true})
const fixture=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const palette=`header,.nav{background:#f3f5f8}body[data-ds-dark-theme] header,body[data-ds-dark-theme] .nav{background:#252934;color:#edf0f7}body[data-ds-dark-theme]{--dsw-alias-label-primary:#edf0f7;background:#181c24;color:#edf0f7}.header-utilities{gap:12px}body{--dsw-alias-label-primary:#252934}header{flex-shrink:0}`
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8').replace('</style>',palette+'</style>')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const row=routes[req.url.split('?')[0]];if(!row)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':row[0]}).end(row[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),context=await browser.newContext({viewport:{width:1200,height:900}}),page=await context.newPage(),errors=[]
page.on('pageerror',error=>errors.push(error.message))
const url=`http://127.0.0.1:${server.address().port}/`,button=page.locator('.dcb-theme-toggle')
async function idle(){await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-dcb-theme-transition'));await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))}
async function mount(){
 await page.goto(url);await page.getByTestId('todo-panel').waitFor()
 await page.evaluate(()=>{
  window.cleanups=[];window.themeListeners=new Set();window.themeCalls=[];window.failTheme=false;window.fixtureTransitionStarts=0
  let preference=localStorage.getItem('fixture:host-theme')||'system',snapshot
  const refresh=()=>{const dark=preference==='dark'||preference==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;snapshot={preference,active:{id:dark?'dark':'light',colorScheme:dark?'dark':'light'}};document.body.toggleAttribute('data-ds-dark-theme',dark);document.documentElement.style.colorScheme=dark?'dark':'light';for(const listener of window.themeListeners)listener(snapshot)}
  window.hostTheme={getTheme:()=>snapshot,setTheme(value){if(window.failTheme)throw new Error('Synthetic settings write failure');window.themeCalls.push(value);preference=value;localStorage.setItem('fixture:host-theme',value);refresh()}}
  const storage=event=>{if(event.key==='fixture:host-theme'){preference=event.newValue||'system';refresh()}};window.addEventListener('storage',storage);window.cleanups.push(()=>window.removeEventListener('storage',storage));refresh()
  if(document.startViewTransition){const start=document.startViewTransition.bind(document);document.startViewTransition=callback=>{window.fixtureTransitionStarts++;return start(callback)}}
  window.__ModuleLoader__={load(spec){window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>window.fixtureReact.createElement('span',null,'◒')}:window.fixtureReact)}}
 })
 await page.addScriptTag({url:new URL('/client.js',url).href})
 await page.evaluate(()=>{const ctx={theme:window.hostTheme,slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},on(name,listener){if(name==='theme/change'){window.themeListeners.add(listener);window.cleanups.push(()=>window.themeListeners.delete(listener))}},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
 await button.waitFor();await idle()
}
async function finishReveal(){await page.evaluate(()=>{for(const animation of document.getAnimations())if(animation.id==='dcb-theme-reveal')animation.finish()});await idle()}
let passed=0;async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
try{
 await mount()
 await check('a compact glass day/night switch appears in the requested header and uses native button semantics',async()=>{
  assert.equal(await button.getAttribute('aria-checked'),'false');assert.equal(await button.getAttribute('aria-label'),'切换到夜间主题')
  assert.equal(await button.evaluate(el=>!!el.closest('[data-slot="conversation.header"] .header-utilities')),true)
  const style=await button.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{width:r.width,height:r.height,filter:s.backdropFilter,radius:s.borderRadius}})
  assert.deepEqual([style.width,style.height],[70,30]);assert.match(style.filter,/blur\(12px\)/);assert.equal(style.radius,'999px')
  assert.equal(await page.locator('select,input[type="checkbox"],input[type="radio"]').count(),0)
  await page.screenshot({path:resolve(output,'theme-day.png')})
 })
 await check('the host theme setter persists night mode while a real circular page reveal and orb movement animate',async()=>{
  assert.equal(await page.evaluate(()=>typeof document.startViewTransition),'function')
  await button.evaluate(el=>{window.originalThemeButton=el;el.click()})
  await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-theme-reveal'))
  const sample=await page.evaluate(()=>{
   const animation=document.getAnimations().find(a=>a.id==='dcb-theme-reveal');animation.pause();animation.currentTime=140
   const orb=document.getAnimations().find(a=>a.effect?.pseudoElement==='::view-transition-group(dcb-theme-orb)');if(orb){orb.pause();orb.currentTime=140}
   return{duration:animation.effect.getTiming().duration,frames:animation.effect.getKeyframes().map(f=>f.clipPath),orbFrames:orb?.effect.getKeyframes().map(f=>f.transform),dark:document.body.hasAttribute('data-ds-dark-theme'),calls:window.themeCalls.slice(),preference:window.hostTheme.getTheme().preference}
  })
  assert.equal(sample.duration,600);assert.match(sample.frames[0],/circle\(0px at/);assert.notEqual(sample.frames[0],sample.frames[1]);assert.equal(sample.dark,true);assert.deepEqual(sample.calls,['dark']);assert.equal(sample.preference,'dark')
  assert.ok(sample.orbFrames?.length>=2,'The actual glass orb receives a separate moving view-transition layer');assert.notEqual(sample.orbFrames[0],sample.orbFrames.at(-1))
  await page.screenshot({path:resolve(output,'theme-night-mid-reveal.png')})
  await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id==='dcb-theme-reveal'||a.effect?.pseudoElement==='::view-transition-group(dcb-theme-orb)')a.finish()});await idle()
  assert.equal(await button.getAttribute('data-scheme'),'dark');assert.equal(await button.evaluate(el=>el===window.originalThemeButton),true)
  assert.equal(await button.evaluate(el=>el.style.getPropertyValue('view-transition-name')),'');assert.equal(await button.locator('.dcb-theme-thumb').evaluate(el=>el.style.getPropertyValue('view-transition-name')),'')
  assert.equal(await button.getAttribute('data-dcb-theme-source'),null)
  assert.ok(await button.locator('.dcb-theme-stars i').first().evaluate(el=>getComputedStyle(el).animationName.includes('dcb-theme-star')))
  await page.screenshot({path:resolve(output,'theme-night.png')})
 })
 await check('both full-window color changes ease in over 600ms with a non-bouncing radius, gradual opacity and a gentle tail',async()=>{
  for(const scheme of['light','dark']){
   await button.evaluate(el=>el.click())
   await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-theme-reveal'))
   const samples=[]
   for(const time of[60,180,300,480,570]){
    samples.push(await page.evaluate(time=>{
     const animation=document.getAnimations().find(a=>a.id==='dcb-theme-reveal');animation.pause();animation.currentTime=time
     const style=getComputedStyle(document.documentElement,'::view-transition-new(root)')
     return{time,radius:parseFloat(style.clipPath.match(/circle\(([\d.]+)px/)?.[1]),opacity:Number(style.opacity),easing:animation.effect.getTiming().easing,progress:animation.effect.getComputedTiming().progress}
    },time))
    if(time===180||time===480)await page.screenshot({path:resolve(output,`theme-${scheme}-${time}ms.png`)})
   }
   assert.ok(samples.every(s=>Number.isFinite(s.radius)&&s.radius>0&&s.opacity>.2&&s.opacity<1),JSON.stringify(samples))
   assert.ok(samples.every((s,i)=>i===0||s.radius>samples[i-1].radius&&s.opacity>samples[i-1].opacity))
   assert.ok(samples[1].progress<.65&&samples[2].progress<.9,'The full-window reveal no longer races to its target in the first half')
   assert.ok((samples[4].radius-samples[3].radius)/90<(samples[2].radius-samples[1].radius)/120,'The last part slows down instead of snapping to rest')
   assert.ok(samples.every(s=>s.progress>=0&&s.progress<=1),'No radius or opacity overshoot')
   await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id==='dcb-theme-reveal')a.finish()});await idle()
   assert.equal(await button.getAttribute('data-scheme'),scheme)
   assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='dcb-theme-reveal').length),0)
  }
 })
 await check('natural playback keeps changing beyond the old 280ms cutoff and releases the full-window layer in both directions',async()=>{
  for(const scheme of['light','dark']){
   const samples=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const samples=[],start=performance.now();let seen=false
    document.querySelector('.dcb-theme-toggle').click()
    function sample(){
     const animation=document.getAnimations().find(a=>a.id==='dcb-theme-reveal')
     if(animation){
      seen=true
      const style=getComputedStyle(document.documentElement,'::view-transition-new(root)'),radius=parseFloat(style.clipPath.match(/circle\(([\d.]+)px/)?.[1])
      if(Number.isFinite(radius))samples.push({time:Number(animation.currentTime),radius,opacity:Number(style.opacity)})
     }
     if(seen&&!document.documentElement.hasAttribute('data-dcb-theme-transition')){resolve(samples);return}
     if(performance.now()-start>3000){reject(new Error('Theme reveal did not settle'));return}
     requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
   }))
   const middle=samples.filter(s=>s.radius>0&&s.opacity>.2&&s.opacity<1)
   assert.ok(middle.length>=8,JSON.stringify(samples))
   assert.ok(middle.some(s=>s.time>300&&s.time<550),'The reveal continues naturally after the former duration')
   assert.ok(middle.every((s,i)=>i===0||s.radius>=middle[i-1].radius&&s.opacity>=middle[i-1].opacity))
   assert.equal(await button.getAttribute('data-scheme'),scheme)
   assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='dcb-theme-reveal').length),0)
  }
 })
 await check('reversing a half-complete full-window reveal settles on the latest theme without stale layers',async()=>{
  await button.evaluate(el=>el.click())
  await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-theme-reveal'))
  await page.evaluate(()=>{const animation=document.getAnimations().find(a=>a.id==='dcb-theme-reveal');animation.pause();animation.currentTime=300})
  await button.evaluate(el=>el.click());await idle()
  assert.equal(await button.getAttribute('data-scheme'),'dark')
  assert.equal(await page.locator('[data-dcb-theme-source]').count(),0)
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='dcb-theme-reveal').length),0)
 })
 await check('keyboard switches back to daylight and the same host preference survives reload',async()=>{
  await button.focus();await button.press('Space');await idle();assert.equal(await button.getAttribute('aria-checked'),'false');assert.equal(await page.evaluate(()=>window.hostTheme.getTheme().preference),'light')
  await mount();assert.equal(await button.getAttribute('data-scheme'),'light');assert.equal(await page.evaluate(()=>window.hostTheme.getTheme().preference),'light')
 })
 await check('rapid repeated switches settle on the last request without queued reveals or stale inline state',async()=>{
  await button.evaluate(el=>{el.click();el.click();el.click()});await idle();assert.equal(await button.getAttribute('data-scheme'),'dark');assert.equal(await page.evaluate(()=>window.hostTheme.getTheme().preference),'dark')
  assert.equal(await page.locator('[data-dcb-theme-source]').count(),0);assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='dcb-theme-reveal').length),0)
  await button.evaluate(el=>{el.click();el.click()});await idle();assert.equal(await button.getAttribute('data-scheme'),'dark')
 })
 await check('native settings and cross-window preference changes update the button without writing a second preference',async()=>{
  await page.evaluate(()=>window.hostTheme.setTheme('light'));await idle();assert.equal(await button.getAttribute('data-scheme'),'light')
  const other=await context.newPage()
  try{await other.goto(url);await other.evaluate(()=>localStorage.setItem('fixture:host-theme','dark'));await page.waitForFunction(()=>document.querySelector('.dcb-theme-toggle')?.getAttribute('data-scheme')==='dark')}finally{await other.close()}
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('dsh-ui-beautify')&&/theme/.test(key)).every(key=>key==='dsh-ui-beautify:opening-theme:v1')),true)
 })
 await check('theme switching remains available with an empty session and the task panel disabled',async()=>{
  await page.evaluate(()=>{window.fixture.update([]);const key='dsh-ui-beautify:settings:v1',newValue=JSON.stringify({enabled:false});localStorage.setItem(key,newValue);window.dispatchEvent(new StorageEvent('storage',{key,newValue}))})
  await page.waitForFunction(()=>!document.querySelector('.dcb-entry'));assert.equal(await button.count(),1)
  await button.click();await idle();assert.equal(await button.getAttribute('data-scheme'),'light');await button.click();await idle();assert.equal(await button.getAttribute('data-scheme'),'dark')
 })
 await check('reduced motion and forced colors switch immediately while retaining a readable working control',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});const before=await page.evaluate(()=>window.fixtureTransitionStarts);await button.click();await idle();assert.equal(await page.evaluate(()=>window.fixtureTransitionStarts),before);assert.equal(await button.getAttribute('data-scheme'),'light')
  assert.equal(await button.locator('.dcb-theme-thumb').evaluate(el=>getComputedStyle(el).transitionDuration),'0s')
  await page.emulateMedia({forcedColors:'active'});await button.click();await idle();assert.equal(await button.getAttribute('data-scheme'),'dark');assert.equal(await button.evaluate(el=>getComputedStyle(el).backdropFilter),'none')
  assert.equal(await page.evaluate(()=>window.fixtureTransitionStarts),before);await page.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'});await idle()
 })
 await check('browsers without View Transitions keep animated glass controls and call the same host setter',async()=>{
  await page.evaluate(()=>document.startViewTransition=undefined);await button.click();await page.waitForFunction(()=>document.documentElement.hasAttribute('data-dcb-theme-fallback'))
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).transitionDuration),'0.6s, 0.6s')
  const thumb=await button.locator('.dcb-theme-thumb').evaluate(el=>{const a=el.getAnimations().find(a=>a.transitionProperty==='transform');if(a){a.pause();a.currentTime=100}return{x:new DOMMatrix(getComputedStyle(el).transform).m41,moving:!!a}});assert.ok(thumb.moving&&thumb.x>0&&thumb.x<38,JSON.stringify(thumb))
  await button.locator('.dcb-theme-thumb').evaluate(el=>el.getAnimations().forEach(a=>a.play()))
  await idle();assert.equal(await button.getAttribute('data-scheme'),'light');assert.equal(await page.locator('[data-dcb-theme-fallback]').count(),0)
 })
 await check('a failed host settings write leaves the current theme intact and allows a successful retry',async()=>{
  await page.evaluate(()=>window.failTheme=true);await button.click();await idle();assert.equal(await button.getAttribute('data-scheme'),'light');assert.equal(await button.getAttribute('data-transitioning'),'false');assert.equal(await page.getByRole('status').filter({hasText:'主题切换失败，请重试'}).count(),1)
  await page.evaluate(()=>window.failTheme=false);await button.click();await idle();assert.equal(await button.getAttribute('data-scheme'),'dark')
 })
 await check('narrow layouts retain the button and disposal cancels an active reveal without undoing the user preference',async()=>{
  await page.setViewportSize({width:390,height:844});const box=await button.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390);await page.screenshot({path:resolve(output,'theme-narrow.png')})
  await mount();await button.evaluate(el=>el.click());await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-theme-reveal'))
  const chosen=await page.evaluate(()=>window.hostTheme.getTheme().preference)
  await page.evaluate(()=>{for(const cleanup of [...window.cleanups].reverse())if(typeof cleanup==='function')cleanup()});await idle();assert.equal(await page.locator('[data-dcb-theme-source]').count(),0);assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='dcb-theme-reveal').length),0);assert.equal(await page.evaluate(()=>window.hostTheme.getTheme().preference),chosen)
 })
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
