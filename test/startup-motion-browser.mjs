import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeLogo} from './native-logo.mjs'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'startup')
mkdirSync(output,{recursive:true})
const built=await build({entryPoints:[resolve(project,'src/startup-motion.js')],bundle:true,write:false,format:'iife',globalName:'Startup'})
let nativeCSS='',source='synthetic native public-marker fixture'
if(process.env.DSH_ASAR){
  const fd=openSync(process.env.DSH_ASAR,'r')
  try{
    const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
    const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
    const table=JSON.parse(json.toString()),base=8+head.readUInt32LE(4)
    function host(pkg){
      let entry=table
      for(const part of `dsh/node_modules/@deepseek-ai/dsh-client-ui-${pkg}/lib/client.js`.split('/'))entry=entry.files[part]
      const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,base+Number(entry.offset))
      return bytes.toString()
    }
    function sheet(text,module,prefix){
      const at=text.indexOf(module+'.module.css'),start=text.lastIndexOf('//#region',at),end=text.indexOf('//#endregion',at)
      const literal=text.slice(start,end).match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)
      assert.ok(literal,`Installed ${module} stylesheet is discoverable`)
      const css=JSON.parse(literal[1]),original=css.match(/\.([\w-]+)_\w+\{/)[1]
      return css.replaceAll(original+'_',prefix+'_')
    }
    const conversation=host('conversation'),layout=host('layout'),sidebar=host('sidebar')
    for(const marker of['data-conversation-content','data-conversation-scroll','data-composer-seat','data-composer-card'])assert.ok(conversation.includes('"'+marker+'"'),`Installed host exposes ${marker}`)
    nativeCSS=sheet(layout,'AppFrame','af')+sheet(conversation,'ConversationRoot','cr')+sheet(conversation,'HeroShell','hero')+sheet(conversation,'InputBar','ib')+sheet(sidebar,'SidebarRoot','sb')
    source='installed DSH AppFrame, ConversationRoot, HeroShell, InputBar and SidebarRoot CSS; synthetic content and host navigation'
  }finally{closeSync(fd)}
}
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const page=await browser.newPage({viewport:{width:1200,height:860}}),errors=[]
page.on('pageerror',error=>errors.push(error.message))
let passed=0
const logo=nativeLogo()
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function tick(){await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))}
async function boot({hero=false,collapsed=false,late=false,freeze=true,reducedMotion='no-preference',forcedColors='none',hidden=false,noAPI=false}={}){
  await page.goto('about:blank')
  await page.emulateMedia({reducedMotion,forcedColors})
  await page.setContent(`<!doctype html><html data-windows-titlebar><meta charset="utf-8"><style>${nativeCSS}
    :root{--dsh-windows-titlebar-height:40px;--dsh-composer-card-max-width:720px;--dsw-specific-sidebar-fill:#f1f2f5;--dsw-alias-label-primary:#232630;--dsw-alias-label-secondary:#69707d;--dsw-radius-md:8px}
    *{box-sizing:border-box}body{margin:0;font:14px/1.6 system-ui;background:#f8f9fb;color:#232630}
    .af_frame{display:grid;grid-template-columns:260px minmax(0,1fr);grid-template-rows:1fr;height:100vh;padding-top:40px;overflow:hidden}
    .af_frame[data-sidebar-collapsed=true]{grid-template-columns:0px minmax(0,1fr)}
    .af_sidebarCol{min-width:0;overflow:hidden}.sb_root{height:100%;width:260px;padding:12px;display:flex;flex-direction:column;background:#eff1f5}
    .sb_logoRow{display:flex;align-items:center;justify-content:space-between;height:40px}.sb_brand{display:block;font-weight:600}.sb_toggle{position:fixed!important;left:12px!important;top:6px!important;width:28px;height:28px;z-index:30}
    .sb_newSession{display:block;margin:12px 0;width:100%;padding:10px}.sb_panelList{padding:8px}.sb_regionArea{flex:1;overflow:auto;min-height:0}.sb_regionArea button{display:block;width:100%;margin:5px 0;padding:12px;text-align:left}.sb_footArea{padding:12px}
    .af_frame[data-sidebar-collapsed=true] .sb_root>:not(.sb_logoRow),.af_frame[data-sidebar-collapsed=true] .sb_brand{display:none}
    .af_centerCol,.cr_root{display:flex;flex-direction:column;min-height:0;min-width:0;height:100%}.cr_root>header{height:52px;flex:none;padding:12px 38px;font-weight:600}
    [data-conversation-content]{position:relative;flex:1;min-height:0}[data-conversation-scroll]{height:100%;overflow:auto;display:flex;flex-direction:column}
    .cr_viewArea{flex:1;min-height:220px;padding:20px 48px}.message{padding:20px;margin:0 0 18px;border-radius:18px;background:white;box-shadow:0 2px 12px #172b4408;max-width:660px}.message.user{margin-left:auto;background:#e9eafa}
    [data-composer-seat]{position:sticky;bottom:0;width:100%;padding:18px 38px 24px;background:#f8f9fb}
    [data-composer-card]{position:relative;padding:16px;border-radius:22px;border:1px solid #d9dce3;background:#fff;box-shadow:0 8px 20px #172b4410;max-width:720px;margin:auto}
    textarea{width:100%;height:66px;border:0;resize:none;font:inherit;background:transparent;outline:none}button{font:inherit;cursor:pointer;border:0;border-radius:9px;background:#e2e5ed;color:inherit}
    .tools{display:flex;justify-content:space-between;align-items:center;color:#858b99;font-size:12px}.send{width:30px;height:30px;border-radius:50%;background:#7475dc;color:white}
    .hero_headline{font-size:26px;text-align:center;margin:60px 0 20px}.hero_stack{margin-top:130px}.hero_body{max-width:720px;margin:auto}
  </style><div class="af_frame" data-sidebar-collapsed="${collapsed}">
    <aside class="af_sidebarCol"><div class="sb_root${collapsed?' sb_collapsed':''}"><div class="sb_logoRow"><span class="sb_brand">DeepSeek Harness</span><button class="sb_toggle" aria-label="切换侧栏">☰</button></div><button class="sb_newSession">＋ 新对话</button><div class="sb_panelList">工作区　工具　文件</div><div class="sb_regionArea">${['界面设计','整理工作计划','阅读与探索','新建项目'].map(text=>`<button>${text}</button>`).join('')}</div><div class="sb_footArea"><button>设置与偏好</button></div></div></aside>
    <main class="af_centerCol"><div class="cr_root"><header>界面设计</header><div data-conversation-content data-conversation-session="a" data-content-phase="${hero?'hero':'active'}"><div data-conversation-scroll>${hero?'':'<section class="cr_viewArea"><div class="message user">让界面有一些轻盈的层次感。</div><div class="message">中间内容先出现，输入框与侧栏随后进入。<p>布局、草稿和原生交互保持稳定。</p></div></section>'}<div data-composer-seat>${hero?'<div class="hero_stack"><div class="hero_headline">今天想探索些什么？</div><div class="hero_body">':''}${late?'':composer()}${hero?'</div></div>':''}</div></div></div></div></main></div></html>`)
  await page.evaluate(({freeze,hidden,noAPI})=>{
    window.freeze=freeze;window.calls=[];window.observers=new Set();window.timers=new Map();window.hiddenState=hidden
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.hiddenState})
    const Observer=window.MutationObserver
    window.MutationObserver=class extends Observer{
      observe(...args){if(args[1]?.attributeFilter?.includes('data-content-phase'))window.observers.add(this);return super.observe(...args)}
      disconnect(){window.observers.delete(this);return super.disconnect()}
    }
    const set=window.setTimeout.bind(window),clear=window.clearTimeout.bind(window)
    window.setTimeout=(fn,time,...args)=>{const callback=()=>{window.timers.delete(id);fn(...args)},id=set(callback,time);window.timers.set(id,{time,callback});return id};window.fireDelay=time=>{for(const [id,timer]of [...window.timers])if(timer.time===time){clear(id);timer.callback()}};
    window.clearTimeout=id=>{window.timers.delete(id);return clear(id)}
    const animate=Element.prototype.animate
    Element.prototype.animate=noAPI?undefined:function(frames,options){const a=animate.call(this,frames,options);window.calls.push({a,el:this,frames,options});if(window.freeze)a.pause();return a}
    window.frameAt=time=>{for(const call of window.calls)if(call.a.playState!=='idle'){call.a.pause();call.a.currentTime=time}}
    window.complete=async()=>{for(const call of window.calls)if(call.a.playState!=='idle')call.a.finish();await Promise.resolve()}
    document.querySelector('.sb_toggle').onclick=()=>{window.toggleClicks=(window.toggleClicks||0)+1;const frame=document.querySelector('.af_frame'),collapsed=frame.getAttribute('data-sidebar-collapsed')!=='true';frame.setAttribute('data-sidebar-collapsed',String(collapsed));document.querySelector('.sb_root').classList.toggle('sb_collapsed',collapsed)}
  },{freeze,hidden,noAPI})
  await page.addScriptTag({content:built.outputFiles[0].text})
}
function composer(){return '<div class="ib_root" data-composer-card><textarea aria-label="演示输入">保留这段草稿</textarea><div class="tools"><span>＋　模型 · 权限</span><button class="send" aria-label="演示发送">↑</button></div></div>'}
async function start(options={welcomeFont:'hand'}){await page.evaluate(({options,logo})=>{
  const services={createLogo:()=>{
    if(!logo)return null
    const node=document.createElement('div'),svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS('http://www.w3.org/2000/svg','path')
    svg.setAttribute('viewBox',`0 0 ${logo.width} ${logo.height}`);path.setAttribute('d',logo.path);path.setAttribute('fill','currentColor');svg.append(path);node.append(svg);return{node}
  }}
  window.motion=Startup.createStartupMotion(document,window,options,services)
},{options,logo});await tick()}
async function clean(){await page.evaluate(()=>window.motion.dispose());await tick()}
const status=()=>page.evaluate(()=>window[Symbol.for('dsh-ui-beautify.startup-status.v2')])
async function reveal(){
  await page.waitForTimeout(110)
  await page.evaluate(()=>{window.frameAt(1850);window.fireDelay(1900)})
  await page.waitForFunction(()=>document.documentElement.getAttribute('data-dcb-startup-stage')==='revealing')
  await tick()
}
const entrances=()=>page.evaluate(()=>window.calls.filter(c=>/^dcb-startup-(main|composer|sidebar-)/.test(c.a.id)).map(c=>({id:c.a.id,duration:c.options.duration,delay:c.options.delay})))
try{
  await check('the welcome is drawn from original strokes in order, then the real content enters in three distinct groups',async()=>{
    await boot();await start()
    assert.equal((await status()).stage,'writing')
    assert.equal(await page.getByRole('status',{name:'欢迎回来'}).count(),1)
    if(logo){
      assert.equal(await page.locator('[data-dcb-welcome-logo] path').getAttribute('d'),logo.path)
      const brand=await page.locator('[data-dcb-welcome-logo]').boundingBox(),art=await page.locator('[data-dcb-welcome-art]').boundingBox()
      assert.ok(brand.y+brand.height<art.y)
    }
    assert.deepEqual(await page.locator('[data-welcome-character]').evaluateAll(nodes=>nodes.map(el=>el.getAttribute('data-welcome-character'))),['欢','迎','回','来'])
    const ink=await page.evaluate(()=>window.calls.filter(c=>c.a.id.startsWith('dcb-startup-ink-')).map(c=>({delay:c.options.delay,duration:c.options.duration})))
    assert.equal(ink.length,26);assert.ok(ink.every((c,i)=>c.duration>0&&(!i||c.delay>ink[i-1].delay)))
    await page.evaluate(()=>window.frameAt(800));await tick()
    const offsets=await page.locator('[data-dcb-welcome-stroke]').evaluateAll(nodes=>nodes.map(el=>Number.parseFloat(getComputedStyle(el).strokeDashoffset)))
    assert.ok(offsets.some(n=>n===0)&&offsets.some(n=>n>0),'An intermediate frame contains both written ink and still-unwritten strokes')
    assert.equal((await entrances()).length,0,'Live seats wait behind the handwriting veil')
    await page.screenshot({path:resolve(output,'welcome-800ms.png')})
    await page.evaluate(()=>window.frameAt(1800));await tick();await page.screenshot({path:resolve(output,'welcome-written-light.png')})
    await reveal()
    const parts=await entrances();assert.equal(parts.length,7)
    const delay=id=>parts.find(c=>c.id==='dcb-startup-'+id).delay
    assert.ok(delay('main')<delay('composer')&&delay('composer')<delay('sidebar-brand'))
    assert.equal(parts.find(c=>c.id==='dcb-startup-composer').duration,420)
    await page.evaluate(()=>window.frameAt(160));await tick()
    const middle=await page.evaluate(()=>{
      const sample=selector=>{const s=getComputedStyle(document.querySelector(selector)),m=new DOMMatrix(s.transform);return{opacity:Number(s.opacity),x:m.m41,y:m.m42,filter:s.filter}}
      return{main:sample('.cr_viewArea'),composer:sample('[data-composer-card]'),sidebar:sample('.sb_regionArea'),veil:sample('[data-dcb-welcome]')}
    })
    assert.ok(middle.main.opacity>0&&middle.main.opacity<1)
    assert.equal(middle.composer.opacity,0);assert.equal(middle.sidebar.opacity,0)
    assert.ok(middle.veil.opacity>0&&middle.veil.opacity<1)
    await page.screenshot({path:resolve(output,'welcome-to-content-160ms.png')})
    await page.evaluate(()=>{window.frameAt(340);window.fireDelay(300)});await tick()
    assert.ok(await page.locator('[data-composer-card]').evaluate(el=>Number(getComputedStyle(el).opacity))>0)
    assert.ok(await page.locator('.sb_regionArea').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41)<0)
    await page.screenshot({path:resolve(output,'input-and-sidebar-340ms.png')})
    await page.evaluate(()=>{window.frameAt(900);window.fireDelay(1000)});await tick()
    assert.equal((await status()).reason,'complete')
    assert.equal(await page.locator('[data-dcb-welcome], [data-dcb-startup-style]').count(),0)
    assert.equal(await page.locator('[style]:not([style=""])').count(),0)
    assert.equal(await page.evaluate(()=>window.observers.size+window.timers.size+document.getAnimations().length),0)
  })
  await check('the natural welcome renders multiple handwriting and content frames without a permanent rendering loop',async()=>{
    await boot({freeze:false})
    const frames=await page.evaluate(()=>new Promise(resolve=>{
      window.motion=Startup.createStartupMotion(document,window,{welcomeFont:'hand'});const start=performance.now(),frames=[]
      function frame(){const stroke=document.querySelector('[data-dcb-welcome-stroke]'),card=document.querySelector('[data-composer-card]');frames.push({t:performance.now()-start,stage:document.documentElement.getAttribute('data-dcb-startup-stage'),ink:stroke?getComputedStyle(stroke).strokeDashoffset:null,opacity:getComputedStyle(card).opacity,y:new DOMMatrix(getComputedStyle(card).transform).m42});if(performance.now()-start<3100)requestAnimationFrame(frame);else resolve(frames)}requestAnimationFrame(frame)
    }))
    assert.ok(new Set(frames.filter(f=>f.ink!==null).map(f=>f.ink)).size>3)
    assert.ok(frames.filter(f=>Number(f.opacity)>0&&Number(f.opacity)<1&&f.y>0).length>=3)
    assert.equal(frames.at(-1).opacity,'1');assert.equal(frames.at(-1).y,0)
    assert.equal((await status()).reason,'complete')
  })
  await check('the welcome ends on schedule while saved-session restoration holds only the temporary Hero',async()=>{
    await boot({hero:true});await page.locator('[data-conversation-content]').evaluate(el=>el.removeAttribute('data-conversation-session'))
    await start();await page.evaluate(()=>window.motion.setRestorationTarget('restored'))
    await page.evaluate(()=>{window.frameAt(1800);window.fireDelay(1900)});await tick()
    assert.equal((await status()).stage,'revealing');assert.equal((await entrances()).length,5)
    await page.evaluate(()=>window.fireDelay(300));await tick()
    assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
    assert.equal(await page.locator('[data-conversation-content]').evaluate(el=>getComputedStyle(el).opacity),'0')
    await page.evaluate(html=>{
      window.oldHero=document.querySelector('.hero_stack')
      const body=document.querySelector('[data-conversation-content]');body.dataset.conversationSession='restored';body.dataset.contentPhase='active'
      document.querySelector('[data-conversation-scroll]').innerHTML='<section class="cr_viewArea"><div data-chat-flow><div class="cv_hint">Synthetic history loading</div></div></section><div data-composer-seat>'+html+'</div>'
      window.motion.setSessionState('restored','loading')
    },composer());await tick();await page.waitForTimeout(120)
    assert.equal((await entrances()).length,6)
    assert.equal(await page.locator('[data-dcb-startup-hold]').count(),0)
    await page.evaluate(()=>{document.querySelector('[data-chat-flow]').innerHTML='<article data-chat-turn="1" class="message">Restored synthetic conversation</article>';window.motion.setSessionState('restored','open')})
    await page.waitForFunction(()=>window.calls.some(c=>c.a.id==='dcb-startup-main'))
    assert.equal((await entrances()).length,7)
    assert.equal(await page.evaluate(()=>window.calls.some(c=>window.oldHero.contains(c.el))),false)
    await clean();assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
  })
  await check('native history loading never prolongs the welcome; actual history receives its later entrance',async()=>{
    await boot();await page.locator('.cr_viewArea').evaluate(el=>el.innerHTML='<div data-chat-flow><div class="cv_hint">Synthetic loading</div></div>')
    await start();await page.evaluate(()=>window.fireDelay(1900));await page.waitForTimeout(120)
    assert.equal((await entrances()).length,6)
    await page.evaluate(()=>window.fireDelay(300));await tick()
    assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
    assert.equal(await page.locator('.cv_hint').isVisible(),true)
    await page.screenshot({path:resolve(output,'loading-app-after-welcome.png')})
    await page.locator('[data-chat-flow]').evaluate(el=>el.innerHTML='<article class="message">Actual history</article>')
    await page.waitForFunction(()=>window.calls.some(c=>c.a.id==='dcb-startup-main'))
    assert.equal((await entrances()).length,7);await clean()
  })
  await check('hidden windows start handwriting on first visibility, rather than consuming it during host initialization',async()=>{
    await boot({hidden:true});await start();assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
    assert.equal(await page.evaluate(()=>window.timers.size),0)
    await page.evaluate(()=>{window.hiddenState=false;document.dispatchEvent(new Event('visibilitychange'))});await tick()
    assert.equal((await status()).stage,'writing')
    assert.equal(await page.locator('[data-dcb-welcome]').count(),1)
    await clean()
  })
  await check('cold application mounts and content arriving after the handwriting still receive their one entrance',async()=>{
    await boot();await page.evaluate(()=>{window.coldFrame=document.querySelector('.af_frame');window.coldFrame.remove()})
    await start();await page.evaluate(()=>window.fireDelay(1900));await tick()
    assert.equal((await status()).stage,'revealing');assert.equal((await entrances()).length,0)
    await page.evaluate(()=>window.fireDelay(300));await tick()
    assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
    await page.evaluate(()=>document.body.append(window.coldFrame))
    await page.waitForFunction(()=>window.calls.some(c=>c.a.id==='dcb-startup-main'))
    assert.equal((await entrances()).length,7);await clean()
  })
  await check('skip, keyboard and first content interaction leave the original draft, focus, selection and scroll intact',async()=>{
    for(const mode of['skip','keyboard','content']){
      await boot();await page.evaluate(()=>{const el=document.querySelector('textarea');el.focus();el.setSelectionRange(2,5);window.originalEditor=el;document.querySelector('.cr_viewArea').style.minHeight='1200px';document.querySelector('[data-conversation-scroll]').scrollTop=320;window.originalScroll=document.querySelector('[data-conversation-scroll]').scrollTop})
      await start()
      if(mode==='skip')await page.getByRole('button',{name:'跳过欢迎动画'}).dispatchEvent('pointerdown')
      if(mode==='keyboard')await page.keyboard.press('Escape')
      if(mode==='content'){await reveal();await page.evaluate(()=>window.fireDelay(300));await page.locator('textarea').dispatchEvent('pointerdown')}
      assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
      const state=await page.locator('textarea').evaluate(el=>({same:el===window.originalEditor,value:el.value,focus:el===document.activeElement,selection:[el.selectionStart,el.selectionEnd],scroll:document.querySelector('[data-conversation-scroll]').scrollTop,original:window.originalScroll}))
      assert.equal(state.same,true);assert.equal(state.value,'保留这段草稿');assert.equal(state.focus,true);assert.deepEqual(state.selection,[2,5]);assert.equal(state.scroll,state.original)
      assert.equal(await page.evaluate(()=>window.timers.size+window.observers.size+document.getAnimations().length),0)
    }
  })
  await check('home, dark theme and narrow windows keep handwriting and native fixed controls in place',async()=>{
    await boot({hero:true});await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.setViewportSize({width:760,height:860})
    await start();await page.evaluate(()=>window.frameAt(1800));await tick()
    assert.equal(await page.locator('[data-dcb-welcome]').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(27, 27, 29)')
    assert.ok(await page.locator('[data-dcb-welcome-copy]').evaluate(el=>el.getBoundingClientRect().width<innerWidth))
    await page.screenshot({path:resolve(output,'welcome-written-dark.png')})
    await reveal()
    assert.equal(await page.evaluate(()=>window.calls.find(c=>c.a.id==='dcb-startup-main').el.className),'hero_headline')
    assert.equal(await page.locator('.hero_stack').evaluate(el=>getComputedStyle(el).transform),'none')
    const fixed=await page.locator('.sb_toggle').evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,parents:[el.parentElement,el.closest('.sb_root'),el.closest('.af_sidebarCol')].map(el=>({transform:getComputedStyle(el).transform,filter:getComputedStyle(el).filter}))}})
    assert.equal(fixed.x,12);assert.equal(fixed.y,6);assert.ok(fixed.parents.every(s=>s.transform==='none'&&s.filter==='none'))
    await clean();await page.setViewportSize({width:1200,height:860})
  })
  await check('collapsed sidebars are not expanded or reserved for a later user-triggered entrance',async()=>{
    await boot({collapsed:true});await start();await reveal()
    assert.deepEqual((await entrances()).map(c=>c.id),['dcb-startup-main','dcb-startup-composer'])
    await page.evaluate(()=>window.fireDelay(300));await page.locator('.sb_toggle').click()
    assert.equal(await page.evaluate(()=>window.toggleClicks),1);assert.equal((await entrances()).length,2)
  })
  await check('reduced motion, forced colors, unsupported animation and hidden navigation always fail open',async()=>{
    for(const options of[{reducedMotion:'reduce'},{forcedColors:'active'},{noAPI:true}]){
      await boot(options);await start();assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
      assert.equal(await page.locator('[data-composer-card]').evaluate(el=>getComputedStyle(el).opacity),'1');await clean()
    }
    await boot();await start();await page.emulateMedia({reducedMotion:'reduce'});await tick();assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
    await boot();await start();await page.evaluate(()=>{window.hiddenState=true;document.dispatchEvent(new Event('visibilitychange'))});await tick()
    assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
  })
  await check('animation API and SVG measurement failures release the welcome and every temporary resource',async()=>{
    for(const failure of['copy','ink','measure','veil']){
      await boot();await page.evaluate(failure=>{
        if(failure==='measure'){SVGGeometryElement.prototype.getTotalLength=()=>{throw Error('Synthetic SVG failure')};return}
        const animate=Element.prototype.animate
        Element.prototype.animate=function(...args){
          const selector=failure==='copy'?'[data-dcb-welcome-copy]':failure==='ink'?'[data-dcb-welcome-stroke]':'[data-dcb-welcome]'
          if(this.matches(selector))throw Error('Synthetic animation failure')
          return animate.apply(this,args)
        }
      },failure)
      await start()
      if(failure==='veil'){
        await page.waitForTimeout(110);await page.evaluate(()=>window.fireDelay(1900));await tick()
      }
      assert.equal((await status()).stage,'done')
      assert.equal(await page.locator('[data-dcb-startup-style],[data-dcb-welcome]').count(),0)
      assert.equal(await page.evaluate(()=>window.timers.size+window.observers.size+document.getAnimations().length),0)
    }
  })
  await check('semantic main layouts keep their entrance when host CSS module names differ',async()=>{
    await boot();await page.locator('main').evaluate(el=>el.classList.remove('af_centerCol'))
    await start();await reveal()
    assert.deepEqual((await entrances()).map(c=>c.id),['dcb-startup-main','dcb-startup-composer','dcb-startup-sidebar-brand','dcb-startup-sidebar-newSession','dcb-startup-sidebar-panelList','dcb-startup-sidebar-regionArea','dcb-startup-sidebar-footArea'])
    await clean()
  })
  await check('long or dense histories use bounded visible samples, never a transcript-sized animation layer',async()=>{
    for(const dense of[false,true]){
      await boot();await page.evaluate(dense=>{
        const main=document.querySelector('.cr_viewArea'),fragment=document.createDocumentFragment()
        for(let i=0;i<1200;i++){const row=document.createElement('p');row.dataset.chatTurn=i;row.style.height='32px';for(let j=0;j<8;j++){const span=document.createElement('span');span.textContent='演示片段 ';row.append(span)}fragment.append(row)}main.append(fragment)
        if(dense){main.style.height='520px';main.style.overflow='auto';main.style.flex='none'}
        const style=window.getComputedStyle.bind(window);window.historyReads=0
        window.getComputedStyle=(el,...args)=>{if(main.contains(el))window.historyReads++;return style(el,...args)}
      },dense)
      await start();await reveal()
      const result=await page.evaluate(()=>({reads:window.historyReads,large:window.calls.some(c=>c.a.id==='dcb-startup-main'&&c.el.className==='cr_viewArea'),small:window.calls.filter(c=>c.a.id.startsWith('dcb-startup-main-')).length,composer:window.calls.some(c=>c.a.id==='dcb-startup-composer')}))
      assert.ok(result.reads<600,JSON.stringify(result));assert.equal(result.large,false);assert.ok(result.small<=4);assert.equal(result.composer,true)
      await clean()
    }
  })
  await check('navigation, reapplication, deadlines and disposal never strand the welcome or replay it',async()=>{
    await boot();await start();await reveal()
    await page.locator('[data-conversation-content]').evaluate(el=>el.dataset.conversationSession='another');await tick()
    assert.equal((await status()).reason,'navigation');assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
    const count=await page.evaluate(()=>window.calls.length);await start();assert.equal(await page.evaluate(()=>window.calls.length),count)
    await boot();await start();await page.evaluate(()=>window.fireDelay(30000));await tick()
    assert.equal((await status()).reason,'loading-timeout');assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
    assert.equal(await page.evaluate(()=>window.timers.size+window.observers.size+document.getAnimations().length),0)
    await boot();await start();await clean();assert.equal(await page.locator('[data-dcb-startup-style],[data-dcb-welcome]').count(),0)
  })
  await check('the generated plugin creates the welcome and cleans it through its real presentation lifecycle',async()=>{
    await boot();await page.evaluate(()=>{window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(()=>({createElement(){}}))}})
    await page.addScriptTag({content:readFileSync(resolve(project,'client.js'),'utf8')})
    await page.evaluate(()=>window.plugin.apply({slots:{inject(_name,cb){cb()},register(){}},effect(cb){window.cleanups.push(cb())}}));await tick()
    assert.ok(await page.locator('[data-dcb-welcome-stroke]').count()>0)
    assert.equal(await page.locator('[data-welcome-font]').getAttribute('data-welcome-font'),'Lolita')
    await page.evaluate(()=>{for(const cleanup of window.cleanups.reverse())cleanup?.()});await tick()
    assert.equal(await page.locator('[data-dcb-welcome],[data-dcb-startup-style]').count(),0)
    assert.equal(await page.evaluate(()=>window.timers.size+window.observers.size+document.getAnimations().length),0)
  })
  await check('local Lolita glyphs are written through pen masks and finish as exact black native font shapes',async()=>{
    await boot();await start({welcomeText:'欢迎回来',welcomeFont:'Lolita',welcomeDuration:2400})
    const art=page.locator('[data-dcb-welcome-art]')
    assert.equal(await art.locator('text').allTextContents().then(parts=>parts.join('')),'欢迎回来')
    assert.equal(await art.locator('text').first().evaluate(el=>getComputedStyle(el).fontFamily),'Lolita, cursive')
    const result=await page.evaluate(()=>{
      const c=document.createElement('canvas').getContext('2d');c.font='96px Lolita';const local=c.measureText('欢迎回来').width;c.font='96px cursive';return{local,fallback:c.measureText('欢迎回来').width,paths:document.querySelectorAll('[data-dcb-welcome-stroke]').length}
    })
    assert.notEqual(result.local,result.fallback,'The installed Lolita face is used, rather than a silently substituted default')
    assert.ok(result.paths>4&&result.paths<=192)
    await page.evaluate(()=>window.frameAt(1100));await tick();await page.screenshot({path:resolve(output,'lolita-writing-middle.png')})
    await page.evaluate(()=>window.frameAt(2500));await tick();await page.screenshot({path:resolve(output,'lolita-written-light.png')})
    assert.equal(await art.evaluate(el=>getComputedStyle(el).color),'rgb(17, 17, 17)')
    assert.ok(await art.locator('mask rect').evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).opacity==='1')))
    await page.locator('body').evaluate(el=>el.setAttribute('data-ds-dark-theme',''));await tick()
    assert.equal(await art.evaluate(el=>getComputedStyle(el).color),'rgb(237, 237, 240)')
    await page.screenshot({path:resolve(output,'lolita-written-dark.png')})
    await clean()
  })
  await check('custom text and speed, disabled startup and cancellation use independent saved welcome options',async()=>{
    await boot();await start({welcomeEnabled:false})
    assert.equal((await status()).reason,'disabled');assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
    assert.equal(await page.evaluate(()=>window.timers.size+window.observers.size+window.calls.length),0)
    await boot();await start({welcomeText:'你好，世界',welcomeFont:'KaiTi',welcomeDuration:1200})
    assert.equal(await page.getByRole('status',{name:'你好，世界'}).count(),1)
    await page.evaluate(()=>window.fireDelay(1400));await page.waitForTimeout(110);await tick()
    assert.equal((await status()).stage,'revealing')
    await page.evaluate(()=>window.motion.setEnabled(false));await tick()
    assert.equal((await status()).reason,'disabled');assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
  })
  await check('natural slow-history startup removes the written welcome within its fixed ending and never blocks the app for loading',async()=>{
    await boot({freeze:false});await page.locator('.cr_viewArea').evaluate(el=>el.innerHTML='<div data-chat-flow><div class="cv_hint">Synthetic slow history</div></div>')
    const before=Date.now();await start({welcomeFont:'Lolita'});await page.evaluate(()=>window.motion.setSessionState('a','loading'))
    await page.locator('[data-dcb-welcome]').waitFor({state:'detached',timeout:2700})
    assert.ok(Date.now()-before<2700)
    assert.equal(await page.locator('.cv_hint').isVisible(),true)
    assert.ok(await page.locator('[data-composer-card]').evaluate(el=>Number(getComputedStyle(el).opacity))>0)
    assert.equal(await page.evaluate(()=>window.calls.some(c=>c.a.id==='dcb-startup-main')),false)
    await page.evaluate(()=>{document.querySelector('[data-chat-flow]').innerHTML='<article>Late history arrived</article>';window.motion.setSessionState('a','open')})
    await page.waitForFunction(()=>window.calls.some(c=>c.a.id==='dcb-startup-main'))
    await page.waitForTimeout(1100)
    assert.equal((await status()).reason,'complete')
    assert.equal(await page.evaluate(()=>window.timers.size+window.observers.size+document.getAnimations().length),0)
  })
  await check('a confirmed open session with an empty-history hint does not wait for a loading timeout',async()=>{
    await boot();await page.locator('.cr_viewArea').evaluate(el=>el.innerHTML='<div data-chat-flow><div class="cv_hint">An empty conversation</div></div>')
    await start();await page.evaluate(()=>window.motion.setSessionState('a','open'));await reveal()
    assert.equal((await entrances()).length,7)
    await page.evaluate(()=>window.fireDelay(1000));await tick()
    assert.equal((await status()).reason,'complete')
    assert.equal(await page.evaluate(()=>window.timers.size+window.observers.size+document.getAnimations().length),0)
  })
  assert.deepEqual(errors,[])
  console.log(JSON.stringify({passed,source,output}))
}finally{await browser.close()}
