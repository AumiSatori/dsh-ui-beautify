import {motion} from './motion.js'

const tabs=[['panel','任务面板'],['composer','输入栏'],['sidebar','侧栏'],['welcome','开屏欢迎'],['background','全图背景'],['particles','粒子背景'],['running','思考动图'],['messages','对话动效'],['toolbar','右上工具栏']]
export const settingsGroups=[
  {id:'global',label:'全局布局',children:['composer','sidebar','toolbar','welcome','background','particles'],sections:[{id:'interface',label:'界面布局',children:['composer','sidebar','toolbar']},{id:'scenery',label:'背景与欢迎',children:['welcome','background','particles']}]},
  {id:'conversation',label:'对话布局',children:['panel','running','messages'],sections:[{id:'tasks',label:'任务面板',children:['panel']},{id:'motion',label:'动效与反馈',children:['running','messages']}]},
]
const groupFor=id=>settingsGroups.find(group=>group.children.includes(id))||settingsGroups[0]
const sectionFor=id=>groupFor(id).sections.find(section=>section.children.includes(id))||groupFor(id).sections[0]
export const SETTINGS_TAB_KEY='dsh-ui-beautify:settings-tab:v1'
const CHILDREN_KEY='dsh-ui-beautify:settings-children:v1'
export const settingsTabsCss=`
  .dcb-settings-tabs { min-width:0; position:relative; container:dcb-settings-tabs / inline-size; }
  .dcb-settings-navigation { position:sticky; top:0; z-index:10; display:grid; gap:12px; margin-bottom:18px; padding:6px 0 12px; background:var(--dsh-settings-surface); }
  .dcb-settings-tabbar { display:flex; gap:4px; margin:0; padding:5px; border:1px solid var(--dsh-settings-border); border-radius:15px; background:var(--dsh-settings-subtle); }
  .dcb-settings-tabbar button { flex:1 1 86px; min-width:0; min-height:44px; padding:9px 12px; border:1px solid transparent; border-radius:10px; background:transparent; color:var(--dsh-settings-secondary); font:500 13px/20px system-ui,sans-serif; white-space:nowrap; cursor:pointer; transition:background-color ${motion.time.control}ms ${motion.ease.color},color ${motion.time.control}ms ${motion.ease.color},box-shadow ${motion.time.control}ms ${motion.ease.color},transform ${motion.time.control}ms ${motion.ease.smooth}; }
  .dcb-settings-tabbar button:hover { background:#8881; color:var(--dsh-settings-text); }
  .dcb-settings-tabbar button[aria-selected=true] { background:var(--dsh-settings-surface); border-color:var(--dsh-settings-border); color:var(--dsh-settings-text); box-shadow:0 2px 5px #0000000c; font-weight:600; }
  .dcb-settings-subbar { align-self:start; width:fit-content; max-width:100%; padding:3px; border:0; border-radius:11px; background:var(--dsh-settings-subtle); }
  .dcb-settings-subbar button { flex:0 0 auto; min-width:92px; min-height:44px; padding:7px 16px; border-radius:8px; font-size:12.5px; }
  .dcb-settings-subgroups { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:10px; min-width:0; }
  .dcb-settings-subgroup { display:block; min-width:0; }
  .dcb-settings-tabbar button:active { transform:scale(.94); }
  .dcb-settings-tabbar button:focus-visible { outline:2px solid #888; outline-offset:1px; }
  .dcb-settings-tab-stage,.dcb-settings-tab-page { min-width:0; }
  .dcb-settings-tab-page { container:dcb-settings-page / inline-size; }
  .dcb-settings-tab-page > .dcb-settings-card { animation:none; }
  @container dcb-settings-tabs (max-width:580px) {
    .dcb-settings-tabbar { flex-wrap:nowrap; overflow-x:auto; overscroll-behavior-x:contain; scrollbar-width:none; }
    .dcb-settings-tabbar::-webkit-scrollbar { display:none; }
    .dcb-settings-tabbar button { flex:1 0 auto; min-width:84px; min-height:44px; padding:9px 14px; }
    .dcb-settings-subbar { width:auto; }
    .dcb-settings-subgroups { grid-template-columns:minmax(0,1fr); }
  }
  @container dcb-settings-page (max-width:640px) { .dcb-style-options { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; } }
  @container dcb-settings-page (max-width:340px) { .dcb-style-options { grid-template-columns:minmax(0,1fr); } }
  @media(prefers-reduced-motion:reduce) { .dcb-settings-tabbar button { transition:none; } }
  @media(forced-colors:active) { .dcb-settings-tabbar,.dcb-settings-tabbar button { background:Canvas; color:CanvasText; border-color:CanvasText; box-shadow:none; } .dcb-settings-tabbar button[aria-selected=true] { outline:2px solid Highlight; outline-offset:-3px; } }
`

