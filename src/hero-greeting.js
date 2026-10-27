import {motion} from './motion.js'

const HEADLINE=':is([class$="_headline"],[class*="_headline "])'
const TITLE_GROUP=':is([class$="_titleGroup"],[class*="_titleGroup "])'
const FISH_HITBOX=':is([class$="_fishHitbox"],[class*="_fishHitbox "])'
const PREVIEW_BADGE=':is([class$="_previewBadge"],[class*="_previewBadge "])'

const modes=[['native','默认标题','保留 DSH 原始文字'],['random','随机文案','从下面的文案中随机选择'],['code','自定义代码','由本地 JavaScript 返回显示文字']]
const defaultMessages=['早上好','中午好','下午好','晚上好']
const defaultCode=`const h = context.hour
return h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好'`

export const heroGreetingDefaults={heroGreetingMode:'native',heroGreetingMessages:defaultMessages,heroGreetingCode:defaultCode,heroGreetingShowPreview:true,heroGreetingShowLogo:true,heroGreetingCustomLogo:false,heroGreetingLogoSize:34,heroGreetingCss:''}

const cleanText=(value,max=80)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max)
const listOf=value=>{
  const list=Array.isArray(value)?value:String(value??'').split(/\r?\n/)
  return [...new Set(list.map(item=>cleanText(item)).filter(Boolean))].slice(0,20)
}

export function normalizeHeroGreeting(value){
  const mode=value?.heroGreetingMode==='time'?'code':modes.some(([id])=>id===value?.heroGreetingMode)?value.heroGreetingMode:'native'
  const messages=Array.isArray(value?.heroGreetingMessages)?value.heroGreetingMessages.slice(0,20).map(item=>String(item).slice(0,80)):defaultMessages
  return {
    heroGreetingMode:mode,
    heroGreetingMessages:messages,
    heroGreetingCode:typeof value?.heroGreetingCode==='string'?value.heroGreetingCode.slice(0,2000):defaultCode,
    heroGreetingShowPreview:value?.heroGreetingShowPreview!==false,
    heroGreetingShowLogo:value?.heroGreetingShowLogo!==false,
    heroGreetingCustomLogo:value?.heroGreetingCustomLogo===true,
    heroGreetingLogoSize:Number.isFinite(value?.heroGreetingLogoSize)?Math.round(Math.max(16,Math.min(120,value.heroGreetingLogoSize))):34,
    heroGreetingCss:String(value?.heroGreetingCss??'').replace(/<\/?style[^>]*>/gi,'').slice(0,12000),
  }
}

