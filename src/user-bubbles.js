const NATIVE=':is([data-chat-flow-kind="user"],[data-chat-flow-kind="steering"],[data-submission-echo],[data-pending-steering]) :is([class$="_bubble"],[class*="_bubble "])'
const PREVIEW='[data-dcb-user-preview]'
const LIMIT=12000
export const userBubbleExamples={
  qq:`.bubble {
  background: linear-gradient(135deg, #2673d7, #3455cb);
  color: #fff;
  border: 1px solid #ffffff55;
  border-radius: 20px 20px 6px 20px;
  box-shadow: 0 5px 14px #2769bd24, inset 0 1px 0 #ffffff66;
  padding: 12px 18px;
}
.bubble::after {
  content: "";
  position: absolute;
  right: -5px;
  bottom: 8px;
  width: 10px;
  height: 10px;
  background: #3455cb;
  transform: rotate(45deg);
  border-radius: 2px;
}`,
  cream:`.bubble {
  background: var(--bubble-cream);
  color: var(--bubble-ink);
  border: 1px solid var(--bubble-rim);
  border-radius: 18px 18px 5px 18px;
  padding: 12px 18px;
  box-shadow: 3px 4px 0 var(--bubble-shadow);
}
.bubble::before {
  content: "";
  position: absolute;
  top: -4px;
  right: 18px;
  width: 30px;
  height: 8px;
  background: #d9b98288;
  transform: rotate(5deg);
}`,
  glass:`.bubble {
  background: var(--bubble-glass);
  color: var(--bubble-ink);
  border: 1px solid var(--bubble-rim);
  border-radius: 22px 22px 8px 22px;
  padding: 12px 18px;
  backdrop-filter: blur(10px) saturate(1.2);
  box-shadow: inset 0 1px 0 #ffffff66, 0 5px 18px #15213b12;
}`,
}
const choices=[['default','默认'],['qq','QQ 蓝'],['cream','奶油便签'],['glass','透明玻璃'],['custom','自定义 CSS']]
export function normalizeUserBubbles(value){
  return{userBubbleStyle:choices.some(([key])=>key===value?.userBubbleStyle)?value.userBubbleStyle:'default',userBubbleCss:typeof value?.userBubbleCss==='string'?value.userBubbleCss.slice(0,LIMIT):''}
}
const cssFor=value=>value.userBubbleStyle==='custom'?value.userBubbleCss:userBubbleExamples[value.userBubbleStyle]||''

