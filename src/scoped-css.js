export function compileScopedCss(win,source,{root,scope,namespace,theme=null,preview=false,aliases={},stringEscapes=false}){
  if(!source.trim())return{css:'',error:''}
  try{
    if(source.length>12000)throw Error('CSS 最多 12000 个字符。')
    const uncommented=source.replace(/\/\*[\s\S]*?\*\//g,'')
    const clean=stringEscapes?uncommented.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,'""'):uncommented
    if(/\\|\b(?:url|image-set|src)\s*\(|@import\b/i.test(clean))throw Error('不支持外部资源、@import 或转义写法；请使用颜色、渐变和阴影。')
    const sheet=new win.CSSStyleSheet();sheet.replaceSync(source)
    if(!sheet.cssRules.length)throw Error(`未识别到有效规则，请使用 ${root} { … }。`)
    const names=new Map()
    const collect=rules=>{for(const rule of rules){if(rule.type===7){if(!/^[a-z][\w-]*$/i.test(rule.name))throw Error('动画名称请使用英文字母、数字和短横线。');names.set(rule.name,`${namespace}-${preview?'preview':'live'}-${theme?theme+'-':''}${rule.name}`)}else if(rule.type===4||rule.type===12)collect(rule.cssRules)}}
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
        if(!item.startsWith(root)||!/^(?:$|[\s:.\[>#])/.test(item.slice(root.length))||/[+~]/.test(item))throw Error(`选择器须从 ${root} 开始；深色用 .dark ${root}，不支持相邻兄弟选择器。`)
        for(const [name,target]of Object.entries(aliases))item=item.replace(new RegExp('\\.'+name+'\\b','g'),target)
        const prefix=theme?(preview?(dark&&theme==='light'?':not(*) ':''):`body${theme==='dark'?'[data-ds-dark-theme]':`:not([data-ds-dark-theme])${dark?'[data-ds-dark-theme]':''}`} `):dark?'body[data-ds-dark-theme] ':''
        return `${prefix}${scope}${item.slice(root.length)}`
      }).join(',')
    }
    const render=rules=>Array.from(rules,rule=>{
      if(rule.type===1){if(rule.cssRules?.length)throw Error(`请将嵌套规则展开为 ${root} 选择器。`);return `${selector(rule.selectorText)}{${declarations(rule.style)}}`}
      if(rule.type===4||rule.type===12)return `${rule.type===4?'@media':'@supports'} ${rule.conditionText}{${render(rule.cssRules)}}`
      if(rule.type===7)return `@keyframes ${names.get(rule.name)}{${Array.from(rule.cssRules,frame=>`${frame.keyText}{${declarations(frame.style)}}`).join('')}}`
      throw Error('仅支持样式规则、@media、@supports 和 @keyframes。')
    }).join('\n')
    return{css:render(sheet.cssRules),error:''}
  }catch(error){return{css:'',error:error.message||'CSS 无法解析。'}}
}
