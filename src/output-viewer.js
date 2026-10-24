import {motion} from './motion.js'

const TEXT_LIMIT=2*1024*1024,IMAGE_LIMIT=8*1024*1024
const CODE=/^(?:py|js|mjs|cjs|ts|tsx|jsx|sh|bash|zsh|css|scss|less|yaml|yml|toml|ini|conf|cfg|env|xml|sql|rs|go|java|c|h|cpp|hpp|cs|rb|php|kt|swift|txt|log|lock)$/
export function outputKind(path){
  const ext=String(path).split(/[\\/]/).at(-1).split('.').at(-1).toLowerCase()
  if(/^(?:png|jpe?g|gif|webp|avif|ico|svg|bmp)$/.test(ext))return{kind:'image',ext,label:'图片',mime:`image/${ext==='svg'?'svg+xml':ext==='jpg'?'jpeg':ext==='ico'?'x-icon':ext}`}
  if(/^(?:html?|xhtml)$/.test(ext))return{kind:'html',ext,label:'网页'}
  if(/^(?:md|markdown)$/.test(ext))return{kind:'markdown',ext,label:'Markdown'}
  if(ext==='csv')return{kind:'csv',ext,label:'表格'}
  if(ext==='json')return{kind:'json',ext,label:'JSON'}
  if(CODE.test(ext))return{kind:'code',ext,label:ext.toUpperCase()}
  return null
}

export function outputContentReader(binding){
  return async(sessionId,path,signal)=>{
    const type=outputKind(path),face=binding.current
    if(!type||!face)throw new Error('文件预览暂不可用，请用 DSH 打开。')
    if(signal?.aborted)throw new DOMException('Aborted','AbortError')
    const stat=await face.stat(sessionId,path,signal)
    if(signal?.aborted)throw new DOMException('Aborted','AbortError')
    if(!stat?.ok)throw new Error('文件不存在或当前会话无法读取。')
    const size=Number(stat.value?.bytes),limit=type.kind==='image'?IMAGE_LIMIT:TEXT_LIMIT
    if(!Number.isFinite(size)||size<0||size>limit)throw new Error(`文件超过 ${limit/1024/1024} MB 预览上限，可用 DSH 打开。`)
    const result=await face.readBytes(sessionId,path,{},signal)
    if(signal?.aborted)throw new DOMException('Aborted','AbortError')
    if(!result?.ok||!result.value?.data)throw new Error('文件读取失败，请重试或用 DSH 打开。')
    const bytes=result.value.data instanceof Uint8Array?result.value.data:Uint8Array.from(result.value.data)
    if(bytes.length>limit)throw new Error('文件过大，请用 DSH 打开。')
    if(type.kind==='image')return {...type,size:bytes.length,bytes}
    let text
    try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{throw new Error('暂不支持此文件的文字编码，请用 DSH 打开。')}
    return {...type,size:bytes.length,text}
  }
}

// RFC-style CSV quoting, including quoted newlines. Render work is bounded.
export function csvPreview(text,maxRows=501){
  const rows=[];let row=[],cell='',quoted=false,truncated=false
  const push=()=>{row.push(cell);cell='';rows.push(row);row=[]}
  const source=text.replace(/^\uFEFF/,'')
  for(let i=0;i<source.length;i++){
    const ch=source[i]
    if(ch==='"'){
      if(quoted&&source[i+1]==='"'){cell+='"';i++}else if(quoted||!cell)quoted=!quoted;else cell+=ch
    }else if(ch===','&&!quoted){if(row.length<99){row.push(cell);cell=''}else cell+=ch}
    else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&source[i+1]==='\n')i++;push();if(rows.length>=maxRows){truncated=i<source.length-1;break}}
    else cell+=ch
  }
  if(!truncated&&(cell||row.length))push()
  return{rows:rows.slice(0,maxRows),truncated}
}

