import assert from 'node:assert/strict'
import {readFileSync,openSync,readSync,closeSync,mkdirSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {fileOpenHitTargetCss} from '../src/file-open-hit-target.js'

const root=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/file-open-hit-target'))
mkdirSync(output,{recursive:true})
assert.ok(process.env.DSH_ASAR,'Set DSH_ASAR to the installed desktop archive')
assert.ok(process.env.DSH_MEME_CLIENT,'Set DSH_MEME_CLIENT to the installed meme plugin client')
function source(path){
 const fd=openSync(process.env.DSH_ASAR,'r')
 try{
  const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
  const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
  let entry=JSON.parse(json);for(const part of path.split('/'))entry=entry.files[part]
  const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset));return bytes.toString()
 }finally{closeSync(fd)}
}
const host=source('dsh/node_modules/@deepseek-ai/dsh-client-ui-open-in-app/lib/client.js')
function region(text,marker){const start=text.indexOf(marker);assert.ok(start>=0,marker+' exists');return text.slice(start,text.indexOf('//#endregion',start))}
const native=region(host,'function useOpenTargetGesture(')
const classCode=host.match(/var OpenTargetButton_module_css_default = \{[\s\S]*?\n\s*\};/)?.[0]
assert.ok(classCode,'Native opening control class map exists')
const cssStart=host.indexOf('OpenTargetButton.module.css.mjs')
const nativeCss=JSON.parse(host.slice(cssStart,host.indexOf('//#endregion',cssStart)).match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)[1])
const meme=readFileSync(process.env.DSH_MEME_CLIENT,'utf8')
const zoomStart=meme.indexOf('function installMemeZoom('),zoomEnd=meme.indexOf('\n    async function apiGet(',zoomStart)
assert.ok(zoomStart>=0&&zoomEnd>zoomStart,'Installed meme zoom implementation exists')
const zoom=meme.slice(zoomStart,zoomEnd)
const zoomStyle=meme.match(/const zoomStyle = createOwnedStyle\('([^']+)'\)/)?.[1]
assert.ok(zoomStyle,'Installed meme image cursor stylesheet exists')
const icon='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="#f45b32"/></svg>')
const fixture=(await build({stdin:{resolveDir:root,contents:`
import * as react from 'react';import * as react_jsx_runtime from 'react/jsx-runtime';import{createRoot}from'react-dom/client';import{createPortal,flushSync}from'react-dom';
${classCode}
const useOpenFailureToast=()=>({toast:null,show(){}});
const Glyph=()=>react.createElement('svg',{viewBox:'0 0 10 10',width:10,height:10},react.createElement('path',{d:'M2 3l3 3 3-3',stroke:'currentColor',fill:'none'}));
// Service-independent seats preserve the installed opener's full markup and
// callbacks. The native Menu still portals its application items to body.
const _deepseek_ai_dsh_client_ui_primitives={
 Tooltip:({children})=>children,
 IconRightUpOutlineRegular:Glyph,IconFolderOpenOutlineRegular:Glyph,IconChevronDownOutlineRegular:Glyph,
 Menu:({anchor,open,items,footer,onSelect,onClose})=>react.createElement(react.Fragment,null,anchor,open&&createPortal(react.createElement('div',{role:'menu','aria-label':'打开方式',onClick:event=>event.stopPropagation()},[...items,...footer].map(item=>react.createElement('button',{key:item.id,role:'menuitem',disabled:item.disabled,onClick:()=>{onSelect(item.id);onClose()}},item.icon,item.label))),document.body))
};
${native}
window.actions=[];window.refreshes=0;window.clicks=[];
document.addEventListener('click',event=>window.clicks.push({tag:event.target.tagName,prevented:event.defaultPrevented}),true);
window.apps=[{id:'wps',name:'WPS 表格',icon:${JSON.stringify(icon)},default:true},{id:'editor',name:'另一应用',icon:${JSON.stringify(icon)},default:false}];
const root=createRoot(document.querySelector('#opener'));
window.renderOpener=(props={})=>flushSync(()=>root.render(react.createElement(OpenTargetButton,{kind:'file',applications:window.apps,defaultId:'wps',t:(key,params)=>key==='open.title'?'在 '+params.app+' 中打开':key==='path.more'?'打开方式':key==='path.appDefault'?params.app+'（默认）':key==='path.reveal'?'打开文件位置':key==='path.open'?'打开文件':key,execute:async operation=>{window.actions.push(operation);return null},refresh:()=>window.refreshes++,...props})));
window.renderOpener();
`},bundle:true,write:false,format:'iife'})).outputFiles[0].text
const browser=await chromium.launch({channel:'chrome',headless:true})
const page=await browser.newPage({viewport:{width:800,height:650}})
const errors=[],results=[]
page.on('pageerror',error=>errors.push(error.message))
async function mount(target,patched=true){
 await target.goto('about:blank')
 await target.setContent(`<!doctype html><style>${nativeCss}*{box-sizing:border-box}body{margin:30px;font:14px/22px system-ui;background:#f7f7f7;color:#222;--dsw-radius-sm:6px;--dsw-radius-md:8px;--dsw-alias-border-l2:#8884;--dsw-alias-label-primary:#222;--dsw-alias-interactive-bg-hover:#8882}body[data-ds-dark-theme]{background:#202124;color:#eee;--dsw-alias-label-primary:#eee}.file{display:flex;align-items:center;justify-content:space-between;gap:15px;border:1px solid #8885;padding:16px;border-radius:16px;min-height:90px}.name{min-width:0;overflow-wrap:anywhere}#opener{flex:none}[role=menu]{position:fixed;right:30px;top:135px;padding:8px;background:#eee;border:1px solid #888;border-radius:10px}[role=menu] button{display:flex;align-items:center;gap:8px;padding:8px;border:0;background:transparent}[data-content-image]{display:block;margin-top:28px;width:100px;height:75px}</style><article data-slot="conversation.chat.node"><div class=file><div class=name>交付文件-对照表.xlsx<br>在侧边栏预览</div><div id=opener></div></div><img data-content-image src="${icon}" alt="正文内容图片"></article>`)
 // Install the real capture listener first, as in the problematic load order.
 await target.addScriptTag({content:zoom+';window.stopMemeZoom=installMemeZoom(document);'})
 await target.addScriptTag({content:fixture})
 if(patched)await target.addStyleTag({content:fileOpenHitTargetCss})
 // Cursor styles may arrive later than the fix; CSS must still route actual
 // pointer hits to the native button instead of its decorative image.
 await target.addStyleTag({content:zoomStyle})
 await target.locator('[data-open-path-open] img').waitFor()
 await target.locator('[data-open-path-open] img').evaluate(img=>img.decode())
}
async function check(name,fn){await fn();results.push(name);console.log('PASS '+name)}
const primary=()=>page.locator('[data-open-path-open]')
const count=target=>target.evaluate(()=>window.actions.length)
const zoomed=target=>target.locator('[data-meme-zoom]').evaluateAll(nodes=>nodes.some(node=>getComputedStyle(node).display!=='none'))
async function verifyClick(target,locator,position,expectedTag='BUTTON'){
 const before=await count(target)
 await locator.click(position?{position}:undefined)
 await target.waitForFunction(expected=>window.actions.length===expected,before+1)
 assert.equal(await zoomed(target),false)
 assert.equal(await target.evaluate(()=>window.clicks.at(-1).prevented),false)
 assert.equal(await target.evaluate(()=>window.clicks.at(-1).tag),expectedTag)
}
try{
 await check('the installed meme listener reproduces the original icon interception without the fix',async()=>{
  await mount(page,false);await primary().locator('img').click()
  assert.equal(await count(page),0);assert.equal(await zoomed(page),true)
  assert.deepEqual(await page.evaluate(()=>window.clicks.at(-1)),{tag:'IMG',prevented:true})
 })
 await check('native file opener icon center and internal corners always reach the file action',async()=>{
  await mount(page)
  const img=primary().locator('img'),box=await img.boundingBox()
  for(const position of [{x:box.width/2,y:box.height/2},{x:1,y:1},{x:box.width-1,y:1},{x:1,y:box.height-1},{x:box.width-1,y:box.height-1}])await verifyClick(page,img,position)
  const buttonBox=await primary().boundingBox();await verifyClick(page,primary(),{x:2,y:buttonBox.height/2})
  assert.ok((await page.evaluate(()=>window.actions)).every(action=>action.kind==='default'))
 })
 await check('the native chevron retains its application menu and application selection',async()=>{
  const before=await count(page);await page.locator('[data-open-path-more]').click()
  await page.getByRole('menu',{name:'打开方式',exact:true}).waitFor()
  assert.equal(await count(page),before);assert.equal(await zoomed(page),false)
  await page.getByRole('menuitem',{name:'另一应用',exact:true}).locator('img').click()
  await page.waitForFunction(expected=>window.actions.length===expected,before+1)
  assert.deepEqual(await page.evaluate(()=>window.actions.at(-1)),{kind:'application',id:'editor'})
  assert.equal(await zoomed(page),false);assert.equal(await page.evaluate(()=>window.refreshes),1)
 })
 await check('Enter and Space keep keyboard activation, while ordinary body pictures still enlarge',async()=>{
  for(const key of ['Enter','Space']){const before=await count(page);await primary().focus();await primary().press(key);await page.waitForFunction(expected=>window.actions.length===expected,before+1);assert.equal(await zoomed(page),false)}
  await page.locator('[data-content-image]').click();assert.equal(await zoomed(page),true)
  await page.keyboard.press('Escape');assert.equal(await zoomed(page),false)
 })
 await check('replacing an application icon needs no observer and retains the same hit target',async()=>{
  await page.evaluate(()=>{window.apps=window.apps.map((app,index)=>({...app,icon:app.icon+'#changed-'+index}));window.renderOpener()})
  await verifyClick(page,primary().locator('img'))
  assert.equal(await primary().locator('img').evaluate(img=>getComputedStyle(img).pointerEvents),'none')
 })
 await check('large, fallback and disabled native file controls preserve their own actions',async()=>{
  await page.evaluate(()=>window.renderOpener({prominent:true}))
  const large=page.locator('[data-open-path-unpreviewable]')
  await verifyClick(page,large.locator('img'))
  await page.evaluate(()=>window.renderOpener({applications:[]}))
  await verifyClick(page,primary().locator('svg'),undefined,'svg')
  assert.deepEqual(await page.evaluate(()=>window.actions.at(-1)),{kind:'reveal'})
  await page.evaluate(()=>window.renderOpener({busy:true}))
  const disabled=await primary().boundingBox(),before=await count(page)
  await page.mouse.click(disabled.x+disabled.width/2,disabled.y+disabled.height/2)
  assert.equal(await count(page),before);assert.equal(await zoomed(page),false)
  await page.evaluate(()=>window.renderOpener())
 })
 await check('dark narrow and zoomed layouts retain the file action and original button dimensions',async()=>{
  await page.setViewportSize({width:360,height:650})
  await page.evaluate(()=>{document.body.setAttribute('data-ds-dark-theme','');document.body.style.zoom='1.35'})
  await verifyClick(page,primary().locator('img'))
  await page.screenshot({path:resolve(output,'file-open-dark-narrow.png')})
  await page.evaluate(()=>{document.body.style.zoom='';document.body.removeAttribute('data-ds-dark-theme')})
  await page.setViewportSize({width:800,height:650})
  const withFix=await primary().boundingBox()
  await page.evaluate(css=>{const sheet=[...document.querySelectorAll('style')].find(node=>node.textContent===css);sheet.remove()},fileOpenHitTargetCss)
  const without=await primary().boundingBox()
  assert.equal(withFix.width,without.width);assert.equal(withFix.height,without.height)
 })
 await check('real touch taps on the icon and chevron avoid picture enlargement',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:650},hasTouch:true,isMobile:true,deviceScaleFactor:2}),touch=await context.newPage()
  try{
   await mount(touch)
   const before=await count(touch);await touch.locator('[data-open-path-open] img').tap()
   await touch.waitForFunction(expected=>window.actions.length===expected,before+1);assert.equal(await zoomed(touch),false)
   await touch.locator('[data-open-path-more]').tap();await touch.getByRole('menu',{name:'打开方式',exact:true}).waitFor();assert.equal(await zoomed(touch),false)
   await touch.getByRole('menuitem',{name:'另一应用',exact:true}).tap();await touch.waitForFunction(expected=>window.actions.length===expected,before+2)
  }finally{await context.close()}
 })
 assert.deepEqual(errors,[])
 writeFileSync(resolve(output,'file-open-hit-target.json'),JSON.stringify({passed:results.length,checks:results,source:'Installed native OpenTargetButton and installed meme capture listener; service and primitive seats are synthetic'},null,2))
 console.log(JSON.stringify({passed:results.length,output}))
}finally{await browser.close()}
