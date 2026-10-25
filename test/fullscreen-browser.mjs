import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeShell} from './native-shell.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','claude-beautify'),'fullscreen'),native=nativeShell()
mkdirSync(output,{recursive:true})
const code=`import React from 'react';import*as jsxRuntime from'react/jsx-runtime';import{createRoot}from'react-dom/client';
import{createFullscreenControls,fullscreenControlsCss}from'./src/fullscreen-controls.js';import{createSidebarGlass}from'./src/sidebar-glass.js';import{createSidebarOverlay,sidebarOverlayCss}from'./src/sidebar-overlay.js';import{createHeaderLayout,headerLayoutCss}from'./src/header-layout.js';
const react=React,react_jsx_runtime=jsxRuntime,clsx=(...values)=>values.flat().filter(Boolean).join(' '),localBuildVersion=()=>undefined,conversationPhase=()=> 'active';
const _deepseek_ai_dsh_client_ui_primitives=new Proxy({Tooltip:({children})=>children,isDarwinDesktop:()=>false,ShortcutKeys:({keys})=><span className="shortcut-keys">{keys.map((key,i)=><kbd key={i}>{key}</kbd>)}</span>},{get:(obj,key)=>obj[key]||(({className,size=18})=><svg viewBox="0 0 24 24" width={size} height={size} className={className}><rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor"/><path d="M9 4v16" stroke="currentColor"/></svg>)});
${native.code}
const sheet=document.createElement('style');sheet.textContent=fullscreenControlsCss+sidebarOverlayCss+headerLayoutCss;document.head.append(sheet);
const fullscreen=createFullscreenControls(document,window),glass=createSidebarGlass(document,window,()=>{}),overlay=createSidebarOverlay(document,window,()=>{}),header=createHeaderLayout(document,window);window.fullscreenManager=fullscreen;
function Demo(){
 const[layout,setLayout]=React.useState({viewportWidth:1440,sidebar:280,rightbar:380,rightbarShown:false,rightbarTrack:false,rightbarFullscreen:false,rightbarInstant:false,narrowExpanded:false}),[generation,remount]=React.useState(0);
 const left=()=>setLayout(old=>({...old,sidebar:old.sidebar===0?280:0}));
 const actions=React.useMemo(()=>({setViewportWidth:value=>setLayout(old=>old.viewportWidth===value?old:{...old,viewportWidth:value}),setSidebar:value=>setLayout(old=>({...old,sidebar:value})),setRightbar:()=>{}}),[]);
 React.useLayoutEffect(()=>{overlay.sync(true,true);glass.sync('css',true);header.sync(true);fullscreen.sync()},[layout,generation]);
 window.testFixture={left,remount:()=>remount(n=>n+1),dispose:()=>{fullscreen.dispose();glass.dispose();overlay.dispose();header.dispose()},sync:()=>fullscreen.sync()};
 const renderSlot=(name,props)=>{
  if(name==='sidebar')return <SidebarRoot {...props} toggleSidebar={left} startSession={()=>window.newSessions++} selectPanel={()=>{}} useEntryPins={()=>[]} useEntryActions={()=>false} trackEntryClick={()=>{}} usePanels={()=>[]} useShortcuts={selector=>selector([{id:'session.new',keys:['Ctrl','+','Alt','+','N'],aria:'Control+Alt+N'}])} usePanelInfo={selector=>selector({activePanelId:null})} t={key=>key==='toggle.open'?'打开侧栏':key==='toggle.collapse'?'收起侧栏':key==='session.new.label'?'新会话':key} renderSlot={()=>null}/>;
  if(name==='main')return <main className="cr_root" data-phase="active"><header className="cr_header"><div data-conversation-header-leading="" className="cr_headerLeading"></div><div className="cr_titleRow"><div className="cr_headerTitle"><h1>全屏交互验证</h1></div><div className="cr_headerUtilities"><button>主题</button></div><div className="cr_headerCorner"><button aria-label="右侧栏">▥</button></div></div><nav data-conversation-tabs=""><button>对话</button><button>轨迹</button><button>上下文</button></nav></header><section className="cr_body" data-conversation-content=""><div data-conversation-scroll=""><article data-chat-flow=""><p>演示内容：进入全屏时保留正文、输入和原生侧栏。</p><button id="preview" onClick={()=>document.querySelector('article').requestFullscreen()}>产物全屏</button></article></div><div data-composer-seat=""><textarea aria-label="输入草稿" defaultValue="演示草稿，不发送"/></div></section></main>;
  return null;
 };
 return <AppFrame key={generation} useStore={selector=>selector({layoutInfo:layout})} useSessions={selector=>selector({byId:{}})} usePanelInfo={selector=>selector({activePanelId:null})} actions={actions} renderSlot={renderSlot} t={key=>key}/>;
}
window.newSessions=0;createRoot(document.getElementById('root')).render(<Demo/>);`
const built=await build({stdin:{contents:code,loader:'jsx',resolveDir:project},bundle:true,write:false,format:'iife'})
const html=`<!doctype html><html data-windows-titlebar><meta charset="utf-8"><style>${native.css}
:root{--dsh-windows-titlebar-height:40px;--dsw-alias-bg-base:#fff;--dsw-specific-sidebar-fill:#f6f7f9;--dsw-alias-label-primary:#24272d;--dsw-alias-label-secondary:#676c76;--dsw-alias-border-l3:#dedfe5;--ds-transition-duration-slow:300ms;--ds-ease-in-out:ease;--dsw-radius-sm:8px;--dsw-radius-md:12px}*{box-sizing:border-box}html,body,#root{height:100%;margin:0;color:var(--dsw-alias-label-primary);font:14px/1.8 system-ui}button{font:inherit;color:inherit}header button{border:0;background:transparent;border-radius:8px}h1{font-size:15px;margin:0}.cr_titleRow{display:flex;align-items:center;min-height:32px;grid-area:1/2}.cr_headerTitle{flex:1;min-width:0}.cr_root{height:100%;display:flex;flex-direction:column;min-height:0}.cr_body{flex:1;min-height:0;display:flex;flex-direction:column;--dsh-chat-content-width:760px}.cr_header nav{display:flex;gap:20px;grid-area:2/2;height:34px}.cr_body [data-conversation-scroll]{flex:1;min-height:0;overflow:auto}article{width:min(760px,calc(100% - 64px));margin:36px auto}textarea{width:calc(100% - 40px);height:110px;margin:20px;border:1px solid #bbb;border-radius:18px;padding:18px;background:var(--dsw-alias-bg-base);color:inherit}body[data-ds-dark-theme]{--dsw-alias-bg-base:#15171b;--dsw-specific-sidebar-fill:#1d2027;--dsw-alias-label-primary:#eee;--dsw-alias-label-secondary:#bbb;--dsw-alias-border-l3:#3d424b;background:#15171b}[data-windows-menu]{position:fixed;top:0;left:48px;height:40px;z-index:1100;padding:8px}article:fullscreen{background:var(--dsw-alias-bg-base)}
</style><div data-windows-menu>应用　编辑</div><div id="root"></div><script src="/fixture.js"></script></html>`
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/fixture.js'?'text/javascript':'text/html; charset=utf-8');res.end(req.url==='/fixture.js'?built.outputFiles[0].text:html)})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:980}}),checks=[],errors=[]
page.on('pageerror',error=>errors.push(error.message))
const editor=page.getByRole('textbox',{name:'输入草稿'}),toggle=page.locator('button.sb_toggle'),exit=page.getByRole('button',{name:'退出全屏',exact:true})
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
async function settled(){await page.waitForTimeout(560);await page.evaluate(()=>window.testFixture.sync())}
async function pressUntilFullscreen(){for(let i=0;i<3;i++){if(await page.evaluate(()=>document.documentElement.hasAttribute('data-dcb-fullscreen')))return;await page.keyboard.press('F11');await page.waitForTimeout(200)}}
async function bounds(){return page.evaluate(()=>{const box=n=>{if(!n)return null;const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}};return{toggle:box(document.querySelector('[data-dcb-fullscreen-toggle]')),fresh:box(document.querySelector('[data-dcb-fullscreen-new]')),exit:box(document.querySelector('.dcb-fullscreen-exit')),menu:getComputedStyle(document.querySelector('[data-windows-menu]')).display,title:box(document.querySelector('h1')),frameTop:document.querySelector('.af_frame').getBoundingClientRect().top,fullscreen:document.fullscreenElement?.tagName,mark:document.documentElement.hasAttribute('data-dcb-fullscreen')}})}
async function centeredNewIcon(){
 const geometry=await page.locator('[data-dcb-fullscreen-new]').evaluate(button=>{const icon=button.querySelector('svg'),r=button.getBoundingClientRect(),s=icon.getBoundingClientRect(),shortcut=button.querySelector('.sb_newSessionShortcut');return{dx:s.x+s.width/2-r.x-r.width/2,dy:s.y+s.height/2-r.y-r.height/2,shortcut:shortcut?getComputedStyle(shortcut).display:null,masked:getComputedStyle(button.querySelector('.sb_newSessionLabelMask')).maskImage}})
 assert.ok(Math.abs(geometry.dx)<.5&&Math.abs(geometry.dy)<.5,JSON.stringify(geometry));assert.equal(geometry.shortcut,'none');assert.equal(geometry.masked,'none')
}
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await toggle.waitFor()
 await check('F11 enters document fullscreen, clears desktop caption and keeps the editor draft and focus',async()=>{
 await editor.focus();await editor.evaluate(el=>el.setSelectionRange(2,4));await page.keyboard.press('F11');await page.waitForSelector('html[data-dcb-fullscreen]');await settled();const b=await bounds(),pill=await page.locator('.sb_root').evaluate(el=>{const s=getComputedStyle(el,'::after');return{left:s.left,top:s.top,width:s.width,height:s.height,radius:s.borderRadius}});assert.deepEqual(pill,{left:'8px',top:'6px',width:'110px',height:'38px',radius:'15px'});assert.equal(b.fullscreen,'HTML');assert.equal(b.menu,'none');assert.equal(b.toggle.w,30);assert.equal(b.toggle.x,12);assert.equal(b.toggle.y,10);assert.equal(b.fresh.x,48);assert.equal(b.exit.x,84);assert.equal(b.exit.y,10);assert.ok(b.exit.x>=b.toggle.x+b.toggle.w);assert.equal(await page.locator('[data-dcb-fullscreen-new] :is([class*="_newSessionLabel "],[class*=" _newSessionLabel"])').count(),1);assert.equal(await page.locator('[data-dcb-fullscreen-new] :is([class*="_newSessionLabel "],[class*=" _newSessionLabel"])').evaluate(el=>getComputedStyle(el).display),'none');assert.equal(await editor.inputValue(),'演示草稿，不发送');assert.equal(await editor.evaluate(el=>document.activeElement===el),true);assert.equal(await editor.evaluate(el=>el.selectionStart),2)
  await page.screenshot({path:resolve(output,'fullscreen-light.png')})
 })
 await check('expanded native new-session shortcut never displaces the icon on hover or keyboard focus',async()=>{
  assert.equal(await page.locator('.sb_newSessionShortcut').count(),1);await centeredNewIcon();await page.locator('[data-dcb-fullscreen-new]').hover();await centeredNewIcon();await page.locator('[data-dcb-fullscreen-new]').focus();await centeredNewIcon();await page.screenshot({path:resolve(output,'fullscreen-shortcut-hover.png')})
 })
 await check('native sidebar collapse and rapid reversal leave one aligned control group',async()=>{
  await toggle.click();await settled();let b=await bounds();assert.equal(b.fresh.w,30);assert.ok(b.fresh.x>=b.toggle.x+b.toggle.w);assert.ok(b.exit.x>=b.fresh.x+b.fresh.w);assert.ok(b.title.x>=b.exit.x+b.exit.w);assert.equal(await exit.count(),1)
  await toggle.click();await page.waitForTimeout(100);await toggle.click();await settled();b=await bounds();assert.ok(b.fresh);await page.screenshot({path:resolve(output,'fullscreen-collapsed.png')})
 })
 await check('new-session retains its native action; sidebar remount preserves fullscreen controls without duplicates',async()=>{
  await page.locator('[data-dcb-fullscreen-new]').click();assert.equal(await page.evaluate(()=>window.newSessions),1);await page.evaluate(()=>window.testFixture.remount());await settled();assert.equal(await page.locator('[data-dcb-fullscreen-toggle]').count(),1);assert.equal(await exit.count(),1)
 })
 await check('F11 exits and restores the original titlebar and native geometry',async()=>{
  await editor.focus();await page.keyboard.press('F11');await page.waitForFunction(()=>!document.fullscreenElement);await settled();assert.equal(await page.locator('[data-dcb-fullscreen]').count(),0);assert.equal(await exit.count(),0);assert.notEqual((await bounds()).menu,'none');assert.equal(await toggle.evaluate(el=>el.getBoundingClientRect().height),28);assert.equal(await editor.inputValue(),'演示草稿，不发送')
  if(await page.locator('.sb_root.sb_collapsed').count()){await toggle.click();await settled()}
  assert.equal(await page.locator('.sb_newSessionShortcut').evaluate(el=>getComputedStyle(el).display),'flex');assert.equal(await page.locator('button.sb_newSession').getAttribute('aria-keyshortcuts'),'Control+Alt+N')
 })
 await check('modified F11 is ignored; repeats and pending requests do not toggle back',async()=>{
  await page.keyboard.press('Shift+F11');assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false);await page.keyboard.down('F11');await page.keyboard.down('F11');await page.keyboard.up('F11');await page.waitForSelector('html[data-dcb-fullscreen]');assert.equal(await exit.count(),1)
 })
 await check('dark theme, keyboard focus, reduced motion and forced colors remain legible',async()=>{
  await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.emulateMedia({reducedMotion:'reduce'});await exit.focus();assert.equal(await exit.evaluate(el=>getComputedStyle(el).transitionDuration),'0s');await page.screenshot({path:resolve(output,'fullscreen-dark.png')});await page.emulateMedia({forcedColors:'active'});assert.equal(await page.locator('.dcb-fullscreen-tools').evaluate(el=>getComputedStyle(el).boxShadow),'none');await page.screenshot({path:resolve(output,'fullscreen-forced-colors.png')});await page.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'})
 })
 await check('exit button leaves fullscreen and returns keyboard focus',async()=>{
  await exit.click();await page.waitForFunction(()=>!document.fullscreenElement);assert.equal(await exit.count(),0);assert.equal(await editor.inputValue(),'演示草稿，不发送')
 })
 await check('narrow fullscreen keeps all three left controls reachable without horizontal overflow',async()=>{
  await page.setViewportSize({width:520,height:850});await page.keyboard.press('F11');await page.waitForSelector('html[data-dcb-fullscreen]');await settled();const b=await bounds();assert.equal(b.toggle.w,30);assert.ok(b.exit.x+b.exit.w<=120);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:resolve(output,'fullscreen-narrow.png')});await exit.click();await page.waitForFunction(()=>!document.fullscreenElement);await page.setViewportSize({width:1440,height:980});await settled()
 })
 await check('Artifact-owned fullscreen is preserved instead of receiving app chrome',async()=>{
  await page.locator('#preview').click();await page.waitForFunction(()=>document.fullscreenElement?.tagName==='ARTICLE');assert.equal(await exit.count(),0);assert.equal(await page.locator('html[data-dcb-fullscreen]').count(),0);await page.evaluate(()=>document.exitFullscreen())
 })
 await check('fullscreen denial is handled once with non-sensitive feedback and retry remains available',async()=>{
  await page.evaluate(()=>{window.actualRequest=HTMLElement.prototype.requestFullscreen;document.documentElement.requestFullscreen=()=>Promise.reject(new Error('fixture denial'))});await page.keyboard.press('F11');await page.waitForSelector('.dcb-fullscreen-notice');assert.equal(await exit.count(),0);assert.equal(await page.getByRole('status').innerText(),'暂时无法切换全屏，请再次按 F11。');await page.evaluate(()=>{delete document.documentElement.requestFullscreen});await page.keyboard.press('F11');await page.waitForSelector('html[data-dcb-fullscreen]');assert.equal(await page.getByRole('status').count(),0)
 })
 await check('a stale native fullscreen mark cannot disable F11',async()=>{
  await page.keyboard.press('F11');await page.waitForFunction(()=>!document.fullscreenElement);await settled()
  await page.evaluate(()=>document.documentElement.setAttribute('data-fullscreen','true'))
  await pressUntilFullscreen();assert.equal(await exit.count(),1)
  await page.keyboard.press('F11');await page.waitForFunction(()=>!document.fullscreenElement);await settled()
  await page.evaluate(()=>{window.dshDesktop={protocolVersion:1}})
  await page.keyboard.press('F11');await page.waitForSelector('html[data-dcb-fullscreen]');assert.equal(await exit.count(),1)
  await page.keyboard.press('F11');await page.waitForFunction(()=>!document.fullscreenElement)
  await page.evaluate(()=>{delete window.dshDesktop;document.documentElement.removeAttribute('data-fullscreen')});await settled()
 })
 await check('a never-settling fullscreen request does not disable later presses',async()=>{
  await page.evaluate(()=>{document.documentElement.requestFullscreen=()=>new Promise(()=>{})})
  await page.keyboard.press('F11');await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false)
  await page.evaluate(()=>{delete document.documentElement.requestFullscreen});await page.waitForTimeout(400)
  await pressUntilFullscreen();assert.equal(await exit.count(),1)
  await page.keyboard.press('F11');await page.waitForFunction(()=>!document.fullscreenElement);await settled()
 })
 await check('dispose releases fullscreen, markers and key handling',async()=>{
  await page.evaluate(()=>window.testFixture.dispose());await page.waitForFunction(()=>!document.fullscreenElement);assert.equal(await page.locator('[data-dcb-fullscreen-sidebar],[data-dcb-fullscreen-toggle],[data-dcb-fullscreen-new],.dcb-fullscreen-tools,.dcb-fullscreen-notice').count(),0);await page.keyboard.press('F11');assert.equal(await page.locator('html[data-dcb-fullscreen]').count(),0)
 })
 assert.deepEqual(errors,[])
 writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors,native:'Installed DSH AppFrame and SidebarRoot React, native CSS; synthetic session and draft'},null,2))
 console.log(JSON.stringify({passed:checks.length,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
