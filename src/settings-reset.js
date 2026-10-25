import {motion} from './motion.js'

export const settingsResetCss=`
  .dcb-settings .dcb-settings-hero { flex-wrap:wrap; }
  .dcb-settings .dcb-settings-hero > :nth-child(2) { flex:1 1 220px; min-width:0; }
  .dcb-settings-reset { min-width:0; max-width:100%; margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
  .dcb-settings-reset-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px; }
  .dcb-settings-reset button { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:44px; max-width:100%; padding:9px 13px; border:1px solid var(--dsh-settings-border); border-radius:10px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); font:500 13px/20px system-ui,sans-serif; cursor:pointer; transition:background-color ${motion.time.quick}ms ${motion.ease.color},border-color ${motion.time.quick}ms ${motion.ease.color},transform ${motion.time.control}ms ${motion.ease.snappy}; }
  .dcb-settings-reset button:hover { background:var(--dsh-settings-subtle); border-color:var(--dsh-settings-accent); }
  .dcb-settings-reset button:active { transform:scale(.97); }
  .dcb-settings-reset button:focus-visible { outline:2px solid var(--dsh-settings-accent); outline-offset:3px; }
  .dcb-settings-reset button[data-reset-undo] { color:var(--dsh-settings-accent); }
  .dcb-settings-reset button svg { flex:none; }
  .dcb-settings .dcb-settings-reset p { max-width:300px; margin:0; color:var(--dsh-settings-secondary); font:12px/18px system-ui,sans-serif; text-align:right; overflow-wrap:anywhere; }
  @media(max-width:580px) { .dcb-settings-reset { flex-basis:100%; align-items:flex-start; margin-left:0; } .dcb-settings-reset-actions { justify-content:flex-start; } .dcb-settings .dcb-settings-reset p { max-width:none; text-align:left; } }
  @media(prefers-reduced-motion:reduce) { .dcb-settings-reset button { transition:none; } .dcb-settings-reset button:active { transform:none; } }
  @media(forced-colors:active) { .dcb-settings-reset button { background:Canvas; color:ButtonText; border-color:ButtonText; } .dcb-settings-reset button:focus-visible { outline-color:Highlight; } .dcb-settings-reset button[data-reset-undo] { color:LinkText; } .dcb-settings .dcb-settings-reset p { color:CanvasText; } }
`

export function createSettingsReset(React){
  const h=React.createElement
  return function SettingsReset({checkpoint,onReset,onUndo}){
    const button=React.useRef(null),id=React.useId()
    return h('div',{className:'dcb-settings-reset'},
      h('div',{className:'dcb-settings-reset-actions'},
        h('button',{type:'button',ref:button,'aria-describedby':id,onClick:onReset},
          h('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('path',{d:'M3 10a9 9 0 1 1 2 8M3 4v6h6'})),
          '全部恢复默认值'),
        checkpoint&&h('button',{type:'button','data-reset-undo':'',onClick:()=>{onUndo();button.current?.focus()}},'撤销恢复')),
      h('p',{id,role:'status','aria-live':'polite','aria-atomic':true},checkpoint?(checkpoint.saved?'已恢复默认值':'已恢复默认值，仅当前窗口生效（未能保存）'):'恢复所有美化选项，保留已导入素材。'))
  }
}
