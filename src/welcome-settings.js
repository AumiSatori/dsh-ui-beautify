import {createWelcomeArt} from './welcome-strokes.js'
import {normalizeWelcome,playWelcomeInk,WELCOME_TEXT_LIMIT} from './welcome-font.js'
import {motion} from './motion.js'
import {inspectWelcomeMedia,createWelcomeMediaPlayer,welcomeMediaCss} from './welcome-media.js'

export const welcomeSettingsCss=`
  ${welcomeMediaCss}
  .dcb-welcome-fields { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:16px 0; }
  .dcb-welcome-field { display:grid; gap:7px; min-width:0; font-size:12px; color:var(--dsh-settings-secondary); }
  .dcb-welcome-field input { box-sizing:border-box; width:100%; min-width:0; padding:9px 11px; border:1px solid #8885; border-radius:8px; background:transparent; color:var(--dsh-settings-text); font:13px/20px system-ui; outline:none; transition:border-color 180ms ease,box-shadow 180ms ease; }
  .dcb-welcome-field input:focus { border-color:#888b; box-shadow:0 0 0 3px #8882; }
  .dcb-welcome-speeds { display:flex; flex-wrap:wrap; gap:7px; margin:10px 0 16px; }
  .dcb-welcome-speeds button,.dcb-welcome-play { padding:7px 12px; border:1px solid #8884; border-radius:8px; background:transparent; color:inherit; font:12px/18px system-ui; cursor:pointer; transition:background-color 220ms ease,border-color 220ms ease,transform 220ms ${motion.ease.smooth}; }
  .dcb-welcome-speeds button[aria-checked=true] { background:#8882; border-color:#8889; }
  .dcb-welcome-speeds button:active,.dcb-welcome-play:active { transform:scale(.94); }
  .dcb-welcome-speeds button:focus-visible,.dcb-welcome-play:focus-visible { outline:2px solid #888; outline-offset:2px; }
  .dcb-welcome-demo { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:156px; padding:16px; border:1px solid #8883; border-radius:12px; background:#fafbfc; overflow:hidden; transition:background-color 220ms ease; }
  .dcb-welcome-demo[data-mode=media] { height:240px; padding:0; }
  .dcb-welcome-demo-content { width:100%; min-height:0; display:grid; place-items:center; }
  .dcb-welcome-demo[data-mode=media] .dcb-welcome-demo-content { height:100%; }
  .dcb-welcome-preview-brand { display:grid; place-items:center; width:90px; height:64px; margin-bottom:12px; color:#111; overflow:hidden; transition:height 280ms ${motion.ease.smooth},margin-bottom 280ms ${motion.ease.smooth},opacity 220ms ease,transform 280ms ${motion.ease.smooth}; }
  .dcb-welcome-preview-brand[data-shown=false] { height:0; margin-bottom:0; opacity:0; transform:translateY(-8px) scale(.9); }
  .dcb-welcome-preview-brand svg { display:block; width:90px; height:64px; }
  body[data-ds-dark-theme] .dcb-welcome-preview-brand { color:#ededf0; }
  .dcb-welcome-collapse { display:grid; grid-template-rows:1fr; opacity:1; transform:none; transition:grid-template-rows 280ms ${motion.ease.smooth},opacity 220ms ease,transform 280ms ${motion.ease.smooth}; }
  .dcb-welcome-collapse[data-open=false] { grid-template-rows:0fr; opacity:0; transform:translateY(-8px); }
  .dcb-welcome-collapse > div { min-height:0; overflow:hidden; }
  .dcb-welcome-upload { margin:12px 0; padding:14px; border:1px dashed #8886; border-radius:10px; }
  .dcb-welcome-upload-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .dcb-welcome-file-name { overflow-wrap:anywhere; }
  .dcb-welcome-demo [data-dcb-welcome-art] { display:block; width:100%; max-width:440px; height:120px; color:#111; overflow:visible; }
  .dcb-welcome-demo [data-dcb-welcome-stroke] { fill:none; stroke-width:5.3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:1; stroke-dashoffset:1; }
  body[data-ds-dark-theme] .dcb-welcome-demo { background:#1b1b1d; }
  body[data-ds-dark-theme] .dcb-welcome-demo [data-dcb-welcome-art] { color:#ededf0; }
  @media(max-width:600px) { .dcb-welcome-fields { grid-template-columns:1fr; } }
  @media(prefers-reduced-motion:reduce) { .dcb-welcome-field input,.dcb-welcome-speeds button,.dcb-welcome-play,.dcb-welcome-collapse,.dcb-welcome-preview-brand { transition:none; } }
  @media(forced-colors:active) { .dcb-welcome-demo,.dcb-welcome-field input,.dcb-welcome-speeds button,.dcb-welcome-play { background:Canvas; color:CanvasText; border-color:CanvasText; } .dcb-welcome-demo [data-dcb-welcome-art] { color:CanvasText!important; } }
`

