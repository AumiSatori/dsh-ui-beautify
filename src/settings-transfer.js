import {motion} from './motion.js'

const FORMAT='dsh-ui-beautify-config',VERSION=1,MAGIC='DSHUI01\n'
const MAIN='dsh-ui-beautify:settings:v1',WIDTH='dsh-ui-beautify:conversation-width:v1'
const NAV=['dsh-ui-beautify:settings-tab:v1','dsh-ui-beautify:settings-children:v1']
const MAX_JSON=8*1024*1024,MAX_ARCHIVE=512*1024*1024,MAX_RECORDS=10000
// Explicitly scoped to beautify-owned data. Never enumerate unrelated browser
// storage, authentication, host configuration, sessions or conversation text.
const DBS=[
  {name:'dsh-ui-beautify-background',version:2,stores:{wallpaper:null,assets:null}},
  {name:'dsh-ui-beautify-welcome',version:1,stores:{media:null}},
  {name:'dsh-ui-beautify-welcome-code',version:1,stores:{opening:null}},
  {name:'dsh-ui-context-particles',version:1,stores:{artwork:null}},
  {name:'dsh-ui-beautify-turn-divider',version:1,stores:{art:null}},
  {name:'dsh-ui-beautify-running-packs',version:1,stores:{packs:'id',assets:'key'}},
]
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)
const safeKey=key=>!['__proto__','constructor','prototype'].includes(key)
const width=value=>typeof value==='number'&&Number.isFinite(value)&&value>0?Math.min(10000,value):null
const widths=value=>({version:1,window:width(value?.window),fullscreen:width(value?.fullscreen)})
const date=()=>new Date().toISOString()
const prettySize=size=>size>=1048576?`${(size/1048576).toFixed(1)} MB`:`${Math.ceil(size/1024)} KB`
async function digest(blob,win){return Array.from(new Uint8Array(await win.crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),byte=>byte.toString(16).padStart(2,'0')).join('')}
function readJson(storage,key){try{return JSON.parse(storage.getItem(key))}catch{return null}}
function navigation(value){
  const pages=['panel','composer','sidebar','welcome','background','particles','running','messages','toolbar']
  const result={tab:pages.includes(value?.tab)?value.tab:'panel',children:{}}
  for(const key of ['components','global','conversation'])if(pages.includes(value?.children?.[key]))result.children[key]=value.children[key]
  return result
}
function openDB(win,spec,create=false){
  return new Promise((resolve,reject)=>{
    if(!win.indexedDB){reject(Error('本机素材存储不可用，可取消“包含本机素材”后导出配置。'));return}
    const request=create?win.indexedDB.open(spec.name,spec.version):win.indexedDB.open(spec.name)
    let absent=false,blocked=false
    request.onupgradeneeded=()=>{
      if(!create){absent=true;request.transaction.abort();return}
      for(const [name,keyPath]of Object.entries(spec.stores))if(!request.result.objectStoreNames.contains(name))request.result.createObjectStore(name,keyPath?{keyPath}:undefined)
    }
    request.onblocked=()=>{blocked=true;reject(Error('素材存储被其他窗口占用，请关闭其他设置窗口后重试。'))}
    request.onerror=()=>absent?resolve(null):reject(Error('无法读取或保存美化素材。'))
    request.onsuccess=()=>{if(blocked){request.result.close();return}resolve(request.result)}
  })
}
async function readStores(win,spec){
  const db=await openDB(win,spec);if(!db)return []
  try{return await new Promise((resolve,reject)=>{
    const stores=Object.keys(spec.stores).filter(name=>db.objectStoreNames.contains(name)),result=[]
    if(!stores.length){resolve(result);return}
    const tx=db.transaction(stores)
    for(const name of stores){const store=tx.objectStore(name),request=store.openCursor();request.onsuccess=()=>{const cursor=request.result;if(cursor){result.push({store:name,key:cursor.primaryKey,value:cursor.value});cursor.continue()}}}
    tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(Error('读取美化素材失败。'))
  })}finally{db.close()}
}
async function packValue(value,blobs,win,depth=0){
  if(depth>30)throw Error('素材数据层级过深。')
  if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return value
  if(value instanceof win.Blob){const index=blobs.length;blobs.push(value);return {type:'blob',index}}
  if(Array.isArray(value))return{type:'array',items:await Promise.all(value.map(item=>packValue(item,blobs,win,depth+1)))}
  if(plain(value)){
    const entries=[]
    for(const [key,item]of Object.entries(value)){if(!safeKey(key))throw Error('素材字段无效。');if(item!==undefined)entries.push([key,await packValue(item,blobs,win,depth+1)])}
    return{type:'object',entries}
  }
  throw Error('素材数据格式不支持。')
}
function unpackValue(value,blobs,depth=0){
  if(depth>30)throw Error('备份数据层级过深。')
  if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return value
  if(!plain(value))throw Error('备份素材格式无效。')
  if(value.type==='blob'&&Number.isInteger(value.index)&&blobs[value.index])return blobs[value.index]
  if(value.type==='array'&&Array.isArray(value.items))return value.items.map(item=>unpackValue(item,blobs,depth+1))
  if(value.type==='object'&&Array.isArray(value.entries)){
    const result={}
    for(const entry of value.entries){if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||!safeKey(entry[0])||Object.hasOwn(result,entry[0]))throw Error('备份素材字段无效。');result[entry[0]]=unpackValue(entry[1],blobs,depth+1)}
    return result
  }
  throw Error('备份素材引用无效。')
}
function validateSettings(value,normalize){
  if(!plain(value)||!Object.keys(value).some(key=>Object.hasOwn(normalize(null),key)))throw Error('文件中没有可识别的美化配置。')
  // Use exactly the runtime's normalizers: supported options only, bounded
  // numbers and CSS strings; never persist unknown keys from a downloaded file.
  return normalize(value)
}
export function createSettingsTransfer(win,{normalize,getSettings,getWidths,onApply}={}){
  let busy=false,disposed=false,undo=null,needsReload=false
  async function exclusive(run){if(disposed)throw Error('设置已关闭。');if(busy)throw Error('正在处理配置，请稍候。');busy=true;try{return await run()}finally{busy=false}}
  const cancelled=()=>{if(disposed)throw Error('设置已关闭，未应用配置。')}
  const localSnapshot=()=>[MAIN,WIDTH,...NAV].map(key=>[key,win.localStorage.getItem(key)])
  function restoreLocal(entries){for(const[key,value]of entries)value===null?win.localStorage.removeItem(key):win.localStorage.setItem(key,value)}
  async function exportFile(includeAssets=false){return exclusive(async()=>{
    const config={format:FORMAT,version:VERSION,createdAt:date(),settings:normalize(getSettings()),layout:{widths:widths(getWidths())},navigation:navigation({tab:win.localStorage.getItem(NAV[0]),children:readJson(win.localStorage,NAV[1])})}
    if(!includeAssets)return{blob:new win.Blob([JSON.stringify(config,null,2)+'\n'],{type:'application/json'}),name:`dsh-ui-config-${date().slice(0,10)}.json`,records:0}
    const blobs=[],databases=[];let count=0,total=0
    for(const spec of DBS){cancelled();const source=await readStores(win,spec),records=[];for(const record of source){if(++count>MAX_RECORDS)throw Error('素材数量过多，请分批整理后备份。');records.push({...record,value:await packValue(record.value,blobs,win)})}if(records.length)databases.push({name:spec.name,records})}
    for(const blob of blobs)total+=blob.size
    if(total>MAX_ARCHIVE)throw Error('完整备份超过 512 MB，请先导出轻量配置或减少素材。')
    const descriptors=[]
    for(const blob of blobs){cancelled();descriptors.push({size:blob.size,type:blob.type,sha256:await digest(blob,win)})}
    const manifest={...config,databases,blobs:descriptors},json=new TextEncoder().encode(JSON.stringify(manifest))
    if(json.length>MAX_JSON||total+json.length+12>MAX_ARCHIVE)throw Error('完整备份超过 512 MB，请先导出轻量配置或减少素材。')
    const header=new Uint8Array(12);header.set(new TextEncoder().encode(MAGIC));new DataView(header.buffer).setUint32(8,json.length,true)
    return{blob:new win.Blob([header,json,...blobs],{type:'application/octet-stream'}),name:`dsh-ui-backup-${date().slice(0,10)}.dshui`,records:count}
  })}
  async function inspect(file){return exclusive(async()=>{
    if(!file?.size||file.size>MAX_ARCHIVE)throw Error('配置文件为空或超过 512 MB。')
    let parsed,blobs=[],hasAssets=false
    const head=new Uint8Array(await file.slice(0,12).arrayBuffer())
    if(new TextDecoder().decode(head.slice(0,8))===MAGIC){
      if(head.length!==12)throw Error('备份文件不完整。')
      const length=new DataView(head.buffer).getUint32(8,true)
      if(!length||length>MAX_JSON||12+length>file.size)throw Error('备份目录长度无效。')
      try{parsed=JSON.parse(await file.slice(12,12+length).text())}catch{throw Error('备份目录已损坏。')}
      if(!Array.isArray(parsed.blobs)||parsed.blobs.length>MAX_RECORDS)throw Error('备份素材目录无效。')
      let at=12+length
      for(const descriptor of parsed.blobs){
        if(!Number.isSafeInteger(descriptor?.size)||descriptor.size<0||descriptor.size>256*1024*1024||typeof descriptor.type!=='string'||descriptor.type.length>100||!/^\w{64}$/.test(descriptor.sha256||'')||at+descriptor.size>file.size)throw Error('备份素材长度或校验信息无效。')
        const blob=file.slice(at,at+descriptor.size,descriptor.type);cancelled()
        if(await digest(blob,win)!==descriptor.sha256)throw Error('备份素材校验失败，文件可能已损坏。')
        blobs.push(blob);at+=descriptor.size
      }
      if(at!==file.size)throw Error('备份含未识别的数据。')
      hasAssets=true
    }else{
      if(file.size>MAX_JSON)throw Error('JSON 配置不能超过 8 MB。')
      try{parsed=JSON.parse(await file.text())}catch{throw Error('不是有效的 JSON 配置或完整备份文件。')}
    }
    if(parsed?.format!==FORMAT||parsed.version!==VERSION)throw Error('不是支持的 dsh-UI美化配置版本。')
    const settings=validateSettings(parsed.settings,normalize),databases=[],seen=new Set();let records=0
    if(hasAssets){
      if(!Array.isArray(parsed.databases)||parsed.databases.length>DBS.length)throw Error('备份素材分组无效。')
      for(const source of parsed.databases){
        const spec=DBS.find(item=>item.name===source?.name)
        if(!spec||seen.has(spec.name)||!Array.isArray(source.records))throw Error('备份包含不受支持的存储分组。');seen.add(spec.name)
        const keys=new Set(),items=[]
        for(const record of source.records){
          if(++records>MAX_RECORDS||!Object.hasOwn(spec.stores,record?.store)||typeof record.key!=='string'||!record.key||record.key.length>512)throw Error('备份素材条目无效。')
          const unique=record.store+'\0'+record.key;if(keys.has(unique))throw Error('备份含重复素材条目。');keys.add(unique)
          const value=unpackValue(record.value,blobs),keyPath=spec.stores[record.store]
          if(!plain(value)||keyPath&&value[keyPath]!==record.key)throw Error('备份素材标识不匹配。')
          items.push({store:record.store,key:record.key,value})
        }
        databases.push({spec,records:items})
      }
    }
    cancelled()
    return{settings,layout:{widths:widths(parsed.layout?.widths)},navigation:navigation(parsed.navigation),databases,hasAssets,records,size:file.size,name:file.name,createdAt:typeof parsed.createdAt==='string'?parsed.createdAt:'',options:Object.keys(settings).length}
  })}
  async function writeGroup(spec,records,{rollback=false}={}){
    const db=await openDB(win,spec,true),before=[]
    try{await new Promise((resolve,reject)=>{
      const tx=db.transaction([...new Set(records.map(item=>item.store))],'readwrite')
      for(const item of records){
        const store=tx.objectStore(item.store),read=store.get(item.key)
        read.onsuccess=()=>{
          before.push({store:item.store,key:item.key,value:read.result})
          try{
            if(rollback&&item.value===undefined)store.delete(item.key)
            else{
              let value=item.value
              // Keep the destination's other wallpaper imports discoverable.
              // Originals are keyed separately; merge the small gallery index.
              if(!rollback&&spec.name==='dsh-ui-beautify-background'&&item.store==='wallpaper'&&item.key==='selection'&&value.schema===2){
                const recent=[...(Array.isArray(value.recent)?value.recent:[]),...(Array.isArray(read.result?.recent)?read.result.recent:[])],seen=new Set()
                value={...value,recent:recent.filter(asset=>{if(!asset?.revision||seen.has(asset.revision))return false;seen.add(asset.revision);return true})}
              }
              spec.stores[item.store]?store.put(value):store.put(value,item.key)
            }
          }catch{tx.abort()}
        }
      }
      tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(Error('保存素材失败，可能是本机存储空间不足。'))
    });return{spec,records:before}}finally{db.close()}
  }
  async function rollback(groups){for(const group of groups.slice().reverse())if(group.records.length)await writeGroup(group.spec,group.records,{rollback:true})}
  async function apply(plan){return exclusive(async()=>{
    cancelled();const previous=localSnapshot(),groups=[]
    try{
      for(const group of plan.databases){cancelled();if(group.records.length)groups.push(await writeGroup(group.spec,group.records))}
      cancelled()
      win.localStorage.setItem(WIDTH,JSON.stringify(plan.layout.widths))
      win.localStorage.setItem(NAV[0],plan.navigation.tab);win.localStorage.setItem(NAV[1],JSON.stringify(plan.navigation.children))
      win.localStorage.setItem(MAIN,JSON.stringify(normalize(plan.settings)))
      onApply?.(normalize(plan.settings),plan.layout.widths)
    }catch(error){let restored=true;try{await rollback(groups);restoreLocal(previous);onApply?.(normalize(readJson(win.localStorage,MAIN)),widths(readJson(win.localStorage,WIDTH)))}catch{restored=false}throw Error(restored?`${error.message} 已保留导入前配置。`:`${error.message} 未能完全回退，请保留备份文件。`)}
    undo={previous,groups};needsReload=needsReload||plan.hasAssets&&plan.records>0;return{reload:needsReload}
  })}
  async function undoImport(){return exclusive(async()=>{
    if(!undo)return
    await rollback(undo.groups);restoreLocal(undo.previous)
    const value=readJson(win.localStorage,MAIN);onApply?.(normalize(value),widths(readJson(win.localStorage,WIDTH)))
    needsReload=needsReload||undo.groups.length>0;undo=null;return{reload:needsReload}
  })}
  return{exportFile,inspect,apply,undo:undoImport,status:()=>({canUndo:!!undo,reload:needsReload}),dispose(){disposed=true;undo=null}}
}

