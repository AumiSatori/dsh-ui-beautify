import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const root=fileURLToPath(new URL('..',import.meta.url))
const fixture=await build({entryPoints:[resolve(root,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html',readFileSync(resolve(root,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];res.writeHead(route?200:404,{'Content-Type':(route?.[0]||'text/plain')+'; charset=utf-8'});res.end(route?.[1]||'')});await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}/`,KEY='dsh-ui-beautify:settings:v1',WIDTH='dsh-ui-beautify:conversation-width:v1'
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[]
page.on('pageerror',error=>errors.push(error.message))
async function boot(){
 await page.goto(url+'?composer');await page.getByTestId('todo-panel').waitFor()
 await page.evaluate(KEY=>{if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify({welcomeEnabled:false,particleEnabled:false,runningAnimationEnabled:false}));window.cleanups=[];window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true;window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>window.fixtureReact.createElement('span',null,'◒')}:window.fixtureReact)}},KEY)
 await page.addScriptTag({url:url+'client.js'})
 await page.evaluate(()=>{const ctx={slots:{inject(_n,cb){cb()},register(s,c){if(s.name==='settings.section')window.fixtureSettings=c;else{window.fixtureHeader=c;window.fixtureHeaderSpec=s}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_n,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh();window.fixture.settings(true)})
 await page.addStyleTag({content:'.settings-dialog{inset:20px 7%;padding:20px;overflow:auto}.dcb-settings{min-width:0}'})
 if(await page.getByRole('tab',{name:'全局配置',exact:true}).getAttribute('aria-selected')!=='true')await page.getByRole('tab',{name:'全局配置',exact:true}).click()
 await page.getByRole('region',{name:'配置预设'}).waitFor()
}
const preset=()=>page.getByRole('region',{name:'配置预设'})
async function setConfig(width,asset){await page.evaluate(async({KEY,WIDTH,width,asset})=>{
 const config=window.plugin.__test.normalize({...JSON.parse(localStorage.getItem(KEY)),width,streamReveal:width!==310,streamRevealStrength:width===310?'vivid':'soft',userBubbleThemes:{light:{style:'custom',css:'.bubble{color:'+asset+'}'},dark:{style:'custom',css:'.bubble{color:'+asset+'}'}}});localStorage.setItem(KEY,JSON.stringify(config));localStorage.setItem(WIDTH,JSON.stringify({version:1,window:width*2,fullscreen:width*3}));window.dispatchEvent(new StorageEvent('storage',{key:KEY}));window.dispatchEvent(new StorageEvent('storage',{key:WIDTH}))
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('dsh-ui-beautify-hero-logo',1);r.onupgradeneeded=()=>r.result.createObjectStore('logo');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});await new Promise((resolve,reject)=>{const t=db.transaction('logo','readwrite');t.objectStore('logo').put({blob:new Blob([asset],{type:'image/png'})},'current');t.oncomplete=resolve;t.onerror=()=>reject(t.error)});db.close()
 },{KEY,WIDTH,width,asset})}
async function save(name){await preset().getByLabel('预设名称').fill(name);await preset().getByRole('button',{name:'保存当前预设'}).click();await preset().getByRole('button',{name:'切换到 '+name}).waitFor()}
async function apply(name,width,asset){await preset().getByRole('button',{name:'切换到 '+name}).click();await page.waitForFunction(({KEY,width})=>JSON.parse(localStorage.getItem(KEY)).width===width,{KEY,width});assert.equal(await page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('dsh-ui-beautify-hero-logo');r.onsuccess=()=>resolve(r.result)});const v=await new Promise(resolve=>{const r=db.transaction('logo').objectStore('logo').get('current');r.onsuccess=()=>resolve(r.result)});db.close();return v.blob.text()}),asset);assert.equal(await page.evaluate(()=>localStorage.getItem('dsh-ui-beautify:settings-tab:v1')),'config');const restored=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.equal(restored.streamReveal,width!==310);assert.equal(restored.streamRevealStrength,width===310?'vivid':'soft')}
async function assertHoverContrast(button){
 await button.hover();await page.waitForTimeout(250)
 const contrast=await button.evaluate(el=>{const style=getComputedStyle(el),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=canvas.height=1;const rgb=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4})};const luminance=color=>{const c=rgb(color);return .2126*c[0]+.7152*c[1]+.0722*c[2]};const a=luminance(style.color),b=luminance(style.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)})
 assert.ok(contrast>=4.5,`hover contrast ${contrast.toFixed(2)} must be at least 4.5`)
}
try{
 await boot();assert.equal(await page.getByRole('button',{name:'全部恢复默认值'}).count(),0);assert.equal(await preset().getByRole('button',{name:'切换到 默认值'}).count(),1)
 await setConfig(310,'red');await save('红色');await setConfig(390,'blue');await save('蓝色')
 const config=await page.evaluate(KEY=>({format:'dsh-ui-beautify-config',version:1,settings:JSON.parse(localStorage.getItem(KEY)),layout:{widths:{version:1,window:null,fullscreen:null}}}),KEY)
 await page.getByLabel('选择美化配置文件',{exact:true}).setInputFiles({name:'config.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(config))})
 const importApply=page.getByRole('button',{name:'应用配置',exact:true});await importApply.waitFor()
 for(const dark of [false,true]){await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);for(const button of [preset().getByRole('button',{name:'保存当前预设'}),preset().getByRole('button',{name:'切换到 默认值'}),preset().getByRole('button',{name:'切换到 红色'}),importApply])await assertHoverContrast(button)}
 await page.getByRole('region',{name:'全局配置导入导出'}).getByRole('button',{name:'取消'}).click();await page.evaluate(()=>document.body.removeAttribute('data-ds-dark-theme'))
 await apply('红色',310,'red');assert.equal((await page.evaluate(WIDTH=>JSON.parse(localStorage.getItem(WIDTH)),WIDTH)).window,620)
 await apply('蓝色',390,'blue');assert.equal((await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY)).userBubbleThemes.dark.css,'.bubble{color:blue}')
 await page.getByRole('button',{name:'撤销上次应用'}).click();await page.waitForFunction(KEY=>JSON.parse(localStorage.getItem(KEY)).width===310,KEY)
 await preset().getByRole('button',{name:'切换到 默认值'}).click();await page.waitForFunction(KEY=>JSON.parse(localStorage.getItem(KEY)).width===window.plugin.__test.normalize(null).width,KEY)
 await page.getByRole('button',{name:'撤销上次应用'}).click();await page.waitForFunction(KEY=>JSON.parse(localStorage.getItem(KEY)).width===310,KEY)
 await preset().getByRole('button',{name:'重命名 红色'}).click();await preset().getByLabel('修改预设名称').fill('红色主题');await preset().getByRole('button',{name:'保存名称'}).click();await preset().getByRole('button',{name:'切换到 红色主题'}).waitFor()
 await boot();await preset().getByRole('button',{name:'切换到 红色主题'}).waitFor();await apply('蓝色',390,'blue')
 await page.evaluate(()=>{window.realPresetAdd=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(...args){if(this.name==='presets')throw new DOMException('quota','QuotaExceededError');return window.realPresetAdd.apply(this,args)}})
 await preset().getByLabel('预设名称').fill('无法保存');await preset().getByRole('button',{name:'保存当前预设'}).click();await preset().getByRole('alert').waitFor();assert.equal(await preset().getByRole('button',{name:'切换到 红色主题'}).count(),1);assert.equal((await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY)).width,390);await page.evaluate(()=>IDBObjectStore.prototype.add=window.realPresetAdd)
 await preset().getByRole('button',{name:'删除 蓝色'}).click();const row=preset().locator('.dcb-preset-item').filter({hasText:'蓝色'}),height=await row.evaluate(el=>el.getBoundingClientRect().height);await row.getByRole('button',{name:'确认删除'}).click();await page.waitForTimeout(80);const mid=await row.evaluate(el=>({height:el.getBoundingClientRect().height,filter:getComputedStyle(el).filter}));assert.ok(mid.height>0&&mid.height<height);assert.match(mid.filter,/blur/);await preset().getByRole('button',{name:'切换到 蓝色'}).waitFor({state:'detached'})
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));assert.equal(await preset().evaluate(el=>el.scrollWidth>el.clientWidth+1),false)
 assert.equal(await page.locator('select,input[type=checkbox],input[type=radio],input[type=range]').count(),0);assert.deepEqual(errors,[]);console.log('PASS presets: save, assets, themes, widths, switch, default, undo, rename, persistence, quota, animated delete, dark narrow')
}finally{await browser.close();await new Promise(done=>server.close(done))}
