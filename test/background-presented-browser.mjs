import assert from'node:assert/strict'
import{mkdirSync,writeFileSync}from'node:fs'
import{createServer}from'node:http'
import{resolve}from'node:path'
import{fileURLToPath}from'node:url'
import{build}from'esbuild'
import{chromium}from'@playwright/test'
import{nativePresentedFile}from'./native-presented-file.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'../background-chat-surfaces-qa/presented-cards'),'presented'),native=nativePresentedFile()
mkdirSync(out,{recursive:true})
const source=`import React from'react';import*as runtime from'react/jsx-runtime';import{createRoot}from'react-dom/client';import{fullBackgroundCss}from'./src/full-background.js';
const react_jsx_runtime=runtime,Deliverables_module_css_default=${JSON.stringify(native.classes)},PRESENTED_SUCCESS_HOLD_MS=1000,basename=p=>p.split('/').at(-1),resolveWorkspacePath=(a,b)=>a+'/'+b;
const _deepseek_ai_dsh_client_ui_primitives={fileExtension:p=>p.split('.').at(-1),FileTypeIcon:()=>React.createElement('span',{'aria-hidden':true},'MD')};
${native.code}
const c=Deliverables_module_css_default;
const t=(key,{name}={})=>({'presented.previewCard':'预览 '+name,'presented.preview':'在侧边栏预览','presented.error':'无法打开文件','presented.opening':'正在打开…','presented.file':'文件'}[key]||key);
window.events=[];function App(){const[phase,setPhase]=React.useState();window.fixture={setPhase};return <><main data-conversation-content=""><article data-chat-flow=""><h2>交付文件 · 自定义背景适配</h2><p>卡片使用柔和的半透明灰蓝底色，保留预览与文件操作。</p><div className={c.root}><div className={c.presented} data-presented-files-row="">{['EXAMPLE-GUIDELINES.md','sample-report-with-a-very-long-file-name-for-narrow-windows.md'].map((name,i)=><PresentedFileCard key={name} file={{path:name,description:i?'本轮交付说明':'界面与交互规范'}} cwd="workspace" phase={i?undefined:phase} onPreview={()=>events.push('preview-'+i)} host={{fileManager:'directory'}} t={t} actions={<><button aria-label={'打开文件 '+i} onClick={()=>events.push('open-'+i)}>↗</button><button aria-label={'更多方式 '+i} aria-haspopup="menu" onClick={()=>events.push('menu-'+i)}>⌄</button></>}/>)}</div></div></article></main><aside role="dialog"><div data-presented-file="" className={c.file}>其他设置中的卡片</div></aside></>}
const style=document.createElement('style');style.textContent=fullBackgroundCss;document.head.append(style);createRoot(document.getElementById('root')).render(<App/>);`
const bundle=await build({stdin:{contents:source,loader:'jsx',resolveDir:project},bundle:true,format:'iife',write:false,loader:{'.png':'dataurl'}})
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;font:14px/1.7 system-ui;color:#20232b;--dsw-static-neutral-50:#fafafa;--dsw-static-neutral-100:#f0f0f0;--dsw-static-neutral-00:#fff;--dsw-static-neutral-850:#252832;--dsw-static-neutral-800:#303542;--dsw-alias-label-primary:#20232b;--dsw-alias-label-secondary:#435771;--dsw-alias-label-tertiary:#7b8290;--dsw-alias-border-l1:#dfe4ec;--dsw-alias-border-l2:#d1d8e3;--dsw-alias-link:#4577de;--dsw-alias-state-error-primary:#ad203a;--dsw-focus-ring-color:#596be7;--dsw-radius-lg:14px;--dsw-radius-sm:5px;--dsw-alias-bg-layer-1:#fff;background:linear-gradient(120deg,#79a9c6,#a2c3d7 40%,#7485a5)}body[data-ds-dark-theme]{color:#eef2fb;--dsw-alias-label-primary:#eef2fb;--dsw-alias-label-secondary:#c0cee3;--dsw-alias-label-tertiary:#9099ad;--dsw-alias-state-error-primary:#ff9eae;background:linear-gradient(120deg,#132b43,#455a76 50%,#4a3048)}main{padding:50px 32px}article{max-width:1080px;margin:auto}h2{margin:0 0 12px}p{margin:0 0 22px}button{font:inherit;cursor:pointer}[data-presented-file] button:not([class$="_cardPreview"]){width:28px;height:28px;border:1px solid #8885;border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:inherit}[data-presented-file] button:focus-visible{outline:2px solid var(--dsw-focus-ring-color);outline-offset:1px}aside{display:none}${native.css}</style><div id="root"></div><script src="/fixture.js"></script>`
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':req.url==='/fixture.js'?'text/javascript':'text/html'});res.end(req.url==='/fixture.js'?bundle.outputFiles[0].text:html)})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:800}}),checks=[],errors=[]
page.on('pageerror',error=>errors.push(error.message))
const cards=()=>page.locator('article [data-presented-file]'),first=()=>cards().first()
const look=()=>first().evaluate(el=>{const s=getComputedStyle(el),name=el.querySelector('[class$="_fileName"]'),desc=el.querySelector('[data-presented-description]');return{background:s.backgroundColor,shadow:s.boxShadow,blur:s.backdropFilter,name:getComputedStyle(name).color,description:getComputedStyle(desc).color,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}})
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
try{
 await page.goto('http://127.0.0.1:'+server.address().port);await first().waitFor()
 const original=await look(),nativePreviewDisplay=await first().locator('button[class$="_cardPreview"]').evaluate(el=>getComputedStyle(el).display)
 await first().hover();const nativeHintHovered=await first().locator('[class$="_previewHint"]').isVisible();await page.mouse.move(5,5)
 await check('native two-column delivery cards retain their original geometry and default fills without a wallpaper',async()=>{assert.equal(original.background,'rgb(250, 250, 250)');assert.equal(original.height,60);assert.equal(await cards().count(),2)})
 await check('wallpaper delivery cards and icon tiles are transparent with readable labels and no added blur',async()=>{
  await page.evaluate(()=>document.body.setAttribute('data-dcb-background',''));await page.waitForTimeout(180);const value=await look();assert.equal(value.background,'rgba(0, 0, 0, 0)');assert.equal(value.name,'rgb(32, 35, 43)');assert.equal(value.description,'rgb(67, 87, 113)');assert.equal(value.blur,'none');assert.equal(value.shadow,'none');assert.equal(value.width,original.width);assert.equal(value.height,original.height)
  assert.equal(await first().locator('[class$="_fileIcon"]').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)')
  assert.equal(await page.locator('[role=dialog] [data-presented-file]').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)')
  await page.screenshot({path:resolve(out,'presented-light.png')});await page.locator('[data-presented-files-row]').screenshot({path:resolve(out,'presented-cards-light.png')})
 })
 await check('native preview visibility and explicit keyboard file actions keep the installed host behavior',async()=>{
  const preview=first().locator('button[class$="_cardPreview"]');assert.equal(await preview.evaluate(el=>getComputedStyle(el).display),nativePreviewDisplay)
  const open=page.getByRole('button',{name:'打开文件 0',exact:true});await open.focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'更多方式 0',exact:true}).click();assert.deepEqual(await page.evaluate(()=>events),['open-0','menu-0'])
  await first().hover();await page.waitForTimeout(180);assert.equal((await look()).background,'rgba(255, 255, 255, 0.34)');assert.equal(await preview.evaluate(el=>getComputedStyle(el).display),nativePreviewDisplay);assert.equal(await first().locator('[class$="_previewHint"]').isVisible(),nativeHintHovered)
  await page.mouse.move(5,5);await open.focus();await page.waitForTimeout(180);assert.equal((await look()).background,'rgba(255, 255, 255, 0.34)');await page.evaluate(()=>document.activeElement?.blur())
 })
 await check('pending and error status colors survive the surface adaptation',async()=>{
  await page.evaluate(()=>fixture.setPhase('opening'));await page.getByRole('status').waitFor();assert.equal(await first().locator('[class$="_secondaryText"]').innerText(),'正在打开…')
  await page.evaluate(()=>fixture.setPhase('error'));assert.equal(await first().locator('[data-error]').evaluate(el=>getComputedStyle(el).color),'rgb(173, 32, 58)');await page.evaluate(()=>fixture.setPhase(undefined))
 })
 await page.mouse.move(5,5)
 await check('dark cards remain transparent with clear names and descriptions',async()=>{await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.waitForTimeout(180);const value=await look();assert.equal(value.background,'rgba(0, 0, 0, 0)');assert.equal(value.name,'rgb(238, 242, 251)');assert.equal(value.description,'rgb(192, 206, 227)');await page.screenshot({path:resolve(out,'presented-dark.png')})})
 await check('long file names fit the native single-column layout in narrow windows',async()=>{await page.setViewportSize({width:390,height:800});const value=await cards().evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,width:r.width,scroll:el.scrollWidth,client:el.clientWidth}}));assert.equal(value[0].left,value[1].left);assert.ok(value[1].top>value[0].top);assert.ok(value.every(x=>x.right<=390&&x.scroll<=x.client+1));await page.screenshot({path:resolve(out,'presented-narrow-dark.png')})})
 await check('disabling wallpaper restores the original theme fills and forced colors retain keyboard contrast',async()=>{await page.evaluate(()=>document.body.removeAttribute('data-dcb-background'));await page.waitForTimeout(180);assert.equal((await look()).background,'rgb(37, 40, 50)');await page.evaluate(()=>document.body.setAttribute('data-dcb-background',''));await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await page.waitForTimeout(180);assert.equal((await look()).shadow,'none');assert.equal((await look()).blur,'none');assert.equal(await page.evaluate(()=>document.getAnimations().length),0)})
 assert.deepEqual(errors,[]);writeFileSync(resolve(out,'verification.json'),JSON.stringify({source:'Installed native PresentedFileCard and Deliverables CSS; synthetic files, actions and wallpaper',checks,errors},null,2));console.log(checks.length+' presented file groups passed')
}finally{await browser.close();await new Promise(done=>server.close(done))}
