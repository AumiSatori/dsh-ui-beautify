import {motion} from './motion.js'
import {PRESET_SCOPES,presetScope} from './preset-scopes.js'

export const presetMarketCss=`
 .dcb-market { color:var(--dsh-settings-text); min-width:0; container:dcb-market / inline-size; }
 .dcb-market-portal { display:contents; position:static; container-type:normal; container-name:none; }
 .dcb-market h2,.dcb-market h3,.dcb-market p { margin:0; }
 .dcb-market-head { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:20px; }
 .dcb-market h2 { font:650 22px/1.5 system-ui,sans-serif; letter-spacing:-.5px; }
 .dcb-market p { font:12px/1.8 system-ui,sans-serif; color:var(--dsh-settings-secondary); }
 .dcb-market button,.dcb-market-link { appearance:none; box-sizing:border-box; min-height:40px; border:1px solid var(--dsh-settings-border); border-radius:10px; padding:8px 13px; color:var(--dsh-settings-text); background:var(--dsh-settings-surface); font:500 12px/1.5 system-ui,sans-serif; cursor:pointer; text-decoration:none; transition:background-color 200ms ${motion.ease.color},border-color 200ms ${motion.ease.color},transform 200ms ${motion.ease.smooth},opacity 200ms ${motion.ease.color}; }
 .dcb-market button:hover:enabled,.dcb-market-link:hover { background:var(--dsh-settings-subtle); }
 .dcb-market button:active:enabled { transform:scale(.94); }
 .dcb-market button:disabled { opacity:.45; cursor:not-allowed; }
 .dcb-market button:focus-visible,.dcb-market-link:focus-visible { outline:2px solid #888; outline-offset:3px; }
 .dcb-market button[data-primary] { background:var(--dsh-settings-text); color:var(--dsh-settings-surface); }
 .dcb-market button[data-primary]:hover:enabled { background:color-mix(in srgb,var(--dsh-settings-text) 88%,var(--dsh-settings-surface)); }
 .dcb-market-tabs { display:flex; gap:4px; border:1px solid var(--dsh-settings-border); border-radius:12px; background:var(--dsh-settings-subtle); padding:4px; flex:none; }
 .dcb-market-tabs button { border-color:transparent; background:transparent; min-width:64px; }
 .dcb-market-tabs button[aria-selected=true] { background:var(--dsh-settings-surface); border-color:var(--dsh-settings-border); box-shadow:0 2px 5px #0001; }
 .dcb-market-fold { display:grid; grid-template-rows:0fr; opacity:0; transform:translateY(-8px); filter:blur(3px); visibility:hidden; transition:grid-template-rows 260ms ${motion.ease.smooth},opacity 220ms ${motion.ease.smooth},transform 260ms ${motion.ease.smooth},filter 220ms ${motion.ease.smooth},visibility 260ms; }
 .dcb-market-fold[data-open=true] { grid-template-rows:1fr; opacity:1; transform:none; filter:blur(0); visibility:visible; }
 .dcb-market-fold > div { overflow:hidden; min-height:0; }
 .dcb-market-filters { display:grid; gap:14px; margin-bottom:18px; }
 .dcb-market-search { position:relative; }
 .dcb-market-search svg { position:absolute; left:12px; top:13px; width:16px; height:16px; color:var(--dsh-settings-secondary); }
 .dcb-market input,.dcb-market textarea { box-sizing:border-box; width:100%; min-width:0; background:transparent; border:1px solid var(--dsh-settings-border); border-radius:10px; padding:10px 12px; font:13px/1.6 system-ui,sans-serif; color:var(--dsh-settings-text); transition:border-color 200ms ${motion.ease.color},box-shadow 200ms ${motion.ease.color}; }
 .dcb-market input:focus,.dcb-market textarea:focus { outline:none; border-color:#888; box-shadow:0 0 0 3px #8882; }
 .dcb-market-search input { padding-left:37px; min-height:44px; }
 .dcb-market input::placeholder,.dcb-market textarea::placeholder { color:var(--dsh-settings-secondary); opacity:.65; }
 .dcb-market-chips { display:flex; flex-wrap:wrap; align-items:center; gap:7px; }
 .dcb-market-chips button { min-height:32px; padding:5px 11px; border-radius:999px; font-size:11px; background:transparent; }
 .dcb-market-chips button[aria-pressed=true] { color:var(--dsh-settings-surface); background:var(--dsh-settings-text); border-color:transparent; }
 .dcb-market-chips button[aria-pressed=true]:hover:enabled { color:var(--dsh-settings-surface); background:color-mix(in srgb,var(--dsh-settings-text) 88%,var(--dsh-settings-surface)); border-color:transparent; }
 .dcb-market-count { margin-left:auto; font:11px system-ui,sans-serif; color:var(--dsh-settings-secondary); }
 .dcb-market-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
 .dcb-market-card { box-sizing:border-box; margin:0; width:100%; max-width:none; flex:none; overflow:hidden; border:1px solid var(--dsh-settings-border); border-radius:15px; background:var(--dsh-settings-surface); min-width:0; display:flex; flex-direction:column; animation:dcb-market-enter 260ms cubic-bezier(.22,.8,.26,1) both; animation-delay:var(--dcb-market-delay,0ms); }
 .dcb-market-preview { height:130px; padding:18px; position:relative; overflow:hidden; background:linear-gradient(125deg,var(--market-a),var(--market-b)); display:grid; place-items:center; }
 .dcb-market-preview img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
 .dcb-market-demo { width:80%; height:85px; padding:9px; display:flex; gap:7px; border:1px solid #ffffffb0; border-radius:9px; background:#ffffff80; box-shadow:0 6px 16px #0000000c; transform:rotate(-4deg); }
 .dcb-market-demo-nav { width:19%; border-radius:4px; background:var(--market-c); opacity:.45; }
 .dcb-market-demo-chat { flex:1; display:flex; flex-direction:column; gap:5px; padding:3px 0; }
 .dcb-market-demo-chat i { display:block; height:5px; border-radius:5px; background:var(--market-c); opacity:.25; }
 .dcb-market-demo-chat i:nth-child(2) { width:65%; }.dcb-market-demo-chat i:nth-child(3) { width:80%; }
 .dcb-market-demo-chat b { margin-top:auto; height:16px; border:1px solid #ffffffaa; border-radius:5px; background:#ffffff99; }
 .dcb-market-scope { position:absolute; right:9px; top:9px; border:1px solid #ffffffb0; background:#ffffffb8; border-radius:999px; color:#444; font:10px/1.6 system-ui,sans-serif; padding:2px 7px; }
 .dcb-market-card-copy { display:grid; gap:8px; padding:15px; flex:1; }
 .dcb-market-card-title { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
 .dcb-market-card-title h3 { font:600 14px/1.5 system-ui,sans-serif; overflow-wrap:anywhere; }
 .dcb-market-badge { font:10px/1.5 system-ui,sans-serif; border:1px solid var(--dsh-settings-border); border-radius:5px; padding:1px 5px; color:var(--dsh-settings-secondary); }
 .dcb-market-card-copy p { font-size:11px; }
 .dcb-market-card-meta { font:10px/1.6 system-ui,sans-serif; color:var(--dsh-settings-secondary); overflow-wrap:anywhere; }
 .dcb-market-card-copy button { margin-top:auto; width:100%; }
 .dcb-market-empty { border:1px dashed var(--dsh-settings-border); border-radius:14px; text-align:center; padding:36px 16px; grid-column:1 / -1; }
 .dcb-market-notice { padding:12px 0 16px; }.dcb-market [role=alert] { color:var(--dsw-alias-state-error-primary,#bd6262); }
 .dcb-market-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
 .dcb-market-submit { border:1px solid var(--dsh-settings-border); border-radius:16px; padding:20px; display:grid; gap:18px; background:var(--dsh-settings-surface); }
 .dcb-market-submit label { display:grid; gap:7px; font:500 12px/1.6 system-ui,sans-serif; color:var(--dsh-settings-text); }
 .dcb-market-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
 .dcb-market-field-title { font:600 12px/1.6 system-ui,sans-serif; margin-bottom:8px; }
 .dcb-market-consent { display:flex; align-items:center; justify-content:space-between; gap:20px; }
 .dcb-market .dcb-switch { flex:none; }
 .dcb-market-mask { position:fixed; inset:0; z-index:2147482000; display:grid; place-items:center; padding:24px; background:#0005; backdrop-filter:blur(5px); visibility:hidden; opacity:0; pointer-events:none; transition:opacity 220ms ${motion.ease.smooth},visibility 240ms; }
 .dcb-market-mask[data-open=true] { visibility:visible; opacity:1; pointer-events:auto; }
 .dcb-market-modal { width:560px; max-width:100%; max-height:85vh; overflow:auto; padding:24px; border:1px solid var(--dsh-settings-border); border-radius:20px; background:var(--dsh-settings-surface); box-shadow:0 20px 90px #0004; transform:translateY(12px) scale(.96); filter:blur(3px); transition:transform 260ms cubic-bezier(.22,.8,.26,1),filter 220ms ${motion.ease.smooth}; }
 .dcb-market-mask[data-open=true] .dcb-market-modal { transform:none; filter:blur(0); }
 .dcb-market-modal .dcb-market-preview { margin:16px 0; border-radius:12px; height:170px; }
 .dcb-market-modal h3 { font:650 18px/1.5 system-ui,sans-serif; }.dcb-market-modal .dcb-market-actions { margin-top:18px; }
 .dcb-market-modal-head { display:flex; align-items:center; justify-content:space-between; gap:14px; }
 .dcb-market-foot { margin-top:18px!important; }
 @keyframes dcb-market-enter { from {opacity:0;transform:translateY(10px);filter:blur(3px)} to {opacity:1;transform:none;filter:blur(0)} }
 @container dcb-market (max-width:780px) { .dcb-market-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
 @container dcb-market (max-width:480px) { .dcb-market-grid,.dcb-market-fields { grid-template-columns:minmax(0,1fr); }.dcb-market-head { flex-wrap:wrap; }.dcb-market-submit { padding:16px; } }
 @media(prefers-reduced-motion:reduce),(forced-colors:active) { .dcb-market *,.dcb-market *::before,.dcb-market *::after { animation:none!important; transition:none!important; } }
 @media(forced-colors:active) { .dcb-market button,.dcb-market button[data-primary],.dcb-market-chips button[aria-pressed=true],.dcb-market-chips button[aria-pressed=true]:hover:enabled { background:ButtonFace;color:ButtonText;border-color:ButtonText; }.dcb-market-chips button[aria-pressed=true] { outline:2px solid Highlight; }.dcb-market-preview { background:Canvas; }.dcb-market-modal { background:Canvas;color:CanvasText; } }
`

