import {createWelcomeArt} from './welcome-strokes.js'
import {normalizeWelcome,playWelcomeInk} from './welcome-font.js'
import {motion} from './motion.js'
import {inspectWelcomeMedia,createWelcomeMediaPlayer,welcomeMediaCss} from './welcome-media.js'
import {createWelcomeCodePlayer,inspectWelcomeCode,inspectWelcomeCodeFile,welcomeCodeExample} from './welcome-code.js'
import {createCharacterWelcomeArt,playCharacterWelcome} from './welcome-characters.js'

export const welcomeSettingsCss=`
  ${welcomeMediaCss}
  .dcb-welcome-fields { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:16px 0; }
  .dcb-welcome-field { display:grid; gap:7px; min-width:0; font-size:12px; color:var(--dsh-settings-secondary); }
  .dcb-welcome-field input { box-sizing:border-box; width:100%; min-width:0; min-height:44px; padding:9px 11px; border:1px solid var(--dsh-settings-border); border-radius:8px; background:transparent; color:var(--dsh-settings-text); font:13px/20px system-ui; outline:none; transition:border-color 180ms ease,box-shadow 180ms ease; }
  .dcb-welcome-fields[data-characters=true] { grid-template-columns:1fr; }
  .dcb-welcome-field input:focus { border-color:#888b; box-shadow:0 0 0 3px #8882; }
  .dcb-welcome-speeds { display:flex; flex-wrap:nowrap; box-sizing:border-box; width:100%; min-width:0; gap:4px; margin:10px 0 16px; padding:5px; border:1px solid var(--dsh-settings-border); border-radius:15px; background:var(--dsh-settings-subtle); }
  .dcb-welcome-speeds button { flex:1 1 0; min-width:0; min-height:44px; padding:9px 12px; border:1px solid transparent; border-radius:10px; background:transparent; color:var(--dsh-settings-secondary); font:500 13px/20px system-ui,sans-serif; cursor:pointer; touch-action:manipulation; transition:background-color ${motion.time.control}ms ${motion.ease.color},color ${motion.time.control}ms ${motion.ease.color},border-color ${motion.time.control}ms ${motion.ease.color},box-shadow ${motion.time.control}ms ${motion.ease.color},transform ${motion.time.control}ms ${motion.ease.smooth}; }
  .dcb-welcome-speeds button:not([aria-checked=true]):hover:enabled { background:#8881; color:var(--dsh-settings-text); }
  .dcb-welcome-speeds button[aria-checked=true] { background:var(--dsh-settings-surface); border-color:var(--dsh-settings-border); color:var(--dsh-settings-text); box-shadow:0 2px 5px #0000000c; font-weight:600; }
  .dcb-welcome-speeds button:disabled { opacity:.4; cursor:default; box-shadow:none; transform:none; }
  .dcb-welcome-play { min-height:44px; padding:7px 12px; border:1px solid var(--dsh-settings-border); border-radius:8px; background:transparent; color:inherit; font:12px/18px system-ui; cursor:pointer; transition:background-color ${motion.time.control}ms ${motion.ease.color},border-color ${motion.time.control}ms ${motion.ease.color},transform ${motion.time.control}ms ${motion.ease.smooth}; }
  .dcb-welcome-speeds button:active:enabled,.dcb-welcome-play:active:enabled { transform:scale(.94); }
  .dcb-welcome-play:disabled { opacity:.4; cursor:default; transform:none; }
  .dcb-welcome-speeds button:focus-visible,.dcb-welcome-play:focus-visible { outline:2px solid var(--dsh-settings-accent,var(--dsh-settings-text)); outline-offset:1px; }
  .dcb-welcome-demo { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:156px; padding:16px; border:1px solid #8883; border-radius:12px; background:#fafbfc; overflow:hidden; transition:background-color 220ms ease; }
  .dcb-welcome-demo[data-mode=media] { height:240px; padding:0; }
  .dcb-welcome-demo[data-mode=code] { height:240px; padding:0; }
  .dcb-welcome-demo-content { width:100%; min-height:0; display:grid; place-items:center; }
  .dcb-welcome-demo[data-mode=media] .dcb-welcome-demo-content { height:100%; }
  .dcb-welcome-demo[data-mode=code] .dcb-welcome-demo-content { height:100%; }
  .dcb-welcome-preview-brand { display:grid; place-items:center; width:90px; height:64px; margin-bottom:12px; color:#111; overflow:hidden; transition:height 280ms ${motion.ease.smooth},margin-bottom 280ms ${motion.ease.smooth},opacity 220ms ease,transform 280ms ${motion.ease.smooth}; }
  .dcb-welcome-preview-brand[data-shown=false] { height:0; margin-bottom:0; opacity:0; transform:translateY(-8px) scale(.9); }
  .dcb-welcome-preview-brand svg { display:block; width:90px; height:64px; }
  body[data-ds-dark-theme] .dcb-welcome-preview-brand { color:#ededf0; }
  .dcb-welcome-collapse { display:grid; grid-template-rows:1fr; opacity:1; transform:none; transition:grid-template-rows 280ms ${motion.ease.smooth},opacity 220ms ease,transform 280ms ${motion.ease.smooth}; }
  .dcb-welcome-collapse[data-open=false] { grid-template-rows:0fr; opacity:0; transform:translateY(-8px); }
  .dcb-welcome-collapse > div { min-height:0; overflow:hidden; }
  .dcb-welcome-upload { margin:12px 0; padding:14px; border:1px dashed #8886; border-radius:10px; }
  .dcb-welcome-code-editor { display:grid; gap:10px; margin:12px 0; padding:14px; border:1px dashed #8886; border-radius:10px; }
  .dcb-welcome-code-editor textarea { box-sizing:border-box; width:100%; min-height:220px; resize:vertical; border:1px solid var(--dsh-settings-border); border-radius:10px; padding:12px; background:var(--dsh-settings-subtle); color:var(--dsh-settings-text); font:12px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace; outline:none; }
  .dcb-welcome-code-editor textarea:focus { border-color:var(--dsh-settings-accent,var(--dsh-settings-text)); box-shadow:0 0 0 3px #8882; }
  .dcb-welcome-upload-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .dcb-welcome-file-name { overflow-wrap:anywhere; }
  .dcb-welcome-demo [data-dcb-welcome-art] { display:block; width:100%; max-width:440px; height:120px; color:#111; overflow:visible; }
  .dcb-welcome-demo [data-dcb-welcome-stroke] { fill:none; stroke-width:5.3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:1; stroke-dashoffset:1; }
  .dcb-welcome-demo [data-dcb-welcome-code] { width:100%; height:100%; }
  .dcb-welcome-demo [data-dcb-welcome-code] > iframe { display:block; width:100%; height:100%; border:0; }
  .dcb-welcome-demo [data-dcb-welcome-character-logo] { display:block; width:min(100%,380px); height:180px; color:var(--dsh-settings-text); }
  body[data-ds-dark-theme] .dcb-welcome-demo { background:#1b1b1d; }
  body[data-ds-dark-theme] .dcb-welcome-demo [data-dcb-welcome-art] { color:#ededf0; }
  @media(max-width:600px) { .dcb-welcome-fields { grid-template-columns:1fr; } }
  @container dcb-settings-page (max-width:580px) { .dcb-welcome-speeds { flex-wrap:wrap; } .dcb-welcome-speeds button { flex:1 1 120px; padding:9px 8px; } }
  @media(prefers-reduced-motion:reduce) { .dcb-welcome-field input,.dcb-welcome-speeds button,.dcb-welcome-play,.dcb-welcome-collapse,.dcb-welcome-preview-brand { transition:none; } .dcb-welcome-speeds button:active:enabled,.dcb-welcome-play:active:enabled { transform:none; } }
  @media(forced-colors:active) { .dcb-welcome-demo,.dcb-welcome-field input,.dcb-welcome-speeds,.dcb-welcome-speeds button,.dcb-welcome-play { background:Canvas; color:CanvasText; border-color:CanvasText; box-shadow:none; } .dcb-welcome-speeds button[aria-checked=true] { outline:2px solid Highlight; outline-offset:-3px; } .dcb-welcome-demo [data-dcb-welcome-art] { color:CanvasText!important; } }
`