function htmlDocument(source){
  const policy="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer">${source}`
}

export const outputViewerCss=`
  .dcb-file-viewer { position:fixed; inset:max(12px,calc(var(--dsh-windows-titlebar-height,24px) + 12px)) 12px 12px auto; z-index:2147482991; display:flex; flex-direction:column; width:min(560px,calc(100vw - 24px)); max-width:calc(100vw - 24px); min-width:min(280px,calc(100vw - 24px)); border:1px solid #ffffffb3; border-radius:20px; background:rgba(249,250,252,.94); color:#24272d; box-shadow:0 18px 64px #17213624,inset 0 1px 0 #fff; backdrop-filter:blur(12px); overflow:hidden; font:13px/1.6 system-ui,sans-serif; }
  .dcb-file-viewer,.dcb-file-viewer * { box-sizing:border-box; }
  .dcb-file-viewer-head { display:flex; align-items:center; flex:none; gap:12px; min-height:70px; padding:16px 18px 12px; border-bottom:1px solid #202a3c14; background:rgba(255,255,255,.62); backdrop-filter:blur(14px) saturate(1.15); }
  .dcb-file-viewer-icon { display:grid; place-items:center; width:36px; height:40px; flex:none; border:1px solid #202a3c14; border-radius:10px; background:#ffffff90; color:#646c77; font-size:11px; font-weight:600; }
  .dcb-file-viewer-title { flex:1; min-width:0; }
  .dcb-file-viewer-title strong { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; font-weight:600; }
  .dcb-file-viewer-title small { display:block; color:#757e8c; font-size:11px; }
  .dcb-file-viewer button { font:inherit; color:inherit; cursor:pointer; border:0; background:transparent; }
  .dcb-file-viewer .dcb-file-action { display:grid; place-items:center; width:30px; height:30px; padding:0; flex:none; border-radius:8px; font-size:17px; transition:background-color 180ms ease,transform 180ms ease; }
  .dcb-file-viewer button:hover { background:#202a3c0c; }
  .dcb-file-viewer button:active { transform:scale(.94); }
  .dcb-file-viewer button:focus-visible { outline:2px solid #888; outline-offset:2px; }
  .dcb-file-viewer-toolbar { display:flex; align-items:center; gap:8px; padding:10px 18px; flex:none; }
  .dcb-file-modes { display:inline-flex; gap:2px; padding:3px; border:1px solid #202a3c16; border-radius:10px; }
  .dcb-file-modes button { padding:4px 14px; border-radius:7px; font-size:12px; transition:background-color 180ms ease,color 180ms ease; }
  .dcb-file-modes button[aria-pressed=true] { background:#24272d; color:#fff; }
  .dcb-file-location { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right; color:#838a94; font-size:11px; }
  .dcb-file-viewer-body { position:relative; flex:1; min-height:0; margin:0 12px 10px; border:1px solid #202a3c14; border-radius:12px; overflow:auto; overscroll-behavior:contain; background:#fff; scrollbar-width:thin; }
  .dcb-file-viewer-content { width:100%; max-width:none; margin:0; min-height:100%; padding:24px; overflow-wrap:anywhere; }
  .dcb-file-viewer-content p { color:inherit; }
  .dcb-file-viewer-content > :first-child { margin-top:0; }
  .dcb-file-viewer-content h1 { font-size:25px; line-height:1.4; }
  .dcb-file-viewer-content h2 { font-size:20px; }
  .dcb-file-viewer-content pre { white-space:pre-wrap; font:12px/1.7 Consolas,monospace; }
  .dcb-file-viewer-body > iframe { display:block; width:100%; height:100%; min-height:360px; border:0; background:#fff; }
  .dcb-file-viewer-body > img { display:block; max-width:100%; max-height:100%; margin:auto; object-fit:contain; }
  .dcb-file-table { overflow:auto; }
  .dcb-file-table table { border-collapse:collapse; width:100%; font-size:12px; }
  .dcb-file-table :is(th,td) { padding:10px 14px; border-bottom:1px solid #8882; text-align:left; white-space:pre-wrap; min-width:80px; }
  .dcb-file-table th { position:sticky; top:0; background:#f4f5f7; color:#4e5663; font-weight:600; }
  .dcb-file-table tr:nth-child(even) { background:#88888806; }
  .dcb-file-viewer-status { flex:none; padding:0 20px 12px; color:#8b929c; font-size:11px; }
  .dcb-file-loading,.dcb-file-error { padding:40px 28px; text-align:center; color:#7b8492; }
  .dcb-file-error strong { display:block; margin-bottom:8px; color:inherit; font-size:14px; }
  .dcb-file-error button { margin:14px 4px 0; padding:5px 12px; border:1px solid #8884; border-radius:8px; }
  .dcb-file-viewer-moving { will-change:opacity,transform,filter; }
  .dcb-file-resizer { position:absolute; inset:0 auto 0 0; width:6px; z-index:2; cursor:ew-resize; touch-action:none; }
  .dcb-file-resizer:hover { background:#8882; }
  .dcb-file-viewer[data-dragging] iframe { pointer-events:none; }
  body[data-ds-dark-theme] .dcb-file-viewer { background:rgba(30,33,39,.96); color:#e4e8ef; border-color:#ffffff29; box-shadow:0 18px 64px #0008,inset 0 1px 0 #ffffff12; }
  body[data-ds-dark-theme] .dcb-file-viewer-head { background:#ffffff08; border-color:#ffffff16; }
  body[data-ds-dark-theme] .dcb-file-viewer-icon { background:#ffffff0c; border-color:#ffffff20; color:#c1cad6; }
  body[data-ds-dark-theme] :is(.dcb-file-viewer-title small,.dcb-file-viewer-status,.dcb-file-location,.dcb-file-loading,.dcb-file-error) { color:#9ca7b7; }
  body[data-ds-dark-theme] .dcb-file-viewer-body { background:#202329; border-color:#ffffff16; }
  body[data-ds-dark-theme] .dcb-file-modes { border-color:#ffffff20; }
  body[data-ds-dark-theme] .dcb-file-modes button[aria-pressed=true] { background:#e4e8ef; color:#202329; }
  body[data-ds-dark-theme] .dcb-file-viewer button:hover { background:#ffffff12; }
  body[data-ds-dark-theme] .dcb-file-table th { background:#292d35; color:#d2d9e4; }
  @media(max-width:600px) { .dcb-file-viewer { inset:max(8px,calc(var(--dsh-windows-titlebar-height,24px) + 8px)) 8px 8px; width:auto!important; max-width:none; min-width:0; border-radius:16px; } .dcb-file-viewer-content { padding:18px; } .dcb-file-location,.dcb-file-resizer { display:none; } }
  @media(prefers-reduced-motion:reduce) { .dcb-file-viewer button { transition:none; } }
  @media(forced-colors:active) { .dcb-file-viewer,.dcb-file-viewer-head,.dcb-file-viewer-body { background:Canvas!important; color:CanvasText!important; border:1px solid CanvasText!important; box-shadow:none!important; backdrop-filter:none!important; } .dcb-file-modes button[aria-pressed=true] { background:Highlight!important; color:HighlightText!important; } }
`

export function createOutputViewer(React,doc,win,{createPortal,MarkdownText,CodeBlock}={}){
  const h=React.createElement,listeners=new Set()
  const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let state={present:false,open:false},abort=null,disposed=false,failed=false,revision=0,blob='',restoreFocus=null,restoreEntry=null
  const set=patch=>{state={...state,...patch};for(const listener of listeners)listener()}
  const cleanup=()=>{abort?.abort();abort=null;if(blob){win.URL.revokeObjectURL(blob);blob=''}}
  function close(restore=true){
    cleanup();revision++;set({open:false})
    if(restore){const target=[restoreFocus,restoreEntry].find(el=>el?.isConnected&&!el.closest('[inert]')&&el.getClientRects().length);target?.focus({preventScroll:true})}
  }
  function openNative(){const fallback=state.fallback;close();fallback?.()}
  async function load(){
    cleanup();const id=++revision;abort=new win.AbortController();const signal=abort.signal
    set({status:'loading',file:null,error:'',mode:'preview'})
    try{
      const file=await state.read(state.sessionId,state.path,signal)
      if(disposed||signal.aborted||id!==revision)return
      if(file.kind==='image')blob=win.URL.createObjectURL(new Blob([file.bytes],{type:file.mime}))
      set({status:'ready',file:{...file,url:blob}})
    }catch(error){if(!disposed&&!signal.aborted&&id===revision)set({status:'error',error:error.message||'内容加载失败。'})}
  }
  function View({sessionId}){
    const view=React.useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>state,()=>state)
    const node=React.useRef(null),body=React.useRef(null),animation=React.useRef(null),drag=React.useRef(null)
    const present=view.present&&view.sessionId===sessionId
    React.useLayoutEffect(()=>{
      const element=node.current
      if(!element||!present){animation.current?.cancel();animation.current=null;return}
      if(view.open&&!element.contains(doc.activeElement))element.querySelector('[aria-label="关闭文件预览"]')?.focus({preventScroll:true})
      const previous=animation.current,computed=previous&&win.getComputedStyle(element)
      const from=computed?{opacity:computed.opacity,transform:computed.transform,filter:computed.filter}:view.open?{opacity:0,transform:'translateX(24px) scale(.97)',filter:'blur(2px)'}:{opacity:1,transform:'none',filter:'none'}
      previous?.cancel();animation.current=null
      const finish=()=>{element.classList.remove('dcb-file-viewer-moving');if(!view.open&&!state.open)set({present:false,file:null,read:null,fallback:null})}
      if(quiet.matches||typeof element.animate!=='function'){finish();return}
      element.classList.add('dcb-file-viewer-moving')
      const a=element.animate([from,view.open?{opacity:1,transform:'translateX(0) scale(1)',filter:'blur(0)'}:{opacity:0,transform:'translateX(18px) scale(.98)',filter:'blur(2px)'}],{duration:view.open?motion.time.standard:motion.time.control,easing:view.open?motion.ease.smooth:'cubic-bezier(.4,0,.2,1)',fill:'both',id:'dcb-output-viewer'})
      animation.current=a;a.finished.then(()=>{if(animation.current===a){animation.current=null;a.cancel();finish()}},()=>{})
    },[view.open,present])
    React.useEffect(()=>()=>animation.current?.cancel(),[])
    React.useLayoutEffect(()=>{
      const element=body.current
      if(!element||!present||!view.open||quiet.matches||typeof element.animate!=='function')return
      element.style.willChange='opacity,transform,filter'
      const a=element.animate([{opacity:.25,transform:'translateY(8px)',filter:'blur(2px)'},{opacity:1,transform:'none',filter:'none'}],{duration:motion.time.control,easing:motion.ease.smooth,id:'dcb-output-content'})
      const clear=()=>element.style.removeProperty('will-change')
      a.finished.then(clear,()=>{})
      return()=>{a.cancel();clear()}
    },[present,view.open,view.path,view.status,view.mode])
    React.useLayoutEffect(()=>{
      if(body.current)body.current.scrollTop=0
    },[view.path,view.sessionId,view.mode])
    if(!present||typeof createPortal!=='function')return null
    const file=view.file,name=view.path.replaceAll('\\','/').split('/').at(-1),type=outputKind(view.path)
    const code=(text,lang)=>CodeBlock?h(CodeBlock,{code:text,lang,showHeader:false}):h('pre',null,h('code',null,text))
    let content
    if(view.status==='loading')content=h('div',{className:'dcb-file-loading',role:'status'},'正在读取文件…')
    else if(view.status==='error')content=h('div',{className:'dcb-file-error',role:'alert'},h('strong',null,'暂时无法预览'),view.error,h('div',null,h('button',{onClick:load},'重试'),h('button',{onClick:openNative},'用 DSH 打开')))
    else if(file){
      if(view.mode==='source')content=h('div',{className:'dcb-file-viewer-content'},code(file.text||'',file.ext))
      else if(file.kind==='html')content=h('iframe',{title:name,srcDoc:htmlDocument(file.text),sandbox:'allow-scripts',referrerPolicy:'no-referrer'})
      else if(file.kind==='image')content=h('img',{src:file.url,alt:name})
      else if(file.kind==='csv'){
        const table=csvPreview(file.text)
        content=h('div',{className:'dcb-file-table'},h('table',null,h('thead',null,h('tr',null,table.rows[0]?.map((cell,i)=>h('th',{key:i},cell)))),h('tbody',null,table.rows.slice(1).map((row,i)=>h('tr',{key:i},row.map((cell,j)=>h('td',{key:j},cell)))))),table.truncated&&h('p',{className:'dcb-file-loading'},'仅显示前 500 行。'))
      }else if(file.kind==='markdown')content=h('article',{className:'dcb-file-viewer-content'},MarkdownText?h(MarkdownText,{text:file.text,streaming:false}):h('pre',null,file.text))
      else{let text=file.text;if(file.kind==='json')try{text=JSON.stringify(JSON.parse(text),null,2)}catch{}content=h('div',{className:'dcb-file-viewer-content'},code(text,file.ext))}
    }
    return createPortal(h('aside',{className:'dcb-file-viewer',ref:node,role:'region','aria-label':'文件预览','aria-hidden':!view.open,inert:!view.open,'data-state':view.open?'open':'closing',style:{width:`${view.width}px`},onKeyDown:event=>{if(event.key==='Escape'){event.stopPropagation();close()}}},
      h('div',{className:'dcb-file-resizer',role:'separator','aria-label':'调整预览宽度',tabIndex:0,'aria-orientation':'vertical','aria-valuemin':280,'aria-valuemax':Math.max(280,win.innerWidth-24),'aria-valuenow':Math.round(view.width),
        onPointerDown:event=>{if(event.button!==0)return;drag.current={x:event.clientX,width:node.current.offsetWidth};event.currentTarget.setPointerCapture(event.pointerId);node.current.setAttribute('data-dragging','')},
        onPointerMove:event=>{if(drag.current)set({width:Math.max(280,Math.min(win.innerWidth-24,drag.current.width+drag.current.x-event.clientX))})},
        onPointerUp:()=>{drag.current=null;node.current.removeAttribute('data-dragging')},
        onPointerCancel:()=>{drag.current=null;node.current?.removeAttribute('data-dragging')},
        onLostPointerCapture:()=>{drag.current=null;node.current?.removeAttribute('data-dragging')},
        onKeyDown:event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();set({width:Math.max(280,Math.min(win.innerWidth-24,view.width+(event.key==='ArrowLeft'?24:-24)))})}}}),
      h('div',{className:'dcb-file-viewer-head'},h('span',{className:'dcb-file-viewer-icon','aria-hidden':true},type?.ext.toUpperCase().slice(0,4)||'文件'),h('div',{className:'dcb-file-viewer-title'},h('strong',{title:name},name),h('small',null,`${type?.label||'文件'} · 输出预览`)),h('button',{className:'dcb-file-action',title:'用 DSH 打开','aria-label':'用 DSH 打开',onClick:openNative},'↗'),h('button',{className:'dcb-file-action','aria-label':'关闭文件预览',onClick:close},'×')),
      h('div',{className:'dcb-file-viewer-toolbar'},file?.kind!=='image'&&h('div',{className:'dcb-file-modes',role:'group','aria-label':'预览方式'},['preview','source'].map(mode=>h('button',{key:mode,'aria-pressed':view.mode===mode,onClick:()=>set({mode})},mode==='preview'?'预览':'源码'))),h('span',{className:'dcb-file-location',title:view.path},view.path),h('button',{className:'dcb-file-action','aria-label':'重新加载文件',onClick:load},'↻')),
      h('div',{className:'dcb-file-viewer-body',ref:body,'data-content-status':view.status},content),h('div',{className:'dcb-file-viewer-status'},view.status==='ready'?`${type?.label||'文件'} · ${file.size<1024?`${file.size} B`:`${Math.ceil(file.size/1024)} KB`}`:view.status==='loading'?'加载中':'可重试或用 DSH 打开')),doc.body)
  }
  return{View,
  available(){return !disposed&&!failed&&typeof createPortal==='function'},
  close(){if(state.present)close()},
  isOpen(sessionId){return !disposed&&state.open&&state.sessionId===sessionId},
  contains(sessionId,target){return state.present&&state.sessionId===sessionId&&!!target?.nodeType&&!!doc.querySelector('.dcb-file-viewer')?.contains(target)},
  open({sessionId,path,read,fallback}){
    if(disposed||failed||typeof createPortal!=='function'||typeof read!=='function'||!outputKind(path))return false
    if(doc.activeElement!==doc.body&&!doc.querySelector('.dcb-file-viewer')?.contains(doc.activeElement)){
      restoreFocus=doc.activeElement
      const id=restoreFocus.closest('.dcb-summary')?.id
      restoreEntry=id?Array.from(doc.querySelectorAll('[aria-controls]')).find(el=>el.getAttribute('aria-controls')===id):null
    }
    set({sessionId,path,read,fallback,present:true,open:true,width:state.width||Math.min(560,win.innerWidth-24),mode:'preview'})
    load();return true
  },fail(){
    failed=true;revision++;cleanup()
    const fallback=state.open?state.fallback:null
    set({present:false,open:false,file:null,read:null,fallback:null})
    try{fallback?.()}catch{/* The optional reader must never break its header owner. */}
  },closeForSession(sessionId){if(state.present&&state.sessionId===sessionId){cleanup();revision++;set({present:false,open:false,file:null,read:null,fallback:null})}},dispose(){disposed=true;revision++;cleanup();set({present:false,open:false,file:null,read:null,fallback:null});listeners.clear()}}
}
