import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {registerRunningAssets} from '../server/running-assets.js'
import {createRunningZip} from '../scripts/build-animation-pack.mjs'
import {selectSettingsCategory} from './settings-navigation.mjs'
import {nativeLogo,installLogoFixture} from './native-logo.mjs'
const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'../../running-qa'))
mkdirSync(output,{recursive:true})
const fixture=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'}),routes=new Map()
let stopAssets
registerRunningAssets({inject(_names,fn){stopAssets=fn({webServer:{register(spec){routes.set(spec.path,spec.handler);return()=>routes.delete(spec.path)}}})}})
const files={'/':['text/html',readFileSync(resolve(project,'test/fixture.html'))],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'))]}
const server=createServer((req,res)=>{const handler=routes.get(req.url.split('?')[0]);if(handler){void handler(req,res);return}const file=files[req.url];res.writeHead(file?200:404,{'Content-Type':file?.[0]||'text/plain'}).end(file?.[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done));const url=`http://127.0.0.1:${server.address().port}`
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),context=await browser.newContext({viewport:{width:1400,height:1000}}),page=await context.newPage(),errors=[]
page.on('pageerror',error=>errors.push(error.message));let passed=0
const key='dsh-ui-beautify:settings:v1',select=name=>selectSettingsCategory(page,name),prefs=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function mount(){
 await page.getByTestId('todo-panel').waitFor()
 await page.evaluate(installLogoFixture,nativeLogo())
 await page.evaluate(()=>{
  window.activeRunningURLs=new Set();const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL)
  URL.createObjectURL=blob=>{const url=create(blob);window.activeRunningURLs.add(url);return url};URL.revokeObjectURL=url=>{window.activeRunningURLs.delete(url);revoke(url)}
  window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:window.fixtureFishLogo,FISH_LOGO_PATH:window.nativeLogo?.path,FISH_LOGO_VIEWBOX:window.nativeLogo}:window.fixtureReact)}
  // Real TextShimmer shape: the visible run carries text, the aria-hidden
  // decoration repeats it through CSS `content: attr(data-shimmer-text)`.
  const hostLine=text=>`<span class="test_runningText" data-shimmer="true"><span class="test_shimmerContent"><span class="test_shimmerRun">${text}</span></span><span class="test_shimmerDecoration" aria-hidden="true" inert=""><span class="test_shimmerSweep"><span class="test_shimmerContent test_shimmerHighlight"><span class="test_shimmerRun" data-shimmer-text="${text}"></span></span></span></span></span>`
  const content=document.createElement('div');content.className='test_runningContent';content.style.cssText='position:fixed;top:8px;left:260px;display:flex;align-items:center;gap:4px;z-index:1';content.innerHTML='<span class="test_runningIcon" style="width:14px;height:14px"><span class="test_runningWhaleAnimated" style="display:block;width:14px;height:14px;background:gray"></span></span>'+hostLine('深度求索中，用时 1秒 ···');const row=document.createElement('div');row.className='test_running';row.setAttribute('data-chat-running','true');row.append(content);document.body.append(row)
  // A composer-like node may also carry a runningIcon fragment. It must stay
  // untouched unless it is the direct child of a runningContent wrapper.
  const decoy=document.createElement('div');decoy.className='test_composer';decoy.setAttribute('data-chat-running','true');decoy.innerHTML='<span class="test_composer_runningIcon" style="width:14px;height:14px"></span>';document.body.append(decoy)
  // The host rewrites the wording and the decoration attribute every second.
  window.hostSeconds=1;window.hostTicker=setInterval(()=>{window.hostSeconds++;for(const root of document.querySelectorAll('.test_runningText')){const text=`深度求索中，用时 ${window.hostSeconds}秒 ···`;const visible=root.querySelector('.test_shimmerContent:not(.test_shimmerHighlight) .test_shimmerRun');if(visible)visible.textContent=text;const copy=root.querySelector('[data-shimmer-text]');if(copy)copy.setAttribute('data-shimmer-text',text)}},1000)
 })
 await page.addScriptTag({url:url+'/client.js'})
 await page.evaluate(()=>{const ctx={slots:{inject(_name,fn){fn()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(fn){window.cleanups.push(fn())},inject(_names,fn){fn(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
 await page.addStyleTag({content:'.settings-dialog{inset:50px 12%;padding:24px;overflow:auto}.dcb-settings{font-size:14px}'})
}
const live=()=>page.locator('.test_runningIcon > .dcb-running-art'),strip=()=>page.locator('.test_runningIcon > .dcb-running-art .dcb-running-strip'),animations=()=>page.evaluate(()=>document.getAnimations().filter(animation=>animation.id==='dcb-running-sprite').map(animation=>({state:animation.playState,time:animation.currentTime,preview:!!animation.effect.target.closest('.dcb-running-demo')})))
const sprite=readFileSync(resolve(project,'assets/running-whale/a001.webp')),gif=Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64')
const custom=createRunningZip(new Map([['自制/manifest.json',Buffer.from(JSON.stringify({format:'dsh-running-pack',version:1,name:'测试动作包',actions:[{id:'work',name:'认真工作',file:'工作.png',type:'sprite',frames:60,columns:10,fps:12.5},{id:'rest',name:'小憩',file:'休息.gif'}]}))],['自制/工作.png',sprite],['自制/休息.gif',gif]]))
async function upload(buffer,name='动作.zip'){await page.getByLabel('选择动图 ZIP',{exact:true}).setInputFiles({name,mimeType:'application/zip',buffer});await page.getByRole('button',{name:'正在导入…'}).waitFor({state:'detached'})}
try{
 await page.goto(url);await mount()
 await check('native thinking icon uses a lazy builtin sprite with real intermediate frames',async()=>{
  await live().waitFor();assert.equal(await page.locator('.test_runningIcon').getAttribute('data-dcb-running-reserve'),'');assert.equal(await page.locator('.test_runningIcon').evaluate(node=>node.getBoundingClientRect().height),14);assert.equal(await page.locator('.test_composer_runningIcon[data-dcb-running-reserve],.test_composer_runningIcon > .dcb-running-art').count(),0);await page.waitForTimeout(200);const before=await strip().evaluate(node=>getComputedStyle(node).backgroundPosition);await page.waitForTimeout(180);const after=await strip().evaluate(node=>getComputedStyle(node).backgroundPosition);assert.notEqual(before,after,JSON.stringify(await animations()))
  assert.equal(await page.locator('.test_runningIcon').evaluate(node=>node.getBoundingClientRect().width),14);assert.equal(await live().evaluate(node=>node.getBoundingClientRect().width),32)
 })
 await check('sidebar changes keep the same animation and hidden icons pause and resume',async()=>{
  const image=await strip().evaluate(node=>node.style.backgroundImage),time=(await animations())[0].time
  await page.evaluate(()=>{document.body.classList.toggle('sidebar-open');const aside=document.createElement('aside');aside.textContent='侧栏';document.body.append(aside);aside.remove()});await page.waitForTimeout(100)
  assert.equal(await strip().evaluate(node=>node.style.backgroundImage),image);assert.ok((await animations())[0].time>time)
  await page.locator('.test_runningContent').evaluate(node=>node.style.display='none');await page.waitForTimeout(100);const paused=(await animations())[0];assert.equal(paused.state,'paused');await page.waitForTimeout(130);assert.equal((await animations())[0].time,paused.time)
  await page.locator('.test_runningContent').evaluate(node=>node.style.display='flex');await page.waitForTimeout(120);assert.equal((await animations())[0].state,'running');assert.equal(await strip().evaluate(node=>node.style.backgroundImage),image)
 })
 await page.evaluate(()=>window.fixture.settings(true));await page.waitForTimeout(100);assert.deepEqual(errors,[]);await select('思考动图')
 await check('builtin pack exposes all 51 selectable actions, with only one moving settings preview',async()=>{
  assert.equal(await page.getByRole('checkbox').count(),51);await page.locator('.dcb-running-demo .dcb-running-art').waitFor();assert.equal((await animations()).filter(item=>item.preview).length,1)
  await page.getByRole('dialog').evaluate(node=>node.scrollTop=0);await page.getByRole('dialog').screenshot({path:resolve(output,'running-builtin.png')})
  await page.getByLabel('动图大小',{exact:true}).fill('48');assert.equal((await prefs()).runningAnimationSize,48);assert.equal(await page.locator('.test_runningIcon').evaluate(node=>node.getBoundingClientRect().width),14);assert.equal(await live().evaluate(node=>node.getBoundingClientRect().width),48)
  await page.getByRole('button',{name:'全部取消',exact:true}).click();await live().waitFor({state:'detached'});assert.deepEqual((await prefs()).runningAnimationActions,[]);assert.equal(await page.locator('.test_runningIcon').evaluate(node=>node.getBoundingClientRect().width),14)
  await page.getByRole('button',{name:'全选动作',exact:true}).click();await live().waitFor()
 })
 await check('custom labels replace only the wording and keep the host clock and shimmer in sync',async()=>{
  const runOf=id=>page.locator(`#${id} .test_shimmerContent:not(.test_shimmerHighlight) .test_shimmerRun`)
  const runText=async id=>(await runOf(id).innerText()).trim()
  const prefix=text=>text.split('，')[0]
  const spawn=id=>page.evaluate(id=>{const hostLine=text=>`<span class="test_runningText" data-shimmer="true"><span class="test_shimmerContent"><span class="test_shimmerRun">${text}</span></span><span class="test_shimmerDecoration" aria-hidden="true" inert=""><span class="test_shimmerSweep"><span class="test_shimmerContent test_shimmerHighlight"><span class="test_shimmerRun" data-shimmer-text="${text}"></span></span></span></span></span>`;const content=document.createElement('div');content.id=id;content.className='test_runningContent';content.style.cssText='position:fixed;top:70px;left:260px;display:flex;align-items:center;gap:4px';content.innerHTML='<span class="test_runningIcon" style="width:14px;height:14px"></span>'+hostLine('深度求索中，用时 1秒 ···');const row=document.createElement('div');row.className='test_running';row.setAttribute('data-chat-running','true');row.append(content);document.body.append(row)},id)
  const waitPrefix=(id,text)=>page.waitForFunction(([id,text])=>document.querySelector(`#${id} .test_shimmerContent:not(.test_shimmerHighlight) .test_shimmerRun`)?.textContent?.startsWith(text),[id,text])
  await page.locator('.test_runningContent').first().evaluate(node=>{node.id='probe0'})
  await page.getByLabel('思考文案',{exact:true}).fill('鲸鲸正在想…');await waitPrefix('probe0','鲸鲸正在想…')
  const firstText=await runText('probe0')
  assert.match(firstText,/^鲸鲸正在想…，用时 \d+秒 ···$/)
  await page.waitForTimeout(1700)
  const laterText=await runText('probe0')
  assert.match(laterText,/^鲸鲸正在想…，用时 \d+秒 ···$/)
  assert.notEqual(laterText,firstText)
  assert.equal(await page.locator('#probe0 [data-shimmer-text]').getAttribute('data-shimmer-text'),laterText)
  assert.equal((await page.locator('.dcb-running-demo > span:last-child').innerText()).trim(),'鲸鲸正在想…')
  await page.getByLabel('思考文案',{exact:true}).scrollIntoViewIfNeeded();await page.waitForTimeout(120)
  await page.getByRole('dialog').screenshot({path:resolve(output,'running-label.png')})
  assert.equal((await prefs()).runningAnimationLabel,'鲸鲸正在想…')
  await page.getByLabel('思考文案',{exact:true}).fill('{time} 想好了')
  await page.waitForFunction(()=>document.querySelector('#probe0 .test_shimmerContent:not(.test_shimmerHighlight) .test_shimmerRun')?.textContent?.endsWith('想好了'))
  assert.match(await runText('probe0'),/^\d+秒 想好了$/)
  assert.equal(await page.locator('#probe0 [data-shimmer-text]').getAttribute('data-shimmer-text'),await runText('probe0'))
  await page.getByLabel('思考文案',{exact:true}).fill('甲\n\n乙');assert.equal((await prefs()).runningAnimationLabel,'甲\n\n乙')
  await spawn('probe1');await spawn('probe2')
  await page.waitForFunction(()=>{const read=id=>document.querySelector(`#${id} .test_shimmerContent:not(.test_shimmerHighlight) .test_shimmerRun`)?.textContent||'';const hit=text=>text.startsWith('甲')||text.startsWith('乙');return hit(read('probe1'))&&hit(read('probe2'))})
  const first=prefix(await runText('probe1')),second=prefix(await runText('probe2'))
  assert.ok(['甲','乙'].includes(first)&&['甲','乙'].includes(second),`${first}/${second}`);assert.notEqual(first,second)
  await page.getByRole('switch',{name:'随机文案',exact:true}).click();assert.equal((await prefs()).runningAnimationLabelRandom,false)
  await spawn('probe3');await waitPrefix('probe3','甲');assert.equal(prefix(await runText('probe3')),'甲')
  assert.match(await runText('probe3'),/，用时 \d+秒 ···$/)
  await page.getByLabel('思考文案',{exact:true}).fill('')
  await page.waitForFunction(()=>document.querySelector('#probe0 .test_shimmerRun')?.textContent?.startsWith('深度求索中，用时'))
  assert.equal((await prefs()).runningAnimationLabel,'')
  await page.waitForTimeout(1200)
  assert.match(await runText('probe0'),/^深度求索中，用时 \d+秒 ···$/)
  await page.getByLabel('思考文案',{exact:true}).fill('甲');await waitPrefix('probe0','甲');assert.equal(prefix(await runText('probe0')),'甲')
  await page.getByLabel('思考文案',{exact:true}).fill('')
  for(const id of ['probe1','probe2','probe3'])await page.locator('#'+id).evaluate(node=>node.remove())
  await page.waitForTimeout(80);assert.deepEqual(errors,[])
 })
 await check('ZIP import saves validated Unicode assets, selects the pack and permits individual actions',async()=>{
  await upload(custom);await page.getByRole('button',{name:'测试动作包',exact:true}).waitFor();assert.equal(await page.getByRole('checkbox').count(),2)
  assert.match((await prefs()).runningAnimationPack,/^local-/);await page.getByRole('switch',{name:'随机动作',exact:true}).click();await live().waitFor()
  await page.getByRole('checkbox',{name:'小憩',exact:true}).click();assert.deepEqual((await prefs()).runningAnimationActions,['work']);assert.equal(await page.getByRole('checkbox',{name:'认真工作',exact:true}).getAttribute('aria-checked'),'true')
 })
 await check('invalid packs leave the current pack and preferences intact',async()=>{
  const before=await prefs();await upload(createRunningZip(new Map([['bad.gif',Buffer.from('<html>bad</html>')]])),'损坏.zip');await page.getByRole('status').filter({hasText:'仅支持'}).waitFor();assert.deepEqual(await prefs(),before)
 })
 await check('ordinary GIF ZIPs need no manifest, and a folder can be imported directly',async()=>{
  await upload(createRunningZip(new Map([['开心.gif',gif],['困了.gif',gif]])),'普通动图.zip');await page.getByRole('button',{name:'普通动图',exact:true}).waitFor();assert.equal(await page.getByRole('checkbox').count(),2);await page.getByRole('checkbox',{name:'开心',exact:true}).waitFor()
  const directory=resolve(output,'folder-pack');mkdirSync(directory,{recursive:true});writeFileSync(resolve(directory,'manifest.json'),JSON.stringify({format:'dsh-running-pack',version:1,name:'文件夹动作包',actions:[{id:'hello',name:'打招呼',file:'hello.gif'}]}));writeFileSync(resolve(directory,'hello.gif'),gif)
  await page.getByLabel('选择动图文件夹',{exact:true}).setInputFiles(directory);await page.getByRole('button',{name:'文件夹动作包',exact:true}).waitFor();await page.getByRole('checkbox',{name:'打招呼',exact:true}).waitFor();assert.equal(await page.getByRole('checkbox').count(),1)
  await page.getByRole('button',{name:'删除当前动图包',exact:true}).click();await page.getByRole('button',{name:'文件夹动作包',exact:true}).waitFor({state:'detached'});await page.getByRole('button',{name:'普通动图',exact:true}).click();await page.getByRole('button',{name:'删除当前动图包',exact:true}).click();await page.getByRole('button',{name:'普通动图',exact:true}).waitFor({state:'detached'});await page.getByRole('button',{name:'测试动作包',exact:true}).click();await page.getByRole('checkbox',{name:'小憩',exact:true}).click()
 })
 await check('light, dark, narrow and keyboard-focused settings remain readable without overflow',async()=>{
  await page.getByLabel('搜索动作',{exact:true}).fill('');await page.getByRole('checkbox',{name:'认真工作',exact:true}).focus();await page.getByRole('dialog').evaluate(node=>node.scrollTop=0)
  await page.getByRole('dialog').screenshot({path:resolve(output,'running-light.png')})
  await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.waitForTimeout(300);await page.getByRole('dialog').screenshot({path:resolve(output,'running-dark.png')})
  await page.setViewportSize({width:520,height:900});await page.addStyleTag({content:'.settings-dialog{inset:20px 10px;padding:14px}'})
  assert.equal(await page.getByRole('dialog').evaluate(node=>node.scrollWidth<=node.clientWidth+1),true);await page.getByRole('dialog').screenshot({path:resolve(output,'running-narrow.png')});await page.setViewportSize({width:1400,height:1000})
 })
 await check('reduced motion freezes sprites, and category unmount releases preview animations and blob URLs',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(80);assert.ok((await animations()).every(item=>item.state==='paused'&&item.time===0))
  await select('任务面板');assert.equal((await animations()).filter(item=>item.preview).length,0);await page.emulateMedia({reducedMotion:'no-preference'})
  await select('思考动图');await page.getByRole('switch',{name:'思考动图',exact:true}).click();await live().waitFor({state:'detached'});await select('任务面板');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.activeRunningURLs.size),0)
 })
 await check('custom packs and explicit selections survive a full browser reload',async()=>{
  const before=await prefs();await page.reload();await mount();await page.evaluate(()=>window.fixture.settings(true));await select('思考动图');await page.getByRole('button',{name:'测试动作包',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'测试动作包',exact:true}).getAttribute('aria-pressed'),'true');assert.deepEqual((await prefs()).runningAnimationActions,before.runningAnimationActions)
  await page.getByRole('button',{name:'删除当前动图包',exact:true}).click();await page.getByRole('button',{name:'测试动作包',exact:true}).waitFor({state:'detached'});assert.equal((await prefs()).runningAnimationPack,'builtin-whale')
 })
 await check('plugin disposal restores the native icon and releases all owned animations and URLs',async()=>{
  await page.evaluate(()=>{window.fixture.settings(false);for(const cleanup of window.cleanups)cleanup?.()});await page.waitForTimeout(100);assert.equal((await animations()).length,0);assert.equal(await page.evaluate(()=>window.activeRunningURLs.size),0);assert.equal(await page.locator('[data-dcb-running-ready]').count(),0);assert.deepEqual(errors,[])
 })
 console.log(JSON.stringify({passed,output}))
}finally{await browser.close();stopAssets();await new Promise(done=>server.close(done))}
