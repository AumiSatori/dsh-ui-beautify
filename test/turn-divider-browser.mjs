import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'../divider-results'),'turn-divider')
mkdirSync(output,{recursive:true})
const bundled=await build({entryPoints:[resolve(project,'src/turn-cards.js'),resolve(project,'src/turn-divider.js')],outdir:'out',bundle:true,write:false,format:'iife',globalName:'Module',loader:{'.png':'dataurl'}})
const cards=bundled.outputFiles.find(file=>file.path.endsWith('turn-cards.js')).text,divider=bundled.outputFiles.find(file=>file.path.endsWith('turn-divider.js')).text
const fixture=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1000}})
const errors=[];page.on('pageerror',error=>errors.push(error.message))
const tick=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(done)))))
const shadow=()=>page.locator('[data-dcb-turn-divider]').first()
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function boot(){
  await page.route('http://turn-divider.test/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>分隔装饰预览</title>'}))
  await page.goto('http://turn-divider.test/');await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
  await page.setContent(`<!doctype html><meta charset=utf-8><style>*{box-sizing:border-box}body{margin:0;background:#fff;color:#303747;font:15px/1.8 system-ui}body[data-ds-dark-theme]{background:#1b1d23;color:#e3e7ef}main{max-width:1000px;margin:auto;padding:40px 36px}[data-conversation-scroll]{height:900px;overflow:auto;padding:20px}h3{font-size:17px}.question{margin-left:auto;width:fit-content;background:#8881;padding:10px 16px;border-radius:14px}.process{font-size:12px;color:#929aaa;padding-block:12px}button{font:inherit;cursor:pointer}.message{padding-block:10px}</style><main data-conversation-session=demo><h3>DeepSeek Harness · 对话分隔装饰</h3><section data-conversation-scroll><div data-chat-flow data-chat-following-tail><div data-slot="conversation.chat.flow" style="display:contents"></div></div></section></main>`)
  await page.addScriptTag({content:cards+';window.Cards=Module;'+divider+';window.Divider=Module;'})
  await page.evaluate(()=>{
    const style=document.createElement('style');style.textContent=Cards.turnCardsCss;document.head.append(style)
    window.flow=document.querySelector('[data-slot="conversation.chat.flow"]')
    window.addTurn=i=>{for(const kind of ['user','assistant']){const row=document.createElement('div');row.dataset.chatTurn=i;row.dataset.chatFlowKind=kind;row.innerHTML=kind==='user'?`<p class=question>第 ${i} 轮：让分隔也有自己的表情。</p>`:'<div class=message><span class=process>已完成 · 思考与工具记录</span><h3>正文继续保持清楚、安静。</h3><p>艺术字和鲸鱼娘只在两轮之间，不遮住消息，也不接管任何操作。</p><button onclick="window.copied=(window.copied||0)+1">复制</button></div>';flow.append(row)}}
    for(let i=1;i<=3;i++)addTurn(i)
    window.originalRows=[...flow.children]
    window.options={enabled:true,style:'line',turnDividerPreset:'whale',turnDividerMotion:true,turnDividerColor:'#87a5d4'}
    window.manager=Cards.createTurnCards(document,window,options)
  });await tick();await page.waitForTimeout(80)
}
try{
  await check('existing art presets keep their letters and divider without the removed mascot or its empty space',async()=>{
    await boot()
    assert.equal(await page.locator('[data-dcb-turn-divider]').count(),2)
    assert.equal(await shadow().locator('.letter').count(),16)
    assert.equal(await shadow().locator('.brand').textContent(),'DeepSeek Harness')
    assert.equal(await page.evaluate(()=>originalRows.every((row,index)=>row===flow.children[index])),true)
    assert.equal(await page.locator('[data-dcb-turn-head]').nth(1).evaluate(el=>getComputedStyle(el,'::before').content),'none')
    assert.equal(await shadow().locator('.mascot,img').count(),0)
    assert.equal(await shadow().evaluate(el=>el.style.getPropertyValue('--mascot-sheet')),'')
    assert.equal(await page.locator('[data-dcb-turn-head]').nth(1).evaluate(el=>getComputedStyle(el).marginBlockStart),'56px')
    await page.screenshot({path:resolve(output,'whale-divider-light.png')})
  })
  await check('individual letters still animate and native clicks work without a mascot',async()=>{
    const letter=await shadow().locator('.letter').first().evaluate(el=>{const a=el.getAnimations()[0];a.pause();a.currentTime=450;return getComputedStyle(el).transform})
    assert.notEqual(letter,'none')
    await page.getByRole('button',{name:'复制',exact:true}).first().click();assert.equal(await page.evaluate(()=>copied),1)
    await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await tick();await page.screenshot({path:resolve(output,'whale-divider-dark.png')})
  })
  await check('free CSS changes only the shadow decoration, not messages or settings outside it',async()=>{
    await page.evaluate(()=>{
      options.turnDividerCss='* { color: rgb(190, 80, 170); } .line {height:3px;background:linear-gradient(90deg,#70b4ed,#c998e4)} .brand {font-weight:900}';manager.setOptions(options)
    });await tick()
    assert.equal(await shadow().locator('.line').evaluate(el=>getComputedStyle(el).height),'3px')
    assert.equal(await shadow().locator('.brand').evaluate(el=>getComputedStyle(el).color),'rgb(190, 80, 170)')
    assert.equal(await page.locator('.message').first().evaluate(el=>getComputedStyle(el).color),'rgb(227, 231, 239)')
    await page.evaluate(()=>{options.turnDividerCss='';manager.setOptions(options)})
  })
  await check('offscreen, motion off, background and reduced motion stop animation, and long streaming does not create a frame loop',async()=>{
    await page.evaluate(()=>{for(let i=4;i<50;i++)addTurn(i)});await tick()
    const last=page.locator('[data-dcb-turn-divider]').last();assert.equal(await last.getAttribute('data-paused'),'')
    await page.evaluate(()=>{options.turnDividerMotion=false;manager.setOptions(options)});await tick()
    assert.equal(await shadow().getAttribute('data-paused'),'')
    await page.evaluate(()=>{options.turnDividerMotion=true;manager.setOptions(options);Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await tick()
    assert.equal(await shadow().getAttribute('data-paused'),'')
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))})
    await page.emulateMedia({reducedMotion:'reduce'});await tick();assert.equal(await shadow().getAttribute('data-paused'),'')
    await page.emulateMedia({reducedMotion:'no-preference'})
    const calls=await page.evaluate(async()=>{const raf=requestAnimationFrame;let calls=0;window.requestAnimationFrame=fn=>{calls++;return raf(fn)};for(let i=0;i<50;i++)flow.children[1].querySelector('p').firstChild.appendData('继续输出。');await new Promise(done=>setTimeout(done,180));window.requestAnimationFrame=raf;return calls})
    assert.equal(calls,0)
  })
  await check('a local GIF loads from IndexedDB, freezes when motion stops, survives manager recreation and clears cleanly',async()=>{
    const gif='R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    await page.evaluate(async gif=>{
      const file=new File([Uint8Array.from(atob(gif),c=>c.charCodeAt(0))],'own.gif',{type:'image/gif'});Object.assign(options,await manager.importImage(file));manager.setOptions(options)
    },gif)
    await page.waitForFunction(()=>document.querySelector('[data-dcb-turn-divider]')?.shadowRoot.querySelector('img')?.src.startsWith('blob:'))
    const playing=await shadow().locator('img').getAttribute('src')
    assert.equal(await page.locator('[data-dcb-turn-head]').nth(1).evaluate(el=>getComputedStyle(el).marginBlockStart),'112px','only an explicit local image reserves image space')
    await page.evaluate(()=>{options.turnDividerMotion=false;manager.setOptions(options)});await tick()
    assert.notEqual(await shadow().locator('img').getAttribute('src'),playing)
    await page.evaluate(()=>{manager.dispose();manager=Cards.createTurnCards(document,window,options)});await tick()
    await page.waitForFunction(()=>document.querySelector('[data-dcb-turn-divider]')?.shadowRoot.querySelector('img')?.src.startsWith('blob:'))
    await page.evaluate(async()=>{Object.assign(options,await manager.resetImage());manager.setOptions(options)});await tick();assert.equal(await shadow().locator('.mascot,img').count(),0)
    assert.equal(await page.locator('[data-dcb-turn-head]').nth(1).evaluate(el=>getComputedStyle(el).marginBlockStart),'56px','removing a custom image never restores the removed built-in mascot')
    await assert.rejects(()=>page.evaluate(()=>manager.importImage(new File(['<svg/>'],'bad.svg',{type:'image/svg+xml'}))),/GIF/)
  })
  await check('narrow layouts fit the art text without the removed mascot, default and unload remove every decoration',async()=>{
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{document.querySelector('main').style.padding='12px';document.querySelector('[data-conversation-scroll]').style.padding='8px'});await tick()
    const spacing=await shadow().evaluate(host=>{const a=host.shadowRoot.querySelector('.brand').getBoundingClientRect(),b=host.getBoundingClientRect();return{brandRight:a.right,hostRight:b.right}})
    assert.ok(spacing.brandRight<=spacing.hostRight)
    assert.equal(await shadow().locator('.mascot,img').count(),0)
    await page.screenshot({path:resolve(output,'whale-divider-mobile.png')})
    await page.evaluate(()=>manager.setOptions({...options,enabled:false}));await tick();assert.equal(await page.locator('[data-dcb-turn-divider]').count(),0)
    await page.evaluate(()=>manager.dispose());assert.equal(await page.locator('[data-dcb-divider-preset]').count(),0)
  })
  await check('real settings expose color, animation, GIF import and CSS apply while saving only presentation preferences',async()=>{
    await page.setViewportSize({width:1440,height:1000})
    const html=readFileSync(resolve(project,'test/fixture.html'),'utf8').replace(/<script[^>]*src="\/fixture.js"[^>]*><\/script>/,'')
    await page.route('http://divider-settings.test/',route=>route.fulfill({contentType:'text/html',body:html}));await page.goto('http://divider-settings.test/')
    await page.addScriptTag({content:fixture.outputFiles[0].text});await page.getByTestId('todo-panel').waitFor()
    await page.evaluate(()=>{window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}})
    await page.addScriptTag({content:readFileSync(resolve(project,'client.js'),'utf8')})
    await page.evaluate(()=>{const ctx={slots:{inject(_slot,fn){fn()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(fn){cleanups.push(fn())},inject(_names,fn){fn(ctx)}};plugin.apply(ctx);fixture.refresh()})
    await page.getByRole('button',{name:'打开设置',exact:true}).click();await page.getByRole('tab',{name:'对话动效',exact:true}).click()
    await page.getByRole('radio',{name:'对话分轮：极简分隔',exact:true}).click();await page.getByRole('radio',{name:'艺术字',exact:true}).click();await tick()
    assert.equal(await page.locator('.dcb-divider-demo .mascot,.dcb-divider-demo img').count(),0)
    assert.equal(await page.getByRole('radio',{name:'鲸鱼娘与艺术字',exact:true}).count(),0)
    await page.getByRole('switch',{name:'分隔装饰动效',exact:true}).click()
    await page.getByText('CSS 自定义',{exact:true}).click();await page.getByRole('textbox',{name:'分隔装饰 CSS',exact:true}).fill('.brand { color: #b78bd2; }');await page.getByRole('button',{name:'应用 CSS',exact:true}).click();await tick()
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dsh-claude-beautify:settings:v1')))
    assert.equal(saved.turnDividerPreset,'whale');assert.equal(saved.turnDividerMotion,false);assert.equal(saved.turnDividerCss,'.brand { color: #b78bd2; }')
    assert.equal(await page.getByRole('button',{name:'导入自己的动图',exact:true}).count(),1)
    await page.screenshot({path:resolve(output,'divider-settings-light.png')})
    await page.getByRole('textbox',{name:'分隔装饰 CSS',exact:true}).fill('@import "https://example.com/a.css";');await page.getByRole('button',{name:'应用 CSS',exact:true}).click();assert.ok((await page.getByRole('alert').textContent()).includes('直接填写'))
    await page.evaluate(()=>{for(const cleanup of cleanups)if(typeof cleanup==='function')cleanup()})
  })
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,output}))
}finally{await browser.close()}
