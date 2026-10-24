import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'scope')
mkdirSync(output,{recursive:true})
const built=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',built.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),context=await browser.newContext({viewport:{width:1200,height:1000}}),page=await context.newPage(),errors=[]
page.on('pageerror',error=>errors.push(error.message))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-claude-beautify:settings:v1',rows=[]
let seq=0
const add=(type,data)=>rows.push({event:{type,data,seq:++seq}})
const call=(id,name,args={},result=true)=>{add('tool/call',{callId:id,name,arguments:JSON.stringify(args)});if(result!==null)add('tool/result',{callId:id,isError:!result})}
const plans=[
 [{content:'同名任务',status:'completed'},{content:'历史未完成任务',status:'in_progress'}],
 [{content:'同名任务',status:'completed'}],
 [{content:'当前执行任务',status:'in_progress'},{content:'当前后续任务',status:'pending'}],
]
for(let i=1;i<=3;i++){
 add('turn/start',{turn:i});add('todo/write',{todos:[{content:'应被覆盖的旧任务',status:'pending'}]});add('todo/write',{todos:plans[i-1]})
 call(`skill-${i}`,'skill',{name:i===3?'current-skill':'shared-skill'})
 if(i===1){call('old-active','ops_bash',{},null);call('failure','write',{},false)}
 if(i===2){call('success','write');call('other','job_output')}
 if(i===3)call('current-active','ops_bash',{},null)
 add('deliverables/presented',{files:[{path:'/example/shared.txt',description:`第 ${i} 轮版本`},...(i===2?[{path:'/example/second.zip',description:'独立产物'}]:[])]})
 if(i<3)add('turn/end',{})
}
const turnOutline=[1,2,3].map(turn=>({turn,seq:turn-1})),chatTurns=turnOutline.map(item=>({...item,prompt:`合成问答 ${item.turn}`}))
const card=page.getByTestId('dcb-summary'),content=card.locator('.dcb-context-content'),allButton=()=>card.getByRole('button',{name:'全部轮次',exact:true}),oneButton=()=>card.getByRole('button',{name:'当前轮次',exact:true})
async function settled(target=page){await target.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));await target.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))}
async function open(target=page){const button=target.getByRole('button',{name:'会话进度与输出',exact:true});if(await button.getAttribute('aria-expanded')!=='true')await button.click();await settled(target)}
async function boot(target=page){
 await target.goto(url);await target.getByTestId('todo-panel').waitFor()
 await target.evaluate(()=>{
  window.cleanups=[];window.__ModuleLoader__={load(spec){window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}}
  const animate=Element.prototype.animate
  Element.prototype.animate=function(frames,options){if(options?.id?.startsWith('dcb-context-'))window.contextTransitions?.push(options.id);if(options?.id?.startsWith('dcb-scope-'))window.scopeTransitions?.push(options.id);const result=animate.call(this,frames,options);if(window.pausePlan&&options?.id?.startsWith('dcb-plan-')||window.pauseScope&&options?.id?.startsWith('dcb-scope-')){result.pause();result.currentTime=0}return result}
 })
 await target.addScriptTag({url:url+'/client.js'})
 await target.evaluate(({rows,plan,chatTurns})=>{
  const ctx={slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}}
  window.plugin.apply(ctx);window.fixture.refresh();window.fixtureBinding('a').eventSource.replace(rows);window.fixture.update(plan);window.fixture.running(true);window.fixture.history({turns:chatTurns,initial:3,tail:true})
 },{rows,plan:plans[2],chatTurns})
 await open(target)
}
async function patch(value){await page.evaluate(({key,value})=>{const next=JSON.stringify({...JSON.parse(localStorage.getItem(key)||'{}'),...value});localStorage.setItem(key,next);dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},{key,value});await settled()}
async function finishPlans(){await page.evaluate(()=>{window.pausePlan=false;for(const a of document.getAnimations().filter(a=>a.id.startsWith('dcb-plan-'))){a.currentTime=a.effect.getComputedTiming().endTime;a.play()}});await settled()}
async function scopeFrame(time){await page.evaluate(time=>{for(const a of document.getAnimations().filter(a=>a.id.startsWith('dcb-scope-'))){a.pause();a.currentTime=time}},time)}
async function finishScope(){await page.evaluate(()=>{window.pauseScope=false;for(const a of document.getAnimations().filter(a=>a.id.startsWith('dcb-scope-')))a.finish()});await settled()}
async function scopeSample(){return card.locator('.dcb-scope-switch').evaluate(el=>{
 const indicator=el.querySelector('.dcb-scope-indicator'),path=el.querySelector('path'),button=el.querySelector('[aria-pressed=true]'),a=indicator.getBoundingClientRect(),b=button.getBoundingClientRect(),points=[],length=path.getTotalLength()
 for(let i=0;i<=400;i++){const p=path.getPointAtLength(length*i/400);if(p.x>=40&&p.x<=60)points.push(p.y)}
 return{x:a.x,width:a.width,y:a.y,height:a.height,expectedX:b.x,expectedWidth:b.width,expectedY:b.y,expectedHeight:b.height,neck:Math.max(...points)-Math.min(...points),path:getComputedStyle(path).d,rest:`path("${path.getAttribute('d')}")`,filter:getComputedStyle(path).filter,active:document.getAnimations().filter(a=>a.id.startsWith('dcb-scope-')).length,moving:el.hasAttribute('data-moving')}
})}
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function displayTurns(definitions,{hasMore=false,modules={progress:true,outputs:true,resources:true}}={}){
 const entries=[],outline=[];let seq=0
 const add=(type,data)=>entries.push({event:{type,data,seq:++seq}})
 definitions.forEach((definition,index)=>{
  const turn=index+1;add('turn/start',{turn});outline.push({turn,seq})
  if(definition.todos)add('todo/write',{todos:definition.todos})
  for(const [i,call]of (definition.calls||[]).entries()){const callId=`same-${turn}-${i}`;add('tool/call',{callId,name:call.name,arguments:JSON.stringify(call.args||{})});add('tool/result',{callId,isError:call.failed===true})}
  if(definition.files)add('deliverables/presented',{files:definition.files})
  add('turn/end',{})
 })
 await patch({summaryScope:'turn',modules})
 await page.evaluate(({entries,outline,todos,hasMore})=>{window.fixture.running(false);window.fixture.update(todos);window.fixture.records(entries,hasMore);window.fixture.history({turns:outline,initial:outline.at(-1).turn,tail:true})},{entries,outline,todos:definitions.at(-1).todos||[],hasMore})
 await settled();await open()
}
async function captureContext(action){
 await page.evaluate(()=>{window.contextTransitions=[];window.scopeTransitions=[];window.savedContextNode=document.querySelector('.dcb-context-content')})
 await action();await settled()
 assert.equal(await page.evaluate(()=>document.querySelector('.dcb-context-content')===window.savedContextNode),true,'Scope changes retain the existing content seat')
 assert.equal(await card.locator('.dcb-context-ghost > *').count(),0)
 assert.equal(await content.evaluate(el=>el.style.willChange+el.parentElement.style.willChange),'')
 return page.evaluate(()=>window.contextTransitions)
}
try{
 await boot()
 await check('identical empty scopes and neighboring empty rounds update their labels without flashing the card',async()=>{
  await displayTurns([{},{}])
  assert.deepEqual(await captureContext(()=>allButton().click()),[]);assert.equal(await allButton().getAttribute('aria-pressed'),'true')
  assert.ok(await page.evaluate(()=>window.scopeTransitions.length>0),'The selector still provides its normal selection feedback')
  assert.deepEqual(await captureContext(()=>oneButton().click()),[])
  assert.deepEqual(await captureContext(()=>card.getByRole('button',{name:'上一轮',exact:true}).click()),[]);assert.equal(await card.getAttribute('data-dcb-turn'),'1')
  assert.deepEqual(await captureContext(()=>card.getByRole('button',{name:'下一轮',exact:true}).click()),[]);assert.equal(await card.getAttribute('data-dcb-turn'),'2')
 })
 await check('identical files, skills and one task group do not replay the content transition or replace output controls',async()=>{
  const files=[{path:'/example/unchanged.txt',description:'同一份输出'}],calls=[{name:'skill',args:{name:'unchanged-skill'}}]
  await displayTurns([{},{files,calls}]);await page.evaluate(()=>window.savedOutputNode=document.querySelector('.dcb-context-content .dcb-output'))
  for(const button of [allButton(),oneButton()]){assert.deepEqual(await captureContext(()=>button.click()),[]);assert.equal(await page.evaluate(()=>document.querySelector('.dcb-context-content .dcb-output')===window.savedOutputNode),true)}
  const todos=[{content:'内容相同的已完成任务',status:'completed'}]
  await displayTurns([{},{todos}]);assert.deepEqual(await captureContext(()=>allButton().click()),[]);assert.deepEqual(await captureContext(()=>oneButton().click()),[])
  await displayTurns([{calls},{calls}],{modules:{progress:true,outputs:true,resources:false}})
  assert.deepEqual(await captureContext(()=>allButton().click()),[],'Hidden resource changes do not animate an unchanged collapsed section')
 })
 await check('different outputs, tool counts and incomplete-history warnings still receive the content transition',async()=>{
  await displayTurns([{files:[{path:'/example/old.txt'}]},{files:[{path:'/example/new.txt'}]}])
  assert.ok((await captureContext(()=>allButton().click())).includes('dcb-context-in'));assert.equal(await content.locator('.dcb-output').count(),2)
  const calls=[{name:'ops_bash'}];await displayTurns([{calls},{calls}])
  assert.ok((await captureContext(()=>allButton().click())).includes('dcb-context-in'));assert.match(await content.locator('.dcb-tool-summary').getAttribute('title'),/2 次/)
  await displayTurns([{},{}],{hasMore:true})
  assert.ok((await captureContext(()=>allButton().click())).includes('dcb-context-in'));assert.equal(await content.getByText('仅合计已加载记录；更早轮次尚未完整加载。',{exact:true}).isVisible(),true)
 })
 await patch({summaryScope:'turn',modules:{progress:true,outputs:true,resources:true}});await boot()
 await check('single-turn mode follows reading by default and previous/next browse one round without changing the chat',async()=>{
  assert.equal(await oneButton().getAttribute('aria-pressed'),'true');assert.equal(await card.getAttribute('data-dcb-turn'),'3')
  assert.equal(await content.getByText('current-skill',{exact:true}).isVisible(),true);assert.equal(await content.getByText('shared-skill',{exact:true}).count(),0)
  await card.getByRole('button',{name:'上一轮',exact:true}).click();await settled();assert.equal(await card.getAttribute('data-dcb-turn'),'2')
  await card.getByRole('button',{name:'上一轮',exact:true}).click();await settled();assert.equal(await card.getAttribute('data-dcb-turn'),'1');assert.equal(await card.getByRole('button',{name:'上一轮',exact:true}).isDisabled(),true)
  await card.getByRole('button',{name:'下一轮',exact:true}).click();await settled();assert.equal(await card.getAttribute('data-dcb-turn'),'2')
  assert.equal(await page.getByRole('button',{name:'跳到第 3 轮',exact:true}).getAttribute('aria-current'),'true','panel navigation does not scroll or change the chat')
  await card.getByRole('button',{name:'跟随阅读',exact:true}).click();await settled();assert.equal(await card.getAttribute('data-dcb-turn'),'3')
 })
 await check('all-round mode sums tool calls and unique skills/files while preserving three separate final task lists',async()=>{
  const widths=await allButton().evaluate(el=>new Promise(done=>{el.click();const result=[],start=performance.now();const tick=()=>{const indicator=document.querySelector('.dcb-scope-indicator');result.push({x:new DOMMatrix(getComputedStyle(indicator).transform).m41,width:indicator.getBoundingClientRect().width});if(performance.now()-start<110)requestAnimationFrame(tick);else done(result)};requestAnimationFrame(()=>requestAnimationFrame(tick))}))
  assert.ok(widths.some(item=>item.x>0&&item.x<item.width),'the scope indicator has rendered intermediate frames')
  await settled();await patch({skillDetails:true,toolDetails:true})
  assert.equal(await card.getAttribute('data-dcb-turn'),'all');assert.match(await card.locator('.dcb-turn-navigation').innerText(),/3 轮 · 3 组任务/)
  assert.equal(await card.locator('.dcb-plan-group').count(),3)
  assert.equal(await card.locator('.dcb-plan-total').innerText(),'共 5 项，已完成 2 项')
  assert.deepEqual(await card.locator('.dcb-plan-count').allTextContents(),['1/2','1/1','0/2'])
  assert.deepEqual(await card.locator('.dcb-plan-toggle').evaluateAll(nodes=>nodes.map(el=>el.getAttribute('aria-expanded'))),['false','false','true'])
  assert.equal(await content.getByText('应被覆盖的旧任务',{exact:true}).count(),0)
  assert.deepEqual(await content.locator('.dcb-skill-row .dcb-resource-label').allTextContents(),['shared-skill','current-skill'])
  assert.equal(await content.locator('.dcb-output').count(),2);assert.equal(await content.locator('.dcb-output').first().getAttribute('title'),'第 3 轮版本')
  const summary=content.locator('.dcb-tool-summary');assert.match(await summary.getAttribute('title'),/3 种 · 5 次/);assert.equal(await summary.locator('.dcb-tool-failed').innerText(),'失败 1')
  const op=content.locator('.dcb-tool-row').filter({hasText:'ops_bash'});assert.match(await op.innerText(),/2 次 · 调用中 · 未返回 1/)
  await card.screenshot({path:resolve(output,'all-turns-grouped.png')})
 })
 await check('task-group disclosure really collapses height with blur, reverses continuously and labels historical unfinished work',async()=>{
  const first=card.locator('[data-plan-turn="1"]'),toggle=first.locator('.dcb-plan-toggle'),body=first.locator('.dcb-plan-disclosure')
  await page.evaluate(()=>window.pausePlan=true);await toggle.click();await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-plan-height'))
  await page.evaluate(()=>{for(const a of document.getAnimations().filter(a=>a.id.startsWith('dcb-plan-')))a.currentTime=100})
  const middle=await body.evaluate(el=>({height:el.getBoundingClientRect().height,natural:el.firstElementChild.offsetHeight,blur:getComputedStyle(el).filter,opacity:Number(getComputedStyle(el).opacity)}))
  assert.ok(middle.height>0&&middle.height<middle.natural&&middle.opacity>0&&middle.opacity<1);assert.match(middle.blur,/blur\(/)
  await toggle.click();assert.ok(Math.abs(await body.evaluate(el=>el.getBoundingClientRect().height)-middle.height)<1);await finishPlans()
  await toggle.click();await settled();assert.equal(await first.locator('.dcb-plan-state').last().innerText(),'未完成');assert.equal(await first.locator('.dcb-timeline').getAttribute('data-working'),'false')
  await page.evaluate(()=>window.fixture.running(false));await settled();assert.equal(await content.locator('.dcb-tool-summary').getAttribute('data-working'),'false');assert.match(await content.locator('.dcb-tool-summary').innerText(),/未返回/)
 })
 await check('all-round totals remain stable while reading other messages, and switching back restores per-round navigation',async()=>{
  await page.evaluate(()=>window.fixture.reading(1));await settled();assert.equal(await card.getAttribute('data-dcb-turn'),'all');assert.equal(await card.locator('.dcb-plan-group').count(),3)
  await oneButton().click();await settled();assert.equal(await card.getAttribute('data-dcb-turn'),'1');assert.equal(await content.getByText('current-skill',{exact:true}).count(),0)
  await allButton().click();await settled();assert.equal(await content.getByText('current-skill',{exact:true}).isVisible(),true)
 })
 await check('new rounds without a todo/write do not inherit stale tasks; partial history and asynchronously loaded plans remain explicit',async()=>{
  const next=[...rows,{event:{type:'turn/end',seq:100,data:{turn:3}}},{event:{type:'turn/start',seq:101,data:{turn:4}}}]
  await page.evaluate(({next,chatTurns})=>{window.fixtureBinding('a').eventSource.replace(next,true);window.fixture.history({turns:[...chatTurns,{turn:4,seq:100,prompt:'没有新任务的轮次'}],initial:4})},{next,chatTurns});await settled()
  assert.match(await card.locator('.dcb-turn-navigation').innerText(),/4 轮 · 3 组任务/);assert.equal(await content.getByText('仅合计已加载记录；更早轮次尚未完整加载。',{exact:true}).isVisible(),true)
  await page.evaluate(next=>window.fixtureBinding('a').eventSource.replace([...next,{event:{type:'todo/write',seq:102,data:{turn:4,todos:[{content:'新轮次计划',status:'pending'}]}}}]),next);await settled()
  assert.equal(await card.locator('[data-plan-turn="4"]').count(),1);assert.equal(await card.getByText('新轮次计划',{exact:true}).isVisible(),true)
  assert.equal(await card.locator('[data-plan-turn="3"] .dcb-step').count(),2,'new plans never replace a previous round\'s plan')
 })
 await check('scope preference survives refresh and cross-window updates while independent chats keep isolated records',async()=>{
  const stored=await page.evaluate(key=>localStorage.getItem(key),key);assert.equal(JSON.parse(stored).summaryScope,'all');assert.ok(!/shared-skill|历史未完成任务/.test(stored))
  await boot();assert.equal(await allButton().getAttribute('aria-pressed'),'true')
  const other=await context.newPage();await boot(other)
  await oneButton().click();await settled();await other.waitForFunction(()=>document.querySelector('.dcb-scope-switch button')?.getAttribute('aria-pressed')==='true');await other.close()
  await allButton().click();await settled()
  await page.evaluate(()=>{window.fixtureBinding('b').eventSource.replace([{event:{type:'turn/start',seq:1,data:{turn:1}}},{event:{type:'tool/call',seq:2,data:{callId:'b-only',name:'skill',arguments:'{"name":"another-chat-only"}'}}},{event:{type:'tool/result',seq:3,data:{callId:'b-only'}}}]);window.fixture.session('b');window.fixture.update([])});await settled();await open()
  assert.equal(await content.getByText('another-chat-only',{exact:true}).isVisible(),true);assert.equal(await card.locator('.dcb-plan-group').count(),0);assert.equal(await content.getByText('current-skill',{exact:true}).count(),0)
  await page.evaluate(()=>{window.fixture.session('a');window.fixture.update([])});await settled();await open();assert.equal(await card.locator('.dcb-plan-group').count(),3)
 })
 await check('scope controls remain usable across materials, narrow layouts, reduced motion and forced colors',async()=>{
  for(const dark of [false,true])for(const cardStyle of ['milk','clear','css','glass']){
   await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);await patch({cardStyle})
   assert.equal(await card.locator('.dcb-scope-switch').evaluate(el=>el.scrollWidth<=el.clientWidth),true)
  }
  await page.setViewportSize({width:390,height:844});await settled();assert.equal(await card.locator('.dcb-scope-switch').evaluate(el=>el.scrollWidth<=el.clientWidth),true)
  await card.screenshot({path:resolve(output,'all-turns-dark-narrow.png')})
  await page.emulateMedia({reducedMotion:'reduce'});await oneButton().click();await settled();assert.equal(await card.locator('.dcb-scope-indicator').evaluate(el=>getComputedStyle(el).transitionDuration),'0s')
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'active'});await allButton().click();await settled();await card.locator('.dcb-plan-toggle').first().click();await settled()
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-plan-')).length),0)
  assert.equal(await card.locator('select, input[type=checkbox], input[type=radio]').count(),0)
 })
 await check('the scope control reverses black/white with the host theme and retains readable difference-blended labels across materials',async()=>{
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'});await page.setViewportSize({width:1200,height:1000})
  for(const dark of [false,true])for(const cardStyle of ['milk','clear','css','glass']){
   await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);await patch({cardStyle})
   for(const scope of ['turn','all']){
    await (scope==='all'?allButton():oneButton()).click();await settled()
    const colors=await card.locator('.dcb-scope-switch').evaluate(el=>({track:getComputedStyle(el).backgroundColor,fill:getComputedStyle(el.querySelector('path')).fill,labels:[...el.querySelectorAll('.dcb-scope-label')].map(label=>({blend:getComputedStyle(label).mixBlendMode,color:getComputedStyle(label).color}))}))
    assert.equal(colors.track,dark?'rgb(17, 17, 17)':'rgb(255, 255, 255)');assert.equal(colors.fill,dark?'rgb(255, 255, 255)':'rgb(17, 17, 17)')
    assert.ok(colors.labels.every(label=>label.blend==='difference'&&label.color==='rgb(255, 255, 255)'))
   }
  }
 })
 await check('both directions render a stretched liquid bridge with a thin neck, continuous reversals and exact settled geometry in light and dark themes',async()=>{
  await patch({cardStyle:'milk'})
  for(const dark of [false,true]){
   await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);await oneButton().click();await settled()
   await card.locator('.dcb-scope-switch').screenshot({path:resolve(output,`scope-${dark?'night':'day'}-rest.png`)})
   for(const scope of ['all','turn']){
    await page.evaluate(()=>window.pauseScope=true);const before=await scopeSample();await (scope==='all'?allButton():oneButton()).click()
    const frames=[]
    for(const time of [35,70,110,160,220,270]){await scopeFrame(time);frames.push({time,...await scopeSample()})}
    const peak=frames.reduce((a,b)=>a.width>b.width?a:b)
    assert.ok(peak.width>before.width*1.5,'the leading edge flows to the other choice while the tail remains behind')
    assert.ok(peak.neck<20,'the bridge is visibly pinched rather than a stretched rectangle')
    assert.ok(frames.filter(frame=>frame.path!==frame.rest).length>=4);assert.equal(peak.active,2);assert.equal(peak.filter,'none')
    await scopeFrame(peak.time);await card.locator('.dcb-scope-switch').screenshot({path:resolve(output,`scope-${dark?'night':'day'}-${scope}-flow.png`)})
    await finishScope();const end=await scopeSample()
    assert.ok(Math.abs(end.x-end.expectedX)<.15&&Math.abs(end.width-end.expectedWidth)<.15&&Math.abs(end.y-end.expectedY)<.15&&Math.abs(end.height-end.expectedHeight)<.15)
    assert.equal(end.active,0);assert.equal(end.moving,false);assert.equal(end.path,end.rest)
   }
   await page.evaluate(()=>window.pauseScope=true);await allButton().click();await scopeFrame(95);const before=await scopeSample();await oneButton().click();const reversed=await scopeSample()
   assert.ok(Math.abs(before.x-reversed.x)<.15&&Math.abs(before.width-reversed.width)<.15);assert.equal(before.path,reversed.path)
   await finishScope()
  }
 })
 await check('fractional scale, zoom and resize keep the liquid control on its buttons; preferences and unmount cancel temporary effects',async()=>{
  for(const style of [{transform:'scale(.83,.91)',transformOrigin:'top right'},{zoom:'1.15'},{transform:'scale(1.17,.86)',transformOrigin:'top right',zoom:'.9'}]){
   await card.evaluate((el,style)=>Object.assign(el.style,style),style)
   for(const button of [allButton(),oneButton()]){await button.press('Enter');await settled();const end=await scopeSample();assert.ok(Math.abs(end.x-end.expectedX)<.15&&Math.abs(end.width-end.expectedWidth)<.15&&Math.abs(end.y-end.expectedY)<.15)}
   await card.evaluate(el=>{el.style.removeProperty('transform');el.style.removeProperty('transform-origin');el.style.removeProperty('zoom')});await settled()
  }
  await page.evaluate(()=>window.pauseScope=true);await allButton().click();await scopeFrame(90);await page.setViewportSize({width:390,height:844});await settled()
  let end=await scopeSample();assert.equal(end.active,0);assert.equal(end.moving,false);assert.ok(Math.abs(end.x-end.expectedX)<.15)
  await oneButton().click();await scopeFrame(80);await page.emulateMedia({reducedMotion:'reduce'});await settled();end=await scopeSample();assert.equal(end.active,0);assert.equal(end.path,end.rest)
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'active'});await allButton().press('Space');await settled();assert.equal((await scopeSample()).active,0)
  assert.equal(await card.locator('.dcb-scope-label').first().evaluate(el=>getComputedStyle(el).mixBlendMode),'normal')
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'});await oneButton().click();await scopeFrame(90)
  await page.evaluate(()=>{window.fixtureHeader=null;window.fixture.refresh()});await settled();assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-scope-')).length),0)
 })
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
