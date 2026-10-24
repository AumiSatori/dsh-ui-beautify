import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium,expect} from '@playwright/test'
import {nativeShell} from './native-shell.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),native=nativeShell(),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','.scratch','claude-beautify'),'focus-header')
mkdirSync(output,{recursive:true})
const demo=`import React from 'react';import*as jsxRuntime from'react/jsx-runtime';import{createRoot}from'react-dom/client';
const react=React,react_jsx_runtime=jsxRuntime,clsx=(...values)=>values.flat().filter(Boolean).join(' '),localBuildVersion=()=> 'test',conversationPhase=()=> 'active';
const _deepseek_ai_dsh_client_ui_primitives=new Proxy({},{get:()=>()=>null});
${native.code}
window.fixtureReact=React;window.cleanups=[];
const snapshot={entries:[],hasMore:false,change:{kind:'replace'}},binding={eventSource:{getSnapshot:()=>snapshot,subscribe:()=>()=>{}}};window.fixtureBinding=()=>binding;
function Demo(){
 const [view,setView]=React.useState('chat'),[,refresh]=React.useReducer(n=>n+1,0);
 const useSession=selector=>selector({running:false,openState:'open'}),useSessions=selector=>selector({byId:{a:{id:'a',displayTitle:'用于验证专注模式顶部收起的会话标题'}}});
 window.fixture={refresh};
 const Header=window.fixtureHeader,injected=Header?window.fixtureHeaderSpec.inject('a'):null,source=injected?.hooks.taskActivity;
 const renderSlot=(slot,props)=>{
  if(slot==='conversation.header.leading')return <span data-slot="conversation.header.leading"/>;
  if(slot==='conversation.session.header')return <div data-slot="conversation.session.header" style={{display:'contents'}}><ConversationSessionHeader {...props} sessionId="a" useSessions={useSessions} useConversationViews={selector=>selector([{id:'chat',label:'对话'},{id:'trace',label:'轨迹'},{id:'context',label:'上下文'}])} useStore={selector=>selector({view})} renderSlot={renderSlot} open={()=>{}} selectView={setView} t={key=>key}/></div>;
  if(slot==='conversation.session.header.actions')return <><button>标准模式</button><button>4 个智能体</button></>;
  if(slot==='conversation.session.header.utilities')return Header&&<Header {...injected} sessionId="a" useSession={useSession} useProjection={()=>[]} useTaskActivity={selector=>React.useSyncExternalStore(source.subscribe,()=>selector(source.getSnapshot()))}/>;
  if(slot==='conversation.session.header.corner')return <button aria-label="右侧栏">▥</button>;
  return props?.fallback||null;
 };
 return <div className="af_frame"><aside className="af_sidebarCol">工作区</aside><main className="af_centerCol"><section className="cr_root" data-phase="active"><div data-slot="conversation.header" style={{display:'contents'}}><ConversationHeader sessionId="a" useSession={useSession} useConversation={selector=>selector({})} renderSlot={renderSlot}/></div><div data-slot="conversation.content" style={{display:'contents'}}><div className="cr_body" data-conversation-content="" data-conversation-session="a"><div className="cr_scrollBody" data-conversation-scroll=""><article data-chat-flow=""><p>专注阅读内容</p><p data-testid="view">{view}</p></article><div className="cr_composerSeat" data-composer-seat=""><textarea aria-label="输入草稿" defaultValue="保留输入草稿"/></div></div></div></div></section></main><aside className="af_rightbarCol" data-rightbar-col="">文件面板</aside></div>;
}
createRoot(document.getElementById('root')).render(<Demo/>);`
const built=await build({stdin:{contents:demo,loader:'jsx',resolveDir:project},bundle:true,write:false,format:'iife'})
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${native.css}
*{box-sizing:border-box}html,body,#root{height:100%;margin:0;font:14px/1.5 system-ui;color:#25252a;background:#fff;--dsw-alias-label-primary:#25252a;--dsw-alias-label-secondary:#666;--dsw-alias-border-l3:#ddd}.af_frame{height:100%;display:grid;grid-template-columns:200px minmax(0,1fr) 200px;overflow:hidden}.af_centerCol{min-width:0;min-height:0}.af_sidebarCol,.af_rightbarCol{background:#f5f6f8}.cr_root{display:flex;flex-direction:column;height:100%;min-height:0}.cr_header{flex:none}.cr_body{flex:1;min-height:0}.cr_scrollBody{overflow:auto}article{width:min(680px,calc(100% - 48px));margin:0 auto;flex:1 0 auto;padding-top:24px}.cr_composerSeat{padding:16px 24px}button{font:inherit;cursor:pointer;min-height:30px;border:0;border-radius:6px;background:transparent;color:inherit}textarea{width:100%;height:80px;border:1px solid #8885;border-radius:10px;padding:14px;font:inherit}body[data-ds-dark-theme]{color:#eee;background:#171717;--dsw-alias-label-primary:#eee;--dsw-alias-label-secondary:#bbb;--dsw-alias-bg-base:#171717}body[data-ds-dark-theme] .af_sidebarCol,body[data-ds-dark-theme] .af_rightbarCol{background:#202020}
@media(max-width:900px){.af_frame{grid-template-columns:0px minmax(0,1fr) 0px}.af_sidebarCol,.af_rightbarCol{visibility:hidden}}
body[data-ds-dark-theme] #root{color:inherit;background:transparent}
</style><div id="root"></div><script src="/demo.js"></script>`
const routes={'/':['text/html; charset=utf-8',html],'/demo.js':['text/javascript',built.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],key='dsh-claude-beautify:settings:v1',checks=[]
page.on('pageerror',e=>errors.push(e.message))
const focus=page.locator('.dcb-focus-toggle'),header=page.locator('.cr_header'),tabs=page.locator('[data-conversation-tabs]')
const idle=()=>page.waitForFunction(()=>!document.getAnimations().some(a=>a.id.startsWith('dcb-focus-')))
async function toggle(){
 const samples=await page.evaluate(()=>new Promise(done=>{
  const focus=document.querySelector('.dcb-focus-toggle'),tabs=document.querySelector('[data-conversation-tabs]'),samples=[],start=performance.now()
  const read=()=>{const b=focus.getBoundingClientRect(),t=tabs.getBoundingClientRect();return{x:b.x,y:b.y,tabsX:t.x,tabsY:t.y,moving:document.getAnimations().some(a=>a.id.startsWith('dcb-focus-'))}}
  samples.push(read());focus.click()
  const tick=()=>{samples.push(read());if(performance.now()-start<650||samples.at(-1).moving)requestAnimationFrame(tick);else done(samples)};requestAnimationFrame(tick)
 }))
 const handoff=samples.findIndex((sample,i)=>i>0&&samples[i-1].moving&&!sample.moving)
 assert.ok(handoff>0,'The native header has observable movement')
 for(const key of['x','y','tabsX','tabsY'])assert.ok(Math.abs(samples[handoff][key]-samples[handoff-1][key])<2,key+' has no final-frame jump')
 return samples
}
async function boot(centered){
 await page.goto('http://127.0.0.1:'+server.address().port)
 await page.evaluate(({key,centered})=>{localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleEnabled:false,sidebarOverlay:false,headerCentered:centered}));window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}}, {key,centered})
 await page.addScriptTag({url:'/client.js'})
 await page.evaluate(()=>{const ctx={slots:{inject(_name,fn){fn()},register(spec,component){if(spec.name==='conversation.session.header.utilities'){window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:window.fixtureBinding},effect(fn){window.cleanups.push(fn())},inject(_names,fn){fn(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
 await focus.waitFor();await page.waitForTimeout(120)
}
try{
 for(const centered of[false,true]){
  await boot(centered)
  for(const width of[2560,1440,820,390]){
   await page.setViewportSize({width,height:900});await page.waitForTimeout(120)
   const before=await header.boundingBox(),originalTabs=await tabs.boundingBox()
   await page.evaluate(()=>{window.savedFocusDraft=document.querySelector('textarea');window.savedFocusPreferences=localStorage.getItem('dsh-claude-beautify:settings:v1')})
   if(width===1440)await toggle();else{await focus.click();await idle()}
   const compact=await header.boundingBox(),compactTabs=await tabs.boundingBox(),button=await focus.boundingBox(),content=await page.locator('[data-conversation-content]').boundingBox()
   const flow=await page.locator('[data-chat-flow]').boundingBox()
   assert.ok(Math.abs(compactTabs.x-flow.x)<1,'Focused tabs follow the text column, not the window edge')
   assert.ok(compact.height<=48,'Focused header fits one row: '+width+' '+centered)
   assert.ok(compact.height<before.height-15,'Focused header releases the old title row')
   assert.ok(compactTabs.y<originalTabs.y-15,'Tabs rise into the old title space')
   assert.ok(Math.abs(compactTabs.y-button.y)<3,'Tabs and tools share a row')
   assert.ok(content.y<=compact.y+48,'The reading viewport starts directly below the compact row')
   assert.equal(await page.locator('.cr_titleCluster').isVisible(),false)
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
   const outside=await header.evaluate(header=>{const box=header.getBoundingClientRect();return [...header.querySelectorAll('button')].filter(el=>el.getClientRects().length).filter(el=>{const b=el.getBoundingClientRect();return b.left<box.left-1||b.right>box.right+1}) .map(el=>el.textContent)})
   assert.deepEqual(outside,[],'Toolbar stays in bounds on narrow windows')
   await page.getByRole('tab',{name:'轨迹',exact:true}).click();await expect(page.getByTestId('view')).toHaveText('trace');await expect(focus).toHaveAttribute('aria-pressed','true')
   if(width===1440){
    await page.locator('[data-chat-flow]').evaluate(el=>el.style.width='min(520px,calc(100% - 48px))')
    const aligned=()=>expect.poll(()=>page.evaluate(()=>Math.abs(document.querySelector('[data-conversation-tabs]').getBoundingClientRect().left-document.querySelector('article').getBoundingClientRect().left))).toBeLessThan(1)
    await aligned()
    await page.locator('article').evaluate(el=>{el.removeAttribute('data-chat-flow');el.setAttribute('data-dcb-view-width','shared');el.style.width='min(620px,calc(100% - 48px))'})
    await aligned()
    await page.locator('article').evaluate(el=>{el.setAttribute('data-chat-flow','');el.removeAttribute('data-dcb-view-width');el.style.removeProperty('width')})
    await aligned()
    if(!centered){
     const reads=await page.evaluate(async()=>{
      await new Promise(done=>setTimeout(done,100))
      const flow=document.querySelector('article'),header=document.querySelector('header'),original=Element.prototype.getBoundingClientRect,paragraph=document.createElement('p');let reads=0
      Element.prototype.getBoundingClientRect=function(...args){if(this===flow||this===header)reads++;return original.apply(this,args)}
      try{paragraph.textContent='流式文字追加。'.repeat(1000);flow.append(paragraph);await new Promise(done=>setTimeout(done,160));return reads}finally{Element.prototype.getBoundingClientRect=original;paragraph.remove()}
     })
     assert.equal(reads,0,'Streaming height changes do not recalculate header alignment')
    }
   }
   await page.screenshot({path:resolve(output,'compact-'+width+'-'+centered+'.png')})
   if(width===1440)await toggle();else{await page.keyboard.press('Escape');await idle()}
   await expect(page.locator('.cr_titleCluster')).toBeVisible()
   assert.equal(await header.evaluate(el=>el.style.getPropertyValue('--dcb-focus-content-left')),'','Focus-only alignment is released on exit')
   assert.ok(Math.abs((await header.boundingBox()).height-before.height)<1,'Leaving restores the native title and header height')
   assert.equal(await page.evaluate(()=>document.querySelector('textarea')===window.savedFocusDraft&&localStorage.getItem('dsh-claude-beautify:settings:v1')===window.savedFocusPreferences),true)
   checks.push({centered,width,height:compact.height,originalHeight:before.height});console.log('PASS compact focus header '+width+' centered='+centered)
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});await focus.click();await idle();assert.ok((await header.boundingBox()).height<=48)
 await page.evaluate(()=>{document.body.setAttribute('data-ds-dark-theme','')});await page.screenshot({path:resolve(output,'compact-dark.png')})
 await page.evaluate(()=>{for(const cleanup of window.cleanups.reverse())cleanup?.()});await expect(page.locator('.cr_titleCluster')).toBeVisible();assert.equal(await page.locator('[data-dcb-focus-hidden],[data-dcb-focus-frame]').count(),0)
 assert.deepEqual(errors,[]);writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,checks,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
