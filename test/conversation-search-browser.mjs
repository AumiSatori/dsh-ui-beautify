import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/ui-beautify-session-search-20261103'))
mkdirSync(out,{recursive:true})
const built=await build({stdin:{resolveDir:root,contents:`
import React from 'react';import{createRoot}from'react-dom/client';import{createPortal,flushSync}from'react-dom';
import{createConversationSearch,conversationSearchCss}from'./src/conversation-search.js';
import{createFileContextMenu,fileContextMenuCss}from'./src/file-context-menu.js';
import{createChatFileContextMenu,chatFileTarget}from'./src/chat-file-context-menu.js';
document.head.append(Object.assign(document.createElement('style'),{textContent:conversationSearchCss+fileContextMenuCss}));
window.manager=createConversationSearch(document,window);window.parseTarget=id=>{const value=chatFileTarget(document.getElementById(id));return value&&{sessionId:value.sessionId,path:value.file.path}};
window.actions=[];window.opened=[];window.fail=false;window.pending=null;
const Menu=createFileContextMenu(React,document,window,{createPortal}),ChatMenu=createChatFileContextMenu(React,document,window,Menu),Button=manager.createButton(React);
const actionsFor=(session,file)=>Object.fromEntries(['onCopy','onCopyFile','onReveal','onProperties','onRename','onDelete','onOpenWith','onOpenWithApplication'].map(kind=>[kind,async(...args)=>{actions.push({kind,session,path:file.path,name:args[1]});if(window.pending)await window.pending;if(window.fail)throw Error('合成操作失败');if(kind==='onOpenWith')return[{id:'editor',name:'Synthetic Editor',default:true}];if(kind==='onCopy'||kind==='onCopyFile'||kind==='onProperties')return'合成操作完成';}]));
const reactRoot=createRoot(document.getElementById('utilities'));window.renderMenus=(session='alpha')=>flushSync(()=>reactRoot.render(React.createElement(React.Fragment,null,React.createElement(Button,{sessionId:session}),React.createElement(ChatMenu,{sessionId:session,actionsFor}))));window.renderMenus();
document.querySelectorAll('[data-inline-file]').forEach(node=>node.addEventListener('click',()=>opened.push(node.id)));
window.dispose=()=>{manager.dispose();reactRoot.unmount()};
`},bundle:true,write:false,format:'iife'})
const html=`<!doctype html><meta charset=utf-8><style>*{box-sizing:border-box}body{margin:0;font:15px/24px system-ui;color:#292b30;background:#f2f1ef}header{height:70px;padding:20px 36px;display:flex;justify-content:space-between}main{margin:0 auto;width:850px;max-width:100vw}[data-conversation-content]{height:650px;position:relative}[data-conversation-scroll]{height:100%;overflow:auto;padding:24px 32px}[data-chat-flow]{display:flex;flex-direction:column;gap:30px}article{padding:20px;border-radius:12px;background:#fff}p{margin:12px 0}button,a{font:inherit}button[title]{border:1px solid #b7c1d1;border-radius:7px;color:#586fe3;background:#f1f3f7}button[title] code{text-decoration:underline}#long{min-height:700px}textarea{width:100%;height:60px}.hidden-session{display:none}body[data-ds-dark-theme]{background:#202124;color:#ddd}body[data-ds-dark-theme] article{background:#2d2f33}</style><main><header><span>合成会话 · 搜索与文件操作</span><div id=utilities></div></header><div data-conversation-content data-conversation-session=alpha><div data-conversation-scroll><div data-chat-flow><article data-chat-turn=1><p id=first>关键词 Alpha，alpha；<strong>跨</strong><em>节点</em>，a.b [x]，İ i 中文。</p><p><button id=inline data-inline-file title="D:\\synthetic\\settings.json"><code>D:\\synthetic\\settings.json</code></button></p><p><button id=relative data-inline-file title="reports/合成 报告.md"><code>合成 报告.md</code></button> <button id=user-ref data-inline-file title='@"reports/合成 报告.md"'>@报告</button></p><p><a id=address href="dsh-resource://file/session/alpha/reports/%E5%90%88%E6%88%90%20%E6%8A%A5%E5%91%8A.md" data-inline-file>文件地址</a> <a id=web href="https://example.com/report.md">网页链接</a> <a id=foreign href="dsh-resource://file/session/beta/report.md">其他会话文件</a></p><div hidden>alpha 隐藏内容</div><details><summary>折叠详情</summary><p>alpha 折叠内容</p></details><div id=stream>流式测试</div></article><article id=long data-chat-turn=2><p>第二轮合成正文</p></article><article data-chat-turn=3><p id=last>ALPHA 末尾关键词</p></article></div><div data-composer-seat><textarea aria-label=草稿>alpha 草稿内容</textarea><button id=composer-file title="D:\\synthetic\\draft.md">草稿附件</button></div></div></div><div class=hidden-session data-conversation-content data-conversation-session=beta><div data-chat-flow>alpha 其他会话</div></div></main><script src=/fixture.js></script>`
const server=createServer((req,res)=>res.writeHead(200,{'Content-Type':req.url==='/fixture.js'?'text/javascript':'text/html; charset=utf-8'}).end(req.url==='/fixture.js'?built.outputFiles[0].text:html))
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),page=await browser.newPage({viewport:{width:1150,height:850}}),errors=[],checks=[]
page.on('pageerror',e=>errors.push(e.message))
const bar=page.getByRole('search',{name:'在当前会话中查找'}),field=page.getByRole('textbox',{name:'搜索会话关键词'}),menu=page.getByRole('menu')
const matches=()=>page.evaluate(()=>[...CSS.highlights.get('dcb-conversation-find')||[]].map(range=>range.toString()))
const current=()=>page.evaluate(()=>[...CSS.highlights.get('dcb-conversation-find-current')||[]].map(range=>range.toString()))
async function query(value){await field.fill(value);await page.waitForTimeout(200)}
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
async function context(id='inline'){await page.locator('#'+id).click({button:'right'});await menu.waitFor()}
try{
 await page.goto('http://127.0.0.1:'+server.address().port)
 await check('Ctrl+F opens from the composer, scopes visible loaded chat and leaves React text nodes/draft intact',async()=>{
  await page.evaluate(()=>{window.originalNode=document.getElementById('first').firstChild;window.originalHtml=document.querySelector('[data-chat-flow]').innerHTML})
  await page.getByRole('textbox',{name:'草稿'}).focus();await page.keyboard.press('Control+f');await bar.waitFor();await query('alpha')
  assert.deepEqual(await matches(),['Alpha','alpha','ALPHA'])
  assert.equal(await bar.getByRole('status').textContent(),'1/3')
  assert.equal(await page.getByRole('textbox',{name:'草稿'}).inputValue(),'alpha 草稿内容')
  assert.equal(await page.evaluate(()=>window.originalNode===document.getElementById('first').firstChild&&window.originalHtml===document.querySelector('[data-chat-flow]').innerHTML),true)
 })
 await check('Enter, Shift+Enter, F3 and buttons wrap through matches and scroll the transcript',async()=>{
  await field.press('Shift+Enter');assert.deepEqual(await current(),['ALPHA']);await page.waitForTimeout(500)
  assert.ok(await page.locator('[data-conversation-scroll]').evaluate(node=>node.scrollTop)>300)
  await field.press('Enter');assert.deepEqual(await current(),['Alpha'])
  await page.keyboard.press('F3');assert.deepEqual(await current(),['alpha'])
  await bar.getByRole('button',{name:'下一处',exact:true}).click();assert.deepEqual(await current(),['ALPHA'])
  await bar.getByRole('button',{name:'上一处',exact:true}).click();assert.deepEqual(await current(),['alpha'])
 })
 await check('literal metacharacters, Unicode and words spanning inline nodes produce exact ranges',async()=>{
  for(const text of ['跨节点','a.b','[x]','中文']){await query(text);assert.deepEqual(await matches(),[text])}
  await query('i');assert.ok((await matches()).includes('i'));assert.ok(!(await matches()).includes('İ'))
  await query('absent');assert.equal(await bar.getByRole('status').textContent(),'0/0');assert.equal(await bar.getByRole('button',{name:'下一处',exact:true}).isDisabled(),true)
 })
 await check('streaming updates refresh open results; closing restores focus and removes highlights with visible motion',async()=>{
  await query('流式');assert.equal((await matches()).length,1)
  await page.evaluate(()=>document.getElementById('stream').append(' 流式追加'))
  await page.waitForFunction(()=>CSS.highlights.get('dcb-conversation-find').size===2)
  await field.focus();await page.keyboard.press('Escape');await page.waitForTimeout(70)
  const frame=await page.locator('.dcb-find').evaluate(node=>({opacity:+getComputedStyle(node).opacity,filter:getComputedStyle(node).filter,transform:getComputedStyle(node).transform}))
  assert.ok(frame.opacity>0&&frame.opacity<1);assert.notEqual(frame.filter,'blur(0px)');assert.notEqual(frame.transform,'none')
  await page.waitForTimeout(220);assert.equal(await page.locator('.dcb-find').count(),0);assert.deepEqual(await matches(),[])
  assert.equal(await page.getByRole('textbox',{name:'草稿'}).evaluate(node=>node===document.activeElement),true)
 })
 await check('header button and selected text open search; session changes release stale ranges',async()=>{
  await page.evaluate(()=>{const range=document.createRange();range.selectNodeContents(document.getElementById('last'));getSelection().removeAllRanges();getSelection().addRange(range)})
  await page.getByRole('button',{name:'搜索当前会话',exact:true}).click();assert.equal(await field.inputValue(),'ALPHA 末尾关键词')
  await page.evaluate(()=>document.querySelector('[data-conversation-session=alpha]').dataset.conversationSession='gamma')
  await page.waitForTimeout(400);assert.equal(await page.locator('.dcb-find').count(),0);assert.deepEqual(await matches(),[])
  await page.evaluate(()=>{document.querySelector('[data-conversation-session=gamma]').dataset.conversationSession='alpha';getSelection().removeAllRanges()})
 })
 await check('native titles and session file addresses resolve without using abbreviated labels or external URLs',async()=>{
  assert.deepEqual(await page.evaluate(()=>parseTarget('inline')),{sessionId:'alpha',path:'D:\\synthetic\\settings.json'})
  for(const id of ['relative','user-ref','address'])assert.deepEqual(await page.evaluate(id=>parseTarget(id),id),{sessionId:'alpha',path:'reports/合成 报告.md'})
  for(const id of ['web','foreign','composer-file'])assert.equal(await page.evaluate(id=>parseTarget(id),id),null)
 })
 await check('inline file right-click reuses all card operations and preserves native left-click',async()=>{
  await context();assert.equal(await menu.getByRole('menuitem').count(),8)
  await menu.getByRole('menuitem',{name:'复制路径',exact:true}).click();await menu.getByRole('status').waitFor()
  assert.deepEqual(await page.evaluate(()=>actions.at(-1)),{kind:'onCopy',session:'alpha',path:'D:\\synthetic\\settings.json',name:undefined})
  await page.keyboard.press('Escape');await context();await menu.getByRole('menuitem',{name:'打开',exact:true}).click();await page.waitForTimeout(240)
  assert.deepEqual(await page.evaluate(()=>opened),['inline'])
  await page.locator('#inline').click();assert.deepEqual(await page.evaluate(()=>opened),['inline','inline'])
 })
 await check('open-with, rename and recycle use the same subviews, keyboard and confirmations',async()=>{
  await context('relative');await menu.getByRole('menuitem',{name:'打开方式',exact:true}).click();await menu.getByRole('menuitem',{name:/Synthetic Editor/}).click();await page.waitForTimeout(220)
  assert.equal(await page.evaluate(()=>actions.at(-1).kind),'onOpenWithApplication')
  await context();await menu.getByRole('menuitem',{name:'重命名',exact:true}).click();await menu.getByRole('textbox',{name:'新文件名'}).fill('renamed.json');await menu.getByRole('button',{name:'重命名',exact:true}).click();await page.waitForTimeout(220)
  assert.equal(await page.evaluate(()=>actions.at(-1).name),'renamed.json')
  await context();await menu.getByRole('menuitem',{name:'删除',exact:true}).click();assert.equal(await page.evaluate(()=>actions.at(-1).kind),'onRename')
  await menu.getByRole('button',{name:'移到回收站',exact:true}).click();await page.waitForTimeout(220);assert.equal(await page.evaluate(()=>actions.at(-1).kind),'onDelete')
 })
 await check('menu errors remain readable, outside click animates exit, dark/narrow layouts stay in view',async()=>{
  await page.evaluate(()=>window.fail=true);await context();await menu.getByRole('menuitem',{name:'复制文件',exact:true}).click();await menu.getByRole('status').waitFor();assert.match(await menu.textContent(),/合成操作失败/)
  await page.locator('header > span').click();await page.waitForTimeout(65)
  assert.ok(await page.locator('.dcb-file-context-menu').evaluate(node=>+getComputedStyle(node).opacity)<1)
  await page.waitForTimeout(200);await page.evaluate(()=>{window.fail=false;document.body.setAttribute('data-ds-dark-theme','')})
  await page.setViewportSize({width:420,height:760});await page.getByRole('button',{name:'搜索当前会话',exact:true}).click();await query('关键词');await page.waitForTimeout(250)
  const box=await bar.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=420)
  await page.screenshot({path:resolve(out,'session-search-dark.png')})
  await page.keyboard.press('Escape');await context();await page.waitForTimeout(250);await page.screenshot({path:resolve(out,'inline-file-context-dark.png')});await page.keyboard.press('Escape')
 })
 await check('reduced motion, disabling, modal exclusion and disposal release controls and listeners',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'搜索当前会话',exact:true}).click();await query('关键词');await page.keyboard.press('Escape');assert.equal(await page.locator('.dcb-find').count(),0)
  await page.evaluate(()=>manager.setEnabled(false));await page.keyboard.press('Control+f');assert.equal(await page.locator('.dcb-find').count(),0)
  await page.evaluate(()=>{manager.setEnabled(true);const modal=document.createElement('div');modal.setAttribute('role','dialog');modal.innerHTML='<input id="modal-field">';document.body.append(modal);modal.querySelector('input').focus()});await page.keyboard.press('Control+f');assert.equal(await page.locator('.dcb-find').count(),0)
  await page.evaluate(()=>{document.querySelector('[role=dialog]').remove();manager.open('alpha')});await query('关键词');await page.evaluate(()=>dispose());assert.equal(await page.locator('.dcb-find,.dcb-file-context-menu').count(),0);assert.deepEqual(await matches(),[])
  await page.keyboard.press('Control+f');assert.equal(await page.locator('.dcb-find').count(),0)
 })
 assert.deepEqual(errors,[])
 writeFileSync(resolve(out,'validation.json'),JSON.stringify({checks,errors},null,2)+'\n')
 console.log(JSON.stringify({passed:checks.length,errors,output:out}))
}finally{await browser.close();server.close()}
