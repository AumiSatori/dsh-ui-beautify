import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createServer} from 'node:http'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeShell} from './native-shell.mjs'
import {selectSettingsCategory} from './settings-navigation.mjs'
import {normalizeToolbar,toolbarDefaultOrder} from '../src/toolbar-settings.js'
assert.deepEqual(normalizeToolbar({order:['summary','invalid','summary'],hidden:['focus','invalid','focus']}),{order:['summary',...toolbarDefaultOrder.filter(id=>id!=='summary')],hidden:['focus']})
const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'.scratch/toolbar-qa'));mkdirSync(output,{recursive:true})
let fixture=readFileSync(resolve(project,'test/fixture.jsx'),'utf8')
const from=fixture.indexOf('<main><header '),to=fixture.indexOf('</header>',from)
assert.ok(from>=0&&to>from)
const header=`<main><header className="cr_header"><div className="cr_headerLeading" data-conversation-header-leading=""/><div className="cr_titleRow"><div className="cr_titleCluster">演示会话标题</div><div className="cr_headerUtilities"><div className="file_group"><button aria-label="使用文件资源管理器打开" onClick={()=>window.toolbarActions.folder++}>文件夹</button><button aria-label="更多开放方式">⌄</button></div><button aria-label="更多操作" onClick={()=>window.toolbarActions.more++}>⋯</button>{Header && <Header sessionId={session} useProjection={name => name === 'contextPressure' ? pressure[session] ?? null : name === 'turnOutline' ? history?.outline || history?.turns || [] : todos} useSession={selector => selector({ running })} useTaskActivity={selector => React.useSyncExternalStore(source.subscribe, () => selector(source.getSnapshot()))} openOutput={injected.openOutput} readThumbnail={injected.readThumbnail} readPreview={injected.readPreview}/>}</div><div className="cr_headerCorner"><button aria-label="打开右侧边栏" onClick={()=>window.toolbarActions.right++}>侧栏</button></div></div><nav data-conversation-tabs=""><button>对话</button><button>轨迹</button></nav></header>`
fixture=fixture.slice(0,from)+header+fixture.slice(to+'</header>'.length)
fixture=fixture.replace('<nav data-conversation-tabs="">','<div className="cr_tabs"><nav data-conversation-tabs="">').replace('</nav></header>','</nav></div></header>')
const built=await build({stdin:{contents:fixture,loader:'jsx',resolveDir:resolve(project,'test')},bundle:true,write:false,format:'iife'}),native=nativeShell()
const html=readFileSync(resolve(project,'test/fixture.html'),'utf8').replace('</style>',native.css+`.cr_header{height:auto;min-height:90px}.file_group{display:flex}.cr_headerUtilities button,.cr_headerCorner button{flex:none;min-height:30px;padding:4px 8px}.settings-dialog{inset:30px 6%;padding:24px}.dcb-settings-hero h1{margin:0}.cr_titleCluster{font-size:14px}body[data-ds-dark-theme] .settings-dialog{background:#1c1c1e}</style>`)
const routes={'/':['text/html; charset=utf-8',html],'/fixture.js':['text/javascript',built.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]},server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])});await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1000}}),url=`http://127.0.0.1:${server.address().port}`,key='dsh-ui-beautify:settings:v1',errors=[],checks=[];page.on('pageerror',error=>errors.push(error.message))
const select=name=>selectSettingsCategory(page,name),saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),settle=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
async function mount(){
 await page.goto(url);await page.getByTestId('todo-panel').waitFor();await page.evaluate(key=>{window.toolbarActions={folder:0,more:0,right:0};window.cleanups=[];if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleEnabled:false,sidebarOverlay:false}));window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>window.fixtureReact.createElement('svg',null)}:window.fixtureReact)}},key)
 await page.addScriptTag({url:url+'/client.js'});await page.evaluate(()=>{const ctx={theme:{getTheme:()=>({active:{colorScheme:document.body.hasAttribute('data-ds-dark-theme')?'dark':'light'}}),setTheme:scheme=>document.body.toggleAttribute('data-ds-dark-theme',scheme==='dark')},slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()});await settle();await page.evaluate(()=>window.fixture.settings(true));await select('任务面板')
}
try{
 await mount()
 await check('four parent groups expose their own children and keep only one settings page mounted',async()=>{
  assert.deepEqual(await page.getByRole('tablist',{name:'美化设置分组'}).getByRole('tab').allTextContents(),['组件布局','全局布局','对话布局','全局配置'])
  for(const [group,children]of [['组件布局',['任务面板','输入栏','侧栏','右上工具栏']],['全局布局',['开屏欢迎','全图背景','粒子背景']],['对话布局',['欢迎语','思考动图','对话动效']]]){
   await page.getByRole('tab',{name:group,exact:true}).click();assert.deepEqual(await page.getByRole('tablist',{name:group+'子分类'}).getByRole('tab').allTextContents(),children);await select(children.at(-1));assert.equal(await page.locator('.dcb-settings-tab-page').count(),1);assert.equal(await page.locator('.dcb-settings-tab-stage > [role=tabpanel]').count(),1)
  }
  await select('侧栏');await select('全图背景');await page.getByRole('tab',{name:'全局布局',exact:true}).click();await select('侧栏');assert.equal(await page.getByRole('tab',{name:'侧栏',exact:true}).getAttribute('aria-selected'),'true')
 })
 await check('welcome greeting has its own page and edits persist without consuming task-panel controls',async()=>{
  await select('欢迎语');assert.equal(await page.locator('[data-dcb-settings-block=hero]').count(),1)
  assert.equal(await page.getByRole('switch',{name:'启用右上角任务面板',exact:true}).count(),0)
  assert.equal(await page.getByRole('radiogroup',{name:'欢迎语模式'}).getByRole('radio').count(),3)
  assert.equal(await page.getByRole('radio',{name:/时间问候/}).count(),0)
  await page.getByRole('switch',{name:'显示欢迎语 LOGO'}).click();assert.equal((await saved()).heroGreetingShowLogo,false)
  assert.equal(await page.getByLabel('欢迎语预览').locator('[data-dcb-hero-icon]').isVisible(),false)
  await page.getByRole('spinbutton',{name:'欢迎语 LOGO 大小'}).fill('48');assert.equal((await saved()).heroGreetingLogoSize,48)
  await page.getByLabel('选择欢迎语 LOGO 图片').setInputFiles({name:'logo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64')})
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('dsh-ui-beautify:settings:v1')).heroGreetingCustomLogo===true)
  assert.equal(await page.getByLabel('欢迎语预览').locator('[data-dcb-hero-logo-image]').isVisible(),true)
  assert.equal((await saved()).heroGreetingShowLogo,true)
  await page.getByRole('button',{name:'使用默认 LOGO'}).click();assert.equal((await saved()).heroGreetingCustomLogo,false)
  await page.getByRole('button',{name:'使用已上传 LOGO'}).click();assert.equal((await saved()).heroGreetingCustomLogo,true)
  await page.evaluate(()=>{const hero=document.createElement('div');hero.id='logo-host';hero.innerHTML='<div class="sample_headline" style="display:flex;width:600px"><span class="sample_fishHitbox"><svg width="34" height="20"></svg></span><span class="sample_titleGroup"><span>原始文字</span><span class="sample_previewBadge">预览版</span></span></div>';document.body.append(hero)})
  await page.waitForFunction(()=>document.querySelector('#logo-host [data-dcb-hero-logo-image]')?.getAttribute('src')?.startsWith('blob:'))
  assert.equal(await page.locator('#logo-host [data-dcb-hero-logo-image]').evaluate(node=>Math.round(node.getBoundingClientRect().width)),48)
  assert.equal(await page.locator('#logo-host .sample_fishHitbox svg').isVisible(),false)
  assert.equal(await page.locator('#logo-host .sample_headline').evaluate(node=>getComputedStyle(node).justifyContent),'center')
  await page.locator('#logo-host').evaluate(node=>node.remove())
  await page.getByRole('radio',{name:/随机文案/}).click()
  const messages=page.getByRole('textbox',{name:'随机欢迎语列表'});await messages.fill('第一句\n第二句\n第三句')
  assert.deepEqual((await saved()).heroGreetingMessages,['第一句','第二句','第三句'])
  await page.getByRole('radio',{name:/自定义代码/}).click()
  const code=page.getByRole('textbox',{name:'欢迎语自定义代码'});await code.fill('const h = context.hour\nreturn h < 12 ? "早上好" : "下午好"')
  assert.match((await saved()).heroGreetingCode,/hour\nreturn/)
  await page.getByRole('button',{name:'载入时间问候示例'}).click();assert.match(await code.inputValue(),/中午好/)
  await code.fill('const h = context.hour\nreturn h < 12 ? "早上好" : "下午好"')
  await page.getByRole('switch',{name:'显示预览版标签'}).click()
  assert.equal((await saved()).heroGreetingShowPreview,false)
  assert.equal(await page.getByLabel('欢迎语预览').getByText('预览版').count(),0)
  assert.equal(await page.getByRole('tabpanel').locator('select,input[type=checkbox],input[type=radio],input[type=range]').count(),0)
  await page.screenshot({path:resolve(output,'greeting-settings.png')})
  await select('任务面板');assert.equal(await page.getByRole('switch',{name:'启用右上角任务面板',exact:true}).count(),1)
  await select('欢迎语');assert.match(await page.getByRole('textbox',{name:'欢迎语自定义代码'}).inputValue(),/hour\nreturn/)
  await page.reload();await mount();await select('欢迎语')
  await page.waitForFunction(()=>!!document.querySelector('[aria-label="欢迎语预览"] [data-dcb-hero-logo-image]'))
  assert.equal((await saved()).heroGreetingLogoSize,48)
 })
 await check('parent and child keyboard navigation and rapid reversals release all transitions',async()=>{
  const parent=page.getByRole('tab',{name:'全局布局',exact:true});await parent.press('End');await page.getByRole('tab',{name:'全局配置',exact:true}).press('ArrowLeft');await select('思考动图');await page.getByRole('tab',{name:'思考动图',exact:true}).press('End');await select('对话动效')
  await page.getByRole('tab',{name:'全局布局',exact:true}).click();await page.getByRole('tab',{name:'对话布局',exact:true}).click();await page.getByRole('tab',{name:'组件布局',exact:true}).click();await select('右上工具栏')
  assert.equal(await page.locator('[data-dcb-settings-block=toolbar]').count(),1);assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='dcb-settings-tab').length),0)
 })
 await check('message animation example is editable, validated and applied to preview and saved settings',async()=>{
  await select('对话动效')
  const editor=page.getByRole('textbox',{name:'新消息入场动效代码'})
  await page.getByRole('button',{name:'载入当前动效示例'}).click();const example=JSON.parse(await editor.inputValue());example.user.duration=620;example.user.frames[0].translate='44px 0px'
  await editor.fill(JSON.stringify(example,null,2));await page.getByRole('button',{name:'应用自定义动效'}).click()
  assert.equal((await saved()).messageMotionMode,'custom')
  await page.getByRole('button',{name:'播放消息动效预览'}).click()
  const timing=await page.locator('[data-message-demo=user]').evaluate(node=>{const a=node.getAnimations()[0];return{duration:a.effect.getTiming().duration,translate:a.effect.getKeyframes()[0].translate}})
  assert.equal(timing.duration,620);assert.match(timing.translate,/^44px(?: 0px)?$/)
  await editor.fill('{bad');await page.getByRole('button',{name:'应用自定义动效'}).click();assert.match(await page.getByRole('alert').innerText(),/格式有误/)
  assert.equal((await saved()).messageMotionMode,'custom');assert.equal(JSON.parse((await saved()).messageMotionCode).user.duration,620)
  await page.getByRole('button',{name:'使用默认动效'}).click();assert.equal((await saved()).messageMotionMode,'default')
  await select('右上工具栏')
 })
 await check('visibility hides only toolbar entries and preserves the existing feature switches',async()=>{
  assert.equal(await page.locator('header [data-dcb-toolbar-item]').count(),7)
  await page.getByRole('switch',{name:'显示纯背景入口',exact:true}).click();await settle();assert.equal(await page.locator('header .dcb-focus-toggle').isVisible(),false)
  assert.equal((await saved()).enabled,true)
  await page.getByRole('switch',{name:'显示任务面板入口',exact:true}).click();await settle();assert.equal(await page.locator('header .dcb-entry').isVisible(),false);assert.equal((await saved()).enabled,true)
  await select('任务面板');await page.getByRole('switch',{name:'启用右上角任务面板',exact:true}).click();await select('右上工具栏');const gate=page.getByRole('switch',{name:'显示任务面板入口',exact:true});assert.equal(await gate.isDisabled(),true);assert.equal(await gate.getAttribute('aria-checked'),'false');assert.match(await page.locator('#dcb-toolbar-note-summary').innerText(),/功能已关闭/)
  await select('任务面板');await page.getByRole('switch',{name:'启用右上角任务面板',exact:true}).click();await select('右上工具栏');assert.equal(await gate.isDisabled(),false);assert.equal(await gate.getAttribute('aria-checked'),'false','the hidden entrance preference survives re-enabling the feature')
  await gate.click();await page.getByRole('switch',{name:'显示纯背景入口',exact:true}).click();await settle()
 })
 await check('externally cancelled transitions still mount the selected child and release temporary height',async()=>{
  await select('输入栏');await page.getByRole('tab',{name:'右上工具栏',exact:true}).click();await page.evaluate(()=>{for(const animation of document.getAnimations())if(animation.id==='dcb-settings-tab')animation.cancel()});await select('右上工具栏');assert.equal(await page.locator('[data-dcb-settings-block=toolbar]').count(),1);assert.equal(await page.locator('.dcb-settings-tab-stage').getAttribute('style'),'')
 })
 await check('ordering crosses the native utility and corner seats without moving or cloning DOM controls',async()=>{
  await page.locator('header .cr_headerCorner button').evaluate(el=>window.originalRight=el);const first=(await saved()).toolbar.order[0];assert.equal(first,'folder')
  for(let i=0;i<6;i++)await page.getByRole('button',{name:'上移右侧栏开关',exact:true}).click()
  await settle();assert.equal((await saved()).toolbar.order[0],'rightSidebar')
  await page.evaluate(()=>window.fixture.settings(false));await settle()
  const positions=await page.locator('header [data-dcb-toolbar-item]').evaluateAll(nodes=>nodes.filter(el=>el.getClientRects().length).map(el=>({id:el.getAttribute('data-dcb-toolbar-item'),x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y})).sort((a,b)=>a.y-b.y||a.x-b.x));assert.equal(positions[0].id,'rightSidebar',JSON.stringify(positions))
  assert.equal(await page.locator('header [data-dcb-toolbar-item=rightSidebar]').evaluate(el=>el===window.originalRight),true)
  assert.ok(await page.locator('header .cr_tabs').evaluate(el=>el.getBoundingClientRect().top>Math.max(...[...document.querySelectorAll('header [data-dcb-toolbar-item]')].map(n=>n.getBoundingClientRect().top))))
  await page.getByRole('button',{name:'打开右侧边栏',exact:true}).click();await page.getByRole('button',{name:'使用文件资源管理器打开',exact:true}).click();assert.deepEqual(await page.evaluate(()=>[window.toolbarActions.right,window.toolbarActions.folder]),[1,1])
  await page.evaluate(()=>window.fixture.settings(true));await select('右上工具栏');await page.getByRole('switch',{name:'显示设置入口',exact:true}).click();await settle();assert.equal(await page.locator('header [data-dcb-header-settings]').isVisible(),false)
  await page.getByRole('button',{name:'恢复工具栏默认排列',exact:true}).click();await settle();assert.deepEqual((await saved()).toolbar.hidden,[]);assert.equal(await page.locator('header[data-dcb-toolbar-layout]').count(),0)
 })
 await check('custom preferences survive reload and layout remains usable in light dark and narrow settings',async()=>{
  await page.getByRole('button',{name:'上移更多操作',exact:true}).click();await mount();await select('右上工具栏');assert.equal((await saved()).toolbar.order[0],'more')
  for(const dark of [false,true]){
   await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);await page.waitForFunction(()=>!document.querySelector('.dcb-settings').getAnimations({subtree:true}).length);await page.getByRole('dialog').screenshot({path:resolve(output,`settings-hierarchy-${dark?'dark':'light'}.png`)})
  }
  await page.setViewportSize({width:520,height:900});await settle();await page.getByRole('dialog').screenshot({path:resolve(output,'settings-hierarchy-narrow.png')});assert.equal(await page.getByRole('dialog').evaluate(el=>el.scrollWidth>el.clientWidth+1),false)
  await page.evaluate(()=>window.fixture.settings(false));await settle();assert.equal(await page.locator('header').evaluate(el=>el.scrollWidth>el.clientWidth+1),false)
  await page.screenshot({path:resolve(output,'toolbar-narrow.png')})
 })
 await check('pointer and keyboard reorder work and reset undo restores toolbar preferences',async()=>{
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>window.fixture.settings(true));await select('右上工具栏');await page.getByRole('button',{name:'恢复工具栏默认排列',exact:true}).click()
  const handle=page.getByRole('button',{name:'拖动项目文件夹调整位置',exact:true}),target=page.locator('[data-toolbar-setting=theme]');await handle.scrollIntoViewIfNeeded();const a=await handle.boundingBox(),b=await target.boundingBox()
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x+a.width/2,b.y+b.height/2,{steps:8});await page.mouse.up();await settle();assert.equal((await saved()).toolbar.order[2],'folder')
  await page.getByRole('button',{name:'拖动项目文件夹调整位置',exact:true}).press('ArrowUp');assert.equal((await saved()).toolbar.order[1],'folder')
  await page.getByRole('switch',{name:'显示设置入口',exact:true}).click();const before=(await saved()).toolbar
  await page.getByRole('tab',{name:'全局配置',exact:true}).click();await page.getByRole('button',{name:'切换到 默认值',exact:true}).click();await page.waitForFunction(()=>document.querySelector('button[data-primary]')&&!document.querySelector('.dcb-presets[aria-busy=true]'));assert.deepEqual((await saved()).toolbar,{order:toolbarDefaultOrder,hidden:[]})
  await page.getByRole('button',{name:'撤销上次应用',exact:true}).click();assert.deepEqual((await saved()).toolbar,before);await select('右上工具栏')
 })
 await check('welcome-page entrances inherit visibility and order when no session utility row exists',async()=>{
  await page.evaluate(()=>{const old=document.querySelector('header'),header=document.createElement('header'),leading=document.createElement('div'),tools=document.createElement('div');header.id='welcome-toolbar-test';leading.className='cr_headerLeading';tools.className='dcb-welcome-tools';for(const selector of ['.dcb-theme-toggle','.dcb-focus-toggle']){const original=old.querySelector(selector);if(!original)throw Error(`Missing native toolbar fixture: ${selector}`);const button=original.cloneNode(true);button.removeAttribute('data-dcb-toolbar-item');button.removeAttribute('data-dcb-toolbar-hidden');tools.append(button)}const settings=document.createElement('button');settings.className='dcb-header-settings';settings.setAttribute('data-dcb-header-settings','');settings.setAttribute('aria-label','打开设置');tools.append(settings);leading.append(tools);header.append(leading);old.after(header)})
  await page.getByRole('switch',{name:'显示纯背景入口',exact:true}).click();await settle();assert.equal(await page.locator('#welcome-toolbar-test [data-dcb-toolbar-item]').count(),3);assert.equal(await page.locator('#welcome-toolbar-test .dcb-focus-toggle').isVisible(),false);assert.equal(await page.locator('#welcome-toolbar-test [data-dcb-header-settings]').isVisible(),false)
  await page.getByRole('button',{name:'下移昼夜切换',exact:true}).click();await settle();assert.equal(await page.locator('#welcome-toolbar-test').getAttribute('data-dcb-toolbar-layout'),'')
  assert.ok(await page.locator('#welcome-toolbar-test').evaluate(header=>header.querySelector('.dcb-theme-toggle').getBoundingClientRect().top>=header.getBoundingClientRect().top+10))
 })
 await check('reduced motion forced colors reset and disposal preserve ownership and restore host layout',async()=>{
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>window.fixture.settings(true));await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});await select('右上工具栏');await page.getByRole('button',{name:'下移更多操作',exact:true}).click();await settle();assert.equal(await page.evaluate(()=>document.getAnimations().some(a=>a.id==='dcb-settings-tab')),false)
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'});await page.evaluate(()=>{for(const cleanup of [...window.cleanups].reverse())if(typeof cleanup==='function')cleanup()});await settle();assert.equal(await page.locator('[data-dcb-toolbar-item],[data-dcb-toolbar-hidden],[data-dcb-toolbar-layout],[data-dcb-toolbar-container],.dcb-toolbar-pane').count(),0)
 })
 assert.deepEqual(errors,[]);writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
