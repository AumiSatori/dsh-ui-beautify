import {compileScopedCss} from './scoped-css.js'
import {runningLabelLines} from './running-animation-config.js'

export const runningCssExamples={
  text:`/* 文案中的 {time} 会跟随宿主用时更新。 */
.thinking {
  --thinking-text: "正在认真思考… {time}";
}
.thinking .label {
  letter-spacing: .04em;
}`,
  random:`/* 多条文案使用 JSON 数组，false 固定显示第一条。 */
.thinking {
  --thinking-text: ["正在整理思路…", "再想一下…", "正在核对细节…"];
  --thinking-random: true;
}`,
}

export function compileRunningCss(win,source,preview=false){
  const scope=preview?'[data-dcb-running-preview]':'[data-dcb-running-content]'
  const result=compileScopedCss(win,source,{root:'.thinking',scope,namespace:'dcb-thinking',preview,stringEscapes:true,aliases:{icon:'[data-dcb-running-icon]',label:'[data-dcb-running-label]'}})
  const guards=`@media(prefers-reduced-motion:reduce){${scope}${scope},${scope}${scope} *,${scope}${scope}::before,${scope}${scope}::after{animation:none!important;transition:none!important;}}
    @media(forced-colors:active){${scope},${scope} [data-dcb-running-label]{color:CanvasText!important;-webkit-text-fill-color:CanvasText!important;background-image:none!important;}}`
  return {...result,css:result.css?result.css+'\n'+guards:''}
}

export function runningCssLabels(win,node){
  const style=win.getComputedStyle(node)
  try{
    const value=JSON.parse(style.getPropertyValue('--thinking-text'))
    const lines=typeof value==='string'?[value]:Array.isArray(value)?value.filter(item=>typeof item==='string'):[]
    return {labels:runningLabelLines(lines.join('\n')),random:style.getPropertyValue('--thinking-random').trim()!=='false'}
  }catch{return {labels:[],random:true}}
}
