import {motion} from './motion.js'
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
const choices=[['default','默认'],['qq','QQ 蓝'],['cream','奶油便签'],['glass','透明玻璃'],['palette','自定义配色'],['custom','自定义 CSS']]
const palettes={light:{background:'#eeeeee',color:'#242424',border:'#dedede'},dark:{background:'#292929',color:'#eeeeee',border:'#454545'}}
const normalizeTheme=(value,legacy,theme)=>({
  style:choices.some(([key])=>key===value?.style)?value.style:legacy.userBubbleStyle,
  css:typeof value?.css==='string'?value.css.slice(0,LIMIT):legacy.userBubbleCss,
  ...Object.fromEntries(Object.entries(palettes[theme]).map(([key,fallback])=>[key,/^#[\da-f]{6}$/i.test(value?.[key])?value[key].toLowerCase():fallback])),
})
export function normalizeUserBubbles(value){
  const legacy={userBubbleStyle:choices.some(([key])=>key===value?.userBubbleStyle)?value.userBubbleStyle:'default',userBubbleCss:typeof value?.userBubbleCss==='string'?value.userBubbleCss.slice(0,LIMIT):''}
  return{...legacy,userBubbleThemes:Object.fromEntries(['light','dark'].map(theme=>[theme,normalizeTheme(value?.userBubbleThemes?.[theme],legacy,theme)]))}
}
const cssFor=value=>value.style==='custom'?value.css:value.style==='palette'?`.bubble { background:${value.background}; color:${value.color}; border:1px solid ${value.border}; border-radius:18px 18px 6px 18px; padding:12px 18px; }`:userBubbleExamples[value.style]||''

// Browser parsing handles declarations and nested media. Every selector must
// start at the bubble, so drafts cannot target the rest of the conversation.
export function compileUserBubbleCss(win,source,scope=NATIVE,theme=null){
  if(!source.trim())return{css:'',error:''}
  try{
    if(source.length>LIMIT)throw Error('CSS 最多 12000 个字符。')
    const clean=source.replace(/\/\*[\s\S]*?\*\//g,'')
    if(/\\|\b(?:url|image-set|src)\s*\(|@import\b/i.test(clean))throw Error('不支持外部资源、@import 或转义写法；请使用颜色、渐变和阴影。')
    const sheet=new win.CSSStyleSheet();sheet.replaceSync(source)
    if(!sheet.cssRules.length)throw Error('未识别到有效规则，请使用 .bubble { … }。')
    const names=new Map()
    const collect=rules=>{for(const rule of rules){if(rule.type===7){if(!/^[a-z][\w-]*$/i.test(rule.name))throw Error('动画名称请使用英文字母、数字和短横线。');names.set(rule.name,`dcb-user-bubble-${scope===PREVIEW?'preview':'live'}-${theme?theme+'-':''}${rule.name}`)}else if(rule.type===4||rule.type===12)collect(rule.cssRules)}}
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
        const root=theme?(scope===PREVIEW?(dark&&theme==='light'?':not(*) ':''):`body${theme==='dark'?'[data-ds-dark-theme]':`:not([data-ds-dark-theme])${dark?'[data-ds-dark-theme]':''}`} `):dark?'body[data-ds-dark-theme] ':''
        return `${root}${scope}${item.slice(7)}`
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

const variables=`--bubble-ink:#263349;--bubble-cream:#fff3d6;--bubble-rim:#d8bd8399;--bubble-shadow:#bfa67733;--bubble-glass:transparent;`
const darkVariables=`--bubble-ink:#f2f4f9;--bubble-cream:#433b2b;--bubble-rim:#e9d4a344;--bubble-shadow:#0004;--bubble-glass:transparent;`
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
    const options=normalizeUserBubbles(value),next=JSON.stringify(options.userBubbleThemes)
    if(next===key)return
    key=next
    style.textContent=['light','dark'].map(theme=>{
      const compiled=compileUserBubbleCss(win,cssFor(options.userBubbleThemes[theme]),NATIVE,theme)
      if(!compiled.css)return ''
      const scope=`body${theme==='dark'?'[data-ds-dark-theme]':':not([data-ds-dark-theme])'} ${NATIVE}`
      return `${scope}{position:relative;overflow-wrap:anywhere;${theme==='dark'?darkVariables:variables}}`+compiled.css+guards(scope)
    }).join('')
  }
  setOptions(initial)
  return{setOptions,dispose(){disposed=true;style.remove()}}
}

export const userBubbleSettingsCss=`
 .dcb-bubble-settings{margin:20px 0;padding-top:20px;border-top:1px solid #8883;}
 .dcb-bubble-settings h3{font-size:14px;margin:0 0 6px;}
 .dcb-bubble-settings p{font-size:12px;line-height:1.7;color:var(--dsh-settings-secondary);}
 .dcb-bubble-options{display:flex;flex-wrap:wrap;gap:8px;}
 .dcb-bubble-options button,.dcb-bubble-buttons button,.dcb-bubble-themes button{font:inherit;font-size:12px;min-height:44px;padding:8px 12px;border:1px solid var(--dsh-settings-border,#8884);border-radius:9px;background:var(--dsh-settings-subtle);color:inherit;cursor:pointer;transition:background-color ${motion.time.quick}ms ${motion.ease.color},border-color ${motion.time.quick}ms ${motion.ease.color};}
 .dcb-bubble-options [aria-checked=true]{border-color:var(--dsh-settings-accent);background:var(--dsh-settings-surface);color:var(--dsh-settings-accent);}
 .dcb-bubble-options button:focus-visible,.dcb-bubble-buttons button:focus-visible{outline:2px solid currentColor;outline-offset:2px;}
 .dcb-bubble-demo{display:flex;justify-content:flex-end;padding:30px 20px;margin:14px 0;background:linear-gradient(135deg,#8eadd91c,#c7b8e226);border:1px solid #8882;border-radius:12px;}
 [data-dcb-user-preview]{width:fit-content;max-width:100%;background:var(--dsh-settings-subtle);padding:10px 16px;border-radius:16px;font-size:14px;line-height:1.7;white-space:pre-wrap;}
 .dcb-bubble-editor{display:block;width:100%;min-height:220px;resize:vertical;box-sizing:border-box;border:1px solid #8885;border-radius:10px;padding:12px;background:var(--dsh-settings-surface);color:inherit;font:12px/1.7 Consolas,monospace;tab-size:2;}
 .dcb-bubble-buttons{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;}
 .dcb-bubble-buttons button:disabled{opacity:.5;cursor:default;}
 .dcb-bubble-error{color:#b83f45!important;}
 .dcb-bubble-themes{display:flex;gap:4px;padding:4px;margin:14px 0;border:1px solid var(--dsh-settings-border);border-radius:12px;background:var(--dsh-settings-subtle);}
 .dcb-bubble-themes button{flex:1;border-color:transparent;background:transparent;}
 .dcb-bubble-themes [aria-selected=true]{background:var(--dsh-settings-surface);box-shadow:0 1px 4px #0001;color:var(--dsh-settings-accent);border-color:var(--dsh-settings-border);}
 .dcb-bubble-themes button:focus-visible{outline:2px solid var(--dsh-settings-accent);outline-offset:2px;}
 .dcb-bubble-demo[data-dcb-bubble-theme=light]{background:#f5f6f8;color:#242424;color-scheme:light;}
 .dcb-bubble-demo[data-dcb-bubble-theme=dark]{background:#181a1f;color:#eee;color-scheme:dark;}
 .dcb-bubble-demo[data-dcb-bubble-theme=light] ${PREVIEW}{${variables}}
 .dcb-bubble-demo[data-dcb-bubble-theme=dark] ${PREVIEW}{${darkVariables}}
 :where(.dcb-bubble-demo[data-dcb-bubble-theme=light]) ${PREVIEW}{background:#eee;}
 :where(.dcb-bubble-demo[data-dcb-bubble-theme=dark]) ${PREVIEW}{background:#292929;}
 .dcb-bubble-palette{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0;}
 .dcb-bubble-palette label{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;min-height:52px;padding:8px 10px;border:1px solid var(--dsh-settings-border);border-radius:10px;background:var(--dsh-settings-subtle);font-size:13px;}
 .dcb-bubble-palette input{width:44px;height:36px;flex:none;padding:3px;border:1px solid var(--dsh-settings-border);border-radius:8px;background:var(--dsh-settings-surface);cursor:pointer;}
 .dcb-bubble-palette input:focus-visible{outline:2px solid var(--dsh-settings-accent);outline-offset:2px;}
 @media(max-width:520px){.dcb-bubble-palette{grid-template-columns:1fr;}.dcb-bubble-demo{padding:24px 14px;}}
 @media(prefers-reduced-motion:reduce){.dcb-bubble-options button,.dcb-bubble-buttons button,.dcb-bubble-themes button{transition:none;}}
 @media(forced-colors:active){.dcb-bubble-themes [aria-selected=true],.dcb-bubble-options [aria-checked=true]{color:Highlight;border-color:Highlight;box-shadow:none;}.dcb-bubble-demo[data-dcb-bubble-theme]{background:Canvas;color:CanvasText;}}
 ${surfaceBase(PREVIEW)}
`

export function createUserBubbleSettings(React,win){
  const h=React.createElement
  return function UserBubbleSettings({value,onChange}){
    const options=normalizeUserBubbles(value),themes=options.userBubbleThemes
    const [theme,setTheme]=React.useState(()=>win.document.body.hasAttribute('data-ds-dark-theme')?'dark':'light')
    const [drafts,setDrafts]=React.useState(()=>({light:themes.light.css,dark:themes.dark.css})),[saved,setSaved]=React.useState(false)
    React.useEffect(()=>{setDrafts(previous=>({...previous,light:themes.light.css}));setSaved(false)},[themes.light.css])
    React.useEffect(()=>{setDrafts(previous=>({...previous,dark:themes.dark.css}));setSaved(false)},[themes.dark.css])
    const current=themes[theme],draft=drafts[theme],custom=current.style==='custom',source=custom?draft:cssFor(current),label=theme==='light'?'浅色':'深色'
    const result=React.useMemo(()=>compileUserBubbleCss(win,source,PREVIEW,theme),[source,theme])
    const update=patch=>onChange({userBubbleThemes:{...themes,[theme]:{...current,...patch}}})
    const choose=style=>{setSaved(false);update({style})}
    const edit=text=>{setDrafts(previous=>({...previous,[theme]:text}));setSaved(false)}
    const id=React.useId()
    return h('div',{className:'dcb-bubble-settings'},h('h3',null,'用户消息气泡'),h('p',null,'浅色与深色主题分别保存气泡样式、配色和 CSS，切换宿主主题自动应用。原有气泡配置会保留到两种主题。'),
      h('div',{className:'dcb-bubble-themes',role:'tablist','aria-label':'气泡主题'},[['light','浅色主题'],['dark','深色主题']].map(([key,text],index)=>h('button',{key,id:`${id}-${key}`,type:'button',role:'tab','aria-selected':theme===key,'aria-controls':`${id}-panel`,tabIndex:theme===key?0:-1,onClick:()=>{setTheme(key);setSaved(false)},onKeyDown:event=>{
        let next;if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(event.key))next=1-index;else if(event.key==='Home')next=0;else if(event.key==='End')next=1;else return
        event.preventDefault();event.currentTarget.parentElement.children[next].focus();setTheme(next?'dark':'light');setSaved(false)
      }},text))),
      h('div',{id:`${id}-panel`,role:'tabpanel','aria-labelledby':`${id}-${theme}`},
      h('div',{className:'dcb-bubble-options',role:'radiogroup','aria-label':'用户消息气泡样式'},choices.map(([key,label],index)=>h('button',{key,type:'button',role:'radio','aria-label':`气泡：${label}`,'aria-checked':current.style===key,tabIndex:current.style===key?0:-1,onClick:()=>choose(key),onKeyDown:event=>{
        let next;if(['ArrowRight','ArrowDown'].includes(event.key))next=(index+1)%choices.length;else if(['ArrowLeft','ArrowUp'].includes(event.key))next=(index+choices.length-1)%choices.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=choices.length-1;else return
        event.preventDefault();event.currentTarget.parentElement.children[next].focus();choose(choices[next][0])
      }},label))),
      current.style==='palette'&&h('div',{className:'dcb-bubble-palette'},[['background','背景'],['color','文字'],['border','边框']].map(([key,text])=>h('label',{key},text,h('input',{type:'color',value:current[key],'aria-label':`${label}气泡${text}颜色`,onChange:event=>update({[key]:event.target.value})})))),
      h('div',{className:'dcb-bubble-demo','data-dcb-bubble-theme':theme},h('style',null,result.css+guards(PREVIEW)),h('div',{'data-dcb-user-preview':'','aria-label':`${label}用户消息气泡预览`},'把今天的灵感，装进一个小气泡。\n这是一条较长的消息，也会自然换行。')),
      current.style==='glass'&&h('p',null,'透明玻璃会增加背景模糊开销；其余内置例子使用静态颜色、渐变和阴影。'),
      custom&&h(React.Fragment,null,h('p',null,`正在编辑${label}主题。用 .bubble 设置气泡；支持悬停、伪元素、@media 和 @keyframes，无需另写主题选择器。不加载外部资源，最多 12000 字符。保存后应用到聊天。`),
        h('div',{className:'dcb-bubble-buttons'},[['qq','QQ 示例'],['cream','便签示例'],['glass','玻璃示例']].map(([key,label])=>h('button',{type:'button',key,onClick:()=>edit(userBubbleExamples[key])},`载入 ${label}`))),
        h('textarea',{className:'dcb-bubble-editor','aria-label':'用户气泡自定义 CSS',value:draft,maxLength:LIMIT,spellCheck:false,onChange:event=>edit(event.target.value),placeholder:'.bubble {\n  background: #4488ee;\n  color: white;\n  border-radius: 20px 20px 6px 20px;\n}'}),
        h('p',{role:'status',className:result.error?'dcb-bubble-error':undefined},result.error|| (saved?`已保存并应用到${label}主题气泡。`:draft===current.css?'当前 CSS 已保存。':'预览已更新，保存后应用。')),
        h('div',{className:'dcb-bubble-buttons'},h('button',{type:'button',disabled:!!result.error,onClick:()=>{update({css:draft});setSaved(true)}},'保存气泡 CSS'),h('button',{type:'button',onClick:()=>edit(current.css)},'还原已保存 CSS')))))
  }
}
