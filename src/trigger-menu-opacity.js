import {motion} from './motion.js'

const TARGET='[data-composer-overlay] [data-trigger-menu]'
const MATERIAL=`${TARGET} > [aria-hidden="true"][class*="_material_"]`
export function normalizeTriggerMenuOpacity(value){
  const amount=value?.triggerMenuTransparency
  return {triggerMenuTransparency:typeof amount==='number'&&Number.isFinite(amount)?Math.round(Math.max(0,Math.min(100,amount))):null}
}

export const triggerMenuOpacityCss=`
  ${MATERIAL} { transition:background-color ${motion.time.standard}ms ${motion.ease.color}; }
  .dcb-settings [data-setting="trigger-menu-opacity"] { margin-top:22px; }
  .dcb-menu-opacity-controls { display:flex; align-items:center; flex-wrap:wrap; gap:10px 14px; min-width:0; }
  .dcb-menu-opacity-slider { position:relative; flex:1 1 180px; min-width:120px; max-width:280px; height:44px; cursor:pointer; touch-action:none; border-radius:8px; }
  .dcb-menu-opacity-track,.dcb-menu-opacity-fill { position:absolute; top:20px; left:0; height:4px; border-radius:999px; pointer-events:none; }
  .dcb-menu-opacity-track { width:100%; background:var(--dsh-settings-border); }
  .dcb-menu-opacity-fill { width:var(--dcb-menu-percent); background:var(--dsh-settings-secondary); transition:width ${motion.time.control}ms ${motion.ease.smooth}; }
  .dcb-menu-opacity-thumb { position:absolute; top:12px; left:var(--dcb-menu-percent); width:20px; height:20px; box-sizing:border-box; border:1px solid var(--dsh-settings-border); border-radius:50%; background:var(--dsh-settings-surface); box-shadow:0 2px 5px #0002; transform:translateX(-50%); pointer-events:none; transition:left ${motion.time.control}ms ${motion.ease.smooth},box-shadow ${motion.time.control}ms ${motion.ease.color}; }
  body[data-ds-dark-theme] .dcb-menu-opacity-thumb { background:#e5e5e7; border-color:#ffffff6b; }
  .dcb-menu-opacity-slider:focus-visible { outline:2px solid var(--dsh-settings-secondary); outline-offset:3px; }
  .dcb-menu-opacity-slider[data-dragging="true"] :is(.dcb-menu-opacity-fill,.dcb-menu-opacity-thumb) { transition:none; }
  .dcb-menu-opacity-slider[data-dragging="true"] .dcb-menu-opacity-thumb { box-shadow:0 0 0 4px #8882,0 2px 5px #0002; }
  .dcb-menu-opacity-value { min-width:3.5em; color:var(--dsh-settings-text); font-variant-numeric:tabular-nums; }
  .dcb-menu-opacity-reset { padding:7px 10px; min-height:36px; border:1px solid var(--dsh-settings-border); border-radius:8px; background:transparent; color:var(--dsh-settings-text); font:inherit; cursor:pointer; transition:background-color ${motion.time.control}ms ${motion.ease.color},transform ${motion.time.control}ms ${motion.ease.smooth}; }
  .dcb-menu-opacity-reset:hover:enabled { background:var(--dsh-settings-subtle); }
  .dcb-menu-opacity-reset:active:enabled { transform:scale(.94); }
  .dcb-menu-opacity-reset:disabled { opacity:.45; cursor:default; }
  .dcb-menu-opacity-reset:focus-visible { outline:2px solid var(--dsh-settings-secondary); outline-offset:3px; }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { ${MATERIAL},.dcb-menu-opacity-fill,.dcb-menu-opacity-thumb,.dcb-menu-opacity-reset { transition:none; } }
  @media(forced-colors:active) { .dcb-menu-opacity-track { background:GrayText; } .dcb-menu-opacity-fill { background:Highlight; } .dcb-menu-opacity-thumb,.dcb-menu-opacity-reset { background:ButtonFace; border-color:ButtonText; color:ButtonText; box-shadow:none; } }
`

