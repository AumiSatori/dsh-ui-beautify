import assert from 'node:assert/strict'
import {mkdirSync,readFileSync,writeFileSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {chromium} from '@playwright/test'
import {build} from 'esbuild'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'sidebar-layout')
mkdirSync(output,{recursive:true})
const layoutBundle=await build({entryPoints:[resolve(project,'src/sidebar-layout.js')],bundle:true,write:false,format:'iife',globalName:'Layout'})
const reactBundle=await build({stdin:{contents:"import React from 'react'; window.layoutTestReact=React",resolveDir:project},bundle:true,write:false,format:'iife'})
let css='',source='public-marker frame fixture'
if(process.env.DSH_ASAR){
  const fd=openSync(process.env.DSH_ASAR,'r')
  try{
    const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
    const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
    const tree=JSON.parse(json.toString()),base=8+head.readUInt32LE(4)
    for(const [pkg,module,prefix]of[['layout','AppFrame','af'],['conversation','ConversationRoot','cr']]){
      let entry=tree;for(const part of `dsh/node_modules/@deepseek-ai/dsh-client-ui-${pkg}/lib/client.js`.split('/'))entry=entry.files[part]
      const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,base+Number(entry.offset))
      const text=bytes.toString(),at=text.indexOf(module+'.module.css'),start=text.lastIndexOf('//#region',at),end=text.indexOf('//#endregion',at)
      const match=text.slice(start,end).match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)
      assert.ok(match,`Installed ${module} stylesheet exists`)
      const sheet=JSON.parse(match[1]),hash=sheet.match(new RegExp(`\\.([\\w-]+)_${module==='AppFrame'?'frame':'root'}\\{`))[1]
      css+=sheet.replaceAll(hash+'_',prefix+'_')
      if(pkg==='layout')assert.ok(text.includes('transition:grid-template-columns'))
      else assert.ok(text.includes('observer.observe(container)')&&text.includes('--dsh-conversation-column-width'))
    }
    source='installed DSH AppFrame and ConversationRoot styles; synthetic conversation and native-equivalent width publication'
  }finally{closeSync(fd)}
}
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const page=await browser.newPage({viewport:{width:1440,height:940}}),errors=[]
await page.route('http://sidebar-layout.test/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html>'}))
page.on('pageerror',error=>errors.push(error.message))
const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable')
const evidence=[]
async function metrics(){return Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]))}
async function settled(){await page.waitForFunction(()=>!document.querySelector('[data-dcb-sidebar-layout-lock], [data-dcb-sidebar-moving]'),null,{timeout:5000})}
async function boot({mode='native',rows=600}={}){
  await page.goto('http://sidebar-layout.test/')
  await page.setContent(`<!doctype html><html data-windows-titlebar><meta charset="utf-8"><style>${css}
  :root{--ds-transition-duration-slow:280ms;--ds-ease-in-out:cubic-bezier(.4,0,.2,1);--dsh-windows-titlebar-height:40px;--dsw-alias-bg-base:#fff;--dsw-specific-sidebar-fill:#f5f6f8;--dsw-alias-label-primary:#252832;--dsw-alias-label-secondary:#6e7483;--dsw-alias-border-l3:#e4e7ec}
  .cr_body{--dsh-chat-content-width:var(--dsh-chat-user-width,clamp(680px,calc(var(--dsh-conversation-column-width,0px) * .64),920px))}
  *{box-sizing:border-box}html,body{height:100%;margin:0;font:14px/1.65 system-ui;color:#252832}button,textarea{font:inherit}
  .af_frame{display:grid;grid-template-rows:minmax(0,1fr);height:100%;overflow:hidden;position:relative;padding-top:40px;background:#f5f6f8}.af_frame[data-animating]{transition:grid-template-columns 280ms cubic-bezier(.4,0,.2,1)}
  .af_sidebarCol{min-width:0;overflow:hidden}.sb_root{width:280px;height:100%;padding:14px;display:flex;flex-direction:column}.sb_logoRow{font-size:20px;font-weight:650;margin:20px 0}.sb_newSession{padding:12px}.sb_regionArea{flex:1;overflow:auto}.sb_regionArea button{display:block;width:100%;padding:14px;margin-top:4px;text-align:left;border:0;border-radius:8px;background:transparent}.sb_regionArea button[aria-selected=true]{background:#e7e9ef}.sb_footArea{padding:18px}
  .sb_toggle{position:fixed;left:12px;top:6px;width:28px;height:28px;border:0;background:transparent;z-index:30}.af_centerCol{display:flex;flex-direction:column;overflow:hidden;min-width:0}.cr_root{height:100%;min-height:0;display:flex;flex-direction:column}.cr_header{height:58px;flex:none;padding:16px 30px;border-bottom:1px solid #e4e7ec}.cr_body{display:flex;flex:1;flex-direction:column;min-height:0}.cr_scrollBody{display:flex;flex-direction:column;flex:1;min-height:0;overflow:auto}.cr_viewArea{flex:1 0 auto;display:flex;flex-direction:column}.message{width:min(100%,var(--dsh-chat-content-width,760px));margin:auto;padding:14px 20px}.message p{margin:5px 0 12px}.message code{font-family:monospace;overflow-wrap:anywhere}.message table{width:100%;border-collapse:collapse}.message td{border:1px solid #e2e6ed;padding:8px}.cr_composerSeat{position:sticky;bottom:0;padding:12px 24px;background:#fff;flex:none}textarea{height:68px;width:100%;resize:none;border:1px solid #dfe2ea;border-radius:14px;padding:12px}
  </style><div class="af_frame" data-sidebar-collapsed="false" style="grid-template-columns:280px minmax(0,1fr) 0px"><aside class="af_sidebarCol"><div class="sb_root"><div class="sb_logoRow">DeepSeek Harness<button class="sb_toggle" aria-label="切换侧栏">☰</button></div><button class="sb_newSession">新会话</button><div class="sb_regionArea">${Array.from({length:32},(_,i)=>`<button aria-selected="${i===2}">演示会话 ${i+1}</button>`).join('')}</div><div class="sb_footArea">设置</div></div></aside><main class="af_centerCol"><div data-slot="main" style="display:contents"><section class="cr_root" data-phase="active"><header class="cr_header">长对话排版性能检查</header><div class="cr_body" data-conversation-content data-conversation-session="synthetic"><div class="cr_scrollBody" data-conversation-scroll><div class="cr_viewArea"><div class="message" data-chat-flow>${Array.from({length:rows},(_,i)=>`<section data-chat-message><h3>演示段落 ${i+1}</h3><p>${'<span>这是一段用于验证窗口宽度变化时换行开销的合成文字。</span>'.repeat(6)}</p><table><tr><td>编号</td><td>${i+1}</td><td>演示内容</td></tr></table><pre><code>${'const value = calculateSyntheticValue(index); '.repeat(4)}</code></pre></section>`).join('')}</div></div><div class="cr_composerSeat" data-composer-seat><textarea aria-label="演示输入">保留这段草稿</textarea></div></div></div></section></div></main><aside class="af_rightbarCol"></aside></div></html>`)
  await page.evaluate(mode=>{
    const frame=document.querySelector('.af_frame'),body=document.querySelector('[data-conversation-content]'),root=document.querySelector('.cr_root')
    window.widthPublications=0;window.widthEvents=[];window.nativeWidthObserver=new ResizeObserver(()=>{window.widthPublications++;window.widthEvents.push({width:body.offsetWidth,held:root.hasAttribute('data-dcb-sidebar-layout-lock')});body.style.setProperty('--dsh-conversation-column-width',`${body.offsetWidth}px`)})
    window.nativeWidthObserver.observe(body)
    window.toggle=()=>{
      const collapsed=frame.getAttribute('data-sidebar-collapsed')!=='true'
      frame.setAttribute('data-animating','');frame.setAttribute('data-sidebar-collapsed',String(collapsed));frame.style.gridTemplateColumns=`${collapsed?0:280}px minmax(0,1fr) 0px`
      if(mode==='instant')frame.style.transition='none'
      clearTimeout(window.finishTimer);window.finishTimer=setTimeout(()=>frame.removeAttribute('data-animating'),360)
    }
    // Match React's delegated native click: the plugin's button listener runs
    // before the host changes its layout state at the outer event boundary.
    document.addEventListener('click',event=>{if(event.target.closest('.sb_toggle'))window.toggle()})
    document.querySelector('[data-conversation-scroll]').scrollTop=1200
  },mode)
  if(mode==='optimized'){
    await page.addScriptTag({content:reactBundle.outputFiles[0].text})
    await page.evaluate(()=>{
      window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true;window.cleanups=[]
      localStorage.setItem('dsh-claude-beautify:settings:v1',JSON.stringify({sidebarOverlay:false}))
      window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(()=>window.layoutTestReact)}
    })
    await page.addScriptTag({content:readFileSync(resolve(project,'client.js'),'utf8')})
    await page.evaluate(()=>window.plugin.apply({slots:{inject(_name,cb){cb()},register(){}},effect(cb){window.cleanups.push(cb())}}))
  }
  await page.addScriptTag({content:layoutBundle.outputFiles[0].text})
  await page.waitForTimeout(100)
}
async function run(mode,rows,direction='close'){
  if(direction==='close')await boot({mode,rows})
  // Measure the animated native path consistently, including a host version
  // which adds its data-animating flag after the initiating state update.
  await page.evaluate(()=>{const frame=document.querySelector('.af_frame');frame.setAttribute('data-animating','');getComputedStyle(frame).gridTemplateColumns})
  const before=await metrics()
  const result=await page.evaluate(()=>new Promise(done=>{
    const root=document.querySelector('.cr_root'),body=document.querySelector('[data-conversation-content]'),start=performance.now(),samples=[]
    window.widthPublications=0;window.widthEvents=[];document.querySelector('.sb_toggle').click()
    const frame=()=>{
      const time=performance.now()-start,shell=document.querySelector('.af_frame')
      const a=root.getBoundingClientRect(),b=document.querySelector('.af_centerCol').getBoundingClientRect(),header=root.querySelector('header').getBoundingClientRect(),composer=root.querySelector('[data-composer-seat]').getBoundingClientRect()
      samples.push({time,root:a.width,body:body.getBoundingClientRect().width,column:b.width,left:a.left,columnLeft:b.left,right:a.right,columnRight:b.right,headerLeft:header.left,headerRight:header.right,composerLeft:composer.left,composerRight:composer.right,messageWidth:document.querySelector('.message').getBoundingClientRect().width,lineHeight:document.querySelector('.message p').getBoundingClientRect().height})
      const moving=root.hasAttribute('data-dcb-sidebar-layout-lock')||shell.getAnimations().some(a=>a.transitionProperty==='grid-template-columns'&&a.playState==='running')
      if(time<440||moving&&time<1600)requestAnimationFrame(frame)
      else done({samples,widthEvents:window.widthEvents,widthPublications:window.widthPublications,draft:document.querySelector('textarea').value})
    };requestAnimationFrame(frame)
  }))
  const after=await metrics(),report={mode,rows,direction,nodes:await page.locator('[data-chat-flow] *').count(),layouts:after.LayoutCount-before.LayoutCount,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000,styleMs:(after.RecalcStyleDuration-before.RecalcStyleDuration)*1000,scriptMs:(after.ScriptDuration-before.ScriptDuration)*1000,widthPublications:result.widthPublications,widthEvents:result.widthEvents,distinctBodyWidths:new Set(result.samples.map(s=>Math.round(s.body))).size,samples:result.samples}
  evidence.push(report);console.log(JSON.stringify({...report,widthEvents:report.widthEvents.length,samples:report.samples.length,rootWidthRange:[Math.min(...report.samples.map(s=>s.root)),Math.max(...report.samples.map(s=>s.root))]}));return report
}
try{
  for(const rows of[8,600])for(const mode of['native','optimized','instant']){
    for(const direction of['close','open']){
      const result=await run(mode,rows,direction)
      if(mode==='optimized'){
        assert.ok(result.samples.every(s=>Math.abs(s.root-s.column)<.5&&Math.abs(s.body-s.column)<.5),'the root and body always fit the live native column')
        assert.ok(result.samples.every(s=>Math.abs(s.left-s.columnLeft)<.5&&Math.abs(s.right-s.columnRight)<.5&&s.headerLeft>=s.columnLeft-.5&&s.headerRight<=s.columnRight+.5&&s.composerLeft>=s.columnLeft-.5&&s.composerRight<=s.columnRight+.5),'header and composer never shift outside the live column')
        const settledText=result.samples.filter(s=>s.time>=80)
        assert.equal(new Set(settledText.map(s=>s.messageWidth)).size,1,'message width never jumps at the tail')
        assert.equal(new Set(settledText.map(s=>s.lineHeight)).size,1,'text wrapping never changes at the tail')
        assert.ok(new Set(result.samples.map(s=>Math.round(s.column))).size>=4,'the sidebar still has real intermediate grid widths')
        assert.equal(await page.locator('[data-dcb-sidebar-layout-lock]').count(),0)
        assert.equal(await page.locator('textarea').inputValue(),'保留这段草稿')
        assert.equal(await page.locator('.cr_root').evaluate(el=>[el.style.width,el.style.minWidth,el.style.maxWidth].join('')),'')
        assert.equal(await page.locator('[data-conversation-content]').evaluate(el=>el.style.getPropertyValue('--dsh-chat-content-width')),'')
        if(rows===600)await page.screenshot({path:resolve(output,`long-history-${direction}-complete.png`)})
      }
    }
  }
  await boot({mode:'optimized',rows:100})
  await page.evaluate(()=>{
    const frame=document.querySelector('.af_frame')
    frame.style.transition='none';frame.style.gridTemplateColumns='280px minmax(400px,1fr) minmax(0px,420px)';frame.style.columnGap='8px'
    getComputedStyle(frame).gridTemplateColumns;frame.style.transition=''
    window.toggle=()=>{const collapsed=frame.getAttribute('data-sidebar-collapsed')!=='true';frame.setAttribute('data-animating','');frame.setAttribute('data-sidebar-collapsed',String(collapsed));frame.style.gridTemplateColumns=`${collapsed?0:280}px minmax(400px,1fr) minmax(0px,420px)`}
  });await page.waitForTimeout(60)
  for(let i=0;i<2;i++){
    await page.evaluate(()=>document.querySelector('.sb_toggle').click());await page.waitForTimeout(55)
    const initial=await page.evaluate(()=>({root:document.querySelector('.cr_root').getBoundingClientRect().width,column:document.querySelector('.af_centerCol').getBoundingClientRect().width}))
    assert.ok(Math.abs(initial.root-initial.column)<.5,'the root fits even while rightbar minmax and gaps animate')
    await settled()
    const final=await page.locator('.af_centerCol').evaluate(el=>el.getBoundingClientRect().width)
    assert.ok(Math.abs((await page.locator('.cr_root').boundingBox()).width-final)<.5,'settled root matches the final native column')
    assert.equal(await page.locator('[data-dcb-sidebar-layout-lock]').count(),0)
    assert.equal(await page.locator('[data-dcb-sidebar-layout-probe]').count(),0)
  }
  await boot({mode:'optimized',rows:100})
  await page.locator('textarea').focus();await page.locator('textarea').evaluate(el=>{el.setSelectionRange(2,5);window.editor=el})
  await page.evaluate(()=>document.querySelector('.sb_toggle').click());await page.waitForTimeout(70)
  assert.equal(await page.locator('[data-dcb-sidebar-layout-lock]').count(),1)
  await page.screenshot({path:resolve(output,'held-history-middle.png')})
  const reversal=await page.evaluate(()=>{const root=document.querySelector('.cr_root');document.querySelector('.sb_toggle').click();return {root:root.getBoundingClientRect().width,column:document.querySelector('.af_centerCol').getBoundingClientRect().width,editor:window.editor===document.querySelector('textarea'),focus:document.activeElement===window.editor,start:window.editor.selectionStart,end:window.editor.selectionEnd}})
  assert.ok(Math.abs(reversal.root-reversal.column)<.5)
  assert.deepEqual({editor:reversal.editor,focus:reversal.focus,start:reversal.start,end:reversal.end},{editor:true,focus:true,start:2,end:5})
  await settled();assert.equal(await page.locator('[data-dcb-sidebar-layout-lock]').count(),0)
  assert.ok(await page.locator('[data-conversation-scroll]').evaluate(el=>el.scrollTop)>0)
  await page.evaluate(()=>document.querySelector('.sb_toggle').click());await page.waitForTimeout(65)
  await page.setViewportSize({width:1300,height:900});await page.waitForTimeout(30);assert.equal(await page.locator('[data-dcb-sidebar-layout-lock]').count(),0)
  await settled()
  await page.evaluate(()=>document.querySelector('.sb_toggle').click());await page.waitForTimeout(60)
  await page.evaluate(()=>document.querySelector('.af_frame').setAttribute('data-dragging',''));await page.waitForTimeout(30);assert.equal(await page.locator('[data-dcb-sidebar-layout-lock]').count(),0)
  await page.evaluate(()=>document.querySelector('.af_frame').removeAttribute('data-dragging'));await settled()
  await page.evaluate(()=>document.querySelector('.sb_toggle').click());await page.waitForTimeout(60)
  await page.evaluate(()=>{for(const fn of window.cleanups.reverse())fn?.()});assert.equal(await page.locator('[data-dcb-sidebar-layout-lock]').count(),0)
  for(const options of[{reducedMotion:'reduce'},{forcedColors:'active'}]){
    await page.emulateMedia(options);await boot({mode:'optimized',rows:8});await page.evaluate(()=>document.querySelector('.sb_toggle').click());await page.waitForTimeout(30)
    assert.equal(await page.locator('[data-dcb-sidebar-layout-lock]').count(),0)
  }
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
  for(const [width,height,zoom]of [[1706,1018,1],[1280,800,.9],[1706,1018,1.25],[760,900,1]]){
    await page.setViewportSize({width,height});await boot({mode:'optimized',rows:32})
    await page.evaluate(zoom=>{document.body.style.zoom=zoom;document.body.setAttribute('data-ds-dark-theme','')},zoom)
    for(let i=0;i<4;i++){
      await page.evaluate(()=>document.querySelector('.sb_toggle').click());await settled()
      const geometry=await page.evaluate(()=>{const a=document.querySelector('.cr_root'),b=document.querySelector('.af_centerCol'),c=document.querySelector('[data-conversation-content]'),x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return{left:x.left-y.left,right:x.right-y.right,styles:[a.style.width,a.style.minWidth,a.style.maxWidth].join(''),text:c.style.getPropertyValue('--dsh-chat-content-width'),probes:document.querySelectorAll('[data-dcb-sidebar-layout-probe]').length}})
      assert.ok(Math.abs(geometry.left)<.5&&Math.abs(geometry.right)<.5,'zoom and repeated toggles never leave a shifted or oversized chat')
      assert.equal(geometry.styles,'');assert.equal(geometry.text,'');assert.equal(geometry.probes,0)
    }
    if(zoom===1&&width===1706)await page.screenshot({path:resolve(output,'sidebar-open-no-gap.png')})
  }
  await page.setViewportSize({width:1440,height:940})
  await boot({mode:'optimized',rows:8});await page.locator('textarea').focus();await page.evaluate(()=>document.querySelector('.sb_toggle').click());await page.waitForTimeout(60)
  await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-dcb-sidebar-layout-lock]').count(),0)
  await boot({mode:'native',rows:8})
  const lifecycle=await page.evaluate(async()=>{
    const frame=document.querySelector('.af_frame'),root=document.querySelector('.cr_root'),body=document.querySelector('[data-conversation-content]'),layout=Layout.createSidebarLayout(document,window)
    root.style.setProperty('min-width','0px');root.style.setProperty('max-width','100%','important')
    window.probeMaxNodes=0;window.deepCopies=0
    const clone=Node.prototype.cloneNode,append=Element.prototype.append
    Node.prototype.cloneNode=function(deep){if(deep)window.deepCopies++;return clone.call(this,deep)}
    Element.prototype.append=function(...nodes){for(const node of nodes)if(node.matches?.('[data-dcb-sidebar-layout-probe]'))window.probeMaxNodes=Math.max(window.probeMaxNodes,node.querySelectorAll('*').length);return append.apply(this,nodes)}
    layout.hold(frame);layout.release(frame)
    const restored=[root.style.getPropertyValue('min-width'),root.style.getPropertyValue('max-width'),root.style.getPropertyPriority('max-width')]
    body.style.setProperty('--dsh-chat-content-width','777px','important');layout.hold(frame);layout.release(frame);const originalText=body.style.getPropertyValue('--dsh-chat-content-width')
    layout.hold(frame);body.style.setProperty('--dsh-chat-content-width','800px');layout.release(frame);const foreign=body.style.getPropertyValue('--dsh-chat-content-width')
    body.style.removeProperty('--dsh-chat-content-width');layout.hold(frame);await new Promise(done=>setTimeout(done,1100));const timedOut=!root.hasAttribute('data-dcb-sidebar-layout-lock')&&!body.style.getPropertyValue('--dsh-chat-content-width')
    layout.dispose();Node.prototype.cloneNode=clone;Element.prototype.append=append
    return {restored,originalText,foreign,timedOut,deepCopies:window.deepCopies,probeMaxNodes:window.probeMaxNodes}
  });assert.deepEqual(lifecycle,{restored:['0px','100%','important'],originalText:'777px',foreign:'800px',timedOut:true,deepCopies:0,probeMaxNodes:6})
  assert.deepEqual(errors,[])
  console.log('PASS both directions fit the native column at every sampled frame; repeated toggles, zoom, resize, reversal, interaction, accessibility and disposal clear temporary styles')
  writeFileSync(resolve(output,'layout-comparison.json'),JSON.stringify({source,note:'Isolated browser reproduction, not a trace of the running DSH desktop.',evidence},null,2)+'\n')
}finally{await browser.close()}
