import {motion} from './motion.js'

export const presetDeleteCss=`
 .dcb-delete-control { --dcb-delete-danger:var(--dsw-alias-state-error-primary,#b93232); display:contents; }
 body[data-ds-dark-theme] .dcb-delete-control { --dcb-delete-danger:var(--dsw-alias-state-error-primary,#ff9b9b); }
 .dcb-delete-control > button.dcb-delete-button,.dcb-delete-confirm button { box-sizing:border-box; min-width:44px; min-height:44px; padding:8px 12px; border:1px solid var(--dsh-settings-border); border-radius:10px; background:var(--dsh-settings-surface); color:var(--dsh-settings-text); font:500 12px/20px system-ui,sans-serif; cursor:pointer; transition:background-color ${motion.time.control}ms ${motion.ease.color},transform ${motion.time.control}ms ${motion.ease.smooth}; }
 .dcb-delete-control > button.dcb-delete-button,.dcb-delete-confirm button[data-danger] { color:var(--dcb-delete-danger); }
 .dcb-delete-control > button.dcb-delete-button { display:inline-flex; flex:0 0 44px; align-items:center; justify-content:center; width:44px; height:44px; padding:0; border-color:transparent; background:transparent; }
 .dcb-delete-button svg { width:16px; height:16px; flex:none; pointer-events:none; }
 .dcb-delete-control button:hover:enabled { background:var(--dsh-settings-subtle); }
 .dcb-delete-control button:active:enabled { transform:scale(.97); }
 .dcb-delete-control button:focus-visible { outline:2px solid var(--dsh-settings-accent); outline-offset:2px; }
 .dcb-delete-control button:disabled { opacity:.45; cursor:default; }
 .dcb-delete-confirm { box-sizing:border-box; grid-column:1/-1; flex:1 1 100%; min-width:0; width:100%; padding:12px; border:1px solid var(--dsh-settings-border); border-radius:11px; background:var(--dsh-settings-subtle); color:var(--dsh-settings-text); text-align:left; font:12px/1.6 system-ui,sans-serif; overflow-wrap:anywhere; }
 .dcb-delete-confirm p { margin:0 0 10px; color:var(--dsh-settings-text); font:inherit; }
 .dcb-delete-confirm-actions { display:flex; flex-wrap:wrap; gap:8px; }
 .dcb-delete-confirm [role=alert] { color:var(--dcb-delete-danger); }
 .dcb-delete-notice { grid-column:1/-1; flex:1 1 100%; margin:0; color:var(--dsh-settings-secondary); font:12px/1.6 system-ui,sans-serif; }
 @media(prefers-reduced-motion:reduce) { .dcb-delete-control button { transition:none; } .dcb-delete-control button:active:enabled { transform:none; } }
 @media(forced-colors:active) { .dcb-delete-control > button.dcb-delete-button,.dcb-delete-confirm button,.dcb-delete-confirm button[data-danger] { color:ButtonText; background:ButtonFace; border-color:ButtonText; box-shadow:none; } .dcb-delete-confirm { color:CanvasText; background:Canvas; border-color:CanvasText; } }
`

// Inline confirmation keeps the item name and consequences next to its card.
export function createPresetDelete(React){
 const h=React.createElement
 return function PresetDelete({name,description,onConfirm,disabled=false,label='删除',kind='预设'}){
  const [open,setOpen]=React.useState(false),[busy,setBusy]=React.useState(false),[error,setError]=React.useState(''),[notice,setNotice]=React.useState('')
  const trigger=React.useRef(null),cancel=React.useRef(null),live=React.useRef(false),gate=React.useRef(false),restore=React.useRef(false),id=React.useId()
  React.useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
  React.useLayoutEffect(()=>{if(open)cancel.current?.focus({preventScroll:true});else if(restore.current){restore.current=false;trigger.current?.focus({preventScroll:true})}},[open])
  const close=()=>{if(gate.current)return;restore.current=true;setOpen(false);setError('')}
  const remove=async event=>{
   if(gate.current||disabled)return
   gate.current=true;setBusy(true);setError('')
   try{await onConfirm(event);if(live.current){restore.current=true;setOpen(false);setNotice(`已删除“${name}”。`)}}
   catch(error){if(live.current)setError(error.message||'删除失败，请重试。')}
   finally{gate.current=false;if(live.current)setBusy(false)}
  }
  return h('div',{className:'dcb-delete-control'},
   !open&&h('button',{ref:trigger,type:'button',className:'dcb-delete-button',disabled,'aria-label':`删除${kind}：${name}`,title:`${label}：${name}`,onClick:()=>{setNotice('');setOpen(true)}},h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('path',{d:'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5'}))),
   open&&h('div',{className:'dcb-delete-confirm',role:'alertdialog','aria-label':`删除${kind}确认`,'aria-describedby':id,'aria-busy':busy,onKeyDown:event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close()}}},
    h('p',{id},`确定删除“${name}”吗？${description}此操作无法撤销。`),
    h('div',{className:'dcb-delete-confirm-actions'},h('button',{ref:cancel,type:'button',disabled:busy,onClick:close},'取消'),h('button',{type:'button','data-danger':'',disabled:busy||disabled,onClick:remove},busy?'正在删除…':'确认删除')),
    error&&h('p',{role:'alert'},error)),
   notice&&h('p',{className:'dcb-delete-notice',role:'status'},notice))
 }
}
