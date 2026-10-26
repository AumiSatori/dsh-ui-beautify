import {motion} from './motion.js'

const MARK='data-dcb-icon',HOST='data-dcb-icons',GROUP='data-dcb-icon-group'
const names=name=>`:is([class$="_${name}"],[class*="_${name} "])`
// Sessionless views expose a leading slot, but have no native utility row.
const HEADER='header'
const SIDEBAR=names('sidebarCol'),ACTIONS=`[data-chat-flow] ${names('actions')}`
const NAV_ITEM=`${SIDEBAR} ${names('panelList')} ${names('panelRow')}[${MARK}]`
const EXCLUDE='[data-dcb-sidebar-ghost],[data-dcb-sidebar-layout-probe],[data-composer-overlay],[data-composer-input],[role=menu],[role=listbox],.dcb-settings,.dcs-model-menu,.dcb-summary,[data-dcb-task-panel],.dcb-file-viewer'
const SETTINGS_MARK='data-dcb-header-settings'
const CAPTION='data-dcb-caption-tools',CAPTION_BUTTON='data-dcb-caption-button'
const FILE_ICON='data-dcb-file-icon',FILE_TILE='data-dcb-file-tile',FILE_EXT='data-dcb-file-ext',FILE_TONE='data-dcb-file-tone'
const TONES={
  pdf:'pdf',doc:'document',docx:'document',odt:'document',rtf:'document',md:'document',markdown:'document',txt:'text',log:'text',
  xls:'spreadsheet',xlsx:'spreadsheet',xlsm:'spreadsheet',csv:'spreadsheet',ods:'spreadsheet',ppt:'presentation',pptx:'presentation',odp:'presentation',
  js:'code',mjs:'code',cjs:'code',ts:'code',tsx:'code',jsx:'code',py:'code',java:'code',c:'code',cpp:'code',h:'code',hpp:'code',rs:'code',go:'code',rb:'code',php:'code',swift:'code',kt:'code',css:'code',scss:'code',less:'code',html:'web',htm:'web',json:'data',yaml:'data',yml:'data',xml:'data',sql:'data',
  zip:'archive',rar:'archive','7z':'archive',tar:'archive',gz:'archive',bz2:'archive',png:'image',jpg:'image',jpeg:'image',gif:'image',webp:'image',svg:'image',bmp:'image',avif:'image',mp3:'audio',wav:'audio',flac:'audio',ogg:'audio',m4a:'audio',mp4:'video',webm:'video',mov:'video',avi:'video'
}
const fileDescriptor=value=>{const raw=String(value||'').trim().split(/[\\/]/).at(-1)||'',ext=(raw.match(/\.([^.]+)$/)?.[1]||raw).toLowerCase();return{ext:ext.slice(0,8).toUpperCase()||'FILE',tone:TONES[ext]||'file'}}
export const fileTypeDescriptor=fileDescriptor
// Compatibility API; this module owns surfaces only, never button contents.
export const ICON_STYLES=['native','plain','glass']
export const normalizeIconStyle=value=>ICON_STYLES.includes(value)?value:'glass'

