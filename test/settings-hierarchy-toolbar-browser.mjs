import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createServer} from 'node:http'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {selectSettingsCategory} from './settings-navigation.mjs'
import {normalizeToolbar,toolbarDefaultOrder} from '../src/toolbar-settings.js'

assert.deepEqual(normalizeToolbar({order:['summary','invalid','summary'],hidden:['focus','invalid','focus']}),{order:['summary',...toolbarDefaultOrder.filter(id=>id!=='summary')],hidden:['focus']})
const project=fileURLToPath(new URL('..',import.meta.url)),fixture=readFileSync(resolve(project,'test/fixture.jsx'),'utf8'),from=fixture.indexOf('<main><header '),to=fixture.indexOf('</header>',from)
const header='<main><header className="cr_header"><div className="cr_headerLeading"/><div className="cr_titleRow"><div className="cr_titleCluster">演示会话标题</div><div className="cr_headerUtilities"><button aria-label="更多操作">⋯</button></div><div className="cr_headerCorner"><button aria-label="打开右侧边栏">侧栏</button></div></div><nav data-conversation-tabs=""><button>对话</button></nav></header>'
const source=fixture.slice(0,from)+header+fixture.slice(to+'</header>'.length),built=await build({stdin:{contents:source,loader:'jsx',resolveDir:resolve(project,'test')},bundle:true,write:false,format:'iife'})
const html=readFileSync(resolve(project,'test/fixture.html'),'utf8').replace('</style>',`.cr_header{height:auto;min-height:90px}.cr_headerUtilities button,.cr_headerCorner button{min-height:30px;padding:4px 8px}.settings-dialog{inset:30px 6%;padding:24px}.dcb-settings-hero h1{margin:0}</style>`)
const routes={'/':['text/html; charset=utf-8',html],'/fixture.js':['text/javascript',built.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]},server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1000}}),url=`http://127.0.0.1:${server.address().port}`
const settle=()=>page.waitForFunction(()=>!document.getAnimations().some(animation=>animation.id==='dcb-settings-tab')),select=name=>selectSettingsCategory(page,name)
try{
  await page.goto(url);await page.getByTestId('todo-panel').waitFor();await page.evaluate(()=>{window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}})
  await page.addScriptTag({url:url+'/client.js'});await page.evaluate(()=>{const ctx={theme:{getTheme:()=>({active:{colorScheme:'light'}})},slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;return()=>{} }},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
  await page.evaluate(()=>window.fixture.settings(true));await select('任务面板')
  assert.deepEqual(await page.getByRole('tablist',{name:'美化设置分组'}).getByRole('tab').allTextContents(),['全局布局','对话布局'])
  for(const [group,sections]of [['全局布局',[['界面布局',['输入栏','侧栏','右上工具栏']],['背景与欢迎',['开屏欢迎','全图背景','粒子背景']]]],['对话布局',[['任务面板',['任务面板']],['动效与反馈',['思考动图','对话动效']]]]]){
    await page.getByRole('tab',{name:group,exact:true}).click()
    for(const [label,children]of sections){assert.deepEqual(await page.getByRole('tablist',{name:label+'选项'}).getByRole('tab').allTextContents(),children);await select(children.at(-1))}
    await settle();assert.equal(await page.locator('.dcb-settings-tab-page').count(),1)
  }
  await page.getByRole('tab',{name:'全局布局',exact:true}).click();await select('输入栏');await page.getByRole('tab',{name:'侧栏',exact:true}).press('End');await select('右上工具栏');await settle();assert.equal(await page.locator('.dcb-settings-tab-stage').getAttribute('data-state'),'idle')
  console.log(JSON.stringify({passed:3,checks:['parent groups','parallel secondary bars','keyboard navigation']}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
