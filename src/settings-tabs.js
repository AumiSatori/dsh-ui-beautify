import {motion} from './motion.js'

const tabs=[['panel','任务面板'],['composer','输入栏'],['sidebar','侧栏'],['welcome','开屏欢迎'],['particles','粒子背景'],['messages','对话动效']]
export const settingsTabsCss=`
  .dcb-settings-tabs { min-width:0; position:relative; }
  .dcb-settings-tabbar { position:sticky; top:0; z-index:10; display:flex; flex-wrap:wrap; gap:4px; margin:0 0 16px; padding:5px; border:1px solid var(--dsh-settings-border); border-radius:12px; background:var(--dsh-settings-surface); box-shadow:0 2px 8px #00000007; }
  .dcb-settings-tabbar button { flex:1 1 86px; min-width:0; padding:9px 12px; border:1px solid transparent; border-radius:8px; background:transparent; color:var(--dsh-settings-secondary); font:500 13px/20px system-ui,sans-serif; white-space:nowrap; cursor:pointer; transition:background-color 220ms ${motion.ease.color},color 220ms ${motion.ease.color},border-color 220ms ${motion.ease.color},transform 220ms ${motion.ease.smooth}; }
  .dcb-settings-tabbar button:hover { background:#8881; color:var(--dsh-settings-text); }
  .dcb-settings-tabbar button[aria-selected=true] { background:var(--dsh-settings-subtle); border-color:#8883; color:var(--dsh-settings-text); font-weight:600; }
  .dcb-settings-tabbar button:active { transform:scale(.94); }
  .dcb-settings-tabbar button:focus-visible { outline:2px solid #888; outline-offset:1px; }
  .dcb-settings-tab-stage,.dcb-settings-tab-page { min-width:0; }
  .dcb-settings-tab-page { container:dcb-settings-page / inline-size; }
  .dcb-settings-tab-page > .dcb-settings-card { animation:none; }
  @container dcb-settings-page (max-width:640px) { .dcb-style-options { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; } }
  @container dcb-settings-page (max-width:340px) { .dcb-style-options { grid-template-columns:minmax(0,1fr); } }
  @media(prefers-reduced-motion:reduce) { .dcb-settings-tabbar button { transition:none; } }
  @media(forced-colors:active) { .dcb-settings-tabbar,.dcb-settings-tabbar button { background:Canvas; color:CanvasText; border-color:CanvasText; box-shadow:none; } .dcb-settings-tabbar button[aria-selected=true] { outline:2px solid Highlight; outline-offset:-3px; } }
`

