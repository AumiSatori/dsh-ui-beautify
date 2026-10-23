import assert from 'node:assert/strict'
import {readFileSync, mkdirSync, openSync, readSync, closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {chromium} from '@playwright/test'
import {build} from 'esbuild'

const project=fileURLToPath(new URL('..',import.meta.url))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','.scratch','claude-beautify'),'message-motion')
mkdirSync(output,{recursive:true})
let source='synthetic native public-marker fixture'
let assistantKind='assistant-step'
let nativeAssistant=''
if(process.env.DSH_ASAR){
 const fd=openSync(process.env.DSH_ASAR,'r')
 try{
  const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
  const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
  let entry=JSON.parse(json.toString('utf8'))
  for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js'.split('/'))entry=entry.files[part]
  const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset))
  const host=bytes.toString('utf8')
  for(const marker of ['data-chat-flow','data-chat-flow-key','data-chat-flow-kind','data-chat-turn','data-submission-echo','data-chat-following-tail'])assert.ok(host.includes(`"${marker}"`),`Installed chat exposes ${marker}`)
  const nativeKind=host.match(/const assistantDefinition = \{\s*kind: "([^"]+)"/)
  assert.ok(nativeKind,'Read the assistant kind from the installed native chat definition')
  assistantKind=nativeKind[1]
  assert.ok(host.includes(`key: "${assistantKind}"`),'The same kind owns the native assistant renderer')
  const assistantStart=host.indexOf('const AssistantMarkdown = '),assistantEnd=host.indexOf('function ProcessReasoning(',assistantStart)
  assert.ok(assistantStart>=0&&assistantEnd>assistantStart,'Read the actual installed assistant Markdown component')
  nativeAssistant=host.slice(assistantStart,assistantEnd)
  source='installed DSH chat public markers; synthetic content, streaming and submission acknowledgements'
 }finally{closeSync(fd)}
}
const nativeBundle=nativeAssistant?await build({stdin:{contents:`import React from 'react'; import * as jsxRuntime from 'react/jsx-runtime'; import {createRoot} from 'react-dom/client'; import {flushSync} from 'react-dom'; const react=React,react_jsx_runtime=jsxRuntime; const AssistantMarkdown_module_css_default={root:'native_assistant_root',body:'native_assistant_body',stopped:'native_assistant_stopped'}; const markdownLabels=()=>({}),localPathMediaUrl=()=>undefined; const _deepseek_ai_dsh_client_ui_primitives={MarkdownText:({text})=>React.createElement('div',{'data-native-markdown':''},...text.split('\\n\\n').map((text,i)=>React.createElement('p',{key:i},text)))}; ${nativeAssistant}\nconst roots=new WeakMap(); window.renderNativeAssistant=(seat,text)=>{let root=roots.get(seat);if(!root){root=createRoot(seat);roots.set(seat,root)}flushSync(()=>root.render(React.createElement(AssistantMarkdown,{blocks:[{kind:'text',text}],streaming:true,t:value=>value})));};`,resolveDir:project},bundle:true,write:false,format:'iife'}):null
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const page=await browser.newPage({viewport:{width:1000,height:820}})
const errors=[];page.on('pageerror',error=>errors.push(error.message))
const client=readFileSync(resolve(project,'client.js'),'utf8')
let passed=0
async function check(name,run){await run();passed++;console.log('PASS '+name)}
async function tick(){await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))}
async function boot({empty=false,late=false}={}){
 await page.goto('about:blank')
 await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
 await page.setContent(`<!doctype html><meta charset="utf-8"><style>
 body{margin:0;font:14px/1.8 system-ui;background:#f6f7fb;color:#252631}header{height:64px;padding:0 70px;display:flex;align-items:center;border-bottom:1px solid #e3e4eb;background:white}main{height:720px;max-width:850px;margin:auto;display:flex;flex-direction:column;position:relative}[data-conversation-scroll]{height:560px;overflow:auto;padding:20px 55px;box-sizing:border-box}[data-chat-flow]{min-height:120px}[data-chat-flow-kind]{margin:20px 0}[data-slot="conversation.chat.node"]{padding:12px 18px;border-radius:16px;background:white;width:fit-content;max-width:90%}[data-chat-flow-kind=user]>div,[data-submission-echo]>div{margin-left:auto;background:#e3e6ff}[data-chat-flow-kind=user]{display:flex;justify-content:flex-end}[data-submission-echo]{display:flex;justify-content:flex-end;margin:20px 0}[data-composer-seat]{padding:16px 55px;background:#f6f7fb}textarea{box-sizing:border-box;width:100%;height:76px;border:1px solid #dddfea;background:white;border-radius:18px;padding:18px;font:inherit;outline:none}.cf_primary{float:right;border:0;background:#6f70de;color:white;border-radius:50%;width:32px;height:32px;margin-top:8px}p{margin:0}pre{white-space:pre-wrap}h2{font-size:18px}
 </style><header>DSH · 新消息入场动效</header><main data-conversation-content data-conversation-session="a"><section data-conversation-scroll><div data-chat-following-tail><div data-chat-flow data-chat-motion></div></div></section><div data-composer-seat><textarea data-composer-input aria-label="演示消息输入" placeholder="发送消息…"></textarea><button class="cf_primary" aria-label="演示发送">↑</button></div></main>`)
 await page.evaluate(()=>{
  window.calls=[];window.animationObjects=[]
  const original=Element.prototype.animate
  Element.prototype.animate=function(frames,options){const a=original.call(this,frames,options);if(options?.id?.startsWith('dcb-message-')){window.calls.push({id:options.id,frames,options,element:this});window.animationObjects.push(a)}return a}
  window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(()=>({}))}
  window.row=(kind,key,turn,text='',pending=false)=>{const row=document.createElement('article');if(pending)row.setAttribute('data-submission-echo','true');else{row.dataset.chatFlowKind=kind==='assistant'?window.nativeAssistantKind:kind;row.dataset.chatFlowKey=key;row.dataset.chatTurn=turn}const node=document.createElement('div');node.dataset.slot='conversation.chat.node';if(text){const p=document.createElement('p');p.textContent=text;node.append(p)}row.append(node);return row}
  window.append=(kind,key,turn,text,pending=false)=>{const row=window.row(kind,key,turn,text,pending);document.querySelector('[data-chat-flow]').append(row);return row}
 })
 await page.evaluate(kind=>window.nativeAssistantKind=kind,assistantKind)
 if(nativeBundle)await page.addScriptTag({content:nativeBundle.outputFiles[0].text})
 if(!empty&&!late)await page.evaluate(()=>{window.append('user','old-u',1,'已有的提问');window.append('assistant','old-a',1,'打开会话时，历史消息保持原样。')})
 await page.addScriptTag({content:client})
 await page.evaluate(()=>window.motion=window.plugin.__test.createMessageMotion(document,window))
 if(late)await page.evaluate(()=>{window.append('user','old-u',1,'异步载入的历史提问');window.append('assistant','old-a',1,'异步载入的历史回复')})
 await tick()
}
const count=()=>page.evaluate(()=>window.calls.length)
async function finish(){await page.evaluate(()=>Promise.all(window.animationObjects.filter(a=>a.playState!=='idle').map(a=>a.finished.catch(()=>{}))))}
try{
 await boot()
 await check('initial history and asynchronously loaded history do not replay',async()=>{
  assert.equal(await count(),0);await boot({late:true});assert.equal(await count(),0);await boot()
 })
 await check('a real Enter submission eases upward once without changing layout, focus or host scroll',async()=>{
  await page.evaluate(()=>{document.querySelector('textarea').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();window.pendingRow=window.append('user','',2,'这是一条刚发送的新消息。',true)}});window.initialScroll=document.querySelector('[data-conversation-scroll]').scrollTop})
  await page.getByRole('textbox').fill('这是一条刚发送的新消息。');await page.getByRole('textbox').press('Enter');await tick()
  assert.equal(await count(),1)
  const middle=await page.evaluate(()=>{const a=window.animationObjects[0];a.pause();a.currentTime=100;const target=window.pendingRow.firstElementChild,s=getComputedStyle(target);return{opacity:Number(s.opacity),translate:s.translate,height:target.offsetHeight,scroll:document.querySelector('[data-conversation-scroll]').scrollTop,focus:document.activeElement===document.querySelector('textarea'),options:window.calls[0].options}})
  assert.ok(middle.opacity>0&&middle.opacity<1);assert.notEqual(middle.translate,'0px');assert.equal(middle.scroll,0);assert.equal(middle.focus,true);assert.equal(middle.options.duration,280)
  await page.screenshot({path:resolve(output,'message-user-enter-middle.png')})
  await page.evaluate(()=>window.animationObjects[0].play());await finish()
 })
 await check('the durable user acknowledgement replaces its echo without a second entrance',async()=>{
  await page.evaluate(()=>window.pendingRow.replaceWith(window.row('user','new-u',2,'这是一条刚发送的新消息。')));await tick();assert.equal(await count(),1)
 })
 await check('an empty assistant seat enters on its first content; token and paragraph appends never restart it',async()=>{
  await page.evaluate(()=>{window.answer=window.append('assistant','new-a',2,'');window.answer.style.height='0px'});await tick();assert.equal(await count(),1)
  await page.evaluate(()=>window.answer.style.removeProperty('height'))
  await page.evaluate(()=>{const p=document.createElement('p');p.textContent='模型回复正逐步出现';window.answer.firstElementChild.append(p)});await tick();assert.equal(await count(),2)
  const geometry=await page.evaluate(()=>{const a=window.animationObjects.at(-1);a.pause();a.currentTime=130;return{height:window.answer.offsetHeight,opacity:Number(getComputedStyle(window.answer.firstElementChild).opacity),transform:getComputedStyle(window.answer).transform}})
  assert.ok(geometry.opacity>0&&geometry.opacity<1);assert.equal(geometry.transform,'none')
  await page.screenshot({path:resolve(output,'message-assistant-enter-middle.png')})
  await page.evaluate(()=>{for(let i=0;i<50;i++)window.answer.querySelector('p').firstChild.appendData('。');const p=document.createElement('p');p.textContent='这是后续追加的段落，保持流式显示。';window.answer.firstElementChild.append(p);window.animationObjects.at(-1).play()});await tick();assert.equal(await count(),2);await finish()
  assert.equal(await page.evaluate(()=>getComputedStyle(window.answer.firstElementChild).translate),'none')
  assert.equal(await page.evaluate(()=>window.answer.querySelector('p').textContent.length),'模型回复正逐步出现'.length+50)
 })
 await check('history prepend, same-turn insertion and React remounts with stable keys do not replay',async()=>{
  await page.evaluate(()=>{const flow=document.querySelector('[data-chat-flow]');flow.prepend(window.row('assistant','older',0,'更早的历史'));flow.prepend(window.row('assistant','same-turn-history',2,'同轮早先的内容'));window.answer.replaceWith(window.answer.cloneNode(true))});await tick();assert.equal(await count(),2)
 })
 await check('display:contents Factory slots animate the painted message and preserve native transforms',async()=>{
  await page.evaluate(()=>{const row=window.row('assistant','contents-a',2,'原生插槽可以使用 display:contents');const slot=row.firstElementChild;slot.style.display='contents';slot.firstElementChild.style.transform='translateX(1px)';document.querySelector('[data-chat-flow]').append(row)});await tick()
  assert.equal(await count(),3)
  assert.equal(await page.evaluate(()=>window.calls.at(-1).element.tagName),'P')
  assert.equal(await page.evaluate(()=>getComputedStyle(window.calls.at(-1).element).transform),'matrix(1, 0, 0, 1, 1, 0)');await finish()
 })
 await check('a native assistant-step in a newly created process flow enters as a reply, not history',async()=>{
  await boot()
  await page.evaluate(()=>{
   const group=document.createElement('section'),flow=document.createElement('div');flow.setAttribute('data-step-process-content','true');flow.setAttribute('data-chat-flow','');group.append(flow)
   window.nativeReply=window.row('assistant','native-step-2',2,'')
   if(window.renderNativeAssistant)window.renderNativeAssistant(window.nativeReply.firstElementChild,'原生模型回复的首段。')
   else window.nativeReply.firstElementChild.textContent='原生模型回复的首段。'
   flow.append(window.nativeReply);document.querySelector('[data-chat-flow]').append(group)
  });await tick();assert.equal(await count(),1)
  assert.equal(await page.evaluate(()=>window.calls.at(-1).id),'dcb-message-assistant')
  if(nativeBundle){
   assert.equal(await page.locator('[data-chat-flow-kind="assistant-step"] .native_assistant_root[data-streaming="true"]').count(),1)
   await page.evaluate(()=>window.renderNativeAssistant(window.nativeReply.firstElementChild,'原生模型回复的首段。\n\n继续流式生成的第二段。'));await tick();assert.equal(await count(),1)
   assert.equal(await page.locator('[data-native-markdown] p').count(),2)
  }
  await finish()
 })
 await check('a first message also animates when an empty hero becomes a new session',async()=>{
  await boot({empty:true});await page.evaluate(()=>document.querySelector('textarea').addEventListener('keydown',event=>{if(event.key!=='Enter'||event.shiftKey||event.isComposing)return;event.preventDefault();const flow=document.querySelector('[data-chat-flow]');flow.remove();document.querySelector('main').dataset.conversationSession='new-session';const fresh=document.createElement('div');fresh.dataset.chatFlow='';fresh.append(window.row('user','first-u',1,'第一个新会话消息'));document.querySelector('[data-chat-following-tail]').append(fresh)}))
  await page.getByRole('textbox').press('Enter');await tick();assert.equal(await count(),1);await finish()
 })
 await check('reading history keeps its scroll position and skips new arrivals outside follow mode',async()=>{
  await boot();await page.evaluate(()=>{document.querySelector('[data-chat-following-tail]').removeAttribute('data-chat-following-tail');window.append('assistant','background-reply',2,'阅读历史时的新回复')});await tick();assert.equal(await count(),0)
 })
 await check('a long transcript waits for the host to reveal a new tail row without driving scroll itself',async()=>{
  await boot();await page.evaluate(()=>{const filler=document.createElement('div');filler.style.height='900px';document.querySelector('[data-chat-flow]').append(filler);window.append('assistant','below-viewport',2,'由宿主滚动后才出现的新回复')});await tick();assert.equal(await count(),0)
  assert.equal(await page.evaluate(()=>document.querySelector('[data-conversation-scroll]').scrollTop),0)
  await page.evaluate(()=>{const scroll=document.querySelector('[data-conversation-scroll]');scroll.scrollTop=scroll.scrollHeight});await tick();await tick();assert.equal(await count(),1);await finish()
 })
 await check('switching sessions cancels active motion and seeds the other session history',async()=>{
  await boot();await page.evaluate(()=>window.append('assistant','live-a',2,'即将切换会话'));await tick();assert.equal(await count(),1)
  await page.evaluate(()=>{document.querySelector('main').dataset.conversationSession='b';const flow=document.querySelector('[data-chat-flow]');flow.replaceChildren(window.row('user','b-u',1,'另一个会话的历史'),window.row('assistant','b-a',1,'此消息应直接显示'))});await tick();assert.equal(await count(),1)
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-message-')).length),0)
 })
 await check('the independent switch disables motion, cancels active effects and consumes skipped rows',async()=>{
  await boot();await page.evaluate(()=>window.motion.setEnabled(false));await page.evaluate(()=>window.append('user','off-u',2,'关闭动效时出现'));await tick();assert.equal(await count(),0)
  await page.evaluate(()=>{window.motion.setEnabled(true);window.append('assistant','on-a',2,'重新开启后新回复')});await tick();assert.equal(await count(),1)
  await page.evaluate(()=>window.motion.setEnabled(false));assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-message-')).length),0)
 })
 await check('an echo admitted while motion is off does not replay when acknowledged after enabling it',async()=>{
  await boot();await page.evaluate(()=>{window.motion.setEnabled(false);window.echoWhileOff=window.append('user','',2,'关闭动效时提交的消息',true)});await tick()
  await page.evaluate(()=>{window.motion.setEnabled(true);window.echoWhileOff.replaceWith(window.row('user','off-ack',2,'关闭动效时提交的消息'))});await tick();assert.equal(await count(),0)
 })
 await check('reduced motion and forced colors cancel effects and show messages immediately',async()=>{
  for(const preference of[{reducedMotion:'reduce'},{forcedColors:'active'}]){
   await boot();await page.evaluate(()=>window.append('assistant','motion-pref',2,'改变系统动态效果偏好'));await tick();assert.equal(await count(),1)
   await page.emulateMedia(preference);await tick();assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-message-')).length),0)
   await page.evaluate(()=>window.append('assistant','pref-new',2,'系统减少动态效果时直接显示'));await tick();assert.equal(await count(),1)
  }
 })
 await check('rapid arrivals remain independent; removing a row and disposing cancels all temporary effects',async()=>{
  await boot();await page.evaluate(()=>{window.append('user','fast-u',2,'连续发送');window.append('assistant','fast-a',2,'即时回复')});await tick();assert.equal(await count(),2)
  await page.evaluate(()=>document.querySelector('[data-chat-flow-key="fast-u"]').remove());await tick();assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-message-')).length),1)
  await page.evaluate(()=>window.motion.dispose());assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-message-')).length),0)
  await page.evaluate(()=>window.append('assistant','after-dispose',3,'卸载后的正常消息'));await tick();assert.equal(await count(),2)
  assert.equal(await page.evaluate(()=>document.querySelectorAll('[style]').length),0)
 })
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed,source,output}))
}finally{await browser.close()}