// Browser parsing handles declarations and nested media. Every selector must
// start at the bubble, so drafts cannot target the rest of the conversation.
export function compileUserBubbleCss(win,source,scope=NATIVE){
  if(!source.trim())return{css:'',error:''}
  try{
    if(source.length>LIMIT)throw Error('CSS 最多 12000 个字符。')
    const clean=source.replace(/\/\*[\s\S]*?\*\//g,'')
    if(/\\|\b(?:url|image-set|src)\s*\(|@import\b/i.test(clean))throw Error('不支持外部资源、@import 或转义写法；请使用颜色、渐变和阴影。')
    const sheet=new win.CSSStyleSheet();sheet.replaceSync(source)
    if(!sheet.cssRules.length)throw Error('未识别到有效规则，请使用 .bubble { … }。')
    const names=new Map()
    const collect=rules=>{for(const rule of rules){if(rule.type===7){if(!/^[a-z][\w-]*$/i.test(rule.name))throw Error('动画名称请使用英文字母、数字和短横线。');names.set(rule.name,`dcb-user-bubble-${scope===PREVIEW?'preview':'live'}-${rule.name}`)}else if(rule.type===4||rule.type===12)collect(rule.cssRules)}}
    collect(sheet.cssRules)
    const declarations=original=>{
      // cssText preserves unresolved var() shorthands; their expanded longhand
      // values are intentionally empty until computed in the live document.
      const style=win.document.createElement('i').style;style.cssText=original.cssText
      for(const property of['animation','animation-name']){
        const value=style.getPropertyValue(property)
        if(value)style.setProperty(property,value.replace(/[\w-]+/g,name=>names.get(name)||name),style.getPropertyPriority(property))
      }
      return style.cssText
    }
    const selector=text=>{
      // Commas inside :is()/attribute values do not split a selector list.
      const parts=[];let depth=0,quote='',start=0
      for(let i=0;i<text.length;i++){const ch=text[i];if(quote){if(ch===quote)quote='';continue}if(ch==='"'||ch==="'"){quote=ch;continue}if(ch==='('||ch==='[')depth++;else if(ch===')'||ch===']')depth--;else if(ch===','&&!depth){parts.push(text.slice(start,i));start=i+1}}
      parts.push(text.slice(start))
      return parts.map(part=>{
        let item=part.trim(),dark=false
        if(item.startsWith('.dark ')){dark=true;item=item.slice(6).trim()}
        if(!/^\.bubble(?=$|[\s:.\[>#])/.test(item)||/[+~]/.test(item))throw Error('选择器须从 .bubble 开始；深色用 .dark .bubble，不支持相邻兄弟选择器。')
        return `${dark?'body[data-ds-dark-theme] ':''}${scope}${item.slice(7)}`
      }).join(',')
    }
    const render=rules=>Array.from(rules,rule=>{
      if(rule.type===1){if(rule.cssRules?.length)throw Error('请将嵌套规则展开为 .bubble 选择器。');return `${selector(rule.selectorText)}{${declarations(rule.style)}}`}
      if(rule.type===4||rule.type===12)return `${rule.type===4?'@media':'@supports'} ${rule.conditionText}{${render(rule.cssRules)}}`
      if(rule.type===7)return `@keyframes ${names.get(rule.name)}{${Array.from(rule.cssRules,frame=>`${frame.keyText}{${declarations(frame.style)}}`).join('')}}`
      throw Error('仅支持气泡规则、@media、@supports 和 @keyframes。')
    }).join('\n')
    return{css:render(sheet.cssRules),error:''}
  }catch(error){return{css:'',error:error.message||'CSS 无法解析。'}}
}

const variables=`--bubble-ink:#263349;--bubble-cream:#fff3d6;--bubble-rim:#d8bd8399;--bubble-shadow:#bfa67733;--bubble-glass:#f8fbffb8;`
const darkVariables=`--bubble-ink:#f2f4f9;--bubble-cream:#433b2b;--bubble-rim:#e9d4a344;--bubble-shadow:#0004;--bubble-glass:#353b48b8;`
const surfaceBase=scope=>`${scope}{position:relative;overflow-wrap:anywhere;${variables}}
body[data-ds-dark-theme] ${scope}{${darkVariables}}`
const guards=scope=>`@layer dcb-user-bubble-accessibility {
${scope}::before,${scope}::after{pointer-events:none!important;}
@media(prefers-reduced-motion:reduce){${scope},${scope}::before,${scope}::after{animation:none!important;transition:none!important;}}
@media(forced-colors:active){${scope}{background:Canvas!important;color:CanvasText!important;border:1px solid CanvasText!important;box-shadow:none!important;backdrop-filter:none!important;} ${scope}::before,${scope}::after{display:none!important;}}
}`

export function createUserBubbles(doc,win,initial){
  const style=doc.createElement('style');style.dataset.dcbUserBubbles='';doc.head.append(style)
  let key='',disposed=false
  const setOptions=value=>{
    if(disposed)return
    const options=normalizeUserBubbles(value),next=cssFor(options)
    if(next===key)return
    key=next
    const compiled=compileUserBubbleCss(win,next)
    style.textContent=compiled.css?surfaceBase(NATIVE)+compiled.css+guards(NATIVE):''
  }
  setOptions(initial)
  return{setOptions,dispose(){disposed=true;style.remove()}}
}

export const userBubbleSettingsCss=`
 .dcb-bubble-settings{margin:20px 0;padding-top:20px;border-top:1px solid #8883;}
 .dcb-bubble-settings h3{font-size:14px;margin:0 0 6px;}
 .dcb-bubble-settings p{font-size:12px;line-height:1.7;color:var(--dsh-settings-secondary);}
 .dcb-bubble-options{display:flex;flex-wrap:wrap;gap:8px;}
 .dcb-bubble-options button,.dcb-bubble-buttons button{font:inherit;font-size:12px;padding:8px 12px;border:1px solid #8884;border-radius:9px;background:var(--dsh-settings-subtle);color:inherit;cursor:pointer;}
 .dcb-bubble-options [aria-checked=true]{border-color:currentColor;background:var(--dsh-settings-surface);}
 .dcb-bubble-options button:focus-visible,.dcb-bubble-buttons button:focus-visible{outline:2px solid currentColor;outline-offset:2px;}
 .dcb-bubble-demo{display:flex;justify-content:flex-end;padding:30px 20px;margin:14px 0;background:linear-gradient(135deg,#8eadd91c,#c7b8e226);border:1px solid #8882;border-radius:12px;}
 [data-dcb-user-preview]{width:fit-content;max-width:100%;background:var(--dsh-settings-subtle);padding:10px 16px;border-radius:16px;font-size:14px;line-height:1.7;white-space:pre-wrap;}
 .dcb-bubble-editor{display:block;width:100%;min-height:220px;resize:vertical;box-sizing:border-box;border:1px solid #8885;border-radius:10px;padding:12px;background:var(--dsh-settings-surface);color:inherit;font:12px/1.7 Consolas,monospace;tab-size:2;}
 .dcb-bubble-buttons{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;}
 .dcb-bubble-buttons button:disabled{opacity:.5;cursor:default;}
 .dcb-bubble-error{color:#b83f45!important;}
 ${surfaceBase(PREVIEW)}
`

export function createUserBubbleSettings(React,win){
  const h=React.createElement
  return function UserBubbleSettings({value,onChange}){
    const [draft,setDraft]=React.useState(value.userBubbleCss),[saved,setSaved]=React.useState(false)
    React.useEffect(()=>{setDraft(value.userBubbleCss);setSaved(false)},[value.userBubbleCss])
    const custom=value.userBubbleStyle==='custom',source=custom?draft:cssFor(value)
    const result=React.useMemo(()=>compileUserBubbleCss(win,source,PREVIEW),[source])
    const choose=style=>{setSaved(false);onChange({userBubbleStyle:style})}
    return h('div',{className:'dcb-bubble-settings'},h('h3',null,'用户消息气泡'),h('p',null,'为发送后的提问选择 QQ 风格气泡，或编写自己的 CSS。只改变气泡外观，保留文字、附件、复制按钮和底部输入框。'),
      h('div',{className:'dcb-bubble-options',role:'radiogroup','aria-label':'用户消息气泡样式'},choices.map(([key,label],index)=>h('button',{key,type:'button',role:'radio','aria-label':`气泡：${label}`,'aria-checked':value.userBubbleStyle===key,tabIndex:value.userBubbleStyle===key?0:-1,onClick:()=>choose(key),onKeyDown:event=>{
        let next;if(['ArrowRight','ArrowDown'].includes(event.key))next=(index+1)%choices.length;else if(['ArrowLeft','ArrowUp'].includes(event.key))next=(index+choices.length-1)%choices.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=choices.length-1;else return
        event.preventDefault();event.currentTarget.parentElement.children[next].focus();choose(choices[next][0])
      }},label))),
      h('div',{className:'dcb-bubble-demo'},h('style',null,result.css+guards(PREVIEW)),h('div',{'data-dcb-user-preview':'','aria-label':'用户消息气泡预览'},'把今天的灵感，装进一个小气泡。\n这是一条较长的消息，也会自然换行。')),
      value.userBubbleStyle==='glass'&&h('p',null,'透明玻璃会增加背景模糊开销；其余内置例子使用静态颜色、渐变和阴影。'),
      custom&&h(React.Fragment,null,h('p',null,'用 .bubble 设置气泡；支持悬停、伪元素、@media 和 @keyframes。深色单独写 .dark .bubble。不加载外部资源，最多 12000 字符。编辑时仅更新这里的预览，保存后应用到聊天。'),
        h('div',{className:'dcb-bubble-buttons'},[['qq','QQ 示例'],['cream','便签示例'],['glass','玻璃示例']].map(([key,label])=>h('button',{type:'button',key,onClick:()=>{setDraft(userBubbleExamples[key]);setSaved(false)}},`载入 ${label}`))),
        h('textarea',{className:'dcb-bubble-editor','aria-label':'用户气泡自定义 CSS',value:draft,maxLength:LIMIT,spellCheck:false,onChange:event=>{setDraft(event.target.value);setSaved(false)},placeholder:'.bubble {\n  background: #4488ee;\n  color: white;\n  border-radius: 20px 20px 6px 20px;\n}'}),
        h('p',{role:'status',className:result.error?'dcb-bubble-error':undefined},result.error|| (saved?'已保存并应用到用户消息气泡。':draft===value.userBubbleCss?'当前 CSS 已保存。':'预览已更新，保存后应用。')),
        h('div',{className:'dcb-bubble-buttons'},h('button',{type:'button',disabled:!!result.error,onClick:()=>{onChange({userBubbleCss:draft});setSaved(true)}},'保存气泡 CSS'),h('button',{type:'button',onClick:()=>{setDraft(value.userBubbleCss);setSaved(false)}},'还原已保存 CSS'))))
  }
}
