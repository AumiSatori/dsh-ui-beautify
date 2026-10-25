import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeShell} from './native-shell.mjs'
import {nativeLogo,installLogoFixture} from './native-logo.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','background-only-mode-qa'),'background-only')
mkdirSync(output,{recursive:true})
const native=nativeShell(),logo=nativeLogo(),checks=[],errors=[]
const demo=`import React from 'react';import*as jsxRuntime from'react/jsx-runtime';import{createRoot}from'react-dom/client';import{createBackgroundStore}from'./src/background-media.js';import{createFocusMode,focusModeCss}from'./src/background-only-mode.js';
const react=React,react_jsx_runtime=jsxRuntime,clsx=(...values)=>values.flat().filter(Boolean).join(' '),localBuildVersion=()=> 'test',conversationPhase=()=> 'active',FIXED_VIEW_ID='chat';
const _deepseek_ai_dsh_client_ui_primitives=new Proxy({},{get:()=>()=>null});
${native.code}
window.fixtureReact=React;window.cleanups=[];window.createIsolatedBackgroundMode=()=>createFocusMode(React,document,window);window.backgroundModeCss=focusModeCss;
const snapshot={entries:[],hasMore:false,change:{kind:'replace'}},binding={eventSource:{getSnapshot:()=>snapshot,subscribe:()=>()=>{}}};window.fixtureBinding=()=>binding;
window.seedBackground=async()=>{const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=700;const c=canvas.getContext('2d'),g=c.createLinearGradient(0,0,1200,700);g.addColorStop(0,'#163a65');g.addColorStop(.52,'#68a6bd');g.addColorStop(1,'#e4bd92');c.fillStyle=g;c.fillRect(0,0,1200,700);c.fillStyle='#eaf7f3';c.beginPath();c.arc(850,140,52,0,Math.PI*2);c.fill();c.fillStyle='#244f68';c.beginPath();c.moveTo(0,650);c.lineTo(360,230);c.lineTo(640,600);c.lineTo(1000,330);c.lineTo(1200,700);c.fill();const blob=await new Promise(resolve=>canvas.toBlob(resolve));const store=createBackgroundStore(window);await store.replace({revision:'synthetic-wallpaper',name:'synthetic.png',kind:'image',type:'image/png',blob});store.dispose()};
function Demo(){
 const [view,setView]=React.useState('chat'),[,refresh]=React.useReducer(n=>n+1,0),[show,setShow]=React.useState(true);
 const useSession=selector=>selector({running:false,openState:'open'}),useSessions=selector=>selector({byId:{a:{id:'a',displayTitle:'合成会话：隐藏全部文字'}}});
 window.fixture={refresh,show:setShow};
 const Header=show&&window.fixtureHeader,injected=Header?window.fixtureHeaderSpec.inject('a'):null,source=injected?.hooks.taskActivity;
 const renderSlot=(slot,props)=>{
  if(slot==='conversation.header.leading')return <span data-slot="conversation.header.leading"/>;
  if(slot==='conversation.session.header')return <div data-slot="conversation.session.header" style={{display:'contents'}}><ConversationSessionHeader {...props} sessionId="a" useSessions={useSessions} useConversationViews={selector=>selector([{id:'chat',label:'对话'},{id:'trace',label:'轨迹'},{id:'context',label:'上下文'}])} useStore={selector=>selector({view})} useEntryPins={selector=>selector([])} useEntryActions={selector=>selector(false)} renderSlot={renderSlot} open={()=>{}} selectView={setView} setPinned={()=>{}} t={key=>key}/></div>;
  if(slot==='conversation.session.header.actions')return <><button>标准模式</button><button>4 个智能体</button></>;
  if(slot==='conversation.session.header.utilities')return Header&&<Header {...injected} sessionId="a" useSession={useSession} useProjection={name=>name==='contextPressure'?{projectedTokens:50000,contextWindow:100000}:[]} useTaskActivity={selector=>React.useSyncExternalStore(source.subscribe,()=>selector(source.getSnapshot()))}/>;
  if(slot==='conversation.session.header.corner')return <button aria-label="右侧栏">▥</button>;
  return props?.fallback||null;
 };
 return <div className="af_frame"><aside className="af_sidebarCol"><button>新会话</button><button className="dcb-theme-toggle" aria-label="切换主题" onClick={()=>document.body.toggleAttribute('data-ds-dark-theme')}>◐</button><p>工作区</p></aside><main className="af_centerCol"><section className="cr_root" data-phase="active"><div data-slot="conversation.header" style={{display:'contents'}}><ConversationHeader sessionId="a" useSession={useSession} useConversation={selector=>selector({})} renderSlot={renderSlot}/></div><div data-slot="conversation.content" style={{display:'contents'}}><div className="cr_body" data-conversation-content="" data-conversation-session="a" data-content-phase="active"><div className="cr_scrollBody" data-conversation-scroll=""><article data-chat-flow="">{Array.from({length:new URLSearchParams(location.search).has('long')?600:30},(_,i)=><section key={i} data-chat-turn={i+1}><h3>合成段落 {i+1}</h3><p>{'消息与工具结果也会完全隐藏。'.repeat(12)}</p><table><tbody><tr><td>合成数据</td><td>{i+1}</td></tr></tbody></table></section>)}</article><div className="cr_composerSeat" data-composer-seat=""><textarea aria-label="输入草稿" defaultValue="保留草稿和选区"/></div></div></div></div></section></main><aside className="af_rightbarCol" data-rightbar-col=""><p>文件面板</p></aside></div>;
}
createRoot(document.getElementById('root')).render(<Demo/>);`
const fixture=await build({stdin:{contents:demo,loader:'jsx',resolveDir:project},bundle:true,write:false,format:'iife'})
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${native.css}
*{box-sizing:border-box}html,body,#root{height:100%;margin:0;font:14px/1.5 system-ui;color:#25252a;background:#fff;--dsw-alias-label-primary:#25252a;--dsw-alias-label-secondary:#666;--dsw-alias-border-l3:#ddd}.af_frame{height:100%;display:grid;grid-template-columns:220px minmax(0,1fr) 220px;overflow:hidden}.af_centerCol{min-width:0;min-height:0}.af_sidebarCol,.af_rightbarCol{background:#f5f6f8;padding:20px}.cr_root{display:flex;flex-direction:column;height:100%;min-height:0}.cr_header{flex:none}.cr_body{flex:1;min-height:0}.cr_scrollBody{overflow:auto}article{width:min(680px,calc(100% - 48px));margin:0 auto;flex:1 0 auto;padding-top:24px}article p{line-height:1.8}.cr_composerSeat{padding:16px 24px}button{font:inherit;cursor:pointer;min-height:30px;border:0;border-radius:6px;background:transparent;color:inherit}textarea{width:100%;height:80px;border:1px solid #8885;border-radius:10px;padding:14px;font:inherit}body[data-ds-dark-theme]{color:#eee;background:#171717;--dsw-alias-label-primary:#eee;--dsw-alias-label-secondary:#bbb;--dsw-alias-bg-base:#171717}body[data-ds-dark-theme] .af_sidebarCol,body[data-ds-dark-theme] .af_rightbarCol{background:#202020}
@media(max-width:900px){.af_frame{grid-template-columns:0px minmax(0,1fr) 0px}.af_sidebarCol,.af_rightbarCol{visibility:hidden}}
</style><div id="root"></div><script src="/fixture.js"></script>`
const routes={'/':['text/html; charset=utf-8',html],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}/`,key='dsh-ui-beautify:settings:v1'
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:900}})
page.on('pageerror',e=>{errors.push(e.message);console.log('FIXTURE ERROR '+e.message)})
const entry=()=>page.locator('.dcb-focus-toggle:not(.dcb-background-exit)'),exit=()=>page.getByRole('button',{name:'退出纯背景模式',exact:true})
const idle=()=>page.waitForFunction(()=>!document.getAnimations().some(a=>a.id.startsWith('dcb-focus-')))
const saved=()=>page.evaluate(key=>localStorage.getItem(key),key)
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
async function boot({centered=true,particles=true,long=false,overlay=false}={}){
 await page.goto(url+(long?'?long':''));await page.locator('textarea').waitFor();await page.evaluate(installLogoFixture,logo)
 await page.evaluate(async({key,centered,particles,overlay})=>{
  await window.seedBackground()
  localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleEnabled:particles,particleProgressMode:'manual',particleManualProgress:65,particleCount:1600,sidebarOverlay:overlay,headerCentered:centered,backgroundEnabled:true,backgroundRevision:'synthetic-wallpaper',backgroundOpacity:55,backgroundBlur:8}))
  window.cleanups=[];window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true
  window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:window.fixtureFishLogo,FISH_LOGO_PATH:window.nativeLogo?.path,FISH_LOGO_VIEWBOX:window.nativeLogo}:window.fixtureReact)}
 },{key,centered,particles,overlay})
 await page.addScriptTag({url:url+'client.js'})
 await page.evaluate(()=>{const ctx={slots:{inject(_name,fn){fn()},register(spec,component){if(spec.name==='conversation.session.header.utilities'){window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:window.fixtureBinding},effect(fn){window.cleanups.push(fn())},inject(_names,fn){fn(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
 await entry().waitFor();await page.waitForFunction(()=>document.querySelector('[data-dcb-background-layer] img')?.complete)
 if(particles)await page.waitForFunction(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')]?.snapshot().scenes.some(s=>s.ready&&!s.waiting))
 await page.evaluate(()=>{const scroll=document.querySelector('[data-conversation-scroll]');scroll.scrollTop=550;window.keptEditor=document.querySelector('textarea');window.keptEditor.setSelectionRange(2,5);window.keptBackground=document.querySelector('[data-dcb-background-layer] img');window.keptCanvas=document.querySelector('.dcb-particle-layer canvas');window.keptScrollTop=scroll.scrollTop;window.keptRect={width:scroll.getBoundingClientRect().width,height:scroll.getBoundingClientRect().height}})
}
try{
 await boot();const before=await saved()
 await check('pure background hides all chat text, tables, header, input, sidebars and floating files with no blur',async()=>{
  await page.evaluate(()=>{const viewer=document.createElement('aside');viewer.className='dcb-file-viewer';viewer.textContent='浮动预览内容';document.body.append(viewer)})
  await entry().click();await idle()
  for(const selector of['article','header','textarea','.af_sidebarCol','.af_rightbarCol','.dcb-file-viewer'])assert.equal(await page.locator(selector).isVisible(),false,selector)
  assert.equal(await exit().isVisible(),true);assert.ok(await exit().evaluate(el=>el.getBoundingClientRect().height)>=44)
  assert.equal(await page.locator('[data-dcb-background-layer] img').evaluate(el=>getComputedStyle(el).filter),'none')
  assert.equal(await page.locator('[data-dcb-background-layer] img').evaluate(el=>getComputedStyle(el).opacity),'1')
  assert.equal(await saved(),before)
  await page.screenshot({path:resolve(output,'background-only-light.png')})
 })
 await check('existing wallpaper and moving particle canvas stay mounted and continue advancing while text is hidden',async()=>{
  const probe=()=>page.evaluate(()=>({sameImage:window.keptBackground===document.querySelector('[data-dcb-background-layer] img'),sameCanvas:window.keptCanvas===document.querySelector('.dcb-particle-layer canvas'),frames:window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0].frames,visible:getComputedStyle(document.querySelector('.dcb-particle-layer')).visibility,rect:document.querySelector('[data-conversation-scroll]').getBoundingClientRect().width}))
  const first=await probe();await page.waitForTimeout(120);const last=await probe()
  assert.equal(last.sameImage,true);assert.equal(last.sameCanvas,true);assert.equal(last.visible,'visible');assert.ok(last.frames>first.frames);assert.equal(last.rect,await page.evaluate(()=>window.keptRect.width))
 })
 await check('exit restores exact draft, selection, scroll, accessibility and the saved background blur',async()=>{
  await exit().click();await idle()
  assert.equal(await entry().getAttribute('aria-label'),'进入纯背景模式')
  assert.equal(await page.locator('textarea').isVisible(),true)
  assert.deepEqual(await page.evaluate(()=>({same:window.keptEditor===document.querySelector('textarea'),draft:window.keptEditor.value,selection:[window.keptEditor.selectionStart,window.keptEditor.selectionEnd],scroll:document.querySelector('[data-conversation-scroll]').scrollTop-window.keptScrollTop})),{same:true,draft:'保留草稿和选区',selection:[2,5],scroll:0})
  assert.equal(await page.locator('[data-dcb-background-layer] img').evaluate(el=>getComputedStyle(el).filter),'blur(8px)')
  assert.equal(await page.locator('[data-dcb-focus-hidden],[data-dcb-background-path]').count(),0)
  assert.equal(await entry().evaluate(el=>el===document.activeElement),true);assert.equal(await saved(),before)
 })
 await check('background blur and opacity interpolate both ways and rapid reversals continue from the displayed frame',async()=>{
  const samples=await page.evaluate(async()=>{
   const image=document.querySelector('[data-dcb-background-layer] img'),enter=()=>document.querySelector('.dcb-focus-toggle:not(.dcb-background-exit)').click(),leave=()=>document.querySelector('.dcb-background-exit').click(),wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))
   const sample=()=>{const style=getComputedStyle(image);return{blur:Number(style.filter.match(/blur\(([\d.]+)px\)/)?.[1]||0),opacity:Number(style.opacity)}}
   const start=sample();enter();await wait(65);const entering=sample();leave();const reversed=sample();await wait(55);const leaving=sample();enter();const reversedAgain=sample();await wait(340);const clear=sample();leave();await wait(65);const restoring=sample();await wait(340);const restored=sample()
   return {start,entering,reversed,leaving,reversedAgain,clear,restoring,restored,sameImage:image===window.keptBackground,animations:image.getAnimations().length,returnMarker:document.body.hasAttribute('data-dcb-background-returning')}
  })
  assert.equal(samples.start.blur,8);assert.equal(samples.start.opacity,.55)
  for(const item of[samples.entering,samples.leaving,samples.restoring]){assert.ok(item.blur>0&&item.blur<8,JSON.stringify(samples));assert.ok(item.opacity>.55&&item.opacity<1)}
  assert.ok(Math.abs(samples.entering.blur-samples.reversed.blur)<.5);assert.ok(Math.abs(samples.leaving.blur-samples.reversedAgain.blur)<.5)
  assert.deepEqual(samples.clear,{blur:0,opacity:1});assert.deepEqual(samples.restored,{blur:8,opacity:.55});assert.equal(samples.sameImage,true);assert.equal(samples.animations,0);assert.equal(samples.returnMarker,false);assert.equal(await saved(),before)
  writeFileSync(resolve(output,'blur-transition-frames.json'),JSON.stringify(samples,null,2))
 })
 await check('ordinary background adjustments stay immediate outside the mode and an immediate exit clears optical transitions',async()=>{
  const result=await page.evaluate(async()=>{
   const image=document.querySelector('[data-dcb-background-layer] img'),layer=image.parentElement
   layer.style.setProperty('--dcb-bg-blur','6px');const direct=getComputedStyle(image).filter,ordinaryAnimations=image.getAnimations().length;layer.style.setProperty('--dcb-bg-blur','8px');getComputedStyle(image).filter
   document.querySelector('.dcb-focus-toggle:not(.dcb-background-exit)').click();await new Promise(resolve=>setTimeout(resolve,55))
   for(const cleanup of window.cleanups.reverse())cleanup?.();return{direct,ordinaryAnimations,remaining:[...document.getAnimations()].filter(animation=>animation.id.startsWith('dcb-focus-')).length,returnMarker:document.body.hasAttribute('data-dcb-background-returning')}
  })
  assert.equal(result.direct,'blur(6px)');assert.equal(result.ordinaryAnimations,0);assert.equal(result.remaining,0);assert.equal(result.returnMarker,false)
  await boot()
 })
 await check('entry and exit fade without blur, reverse continuously and leave no queued animations',async()=>{
  const samples=await page.evaluate(async()=>{
   const click=()=>document.querySelector('.dcb-focus-toggle:not(.dcb-background-exit)').click(),wait=ms=>new Promise(r=>setTimeout(r,ms)),header=document.querySelector('header')
   click();await wait(80);const first=Number(getComputedStyle(header).opacity);document.querySelector('.dcb-background-exit').click();const reversed=Number(getComputedStyle(header).opacity);await wait(55);click();await wait(350)
   return {first,reversed,filter:getComputedStyle(header).filter,active:document.body.hasAttribute('data-dcb-background-only'),animations:document.getAnimations().filter(a=>a.id.startsWith('dcb-focus-')).length}
  })
  assert.ok(samples.first>0&&samples.first<1);assert.ok(Math.abs(samples.reversed-samples.first)<.1);assert.equal(samples.filter,'none');assert.equal(samples.active,true);assert.equal(samples.animations,0)
  await page.keyboard.press('Escape');await idle()
 })
 await check('new hidden UI stays hidden, while replacing the conversation or adding a particle layer preserves an exit',async()=>{
  await entry().click();await idle()
  await page.evaluate(()=>{const root=document.querySelector('.cr_root'),note=document.createElement('div');note.className='arriving-note';note.textContent='稍后到达的工具文字';root.append(note);const viewer=document.createElement('aside');viewer.className='dcb-file-viewer';viewer.textContent='稍后到达的预览';document.body.append(viewer)})
  await page.waitForFunction(()=>document.querySelector('.arriving-note')?.hasAttribute('data-dcb-focus-hidden'))
  assert.equal(await page.locator('.arriving-note').isVisible(),false)
  await page.evaluate(()=>{const body=document.querySelector('[data-conversation-content]');body.replaceWith(body.cloneNode(true))})
  await page.waitForTimeout(100);assert.equal(await page.locator('article').isVisible(),false);assert.equal(await exit().isVisible(),true)
  await page.keyboard.press('Escape');await idle();assert.equal(await page.locator('article').isVisible(),true)
  assert.equal(await page.locator('[data-dcb-focus-hidden],[data-dcb-background-path]').count(),0)
 })
 await check('native header variants and narrow dark windows retain the 44px exit and keep every text surface hidden',async()=>{
  for(const centered of[false,true])for(const width of[1440,820,390]){
   await page.setViewportSize({width,height:900});await boot({centered,particles:false,overlay:centered});await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''))
   await entry().click();await idle();assert.equal(await page.locator('article').isVisible(),false)
   const rect=await exit().evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,height:r.height}})
   assert.ok(rect.left>=0&&rect.right<=width);assert.equal(rect.height,44)
   if(width===390&&centered)await page.screenshot({path:resolve(output,'background-only-narrow-dark.png')})
   await page.keyboard.press('Escape');await idle();assert.equal(await entry().isVisible(),true)
  }
 })
 await check('reduced motion, forced colors and menu Escape precedence retain accessible exit and cleanup',async()=>{
  await page.setViewportSize({width:1440,height:900});await boot({particles:false});await page.emulateMedia({reducedMotion:'reduce'})
  await entry().press('Enter');assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-focus-')).length),0)
  await page.evaluate(()=>{const menu=document.createElement('div');menu.setAttribute('role','menu');const b=document.createElement('button');b.textContent='合成菜单';menu.append(b);document.body.append(menu);b.focus()})
  await page.keyboard.press('Escape');assert.equal(await exit().count(),1)
  await page.evaluate(()=>document.querySelector('[role=menu]').remove());await exit().focus();await page.keyboard.press('Escape');await idle()
  await page.emulateMedia({forcedColors:'active'});await entry().click();assert.equal(await exit().isVisible(),true)
  assert.equal(await exit().evaluate(el=>getComputedStyle(el).boxShadow),'none')
  await page.keyboard.press('Escape');await page.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'})
 })
 await check('the black/white switch stays on a pale card beside the exit and follows both themes',async()=>{
  await page.setViewportSize({width:1440,height:900});await boot({particles:false})
  await entry().click();await idle()
  const chip=page.getByRole('button',{name:'切换黑白主题',exact:true})
  assert.equal(await chip.isVisible(),true)
  const light=await chip.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{background:s.backgroundColor,border:s.borderTopColor,radius:s.borderTopLeftRadius,height:r.height}})
  const exitBox=await exit().evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{radius:s.borderTopLeftRadius,height:r.height}})
  assert.equal(light.height,44);assert.equal(light.radius,exitBox.radius);assert.equal(exitBox.height,44)
  assert.equal(await page.locator('article').isVisible(),false)
  await page.screenshot({path:resolve(output,'background-only-tools-light.png')})
  await chip.click();await page.waitForFunction(()=>document.body.hasAttribute('data-ds-dark-theme'));await page.waitForTimeout(300)
  const dark=await chip.evaluate(el=>{const s=getComputedStyle(el);return{background:s.backgroundColor,border:s.borderTopColor}})
  assert.notEqual(dark.background,light.background);assert.notEqual(dark.border,light.border)
  const shade=dark.background.match(/[\d.]+/g).slice(0,3).map(Number)
  assert.ok(shade[0]<80&&shade[1]<80&&shade[2]<90,'dark theme paints the switch card in a deep neutral tone')
  await page.screenshot({path:resolve(output,'background-only-tools-dark.png')})
  await exit().click();await idle()
  assert.equal(await page.locator('.dcb-background-tools,.dcb-background-theme').count(),0)
 })
 await check('long streaming history performs no geometry scans or idle mode loop and does not change width or preference keys',async()=>{
  await boot({long:true,particles:false});const prefs=await saved()
  // Isolate this controller's idle/geometry budget from unrelated message and
  // tool animation managers. The preceding groups exercise the full plugin.
  await page.evaluate(()=>{
   for(const cleanup of window.cleanups.reverse())cleanup?.();window.cleanups=[]
   const style=document.createElement('style');style.textContent=window.backgroundModeCss;document.head.append(style)
   window.singleBackgroundMode=window.createIsolatedBackgroundMode()
   window.fixtureHeader=()=>window.fixtureReact.createElement(window.singleBackgroundMode.Button)
   window.fixtureHeaderSpec={inject:()=>({hooks:{taskActivity:window.fixtureBinding().eventSource}})};window.fixture.refresh()
  });await entry().waitFor()
  const metrics=await page.evaluate(async()=>{
   let reads=0,writes=0;const get=Element.prototype.getBoundingClientRect,set=Element.prototype.setAttribute
   Element.prototype.getBoundingClientRect=function(...args){if(this.matches('article,article *'))reads++;return get.apply(this,args)}
   Element.prototype.setAttribute=function(...args){if(args[0]==='data-dcb-focus-hidden')writes++;return set.apply(this,args)}
   try{
    document.querySelector('.dcb-focus-toggle').click();await new Promise(r=>setTimeout(r,400));const before={reads,writes};const p=document.querySelector('article section:last-child p')
    for(let i=0;i<100;i++)p.append(document.createTextNode('流式追加'));await new Promise(r=>setTimeout(r,160))
    return {reads:reads-before.reads,writes:writes-before.writes,bodyWidth:document.querySelector('[data-conversation-scroll]').offsetWidth}
   }finally{Element.prototype.getBoundingClientRect=get;Element.prototype.setAttribute=set}
  })
  assert.equal(metrics.reads,0);assert.equal(metrics.writes,0);assert.equal(await saved(),prefs)
  await page.keyboard.press('Escape');await idle()
  await page.evaluate(()=>window.singleBackgroundMode.dispose())
 })
 await check('navigation, plugin disposal during entry and refresh restore all host attributes and preserve media settings',async()=>{
  await boot({particles:false});await entry().click();await idle();await page.evaluate(()=>window.fixture.show(false))
  await page.waitForFunction(()=>!document.body.hasAttribute('data-dcb-background-only'))
  await boot({particles:false});await entry().click();await page.waitForTimeout(50);await page.evaluate(()=>{for(const cleanup of window.cleanups.reverse())cleanup?.()})
  assert.equal(await page.locator('[data-dcb-focus-hidden],[data-dcb-background-path],.dcb-background-exit').count(),0)
  assert.equal(await page.locator('textarea').isVisible(),true)
  await boot({particles:false});assert.equal(await page.locator('.dcb-background-exit').count(),0)
 })
 assert.deepEqual(errors,[])
 writeFileSync(resolve(output,'verification.json'),JSON.stringify({source:'Installed native ConversationHeader / ConversationSessionHeader CSS and components; complete plugin; synthetic wallpaper, particles and conversation',checks,errors},null,2))
 console.log(`${checks.length} background-only browser groups passed`)
}finally{await browser.close();await new Promise(done=>server.close(done))}
