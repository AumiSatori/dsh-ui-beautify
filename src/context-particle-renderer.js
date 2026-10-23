// Bounded canvas renderer shared by visible DSH conversation backgrounds.
export async function sampleParticleArtwork(source,{vector=false,transparent=false}={}) { return sampleImage(source,{vector,transparent}) }
const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v)),mix=(a,b,p)=>a+(b-a)*p;
const smooth=(a,b,x)=>{const p=clamp((x-a)/(b-a));return p*p*(3-2*p)};
let seed=184327;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
const AMBIENT=48;
async function sampleImage(source,{vector=false,transparent=false}={}){const image=new Image();image.src=source;await image.decode();seed=184327;
const scale=vector?Math.min(768/image.naturalWidth,768/image.naturalHeight):576/image.naturalWidth;
const w=Math.max(1,Math.round(image.naturalWidth*scale)),h=Math.max(1,Math.round(image.naturalHeight*scale));const map=document.createElement('canvas');map.width=w;map.height=h;const c=map.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0,w,h);const data=c.getImageData(0,0,w,h).data;
// Flood only the near-white region connected to the image edge. Interior
// apron/lace highlights remain foreground, unlike global white thresholding.
const background=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;const pale=i=>{const k=i*4,r=data[k],g=data[k+1],b=data[k+2];return Math.min(r,g,b)>232&&Math.max(r,g,b)-Math.min(r,g,b)<28};const push=i=>{if(i>=0&&i<w*h&&!background[i]&&pale(i)){background[i]=1;queue[tail++]=i}};
if(!vector&&!transparent){for(let x=0;x<w;x++){push(x);push((h-1)*w+x)}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1)}while(head<tail){const i=queue[head++],x=i%w;if(x)push(i-1);if(x<w-1)push(i+1);if(i>=w)push(i-w);if(i<w*(h-1))push(i+w)}}
const visible=i=>!background[i]&&data[i*4+3]>16;
let minX=w,minY=h,maxX=0,maxY=0,area=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(visible(y*w+x)){minX=Math.min(x,minX);maxX=Math.max(x,maxX);minY=Math.min(y,minY);maxY=Math.max(y,maxY);area++}
if(area<4)throw new Error('SVG 中没有可见图形，请检查填充、描边或透明度');
const candidates=[];
const step=area>=72000?2:1;
for(let y=minY;y<=maxY;y+=step)for(let x=minX;x<=maxX;x+=step){
  const i=y*w+x;if(!visible(i))continue;
  const k=i*4,r=data[k]/255,g=data[k+1]/255,b=data[k+2]/255;
  const nx=(x-minX)/Math.max(1,maxX-minX),ny=(y-minY)/Math.max(1,maxY-minY);
  const edge=[i-1,i+1,i-w,i+w].some(next=>next<0||next>=w*h||!visible(next));
  let contrast=0;for(const next of [i-2,i+2,i-w*2,i+w*2])if(next>=0&&next<w*h){
    const n=next*4;contrast=Math.max(contrast,(Math.abs(data[k]-data[n])+Math.abs(data[k+1]-data[n+1])+Math.abs(data[k+2]-data[n+2]))/765);
  }
  // Weighted, stable sampling keeps eyes/face and silhouette legible before
  // spending the remaining budget on flat apron and hair regions.
  const face=!vector&&nx>.30&&nx<.66&&ny>.10&&ny<.33;
  const weight=1+(face?2.2:0)+contrast*7+(edge?2:0);
  candidates.push({x:nx,y:ny,r,g,b,alpha:data[k+3]/255,edge:edge?1:0,priority:Math.pow(random(),1/weight)});
}
candidates.sort((a,b)=>b.priority-a.priority);
const body=candidates.slice(0,42000).map((p,i)=>({...p,index:i,s1:random(),s2:random(),s3:random(),ambient:0}));
const ambient=Array.from({length:AMBIENT},(_,i)=>({x:random(),y:random(),r:.42,g:.61,b:.96,index:i,s1:random(),s2:random(),s3:random(),ambient:1}));
// Reuse the same foreground pixels for the final detail pass. Only edge-connected
// background becomes transparent; the original colors and interior white remain.
const detail=document.createElement('canvas');detail.width=maxX-minX+1;detail.height=maxY-minY+1;
if(!vector){for(let i=0;i<background.length;i++)if(background[i])data[i*4+3]=0;c.putImageData(new ImageData(data,w,h),0,0)}
detail.getContext('2d').drawImage(map,minX,minY,detail.width,detail.height,0,0,detail.width,detail.height);
return{points:[...ambient,...body],ratio:detail.width/detail.height,count:body.length,detail};
}

