import {motion} from './motion.js'

// The host owns run state. No tool-call scan, progress counting or extra status
// subscription is needed to label the entry. "成果" does not assert success.
export function summaryEntryState({running=false,completed=false}={}){
  if(running)return{kind:'running',label:'处理中',detail:'处理中'}
  return completed?{kind:'outputs',label:'查看成果',detail:'查看成果'}:{kind:'idle',label:'空闲',detail:'空闲'}
}

export const summaryEntryCss=`
  .dcb-entry-label { position:relative; display:inline-block; flex:none; min-width:4.5em; height:18px; overflow:hidden; vertical-align:middle; font-variant-numeric:tabular-nums; }
  .dcb-entry-label-text { display:inline-block; width:max-content; white-space:nowrap; vertical-align:top; }
  .dcb-entry-label-text { animation:dcb-entry-label-enter ${motion.time.control}ms ${motion.ease.smooth}; }
  @keyframes dcb-entry-label-enter { from { opacity:0; transform:translateY(6px); filter:blur(2px); } to { opacity:1; transform:none; filter:blur(0); } }
  .dcb-entry { transition:background-color ${motion.time.quick}ms ${motion.ease.color},color ${motion.time.quick}ms ${motion.ease.color}; }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { .dcb-entry { transition:none; } .dcb-entry-label-text { animation:none; } }
`


export function createSummaryEntryStatus(React){
  const h=React.createElement
  function Label({value}){
    return h('span',{className:'dcb-entry-label','data-status':value.kind,'aria-live':'polite','aria-atomic':true},h('span',{key:value.kind,className:'dcb-entry-label-text'},value.label))
  }
  return {Label,dispose(){}}
}
