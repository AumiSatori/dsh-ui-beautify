import {inspectWelcomeMedia,welcomeMediaType} from './welcome-media.js'

export const DIVIDER_CSS_LIMIT=12000
const defaults={turnDividerPreset:'plain',turnDividerColor:'#87a5d4',turnDividerMotion:false,turnDividerCss:'',turnDividerImageRevision:''}
export function normalizeTurnDivider(value){
  return {
    turnDividerPreset:['plain','color','whale'].includes(value?.turnDividerPreset)?value.turnDividerPreset:defaults.turnDividerPreset,
    turnDividerColor:/^#[0-9a-f]{6}$/i.test(value?.turnDividerColor||'')?value.turnDividerColor:defaults.turnDividerColor,
    turnDividerMotion:value?.turnDividerMotion===true,
    turnDividerCss:typeof value?.turnDividerCss==='string'?value.turnDividerCss.slice(0,DIVIDER_CSS_LIMIT):'',
    turnDividerImageRevision:typeof value?.turnDividerImageRevision==='string'?value.turnDividerImageRevision.slice(0,100):'',
  }
}

// CSS lives inside each divider's shadow tree, where it can address .line,
// .brand, .letter and .mascot without touching conversation content or controls.
export function validateDividerCss(value,win){
  if(typeof value!=='string'||value.length>DIVIDER_CSS_LIMIT)throw Error('CSS 最多 12000 个字符')
  if(/@import\b/i.test(value))throw Error('请直接填写 CSS；导入动图请使用下方的本地文件按钮')
  const sheet=new win.CSSStyleSheet();sheet.replaceSync(value)
  return value
}

const artworkCss=`
  :host{display:block;position:absolute;inset:auto 0 100%;height:1px;pointer-events:none!important;user-select:none;--divider-color:#87a5d4;--divider-line:var(--divider-color);--divider-text:var(--divider-color);--divider-height:1px;--divider-speed:1.8s;--divider-mascot-width:132px;}
  .divider{position:absolute;inset:auto 0 -12px;height:var(--divider-height);color:var(--divider-color);}
  .line{position:absolute;inset:auto 0 0;height:var(--divider-height);border-radius:999px;background:var(--divider-line);}
  :host([data-preset=plain]) .line{background:var(--dcb-turn-rim,#e5e7eb)}
  :host([data-preset=color]) .line{background:linear-gradient(90deg,transparent,var(--divider-color) 22%,var(--divider-color) 78%,transparent)}
  .brand,.mascot{display:none;}
  :host([data-preset=whale]) .divider{height:36px;bottom:-8px;}
  :host([data-preset=whale][data-custom-image]) .divider{height:98px;}
  :host([data-preset=whale]) .line{opacity:.55;background:linear-gradient(90deg,var(--divider-color),transparent 80%)}
  :host([data-preset=whale]) .brand{display:flex;align-items:baseline;position:absolute;left:5px;bottom:7px;white-space:pre;font:italic 750 clamp(16px,2.1vw,23px)/1.4 'Trebuchet MS',system-ui,sans-serif;letter-spacing:-.5px;color:var(--divider-text);}
  .letter{display:inline-block;transform-origin:50% 100%;animation:dcb-divider-letter calc(var(--divider-speed) + var(--i)*.027s) ease-in-out infinite;animation-delay:calc(var(--i)*-.16s);}
  :host([data-preset=whale][data-custom-image]) .mascot{display:block;position:absolute;right:0;bottom:0;width:var(--divider-mascot-width);height:calc(var(--divider-mascot-width)*.75);}
  .mascot img{width:100%;height:100%;object-fit:contain;display:block;}
  @keyframes dcb-divider-letter{0%,100%{transform:translateY(0) rotate(-2deg)}30%{transform:translateY(-3px) rotate(2deg)}65%{transform:translateY(1px) rotate(-1deg)}}
  @media(max-width:500px){:host{--divider-mascot-width:96px}.brand{font-size:15px!important;letter-spacing:-.65px!important}}
`
const pauseCss=`
  :host([data-paused]) *, :host([data-paused]) *::before, :host([data-paused]) *::after{animation-play-state:paused!important;transition:none!important;}
  @media(prefers-reduced-motion:reduce),(forced-colors:active){*,*::before,*::after{animation:none!important;transition:none!important;}}
  @media(forced-colors:active){.line{background:CanvasText!important}.brand{color:CanvasText!important}}
`

