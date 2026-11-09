import assert from 'node:assert/strict'
import {readFileSync,openSync,readSync,closeSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {selectSettingsCategory} from './settings-navigation.mjs'

const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/dsh-trigger-menu-opacity'))
mkdirSync(out,{recursive:true})
assert.ok(process.env.DSH_ASAR,'Set DSH_ASAR to the installed desktop archive')
const fd=openSync(process.env.DSH_ASAR,'r')
let nativeCss,materialClass,lightFill,darkFill
try{
  const h=Buffer.alloc(16);readSync(fd,h,0,16,0);const json=Buffer.alloc(h.readUInt32LE(12));readSync(fd,json,0,json.length,16);const tree=JSON.parse(json),base=8+h.readUInt32LE(4)
  const read=path=>{let node=tree;for(const key of path.split('/'))node=node.files[key];if(node.unpacked)return readFileSync(process.env.DSH_ASAR+'.unpacked/'+path,'utf8');const b=Buffer.alloc(node.size);readSync(fd,b,0,b.length,base+Number(node.offset));return b.toString()}
  const prefix='dsh/node_modules/@deepseek-ai/',theme=read(prefix+'dsh-client-ui-theme/lib/client.js')
  ;[lightFill,darkFill]=[...theme.matchAll(/--dsw-menu-surface-fill:(#[\da-f]{8})/g)].map(match=>match[1])
  const assets=tree.files.dsh.files.node_modules.files['@deepseek-ai'].files['dsh-web-frontend'].files.dist.files.assets.files
  for(const name of Object.keys(assets).filter(name=>name.endsWith('.css'))){const match=read(prefix+'dsh-web-frontend/dist/assets/'+name).match(/\.([\w-]*material_[\w-]*)\{[^}]*background:var\(--dsw-menu-surface-fill\)[^}]*\}/);if(match){nativeCss=match[0];materialClass=match[1];break}}
  assert.ok(nativeCss&&lightFill&&darkFill,'Installed menu material and both native fills exist')
}finally{closeSync(fd)}
const fixture=(await build({stdin:{resolveDir:root,contents:`import './test/fixture.jsx';import {createSettingsTransfer} from './src/settings-transfer.js';window.fixtureTransfer=()=>createSettingsTransfer(window,{normalize:window.plugin.__test.normalize,getSettings:()=>JSON.parse(localStorage.getItem('dsh-ui-beautify:settings:v1')),getWidths:()=>null,onApply:()=>dispatchEvent(new StorageEvent('storage',{key:'dsh-ui-beautify:settings:v1'}))});`},bundle:true,write:false,format:'iife'})).outputFiles[0].text
const demoCss=`body{--dsw-menu-surface-fill:${lightFill};--dsw-menu-backdrop-filter:blur(40px) saturate(150%)}body[data-ds-dark-theme]{--dsw-menu-surface-fill:${darkFill}}${nativeCss}[data-opacity-samples]{position:fixed;left:50px;top:140px;width:420px;padding:28px;background:repeating-linear-gradient(25deg,#beccdc 0 25px,#e4c8ae 25px 50px)}[data-opacity-samples] [data-trigger-menu],[data-unrelated-menu]{position:relative;isolation:isolate;padding:22px;border-radius:14px;color:#222}[data-opacity-samples] [data-trigger-menu]{margin-bottom:30px}[data-opacity-samples] .${materialClass}{border-radius:inherit}[data-native-menu-text]{position:relative;font:15px/24px system-ui}.settings-dialog{inset:20px 8%!important;padding:20px!important}`
const routes={'/':['text/html',readFileSync(resolve(root,'test/fixture.html'),'utf8').replace('</style>',demoCss+'</style>')],'/fixture.js':['text/javascript',fixture],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route)return res.writeHead(404).end();res.writeHead(200,{'content-type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-ui-beautify:settings:v1'
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[],results=[]
page.on('pageerror',error=>errors.push(error.message))
const row=()=>page.locator('[data-setting="trigger-menu-opacity"]'),slider=()=>row().getByRole('slider'),sheet=()=>page.locator('style[data-dcb-trigger-menu-opacity]')
async function settle(){await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))}
async function mount(){
  await page.goto(url);await page.getByTestId('todo-panel').waitFor()
  await page.evaluate(key=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleEnabled:false}));window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}},key)
  await page.addScriptTag({url:url+'/client.js'})
  await page.evaluate(materialClass=>{
    const ctx={slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}}
    window.plugin.apply(ctx);window.fixture.refresh()
    const sample=document.createElement('aside');sample.dataset.opacitySamples='';sample.innerHTML=`<div data-composer-overlay><div data-trigger-menu data-menu-material="translucent"><div class="${materialClass}" aria-hidden="true"></div><div data-native-menu-text>文件与文件夹<br>项目 / 输出文件</div></div></div><div data-unrelated-menu data-menu-material="translucent"><div class="${materialClass}" aria-hidden="true"></div><span>其他菜单</span></div>`;document.body.append(sample)
  },materialClass)
  await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'输入栏');await row().scrollIntoViewIfNeeded();await settle()
}
async function patch(value){await page.evaluate(({key,value})=>{const next=JSON.stringify({...JSON.parse(localStorage.getItem(key)||'{}'),...value});localStorage.setItem(key,next);dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},{key,value});await settle()}
const paint=()=>page.locator(`[data-trigger-menu] > .${materialClass}`).evaluate(el=>{const style=getComputedStyle(el);return{color:style.backgroundColor,alpha:Number(style.backgroundColor.match(/[\d.]+/g).at(-1)),filter:style.backdropFilter}})
async function keyTo(key,value){await slider().press(key);await settle();assert.equal(await slider().getAttribute('aria-valuenow'),String(value))}
async function check(name,fn){await fn();results.push(name);console.log('PASS '+name)}
try{
  await mount()
  await check('the setting is last in composer appearance, defaults to native, and uses custom controls',async()=>{
    assert.equal(await row().evaluate(el=>el.previousElementSibling.classList.contains('dcb-settings-info')&&!el.nextElementSibling),true)
    assert.equal(await sheet().textContent(),'');assert.equal(await row().locator('select,input[type=range],input[type=checkbox],input[type=radio]').count(),0)
    await row().getByRole('button',{name:'恢复原生'}).isDisabled().then(disabled=>assert.ok(disabled))
    assert.ok(Math.abs((await paint()).alpha-parseInt(lightFill.slice(-2),16)/255)<1/255,JSON.stringify({fill:lightFill,paint:await paint()}));assert.equal((await paint()).filter,'blur(40px) saturate(1.5)')
  })
  await check('keyboard endpoints change only menu fill and keep text and other menus opaque to the same degree',async()=>{
    const unrelated=await page.locator(`[data-unrelated-menu] > .${materialClass}`).evaluate(el=>getComputedStyle(el).backgroundColor)
    await keyTo('Home',0);assert.equal((await paint()).color,'rgb(248, 249, 250)')
    await keyTo('End',100);assert.equal((await paint()).alpha,0)
    await keyTo('ArrowLeft',99);await keyTo('PageDown',89);await keyTo('ArrowUp',90)
    assert.equal(await page.locator('[data-native-menu-text]').evaluate(el=>getComputedStyle(el).opacity),'1')
    assert.equal(await page.locator(`[data-unrelated-menu] > .${materialClass}`).evaluate(el=>getComputedStyle(el).backgroundColor),unrelated)
    assert.equal((await paint()).filter,'blur(40px) saturate(1.5)')
  })
  await check('menu fill interpolates through a real middle frame without fading its text',async()=>{
    await keyTo('Home',0);await slider().press('End')
    const middle=await page.locator(`[data-trigger-menu] > .${materialClass}`).evaluate(el=>{const animation=el.getAnimations().find(a=>a.transitionProperty==='background-color');if(!animation)return null;animation.pause();animation.currentTime=140;return{color:getComputedStyle(el).backgroundColor,duration:animation.effect.getTiming().duration}})
    assert.ok(middle);assert.equal(middle.duration,280);const alpha=Number(middle.color.match(/[\d.]+/g).at(-1));assert.ok(alpha>0&&alpha<1)
    await page.evaluate(()=>document.getAnimations().forEach(a=>{if(a.effect?.getComputedTiming().iterations!==Infinity)a.finish()}))
  })
  await check('dragging updates immediately, clamps outside the track, and releases capture',async()=>{
    const box=await slider().boundingBox();await page.mouse.move(box.x+box.width*.25,box.y+22);await page.mouse.down();await page.mouse.move(box.x+box.width*.75,box.y+22)
    assert.equal(await slider().getAttribute('data-dragging'),'true');assert.equal(await slider().getAttribute('aria-valuenow'),'75')
    await page.mouse.move(box.x+box.width+25,box.y+22);await page.mouse.up();await settle()
    assert.equal(await slider().getAttribute('aria-valuenow'),'100');assert.equal(await slider().getAttribute('data-dragging'),'false')
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).triggerMenuTransparency,key),100)
  })
  await check('saved opacity survives refresh and theme changes, independently of composer and task-panel switches',async()=>{
    await keyTo('Home',0);await keyTo('PageUp',10);await mount();assert.equal(await slider().getAttribute('aria-valuenow'),'10')
    await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await settle();assert.equal((await paint()).color,'rgba(67, 69, 74, 0.9)')
    await patch({composerStyle:'milk',composerButtonGlass:false,enabled:false});assert.equal((await paint()).color,'rgba(67, 69, 74, 0.9)')
    await row().getByRole('button',{name:'恢复原生'}).click();await settle();assert.equal(await sheet().textContent(),'');assert.ok(Math.abs((await paint()).alpha-parseInt(darkFill.slice(-2),16)/255)<1/255)
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).triggerMenuTransparency,key),null)
  })
  await check('configuration export, import, defaults and undo preserve or restore the saved menu appearance',async()=>{
    await patch({triggerMenuTransparency:20})
    const exported=await page.evaluate(async()=>{window.transfer=window.fixtureTransfer();const file=await transfer.exportFile();window.exportedMenuConfig=file.blob;return JSON.parse(await file.blob.text()).settings.triggerMenuTransparency});assert.equal(exported,20)
    await patch({triggerMenuTransparency:80});await page.evaluate(async()=>{const plan=await transfer.inspect(window.exportedMenuConfig);await transfer.apply(plan)});await settle();assert.equal(await slider().getAttribute('aria-valuenow'),'20')
    await page.evaluate(()=>transfer.applyDefaults());await settle();assert.equal(await sheet().textContent(),'')
    await page.evaluate(()=>transfer.undo());await settle();assert.equal(await slider().getAttribute('aria-valuenow'),'20');await page.evaluate(()=>transfer.dispose())
  })
  await check('invalid settings restore native while values are bounded and newly created menus inherit the rule',async()=>{
    await patch({triggerMenuTransparency:'0'});assert.equal(await sheet().textContent(),'')
    await patch({triggerMenuTransparency:-20});assert.equal(await slider().getAttribute('aria-valuenow'),'0')
    await patch({triggerMenuTransparency:150});assert.equal(await slider().getAttribute('aria-valuenow'),'100')
    await page.evaluate(()=>{const menu=document.querySelector('[data-trigger-menu]');menu.replaceWith(menu.cloneNode(true))});assert.equal((await paint()).alpha,0)
    await patch({triggerMenuTransparency:30});await page.setViewportSize({width:390,height:900});await row().scrollIntoViewIfNeeded();await settle()
    assert.ok(await row().evaluate(el=>el.scrollWidth<=el.clientWidth+1));await row().screenshot({path:resolve(out,'opacity-dark-narrow.png')})
  })
  await check('accessibility modes suppress motion and forced colors keep the native surface',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});await keyTo('Home',0);await slider().press('End')
    assert.equal(await page.locator(`[data-trigger-menu] > .${materialClass}`).evaluate(el=>el.getAnimations().length),0)
    await page.emulateMedia({forcedColors:'active'});assert.equal(await page.locator('[data-trigger-menu]').evaluate(el=>getComputedStyle(el).getPropertyValue('--dsw-menu-surface-fill').trim()),darkFill)
    await page.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'});await page.setViewportSize({width:1280,height:1000});await patch({triggerMenuTransparency:15})
    await page.evaluate(()=>document.body.removeAttribute('data-ds-dark-theme'));await row().scrollIntoViewIfNeeded();await settle();await page.locator('[data-dcb-settings-block=composer]').screenshot({path:resolve(out,'opacity-settings-light.png')})
  })
  await check('unloading removes the override and returns an already-open menu to the native fill',async()=>{
    await page.evaluate(()=>{for(const cleanup of window.cleanups.splice(0).reverse())cleanup?.()});assert.equal(await sheet().count(),0);await settle();assert.ok(Math.abs((await paint()).alpha-parseInt(lightFill.slice(-2),16)/255)<1/255)
  })
  assert.deepEqual(errors,[]);writeFileSync(resolve(out,'validation.json'),JSON.stringify({passed:results.length,checks:results,source:'Full plugin settings and installed native menu material stylesheet; synthetic menu contents'},null,2));console.log(JSON.stringify({passed:results.length,out}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
