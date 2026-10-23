import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeLogo,installLogoFixture} from './native-logo.mjs'
import {selectSettingsCategory} from './settings-navigation.mjs'
import {PARTICLE_COUNTS} from '../src/context-particle-config.js'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','.scratch','claude-beautify'),'particle-conversion')
mkdirSync(output,{recursive:true})
const fixture=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[new URL(req.url,'http://localhost').pathname];if(!route){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-claude-beautify:settings:v1',logo=nativeLogo()||{path:'M1 6Q7 1 13 6L22 1V9L17 8Q13 18 5 14Q1 11 1 6Z',width:24,height:18}
const browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage(),errors=[],checks=[]
context.on('page',target=>target.on('pageerror',error=>errors.push(error.message)))
page.on('pageerror',error=>errors.push(error.message))
const snapshot=(target=page)=>target.evaluate(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot())
const pressure=(value,target=page)=>target.evaluate(value=>window.fixture.pressure(value),value)
const settle=(value,target=page)=>target.waitForFunction(value=>{const s=window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0];return s?.ready&&s.visible&&Math.abs(s.progress-value)<.002},value)
const mode=name=>page.getByRole('radiogroup',{name:'转换进度来源',exact:true}).getByRole('radio',{name,exact:true})
const slider=()=>page.getByRole('slider',{name:'转换进度',exact:true})
const meter=()=>page.getByRole('progressbar',{name:'当前上下文占用',exact:true})
async function progressKey(key,value){await slider().press(key);await page.waitForFunction(value=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().manualProgress===value,value)}
async function mount(target=page){
  await target.goto(url);await target.getByTestId('todo-panel').waitFor();await target.evaluate(installLogoFixture,logo)
  await target.evaluate(()=>{window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:window.fixtureFishLogo,FISH_LOGO_PATH:window.nativeLogo.path,FISH_LOGO_VIEWBOX:window.nativeLogo}:window.fixtureReact)}})
  await target.addScriptTag({url:url+'/client.js'})
  await target.evaluate(()=>{const ctx={slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
  await target.addStyleTag({content:'.settings-dialog{inset:30px 12%;padding:24px}.dcb-settings{font-size:14px}'})
}
async function settings(){await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'粒子背景')}
async function close(){await page.getByRole('button',{name:'关闭设置',exact:true}).click();await page.waitForTimeout(350)}
async function number(label,value){const field=page.getByRole('spinbutton',{name:label,exact:true});await field.fill(String(value));await field.press('Enter');await page.waitForTimeout(60)}
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
try{
  await mount()
  await check('legacy settings default to context conversion while keeping particle quantity independent',async()=>{
    await pressure({projectedTokens:24000,contextWindow:100000});await settle(.3);await settings()
    assert.equal(await mode('跟随上下文').getAttribute('aria-checked'),'true')
    assert.equal(await slider().getAttribute('aria-valuemin'),'0');assert.equal(await slider().getAttribute('aria-valuemax'),'100')
    assert.equal(await slider().getAttribute('aria-valuenow'),'30');assert.equal(await meter().getAttribute('aria-valuenow'),'24')
    assert.equal(await page.getByRole('slider',{name:'粒子浓度',exact:true}).count(),0)
    assert.equal((await snapshot()).count,PARTICLE_COUNTS.default)
    await number('开始显示百分比',20);await number('完整成形百分比',60)
    await pressure({projectedTokens:40000,contextWindow:100000});await page.waitForTimeout(100)
    assert.equal(await slider().getAttribute('aria-valuenow'),'50');assert.equal(await meter().getAttribute('aria-valuenow'),'40')
  })
  await check('dragging conversion switches to manual without changing count, canvas or live context',async()=>{
    await page.evaluate(()=>window.conversionCanvas=document.querySelector('.dcb-particle-layer canvas'))
    await slider().scrollIntoViewIfNeeded();const box=await slider().boundingBox()
    await page.mouse.move(box.x+10,box.y+box.height/2);await page.mouse.down()
    await page.mouse.move(box.x+10+(box.width-20)*.7,box.y+box.height/2,{steps:5});await page.waitForTimeout(100)
    assert.equal((await snapshot()).progressMode,'manual');assert.ok(Math.abs((await snapshot()).manualProgress-70)<=1)
    assert.equal((await snapshot()).count,PARTICLE_COUNTS.default)
    await page.mouse.move(box.x+box.width+30,box.y+box.height/2);await page.mouse.up();await page.waitForTimeout(80)
    assert.equal((await snapshot()).manualProgress,100)
    await progressKey('Home',0);await progressKey('ArrowLeft',0)
    await progressKey('ArrowRight',1)
    await progressKey('End',100);await progressKey('PageDown',90)
    await number('转换进度百分比',65)
    await number('粒子数',12800)
    assert.equal(await slider().getAttribute('aria-valuenow'),'65');assert.equal((await snapshot()).count,12800)
    await pressure({projectedTokens:10000,contextWindow:100000});await page.waitForTimeout(120)
    assert.equal(await meter().getAttribute('aria-valuenow'),'10');assert.equal(await slider().getAttribute('aria-valuenow'),'65')
    await page.getByRole('radiogroup',{name:'粒子图形',exact:true}).getByRole('radio',{name:'鲸鱼娘',exact:true}).click()
    await page.screenshot({path:resolve(output,'manual-settings.png')})
    await close();await settle(.65)
    assert.equal(await page.evaluate(()=>window.conversionCanvas===document.querySelector('.dcb-particle-layer canvas')),true)
    await page.evaluate(()=>window.fixture.sidebar(true));await settle(.65)
    assert.equal(await page.evaluate(()=>window.conversionCanvas===document.querySelector('.dcb-particle-layer canvas')),true)
  })
  await check('manual conversion works without context and persists across reloads and other windows',async()=>{
    await pressure(null);await page.waitForFunction(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().contextPercent===null)
    await settle(.65)
    await page.evaluate(()=>{window.savedParticleHeader=window.fixtureHeader;window.fixtureHeader=null;window.fixture.refresh()});await page.waitForTimeout(1700)
    await settle(.65)
    assert.equal(await page.evaluate(()=>window.conversionCanvas===document.querySelector('.dcb-particle-layer canvas')),true,'manual conversion does not depend on a pressure publisher')
    await page.evaluate(()=>{window.fixtureHeader=window.savedParticleHeader;delete window.savedParticleHeader;window.fixture.refresh()})
    await page.screenshot({path:resolve(output,'manual-background.png')})
    await settings();assert.equal(await meter().getAttribute('aria-valuenow'),null)
    assert.equal(await slider().getAttribute('aria-valuenow'),'65')
    await number('转换进度百分比',0);await close();await settle(0)
    await settings();await number('转换进度百分比',100);await close();await settle(1)
    await page.screenshot({path:resolve(output,'manual-complete.png')})
    await page.reload();await mount();await settle(1)
    assert.equal((await snapshot()).progressMode,'manual');assert.equal((await snapshot()).count,12800)
    const other=await context.newPage();await mount(other);await settle(1,other)
    assert.equal((await snapshot(other)).manualProgress,100)
    await settings();await number('转换进度百分比',35);await page.waitForFunction(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().manualProgress===35)
    await settle(.35,other);await other.close()
    await mode('跟随上下文').click();await close()
    await page.waitForFunction(()=>!window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0]?.visible)
    await pressure({projectedTokens:40000,contextWindow:100000});await settle(.5)
    await settings();await mode('手动调整').click();assert.equal(await slider().getAttribute('aria-valuenow'),'35')
  })
  await check('context meter stays live while background is disabled and both modes remain accessible on narrow dark layouts',async()=>{
    await page.getByRole('switch',{name:'会话粒子背景',exact:true}).click();await pressure({projectedTokens:55000,contextWindow:100000});await page.waitForTimeout(120)
    assert.equal((await snapshot()).scenes.length,0);assert.equal(await meter().getAttribute('aria-valuenow'),'55')
    await page.getByRole('switch',{name:'会话粒子背景',exact:true}).click();await mode('跟随上下文').click()
    await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.setViewportSize({width:430,height:932})
    await page.addStyleTag({content:'.settings-dialog{inset:12px;padding:12px}'})
    await page.waitForTimeout(150);await slider().scrollIntoViewIfNeeded()
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    await mode('跟随上下文').press('ArrowRight');assert.equal(await mode('手动调整').getAttribute('aria-checked'),'true')
    await page.screenshot({path:resolve(output,'manual-settings-mobile-dark.png')})
    await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});await progressKey('Home',0)
    assert.equal((await snapshot()).manualProgress,0)
    await page.emulateMedia({forcedColors:'none'});await close();await settle(0)
  })
  const fallback=await browser.newPage({viewport:{width:1200,height:900}})
  fallback.on('pageerror',error=>errors.push(error.message))
  await fallback.addInitScript(key=>{
    const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:get.call(this,type,...args)}
    localStorage.setItem(key,JSON.stringify({particleProgressMode:'manual',particleManualProgress:75,particleShape:'whale',particleCount:12800,particleDensityVersion:1,welcomeEnabled:false}))
  },key)
  await mount(fallback);await settle(.75,fallback)
  assert.equal((await snapshot(fallback)).scenes[0].mode,'Canvas 2D');assert.equal((await snapshot(fallback)).contextPercent,null)
  await fallback.close();checks.push('Canvas 2D also honors manual conversion with no context data')
  assert.deepEqual(errors,[])
  writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,output},null,2))
}finally{await browser.close();await new Promise(done=>server.close(done))}
