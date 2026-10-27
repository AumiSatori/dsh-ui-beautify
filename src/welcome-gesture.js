export const welcomeGestureCss=`
  .dcb-gesture { --gesture-bg:var(--dsh-welcome-background,#fafbfc); --gesture-ink:var(--dsh-welcome-foreground,#202124); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; width:100%; min-height:100%; padding:24px; box-sizing:border-box; background:var(--gesture-bg); color:var(--gesture-ink); font:14px/1.6 system-ui,sans-serif; animation:dcb-gesture-arrive 260ms cubic-bezier(.22,.8,.26,1) both; }
  .dcb-gesture h2 { font-size:clamp(19px,3vw,28px); font-weight:600; margin:0; letter-spacing:.04em; }
  .dcb-gesture p { margin:0; text-align:center; min-height:23px; opacity:.65; }
  .dcb-gesture svg { display:block; width:min(300px,70vw,46vh); height:auto; flex:none; overflow:visible; touch-action:none; user-select:none; }
  .dcb-gesture line,.dcb-gesture polyline { fill:none; stroke:currentColor; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; pointer-events:none; }
  .dcb-gesture .gesture-tail { opacity:.35; }
  .dcb-gesture circle { fill:var(--gesture-bg); stroke:currentColor; stroke-opacity:.25; stroke-width:2; transition:r 180ms ease,stroke-opacity 180ms ease,fill 180ms ease; }
  .dcb-gesture [data-selected=true] circle { fill:var(--gesture-ink); stroke-opacity:1; }
  .dcb-gesture text { fill:currentColor; font:12px system-ui; text-anchor:middle; dominant-baseline:central; pointer-events:none; }
  .dcb-gesture [data-selected=true] text { fill:var(--gesture-bg); }
  .dcb-gesture [role=button] { cursor:crosshair; outline:none; }
  .dcb-gesture [role=button]:focus-visible circle { stroke-width:4; stroke-opacity:1; r:24; }
  .dcb-gesture-actions { display:flex; justify-content:center; gap:10px; }
  .dcb-gesture button { padding:7px 14px; min-height:36px; border:1px solid #8885; border-radius:9px; background:transparent; color:inherit; font:inherit; cursor:pointer; transition:background-color 180ms ease,transform 220ms ease; }
  .dcb-gesture button:hover { background:#8881; }
  .dcb-gesture button:active { transform:scale(.94); }
  .dcb-gesture button:focus-visible { outline:2px solid currentColor; outline-offset:3px; }
  .dcb-gesture[data-state=error] svg { animation:dcb-gesture-shake 260ms ease; }
  .dcb-gesture[data-state=success] svg { animation:dcb-gesture-success 300ms ease both; }
  @keyframes dcb-gesture-shake { 25%{transform:translateX(-8px)}75%{transform:translateX(8px)} }
  @keyframes dcb-gesture-success { to{opacity:.25;transform:scale(.9);filter:blur(2px)} }
  @keyframes dcb-gesture-arrive { from{opacity:0;transform:translateY(10px);filter:blur(2px)}to{opacity:1;transform:none;filter:blur(0)} }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { .dcb-gesture,.dcb-gesture *, .dcb-gesture button { animation:none!important;transition:none!important; } }
  body[data-ds-dark-theme] .dcb-gesture,[data-theme=dark] .dcb-gesture { --gesture-bg:var(--dsh-welcome-background,#1b1b1d); --gesture-ink:var(--dsh-welcome-foreground,#ededf0); }
`

