export const messageMotionExample=JSON.stringify({
  user:{duration:280,easing:'cubic-bezier(.22,.8,.26,1)',frames:[{opacity:0,translate:'8px 18px',scale:'.99'},{opacity:1,translate:'0px 0px',scale:'1'}]},
  assistant:{duration:300,easing:'cubic-bezier(.22,.8,.26,1)',frames:[{opacity:0,translate:'-6px 16px',scale:'.99'},{opacity:1,translate:'0px 0px',scale:'1'}]},
  process:{duration:280,easing:'cubic-bezier(.22,.8,.26,1)',frames:[{opacity:0,translate:'0px 6px'},{opacity:1,translate:'0px 0px'}]},
},null,2)
const kinds=['user','assistant','process'],properties=new Set(['opacity','translate','scale','rotate','filter','transform','offset'])
export function parseMessageMotion(source,win){
  let value;try{value=JSON.parse(source)}catch{throw Error('格式有误，请检查 JSON 的引号、逗号和括号。')}
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('请输入包含 user、assistant、process 的对象。')
  const result={}
  for(const kind of kinds){
    const item=value[kind]
    if(!item||!Array.isArray(item.frames)||item.frames.length<2||item.frames.length>8)throw Error(`${kind} 需要 2–8 个动画帧。`)
    if(!Number.isFinite(item.duration)||item.duration<100||item.duration>3000)throw Error(`${kind} 的 duration 需要在 100–3000 毫秒之间。`)
    const easing=typeof item.easing==='string'?item.easing:'ease'
    if(!win.CSS.supports('animation-timing-function',easing))throw Error(`${kind} 的 easing 不受支持。`)
    const frames=item.frames.map(frame=>{
      if(!frame||typeof frame!=='object'||Array.isArray(frame))throw Error(`${kind} 动画帧格式无效。`)
      const out={};for(const [key,value]of Object.entries(frame)){
        if(!properties.has(key))throw Error(`不支持动画属性 ${key}。`)
        if(key==='offset'){if(typeof value!=='number'||value<0||value>1)throw Error('offset 必须在 0 到 1 之间。');out[key]=value;continue}
        if(key==='opacity'){const n=Number(value);if(!Number.isFinite(n)||n<0||n>1)throw Error('opacity 必须在 0 到 1 之间。');out[key]=n;continue}
        if(typeof value!=='string'&&typeof value!=='number'||!win.CSS.supports(key,String(value)))throw Error(`${kind} 的 ${key} 值无效。`)
        out[key]=String(value)
      }
      return out
    })
    if(frames.some((frame,i)=>frame.offset!==undefined&&frames.slice(0,i).some(previous=>previous.offset!==undefined&&previous.offset>frame.offset)))throw Error(`${kind} 的 offset 必须递增。`)
    try{new win.KeyframeEffect(null,frames,{duration:item.duration,easing})}catch{throw Error(`${kind} 的动画帧无法播放。`)}
    result[kind]={frames,options:{duration:item.duration,easing,id:`dcb-message-${kind}`}}
  }
  return result
}
export function normalizeMessageMotion(value){return{messageMotionMode:value?.messageMotionMode==='custom'?'custom':'default',messageMotionCode:typeof value?.messageMotionCode==='string'?value.messageMotionCode.slice(0,12000):''}}

export const messageMotionSettingsCss=`
 .dcb-message-custom { display:grid; gap:10px; margin:14px 0; padding:14px; border:1px solid var(--dsh-settings-border); border-radius:12px; background:var(--dsh-settings-subtle); }
 .dcb-message-custom-actions { display:flex; flex-wrap:wrap; gap:8px; }
 .dcb-message-custom button { padding:8px 12px; min-height:40px; border:1px solid var(--dsh-settings-border); border-radius:8px; color:var(--dsh-settings-text); background:var(--dsh-settings-surface); font:13px system-ui; cursor:pointer; transition:transform 200ms cubic-bezier(.22,.8,.26,1),border-color 180ms ease; }
 .dcb-message-custom button:hover { border-color:var(--dsh-settings-text); }
 .dcb-message-custom button:active { transform:scale(.96); }
 .dcb-message-custom button:focus-visible { outline:2px solid var(--dsh-settings-text); outline-offset:2px; }
 .dcb-message-custom textarea { box-sizing:border-box; width:100%; min-height:230px; resize:vertical; padding:10px; border:1px solid var(--dsh-settings-border); border-radius:8px; color:var(--dsh-settings-text); background:var(--dsh-settings-surface); font:12px/1.6 ui-monospace,Consolas,monospace; }
 .dcb-message-custom textarea:focus { outline:none; border-color:var(--dsh-settings-text); box-shadow:0 0 0 3px #8882; }
 .dcb-message-custom p { margin:0; font-size:12px; color:var(--dsh-settings-secondary); line-height:1.6; }
 .dcb-message-custom [role=alert] { color:#b43b4a; }
 @media(prefers-reduced-motion:reduce),(forced-colors:active){.dcb-message-custom button{transition:none}}
 @media(forced-colors:active){.dcb-message-custom,.dcb-message-custom button,.dcb-message-custom textarea{background:Canvas;color:CanvasText;border-color:CanvasText}}
`
export function createMessageMotionSettings(React,win){
  const h=React.createElement
  return function MessageMotionSettings({value,onChange}){
    const [draft,setDraft]=React.useState(value.messageMotionCode||''),[error,setError]=React.useState('')
    React.useEffect(()=>setDraft(value.messageMotionCode||''),[value.messageMotionCode])
    return h('div',{className:'dcb-message-custom'},
      h('strong',null,'自定义入场动效'),h('p',null,'分别设置自己发送、模型回复和思考／工具行的入场。示例是当前动效，可载入后修改；应用后同时用于聊天和预览。'),
      h('div',{className:'dcb-message-custom-actions'},h('button',{type:'button',onClick:()=>{setDraft(messageMotionExample);setError('')}},'载入当前动效示例'),h('button',{type:'button',onClick:()=>{try{parseMessageMotion(draft,win);onChange({messageMotionCode:draft,messageMotionMode:'custom'});setError('')}catch(e){setError(e.message)}}},'应用自定义动效'),h('button',{type:'button',onClick:()=>{onChange({messageMotionMode:'default'});setError('')}},'使用默认动效')),
      h('textarea',{'aria-label':'新消息入场动效代码',value:draft,spellCheck:false,maxLength:12000,onChange:event=>setDraft(event.target.value),placeholder:'点击“载入当前动效示例”开始编辑'}),
      h('p',null,`当前使用：${value.messageMotionMode==='custom'?'自定义动效':'默认动效'}。支持 opacity、translate、scale、rotate、transform 和 filter；duration 单位为毫秒。`),error&&h('p',{role:'alert'},error))
  }
}
