import {openSync,readSync,closeSync,writeFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
const project=fileURLToPath(new URL('..',import.meta.url))
const fd=openSync(process.env.DSH_ASAR||'D:/Program Files/DeepSeek Harness/resources/app.asar','r')
let chat,conversation
try{
 const h=Buffer.alloc(16);readSync(fd,h,0,16,0);const json=Buffer.alloc(h.readUInt32LE(12));readSync(fd,json,0,json.length,16);const tree=JSON.parse(json),base=8+h.readUInt32LE(4)
 const source=pkg=>{let item=tree;for(const k of `dsh/node_modules/@deepseek-ai/dsh-client-ui-${pkg}/lib/client.js`.split('/'))item=item.files[k];const bytes=Buffer.alloc(item.size);readSync(fd,bytes,0,bytes.length,base+Number(item.offset));return bytes.toString()}
 chat=source('chat');conversation=source('conversation')
}finally{closeSync(fd)}
const region=(source,anchor)=>{const start=source.indexOf(anchor);if(start<0)throw Error('Native source anchor missing: '+anchor);return source.slice(start,source.indexOf('//#endregion',start))}
function sheet(source,name){const start=source.indexOf(name+'.module.css.mjs'),code=source.slice(source.lastIndexOf('//#region',start),source.indexOf('//#endregion',start));return JSON.parse(code.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)[1])}
function classes(source,name){return source.match(new RegExp(`var ${name}_module_css_default = \\{[\\s\\S]*?\\n\\s*\\};`))[0]}
const css=sheet(chat,'stat-dialog')+sheet(chat,'StatsPills')+sheet(conversation,'ContextMeter')
const demo=`import React from 'react';import*as react_jsx_runtime from 'react/jsx-runtime';import*as react_dom from 'react-dom';import {createRoot} from 'react-dom/client';import{createStatPopoverMotion,statPopoverCss}from './src/stat-popover-motion.js';
const react=React;
const primitives={
 useAnchoredPosition({open,anchorRef,panelRef,gap=8,margin=12}){
  const [pos,setPos]=React.useState(null);
  React.useLayoutEffect(()=>{if(!open){setPos(null);return}const update=()=>{const p=panelRef.current,a=anchorRef.current;if(!p||!a)return;const r=a.getBoundingClientRect(),x=Math.max(margin,Math.min(innerWidth-p.offsetWidth-margin,r.left+r.width/2-p.offsetWidth/2)),y=Math.max(margin,r.top-gap-p.offsetHeight);setPos(old=>old?.left===x&&old?.top===y?old:{left:x,top:y})};update();const ro=new ResizeObserver(update);ro.observe(panelRef.current);addEventListener('resize',update);return()=>{ro.disconnect();removeEventListener('resize',update)}},[open]);return pos
 },
 useDismissOnOutsidePointer(root,open,setOpen,panel){React.useEffect(()=>{if(!open)return;const fn=e=>{if(!root.current?.contains(e.target)&&!panel.current?.contains(e.target))setOpen(false)};document.addEventListener('pointerdown',fn,true);return()=>document.removeEventListener('pointerdown',fn,true)},[open])},
 Tooltip:({children})=>children
};
const _deepseek_ai_dsh_client_ui_primitives=primitives;
${classes(chat,'stat_dialog')}
${classes(chat,'StatsPills')}
${classes(conversation,'ContextMeter')}
${region(chat,'const PANEL_MARGIN =')}
${region(chat,'function DialogPill(').split('/**')[0]}
${region(conversation,'function contextOccupancy(')}
${region(conversation,'const RADIUS =')}
const labels={'context.aria':'上下文已用 {percent}','context.used':'上下文已用','context.system':'系统提示词','context.tools':'工具定义','context.messages':'对话消息','number.thousand':'{value}K','number.million':'{value}M'};
const t=(key,args={})=>Object.entries(args).reduce((text,[k,v])=>text.replace('{'+k+'}',v),labels[key]||key);
const projection=key=>key==='contextPressure'?{projectedTokens:240000,contextWindow:1000000}:{systemTokens:24000,toolsTokens:56000,messageTokens:160000};
let manager;function install(){manager?.dispose();manager=createStatPopoverMotion(document,window);window.qaManager=manager}install();
const style=document.createElement('style');style.textContent=statPopoverCss;document.head.append(style);
function App(){return <><header><h1>底部统计弹层 · 过渡验证</h1><p>使用当前安装宿主的原始弹层组件与样式，合成数据。定位接口用于验证固定位置和 viewport clamp。</p><div className="qa-actions"><button onClick={()=>document.body.toggleAttribute('data-ds-dark-theme')}>切换明暗</button><button onClick={()=>window.runChecks()}>运行完整检查</button><button onClick={()=>{manager.dispose();window.report('动效已卸载')}}>卸载动效</button><button onClick={()=>{install();window.report('动效已重装')}}>重装动效</button><button onClick={()=>window.captureMid()}>展示动画中间帧</button></div><output id="result" aria-live="polite">等待验证</output></header><main id="scroll"><article><h2>保留阅读位置</h2>{Array.from({length:40},(_,i)=><p key={i}>合成对话段落 {i+1} · 弹层动画不应改变正文布局或重新定位输入栏。</p>)}</article></main><footer><textarea aria-label="输入草稿" defaultValue="保留草稿与焦点"/><div className="stats"><DialogPill stat="activity" ariaLabel="会话统计" title="会话统计" label="9 轮 173 步 · 196 tok/s"><dl data-session-stats-details="true" className={stat_dialog_module_css_default.details}><dt>模型用时</dt><dd>6分22秒</dd><dt>工具调用用时</dt><dd>2分1秒</dd><dt>首 token 平均</dt><dd>7.9秒</dd><dt>输出速度</dt><dd>196 tok/s</dd></dl></DialogPill><DialogPill stat="usage" ariaLabel="Token 用量" title="Token 用量" titleValue="27,000,000 tok" label="27M tok · 缓存命中 98% · ≈$0.22"><dl data-session-stats-usage="true" className={stat_dialog_module_css_default.details}><dt>缓存命中</dt><dd>98%</dd><dt>未缓存输入</dt><dd>540,000 tok</dd><dt>缓存读取</dt><dd>26,440,000 tok</dd><dt>输出</dt><dd>20,000 tok</dd></dl></DialogPill><ContextMeter useProjection={projection} t={t}/></div></footer><button id="outside">面板外部</button><div role="dialog" aria-label="无关对话框" hidden>不应被动画管理器接管</div></>}
createRoot(document.getElementById('root')).render(<App/>);
window.report=text=>document.getElementById('result').textContent=text;
window.addEventListener('error',e=>window.report('ERROR '+e.message));
const tick=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))),wait=ms=>new Promise(r=>setTimeout(r,ms));
const trigger=name=>document.querySelector('button[aria-label="'+name+'"]'),panel=()=>document.querySelector('[data-dcb-stat-popover]'),ghost=()=>document.querySelector('[data-dcb-stat-ghost]');
const activate=name=>{const el=trigger(name);el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));el.click()};
const outside=()=>{const el=document.getElementById('outside');el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));el.click()};
function assert(test,message){if(!test)throw Error(message)}
window.captureMid=async()=>{outside();await wait(220);activate('Token 用量');await tick();const animation=panel().getAnimations()[0];if(animation){animation.pause();animation.currentTime=90}window.report('中间帧：90 / 280ms')};
window.runChecks=async()=>{const checks=[];const check=async(name,fn)=>{await fn();checks.push(name);window.report('PASS '+name)};
try{
 await check('3 个宿主弹层入场与退场',async()=>{for(const name of ['会话统计','Token 用量','上下文已用 24%']){activate(name);await tick();const p=panel();assert(p,'panel mounted '+name);const a=p.getAnimations().find(a=>a.id==='dcb-stat-popover-enter');assert(a,'entry animation '+name);a.pause();a.currentTime=80;const s=getComputedStyle(p);assert(Number(s.opacity)>0&&Number(s.opacity)<1,'actual intermediate opacity');const left=p.style.left,top=p.style.top;a.finish();await tick();assert(p.style.left===left&&p.style.top===top,'native position unchanged');assert(!p.hasAttribute('data-dcb-stat-moving'),'will-change released');activate(name);await tick();assert(!panel(),'native dialog unmounts immediately');const g=ghost();assert(g&&g.hasAttribute('inert')&&g.getAttribute('aria-hidden')==='true','exit copy inert');assert(g.style.left===left&&g.style.top===top,'exit copy fixed seat');await wait(240);assert(!ghost(),'exit copy cleaned')}});
 await check('快速反向从当前画面接回',async()=>{activate('Token 用量');await tick();let a=panel().getAnimations()[0];a.pause();a.currentTime=70;const opening=Number(getComputedStyle(panel()).opacity);activate('Token 用量');await tick();let g=ghost(),e=g.getAnimations()[0];e.pause();e.currentTime=60;const closing=Number(getComputedStyle(g).opacity);assert(closing<opening,'closing is continuous');activate('Token 用量');await tick();a=panel().getAnimations()[0];a.pause();a.currentTime=0;assert(Math.abs(Number(getComputedStyle(panel()).opacity)-closing)<.025,'reopen continues from exit');assert(!ghost(),'old exit copy removed');a.finish();await tick();outside();await wait(230)});
 await check('连续切换只保留一个活动面板',async()=>{for(let i=0;i<5;i++){for(const name of ['会话统计','Token 用量','上下文已用 24%']){activate(name);await tick();assert(document.querySelectorAll('[data-dcb-stat-popover]').length===1,'one active panel');assert(document.querySelectorAll('[data-dcb-stat-ghost]').length<=2,'bounded exits')}}outside();await wait(240);assert(!panel()&&!ghost(),'switch cleanup')});
 await check('Escape、草稿与正文滚动保持',async()=>{const draft=document.querySelector('textarea').value,scroll=document.getElementById('scroll');scroll.scrollTop=600;const top=scroll.scrollTop;activate('会话统计');await tick();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(230);assert(!panel()&&!ghost(),'Escape closes');assert(document.querySelector('textarea').value===draft&&scroll.scrollTop===top,'draft and scroll preserved')});
 await check('关闭动效、卸载与重新挂载',async()=>{manager.sync(false);activate('Token 用量');await tick();assert(panel().getAnimations().length===0,'disabled no animation');activate('Token 用量');await tick();assert(!ghost(),'disabled no exit copy');manager.sync(true);activate('会话统计');await tick();manager.dispose();assert(!document.querySelector('[data-dcb-stat-moving]')&&!ghost(),'dispose releases');assert(!panel(),'markers removed');outside();await tick();install();assert(!document.querySelector('[aria-label="无关对话框"]').hasAttribute('data-dcb-stat-popover'),'unrelated dialog unchanged')});
 await check('减少动态效果与后台立即清理',async()=>{
  manager.dispose();
  const signal=new EventTarget();signal.matches=true;
  manager=createStatPopoverMotion(document,{MutationObserver,getComputedStyle:el=>getComputedStyle(el),matchMedia:()=>signal});
  activate('Token 用量');await tick();assert(panel().getAnimations().length===0,'reduced preference skips entrance');
  outside();await tick();assert(!ghost(),'reduced preference skips exit');
  signal.matches=false;signal.dispatchEvent(new Event('change'));activate('会话统计');await tick();
  assert(panel().hasAttribute('data-dcb-stat-moving'),'motion resumes');
  signal.matches=true;signal.dispatchEvent(new Event('change'));assert(!panel().hasAttribute('data-dcb-stat-moving'),'preference change cancels current motion');
  outside();await tick();signal.matches=false;activate('Token 用量');await tick();
  Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
  assert(!panel().hasAttribute('data-dcb-stat-moving'),'background clears motion');outside();await tick();assert(!ghost(),'background has no exit copy');
  delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));manager.dispose();install();
 });
 assert(document.getAnimations().filter(a=>a.id.startsWith('dcb-stat-')).length===0,'idle has no animations');
 window.report('全部通过：'+checks.length+' 组 · '+checks.join(' / '));document.body.dataset.qaResult='pass';
}catch(e){window.report('FAIL '+e.message);document.body.dataset.qaResult='fail';console.error(e)}};
`
const built=await build({stdin:{contents:demo,loader:'jsx',resolveDir:project},bundle:true,write:false,format:'iife'})
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style data-plugin-css="@deepseek-ai/dsh-client-ui-conversation/ContextMeter.module.css">${sheet(conversation,'ContextMeter')}</style><style>${css}
:root{--dsw-radius-lg:16px;--dsw-radius-sm:8px;--dsw-specific-menu:#fff;--dsw-alias-label-primary:#242734;--dsw-alias-label-secondary:#525666;--dsw-alias-label-tertiary:#747986;--dsw-alias-border-l1:#8883;--dsw-alias-border-l2:#8882;--dsw-alias-border-l3:#8884;--dsw-elevation-prominent:0 12px 36px #10182a24,0 0 0 1px #8882;--dsw-alias-interactive-bg-hover:#8882;--dsw-static-neutral-bluish-400:#8296b0;--dsw-static-blue-450:#4288ed}*{box-sizing:border-box}body{margin:0;height:100vh;display:grid;background:#f4f5f8;color:#252734;font:14px/1.6 system-ui}#root{display:grid;grid-template-rows:auto minmax(0,1fr) auto;height:100vh}header{padding:24px 36px;border-bottom:1px solid #8882}h1{font-size:21px;margin:0}p{margin:8px 0}.qa-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}button{font:inherit;cursor:pointer}.qa-actions button,#outside{min-height:44px;padding:8px 14px;border:1px solid #8883;border-radius:10px;background:#8881;color:inherit}output{display:block;overflow-wrap:anywhere;font-size:12px;min-height:25px}main{overflow:auto;padding:20px 36px}article{max-width:780px;margin:auto}article p{padding:12px;background:#8881;border-radius:10px}footer{padding:16px 24px 8px;max-width:900px;width:100%;justify-self:center}textarea{display:block;width:100%;height:96px;padding:16px;background:#fff;border:1px solid #8884;border-radius:22px;color:inherit;font:inherit}.stats{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px}#outside{position:fixed;right:12px;top:20px}.stats button{min-height:44px}body[data-ds-dark-theme]{background:#13151b;color:#f0f1f5;--dsw-specific-menu:#24262d;--dsw-alias-label-primary:#f0f1f5;--dsw-alias-label-secondary:#c0c4d0;--dsw-alias-label-tertiary:#9298a6;--dsw-elevation-prominent:0 12px 36px #0005,0 0 0 1px #fff2}body[data-ds-dark-theme] textarea{background:#24262d}@media(max-width:650px){header{padding:20px 16px}#outside{position:static;justify-self:center;margin:0 0 8px}.stats{gap:2px;flex-wrap:wrap}footer{padding:12px}main{padding:12px 16px}}@media(forced-colors:active){body{background:Canvas;color:CanvasText}.stats button,textarea,[role=dialog]{border:1px solid CanvasText;background:Canvas;color:CanvasText}}
</style><div id="root"></div><script src="/fixture.js"></script>`
const output=resolve(project,'..','status-popover-qa');mkdirSync(output,{recursive:true})
writeFileSync(resolve(output,'stat-popover-preview.html'),html.replace('<script src="/fixture.js"></script>','<script>'+built.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script>'))
const server=createServer((req,res)=>{if(req.url==='/fixture.js')res.writeHead(200,{'Content-Type':'text/javascript'}).end(built.outputFiles[0].text);else res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(html)})
await new Promise(r=>server.listen(Number(process.env.DSH_STAT_QA_PORT)||0,'127.0.0.1',r));console.log('Stat popover QA: http://127.0.0.1:'+server.address().port)
