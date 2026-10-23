import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'../../outputs/dsh-ui-beautify'),'turn-cards')
mkdirSync(output,{recursive:true})
let hostCss='.native_column{width:100%;max-width:1000px;margin:auto;display:flex;flex-direction:column}.native_flowItem{min-width:0}[data-slot="conversation.chat.flow"]>*+*{margin-top:6px}'
let source='public-marker fixture'
if(process.env.DSH_ASAR){
  const fd=openSync(process.env.DSH_ASAR,'r')
  try{
    const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
    const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
    let entry=JSON.parse(json)
    for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js'.split('/'))entry=entry.files[part]
    const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset))
    const host=bytes.toString(),at=host.indexOf('ChatView.module.css'),start=host.lastIndexOf('//#region',at),end=host.indexOf('//#endregion',at)
    const literal=host.slice(start,end).match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)
    assert.ok(literal,'Read the installed ChatView stylesheet')
    const css=JSON.parse(literal[1]),prefix=css.match(/\.([\w]+)_column\{/)[1]
    hostCss=css.replaceAll(prefix+'_','native_')
    for(const marker of ['data-chat-flow','data-chat-turn','conversation.chat.flow','data-step-process-content'])assert.ok(host.includes(marker))
    source='installed ChatView stylesheet and verified public markers; synthetic messages'
  }finally{closeSync(fd)}
}
const bundle=await build({entryPoints:[resolve(project,'src/turn-cards.js')],bundle:true,write:false,format:'iife',globalName:'TurnCards'})
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const page=await browser.newPage({viewport:{width:1440,height:1040}}),errors=[]
page.on('pageerror',e=>errors.push(e.message))
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
const tick=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(done)))))
async function boot(){
  await page.setViewportSize({width:1440,height:1040})
  await page.goto('about:blank');await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${hostCss}
    :root{--dsh-chat-content-width:1000px;--dsh-composer-side-clearance:0px}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 75% 0,#d7e5ef,transparent 65%),#f1f3f6;color:#292d33;font:15px/1.8 system-ui}body[data-ds-dark-theme]{background:radial-gradient(ellipse at 70% 0,#263244,transparent 65%),#171b23;color:#e5e9f0}aside{position:fixed;inset:16px auto 16px 16px;width:218px;border-radius:22px;padding:22px;background:#ffffff8f;border:1px solid #ffffffbd;backdrop-filter:blur(2px)}body[data-ds-dark-theme] aside{background:#181c24c7;border-color:#ffffff3d}aside p{padding:10px;border-radius:9px}aside p:first-of-type{background:#8882}main{margin-left:254px;padding:20px 24px 0}header{height:52px;padding-inline:24px;font-weight:600}[data-conversation-scroll]{height:960px;overflow:auto;padding:12px 16px 90px}.user{width:fit-content;max-width:85%;margin-left:auto;background:#969de41f;border-radius:16px;padding:10px 16px}.meta{font-size:12px;opacity:.55}.body{padding:6px 0}p{margin:10px 0}h3{font-size:17px;margin:4px 0 10px}.process{opacity:.65;border-bottom:1px solid #8883;padding-block:10px}.actions{display:flex;gap:12px;margin-top:12px}button{font:inherit;color:inherit;border:1px solid #8883;background:transparent;padding:3px 10px;border-radius:8px;cursor:pointer}pre{overflow:auto;background:#8881;border:1px solid #8883;border-radius:10px;padding:14px}.artifact{display:flex;align-items:center;gap:14px;border:1px solid #8883;border-radius:12px;padding:10px 14px}.file{font-size:12px;border:1px solid #8883;border-radius:7px;padding:10px}textarea{font:inherit;width:100%;height:60px;border:1px solid #8883;border-radius:14px;background:#ffffffaa;padding:14px;color:#292d33}@media(max-width:600px){aside{display:none}main{margin:0;padding:12px 6px}header{padding-inline:16px}[data-conversation-scroll]{padding-inline:6px;height:750px}}
    </style><aside><strong>DeepSeek Harness</strong><p>设计工作区</p><p>对话卡片</p><p>界面预览</p></aside><main data-conversation-content data-conversation-session="demo"><header>圆角玻璃 · 分轮对话</header><section data-conversation-scroll><div data-chat-following-tail><div class="native_column" data-chat-flow><div data-slot="conversation.chat.flow" style="display:contents"></div></div></div></section></main>`)
  await page.addScriptTag({content:bundle.outputFiles[0].text})
  await page.evaluate(()=>{
    const style=document.createElement('style');style.textContent=TurnCards.turnCardsCss;document.head.append(style)
    window.list=document.querySelector('[data-slot="conversation.chat.flow"]')
    window.row=(turn,kind,html)=>{const el=document.createElement('div');el.className='native_flowItem';el.dataset.chatTurn=turn;el.dataset.chatFlowKind=kind;el.dataset.chatFlowKey=turn+'-'+kind;el.innerHTML=`<div data-slot="conversation.chat.node">${html}</div>`;return el}
    list.append(row(1,'user','<div class="user">整理一下今天的设计思路</div>'),row(1,'turn-process','<div class="process">已完成，用时 6 秒 · 整理材料与布局</div>'),row(1,'assistant-step','<div class="body"><h3>先把信息层次整理清楚。</h3><p>每轮提问和回复放在同一块圆角玻璃里，轮次之间保持清晰间距。过程记录、文件和操作入口仍留在原来的位置。</p><div class="artifact"><span class="file">MD</span><span>设计整理.md<br><small class="meta">Markdown · 设计文档</small></span><button onclick="window.opened=(window.opened||0)+1">打开文件</button></div><div class="actions"><button onclick="window.copied=(window.copied||0)+1">复制</button><button>赞</button><span class="meta">16:20</span></div></div>'))
    list.append(row(2,'user','<div class="user">第二轮保留代码和表格的可读性</div>'))
    const process=row(2,'turn-process','<div data-step-process><div class="process">已完成，用时 3 秒</div><div data-step-process-content data-chat-flow><div data-chat-turn="2" data-chat-flow-kind="assistant-step">检查长内容、交互与滚动边界</div></div></div>')
    list.append(process,row(2,'assistant-step','<div class="body"><h3>内容保持原样，玻璃底板负责分隔。</h3><p>代码、文件卡片和按钮都保持可操作；内容增长时底板自然延展。</p><pre><code>const spacing = 24;\nconst radius = 22;</code></pre><div class="actions"><button>复制</button><span class="meta">16:22</span></div></div>'))
    window.nativeRows=[...list.children];window.nativeParents=nativeRows.map(row=>row.parentElement)
    window.nativeGeometry=()=>[...list.children].map(row=>{const css=getComputedStyle(row),rect=row.getBoundingClientRect();return{height:rect.height,width:rect.width,padding:css.padding,margin:css.margin,position:css.position,pseudo:getComputedStyle(row,'::before').content}})
    window.nativeBaseline=nativeGeometry()
    window.manager=TurnCards.createTurnCards(document,window)
  })
  await tick();await page.waitForFunction(()=>document.querySelector('[data-dcb-turn-head]')?.style.getPropertyValue('--dcb-turn-height'))
}
try{
  await check('rebuilt native DOM carrying old decoration leaves no user-only glass after switching off',async()=>{
    await boot()
    await page.evaluate(()=>{
      const flow=document.querySelector('[data-dcb-turn-surface]'),copy=flow.cloneNode(true)
      for(const head of copy.querySelectorAll('[data-dcb-turn-head]'))head.style.removeProperty('--dcb-turn-height')
      flow.replaceWith(copy);window.list=copy.querySelector('[data-slot="conversation.chat.flow"]')
    });await tick()
    await page.evaluate(()=>manager.setOptions({enabled:false,style:'css'}));await tick()
    await page.screenshot({path:resolve(output,'turn-toggle-rebuilt-off.png')})
    const residue=await page.evaluate(()=>({heads:document.querySelectorAll('[data-dcb-turn-head]').length,surfaces:document.querySelectorAll('[data-dcb-turn-surface]').length,heights:document.querySelectorAll('[style*="--dcb-turn-height"]').length,pseudo:getComputedStyle(list.children[0],'::before').content}))
    assert.deepEqual(residue,{heads:0,surfaces:0,heights:0,pseudo:'none'})
    assert.equal(await page.evaluate(()=>JSON.stringify(nativeGeometry())===JSON.stringify(nativeBaseline)),true,'the original native geometry is fully restored')
  })
  await check('retained markup arriving after disable cannot paint a glass surface and re-enabling cleans it before painting',async()=>{
    await boot()
    await page.evaluate(()=>{
      window.retained=document.querySelector('[data-dcb-turn-surface]').cloneNode(true)
      manager.setOptions({enabled:false,style:'glass'});document.querySelector('[data-conversation-scroll]').append(retained)
    });await tick();await page.waitForTimeout(100)
    const inactive=await page.evaluate(()=>{const row=retained.querySelector('[data-dcb-turn-head]'),css=getComputedStyle(row,'::before');return{enabled:document.body.hasAttribute('data-dcb-turn-cards-enabled'),content:css.content,shadow:css.boxShadow,blur:css.backdropFilter}})
    assert.deepEqual(inactive,{enabled:false,content:'none',shadow:'none',blur:'none'})
    await page.evaluate(()=>manager.setOptions({enabled:true,style:'css'}));await tick()
    assert.equal(await page.locator('[data-dcb-turn-head]').count(),4)
    await page.evaluate(()=>manager.setOptions({enabled:false,style:'css'}));await tick()
    assert.equal(await page.locator('[data-dcb-turn-head], [data-dcb-turn-surface], [data-dcb-turn-focused], [data-dcb-turn-jump], [style*="--dcb-turn-height"]').count(),0)
  })
  await check('rapid toggles during streaming and navigation cancel queued work and restore the native pixels and layout',async()=>{
    await boot()
    await page.evaluate(()=>{
      window.assertClean=()=>({attrs:document.querySelectorAll('[data-dcb-turn-head], [data-dcb-turn-row], [data-dcb-turn-surface], [data-dcb-turn-visible], [data-dcb-turn-arriving], [data-dcb-turn-focused], [data-dcb-turn-jump], [style*="--dcb-turn-height"]').length,enabled:document.body.hasAttribute('data-dcb-turn-cards-enabled')})
    })
    for(let i=0;i<6;i++){
      await page.evaluate(i=>{
        manager.setOptions({enabled:true,style:i%2?'glass':'css'})
        const paragraph=document.createElement('p');paragraph.textContent='持续输出时切换开关。';list.children[2].append(paragraph)
      },i);await tick()
      await page.evaluate(()=>{
        list.children[3].dispatchEvent(new MouseEvent('dblclick',{bubbles:true,button:0}))
        manager.setOptions({enabled:false,style:'css'});manager.setOptions({enabled:true,style:'glass'});manager.setOptions({enabled:false,style:'glass'})
      });await tick()
      assert.deepEqual(await page.evaluate(()=>assertClean()),{attrs:0,enabled:false})
    }
    await page.waitForTimeout(400)
    assert.deepEqual(await page.evaluate(()=>assertClean()),{attrs:0,enabled:false})
    await page.screenshot({path:resolve(output,'turn-toggle-streaming-off.png')})
  })
  await check('starting disabled removes retained decorations from an earlier plugin activation',async()=>{
    await boot()
    await page.evaluate(()=>{
      const retained=document.querySelector('[data-dcb-turn-surface]').cloneNode(true)
      manager.dispose();list.parentElement.replaceWith(retained);window.list=retained.querySelector('[data-slot="conversation.chat.flow"]')
      window.manager=TurnCards.createTurnCards(document,window,{enabled:false})
    });await tick()
    assert.equal(await page.locator('[data-dcb-turn-head], [data-dcb-turn-surface], [style*="--dcb-turn-height"]').count(),0)
    assert.equal(await page.evaluate(()=>getComputedStyle(list.children[0],'::before').content),'none')
  })
  await boot()
  await check('one continuous rounded surface per turn leaves native nodes and nested process flows untouched',async()=>{
    assert.equal(await page.locator('[data-dcb-turn-head]').count(),2)
    assert.equal(await page.locator('[data-dcb-turn-row]').count(),6)
    assert.equal(await page.locator('[data-step-process-content] [data-dcb-turn-row]').count(),0)
    assert.equal(await page.evaluate(()=>nativeRows.every((row,i)=>row===list.children[i]&&row.parentElement===nativeParents[i])),true)
    const geometry=await page.evaluate(()=>{const a=[...list.querySelectorAll(':scope > [data-dcb-turn-head]')],tail=list.querySelector('[data-dcb-turn-tail]');return{height:parseFloat(a[0].style.getPropertyValue('--dcb-turn-height')),span:tail.getBoundingClientRect().bottom-a[0].getBoundingClientRect().top,gap:a[1].getBoundingClientRect().top-tail.getBoundingClientRect().bottom,radius:getComputedStyle(a[0],'::before').borderRadius}})
    assert.ok(Math.abs(geometry.height-geometry.span)<1);assert.equal(geometry.gap,24);assert.equal(geometry.radius,'20px')
    assert.equal(await page.locator('[data-dcb-turn-arriving]').count(),0,'history never replays its entrance')
    await page.screenshot({path:resolve(output,'turn-cards-light.png')})
  })
  await check('copy, files, text selection and native focus retain their original behavior',async()=>{
    await page.getByRole('button',{name:'打开文件',exact:true}).click();await page.getByRole('button',{name:'复制',exact:true}).first().click()
    assert.equal(await page.evaluate(()=>window.opened),1);assert.equal(await page.evaluate(()=>window.copied),1)
    const selected=await page.evaluate(()=>{const node=list.querySelector('h3'),range=document.createRange();range.selectNodeContents(node);getSelection().removeAllRanges();getSelection().addRange(range);return getSelection().toString()})
    assert.ok(selected.includes('信息层次'));await page.evaluate(()=>getSelection().removeAllRanges())
  })
  await check('streaming growth measures only the affected turn without replaying or scanning history',async()=>{
    const result=await page.evaluate(async()=>{
      const head=list.querySelector('[data-dcb-turn-head]'),before=parseFloat(head.style.getPropertyValue('--dcb-turn-height')),original=Element.prototype.getBoundingClientRect;let reads=0
      Element.prototype.getBoundingClientRect=function(){reads++;return original.call(this)}
      const p=document.createElement('p');p.textContent='流式回复逐步增加。'.repeat(35);list.children[2].append(p)
      await new Promise(done=>setTimeout(done,100));const after=parseFloat(head.style.getPropertyValue('--dcb-turn-height'));Element.prototype.getBoundingClientRect=original
      return{before,after,reads,arriving:document.querySelectorAll('[data-dcb-turn-arriving]').length}
    })
    assert.ok(result.after>result.before);assert.ok(result.reads<=6,`only the changed group should be measured (${result.reads})`);assert.equal(result.arriving,0)
  })
  await check('new rounds visibly ease in while acknowledgement and prepended history do not replay',async()=>{
    await page.evaluate(()=>{window.newRow=row(3,'user','<div class="user">新的一轮从这里开始。</div>');list.append(newRow)})
    await tick()
    const middle=await page.evaluate(()=>{const a=newRow.getAnimations({subtree:true}).find(a=>a.animationName==='dcb-turn-card-in');a.pause();a.currentTime=80;const css=getComputedStyle(newRow,'::before');return{opacity:Number(css.opacity),y:new DOMMatrix(css.transform).m42,filter:css.backdropFilter}})
    assert.ok(middle.opacity>0&&middle.opacity<1);assert.ok(middle.y>0)
    await page.screenshot({path:resolve(output,'turn-card-entrance-middle.png')})
    await page.evaluate(()=>newRow.getAnimations({subtree:true}).forEach(a=>a.finish()));await page.waitForTimeout(320)
    await page.evaluate(()=>{list.prepend(row(0,'assistant-step','<p>向前加载的历史</p>'));list.append(row(3,'assistant-step','<p>同轮后续回复</p>'))});await tick()
    assert.equal(await page.locator('[data-dcb-turn-arriving]').count(),0)
  })
  await check('old glass names migrate to a flat surface without filters, shadows, canvases or sidebar coupling',async()=>{
    await boot()
    for(const style of ['milk','css','clear','glass']){
      await page.evaluate(style=>manager.setOptions({enabled:true,style}),style);await tick()
      assert.equal(await page.locator('[data-dcb-turn-surface]').getAttribute('data-dcb-turn-surface'),'soft')
      const cost=await page.locator('[data-dcb-turn-head]').first().evaluate(el=>{const css=getComputedStyle(el,'::before');return{blur:css.backdropFilter,filter:css.filter,shadow:css.boxShadow,animation:css.animationName,transition:css.transitionDuration,canvases:document.querySelectorAll('canvas').length}})
      assert.deepEqual(cost,{blur:'none',filter:'none',shadow:'none',animation:'none',transition:'0s',canvases:0})
    }
    await page.evaluate(()=>{document.body.setAttribute('data-ds-dark-theme','');document.querySelector('[data-conversation-scroll]').scrollTop=0});await tick();await page.waitForTimeout(300)
    assert.equal(await page.locator('[data-dcb-turn-head]').first().evaluate(el=>getComputedStyle(el,'::before').backgroundColor),'rgb(35, 37, 42)')
    await page.screenshot({path:resolve(output,'turn-cards-dark.png')})
    await page.setViewportSize({width:390,height:844});await tick()
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await page.screenshot({path:resolve(output,'turn-cards-mobile.png')})
    await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>list.append(row(4,'user','<div class="user">减少动态效果</div>')));await tick()
    assert.equal(await page.locator('[data-dcb-turn-arriving]').count(),0)
    await page.emulateMedia({forcedColors:'active'});await tick()
    assert.equal(await page.locator('[data-dcb-turn-head]').first().evaluate(el=>getComputedStyle(el,'::before').backdropFilter),'none')
  })
  await check('minimal dividers omit full-height surfaces and do no geometry reads during streaming',async()=>{
    await boot()
    await page.evaluate(()=>manager.setOptions({enabled:true,style:'line'}));await tick()
    const style=await page.locator('[data-dcb-turn-head]').nth(1).evaluate(el=>{const css=getComputedStyle(el,'::before');return{height:css.height,blur:css.backdropFilter,filter:css.filter,shadow:css.boxShadow,background:css.backgroundColor}})
    assert.deepEqual(style,{height:'1px',blur:'none',filter:'none',shadow:'none',background:'rgb(229, 231, 235)'})
    assert.equal(await page.locator('[style*="--dcb-turn-height"]').count(),0)
    const reads=await page.evaluate(async()=>{
      const rect=Element.prototype.getBoundingClientRect;let count=0
      Element.prototype.getBoundingClientRect=function(){count++;return rect.call(this)}
      for(let i=0;i<25;i++){list.children[2].querySelector('p').firstChild.appendData('继续输出。');await new Promise(requestAnimationFrame)}
      await new Promise(done=>setTimeout(done,100));Element.prototype.getBoundingClientRect=rect;return count
    })
    assert.equal(reads,0)
    await page.screenshot({path:resolve(output,'turn-dividers-light.png')})
    await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await tick()
    await page.screenshot({path:resolve(output,'turn-dividers-dark.png')})
    await page.evaluate(()=>manager.setOptions({enabled:true,style:'soft'}));await tick()
    assert.equal(await page.locator('[style*="--dcb-turn-height"]').count(),2,'returning to cards restores height tracking')
  })
  await check('a pending submission gets one surface and durable acknowledgement does not replay its entrance',async()=>{
    await boot()
    await page.evaluate(()=>{window.echo=document.createElement('div');echo.dataset.submissionEcho='true';echo.innerHTML='<div class="user">等待确认的新消息</div>';list.append(echo)})
    await tick();assert.equal(await page.locator('[data-dcb-turn-arriving]').count(),1)
    await page.evaluate(()=>echo.replaceWith(row(3,'user','<div class="user">等待确认的新消息</div>')));await tick()
    assert.equal(await page.locator('[data-dcb-turn-head]').count(),3)
    assert.equal(await page.locator('[data-dcb-turn-arriving]').count(),0)
  })
  await check('offscreen turns release blur and idle or paragraph mutations do not traverse a long transcript',async()=>{
    await boot()
    await page.evaluate(()=>{for(let turn=3;turn<160;turn++)list.append(row(turn,'user','<div class="user">历史提问 '+turn+'</div>'),row(turn,'assistant-step','<p>对应回复保持原来的节点。</p>'))})
    await tick();await page.waitForTimeout(100)
    const count=await page.locator('[data-dcb-turn-head][data-dcb-turn-visible]').count();assert.ok(count<15)
    const bottom=page.locator('[data-dcb-turn-head]').last();assert.equal(await bottom.evaluate(el=>getComputedStyle(el,'::before').backdropFilter),'none')
    const idle=await page.evaluate(async()=>{
      const rect=Element.prototype.getBoundingClientRect,query=Element.prototype.querySelectorAll;let reads=0,queries=0
      Element.prototype.getBoundingClientRect=function(){reads++;return rect.call(this)};Element.prototype.querySelectorAll=function(...args){queries++;return query.apply(this,args)}
      for(let i=0;i<20;i++)list.children[2].querySelector('p').firstChild.appendData('。')
      await new Promise(done=>setTimeout(done,100));const activeReads=reads;reads=0;queries=0
      await new Promise(done=>setTimeout(done,180));const result={activeReads,idleReads:reads,queries};Element.prototype.getBoundingClientRect=rect;Element.prototype.querySelectorAll=query;return result
    })
    assert.ok(idle.activeReads<=6);assert.equal(idle.idleReads,0);assert.equal(idle.queries,0)
  })
  await check('disable, session replacement, remount and disposal restore styles and release every owned mark',async()=>{
    await page.evaluate(()=>manager.setOptions({enabled:false,style:'glass'}));await tick()
    assert.equal(await page.locator('[data-dcb-turn-head], [data-dcb-turn-row], [data-dcb-turn-surface]').count(),0)
    await page.evaluate(()=>manager.setOptions({enabled:true,style:'css'}));await tick()
    await page.evaluate(()=>{document.querySelector('main').dataset.conversationSession='another';list.replaceChildren(row(1,'user','<div class="user">另一个会话</div>'))});await tick()
    assert.equal(await page.locator('[data-dcb-turn-head]').count(),1)
    await page.evaluate(()=>manager.dispose());await tick()
    assert.equal(await page.locator('[data-dcb-turn-head], [data-dcb-turn-row], [data-dcb-turn-surface]').count(),0)
    assert.equal(await page.locator('[style*="--dcb-turn-height"]').count(),0)
  })
  await check('double-click scrolls down to the chosen turn with a real middle frame, native scroll events and final cleanup',async()=>{
    await boot()
    await page.evaluate(()=>{window.scroller=document.querySelector('[data-conversation-scroll]');scroller.style.height='520px';window.scrollEvents=[];scroller.addEventListener('scroll',()=>scrollEvents.push(scroller.scrollTop))});await tick()
    await page.locator('[data-dcb-turn-head]').nth(1).dblclick({position:{x:10,y:15}})
    await page.waitForTimeout(70)
    const middle=await page.evaluate(()=>{const head=list.querySelectorAll('[data-dcb-turn-head]')[1],css=getComputedStyle(head,'::before');return{top:scroller.scrollTop,direction:head.getAttribute('data-dcb-turn-jump'),translate:new DOMMatrix(css.transform).m42,goal:scroller.scrollTop+head.getBoundingClientRect().top-scroller.getBoundingClientRect().top-24}})
    assert.ok(middle.top>0&&middle.top<middle.goal-1);assert.equal(middle.direction,'down');assert.ok(middle.translate>0)
    await page.screenshot({path:resolve(output,'turn-jump-down-middle.png')})
    await page.waitForFunction(()=>!document.querySelector('[data-dcb-turn-jump]'))
    const landing=await page.evaluate(()=>({distance:list.querySelectorAll('[data-dcb-turn-head]')[1].getBoundingClientRect().top-scroller.getBoundingClientRect().top,events:scrollEvents.length,inline:scroller.style.scrollBehavior,transform:getComputedStyle(list.children[3]).transform}))
    assert.ok(Math.abs(landing.distance-24)<1);assert.ok(landing.events>2);assert.equal(landing.inline,'');assert.equal(landing.transform,'none')
    assert.equal(await page.locator('[data-dcb-turn-focused]').count(),1)
  })
  await check('double-clicking an earlier visible card pulls down toward that turn without selecting a button',async()=>{
    await page.evaluate(()=>scroller.scrollTop=180);await tick()
    const point=await page.locator('[data-dcb-turn-tail]').first().evaluate(el=>{const r=el.getBoundingClientRect(),view=scroller.getBoundingClientRect();return{x:r.left+10,y:Math.max(r.top+12,view.top+35)}})
    await page.mouse.dblclick(point.x,point.y);await page.waitForTimeout(65)
    const middle=await page.evaluate(()=>({top:scroller.scrollTop,direction:list.children[0].getAttribute('data-dcb-turn-jump'),y:new DOMMatrix(getComputedStyle(list.children[0],'::before').transform).m42}))
    assert.ok(middle.top>0&&middle.top<180);assert.equal(middle.direction,'up');assert.ok(middle.y<0)
    await page.screenshot({path:resolve(output,'turn-jump-up-middle.png')})
    await page.waitForFunction(()=>!document.querySelector('[data-dcb-turn-jump]'));assert.equal(await page.evaluate(()=>scroller.scrollTop),0)
  })
  await check('rapid reversal starts at the displayed offset and wheel or keyboard input cancels immediately',async()=>{
    await page.evaluate(()=>list.children[3].dispatchEvent(new MouseEvent('dblclick',{bubbles:true,button:0})));await page.waitForTimeout(65)
    const reversal=await page.evaluate(()=>{const before=scroller.scrollTop;list.children[2].dispatchEvent(new MouseEvent('dblclick',{bubbles:true,button:0}));return{before,after:scroller.scrollTop,direction:list.children[0].getAttribute('data-dcb-turn-jump')}})
    assert.equal(reversal.after,reversal.before);assert.equal(reversal.direction,'up')
    await page.waitForTimeout(50)
    const stopped=await page.evaluate(()=>{scroller.dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:20}));return scroller.scrollTop})
    await page.waitForTimeout(340);assert.equal(await page.evaluate(()=>scroller.scrollTop),stopped)
    assert.equal(await page.locator('[data-dcb-turn-jump], [data-dcb-turn-focused]').count(),0)
    await page.evaluate(()=>{list.children[3].dispatchEvent(new MouseEvent('dblclick',{bubbles:true,button:0}));scroller.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}))});await tick()
    assert.equal(await page.locator('[data-dcb-turn-jump]').count(),0);assert.equal(await page.evaluate(()=>scroller.style.scrollBehavior),'')
  })
  await check('native controls, code, modified clicks and prevented double-click handlers keep their own actions',async()=>{
    const result=await page.evaluate(()=>{
      scroller.scrollTop=0
      const button=list.querySelector('button');button.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,button:0}))
      list.querySelector('code').dispatchEvent(new MouseEvent('dblclick',{bubbles:true,button:0}))
      list.children[3].dispatchEvent(new MouseEvent('dblclick',{bubbles:true,button:0,ctrlKey:true}))
      const paragraph=list.querySelector('p');paragraph.addEventListener('dblclick',event=>event.preventDefault(),{once:true});paragraph.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true,button:0}))
      return{top:scroller.scrollTop,count:document.querySelectorAll('[data-dcb-turn-jump], [data-dcb-turn-focused]').length}
    })
    assert.deepEqual(result,{top:0,count:0})
  })
  await check('blank space inside a card targets that turn while the gap between cards stays inactive',async()=>{
    const inside=await page.evaluate(()=>{const a=list.children[0].getBoundingClientRect(),b=list.children[1].getBoundingClientRect();return{x:a.left+14,y:(a.bottom+b.top)/2}})
    await page.mouse.dblclick(inside.x,inside.y)
    assert.equal(await page.locator('[data-dcb-turn-focused]').getAttribute('data-chat-turn'),'1')
    await page.waitForFunction(()=>!document.querySelector('[data-dcb-turn-jump]'))
    const outside=await page.evaluate(()=>{const a=list.querySelector('[data-dcb-turn-tail]').getBoundingClientRect(),b=list.querySelectorAll('[data-dcb-turn-head]')[1].getBoundingClientRect();return{x:a.left+14,y:(a.bottom+b.top)/2}})
    await page.mouse.dblclick(outside.x,outside.y)
    assert.equal(await page.locator('[data-dcb-turn-jump], [data-dcb-turn-focused]').count(),0)
  })
  await check('completion restores an existing scroll behavior without leaving an active frame loop',async()=>{
    await page.evaluate(()=>{scroller.style.setProperty('scroll-behavior','smooth','important');list.children[3].dispatchEvent(new MouseEvent('dblclick',{bubbles:true,button:0}))})
    await page.waitForFunction(()=>!document.querySelector('[data-dcb-turn-jump]'))
    assert.deepEqual(await page.evaluate(()=>[scroller.style.getPropertyValue('scroll-behavior'),scroller.style.getPropertyPriority('scroll-behavior')]),['smooth','important'])
    const settled=await page.evaluate(()=>scroller.scrollTop);await page.waitForTimeout(120)
    assert.equal(await page.evaluate(()=>scroller.scrollTop),settled)
    await page.evaluate(()=>scroller.style.removeProperty('scroll-behavior'))
  })
  await check('nested panes move independently, while reduced motion lands immediately without a pull animation',async()=>{
    await page.evaluate(()=>{
      const pane=document.createElement('section');pane.setAttribute('data-conversation-content','');pane.dataset.conversationSession='split';pane.innerHTML='<div data-conversation-scroll style="height:220px;overflow:auto"><div data-chat-flow><div data-chat-turn="1"><p style="height:250px">分屏第一轮</p></div><div data-chat-turn="2"><p style="height:250px">分屏第二轮</p></div><div style="height:300px"></div></div></div>';document.body.append(pane);window.other=pane.querySelector('[data-conversation-scroll]')
    });await tick();await page.emulateMedia({reducedMotion:'reduce'})
    const result=await page.evaluate(()=>{const before=scroller.scrollTop;other.querySelectorAll('[data-dcb-turn-head]')[1].dispatchEvent(new MouseEvent('dblclick',{bubbles:true,button:0}));return{before,after:scroller.scrollTop,other:other.scrollTop,jumps:document.querySelectorAll('[data-dcb-turn-jump]').length}})
    assert.equal(result.after,result.before);assert.ok(result.other>0);assert.equal(result.jumps,0)
    await page.emulateMedia({reducedMotion:'no-preference'})
  })
  await check('session replacement, disabled cards and disposal cancel navigation and restore scroll styles',async()=>{
    await page.evaluate(()=>list.children[3].dispatchEvent(new MouseEvent('dblclick',{bubbles:true,button:0})));await tick()
    await page.evaluate(()=>document.querySelector('main').dataset.conversationSession='navigation-replaced');await tick()
    assert.equal(await page.locator('[data-dcb-turn-jump], [data-dcb-turn-focused]').count(),0)
    await page.evaluate(()=>{list.children[3].dispatchEvent(new MouseEvent('dblclick',{bubbles:true,button:0}));manager.setOptions({enabled:false,style:'css'})});await tick()
    assert.equal(await page.locator('[data-dcb-turn-jump], [data-dcb-turn-focused]').count(),0)
    assert.equal(await page.evaluate(()=>scroller.style.scrollBehavior),'')
    await page.evaluate(()=>{manager.setOptions({enabled:true,style:'css'})});await tick()
    await page.evaluate(()=>{list.children[3].dispatchEvent(new MouseEvent('dblclick',{bubbles:true,button:0}));manager.dispose()});await tick()
    assert.equal(await page.locator('[data-dcb-turn-jump], [data-dcb-turn-focused]').count(),0)
    assert.equal(await page.evaluate(()=>scroller.style.scrollBehavior),'')
  })
  await check('the real settings default to native, migrate existing choices and persist both lightweight styles with keyboard access',async()=>{
    const html=readFileSync(resolve(project,'test/fixture.html'),'utf8').replace(/<script[^>]*src="\/fixture.js"[^>]*><\/script>/,'')
    await page.route('http://turn-cards.test/',route=>route.fulfill({contentType:'text/html',body:html}))
    await page.goto('http://turn-cards.test/')
    await page.setViewportSize({width:1440,height:1040})
    await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
    const fixture=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
    await page.addScriptTag({content:fixture.outputFiles[0].text})
    await page.getByTestId('todo-panel').waitFor()
    await page.evaluate(()=>{
      window.cleanups=[]
      window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}
    })
    await page.addScriptTag({content:readFileSync(resolve(project,'client.js'),'utf8')})
    await page.evaluate(()=>{
      const ctx={slots:{inject(_slot,fn){fn()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(fn){cleanups.push(fn())},inject(_names,fn){fn(ctx)}}
      plugin.apply(ctx);fixture.refresh()
      const flow=document.createElement('div');flow.dataset.chatFlow='';flow.innerHTML='<div data-chat-turn="1"><p>第一轮内容</p></div><div data-chat-turn="2"><p>第二轮内容</p></div>';document.querySelector('[data-conversation-scroll]').prepend(flow)
    })
    await tick();assert.equal(await page.locator('[data-dcb-turn-head]').count(),0,'fresh installations keep the native appearance')
    await page.getByRole('button',{name:'打开设置',exact:true}).click()
    const tab=page.getByRole('tab',{name:'对话动效',exact:true})
    if(await tab.count())await tab.click()
    const original=page.getByRole('radio',{name:'对话分轮：默认',exact:true}),soft=page.getByRole('radio',{name:'对话分轮：轻盈卡片',exact:true}),line=page.getByRole('radio',{name:'对话分轮：极简分隔',exact:true})
    assert.equal(await original.getAttribute('aria-checked'),'true')
    assert.deepEqual(await page.getByRole('radiogroup',{name:'对话分轮样式',exact:true}).getByRole('radio').allTextContents(),['默认保留原始外观','轻盈卡片浅底色 · 细边框','极简分隔留白 · 细分隔线'])
    await soft.click();await tick();assert.equal(await page.locator('[data-dcb-turn-head]').count(),2)
    await page.screenshot({path:resolve(output,'turn-styles-settings.png')})
    await soft.press('ArrowRight');await tick()
    assert.equal(await line.getAttribute('aria-checked'),'true');await line.press('Home');await tick()
    assert.equal(await original.getAttribute('aria-checked'),'true')
    assert.equal(await page.locator('[data-dcb-turn-head]').count(),0)
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dsh-claude-beautify:settings:v1')).turnGlass),false)
    await line.click();await tick()
    assert.equal(await page.locator('[data-dcb-turn-head]').count(),2)
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dsh-claude-beautify:settings:v1')).turnCardStyle),'line')
    await page.evaluate(()=>{
      const key='dsh-claude-beautify:settings:v1',value=JSON.stringify({...JSON.parse(localStorage.getItem(key)),sidebarStyle:'glass'})
      localStorage.setItem(key,value);window.dispatchEvent(new StorageEvent('storage',{key,newValue:value}))
    });await tick()
    assert.equal(await page.locator('[data-dcb-turn-surface]').getAttribute('data-dcb-turn-surface'),'line','sidebar changes cannot change the independent conversation style')
    assert.equal(await page.locator('.dcb-settings select, .dcb-settings input[type=checkbox]').count(),0)
    await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await tick()
    await page.screenshot({path:resolve(output,'turn-styles-settings-dark.png')})
    await page.setViewportSize({width:390,height:844});await tick()
    assert.ok(await page.evaluate(()=>document.querySelector('.dcb-turn-style-options').scrollWidth<=document.querySelector('.dcb-turn-style-options').clientWidth),'all three choices fit a narrow settings panel')
    await page.screenshot({path:resolve(output,'turn-styles-settings-mobile.png')})
    await page.evaluate(()=>{for(const cleanup of cleanups)if(typeof cleanup==='function')cleanup()});await tick()
    assert.equal(await page.locator('[data-dcb-turn-head], [data-dcb-turn-surface]').count(),0)
  })
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,source,output}))
}finally{await browser.close()}
