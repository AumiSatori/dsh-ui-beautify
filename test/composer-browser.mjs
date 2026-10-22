import assert from 'node:assert/strict'
import {readFileSync, mkdirSync, openSync, readSync, closeSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','.scratch','claude-beautify'),'composer')
mkdirSync(output,{recursive:true})
let inputCSS='.cf_root{display:flex;flex-direction:column;align-items:center}.cf_card{position:relative;display:flex;flex-direction:column;gap:12px;width:100%;max-width:720px;padding-top:8px;background:var(--dsw-specific-input-major);border:0;border-radius:20px;box-shadow:0 1px 5px #0002}.cf_grow{position:relative}.cf_input{min-height:36px;padding:4px 14px;outline:none;white-space:pre-wrap;color:var(--dsw-alias-label-primary);caret-color:var(--dsw-alias-state-business-primary)}.cf_placeholder{position:absolute;inset:4px 14px auto;pointer-events:none;color:var(--dsw-alias-label-caption)}.cf_row,.cf_tools,.cf_trailing{display:flex;align-items:center;gap:12px}.cf_row{justify-content:space-between;padding:2px 8px 6px}.cf_primary,.cf_add{border:0;border-radius:50%;width:34px;height:34px}.cf_primary{background:#4d6bfe;color:white}.cf_overlayAnchor{position:absolute;inset:0 0 auto;height:0}'
let source='portable public-marker fixture'
if(process.env.DSH_ASAR){
 const fd=openSync(process.env.DSH_ASAR,'r')
 try{
  const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
  const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
  let entry=JSON.parse(json.toString('utf8'))
  for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js'.split('/'))entry=entry.files[part]
  const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset))
  const host=bytes.toString('utf8')
  for(const marker of ['data-composer-seat','data-composer-card','data-composer-input'])assert.ok(host.includes(`"${marker}"`),`Installed host exposes ${marker}`)
  const at=host.indexOf('InputBar.module.css'),start=host.lastIndexOf('//#region',at),end=host.indexOf('//#endregion',at)
  const literal=host.slice(start,end).match(/const css\$\d+ = ("(?:[^"\\]|\\.)*");/)
  assert.ok(literal,'Installed InputBar stylesheet is discoverable')
  const stylesheet=JSON.parse(literal[1]),prefix=stylesheet.match(/\.([A-Za-z0-9]+)_card\{/)
  assert.ok(prefix,'Installed card selector is discoverable')
  inputCSS=stylesheet.replaceAll(prefix[1]+'_','cf_')
  source='installed DSH InputBar stylesheet and public DOM markers; synthetic editor behavior'
 }finally{closeSync(fd)}
}
const fixtureCSS=`:root{--dsw-specific-input-major:#f4f5f7;--dsw-alias-label-primary:#202124;--dsw-alias-label-secondary:#656d78;--dsw-alias-label-caption:#737982;--dsw-alias-state-business-primary:#4d6bfe;--dsw-alias-button-info-fill:#4d6bfe;--dsw-alias-button-info-hover:#3b53d8;--dsw-specific-selector:#202a3c0d;--dsw-alias-border-l2:#d9dde5;--dsw-radius-panel:20px;--dsw-radius-sm:6px;--dsw-font-family:system-ui,sans-serif;--dsw-elevation-soft:0 1px 5px #0002;--dsh-composer-side-clearance:0px;--dsh-composer-card-max-width:720px;--dsh-composer-text-max-height:180px}body[data-ds-dark-theme]{--dsw-specific-input-major:#25272f;--dsw-alias-label-primary:#f2f4f8;--dsw-alias-label-secondary:#c5cbd5;--dsw-alias-label-caption:#aab0bb;--dsw-alias-state-business-primary:#8b9bff}.cf_card{line-height:24px}.cf_fixture_menu{position:absolute;bottom:10px;left:12px;z-index:30;padding:12px;background:var(--dsw-specific-input-major);box-shadow:0 5px 20px #0003;border-radius:10px}.cf_fixture_files{margin:0;padding:4px 24px;color:var(--dsw-alias-label-primary)}.composer-seat{background:radial-gradient(ellipse at 40% 50%,#7b9bb222,transparent 65%),#e7eaf0!important}body[data-ds-dark-theme] .composer-seat{background:radial-gradient(ellipse at 40% 50%,#7b9bb222,transparent 65%),#141414!important}`
const built=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={
 '/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8').replace('</style>',`${inputCSS}${fixtureCSS}</style>`)],
 '/fixture.js':['text/javascript',built.outputFiles[0].text],
 '/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')],
}
const server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];if(!route){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}/?composer=interactive`
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const context=await browser.newContext({viewport:{width:1200,height:950},deviceScaleFactor:1})
const page=await context.newPage()
const errors=[];page.on('pageerror',error=>errors.push(error.message))
const key='dsh-claude-beautify:settings:v1',card=page.locator('[data-composer-card]'),input=page.getByRole('textbox',{name:'合成消息输入'})
let passed=0
async function check(name,run){await run();passed++;console.log('PASS '+name)}
async function settled(target=page){await target.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));await target.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))}
async function mount(target=page){
 await target.getByTestId('todo-panel').waitFor()
 await target.evaluate(()=>{window.cleanups=[];const FishLogo=()=>window.fixtureReact.createElement('span',{'aria-hidden':true},'◒');window.__ModuleLoader__={load(spec){window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo}:window.fixtureReact)}}})
 await target.addScriptTag({url:new URL('/client.js',url).href})
 await target.evaluate(()=>{const ctx={slots:{inject(_name,cb){cb()},register(spec,c){if(spec.name==='settings.section')window.fixtureSettings=c;else{window.fixtureHeader=c;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
 await settled(target)
}
async function patch(value){await page.evaluate(({key,value})=>{const next=JSON.stringify({...JSON.parse(localStorage.getItem(key)||'{}'),...value});localStorage.setItem(key,next);window.dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},{key,value});await settled()}
const style=()=>card.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{background:s.backgroundColor,image:s.backgroundImage,filter:s.backdropFilter,shadow:s.boxShadow,transform:s.transform,overflow:s.overflow,border:s.borderWidth,radius:s.borderRadius,width:r.width,height:r.height}})
try{
 await page.goto(url);await mount()
 await check('composer glass is enabled by default and its real switch changes only appearance without replacing the editor',async()=>{
  assert.equal(await page.locator('body').getAttribute('data-dcb-composer-glass'),'')
  assert.match((await style()).filter,/blur\(2px\)/);assert.doesNotMatch((await style()).filter,/url\(/)
  await input.evaluate(el=>{window.originalEditor=el;window.originalComposer=el.closest('[data-composer-card]')})
  await page.evaluate(()=>window.fixture.settings(true))
  const toggle=page.getByRole('switch',{name:'启用输入栏美化',exact:true})
  assert.equal(await toggle.getAttribute('aria-checked'),'true')
  await toggle.click();await settled();const plain=await style()
  assert.equal(await page.locator('body').getAttribute('data-dcb-composer-glass'),null)
  await toggle.click();await settled();const glass=await style()
  assert.deepEqual([glass.width,glass.height,glass.border,glass.radius],[plain.width,plain.height,plain.border,plain.radius])
  assert.notEqual(glass.shadow,plain.shadow)
  assert.equal(await input.evaluate(el=>el===window.originalEditor&&el.closest('[data-composer-card]')===window.originalComposer),true)
  await page.evaluate(()=>window.fixture.settings(false));await settled()
 })
 await check('input styles have their own four-choice picker, keyboard navigation and native fallback without changing the task-card choice',async()=>{
  await page.evaluate(()=>window.fixture.settings(true))
  const group=page.getByRole('radiogroup',{name:'输入栏样式',exact:true})
  assert.equal(await group.getByRole('radio').count(),4)
  await page.locator('[data-dcb-settings-block="composer"]').screenshot({path:resolve(output,'composer-style-settings.png')})
  await group.getByRole('radio',{name:'输入栏：轻量玻璃',exact:true}).focus()
  await page.keyboard.press('ArrowRight')
  assert.equal(await group.getByRole('radio',{name:'输入栏：毛玻璃',exact:true}).getAttribute('aria-checked'),'true')
  await page.keyboard.press('End')
  assert.equal(await group.getByRole('radio',{name:'输入栏：默认',exact:true}).getAttribute('aria-checked'),'true')
  await settled();assert.equal(await card.getAttribute('data-dcb-composer-style'),null)
  await page.keyboard.press('Home')
  assert.equal(await group.getByRole('radio',{name:'输入栏：透明玻璃',exact:true}).getAttribute('aria-checked'),'true')
  const choices={clear:['透明玻璃',0],css:['轻量玻璃',2],glass:['毛玻璃',22],milk:['默认',0]}
  const dimensions=await style()
  for(const dark of[false,true])for(const[value,[label,blur]]of Object.entries(choices)){
   await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark)
   await group.getByRole('radio',{name:`输入栏：${label}`,exact:true}).click();await settled()
   const current=await style()
   assert.equal(Number(current.filter.match(/blur\(([\d.]+)px\)/)?.[1]||0),blur)
   assert.equal(await card.getAttribute('data-dcb-composer-style'),value==='milk'?null:value)
   assert.equal(current.width,dimensions.width);assert.equal(current.height,dimensions.height)
   const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
   assert.equal(stored.composerStyle,value);assert.equal(stored.cardStyle,'milk')
   await card.screenshot({path:resolve(output,`composer-style-${value}-${dark?'dark':'light'}.png`),style:'.settings-dialog{visibility:hidden!important}'})
  }
  await group.getByRole('radio',{name:'输入栏：轻量玻璃',exact:true}).click()
  await page.evaluate(()=>{document.body.removeAttribute('data-ds-dark-theme');window.fixture.settings(false)});await settled()
 })
 await check('clicking or focusing the composer preserves its neutral glass rim and native caret in both themes',async()=>{
  const appearance=()=>card.evaluate(el=>{const s=getComputedStyle(el),input=el.querySelector('[data-composer-input]');return{outline:s.outlineColor,width:s.outlineWidth,shadow:s.boxShadow,caret:getComputedStyle(input).caretColor,focused:el.contains(document.activeElement)}})
  for(const dark of[false,true])for(const composerStyle of['css','clear','glass']){
   await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark)
   await patch({composerStyle})
   await input.evaluate(el=>el.blur());await settled()
   const before=await appearance()
   assert.equal(before.focused,false)
   await input.click();await settled()
   const clicked=await appearance()
   assert.equal(clicked.focused,true)
   assert.equal(clicked.outline,before.outline);assert.equal(clicked.width,before.width)
   assert.equal(clicked.shadow,before.shadow);assert.equal(clicked.caret,before.caret)
   assert.notEqual(clicked.outline,clicked.caret)
   await input.evaluate(el=>el.blur());await input.focus();await settled()
   assert.equal((await appearance()).outline,before.outline)
   await card.screenshot({path:resolve(output,`composer-focus-${composerStyle}-${dark?'dark':'light'}.png`)})
  }
  await page.evaluate(()=>document.body.removeAttribute('data-ds-dark-theme'))
  await patch({composerStyle:'css'});await input.evaluate(el=>el.blur());await page.mouse.move(10,500)
 })
 await check('transparent input glass tracks the pointer without moving the editor, then releases optics when returning to CSS',async()=>{
  await input.fill('输入栏样式保持编辑内容')
  await input.focus();await input.evaluate(el=>{window.inputBeforeOptics=el;window.inputBeforeText=el.textContent})
  await patch({composerStyle:'clear'})
  await page.waitForFunction(()=>document.querySelector('[data-composer-card]')?.getAttribute('data-dcb-liquid')==='active')
  const before=await style(),bounds=await card.boundingBox()
  await page.mouse.move(bounds.x+bounds.width*.7,bounds.y+20);await settled()
  assert.equal(await input.evaluate(el=>el===window.inputBeforeOptics&&el.textContent===window.inputBeforeText),true)
  assert.deepEqual([(await style()).width,(await style()).height],[before.width,before.height])
  await patch({composerStyle:'css'})
  assert.equal(await card.getAttribute('data-dcb-liquid'),null)
  assert.doesNotMatch((await style()).filter,/url\(/)
  assert.equal(await input.evaluate(el=>el===window.inputBeforeOptics),true)
  await input.fill('');await page.mouse.move(10,500)
 })
 await check('typing, composing selection and synthetic send continue across appearance changes',async()=>{
  await input.fill('中文输入测试')
  await input.focus();await input.dispatchEvent('compositionstart')
  await input.evaluate(el=>{const selection=getSelection();window.composerSelection={node:selection.anchorNode,offset:selection.anchorOffset};window.editingNode=el})
  await patch({composerGlass:false});await patch({composerGlass:true})
  assert.equal(await input.evaluate(el=>{const selection=getSelection();return el===window.editingNode&&document.activeElement===el&&selection.anchorNode===window.composerSelection.node&&selection.anchorOffset===window.composerSelection.offset}),true)
  await input.dispatchEvent('keydown',{key:'Enter',isComposing:true,bubbles:true})
  assert.equal(await page.evaluate(()=>window.composerTest.sent.length),0)
  await input.dispatchEvent('compositionend',{data:'中文输入测试'})
  await page.getByRole('button',{name:'合成发送',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.composerTest.sent.at(-1).text),'中文输入测试')
  assert.equal(await input.textContent(),'')
 })
 await check('attachment selection, drop, model menu and send remain reachable without decorative overlays',async()=>{
  await page.getByLabel('合成文件选择').setInputFiles({name:'selected-example.txt',mimeType:'text/plain',buffer:Buffer.from('synthetic')})
  await card.evaluate(el=>{const transfer=new DataTransfer();transfer.items.add(new File(['synthetic'],'dropped-example.txt',{type:'text/plain'}));el.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}))})
  assert.deepEqual(await page.getByRole('list',{name:'合成附件'}).locator('li').allTextContents(),['selected-example.txt','dropped-example.txt'])
  await page.getByRole('button',{name:'合成模型选择',exact:true}).click()
  await page.getByRole('menuitem',{name:'合成模型选项'}).click()
  assert.equal(await page.getByRole('menu').count(),0)
  assert.equal(await card.evaluate(el=>getComputedStyle(el,'::after').content),'none')
  await page.getByRole('button',{name:'合成发送',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.composerTest.sent.at(-1).files.length),2)
 })
 await check('composer preference is independent from task-panel enablement and material',async()=>{
  await patch({enabled:false,cardStyle:'clear',composerGlass:true})
  assert.match((await style()).filter,/blur\(2px\)/)
  await patch({enabled:true,cardStyle:'css',composerGlass:false})
  assert.doesNotMatch((await style()).filter,/blur\(2px\)/)
  assert.equal(await card.getAttribute('data-card-style'),null)
  await patch({composerGlass:true,cardStyle:'milk'})
 })
 await check('composer appearance survives reload and synchronizes across windows',async()=>{
  await patch({composerGlass:false});await page.reload();await mount()
  assert.equal(await page.locator('body').getAttribute('data-dcb-composer-glass'),null)
  const other=await page.context().newPage()
  try{await other.goto(url);await mount(other);await other.evaluate(()=>window.fixture.settings(true));await other.getByRole('switch',{name:'启用输入栏美化',exact:true}).click();await other.getByRole('radio',{name:'输入栏：毛玻璃',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-composer-card]')?.getAttribute('data-dcb-composer-style')==='glass');await settled();assert.match((await style()).filter,/blur\(22px\)/)}finally{await other.close()}
  await page.reload();await mount();assert.match((await style()).filter,/blur\(22px\)/)
  await patch({composerStyle:'css'})
 })
 await check('newly mounted conversation inputs inherit glass while text remains selectable and controls keep their geometry',async()=>{
  await page.evaluate(()=>window.fixture.detach(true));await card.waitFor({state:'detached'})
  await page.evaluate(()=>window.fixture.detach(false));await card.waitFor();await settled()
  assert.match((await style()).filter,/blur\(2px\)/)
  await input.fill('可选择的合成文字')
  const before=await input.evaluate(el=>({color:getComputedStyle(el).color,filter:getComputedStyle(el).filter,userSelect:getComputedStyle(el).userSelect}))
  await patch({composerGlass:false});const after=await input.evaluate(el=>({color:getComputedStyle(el).color,filter:getComputedStyle(el).filter,userSelect:getComputedStyle(el).userSelect}))
  assert.deepEqual(before,after);await patch({composerGlass:true})
 })
 await check('light, dark and narrow layouts retain readable native text, no horizontal overflow and no SVG optical state',async()=>{
  for(const dark of[false,true]){
   await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);await settled()
   assert.equal((await style()).background,dark?'rgba(24, 28, 36, 0.78)':'rgba(255, 255, 255, 0.56)')
   assert.equal(await input.evaluate(el=>getComputedStyle(el).color),dark?'rgb(242, 244, 248)':'rgb(32, 33, 36)')
   await card.screenshot({path:resolve(output,`composer-${dark?'dark':'light'}.png`)})
   await page.setViewportSize({width:390,height:844});await settled()
   const fits=await card.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&el.scrollWidth<=el.clientWidth+1})
   assert.ok(fits);await card.screenshot({path:resolve(output,`composer-${dark?'dark':'light'}-narrow.png`)})
   await page.setViewportSize({width:1200,height:950})
  }
  assert.equal(await card.getAttribute('data-dcb-liquid'),null)
  assert.equal(await page.locator('[data-dcb-liquid-defs]').count(),0)
 })
 await check('reduced motion and forced colors use stable accessible composer surfaces',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});await settled()
  assert.equal(await card.evaluate(el=>getComputedStyle(el).transitionDuration),'0s')
  await page.emulateMedia({forcedColors:'active'});await settled()
  assert.equal((await style()).filter,'none');assert.equal((await style()).shadow,'none')
  assert.doesNotMatch((await style()).background,/rgba/)
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
 })
 await check('disposal restores the host appearance and original body marker without removing the editor or its events',async()=>{
  await input.evaluate(el=>window.disposalEditor=el)
  await page.evaluate(()=>{for(const cleanup of [...window.cleanups].reverse())if(typeof cleanup==='function')cleanup()});await settled()
  assert.equal(await page.locator('body').getAttribute('data-dcb-composer-glass'),null)
  assert.doesNotMatch((await style()).filter,/blur\(2px\)/)
  assert.equal(await input.evaluate(el=>el===window.disposalEditor),true)
  await input.fill('卸载后的合成消息');await page.getByRole('button',{name:'合成发送',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.composerTest.sent.at(-1).text),'卸载后的合成消息')
  await page.reload();await page.evaluate(()=>document.body.setAttribute('data-dcb-composer-glass','preexisting'));await mount()
  await page.evaluate(()=>{for(const cleanup of [...window.cleanups].reverse())if(typeof cleanup==='function')cleanup()})
  assert.equal(await page.locator('body').getAttribute('data-dcb-composer-glass'),'preexisting')
 })
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed,source,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