export const unifiedIconsCss=`
  body[${HOST}] { --dcb-icon-fill:color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 72%,transparent); --dcb-icon-line:color-mix(in srgb,var(--dsw-alias-border-l3,#dce1e8) 72%,transparent); --dcb-icon-hover:var(--dsw-alias-interactive-bg-hover,#8882); --dcb-icon-accent:var(--dsh-settings-accent,var(--dsw-alias-state-business-primary,#5b65d2)); }
  [${MARK}]:not([data-dcb-icon-primary]) { border-radius:10px!important; background-color:transparent!important; box-shadow:none!important; backdrop-filter:none!important; -webkit-backdrop-filter:none!important; transition:background-color ${motion.time.quick}ms ${motion.ease.color},box-shadow ${motion.time.control}ms ${motion.ease.smooth},border-color ${motion.time.material}ms ${motion.ease.color}!important; }
  body[${HOST}=glass] [${MARK}]:not([data-dcb-icon-primary]) { background-color:transparent!important; box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dcb-icon-line) 50%,transparent),inset 0 1px 0 #ffffff30!important; }
  [${MARK}]:not([data-dcb-icon-primary]):hover { background-color:var(--dcb-icon-hover)!important; box-shadow:inset 0 0 0 1px var(--dcb-icon-line),inset 0 1px 0 #ffffff45!important; }
  [${MARK}]:not([data-dcb-icon-primary]):active { background-color:color-mix(in srgb,var(--dcb-icon-accent) 12%,var(--dcb-icon-hover))!important; box-shadow:inset 0 1px 3px #0000001c,inset 0 0 0 1px var(--dcb-icon-line)!important; }
  [${MARK}]:not([data-dcb-icon-primary]):is([aria-pressed=true],[aria-expanded=true]) { background-color:color-mix(in srgb,var(--dcb-icon-accent) 14%,transparent)!important; box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dcb-icon-accent) 40%,transparent)!important; }
  /* Navigation shares the sidebar's material; individual rows stay flat. */
  body[${HOST}] ${NAV_ITEM} { background:transparent!important; box-shadow:none!important; border-color:transparent!important; }
  body[${HOST}] ${NAV_ITEM}:is(:hover,:active,[aria-pressed=true],[aria-expanded=true],${names('panelActive')}) { background-color:var(--dcb-icon-hover)!important; }
  body[${HOST}=glass] [${MARK}]:not([data-dcb-icon-primary]):is(:hover,:active,[aria-pressed=true],[aria-expanded=true]) { background-color:transparent!important; }
  [${MARK}]:focus-visible { outline:2px solid var(--dsw-focus-ring-color,var(--dcb-icon-accent))!important; outline-offset:2px; }
  [${GROUP}=right] { position:relative; isolation:isolate; z-index:20; }
  header[data-dcb-header-compact] [${GROUP}=right] { position:relative!important; inset:auto!important; }
  [${GROUP}=right]::before { content:''; position:absolute; pointer-events:none; inset:-4px calc(-1 * var(--dcb-icon-right-extra,0px) - 4px) -4px -4px; z-index:-1; border:1px solid var(--dcb-icon-line); border-radius:15px; background:var(--dcb-icon-fill); box-shadow:inset 0 1px 0 #ffffff45,0 3px 12px #0000000b; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); transition:background-color ${motion.time.material}ms ${motion.ease.color},border-color ${motion.time.material}ms ${motion.ease.color}; }
  [${GROUP}=right-corner] { z-index:21; }
  [${GROUP}=right-corner]::before { display:none; }
  /* Keep this pane inside the native sidebar root, below its own buttons.
     A body-level pane would paint above the entire sidebar stacking context. */
  [${CAPTION}]${names('collapsed')} { padding-top:var(--dcb-caption-padding)!important; }
  [${CAPTION}]${names('collapsed')} [${CAPTION_BUTTON}] { position:fixed!important; top:var(--dcb-caption-top)!important; left:12px!important; width:30px!important; min-width:30px!important; height:30px!important; min-height:30px!important; margin:0!important; padding:0!important; z-index:30!important; -webkit-app-region:no-drag; }
  [${CAPTION}]${names('collapsed')} [${CAPTION_BUTTON}=new] { left:50px!important; }
  [${CAPTION}]:not(${names('collapsed')}) [${CAPTION_BUTTON}=toggle] { position:relative!important; inset:auto!important; width:30px!important; height:30px!important; margin:0!important; padding:0!important; flex:none; -webkit-app-region:no-drag; }
  [${CAPTION}] > [${GROUP}=caption] { position:fixed; left:8px; top:calc(var(--dcb-caption-top) - 4px); height:38px; box-sizing:border-box; z-index:29; pointer-events:none; border:1px solid var(--dcb-icon-line); border-radius:15px; background:var(--dcb-icon-fill); box-shadow:inset 0 1px 0 #ffffff45,0 3px 12px #0000000b; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
  [${FILE_ICON}],[${FILE_TILE}] { --dcb-file-color:#718096; --dcb-file-ink:#fff; }
  [${FILE_ICON}][${FILE_TONE}=pdf],[${FILE_TILE}][${FILE_TONE}=pdf] { --dcb-file-color:#df4d4d; }
  [${FILE_ICON}][${FILE_TONE}=document],[${FILE_TILE}][${FILE_TONE}=document] { --dcb-file-color:#4778d0; }
  [${FILE_ICON}][${FILE_TONE}=text],[${FILE_TILE}][${FILE_TONE}=text] { --dcb-file-color:#687789; }
  [${FILE_ICON}][${FILE_TONE}=spreadsheet],[${FILE_TILE}][${FILE_TONE}=spreadsheet] { --dcb-file-color:#27a36b; }
  [${FILE_ICON}][${FILE_TONE}=presentation],[${FILE_TILE}][${FILE_TONE}=presentation] { --dcb-file-color:#de7a3c; }
  [${FILE_ICON}][${FILE_TONE}=code],[${FILE_TILE}][${FILE_TONE}=code] { --dcb-file-color:#9a72d4; }
  [${FILE_ICON}][${FILE_TONE}=web],[${FILE_TILE}][${FILE_TONE}=web] { --dcb-file-color:#d06b8d; }
  [${FILE_ICON}][${FILE_TONE}=data],[${FILE_TILE}][${FILE_TONE}=data] { --dcb-file-color:#c58a36; }
  [${FILE_ICON}][${FILE_TONE}=archive],[${FILE_TILE}][${FILE_TONE}=archive] { --dcb-file-color:#8266c4; }
  [${FILE_ICON}][${FILE_TONE}=image],[${FILE_TILE}][${FILE_TONE}=image] { --dcb-file-color:#3188c8; }
  [${FILE_ICON}][${FILE_TONE}=audio],[${FILE_TILE}][${FILE_TONE}=audio] { --dcb-file-color:#c45b9e; }
  [${FILE_ICON}][${FILE_TONE}=video],[${FILE_TILE}][${FILE_TONE}=video] { --dcb-file-color:#188c96; }
  [${FILE_ICON}],[${FILE_TILE}] { position:relative; isolation:isolate; }
  [${FILE_ICON}] { color:transparent!important; background:transparent!important; border-color:transparent!important; overflow:hidden; }
  [${FILE_ICON}] > * { opacity:0!important; }
  [${FILE_ICON}]::before { content:''; position:absolute; z-index:-1; inset:4px 5px; border-radius:5px 5px 6px 6px; background:var(--dcb-file-color); clip-path:polygon(0 0,68% 0,100% 26%,100% 100%,0 100%); box-shadow:inset 0 1px 0 #ffffff80,0 3px 7px color-mix(in srgb,var(--dcb-file-color) 28%,transparent); }
  [${FILE_ICON}]::after { content:attr(${FILE_EXT}); position:absolute; inset:0; display:grid; place-items:center; padding-top:5px; color:var(--dcb-file-ink); font:800 8px/1 system-ui,sans-serif; letter-spacing:.1px; }
  [${FILE_TILE}] { background:transparent!important; color:transparent!important; font-size:0!important; }
  [${FILE_TILE}]::before { content:''; display:block; width:21px; height:24px; border-radius:4px 4px 5px 5px; background:var(--dcb-file-color); clip-path:polygon(0 0,68% 0,100% 26%,100% 100%,0 100%); box-shadow:inset 0 1px 0 #ffffff75,0 2px 5px color-mix(in srgb,var(--dcb-file-color) 28%,transparent); }
  [${FILE_TILE}]::after { content:attr(${FILE_EXT}); position:absolute; inset:0; display:grid; place-items:center; color:var(--dcb-file-ink); font:800 7px/1 system-ui,sans-serif; letter-spacing:.1px; pointer-events:none; }
  [${FILE_TILE}] > * { opacity:0!important; }
  header[data-dcb-caption-host] ${names('titleRow')} { margin-inline-start:var(--dcb-caption-inset,0px); }
  body[${HOST}=glass] [${MARK}][data-dcb-icon-caption] { background-color:transparent!important; }
  .dcb-header-settings { position:relative; display:inline-flex; align-items:center; justify-content:center; flex:none; width:30px; height:30px; padding:0; border:0; border-radius:8px; background:transparent; color:var(--dsw-alias-label-primary,#303237); cursor:pointer; -webkit-app-region:no-drag; }
  .dcb-header-settings:focus-visible { outline:2px solid var(--dsw-focus-ring-color,var(--dsh-settings-accent,#6262f6)); outline-offset:2px; }
  .dcb-header-settings svg { width:16px; height:16px; display:block; pointer-events:none; }
  header > ${names('headerLeading')}:has(.dcb-welcome-tools) { display:contents!important; }
  header .dcb-welcome-tools.dcb-welcome-tools { position:absolute!important; inset:10px 50px auto auto!important; display:flex; align-items:center; gap:8px; width:max-content; max-width:calc(100% - 80px); height:30px; margin:0; -webkit-app-region:no-drag; }
  @media(pointer:coarse) { .dcb-header-settings { width:44px; min-height:44px; } }
  .dcb-icon-style-options { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:12px; }
  .dcb-icon-style-choice { min-height:80px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:12px 8px; border:1px solid var(--dsh-settings-border,#8883); border-radius:12px; background:var(--dsh-settings-subtle,#8881); color:var(--dsh-settings-text,inherit); font:500 13px/1.5 system-ui; cursor:pointer; transition:background-color ${motion.time.quick}ms ${motion.ease.color},border-color ${motion.time.quick}ms ${motion.ease.color}; }
  .dcb-icon-style-choice[aria-checked=true] { border-color:var(--dsh-settings-accent,#6262f6); background:color-mix(in srgb,var(--dsh-settings-accent,#6262f6) 9%,var(--dsh-settings-surface,#fff)); }
  .dcb-icon-style-choice:focus-visible { outline:2px solid var(--dsh-settings-accent,#6262f6); outline-offset:2px; }
  .dcb-button-surface-preview { display:flex; gap:4px; padding:5px; border-radius:9px; }
  .dcb-button-surface-preview i { display:block; width:16px; height:16px; border-radius:5px; background:var(--dsh-settings-text,#687080); opacity:.32; }
  [data-surface-preview=glass] { background:linear-gradient(135deg,#ffffff66,#ffffff0a); box-shadow:inset 0 0 0 1px #8884,0 2px 5px #0001; }
  [data-surface-preview=native] { background:var(--dsh-settings-surface,#fff); border:1px solid #8883; }
  @media(prefers-reduced-motion:reduce) { [${MARK}]:not([data-dcb-icon-primary]),.dcb-icon-style-choice,[${GROUP}=left],[${GROUP}=right]::before { transition:none!important; } }
  @media(prefers-reduced-transparency:reduce) { [${GROUP}=caption],[${GROUP}=right]::before { backdrop-filter:none!important; -webkit-backdrop-filter:none!important; background:var(--dsw-alias-bg-base,#fff); } }
  @media(forced-colors:active) { body[${HOST}] ${NAV_ITEM} { background:Canvas!important; } body[${HOST}] ${NAV_ITEM}:is(:hover,:active,[aria-pressed=true],[aria-expanded=true],${names('panelActive')}) { background:Highlight!important; color:HighlightText!important; } }
  @media(forced-colors:active) { [${GROUP}=caption],[${GROUP}=right]::before { background:Canvas; border-color:CanvasText; backdrop-filter:none!important; -webkit-backdrop-filter:none!important; box-shadow:none; } body[${HOST}] [${MARK}]:not([data-dcb-icon-primary]),.dcb-icon-style-choice { background-color:ButtonFace!important; box-shadow:none!important; outline:1px solid ButtonText; outline-offset:-1px; } [${MARK}]:is([aria-pressed=true],[aria-expanded=true]),.dcb-icon-style-choice[aria-checked=true] { outline:2px solid Highlight; outline-offset:-3px; } [${MARK}]:focus-visible { outline-color:Highlight!important; } }
`

