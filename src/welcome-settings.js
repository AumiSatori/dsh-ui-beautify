import {createWelcomeArt} from './welcome-strokes.js'
import {normalizeWelcome,playWelcomeInk} from './welcome-font.js'
import {motion} from './motion.js'
import {inspectWelcomeMedia,createWelcomeMediaPlayer,welcomeMediaCss} from './welcome-media.js'
import {createWelcomeCodePlayer,inspectWelcomeCode,inspectWelcomeCodeFile,welcomeCodeExample} from './welcome-code.js'
import {createCharacterWelcomeArt,playCharacterWelcome} from './welcome-characters.js'
import {themeWelcome} from './welcome-theme.js'
import {themeAssignments,themeAssignmentsCss} from './theme-assignments.js'
import {mountWelcomeGesture,welcomeGestureCss,welcomeGestureDocument} from './welcome-gesture.js'
import {welcomeCodeMode} from './welcome-code-modes.js'

export const welcomeSettingsCss=`
  ${welcomeMediaCss}
  ${themeAssignmentsCss}
  ${welcomeGestureCss}
  .dcb-gesture-recorder { margin:14px 0; border:1px solid var(--dsh-settings-border); border-radius:12px; overflow:hidden; }
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
  .dcb-welcome-demo[data-mode=code][data-interactive=true] { height:480px; }
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
  .dcb-welcome-code-editor textarea { box-sizing:border-box; width:100%; height:220px; min-height:180px; resize:vertical; border:1px solid var(--dsh-settings-border); border-radius:10px; padding:12px; background:var(--dsh-settings-subtle); color:var(--dsh-settings-text); font:12px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace; outline:none; }
  .dcb-welcome-code-editor textarea:focus { border-color:var(--dsh-settings-accent,var(--dsh-settings-text)); box-shadow:0 0 0 3px #8882; }
  .dcb-welcome-history { display:grid; gap:10px; margin:14px 0; padding:14px; border:1px solid var(--dsh-settings-border); border-radius:11px; background:var(--dsh-settings-subtle); }
  .dcb-welcome-history-heading { display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
  .dcb-welcome-history-heading strong { font-size:13px; }
  .dcb-welcome-history-heading small { color:var(--dsh-settings-secondary); font-size:11px; }
  .dcb-welcome-history-list { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:8px; }
  .dcb-welcome-history-item { display:grid; grid-template-columns:54px minmax(0,1fr); align-items:center; gap:10px; min-width:0; min-height:70px; padding:8px; border:1px solid var(--dsh-settings-border); border-radius:10px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); text-align:left; cursor:pointer; font:inherit; transition:transform 220ms ${motion.ease.snappy},border-color 180ms ${motion.ease.color},background-color 180ms ${motion.ease.color},box-shadow 180ms ${motion.ease.color}; }
  .dcb-welcome-history-item:hover { transform:translateY(-2px); border-color:var(--dsh-settings-text); box-shadow:0 5px 14px #0000000b; }
  .dcb-welcome-history-item:active { transform:scale(.98); }
  .dcb-welcome-history-item:focus-visible { outline:2px solid var(--dsh-settings-text); outline-offset:2px; }
  .dcb-welcome-history-item[data-selected=true] { border-color:var(--dsh-settings-text); background:var(--dsh-settings-subtle); }
  .dcb-welcome-history-icon { display:flex; align-items:center; justify-content:center; gap:2px; width:54px; height:46px; overflow:hidden; border-radius:7px; background:var(--dsh-settings-subtle); color:var(--dsh-settings-secondary); }
  .dcb-welcome-history-icon i { display:block; width:5px; border-radius:5px; background:currentColor; }
  .dcb-welcome-history-copy { display:grid; min-width:0; gap:2px; }
  .dcb-welcome-history-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; font-weight:600; }
  .dcb-welcome-history-meta { color:var(--dsh-settings-secondary); font-size:11px; line-height:16px; }
  .dcb-welcome-history-empty { margin:0; color:var(--dsh-settings-secondary); font-size:12px; line-height:1.6; }
  .dcb-welcome-upload-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .dcb-welcome-code-heading { display:flex; align-items:baseline; justify-content:space-between; flex-wrap:wrap; gap:6px 16px; }
  .dcb-welcome-code-heading small { color:var(--dsh-settings-secondary); overflow-wrap:anywhere; }
  .dcb-welcome-code-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px 0; }
  .dcb-welcome-code-actions > .dcb-welcome-play { margin-inline-end:8px; }
  .dcb-welcome-code-actions > .dcb-welcome-apply { margin-inline-start:auto; margin-inline-end:0; }
  .dcb-welcome-example-action { display:grid; max-width:240px; margin-inline-end:8px; animation:dcb-welcome-example-in 220ms cubic-bezier(.22,.8,.26,1) both; transition:max-width 220ms cubic-bezier(.4,0,.2,1),margin-inline-end 220ms ease,opacity 220ms ease,transform 220ms cubic-bezier(.4,0,.2,1),filter 220ms ease; }
  .dcb-welcome-example-action > div { min-width:0; overflow:hidden; }
  .dcb-welcome-example-action button { white-space:nowrap; }
  .dcb-welcome-example-action[data-open=false] { max-width:0; margin-inline-end:0; opacity:0; transform:translateY(-6px) scale(.9); filter:blur(2px); pointer-events:none; animation:none; }
  .dcb-welcome-gesture-example p { margin:8px 0 0; font-size:12px; line-height:1.7; color:var(--dsh-settings-secondary); }
  .dcb-welcome-gesture-example[hidden] { display:none; }
  @keyframes dcb-welcome-example-in { from{opacity:0;transform:translateY(6px) scale(.9);filter:blur(2px)}to{opacity:1;transform:none;filter:blur(0)} }
  @container dcb-settings-page (max-width:580px) { .dcb-welcome-code-actions > .dcb-welcome-apply { flex:1 1 100%; margin-inline-start:0; } }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { .dcb-welcome-example-action { animation:none; transition:none; } }
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

export function createWelcomeSettings(React,doc,win,{mediaStore,codeStore,FishLogo,onThemeChange}={}){
  const h=React.createElement
  function GestureRecorder({onPattern}){
    const seat=React.useRef(null),callback=React.useRef(onPattern);callback.current=onPattern
    React.useEffect(()=>{const gesture=mountWelcomeGesture(doc,win,{setup:true,onPattern:pattern=>callback.current(pattern)});seat.current.append(gesture.node);return()=>gesture.dispose()},[])
    return h('div',{className:'dcb-gesture-recorder',ref:seat})
  }
  return function WelcomeSettings({value,onChange,theme='light'}){
    const mode=welcomeCodeMode(value),slot=theme+':'+mode
    const [chars,setChars]=React.useState(value.welcomeCharacters),[playing,setPlaying]=React.useState(false),[error,setError]=React.useState(''),[asset,setAsset]=React.useState(null),[codeAsset,setCodeAsset]=React.useState(null),[code,setCode]=React.useState(''),[busy,setBusy]=React.useState(false)
    const seat=React.useRef(null),brand=React.useRef(null),player=React.useRef(null),latest=React.useRef(value),generation=React.useRef(0),drawn=React.useRef(''),assetRef=React.useRef(null),fileInput=React.useRef(null),codeInput=React.useRef(null),codeName=React.useRef('自定义代码开屏'),mounted=React.useRef(false),activeTheme=React.useRef(theme),codeTheme=React.useRef(slot),activeSlot=React.useRef(slot),drafts=React.useRef(new Map())
    activeTheme.current=theme
    activeSlot.current=slot
    const editCode=(source,name=codeName.current)=>{drafts.current.set(slot,{source,name,revision:value.welcomeCodeRevision});codeName.current=name;setCode(source)}
    const [recording,setRecording]=React.useState(false),[recorderKey,setRecorderKey]=React.useState(0),[mediaNames,setMediaNames]=React.useState({}),[showGesture,setShowGesture]=React.useState(value.welcomeCodeInteractive===true),[showTimed,setShowTimed]=React.useState(value.welcomeCodeInteractive!==true),[history,setHistory]=React.useState([])
    const refreshHistory=()=>codeStore?.list?.().then(items=>{if(mounted.current)setHistory(items||[])}).catch(()=>{})
    React.useEffect(()=>{
      let live=true
      codeStore?.list?.().then(items=>{if(live)setHistory(items||[])}).catch(()=>{})
      return()=>{live=false}
    },[codeStore])
    const lightRevision=themeWelcome(value,'light').welcomeMediaRevision,darkRevision=themeWelcome(value,'dark').welcomeMediaRevision
    React.useEffect(()=>{let live=true;Promise.all(['light','dark'].map(async scheme=>{const revision=scheme==='light'?lightRevision:darkRevision;const saved=await mediaStore?.load(revision);return[scheme,saved?.name||'']})).then(entries=>{if(live)setMediaNames(Object.fromEntries(entries))},()=>{});return()=>{live=false}},[lightRevision,darkRevision])
    React.useEffect(()=>{setRecording(false);setRecorderKey(key=>key+1)},[theme])
    React.useEffect(()=>{
      if(value.welcomeCodeInteractive){let frame=win.requestAnimationFrame(()=>{frame=win.requestAnimationFrame(()=>setShowGesture(true))});return()=>win.cancelAnimationFrame(frame)}
      setRecording(false);setRecorderKey(key=>key+1)
      const timer=win.setTimeout(()=>setShowGesture(false),240)
      return()=>win.clearTimeout(timer)
    },[value.welcomeCodeInteractive])
    React.useEffect(()=>{
      if(!value.welcomeCodeInteractive){let frame=win.requestAnimationFrame(()=>{frame=win.requestAnimationFrame(()=>setShowTimed(true))});return()=>win.cancelAnimationFrame(frame)}
      const timer=win.setTimeout(()=>setShowTimed(false),240)
      return()=>win.clearTimeout(timer)
    },[value.welcomeCodeInteractive])
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
    const signature=()=>[latest.current.welcomeMode,latest.current.welcomeText,latest.current.welcomeDuration,latest.current.welcomeCharacters,latest.current.welcomeMediaFit,latest.current.welcomeMediaDuration,latest.current.welcomeCodeDuration,latest.current.welcomeCodeInteractive,assetRef.current?.revision,latest.current.welcomeCodeRevision].join('\0')
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
    },[value.welcomeMode,value.welcomeText,value.welcomeDuration,value.welcomeCharacters,value.welcomeMediaFit,value.welcomeMediaDuration,value.welcomeCodeDuration,value.welcomeCodeInteractive,asset?.revision,codeAsset?.revision])
    React.useEffect(()=>{
      let live=true
      stop();setPlaying(false);setAsset(null);setError('')
      mediaStore?.load(value.welcomeMediaRevision||(value.welcomeThemes?'':undefined)).then(saved=>{if(live)setAsset(saved||null)},()=>{if(live)setError('本机素材存储不可用，默认开屏仍可使用。')})
      return()=>{live=false}
    },[value.welcomeMediaRevision,theme])
    React.useEffect(()=>{
      let live=true
      stop();setPlaying(false);setCodeAsset(null);codeTheme.current=slot
      const cached=drafts.current.get(slot),keepDraft=cached?.revision===value.welcomeCodeRevision
      setCode(keepDraft?cached.source:'');codeName.current=keepDraft?cached.name:'自定义代码开屏'
      codeStore?.load(value.welcomeCodeRevision||'').then(saved=>{if(live){setCodeAsset(saved||null);const current=drafts.current.get(slot),draft=current?.revision===value.welcomeCodeRevision?current:{source:saved?.source||'',name:saved?.name||'自定义代码开屏',revision:value.welcomeCodeRevision};drafts.current.set(slot,draft);setCode(draft.source);codeName.current=draft.name}},()=>{if(live)setError('本机代码开屏存储不可用，可继续编辑但无法保存。')})
      return()=>{live=false}
    },[value.welcomeCodeRevision,slot])
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
        if(mounted.current){
          drafts.current.set(slot,{source:saved.source,name:saved.name,revision:saved.revision})
          if(activeSlot.current===slot)setCodeAsset(saved)
          const modes=themeWelcome(latest.current,theme).welcomeCodeModes
          onChange({welcomeMode:'code',welcomeCodeModes:{...modes,[mode]:{revision:saved.revision,name:saved.name}}},theme)
          refreshHistory()
        }
      }catch(error){if(mounted.current)setError(error.message||'代码保存失败')}
      finally{if(mounted.current)setBusy(false)}
    }
    const activateHistory=async item=>{
      if(!item||busy)return
      setBusy(true);setError('');stop();setPlaying(false)
      try{
        const saved=await codeStore.activate(item.revision)
        if(!mounted.current)return
        const modes=themeWelcome(latest.current,theme).welcomeCodeModes
        drafts.current.set(`${theme}:timed`,{source:saved.source,name:saved.name,revision:saved.revision})
        codeName.current=saved.name;setCode(saved.source);setCodeAsset(saved)
        onChange({welcomeMode:'code',welcomeCodeInteractive:false,welcomeCodeModes:{...modes,timed:{revision:saved.revision,name:saved.name}}},theme)
        refreshHistory()
      }catch(error){if(mounted.current)setError(error.message||'本机开屏切换失败')}
      finally{if(mounted.current)setBusy(false)}
    }
    const importCode=async file=>{
      if(!file||busy)return
      setBusy(true);setError('');stop();setPlaying(false)
      try{const imported=await inspectWelcomeCodeFile(file);if(mounted.current){drafts.current.set(slot,{source:imported.source,name:imported.name,revision:value.welcomeCodeRevision});if(activeSlot.current===slot){setCode(imported.source);codeName.current=imported.name}}}
      catch(error){if(mounted.current)setError(error.message||'代码读取失败')}
      finally{if(mounted.current)setBusy(false)}
    }
    const mediaMode=value.welcomeMode==='media',codeMode=value.welcomeMode==='code',characterMode=value.welcomeMode==='characters'
    return h('section',{className:'dcb-settings-block dcb-settings-card','data-dcb-settings-block':'welcome'},
      h('div',{className:'dcb-settings-header'},h('div',null,h('h2',null,'开屏欢迎'),h('p',null,'启动或刷新时播放开屏；可使用默认字符 Logo、自定义代码、动图或视频。'))),
      themeAssignments(h,{scope:'开屏欢迎',theme,onThemeChange,items:Object.fromEntries(['light','dark'].map(scheme=>{const item=themeWelcome(value,scheme),configured=item.welcomeMode==='characters'||!!(item.welcomeMode==='media'?item.welcomeMediaRevision:item.welcomeCodeRevision);return[scheme,{name:item.welcomeMode==='characters'?'Logo 字符填充':item.welcomeMode==='media'?mediaNames[scheme]||'动图 / 短视频 · 尚未选择素材':item.welcomeCodeName||'自定义代码 · 尚未应用',configured,enabled:item.welcomeEnabled&&configured}]}))}),
      h('div',{className:'dcb-settings-row'},h('div',{className:'dcb-settings-copy'},h('span',{className:'dcb-settings-row-title'},'开屏欢迎动效',h('span',{className:'dcb-cost-tag'},'仅启动或预览时运行')),h('p',{className:'dcb-settings-row-desc'},'播放完成后进入聊天；交互式开屏会等待操作，也可随时跳过。关闭后直接展示原生界面。')),
        h('button',{type:'button',role:'switch',className:'dcb-switch','aria-label':'开屏欢迎动效','aria-checked':value.welcomeEnabled,onClick:()=>onChange({welcomeEnabled:!value.welcomeEnabled})})),
      choices('开屏类型',[['characters','默认 · Logo 字符填充'],['code','自定义代码'],['media','动图 / 短视频']],value.welcomeMode,welcomeMode=>{stop();setPlaying(false);onChange({welcomeMode})}),
      h('div',{className:'dcb-welcome-collapse','data-open':characterMode,'aria-hidden':!characterMode,inert:!characterMode},h('div',null,
      h('div',{className:'dcb-welcome-fields','data-characters':true},
        h('label',{className:'dcb-welcome-field'},'填充字符',h('input',{'aria-label':'Logo 填充字符',value:chars,maxLength:64,onChange:event=>setChars(event.target.value),onBlur:()=>onChange({welcomeCharacters:normalizeWelcome({...value,welcomeCharacters:chars}).welcomeCharacters}),onKeyDown:event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing)event.currentTarget.blur()}}))),
      h('div',{className:'dcb-settings-section-title',style:{marginTop:'14px'}},'填充速度'),
      choices('填充速度',speeds.map(([duration,label])=>[duration,`${label} · ${(duration/1000).toFixed(1)} 秒`]),value.welcomeDuration,welcomeDuration=>onChange({welcomeDuration})))),
      h('div',{className:'dcb-welcome-collapse','data-open':codeMode,'aria-hidden':!codeMode,inert:!codeMode},h('div',null,
        h('div',{className:'dcb-welcome-code-behavior'},
          h('div',{className:'dcb-settings-section-title'},'代码结束方式'),
          choices('代码结束方式',[[false,'定时结束'],[true,'交互完成后结束']],value.welcomeCodeInteractive,welcomeCodeInteractive=>onChange({welcomeCodeInteractive})),
          h('p',{role:'status'},value.welcomeCodeInteractive?'等待交互完成，不按秒数退出；可点“跳过”或按 Esc 进入聊天。':'代码提前完成可主动结束，否则按最长播放时长退场。'),
          h('div',{className:'dcb-welcome-collapse','data-open':!value.welcomeCodeInteractive,'aria-hidden':value.welcomeCodeInteractive,inert:value.welcomeCodeInteractive},h('div',null,
            h('div',{className:'dcb-settings-section-title'},'代码最长播放时长'),
            choices('代码最长播放时长',[[3000,'3 秒'],[5000,'5 秒'],[10000,'10 秒'],[15000,'15 秒']],value.welcomeCodeDuration,welcomeCodeDuration=>onChange({welcomeCodeDuration}))
          ))
        ),
        h('div',{className:'dcb-welcome-code-editor'},
          h('p',{className:'dcb-settings-footnote',role:'status'},`当前编辑：${mode==='interactive'?'交互':'定时'}代码。两种模式独立保存，切换时保留各自草稿；点击应用后持久保存。`),
          h('div',{className:'dcb-welcome-code-heading'},h('strong',null,'单文件代码开屏'),h('small',null,codeAsset?`已保存：${codeAsset.name} · ${(codeAsset.size/1024).toFixed(1)} KB`:'尚未保存代码开屏')),
          h('p',null,'可粘贴 HTML / CSS / JavaScript，或导入 .html、.css、.js 文件。图片、字体与库需内嵌，不加载外部网址或相邻文件。'),
          h('textarea',{'aria-label':'开屏动画代码',value:codeTheme.current===slot?code:'',spellCheck:false,onChange:event=>editCode(event.target.value)}),
          h('section',{className:'dcb-welcome-history','aria-label':'本机开屏历史'},
            h('div',{className:'dcb-welcome-history-heading'},h('strong',null,'本机开屏历史'),h('small',null,'仅保存在本机 · 点击即可切换')),
            history.length?h('div',{className:'dcb-welcome-history-list'},history.map(item=>{
              return h('button',{key:item.revision,type:'button',className:'dcb-welcome-history-item','data-selected':value.welcomeCodeRevision===item.revision,disabled:busy,'aria-label':`使用本机开屏：${item.name}`,onClick:()=>activateHistory(item)},
                h('span',{className:'dcb-welcome-history-icon','aria-hidden':true},h('span',{style:{fontSize:'20px'}},'◌')),
                h('span',{className:'dcb-welcome-history-copy'},h('span',{className:'dcb-welcome-history-name'},item.name),h('span',{className:'dcb-welcome-history-meta'},item.localOnly?'本机预设 · 快速切换':'本机保存 · 当前代码')))
            })):h('p',{className:'dcb-welcome-history-empty'},'保存过的代码开屏会出现在这里；点击即可快速切换。')),
          h('input',{ref:codeInput,type:'file',hidden:true,accept:'.html,.htm,.css,.js','aria-label':'导入开屏代码文件',onChange:event=>{const file=event.target.files?.[0];event.target.value='';importCode(file)}}),
          h('div',{className:'dcb-welcome-code-actions'},
            h('button',{type:'button',className:'dcb-welcome-play',disabled:busy,onClick:()=>codeInput.current?.click()},'导入代码文件'),
            h('button',{type:'button',className:'dcb-welcome-play',disabled:busy,onClick:()=>{stop();setPlaying(false);editCode(welcomeCodeExample,'Harness 代码示例')}},'载入代码示例'),
            showGesture&&h('div',{className:'dcb-welcome-example-action','data-open':value.welcomeCodeInteractive,'aria-hidden':!value.welcomeCodeInteractive,inert:!value.welcomeCodeInteractive},h('div',null,
              h('button',{type:'button',className:'dcb-welcome-play',disabled:busy,onClick:()=>{setRecording(open=>!open);setRecorderKey(key=>key+1)}},recording?'收起手势示例':'手势开屏示例')
            )),
            h('button',{type:'button',className:'dcb-welcome-play dcb-welcome-apply',disabled:busy||codeTheme.current!==slot||!code.trim(),onClick:applyCode},busy?'保存中…':'应用代码开屏')
          ),
          h('div',{className:'dcb-welcome-collapse dcb-welcome-gesture-example','data-open':showGesture&&value.welcomeCodeInteractive,hidden:!value.welcomeCodeInteractive&&!showGesture,'aria-hidden':!showGesture||!value.welcomeCodeInteractive,inert:!showGesture||!value.welcomeCodeInteractive},h('div',null,
            h('p',null,'手势开屏是交互示例，也可以编写或导入其他交互开屏。示例需连接至少 4 个点并重复确认，生成后点击“应用代码开屏”；它可随时跳过，不是安全锁。'),
            h('div',{className:'dcb-welcome-collapse','data-open':recording,'aria-hidden':!recording,inert:!recording},h('div',null,h(GestureRecorder,{key:recorderKey,onPattern:pattern=>{editCode(welcomeGestureDocument(pattern),'九宫格手势开屏（示例）');setRecording(false)}})))
          )),
          h('p',{className:'dcb-settings-footnote'},'代码可通过 window.dshWelcomeDone() 结束，支持 data-theme 和 --dsh-welcome-background / --dsh-welcome-foreground 主题变量。代码仅保存在本机。')
        )
      )),
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
      h('div',{className:'dcb-welcome-demo','data-mode':value.welcomeMode,'data-interactive':codeMode&&value.welcomeCodeInteractive,role:codeMode&&value.welcomeCodeInteractive?'group':'img','aria-label':codeMode?'自定义代码开屏预览':mediaMode?'自定义素材开屏预览':'鲸鱼 Logo 字符开屏预览'},
        h('div',{className:'dcb-welcome-preview-brand',ref:brand,'data-shown':false,'aria-hidden':true},FishLogo&&h(FishLogo,{size:64})),h('div',{className:'dcb-welcome-demo-content',ref:seat})),
      h('p',{role:error?'alert':'status'},error||'选项自动保存；代码需点击应用。下次刷新或启动生效，预览不打断当前聊天。'))
  }
}
