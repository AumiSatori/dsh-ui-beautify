import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'../../outputs/dsh-ui-beautify/progress-liquid'))
mkdirSync(output,{recursive:true})
const built=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={
  '/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],
  '/fixture.js':['text/javascript',built.outputFiles[0].text],
  '/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')],
}
const server=createServer((req,res)=>{const r=routes[req.url];if(!r){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':r[0]}).end(r[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1.5})
const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)})
await page.addInitScript(()=>{
  window.flowAnimations=[]
  const animate=Element.prototype.animate
  Element.prototype.animate=function(frames,options){
    const a=animate.call(this,frames,options)
    if(options?.id==='dcb-progress-liquid')window.flowAnimations.push(a)
    if(window.pauseFlows&&(options?.id==='dcb-progress-liquid'||options?.id?.startsWith('dcb-step-roll-'))){a.pause();a.currentTime=0}
    return a
  }
})
const card=page.getByTestId('dcb-summary')
const tasks=(index,total=4)=>Array.from({length:total},(_,i)=>({content:`水滴交接任务 ${i+1}`,status:i<index?'completed':i===index?'in_progress':'pending'}))
const settle=async()=>{
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))
}
const frame=time=>page.evaluate(time=>{
  for(const a of document.getAnimations())if(a.id!=='dcb-progress-liquid'&&!a.id.startsWith('dcb-step-roll-')&&a.effect?.getComputedTiming().iterations!==Infinity)a.finish()
  for(const a of document.getAnimations())if(a.id==='dcb-progress-liquid'||a.id.startsWith('dcb-step-roll-')){a.pause();a.currentTime=time}
  const path=document.querySelector('.dcb-progress-liquid path'),host=document.querySelector('.dcb-step-window')||document.querySelector('.dcb-plan-disclosure')
  if(!path)return null
  const b=path.getBBox(),r=path.getBoundingClientRect(),cs=getComputedStyle(path),target=host.querySelector('.dcb-step[data-status="in_progress"] .dcb-status').getBoundingClientRect()
  return {x:b.x,y:b.y,width:b.width,height:b.height,d:cs.d,worldX:r.x+r.width/2,worldY:r.y+r.height/2,targetX:target.x+target.width/2,targetY:target.y+target.height/2,hidden:host.querySelectorAll('[data-dcb-flow-hidden]').length,textTransform:getComputedStyle(host.querySelector('.dcb-step-text')||host.querySelector('.dcb-step > span:nth-child(2)')).transform}
},time)
const finish=async()=>{
  await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id==='dcb-progress-liquid'||a.id.startsWith('dcb-step-roll-'))a.finish()})
  await settle()
}
let passed=0
const check=async(name,fn)=>{await fn();passed++;console.log(`PASS ${name}`)}
try{
  await page.goto(`http://127.0.0.1:${server.address().port}/`)
  await page.waitForFunction(()=>window.fixture&&window.fixtureReact)
  await page.evaluate(()=>{
    window.cleanups=[]
    window.fixturePrimitives={FishLogo:({size=16,className})=>window.fixtureReact.createElement('svg',{width:size,height:size,className,viewBox:'0 0 16 16'},window.fixtureReact.createElement('circle',{cx:8,cy:8,r:6,fill:'currentColor'}))}
    window.__ModuleLoader__={load(spec){window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?window.fixturePrimitives:window.fixtureReact)}}
  })
  await page.addScriptTag({url:`http://127.0.0.1:${server.address().port}/client.js`})
  await page.evaluate(()=>{
    const ctx={
      slots:{inject(name,fn){fn()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},
      sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},
      effect(fn){window.cleanups.push(fn())},inject(names,fn){fn(ctx)},
    }
    window.plugin.apply(ctx);window.fixture.refresh()
  })
  await page.waitForFunction(()=>window.fixtureHeader)
  await page.evaluate(t=>{window.fixture.running(true);window.fixture.update(t)},tasks(0))
  await settle()
  if(!await card.count()){await page.getByRole('button',{name:'会话进度与输出',exact:true}).click();await settle()}
  await page.waitForTimeout(360)
  await settle()
  assert.equal(await card.evaluate(el=>getComputedStyle(el).opacity),'1')
  await check('首次打开不重播水滴，状态更新但窗口不滚动也触发交接',async()=>{
    assert.equal(await page.locator('.dcb-progress-liquid').count(),0)
    await page.evaluate(t=>{window.pauseFlows=true;window.fixture.update(t)},tasks(1))
    await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-progress-liquid'))
    assert.equal(await card.locator('.dcb-recent-steps').getAttribute('start'),'1')
    const start=await frame(0),mid=await frame(140)
    assert.ok(mid.y>start.y+6,'The bead actually falls down the timeline')
    assert.ok(mid.height>start.height+5,'The bead has a visible tail rather than just translating a circle')
    assert.equal(mid.textTransform,'none')
    await card.screenshot({path:resolve(output,'handoff-no-scroll-mid.png')})
    const end=await frame(300)
    assert.ok(Math.abs(end.worldY-end.targetY)<1&&Math.abs(end.worldX-end.targetX)<1)
    await finish()
    assert.equal(await page.locator('[data-dcb-flow-hidden],.dcb-progress-liquid').count(),0)
  })
  await check('自动滚动与水滴共用时间轴，水滴先下落再随列表落位',async()=>{
    await page.evaluate(t=>window.fixture.update(t),tasks(2,4))
    await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-progress-liquid'))
    const start=await frame(0),mid=await frame(130)
    assert.ok(mid.worldY>start.worldY+6,'Window scrolling must not cancel the visible downward movement')
    assert.equal(await card.locator('.dcb-recent-steps').getAttribute('start'),'2')
    for(const t of [0,65,130,200,260,300]){await frame(t);await card.screenshot({path:resolve(output,`handoff-roll-${t}.png`)})}
    const end=await frame(300)
    if(end)assert.ok(Math.abs(end.worldY-end.targetY)<1)
    await finish()
  })
  await check('快速连续交接从当前水滴轮廓继续且清理旧动画',async()=>{
    await page.evaluate(t=>window.fixture.update(t),tasks(1,4));await page.waitForFunction(()=>document.querySelector('.dcb-progress-liquid'))
    const before=await frame(120)
    await page.evaluate(t=>window.fixture.update(t),tasks(2,4));await page.waitForFunction(()=>window.flowAnimations.length>=4)
    const after=await frame(0)
    assert.equal(before.d,after.d)
    assert.equal(await page.locator('.dcb-progress-liquid').count(),1)
    assert.equal(await page.evaluate(()=>window.flowAnimations.filter(a=>a.playState!=='idle').length),1)
    await finish()
  })
  await check('完成和下一项激活分两次写入时仍交接，同一状态不重复播放',async()=>{
    await page.evaluate(t=>window.fixture.update(t),tasks(2).map(t=>({...t,status:t.status==='in_progress'?'completed':t.status})))
    await settle()
    const count=await page.evaluate(()=>window.flowAnimations.length)
    await page.evaluate(t=>window.fixture.update(t),tasks(3));await page.waitForFunction(n=>window.flowAnimations.length>n,count)
    await finish()
    const next=await page.evaluate(()=>window.flowAnimations.length)
    await page.evaluate(t=>window.fixture.update(t),tasks(3));await settle()
    assert.equal(await page.evaluate(()=>window.flowAnimations.length),next)
  })
  await check('长任务换行后沿实际连线落到下一项，深色玻璃下仍可见',async()=>{
    const wrap=tasks(0).map(t=>({...t,content:t.content+'：这是一段会自然换行的较长任务描述，需要按实际排版高度交接到下一项，而不是使用写死的行距。'.repeat(2)}))
    await page.evaluate(t=>window.fixture.update(t),wrap);await settle()
    await page.evaluate(t=>{document.body.setAttribute('data-ds-dark-theme','');window.fixture.update(t.map((v,i)=>({...v,status:i===0?'completed':i===1?'in_progress':'pending'})))},wrap)
    await page.waitForFunction(()=>document.querySelector('.dcb-progress-liquid'))
    const start=await frame(0),mid=await frame(130),end=await frame(300)
    assert.ok(end.y-start.y>50)
    assert.ok(Math.abs(end.worldY-end.targetY)<1)
    assert.equal(await page.locator('.dcb-progress-liquid').evaluate(el=>getComputedStyle(el).color),'rgb(242, 242, 242)')
    await frame(130);await card.screenshot({path:resolve(output,'handoff-long-dark.png')});await finish()
    await page.evaluate(()=>document.body.removeAttribute('data-ds-dark-theme'))
    await page.evaluate(t=>window.fixture.update(t),tasks(3));await settle()
  })
  await check('减少动态效果和高对比度会立即取消水滴并恢复圆点',async()=>{
    for(const media of [{reducedMotion:'reduce'},{forcedColors:'active'}]){
      await page.evaluate(t=>window.fixture.update(t),tasks(2));await page.waitForFunction(()=>document.querySelector('.dcb-progress-liquid'))
      await page.emulateMedia(media);await settle()
      assert.equal(await page.locator('.dcb-progress-liquid,[data-dcb-flow-hidden]').count(),0)
      const count=await page.evaluate(()=>window.flowAnimations.length)
      await page.evaluate(t=>window.fixture.update(t),tasks(3));await settle()
      assert.equal(await page.evaluate(()=>window.flowAnimations.length),count)
      await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
    }
  })
  await check('切换会话和关闭面板释放水滴，不跨会话或重新打开回放',async()=>{
    await page.evaluate(t=>window.fixture.update(t),tasks(2));await page.waitForFunction(()=>document.querySelector('.dcb-progress-liquid'))
    await page.evaluate(()=>window.fixture.session('b'));await settle()
    assert.equal(await page.locator('.dcb-progress-liquid,[data-dcb-flow-hidden]').count(),0)
    await page.evaluate(t=>{window.fixture.session('a');window.fixture.running(true);window.fixture.update(t)},tasks(0));await settle()
    if(!await card.count()){await page.getByRole('button',{name:'会话进度与输出',exact:true}).click();await settle()}
    await page.evaluate(t=>window.fixture.update(t),tasks(1));await page.waitForFunction(()=>document.querySelector('.dcb-progress-liquid'))
    await card.getByRole('button',{name:'关闭进度面板',exact:true}).click();await settle()
    assert.equal(await page.locator('.dcb-progress-liquid,[data-dcb-flow-hidden]').count(),0)
  })
  await check('全部轮次的最新任务组也交接水滴，历史任务和首次展开不回放',async()=>{
    await page.evaluate(t=>{window.fixture.running(true);window.fixture.update(t)},tasks(0));await settle()
    if(!await card.count()){await page.getByRole('button',{name:'会话进度与输出',exact:true}).click();await settle()}
    await card.getByRole('button',{name:'全部轮次',exact:true}).click();await settle()
    assert.equal(await page.locator('.dcb-progress-liquid').count(),0)
    await page.evaluate(t=>window.fixture.update(t),tasks(1));await page.waitForFunction(()=>document.querySelector('.dcb-plan-disclosure .dcb-progress-liquid'))
    const end=await frame(300)
    assert.ok(Math.abs(end.worldY-end.targetY)<1)
    await finish()
    await card.getByRole('button',{name:/收起当前任务任务/}).click();await settle()
    const count=await page.evaluate(()=>window.flowAnimations.length)
    await page.evaluate(t=>window.fixture.update(t),tasks(2));await settle()
    assert.equal(await page.evaluate(()=>window.flowAnimations.length),count)
    await card.getByRole('button',{name:/展开当前任务任务/}).click();await settle()
    assert.equal(await page.evaluate(()=>window.flowAnimations.length),count)
  })
  await check('路径动画不可用时保留原圆点，停止运行和全部完成立即清理',async()=>{
    const count=await page.evaluate(()=>window.flowAnimations.length)
    await page.evaluate(t=>{
      window.originalCssSupports=CSS.supports.bind(CSS)
      CSS.supports=(...args)=>args[0]==='d'?false:window.originalCssSupports(...args)
      window.fixture.update(t)
    },tasks(3))
    await settle()
    assert.equal(await page.evaluate(()=>window.flowAnimations.length),count)
    assert.equal(await page.locator('.dcb-progress-liquid,[data-dcb-flow-hidden]').count(),0)
    await page.evaluate(()=>{CSS.supports=window.originalCssSupports;delete window.originalCssSupports})
    await page.evaluate(t=>window.fixture.update(t),tasks(2));await page.waitForFunction(()=>document.querySelector('.dcb-progress-liquid'))
    await page.evaluate(()=>window.fixture.running(false));await settle()
    assert.equal(await page.locator('.dcb-progress-liquid,[data-dcb-flow-hidden]').count(),0)
    await page.evaluate(t=>{window.fixture.running(true);window.fixture.update(t)},tasks(0));await settle()
    await page.evaluate(t=>window.fixture.update(t),tasks(1));await page.waitForFunction(()=>document.querySelector('.dcb-progress-liquid'))
    await page.evaluate(t=>window.fixture.update(t.map(t=>({...t,status:'completed'}))),tasks(1));await settle()
    assert.equal(await page.locator('.dcb-progress-liquid,[data-dcb-flow-hidden]').count(),0)
  })
  assert.deepEqual(errors,[])
  console.log(JSON.stringify({passed,output}))
}finally{await browser.close();server.close()}
