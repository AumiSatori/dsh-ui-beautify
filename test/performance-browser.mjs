import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'performance')
mkdirSync(output,{recursive:true})
const bundle=await build({entryPoints:[resolve(project,'src/lens-actions.js')],bundle:true,write:false,format:'iife',globalName:'Managers',loader:{'.jpg':'dataurl','.png':'dataurl'}})
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[],evidence=[]
page.on('pageerror',e=>errors.push(e.message))
const tick=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function boot(){
  await page.goto('about:blank')
  await page.setContent(`<style>body{margin:0;background:#eef1f7;font:14px system-ui}.composer{position:fixed;left:100px;top:400px;width:720px;height:160px;background:white;padding:20px;border-radius:20px;box-sizing:border-box}.row{display:flex;justify-content:space-between;height:32px;margin-top:65px}.round{width:32px;height:32px;border:0;border-radius:50%;background:transparent;position:relative;padding:0}.round>canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}[data-dcb-lens-stage]{position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;contain:strict;overflow:hidden}[data-dcb-lens-stage]>canvas{width:100%;height:100%;display:block}.cf_trailing{display:flex;gap:12px}.cf_activity{display:flex;align-items:center}</style><div data-composer-seat><div class=composer data-composer-card><div class=row><button class="round cf_add" aria-label=附件></button><button class="round ms_trigger" aria-label=模型 aria-haspopup=menu style="width:280px;border-radius:6px"><span class=ms_triggerLabel data-model-id=synthetic>DeepSeek V4.1 Flash (latest) (CC)</span></button><button class="round cf_roundButton" aria-label=麦克风></button><button class="round cf_roundButton" aria-label=语音></button><button class="round cf_primary" aria-label=发送></button></div></div></div>`)
  await page.evaluate(()=>{
    window.audit={uploads:0,draws:0,tiles:0}
    for(const [object,key,count]of[[WebGL2RenderingContext.prototype,'texImage2D','uploads'],[WebGL2RenderingContext.prototype,'drawArrays','draws'],[CanvasRenderingContext2D.prototype,'drawImage','tiles']]){
      const fn=object[key];object[key]=function(...args){window.audit[count]++;return fn.apply(this,args)}
    }
  })
  await page.addScriptTag({content:bundle.outputFiles[0].text})
}
try{
  await check('unchanged button rows do not upload textures or restart GPU drawing; pointer and theme updates still render',async()=>{
    await boot()
    await page.evaluate(()=>{window.lens=Managers.createLensActions(document,window);window.buttons=[...document.querySelectorAll('.round')];window.lens.sync(window.buttons)})
    await page.waitForFunction(()=>document.querySelectorAll('[data-dcb-lens-ready]').length===5)
    await page.waitForTimeout(850)
    const unchanged=await page.evaluate(async()=>{
      for(const key in window.audit)window.audit[key]=0
      for(let i=0;i<20;i++){window.lens.sync(window.buttons);await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))}
      return{...window.audit}
    })
    assert.deepEqual(unchanged,{uploads:0,draws:0,tiles:0});evidence.push({phase:'20 unchanged button syncs',...unchanged})
    await page.evaluate(()=>document.querySelector('[data-composer-card]').dispatchEvent(new PointerEvent('pointermove',{clientX:250,clientY:510,bubbles:true})))
    await page.waitForTimeout(80)
    const pointer=await page.evaluate(()=>({...window.audit}));assert.equal(pointer.uploads,0);assert.ok(pointer.draws>0&&pointer.tiles>0)
    await page.waitForTimeout(300)
    await page.evaluate(()=>{for(const key in window.audit)window.audit[key]=0;document.querySelector('.composer').style.backgroundColor='rgb(216, 230, 250)';window.lens.sync(window.buttons)})
    await tick();const tint=await page.evaluate(()=>({...window.audit}));assert.ok(tint.uploads>0);assert.ok(tint.draws>0);evidence.push({phase:'changed local background',...tint})
    await page.screenshot({path:resolve(output,'button-glass-after-tint-change.png')})
    await page.evaluate(()=>window.lens.dispose())
  })
  await check('replacement buttons, movement, resizing and disposal update the right resources',async()=>{
    await boot();await page.evaluate(()=>{window.lens=Managers.createLensActions(document,window);window.buttons=[...document.querySelectorAll('.round')];window.lens.sync(window.buttons)})
    await page.waitForFunction(()=>document.querySelectorAll('[data-dcb-lens-ready]').length===5)
    await page.evaluate(()=>{const old=window.buttons[0],replacement=old.cloneNode(false);old.replaceWith(replacement);window.buttons[0]=replacement;window.lens.sync(window.buttons);window.lens.sync(window.buttons)})
    await page.waitForFunction(()=>document.querySelectorAll('[data-dcb-lens-ready]').length===5&&!!document.querySelector('.round [data-dcb-lens-canvas]'))
    await page.waitForTimeout(850)
    await page.evaluate(()=>{for(const key in window.audit)window.audit[key]=0;document.querySelector('.composer').style.left='130px';window.lens.sync(window.buttons)})
    await tick();const moved=await page.evaluate(()=>({...window.audit}));assert.equal(moved.uploads,0);assert.ok(moved.draws>0)
    await page.evaluate(()=>{document.querySelector('.composer').style.width='760px';window.lens.sync(window.buttons)});await tick()
    assert.ok(await page.evaluate(()=>window.audit.uploads)>0)
    await page.evaluate(()=>window.lens.dispose())
    assert.equal(await page.locator('[data-dcb-lens-stage],[data-dcb-lens-canvas],[data-dcb-lens-ready]').count(),0)
  })
  await check('unchanged empty plugin slots do not toggle visibility or force new measurements',async()=>{
    await boot()
    await page.evaluate(()=>{
      document.head.insertAdjacentHTML('beforeend',`<style>${Managers.composerSlotsCss}</style>`)
      const trailing=document.createElement('div');trailing.className='cf_trailing';trailing.innerHTML='<div class="cf_activity" id="empty-slot"><span></span></div>'
      document.querySelector('[data-composer-card]').append(trailing)
      window.slots=Managers.createComposerSlots(document,window,()=>{});window.slots.sync()
    });await tick();await page.evaluate(()=>window.slots.sync());await tick()
    const result=await page.evaluate(()=>{
      const root=document.querySelector('#empty-slot'),original=root.getBoundingClientRect.bind(root);let reads=0
      root.getBoundingClientRect=()=>{reads++;return original()}
      const observer=new MutationObserver(()=>{});observer.observe(root,{attributes:true})
      for(let i=0;i<30;i++)window.slots.sync()
      const changes=observer.takeRecords().length;observer.disconnect()
      return{reads,changes,hidden:root.hasAttribute('data-dcb-empty-composer-slot')}
    })
    assert.deepEqual(result,{reads:0,changes:0,hidden:true});evidence.push({phase:'30 unchanged empty-slot syncs',...result})
    await page.locator('#empty-slot').evaluate(el=>el.innerHTML='<button>可用插件</button>');await tick();await page.evaluate(()=>window.slots.sync());await page.waitForTimeout(300)
    assert.equal(await page.locator('#empty-slot').getAttribute('data-dcb-empty-composer-slot'),null)
    await page.evaluate(()=>window.slots.dispose())
  })
  await check('the actual plugin ignores unrelated nodes and streaming paragraphs but discovers new controls and material changes',async()=>{
    await boot()
    await page.evaluate(()=>{
      window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true;window.cleanups=[];window.syncScans=0
      const query=Document.prototype.querySelectorAll
      Document.prototype.querySelectorAll=function(selector){if(selector.includes('.dcb-summary[data-card-style]'))window.syncScans++;return query.call(this,selector)}
      window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(()=>({Component:class {},createElement(){}}))}
      const flow=document.createElement('div');flow.setAttribute('data-chat-flow','');flow.id='stream';document.body.append(flow)
      const unrelated=document.createElement('aside');unrelated.id='unrelated';unrelated.innerHTML='<span>Other plugin</span>';document.body.append(unrelated)
    })
    await page.addScriptTag({content:readFileSync(resolve(project,'client.js'),'utf8')})
    await page.evaluate(()=>window.plugin.apply({slots:{inject(_name,cb){cb()},register(){}},effect(cb){window.cleanups.push(cb())}}));await page.waitForTimeout(200)
    const scans=await page.evaluate(async()=>{
      window.syncScans=0
      for(let i=0;i<12;i++){
        document.querySelector('#unrelated').classList.toggle('active')
        document.querySelector('#unrelated span').textContent='Changed '+i
        const p=document.createElement('p');p.textContent='Synthetic streamed paragraph '+i;document.querySelector('#stream').append(p)
        await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))
      }
      return window.syncScans
    });assert.equal(scans,0);evidence.push({phase:'12 unrelated updates with stream appends',presentationScans:scans})
    await page.evaluate(()=>{const panel=document.createElement('div');panel.className='dcb-style-swatch';panel.dataset.cardStyle='clear';panel.style.cssText='width:82px;height:48px;border-radius:12px';document.body.append(panel)})
    await page.waitForFunction(()=>window.syncScans>0&&!!document.querySelector('.dcb-style-swatch[data-dcb-liquid]'))
    await page.evaluate(()=>{for(const cleanup of window.cleanups.reverse())cleanup?.()})
  })
  assert.deepEqual(errors,[])
  writeFileSync(resolve(output,'verified-call-counts.json'),JSON.stringify({note:'Isolated Chrome fixture; API call counts, not overall DSH CPU/GPU utilization.',passed,evidence},null,2))
  console.log(JSON.stringify({passed,evidence,output}))
}finally{await browser.close()}
