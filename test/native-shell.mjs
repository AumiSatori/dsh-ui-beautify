import {formatBundle,moduleCss,moduleClasses,componentRegion} from './host-bundle-reader.mjs'
import {openSync,readSync,closeSync} from 'node:fs'

export function nativeShell({workspaceRows=false}={}){
  if(!process.env.DSH_ASAR)throw Error('Set DSH_ASAR to verify the installed native AppFrame and SidebarRoot')
  const fd=openSync(process.env.DSH_ASAR,'r')
  try{
    const header=Buffer.alloc(16);readSync(fd,header,0,16,0)
    const json=Buffer.alloc(header.readUInt32LE(12));readSync(fd,json,0,json.length,16)
    const tree=JSON.parse(json),offset=8+header.readUInt32LE(4)
    const entry=name=>{let item=tree;for(const part of `dsh/node_modules/@deepseek-ai/dsh-client-ui-${name}/lib/client.js`.split('/'))item=item.files[part];const data=Buffer.alloc(item.size);readSync(fd,data,0,data.length,offset+Number(item.offset));return formatBundle(data.toString())}
    const layout=entry('layout'),sidebar=entry('sidebar'),right=entry('sidebar-right'),conversation=entry('conversation')
    function sheet(source,name,prefix){
      const raw=moduleCss(source,name),hash=raw.match(/\.([\w-]+)_(?:frame|root|session)\{/)[1]
      return {css:raw.replaceAll(hash+'_',prefix+'_'),hash}
    }
    function classes(source,name,hash,prefix){const object=moduleClasses(source,name);for(const key of Object.keys(object))object[key]=object[key].replaceAll(hash+'_',prefix+'_');return JSON.stringify(object)}
    const frame=sheet(layout,'AppFrame','af'),left=sheet(sidebar,'SidebarRoot','sb'),panel=sheet(right,'SidebarRight','rb'),chat=sheet(conversation,'ConversationRoot','cr')
    const region=componentRegion
    const legacy=layout.includes('//#region')
    const constants=region(layout,legacy?'const SIDEBAR_AUTO_COLLAPSE':'const CENTER_MIN','function DocumentTitle(')
    const title=region(layout,'function DocumentTitle(','const css ='),shell=region(layout,'function CenterColumn(','function createLayoutStore(')
    const handoff=legacy?'':region(sidebar,'const GESTURE_GAP_MS','const css =')
    const root=handoff+region(sidebar,legacy?'function SidebarRoot(':'function officialEntry(','function PanelIcon(')
    const collapse=sidebar.match(/const COLLAPSE_SETTLE_MS = ([\d.e]+);/)[1],linger=sidebar.match(/const SCROLLBAR_LINGER_MS = ([\d.e]+);/)[1]
    const hasLeading=sidebar.includes('HeaderLeadingControls.module.css')
    const leadingCss=hasLeading?moduleCss(sidebar,'HeaderLeadingControls'):''
    const leadingCode=hasLeading?'const HeaderLeadingControls_module_css_default='+JSON.stringify(moduleClasses(sidebar,'HeaderLeadingControls'))+';\n'+region(sidebar,'function HeaderLeadingControls(','function r('):''
    // Keep the complete session-header region: current hosts define the More
    // menu and ViewTabLabel helpers before deriveAncestry in the same module.
    const conversationHeader=region(conversation,'function ConversationHeader(','const DEFAULT_VIEW_ID'),viewResolution=legacy?'':region(conversation,'const DEFAULT_VIEW_ID','const FIXED_VIEW_ID'),sessionHeader=viewResolution+region(conversation,conversation.includes('function ViewsMoreMenu(')?'function ViewsMoreMenu(':'function deriveAncestry(','function ConversationSession(')
    let rowsCss='',rowsCode=''
    if(workspaceRows){
      const workspace=entry('workspace'),raw=moduleCss(workspace,'Rows'),hash=raw.match(/\.([\w]+)_projectRow/)[1]
      rowsCss=raw.replaceAll(hash+'_','ws_')
      rowsCode=`const Rows_module_css_default=${classes(workspace,'Rows',hash,'ws')};${region(workspace,'const DRAG_PREVIEW_PROPERTIES','function distinguishingPathSuffixes(')}`
    }
    return{css:frame.css+left.css+panel.css+chat.css+leadingCss+rowsCss,code:`window.FIXED_VIEW_ID="chat";const AppFrame_module_css_default=${classes(layout,'AppFrame',frame.hash,'af')},SidebarRoot_module_css_default=${classes(sidebar,'SidebarRoot',left.hash,'sb')},ConversationRoot_module_css_default=${classes(conversation,'ConversationRoot',chat.hash,'cr')},COLLAPSE_SETTLE_MS=${collapse},SCROLLBAR_LINGER_MS=${linger};${constants}\n${title}\n${shell}\n${root}\n${leadingCode}\n${conversationHeader}\n${sessionHeader}\n${rowsCode}`}
  }finally{closeSync(fd)}
}
