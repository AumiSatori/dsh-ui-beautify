import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'validation'),'settings-transfer')
mkdirSync(out,{recursive:true})
const fixture=await build({entryPoints:[resolve(root,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const helper=await build({stdin:{contents:`import{createSettingsTransfer}from './src/settings-transfer.js';window.createTransfer=()=>createSettingsTransfer(window,{normalize:window.plugin.__test.normalize,getSettings:()=>JSON.parse(localStorage.getItem('dsh-ui-beautify:settings:v1')),getWidths:()=>JSON.parse(localStorage.getItem('dsh-ui-beautify:conversation-width:v1')),onApply:()=>window.dispatchEvent(new StorageEvent('storage',{key:'dsh-ui-beautify:settings:v1'}))})`,resolveDir:root},bundle:true,write:false,format:'iife'})
const routes={'/':['text/html',readFileSync(resolve(root,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'),'utf8')],'/helper.js':['text/javascript',helper.outputFiles[0].text]}
const server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];res.writeHead(route?200:404,{'Content-Type':(route?.[0]||'text/plain')+'; charset=utf-8'});res.end(route?.[1]||'')});await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}/`,KEY='dsh-ui-beautify:settings:v1',WIDTH='dsh-ui-beautify:conversation-width:v1'
const browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),page=await context.newPage(),errors=[],checks=[]
page.on('pageerror',error=>errors.push(error.message))
const section=()=>page.getByRole('region',{name:'全局配置导入导出'}),upload=()=>page.getByLabel('选择美化配置文件',{exact:true})
async function boot(target=page){
 await target.goto(url+'?composer');await target.getByTestId('todo-panel').waitFor()
 await target.evaluate(KEY=>{
   if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify({welcomeEnabled:false,particleEnabled:false,runningAnimationEnabled:false,sidebarOverlay:false}))
   window.cleanups=[];window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true
   window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>window.fixtureReact.createElement('span',null,'◒')}:window.fixtureReact)}
 },KEY)
 await target.addScriptTag({url:url+'client.js'})
 await target.evaluate(()=>{const ctx={slots:{inject(_n,cb){cb()},register(s,c){if(s.name==='settings.section')window.fixtureSettings=c;else{window.fixtureHeader=c;window.fixtureHeaderSpec=s}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_n,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh();window.fixture.settings(true)})
 await target.addStyleTag({content:'.settings-dialog{inset:20px 7%;padding:20px;overflow:auto}.dcb-settings{min-width:0}'});await target.getByRole('tab',{name:'全局配置',exact:true}).click();await target.getByLabel('选择美化配置文件',{exact:true}).waitFor({state:'attached'})
 await target.addScriptTag({url:url+'helper.js'});await target.evaluate(()=>window.transfer=createTransfer())
}
const saved=()=>page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY)
async function check(name,fn){await fn();await page.waitForFunction(()=>document.querySelector('.dcb-config-transfer')?.getAttribute('aria-busy')==='false');checks.push(name);console.log('PASS '+name)}
const jsonFile=value=>({name:'appearance.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))})
let original,config,backup
try{
 await boot()
 await page.evaluate(({KEY,WIDTH})=>{const settings=window.plugin.__test.normalize({welcomeEnabled:false,particleEnabled:false,runningAnimationEnabled:false,cardStyle:'css',sidebarStyle:'glass',composerStyle:'clear',sidebarOverlay:false,width:426,userBubbleThemes:{light:{style:'custom',css:'.bubble{color:#123456}'},dark:{style:'custom',css:'.bubble{color:#fedcba}'}},toolbar:{order:['settings','theme','summary'],hidden:['more']},turnDividerCss:'.line{height:3px}',runningAnimationLabels:'思考中 {time}'});localStorage.setItem(KEY,JSON.stringify(settings));localStorage.setItem(WIDTH,JSON.stringify({version:1,window:1040,fullscreen:1500}));localStorage.setItem('other-plugin:secret','do-not-export');window.dispatchEvent(new StorageEvent('storage',{key:KEY}));window.dispatchEvent(new StorageEvent('storage',{key:WIDTH}))},{KEY,WIDTH})
 original=await page.evaluate(KEY=>window.plugin.__test.normalize(JSON.parse(localStorage.getItem(KEY))),KEY)
 await check('global JSON export covers normalized settings, independent themes, CSS, toolbar and both widths only',async()=>{
   const pending=page.waitForEvent('download');await section().getByRole('button',{name:'导出配置',exact:true}).click();const download=await pending;config=JSON.parse(readFileSync(await download.path(),'utf8'))
   assert.equal(config.format,'dsh-ui-beautify-config');assert.deepEqual(config.settings,original);assert.deepEqual(config.layout.widths,{version:1,window:1040,fullscreen:1500});assert.equal(JSON.stringify(config).includes('do-not-export'),false);assert.equal(config.databases,undefined)
 })
 await check('import is reviewed first, cancel is read-only, apply persists every option and undo restores the prior configuration',async()=>{
   const next={...config,settings:{...config.settings,width:299,cardStyle:'glass',unexpected:'ignored'}}
   await upload().setInputFiles(jsonFile(next));await section().getByRole('button',{name:'应用配置',exact:true}).waitFor();assert.equal((await saved()).width,426)
   await section().getByRole('button',{name:'取消',exact:true}).click();assert.equal((await saved()).width,426)
   await upload().setInputFiles(jsonFile(next));await section().getByRole('button',{name:'应用配置',exact:true}).click();await section().getByText('全局配置已导入并立即生效。',{exact:true}).waitFor();assert.equal((await saved()).width,299);assert.equal((await saved()).unexpected,undefined)
   await page.evaluate(()=>window.fixture.settings(false));await page.evaluate(()=>window.fixture.settings(true));await section().getByRole('button',{name:'撤销上次应用',exact:true}).click();assert.deepEqual(await saved(),original)
 })
 await check('invalid, foreign and unsupported files leave settings untouched and provide an error',async()=>{
   for(const value of [{format:'other',version:1,settings:{width:400}},{...config,version:99},{...config,settings:{nonsense:true}}]){await upload().setInputFiles(jsonFile(value));await section().getByRole('alert').waitFor();assert.deepEqual(await saved(),original)}
   await upload().setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{no')});await section().getByRole('alert').waitFor();assert.deepEqual(await saved(),original)
 })
 await check('configuration storage quota errors preserve previous preferences and unrelated plugin data',async()=>{
   await upload().setInputFiles(jsonFile({...config,settings:{...config.settings,width:305}}));await section().getByRole('button',{name:'应用配置',exact:true}).waitFor()
   await page.evaluate(KEY=>{window.realSetItem=Storage.prototype.setItem;window.failConfig=true;Storage.prototype.setItem=function(key,value){if(key===KEY&&window.failConfig){window.failConfig=false;throw new DOMException('synthetic quota','QuotaExceededError')}return window.realSetItem.call(this,key,value)}},KEY)
   await section().getByRole('button',{name:'应用配置',exact:true}).click();await section().getByRole('alert').waitFor();assert.match(await section().getByRole('alert').innerText(),/已保留/);assert.deepEqual(await saved(),original);assert.equal(await page.evaluate(()=>localStorage.getItem('other-plugin:secret')),'do-not-export')
   await page.evaluate(()=>Storage.prototype.setItem=window.realSetItem);await section().getByRole('button',{name:'取消',exact:true}).click()
 })
 await check('complete backup contains every beautify asset store with binary bytes and no unrelated browser data',async()=>{
   await page.evaluate(async()=>{
     const groups=[['dsh-ui-beautify-background',2,{wallpaper:null,assets:null}],[ 'dsh-ui-beautify-welcome',1,{media:null}],['dsh-ui-beautify-welcome-code',1,{opening:null}],['dsh-ui-context-particles',1,{artwork:null}],['dsh-ui-beautify-turn-divider',1,{art:null}],['dsh-ui-beautify-running-packs',1,{packs:'id',assets:'key'}]]
     window.seedGroups=groups
     for(const[name,version,stores]of groups){const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,version);r.onupgradeneeded=()=>{for(const[store,keyPath]of Object.entries(stores))if(!r.result.objectStoreNames.contains(store))r.result.createObjectStore(store,keyPath?{keyPath}:undefined)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});await new Promise((resolve,reject)=>{const tx=db.transaction(Object.keys(stores),'readwrite');for(const[store,keyPath]of Object.entries(stores)){const key=store==='wallpaper'?'selection':keyPath==='id'?'local-example':keyPath==='key'?'local-example/action':'example';const value=store==='wallpaper'?{schema:2,currentId:'example',previousId:'',recent:[{revision:'example',name:'我的背景'}]}:{id:'local-example',key:'local-example/action',revision:'example',source:store==='opening'?'<style>body{color:red}</style>':'',name:'合成素材',blob:new Blob(['synthetic bytes '+name+' '+store],{type:'image/png'})};keyPath?tx.objectStore(store).put(value):tx.objectStore(store).put(value,key)}tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()}
   })
   await section().getByRole('switch',{name:'包含本机素材',exact:true}).click();const pending=page.waitForEvent('download');await section().getByRole('button',{name:'导出配置',exact:true}).click();const download=await pending;backup=readFileSync(await download.path());assert.ok(download.suggestedFilename().endsWith('.dshui'));assert.equal(backup.subarray(0,8).toString(),'DSHUI01\n');assert.equal(backup.includes(Buffer.from('do-not-export')),false)
   const manifest=JSON.parse(backup.subarray(12,12+backup.readUInt32LE(8)).toString());assert.equal(manifest.databases.length,6);assert.ok(manifest.blobs.length>=7)
 })
 await check('asset import merges galleries, restores binary records on an empty device and can undo just its changes',async()=>{
   const fresh=await browser.newContext({viewport:{width:1440,height:1000}}),dest=await fresh.newPage();try{
     await boot(dest)
     await dest.getByLabel('选择美化配置文件',{exact:true}).setInputFiles({name:'complete.dshui',mimeType:'application/octet-stream',buffer:backup});await dest.getByRole('button',{name:'应用配置',exact:true}).click();await dest.getByText('已导入配置与素材；刷新界面后加载素材。',{exact:true}).waitFor()
     assert.deepEqual(await dest.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY),original)
     const recovered=await dest.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('dsh-ui-beautify-welcome');r.onsuccess=()=>resolve(r.result)});const item=await new Promise(resolve=>{const r=db.transaction('media').objectStore('media').get('example');r.onsuccess=()=>resolve(r.result)});db.close();return item.blob.text()});assert.match(recovered,/synthetic bytes dsh-ui-beautify-welcome media/)
     await dest.getByRole('button',{name:'撤销上次应用',exact:true}).click();await dest.getByText('已撤销上次应用；刷新界面后重新加载素材。',{exact:true}).waitFor()
     assert.equal(await dest.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('dsh-ui-beautify-welcome');r.onsuccess=()=>resolve(r.result)});const count=await new Promise(resolve=>{const r=db.transaction('media').objectStore('media').count();r.onsuccess=()=>resolve(r.result)});db.close();return count}),0)
   }finally{await fresh.close()}
   await page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('dsh-ui-beautify-background');r.onsuccess=()=>resolve(r.result)});await new Promise(resolve=>{const tx=db.transaction('wallpaper','readwrite');tx.objectStore('wallpaper').put({schema:2,currentId:'other',recent:[{revision:'other',name:'原来的背景'}]},'selection');tx.oncomplete=resolve});db.close()})
   await upload().setInputFiles({name:'complete.dshui',mimeType:'application/octet-stream',buffer:backup});await section().getByRole('button',{name:'应用配置',exact:true}).click();await section().getByText('已导入配置与素材；刷新界面后加载素材。',{exact:true}).waitFor()
   const gallery=await page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('dsh-ui-beautify-background');r.onsuccess=()=>resolve(r.result)});const item=await new Promise(resolve=>{const r=db.transaction('wallpaper').objectStore('wallpaper').get('selection');r.onsuccess=()=>resolve(r.result)});db.close();return item.recent.map(item=>item.revision)});assert.deepEqual(gallery,['example','other'])
   await section().getByRole('button',{name:'撤销上次应用',exact:true}).click()
 })
 await check('corrupt binary checksums and foreign database names are rejected before writes',async()=>{
   const damaged=Buffer.from(backup);damaged[damaged.length-1]^=1;await upload().setInputFiles({name:'damaged.dshui',mimeType:'application/octet-stream',buffer:damaged});await section().getByRole('alert').waitFor();assert.match(await section().getByRole('alert').innerText(),/校验失败/);assert.deepEqual(await saved(),original)
   const length=backup.readUInt32LE(8),manifest=JSON.parse(backup.subarray(12,12+length).toString());manifest.databases[0].name='host-auth';const json=Buffer.from(JSON.stringify(manifest)),header=Buffer.from(backup.subarray(0,12));header.writeUInt32LE(json.length,8);await upload().setInputFiles({name:'foreign.dshui',mimeType:'application/octet-stream',buffer:Buffer.concat([header,json,backup.subarray(12+length)])});await section().getByRole('alert').waitFor();assert.match(await section().getByRole('alert').innerText(),/不受支持/)
 })
 await check('storage failure rolls back earlier asset groups and configuration; later retries remain usable',async()=>{
   await page.evaluate(()=>{window.realPut=IDBObjectStore.prototype.put;window.failTransfer=true;IDBObjectStore.prototype.put=function(...args){if(this.name==='media'&&window.failTransfer){window.failTransfer=false;throw new DOMException('synthetic quota','QuotaExceededError')}return window.realPut.apply(this,args)}})
   await upload().setInputFiles({name:'complete.dshui',mimeType:'application/octet-stream',buffer:backup});await section().getByRole('button',{name:'应用配置',exact:true}).click();await section().getByRole('alert').waitFor();assert.match(await section().getByRole('alert').innerText(),/已保留/);assert.deepEqual(await saved(),original)
   await page.evaluate(()=>IDBObjectStore.prototype.put=window.realPut)
   await section().getByRole('button',{name:'取消',exact:true}).click()
   await upload().setInputFiles(jsonFile(config));await section().getByRole('button',{name:'应用配置',exact:true}).click();await section().getByRole('button',{name:'撤销上次应用',exact:true}).waitFor()
 })
 await check('the global row works with keyboard and remains readable in light, dark, narrow and forced-color modes',async()=>{
   await page.keyboard.press('Tab');await section().getByRole('button',{name:'导出配置',exact:true}).focus();assert.equal(await section().getByRole('button',{name:'导出配置',exact:true}).evaluate(el=>getComputedStyle(el).outlineStyle),'solid')
   for(const dark of [false,true]){await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);await section().screenshot({path:resolve(out,`${dark?'dark':'light'}.png`)})}
   await page.setViewportSize({width:390,height:844});await page.addStyleTag({content:'.settings-dialog{inset:6px!important;padding:10px!important}'});const sizes=await section().evaluate(el=>({overflow:el.scrollWidth>el.clientWidth+1,buttons:[...el.querySelectorAll('button:not(.dcb-switch)')].map(node=>node.getBoundingClientRect().height)}));assert.equal(sizes.overflow,false);assert.ok(sizes.buttons.every(size=>size>=44));await section().screenshot({path:resolve(out,'narrow.png')})
   await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});assert.equal(await section().getByRole('button',{name:'导出配置',exact:true}).evaluate(el=>getComputedStyle(el).transitionDuration),'0s');await section().screenshot({path:resolve(out,'forced-colors.png')})
 })
 assert.deepEqual(errors,[]);writeFileSync(resolve(out,'verification.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,output:out}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
