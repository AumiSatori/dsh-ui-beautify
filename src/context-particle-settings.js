import whaleImage from '../assets/context-whale.jpg'
import {PARTICLE_COUNTS,particleConversion} from './context-particle-config.js'

export const particleSettingsCss=`
  .dcb-particle-options { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin:14px 0; }
  .dcb-particle-option { display:flex; flex-direction:column; align-items:center; gap:7px; min-width:0; padding:14px 8px; border:1px solid #8884; border-radius:10px; background:transparent; color:var(--dsh-settings-text); font:12px/20px system-ui; cursor:pointer; transition:background-color 220ms ease,border-color 220ms ease,transform 240ms cubic-bezier(.22,.8,.26,1); }
  .dcb-particle-option[aria-checked=true] { border-color:#888a; background:#8881; }
  .dcb-particle-option:active { transform:scale(.94); }
  .dcb-particle-option:focus-visible,.dcb-particle-control button:focus-visible { outline:2px solid #888; outline-offset:3px; }
  .dcb-particle-option:disabled { opacity:.4; cursor:default; }
  .dcb-particle-icon { display:grid; place-items:center; width:54px; height:42px; font-size:28px; color:#4d6bfe; }
  .dcb-particle-icon svg { width:46px; height:34px; }
  .dcb-particle-icon img { height:42px; width:45px; object-fit:contain; mix-blend-mode:multiply; }
  body[data-ds-dark-theme] .dcb-particle-icon img { mix-blend-mode:normal; border-radius:6px; }
  .dcb-particle-number { display:flex; align-items:center; gap:5px; flex:none; }
  .dcb-particle-number input { box-sizing:border-box; width:82px; padding:7px 9px; border:1px solid #8885; border-radius:8px; background:transparent; color:var(--dsh-settings-text); font:13px/20px system-ui; font-variant-numeric:tabular-nums; text-align:center; outline:none; transition:border-color 180ms ease,box-shadow 180ms ease; }
  .dcb-particle-number input:focus { border-color:#888b; box-shadow:0 0 0 3px #8882; }
  .dcb-particle-number button { display:grid; place-items:center; width:28px; height:30px; border:1px solid #8884; border-radius:7px; background:transparent; color:inherit; cursor:pointer; transition:background-color 180ms ease,transform 220ms ease; }
  .dcb-particle-number button:active { transform:scale(.9); }
  .dcb-particle-conversion { margin:14px 0; padding:14px; border:1px solid #8883; border-radius:10px; }
  .dcb-particle-conversion-heading,.dcb-particle-conversion-ends { display:flex; justify-content:space-between; align-items:center; gap:12px; }
  .dcb-particle-conversion-heading { font:600 13px/20px system-ui; }
  .dcb-particle-conversion-heading output { font-variant-numeric:tabular-nums; }
  .dcb-particle-conversion-value { display:flex; align-items:center; gap:6px; }
  .dcb-particle-modes { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; margin-top:12px; }
  .dcb-particle-modes button { padding:8px 5px; border:1px solid #8884; border-radius:8px; color:inherit; background:transparent; font:12px/20px system-ui; cursor:pointer; transition:background-color 180ms ease,border-color 180ms ease; }
  .dcb-particle-modes button[aria-checked=true] { background:#8881; border-color:#888a; font-weight:600; }
  .dcb-particle-modes button:focus-visible { outline:2px solid currentColor; outline-offset:3px; }
  .dcb-particle-conversion-slider { display:flex; align-items:center; height:36px; cursor:ew-resize; touch-action:none; user-select:none; border-radius:8px; outline:none; }
  .dcb-particle-conversion-slider:focus-visible { outline:2px solid currentColor; outline-offset:3px; }
  .dcb-particle-conversion-track { position:relative; display:block; flex:1; margin-inline:10px; height:5px; border-radius:999px; background:#8884; }
  .dcb-particle-conversion-fill { position:absolute; inset:0 auto 0 0; width:var(--dcb-conversion-fill); border-radius:inherit; background:currentColor; }
  .dcb-particle-conversion-thumb { position:absolute; top:50%; left:var(--dcb-conversion-fill); width:17px; height:17px; box-sizing:border-box; border:2px solid currentColor; border-radius:50%; background:var(--dsh-settings-bg,#fff); transform:translate(-50%,-50%); box-shadow:0 1px 5px #0002; }
  body[data-ds-dark-theme] .dcb-particle-conversion-thumb { background:#222; }
  .dcb-particle-conversion-ends { font:11px/18px system-ui; color:var(--dsh-settings-secondary); }
  .dcb-particle-conversion p { margin:8px 0 0; font:12px/20px system-ui; color:var(--dsh-settings-secondary); }
  .dcb-particle-context { margin-top:14px; padding-top:12px; border-top:1px solid #8883; }
  .dcb-particle-context .dcb-particle-conversion-heading { font:12px/20px system-ui; }
  .dcb-particle-context-meter { height:5px; margin-top:8px; overflow:hidden; border-radius:999px; background:#8883; }
  .dcb-particle-context-meter span { display:block; height:100%; width:var(--dcb-context-fill); border-radius:inherit; background:currentColor; opacity:.6; }
  @media(forced-colors:active) { .dcb-particle-conversion-fill,.dcb-particle-context-meter span { background:Highlight; opacity:1; } .dcb-particle-conversion-thumb { background:Canvas; } .dcb-particle-conversion-track,.dcb-particle-context-meter { border:1px solid ButtonText; } .dcb-particle-modes button[aria-checked=true] { outline:2px solid Highlight; outline-offset:-2px; } }
  .dcb-particle-control { margin-top:12px; padding:13px; border:1px dashed #8885; border-radius:10px; }
  .dcb-particle-control p { font:12px/20px system-ui; color:var(--dsh-settings-secondary); overflow-wrap:anywhere; }
  .dcb-particle-image-preview { position:relative; width:100%; height:280px; margin-top:14px; overflow:hidden; border:1px solid #8883; border-radius:12px; background:#e7ebf1; }
  .dcb-particle-image-preview canvas { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
  body[data-ds-dark-theme] .dcb-particle-image-preview { background:#111522; }
  .dcb-particle-image-caption { margin:8px 0 0; }
  @media(forced-colors:active) { .dcb-particle-image-preview { display:none; } }
  .dcb-particle-buttons { display:flex; flex-wrap:wrap; gap:8px; }
  .dcb-particle-buttons button { padding:7px 11px; border:1px solid #8884; border-radius:8px; background:transparent; color:inherit; font:12px/18px system-ui; cursor:pointer; transition:background-color 180ms ease,transform 220ms ease; }
  .dcb-particle-buttons button:active { transform:scale(.94); }
  .dcb-particle-error { color:var(--dsh-settings-text); font:12px/20px system-ui; padding-block:8px; }
  .dcb-particle-live { font-variant-numeric:tabular-nums; }
  @media(max-width:600px) { .dcb-particle-options { grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; } .dcb-particle-option { padding-inline:4px; font-size:11px; } }
  @media(prefers-reduced-motion:reduce) { .dcb-particle-option,.dcb-particle-number input,.dcb-particle-number button,.dcb-particle-buttons button,.dcb-particle-modes button { transition:none; } }
`