function identify(button,doc){
  const label=(button.getAttribute('aria-label')||button.getAttribute('title')||'').toLowerCase(),has=name=>button.matches(names(name))
  // Preserve the original glass pill, its sun/moon scene and all transitions.
  if(button.matches('.dcb-theme-toggle'))return null
  if(button.matches('.dcb-focus-toggle'))return 'background'
  if(button.matches('.dcb-entry'))return 'tasks'
  if(button.matches('.dcb-fullscreen-exit'))return 'exit'
  if(has('toggle')&&button.closest(SIDEBAR))return 'left'
  if(has('newSession'))return 'chat'
  if(button.matches('[data-sidebar-right-expand]')||/右侧(?:边)?栏|right sidebar|right panel/.test(label))return 'right'
  if(/使用.*打开|文件资源管理器|open.*(?:folder|explorer)|打开目录/.test(label))return 'folder'
  if(/更多开放方式/.test(label))return 'chevron'
  if(/更多|more/.test(label))return 'more'
  if(/专注|focus/.test(label))return 'focus'
  if(/退出全屏|exit fullscreen/.test(label))return 'exit'
  if(/新建?会话|new (?:chat|session)/.test(label))return 'chat'
  if(/插件市场|plugin market/.test(label))return 'market'
  if(/插件|plugins/.test(label))return 'puzzle'
  if(/记忆系统|memory/.test(label))return 'memory'
  if(/自动化|automation|最近|history/.test(label))return 'clock'
  if(/搜索|search/.test(label))return 'search'
  if(/视图选项|view options/.test(label))return 'sliders'
  if(/添加工作区/.test(label))return 'folder'
  if(/设置|settings/.test(label))return 'settings'
  if(/复制|copy/.test(label))return 'copy'
  if(/不喜欢|不满意|dislike|thumbs.down/.test(label))return 'dislike'
  if(/喜欢|满意|like|thumbs.up/.test(label))return 'like'
  if(/朗读|read aloud|播放|listen/.test(label))return 'volume'
  if(/分享|share/.test(label))return 'share'
  if(/重试|重新生成|retry|regenerate/.test(label))return 'retry'
  if(button.matches('.meme-trigger')||/表情|emoji/.test(label))return 'smile'
  if(button.closest('[data-composer-card]')){
    if(has('add'))return 'plus'
    if(/权限|访问模式|permission|access mode/.test(label))return 'shield'
    if(/发送|send/.test(label))return 'send'
    if(/停止|stop/.test(label))return 'stop'
    if(/语音对话|voice mode|开始语音/.test(label))return 'voice'
    if(/语音|麦克风|录音|voice|microphone|dictation|speech/.test(label))return 'mic'
  }
  if(button.closest(`${HEADER} ${names('headerUtilities')},${HEADER} ${names('headerCorner')}`))return 'toolbar'
  return null
}

