import {motion} from './motion.js'

const REST='M 9 0 C 32 0 68 0 91 0 C 96 0 100 4 100 9 C 100 13 100 19 100 23 C 100 28 96 32 91 32 C 68 32 32 32 9 32 C 4 32 0 28 0 23 C 0 19 0 13 0 9 C 0 4 4 0 9 0 Z'
const RIGHT='M 9 6 C 30 8 58 13 74 3 C 84 -2 100 0 100 9 C 100 13 100 19 100 23 C 100 32 84 34 74 29 C 58 19 30 24 9 26 C 4 27 0 25 0 21 C 0 18 0 14 0 11 C 0 7 4 5 9 6 Z'
const LEFT='M 26 3 C 42 13 70 8 91 6 C 96 5 100 7 100 11 C 100 14 100 18 100 21 C 100 25 96 27 91 26 C 70 24 42 19 26 29 C 16 34 0 32 0 23 C 0 19 0 13 0 9 C 0 0 16 -2 26 3 Z'
const pathValue=value=>`path("${value}")`

export const scopeSwitchCss=`
  .dcb-scope-switch {
    --dcb-scope-track: #fff; --dcb-scope-fill: #111; --dcb-scope-ink: #111; --dcb-scope-border: #dedede;
    box-sizing: border-box; position: relative; isolation: isolate; overflow: hidden;
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; padding: 4px;
    margin-bottom: 8px; border: 1px solid var(--dcb-scope-border); border-radius: 12px;
    background: var(--dcb-scope-track); color: var(--dcb-scope-ink);
  }
  body[data-ds-dark-theme] .dcb-scope-switch {
    --dcb-scope-track: #111; --dcb-scope-fill: #fff; --dcb-scope-ink: #fff; --dcb-scope-border: #454545;
  }
  .dcb-scope-indicator {
    position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 12px) / 2);
    z-index: 0; pointer-events: none; transform: translateX(0);
  }
  [data-scope="all"] > .dcb-scope-indicator { transform: translateX(calc(100% + 4px)); }
  .dcb-scope-indicator svg { display: block; width: 100%; height: 100%; overflow: visible; fill: var(--dcb-scope-fill); }
  .dcb-scope-switch[data-moving] > .dcb-scope-indicator { will-change: transform, width; }
  .dcb-scope-switch button {
    position: relative; min-width: 0; padding: 6px; border: 0; border-radius: 8px;
    background: transparent; color: inherit; font-size: 12px; line-height: 20px;
  }
  .dcb-scope-switch button[aria-pressed="true"] { font-weight: 600; }
  .dcb-scope-label { position: relative; z-index: 1; color: #fff; mix-blend-mode: difference; }
  .dcb-summary .dcb-scope-switch button:focus-visible { outline: 2px solid var(--dcb-scope-ink); outline-offset: -2px; }
  @media (forced-colors: active) {
    .dcb-scope-switch, body[data-ds-dark-theme] .dcb-scope-switch {
      --dcb-scope-track: Canvas; --dcb-scope-fill: Highlight; --dcb-scope-ink: CanvasText; --dcb-scope-border: ButtonText;
    }
    .dcb-scope-label { mix-blend-mode: normal; color: CanvasText; }
    .dcb-scope-switch button[aria-pressed="true"] .dcb-scope-label { color: HighlightText; }
  }
`

// Animate only this small control. Labels invert against the actual moving
// surface, so both choices remain readable without duplicate interactive text.
export function createScopeSwitch(React,doc,win){
  const h=React.createElement
  return function ScopeSwitch({value,onChange}){
    const root=React.useRef(null),controller=React.useRef(null)
    React.useLayoutEffect(()=>{
      const node=root.current,indicator=node.querySelector('.dcb-scope-indicator'),shape=node.querySelector('path')
      const quiet=win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
      let selected=null,geometry=null,animations=[],disposed=false
      function stop(){
        for(const animation of animations)animation.cancel()
        animations=[];node.removeAttribute('data-moving')
      }
      function select(next,animate=true,force=false){
        if(disposed)return
        const button=node.querySelector(`button[data-value="${next}"]`)
        if(!button)return
        const changed=selected!==null&&selected!==next
        selected=next
        const rect=node.getBoundingClientRect(),target=button.getBoundingClientRect(),base=win.getComputedStyle(node)
        const scale=rect.width/parseFloat(base.width)||1
        const x=(target.left-rect.left)/scale-parseFloat(base.borderLeftWidth)-4,width=target.width/scale
        if(!force&&geometry&&Math.abs(geometry.x-x)<.05&&Math.abs(geometry.width-width)<.05)return
        const style=win.getComputedStyle(indicator),from={transform:style.transform,width:style.width}
        const currentX=new win.DOMMatrix(style.transform).m41,currentWidth=parseFloat(style.width)
        const silhouette=win.getComputedStyle(shape).d||pathValue(REST)
        stop()
        const to={transform:`translateX(${x}px)`,width:`${width}px`}
        Object.assign(indicator.style,to);geometry={x,width}
        if(!animate||!changed||quiet.matches||doc.hidden||width<1||typeof indicator.animate!=='function')return
        try{
          const right=x+width/2>=currentX+currentWidth/2
          const stretchX=right?currentX+(x-currentX)*.06:x
          const stretchRight=right?x+width:currentX+currentWidth+(x+width-currentX-currentWidth)*.06
          const leading='cubic-bezier(.22,.8,.26,1)',trailing='cubic-bezier(.4,0,.2,1)'
          const options={duration:motion.time.standard,easing:'linear',fill:'both'}
          const position=indicator.animate([{...from,easing:leading},{transform:`translateX(${stretchX}px)`,width:`${Math.max(width,stretchRight-stretchX)}px`,offset:.46,easing:trailing},to],{...options,id:'dcb-scope-position'})
          animations.push(position)
          if(win.CSS?.supports?.('d',pathValue(REST)))animations.push(shape.animate([
            {d:silhouette,easing:leading},{d:pathValue(right?RIGHT:LEFT),offset:.46,easing:trailing},{d:pathValue(REST)},
          ],{...options,id:'dcb-scope-liquid'}))
          node.setAttribute('data-moving','')
          position.finished.then(()=>{if(animations.includes(position))stop()},()=>{if(animations.includes(position))stop()})
        }catch{stop()}
      }
      const resize=new win.ResizeObserver(()=>select(selected,false))
      resize.observe(node)
      for(const button of node.querySelectorAll('button'))resize.observe(button)
      const settle=()=>select(selected,false,true)
      quiet.addEventListener('change',settle);doc.addEventListener('visibilitychange',settle)
      controller.current={select}
      return()=>{
        disposed=true;stop();resize.disconnect();controller.current=null
        quiet.removeEventListener('change',settle);doc.removeEventListener('visibilitychange',settle)
      }
    },[])
    React.useLayoutEffect(()=>{controller.current?.select(value)},[value])
    return h('div',{className:'dcb-scope-switch',ref:root,role:'group','aria-label':'查看范围','data-scope':value},
      h('span',{className:'dcb-scope-indicator','aria-hidden':true},h('svg',{viewBox:'0 0 100 32',preserveAspectRatio:'none',focusable:'false'},h('path',{d:REST}))),
      [['turn','当前轮次'],['all','全部轮次']].map(([scope,label])=>h('button',{type:'button',key:scope,'data-value':scope,'aria-pressed':value===scope,onClick:()=>onChange(scope)},h('span',{className:'dcb-scope-label'},label))))
  }
}