export function createWelcomeSettings(React,doc,win,{mediaStore,codeStore,FishLogo}={}){
  const h=React.createElement
  return function WelcomeSettings({value,onChange,theme='light'}){
    const [chars,setChars]=React.useState(value.welcomeCharacters),[playing,setPlaying]=React.useState(false),[error,setError]=React.useState(''),[asset,setAsset]=React.useState(null),[codeAsset,setCodeAsset]=React.useState(null),[code,setCode]=React.useState(''),[busy,setBusy]=React.useState(false)
    const seat=React.useRef(null),brand=React.useRef(null),player=React.useRef(null),latest=React.useRef(value),generation=React.useRef(0),drawn=React.useRef(''),assetRef=React.useRef(null),fileInput=React.useRef(null),codeInput=React.useRef(null),codeName=React.useRef('自定义代码开屏'),mounted=React.useRef(false),activeTheme=React.useRef(theme),codeTheme=React.useRef(theme)
    activeTheme.current=theme
    latest.current=value
    assetRef.current=asset
    React.useEffect(()=>setChars(value.welcomeCharacters),[value.welcomeCharacters])
    const settle=art=>{for(const path of art.strokes||[])path.style.strokeDashoffset='0';for(const rect of art.finishes||[])rect.setAttribute('opacity','1')}
    const stop=()=>{
      generation.current++
      if(player.current){
        player.current.media?.freeze();player.current.media?.dispose();player.current.code?.dispose()
        if(player.current.art)settle(player.current.art)
        for(const a of player.current.animations||[])a.cancel();player.current=null
      }
    }
    const signature=()=>[latest.current.welcomeMode,latest.current.welcomeText,latest.current.welcomeDuration,latest.current.welcomeCharacters,latest.current.welcomeMediaFit,latest.current.welcomeMediaDuration,latest.current.welcomeCodeDuration,assetRef.current?.revision,latest.current.welcomeCodeRevision].join('\0')
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
        if(latest.current.welcomeMode==='code'){
          seat.current.replaceChildren();setPlaying(false)
          const note=message=>{const p=doc.createElement('p');p.textContent=message;seat.current?.replaceChildren(p)}
          if(!animated||quiet){note(quiet?'已减少动态效果，不运行代码预览':'点击播放预览；编辑完成后点击“应用代码开屏”保存');return}
          const draft=inspectWelcomeCode(code,codeName.current)
          const done=message=>{if(mounted.current&&generation.current===token){player.current?.code?.dispose();player.current=null;setPlaying(false);note(message)}}
          const codePlayer=createWelcomeCodePlayer(doc,win,draft,latest.current,{onComplete:()=>done('预览已结束'),onError:()=>{done('预览未能运行');if(mounted.current&&generation.current===token)setError('代码无法运行：请检查语法，并将图片、字体和脚本内嵌到同一个文件。')}})
          player.current={code:codePlayer};seat.current.append(codePlayer.node);setPlaying(true);setError('');return
        }
        if(latest.current.welcomeMode==='characters'){
          const art=createCharacterWelcomeArt(doc,brand.current,latest.current.welcomeCharacters)
          if(art){
            seat.current.replaceChildren(art.svg)
            const caption=doc.createElement('p');caption.textContent=latest.current.welcomeText;seat.current.append(caption)
            const animations=animated&&!quiet?playCharacterWelcome(art,latest.current.welcomeDuration):[]
            player.current={art,animations};setError('');setPlaying(animations.length>0)
            Promise.all(animations.map(a=>a.finished)).then(()=>{if(generation.current===token){stop();setPlaying(false)}},()=>{})
            return
          }
        }
        const art=createWelcomeArt(doc,latest.current);seat.current.replaceChildren(art.svg)
        const animations=animated&&!quiet?playWelcomeInk(art,latest.current.welcomeDuration):[]
        if(!animations.length)settle(art)
        player.current={art,animations};setError('');setPlaying(animations.length>0)
        Promise.all(animations.map(a=>a.finished)).then(()=>{if(generation.current===token){stop();setPlaying(false)}},()=>{})
      }catch(error){setPlaying(false);setError(latest.current.welcomeMode==='code'?(error.message||'代码预览暂不可用'):'字体预览暂不可用，请检查字体名称。')}
    }
    React.useEffect(()=>{
      const timer=win.setTimeout(()=>{if(drawn.current!==signature())draw(false)},220)
      return()=>win.clearTimeout(timer)
    },[value.welcomeMode,value.welcomeText,value.welcomeDuration,value.welcomeCharacters,value.welcomeMediaFit,value.welcomeMediaDuration,value.welcomeCodeDuration,asset?.revision,codeAsset?.revision])
    React.useEffect(()=>{
      let live=true
      stop();setPlaying(false);setAsset(null);setError('')
      mediaStore?.load(value.welcomeMediaRevision||(value.welcomeThemes?'':undefined)).then(saved=>{if(live)setAsset(saved||null)},()=>{if(live)setError('本机素材存储不可用，默认开屏仍可使用。')})
      return()=>{live=false}
    },[value.welcomeMediaRevision,theme])
    React.useEffect(()=>{
      let live=true
      if(codeTheme.current!==theme){stop();setPlaying(false);setCodeAsset(null);setCode('');codeTheme.current=theme}
      codeStore?.load(value.welcomeCodeRevision||(value.welcomeThemes?'':undefined)).then(saved=>{if(live){setCodeAsset(saved||null);setCode(saved?.source||'');codeName.current=saved?.name||'自定义代码开屏'}},()=>{if(live)setError('本机代码开屏存储不可用，可继续编辑但无法保存。')})
      return()=>{live=false}
    },[value.welcomeCodeRevision,theme])
    React.useEffect(()=>{
      mounted.current=true
      const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
      const cancel=()=>{if(doc.hidden||quiet.matches){stop();setPlaying(false)}}
      quiet.addEventListener('change',cancel);doc.addEventListener('visibilitychange',cancel)
      return()=>{mounted.current=false;stop();quiet.removeEventListener('change',cancel);doc.removeEventListener('visibilitychange',cancel)}
    },[])
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
        if(activeTheme.current===theme)setAsset(saved);onChange({welcomeMode:'media',welcomeMediaRevision:saved.revision},theme)
      }catch(error){if(mounted.current)setError(error.message||'素材保存失败')}
      finally{if(mounted.current)setBusy(false);if(fileInput.current)fileInput.current.value=''}
    }
    const remove=async()=>{
      if(busy)return
      setBusy(true);stop();setPlaying(false)
      const keep=value.welcomeThemes?Object.entries(value.welcomeThemes).filter(([key])=>key!==theme).map(([,item])=>item.welcomeMediaRevision):[value.welcomeMediaRevision]
      try{await mediaStore.remove(value.welcomeMediaRevision,keep);if(mounted.current){if(activeTheme.current===theme)setAsset(null);onChange({welcomeMode:'characters',welcomeMediaRevision:''},theme);setError('')}}catch(error){if(mounted.current)setError(error.message)}finally{if(mounted.current)setBusy(false)}
    }
    const applyCode=async()=>{
      if(busy)return
      setBusy(true);setError('');stop();setPlaying(false)
      try{
        const saved=inspectWelcomeCode(code,codeName.current);await codeStore.save(saved)
        if(mounted.current){if(activeTheme.current===theme)setCodeAsset(saved);onChange({welcomeMode:'code',welcomeCodeRevision:saved.revision,welcomeCodeName:saved.name},theme)}
      }catch(error){if(mounted.current)setError(error.message||'代码保存失败')}
      finally{if(mounted.current)setBusy(false)}
    }
    const importCode=async file=>{
      if(!file||busy)return
      setBusy(true);setError('');stop();setPlaying(false)
      try{const imported=await inspectWelcomeCodeFile(file);if(mounted.current){setCode(imported.source);codeName.current=imported.name}}
      catch(error){if(mounted.current)setError(error.message||'代码读取失败')}
      finally{if(mounted.current)setBusy(false)}
    }
    const mediaMode=value.welcomeMode==='media',codeMode=value.welcomeMode==='code',characterMode=value.welcomeMode==='characters'
    return h('section',{className:'dcb-settings-block dcb-settings-card','data-dcb-settings-block':'welcome'},
      h('div',{className:'dcb-settings-header'},h('div',null,h('h2',null,'开屏欢迎'),h('p',null,'默认字符 Logo，也可用代码文件、动图或视频制作自己的开屏'))),
      h('div',{className:'dcb-settings-row'},h('div',{className:'dcb-settings-copy'},h('span',{className:'dcb-settings-row-title'},'开屏欢迎动效',h('span',{className:'dcb-cost-tag'},'仅启动或预览时运行')),h('p',{className:'dcb-settings-row-desc'},'播放完成后淡出进入聊天；关闭后直接展示原生界面。')),
        h('button',{type:'button',role:'switch',className:'dcb-switch','aria-label':'开屏欢迎动效','aria-checked':value.welcomeEnabled,onClick:()=>onChange({welcomeEnabled:!value.welcomeEnabled})})),
      choices('开屏类型',[['characters','默认 · Logo 字符填充'],['code','自定义代码'],['media','动图 / 短视频']],value.welcomeMode,welcomeMode=>{stop();setPlaying(false);onChange({welcomeMode})}),
      h('div',{className:'dcb-welcome-collapse','data-open':characterMode,'aria-hidden':!characterMode,inert:!characterMode},h('div',null,
      h('div',{className:'dcb-welcome-fields','data-characters':true},
        h('label',{className:'dcb-welcome-field'},'填充字符',h('input',{'aria-label':'Logo 填充字符',value:chars,maxLength:64,onChange:event=>setChars(event.target.value),onBlur:()=>onChange({welcomeCharacters:normalizeWelcome({...value,welcomeCharacters:chars}).welcomeCharacters}),onKeyDown:event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing)event.currentTarget.blur()}}))),
      h('div',{className:'dcb-settings-section-title',style:{marginTop:'14px'}},'填充速度'),
      choices('填充速度',speeds.map(([duration,label])=>[duration,`${label} · ${(duration/1000).toFixed(1)} 秒`]),value.welcomeDuration,welcomeDuration=>onChange({welcomeDuration})))),
      h('div',{className:'dcb-welcome-collapse','data-open':codeMode,'aria-hidden':!codeMode,inert:!codeMode},h('div',null,
        h('div',{className:'dcb-welcome-code-editor'},h('strong',null,'单文件代码开屏'),
          h('p',null,codeAsset?`已保存：${codeAsset.name} · ${(codeAsset.size/1024).toFixed(1)} KB`:'尚未保存代码开屏'),
          h('p',null,'像 HTML 自定义背景一样，可粘贴 HTML / CSS / JavaScript，或导入 .html、.css、.js 文件。图片、字体与库需内嵌；不加载外部网址或相邻文件。'),
          h('textarea',{'aria-label':'开屏动画代码',value:code,spellCheck:false,onChange:event=>setCode(event.target.value)}),
          h('input',{ref:codeInput,type:'file',hidden:true,accept:'.html,.htm,.css,.js','aria-label':'导入开屏代码文件',onChange:event=>{const file=event.target.files?.[0];event.target.value='';importCode(file)}}),
          h('div',{className:'dcb-welcome-upload-actions'},h('button',{type:'button',className:'dcb-welcome-play',disabled:busy,onClick:()=>codeInput.current?.click()},'导入代码文件'),h('button',{type:'button',className:'dcb-welcome-play',disabled:busy,onClick:()=>{stop();setPlaying(false);setCode(welcomeCodeExample);codeName.current='Harness 代码示例'}},'载入代码示例'),h('button',{type:'button',className:'dcb-welcome-play',disabled:busy||!code.trim(),onClick:applyCode},busy?'保存中…':'应用代码开屏')),
          h('p',null,'按当前窗口尺寸显示。结束时可调用 window.dshWelcomeDone()；没有调用时按最长时长退场。代码仅保存在本机，切换开屏类型仍保留。')),
        h('div',{className:'dcb-settings-section-title'},'代码最长播放时长'),choices('代码最长播放时长',[[3000,'3 秒'],[5000,'5 秒'],[10000,'10 秒'],[15000,'15 秒']],value.welcomeCodeDuration,welcomeCodeDuration=>onChange({welcomeCodeDuration})))),
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
      h('div',{className:'dcb-motion-preview-head'},h('small',null,'局部预览'),h('button',{type:'button',className:'dcb-welcome-play',onClick:()=>{if(codeMode&&playing){stop();setPlaying(false);const note=doc.createElement('p');note.textContent='预览已停止';seat.current.replaceChildren(note)}else draw(true)}},codeMode&&playing?'停止代码预览':playing?'重新播放欢迎预览':'播放欢迎预览')),
      h('div',{className:'dcb-welcome-demo','data-mode':value.welcomeMode,role:'img','aria-label':codeMode?'自定义代码开屏预览':mediaMode?'自定义素材开屏预览':'鲸鱼 Logo 字符开屏预览'},
        h('div',{className:'dcb-welcome-preview-brand',ref:brand,'data-shown':false,'aria-hidden':true},FishLogo&&h(FishLogo,{size:64})),h('div',{className:'dcb-welcome-demo-content',ref:seat})),
      h('p',{role:error?'alert':'status'},error||'选项自动保存；代码需点击应用。下次刷新或启动生效，预览不打断当前聊天。'))
  }
}
