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
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-ui-beautify:settings:v1'
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),context=await browser.newContext({viewport:{width:1200,height:950}}),page=await context.newPage(),errors=[]
page.on('pageerror',e=>errors.push(e.message))
const settings=page.locator('[data-dcb-settings-block=welcome]'),text=page.getByRole('textbox',{name:'Logo 填充字符'})
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
const ink=()=>page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-startup-characters')).length)
try{
  await page.goto(url);await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,width:350,messageMotion:false})),key);await mount();await openSettings()
  await check('character logo has five accessible speed choices and no removed hand-font controls',async()=>{
    assert.equal(await page.getByRole('switch',{name:'开屏欢迎动效'}).getAttribute('aria-checked'),'false')
    assert.ok((await text.inputValue()).includes('HARNESS'));assert.equal(await settings.getByRole('radiogroup',{name:'填充速度'}).getByRole('radio').count(),5)
    assert.equal(await settings.locator('select,input[type=checkbox],input[type=radio],input[type=range]').count(),0)
    if(logo)assert.equal(await settings.locator('[data-dcb-welcome-character-logo] mask path').getAttribute('d'),logo.path)
    assert.equal(await settings.locator('[data-dcb-character-row]').count(),33);assert.equal(await ink(),0)
  })
  await check('characters and keyboard speed persist without changing unrelated preferences',async()=>{
    await text.fill('HARNESS +');await text.press('Tab');await settings.getByRole('radio',{name:/^慢速/}).click()
    await settings.getByRole('radio',{name:/^适中/}).focus();await page.keyboard.press('End')
    const value=await stored();assert.equal(value.welcomeThemes.light.welcomeCharacters,'HARNESS +');assert.equal(value.welcomeThemes.light.welcomeDuration,4000);assert.equal(value.width,350);assert.equal(value.messageMotion,false)
    await page.reload();await mount();await openSettings();assert.equal(await text.inputValue(),'HARNESS +');assert.equal(await settings.getByRole('radio',{name:/^更慢/}).getAttribute('aria-checked'),'true')
  })
  await check('preview has intermediate frames, finishes cleanly and leaves the draft and selection untouched',async()=>{
    await page.evaluate(()=>{const draft=document.createElement('textarea');draft.id='untouched-draft';draft.value='保留现有草稿';document.body.append(draft);draft.setSelectionRange(2,5);window.originalDraft=draft})
    await settings.getByRole('button',{name:'播放欢迎预览'}).click();await page.waitForTimeout(300);assert.ok(await ink()>0)
    assert.ok(await settings.locator('[data-dcb-character-row]').evaluateAll(nodes=>nodes.some(el=>{const a=Number(getComputedStyle(el).opacity);return a>0&&a<1})))
    assert.deepEqual(await page.evaluate(()=>{const el=document.querySelector('#untouched-draft');return[el===window.originalDraft,el.value,el.selectionStart,el.selectionEnd]}),[true,'保留现有草稿',2,5])
    await page.waitForTimeout(4000);assert.equal(await ink(),0);await settings.screenshot({path:resolve(output,'characters-settings-light.png')})
  })
  await check('enabling waits for next startup and escape always exits',async()=>{
    await page.getByRole('switch',{name:'开屏欢迎动效'}).click();assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
    await page.reload();await mount();await page.locator('[data-dcb-welcome-character-logo]').waitFor();assert.equal(await page.locator('[data-dcb-welcome] [data-dcb-character-row]').count(),33)
    await page.keyboard.press('Escape');await openSettings();await page.getByRole('switch',{name:'开屏欢迎动效'}).click()
  })
  await check('other windows synchronize the active theme without replaying the opening',async()=>{
    const other=await context.newPage();await other.goto(url)
    await other.evaluate(key=>{const value=JSON.parse(localStorage.getItem(key));value.welcomeThemes.light.welcomeCharacters='HELLO';localStorage.setItem(key,JSON.stringify(value))},key)
    await page.waitForFunction(()=>document.querySelector('input[aria-label="Logo 填充字符"]')?.value==='HELLO');assert.equal(await page.locator('[data-dcb-welcome]').count(),0);await other.close()
  })
  await check('dark and narrow themes remain legible and reduced motion has no animation',async()=>{
    await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.waitForTimeout(300)
    assert.equal(await settings.locator('[data-dcb-welcome-character-logo]').evaluate(el=>getComputedStyle(el).color),'rgb(238, 238, 238)')
    await page.setViewportSize({width:520,height:900});await page.waitForTimeout(200);assert.equal(await settings.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true)
    await page.emulateMedia({reducedMotion:'reduce'});await settings.getByRole('button',{name:'播放欢迎预览'}).click();assert.equal(await ink(),0)
    await settings.screenshot({path:resolve(output,'settings-narrow-dark.png')});await page.emulateMedia({reducedMotion:'no-preference'})
  })
  await check('closing settings releases all preview animations',async()=>{
    await settings.getByRole('button',{name:'播放欢迎预览'}).click();assert.ok(await ink()>0);await page.evaluate(()=>window.fixture.settings(false));await page.waitForTimeout(100)
    assert.equal(await ink(),0);assert.equal(await page.locator('.dcb-welcome-demo').count(),0);await page.evaluate(()=>{for(const cb of window.cleanups.reverse())cb?.()})
  })
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
