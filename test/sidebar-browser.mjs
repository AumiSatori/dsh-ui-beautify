import assert from 'node:assert/strict'
import {selectSettingsCategory} from './settings-navigation.mjs'
import {readFileSync,mkdirSync,openSync,readSync,closeSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','.scratch','claude-beautify'),'sidebar')
mkdirSync(output,{recursive:true})
let nativeSidebar='',nativeFrameCSS=''
let hostCSS='.sb_root{height:100%;box-sizing:border-box;display:flex;flex-direction:column;padding:6px 12px;background:#f4f5f7}.sb_logoRow{height:56px;flex:none}.sb_panelRow,.sb_newSession{height:36px}.sb_regionArea{flex:1;overflow:auto}.sb_sessionRow{padding:10px;border-radius:6px}.sb_sessionRow[aria-selected=true]{background:#ddd}.sb_collapsed{padding:6px}.sb_footArea{padding:12px 0}',source='portable sidebar fixture'
hostCSS+='[data-windows-titlebar] .sb_toggle{position:fixed;left:12px;top:calc((var(--dsh-windows-titlebar-height) - 28px)/2);width:28px;height:28px;z-index:30}'
if(process.env.DSH_ASAR){
 const fd=openSync(process.env.DSH_ASAR,'r')
 try{
  const head=Buffer.alloc(16);readSync(fd,head,0,16,0);const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16);const tree=JSON.parse(json.toString());let entry=tree
  for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-sidebar/lib/client.js'.split('/'))entry=entry.files[part]
  const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset));const text=bytes.toString(),at=text.indexOf('SidebarRoot.module.css'),start=text.lastIndexOf('//#region',at),end=text.indexOf('//#endregion',at),literal=text.slice(start,end).match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)
  assert.ok(literal,'Installed SidebarRoot stylesheet found');hostCSS=JSON.parse(literal[1]);const prefix=hostCSS.match(/\.([\w]+)_root\{/)[1];hostCSS=hostCSS.replaceAll(prefix+'_','sb_');source='installed DSH SidebarRoot stylesheet and inspected AppFrame/sidebar workspace structure'
  const componentStart=text.indexOf('function SidebarRoot('),componentEnd=text.indexOf('//#endregion',componentStart),classes=text.match(/var SidebarRoot_module_css_default = (\{[\s\S]*?\n\s*\});/)
  assert.ok(componentStart>=0&&componentEnd>componentStart&&classes,'Installed SidebarRoot component is discoverable')
  const names=JSON.parse(classes[1]);for(const key of Object.keys(names))names[key]=names[key].replace(prefix+'_','sb_')
  const settle=text.match(/const COLLAPSE_SETTLE_MS = (\d+(?:e\d+)?);/),linger=text.match(/const SCROLLBAR_LINGER_MS = (\d+(?:e\d+)?);/)
  assert.ok(settle&&linger,'Installed sidebar timing constants are discoverable')
  nativeSidebar=`const COLLAPSE_SETTLE_MS=${settle[1]},SCROLLBAR_LINGER_MS=${linger[1]},SidebarRoot_module_css_default=${JSON.stringify(names)};${text.slice(componentStart,componentEnd)}`
  entry=tree;for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js'.split('/'))entry=entry.files[part]
  const layoutBytes=Buffer.alloc(entry.size);readSync(fd,layoutBytes,0,layoutBytes.length,8+head.readUInt32LE(4)+Number(entry.offset))
  const layout=layoutBytes.toString(),frameAt=layout.indexOf('AppFrame.module.css'),frameLiteral=layout.slice(layout.lastIndexOf('//#region',frameAt),layout.indexOf('//#endregion',frameAt)).match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)
  assert.ok(frameLiteral,'Installed AppFrame stylesheet found');nativeFrameCSS=JSON.parse(frameLiteral[1]);const framePrefix=nativeFrameCSS.match(/\.([\w]+)_frame\{/)[1];nativeFrameCSS=nativeFrameCSS.replaceAll(framePrefix+'_','af_')
  source='installed DSH SidebarRoot stylesheet and React component; synthetic frame and navigation'
 }finally{closeSync(fd)}
}
const built=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const extra=`:root{--dsw-specific-sidebar-fill:#f0f1f4;--dsw-alias-label-primary:#252934;--dsw-alias-label-secondary:#677080;--dsw-alias-state-business-primary:#7176dd;--dsw-radius-md:8px}.frame{grid-template-columns:260px 1fr;background:repeating-linear-gradient(145deg,#bad9df 0 90px,#d9cee5 90px 180px,#e6c9ba 180px 270px)}.nav{padding:0;background:#f0f1f4}.settings-dialog{inset:18px 30px 18px 290px;overflow:auto}.sb_logoRow{justify-content:space-between!important}.sb_regionArea{overflow:auto!important;min-height:0}.sb_sessionRow{display:flex;align-items:center;min-height:44px;margin:3px 0;padding:10px 8px;border:0;background:transparent;color:inherit;width:100%;text-align:left;cursor:pointer}.sb_sessionRow[aria-selected=true]{background:#b7becb66}.sb_sessionRow:hover{background:#a4abb922}.sb_footArea button{border:0;background:transparent;color:inherit;padding:12px}body[data-ds-dark-theme]{--dsw-specific-sidebar-fill:#20242e;--dsw-alias-label-primary:#edf0f7;--dsw-alias-label-secondary:#bcc4d3}.collapsed-frame{grid-template-columns:56px 1fr}.sb_root.sb_collapsed :is(.sb_regionArea,.sb_footArea,.sb_brand){display:none}.collapsed-frame .sb_logoRow{justify-content:center!important}`
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8').replace('</style>',hostCSS+extra+'</style>')],'/fixture.js':['text/javascript',built.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])});await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),context=await browser.newContext({viewport:{width:1200,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
const url=`http://127.0.0.1:${server.address().port}/?composer=interactive`,key='dsh-claude-beautify:settings:v1'
const root=page.locator('.sb_root:not([data-dcb-sidebar-ghost])'),indicator=root.locator('.dcb-sidebar-indicator'),group=page.getByRole('radiogroup',{name:'侧栏样式',exact:true})
async function settled(){await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));await page.waitForFunction(()=>!document.querySelector('[data-dcb-sidebar-moving]'));await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))}
async function prepare(){
 await page.goto(url);await page.getByTestId('todo-panel').waitFor()
 await page.evaluate(()=>{
  const nav=document.querySelector('.nav');nav.classList.add('host_sidebarCol');nav.innerHTML='<div class="sb_root" style="width:260px"><div class="sb_logoRow"><span class="sb_brand">DeepSeek Harness</span><button id="collapse-side" aria-label="收起左侧栏">☰</button></div><button class="sb_newSession">＋ 新对话</button><div class="sb_panelList"><button class="sb_panelRow">工作区</button></div><div class="sb_regionArea" role="tree" aria-label="演示会话">'+Array.from({length:8},(_,i)=>`<button class="sb_sessionRow" role="treeitem" aria-selected="${i===0}">演示会话 ${i+1}</button>`).join('')+'</div><div class="sb_footArea"><button id="fixture-settings">打开设置</button></div></div>'
  nav.querySelectorAll('[role=treeitem]').forEach(row=>row.onclick=()=>{nav.querySelectorAll('[role=treeitem]').forEach(el=>el.setAttribute('aria-selected',String(el===row)))})
  nav.querySelector('#collapse-side').classList.add('sb_iconButton','sb_toggle')
  nav.querySelector('#collapse-side').innerHTML='<svg class="sb_panelIcon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor"/><path d="M9 3v18" stroke="currentColor"/></svg>'
  nav.querySelector('#collapse-side').onclick=()=>{const collapsed=!document.querySelector('.frame').classList.contains('collapsed-frame');document.querySelector('.frame').classList.toggle('collapsed-frame',collapsed);document.querySelector('.frame').setAttribute('data-sidebar-collapsed',String(collapsed));nav.querySelector('.sb_root').classList.toggle('sb_collapsed',collapsed);nav.querySelector('#collapse-side').setAttribute('aria-label',collapsed?'展开左侧栏':'收起左侧栏')}
  window.cleanups=[];const FishLogo=()=>window.fixtureReact.createElement('span',null,'◒');window.__ModuleLoader__={load(spec){window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo}:window.fixtureReact)}}
 })
 await page.addScriptTag({url:new URL('/client.js',url).href})
 await page.evaluate(()=>{const ctx={slots:{inject(_n,cb){cb()},register(s,c){if(s.name==='settings.section')window.fixtureSettings=c;else{window.fixtureHeader=c;window.fixtureHeaderSpec=s}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_n,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh();document.querySelector('#fixture-settings').onclick=()=>window.fixture.settings(true)})
 await settled()
}
async function patch(value){await page.evaluate(({key,value})=>{const next=JSON.stringify({...JSON.parse(localStorage.getItem(key)||'{}'),...value});localStorage.setItem(key,next);window.dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},{key,value});await settled()}
let passed=0;async function check(name,fn){if(process.env.DSH_SIDEBAR_TEST&&!new RegExp(process.env.DSH_SIDEBAR_TEST).test(name))return;await fn();passed++;console.log('PASS '+name)}
try{
 await prepare()
 await check('default preserves the original sidebar and all options are keyboard reachable',async()=>{
  assert.equal(await root.getAttribute('data-dcb-sidebar-style'),null);await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'侧栏');assert.deepEqual(await group.getByRole('radio').evaluateAll(buttons=>buttons.map(el=>el.getAttribute('aria-label'))),['侧栏：默认','侧栏：透明玻璃','侧栏：轻量玻璃','侧栏：毛玻璃']);await group.getByRole('radio',{name:'侧栏：默认'}).press('ArrowRight');await settled();assert.equal(await root.getAttribute('data-dcb-sidebar-style'),'clear');await group.getByRole('radio',{name:'侧栏：透明玻璃'}).press('End');await settled();assert.equal(await root.getAttribute('data-dcb-sidebar-style'),'glass')
 })
 await check('all glass materials preserve native corners and independent light/dark palettes',async()=>{
  for(const dark of[false,true]){await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);for(const style of['css','glass','clear']){await patch({sidebarStyle:style});const s=await root.evaluate(el=>({radius:getComputedStyle(el).borderRadius,filter:getComputedStyle(el,'::before').backdropFilter,rootFilter:getComputedStyle(el).backdropFilter,width:el.getBoundingClientRect().width,fill:getComputedStyle(el,'::before').backgroundColor}));assert.equal(s.radius,'0px');assert.equal(s.width,await root.evaluate(el=>el.parentElement.clientWidth-12));assert.equal(s.rootFilter,'none');assert.match(s.fill,/rgba/);assert.match(s.filter,style==='css'?/blur\(2px\)/:style==='glass'?/blur\(22px\)/:/url\(/);await page.evaluate(()=>window.fixture.settings(false));await root.screenshot({path:resolve(output,`sidebar-${style}-${dark?'dark':'light'}.png`)});await page.evaluate(()=>window.fixture.settings(true))}}
  await page.evaluate(()=>document.body.removeAttribute('data-ds-dark-theme'));await patch({sidebarStyle:'css'})
 })
 await check('dark transparent and frosted sidebars retain a dark tint over bright artwork',async()=>{
  await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''))
  for(const [sidebarStyle,expected] of [['clear','rgba(24, 28, 36, 0.55)'],['glass','rgba(24, 28, 36, 0.62)']]){
   await patch({sidebarStyle});assert.equal(await root.evaluate(el=>getComputedStyle(el,'::before').backgroundColor),expected)
   await page.evaluate(()=>window.fixture.settings(false));await root.screenshot({path:resolve(output,`sidebar-${sidebarStyle}-dark.png`)});await page.evaluate(()=>window.fixture.settings(true))
  }
  await page.evaluate(()=>document.body.removeAttribute('data-ds-dark-theme'));await patch({sidebarStyle:'css'})
 })
 await check('material choices use the shared preview cards with reversible intermediate selection motion',async()=>{
  const plain=group.getByRole('radio',{name:'侧栏：默认'}),frosted=group.getByRole('radio',{name:'侧栏：毛玻璃'})
  await plain.evaluate(el=>window.originalStyleButton=el);await plain.click();await settled();await frosted.click();await page.waitForTimeout(80)
  const between=await frosted.locator('.dcb-style-swatch').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m42)
  assert.ok(between<0&&between>-6);assert.equal(await group.locator('.dcb-style-scene').count(),4)
  await group.getByRole('radio',{name:'侧栏：轻量玻璃'}).click();await settled();assert.equal(await plain.evaluate(el=>el===window.originalStyleButton),true)
 })
 await check('selection highlight moves without selecting on hover or replacing native rows',async()=>{
  await page.evaluate(()=>window.fixture.settings(false));await indicator.evaluate(el=>window.originalNavIndicator=el);await root.getByRole('treeitem',{name:'演示会话 4',exact:true}).hover();assert.equal(await root.getByRole('treeitem',{name:'演示会话 1',exact:true}).getAttribute('aria-selected'),'true');const first=await indicator.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m42);await root.getByRole('treeitem',{name:'演示会话 4',exact:true}).click();await page.waitForTimeout(70);const between=await indicator.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m42);await root.getByRole('treeitem',{name:'演示会话 2',exact:true}).click();await settled();assert.ok(between>first);assert.equal(await indicator.evaluate(el=>el===window.originalNavIndicator),true);assert.equal(await root.getByRole('treeitem',{name:'演示会话 2',exact:true}).getAttribute('aria-selected'),'true');await root.screenshot({path:resolve(output,'sidebar-selected-motion.png')})
 })
 await check('Windows titlebar toggle stays at the viewport and reopens a zero-width sidebar for every material',async()=>{
  await page.evaluate(()=>{document.documentElement.setAttribute('data-windows-titlebar','');document.documentElement.style.setProperty('--dsh-windows-titlebar-height','40px')})
  const chromeStyle=await page.addStyleTag({content:'[data-windows-titlebar] .frame{padding-top:40px;transition:grid-template-columns 240ms cubic-bezier(.4,0,.2,1)}[data-windows-titlebar] .nav{overflow:hidden;min-width:0;border:0}[data-windows-titlebar] .collapsed-frame{grid-template-columns:0px 1fr}'})
  const toggle=root.locator('#collapse-side')
  const target=async()=>toggle.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})
  for(const dark of[false,true]){
   await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark)
   for(const sidebarStyle of['milk','css','glass','clear']){
    await patch({sidebarStyle});const expanded=await target();assert.equal(expanded.x,12);assert.equal(expanded.y,6);assert.equal(expanded.hit,true)
    await toggle.click();await page.waitForTimeout(70);const column=await root.evaluate(el=>el.parentElement.getBoundingClientRect().width);assert.ok(column>0&&column<260,'native grid track has an intermediate collapse frame');assert.equal((await target()).hit,true)
    await settled();assert.equal(await root.evaluate(el=>el.parentElement.getBoundingClientRect().width),0);assert.equal(await root.getAttribute('data-dcb-sidebar-style'),null);assert.equal(await indicator.count(),0);const collapsed=await target();assert.equal(collapsed.x,12);assert.equal(collapsed.y,6);assert.equal(collapsed.hit,true)
    if(!dark&&sidebarStyle==='glass')await page.screenshot({path:resolve(output,'sidebar-windows-collapsed.png')})
    await toggle.click();await settled();assert.equal(await toggle.getAttribute('aria-label'),'收起左侧栏');assert.equal(await root.evaluate(el=>el.parentElement.getBoundingClientRect().width),260);assert.equal((await target()).hit,true);assert.equal(await root.getAttribute('data-dcb-sidebar-style'),sidebarStyle==='milk'?null:sidebarStyle)
   }
  }
  await page.evaluate(()=>{document.body.removeAttribute('data-ds-dark-theme');document.documentElement.removeAttribute('data-windows-titlebar');document.documentElement.style.removeProperty('--dsh-windows-titlebar-height')});await chromeStyle.evaluate(el=>el.remove());await patch({sidebarStyle:'css'})
 })
 await check('collapse, scroll and remount keep the indicator bounded and native controls usable',async()=>{
  await root.getByRole('button',{name:'收起左侧栏'}).click();await settled();assert.equal(await root.evaluate(el=>getComputedStyle(el).borderRadius),'0px');assert.equal(await indicator.isVisible(),false);assert.ok(await root.evaluate(el=>el.getBoundingClientRect().width<=56));await root.getByRole('button',{name:'展开左侧栏'}).click();await settled();assert.equal(await indicator.isVisible(),true);await root.locator('.sb_regionArea').evaluate(el=>{el.style.height='80px';el.style.flex='none';el.scrollTop=200});await settled();assert.equal(await indicator.isVisible(),false);await root.locator('.sb_regionArea').evaluate(el=>{el.style.height='';el.style.flex='';el.scrollTop=0});await settled();await root.evaluate(el=>{const clone=el.cloneNode(true);clone.querySelector('.dcb-sidebar-indicator')?.remove();clone.removeAttribute('data-dcb-sidebar-style');clone.removeAttribute('data-dcb-sidebar-motion');el.replaceWith(clone)});await settled();assert.equal(await root.getAttribute('data-dcb-sidebar-style'),'css');assert.equal(await indicator.count(),1)
 })
 await check('the toggle animates while opening keeps content width fixed and defers heavy glass until the native track settles',async()=>{
  // Remount from the previous check with a fresh native click handler.
  await prepare()
  await page.evaluate(()=>{
   document.documentElement.setAttribute('data-windows-titlebar','');document.documentElement.style.setProperty('--dsh-windows-titlebar-height','40px')
   window.sidebarMapEncodes=0;window.sidebarOriginalEncode=HTMLCanvasElement.prototype.toDataURL
   HTMLCanvasElement.prototype.toDataURL=function(...args){window.sidebarMapEncodes++;return window.sidebarOriginalEncode.apply(this,args)}
  })
  const chromeStyle=await page.addStyleTag({content:'[data-windows-titlebar] .frame{padding-top:40px;transition:grid-template-columns 240ms cubic-bezier(.4,0,.2,1)}[data-windows-titlebar] .nav{overflow:hidden;min-width:0;border:0}[data-windows-titlebar] .collapsed-frame{grid-template-columns:0px 1fr}'})
  const toggle=root.locator('#collapse-side')
  for(const sidebarStyle of ['clear','glass','css','milk']){
   await patch({sidebarStyle,sidebarMotion:true})
   const width=await root.locator('[role=treeitem]').first().evaluate(el=>el.getBoundingClientRect().width)
   await toggle.click();await settled();const before=await page.evaluate(()=>window.sidebarMapEncodes)
   // Trigger the host handler and collect actual intermediate styles in one
   // browser task; no screenshot or protocol latency can skip the motion.
   const samples=await toggle.evaluate(el=>new Promise(done=>{
    const samples=[],start=performance.now();el.click()
    function sample(){
     const root=el.closest('.sb_root'),icon=el.querySelector('svg'),row=root.querySelector('[role=treeitem]')
     samples.push({column:root.parentElement.getBoundingClientRect().width,row:row.getBoundingClientRect().width,moving:root.hasAttribute('data-dcb-sidebar-moving'),map:root.getAttribute('data-dcb-liquid-map'),backdrop:getComputedStyle(root,'::before').backdropFilter,scale:Number(getComputedStyle(el).scale),iconX:new DOMMatrix(getComputedStyle(icon).transform).m41,ripple:el.querySelector('.dcb-sidebar-toggle-ripple')!==null,encodes:window.sidebarMapEncodes})
     if(performance.now()-start<120)requestAnimationFrame(sample);else done(samples)
    }requestAnimationFrame(()=>requestAnimationFrame(sample))
   }))
   const middle=samples.filter(s=>s.column>1&&s.column<259)
   assert.ok(middle.length>=2,'multiple rendered grid-track frames were sampled')
   assert.ok(middle.every(s=>Math.abs(s.row-width)<.5),'the list never reflows to a partially expanded track width')
   assert.ok(middle.some(s=>s.scale>.93&&s.scale<.999&&Math.abs(s.iconX)>.2&&!s.ripple),'button has a restrained spring and directional icon motion without an expanding ring')
   if(sidebarStyle!=='milk')assert.ok(middle.every(s=>s.moving&&s.map===null&&s.backdrop==='none'&&s.encodes===before),'no SVG map generation or heavy backdrop while the native track moves')
   await page.screenshot({path:resolve(output,`sidebar-toggle-${sidebarStyle}.png`)})
   await settled()
   assert.equal(await toggle.evaluate(el=>el.getAnimations().filter(a=>a instanceof Animation&&!(a instanceof CSSTransition)).length),0,'finished toggle animations release their effects')
   assert.equal(await root.evaluate(el=>getComputedStyle(el).transform),'none','fixed titlebar controls have no transformed ancestor')
   if(sidebarStyle==='clear'){
    await page.waitForFunction(()=>document.querySelector('.sb_root')?.hasAttribute('data-dcb-liquid-map'))
    const warm=await page.evaluate(()=>window.sidebarMapEncodes)
    await toggle.click();await settled();await toggle.click();await settled()
    assert.equal(await page.evaluate(()=>window.sidebarMapEncodes),warm,'reopening at the same size reuses the cached refraction map')
    await root.evaluate(el=>el.style.width='300px');await page.waitForFunction(()=>Math.abs(document.querySelector('.sb_root').getBoundingClientRect().width-288)<.5)
    await root.evaluate(el=>el.style.width='260px');await settled()
   }
  }
  await toggle.press('Enter');await settled();assert.equal(await toggle.locator('svg').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m11),-1,'collapsed icon keeps its reversed panel direction')
  const beforeReverse=await toggle.evaluate(el=>new Promise(done=>{el.click();const initial=el.getAnimations().length;requestAnimationFrame(()=>{el.click();requestAnimationFrame(()=>done({initial,active:el.getAnimations().filter(a=>!(a instanceof CSSTransition)).length}))})}))
  assert.ok(beforeReverse.initial>0&&beforeReverse.active<=1,'click feedback starts synchronously and rapid reversal replaces its previous pulse')
  await settled();await toggle.click();await settled()
  await patch({sidebarMotion:false});assert.equal(await toggle.getAttribute('data-dcb-sidebar-toggle'),'false')
  await toggle.click();await page.waitForTimeout(50);assert.equal(await toggle.evaluate(el=>el.getAnimations().filter(a=>!(a instanceof CSSTransition)).length),0);await settled();await toggle.click();await settled()
  await patch({sidebarMotion:true});await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('[data-dcb-sidebar-toggle="false"]'))
  await toggle.click();assert.equal(await toggle.evaluate(el=>el.getAnimations().filter(a=>!(a instanceof CSSTransition)).length),0);await settled();await toggle.click();await settled();await page.emulateMedia({reducedMotion:'no-preference'})
  await page.evaluate(()=>{HTMLCanvasElement.prototype.toDataURL=window.sidebarOriginalEncode;document.documentElement.removeAttribute('data-windows-titlebar');document.documentElement.style.removeProperty('--dsh-windows-titlebar-height')});await chromeStyle.evaluate(el=>el.remove());await patch({sidebarStyle:'css'})
 })
 await check('motion toggle, reduced motion, forced colors and default release work independently',async()=>{
  await patch({sidebarMotion:false,composerStyle:'css',cardStyle:'glass'});assert.equal(await indicator.evaluate(el=>getComputedStyle(el).transitionDuration),'0s');await patch({sidebarMotion:true});await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await indicator.evaluate(el=>getComputedStyle(el).transitionDuration),'0s');assert.equal(await root.evaluate(el=>getComputedStyle(el,'::before').transitionDuration),'0s');await page.emulateMedia({forcedColors:'active'});assert.equal(await root.evaluate(el=>getComputedStyle(el).backdropFilter),'none');assert.equal(await root.evaluate(el=>getComputedStyle(el,'::before').backdropFilter),'none');await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'});await patch({sidebarStyle:'milk'});assert.equal(await indicator.count(),0);assert.equal(await root.getAttribute('data-dcb-sidebar-style'),null);assert.equal(await page.locator('[data-dcb-sidebar-column]').count(),0);assert.equal(await root.evaluate(el=>el.style.getPropertyValue('--dcb-sidebar-expanded-width')),'');assert.equal(await page.locator('[data-dcb-composer-style]').getAttribute('data-dcb-composer-style'),'css');await patch({sidebarStyle:'clear'});await page.evaluate(()=>{for(const c of [...window.cleanups].reverse())if(typeof c==='function')c()});await settled();assert.equal(await indicator.count(),0);assert.equal(await page.locator('[data-dcb-sidebar-style], [data-dcb-sidebar-column], [data-dcb-sidebar-toggle], [data-dcb-sidebar-moving]').count(),0)
 })
 await check('preferences survive reload and fit a narrow expanded sidebar',async()=>{
  await prepare();assert.equal(await root.getAttribute('data-dcb-sidebar-style'),'clear');await page.setViewportSize({width:390,height:844});await page.addStyleTag({content:'.nav{display:block!important}.frame{grid-template-columns:260px minmax(0,1fr)!important}'});await settled();assert.ok(await root.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth}));await root.screenshot({path:resolve(output,'sidebar-narrow.png')})
 })
 if(nativeSidebar)await check('the installed React SidebarRoot itself repeatedly collapses and reopens using its native handler',async()=>{
  await page.setViewportSize({width:1200,height:900});await prepare()
  const native=await build({stdin:{contents:`import React from 'react';import * as jsxRuntime from 'react/jsx-runtime';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';const react=React,react_jsx_runtime=jsxRuntime,clsx=(...names)=>names.filter(Boolean).join(' '),localBuildVersion=()=>undefined;const icon=({size=16,...props})=>React.createElement('svg',{...props,width:size,height:size,viewBox:'0 0 24 24','aria-hidden':true},React.createElement('rect',{x:3,y:3,width:18,height:18,rx:2,fill:'none',stroke:'currentColor',strokeWidth:2}),React.createElement('path',{d:'M9 3v18',stroke:'currentColor',strokeWidth:2})),_deepseek_ai_dsh_client_ui_primitives={Tooltip:({children})=>children,isDarwinDesktop:()=>false,FishLogo:icon,IconPanelLeftOutlineRegular:icon,IconNewChatOutlineMedium:icon,IconNewChatOutlineRegular:icon,ShortcutKeys:()=>null};${nativeSidebar}
   window.mountNativeSidebar=seat=>{const root=createRoot(seat);function Native(){const[collapsed,setCollapsed]=React.useState(false);React.useLayoutEffect(()=>{const frame=document.querySelector('.frame');frame.classList.toggle('collapsed-frame',collapsed);frame.setAttribute('data-sidebar-collapsed',String(collapsed))},[collapsed]);return React.createElement(SidebarRoot,{collapsed,width:260,startSession(){},toggleSidebar:()=>setCollapsed(value=>!value),usePanels:()=>[],useShortcuts:()=>[],t:key=>key==='toggle.open'?'展开左侧栏':key==='toggle.collapse'?'收起左侧栏':key,renderSlot:(name,props,options)=>name==='sidebar.workspaces'?React.createElement('button',{role:'treeitem','aria-selected':true,className:'sb_sessionRow'},'演示会话'):options?.fallback??null})}flushSync(()=>root.render(React.createElement(Native)))};`,resolveDir:project},bundle:true,write:false,format:'iife'})
  await page.addScriptTag({content:native.outputFiles[0].text});await page.evaluate(()=>{document.documentElement.setAttribute('data-windows-titlebar','');document.documentElement.style.setProperty('--dsh-windows-titlebar-height','40px');window.mountNativeSidebar(document.querySelector('.nav'))})
  await page.addStyleTag({content:'[data-windows-titlebar] .frame{padding-top:40px;transition:grid-template-columns 240ms cubic-bezier(.4,0,.2,1)}[data-windows-titlebar] .nav{overflow:hidden;min-width:0;border:0}[data-windows-titlebar] .collapsed-frame{grid-template-columns:0px 1fr}'})
  await page.addStyleTag({content:nativeFrameCSS});await page.evaluate(()=>{document.querySelector('.frame').classList.add('af_frame');document.querySelector('.nav').classList.add('af_sidebarCol');document.querySelector('main').classList.add('af_centerCol')})
  for(const sidebarStyle of['clear','glass','css','milk']){
   await patch({sidebarStyle});await root.getByRole('button',{name:'收起左侧栏',exact:true}).click();await settled();assert.equal(await root.evaluate(el=>el.parentElement.getBoundingClientRect().width),0)
   await page.mouse.move(1100,850)
   const open=root.getByRole('button',{name:'展开左侧栏',exact:true});assert.equal(await open.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),true)
   const iconState=await open.locator('.sb_panelIcon').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {display:s.display,visibility:s.visibility,opacity:Number(s.opacity),width:r.width,height:r.height,color:s.color}});assert.notEqual(iconState.display,'none');assert.equal(iconState.visibility,'visible');assert.equal(iconState.opacity,1);assert.ok(iconState.width>=14&&iconState.height>=14,'the real native panel SVG remains visible without hover')
   const pulse=await open.evaluate(el=>{el.click();return {scale:el.getAnimations().some(a=>a.effect.getKeyframes().some(frame=>Number(frame.scale)===.94)),ring:el.querySelector('.dcb-sidebar-toggle-ripple')!==null}})
   assert.deepEqual(pulse,{scale:true,ring:false},'the installed native React toggle starts restrained feedback immediately without a ring')
   await settled();assert.equal(await root.getByRole('button',{name:'收起左侧栏',exact:true}).count(),1);assert.equal(await root.evaluate(el=>el.parentElement.getBoundingClientRect().width),260)
  }
 })
 if(nativeSidebar)await check('the collapsed native rail keeps one panel icon visible without hover with motion on or off',async()=>{
  await page.evaluate(()=>document.documentElement.removeAttribute('data-windows-titlebar'))
  for(const dark of [false,true])for(const sidebarMotion of [true,false])for(const sidebarStyle of ['milk','css','glass','clear']){
   await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark)
   await patch({sidebarStyle,sidebarMotion});await root.getByRole('button',{name:'收起左侧栏',exact:true}).click();await settled()
   await page.waitForFunction(()=>document.querySelector('.sb_root:not([data-dcb-sidebar-ghost])')?.classList.contains('sb_collapsed'));await settled();await page.mouse.move(1100,850)
   const open=root.getByRole('button',{name:'展开左侧栏',exact:true}),panel=open.locator('.sb_panelIcon')
   assert.notEqual(await panel.evaluate(el=>getComputedStyle(el).display),'none','the collapsed panel icon must be visible before hover')
   assert.ok(await panel.evaluate(el=>{const r=el.getBoundingClientRect();return r.width>=14&&r.height>=14}),'the native SVG has a visible rendered area')
   assert.equal(await open.locator('.sb_railMark').isVisible(),false,'the replacement brand mark must not duplicate the panel icon')
   const target=await open.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {clickable:el.contains(hit),rect:r.toJSON(),hit:hit?.outerHTML.slice(0,250),root:el.closest('.sb_root').getBoundingClientRect().toJSON()}})
   assert.equal(target.clickable,true,JSON.stringify({sidebarMotion,sidebarStyle,dark,...target}))
   await open.hover();assert.notEqual(await panel.evaluate(el=>getComputedStyle(el).display),'none');await page.mouse.move(1100,850)
   if(sidebarStyle==='milk')await page.screenshot({path:resolve(output,`sidebar-native-rail-${dark?'dark':'light'}-motion-${sidebarMotion}.png`)})
   await open.click();await settled()
  }
  await page.evaluate(()=>{document.documentElement.setAttribute('data-windows-titlebar','');document.body.removeAttribute('data-ds-dark-theme')});await patch({sidebarMotion:true})
 })
 if(nativeSidebar)await check('native sidebar content slides and fades in BOTH directions, reverses without a track jump, and releases its exit copy',async()=>{
  const toggle=root.getByRole('button',{name:/左侧栏/,exact:false})
  await page.evaluate(()=>document.querySelector('.frame').style.transition='none')
  const samples=()=>toggle.evaluate(el=>new Promise(done=>{
   const result=[],start=performance.now();el.click()
   const tick=()=>{
    const root=el.closest('.sb_root'),column=root.parentElement,ghost=column.querySelector('[data-dcb-sidebar-ghost]'),seat=ghost||root.querySelector('.sb_regionArea'),style=getComputedStyle(seat),r=column.getBoundingClientRect()
    result.push({width:r.width,opacity:Number(style.opacity),x:new DOMMatrix(style.transform).m41,blur:style.filter,ghost:!!ghost,visibleContent:getComputedStyle(seat.querySelector('.sb_sessionRow')).display!=='none',inert:ghost?.inert,aria:ghost?.getAttribute('aria-hidden'),ghostWidth:ghost?.getBoundingClientRect().width,duplicateControls:ghost?.querySelectorAll('[id], .sb_toggle, [contenteditable], input, textarea').length})
    if(performance.now()-start<140)requestAnimationFrame(tick);else done(result)
   };requestAnimationFrame(()=>requestAnimationFrame(tick))
  }))
  for(const sidebarStyle of ['milk','css','glass','clear']){
   await patch({sidebarStyle,sidebarMotion:true})
   assert.equal(await root.evaluate(el=>getComputedStyle(el.parentElement.parentElement).transitionDuration),'0.5s','the plugin supplies its own slower symmetric track transition')
   const expandedWidth=await root.evaluate(el=>el.getBoundingClientRect().width),closing=await samples(),middle=closing.filter(s=>s.width>1&&s.width<259)
   assert.ok(middle.length>=2,'closing has several rendered widths')
   assert.ok(middle.every(s=>s.ghost&&s.visibleContent&&s.inert&&s.aria==='true'&&s.duplicateControls===0&&Math.abs(s.ghostWidth-expandedWidth)<.5),'the outgoing content remains visible at full width after native React hides/removes it')
   assert.ok(middle.some(s=>s.opacity>0&&s.opacity<.98&&s.x<-.2&&/blur\(/.test(s.blur)),'exit opacity, translation and blur have genuine intermediate values')
   await page.screenshot({path:resolve(output,`sidebar-exit-${sidebarStyle}.png`)})
   await settled();assert.equal(await page.locator('[data-dcb-sidebar-ghost]').count(),0)
   const opening=await samples(),entering=opening.filter(s=>s.width>1&&s.width<259)
   assert.ok(entering.length>=2,'opening has several rendered widths')
   assert.ok(entering.some(s=>!s.ghost&&s.visibleContent&&s.opacity>0&&s.opacity<.98&&s.x<-.2&&/blur\(/.test(s.blur)),'the actual incoming content animates with the expanding track')
   await page.screenshot({path:resolve(output,`sidebar-enter-${sidebarStyle}.png`)})
   await settled();assert.equal(await root.locator('.sb_regionArea').evaluate(el=>el.getAttribute('style')),null,'entry animation leaves no frozen dimensions or transforms')
  }
  await toggle.evaluate(el=>el.click());await page.waitForTimeout(70)
  const reversed=await toggle.evaluate(el=>{const column=el.closest('.sb_root').parentElement,before=column.getBoundingClientRect().width;el.click();return {before,after:column.getBoundingClientRect().width}})
  assert.ok(reversed.before>0&&reversed.before<260&&Math.abs(reversed.after-reversed.before)<1,'quick reversal continues from the currently rendered grid width')
  await settled();assert.equal(await page.locator('[data-dcb-sidebar-ghost]').count(),0)
  await page.evaluate(()=>document.querySelector('.frame').setAttribute('data-dragging',''))
  assert.equal(await root.evaluate(el=>getComputedStyle(el.parentElement.parentElement).transitionDuration),'0s');await page.evaluate(()=>document.querySelector('.frame').removeAttribute('data-dragging'))
  await patch({sidebarMotion:false});assert.equal(await root.evaluate(el=>getComputedStyle(el.parentElement.parentElement).transitionDuration),'0s');await toggle.evaluate(el=>el.click());await settled();assert.equal(await page.locator('[data-dcb-sidebar-ghost]').count(),0);await toggle.evaluate(el=>el.click());await settled()
  await patch({sidebarMotion:true});await page.emulateMedia({reducedMotion:'reduce'});await settled();assert.equal(await root.evaluate(el=>getComputedStyle(el.parentElement.parentElement).transitionDuration),'0s');await page.emulateMedia({reducedMotion:'no-preference'});await settled()
  await toggle.evaluate(el=>el.click());await page.waitForTimeout(55);assert.equal(await page.locator('[data-dcb-sidebar-ghost]').count(),1)
  await page.evaluate(()=>{for(const c of [...window.cleanups].reverse())if(typeof c==='function')c()});await settled()
  assert.equal(await page.locator('[data-dcb-sidebar-ghost], [data-dcb-sidebar-frame-motion], [data-dcb-sidebar-resizing], [data-dcb-sidebar-moving], .dcb-sidebar-toggle-ripple').count(),0,'disposal during collapse releases the visual copy, timers, markers and effects')
 })
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,source,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