export const heroGreetingCss=`
  .dcb-hero-greeting-picker { display:grid; gap:14px; margin:16px 0 4px; padding:14px; border:1px solid var(--dsh-settings-border); border-radius:12px; background:var(--dsh-settings-subtle); }
  .dcb-hero-greeting-picker h3 { margin:0; color:var(--dsh-settings-text); font-size:14px; line-height:20px; }
  .dcb-hero-greeting-picker p { margin:5px 0 0; color:var(--dsh-settings-secondary); font-size:12px; line-height:18px; }
  .dcb-hero-greeting-modes { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
  .dcb-hero-greeting-mode { min-width:0; min-height:58px; padding:8px 6px; border:1px solid var(--dsh-settings-border); border-radius:10px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); font:inherit; cursor:pointer; transition:background-color ${motion.time.control}ms ${motion.ease.color},border-color ${motion.time.control}ms ${motion.ease.color},transform ${motion.time.quick}ms ${motion.ease.snappy}; }
  .dcb-hero-greeting-mode:hover { border-color:var(--dsh-settings-text); }
  .dcb-hero-greeting-mode:active { transform:scale(.96); }
  .dcb-hero-greeting-mode[aria-checked=true] { border-color:var(--dsh-settings-text); background:var(--dsh-settings-surface); box-shadow:0 2px 8px #0000000b; }
  .dcb-hero-greeting-mode strong,.dcb-hero-greeting-mode small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dcb-hero-greeting-mode strong { font-size:12px; }
  .dcb-hero-greeting-mode small { margin-top:3px; color:var(--dsh-settings-secondary); font-size:10px; line-height:15px; }
  .dcb-hero-greeting-field { display:grid; gap:7px; }
  .dcb-hero-greeting-field label { color:var(--dsh-settings-text); font-size:12px; font-weight:600; }
  .dcb-hero-greeting-field-heading { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; }
  .dcb-hero-greeting-example { min-height:36px; padding:6px 10px; border:1px solid var(--dsh-settings-border); border-radius:8px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); font:12px/20px system-ui,sans-serif; cursor:pointer; transition:transform ${motion.time.quick}ms ${motion.ease.snappy},border-color ${motion.time.quick}ms ${motion.ease.color}; }
  .dcb-hero-greeting-example:hover { border-color:var(--dsh-settings-text); }
  .dcb-hero-greeting-example:active { transform:scale(.96); }
  .dcb-hero-greeting-example:focus-visible { outline:2px solid var(--dsh-settings-text); outline-offset:2px; }
  .dcb-hero-greeting-field textarea { box-sizing:border-box; width:100%; min-height:96px; resize:vertical; padding:9px 10px; border:1px solid var(--dsh-settings-border); border-radius:9px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); font:12px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace; outline:none; transition:border-color ${motion.time.quick}ms ${motion.ease.color},box-shadow ${motion.time.quick}ms ${motion.ease.color}; }
  .dcb-hero-greeting-field textarea:focus { border-color:var(--dsh-settings-text); box-shadow:0 0 0 3px #8882; }
  .dcb-hero-greeting-preview { display:flex; align-items:center; justify-content:center; min-height:84px; padding:12px; border:1px solid var(--dsh-settings-border); border-radius:11px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); }
  .dcb-hero-greeting-preview-inner { display:inline-flex; align-items:center; justify-content:center; gap:10px; max-width:100%; font-size:22px; line-height:32px; }
  .dcb-hero-greeting-preview-icon { display:inline-grid; place-items:center; width:32px; height:32px; border-radius:50%; color:currentColor; font-size:18px; }
  .dcb-hero-greeting-preview-badge { border:1px solid #8884; border-radius:999px; padding:1px 7px; color:var(--dsh-settings-secondary); font:11px/18px ui-monospace,monospace; }
  .dcb-hero-greeting-note { margin:0; color:var(--dsh-settings-secondary); font-size:11px; line-height:17px; }
  .dcb-hero-logo-actions { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .dcb-hero-logo-size { width:74px; padding:8px; border:1px solid var(--dsh-settings-border); border-radius:8px; background:transparent; color:var(--dsh-settings-text); font:inherit; }
  .dcb-hero-logo-size:focus { outline:2px solid #8886; }
  [data-dcb-hero-greeting] { justify-content:center !important; align-items:center !important; }
  [data-dcb-hero-greeting] [data-dcb-hero-title-group] { justify-content:center !important; align-items:center !important; }
  [data-dcb-hero-greeting] [data-dcb-hero-icon] { flex:none; }
  [data-dcb-hero-greeting] [data-dcb-hero-icon] > svg { width:var(--dcb-hero-logo-size,34px); height:auto; }
  [data-dcb-hero-greeting] [data-dcb-hero-icon][data-dcb-hero-logo-hidden] { display:none!important; }
  [data-dcb-hero-icon][data-dcb-hero-logo-custom] > :not([data-dcb-hero-logo-image]) { display:none!important; }
  [data-dcb-hero-logo-image] { display:block; width:var(--dcb-hero-logo-size,34px); height:var(--dcb-hero-logo-size,34px); object-fit:contain; }
  [data-dcb-hero-greeting] [data-dcb-hero-title] { min-width:0; }
  [data-dcb-hero-greeting] [data-dcb-hero-badge] { align-self:center; margin-top:0; }
  [data-dcb-hero-badge-hidden] { display:none!important; }
  [data-dcb-hero-greeting][data-dcb-hero-style=soft] [data-dcb-hero-title-group] { padding:7px 12px; border:1px solid #8883; border-radius:999px; background:#8881; }
  [data-dcb-hero-greeting][data-dcb-hero-style=soft] [data-dcb-hero-badge] { background:transparent; }
  @media(max-width:580px) { .dcb-hero-greeting-modes { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { .dcb-hero-greeting-mode,.dcb-hero-greeting-example { transition:none; } }
  @media(forced-colors:active) { .dcb-hero-greeting-picker,.dcb-hero-greeting-mode,.dcb-hero-greeting-field textarea,.dcb-hero-greeting-preview { background:Canvas; color:CanvasText; border-color:CanvasText; box-shadow:none; } }
`

