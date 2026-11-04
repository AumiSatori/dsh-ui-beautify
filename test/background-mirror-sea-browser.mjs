import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'

const project=fileURLToPath(new URL('..',import.meta.url))
const bundle=await build({entryPoints:[resolve(project,'src/background-mirror-sea.js')],bundle:true,write:false,format:'iife',globalName:'MirrorSea',minify:false,loader:{'.webp':'dataurl'}})
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const sky=frame=>frame.evaluate(()=>{
  const canvas=document.querySelector('#mirror-sea'),ctx=canvas.getContext('2d')
  const data=ctx.getImageData(0,0,canvas.width,Math.max(1,Math.round(canvas.height*.34))).data
  let sum=0
  for(let i=0;i<data.length;i+=4)sum+=data[i]+data[i+1]+data[i+2]
  return sum/(data.length/4*3)
})
const water=frame=>frame.evaluate(()=>{
  const canvas=document.querySelector('#mirror-sea'),ctx=canvas.getContext('2d')
  const top=Math.round(canvas.height*.6)
  return Array.from(ctx.getImageData(0,top,canvas.width,Math.max(1,canvas.height-top)).data)
})
const difference=(a,b)=>{let sum=0;for(let i=0;i<a.length;i+=4)sum+=Math.abs(a[i]-b[i]);return sum/(a.length/4)}
async function mount(page,html){
  const handle=await page.evaluateHandle(source=>{
    const frame=document.createElement('iframe')
    frame.style.cssText='display:block;width:960px;height:600px;border:0'
    frame.setAttribute('sandbox','allow-scripts')
    frame.srcdoc=source
    document.body.appendChild(frame)
    return frame
  },html)
  const frame=await handle.contentFrame()
  await frame.locator('#mirror-sea').waitFor()
  await frame.waitForFunction(()=>document.querySelector('#mirror-sea').width>200)
  // The first frame only becomes visible once both inlined artwork images decoded.
  await frame.waitForFunction(()=>{
    const canvas=document.querySelector('#mirror-sea'),ctx=canvas.getContext('2d')
    const data=ctx.getImageData(0,0,canvas.width,8).data
    for(let i=0;i<data.length;i+=4)if(data[i]+data[i+1]+data[i+2]>90)return true
    return false
  },null,{timeout:15000})
  return {handle,frame}
}
try{
  const page=await browser.newPage({viewport:{width:1000,height:700}})
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  page.on('request',request=>{if(/^https?:/.test(request.url()))errors.push('network '+request.url())})
  await page.setContent('<!doctype html><body style="margin:0"></body>')
  await page.addScriptTag({content:bundle.outputFiles[0].text})
  const html=await page.evaluate(()=>MirrorSea.mirrorSeaHtml)
  const images=(html.match(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g)||[]).map(source=>Math.round(source.length*.75))
  assert.equal(images.length,2)
  // Super-resolved 2K artwork: two multi-hundred-KB frames, and the whole
  // document keeps a quarter of the 4MB HTML import limit as headroom.
  for(const size of images)assert.ok(size>200*1024&&size<1024*1024,`artwork ${size} bytes`)
  assert.ok(html.length>800*1024,`document ${html.length} chars should inline the 2K art`)
  assert.ok(html.length<4*1024*1024*.75,`document ${html.length} chars must stay under 3MB`)
  assert.equal(/https?:\/\//.test(html.replace(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g,'')),false)
  for(const forbidden of ['fetch(','XMLHttpRequest','import(','<script src','<link '])assert.equal(html.includes(forbidden),false,forbidden)
  const {handle,frame}=await mount(page,html)
  assert.equal(await frame.evaluate(()=>{try{return !!parent.document}catch{return false}}),false)

  // The preset must never guess from a clock: the theme message drives the frame.
  const daylight=await sky(frame)
  const before=await water(frame)
  await page.waitForTimeout(500)
  const after=await water(frame)
  assert.ok(difference(before,after)>1.2,'water ripples animate')

  const setTheme=(target,theme)=>target.evaluate(theme=>document.querySelector('iframe').contentWindow.postMessage({type:'dcb-background-theme',theme},'*'),theme)
  await setTheme(page,'dark')
  await page.waitForTimeout(1600)
  const nightSky=await sky(frame)
  assert.ok(nightSky<daylight*.72,`dark theme shows the night frame (${nightSky.toFixed(1)} vs ${daylight.toFixed(1)})`)
  await setTheme(page,'light')
  await page.waitForTimeout(1600)
  const backToDay=await sky(frame)
  assert.ok(Math.abs(backToDay-daylight)<daylight*.08,'light theme returns to the day frame')

  const skyBefore=await sky(frame)
  await page.evaluate(()=>document.querySelector('iframe').contentWindow.postMessage({type:'dcb-background-pointer',x:1,y:1},'*'))
  await page.waitForTimeout(700)
  const skyAfter=await sky(frame)
  assert.ok(Math.abs(skyAfter-skyBefore)>0.15,'pointer parallax shifts the frame')
  assert.deepEqual(errors,[])

  // Without a host theme the OS colour scheme is only a fallback.
  const darkOS=await browser.newPage({viewport:{width:1000,height:700},colorScheme:'dark'})
  await darkOS.setContent('<!doctype html><body style="margin:0"></body>')
  await darkOS.addScriptTag({content:bundle.outputFiles[0].text})
  const osFallback=await mount(darkOS,html)
  assert.ok(await sky(osFallback.frame)<daylight*.72,'dark OS scheme falls back to the night frame')
  await osFallback.handle.dispose()

  // Reduced motion keeps a single static frame: no ripples, no motes, no parallax.
  const calm=await browser.newPage({viewport:{width:1000,height:700},reducedMotion:'reduce'})
  await calm.setContent('<!doctype html><body style="margin:0"></body>')
  await calm.addScriptTag({content:bundle.outputFiles[0].text})
  const still=await mount(calm,html)
  assert.equal(await still.frame.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true)
  const stillBefore=await sky(still.frame)
  assert.ok(stillBefore>10,'static frame still paints the artwork')
  await calm.evaluate(()=>document.querySelector('iframe').contentWindow.postMessage({type:'dcb-background-theme',theme:'dark'},'*'))
  await calm.waitForTimeout(400)
  assert.ok(await sky(still.frame)<stillBefore*.8,'reduced motion follows the theme instantly')
  const first=await water(still.frame)
  await calm.waitForTimeout(600)
  const second=await water(still.frame)
  assert.equal(difference(first,second),0,'static under reduced motion')
  await handle.dispose()
  console.log('PASS mirror sea preset is self-contained, theme driven, animated and static when reduced')
}finally{await browser.close()}
