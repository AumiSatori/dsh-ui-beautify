export const backgroundSettingsCss=`
  .dcb-background-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
  .dcb-background-actions button,.dcb-background-options button { padding:8px 12px; border:1px solid var(--dsh-settings-border); border-radius:8px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); font:inherit; cursor:pointer; }
  .dcb-background-actions button:disabled { opacity:.45; cursor:default; }
  .dcb-background-options { display:flex; flex-wrap:wrap; gap:6px; }
  .dcb-background-options button[aria-pressed=true] { border-color:currentColor; background:var(--dsh-settings-subtle); }
  .dcb-background-slider { display:flex; align-items:center; gap:10px; flex:0 1 240px; min-width:140px; }
  .dcb-background-slider input { width:100%; min-width:70px; accent-color:var(--dsh-settings-text); }
  .dcb-background-slider output { flex:none; width:42px; text-align:right; font-variant-numeric:tabular-nums; }
  .dcb-background-preview { position:relative; width:100%; height:clamp(150px,25vw,230px); margin:16px 0; overflow:hidden; border:1px solid var(--dsh-settings-border); border-radius:12px; background:var(--dsh-settings-surface); }
  .dcb-background-preview img { width:100%; height:100%; display:block; }
  .dcb-background-preview span { position:absolute; inset:auto 12px 12px; width:max-content; max-width:calc(100% - 24px); padding:8px 12px; border-radius:8px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); }
  .dcb-background-error { color:#bf3434; margin:12px 0; overflow-wrap:anywhere; }
  .dcb-background-file { overflow-wrap:anywhere; color:var(--dsh-settings-secondary); }
  .dcb-background-options button:focus-visible,.dcb-background-actions button:focus-visible { outline:2px solid currentColor; outline-offset:2px; }
  @container dcb-settings-page (max-width:450px) { .dcb-background-row { flex-wrap:wrap; } .dcb-background-slider { flex:1 1 100%; } }
  @media(forced-colors:active) { .dcb-background-options button[aria-pressed=true] { outline:2px solid Highlight; } }
`

export function createBackgroundSettings(React,{background}){
  const h=React.createElement
  const row=(title,description,control)=>h('div',{className:'dcb-settings-row dcb-background-row'},h('div',{className:'dcb-settings-copy'},h('span',{className:'dcb-settings-row-title'},title),h('p',{className:'dcb-settings-row-desc'},description)),control)
  return function BackgroundSettings({value,onChange}){
    const state=React.useSyncExternalStore(background.subscribe,background.getSnapshot),[busy,setBusy]=React.useState(false),[error,setError]=React.useState(''),input=React.useRef(null),mounted=React.useRef(true)
    React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
    const run=async action=>{setBusy(true);setError('');try{await action()}catch(error){if(mounted.current)setError(error.message)}finally{if(mounted.current)setBusy(false)}}
    const select=asset=>onChange({backgroundEnabled:!!asset,backgroundRevision:asset?.revision||'',backgroundName:asset?.name||''})
    const slider=(label,key,min,max,suffix='')=>h('div',{className:'dcb-background-slider'},h('input',{type:'range','aria-label':label,min,max,step:1,value:value[key],onChange:event=>onChange({[key]:Number(event.target.value)})}),h('output',null,value[key]+suffix))
    const choices=(label,key,items)=>h('div',{className:'dcb-background-options',role:'group','aria-label':label},items.map(([id,title])=>h('button',{key:id,type:'button','aria-pressed':value[key]===id,onClick:()=>onChange({[key]:id})},title)))
    return h('section',{className:'dcb-settings-block dcb-settings-card','data-dcb-settings-block':'background'},
      h('div',{className:'dcb-settings-header'},h('div',null,h('h2',null,'全图背景'),h('p',null,'用本机图片或视频铺满整个窗口，设置自动保存'))),
      row('启用全图背景','导入后自动开启；关闭后恢复原界面，文件仍保留。',h('button',{type:'button',className:'dcb-switch',role:'switch','aria-label':'启用全图背景','aria-checked':value.backgroundEnabled,disabled:!value.backgroundRevision,onClick:()=>onChange({backgroundEnabled:!value.backgroundEnabled})})),
      h('p',{className:'dcb-background-file'},value.backgroundName||'尚未选择背景'),
      h('input',{ref:input,type:'file',hidden:true,'aria-label':'导入全图背景',accept:'.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm',onChange:event=>{const file=event.target.files?.[0];event.target.value='';if(file)run(async()=>select(await background.import(file)))}}),
      h('div',{className:'dcb-background-actions'},
        h('button',{type:'button',disabled:busy,onClick:()=>input.current?.click()},busy?'处理中…':'选择图片或视频'),
        h('button',{type:'button',disabled:busy||!state.hasPrevious,onClick:()=>run(async()=>select(await background.restore()))},'恢复上一张'),
        h('button',{type:'button',disabled:busy||!value.backgroundRevision,onClick:()=>run(async()=>{await background.clear();select(null)})},'清除背景')),
      (error||state.error)&&h('p',{className:'dcb-background-error',role:'alert'},error||state.error),
      state.preview&&h('div',{className:'dcb-background-preview','aria-label':'背景效果预览'},h('img',{src:state.preview,alt:'所选背景预览',style:{objectFit:value.backgroundFit,objectPosition:value.backgroundPosition,opacity:value.backgroundOpacity/100,filter:`blur(${value.backgroundBlur}px)`}}),h('span',null,'对话文字预览')),
      row('背景可见度','降低可见度可以让对话文字更清楚。',slider('背景可见度','backgroundOpacity',0,100,'%')),
      row('背景模糊','轻微模糊可以减少画面细节的干扰。',slider('背景模糊','backgroundBlur',0,20)),
      row('铺放方式','铺满会裁切边缘；完整显示保留整张图。',choices('背景铺放方式','backgroundFit',[['cover','铺满'],['contain','完整显示'],['fill','拉伸'] ])),
      row('画面位置','铺满时选择优先保留的画面区域。',choices('背景画面位置','backgroundPosition',[['center','居中'],['top','靠上'],['bottom','靠下'],['left','靠左'],['right','靠右']])),
      row('视频声音','默认静音，仅在主动开启后尝试播放声音。',h('button',{type:'button',className:'dcb-switch',role:'switch','aria-label':'视频声音','aria-checked':value.backgroundSound,onClick:()=>onChange({backgroundSound:!value.backgroundSound})})),
      state.notice&&h('p',{role:'status',className:'dcb-settings-footnote'},state.notice),
      h('p',{className:'dcb-settings-footnote'},'支持 JPG、PNG、WebP、GIF、MP4 和 WebM，文件仅保存在本机浏览器，不上传。视频在后台自动暂停；减少动态效果时静态显示。设置与菜单保留底色，粒子背景可同时使用。'))
  }
}
