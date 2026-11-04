import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {sha256,createPresetZip,inspectPresetZip} from '../src/preset-package.js'

const root=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/dsh-ui-beautify'),'preset-market')
mkdirSync(output,{recursive:true})
const fixture=await build({entryPoints:[resolve(root,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const portal=await build({stdin:{contents:"import {createPortal} from 'react-dom';window.fixtureCreatePortal=createPortal",resolveDir:root},bundle:true,write:false,format:'iife'})
const config=new Blob([JSON.stringify({format:'dsh-ui-beautify-config',version:1,scope:'sidebar',settings:{sidebarStyle:'glass',sidebarMotion:true,sidebarOverlay:false}})])
const metadata={format:'dsh-ui-preset',schemaVersion:1,id:'community-sidebar',version:'1.0.0',title:'社区磨砂侧栏',description:'仅替换侧栏样式的测试投稿。',author:'demo-author',scope:'sidebar',tags:['侧栏','简约'],license:'MIT',configSha256:await sha256(config)}
const archive=await createPresetZip(new Map([['manifest.json',new Blob([JSON.stringify(metadata)])],['config.dshui',config]]))
const catalog={...JSON.parse(readFileSync(resolve(root,'market/catalog.json'),'utf8'))}
catalog.presets.push({...metadata,source:'community',archiveUrl:'https://github.com/AumiSatori/dsh-ui-beautify/releases/download/preset-community-sidebar-v1.0.0/community-sidebar-1.0.0.zip',sha256:await sha256(archive)})
let offline=false,corrupt=false
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(root,'test/fixture.html'))],'/fixture.js':['text/javascript',fixture.outputFiles[0].text+portal.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'))]}
const server=createServer(async(req,res)=>{
  const path=req.url.split('?')[0]
  if(path==='/dsh-ui-beautify/preset-market/catalog'){res.writeHead(offline?503:200,{'Content-Type':'application/json'}).end(JSON.stringify(offline?{error:'offline'}:catalog));return}
  if(path==='/dsh-ui-beautify/preset-market/package'){res.writeHead(200,{'Content-Type':'application/zip'}).end(corrupt?'corrupted package':Buffer.from(await archive.arrayBuffer()));return}
  const route=routes[path];res.writeHead(route?200:404,{'Content-Type':route?.[0]||'text/plain'}).end(route?.[1]||'')
})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1100},acceptDownloads:true}),errors=[],checks=[]
page.on('pageerror',error=>errors.push(error.message))
for(const pattern of ['https://raw.githubusercontent.com/AumiSatori/dsh-ui-beautify/**','https://cdn.jsdelivr.net/gh/AumiSatori/dsh-ui-beautify**'])await page.route(pattern,route=>route.fulfill({status:offline?503:200,json:offline?{}:catalog}))
const url=`http://127.0.0.1:${server.address().port}/`,KEY='dsh-ui-beautify:settings:v1',WIDTH='dsh-ui-beautify:conversation-width:v1'
const market=()=>page.getByRole('region',{name:'预设市场',exact:true}),cards=()=>market().locator('.dcb-market-card'),dialog=()=>page.getByRole('dialog',{name:/^预设详情/}),wait=ms=>page.waitForTimeout(ms)
const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS '+name)}
async function waitCards(count){await wait(30);await page.waitForFunction(count=>document.querySelectorAll('.dcb-market-card').length===count&&!document.getAnimations().some(a=>a.id.startsWith('dcb-market-results-')),count)}
async function snapshot(name){const size=page.viewportSize();await page.setViewportSize({width:size.width,height:1500});await page.locator('.settings-dialog').evaluate(el=>{el.scrollTop=0});await wait(100);await page.locator('.settings-dialog').screenshot({path:resolve(output,name)});await page.setViewportSize(size)}
async function boot(){
  await page.goto(url+'?composer');await page.getByTestId('todo-panel').waitFor()
  await page.evaluate(KEY=>{if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify({composerStyle:'clear',sidebarStyle:'milk',welcomeEnabled:false,particleEnabled:false,runningAnimationEnabled:false}));window.cleanups=[];window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true;window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>window.fixtureReact.createElement('span',null,'◒')}:name==='react-dom'?{createPortal:window.fixtureCreatePortal}:window.fixtureReact)}},KEY)
  await page.addScriptTag({url:url+'client.js'})
  await page.evaluate(()=>{const ctx={slots:{inject(_n,cb){cb()},register(s,c){if(s.name==='settings.section')window.fixtureSettings=c;else{window.fixtureHeader=c;window.fixtureHeaderSpec=s}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_n,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh();window.fixture.settings(true)})
  await page.addStyleTag({content:'.settings-dialog{inset:20px 6%;padding:24px;overflow:auto}.dcb-settings{min-width:0}'});
  await page.getByRole('tab',{name:'预设市场',exact:true}).click();await market().waitFor();await wait(650)
}
async function select(title){await market().getByRole('button',{name:'查看预设 '+title,exact:true}).click();await dialog().getByRole('button',{name:'应用预设',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.dcb-market-modal [data-primary]')?.disabled)}
async function resetFilters(){for(const [group,name] of [['预设类型','全部'],['预设来源','全部来源']])await market().getByRole('group',{name:group,exact:true}).getByRole('button',{name,exact:true}).click();await market().getByRole('textbox',{name:'搜索市场预设'}).fill('');await waitCards(6)}
try{
  await boot()
  await check('market is integrated into settings, with official and reviewed community cards and no native selectors',async()=>{
    assert.equal(await cards().count(),6);assert.equal(await market().getByText('社区 · 已审核',{exact:true}).count(),1)
    assert.equal(await page.locator('select,input[type=checkbox],input[type=radio],input[type=range]').count(),0)
    const geometry=await cards().evaluateAll(nodes=>nodes.map(n=>({top:n.getBoundingClientRect().top,bottom:n.getBoundingClientRect().bottom,margin:getComputedStyle(n).marginTop})))
    assert.ok(geometry.every(n=>n.margin==='0px'));assert.ok(geometry[3].top-geometry[0].bottom<20)
    await snapshot('discover-light.png')
  })
  await check('whole sets, component categories, source and keyword filters compose correctly',async()=>{
    await market().getByRole('group',{name:'预设类型',exact:true}).getByRole('button',{name:'整套预设',exact:true}).click();await waitCards(2);assert.equal(await cards().count(),2)
    await market().getByRole('group',{name:'预设类型',exact:true}).getByRole('button',{name:'单项预设',exact:true}).click();await waitCards(4);assert.equal(await cards().count(),4)
    await market().getByRole('group',{name:'预设分类',exact:true}).getByRole('button',{name:'侧栏',exact:true}).click();await waitCards(2);assert.equal(await cards().count(),2)
    await market().getByRole('group',{name:'预设来源',exact:true}).getByRole('button',{name:'社区',exact:true}).click();await waitCards(1);assert.equal(await cards().count(),1)
    await market().getByRole('textbox',{name:'搜索市场预设'}).fill('没有这个预设');await waitCards(0);assert.equal(await cards().count(),0)
    await resetFilters()
  })
  await check('filter changes animate real list height and blur, then release all measured sizes',async()=>{
    const original=await market().locator('.dcb-market-grid').evaluate(el=>el.getBoundingClientRect().height)
    await market().getByRole('group',{name:'预设类型',exact:true}).getByRole('button',{name:'整套预设',exact:true}).click()
    await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='dcb-market-results-enter'&&a.playState==='running'))
    await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id==='dcb-market-results-enter'){a.pause();a.currentTime=100}})
    const mid=await market().locator('.dcb-market-grid').evaluate(el=>({height:el.getBoundingClientRect().height,filter:getComputedStyle(el).filter,opacity:+getComputedStyle(el).opacity}))
    assert.ok(mid.height>0&&mid.height<original);assert.ok(parseFloat(mid.filter.slice(5))>0&&parseFloat(mid.filter.slice(5))<3);assert.ok(mid.opacity>0&&mid.opacity<1)
    await page.screenshot({path:resolve(output,'filter-midframe.png')})
    await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id==='dcb-market-results-enter')a.play()});await wait(350)
    assert.equal(await market().locator('.dcb-market-grid').getAttribute('style'),'')
    await resetFilters()
  })
  await check('downloaded component previews can save locally, apply only their scope and undo',async()=>{
    await page.evaluate(WIDTH=>{localStorage.setItem(WIDTH,JSON.stringify({version:1,window:980,fullscreen:1400}));window.dispatchEvent(new StorageEvent('storage',{key:WIDTH}))},WIDTH)
    await select('社区磨砂侧栏');assert.match(await dialog().innerText(),/其他分类和聊天宽度保持不变/)
    await dialog().getByRole('button',{name:'保存到本机预设',exact:true}).click();await dialog().getByText('已保存到本机预设，可在「全局配置」中切换。',{exact:true}).waitFor()
    const composer=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).composerStyle,KEY)
    await dialog().getByRole('button',{name:'应用预设',exact:true}).click();await page.waitForFunction(KEY=>JSON.parse(localStorage.getItem(KEY)).sidebarStyle==='glass',KEY)
    assert.equal(await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).composerStyle,KEY),composer)
    assert.equal(await page.evaluate(WIDTH=>JSON.parse(localStorage.getItem(WIDTH)).window,WIDTH),980)
    await market().getByRole('button',{name:'撤销本次应用',exact:true}).waitFor()
    await page.getByRole('tab',{name:'全局配置',exact:true}).click();await page.getByRole('button',{name:'切换到 社区磨砂侧栏',exact:true}).waitFor()
    await page.getByRole('button',{name:'撤销上次应用',exact:true}).click();await page.waitForFunction(KEY=>JSON.parse(localStorage.getItem(KEY)).sidebarStyle==='milk',KEY)
    await page.getByRole('tab',{name:'预设市场',exact:true}).click();await wait(600)
  })
  await check('whole-set application replaces the full normalized configuration',async()=>{
    await select('轻雾玻璃');await dialog().getByRole('button',{name:'应用预设',exact:true}).click()
    await page.waitForFunction(KEY=>JSON.parse(localStorage.getItem(KEY)).composerStyle==='css',KEY)
    assert.equal(await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).cardStyle,KEY),'css')
    assert.equal(await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).particleEnabled,KEY),false)
    await wait(600)
  })
  await check('corrupted package cannot be applied; Escape closes and restores focus',async()=>{
    corrupt=true;await market().getByRole('button',{name:'查看预设 社区磨砂侧栏',exact:true}).click();await dialog().getByRole('alert').waitFor()
    assert.match(await dialog().getByRole('alert').innerText(),/校验/)
    assert.equal(await dialog().getByRole('button',{name:'应用预设',exact:true}).isDisabled(),true)
    await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='关闭预设详情')
    await page.keyboard.press('Escape');await wait(300);assert.equal(await dialog().count(),0)
    assert.equal(await market().getByRole('button',{name:'查看预设 社区磨砂侧栏',exact:true}).evaluate(el=>el===document.activeElement),true);corrupt=false
  })
  await check('upload flow exports a classified package and offers a GitHub submission link without auto-publishing',async()=>{
    await market().getByRole('tab',{name:'投稿',exact:true}).click();await wait(300)
    for(const [label,value] of [['预设名称','测试侧栏'],['作者名称','demo-author'],['预设 ID','test-sidebar'],['版本号','1.0.0']])await market().getByLabel(label,{exact:true}).fill(value)
    await market().getByLabel('预设简介',{exact:true}).fill('A component preset created in the offline browser test.')
    await market().getByRole('group',{name:'投稿分类',exact:true}).getByRole('button',{name:'侧栏',exact:true}).click()
    assert.equal(await market().getByRole('button',{name:'导出投稿包',exact:true}).isDisabled(),true)
    await market().getByRole('switch',{name:'确认投稿内容与分享权限'}).click()
    const pending=page.waitForEvent('download');await market().getByRole('button',{name:'导出投稿包',exact:true}).click();const download=await pending
    const path=resolve(output,'test-sidebar-1.0.0.zip');await download.saveAs(path)
    const inspected=await inspectPresetZip(new Blob([readFileSync(path)]))
    assert.equal(inspected.meta.scope,'sidebar');assert.equal(Object.keys(inspected.data.settings).every(key=>key.startsWith('sidebar')),true);assert.equal(inspected.data.databases.length,0)
    const link=market().getByRole('link',{name:'打开 GitHub 投稿页',exact:true});await link.waitFor();assert.match(await link.getAttribute('href'),/preset-submission.yml/)
    assert.match(await market().innerText(),/审核通过才会出现在市场/)
    await snapshot('submission.png')
    await market().getByRole('tab',{name:'发现',exact:true}).click();await wait(300)
  })
  await check('cached and bundled catalogs remain browsable during network failures',async()=>{
    offline=true;await market().getByRole('button',{name:'刷新预设市场'}).click();await market().getByText('网络暂不可用，正在显示最近一次目录。',{exact:true}).waitFor();await wait(500);assert.equal(await cards().count(),6)
    await page.evaluate(()=>localStorage.removeItem('dsh-ui-beautify:market-cache:v1'));await market().getByRole('button',{name:'刷新预设市场'}).click();await market().getByText('网络暂不可用，先显示随插件提供的官方预设。',{exact:true}).waitFor();await wait(500);assert.equal(await cards().count(),5)
    offline=false;await market().getByRole('button',{name:'刷新预设市场'}).click();await wait(650)
  })
  await check('dark, narrow, keyboard and reduced-motion modes remain usable without overflow',async()=>{
    await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await snapshot('discover-dark.png')
    await page.setViewportSize({width:420,height:1000});await page.addStyleTag({content:'.settings-dialog{inset:6px!important;padding:12px!important}'})
    await wait(150);assert.equal(await market().evaluate(el=>el.scrollWidth>el.clientWidth+1),false);await market().screenshot({path:resolve(output,'discover-narrow.png')})
    await market().getByRole('tab',{name:'发现',exact:true}).focus();await page.keyboard.press('ArrowRight');assert.equal(await market().getByRole('tab',{name:'投稿',exact:true}).getAttribute('aria-selected'),'true')
    await wait(300);assert.equal(await market().evaluate(el=>el.scrollWidth>el.clientWidth+1),false)
    await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});assert.equal(await market().locator('.dcb-market-tabs button').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s')
    assert.equal(await page.locator('select,input[type=checkbox],input[type=radio],input[type=range]').count(),0)
  })
  assert.deepEqual(errors,[]);writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
