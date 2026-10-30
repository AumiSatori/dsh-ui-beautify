import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {chromium} from '@playwright/test'
import {build} from 'esbuild'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','claude-beautify'),'chat-disclosure')
mkdirSync(output,{recursive:true})
const archive=process.env.DSH_ASAR
assert.ok(archive,'DSH_ASAR is required: use installed native DisclosureRow and ReasoningRow')
const fd=openSync(archive,'r')
let host,frontend,css,reasoning,reasoningHelper=''
try{
 const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
 const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
 const tree=JSON.parse(json.toString('utf8')),base=8+head.readUInt32LE(4)
 const read=entry=>{const b=Buffer.alloc(entry.size);readSync(fd,b,0,b.length,base+Number(entry.offset));return b.toString('utf8')}
 let entry=tree
 for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js'.split('/'))entry=entry.files[part]
 host=read(entry)
 function find(node,prefix=''){for(const [name,item] of Object.entries(node.files||{})){const path=prefix+name;if(item.files)find(item,path+'/');else if(path.includes('dsh-web-frontend/dist/assets/')&&path.endsWith('.js')){const text=read(item);if(text.includes('"data-disclosure-header":!0'))frontend=text}}}
 find(tree)
 const a=host.indexOf('const ReasoningRow ='),b=host.indexOf('//#endregion',a)
 assert.ok(a>=0&&b>a);reasoning=host.slice(a,b)
 if(reasoning.includes('reasoningText(')){
  const helper=host.indexOf('function reasoningText('),end=host.indexOf('//#endregion',helper)
  assert.ok(helper>=0&&end>helper,'Installed reasoning text helper exists');reasoningHelper=host.slice(helper,end)
 }
 css=JSON.parse(host.match(/const css\$\d+ = ("\.VJlF5q_root[^\n]+);/)[1])
}finally{closeSync(fd)}
assert.ok(frontend,'Installed frontend exports native DisclosureRow')
const at=frontend.indexOf('"data-disclosure-header":!0'),start=frontend.lastIndexOf('=C.memo(function({icon:',at)+1,end=frontend.indexOf('}),n2=',at)+2
assert.ok(start>0&&end>at,'Extract exact native component without copying third-party source into repository')
const bundle=await build({stdin:{contents:`
import * as C from 'react';import * as d from 'react/jsx-runtime';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
const br=new Proxy({},{get:(_,key)=>'native_disclosure_'+key}),he=(...args)=>args.filter(Boolean).join(' ');
const t2=({children,className})=>d.jsx('span',{className,children});const Fv=()=>d.jsx('span',{'aria-hidden':true,children:'⌄'}),Nv=Fv;
const NativeDisclosure=${frontend.slice(start,end)};
const react=C,react_jsx_runtime=d,THINK_ICON='☁',ReasoningRow_module_css_default={root:'VJlF5q_root',row:'VJlF5q_row',leading:'VJlF5q_leading',title:'VJlF5q_title',separator:'VJlF5q_separator',summary:'VJlF5q_summary',summaryText:'VJlF5q_summaryText',thinkBody:'VJlF5q_thinkBody'},accessibility_module_css_default={visuallyHidden:'sr-only'};
const _deepseek_ai_dsh_client_ui_primitives={DisclosureRow:NativeDisclosure,TextShimmer:t2},firstLine=text=>text.split('\\n')[0],latestCompletedParagraphFirstLine=firstLine;
${reasoningHelper}
${reasoning}
const useDisclosure=()=>{const[expanded,set]=C.useState(false);return{expanded,toggle:()=>set(value=>!value)}};
const t=value=>value==='message.think'?'思考':value;
function Other({name,kind}){const[open,set]=C.useState(false);return d.jsx('div',{'data-variant':kind,children:d.jsx(NativeDisclosure,{title:name,icon:'◇',open,expandable:true,expandOnRowClick:true,collapsedContent:d.jsx('span',{children:' · 查看执行详情'}),onToggle:()=>set(value=>!value),children:open&&d.jsx('pre',{className:'tool-body',children:'工具执行结果\\n检查第 1 项：通过\\n检查第 2 项：通过\\n可复制，保留原生选择与点击。'})})})}
function App(){return d.jsxs(d.Fragment,{children:[d.jsx('article',{'data-chat-flow-kind':'assistant-step',children:d.jsx(ReasoningRow,{text:'先检查已有实现，再验证动画中间帧。\\n展开与收起共用节奏。\\n连续点击从当前画面接回。',running:false,useDisclosure,usePresentation:fn=>fn({settledReasoningPreview:true}),renderSlot:(_,props)=>d.jsx('div',{children:props.text.split('\\n').map((text,i)=>d.jsx('p',{children:text},i))}),t})}),d.jsx('article',{'data-chat-flow-kind':'tool-call',children:d.jsx(Other,{name:'工具调用',kind:'tool'})}),d.jsx('article',{'data-chat-flow-kind':'command',children:d.jsx(Other,{name:'运行命令',kind:'others'})}),d.jsx('p',{id:'after',children:'后续对话随详情自然下移；完成后恢复原生高度。'})]})}
window.mount=()=>flushSync(()=>createRoot(document.querySelector('[data-chat-flow]')).render(d.jsx(App,{})));
`,resolveDir:project},bundle:true,write:false,format:'iife'})
const feature=await build({entryPoints:[resolve(project,'src/chat-disclosure-motion.js')],bundle:true,write:false,format:'iife',globalName:'DisclosureFeature'})
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const page=await browser.newPage({viewport:{width:980,height:760}}),errors=[],evidence=[]
page.on('pageerror',error=>errors.push(error.message))
let passed=0
const tick=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))
const button=label=>page.getByRole('button',{name:new RegExp(label)})
const effects=()=>page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-detail-')).length)
async function finish(){await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.id.startsWith('dcb-detail-')).map(a=>a.finished.catch(()=>{}))));await tick()}
async function boot(){
 await page.goto('about:blank');await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
 await page.setContent(`<meta charset="utf-8"><style>${css}
 body{margin:0;background:#f7f8fa;color:#262a33;font:14px/24px system-ui;--dsw-alias-bg-base:#fff;--dsw-alias-label-caption:#8b919c;--dsw-alias-label-primary:inherit;--dsh-content-font-delta:0px;--dsh-content-font-delta-secondary:0px}
 header{padding:28px 40px;border-bottom:1px solid #e5e7eb;background:#fff}main{padding:28px 40px;max-width:780px;margin:auto}article{margin:18px 0}.native_disclosure_root{display:flex;flex-direction:column;min-width:0}.native_disclosure_header{display:flex;align-items:center}.native_disclosure_row{display:flex;align-items:center;min-height:24px;gap:8px;cursor:pointer;outline-offset:2px}.native_disclosure_row:focus-visible{outline:2px solid #676aeb}.native_disclosure_leading{width:18px;flex:none}.native_disclosure_iconIdle{display:inline}.native_disclosure_chevronHover{display:none}.native_disclosure_root[data-open] .native_disclosure_title{font-weight:600}.VJlF5q_summary{color:#777f8c}.VJlF5q_thinkBody{padding-top:8px;padding-bottom:8px}p{margin:6px 0}.tool-body{background:#edf0f5;border:1px solid #dde1e8;border-radius:12px;white-space:pre-wrap;padding:16px;max-height:260px;overflow:auto}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}#after{margin-top:26px;color:#777f8c}.outside{margin:28px 40px;border:1px solid #ddd;border-radius:10px;padding:10px}
 .native_disclosure_row>span:not(.native_disclosure_leading){display:inline-flex;align-items:center;min-width:0}.native_disclosure_title{flex:none}
 body[data-ds-dark-theme]{background:#14151b;color:#d8d9e1;--dsw-alias-bg-base:#14151b}body[data-ds-dark-theme] header{background:#191a22;border-color:#30323f}body[data-ds-dark-theme] .tool-body{background:#20232c;border-color:#383b49}
 </style><header><strong>dsh-UI美化 · 详情展开动效</strong><div>思考 / 工具调用 / 运行命令</div></header><main data-conversation-content data-conversation-session="synthetic"><div data-chat-flow></div></main><div class="outside"><div class="native_disclosure_root"><div data-disclosure-header><div data-disclosure-row role="button" tabindex="0" aria-expanded="false" onclick="this.setAttribute('aria-expanded','true');this.parentElement.parentElement.setAttribute('data-open','')">其他插件控件</div></div></div></div>`)
 await page.addScriptTag({content:bundle.outputFiles[0].text});await page.evaluate(()=>window.mount())
 await page.addScriptTag({content:feature.outputFiles[0].text});await page.evaluate(()=>window.motion=DisclosureFeature.createChatDisclosureMotion(document,window));await tick()
 assert.deepEqual(errors,[],'Installed native disclosure components mount without errors')
}
async function check(name,run){await boot();await run();passed++;console.log('PASS '+name)}
try{
 await check('native reasoning expands with real intermediate height and restores exact layout',async()=>{
  assert.equal(await effects(),0);const initial=await page.locator('[data-variant=think]').evaluate(el=>el.getBoundingClientRect().height)
  await button('思考').click();await tick()
  const state=await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id.startsWith('dcb-detail-')){a.pause();a.currentTime=60}const el=document.querySelector('[data-variant=think]');return{height:el.getBoundingClientRect().height,initial:24,target:el.scrollHeight,opacity:Number(getComputedStyle(el.querySelector('.VJlF5q_thinkBody')).opacity),id:document.getAnimations().filter(a=>a.id.startsWith('dcb-detail-')).map(a=>a.id)}})
  assert.ok(state.height>initial&&state.height<state.target);assert.ok(state.opacity>0&&state.opacity<1)
  await page.screenshot({path:resolve(output,'reasoning-opening-light-middle.png')})
  await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));await finish()
  assert.equal(await effects(),0);assert.equal(await page.locator('[data-dcb-detail-motion]').count(),0)
  const end=await page.locator('[data-variant=think]').evaluate(el=>({height:el.getBoundingClientRect().height,style:el.getAttribute('style')}));assert.ok(end.height>initial);assert.ok(!end.style,'Temporary layout properties must be removed')
  evidence.push({phase:'native reasoning opening middle',...state,finalHeight:end.height})
 })
 await check('native unmount has an inert exit bridge and an upward intermediate frame',async()=>{
  await button('思考').click();await tick();await finish()
  const expanded=await page.locator('[data-variant=think]').evaluate(el=>el.getBoundingClientRect().height)
  await button('思考').click();await tick()
  const state=await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id.startsWith('dcb-detail-')){a.pause();a.currentTime=60}const el=document.querySelector('[data-variant=think]'),ghost=el.querySelector('[data-dcb-detail-ghost]');return{height:el.getBoundingClientRect().height,ghost:!!ghost,inert:ghost?.inert,hidden:ghost?.getAttribute('aria-hidden'),duplicateIds:ghost?.querySelectorAll('[id]').length,opacity:ghost&&Number(getComputedStyle(ghost).opacity)}})
  assert.ok(state.height>24&&state.height<expanded);assert.equal(state.inert,true);assert.equal(state.hidden,'true');assert.equal(state.duplicateIds,0);assert.ok(state.opacity>0&&state.opacity<1)
  await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.screenshot({path:resolve(output,'reasoning-closing-dark-middle.png')})
  await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));await finish()
  assert.equal(await page.locator('[data-variant=think]').evaluate(el=>el.getBoundingClientRect().height),24);assert.equal(await page.locator('[data-dcb-detail-ghost]').count(),0)
  evidence.push({phase:'native reasoning close middle',...state})
 })
 await check('rapid reversals stay continuous and never accumulate effects or ghosts',async()=>{
  for(let i=0;i<9;i++){
   await button('思考').click();await tick()
   await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id.startsWith('dcb-detail-')){a.pause();a.currentTime=45}})
   const before=await page.locator('[data-variant=think]').evaluate(el=>{const node=el.querySelector('[data-dcb-detail-ghost]')||el.querySelector('.VJlF5q_thinkBody');return{h:el.getBoundingClientRect().height,opacity:Number(getComputedStyle(node).opacity)}})
   await button('思考').click();await tick()
   const next=await page.evaluate(()=>{for(const a of document.getAnimations())if(a.id.startsWith('dcb-detail-')){a.pause();a.currentTime=0}const el=document.querySelector('[data-variant=think]'),node=el.querySelector('[data-dcb-detail-ghost]')||el.querySelector('.VJlF5q_thinkBody');return{h:el.getBoundingClientRect().height,opacity:Number(getComputedStyle(node).opacity),effects:document.getAnimations().filter(a=>a.id.startsWith('dcb-detail-')).length,ghosts:document.querySelectorAll('[data-dcb-detail-ghost]').length}})
   assert.ok(Math.abs(before.h-next.h)<1);assert.ok(Math.abs(before.opacity-next.opacity)<.02);assert.ok(next.effects<=2);assert.ok(next.ghosts<=1)
   await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));await finish()
  }
  assert.equal(await effects(),0)
 })
 await check('tool and command clicks plus keyboard preserve native state and focus',async()=>{
  await button('工具调用').focus();await page.keyboard.press('Enter');await tick();assert.ok(await effects()>0);await finish()
  assert.equal(await button('工具调用').getAttribute('aria-expanded'),'true');assert.equal(await button('工具调用').evaluate(el=>el===document.activeElement),true)
  await page.keyboard.press('Space');await tick();await finish();assert.equal(await button('工具调用').getAttribute('aria-expanded'),'false')
  await button('运行命令').click();await tick();assert.ok(await effects()>0);await finish()
  await page.getByRole('button',{name:'其他插件控件'}).click();await tick();assert.equal(await effects(),0)
 })
 await check('streaming growth releases height, and programmatic changes do not replay',async()=>{
  await button('思考').click();await tick()
  await page.evaluate(()=>{const p=document.createElement('p');p.textContent='流式追加内容 '.repeat(20);document.querySelector('.VJlF5q_thinkBody').append(p)})
  await tick();assert.equal(await effects(),0);assert.equal(await page.locator('[data-dcb-detail-motion]').count(),0)
  await page.evaluate(()=>{const root=document.querySelector('[data-variant=tool] .native_disclosure_root');root.setAttribute('data-open','');const p=document.createElement('p');p.textContent='外部更新';root.append(p)})
  await tick();assert.equal(await effects(),0)
 })
 await check('switching sessions, hiding the page, disabling and unloading release effects',async()=>{
  for(const action of ['session','hidden','disabled','dispose']){
   await boot();await button('思考').click();await tick();assert.ok(await effects()>0)
   await page.evaluate(action=>{if(action==='session')document.querySelector('main').dataset.conversationSession='different';else if(action==='hidden'){Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))}else if(action==='disabled')window.motion.setEnabled(false);else window.motion.dispose()},action)
   await tick();assert.equal(await effects(),0);assert.equal(await page.locator('[data-dcb-detail-ghost],[data-dcb-detail-motion]').count(),0)
  }
 })
 await check('reduced motion, forced colors and a disabled preference use native instant disclosure',async()=>{
  for(const mode of ['reduced','forced','disabled']){
   await boot();if(mode==='disabled')await page.evaluate(()=>window.motion.setEnabled(false));else await page.emulateMedia(mode==='reduced'?{reducedMotion:'reduce'}:{forcedColors:'active'})
   await button('思考').click();await tick();assert.equal(await effects(),0);assert.equal(await button('思考').getAttribute('aria-expanded'),'true')
  }
 })
 await check('dark narrow long text has no overflow, huge disclosures skip cloning, idle has no frame loop',async()=>{
  await page.setViewportSize({width:390,height:820});await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''))
  await button('运行命令').click();await tick();await finish();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  await page.screenshot({path:resolve(output,'command-dark-narrow-expanded.png')})
  await button('思考').click();await tick();await finish();await page.evaluate(()=>document.querySelector('.VJlF5q_thinkBody').style.height='1800px')
  await button('思考').click();await tick();assert.equal(await effects(),0);assert.equal(await page.locator('[data-dcb-detail-ghost]').count(),0)
  await page.evaluate(()=>{window.idleFrames=0;const raf=requestAnimationFrame;window.requestAnimationFrame=callback=>{window.idleFrames++;return raf(callback)}})
  await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.idleFrames),0)
 })
 assert.deepEqual(errors,[])
 writeFileSync(resolve(output,'verification.json'),JSON.stringify({passed,source:'Installed native DisclosureRow and ReasoningRow; synthetic content only',evidence,errors},null,2))
 console.log(JSON.stringify({passed,output}))
}finally{await browser.close()}
