import assert from'node:assert/strict'
import{readFileSync,mkdirSync,writeFileSync}from'node:fs'
import{createServer}from'node:http'
import{fileURLToPath}from'node:url'
import{resolve}from'node:path'
import{build}from'esbuild'
import{chromium}from'@playwright/test'
import{nativeLogo,installLogoFixture}from'./native-logo.mjs'
import{nativeHeaderFixture}from'./native-header.mjs'
import{selectSettingsCategory}from'./settings-navigation.mjs'
import vm from'node:vm'
import{particleOccupancy}from'../src/context-particle-config.js'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'context-integration')
mkdirSync(output,{recursive:true})
const fixture=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[new URL(req.url,'http://localhost').pathname];if(!route){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-ui-beautify:settings:v1',logo=nativeLogo()||{path:'M1 6Q7 1 13 6L22 1V9L17 8Q13 18 5 14Q1 11 1 6Z',width:24,height:18},native=nativeHeaderFixture()
if(native){const occupancy=vm.runInNewContext(native.contextOccupancy+';contextOccupancy');for(const input of[{}, {projectedTokens:0,pressureTokens:900,contextWindow:1000},{projectedTokens:355,contextWindow:1000},{pressureTokens:755,contextWindow:1000},{projectedTokens:1500,contextWindow:1000}])assert.equal(particleOccupancy(input),occupancy(input)?.percent??null)}
const browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],external=[],checks=[]
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(url))external.push(r.url())})
const snapshot=()=>page.evaluate(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot())
const scene=async()=> (await snapshot()).scenes[0]
const pressure=async(value,id)=>page.evaluate(([value,id])=>window.fixture.pressure(value,id),[value,id])
const settle=async(target)=>page.waitForFunction(target=>{const s=window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0];return s?.ready&&Math.abs(s.progress-target)<.002},target)
const select=name=>selectSettingsCategory(page,name)
async function mount(target=page){
  await target.goto(url)
  await target.getByTestId('todo-panel').waitFor();await target.evaluate(installLogoFixture,logo)
  await target.evaluate(()=>{window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:window.fixtureFishLogo,FISH_LOGO_PATH:window.nativeLogo.path,FISH_LOGO_VIEWBOX:window.nativeLogo}:window.fixtureReact)}})
  await target.addScriptTag({url:url+'/client.js'})
  await target.evaluate(()=>{const ctx={slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
  await target.addStyleTag({content:'.settings-dialog{inset:54px 14%;padding:24px}.dcb-settings{font-size:14px}'+(native?.css||'')})
}
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
async function settings(){await page.evaluate(()=>window.fixture.settings(true));await select('粒子背景')}
async function closeSettings(){await page.getByRole('button',{name:'关闭设置',exact:true}).click();await page.waitForTimeout(400)}
async function number(label,value){const field=page.getByRole('spinbutton',{name:label,exact:true});await field.fill(String(value));await field.press('Enter');await page.waitForTimeout(80)}
try{
  await mount()
  await check('default is native DeepSeek Logo and real contextPressure; unknown data is hidden',async()=>{
    await page.waitForFunction(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes.length)
    const initial=await snapshot();assert.equal(initial.shape,'logo');assert.equal(initial.count,9600);assert.equal(initial.start,0);assert.equal(initial.full,80)
    assert.equal(initial.scenes[0].percent,null)
    await pressure({projectedTokens:24000,pressureTokens:80000,contextWindow:100000});await settle(.30)
    assert.equal((await scene()).percent,24);assert.equal((await scene()).shape,'logo');assert.equal((await scene()).mode,'WebGL2')
    const box=await page.locator('[data-conversation-content]').boundingBox(),r=(await scene()).rect
    assert.ok(Math.abs(r[0]+r[2]/2-box.width/2)<2)
    assert.equal(await page.locator('.dcb-particle-layer').evaluate(el=>getComputedStyle(el).pointerEvents),'none')
    await page.screenshot({path:resolve(output,'logo-context-24.png')})
    await pressure({pressureTokens:80000,contextWindow:100000});await settle(1)
    await page.screenshot({path:resolve(output,'logo-context-80.png')})
  })
  await check('new-session particles center on the full background and follow phase changes without restarting',async()=>{
    const heroStyle=await page.addStyleTag({content:'[data-particle-position-test] article{display:none}[data-particle-position-test] [data-conversation-scroll]{justify-content:center}[data-particle-position-test] [data-composer-seat]{position:relative;bottom:auto;flex:none;min-height:220px}'}),host=page.locator('[data-conversation-content]')
    const originalPhase=await host.getAttribute('data-content-phase')
    await host.evaluate(el=>{el.setAttribute('data-particle-position-test','');el.setAttribute('data-content-phase','hero');window.particleCanvasBeforeHero=el.querySelector('canvas')})
    const centered=()=>page.waitForFunction(()=>{const host=document.querySelector('[data-conversation-content]'),r=window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0]?.rect;return r&&Math.abs(r[1]+r[3]/2-host.getBoundingClientRect().height/2)<4})
    await centered()
    const before=await scene()
    await page.screenshot({path:resolve(output,'new-session-centered.png')})
    await page.setViewportSize({width:640,height:900});await centered()
    await page.setViewportSize({width:1440,height:1000});await centered()
    // Only the native phase attribute changes here; no resize or pressure update
    // can wake the renderer. Active conversations must still reserve the composer.
    await host.evaluate(el=>el.setAttribute('data-content-phase','active'))
    await page.waitForFunction(()=>{const host=document.querySelector('[data-conversation-content]'),box=host.getBoundingClientRect(),bottom=host.querySelector('[data-composer-seat]').getBoundingClientRect().top-box.top,r=window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0]?.rect;return r&&Math.abs(r[1]+r[3]/2-bottom/2)<4})
    await host.evaluate(el=>el.setAttribute('data-content-phase','hero'));await centered()
    assert.equal(await host.evaluate(el=>el.querySelector('canvas')===window.particleCanvasBeforeHero),true)
    const after=await scene();assert.ok(after.progress>.99);assert.ok(after.frames>=before.frames);assert.ok(after.time>=before.time)
    await host.evaluate((el,phase)=>{el.removeAttribute('data-particle-position-test');if(phase===null)el.removeAttribute('data-content-phase');else el.setAttribute('data-content-phase',phase)},originalPhase)
    await heroStyle.evaluate(el=>el.remove())
  })
  await check('settings have custom controls, configurable count and thresholds, and pause hidden drawing',async()=>{
    await settings();assert.equal(await page.getByRole('tabpanel').locator('select,input[type=checkbox],input[type=radio],input[type=range]').count(),0)
    const conversion=page.getByRole('slider',{name:'转换进度',exact:true})
    assert.equal(await conversion.getAttribute('aria-valuenow'),'100')
    assert.equal(await conversion.getAttribute('aria-valuemax'),'100')
    await number('粒子数',25000);assert.equal((await snapshot()).count,20000)
    assert.equal(await page.getByRole('button',{name:'增加粒子数',exact:true}).isDisabled(),true)
    await number('粒子数',500);assert.equal((await snapshot()).count,500)
    await number('粒子数',3200);await number('开始显示百分比',20);await number('完整成形百分比',60)
    assert.equal(await conversion.getAttribute('aria-valuenow'),'100','particle quantity does not change conversion progress')
    const numberInput=page.getByRole('spinbutton',{name:'粒子数',exact:true});await numberInput.fill('9000');await numberInput.press('Escape');assert.equal((await snapshot()).count,3200)
    const before=(await scene()).frames;await page.waitForTimeout(250);assert.equal((await scene()).frames,before)
    await page.evaluate(()=>window.backgroundCanvasBeforeTab=document.querySelector('.dcb-particle-layer canvas'))
    await select('侧栏');await select('粒子背景')
    assert.equal(await page.evaluate(()=>window.backgroundCanvasBeforeTab===document.querySelector('.dcb-particle-layer canvas')),true,'settings categories retain the paused background canvas')
    await page.screenshot({path:resolve(output,'particle-settings-light.png')})
    await closeSettings();await pressure({projectedTokens:40000,contextWindow:100000});await settle(.5)
    assert.equal((await snapshot()).count,3200);assert.equal((await scene()).percent,40)
    await pressure({projectedTokens:10000,contextWindow:100000});await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.dcb-particle-layer')).opacity)===0)
    assert.equal((await scene()).visible,false);assert.equal(await page.locator('.dcb-particle-layer').evaluate(el=>Number(getComputedStyle(el).opacity)),0)
  })
  await check('left/right sidebar layout changes and transient host hiding retain the live canvas and particle progress',async()=>{
    await pressure({projectedTokens:40000,contextWindow:100000});await settle(.5)
    await page.evaluate(()=>{
      window.particleCanvasBeforeSidebar=document.querySelector('.dcb-particle-layer canvas')
      window.particleContextLosses=0;window.particleCanvasBeforeSidebar.addEventListener('webglcontextlost',()=>window.particleContextLosses++)
      window.particleFramesBeforeSidebar=window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0].frames
      window.particleTimeBeforeSidebar=window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0].time
    })
    for(const open of[true,false,true,false]){
      await page.evaluate(open=>{window.fixture.sidebar(open);document.querySelector('.nav').style.display=open?'none':''},open)
      await page.waitForTimeout(100)
      assert.equal(await page.evaluate(()=>window.particleCanvasBeforeSidebar===document.querySelector('.dcb-particle-layer canvas')),true)
      assert.ok((await scene()).progress>.49)
    }
    await page.evaluate(()=>document.querySelector('[data-conversation-content]').style.display='none')
    await page.waitForTimeout(180)
    await page.evaluate(()=>document.querySelector('[data-conversation-content]').style.display='')
    await page.waitForFunction(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0]?.visible)
    assert.equal(await page.evaluate(()=>window.particleCanvasBeforeSidebar===document.querySelector('.dcb-particle-layer canvas')),true,'a temporary layout gap reuses the existing canvas')
    assert.ok((await scene()).progress>.49,'gather progress does not restart')
    assert.ok((await scene()).frames>=await page.evaluate(()=>window.particleFramesBeforeSidebar),'the same renderer continues')
    assert.ok((await scene()).time>=await page.evaluate(()=>window.particleTimeBeforeSidebar),'particle motion keeps its phase')
    assert.equal(await page.evaluate(()=>window.particleContextLosses),0)
  })
  await check('temporary host and pressure publisher remounts preserve the canvas without replaying its entrance',async()=>{
    await page.evaluate(()=>window.fixture.detach(true));await page.waitForTimeout(200)
    assert.equal(await page.evaluate(()=>window.particleCanvasBeforeSidebar.isConnected),false)
    await page.evaluate(()=>window.fixture.detach(false))
    await page.waitForFunction(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0]?.visible)
    assert.equal(await page.evaluate(()=>window.particleCanvasBeforeSidebar===document.querySelector('.dcb-particle-layer canvas')),true,'a new host receives the same session canvas')
    assert.ok((await scene()).progress>.49)
    await page.evaluate(()=>{window.savedParticleHeader=window.fixtureHeader;window.fixtureHeader=null;window.fixture.refresh()});await page.waitForTimeout(200)
    assert.equal((await scene()).percent,40,'a publisher layout gap retains its last real reading')
    await page.evaluate(()=>{window.fixtureHeader=window.savedParticleHeader;delete window.savedParticleHeader;window.fixture.refresh()});await page.waitForTimeout(100)
    assert.equal(await page.evaluate(()=>window.particleCanvasBeforeSidebar===document.querySelector('.dcb-particle-layer canvas')),true)
    assert.ok((await scene()).progress>.49)
    assert.equal(await page.evaluate(()=>window.particleCanvasBeforeSidebar.getAnimations().length),0,'the shape entrance is not replayed')
    assert.equal(await page.evaluate(()=>window.particleContextLosses),0)
    await pressure(null);await page.waitForTimeout(200);assert.equal((await scene()).percent,40)
    await page.waitForFunction(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0]?.percent===null)
    assert.equal((await scene()).visible,false,'lasting unknown pressure stops showing the previous reading')
    await pressure({projectedTokens:40000,contextWindow:100000});await settle(.5)
  })
  await check('sidebar measurement clones are ignored and abandoned scenes release their graphics context',async()=>{
    await page.evaluate(()=>{
      const probe=document.createElement('div');probe.setAttribute('data-dcb-sidebar-layout-probe','');probe.style.cssText='position:fixed;left:-10000px;width:1000px;height:700px;visibility:hidden'
      const clone=document.querySelector('[data-conversation-content]').cloneNode(false);probe.append(clone);document.body.prepend(probe)
    });await page.waitForTimeout(100)
    assert.equal((await snapshot()).scenes.length,1)
    assert.equal(await page.locator('[data-dcb-sidebar-layout-probe] .dcb-particle-layer').count(),0)
    await page.evaluate(()=>document.querySelector('[data-dcb-sidebar-layout-probe]').remove())
    await page.evaluate(()=>{window.abandonedParticleCanvas=document.querySelector('.dcb-particle-layer canvas');window.abandonedParticleGL=window.abandonedParticleCanvas.getContext('webgl2');window.fixture.detach(true)})
    await page.waitForFunction(()=>window.abandonedParticleGL.isContextLost())
    assert.equal((await snapshot()).scenes.length,0)
    await page.evaluate(()=>window.fixture.detach(false));await settle(.5)
    assert.equal(await page.evaluate(()=>window.abandonedParticleCanvas===document.querySelector('.dcb-particle-layer canvas')),false,'returning after the bounded grace period creates a fresh scene')
    await page.evaluate(()=>{window.hiddenParticleGL=document.querySelector('.dcb-particle-layer canvas').getContext('webgl2');document.querySelector('[data-conversation-content]').style.display='none'})
    await page.waitForFunction(()=>window.hiddenParticleGL.isContextLost())
    await page.evaluate(()=>document.querySelector('[data-conversation-content]').style.display='')
    await settle(.5)
    assert.equal((await scene()).visible,true,'a long-hidden host can wake after its graphics cache was released')
  })
  await check('whale girl, compression, sessions, dark theme and responsive layout remain linked',async()=>{
    await settings();await page.getByRole('radio',{name:'鲸鱼娘',exact:true}).click();await closeSettings()
    await pressure({projectedTokens:60000,contextWindow:100000});await settle(1)
    assert.equal((await scene()).shape,'whale')
    await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.waitForTimeout(800)
    await page.screenshot({path:resolve(output,'whale-dark-60.png')})
    await pressure({projectedTokens:28000,contextWindow:100000});await settle(.2)
    assert.equal((await scene()).percent,28)
    await page.evaluate(()=>window.fixture.session('b'));await page.waitForTimeout(350);assert.equal((await scene()).percent,null)
    await pressure({pressureTokens:36000,contextWindow:100000});await settle(.4);assert.equal((await scene()).percent,36)
    await page.setViewportSize({width:430,height:932});await page.waitForTimeout(500)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    await page.screenshot({path:resolve(output,'particles-mobile.png')})
    await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>window.fixture.session('a'));await pressure({projectedTokens:40000,contextWindow:100000});await settle(.5)
  })
  await check('local SVG import strips active/external content, persists and leaves original on invalid input',async()=>{
    await settings()
    const upload=async(text,name)=>{await page.locator('[data-dcb-settings-block=particles] input[accept*="svg"]').setInputFiles({name,mimeType:'image/svg+xml',buffer:Buffer.from(text)});await page.waitForTimeout(600)}
    await upload('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" onload="window.svgExecuted=true"><script>fetch("https://example.invalid/evil")</script><image href="https://example.invalid/a.png"/><path d="M10 80Q100 -50 190 80L100 110Z" fill="#4d6bfe"/></svg>','测试图形.svg')
    await page.getByRole('radio',{name:'自定义 SVG',exact:true}).waitFor();assert.equal(await page.getByRole('radio',{name:'自定义 SVG',exact:true}).getAttribute('aria-checked'),'true')
    assert.equal(await page.evaluate(()=>window.svgExecuted),undefined)
    assert.ok(!(await page.evaluate(key=>localStorage.getItem(key),key)).includes('<svg'))
    await upload('<svg viewBox="0 0 10 10"></svg>','空白.svg');await page.getByRole('alert').waitFor()
    const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(saved.particleSvgName,'测试图形.svg')
    await page.screenshot({path:resolve(output,'particle-settings-dark.png')})
    await closeSettings();await pressure({projectedTokens:60000,contextWindow:100000});await settle(1)
    assert.equal((await scene()).shape,'custom');await page.screenshot({path:resolve(output,'custom-svg.png')})
    await page.reload();await mount();await pressure({projectedTokens:60000,contextWindow:100000});await settle(1);assert.equal((await scene()).shape,'custom');assert.equal((await snapshot()).count,3200,'density survives a page reload')
  })
  await check('disable, reduced motion and uninstall release drawing and restore the host',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});await pressure({projectedTokens:40000,contextWindow:100000});await settle(.5)
    // Progress can settle before the final native geometry publication draws
    // its static frame. First require quiescence, then test that it stays idle.
    await page.waitForFunction(()=>{const frames=window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0].frames,now=performance.now();if(window.particleIdleProbe?.frames!==frames)window.particleIdleProbe={frames,since:now};return now-window.particleIdleProbe.since>=80})
    const before=(await scene()).frames;await page.waitForTimeout(250);assert.equal((await scene()).frames,before)
    await settings()
    await page.evaluate(()=>{window.disabledParticleGL=document.querySelector('.dcb-particle-layer canvas').getContext('webgl2');window.fixture.detach(true)});await page.waitForTimeout(100)
    await page.getByRole('switch',{name:'会话粒子背景',exact:true}).click();await page.waitForTimeout(150)
    assert.equal(await page.evaluate(()=>window.disabledParticleGL.isContextLost()),true,'disabling also releases a retained scene immediately')
    assert.equal(await page.locator('.dcb-particle-layer').count(),0);assert.equal(await page.locator('[data-dcb-particles-host]').count(),0)
    await page.getByRole('switch',{name:'会话粒子背景',exact:true}).click();await page.evaluate(()=>window.fixture.detach(false));await closeSettings();await settle(.5)
    await page.evaluate(()=>{for(const cleanup of window.cleanups.reverse())if(typeof cleanup==='function')cleanup()});await page.waitForTimeout(100)
    assert.equal(await page.locator('.dcb-particle-layer').count(),0);assert.equal(await page.locator('[data-dcb-particles-host]').count(),0)
    assert.equal(await page.evaluate(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')]),undefined)
  })
  const fallback=await context.newPage();fallback.on('pageerror',e=>errors.push(e.message))
  await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:get.call(this,type,...args)}})
  await mount(fallback);await fallback.evaluate(()=>window.fixture.pressure({projectedTokens:45000,contextWindow:100000}));await fallback.waitForFunction(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0]?.ready)
  assert.equal(await fallback.evaluate(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0].mode),'Canvas 2D')
  await fallback.evaluate(()=>document.querySelector('[data-conversation-content]').setAttribute('data-content-phase','hero'))
  await fallback.waitForFunction(()=>{const host=document.querySelector('[data-conversation-content]'),r=window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0]?.rect;return r&&Math.abs(r[1]+r[3]/2-host.getBoundingClientRect().height/2)<4})
  await fallback.screenshot({path:resolve(output,'fallback.png')});await fallback.close()
  checks.push('WebGL unavailable uses bounded Canvas 2D')
  assert.deepEqual(errors,[]);assert.deepEqual(external,[])
  writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors,external,nativeLogo:!!process.env.DSH_ASAR},null,2));console.log(JSON.stringify({checks,output},null,2))
}finally{await browser.close();await new Promise(done=>server.close(done))}