export function createTurnDivider(doc,win){
  const entries=new Map(),media=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  const hosts=new WeakMap()
  const exposure=new win.IntersectionObserver(batch=>{for(const event of batch){const entry=hosts.get(event.target);if(entry){entry.exposed=event.isIntersecting;draw(entry)}}},{rootMargin:'100px 0px'})
  let options=normalizeTurnDivider(null),disposed=false,generation=0,db=null,image=null,poster=null,revision=''
  const open=()=>new Promise((resolve,reject)=>{
    if(db){resolve(db);return}if(!win.indexedDB){reject(Error('当前环境无法保存动图'));return}
    const request=win.indexedDB.open('dsh-ui-beautify-turn-divider',1)
    request.onupgradeneeded=()=>request.result.createObjectStore('art')
    request.onerror=()=>reject(Error('无法打开本机动图存储'))
    request.onsuccess=()=>{if(disposed){request.result.close();reject(Error('分隔线已关闭'));return}db=request.result;db.onversionchange=()=>{db?.close();db=null};resolve(db)}
  })
  const store=async(mode,operation)=>{const database=await open();return new Promise((resolve,reject)=>{const tx=database.transaction('art',mode),request=operation(tx.objectStore('art'));let result;request.onsuccess=()=>{result=request.result};tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(Error('本机动图保存失败'))})}
  const release=()=>{if(image)win.URL.revokeObjectURL(image);if(poster)win.URL.revokeObjectURL(poster);image=null;poster=null}
  const draw=entry=>{
    const {host,custom,mascot,img}=entry
    host.setAttribute('data-preset',options.turnDividerPreset)
    host.style.setProperty('--divider-color',options.turnDividerColor)
    if(custom.textContent!==options.turnDividerCss)custom.textContent=options.turnDividerCss
    const playing=entry.visible&&entry.exposed&&options.turnDividerMotion&&!doc.hidden&&!media.matches
    host.toggleAttribute('data-paused',!playing)
    host.toggleAttribute('data-custom-image',!!image)
    const src=image?(playing?image:poster):null
    if(src&&options.turnDividerPreset==='whale'){
      if(img.src!==src)img.src=src
      if(img.parentElement!==mascot)mascot.append(img)
      if(mascot.parentElement!==entry.divider)entry.divider.append(mascot)
    }else{img.removeAttribute('src');img.remove();mascot.remove()}
  }
  const redraw=()=>{for(const entry of entries.values())draw(entry)}
  const refreshMedia=async()=>{
    const token=++generation;release();redraw()
    if(!options.turnDividerImageRevision)return
    try{
      const asset=await store('readonly',s=>s.get('mascot'))
      if(disposed||token!==generation||asset?.revision!==options.turnDividerImageRevision)return
      image=win.URL.createObjectURL(asset.blob);poster=win.URL.createObjectURL(asset.poster);redraw()
    }catch{/* Missing local artwork leaves only the text and divider. */}
  }
  const ensure=head=>{
    if(entries.has(head))return entries.get(head)
    const host=doc.createElement('span');host.className='dcb-turn-divider';host.setAttribute('aria-hidden','true');host.setAttribute('data-dcb-turn-divider','')
    const shadow=host.attachShadow({mode:'open'}),base=doc.createElement('style'),custom=doc.createElement('style'),guard=doc.createElement('style')
    base.textContent=`@layer dcb-divider-base { ${artworkCss} }`;guard.textContent=pauseCss
    const divider=doc.createElement('span');divider.className='divider'
    const line=doc.createElement('span');line.className='line'
    const brand=doc.createElement('span');brand.className='brand'
    for(const [index,char]of [...'DeepSeek Harness'].entries()){const letter=doc.createElement('span');letter.className='letter';letter.textContent=char;letter.style.setProperty('--i',index);brand.append(letter)}
    const mascot=doc.createElement('span');mascot.className='mascot';const img=doc.createElement('img');img.alt='';img.draggable=false
    divider.append(line,brand);shadow.append(base,custom,guard,divider)
    const entry={host,custom,divider,mascot,img,visible:false,exposed:false};entries.set(head,entry);hosts.set(host,entry);head.prepend(host);exposure.observe(host);draw(entry);return entry
  }
  doc.addEventListener('visibilitychange',redraw);media.addEventListener('change',redraw)
  return {
    setOptions(value){const next=normalizeTurnDivider(value),changedRevision=next.turnDividerImageRevision!==revision;options=next;revision=next.turnDividerImageRevision;redraw();if(changedRevision)refreshMedia()},
    sync(head,{visible=false,first=false}={}){
      if(first){this.remove(head);return}
      const entry=ensure(head);entry.visible=visible;draw(entry)
    },
    remove(head){const entry=entries.get(head);if(entry){exposure.unobserve(entry.host);hosts.delete(entry.host);entry.img.removeAttribute('src');entry.host.remove();entries.delete(head)}},
    async importImage(file){
      if(!file?.size||file.size>2*1024*1024)throw Error('动图需小于 2MB，建议使用小尺寸 GIF、PNG 或 WebP')
      const type=welcomeMediaType(new Uint8Array(await file.slice(0,32).arrayBuffer()))
      if(!type?.startsWith('image/'))throw Error('支持 GIF、APNG/PNG、WebP 图片')
      const asset=await inspectWelcomeMedia(file,doc,win)
      if(asset.width>1024||asset.height>1024)throw Error('动图请控制在 1024 × 1024 像素以内')
      const url=win.URL.createObjectURL(asset.blob),img=doc.createElement('img')
      try{
        img.src=url;await img.decode()
        const canvas=doc.createElement('canvas'),scale=Math.min(1,256/asset.width,160/asset.height)
        canvas.width=Math.max(1,Math.round(asset.width*scale));canvas.height=Math.max(1,Math.round(asset.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height)
        const poster=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))
        if(!poster)throw Error('无法生成静态预览')
        await store('readwrite',s=>s.put({blob:asset.blob,poster,revision:asset.revision},'mascot'))
        return {turnDividerPreset:'whale',turnDividerImageRevision:asset.revision}
      }finally{img.removeAttribute('src');win.URL.revokeObjectURL(url)}
    },
    async resetImage(){await store('readwrite',s=>s.delete('mascot'));return{turnDividerImageRevision:''}},
    dispose(){disposed=true;++generation;release();doc.removeEventListener('visibilitychange',redraw);media.removeEventListener('change',redraw);for(const head of [...entries.keys()])this.remove(head);exposure.disconnect();db?.close();db=null},
  }
}

