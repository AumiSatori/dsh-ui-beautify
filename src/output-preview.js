import {motion} from './motion.js'

const MAX_HTML_BYTES=512*1024
export const isHtmlOutput=path=>/\.x?html?$/i.test(String(path))
const absolutePath=path=>typeof path==='string'&&/^(?:[a-z]:[/\\]|\/|\\\\)/i.test(path)&&!path.includes('\0')

// The companion exposes browser hooks, not a required loader module. Inspect
// them at the moment of use so either load order and standalone users work.
export function createOutputPreviewBridge(doc,win,viewer){
  const listeners=new Set()
  let available=false,disposed=false
  const hooks=()=>{
    try{return typeof win.__dshOpenFilePreview==='function'&&typeof win.__dshCanPreviewPath==='function'}catch{return false}
  }
  const sync=()=>{
    if(disposed)return
    const next=hooks()
    if(next!==available){available=next;for(const listener of listeners)listener()}
  }
  const supports=path=>{
    try{return hooks()&&win.__dshCanPreviewPath(path)===true}catch{return false}
  }
  // The companion appends its CSS and panel before assigning its hooks.
  // Recheck after that task; do not poll or watch the conversation subtree.
  const observer=new win.MutationObserver(()=>win.queueMicrotask(sync))
  if(doc.head)observer.observe(doc.head,{childList:true})
  if(doc.body)observer.observe(doc.body,{childList:true})
  win.addEventListener('focus',sync);doc.addEventListener('visibilitychange',sync)
  sync()
  return {
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},
    getSnapshot:()=>available,supports,sync,
    async open(sessionId,path,resolve,fallback,read){
      sync()
      if(!disposed&&supports(path)){
        if(viewer){
          try{if(viewer.open({sessionId,path,read,fallback:()=>fallback(path)})!==false)return}catch{}
          return fallback(path)
        }
        try{
          const resolved=absolutePath(path)?path:await resolve?.(sessionId,path)
          if(!disposed&&absolutePath(resolved)&&supports(resolved)){
            const result=await win.__dshOpenFilePreview(resolved)
            if(result!==false)return
          }
        }catch{/* Retain the host's exact session route on unavailable previews. */}
      }
      if(!disposed)return fallback(path)
    },
    dispose(){disposed=true;observer.disconnect();win.removeEventListener('focus',sync);doc.removeEventListener('visibilitychange',sync);listeners.clear()},
  }
}

export function outputPreviewReader(binding,sessionId){
  return async(path,signal)=>{
    const face=binding.current
    if(!face)return null
    const stat=await face.stat(sessionId,path,signal)
    if(!stat?.ok||!Number.isFinite(Number(stat.value?.bytes))||Number(stat.value.bytes)>MAX_HTML_BYTES)return null
    const file=await face.readBytes(sessionId,path,{},signal)
    if(!file?.ok||!file.value?.data)return null
    const bytes=file.value.data instanceof Uint8Array?file.value.data:Uint8Array.from(file.value.data)
    if(bytes.byteLength>MAX_HTML_BYTES)return null
    return new TextDecoder('utf-8',{fatal:true}).decode(bytes)
  }
}

export function htmlPreviewDocument(source){
  // This small cover is static; the full-size reader owns interaction.
  // The cover has no origin, scripts, navigation or network.
  const policy="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
  return `<!doctype html><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer"><style>html{overflow:hidden;scrollbar-width:none}body{margin:0}*{animation-play-state:paused!important;transition:none!important}</style>${source}`
}

export const outputPreviewCss=`
  .dcb-artifact { position: relative; overflow: hidden; margin: 8px 0; border: 1px solid var(--dcb-content-border, #dedede); border-radius: 10px; background: var(--dcb-content-tile, #fff); }
  .dcb-artifact-cover { display: block; position: relative; overflow: hidden; aspect-ratio: 2 / 1; background: #fff; color: #333; pointer-events: none; }
  .dcb-artifact-cover iframe { display: block; position: absolute; top: 0; left: 0; width: 640px; height: 320px; border: 0; transform-origin: top left; pointer-events: none; }
  .dcb-artifact-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 100%; background: linear-gradient(135deg, #fafafa, #ececec); color: #777; font-size: 12px; }
  .dcb-artifact-placeholder b { font-size: 28px; line-height: 1; font-weight: 500; }
  .dcb-artifact .dcb-artifact-open { position: static; display: flex; width: 100%; gap: 10px; margin: 0; padding: 10px; border-radius: 0; text-align: left; }
  .dcb-artifact-open::after { content: ''; position: absolute; inset: 0; }
  .dcb-artifact-caption { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
  .dcb-artifact-caption > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dcb-artifact-caption small { color: var(--dcb-ink-muted, #888); font-size: 11px; line-height: 16px; }
  .dcb-artifact-cover[data-ready] { animation: dcb-artifact-reveal ${motion.time.standard}ms ${motion.ease.smooth}; }
  @keyframes dcb-artifact-reveal { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  body[data-ds-dark-theme] .dcb-artifact { border-color: var(--dcb-content-border, #454545); background: var(--dcb-content-tile, #292929); }
  body[data-ds-dark-theme] .dcb-artifact-placeholder { background: linear-gradient(135deg, #303030, #202020); color: #bbb; }
  @media(prefers-reduced-motion:reduce), (forced-colors:active) { .dcb-artifact-cover[data-ready] { animation: none; } }
  @media(forced-colors:active) { .dcb-artifact { border: 1px solid CanvasText; } }
`

export function createOutputArtifact(React,win){
  const h=React.createElement
  return function OutputArtifact({file,sessionId,readPreview,onOpen,active}){
    const key=`${sessionId}\0${file.path}\0${file.seq??''}`
    const [preview,setPreview]=React.useState(null),cover=React.useRef(null)
    const source=preview?.key===key?preview.source:null
    React.useEffect(()=>{
      if(!active||!readPreview||preview?.key===key)return
      const abort=new win.AbortController();let live=true
      Promise.resolve().then(()=>readPreview(file.path,abort.signal)).then(source=>{if(live)setPreview({key,source})},()=>{if(live)setPreview({key,source:null})})
      return()=>{live=false;abort.abort()}
    },[key,readPreview,active])
    React.useLayoutEffect(()=>{
      const node=cover.current
      if(!node)return
      const resize=new win.ResizeObserver(()=>{
        const frame=node.querySelector('iframe')
        if(frame)frame.style.transform=`scale(${node.clientWidth/640})`
      })
      resize.observe(node)
      return()=>resize.disconnect()
    },[source])
    const name=String(file.path).replaceAll('\\','/').split('/').at(-1)
    return h('div',{className:'dcb-artifact','data-preview-state':source?'ready':preview?.key===key?'unavailable':'pending'},
      h('span',{className:'dcb-artifact-cover',ref:cover,'aria-hidden':true,'data-ready':source?'':undefined},
        source?h('iframe',{srcDoc:htmlPreviewDocument(source),sandbox:'',tabIndex:-1,inert:true,loading:'lazy',title:`${name} 静态预览`}):
          h('span',{className:'dcb-artifact-placeholder'},h('b',null,'</>'),h('span',null,'HTML 网页'))),
      h('button',{type:'button',className:'dcb-output dcb-artifact-open',title:file.description||name,'aria-label':`${name}，打开预览`,onClick:()=>onOpen(file.path)},
        h('span',{className:'dcb-artifact-caption'},h('span',null,name.replace(/\.x?html?$/i,'')),h('small',null,'HTML · 预览')),h('span',{'aria-hidden':true},'↗')))
  }
}
