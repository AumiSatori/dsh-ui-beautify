import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'conversation-tabs')
mkdirSync(output,{recursive:true})
const built=await build({stdin:{contents:"export * from './src/conversation-tabs.js';export * from './src/session-motion.js'",resolveDir:project},bundle:true,write:false,format:'iife',globalName:'Tabs'})
let native='',nativeCSS='',source='public-marker React fixture'
if(process.env.DSH_ASAR){
  const fd=openSync(process.env.DSH_ASAR,'r')
  try{
    const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
    const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
    let entry=JSON.parse(json.toString())
    for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js'.split('/'))entry=entry.files[part]
    const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset))
    const text=bytes.toString(),at=text.indexOf('ConversationRoot.module.css')
    const literal=text.slice(text.lastIndexOf('//#region',at),text.indexOf('//#endregion',at)).match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)
    assert.ok(literal,'Installed ConversationRoot stylesheet exists')
    nativeCSS=JSON.parse(literal[1]);nativeCSS=nativeCSS.replaceAll(nativeCSS.match(/\.([\w-]+)_root\{/)[1]+'_','cr_')
    for(const name of['DefaultConversationViews','ConversationSession','ConversationWidthControls']){
      const start=text.indexOf(`//#region lib/types/client/skeleton/${name}.js`),end=text.indexOf('//#endregion',start)
      assert.ok(start>=0&&end>start,`Installed ${name} is discoverable`)
      native+=text.slice(start,end)+'\n'
    }
    assert.ok(native.includes('"data-conversation-tabs"'))
    const start=text.indexOf('function resolveActiveView('),end=text.indexOf('//#endregion',start)
    native=text.slice(start,end)+'\n'+native
    source='installed DSH header, views, width controls and ConversationRoot CSS; synthetic sessions and view content'
  }finally{closeSync(fd)}
}
const fixture=await build({stdin:{resolveDir:project,loader:'jsx',contents:`
import React from 'react';import * as jsxRuntime from 'react/jsx-runtime';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
const _deepseek_ai_dsh_client_ui_primitives={Tooltip:({children})=>children};const FIXED_VIEW_ID="chat";const react=React,react_jsx_runtime=jsxRuntime,clsx=(...values)=>values.filter(Boolean).join(' '),ConversationRoot_module_css_default=new Proxy({},{get:(_,key)=>'cr_'+key}),conversationPhase=()=> 'active';
${native}
const views=[{id:'chat',label:'对话'},{id:'trace',label:'轨迹'},{id:'context',label:'上下文'}],listeners=new Set();
let state={view:'chat',session:'a',stream:0,epoch:0,fixed:false,empty:false,replace:false,hidden:false,resize:false};
function update(patch){state={...state,...patch};flushSync(()=>{for(const fn of listeners)fn()})}
const useStore=selector=>selector(React.useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>state));
const useSession=selector=>selector({blank:false}),useConversation=selector=>selector({}),useConversationViews=selector=>selector(views),useInspectCall=selector=>selector(null);
const inputActions={persistDraft(){window.persisted=(window.persisted||0)+1}},actions={setDraft(){},completeViewRequest(){}},bindDraftPersistence=()=>()=>{};
function content(){return state.empty?null:<div data-slot="conversation.view" style={{display:'contents'}}><section key={state.replace?state.view:undefined} className="view-content" data-view={state.view} data-chat-flow={state.view==='chat'?'':undefined} data-conversation-composer-overlay={state.resize&&state.view!=='chat'?'':undefined}>
  <h2>{views.find(v=>v.id===state.view).label}</h2><p>滑动指示条 · 轻移与淡入 · 连续切换</p>
  {Array.from({length:5},(_,i)=><article key={i}><b>{['界面与交互','切换状态','滚动与输入','工作区记录','更多内容'][i]}</b><p>这里是用于检查界面的演示内容。</p><span>{state.stream}</span></article>)}
  <button id="inside-control" onClick={()=>window.insideClicks=(window.insideClicks||0)+1}>原生操作</button>
  {state.fixed&&<button id="fixed-control" style={{position:'fixed',right:20,top:20}}>固定操作</button>}
  <div role="tablist"><button role="tab" aria-selected="true">内部标签</button></div>
</section></div>}
const fallbackHeader=()=> <div className="cr_tabs" data-conversation-tabs role="tablist">{views.map(v=><button type="button" role="tab" className={'cr_tab'+(v.id===state.view?' cr_tabActive':'')} aria-selected={v.id===state.view} key={v.id} onClick={()=>selectView(v.id)}>{v.label}</button>)}</div>;
function selectView(view){window.nativeClicks=(window.nativeClicks||0)+1;update({view})}
function Fixture(){const snapshot=useStore(s=>s),[body,setBody]=React.useState(null);const slots=(name,props,options)=>name==='conversation.view'?content():null;
  const Header=${native?'ConversationSessionHeader':'fallbackHeader'},View=${native?'DefaultConversationViews':"()=> <div className='cr_viewArea'>{content()}</div>"};
  const WidthControls=${native?'ConversationWidthControls':'()=>null'};
  return <main className="cr_root" data-phase="active" key={snapshot.epoch} hidden={snapshot.hidden}><header className="cr_header">
    <Header sessionId={snapshot.session} useSessions={selector=>selector({byId:{[snapshot.session]:{id:snapshot.session,displayTitle:'界面设计'}}})} useConversationViews={useConversationViews} useEntryPins={selector=>selector([])} useEntryActions={selector=>selector(false)} useStore={useStore} renderSlot={slots} open={()=>{}} selectView={selectView} t={key=>key}/>
  </header><div ref={setBody} data-conversation-content data-conversation-session={snapshot.session} className="cr_body" data-content-phase="active"><div data-conversation-scroll className="cr_scrollBody">
    <View useConversationViews={useConversationViews} useInspectCall={useInspectCall} useEntryPins={selector=>selector([])} useEntryActions={selector=>selector(false)} useStore={useStore} useSession={useSession} useConversation={useConversation} inputActions={inputActions} actions={actions} bindDraftPersistence={bindDraftPersistence} renderSlot={slots}/>
    <div data-composer-seat className="cr_composerSeat"><div data-composer-card><textarea aria-label="演示输入" defaultValue="保留这段草稿"/><button aria-label="演示发送">↑</button></div></div>
  </div>{snapshot.resize&&<WidthControls container={body} phase="active"/>}</div></main>
}
const root=createRoot(document.getElementById('app'));flushSync(()=>root.render(<Fixture/>));
window.React=React;window.fixture={update,select:view=>[...document.querySelectorAll('[data-conversation-tabs] button')].find(el=>el.textContent===views.find(v=>v.id===view).label).click(),remount:()=>update({epoch:state.epoch+1}),unmount:()=>flushSync(()=>root.unmount())};
`},bundle:true,write:false,format:'iife'})
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const page=await browser.newPage({viewport:{width:1100,height:780}}),errors=[]
page.on('pageerror',error=>(errors.push(error.message),console.error('FIXTURE ERROR', error.message)))
await page.route('http://dcb-width.test/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html>'}))
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function tick(){await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))}
async function boot({reducedMotion='no-preference',forcedColors='none',noAPI=false}={}){
  await page.goto('http://dcb-width.test/');await page.evaluate(()=>localStorage.clear());await page.emulateMedia({reducedMotion,forcedColors})
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${nativeCSS}
  :root{--dsw-alias-label-primary:#252832;--dsw-alias-label-tertiary:#858996;--dsw-alias-state-business-primary:#6871df;--dsw-alias-border-l4:#e2e3e9}
  *{box-sizing:border-box}body{margin:0;font:14px/1.6 system-ui;background:#fafbfc;color:#252832}button,textarea{font:inherit;color:inherit}
  #app{height:100vh;padding:18px 52px}.cr_root{height:100%;display:flex;flex-direction:column;min-height:0;border:1px solid #e2e3e9;border-radius:18px;background:#fff;overflow:hidden}
  .cr_header{flex:none;display:block;padding:20px 28px 0;border-bottom:1px solid #e2e3e9}.cr_titleRow{display:flex}.cr_crumb{font-weight:600}.cr_tabs{position:relative;display:flex;gap:36px;margin-top:10px;padding-left:8px}
  .cr_tab{position:relative;cursor:pointer;border:0;background:none;padding:0 0 9px;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:16px}.cr_tabActive{color:var(--dsw-alias-state-business-primary)}
  .cr_tab::after{content:'';position:absolute;left:0;right:0;height:2px;bottom:-1px;border-radius:2px}.cr_tabActive::after{background:var(--dsw-alias-state-business-primary)}
  .cr_body{display:flex;flex-direction:column;flex:1;min-height:0;position:relative}.cr_scrollBody{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;scrollbar-gutter:stable}
  .cr_viewArea{display:flex;flex-direction:column;flex:1 0 auto;min-height:0}.view-content{padding:28px 46px}.view-content h2{margin:0}.view-content article{padding:22px;margin:18px 0;border:1px solid #e8e9ee;border-radius:15px;background:#f9fafc}
  .cr_composerSeat{position:sticky;bottom:0;flex:none;padding:14px 32px;background:#fff}.cr_composerSeat [data-composer-card]{display:flex;align-items:center;padding:14px 18px;border:1px solid #dfe2e9;border-radius:18px;background:#f8f9fc}
  textarea{display:block;height:44px;resize:none;flex:1;border:0;background:transparent;outline:none}.cr_composerSeat button{border:0;border-radius:50%;width:30px;height:30px;background:#6871df;color:#fff}
  [hidden]{display:none!important}body.dark{background:#101219;color:#e5e7ed;--dsw-alias-label-primary:#e5e7ed;--dsw-alias-label-tertiary:#9b9eae;--dsw-alias-state-business-primary:#a4abff}body.dark .cr_root{background:#191d27;border-color:#353b4b}body.dark article,body.dark .cr_composerSeat,body.dark [data-composer-card]{background:#222735;border-color:#3b4253}
  </style><div id="app"></div>`)
  await page.evaluate(noAPI=>{
    window.calls=[];window.freeze=true;window.hiddenState=false
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.hiddenState})
    const animate=Element.prototype.animate
    Element.prototype.animate=noAPI?undefined:function(frames,options){const a=animate.call(this,frames,options);window.calls.push({a,el:this,frames,options});if(window.freeze){a.pause();a.currentTime=0}return a}
    window.frameAt=time=>{for(const c of window.calls)if(c.a.playState!=='idle'){c.a.pause();c.a.currentTime=time}}
    window.complete=async()=>{for(const c of window.calls)if(c.a.playState!=='idle')c.a.finish();await Promise.resolve()}
  },noAPI)
  await page.addScriptTag({content:fixture.outputFiles[0].text});await page.addScriptTag({content:built.outputFiles[0].text})
  await page.evaluate(()=>{
    const style=document.createElement('style');style.textContent=Tabs.conversationTabsCss;document.head.append(style)
    let frame=0;window.scheduleTabs=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;window.tabs.sync();window.sessionMotion.sync(window.sessionEnabled!==false)})}
    window.tabs=Tabs.createConversationTabs(document,window,window.scheduleTabs)
    window.sessionMotion=Tabs.createSessionMotion(document,window)
    window.observer=new MutationObserver(window.scheduleTabs);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-selected','data-conversation-session','class','hidden']})
    window.addEventListener('resize',window.scheduleTabs);document.addEventListener('scroll',window.scheduleTabs,true)
    tabs.sync();sessionMotion.sync()
  });await tick()
}
async function select(view){await page.evaluate(view=>window.fixture.select(view),view);await tick()}
async function complete(){await page.evaluate(()=>window.complete());await tick()}
async function widthFixture(){
  await page.setViewportSize({width:1440,height:780});await boot()
  await page.addStyleTag({content:'.view-content[data-chat-flow]{width:min(var(--dsh-chat-content-width),calc(100% - 64px));align-self:center}.view-content{min-width:0}'})
  await page.evaluate(()=>{localStorage.setItem('dsh.conversation.contentWidth','720');window.widthEditor=document.querySelector('textarea');window.fixture.update({resize:true})});await tick()
}
async function widthState(){return page.evaluate(()=>({width:document.querySelector('[data-view]').getBoundingClientRect().width,saved:Number(localStorage.getItem('dsh.conversation.contentWidth')),composer:getComputedStyle(document.querySelector('[data-composer-seat]')).getPropertyValue('--dsh-chat-content-width').trim(),draft:window.widthEditor===document.querySelector('textarea')}))}
async function dragWidth(side,dx,{finish=true}={}){
  const handle=page.locator(`[data-width-handle=${side}]`),box=await handle.boundingBox()
  assert.ok(box&&box.width>0,side+' width handle is visible with a usable hit area')
  const x=box.x+box.width/2,y=box.y+Math.min(160,box.height/2)
  const hit=await page.evaluate(({x,y,side})=>{const target=document.elementFromPoint(x,y);return {valid:target?.getAttribute('data-width-handle')===side,target:target?.outerHTML.slice(0,240),stack:document.elementsFromPoint(x,y).slice(0,6).map(el=>({tag:el.tagName,class:el.className,z:getComputedStyle(el).zIndex,position:getComputedStyle(el).position}))}},{x,y,side})
  assert.equal(hit.valid,true,side+' handle receives pointer input: '+JSON.stringify({box,hit}))
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:4});await tick()
  assert.equal(await handle.evaluate(el=>el.hasAttribute('data-dragging')),true,'native pointer capture remains active during resize')
  if(finish){await page.mouse.up();await tick()}
}
async function geometry(){return page.evaluate(()=>{
  const tabs=document.querySelector('[data-conversation-tabs]'),indicator=tabs.querySelector('[data-dcb-conversation-indicator]'),selected=tabs.querySelector('[aria-selected=true]'),s=indicator.getBoundingClientRect(),b=selected.getBoundingClientRect()
  return {x:s.x,width:s.width,expectedX:b.x,expectedWidth:b.width,top:s.y,selected:selected.textContent,indicator:indicator.outerHTML}
})}
async function motion(){return page.evaluate(()=>window.calls.filter(c=>c.a.id==='dcb-conversation-view'&&c.a.playState!=='idle').map(c=>{const s=getComputedStyle(c.el),m=new DOMMatrix(s.transform);return {opacity:Number(s.opacity),x:m.m41,filter:s.filter,style:c.el.getAttribute('style'),frames:c.frames}}))}
async function heavyView({rows=1200,dense=false}={}){
  await page.evaluate(({rows,dense})=>{
    const root=document.querySelector('[data-view]'),fragment=document.createDocumentFragment()
    for(let i=0;i<rows;i++){
      const row=document.createElement('div');row.className='perf-row';row.style.height='36px'
      for(let j=0;j<8;j++){const span=document.createElement('span');span.textContent='演示片段 ';row.append(span)}
      fragment.append(row)
    }
    if(dense){root.style.height='520px';root.style.overflow='auto'}
    root.append(fragment)
  },{rows,dense});await tick()
}
async function profile(){
  const results=[]
  for(const dense of[false,true]){
    await boot();await heavyView({dense})
    const result=await page.evaluate(async dense=>{
      const get=window.getComputedStyle.bind(window),query=Element.prototype.querySelectorAll
      let styles=0,queries=0;window.getComputedStyle=(...args)=>{styles++;return get(...args)}
      Element.prototype.querySelectorAll=function(...args){queries++;return query.apply(this,args)}
      const times=[];for(let i=0;i<40;i++){const start=performance.now();window.tabs.sync();times.push(performance.now()-start)}
      const idle={styles,queries,ms:times.reduce((a,b)=>a+b,0)};styles=0;queries=0
      window.freeze=false;const start=performance.now();window.fixture.select('context')
      await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))
      const switchCost={styles,queries,ms:performance.now()-start}
      const active=window.calls.find(c=>c.a.id==='dcb-conversation-view'&&c.a.playState!=='idle')
      const frames=[],sampleStart=performance.now();let last=sampleStart
      await new Promise(done=>{function frame(now){frames.push(now-last);last=now;if(now-sampleStart<320)requestAnimationFrame(frame);else done()}requestAnimationFrame(frame)})
      window.getComputedStyle=get;Element.prototype.querySelectorAll=query
      frames.sort((a,b)=>a-b)
      return {dense,nodes:document.querySelector('[data-view]').querySelectorAll('*').length,height:document.querySelector('[data-view]').getBoundingClientRect().height,idle,switchCost,animatedHeight:active?.el.getBoundingClientRect().height??0,filterAnimated:!!active?.frames.some(f=>'filter'in f),frameP95:frames[Math.floor(frames.length*.95)],frames:frames.length}
    },dense)
    results.push(result)
  }
  const report={scenario:'1200 rows, 8 fragments each; installed native header and view with synthetic content',results}
  writeFileSync(resolve(output,`performance-${process.env.DSH_TABS_PROFILE}.json`),JSON.stringify(report,null,2)+'\n')
  console.log(JSON.stringify({performance:report}))
}
try{
  if(process.env.DSH_TABS_PROFILE)await profile()
  await check('session switches fade only the clipped viewport, preserve draft/scroll and smoothly interrupt the previous transition',async()=>{
    await boot();await page.evaluate(()=>{window.sessionDraft=document.querySelector('textarea');document.querySelector('[data-conversation-scroll]').scrollTop=100});await tick()
    const before=await page.locator('textarea').boundingBox(),scroll=await page.locator('[data-conversation-scroll]').evaluate(el=>el.scrollTop)
    await page.evaluate(()=>window.fixture.update({session:'b'}));await tick()
    let calls=await page.evaluate(()=>window.calls.filter(c=>c.a.id==='dcb-conversation-session'&&c.a.playState!=='idle').map(c=>({target:c.el.hasAttribute('data-conversation-scroll'),frames:c.frames})))
    assert.equal(calls.length,1);assert.equal(calls[0].target,true);assert.equal(Object.keys(calls[0].frames[0]).join(','),'opacity')
    await page.evaluate(()=>window.frameAt(100));const mid=await page.locator('[data-conversation-scroll]').evaluate(el=>getComputedStyle(el).opacity)
    assert.ok(Number(mid)>.68&&Number(mid)<1)
    await page.screenshot({path:resolve(output,'session-transition-middle.png')})
    await page.evaluate(()=>window.fixture.update({session:'a'}));await tick()
    calls=await page.evaluate(()=>window.calls.filter(c=>c.a.id==='dcb-conversation-session'&&c.a.playState!=='idle').map(c=>c.frames))
    assert.equal(calls.length,1);assert.ok(Math.abs(Number(calls[0][0].opacity)-Number(mid))<.01)
    await complete();assert.deepEqual(await page.locator('textarea').boundingBox(),before);assert.equal(await page.locator('[data-conversation-scroll]').evaluate(el=>el.scrollTop),scroll)
    assert.equal(await page.evaluate(()=>window.sessionDraft===document.querySelector('textarea')),true)
    assert.equal(await page.locator('textarea').inputValue(),'保留这段草稿')
  })
  await check('session motion survives a replaced conversation root and waits for late content without replaying on streamed text',async()=>{
    await boot();await page.evaluate(()=>window.fixture.update({session:'b',epoch:1,empty:true}));await tick()
    assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.a.id==='dcb-conversation-session').length),0)
    await page.evaluate(()=>window.fixture.update({empty:false}));await tick()
    assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.a.id==='dcb-conversation-session').length),1)
    await complete();await page.evaluate(()=>window.fixture.update({stream:15}));await tick()
    assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.a.id==='dcb-conversation-session').length),1)
  })
  await check('long histories use one viewport fade with bounded reads; session effects honor reduced motion, disabling and cleanup',async()=>{
    await boot();await heavyView()
    await page.evaluate(()=>{window.sessionStyleReads=0;const original=window.getComputedStyle.bind(window);window.getComputedStyle=(...args)=>{window.sessionStyleReads++;return original(...args)};window.fixture.update({session:'b'})});await tick()
    assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.a.id==='dcb-conversation-session'&&c.a.playState!=='idle').length),1)
    assert.ok(await page.evaluate(()=>window.sessionStyleReads<100))
    await page.emulateMedia({reducedMotion:'reduce'});await tick();assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='dcb-conversation-session').length),0)
    await page.evaluate(()=>window.fixture.update({session:'a'}));await tick();assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.a.id==='dcb-conversation-session').length),1)
    await boot();await page.evaluate(()=>{window.sessionEnabled=false;window.fixture.update({session:'b'})});await tick()
    assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.a.id==='dcb-conversation-session').length),0)
    await page.evaluate(()=>window.sessionMotion.dispose());await page.evaluate(()=>window.fixture.update({session:'a'}));await tick()
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='dcb-conversation-session').length),0)
  })
  await check('session effects skip hidden pages, forced colors and missing WAAPI and release after natural playback',async()=>{
    for(const options of [{forcedColors:'active'},{noAPI:true}]){
      await boot(options);await page.evaluate(()=>window.fixture.update({session:'b'}));await tick()
      assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.a.id==='dcb-conversation-session').length),0)
    }
    await boot();await page.evaluate(()=>{window.hiddenState=true;document.dispatchEvent(new Event('visibilitychange'));window.fixture.update({session:'b'})});await tick()
    assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.a.id==='dcb-conversation-session').length),0)
    await boot();await page.evaluate(()=>{window.freeze=false;window.fixture.update({session:'b'})});await tick()
    await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-conversation-session'))
    await page.waitForFunction(()=>!document.getAnimations().some(a=>a.id==='dcb-conversation-session'))
    assert.equal(await page.locator('[data-conversation-scroll]').evaluate(el=>getComputedStyle(el).opacity),'1')
  })
  await check('session transitions stay legible in a narrow dark viewport and leave no persistent visual layer',async()=>{
    await boot();await page.setViewportSize({width:560,height:780});await page.evaluate(()=>{document.body.classList.add('dark');window.fixture.update({session:'b'})});await tick()
    await page.evaluate(()=>window.frameAt(90))
    const value=await page.locator('[data-conversation-scroll]').evaluate(el=>({opacity:Number(getComputedStyle(el).opacity),transform:getComputedStyle(el).transform,filter:getComputedStyle(el).filter}))
    assert.ok(value.opacity>.68&&value.opacity<1);assert.equal(value.transform,'none');assert.equal(value.filter,'none')
    await page.screenshot({path:resolve(output,'session-transition-dark-narrow.png')});await complete()
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    assert.equal(await page.locator('[data-conversation-scroll]').evaluate(el=>el.style.willChange),'')
    await page.setViewportSize({width:1100,height:780})
  })
  if(native)await check('native left and right handles resize overlay views live, persist one shared width and retain the composer draft',async()=>{
    await widthFixture();await select('trace');await complete()
    const area=page.locator('.cr_viewArea')
    await area.evaluate(el=>el.removeAttribute('data-dcb-view-width'))
    assert.equal(await page.locator('[data-width-handle=left]').isVisible(),false,'the installed native overlay rule reproduces the original hidden handles')
    await area.evaluate(el=>el.setAttribute('data-dcb-view-width','shared'))
    let expected=720
    for(const [view,side,dx]of [['trace','right',30],['trace','left',-20],['context','left',25],['context','right',-30]]){
      await select(view);await complete();await dragWidth(side,dx,{finish:false});expected+=(side==='right'?dx:-dx)*2
      let live=await widthState();assert.ok(Math.abs(live.width-expected)<.5,JSON.stringify(live));assert.notEqual(live.saved,expected,'preference is committed only on pointer up')
      await page.mouse.up();await tick();live=await widthState();assert.equal(live.saved,expected);assert.equal(parseFloat(live.composer),expected);assert.equal(live.draft,true)
    }
    await select('chat');await complete();assert.ok(Math.abs((await widthState()).width-expected)<.5)
    await select('trace');await complete();await page.locator('[data-width-handle=right]').hover();await page.screenshot({path:resolve(output,'trace-width-handles.png')})
    assert.equal(await page.locator('textarea').inputValue(),'保留这段草稿')
  })
  if(native)await check('canceled native width drags restore the saved width; handles forward margin scrolling without blocking view controls',async()=>{
    await widthFixture();await select('trace');await complete()
    for(const event of ['pointercancel','lostpointercapture']){
      await dragWidth('right',35,{finish:false});assert.ok((await widthState()).width>720)
      await page.locator('[data-width-handle=right]').dispatchEvent(event);await page.mouse.up();await tick()
      const value=await widthState();assert.equal(value.saved,720);assert.ok(Math.abs(value.width-720)<.5)
      assert.equal(await page.locator('[data-dragging]').count(),0)
    }
    await page.locator('[data-width-handle=left]').hover();await page.mouse.wheel(0,220);await tick()
    await page.waitForFunction(()=>document.querySelector('[data-conversation-scroll]').scrollTop>0)
    await page.locator('#inside-control').click();assert.equal(await page.evaluate(()=>window.insideClicks),1)
  })
  if(native)await check('native width limits and persistence survive view changes and resizing; unloading restores the native overlay rule',async()=>{
    await widthFixture();await select('context');await complete();await dragWidth('right',-180)
    assert.equal((await widthState()).saved,640);await dragWidth('left',-150)
    const saved=(await widthState()).saved;assert.equal(saved,940)
    await page.setViewportSize({width:1000,height:780});await tick()
    assert.ok((await widthState()).width<saved,'native observer clamps the displayed width to the available column')
    assert.equal((await widthState()).saved,saved,'a temporary narrow viewport does not overwrite the saved preference')
    await page.setViewportSize({width:1440,height:780});await tick();assert.ok(Math.abs((await widthState()).width-saved)<.5)
    await page.evaluate(()=>window.fixture.remount());await tick();await complete();assert.ok(Math.abs((await widthState()).width-saved)<.5)
    await page.evaluate(()=>window.tabs.dispose());await tick();assert.equal(await page.locator('[data-width-handle=right]').isVisible(),false)
    await select('chat');await complete();assert.equal(await page.locator('[data-width-handle=right]').isVisible(),true,'native chat handles are unaffected by plugin unloading')
    await page.setViewportSize({width:1100,height:780})
  })
  await check('other views share the native chat width across selection, live width changes and narrow resizes without changing the composer',async()=>{
    await boot();await page.addStyleTag({content:'.view-content[data-chat-flow]{width:min(var(--dsh-chat-content-width),calc(100% - 64px));align-self:center;margin-inline:auto}.view-content{min-width:0}'});
    await page.evaluate(()=>{document.querySelector('[data-conversation-content]').style.setProperty('--dsh-chat-content-width','720px');window.widthEditor=document.querySelector('textarea')});await tick()
    const bounds=()=>page.locator('[data-view]').boundingBox()
    const chat=await bounds();assert.ok(Math.abs(chat.width-720)<.5)
    assert.equal(await page.locator('[data-dcb-view-width]').count(),0,'the existing native chat column keeps its layout')
    for(const view of ['trace','context']){await select(view);await complete();const r=await bounds();assert.ok(Math.abs(r.width-chat.width)<.5&&Math.abs(r.x-chat.x)<.5,view+' matches the chat column')}
    await page.evaluate(()=>document.querySelector('[data-conversation-content]').style.setProperty('--dsh-chat-content-width','860px'));await tick();assert.ok(Math.abs((await bounds()).width-860)<.5)
    await select('chat');await complete();const wide=await bounds();assert.ok(Math.abs(wide.width-860)<.5)
    await page.setViewportSize({width:560,height:780});await tick();const narrow=await bounds();assert.ok(narrow.width<454)
    for(const view of ['trace','context']){await select(view);await complete();const r=await bounds();assert.ok(Math.abs(r.width-narrow.width)<.5&&Math.abs(r.x-narrow.x)<.5)}
    assert.equal(await page.evaluate(()=>window.widthEditor===document.querySelector('textarea')),true);assert.equal(await page.locator('textarea').inputValue(),'保留这段草稿')
    await page.evaluate(()=>window.tabs.dispose());assert.equal(await page.locator('[data-dcb-view-width]').count(),0)
    await page.setViewportSize({width:1100,height:780})
  })
  await check('native tabs retain their identity and initial selected underline without entrance or nested-tab decorations',async()=>{
    await boot();const g=await geometry();assert.ok(Math.abs(g.x-g.expectedX)<.1&&Math.abs(g.width-g.expectedWidth)<.1)
    assert.equal(await page.evaluate(()=>window.calls.length),0)
    assert.equal(await page.locator('[data-dcb-conversation-indicator]').count(),1)
    await page.evaluate(()=>window.originalTab=document.querySelector('[data-conversation-tabs] button'))
    await page.screenshot({path:resolve(output,'tabs-initial.png')})
  })
  await check('native click stretches one liquid underline and fades/translates small views without a filter at intermediate frames',async()=>{
    const before=await geometry();await select('context');await page.evaluate(()=>window.frameAt(55));const mid=await geometry(),m=(await motion())[0]
    assert.ok(mid.x>before.x+2&&mid.x<mid.expectedX-1);assert.ok(mid.width>before.width&&mid.width<mid.expectedX+mid.expectedWidth-before.x)
    const shape=await page.locator('[data-dcb-conversation-indicator] path').evaluate(el=>({d:getComputedStyle(el).d,rest:el.getAttribute('d'),filter:getComputedStyle(el).filter}))
    assert.notEqual(shape.d,`path("${shape.rest}")`);assert.equal(shape.filter,'none')
    assert.ok(m.opacity>0&&m.opacity<.98);assert.ok(m.x>1&&m.x<14);assert.equal(m.filter,'none')
    assert.ok(m.frames.every(frame=>!('filter'in frame)));assert.equal(await page.locator('[data-view]').getAttribute('data-view'),'context')
    assert.equal(await page.evaluate(()=>window.originalTab===document.querySelector('[data-conversation-tabs] button')),true)
    assert.equal(await page.evaluate(()=>window.nativeClicks),1)
    await page.screenshot({path:resolve(output,'tabs-middle.png')});await complete();const end=await geometry()
    assert.ok(Math.abs(end.x-end.expectedX)<.1&&Math.abs(end.width-end.expectedWidth)<.1)
    assert.equal(await page.locator('[data-dcb-conversation-motion],[data-dcb-conversation-clip],[data-moving]').count(),0)
    assert.equal(await page.locator('[data-view]').getAttribute('style'),null)
    await page.screenshot({path:resolve(output,'tabs-context.png')})
  })
  await check('rapid reverse switching carries the current visual position and settles on the last native selection',async()=>{
    await select('chat');await page.evaluate(()=>window.frameAt(65));const first=await geometry(),m1=(await motion())[0]
    await select('trace');const second=await geometry(),m2=(await motion())[0]
    assert.ok(Math.abs(first.x-second.x)<.2);assert.ok(Math.abs(m1.opacity-m2.opacity)<.01);assert.ok(Math.abs(m1.x-m2.x)<.1)
    await page.evaluate(()=>window.frameAt(45));await select('context');await select('chat');await complete()
    const end=await geometry();assert.equal(end.selected,'对话');assert.ok(Math.abs(end.x-end.expectedX)<.1)
    assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.a.playState!=='idle').length),0)
  })
  await check('streaming, clicking the selected tab and scrolling do not replay content animation',async()=>{
    const count=await page.evaluate(()=>window.calls.length)
    await page.evaluate(()=>{window.fixture.update({stream:7});document.querySelector('[data-conversation-scroll]').scrollTop=120})
    await tick();await select('chat');assert.equal(await page.evaluate(()=>window.calls.length),count)
  })
  await check('draft, selection, focus, scroll geometry and composer coordinates remain unchanged across a programmatic switch',async()=>{
    const snapshot=()=>page.evaluate(()=>{const sc=document.querySelector('[data-conversation-scroll]'),input=document.querySelector('textarea'),r=document.querySelector('[data-composer-seat]').getBoundingClientRect();return {scroll:sc.scrollTop,width:sc.scrollWidth,height:sc.scrollHeight,clientWidth:sc.clientWidth,clientHeight:sc.clientHeight,draft:input.value,start:input.selectionStart,end:input.selectionEnd,focus:document.activeElement===input,composer:[r.x,r.y,r.width,r.height]}})
    await page.evaluate(()=>{const input=document.querySelector('textarea');input.focus();input.setSelectionRange(2,5);document.querySelector('[data-conversation-scroll]').scrollTop=100})
    const before=await snapshot();await page.evaluate(()=>window.fixture.update({view:'context'}));await tick();await page.evaluate(()=>window.frameAt(70));assert.deepEqual(await snapshot(),before)
    await complete();assert.deepEqual(await snapshot(),before)
  })
  await check('Enter and Space still invoke native handlers, and content controls end temporary clipping before their action',async()=>{
    await page.getByRole('tab',{name:'轨迹',exact:true}).press('Enter');await tick();assert.equal(await page.locator('[data-view]').getAttribute('data-view'),'trace');await complete()
    await page.getByRole('tab',{name:'上下文',exact:true}).press('Space');await tick();assert.equal(await page.locator('[data-view]').getAttribute('data-view'),'context')
    await page.locator('#inside-control').click();assert.equal(await page.evaluate(()=>window.insideClicks),1)
    assert.equal(await page.locator('[data-dcb-conversation-motion],[data-dcb-conversation-clip]').count(),0);await complete()
  })
  await check('session changes cancel old effects, remounts create one indicator and detached content is released',async()=>{
    await select('chat');await page.evaluate(()=>window.fixture.update({session:'b',view:'trace'}));await tick()
    assert.equal((await motion()).length,0);assert.equal(await page.locator('[data-moving]').count(),0)
    await page.evaluate(()=>window.fixture.remount());await tick();assert.equal(await page.locator('[data-dcb-conversation-indicator]').count(),1)
    await select('context');await page.evaluate(()=>window.fixture.update({replace:true}));await tick()
    assert.equal((await motion()).length,0);assert.equal(await page.locator('[data-dcb-conversation-clip]').count(),0);await complete()
  })
  await check('late-mounted views enter once and later content replacement or streaming never replays the switch',async()=>{
    await page.evaluate(()=>window.fixture.update({empty:true}));await tick();await select('chat')
    assert.equal((await motion()).length,0)
    await page.evaluate(()=>window.fixture.update({empty:false}));await tick();assert.equal((await motion()).length,1);await complete()
    const before=await page.evaluate(()=>window.calls.length);await page.evaluate(()=>window.fixture.update({stream:22}));await tick();assert.equal(await page.evaluate(()=>window.calls.length),before)
  })
  await check('a view with fixed controls fades without changing the fixed containing block',async()=>{
    await page.evaluate(()=>window.fixture.update({fixed:true}));await tick()
    const before=await page.locator('#fixed-control').boundingBox();await select('trace');await page.evaluate(()=>window.frameAt(60));const m=(await motion())[0]
    assert.ok(m.opacity>0&&m.opacity<1);assert.equal(m.x,0);assert.equal(m.filter,'none');assert.deepEqual(await page.locator('#fixed-control').boundingBox(),before)
    await complete();await page.evaluate(()=>window.fixture.update({fixed:false}));await tick()
  })
  await check('dark theme, narrow resize, RTL and label-size changes keep the underline aligned',async()=>{
    await page.evaluate(()=>document.body.classList.add('dark'));await page.setViewportSize({width:560,height:780});await tick();await complete()
    await select('context');await page.evaluate(()=>window.frameAt(65));await page.screenshot({path:resolve(output,'tabs-dark-middle.png')});await complete()
    await page.evaluate(()=>document.querySelector('[data-conversation-tabs]').dir='rtl');await page.evaluate(()=>window.scheduleTabs());await tick();await complete();let g=await geometry();assert.ok(Math.abs(g.x-g.expectedX)<.1)
    await page.locator('[data-conversation-tabs] [aria-selected=true]').evaluate(el=>el.style.fontSize='18px');await tick();await complete();g=await geometry();assert.ok(Math.abs(g.width-g.expectedWidth)<.1)
    await page.setViewportSize({width:1100,height:780})
  })
  await check('rendered underline stays on the native baseline under fractional scale, zoom, borders, insets and horizontal scroll',async()=>{
    await boot()
    await page.addStyleTag({content:'.cr_tabs{border:1.25px solid transparent;padding:3.5px 8.25px 2.75px;gap:35.5px}.cr_tab::after{left:2.5px;right:3.25px;height:3px;bottom:-1.5px}'})
    const measured=()=>page.evaluate(()=>{
      const tabs=document.querySelector('[data-conversation-tabs]'),button=tabs.querySelector('[aria-selected=true]'),indicator=tabs.querySelector('[data-dcb-conversation-indicator]'),path=indicator.querySelector('path'),a=path.getBoundingClientRect(),b=button.getBoundingClientRect(),s=getComputedStyle(button),pseudo=getComputedStyle(button,'::after')
      const px=value=>parseFloat(value)||0,boxWidth=px(s.width)+(s.boxSizing==='border-box'?0:px(s.paddingLeft)+px(s.paddingRight)+px(s.borderLeftWidth)+px(s.borderRightWidth)),boxHeight=px(s.height)+(s.boxSizing==='border-box'?0:px(s.paddingTop)+px(s.paddingBottom)+px(s.borderTopWidth)+px(s.borderBottomWidth)),sx=b.width/boxWidth,sy=b.height/boxHeight
      const expected={left:b.left+(px(s.borderLeftWidth)+px(pseudo.left))*sx,right:b.right-(px(s.borderRightWidth)+px(pseudo.right))*sx,top:b.bottom-(px(s.borderBottomWidth)+px(pseudo.bottom)+px(pseudo.height))*sy,height:px(pseudo.height)*sy}
      return {actual:{left:a.left,right:a.right,top:a.top,height:a.height},expected}
    })
    for(const style of [{transform:'scale(.83,.91)',transformOrigin:'top left'},{zoom:'1.15'},{transform:'scale(1.17,.86)',transformOrigin:'top left',zoom:'.9'}]){
      await page.locator('#app').evaluate((el,style)=>{el.removeAttribute('style');Object.assign(el.style,style)},style)
      await page.evaluate(()=>window.scheduleTabs());await tick();await complete()
      for(const view of ['chat','trace','context']){
        await select(view);await complete();const result=await measured()
        for(const key of ['left','right','top','height'])assert.ok(Math.abs(result.actual[key]-result.expected[key])<.12,`${key}: ${JSON.stringify(result)}`)
      }
    }
    await page.locator('#app').evaluate(el=>el.removeAttribute('style'))
    await page.locator('[data-conversation-tabs]').evaluate(el=>{el.style.maxWidth='145px';el.style.overflowX='auto';el.querySelectorAll('button').forEach(button=>button.style.flexShrink=0);el.scrollLeft=45})
    await page.evaluate(()=>window.scheduleTabs());await tick();await complete();const scrolled=await measured()
    assert.ok(Math.abs(scrolled.actual.left-scrolled.expected.left)<.12&&Math.abs(scrolled.actual.top-scrolled.expected.top)<.12,JSON.stringify(scrolled))
  })
  await check('the leading drop, thin neck and elastic tail render in both directions and resume from their current shape on reversal',async()=>{
    await boot()
    const sample=()=>page.evaluate(()=>{
      const indicator=document.querySelector('[data-dcb-conversation-indicator]'),path=indicator.querySelector('path'),rect=indicator.getBoundingClientRect(),box=path.getBoundingClientRect(),length=path.getTotalLength(),sides=[[],[]]
      for(let i=0;i<=400;i++){const p=path.getPointAtLength(length*i/400);if(p.x>=10&&p.x<=20)sides[0].push(p.y);if(p.x>=80&&p.x<=90)sides[1].push(p.y)}
      return{x:rect.x,width:rect.width,thickness:box.height,edges:sides.map(values=>Math.max(...values)-Math.min(...values)),path:getComputedStyle(path).d,animations:indicator.getAnimations().length+path.getAnimations().length}
    })
    for(const view of ['context','chat']){
      const before=await geometry();await select(view)
      const frames=[]
      for(const time of [35,70,105,140,200,260]){await page.evaluate(time=>window.frameAt(time),time);frames.push({time,...await sample()})}
      const mid=frames.reduce((a,b)=>a.thickness>b.thickness?a:b)
      assert.ok(mid.width>Math.max(before.width,(await geometry()).expectedWidth)+8,'the liquid bridge stretches across the gap')
      assert.ok(mid.thickness>4&&mid.thickness<10,JSON.stringify(frames))
      assert.ok(frames.filter(frame=>frame.thickness>3).length>=3,'the flowing drop is visible across several middle frames')
      const [neck,head]=view==='context'?mid.edges:[...mid.edges].reverse()
      assert.ok(head>neck*1.7,'the leading drop is visibly thicker than the trailing neck in the travel direction')
      assert.equal(mid.animations,2,'only the tiny underline position and path are animated')
      await page.evaluate(time=>window.frameAt(time),mid.time)
      const header=await page.locator('.cr_header').boundingBox()
      await page.screenshot({path:resolve(output,`liquid-${view}-middle.png`),clip:{...header,height:header.height+12}})
      await complete();const end=await sample();assert.ok(Math.abs(end.thickness-2)<.1);assert.equal(end.animations,0)
    }
    await select('context');await page.evaluate(()=>window.frameAt(80));const before=await sample();await select('trace');const reversed=await sample()
    assert.ok(Math.abs(before.x-reversed.x)<.12&&Math.abs(before.width-reversed.width)<.12);assert.equal(before.path,reversed.path,'the new morph begins at the displayed silhouette')
    await complete();assert.equal(await page.locator('[data-moving]').count(),0)
  })
  await check('reduced motion and forced colors suppress effects, including preference changes during motion',async()=>{
    for(const options of[{reducedMotion:'reduce'},{forcedColors:'active'}]){
      await boot(options);await select('context');assert.equal(await page.evaluate(()=>window.calls.length),0)
      if(options.forcedColors)assert.equal(await page.locator('[data-dcb-conversation-tabs]').count(),0)
    }
    await boot();await select('trace');await page.emulateMedia({reducedMotion:'reduce'});await tick()
    assert.equal((await motion()).length,0);assert.equal(await page.locator('[data-moving],[data-dcb-conversation-clip]').count(),0)
    await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});await tick();assert.equal(await page.locator('[data-dcb-conversation-tabs]').count(),0)
  })
  await check('hidden pages and panels cancel motion; missing WAAPI still leaves native views and underline usable',async()=>{
    await boot();await select('context');await page.evaluate(()=>{window.hiddenState=true;document.dispatchEvent(new Event('visibilitychange'))});await tick();assert.equal((await motion()).length,0)
    await page.evaluate(()=>{window.hiddenState=false;document.dispatchEvent(new Event('visibilitychange'))});await tick();await select('chat');await page.evaluate(()=>window.fixture.update({hidden:true}));await tick();assert.equal((await motion()).length,0)
    await boot({noAPI:true});await select('context');const g=await geometry();assert.equal(g.selected,'上下文');assert.ok(Math.abs(g.x-g.expectedX)<.1);assert.equal(await page.locator('[data-view]').getAttribute('data-view'),'context')
  })
  await check('dispose restores native underline and content, removes decorations and stops later animation',async()=>{
    await boot();await select('context');await page.evaluate(()=>window.tabs.dispose());await tick()
    assert.equal(await page.locator('[data-dcb-conversation-indicator],[data-dcb-conversation-tabs],[data-dcb-conversation-motion],[data-dcb-conversation-clip]').count(),0)
    assert.equal(await page.locator('[data-view]').getAttribute('style'),null)
    const before=await page.evaluate(()=>window.calls.length);await select('chat');assert.equal(await page.evaluate(()=>window.calls.length),before)
    assert.notEqual(await page.locator('.cr_tabActive').evaluate(el=>getComputedStyle(el,'::after').backgroundColor),'rgba(0, 0, 0, 0)')
  })
  await check('nested conversation panels animate only their own view and keep independent indicators',async()=>{
    await boot();await page.evaluate(()=>{
      const inner=document.createElement('div');inner.id='nested';inner.innerHTML='<header><div class="cr_tabs" data-conversation-tabs role="tablist"><button class="cr_tab" role="tab" aria-selected="true">内层对话</button><button class="cr_tab" role="tab" aria-selected="false">内层轨迹</button></div></header><div data-conversation-content data-conversation-session="nested"><div data-conversation-scroll><div class="cr_viewArea"><section>嵌套视图</section></div></div></div>'
      document.querySelector('[data-view]').append(inner)
    });await tick();assert.equal(await page.locator('[data-dcb-conversation-indicator]').count(),2)
    await page.evaluate(()=>document.querySelectorAll('#nested [role=tab]').forEach((el,i)=>el.setAttribute('aria-selected',String(i===1))));await tick()
    const targets=await page.evaluate(()=>window.calls.filter(c=>c.a.id==='dcb-conversation-view'&&c.a.playState!=='idle').map(c=>c.el.closest('[data-conversation-content]').getAttribute('data-conversation-session')))
    assert.deepEqual(targets,['nested']);await complete()
    await select('context');assert.equal((await motion()).length,1);await complete()
  })
  await check('natural playback renders changing intermediate frames and cleans up after its finite duration',async()=>{
    await boot()
    const samples=await page.evaluate(()=>new Promise(done=>{
      window.freeze=false;window.fixture.select('context');const start=performance.now(),result=[]
      function frame(){const call=window.calls.find(c=>c.a.id==='dcb-conversation-view'&&c.a.playState!=='idle');if(call){const style=getComputedStyle(call.el);result.push({opacity:Number(style.opacity),x:new DOMMatrix(style.transform).m41,blur:style.filter})}if(performance.now()-start<340)requestAnimationFrame(frame);else done(result)}requestAnimationFrame(frame)
    }))
    const middle=samples.filter(s=>s.opacity>.01&&s.opacity<.99&&s.x>.1&&s.x<14)
    assert.ok(middle.length>=3);assert.ok(new Set(middle.map(s=>s.opacity.toFixed(3))).size>=3)
    assert.ok(middle.every(s=>s.blur==='none'));assert.equal(await page.locator('[data-moving],[data-dcb-conversation-motion],[data-dcb-conversation-clip]').count(),0)
  })
  await check('long and dense views keep tab motion with bounded style work and never allocate a content animation layer',async()=>{
    for(const dense of[false,true]){
      await boot();await heavyView({dense})
      await page.evaluate(()=>{
        window.budgetReads=0;window.deepScans=0;window.originalStyle=window.getComputedStyle.bind(window);window.originalQuery=Element.prototype.querySelectorAll
        window.getComputedStyle=(...args)=>{window.budgetReads++;return window.originalStyle(...args)}
        Element.prototype.querySelectorAll=function(selector){if(selector==='*')window.deepScans++;return window.originalQuery.call(this,selector)}
      })
      await select('context')
      const metrics=await page.evaluate(()=>({reads:window.budgetReads,scans:window.deepScans,views:window.calls.filter(c=>c.a.id==='dcb-conversation-view').length,underline:window.calls.filter(c=>c.a.id==='dcb-conversation-indicator').length}))
      assert.ok(metrics.reads<140,JSON.stringify(metrics));assert.equal(metrics.scans,0);assert.equal(metrics.views,0);assert.equal(metrics.underline,1)
      assert.equal(await page.locator('[data-dcb-conversation-motion],[data-dcb-conversation-clip]').count(),0)
      await page.evaluate(()=>window.frameAt(55));const g=await geometry();assert.ok(g.x<g.expectedX-1);await complete()
    }
  })
  await check('resident seat caching avoids repeated transcript queries on streaming or scroll syncs and recovers replaced seats',async()=>{
    await boot();await heavyView()
    const reads=await page.evaluate(()=>{
      const query=Element.prototype.querySelectorAll,one=Element.prototype.querySelector;let count=0
      Element.prototype.querySelectorAll=function(selector){if(selector.includes('data-conversation-content')||selector.includes('viewArea'))count++;return query.call(this,selector)}
      Element.prototype.querySelector=function(selector){if(selector.includes('data-conversation-scroll'))count++;return one.call(this,selector)}
      for(let i=0;i<40;i++)window.tabs.sync()
      Element.prototype.querySelectorAll=query;Element.prototype.querySelector=one
      return count
    });assert.equal(reads,0)
    await page.evaluate(()=>window.fixture.remount());await tick();await select('context');assert.equal((await motion()).length,1);await complete()
  })
  await check('high pixel density and a growing transcript release oversized layers while retaining the native content and draft',async()=>{
    await boot();await page.evaluate(()=>Object.defineProperty(window,'devicePixelRatio',{configurable:true,value:3}));await select('context');assert.equal((await motion()).length,0);await complete()
    await boot();await select('context');assert.equal((await motion()).length,1);await heavyView();assert.equal((await motion()).length,0)
    assert.equal(await page.locator('[data-dcb-conversation-motion],[data-dcb-conversation-clip]').count(),0)
    assert.equal(await page.locator('textarea').inputValue(),'保留这段草稿');assert.equal(await page.locator('[data-view]').getAttribute('data-view'),'context')
  })
  await check('the complete client bundle activates the same tab manager and releases it on plugin unload',async()=>{
    await boot();await page.evaluate(()=>{window.tabs.dispose();window.sessionMotion.dispose();window.observer.disconnect();window.pluginCleanups=[];localStorage.setItem('dsh-ui-beautify:settings:v1',JSON.stringify({welcomeEnabled:false}));window.__ModuleLoader__={load(spec){window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.React)}}})
    await page.addScriptTag({content:readFileSync(resolve(project,'client.js'),'utf8')})
    await page.evaluate(()=>window.plugin.apply({slots:{inject(_name,fn){fn()},register(){return()=>{}}},effect(fn){window.pluginCleanups.push(fn())}}));await tick()
    assert.equal(await page.locator('[data-dcb-conversation-indicator]').count(),1)
    await select('trace');assert.equal((await motion()).length,1);await complete()
    if(native){
      await page.evaluate(()=>{localStorage.setItem('dsh.conversation.contentWidth','720');window.fixture.update({resize:true})});await tick()
      await dragWidth('left',-12);const value=await widthState();assert.equal(value.saved,744);assert.ok(Math.abs(value.width-744)<.5)
    }
    await page.evaluate(()=>window.fixture.update({session:'b'}));await tick()
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='dcb-conversation-session').length),1,'the complete client uses the session transition manager')
    await page.evaluate(()=>{for(const fn of window.pluginCleanups)fn?.()});await tick();assert.equal(await page.locator('[data-dcb-conversation-indicator]').count(),0)
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='dcb-conversation-session').length),0)
    if(native)assert.equal(await page.locator('[data-width-handle=left]').isVisible(),false,'the complete client also releases the overlay compatibility on unload')
  })
  assert.deepEqual(errors,[])
  console.log(JSON.stringify({passed,source,screenshots:output}))
}finally{await browser.close()}