// Shared by the settings recorder and its isolated HTML template. Keep this
// function self-contained: the template serializes it without host privileges.
export function mountWelcomeGesture(doc,win,{pattern=[],setup=false,onPattern=()=>{},onComplete=()=>{}}={}){
  const NS='http://www.w3.org/2000/svg',node=doc.createElement('section'),points=Array.from({length:9},(_,i)=>({x:70+i%3*80,y:70+Math.floor(i/3)*80}))
  node.className='dcb-gesture';node.dataset.state='idle'
  const title=doc.createElement('h2'),status=doc.createElement('p'),svg=doc.createElementNS(NS,'svg'),line=doc.createElementNS(NS,'polyline'),tail=doc.createElementNS(NS,'line')
  title.textContent=setup?'设置手势图案':'绘制手势进入';status.setAttribute('role','status');status.setAttribute('aria-live','polite')
  svg.setAttribute('viewBox','0 0 300 300');svg.setAttribute('aria-label','九宫格手势');tail.setAttribute('class','gesture-tail');tail.setAttribute('visibility','hidden');svg.append(line,tail)
  const dots=points.map(({x,y},i)=>{const g=doc.createElementNS(NS,'g'),c=doc.createElementNS(NS,'circle'),t=doc.createElementNS(NS,'text');g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label',`手势点 ${i+1}`);g.dataset.point=i;c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r','21');t.setAttribute('x',x);t.setAttribute('y',y);t.textContent=i+1;g.append(c,t);svg.append(g);return g})
  const actions=doc.createElement('div'),reset=doc.createElement('button'),confirm=doc.createElement('button');actions.className='dcb-gesture-actions';reset.type=confirm.type='button';reset.textContent='重新绘制';confirm.textContent='确认图案';actions.append(reset,confirm);node.append(title,status,svg,actions)
  let route=[],first=null,drag=null,last=null,disposed=false,locked=false,timer=0;const listeners=[]
  const on=(el,type,fn,opts)=>{el.addEventListener(type,fn,opts);listeners.push(()=>el.removeEventListener(type,fn,opts))}
  const hint=()=>setup?(first?'请再画一次确认':'连接至少 4 个点，设置图案'):'连接已设置的图案；也可用键盘选择数字点'
  const paint=()=>{line.setAttribute('points',route.map(i=>`${points[i].x},${points[i].y}`).join(' '));dots.forEach((g,i)=>{g.dataset.selected=String(route.includes(i));g.setAttribute('aria-pressed',String(route.includes(i)))})}
  const clear=()=>{win.clearTimeout(timer);timer=0;route=[];last=null;drag=null;locked=false;node.dataset.state='idle';tail.setAttribute('visibility','hidden');status.textContent=hint();paint()}
  function add(i){if(route.includes(i))return;const prev=route.at(-1);if(prev!==undefined){const a=points[prev],b=points[i],m=points.findIndex(p=>p.x===(a.x+b.x)/2&&p.y===(a.y+b.y)/2);if(m>=0&&!route.includes(m))route.push(m)}route.push(i);paint()}
  const error=message=>{locked=true;node.dataset.state='error';status.textContent=message;timer=win.setTimeout(clear,650)}
  const commit=()=>{
    if(disposed||locked)return;tail.setAttribute('visibility','hidden');drag=null
    if(route.length<4){error('至少连接 4 个点，请重试');return}
    if(setup&&!first){first=[...route];clear();return}
    const expected=setup?first:pattern
    if(route.join(',')!==expected.join(',')){error(setup?'两次图案不一致，请重画确认':'图案不匹配，请重试');return}
    locked=true;node.dataset.state='success';status.textContent=setup?'图案已确认':'手势正确，正在进入…';const value=[...route]
    timer=win.setTimeout(()=>{if(!disposed){if(setup)onPattern(value);else onComplete()}},300)
  }
  const xy=event=>{const r=svg.getBoundingClientRect();return{x:(event.clientX-r.left)*300/r.width,y:(event.clientY-r.top)*300/r.height}}
  const segment=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;points.map((p,i)=>{const t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return{i,t,d:Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t)}}).filter(v=>v.d<=22).sort((a,b)=>a.t-b.t).forEach(v=>add(v.i))}
  on(svg,'pointerdown',e=>{if(locked||e.button!==0||drag!==null)return;e.preventDefault();clear();drag=e.pointerId;last=xy(e);segment(last,last);svg.setPointerCapture(e.pointerId)})
  on(svg,'pointermove',e=>{if(drag!==e.pointerId||locked)return;const p=xy(e);segment(last,p);last=p;const i=route.at(-1);if(i!==undefined){tail.setAttribute('x1',points[i].x);tail.setAttribute('y1',points[i].y);tail.setAttribute('x2',p.x);tail.setAttribute('y2',p.y);tail.setAttribute('visibility','visible')}})
  on(svg,'pointerup',e=>{if(drag!==e.pointerId)return;const p=xy(e);segment(last,p);drag=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);commit()})
  on(svg,'pointercancel',()=>clear());on(svg,'lostpointercapture',()=>{if(drag!==null)clear()})
  on(svg,'keydown',e=>{if(locked)return;const i=Number(e.target.closest('[data-point]')?.dataset.point);if(['Enter',' '].includes(e.key)&&Number.isInteger(i)){e.preventDefault();add(i)}else if(e.key==='Backspace'){e.preventDefault();route.pop();paint()}else if(e.key==='Escape')clear()})
  on(reset,'click',()=>{first=null;clear()});on(confirm,'click',commit);on(win,'blur',()=>{if(!locked)clear()});clear()
  return{node,dispose(){disposed=true;win.clearTimeout(timer);for(const off of listeners)off();node.remove()}}
}

export function welcomeGestureDocument(pattern){
  return `<style>${welcomeGestureCss}</style><script>addEventListener('DOMContentLoaded',()=>{const gesture=(${mountWelcomeGesture.toString()})(document,window,{pattern:${JSON.stringify(pattern)},onComplete:()=>window.dshWelcomeDone()});document.body.append(gesture.node)})</script>`
}