// Change only the native suggestion menu's fill token. The material retains its
// own blur, text, placement and events; later menus inherit the same rule without
// observers. Null releases the override and follows the installed host theme.
export function createTriggerMenuOpacity(doc){
  const sheet=doc.createElement('style');sheet.dataset.dcbTriggerMenuOpacity=''
  doc.head.append(sheet)
  let current,disposed=false
  return {
    setOptions(value){
      if(disposed)return
      const {triggerMenuTransparency:amount}=normalizeTriggerMenuOpacity(value)
      if(current===amount)return
      current=amount
      const alpha=(100-amount)/100
      sheet.textContent=amount===null?'':`@media(forced-colors:none){${TARGET}{--dsw-menu-surface-fill:rgb(248 249 250 / ${alpha});}body[data-ds-dark-theme] ${TARGET}{--dsw-menu-surface-fill:rgb(67 69 74 / ${alpha});}}`
    },
    dispose(){disposed=true;sheet.remove()},
  }
}

export function createTriggerMenuOpacitySettings(React,doc){
  const h=React.createElement
  return function TriggerMenuOpacitySettings({value,onChange}){
    const amount=normalizeTriggerMenuOpacity(value).triggerMenuTransparency
    const percent=amount??(doc.body.hasAttribute('data-ds-dark-theme')?55:42)
    const [dragging,setDragging]=React.useState(false),pointer=React.useRef(null),description=React.useId()
    const set=next=>{const bounded=normalizeTriggerMenuOpacity({triggerMenuTransparency:next}).triggerMenuTransparency;if(bounded!==amount)onChange({triggerMenuTransparency:bounded})}
    const move=event=>{const box=event.currentTarget.getBoundingClientRect();if(box.width)set((event.clientX-box.left)/box.width*100)}
    const stop=event=>{if(pointer.current!==event.pointerId)return;pointer.current=null;setDragging(false);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}
    return h('div',{className:'dcb-settings-section','data-setting':'trigger-menu-opacity'},
      h('div',{className:'dcb-settings-section-title'},'上拉菜单透明度'),
      h('p',{className:'dcb-settings-row-desc',id:description},'调整 @ 文件选择与命令建议面板的底色。数值越大越透明，0% 为不透明；文字与输入框材质独立。'),
      h('div',{className:'dcb-menu-opacity-controls'},
        h('div',{className:'dcb-menu-opacity-slider',role:'slider',tabIndex:0,'aria-label':'上拉菜单透明度','aria-describedby':description,'aria-valuemin':0,'aria-valuemax':100,'aria-valuenow':percent,'aria-valuetext':amount===null?`跟随原生，约 ${percent}% 透明度`:`${percent}% 透明度`,'data-dragging':dragging,style:{'--dcb-menu-percent':`${percent}%`},
          onPointerDown:event=>{if(event.button!==0||event.isPrimary===false)return;event.preventDefault();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);pointer.current=event.pointerId;setDragging(true);move(event)},
          onPointerMove:event=>{if(pointer.current===event.pointerId)move(event)},onPointerUp:stop,onPointerCancel:stop,onLostPointerCapture:stop,
          onKeyDown:event=>{const next={Home:0,End:100,ArrowLeft:percent-1,ArrowDown:percent-1,ArrowRight:percent+1,ArrowUp:percent+1,PageDown:percent-10,PageUp:percent+10}[event.key];if(next!==undefined){event.preventDefault();set(next)}}},
          h('span',{className:'dcb-menu-opacity-track','aria-hidden':true}),h('span',{className:'dcb-menu-opacity-fill','aria-hidden':true}),h('span',{className:'dcb-menu-opacity-thumb','aria-hidden':true})),
        h('output',{className:'dcb-menu-opacity-value','aria-live':'off'},amount===null?'原生':`${percent}%`),
        h('button',{type:'button',className:'dcb-menu-opacity-reset',disabled:amount===null,onClick:()=>onChange({triggerMenuTransparency:null})},'恢复原生')))
  }
}
