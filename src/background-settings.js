import {createHtmlEditor} from './background-html.js'
import {motion} from './motion.js'
import {themeBackground} from './background-media.js'
import {themeAssignments,themeAssignmentsCss} from './theme-assignments.js'

export const backgroundSettingsCss=`
  ${themeAssignmentsCss}
  .dcb-settings-card.dcb-background-settings { display:grid; gap:22px; }
  .dcb-background-settings .dcb-settings-header { align-items:center; gap:20px; margin:0; }
  .dcb-background-settings .dcb-settings-header h2 { font-size:16px; line-height:24px; }
  .dcb-background-enable { display:flex; align-items:center; gap:12px; min-height:44px; flex:none; color:var(--dsh-settings-secondary); font-size:12px; cursor:pointer; }
  .dcb-background-overview { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(0,1fr); gap:22px; align-items:center; }
  .dcb-background-figure { margin:0; min-width:0; }
  .dcb-background-preview { position:relative; width:100%; aspect-ratio:16/10; overflow:hidden; isolation:isolate; border:1px solid var(--dsh-settings-border); border-radius:15px; background:var(--dsh-settings-surface); box-shadow:0 5px 18px #00000008; }
  .dcb-background-art { position:absolute; inset:0; overflow:hidden; }
  .dcb-background-art img,.dcb-background-placeholder { display:block; width:100%; height:100%; }
  .dcb-background-art img { animation:dcb-background-arrive 320ms ${motion.ease.smooth}; }
  .dcb-background-placeholder { background:radial-gradient(ellipse at 18% 80%,#77afa5 0,transparent 52%),radial-gradient(ellipse at 78% 10%,#dfbdaf 0,transparent 58%),linear-gradient(140deg,#98b8d9,#cbd4e4); }
  .dcb-background-art img,.dcb-background-placeholder { opacity:var(--dcb-preview-opacity,.45); filter:blur(var(--dcb-preview-blur,0px)); transition:opacity 180ms ${motion.ease.color},filter 180ms ${motion.ease.color},object-position 320ms ${motion.ease.smooth}; }
  .dcb-background-mini { position:absolute; inset:0; display:grid; grid-template:24px minmax(0,1fr)/24% minmax(0,1fr); color:var(--dsh-settings-text); pointer-events:none; }
  .dcb-background-mini-bar { grid-column:1/-1; display:flex; align-items:center; gap:4px; padding:0 9px; border-bottom:1px solid #8882; background:#ffffff32; }
  .dcb-background-mini-bar i { width:4px; height:4px; border-radius:50%; background:currentColor; opacity:.3; }
  .dcb-background-mini-bar b { margin-left:auto; font:500 8px/14px system-ui,sans-serif; opacity:.55; }
  .dcb-background-mini-nav { display:flex; flex-direction:column; gap:9px; padding:14px 9px; border-right:1px solid #8882; background:#ffffff28; }
  .dcb-background-mini-nav i { height:4px; width:85%; border-radius:3px; background:currentColor; opacity:.12; }
  .dcb-background-mini-nav i:first-child { width:60%; height:6px; margin-bottom:6px; opacity:.22; }
  .dcb-background-mini-content { display:flex; flex-direction:column; align-items:flex-start; gap:10px; min-width:0; padding:18px 12px 10px; }
  .dcb-background-mini-question { align-self:flex-end; padding:6px 8px; border:1px solid #ffffff60; border-radius:9px 9px 3px 9px; background:#f5f7ffb3; font:500 9px/14px system-ui,sans-serif; color:#373f50; }
  .dcb-background-mini-answer { font:500 10px/16px system-ui,sans-serif; }
  .dcb-background-mini-lines { width:75%; height:12px; opacity:.2; background:linear-gradient(currentColor,currentColor) 0 0/100% 2px no-repeat,linear-gradient(currentColor,currentColor) 0 8px/65% 2px no-repeat; }
  .dcb-background-mini-input { align-self:stretch; margin-top:auto; padding:8px; border:1px solid #8883; border-radius:9px; background:#ffffff65; color:#727885; font:9px/14px system-ui,sans-serif; }
  .dcb-background-caption { display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:4px 10px; margin-top:10px; font-size:11px; line-height:18px; color:var(--dsh-settings-secondary); }
  .dcb-background-caption strong { font-weight:500; color:var(--dsh-settings-text); }
  .dcb-background-import { display:grid; align-content:center; gap:14px; min-width:0; }
  .dcb-background-file-info { display:flex; align-items:center; gap:10px; min-width:0; }
  .dcb-background-file-icon { display:grid; place-items:center; flex:none; width:38px; height:42px; border:1px solid var(--dsh-settings-border); border-radius:10px; background:var(--dsh-settings-subtle); color:var(--dsh-settings-secondary); }
  .dcb-background-file-icon svg { width:20px; height:20px; }
  .dcb-background-file-info > div { min-width:0; }
  .dcb-background-settings .dcb-background-file { margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--dsh-settings-text); font-size:13px; font-weight:500; }
  .dcb-background-settings .dcb-background-file-hint { margin:4px 0 0; font-size:11px; }
  .dcb-background-actions { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
  .dcb-background-actions button { display:flex; justify-content:center; align-items:center; gap:7px; min-width:0; min-height:44px; padding:9px 8px; border:1px solid var(--dsh-settings-border); border-radius:11px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); font:500 12px/20px system-ui,sans-serif; cursor:pointer; transition:transform 320ms ${motion.ease.snappy},background-color 180ms ${motion.ease.color},opacity 180ms ${motion.ease.color}; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  .dcb-background-actions .dcb-background-choose { grid-column:1/-1; background:var(--dsh-settings-text); border-color:var(--dsh-settings-text); color:var(--dsh-settings-surface); }
  .dcb-background-actions button:active:not(:disabled) { transform:scale(.965); }
  .dcb-background-actions button:disabled { opacity:.4; cursor:default; }
  .dcb-background-actions svg { width:15px; height:15px; flex:none; }
  .dcb-background-library { display:grid; gap:12px; padding-top:20px; border-top:1px solid var(--dsh-settings-border); }
  .dcb-background-library-heading { display:flex; align-items:baseline; justify-content:space-between; gap:12px; font-size:13px; }
  .dcb-background-library-heading strong { font-weight:500; }
  .dcb-background-library-heading span { color:var(--dsh-settings-secondary); font-size:11px; }
  .dcb-background-gallery { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
  .dcb-background-library .dcb-background-gallery { grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr)); }
  .dcb-background-gallery-entry { min-width:0; align-self:start; border:1px solid var(--dsh-settings-border); border-radius:11px; background:var(--dsh-settings-surface); transition:border-color 180ms ${motion.ease.color},background-color 180ms ${motion.ease.color}; }
  .dcb-background-gallery-entry[data-selected=true] { border-color:var(--dsh-settings-text); background:var(--dsh-settings-subtle); }
  .dcb-background-gallery-item { position:relative; display:flex; flex-direction:column; width:100%; min-width:0; padding:5px; border:0; border-radius:11px; background:transparent; color:var(--dsh-settings-text); font:12px/18px system-ui,sans-serif; text-align:left; cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent; transition:transform 220ms ${motion.ease.snappy}; }
  .dcb-background-gallery-item:active { transform:scale(.96); }
  .dcb-background-gallery-picture { display:grid; place-items:center; position:relative; overflow:hidden; width:100%; aspect-ratio:16/10; border-radius:7px; background:var(--dsh-settings-subtle); }
  .dcb-background-gallery-picture img { width:100%; height:100%; object-fit:cover; }
  .dcb-background-gallery-picture > svg { width:24px; height:24px; color:var(--dsh-settings-secondary); }
  .dcb-background-gallery-kind { position:absolute; left:6px; bottom:6px; padding:1px 5px; border-radius:4px; background:#101824bb; color:#fff; font-size:10px; line-height:17px; }
  .dcb-background-gallery-check { position:absolute; top:6px; right:6px; display:grid; place-items:center; width:20px; height:20px; border-radius:50%; background:#151b25cf; color:#fff; font-size:12px; }
  .dcb-background-gallery-name-row { display:flex; align-items:center; gap:5px; width:100%; min-width:0; min-height:48px; padding:4px 10px; border:0; border-radius:0 0 10px 10px; background:transparent; color:var(--dsh-settings-text); font:13px/20px system-ui,sans-serif; text-align:left; cursor:pointer; }
  .dcb-background-gallery-name { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dcb-background-gallery-name-row svg { width:14px; height:14px; flex:none; color:var(--dsh-settings-secondary); }
  .dcb-background-gallery-name-row:hover { background:var(--dsh-settings-subtle); }
  .dcb-background-settings .dcb-background-rename { box-sizing:border-box; display:flex; align-items:center; gap:4px; width:100%; max-width:100%; min-width:0; height:48px; margin:0; padding:7px 8px; border:0; background:transparent; animation:dcb-background-rename-enter 220ms ${motion.ease.smooth}; }
  .dcb-background-settings .dcb-background-rename input { box-sizing:border-box; display:block; flex:1 1 0; width:0; max-width:100%; min-width:0; height:32px; min-height:32px; max-height:32px; margin:0; padding:5px 8px; border:1px solid var(--dsh-settings-border); border-radius:6px; outline:none; box-shadow:none; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); font:13px/20px system-ui,sans-serif; }
  .dcb-background-settings .dcb-background-rename-actions { display:flex; align-items:center; flex:none; gap:2px; margin:0; padding:0; }
  .dcb-background-settings .dcb-background-rename-actions button { box-sizing:border-box; display:grid; place-items:center; flex:none; width:32px; min-width:32px; max-width:32px; height:32px; min-height:32px; max-height:32px; margin:0; padding:0; border:0; border-radius:6px; background:transparent; color:var(--dsh-settings-secondary); font:12px/18px system-ui,sans-serif; cursor:pointer; }
  .dcb-background-settings .dcb-background-rename-actions button:hover:not(:disabled) { background:var(--dsh-settings-subtle); }
  .dcb-background-settings .dcb-background-rename-actions button[type=submit] { color:var(--dsh-settings-accent,var(--dsh-settings-text)); }
  .dcb-background-rename-actions svg { display:block; width:16px; height:16px; }
  .dcb-background-gallery-name-row:focus-visible { outline:2px solid var(--dsh-settings-accent,var(--dsh-settings-text)); outline-offset:2px; }
  .dcb-background-settings .dcb-background-rename :focus-visible { outline:1px solid var(--dsh-settings-accent,var(--dsh-settings-text)); outline-offset:1px; }
  @media(pointer:coarse) {
    .dcb-background-settings .dcb-background-rename { height:52px; padding:4px; }
    .dcb-background-settings .dcb-background-rename input { height:36px; min-height:36px; max-height:36px; }
    .dcb-background-settings .dcb-background-rename-actions button { width:44px; min-width:44px; max-width:44px; height:44px; min-height:44px; max-height:44px; }
  }
  .dcb-background-gallery-entry button:disabled { opacity:.55; cursor:default; }
  @keyframes dcb-background-rename-enter { from { opacity:0; transform:translateY(-3px); } to { opacity:1; transform:none; } }
  .dcb-background-gallery-more { justify-self:center; min-height:44px; padding:8px 18px; border:1px solid var(--dsh-settings-border); border-radius:10px; background:transparent; color:var(--dsh-settings-text); font:12px/20px system-ui,sans-serif; cursor:pointer; }
  .dcb-background-library-empty { display:flex; align-items:center; gap:10px; min-height:72px; padding:14px; border:1px dashed var(--dsh-settings-border); border-radius:11px; color:var(--dsh-settings-secondary); font-size:12px; }
  .dcb-background-library-empty svg { width:22px; height:22px; flex:none; }
  .dcb-background-gallery-item:focus-visible,.dcb-background-gallery-more:focus-visible { outline:2px solid currentColor; outline-offset:3px; }
  .dcb-background-controls { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; padding-top:22px; border-top:1px solid var(--dsh-settings-border); }
  .dcb-background-control { display:flex; flex-direction:column; min-width:0; gap:9px; padding:16px; border:1px solid #8881; border-radius:13px; background:var(--dsh-settings-subtle); }
  .dcb-background-control-heading { display:flex; align-items:baseline; justify-content:space-between; gap:12px; font-size:13px; line-height:20px; }
  .dcb-background-control-heading strong { font-weight:500; }
  .dcb-background-control output { flex:none; min-width:40px; text-align:right; color:var(--dsh-settings-secondary); font:500 12px/20px system-ui,sans-serif; font-variant-numeric:tabular-nums; }
  .dcb-background-settings .dcb-background-control p { margin:0; font-size:11px; line-height:17px; }
  .dcb-background-control-wide { grid-column:1/-1; }
  .dcb-background-slider { display:block; width:100%; height:44px; min-width:0; padding:0; margin:0; appearance:none; -webkit-appearance:none; background:transparent; cursor:pointer; touch-action:pan-y; }
  .dcb-background-slider::-webkit-slider-runnable-track { height:5px; border-radius:9px; background:linear-gradient(to right,var(--dsh-settings-text) var(--dcb-range-fill),#8883 var(--dcb-range-fill)); }
  .dcb-background-slider::-moz-range-track { height:5px; border-radius:9px; background:#8883; }
  .dcb-background-slider::-moz-range-progress { height:5px; border-radius:9px; background:var(--dsh-settings-text); }
  .dcb-background-slider::-webkit-slider-thumb { appearance:none; -webkit-appearance:none; width:22px; height:22px; margin-top:-8.5px; border:1px solid #00000012; border-radius:50%; background:#fff; box-shadow:0 2px 5px #0003; transition:transform 240ms ${motion.ease.snappy},box-shadow 180ms ease; }
  .dcb-background-slider::-moz-range-thumb { width:22px; height:22px; border:1px solid #00000012; border-radius:50%; background:#fff; box-shadow:0 2px 5px #0003; transition:transform 240ms ${motion.ease.snappy}; }
  .dcb-background-slider:active::-webkit-slider-thumb { transform:scale(1.15); box-shadow:0 2px 8px #0003; }
  .dcb-background-slider:active::-moz-range-thumb { transform:scale(1.15); }
  .dcb-background-options { display:grid; grid-template-columns:repeat(var(--dcb-option-count),minmax(0,1fr)); position:relative; isolation:isolate; min-width:0; padding:4px; border:1px solid var(--dsh-settings-border); border-radius:11px; background:#8881; }
  .dcb-background-option-indicator { position:absolute; z-index:-1; top:4px; bottom:4px; left:4px; width:calc((100% - 8px)/var(--dcb-option-count)); border:1px solid #8883; border-radius:7px; background:var(--dsh-settings-surface); box-shadow:0 1px 4px #00000012; transform:translateX(calc(var(--dcb-option-index)*100%)); transition:transform 360ms ${motion.ease.snappy}; pointer-events:none; }
  .dcb-background-options button { display:flex; align-items:center; justify-content:center; min-width:0; min-height:40px; padding:8px 3px; border:1px solid transparent; border-radius:7px; background:transparent; color:var(--dsh-settings-secondary); font:500 12px/20px system-ui,sans-serif; cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent; transition:color 180ms ease,transform 280ms ${motion.ease.snappy}; }
  .dcb-background-options button[aria-pressed=true] { color:var(--dsh-settings-text); }
  .dcb-background-options button:active { transform:scale(.94); }
  .dcb-background-sound { display:flex; align-items:center; justify-content:space-between; gap:16px; min-height:44px; cursor:pointer; }
  .dcb-background-sound strong { font-size:13px; font-weight:500; }
  .dcb-background-sound .dcb-switch { flex:none; }
  .dcb-background-error { padding:12px 14px; border:1px solid #bf343430; border-radius:10px; background:#bf34340b; color:#bf3434!important; overflow-wrap:anywhere; }
  .dcb-background-settings .dcb-settings-footnote { margin:0; font-size:11px; line-height:18px; }
  .dcb-background-actions button:focus-visible,.dcb-background-options button:focus-visible,.dcb-background-slider:focus-visible { outline:2px solid var(--dsh-settings-text); outline-offset:3px; }
  @keyframes dcb-background-arrive { from { opacity:0; transform:scale(1.025); } to { opacity:var(--dcb-preview-opacity,.45); transform:scale(1); } }
  body[data-ds-dark-theme] .dcb-background-mini-bar,body[data-ds-dark-theme] .dcb-background-mini-nav { background:#171b2628; }
  body[data-ds-dark-theme] .dcb-background-mini-question { color:#e6e9f2; border-color:#ffffff16; background:#59658365; }
  body[data-ds-dark-theme] .dcb-background-mini-input { background:#16192285; color:#b0b5c4; }
  @container dcb-settings-page (max-width:580px) {
    .dcb-background-gallery { grid-template-columns:repeat(3,minmax(0,1fr)); }
    .dcb-background-overview { grid-template-columns:minmax(0,1fr); gap:20px; }
    .dcb-background-import { gap:14px; }
    .dcb-background-controls { grid-template-columns:minmax(0,1fr); }
    .dcb-background-preview { aspect-ratio:16/9; }
    .dcb-background-options button { min-height:44px; }
  }
  @container dcb-settings-page (max-width:360px) {
    .dcb-background-gallery { grid-template-columns:repeat(2,minmax(0,1fr)); }
    .dcb-settings-card.dcb-background-settings { padding:16px; gap:20px; }
    .dcb-background-settings .dcb-settings-header { gap:12px; }
    .dcb-background-enable span { display:none; }
    .dcb-background-control { padding:13px; }
    .dcb-background-options button { min-height:44px; font-size:11px; }
    .dcb-background-actions button { font-size:12px; }
  }
  @media(prefers-reduced-motion:reduce) {
    .dcb-background-settings *, .dcb-background-settings *::before,.dcb-background-settings *::after { animation:none!important; transition:none!important; }
  }
  @media(forced-colors:active) {
    .dcb-background-settings *, .dcb-background-settings *::before,.dcb-background-settings *::after { animation:none!important; transition:none!important; }
    .dcb-background-option-indicator { background:Canvas; border-color:Highlight; box-shadow:none; }
    .dcb-background-options button[aria-pressed=true] { color:Highlight; }
    .dcb-background-actions .dcb-background-choose { background:ButtonFace; color:ButtonText; border-color:ButtonText; }
    .dcb-background-preview { border-color:CanvasText; }
    .dcb-background-slider { appearance:auto; -webkit-appearance:auto; }
  }
`