export const turnDividerSettingsCss=`
  .dcb-divider-settings{margin-top:16px;padding:14px;border:1px solid #8883;border-radius:12px}
  .dcb-divider-settings label{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;margin:12px 0}
  .dcb-divider-settings button{font:inherit;color:inherit;border:1px solid #8884;background:transparent;border-radius:8px;padding:7px 10px;cursor:pointer}
  .dcb-divider-presets,.dcb-divider-actions{display:flex;gap:7px;flex-wrap:wrap}
  .dcb-divider-presets button[aria-checked=true]{border-color:currentColor;background:#8881}
  .dcb-divider-settings textarea{box-sizing:border-box;display:block;resize:vertical;width:100%;min-height:125px;border:1px solid #8885;border-radius:8px;background:transparent;color:inherit;padding:10px;font:12px/1.7 Consolas,monospace}
  .dcb-divider-settings p{font-size:12px;color:var(--dsh-settings-secondary);line-height:1.65}
  .dcb-divider-settings input[type=color]{width:42px;height:28px;padding:2px;border:1px solid #8884;border-radius:6px;background:transparent;cursor:pointer}
  .dcb-divider-demo{position:relative;height:42px;margin:6px 0 15px;pointer-events:none;border-bottom:1px solid transparent}
  .dcb-divider-demo:has([data-custom-image]){height:90px}
  .dcb-divider-demo>span{position:absolute;left:0;right:0;bottom:5px}
  .dcb-divider-error{color:#b43b4a!important}
`
export function createTurnDividerSettings(React,doc,win){
  const h=React.createElement
  return function TurnDividerSettings({value,onChange,manager}){
    const [css,setCss]=React.useState(value.turnDividerCss),[error,setError]=React.useState(''),[busy,setBusy]=React.useState(false)
    const demo=React.useRef(null),preview=React.useRef(null),file=React.useRef(null),mounted=React.useRef(false)
    React.useEffect(()=>{mounted.current=true;preview.current=createTurnDivider(doc,win);return()=>{mounted.current=false;preview.current?.dispose();preview.current=null}},[])
    React.useEffect(()=>setCss(value.turnDividerCss),[value.turnDividerCss])
    React.useEffect(()=>{if(preview.current&&demo.current){preview.current.setOptions(value);preview.current.sync(demo.current,{visible:true})}},[value.turnDividerPreset,value.turnDividerColor,value.turnDividerMotion,value.turnDividerCss,value.turnDividerImageRevision])
    const run=async fn=>{setBusy(true);setError('');try{const patch=await fn();if(mounted.current)onChange(patch)}catch(error){if(mounted.current)setError(error.message)}finally{if(mounted.current)setBusy(false)}}
    return h('div',{className:'dcb-divider-settings'},h('strong',null,'自定义分隔装饰'),
      h('div',{className:'dcb-divider-demo'},h('span',{ref:demo})),
      h('div',{className:'dcb-divider-presets',role:'radiogroup','aria-label':'分隔装饰预设'},[['plain','原始细线'],['color','彩色细线'],['whale','艺术字']].map(([key,label])=>h('button',{type:'button',key,role:'radio','aria-checked':value.turnDividerPreset===key,onClick:()=>onChange({turnDividerPreset:key,...(key==='whale'?{turnDividerMotion:true}:{})})},label))),
      h('label',null,'装饰颜色',h('input',{type:'color','aria-label':'分隔装饰颜色',value:value.turnDividerColor,onChange:event=>onChange({turnDividerColor:event.target.value,...(value.turnDividerPreset==='plain'?{turnDividerPreset:'color'}:{})})})),
      h('label',null,'字母轻晃',h('button',{type:'button',role:'switch','aria-label':'分隔装饰动效','aria-checked':value.turnDividerMotion,onClick:()=>onChange({turnDividerMotion:!value.turnDividerMotion})},value.turnDividerMotion?'已开启':'已关闭')),
      h('p',null,'动画仅在可见区域播放，减少动态效果或切到后台时暂停。仅改变分隔装饰，正文和消息操作保持原样。'),
      h('div',{className:'dcb-divider-actions'},h('button',{type:'button',disabled:busy,onClick:()=>file.current?.click()},busy?'处理中…':'导入自己的动图'),value.turnDividerImageRevision&&h('button',{type:'button',disabled:busy,onClick:()=>run(()=>manager.resetImage())},'移除自定义动图')),
      h('input',{ref:file,type:'file',accept:'image/gif,image/png,image/webp',hidden:true,'aria-label':'自定义分隔动图',onChange:event=>{const image=event.target.files?.[0];event.target.value='';if(image)run(()=>manager.importImage(image))}}),
      h('p',null,'支持 2MB 以内、1024 像素以内的 GIF / APNG / WebP；只保存在本机。'),
      h('details',null,h('summary',null,'CSS 自定义'),h('p',null,'可自由设置 .line、.brand、.letter、.mascot，也支持 @keyframes。CSS 仅作用于这个装饰区域。'),
        h('textarea',{'aria-label':'分隔装饰 CSS',value:css,maxLength:DIVIDER_CSS_LIMIT,spellCheck:false,onChange:event=>setCss(event.target.value),placeholder:'.line { height: 2px; background: linear-gradient(90deg, #80baff, #c7a4ff); }\n.brand { color: #7699ce; }'}),
        h('div',{className:'dcb-divider-actions'},h('button',{type:'button',onClick:()=>{try{onChange({turnDividerCss:validateDividerCss(css,win)});setError('')}catch(error){setError(error.message)}}},'应用 CSS'),h('button',{type:'button',onClick:()=>{setCss('');onChange({turnDividerCss:''});setError('')}},'清空 CSS'))),
      error&&h('p',{role:'alert',className:'dcb-divider-error'},error))
  }
}
