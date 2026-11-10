import assert from 'node:assert/strict'
import {openSync,readSync,closeSync,readFileSync,mkdirSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {imagePreviewMotionCss} from '../src/image-preview-motion.js'
import {nativeFrontendModule} from './native-frontend.mjs'

const root=fileURLToPath(new URL('..',import.meta.url)),output=fileURLToPath(new URL('../../../outputs/image-preview-motion-20261110/',import.meta.url))
mkdirSync(output,{recursive:true})
// Exercise the installed native React portal and the installed meme listener,
// with synthetic images in an isolated browser and no running DSH connection.
const fd=openSync(process.env.DSH_ASAR||'D:/Program Files/dsh/resources/app.asar','r')
let frontend,css=''
try{
  const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
  const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
  let assets=JSON.parse(json);for(const key of 'dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets'.split('/'))assets=assets.files[key]
  for(const [name,entry]of Object.entries(assets.files)){
    if(!/\.css$|^index-.*\.js$/.test(name))continue
    const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset))
    const source=bytes.toString()
    if(name.endsWith('.css'))css+=source
    else if(source.includes('ImageLightbox:'))frontend=source
  }
}finally{closeSync(fd)}
assert.ok(frontend,'Installed frontend exposes ImageLightbox')
const native=nativeFrontendModule(frontend,['ImageLightbox'])
const meme=readFileSync(process.env.DSH_MEME_CLIENT||`${process.env.USERPROFILE}/.dsh/profiles/desktop/node_modules/dsh-meme/client.js`,'utf8')
const zoomStart=meme.indexOf('function installMemeZoom('),zoomEnd=meme.indexOf('\n    async function apiGet(',zoomStart)
assert.ok(zoomStart>=0&&zoomEnd>zoomStart,'Installed meme viewer exists')
const zoom=(meme.match(/const INTERACTIVE_IMG_SEL\s*=\s*'[^']+'/)?.[0]||'')+'\n'+meme.slice(zoomStart,zoomEnd)
const fixture=(await build({stdin:{resolveDir:root,contents:`
import * as React from 'react';import * as jsxRuntime from 'react/jsx-runtime';import * as ReactDOM from 'react-dom';import{createRoot}from'react-dom/client';
import{createImagePreviewMotion}from'./src/image-preview-motion.js';
${native.code}
const root=createRoot(document.querySelector('#root'));
window.openNative=()=>ReactDOM.flushSync(()=>root.render(React.createElement(${native.names.ImageLightbox},{src:document.querySelector('#content').src,alt:'合成图片',labels:{dialog:'图片预览',close:'关闭'},onClose:()=>ReactDOM.flushSync(()=>root.render(null))})));
window.motion=createImagePreviewMotion(document,window);
`},bundle:true,write:false,format:'iife'})).outputFiles[0].text
const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600"><rect width="960" height="600" fill="#4b6880"/><circle cx="480" cy="270" r="140" fill="#d3e4df"/><path d="M0 520L320 300l240 200 240-140 160 160" fill="#263f54"/></svg>')
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[]
page.on('pageerror',error=>errors.push(error.message))
const animations=()=>page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-image-preview')).map(a=>a.id))
const settle=()=>page.waitForFunction(()=>!document.getAnimations().some(a=>a.id.startsWith('dcb-image-preview')))
async function frame(){
  return page.evaluate(async()=>{
    const animations=document.getAnimations().filter(a=>a.id.startsWith('dcb-image-preview'))
    for(const animation of animations){animation.pause();animation.currentTime=84}
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
    const image=document.querySelector('[data-dcb-image-preview-moving="image"]'),s=getComputedStyle(image),box=image.getBoundingClientRect()
    return{opacity:Number(s.opacity),scale:Number(s.scale),translate:s.translate,filter:s.filter,width:box.width,height:box.height,willChange:s.willChange}
  })
}
async function resume(){await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id.startsWith('dcb-image-preview'))a.play()});await settle()}
async function assertClean(){assert.equal(await page.locator('[data-dcb-image-preview-moving]').count(),0)}
try{
  await page.setContent(`<!doctype html><style>${css}${imagePreviewMotionCss}body{margin:32px;background:#eef1f3;font:16px system-ui}#content{width:220px;height:auto;border-radius:12px}</style><div id=root></div><article data-slot="conversation.chat.node"><img id=content alt="合成图片" src="${image}"></article>`)
  await page.addScriptTag({content:fixture})
  await page.locator('#content').evaluate(img=>img.decode())
  await page.evaluate(()=>openNative())
  await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-image-preview-enter'))
  const nativeFrame=await frame()
  assert.ok(nativeFrame.opacity>0&&nativeFrame.opacity<1)
  assert.ok(nativeFrame.scale>.9&&nativeFrame.scale<1)
  assert.match(nativeFrame.filter,/blur\((?!0px)/)
  assert.ok(parseFloat(nativeFrame.translate.split(' ')[1])>0)
  await page.screenshot({path:output+'native-opening-midframe.png'})
  await resume();await assertClean()
  const nativeImage=page.locator('[role=dialog] img'),resting=await nativeImage.evaluate(img=>({width:img.getBoundingClientRect().width,scale:getComputedStyle(img).scale,filter:getComputedStyle(img).filter,willChange:getComputedStyle(img).willChange}))
  assert.ok(resting.width>nativeFrame.width);assert.equal(resting.scale,'none');assert.equal(resting.filter,'none');assert.equal(resting.willChange,'auto')
  await page.getByRole('button',{name:'关闭',exact:true}).click();assert.equal(await page.locator('[role=dialog]').count(),0)
  console.log('PASS installed native lightbox paints intermediate scale, opacity and blur, then clears animation styles')

  await page.addScriptTag({content:zoom+';window.stopMemeZoom=installMemeZoom(document)'})
  await page.locator('#content').click()
  await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-image-preview-enter'))
  const memeFrame=await frame();assert.ok(memeFrame.scale>.9&&memeFrame.scale<1)
  await page.screenshot({path:output+'meme-opening-midframe.png'})
  await page.locator('[data-meme-zoom]').dispatchEvent('wheel',{deltaY:-100})
  assert.equal(await page.locator('[data-meme-zoom-img]').evaluate(img=>img.style.transform),'scale(1.15)')
  await resume();await assertClean()
  assert.equal(await page.locator('[data-meme-zoom-img]').evaluate(img=>img.style.transform),'scale(1.15)')
  await page.locator('[data-meme-zoom-img]').dblclick()
  assert.equal(await page.locator('[data-meme-zoom-img]').evaluate(img=>img.style.transform),'scale(1)')
  await page.keyboard.press('Escape');await assertClean();assert.equal(await page.locator('[data-meme-zoom]').isVisible(),false)
  console.log('PASS installed meme viewer keeps wheel zoom during entry, double-click reset and Escape closing')

  // Reuse the persistent meme overlay, including immediate close/reopen.
  for(let i=0;i<3;i++){
    await page.locator('#content').click();assert.ok((await animations()).includes('dcb-image-preview-enter'))
    await page.keyboard.press('Escape');await assertClean()
  }
  await page.locator('#content').click();await settle()
  await page.locator('[data-meme-zoom]').click({position:{x:8,y:8}})
  assert.equal(await page.locator('[data-meme-zoom]').isVisible(),false)
  console.log('PASS repeated meme openings animate again; fast close/reopen and background closing leave no effects')

  await page.emulateMedia({reducedMotion:'reduce'})
  await page.evaluate(()=>openNative());assert.deepEqual(await animations(),[])
  await page.keyboard.press('Escape')
  await page.locator('#content').click();assert.deepEqual(await animations(),[]);await page.keyboard.press('Escape')
  await page.emulateMedia({reducedMotion:'no-preference'})
  await page.locator('#content').click();await page.emulateMedia({reducedMotion:'reduce'})
  await page.waitForFunction(()=>!document.querySelector('[data-dcb-image-preview-moving]'));await assertClean();await page.keyboard.press('Escape')
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'active'})
  await page.evaluate(()=>openNative());assert.deepEqual(await animations(),[]);await page.keyboard.press('Escape')
  await page.emulateMedia({forcedColors:'none'})
  await page.evaluate(()=>motion.sync(false));await page.locator('#content').click();assert.deepEqual(await animations(),[]);await page.keyboard.press('Escape')
  await page.evaluate(()=>motion.sync(true))
  console.log('PASS reduced motion, forced colors and disabling beauty skip or cancel both preview effects')

  await page.setViewportSize({width:360,height:740});await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''))
  await page.evaluate(()=>openNative());await settle()
  const box=await nativeImage.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=361)
  await page.keyboard.press('Escape');await page.locator('#content').click();await settle()
  const memeBox=await page.locator('[data-meme-zoom-img]').boundingBox();assert.ok(memeBox.x>=0&&memeBox.x+memeBox.width<=361)
  await page.screenshot({path:output+'meme-dark-narrow.png'});await page.keyboard.press('Escape')
  await page.evaluate(()=>{const dialog=document.createElement('div');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.innerHTML='<img src="'+document.querySelector('#content').src+'"><button>普通设置</button>';document.body.append(dialog)})
  assert.deepEqual(await animations(),[])
  await page.locator('#content').click();await page.evaluate(()=>motion.dispose());await assertClean();assert.deepEqual(await animations(),[])
  await page.keyboard.press('Escape');await page.locator('#content').click();assert.deepEqual(await animations(),[])
  await page.evaluate(()=>stopMemeZoom())
  assert.deepEqual(errors,[])
  console.log('PASS narrow dark previews fit; unrelated dialogs pass; disposal removes effects and observers')
}finally{await browser.close()}