// Only the active category mounts: hidden previews cannot keep decoding or drawing.
// Remember only a validated category id, separate from appearance preferences.
export function createSettingsTabs(React,doc,win){
  let remembered='panel'
  const restore=()=>{
    try{const value=win.localStorage.getItem(SETTINGS_TAB_KEY);remembered=tabs.some(([id])=>id===value)?value:'panel';return remembered}
    catch{return remembered}
  }
  const h=React.createElement
  return function SettingsTabs({children,onLeave,pageVersion=0}){
    const [selected,setSelected]=React.useState(restore),[shown,setShown]=React.useState(selected)
    const root=React.useRef(null),stage=React.useRef(null),page=React.useRef(null),selectedRef=React.useRef(selected),shownRef=React.useRef(shown),sequence=React.useRef(0),animations=React.useRef([]),pending=React.useRef(null),live=React.useRef(true)
    const uid=React.useId(),pages=React.Children.toArray(children),tabReady=React.useRef(false),version=React.useRef(pageVersion)
    const childMemory=React.useRef(null)
    if(!childMemory.current){try{const saved=JSON.parse(win.localStorage.getItem(CHILDREN_KEY));childMemory.current=saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{}}catch{childMemory.current={}}}
    const rememberedChild=groupId=>{
      const direct=childMemory.current[groupId]
      if(direct)return direct
      const legacy=groupId==='global'?['layout','scenery']:['tasks','motion']
      return legacy.map(id=>childMemory.current[id]).find(id=>id)
    }
    const group=groupFor(selected),section=sectionFor(selected),siblings=section.children
    const quiet=()=>doc.hidden||win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches
    const keepTabVisible=(id,animate=false)=>{
      const button=doc.getElementById(`${uid}-tab-${id}`)||doc.getElementById(`${uid}-group-${groupFor(id).id}`),bar=button?.parentElement
      if(!bar||bar.scrollWidth<=bar.clientWidth)return
      const item=button.getBoundingClientRect(),box=bar.getBoundingClientRect(),left=item.left-box.left-6,right=item.right-box.right+6
      const delta=left<0?left:right>0?right:0
      if(delta)bar.scrollTo({left:bar.scrollLeft+delta,behavior:animate&&!quiet()?'smooth':'auto'})
    }
    React.useLayoutEffect(()=>{keepTabVisible(selected,tabReady.current);tabReady.current=true},[selected])
    React.useEffect(()=>{
      const resize=new win.ResizeObserver(()=>keepTabVisible(selectedRef.current))
      resize.observe(root.current)
      return()=>resize.disconnect()
    },[])
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
        const active=animations.current,finish=()=>{if(live.current&&sequence.current===token&&animations.current===active)clear()}
        Promise.all(active.map(animation=>animation.finished)).then(finish,finish)
      }catch{clear()}
    }
    React.useLayoutEffect(()=>{
      if(version.current!==pageVersion){
        version.current=pageVersion;sequence.current++;pending.current=null;clear()
        if(shownRef.current!==selectedRef.current){shownRef.current=selectedRef.current;setShown(selectedRef.current);return}
      }
      // The old page has now unmounted. Keep its completed exit fill until this
      // commit; cancelling it in replace() briefly reveals the old page again.
      const height=pending.current;pending.current=null;clear();enter(height)
    },[shown,pageVersion])
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
      childMemory.current[groupFor(id).id]=id
      try{win.localStorage.setItem(SETTINGS_TAB_KEY,id)}catch{/* Keep this window's category memory when browser storage is unavailable. */}
      try{win.localStorage.setItem(CHILDREN_KEY,JSON.stringify(childMemory.current))}catch{}
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
      try{animate(page.current,[from,{opacity:0,transform:'translateY(-8px)',filter:'blur(2px)'}],{duration:motion.time.quick,easing:motion.ease.color}).finished.then(replace,replace)}catch{replace()}
    }
    const navigate=(event,index,items,activate)=>{
      const at={ArrowRight:(index+1)%items.length,ArrowDown:(index+1)%items.length,ArrowLeft:(index+items.length-1)%items.length,ArrowUp:(index+items.length-1)%items.length,Home:0,End:items.length-1}[event.key]
      if(at===undefined)return
      event.preventDefault();activate(items[at]);event.currentTarget.parentElement.children[at]?.focus()
    }
    const chooseGroup=next=>choose(next.children.includes(rememberedChild(next.id))?rememberedChild(next.id):next.children[0])
    const subgroups=group.sections.map(sectionItem=>{
      const items=sectionItem.children.map((id,index)=>h('button',{key:id,id:`${uid}-tab-${id}`,type:'button',role:'tab','aria-selected':selected===id,'aria-controls':`${uid}-page-${id}`,tabIndex:selected===id?0:-1,onClick:()=>choose(id),onKeyDown:event=>navigate(event,index,sectionItem.children,choose)},tabs.find(tab=>tab[0]===id)[1]))
      return h('div',{key:sectionItem.id,className:'dcb-settings-subgroup'},h('div',{className:'dcb-settings-tabbar dcb-settings-subbar',role:'tablist','aria-label':`${sectionItem.label}选项`},items))
    })
    const pageNode=h('div',{key:`${shown}:${pageVersion}`,className:'dcb-settings-tab-page',ref:page,role:'tabpanel',id:`${uid}-page-${shown}`,'aria-labelledby':siblings.length>1?`${uid}-tab-${shown}`:`${uid}-group-${group.id}`,'aria-hidden':selected!==shown,inert:selected!==shown},pages[tabs.findIndex(([id])=>id===shown)])
    const stageNode=h('div',{className:'dcb-settings-tab-stage',ref:stage},pageNode)
    const groupNode=h('div',{id:`${uid}-group-page`,role:'group','aria-labelledby':`${uid}-group-${group.id}`},stageNode)
    return h('div',{className:'dcb-settings-tabs',ref:root},
      h('div',{className:'dcb-settings-navigation'},
        h('div',{className:'dcb-settings-tabbar',role:'tablist','aria-label':'美化设置分组'},settingsGroups.map((item,index)=>h('button',{key:item.id,id:`${uid}-group-${item.id}`,type:'button',role:'tab','aria-selected':group.id===item.id,'aria-controls':`${uid}-group-page`,tabIndex:group.id===item.id?0:-1,onClick:()=>chooseGroup(item),onKeyDown:event=>navigate(event,index,settingsGroups,chooseGroup)},item.label))),
        h('div',{className:'dcb-settings-subgroups'},subgroups)
      ),
      groupNode
    )
  }
}
