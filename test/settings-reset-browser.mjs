import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {selectSettingsCategory} from './settings-navigation.mjs'
import {nativeLogo,installLogoFixture} from './native-logo.mjs'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','settings-reset-all-qa'),'settings-reset')
mkdirSync(output,{recursive:true})
const fixture=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];if(!route){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}/`,KEY='dsh-ui-beautify:settings:v1',WIDTH='dsh-ui-beautify:conversation-width:v1',NATIVE='dsh.conversation.contentWidth'
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),checks=[],errors=[]
page.on('pageerror',error=>errors.push(error.message))
const reset=()=>page.getByRole('button',{name:'全部恢复默认值',exact:true}),undo=()=>page.getByRole('button',{name:'撤销恢复',exact:true})
const logo=nativeLogo()
const select=name=>selectSettingsCategory(page,name),saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY)
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
async function mount(){
  await page.getByTestId('todo-panel').waitFor()
  await page.evaluate(installLogoFixture,logo)
  await page.evaluate(()=>{
    window.cleanups=[];window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true
    window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:window.fixtureFishLogo,FISH_LOGO_PATH:window.nativeLogo?.path,FISH_LOGO_VIEWBOX:window.nativeLogo}:window.fixtureReact)}
  })
  await page.addScriptTag({url:url+'client.js'})
  await page.evaluate(()=>{
    const ctx={slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}}
    window.plugin.apply(ctx);window.fixture.refresh();window.fixture.settings(true)
  })
  await page.addStyleTag({content:'.settings-dialog{inset:32px 8%;padding:24px}.dcb-settings{font-size:14px}'})
  try{await reset().waitFor({timeout:10000})}catch(error){
    await page.screenshot({path:resolve(output,'mount-failure.png')})
    console.log(JSON.stringify({errors,settings:await page.locator('.dcb-settings').count(),dialog:await page.getByRole('dialog').count(),text:(await page.locator('body').innerText()).slice(-1800)}))
    throw error
  }
}
async function boot(settings){
  await page.goto(url+'?composer')
  await page.evaluate(({KEY,settings})=>{if(settings)localStorage.setItem(KEY,JSON.stringify(settings));else localStorage.removeItem(KEY)}, {KEY,settings})
  await mount()
}
const mediaDatabases=[['dsh-ui-beautify-welcome',1,'media'],['dsh-ui-beautify-welcome-code',1,'opening'],['dsh-ui-context-particles',1,'artwork'],['dsh-ui-beautify-background',2,'assets'],['dsh-ui-beautify-running-packs',1,'assets']]
async function mediaCounts(){return page.evaluate(async entries=>{
  const result={}
  for(const[name,version,store]of entries){
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,version);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
    result[name]=await new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).count();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});db.close()
  }
  return result
},mediaDatabases)}
try{
  // Capture untouched defaults through the existing settings UI, before using
  // the new action. This also catches missing future fields in a partial reset.
  await boot(null);await select('任务面板')
  await page.getByRole('switch',{name:'启用右上角任务面板',exact:true}).click()
  await page.getByRole('switch',{name:'启用右上角任务面板',exact:true}).click()
  const defaults=await saved()
  const custom={...defaults,enabled:false,cardStyle:'css',composerStyle:'glass',composerButtonGlass:true,chatUnderComposer:true,sidebarStyle:'clear',sidebarMotion:false,sidebarOverlay:false,headerCentered:false,messageMotion:false,width:456,modules:{progress:false,outputs:false,resources:false},progressView:{count:2,previous:true,future:true},toolDetails:true,skillDetails:true,summaryScope:'all',turnGlass:true,turnCardStyle:'line',turnDividerPreset:'whale',turnDividerColor:'#ef8577',turnDividerMotion:true,turnDividerCss:'.line { height: 3px; }',turnDividerImageRevision:'fixture-divider',userBubbleStyle:'custom',userBubbleCss:'.bubble { background: pink; }',particleEnabled:false,particleShape:'image',particleCount:15000,particleProgressMode:'manual',particleManualProgress:85,particleStart:20,particleFull:90,particleImageRevision:'fixture-image',particleImageName:'fixture.png',welcomeEnabled:false,welcomeText:'自定义欢迎',welcomeFont:'system-ui',welcomeDuration:3200,welcomeLogo:false,welcomeMode:'media',welcomeMediaFit:'cover',welcomeMediaDuration:7000,welcomeMediaRevision:'fixture-opening',backgroundEnabled:false,backgroundFit:'contain',backgroundPosition:'top',backgroundOpacity:78,backgroundBlur:6,backgroundSound:true,backgroundThemes:{light:{backgroundEnabled:false,backgroundRevision:'fixture-light',backgroundName:'light.png'},dark:{backgroundEnabled:false,backgroundRevision:'fixture-dark',backgroundName:'dark.html'}},runningAnimationEnabled:false,runningAnimationSize:54,runningAnimationGap:15,runningAnimationOpacity:.6,runningAnimationActions:['a001'],runningAnimationRandom:false}
  await boot(custom)
  await page.evaluate(({WIDTH,NATIVE})=>{
    localStorage.setItem(WIDTH,JSON.stringify({version:1,window:1100,fullscreen:1680}));localStorage.setItem(NATIVE,'1100')
    window.dispatchEvent(new StorageEvent('storage',{key:WIDTH}))
    localStorage.setItem('other-plugin:preference','untouched');localStorage.setItem('dsh.settings.activeSection','dsh-ui-beautify');localStorage.setItem('dsh-claude-beautify:settings:v1','legacy-preference')
  },{WIDTH,NATIVE})
  const before=await page.evaluate(key=>window.plugin.__test.normalize(JSON.parse(localStorage.getItem(key))),KEY)
  await check('one action resets every category and both window-width memories without resetting category or chat draft',async()=>{
    await select('对话动效')
    await page.getByRole('textbox',{name:'合成消息输入',exact:true}).fill('保留聊天草稿')
    await reset().click()
    assert.deepEqual(await saved(),defaults)
    assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),WIDTH),{version:1,window:null,fullscreen:null})
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),NATIVE),null)
    assert.equal(await page.getByRole('tab',{name:'对话动效',exact:true}).getAttribute('aria-selected'),'true')
    assert.equal(await page.getByRole('textbox',{name:'合成消息输入',exact:true}).textContent(),'保留聊天草稿')
    assert.equal(await page.evaluate(()=>localStorage.getItem('other-plugin:preference')),'untouched')
    assert.equal(await page.evaluate(()=>localStorage.getItem('dsh.settings.activeSection')),'dsh-ui-beautify')
    assert.equal(await page.evaluate(()=>localStorage.getItem('dsh-claude-beautify:settings:v1')),'legacy-preference')
    assert.equal(await undo().count(),1)
  })
  await check('repeated reset keeps the original undo point; undo restores settings, CSS and both widths',async()=>{
    await reset().click();await undo().click()
    assert.deepEqual(await saved(),before)
    assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),WIDTH),{version:1,window:1100,fullscreen:1680})
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),NATIVE),'1100')
    assert.equal(await reset().evaluate(el=>el===document.activeElement),true)
  })
  await check('imported opening, particle, wallpaper and animation assets survive reset and undo',async()=>{
    await page.evaluate(async entries=>{
      for(const[name,version,store]of entries){
        const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,version);r.onupgradeneeded=()=>{for(const s of name.endsWith('background')?['wallpaper','assets']:name.endsWith('running-packs')?['packs','assets']:[store])if(!r.result.objectStoreNames.contains(s))r.result.createObjectStore(s,s==='packs'?{keyPath:'id'}:name.endsWith('running-packs')?{keyPath:'key'}:undefined)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
        await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite'),s=tx.objectStore(store),item={revision:'fixture-kept',key:'fixture-kept',blob:new Blob(['synthetic asset']),name:'fixture-kept'};if(s.keyPath)s.put(item);else s.put(item,'fixture-kept');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()
      }
    },mediaDatabases)
    const counts=await mediaCounts();await reset().click();assert.deepEqual(await mediaCounts(),counts);await undo().click();assert.deepEqual(await mediaCounts(),counts)
  })
  await check('reset clears unsaved settings-editor drafts and stops previews while retaining the selected category',async()=>{
    await select('开屏欢迎')
    await page.getByRole('radio',{name:'默认 · Logo 字符填充',exact:true}).click()
    const input=page.getByRole('textbox',{name:'Logo 填充字符',exact:true})
    await input.fill('尚未保存的 Logo 字符')
    await reset().click()
    await page.waitForFunction(()=>document.querySelector('.dcb-settings-tab-stage')?.getAttribute('data-state')==='idle')
    assert.equal(await input.inputValue(),defaults.welcomeCharacters)
    assert.equal(await page.getByRole('tab',{name:'开屏欢迎',exact:true}).getAttribute('aria-selected'),'true')
    assert.equal(await undo().count(),1)
  })
  await check('undo remains available after reopening settings and expires when a later setting is edited',async()=>{
    await page.getByRole('button',{name:'关闭设置',exact:true}).click();await page.evaluate(()=>window.fixture.settings(true));await undo().waitFor()
    await page.getByRole('switch',{name:'开屏欢迎动效',exact:true}).click();assert.equal(await undo().count(),0)
  })
  await check('reset during a category transition settles on the selected page; repeated switches and undo cannot leave it hidden',async()=>{
    await select('输入栏')
    await page.getByRole('tab',{name:'侧栏',exact:true}).click();await reset().click()
    await page.waitForFunction(()=>document.querySelector('.dcb-settings-tab-stage')?.getAttribute('data-state')==='idle')
    assert.equal(await page.locator('.dcb-settings-tab-stage > [role=tabpanel]').getAttribute('aria-hidden'),'false')
    assert.equal(await page.locator('.dcb-settings-tab-stage > [role=tabpanel]').locator('[data-dcb-settings-block]').getAttribute('data-dcb-settings-block'),'sidebar')
    await page.getByRole('tab',{name:'对话布局',exact:true}).click();await page.getByRole('tab',{name:'组件布局',exact:true}).click();await page.getByRole('tab',{name:'输入栏',exact:true}).click();await undo().click()
    await page.waitForFunction(()=>document.querySelector('.dcb-settings-tab-stage')?.getAttribute('data-state')==='idle')
    assert.equal(await page.locator('.dcb-settings-tab-stage > [role=tabpanel]').getAttribute('aria-hidden'),'false')
    assert.equal(await page.locator('.dcb-settings-tab-stage > [role=tabpanel]').locator('[data-dcb-settings-block]').getAttribute('data-dcb-settings-block'),'composer')
  })
  await check('an import started before reset may finish saving its asset but cannot re-enable an old wallpaper choice',async()=>{
    await select('全图背景')
    const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=16;canvas.getContext('2d').fillRect(0,0,16,16);return canvas.toDataURL('image/png').split(',')[1]})
    await page.evaluate(()=>{window.originalArrayBuffer=Blob.prototype.arrayBuffer;window.holdResetImport=true;Blob.prototype.arrayBuffer=function(){const bytes=window.originalArrayBuffer.call(this);if(window.holdResetImport&&this.size===32){window.holdResetImport=false;return new Promise(resolve=>{window.finishResetImport=async()=>resolve(await bytes)})}return bytes}})
    await page.getByLabel('导入全图背景',{exact:true}).setInputFiles({name:'delayed-reset.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')})
    await page.waitForFunction(()=>typeof window.finishResetImport==='function');await reset().click()
    await page.evaluate(async()=>{await window.finishResetImport();Blob.prototype.arrayBuffer=window.originalArrayBuffer})
    await page.getByRole('button',{name:'使用背景：delayed-reset.png',exact:true}).waitFor()
    assert.deepEqual(await saved(),defaults)
  })
  await check('reset persists across reload and synchronizes another open settings window',async()=>{
    const other=await context.newPage();await other.goto(url);await other.evaluate(()=>{window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true;window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(()=>window.fixtureReact)}});await other.addScriptTag({url:url+'client.js'});await other.evaluate(()=>window.plugin.apply({slots:{inject(_name,cb){cb()},register(){}},effect(cb){window.cleanups.push(cb())}}))
    await reset().click();await other.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).welcomeText==='Deepseek Harness',KEY)
    assert.deepEqual(await other.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY),defaults)
    await other.close();await page.reload();await mount();assert.deepEqual(await saved(),defaults);assert.equal(await undo().count(),0)
  })
  await check('light, dark and narrow layouts expose keyboard focus, 44px targets and shared motion',async()=>{
    for(const dark of[false,true]){
      await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark)
      await page.setViewportSize({width:1440,height:1000});await reset().focus()
      await reset().click();await page.waitForFunction(()=>document.querySelector('.dcb-settings-tab-stage')?.getAttribute('data-state')==='idle');await page.waitForTimeout(240)
      await reset().press('Tab');await undo().press('Shift+Tab')
      const metrics=await reset().evaluate(el=>{const s=getComputedStyle(el);return{height:el.getBoundingClientRect().height,outline:s.outlineWidth,duration:s.transitionDuration}})
      assert.ok(metrics.height>=44);assert.equal(metrics.outline,'2px');assert.ok(metrics.duration.includes('0.22s'))
      await page.getByRole('dialog').screenshot({path:resolve(output,`reset-${dark?'dark':'light'}.png`)})
      await page.locator('.dcb-settings-hero').screenshot({path:resolve(output,`reset-header-${dark?'dark':'light'}.png`)})
      await page.setViewportSize({width:520,height:850});await page.addStyleTag({content:'@media(max-width:600px){.settings-dialog{inset:10px;padding:16px}}'})
      assert.equal(await page.locator('.dcb-settings').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true)
      assert.equal(await page.locator('.dcb-settings-reset button').count(),2)
      await page.getByRole('dialog').screenshot({path:resolve(output,`reset-narrow-${dark?'dark':'light'}.png`)})
      await undo().click()
    }
  })
  await check('keyboard reset, reduced motion and forced colors retain readable feedback and reversible actions',async()=>{
    await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});await reset().press('Enter');await undo().waitFor();await undo().focus()
    assert.equal(await reset().evaluate(el=>getComputedStyle(el).transitionDuration),'0s')
    assert.equal(await page.locator('.dcb-settings-reset [role=status]').innerText(),'已恢复默认值')
    await undo().press('Space');assert.equal(await reset().evaluate(el=>el===document.activeElement),true)
    await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
  })
  await check('storage failure reports session-only reset instead of claiming a saved change',async()=>{
    await page.evaluate(()=>{window.originalStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='dsh-ui-beautify:settings:v1')throw new DOMException('fixture quota','QuotaExceededError');return window.originalStorageSet.call(this,key,value)}})
    await reset().click();assert.match(await page.locator('.dcb-settings-reset [role=status]').innerText(),/仅当前窗口生效/)
    await page.evaluate(()=>{Storage.prototype.setItem=window.originalStorageSet});await undo().click()
  })
  await check('closing settings disposes reset-related page animations and plugin cleanup removes its styles',async()=>{
    await page.getByRole('button',{name:'关闭设置',exact:true}).click()
    assert.equal(await page.locator('.dcb-settings-reset').count(),0)
    await page.evaluate(()=>{for(const cleanup of window.cleanups.reverse())cleanup?.()})
    assert.equal(await page.locator('style[data-plugin="dsh-ui-beautify"]').count(),0)
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='dcb-settings-tab').length),0)
  })
  assert.deepEqual(errors,[])
  writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors,settingsFields:Object.keys(defaults).length,source:'Synthetic conversation and local media assets; no user settings or files reset.'},null,2))
  console.log(`${checks.length} reset browser groups passed`)
}finally{await browser.close();await new Promise(done=>server.close(done))}