export function createWelcomeSettings(React,doc,win,{mediaStore,FishLogo}={}){
  const h=React.createElement
  return function WelcomeSettings({value,onChange}){
    const [text,setText]=React.useState(value.welcomeText),[font,setFont]=React.useState(value.welcomeFont),[playing,setPlaying]=React.useState(false),[error,setError]=React.useState(''),[asset,setAsset]=React.useState(null),[busy,setBusy]=React.useState(false)
    const seat=React.useRef(null),player=React.useRef(null),latest=React.useRef(value),generation=React.useRef(0),drawn=React.useRef(''),assetRef=React.useRef(null),fileInput=React.useRef(null),mounted=React.useRef(false)
    latest.current=value
    assetRef.current=asset
    React.useEffect(()=>setText(value.welcomeText),[value.welcomeText])
    React.useEffect(()=>setFont(value.welcomeFont),[value.welcomeFont])
    const settle=art=>{for(const path of art.strokes)path.style.strokeDashoffset='0';for(const rect of art.finishes||[])rect.setAttribute('opacity','1')}
    const stop=()=>{
      generation.current++
      if(player.current){
        player.current.media?.freeze();player.current.media?.dispose()
        if(player.current.art)settle(player.current.art)
        for(const a of player.current.animations||[])a.cancel();player.current=null
      }
    }
    const signature=()=>[latest.current.welcomeMode,latest.current.welcomeText,latest.current.welcomeFont,latest.current.welcomeDuration,latest.current.welcomeMediaFit,latest.current.welcomeMediaDuration,assetRef.current?.revision].join('\0')
    const draw=animated=>{
      stop();const token=generation.current
      try{
        drawn.current=signature()
        const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches
        if(latest.current.welcomeMode==='media'){
          seat.current.replaceChildren();setPlaying(false)
          if(!assetRef.current){const note=doc.createElement('p');note.textContent='上传动图或短视频后在这里预览';seat.current.append(note);return}
          const media=createWelcomeMediaPlayer(doc,win,assetRef.current,latest.current,{autoplay:animated&&!quiet,
            onComplete:()=>{if(mounted.current&&generation.current===token)setPlaying(false)},
            onError:()=>{if(mounted.current&&generation.current===token){setPlaying(false);setError('素材无法播放，请重新上传兼容文件。')}}})
          player.current={media};seat.current.append(media.node);setPlaying(animated&&!quiet);setError('');return
        }
        const art=createWelcomeArt(doc,latest.current);seat.current.replaceChildren(art.svg)
        const animations=animated&&!quiet?playWelcomeInk(art,latest.current.welcomeDuration):[]
        if(!animations.length)settle(art)
        player.current={art,animations};setError('');setPlaying(animations.length>0)
        Promise.all(animations.map(a=>a.finished)).then(()=>{if(generation.current===token){stop();setPlaying(false)}},()=>{})
      }catch{setPlaying(false);setError('字体预览暂不可用，请检查字体名称。')}
    }
    React.useEffect(()=>{
      const timer=win.setTimeout(()=>{if(drawn.current!==signature())draw(false)},220)
      return()=>win.clearTimeout(timer)
    },[value.welcomeMode,value.welcomeText,value.welcomeFont,value.welcomeDuration,value.welcomeMediaFit,value.welcomeMediaDuration,asset?.revision])
    React.useEffect(()=>{
      let live=true
      mediaStore?.load().then(saved=>{if(live)setAsset(saved||null)},()=>{if(live)setError('本机素材存储不可用，书写开屏仍可使用。')})
      return()=>{live=false}
    },[value.welcomeMediaRevision])
    React.useEffect(()=>{
      mounted.current=true
      const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
      const cancel=()=>{if(doc.hidden||quiet.matches){stop();setPlaying(false)}}
      quiet.addEventListener('change',cancel);doc.addEventListener('visibilitychange',cancel)
      return()=>{mounted.current=false;stop();quiet.removeEventListener('change',cancel);doc.removeEventListener('visibilitychange',cancel)}
    },[])
    const save=()=>{
      const next=normalizeWelcome({...value,welcomeText:text,welcomeFont:font});setText(next.welcomeText);setFont(next.welcomeFont);latest.current=next;onChange(next)
    }
    const speeds=[[1200,'轻快'],[1700,'适中'],[2400,'舒缓'],[3200,'慢速'],[4000,'更慢']]
    const choices=(label,options,selected,change)=>{
      const chosen=Math.max(0,options.findIndex(([id])=>id===selected))
      return h('div',{className:'dcb-welcome-speeds',role:'radiogroup','aria-label':label},options.map(([id,name],index)=>h('button',{key:id,type:'button',role:'radio','aria-checked':selected===id,tabIndex:index===chosen?0:-1,
        onClick:()=>change(id),onKeyDown:event=>{const size=options.length,at={ArrowRight:(index+1)%size,ArrowDown:(index+1)%size,ArrowLeft:(index+size-1)%size,ArrowUp:(index+size-1)%size,Home:0,End:size-1}[event.key];if(at!==undefined){event.preventDefault();change(options[at][0]);event.currentTarget.parentElement.children[at].focus()}}},name)))
    }
    const upload=async file=>{
      if(!file||busy)return
      setBusy(true);setError('');stop();setPlaying(false)
      try{
        const saved=await inspectWelcomeMedia(file,doc,win)
        if(!mounted.current)return
        await mediaStore.save(saved)
        if(!mounted.current)return
        setAsset(saved);onChange({welcomeMode:'media',welcomeMediaRevision:saved.revision})
      }catch(error){if(mounted.current)setError(error.message||'素材保存失败')}
      finally{if(mounted.current)setBusy(false);if(fileInput.current)fileInput.current.value=''}
    }
    const remove=async()=>{
      if(busy)return
      setBusy(true);stop();setPlaying(false)
      try{await mediaStore.remove();if(mounted.current){setAsset(null);onChange({welcomeMode:'text',welcomeMediaRevision:''});setError('')}}catch(error){if(mounted.current)setError(error.message)}finally{if(mounted.current)setBusy(false)}
    }
    const mediaMode=value.welcomeMode==='media'
    return h('section',{className:'dcb-settings-block dcb-settings-card','data-dcb-settings-block':'welcome'},
      h('div',{className:'dcb-settings-header'},h('div',null,h('h2',null,'开屏欢迎'),h('p',null,'DSH Logo 与欢迎文字，或你自己的动图、短视频'))),
      h('div',{className:'dcb-settings-row'},h('div',{className:'dcb-settings-copy'},h('span',{className:'dcb-settings-row-title'},'开屏欢迎动效',h('span',{className:'dcb-cost-tag'},'启动时短暂计算')),h('p',{className:'dcb-settings-row-desc'},'按字体生成少量笔迹路径，仅启动或预览时处理；关闭后直接展示原生界面。')),
        h('button',{type:'button',role:'switch',className:'dcb-switch','aria-label':'开屏欢迎动效','aria-checked':value.welcomeEnabled,onClick:()=>onChange({welcomeEnabled:!value.welcomeEnabled})})),
      choices('开屏类型',[['text','Logo ＋ 书写欢迎'],['media','动图 / 短视频']],value.welcomeMode,welcomeMode=>onChange({welcomeMode})),
      h('div',{className:'dcb-welcome-collapse','data-open':!mediaMode,'aria-hidden':mediaMode,inert:mediaMode},h('div',null,
      h('div',{className:'dcb-settings-row'},h('div',{className:'dcb-settings-copy'},h('span',{className:'dcb-settings-row-title'},'显示 DSH Logo'),h('p',{className:'dcb-settings-row-desc'},'在欢迎文字上方柔和出现，复用宿主原生 Logo。')),
        h('button',{type:'button',role:'switch',className:'dcb-switch','aria-label':'显示 DSH Logo','aria-checked':value.welcomeLogo,onClick:()=>onChange({welcomeLogo:!value.welcomeLogo})})),
      h('div',{className:'dcb-welcome-fields'},
        h('label',{className:'dcb-welcome-field'},'欢迎文字',h('input',{type:'text','aria-label':'欢迎文字',value:text,maxLength:WELCOME_TEXT_LIMIT*2,onChange:e=>setText(e.target.value),onBlur:save,onKeyDown:e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing)e.currentTarget.blur()}})),
        h('label',{className:'dcb-welcome-field'},'字体名称',h('input',{type:'text','aria-label':'欢迎字体',value:font,maxLength:80,onChange:e=>setFont(e.target.value),onBlur:save,onKeyDown:e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing)e.currentTarget.blur()}}))),
      h('p',null,`萝莉体填 Lolita；可填其他已安装字体名，找不到时使用系统字体。文字最多 ${WELCOME_TEXT_LIMIT} 个字符，可填写 DeepSeek Harness。`),
      h('div',{className:'dcb-settings-section-title',style:{marginTop:'14px'}},'书写速度'),
      choices('书写速度',speeds.map(([duration,label])=>[duration,`${label} · ${(duration/1000).toFixed(1)} 秒`]),value.welcomeDuration,welcomeDuration=>onChange({welcomeDuration})))),
      h('div',{className:'dcb-welcome-collapse','data-open':mediaMode,'aria-hidden':!mediaMode,inert:!mediaMode},h('div',null,
        h('div',{className:'dcb-welcome-upload'},h('span',{className:'dcb-cost-tag','data-cost':'high'},'视频 / 动图较高开销'),
          h('p',{className:'dcb-welcome-file-name'},asset?`${asset.name} · ${(asset.size/1024/1024).toFixed(1)} MB · ${asset.width} × ${asset.height}${asset.kind==='video'?` · ${asset.duration.toFixed(1)} 秒`:''}`:'尚未选择素材'),
          h('p',null,'支持 GIF、APNG、WebP、MP4、WebM；最多 20MB，视频不超过 15 秒。建议 1080p 以下、2–5 秒。'),
          h('input',{ref:fileInput,type:'file',hidden:true,accept:'.gif,.png,.apng,.webp,.mp4,.webm','aria-label':'上传开屏素材',onChange:event=>upload(event.target.files?.[0])}),
          h('div',{className:'dcb-welcome-upload-actions'},h('button',{type:'button',className:'dcb-welcome-play',disabled:busy,onClick:()=>fileInput.current?.click()},busy?'正在检查素材…':asset?'更换开屏素材':'上传开屏素材'),
            asset&&h('button',{type:'button',className:'dcb-welcome-play',disabled:busy,onClick:remove},'移除素材'))),
        h('div',{className:'dcb-settings-section-title'},'画面适配'),choices('画面适配',[['contain','完整显示'],['cover','铺满裁切']],value.welcomeMediaFit,welcomeMediaFit=>onChange({welcomeMediaFit})),
        h('div',{className:'dcb-settings-section-title'},'动图显示时长'),choices('动图显示时长',[[2000,'2 秒'],[3000,'3 秒'],[5000,'5 秒']],value.welcomeMediaDuration,welcomeMediaDuration=>onChange({welcomeMediaDuration})),
        h('p',null,'短视频静音播放一次后进入主界面；动图按所选时长退场。文件只保存在本机，可随时移除。'))),
      h('div',{className:'dcb-motion-preview-head'},h('small',null,'局部预览'),h('button',{type:'button',className:'dcb-welcome-play',onClick:()=>{save();draw(true)}},playing?'重新播放欢迎预览':'播放欢迎预览')),
      h('div',{className:'dcb-welcome-demo','data-mode':value.welcomeMode,role:'img','aria-label':mediaMode?'自定义素材开屏预览':`欢迎预览：${value.welcomeText}`},
        h('div',{className:'dcb-welcome-preview-brand','data-shown':!mediaMode&&value.welcomeLogo,'aria-hidden':true},FishLogo&&h(FishLogo,{size:64})),h('div',{className:'dcb-welcome-demo-content',ref:seat})),
      h('p',{role:'status'},error||'修改自动保存，下次刷新或启动生效；深色主题下笔迹反白。预览不打断当前聊天。'))
  }
}
