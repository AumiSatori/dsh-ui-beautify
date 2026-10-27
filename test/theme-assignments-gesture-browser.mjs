import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createServer} from 'node:http'
import {build} from 'esbuild'
import {chromium,expect} from '@playwright/test'
import {selectSettingsCategory} from './settings-navigation.mjs'

const root=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/dsh-ui-beautify'),'theme-assignments-gesture')
mkdirSync(output,{recursive:true})
const fixture=await build({entryPoints:[resolve(root,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const helper=await build({stdin:{contents:"export * from './src/welcome-gesture.js'; export {createStartupMotion} from './src/startup-motion.js'; export {createWelcomeCodePlayer} from './src/welcome-code.js'",resolveDir:root},bundle:true,write:false,format:'iife',globalName:'GestureQA'})
const html=readFileSync(resolve(root,'test/fixture.html'),'utf8').replace('</style>','.settings-dialog{inset:24px 8%;padding:24px;overflow:auto}body{font-family:system-ui,sans-serif}</style>')
const routes={'/':['text/html; charset=utf-8',html],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'))],'/helper.js':['text/javascript',helper.outputFiles[0].text]}
const server=createServer((req,res)=>{const item=routes[req.url];if(!item)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':item[0]}).end(item[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-ui-beautify:settings:v1'
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1060}}),checks=[],errors=[]
page.on('pageerror',error=>errors.push(error.message))
const section=name=>page.locator(`[data-dcb-settings-block=${name}]`),assignments=scope=>page.locator(`[data-theme-assignments="${scope}"]`),card=(scope,scheme)=>assignments(scope).locator(`[data-scheme=${scheme}]`)
const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
async function select(name){await selectSettingsCategory(page,name)}
async function theme(scheme){await page.evaluate(scheme=>window.hostTheme.setTheme(scheme),scheme);await expect(page.locator('.dcb-theme-toggle')).toHaveAttribute('data-scheme',scheme);await page.waitForTimeout(280)}
async function shot(name){await page.locator('.dcb-settings').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:resolve(output,name+'.png')})}
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
async function draw(svg,route){await svg.scrollIntoViewIfNeeded();const box=await svg.boundingBox();const point=i=>({x:box.x+(70+i%3*80)*box.width/300,y:box.y+(70+Math.floor(i/3)*80)*box.height/300});const start=point(route[0]);await page.mouse.move(start.x,start.y);await page.mouse.down();for(const i of route.slice(1)){const p=point(i);await page.mouse.move(p.x,p.y,{steps:8})}await page.mouse.up()}
async function startup(){await page.evaluate(()=>{window.testStartup?.dispose();delete window[Symbol.for('dsh-ui-beautify.startup-motion.v1')];window.testStartup=GestureQA.createStartupMotion(document,window,{welcomeEnabled:true,welcomeMode:'code',welcomeCodeInteractive:true,welcomeCodeDuration:1000},{codeStore:{load:async()=>({source:window.gestureSource})}})});await page.locator('[data-dcb-welcome] iframe').waitFor();await page.frameLocator('[data-dcb-welcome] iframe').locator('.dcb-gesture').waitFor();await page.waitForTimeout(320)}
try{
  await page.goto(url);await page.getByTestId('todo-panel').waitFor()
  await page.evaluate(key=>{
    localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleEnabled:false,messageMotion:false,userBubbleThemes:{light:{style:'qq'},dark:{style:'cream'}}}))
    window.cleanups=[];window.themeListeners=new Set()
    window.hostTheme={getTheme:()=>({active:{colorScheme:document.body.hasAttribute('data-ds-dark-theme')?'dark':'light'}}),setTheme:scheme=>{document.body.toggleAttribute('data-ds-dark-theme',scheme==='dark');for(const fn of window.themeListeners)fn(window.hostTheme.getTheme())}}
    window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}
  },key)
  await page.addScriptTag({url:url+'/helper.js'});await page.addScriptTag({url:url+'/client.js'})
  await page.evaluate(()=>{const ctx={theme:window.hostTheme,slots:{inject(_name,cb){cb()},register(spec,c){if(spec.name==='settings.section')window.fixtureSettings=c;else{window.fixtureHeader=c;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},effect:fn=>window.cleanups.push(fn()),on(name,fn){if(name==='theme/change')window.themeListeners.add(fn)},inject(_names,fn){fn(ctx)}};window.plugin.apply(ctx);window.fixture.refresh();window.fixture.settings(true)})
  await check('opening and background display both schemes and identify the current editable scheme',async()=>{
    for(const [tab,scope] of [['开屏欢迎','开屏欢迎'],['全图背景','全图背景']]){
      await select(tab);await expect(assignments(scope).locator('.dcb-theme-assignment')).toHaveCount(2)
      for(const scheme of ['light','dark']){await theme(scheme);await expect(card(scope,scheme)).toHaveAttribute('data-current','true');await expect(card(scope,scheme)).toContainText('编辑中');await shot(`${tab==='开屏欢迎'?'welcome':'background'}-${scheme}`)}
    }
  })
  await check('background summaries distinguish disabled retained choices from an unconfigured scheme',async()=>{
    await theme('light');const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0F0AAAAASUVORK5CYII=','base64')
    await section('background').getByLabel('导入全图背景',{exact:true}).setInputFiles({name:'日间背景.png',mimeType:'image/png',buffer:bytes})
    await expect(card('全图背景','light')).toContainText('日间背景.png');await expect(card('全图背景','light')).toContainText('当前使用')
    await section('background').getByRole('switch',{name:'启用全图背景',exact:true}).click()
    await expect(card('全图背景','light')).toContainText('已关闭 · 配置保留');await expect(card('全图背景','dark')).toContainText('未配置');await shot('background-light')
  })
  await check('bubble editing scheme is independent from the currently applied host scheme',async()=>{
    await select('对话动效');await expect(card('用户消息气泡','light')).toContainText('QQ 蓝');await expect(card('用户消息气泡','light')).toContainText('当前使用')
    await expect(card('用户消息气泡','dark')).toContainText('奶油便签');await page.getByRole('tab',{name:'深色主题',exact:true}).click()
    await expect(card('用户消息气泡','dark')).toContainText('编辑中');await expect(card('用户消息气泡','light')).toContainText('当前主题');await expect(card('用户消息气泡','dark')).not.toContainText('当前主题')
    await assignments('用户消息气泡').scrollIntoViewIfNeeded();await page.screenshot({path:resolve(output,'bubbles-light-edit-dark.png')})
    await theme('dark');await expect(card('用户消息气泡','dark')).toContainText('当前主题');await expect(card('用户消息气泡','dark')).toContainText('当前使用');await page.screenshot({path:resolve(output,'bubbles-dark.png')})
    assert.equal(await page.locator('.dcb-settings select,.dcb-settings input[type=checkbox],.dcb-settings input[type=radio]').count(),0)
  })
  await check('gesture recorder confirms the pattern, generates a draft, and saves only after Apply',async()=>{
    await theme('light');await select('开屏欢迎');await section('welcome').getByRole('radio',{name:'自定义代码',exact:true}).click()
    const example=section('welcome').getByRole('button',{name:'手势开屏示例',exact:true}),behavior=section('welcome').getByRole('radiogroup',{name:'代码结束方式',exact:true}),editor=section('welcome').getByRole('textbox',{name:'开屏动画代码'})
    await expect(example).toBeHidden();await expect(section('welcome').getByText('手势开屏是交互示例',{exact:false})).toBeHidden()
    assert.ok((await behavior.boundingBox()).y<(await editor.boundingBox()).y,'choose the ending behavior before editing code')
    await section('welcome').locator('.dcb-welcome-code-behavior').scrollIntoViewIfNeeded();await page.screenshot({path:resolve(output,'code-timed-layout.png')})
    await section('welcome').getByRole('radio',{name:'交互完成后结束',exact:true}).click();await expect(example).toBeVisible();await expect(section('welcome').getByText('手势开屏是交互示例',{exact:false})).toBeVisible();await page.waitForTimeout(260)
    await example.scrollIntoViewIfNeeded();const row=await section('welcome').locator('.dcb-welcome-code-actions button').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().top));assert.ok(Math.max(...row)-Math.min(...row)<2,'desktop actions share a row')
    await example.click();const collapse=section('welcome').locator('.dcb-welcome-gesture-example'),height=await collapse.evaluate(el=>el.getBoundingClientRect().height);await page.waitForTimeout(280)
    await section('welcome').getByRole('radio',{name:'定时结束',exact:true}).click();await page.waitForTimeout(100)
    const intermediate=await collapse.evaluate(el=>el.getBoundingClientRect().height);assert.ok(intermediate>0&&intermediate<Math.max(height,400),'the example contracts through a real intermediate height')
    await expect(example).toBeHidden();await expect(collapse).toHaveAttribute('inert','');await expect(collapse).toBeHidden();assert.equal(await collapse.evaluate(el=>el.getBoundingClientRect().height),0)
    await section('welcome').getByRole('radio',{name:'交互完成后结束',exact:true}).click();await example.click()
    const recorder=section('welcome').locator('.dcb-gesture-recorder'),svg=recorder.locator('svg')
    await draw(svg,[0,1,4,7]);await expect(recorder.getByRole('status')).toHaveText('请再画一次确认')
    await draw(svg,[0,1,4,7]);await expect(section('welcome').getByRole('textbox',{name:'开屏动画代码'})).not.toHaveValue('')
    assert.equal((await saved()).welcomeThemes.light.welcomeCodeRevision,'');await expect(section('welcome').getByRole('radio',{name:'交互完成后结束',exact:true})).toHaveAttribute('aria-checked','true')
    await section('welcome').getByRole('button',{name:'应用代码开屏',exact:true}).click();await expect(card('开屏欢迎','light')).toContainText('九宫格手势开屏')
    await page.evaluate(source=>window.gestureSource=source,await section('welcome').getByRole('textbox',{name:'开屏动画代码'}).inputValue());await shot('welcome-gesture-settings')
    await section('welcome').getByRole('button',{name:'播放欢迎预览',exact:true}).click();await section('welcome').locator('iframe').waitFor()
    const frame=page.frameLocator('[data-dcb-settings-block=welcome] iframe');await frame.locator('.dcb-gesture').waitFor();await frame.locator('svg').scrollIntoViewIfNeeded();await page.waitForTimeout(300)
    await section('welcome').locator('.dcb-welcome-demo').screenshot({path:resolve(output,'gesture-light.png')})
    await section('welcome').getByRole('button',{name:'停止代码预览',exact:true}).click();await theme('dark');await select('输入栏')
  })
  await check('four code slots retain their own applied source and drafts, including after repeated replacement and storage cleanup',async()=>{
    await select('开屏欢迎');await section('welcome').getByRole('radio',{name:'自定义代码',exact:true}).click()
    const editor=section('welcome').getByRole('textbox',{name:'开屏动画代码'}),apply=section('welcome').getByRole('button',{name:'应用代码开屏',exact:true}),setMode=async interactive=>{await section('welcome').getByRole('radio',{name:interactive?'交互完成后结束':'定时结束',exact:true}).click();await page.waitForTimeout(80)}
    for(const scheme of ['light','dark'])for(const interactive of [false,true]){
      await theme(scheme);await setMode(interactive);const source=`<p>${scheme}-${interactive}</p>`;await editor.fill(source);await apply.click();await page.waitForTimeout(80)
    }
    await theme('light');await setMode(false);await expect(editor).toHaveValue('<p>light-false</p>');await editor.fill('<p>unsaved-timed</p>');await setMode(true);await expect(editor).toHaveValue('<p>light-true</p>');await setMode(false);await expect(editor).toHaveValue('<p>unsaved-timed</p>')
    for(let i=0;i<6;i++){await editor.fill(`<p>replacement-${i}</p>`);await apply.click();await page.waitForTimeout(70)}
    const value=await saved(),slots=Object.entries(value.welcomeThemes).flatMap(([scheme,item])=>Object.entries(item.welcomeCodeModes).map(([mode,choice])=>({scheme,mode,...choice})))
    const sources=await page.evaluate(async slots=>{const request=indexedDB.open('dsh-ui-beautify-welcome-code',1),db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=reject});try{return await Promise.all(slots.map(slot=>new Promise((resolve,reject)=>{const tx=db.transaction('opening'),read=tx.objectStore('opening').get('asset:'+slot.revision);read.onsuccess=()=>resolve({...slot,source:read.result?.source});read.onerror=reject})))}finally{db.close()}},slots)
    for(const item of sources)assert.equal(item.source,item.scheme==='light'&&item.mode==='timed'?'<p>replacement-5</p>':`<p>${item.scheme}-${item.mode==='interactive'}</p>`)
    await select('输入栏');await select('开屏欢迎');await expect(editor).toHaveValue('<p>replacement-5</p>');await setMode(true);await expect(editor).toHaveValue('<p>light-true</p>')
    assert.equal(JSON.stringify(value).includes('<p>'),false)
  })
  await check('interactive startup stays after the old 30-second deadline, rejects wrong patterns, and completes on the right one',async()=>{
    await page.evaluate(()=>window.fixture.settings(false));await startup()
    const frame=page.frameLocator('[data-dcb-welcome] iframe'),svg=frame.locator('svg')
    await page.clock.install();await page.clock.fastForward(31000);await expect(page.locator('[data-dcb-welcome]')).toHaveCount(1)
    await page.locator('[data-dcb-welcome]').screenshot({path:resolve(output,'gesture-dark.png')})
    await draw(svg,[0,3,4,5]);await expect(frame.locator('.dcb-gesture')).toHaveAttribute('data-state','error');await page.clock.fastForward(700)
    await draw(svg,[0,1,4,7]);await expect(frame.locator('.dcb-gesture')).toHaveAttribute('data-state','success');await page.clock.fastForward(1200);await expect(page.locator('[data-dcb-welcome]')).toHaveCount(0)
  })
  await check('iframe Escape and the outer Skip button always release an interactive opening',async()=>{
    await startup();await page.frameLocator('[data-dcb-welcome] iframe').getByRole('button',{name:'手势点 1',exact:true}).focus();await page.keyboard.press('Escape');await expect(page.locator('[data-dcb-welcome]')).toHaveCount(0)
    await startup();await page.getByRole('button',{name:'跳过欢迎动画',exact:true}).click();await expect(page.locator('[data-dcb-welcome]')).toHaveCount(0)
  })
  await check('gesture keyboard input, midpoint inclusion and interrupted drags remain recoverable',async()=>{
    await startup();const frame=page.frameLocator('[data-dcb-welcome] iframe'),svg=frame.locator('svg')
    await draw(svg,[0,2]);await expect(frame.locator('.dcb-gesture')).toHaveAttribute('data-state','error');await expect(svg.locator('polyline')).toHaveAttribute('points','70,70 150,70 230,70');await page.clock.fastForward(700)
    await svg.evaluate(el=>el.addEventListener('pointerdown',event=>window.testGesturePointer=event.pointerId,{once:true}));const box=await svg.boundingBox();await page.mouse.move(box.x+70*box.width/300,box.y+70*box.height/300);await page.mouse.down()
    await svg.evaluate(el=>el.dispatchEvent(new PointerEvent('pointercancel',{pointerId:window.testGesturePointer,bubbles:true})));await page.mouse.up();await expect(frame.locator('.dcb-gesture')).toHaveAttribute('data-state','idle');await expect(svg.locator('[data-selected=true]')).toHaveCount(0)
    for(const i of [0,1,4,7]){await frame.getByRole('button',{name:`手势点 ${i+1}`,exact:true}).focus();await page.keyboard.press('Enter')}
    await frame.getByRole('button',{name:'确认图案',exact:true}).click();await page.clock.fastForward(1200);await expect(page.locator('[data-dcb-welcome]')).toHaveCount(0)
  })
  await check('theme assignment cards switch the host theme and keep the right top switch synchronized',async()=>{
    await page.evaluate(()=>window.fixture.settings(true));await page.getByRole('tab',{name:'全局布局',exact:true}).waitFor()
    await select('开屏欢迎');await theme('light')
    await card('开屏欢迎','dark').click();await page.waitForTimeout(700)
    await expect(card('开屏欢迎','dark')).toHaveAttribute('data-current','true');await expect(page.locator('.dcb-theme-toggle')).toHaveAttribute('aria-checked','true')
    await card('开屏欢迎','light').click();await page.waitForTimeout(700)
    await expect(card('开屏欢迎','light')).toHaveAttribute('data-current','true');await expect(page.locator('.dcb-theme-toggle')).toHaveAttribute('aria-checked','false')
  })
  assert.deepEqual(errors,[]);writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors,scope:'Synthetic fixture using the actual generated plugin; desktop acceptance remains with the user'},null,2)+'\n');console.log(JSON.stringify({passed:checks.length,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
