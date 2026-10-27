import {motion} from './motion.js'

// Presets are independent complete snapshots. They are deliberately not part
// of settings-transfer's asset whitelist, avoiding recursive backups.
export function createSettingsPresets(win,transfer){
  const open=()=>new Promise((resolve,reject)=>{
    if(!win.indexedDB){reject(Error('本机预设存储不可用。'));return}
    const request=win.indexedDB.open('dsh-ui-beautify-presets',1)
    request.onupgradeneeded=()=>request.result.createObjectStore('presets',{keyPath:'id'})
    request.onsuccess=()=>resolve(request.result)
    request.onerror=()=>reject(Error('无法打开本机预设存储。'))
    request.onblocked=()=>reject(Error('预设存储被其他窗口占用，请关闭其他设置窗口后重试。'))
  })
  async function transaction(mode,action){
    const db=await open()
    try{return await new Promise((resolve,reject)=>{
      const tx=db.transaction('presets',mode),store=tx.objectStore('presets');let request
      try{request=action(store)}catch(error){tx.abort();reject(error);return}
      tx.oncomplete=()=>resolve(request?.result)
      tx.onerror=tx.onabort=()=>reject(Error('预设保存失败，请检查本机存储空间后重试。'))
    })}finally{db.close()}
  }
  const get=id=>transaction('readonly',store=>store.get(id))
  const validName=value=>{const name=String(value||'').trim();if(!name||name.length>40)throw Error('请输入 1 至 40 个字符的预设名称。');return name}
  return {
    async list(){return (await transaction('readonly',store=>store.getAll())).sort((a,b)=>b.createdAt-a.createdAt).map(({id,name,createdAt,blob})=>({id,name,createdAt,size:blob.size}))},
    async save(name){name=validName(name);const {blob}=await transfer.exportFile(true);const id=win.crypto.randomUUID();await transaction('readwrite',store=>store.add({id,name,createdAt:Date.now(),blob}));return id},
    async rename(id,name){name=validName(name);const item=await get(id);if(!item)throw Error('预设已不存在，请刷新列表。');await transaction('readwrite',store=>store.put({...item,name}))},
    async remove(id){await transaction('readwrite',store=>store.delete(id))},
    async apply(id){if(id==='builtin-default')return transfer.applyDefaults();const item=await get(id);if(!item)throw Error('预设已不存在，请刷新列表。');const plan=await transfer.inspect(item.blob);return transfer.apply(plan,{preserveNavigation:true})},
  }
}

export const settingsPresetsCss=`
 .dcb-presets { margin:0 0 20px; padding:20px; border:1px solid var(--dsh-settings-border); border-radius:14px; background:var(--dsh-settings-surface); }
 .dcb-presets h2 { margin:0; font:600 16px/1.4 system-ui,sans-serif; color:var(--dsh-settings-text); }
 .dcb-presets p { margin:6px 0; color:var(--dsh-settings-secondary); font:12px/1.6 system-ui,sans-serif; }
 .dcb-presets-form,.dcb-preset-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
 .dcb-presets-form { margin:16px 0; }
 .dcb-presets input { box-sizing:border-box; flex:1 1 180px; min-width:0; min-height:44px; padding:9px 12px; border:1px solid var(--dsh-settings-border); border-radius:10px; background:transparent; color:var(--dsh-settings-text); font:13px system-ui,sans-serif; }
 .dcb-presets input:focus { outline:none; border-color:var(--dsh-settings-text); box-shadow:0 0 0 3px #8882; }
 .dcb-presets button { min-height:44px; padding:9px 13px; border:1px solid var(--dsh-settings-border); border-radius:10px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); font:500 13px system-ui,sans-serif; cursor:pointer; transition:background-color 180ms ${motion.ease.color},transform 180ms ${motion.ease.smooth}; }
 .dcb-presets button:hover:enabled { background:var(--dsh-settings-subtle); }
 .dcb-presets button:active:enabled { transform:scale(.94); }
 .dcb-presets button:focus-visible { outline:2px solid #888; outline-offset:2px; }
 .dcb-presets button:disabled { opacity:.45; cursor:default; }
 .dcb-presets button[data-primary] { background:var(--dsh-settings-text); color:var(--dsh-settings-surface); }
 .dcb-presets button[data-primary]:hover:enabled { background:color-mix(in srgb, var(--dsh-settings-text) 88%, var(--dsh-settings-surface)); color:var(--dsh-settings-surface); }
 .dcb-preset-list { display:grid; gap:8px; }
 .dcb-preset-item { box-sizing:border-box; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px; padding:10px 12px; overflow:hidden; border:1px solid var(--dsh-settings-border); border-radius:12px; background:var(--dsh-settings-subtle); animation:dcb-preset-in 240ms cubic-bezier(.22,.8,.26,1) both; }
 .dcb-preset-copy { flex:1 1 160px; min-width:0; overflow-wrap:anywhere; color:var(--dsh-settings-text); font:600 13px system-ui,sans-serif; }
 .dcb-preset-copy p { font-weight:400; }
 .dcb-preset-actions button { min-height:40px; }
 .dcb-presets [role=alert] { color:var(--dsw-alias-state-error-primary,#c34b4b); }
 @keyframes dcb-preset-in { from {opacity:0;transform:translateY(8px);filter:blur(3px)} to {opacity:1;transform:none;filter:blur(0)} }
 @media(prefers-reduced-motion:reduce) { .dcb-preset-item { animation:none } .dcb-presets button { transition:none } }
 @media(forced-colors:active) { .dcb-presets,.dcb-preset-item { border-color:CanvasText;background:Canvas;color:CanvasText } .dcb-presets button,.dcb-presets button[data-primary],.dcb-presets button[data-primary]:hover:enabled { background:ButtonFace;color:ButtonText;border-color:ButtonText } }
`

