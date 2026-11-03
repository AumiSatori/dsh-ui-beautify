const MENU_ITEMS = [
  ['open', '打开', '📄'],
  ['openWith', '打开方式', '🧩'],
  ['copyFile', '复制文件', '📑'],
  ['copy', '复制路径', '📋'],
  ['reveal', '打开文件位置', '📂'],
  ['rename', '重命名', '✏️'],
  ['delete', '删除', '🗑️'],
  ['properties', '属性', 'ℹ️'],
]

export const fileContextMenuCss = `
  .dcb-file-menu-host { display: contents; }
  .dcb-file-context-items,.dcb-file-context-status { animation:dcb-file-context-enter 180ms cubic-bezier(.22,.8,.26,1); }
  .dcb-file-context-label { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dcb-file-context-default { color:#6f7784; font-size:11px; }
  .dcb-file-context-menu { position:fixed; z-index:2147483000; width:216px; max-width:calc(100vw - 16px); max-height:calc(100vh - 16px); overflow-y:auto; padding:6px; border:1px solid #ffffffa8; border-radius:14px; background:rgba(249,250,252,.96); color:#252a31; box-shadow:0 16px 48px #1721362e,inset 0 1px 0 #fff; backdrop-filter:blur(16px) saturate(1.18); font:13px/20px system-ui,sans-serif; transform-origin:top left; animation:dcb-file-context-enter 180ms cubic-bezier(.22,.8,.26,1); }
  .dcb-file-context-menu,.dcb-file-context-menu * { box-sizing:border-box; }
  .dcb-file-context-menu[data-closing] { pointer-events:none; animation:dcb-file-context-leave 180ms cubic-bezier(.4,0,.2,1) both; }
  .dcb-file-context-head { padding:5px 8px 7px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#6f7784; font-size:11px; }
  .dcb-file-context-menu button { display:flex; align-items:center; gap:9px; width:100%; min-height:32px; margin:0; padding:5px 8px; border:0; border-radius:8px; background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer; }
  .dcb-file-context-menu button:hover:not(:disabled),.dcb-file-context-menu button:focus-visible { background:#202a3c10; outline:none; }
  .dcb-file-context-menu button:active:not(:disabled) { transform:scale(.985); }
  .dcb-file-context-menu button:disabled { color:#9aa1ac; cursor:default; }
  .dcb-file-context-icon { display:grid; place-items:center; width:18px; flex:none; color:#6f7886; font-size:15px; }
  .dcb-file-context-menu [data-danger] { color:#b33b4a; }
  .dcb-file-context-menu [data-danger] .dcb-file-context-icon { color:inherit; }
  .dcb-file-context-separator { height:1px; margin:5px 4px; background:#202a3c16; }
  .dcb-file-context-status { margin:4px 6px 2px; padding:6px 8px; border-radius:8px; background:#202a3c08; color:#707987; font-size:11px; line-height:16px; }
  .dcb-file-context-form { display:grid; gap:6px; padding:2px 2px 0; }
  .dcb-file-context-input { width:100%; height:32px; padding:0 9px; border:1px solid #202a3c24; border-radius:8px; background:#fff; color:inherit; font:inherit; outline:none; transition:border-color 180ms cubic-bezier(.22,.8,.26,1),box-shadow 180ms cubic-bezier(.22,.8,.26,1); }
  .dcb-file-context-input:focus { border-color:var(--dsh-settings-accent,var(--dsw-alias-state-info-primary,#5b5bf6)); box-shadow:0 0 0 3px color-mix(in srgb,var(--dsh-settings-accent,var(--dsw-alias-state-info-primary,#5b5bf6)) 22%,transparent); }
  .dcb-file-context-prompt { padding:4px 8px 2px; color:inherit; font-size:12px; line-height:18px; overflow-wrap:anywhere; }
  .dcb-file-context-hint { padding:0 8px 4px; color:#707987; font-size:11px; line-height:16px; }
  .dcb-file-context-actions { display:flex; gap:6px; }
  .dcb-file-context-menu .dcb-file-context-actions button { justify-content:center; text-align:center; }
  .dcb-file-context-menu .dcb-file-context-actions [data-primary] { background:var(--dsh-settings-accent,var(--dsw-alias-state-info-primary,#5b5bf6)); color:#fff; }
  .dcb-file-context-menu .dcb-file-context-actions [data-primary][data-danger] { background:#c2414f; color:#fff; }
  .dcb-file-context-menu .dcb-file-context-actions [data-primary]:hover:not(:disabled),.dcb-file-context-menu .dcb-file-context-actions [data-primary]:focus-visible { background:var(--dsh-settings-accent,var(--dsw-alias-state-info-primary,#5b5bf6)); filter:brightness(1.06); box-shadow:0 0 0 3px #202a3c1c; }
  .dcb-file-context-menu .dcb-file-context-actions [data-primary][data-danger]:hover:not(:disabled),.dcb-file-context-menu .dcb-file-context-actions [data-primary][data-danger]:focus-visible { background:#c2414f; }
  .dcb-file-context-menu .dcb-file-context-actions [data-primary]:disabled { opacity:.55; color:#fff; }
  body[data-ds-dark-theme] .dcb-file-context-input { border-color:#ffffff24; background:#ffffff0d; }
  body[data-ds-dark-theme] .dcb-file-context-hint { color:#aeb8c6; }
  body[data-ds-dark-theme] .dcb-file-context-menu { border-color:#ffffff2c; background:rgba(31,35,43,.97); color:#e7ebf1; box-shadow:0 16px 48px #0009,inset 0 1px 0 #ffffff12; }
  body[data-ds-dark-theme] .dcb-file-context-head,.dcb-file-context-menu button:disabled { color:#9da7b6; }
  body[data-ds-dark-theme] .dcb-file-context-menu button:hover:not(:disabled),body[data-ds-dark-theme] .dcb-file-context-menu button:focus-visible { background:#ffffff12; }
  body[data-ds-dark-theme] .dcb-file-context-separator { background:#ffffff1c; }
  body[data-ds-dark-theme] .dcb-file-context-status { background:#ffffff0d; color:#aeb8c6; }
  @keyframes dcb-file-context-enter { from { opacity:0; transform:translateY(-6px) scale(.94); filter:blur(2px); } to { opacity:1; transform:none; filter:blur(0); } }
  @keyframes dcb-file-context-leave { from { opacity:1; transform:none; filter:blur(0); } to { opacity:0; transform:translateY(-6px) scale(.94); filter:blur(2px); } }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { .dcb-file-context-menu,.dcb-file-context-items,.dcb-file-context-status { animation:none; } }
  @media(forced-colors:active) { .dcb-file-context-menu { border:1px solid CanvasText; background:Canvas; color:CanvasText; box-shadow:none; backdrop-filter:none; } .dcb-file-context-menu button:hover:not(:disabled),.dcb-file-context-menu button:focus-visible { background:Highlight; color:HighlightText; } .dcb-file-context-input { border-color:CanvasText; background:Canvas; color:CanvasText; box-shadow:none; } .dcb-file-context-menu .dcb-file-context-actions [data-primary] { border:1px solid ButtonText; background:ButtonFace; color:ButtonText; filter:none; } }
  @media(prefers-reduced-motion:reduce) { .dcb-file-context-input { transition:none; } }
`

