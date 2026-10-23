import whaleImage from '../assets/context-whale.jpg'
import {PARTICLE_COUNTS} from './context-particle-config.js'

export const particleSettingsCss=`
  .dcb-particle-options { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:14px 0; }
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
  .dcb-particle-density { margin:14px 0; padding:14px; border:1px solid #8883; border-radius:10px; }
  .dcb-particle-density-heading,.dcb-particle-density-ends { display:flex; justify-content:space-between; align-items:center; gap:12px; }
  .dcb-particle-density-heading { font:600 13px/20px system-ui; }
  .dcb-particle-density-heading output { font-variant-numeric:tabular-nums; }
  .dcb-particle-density-slider { display:flex; align-items:center; height:36px; cursor:ew-resize; touch-action:none; user-select:none; border-radius:8px; outline:none; }
  .dcb-particle-density-slider:focus-visible { outline:2px solid currentColor; outline-offset:3px; }
  .dcb-particle-density-track { position:relative; display:block; flex:1; margin-inline:10px; height:5px; border-radius:999px; background:#8884; }
  .dcb-particle-density-fill { position:absolute; inset:0 auto 0 0; width:var(--dcb-density-fill); border-radius:inherit; background:currentColor; }
  .dcb-particle-density-thumb { position:absolute; top:50%; left:var(--dcb-density-fill); width:17px; height:17px; box-sizing:border-box; border:2px solid currentColor; border-radius:50%; background:var(--dsh-settings-bg,#fff); transform:translate(-50%,-50%); box-shadow:0 1px 5px #0002; }
  body[data-ds-dark-theme] .dcb-particle-density-thumb { background:#222; }
  .dcb-particle-density-ends { font:11px/18px system-ui; color:var(--dsh-settings-secondary); }
  .dcb-particle-density-preview { height:46px; margin-top:10px; border:1px solid #8882; border-radius:7px; background-image:radial-gradient(circle,#7d95c9 1px,transparent 1.5px); background-size:var(--dcb-density-gap) var(--dcb-density-gap); background-position:center; }
  .dcb-particle-density p { margin:8px 0 0; font:12px/20px system-ui; color:var(--dsh-settings-secondary); }
  @media(forced-colors:active) { .dcb-particle-density-fill { background:Highlight; } .dcb-particle-density-thumb { background:Canvas; } .dcb-particle-density-track { border:1px solid ButtonText; } }
  .dcb-particle-control { margin-top:12px; padding:13px; border:1px dashed #8885; border-radius:10px; }
  .dcb-particle-control p { font:12px/20px system-ui; color:var(--dsh-settings-secondary); overflow-wrap:anywhere; }
  .dcb-particle-buttons { display:flex; flex-wrap:wrap; gap:8px; }
  .dcb-particle-buttons button { padding:7px 11px; border:1px solid #8884; border-radius:8px; background:transparent; color:inherit; font:12px/18px system-ui; cursor:pointer; transition:background-color 180ms ease,transform 220ms ease; }
  .dcb-particle-buttons button:active { transform:scale(.94); }
  .dcb-particle-error { color:var(--dsh-settings-text); font:12px/20px system-ui; padding-block:8px; }
  .dcb-particle-live { font-variant-numeric:tabular-nums; }
  @media(max-width:600px) { .dcb-particle-options { gap:6px; } .dcb-particle-option { padding-inline:4px; font-size:11px; } }
  @media(prefers-reduced-motion:reduce) { .dcb-particle-option,.dcb-particle-number input,.dcb-particle-number button,.dcb-particle-buttons button { transition:none; } }
`

