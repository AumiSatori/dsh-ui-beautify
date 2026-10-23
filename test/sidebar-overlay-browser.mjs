import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {createServer} from 'node:http'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeShell} from './native-shell.mjs'
import {nativeLogo,installLogoFixture} from './native-logo.mjs'
import {selectSettingsCategory} from './settings-navigation.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','.scratch','claude-beautify'),'sidebar-overlay'),native=nativeShell(),logo=nativeLogo()
mkdirSync(output,{recursive:true})
const demo=`import React from 'react';import*as jsxRuntime from'react/jsx-runtime';import{createRoot}from'react-dom/client';import{createFocusMode}from'./src/focus-mode.js';
const react=React,react_jsx_runtime=jsxRuntime,clsx=(...values)=>values.flat().filter(Boolean).join(' '),localBuildVersion=()=> 'test';
const _deepseek_ai_dsh_client_ui_primitives=new Proxy({Tooltip:({children})=>children,isDarwinDesktop:()=>document.documentElement.dataset.platform==='darwin'},{get:(obj,key)=>obj[key]||(({className})=><svg width="16" height="16" className={className}><rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor"/></svg>)});
${native.code}
window.fixtureReact=React;window.cleanups=[];const focus=createFocusMode(React,document,window);window.cleanups.push(()=>focus.dispose());
function Demo(){
 const [layout,setLayout]=React.useState({viewportWidth:1440,sidebar:280,rightbar:380,rightbarShown:false,rightbarTrack:false,rightbarFullscreen:false,rightbarInstant:false,narrowExpanded:false});
 const [settings,setSettings]=React.useState(false),[globalPanel,setGlobalPanel]=React.useState(false),[generation,setGeneration]=React.useState(0),[,refresh]=React.useReducer(n=>n+1,0);
 const actions=React.useMemo(()=>({setViewportWidth:value=>setLayout(old=>old.viewportWidth===value?old:{...old,viewportWidth:value}),setSidebar:value=>setLayout(old=>({...old,sidebar:Math.max(264,Math.min(420,value))})),setRightbar:value=>setLayout(old=>({...old,rightbar:Math.max(300,value)}))}),[]);
 const left=()=>setLayout(old=>old.viewportWidth<1024?{...old,narrowExpanded:!old.narrowExpanded}:{...old,sidebar:old.sidebar===0?280:0});
 const right=()=>setLayout(old=>({...old,rightbarShown:!old.rightbarShown,rightbarTrack:!old.rightbarTrack}));
 window.fixture={left,right,settings:setSettings,refresh,panel:setGlobalPanel,remount:()=>setGeneration(n=>n+1),layout:()=>layout,fullscreen:value=>setLayout(old=>({...old,rightbarFullscreen:value})),instant:value=>setLayout(old=>({...old,rightbarInstant:value}))};
 const renderSlot=(name,props)=>{
  if(name==='sidebar')return <SidebarRoot {...props} toggleSidebar={left} startSession={()=>{}} selectPanel={()=>{}} usePanels={()=>[]} useShortcuts={()=>[]} usePanelInfo={selector=>selector({activePanelId:null})} t={key=>key==='toggle.open'?'打开左侧栏':key==='toggle.collapse'?'收起左侧栏':key} renderSlot={(slot)=>slot==='sidebar.sessions'?<div style={{height:'100%',overflow:'auto'}}>{Array.from({length:40},(_,i)=><button className="sb_sessionRow" key={i}>会话 {i+1}</button>)}</div>:null}/>;
  if(name==='main')return globalPanel?<div data-testid="global-panel">插件页面</div>:<main className="cr_root" data-phase="active"><header><strong>覆盖侧栏 · 正文保持原位</strong><span><focus.Button/><button aria-label="切换右侧栏" onClick={right}>右侧栏</button><button onClick={()=>setSettings(true)}>设置</button></span></header><div className="cr_body" data-conversation-content="" data-conversation-session="demo"><div data-conversation-scroll="" className="chat-scroll"><article data-chat-flow="">{Array.from({length:180},(_,i)=><p key={i} className="message">演示消息 {i+1}：左右侧栏覆盖主屏幕，正文宽度、滚动位置和输入草稿不会随开合改变。保留真实控件和粒子画布。</p>)}</article></div><div data-composer-seat="" className="composer"><textarea aria-label="输入草稿" defaultValue="保留输入草稿和选区"/></div></div></main>;
  if(name==='rightbar')return <div className="rb_panel" data-sidebar-right-panel={layout.rightbarFullscreen?'fullscreen':'push'} data-sidebar-right-open={layout.rightbarShown||undefined} style={{width:layout.rightbarFullscreen?'100vw':props.width,'--dsh-sidebar-width':props.width+'px'}}><div data-dockkit-empty="" className="right-content"><button aria-label="收起右侧栏" onClick={right}>关闭右侧栏</button><h2>原生右侧面板</h2><input aria-label="右侧草稿" defaultValue="保留文件面板状态"/></div></div>;
  if(name==='shell.bottom')return <div className="bottom">原生底栏</div>;
  if(name==='shell.overlay'&&settings&&window.fixtureSettings)return <div className="settings-dialog" role="dialog"><button aria-label="关闭设置" onClick={()=>setSettings(false)}>×</button><window.fixtureSettings/></div>;
  return null;
 };
 return <AppFrame key={generation} useStore={selector=>selector({layoutInfo:layout})} useSessions={selector=>selector({byId:{}})} usePanelInfo={selector=>selector({activePanelId:null})} actions={actions} renderSlot={renderSlot} t={key=>key}/>;
}
createRoot(document.getElementById('root')).render(<Demo/>);`
const built=await build({stdin:{contents:demo,loader:'jsx',resolveDir:project},bundle:true,write:false,format:'iife'})
const html=`<!doctype html><html data-windows-titlebar><meta charset="utf-8"><style>${native.css}
:root{--dsh-windows-titlebar-height:40px;--dsw-alias-bg-base:#fff;--dsw-specific-sidebar-fill:#f5f6f8;--dsw-alias-label-primary:#23262c;--dsw-alias-label-secondary:#6a707c;--dsw-alias-border-l3:#ccd1da;--ds-transition-duration-slow:320ms;--ds-ease-in-out:ease-in-out}*{box-sizing:border-box}html,body,#root{height:100%;margin:0;font:14px system-ui}.cr_root{display:flex;flex-direction:column;min-height:0;height:100%}header{display:flex;justify-content:space-between;align-items:center;min-height:64px;padding:12px 28px;border-bottom:1px solid #ddd;gap:12px}header>span{display:flex;align-items:center;gap:8px}button{cursor:pointer;font:inherit}.cr_body{position:relative;display:flex;flex-direction:column;flex:1;min-height:0}.chat-scroll{flex:1;overflow:auto;min-height:0;overflow-anchor:none}article{max-width:980px;width:calc(100% - 64px);margin:auto;padding:24px 0}.message{line-height:1.9;margin:0 0 14px}.composer{flex:none;padding:14px 28px 20px}textarea{width:100%;height:86px;resize:none;padding:15px;border-radius:16px;border:1px solid #bbb;background:#fff;color:inherit;font:inherit}.sb_sessionRow{display:block;width:100%;height:38px;border:0;background:transparent;text-align:left}.bottom{height:26px;padding:3px 20px}.right-content{height:100%;background:#f3f5f9;padding:20px;pointer-events:auto;border-left:1px solid #ccc}.settings-dialog{position:fixed;inset:40px 10%;background:white;overflow:auto;border-radius:14px;padding:24px;box-shadow:0 8px 80px #0004;pointer-events:auto}.settings-dialog>button{position:absolute;right:10px;top:10px}body[data-ds-dark-theme]{--dsw-alias-bg-base:#202226;--dsw-specific-sidebar-fill:#272a30;--dsw-alias-label-primary:#eee;--dsw-alias-label-secondary:#ccc;color:#eee}body[data-ds-dark-theme] :is(textarea,.right-content,.settings-dialog){background:#272a30;color:#eee}.af_sidebarCol{background:var(--dsw-specific-sidebar-fill)}
</style><div id="root"></div><script src="/demo.js"></script></html>`
const routes={'/':['text/html; charset=utf-8',html],'/demo.js':['text/javascript',built.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[new URL(req.url,'http://localhost').pathname];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-claude-beautify:settings:v1',browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],checks=[]
page.on('pageerror',error=>errors.push(error.message))
async function mount(overlay=true){
 await page.goto(url);await page.locator('.sb_toggle').waitFor();await page.evaluate(installLogoFixture,logo)
 await page.evaluate(()=>{window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:window.fixtureFishLogo,FISH_LOGO_PATH:window.nativeLogo.path,FISH_LOGO_VIEWBOX:window.nativeLogo}:window.fixtureReact)}})
 await page.addScriptTag({url:url+'/client.js'})
 await page.evaluate(()=>{const ctx={slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;return()=>{}}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
 await page.waitForFunction(overlay=>!!document.querySelector('[data-dcb-sidebar-overlay]')===overlay,overlay)
 await page.waitForFunction(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0]?.ready)
 await page.waitForTimeout(150)
}
const geometry=()=>page.evaluate(()=>{const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return [r.left,r.top,r.width,r.height]};return{center:box('.af_centerCol'),message:box('.message'),input:box('textarea'),scroll:document.querySelector('[data-conversation-scroll]').scrollTop}})
async function sample(action){
 const baseline=await geometry()
 await page.evaluate(()=>{window.overlaySamples=[];window.overlaySampling=true;const take=()=>{if(!window.overlaySampling)return;const r=document.querySelector('.af_centerCol').getBoundingClientRect(),m=document.querySelector('.message').getBoundingClientRect(),i=document.querySelector('textarea').getBoundingClientRect();window.overlaySamples.push([r.left,r.width,m.left,m.width,i.left,i.width,document.querySelector('[data-conversation-scroll]').scrollTop]);requestAnimationFrame(take)};take()})
 await action();await page.waitForTimeout(420)
 const values=await page.evaluate(()=>{window.overlaySampling=false;return window.overlaySamples})
 const expected=[baseline.center[0],baseline.center[2],baseline.message[0],baseline.message[2],baseline.input[0],baseline.input[2],baseline.scroll]
 for(const frame of values)for(let i=0;i<expected.length;i++)assert.ok(Math.abs(frame[i]-expected[i])<.6,`layout moved at ${i}: ${frame[i]} vs ${expected[i]}`)
 assert.equal(await page.evaluate(()=>window.overlayCanvas===document.querySelector('.dcb-particle-layer canvas')),true)
}
async function patch(value){await page.evaluate(({key,value})=>{const next=JSON.stringify({...JSON.parse(localStorage.getItem(key)),...value});localStorage.setItem(key,next);window.dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},{key,value});await page.waitForTimeout(100)}
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
try{
 await page.addInitScript(key=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleProgressMode:'manual',particleManualProgress:65}))},key)
 await mount()
 await page.evaluate(()=>{window.overlayCanvas=document.querySelector('.dcb-particle-layer canvas');window.overlayEditor=document.querySelector('textarea');window.overlayMessage=document.querySelector('.message');document.querySelector('[data-conversation-scroll]').scrollTop=900;window.overlayEditor.focus();window.overlayEditor.setSelectionRange(2,7)})
 await check('native left and right toggles overlay the chat without changing any sampled message or editor geometry',async()=>{
  await sample(()=>page.locator('.sb_toggle').click())
  assert.equal(await page.locator('.sb_toggle').isVisible(),true,'the fixed Windows toggle stays usable with a zero-width column')
  await sample(()=>page.locator('.sb_toggle').click())
  await sample(()=>page.getByRole('button',{name:'切换右侧栏',exact:true}).click())
  await sample(()=>page.getByRole('button',{name:'收起右侧栏',exact:true}).click())
  await page.screenshot({path:resolve(output,'left-overlay.png')})
  await sample(()=>page.getByRole('button',{name:'切换右侧栏',exact:true}).click())
  await page.screenshot({path:resolve(output,'both-overlays.png')})
  const hit=await page.evaluate(()=>{const el=document.querySelector('.right-content'),r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.right-30,r.top+80))});assert.equal(hit,true,'right panel receives input above the chat')
  assert.equal(await page.evaluate(()=>document.querySelector('textarea')===window.overlayEditor&&document.querySelector('.message')===window.overlayMessage),true)
  assert.equal(await page.locator('textarea').inputValue(),'保留输入草稿和选区')
 })
 await check('native drag handles resize either drawer while the chat and particle canvas stay fixed',async()=>{
  await sample(async()=>{const handle=page.locator('[data-side=sidebar]'),r=await handle.boundingBox();await page.mouse.move(r.x+4,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+74,r.y+r.height/2,{steps:8});await page.mouse.up()})
  assert.ok((await page.locator('.sb_root').boundingBox()).width>=330)
  await sample(async()=>{const handle=page.locator('[data-side=rightbar]'),r=await handle.boundingBox();await page.mouse.move(r.x+4,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x-76,r.y+r.height/2,{steps:8});await page.mouse.up()})
  assert.ok((await page.locator('.rb_panel').boundingBox()).width>=440)
 })
 await check('the accessible setting restores native push layout, retains host state and persists across refresh',async()=>{
  await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'侧栏')
  const toggle=page.getByRole('switch',{name:'侧栏覆盖主屏幕',exact:true});assert.equal(await toggle.getAttribute('aria-checked'),'true')
  await toggle.click();await page.waitForTimeout(450)
  assert.equal(await page.locator('[data-dcb-sidebar-overlay]').count(),0)
  assert.ok((await geometry()).center[2]<1000)
  assert.equal(await page.getByRole('textbox',{name:'右侧草稿'}).inputValue(),'保留文件面板状态')
  await page.reload();await mount(false)
  await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'侧栏')
  assert.equal(await toggle.getAttribute('aria-checked'),'false','an explicit native-layout choice survives reload')
  await toggle.click();await page.waitForTimeout(120)
  assert.equal((await geometry()).center[2],1440)
  await page.getByRole('button',{name:'关闭设置',exact:true}).click()
  await page.reload();await mount();assert.equal(await page.locator('[data-dcb-sidebar-overlay]').count(),1)
  await page.evaluate(()=>{window.overlayCanvas=document.querySelector('.dcb-particle-layer canvas');document.querySelector('[data-conversation-scroll]').scrollTop=900})
 })
 await check('focus mode, fullscreen right panel, dark narrow layout and motion preferences preserve native controls',async()=>{
  await page.getByRole('button',{name:'进入专注模式',exact:true}).click();await page.waitForTimeout(600)
  assert.equal(await page.locator('textarea').isVisible(),false)
  await page.keyboard.press('Escape');await page.waitForTimeout(600);assert.equal(await page.locator('textarea').isVisible(),true)
  await sample(()=>page.locator('.sb_toggle').click())
  await page.evaluate(()=>window.fixture.fullscreen(true));await page.waitForTimeout(100);assert.equal((await geometry()).center[2],1440)
  await page.evaluate(()=>window.fixture.fullscreen(false));await page.setViewportSize({width:760,height:980});await page.waitForTimeout(200)
  await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.emulateMedia({reducedMotion:'reduce'})
  await sample(()=>page.locator('.sb_toggle').click());await page.screenshot({path:resolve(output,'narrow-dark-overlay.png')})
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
 })
 await check('ordinary web windows retain a fixed compact rail while their drawers open over the chat',async()=>{
  await page.evaluate(()=>{document.documentElement.removeAttribute('data-windows-titlebar');window.fixture.refresh()});await page.waitForTimeout(180)
  assert.equal((await page.locator('.af_centerCol').boundingBox()).width,704)
  await sample(()=>page.locator('.sb_toggle').click())
  assert.equal(await page.locator('.sb_toggle').isVisible(),true)
  await sample(()=>page.locator('.sb_toggle').click())
  await page.evaluate(()=>{document.documentElement.setAttribute('data-windows-titlebar','');window.fixture.refresh()});await page.waitForTimeout(180)
 })
 await check('remount, global panel changes and uninstall restore native layout without leaving marks or variables',async()=>{
  await page.evaluate(()=>window.fixture.panel(true));await page.getByTestId('global-panel').waitFor();assert.equal((await page.locator('.af_centerCol').boundingBox()).width,760)
  await page.evaluate(()=>window.fixture.panel(false));await page.locator('textarea').waitFor()
  await page.evaluate(()=>{window.previousOverlayFrame=document.querySelector('.af_frame');window.fixture.remount()})
  await page.waitForFunction(()=>document.querySelector('.af_frame')!==window.previousOverlayFrame&&document.querySelector('[data-dcb-sidebar-overlay]'))
  assert.equal(await page.evaluate(()=>window.previousOverlayFrame.hasAttribute('data-dcb-sidebar-overlay')),false,'detached frames release their presentation markers')
  await page.emulateMedia({forcedColors:'active'});await page.waitForTimeout(80)
  assert.equal((await page.locator('.af_centerCol').boundingBox()).width,760)
  await page.evaluate(()=>{for(const cleanup of window.cleanups.reverse())if(typeof cleanup==='function')cleanup()})
  assert.equal(await page.locator('[data-dcb-sidebar-overlay],[data-dcb-sidebar-overlay-part]').count(),0)
  assert.equal(await page.locator('.af_frame').evaluate(el=>[...el.style].filter(name=>name.startsWith('--dcb-overlay-')).length),0)
  assert.ok((await geometry()).center[2]<760)
  assert.deepEqual(errors,[])
 })
 writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors,native:'Installed AppFrame / SidebarRoot React components and SidebarRight CSS; synthetic panel content'},null,2));console.log(JSON.stringify({checks,output},null,2))
}finally{await browser.close();await new Promise(done=>server.close(done))}
