import assert from 'node:assert/strict'
import {openSync,readSync,closeSync,readFileSync} from 'node:fs'

// Borrow only host components/CSS for an isolated page; never the live chat.
export function nativeHeaderFixture(){
  if(!process.env.DSH_ASAR)return null
  const fd=openSync(process.env.DSH_ASAR,'r')
  try{
    const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
    const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
    let entry=JSON.parse(json)
    const path='dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js'
    for(const part of path.split('/'))entry=entry.files[part]
    let source
    if(entry.unpacked)source=readFileSync(process.env.DSH_ASAR+'.unpacked/'+path,'utf8')
    else{const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset));source=bytes.toString()}
    const at=source.indexOf('ConversationRoot.module.css')
    const sheet=source.slice(source.lastIndexOf('//#region',at),source.indexOf('//#endregion',at)).match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)
    assert.ok(sheet,'Installed header CSS must be discoverable')
    const css=JSON.parse(sheet[1]),prefix=css.match(/\.([\w-]+)_root\{/)[1]
    function component(name){
      const start=source.indexOf('function '+name+'(');assert.ok(start>=0,'Installed '+name+' must exist')
      const body=source.indexOf(') {',start)+2;assert.ok(body>start,'Installed '+name+' has a function body')
      let braces=0,quote='',comment='',escaped=false,begun=false
      for(let i=body;i<source.length;i++){
        const ch=source[i],next=source[i+1]
        if(comment==='line'){if(ch==='\n')comment='';continue}
        if(comment==='block'){if(ch==='*'&&next==='/'){comment='';i++}continue}
        if(quote){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch===quote)quote='';continue}
        if(ch==='/'&&next==='/'){comment='line';i++;continue}
        if(ch==='/'&&next==='*'){comment='block';i++;continue}
        if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
        if(ch==='{'){braces++;begun=true}else if(ch==='}'&&--braces===0&&begun)return source.slice(start,i+1)
      }
      throw Error('Unclosed native '+name)
    }
    return {css,contextOccupancy:component('contextOccupancy'),fixture:`
const react=React,react_jsx_runtime=jsxRuntime,clsx=(...values)=>values.filter(Boolean).join(' '),FIXED_VIEW_ID='chat';
const _deepseek_ai_dsh_client_ui_primitives={Tooltip:({children})=>children};
const ConversationRoot_module_css_default=new Proxy({},{get:(_,key)=>${JSON.stringify(prefix)}+'_'+key});
const conversationPhase=()=> 'active',deriveAncestry=()=>[{id:'a',displayTitle:'页头兼容测试'}],equalBreadcrumbs=()=>true;
${component('resolveActiveView')}
${component('ConversationHeader')}
${component('ConversationSessionHeader')}
window.mountNativeHeader=({missingSessionHook=false}={})=>{
  const PluginHeader=window.fixtureHeader,injected=window.fixtureHeaderSpec.inject('a'),activity=injected.hooks.taskActivity;
  window.fixtureHeader=null;window.fixture.refresh();
  document.querySelector('.frame').style.display='none';
  const seat=document.createElement('div');seat.dataset.nativeHeaderFixture='';seat.style.cssText='position:fixed;inset:0;display:flex;flex-direction:column;background:#fff';document.body.append(seat);
  const session={blank:false,running:false,openState:'open'},useSession=selector=>selector(session),views=[{id:'chat',label:'对话'},{id:'trace',label:'轨迹'},{id:'context',label:'上下文'}];
  const todos=[{content:'验证顶部入口',status:'completed'}];
  const props={...injected,sessionId:'a',useSession:missingSessionHook?undefined:useSession,useProjection:name=>name==='todos'?todos:[],useTaskActivity:selector=>React.useSyncExternalStore(activity.subscribe,()=>selector(activity.getSnapshot()))};
  const slots=name=>name==='conversation.session.header'?React.createElement(ConversationSessionHeader,{sessionId:'a',useSessions:selector=>selector({}),useConversationViews:selector=>selector(views),useStore:selector=>selector({view:'chat'}),useEntryPins:selector=>selector([]),useEntryActions:selector=>selector(false),renderSlot:slots,open(){},selectView(){},setPinned(){},t:key=>key}):name==='conversation.session.header.utilities'?React.createElement(PluginHeader,props):name==='conversation.session.header.actions'?React.createElement('button',null,'标准模式'):name==='conversation.session.header.corner'?React.createElement('button',{'aria-label':'右侧栏'},'▣'):null;
  const root=createRoot(seat);flushSync(()=>root.render(React.createElement(React.Fragment,null,React.createElement(ConversationHeader,{sessionId:'a',useSession,useConversation:selector=>selector({}),renderSlot:slots}),React.createElement('div',{'data-native-content':'',style:{flex:1,padding:'30px'}},'隔离测试正文'))));
  return()=>root.unmount();
};`}
  }finally{closeSync(fd)}
}
