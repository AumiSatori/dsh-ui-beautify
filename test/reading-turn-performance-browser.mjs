import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'../.scratch/ui-performance'),'reading-performance')
mkdirSync(output,{recursive:true})
const baseline=process.env.DSH_PERFORMANCE_BASELINE==='1'
const bundle=await build({entryPoints:[resolve(project,'src/reading-turn.js')],bundle:true,write:false,format:'iife',globalName:'Reading'})
let legacy=''
if(baseline){
  const ref=process.env.DSH_PERFORMANCE_BASE_REF||'v0.3.32'
  const source=execFileSync('git',['-c',`safe.directory=${project.replaceAll('\\','/').replace(/\/$/,'')}`,'show',`${ref}:client.js`],{cwd:project,encoding:'utf8',maxBuffer:4*1024*1024})
  legacy=source.slice(source.indexOf('function useReadingTurn('),source.indexOf('function useContextTransition('))
  assert.ok(legacy.includes('visible.findLast'),'Baseline must contain the original linear reader')
}
const browser=await chromium.launch({headless:true,channel:'chrome'})
const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[],evidence=[]
page.on('pageerror',e=>errors.push(e.message))
const tick=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))
try{
  await page.setContent(`<style>body,p{margin:0}main{height:800px;overflow:auto}article{height:120px;margin:0}article[hidden]{display:none}aside{height:20px;overflow:auto}</style><div data-conversation-content data-conversation-session=synthetic><main data-conversation-scroll><div data-chat-flow><div data-slot="conversation.chat.flow">${Array.from({length:600},(_,i)=>`<article data-chat-turn="${i}"><p>合成消息 ${i}</p></article>`).join('')}</div></div></main></div><aside><p style="height:500px">其他面板</p></aside>`)
  await page.addScriptTag({content:bundle.outputFiles[0].text})
  await page.evaluate(legacy=>{
    window.audit={rect:0,rectList:0};window.turn=null
    for(const [key,label]of [['getBoundingClientRect','rect'],['getClientRects','rectList']]){
      const fn=Element.prototype[key];Element.prototype[key]=function(...args){if(this.matches('[data-chat-turn]'))window.audit[label]++;return fn.apply(this,args)}
    }
    const onChange=turn=>window.turn=turn
    if(legacy){
      const React={useState:()=>[{sessionId:'synthetic',turn:null},update=>onChange(update({sessionId:'synthetic',turn:window.turn}).turn)],useLayoutEffect:fn=>window.stopReading=fn()}
      new Function('React',legacy+';useReadingTurn("synthetic",[],[])')(React)
    }else window.stopReading=Reading.observeReadingTurn(document,window,{sessionId:'synthetic',onChange})
  },legacy)
  await tick()
  for(const turn of [0,1,127,300,450,590]){
    await page.evaluate(turn=>{window.audit.rect=window.audit.rectList=0;const scroll=document.querySelector('main');scroll.scrollTop=turn*120;scroll.dispatchEvent(new Event('scroll'))},turn)
    await tick()
    const result=await page.evaluate(()=>({turn:window.turn,...window.audit}))
    assert.equal(result.turn,turn);evidence.push(result)
    if(!baseline){assert.equal(result.rectList,0);assert.ok(result.rect<=10,JSON.stringify(result))}
  }
  await page.evaluate(()=>{window.audit.rect=window.audit.rectList=0;document.querySelector('aside').dispatchEvent(new Event('scroll'))})
  await tick()
  const unrelated=await page.evaluate(()=>({...window.audit}))
  if(!baseline)assert.deepEqual(unrelated,{rect:0,rectList:0})
  evidence.push({phase:'unrelated panel scroll',...unrelated})
  await page.evaluate(()=>{
    window.audit.rect=window.audit.rectList=0
    const p=document.createElement('p');p.textContent='新增流式段落';document.querySelector('article:last-child').append(p)
  });await tick()
  const stream=await page.evaluate(()=>({...window.audit}))
  if(!baseline)assert.equal(stream.rectList,0)
  evidence.push({phase:'streaming paragraph append',...stream})
  if(!baseline){
    await page.evaluate(()=>{
      window.audit.rect=window.audit.rectList=0
      const probe=document.createElement('div');probe.setAttribute('data-dcb-sidebar-layout-probe','');probe.innerHTML='<div data-conversation-content data-conversation-session="synthetic"></div>'
      document.body.append(probe);probe.remove()
    });await tick()
    assert.deepEqual(await page.evaluate(()=>({...window.audit})),{rect:0,rectList:0},'sidebar layout probes do not invalidate the transcript index')
  }
  await page.evaluate(()=>{
    document.querySelector('main').scrollTop=300*120
    document.querySelector('article[data-chat-turn="300"]').hidden=true
    const rail=document.createElement('nav');rail.innerHTML='<button data-index=2 aria-current=true>轮次</button>';document.querySelector('[data-conversation-content]').prepend(rail)
  });await tick()
  assert.equal(await page.evaluate(()=>window.turn),2)
  await page.evaluate(()=>{document.querySelector('nav button').setAttribute('aria-current','false');document.querySelector('main').scrollTop=300*120});await tick()
  assert.equal(await page.evaluate(()=>window.turn),301)
  await page.evaluate(()=>document.querySelector('main').setAttribute('data-chat-following-tail',''));await tick()
  assert.equal(await page.evaluate(()=>window.turn),599)
  if(!baseline){
    await page.evaluate(()=>{
      const list=document.querySelector('[data-slot="conversation.chat.flow"]')
      list.insertAdjacentHTML('beforeend','<article data-chat-turn="600"><p>新增轮次</p></article>')
    });await tick()
    assert.equal(await page.evaluate(()=>window.turn),600)
    await page.evaluate(()=>{
      window.stopReading();document.querySelector('main').removeAttribute('data-chat-following-tail')
      document.querySelector('[data-chat-flow]').style.display='none'
      window.stopReading=Reading.observeReadingTurn(document,window,{sessionId:'synthetic',onChange:turn=>window.turn=turn})
    });await tick()
    assert.equal(await page.evaluate(()=>window.turn),null)
    await page.evaluate(()=>document.querySelector('[data-chat-flow]').style.display='');await tick()
    assert.notEqual(await page.evaluate(()=>window.turn),null,'an initially hidden view is indexed when its layout returns')
  }
  await page.evaluate(()=>{window.stopReading();window.audit.rect=window.audit.rectList=0;document.querySelector('main').dispatchEvent(new Event('scroll'))});await tick()
  assert.deepEqual(await page.evaluate(()=>({...window.audit})),{rect:0,rectList:0})
  assert.deepEqual(errors,[])
  writeFileSync(resolve(output,baseline?'baseline.json':'verified.json'),JSON.stringify({note:'600 synthetic native-contract rows in isolated Chrome; DOM geometry reads, not desktop CPU utilization.',evidence},null,2))
  console.log(JSON.stringify({baseline,evidence}))
}finally{await browser.close()}
