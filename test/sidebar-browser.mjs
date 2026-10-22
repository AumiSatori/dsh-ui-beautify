import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,openSync,readSync,closeSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','.scratch','claude-beautify'),'sidebar')
mkdirSync(output,{recursive:true})
let hostCSS='.sb_root{height:100%;box-sizing:border-box;display:flex;flex-direction:column;padding:6px 12px;background:#f4f5f7}.sb_logoRow{height:56px;flex:none}.sb_panelRow,.sb_newSession{height:36px}.sb_regionArea{flex:1;overflow:auto}.sb_sessionRow{padding:10px;border-radius:6px}.sb_sessionRow[aria-selected=true]{background:#ddd}.sb_collapsed{padding:6px}.sb_footArea{padding:12px 0}',source='portable sidebar fixture'
if(process.env.DSH_ASAR){
 const fd=openSync(process.env.DSH_ASAR,'r')
 try{
  const head=Buffer.alloc(16);readSync(fd,head,0,16,0);const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16);let entry=JSON.parse(json.toString())
  for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-sidebar/lib/client.js'.split('/'))entry=entry.files[part]
  const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset));const text=bytes.toString(),at=text.indexOf('SidebarRoot.module.css'),start=text.lastIndexOf('//#region',at),end=text.indexOf('//#endregion',at),literal=text.slice(start,end).match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)
  assert.ok(literal,'Installed SidebarRoot stylesheet found');hostCSS=JSON.parse(literal[1]);const prefix=hostCSS.match(/\.([\w]+)_root\{/)[1];hostCSS=hostCSS.replaceAll(prefix+'_','sb_');source='installed DSH SidebarRoot stylesheet and inspected AppFrame/sidebar workspace structure'
 }finally{closeSync(fd)}
}
const built=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const extra=`:root{--dsw-specific-sidebar-fill:#f0f1f4;--dsw-alias-label-primary:#252934;--dsw-alias-label-secondary:#677080;--dsw-alias-state-business-primary:#7176dd;--dsw-radius-md:8px}.frame{grid-template-columns:260px 1fr;background:repeating-linear-gradient(145deg,#bad9df 0 90px,#d9cee5 90px 180px,#e6c9ba 180px 270px)}.nav{padding:0;background:#f0f1f4}.settings-dialog{inset:18px 30px 18px 290px;overflow:auto}.sb_logoRow{justify-content:space-between!important}.sb_regionArea{overflow:auto!important;min-height:0}.sb_sessionRow{display:flex;align-items:center;min-height:44px;margin:3px 0;padding:10px 8px;border:0;background:transparent;color:inherit;width:100%;text-align:left;cursor:pointer}.sb_sessionRow[aria-selected=true]{background:#b7becb66}.sb_sessionRow:hover{background:#a4abb922}.sb_footArea button{border:0;background:transparent;color:inherit;padding:12px}body[data-ds-dark-theme]{--dsw-specific-sidebar-fill:#20242e;--dsw-alias-label-primary:#edf0f7;--dsw-alias-label-secondary:#bcc4d3}.collapsed-frame{grid-template-columns:56px 1fr}.collapsed-frame .sb_root :is(.sb_regionArea,.sb_footArea,.sb_brand){display:none}.collapsed-frame .sb_logoRow{justify-content:center!important}`
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8').replace('</style>',hostCSS+extra+'</style>')],'/fixture.js':['text/javascript',built.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])});await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),context=await browser.newContext({viewport:{width:1200,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
const url=`http://127.0.0.1:${server.address().port}/?composer=interactive`,key='dsh-claude-beautify:settings:v1'
const root=page.locator('.sb_root'),indicator=root.locator('.dcb-sidebar-indicator'),group=page.getByRole('radiogroup',{name:'侧栏样式',exact:true})
async function settled(){await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))}
async function prepare(){
 await page.goto(url);await page.getByTestId('todo-panel').waitFor()
 await page.evaluate(()=>{
  const nav=document.querySelector('.nav');nav.classList.add('host_sidebarCol');nav.innerHTML='<div class="sb_root" style="width:260px"><div class="sb_logoRow"><span class="sb_brand">DeepSeek Harness</span><button id="collapse-side" aria-label="收起左侧栏">☰</button></div><button class="sb_newSession">＋ 新对话</button><div class="sb_panelList"><button class="sb_panelRow">工作区</button></div><div class="sb_regionArea" role="tree" aria-label="演示会话">'+Array.from({length:8},(_,i)=>`<button class="sb_sessionRow" role="treeitem" aria-selected="${i===0}">演示会话 ${i+1}</button>`).join('')+'</div><div class="sb_footArea"><button id="fixture-settings">打开设置</button></div></div>'
  nav.querySelectorAll('[role=treeitem]').forEach(row=>row.onclick=()=>{nav.querySelectorAll('[role=treeitem]').forEach(el=>el.setAttribute('aria-selected',String(el===row)))})
  nav.querySelector('#collapse-side').onclick=()=>{const collapsed=!document.querySelector('.frame').classList.contains('collapsed-frame');document.querySelector('.frame').classList.toggle('collapsed-frame',collapsed);document.querySelector('.frame').setAttribute('data-sidebar-collapsed',String(collapsed));nav.querySelector('.sb_root').classList.toggle('sb_collapsed',collapsed)}
  window.cleanups=[];const FishLogo=()=>window.fixtureReact.createElement('span',null,'◒');window.__ModuleLoader__={load(spec){window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo}:window.fixtureReact)}}
 })
 await page.addScriptTag({url:new URL('/client.js',url).href})
 await page.evaluate(()=>{const ctx={slots:{inject(_n,cb){cb()},register(s,c){if(s.name==='settings.section')window.fixtureSettings=c;else{window.fixtureHeader=c;window.fixtureHeaderSpec=s}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_n,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh();document.querySelector('#fixture-settings').onclick=()=>window.fixture.settings(true)})
 await settled()
}
async function patch(value){await page.evaluate(({key,value})=>{const next=JSON.stringify({...JSON.parse(localStorage.getItem(key)||'{}'),...value});localStorage.setItem(key,next);window.dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},{key,value});await settled()}
let passed=0;async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
try{
 await prepare()
 await check('default preserves the original sidebar and all options are keyboard reachable',async()=>{
  assert.equal(await root.getAttribute('data-dcb-sidebar-style'),null);await page.evaluate(()=>window.fixture.settings(true));assert.deepEqual(await group.getByRole('radio').allTextContents(),['默认','透明玻璃','轻量玻璃','毛玻璃']);await group.getByRole('radio',{name:'侧栏：默认'}).press('ArrowRight');await settled();assert.equal(await root.getAttribute('data-dcb-sidebar-style'),'clear');await group.getByRole('radio',{name:'侧栏：透明玻璃'}).press('End');await settled();assert.equal(await root.getAttribute('data-dcb-sidebar-style'),'glass')
 })
 await check('all glass materials have rounded corners and independent light/dark palettes',async()=>{
  for(const dark of[false,true]){await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);for(const style of['css','glass','clear']){await patch({sidebarStyle:style});const s=await root.evaluate(el=>({radius:getComputedStyle(el).borderRadius,filter:getComputedStyle(el).backdropFilter,width:el.getBoundingClientRect().width,fill:getComputedStyle(el).backgroundColor}));assert.equal(s.radius,'20px');assert.equal(s.width,await root.evaluate(el=>el.parentElement.clientWidth-12));assert.match(s.fill,/rgba/);assert.match(s.filter,style==='css'?/blur\(2px\)/:style==='glass'?/blur\(22px\)/:/url\(/);await page.evaluate(()=>window.fixture.settings(false));await root.screenshot({path:resolve(output,`sidebar-${style}-${dark?'dark':'light'}.png`)});await page.evaluate(()=>window.fixture.settings(true))}}
  await page.evaluate(()=>document.body.removeAttribute('data-ds-dark-theme'));await patch({sidebarStyle:'css'})
 })
 await check('dark transparent and frosted sidebars retain a dark tint over bright artwork',async()=>{
  await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''))
  for(const [sidebarStyle,expected] of [['clear','rgba(24, 28, 36, 0.55)'],['glass','rgba(24, 28, 36, 0.62)']]){
   await patch({sidebarStyle});assert.equal(await root.evaluate(el=>getComputedStyle(el).backgroundColor),expected)
   await page.evaluate(()=>window.fixture.settings(false));await root.screenshot({path:resolve(output,`sidebar-${sidebarStyle}-dark.png`)});await page.evaluate(()=>window.fixture.settings(true))
  }
  await page.evaluate(()=>document.body.removeAttribute('data-ds-dark-theme'));await patch({sidebarStyle:'css'})
 })
 await check('material choice reuses one traveling indicator with reversible intermediate motion',async()=>{
  await group.locator('.dcb-sidebar-style-indicator').evaluate(el=>window.originalStyleIndicator=el);await group.getByRole('radio',{name:'侧栏：默认'}).click();await settled();await group.getByRole('radio',{name:'侧栏：毛玻璃'}).click();await page.waitForTimeout(80);const between=await group.locator('.dcb-sidebar-style-indicator').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41);const width=await group.locator('.dcb-sidebar-style-indicator').evaluate(el=>el.getBoundingClientRect().width);assert.ok(between>0&&between<width*3);await group.getByRole('radio',{name:'侧栏：轻量玻璃'}).click();await settled();assert.equal(await group.locator('.dcb-sidebar-style-indicator').evaluate(el=>el===window.originalStyleIndicator),true)
 })
 await check('selection highlight moves without selecting on hover or replacing native rows',async()=>{
  await page.evaluate(()=>window.fixture.settings(false));await indicator.evaluate(el=>window.originalNavIndicator=el);await root.getByRole('treeitem',{name:'演示会话 4',exact:true}).hover();assert.equal(await root.getByRole('treeitem',{name:'演示会话 1',exact:true}).getAttribute('aria-selected'),'true');const first=await indicator.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m42);await root.getByRole('treeitem',{name:'演示会话 4',exact:true}).click();await page.waitForTimeout(70);const between=await indicator.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m42);await root.getByRole('treeitem',{name:'演示会话 2',exact:true}).click();await settled();assert.ok(between>first);assert.equal(await indicator.evaluate(el=>el===window.originalNavIndicator),true);assert.equal(await root.getByRole('treeitem',{name:'演示会话 2',exact:true}).getAttribute('aria-selected'),'true');await root.screenshot({path:resolve(output,'sidebar-selected-motion.png')})
 })
 await check('collapse, scroll and remount keep the indicator bounded and native controls usable',async()=>{
  await root.getByRole('button',{name:'收起左侧栏'}).click();await settled();assert.equal(await root.evaluate(el=>getComputedStyle(el).borderRadius),'16px');assert.equal(await indicator.isVisible(),false);assert.ok(await root.evaluate(el=>el.getBoundingClientRect().width<=56));await root.getByRole('button',{name:'收起左侧栏'}).click();await settled();assert.equal(await indicator.isVisible(),true);await root.locator('.sb_regionArea').evaluate(el=>{el.style.height='80px';el.style.flex='none';el.scrollTop=200});await settled();assert.equal(await indicator.isVisible(),false);await root.locator('.sb_regionArea').evaluate(el=>{el.style.height='';el.style.flex='';el.scrollTop=0});await settled();await root.evaluate(el=>{const clone=el.cloneNode(true);clone.querySelector('.dcb-sidebar-indicator')?.remove();clone.removeAttribute('data-dcb-sidebar-style');clone.removeAttribute('data-dcb-sidebar-motion');el.replaceWith(clone)});await settled();assert.equal(await root.getAttribute('data-dcb-sidebar-style'),'css');assert.equal(await indicator.count(),1)
 })
 await check('motion toggle, reduced motion, forced colors and default release work independently',async()=>{
  await patch({sidebarMotion:false,composerStyle:'css',cardStyle:'glass'});assert.equal(await indicator.evaluate(el=>getComputedStyle(el).transitionDuration),'0s');await patch({sidebarMotion:true});await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await indicator.evaluate(el=>getComputedStyle(el).transitionDuration),'0s');await page.emulateMedia({forcedColors:'active'});assert.equal(await root.evaluate(el=>getComputedStyle(el).backdropFilter),'none');await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'});await patch({sidebarStyle:'milk'});assert.equal(await indicator.count(),0);assert.equal(await root.getAttribute('data-dcb-sidebar-style'),null);assert.equal(await page.locator('[data-dcb-sidebar-column]').count(),0);assert.equal(await page.locator('[data-dcb-composer-style]').getAttribute('data-dcb-composer-style'),'css');await patch({sidebarStyle:'clear'});await page.evaluate(()=>{for(const c of [...window.cleanups].reverse())if(typeof c==='function')c()});await settled();assert.equal(await indicator.count(),0);assert.equal(await page.locator('[data-dcb-sidebar-style], [data-dcb-sidebar-column]').count(),0)
 })
 await check('preferences survive reload and fit a narrow expanded sidebar',async()=>{
  await prepare();assert.equal(await root.getAttribute('data-dcb-sidebar-style'),'clear');await page.setViewportSize({width:390,height:844});await page.addStyleTag({content:'.nav{display:block!important}.frame{grid-template-columns:260px minmax(0,1fr)!important}'});await settled();assert.ok(await root.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth}));await root.screenshot({path:resolve(output,'sidebar-narrow.png')})
 })
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,source,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