function scopedCss(source,win){
  try{
    const sheet=new win.CSSStyleSheet();sheet.replaceSync(source)
    const rules=[...sheet.cssRules].filter(rule=>rule.type!==3).map(rule=>rule.cssText).join('\n')
    const mapped=rules.replace(/:host\b|\.hero\b/g,':scope').replace(/\.icon\b/g,'[data-dcb-hero-icon]').replace(/\.title\b/g,'[data-dcb-hero-title]').replace(/\.badge\b/g,'[data-dcb-hero-badge]')
    return `@scope ([data-dcb-hero-greeting]) { ${mapped} }`
  }catch{return ''}
}

// Keep the selected image in the plugin's local asset database, not settings.
export function createHeroLogoStore(win){
  let db=null,opening=null,url='',disposed=false,revision=0
  const listeners=new Set(),notify=()=>{for(const listener of listeners)listener()}
  function open(){
    if(disposed)return Promise.reject(Error('LOGO 存储已关闭'))
    if(db)return Promise.resolve(db)
    if(!opening)opening=new Promise((resolve,reject)=>{
      const request=win.indexedDB.open('dsh-ui-beautify-hero-logo',1)
      request.onupgradeneeded=()=>request.result.createObjectStore('logo')
      request.onerror=request.onblocked=()=>{opening=null;reject(Error('无法打开本机 LOGO 存储'))}
      request.onsuccess=()=>{if(disposed){request.result.close();reject(Error('LOGO 存储已关闭'));return}db=request.result;db.onversionchange=()=>{db?.close();db=null;opening=null};resolve(db)}
    })
    return opening
  }
  async function run(mode,change){const database=await open();return new Promise((resolve,reject)=>{const tx=database.transaction('logo',mode),request=change(tx.objectStore('logo'));let result;request.onsuccess=()=>{result=request.result};tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(Error('本机 LOGO 读写失败'))})}
  function publish(blob){if(disposed)return;if(url)win.URL.revokeObjectURL(url);url=blob?win.URL.createObjectURL(blob):'';notify()}
  async function load(){const token=++revision;try{const asset=await run('readonly',store=>store.get('current'));if(token===revision)publish(asset?.blob)}catch{}}
  load()
  return {subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},getSnapshot:()=>url,async save(file){
    if(!file?.size||file.size>4*1024*1024)throw Error('请选择不超过 4MB 的图片')
    const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer()),ascii=(a,b)=>String.fromCharCode(...bytes.slice(a,b))
    const type=bytes[0]===137&&ascii(1,4)==='PNG'?'image/png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':ascii(0,6)==='GIF87a'||ascii(0,6)==='GIF89a'?'image/gif':ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP'?'image/webp':''
    if(!type)throw Error('支持 PNG、JPG、GIF 和 WebP 图片')
    const blob=new win.Blob([file],{type}),probe=win.URL.createObjectURL(blob),image=new win.Image()
    try{await new Promise((resolve,reject)=>{image.onload=()=>image.naturalWidth&&image.naturalHeight&&image.naturalWidth<=4096&&image.naturalHeight<=4096?resolve():reject(Error('图片尺寸过大'));image.onerror=()=>reject(Error('无法读取图片'));image.src=probe})}finally{win.URL.revokeObjectURL(probe)}
    await run('readwrite',store=>store.put({blob,name:String(file.name||'自定义 LOGO').slice(0,120)},'current'));revision++;publish(blob)
  },reload:load,dispose(){disposed=true;revision++;db?.close();if(url)win.URL.revokeObjectURL(url);url='';listeners.clear()}}
}

