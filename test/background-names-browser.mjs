import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium,expect} from '@playwright/test'
import {selectSettingsCategory} from './settings-navigation.mjs'

const root=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../.scratch/claude-beautify'),'background-names')
mkdirSync(output,{recursive:true})
const video=resolve(output,'synthetic-clip.mp4');execFileSync(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','color=c=0x567a9b:s=160x100:r=12','-t','1','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',video],{stdio:'pipe',windowsHide:true})
const fixture=await build({entryPoints:[resolve(root,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(root,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const row=routes[req.url];if(!row)return res.writeHead(404).end();res.writeHead(200,{'content-type':row[0]}).end(row[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-ui-beautify:settings:v1',browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
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
const entry=()=>section(page).locator('.dcb-background-gallery-entry[data-selected=true]')
const field=()=>section(page).getByRole('textbox',{name:'背景名称',exact:true})
const change=async(row,name)=>{await row.locator('.dcb-background-gallery-name-row').click();await field().fill(name);await field().press('Enter');await expect(field()).toHaveCount(0)}
const unchanged=value=>{const s=structuredClone(value);delete s.backgroundName;for(const t of Object.values(s.backgroundThemes||{}))delete t.backgroundName;return s}
const inventory=()=>page.evaluate(()=>new Promise((resolve,reject)=>{const q=indexedDB.open('dsh-ui-beautify-background',2);q.onsuccess=()=>{const db=q.result,tx=db.transaction(['assets','wallpaper']),a=tx.objectStore('assets').getAll(),b=tx.objectStore('wallpaper').get('selection');tx.oncomplete=async()=>{const originals=await Promise.all(a.result.map(async x=>({id:x.revision,name:x.name,kind:x.kind,size:x.blob.size,digest:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await x.blob.arrayBuffer()))].join(',')})));db.close();resolve({originals,order:b.result.recent.map(x=>x.revision),current:b.result.currentId,previous:b.result.previousId})};tx.onerror=()=>reject(tx.error)}}))
try{
 await page.goto(url);await mount();await apply('night');await theme('light');await apply('day')
 await check('active and inactive HTML names save without changing either theme or rebuilding its player',async()=>{
  const before=await saved(page),originals=await inventory();await page.evaluate(()=>{window.renamePlayer=document.querySelector('[data-dcb-background-layer] iframe');window.assetWrites=0;const put=IDBObjectStore.prototype.put;window.renameOriginalPut=put;IDBObjectStore.prototype.put=function(...args){if(this.name==='assets')assetWrites++;return put.apply(this,args)}})
  await change(entry(),'日间 · 深海极光');await expect(section(page).locator('.dcb-background-file')).toHaveText('日间 · 深海极光')
  const night=section(page).getByRole('button',{name:'重命名背景：自定义 HTML 背景',exact:true});await night.click();await field().fill('夜间 · 静谧星海');await field().press('Enter');await expect(field()).toHaveCount(0)
  assert.deepEqual(unchanged(await saved(page)),unchanged(before));assert.equal((await saved(page)).backgroundThemes.dark.backgroundName,'夜间 · 静谧星海');assert.equal((await saved(page)).backgroundThemes.light.backgroundName,'日间 · 深海极光');assert.equal(await page.evaluate(()=>renamePlayer===document.querySelector('[data-dcb-background-layer] iframe')),true);assert.equal(await page.evaluate(()=>assetWrites),0);assert.deepEqual(await inventory(),originals)
  await page.evaluate(()=>IDBObjectStore.prototype.put=renameOriginalPut)
 })
 await check('blank names cannot save, Escape and cancel preserve the name and return keyboard focus',async()=>{
  await entry().locator('.dcb-background-gallery-name-row').click();await expect(field()).toBeFocused();assert.equal(await field().getAttribute('maxlength'),'160');await field().fill('   ');assert.equal(await section(page).getByRole('button',{name:'保存',exact:true}).isEnabled(),false);await field().press('Escape');await expect(section(page).getByRole('button',{name:'重命名背景：日间 · 深海极光',exact:true})).toBeFocused();await entry().locator('.dcb-background-gallery-name-row').click();await field().fill('未保存');await section(page).getByRole('button',{name:'取消',exact:true}).click();await expect(field()).toHaveCount(0);await expect(section(page).getByRole('button',{name:'重命名背景：日间 · 深海极光',exact:true})).toBeFocused()
 })
 await check('a shared asset updates both theme labels and renders punctuation as plain text',async()=>{
  await theme('dark');await settings();await section(page).getByRole('button',{name:'使用背景：日间 · 深海极光',exact:true}).click();await shows('day');const before=await saved(page);await change(entry(),'  极光 <img onerror=alert(1)> & "海"  ');await expect(section(page).locator('.dcb-background-file')).toHaveText('极光 <img onerror=alert(1)> & "海"');const value=await saved(page);for(const scheme of ['light','dark'])assert.equal(value.backgroundThemes[scheme].backgroundName,'极光 <img onerror=alert(1)> & "海"');assert.deepEqual(unchanged(value),unchanged(before));assert.equal(await section(page).locator('.dcb-background-gallery-name img').count(),0);await change(entry(),'深海极光 · 日间')
 })
 await check('image and video aliases persist while originals remain exactly once and selection does not change',async()=>{
  const upload=section(page).getByLabel('导入全图背景',{exact:true});const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=32;c.height=20;const g=c.getContext('2d');g.fillStyle='#84a5c3';g.fillRect(0,0,32,20);return c.toDataURL().split(',')[1]});await upload.setInputFiles({name:'imported.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await expect(section(page).locator('.dcb-background-file')).toHaveText('imported.png');await change(entry(),'海边插画');
  const media=readFileSync(video);await upload.setInputFiles({name:'imported.mp4',mimeType:'video/mp4',buffer:Buffer.from(media)});await expect(section(page).locator('.dcb-background-file')).toHaveText('imported.mp4');await page.locator('[data-dcb-background-layer] video').waitFor();const before=await inventory(),value=await saved(page);await page.evaluate(()=>window.renamePlayer=document.querySelector('[data-dcb-background-layer] video'));await change(entry(),'海底循环');assert.deepEqual(await inventory(),before);assert.deepEqual(unchanged(await saved(page)),unchanged(value));assert.equal(await page.evaluate(()=>renamePlayer===document.querySelector('[data-dcb-background-layer] video')),true)
 })
 await check('a failed metadata write keeps the old name and allows retry',async()=>{
  await entry().locator('.dcb-background-gallery-name-row').click();await field().fill('失败后重试');await page.evaluate(()=>{window.realPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='wallpaper')throw new DOMException('Synthetic quota failure','QuotaExceededError');return realPut.apply(this,args)}});await field().press('Enter');await section(page).getByRole('alert').waitFor();await expect(field()).toBeEnabled();assert.equal((await saved(page)).backgroundName,'海底循环');await page.evaluate(()=>IDBObjectStore.prototype.put=realPut);await field().press('Enter');await expect(field()).toHaveCount(0);await expect(section(page).locator('.dcb-background-file')).toHaveText('失败后重试');await change(entry(),'海底循环')
 })
 await check('reload restores aliases, original order and current playback without duplicating media',async()=>{
  const before=await inventory();await page.reload();await mount();await settings();await expect(section(page).getByRole('button',{name:'重命名背景：海底循环',exact:true})).toBeVisible();assert.deepEqual(await inventory(),before);assert.equal(before.originals.length,4);assert.equal(await section(page).getByRole('button',{name:'重命名背景：海边插画',exact:true}).count(),1)
 })
 await check('rename controls fit narrow and dark views, keep 44px targets and honor quiet preferences',async()=>{
  await section(page).locator('details summary').click();for(const scheme of ['light','dark']){await page.evaluate(scheme=>window.hostTheme.setTheme(scheme),scheme);await idle();await settings();await section(page).locator('details summary').click();await page.setViewportSize({width:1440,height:1000});await section(page).locator('.dcb-background-library').last().screenshot({path:resolve(output,'names-'+scheme+'.png')})}
  await page.setViewportSize({width:430,height:940});await page.addStyleTag({content:'.settings-dialog{inset:10px!important;padding:10px!important}.settings-pane{min-width:0}.dcb-background-settings{min-width:0}'});await section(page).getByRole('button',{name:'重命名背景：海边插画',exact:true}).click();await expect(field()).toBeVisible();const geometry=await field().evaluate(el=>{const r=el.getBoundingClientRect(),f=el.closest('form');return{width:r.width,overflow:f.scrollWidth>f.clientWidth+1,target:document.querySelector('.dcb-background-gallery-name-row').getBoundingClientRect().height}});assert.ok(geometry.width>50);assert.equal(geometry.overflow,false);assert.ok(geometry.target>=44);await section(page).locator('.dcb-background-library').last().screenshot({path:resolve(output,'names-narrow-edit.png')});
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await field().evaluate(el=>getComputedStyle(el.closest('form')).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'active'});assert.equal(await field().evaluate(el=>getComputedStyle(el.closest('form')).animationName),'none');await field().press('Escape')
 })

 await check('desktop rename stays one compact row within its card under host input styles',async()=>{
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'});await page.setViewportSize({width:1200,height:900});const inherited=await page.addStyleTag({content:'.settings-dialog input{box-sizing:content-box;min-height:70px;padding:18px}.settings-dialog button{min-height:50px;min-width:60px;padding:16px}'});
  const widths=await section(page).locator('.dcb-background-gallery-entry').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().width));assert.ok(widths.every(w=>w>=240),'Desktop background cards have room for thumbnails and names');const row=section(page).getByRole('button',{name:'重命名背景：海边插画',exact:true});const before=await row.evaluate(el=>el.closest('.dcb-background-gallery-entry').getBoundingClientRect().height);await row.click();await expect(field()).toBeFocused();await field().press('End');
  const r=await field().evaluate(el=>{const f=el.closest('form'),c=f.closest('.dcb-background-gallery-entry'),b=el.getBoundingClientRect(),fr=f.getBoundingClientRect(),cr=c.getBoundingClientRect();return{inputHeight:b.height,formHeight:fr.height,cardHeight:cr.height,inside:b.left>=cr.left&&b.right<=cr.right,overflow:f.scrollWidth>f.clientWidth+1,buttons:[...f.querySelectorAll('button')].map(n=>({height:n.getBoundingClientRect().height,y:n.getBoundingClientRect().y})),inputY:b.y}});
  assert.equal(r.inputHeight,32);assert.equal(r.formHeight,48);assert.ok(r.cardHeight<=before+1);assert.equal(r.inside,true);assert.equal(r.overflow,false);assert.ok(r.buttons.every(b=>b.height===32&&Math.abs(b.y-r.inputY)<=2));await inherited.evaluate(el=>el.remove());
  for(const dark of [false,true]){await page.evaluate(dark=>window.hostTheme.setTheme(dark?'dark':'light'),dark);await idle();await section(page).locator('.dcb-background-library').last().screenshot({path:resolve(output,'compact-'+(dark?'dark':'light')+'.png')})}
  await field().press('Escape');
 })
 await check('touch editing keeps a contained single row with 44px action targets',async()=>{
  const touch=await browser.newContext({viewport:{width:430,height:940},isMobile:true,hasTouch:true,storageState:await context.storageState({indexedDB:true})}),phone=await touch.newPage();try{await phone.goto(url);await mount(phone);await settings(phone);await phone.addStyleTag({content:'.settings-dialog{inset:10px!important;padding:10px!important}'});await section(phone).getByRole('button',{name:'重命名背景：海边插画',exact:true}).click();const result=await section(phone).getByRole('textbox',{name:'背景名称',exact:true}).evaluate(el=>{const f=el.closest('form');return{coarse:matchMedia('(pointer:coarse)').matches,height:f.getBoundingClientRect().height,overflow:f.scrollWidth>f.clientWidth+1,targets:[...f.querySelectorAll('button')].map(b=>b.getBoundingClientRect().height)}});assert.equal(result.coarse,true);assert.equal(result.height,52);assert.equal(result.overflow,false);assert.deepEqual(result.targets,[44,44]);await section(phone).locator('.dcb-background-library').last().screenshot({path:resolve(output,'compact-touch.png')})}finally{await touch.close()}
 })
 assert.deepEqual(errors,[]);writeFileSync(resolve(output,'result.json'),JSON.stringify({passed:checks.length,checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
