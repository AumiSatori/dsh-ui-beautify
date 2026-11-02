import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {selectSettingsCategory} from './settings-navigation.mjs'

const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/dsh-task-panel-modules'))
mkdirSync(out,{recursive:true})
const fixture=(await build({stdin:{resolveDir:root,contents:`import './test/fixture.jsx';import{createPortal}from'react-dom';window.fixtureCreatePortal=createPortal;`},bundle:true,write:false,format:'iife'})).outputFiles[0].text
const routes={'/':['text/html',readFileSync(resolve(root,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route)return res.writeHead(404).end();res.writeHead(200,{'content-type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-ui-beautify:settings:v1'
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1350,height:1000}}),errors=[],checks=[]
page.on('pageerror',error=>errors.push(error.message))
await page.addInitScript(()=>{
  const Original=MutationObserver;window.readingObservers=0
  window.MutationObserver=class extends Original{
    observe(target,options){if(options?.attributeFilter?.includes('data-index')&&!this.reading){this.reading=true;window.readingObservers++}return super.observe(target,options)}
    disconnect(){if(this.reading){this.reading=false;window.readingObservers--}return super.disconnect()}
  }
})
const all={progress:true,outputs:true,resources:true},none={progress:false,outputs:false,resources:false}
const entry=()=>page.getByRole('button',{name:'会话进度与输出',exact:true}),card=()=>page.locator('.dcb-summary'),label=()=>page.locator('.dcb-entry-label-text').first()
const rows=[{event:{type:'turn/start',seq:1,data:{turn:1}}},{event:{type:'todo/write',seq:2,data:{turn:1,todos:[{content:'合成任务',status:'in_progress'}]}}},{event:{type:'deliverables/presented',seq:3,data:{turn:1,files:[{path:'outputs/report.md'},{path:'outputs/demo.html'}]}}},{event:{type:'tool/call',seq:4,data:{turn:1,callId:'a',name:'exec_command',arguments:'{"cmd":"synthetic"}'}}},{event:{type:'tool/result',seq:5,data:{turn:1,message:{source:{callId:'a'}}}}},{event:{type:'turn/end',seq:6,data:{turn:1,reason:'complete'}}}]
async function settle(){await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))}
async function mount({modules=all,reset=true}={}){
  await page.goto(url);await page.getByTestId('todo-panel').waitFor()
  await page.evaluate(({key,modules,reset,rows})=>{
    if(reset)localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleEnabled:false,sidebarOverlay:false,panelModules:modules}))
    window.cleanups=[];window.metrics={subscribers:0,snapshots:0,todos:0,activity:0,reads:0,stats:0,aborted:0,status:0};window.blank=false;window.slow=false
    const binding=window.fixtureBinding('a'),feed=binding.eventSource,get=feed.getSnapshot,subscribe=feed.subscribe
    feed.getSnapshot=()=>{window.metrics.snapshots++;return get()}
    feed.subscribe=listener=>{window.metrics.subscribers++;const release=subscribe(listener);return()=>{window.metrics.subscribers--;release()}}
    window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='react-dom'?{createPortal:window.fixtureCreatePortal}:name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}
    window.pendingRows=rows
  },{key,modules,reset,rows})
  await page.addScriptTag({url:url+'/client.js'})
  await page.evaluate(()=>{
    const face={stat:async()=>{metrics.stats++;return{ok:true,value:{bytes:100,absolutePath:'D:/synthetic/report.md'}}},readBytes:async(_session,path,_options,signal)=>{
      metrics.reads++
      if(window.slow)await new Promise(done=>{const timer=setTimeout(done,3000);signal?.addEventListener('abort',()=>{metrics.aborted++;clearTimeout(timer);done()},{once:true})})
      return{ok:true,value:{data:Array.from(new TextEncoder().encode(path.endsWith('.html')?'<h1>示例</h1>':'# 合成内容'))}}
    }}
    const ctx={get:name=>name==='remote'?{workspaceFiles:face}:name==='remote.workspaceFiles'?face:undefined,slots:{inject(_name,cb){cb()},register(spec,Component){
      if(spec.name==='settings.section')window.fixtureSettings=Component
      else{window.fixtureHeader=props=>window.fixtureReact.createElement(Component,{...props,useSession:selector=>props.useSession(session=>selector({...session,blank:window.blank})),useProjection:name=>{if(name==='todos')metrics.todos++;return props.useProjection(name)},useTaskActivity:selector=>{metrics.activity++;return props.useTaskActivity(selector)},useSessionStatus:()=>{metrics.status++;throw Error('Unnecessary session-status hook')}});window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}}
    window.plugin.apply(ctx);window.fixture.refresh();window.fixture.records(window.pendingRows)
  })
  await settle()
}
async function patch(modules,extra={}){await page.evaluate(({key,modules,extra})=>{const next=JSON.stringify({...JSON.parse(localStorage.getItem(key)||'{}'),...extra,panelModules:modules});localStorage.setItem(key,next);dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},{key,modules,extra});await settle()}
async function open(){if(await entry().getAttribute('aria-expanded')!=='true'){await entry().click();await settle()}}
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
try{
  await check('settings provide three independent custom switches and all eight combinations render only enabled modules',async()=>{
    await mount();await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'任务面板')
    const section=page.locator('[data-setting=panel-modules]');assert.equal(await section.getByRole('switch').count(),3);assert.equal(await section.locator('input,select').count(),0)
    await section.getByRole('switch',{name:'启用工具记录',exact:true}).click();await settle();assert.equal(await section.getByRole('switch',{name:'启用工具记录'}).getAttribute('aria-checked'),'false')
    await section.screenshot({path:resolve(out,'module-switches-light.png')});await page.evaluate(()=>window.fixture.settings(false));await settle()
    for(let mask=0;mask<8;mask++){
      const modules={progress:!!(mask&1),outputs:!!(mask&2),resources:!!(mask&4)};await patch(modules)
      if(mask)await open()
      for(const name of Object.keys(modules))assert.equal(await page.locator(`[data-testid=dcb-${name}]`).count(),Number(modules[name]),`${mask}: ${name}`)
      assert.equal(await page.evaluate(()=>window.metrics.subscribers),Number(!!mask));assert.equal(await page.evaluate(()=>window.metrics.status),0)
    }
  })
  await check('disabled modules skip their payload parsers, and disabled event types do not notify the remaining module',async()=>{
    const result=await page.evaluate(()=>{
      const api=window.plugin.__test,trap=()=>{throw Error('Disabled payload accessed')},data={turn:1,name:'exec_command',callId:'x'}
      Object.defineProperty(data,'arguments',{get:trap});const fileData={turn:1};Object.defineProperty(fileData,'files',{get:trap});const planData={turn:1};Object.defineProperty(planData,'todos',{get:trap})
      const start={event:{type:'turn/start',data:{turn:1}}}
      api.turnActivityFrom([start,{event:{type:'tool/call',data}}],false,{progress:true,outputs:true,resources:false})
      api.turnActivityFrom([start,{event:{type:'deliverables/presented',data:fileData}}],false,{progress:true,outputs:false,resources:true})
      api.turnActivityFrom([start,{event:{type:'todo/write',data:planData}}],false,{progress:false,outputs:true,resources:true})
      let current={entries:[start],change:{kind:'replace'}},notify,changes=0
      const source=api.activitySource({getSnapshot:()=>current,subscribe:cb=>(notify=cb,()=>{})},()=>({progress:false,outputs:true,resources:false}))
      const before=source.getSnapshot();source.subscribe(()=>changes++)
      const added={event:{type:'tool/call',data}};current={entries:[start,added],change:{kind:'append',entries:[added]}};notify()
      return{changes,identity:before===source.getSnapshot()}
    });assert.deepEqual(result,{changes:0,identity:true})
  })
  await check('turning off progress removes the todo hook, navigation and step animations and restores the native task list',async()=>{
    await patch({progress:false,outputs:true,resources:true});const before=await page.evaluate(()=>metrics.todos)
    await page.evaluate(()=>{window.fixture.update([{content:'变化中的任务',status:'pending'}]);window.fixture.refresh()});await settle()
    assert.equal(await page.evaluate(()=>metrics.todos),before);assert.equal(await page.locator('.dcb-step-window').count(),0)
    assert.equal(await page.getByTestId('todo-panel').getAttribute('data-dcb-native-hidden'),null);assert.equal(await page.getByTestId('todo-panel').getAttribute('data-dcb-task-panel'),null)
  })
  await check('turning off outputs closes the reader, cancels its read and prevents new reads or opening via stale callbacks',async()=>{
    await patch(all);await open();await page.evaluate(()=>window.slow=true)
    const prior=await page.evaluate(()=>metrics.reads)
    await card().locator('.dcb-output').filter({hasText:'report'}).click();await page.waitForFunction(prior=>metrics.reads>prior,prior)
    await patch({progress:true,outputs:false,resources:true});assert.equal(await page.locator('.dcb-file-viewer').count(),0)
    const before=await page.evaluate(()=>metrics.reads);await page.evaluate(()=>{window.fixture.records(window.pendingRows);window.fixture.refresh()});await settle()
    assert.equal(await page.evaluate(()=>metrics.reads),before);assert.ok(await page.evaluate(()=>metrics.aborted)>0)
    await page.evaluate(()=>window.slow=false)
  })
  await check('all modules off detach the event feed and all reading observers while host state alone keeps three labels',async()=>{
    await patch(none);assert.equal(await entry().count(),0);assert.equal(await card().count(),0);assert.equal(await page.evaluate(()=>metrics.subscribers),0);assert.equal(await page.evaluate(()=>readingObservers),0)
    const before=await page.evaluate(()=>metrics.snapshots);await page.evaluate(()=>{window.fixture.records([...window.pendingRows,...Array.from({length:100},(_,i)=>({event:{type:'tool/call',data:{callId:String(i),name:'read'}}}))]);window.fixture.running(true)});await settle()
    assert.equal(await label().textContent(),'处理中');assert.equal(await page.evaluate(()=>metrics.snapshots),before)
    await page.evaluate(()=>window.fixture.running(false));await settle();assert.equal(await label().textContent(),'查看成果')
    await page.evaluate(()=>{window.blank=true;window.fixture.refresh()});await settle();assert.equal(await label().textContent(),'空闲')
    assert.equal(await page.evaluate(()=>metrics.status),0)
  })
  await check('collapsed panels do not watch reading position; opening attaches one observer and closing releases it',async()=>{
    await page.evaluate(()=>{window.blank=false;window.fixture.refresh()});await patch(all)
    assert.equal(await page.evaluate(()=>readingObservers),0);await open();assert.equal(await page.evaluate(()=>readingObservers),1)
    await page.mouse.move(2,2);await entry().click();await settle();assert.equal(await page.evaluate(()=>readingObservers),0)
  })
  await check('module selections survive refresh, preserve collapse preferences and the master switch detaches all module hooks',async()=>{
    await patch({progress:false,outputs:true,resources:false},{modules:{progress:true,outputs:false,resources:true}});await mount({reset:false});await open()
    assert.equal(await card().locator('[data-testid=dcb-outputs]').getAttribute('data-collapsed'),'true');assert.equal(await page.locator('[data-testid=dcb-progress],[data-testid=dcb-resources]').count(),0)
    await patch({progress:false,outputs:true,resources:false},{enabled:false});assert.equal(await page.locator('.dcb-entry').count(),0);assert.equal(await page.evaluate(()=>metrics.subscribers),0);assert.equal(await page.evaluate(()=>readingObservers),0)
    await patch(all,{enabled:true,modules:{progress:true,outputs:true,resources:true}});await open();assert.equal(await page.locator('[data-testid=dcb-progress]').count(),1)
  })
  await check('light and dark narrow settings keep readable switches and the entry never exposes tool or task-specific labels',async()=>{
    await page.evaluate(()=>{window.fixture.settings(true);document.body.setAttribute('data-ds-dark-theme','')});await selectSettingsCategory(page,'任务面板');await page.setViewportSize({width:390,height:900})
    const section=page.locator('[data-setting=panel-modules]');await section.scrollIntoViewIfNeeded();await settle();assert.ok(await section.evaluate(el=>el.scrollWidth<=el.clientWidth+1));await section.screenshot({path:resolve(out,'module-switches-dark-narrow.png')})
    await page.evaluate(()=>window.fixture.settings(false));await settle();assert.ok(['处理中','查看成果','空闲'].includes(await label().textContent()))
  })
  assert.deepEqual(errors,[]);writeFileSync(resolve(out,'modules-validation.json'),JSON.stringify({passed:checks.length,checks},null,2));console.log(JSON.stringify({passed:checks.length,out}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