// The custom function runs in a worker inside an opaque-origin sandbox. A
// timeout terminates it even if it loops; the host document is never exposed.
function runCode(doc,win,source,context,done){
  const frame=doc.createElement('iframe');frame.hidden=true;frame.setAttribute('sandbox','allow-scripts')
  const payload=JSON.stringify({source,context}).replace(/</g,'\\u003c')
  frame.srcdoc=`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'"><script>const input=${payload};const workerText=\`onmessage = e => { try { const source=e.data.source; const body=/\\\\breturn\\\\b/.test(source)?source:'return ('+source+')'; const result=Function('context','"use strict";'+body)(e.data.context); postMessage(typeof result==='string'?result:''); } catch { postMessage(''); } }\`;const w=new Worker(URL.createObjectURL(new Blob([workerText],{type:'text/javascript'})));w.onmessage=e=>{parent.postMessage({type:'dcb-hero-code',value:e.data},'*');w.terminate()};w.onerror=()=>{parent.postMessage({type:'dcb-hero-code',value:''},'*');w.terminate()};w.postMessage(input);<\/script>`
  let settled=false
  const finish=value=>{if(settled)return;settled=true;win.clearTimeout(timeout);win.removeEventListener('message',receive);frame.remove();done(cleanText(value))}
  const receive=event=>{if(event.source===frame.contentWindow&&event.data?.type==='dcb-hero-code')finish(event.data.value)}
  const timeout=win.setTimeout(()=>finish(''),1000);win.addEventListener('message',receive);doc.body.append(frame)
  return ()=>finish('')
}

