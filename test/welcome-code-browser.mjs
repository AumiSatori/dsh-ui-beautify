import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeLogo,installLogoFixture} from './native-logo.mjs'
import {selectSettingsCategory} from './settings-navigation.mjs'

const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../custom-opening-qa'),'code-opening')
mkdirSync(out,{recursive:true})
const fixture=await build({entryPoints:[resolve(root,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const helpers=await build({stdin:{contents:"export * from './src/welcome-code.js'; export {patchWelcomeTheme} from './src/welcome-theme.js'; export {createStartupMotion} from './src/startup-motion.js'",resolveDir:root},bundle:true,write:false,format:'iife',globalName:'Opening'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(root,'test/fixture.html'))],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'))],'/opening.js':['text/javascript',helpers.outputFiles[0].text]}
let forbidden=0
const server=createServer((req,res)=>{const route=routes[req.url];if(!route){if(req.url==='/forbidden')forbidden++;res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-ui-beautify:settings:v1',logo=nativeLogo()||{width:120,height:90,path:'M5 35Q40 5 85 35L115 15L108 50Q50 90 5 35Z'}
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),context=await browser.newContext({viewport:{width:1200,height:950}}),page=await context.newPage()
let passed=0
const section=page.locator('[data-dcb-settings-block=welcome]'),choices=()=>section.getByRole('radiogroup',{name:'开屏类型'}),code=()=>section.getByRole('textbox',{name:'开屏动画代码'}),saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function mount(){
  await page.getByTestId('todo-panel').waitFor();await page.evaluate(installLogoFixture,logo)
  await page.evaluate(()=>{window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:window.fixtureFishLogo,FISH_LOGO_PATH:window.nativeLogo.path,FISH_LOGO_VIEWBOX:window.nativeLogo}:window.fixtureReact)}})
  await page.addScriptTag({url:url+'/opening.js'});await page.addScriptTag({url:url+'/client.js'})
  await page.evaluate(()=>{const ctx={slots:{inject(_name,cb){cb()},register(spec,c){if(spec.name==='settings.section')window.fixtureSettings=c;else{window.fixtureHeader=c;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh();window.ticks=0;addEventListener('message',e=>{if(e.data?.type==='synthetic-tick')window.ticks++})})
}
async function settings(){await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'开屏欢迎');await section.waitFor();await page.waitForTimeout(400)}
const demo=delay=>`<style>body{display:grid;place-items:center;background:#162337;color:white;font:6vw system-ui}p{animation:in .8s both}@keyframes in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}</style><p>HARNESS</p><script>setInterval(()=>parent.postMessage({type:'synthetic-tick'},'*'),20);setTimeout(()=>window.dshWelcomeDone(),${delay})</script>`
try{
  await page.goto(url);await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,backgroundEnabled:false,particleEnabled:false})),key);await mount();await settings()
  await check('default character logo uses the exact native silhouette and has no bitmap or perpetual idle animation',async()=>{
    assert.equal(await choices().getByRole('radio').first().textContent(),'默认 · Logo 字符填充')
    assert.equal(await section.locator('[data-dcb-welcome-character-logo] mask path').getAttribute('d'),logo.path)
    assert.equal(await section.locator('[data-dcb-character-row]').count(),33)
    assert.equal(await section.locator('.dcb-welcome-demo img,.dcb-welcome-demo canvas').count(),0)
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-startup-characters')).length),0)
    await section.getByRole('button',{name:'播放欢迎预览'}).click();await page.waitForTimeout(140)
    assert.ok(await section.locator('[data-dcb-character-row]').evaluateAll(nodes=>nodes.some(n=>{const a=Number(getComputedStyle(n).opacity);return a>0&&a<1})))
    await section.locator('.dcb-welcome-demo').screenshot({path:resolve(out,'characters-mid-light.png')})
    await page.waitForTimeout(1800)
    await section.locator('.dcb-welcome-demo').screenshot({path:resolve(out,'characters-finished-light.png')})
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-startup-characters')).length),0)
  })
  await check('code import is a draft until applied; source stays out of ordinary settings and backgrounds stay independent',async()=>{
    await choices().getByRole('radio',{name:'自定义代码',exact:true}).click()
    await page.locator('input[aria-label="导入开屏代码文件"]').setInputFiles({name:'synthetic.html',mimeType:'text/html',buffer:Buffer.from(demo(800))})
    await page.waitForFunction(source=>document.querySelector('textarea[aria-label="开屏动画代码"]')?.value===source,demo(800));assert.equal(await code().inputValue(),demo(800));assert.equal(await section.locator('iframe').count(),0)
    assert.equal((await saved()).welcomeCodeRevision,'')
    await section.getByRole('button',{name:'应用代码开屏'}).click();await page.waitForFunction(key=>!!JSON.parse(localStorage.getItem(key)).welcomeCodeRevision,key)
    const value=await saved();assert.equal(value.welcomeMode,'code');assert.equal(value.welcomeCodeName,'synthetic.html');assert.equal(value.backgroundEnabled,false);assert.equal(JSON.stringify(value).includes('synthetic-tick'),false)
    assert.equal(await section.locator('iframe').count(),0)
  })
  await check('preview honors an early completion signal and releases its script, timers and iframe',async()=>{
    await section.getByRole('button',{name:'播放欢迎预览'}).click();await section.locator('iframe').waitFor({timeout:2500}).catch(async error=>{throw Error(error.message+'; state='+JSON.stringify({code:await code().inputValue(),status:await section.locator('[role=status],[role=alert]').allTextContents()}))});await page.waitForTimeout(150)
    assert.ok(await page.evaluate(()=>window.ticks)>0)
    await section.getByText('预览已结束',{exact:true}).waitFor()
    assert.equal(await section.locator('iframe').count(),0)
    const ticks=await page.evaluate(()=>window.ticks);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.ticks),ticks)
  })
  await check('opaque iframe blocks host DOM, storage and network; unrelated messages cannot dismiss it',async()=>{
    await code().fill(`<p>isolated</p><script>fetch('${url}/forbidden').catch(()=>{});setInterval(()=>parent.postMessage({type:'synthetic-tick'},'*'),20)</script>`)
    await section.getByRole('button',{name:'播放欢迎预览'}).click();await section.locator('iframe').waitFor()
    const frame=page.frames().find(f=>f.parentFrame());await frame.waitForSelector('p')
    assert.deepEqual(await frame.evaluate(()=>{const result=[];for(const f of [()=>parent.document.body,()=>localStorage.length]){try{f();result.push(false)}catch{result.push(true)}}return result}),[true,true])
    assert.equal(await section.locator('iframe').getAttribute('sandbox'),'allow-scripts')
    await page.evaluate(()=>postMessage({type:'dcb-welcome-done'},'*'));await page.waitForTimeout(120);assert.equal(await section.locator('iframe').count(),1)
    assert.equal(forbidden,0)
    await selectSettingsCategory(page,'输入栏');assert.equal(await page.locator('[data-dcb-welcome-code] iframe').count(),0)
    const ticks=await page.evaluate(()=>window.ticks);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.ticks),ticks)
    await selectSettingsCategory(page,'开屏欢迎');await code().waitFor();assert.equal(await code().inputValue(),demo(800))
  })
  await check('standalone CSS/JS imports are wrapped while a DSH plugin entry is rejected clearly',async()=>{
    const result=await page.evaluate(async()=>{
      const css=await Opening.inspectWelcomeCodeFile(new File(['body{background:#123}'],'opening.css'))
      const js=await Opening.inspectWelcomeCodeFile(new File(['document.body.textContent="Hello"'],'opening.js'))
      let rejection='';try{Opening.inspectWelcomeCode("window.__ModuleLoader__.load({})")}catch(e){rejection=e.message}
      return {css:css.source,js:js.source,rejection}
    })
    assert.ok(result.css.startsWith('<style>'));assert.ok(result.js.startsWith('<script>'));assert.match(result.rejection,/DSH 插件入口/)
    await code().fill(demo(10000));await section.getByRole('button',{name:'应用代码开屏'}).click();await page.waitForTimeout(300)
  })
  await check('the actual generated client restores code on startup and scales it to window and narrow screen',async()=>{
    await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({...JSON.parse(localStorage.getItem(key)),...Opening.patchWelcomeTheme(JSON.parse(localStorage.getItem(key)),{welcomeEnabled:true,welcomeCodeDuration:3000},'light')})),key)
    await page.reload();await mount();await page.locator('[data-dcb-welcome] iframe').waitFor();await page.waitForTimeout(350)
    assert.equal(await page.locator('[data-dcb-welcome] [data-dcb-welcome-art]').count(),0)
    await page.setViewportSize({width:580,height:720});await page.waitForTimeout(50)
    assert.deepEqual(await page.locator('[data-dcb-welcome] iframe').evaluate(el=>{const r=el.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]}),[580,720])
    await page.locator('[data-dcb-welcome]').screenshot({path:resolve(out,'code-startup-narrow.png')})
    await page.setViewportSize({width:1200,height:950});await page.locator('[data-dcb-welcome]').waitFor({state:'detached'})
    assert.equal(await page.locator('[data-dcb-welcome-code]').count(),0)
    const ticks=await page.evaluate(()=>window.ticks);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.ticks),ticks)
  })
  await check('code errors fall back to the character default instead of leaving a blocking overlay',async()=>{
    await page.evaluate(async key=>{const asset=Opening.inspectWelcomeCode('<script>throw Error("synthetic")</script>');await Opening.createWelcomeCodeStore(window).save(asset);const old=JSON.parse(localStorage.getItem(key));localStorage.setItem(key,JSON.stringify({...old,...Opening.patchWelcomeTheme(old,{welcomeCodeRevision:asset.revision},'light')}))},key)
    await page.reload();await mount();await page.locator('[data-dcb-welcome-character-logo]').waitFor();assert.equal(await page.locator('[data-dcb-welcome] iframe').count(),0)
    await page.keyboard.press('Escape');assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
  })
  await check('dark/narrow UI, keyboard focus and reduced motion retain readable controls with no idle scripts',async()=>{
    await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({...JSON.parse(localStorage.getItem(key)),...Opening.patchWelcomeTheme(JSON.parse(localStorage.getItem(key)),{welcomeEnabled:false},document.body.hasAttribute('data-ds-dark-theme')?'dark':'light')})),key)
    await settings();await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.setViewportSize({width:520,height:900});await choices().getByRole('radio',{name:'自定义代码',exact:true}).click()
    await section.getByRole('button',{name:'载入代码示例'}).click();await page.waitForTimeout(300)
    assert.equal(await section.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true)
    await section.getByRole('button',{name:'应用代码开屏'}).focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');assert.equal(await section.getByRole('button',{name:'应用代码开屏'}).evaluate(el=>el.matches(':focus-visible')),true)
    await section.screenshot({path:resolve(out,'code-settings-narrow-dark.png')})
    await page.emulateMedia({reducedMotion:'reduce'});await section.getByRole('button',{name:'播放欢迎预览'}).click();assert.equal(await section.locator('iframe').count(),0)
    await page.reload();await mount();assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
  })
  console.log(JSON.stringify({passed,output:out}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
