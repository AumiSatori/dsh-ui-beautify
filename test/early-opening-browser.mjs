import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium,expect} from '@playwright/test'
import {earlyOpeningHtml} from '../scripts/early-opening-patch.mjs'
const root=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/dsh-ui-beautify'),'early-opening');mkdirSync(output,{recursive:true})
const helper=await build({stdin:{contents:"export {createStartupMotion} from './src/startup-motion.js'",resolveDir:root},bundle:true,write:false,format:'iife',globalName:'Opening'})
const native=`const root=document.getElementById('root');root.innerHTML='<div data-dsh-boot><div class="card"><div>HARNESS</div><div data-dsh-boot-spinner>◌</div><p>Loading plugins…</p></div></div>';`
const html=earlyOpeningHtml(`<!doctype html><meta charset="utf-8"><style>body{margin:0;font:16px system-ui;background:#fafbfc}[data-dsh-boot]{position:fixed;inset:0;display:grid;place-items:center;z-index:2147483647;background:#fafbfc}.card{text-align:center}</style><script type="module" src="/native.js"></script><body><div id="root"></div><script src="/helper.js"></script></body>`,readFileSync(resolve(root,'assets/early-opening.js'),'utf8'))
const routes={'/setup':['text/html','<body>setup</body>'],'/start':['text/html; charset=utf-8',html],'/early.js':['text/javascript',readFileSync(resolve(root,'assets/early-opening.js'))],'/helper.js':['text/javascript',helper.outputFiles[0].text],'/native.js':['text/javascript',native]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route)return res.writeHead(404).end();res.writeHead(200,{'content-type':route[0]}).end(route[1])});await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),checks=[],errors=[]
async function boot({enabled=true,mode='code',interactive=true,dark=false}={}){
  const context=await browser.newContext({viewport:{width:1100,height:760}}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(url+'/setup')
  await page.evaluate(async({enabled,mode,interactive,dark})=>{
    const settings={welcomeEnabled:enabled,welcomeMode:mode,welcomeDuration:900,welcomeCodeInteractive:interactive,welcomeCodeDuration:1000,welcomeCodeModes:{timed:{revision:'timed',name:'Timed'},interactive:{revision:'interactive',name:'Interactive'}}}
    localStorage.setItem('dsh-ui-beautify:settings:v1',JSON.stringify(settings));localStorage.setItem('dsh-ui-beautify:opening-theme:v1',dark?'dark':'light');localStorage.setItem('dsh-ui-beautify:opening-logo:v1',JSON.stringify({viewBox:'0 0 120 90',path:'M5 35Q40 5 85 35L115 15L108 50Q50 90 5 35Z'}))
    await new Promise((resolve,reject)=>{const request=indexedDB.open('dsh-ui-beautify-welcome-code',1);request.onupgradeneeded=()=>request.result.createObjectStore('opening');request.onerror=reject;request.onsuccess=()=>{const db=request.result,tx=db.transaction('opening','readwrite'),store=tx.objectStore('opening');for(const name of ['timed','interactive'])store.put({revision:name,name,source:`<style>body{display:grid;place-items:center;background:var(--dsh-welcome-background);font:24px system-ui}button{font:inherit;padding:12px}</style><main>${name}<button onclick="window.dshWelcomeDone()">进入</button></main>`},'asset:'+name);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=reject}})
  },{enabled,mode,interactive,dark});await page.goto(url+'/start');await page.locator('[data-dsh-boot]').waitFor({state:'attached'});return{context,page}
}
async function check(name,run){await run();checks.push(name);console.log('PASS '+name)}
try{
  await check('the early interactive opening replaces Loading before normal plugin activation and the plugin adopts the same iframe',async()=>{
    const{context,page}=await boot({dark:true});try{
      const frame=page.frameLocator('[data-dcb-welcome] iframe');await expect(frame.locator('main')).toContainText('interactive');await expect(page.locator('[data-dsh-boot]')).toBeHidden();await expect(page.locator('body')).toHaveAttribute('data-ds-dark-theme','')
      await page.evaluate(()=>window.originalFrame=document.querySelector('[data-dcb-welcome] iframe'));await page.clock.install();await page.clock.fastForward(31000);await expect(page.locator('[data-dcb-welcome]')).toHaveCount(1)
      await page.screenshot({path:resolve(output,'direct-interactive-opening.png')})
      assert.equal(await page.evaluate(()=>Opening.createStartupMotion(document,window,{welcomeEnabled:true})===window[Symbol.for('dsh-ui-beautify.early-opening.v1')]),true)
      assert.equal(await page.evaluate(()=>window.originalFrame===document.querySelector('[data-dcb-welcome] iframe')),true);await page.locator('[data-dsh-boot]').evaluate(el=>el.remove())
      await frame.getByRole('button',{name:'进入',exact:true}).click();await page.waitForFunction(()=>document.documentElement.getAttribute('data-dcb-startup-stage')==='revealing');await page.clock.fastForward(10000);await expect(page.locator('[data-dcb-welcome]')).toHaveCount(0);await expect(page.locator('body')).not.toHaveAttribute('data-dcb-early-opening','')
    }finally{await context.close()}
  })
  await check('timed code and a completed character animation stay in front until the host can adopt them',async()=>{
    for(const mode of ['code','characters']){const{context,page}=await boot({mode,interactive:false});try{
      await page.locator('[data-dcb-welcome]').waitFor();if(mode==='code')await expect(page.frameLocator('[data-dcb-welcome] iframe').locator('main')).toContainText('timed')
      await page.clock.install();await page.clock.fastForward(2200);await expect(page.locator('[data-dcb-welcome]')).toHaveCount(1);await expect(page.locator('[data-dsh-boot]')).toBeHidden()
      await page.evaluate(()=>Opening.createStartupMotion(document,window,{welcomeEnabled:true}));await page.waitForFunction(()=>document.documentElement.getAttribute('data-dcb-startup-stage')==='revealing');await page.clock.fastForward(10000);await expect(page.locator('[data-dcb-welcome]')).toHaveCount(0)
    }finally{await context.close()}}
  })
  await check('a host boot failure remains visible and releases the animation, its code, and its loading mask',async()=>{
    const{context,page}=await boot();try{
      await page.frameLocator('[data-dcb-welcome] iframe').locator('main').waitFor();await page.locator('[data-dsh-boot]').evaluate(el=>el.innerHTML='<h2>Failed to load plugins</h2>')
      await expect(page.locator('[data-dcb-welcome]')).toHaveCount(0);await expect(page.getByText('Failed to load plugins',{exact:true})).toBeVisible();await expect(page.locator('body')).not.toHaveAttribute('data-dcb-early-opening','')
    }finally{await context.close()}
  })
  await check('disabled openings and reduced-motion settings leave host startup behavior available',async()=>{
    const{context,page}=await boot({enabled:false});try{await expect(page.locator('[data-dcb-welcome]')).toHaveCount(0);await expect(page.getByText('Loading plugins…',{exact:true})).toBeVisible()}finally{await context.close()}
    const other=await boot();try{await other.page.emulateMedia({reducedMotion:'reduce'});await expect(other.page.locator('[data-dcb-welcome]')).toHaveCount(0);await expect(other.page.locator('[data-dsh-boot]')).toBeVisible()}finally{await other.context.close()}
  })
  assert.deepEqual(errors,[]);writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors,scope:'Real early-opening bundle, browser storage and startup controller; synthetic host boot DOM'},null,2)+'\n');console.log(JSON.stringify({passed:checks.length,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