export function createUnifiedIcons(doc,win,schedule=()=>{}){
  const records=new Map(),groups=new Map(),settingsButtons=new Map(),captions=new Map(),fileDecorations=new Map(),original=doc.body.getAttribute(HOST),resize=new win.ResizeObserver(()=>schedule())
  let mode='native',disposed=false,pendingSettings=null,settingsCommand=null
  const restore=(node,key,value)=>value===null?node.removeAttribute(key):node.setAttribute(key,value)
  function attr(record,node,key,value){if(!record.attrs.has(node))record.attrs.set(node,new Map());const attrs=record.attrs.get(node);if(!attrs.has(key))attrs.set(key,node.getAttribute(key));if(node.getAttribute(key)!==value)node.setAttribute(key,value)}
  function release(button,record){for(const[node,attrs]of record.attrs)for(const[key,value]of attrs)restore(node,key,value);records.delete(button)}
  function group(node,kind,extra=0){
    if(!groups.has(node)){groups.set(node,{mark:node.getAttribute(GROUP),extra:node.style.getPropertyValue('--dcb-icon-right-extra'),priority:node.style.getPropertyPriority('--dcb-icon-right-extra')});resize.observe(node)}
    if(node.getAttribute(GROUP)!==kind)node.setAttribute(GROUP,kind)
    if(kind==='right'&&node.style.getPropertyValue('--dcb-icon-right-extra')!==extra+'px')node.style.setProperty('--dcb-icon-right-extra',extra+'px')
  }
  function releaseGroup(node,record){resize.unobserve(node);restore(node,GROUP,record.mark);if(record.extra)node.style.setProperty('--dcb-icon-right-extra',record.extra,record.priority);else node.style.removeProperty('--dcb-icon-right-extra');groups.delete(node)}
  function decorateFileNode(node,descriptor,kind){
    if(!node)return
    let record=fileDecorations.get(node)
    if(!record){record={attrs:new Map()};fileDecorations.set(node,record)}
    const mark=kind==='tile'?FILE_TILE:FILE_ICON
    for(const[key,value]of [[mark,''],[FILE_EXT,descriptor.ext],[FILE_TONE,descriptor.tone]]){
      if(!record.attrs.has(key))record.attrs.set(key,node.getAttribute(key))
      if(node.getAttribute(key)!==value)node.setAttribute(key,value)
    }
  }
  function releaseFileNode(node,record){for(const[key,value]of record.attrs)restore(node,key,value);fileDecorations.delete(node)}
  function syncFileIcons(){
    const wanted=new Set()
    for(const card of doc.querySelectorAll('[data-presented-file]')){
      const icon=card.querySelector(names('fileIcon')),name=card.querySelector(names('fileName'))?.textContent
      if(icon){decorateFileNode(icon,fileDescriptor(name),'icon');wanted.add(icon)}
    }
    for(const output of doc.querySelectorAll('.dcb-output')){
      const tile=output.querySelector('.dcb-tile[data-kind="file"]'),name=output.querySelector('.dcb-file-name')?.textContent,type=output.querySelector('.dcb-file-type')?.textContent
      if(tile){decorateFileNode(tile,fileDescriptor(name?.includes('.')?name:type||name),'tile');wanted.add(tile)}
    }
    for(const[node,record]of fileDecorations)if(!wanted.has(node))releaseFileNode(node,record)
  }
  function releaseCaption(root,record){
    record.pane?.remove();resize.unobserve(record.header);restore(root,CAPTION,record.mark)
    restore(record.header,'data-dcb-caption-host',record.headerMark)
    if(record.headerInset)record.header.style.setProperty('--dcb-caption-inset',record.headerInset,record.headerPriority);else record.header.style.removeProperty('--dcb-caption-inset')
    for(const[node,value]of record.buttons)restore(node,CAPTION_BUTTON,value)
    for(const[key,value,priority]of record.variables){if(value)root.style.setProperty(key,value,priority);else root.style.removeProperty(key)}
    captions.delete(root)
  }
  function syncCaptions(){
    const wanted=new Set()
    if(!doc.documentElement.hasAttribute('data-dcb-fullscreen'))for(const column of doc.querySelectorAll(SIDEBAR)){
      if(column.closest(EXCLUDE))continue
      const frame=column.closest(names('frame')),header=frame?.querySelector(`${names('centerCol')} header:has(> [data-conversation-header-leading])`)
      const toggle=column.querySelector(`button${names('toggle')}`),root=toggle?.closest(names('root')),add=root?.querySelector(`button${names('newSession')}`)
      if(!header||!root||!add||!header.getClientRects().length)continue
      let record=captions.get(root)
      if(record&&(record.header!==header||record.toggle!==toggle||record.add!==add)){releaseCaption(root,record);record=null}
      if(!record){
        record={header,toggle,add,mark:root.getAttribute(CAPTION),headerMark:header.getAttribute('data-dcb-caption-host'),headerInset:header.style.getPropertyValue('--dcb-caption-inset'),headerPriority:header.style.getPropertyPriority('--dcb-caption-inset'),buttons:[toggle,add].map(node=>[node,node.getAttribute(CAPTION_BUTTON)]),variables:['--dcb-caption-top','--dcb-caption-padding'].map(key=>[key,root.style.getPropertyValue(key),root.style.getPropertyPriority(key)]),padding:parseFloat(win.getComputedStyle(root).paddingTop)||0,pane:null}
        captions.set(root,record);root.setAttribute(CAPTION,'');toggle.setAttribute(CAPTION_BUTTON,'toggle');add.setAttribute(CAPTION_BUTTON,'new');resize.observe(header)
      }
      wanted.add(root)
      const tools=header.querySelector(names('headerUtilities')),rect=tools?.getBoundingClientRect(),bounds=header.getBoundingClientRect()
      const top=Math.max(4,rect?.height?rect.top:bounds.top+10),padding=Math.max(record.padding,top+38-root.getBoundingClientRect().top)
      for(const[key,value]of [['--dcb-caption-top',top+'px'],['--dcb-caption-padding',padding+'px']])if(root.style.getPropertyValue(key)!==value)root.style.setProperty(key,value)
      const collapsed=root.matches(names('collapsed'))||frame.getAttribute('data-sidebar-collapsed')==='true'
      const row=header.querySelector(names('titleRow')),title=row?.querySelector(names('titleCluster')),end=Math.max(toggle.getBoundingClientRect().right,add.getBoundingClientRect().right)
      if(title){
        const bounds=(header.hasAttribute('data-dcb-toolbar-layout')?title:row).getBoundingClientRect()
        const base=bounds.left-(parseFloat(header.style.getPropertyValue('--dcb-caption-inset'))||0),inset=(collapsed?Math.max(0,end+12-base):0)+'px'
        header.setAttribute('data-dcb-caption-host','')
        if(header.style.getPropertyValue('--dcb-caption-inset')!==inset)header.style.setProperty('--dcb-caption-inset',inset)
      }
      if(mode==='glass'&&collapsed){
        if(!record.pane){record.pane=doc.createElement('div');record.pane.setAttribute(GROUP,'caption');record.pane.setAttribute('aria-hidden','true');root.append(record.pane)}
        const width=Math.max(toggle.getBoundingClientRect().right,add.getBoundingClientRect().right)-8+4
        if(record.pane.style.width!==width+'px')record.pane.style.width=width+'px'
      }else{record.pane?.remove();record.pane=null}
    }
    for(const[root,record]of captions)if(!wanted.has(root))releaseCaption(root,record)
  }
  function openSettings(){
    // Invoke the host's registered Settings command when its optional shortcut
    // provider exposes it. This uses the same action as the native app menu.
    if(settingsCommand){settingsCommand();return}
    if(pendingSettings)return
    const account=doc.querySelector('button[aria-label="账号菜单"],button[aria-label*="账号"],button[aria-label*="Account"]')
    if(!account)return
    // Leave the originating toolbar click before opening another host layer.
    // Otherwise the same bubbling click can immediately dismiss the new dialog.
    const record={observer:null,start:0,select:0,deadline:0,selecting:false}
    pendingSettings=record
    const find=()=>{
      if(pendingSettings!==record||record.selecting)return
      const item=[...doc.querySelectorAll('[role="menu"] [role="menuitem"],[role="menu"] button')].find(node=>/^(设置|Settings)/i.test(node.textContent.trim()))
      if(!item)return
      record.selecting=true;record.observer.disconnect()
      record.select=win.setTimeout(()=>{cancelSettings();if(!disposed&&item.isConnected)item.click()},0)
    }
    record.observer=new win.MutationObserver(find)
    record.deadline=win.setTimeout(cancelSettings,1500)
    record.start=win.setTimeout(()=>{if(disposed||pendingSettings!==record)return;record.observer.observe(doc.body,{subtree:true,childList:true});account.click();find()},0)
  }
  function cancelSettings(){const record=pendingSettings;if(!record)return;record.observer.disconnect();for(const key of ['start','select','deadline'])win.clearTimeout(record[key]);pendingSettings=null}
  function settingsButton(tools){
    if(settingsButtons.has(tools))return settingsButtons.get(tools).button
    const button=doc.createElement('button');button.type='button';button.className='dcb-header-settings';button.setAttribute(SETTINGS_MARK,'');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-label','打开设置');button.title='打开设置';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 3h5l.6 2.1 1.5.9 2.1-.5 2.5 4.3-1.5 1.6v1.8l1.5 1.6-2.5 4.3-2.1-.5-1.5.9-.6 2.1h-5l-.6-2.1-1.5-.9-2.1.5-2.5-4.3 1.5-1.6v-1.8l-1.5-1.6 2.5-4.3 2.1.5 1.5-.9Z"/><circle cx="12" cy="12" r="3"/></svg>'
    const handler=()=>openSettings();button.addEventListener('click',handler);tools.append(button);settingsButtons.set(tools,{button,handler});return button
  }
  function releaseSettings(tools,record){record.button.removeEventListener('click',record.handler);record.button.remove();settingsButtons.delete(tools)}
  function sync(value=mode){
    if(disposed)return
    mode=normalizeIconStyle(value)
    syncFileIcons()
    syncCaptions()
    // A responsive/native header can expose several utility containers for
    // the same toolbar (for example a desktop row and its projected slot).
    // They may all be visible at once, so append our entry to one canonical
    // container per header instead of creating one gear in every container.
    const visible=node=>node.isConnected&&!!node.getClientRects().length&&(()=>{const style=win.getComputedStyle(node);return style.display!=='none'&&style.visibility!=='hidden'})()
    const headerTools=[]
    const utilityByHeader=new Map()
    for(const node of doc.querySelectorAll(`${HEADER} ${names('headerUtilities')}`)){
      if(node.closest(EXCLUDE)||!visible(node))continue
      const header=node.closest(HEADER)
      if(!header)continue
      const list=utilityByHeader.get(header)||[];list.push(node);utilityByHeader.set(header,list)
    }
    for(const list of utilityByHeader.values()){
      list.sort((a,b)=>{
        const buttons=node=>[...node.querySelectorAll('button')].filter(visible).length
        return buttons(b)-buttons(a)
      })
      headerTools.push(list[0])
    }
    for(const tools of headerTools)settingsButton(tools)
    for(const[tools,record]of settingsButtons)if(!headerTools.includes(tools))releaseSettings(tools,record)
    const candidates=mode==='native'?[]:[...doc.querySelectorAll(`${HEADER} ${names('headerUtilities')} button,${HEADER} ${names('headerCorner')} button,${SIDEBAR} button,[data-composer-card] button,${ACTIONS} button,.dcb-fullscreen-exit,.dsh-read-aloud-btn`)]
    const wanted=new Set()
    for(const button of candidates){
      if(button.closest(EXCLUDE)||button.matches(names('brand'))||button.closest('[data-sidebar-right-panel]'))continue
      const kind=identify(button,doc)
      if(!kind)continue
      wanted.add(button)
      let record=records.get(button)
      if(!record){record={attrs:new Map()};records.set(button,record)}
      attr(record,button,MARK,kind)
      if(button.matches(names('primary')))attr(record,button,'data-dcb-icon-primary','')
      if(kind==='left'||kind==='chat'&&button.closest(SIDEBAR))attr(record,button,'data-dcb-icon-caption','')

    }
    for(const[button,record]of records)if(!wanted.has(button))release(button,record)
    if(mode==='native'){restore(doc.body,HOST,original)}else if(doc.body.getAttribute(HOST)!==mode)doc.body.setAttribute(HOST,mode)
    const desired=new Set()
    if(mode==='glass')for(const header of doc.querySelectorAll(HEADER)){
      const tools=header.querySelector(names('headerUtilities')),corner=header.querySelector(names('headerCorner'))
      if(!tools?.getClientRects().length||header.closest(EXCLUDE))continue
      // One shared pane behind adjacent utility and corner controls. Native
      // compact layouts can place them on different rows; then leave corner
      // plain instead of blurring a large empty rectangle.
      const a=tools.getBoundingClientRect(),b=corner?.getBoundingClientRect(),adjacent=b&&Math.abs(a.y-b.y)<10&&b.left-a.right<36&&b.right>=a.right
      group(tools,'right',adjacent?b.right-a.right:0);desired.add(tools)
      if(corner){group(corner,'right-corner');desired.add(corner)}
    }
    for(const[node,record]of groups)if(!desired.has(node))releaseGroup(node,record)
  }
  const state=event=>{const button=event.target.closest?.(`[${MARK}]`);if(button)sync()}
  const observer=new win.MutationObserver(entries=>{if(mode!=='native'&&entries.some(entry=>entry.type==='attributes'&&entry.target.matches(`[${MARK}]`)||entry.type==='childList'&&[...entry.addedNodes,...entry.removedNodes].some(node=>node.nodeType===1&&!node.matches('[data-dcb-icon-group=left]')&&(node.matches('button,header,[data-composer-card]')||node.querySelector?.('button')))))schedule()})
  observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-label','title','aria-expanded','aria-pressed']})
  win.addEventListener('resize',schedule,{passive:true});doc.addEventListener('fullscreenchange',schedule);doc.addEventListener('click',state)
    return{sync,connectShortcuts(service){settingsCommand=typeof service?.registry?.invoke==='function'?()=>service.registry.invoke('settings.open',{target:doc.activeElement,region:'page',modal:null}):null},owns:button=>mode!=='native'&&!!button.closest(`[${MARK}]`),dispose(){if(disposed)return;disposed=true;settingsCommand=null;cancelSettings();observer.disconnect();resize.disconnect();win.removeEventListener('resize',schedule);doc.removeEventListener('fullscreenchange',schedule);doc.removeEventListener('click',state);for(const[tools,record]of settingsButtons)releaseSettings(tools,record);for(const[button,record]of records)release(button,record);for(const[node,record]of groups)releaseGroup(node,record);for(const[root,record]of captions)releaseCaption(root,record);for(const[node,record]of fileDecorations)releaseFileNode(node,record);restore(doc.body,HOST,original)}}
}