export function createHeroGreeting(doc,win,logos){
  const records=new Map();let config=normalizeHeroGreeting(),disposed=false,frame=0,timer=0
  const style=doc.createElement('style');style.dataset.dcbHeroGreeting='';doc.head.append(style)
  const signature=()=>JSON.stringify(config)
  let configKey=signature()
  const find=()=>[...doc.querySelectorAll(HEADLINE)].map(headline=>{
    const titleGroup=headline.querySelector(TITLE_GROUP),icon=headline.querySelector(FISH_HITBOX),badge=titleGroup?.querySelector(PREVIEW_BADGE)
    if(!titleGroup||!icon)return null
    const title=[...titleGroup.children].find(child=>child!==badge)||titleGroup.firstElementChild
    return title?{headline,titleGroup,icon,badge,title}:null
  }).filter(Boolean)
  const context=()=>{const now=new Date();return{hour:now.getHours(),minute:now.getMinutes(),day:now.getDay(),date:now.toISOString(),theme:doc.body.hasAttribute('data-ds-dark-theme')?'dark':'light'}}
  function paint(item){
    let record=records.get(item.headline)
    if(!record){
      record={...item,originalTitle:item.title.textContent,originalBadgeAttr:item.badge?.getAttribute('data-dcb-hero-badge-hidden')??null,logoSize:item.headline.style.getPropertyValue('--dcb-hero-logo-size'),logoPriority:item.headline.style.getPropertyPriority('--dcb-hero-logo-size'),lastKey:'',message:'',cancel:null};records.set(item.headline,record)
    }else Object.assign(record,item)
    item.headline.setAttribute('data-dcb-hero-greeting','')
    item.headline.setAttribute('data-dcb-hero-style',config.heroGreetingMode)
    item.titleGroup.setAttribute('data-dcb-hero-title-group','')
    item.icon.setAttribute('data-dcb-hero-icon','')
    item.headline.style.setProperty('--dcb-hero-logo-size',`${config.heroGreetingLogoSize}px`)
    item.icon.toggleAttribute('data-dcb-hero-logo-hidden',!config.heroGreetingShowLogo)
    const logoUrl=logos?.getSnapshot?.()||''
    if(config.heroGreetingCustomLogo&&logoUrl){
      let image=item.icon.querySelector(':scope > [data-dcb-hero-logo-image]')
      if(!image){image=doc.createElement('img');image.alt='';image.setAttribute('data-dcb-hero-logo-image','');item.icon.append(image)}
      if(image.getAttribute('src')!==logoUrl)image.src=logoUrl
      item.icon.setAttribute('data-dcb-hero-logo-custom','')
    }else{item.icon.querySelector(':scope > [data-dcb-hero-logo-image]')?.remove();item.icon.removeAttribute('data-dcb-hero-logo-custom')}
    item.title.setAttribute('data-dcb-hero-title','')
    item.badge?.setAttribute('data-dcb-hero-badge','')
    const now=context(),key=`${configKey}|${config.heroGreetingMode==='code'?`${now.hour}:${now.minute}:${now.theme}`:''}`
    if(record.lastKey!==key){
      const fallback=record.originalTitle||'探索未至之境'
      record.lastKey=key
      record.cancel?.();record.cancel=null
      const messages=listOf(config.heroGreetingMessages)
      record.message=config.heroGreetingMode==='random'?messages[Math.floor(Math.random()*messages.length)]||fallback:fallback
      if(config.heroGreetingMode==='code')record.cancel=runCode(doc,win,config.heroGreetingCode,now,result=>{if(disposed||record.lastKey!==key)return;record.cancel=null;record.message=result||fallback;schedule()})
    }
    const message=config.heroGreetingMode==='native'?record.originalTitle:record.message
    if(item.title.textContent!==message)item.title.textContent=message
    if(item.badge){if(config.heroGreetingShowPreview)item.badge.removeAttribute('data-dcb-hero-badge-hidden');else item.badge.setAttribute('data-dcb-hero-badge-hidden','')}
  }
  function restore(record){
    record.lastKey='';record.cancel?.();record.cancel=null
    record.icon.querySelector(':scope > [data-dcb-hero-logo-image]')?.remove();record.icon.removeAttribute('data-dcb-hero-logo-hidden');record.icon.removeAttribute('data-dcb-hero-logo-custom')
    if(record.logoSize)record.headline.style.setProperty('--dcb-hero-logo-size',record.logoSize,record.logoPriority);else record.headline.style.removeProperty('--dcb-hero-logo-size')
    if(record.title.textContent!==record.originalTitle)record.title.textContent=record.originalTitle
    if(record.badge){if(record.originalBadgeAttr===null)record.badge.removeAttribute('data-dcb-hero-badge-hidden');else record.badge.setAttribute('data-dcb-hero-badge-hidden',record.originalBadgeAttr)}
    for(const node of [record.headline,record.titleGroup,record.icon,record.title,record.badge])node?.removeAttribute('data-dcb-hero-greeting')
    record.titleGroup?.removeAttribute('data-dcb-hero-title-group');record.icon?.removeAttribute('data-dcb-hero-icon');record.title?.removeAttribute('data-dcb-hero-title');record.badge?.removeAttribute('data-dcb-hero-badge');record.headline?.removeAttribute('data-dcb-hero-style')
  }
  function refresh(){
    frame=0;if(disposed)return
    const nextCss=scopedCss(config.heroGreetingCss,win);if(style.textContent!==nextCss)style.textContent=nextCss
    const found=find(),active=new Set(found.map(item=>item.headline))
    for(const [node,record] of records)if(!active.has(node)){restore(record);records.delete(node)}
    for(const item of found)paint(item)
  }
  const schedule=()=>{if(!disposed&&!frame)frame=win.requestAnimationFrame(refresh)}
  const unsubscribe=logos?.subscribe?.(schedule)
  const observer=new win.MutationObserver(schedule);observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-ds-dark-theme','hidden']})
  function armTimer(){if(timer)win.clearInterval(timer);timer=config.heroGreetingMode==='code'?win.setInterval(()=>{for(const record of records.values())record.lastKey='';schedule()},60000):0}
  return {sync(value){config=normalizeHeroGreeting(value);const next=signature();if(next!==configKey){configKey=next;for(const record of records.values())record.lastKey='';armTimer()}schedule()},dispose(){disposed=true;unsubscribe?.();if(frame)win.cancelAnimationFrame(frame);if(timer)win.clearInterval(timer);observer.disconnect();for(const record of records.values())restore(record);records.clear();style.remove()}}
}

