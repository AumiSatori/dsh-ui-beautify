import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium,expect} from '@playwright/test'
import {nativeShell} from './native-shell.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),native=nativeShell()
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','.scratch','claude-beautify'),'header-project')
mkdirSync(output,{recursive:true})
const demo=`import React from 'react';import*as jsxRuntime from'react/jsx-runtime';import{createRoot}from'react-dom/client';
const react=React,react_jsx_runtime=jsxRuntime,clsx=(...values)=>values.flat().filter(Boolean).join(' '),localBuildVersion=()=> 'test',conversationPhase=session=>session.blank?'blank':'active';
const _deepseek_ai_dsh_client_ui_primitives=new Proxy({},{get:()=>()=>null});
${native.code}
window.fixtureReact=React;window.cleanups=[];
const bindings=new Map();window.fixtureBinding=id=>{if(!bindings.has(id))bindings.set(id,{eventSource:{getSnapshot:()=>snapshot,subscribe:()=>()=>{}}});return bindings.get(id)};
const snapshot={entries:[],hasMore:false,change:{kind:'replace'}};
function Demo(){
 const [id,setId]=React.useState('a'),[name,setName]=React.useState('dsh-project'),[width,setWidth]=React.useState(720),[leading,setLeading]=React.useState(false),[blank,setBlank]=React.useState(false),[version,refresh]=React.useReducer(n=>n+1,0);
 const items=React.useMemo(()=>[{workspaceId:'one',title:name,path:'D:/example/dsh-project',sessionIds:['a']},{workspaceId:'two',title:'另一个项目',path:'D:/example/two',sessionIds:['b']}],[name]);
 const byId=React.useMemo(()=>({a:{id:'a',displayTitle:'会话标题 A'},b:{id:'b',displayTitle:'会话标题 B'},child:{id:'child',displayTitle:'子任务',origin:'subagent',parentId:'a'},loose:{id:'loose',displayTitle:'未分组会话',cwd:'D:/example/dsh-project'}}),[]);
 const useSessions=selector=>selector({byId}),useWorkspaces=selector=>selector({items}),useSession=selector=>selector({blank,running:false,openState:'open'});
 window.fixture={refresh,session:setId,rename:setName,width:setWidth,leading:setLeading,blank:setBlank};
 const Header=window.fixtureHeader,injected=Header?window.fixtureHeaderSpec.inject(id):null,source=injected?.hooks.taskActivity;
 const renderSlot=(slot,props)=>{
  if(slot==='conversation.header.leading')return <span data-slot="conversation.header.leading">{leading&&<button aria-label="返回工作区">⌂</button>}</span>;
  if(slot==='conversation.session.header')return <div data-slot="conversation.session.header" style={{display:'contents'}}><ConversationSessionHeader {...props} sessionId={id} useSessions={useSessions} useConversationViews={selector=>selector([{id:'chat',label:'对话'},{id:'trace',label:'轨迹'},{id:'context',label:'上下文'}])} useStore={selector=>selector({view:'chat'})} renderSlot={renderSlot} open={()=>window.nativeOpened=true} selectView={()=>{}} t={key=>key}/></div>;
  if(slot==='conversation.session.header.actions')return <><button>标准模式</button><button>4 个智能体</button></>;
  if(slot==='conversation.session.header.utilities')return Header&&<Header {...injected} sessionId={id} useSessions={useSessions} useWorkspaces={useWorkspaces} useSession={useSession} useProjection={()=>[]} useTaskActivity={selector=>React.useSyncExternalStore(source.subscribe,()=>selector(source.getSnapshot()))}/>;
  if(slot==='conversation.session.header.corner')return <button aria-label="右侧栏">▥</button>;
  return props?.fallback||null;
 };
 return <main className="cr_root" data-phase="active"><div data-slot="conversation.header" style={{display:'contents'}}><ConversationHeader sessionId={id} useSession={useSession} useConversation={selector=>selector({})} renderSlot={renderSlot}/></div><div data-slot="conversation.content" style={{display:'contents'}}><div className="cr_body" data-conversation-content="" data-conversation-session={id}><div className="chat-scroll" data-conversation-scroll=""><article data-chat-flow="" style={{width:'min('+width+'px, calc(100% - 40px))'}}><p>正文左边界</p><p>用于测量对齐的合成内容。</p><textarea aria-label="输入草稿" defaultValue="保留草稿"/></article></div></div></div></main>;
}
createRoot(document.getElementById('root')).render(<Demo/>);`
const built=await build({stdin:{contents:demo,loader:'jsx',resolveDir:project},bundle:true,write:false,format:'iife'})
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${native.css}
*{box-sizing:border-box}body{margin:0;font:14px/1.5 system-ui;color:#25252a;background:#fff}#root{height:100vh}.cr_root{display:flex;flex-direction:column;height:100%;min-height:0}.cr_header{flex:none}.cr_body{flex:1;min-height:0}.chat-scroll{height:100%;overflow:auto}article{margin:0 auto}button{font:inherit;cursor:pointer;min-height:30px;border:0;border-radius:6px;background:transparent;color:inherit}textarea{width:100%;height:80px;border:1px solid #8885;border-radius:10px;padding:14px;font:inherit}body[data-ds-dark-theme]{color:#eee;background:#202020;--dsw-alias-label-primary:#eee;--dsw-alias-label-secondary:#bbb;--dsw-alias-bg-layer-1:#252525}body[data-ds-dark-theme] textarea{color:#eee;background:#252525}
</style><div id="root"></div><script src="/demo.js"></script>`
const routes={'/':['text/html; charset=utf-8',html],'/demo.js':['text/javascript',built.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(process.env.DSH_CLAUDE_CLIENT_FILE||resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[]
page.on('pageerror',e=>errors.push(e.message))
const key='dsh-ui-beautify:settings:v1'
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function aligned(selector='[data-chat-flow]'){
 await expect.poll(async()=>{const row=await page.locator('.cr_titleRow').boundingBox(),flow=await page.locator(selector).boundingBox(),tabs=await page.locator('[data-conversation-tabs]').boundingBox();return Math.abs(row.x-flow.x)+Math.abs(row.width-flow.width)+Math.abs(tabs.x-flow.x)+Math.abs(tabs.width-flow.width)}).toBeLessThan(1)
}
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`)
 await page.evaluate(key=>{localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleEnabled:false,headerCentered:true}));window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}},key)
 await page.addScriptTag({url:`http://127.0.0.1:${server.address().port}/client.js`})
 await page.evaluate(()=>{const ctx={slots:{inject(_name,fn){fn()},register(spec,component){if(spec.name==='conversation.session.header.utilities'){window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:window.fixtureBinding},sidebarRight:{openResource(){}},effect(fn){window.cleanups.push(fn())},inject(_names,fn){fn(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
 await check('project prefix, title and tabs follow the real text edge through header, session-header and content slot wrappers',async()=>{
  await expect(page.locator('.dcb-header-project-label')).toHaveText('dsh-project');await aligned()
  assert.equal(await page.locator('.dcb-header-project').evaluate(el=>el.nextElementSibling.className.endsWith('_crumbs')),true)
  assert.equal(await page.locator('[data-conversation-header-leading]').isVisible(),false)
  await page.locator('textarea').fill('草稿保持不变')
  await page.evaluate(()=>{window.savedDraft=document.querySelector('textarea');window.savedNativeTitle=document.querySelector('.cr_crumbCurrent')})
  await page.screenshot({path:resolve(output,'aligned-project-light.png')})
 })
 await check('nested conversations and retained hidden chat flows cannot steal the active view alignment',async()=>{
  await page.evaluate(()=>{
   const nested=document.createElement('div');nested.dataset.conversationContent='nested';nested.dataset.testNested='';nested.style.cssText='position:absolute;width:240px;right:0;top:200px'
   const flow=document.createElement('div');flow.dataset.chatFlow='';flow.textContent='嵌套会话';nested.append(flow);document.querySelector('.cr_body').prepend(nested)
  })
  await aligned('article[data-chat-flow]')
  await page.evaluate(()=>{
   document.querySelector('[data-test-nested]').remove();document.querySelector('article').style.display='none'
   const view=document.createElement('section');view.dataset.dcbViewWidth='shared';view.dataset.testShared='';view.style.cssText='width:620px;max-width:calc(100% - 40px);margin:0 auto';view.textContent='合成上下文视图';document.querySelector('.chat-scroll').append(view)
  })
  await aligned('[data-test-shared]')
  await page.evaluate(()=>{document.querySelector('[data-test-shared]').remove();document.querySelector('article').style.removeProperty('display')})
  await aligned()
 })
 await check('renames, session switches, subagents and ungrouped sessions cannot retain a stale project name',async()=>{
  await page.evaluate(()=>window.fixture.rename('重命名项目'));await expect(page.locator('.dcb-header-project-label')).toHaveText('重命名项目')
  await page.evaluate(()=>window.fixture.session('b'));await expect(page.locator('.dcb-header-project-label')).toHaveText('另一个项目')
  await page.evaluate(()=>window.fixture.session('child'));await expect(page.locator('.dcb-header-project-label')).toHaveText('重命名项目')
  await page.evaluate(()=>window.fixture.session('loose'));await expect(page.locator('.dcb-header-project')).toHaveCount(0)
  await page.evaluate(()=>window.fixture.session('a'));await expect(page.locator('.dcb-header-project-label')).toHaveText('重命名项目')
  assert.equal(await page.locator('textarea').inputValue(),'草稿保持不变');assert.equal(await page.evaluate(()=>document.querySelector('textarea')===window.savedDraft),true)
 })
 await check('width changes, narrow windows and a real leading button preserve alignment and keep native tools in bounds',async()=>{
  await page.evaluate(()=>window.fixture.width(980));await aligned();await page.evaluate(()=>window.fixture.width(640));await aligned()
  for(const width of[2048,980,760,520,390]){
   await page.setViewportSize({width,height:900});await aligned()
   await page.evaluate(()=>window.fixture.leading(true));await expect(page.getByRole('button',{name:'返回工作区',exact:true})).toBeVisible();await aligned()
   const bad=await page.locator('.cr_header').evaluate(header=>{const rect=header.getBoundingClientRect();return [...header.querySelectorAll('button')].filter(el=>el.getClientRects().length).filter(el=>{const b=el.getBoundingClientRect();return b.left<rect.left-.6||b.right>rect.right+.6}).map(el=>el.outerHTML)})
   assert.deepEqual(bad,[],String(width));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
   await page.evaluate(()=>window.fixture.leading(false))
  }
  await page.evaluate(()=>{window.fixture.rename('很长的项目名称用于验证窄屏下项目名省略而且保留完整标题');document.body.setAttribute('data-ds-dark-theme','')});await aligned()
  await page.screenshot({path:resolve(output,'aligned-project-narrow-dark.png')})
 })
 await check('layout preference preserves the project prefix and disposal removes only plugin decorations',async()=>{
  await page.evaluate(key=>{const value=JSON.stringify({...JSON.parse(localStorage.getItem(key)),headerCentered:false});localStorage.setItem(key,value);dispatchEvent(new StorageEvent('storage',{key,newValue:value}))},key)
  await expect(page.locator('[data-dcb-header-centered]')).toHaveCount(0);await expect(page.locator('.dcb-header-project')).toHaveCount(1)
  await page.evaluate(()=>window.fixture.blank(true));await expect(page.locator('.dcb-header-project')).toHaveCount(0)
  await page.evaluate(()=>window.fixture.blank(false));await expect(page.locator('.dcb-header-project')).toHaveCount(1)
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await expect(page.locator('.dcb-header-project-label')).toBeVisible()
  await page.evaluate(()=>{for(const cleanup of window.cleanups.reverse())cleanup?.()})
  await expect(page.locator('.dcb-header-project')).toHaveCount(0);await expect(page.locator('[data-dcb-header-centered]')).toHaveCount(0)
  assert.equal(await page.locator('textarea').inputValue(),'草稿保持不变');assert.deepEqual(errors,[])
 })
 console.log(JSON.stringify({passed,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