export function createParticleScene(root,doc,win){
const state={progress:0,target:0,budget:6400,budgetTarget:6400,view:1,light:0,lightTarget:0,time:0,width:1,height:1,dpr:1,ready:false,disposed:false,visible:true,mode:'',frames:0,maxPoints:0,artwork:'default',quality:'low'};
const media=win.matchMedia('(prefers-reduced-motion: reduce)');
let canvas=doc.createElement('canvas'),renderer=null,points=[],raf=0,timer=0,last=0,dirty=true,rect=[0,0,1,1],field=[0,0,1,1],detailImage=null,model=null,geometry={width:1,height:1,bottom:1},shapeAnimation=null;
canvas.setAttribute('aria-hidden','true');root.append(canvas);
const detailBlend=p=>state.artwork==='whale'?0:smooth(.5,1,p);
const population=p=>.01+.99*Math.pow(clamp(p),.9);
const gather=(p,s)=>smooth(0,.16+.84*s,p);
const notify=()=>{};
function flowPosition(a,p,time){
  const gathered=gather(p,a.s3),spread=1-gathered,phase=(a.s2+time*(.018+.012*a.s3))%1;
  const angle=a.s1*Math.PI*2+Math.sin(time*.05+a.s2*6)*.10,radius=.84+.46*a.s2;
  const origin=[field[0]+Math.cos(angle)*field[2]*radius,field[1]+Math.sin(angle)*field[3]*radius];
  const target=[rect[0]+a.x*rect[2],rect[1]+a.y*rect[3]];
  const journey=gathered+spread*(.03+.36*phase)*(1-smooth(.4,.85,p));
  const dx=origin[0]-target[0],dy=origin[1]-target[1],length=Math.hypot(dx,dy)||1;
  const bend=Math.sin(Math.PI*journey)*(a.s3-.5)*Math.min(field[2],field[3])*.65;
  // Each gathered whale dot keeps a small local orbit. The face moves less,
  // and every orbit stays anchored to its sampled point instead of dispersing.
  let ox=0,oy=0;
  if(state.artwork==='whale'&&!a.ambient&&!media.matches){
    const face=a.x>.30&&a.x<.66&&a.y>.10&&a.y<.33;
    const orbit=smooth(.3,.9,gathered)*(1.6+2.8*a.s3)*clamp(rect[3]/700,.45,1.2)*(face?.45:1);
    ox=orbit*Math.sin(time*(.75+.4*a.s2)+a.s1*Math.PI*2);oy=orbit*.75*Math.cos(time*(.65+.35*a.s3)+a.s2*Math.PI*2);
  }
  return{x:mix(origin[0],target[0],journey)-dy/length*bend+ox,y:mix(origin[1],target[1],journey)+dx/length*bend+oy,origin,gathered,phase,fade:mix(smooth(0,.1,phase)*(1-smooth(.86,1,phase)),1,gathered)};
}
const vertex=`#version 300 es
precision highp float;
in vec2 a_pos;in vec3 a_color;in vec4 a_data;in vec2 a_extra;
uniform vec2 u_view;uniform vec4 u_rect,u_field;uniform float u_progress,u_time,u_budget,u_light,u_chat,u_dpr,u_still,u_custom,u_whale;
out vec4 v_color;out float v_glow;
void main(){float idx=a_data.x,s1=a_data.y,s2=a_data.z,s3=a_data.w,ambient=a_extra.x;float p=u_progress;
float gathered=smoothstep(0.,.16+.84*s3,p);float spread=1.-gathered;
vec2 target=u_rect.xy+a_pos*u_rect.zw;
float time=u_time*(1.-u_still);
float phase=fract(s2+time*(.018+.012*s3));
float angle=s1*6.2831853+sin(time*.05+s2*6.)*.10,radius=.84+.46*s2;
vec2 origin=u_field.xy+vec2(cos(angle),sin(angle))*u_field.zw*radius;
float journey=gathered+spread*(.03+.36*phase)*(1.-smoothstep(.4,.85,p));
vec2 direction=origin-target;vec2 normal=vec2(-direction.y,direction.x)/max(1.,length(direction));
float bend=sin(3.14159265*journey)*(s3-.5)*min(u_field.z,u_field.w)*.65;
vec2 pos=mix(origin,target,journey)+normal*bend;
if(u_whale>.5&&u_still<.5&&ambient<.5){
  float face=step(.30,a_pos.x)*(1.-step(.66,a_pos.x))*step(.10,a_pos.y)*(1.-step(.33,a_pos.y));
  float orbit=smoothstep(.3,.9,gathered)*(1.6+2.8*s3)*clamp(u_rect.w/700.,.45,1.2)*mix(1.,.45,face);
  pos+=orbit*vec2(sin(time*(.75+.4*s2)+s1*6.2831853),.75*cos(time*(.65+.35*s3)+s2*6.2831853));
}
float streamFade=mix(smoothstep(0.,.1,phase)*(1.-smoothstep(.86,1.,phase)),1.,gathered);
float population=u_budget*(.01+.99*pow(p,.9));float alpha=1.-smoothstep(population-32.,population+32.,idx);
float lightness=dot(a_color,vec3(.2126,.7152,.0722));
vec3 darkColor=a_color*.96+vec3(.035,.04,.05);
if(u_custom>.5)darkColor=mix(vec3(.52,.70,1.),darkColor,smoothstep(.05,.26,lightness));
darkColor=mix(vec3(.50,.72,1.),darkColor,gathered);
vec3 lightColor=mix(vec3(.17,.32,.64),mix(a_color,vec3(.57,.63,.74),smoothstep(.85,1.,lightness)*.12),gathered);
vec3 color=mix(darkColor,lightColor,u_light);
alpha*=mix(.72,1.,gathered);alpha*=mix(1.,.78,u_chat);alpha*=a_extra.y*streamFade;
alpha*=mix(1.-smoothstep(.5,1.,p),.86+.14*sin(time*.9+s1*23.),u_whale);
float size=mix(2.1,3.7,gathered)*mix(mix(.76,1.22,s3),mix(.94,1.06,s3),gathered);
if(ambient>.5){pos=origin;alpha=(.10+.13*s3)*(.35+.65*p)*(.8+.2*sin(time*.45+s1*23.));color=mix(vec3(.45,.64,.98),vec3(.28,.40,.60),u_light);size=1.3+1.1*s3;}
vec2 clip=pos/u_view*2.-1.;gl_Position=vec4(clip.x,-clip.y,0.,1.);gl_PointSize=size*u_dpr;v_color=vec4(clamp(color,0.,1.),alpha);v_glow=gathered;
}`;
const fragment=`#version 300 es
precision highp float;in vec4 v_color;in float v_glow;out vec4 outColor;
void main(){vec2 p=gl_PointCoord*2.-1.;float r=length(p);if(r>1.)discard;float core=1.-smoothstep(.25,1.,r);outColor=vec4(v_color.rgb,v_color.a*core);}`;
const detailVertex=`#version 300 es
precision highp float;uniform vec2 u_view;uniform vec4 u_rect;out vec2 v_uv;
void main(){vec2 corners[6]=vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));v_uv=corners[gl_VertexID];vec2 clip=(u_rect.xy+v_uv*u_rect.zw)/u_view*2.-1.;gl_Position=vec4(clip.x,-clip.y,0.,1.);}`;
const detailFragment=`#version 300 es
precision highp float;uniform sampler2D u_image;uniform float u_opacity;in vec2 v_uv;out vec4 outColor;
void main(){vec4 pixel=texture(u_image,v_uv);outColor=vec4(pixel.rgb,pixel.a*u_opacity);}`;
function createGPU(){
  const gl=canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'low-power'});if(!gl)return null;
  const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s};
  const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
  const detailVS=shader(gl.VERTEX_SHADER,detailVertex),detailFS=shader(gl.FRAGMENT_SHADER,detailFragment),detailProgram=gl.createProgram();
  gl.attachShader(detailProgram,detailVS);gl.attachShader(detailProgram,detailFS);gl.linkProgram(detailProgram);
  if(!gl.getProgramParameter(detailProgram,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(detailProgram));gl.deleteShader(detailVS);gl.deleteShader(detailFS);
  const detailU={};for(const key of ['view','rect','image','opacity'])detailU[key]=gl.getUniformLocation(detailProgram,'u_'+key);
  const texture=gl.createTexture(),detailVAO=gl.createVertexArray(),pointVAO=gl.createVertexArray();gl.bindVertexArray(pointVAO);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  const upload=()=>{const array=new Float32Array(points.length*11);points.forEach((p,i)=>array.set([p.x,p.y,p.r,p.g,p.b,p.index,p.s1,p.s2,p.s3,p.ambient,p.alpha??1],i*11));gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,array,gl.STATIC_DRAW);
    gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,detailImage)};
  upload();const stride=44;
  for(const[name,n,offset]of[['a_pos',2,0],['a_color',3,8],['a_data',4,20],['a_extra',2,36]]){const loc=gl.getAttribLocation(program,name);if(loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,n,gl.FLOAT,false,stride,offset)}}
  const u={};for(const key of['view','rect','field','progress','time','budget','light','chat','dpr','still','custom','whale'])u[key]=gl.getUniformLocation(program,'u_'+key);
  // The transparent drawing buffer stores premultiplied RGB. Alpha must use ONE
  // instead of SRC_ALPHA, so browser compositing does not dim the image again.
  gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  const onLost=e=>{e.preventDefault();if(!state.disposed){notify('图形加速暂不可用，已切到轻量预览');useFallback()}};canvas.addEventListener('webglcontextlost',onLost);state.mode='WebGL2';
  return{
    resize(){gl.viewport(0,0,canvas.width,canvas.height)},update:upload,
    draw(){gl.clear(gl.COLOR_BUFFER_BIT);
      const fidelity=detailBlend(state.progress);
      if(fidelity>0){gl.useProgram(detailProgram);gl.bindVertexArray(detailVAO);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(detailU.image,0);gl.uniform2f(detailU.view,state.width,state.height);gl.uniform4fv(detailU.rect,rect);gl.uniform1f(detailU.opacity,fidelity*mix(1,.62,state.view));gl.drawArrays(gl.TRIANGLES,0,6)}
      gl.useProgram(program);gl.bindVertexArray(pointVAO);gl.uniform2f(u.view,state.width,state.height);gl.uniform4fv(u.rect,rect);gl.uniform4fv(u.field,field);
      for(const[key,value]of Object.entries({progress:state.progress,time:state.time,budget:state.budget,light:state.light,chat:state.view,dpr:state.dpr,still:media.matches?1:0,custom:state.artwork==='svg'?1:0,whale:state.artwork==='whale'?1:0}))gl.uniform1f(u[key],value);
      gl.drawArrays(gl.POINTS,0,AMBIENT+(fidelity===1?0:Math.min(state.maxPoints,Math.ceil(state.budget*population(state.progress)+100))))},
    dispose(){canvas.removeEventListener('webglcontextlost',onLost);gl.deleteBuffer(buffer);gl.deleteTexture(texture);gl.deleteVertexArray(pointVAO);gl.deleteVertexArray(detailVAO);gl.deleteProgram(detailProgram);gl.deleteProgram(program);if(!gl.isContextLost())gl.getExtension('WEBGL_lose_context')?.loseContext()}
  };
}
function useFallback(){
  renderer?.dispose();const next=canvas.cloneNode(false);canvas.replaceWith(next);canvas=next;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('浏览器无法创建绘图画布');state.mode='Canvas 2D';state.budgetTarget=Math.min(4500,state.budgetTarget);state.budget=Math.min(4500,state.budget);
  renderer={resize(){},draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(state.dpr,state.dpr);
    const p=state.progress,active=state.budget*population(p),t=media.matches?0:state.time,fidelity=detailBlend(p);
    if(fidelity>0){ctx.globalAlpha=fidelity*mix(1,.62,state.view);ctx.drawImage(detailImage,...rect);ctx.globalAlpha=1}
    for(let i=0;i<AMBIENT+Math.min(state.maxPoints,Math.ceil(active+100));i++){
      const a=points[i],amb=a.ambient;
      // Do not calculate trajectories/colors or rasterize invisible body dots.
      if(!amb&&(fidelity===1||a.index>=active+32))continue;
      const flow=flowPosition(a,p,t),g=flow.gathered;
      const x=amb?flow.origin[0]:flow.x,y=amb?flow.origin[1]:flow.y;
      const l=a.r*.2126+a.g*.7152+a.b*.0722;
      const rgb=amb?[.45,.64,.98]:[a.r,a.g,a.b].map((v,k)=>{
        let dark=v*.96+[.035,.04,.05][k];
        if(state.artwork==='svg')dark=mix([.52,.70,1][k],dark,smooth(.05,.26,l));
        dark=mix([.5,.72,1][k],dark,g);
        return mix(clamp(dark),mix([.17,.32,.64][k],mix(v,[.57,.63,.74][k],smooth(.85,1,l)*.12),g),state.light);
      });
      let alpha=amb?.13*(.35+.65*p):(1-smooth(active-32,active+32,a.index))*mix(.72,1,g)*(a.alpha??1)*flow.fade;
      alpha*=mix(1,.78,state.view)*(amb?1:1-fidelity)*(state.artwork==='whale'&&!amb ? .86+.14*Math.sin(t*.9+a.s1*23) : 1);
      ctx.fillStyle=`rgba(${rgb.map(v=>Math.round(v*255)).join(',')},${alpha})`;ctx.beginPath();ctx.arc(x,y,amb?.7:mix(.8,1.4,g)*mix(.76,1.22,a.s3),0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  },dispose(){}};resize();requestFrame();
}

function computeRect(){
  const {width:w,height:h,bottom}=geometry;const ratio=model?.ratio||1,top=18,available=Math.max(40,bottom-top-12);
  const maxWidth=w*(w<600?.72:.52),height=Math.min(available,h*.82,maxWidth/ratio),width=height*ratio;
  rect=[(w-width)/2,top+Math.max(0,(available-height)/2),width,height];
  field=[w/2,rect[1]+height/2,Math.max(w*.52,width*.85),Math.max(available*.58,height*.57)];
}
function resize(){
  state.width=geometry.width;state.height=geometry.height;state.dpr=Math.min(win.devicePixelRatio||1,1.25);
  const w=Math.max(1,Math.round(state.width*state.dpr)),h=Math.max(1,Math.round(state.height*state.dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;renderer?.resize()}computeRect();dirty=true;
}
function stopFrame(){win.cancelAnimationFrame(raf);win.clearTimeout(timer);raf=timer=0;last=0}
function requestFrame(delay=0){
  if(doc.hidden||!state.visible||!state.ready||state.disposed||raf)return;
  if(timer){if(delay)return;win.clearTimeout(timer);timer=0}
  if(delay)timer=win.setTimeout(()=>{timer=0;requestFrame()},delay);
  else raf=win.requestAnimationFrame(frame);
}
const moving=()=>Math.abs(state.progress-state.target)>.0002||Math.abs(state.light-state.lightTarget)>.001||Math.abs(state.budget-Math.min(state.maxPoints,state.budgetTarget))>.6;
function frame(now){
  raf=0;if(state.disposed||doc.hidden||!state.visible)return;
  const dt=last?Math.min((now-last)/1000,.25):1/60;last=now;
  const q=media.matches?1:1-Math.exp(-dt*4.4),budget=Math.min(state.maxPoints,state.budgetTarget);
  state.progress=mix(state.progress,state.target,q);state.light=mix(state.light,state.lightTarget,q);state.budget=mix(state.budget,budget,q);
  if(!media.matches)state.time+=dt;
  const changing=moving();
  if(!changing){state.progress=state.target;state.light=state.lightTarget;state.budget=budget}
  renderer.draw();state.frames++;dirty=false;
  // A slow ambient flow needs no display-refresh-rate polling (often 165 Hz).
  // Keep transitions smooth; whale dots retain a bounded low-cadence local
  // motion when gathered. Other complete artwork can still sleep.
  if(!media.matches&&(changing||state.progress<1||state.artwork==='whale'))requestFrame(1000/(changing?(state.mode==='Canvas 2D'?24:30):(state.mode==='Canvas 2D'?8:12)));
}
const changed=()=>{stopFrame();dirty=true;requestFrame()};media.addEventListener('change',changed);doc.addEventListener('visibilitychange',changed);
return{
  setModel(next,kind){if(state.disposed)return;model=next;points=next.points;detailImage=next.detail;state.maxPoints=next.count;state.artwork=kind;
    if(!renderer){try{renderer=createGPU()}catch{renderer=null}if(!renderer)useFallback()}else renderer.update?.();
    state.ready=true;resize();shapeAnimation?.cancel();if(!media.matches){const incoming=canvas.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:280,easing:'cubic-bezier(.22,.8,.26,1)'});shapeAnimation=incoming;incoming.finished.then(()=>{if(shapeAnimation===incoming){incoming.cancel();shapeAnimation=null}},()=>{})}requestFrame();
  },
  configure({progress,count,light,visible=true,width,height,bottom}){if(state.disposed)return;
    const target=clamp(progress),budget=state.mode==='Canvas 2D'?Math.min(4500,count):count,lightTarget=light?1:0;
    if(target!==state.target||budget!==state.budgetTarget||lightTarget!==state.lightTarget||visible!==state.visible)dirty=true;
    state.target=target;state.budgetTarget=budget;state.lightTarget=lightTarget;state.visible=visible;
    if(width!==geometry.width||height!==geometry.height||bottom!==geometry.bottom||state.dpr!==Math.min(win.devicePixelRatio||1,1.25)){geometry={width,height,bottom};resize()}
    if(!visible)stopFrame();else if(dirty)requestFrame();
  },
  pause(){state.visible=false;stopFrame()},
  snapshot:()=>({ready:state.ready,mode:state.mode,progress:state.progress,target:state.target,count:Math.round(state.budget*population(state.progress)+AMBIENT),budget:state.budget,frames:state.frames,time:state.time,visible:state.visible,rect:[...rect],field:[...field],reducedMotion:media.matches}),
  dispose(){state.disposed=true;stopFrame();shapeAnimation?.cancel();renderer?.dispose();media.removeEventListener('change',changed);doc.removeEventListener('visibilitychange',changed);canvas.remove();points=[];detailImage=null;model=null}
};
}
