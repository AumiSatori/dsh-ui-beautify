import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require=createRequire(join(dirname(fileURLToPath(import.meta.url)),'../../package.json'))
const {chromium}=require('playwright')
const [html,output]=process.argv.slice(2)
if(!html||!output)throw Error('Usage: node check-refinement.mjs <built.html> <output-dir>')
await mkdir(resolve(output),{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
const errors=[],requests=[],samples=[]
const onlyCanvas='.workspace,.sidebar,#sidebar-scrim,.notice,.drop-hint{visibility:hidden!important}'
page.on('pageerror',e=>errors.push(String(e)))
page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())})
const snapshot=()=>page.evaluate(()=>window.particlePreview.snapshot())
async function progress(p){
  const slider=page.locator('#occupancy');await slider.focus();await slider.press('Home')
  for(let i=0;i<Math.floor(p/10);i++)await slider.press('PageUp')
  for(let i=0;i<p%10;i++)await slider.press('ArrowRight')
  await page.waitForFunction(p=>Math.abs(window.particlePreview.snapshot().progress-p/100)<1e-8,p)
}
async function pixels(png,rect,field){
  return page.evaluate(async({source,rect,field})=>{
    const image=new Image();image.src=source;await image.decode()
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0)
    const data=ctx.getImageData(...rect).data;let visible=0
    const channels=[[],[],[]],spatial={inner:0,outer:0,left:0,right:0,top:0,bottom:0}
    for(let i=0;i<data.length;i+=4){
      if(data[i+2]>65&&data[i+2]-data[i]>15){
        visible++
        if(field){const n=i/4,x=(rect[0]+n%rect[2]-field[0])/field[2],y=(rect[1]+Math.floor(n/rect[2])-field[1])/field[3],radius=Math.hypot(x,y)
          if(radius<.30)spatial.inner++;if(radius>.58)spatial.outer++
          spatial[Math.abs(x)>Math.abs(y)?x<0?'left':'right':y<0?'top':'bottom']++
        }
      }
      for(let c=0;c<3;c++)channels[c].push(data[i+c])
    }
    return{visible,spatial,median:channels.map(values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)])}
  },{source:'data:image/png;base64,'+png.toString('base64'),rect,field})
}
try{
  await page.goto(pathToFileURL(resolve(html)).href)
  await page.waitForFunction(()=>window.particlePreview?.snapshot().ready)
  const initial=await snapshot();assert.equal(initial.quality,'low');assert.equal(initial.target,80)
  for(const theme of ['dark','light']){
    await page.locator(`[data-theme-choice=${theme}]`).click()
    for(const p of [0,5,10,20,40,60,80,100]){
      await progress(p)
      const sample=await snapshot()
      const host=await page.locator('.workspace').boundingBox(),composer=await page.locator('#composer').boundingBox()
      assert.ok(Math.abs(sample.rect[0]+sample.rect[2]/2-(host.x+host.width/2))<2,'portrait centered within conversation')
      assert.ok(sample.rect[1]+sample.rect[3]<composer.y,'whole portrait clears composer')
      await page.screenshot({path:join(resolve(output),`${theme}-${p}.png`)})
      const png=await page.screenshot({style:onlyCanvas,path:join(resolve(output),`${theme}-${p}-background.png`)})
      const actual=await pixels(png,[Math.ceil(host.x),65,Math.floor(host.width),Math.floor(composer.y-65)],sample.field)
      samples.push({theme,p,visibleParticles:sample.visible,coloredPixels:actual.visible,spatial:actual.spatial,rect:sample.rect})
      console.log(`PASS ${theme} ${p}%: ${sample.visible} particles; ${actual.visible} colored background pixels; centered`)
    }
  }
  const early=samples.filter(s=>s.theme==='dark'&&s.p<=20)
  for(let i=1;i<early.length;i++)assert.ok(early[i].coloredPixels>early[i-1].coloredPixels+250&&early[i].coloredPixels>early[i-1].coloredPixels*1.4,'0–20% visibly increases while remaining sparse')
  assert.ok(early.at(-1).coloredPixels>early[0].coloredPixels*12,'20% has clearly more visible particles than 0%')
  assert.ok(early.at(-1).visibleParticles<2000,'20% stays sparse')
  const outer=samples.find(s=>s.theme==='dark'&&s.p===5)
  assert.ok(outer.spatial.outer>outer.coloredPixels*.65,'early particles originate around the outside')
  assert.ok(outer.spatial.inner<outer.coloredPixels*.08,'early center stays clear of a filled rectangular field')
  for(const side of ['left','right','top','bottom'])assert.ok(outer.spatial[side]>outer.coloredPixels*.05,side+' contributes particles')
  const defaultDensity=samples.find(s=>s.theme==='dark'&&s.p===80)
  assert.ok(defaultDensity.visibleParticles>=4500&&defaultDensity.visibleParticles<=6500,'lightweight 80% defines default density')
  await progress(10);await page.emulateMedia({reducedMotion:'no-preference'})
  const first=await page.screenshot({style:onlyCanvas});await page.waitForTimeout(1000)
  const second=await page.screenshot({style:onlyCanvas})
  const changed=await page.evaluate(async sources=>{
    const images=await Promise.all(sources.map(async src=>{const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,c.width,c.height).data}))
    let changed=0;for(let i=0;i<images[0].length;i+=4)if(Math.abs(images[0][i+2]-images[1][i+2])>12)changed++;return changed
  },[first,second].map(png=>'data:image/png;base64,'+png.toString('base64')))
  assert.ok(changed>300,'particle streams keep moving inward at a fixed occupancy')
  await page.emulateMedia({reducedMotion:'reduce'})
  console.log(`PASS perimeter flow: ${JSON.stringify(outer.spatial)}; ${changed} moving pixels; lightweight 80% density`)
  // Verify actual composed pixels: a flat reference must not be alpha-squared
  // during WebGL blending or dimmed a second time by the browser compositor.
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 320"><rect width="200" height="320" fill="#336699"/></svg>'
  await page.locator('#svg-file').setInputFiles({name:'alpha-reference.svg',mimeType:'image/svg+xml',buffer:Buffer.from(svg)})
  await page.waitForFunction(()=>!window.particlePreview.snapshot().loadingArtwork)
  await progress(100)
  for(const theme of ['dark','light']){
    await page.locator(`[data-theme-choice=${theme}]`).click();await page.waitForTimeout(80)
    const r=(await snapshot()).rect
    const png=await page.screenshot({style:onlyCanvas})
    const actual=(await pixels(png,[Math.round(r[0]+r[2]/2)-6,Math.round(r[1]+r[3]/2)-6,12,12])).median
    const bg=theme==='dark'?[27,27,29]:[255,255,255]
    const expected=[51,102,153].map((v,i)=>Math.round(v*.62+bg[i]*.38))
    actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<4,`${theme}: actual alpha blend ${actual} matches ${expected}`))
    console.log(`PASS ${theme} alpha blend: ${actual} matches ${expected}`)
  }
  await page.locator('button[data-view=art]').click();await page.waitForTimeout(80)
  const r=(await snapshot()).rect,png=await page.screenshot({style:onlyCanvas})
  const full=(await pixels(png,[Math.round(r[0]+r[2]/2)-6,Math.round(r[1]+r[3]/2)-6,12,12])).median
  full.forEach((v,i)=>assert.ok(Math.abs(v-[51,102,153][i])<3,'100% pure background preserves original color'))
  await page.locator('#reset-artwork').click();await page.waitForTimeout(80)
  await page.screenshot({path:join(resolve(output),'complete-reference.png')})
  const fallback=await browser.newPage({viewport:{width:1000,height:800},reducedMotion:'reduce'})
  fallback.on('pageerror',e=>errors.push(String(e)))
  await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:get.call(this,type,...args)}})
  await fallback.goto(pathToFileURL(resolve(html)).href)
  await fallback.waitForFunction(()=>window.particlePreview?.snapshot().ready)
  await fallback.locator('#occupancy').focus();await fallback.keyboard.press('Home')
  for(let i=0;i<5;i++)await fallback.keyboard.press('ArrowRight')
  await fallback.waitForFunction(()=>Math.abs(window.particlePreview.snapshot().progress-.05)<1e-8)
  const fallbackState=await fallback.evaluate(()=>window.particlePreview.snapshot())
  assert.equal(fallbackState.mode,'Canvas 2D')
  const fhost=await fallback.locator('.workspace').boundingBox(),fcomposer=await fallback.locator('#composer').boundingBox()
  await fallback.screenshot({path:join(resolve(output),'fallback-perimeter-5.png')})
  const fallbackPixels=await pixels(await fallback.screenshot({style:onlyCanvas}),[Math.ceil(fhost.x),65,Math.floor(fhost.width),Math.floor(fcomposer.y-65)],fallbackState.field)
  assert.ok(fallbackPixels.spatial.outer>fallbackPixels.visible*.65&&fallbackPixels.spatial.inner<fallbackPixels.visible*.08,'Canvas 2D also flows from the perimeter')
  await fallback.close()
  console.log('PASS Canvas 2D fallback retains sparse perimeter flow')
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[])
  await writeFile(join(resolve(output),'refinement-verification.json'),JSON.stringify({samples,fullColor:full,errors,requests},null,2))
  console.log('PASS full source colors at 100%; no JS errors or network requests')
}finally{await browser.close()}
