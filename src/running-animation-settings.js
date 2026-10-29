import {RUNNING_BUILTIN,runningLabelLines,RUNNING_LABEL_LIMIT} from './running-animation-config.js'
import {createRunningPlayer} from './running-animation.js'
import {motion} from './motion.js'
import exampleZip from '../assets/running-example.zip'
export const runningSettingsCss=`
 .dcb-running-buttons { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:12px 0; }
 .dcb-running-buttons button,.dcb-running-download,.dcb-running-choice,.dcb-running-preview-button { min-height:44px; padding:8px 12px; border:1px solid var(--dsh-settings-border); border-radius:10px; background:var(--dsh-settings-subtle); color:var(--dsh-settings-text); font:500 12px/20px system-ui; cursor:pointer; transition:background-color 180ms ${motion.ease.color},border-color 220ms ${motion.ease.color},transform 220ms ${motion.ease.snappy}; }
 .dcb-running-download { box-sizing:border-box; display:inline-flex; align-items:center; text-decoration:none; }
 .dcb-running-download:hover { background:var(--dsh-settings-surface); border-color:var(--dsh-settings-secondary); }
 .dcb-running-buttons button[aria-pressed=true] { border-color:var(--dsh-settings-accent); color:var(--dsh-settings-accent); }
 .dcb-running-buttons button:active:enabled,.dcb-running-download:active,.dcb-running-choice:active { transform:scale(.97); }
 .dcb-running-buttons button:focus-visible,.dcb-running-download:focus-visible,.dcb-running-choice:focus-visible,.dcb-running-preview-button:focus-visible { outline:2px solid var(--dsh-settings-accent); outline-offset:2px; }
 .dcb-running-buttons button:disabled { opacity:.45; cursor:not-allowed; }
 .dcb-running-drop { margin:16px 0; padding:16px; border:1px dashed var(--dsh-settings-border); border-radius:12px; background:var(--dsh-settings-subtle); }
 .dcb-running-drop p { margin:0; font:13px/20px system-ui; color:var(--dsh-settings-secondary); }
 .dcb-running-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(112px,1fr)); gap:10px; max-height:356px; padding:4px; overflow:auto; overscroll-behavior:contain; }
 .dcb-running-item { width:auto; max-width:none; margin:0; flex:initial; min-width:0; display:flex; flex-direction:column; border:1px solid var(--dsh-settings-border); border-radius:12px; overflow:hidden; background:var(--dsh-settings-subtle); }
 .dcb-running-item[data-selected=true] { border-color:var(--dsh-settings-accent); }
 .dcb-running-choice { flex:1; position:relative; display:grid; justify-items:center; align-content:start; gap:6px; width:100%; border:0; border-radius:0; padding:12px 8px 8px; background:transparent; overflow-wrap:anywhere; }
 .dcb-running-choice::after { content:''; position:absolute; top:8px; right:8px; width:7px; height:7px; border:1px solid var(--dsh-settings-border); border-radius:50%; }
 .dcb-running-choice[aria-checked=true]::after { background:var(--dsh-settings-indicator); border-color:var(--dsh-settings-indicator); box-shadow:var(--dsh-settings-indicator-shadow); }
 .dcb-running-thumb { display:block; width:64px; height:64px; background-repeat:no-repeat; }
 .dcb-running-thumb img { display:block; width:100%; height:100%; object-fit:contain; }
 .dcb-running-preview-button { min-height:44px; border:0; border-top:1px solid var(--dsh-settings-border); border-radius:0; background:transparent; color:var(--dsh-settings-secondary); }
 .dcb-running-demo { display:flex; align-items:center; justify-content:center; gap:8px; min-height:100px; margin:14px 0; padding:14px; border:1px solid var(--dsh-settings-border); border-radius:12px; background:var(--dsh-settings-subtle); color:var(--dsh-settings-secondary); }
 .dcb-running-search,.dcb-running-number { box-sizing:border-box; min-height:44px; max-width:100%; padding:8px 10px; border:1px solid var(--dsh-settings-border); border-radius:8px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); font:13px/20px system-ui; }
 .dcb-running-number { width:78px; }
 .dcb-running-label { box-sizing:border-box; flex:1 1 220px; min-width:0; min-height:64px; max-height:200px; padding:9px 10px; border:1px solid var(--dsh-settings-border); border-radius:10px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); font:13px/20px system-ui; resize:vertical; }
 .dcb-settings-row[data-setting="running-label"] { align-items:stretch; flex-wrap:wrap; }
 .dcb-settings-row[data-setting="running-label"] .dcb-settings-copy { flex:1 1 200px; }
 .dcb-running-search:focus-visible,.dcb-running-number:focus-visible,.dcb-running-label:focus-visible { outline:2px solid var(--dsh-settings-accent); outline-offset:2px; }
 .dcb-running-error { color:var(--dsh-settings-text); overflow-wrap:anywhere; font:13px/20px system-ui; }
 @media(prefers-reduced-motion:reduce) { .dcb-running-buttons button,.dcb-running-download,.dcb-running-choice { transition:none; } }
 @media(forced-colors:active) { .dcb-running-choice[aria-checked=true]::after { background:Highlight; box-shadow:none; } .dcb-running-item[data-selected=true] { border:2px solid Highlight; } .dcb-running-buttons button[aria-pressed=true] { outline:2px solid Highlight; } }
`
export function createRunningSettings(React,doc,win,catalog){
 const h=React.createElement
 function Thumbnail({pack,action}){
  const root=React.useRef(null)
  React.useEffect(()=>{
   let live=true,asset,loaded=false
   const observer=new win.IntersectionObserver(async entries=>{if(loaded||!entries.some(entry=>entry.isIntersecting))return;loaded=true;observer.disconnect()
    try{asset=await catalog.acquire(pack,action);if(!live){asset.release();return}const node=root.current
     if(action.type==='sprite'){node.style.backgroundImage=`url("${asset.poster}")`;node.style.backgroundSize=`${action.columns*100}% ${action.rows*100}%`}
     else{const image=doc.createElement('img');image.alt='';image.src=asset.poster;node.append(image)}
    }catch{/* A missing thumbnail must not hide the action label. */}
   });observer.observe(root.current)
   return()=>{live=false;observer.disconnect();asset?.release()}
  },[pack.id,action.id])
  return h('span',{ref:root,className:'dcb-running-thumb','aria-hidden':true})
 }
 function Preview({pack,action,size,gap,opacity,label}){
  const seat=React.useRef(null),[error,setError]=React.useState('')
  React.useEffect(()=>{
   let live=true,player,asset,visible=false
   const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)'),refresh=()=>{if(quiet.matches)player?.freeze();else player?.setPlaying(visible&&!doc.hidden)}
   const observer=new win.IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting;refresh()});observer.observe(seat.current)
   setError('');catalog.acquire(pack,action).then(value=>{asset=value;if(!live){asset.release();return}player=createRunningPlayer(doc,win,action,asset);seat.current.append(player.node);refresh()},()=>{if(live)setError('预览素材读取失败')})
   doc.addEventListener('visibilitychange',refresh);quiet.addEventListener('change',refresh)
   return()=>{live=false;observer.disconnect();doc.removeEventListener('visibilitychange',refresh);quiet.removeEventListener('change',refresh);if(player)player.dispose();else asset?.release()}
  },[pack.id,action.id])
  return h('div',{className:'dcb-running-demo',style:{gap:gap+'px'},'aria-label':'思考动图预览'},h('span',{ref:seat,style:{display:'inline-block',width:size,height:size,opacity}}),h('span',null,error||label||'深度求索中…'))
 }
 return function RunningSettings({value,onChange}){
  const state=React.useSyncExternalStore(catalog.subscribe,catalog.getSnapshot,catalog.getSnapshot),[busy,setBusy]=React.useState(false),[error,setError]=React.useState(''),[query,setQuery]=React.useState(''),[preview,setPreview]=React.useState(''),input=React.useRef(null),folder=React.useRef(null),mounted=React.useRef(false)
  React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
  const pack=state.packs.find(item=>item.id===value.runningAnimationPack)||state.packs.find(item=>item.id===RUNNING_BUILTIN),chosen=new Set(value.runningAnimationActions??pack?.actions.map(action=>action.id)),action=pack?.actions.find(item=>item.id===preview)||pack?.actions.find(item=>chosen.has(item.id))||pack?.actions[0]
  const labels=runningLabelLines(value.runningAnimationLabel)
  const row=(label,description,control,attrs)=>h('div',{className:'dcb-settings-row',...attrs},h('div',{className:'dcb-settings-copy'},h('span',{className:'dcb-settings-row-title'},label),h('p',{className:'dcb-settings-row-desc'},description)),control)
  const toggle=(label,key)=>h('button',{type:'button',className:'dcb-switch',role:'switch','aria-label':label,'aria-checked':value[key],onClick:()=>onChange({[key]:!value[key]})})
  const choosePack=id=>{setPreview('');onChange({runningAnimationPack:id,runningAnimationActions:null})}
  async function upload(files){if(busy||!files)return;setBusy(true);setError('');try{const added=await catalog.importPack(files);if(mounted.current)choosePack(added.id)}catch(error){if(mounted.current)setError(error.message||'动图包导入失败')}finally{if(mounted.current)setBusy(false)}}
  async function remove(){if(!pack||pack.builtin||busy)return;setBusy(true);setError('');try{await catalog.removePack(pack.id);if(mounted.current)choosePack(RUNNING_BUILTIN)}catch(error){if(mounted.current)setError(error.message)}finally{if(mounted.current)setBusy(false)}}
  const number=(label,key,min,max)=>h('input',{className:'dcb-running-number',type:'number',min,max,step:1,'aria-label':label,value:value[key],onChange:event=>{if(event.target.value!=='')onChange({[key]:Math.max(min,Math.min(max,Number(event.target.value)))})}})
  const labelBox=(label,key)=>h('textarea',{className:'dcb-running-label',rows:2,maxLength:RUNNING_LABEL_LIMIT.chars,'aria-label':label,placeholder:'深度求索中…',value:value[key],onChange:event=>onChange({[key]:event.target.value})})
  return h('section',{className:'dcb-settings-block dcb-settings-card','data-dcb-settings-block':'running'},
   h('div',{className:'dcb-settings-header'},h('div',null,h('h2',null,'思考动图'),h('p',null,'为“深度求索中”挑选动作，也可以导入自己的动图包。'))),
   row('思考动图','关闭恢复宿主原来的图标；已导入的动图包和选择会保留。',toggle('思考动图','runningAnimationEnabled')),
   row('随机动作','每次新的思考随机选择已勾选动作，避免连续重复。关闭后使用勾选列表中的第一个动作。',toggle('随机动作','runningAnimationRandom')),
   h('div',{className:'dcb-running-buttons','aria-label':'动图包'},state.packs.map(item=>h('button',{key:item.id,type:'button','aria-pressed':pack?.id===item.id,onClick:()=>choosePack(item.id)},item.builtin?'默认 · 鲸鱼娘':item.name))),
   h('div',{className:'dcb-running-drop',onDragOver:event=>event.preventDefault(),onDrop:event=>{event.preventDefault();const files=event.dataTransfer.files;if(files.length===1&&/\.zip$/i.test(files[0].name))void upload(files[0]);else if(files.length)void upload(files)}},
    h('p',null,'把 ZIP 动图包拖到这里，或导入一个文件夹。普通 GIF / APNG / WebP 可直接打包；精灵图需附 manifest.json。'),
    h('div',{className:'dcb-running-buttons'},h('button',{type:'button',disabled:busy,onClick:()=>input.current.click()},busy?'正在导入…':'导入 ZIP 动图包'),h('button',{type:'button',disabled:busy,onClick:()=>folder.current.click()},'导入文件夹'),h('a',{className:'dcb-running-download',href:exampleZip,download:'dsh-running-pack-example.zip'},'下载格式示例 ZIP'),pack&&!pack.builtin&&h('button',{type:'button',disabled:busy,onClick:remove},'删除当前动图包')),
    h('p',null,'示例包含 manifest.json、可播放的精灵图和中文制作说明，可直接导入试用，也可解压后替换素材。'),
    h('input',{ref:input,type:'file',accept:'.zip',hidden:true,'aria-label':'选择动图 ZIP',onChange:event=>{const file=event.target.files[0];event.target.value='';void upload(file)}}),h('input',{ref:folder,type:'file',webkitdirectory:'',multiple:true,hidden:true,'aria-label':'选择动图文件夹',onChange:event=>{const files=Array.from(event.target.files);event.target.value='';void upload(files)}})),
   (error||state.error)&&h('p',{className:'dcb-running-error',role:'status'},error||state.error),state.loading&&h('p',{role:'status'},'正在读取动图包…'),
   pack&&h(React.Fragment,null,
    action&&h(Preview,{pack,action,size:value.runningAnimationSize,gap:value.runningAnimationGap,opacity:value.runningAnimationOpacity,label:labels[0]}),
    row('图标大小','16–80 像素；随时预览当前尺寸。',number('动图大小','runningAnimationSize',16,80)),row('文字间距','图标与后面文字之间的距离。',number('动图间距','runningAnimationGap',0,24)),
    row('思考文案','替换图标后面的「深度求索中…」。每行一条，可用 {time} 把用时放到任意位置；留空恢复默认。',labelBox('思考文案','runningAnimationLabel'),{'data-setting':'running-label'}),
    row('随机文案','多条文案时，每次新的思考随机选一条，避免连续重复；关闭后固定使用第一条。',toggle('随机文案','runningAnimationLabelRandom')),
    h('div',{className:'dcb-running-buttons'},h('button',{type:'button',onClick:()=>onChange({runningAnimationActions:null})},'全选动作'),h('button',{type:'button',onClick:()=>onChange({runningAnimationActions:[]})},'全部取消'),h('input',{className:'dcb-running-search',type:'search','aria-label':'搜索动作',placeholder:'搜索动作…',value:query,onChange:event=>setQuery(event.target.value)})),
    h('p',{className:'dcb-settings-info',role:'status'},`已选 ${pack.actions.filter(item=>chosen.has(item.id)).length} / ${pack.actions.length} 个动作${chosen.size?'':' · 未选动作时显示原生图标'}`),
    h('div',{className:'dcb-running-grid','aria-label':'可用动作'},pack.actions.filter(item=>item.name.toLowerCase().includes(query.toLowerCase())).map(item=>h('article',{key:`${pack.id}/${item.id}`,className:'dcb-running-item','data-selected':chosen.has(item.id)},
     h('button',{type:'button',className:'dcb-running-choice',role:'checkbox','aria-label':item.name,'aria-checked':chosen.has(item.id),onClick:()=>{const next=new Set(chosen);next.has(item.id)?next.delete(item.id):next.add(item.id);onChange({runningAnimationActions:pack.actions.filter(action=>next.has(action.id)).map(action=>action.id)})}},h(Thumbnail,{pack,action:item}),h('span',null,item.name)),
     h('button',{type:'button',className:'dcb-running-preview-button','aria-label':`预览${item.name}`,onClick:()=>setPreview(item.id)},'预览动作')))),
    h('p',{className:'dcb-cost-guide'},pack.author?`作者：${pack.author} · ${pack.license||'授权见包内说明'}`:'导入包仅保存在当前浏览器的本机存储；桌面和其他浏览器需分别导入。')))
 }
}