export const settingsTransferCss=`
 .dcb-config-transfer { margin:0 0 20px; padding:16px 18px; display:grid; gap:12px; border:1px solid var(--dsh-settings-border); border-radius:14px; background:var(--dsh-settings-subtle); }
 .dcb-config-transfer .dcb-config-row { display:flex; align-items:center; flex-wrap:wrap; justify-content:space-between; gap:10px 16px; }
 .dcb-config-transfer strong { font-size:14px; font-weight:600; }
 .dcb-config-transfer p { margin:4px 0 0; color:var(--dsh-settings-secondary); font:12px/1.6 system-ui,sans-serif; overflow-wrap:anywhere; }
 .dcb-config-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
 .dcb-config-transfer button:not(.dcb-switch) { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:44px; padding:9px 13px; border:1px solid var(--dsh-settings-border); border-radius:10px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); font:500 13px/20px system-ui,sans-serif; cursor:pointer; transition:background-color ${motion.time.quick}ms ${motion.ease.color},transform ${motion.time.control}ms ${motion.ease.snappy}; }
 .dcb-config-transfer button:not(.dcb-switch):hover:enabled { background:var(--dsh-settings-subtle); border-color:var(--dsh-settings-accent); }
 .dcb-config-transfer button:not(.dcb-switch):active:enabled { transform:scale(.97); }
 .dcb-config-transfer button:disabled { opacity:.45; cursor:default; }
 .dcb-config-transfer button:focus-visible { outline:2px solid var(--dsh-settings-accent); outline-offset:3px; }
 .dcb-config-transfer button[data-primary] { background:var(--dsh-settings-text); color:var(--dsh-settings-surface); }
 .dcb-config-transfer .dcb-config-materials { display:inline-flex; align-items:center; gap:12px; min-height:44px; color:var(--dsh-settings-secondary); font-size:12px; }
 .dcb-config-preview { padding-top:14px; border-top:1px solid var(--dsh-settings-border); animation:dcb-config-in ${motion.time.control}ms ${motion.ease.smooth}; }
 .dcb-config-preview .dcb-config-actions { margin-top:12px; }
 .dcb-config-transfer [role=alert] { color:var(--dsw-alias-state-error-primary,#c34b4b); }
 @keyframes dcb-config-in { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none} }
 @media(max-width:580px) { .dcb-config-transfer{padding:14px}.dcb-config-actions{width:100%}.dcb-config-actions button{flex:1} }
 @media(prefers-reduced-motion:reduce) { .dcb-config-preview{animation:none}.dcb-config-transfer button{transition:none!important}.dcb-config-transfer button:active:enabled{transform:none!important} }
 @media(forced-colors:active) { .dcb-config-transfer,.dcb-config-preview{border-color:CanvasText;background:Canvas;color:CanvasText}.dcb-config-transfer button:not(.dcb-switch){background:ButtonFace;color:ButtonText;border-color:ButtonText}.dcb-config-transfer button:focus-visible{outline-color:Highlight}.dcb-config-transfer p,.dcb-config-transfer .dcb-config-materials{color:CanvasText} }
`
export function createSettingsTransferUI(React,doc,win){
  const h=React.createElement,icon=kind=>h('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('path',{d:kind==='export'?'M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4':'M12 16V4m-4 4 4-4 4 4M4 16v4h16v-4'}))
  return function SettingsTransfer({manager}){
    const [assets,setAssets]=React.useState(false),[busy,setBusy]=React.useState(false),[error,setError]=React.useState(''),[notice,setNotice]=React.useState(''),[plan,setPlan]=React.useState(null),[canUndo,setUndo]=React.useState(()=>manager.status().canUndo),[reload,setReload]=React.useState(()=>manager.status().reload)
    const input=React.useRef(null),live=React.useRef(false),gate=React.useRef(false),download=React.useRef(null),upload=React.useRef(null),id=React.useId()
    React.useEffect(()=>{live.current=true;return()=>{live.current=false;if(download.current){win.clearTimeout(download.current.timer);win.URL.revokeObjectURL(download.current.url)}}},[])
    async function run(action){if(gate.current)return;gate.current=true;setBusy(true);setError('');try{await action()}catch(error){if(live.current)setError(error.message||'配置处理失败。')}finally{gate.current=false;if(live.current)setBusy(false)}}
    const exportConfig=()=>run(async()=>{
      const result=await manager.exportFile(assets);if(!live.current)return
      if(download.current){win.clearTimeout(download.current.timer);win.URL.revokeObjectURL(download.current.url)}
      const url=win.URL.createObjectURL(result.blob),link=doc.createElement('a');link.href=url;link.download=result.name;doc.body.append(link);link.click();link.remove()
      download.current={url,timer:win.setTimeout(()=>{win.URL.revokeObjectURL(url);if(download.current?.url===url)download.current=null},30000)}
      setNotice(`已导出${assets?'完整备份':'全局配置'} · ${prettySize(result.blob.size)}${assets?` · ${result.records} 条素材记录`:''}`)
    })
    const inspect=event=>{const file=event.target.files?.[0];event.target.value='';if(file){setPlan(null);run(async()=>{const result=await manager.inspect(file);if(live.current){setPlan(result);setNotice('')}})}}
    const apply=()=>run(async()=>{const result=await manager.apply(plan);if(live.current){setPlan(null);setUndo(true);setReload(result.reload);setNotice(result.reload?(plan.hasAssets?'已导入配置与素材；刷新界面后加载素材。':'全局配置已导入；有素材变更等待刷新。'):'全局配置已导入并立即生效。')}})
    const undo=()=>run(async()=>{const result=await manager.undo();if(live.current){setUndo(false);setReload(result?.reload||false);setNotice(result?.reload?'已撤销导入；刷新界面后重新加载素材。':'已恢复导入前的配置。')}})
    return h('section',{className:'dcb-config-transfer','aria-label':'全局配置导入导出','aria-busy':busy},
      h('div',{className:'dcb-config-row'},h('div',null,h('strong',null,'全局配置'),h('p',null,'保存所有分类、黑白主题、自定义 CSS、工具栏与聊天宽度。')),
        h('div',{className:'dcb-config-actions'},h('button',{type:'button',disabled:busy,onClick:exportConfig},icon('export'),busy?'处理中…':'导出配置'),h('button',{ref:upload,type:'button',disabled:busy,onClick:()=>input.current?.click()},icon('import'),'导入配置'))),
      h('div',{className:'dcb-config-row'},h('label',{className:'dcb-config-materials',htmlFor:id},'包含本机素材',h('button',{id,type:'button',className:'dcb-switch',role:'switch','aria-label':'包含本机素材','aria-checked':assets,disabled:busy,onClick:()=>setAssets(value=>!value)})),h('p',null,assets?'完整备份 .dshui · 包含背景、开屏、粒子与自定义动图包；最多 512 MB。':'轻量配置 .json · 素材仅保存引用，换设备请开启“包含本机素材”。')),
      h('input',{ref:input,type:'file',hidden:true,disabled:busy,accept:'.json,.dshui,application/json','aria-label':'选择美化配置文件',onChange:inspect}),
      plan&&h('div',{className:'dcb-config-preview'},h('strong',null,'待导入：'+plan.name),h('p',null,`${plan.options} 项设置 · ${plan.records} 条素材记录 · ${prettySize(plan.size)}`),h('p',null,'应用后替换本插件配置，素材合并保存，保留其他已导入素材。'+(!plan.hasAssets?' 此文件不含素材，所用背景或动图需已存在于本机。':'')),h('div',{className:'dcb-config-actions'},h('button',{type:'button','data-primary':'',disabled:busy,onClick:apply},'应用配置'),h('button',{type:'button',disabled:busy,onClick:()=>{setPlan(null);upload.current?.focus()}},'取消'))),
      error&&h('p',{role:'alert'},error),notice&&h('p',{role:'status','aria-live':'polite'},notice),
      (canUndo||reload)&&h('div',{className:'dcb-config-actions'},canUndo&&h('button',{type:'button',disabled:busy,onClick:undo},'撤销导入'),reload&&h('button',{type:'button',disabled:busy,onClick:()=>win.location.reload()},'刷新界面加载素材')))
  }
}
