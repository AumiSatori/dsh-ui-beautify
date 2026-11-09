import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeShell} from './native-shell.mjs'

const root=fileURLToPath(new URL('..',import.meta.url)),native=nativeShell(),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/ui-beautify-macos-20261103'))
mkdirSync(out,{recursive:true})
const client=readFileSync(resolve(root,'client.js'),'utf8'),edgeStart=client.indexOf('      .dcb-sidebar-toggle-right {'),edgeEnd=client.indexOf('      [data-dcb-sidebar-toggle="true"]',edgeStart)
assert.ok(edgeStart>0&&edgeEnd>edgeStart)
const edgeCss=client.slice(edgeStart,edgeEnd).replace(/\$\{MOTION.time.\w+\}/g,'280').replace(/\$\{MOTION.ease.\w+\}/g,'cubic-bezier(.4,0,.2,1)')
const source=`
import React from'react';import*as jsxRuntime from'react/jsx-runtime';import{createRoot}from'react-dom/client';
import{createUnifiedIcons,unifiedIconsCss}from'./src/unified-icons.js';import{createToolbarLayout,createToolbarSettings,toolbarSettingsCss,normalizeToolbar}from'./src/toolbar-settings.js';import{createSidebarGlass}from'./src/sidebar-glass.js';import{createSidebarOverlay,sidebarOverlayCss}from'./src/sidebar-overlay.js';import{createHeaderLayout,headerLayoutCss}from'./src/header-layout.js';import{settingsControlsCss}from'./src/settings-controls.js';
const react=React,react_jsx_runtime=jsxRuntime,clsx=(...values)=>values.flat().filter(Boolean).join(' '),localBuildVersion=()=>undefined;
const Glyph=({className})=><svg width="16" height="16" viewBox="0 0 24 24" className={className}><path d="M4 5h16v14H4ZM9 5v14" fill="none" stroke="currentColor"/></svg>;
const _deepseek_ai_dsh_client_ui_primitives=new Proxy({Tooltip:({children})=>children,isDarwinDesktop:()=>document.documentElement.dataset.platform==='darwin'},{get:(value,key)=>value[key]||Glyph});
${native.code}
document.head.append(Object.assign(document.createElement('style'),{textContent:unifiedIconsCss+toolbarSettingsCss+sidebarOverlayCss+headerLayoutCss+settingsControlsCss}));
const KEY='fixture:macos-toolbar';let config=normalizeToolbar(JSON.parse(localStorage.getItem(KEY)||'{}')),mode='glass',queued=0,refreshView=()=>{};
const icons=createUnifiedIcons(document,window,schedule),toolbar=createToolbarLayout(document,window),overlay=createSidebarOverlay(document,window,schedule),glass=createSidebarGlass(document,window,schedule),header=createHeaderLayout(document,window),ToolbarSettings=createToolbarSettings(React,toolbar);
function sync(){overlay.sync(true);header.sync(true);icons.sync(mode);toolbar.sync({toolbar:config,iconStyle:mode,enabled:true});glass.sync('milk',true)}
function schedule(){if(!queued)queued=requestAnimationFrame(()=>{queued=0;sync()})}
function configure(next){config=normalizeToolbar(next);localStorage.setItem(KEY,JSON.stringify(config));sync();refreshView()}
window.actions={folder:0,application:0,more:0,theme:0,focus:0,summary:0,newSession:0};
const t=key=>({'toggle.open':'打开侧栏','toggle.collapse':'收起侧栏','session.new':'新会话','session.new.label':'新会话','brand.localBuild':'DSH'}[key]||key);
function Demo(){
 const[layout,setLayout]=React.useState({viewportWidth:1440,sidebar:280,rightbar:0,rightbarShown:false,rightbarTrack:false,rightbarFullscreen:false,rightbarInstant:false,narrowExpanded:false}),[settings,setSettings]=React.useState(false),[apps,setApps]=React.useState(false),[language,setLanguage]=React.useState('zh'),[wrapper,setWrapper]=React.useState(document.documentElement.dataset.platform==='darwin'?'legacy':'windows'),[version,refresh]=React.useReducer(n=>n+1,0);
 refreshView=refresh;icons.connectShortcuts({registry:{invoke:()=>setSettings(true)}});
 const left=()=>setLayout(old=>({...old,sidebar:old.sidebar===0?280:0})),newSession=()=>actions.newSession++;
 const nativeActions=React.useMemo(()=>({setViewportWidth:value=>setLayout(old=>old.viewportWidth===value?old:{...old,viewportWidth:value}),setSidebar:value=>setLayout(old=>({...old,sidebar:value})),setRightbar:()=>{}}),[]);
 React.useLayoutEffect(sync,[layout,settings,apps,language,wrapper,version]);
 window.fixture={settings:setSettings,language:setLanguage,wrapper:setWrapper,refresh,collapse:value=>setLayout(old=>({...old,sidebar:value?0:280})),config:()=>config,configure,mode:value=>{mode=value;sync();refresh()},dispose:()=>{icons.dispose();toolbar.dispose();overlay.dispose();glass.dispose();header.dispose();if(queued)cancelAnimationFrame(queued)}};
 const utilities=<><div className="finder-anchor"><div className="finder-split" data-open-target="directory"><button aria-label={document.documentElement.dataset.platform==='darwin'?(language==='zh'?'在访达中打开':'Open in Finder'):'使用文件资源管理器打开'} onClick={()=>actions.folder++}><Glyph/></button><button aria-label={language==='zh'?'更多打开方式':'Open with'} aria-haspopup="menu" aria-expanded={apps} onClick={()=>setApps(value=>!value)}>⌄</button></div>{apps&&<div role="menu"><button role="menuitem" onClick={()=>{actions.application++;setApps(false)}}>Synthetic Editor</button></div>}</div><div className="legacy-entry" data-slot={wrapper==='legacy'?undefined:'fixture.entry'} style={{display:wrapper==='legacy'?'flex':'contents'}}><button aria-label={language==='zh'?'更多操作':'More actions'} onClick={()=>actions.more++}>⋯</button><button className="dcb-theme-toggle" role="switch" aria-checked="false" aria-label="昼夜切换" onClick={()=>actions.theme++}>☀ ━</button><button className="dcb-focus-toggle" aria-label="纯背景" onClick={()=>actions.focus++}><Glyph/></button><span className="dcb-anchor"><button className="dcb-entry" aria-label="任务面板" onClick={()=>actions.summary++}>任务</button></span></div></>;
 const renderSlot=(name,props)=>{
  if(name==='sidebar')return <SidebarRoot useRemoteAccess={()=>true} {...props} toggleSidebar={left} startSession={newSession} selectPanel={()=>{}} usePanels={()=>[]} useEntryPins={()=>[]} useEntryActions={()=>false} trackEntryClick={()=>{}} setPinned={()=>{}} useShortcuts={()=>[]} usePanelInfo={selector=>selector({activePanelId:null})} t={t} renderSlot={slot=>slot==='sidebar.sessions'?<p>合成会话</p>:null}/>;
  if(name==='shell.leading')return <HeaderLeadingControls useRemoteAccess={()=>true} toggleSidebar={left} startSession={newSession} trackEntryClick={()=>{}} useShortcuts={()=>[]} t={t}/>;
  if(name==='main')return <main className="cr_root"><header className="cr_header"><div className="cr_headerLeading" data-conversation-header-leading=""/><div className="cr_titleRow"><div className="cr_titleCluster">macOS 兼容回归</div><div className="cr_headerUtilities"><div data-slot="conversation.session.header.utilities" style={{display:'contents'}}><div className="legacy-toolbar" data-entry-wrapper data-slot={wrapper==='legacy'?undefined:'fixture.utilities'} style={{display:wrapper==='legacy'?'flex':'contents'}}>{utilities}</div></div></div><div className="cr_headerCorner"><button data-sidebar-right-expand aria-label="打开右侧栏"><Glyph/></button></div></div></header><div className="cr_body" data-conversation-content="" data-conversation-session="synthetic"><div data-conversation-scroll=""><article data-chat-flow=""><p>合成正文</p><textarea aria-label="输入草稿" defaultValue="保留草稿"/></article></div></div></main>;
  if(name==='shell.overlay'&&settings)return <div role="dialog" aria-label="美化设置" className="dcb-settings"><button aria-label="关闭设置" onClick={()=>setSettings(false)}>×</button><ToolbarSettings value={{toolbar:config,enabled:true}} onChange={patch=>configure(patch.toolbar)}/></div>;
  return null;
 };
 return <AppFrame useFoldedLandscape={selector=>selector(false)} useStore={selector=>selector({layoutInfo:layout})} useSessions={selector=>selector({byId:{}})} usePanelInfo={selector=>selector({activePanelId:null})} actions={nativeActions} renderSlot={renderSlot} t={key=>key}/>;
}
createRoot(document.getElementById('root')).render(<Demo/>);
`
const built=await build({stdin:{contents:source,loader:'jsx',resolveDir:root},bundle:true,write:false,format:'iife'})
const html=`<!doctype html><html data-platform="darwin"><meta charset="utf-8"><style>${native.css}${edgeCss}
:root{--dsw-alias-bg-base:#fafafa;--dsw-specific-sidebar-fill:#eee;--dsw-alias-label-primary:#25252a;--dsw-alias-label-secondary:#74747c;--dsw-alias-border-l3:#ddd;--dsw-radius-sm:8px;--ds-transition-duration-slow:300ms;--ds-ease-in-out:ease;--dsh-settings-border:#ddd;--dsh-settings-subtle:#f6f6f6;--dsh-settings-surface:#fff;--dsh-settings-text:#25252a;--dsh-settings-secondary:#74747c;--dsh-settings-accent:#666}*{box-sizing:border-box}html,body,#root{height:100%;margin:0;font:14px/1.5 system-ui}button{font:inherit;cursor:pointer;color:inherit}header button{height:30px;min-width:30px;border:1px solid #ddd;border-radius:8px;background:transparent;padding:4px 7px}header svg{width:16px;height:16px}.cr_root{display:flex;flex-direction:column;height:100%;min-height:0}.cr_header{min-height:60px;flex:none}.cr_titleRow{display:flex;align-items:center;gap:12px;padding:10px 24px}.cr_titleCluster{flex:1;min-width:0}.cr_headerUtilities,.cr_headerCorner,.legacy-toolbar,.legacy-entry,.finder-split{display:flex;align-items:center;gap:8px}.finder-split{gap:0}.finder-anchor{position:relative}.finder-anchor [role=menu]{position:absolute;top:35px;right:0;min-width:150px;background:white;border:1px solid #ccc;z-index:80}.dcb-theme-toggle{width:70px;background:#dcecf7}.dcb-anchor{display:inline-flex}.cr_body{flex:1;min-height:0}article{width:720px;max-width:calc(100% - 40px);margin:40px auto}textarea{width:100%;height:80px}.dcb-settings{position:fixed;inset:55px 80px 30px;padding:24px;overflow:auto;border-radius:18px;background:white;box-shadow:0 12px 60px #0003}.dcb-settings>button{position:absolute;right:14px;top:10px}.dcb-settings-header h2{margin:0}.dcb-settings-header p{color:#777}.dcb-switch{position:relative;flex:none;width:44px;height:26px;border:0;border-radius:20px;background:#999;cursor:pointer}.dcb-switch:after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:white;transition:transform 220ms}.dcb-switch[aria-checked=true]{background:#666}.dcb-switch[aria-checked=true]:after{transform:translateX(18px)}
</style><div id="root"></div><script src="/fixture.js"></script></html>`
const server=createServer((req,res)=>{const script=req.url==='/fixture.js',document=req.url.includes('platform=windows')?html.replace('data-platform="darwin"','data-windows-titlebar'):html;res.writeHead(200,{'Content-Type':script?'text/javascript':'text/html; charset=utf-8'}).end(script?built.outputFiles[0].text:document)})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),page=await browser.newPage({viewport:{width:1440,height:980}}),errors=[],checks=[]
page.on('pageerror',error=>errors.push(error.message))
const url='http://127.0.0.1:'+server.address().port,settle=()=>page.waitForTimeout(350),item=(id,target=page)=>target.locator('header [data-dcb-toolbar-item="'+id+'"]')
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
const painted=(label,target=page)=>target.evaluate(label=>[...document.querySelectorAll('button')].filter(node=>{if(node.getAttribute('aria-label')!==label)return false;const box=node.getBoundingClientRect();if(!box.width||!box.height||box.left<0||box.top<0||box.right>innerWidth||box.bottom>innerHeight||getComputedStyle(node).visibility==='hidden')return false;return document.elementFromPoint(box.left+box.width/2,box.top+box.height/2)?.closest('button')===node}).length,label)
try{
 await page.goto(url);await item('theme').waitFor();await settle()
 await check('macOS mixed entry wrappers resolve to independent items and Finder remains one split control',async()=>{
  for(const wrapper of ['legacy','contents']){
   await page.evaluate(wrapper=>fixture.wrapper(wrapper),wrapper);await settle()
   assert.deepEqual((await page.locator('header [data-dcb-toolbar-item]').evaluateAll(nodes=>nodes.map(node=>node.dataset.dcbToolbarItem))).sort(),['folder','focus','more','rightSidebar','settings','summary','theme'].sort())
   assert.equal(await item('folder').locator('button').count(),2)
   assert.equal(await page.locator('[data-entry-wrapper][data-dcb-toolbar-item],.legacy-entry[data-dcb-toolbar-item]').count(),0)
  }
  await page.evaluate(()=>fixture.wrapper('legacy'));await settle()
 })
 await check('every macOS toolbar visibility switch hides just its own entry, including the day/night switch',async()=>{
  await page.evaluate(()=>fixture.settings(true));await page.getByRole('dialog').waitFor()
  for(const [id,label]of [['folder','项目文件夹'],['more','更多操作'],['theme','昼夜切换'],['focus','纯背景入口'],['summary','任务面板入口'],['settings','设置入口'],['rightSidebar','右侧栏开关']]){
   const control=page.getByRole('switch',{name:'显示'+label,exact:true});await control.click();await settle();assert.equal(await item(id).isVisible(),false)
   for(const other of ['folder','more','theme','focus','summary','settings','rightSidebar'].filter(other=>other!==id))assert.equal(await item(other).isVisible(),true,other+' must survive hiding '+id)
   await control.click();await settle();assert.equal(await item(id).isVisible(),true)
  }
  assert.equal(await page.getByRole('dialog').locator('select,input[type=checkbox],input[type=radio],input[type=range]').count(),0)
 })
 await check('macOS ordering crosses native seats, retains handlers, application menus and original DOM nodes',async()=>{
  await item('theme').evaluate(node=>window.originalTheme=node);await item('folder').evaluate(node=>window.originalFolder=node)
  for(let i=0;i<4;i++)await page.getByRole('button',{name:'上移纯背景入口',exact:true}).click()
  await page.evaluate(()=>fixture.settings(false));await settle()
  const order=await page.locator('header [data-dcb-toolbar-item]').evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length).map(node=>({id:node.dataset.dcbToolbarItem,x:node.getBoundingClientRect().x})).sort((a,b)=>a.x-b.x))
  assert.equal(order[0].id,'focus');assert.equal(await item('theme').evaluate(node=>node===window.originalTheme),true);assert.equal(await item('folder').evaluate(node=>node===window.originalFolder),true)
  await item('folder').getByRole('button',{name:'在访达中打开',exact:true}).click();await item('folder').getByRole('button',{name:'更多打开方式',exact:true}).click();await page.getByRole('menuitem',{name:'Synthetic Editor',exact:true}).click()
  for(const id of ['more','theme','focus','summary'])await item(id).click()
  assert.deepEqual(await page.evaluate(()=>actions),{folder:1,application:1,more:1,theme:1,focus:1,summary:1,newSession:0})
  await page.evaluate(()=>fixture.language('en'));await settle();assert.equal(await item('folder').getByRole('button',{name:'Open in Finder',exact:true}).count(),1)
  await page.screenshot({path:resolve(out,'macos-toolbar-ordered.png')})
 })
 await check('toolbar preferences survive reload and native layout returns after reset',async()=>{
  await page.evaluate(()=>fixture.configure({...fixture.config(),hidden:['theme']}));await page.reload();await item('focus').waitFor();await settle()
  assert.equal(await item('theme').isVisible(),false);assert.equal(await page.evaluate(()=>fixture.config().order[0]),'focus')
  await page.evaluate(()=>fixture.settings(true));await page.getByRole('button',{name:'恢复工具栏默认排列',exact:true}).click();await page.evaluate(()=>fixture.settings(false));await settle()
  assert.equal(await item('theme').isVisible(),true);assert.equal(await page.locator('header[data-dcb-toolbar-layout]').count(),0)
 })
 await check('collapsed macOS sidebar uses exactly the native shell-leading pair in every icon style',async()=>{
  for(const mode of ['glass','plain','native']){
   await page.evaluate(mode=>{fixture.mode(mode);fixture.collapse(true)},mode);await page.waitForTimeout(650)
   assert.equal(await page.locator('[data-shell-leading] button').count(),2);assert.equal(await page.locator('[data-dcb-caption-proxy],[data-dcb-caption-tools],[data-dcb-caption-button]').count(),0)
   assert.equal(await painted('打开侧栏'),1);assert.equal(await painted('新会话'),1)
   const before=await page.evaluate(()=>actions.newSession);await page.locator('[data-shell-leading]').getByRole('button',{name:'新会话',exact:true}).click();assert.equal(await page.evaluate(()=>actions.newSession),before+1)
   await page.locator('[data-shell-leading]').getByRole('button',{name:'打开侧栏',exact:true}).click();await page.waitForTimeout(650)
   assert.equal(await page.locator('[data-shell-leading]').count(),0);assert.equal(await painted('收起侧栏'),1);assert.equal(await painted('新会话'),1)
  }
  await page.evaluate(()=>{fixture.mode('glass');fixture.collapse(true)});await page.waitForTimeout(650);await page.screenshot({path:resolve(out,'macos-sidebar-collapsed.png')})
 })
 await check('Windows retains the existing toolbar seats and one glass caption pair with working native actions',async()=>{
  const winPage=await browser.newPage({viewport:{width:1440,height:980}});winPage.on('pageerror',error=>errors.push(error.message))
  const winItem=id=>item(id,winPage),winPainted=label=>painted(label,winPage)
  try{
   await winPage.goto(url+'/?platform=windows');await winItem('theme').waitFor();await winPage.evaluate(()=>fixture.collapse(true));await winPage.waitForTimeout(650)
   assert.equal(await winPage.locator('[data-shell-leading]').count(),0);assert.equal(await winPage.locator('[data-dcb-caption-proxy]').count(),2)
   assert.equal(await winPainted('打开侧栏'),1);assert.equal(await winPainted('新会话'),1)
   assert.deepEqual((await winPage.locator('header [data-dcb-toolbar-item]').evaluateAll(nodes=>nodes.map(node=>node.dataset.dcbToolbarItem))).sort(),['folder','focus','more','rightSidebar','settings','summary','theme'].sort())
   const before=await winPage.evaluate(()=>actions.newSession);await winPage.locator('[data-dcb-caption-proxy=new]').click();assert.equal(await winPage.evaluate(()=>actions.newSession),before+1)
   await winPage.evaluate(()=>fixture.configure({...fixture.config(),hidden:['theme']}));await winPage.waitForTimeout(350);assert.equal(await winItem('theme').isVisible(),false)
   for(const id of ['folder','more','focus','summary','settings','rightSidebar'])assert.equal(await winItem(id).isVisible(),true)
   await winPage.evaluate(()=>fixture.configure({}));await winPage.locator('[data-dcb-caption-proxy=toggle]').click();await winPage.waitForTimeout(650)
   assert.equal(await winPainted('收起侧栏'),1)
   // Windows natively exposes both its clickable brand and the New Chat row
   // when expanded. Preserve both; the collapsed glass copies must be inert.
   assert.equal(await winPainted('新会话'),2);assert.equal(await winPage.locator('[data-dcb-icon-group=caption]').evaluate(node=>node.inert),true)
   await winPage.screenshot({path:resolve(out,'windows-unchanged.png')})
  }finally{await winPage.close()}
 })
 await check('macOS remounts, narrow layouts and cleanup retain native controls and release plugin state',async()=>{
  await page.evaluate(()=>fixture.refresh());await settle();assert.equal(await page.locator('[data-shell-leading] button').count(),2);assert.equal(await page.locator('[data-dcb-caption-proxy]').count(),0)
  await page.setViewportSize({width:900,height:850});await settle();assert.equal(await page.locator('[data-dcb-caption-proxy]').count(),0);await page.screenshot({path:resolve(out,'macos-narrow.png')})
  await page.evaluate(()=>fixture.dispose());assert.equal(await page.locator('[data-dcb-toolbar-item],[data-dcb-toolbar-hidden],[data-dcb-toolbar-container],[data-dcb-caption-proxy],[data-dcb-caption-tools]').count(),0)
  assert.equal(await page.getByRole('textbox',{name:'输入草稿'}).inputValue(),'保留草稿')
 })
 assert.deepEqual(errors,[])
 writeFileSync(resolve(out,'verification.json'),JSON.stringify({checks,errors,platform:'Windows Chrome with installed DSH macOS branches and synthetic data; native macOS runtime not exercised'},null,2)+'\n')
 console.log(JSON.stringify({passed:checks.length,errors,output:out}))
}finally{await browser.close();server.close()}
