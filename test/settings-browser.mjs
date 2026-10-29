import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeLogo,installLogoFixture} from './native-logo.mjs'
import {selectSettingsCategory} from './settings-navigation.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'settings-tabs')
mkdirSync(output,{recursive:true})
const fixture=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-ui-beautify:settings:v1',logo=nativeLogo()
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[]
page.on('pageerror',error=>errors.push(error.message))
let passed=0
const categories=['任务面板','输入栏','侧栏','开屏欢迎','全图背景','粒子背景','思考动图','对话动效','右上工具栏'],select=name=>selectSettingsCategory(page,name),dialog=page.getByRole('dialog'),tabs=page.locator('.dcb-settings-navigation')
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function mount(){
  await page.getByTestId('todo-panel').waitFor();await page.evaluate(installLogoFixture,logo)
  await page.evaluate(()=>{window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:window.fixtureFishLogo,FISH_LOGO_PATH:window.nativeLogo?.path,FISH_LOGO_VIEWBOX:window.nativeLogo}:window.fixtureReact)}})
  await page.addScriptTag({url:url+'/client.js'})
  await page.evaluate(()=>{const ctx={slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
  await page.addStyleTag({content:'.settings-dialog{inset:54px 14%;padding:24px}.dcb-settings{font-size:14px}'})
}
const tabAnimations=()=>page.evaluate(()=>document.getAnimations().filter(animation=>animation.id==='dcb-settings-tab').length)
const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
try{
  await page.goto(url);await page.evaluate(()=>localStorage.setItem('dsh-claude-beautify:settings:v1',JSON.stringify({welcomeEnabled:false,composerButtonGlass:true,cardStyle:'milk',welcomeText:'Legacy welcome'})));await mount()
  await check('renamed plugin migrates old preferences to the canonical key and retains the fallback record',async()=>{
    const preferences=await saved()
    assert.equal(preferences.welcomeText,'Legacy welcome');assert.equal(preferences.composerButtonGlass,true);assert.equal(preferences.welcomeEnabled,false)
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dsh-claude-beautify:settings:v1')).welcomeText),'Legacy welcome')
  })
  await page.evaluate(()=>window.fixture.settings(true));await select('任务面板')
  await check('hierarchical accessible categories mount one page and use uniform preview cards in all three material scopes',async()=>{
    assert.deepEqual(await page.getByRole('tablist',{name:'美化设置分组'}).getByRole('tab').allTextContents(),['组件布局','全局布局','对话布局','全局配置'])
    const geometry=[]
    for(const [name,label]of[['任务面板','卡片样式'],['输入栏','输入栏样式'],['侧栏','侧栏样式']]){
      await select(name);assert.equal(await dialog.locator('[data-dcb-settings-block]').count(),1)
      const group=page.getByRole('radiogroup',{name:label,exact:true}),choices=group.getByRole('radio')
      assert.equal(await choices.count(),4);assert.equal(await group.locator('.dcb-style-scene').count(),4)
      const row=await choices.evaluateAll(nodes=>nodes.map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,scene:el.querySelector('.dcb-style-scene').getBoundingClientRect().height,border:getComputedStyle(el).borderRadius})))
      assert.ok(row.every(item=>Math.abs(item.height-row[0].height)<1));geometry.push(row.map(({width,scene,border})=>({width,scene,border})))
      assert.equal(await group.locator('[data-cost=high]').count(),1)
      assert.equal(await group.getByText('随场景变化',{exact:true}).count(),1)
      await dialog.screenshot({path:resolve(output,`settings-${name}.png`)})
    }
    assert.deepEqual(geometry[0],geometry[1]);assert.deepEqual(geometry[1],geometry[2])
    assert.equal(await dialog.locator('select,input[type=checkbox],input[type=radio],input[type=range]').count(),0)
    assert.equal((await saved()).composerButtonGlass,true)
  })
  await check('category changes fade out and in, animate real height changes, and release their temporary styles',async()=>{
    await select('输入栏')
    await tabs.getByRole('tab',{name:'侧栏',exact:true}).click();await page.waitForTimeout(45)
    const out=await page.locator('.dcb-settings-tab-page').evaluate(el=>({opacity:Number(getComputedStyle(el).opacity),filter:getComputedStyle(el).filter,y:new DOMMatrix(getComputedStyle(el).transform).m42,inert:el.inert}))
    assert.ok(out.opacity>0&&out.opacity<1&&out.y<0);assert.match(out.filter,/blur/);assert.equal(out.inert,true)
    await page.waitForFunction(()=>document.querySelector('.dcb-settings-tab-stage')?.dataset.state==='entering')
    const heights=[]
    for(let i=0;i<3;i++){heights.push(await page.locator('.dcb-settings-tab-stage').evaluate(el=>el.getBoundingClientRect().height));await page.waitForTimeout(35)}
    assert.ok(Math.max(...heights)-Math.min(...heights)>2)
    await select('侧栏');assert.equal(await tabAnimations(),0)
    assert.equal(await page.locator('.dcb-settings-tab-stage').getAttribute('style'),'')
    assert.equal(await page.locator('.dcb-settings-tab-page').evaluate(el=>getComputedStyle(el).transform),'none')
  })
  await check('finished category exit stays transparent until React replaces the old page',async()=>{
    await page.evaluate(()=>{
      window.categoryFlashCount=0;window.categoryNativeCancel=Animation.prototype.cancel
      Animation.prototype.cancel=function(){
        const target=this.effect?.target,finished=this.playState==='finished'&&this.id==='dcb-settings-tab'&&target?.classList.contains('dcb-settings-tab-page')&&target.isConnected&&Number(getComputedStyle(target).opacity)<.02
        const result=window.categoryNativeCancel.call(this)
        if(finished&&target.isConnected&&Number(getComputedStyle(target).opacity)>.5)window.categoryFlashCount++
        return result
      }
    })
    try{for(const name of ['粒子背景','输入栏','粒子背景','任务面板'])await select(name);assert.equal(await page.evaluate(()=>window.categoryFlashCount),0,'outgoing page must not flash back before replacement')}
    finally{await page.evaluate(()=>{Animation.prototype.cancel=window.categoryNativeCancel;delete window.categoryNativeCancel})}
  })
  await check('rapid reversal and keyboard navigation keep selection, focus and mounted content consistent',async()=>{
    await select('输入栏');await page.waitForTimeout(35)
    await tabs.getByRole('tab',{name:'侧栏',exact:true}).click();await page.waitForTimeout(25)
    await tabs.getByRole('tab',{name:'全局布局',exact:true}).click();await select('开屏欢迎')
    assert.equal(await page.locator('[data-dcb-settings-block=welcome]').count(),1)
    assert.equal(await page.getByRole('tabpanel').count(),1)
    await tabs.getByRole('tab',{name:'全局布局',exact:true}).press('End');await tabs.getByRole('tab',{name:'全局配置',exact:true}).press('ArrowLeft');await select('思考动图');await tabs.getByRole('tab',{name:'思考动图',exact:true}).press('End');await select('对话动效')
    assert.equal(await page.getByRole('tab',{name:'对话动效'}).evaluate(el=>el===document.activeElement),true)
    await tabs.getByRole('tab',{name:'组件布局',exact:true}).press('Home');await select('任务面板')
    assert.equal(await page.getByRole('tab',{name:'任务面板'}).evaluate(el=>el===document.activeElement),true)
  })
  await check('switching categories preserves edited preferences and cancels preview animations',async()=>{
    await select('侧栏');await page.getByRole('radio',{name:'侧栏：轻量玻璃',exact:true}).click()
    await select('开屏欢迎');await page.getByRole('radio',{name:'默认 · Logo 字符填充',exact:true}).click();const text=page.getByRole('textbox',{name:'Logo 填充字符'});await text.fill('DeepSeek Harness')
    await select('输入栏')
    assert.equal((await saved()).welcomeCharacters,'DeepSeek Harness');assert.equal((await saved()).sidebarStyle,'css')
    await select('开屏欢迎');assert.equal(await text.inputValue(),'DeepSeek Harness')
    await page.getByRole('button',{name:'播放欢迎预览'}).click();assert.ok(await page.evaluate(()=>document.getAnimations().some(animation=>animation.id.startsWith('dcb-startup-characters'))))
    await select('对话动效');assert.equal(await page.evaluate(()=>document.getAnimations().filter(animation=>animation.id.startsWith('dcb-startup-characters')).length),0)
    await page.getByRole('button',{name:'播放消息动效预览'}).click();await select('侧栏')
    assert.equal(await page.locator('.dcb-message-demo').count(),0)
  })
  await check('sticky categories stay reachable and return scrolled settings to the new page without moving the chat',async()=>{
    await page.setViewportSize({width:1440,height:650})
    await select('输入栏');await page.evaluate(()=>{window.chatScroll=document.querySelector('[data-conversation-scroll]').scrollTop;document.querySelector('.settings-dialog').scrollTop=450})
    assert.ok(await dialog.evaluate(el=>el.scrollTop)>0)
    const pos=await tabs.boundingBox(),box=await dialog.boundingBox();assert.ok(pos.y>=box.y&&pos.y<box.y+45)
    await select('侧栏');const sectionTop=(await page.locator('[data-dcb-settings-block=sidebar]').boundingBox()).y;const navigation=await tabs.boundingBox();assert.ok(sectionTop>=navigation.y&&sectionTop<navigation.y+navigation.height+100)
    assert.equal(await page.evaluate(()=>document.querySelector('[data-conversation-scroll]').scrollTop===window.chatScroll),true)
    await page.evaluate(()=>window.fixture.settings(false));await page.evaluate(()=>window.fixture.settings(true));await select('侧栏')
    assert.equal(await page.getByRole('tab',{name:'侧栏',exact:true}).getAttribute('aria-selected'),'true')
  })
  await check('all settings categories share iOS switches, white circular thumbs and theme-accent on states',async()=>{
    await page.setViewportSize({width:1440,height:1000})
    for(const dark of[false,true]){
      await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark)
      let count=0
      for(const category of categories){
        await select(category)
        const switches=page.getByRole('tabpanel').getByRole('switch')
        for(let i=0;i<await switches.count();i++){
          const control=switches.nth(i);count++
          const original=await control.getAttribute('aria-checked'),disabled=await control.isDisabled()
          const sample=()=>control.evaluate(el=>{const s=getComputedStyle(el),thumb=getComputedStyle(el,'::after'),rgb=color=>color.match(/[\d.]+/g).map(Number);return{checked:el.getAttribute('aria-checked')==='true',track:rgb(s.backgroundColor),thumb:rgb(thumb.backgroundColor),knobWidth:parseFloat(thumb.width),knobHeight:parseFloat(thumb.height),radius:parseFloat(s.borderRadius),shadow:s.boxShadow,x:new DOMMatrix(thumb.transform).m41,width:el.offsetWidth,height:el.offsetHeight,opacity:Number(s.opacity)}})
          for(let state=0;state<(disabled?1:2);state++){
            await page.mouse.move(1,1);await page.waitForTimeout(250)
            const value=await sample()
            assert.deepEqual(value.thumb,[255,255,255]);assert.deepEqual([value.width,value.height],[44,26]);assert.deepEqual([value.knobWidth,value.knobHeight],[22,22]);assert.ok(value.radius>=value.height/2)
            assert.equal(value.x,value.checked?18:0)
            if(disabled)assert.ok(value.opacity<1)
            else{if(value.checked){assert.ok(Math.max(...value.track.slice(0,3))-Math.min(...value.track.slice(0,3))>30,'enabled track uses the shared accent');assert.notEqual(value.shadow,'none')}else assert.ok(value.track[3]<.5,'off track remains neutral and translucent');await control.click()}
          }
          assert.equal(await control.getAttribute('aria-checked'),original)
        }
      }
      assert.equal(count,22) // Includes the 0.4.2 streaming reveal switch.
      await select('开屏欢迎');await page.mouse.move(1,1);await page.waitForTimeout(250)
      await dialog.screenshot({path:resolve(output,`switches-${dark?'dark':'light'}.png`)})
    }
  })
  await check('iOS switch motion reverses from its current position, supports keyboard focus and keeps disabled states inert',async()=>{
    await select('输入栏')
    const control=page.getByRole('switch',{name:'小按钮玻璃材质',exact:true})
    await control.scrollIntoViewIfNeeded();await control.focus();await page.mouse.move(1,1);await page.waitForTimeout(280)
    const original=await control.getAttribute('aria-checked')
    const start=await control.evaluate(el=>{window.switchBeforeMotion=el;return new DOMMatrix(getComputedStyle(el,'::after').transform).m41})
    await control.press('Space');await page.waitForTimeout(65)
    const middle=await control.evaluate(el=>new DOMMatrix(getComputedStyle(el,'::after').transform).m41)
    assert.ok(Math.abs(middle-start)>1&&middle>0&&middle<18,'thumb travels through an intermediate frame')
    await control.press('Space');await page.waitForTimeout(300)
    assert.equal(await control.getAttribute('aria-checked'),original)
    const final=await control.evaluate(el=>({x:new DOMMatrix(getComputedStyle(el,'::after').transform).m41,outline:getComputedStyle(el).outlineWidth,same:el===window.switchBeforeMotion,hit:document.elementFromPoint(el.getBoundingClientRect().left+22,el.getBoundingClientRect().top-6)===el}))
    assert.ok(Math.abs(final.x-start)<.01);assert.equal(final.outline,'2px');assert.equal(final.same,true);assert.equal(final.hit,true,'touch hit area extends above the visual rail')
    await control.evaluate(el=>el.disabled=true);await page.waitForTimeout(220);await control.press('Space')
    assert.equal(await control.getAttribute('aria-checked'),original)
    assert.ok(await control.evaluate(el=>Number(getComputedStyle(el).opacity))<.5)
    await control.evaluate(el=>el.disabled=false)
  })
  await check('selected and informational dots glow locally only in dark settings and do not add idle animations',async()=>{
    await select('输入栏');await page.getByRole('radio',{name:'输入栏：轻量玻璃',exact:true}).click()
    const glow=()=>page.evaluate(()=>{
      const selected=document.querySelector('.dcb-style-option[aria-checked=true]'),off=document.querySelector('.dcb-style-option[aria-checked=false]'),info=document.querySelector('.dcb-settings-info')
      const dot=getComputedStyle(selected,'::after'),unselected=getComputedStyle(off,'::after'),status=getComputedStyle(info,'::before')
      return{selected:dot.boxShadow,unselected:unselected.boxShadow,info:status.boxShadow,animation:dot.animationName,statusAnimation:status.animationName}
    })
    for(const dark of[false,true]){
      await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);await page.mouse.move(1,1);await page.waitForTimeout(350)
      const value=await glow();assert.equal(value.animation,'none');assert.equal(value.statusAnimation,'none');assert.equal(value.unselected,'none')
      if(dark){assert.notEqual(value.selected,'none');assert.notEqual(value.info,'none')}
      else{assert.equal(value.selected,'none');assert.equal(value.info,'none')}
      assert.equal(await page.locator('.dcb-settings').evaluate(el=>el.getAnimations({subtree:true}).length),0,'settled settings controls do not run animations')
      await dialog.screenshot({path:resolve(output,`ios-composer-${dark?'dark':'light'}.png`)})
    }
    await page.emulateMedia({reducedMotion:'reduce'});assert.notEqual((await glow()).selected,'none','reduced motion keeps a static glow')
    await page.emulateMedia({forcedColors:'active'})
    const forced=await glow();assert.equal(forced.selected,'none');assert.equal(forced.info,'none')
    assert.equal(await page.getByRole('switch',{name:'小按钮玻璃材质',exact:true}).evaluate(el=>getComputedStyle(el).boxShadow),'none')
    await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
  })
  await check('narrow and dark settings keep categories and all material cards inside the content column',async()=>{
    await page.setViewportSize({width:520,height:900});await page.addStyleTag({content:'.settings-dialog{inset:24px 12px;padding:14px}'})
    await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''))
    for(const name of categories){await select(name);assert.equal(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true)}
    await select('侧栏');await dialog.screenshot({path:resolve(output,'settings-narrow-dark.png')})
  })
  await check('reduced motion and forced colors use immediate accessible changes and disposal cancels pending transitions',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});await select('开屏欢迎');assert.equal(await tabAnimations(),0)
    await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'active'});await select('任务面板');assert.equal(await tabAnimations(),0)
    await page.emulateMedia({forcedColors:'none'});await select('输入栏');await tabs.getByRole('tab',{name:'侧栏',exact:true}).click();await page.evaluate(()=>window.fixture.settings(false));await page.waitForTimeout(380)
    assert.equal(await tabAnimations(),0);assert.equal(await page.locator('.dcb-settings-tab-stage').count(),0)
    await page.evaluate(()=>{for(const cb of window.cleanups.reverse())cb?.()})
  })
  await check('settings categories survive closing and reload without changing appearance preferences; invalid memory returns to the first category',async()=>{
    const tabKey='dsh-ui-beautify:settings-tab:v1'
    await page.reload();await mount();await page.evaluate(()=>window.fixture.settings(true))
    await select('粒子背景');const preferences=await saved()
    await page.evaluate(()=>window.fixture.settings(false));await page.evaluate(()=>window.fixture.settings(true))
    assert.equal(await tabs.getByRole('tab',{name:'粒子背景',exact:true}).getAttribute('aria-selected'),'true')
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),tabKey),'particles')
    await page.reload();await mount();await page.evaluate(()=>window.fixture.settings(true))
    assert.equal(await tabs.getByRole('tab',{name:'粒子背景',exact:true}).getAttribute('aria-selected'),'true')
    assert.equal(await page.locator('[data-dcb-settings-block]').count(),1)
    assert.deepEqual(await saved(),preferences)
    await page.evaluate(key=>localStorage.setItem(key,'removed-category'),tabKey)
    await page.reload();await mount();await page.evaluate(()=>window.fixture.settings(true))
    assert.equal(await tabs.getByRole('tab',{name:'组件布局',exact:true}).getAttribute('aria-selected'),'true')
  })
  await check('blocked browser storage retains the last category within this window and does not stop settings interactions',async()=>{
    await page.evaluate(()=>localStorage.setItem('dsh-ui-beautify:settings-tab:v1','particles'))
    await page.reload();await mount();await page.evaluate(()=>window.fixture.settings(true))
    await page.evaluate(key=>{
      const get=Storage.prototype.getItem,set=Storage.prototype.setItem
      Storage.prototype.getItem=function(name){if(name===key)throw new DOMException('blocked','SecurityError');return get.call(this,name)}
      Storage.prototype.setItem=function(name,value){if(name===key)throw new DOMException('blocked','SecurityError');return set.call(this,name,value)}
    },'dsh-ui-beautify:settings-tab:v1')
    await page.evaluate(()=>window.fixture.settings(false));await page.evaluate(()=>window.fixture.settings(true))
    assert.equal(await tabs.getByRole('tab',{name:'粒子背景',exact:true}).getAttribute('aria-selected'),'true')
    await select('对话动效');await page.evaluate(()=>window.fixture.settings(false));await page.evaluate(()=>window.fixture.settings(true))
    assert.equal(await tabs.getByRole('tab',{name:'对话动效',exact:true}).getAttribute('aria-selected'),'true')
    await select('输入栏');assert.equal(await page.locator('[data-dcb-settings-block="composer"]').count(),1)
  })
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
