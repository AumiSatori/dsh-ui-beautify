import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/ui-beautify-044'),'output-copy')
mkdirSync(out,{recursive:true})
const built=await build({stdin:{resolveDir:root,contents:`
import React from 'react';import{createRoot}from'react-dom/client';import{createPortal}from'react-dom';import{createOutputViewer,outputViewerCss,outputKind}from'./src/output-viewer.js';
document.head.append(Object.assign(document.createElement('style'),{textContent:outputViewerCss}));
window.writes=[];window.payloads={};window.readDelay=0;window.readError=false;
window.manager=createOutputViewer(React,document,window,{createPortal});
createRoot(document.getElementById('app')).render(React.createElement(window.manager.View,{sessionId:'synthetic'}));
window.openFile=path=>manager.open({sessionId:'synthetic',path,read:async()=>{if(window.readDelay)await new Promise(done=>setTimeout(done,readDelay));if(readError)throw Error('synthetic read error');const type=outputKind(path),text=payloads[path]??'';return type.kind==='image'||type.kind==='video'?{...type,size:1,bytes:new Uint8Array([0])}:{...type,size:new TextEncoder().encode(text).length,text}}});
`,loader:'js'},bundle:true,write:false,format:'iife'})
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':req.url==='/fixture.js'?'text/javascript':'text/html; charset=utf-8'});res.end(req.url==='/fixture.js'?built.outputFiles[0].text:'<!doctype html><div id="app"></div><script src="/fixture.js"></script>')})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[],checks=[]
page.on('pageerror',e=>errors.push(e.message))
const viewer=page.getByRole('region',{name:'文件预览',exact:true}),button=()=>viewer.getByRole('button',{name:/^复制全文$|^复制源码$/})
async function open(path,text=''){await page.evaluate(({path,text})=>{payloads[path]=text;openFile(path)},{path,text});await viewer.locator('[data-content-status=ready]').waitFor();await page.waitForTimeout(300)}
async function clipboard(mode='success'){
 await page.evaluate(mode=>{window.writes=[];window.copyResolve=null;Object.defineProperty(navigator,'clipboard',{configurable:true,value:mode==='fallback'?undefined:{writeText:text=>{writes.push(text);return mode==='reject'?Promise.reject(Error('denied')):mode==='pending'?new Promise(resolve=>copyResolve=resolve):Promise.resolve()}}});document.execCommand=()=>false},mode)
}
async function check(name,run){await run();checks.push(name);console.log('PASS '+name)}
try{
 await page.goto('http://127.0.0.1:'+server.address().port)
 await check('SQL and plain text copy the complete original content, preserving Unicode, whitespace and empty files',async()=>{
  for(const [path,text]of [['query.sql','-- 合成 SQL\r\nSELECT \'鲸鱼\' AS label;\r\n\r\n'],['full.txt','  原始文本\n\t保留缩进\n'.repeat(120)],['empty.txt','']]){
   await clipboard();await open(path,text);const scroll=await viewer.locator('.dcb-file-viewer-body').evaluate(el=>{el.scrollTop=180;return el.scrollTop});await button().click();await viewer.getByRole('status').filter({hasText:'已复制全文'}).waitFor();assert.deepEqual(await page.evaluate(()=>writes),[text]);assert.equal(await button().innerText(),'已复制');assert.equal(await viewer.locator('.dcb-file-viewer-body').evaluate(el=>el.scrollTop),scroll)
  }
 })
 await check('formatted JSON, Markdown, HTML source and a truncated CSV preview still copy the original whole file',async()=>{
  for(const [path,text]of [['data.json','{"compact":true,"n":2}\n'],['report.md','# 标题\n\n**原始内容**\n'],['page.html','<!doctype html><p>合成页面</p>'],['table.csv','name,value\n'+Array.from({length:550},(_,i)=>'row'+i+','+i).join('\n')]]){
   await clipboard();await open(path,text);if(path.endsWith('.json'))assert.notEqual(await viewer.locator('pre').innerText(),text);if(path.endsWith('.csv'))assert.equal(await viewer.getByText('仅显示前 500 行。').count(),1)
   await button().click();await viewer.getByRole('status').waitFor();assert.deepEqual(await page.evaluate(()=>writes),[text])
  }
 })
 await check('loading and read failures disable copying, and media previews have no text copy button',async()=>{
  await clipboard();await page.evaluate(()=>{readDelay=160;openFile('slow.sql')});await viewer.locator('[data-content-status=loading]').waitFor();assert.equal(await button().isDisabled(),true);assert.deepEqual(await page.evaluate(()=>writes),[]);await viewer.locator('[data-content-status=ready]').waitFor();await page.evaluate(()=>{readDelay=0;readError=true;openFile('bad.sql')});await viewer.getByRole('alert').waitFor();assert.equal(await button().isDisabled(),true);await page.evaluate(()=>readError=false)
  for(const path of ['frame.png','clip.mp4']){await open(path);assert.equal(await button().count(),0)}
 })
 await check('older clipboard fallback restores the focused control and removes its temporary textarea',async()=>{
  await clipboard('fallback');await open('legacy.txt','合成内容\n完整复制');await page.evaluate(()=>{window.fallbackWrites=[];document.execCommand=kind=>{fallbackWrites.push({kind,value:document.activeElement.value});return true}});await button().focus();await page.keyboard.press('Enter');await viewer.getByRole('status').waitFor();assert.deepEqual(await page.evaluate(()=>fallbackWrites),[{kind:'copy',value:'合成内容\n完整复制'}]);assert.equal(await button().evaluate(el=>document.activeElement===el),true);assert.equal(await page.locator('textarea').count(),0)
 })
 await check('denied clipboard access reports failure and remains retryable without a false success',async()=>{
  await clipboard('reject');await open('retry.sql','SELECT 2;');await button().click();await viewer.getByRole('alert').filter({hasText:'复制失败'}).waitFor();assert.equal(await button().innerText(),'重试复制');assert.equal(await viewer.getByText('已复制全文',{exact:true}).count(),0);assert.equal(await page.locator('textarea').count(),0);await clipboard();await button().click();await viewer.getByRole('status').waitFor();assert.deepEqual(await page.evaluate(()=>writes),['SELECT 2;'])
 })
 await check('late clipboard completion cannot mark another file as copied, and closing releases feedback',async()=>{
  await clipboard('pending');await open('old.sql','SELECT 3;');await button().click();assert.equal(await button().innerText(),'复制中');await open('new.sql','SELECT 4;');await page.evaluate(()=>copyResolve());await page.waitForTimeout(30);assert.equal(await viewer.getByText('已复制全文',{exact:true}).count(),0);assert.equal(await button().innerText(),'复制');await clipboard();await button().click();await viewer.getByRole('status').waitFor();await page.waitForFunction(()=>document.querySelector('.dcb-file-copy')?.dataset.copyState==='idle');assert.equal(await button().innerText(),'复制');await button().click();await viewer.getByRole('status').waitFor();await viewer.getByRole('button',{name:'关闭文件预览'}).click();await viewer.waitFor({state:'detached'});await open('new.sql','SELECT 4;');assert.equal(await button().innerText(),'复制')
 })
 await check('dark narrow layout keeps copying reachable, keyboard activation works, and quiet preferences suppress feedback animation',async()=>{
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.emulateMedia({reducedMotion:'reduce'});await clipboard();await open('mobile.sql','SELECT 5;');await button().focus();await page.keyboard.press('Enter');await viewer.getByRole('status').waitFor();assert.deepEqual(await page.evaluate(()=>writes),['SELECT 5;']);assert.ok((await button().boundingBox()).height>=44);assert.equal(await viewer.evaluate(el=>el.scrollWidth>el.clientWidth+1),false);assert.equal(await button().locator('svg').evaluate(el=>getComputedStyle(el).animationName),'none');await viewer.screenshot({path:resolve(out,'copy-narrow-dark.png')})
 })
 assert.deepEqual(errors,[]);writeFileSync(resolve(out,'verification.json'),JSON.stringify({checks,errors},null,2)+'\n')
}finally{await browser.close();await new Promise(done=>server.close(done))}