// Only the active category mounts: hidden previews cannot keep decoding or drawing.
// Category memory belongs to this page, separate from appearance preferences.
export function createSettingsTabs(React,doc,win){
  let remembered='panel'
  const h=React.createElement
  return function SettingsTabs({children,onLeave}){
    const [selected,setSelected]=React.useState(remembered),[shown,setShown]=React.useState(remembered)
    const root=React.useRef(null),stage=React.useRef(null),page=React.useRef(null),selectedRef=React.useRef(selected),shownRef=React.useRef(shown),sequence=React.useRef(0),animations=React.useRef([]),pending=React.useRef(null),live=React.useRef(true)
    const uid=React.useId(),pages=React.Children.toArray(children)
    const quiet=()=>doc.hidden||win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches
    const clear=()=>{
      for(const animation of animations.current)animation.cancel();animations.current=[]
      if(stage.current){stage.current.style.removeProperty('height');stage.current.style.removeProperty('overflow');stage.current.setAttribute('data-state','idle')}
    }
    const animate=(node,frames,options)=>{
      const animation=node.animate(frames,{...options,fill:'both'});animation.id='dcb-settings-tab';animations.current.push(animation);return animation
    }
    const enter=(height,from)=>{
      if(!page.current||!stage.current)return
      const token=sequence.current
      if(quiet()){clear();return}
      try{
        stage.current.setAttribute('data-state','entering')
        const natural=page.current.getBoundingClientRect().height
        if(height!==null&&Math.abs(natural-height)>1){
          stage.current.style.height=height+'px';stage.current.style.overflow='hidden'
          animate(stage.current,[{height:height+'px'},{height:natural+'px'}],{duration:280,easing:motion.ease.smooth})
        }
        animate(page.current,[from||{opacity:0,transform:'translateY(8px)',filter:'blur(2px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{duration:240,easing:motion.ease.smooth})
        Promise.all(animations.current.map(animation=>animation.finished)).then(()=>{if(live.current&&sequence.current===token)clear()},()=>{})
      }catch{clear()}
    }
    React.useLayoutEffect(()=>{
      // The old page has now unmounted. Keep its completed exit fill until this
      // commit; cancelling it in replace() briefly reveals the old page again.
      const height=pending.current;pending.current=null;clear();enter(height)
    },[shown])
    React.useEffect(()=>{
      live.current=true
      const preference=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
      const settle=()=>{
        if(!quiet())return
        sequence.current++;clear();pending.current=null
        shownRef.current=selectedRef.current;setShown(selectedRef.current)
      }
      preference.addEventListener('change',settle);doc.addEventListener('visibilitychange',settle)
      return()=>{live.current=false;sequence.current++;clear();preference.removeEventListener('change',settle);doc.removeEventListener('visibilitychange',settle)}
    },[])
    const choose=id=>{
      if(id===selectedRef.current)return
      const height=stage.current.getBoundingClientRect().height,paint=win.getComputedStyle(page.current),from={opacity:paint.opacity,transform:paint.transform,filter:paint.filter}
      sequence.current++;const token=sequence.current;clear()
      selectedRef.current=id;remembered=id;setSelected(id);onLeave?.(shownRef.current,id)
      // Reset only this settings column when its sticky categories were scrolled.
      for(let parent=root.current.parentElement;parent;parent=parent.parentElement){
        if(!/(auto|scroll)/.test(win.getComputedStyle(parent).overflowY)||parent.scrollHeight<=parent.clientHeight)continue
        const offset=root.current.getBoundingClientRect().top-parent.getBoundingClientRect().top-parent.clientTop
        if(offset<0)parent.scrollTop=Math.max(0,parent.scrollTop+offset)
        break
      }
      if(quiet()){shownRef.current=id;setShown(id);return}
      if(id===shownRef.current){enter(height,from);return}
      stage.current.style.height=height+'px';stage.current.style.overflow='hidden';stage.current.setAttribute('data-state','leaving')
      const replace=()=>{if(!live.current||sequence.current!==token)return;pending.current=height;shownRef.current=id;setShown(id)}
      try{animate(page.current,[from,{opacity:0,transform:'translateY(-8px)',filter:'blur(2px)'}],{duration:motion.time.quick,easing:motion.ease.color}).finished.then(replace,()=>{})}catch{replace()}
    }
    return h('div',{className:'dcb-settings-tabs',ref:root},
      h('div',{className:'dcb-settings-tabbar',role:'tablist','aria-label':'美化设置分类'},tabs.map(([id,label],index)=>h('button',{key:id,id:`${uid}-tab-${id}`,type:'button',role:'tab','aria-selected':selected===id,'aria-controls':`${uid}-page-${id}`,tabIndex:selected===id?0:-1,
        onClick:()=>choose(id),onKeyDown:event=>{
          const at={ArrowRight:(index+1)%tabs.length,ArrowDown:(index+1)%tabs.length,ArrowLeft:(index+tabs.length-1)%tabs.length,ArrowUp:(index+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[event.key]
          if(at===undefined)return
          event.preventDefault();choose(tabs[at][0]);event.currentTarget.parentElement.children[at]?.focus()
        }},label))),
      h('div',{className:'dcb-settings-tab-stage',ref:stage},h('div',{key:shown,className:'dcb-settings-tab-page',ref:page,role:'tabpanel',id:`${uid}-page-${shown}`,'aria-labelledby':`${uid}-tab-${shown}`,'aria-hidden':selected!==shown,inert:selected!==shown},pages[tabs.findIndex(([id])=>id===shown)])))
  }
}
