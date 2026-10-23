import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'../.scratch/whale-particles'),'whale-particles')
mkdirSync(output,{recursive:true})
const source='data:image/png;base64,'+readFileSync(resolve(project,'assets/context-whale-cutout.png')).toString('base64')
const bundle=await build({entryPoints:[resolve(project,'src/context-particle-renderer.js')],bundle:true,write:false,format:'iife',globalName:'Particles'})
const browser=await chromium.launch({headless:true,channel:'chrome'})
const evidence=[],errors=[]
try{
  for(const fallback of [false,true]){
    const page=await browser.newPage({viewport:{width:1080,height:1000},reducedMotion:'reduce'})
    page.on('pageerror',e=>errors.push(e.message))
    await page.setContent('<style>body{margin:0;background:#141416}#root{width:1080px;height:1000px}canvas{width:100%;height:100%}</style><div id=root></div>')
    await page.addScriptTag({content:bundle.outputFiles[0].text})
    await page.evaluate(async({source,fallback})=>{
      window.model=await Particles.sampleParticleArtwork(source,{transparent:true})
      window.audit={triangles:0,points:0,images:0,arcs:0}
      const draw=WebGL2RenderingContext.prototype.drawArrays
      WebGL2RenderingContext.prototype.drawArrays=function(mode,first,count){if(mode===this.TRIANGLES)window.audit.triangles++;if(mode===this.POINTS)window.audit.points+=count;return draw.call(this,mode,first,count)}
      const image=CanvasRenderingContext2D.prototype.drawImage,arc=CanvasRenderingContext2D.prototype.arc
      CanvasRenderingContext2D.prototype.drawImage=function(...args){window.audit.images++;return image.apply(this,args)}
      CanvasRenderingContext2D.prototype.arc=function(...args){window.audit.arcs++;return arc.apply(this,args)}
      if(fallback){const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind.startsWith('webgl')?null:get.call(this,kind,...args)}}
      window.scene=Particles.createParticleScene(document.querySelector('#root'),document,window)
      window.scene.configure({progress:1,count:6400,light:false,visible:true,width:1080,height:1000,bottom:980})
      window.scene.setModel(window.model,'whale')
    },{source,fallback})
    await page.waitForFunction(()=>window.scene.snapshot().progress===1&&window.scene.snapshot().frames>0)
    const result=await page.evaluate(()=>{
      const detail=window.model.detail,c=detail.getContext('2d'),alpha=(x,y)=>c.getImageData(Math.round(x*detail.width),Math.round(y*detail.height),1,1).data[3]
      return{mode:window.scene.snapshot().mode,...window.audit,alpha:{legGap:alpha(.47,.84),hairLoop:alpha(.30,.035),armGap:alpha(.75,.425),apron:alpha(.50,.59),face:alpha(.45,.235)},sampledPoints:window.model.count}
    })
    assert.equal(result.mode,fallback?'Canvas 2D':'WebGL2')
    assert.equal(result.triangles,0,'whale never overlays a bitmap quad at full progress')
    assert.equal(result.images,0,'Canvas 2D also avoids the original image')
    if(fallback)assert.ok(result.arcs>4000,'the full silhouette still draws particles')
    else assert.ok(result.points>6000,'the full silhouette still draws particles')
    assert.equal(result.alpha.legGap,0,'the enclosed gap between the legs is transparent')
    assert.equal(result.alpha.hairLoop,0,'the enclosed ahoge loop is transparent')
    assert.ok(result.alpha.armGap<16,'the enclosed arm/hair gap has no visible foreground')
    assert.ok(result.alpha.apron>240,'white apron remains foreground')
    assert.ok(result.alpha.face>240,'skin remains foreground')
    await page.screenshot({path:resolve(output,fallback?'whale-full-canvas2d.png':'whale-full-webgl.png')})
    await page.emulateMedia({reducedMotion:'no-preference'})
    await page.evaluate(()=>window.scene.configure({progress:.45,count:6400,light:false,visible:true,width:1080,height:1000,bottom:980}))
    await page.waitForFunction(()=>Math.abs(window.scene.snapshot().progress-.45)<.002)
    await page.screenshot({path:resolve(output,fallback?'whale-gathering-canvas2d.png':'whale-gathering-webgl.png')})
    await page.evaluate(()=>window.scene.dispose())
    evidence.push(result);await page.close()
  }
  assert.deepEqual(errors,[])
  writeFileSync(resolve(output,'verification.json'),JSON.stringify({evidence,errors},null,2))
  console.log(JSON.stringify({evidence,output},null,2))
}finally{await browser.close()}
