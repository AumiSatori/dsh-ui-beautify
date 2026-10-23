import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'focus-performance')
mkdirSync(output,{recursive:true})
const phase=process.env.DSH_FOCUS_PROFILE||'after',reports=[]
const react=await build({stdin:{contents:"import React from 'react';window.testReact=React",resolveDir:project},bundle:true,write:false,format:'iife'})
let css=''
if(process.env.DSH_ASAR){
  const fd=openSync(process.env.DSH_ASAR,'r')
  try{
    const head=Buffer.alloc(16);readSync(fd,head,0,16,0);const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16);const tree=JSON.parse(json)
    for(const [pkg,module,prefix]of[['layout','AppFrame','af'],['conversation','ConversationRoot','cr'],['conversation','InputBar','ib']]){
      let entry=tree;for(const part of `dsh/node_modules/@deepseek-ai/dsh-client-ui-${pkg}/lib/client.js`.split('/'))entry=entry.files[part]
      const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset));const source=bytes.toString(),at=source.indexOf(module+'.module.css')
      const region=source.slice(source.lastIndexOf('//#region',at),source.indexOf('//#endregion',at)),literal=region.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)
      assert.ok(literal);const sheet=JSON.parse(literal[1]),hash=sheet.match(/\.([\w-]+)_\w+\{/)[1];css+=sheet.replaceAll(hash+'_',prefix+'_')
    }
  }finally{closeSync(fd)}
}
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),page=await browser.newPage({viewport:{width:1440,height:940}}),errors=[]
page.on('pageerror',error=>errors.push(error.message))
const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable')
const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(item=>[item.name,item.value]))
async function boot(rows,material){
  await page.goto('about:blank');await page.setContent(`<!doctype html><style>${css}
    :root{--dsw-alias-bg-base:#fff;--dsw-specific-sidebar-fill:#f5f6f8;--dsw-alias-label-primary:#252832;--dsw-alias-border-l3:#ddd}*{box-sizing:border-box}html,body{height:100%;margin:0;font:14px/1.65 system-ui;color:#252832}.af_frame{display:grid;height:100%;grid-template-columns:280px minmax(400px,1fr) minmax(0px,480px);overflow:hidden}.af_sidebarCol{overflow:hidden;min-width:0}.sb_root{width:280px;height:100%;padding:12px;display:flex;flex-direction:column}.sb_logoRow{margin:16px 0}.sb_toggle{position:fixed;left:10px;top:5px}.sb_regionArea{min-height:0;overflow:auto;flex:1}.sb_regionArea button{display:block;width:100%;padding:12px}.sb_footArea{padding:12px}.af_centerCol,.cr_root{height:100%;min-height:0;display:flex;flex-direction:column;min-width:0}.cr_header{height:60px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:12px 24px}.cr_body{min-height:0;flex:1;display:flex;flex-direction:column}.cr_scrollBody{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column}.cr_viewArea{flex:1 0 auto}.message{width:min(100%,760px);margin:auto;padding:12px 24px}.message p{margin:6px 0 12px}.message td{padding:8px;border:1px solid #ddd}.message table{border-collapse:collapse;width:100%}.cr_composerSeat{flex:none;position:sticky;bottom:0;padding:14px 24px;background:#fff}.ib_card{border-radius:20px;padding:12px;background:#f0f1f5}.row{display:flex;justify-content:space-between}.row button{border:0;border-radius:50%;width:30px;height:30px}textarea{height:64px;width:100%;resize:none}.af_rightbarCol{background:#f4f5f8;padding:16px;overflow:hidden}.controls{display:flex;gap:8px}.af_handle{display:none}
    </style><div class=af_frame><aside class=af_sidebarCol><nav class=sb_root><div class=sb_logoRow>DeepSeek Harness<button class=sb_toggle>☰</button></div><button class=sb_newSession>新会话</button><div class=sb_regionArea>${Array.from({length:35},(_,i)=>`<button aria-selected="${i===0}">合成会话 ${i+1}</button>`).join('')}</div><div class=sb_footArea>设置</div></nav></aside><main class=af_centerCol><section class=cr_root data-phase=active><header class=cr_header data-slot=conversation.header><span>专注模式性能检查</span><div class=controls id=controls></div></header><div class=cr_body data-conversation-content data-conversation-session=synthetic data-content-phase=active><div class=cr_scrollBody data-conversation-scroll><div class=cr_viewArea><div data-chat-flow>${Array.from({length:rows},(_,i)=>`<section class=message data-chat-flow-key="message-${i}" data-chat-flow-kind=message data-chat-turn="${i+1}"><h3>合成段落 ${i+1}</h3><p>${'<span>这段文字用于验证长历史重排和重复绘制开销。</span>'.repeat(6)}</p><table><tr><td>项目</td><td>${i+1}</td><td>合成数据</td></tr></table><pre><code>${'const result = syntheticCalculation(index); '.repeat(5)}</code></pre></section>`).join('')}</div></div><div class=cr_composerSeat data-composer-seat><div class=ib_card data-composer-card><textarea aria-label=草稿>保留输入框草稿</textarea><div class=row><button aria-label=附件>＋</button><button aria-label=发送>↑</button></div></div></div></div></div></section></main><aside class=af_rightbarCol data-rightbar-col><h3>文件面板</h3><p>保留右侧面板状态</p></aside></div>`)
  await page.addScriptTag({content:react.outputFiles[0].text})
  await page.evaluate(({material})=>{
    const key='dsh-claude-beautify:settings:v1';window.cleanups=[];window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true
    // about:blank has no localStorage; the loader uses a safe default. Override
    // its reader only for this isolated, synthetic performance fixture.
    Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>JSON.stringify({welcomeEnabled:false,sidebarStyle:material,composerStyle:material,composerButtonGlass:false,turnGlass:true,particleEnabled:false}),setItem(){}}})
    window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(()=>window.testReact)}
    window.widthPublications=0;window.widths=[];window.nativeWidthObserver=new ResizeObserver(()=>{const body=document.querySelector('[data-conversation-content]');window.widthPublications++;window.widths.push(body.offsetWidth);body.style.setProperty('--dsh-conversation-column-width',body.offsetWidth+'px')});window.nativeWidthObserver.observe(document.querySelector('[data-conversation-content]'))
    window.presentationScans=0;const query=Document.prototype.querySelectorAll
    Document.prototype.querySelectorAll=function(selector){if(selector.includes('.dcb-summary[data-card-style]'))window.presentationScans++;return query.call(this,selector)}
  },{material})
  await page.addScriptTag({content:readFileSync(resolve(project,'client.js'),'utf8')})
  const buttonBundle=await build({stdin:{contents:"import {createFocusMode} from './src/focus-mode.js';import React from 'react';import {createRoot} from 'react-dom/client';window.focusManager=createFocusMode(React,document,window);createRoot(document.querySelector('#controls')).render(React.createElement(window.focusManager.Button))",resolveDir:project},bundle:true,write:false,format:'iife'})
  await page.evaluate(()=>window.plugin.apply({slots:{inject(_name,cb){cb()},register(){}},effect(cb){window.cleanups.push(cb())}}))
  await page.addScriptTag({content:buttonBundle.outputFiles[0].text})
  await page.waitForTimeout(450);await page.evaluate(()=>{document.querySelector('[data-conversation-scroll]').scrollTop=1200})
}
async function toggle(rows,material,direction){
  const profiling=process.env.DSH_FOCUS_CPU==='1'
  if(profiling){await cdp.send('Profiler.enable');await cdp.send('Profiler.start')}
  const before=await metrics()
  const result=await page.evaluate(()=>new Promise(done=>{
    const start=performance.now(),samples=[];window.widthPublications=0;window.widths=[];window.presentationScans=0;const seat=document.querySelector('[data-composer-seat]'),root=document.querySelector('.af_centerCol')
    document.querySelector('.dcb-focus-toggle').click()
    const tick=()=>{
      const time=performance.now()-start
      samples.push({time,seat:seat.getBoundingClientRect().height,center:root.getBoundingClientRect().width,body:document.querySelector('[data-conversation-content]').getBoundingClientRect().width})
      if(time<500||document.getAnimations().some(a=>a.id.startsWith('dcb-focus-')))requestAnimationFrame(tick)
      else done({samples,publications:window.widthPublications,widths:window.widths,presentationScans:window.presentationScans})
    };requestAnimationFrame(tick)
  }))
  const after=await metrics(),gaps=result.samples.slice(1).map((sample,i)=>sample.time-result.samples[i].time)
  if(profiling){
    const {profile}=await cdp.send('Profiler.stop'),counts=new Map(),nodes=new Map(profile.nodes.map(node=>[node.id,node]))
    for(const id of profile.samples||[])counts.set(id,(counts.get(id)||0)+1)
    console.log(JSON.stringify({cpu:[...counts].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([id,count])=>({count,...nodes.get(id).callFrame}))}))
    writeFileSync(resolve(output,`cpu-${rows}-${material}-${direction}.json`),JSON.stringify(profile))
  }
  const report={rows,material,direction,nodes:await page.locator('[data-chat-flow] *').count(),layouts:after.LayoutCount-before.LayoutCount,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000,styleMs:(after.RecalcStyleDuration-before.RecalcStyleDuration)*1000,scriptMs:(after.ScriptDuration-before.ScriptDuration)*1000,publications:result.publications,widths:result.widths,presentationScans:result.presentationScans,distinctSeatHeights:new Set(result.samples.map(sample=>Math.round(sample.seat*10)/10)).size,distinctCenterWidths:new Set(result.samples.map(sample=>Math.round(sample.center*10)/10)).size,distinctBodyWidths:new Set(result.samples.map(sample=>Math.round(sample.body*10)/10)).size,maxFrameMs:Math.max(...gaps),frames:result.samples.length}
  reports.push(report);console.log(JSON.stringify(report))
  if(phase!=='before'){
    assert.ok(report.layouts<=12,'Focus must keep layout bounded across native restoration, measurement and handoff, rather than laying out history every animation frame')
    assert.ok(report.distinctSeatHeights<=2,'Real input geometry only changes at the layout handoff')
    assert.equal(report.publications,0,'Focus must not republish the width or rewrap long history')
    assert.equal(report.distinctBodyWidths,1,'The reading column keeps one width throughout the handoff')
    assert.ok(report.presentationScans<=6,'A hidden sidebar must not reschedule the full presentation scan every frame')
    const idleScans=await page.evaluate(async()=>{const before=window.presentationScans;await new Promise(done=>setTimeout(done,180));return window.presentationScans-before})
    assert.equal(idleScans,0,'Settled focus mode has no background presentation scan loop')
    assert.equal(await page.locator('textarea').inputValue(),'保留输入框草稿')
    assert.equal(await page.locator('[data-dcb-focus-moving]').count(),0)
  }
}
try{
  for(const rows of process.env.DSH_FOCUS_CPU==='1'?[600]:[8,600])for(const material of process.env.DSH_FOCUS_CPU==='1'?['glass']:['milk','glass']){
    await boot(rows,material);for(const direction of['enter','exit'])await toggle(rows,material,direction)
    await page.evaluate(()=>{window.focusManager.dispose();window.nativeWidthObserver.disconnect();for(const cleanup of window.cleanups.reverse())cleanup?.()})
  }
  assert.deepEqual(errors,[]);writeFileSync(resolve(output,`performance-${phase}.json`),JSON.stringify({phase,note:'Isolated Chrome fixture using installed native styles and the complete plugin; not a desktop CPU/GPU measurement.',reports},null,2));console.log(JSON.stringify({passed:reports.length,output}))
}finally{await browser.close()}
