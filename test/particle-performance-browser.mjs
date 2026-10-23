import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {PARTICLE_COUNTS} from '../src/context-particle-config.js'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'../.scratch/ui-performance'),'particle-performance')
mkdirSync(output,{recursive:true})
const baseline=process.env.DSH_PERFORMANCE_BASELINE==='1'
const ref=process.env.DSH_PERFORMANCE_BASE_REF||'v0.3.32'
const input=baseline?{stdin:{contents:execFileSync('git',['-c',`safe.directory=${project.replaceAll('\\','/').replace(/\/$/,'')}`,'show',`${ref}:src/context-particle-renderer.js`],{cwd:project,encoding:'utf8'}),resolveDir:resolve(project,'src')}}:{entryPoints:[resolve(project,'src/context-particle-renderer.js')]}
const bundle=await build({...input,bundle:true,write:false,format:'iife',globalName:'Particles'})
const browser=await chromium.launch({headless:true,channel:'chrome'})
const evidence=[],errors=[]
try{
  for(const fallback of [false,true]){
    const page=await browser.newPage({viewport:{width:1440,height:1000}})
    page.on('pageerror',e=>errors.push(e.message))
    await page.setContent('<style>body{margin:0}#root{width:1440px;height:900px}canvas{width:100%;height:100%}</style><div id=root></div>')
    await page.evaluate(fallback=>{
      window.audit={callbacks:0,draws:0,vertices:0,arcs:0,uploads:0}
      const request=window.requestAnimationFrame.bind(window)
      window.requestAnimationFrame=fn=>request(now=>{window.audit.callbacks++;fn(now)})
      for(const [proto,key,label]of [[WebGL2RenderingContext.prototype,'drawArrays','draws'],[WebGL2RenderingContext.prototype,'texImage2D','uploads'],[CanvasRenderingContext2D.prototype,'arc','arcs']]){
        const fn=proto[key];proto[key]=function(...args){window.audit[label]++;if(key==='drawArrays')window.audit.vertices+=args[2];return fn.apply(this,args)}
      }
      if(fallback){const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind.startsWith('webgl')?null:get.call(this,kind,...args)}}
    },fallback)
    await page.addScriptTag({content:bundle.outputFiles[0].text})
    await page.evaluate(count=>{
      const detail=document.createElement('canvas');detail.width=64;detail.height=64;detail.getContext('2d').fillRect(8,8,48,48)
      const points=Array.from({length:10048},(_,i)=>({x:(i%100)/100,y:Math.floor(i/100)/100,r:.25,g:.4,b:.7,index:i<48?i:i-48,s1:(i%83)/83,s2:(i%97)/97,s3:(i%67)/67,ambient:i<48?1:0,alpha:1}))
      window.scene=Particles.createParticleScene(document.querySelector('#root'),document,window)
      window.options={progress:.5,count,light:true,visible:true,width:1440,height:900,bottom:800}
      window.scene.configure(window.options);window.scene.setModel({points,count:10000,ratio:1,detail},'default')
    },baseline?6400:PARTICLE_COUNTS.default)
    await page.waitForFunction(()=>Math.abs(window.scene.snapshot().progress-.5)<.0002)
    await page.waitForTimeout(100)
    async function sample(phase,ms=1000){
      const before=await page.evaluate(()=>{for(const key in window.audit)window.audit[key]=0;return window.scene.snapshot()})
      await page.waitForTimeout(ms)
      const result=await page.evaluate(()=>({...window.audit,...window.scene.snapshot()}))
      const row={mode:result.mode,phase,ms,frames:result.frames-before.frames,callbacks:result.callbacks,vertices:result.vertices,arcs:result.arcs,uploads:result.uploads}
      evidence.push(row);console.log(JSON.stringify(row));return row
    }
    const idle=await sample('unchanged 50% background')
    if(!baseline){assert.ok(idle.callbacks<=(fallback?12:16));assert.equal(idle.uploads,0);assert.ok(idle.frames>0)}
    await page.evaluate(()=>{window.options.progress=1;window.scene.configure(window.options)})
    await page.waitForFunction(()=>Math.abs(window.scene.snapshot().progress-1)<.0002)
    await page.waitForTimeout(150)
    const full=await sample('fully gathered background')
    if(!baseline){assert.equal(full.frames,0);assert.equal(full.callbacks,0);assert.equal(full.vertices,0);assert.equal(full.arcs,0)}
    const unchangedFull=await page.evaluate(async()=>{
      const before=window.scene.snapshot().frames
      for(let i=0;i<12;i++){window.scene.configure(window.options);await new Promise(resolve=>setTimeout(resolve,15))}
      return window.scene.snapshot().frames-before
    })
    if(!baseline)assert.equal(unchangedFull,0,'scroll/presentation sync must not wake an unchanged gathered scene')
    await page.evaluate(()=>{window.scene.configure({...window.options,visible:false})})
    const paused=await sample('paused background',250)
    assert.equal(paused.frames,0);assert.equal(paused.callbacks,0)
    await page.evaluate(()=>{window.options.progress=.2;window.scene.configure(window.options)})
    await page.waitForFunction(()=>Math.abs(window.scene.snapshot().progress-.2)<.0002)
    assert.ok(await page.evaluate(()=>window.scene.snapshot().visible))
    await page.emulateMedia({reducedMotion:'reduce'})
    await page.waitForTimeout(150)
    const unchangedReduced=await page.evaluate(async()=>{const before=window.scene.snapshot().frames;for(let i=0;i<12;i++){window.scene.configure(window.options);await new Promise(resolve=>setTimeout(resolve,15))}return window.scene.snapshot().frames-before})
    if(!baseline)assert.equal(unchangedReduced,0)
    const still=await sample('reduced motion unchanged configuration',250)
    assert.equal(still.frames,0);assert.equal(still.callbacks,0)
    await page.evaluate(()=>{window.options.width=1000;window.scene.configure(window.options)})
    await page.waitForTimeout(80)
    assert.equal(await page.locator('#root canvas').evaluate(c=>c.width),1000)
    await page.evaluate(()=>window.scene.dispose())
    assert.equal(await page.locator('#root canvas').count(),0)
    await page.close()
  }
  assert.deepEqual(errors,[])
  writeFileSync(resolve(output,baseline?'baseline.json':'verified.json'),JSON.stringify({note:'Isolated Chrome synthetic scene API counts; not desktop DSH CPU/GPU utilization.',evidence},null,2))
}finally{await browser.close()}