export function createParticleSettings(React,doc,win,{particles,FishLogo}={}){
  const h=React.createElement
  function ImagePreview({revision,count}){
    const root=React.useRef(null),handle=React.useRef(null),[error,setError]=React.useState('')
    React.useEffect(()=>{setError('');handle.current=particles.previewImage(root.current,revision,count,setError);return()=>{handle.current?.dispose();handle.current=null}},[revision])
    React.useEffect(()=>handle.current?.configure(count),[count])
    return h('div',null,h('div',{ref:root,className:'dcb-particle-image-preview',role:'img','aria-label':'自定义图片完整成形预览'}),h('p',{className:'dcb-particle-image-caption',role:'status'},error||'完整成形缩略预览 · 随粒子数更新，实际疏密受窗口尺寸影响；聊天仍按转换进度逐渐汇聚。'))
  }
  function ProgressSlider({value,onChange}){
    const drag=React.useRef(null),queued=React.useRef(null),frame=React.useRef(0),change=React.useRef(onChange)
    change.current=onChange
    const clampProgress=progress=>Math.max(0,Math.min(100,Math.round(progress)))
    const flush=()=>{win.cancelAnimationFrame(frame.current);frame.current=0;if(queued.current!==null){const progress=queued.current;queued.current=null;change.current(progress)}}
    const point=(x,bounds)=>{queued.current=clampProgress((x-bounds.left-10)/Math.max(1,bounds.width-20)*100);if(!frame.current)frame.current=win.requestAnimationFrame(flush)}
    React.useEffect(()=>()=>win.cancelAnimationFrame(frame.current),[])
    return h('div',{className:'dcb-particle-conversion-slider',role:'slider',tabIndex:0,'aria-label':'转换进度','aria-orientation':'horizontal','aria-valuemin':0,'aria-valuemax':100,'aria-valuenow':value,'aria-valuetext':`${value}% 转换进度，0% 散开，100% 完整成形`,style:{'--dcb-conversion-fill':`${value}%`},
      onPointerDown:e=>{if(e.button!==0||e.isPrimary===false)return;e.preventDefault();e.currentTarget.focus();e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,bounds:e.currentTarget.getBoundingClientRect()};point(e.clientX,drag.current.bounds)},
      onPointerMove:e=>{if(drag.current?.id===e.pointerId)point(e.clientX,drag.current.bounds)},
      onPointerUp:e=>{if(drag.current?.id!==e.pointerId)return;point(e.clientX,drag.current.bounds);flush();drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)},
      onPointerCancel:()=>{flush();drag.current=null},onLostPointerCapture:()=>{drag.current=null},
      onKeyDown:e=>{const steps={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1,PageDown:-10,PageUp:10};if(e.key==='Home'||e.key==='End'||e.key in steps){e.preventDefault();flush();onChange(clampProgress(e.key==='Home'?0:e.key==='End'?100:value+steps[e.key]))}}
    },h('span',{className:'dcb-particle-conversion-track','aria-hidden':'true'},h('span',{className:'dcb-particle-conversion-fill'}),h('span',{className:'dcb-particle-conversion-thumb'})))
  }
  function NumberField({label,value,min,max,step=1,onChange}){
    const [draft,setDraft]=React.useState(String(value))
    const skipCommit=React.useRef(false)
    React.useEffect(()=>setDraft(String(value)),[value])
    const set=number=>{const result=Math.max(min,Math.min(max,Math.round(number/step)*step));setDraft(String(result));onChange(result)}
    const commit=()=>{if(draft.trim()!==''&&Number.isFinite(Number(draft)))set(Number(draft));else setDraft(String(value))}
    return h('div',{className:'dcb-particle-number'},
      h('button',{type:'button','aria-label':`减少${label}`,disabled:value<=min,onClick:()=>set(value-step)},'−'),
      h('input',{type:'text',inputMode:'numeric',role:'spinbutton','aria-label':label,'aria-valuemin':min,'aria-valuemax':max,'aria-valuenow':value,value:draft,onChange:e=>setDraft(e.target.value),onBlur:()=>{if(skipCommit.current)skipCommit.current=false;else commit()},
        onKeyDown:e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur()}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();skipCommit.current=true;setDraft(String(value));e.currentTarget.blur()}else if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();set(e.key==='Home'?min:e.key==='End'?max:value+(e.key==='ArrowUp'?step:-step))}}}),
      h('button',{type:'button','aria-label':`增加${label}`,disabled:value>=max,onClick:()=>set(value+step)},'+'))
  }
  return function ParticleSettings({value,onChange}){
    const [busy,setBusy]=React.useState(false),[error,setError]=React.useState('')
    const input=React.useRef(null),imageInput=React.useRef(null),mounted=React.useRef(true),sequence=React.useRef(0)
    React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;sequence.current++}},[])
    React.useSyncExternalStore(particles.subscribe,particles.getStatus,particles.getStatus)
    const snapshot=particles.snapshot(),current=snapshot.scenes[0],live=snapshot.contextPercent??null,manual=value.particleProgressMode==='manual',progress=Math.round(particleConversion(live,value)*100)
    const setProgress=particleManualProgress=>onChange({particleProgressMode:'manual',particleManualProgress})
    const modeKey=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const choices=[...e.currentTarget.parentElement.querySelectorAll('[role=radio]')],at=choices.indexOf(e.currentTarget),next=e.key==='Home'?0:e.key==='End'?choices.length-1:(at+(['ArrowRight','ArrowDown'].includes(e.key)?1:choices.length-1))%choices.length;choices[next].click();choices[next].focus()}
    const row=(label,description,control)=>h('div',{className:'dcb-settings-row'},h('div',{className:'dcb-settings-copy'},h('span',{className:'dcb-settings-row-title'},label),h('p',{className:'dcb-settings-row-desc'},description)),control)
    async function upload(file,image=false){
      if(!file)return;const token=++sequence.current;setBusy(true);setError('')
      try{const patch=await (image?particles.importImage(file):particles.importSVG(file));if(mounted.current&&token===sequence.current)onChange(patch)}
      catch(e){if(mounted.current&&token===sequence.current)setError(e.message||'素材导入失败，原图形已保留')}
      finally{if(mounted.current&&token===sequence.current)setBusy(false)}
    }
    return h('section',{className:'dcb-settings-block dcb-settings-card','data-dcb-settings-block':'particles'},
      h('div',{className:'dcb-settings-header'},h('div',null,h('h2',null,'会话粒子背景'),h('p',null,'从散开到成形，手动控制转换进度或跟随上下文'))),
      row('会话粒子背景','默认使用 DeepSeek Logo；关闭会释放画布与绘制资源。',h('button',{type:'button',role:'switch',className:'dcb-switch','aria-label':'会话粒子背景','aria-checked':value.particleEnabled,onClick:()=>onChange({particleEnabled:!value.particleEnabled})})),
      h('div',{className:'dcb-particle-options',role:'radiogroup','aria-label':'粒子图形'},[
        ['logo','DeepSeek Logo',FishLogo?h(FishLogo,{size:46}):'◈'],['whale','鲸鱼娘',h('img',{src:whaleImage,alt:''})],['image','自定义图片','▧'],['custom','自定义 SVG','◇']
      ].map(([shape,label,icon])=>h('button',{key:shape,type:'button',role:'radio',className:'dcb-particle-option','aria-label':label,'aria-checked':value.particleShape===shape,tabIndex:value.particleShape===shape?0:-1,disabled:shape==='custom'&&!value.particleSvgRevision||shape==='image'&&!value.particleImageRevision,onClick:()=>onChange({particleShape:shape}),
        onKeyDown:e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const choices=[...e.currentTarget.parentElement.querySelectorAll('button:not(:disabled)')],at=choices.indexOf(e.currentTarget),next=e.key==='Home'?0:e.key==='End'?choices.length-1:(at+(['ArrowRight','ArrowDown'].includes(e.key)?1:choices.length-1))%choices.length;choices[next].click();choices[next].focus()}
      },h('span',{className:'dcb-particle-icon','aria-hidden':'true'},icon),label))),
      h('div',{className:'dcb-particle-conversion'},
        h('div',{className:'dcb-particle-conversion-heading'},h('span',null,'转换进度'),manual?h('div',{className:'dcb-particle-conversion-value'},h(NumberField,{label:'转换进度百分比',value:value.particleManualProgress,min:0,max:100,onChange:setProgress}),h('span',null,'%')):h('output',null,live===null?'等待数据':`${progress}%`)),
        h('div',{className:'dcb-particle-modes',role:'radiogroup','aria-label':'转换进度来源'},[['context','跟随上下文'],['manual','手动调整']].map(([id,label])=>h('button',{key:id,type:'button',role:'radio','aria-checked':value.particleProgressMode===id,tabIndex:value.particleProgressMode===id?0:-1,onKeyDown:modeKey,onClick:()=>onChange({particleProgressMode:id})},label))),
        h(ProgressSlider,{value:progress,onChange:setProgress}),
        h('div',{className:'dcb-particle-conversion-ends','aria-hidden':'true'},h('span',null,'散开'),h('span',null,'完整成形')),
        h('p',null,manual?'手动指定 0–100% 的转换进度，不随上下文变化；选择自动保存。':'根据上下文占用自动转换；拖动滑条即可切换为手动调整。'),
        h('div',{className:'dcb-particle-context'},
          h('div',{className:'dcb-particle-conversion-heading'},h('span',null,'当前上下文'),h('output',null,live===null?'等待数据':`${live}%`)),
          h('div',{className:'dcb-particle-context-meter',role:'progressbar','aria-label':'当前上下文占用','aria-valuemin':0,'aria-valuemax':100,'aria-valuenow':live===null?undefined:live,'aria-valuetext':live===null?'等待当前会话的上下文数据':`${live}%`},h('span',{'aria-hidden':'true',style:{'--dcb-context-fill':`${live??0}%`}})),
          h('p',null,'显示当前会话的真实上下文占用，手动模式下也持续更新。'))),
      row('粒子数',`${PARTICLE_COUNTS.min}–${PARTICLE_COUNTS.max}，默认 ${PARTICLE_COUNTS.default} 颗。独立调整点阵密度；备用绘图最多 4500 颗。`,h(NumberField,{label:'粒子数',value:value.particleCount,min:PARTICLE_COUNTS.min,max:PARTICLE_COUNTS.max,step:PARTICLE_COUNTS.step,onChange:particleCount=>onChange({particleCount})})),
      !manual&&row('开始显示 (%)','跟随上下文时，低于这个占用比例隐藏背景。',h(NumberField,{label:'开始显示百分比',value:value.particleStart,min:0,max:95,onChange:particleStart=>onChange({particleStart})})),
      !manual&&row('完整成形 (%)','跟随上下文时，达到此占用比例完整成形；压缩时随占用回退。',h(NumberField,{label:'完整成形百分比',value:value.particleFull,min:value.particleStart+1,max:100,onChange:particleFull=>onChange({particleFull})})),
      h('div',{className:'dcb-settings-info dcb-particle-live',role:'status'},!value.particleEnabled?'背景已关闭':manual?`手动转换 ${progress}%`:live===null?'等待当前会话的上下文数据；可切换为手动调整':`跟随上下文 · 转换进度 ${progress}% · ${value.particleStart}% 开始 / ${value.particleFull}% 完整`,current?.error?` · ${current.error}`:''),
      h('div',{className:'dcb-particle-control'},h('strong',null,'本机图片'),h('p',null,value.particleImageName||'导入 PNG、JPG 或 WebP，汇聚为彩色粒子。'),
        h('p',null,'推荐透明背景、单一主体、轮廓清晰、明暗对比强的图片。彩色底图、低对比渐变、复杂背景和细小文字更容易丢失细节。'),
        h('p',null,'优先保留线条与局部细节，不固定假定人脸位置。只自动略去边缘相连的近白色背景；彩色背景需要先处理为透明。'),
        h('input',{ref:imageInput,type:'file','aria-label':'粒子图片文件',accept:'.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp',hidden:true,onChange:e=>{const file=e.target.files?.[0];e.target.value='';upload(file,true)}}),
        h('div',{className:'dcb-particle-buttons'},h('button',{type:'button',disabled:busy,onClick:()=>imageInput.current?.click()},busy?'读取中…':'导入图片'),value.particleImageRevision&&h('button',{type:'button',disabled:busy,onClick:async()=>{setBusy(true);setError('');try{await particles.clearImage();if(mounted.current)onChange({particleShape:value.particleShape==='image'?'logo':value.particleShape,particleImageRevision:'',particleImageName:''})}catch(e){if(mounted.current)setError(e.message)}finally{if(mounted.current)setBusy(false)}}},'移除自定义图片')),
        value.particleImageRevision&&h(ImagePreview,{revision:value.particleImageRevision,count:value.particleCount}),
        h('p',null,'最大 10 MB，宽高不超过 4096 像素。只保存在本机，刷新后保留；完整成形后仍由漂浮粒子绘制。')),
      h('div',{className:'dcb-particle-control'},h('strong',null,'本机 SVG'),h('p',null,value.particleSvgName||'兼容已有 SVG 图形；也可以直接使用上方的图片导入。'),
        h('input',{ref:input,type:'file',accept:'.svg,image/svg+xml',hidden:true,onChange:e=>{const file=e.target.files?.[0];e.target.value='';upload(file)}}),
        h('div',{className:'dcb-particle-buttons'},h('button',{type:'button',disabled:busy,onClick:()=>input.current?.click()},busy?'读取中…':'导入 SVG'),value.particleSvgRevision&&h('button',{type:'button',disabled:busy,onClick:async()=>{setBusy(true);try{await particles.clearSVG();if(mounted.current)onChange({particleShape:value.particleShape==='custom'?'logo':value.particleShape,particleSvgRevision:'',particleSvgName:''})}catch(e){if(mounted.current)setError(e.message)}finally{if(mounted.current)setBusy(false)}}},'移除自定义 SVG'))),
      error&&h('div',{role:'alert',className:'dcb-particle-error'},error),
      h('p',{className:'dcb-settings-footnote'},'图片和 SVG 仅保存在当前浏览器的本机存储中，刷新后保留。后台暂停绘制，减少动态效果时静态显示。鲸鱼娘立绘：ZipZipPipe；原型：上善无形；CC BY-NC-SA 4.0，仅供个人非商业使用。'))
  }
}