const fileName = path => String(path || '').replaceAll('\\', '/').split('/').at(-1) || '文件'

export function createFileContextMenu(React, doc, win, {createPortal} = {}) {
  const h = React.createElement
  return function FileContextMenu({file, children, request, onOpen, onOpenWith, onOpenWithApplication, onCopyFile, onCopy, onReveal, onRename, onDelete, onProperties}) {
    const [point, setPoint] = React.useState(null)
    const [status, setStatus] = React.useState('')
    const [busy, setBusy] = React.useState('')
    const [applications, setApplications] = React.useState(null)
    const [mode, setMode] = React.useState(null)
    const [draft, setDraft] = React.useState('')
    const input = React.useRef(null)
    const [size, setSize] = React.useState({width:216,height:360})
    const menu = React.useRef(null)
    const [closing,setClosing] = React.useState(false), exitTimer = React.useRef(0)
    const operation = React.useRef(0), pending = React.useRef(false), mounted = React.useRef(false)
    const reset = React.useCallback(() => { win.clearTimeout(exitTimer.current);setClosing(false);setPoint(null);setStatus('');setBusy('');setApplications(null);setMode(null) }, [])
    const close = React.useCallback(() => { operation.current++;pending.current=false;if(win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches){reset();return}setClosing(true);win.clearTimeout(exitTimer.current);exitTimer.current=win.setTimeout(reset,180) }, [reset])
    React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;operation.current++;win.clearTimeout(exitTimer.current)}},[])
    React.useLayoutEffect(()=>{operation.current++;pending.current=false;reset()},[file?.path,reset])
    React.useLayoutEffect(()=>{if(!request)return;operation.current++;pending.current=false;reset();setPoint({x:request.x,y:request.y})},[request,reset])
    React.useLayoutEffect(()=>{if(!point||!menu.current)return;const {offsetWidth:width,offsetHeight:height}=menu.current;setSize(value=>value.width===width&&value.height===height?value:{width,height})},[point,status,applications,busy,mode])
    React.useEffect(() => {
      if (!point || closing) return undefined
      const outside = event => { if (!menu.current?.contains(event.target)) close() }
      // Escape steps back out of a sub-view before it closes the whole menu.
      const escape = event => { if (event.key !== 'Escape') return; event.preventDefault(); event.stopPropagation(); if ((mode||applications)&&!pending.current) { setMode(null);setApplications(null);setStatus('') } else close() }
      const reposition = () => setPoint(value => value ? {...value} : value)
      doc.addEventListener('pointerdown', outside, true)
      doc.addEventListener('keydown', escape, true)
      win.addEventListener('resize', reposition)
      win.addEventListener('scroll', reposition, true)
      const first = menu.current?.querySelector('button:not(:disabled)')
      if(!menu.current?.contains(doc.activeElement))first?.focus({preventScroll:true})
      return () => { doc.removeEventListener('pointerdown', outside, true); doc.removeEventListener('keydown', escape, true); win.removeEventListener('resize', reposition); win.removeEventListener('scroll', reposition, true) }
    }, [point, applications, mode, closing, close])
    React.useLayoutEffect(()=>{if(mode!=='rename'||!input.current)return;const field=input.current,stem=field.value.lastIndexOf('.');field.focus({preventScroll:true});field.setSelectionRange(0,stem>0?stem:field.value.length)},[mode])
    React.useLayoutEffect(()=>{if(point&&!busy&&!menu.current?.contains(doc.activeElement))menu.current?.querySelector('button:not(:disabled)')?.focus({preventScroll:true})},[point,busy,applications,mode])
    const run = async (kind, callback) => {
      if (!callback||pending.current) return
      pending.current=true;const token=++operation.current;setBusy(kind);setStatus('')
      const current=()=>mounted.current&&operation.current===token
      try {
        const result = await callback(file)
        if(!current())return
        if(kind==='rename'||kind==='delete')setMode(null)
        if(kind==='openWith'&&Array.isArray(result))setApplications(result)
        else if (typeof result === 'string' && result) setStatus(result)
        else close()
      } catch (error) { if(current())setStatus(error?.message || '操作失败，请重试。') }
      finally{if(current()){pending.current=false;setBusy('')}}
    }
    const open = event => {
      event.preventDefault();event.stopPropagation();operation.current++;pending.current=false;reset()
      const box=event.currentTarget.getBoundingClientRect(),pointer=Number.isFinite(event.clientX)&&Number.isFinite(event.clientY)&&(event.clientX!==0||event.clientY!==0)
      setPoint({x:pointer?event.clientX:box.left+8,y:pointer?event.clientY:box.bottom})
    }
    const keyboard=event=>{if(event.target===input.current)return;const controls=[...menu.current.querySelectorAll('button:not(:disabled)')],index=controls.indexOf(doc.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();controls[event.key==='Home'?0:event.key==='End'?controls.length-1:(index+(event.key==='ArrowDown'?1:-1)+controls.length)%controls.length]?.focus()}else if((applications||mode)&&!pending.current&&['ArrowLeft','Backspace'].includes(event.key)){event.preventDefault();setApplications(null);setMode(null);setStatus('')}}
    const name = fileName(file?.path)
    // Swap views after the click finishes: removing the clicked button mid-event
    // makes host popovers read the click as outside and close the whole menu.
    const swap = update => { const token=operation.current; win.setTimeout(()=>{ if(mounted.current&&operation.current===token)update() },0) }
    const back = () => { if(pending.current)return;swap(()=>{setApplications(null);setMode(null);setStatus('')}) }
    const backButton = h('button',{type:'button',role:'menuitem',disabled:!!busy,onClick:back},h('span',{className:'dcb-file-context-icon','aria-hidden':true},'‹'),h('span',null,'返回文件操作'))
    const choose = kind => { setStatus(''); swap(()=>{ if(kind==='rename')setDraft(name); setMode(kind) }) }
    const submitRename = event => { event.preventDefault(); const next=draft.trim(); if(!next||busy)return; if(next===name){back();return} run('rename',()=>onRename(file,next)) }
    const subview = mode==='rename'?h('form',{className:'dcb-file-context-form','aria-label':'重命名文件',onSubmit:submitRename},
        h('input',{ref:input,className:'dcb-file-context-input',type:'text','aria-label':'新文件名',value:draft,maxLength:255,spellCheck:false,autoComplete:'off',disabled:!!busy,onChange:event=>{setDraft(event.target.value);setStatus('')}}),
        h('div',{className:'dcb-file-context-actions'},
          h('button',{type:'button',disabled:!!busy,onClick:back},'取消'),
          h('button',{type:'submit','data-primary':true,disabled:!!busy||!draft.trim()},busy==='rename'?'正在重命名…':'重命名')))
      :mode==='delete'?h(React.Fragment,null,
        h('div',{className:'dcb-file-context-prompt'},`将“${name}”移到回收站？`),
        h('div',{className:'dcb-file-context-hint'},'之后可在 Windows 回收站中还原。'),
        h('div',{className:'dcb-file-context-actions'},
          h('button',{type:'button',disabled:!!busy,onClick:back},'取消'),
          h('button',{type:'button','data-primary':true,'data-danger':true,disabled:!!busy,onClick:()=>run('delete',onDelete)},busy==='delete'?'正在删除…':'移到回收站')))
      :null
    const menuNode = point && h('div', {className:'dcb-file-context-menu',ref:menu,role:'menu','aria-label':`${name} 文件操作`,'aria-busy':!!busy,'data-closing':closing||undefined,'aria-hidden':closing||undefined,inert:closing||undefined,style:{left:Math.max(8,Math.min(point.x,win.innerWidth-size.width-8)),top:Math.max(8,Math.min(point.y,win.innerHeight-size.height-8))},onKeyDown:keyboard,onContextMenu:event=>event.preventDefault()},
      h('div',{className:'dcb-file-context-head',title:file?.path},name),
      h('div',{className:'dcb-file-context-items',key:applications?'applications':mode||'actions'},mode?subview:applications?h(React.Fragment,null,
        backButton,
        applications.map(application=>h('button',{key:application.id,type:'button',role:'menuitem',title:application.name,disabled:!!busy||!onOpenWithApplication,onClick:()=>run('application',()=>onOpenWithApplication(file,application.id))},h('span',{className:'dcb-file-context-icon','aria-hidden':true},'▣'),h('span',{className:'dcb-file-context-label'},application.name),application.default&&h('span',{className:'dcb-file-context-default'},'默认')))):
      MENU_ITEMS.map(([kind,label,icon]) => {const callback={open:onOpen,openWith:onOpenWith,copyFile:onCopyFile,copy:onCopy,reveal:onReveal,rename:onRename,delete:onDelete,properties:onProperties}[kind];return h(React.Fragment,{key:kind},kind==='rename'&&h('div',{className:'dcb-file-context-separator','aria-hidden':true}),h('button',{type:'button',role:'menuitem',disabled:!!busy||!callback,'data-danger':kind==='delete'||undefined,onClick:()=>kind==='rename'||kind==='delete'?choose(kind):run(kind,callback)},h('span',{className:'dcb-file-context-icon','aria-hidden':true},icon),h('span',null,busy===kind?(kind==='copyFile'?'正在复制…':'正在处理…'):label)))})),
      status&&h('div',{className:'dcb-file-context-status',role:'status','aria-live':'polite'},status))
    const trigger = React.isValidElement(children) ? React.cloneElement(children, {onContextMenu:event => { children.props?.onContextMenu?.(event); if (!event.defaultPrevented) open(event) }}) : children
    return h(React.Fragment,null,trigger,menuNode&&typeof createPortal==='function'?createPortal(menuNode,doc.body):menuNode)
  }
}