export function createWelcomeToolbar(React,doc,ThemeButton,FocusButton){
  const h=React.createElement
  return function WelcomeToolbar(){
    const ref=React.useRef(null),[blank,setBlank]=React.useState(false)
    React.useLayoutEffect(()=>{
      const header=ref.current?.closest('header')
      if(!header)return
      const update=()=>setBlank(header.matches(`${names('headerBlank')},${names('headerSessionless')}`))
      update();const observer=new doc.defaultView.MutationObserver(update);observer.observe(header,{attributes:true,attributeFilter:['class']})
      return()=>observer.disconnect()
    },[])
    return h(React.Fragment,null,h('span',{ref,hidden:true,'data-dcb-welcome-tools-source':''}),blank?h('div',{className:'dcb-welcome-tools dcb_headerUtilities','aria-label':'新会话工具'},h(ThemeButton),h(FocusButton)):null)
  }
}

export function createIconSettings(React){
  const h=React.createElement
  return function IconSettings({value,onChange}){return h('div',{className:'dcb-settings-section'},
    h('div',{className:'dcb-settings-copy'},h('span',{className:'dcb-settings-row-title'},'按钮背景样式'),h('p',{className:'dcb-settings-row-desc'},'仅调整按钮底板与背景反馈。保留原有鲸鱼 LOGO、图标、文字、尺寸，以及昼夜玻璃切换动效。')),
    h('div',{className:'dcb-icon-style-options',role:'radiogroup','aria-label':'按钮背景样式',onKeyDown:event=>{const index=ICON_STYLES.indexOf(value),next=event.key==='ArrowRight'||event.key==='ArrowDown'?(index+1)%3:event.key==='ArrowLeft'||event.key==='ArrowUp'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:-1;if(next<0)return;event.preventDefault();onChange(ICON_STYLES[next]);event.currentTarget.querySelectorAll('button')[next]?.focus()}},[['native','默认'],['plain','轻量底板'],['glass','轻玻璃分组']].map(([id,label])=>h('button',{key:id,type:'button',className:'dcb-icon-style-choice',role:'radio','aria-checked':value===id,onClick:()=>onChange(id)},h('span',{className:'dcb-button-surface-preview','data-surface-preview':id,'aria-hidden':true},h('i'),h('i'),h('i')),label))),
    h('p',{className:'dcb-settings-footnote'},value==='glass'?'左右工具区各共享一层 8px 背景模糊，昼夜按钮保留原有玻璃与动效。输入栏不重复叠加滤镜；动态背景仍会增加合成开销。':value==='plain'?'仅统一底板与背景反馈，不新增背景模糊；昼夜玻璃按钮保持原样。':'恢复原有按钮背景；所有模式均保留按钮内容与昼夜动效。'))}
}
