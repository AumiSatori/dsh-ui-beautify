// User-authored opening animations. The source stays in a separate local
// store and runs in an opaque-origin iframe so it cannot reach the DSH DOM.
export const WELCOME_CODE_LIMIT=2*1024*1024
const DB='dsh-ui-beautify-welcome-code',STORE='opening',KEY='current'
export const welcomeCodeExample=`<style>
body{display:grid;place-items:center;background:#10141c;color:#eef3ff;font-family:system-ui,sans-serif}
main{text-align:center;padding:8vw;animation:arrive 900ms cubic-bezier(.22,1,.36,1) both}
h1{font-size:clamp(32px,11vw,160px);letter-spacing:.08em;margin:0}
p{opacity:.55;letter-spacing:.3em;font-size:clamp(11px,1.4vw,20px)}
.line{height:1px;background:#b8d5ff66;transform-origin:left;animation:grow 1300ms 200ms both}
@keyframes arrive{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}
</style><main><p>WELCOME BACK</p><h1>HARNESS</h1><div class="line"></div><p>YOUR IDEAS, IN MOTION</p></main>
<script>setTimeout(()=>window.dshWelcomeDone?.(),2400)</script>`

export function welcomeCodeDocument(source){
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}*{box-sizing:border-box}</style><script>window.dshWelcomeDone=()=>parent.postMessage({type:'dcb-welcome-done'},'*');addEventListener('error',()=>parent.postMessage({type:'dcb-welcome-error'},'*'));addEventListener('unhandledrejection',()=>parent.postMessage({type:'dcb-welcome-error'},'*'))</script>${source}`
}

export function createWelcomeCodeStore(win,{references=()=>[]}={}){
  let opening=null,db=null,disposed=false
  const open=()=>{
    if(disposed)return Promise.reject(Error('代码开屏存储已关闭'))
    if(db)return Promise.resolve(db)
    if(!opening)opening=new Promise((resolve,reject)=>{
      if(!win.indexedDB){reject(Error('当前环境无法保存代码开屏'));return}
      const request=win.indexedDB.open(DB,1)
      request.onupgradeneeded=()=>request.result.createObjectStore(STORE)
      request.onerror=()=>{opening=null;reject(Error('无法打开代码开屏存储'))}
      request.onblocked=()=>{opening=null;reject(Error('代码开屏存储被占用，请关闭其他设置窗口后重试'))}
      request.onsuccess=()=>{
        if(disposed){request.result.close();reject(Error('代码开屏存储已关闭'));return}
        db=request.result;db.onversionchange=()=>{db?.close();db=null;opening=null};resolve(db)
      }
    })
    return opening
  }
  const run=async(mode,action)=>{
    const database=await open()
    return new Promise((resolve,reject)=>{
      const tx=database.transaction(STORE,mode),request=action(tx.objectStore(STORE));let value
      request.addEventListener('success',()=>{value=request.result})
      tx.oncomplete=()=>resolve(value)
      tx.onerror=tx.onabort=()=>reject(Error('无法保存代码开屏，请检查本机可用空间'))
    })
  }
  return{
    async load(revision){
      if(revision==='')return null
      if(revision){const asset=await run('readonly',store=>store.get('asset:'+revision));if(asset)return asset}
      const current=await run('readonly',store=>store.get(KEY))
      if(revision&&current?.revision!==revision)return null
      return current?.source?current:current?.revision?run('readonly',store=>store.get('asset:'+current.revision)):null
    },
    save:asset=>run('readwrite',store=>{
      const old=store.get(KEY)
      old.onsuccess=()=>{
        if(old.result?.source&&old.result.revision)store.put(old.result,'asset:'+old.result.revision)
        const keep=new Set([...references(),old.result?.revision,asset.revision])
        const keys=store.getAllKeys();keys.onsuccess=()=>{for(const key of keys.result)if(typeof key==='string'&&key.startsWith('asset:')&&!keep.has(key.slice(6)))store.delete(key)}
        store.put(asset,'asset:'+asset.revision);store.put({revision:asset.revision},KEY)
      }
      return old
    }),
    remove:(revision,keep=[])=>run('readwrite',store=>{
      const read=store.get(KEY)
      read.onsuccess=()=>{const target=revision||read.result?.revision;if(target&&!keep.includes(target))store.delete('asset:'+target);if(read.result?.revision===target&&!keep.includes(target))store.delete(KEY)}
      return read
    }),
    dispose(){disposed=true;db?.close();db=null}
  }
}

export function inspectWelcomeCode(source,name='自定义代码开屏'){
  if(typeof source!=='string'||!source.trim())throw Error('请输入 HTML / CSS / JavaScript 代码')
  const bytes=new TextEncoder().encode(source)
  if(bytes.byteLength>WELCOME_CODE_LIMIT)throw Error('代码开屏需小于 2MB')
  if(/window\.__ModuleLoader__\.load\s*\(/.test(source))throw Error('这是 DSH 插件入口，不能当开屏文件运行；请导入独立的 HTML 动画')
  return {source,name:String(name||'自定义代码开屏').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,160)||'自定义代码开屏',size:bytes.byteLength,revision:crypto.randomUUID?.()||String(Date.now())}
}

export async function inspectWelcomeCodeFile(file){
  if(!file?.size)throw Error('请选择非空的 HTML、CSS 或 JavaScript 文件')
  if(file.size>WELCOME_CODE_LIMIT)throw Error('代码开屏需小于 2MB')
  let source=await file.text()
  if(/\.js$/i.test(file.name))source='<script>'+source.replace(/<\/script/gi,'<\\/script')+'</script>'
  else if(/\.css$/i.test(file.name))source='<style>'+source.replace(/<\/style/gi,'<\\/style')+'</style>'
  else if(!/\.html?$/i.test(file.name))throw Error('支持单文件 HTML、CSS 或 JavaScript')
  return inspectWelcomeCode(source,file.name)
}

// The code can call window.dshWelcomeDone() when its own animation is ready
// to leave. A bounded fallback keeps a forgotten demo from blocking DSH.
export function createWelcomeCodePlayer(doc,win,asset,settings,{autoplay=true,onReady=()=>{},onComplete=()=>{},onError=()=>{}}={}){
  const wrapper=doc.createElement('div');wrapper.setAttribute('data-dcb-welcome-code','')
  const frame=doc.createElement('iframe');frame.title='自定义代码开屏';frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');frame.tabIndex=-1
  let disposed=false,ended=false,ready=false,timer=0
  const finish=()=>{if(disposed||ended)return;ended=true;win.clearTimeout(timer);onComplete()}
  const fail=()=>{if(disposed||ended)return;ended=true;win.clearTimeout(timer);onError(Error('代码开屏无法运行'))}
  const message=event=>{if(event.source!==frame.contentWindow)return;if(event.data?.type==='dcb-welcome-done')finish();else if(event.data?.type==='dcb-welcome-error')fail()}
  const loaded=()=>{if(disposed||ended||ready)return;ready=true;win.clearTimeout(timer);onReady();const duration=Number.isFinite(settings?.welcomeCodeDuration)?settings.welcomeCodeDuration:3000;timer=win.setTimeout(finish,Math.min(15000,Math.max(1000,duration)))}
  frame.addEventListener('load',loaded);frame.addEventListener('error',fail);win.addEventListener('message',message)
  wrapper.append(frame)
  if(autoplay){timer=win.setTimeout(fail,1500);try{frame.srcdoc=welcomeCodeDocument(asset?.source||'')}catch{fail()}}
  return{node:wrapper,frame,dispose(){if(disposed)return;disposed=true;win.clearTimeout(timer);frame.removeEventListener('load',loaded);frame.removeEventListener('error',fail);win.removeEventListener('message',message);frame.srcdoc='about:blank';frame.remove()}}
}

// Every code revision the product still references. The store reloads a code
// whenever one of these revisions changes, so both themes stay included.
export function welcomeCodeReferences(value){
  const revisions=item=>[...Object.values(item?.welcomeCodeModes||{}).map(mode=>mode?.revision),item?.welcomeCodeRevision]
  const list=value?.welcomeThemes&&typeof value.welcomeThemes==='object'?['light','dark'].map(theme=>({...value,...value.welcomeThemes[theme]})):[value]
  return [...new Set(list.flatMap(revisions).filter(Boolean))]
}
