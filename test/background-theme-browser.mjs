import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium,expect} from '@playwright/test'
import {selectSettingsCategory} from './settings-navigation.mjs'

const root=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../.scratch/claude-beautify'),'background-theme')
mkdirSync(output,{recursive:true})
const fixture=await build({entryPoints:[resolve(root,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(root,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const row=routes[req.url];if(!row)return res.writeHead(404).end();res.writeHead(200,{'content-type':row[0]}).end(row[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-claude-beautify:settings:v1',browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const context=await browser.newContext({viewport:{width:1200,height:900}}),page=await context.newPage(),errors=[],checks=[]
const scene=name=>`<style>html,body{background:${name.startsWith('day')?'#edf3fa':'#10172d'};color:${name.startsWith('day')?'#334':'#ddd'}}</style><div data-scene="${name}">${name}</div><script>window.sceneName=${JSON.stringify(name)};</script>`
const saved=target=>target.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
const section=target=>target.locator('[data-dcb-settings-block=background]')
const layer=target=>target.locator('[data-dcb-background-layer]')
async function idle(target=page){await target.waitForFunction(()=>!document.documentElement.hasAttribute('data-dcb-theme-transition'));await target.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))}
async function mount(target=page){
 target.on('pageerror',error=>errors.push(error.message))
 await target.getByTestId('todo-panel').waitFor()
 await target.evaluate(key=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleEnabled:false,backgroundOpacity:100}))
  window.cleanups=[];window.themeListeners=new Set()
  const setTheme=value=>{localStorage.setItem('fixture:bg-theme',value);document.body.toggleAttribute('data-ds-dark-theme',value==='dark');for(const listener of window.themeListeners)listener(window.hostTheme.getTheme())}
  window.hostTheme={getTheme:()=>({active:{colorScheme:document.body.hasAttribute('data-ds-dark-theme')?'dark':'light'}}),setTheme}
  setTheme(localStorage.getItem('fixture:bg-theme')||'dark')
  window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}
 },key)
 await target.addScriptTag({url:url+'/client.js'})
 await target.evaluate(()=>{const ctx={theme:window.hostTheme,slots:{inject(_name,fn){fn()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},effect:fn=>window.cleanups.push(fn()),on(name,fn){if(name==='theme/change'){window.themeListeners.add(fn);window.cleanups.push(()=>window.themeListeners.delete(fn))}},inject(_names,fn){fn(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
 await target.locator('.dcb-theme-toggle').waitFor()
}
async function settings(target=page){await target.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(target,'全图背景');const details=section(target).locator('details');if(!await details.getAttribute('open')){if(!await details.evaluate(el=>el.open))await details.locator('summary').click()}}
async function apply(name,target=page){await settings(target);await section(target).getByRole('textbox',{name:'HTML 背景代码'}).fill(scene(name));await section(target).getByRole('button',{name:'应用 HTML 背景',exact:true}).click();await shows(name,target)}
async function shows(name,target=page){await expect(layer(target)).toHaveCount(1);await target.frameLocator('[data-dcb-background-layer] iframe').locator(`[data-scene="${name}"]`).waitFor();assert.equal(await target.locator('[data-dcb-background-layer] iframe').count(),1)}
async function theme(value,target=page){await target.evaluate(()=>window.fixture.settings(false));const button=target.locator('.dcb-theme-toggle');if(await button.getAttribute('data-scheme')!==value)await button.click();await idle(target)}
async function absent(target=page){await expect(layer(target)).toHaveCount(0);assert.equal(await target.locator('body').getAttribute('data-dcb-background'),null)}
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
let nightId,dayId
try{
 await page.goto(url);await mount()
 await check('applying night HTML remembers only night; the native day switch removes it when day is unconfigured',async()=>{
  await apply('night');nightId=(await saved(page)).backgroundThemes.dark.backgroundRevision
  assert.ok(nightId);assert.equal((await saved(page)).backgroundThemes.light.backgroundRevision,'')
  await theme('light');await absent();await settings();assert.equal(await section(page).getByRole('switch',{name:'启用全图背景'}).getAttribute('aria-checked'),'false')
  assert.equal(await section(page).getByText(/当前：日间背景/).isVisible(),true)
 })
 await check('both HTML choices survive theme changes and reload without storing source in preferences or duplicating assets',async()=>{
  await apply('day');dayId=(await saved(page)).backgroundThemes.light.backgroundRevision
  assert.notEqual(dayId,nightId);assert.equal((await saved(page)).backgroundThemes.dark.backgroundRevision,nightId)
  for(const value of ['dark','light','dark']){await theme(value);await shows(value==='dark'?'night':'day')}
  await page.reload();await mount();await shows('night');await settings()
  await section(page).getByRole('button',{name:'读取当前 HTML',exact:true}).click();assert.equal(await section(page).getByRole('textbox',{name:'HTML 背景代码'}).inputValue(),scene('night'))
  assert.equal(JSON.stringify(await saved(page)).includes('data-scene'),false)
  const count=await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('dsh-ui-beautify-background',2);r.onsuccess=()=>{const db=r.result,tx=db.transaction('assets'),q=tx.objectStore('assets').count();q.onsuccess=()=>resolve(q.result);tx.oncomplete=()=>db.close()}}));assert.equal(count,2)
 })
 await check('editor drafts belong to their theme and previews stop when the theme changes',async()=>{
  const draft=scene('night')+'<!-- unsaved night draft -->';await section(page).getByRole('textbox',{name:'HTML 背景代码'}).fill(draft)
  await section(page).getByRole('button',{name:'预览动效',exact:true}).click();await page.locator('iframe[title="HTML 动态背景预览"]').waitFor()
  await page.evaluate(()=>window.hostTheme.setTheme('light'));await shows('day');await expect(page.locator('iframe[title="HTML 动态背景预览"]')).toHaveCount(0)
  await expect(section(page).getByRole('textbox',{name:'HTML 背景代码'})).toHaveValue(scene('day'))
  await page.evaluate(()=>window.hostTheme.setTheme('dark'));await shows('night');await expect(section(page).getByRole('textbox',{name:'HTML 背景代码'})).toHaveValue(draft)
 })
 await check('an asynchronous apply stays assigned to the theme in which it was started',async()=>{
  await section(page).getByRole('textbox',{name:'HTML 背景代码'}).fill(scene('night-2'))
  await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;window.savedPut=put;IDBObjectStore.prototype.put=function(...args){if(this.name==='assets'&&args[0]?.kind==='html'){IDBObjectStore.prototype.put=put;window.hostTheme.setTheme('light')}return put.apply(this,args)}})
  try{await section(page).getByRole('button',{name:'应用 HTML 背景',exact:true}).click();await expect.poll(async()=>(await saved(page)).backgroundThemes.dark.backgroundRevision).not.toBe(nightId);await shows('day')}
  finally{await page.evaluate(()=>IDBObjectStore.prototype.put=window.savedPut)}
  assert.equal((await saved(page)).backgroundThemes.light.backgroundRevision,dayId)
  await theme('dark');await shows('night-2')
 })
 await check('restore, disable and clear affect only the current theme while the opposite choice stays available',async()=>{
  await settings();await section(page).getByRole('button',{name:'恢复上一张',exact:true}).click();await shows('night')
  await theme('light');await apply('day-2');await section(page).getByRole('button',{name:'恢复上一张',exact:true}).click();await shows('day')
  await theme('dark');await settings();await section(page).getByRole('switch',{name:'启用全图背景'}).click();await absent()
  await theme('light');await shows('day');await theme('dark');await absent();await settings()
  await section(page).getByRole('switch',{name:'启用全图背景'}).click();await shows('night');await section(page).getByRole('button',{name:'清除背景',exact:true}).click();await absent()
  await theme('light');await shows('day');assert.equal((await saved(page)).backgroundThemes.dark.backgroundRevision,'')
 })
 await check('two windows read their own theme asset even when the shared library last selected another one',async()=>{
  await theme('dark');await apply('night-final')
  const other=await context.newPage();try{
   await other.goto(url);await mount(other);await other.evaluate(()=>window.hostTheme.setTheme('light'));await shows('day',other);await shows('night-final')
   await apply('day-final',other);await shows('night-final');await page.reload();await mount();await page.evaluate(()=>window.hostTheme.setTheme('dark'));await shows('night-final');await shows('day-final',other)
  }finally{await other.close()}
  await page.screenshot({path:resolve(output,'night-restored.png')});await theme('light');await shows('day-final');await page.screenshot({path:resolve(output,'day-restored.png')})
 })
 await check('legacy HTML migrates into its active theme without losing its file or leaking into the opposite theme',async()=>{
  for(const enabled of [true,false]){const legacyContext=await browser.newContext(),legacy=await legacyContext.newPage();try{
   await legacy.goto(url);await legacy.evaluate(async({key,source,enabled})=>{
    await new Promise((resolve,reject)=>{const r=indexedDB.open('dsh-ui-beautify-background',2);r.onupgradeneeded=()=>{r.result.createObjectStore('assets');r.result.createObjectStore('wallpaper')};r.onsuccess=()=>{const db=r.result,tx=db.transaction(['assets','wallpaper'],'readwrite'),asset={revision:'legacy',name:'旧 HTML',kind:'html',type:'text/html',blob:new Blob([source],{type:'text/html'})};tx.objectStore('assets').put(asset,'legacy');tx.objectStore('wallpaper').put({schema:2,currentId:'legacy',previousId:'',recent:[{revision:'legacy',name:'旧 HTML',kind:'html'}]},'selection');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=reject}})
    localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleEnabled:false,backgroundEnabled:enabled,backgroundRevision:'legacy',backgroundName:'旧 HTML'}));localStorage.setItem('fixture:bg-theme','dark')
   },{key,source:scene('night-legacy'),enabled});await mount(legacy);if(enabled)await shows('night-legacy',legacy);else await absent(legacy)
   await expect.poll(async()=>(await saved(legacy)).backgroundThemes?.dark.backgroundRevision).toBe('legacy')
   assert.equal((await saved(legacy)).backgroundThemes.dark.backgroundEnabled,enabled)
   await theme('light',legacy);await absent(legacy);await theme('dark',legacy);if(enabled)await shows('night-legacy',legacy);else await absent(legacy)
  }finally{await legacyContext.close()}}
 })
 await page.evaluate(()=>{for(const off of window.cleanups.reverse())off?.()});await absent();assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:checks.length,output}))
}finally{await context.close();await browser.close();await new Promise(done=>server.close(done))}