export function createParticleSettings(React,doc,win,{particles,FishLogo}={}){
  const h=React.createElement
  function DensitySlider({value,onChange}){
    const drag=React.useRef(null),queued=React.useRef(null),frame=React.useRef(0),change=React.useRef(onChange)
    change.current=onChange
    const {min,max,step}=PARTICLE_COUNTS,span=max-min
    const clampCount=count=>Math.max(min,Math.min(max,Math.round(count/step)*step))
    const flush=()=>{win.cancelAnimationFrame(frame.current);frame.current=0;if(queued.current!==null){const count=queued.current;queued.current=null;change.current(count)}}
    const point=(x,bounds)=>{queued.current=clampCount(min+(x-bounds.left-10)/Math.max(1,bounds.width-20)*span);if(!frame.current)frame.current=win.requestAnimationFrame(flush)}
    React.useEffect(()=>()=>win.cancelAnimationFrame(frame.current),[])
    return h('div',{className:'dcb-particle-density-slider',role:'slider',tabIndex:0,'aria-label':'粒子浓度','aria-orientation':'horizontal','aria-valuemin':min/100,'aria-valuemax':max/100,'aria-valuenow':value/100,'aria-valuetext':`${value/100}%，${value} 颗`,style:{'--dcb-density-fill':`${(value-min)/span*100}%`},
      onPointerDown:e=>{if(e.button!==0||e.isPrimary===false)return;e.preventDefault();e.currentTarget.focus();e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,bounds:e.currentTarget.getBoundingClientRect()};point(e.clientX,drag.current.bounds)},
      onPointerMove:e=>{if(drag.current?.id===e.pointerId)point(e.clientX,drag.current.bounds)},
      onPointerUp:e=>{if(drag.current?.id!==e.pointerId)return;point(e.clientX,drag.current.bounds);flush();drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)},
      onPointerCancel:()=>{flush();drag.current=null},onLostPointerCapture:()=>{drag.current=null},
      onKeyDown:e=>{const steps={ArrowLeft:-step,ArrowDown:-step,ArrowRight:step,ArrowUp:step,PageDown:-step*10,PageUp:step*10};if(e.key==='Home'||e.key==='End'||e.key in steps){e.preventDefault();flush();onChange(clampCount(e.key==='Home'?min:e.key==='End'?max:value+steps[e.key]))}}
    },h('span',{className:'dcb-particle-density-track','aria-hidden':'true'},h('span',{className:'dcb-particle-density-fill'}),h('span',{className:'dcb-particle-density-thumb'})))
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
    const input=React.useRef(null),mounted=React.useRef(true),sequence=React.useRef(0)
    React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;sequence.current++}},[])
    React.useSyncExternalStore(particles.subscribe,particles.getStatus,particles.getStatus)
    const snapshots=particles.snapshot().scenes,current=snapshots.find(s=>s.percent!==null),live=current?.percent
    const row=(label,description,control)=>h('div',{className:'dcb-settings-row'},h('div',{className:'dcb-settings-copy'},h('span',{className:'dcb-settings-row-title'},label),h('p',{className:'dcb-settings-row-desc'},description)),control)
    async function upload(file){
      if(!file)return;const token=++sequence.current;setBusy(true);setError('')
      try{const patch=await particles.importSVG(file);if(mounted.current&&token===sequence.current)onChange(patch)}
      catch(e){if(mounted.current&&token===sequence.current)setError(e.message||'SVG 导入失败，原图形已保留')}
      finally{if(mounted.current&&token===sequence.current)setBusy(false)}
    }
    return h('section',{className:'dcb-settings-block dcb-settings-card','data-dcb-settings-block':'particles'},
      h('div',{className:'dcb-settings-header'},h('div',null,h('h2',null,'上下文粒子背景'),h('p',null,'粒子从四周汇入，跟随当前会话的真实上下文占用'))),
      row('会话粒子背景','默认使用 DeepSeek Logo；关闭会释放画布与绘制资源。',h('button',{type:'button',role:'switch',className:'dcb-switch','aria-label':'会话粒子背景','aria-checked':value.particleEnabled,onClick:()=>onChange({particleEnabled:!value.particleEnabled})})),
      h('div',{className:'dcb-particle-options',role:'radiogroup','aria-label':'粒子图形'},[
        ['logo','DeepSeek Logo',FishLogo?h(FishLogo,{size:46}):'◈'],['whale','鲸鱼娘',h('img',{src:whaleImage,alt:''})],['custom','自定义 SVG','◇']
      ].map(([shape,label,icon])=>h('button',{key:shape,type:'button',role:'radio',className:'dcb-particle-option','aria-label':label,'aria-checked':value.particleShape===shape,tabIndex:value.particleShape===shape?0:-1,disabled:shape==='custom'&&!value.particleSvgRevision,onClick:()=>onChange({particleShape:shape}),
        onKeyDown:e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const choices=[...e.currentTarget.parentElement.querySelectorAll('button:not(:disabled)')],at=choices.indexOf(e.currentTarget),next=e.key==='Home'?0:e.key==='End'?choices.length-1:(at+(['ArrowRight','ArrowDown'].includes(e.key)?1:choices.length-1))%choices.length;choices[next].click();choices[next].focus()}
      },h('span',{className:'dcb-particle-icon','aria-hidden':'true'},icon),label))),
      h('div',{className:'dcb-particle-density'},
        h('div',{className:'dcb-particle-density-heading'},h('span',null,'粒子浓度'),h('output',null,`${value.particleCount/100}% · ${value.particleCount} 颗`)),
        h(DensitySlider,{value:value.particleCount,onChange:particleCount=>onChange({particleCount})}),
        h('div',{className:'dcb-particle-density-ends','aria-hidden':'true'},h('span',null,'稀疏'),h('span',null,'浓密')),
        h('div',{className:'dcb-particle-density-preview','aria-hidden':'true',style:{'--dcb-density-gap':`${Math.sqrt(420000/value.particleCount)}px`}}),
        h('p',null,'拖动实时调整点阵密度，与下方粒子数同步并自动保存；浓度越高绘制开销越大。备用绘图最多 4500 颗。')),
      row('粒子数',`${PARTICLE_COUNTS.min}–${PARTICLE_COUNTS.max}。默认 ${PARTICLE_COUNTS.default}（${PARTICLE_COUNTS.default/100}%）；100% 对应 10000 颗，可继续调至 200%。`,h(NumberField,{label:'粒子数',value:value.particleCount,min:PARTICLE_COUNTS.min,max:PARTICLE_COUNTS.max,step:PARTICLE_COUNTS.step,onChange:particleCount=>onChange({particleCount})})),
      row('开始显示 (%)','低于这个占用比例时隐藏背景。',h(NumberField,{label:'开始显示百分比',value:value.particleStart,min:0,max:95,onChange:particleStart=>onChange({particleStart})})),
      row('完整成形 (%)','达到此占用比例时完整成形；之后保持完整，压缩时随占用回退。',h(NumberField,{label:'完整成形百分比',value:value.particleFull,min:value.particleStart+1,max:100,onChange:particleFull=>onChange({particleFull})})),
      h('div',{className:'dcb-settings-info dcb-particle-live',role:'status'},!value.particleEnabled?'背景已关闭':live===undefined?'等待当前会话的上下文数据；未上报时不模拟占用':`当前上下文 ${live}% · 成形进度 ${Math.round(Math.max(0,Math.min(1,(live-value.particleStart)/(value.particleFull-value.particleStart)))*100)}% · ${value.particleStart}% 开始 / ${value.particleFull}% 完整`,current?.error?` · ${current.error}`:''),
      h('div',{className:'dcb-particle-control'},h('strong',null,'本机 SVG'),h('p',null,value.particleSvgName||'支持静态填充、描边、渐变和透明背景，文件不上传。'),
        h('input',{ref:input,type:'file',accept:'.svg,image/svg+xml',hidden:true,onChange:e=>{const file=e.target.files?.[0];e.target.value='';upload(file)}}),
        h('div',{className:'dcb-particle-buttons'},h('button',{type:'button',disabled:busy,onClick:()=>input.current?.click()},busy?'读取中…':'导入 SVG'),value.particleSvgRevision&&h('button',{type:'button',disabled:busy,onClick:async()=>{setBusy(true);try{await particles.clearSVG();if(mounted.current)onChange({particleShape:value.particleShape==='custom'?'logo':value.particleShape,particleSvgRevision:'',particleSvgName:''})}catch(e){if(mounted.current)setError(e.message)}finally{if(mounted.current)setBusy(false)}}},'移除自定义 SVG')),
        error&&h('div',{role:'alert',className:'dcb-particle-error'},error)),
      h('p',{className:'dcb-settings-footnote'},'SVG 仅保存在当前浏览器的本机存储中，刷新后保留。后台暂停绘制，减少动态效果时静态显示。鲸鱼娘立绘：ZipZipPipe；原型：上善无形；CC BY-NC-SA 4.0，仅供个人非商业使用。'))
  }
}
