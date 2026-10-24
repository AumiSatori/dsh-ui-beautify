import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync,openSync,readSync,closeSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'focus-mode')
mkdirSync(output,{recursive:true})
let nativeCSS='',source='native public marker fixture'
if(process.env.DSH_ASAR){
  const fd=openSync(process.env.DSH_ASAR,'r')
  try{
    const head=Buffer.alloc(16);readSync(fd,head,0,16,0);const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
    const tree=JSON.parse(json)
    for(const [pkg,module,prefix]of[['layout','AppFrame','af'],['conversation','ConversationRoot','cr'],['sidebar','SidebarRoot','sb']]){
      let entry=tree;for(const part of `dsh/node_modules/@deepseek-ai/dsh-client-ui-${pkg}/lib/client.js`.split('/'))entry=entry.files[part]
      const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset))
      const text=bytes.toString(),at=text.indexOf(module+'.module.css'),region=text.slice(text.lastIndexOf('//#region',at),text.indexOf('//#endregion',at)),literal=region.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)
      assert.ok(literal);const css=JSON.parse(literal[1]),hash=css.match(/\.([\w-]+)_\w+\{/)[1];nativeCSS+=css.replaceAll(hash+'_',prefix+'_')
    }
    source='installed DSH AppFrame, ConversationRoot and SidebarRoot CSS with public layout markers; synthetic content'
  }finally{closeSync(fd)}
}
const fixture=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}/`,key='dsh-ui-beautify:settings:v1'
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),page=await browser.newPage({viewport:{width:1440,height:950}}),errors=[]
page.on('pageerror',error=>errors.push(error.message))
const button=page.locator('.dcb-focus-toggle'),frame=page.locator('.af_frame'),seat=page.locator('[data-composer-seat]'),editor=page.getByRole('textbox',{name:'专注模式草稿'}),left=page.locator('.af_sidebarCol'),right=page.locator('[data-rightbar-col]')
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function idle(){await page.waitForFunction(()=>!document.getAnimations().some(animation=>animation.id.startsWith('dcb-focus-')));await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))}
async function boot({collapsed=false,native=true,glass=false,resident=false}={}){
  await page.goto(url);await page.getByTestId('todo-panel').waitFor()
  await page.evaluate(({key,glass})=>{
    localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,sidebarOverlay:false,sidebarStyle:glass?'css':'milk',composerStyle:glass?'css':'milk',composerButtonGlass:false,particleEnabled:false}))
    window.cleanups=[];window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true;window.nativeChanges=0
    window.fixture.sidebar(true)
    window.themeListeners=new Set();let dark=false
    window.hostTheme={getTheme:()=>({active:{colorScheme:dark?'dark':'light'}}),setTheme:value=>{dark=value==='dark';document.body.toggleAttribute('data-ds-dark-theme',dark);for(const listener of window.themeListeners)listener(window.hostTheme.getTheme())}}
    window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}
  },{key,glass})
  await page.locator('.right').waitFor({state:'attached'})
  await page.addStyleTag({content:nativeCSS+`
    html,body,#root{height:100%}.af_frame.af_frame{height:100vh;grid-template-rows:minmax(0,1fr);overflow:hidden}.af_centerCol{min-height:0;min-width:0;display:flex;flex-direction:column}.conversation,.scroll{min-height:0}.header-utilities{display:flex;align-items:center;gap:8px}.af_sidebarCol{display:flex;flex-direction:column;min-width:0}.af_rightbarCol{min-width:0}.af_sidebarCol strong{margin-bottom:12px}.header-utilities>span:last-child{display:none}header{height:64px;padding:16px 24px;flex:none}.scroll{overflow:auto;flex:1}.composer-seat{position:sticky;bottom:0;flex:none;padding:16px 24px;background:#fff}.focus-draft{height:64px;width:100%;resize:none;border:1px solid #aaa;border-radius:12px;padding:12px;font:14px system-ui}article{margin:0 auto;padding:24px;flex:none;width:100%;max-width:760px}article p{margin:0 0 14px;line-height:1.8}.af_rightbarCol .right-fixed{position:fixed;right:0;top:0;width:330px;height:100%;background:#f2f3f5;padding:22px;z-index:12}body[data-ds-dark-theme] .composer-seat,body[data-ds-dark-theme] .right-fixed{background:#25272b;color:#eee}
  `})
  await page.evaluate(({collapsed,native,resident})=>{
    const frame=document.querySelector('.frame'),main=frame.querySelector('main'),left=frame.querySelector('.nav'),right=frame.querySelector('.right')
    frame.classList.add('af_frame');main.classList.add('af_centerCol');left.classList.add('af_sidebarCol');right.classList.add('af_rightbarCol');right.setAttribute('data-rightbar-col','')
    frame.style.gridTemplateColumns=collapsed?'0px minmax(0px,1fr) 0px':'264px minmax(400px,1fr) minmax(0px,340px)';frame.setAttribute('data-sidebar-collapsed',String(collapsed))
    const toggle=document.createElement('button');toggle.setAttribute('aria-label','宿主侧栏切换');toggle.style.cssText='position:fixed;left:10px;top:10px;z-index:30';toggle.textContent='☰';toggle.onclick=()=>window.nativeChanges++;left.append(toggle)
    right.innerHTML='<div class="right-fixed"><h3>原生文件面板</h3><input aria-label="右侧内容" value="保留文件状态"></div>'
    const seat=document.querySelector('[data-composer-seat]');seat.querySelector('.composer').remove();const input=document.createElement('textarea');input.className='focus-draft';input.setAttribute('aria-label','专注模式草稿');input.value='保留这段草稿和选区';input.setSelectionRange(2,6);seat.append(input);window.savedEditor=input
    const article=document.querySelector('article');article.innerHTML=Array.from({length:40},(_,i)=>`<p data-chat-flow-key="test-${i}">演示段落 ${i+1}：专注阅读时只改变周围控件。保留原来的消息节点、草稿和面板状态。</p>`).join('')
    const scroll=document.querySelector('[data-conversation-scroll]');scroll.scrollTop=600
    if(resident){
      document.documentElement.setAttribute('data-windows-titlebar','');document.documentElement.style.setProperty('--dsh-windows-titlebar-height','40px')
      const root=document.createElement('div');root.className='sb_root';root.style.cssText='width:264px;height:100%;display:flex;flex-direction:column';root.innerHTML='<div class="sb_logoRow"><span class="sb_brand">DeepSeek Harness</span></div><button class="sb_newSession">新会话</button><div class="sb_regionArea"><button class="sb_sessionRow" role="treeitem" aria-selected="true">合成会话</button></div><div class="sb_footArea">设置</div>'
      toggle.className='sb_toggle';root.querySelector('.sb_logoRow').append(toggle);left.replaceChildren(root)
      const header=main.querySelector('header'),title=header.firstElementChild,utilities=header.querySelector('.header-utilities'),leading=document.createElement('div'),row=document.createElement('div'),cluster=document.createElement('div'),tools=document.createElement('div'),corner=document.createElement('div')
      leading.className='cr_headerLeading';row.className='cr_titleRow';cluster.className='cr_titleCluster';tools.className='cr_headerUtilities';corner.className='cr_headerCorner';corner.innerHTML='<button>▣</button>'
      cluster.append(title);tools.append(utilities);row.append(cluster,tools,corner);header.classList.add('cr_header');header.replaceChildren(leading,row)
      main.classList.add('cr_root');main.setAttribute('data-phase','active');document.querySelector('[data-conversation-content]').classList.add('cr_body');scroll.classList.add('cr_scrollBody');seat.classList.add('cr_composerSeat');frame.setAttribute('data-animating','')
      window.seatObserver=new ResizeObserver(()=>{scroll.style.setProperty('--dsh-composer-height',`${seat.offsetHeight}px`);scroll.style.setProperty('--dsh-conversation-viewport-height',`${scroll.clientHeight}px`)});window.seatObserver.observe(seat);window.seatObserver.observe(scroll);window.cleanups.push(()=>window.seatObserver.disconnect())
    }
    if(!native){left.classList.remove('af_sidebarCol');right.classList.remove('af_rightbarCol');right.removeAttribute('data-rightbar-col');main.classList.remove('af_centerCol')}
    window.savedFrameStyle=frame.getAttribute('style');window.savedPreferences=localStorage.getItem('dsh-ui-beautify:settings:v1')
  },{collapsed,native,resident})
  await page.addScriptTag({url:new URL('/client.js',url).href})
  await page.evaluate(()=>{const ctx={theme:window.hostTheme,slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},on(name,listener){if(name==='theme/change')window.themeListeners.add(listener)},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
  await button.waitFor();await page.waitForTimeout(100)
}
try{
  await boot()
  await check('the focus button follows the theme control, keeps native semantics, and hides input and both columns reversibly',async()=>{
    assert.equal(await button.evaluate(el=>el.previousElementSibling?.classList.contains('dcb-theme-notice')),true)
    assert.equal(await button.getAttribute('aria-pressed'),'false')
    const theme=await page.locator('.dcb-theme-toggle').boundingBox(),focus=await button.boundingBox();assert.ok(focus.x>=theme.x+theme.width&&focus.height===30)
    await page.screenshot({path:resolve(output,'focus-before.png')})
    const readingWidth=await page.locator('[data-conversation-content]').evaluate(el=>el.getBoundingClientRect().width)
    await button.click();await idle()
    assert.equal(await button.getAttribute('aria-pressed'),'true');assert.equal(await frame.getAttribute('data-dcb-focus-frame'),'on')
    for(const target of[left,right,seat]){assert.equal(await target.isVisible(),false);assert.equal(await target.getAttribute('inert'),'');assert.equal(await target.getAttribute('aria-hidden'),'true')}
    assert.ok(await button.isVisible());assert.equal(await page.locator('main').evaluate(el=>Math.round(el.getBoundingClientRect().width)),1440)
    assert.equal(await page.locator('[data-conversation-content]').evaluate(el=>el.getBoundingClientRect().width),readingWidth)
    await page.screenshot({path:resolve(output,'focus-active.png')})
    await button.click();await idle()
    for(const target of[left,right,seat])assert.equal(await target.isVisible(),true)
    assert.equal(await frame.getAttribute('data-dcb-focus-frame'),null)
    assert.equal(await editor.evaluate(el=>el===window.savedEditor),true);assert.equal(await editor.inputValue(),'保留这段草稿和选区')
    assert.deepEqual(await editor.evaluate(el=>[el.selectionStart,el.selectionEnd]),[2,6])
    assert.equal(await page.evaluate(()=>document.querySelector('.frame').getAttribute('style')===window.savedFrameStyle&&window.nativeChanges===0&&localStorage.getItem('dsh-ui-beautify:settings:v1')===window.savedPreferences),true)
  })
  await check('input fades and moves without changing layout every frame, then releases its height; reversal leaves no stale styles',async()=>{
    const height=await seat.evaluate(el=>el.getBoundingClientRect().height)
    await button.click();await page.waitForTimeout(65)
    const middle=await seat.evaluate(el=>{const s=getComputedStyle(el);return{height:el.getBoundingClientRect().height,opacity:Number(s.opacity),filter:s.filter,transform:s.transform}})
    assert.equal(middle.height,height);assert.ok(middle.opacity>0&&middle.opacity<1);assert.equal(middle.filter,'none');assert.notEqual(middle.transform,'none')
    assert.equal(await page.getByRole('button',{name:'宿主侧栏切换',includeHidden:true}).evaluate(el=>el.getBoundingClientRect().x),10)
    await page.screenshot({path:resolve(output,'focus-enter-middle.png')})
    await button.click();await page.waitForTimeout(45);await button.click();await idle();assert.equal(await frame.getAttribute('data-dcb-focus-frame'),'on')
    await page.keyboard.press('Escape');await idle();assert.equal(await button.getAttribute('aria-pressed'),'false')
    assert.equal(await page.locator('[data-dcb-focus-hidden],[data-dcb-focus-moving],[data-dcb-focus-part]').count(),0)
    assert.equal(await seat.evaluate(el=>[el.style.height,el.style.paddingTop,el.style.paddingBottom,el.style.transform,el.style.filter].join('')),'')
    assert.equal(await page.locator('[data-conversation-content]').evaluate(el=>[el.style.width,el.style.maxWidth,el.style.minWidth,el.style.alignSelf].join('')),'')
  })
  await check('collapsed host preferences, resizes, overlays and a newly mounted input stay hidden until explicit exit',async()=>{
    await boot({collapsed:true,glass:true});const originalLeft=await left.evaluate(el=>el.getBoundingClientRect().width);await button.click();await idle()
    await page.evaluate(()=>{
      const frame=document.querySelector('.frame');frame.style.gridTemplateColumns='0px minmax(0px,1fr) minmax(0px,300px)';window.savedFrameStyle=frame.getAttribute('style')
      const old=document.querySelector('[data-composer-seat]'),fresh=old.cloneNode(true);old.replaceWith(fresh);window.savedEditor=fresh.querySelector('textarea')
      const portal=document.createElement('aside');portal.className='dcb-file-viewer';portal.setAttribute('aria-label','合成文件预览');portal.textContent='阅读内容';document.body.append(portal)
    })
    await page.waitForFunction(()=>document.querySelector('.dcb-file-viewer')?.hasAttribute('data-dcb-focus-hidden'))
    assert.equal(await seat.isVisible(),false);assert.equal(await page.locator('.dcb-file-viewer').isVisible(),false)
    await page.setViewportSize({width:900,height:800});assert.equal(await button.isVisible(),true)
    await button.click();await idle();assert.equal(await seat.isVisible(),true);assert.equal(await page.locator('.dcb-file-viewer').isVisible(),true)
    assert.equal(await frame.evaluate(el=>el.getAttribute('style')===window.savedFrameStyle),true)
    assert.equal(await left.evaluate(el=>el.getBoundingClientRect().width),originalLeft)
  })
  await check('theme switching and Escape work while focused, and menus consume their own Escape first',async()=>{
    await page.setViewportSize({width:1440,height:950});await boot();await button.click();await idle()
    await page.locator('.dcb-theme-toggle').click();await page.waitForFunction(()=>document.body.hasAttribute('data-ds-dark-theme'));assert.equal(await button.getAttribute('aria-pressed'),'true')
    await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-dcb-theme-transition'))
    await page.screenshot({path:resolve(output,'focus-dark.png')})
    await page.evaluate(()=>{const menu=document.createElement('div');menu.setAttribute('role','menu');const option=document.createElement('button');option.textContent='关闭合成菜单';menu.append(option);document.body.append(menu);option.focus()})
    await page.keyboard.press('Escape');assert.equal(await button.getAttribute('aria-pressed'),'true')
    await page.evaluate(()=>document.querySelector('[role=menu]').remove());await button.focus();await page.keyboard.press('Escape');await idle();assert.equal(await button.getAttribute('aria-pressed'),'false')
  })
  await check('focus can start before the real input mounts, then hides the arriving input and returns its original accessibility state',async()=>{
    await boot()
    await page.evaluate(()=>{window.waitingSeat=document.querySelector('[data-composer-seat]');window.waitingSeat.setAttribute('aria-hidden','false');window.waitingSeat.remove()})
    await button.click();await idle();assert.equal(await frame.getAttribute('data-dcb-focus-frame'),'on')
    await page.evaluate(()=>document.querySelector('[data-conversation-scroll]').append(window.waitingSeat))
    await page.waitForFunction(()=>window.waitingSeat.hasAttribute('data-dcb-focus-hidden'));assert.equal(await seat.isVisible(),false)
    await page.keyboard.press('Escape');await idle();assert.equal(await seat.isVisible(),true);assert.equal(await seat.getAttribute('aria-hidden'),'false');assert.equal(await seat.getAttribute('inert'),null)
  })
  await check('the visible reading anchor stays stable and unrelated streaming text does not rebuild focus presentation',async()=>{
    await boot()
    await page.evaluate(()=>{const scroll=document.querySelector('[data-conversation-scroll]');scroll.scrollTop=550;const r=scroll.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+70);window.readAnchor=hit.closest('p');window.readY=window.readAnchor.getBoundingClientRect().top})
    await button.click();await idle();assert.ok(await page.evaluate(()=>Math.abs(window.readAnchor.getBoundingClientRect().top-window.readY)<2))
    const reads=await page.evaluate(async()=>{let count=0;const original=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(...args){if(this.hasAttribute('data-dcb-focus-part'))count++;return original.apply(this,args)};try{for(let i=0;i<30;i++)document.querySelector('article p:last-child').firstChild.appendData('。');await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));return count}finally{Element.prototype.getBoundingClientRect=original}})
    assert.equal(reads,0)
    await button.click();await idle();assert.ok(await page.evaluate(()=>Math.abs(window.readAnchor.getBoundingClientRect().top-window.readY)<2))
  })
  await check('a replaced conversation body inherits the reading width temporarily and releases copied focus styles on exit',async()=>{
    await boot();await button.click();await idle()
    const width=await page.locator('[data-conversation-content]').evaluate(el=>el.getBoundingClientRect().width)
    await page.evaluate(()=>{const body=document.querySelector('[data-conversation-content]');body.replaceWith(body.cloneNode(true))})
    await page.waitForTimeout(60)
    assert.equal(await page.locator('[data-conversation-content]').evaluate(el=>el.getBoundingClientRect().width),width)
    await page.keyboard.press('Escape');await idle()
    assert.equal(await page.locator('[data-conversation-content]').evaluate(el=>[el.style.width,el.style.maxWidth,el.style.minWidth,el.style.alignSelf].join('')),'')
    assert.equal(await seat.isVisible(),true)
  })
  await check('reading content and header tools cross the final layout handoff without a last-frame jump, including at the bottom',async()=>{
    const reports=[]
    for(const resident of[false,true])for(const tail of[false,true]){
      await boot({glass:true,resident})
      await page.evaluate(tail=>{const scroll=document.querySelector('[data-conversation-scroll]');scroll.scrollTop=tail?scroll.scrollHeight:550},tail)
      for(const direction of['enter','exit']){
        const samples=await page.evaluate(()=>new Promise(done=>{
          const button=document.querySelector('.dcb-focus-toggle'),frame=document.querySelector('.af_frame'),anchor=document.querySelector('article p:last-child'),samples=[],start=performance.now()
          const read=()=>{const r=anchor.getBoundingClientRect(),b=button.getBoundingClientRect(),seat=document.querySelector('[data-composer-seat]').getBoundingClientRect(),left=document.querySelector('.af_sidebarCol').getBoundingClientRect(),right=document.querySelector('[data-rightbar-col]').getBoundingClientRect();return{time:performance.now()-start,x:r.x,y:r.y,buttonX:b.x,seatY:seat.y,seatX:seat.x,seatWidth:seat.width,leftX:left.x,leftWidth:left.width,rightX:right.x,rightWidth:right.width,phase:frame.getAttribute('data-dcb-focus-frame'),gridMotion:frame.getAnimations().some(a=>a.transitionProperty==='grid-template-columns'),moving:document.getAnimations().some(a=>a.id.startsWith('dcb-focus-'))}}
          samples.push(read());button.click()
          const tick=()=>{samples.push(read());if(performance.now()-start<750||samples.at(-1).moving)requestAnimationFrame(tick);else done(samples)}
          requestAnimationFrame(tick)
        }))
        reports.push({resident,tail,direction,samples});writeFileSync(resolve(output,'focus-handoff-frames.json'),JSON.stringify(reports,null,2))
        const handoff=samples.findIndex((sample,i)=>i>0&&samples[i-1].moving&&!sample.moving)
        assert.ok(handoff>0,'The transition must have observable middle frames')
        for(const key of['x','y','buttonX',...(direction==='exit'?['seatY','seatX','seatWidth','leftX','leftWidth','rightX','rightWidth']:[])])assert.ok(Math.abs(samples[handoff][key]-samples[handoff-1][key])<2,`${resident?'resident':'basic'} ${tail?'bottom':'middle'} ${direction}: ${key} jumps at the final frame`)
        assert.ok(samples.every(sample=>!sample.gridMotion),'Native grid motion must not compete with the focus displacement')
        const first=samples[0],last=samples.at(-1)
        for(const key of['x','y','buttonX'])for(const sample of samples)assert.ok(sample[key]>=Math.min(first[key],last[key])-2&&sample[key]<=Math.max(first[key],last[key])+2,`${key} must not overshoot its destination`)
      }
    }
  })
  await check('restored input and panels finish native size publication before their visible entrance starts',async()=>{
    await boot({resident:true,glass:true});await button.click();await idle()
    const result=await page.evaluate(()=>new Promise(done=>{
      const seat=document.querySelector('[data-composer-seat]'),sidebar=document.querySelector('.sb_root'),samples=[];let restored=false,queued=false
      const observer=new ResizeObserver(()=>{if(!seat.offsetHeight||queued)return;queued=true;requestAnimationFrame(()=>{seat.style.paddingBottom='40px';sidebar.style.paddingTop='18px';restored=true})});observer.observe(seat)
      document.querySelector('.dcb-focus-toggle').click()
      const tick=()=>{
        samples.push({restored,opacity:Number(getComputedStyle(seat).opacity),height:seat.getBoundingClientRect().height,sidebarPadding:getComputedStyle(sidebar).paddingTop})
        if(document.getAnimations().some(a=>a.id.startsWith('dcb-focus-')))requestAnimationFrame(tick)
        else{observer.disconnect();done(samples)}
      };requestAnimationFrame(tick)
    }))
    assert.ok(result.some(sample=>!sample.restored&&sample.opacity===0),'Native updates run behind an invisible incoming input')
    const visible=result.filter(sample=>sample.opacity>.01)
    assert.ok(visible.length>2);assert.ok(visible.every(sample=>sample.restored),'The input must not appear before the native size update')
    assert.equal(new Set(visible.map(sample=>sample.height)).size,1);assert.equal(new Set(visible.map(sample=>sample.sidebarPadding)).size,1)
  })
  await check('reduced motion, forced colors, navigation, refresh and plugin disposal always leave an available exit and clean host markup',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});await button.click();await idle();assert.equal(await frame.getAttribute('data-dcb-focus-frame'),'on')
    await page.keyboard.press('Escape');await idle();assert.equal(await frame.getAttribute('data-dcb-focus-frame'),null)
    await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'active'});await button.click();await idle();assert.equal(await button.isVisible(),true)
    await page.emulateMedia({forcedColors:'none'});await page.evaluate(()=>{window.fixtureHeader=null;window.fixture.refresh()});await page.waitForFunction(()=>!document.querySelector('[data-dcb-focus-frame]'))
    await boot();assert.equal(await button.getAttribute('aria-pressed'),'false')
    await button.click();await page.waitForTimeout(45);await page.evaluate(()=>{for(const cleanup of window.cleanups.reverse())cleanup?.()});await page.waitForTimeout(350)
    assert.equal(await page.locator('[data-dcb-focus-hidden],[data-dcb-focus-moving],[data-dcb-focus-part],[data-dcb-focus-frame]').count(),0)
    assert.equal(await editor.inputValue(),'保留这段草稿和选区')
  })
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,source,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
