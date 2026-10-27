export const themeAssignmentsCss=`
  .dcb-theme-assignments { margin:18px 0 22px; }
  .dcb-theme-assignments-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
  .dcb-theme-assignment { min-width:0; padding:14px 16px; border:1px solid var(--dsh-settings-border,#8883); border-radius:12px; background:var(--dsh-settings-subtle,#8881); color:var(--dsh-settings-text,inherit); text-align:left; transition:border-color 220ms ease,background-color 220ms ease,transform 220ms cubic-bezier(.4,0,.2,1),box-shadow 220ms ease; }
  button.dcb-theme-assignment { width:100%; font:inherit; cursor:pointer; }
  button.dcb-theme-assignment:hover { transform:translateY(-2px); box-shadow:0 5px 14px #0000000b; }
  button.dcb-theme-assignment:active { transform:translateY(0) scale(.985); }
  button.dcb-theme-assignment:focus-visible { outline:2px solid var(--dsh-settings-text,#222); outline-offset:2px; }
  .dcb-theme-assignment[data-current=true] { border-color:var(--dsh-settings-text,#222); background:var(--dsh-settings-surface,#fff); }
  .dcb-theme-assignment-head { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px; font-size:13px; }
  .dcb-theme-assignment-head strong { display:inline-flex; align-items:center; gap:7px; }
  .dcb-theme-assignment-head strong::before { content:''; width:12px; height:12px; border:1px solid #8888; border-radius:50%; background:#fafafa; }
  .dcb-theme-assignment[data-scheme=dark] strong::before { background:#202124; }
  .dcb-theme-assignment-labels { display:flex; flex-wrap:wrap; gap:5px; }
  .dcb-theme-assignment-badge { display:inline-flex; padding:3px 7px; border-radius:6px; background:var(--dsh-settings-text,#222); color:var(--dsh-settings-surface,#fff); font:500 11px/16px system-ui; }
  .dcb-theme-assignment p { margin:9px 0 5px; overflow-wrap:anywhere; color:var(--dsh-settings-text,inherit); font-size:13px; }
  .dcb-theme-assignment small { color:var(--dsh-settings-secondary,#777); font-size:12px; }
  .dcb-theme-assignments-note { margin:10px 0 0; color:var(--dsh-settings-secondary,#777); font-size:12px; line-height:1.7; }
  @container dcb-settings-page (max-width:400px) { .dcb-theme-assignments-grid { grid-template-columns:1fr; } }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { .dcb-theme-assignment { transition:none; } }
`

export function themeAssignments(h,{scope,theme,editing=theme,items,editHint,onThemeChange}){
  return h('div',{className:'dcb-theme-assignments','data-theme-assignments':scope,'aria-label':scope+'的日夜配置'},
    h('div',{className:'dcb-theme-assignments-grid'},['light','dark'].map(scheme=>{
      const item=items[scheme],current=scheme===theme,label=scheme==='light'?'日间 · 浅色':'夜间 · 深色'
      const tag=typeof onThemeChange==='function'?'button':'div'
      return h(tag,{key:scheme,className:'dcb-theme-assignment','data-scheme':scheme,'data-current':current,type:tag==='button'?'button':undefined,'aria-current':current?'true':undefined,'aria-label':onThemeChange?`切换到${label}配置`:undefined,onClick:onThemeChange?()=>onThemeChange(scheme):undefined},
        h('div',{className:'dcb-theme-assignment-head'},h('strong',null,label),h('span',{className:'dcb-theme-assignment-labels'},current&&h('span',{className:'dcb-theme-assignment-badge'},'当前主题'),scheme===editing&&h('span',{className:'dcb-theme-assignment-badge'},'编辑中'))),
        h('p',null,item.name),h('small',null,item.enabled?(current?'已启用 · 当前使用':'已启用 · 切换后使用'):item.configured?'已关闭 · 配置保留':'未配置'))
    })),h('p',{className:'dcb-theme-assignments-note',role:'status'},`下方正在编辑${editing==='dark'?'夜间（深色）':'日间（浅色）'}配置。${editHint||'通过右上角日夜按钮切换后，可分别设置另一套。'}`))
}
