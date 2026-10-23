import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeLogo,installLogoFixture} from './native-logo.mjs'
import {selectSettingsCategory} from './settings-navigation.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'welcome-settings')
mkdirSync(output,{recursive:true})
const fixture=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-claude-beautify:settings:v1'
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),context=await browser.newContext({viewport:{width:1200,height:950}}),page=await context.newPage(),errors=[]
page.on('pageerror',e=>errors.push(e.message))
const settings=page.locator('[data-dcb-settings-block=welcome]'),text=page.getByRole('textbox',{name:'欢迎文字'}),font=page.getByRole('textbox',{name:'欢迎字体'})
const stored=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
let passed=0
const logo=nativeLogo()
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function mount(){
  await page.getByTestId('todo-panel').waitFor()
  await page.evaluate(installLogoFixture,logo)
  await page.evaluate(()=>{window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:window.fixtureFishLogo,FISH_LOGO_PATH:window.nativeLogo?.path,FISH_LOGO_VIEWBOX:window.nativeLogo}:window.fixtureReact)}})
  await page.addScriptTag({url:url+'/client.js'})
  await page.evaluate(()=>{const ctx={slots:{inject(_name,cb){cb()},register(spec,c){if(spec.name==='settings.section')window.fixtureSettings=c;else{window.fixtureHeader=c;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
}
async function openSettings(){await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'开屏欢迎');await settings.waitFor();await page.waitForTimeout(300)}
const ink=()=>page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-startup-ink-')).length)
try{
  await page.goto(url);await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,width:350,messageMotion:false})),key);await mount();await openSettings()
  await check('welcome has custom switches and radios, editable local font and text, with no native select or checkbox',async()=>{
    assert.equal(await page.getByRole('switch',{name:'开屏欢迎动效'}).getAttribute('aria-checked'),'false')
    assert.equal(await text.inputValue(),'欢迎回来');assert.equal(await font.inputValue(),'Lolita')
    assert.equal(await settings.locator('select,input[type=checkbox],input[type=radio],input[type=range]').count(),0)
    assert.equal(await settings.getByRole('radiogroup',{name:'书写速度'}).getByRole('radio').count(),5)
    if(logo)assert.equal(await settings.locator('.dcb-welcome-preview-brand path').getAttribute('d'),logo.path)
    await settings.locator('[data-dcb-welcome-art]').waitFor();assert.equal(await ink(),0)
  })
  await check('text, font and keyboard speed choices persist without changing other plugin preferences',async()=>{
    await text.fill('DeepSeek Harness');await text.press('Tab');await font.fill('Lolita');await font.press('Tab')
    await settings.getByRole('radio',{name:/慢速/}).click();assert.equal((await stored()).welcomeDuration,3200)
    await settings.getByRole('radio',{name:/适中/}).focus();await page.keyboard.press('End')
    const value=await stored();assert.equal(value.welcomeText,'DeepSeek Harness');assert.equal(value.welcomeFont,'Lolita');assert.equal(value.welcomeDuration,4000);assert.equal(value.width,350);assert.equal(value.messageMotion,false)
    await page.reload();await mount();await openSettings();assert.equal(await text.inputValue(),'DeepSeek Harness');assert.equal(await settings.getByRole('radio',{name:/更慢/}).getAttribute('aria-checked'),'true')
    await page.waitForFunction(()=>[...document.querySelectorAll('.dcb-welcome-demo [data-welcome-character]')].map(el=>el.getAttribute('data-welcome-character')).join('')==='DeepSeek Harness')
    assert.equal(await settings.locator('[data-dcb-welcome-art]').evaluate(el=>{const b=el.getBBox(),v=el.viewBox.baseVal;return b.x>=v.x&&b.x+b.width<=v.x+v.width}),true)
  })
  await check('preview writes several actual intermediate frames and leaves the draft node and selection untouched',async()=>{
    await page.evaluate(()=>{const draft=document.createElement('textarea');draft.id='untouched-draft';draft.value='保留现有草稿';document.body.append(draft);draft.setSelectionRange(2,5);window.originalDraft=draft})
    await settings.getByRole('button',{name:'播放欢迎预览'}).click()
    await page.waitForTimeout(300);assert.ok(await ink()>0)
    const samples=[]
    for(let i=0;i<4;i++){samples.push(await settings.locator('[data-dcb-welcome-stroke]').first().evaluate(el=>getComputedStyle(el).strokeDashoffset));await page.waitForTimeout(55)}
    // The first short path may already be complete; sample the currently moving paths too.
    const moving=await settings.locator('[data-dcb-welcome-stroke]').evaluateAll(nodes=>nodes.map(el=>Number.parseFloat(getComputedStyle(el).strokeDashoffset)))
    assert.ok(moving.some(n=>n===0)&&moving.some(n=>n>0))
    assert.deepEqual(await page.evaluate(()=>{const el=document.querySelector('#untouched-draft');return[el===window.originalDraft,el.value,el.selectionStart,el.selectionEnd]}),[true,'保留现有草稿',2,5])
    await settings.getByRole('button',{name:'重新播放欢迎预览'}).click();await page.waitForTimeout(4300)
    assert.equal(await ink(),0);assert.equal(await settings.getByRole('button',{name:'播放欢迎预览'}).count(),1)
    await settings.screenshot({path:resolve(output,'lolita-settings-light.png')})
  })
  await check('switch changes apply on the next page startup; enabling does not cover the current conversation',async()=>{
    await page.getByRole('switch',{name:'开屏欢迎动效'}).click();assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
    await page.reload();await mount();await page.getByRole('status',{name:'DeepSeek Harness'}).waitFor()
    assert.equal(await page.locator('[data-dcb-welcome-art]').getAttribute('data-welcome-font'),'Lolita')
    assert.equal(await page.locator('[data-dcb-welcome] [data-welcome-character]').evaluateAll(nodes=>nodes.map(el=>el.getAttribute('data-welcome-character')).join('')),'DeepSeek Harness')
    await page.keyboard.press('Escape');await openSettings()
    assert.equal(await page.getByRole('switch',{name:'开屏欢迎动效'}).getAttribute('aria-checked'),'true')
    await page.getByRole('switch',{name:'开屏欢迎动效'}).click()
  })
  await check('other windows synchronize welcome preferences without replaying the opening',async()=>{
    const other=await context.newPage();await other.goto(url)
    await other.evaluate(key=>localStorage.setItem(key,JSON.stringify({...JSON.parse(localStorage.getItem(key)),welcomeText:'你好呀',welcomeFont:'KaiTi',welcomeDuration:1200})),key)
    await page.waitForFunction(()=>document.querySelector('input[aria-label="欢迎文字"]')?.value==='你好呀')
    assert.equal(await font.inputValue(),'KaiTi');assert.equal(await page.locator('[data-dcb-welcome]').count(),0);await other.close()
  })
  await check('dark and narrow settings keep local ink visible, avoid overflow and respect reduced motion',async()=>{
    await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.waitForTimeout(300)
    assert.equal(await settings.locator('[data-dcb-welcome-art]').evaluate(el=>getComputedStyle(el).color),'rgb(237, 237, 240)')
    await settings.screenshot({path:resolve(output,'settings-dark.png')})
    await page.setViewportSize({width:520,height:900});await page.waitForTimeout(200)
    assert.equal(await settings.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true)
    await page.emulateMedia({reducedMotion:'reduce'});await settings.getByRole('button',{name:'播放欢迎预览'}).click();assert.equal(await ink(),0)
    await settings.screenshot({path:resolve(output,'settings-narrow.png')});await page.emulateMedia({reducedMotion:'no-preference'})
  })
  await check('closing settings while writing releases every preview animation',async()=>{
    await settings.getByRole('button',{name:'播放欢迎预览'}).click();assert.ok(await ink()>0)
    await page.evaluate(()=>window.fixture.settings(false));await page.waitForTimeout(100)
    assert.equal(await ink(),0);assert.equal(await page.locator('.dcb-welcome-demo').count(),0)
    await page.evaluate(()=>{for(const cb of window.cleanups.reverse())cb?.()})
  })
  assert.deepEqual(errors,[])
  console.log(JSON.stringify({passed,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
