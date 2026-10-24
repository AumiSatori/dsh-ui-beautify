// Opaque-origin frame: no parent DOM, storage, network, popups or navigation privileges.
export function htmlDocument(source){
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; connect-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}*{box-sizing:border-box}</style>${source}`
}
export const oceanHtml=`<canvas id="sea"></canvas>
<script>
// Change these values to customize the scene. No external libraries needed.
const speed=0.65, density=160;
const c=document.getElementById('sea'),g=c.getContext('2d');
let w=0,h=0,t=0,last=0,px=.75,py=.4;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,1.25);c.width=w*d;c.height=h*d;c.style.width=w+'px';c.style.height=h+'px';g.setTransform(d,0,0,d,0,0)}
addEventListener('resize',resize);new ResizeObserver(resize).observe(document.documentElement);resize();
addEventListener('message',e=>{if(e.source===parent&&e.data?.type==='dcb-background-pointer'){px=e.data.x;py=e.data.y}});
addEventListener('pointermove',e=>{px=e.clientX/w;py=e.clientY/h});
function draw(now){requestAnimationFrame(draw);if(now-last<33)return;const dt=Math.min((now-last)/1000,.1);last=now;if(!reduced.matches)t+=dt*speed;
g.globalCompositeOperation='source-over';
const bg=g.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#031323');bg.addColorStop(.5,'#030915');bg.addColorStop(1,'#082a40');g.fillStyle=bg;g.fillRect(0,0,w,h);
g.globalCompositeOperation='screen';
// Long translucent aurora ribbons, with layered crests.
for(let j=0;j<7;j++){g.beginPath();for(let x=0;x<=w+20;x+=20){const y=h*(.12+j*.012)+Math.sin(x/w*5+t*.3+j*.24)*h*.07+Math.sin(x/w*11-t*.2)*h*.02;x?g.lineTo(x,y):g.moveTo(x,y)}for(let x=w+20;x>=0;x-=20){const y=h*(.32+j*.018)+Math.sin(x/w*5+t*.3+j*.24)*h*.11;g.lineTo(x,y)}g.closePath();const a=g.createLinearGradient(0,0,0,h*.55);a.addColorStop(0,'#288cff00');a.addColorStop(.35,'#23d8d81a');a.addColorStop(1,'#5275ff00');g.fillStyle=a;g.fill()}
// Volumetric shafts of light from the surface.
for(let i=0;i<9;i++){const x=w*(i/8+.045*Math.sin(t*.2+i));const b=g.createLinearGradient(x,0,x,h*.85);b.addColorStop(0,'#77dfff16');b.addColorStop(1,'#288fff00');g.fillStyle=b;g.beginPath();g.moveTo(x,0);g.lineTo(x+w*.018,0);g.lineTo(x+w*.2,h*.85);g.lineTo(x-w*.07,h*.85);g.fill()}
// Flowing caustic mesh along the sea floor.
g.lineWidth=.7;for(let j=0;j<19;j++){g.strokeStyle='rgba(35,180,235,'+(.025+j*.003)+')';g.beginPath();for(let x=0;x<=w;x+=12){const y=h*(.76+j*.016)+Math.sin(x/w*9+t+j*.38)*h*.018+Math.sin(x/w*19-t*.7+j)*h*.006;x?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}
for(let i=0;i<density;i++){const seed=Math.sin(i*127.1)*43758.5453,f=seed-Math.floor(seed),x=((i*.6180339%1)*w+Math.sin(t*.3+i)*18),y=h-((f*h+t*(5+f*18))%h),r=.5+f*1.8;g.fillStyle='rgba(105,220,255,'+(.08+f*.32)+')';g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill()}
// A quiet bioluminescent halo follows the pointer without intercepting clicks.
const halo=g.createRadialGradient(px*w,py*h,0,px*w,py*h,w*.22);halo.addColorStop(0,'#259bdb12');halo.addColorStop(1,'#259bdb00');g.fillStyle=halo;g.fillRect(0,0,w,h);
for(let k=0;k<3;k++){const phase=(t*.18+k/3)%1;g.strokeStyle='rgba(74,193,255,'+(.1*(1-phase))+')';g.beginPath();g.ellipse(px*w,py*h,20+phase*130,7+phase*40,0,0,Math.PI*2);g.stroke()}
g.globalCompositeOperation='source-over';const veil=g.createRadialGradient(w*.47,h*.5,0,w*.47,h*.5,w*.55);veil.addColorStop(0,'#02061180');veil.addColorStop(1,'#02061100');g.fillStyle=veil;g.fillRect(0,0,w,h);
}requestAnimationFrame(draw);
</script>`

export function createHtmlEditor(React,background){
  const h=React.createElement;
  return function HtmlEditor({onSelect,theme='light'}){
    const [code,setCode]=React.useState(oceanHtml),[preview,setPreview]=React.useState(''),[error,setError]=React.useState(''),[busy,setBusy]=React.useState(false);
    const input=React.useRef(null),drafts=React.useRef(new Map()),scheme=React.useRef(theme),request=React.useRef(0);
    const edit=value=>{request.current++;drafts.current.set(theme,value);setCode(value)};
    React.useEffect(()=>{
      const token=++request.current;
      if(scheme.current!==theme)drafts.current.set(scheme.current,code);
      scheme.current=theme;setPreview('');setError('');
      if(drafts.current.has(theme))setCode(drafts.current.get(theme));
      else{setCode(oceanHtml);background.readHtml(theme).then(value=>{if(request.current===token&&scheme.current===theme)setCode(value)},()=>{})}
      return()=>{request.current++};
    },[theme]);
    React.useEffect(()=>{const stop=()=>{if(document.hidden)setPreview('')};document.addEventListener('visibilitychange',stop);return()=>document.removeEventListener('visibilitychange',stop)},[]);
    async function apply(){setBusy(true);setError('');try{onSelect(await background.importHtml(code,'自定义 HTML 背景'));setPreview('')}catch(e){setError(e.message)}finally{setBusy(false)}}
    return h('details',{className:'dcb-background-library',onToggle:e=>{if(!e.currentTarget.open)setPreview('')}},h('summary',{style:{cursor:'pointer',padding:'12px 0'}},'✦ HTML 动态背景 · 深海极光'),
      h('p',null,'粘贴 HTML / CSS / JavaScript，或导入单文件 HTML。内置深海极光可直接预览和应用。素材需内嵌，暂不加载外部网址或文件夹。'),
      h('textarea',{'aria-label':'HTML 背景代码',value:code,onChange:e=>edit(e.target.value),spellCheck:false,style:{width:'100%',minHeight:220,resize:'vertical',background:'var(--dsh-settings-subtle)',color:'var(--dsh-settings-text)',border:'1px solid var(--dsh-settings-border)',borderRadius:12,padding:14,font:'12px/1.6 monospace'}}),
      h('input',{ref:input,type:'file',hidden:true,accept:'.html,.htm,text/html','aria-label':'导入 HTML 背景',onChange:async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;const token=++request.current;try{if(file.size>2*1024*1024)throw Error('HTML 需小于 2MB');const source=await file.text();if(request.current===token){edit(source);setError('')}}catch(e){if(request.current===token)setError(e.message)}}}),
      h('div',{className:'dcb-background-actions'},h('button',{type:'button',onClick:()=>input.current.click()},'导入 HTML'),h('button',{type:'button',onClick:()=>edit(oceanHtml)},'载入深海极光'),h('button',{type:'button',onClick:async()=>{const token=++request.current;try{const source=await background.readHtml(theme);if(request.current===token){edit(source);setError('')}}catch(e){if(request.current===token)setError(e.message)}}},'读取当前 HTML'),h('button',{type:'button',onClick:()=>{if(code.length>2*1024*1024){setError('HTML 需小于 2MB');return}setPreview(preview?'':htmlDocument(code))}},preview?'停止预览':'预览动效'),h('button',{type:'button',disabled:busy,onClick:apply},busy?'保存中…':'应用 HTML 背景')),
      preview&&h('iframe',{title:'HTML 动态背景预览',sandbox:'allow-scripts',referrerPolicy:'no-referrer',srcDoc:preview,style:{width:'100%',aspectRatio:'16/9',border:0,borderRadius:14}}),error&&h('p',{role:'alert'},error));
  }
}