export function createSettingsPresetsUI(React,win){
  const h=React.createElement
  return function SettingsPresets({manager,transfer}){
    const [items,setItems]=React.useState([]),[name,setName]=React.useState(''),[busy,setBusy]=React.useState(false),[error,setError]=React.useState(''),[notice,setNotice]=React.useState(''),[editing,setEditing]=React.useState(null),[editName,setEditName]=React.useState(''),[deleting,setDeleting]=React.useState(null),[reload,setReload]=React.useState(()=>transfer.status().reload)
    const live=React.useRef(false),gate=React.useRef(false)
    const refresh=async()=>{const result=await manager.list();if(live.current)setItems(result)}
    React.useEffect(()=>{live.current=true;refresh().catch(e=>{if(live.current)setError(e.message)});return()=>{live.current=false}},[])
    React.useEffect(()=>transfer.subscribe(()=>setReload(transfer.status().reload)),[transfer])
    const run=async action=>{if(gate.current)return;gate.current=true;setBusy(true);setError('');setNotice('');try{await action()}catch(e){if(live.current)setError(e.message||'预设处理失败。')}finally{gate.current=false;if(live.current)setBusy(false)}}
    const save=()=>run(async()=>{await manager.save(name);if(live.current){setName('');await refresh();setNotice('已保存当前配置。')}})
    const apply=item=>run(async()=>{const result=await manager.apply(item.id);if(live.current){setReload(result.reload);setNotice(result.reload?`已切换至“${item.name}”，刷新界面后完整加载素材。`:`已切换至“${item.name}”。`)}})
    const rename=item=>run(async()=>{await manager.rename(item.id,editName);if(live.current){setEditing(null);await refresh();setNotice('预设名称已更新。')}})
    const remove=(item,event)=>run(async()=>{
      const node=event.currentTarget.closest('.dcb-preset-item')
      let animation
      if(node&&!win.matchMedia('(prefers-reduced-motion: reduce)').matches){const height=node.getBoundingClientRect().height;try{animation=node.animate([{height:height+'px',opacity:1,transform:'translateY(0)',filter:'blur(0)',paddingBlock:'10px'},{height:'0px',opacity:0,transform:'translateY(-8px)',filter:'blur(3px)',paddingBlock:'0px'}],{duration:220,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});await animation.finished}catch{}}
      try{await manager.remove(item.id);if(live.current){setDeleting(null);await refresh();setNotice('预设已删除。')}}catch(error){animation?.cancel();throw error}
    })
    return h('section',{className:'dcb-presets','aria-label':'配置预设','aria-busy':busy},
      h('h2',null,'配置预设'),h('p',null,'为当前美化设置和素材保存一份本机预设；切换时会替换当前设置，素材变化可能需要刷新。每份预设最多 512 MB，素材越多占用空间越大。'),
      h('div',{className:'dcb-presets-form'},h('input',{value:name,maxLength:40,placeholder:'为当前配置命名','aria-label':'预设名称',disabled:busy,onChange:e=>setName(e.target.value),onKeyDown:e=>{if(e.key==='Enter')save()}}),h('button',{type:'button','data-primary':'',disabled:busy,onClick:save},busy?'处理中…':'保存当前预设')),
      h('div',{className:'dcb-preset-list'},[{id:'builtin-default',name:'默认值',builtin:true},...items].map(item=>h('div',{className:'dcb-preset-item',key:item.id},
        h('div',{className:'dcb-preset-copy'},editing===item.id?h('input',{value:editName,maxLength:40,'aria-label':'修改预设名称',onChange:e=>setEditName(e.target.value),onKeyDown:e=>{if(e.key==='Enter')rename(item);if(e.key==='Escape')setEditing(null)}}):item.name,h('p',null,item.builtin?'内置默认配置 · 保留已导入素材':new Date(item.createdAt).toLocaleString()+' · '+(item.size>=1048576?(item.size/1048576).toFixed(1)+' MB':Math.ceil(item.size/1024)+' KB'))),
        h('div',{className:'dcb-preset-actions'},editing===item.id?[h('button',{key:'save',type:'button',disabled:busy,onClick:()=>rename(item)},'保存名称'),h('button',{key:'cancel',type:'button',disabled:busy,onClick:()=>setEditing(null)},'取消')]:deleting===item.id?[h('button',{key:'confirm',type:'button',disabled:busy,onClick:e=>remove(item,e)},'确认删除'),h('button',{key:'cancel',type:'button',disabled:busy,onClick:()=>setDeleting(null)},'取消')]:[h('button',{key:'apply',type:'button','data-primary':'',disabled:busy,onClick:()=>apply(item),'aria-label':`切换到 ${item.name}`},'切换'),!item.builtin&&h('button',{key:'rename',type:'button',disabled:busy,onClick:()=>{setEditName(item.name);setEditing(item.id)},'aria-label':`重命名 ${item.name}`},'重命名'),!item.builtin&&h('button',{key:'delete',type:'button',disabled:busy,onClick:()=>setDeleting(item.id),'aria-label':`删除 ${item.name}`},'删除')])))),
      error&&h('p',{role:'alert'},error),notice&&h('p',{role:'status','aria-live':'polite'},notice),reload&&h('div',{className:'dcb-preset-actions'},h('p',null,'部分素材需要刷新界面后加载。'),h('button',{type:'button',onClick:()=>win.location.reload()},'刷新界面加载素材')))
  }
}
