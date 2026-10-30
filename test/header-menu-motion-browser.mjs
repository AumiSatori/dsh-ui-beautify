import assert from 'node:assert/strict'
import {openSync,readSync,closeSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium,expect} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url)),archive=process.env.DSH_ASAR||'D:/Program Files/dsh/resources/app.asar'
const fd=openSync(archive,'r'),header=Buffer.alloc(16);readSync(fd,header,0,16,0)
const bytes=Buffer.alloc(header.readUInt32LE(12));readSync(fd,bytes,0,bytes.length,16)
const tree=JSON.parse(bytes),base=8+header.readUInt32LE(4)
function source(path){let item=tree;for(const name of path.split('/'))item=item.files[name];const bytes=Buffer.alloc(item.size);readSync(fd,bytes,0,bytes.length,base+Number(item.offset));return bytes.toString()}
let conversation,opener,frontend,nativeCss
try{
 const pkg=name=>`dsh/node_modules/@deepseek-ai/${name}`
 conversation=source(pkg('dsh-client-ui-conversation')+'/lib/client.js');opener=source(pkg('dsh-client-ui-open-in-app')+'/lib/client.js')
 const assets=tree.files.dsh.files.node_modules.files['@deepseek-ai'].files['dsh-web-frontend'].files.dist.files.assets.files
 frontend=source(pkg('dsh-web-frontend')+'/dist/assets/'+Object.keys(assets).find(name=>/^index-.+\.js$/.test(name)))
 nativeCss=source(pkg('dsh-web-frontend')+'/dist/assets/'+Object.keys(assets).find(name=>/^index-.+\.css$/.test(name)))
}finally{closeSync(fd)}
function region(text,anchor,end='//#endregion'){const start=text.indexOf(anchor);assert.ok(start>=0,'native anchor '+anchor);return text.slice(start,text.indexOf(end,start))}
function sheet(text,name){const start=text.indexOf(name+'.module.css.mjs'),code=text.slice(text.lastIndexOf('//#region',start),text.indexOf('//#endregion',start));return JSON.parse(code.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)[1])}
function classes(text,name){return text.match(new RegExp(`var ${name}_module_css_default = \\{[\\s\\S]*?\\n\\s*\\};`))[0]}
function frontendMap(name){const body=frontend.match(new RegExp('\\b'+name+'=\\{([^}]+)\\}'))[1];const values=new Map([...frontend.matchAll(/([\w$]+)="([^"\n]*)"/g)].map(match=>[match[1],match[2]]));return JSON.stringify(Object.fromEntries(body.split(',').map(pair=>{const[k,v]=pair.split(':');assert.ok(values.has(v),`native class ${v}`);return[k,values.get(v)]})))}
const menu=region(frontend,'function b_(','function sA('),surface=region(frontend,'const j1=C.forwardRef(','function iA(')
const demo=`import React from 'react';import * as jsx from 'react/jsx-runtime';import * as dom from 'react-dom';import {createRoot}from'react-dom/client';import{createHeaderMenuMotion,headerMenuMotionCss}from'./src/header-menu-motion.js';
const react=React,react_jsx_runtime=jsx,C=React,d=jsx,Sn=dom,he=(...v)=>v.filter(Boolean).join(' '),clsx=he,ks=${frontendMap('ks')},Ne=${frontendMap('Ne')};
const fo=node=>node.focus({preventScroll:true}),Ws=x=>x,iu=()=>({guards:()=>false,dispose(){}}),x_=()=>false,Io=()=>null,Bs=()=>null;
function __(close){const ref=C.useRef(null);const cancel=C.useCallback(()=>{clearTimeout(ref.current);ref.current=null},[]);C.useEffect(()=>cancel,[cancel]);return{arm:()=>{cancel();ref.current=setTimeout(close,180)},cancel}}
${surface}
function C8(item){return item.type==='separator'}function $8(item){return item.type==='label'}const oA={visibility:'hidden',left:0,top:0};
${menu}
${classes(opener,'OpenTargetButton')}
${classes(conversation,'ConversationRoot')}
const _deepseek_ai_dsh_client_ui_primitives={Menu:b_,Tooltip:({children})=>children,Button:({size,variant,...props})=><button {...props}/>,IconEllipsisOutlineRegular:()=> <span>…</span>,IconChevronDownOutlineRegular:()=> <span>⌄</span>,IconFolderOpenOutlineRegular:()=> <span>▣</span>};
function useOpenTargetGesture(execute){return{pending:false,toast:null,act:operation=>execute(operation)}}function ApplicationIcon(){return <span>▣</span>}
${region(opener,'function OpenTargetButton(')}
${region(conversation,'function ViewsMoreMenu(').split('/** Approximate')[0]}
const labels={'path.more':'打开方式','open.title':'打开目录','session.moreViews':'更多会话视图'},t=key=>labels[key]||key;
const style=document.createElement('style');style.textContent=headerMenuMotionCss;document.head.append(style);
let manager=createHeaderMenuMotion(document,window);window.motion=manager;window.install=()=>{manager.dispose();manager=createHeaderMenuMotion(document,window);window.motion=manager};
function App(){
 const [present,setPresent]=React.useState(true),[other,setOther]=React.useState(false),[marked,setMarked]=React.useState(true),[delay,setDelay]=React.useState(false),[loading,setLoading]=React.useState(false);
 window.fixture={present:setPresent,marked:setMarked,delay:setDelay,other:setOther};
 const refresh=()=>{if(delay){setLoading(true);setTimeout(()=>setLoading(false),1150)}};
 return <><header>{present&&<>
  <span data-dcb-toolbar-item={marked?'folder':undefined}><OpenTargetButton applications={[{id:'explorer',name:'文件资源管理器',icon:null},{id:'editor',name:'编辑器',icon:null}]} defaultId="explorer" kind="directory" loading={loading} refresh={refresh} execute={op=>window.chosen=op} t={t}/></span>
  <span data-dcb-toolbar-item={marked?'more':undefined}><ViewsMoreMenu label="更多会话视图" entries={[]} renderSlot={()=> <><button role="menuitem" onClick={()=>window.chosen='trace'}>轨迹</button><button role="menuitem">上下文</button></>}/></span>
 </>}</header><main><textarea aria-label="草稿" defaultValue="保持草稿"/><button id="outside">外部区域</button></main>
 <section><header id="preview"><OpenTargetButton applications={[{id:'viewer',name:'查看器',icon:null}]} defaultId="viewer" kind="file" execute={()=>{}} t={key=>key==='path.more'?'预览打开方式':t(key)}/></header></section>
 <b_ open={other} portal autoFocus onClose={()=>setOther(false)} items={[{id:'unrelated',label:'无关菜单'}]} anchor={<button id="other" aria-haspopup="menu" onClick={()=>setOther(v=>!v)}>其他菜单</button>}/></>
}
createRoot(document.getElementById('root')).render(<App/>);`
// Lowercase JSX names are DOM tags, so use the native function through an alias.
const built=await build({stdin:{contents:demo.replaceAll('<b_','<NativeMenu').replaceAll('</b_','</NativeMenu').replace('function App(){','const NativeMenu=b_;function App(){'),loader:'jsx',resolveDir:project},bundle:true,write:false,format:'iife'})
const css=sheet(opener,'OpenTargetButton')+sheet(conversation,'ConversationRoot')
const html=`<!doctype html><meta charset="utf-8"><html data-platform="win32"><style>${nativeCss}</style><style data-plugin-css="@deepseek-ai/dsh-client-ui-open-in-app/OpenTargetButton.module.css">${sheet(opener,'OpenTargetButton')}</style><style data-plugin-css="@deepseek-ai/dsh-client-ui-conversation/ConversationRoot.module.css">${sheet(conversation,'ConversationRoot')}</style><style>${css}
:root{--dsw-radius-lg:12px;--dsw-radius-sm:8px;--dsw-radius-md:10px;--dsw-menu-surface-fill:#fbfcfce8;--dsw-menu-backdrop-filter:blur(16px);--dsw-alias-bg-base:#f6f6f6;--dsw-alias-label-primary:#252734;--dsw-alias-label-secondary:#626574;--dsw-alias-border-l1:#8883;--dsw-alias-border-l2:#8882;--dsw-alias-border-l4:#8883;--dsw-alias-interactive-bg-hover:#8882;--dsw-elevation-prominent:0 12px 36px #10182a24,0 0 0 1px #8882}*{box-sizing:border-box}body{margin:0;background:#f7f7f7;color:#252734;font:14px/1.5 system-ui}header{display:flex;justify-content:flex-end;align-items:center;gap:12px;height:72px;padding:16px 28px;border-bottom:1px solid #8882}button{font:inherit;cursor:pointer;color:inherit}main{padding:30px}textarea{width:400px;height:120px;display:block;margin-bottom:20px}body[data-ds-dark-theme]{background:#191b21;color:#eee;--dsw-menu-surface-fill:#24262de8;--dsw-alias-bg-base:#191b21;--dsw-alias-label-primary:#eee;--dsw-alias-label-secondary:#bbb}body[data-ds-dark-theme] textarea{background:#25262c;color:#eee}body>button{margin:20px}</style><div id="root"></div><script src="/demo.js"></script>`
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify-validation'),'header-menu-motion');mkdirSync(output,{recursive:true})
const server=createServer((req,res)=>{if(req.url==='/demo.js')res.writeHead(200,{'content-type':'text/javascript'}).end(built.outputFiles[0].text);else res.writeHead(200,{'content-type':'text/html;charset=utf-8'}).end(html)})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1100,height:760}}),errors=[],checks=[]
page.on('pageerror',error=>{errors.push(error.message);console.error('FIXTURE ERROR',error.message)})
const active=()=>page.locator('[data-dcb-header-menu]'),ghost=()=>page.locator('[data-dcb-header-menu-ghost]'),tick=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
const trigger=kind=>page.getByRole('button',{name:kind==='folder'?'打开方式':'更多会话视图',exact:true})
async function finish(){await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id.startsWith('dcb-header-menu'))a.finish()});await tick()}
async function mid(locator,time=80){return locator.evaluate((node,time)=>{const a=node.getAnimations().find(a=>a.id.startsWith('dcb-header-menu'));if(!a)return null;a.pause();a.currentTime=time;const s=getComputedStyle(node);return{opacity:Number(s.opacity),transform:s.transform,filter:s.filter,left:node.style.left,top:node.style.top,willChange:s.willChange,duration:a.effect.getTiming().duration}},time)}
async function close(){await page.locator('#outside').click();await finish()}
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await trigger('folder').waitFor()
 await check('both native header menus animate actual entry and exit frames without retaining interactive copies',async()=>{
  for(const kind of ['folder','more']){
   await trigger(kind).click();await expect(active()).toHaveAttribute('data-dcb-header-menu',kind)
   const sample=await mid(active());assert.ok(sample&&sample.opacity>0&&sample.opacity<1);assert.notEqual(sample.transform,'none');assert.match(sample.filter,/blur\(/);assert.match(sample.willChange,/opacity/);assert.equal(sample.duration,240)
   await page.screenshot({path:resolve(output,kind+'-enter.png')});await finish()
   assert.equal(await active().evaluate(n=>getComputedStyle(n).willChange),'auto')
   const seat=await active().evaluate(n=>({left:n.style.left,top:n.style.top}));await trigger(kind).click();await expect(active()).toHaveCount(0);await expect(ghost()).toHaveCount(1)
   assert.equal(await ghost().getAttribute('inert'),'');assert.equal(await ghost().getAttribute('aria-hidden'),'true');assert.equal(await ghost().locator('[id],[role],[tabindex]').count(),0)
   const exit=await mid(ghost());assert.ok(exit.opacity>0&&exit.opacity<1);assert.equal(exit.left,seat.left);assert.equal(exit.top,seat.top);assert.equal(exit.duration,200)
   await page.screenshot({path:resolve(output,kind+'-exit.png')});await finish();await expect(ghost()).toHaveCount(0)
  }
 })
 await check('rapid dismissal and reopening continue from the visible frame and bound ghost count',async()=>{
  await trigger('folder').click();const open=await mid(active(),65);await trigger('folder').click();await expect(ghost()).toHaveCount(1);const leaving=await mid(ghost(),0);assert.ok(Math.abs(leaving.opacity-open.opacity)<.025)
  const closing=await mid(ghost(),60);await trigger('folder').click();const returned=await mid(active(),0);assert.ok(Math.abs(returned.opacity-closing.opacity)<.025);await expect(ghost()).toHaveCount(0);await finish()
  for(let i=0;i<6;i++){await trigger(i%2?'folder':'more').click();assert.ok(await ghost().count()<=2)}await close();await expect(ghost()).toHaveCount(0)
 })
 await check('keyboard and outside dismissal preserve native focus and selected actions',async()=>{
  await trigger('folder').focus();await page.keyboard.press('Enter');await finish();await expect(active()).toHaveCount(1);await page.keyboard.press('End');await page.keyboard.press('Enter');await expect(active()).toHaveCount(0);assert.equal(await page.evaluate(()=>window.chosen.kind),'application');await finish()
  await trigger('more').click();await finish();await page.keyboard.press('Escape');await expect(active()).toHaveCount(0);await expect(trigger('more')).toBeFocused();await finish()
  await trigger('more').click();await finish();await page.locator('#outside').click();await expect(active()).toHaveCount(0);await finish();assert.equal(await page.getByRole('textbox',{name:'草稿'}).inputValue(),'保持草稿')
 })
 await check('real module classes identify both menus even before toolbar marks exist; unrelated menus stay native',async()=>{
  await page.evaluate(()=>window.fixture.marked(false));for(const kind of ['folder','more']){await trigger(kind).click();await expect(active()).toHaveAttribute('data-dcb-header-menu',kind);await close()}
  await page.locator('#other').click();await expect(page.getByRole('menuitem',{name:'无关菜单'})).toBeVisible();assert.equal(await active().count(),0);assert.equal(await page.getByRole('menuitem',{name:'无关菜单'}).evaluate(n=>n.closest('[role=menu]').getAnimations().length),0);await page.locator('#outside').click()
  await trigger('folder').click();await finish();await page.evaluate(()=>window.fixture.other(true));assert.equal(await active().count(),1);assert.equal(await page.getByRole('menuitem',{name:'无关菜单'}).evaluate(n=>n.closest('[role=menu]').hasAttribute('data-dcb-header-menu')),false);await close()
  await page.getByRole('button',{name:'预览打开方式',exact:true}).click();assert.equal(await active().count(),0);assert.equal(await page.getByRole('menu').evaluate(n=>n.getAnimations().length),0);await page.locator('#outside').click()
 })
 await check('a slow native application refresh still animates the eventual header menu',async()=>{
  await page.evaluate(()=>window.fixture.delay(true));await trigger('folder').click();await expect(trigger('folder')).toBeDisabled();await expect(active()).toHaveCount(0)
  await expect(active()).toHaveAttribute('data-dcb-header-menu','folder');const frame=await mid(active(),70);assert.ok(frame&&frame.opacity>0&&frame.opacity<1);await finish();await close();await page.evaluate(()=>window.fixture.delay(false))
 })
 await check('dark theme, small viewport and Darwin backing keep the native placement',async()=>{
  await page.evaluate(()=>{document.body.setAttribute('data-ds-dark-theme','');document.documentElement.dataset.platform='darwin'});await page.setViewportSize({width:420,height:500});await trigger('folder').click();await finish()
  const box=await active().boundingBox();assert.ok(box.x>=11&&box.x+box.width<=409);await page.screenshot({path:resolve(output,'dark-narrow.png')});await close();assert.equal(await page.locator('[data-menu-backing]').count(),0)
  await page.setViewportSize({width:1100,height:760})
 })
 await check('reduced motion, hidden documents and disabling cancel work without replaying existing menus',async()=>{
  await trigger('folder').click();await mid(active());await page.evaluate(()=>window.motion.sync(false));assert.equal(await active().evaluate(n=>n.getAnimations().length),0);await page.evaluate(()=>window.motion.sync(true));assert.equal(await active().evaluate(n=>n.getAnimations().length),0);await close()
  await page.emulateMedia({reducedMotion:'reduce'});await trigger('more').click();assert.equal(await active().evaluate(n=>n.getAnimations().length),0);await page.keyboard.press('Escape');await expect(ghost()).toHaveCount(0);await page.emulateMedia({reducedMotion:'no-preference'})
  await trigger('folder').click();await mid(active());await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await active().evaluate(n=>n.getAnimations().length),0);await close();await page.evaluate(()=>delete document.hidden)
 })
 await check('installation on an existing menu and disposal release marks, copies, observers and native style',async()=>{
  await trigger('more').click();await mid(active());await page.evaluate(()=>window.install());assert.equal(await active().evaluate(n=>n.getAnimations().length),0);await close()
  await trigger('folder').click();await mid(active());await page.keyboard.press('Escape');await expect(ghost()).toHaveCount(1);await page.evaluate(()=>window.motion.dispose());await expect(ghost()).toHaveCount(0);assert.equal(await page.locator('[data-menu-backing]').count(),0)
  await trigger('folder').click();assert.equal(await active().count(),0);assert.equal(await page.getByRole('menu').evaluate(n=>n.getAnimations().length),0);await page.locator('#outside').click();assert.equal(await page.locator('[data-dcb-header-menu-moving]').count(),0)
 })
 assert.deepEqual(errors,[]);writeFileSync(resolve(output,'checks.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