export function createPresetMarketUI(React,win,{createPortal}={}){
  const h=React.createElement
  const overlay=node=>createPortal?createPortal(h('div',{className:'dcb-settings dcb-market dcb-market-portal'},node),win.document.body):node
  function Fold({open,children}){return h('div',{className:'dcb-market-fold','data-open':String(open),'aria-hidden':!open,inert:!open},h('div',null,children))}
  function Preview({item}){return h('div',{className:'dcb-market-preview',style:{'--market-a':item.palette[0],'--market-b':item.palette[1],'--market-c':item.palette[2]},'aria-hidden':true},item.preview?h('img',{src:item.preview,alt:'',loading:'lazy',referrerPolicy:'no-referrer',onError:e=>{e.currentTarget.style.visibility='hidden'}}):null,h('div',{className:'dcb-market-demo'},h('div',{className:'dcb-market-demo-nav'}),h('div',{className:'dcb-market-demo-chat'},h('i'),h('i'),h('i'),h('b'))),h('span',{className:'dcb-market-scope'},presetScope(item.scope).name))}
  function Chips({label,items,value,onChange,disabled=false}){return h('div',{className:'dcb-market-chips',role:'group','aria-label':label},items.map(([id,title])=>h('button',{type:'button',key:id,disabled,'aria-pressed':value===id,onClick:()=>onChange(id)},title)))}
  function Results({items,onSelect,emptyText}){
    const [shown,setShown]=React.useState(items),node=React.useRef(null),sequence=React.useRef(0),animations=React.useRef([]),height=React.useRef(null)
    const clear=()=>{for(const animation of animations.current)animation.cancel();animations.current=[];if(node.current){node.current.style.removeProperty('height');node.current.style.removeProperty('overflow')}}
    React.useEffect(()=>{
      const token=++sequence.current,el=node.current;clear()
      if(!el||win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches){setShown(items);return}
      height.current=el.getBoundingClientRect().height
      const animation=el.animate([{opacity:1,transform:'translateY(0)',filter:'blur(0)'},{opacity:0,transform:'translateY(-8px)',filter:'blur(3px)'}],{duration:180,easing:motion.ease.smooth,fill:'both',id:'dcb-market-results-exit'})
      animations.current=[animation]
      animation.finished.then(()=>{if(sequence.current===token)setShown(items)},()=>{})
      return()=>{sequence.current++;clear()}
    },[items])
    React.useLayoutEffect(()=>{
      const el=node.current,from=height.current;clear()
      if(from===null||win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches)return
      const natural=el.getBoundingClientRect().height
      el.style.overflow='hidden'
      const animation=el.animate([{height:from+'px',opacity:0,transform:'translateY(8px)',filter:'blur(3px)'},{height:natural+'px',opacity:1,transform:'translateY(0)',filter:'blur(0)'}],{duration:260,easing:motion.ease.smooth,fill:'both',id:'dcb-market-results-enter'})
      animations.current=[animation];const finish=()=>{if(animations.current.includes(animation))clear()};animation.finished.then(finish,finish)
    },[shown])
    return h('div',{className:'dcb-market-grid',ref:node},shown.length?shown.map((item,index)=>h('article',{className:'dcb-market-card',key:item.id,style:{'--dcb-market-delay':Math.min(index*25,125)+'ms'}},h(Preview,{item}),h('div',{className:'dcb-market-card-copy'},h('div',{className:'dcb-market-card-title'},h('h3',null,item.title),h('span',{className:'dcb-market-badge'},item.source==='official'?'官方':'社区 · 已审核')),h('p',null,item.description),h('div',{className:'dcb-market-card-meta'},item.author+' · v'+item.version+' · '+item.tags.join(' / ')),h('button',{type:'button','aria-label':'查看预设 '+item.title,onClick:event=>onSelect(item,event.currentTarget)},'查看预设')))):h('div',{className:'dcb-market-empty'},h('p',null,emptyText)))
  }
  return function PresetMarket({manager,presets,transfer}){
    const [tab,setTab]=React.useState('discover'),[items,setItems]=React.useState([]),[query,setQuery]=React.useState(''),[scope,setScope]=React.useState('all'),[source,setSource]=React.useState('all'),[loading,setLoading]=React.useState(true),[error,setError]=React.useState(''),[notice,setNotice]=React.useState(''),[catalogNotice,setCatalogNotice]=React.useState('')
    const [selected,setSelected]=React.useState(null),[prepared,setPrepared]=React.useState(null),[busy,setBusy]=React.useState(false),[draft,setDraft]=React.useState({id:'',version:'1.0.0',title:'',description:'',author:'',scope:'full',tags:'',license:'CC-BY-4.0'}),[consent,setConsent]=React.useState(false),[cover,setCover]=React.useState(null),[submission,setSubmission]=React.useState(null)
    const [transferState,setTransferState]=React.useState(()=>transfer.status())
    const live=React.useRef(false),gate=React.useRef(false),trigger=React.useRef(null),modal=React.useRef(null),download=React.useRef(null),selection=React.useRef(0),last=React.useRef(null),close=React.useRef(null),coverInput=React.useRef(null)
    const refresh=async()=>{setLoading(true);try{const result=await manager.catalog();if(live.current){setItems(result.items);setCatalogNotice(result.error);setError('')}}catch(e){if(live.current)setError(e.message)}finally{if(live.current)setLoading(false)}}
    React.useEffect(()=>{live.current=true;refresh();return()=>{live.current=false;selection.current++;if(download.current){win.clearTimeout(download.current.timer);win.URL.revokeObjectURL(download.current.url)}}},[])
    React.useEffect(()=>transfer.subscribe(()=>setTransferState(transfer.status())),[transfer])
    React.useEffect(()=>{
      if(!selected)return
      last.current=selected
      const focus=()=>{if(!modal.current?.contains(win.document.activeElement))close.current?.focus()}
      const frame=win.requestAnimationFrame(focus),timer=win.setTimeout(focus,280)
      return()=>{win.cancelAnimationFrame(frame);win.clearTimeout(timer)}
    },[selected,busy])
    const update=(key,value)=>{setDraft(v=>({...v,[key]:value}));setSubmission(null)}
    const run=async action=>{if(gate.current)return;gate.current=true;setBusy(true);setError('');setNotice('');try{await action()}catch(e){if(live.current)setError(e.message||'预设处理失败。')}finally{gate.current=false;if(live.current)setBusy(false)}}
    const dismiss=()=>{if(gate.current&&prepared)return;selection.current++;setSelected(null);setPrepared(null);trigger.current?.focus()}
    const select=(item,button)=>{trigger.current=button;last.current=item;setSelected(item);setPrepared(null);const token=++selection.current;run(async()=>{const result=await manager.inspect(item);if(live.current&&token===selection.current)setPrepared(result)})}
    const apply=()=>run(async()=>{const result=await manager.apply(prepared);if(live.current){setNotice(result.reload?'已应用预设，刷新界面后完整加载素材。':'预设已应用。');setSelected(null);setPrepared(null);trigger.current?.focus()}})
    const save=()=>run(async()=>{await presets.import(prepared.meta.title.slice(0,40),prepared.blob);if(live.current)setNotice('已保存到本机预设，可在「全局配置」中切换。')})
    const submit=()=>run(async()=>{
      if(!consent)throw Error('请先确认分享权限和投稿内容。')
      const result=await manager.submission({...draft,tags:draft.tags.split(/[,，]/).map(s=>s.trim()).filter(Boolean)},{cover})
      if(!live.current)return
      if(download.current){win.clearTimeout(download.current.timer);win.URL.revokeObjectURL(download.current.url)}
      const url=win.URL.createObjectURL(result.blob),link=win.document.createElement('a');link.href=url;link.download=result.name;win.document.body.append(link);link.click();link.remove()
      download.current={url,timer:win.setTimeout(()=>{win.URL.revokeObjectURL(url);download.current=null},30000)}
      setSubmission(result);setNotice('投稿包已导出。打开投稿页，上传 ZIP 后提交；审核通过才会出现在市场。')
    })
    const visible=React.useMemo(()=>items.filter(item=>(scope==='all'||scope==='components'&&item.scope!=='full'||item.scope===scope)&&(source==='all'||item.source===source)&&query.trim().toLowerCase().split(/\s+/).every(word=>(item.title+' '+item.description+' '+item.author+' '+item.tags.join(' ')).toLowerCase().includes(word))),[items,scope,source,query])
    const field=(key,label,max,placeholder)=>h('label',{key},label,h('input',{value:draft[key],maxLength:max,placeholder,disabled:busy,onChange:e=>update(key,e.target.value)}))
    const item=selected||last.current
    return h('section',{className:'dcb-market','aria-label':'预设市场'},
      h('div',{className:'dcb-market-head'},h('div',null,h('h2',null,'预设市场'),h('p',null,'发现整套风格，也为某一个角落挑选新样式。')),h('div',{className:'dcb-market-tabs',role:'tablist','aria-label':'预设市场页面'},[['discover','发现'],['submit','投稿']].map(([id,label])=>h('button',{type:'button',role:'tab',key:id,tabIndex:tab===id?0:-1,'aria-selected':tab===id,onClick:()=>setTab(id),onKeyDown:e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'discover':e.key==='End'?'submit':tab==='discover'?'submit':'discover';setTab(next);e.currentTarget.parentElement.querySelectorAll('button')[next==='discover'?0:1].focus()}}},label)))),
      h(Fold,{open:tab==='discover'},h('div',null,
        h('div',{className:'dcb-market-filters'},h('div',{className:'dcb-market-search'},h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,'aria-hidden':true},h('circle',{cx:10,cy:10,r:6}),h('path',{d:'m15 15 5 5'})),h('input',{'aria-label':'搜索市场预设',placeholder:'搜索名称、作者或标签…',value:query,onChange:e=>setQuery(e.target.value)})),
          h(Chips,{label:'预设类型',value:scope==='all'||scope==='full'?scope:'components',onChange:setScope,items:[['all','全部'],['full','整套预设'],['components','单项预设']]}),
          scope!=='full'&&h(Chips,{label:'预设分类',value:scope,onChange:setScope,items:PRESET_SCOPES.filter(s=>s.id!=='full').map(s=>[s.id,s.name])}),
          h('div',{className:'dcb-market-chips'},h(Chips,{label:'预设来源',value:source,onChange:setSource,items:[['all','全部来源'],['official','官方'],['community','社区']]}),h('span',{className:'dcb-market-count'},loading?'正在更新…':visible.length+' 个预设'),h('button',{type:'button',disabled:loading,onClick:refresh,'aria-label':'刷新预设市场'},'刷新'))),
        catalogNotice&&h('p',{className:'dcb-market-notice',role:'status'},catalogNotice),h(Results,{items:visible,onSelect:select,emptyText:loading?'正在读取市场预设…':items.length?'没有找到符合条件的预设。':'市场暂时还没有预设，欢迎投稿分享。'}))),
      h(Fold,{open:tab==='submit'},h('div',{className:'dcb-market-submit'},
        h('div',null,h('h3',null,'分享当前预设'),h('p',null,'导出当前配置和正在使用的素材，在 GitHub 投稿并上传 ZIP。维护者审核通过后收录到市场。官方发布使用维护者发布入口。')),
        h('div',{className:'dcb-market-fields'},field('title','预设名称',60,'为这份风格起个名字'),field('author','作者名称',60,'公开展示的署名'),field('id','预设 ID',60,'例如 quiet-glass（小写字母、数字和短横线）'),field('version','版本号',32,'1.0.0')),
        h('label',null,'预设简介',h('textarea',{value:draft.description,rows:3,maxLength:300,disabled:busy,onChange:e=>update('description',e.target.value),placeholder:'介绍风格、使用场景和素材来源'})),
        h('div',null,h('div',{className:'dcb-market-field-title'},'分享范围'),h(Chips,{label:'投稿分类',items:PRESET_SCOPES.map(s=>[s.id,s.name]),value:draft.scope,disabled:busy,onChange:value=>update('scope',value)}),h('p',null,presetScope(draft.scope).description+'。单项预设应用时保留其他分类。')),
        field('tags','标签（用逗号分隔，最多 8 个）',160,'简约, 玻璃, 深色'),
        h('div',null,h('div',{className:'dcb-market-field-title'},'分享许可'),h(Chips,{label:'分享许可',items:['CC-BY-4.0','CC-BY-SA-4.0','CC0-1.0','MIT'].map(s=>[s,s]),value:draft.license,disabled:busy,onChange:value=>update('license',value)})),
        h('div',null,h('div',{className:'dcb-market-field-title'},'封面（可选，PNG / JPG / WebP，最多 4 MB）'),h('div',{className:'dcb-market-actions'},h('button',{type:'button',disabled:busy,onClick:()=>coverInput.current?.click()},cover?'更换封面':'选择封面'),h('p',null,cover?.name||'未选择封面')),h('input',{ref:coverInput,type:'file',hidden:true,accept:'image/png,image/jpeg,image/webp','aria-label':'选择投稿封面',disabled:busy,onChange:e=>{setCover(e.target.files?.[0]||null);setSubmission(null)}})),
        h('div',{className:'dcb-market-consent'},h('p',null,'我有权分享这些素材，已检查投稿内容不含凭据、私人信息和聊天记录。'),h('button',{type:'button',className:'dcb-switch',role:'switch','aria-label':'确认投稿内容与分享权限','aria-checked':consent,disabled:busy,onClick:()=>setConsent(v=>!v)})),
        h('div',{className:'dcb-market-actions'},h('button',{type:'button','data-primary':'',disabled:busy||!consent,onClick:submit},busy?'正在打包…':'导出投稿包'),submission&&h('a',{className:'dcb-market-link',href:submission.url,target:'_blank',rel:'noopener noreferrer'},'打开 GitHub 投稿页'),h('a',{className:'dcb-market-link',href:'https://github.com/AumiSatori/dsh-ui-beautify/actions/workflows/preset-market.yml',target:'_blank',rel:'noopener noreferrer'},'官方发布入口')),h('p',null,'投稿包最多 64 MB，仅包含所选分类及使用中的素材。投稿后仍需上传 ZIP，不会自动上架。'))),
      h(Fold,{open:!!error&&!selected||!!notice&&!selected},h('div',{className:'dcb-market-notice'},error&&h('p',{role:'alert'},error),notice&&h('p',{role:'status','aria-live':'polite'},notice))),
      h('p',{className:'dcb-market-foot'},'官方预设由插件维护者发布；社区预设经审核收录。应用前可查看范围，应用后可撤销。'),
      (transferState.canUndo||transferState.reload)&&h('div',{className:'dcb-market-actions'},transferState.canUndo&&h('button',{type:'button',disabled:busy,onClick:()=>run(async()=>{await transfer.undo();if(live.current)setNotice('已撤销本次应用。')})},'撤销本次应用'),transferState.reload&&h('button',{type:'button',disabled:busy,onClick:()=>win.location.reload()},'刷新界面加载素材')),
      overlay(h('div',{className:'dcb-market-mask','data-open':String(!!selected),'aria-hidden':!selected,inert:!selected,onClick:e=>{if(e.target===e.currentTarget)dismiss()},onKeyDown:e=>{
        if(e.key==='Escape'){e.stopPropagation();dismiss()}
        if(e.key==='Tab'&&modal.current){const nodes=[...modal.current.querySelectorAll('button:not(:disabled),a[href]')],first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&win.document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&win.document.activeElement===last){e.preventDefault();first?.focus()}}
      }},h('div',{className:'dcb-market-modal',ref:modal,role:'dialog','aria-modal':true,'aria-label':item?'预设详情：'+item.title:'预设详情'},
        h('div',{className:'dcb-market-modal-head'},h('h3',null,item?.title||'预设详情'),h('button',{ref:close,type:'button',disabled:busy&&!!prepared,'aria-label':'关闭预设详情',onClick:dismiss},'关闭')),
        item&&h(Preview,{item}),item&&h('p',null,item.description),item&&h('p',null,`${item.author} · v${item.version} · ${item.source==='official'?'官方':'社区已审核'} · ${item.license}`),
        item&&h('p',null,'应用范围：'+presetScope(item.scope).name+(item.scope==='full'?'。将替换整套美化配置。':item.scope==='layout'?'。仅调整窗口与全屏聊天宽度。':'。其他分类和聊天宽度保持不变。')),
        h('p',{role:'status'},busy&&!prepared?'正在校验预设…':prepared?`${prepared.plan.options} 项设置 · ${prepared.plan.records} 条素材记录`:'') ,
        error&&h('p',{role:'alert'},error),notice&&h('p',{role:'status'},notice),h('div',{className:'dcb-market-actions'},h('button',{type:'button','data-primary':'',disabled:busy||!prepared,onClick:apply},'应用预设'),h('button',{type:'button',disabled:busy||!prepared,onClick:save},'保存到本机预设'))))))
  }
}
