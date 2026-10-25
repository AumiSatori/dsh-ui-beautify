import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeChangedFiles} from './native-changed-files.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','background-chat-surfaces-qa'),'chat-surfaces'),native=nativeChangedFiles()
mkdirSync(output,{recursive:true})
const demo=`import React from'react';import*as jsxRuntime from'react/jsx-runtime';import{createRoot}from'react-dom/client';import{fullBackgroundCss}from'./src/full-background.js';
const react=React,react_jsx_runtime=jsxRuntime,ChangedFiles_module_css_default=${JSON.stringify(native.classes)},basename=value=>value.split('/').at(-1),resolveWorkspacePath=(cwd,path)=>cwd+'/'+path;
const _deepseek_ai_dsh_client_ui_primitives={FileTypeIcon:()=>React.createElement('span',{'aria-hidden':true},'◇'),HoverCard:({anchor})=>anchor,IconChevronUpOutlineRegular:()=>React.createElement('span',null,'⌃'),IconChevronDownOutlineRegular:()=>React.createElement('span',null,'⌄')};
${native.code}
window.openedReviews=[];const t=(key,{count,name}={})=>({'changes.title':'已编辑 '+count+' 个文件','changes.singleTitle':'已编辑 '+name,'changes.added':'+'+count,'changes.deleted':'-'+count,'changes.openReview':'在侧边栏查看本轮改动','changes.viewDiff':'查看 '+name+' 的差异','changes.all':'全部 '+count+' 个文件','changes.expandAria':'展开全部 '+count+' 个文件','changes.collapse':'收起文件','changes.collapseAria':'收起文件','presented.preview':'查看修改'}[key]||key);
function App(){const [single,setSingle]=React.useState(false);window.fixture={single:setSingle};const files=Array.from({length:7},(_,i)=>({path:i===0?'src/example-with-a-long-file-name-for-narrow-layout.mjs':'src/example-'+i+'.mjs',display:i===0?'src/example-with-a-long-file-name-for-narrow-layout.mjs':'src/example-'+i+'.mjs',added:20+i,deleted:i}));const changes={total:single?1:7,seq:1,files:single?[files[0]]:files,added:245,deleted:31};return <><main><article data-chat-flow=""><section data-chat-turn="1"><h2>自定义背景下的聊天样式</h2><p>修改 <code>ui-plugin/node_modules</code> 后，行内代码保持可读；长代码 <code>{'example/'.repeat(12)}settings.mjs</code> 可以换行。</p><pre><code>const untouchedCodeBlock = true;</code></pre><div className="LOmM4q_fileCard" data-testid="native-file-card"><span className="LOmM4q_fileIcon">MD</span><span className="LOmM4q_fileContent"><span className="LOmM4q_fileName">FEATURES-ALL.md</span><span className="LOmM4q_fileMeta">插件全部功能总览</span></span><button aria-label="移除合成文件">×</button></div><ChangedFiles changes={changes} cwd="workspace" openReview={i=>window.openedReviews.push(i)} t={t} sessionId="synthetic" useChangesDiff={()=>undefined} loadChangesDiff={()=>{}}/><div className="test_actions"><button className="test_action" aria-label="复制合成消息">□</button><button className="test_action" aria-label="喜欢合成消息">♡</button><span className="test_endInfo">用量 3.2M · 03:04</span></div></section></article></main><aside role="dialog"><code>其他设置里的代码</code><div data-changed-files="" className="dialog-card">其他设置里的卡片</div><div className="LOmM4q_fileCard">设置中的原生附件</div></aside></>}
const style=document.createElement('style');style.dataset.candidate='';style.textContent=fullBackgroundCss;document.head.append(style);createRoot(document.getElementById('root')).render(<App/>);`
const built=await build({stdin:{contents:demo,loader:'jsx',resolveDir:project},bundle:true,write:false,format:'iife',loader:{'.png':'dataurl'}})
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%;font:14px/1.8 system-ui,sans-serif;color:#20232b;--dsw-static-neutral-50:#fafafa;--dsw-static-neutral-100:#f0f0f0;--dsw-static-neutral-00:#fff;--dsw-static-neutral-850:#252832;--dsw-static-neutral-800:#303542;--dsw-alias-bg-layer-1:#fff;--dsw-alias-border-l1:#dfe4ec;--dsw-alias-border-l2:#d1d8e3;--dsw-alias-label-primary:#20232b;--dsw-alias-label-tertiary:#7b8290;--dsw-alias-state-success-primary:#00b668;--dsw-alias-state-error-primary:#ef334d;--dsw-alias-interactive-bg-hover:#eeeeee80;--dsw-radius-lg:14px;--dsw-font-family:system-ui;--ds-font-family-code:ui-monospace,monospace}body[data-dcb-background]{background:radial-gradient(ellipse at 63% 17%,#bedde7 0,transparent 42%),linear-gradient(120deg,#527da9,#bcd6df 48%,#ae869d)}body[data-ds-dark-theme]{color:#eef2fb;background:linear-gradient(120deg,#122840,#465a74 48%,#4d3048);--dsw-alias-bg-layer-1:#171b24;--dsw-alias-label-primary:#eef2fb;--dsw-alias-label-tertiary:#9099ad;--dsw-alias-border-l1:#dfe4ec;--dsw-alias-border-l2:#d1d8e3}main{padding:36px 28px}article{max-width:1050px;margin:auto}h2{margin:0 0 14px}p{line-height:2.1}code{background:#fafafa;color:#20232b;border-radius:5px;padding:3px 7px;font:12px/1.8 ui-monospace,monospace}pre{background:#fff;border-radius:10px;padding:14px;overflow:auto}pre code{padding:0;background:#fafafa}.LOmM4q_fileCard{border:.5px solid #dfe4ec;border-radius:14px;background:#fff;box-sizing:border-box;display:inline-flex;align-items:center;gap:10px;width:240px;min-height:64px;padding:8px 12px}.LOmM4q_fileIcon{width:28px;height:28px}.LOmM4q_fileContent{display:flex;flex-direction:column;flex:1;min-width:0}.LOmM4q_fileName{white-space:nowrap;color:#20232b;font-size:14px;font-weight:500;line-height:22px;overflow:hidden}.LOmM4q_fileMeta{white-space:nowrap;color:#7b8290;font-size:12px;line-height:15px;overflow:hidden}.test_actions{display:flex;align-items:center;gap:9px;margin:20px 0}.test_action{width:30px;height:30px;padding:0;border:0;border-radius:6px;background:transparent;color:#7b8290}.test_endInfo{font-size:12px;color:#7b8290}aside{display:none}.dialog-card{background:#fff}${native.css}
</style><div id="root"></div><script src="/fixture.js"></script>`
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':req.url==='/fixture.js'?'text/javascript':'text/html'});res.end(req.url==='/fixture.js'?built.outputFiles[0].text:html)})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:900}}),checks=[],errors=[]
page.on('pageerror',e=>errors.push(e.message))
const root=()=>page.locator('article [data-changed-files]'),inline=()=>page.locator('article p code').first()
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
async function colors(){return page.evaluate(()=>{const card=document.querySelector('article [data-changed-files]'),file=document.querySelector('article [class$="_fileCard"]'),code=document.querySelector('article p code'),row=card.querySelector('button[class$="_row"]');return {card:getComputedStyle(card).backgroundColor,file:getComputedStyle(file).backgroundColor,fileInk:getComputedStyle(file.querySelector('[class$="_fileName"]')).color,code:getComputedStyle(code).backgroundColor,codeInk:getComputedStyle(code).color,rowInk:row?getComputedStyle(row).color:null,blur:getComputedStyle(card).backdropFilter}})}
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await root().waitFor()
 await check('native host defaults remain unchanged without a wallpaper; code blocks keep their original surfaces',async()=>{
  const value=await colors();assert.equal(value.card,'rgb(255, 255, 255)');assert.equal(value.file,'rgb(255, 255, 255)');assert.equal(value.code,'rgb(250, 250, 250)')
  await page.evaluate(()=>document.body.setAttribute('data-dcb-background',''))
  assert.equal(await page.locator('pre code').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(250, 250, 250)')
 })
 await check('wallpaper output cards stay transparent without extra blur; inline code keeps its readable surface',async()=>{
  const value=await colors();assert.equal(value.card,'rgba(0, 0, 0, 0)');assert.equal(value.file,'rgba(0, 0, 0, 0)');assert.equal(value.fileInk,'rgb(32, 35, 43)');assert.match(value.code,/rgba\(.+, 0\.58\)/);assert.equal(value.blur,'none');assert.equal(value.codeInk,'rgb(32, 35, 43)')
  assert.equal(await page.locator('[role=dialog] code').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(250, 250, 250)')
  assert.equal(await page.locator('[role=dialog] [data-changed-files]').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)')
  assert.equal(await page.locator('[role=dialog] [class$="_fileCard"]').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)')
  await page.screenshot({path:resolve(output,'wallpaper-surfaces-light.png')})
  await root().screenshot({path:resolve(output,'file-card-light.png')})
 })
 await check('the edited-files header stays highlighted before hover and file rows have clear separators',async()=>{
  const header=root().locator('> button[class$="_header"]'),background=()=>header.evaluate(el=>getComputedStyle(el).backgroundColor)
  assert.equal(await background(),'rgba(255, 255, 255, 0.34)')
  await header.hover();await page.waitForTimeout(160);assert.equal(await background(),'rgba(255, 255, 255, 0.34)')
  await page.mouse.move(10,10);await page.waitForTimeout(160);assert.equal(await background(),'rgba(255, 255, 255, 0.34)')
  const lines=await root().locator('ul > li').evaluateAll(nodes=>nodes.map(el=>({width:getComputedStyle(el).borderTopWidth,style:getComputedStyle(el).borderTopStyle,color:getComputedStyle(el).borderTopColor})))
  assert.equal(lines[0].width,'0px');assert.ok(lines.slice(1).every(line=>line.width==='1px'&&line.style==='solid'&&line.color==='rgba(57, 76, 106, 0.2)'))
  assert.equal(await root().locator('ul').evaluate(el=>getComputedStyle(el).borderTopWidth),'1px')
  assert.equal(await root().locator('button[class$="_toggle"]').evaluate(el=>getComputedStyle(el).borderTopWidth),'1px')
  await root().screenshot({path:resolve(output,'header-rows-light.png')})
 })
 await check('native file folding, review handlers and keyboard focus continue to work',async()=>{
  assert.equal(await root().locator('button[class$="_row"]').count(),4)
  await page.getByRole('button',{name:'展开全部 7 个文件',exact:true}).click();assert.equal(await root().locator('button[class$="_row"]').count(),7)
  assert.equal(await root().locator('ul > li + li').count(),6)
  await root().locator('button[class$="_row"]').nth(1).click();assert.deepEqual(await page.evaluate(()=>window.openedReviews),[1])
  const header=page.getByRole('button',{name:'在侧边栏查看本轮改动',exact:true});await header.focus();await header.press('Enter');assert.deepEqual(await page.evaluate(()=>window.openedReviews),[1,0])
  assert.equal(await header.evaluate(el=>getComputedStyle(el).outlineWidth),'2px')
  await page.getByRole('button',{name:'收起文件',exact:true}).click()
 })
 await check('dark theme keeps cards transparent, clear secondary text and legible change counters',async()=>{
  await page.mouse.move(10,10);await page.evaluate(()=>document.activeElement?.blur())
  await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''))
  await page.waitForTimeout(160)
  const value=await colors();assert.equal(value.card,'rgba(0, 0, 0, 0)');assert.equal(value.file,'rgba(0, 0, 0, 0)');assert.equal(value.fileInk,'rgb(238, 242, 251)');assert.equal(value.codeInk,'rgb(238, 242, 251)');assert.equal(value.rowInk,'rgb(192, 206, 227)')
  assert.equal(await root().locator('[class$="_added"]').first().evaluate(el=>getComputedStyle(el).color),'rgb(116, 230, 174)')
  assert.equal(await root().locator('[class$="_deleted"]').first().evaluate(el=>getComputedStyle(el).color),'rgb(255, 158, 174)')
  assert.equal(await root().locator('> button[class$="_header"]').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(196, 215, 255, 0.12)')
  assert.equal(await root().locator('ul > li').nth(1).evaluate(el=>getComputedStyle(el).borderTopColor),'rgba(207, 224, 255, 0.2)')
  await page.screenshot({path:resolve(output,'wallpaper-surfaces-dark.png')})
  await root().screenshot({path:resolve(output,'file-card-dark.png')})
 })
 await check('single-file preview anchors and narrow layouts retain native geometry without clipping long code or paths',async()=>{
  await page.setViewportSize({width:390,height:900})
  const bounds=await page.locator('article').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth,outside:[...el.querySelectorAll('*')].filter(node=>node.getBoundingClientRect().right>el.getBoundingClientRect().right+1).map(node=>({tag:node.tagName,className:node.className,width:node.getBoundingClientRect().width})).slice(0,8)}))
  assert.ok(bounds.scroll<=bounds.client+1,JSON.stringify(bounds))
  await page.screenshot({path:resolve(output,'wallpaper-surfaces-narrow-dark.png')})
  await page.evaluate(()=>window.fixture.single(true));assert.equal(await root().getAttribute('data-single'),'true')
  assert.equal(await root().locator('ul').count(),0);assert.equal(await root().locator('button').count(),1)
 })
 await check('turning wallpaper off removes all custom fills immediately; unrelated dialogs and code blocks retain native styles',async()=>{
  await page.evaluate(()=>document.body.removeAttribute('data-dcb-background'))
  assert.equal(await inline().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(250, 250, 250)')
  assert.equal(await root().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(23, 27, 36)')
  assert.equal(await root().locator('ul').count(),0)
  assert.equal(await page.locator('article [class$="_fileCard"]').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)')
  assert.equal(await page.locator('[role=dialog] code').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(250, 250, 250)')
 })
 await check('forced colors and reduced motion remain readable, with no new animations or filters',async()=>{
  await page.evaluate(()=>document.body.setAttribute('data-dcb-background',''));await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'})
  await page.waitForTimeout(180)
  const value=await colors();assert.equal(value.blur,'none');assert.equal(await page.evaluate(()=>document.getAnimations().length),0)
  assert.equal(await root().evaluate(el=>getComputedStyle(el).boxShadow),'none')
 })
 assert.deepEqual(errors,[])
 writeFileSync(resolve(output,'verification.json'),JSON.stringify({source:'Installed native ChangedFiles React component and CSS; synthetic conversation and background; CSS integrated through fullBackgroundCss',checks,errors},null,2))
 console.log(`${checks.length} wallpaper chat surface groups passed`)
}finally{await browser.close();await new Promise(done=>server.close(done))}