export function createBackgroundSettings(React,{background,onThemeChange}={}){
  const h=React.createElement,HtmlEditor=createHtmlEditor(React,background)
  const paths={image:'M4 4h16v16H4zM4 15l5-5 5 5 3-3 3 3M15 8h.01',restore:'M3 10a9 9 0 1 1 2 8M3 4v6h6',remove:'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5',upload:'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',edit:'m15 5 4 4M4 20l5-1L20 8a2.8 2.8 0 0 0-4-4L5 15z',cancel:'m6 6 12 12M6 18 18 6',save:'m5 12 4 4L19 6'}
  const icon=name=>h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('path',{d:paths[name]}))
  return function BackgroundSettings({value:savedValue,onChange:save}){
    const state=React.useSyncExternalStore(background.subscribe,background.getSnapshot),[busy,setBusy]=React.useState(false),[error,setError]=React.useState(''),[limit,setLimit]=React.useState(12),input=React.useRef(null),mounted=React.useRef(true),uid=React.useId()
    const [editing,setEditing]=React.useState(null),renameInput=React.useRef(null),renameButtons=React.useRef(new Map()),lastEdited=React.useRef(null)
    const value=background.resolve(savedValue),onChange=patch=>save(background.patch(patch,state.theme))
    React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
    React.useEffect(()=>{
      const target=editing?renameInput.current:renameButtons.current.get(lastEdited.current)
      target?.focus({preventScroll:true});if(editing)target?.select();else lastEdited.current=null
    },[editing?.revision])
    const run=async action=>{setBusy(true);setError('');try{await action()}catch(error){if(mounted.current)setError(error.message)}finally{if(mounted.current)setBusy(false)}}
    const select=asset=>save(background.selection(asset,state.theme))
    const startRename=item=>{lastEdited.current=item.revision;setError('');setEditing({revision:item.revision,name:item.name})}
    const rename=()=>run(async()=>{await background.rename(editing.revision,editing.name);if(mounted.current)setEditing(null)})
    const slider=(label,key,max,unit,description)=>h('div',{className:'dcb-background-control'},
      h('div',{className:'dcb-background-control-heading'},h('strong',null,label),h('output',{'aria-hidden':true},value[key]+unit)),
      h('input',{className:'dcb-background-slider',type:'range','aria-label':label,'aria-valuetext':value[key]+unit,min:0,max,step:1,value:value[key],style:{'--dcb-range-fill':value[key]/max*100+'%'},onChange:event=>onChange({[key]:Number(event.target.value)})}),h('p',null,description))
    const choices=(title,label,key,items,description)=>h('div',{className:'dcb-background-control dcb-background-control-wide'},
      h('div',{className:'dcb-background-control-heading'},h('strong',null,title)),
      h('div',{className:'dcb-background-options',role:'group','aria-label':label,style:{'--dcb-option-count':items.length,'--dcb-option-index':Math.max(0,items.findIndex(([id])=>id===value[key]))}},
        h('span',{className:'dcb-background-option-indicator','aria-hidden':true}),items.map(([id,title])=>h('button',{key:id,type:'button','aria-pressed':value[key]===id,onClick:()=>onChange({[key]:id})},title))),h('p',null,description))
    return h('section',{className:'dcb-settings-block dcb-settings-card dcb-background-settings','data-dcb-settings-block':'background'},
      h('div',{className:'dcb-settings-header'},h('div',null,h('h2',null,'全图背景'),h('p',null,'为整个窗口换一张喜欢的背景')),
        h('label',{className:'dcb-background-enable',htmlFor:uid+'-enabled'},h('span',null,'启用背景'),h('button',{id:uid+'-enabled',type:'button',className:'dcb-switch',role:'switch','aria-label':'启用全图背景','aria-checked':value.backgroundEnabled,disabled:!value.backgroundRevision,onClick:()=>onChange({backgroundEnabled:!value.backgroundEnabled})}))),
      themeAssignments(h,{scope:'全图背景',theme:state.theme,onThemeChange,items:Object.fromEntries(['light','dark'].map(scheme=>{const item=themeBackground(savedValue,scheme);return[scheme,{name:item.backgroundName||'尚未选择背景',configured:!!item.backgroundRevision,enabled:item.backgroundEnabled&&!!item.backgroundRevision}]}))}),
      h('div',{className:'dcb-background-overview'},
        h('figure',{className:'dcb-background-figure'},
          h('div',{className:'dcb-background-preview',role:'img','aria-label':'背景效果预览',style:{'--dcb-preview-opacity':value.backgroundOpacity/100,'--dcb-preview-blur':value.backgroundBlur*.35+'px'}},
            h('div',{className:'dcb-background-art','aria-hidden':true},state.preview?h('img',{key:state.preview,src:state.preview,alt:'',style:{objectFit:value.backgroundFit,objectPosition:value.backgroundPosition}}):h('div',{className:'dcb-background-placeholder'})),
            h('div',{className:'dcb-background-mini','aria-hidden':true},
              h('div',{className:'dcb-background-mini-bar'},h('i'),h('i'),h('i'),h('b',null,'DSH')),
              h('div',{className:'dcb-background-mini-nav'},h('i'),h('i'),h('i'),h('i')),
              h('div',{className:'dcb-background-mini-content'},h('div',{className:'dcb-background-mini-question'},'换一个喜欢的背景'),h('div',{className:'dcb-background-mini-answer'},'对话依然清晰。'),h('div',{className:'dcb-background-mini-lines'}),h('div',{className:'dcb-background-mini-input'},'发送消息…')))),
          h('figcaption',{className:'dcb-background-caption'},h('strong',null,'效果缩略图'),h('span',null,state.preview?'随参数实时更新':value.backgroundRevision?'正在生成缩略图…':'示意背景 · 导入后替换'))),
        h('div',{className:'dcb-background-import'},
          h('div',{className:'dcb-background-file-info'},h('span',{className:'dcb-background-file-icon'},icon('image')),h('div',null,h('p',{className:'dcb-background-file',title:value.backgroundName||undefined},value.backgroundName||'尚未选择背景'),h('p',{className:'dcb-background-file-hint'},'本机图片或视频 · 自动保存'))),
          h('input',{ref:input,type:'file',hidden:true,'aria-label':'导入全图背景',accept:'.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm',onChange:event=>{const file=event.target.files?.[0];event.target.value='';if(file)run(async()=>select(await background.import(file)))}}),
          h('div',{className:'dcb-background-actions'},
            h('button',{type:'button',className:'dcb-background-choose',disabled:busy,onClick:()=>input.current?.click()},icon('upload'),busy?'处理中…':'选择图片或视频'),
            h('button',{type:'button',disabled:busy||!state.hasPrevious,onClick:()=>run(async()=>select(await background.restore()))},icon('restore'),'恢复上一张'),
            h('button',{type:'button',disabled:busy||!value.backgroundRevision,onClick:()=>run(async()=>{await background.clear();select(null)})},icon('remove'),'清除背景')))),
      h('p',{className:'dcb-settings-footnote',role:'status'},`当前：${state.theme==='dark'?'夜间':'日间'}背景。两种主题分别记忆背景与启用状态；切换主题后自动应用对应配置，未配置的一侧不显示背景。`),
      h(HtmlEditor,{onSelect:select,theme:state.theme}),
      (error||state.error)&&h('p',{className:'dcb-background-error',role:'alert'},error||state.error),
      h('section',{className:'dcb-background-library','aria-label':'背景素材库'},
        h('div',{className:'dcb-background-library-heading'},h('strong',null,'最近上传'),h('span',null,state.recent.length?`${state.recent.length} 个 · 仅保存在本机`:'本机素材库')),
        state.recent.length?h('div',{className:'dcb-background-gallery'},state.recent.slice(0,limit).map(item=>h('div',{key:item.revision,className:'dcb-background-gallery-entry','data-selected':value.backgroundRevision===item.revision},
          h('button',{type:'button',className:'dcb-background-gallery-item','aria-label':`使用背景：${item.name}`,'aria-pressed':value.backgroundRevision===item.revision,disabled:busy,title:item.name,onClick:()=>run(async()=>select(await background.select(item.revision)))},
            h('span',{className:'dcb-background-gallery-picture'},item.preview?h('img',{src:item.preview,alt:'',loading:'lazy',decoding:'async'}):icon('image'),h('span',{className:'dcb-background-gallery-kind'},item.kind==='html'?'HTML':item.kind==='video'?'视频':'图片'),value.backgroundRevision===item.revision&&h('span',{className:'dcb-background-gallery-check','aria-hidden':true},'✓'))),
          editing?.revision===item.revision?h('form',{className:'dcb-background-rename','aria-label':'重命名背景','aria-busy':busy,onSubmit:event=>{event.preventDefault();if(!busy)rename()}},
            h('input',{ref:renameInput,'aria-label':'背景名称',value:editing.name,maxLength:160,disabled:busy,onChange:event=>setEditing({...editing,name:event.target.value}),onKeyDown:event=>{if(event.key==='Escape'&&!busy){event.preventDefault();setEditing(null)}if(event.key==='Enter'&&event.nativeEvent.isComposing)event.preventDefault()}}),
            h('div',{className:'dcb-background-rename-actions'},h('button',{type:'button','aria-label':'取消',title:'取消修改',disabled:busy,onClick:()=>setEditing(null)},icon('cancel')),h('button',{type:'submit','aria-label':'保存',title:busy?'保存中…':'保存名称',disabled:busy||!editing.name.trim()},icon('save'))))
          :h('button',{type:'button',className:'dcb-background-gallery-name-row',ref:node=>node?renameButtons.current.set(item.revision,node):renameButtons.current.delete(item.revision),'aria-label':`重命名背景：${item.name}`,title:'点击修改名称',disabled:busy,onClick:()=>startRename(item)},h('span',{className:'dcb-background-gallery-name'},item.name),icon('edit')))))
          :h('div',{className:'dcb-background-library-empty'},icon('image'),h('span',null,'上传的图片、视频和 HTML 会留在这里；点击名称可重命名。')),
        state.recent.length>0&&h('p',{className:'dcb-settings-footnote'},'点击名称或铅笔图标可重命名，仅修改本机显示名称。'),
        state.recent.length>limit&&h('button',{className:'dcb-background-gallery-more',type:'button',onClick:()=>setLimit(value=>value+12)},'显示更多')),
      h('div',{className:'dcb-background-controls'},
        slider('背景可见度','backgroundOpacity',100,'%','数值越低背景越淡，文字通常更清楚；0% 时背景不可见。'),
        slider('背景模糊','backgroundBlur',20,'','数值越高背景越模糊，可柔化细节、减少画面干扰。'),
        choices('铺放方式','背景铺放方式','backgroundFit',[['cover','铺满'],['contain','完整显示'],['fill','拉伸']],'铺满可能裁切边缘；完整显示可能留白；拉伸会填满窗口，但可能改变画面比例。'),
        choices('画面位置','背景画面位置','backgroundPosition',[['center','居中'],['top','靠上'],['bottom','靠下'],['left','靠左'],['right','靠右']],'选择铺满时优先保留的画面区域。')),
      h('label',{className:'dcb-background-sound',htmlFor:uid+'-sound'},h('div',null,h('strong',null,'视频声音'),h('p',null,'仅影响视频背景；关闭时静音，切到后台时视频自动暂停。')),h('button',{id:uid+'-sound',type:'button',className:'dcb-switch',role:'switch','aria-label':'视频声音','aria-checked':value.backgroundSound,onClick:()=>onChange({backgroundSound:!value.backgroundSound})})),
      state.notice&&h('p',{role:'status',className:'dcb-settings-footnote'},state.notice),
      h('p',{className:'dcb-settings-footnote'},'支持 JPG / PNG / WebP / GIF / MP4 / WebM。文件仅保存在本机；关闭背景仍保留文件。'))
  }
}
