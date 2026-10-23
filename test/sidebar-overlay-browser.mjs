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
const react=React,react_jsx_runtime=jsxRuntime,clsx=(...values)=>values.flat().filter(Boolean).join(' '),localBuildVersion=()=> 'test',conversationPhase=()=> 'blank';
const _deepseek_ai_dsh_client_ui_primitives=new Proxy({Tooltip:({children})=>children,isDarwinDesktop:()=>document.documentElement.dataset.platform==='darwin'},{get:(obj,key)=>obj[key]||(({className})=><svg width="16" height="16" className={className}><rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor"/></svg>)});
${native.code}
window.fixtureReact=React;window.cleanups=[];window.headerActions=0;const focus=createFocusMode(React,document,window);window.cleanups.push(()=>focus.dispose());
function Header({right,settings,kind,leading}){
 const [view,setView]=React.useState('chat'),tabs=[{id:'chat',label:'对话'},{id:'trace',label:'轨迹'},{id:'context',label:'上下文'}];
 const renderSlot=(name,props)=>{
  if(name==='conversation.session.header')return <ConversationSessionHeader {...props} sessionId="demo" useSessions={selector=>selector({byId:{demo:{id:'demo',displayTitle:'GitHub 仓库能否作 DSH 背景'}}})} useConversationViews={selector=>selector(tabs)} useStore={selector=>selector({view})} renderSlot={renderSlot} selectView={setView} open={()=>{}} t={key=>key}/>;
  if(name==='conversation.header.leading')return leading?<button aria-label="返回工作区" onClick={()=>window.headerActions++}>⌂</button>:null;
  if(name==='conversation.session.header.actions')return <><button>标准模式</button><button>6 个智能体⌄</button></>;
  if(name==='conversation.session.header.utilities')return <><button aria-label="打开目录" onClick={()=>window.headerActions++}>📁⌄</button><button className="demo-theme" aria-label="日夜切换">☀︎ ━</button><focus.Button/><span className="dcb-anchor"><button className="dcb-entry" aria-label="全部轮次" onClick={()=>window.headerActions++}>◈ 全部 17 轮</button></span><button aria-label="打开设置" onClick={settings}>设置</button></>;
  if(name==='conversation.session.header.corner')return <button aria-label="切换右侧栏" onClick={right}>▥</button>;
  return null;
 };
 return <ConversationHeader sessionId={kind==='sessionless'?undefined:'demo'} useSession={selector=>selector(kind==='sessionless'?undefined:{blank:kind==='blank'})} useConversation={selector=>selector(kind==='sessionless'?undefined:{})} renderSlot={renderSlot}/>;
}
function Demo(){
 const [layout,setLayout]=React.useState({viewportWidth:1440,sidebar:280,rightbar:380,rightbarShown:false,rightbarTrack:false,rightbarFullscreen:false,rightbarInstant:false,narrowExpanded:false});
 const [settings,setSettings]=React.useState(false),[globalPanel,setGlobalPanel]=React.useState(false),[generation,setGeneration]=React.useState(0),[headerKind,setHeaderKind]=React.useState('active'),[leading,setLeading]=React.useState(false),[,refresh]=React.useReducer(n=>n+1,0);
 const actions=React.useMemo(()=>({setViewportWidth:value=>setLayout(old=>old.viewportWidth===value?old:{...old,viewportWidth:value}),setSidebar:value=>setLayout(old=>({...old,sidebar:Math.max(264,Math.min(420,value))})),setRightbar:value=>setLayout(old=>({...old,rightbar:Math.max(300,value)}))}),[]);
 const left=()=>setLayout(old=>old.viewportWidth<1024?{...old,narrowExpanded:!old.narrowExpanded}:{...old,sidebar:old.sidebar===0?280:0});
 const right=()=>setLayout(old=>({...old,rightbarShown:!old.rightbarShown,rightbarTrack:!old.rightbarTrack}));
 window.fixture={left,right,settings:setSettings,header:setHeaderKind,leading:setLeading,refresh,panel:setGlobalPanel,remount:()=>setGeneration(n=>n+1),layout:()=>layout,fullscreen:value=>setLayout(old=>({...old,rightbarFullscreen:value})),instant:value=>setLayout(old=>({...old,rightbarInstant:value}))};
 const renderSlot=(name,props)=>{
  if(name==='sidebar')return <SidebarRoot {...props} toggleSidebar={left} startSession={()=>{}} selectPanel={()=>{}} usePanels={()=>[]} useShortcuts={()=>[]} usePanelInfo={selector=>selector({activePanelId:null})} t={key=>key==='toggle.open'?'打开左侧栏':key==='toggle.collapse'?'收起左侧栏':key} renderSlot={(slot)=>slot==='sidebar.sessions'?<div style={{height:'100%',overflow:'auto'}}>{Array.from({length:40},(_,i)=><button className="sb_sessionRow" key={i}>会话 {i+1}</button>)}</div>:null}/>;
  if(name==='main')return globalPanel?<div data-testid="global-panel">插件页面</div>:<main className="cr_root" data-phase="active"><Header right={right} settings={()=>setSettings(true)} kind={headerKind} leading={leading}/><div className="cr_body" data-conversation-content="" data-conversation-session="demo"><div data-conversation-scroll="" className="chat-scroll"><article data-chat-flow="">{Array.from({length:180},(_,i)=><p key={i} className="message">演示消息 {i+1}：左右侧栏覆盖主屏幕，正文宽度、滚动位置和输入草稿不会随开合改变。保留真实控件和粒子画布。</p>)}</article></div><div data-composer-seat="" className="composer"><textarea aria-label="输入草稿" defaultValue="保留输入草稿和选区"/></div></div></main>;
  if(name==='rightbar')return <div className="rb_panel" data-sidebar-right-panel={layout.rightbarFullscreen?'fullscreen':'push'} data-sidebar-right-open={layout.rightbarShown||undefined} style={{width:layout.rightbarFullscreen?'100vw':props.width,'--dsh-sidebar-width':props.width+'px'}}><div data-dockkit-empty="" className="right-content"><div className="preview-toolbar"><span>preview.html</span><button aria-label="预览布局">▥</button><button aria-label="预览全屏" onClick={()=>window.fixture.fullscreen(!layout.rightbarFullscreen)}>⛶</button><button aria-label="收起右侧栏" onClick={right}>▥</button></div><h2>原生右侧面板</h2><input aria-label="右侧草稿" defaultValue="保留文件面板状态"/></div></div>;
  if(name==='shell.bottom')return <div className="bottom">原生底栏</div>;
  if(name==='shell.overlay'&&settings&&window.fixtureSettings)return <div className="settings-dialog" role="dialog"><button aria-label="关闭设置" onClick={()=>setSettings(false)}>×</button><window.fixtureSettings/></div>;
  return null;
 };
 return <AppFrame key={generation} useStore={selector=>selector({layoutInfo:layout})} useSessions={selector=>selector({byId:{}})} usePanelInfo={selector=>selector({activePanelId:null})} actions={actions} renderSlot={renderSlot} t={key=>key}/>;
}
createRoot(document.getElementById('root')).render(<Demo/>);`
const built=await build({stdin:{contents:demo,loader:'jsx',resolveDir:project},bundle:true,write:false,format:'iife'})
const html=`<!doctype html><html data-windows-titlebar><meta charset="utf-8"><style>${native.css}
:root{--dsh-windows-titlebar-height:40px;--dsw-alias-bg-base:#fff;--dsw-specific-sidebar-fill:#f5f6f8;--dsw-alias-label-primary:#23262c;--dsw-alias-label-secondary:#6a707c;--dsw-alias-border-l3:#ccd1da;--ds-transition-duration-slow:320ms;--ds-ease-in-out:ease-in-out}*{box-sizing:border-box}html,body,#root{height:100%;margin:0;font:14px system-ui}.cr_root{display:flex;flex-direction:column;min-height:0;height:100%}button{cursor:pointer;font:inherit}.cr_header button{flex:none;border:0;border-radius:7px;padding:5px 8px;background:transparent;color:inherit;min-height:30px}.cr_header .demo-theme{width:70px;background:#e5f3fd}.cr_body{position:relative;display:flex;flex-direction:column;flex:1;min-height:0}.chat-scroll{flex:1;overflow:auto;min-height:0;overflow-anchor:none}article{max-width:980px;width:calc(100% - 64px);margin:auto;padding:24px 0}.message{line-height:1.9;margin:0 0 14px}.composer{flex:none;padding:14px 28px 20px}textarea{width:100%;height:86px;resize:none;padding:15px;border-radius:16px;border:1px solid #bbb;background:#fff;color:inherit;font:inherit}.sb_sessionRow{display:block;width:100%;height:38px;border:0;background:transparent;text-align:left}.bottom{height:26px;padding:3px 20px}.right-content{height:100%;background:#f3f5f9;pointer-events:auto;border-left:1px solid #ccc}.preview-toolbar{display:flex;align-items:center;gap:8px;height:50px;padding:10px 12px;border-bottom:1px solid #ddd;background:white}.preview-toolbar>span{flex:1;min-width:0}.preview-toolbar>button{width:30px;height:30px;flex:none;border:0;background:transparent;padding:0}.right-content>h2,.right-content>input{margin:20px}.settings-dialog{position:fixed;inset:40px 10%;background:white;overflow:auto;border-radius:14px;padding:24px;box-shadow:0 8px 80px #0004;pointer-events:auto}.settings-dialog>button{position:absolute;right:10px;top:10px}body[data-ds-dark-theme]{--dsw-alias-bg-base:#202226;--dsw-specific-sidebar-fill:#272a30;--dsw-alias-label-primary:#eee;--dsw-alias-label-secondary:#ccc;color:#eee}body[data-ds-dark-theme] :is(textarea,.right-content,.settings-dialog){background:#272a30;color:#eee}.af_sidebarCol{background:var(--dsw-specific-sidebar-fill)}
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
 await check('the native title and tabs stay centered while utilities and the sidebar switch dock at the right edge without replacing controls',async()=>{
  await page.locator('.sb_toggle').click();await page.waitForTimeout(400)
  const row=await page.locator('.cr_titleRow').boundingBox(),tabs=await page.locator('[data-conversation-tabs]').boundingBox()
  assert.ok(Math.abs(row.x+row.width/2-720)<.6,JSON.stringify({row,tabs,header:await page.locator('.cr_header').evaluate(el=>({marked:el.hasAttribute('data-dcb-header-centered'),columns:getComputedStyle(el).gridTemplateColumns,leading:el.firstElementChild.outerHTML}))}));assert.ok(row.width<=1160)
  assert.ok(Math.abs(tabs.x+tabs.width/2-720)<.6)
  const corner=await page.getByRole('button',{name:'切换右侧栏',exact:true}).boundingBox(),tools=await page.locator('.cr_headerUtilities').boundingBox()
  assert.ok(Math.abs(corner.x+corner.width-1428)<.6,'the right-side switch stays at the actual conversation edge')
  assert.ok(Math.abs(corner.y+corner.height/2-tools.y-tools.height/2)<.6,'the right-side switch and utilities share a baseline')
  assert.ok(Math.abs(tools.x+tools.width+8-corner.x)<.6,'the utilities stay beside the right-side switch')
  await page.getByRole('button',{name:'全部轮次',exact:true}).evaluate(el=>{window.savedEntryText=el.textContent;el.textContent='第 12 步，共 128 步'})
  await page.waitForTimeout(100)
  const growing=await page.locator('.cr_headerUtilities').boundingBox(),cluster=await page.locator('.cr_titleCluster').boundingBox()
  assert.ok(cluster.x+cluster.width+11.5<=growing.x,'title text reserves room for growing live progress labels')
  assert.ok(Math.abs(growing.x+growing.width+8-corner.x)<.6)
  await page.getByRole('button',{name:'全部轮次',exact:true}).evaluate(el=>el.textContent=window.savedEntryText)
  await page.getByRole('button',{name:'打开目录',exact:true}).evaluate(el=>el.style.display='none');await page.waitForTimeout(100)
  const smaller=await page.locator('.cr_headerUtilities').boundingBox();assert.ok(Math.abs(smaller.x+smaller.width+8-corner.x)<.6)
  await page.getByRole('button',{name:'打开目录',exact:true,includeHidden:true}).evaluate(el=>el.style.removeProperty('display'))
  await page.getByRole('button',{name:'全部轮次',exact:true}).click();assert.equal(await page.evaluate(()=>window.headerActions),1)
  await page.getByRole('tab',{name:'上下文',exact:true}).click();assert.equal(await page.getByRole('tab',{name:'上下文',exact:true}).getAttribute('aria-selected'),'true')
  await page.evaluate(()=>{window.savedHeaderButton=document.querySelector('[aria-label="全部轮次"]');window.savedDraft=document.querySelector('textarea');window.fixture.settings(true)})
  await selectSettingsCategory(page,'侧栏')
  const toggle=page.getByRole('switch',{name:'顶部栏居中',exact:true});assert.equal(await toggle.getAttribute('aria-checked'),'true')
  await toggle.focus();await page.keyboard.press('Space');await page.waitForTimeout(120)
  assert.equal(await page.locator('[data-dcb-header-centered]').count(),0);assert.equal(await page.locator('[data-dcb-sidebar-overlay]').count(),1)
  assert.equal(await page.evaluate(()=>document.querySelector('[aria-label="全部轮次"]')===window.savedHeaderButton&&document.querySelector('textarea')===window.savedDraft),true)
  await page.reload();await mount();assert.equal(await page.locator('[data-dcb-header-centered]').count(),0)
  await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'侧栏');await toggle.click()
  await page.waitForFunction(()=>document.querySelector('[data-dcb-header-centered]'))
  await page.evaluate(()=>window.fixture.settings(false));await page.locator('.sb_toggle').click();await page.waitForTimeout(400)
  await page.screenshot({path:resolve(output,'header-centered-wide.png')})
  await page.reload();await mount();assert.equal(await page.locator('[data-dcb-header-centered]').count(),1)
 })
 await check('native header buttons stay visible, distinct and usable in narrow, blank and sessionless layouts',async()=>{
  await page.locator('.sb_toggle').click();await page.waitForTimeout(400)
  await page.evaluate(()=>window.fixture.leading(true))
  for(const width of [2048,980,760,520,390]){
   await page.setViewportSize({width,height:1000});await page.waitForTimeout(180)
   const bad=await page.locator('.cr_header').evaluate(header=>{
    const h=header.getBoundingClientRect(),buttons=[...header.querySelectorAll('button')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'),boxes=buttons.map(el=>({label:el.getAttribute('aria-label')||el.textContent,...Object.fromEntries(['left','right','top','bottom'].map(key=>[key,el.getBoundingClientRect()[key]]))})),bad=[]
    for(const b of boxes)if(b.left<h.left-.5||b.right>h.right+.5)bad.push('outside '+b.label)
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.5)bad.push('overlap '+a.label+'/'+b.label)}
    return bad
   });assert.deepEqual(bad,[],String(width));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
   const corner=await page.getByRole('button',{name:'切换右侧栏',exact:true}).boundingBox(),center=await page.locator('.af_centerCol').boundingBox()
   assert.ok(Math.abs(corner.x+corner.width-center.x-center.width+12)<.6,'the right-side switch stays pinned at '+width)
   if(width===2048||width===390)await page.screenshot({path:resolve(output,`header-centered-${width}.png`)})
  }
  await page.getByRole('button',{name:'全部轮次',exact:true}).click();assert.equal(await page.evaluate(()=>window.headerActions),1)
  await page.getByRole('button',{name:'返回工作区',exact:true}).click();assert.equal(await page.evaluate(()=>window.headerActions),2)
  await page.evaluate(()=>window.fixture.header('blank'));await page.waitForTimeout(100)
  assert.equal(await page.locator('[data-conversation-tabs]').count(),0);assert.equal(await page.getByRole('button',{name:'切换右侧栏',exact:true}).isVisible(),true)
  await page.evaluate(()=>window.fixture.header('sessionless'));await page.waitForTimeout(100)
  assert.equal(await page.getByRole('button',{name:'返回工作区',exact:true}).isVisible(),true)
  await page.evaluate(()=>{window.fixture.header('active');window.fixture.leading(false)})
  await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(160)
  await page.locator('.sb_toggle').click();await page.waitForTimeout(400)
 })
 await check('overlay drawers render continuous entry and exit while the fixed toggle has one restrained pulse and the chat stays still',async()=>{
  await patch({sidebarStyle:'css',sidebarMotion:true});await page.waitForTimeout(600)
  const capture=()=>page.locator('.sb_toggle').evaluate(button=>new Promise(done=>{
   const samples=[],start=performance.now(),center=document.querySelector('.af_centerCol'),base=center.getBoundingClientRect(),canvas=document.querySelector('.dcb-particle-layer canvas'),query=document.querySelectorAll;let scans=0
   document.querySelectorAll=function(selector){if(selector.includes('class$="_sidebarCol"'))scans++;return query.call(this,selector)}
   button.click()
   const take=()=>{const root=document.querySelector('.sb_root'),column=root.parentElement,b=button.getBoundingClientRect(),c=center.getBoundingClientRect(),ghost=document.querySelector('[data-dcb-sidebar-ghost]'),seat=ghost||root.querySelector('.sb_regionArea'),s=seat&&getComputedStyle(seat),icon=button.querySelector('svg'),m=new DOMMatrix(getComputedStyle(icon).transform);samples.push({width:column.getBoundingClientRect().width,rootWidth:root.getBoundingClientRect().width,x:c.x,w:c.width,buttonX:b.x+b.width/2,buttonY:b.y+b.height/2,scale:parseFloat(getComputedStyle(button).scale)||1,transform:getComputedStyle(button).transform,iconX:m.m41,ghost:!!ghost,opacity:s?Number(s.opacity):1,moving:root.hasAttribute('data-dcb-sidebar-moving')});if(performance.now()-start<620)requestAnimationFrame(take);else{document.querySelectorAll=query;done({samples,scans,base:{x:base.x,w:base.width},sameCanvas:canvas===document.querySelector('.dcb-particle-layer canvas')})}};requestAnimationFrame(take)
  }))
  const close=await capture(),open=await capture()
  writeFileSync(resolve(output,'drawer-motion.json'),JSON.stringify({close,open},null,2))
  for(const [direction,result]of [['close',close],['open',open]]){
   const mid=result.samples.filter(s=>s.width>3&&s.width<277)
   assert.ok(mid.length>=3,direction+' has rendered intermediate widths')
   assert.ok(mid.some(s=>s.opacity>0&&s.opacity<.98&&s.moving),direction+' fades content during the drawer transition')
   for(const s of result.samples){assert.ok(Math.abs(s.x-result.base.x)<.6&&Math.abs(s.w-result.base.w)<.6);assert.ok(Math.abs(s.buttonX-26)<.6&&Math.abs(s.buttonY-20)<.6,'the fixed toggle center never moves');assert.equal(s.transform,'none');assert.ok(s.scale>=.969&&s.scale<=1.001);assert.ok(Math.abs(s.iconX)<=2.05)}
   assert.equal(result.sameCanvas,true);assert.ok(result.scans<18,'drawer frames do not rescan the entire UI: '+result.scans)
  }
  assert.ok(close.samples.some(s=>s.ghost),'the outgoing native content remains visible long enough to fade')
  assert.equal(await page.locator('[data-dcb-sidebar-ghost]').count(),0)
  const reversal=await page.locator('.sb_toggle').evaluate(button=>new Promise(done=>{button.click();setTimeout(()=>{const column=document.querySelector('.af_sidebarCol'),before=column.getBoundingClientRect().width;button.click();requestAnimationFrame(()=>done({before,after:column.getBoundingClientRect().width,ghosts:document.querySelectorAll('[data-dcb-sidebar-ghost]').length,transitions:column.getAnimations().filter(a=>a.transitionProperty==='width').length}))},90)}))
  assert.ok(Math.abs(reversal.after-reversal.before)<24,'rapid reversal continues from the current width');assert.ok(reversal.ghosts<=1&&reversal.transitions<=1)
  await page.waitForTimeout(650);assert.ok(Math.abs((await page.locator('.af_sidebarCol').boundingBox()).width-280)<.5)
  await patch({sidebarMotion:false});await page.locator('.sb_toggle').click();await page.waitForTimeout(45)
  assert.equal((await page.locator('.af_sidebarCol').boundingBox()).width,0)
  assert.equal(await page.locator('[data-dcb-sidebar-ghost]').count(),0)
  await page.locator('.sb_toggle').click();await patch({sidebarMotion:true,sidebarStyle:'milk'});await page.waitForTimeout(600)
  writeFileSync(resolve(output,'drawer-motion.json'),JSON.stringify({close,open},null,2))
 })
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
  assert.equal(await page.getByRole('button',{name:'全部轮次',exact:true}).evaluate(el=>{const r=el.getBoundingClientRect();return !!document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.right-content')}),true,'main-header icons cannot float onto the preview toolbar')
  await page.getByRole('button',{name:'预览全屏',exact:true}).click();await page.waitForTimeout(120)
  const previewHit=await page.getByRole('button',{name:'预览全屏',exact:true}).evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});assert.equal(previewHit,true)
  await page.screenshot({path:resolve(output,'preview-toolbar-fullscreen.png')})
  await page.getByRole('button',{name:'预览全屏',exact:true}).click();await page.waitForTimeout(120)
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
  if(await page.evaluate(()=>window.fixture.layout().rightbarShown)){await page.getByRole('button',{name:'收起右侧栏',exact:true}).click();await page.waitForTimeout(400)}
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
  assert.equal(await page.locator('[data-dcb-sidebar-overlay],[data-dcb-sidebar-overlay-part],[data-dcb-header-centered]').count(),0)
  assert.equal(await page.locator('[data-dcb-header-compact]').count(),0)
  assert.equal(await page.locator('.cr_header').evaluate(el=>[...el.style].filter(name=>name.startsWith('--dcb-header-')).length),0)
  assert.equal(await page.locator('.af_frame').evaluate(el=>[...el.style].filter(name=>name.startsWith('--dcb-overlay-')).length),0)
  assert.ok((await geometry()).center[2]<760)
  assert.deepEqual(errors,[])
 })
 writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors,native:'Installed AppFrame / SidebarRoot / ConversationHeader / ConversationSessionHeader React components and SidebarRight CSS; synthetic session and panel data'},null,2));console.log(JSON.stringify({checks,output},null,2))
}finally{await browser.close();await new Promise(done=>server.close(done))}
