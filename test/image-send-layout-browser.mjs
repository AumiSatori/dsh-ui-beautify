import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {messageImageLayoutCss} from '../src/message-image-layout.js'
const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(root,'../image-send-layout');mkdirSync(out,{recursive:true})
function source(name){const fd=openSync(process.env.DSH_ASAR,'r');try{const head=Buffer.alloc(16);readSync(fd,head,0,16,0);const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16);let entry=JSON.parse(json);for(const key of `dsh/node_modules/@deepseek-ai/dsh-client-ui-${name}/lib/client.js`.split('/'))entry=entry.files[key];const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset));return bytes.toString()}finally{closeSync(fd)}}
const host=source('attachment'),chat=source('chat')
const start=chat.indexOf('var ScrollFollow = class ScrollFollow'),end=chat.indexOf('function useScrollFollow',start),native=chat.slice(start,chat.lastIndexOf('/**',end))+';window.NativeFollow=ScrollFollow;'
function region(text,marker){const start=text.indexOf(marker);if(start<0)throw Error(marker+' not found');return text.slice(start,text.indexOf('//#endregion',start))}
function sheet(text,name){return JSON.parse(region(text,text.slice(text.lastIndexOf('//#region',text.indexOf(name+'.module.css')),text.indexOf(name+'.module.css')+name.length+11)).match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)[1])}
// Preserve the exact installed components and layout; replace only external
// service calls with synthetic delayed image URLs and localized test labels.
const css=sheet(host,'MessageImage')+sheet(chat,'MessageItem'),imageCode=region(host,'function singleFit('),userCode=region(chat,'function UserContent('),imageClasses=JSON.parse(host.match(/var MessageImage_module_css_default = (\{[\s\S]*?\n\s*\});/)[1]),userClasses=JSON.parse(chat.match(/var MessageItem_module_css_default = (\{[\s\S]*?\n\s*\});/)[1])
const fixture=(await build({stdin:{resolveDir:root,contents:`import * as react from 'react';import * as react_jsx_runtime from 'react/jsx-runtime';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';const MessageImage_module_css_default=${JSON.stringify(imageClasses)},MessageItem_module_css_default=${JSON.stringify(userClasses)},EMPTY_LABELS=[],_deepseek_ai_dsh_client_ui_primitives={ImageLightbox:()=>null,FileTypeIcon:()=>null};${imageCode}\n${userCode}\nwindow.mount=(images)=>{window.images=images;window.loaded=null;window.resolveImage=null;window.load=()=>new Promise(r=>window.resolveImage=r);window.load.peek=()=>window.loaded;window.nativeRoot=createRoot(document.querySelector('#image-seat'));window.render=images=>flushSync(()=>nativeRoot.render(react.createElement(UserContent,{content:{text:'合成图片消息',attachments:images.map(image=>({type:'image',image})),extraBlocks:[]},facts:{},t:x=>x,renderFactorySlot:(_n,p)=>react.createElement('span',null,p.text),renderSlot:(_n,p)=>react.createElement(ImageGallery,{...p,load:window.load,labels:{image:'合成图片',open:'打开图片',openNamed:()=> '打开合成图片',loading:'加载中',loadFailed:'重试',lightbox:{}}})})));window.render(images)};`},bundle:true,write:false,format:'iife'})).outputFiles[0].text
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:850},deviceScaleFactor:1.25}),results=[],errors=[]
page.on('pageerror',error=>errors.push(error.message))
try{
 const cases=[[1600,900],[900,1600],[4000,200],[200,4000],[64,32],[1600,900,true],[1600,900,true,'short'],[1600,900,true,'edge'],[1600,900,true,'narrow-dark']]
 for(const [width,height,missing,mode='long']of cases){
  const narrow=mode==='narrow-dark';await page.setViewportSize({width:narrow?360:1280,height:850})
  await page.goto('about:blank');await page.setContent(`<!doctype html><style>${css}*{box-sizing:border-box}body{font:14px/22px system-ui;margin:0;--dsw-radius-xl:16px;--dsw-alias-interactive-bg-hover:#8293b511;--dsw-alias-border-l2-darkmode-thin:#8884;background:${narrow?'#17191e':'#fff'};color:${narrow?'#eceff5':'#252830'}}.history{height:${mode==='short'?40:mode==='edge'?500:1200}px}.scroll{height:800px;overflow:auto;overflow-anchor:none}.flow{width:min(720px,100%);margin:auto}.seat{height:100px;position:sticky;bottom:0;background:${narrow?'#252830':'#f4f6fa'}}</style><main class=scroll data-conversation-scroll><section class=flow data-chat-flow><div class=history>合成历史</div><article data-chat-flow-kind=user><div id=image-seat></div></article></section><footer class=seat data-composer-seat>合成输入栏</footer></main>`)
  if(!process.env.DSH_IMAGE_BASELINE)await page.addStyleTag({content:messageImageLayoutCss})
  await page.addScriptTag({content:fixture+native})
  await page.evaluate(()=>{window.scroller=document.querySelector('main');window.follow=new NativeFollow(true,48);window.size=new ResizeObserver(()=>follow.toBottom(scroller,{top:scroller.scrollTop,floor:Math.max(0,scroller.scrollHeight-scroller.clientHeight)},'instant'));size.observe(document.querySelector('[data-chat-flow]'))})
  const url='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#6485bb"/></svg>`)
  await page.evaluate(({width,height,missing})=>window.mount([{attachment:{attachmentId:'synthetic',...missing?{}:{width,height},name:'合成图片'}}]),{width,height,missing});await page.waitForTimeout(90)
  const measure=()=>page.evaluate(()=>{const frame=document.querySelector('[data-variant]'),img=frame?.querySelector('img'),stack=document.querySelector('[data-message-attachments]');return{frameHeight:frame?.getBoundingClientRect().height,frameWidth:frame?.getBoundingClientRect().width,attachmentHeight:stack?.getBoundingClientRect().height,range:scroller.scrollHeight,top:scroller.scrollTop,frameTop:frame?.getBoundingClientRect().top,imageHeight:img?.getBoundingClientRect().height}})
  if(mode==='edge')await page.waitForTimeout(2050)
  const pending=await measure();await page.evaluate(url=>{window.loaded=url;window.resolveImage(url)},url);await page.locator('img').waitFor();await page.waitForTimeout(160);const loaded=await measure()
  results.push({width,height,missing,mode,pending,loaded});console.log(JSON.stringify(results.at(-1)))
  if(narrow&&!process.env.DSH_IMAGE_BASELINE)await page.screenshot({path:resolve(out,'image-stable-dark-narrow.png')})
  await page.evaluate(()=>size.disconnect())
 }
 writeFileSync(resolve(out,process.env.DSH_IMAGE_BASELINE?'native-image-baseline.json':'native-image-fixed.json'),JSON.stringify(results,null,2))
 assert.deepEqual(errors,[])
 if(!process.env.DSH_IMAGE_BASELINE)for(const result of results){assert.equal(result.loaded.frameHeight,result.pending.frameHeight);assert.equal(result.loaded.frameWidth,result.pending.frameWidth);assert.equal(result.loaded.range,result.pending.range);assert.equal(result.loaded.top,result.pending.top);assert.equal(result.loaded.frameTop,result.pending.frameTop);assert.ok(result.loaded.imageHeight<=240)}
 console.log('PASS 9 native image loading cases, including overflow boundary, late decoding and narrow dark layout')
}finally{await browser.close()}
