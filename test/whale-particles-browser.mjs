import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {PARTICLE_COUNTS} from '../src/context-particle-config.js'

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
      window.model=await Particles.sampleParticleArtwork(source,{transparent:true,portrait:true})
      window.audit={triangles:0,points:0,images:0,arcs:0}
      const draw=WebGL2RenderingContext.prototype.drawArrays
      WebGL2RenderingContext.prototype.drawArrays=function(mode,first,count){
        if(mode===this.TRIANGLES)window.audit.triangles++;if(mode===this.POINTS)window.audit.points+=count
        const result=draw.call(this,mode,first,count)
        if(window.motionPositions&&mode===this.POINTS){
          const w=this.drawingBufferWidth,h=this.drawingBufferHeight,pixels=new Uint8Array(w*h*4);this.readPixels(0,0,w,h,this.RGBA,this.UNSIGNED_BYTE,pixels)
          let sx=0,sy=0,weight=0;for(let i=0;i<w*h;i++){const k=i*4,r=pixels[k];if(r>20&&r>pixels[k+1]*2&&r>pixels[k+2]*2){weight+=r;sx+=(i%w)*r;sy+=Math.floor(i/w)*r}}
          if(weight)window.motionPositions.push([sx/weight,sy/weight])
        }
        return result
      }
      const image=CanvasRenderingContext2D.prototype.drawImage,arc=CanvasRenderingContext2D.prototype.arc
      CanvasRenderingContext2D.prototype.drawImage=function(...args){window.audit.images++;return image.apply(this,args)}
      CanvasRenderingContext2D.prototype.arc=function(...args){window.audit.arcs++;if(window.motionPositions&&args[0]>0&&args[0]<240&&args[1]>0&&args[1]<240)window.motionPositions.push(args.slice(0,2));return arc.apply(this,args)}
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
    result.densities=[]
    for(const count of [PARTICLE_COUNTS.default,PARTICLE_COUNTS.max]){
      const frames=await page.evaluate(count=>{for(const key in window.audit)window.audit[key]=0;window.scene.pause();const frames=window.scene.snapshot().frames;window.scene.configure({progress:1,count,light:false,visible:true,width:1080,height:1000,bottom:980});return frames},count)
      await page.waitForFunction(({count,frames})=>window.scene.snapshot().budget===count&&window.scene.snapshot().frames>frames,{count:fallback?4500:count,frames})
      const drawn=await page.evaluate(()=>({budget:window.scene.snapshot().budget,points:window.audit.points,arcs:window.audit.arcs,images:window.audit.images,triangles:window.audit.triangles}))
      assert.equal(drawn.images,0);assert.equal(drawn.triangles,0)
      if(fallback)assert.ok(drawn.arcs>=4500&&drawn.arcs<4700,'denser preferences retain the CPU safety cap')
      else assert.ok(drawn.points>=count&&drawn.points<count+200,'the denser setting increases real GPU points')
      result.densities.push({count,...drawn})
      await page.screenshot({path:resolve(output,`whale-full-${count}-${fallback?'canvas2d':'webgl'}.png`)})
    }
    await page.evaluate(count=>window.scene.configure({progress:1,count,light:false,visible:true,width:1080,height:1000,bottom:980}),PARTICLE_COUNTS.default)
    await page.waitForFunction(count=>window.scene.snapshot().budget===count,fallback?4500:PARTICLE_COUNTS.default)
    await page.emulateMedia({reducedMotion:'no-preference'})
    const before=await page.evaluate(()=>window.scene.snapshot())
    await page.waitForTimeout(1100)
    const after=await page.evaluate(()=>window.scene.snapshot())
    assert.ok(after.frames-before.frames>3,'fully formed whale keeps drawing without a settings or pressure update')
    assert.ok(after.frames-before.frames<=(fallback?12:17),'settled motion retains the low drawing cadence')
    assert.equal(after.progress,1);assert.ok(after.time>before.time)
    result.settledFrames=after.frames-before.frames
    await page.evaluate(count=>window.scene.configure({progress:.45,count,light:false,visible:true,width:1080,height:1000,bottom:980}),PARTICLE_COUNTS.default)
    await page.waitForFunction(()=>Math.abs(window.scene.snapshot().progress-.45)<.002)
    await page.screenshot({path:resolve(output,fallback?'whale-gathering-canvas2d.png':'whale-gathering-webgl.png')})
    // Isolate one red body dot: measure real shader readback / canvas arc
    // coordinates so brightness changes alone cannot pass the movement check.
    result.motion=[]
    for(const kind of ['whale','default','svg','image']){
    await page.evaluate(kind=>{
      const ambient=Array.from({length:48},(_,i)=>({x:0,y:0,r:0,g:0,b:0,index:i,s1:0,s2:.9,s3:.8,ambient:1,alpha:1}))
      const dot={x:.5,y:.5,r:1,g:0,b:0,index:0,s1:.15,s2:.4,s3:.8,ambient:0,alpha:1}
      document.querySelector('#root').style.cssText='width:240px;height:240px'
      window.scene.setModel({...window.model,points:[...ambient,dot],count:1,ratio:1},kind)
      window.scene.configure({progress:1,count:500,light:false,visible:true,width:240,height:240,bottom:240})
    },kind)
    await page.waitForFunction(()=>window.scene.snapshot().progress===1)
    await page.evaluate(()=>window.motionPositions=[])
    await page.waitForTimeout(1600)
    const motion=await page.evaluate(()=>{
      const points=window.motionPositions,x=points.map(p=>p[0]),y=points.map(p=>p[1]);window.motionPositions=null
      return{samples:points.length,x:Math.max(...x)-Math.min(...x),y:Math.max(...y)-Math.min(...y)}
    })
    assert.ok(motion.samples>3,'the isolated particle renders continuously')
    assert.ok(Math.max(motion.x,motion.y)>.45,'a gathered particle actually moves in space')
    assert.ok(motion.x<12&&motion.y<12,'motion stays local to the formed silhouette')
    result.motion.push({kind,...motion})
    assert.equal(await page.evaluate(()=>window.audit.triangles+window.audit.images),0,'no artwork type may overlay an image')
    }
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(180)
    const still=await page.evaluate(()=>window.scene.snapshot().frames);await page.waitForTimeout(250)
    assert.equal(await page.evaluate(()=>window.scene.snapshot().frames),still,'reduced motion still stops continuous drawing')
    await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(100)
    await page.evaluate(()=>window.scene.pause());await page.waitForTimeout(100)
    const paused=await page.evaluate(()=>window.scene.snapshot().frames);await page.waitForTimeout(200)
    assert.equal(await page.evaluate(()=>window.scene.snapshot().frames),paused,'pausing cancels the settled whale timer')
    await page.evaluate(()=>window.scene.dispose())
    evidence.push(result);await page.close()
  }
  assert.deepEqual(errors,[])
  writeFileSync(resolve(output,'verification.json'),JSON.stringify({evidence,errors},null,2))
  console.log(JSON.stringify({evidence,output},null,2))
}finally{await browser.close()}
