import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const root=fileURLToPath(new URL('..',import.meta.url))
const fixture=await build({entryPoints:[resolve(root,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html',readFileSync(resolve(root,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url.split('?')[0]];res.writeHead(route?200:404,{'Content-Type':(route?.[0]||'text/plain')+'; charset=utf-8'});res.end(route?.[1]||'')});await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}/`,KEY='dsh-ui-beautify:settings:v1'
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[]
page.on('pageerror',error=>errors.push(error.message))
async function benchmark(glass, particles){
  await page.goto(url+'?composer')
  await page.getByTestId('todo-panel').waitFor()
  await page.evaluate(({KEY,glass,particles})=>{
    localStorage.setItem(KEY,JSON.stringify({
      iconStyle:'native', composerStyle:glass?'css':'milk', composerButtonGlass:false, chatUnderComposer:false,
      particleEnabled:particles, particleShape:'whale', particleProgressMode:'manual', particleManualProgress:50,
      welcomeEnabled:false, enabled:false, sidebarOverlay:false, messageMotion:false,
    }))
    window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true
    window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(()=>window.fixtureReact)}
  },{KEY,glass,particles})
  await page.addScriptTag({url:url+'client.js'})
  await page.evaluate(()=>{
    const ctx={slots:{inject(_name,cb){cb()},register(spec,c){
      if(spec.name==='settings.section')window.fixtureSettings=c
      else {window.fixtureHeader=c;window.fixtureHeaderSpec=spec}
      return ()=>{}
    }},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},
      effect(cb){cb()},inject(_name,cb){cb(ctx)}}
    window.plugin.apply(ctx)
    window.fixture.history({rail:false,turns:Array.from({length:100},(_,i)=>({turn:i+1}))})
    window.fixture.refresh()
  })
  await page.locator('[data-chat-turn]').last().waitFor({state:'attached'})
  if(glass)await page.locator('[data-dcb-composer-style=css]').first().waitFor()
  if(particles)await page.locator('.dcb-particle-layer:not([data-waiting]) canvas').first().waitFor()
  await page.waitForTimeout(500)
  const scene=await page.evaluate(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot())
  assert.equal(scene.scenes.length,particles?1:0)
  const rows=[]
  for(const phase of ['scroll','sidebar-resize']){
    const result=await page.evaluate(async phase=>{
      const scroll=document.querySelector('[data-conversation-scroll]'), frame=document.querySelector('.frame')
      const intervals=[]
      let previous
      for(let i=0;i<150;i++){
        const now=await new Promise(requestAnimationFrame)
        if(i>=30)intervals.push(now-previous)
        previous=now
        if(phase==='scroll')scroll.scrollTop=800+i*18
        else frame.style.gridTemplateColumns=(220+Math.round(100*Math.sin(i/16)))+'px 1fr'
      }
      if(scroll.scrollTop===0)throw Error('长会话未滚动')
      intervals.sort((a,b)=>a-b)
      const p=q=>Number(intervals[Math.ceil(intervals.length*q)-1].toFixed(1))
      return {p50:p(.5),p95:p(.95),p99:p(.99),max:p(1)}
    },phase)
    rows.push({glass,particles,renderer:scene.scenes[0]?.mode??null,phase,...result})
  }
  return rows
}
try{
  for(const [glass,particles] of [[false,false],[true,false],[false,true],[true,true]]){
    for(const row of await benchmark(glass,particles))console.log(JSON.stringify(row))
  }
  assert.deepEqual(errors,[])
}finally{await browser.close();await new Promise(done=>server.close(done))}