export function createHeroGreetingSettings(React,win,FishLogo,logos){
  const h=React.createElement
  return function HeroGreetingSettings({value,onChange}){
    const config=normalizeHeroGreeting(value),[codePreview,setCodePreview]=React.useState('探索未至之境'),[logoError,setLogoError]=React.useState(''),[logoBusy,setLogoBusy]=React.useState(false),logoInput=React.useRef(null)
    const logoUrl=React.useSyncExternalStore(logos.subscribe,logos.getSnapshot,logos.getSnapshot)
    React.useEffect(()=>{
      if(config.heroGreetingMode!=='code')return
      const now=new Date(),context={hour:now.getHours(),minute:now.getMinutes(),day:now.getDay(),date:now.toISOString(),theme:win.document.body.hasAttribute('data-ds-dark-theme')?'dark':'light'}
      let cancel=()=>{};const timer=win.setTimeout(()=>{cancel=runCode(win.document,win,config.heroGreetingCode,context,result=>setCodePreview(result||'探索未至之境'))},300)
      return()=>{win.clearTimeout(timer);cancel()}
    },[config.heroGreetingMode,config.heroGreetingCode])
    const preview=config.heroGreetingMode==='native'?'探索未至之境':config.heroGreetingMode==='random'?(listOf(config.heroGreetingMessages)[0]||'探索未至之境'):codePreview
    const patch=next=>onChange(next)
    return h('div',{className:'dcb-hero-greeting-picker'},
      h('div',null,h('h3',null,'空白页欢迎语'),h('p',null,'设置新会话页面图标后的文字与样式，图标和文字保持居中。')),
      h('div',{className:'dcb-hero-greeting-modes',role:'radiogroup','aria-label':'欢迎语模式'},modes.map(([id,label,description])=>h('button',{key:id,type:'button',className:'dcb-hero-greeting-mode',role:'radio','aria-checked':config.heroGreetingMode===id,onClick:()=>patch({heroGreetingMode:id})},h('strong',null,label),h('small',null,description)))),
      config.heroGreetingMode==='random'&&h('div',{className:'dcb-hero-greeting-field'},h('label',null,'随机文案（一行一条）'),h('textarea',{value:config.heroGreetingMessages.join('\n'),spellCheck:false,'aria-label':'随机欢迎语列表',onChange:event=>patch({heroGreetingMessages:event.target.value.split(/\r?\n/)})}),h('p',{className:'dcb-hero-greeting-note'},'预览显示第一条文案；实际欢迎页从非空文案中随机选择，留空时使用默认标题。')),
      config.heroGreetingMode==='code'&&h('div',{className:'dcb-hero-greeting-field'},h('div',{className:'dcb-hero-greeting-field-heading'},h('label',null,'自定义代码'),h('button',{type:'button',className:'dcb-hero-greeting-example',onClick:()=>patch({heroGreetingCode:defaultCode})},'载入时间问候示例')),h('textarea',{value:config.heroGreetingCode,spellCheck:false,'aria-label':'欢迎语自定义代码',onChange:event=>patch({heroGreetingCode:event.target.value})}),h('p',{className:'dcb-hero-greeting-note'},'示例根据时间显示早上好、中午好、下午好或晚上好。代码接收 context.hour、context.minute、context.theme 等字段，返回一个字符串；只在本机运行。')),
      h('div',{className:'dcb-settings-row'},h('div',{className:'dcb-settings-copy'},h('span',{className:'dcb-settings-row-title'},'显示 LOGO'),h('p',{className:'dcb-settings-row-desc'},'控制欢迎语前的图标，关闭后文字仍保持居中。')),h('button',{type:'button',role:'switch',className:'dcb-switch','aria-label':'显示欢迎语 LOGO','aria-checked':config.heroGreetingShowLogo,onClick:()=>patch({heroGreetingShowLogo:!config.heroGreetingShowLogo})})),
      h('div',{className:'dcb-hero-greeting-field'},h('label',{htmlFor:'dcb-hero-logo-size'},'LOGO 大小（16–120 px）'),h('input',{id:'dcb-hero-logo-size',type:'number',className:'dcb-hero-logo-size',min:16,max:120,value:config.heroGreetingLogoSize,'aria-label':'欢迎语 LOGO 大小',onChange:event=>{if(event.target.value!=='')patch({heroGreetingLogoSize:Number(event.target.value)})}}),
        h('div',{className:'dcb-hero-logo-actions'},h('input',{ref:logoInput,type:'file',hidden:true,accept:'image/png,image/jpeg,image/gif,image/webp','aria-label':'选择欢迎语 LOGO 图片',onChange:async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;setLogoBusy(true);setLogoError('');try{await logos.save(file);patch({heroGreetingCustomLogo:true,heroGreetingShowLogo:true})}catch(error){setLogoError(error.message||'LOGO 图片读取失败')}finally{setLogoBusy(false)}}}),h('button',{type:'button',className:'dcb-hero-greeting-example',disabled:logoBusy,onClick:()=>logoInput.current?.click()},logoBusy?'正在读取…':'上传自定义 LOGO'),h('button',{type:'button',className:'dcb-hero-greeting-example',onClick:()=>patch({heroGreetingCustomLogo:false})},'使用默认 LOGO'),logoUrl&&h('button',{type:'button',className:'dcb-hero-greeting-example',onClick:()=>patch({heroGreetingCustomLogo:true,heroGreetingShowLogo:true})},'使用已上传 LOGO')),
        h('p',{role:logoError?'alert':'status',className:'dcb-hero-greeting-note'},logoError||`当前：${config.heroGreetingCustomLogo&&logoUrl?'自定义图片':'默认 LOGO'}。支持 PNG、JPG、GIF、WebP，图片保存在本机。`)),
      h('div',{className:'dcb-settings-row'},h('div',{className:'dcb-settings-copy'},h('span',{className:'dcb-settings-row-title'},'显示“预览版”标签'),h('p',{className:'dcb-settings-row-desc'},'控制欢迎语旁的“预览版”标签，图标可单独设置。')),
        h('button',{type:'button',role:'switch',className:'dcb-switch','aria-label':'显示预览版标签','aria-checked':config.heroGreetingShowPreview,onClick:()=>patch({heroGreetingShowPreview:!config.heroGreetingShowPreview})})),
      h('div',{className:'dcb-hero-greeting-field'},h('label',null,'自定义样式 CSS'),h('textarea',{value:config.heroGreetingCss,spellCheck:false,'aria-label':'欢迎语自定义样式',placeholder:'.hero { gap: 12px; }\n.title { letter-spacing: .04em; }\n.badge { opacity: .7; }',onChange:event=>patch({heroGreetingCss:event.target.value})}),h('p',{className:'dcb-hero-greeting-note'},'可用选择器：:host、.hero、.icon、.title、.badge；它们会自动限制在这块欢迎语内。')),
      h('div',{className:'dcb-hero-greeting-preview','aria-label':'欢迎语预览'},h('div',{className:'dcb-hero-greeting-preview-inner','data-dcb-hero-greeting':'',style:{'--dcb-hero-logo-size':`${config.heroGreetingLogoSize}px`}},h('span',{className:'dcb-hero-greeting-preview-icon','data-dcb-hero-icon':'','data-dcb-hero-logo-hidden':!config.heroGreetingShowLogo?'':undefined,style:{width:config.heroGreetingLogoSize,height:config.heroGreetingLogoSize},'aria-hidden':true},config.heroGreetingCustomLogo&&logoUrl?h('img',{'data-dcb-hero-logo-image':'',src:logoUrl,alt:''}):FishLogo?h(FishLogo,{size:34}):'◉'),h('span',{'data-dcb-hero-title-group':''},h('span',{'data-dcb-hero-title':''},preview),config.heroGreetingShowPreview&&h('span',{className:'dcb-hero-greeting-preview-badge','data-dcb-hero-badge':''},'预览版')))),
      h('p',{className:'dcb-hero-greeting-note'},'设置会自动保存；切换到新会话或刷新后仍会生效。'))
  }
}
