window.__ModuleLoader__.load({
  id: 'dsh-claude-beautify',
  factory: (require) => {
    const React = require('react')
    /* DCB_LENS_BUNDLE_START */
    var DcbLens=(()=>{var Dt=Object.defineProperty;var no=Object.getOwnPropertyDescriptor;var io=Object.getOwnPropertyNames;var ao=Object.prototype.hasOwnProperty;var so=(t,e)=>{for(var n in e)Dt(t,n,{get:e[n],enumerable:!0})},co=(t,e,n,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of io(e))!ao.call(t,o)&&o!==n&&Dt(t,o,{get:()=>e[o],enumerable:!(r=no(e,o))||r.enumerable});return t};var lo=t=>co(Dt({},"__esModule",{value:!0}),t);var cn={};so(cn,{affectsPresentation:()=>to,affectsScroll:()=>ro,composerSlotsCss:()=>gr,contextParticlesCss:()=>rr,conversationTabsCss:()=>Ur,createComposerSlots:()=>vr,createContextParticles:()=>or,createConversationTabs:()=>Cr,createFocusMode:()=>hr,createLensActions:()=>sn,createOutputArtifact:()=>jr,createOutputPreviewBridge:()=>Vr,createOutputViewer:()=>Br,createParticleSettings:()=>ir,createProgressLiquid:()=>Kr,createScopeSwitch:()=>Wr,createSettingsTabs:()=>Ar,createSidebarGlass:()=>dr,createStartupMotion:()=>Sr,createThemeToggle:()=>fr,createTurnCards:()=>Nr,createWelcomeMediaStore:()=>wr,createWelcomeSettings:()=>Mr,focusModeCss:()=>pr,isHtmlOutput:()=>Gr,motion:()=>G,normalizeParticles:()=>Pe,normalizeWelcome:()=>Ee,outputContentReader:()=>_r,outputPreviewCss:()=>zr,outputPreviewReader:()=>Ir,outputViewerCss:()=>Zr,particleSettingsCss:()=>nr,progressRollEase:()=>Yr,scopeSwitchCss:()=>Lr,settingsTabsCss:()=>Tr,themeToggleCss:()=>ur,turnCardsCss:()=>$r,welcomeSettingsCss:()=>Er});var Bt=t=>{for(let e of Object.values(t))e&&typeof e=="object"&&Bt(e);return Object.freeze(t)},Fe=Bt({version:"1.1.0-showcase.1",color:{text:"#22252b",muted:"#6b7079",accent:"#2875ed",focus:"#2576e8",page:"#f7f8fa",success:"#236442"},type:{family:'-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif',body:16,control:14,caption:12},space:{xs:4,sm:8,md:16,lg:24,xl:32},radius:{chrome:14,panel:34,lens:60,pill:999},surface:{fallback:"rgba(245,250,255,.30)",solid:"#eef2f8",shadow:"inset 0 1px 0 #fff9,inset 1px 0 0 #fff3,0 12px 24px -12px #2135524d"},motion:{elasticity:.7,spring:"cubic-bezier(.2,.9,.25,1.22)",fast:160,normal:240,feedback:520},optics:{gold:"#e2b54e",green:"#52bb83",light:"#90e8fa",flowDuration:1100,settleDuration:280,magnification:1.8},audio:{enabled:!0,volume:.28,maxVoices:6,cooldown:70,storageKey:"lens.sound.v1"},materials:{clear:{refraction:.65,blur:.12,dispersion:.35},soft:{refraction:.38,blur:.64,dispersion:.12},thick:{refraction:.9,blur:.24,dispersion:.65}}}),dn=Fe.materials;var uo=new WeakMap,Ht=(t,e=0,n=1)=>Math.max(e,Math.min(n,t));function fo(t,e,n=!1){let r=t.duration||0,o=n||!r?1:Ht((e-t.start)/r),i=1-(1-o)**3,c={...t.to};for(let d of["fill","complete","selected","hover"]){let b=t.to[d]||0,u=t.from[d]||0,x=d==="complete"&&b>u?Ht((o-.12)/.88):i;c[d]=x===1?b:u+(b-u)*x}typeof t.to.opacity=="number"&&(c.opacity=o===1?t.to.opacity:(t.from.opacity??t.to.opacity)+(t.to.opacity-(t.from.opacity??t.to.opacity))*i);let g=e-t.flowStart;return c.flow=!n&&t.flowStart!==null&&g>=0&&g<Fe.optics.flowDuration?g/Fe.optics.flowDuration:-1,c}function Yt(t,e=performance.now(),n=!1){let r=uo.get(t);return r?fo(r,e,n&&!r.to.forceMotion):null}var kt=class{constructor(e=6){this.limit=e,this.clients=new Set}add(e){let n={...e,active:!1};return this.clients.add(n),n.destroy=()=>{this.clients.delete(n),n.active&&(n.active=!1,n.suspend())},n}update(){let e=[...this.clients].map(r=>({entry:r,rank:r.priority()})).filter(({rank:r})=>Number.isFinite(r)).sort((r,o)=>o.rank-r.rank),n=new Set(e.slice(0,this.limit).map(({entry:r})=>r));for(let r of this.clients)r.active&&!n.has(r)&&(r.active=!1,r.suspend());for(let r of n)r.active||(r.active=!0,r.activate())}};function mo(t){let e=t.ownerDocument,n=e.defaultView;if(!t.isConnected||e.hidden||!t.getClientRects().length||n.getComputedStyle(t).visibility==="hidden")return-1/0;let o=t.getBoundingClientRect(),i=Math.max(0,o.left),c=Math.max(0,o.top),g=Math.min(n.innerWidth,o.right),d=Math.min(n.innerHeight,o.bottom);if(g<=i||d<=c)return-1/0;for(let b=n;b.frameElement;b=b.parent){let u=b.frameElement,x=u.getBoundingClientRect();if(!u.getClientRects().length||b.parent.document.hidden||x.bottom<=0||x.top>=b.parent.innerHeight||x.right<=0||x.left>=b.parent.innerWidth)return-1/0}return(g-i)*(d-c)/Math.max(1,o.width*o.height)-Math.abs((c+d)/2-n.innerHeight/2)/Math.max(1,n.innerHeight)*.01}function Xt(t,e,n){let r=t.ownerDocument.defaultView,o=r;try{for(;o.parent!==o&&o.parent.document;)o=o.parent}catch{}let i=Symbol.for("lens.viewport-gpu-budget.v1");if(!o[i]){let D=new kt(6),f=new Map,S=0,y=()=>{S||(S=o.requestAnimationFrame(()=>{S=0,D.update()}))};o[i]={budget:D,documents:f,schedule:y}}let c=o[i],g=t.ownerDocument;if(!c.documents.has(g)){let D=new r.AbortController,f=D.signal;g.addEventListener("scroll",c.schedule,{capture:!0,passive:!0,signal:f}),g.addEventListener("visibilitychange",c.schedule,{signal:f}),r.addEventListener("resize",c.schedule,{passive:!0,signal:f}),c.documents.set(g,{count:0,abort:D})}let d=c.documents.get(g);d.count++;let b=c.budget.add({priority:()=>mo(t),activate:e,suspend:n}),u=new r.ResizeObserver(c.schedule);u.observe(t);let x=new r.IntersectionObserver(c.schedule);x.observe(t);let R=!1,$=()=>{R||(R=!0,u.disconnect(),x.disconnect(),b.destroy(),r.removeEventListener("pagehide",h),--d.count||(d.abort.abort(),c.documents.delete(g)),c.schedule())},h=D=>{D.persisted||$()};return r.addEventListener("pagehide",h),c.schedule(),{get active(){return b.active},destroy:$,update:c.schedule}}var po=`#version 300 es
in vec2 aPosition;
uniform vec2 uResolution;
uniform vec4 uQuad;
out vec2 vPixel;
void main(){
  vPixel = uQuad.xy + (aPosition * .5 + .5) * uQuad.zw;
  gl_Position = vec4(vPixel / uResolution * 2. - 1., 0., 1.);
}`,ho=`#version 300 es
precision highp float;
in vec2 vPixel;
out vec4 outColor;
uniform sampler2D uArtwork;
uniform vec2 uResolution;
uniform float uTime;
uniform float uAnimate;
uniform float uBrightness;
uniform float uGrid;
void main(){
  vec2 uv = vPixel / uResolution;
  float movement = uAnimate * (1. - uGrid);
  uv.x += sin(uv.y * 5.8 + uTime * .21) * .012 * movement;
  uv.y += sin(uv.x * 5. + uTime * .16) * .010 * movement;
  vec3 c = texture(uArtwork, clamp(uv, .001, .999)).rgb;
  c *= uBrightness;
  outColor = vec4(c, 1.);
}`,bo=`#version 300 es
precision highp float;
in vec2 vPixel;
out vec4 outColor;
uniform sampler2D uScene;
uniform vec2 uResolution;
void main(){ outColor = texture(uScene, vPixel / uResolution); }
`,go=`#version 300 es
precision highp float;
in vec2 vPixel;
out vec4 outColor;
uniform sampler2D uScene;
uniform vec2 uResolution;
uniform vec4 uBox;
uniform vec2 uLocalSize;
uniform mat2 uInverse;
uniform vec2 uBend;
uniform float uPressure;
uniform float uEnergy;
uniform vec2 uPointer;
uniform float uRadius;
uniform float uScale;
uniform float uRefraction;
uniform float uBlur;
uniform float uDispersion;
uniform float uTint;
uniform float uDark;
uniform float uCompare;
uniform float uHover;
uniform vec4 uAccent;
uniform float uOpacity;
uniform float uOpticKind;
uniform vec4 uOptic;
uniform vec3 uEmission;
uniform float uFlow;
uniform float uZoom;
uniform float uWaveTime;

float roundedBox(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return min(max(q.x,q.y),0.) + length(max(q,0.)) - r;
}
float surfaceDistance(vec2 world){
  vec2 p=uInverse*world;
  vec2 halfSize=uLocalSize*.5;
  vec2 q=clamp(p/max(halfSize,vec2(1.)),vec2(-1.3),vec2(1.3));
  // A dragged surface bows between its corners, then settles with the spring.
  // This same shape drives silhouette, refraction normals and specular light.
  p -= uBend * vec2(1.-q.y*q.y,1.-q.x*q.x)*.7;
  float r=min(uRadius*(1.+uPressure*.15),min(halfSize.x,halfSize.y));
  return roundedBox(p,halfSize,r);
}
vec3 sampleScene(vec2 px){
  return texture(uScene,clamp(px/uResolution,vec2(.001),vec2(.999))).rgb;
}
vec3 blurred(vec2 px, float blur){
  vec3 c = sampleScene(px) * .24;
  c += sampleScene(px + vec2(blur,0.)) * .12;
  c += sampleScene(px - vec2(blur,0.)) * .12;
  c += sampleScene(px + vec2(0.,blur)) * .12;
  c += sampleScene(px - vec2(0.,blur)) * .12;
  c += sampleScene(px + vec2(blur,blur)*.707) * .07;
  c += sampleScene(px - vec2(blur,blur)*.707) * .07;
  c += sampleScene(px + vec2(blur,-blur)*.707) * .07;
  c += sampleScene(px + vec2(-blur,blur)*.707) * .07;
  return c;
}
void main(){
  vec2 center = uBox.xy + uBox.zw * .5;
  vec2 p = vPixel - center;
  vec2 b = uLocalSize * .5;
  vec2 local = uInverse*p;
  vec2 opticalUV = clamp(local/max(uLocalSize,vec2(1.))+.5,0.,1.);
  float d = surfaceDistance(p);
  vec3 base = sampleScene(vPixel);
  bool progressGlass = uOpticKind > .5 && uOpticKind < 1.5;
  bool wellGlass = uOpticKind > 1.5 && uOpticKind < 2.5;
  bool fieldGlass = uOpticKind > 2.5 && uOpticKind < 3.5;
  bool magnifier = uOpticKind > 3.5;
  float filled = progressGlass ? (1.-smoothstep(uOptic.x-.007,uOptic.x+.007,opticalUV.x))*step(.0001,uOptic.x) : 0.;
  vec3 sourceColor = mix(vec3(.42,.86,1.),uEmission,uOptic.y);
  vec2 emitter = vec2(-b.x+uLocalSize.x*uOptic.x,0.);
  float sourceGlow = exp(-length((local-emitter)/vec2(23.,15.)/uScale)*1.6)*step(.0001,uOptic.x);
  float halo = exp(-max(d,0.)/(7.*uScale));
  if(progressGlass) base += sourceColor*(sourceGlow*.23+halo*uOptic.y*.075)*uOpacity;
  if(wellGlass) base += vec3(.37,.8,1.)*halo*uOptic.w*.14*uOpacity;
  if(uOptic.z>0.) base += uEmission*halo*uOptic.z*.055*uOpacity;
  float shadowD = surfaceDistance(p+vec2(0.,(5.+uPressure*3.)*uScale));
  float shadow = exp(-max(shadowD,0.)/((7.+uPressure*2.)*uScale))*.078;
  base *= 1. - shadow * uOpacity * smoothstep(-.5*uScale,1.5*uScale,d);
  if(d > 1.5*uScale){outColor=vec4(base,1.);return;}

  float e = .7 * uScale;
  vec2 n2 = normalize(vec2(
    surfaceDistance(p+vec2(e,0.))-surfaceDistance(p-vec2(e,0.)),
    surfaceDistance(p+vec2(0.,e))-surfaceDistance(p-vec2(0.,e))
  )+vec2(.00001));
  float bevel = min(min(b.x,b.y)*.48,19.*uScale);
  float edge = clamp(1.+d/bevel,0.,1.);
  float slope = pow(edge,1.65)*.94;
  vec2 faceNormal=clamp(p/max(b,vec2(1.)),vec2(-1.),vec2(1.))*.045*(1.-edge);
  vec2 normalXY=n2*slope+faceNormal;
  if(wellGlass) normalXY *= mix(-1.,1.,uOptic.z);
  vec3 normal = vec3(normalXY,sqrt(max(1.-dot(normalXY,normalXY),.001)));
  // Snell's law: air (1.0) -> a glass-like medium (1.45).
  vec3 ray = refract(vec3(0.,0.,-1.),normal,1./1.45);
  float thickness = (18.+uRefraction*57.)*uScale*(1.+uPressure*.13+uEnergy*.12);
  vec2 offset = ray.xy/max(-ray.z,.05)*thickness*uRefraction;
  offset -= p * .016 * uRefraction;
  offset *= 1.+filled*.85;
  if(progressGlass) offset.y += sin(opticalUV.x*24.-uWaveTime*2.2)*filled*2.4*uScale;
  offset *= 1.-uCompare;
  vec2 at = vPixel + offset;
  if(magnifier) at = center+p/max(uZoom,1.)+offset*.18;
  float blur = uBlur * 10. * uScale + uCompare * 5. * uScale;
  blur *= magnifier ? .12 : 1.-filled*.65;
  vec3 c = blurred(at,blur);
  vec2 split = n2*pow(edge,2.8)*uDispersion*2.6*uScale*(1.-uCompare);
  c.r += (sampleScene(at+split).r-sampleScene(at).r)*.8;
  c.b += (sampleScene(at-split).b-sampleScene(at).b)*.8;
  // Very slight saturation lift plus an adaptive, readable material tint.
  float luma = dot(c,vec3(.2126,.7152,.0722));
  c = mix(vec3(luma),c,1.035);
  vec3 tint = mix(vec3(.97,.985,1.),vec3(.16,.24,.34),uDark);
  c = mix(c,tint,uTint+uBlur*.12+uCompare*.11+uDark*.10);
  c = mix(c,uAccent.rgb,uAccent.a);
  if(fieldGlass){
    vec2 q=clamp((local+b-vec2(40.*uScale))/max(uLocalSize-vec2(80.*uScale),vec2(1.)),0.,1.);
    vec3 low=mix(vec3(.50,.66,.82),vec3(.89,.69,.47),q.x);
    vec3 high=mix(vec3(.60,.55,.69),vec3(.83,.58,.59),q.x);
    c=mix(low,high,q.y);
    vec2 lines=abs(fract(q*8.+.5)-.5)/max(fwidth(q*8.),vec2(.001));
    float grid=1.-smoothstep(.2,.9,min(lines.x,lines.y));
    float axes=1.-smoothstep(.002,.006,min(abs(q.x-.5),abs(q.y-.5)));
    c=mix(c,vec3(.97),grid*.18+axes*.26);
  }

  vec2 light = normalize(uPointer-center+vec2(-80.,150.)*uScale);
  float directional = pow(max(dot(n2,light),0.),7.);
  float opposite = pow(max(dot(n2,-light),0.),7.)*.52;
  float fresnel = .04+.96*pow(1.-normal.z,5.);
  float outline = 1.-smoothstep(.12*uScale,1.1*uScale,abs(d+.65*uScale));
  float edgeLight = (directional+opposite)*pow(edge,4.);
  float spec = edgeLight*.065 + outline*(.018+directional*.35+opposite*.15);
  spec += fresnel*.035;
  spec *= 1.-uCompare;
  vec3 environment=sampleScene(vPixel+n2*34.*uScale);
  c=mix(c,environment,fresnel*.12*(1.-uCompare));
  c += mix(vec3(1.),environment,.18)*spec;
  float caustic=exp(-pow((d+3.*uScale)/(1.65*uScale),2.));
  c += caustic*opposite*.038*(1.-uCompare);
  // A broad, quiet reflection follows the pointer inside the material.
  float glint = exp(-length((vPixel-uPointer)/vec2(180.,150.)/uScale)*2.);
  c += glint*.024*(.4+uHover)*(1.-uCompare);
  vec2 face=p/max(b,vec2(1.));
  float broadReflection=exp(-pow((face.x*.55+face.y*.8-light.x*.4)*1.6,2.));
  vec3 ambient=sampleScene(center+vec2(-b.x*.6,b.y*.55));
  c=mix(c,clamp(ambient+vec3(.15),0.,1.),broadReflection*(.045+uPressure*.035)*(1.-uCompare));
  c -= pow(edge,8.)*max(dot(n2,vec2(.45,-.89)),0.)*.085*(1.-uCompare);
  if(wellGlass){
    // Reverse the bevel and occlusion: the receiver sits below the glass plane.
    c -= pow(edge,2.)*max(dot(n2,normalize(vec2(-.4,.9))),0.)*.24*(1.-uOptic.z);
    c += pow(edge,4.)*max(dot(n2,normalize(vec2(.4,-.9))),0.)*.19*(1.-uOptic.z);
    c += vec3(.3,.76,1.)*uOptic.w*(pow(edge,3.)*.35+.04);
    c=mix(c,c*vec3(.89,1.04,.95)+uEmission*.045,uOptic.z*.55);
  }
  float phase=fract(atan(local.y/max(b.y,1.),local.x/max(b.x,1.))/6.2831853+.5);
  float travel=fract(phase-uFlow*1.15+1.);
  float flow=uFlow>=0. ? exp(-pow(travel/.105,2.))*sin(3.14159265*clamp(uFlow,0.,1.)) : 0.;
  float lightEdge=exp(-pow((d+1.4*uScale)/(1.25*uScale),2.));
  float innerEdge=exp(-pow((d+4.*uScale)/(3.*uScale),2.));
  if(progressGlass){
    float fiberY=local.y/uScale-sin(opticalUV.x*16.-uWaveTime*2.8)*1.5-sin(opticalUV.x*31.-uWaveTime*4.1)*.35;
    float fiber=exp(-pow(fiberY/1.0,2.))*.24+exp(-pow((fiberY-5.)/.65,2.))*.11;
    float spark=exp(-pow((fract(opticalUV.x-uWaveTime*.12)-.08)/.065,2.));
    c += sourceColor*(filled*(fiber*(1.+spark*.42)+innerEdge*.10)+sourceGlow*.42+lightEdge*uOptic.y*.26);
    c += mix(vec3(.8,.98,1.),uEmission,uOptic.y)*(lightEdge*.75+innerEdge*.15)*flow;
  }
  c += uEmission*uOptic.z*(lightEdge*.28+innerEdge*.045);
  if(!progressGlass) c += mix(uEmission,vec3(1.),.45)*uOptic.z*(lightEdge*.8+innerEdge*.18)*flow;
  float aa=max(fwidth(d)*.7,.5*uScale);
  float mask = 1.-smoothstep(-aa,aa,d);
  outColor=vec4(mix(base,c,mask*uOpacity),1.);
}`;function Kt(t,e,n){let r=t.createShader(e);if(t.shaderSource(r,n),t.compileShader(r),!t.getShaderParameter(r,t.COMPILE_STATUS)){let o=t.getShaderInfoLog(r);throw t.deleteShader(r),new Error(o)}return r}function St(t,e){let n=t.createProgram(),r=Kt(t,t.VERTEX_SHADER,po),o=Kt(t,t.FRAGMENT_SHADER,e);if(t.attachShader(n,r),t.attachShader(n,o),t.linkProgram(n),t.deleteShader(r),t.deleteShader(o),!t.getProgramParameter(n,t.LINK_STATUS))throw new Error(t.getProgramInfoLog(n));let i={};for(let c=0;c<t.getProgramParameter(n,t.ACTIVE_UNIFORMS);c++){let g=t.getActiveUniform(n,c);i[g.name]=t.getUniformLocation(n,g.name)}return{p:n,uniforms:i}}var tt=class{constructor(e,n,r={}){this.canvas=e,this.stage=n,this.artwork=typeof r.artwork=="function"?r.artwork:null,this.settings={...Fe.materials.thick,brightness:.95,motion:!0,opaque:!1,compare:!1,scene:"aurora",...r},this.pointer={x:0,y:0},this.smoothPointer={x:0,y:0},this.time=0,this.lastTime=0,this.frame=0,this.dirty=!0,this.rectDirty=!0,this.geometry=[],this.visible=!0,this.destroyed=!1,this.animatingUntil=0,this.reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches,this.gl=null,this.suspended=!0,this.width=0,this.height=0,this.dpr=1,this.onState=r.onState,e.hidden=!0,e.dataset.gpuState="idle",n.classList.add("fallback"),this.resizeObserver=new ResizeObserver(()=>{this.resize(),this.invalidate(150)}),this.resizeObserver.observe(n),this.mutationObserver=new MutationObserver(()=>this.invalidate(600)),this.mutationObserver.observe(n,{subtree:!0,childList:!0,attributes:!0,attributeFilter:["class","style","hidden","aria-selected","aria-pressed","aria-checked"]}),this.intersectionObserver=new IntersectionObserver(i=>{this.visible=i[0].isIntersecting,this.visible&&this.invalidate()}),this.intersectionObserver.observe(n),this.abort=new AbortController;let o=this.abort.signal;n.addEventListener("pointermove",i=>{let c=n.getBoundingClientRect();this.pointer.x=(i.clientX-c.left)*this.dpr,this.pointer.y=(c.height-i.clientY+c.top)*this.dpr,this.invalidate(this.reducedMotion?0:220,!1)},{signal:o,passive:!0}),n.addEventListener("pointerdown",()=>this.invalidate(650),{signal:o,passive:!0}),n.addEventListener("pointerup",()=>this.invalidate(650),{signal:o,passive:!0}),n.addEventListener("lg:optics",i=>this.invalidate(i.detail.duration,!1),{signal:o}),n.addEventListener("scroll",()=>this.invalidate(),{capture:!0,signal:o,passive:!0}),window.addEventListener("resize",()=>this.invalidate(300),{signal:o,passive:!0}),document.addEventListener("visibilitychange",()=>{this.lastTime=0,document.hidden||this.invalidate()},{signal:o}),e.addEventListener("webglcontextlost",i=>{i.preventDefault(),this.lossObserved=!0,this.lost=!0,cancelAnimationFrame(this.frame),this.frame=0,e.hidden=!0,n.classList.remove("webgl-ready"),n.classList.add("fallback"),this.suspended||r.onState?.("lost"),this.gpuLease?.active&&this.resumeGPU()},{signal:o}),e.addEventListener("webglcontextrestored",()=>{if(this.lossObserved=!1,this.destroyed||!this.gpuLease?.active){this.contextExtension?.loseContext();return}this.startGPU()},{signal:o}),this.gpuLease=Xt(n,()=>this.resumeGPU(),()=>this.suspendGPU())}resumeGPU(){if(!this.destroyed){if(this.gl?.isContextLost()){this.lossObserved&&(this.canvas.dataset.gpuState="restoring",this.contextExtension?.restoreContext());return}this.startGPU()}}startGPU(){try{if(this.gl||=this.canvas.getContext("webgl2",{alpha:!1,antialias:!1,preserveDrawingBuffer:!0,powerPreference:"low-power"}),!this.gl)throw new Error("WebGL2 unavailable");this.contextExtension=this.gl.getExtension("WEBGL_lose_context"),this.suspended=!1,this.lost=!1,this.initGL(),this.resize(),this.hasPointer||(this.pointer={x:this.width*.25,y:this.height*.85},this.smoothPointer={...this.pointer},this.hasPointer=!0),this.canvas.hidden=!1,this.canvas.dataset.gpuState="active",this.stage.classList.add("webgl-ready"),this.stage.classList.remove("fallback"),this.onState?.("ready"),this.lastTime=0,this.invalidate(150)}catch(e){this.suspendGPU(),this.onState?.("lost"),console.warn("Glass initialization failed",e)}}suspendGPU(){this.suspended=!0,cancelAnimationFrame(this.frame),this.frame=0,this.canvas.hidden=!0,this.canvas.dataset.gpuState="suspended",this.stage.classList.remove("webgl-ready"),this.stage.classList.add("fallback"),this.gl&&!this.gl.isContextLost()&&this.contextExtension?.loseContext()}initGL(){let e=this.gl;this.programs={background:St(e,ho),copy:St(e,bo),lens:St(e,go)},this.buffer=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.buffer),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),e.STATIC_DRAW),this.vao=e.createVertexArray(),e.bindVertexArray(this.vao),this.textures={art:this.makeTexture(),scene:this.makeTexture(),composite:this.makeTexture()},this.targets=["scene","composite"].map(n=>{let r=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,r),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,this.textures[n],0),{framebuffer:r,texture:this.textures[n]}}),e.bindFramebuffer(e.FRAMEBUFFER,null),e.disable(e.DEPTH_TEST),e.disable(e.BLEND),this.width=0,this.height=0}makeTexture(){let e=this.gl,n=e.createTexture();return e.bindTexture(e.TEXTURE_2D,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),n}resize(){if(this.destroyed||this.suspended||this.lost||!this.gl||this.gl.isContextLost?.())return;let e=this.stage.getBoundingClientRect();this.dpr=Math.min(devicePixelRatio||1,1.75);let n=Math.max(1,Math.round(e.width*this.dpr)),r=Math.max(1,Math.round(e.height*this.dpr));if(n===this.width&&r===this.height)return;this.width=n,this.height=r,this.canvas.width=n,this.canvas.height=r;let o=this.gl;for(let i of this.targets)if(o.bindTexture(o.TEXTURE_2D,i.texture),o.texImage2D(o.TEXTURE_2D,0,o.RGBA,n,r,0,o.RGBA,o.UNSIGNED_BYTE,null),o.bindFramebuffer(o.FRAMEBUFFER,i.framebuffer),o.checkFramebufferStatus(o.FRAMEBUFFER)!==o.FRAMEBUFFER_COMPLETE)throw new Error("Incomplete scene framebuffer");o.bindFramebuffer(o.FRAMEBUFFER,null),this.setScene(this.settings.scene),this.rectDirty=!0}setScene(e){if(this.settings.scene=e,this.suspended||!this.gl||this.gl.isContextLost?.())return;let n=document.createElement("canvas");n.width=this.width,n.height=this.height;let r=n.getContext("2d"),o=n.width,i=n.height;if(this.artwork)this.artwork(r,{width:o,height:i,dpr:this.dpr,scene:e});else{let g={aurora:["#d3e8e3","#badde8","#9db7dc","#929ee0","#d3b4d2","#eccbc1"],sunset:["#f2dfbd","#f5cdaf","#e7a59c","#c387a2","#9f89b2","#dcb9c3"],ocean:["#326975","#286d85","#225879","#293e68","#4a5486","#7184a3"]};if(e==="grid"){r.fillStyle="#e8ebef",r.fillRect(0,0,o,i),r.lineWidth=this.dpr;let b=34*this.dpr;for(let u=0;u<o;u+=b)r.strokeStyle=Math.round(u/b)%4===0?"#a1acbb":"#c4cbd5",r.beginPath(),r.moveTo(u,0),r.lineTo(u,i),r.stroke();for(let u=0;u<i;u+=b)r.strokeStyle=Math.round(u/b)%4===0?"#a1acbb":"#c4cbd5",r.beginPath(),r.moveTo(0,u),r.lineTo(o,u),r.stroke()}else{let b=g[e]||g.aurora,u=r.createLinearGradient(0,0,o,i);u.addColorStop(0,b[0]),u.addColorStop(.5,b[1]),u.addColorStop(1,b[5]),r.fillStyle=u,r.fillRect(0,0,o,i);let x=($,h,D)=>{let f=new Path2D;f.moveTo(-o*.1,i*(.98+$)),f.bezierCurveTo(o*.13,i*(.39+$),o*.48,i*(.86+$),o*1.1,i*(-.32+$));let S=new Path2D(f);S.lineTo(o*1.15,i*1.4),S.lineTo(-o*.1,i*1.4),S.closePath();let y=r.createLinearGradient(o*.05,i*.1,o*.87,i*.92);y.addColorStop(0,h),y.addColorStop(.48,D),y.addColorStop(1,b[5]),r.save(),r.shadowColor=e==="ocean"?"#0b23484a":"#38486830",r.shadowBlur=27*this.dpr,r.shadowOffsetY=-7*this.dpr,r.fillStyle=y,r.fill(S),r.restore(),r.save(),r.clip(S),r.filter=`blur(${15*this.dpr}px)`,r.strokeStyle=e==="ocean"?"#bce9ff24":"#ffffff45",r.lineWidth=37*this.dpr,r.stroke(f),r.filter="none",r.strokeStyle="#ffffff25",r.lineWidth=1.2*this.dpr,r.stroke(f);let k=r.createLinearGradient(0,i*(.25+$),o*.7,i*(1.08+$));k.addColorStop(0,"#ffffff00"),k.addColorStop(.45,"#ffffff00"),k.addColorStop(.72,"#324e7e13"),k.addColorStop(1,"#ffffff1c"),r.fillStyle=k,r.fill(S),r.restore()};x(-.31,b[1],b[2]),x(-.1,b[2],b[3]),x(.18,b[3],b[4]),x(.44,b[4],b[5]);let R=r.createRadialGradient(o*.12,i*.08,0,o*.12,i*.08,o*.85);R.addColorStop(0,"#ffffff55"),R.addColorStop(1,"#ffffff00"),r.fillStyle=R,r.fillRect(0,0,o,i)}let d=Math.min(o*.265,i*.3);r.textAlign="center",r.textBaseline="middle",r.font=`300 ${d}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`,r.fillStyle=e==="grid"?"#596578":"#ffffff75",r.fillText("hello.",o*.47,i*.49)}let c=this.gl;c.bindTexture(c.TEXTURE_2D,this.textures.art),c.pixelStorei(c.UNPACK_FLIP_Y_WEBGL,!0),c.texImage2D(c.TEXTURE_2D,0,c.RGBA,c.RGBA,c.UNSIGNED_BYTE,n),c.pixelStorei(c.UNPACK_FLIP_Y_WEBGL,!1),this.invalidate()}set(e){let n=this.settings.scene;Object.assign(this.settings,e),e.scene&&(e.scene!==n||this.artwork)&&this.setScene(e.scene),this.invalidate(400)}setMotionSource(e){this.motionSource=e,this.invalidate()}invalidate(e=0,n=!0){this.destroyed||this.suspended||this.lost||(this.dirty=!0,n&&(this.rectDirty=!0),this.animatingUntil=Math.max(this.animatingUntil,performance.now()+e),this.frame||(this.frame=requestAnimationFrame(r=>this.render(r))))}readGeometry(){let e=this.stage.getBoundingClientRect(),n=this.dpr,r=new Map,o=d=>{if(!d||d===this.stage)return new DOMMatrix;if(r.has(d))return r.get(d);let b=getComputedStyle(d).transform,u=b==="none"?new DOMMatrix:new DOMMatrix(b);u.e=0,u.f=0;let x=o(d.parentElement).multiply(u);return r.set(d,x),x},i={"xy-field":-1,"optical-well":0,tab:0,note:1,panel:2,dock:3,small:4,"switch-track":4,thumb:5,"slider-thumb":5,selected:6,free:7,"optical-lens":7,menu:8},c=d=>{let b=0;for(let u=d.parentElement;u&&u!==this.stage;u=u.parentElement)u.dataset.glass&&b++;return b},g=d=>{let b=e.left,u=e.top,x=e.right,R=e.bottom;for(let $=d.parentElement;$&&$!==this.stage;$=$.parentElement){let h=getComputedStyle($),D=$.dataset.lgClip==="true",f=D||/^(auto|scroll|hidden|clip)$/.test(h.overflowX),S=D||/^(auto|scroll|hidden|clip)$/.test(h.overflowY);if(!f&&!S)continue;let y=$.getBoundingClientRect(),k=y.left+$.clientLeft,v=y.top+$.clientTop;f&&(b=Math.max(b,k),x=Math.min(x,k+$.clientWidth)),S&&(u=Math.max(u,v),R=Math.min(R,v+$.clientHeight))}return{left:(b-e.left)*n,right:(x-e.left)*n,bottom:(e.bottom-R)*n,top:(e.bottom-u)*n}};this.geometry=[...this.stage.querySelectorAll("[data-glass]")].filter(d=>d.getClientRects().length&&getComputedStyle(d).visibility!=="hidden").sort((d,b)=>c(d)-c(b)||(i[d.dataset.glass]??0)-(i[b.dataset.glass]??0)).map(d=>{let b=d.getBoundingClientRect(),u=getComputedStyle(d),x=d.dataset.glass,R=d.offsetWidth,$=d.offsetHeight,h=Math.min(parseFloat(u.borderTopLeftRadius)||24,R/2,$/2)*n,D=o(d),f=D.a*D.d-D.b*D.c,S=Math.abs(f)>.001?[D.d/f,D.b/f,D.c/f,D.a/f]:[1,0,0,1],y=1;for(let v=d;v&&v!==this.stage;v=v.parentElement)y*=Number(getComputedStyle(v).opacity);let k=Number(u.getPropertyValue("--glass-selection"))||0;return{el:d,kind:x,opacity:y,selected:k,x:(b.left-e.left)*n,y:(e.bottom-b.bottom)*n,w:b.width*n,h:b.height*n,r:h,localW:R*n,localH:$*n,inverse:S,clip:g(d)}}),this.rectDirty=!1}use(e,n=[0,0,this.width,this.height]){let r=this.gl;r.useProgram(e.p),r.bindVertexArray(this.vao),r.bindBuffer(r.ARRAY_BUFFER,this.buffer);let o=r.getAttribLocation(e.p,"aPosition");r.enableVertexAttribArray(o),r.vertexAttribPointer(o,2,r.FLOAT,!1,0,0),r.uniform2f(e.uniforms.uResolution,this.width,this.height),r.uniform4fv(e.uniforms.uQuad,n)}render(e){if(this.frame=0,this.destroyed||this.suspended||this.lost||!this.gl||document.hidden||!this.visible)return;let n=this.lastTime?Math.min((e-this.lastTime)/1e3,.05):.016;this.lastTime=e,this.settings.motion&&!this.reducedMotion&&(this.time+=n);let r=this.reducedMotion?1:1-Math.exp(-n*13);this.smoothPointer.x+=(this.pointer.x-this.smoothPointer.x)*r,this.smoothPointer.y+=(this.pointer.y-this.smoothPointer.y)*r,(this.rectDirty||e<this.animatingUntil)&&this.readGeometry();let o=this.gl,i=this.programs,c=!1;o.viewport(0,0,this.width,this.height),o.activeTexture(o.TEXTURE0);let g=this.targets[0],d=this.targets[1];if(o.bindFramebuffer(o.FRAMEBUFFER,g.framebuffer),o.bindTexture(o.TEXTURE_2D,this.textures.art),this.use(i.background),o.uniform1i(i.background.uniforms.uArtwork,0),o.uniform1f(i.background.uniforms.uTime,this.time),o.uniform1f(i.background.uniforms.uAnimate,this.reducedMotion?0:1),o.uniform1f(i.background.uniforms.uGrid,this.settings.scene==="grid"?1:0),o.uniform1f(i.background.uniforms.uBrightness,this.settings.brightness),o.drawArrays(o.TRIANGLES,0,6),!this.settings.opaque)for(let u of this.geometry){let x=36*this.dpr,R=Math.max(0,u.clip.left,Math.floor(u.x-x)),$=Math.max(0,u.clip.bottom,Math.floor(u.y-x)),h=Math.min(this.width,u.clip.right,Math.ceil(u.x+u.w+x)),D=Math.min(this.height,u.clip.top,Math.ceil(u.y+u.h+x)),f=h-R,S=D-$;if(f<=0||S<=0)continue;o.bindFramebuffer(o.READ_FRAMEBUFFER,g.framebuffer),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,d.framebuffer),o.blitFramebuffer(0,0,this.width,this.height,0,0,this.width,this.height,o.COLOR_BUFFER_BIT,o.NEAREST),o.bindFramebuffer(o.FRAMEBUFFER,d.framebuffer),o.bindTexture(o.TEXTURE_2D,g.texture),this.use(i.lens,[R,$,f,S]);let y=i.lens.uniforms;o.uniform1i(y.uScene,0),o.uniform4f(y.uBox,u.x,u.y,u.w,u.h),o.uniform1f(y.uRadius,u.r),o.uniform1f(y.uScale,this.dpr),o.uniform2f(y.uLocalSize,u.localW,u.localH),o.uniformMatrix2fv(y.uInverse,!1,u.inverse);let k=Yt(u.el,e,this.reducedMotion),v=k?.deformation||this.motionSource?.optics(u.el)||{bend:[0,0],pressure:0,energy:0};o.uniform2f(y.uBend,v.bend[0]*this.dpr,-v.bend[1]*this.dpr),o.uniform1f(y.uPressure,v.pressure),o.uniform1f(y.uEnergy,v.energy),o.uniform2f(y.uPointer,this.smoothPointer.x,this.smoothPointer.y);let T=u.kind==="switch-track",a=u.kind==="thumb";o.uniform1f(y.uRefraction,this.settings.refraction*(T?.12:a?.45:1)),o.uniform1f(y.uBlur,this.settings.blur),o.uniform1f(y.uDispersion,this.settings.dispersion*(T||a?.2:1));let p={panel:.14,dock:.095,small:.12,thumb:.83,"switch-track":.06,"slider-thumb":.18,selected:.19,tab:.18,note:.09,free:.012,menu:.6,"optical-lens":.012,"optical-well":.055}[u.kind]??.13;o.uniform1f(y.uTint,p),o.uniform1f(y.uDark,this.settings.scene==="ocean"&&!a?1:0);let l=T&&this.motionSource?.toggleProgress(u.el.parentElement)||0;o.uniform4f(y.uAccent,T?.38-l*.22:.25,T?.45+l*.17:.51,T?.54-l*.17:.87,T?.48+l*.34:u.selected*.17),o.uniform1f(y.uOpacity,u.opacity*(k?.opacity??1));let M=k?.kind===1&&k.wave&&k.fill>0&&(!this.reducedMotion||k.forceMotion);c||=!!M,o.uniform1f(y.uOpticKind,k?.kind||0),o.uniform4f(y.uOptic,k?.fill||0,k?.complete||0,k?.selected||0,k?.hover||0),o.uniform3fv(y.uEmission,k?.color||[.32,.73,.51]),o.uniform1f(y.uFlow,k?.flow??-1),o.uniform1f(y.uZoom,k?.zoom||1),o.uniform1f(y.uWaveTime,M?e*.001:0),o.uniform1f(y.uCompare,this.settings.compare?1:0),o.uniform1f(y.uHover,u.el.matches(":hover")?1:0),o.drawArrays(o.TRIANGLES,0,6),[g,d]=[d,g]}o.bindFramebuffer(o.FRAMEBUFFER,null),o.bindTexture(o.TEXTURE_2D,g.texture),this.use(i.copy),o.uniform1i(i.copy.uniforms.uScene,0),o.drawArrays(o.TRIANGLES,0,6),this.dirty=!1,(this.settings.motion&&!this.reducedMotion&&this.settings.scene!=="grid"||c||e<this.animatingUntil)&&(this.frame=requestAnimationFrame(u=>this.render(u)))}destroy(){this.destroyed=!0,cancelAnimationFrame(this.frame),this.abort.abort(),this.resizeObserver.disconnect(),this.mutationObserver.disconnect(),this.intersectionObserver.disconnect(),this.gpuLease?.destroy();let e=this.gl;e&&(Object.values(this.programs||{}).forEach(n=>e.deleteProgram(n.p)),Object.values(this.textures||{}).forEach(n=>e.deleteTexture(n)),(this.targets||[]).forEach(n=>e.deleteFramebuffer(n.framebuffer)),e.deleteBuffer(this.buffer),e.deleteVertexArray(this.vao),e.getExtension("WEBGL_lose_context")?.loseContext())}};var rt="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAaIA60DASIAAhEBAxEB/8QAHAABAAEFAQEAAAAAAAAAAAAAAAEDBAUGBwII/8QAUxAAAQMDAQUFBQUFBAgFAgMJAQACAwQFESEGEjFBURMiYXGBBxQykaFCUmKxwRUjM3LRJEOCkhY0U2OisuHwJURzwvEXVDVkdJPSJjY3g+JFs//EABoBAQADAQEBAAAAAAAAAAAAAAABAgMEBQb/xAAwEQEBAAICAgIBBAEDBAMAAwAAAQIRAyESMQRBURMiMmFxFEKxIzOBkaHR8FLB4f/aAAwDAQACEQMRAD8A77yRAiCVClQgIpUICIiAiIgIiICckRARSoQEREBERACIiAiIgIiICIiAiIgJ4IiAiIgJyREBERAREQEREBOSIgIiICIiAiIgIiIHFE6ogIilBCKVCAiIgKUUICBEQSoUqEBERARSoQE5IiAiIgIiICBEQEUqEBERAREQEREBEQIClQpQQiIgIiICIiAiIgIiICIiCVClQgIiICIiCVCIgIiICIiAiIgIiIJUIiAiIgIiICIEQFKhEBERAREQECYRAREQEREBERARFKCERAgIiICBEQEREBERAREQEREBECICIiAEREBERAREQSoREBERAROaICIiAiIgIiIHNERAREQEREBSoRAREQEREBERAREQEQIgIiICIiAiIgIiICIiApUIgJ4IiAiIgIiIAREQSoREBECICIiAiIgJyREBERAREQEREBAiICKVCApUKUBQiIHNE5ogIiICIiAiIgKVCICIiBzREQEREBERAREQEREBERAREQEREBERAQIiAiIgIiICIiAiIgIiICIiAiIgInJEBERAREQEREBERAROSIAREQERAgBSoRARE5ICIiCVCIgIiICIiAgREBERAREQEREBERAREQFKhSghERAREQAiIgIiICIiAiBEBERAREQETkiAiIgIiICIiAiIgIiICIiAilQgIiIHNERARAiAiIgIpUICKVCAnJEQETmiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiBA5IiICInJAREQETkgQEREBERARE5oCIiAiIglQiICcERAREQEREBERAUqFKCEREBERAREQEREBERAQIiAiIgIiIClQiAilQgIiICIiAiIgIiICIiAiIgIiICIgQEREBERAREQEREBERAREQSoRSghERAClQiAgREBERAREQEREBERAREQEREBOSIgIiIJUIiAnJEQEREBERAREQEREDkiIgIERARFKCEREBERAREQE5IiAiIgJyREBERAREQOSIiAickHBAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAUqEQEREBERAREQAiIgIiICIiAiIgIiICIiAiJlACIiAEREBERAREQEREBEQICIiAiIgcEREBERAREQEREBETkgIiICIiAiIgIiICIiAiIgIilBHJEUoIRSoyEBSvJOFG+eQyg9ovG8eh+SkOzzQSiZAPFEBERAREQEREBERAROaICIiAiIgKVCICIiAiIEBE5IgIiICIiAiIgIiICIiAiIgInJEBERAREQEUqEBERATkiICIiByQIiAiIgIiICIiAiIgIiICIiAiIgJyREBERAREQEREBERAREQFKhSghERAREQEREBAiICIiAiIEBERAwiIgIiICIiAgREBERARECAiIgIiZQFBcM4WD2h2ptGzFK2e5VO49+kUEY35ZT0Y0an8ly29bd7QX8uip5HWWhOnZwuDql4/E/gzybqtOPiyzv7YrcpPbp992ysWzQxcrjFHKfhp2d+V3kwarRa/2s1tQ8ts1hLGZ0nuUvZ5//ALbcn5rnglt1rlLd9raiQ64JkmkPjxcVlaOy7TXTDrds1WujdqJatwp2Hx72q6ZwcWH/AHMlPPK/xjI1O2e2NYTv32KlafsUVI0Y/wATslWL7pfZh+92lvLz4VAYPkAstD7ONtKluXyWSj/mkfKR8gqw9le1o/8A93ZienusmPzVpn8eeojXJWAjrryx3c2ivbT/APrCfzCuotptraB29T7SVEn4KyFkzT+RWQm9n+2dGMtp7TX45QVDonHyDhhYiWpqrK8Nv9lrbazlNNFvx/525HzV5fj5dK39SNrtftPvcABvFkjrIRgGe3OIePHs3cfQroFg2otO0lO6a2VbZdz+JE4FskR6OYdQuW09RT1FK2WKaOSEjIexwLT6rGVTqf3xlXSVT6W4Rfw6uA4e3wPJw6tKpn8WX+BjzX7d/ByEWj7FbbG8vNqurWQ3eJm80x6R1TB9tnQ9W8vJbwDkLhyxuN1W8u/QiIoSckREBERARE5oHJERAREQEROSAiIgIiIJUIiAiIgIiICIgQEREBAiICIiAiIgIiICIiAiIgIiICIiAiIgIic0BERATkiICIiAiIgIiICIiAiIgIiICIiAiIEBFKhAREQERMIClQiAiIgInJEBERAREQETkiAiIgIiICIiAickQEREBERAREQERAgIpUE4QCcLn22PtCZap5bTZRHVXVoxLI/WGkzzeR8TujB64WP2129kfU1FjsFRuvjJZWV7NexPOOPkX9Twb5rT9mNk7htQQ22f2K0sce0uD272+c69kD8burzp5rfj4przz9f8qXLvUYmR09Tcy9xq7peqnm1u/PJ4ADRjPDQea3Oy+y27XLdl2hrTbqd2vuVC7MpHR8vLyauj7PbK2nZqkdDbabce/wDizyHellPVzuJ8uCzuBzTPntnjj1CYT7YCxbH2LZqPdtVsggd9qbd3pHHqXnVZ7dBGqlFgujcCbgUqUHjcCpvibLG6N7GuY4Yc1wyCPEKspGiDnN/9l1FO6St2cey017tXRgZppz0ezl5tXKattZRXKa3XOldSV8Or4XHII5OY77TT1X02cdFqm2ux1LtbauzLhBcIMvo6oDWJ/Q9WngQujh58uO6vpTLCVw41FQ10UlNMYquB4lpphxjkHD0PAjmCu/7JX+LaXZukubWiN8rcSxf7ORpw9voR8sL55YyeOaemq4TBWU0hhqIT9h46eB4g9Cum+yCvMdTebU493eZWRjpvDdf9Q1b/ACsZljOSK8fV06siIuBqBFKhAREQEREBERAREQEREEqFKhAREQEREBSoRAREQEREBERAUqEQETkiAiIgIiICIiAiIgIiICIiAiJyQEQIgBERAREQETkiAiIgIiICKVCAiIEAIiICIiByREQEREBERAREQEREBETkgckQIgIiICIiAiIgIiICIiAiIgIiICIEQEREBERAREQCcDK5t7RdspKMP2ftM/Z1z496sqmnHukR6Hk9w4dBr0Ww7b7Ut2XshliY2a4VLuxooCdHydT+Fo1Py5rm2wmxz9p53XW7PfUWvtjI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Mmm9qO3dHwD5aaob/ij1W+rO+2+PoQIihIiIgIiIC0faPdrPaRsfb3atZPNWO8Ozidj6uC3haTTj3721PyMtt9nJB6PlkA/JpUz3C3WNdDGgROSLRziIiAiIgLVvaOze9nG0Y/8AyEp+QJW0rXtu2dp7P9om9bdP/wAhQVLE7fsNA7rAw/8ACFkFidlnb+ytqd1pIj/wBZZZR033UoiKUChEQERFALR62P3n222Fo19ztdTO7w3iGfqt4Wk2UGu9sl/qm6tobZT0hPRz3l/5BTj7Vy/jXQ1KhFoxEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEQIEBERAREQEUoghETmgIiIHJERAREQEREBETkgIiICIiAiBEBERAREQEREEqERAREQEREBERAREQEREBERAREQEREBERAREQEREAIeBREHOAw2/241QOjLlZ2PB6ujfg/Qhb0tL21b7jt7sbdBo1809DIeu+zeaPmxbryVL7bY/xiEROSqsIoUoCIEQSVpWxRNXt9tnXnUMmpqRh8GsLj9XBbm926xx6Bah7LGmW03qvcNau9VMgPVrSGD/lVsfauf8W/KERXYilQpQFClQgLC7Xt3tir43rQTD/gKzSxW07d/ZS8N60Uw/4CgxWxj9/Ymyu60UJ/4As6tc2CdvbAWE//AJGH/kC2NZR033RERECIikERFAZxqtO9mjDVybS3w5zcLtI1h6xxAMb9d5Z3aS5Ms2zdyuLzgU9O9/qAcKh7PbY+07BWajkz2gpmyyZ478mXu+rlbFXP02hERXYiIiAiIgIiIHNERARE5ICIiAiIgIiICIiAiIgIiICIiAiIgckREBERAROSICIiAiIgIiICIiAiIgIiICIpQQilQgIiICIiAiIgIiICIiAiIgIiICIiAilEEIiICIiAiIgIiICIiAEREBERAREQEREBERAREQaP7VYi3Y4XJgJfa6ynrRjjhsgDv+ElbPDI2aFkjDlrmgg+C87Q25t32duVtcAfe6aSHXq5pA+q1z2d3N112FtU8hzK2BsUn8ze6fqFTJrx+q2lFCKq6UUIglERBbXGYU9vqZjwZG53yCwHsoidH7NrO54788b6h3iXyOd+RCr7dVRothr1UA4LKOTB8d04WU2RpRRbHWWmxjsqGBp89wZ+qtgpyeozSIpV2SEUogKERAWPvzd7Zy5jrSyj/hKyCsb3/wDgNw//AE0n/KUGtez059n1hP8A+Si/5QtmWr+zk59nVhP/AOTj/JbQsnTfYiIiBERSClQpCDSPaOTcKW0bNRuIfeK+OF+7xETTvSHywF0FgAYAAABwA5Bc+oWm++2GrqPip7DQiBhzwnm1P/APquh8ArYzplne9CIisoIiICIiAiIEBERAREQEREBERAREQEREBERAREQOSIiAgREBERAREQFKhEEqERARFKCEREBERAREQEREEooUoIRSoQEREBERAREQEREBEQICIiAiIgIiICIiAiIgBERAREQFKjkiAiIgIiICIiAiJ1QEREBERARFKCD8JXOdgGfs267UWPG62juUj4m9I5MSN/5iuik8uq5jRXq3v9stcygnE8VbQMEsjAdzt4nFpaHcHENc3OOCrl6acfvToShSio0EUKUBERBpXtYm7L2d3Fg4zbkI/wATgP1W+08Yigjib8MYDB5AYXNva1UxRbNUTJ37sUlxpw84J7okBOg8AuhW64UdzomVlDUxVNPL3mSRO3gQr4Kcn0vERFZkIiICIiArC+nGz1yPSll/5Sr9YnaiTstkrzJ92imP/AUGv+zj/wDpzYf/ANHH+S2kLWvZ63d9n1hH/wCSj/5QtlWTpvsRSoUoERAoBUqupjoqOaqlcGxwxl7ieQAyqy0r2l1Up2cistK7FZeqmOgiHg498+jcoK/suo5DsxJeqlpFVeqmSvfvDUNccRj0aB81vataGmioaKClgbuwwRtijHRrRgfQK5WrC3d2IiIgREQEROSAiIgIiIAQIpQQiIgckREBERAREQEREBFKhA6oiIGUROSAiIgIiICIiAiIgIiICIiAiIgIiICIiCUUdU5IJ5KFKhAREQEREBERAREygIiICIiAiIgIiICIiAiIgIiICckRA5IiICInJAREQE5IiAiIgIiICIiAiIg0fbepraqutmztJI+CK4NmlqpY3YkdDGBvRsPIu3hk8cArA3XsbY2zVNPHHDDQ1TIwxjd1rGSDcIA8y1bVt5b6qS0QXe2xl9ys8wrIGDjK0AiSP/EwuHnhWtws9q292ZBp6p9OKyJksVRDjPJzcjgcEa+St/tsX48vG7bLFIJYmvHMZVRaxHfY9nGwUe0VRDTzSaRzMyY5CNCRzHkeC2SORksbZI3tfG8Za9pyHDwP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3yLsKhto43jbTZjZp3+qyPkuFS3k8RfA0+G8c+i3qOEQxho5KfSZ0wE0D4HlrxjoeRVqWkvzz681tEkbJmFj2hwWPfackmJ4x0crTL8rysO+CORo325xwIJBHkRqvLYpWN3WV9c1v3RPn8wSso61z8O780Zan5/eSADwGVPlDpg56GKU/wBodLUeE0rnj5cFgLnTi4bcbJWaNrWwxTyXGVjRhu7GMN0HiVvk1NFGBDG3ee44LjqVqZgNu9rllllwGVduqKVhPJ7XB+PUJb0i+nSGju6jVSpHAIs1EIiICYREBERAREQEREBERAREQE5IiAiIgImEQEREBERAREQEREBERAREQEREDkiIgIiICInNAREQEREBERAREQETkiAiIgIiICIiAnVSiCFKhEBERAwiIgIiICBEQEREBERARSoQEREBERAQcERAREQEREBECICIiBzROSICckTkgs7rWNt1orK53w00L5T5NaT+i+QAXmyQmQ5lqXOmeepcSf6L6g9pdSaP2bbQyNOCaJ7B/i7v6r5oni3YqKIDRtOwfRdPx53arXT/AGLxRm03gho7WKsB3uYa9jTj5tXZsGWjYDxLQuH+xapEd6utvcf9ZpY5B5sc5p+jgu7NAAAA0GgWXJ1lpeelOGARjJ1KqkYUhQdFmIUhoIIIyF5zqvfJBr+1ds/aWz1fQuB3J6WWMEeLSvewleLnsJY6oHJdQxB38zRun6grNVADqZ4OowtL9lMpi2ZrbW7T9mXOqpAOjd/fb9Hqfo+m+IiKECIpQQpRQdASg5ztCDF7Z9mJG/3tuqmH0wV0CV7RHlxxkLn8TTfPa/cKkOLoLJRMo4+gml7z/k3C3csdLIeTRoMqUxMbHEb0bjjxVUOe0agIxgaNCV71wiXkStccc1QnkdktaF6mBaN7GvUJDNvndcNeSCnTwFrxI7jyC07bPEm3GxMMOtULlJKQOIiEZDj5cFvMsggj3uJOjR1K+c9pttJJPavFeaaY+7Weqjpm4Oj2E4lPkSfopktRa+lRwReI3B7A5py06gjmOS9qqEqERAREQEREBERAREQEREBERAREQEREBERAREQEREAoiICIiAiBEBERBKhEQEREBECICInJAREQEREBERAREQAiIgIiICIiAiIgIiIJUKUQQiIgIgRAREQEREBERARFKCEREBERAREQEyiICIiA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ICIiAiIgInJEBERAREQECIEBERAREQEREBERAREQEREAIiICInJAREQETkiAickQEREBERAREQEREBERAREQEREBERAREQEREBAiICIiAiJwQEREBERBKhAiCVCIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAickQAiIgIiICIEQEUqEBERAQJyRAREQEREBERAREQEREBERAREQERSghERAREQEREBERARFKAoREBERAREQEREBERAREQECIgIiICIiAiIgIiICIiAiIgIickBAiICInJAREQEREBECICIiAiIgIiICIpQQnJEQOKIiAgREBERAREQEREBERAREQEREBERAREQEROSAiIgIiICImUBERARSoQECIgIiICIEQEREAIgRAREQEREDkiIglQiICInJAQIiAiIgIiICIiAiIgIiICIiAiIgIiBAREQOSIiAEREBERAREQEREBERBKhEQEREBERAREQEREBERAREQEREBERAROSICJyRAREQETmiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgckREBERAREQEREBERAREQEREBECICIiAEREBERAREQEREDkiIgJyREDkiIgIiICIiAiIgIiICIiAiIgdUQIgIiICIiAiIgIiICIiAiIgIiICIiAiIgJyREBERAREQEREBE5IgIiICIiAnJE5ICIEQEREBERAREQEREAIiICckRARFKCEROKAiIgIiIHJERA5IiICIgQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEUqEBERAREQEREBERACIEQERAgIiICJhEBERAREQEREDkiIgIiICIEQEREBERAREQEREBERARSoQEREBETkgIiICIiAickQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBAiICckRAREQEREBERAREQEREBERAREQEREBE5IgIiICIgQEREAIiICIiAiIgIiICIiAickQE4lE/ogaKEKIJ5IEH6IgIiICIpQR6opTqghFPBOiCEU+iYQQinkiCEUp6IIRSmEEIp9EwghSiIGihShQQiIgIiICIiAiIgIiICInJAREQEREBERAREQEREBERAREQEREBAiIHJERAREQEREBERA4oiICIiBhERAREQEQIgck5IiByRE5ICIiAiIgIiICIiAiIEBERAREQOSIiAiIgIiICInJAREQOSIiAiIgIiICJyTkgIiICIiAmERAQcURBGEwvWfBRw5IA4FEJyiAiIgKVCIJ0yijKIHJSFCIJ9UUIgKSoRBKKECCUUIgn1UIiCUyoRBJGqclCICKUQQnJEQEREBERAQIiAiIgZREQEyiIHNERAREQEREBERAREQE5IiBlERAREQEREBERAyiIgIiICIiBzREQEREBMoiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICckRAREQMoiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICcERATkiICIiAmURB/9k=";async function Ze(t,{vector:e=!1}={}){return xo(t,{vector:e})}var ot=(t,e=0,n=1)=>Math.max(e,Math.min(n,t)),le=(t,e,n)=>t+(e-t)*n,Ue=(t,e,n)=>{let r=ot((n-t)/(e-t));return r*r*(3-2*r)},Ce=184327,De=()=>(Ce^=Ce<<13,Ce^=Ce>>>17,Ce^=Ce<<5,(Ce>>>0)/4294967296),nt=48;async function xo(t,{vector:e=!1}={}){let n=new Image;n.src=t,await n.decode(),Ce=184327;let r=e?Math.min(768/n.naturalWidth,768/n.naturalHeight):576/n.naturalWidth,o=Math.max(1,Math.round(n.naturalWidth*r)),i=Math.max(1,Math.round(n.naturalHeight*r)),c=document.createElement("canvas");c.width=o,c.height=i;let g=c.getContext("2d",{willReadFrequently:!0});g.drawImage(n,0,0,o,i);let d=g.getImageData(0,0,o,i).data,b=new Uint8Array(o*i),u=new Int32Array(o*i),x=0,R=0,$=U=>{let A=U*4,w=d[A],O=d[A+1],q=d[A+2];return Math.min(w,O,q)>232&&Math.max(w,O,q)-Math.min(w,O,q)<28},h=U=>{U>=0&&U<o*i&&!b[U]&&$(U)&&(b[U]=1,u[R++]=U)};if(!e){for(let U=0;U<o;U++)h(U),h((i-1)*o+U);for(let U=0;U<i;U++)h(U*o),h(U*o+o-1);for(;x<R;){let U=u[x++],A=U%o;A&&h(U-1),A<o-1&&h(U+1),U>=o&&h(U-o),U<o*(i-1)&&h(U+o)}}let D=U=>!b[U]&&d[U*4+3]>16,f=o,S=i,y=0,k=0,v=0;for(let U=0;U<i;U++)for(let A=0;A<o;A++)D(U*o+A)&&(f=Math.min(A,f),y=Math.max(A,y),S=Math.min(U,S),k=Math.max(U,k),v++);if(v<4)throw new Error("SVG \u4E2D\u6CA1\u6709\u53EF\u89C1\u56FE\u5F62\uFF0C\u8BF7\u68C0\u67E5\u586B\u5145\u3001\u63CF\u8FB9\u6216\u900F\u660E\u5EA6");let T=[],a=v>=72e3?2:1;for(let U=S;U<=k;U+=a)for(let A=f;A<=y;A+=a){let w=U*o+A;if(!D(w))continue;let O=w*4,q=d[O]/255,m=d[O+1]/255,N=d[O+2]/255,s=(A-f)/Math.max(1,y-f),E=(U-S)/Math.max(1,k-S),C=b[w-1]||b[w+1]||b[w-o]||b[w+o],V=0;for(let L of[w-2,w+2,w-o*2,w+o*2])if(L>=0&&L<o*i){let F=L*4;V=Math.max(V,(Math.abs(d[O]-d[F])+Math.abs(d[O+1]-d[F+1])+Math.abs(d[O+2]-d[F+2]))/765)}let Z=1+(!e&&s>.3&&s<.66&&E>.1&&E<.33?2.2:0)+V*7+(C?2:0);T.push({x:s,y:E,r:q,g:m,b:N,alpha:d[O+3]/255,edge:C?1:0,priority:Math.pow(De(),1/Z)})}T.sort((U,A)=>A.priority-U.priority);let p=T.slice(0,42e3).map((U,A)=>({...U,index:A,s1:De(),s2:De(),s3:De(),ambient:0})),l=Array.from({length:nt},(U,A)=>({x:De(),y:De(),r:.42,g:.61,b:.96,index:A,s1:De(),s2:De(),s3:De(),ambient:1})),M=document.createElement("canvas");if(M.width=y-f+1,M.height=k-S+1,!e){for(let U=0;U<b.length;U++)b[U]&&(d[U*4+3]=0);g.putImageData(new ImageData(d,o,i),0,0)}return M.getContext("2d").drawImage(c,f,S,M.width,M.height,0,0,M.width,M.height),{points:[...l,...p],ratio:M.width/M.height,count:p.length,detail:M}}function Jt(t,e,n){let r={progress:0,target:0,budget:6400,budgetTarget:6400,view:1,light:0,lightTarget:0,time:0,width:1,height:1,dpr:1,ready:!1,disposed:!1,visible:!0,mode:"",frames:0,maxPoints:0,artwork:"default",quality:"low"},o=n.matchMedia("(prefers-reduced-motion: reduce)"),i=e.createElement("canvas"),c=null,g=[],d=0,b=0,u=0,x=[0,0,1,1],R=[0,0,1,1],$=null,h=null,D={width:1,height:1,bottom:1},f=null;i.setAttribute("aria-hidden","true"),t.append(i);let S=s=>Ue(.5,1,s),y=s=>.01+.99*Math.pow(ot(s),.9),k=(s,E)=>Ue(0,.16+.84*E,s),v=()=>{};function T(s,E,C){let V=k(E,s.s3),_=1-V,Z=(s.s2+C*(.018+.012*s.s3))%1,L=s.s1*Math.PI*2+Math.sin(C*.05+s.s2*6)*.1,F=.84+.46*s.s2,B=[R[0]+Math.cos(L)*R[2]*F,R[1]+Math.sin(L)*R[3]*F],P=[x[0]+s.x*x[2],x[1]+s.y*x[3]],K=V+_*(.03+.36*Z)*(1-Ue(.4,.85,E)),ee=B[0]-P[0],re=B[1]-P[1],ae=Math.hypot(ee,re)||1,se=Math.sin(Math.PI*K)*(s.s3-.5)*Math.min(R[2],R[3])*.65;return{x:le(B[0],P[0],K)-re/ae*se,y:le(B[1],P[1],K)+ee/ae*se,origin:B,gathered:V,phase:Z,fade:le(Ue(0,.1,Z)*(1-Ue(.86,1,Z)),1,V)}}let a=`#version 300 es
precision highp float;
in vec2 a_pos;in vec3 a_color;in vec4 a_data;in vec2 a_extra;
uniform vec2 u_view;uniform vec4 u_rect,u_field;uniform float u_progress,u_time,u_budget,u_light,u_chat,u_dpr,u_still,u_custom;
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
float streamFade=mix(smoothstep(0.,.1,phase)*(1.-smoothstep(.86,1.,phase)),1.,gathered);
float population=u_budget*(.01+.99*pow(p,.9));float alpha=1.-smoothstep(population-32.,population+32.,idx);
float lightness=dot(a_color,vec3(.2126,.7152,.0722));
vec3 darkColor=a_color*.96+vec3(.035,.04,.05);
if(u_custom>.5)darkColor=mix(vec3(.52,.70,1.),darkColor,smoothstep(.05,.26,lightness));
darkColor=mix(vec3(.50,.72,1.),darkColor,gathered);
vec3 lightColor=mix(vec3(.17,.32,.64),mix(a_color,vec3(.57,.63,.74),smoothstep(.85,1.,lightness)*.12),gathered);
vec3 color=mix(darkColor,lightColor,u_light);
alpha*=mix(.72,1.,gathered);alpha*=mix(1.,.78,u_chat);alpha*=a_extra.y*streamFade;
alpha*=1.-smoothstep(.5,1.,p);
float size=mix(2.1,3.7,gathered)*mix(mix(.76,1.22,s3),mix(.94,1.06,s3),gathered);
if(ambient>.5){pos=origin;alpha=(.10+.13*s3)*(.35+.65*p)*(.8+.2*sin(time*.45+s1*23.));color=mix(vec3(.45,.64,.98),vec3(.28,.40,.60),u_light);size=1.3+1.1*s3;}
vec2 clip=pos/u_view*2.-1.;gl_Position=vec4(clip.x,-clip.y,0.,1.);gl_PointSize=size*u_dpr;v_color=vec4(clamp(color,0.,1.),alpha);v_glow=gathered;
}`,p=`#version 300 es
precision highp float;in vec4 v_color;in float v_glow;out vec4 outColor;
void main(){vec2 p=gl_PointCoord*2.-1.;float r=length(p);if(r>1.)discard;float core=1.-smoothstep(.25,1.,r);outColor=vec4(v_color.rgb,v_color.a*core);}`,l=`#version 300 es
precision highp float;uniform vec2 u_view;uniform vec4 u_rect;out vec2 v_uv;
void main(){vec2 corners[6]=vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));v_uv=corners[gl_VertexID];vec2 clip=(u_rect.xy+v_uv*u_rect.zw)/u_view*2.-1.;gl_Position=vec4(clip.x,-clip.y,0.,1.);}`,M=`#version 300 es
precision highp float;uniform sampler2D u_image;uniform float u_opacity;in vec2 v_uv;out vec4 outColor;
void main(){vec4 pixel=texture(u_image,v_uv);outColor=vec4(pixel.rgb,pixel.a*u_opacity);}`;function U(){let s=i.getContext("webgl2",{alpha:!0,antialias:!1,premultipliedAlpha:!0,preserveDrawingBuffer:!1,powerPreference:"low-power"});if(!s)return null;let E=(I,j)=>{let X=s.createShader(I);if(s.shaderSource(X,j),s.compileShader(X),!s.getShaderParameter(X,s.COMPILE_STATUS))throw new Error(s.getShaderInfoLog(X));return X},C=E(s.VERTEX_SHADER,a),V=E(s.FRAGMENT_SHADER,p),_=s.createProgram();if(s.attachShader(_,C),s.attachShader(_,V),s.linkProgram(_),!s.getProgramParameter(_,s.LINK_STATUS))throw new Error(s.getProgramInfoLog(_));s.deleteShader(C),s.deleteShader(V),s.useProgram(_);let Z=E(s.VERTEX_SHADER,l),L=E(s.FRAGMENT_SHADER,M),F=s.createProgram();if(s.attachShader(F,Z),s.attachShader(F,L),s.linkProgram(F),!s.getProgramParameter(F,s.LINK_STATUS))throw new Error(s.getProgramInfoLog(F));s.deleteShader(Z),s.deleteShader(L);let B={};for(let I of["view","rect","image","opacity"])B[I]=s.getUniformLocation(F,"u_"+I);let P=s.createTexture(),K=s.createVertexArray(),ee=s.createVertexArray();s.bindVertexArray(ee);let re=s.createBuffer();s.bindBuffer(s.ARRAY_BUFFER,re);let ae=()=>{let I=new Float32Array(g.length*11);g.forEach((j,X)=>I.set([j.x,j.y,j.r,j.g,j.b,j.index,j.s1,j.s2,j.s3,j.ambient,j.alpha??1],X*11)),s.bindBuffer(s.ARRAY_BUFFER,re),s.bufferData(s.ARRAY_BUFFER,I,s.STATIC_DRAW),s.bindTexture(s.TEXTURE_2D,P),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MAG_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),s.texImage2D(s.TEXTURE_2D,0,s.RGBA,s.RGBA,s.UNSIGNED_BYTE,$)};ae();let se=44;for(let[I,j,X]of[["a_pos",2,0],["a_color",3,8],["a_data",4,20],["a_extra",2,36]]){let Q=s.getAttribLocation(_,I);Q>=0&&(s.enableVertexAttribArray(Q),s.vertexAttribPointer(Q,j,s.FLOAT,!1,se,X))}let Y={};for(let I of["view","rect","field","progress","time","budget","light","chat","dpr","still","custom"])Y[I]=s.getUniformLocation(_,"u_"+I);s.enable(s.BLEND),s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA),s.clearColor(0,0,0,0);let W=I=>{I.preventDefault(),r.disposed||(v("\u56FE\u5F62\u52A0\u901F\u6682\u4E0D\u53EF\u7528\uFF0C\u5DF2\u5207\u5230\u8F7B\u91CF\u9884\u89C8"),A())};return i.addEventListener("webglcontextlost",W),r.mode="WebGL2",{resize(){s.viewport(0,0,i.width,i.height)},update:ae,draw(){s.clear(s.COLOR_BUFFER_BIT);let I=S(r.progress);I>0&&(s.useProgram(F),s.bindVertexArray(K),s.activeTexture(s.TEXTURE0),s.bindTexture(s.TEXTURE_2D,P),s.uniform1i(B.image,0),s.uniform2f(B.view,r.width,r.height),s.uniform4fv(B.rect,x),s.uniform1f(B.opacity,I*le(1,.62,r.view)),s.drawArrays(s.TRIANGLES,0,6)),s.useProgram(_),s.bindVertexArray(ee),s.uniform2f(Y.view,r.width,r.height),s.uniform4fv(Y.rect,x),s.uniform4fv(Y.field,R);for(let[j,X]of Object.entries({progress:r.progress,time:r.time,budget:r.budget,light:r.light,chat:r.view,dpr:r.dpr,still:o.matches?1:0,custom:r.artwork==="svg"?1:0}))s.uniform1f(Y[j],X);s.drawArrays(s.POINTS,0,nt+Math.min(r.maxPoints,Math.ceil(r.budget*y(r.progress)+100)))},dispose(){i.removeEventListener("webglcontextlost",W),s.deleteBuffer(re),s.deleteTexture(P),s.deleteVertexArray(ee),s.deleteVertexArray(K),s.deleteProgram(F),s.deleteProgram(_),s.isContextLost()||s.getExtension("WEBGL_lose_context")?.loseContext()}}}function A(){c?.dispose();let s=i.cloneNode(!1);i.replaceWith(s),i=s;let E=i.getContext("2d");if(!E)throw new Error("\u6D4F\u89C8\u5668\u65E0\u6CD5\u521B\u5EFA\u7ED8\u56FE\u753B\u5E03");r.mode="Canvas 2D",r.budgetTarget=Math.min(4500,r.budgetTarget),r.budget=Math.min(4500,r.budget),c={resize(){},draw(){E.clearRect(0,0,i.width,i.height),E.save(),E.scale(r.dpr,r.dpr);let C=r.progress,V=r.budget*y(C),_=o.matches?0:r.time,Z=S(C);Z>0&&(E.globalAlpha=Z*le(1,.62,r.view),E.drawImage($,...x),E.globalAlpha=1);for(let L=0;L<nt+Math.min(r.maxPoints,Math.ceil(V+100));L++){let F=g[L],B=F.ambient,P=T(F,C,_),K=P.gathered,ee=B?P.origin[0]:P.x,re=B?P.origin[1]:P.y,ae=F.r*.2126+F.g*.7152+F.b*.0722,se=B?[.45,.64,.98]:[F.r,F.g,F.b].map((W,I)=>{let j=W*.96+[.035,.04,.05][I];return r.artwork==="svg"&&(j=le([.52,.7,1][I],j,Ue(.05,.26,ae))),j=le([.5,.72,1][I],j,K),le(ot(j),le([.17,.32,.64][I],le(W,[.57,.63,.74][I],Ue(.85,1,ae)*.12),K),r.light)}),Y=B?.13*(.35+.65*C):(1-Ue(V-32,V+32,F.index))*le(.72,1,K)*(F.alpha??1)*P.fade;Y*=le(1,.78,r.view)*(B?1:1-Z),E.fillStyle=`rgba(${se.map(W=>Math.round(W*255)).join(",")},${Y})`,E.beginPath(),E.arc(ee,re,B?.7:le(.8,1.4,K)*le(.76,1.22,F.s3),0,Math.PI*2),E.fill()}E.restore()},dispose(){}},O(),q()}function w(){let{width:s,height:E,bottom:C}=D,V=h?.ratio||1,_=18,Z=Math.max(40,C-_-12),L=s*(s<600?.72:.52),F=Math.min(Z,E*.82,L/V),B=F*V;x=[(s-B)/2,_+Math.max(0,(Z-F)/2),B,F],R=[s/2,x[1]+F/2,Math.max(s*.52,B*.85),Math.max(Z*.58,F*.57)]}function O(){r.width=D.width,r.height=D.height,r.dpr=Math.min(n.devicePixelRatio||1,1.25);let s=Math.max(1,Math.round(r.width*r.dpr)),E=Math.max(1,Math.round(r.height*r.dpr));(i.width!==s||i.height!==E)&&(i.width=s,i.height=E,c?.resize()),w()}function q(){!d&&!e.hidden&&r.visible&&r.ready&&!r.disposed&&(d=n.requestAnimationFrame(m))}function m(s){if(d=0,r.disposed||e.hidden||!r.visible)return;let E=b?Math.min((s-b)/1e3,.1):1/60;b=s;let C=o.matches?1:1-Math.exp(-E*4.4),V=Math.min(r.maxPoints,r.budgetTarget);r.progress=le(r.progress,r.target,C),r.light=le(r.light,r.lightTarget,C),r.budget=le(r.budget,V,C),o.matches||(r.time+=E);let _=Math.abs(r.progress-r.target)>2e-4||Math.abs(r.light-r.lightTarget)>.001||Math.abs(r.budget-V)>.6;(s-u>=1e3/(r.mode==="Canvas 2D"?24:30)-.8||!u||o.matches)&&(c.draw(),r.frames++,u=s),(!o.matches||_)&&q()}let N=()=>{b=0,q()};return o.addEventListener("change",N),e.addEventListener("visibilitychange",N),{setModel(s,E){if(!r.disposed){if(h=s,g=s.points,$=s.detail,r.maxPoints=s.count,r.artwork=E,c)c.update?.();else{try{c=U()}catch{c=null}c||A()}if(r.ready=!0,O(),f?.cancel(),!o.matches){let C=i.animate([{opacity:0,transform:"translateY(8px)"},{opacity:1,transform:"none"}],{duration:280,easing:"cubic-bezier(.22,.8,.26,1)"});f=C,C.finished.then(()=>{f===C&&(C.cancel(),f=null)},()=>{})}q()}},configure({progress:s,count:E,light:C,visible:V=!0,width:_,height:Z,bottom:L}){r.disposed||(r.target=ot(s),r.budgetTarget=r.mode==="Canvas 2D"?Math.min(4500,E):E,r.lightTarget=C?1:0,r.visible=V,(_!==D.width||Z!==D.height||L!==D.bottom)&&(D={width:_,height:Z,bottom:L},O()),V?q():(n.cancelAnimationFrame(d),d=0,b=0))},snapshot:()=>({ready:r.ready,mode:r.mode,progress:r.progress,target:r.target,count:Math.round(r.budget*y(r.progress)+nt),budget:r.budget,frames:r.frames,visible:r.visible,rect:[...x],field:[...R],reducedMotion:o.matches}),dispose(){r.disposed=!0,n.cancelAnimationFrame(d),f?.cancel(),c?.dispose(),o.removeEventListener("change",N),e.removeEventListener("visibilitychange",N),i.remove(),g=[],$=null,h=null}}}function Qt(t,e){let n=t,{DOMParser:r,XMLSerializer:o,CSSStyleSheet:i,CSSRule:c,Node:g}=e,d="http://www.w3.org/2000/svg",b=new Set(["svg","g","defs","path","rect","circle","ellipse","line","polyline","polygon","text","tspan","textPath","linearGradient","radialGradient","stop","clipPath","mask","pattern","use","symbol","title","desc","style"]),u=new Set("id class style viewBox preserveAspectRatio width height x y x1 y1 x2 y2 cx cy r rx ry d points transform fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity color clip-path clip-rule mask maskUnits maskContentUnits gradientUnits gradientTransform spreadMethod offset stop-color stop-opacity fx fy fr patternUnits patternContentUnits patternTransform font-family font-size font-weight font-style text-anchor dominant-baseline alignment-baseline letter-spacing word-spacing dx dy rotate lengthAdjust textLength vector-effect paint-order visibility display href".split(" ")),x=new Set("fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity color clip-path clip-rule mask stop-color stop-opacity font-family font-size font-weight font-style text-anchor dominant-baseline alignment-baseline letter-spacing word-spacing vector-effect paint-order visibility display".split(" "));function R(f){let S=f.replace(/url\(\s*(['"]?)#[\w.:-]+\1\s*\)/gi,"");return!/url\s*\(|(?:https?|file|data|blob|javascript)\s*:|\\|@|[<>]/i.test(S)}function $(f){let S=n.createElementNS(d,"g").style;S.cssText=f;let y=[];for(let k of S){let v=S.getPropertyValue(k);x.has(k)&&R(v)&&y.push(`${k}:${v}${S.getPropertyPriority(k)?" !important":""}`)}return y.join(";")}function h(f){let S=new i;S.replaceSync(f.replace(/@import[^;{}]*(?:;|$)/gi,""));let y=[];for(let k of S.cssRules){if(k.type!==c.STYLE_RULE||!/^[\w\s.#,>+~:-]+$/.test(k.selectorText))continue;let v=$(k.style.cssText);v&&y.push(`${k.selectorText}{${v}}`)}return y.join(`
`)}function D(f){if(f.length>2*1024*1024)throw new Error("SVG \u4E0D\u80FD\u8D85\u8FC7 2 MB");if(/<!DOCTYPE|<!ENTITY/i.test(f))throw new Error("\u8BF7\u5BFC\u51FA\u4E0D\u542B DOCTYPE / ENTITY \u7684\u666E\u901A SVG");let S=new r().parseFromString(f,"image/svg+xml");if(S.querySelector("parsererror")||S.documentElement.localName!=="svg")throw new Error("SVG \u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u8BF7\u68C0\u67E5\u6587\u4EF6");if(S.querySelectorAll("*").length>25e3)throw new Error("SVG \u8282\u70B9\u8FC7\u591A\uFF0C\u8BF7\u5148\u7B80\u5316\u8DEF\u5F84");let y=n.implementation.createDocument(d,"");function k(U,A){if(U.nodeType===g.TEXT_NODE){A.appendChild(y.createTextNode(U.textContent));return}if(U.nodeType!==g.ELEMENT_NODE||U.namespaceURI&&U.namespaceURI!==d||!b.has(U.localName))return;let w=y.createElementNS(d,U.localName);for(let O of U.attributes){let q=O.localName,m=O.value;if(u.has(q))if(q==="href")/^#[\w.:-]+$/.test(m)&&w.setAttribute("href",m);else if(q==="style"){let N=$(m);N&&w.setAttribute(q,N)}else R(m)&&w.setAttribute(q,m)}if(A.appendChild(w),U.localName==="style")w.textContent=h(U.textContent);else for(let O of U.childNodes)k(O,w);return w}let v=k(S.documentElement,y),T=(v.getAttribute("viewBox")||"").trim().split(/[\s,]+/).map(Number),a,p;if(T.length===4&&T.every(Number.isFinite)&&T[2]>0&&T[3]>0)[a,p]=T.slice(2);else{if(a=parseFloat(v.getAttribute("width")),p=parseFloat(v.getAttribute("height")),!(Number.isFinite(a)&&Number.isFinite(p)&&a>0&&p>0))throw new Error("SVG \u9700\u8981\u6709\u6548\u7684 viewBox\uFF0C\u6216 width \u4E0E height");v.setAttribute("viewBox",`0 0 ${a} ${p}`)}let l=Math.min(1,4096/Math.max(a,p));v.setAttribute("width",String(Math.max(1,a*l))),v.setAttribute("height",String(Math.max(1,p*l)));let M=new o().serializeToString(v);return{source:`data:image/svg+xml;charset=utf-8,${encodeURIComponent(M)}`,xml:M}}return Object.freeze({sanitize:D})}var Et=(t,e,n,r)=>Number.isFinite(t)?Math.max(e,Math.min(n,t)):r;function Pe(t){let e=Math.round(Et(t?.particleStart,0,95,0));return{particleEnabled:t?.particleEnabled!==!1,particleShape:["logo","whale","custom"].includes(t?.particleShape)?t.particleShape:"logo",particleCount:Math.round(Et(t?.particleCount,500,1e4,6400)/100)*100,particleStart:e,particleFull:Math.round(Et(t?.particleFull,e+1,100,80)),particleSvgRevision:typeof t?.particleSvgRevision=="string"?t.particleSvgRevision.slice(0,100):"",particleSvgName:typeof t?.particleSvgName=="string"?t.particleSvgName.slice(0,160):""}}function er(t){let e=t?.projectedTokens??t?.pressureTokens,n=t?.contextWindow;return!Number.isFinite(e)||e<0||!Number.isFinite(n)||n<=0?null:Math.max(0,Math.min(100,Math.round(e/n*100)))}function tr(t,e,n){return t===null?0:Math.max(0,Math.min(1,(t-e)/(n-e)))}var rr=`
  [data-dcb-particles-host] { isolation:isolate; }
  .dcb-particle-layer { position:absolute; inset:0; z-index:-1; overflow:hidden; pointer-events:none!important; user-select:none; opacity:1; transition:opacity 260ms cubic-bezier(.4,0,.2,1); }
  .dcb-particle-layer canvas { display:block; position:absolute; inset:0; width:100%; height:100%; pointer-events:none!important; }
  .dcb-particle-layer[data-waiting] { opacity:0; }
  @media(prefers-reduced-motion:reduce) { .dcb-particle-layer { transition:none; } }
  @media(forced-colors:active) { .dcb-particle-layer { visibility:hidden; } }
`;function yo(t){let e=null,n=null,r=!1,o=()=>e||(e=new Promise((c,g)=>{if(!t.indexedDB){g(Error("\u6D4F\u89C8\u5668\u672A\u5F00\u653E\u672C\u673A SVG \u5B58\u50A8"));return}let d=t.indexedDB.open("dsh-ui-context-particles",1);d.onupgradeneeded=()=>{d.result.objectStoreNames.contains("artwork")||d.result.createObjectStore("artwork")},d.onerror=()=>{e=null,g(Error("\u65E0\u6CD5\u6253\u5F00\u672C\u673A SVG \u5B58\u50A8"))},d.onblocked=()=>{e=null,g(Error("SVG \u5B58\u50A8\u88AB\u5360\u7528\uFF0C\u8BF7\u5173\u95ED\u5176\u4ED6\u8BBE\u7F6E\u7A97\u53E3\u540E\u91CD\u8BD5"))},d.onsuccess=()=>{if(r){d.result.close(),g(Error("SVG \u5B58\u50A8\u5DF2\u5173\u95ED"));return}n=d.result,n.onversionchange=()=>{n.close(),n=null,e=null},c(n)}}),e);async function i(c,g){let d=await o();return new Promise((b,u)=>{let x=d.transaction("artwork",c),R=g(x.objectStore("artwork")),$;R.onsuccess=()=>$=R.result,x.oncomplete=()=>b($),x.onerror=x.onabort=()=>u(Error("\u65E0\u6CD5\u4FDD\u5B58 SVG\uFF0C\u8BF7\u68C0\u67E5\u672C\u673A\u53EF\u7528\u7A7A\u95F4"))})}return{load:()=>i("readonly",c=>c.get("current")),save:c=>i("readwrite",g=>g.put(c,"current")),remove:()=>i("readwrite",c=>c.delete("current")),dispose(){r=!0,n?.close(),n=null}}}function or(t,e,{logoPath:n,logoBox:r}={}){let o=new Map,i=new Map,c=new Map,g=new Set,d=yo(e),b=Qt(t,e),u=e.matchMedia("(forced-colors: active)"),x=Pe(null),R=!1,$=0,h="",D=null,f="",S=()=>x.particleShape==="custom"?"custom:"+x.particleSvgRevision:x.particleShape,y=()=>[...i.values()].map(m=>({percent:m.percent,shape:m.shape,waiting:m.waiting,error:m.error||null,...m.renderer.snapshot()})),k=()=>{let m=JSON.stringify(y().map(({percent:N,shape:s,waiting:E,error:C})=>({percent:N,shape:s,waiting:E,error:C})));if(h!==m){h=m;for(let N of g)N()}},v=Symbol.for("dsh-ui-beautify.context-particles.v1"),T=Object.getOwnPropertyDescriptor(e,v),a=Object.freeze({snapshot:()=>({enabled:x.particleEnabled,shape:x.particleShape,start:x.particleStart,full:x.particleFull,count:x.particleCount,scenes:y()})});Object.defineProperty(e,v,{configurable:!0,value:a});async function p(){let m=x.particleSvgRevision;(!D||f!==m)&&(f=m,D=d.load());let N=await D;if(!N?.xml)throw Error("\u8BF7\u5148\u5BFC\u5165\u81EA\u5B9A\u4E49 SVG");return b.sanitize(N.xml).source}function l(m){if(!c.has(m)){let N=(async()=>{if(m==="whale")return Ze(rt);if(m.startsWith("custom:"))return Ze(await p(),{vector:!0});if(typeof n!="string"||!r?.width||!r?.height)throw Error("\u5BBF\u4E3B DeepSeek Logo \u5C1A\u672A\u5C31\u7EEA");let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r.width} ${r.height}"><path fill="#4d6bfe" d="${n}"/></svg>`;return Ze("data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s),{vector:!0})})();c.set(m,N),N.catch(()=>{c.get(m)===N&&c.delete(m)})}return c.get(m)}function M(m){let N=i.get(m);N&&(N.revision++,N.resize.disconnect(),N.intersection.disconnect(),N.renderer.dispose(),N.layer.remove(),m.removeAttribute("data-dcb-particles-host"),i.delete(m))}function U(m){let N=t.createElement("div");N.className="dcb-particle-layer",N.setAttribute("aria-hidden","true"),N.setAttribute("data-waiting",""),m.setAttribute("data-dcb-particles-host",""),m.prepend(N);let s={host:m,session:m.dataset.conversationSession,layer:N,renderer:Jt(N,t,e),key:null,percent:null,shape:null,waiting:!0,visible:!0,revision:0,resize:new e.ResizeObserver(O),intersection:new e.IntersectionObserver(C=>{s.visible=C[0].isIntersecting,O()})};s.resize.observe(m);let E=m.querySelector("[data-composer-seat]");return E&&s.resize.observe(E),s.intersection.observe(m),i.set(m,s),s}async function A(m,N){m.key=N,m.waiting=!0,m.error=null;let s=++m.revision;try{let E=await l(N);if(R||s!==m.revision||!i.has(m.host))return;m.renderer.setModel(E,N.startsWith("custom:")?"svg":"default"),m.shape=N.startsWith("custom:")?"custom":N,m.waiting=!1}catch(E){s===m.revision&&(m.error=E.message,m.waiting=!0)}O(),k()}function w(m=x){if(R)return;x=Pe(m);let N=x.particleEnabled&&!u.matches?[...t.querySelectorAll("[data-conversation-content][data-conversation-session]")].filter(C=>C.getClientRects().length&&o.has(C.dataset.conversationSession)).slice(0,2):[];for(let C of i.keys())N.includes(C)||M(C);let s=!!t.querySelector(".dcb-settings")?.getClientRects().length,E=S();for(let C of N){i.has(C)&&i.get(C).session!==C.dataset.conversationSession&&M(C);let V=i.get(C)||U(C),_=o.get(C.dataset.conversationSession);V.percent=[..._.values()].at(-1),V.layer.toggleAttribute("data-waiting",V.percent===null||V.waiting),V.percent!==null&&V.key!==E&&A(V,E);let Z=C.getBoundingClientRect(),L=C.querySelector("[data-composer-seat]")?.getBoundingClientRect(),F=L&&L.top>Z.top+40?Math.min(Z.height,L.top-Z.top):Z.height;V.renderer.configure({progress:tr(V.percent,x.particleStart,x.particleFull),count:x.particleCount,light:!t.body.hasAttribute("data-ds-dark-theme"),visible:V.visible&&!s&&V.percent!==null&&!V.waiting&&V.percent>=x.particleStart,width:Math.max(1,Z.width),height:Math.max(1,Z.height),bottom:F}),V.layer.style.opacity=V.percent!==null&&V.percent>=x.particleStart?"":"0"}k()}function O(){!$&&!R&&($=e.requestAnimationFrame(()=>{$=0,w()}))}u.addEventListener("change",O);let q=()=>O();return t.addEventListener("visibilitychange",q),{sync:w,publish(m,N,s){R||(o.has(m)||o.set(m,new Map),o.get(m).set(s,er(N)),O())},forget(m,N){if(R)return;let s=o.get(m);s?.delete(N),s?.size||o.delete(m),O()},subscribe(m){return g.add(m),()=>g.delete(m)},getStatus:()=>h,snapshot:a.snapshot,async importSVG(m){if(!m||m.size>2*1024*1024||!(/\.svg$/i.test(m.name)||m.type==="image/svg+xml"))throw Error("\u8BF7\u9009\u62E9\u4E0D\u8D85\u8FC7 2 MB \u7684 SVG \u6587\u4EF6");let N=b.sanitize(await m.text());await Ze(N.source,{vector:!0});let s={xml:N.xml,name:String(m.name||"\u81EA\u5B9A\u4E49.svg").slice(0,160),revision:e.crypto?.randomUUID?.()||String(Date.now())};if(R)throw Error("\u7C92\u5B50\u80CC\u666F\u5DF2\u5173\u95ED");await d.save(s),D=Promise.resolve(s),f=s.revision;for(let E of c.keys())E.startsWith("custom:")&&c.delete(E);return{particleShape:"custom",particleSvgRevision:s.revision,particleSvgName:s.name}},async clearSVG(){await d.remove(),D=null,f="";for(let m of c.keys())m.startsWith("custom:")&&c.delete(m)},dispose(){R=!0,e.cancelAnimationFrame($);for(let m of i.keys())M(m);o.clear(),c.clear(),g.clear(),d.dispose(),u.removeEventListener("change",O),t.removeEventListener("visibilitychange",q),e[v]===a&&(T?Object.defineProperty(e,v,T):delete e[v])}}}var nr=`
  .dcb-particle-options { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:14px 0; }
  .dcb-particle-option { display:flex; flex-direction:column; align-items:center; gap:7px; min-width:0; padding:14px 8px; border:1px solid #8884; border-radius:10px; background:transparent; color:var(--dsh-settings-text); font:12px/20px system-ui; cursor:pointer; transition:background-color 220ms ease,border-color 220ms ease,transform 240ms cubic-bezier(.22,.8,.26,1); }
  .dcb-particle-option[aria-checked=true] { border-color:#888a; background:#8881; }
  .dcb-particle-option:active { transform:scale(.94); }
  .dcb-particle-option:focus-visible,.dcb-particle-control button:focus-visible { outline:2px solid #888; outline-offset:3px; }
  .dcb-particle-option:disabled { opacity:.4; cursor:default; }
  .dcb-particle-icon { display:grid; place-items:center; width:54px; height:42px; font-size:28px; color:#4d6bfe; }
  .dcb-particle-icon svg { width:46px; height:34px; }
  .dcb-particle-icon img { height:42px; width:45px; object-fit:contain; mix-blend-mode:multiply; }
  body[data-ds-dark-theme] .dcb-particle-icon img { mix-blend-mode:normal; border-radius:6px; }
  .dcb-particle-number { display:flex; align-items:center; gap:5px; flex:none; }
  .dcb-particle-number input { box-sizing:border-box; width:82px; padding:7px 9px; border:1px solid #8885; border-radius:8px; background:transparent; color:var(--dsh-settings-text); font:13px/20px system-ui; font-variant-numeric:tabular-nums; text-align:center; outline:none; transition:border-color 180ms ease,box-shadow 180ms ease; }
  .dcb-particle-number input:focus { border-color:#888b; box-shadow:0 0 0 3px #8882; }
  .dcb-particle-number button { display:grid; place-items:center; width:28px; height:30px; border:1px solid #8884; border-radius:7px; background:transparent; color:inherit; cursor:pointer; transition:background-color 180ms ease,transform 220ms ease; }
  .dcb-particle-number button:active { transform:scale(.9); }
  .dcb-particle-control { margin-top:12px; padding:13px; border:1px dashed #8885; border-radius:10px; }
  .dcb-particle-control p { font:12px/20px system-ui; color:var(--dsh-settings-secondary); overflow-wrap:anywhere; }
  .dcb-particle-buttons { display:flex; flex-wrap:wrap; gap:8px; }
  .dcb-particle-buttons button { padding:7px 11px; border:1px solid #8884; border-radius:8px; background:transparent; color:inherit; font:12px/18px system-ui; cursor:pointer; transition:background-color 180ms ease,transform 220ms ease; }
  .dcb-particle-buttons button:active { transform:scale(.94); }
  .dcb-particle-error { color:var(--dsh-settings-text); font:12px/20px system-ui; padding-block:8px; }
  .dcb-particle-live { font-variant-numeric:tabular-nums; }
  @media(max-width:600px) { .dcb-particle-options { gap:6px; } .dcb-particle-option { padding-inline:4px; font-size:11px; } }
  @media(prefers-reduced-motion:reduce) { .dcb-particle-option,.dcb-particle-number input,.dcb-particle-number button,.dcb-particle-buttons button { transition:none; } }
`;function ir(t,e,n,{particles:r,FishLogo:o}={}){let i=t.createElement;function c({label:g,value:d,min:b,max:u,step:x=1,onChange:R}){let[$,h]=t.useState(String(d)),D=t.useRef(!1);t.useEffect(()=>h(String(d)),[d]);let f=y=>{let k=Math.max(b,Math.min(u,Math.round(y/x)*x));h(String(k)),R(k)},S=()=>{$.trim()!==""&&Number.isFinite(Number($))?f(Number($)):h(String(d))};return i("div",{className:"dcb-particle-number"},i("button",{type:"button","aria-label":`\u51CF\u5C11${g}`,disabled:d<=b,onClick:()=>f(d-x)},"\u2212"),i("input",{type:"text",inputMode:"numeric",role:"spinbutton","aria-label":g,"aria-valuemin":b,"aria-valuemax":u,"aria-valuenow":d,value:$,onChange:y=>h(y.target.value),onBlur:()=>{D.current?D.current=!1:S()},onKeyDown:y=>{y.key==="Enter"?(y.preventDefault(),y.currentTarget.blur()):y.key==="Escape"?(y.preventDefault(),y.stopPropagation(),D.current=!0,h(String(d)),y.currentTarget.blur()):["ArrowUp","ArrowDown","Home","End"].includes(y.key)&&(y.preventDefault(),f(y.key==="Home"?b:y.key==="End"?u:d+(y.key==="ArrowUp"?x:-x)))}}),i("button",{type:"button","aria-label":`\u589E\u52A0${g}`,disabled:d>=u,onClick:()=>f(d+x)},"+"))}return function({value:d,onChange:b}){let[u,x]=t.useState(!1),[R,$]=t.useState(""),h=t.useRef(null),D=t.useRef(!0),f=t.useRef(0);t.useEffect(()=>(D.current=!0,()=>{D.current=!1,f.current++}),[]),t.useSyncExternalStore(r.subscribe,r.getStatus,r.getStatus);let S=r.snapshot().scenes,y=S.find(a=>a.percent!==null),k=y?.percent,v=(a,p,l)=>i("div",{className:"dcb-settings-row"},i("div",{className:"dcb-settings-copy"},i("span",{className:"dcb-settings-row-title"},a),i("p",{className:"dcb-settings-row-desc"},p)),l);async function T(a){if(!a)return;let p=++f.current;x(!0),$("");try{let l=await r.importSVG(a);D.current&&p===f.current&&b(l)}catch(l){D.current&&p===f.current&&$(l.message||"SVG \u5BFC\u5165\u5931\u8D25\uFF0C\u539F\u56FE\u5F62\u5DF2\u4FDD\u7559")}finally{D.current&&p===f.current&&x(!1)}}return i("section",{className:"dcb-settings-block dcb-settings-card","data-dcb-settings-block":"particles"},i("div",{className:"dcb-settings-header"},i("div",null,i("h2",null,"\u4E0A\u4E0B\u6587\u7C92\u5B50\u80CC\u666F"),i("p",null,"\u7C92\u5B50\u4ECE\u56DB\u5468\u6C47\u5165\uFF0C\u8DDF\u968F\u5F53\u524D\u4F1A\u8BDD\u7684\u771F\u5B9E\u4E0A\u4E0B\u6587\u5360\u7528"))),v("\u4F1A\u8BDD\u7C92\u5B50\u80CC\u666F","\u9ED8\u8BA4\u4F7F\u7528 DeepSeek Logo\uFF1B\u5173\u95ED\u4F1A\u91CA\u653E\u753B\u5E03\u4E0E\u7ED8\u5236\u8D44\u6E90\u3002",i("button",{type:"button",role:"switch",className:"dcb-switch","aria-label":"\u4F1A\u8BDD\u7C92\u5B50\u80CC\u666F","aria-checked":d.particleEnabled,onClick:()=>b({particleEnabled:!d.particleEnabled})})),i("div",{className:"dcb-particle-options",role:"radiogroup","aria-label":"\u7C92\u5B50\u56FE\u5F62"},[["logo","DeepSeek Logo",o?i(o,{size:46}):"\u25C8"],["whale","\u9CB8\u9C7C\u5A18",i("img",{src:rt,alt:""})],["custom","\u81EA\u5B9A\u4E49 SVG","\u25C7"]].map(([a,p,l])=>i("button",{key:a,type:"button",role:"radio",className:"dcb-particle-option","aria-label":p,"aria-checked":d.particleShape===a,tabIndex:d.particleShape===a?0:-1,disabled:a==="custom"&&!d.particleSvgRevision,onClick:()=>b({particleShape:a}),onKeyDown:M=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(M.key))return;M.preventDefault();let U=[...M.currentTarget.parentElement.querySelectorAll("button:not(:disabled)")],A=U.indexOf(M.currentTarget),w=M.key==="Home"?0:M.key==="End"?U.length-1:(A+(["ArrowRight","ArrowDown"].includes(M.key)?1:U.length-1))%U.length;U[w].click(),U[w].focus()}},i("span",{className:"dcb-particle-icon","aria-hidden":"true"},l),p))),v("\u7C92\u5B50\u6570","500\u201310000\u3002\u9ED8\u8BA4 6400\uFF0C\u4FDD\u6301\u8F7B\u91CF\uFF1B\u6570\u91CF\u8D8A\u591A\u7ED8\u5236\u8D1F\u62C5\u8D8A\u5927\u3002",i(c,{label:"\u7C92\u5B50\u6570",value:d.particleCount,min:500,max:1e4,step:100,onChange:a=>b({particleCount:a})})),v("\u5F00\u59CB\u663E\u793A (%)","\u4F4E\u4E8E\u8FD9\u4E2A\u5360\u7528\u6BD4\u4F8B\u65F6\u9690\u85CF\u80CC\u666F\u3002",i(c,{label:"\u5F00\u59CB\u663E\u793A\u767E\u5206\u6BD4",value:d.particleStart,min:0,max:95,onChange:a=>b({particleStart:a})})),v("\u5B8C\u6574\u6210\u5F62 (%)","\u8FBE\u5230\u6B64\u5360\u7528\u6BD4\u4F8B\u65F6\u5B8C\u6574\u6210\u5F62\uFF1B\u4E4B\u540E\u4FDD\u6301\u5B8C\u6574\uFF0C\u538B\u7F29\u65F6\u968F\u5360\u7528\u56DE\u9000\u3002",i(c,{label:"\u5B8C\u6574\u6210\u5F62\u767E\u5206\u6BD4",value:d.particleFull,min:d.particleStart+1,max:100,onChange:a=>b({particleFull:a})})),i("div",{className:"dcb-settings-info dcb-particle-live",role:"status"},d.particleEnabled?k===void 0?"\u7B49\u5F85\u5F53\u524D\u4F1A\u8BDD\u7684\u4E0A\u4E0B\u6587\u6570\u636E\uFF1B\u672A\u4E0A\u62A5\u65F6\u4E0D\u6A21\u62DF\u5360\u7528":`\u5F53\u524D\u4E0A\u4E0B\u6587 ${k}% \xB7 \u6210\u5F62\u8FDB\u5EA6 ${Math.round(Math.max(0,Math.min(1,(k-d.particleStart)/(d.particleFull-d.particleStart)))*100)}% \xB7 ${d.particleStart}% \u5F00\u59CB / ${d.particleFull}% \u5B8C\u6574`:"\u80CC\u666F\u5DF2\u5173\u95ED",y?.error?` \xB7 ${y.error}`:""),i("div",{className:"dcb-particle-control"},i("strong",null,"\u672C\u673A SVG"),i("p",null,d.particleSvgName||"\u652F\u6301\u9759\u6001\u586B\u5145\u3001\u63CF\u8FB9\u3001\u6E10\u53D8\u548C\u900F\u660E\u80CC\u666F\uFF0C\u6587\u4EF6\u4E0D\u4E0A\u4F20\u3002"),i("input",{ref:h,type:"file",accept:".svg,image/svg+xml",hidden:!0,onChange:a=>{let p=a.target.files?.[0];a.target.value="",T(p)}}),i("div",{className:"dcb-particle-buttons"},i("button",{type:"button",disabled:u,onClick:()=>h.current?.click()},u?"\u8BFB\u53D6\u4E2D\u2026":"\u5BFC\u5165 SVG"),d.particleSvgRevision&&i("button",{type:"button",disabled:u,onClick:async()=>{x(!0);try{await r.clearSVG(),D.current&&b({particleShape:d.particleShape==="custom"?"logo":d.particleShape,particleSvgRevision:"",particleSvgName:""})}catch(a){D.current&&$(a.message)}finally{D.current&&x(!1)}}},"\u79FB\u9664\u81EA\u5B9A\u4E49 SVG")),R&&i("div",{role:"alert",className:"dcb-particle-error"},R)),i("p",{className:"dcb-settings-footnote"},"SVG \u4EC5\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u7684\u672C\u673A\u5B58\u50A8\u4E2D\uFF0C\u5237\u65B0\u540E\u4FDD\u7559\u3002\u540E\u53F0\u6682\u505C\u7ED8\u5236\uFF0C\u51CF\u5C11\u52A8\u6001\u6548\u679C\u65F6\u9759\u6001\u663E\u793A\u3002\u9CB8\u9C7C\u5A18\u7ACB\u7ED8\uFF1AZipZipPipe\uFF1B\u539F\u578B\uFF1A\u4E0A\u5584\u65E0\u5F62\uFF1BCC BY-NC-SA 4.0\uFF0C\u4EC5\u4F9B\u4E2A\u4EBA\u975E\u5546\u4E1A\u4F7F\u7528\u3002"))}}function Ge({damping:t=1,frequency:e=8,steps:n=40}={}){let r=i=>{if(t===1)return 1-(1+e*i)*Math.exp(-e*i);let c=e*Math.sqrt(1-t*t);return 1-Math.exp(-t*e*i)*(Math.cos(c*i)+t*e/c*Math.sin(c*i))},o=r(1);return Array.from({length:n+1},(i,c)=>c===0?0:c===n?1:r(c/n)/o)}var ar=t=>`linear(${t.map(e=>Number(e.toFixed(5))).join(",")})`,sr=typeof CSS<"u"&&CSS.supports?.("animation-timing-function","linear(0, 1)"),G=Object.freeze({time:Object.freeze({quick:180,control:220,material:240,standard:280,scene:300,sidebar:500}),ease:Object.freeze({smooth:sr?ar(Ge()):"cubic-bezier(.22,.8,.26,1)",snappy:sr?ar(Ge({damping:.86,frequency:9})):"cubic-bezier(.2,.8,.25,1)",exit:"cubic-bezier(.4,0,.8,1)",color:"cubic-bezier(.25,.1,.25,1)"}),stagger:24,blur:2});var Be="data-dcb-sidebar-layout-lock",wo=':is([class$="_centerCol"],[class*="_centerCol "])',ge="--dsh-chat-content-width",Do="--dsh-conversation-column-width",ko=t=>/^\d+(?:\.\d+)?px$/.test(t)&&parseFloat(t)>0;function cr(t,e){let n=new Map,r=d=>["style","class","data-sidebar-collapsed"].map(b=>d.getAttribute(b)).join(`
`);function o(d,b){let u=d.cloneNode(!1),x=b.center;u.removeAttribute("id"),u.setAttribute("aria-hidden","true"),u.inert=!0,u.setAttribute("data-dcb-sidebar-layout-probe","");for(let[h,D]of Object.entries({position:"fixed",left:"-100000px",top:"0",width:e.getComputedStyle(d).width,height:"0",minHeight:"0",maxHeight:"none",margin:"0",visibility:"hidden",pointerEvents:"none",contain:"layout style paint",transition:"none",animation:"none"}))u.style.setProperty(h.replace(/[A-Z]/g,f=>"-"+f.toLowerCase()),D,"important");let R=null;for(let h of d.children){let D=h.cloneNode(!1);D.removeAttribute("id"),u.append(D),h===x&&(R=D)}if(!R)return null;let $=[];for(let h=b.body;h&&h!==x;h=h.parentElement)$.unshift(h);for(let h of $){let D=h.cloneNode(!1);D.removeAttribute("id"),R.append(D),R=D}R.removeAttribute(Be),b.original?R.style.setProperty(ge,b.original,b.priority):R.style.removeProperty(ge);try{d.parentElement.append(u);let h=e.getComputedStyle(R).width;return ko(h)?(R.style.setProperty(Do,h),e.getComputedStyle(R).getPropertyValue(ge).trim()||null):null}finally{u.remove()}}function i(d){let b=n.get(d);b&&(n.delete(d),e.clearTimeout(b.timer),b.body.style.getPropertyValue(ge)===b.width&&b.body.style.getPropertyPriority(ge)==="important"&&(b.original?b.body.style.setProperty(ge,b.original,b.priority):b.body.style.removeProperty(ge)),b.mark===null?b.root.removeAttribute(Be):b.root.setAttribute(Be,b.mark))}function c(d,{prepare:b=!1}={}){if(d.matches("[data-dragging], [data-dcb-sidebar-resizing], [data-rightbar-instant], [data-rightbar-fullscreen]"))return i(d),!1;let u=n.get(d);if(u&&(!u.root.isConnected||!u.body.isConnected||!d.contains(u.root))&&(i(d),u=null),!u){let x=[...d.children].find(D=>D.matches(wo)),R=x?.querySelector("[data-conversation-content]"),$=R?.closest("[data-phase]");if(!$||!x.contains($)||!$.getClientRects().length)return!1;let h=e.getComputedStyle(R).getPropertyValue(ge).trim();if(!h)return!1;u={root:$,body:R,center:x,width:h,mark:$.getAttribute(Be),original:R.style.getPropertyValue(ge),priority:R.style.getPropertyPriority(ge)},n.set(d,u),R.style.setProperty(ge,h,"important"),$.setAttribute(Be,"")}if(!b&&u.signature!==r(d)){let x=o(d,u);if(!x)return i(d),!1;u.width=x,u.signature=r(d),u.body.style.setProperty(ge,x,"important")}return e.clearTimeout(u.timer),u.timer=e.setTimeout(()=>i(d),1e3),!0}let g=d=>{for(let[b,u]of n)u.root.contains(d.target)&&i(b)};return t.addEventListener("pointerdown",g,!0),t.addEventListener("keydown",g,!0),t.addEventListener("wheel",g,{capture:!0,passive:!0}),{hold:c,release:i,dispose(){t.removeEventListener("pointerdown",g,!0),t.removeEventListener("keydown",g,!0),t.removeEventListener("wheel",g,!0);for(let d of n.keys())i(d)}}}var Mt="data-dcb-sidebar-style",Tt="data-dcb-sidebar-column",At="data-dcb-sidebar-motion",Ut="data-dcb-sidebar-toggle",Ct="data-dcb-sidebar-toggle-state",Ve="data-dcb-sidebar-moving",Ie="--dcb-sidebar-expanded-width",qt="data-dcb-sidebar-frame-motion",He="data-dcb-sidebar-resizing",Ot=G.time.sidebar,ve=(t,e)=>[...t.classList].some(n=>n.endsWith("_"+e)),lr=t=>t.isConnected&&t.getClientRects().length&&getComputedStyle(t).visibility!=="hidden";function dr(t,e,n){let r=new Map,o=cr(t,e),i=e.matchMedia("(prefers-reduced-motion: reduce)"),c=e.matchMedia("(forced-colors: active)"),g=(a,p,l)=>l===null?a.removeAttribute(p):a.setAttribute(p,l),d=(a,p,l)=>{a.getAttribute(p)!==l&&a.setAttribute(p,l)},b=a=>{for(let p of a.animations)p.cancel();a.animations.clear()},u=a=>{for(let p of a.contentAnimations)p.cancel();a.contentAnimations.clear(),a.ghost?.remove(),a.ghost=null,a.enterSeats=null};function x(a){if(!a.animate||!a.dirty||a.collapsed||a.moving)return;a.dirty=!1;let{root:p,column:l}=a,M=p.getBoundingClientRect(),U=l.getBoundingClientRect();if(!M.width||!M.height)return;let A=p.cloneNode(!0),w=[p,...p.querySelectorAll("*")],O=[A,...A.querySelectorAll("*")],q=[];for(let N=0;N<w.length;N++){let s=w[N],E=O[N];E.removeAttribute("id"),(s.scrollTop||s.scrollLeft)&&q.push([E,s.scrollTop,s.scrollLeft])}for(let N of A.querySelectorAll('[class$="_toggle"], [class*="_toggle "], [class$="_topStrip"], [class*="_topStrip "], input, textarea, [contenteditable]'))N.remove();A.setAttribute("data-dcb-sidebar-ghost",""),A.setAttribute("aria-hidden","true"),A.inert=!0,A.removeAttribute(Ve);let m={position:"absolute",left:`${M.left-U.left}px`,top:`${M.top-U.top}px`,width:`${M.width}px`,height:`${M.height}px`,margin:"0",padding:e.getComputedStyle(p).padding,"border-radius":e.getComputedStyle(p).borderRadius,"pointer-events":"none","z-index":"2"};for(let[N,s]of Object.entries(m))A.style.setProperty(N,s,"important");a.snapshot={clone:A,scroll:q}}function R(a){let p=a.ghost||a.enterSeats?.find(w=>ve(w,"regionArea"))||a.enterSeats?.[0],l=p&&e.getComputedStyle(p),M=l?{opacity:l.opacity,transform:l.transform,filter:l.filter}:null;u(a);let U={duration:Ot,easing:G.ease.smooth},A=(w,O)=>{a.contentAnimations.add(w),w.finished.then(()=>{a.contentAnimations.delete(w),O?.(),w.cancel()},()=>a.contentAnimations.delete(w))};if(a.collapsed){let w=a.snapshot;if(!w)return;a.ghost=w.clone,a.column.append(a.ghost);for(let[q,m,N]of w.scroll)q.scrollTop=m,q.scrollLeft=N;let O=a.ghost;A(O.animate([M||{opacity:1,transform:"none",filter:"blur(0px)"},{opacity:0,transform:"translateX(-12px)",filter:"blur(2px)"}],{...U,fill:"forwards"}),()=>{O.remove(),a.ghost===O&&(a.ghost=null)})}else{let w=[...a.root.children].flatMap(O=>ve(O,"logoRow")?[...O.children].filter(q=>ve(q,"brand")):ve(O,"newSession")||ve(O,"panelList")||ve(O,"regionArea")||ve(O,"footArea")?[O]:[]);a.enterSeats=w;for(let[O,q]of w.entries()){let m=M?0:Math.min(O*G.stagger,96);A(q.animate([M||{opacity:0,transform:"translateX(-12px)",filter:"blur(2px)"},{opacity:1,transform:"none",filter:"blur(0px)"}],{...U,duration:Ot-m,delay:m,fill:"backwards"}))}}}function $(a){a.decorated&&(a.indicator.remove(),a.indicator=null,a.decorated=!1,a.placed=!1,g(a.root,Mt,a.style),g(a.root,At,a.motion),g(a.column,Tt,a.columnMark),a.width?a.root.style.setProperty(Ie,a.width,a.widthPriority):a.root.style.removeProperty(Ie))}function h(a){o.release(a.frame),$(a),b(a),u(a),a.resize.disconnect(),a.observer.disconnect(),e.clearTimeout(a.settleTimer),e.clearTimeout(a.resizeTimer),g(a.frame,qt,a.frameMark),g(a.frame,He,a.resizingMark),g(a.root,Ve,a.movingMark),f(a)}function D(){return[...t.querySelectorAll('[class$="_sidebarCol"], [class*="_sidebarCol "]')].flatMap(a=>{let p=[...a.querySelectorAll('[class$="_root"], [class*="_root "]')].find(l=>!l.hasAttribute("data-dcb-sidebar-ghost")&&[...l.children].some(M=>ve(M,"logoRow")));return p?[{column:a,root:p}]:[]})}function f(a){a.button&&(a.button.removeEventListener("click",a.click),g(a.button,Ut,a.buttonMark),g(a.button,Ct,a.buttonState))}function S(a,p){let l=a.button;if(!l||typeof l.animate!="function")return;let M=l.querySelector('[class$="_panelIcon"], [class*="_panelIcon "], svg'),U=a.animations.size>0,A=U?e.getComputedStyle(l).scale:".94",w=M&&U?e.getComputedStyle(M).transform:null;b(a);let O={duration:G.time.standard,easing:G.ease.snappy},q=[l.animate([{scale:A},{scale:"1"}],O)];M&&q.push(M.animate([{transform:w||`translateX(${p?-6:6}px) scaleX(${p?-1:1}) scale(.94)`,opacity:.65},{transform:`scaleX(${p?-1:1})`,opacity:1}],O));for(let m of q)a.animations.add(m),m.finished.then(()=>{a.animations.delete(m),m.cancel()},()=>a.animations.delete(m))}function y(a){e.clearTimeout(a.settleTimer);let p=a.settleRevision=(a.settleRevision||0)+1;a.animate?o.hold(a.frame):o.release(a.frame);let l=e.getComputedStyle(a.frame),M=q=>q.split(",").map(m=>parseFloat(m)*(m.trim().endsWith("ms")?1:1e3)||0),U=M(l.transitionDuration),A=M(l.transitionDelay),w=Math.max(0,...U.map((q,m)=>q+A[m%A.length]));if(!w){o.release(a.frame),a.settleTimer=0,a.moving=!1,g(a.root,Ve,a.movingMark),u(a);return}a.moving=!0,d(a.root,Ve,""),a.animate&&!a.frame.hasAttribute(He)&&R(a);let O=()=>{r.get(a.root)!==a||a.settleRevision!==p||(a.settleTimer=0,o.release(a.frame),a.moving=!1,u(a),g(a.root,Ve,a.movingMark),a.dirty=!0,n())};a.settleTimer=e.setTimeout(()=>{let q=a.frame.getAnimations().filter(m=>m.transitionProperty==="grid-template-columns"&&["pending","running"].includes(m.playState));q.length?Promise.allSettled(q.map(m=>m.finished)).then(O):O()},Math.min(1e3,w+40))}function k(a,p){let l=D(),M=new Set(l.map(A=>A.root)),U=p&&!i.matches&&!c.matches;for(let[A,w]of r)M.has(A)||(h(w),r.delete(A));for(let{root:A,column:w}of l){let O=w.parentElement,q=O.getAttribute("data-sidebar-collapsed")==="true"||ve(A,"collapsed"),m=r.get(A);m&&(m.column!==w||m.frame!==O)&&(h(m),r.delete(A),m=null),m||(m={root:A,column:w,frame:O,collapsed:q,inlineWidth:A.style.width,animations:new Set,contentAnimations:new Set,dirty:!0,moving:!1,movingMark:A.getAttribute(Ve),frameMark:O.getAttribute(qt),resizingMark:O.getAttribute(He)},m.resize=new e.ResizeObserver(()=>{m.dirty=!0,n()}),m.resize.observe(A),m.observer=new e.MutationObserver(F=>{O.matches("[data-dragging], [data-rightbar-instant], [data-rightbar-fullscreen]")?o.release(O):m.animate&&F.some(P=>P.target===O&&P.attributeName==="data-sidebar-collapsed")&&o.hold(O);let B=F.some(P=>P.target!==O&&P.target!==A&&!m.indicator?.contains(P.target)&&!m.ripple?.contains(P.target));B&&(m.dirty=!0),(B||F.some(P=>P.target===O)||m.inlineWidth!==A.style.width)&&(m.inlineWidth=A.style.width,n())}),m.observer.observe(O,{attributes:!0,attributeFilter:["data-sidebar-collapsed","data-dragging","data-rightbar-instant","data-rightbar-fullscreen","style"]}),m.observer.observe(A,{childList:!0,characterData:!0,subtree:!0,attributes:!0,attributeFilter:["style","class","aria-selected","aria-current"]}),r.set(A,m)),d(O,qt,String(U));let N=A.querySelector('[class$="_toggle"], [class*="_toggle "]');if(N!==m.button&&(b(m),f(m),m.button=N,m.buttonMark=N?.getAttribute(Ut)??null,m.buttonState=N?.getAttribute(Ct)??null,N&&(m.click=()=>{if(!m.animate||i.matches||c.matches)return;o.hold(m.frame,{prepare:!0});let F=m.frame.getAttribute("data-sidebar-collapsed")==="true"||ve(m.root,"collapsed");F||x(m),m.clickedAt=e.performance.now(),S(m,!F)},N.addEventListener("click",m.click))),m.animate=U,N&&(d(N,Ut,String(U)),d(N,Ct,q?"collapsed":"expanded")),U||(o.release(O),b(m),u(m)),m.collapsed!==q&&(m.collapsed=q,y(m),U&&!(e.performance.now()-m.clickedAt<Ot+40)&&S(m,q)),a==="milk"||q&&t.documentElement.hasAttribute("data-windows-titlebar")){$(m),x(m);continue}if(!m.decorated){let F=t.createElement("span");F.className="dcb-sidebar-indicator",F.setAttribute("aria-hidden","true"),Object.assign(m,{indicator:F,decorated:!0,style:A.getAttribute(Mt),motion:A.getAttribute(At),columnMark:w.getAttribute(Tt),width:A.style.getPropertyValue(Ie),widthPriority:A.style.getPropertyPriority(Ie),placed:!1})}if(!q){if(/^\d+(?:\.\d+)?px$/.test(A.style.width)){let F=e.getComputedStyle(w);m.expandedWidth=parseFloat(A.style.width)-(parseFloat(F.borderLeftWidth)||0)-(parseFloat(F.borderRightWidth)||0)}else m.moving||(m.expandedWidth=w.clientWidth);if(m.expandedWidth>0){let F=`${m.expandedWidth}px`;A.style.getPropertyValue(Ie)!==F&&A.style.setProperty(Ie,F)}}if(d(A,Mt,a),d(A,At,String(p)),d(w,Tt,""),m.indicator.parentElement!==A&&A.append(m.indicator),m.moving){m.indicator.hidden||(m.indicator.hidden=!0);continue}let s=[...A.querySelectorAll('[aria-selected="true"], [aria-current="page"], [class$="_selected"], [class*="_selected "]')].find(F=>lr(F)&&(ve(F,"sessionRow")||ve(F,"searchResultRow")||F.getAttribute("role")==="treeitem")),E=m.indicator;if(!s||!lr(A)){E.hidden||(E.hidden=!0),x(m);continue}let C=s.getBoundingClientRect(),V=A.getBoundingClientRect(),_=V.top,Z=V.bottom;for(let F=s.parentElement;F&&F!==A;F=F.parentElement)if(/auto|scroll|hidden|clip/.test(e.getComputedStyle(F).overflowY)){let B=F.getBoundingClientRect();_=Math.max(_,B.top),Z=Math.min(Z,B.bottom)}let L=C.top<_-.5||C.bottom>Z+.5;E.hidden!==L&&(E.hidden=L);for(let[F,B]of Object.entries({width:`${C.width}px`,height:`${C.height}px`,transform:`translate(${C.left-V.left}px, ${C.top-V.top}px)`}))E.style[F]!==B&&(E.style[F]=B);m.placed||(m.placed=!0,e.requestAnimationFrame(()=>{r.get(A)?.indicator===E&&d(E,"data-ready","true")})),x(m)}return[...r.values()].filter(A=>A.decorated&&!A.moving).map(A=>A.root)}let v=()=>{for(let a of r.values())o.release(a.frame),d(a.frame,He,""),u(a),e.clearTimeout(a.resizeTimer),a.resizeTimer=e.setTimeout(()=>{a.resizeTimer=0,g(a.frame,He,a.resizingMark),a.dirty=!0,n()},180)},T=a=>{for(let p of r.values())p.root.contains(a.target)&&(p.dirty=!0,n())};return e.addEventListener("resize",v),t.addEventListener("scroll",T,!0),i.addEventListener("change",n),c.addEventListener("change",n),{sync:k,dispose(){e.removeEventListener("resize",v),t.removeEventListener("scroll",T,!0),i.removeEventListener("change",n),c.removeEventListener("change",n);for(let a of r.values())h(a);r.clear(),o.dispose()}}}var it=600,Rt=typeof CSS<"u"&&CSS.supports?.("animation-timing-function","linear(0, 1)")?`linear(${Ge({frequency:5.5}).map(t=>Number(t.toFixed(5))).join(",")})`:"cubic-bezier(.25,0,.2,1)",ur=`
  .dcb-theme-toggle { position:relative; isolation:isolate; display:inline-flex; flex:none; width:70px; height:30px; padding:0; overflow:hidden; border:1px solid #ffffffb8; border-radius:999px; background:rgba(210,234,247,.54); box-shadow:inset 0 1px 1px #ffffffe0,inset 0 -1px 2px #7793a640,0 2px 8px #28394c12; backdrop-filter:blur(12px) saturate(1.25); -webkit-backdrop-filter:blur(12px) saturate(1.25); cursor:pointer; -webkit-app-region:no-drag; transition:background-color ${G.time.standard}ms ${G.ease.color},border-color ${G.time.standard}ms ${G.ease.color},box-shadow ${G.time.standard}ms ${G.ease.color}; }
  .dcb-theme-toggle[data-scheme="dark"] { background:rgba(35,43,70,.68); border-color:#d7e2ff52; box-shadow:inset 0 1px 1px #ffffff40,inset 0 -1px 2px #0a102c70,0 2px 9px #00000026; }
  .dcb-theme-toggle:hover { box-shadow:inset 0 1px 1px #fff,inset 0 -1px 2px #7793a640,0 3px 12px #28394c26; }
  .dcb-theme-toggle:focus-visible { outline:2px solid var(--dsw-alias-label-primary,#333); outline-offset:3px; }
  .dcb-theme-scene { position:absolute; inset:0; overflow:hidden; border-radius:inherit; pointer-events:none; }
  .dcb-theme-thumb { position:absolute; left:3px; top:2px; width:24px; height:24px; border:1px solid #ffffffb0; border-radius:50%; background:rgba(255,255,255,.56); box-shadow:inset 0 1px 2px #fff,0 2px 5px #34445c26; transform:translateX(0); transition:transform ${G.time.standard}ms ${G.ease.smooth},background-color ${G.time.standard}ms ${G.ease.color},box-shadow ${G.time.standard}ms ${G.ease.color}; }
  [data-scheme="dark"] .dcb-theme-thumb { transform:translateX(38px); background:rgba(199,212,248,.2); box-shadow:inset 0 1px 2px #ffffff8c,0 2px 6px #05091e45; }
  .dcb-theme-thumb svg { position:absolute; inset:3px; width:16px; height:16px; overflow:visible; transition:opacity ${G.time.control}ms ${G.ease.color},transform ${G.time.standard}ms ${G.ease.smooth}; }
  .dcb-theme-sun { color:#d49020; opacity:1; transform:translateY(0) rotate(0) scale(1); }
  .dcb-theme-moon { color:#e9edff; opacity:0; transform:translateY(8px) rotate(-55deg) scale(.65); }
  [data-scheme="dark"] .dcb-theme-sun { opacity:0; transform:translateY(-8px) rotate(90deg) scale(.65); }
  [data-scheme="dark"] .dcb-theme-moon { opacity:1; transform:translateY(0) rotate(0) scale(1); }
  .dcb-theme-rays { transform-box:fill-box; transform-origin:center; }
  [data-scheme="light"] .dcb-theme-rays { animation:dcb-theme-sun-rays 16s linear infinite; }
  .dcb-theme-clouds { position:absolute; right:7px; top:10px; width:25px; height:12px; opacity:.86; transform:translateY(0); transition:opacity ${G.time.control}ms ${G.ease.color},transform ${G.time.standard}ms ${G.ease.smooth}; }
  .dcb-theme-clouds::before,.dcb-theme-clouds::after { content:''; position:absolute; border-radius:999px; background:#ffffffbd; box-shadow:0 1px 2px #7c9cad15; }
  .dcb-theme-clouds::before { left:0; top:2px; width:19px; height:5px; }
  .dcb-theme-clouds::after { right:0; bottom:0; width:14px; height:4px; }
  [data-scheme="light"] .dcb-theme-clouds::before { animation:dcb-theme-cloud-drift 5s ease-in-out infinite alternate; }
  [data-scheme="light"] .dcb-theme-clouds::after { animation:dcb-theme-cloud-drift 6s ease-in-out -2s infinite alternate-reverse; }
  [data-scheme="dark"] .dcb-theme-clouds { opacity:0; transform:translateY(8px); }
  .dcb-theme-stars { position:absolute; left:8px; top:6px; width:23px; height:17px; opacity:0; transform:translateY(-8px) scale(.8); transition:opacity ${G.time.material}ms ${G.ease.color},transform ${G.time.standard}ms ${G.ease.smooth}; }
  [data-scheme="dark"] .dcb-theme-stars { opacity:1; transform:translateY(0) scale(1); }
  .dcb-theme-stars i { position:absolute; width:3px; height:3px; background:#e8efff; border-radius:1px; transform:rotate(45deg); }
  .dcb-theme-stars i:nth-child(1) { left:2px; top:2px; }
  .dcb-theme-stars i:nth-child(2) { left:16px; top:6px; width:2px; height:2px; }
  .dcb-theme-stars i:nth-child(3) { left:7px; top:12px; width:2px; height:2px; }
  [data-scheme="dark"] .dcb-theme-stars i { animation:dcb-theme-star 3s ease-in-out infinite; }
  [data-scheme="dark"] .dcb-theme-stars i:nth-child(2) { animation-delay:-1s; }
  [data-scheme="dark"] .dcb-theme-stars i:nth-child(3) { animation-delay:-2s; }
  .dcb-theme-notice { position:absolute; width:1px; height:1px; padding:0; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
  @keyframes dcb-theme-sun-rays { to { transform:rotate(360deg); } }
  @keyframes dcb-theme-cloud-drift { from { transform:translateX(-3px); } to { transform:translateX(3px); } }
  @keyframes dcb-theme-star { 0%,100% { opacity:.35; transform:rotate(45deg) scale(.7); } 50% { opacity:1; transform:rotate(45deg) scale(1); } }
  :root[data-dcb-theme-transition]::view-transition { pointer-events:none; }
  :root[data-dcb-theme-transition]::view-transition-old(root),:root[data-dcb-theme-transition]::view-transition-new(root) { animation:none; mix-blend-mode:normal; }
  :root[data-dcb-theme-transition]::view-transition-new(root) { z-index:1; }
  :root[data-dcb-theme-transition]::view-transition-group(dcb-theme-control),:root[data-dcb-theme-transition]::view-transition-group(dcb-theme-orb) { animation-duration:${G.time.standard}ms; animation-timing-function:${G.ease.smooth}; z-index:2; }
  :root[data-dcb-theme-transition]::view-transition-old(dcb-theme-control),:root[data-dcb-theme-transition]::view-transition-old(dcb-theme-orb) { animation:dcb-theme-old ${G.time.standard}ms ${G.ease.color} both; }
  :root[data-dcb-theme-transition]::view-transition-new(dcb-theme-control),:root[data-dcb-theme-transition]::view-transition-new(dcb-theme-orb) { animation:dcb-theme-new ${G.time.standard}ms ${G.ease.smooth} both; }
  :root[data-dcb-theme-transition] .dcb-theme-toggle[data-dcb-theme-source] .dcb-theme-thumb,:root[data-dcb-theme-transition] .dcb-theme-toggle[data-dcb-theme-source] .dcb-theme-thumb svg { transition:none!important; }
  @keyframes dcb-theme-old { to { opacity:0; } }
  @keyframes dcb-theme-new { from { opacity:0; } to { opacity:1; } }
  :root[data-dcb-theme-transition][data-dcb-theme-fallback] body { transition:background-color ${it}ms ${Rt},color ${it}ms ${Rt}; }
  @media(prefers-reduced-motion:reduce) { .dcb-theme-toggle,.dcb-theme-toggle *,.dcb-theme-toggle *::before,.dcb-theme-toggle *::after { animation:none!important; transition:none!important; } }
  @media(forced-colors:active) { .dcb-theme-toggle { background:ButtonFace; border-color:ButtonText; box-shadow:none; backdrop-filter:none; -webkit-backdrop-filter:none; } .dcb-theme-toggle,.dcb-theme-toggle *,.dcb-theme-toggle *::before,.dcb-theme-toggle *::after { animation:none!important; transition:none!important; } .dcb-theme-thumb { background:Canvas; border-color:CanvasText; box-shadow:none; } .dcb-theme-thumb svg { color:CanvasText; } .dcb-theme-clouds,.dcb-theme-stars { display:none; } }
`;function fr(t,e,n){let r=t.createElement,o=e.documentElement,i=n.matchMedia("(prefers-reduced-motion: reduce)"),c=n.matchMedia("(forced-colors: active)"),g=new Set,d=o.getAttribute("data-dcb-theme-transition"),b=o.getAttribute("data-dcb-theme-fallback"),u=null,x=!1,R=0,$=null,h=null,D={available:!1,dark:e.body.hasAttribute("data-ds-dark-theme"),busy:!1,error:""},f=w=>(g.add(w),()=>g.delete(w)),S=()=>D,y=(w,O)=>O===null?o.removeAttribute(w):o.setAttribute(w,O);function k(w){let O={...D,...w};if(!Object.keys(O).every(q=>O[q]===D[q])){D=O;for(let q of g)q()}}function v(w){if(!x)try{let O=w||u?.getTheme();k({available:!!u,dark:O?.active?.colorScheme?O.active.colorScheme==="dark":D.dark})}catch{k({available:!1})}}function T(w){if($===w){n.clearTimeout(w.timer),$=null,h=null;for(let[O,q,m]of w.names||[])q?O.style.setProperty("view-transition-name",q,m):O.style.removeProperty("view-transition-name");w.button&&a(w.button,w.source),y("data-dcb-theme-transition",d),y("data-dcb-theme-fallback",b),k({busy:!1})}}let a=(w,O)=>O===null?w.removeAttribute("data-dcb-theme-source"):w.setAttribute("data-dcb-theme-source",O);function p(){let w=$;w&&(w.transition?.skipTransition(),w.animation?.cancel(),T(w))}function l(w){x||(p(),R++,u=w&&typeof w.getTheme=="function"&&typeof w.setTheme=="function"?w:null,v())}function M(w){if(x||!u)return;let O=!(h??D.dark),q=++R;p(),h=O;let m={id:q,dark:O,animation:null,transition:null,timer:0,committed:!1};$=m,k({busy:!0,error:""});let N=()=>{x||q!==R||m.committed||(m.committed=!0,u.setTheme(O?"dark":"light"),v())},s=()=>{$===m&&(v(),k({error:"\u4E3B\u9898\u5207\u6362\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5"}),T(m))};if(i.matches||c.matches){try{N(),T(m)}catch{s()}return}o.setAttribute("data-dcb-theme-transition",O?"dark":"light");let E=()=>{if(!(x||q!==R)){o.setAttribute("data-dcb-theme-fallback","");try{N(),m.timer=n.setTimeout(()=>T(m),it)}catch{s()}}};if(typeof e.startViewTransition!="function"){E();return}let C=w.getBoundingClientRect(),V=C.left+C.width/2,_=C.top+C.height/2,Z=Math.hypot(Math.max(V,n.innerWidth-V),Math.max(_,n.innerHeight-_));try{m.button=w,m.source=w.getAttribute("data-dcb-theme-source"),m.names=[];for(let[L,F]of[[w,"dcb-theme-control"],[w.querySelector(".dcb-theme-thumb"),"dcb-theme-orb"]])L&&(m.names.push([L,L.style.getPropertyValue("view-transition-name"),L.style.getPropertyPriority("view-transition-name")]),L.style.setProperty("view-transition-name",F));w.setAttribute("data-dcb-theme-source",""),m.transition=e.startViewTransition(N),m.transition.updateCallbackDone.catch(s),m.transition.ready.then(()=>{x||q!==R||(m.animation=o.animate([{clipPath:`circle(0px at ${V}px ${_}px)`,opacity:.2},{clipPath:`circle(${Z}px at ${V}px ${_}px)`,opacity:1}],{duration:it,easing:Rt,pseudoElement:"::view-transition-new(root)"}),m.animation.id="dcb-theme-reveal",m.animation.finished.catch(()=>{}))}).catch(()=>{$===m&&!m.committed&&E()}),m.transition.finished.then(()=>T(m),()=>T(m))}catch{E()}}function U(){let w=t.useSyncExternalStore(f,S,S);return w.available?r(t.Fragment,null,r("button",{type:"button",className:"dcb-theme-toggle",role:"switch","aria-label":w.dark?"\u5207\u6362\u5230\u65E5\u95F4\u4E3B\u9898":"\u5207\u6362\u5230\u591C\u95F4\u4E3B\u9898","aria-checked":w.dark,"data-scheme":w.dark?"dark":"light","data-transitioning":w.busy,title:w.error||(w.dark?"\u591C\u95F4\u4E3B\u9898 \xB7 \u5207\u6362\u5230\u767D\u5929":"\u65E5\u95F4\u4E3B\u9898 \xB7 \u5207\u6362\u5230\u9ED1\u591C"),onClick:O=>M(O.currentTarget)},r("span",{className:"dcb-theme-scene","aria-hidden":!0},r("span",{className:"dcb-theme-clouds"}),r("span",{className:"dcb-theme-stars"},r("i"),r("i"),r("i")),r("span",{className:"dcb-theme-thumb"},r("svg",{className:"dcb-theme-sun",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.7},r("circle",{cx:12,cy:12,r:4,fill:"currentColor",stroke:"none"}),r("g",{className:"dcb-theme-rays"},r("path",{d:"M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",strokeLinecap:"round"}))),r("svg",{className:"dcb-theme-moon",viewBox:"0 0 24 24",fill:"currentColor"},r("path",{d:"M20.6 14.1A8.7 8.7 0 0 1 9.9 3.4a8.7 8.7 0 1 0 10.7 10.7Z"}))))),r("span",{className:"dcb-theme-notice",role:"status","aria-live":"polite"},w.error)):null}let A=()=>{(i.matches||c.matches)&&(R++,p(),v())};return i.addEventListener("change",A),c.addEventListener("change",A),{Button:U,connect:l,sync:v,dispose(){x||(R++,p(),x=!0,u=null,i.removeEventListener("change",A),c.removeEventListener("change",A),g.clear())}}}var Re=t=>`:is([class$="_${t}"],[class*="_${t} "])`,xe="data-dcb-focus-frame",Se="data-dcb-focus-part",ke="data-dcb-focus-hidden",mr=`[data-composer-seat],[data-conversation-content],[data-rightbar-col],${Re("sidebarCol")},${Re("rightbarCol")},.dcb-summary,.dcb-file-viewer,.dcb-focus-toggle`,pr=`
  .dcb-focus-toggle { display:inline-grid; place-items:center; flex:none; width:30px; height:30px; padding:0; margin-left:6px; border:1px solid #8883; border-radius:9px; background:#ffffff66; color:var(--dsw-alias-label-primary,#303237); cursor:pointer; -webkit-app-region:no-drag; transition:background-color 180ms ${G.ease.color},border-color 180ms ${G.ease.color},transform 220ms ${G.ease.smooth}; }
  .dcb-focus-toggle:hover { background:#8882; border-color:#8886; }
  .dcb-focus-toggle:active { transform:scale(.9); }
  .dcb-focus-toggle[aria-pressed=true] { color:#fff; background:#191919; border-color:#666; }
  .dcb-focus-toggle:focus-visible { outline:2px solid #888; outline-offset:3px; }
  .dcb-focus-toggle svg { display:block; width:17px; height:17px; }
  .dcb-focus-toggle path { transition:d 240ms ${G.ease.smooth}; }
  body[data-ds-dark-theme] .dcb-focus-toggle { background:#ffffff0b; border-color:#ffffff36; }
  body[data-ds-dark-theme] .dcb-focus-toggle[aria-pressed=true] { background:#111; color:#fff; border-color:#aaa; }
  [${xe}] { transition:none!important; }
  [${xe}=on] { grid-template-columns:0px minmax(0px,1fr) 0px!important; column-gap:0!important; }
  [${xe}=on] > [${Se}=center] { grid-column:2!important; min-width:0; }
  [${ke}] { display:none!important; }
  [${Se}=composer][data-dcb-focus-moving] { pointer-events:none; }
  @media(prefers-reduced-motion:reduce) { .dcb-focus-toggle,.dcb-focus-toggle path { transition:none; } }
  @media(forced-colors:active) { .dcb-focus-toggle { background:ButtonFace; color:ButtonText; border-color:ButtonText; } .dcb-focus-toggle[aria-pressed=true] { background:Highlight; color:HighlightText; border-color:Highlight; } .dcb-focus-toggle,.dcb-focus-toggle path { transition:none; } }
`;function hr(t,e,n,r=()=>{}){let o=t.createElement,i=new Set,c=new Map,g=new Map,d=new Map,b=n.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)"),u={active:!1},x=null,R=null,$=null,h=null,D=!1,f=0,S=0,y=0,k=null,v=(W,I,j)=>j===null?W.removeAttribute(I):W.setAttribute(I,j),T=W=>{if(u.active!==W){u={active:W};for(let I of i)I()}},a=W=>(i.add(W),()=>i.delete(W)),p=()=>b.matches||e.hidden,l=()=>{for(let W of g.values())W.cancel();g.clear();for(let W of c.values())v(W.element,"data-dcb-focus-moving",W.moving)};function M(W){let{element:I}=W;g.get(I)?.cancel(),g.delete(I),v(I,Se,W.part),v(I,ke,W.hidden),v(I,"inert",W.inert),v(I,"aria-hidden",W.aria),v(I,"data-dcb-focus-moving",W.moving),c.delete(I)}function U(){if(!x?.isConnected)return[];let W=[];for(let I of x.children)I.matches(`${Re("sidebarCol")},.nav`)?W.push([I,"left"]):I.matches(`[data-rightbar-col],${Re("rightbarCol")},.right`)?W.push([I,"right"]):I.matches(Re("handle"))&&W.push([I,"handle"]);for(let I of R.querySelectorAll("[data-composer-seat],.dcb-summary"))W.push([I,I.matches("[data-composer-seat]")?"composer":"extra"]);for(let I of e.querySelectorAll(".dcb-file-viewer"))W.push([I,"extra"]);return W}function A(W,I){let j=c.get(W);if(j)return j;let X=W.getAttribute(Se)===I&&(W.hasAttribute(ke)||W.hasAttribute("data-dcb-focus-moving")),Q=X?[...c.values()].find(ie=>ie.kind===I&&!ie.element.isConnected):null;return j={element:W,kind:I,part:X?Q?.part??null:W.getAttribute(Se),hidden:X?Q?.hidden??null:W.getAttribute(ke),inert:X?Q?.inert??null:W.getAttribute("inert"),aria:X?Q?.aria??null:W.getAttribute("aria-hidden"),moving:X?Q?.moving??null:W.getAttribute("data-dcb-focus-moving")},c.set(W,j),W.setAttribute(Se,I),j}function w(W){W.element.setAttribute("inert",""),W.element.setAttribute("aria-hidden","true")}function O(W,I){for(let[j,X,Q,ie]of I)W.style.getPropertyValue(j)!==ie||W.style.getPropertyPriority(j)!=="important"||(X?W.style.setProperty(j,X,Q):W.style.removeProperty(j));d.delete(W)}function q(){let W=[...R.querySelectorAll("[data-conversation-content]")],I=new Set(W);for(let j of W){if(d.has(j))continue;let X=[["width",`min(100%, ${y}px)`],["max-width",y+"px"],["min-width","0px"],["align-self","center"]],Q=[...d].find(([te])=>!te.isConnected)?.[1],ie=X.map(([te,oe])=>{let he=Q?.find(([Te,,,We])=>Te===te&&j.style.getPropertyValue(te)===We&&j.style.getPropertyPriority(te)==="important");return[te,he?he[1]:j.style.getPropertyValue(te),he?he[2]:j.style.getPropertyPriority(te),oe]});d.set(j,ie);for(let[te,,,oe]of ie)j.style.setProperty(te,oe,"important")}for(let[j,X]of d)I.has(j)||O(j,X)}function m(){for(let[W,I]of d)O(W,I)}function N(){let W=new Map,I=(Q,ie)=>{Q?.getClientRects().length&&W.set(Q,{axis:ie,position:Q.getBoundingClientRect()[ie==="x"?"left":"top"]})};for(let Q of R?.querySelectorAll("[data-conversation-content]")||[]){I(Q,"x");let ie=Q.querySelector("[data-conversation-scroll]");for(let te of ie?.children||[])te.hasAttribute("data-composer-seat")||I(te,"y")}let j=R?.querySelector('[data-slot="conversation.header"]')||R?.querySelector("header"),X=[...j?.querySelectorAll(["headerLeading","titleCluster","headerUtilities","headerCorner","viewTabs"].map(Re).join(","))||[]];for(let Q of X.length?X:j?.children||[])I(Q,"x");return W}let s=(W,I)=>W.scrollTo({top:I,behavior:"instant"});function E(){let W=R?.querySelector("[data-conversation-scroll]");if(!W)return()=>{};let I=W.getBoundingClientRect(),j=W.scrollTop,X=W.scrollHeight-j-W.clientHeight<4,ie=e.elementsFromPoint(I.left+I.width*.5,Math.min(I.bottom-20,I.top+70)).find(oe=>W.contains(oe)&&!oe.closest("[data-composer-seat]"))?.closest("p,[data-chat-flow-key],[data-chat-turn],article"),te=ie?.getBoundingClientRect().top;return()=>{W.isConnected&&(X?s(W,W.scrollHeight-W.clientHeight):ie?.isConnected?s(W,W.scrollTop+ie.getBoundingClientRect().top-te):s(W,j))}}function C(W){let I=x.getAttribute(xe),j=[...c.values()].map(te=>[te.element,te.element.getAttribute(ke)]),X=R.querySelector("[data-conversation-scroll]"),Q=X?.scrollTop;x.setAttribute(xe,"on");for(let te of c.values())te.element.setAttribute(ke,"");W();let ie=N();v(x,xe,I);for(let[te,oe]of j)v(te,ke,oe);return X&&s(X,Q),ie}function V(W){w(W),W.element.setAttribute(ke,"")}function _(W){if(l(),W&&x){let I=k||E();x.setAttribute(xe,"on");for(let j of c.values())V(j);I()}else{let I=E();for(let j of[...c.values()])M(j);x&&v(x,xe,$),R&&v(R,Se,h),m(),I(),x=null,R=null,F.disconnect()}k=null,r()}function Z(){if(S=0,D||!u.active)return;if(!x?.isConnected||!x.querySelector(".dcb-focus-toggle")){re(!1);return}q();let W=U(),I=new Set(W.map(([j])=>j));for(let[j,X]of W)if(!c.has(j)){let Q=A(j,X);V(Q)}for(let[j,X]of c)I.has(j)||M(X)}function L(){!S&&!D&&(S=n.requestAnimationFrame(Z))}let F=new n.MutationObserver(W=>{if(u.active){if(!x?.isConnected){L();return}W.some(I=>[...I.addedNodes,...I.removedNodes].some(j=>j.nodeType===1&&(j.matches(mr)||!I.target.closest?.("[data-chat-flow]")&&j.querySelector(mr))))&&L()}});function B(W,I,j){let X=W.element;if(W.kind==="handle"||W.hidden!==null)return;let Q=n.getComputedStyle(X),ie={opacity:I?0:Q.opacity},te={opacity:I?Q.opacity:0};if(Q.display!=="none"){if(W.kind==="composer"){W.element.setAttribute("data-dcb-focus-moving","");let oe=`translateY(12px)${Q.transform==="none"?"":" "+Q.transform}`;te.transform=I?Q.transform:oe,ie.transform=I?oe:Q.transform}else te.opacity=I?Q.opacity:0;j&&Object.assign(te,j);try{let oe=X.animate([te,ie],{duration:G.time.scene,easing:G.ease.smooth,fill:"both"});oe.id="dcb-focus-"+W.kind,g.set(X,oe)}catch{}}}function P(){let W=new Map;for(let[I]of g){let j=n.getComputedStyle(I),X={opacity:j.opacity};c.get(I)?.kind==="composer"&&(X.transform=j.transform),W.set(I,X)}return W}function K(W,I,j,X=!1){let Q=++f;if(p()){_(W);return}let ie=N(),te=W?C(k):ie;for(let oe of c.values())B(oe,W,I?.get(oe.element));for(let[oe,he]of te){let Te=ie.get(oe),We=j?.get(oe)||Te;if(!Te||!We)continue;let be=We.position-Te.position,je=he.position-Te.position;if(Math.abs(be)<.1&&Math.abs(je)<.1)continue;let z=n.getComputedStyle(oe),H=z.transform==="none"?"":` ${z.transform}`,J=ne=>`translate${he.axis.toUpperCase()}(${ne}px)${H}`;try{let ne=oe.animate([{transform:J(be)},{transform:J(je)}],{duration:G.time.scene,easing:G.ease.smooth,fill:"both"});ne.id="dcb-focus-position",g.set(oe,ne)}catch{}}if(!W&&!X&&g.size){for(let oe of g.values())oe.pause(),oe.currentTime=0,oe.finished.catch(()=>{});n.requestAnimationFrame(()=>n.requestAnimationFrame(()=>n.requestAnimationFrame(()=>{if(D||Q!==f)return;let oe=N(),he=P();l(),K(!1,he,oe,!0)})));return}Promise.allSettled([...g.values()].map(oe=>oe.finished)).then(()=>{!D&&Q===f&&_(W)})}function ee(W){if(!D){if(x){let I=P(),j=N();l(),q(),k=E(),T(!0);for(let X of c.values())w(X);K(!0,I,j);return}if(R=W.closest(Re("centerCol"))||W.closest("main"),x=R?.parentElement,!x||!U().length){x=null,R=null;return}y=R.querySelector("[data-conversation-content]")?.getBoundingClientRect().width||R.getBoundingClientRect().width,q(),$=x.getAttribute(xe),h=R.getAttribute(Se),x.setAttribute(xe,"entering"),R.setAttribute(Se,"center");for(let[I,j]of U()){let X=A(I,j);w(X)}k=E(),T(!0),F.observe(e.body,{childList:!0,subtree:!0}),K(!0)}}function re(W=!0){if(!x){T(!1);return}let I=P(),j=N();l(),k=null;let X=E();v(x,xe,$),x.setAttribute(xe,"leaving");for(let Q of c.values())v(Q.element,ke,Q.hidden);m(),X(),T(!1),W?K(!1,I,j):(f++,_(!1))}function ae(){let W=t.useSyncExternalStore(a,()=>u,()=>u);return o("button",{type:"button",className:"dcb-focus-toggle","aria-label":W.active?"\u9000\u51FA\u4E13\u6CE8\u6A21\u5F0F":"\u8FDB\u5165\u4E13\u6CE8\u6A21\u5F0F","aria-pressed":W.active,title:W.active?"\u9000\u51FA\u4E13\u6CE8\u6A21\u5F0F \xB7 Esc":"\u4E13\u6CE8\u9605\u8BFB \xB7 \u9690\u85CF\u8F93\u5165\u6846\u548C\u5DE6\u53F3\u9762\u677F",onClick:I=>W.active?re():ee(I.currentTarget)},o("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0},o("rect",{x:3,y:4,width:18,height:16,rx:3}),o("path",{d:W.active?"M8 9h8v6H8Z":"M8 4v16m8-16v16M8 16h8"})))}let se=W=>{W.key!=="Escape"||W.defaultPrevented||!u.active||W.isComposing||W.target.closest?.("[role=dialog],[role=menu],[role=listbox]")||(W.preventDefault(),re())},Y=()=>{p()&&x&&(f++,_(u.active))};return e.addEventListener("keydown",se),b.addEventListener("change",Y),e.addEventListener("visibilitychange",Y),{Button:ae,dispose(){D||(D=!0,f++,F.disconnect(),n.cancelAnimationFrame(S),_(!1),T(!1),i.clear(),e.removeEventListener("keydown",se),b.removeEventListener("change",Y),e.removeEventListener("visibilitychange",Y))}}}var $e="data-dcb-empty-composer-slot",ze="data-dcb-composer-slot-motion",br=t=>`:is([class$="_${t}"],[class*="_${t} "])`,So=`[data-composer-card] ${br("trailing")} > ${br("activity")}`,gr=`
  [${$e}] { display: none !important; }
  [${ze}] { display: flex !important; box-sizing: border-box; min-width: 0; overflow: hidden; will-change: width, margin-inline-end, opacity, filter; }
`;function vr(t,e,n){let r=new Map,o=e.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)"),i=(h,D,f)=>f===null?h.removeAttribute(D):h.setAttribute(D,f),c=(h,D,f)=>{h.hasAttribute(D)!==f&&h.toggleAttribute(D,f)},g=h=>e.getComputedStyle(h).visibility!=="hidden"&&[...h.getClientRects()].some(D=>D.width>.5&&D.height>.5);function d(h){let D=t.createTreeWalker(h,e.NodeFilter.SHOW_ELEMENT|e.NodeFilter.SHOW_TEXT);for(let f=D.nextNode();f;f=D.nextNode()){let S=f.nodeType===3?f.parentElement:f;if(!(!S||S.closest("style,script,template")||!g(S)))if(f.nodeType===3){if(!f.textContent.trim())continue;let y=t.createRange();if(y.selectNodeContents(f),[...y.getClientRects()].some(k=>k.width>.5&&k.height>.5))return!0}else{if(S.matches('button,input,select,textarea,a[href],svg,img,canvas,video,audio,progress,meter,[role="button"],[role="status"],[role="progressbar"],[contenteditable="true"]'))return!0;{let y=e.getComputedStyle(S);if(y.backgroundImage!=="none"||!["transparent","rgba(0, 0, 0, 0)"].includes(y.backgroundColor))return!0;for(let k of["::before","::after"])if(!["none","normal",'""'].includes(e.getComputedStyle(S,k).content))return!0}}}return!1}function b(h){h.animation?.cancel(),h.animation=null,c(h.root,ze,!1),c(h.root,$e,h.empty),h.width=h.empty?0:h.root.getBoundingClientRect().width}function u(h,D){let f=h.empty===void 0,S=h.root,y=h.empty,k=parseFloat(e.getComputedStyle(S.parentElement).columnGap)||0,v=h.animation?S.getBoundingClientRect().width:h.width,T=h.animation?parseFloat(e.getComputedStyle(S).marginInlineEnd)||0:y?-k:0;h.animation?.cancel(),h.animation=null,c(S,ze,!1),c(S,$e,!1);let a=D?0:S.getBoundingClientRect().width;if(h.empty=D,f||o.matches||!S.animate||!v&&!a){b(h);return}c(S,ze,!0);let p=S.animate([{width:`${v}px`,marginInlineEnd:`${T}px`,opacity:y?0:1,filter:y?"blur(2px)":"blur(0px)"},{width:`${a}px`,marginInlineEnd:`${D?-k:0}px`,opacity:D?0:1,filter:D?"blur(2px)":"blur(0px)"}],{duration:G.time.material,easing:G.ease.smooth,fill:"both"});h.animation=p,p.finished.then(()=>{h.animation===p&&(b(h),n())}).catch(()=>{})}function x(h){h.observer.disconnect(),h.resize.disconnect(),h.animation?.cancel(),i(h.root,$e,h.originalEmpty),i(h.root,ze,h.originalMotion)}function R(){let h=new Set(t.querySelectorAll(So));for(let[D,f]of r)h.has(D)||(x(f),r.delete(D));for(let D of h){let f=r.get(D);if(!f){f={root:D,width:D.getBoundingClientRect().width,dirty:!0,empty:void 0,animation:null,originalEmpty:D.getAttribute($e),originalMotion:D.getAttribute(ze)},f.observer=new e.MutationObserver(()=>{f.dirty=!0,n()}),f.observer.observe(D,{subtree:!0,childList:!0,characterData:!0,attributes:!0,attributeFilter:["class","style","hidden","aria-hidden"]});for(let y=D.parentElement;y;y=y.parentElement)f.observer.observe(y,{attributes:!0,attributeFilter:["class","style","hidden"]});f.resize=new e.ResizeObserver(()=>{f.animation||(f.dirty=!0,n())}),f.resize.observe(D),r.set(D,f)}if(!f.dirty)continue;f.dirty=!1,c(D,$e,!1);let S=!d(D);f.empty!==S?u(f,S):f.animation||(c(D,$e,S),S||(f.width=D.getBoundingClientRect().width))}}let $=()=>{for(let h of r.values())h.animation&&b(h);n()};return o.addEventListener("change",$),{sync:R,dispose(){o.removeEventListener("change",$);for(let h of r.values())x(h);r.clear()}}}var Eo=0,at=32,xr=Object.freeze({welcomeEnabled:!0,welcomeText:"\u6B22\u8FCE\u56DE\u6765",welcomeFont:"Lolita",welcomeDuration:1700,welcomeLogo:!0,welcomeMode:"text",welcomeMediaFit:"contain",welcomeMediaDuration:3e3,welcomeMediaRevision:""});function Ee(t){let e=(n,r,o)=>typeof n=="string"&&[...n.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim()].slice(0,r).join("")||o;return{welcomeEnabled:typeof t?.welcomeEnabled=="boolean"?t.welcomeEnabled:!0,welcomeText:e(t?.welcomeText,at,xr.welcomeText),welcomeFont:e(t?.welcomeFont,80,xr.welcomeFont),welcomeDuration:Number.isFinite(t?.welcomeDuration)?Math.round(Math.min(4e3,Math.max(900,t.welcomeDuration))):1700,welcomeLogo:t?.welcomeLogo!==!1,welcomeMode:t?.welcomeMode==="media"?"media":"text",welcomeMediaFit:t?.welcomeMediaFit==="cover"?"cover":"contain",welcomeMediaDuration:Number.isFinite(t?.welcomeMediaDuration)?Math.round(Math.min(1e4,Math.max(1e3,t.welcomeMediaDuration))):3e3,welcomeMediaRevision:e(t?.welcomeMediaRevision,80,"")}}function Mo(t,e,n){let r=Uint8Array.from(t,h=>h>48?1:0),o=r.slice(),i=new Float32Array(r.length);for(let h=1;h<n-1;h++)for(let D=1;D<e-1;D++){let f=h*e+D;r[f]&&(i[f]=1+Math.min(i[f-1],i[f-e],i[f-e-1]))}for(let h=n-2;h>0;h--)for(let D=e-2;D>0;D--){let f=h*e+D;r[f]&&(i[f]=Math.min(i[f],1+Math.min(i[f+1],i[f+e],i[f+e+1])))}for(let h=0;h<24;h++){let D=0;for(let f=0;f<2;f++){let S=[];for(let y=1;y<n-1;y++)for(let k=1;k<e-1;k++){let v=y*e+k;if(!o[v])continue;let T=[o[v-e],o[v-e+1],o[v+1],o[v+e+1],o[v+e],o[v+e-1],o[v-1],o[v-e-1]],a=T.reduce((l,M)=>l+M,0);if(a<2||a>6)continue;let p=0;for(let l=0;l<8;l++)!T[l]&&T[(l+1)%8]&&p++;p===1&&((f===0?T[0]*T[2]*T[4]||T[2]*T[4]*T[6]:T[0]*T[2]*T[6]||T[0]*T[4]*T[6])||S.push(v))}for(let y of S)o[y]=0;D+=S.length}if(!D)break}let c=h=>{let D=[],f=h%e,S=Math.floor(h/e);for(let y=-1;y<=1;y++)for(let k=-1;k<=1;k++){if(!k&&!y||f+k<0||f+k>=e||S+y<0||S+y>=n)continue;let v=h+y*e+k;o[v]&&!(k&&y&&(o[h+k]||o[h+y*e]))&&D.push(v)}return D},g=[];for(let h=0;h<o.length;h++)o[h]&&g.push(h);let d=new Map(g.map(h=>[h,c(h)])),b=new Set,u=(h,D)=>h<D?h*o.length+D:D*o.length+h,x=h=>d.get(h).filter(D=>!b.has(u(h,D))),R=[],$=[...g.filter(h=>d.get(h).length===1),...g];for(let h of $){if(R.length>=48)break;for(;x(h).length&&R.length<48;){let D=[h],f=h,S=null,y=i[h];for(let k=0;k<2048;k++){let v=x(f);if(!v.length)break;let T=S===null?1:f%e-S%e,a=S===null?1:Math.floor(f/e)-Math.floor(S/e);v.sort((l,M)=>{let U=A=>{let w=A%e-f%e,O=Math.floor(A/e)-Math.floor(f/e);return(T*w+a*O)/Math.hypot(w,O)};return U(M)-U(l)});let p=v[0];b.add(u(f,p)),S=f,f=p,D.push(p),y=Math.max(y,i[p])}D.length>2&&R.push({points:D.map(k=>[k%e,Math.floor(k/e)]),width:Math.max(5,y*2.8+2)})}}for(let h of g)!d.get(h).length&&R.length<48&&R.push({points:[[h%e,Math.floor(h/e)],[h%e+.1,Math.floor(h/e)]],width:Math.max(5,i[h]*3+2)});return R}function yr(t,e){let{welcomeText:n,welcomeFont:r}=Ee(e),o="http://www.w3.org/2000/svg",i=(f,S={})=>{let y=t.createElementNS(o,f);for(let[k,v]of Object.entries(S))y.setAttribute(k,v);return y},c=i("svg",{"aria-hidden":"true","data-dcb-welcome-art":"","data-welcome-font":r}),g=i("defs"),d=[],b=[];c.append(g);let u=t.createElement("canvas");u.width=160,u.height=128;let x=u.getContext("2d",{willReadFrequently:!0});if(!x)throw Error("Local font drawing unavailable");let R=r==="hand"?"KaiTi":r,$=`96px ${JSON.stringify(R)}, cursive`;x.font=$;let h=0,D=new Map;for(let f of n){let S=D.get(f);if(!S){x.clearRect(0,0,160,128),x.font=$,x.fillStyle="#000",x.fillText(f,12,104);let p=x.getImageData(0,0,160,128).data,l=new Uint8Array(20480);for(let M=0;M<l.length;M++)l[M]=p[M*4+3];S={paths:Mo(l,160,128),advance:Math.min(140,Math.max(24,x.measureText(f).width))+12},D.set(f,S)}let y=i("g",{transform:`translate(${h} 0)`,"data-welcome-character":f}),k=`dcb-welcome-ink-${++Eo}`,v=i("mask",{id:k,maskUnits:"userSpaceOnUse",x:0,y:0,width:160,height:128,style:"mask-type:luminance"});for(let p of S.paths){let l=i("path",{d:p.points.map(([M,U],A)=>`${A?"L":"M"}${M} ${U}`).join(" "),stroke:"#fff",pathLength:1,"data-dcb-welcome-stroke":""});l.style.strokeWidth=String(p.width),v.append(l),d.push(l)}let T=i("rect",{x:0,y:0,width:160,height:128,fill:"#fff",opacity:0});v.append(T),b.push(T),g.append(v);let a=i("text",{x:12,y:104,"font-size":96,"font-weight":400,fill:"currentColor",mask:`url(#${k})`});a.style.fontFamily=`${JSON.stringify(R)}, cursive`,a.textContent=f,y.append(a),c.append(y),h+=S.advance}return c.setAttribute("viewBox",`0 0 ${Math.max(40,h+12)} 128`),{svg:c,strokes:d,finishes:b}}function st(t,e=1700){let n=[],r=t.strokes.map(c=>Math.max(12,c.getTotalLength())),o=r.reduce((c,g)=>c+g,0),i=120;try{for(let[c,g]of t.strokes.entries()){let d=(e-220)*r[c]/o,b=g.animate([{strokeDashoffset:1},{strokeDashoffset:0}],{duration:d,delay:i,easing:"cubic-bezier(.35,0,.25,1)",fill:"both"});b.id=`dcb-startup-ink-${c}`,n.push(b),i+=d}for(let[c,g]of(t.finishes||[]).entries()){let d=g.animate([{opacity:0},{opacity:1}],{duration:100,delay:e-100,fill:"both"});d.id=`dcb-startup-ink-finish-${c}`,n.push(d)}return n}catch(c){for(let g of n)g.cancel();throw c}}var To=[["M16 39 Q33 35 50 38 Q43 67 16 91","M19 55 Q34 70 51 88","M77 20 Q70 40 59 49","M70 41 Q89 37 106 40 Q104 49 99 55","M82 50 Q80 83 55 105","M82 67 Q92 93 111 102"],["M52 26 Q43 33 34 36","M34 36 L33 75 Q44 73 51 67","M56 28 Q54 56 55 87","M58 33 Q72 30 82 33 L81 69 Q80 79 68 73","M12 29 Q20 32 24 39","M11 54 Q19 51 26 54 Q23 68 18 78","M17 81 Q28 93 46 95 Q76 99 108 93"],["M19 27 Q16 65 20 103","M20 27 Q55 23 97 27 Q100 65 95 103","M39 47 Q38 63 39 80","M40 47 Q60 45 77 47 L77 80","M40 80 Q58 78 77 80","M21 103 Q58 105 95 103"],["M19 36 Q57 32 99 34","M34 44 Q40 49 44 55","M83 42 Q78 51 71 57","M14 63 Q59 58 106 61","M61 20 Q58 62 60 109","M57 66 Q37 91 12 100","M64 67 Q83 89 109 99"]];function ct(t,e){let n=Ee(e);if(n.welcomeFont!=="hand"||n.welcomeText!=="\u6B22\u8FCE\u56DE\u6765")return yr(t,n);let r="http://www.w3.org/2000/svg",o=t.createElementNS(r,"svg");o.setAttribute("viewBox","0 0 540 136"),o.setAttribute("aria-hidden","true"),o.setAttribute("data-dcb-welcome-art","");let i=[];for(let[c,g]of To.entries()){let d=t.createElementNS(r,"g");d.setAttribute("transform",`translate(${c*136+4} 5)`),d.setAttribute("data-welcome-character","\u6B22\u8FCE\u56DE\u6765"[c]),d.setAttribute("stroke","currentColor");for(let b of g){let u=t.createElementNS(r,"path");u.setAttribute("d",b),u.setAttribute("pathLength","1"),u.setAttribute("data-dcb-welcome-stroke",""),d.append(u),i.push(u)}o.append(d)}return{svg:o,strokes:i}}var Ao="dsh-ui-beautify-welcome",$t="media",Nt="opening",Lt=(t,e)=>t>0&&e>0&&t<=4096&&e<=4096&&t*e<=8294400;function Uo(t){let e=(n,r)=>String.fromCharCode(...t.slice(n,r));return t.length>=10&&(e(0,6)==="GIF87a"||e(0,6)==="GIF89a")?"image/gif":t.length>=24&&t[0]===137&&e(1,4)==="PNG"&&t[4]===13&&t[5]===10&&t[6]===26&&t[7]===10?"image/png":e(0,4)==="RIFF"&&e(8,12)==="WEBP"?"image/webp":e(4,8)==="ftyp"?"video/mp4":t[0]===26&&t[1]===69&&t[2]===223&&t[3]===163?"video/webm":null}function wr(t){let e=null,n=null,r=!1,o=()=>r?Promise.reject(Error("\u5F00\u5C4F\u5B58\u50A8\u5DF2\u5173\u95ED")):n?Promise.resolve(n):(e||(e=new Promise((c,g)=>{if(!t.indexedDB){g(Error("\u5F53\u524D\u73AF\u5883\u65E0\u6CD5\u4FDD\u5B58\u5F00\u5C4F\u6587\u4EF6"));return}let d=t.indexedDB.open(Ao,1);d.onupgradeneeded=()=>d.result.createObjectStore($t),d.onerror=()=>{e=null,g(Error("\u65E0\u6CD5\u6253\u5F00\u672C\u673A\u5F00\u5C4F\u5B58\u50A8"))},d.onblocked=()=>{e=null,g(Error("\u5F00\u5C4F\u5B58\u50A8\u88AB\u5360\u7528\uFF0C\u8BF7\u5173\u95ED\u5176\u4ED6\u8BBE\u7F6E\u7A97\u53E3\u540E\u91CD\u8BD5"))},d.onsuccess=()=>{if(r){d.result.close(),g(Error("\u5F00\u5C4F\u5B58\u50A8\u5DF2\u5173\u95ED"));return}n=d.result,n.onversionchange=()=>{n?.close(),n=null,e=null},c(n)}})),e),i=async(c,g)=>{let d=await o();return new Promise((b,u)=>{let x=d.transaction($t,c),R,$=g(x.objectStore($t));$.onsuccess=()=>{R=$.result},x.oncomplete=()=>b(R),x.onerror=x.onabort=()=>u(Error("\u65E0\u6CD5\u4FDD\u5B58\u5F00\u5C4F\u6587\u4EF6\uFF0C\u8BF7\u68C0\u67E5\u672C\u673A\u53EF\u7528\u7A7A\u95F4"))})};return{load:()=>i("readonly",c=>c.get(Nt)),save:c=>i("readwrite",g=>g.put(c,Nt)),remove:()=>i("readwrite",c=>c.delete(Nt)),dispose(){r=!0,n?.close(),n=null}}}async function Dr(t,e,n){if(!t?.size)throw Error("\u8BF7\u9009\u62E9\u975E\u7A7A\u7684\u52A8\u56FE\u6216\u89C6\u9891\u6587\u4EF6");if(t.size>20971520)throw Error("\u6587\u4EF6\u9700\u5C0F\u4E8E 20MB\uFF0C\u5EFA\u8BAE\u4F7F\u7528\u8F83\u77ED\u3001\u8F83\u5C0F\u7684\u7D20\u6750");let r=new Uint8Array(await t.slice(0,32).arrayBuffer()),o=Uo(r);if(!o)throw Error("\u652F\u6301 GIF\u3001APNG/PNG\u3001WebP\u3001MP4 \u548C WebM \u6587\u4EF6");if(o==="image/gif"){let d=r[6]+r[7]*256,b=r[8]+r[9]*256;if(!Lt(d,b))throw Error("\u753B\u9762\u8FC7\u5927\uFF0C\u8BF7\u7F29\u5C0F\u5230 4096 \u50CF\u7D20\u53CA 830 \u4E07\u50CF\u7D20\u4EE5\u5185")}if(o==="image/png"){let d=new DataView(r.buffer);if(!Lt(d.getUint32(16),d.getUint32(20)))throw Error("\u753B\u9762\u8FC7\u5927\uFF0C\u8BF7\u7F29\u5C0F\u5230 4096 \u50CF\u7D20\u53CA 830 \u4E07\u50CF\u7D20\u4EE5\u5185")}let i=o.startsWith("video/"),c=n.URL.createObjectURL(t),g=e.createElement(i?"video":"img");try{let d=await new Promise((b,u)=>{let x=n.setTimeout(()=>R(Error("\u8BFB\u53D6\u7D20\u6750\u8D85\u65F6\uFF0C\u8BF7\u6362\u4E00\u4E2A\u8F83\u5C0F\u6216\u517C\u5BB9\u7684\u6587\u4EF6")),5e3),R=$=>{if(n.clearTimeout(x),g.onload=null,g.onloadedmetadata=null,g.onerror=null,$){u($);return}let h=i?g.videoWidth:g.naturalWidth,D=i?g.videoHeight:g.naturalHeight,f=i?g.duration:null;if(!Lt(h,D)){u(Error("\u753B\u9762\u8FC7\u5927\uFF0C\u8BF7\u7F29\u5C0F\u5230 4096 \u50CF\u7D20\u53CA 830 \u4E07\u50CF\u7D20\u4EE5\u5185"));return}if(i&&(!Number.isFinite(f)||f<=0||f>15)){u(Error("\u77ED\u89C6\u9891\u9700\u5728 15 \u79D2\u4EE5\u5185"));return}b({width:h,height:D,duration:f})};g.onerror=()=>R(Error("\u65E0\u6CD5\u89E3\u7801\u8FD9\u4E2A\u7D20\u6750\uFF0C\u8BF7\u6362\u7528 GIF\u3001H.264 MP4 \u6216 WebM")),i?(g.preload="metadata",g.muted=!0,g.onloadedmetadata=()=>R()):g.onload=()=>R(),g.src=c});return{blob:new n.Blob([t],{type:o}),type:o,kind:i?"video":"image",name:String(t.name||"\u5F00\u5C4F\u7D20\u6750").slice(0,160),size:t.size,revision:n.crypto?.randomUUID?.()||String(Date.now()),...d}}finally{i&&g.pause(),g.removeAttribute("src"),i&&g.load(),n.URL.revokeObjectURL(c)}}function lt(t,e,n,r,{autoplay:o=!0,onReady:i=()=>{},onComplete:c=()=>{},onError:g=()=>{}}={}){let d=t.createElement("div");d.setAttribute("data-dcb-welcome-media",""),d.setAttribute("data-fit",r.welcomeMediaFit);let b=n?.kind==="video",u=t.createElement(b?"video":"img"),x=!1,R=!1,$=null,h=!1,D=new Set,f=[],S=(l,M)=>{let U=e.setTimeout(()=>{D.delete(U),l()},M);return D.add(U),U},y=(l,M)=>{u.addEventListener(l,M),f.push(()=>u.removeEventListener(l,M))},k=()=>{for(let l of D)e.clearTimeout(l);D.clear();for(let l of f)l();f.length=0,b&&u.pause(),u.removeAttribute("src"),b&&u.load(),$&&(e.URL.revokeObjectURL($),$=null)},v=()=>{if(!x){if(R)try{let l=b?u.videoWidth:u.naturalWidth,M=b?u.videoHeight:u.naturalHeight,U=Math.min(1,1024/l,768/M),A=t.createElement("canvas");A.width=Math.max(1,Math.round(l*U)),A.height=Math.max(1,Math.round(M*U)),A.getContext("2d").drawImage(u,0,0,A.width,A.height),d.replaceChildren(A)}catch{}x=!0,k()}},T=()=>{x||h||(h=!0,x=!0,k(),g(Error("\u5F00\u5C4F\u7D20\u6750\u64AD\u653E\u5931\u8D25")))},a=()=>{x||h||(h=!0,v(),c())},p=()=>{if(!(x||R)){R=!0;for(let l of D)e.clearTimeout(l);if(D.clear(),i(),!o){v();return}if(b){S(a,Math.min(15500,Math.max(1e3,(n.duration||15)*1e3+500)));try{Promise.resolve(u.play()).catch(T)}catch{T()}}else S(a,r.welcomeMediaDuration)}};return d.append(u),b?(u.muted=!0,u.defaultMuted=!0,u.playsInline=!0,u.preload="auto",u.disablePictureInPicture=!0,u.setAttribute("aria-label","\u5F00\u5C4F\u77ED\u89C6\u9891"),y("loadeddata",p),y("ended",a)):(u.alt="\u81EA\u5B9A\u4E49\u5F00\u5C4F\u52A8\u56FE",y("load",p)),y("error",T),!n?.blob||!n.type?.match(/^(image\/(gif|png|webp)|video\/(mp4|webm))$/)?S(T,0):($=e.URL.createObjectURL(n.blob),S(T,1500),u.src=$),{node:d,freeze:v,dispose(){x||(x=!0,k())}}}var dt=`
  [data-dcb-welcome-media] { width:100%; height:100%; min-height:0; display:grid; place-items:center; overflow:hidden; background:#000; }
  [data-dcb-welcome-media] > :is(img,video,canvas) { width:100%; height:100%; min-height:0; object-fit:contain; }
  [data-dcb-welcome-media][data-fit=cover] > :is(img,video,canvas) { object-fit:cover; }
`;var kr=Symbol.for("dsh-ui-beautify.startup-motion.v1"),Co=Symbol.for("dsh-ui-beautify.startup-status.v2"),Me=t=>`:is([class$="_${t}"],[class*="_${t} "])`,Wt=(t,e)=>[...t.classList].some(n=>n.endsWith("_"+e)),qo=96,Oo=4e6,Ro=3e4,$o=1e3,No=6500,Lo=200,Ft=300,ut="data-dcb-startup-stage",Pt={dispose(){},setSessionState(){},setRestorationTarget(){},setEnabled(){}},Wo=`
  ${dt}
  [data-dcb-welcome] { position:fixed; inset:var(--dsh-windows-titlebar-height,0px) 0 0; z-index:2147480000; display:grid; place-items:center; overflow:hidden; background:#fafbfc; color:#27292f; touch-action:manipulation; }
  body[data-ds-dark-theme] [data-dcb-welcome] { background:#1b1b1d; color:#ededf0; }
  [data-dcb-welcome-copy] { width:min(540px,72vw); margin:0; transform-origin:50% 55%; display:flex; flex-direction:column; align-items:center; gap:30px; }
  [data-dcb-welcome-copy][data-media] { width:100%; height:100%; gap:0; }
  [data-dcb-welcome-logo] { display:grid; place-items:center; height:96px; width:120px; color:#111; flex:none; }
  [data-dcb-welcome-logo] svg { display:block; width:100%; height:100%; }
  body[data-ds-dark-theme] [data-dcb-welcome-logo] { color:#ededf0; }
  [data-dcb-welcome-art] { display:block; width:100%; height:auto; overflow:visible; color:#111; }
  [data-dcb-welcome-stroke] { fill:none; stroke-width:5.3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:1; stroke-dashoffset:1; }
  body[data-ds-dark-theme] [data-dcb-welcome-art] { color:#ededf0; }
  [data-dcb-startup-hold] { opacity:0!important; pointer-events:none; }
  .dcb-welcome-sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
  button[data-dcb-welcome-skip] { position:absolute; right:28px; bottom:26px; border:1px solid #8883; border-radius:999px; padding:7px 16px; background:#88888809; color:inherit; font:12px/1.5 system-ui,sans-serif; cursor:pointer; transition:background-color 180ms ease,border-color 180ms ease; }
  button[data-dcb-welcome-skip]:hover { background:#8882; border-color:#8886; }
  button[data-dcb-welcome-skip]:focus-visible { outline:2px solid #888; outline-offset:3px; }
  @media(max-width:600px) { [data-dcb-welcome-copy]:not([data-media]) { width:84vw; } button[data-dcb-welcome-skip] { right:18px; bottom:20px; } }
  @media(prefers-reduced-motion:reduce),(forced-colors:active) { [data-dcb-welcome] { display:none; } }
`;function Sr(t,e,n,r={}){if(e[kr])return Pt;e[kr]=!0;let o=e.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)"),i={stage:"waiting-visible",reason:null,entrances:0,strokes:0};e[Co]=i;let c=Ee(n);if(!c.welcomeEnabled)return i.stage="done",i.reason="disabled",Pt;let g=t.documentElement.getAttribute(ut),d=new Map,b=[],u=new Set,x=[],R=new Set,$=new Map,h=!1,D=null,f=0,S=null,y=null,k=null,v=!1,T=!1,a=!1,p=!1,l=0,M=0,U=0,A=0,w=0,O=0,q=!1,m=null,N=null,s=!1,E=null,C=null,V=!1,_=0,Z=()=>e.performance.now(),L=z=>{i.stage=z,t.documentElement.setAttribute(ut,z)},F=(z,H,J,ne)=>{z.addEventListener(H,J,ne),x.push(()=>z.removeEventListener(H,J,ne))},B=(z,H)=>{let J=e.setTimeout(()=>{R.delete(J),z()},H);return R.add(J),J},P=z=>{e.clearTimeout(z),R.delete(z)},K=z=>{if(!z?.isConnected||!z.getClientRects().length)return!1;let H=e.getComputedStyle(z),J=z.getBoundingClientRect();return H.visibility!=="hidden"&&H.display!=="none"&&J.width>.5&&J.height>.5&&J.bottom>0&&J.right>0&&J.top<e.innerHeight&&J.left<e.innerWidth},ee=z=>{let H=z.getBoundingClientRect(),J=e.devicePixelRatio||1;return Math.max(H.height,z.scrollHeight)>e.innerHeight*1.5||Math.max(H.width,z.scrollWidth)*Math.max(H.height,z.scrollHeight)*J*J>Oo};function re(z){let H=d.get(z);H&&(d.delete(z),H.cancel())}function ae(){V=!1,E?.dispose(),E=null,C?.dispose?.(),C=null}function se(z,H){if(z){if(H)$.has(z)||$.set(z,z.getAttribute("data-dcb-startup-hold")),z.setAttribute("data-dcb-startup-hold","");else if($.has(z)){let J=$.get(z);J===null?z.removeAttribute("data-dcb-startup-hold"):z.setAttribute("data-dcb-startup-hold",J),$.delete(z)}}}function Y(z="complete"){if(!h){h=!0,i.reason=z,i.stage="done",D?.disconnect(),e.cancelAnimationFrame(f),f=0;for(let H of R)e.clearTimeout(H);R.clear();for(let H of x)H();x.length=0;for(let H of b)H.cancel();b.length=0;for(let H of d.keys())re(H);for(let H of $.keys())se(H,!1);ae(),y?.remove(),S?.remove(),y=null,S=null,k=null,N=null,m=null,g===null?t.documentElement.removeAttribute(ut):t.documentElement.setAttribute(ut,g)}}function W(z,H,J,ne){re(z);try{let de=z.animate(H,{...J,fill:"both"});return de.id=`dcb-startup-${ne}`,d.set(z,de),de.finished.then(()=>{d.get(z)===de&&re(z)},()=>{d.get(z)===de&&d.delete(z)}),de}catch{return null}}function I(){if(v||h||t.hidden)return;v=!0,l=Z(),L("writing"),S=t.createElement("style"),S.setAttribute("data-dcb-startup-style",""),S.textContent=Wo,t.head.append(S),y=t.createElement("div"),y.setAttribute("data-dcb-welcome",""),y.setAttribute("role","status"),y.setAttribute("aria-label",c.welcomeText),k=t.createElement("div"),k.setAttribute("data-dcb-welcome-copy","");let z=t.createElement("span");z.className="dcb-welcome-sr",z.textContent=c.welcomeText,k.append(z);let H=t.createElement("button");if(H.type="button",H.textContent="\u8DF3\u8FC7",H.setAttribute("data-dcb-welcome-skip",""),H.setAttribute("aria-label","\u8DF3\u8FC7\u6B22\u8FCE\u52A8\u753B"),y.append(k,H),t.body.append(y),F(y,"pointerdown",()=>Y("skip")),F(H,"click",()=>Y("skip")),!W(k,[{opacity:0,transform:"translateY(10px) scale(.96)"},{opacity:1,transform:"none"}],{duration:300,easing:G.ease.smooth},"welcome-in")){Y("unsupported");return}if(A=B(()=>Y("loading-timeout"),Ro),c.welcomeMode==="media"&&r.mediaStore){L("loading-media"),V=!0;let J=()=>{if(!(!V||h||a)){V=!1,P(_);try{j()}catch{Y("error")}}};_=B(J,800),r.mediaStore.load().then(ne=>{if(!V||h||a)return;if(!ne){J();return}V=!1,P(_),k.setAttribute("data-media",""),L("playing-media");let de=()=>{if(!(h||a)){E?.dispose(),E=null,k.removeAttribute("data-media"),k.querySelector("[data-dcb-welcome-media]")?.remove();try{j()}catch{Y("error")}}};try{E=lt(t,e,ne,c,{onComplete:()=>{h||(T=!0,L("waiting-content"),be())},onError:de}),k.append(E.node)}catch{de()}},J)}else j();be()}function j(){if(h||a)return;L("writing"),c.welcomeLogo&&r.createLogo&&(C=r.createLogo(),C?.node&&(C.node.setAttribute("data-dcb-welcome-logo",""),k.append(C.node),W(C.node,[{opacity:0,transform:"translateY(-12px) scale(.9)",filter:"blur(2px)"},{opacity:1,transform:"none",filter:"none"}],{duration:420,easing:G.ease.smooth},"logo-in")));let z=ct(t,c);k.append(z.svg);try{b.push(...st(z,c.welcomeDuration)),i.strokes=z.strokes.length}catch{Y("unsupported");return}B(()=>{T=!0,L("waiting-content"),be()},c.welcomeDuration+Lo)}function X(){let z=t.querySelector(`${Me("centerCol")} [data-conversation-content]`)||t.querySelector("[data-conversation-content]"),H=z?.closest(Me("centerCol"))||t.querySelector(Me("centerCol"))||z?.closest("main");return{body:z,center:H,frame:H?.parentElement,id:z?.getAttribute("data-conversation-session")||null}}function Q({body:z,center:H,id:J}){if(!H||!K(H))return!1;if(!z)return!![...H.children].find(K);let ne=z.getAttribute("data-content-phase");if(ne==="settling")return!1;if(J){if(m?.id===J&&m.state==="loading"||!(m?.id===J&&m.state==="open")&&z.querySelector(`[data-chat-flow] > ${Me("hint")}`))return!1}else{if(q&&!s)return O||(O=B(()=>{s=!0,O=0,be()},No)),!1;if(Z()-l<$o)return!1}return!!z.querySelector("[data-composer-card]")||!!z.querySelector("[data-chat-flow]")||!ne&&!![...z.querySelector("[data-conversation-scroll]")?.children||[]].find(K)}function ie(z){let H=t.createTreeWalker(z,e.NodeFilter.SHOW_ELEMENT),J=0;for(let ne=z;ne;ne=H.nextNode())if(++J>qo||e.getComputedStyle(ne).position==="fixed")return!1;return!0}function te(z,H,{duration:J=360,delay:ne=0,x:de=0,y:Oe=16,blur:Ae=2}={}){if(!z||u.has(H)||!K(z)||ee(z)||z===t.body)return;u.add(H);let ue=e.getComputedStyle(z),me=[{opacity:0},{opacity:ue.opacity}];ie(z)&&(me[0].transform=`translate3d(${de}px,${Oe}px,0)${ue.transform==="none"?"":` ${ue.transform}`}`,me[1].transform=ue.transform,me[0].filter=`blur(${Ae}px)${ue.filter==="none"?"":` ${ue.filter}`}`,me[1].filter=ue.filter),W(z,me,{duration:J,delay:Math.max(0,ne-(Z()-U)),easing:G.ease.smooth},H)&&i.entrances++}function oe(z,H){let J=H.querySelector("[data-conversation-scroll]"),ne=J?.getBoundingClientRect();if(!ne)return[];let de=H.querySelector("[data-composer-seat]")?.getBoundingClientRect(),Oe=Math.min(e.innerHeight,ne.bottom,de?.top??ne.bottom),Ae=Math.max(0,ne.top),ue=new Set;if(Oe<=Ae)return[];for(let me of[.15,.4,.65,.9]){let ce=t.elementsFromPoint(Math.max(1,Math.min(e.innerWidth-1,ne.left+ne.width*.5)),Ae+(Oe-Ae)*me).find(_e=>z.contains(_e));if(!ce)continue;let fe=ce.closest('[data-chat-flow-kind], [data-chat-flow-key], [data-chat-turn], [data-slot="conversation.chat.node"]'),pe=fe&&!ee(fe)?fe:ce.closest("p, pre, table, article");pe&&z.contains(pe)&&K(pe)&&!ee(pe)&&ue.add(pe)}return[...ue].filter(me=>![...ue].some(ce=>ce!==me&&ce.contains(me))).slice(0,4)}function he(z,H=!0){let{body:J,center:ne,frame:de}=z;for(let ce of $.keys())ce!==J&&se(ce,!1);let Oe=!!J&&!z.id&&q&&!s;if(se(J,Oe),J&&!Oe){let ce=J.querySelector("[data-conversation-scroll]"),fe=ce&&[...ce.children].find(pe=>!pe.hasAttribute("data-composer-seat")&&K(pe));if(H)if(fe&&!ee(fe))te(fe,"main",{duration:300,delay:70,y:12});else if(fe)for(let[pe,_e]of oe(fe,J).entries())te(_e,"main-"+pe,{duration:300,delay:70+pe*24,y:12});else te(J.querySelector(Me("headline")),"main",{duration:300,delay:70,y:12});te(J.querySelector("[data-composer-card]"),"composer",{duration:420,delay:220,y:24,blur:3})}else!J&&ne&&H&&te([...ne.children].find(K),"main",{duration:300,delay:70,y:12});let Ae=de?.querySelector(Me("sidebarCol")),ue=Ae&&[...Ae.querySelectorAll(Me("root"))].find(ce=>[...ce.children].some(fe=>Wt(fe,"logoRow")));if(!ue)return;let me=["brand","newSession","panelList","regionArea","footArea"];if(de.getAttribute("data-sidebar-collapsed")==="true"||Wt(ue,"collapsed")){for(let ce of me)u.add("sidebar-"+ce);return}for(let[ce,fe]of me.entries()){let pe=fe==="brand"?ue.querySelector(`${Me("logoRow")} ${Me(fe)}`):[...ue.children].find(_e=>Wt(_e,fe));te(pe,"sidebar-"+fe,{duration:420,delay:340+ce*24,x:-22,y:0,blur:3})}}function Te(z,H){if(h||a)return;a=!0,N={body:z.body,id:z.id},U=Z(),L("revealing"),p=H,H&&(P(A),P(O),B(()=>Y(),1e3)),he(z,H),E?.freeze();let J=k.hasAttribute("data-media")?[{opacity:1},{opacity:0}]:[{opacity:1,transform:"none",filter:"blur(0px)"},{opacity:0,transform:"translateY(-18px) scale(1.035)",filter:"blur(3px)"}];if(W(k,J,{duration:Ft,easing:G.ease.color},"welcome-out"),!W(y,[{opacity:1},{opacity:0}],{duration:Ft,easing:G.ease.color},"veil-out")){Y("unsupported");return}B(()=>{ae(),y?.remove(),y=null,k=null;for(let ne of b)ne.cancel();b.length=0,L("entering")},Ft)}function We(){if(f=0,h||t.hidden)return;if(o.matches){Y("reduced-motion");return}if(!v){try{I()}catch{Y("error")}return}for(let J of d.keys())(!J.isConnected||J!==y&&J!==k&&ee(J))&&re(J);let z=X();if(a){if(p&&(z.body!==N.body||z.id!==N.id)){Y("navigation");return}N={body:z.body,id:z.id},!p&&Q(z)&&(p=!0,P(A),P(O),B(()=>Y(),1e3)),he(z,p);return}let H=Q(z);H||(M=0,P(w),w=0),H&&!M&&(M=Z(),w=B(be,80)),T&&Te(z,H&&Z()-M>=60)}function be(){!f&&!h&&(f=e.requestAnimationFrame(We))}function je(){h||t.hidden||(D||(D=new e.MutationObserver(be),D.observe(t.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","hidden","data-conversation-session","data-content-phase","data-sidebar-collapsed"]})),be())}return o.matches||!t.body||typeof e.Element?.prototype.animate!="function"?(Y("unsupported"),Pt):(F(o,"change",()=>{o.matches&&Y("reduced-motion")}),F(t,"keydown",()=>Y("keyboard"),!0),F(t,"pointerdown",z=>{(!y||!y.contains(z.target))&&Y("interaction")},!0),F(t,"visibilitychange",()=>{t.hidden?v&&Y("hidden"):je()}),F(e,"pagehide",()=>Y("pagehide")),je(),{dispose:()=>Y("dispose"),setEnabled(z){z||Y("disabled")},setRestorationTarget(z){!h&&z&&(q=!0,be())},setSessionState(z,H){h||(m={id:z,state:H},be())}})}var Er=`
  ${dt}
  .dcb-welcome-fields { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:16px 0; }
  .dcb-welcome-field { display:grid; gap:7px; min-width:0; font-size:12px; color:var(--dsh-settings-secondary); }
  .dcb-welcome-field input { box-sizing:border-box; width:100%; min-width:0; padding:9px 11px; border:1px solid #8885; border-radius:8px; background:transparent; color:var(--dsh-settings-text); font:13px/20px system-ui; outline:none; transition:border-color 180ms ease,box-shadow 180ms ease; }
  .dcb-welcome-field input:focus { border-color:#888b; box-shadow:0 0 0 3px #8882; }
  .dcb-welcome-speeds { display:flex; flex-wrap:wrap; gap:7px; margin:10px 0 16px; }
  .dcb-welcome-speeds button,.dcb-welcome-play { padding:7px 12px; border:1px solid #8884; border-radius:8px; background:transparent; color:inherit; font:12px/18px system-ui; cursor:pointer; transition:background-color 220ms ease,border-color 220ms ease,transform 220ms ${G.ease.smooth}; }
  .dcb-welcome-speeds button[aria-checked=true] { background:#8882; border-color:#8889; }
  .dcb-welcome-speeds button:active,.dcb-welcome-play:active { transform:scale(.94); }
  .dcb-welcome-speeds button:focus-visible,.dcb-welcome-play:focus-visible { outline:2px solid #888; outline-offset:2px; }
  .dcb-welcome-demo { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:156px; padding:16px; border:1px solid #8883; border-radius:12px; background:#fafbfc; overflow:hidden; transition:background-color 220ms ease; }
  .dcb-welcome-demo[data-mode=media] { height:240px; padding:0; }
  .dcb-welcome-demo-content { width:100%; min-height:0; display:grid; place-items:center; }
  .dcb-welcome-demo[data-mode=media] .dcb-welcome-demo-content { height:100%; }
  .dcb-welcome-preview-brand { display:grid; place-items:center; width:90px; height:64px; margin-bottom:12px; color:#111; overflow:hidden; transition:height 280ms ${G.ease.smooth},margin-bottom 280ms ${G.ease.smooth},opacity 220ms ease,transform 280ms ${G.ease.smooth}; }
  .dcb-welcome-preview-brand[data-shown=false] { height:0; margin-bottom:0; opacity:0; transform:translateY(-8px) scale(.9); }
  .dcb-welcome-preview-brand svg { display:block; width:90px; height:64px; }
  body[data-ds-dark-theme] .dcb-welcome-preview-brand { color:#ededf0; }
  .dcb-welcome-collapse { display:grid; grid-template-rows:1fr; opacity:1; transform:none; transition:grid-template-rows 280ms ${G.ease.smooth},opacity 220ms ease,transform 280ms ${G.ease.smooth}; }
  .dcb-welcome-collapse[data-open=false] { grid-template-rows:0fr; opacity:0; transform:translateY(-8px); }
  .dcb-welcome-collapse > div { min-height:0; overflow:hidden; }
  .dcb-welcome-upload { margin:12px 0; padding:14px; border:1px dashed #8886; border-radius:10px; }
  .dcb-welcome-upload-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .dcb-welcome-file-name { overflow-wrap:anywhere; }
  .dcb-welcome-demo [data-dcb-welcome-art] { display:block; width:100%; max-width:440px; height:120px; color:#111; overflow:visible; }
  .dcb-welcome-demo [data-dcb-welcome-stroke] { fill:none; stroke-width:5.3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:1; stroke-dashoffset:1; }
  body[data-ds-dark-theme] .dcb-welcome-demo { background:#1b1b1d; }
  body[data-ds-dark-theme] .dcb-welcome-demo [data-dcb-welcome-art] { color:#ededf0; }
  @media(max-width:600px) { .dcb-welcome-fields { grid-template-columns:1fr; } }
  @media(prefers-reduced-motion:reduce) { .dcb-welcome-field input,.dcb-welcome-speeds button,.dcb-welcome-play,.dcb-welcome-collapse,.dcb-welcome-preview-brand { transition:none; } }
  @media(forced-colors:active) { .dcb-welcome-demo,.dcb-welcome-field input,.dcb-welcome-speeds button,.dcb-welcome-play { background:Canvas; color:CanvasText; border-color:CanvasText; } .dcb-welcome-demo [data-dcb-welcome-art] { color:CanvasText!important; } }
`;function Mr(t,e,n,{mediaStore:r,FishLogo:o}={}){let i=t.createElement;return function({value:g,onChange:d}){let[b,u]=t.useState(g.welcomeText),[x,R]=t.useState(g.welcomeFont),[$,h]=t.useState(!1),[D,f]=t.useState(""),[S,y]=t.useState(null),[k,v]=t.useState(!1),T=t.useRef(null),a=t.useRef(null),p=t.useRef(g),l=t.useRef(0),M=t.useRef(""),U=t.useRef(null),A=t.useRef(null),w=t.useRef(!1);p.current=g,U.current=S,t.useEffect(()=>u(g.welcomeText),[g.welcomeText]),t.useEffect(()=>R(g.welcomeFont),[g.welcomeFont]);let O=L=>{for(let F of L.strokes)F.style.strokeDashoffset="0";for(let F of L.finishes||[])F.setAttribute("opacity","1")},q=()=>{if(l.current++,a.current){a.current.media?.freeze(),a.current.media?.dispose(),a.current.art&&O(a.current.art);for(let L of a.current.animations||[])L.cancel();a.current=null}},m=()=>[p.current.welcomeMode,p.current.welcomeText,p.current.welcomeFont,p.current.welcomeDuration,p.current.welcomeMediaFit,p.current.welcomeMediaDuration,U.current?.revision].join("\0"),N=L=>{q();let F=l.current;try{M.current=m();let B=n.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)").matches;if(p.current.welcomeMode==="media"){if(T.current.replaceChildren(),h(!1),!U.current){let re=e.createElement("p");re.textContent="\u4E0A\u4F20\u52A8\u56FE\u6216\u77ED\u89C6\u9891\u540E\u5728\u8FD9\u91CC\u9884\u89C8",T.current.append(re);return}let ee=lt(e,n,U.current,p.current,{autoplay:L&&!B,onComplete:()=>{w.current&&l.current===F&&h(!1)},onError:()=>{w.current&&l.current===F&&(h(!1),f("\u7D20\u6750\u65E0\u6CD5\u64AD\u653E\uFF0C\u8BF7\u91CD\u65B0\u4E0A\u4F20\u517C\u5BB9\u6587\u4EF6\u3002"))}});a.current={media:ee},T.current.append(ee.node),h(L&&!B),f("");return}let P=ct(e,p.current);T.current.replaceChildren(P.svg);let K=L&&!B?st(P,p.current.welcomeDuration):[];K.length||O(P),a.current={art:P,animations:K},f(""),h(K.length>0),Promise.all(K.map(ee=>ee.finished)).then(()=>{l.current===F&&(q(),h(!1))},()=>{})}catch{h(!1),f("\u5B57\u4F53\u9884\u89C8\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u68C0\u67E5\u5B57\u4F53\u540D\u79F0\u3002")}};t.useEffect(()=>{let L=n.setTimeout(()=>{M.current!==m()&&N(!1)},220);return()=>n.clearTimeout(L)},[g.welcomeMode,g.welcomeText,g.welcomeFont,g.welcomeDuration,g.welcomeMediaFit,g.welcomeMediaDuration,S?.revision]),t.useEffect(()=>{let L=!0;return r?.load().then(F=>{L&&y(F||null)},()=>{L&&f("\u672C\u673A\u7D20\u6750\u5B58\u50A8\u4E0D\u53EF\u7528\uFF0C\u4E66\u5199\u5F00\u5C4F\u4ECD\u53EF\u4F7F\u7528\u3002")}),()=>{L=!1}},[g.welcomeMediaRevision]),t.useEffect(()=>{w.current=!0;let L=n.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)"),F=()=>{(e.hidden||L.matches)&&(q(),h(!1))};return L.addEventListener("change",F),e.addEventListener("visibilitychange",F),()=>{w.current=!1,q(),L.removeEventListener("change",F),e.removeEventListener("visibilitychange",F)}},[]);let s=()=>{let L=Ee({...g,welcomeText:b,welcomeFont:x});u(L.welcomeText),R(L.welcomeFont),p.current=L,d(L)},E=[[1200,"\u8F7B\u5FEB"],[1700,"\u9002\u4E2D"],[2400,"\u8212\u7F13"],[3200,"\u6162\u901F"],[4e3,"\u66F4\u6162"]],C=(L,F,B,P)=>{let K=Math.max(0,F.findIndex(([ee])=>ee===B));return i("div",{className:"dcb-welcome-speeds",role:"radiogroup","aria-label":L},F.map(([ee,re],ae)=>i("button",{key:ee,type:"button",role:"radio","aria-checked":B===ee,tabIndex:ae===K?0:-1,onClick:()=>P(ee),onKeyDown:se=>{let Y=F.length,W={ArrowRight:(ae+1)%Y,ArrowDown:(ae+1)%Y,ArrowLeft:(ae+Y-1)%Y,ArrowUp:(ae+Y-1)%Y,Home:0,End:Y-1}[se.key];W!==void 0&&(se.preventDefault(),P(F[W][0]),se.currentTarget.parentElement.children[W].focus())}},re)))},V=async L=>{if(!(!L||k)){v(!0),f(""),q(),h(!1);try{let F=await Dr(L,e,n);if(!w.current||(await r.save(F),!w.current))return;y(F),d({welcomeMode:"media",welcomeMediaRevision:F.revision})}catch(F){w.current&&f(F.message||"\u7D20\u6750\u4FDD\u5B58\u5931\u8D25")}finally{w.current&&v(!1),A.current&&(A.current.value="")}}},_=async()=>{if(!k){v(!0),q(),h(!1);try{await r.remove(),w.current&&(y(null),d({welcomeMode:"text",welcomeMediaRevision:""}),f(""))}catch(L){w.current&&f(L.message)}finally{w.current&&v(!1)}}},Z=g.welcomeMode==="media";return i("section",{className:"dcb-settings-block dcb-settings-card","data-dcb-settings-block":"welcome"},i("div",{className:"dcb-settings-header"},i("div",null,i("h2",null,"\u5F00\u5C4F\u6B22\u8FCE"),i("p",null,"DSH Logo \u4E0E\u6B22\u8FCE\u6587\u5B57\uFF0C\u6216\u4F60\u81EA\u5DF1\u7684\u52A8\u56FE\u3001\u77ED\u89C6\u9891"))),i("div",{className:"dcb-settings-row"},i("div",{className:"dcb-settings-copy"},i("span",{className:"dcb-settings-row-title"},"\u5F00\u5C4F\u6B22\u8FCE\u52A8\u6548",i("span",{className:"dcb-cost-tag"},"\u542F\u52A8\u65F6\u77ED\u6682\u8BA1\u7B97")),i("p",{className:"dcb-settings-row-desc"},"\u6309\u5B57\u4F53\u751F\u6210\u5C11\u91CF\u7B14\u8FF9\u8DEF\u5F84\uFF0C\u4EC5\u542F\u52A8\u6216\u9884\u89C8\u65F6\u5904\u7406\uFF1B\u5173\u95ED\u540E\u76F4\u63A5\u5C55\u793A\u539F\u751F\u754C\u9762\u3002")),i("button",{type:"button",role:"switch",className:"dcb-switch","aria-label":"\u5F00\u5C4F\u6B22\u8FCE\u52A8\u6548","aria-checked":g.welcomeEnabled,onClick:()=>d({welcomeEnabled:!g.welcomeEnabled})})),C("\u5F00\u5C4F\u7C7B\u578B",[["text","Logo \uFF0B \u4E66\u5199\u6B22\u8FCE"],["media","\u52A8\u56FE / \u77ED\u89C6\u9891"]],g.welcomeMode,L=>d({welcomeMode:L})),i("div",{className:"dcb-welcome-collapse","data-open":!Z,"aria-hidden":Z,inert:Z},i("div",null,i("div",{className:"dcb-settings-row"},i("div",{className:"dcb-settings-copy"},i("span",{className:"dcb-settings-row-title"},"\u663E\u793A DSH Logo"),i("p",{className:"dcb-settings-row-desc"},"\u5728\u6B22\u8FCE\u6587\u5B57\u4E0A\u65B9\u67D4\u548C\u51FA\u73B0\uFF0C\u590D\u7528\u5BBF\u4E3B\u539F\u751F Logo\u3002")),i("button",{type:"button",role:"switch",className:"dcb-switch","aria-label":"\u663E\u793A DSH Logo","aria-checked":g.welcomeLogo,onClick:()=>d({welcomeLogo:!g.welcomeLogo})})),i("div",{className:"dcb-welcome-fields"},i("label",{className:"dcb-welcome-field"},"\u6B22\u8FCE\u6587\u5B57",i("input",{type:"text","aria-label":"\u6B22\u8FCE\u6587\u5B57",value:b,maxLength:at*2,onChange:L=>u(L.target.value),onBlur:s,onKeyDown:L=>{L.key==="Enter"&&!L.nativeEvent.isComposing&&L.currentTarget.blur()}})),i("label",{className:"dcb-welcome-field"},"\u5B57\u4F53\u540D\u79F0",i("input",{type:"text","aria-label":"\u6B22\u8FCE\u5B57\u4F53",value:x,maxLength:80,onChange:L=>R(L.target.value),onBlur:s,onKeyDown:L=>{L.key==="Enter"&&!L.nativeEvent.isComposing&&L.currentTarget.blur()}}))),i("p",null,`\u841D\u8389\u4F53\u586B Lolita\uFF1B\u53EF\u586B\u5176\u4ED6\u5DF2\u5B89\u88C5\u5B57\u4F53\u540D\uFF0C\u627E\u4E0D\u5230\u65F6\u4F7F\u7528\u7CFB\u7EDF\u5B57\u4F53\u3002\u6587\u5B57\u6700\u591A ${at} \u4E2A\u5B57\u7B26\uFF0C\u53EF\u586B\u5199 DeepSeek Harness\u3002`),i("div",{className:"dcb-settings-section-title",style:{marginTop:"14px"}},"\u4E66\u5199\u901F\u5EA6"),C("\u4E66\u5199\u901F\u5EA6",E.map(([L,F])=>[L,`${F} \xB7 ${(L/1e3).toFixed(1)} \u79D2`]),g.welcomeDuration,L=>d({welcomeDuration:L})))),i("div",{className:"dcb-welcome-collapse","data-open":Z,"aria-hidden":!Z,inert:!Z},i("div",null,i("div",{className:"dcb-welcome-upload"},i("span",{className:"dcb-cost-tag","data-cost":"high"},"\u89C6\u9891 / \u52A8\u56FE\u8F83\u9AD8\u5F00\u9500"),i("p",{className:"dcb-welcome-file-name"},S?`${S.name} \xB7 ${(S.size/1024/1024).toFixed(1)} MB \xB7 ${S.width} \xD7 ${S.height}${S.kind==="video"?` \xB7 ${S.duration.toFixed(1)} \u79D2`:""}`:"\u5C1A\u672A\u9009\u62E9\u7D20\u6750"),i("p",null,"\u652F\u6301 GIF\u3001APNG\u3001WebP\u3001MP4\u3001WebM\uFF1B\u6700\u591A 20MB\uFF0C\u89C6\u9891\u4E0D\u8D85\u8FC7 15 \u79D2\u3002\u5EFA\u8BAE 1080p \u4EE5\u4E0B\u30012\u20135 \u79D2\u3002"),i("input",{ref:A,type:"file",hidden:!0,accept:".gif,.png,.apng,.webp,.mp4,.webm","aria-label":"\u4E0A\u4F20\u5F00\u5C4F\u7D20\u6750",onChange:L=>V(L.target.files?.[0])}),i("div",{className:"dcb-welcome-upload-actions"},i("button",{type:"button",className:"dcb-welcome-play",disabled:k,onClick:()=>A.current?.click()},k?"\u6B63\u5728\u68C0\u67E5\u7D20\u6750\u2026":S?"\u66F4\u6362\u5F00\u5C4F\u7D20\u6750":"\u4E0A\u4F20\u5F00\u5C4F\u7D20\u6750"),S&&i("button",{type:"button",className:"dcb-welcome-play",disabled:k,onClick:_},"\u79FB\u9664\u7D20\u6750"))),i("div",{className:"dcb-settings-section-title"},"\u753B\u9762\u9002\u914D"),C("\u753B\u9762\u9002\u914D",[["contain","\u5B8C\u6574\u663E\u793A"],["cover","\u94FA\u6EE1\u88C1\u5207"]],g.welcomeMediaFit,L=>d({welcomeMediaFit:L})),i("div",{className:"dcb-settings-section-title"},"\u52A8\u56FE\u663E\u793A\u65F6\u957F"),C("\u52A8\u56FE\u663E\u793A\u65F6\u957F",[[2e3,"2 \u79D2"],[3e3,"3 \u79D2"],[5e3,"5 \u79D2"]],g.welcomeMediaDuration,L=>d({welcomeMediaDuration:L})),i("p",null,"\u77ED\u89C6\u9891\u9759\u97F3\u64AD\u653E\u4E00\u6B21\u540E\u8FDB\u5165\u4E3B\u754C\u9762\uFF1B\u52A8\u56FE\u6309\u6240\u9009\u65F6\u957F\u9000\u573A\u3002\u6587\u4EF6\u53EA\u4FDD\u5B58\u5728\u672C\u673A\uFF0C\u53EF\u968F\u65F6\u79FB\u9664\u3002"))),i("div",{className:"dcb-motion-preview-head"},i("small",null,"\u5C40\u90E8\u9884\u89C8"),i("button",{type:"button",className:"dcb-welcome-play",onClick:()=>{s(),N(!0)}},$?"\u91CD\u65B0\u64AD\u653E\u6B22\u8FCE\u9884\u89C8":"\u64AD\u653E\u6B22\u8FCE\u9884\u89C8")),i("div",{className:"dcb-welcome-demo","data-mode":g.welcomeMode,role:"img","aria-label":Z?"\u81EA\u5B9A\u4E49\u7D20\u6750\u5F00\u5C4F\u9884\u89C8":`\u6B22\u8FCE\u9884\u89C8\uFF1A${g.welcomeText}`},i("div",{className:"dcb-welcome-preview-brand","data-shown":!Z&&g.welcomeLogo,"aria-hidden":!0},o&&i(o,{size:64})),i("div",{className:"dcb-welcome-demo-content",ref:T})),i("p",{role:"status"},D||"\u4FEE\u6539\u81EA\u52A8\u4FDD\u5B58\uFF0C\u4E0B\u6B21\u5237\u65B0\u6216\u542F\u52A8\u751F\u6548\uFF1B\u6DF1\u8272\u4E3B\u9898\u4E0B\u7B14\u8FF9\u53CD\u767D\u3002\u9884\u89C8\u4E0D\u6253\u65AD\u5F53\u524D\u804A\u5929\u3002"))}}var we=[["panel","\u4EFB\u52A1\u9762\u677F"],["composer","\u8F93\u5165\u680F"],["sidebar","\u4FA7\u680F"],["welcome","\u5F00\u5C4F\u6B22\u8FCE"],["particles","\u7C92\u5B50\u80CC\u666F"],["messages","\u5BF9\u8BDD\u52A8\u6548"]],Tr=`
  .dcb-settings-tabs { min-width:0; position:relative; }
  .dcb-settings-tabbar { position:sticky; top:0; z-index:10; display:flex; flex-wrap:wrap; gap:4px; margin:0 0 16px; padding:5px; border:1px solid var(--dsh-settings-border); border-radius:12px; background:var(--dsh-settings-surface); box-shadow:0 2px 8px #00000007; }
  .dcb-settings-tabbar button { flex:1 1 86px; min-width:0; padding:9px 12px; border:1px solid transparent; border-radius:8px; background:transparent; color:var(--dsh-settings-secondary); font:500 13px/20px system-ui,sans-serif; white-space:nowrap; cursor:pointer; transition:background-color 220ms ${G.ease.color},color 220ms ${G.ease.color},border-color 220ms ${G.ease.color},transform 220ms ${G.ease.smooth}; }
  .dcb-settings-tabbar button:hover { background:#8881; color:var(--dsh-settings-text); }
  .dcb-settings-tabbar button[aria-selected=true] { background:var(--dsh-settings-subtle); border-color:#8883; color:var(--dsh-settings-text); font-weight:600; }
  .dcb-settings-tabbar button:active { transform:scale(.94); }
  .dcb-settings-tabbar button:focus-visible { outline:2px solid #888; outline-offset:1px; }
  .dcb-settings-tab-stage,.dcb-settings-tab-page { min-width:0; }
  .dcb-settings-tab-page { container:dcb-settings-page / inline-size; }
  .dcb-settings-tab-page > .dcb-settings-card { animation:none; }
  @container dcb-settings-page (max-width:640px) { .dcb-style-options { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; } }
  @container dcb-settings-page (max-width:340px) { .dcb-style-options { grid-template-columns:minmax(0,1fr); } }
  @media(prefers-reduced-motion:reduce) { .dcb-settings-tabbar button { transition:none; } }
  @media(forced-colors:active) { .dcb-settings-tabbar,.dcb-settings-tabbar button { background:Canvas; color:CanvasText; border-color:CanvasText; box-shadow:none; } .dcb-settings-tabbar button[aria-selected=true] { outline:2px solid Highlight; outline-offset:-3px; } }
`;function Ar(t,e,n){let r="panel",o=t.createElement;return function({children:c,onLeave:g}){let[d,b]=t.useState(r),[u,x]=t.useState(r),R=t.useRef(null),$=t.useRef(null),h=t.useRef(null),D=t.useRef(d),f=t.useRef(u),S=t.useRef(0),y=t.useRef([]),k=t.useRef(null),v=t.useRef(!0),T=t.useId(),a=t.Children.toArray(c),p=()=>e.hidden||n.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)").matches,l=()=>{for(let w of y.current)w.cancel();y.current=[],$.current&&($.current.style.removeProperty("height"),$.current.style.removeProperty("overflow"),$.current.setAttribute("data-state","idle"))},M=(w,O,q)=>{let m=w.animate(O,{...q,fill:"both"});return m.id="dcb-settings-tab",y.current.push(m),m},U=(w,O)=>{if(!h.current||!$.current)return;let q=S.current;if(p()){l();return}try{$.current.setAttribute("data-state","entering");let m=h.current.getBoundingClientRect().height;w!==null&&Math.abs(m-w)>1&&($.current.style.height=w+"px",$.current.style.overflow="hidden",M($.current,[{height:w+"px"},{height:m+"px"}],{duration:280,easing:G.ease.smooth})),M(h.current,[O||{opacity:0,transform:"translateY(8px)",filter:"blur(2px)"},{opacity:1,transform:"none",filter:"blur(0px)"}],{duration:240,easing:G.ease.smooth}),Promise.all(y.current.map(N=>N.finished)).then(()=>{v.current&&S.current===q&&l()},()=>{})}catch{l()}};t.useLayoutEffect(()=>{let w=k.current;k.current=null,l(),U(w)},[u]),t.useEffect(()=>{v.current=!0;let w=n.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)"),O=()=>{p()&&(S.current++,l(),k.current=null,f.current=D.current,x(D.current))};return w.addEventListener("change",O),e.addEventListener("visibilitychange",O),()=>{v.current=!1,S.current++,l(),w.removeEventListener("change",O),e.removeEventListener("visibilitychange",O)}},[]);let A=w=>{if(w===D.current)return;let O=$.current.getBoundingClientRect().height,q=n.getComputedStyle(h.current),m={opacity:q.opacity,transform:q.transform,filter:q.filter};S.current++;let N=S.current;l(),D.current=w,r=w,b(w),g?.(f.current,w);for(let E=R.current.parentElement;E;E=E.parentElement){if(!/(auto|scroll)/.test(n.getComputedStyle(E).overflowY)||E.scrollHeight<=E.clientHeight)continue;let C=R.current.getBoundingClientRect().top-E.getBoundingClientRect().top-E.clientTop;C<0&&(E.scrollTop=Math.max(0,E.scrollTop+C));break}if(p()){f.current=w,x(w);return}if(w===f.current){U(O,m);return}$.current.style.height=O+"px",$.current.style.overflow="hidden",$.current.setAttribute("data-state","leaving");let s=()=>{!v.current||S.current!==N||(k.current=O,f.current=w,x(w))};try{M(h.current,[m,{opacity:0,transform:"translateY(-8px)",filter:"blur(2px)"}],{duration:G.time.quick,easing:G.ease.color}).finished.then(s,()=>{})}catch{s()}};return o("div",{className:"dcb-settings-tabs",ref:R},o("div",{className:"dcb-settings-tabbar",role:"tablist","aria-label":"\u7F8E\u5316\u8BBE\u7F6E\u5206\u7C7B"},we.map(([w,O],q)=>o("button",{key:w,id:`${T}-tab-${w}`,type:"button",role:"tab","aria-selected":d===w,"aria-controls":`${T}-page-${w}`,tabIndex:d===w?0:-1,onClick:()=>A(w),onKeyDown:m=>{let N={ArrowRight:(q+1)%we.length,ArrowDown:(q+1)%we.length,ArrowLeft:(q+we.length-1)%we.length,ArrowUp:(q+we.length-1)%we.length,Home:0,End:we.length-1}[m.key];N!==void 0&&(m.preventDefault(),A(we[N][0]),m.currentTarget.parentElement.children[N]?.focus())}},O))),o("div",{className:"dcb-settings-tab-stage",ref:$},o("div",{key:u,className:"dcb-settings-tab-page",ref:h,role:"tabpanel",id:`${T}-page-${u}`,"aria-labelledby":`${T}-tab-${u}`,"aria-hidden":d!==u,inert:d!==u},a[we.findIndex(([w])=>w===u)])))}}var Fo="[data-conversation-tabs]",qe="data-dcb-conversation-tabs",Ye="data-dcb-conversation-indicator",Xe="data-dcb-conversation-motion",pt="data-dcb-conversation-clip",Po=t=>`:is([class$="_${t}"],[class*="_${t} "])`,Go=G.ease.smooth,Vo=96,Gt=8,Io=4e6,ft="M 1 5 C 24 5 76 5 99 5 C 100.333333 5 100.333333 7 99 7 C 76 7 24 7 1 7 C -.333333 7 -.333333 5 1 5 Z",zo="M 1 5.4 C 20 5.5 64 5.8 86 3.5 C 100 1.4 104 10.6 86 8.5 C 64 6.2 20 6.5 1 6.6 C 0 6.6 0 5.4 1 5.4 Z",jo="M 14 3.5 C 36 5.8 80 5.5 99 5.4 C 100 5.4 100 6.6 99 6.6 C 80 6.5 36 6.2 14 8.5 C -4 10.6 0 1.4 14 3.5 Z",mt=t=>`path("${t}")`,Ur=`
  [${qe}] { position: relative; }
  [${qe}] > button[role="tab"]::after { background: transparent !important; }
  [${Ye}] {
    position: absolute; left: 0; top: 0; width: 1px; height: 2px;
    transform-origin: 0 50%; pointer-events: none;
    color: var(--dsw-alias-state-business-primary, currentColor);
  }
  [${Ye}] > svg { position: absolute; left: 0; top: -5px; width: 100%; height: 12px; overflow: visible; pointer-events: none; fill: currentColor; }
  [${Ye}][hidden] { display: none; }
  [${Ye}][data-moving] { will-change: transform, width; }
  [${pt}] { overflow: clip; }
  [${Xe}="slide"] { will-change: opacity, transform; }
  [${Xe}="fade"] { will-change: opacity; }
  @media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
    [${qe}] > button[role="tab"] { transition: color ${G.time.quick}ms ${G.ease.color}; }
  }
`;function Cr(t,e,n){let r=new Map,o=e.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)"),i=e.matchMedia("(forced-colors: active)"),c=!1,g=(v,T,a)=>a===null?v.removeAttribute(T):v.setAttribute(T,a),d=v=>v?.isConnected&&v.getClientRects().length>0&&e.getComputedStyle(v).visibility!=="hidden";function b(v,T){let a=v.closest("header")?.parentElement;if(a===T.anchor&&T.panel?.contains(v)&&T.body?.isConnected&&T.panel.contains(T.body)&&T.scroll?.isConnected&&T.body.contains(T.scroll)&&T.area?.isConnected&&T.scroll.contains(T.area))return{body:T.body,scroll:T.scroll,area:T.area,panel:T.panel,anchor:a,session:T.body.getAttribute("data-conversation-session")};let p=null,l=null;for(let A=a;A&&A!==t.body;A=A.parentElement){let w=[...A.querySelectorAll("[data-conversation-content]")].filter(q=>!q.contains(v)),O=w.filter(q=>!w.some(m=>m!==q&&m.contains(q)));if(O.length){O.length===1&&(p=O[0],l=A);break}if(A.hasAttribute("data-phase"))break}let M=p?.querySelector("[data-conversation-scroll]"),U=M&&[...M.querySelectorAll(Po("viewArea"))].find(A=>A.closest("[data-conversation-content]")===p&&!A.closest("[data-composer-seat]"));return{body:p,area:U,scroll:M,panel:l,anchor:a,session:p?.getAttribute("data-conversation-session")}}function u(v){v.indicatorAnimation?.cancel(),v.indicatorAnimation=null,v.liquidAnimation?.cancel(),v.liquidAnimation=null,v.indicator.removeAttribute("data-moving")}function x(v){let T=v.motion;T&&(v.motion=null,v.resize.unobserve(T.target),T.animation.cancel(),g(T.target,Xe,T.originalMotion),g(T.area,pt,T.originalClip))}function R(v){x(v),u(v),v.resize.disconnect(),v.indicator.remove(),g(v.tabs,qe,v.originalMark)}function $(v,T,a){let{tabs:p,indicator:l}=v;if(!d(p)||!d(T)||i.matches){u(v),l.hidden=!0,g(p,qe,v.originalMark),v.geometry=null;return}let M=p.getBoundingClientRect(),U=T.getBoundingClientRect(),A=e.getComputedStyle(p),w=e.getComputedStyle(T),O=e.getComputedStyle(T,"::after"),q=Y=>parseFloat(Y)||0,m=(Y,W)=>q(Y[W])+(Y.boxSizing==="border-box"?0:W==="width"?q(Y.paddingLeft)+q(Y.paddingRight)+q(Y.borderLeftWidth)+q(Y.borderRightWidth):q(Y.paddingTop)+q(Y.paddingBottom)+q(Y.borderTopWidth)+q(Y.borderBottomWidth)),N=M.width/m(A,"width")||1,s=M.height/m(A,"height")||1,E=q(O.left),C=q(O.right),V=q(O.height)||2,_=U.width/N-q(w.borderLeftWidth)-q(w.borderRightWidth),Z=(U.left-M.left)/N-q(A.borderLeftWidth)+p.scrollLeft+q(w.borderLeftWidth)+E,L=(U.bottom-M.top)/s-q(A.borderTopWidth)+p.scrollTop-q(w.borderBottomWidth)-q(O.bottom)-V,F=_-E-C;if(F<.5){u(v),l.hidden=!0,v.geometry=null,g(p,qe,v.originalMark);return}let B=v.geometry;if(B&&Math.abs(B.x-Z)<.1&&Math.abs(B.width-F)<.1&&Math.abs(B.y-L)<.1&&Math.abs(B.height-V)<.1)return;let P=e.getComputedStyle(l),K={transform:P.transform,width:P.width},ee=e.getComputedStyle(v.shape).d||mt(ft),re=new e.DOMMatrix(P.transform).m41,ae=q(P.width);u(v);let se={transform:`translateX(${Z}px)`,width:`${F}px`};if(l.style.transform=se.transform,l.style.width=se.width,l.style.top=`${L}px`,l.style.height=`${V}px`,l.firstElementChild.style.top=`${-V*2.5}px`,l.firstElementChild.style.height=`${V*6}px`,l.hidden=!1,p.setAttribute(qe,""),v.geometry={x:Z,width:F,y:L,height:V},!(!a||!B||o.matches||t.hidden||typeof l.animate!="function"))try{let Y=Z+F/2>=re+ae/2,W=Y?re+(Z-re)*.08:Z,I=Y?Z+F:re+ae+(Z+F-re-ae)*.08,j="cubic-bezier(.22,.8,.26,1)",X="cubic-bezier(.4,0,.2,1)",Q={duration:G.time.standard,easing:"linear",fill:"both"},ie=l.animate([{...K,easing:j},{transform:`translateX(${W}px)`,width:`${Math.max(F,I-W)}px`,offset:.42,easing:X},se],Q);ie.id="dcb-conversation-indicator",v.indicatorAnimation=ie,e.CSS?.supports?.("d",mt(ft))&&(v.liquidAnimation=v.shape.animate([{d:ee,easing:j},{d:mt(Y?zo:jo),offset:.42,easing:X},{d:mt(ft)}],Q),v.liquidAnimation.id="dcb-conversation-liquid"),l.setAttribute("data-moving",""),ie.finished.then(()=>{v.indicatorAnimation===ie&&u(v)},()=>{v.indicatorAnimation===ie&&u(v)})}catch{u(v)}}function h(v){let T=v.getBoundingClientRect(),a=e.devicePixelRatio||1,p=Math.max(T.height,v.scrollHeight),l=Math.max(T.width,v.scrollWidth);return p>e.innerHeight*1.5||l*p*a*a>Io}function D(v){if(v.childElementCount>Gt)return null;let T=[...v.children];for(let U=0;U<8;U++){if(T.some(w=>w.childElementCount>Gt&&e.getComputedStyle(w).display==="contents"))return null;let A=T.flatMap(w=>e.getComputedStyle(w).display==="contents"?[...w.children]:[w]);if(A.length>Gt)return null;if(A.length===T.length&&A.every((w,O)=>w===T[O]))break;T=A}T=T.filter(U=>d(U)&&U.getBoundingClientRect().height>.5);let a=T.length===1?T[0]:v;if(h(a))return null;let p=t.createTreeWalker(a,e.NodeFilter.SHOW_ELEMENT),l=0,M=!1;for(let U=a;U;U=p.nextNode()){if(++l>Vo)return null;e.getComputedStyle(U).position==="fixed"&&(M=!0)}return{target:a,slide:a!==v&&!M}}function f(v,T){let{area:a}=v;if(!a||!d(a)||o.matches||t.hidden)return;let p=D(a);if(!p){x(v);return}let{target:l,slide:M}=p;if(!d(l)||typeof l.animate!="function")return;let U=v.motion,w=U?.target===l&&U.slide===M?e.getComputedStyle(l):null,O=w&&{opacity:w.opacity,transform:w.transform};x(v);let q=e.getComputedStyle(l),m={opacity:O?.opacity??0},N={opacity:q.opacity};M&&(m.transform=O?.transform??`translateX(${T*14}px)${q.transform==="none"?"":` ${q.transform}`}`,N.transform=q.transform);let s=l.getAttribute(Xe),E=a.getAttribute(pt);try{let C=l.animate([m,N],{duration:G.time.standard,easing:Go,fill:"both"});C.id="dcb-conversation-view",v.motion={animation:C,target:l,area:a,slide:M,originalMotion:s,originalClip:E},v.resize.observe(l),l.setAttribute(Xe,M?"slide":"fade"),M&&a.setAttribute(pt,""),C.finished.then(()=>{v.motion?.animation===C&&x(v)},()=>{v.motion?.animation===C&&x(v)})}catch{}}function S(){if(c)return;let v=new Set(t.querySelectorAll(Fo));for(let[T,a]of r)v.has(T)||(R(a),r.delete(T));for(let T of v){let a=[...T.querySelectorAll(':scope > button[role="tab"]')],p=a.find(O=>O.getAttribute("aria-selected")==="true"),l=r.get(T);if(!l){let O=t.createElement("span");O.setAttribute(Ye,""),O.setAttribute("aria-hidden","true"),O.hidden=!0;let q=t.createElementNS("http://www.w3.org/2000/svg","svg"),m=t.createElementNS("http://www.w3.org/2000/svg","path");q.setAttribute("viewBox","0 0 100 12"),q.setAttribute("preserveAspectRatio","none"),q.setAttribute("aria-hidden","true"),q.setAttribute("focusable","false"),m.setAttribute("d",ft),q.append(m),O.append(q),l={tabs:T,indicator:O,shape:m,originalMark:T.getAttribute(qe),geometry:null,selected:null,motion:null,body:null,session:null},l.resize=new e.ResizeObserver(n),l.resize.observe(T),l.buttons=[],r.set(T,l)}if(l.indicator.isConnected||T.appendChild(l.indicator),a.length!==l.buttons.length||a.some((O,q)=>O!==l.buttons[q])){for(let O of l.buttons)l.resize.unobserve(O);for(let O of a)l.resize.observe(O);l.buttons=a}let M=b(T,l),U=M.body===l.body&&M.session===l.session&&M.session!=null,A=!!p&&p!==l.selected&&a.includes(l.selected),w=a.indexOf(p)>=a.indexOf(l.selected)?1:-1;!U||!d(T)?(x(l),l.pending=null):(M.area!==l.area||l.motion&&(!l.motion.target.isConnected||h(l.motion.target)))&&x(l),Object.assign(l,M),$(l,p,U&&A),A&&U&&d(T)&&(l.pending={direction:w,until:e.performance.now()+400}),l.pending&&(o.matches||t.hidden||e.performance.now()>l.pending.until?l.pending=null:M.area?.childElementCount&&(f(l,l.pending.direction),l.pending=null)),l.selected=p}}let y=()=>{for(let v of r.values())x(v),u(v),v.geometry=null,v.pending=null;n()},k=v=>{for(let T of r.values())T.motion&&T.area.contains(v.target)&&x(T)};return o.addEventListener("change",y),i.addEventListener("change",y),t.addEventListener("pointerdown",k,!0),t.addEventListener("keydown",k,!0),t.addEventListener("visibilitychange",y),{sync:S,dispose(){if(!c){c=!0,o.removeEventListener("change",y),i.removeEventListener("change",y),t.removeEventListener("pointerdown",k,!0),t.removeEventListener("keydown",k,!0),t.removeEventListener("visibilitychange",y);for(let v of r.values())R(v);r.clear()}}}}var Vt="data-dcb-turn-focused",Ke="data-dcb-turn-jump",_o='button,a,input,textarea,select,summary,pre,code,video,audio,iframe,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"],[role="menuitem"],[role="tab"],[role="switch"],[role="slider"],[data-step-process-header]',Zo=new Set(["Escape","ArrowUp","ArrowDown","PageUp","PageDown","Home","End"," "]),Je=Ge(),Bo=t=>{let e=Math.min(1,Math.max(0,t))*(Je.length-1),n=Math.floor(e);return n>=Je.length-1?1:Je[n]+(Je[n+1]-Je[n])*(e-n)};function qr(t,e,{groupAt:n,groupById:r}){let o=e.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)"),i=null,c=null,g=0,d=!1,b=p=>p.closest("[data-conversation-session]")?.getAttribute("data-conversation-session")||"",u=p=>p&&p.root.isConnected&&b(p.root)===p.session?r(p.root,p.id):null,x=p=>{p?.head&&(p.head.removeAttribute(Vt),p.head.removeAttribute(Ke))};function R(p,l){p.head!==l.head&&(x(p),p.head=l.head),p.head.hasAttribute(Vt)||p.head.setAttribute(Vt,""),c?.choice===p&&p.head.getAttribute(Ke)!==c.direction&&p.head.setAttribute(Ke,c.direction)}function $(p){let[l,M]=p.scrollStyle;p.scroller.style.getPropertyValue("scroll-behavior")!=="auto"||p.scroller.style.getPropertyPriority("scroll-behavior")!=="important"||(l?p.scroller.style.setProperty("scroll-behavior",l,M):p.scroller.style.removeProperty("scroll-behavior"))}let h=(p,l)=>{let M=l.getBoundingClientRect(),U=p.getBoundingClientRect();return Math.max(0,Math.min(l.scrollHeight-l.clientHeight,l.scrollTop+U.top-M.top-l.clientTop-24))};function D(p=!0,l=!1){e.cancelAnimationFrame(g),g=0;let M=c;if(c=null,M){let U=u(M.choice);l&&U&&M.scroller.scrollTo({top:h(U.head,M.scroller),behavior:"instant"}),M.choice.head?.removeAttribute(Ke),$(M)}p&&(x(i),i=null)}function f(p){let l=p.closest("[data-conversation-content]");for(let M=p.parentElement;M&&M!==l?.parentElement;M=M.parentElement)if(/^(auto|scroll)$/.test(e.getComputedStyle(M).overflowY)&&M.clientHeight>0)return M;return null}function S(p){g=0;let l=c,M=l&&u(l.choice);if(!l||!M||!l.scroller.isConnected||t.hidden){D();return}R(l.choice,M),l.to=h(M.head,l.scroller);let U=Math.min(1,(p-l.start)/G.time.scene);if(l.scroller.scrollTo({top:l.from+(l.to-l.from)*Bo(U),behavior:"instant"}),U===1){D(!1,!0);return}g=e.requestAnimationFrame(S)}function y(p){let l=p.target?.nodeType===1?p.target:p.target?.parentElement;if(d||t.hidden||p.defaultPrevented||p.button!==0||p.altKey||p.ctrlKey||p.metaKey||p.shiftKey||!l||l.closest(_o))return;let M=n(l,p);if(!M?.head.isConnected)return;let U=f(M.head);if(!U)return;D(),i={root:M.root,id:M.id,session:b(M.root),head:null},R(i,M);let A=U.scrollTop,w=h(M.head,U);if(o.matches){U.scrollTo({top:w,behavior:"instant"});return}c={choice:i,head:M.head,scroller:U,from:A,to:w,start:e.performance.now(),direction:w<A?"up":"down",scrollStyle:[U.style.getPropertyValue("scroll-behavior"),U.style.getPropertyPriority("scroll-behavior")]},U.style.setProperty("scroll-behavior","auto","important"),M.head.setAttribute(Ke,c.direction),g=e.requestAnimationFrame(S)}let k=p=>{i&&(p.type==="keydown"&&!Zo.has(p.key)||p.type!=="pointerdown"&&!i.root.closest("[data-conversation-content]")?.contains(p.target)&&!c?.scroller.contains(p.target)||D())},v=()=>{o.matches&&D(!1,!0)},T=()=>{t.hidden&&D()},a=()=>D();t.addEventListener("dblclick",y);for(let p of["pointerdown","wheel","touchstart","keydown"])t.addEventListener(p,k,{capture:!0,passive:!0});return t.addEventListener("visibilitychange",T),e.addEventListener("resize",a),e.addEventListener("blur",a),o.addEventListener("change",v),{refresh(){if(!i)return;let p=u(i);p?R(i,p):D()},clearRoot(p){i?.root===p&&D()},dispose(){d=!0,D(),t.removeEventListener("dblclick",y);for(let p of["pointerdown","wheel","touchstart","keydown"])t.removeEventListener(p,k,!0);t.removeEventListener("visibilitychange",T),e.removeEventListener("resize",a),e.removeEventListener("blur",a),o.removeEventListener("change",v)}}}var ht="[data-chat-flow]:not([data-step-process-content])",gt="data-dcb-turn-row",_t="data-dcb-turn-head",Or="data-dcb-turn-tail",It="data-dcb-turn-first",vt="data-dcb-turn-surface",zt="data-dcb-turn-visible",jt="data-dcb-turn-arriving",Qe="--dcb-turn-height",Le="data-dcb-turn-cards-enabled",Rr=[gt,_t,Or,It,vt,zt,jt,"data-dcb-turn-focused","data-dcb-turn-jump"],Ho=Rr.map(t=>`[${t}]`).concat(`[style*="${Qe}"]`).join(","),Ne=`body[${Le}] [${vt}]`,bt=`body[data-ds-dark-theme][${Le}] [${vt}]`,ye=`${Ne} [${_t}][${gt}]`,$r=`
  ${Ne} { position:relative; isolation:isolate; --dcb-turn-fill:rgba(255,255,255,.56); --dcb-turn-rim:rgba(255,255,255,.74); --dcb-turn-shadow:0 5px 18px rgba(26,34,46,.08),inset 0 1px 1px #ffffffe8; --dcb-turn-blur:2px; --dcb-turn-saturation:1.15; }
  ${bt} { --dcb-turn-fill:rgba(24,28,36,.78); --dcb-turn-rim:rgba(255,255,255,.24); --dcb-turn-shadow:0 5px 18px #00000038,inset 0 1px 1px #ffffff42; }
  ${Ne}[data-dcb-turn-surface="clear"] { --dcb-turn-blur:0px; }
  ${bt}[data-dcb-turn-surface="clear"] { --dcb-turn-fill:rgba(24,28,36,.22); --dcb-turn-rim:rgba(255,255,255,.4); }
  ${Ne}[data-dcb-turn-surface="glass"] { --dcb-turn-fill:rgba(236,242,248,.62); --dcb-turn-blur:22px; --dcb-turn-saturation:1.45; }
  ${bt}[data-dcb-turn-surface="glass"] { --dcb-turn-fill:rgba(160,174,190,.26); --dcb-turn-rim:rgba(255,255,255,.34); }
  ${Ne} [data-dcb-turn-row] { position:relative; box-sizing:border-box; padding-inline:clamp(16px,2.2vw,28px); }
  ${ye} { padding-block-start:22px; }
  ${ye}:not([data-dcb-turn-first]) { margin-block-start:24px!important; }
  ${Ne} [data-dcb-turn-tail] { padding-block-end:22px; }
  ${ye}::before { content:''; position:absolute; z-index:-1; top:0; left:0; width:100%; height:var(${Qe},100%); box-sizing:border-box; border:1px solid var(--dcb-turn-rim); border-radius:22px; pointer-events:none; background:linear-gradient(135deg,#ffffff24,transparent 42%),var(--dcb-turn-fill); box-shadow:var(--dcb-turn-shadow); transition:background-color ${G.time.material}ms ${G.ease.color},border-color ${G.time.material}ms ${G.ease.color},box-shadow ${G.time.material}ms ${G.ease.color}; }
  ${ye}[data-dcb-turn-visible]::before { backdrop-filter:blur(var(--dcb-turn-blur)) saturate(var(--dcb-turn-saturation)); -webkit-backdrop-filter:blur(var(--dcb-turn-blur)) saturate(var(--dcb-turn-saturation)); }
  ${ye}[data-dcb-turn-arriving]::before { animation:dcb-turn-card-in ${G.time.standard}ms ${G.ease.smooth}; }
  ${ye}[data-dcb-turn-focused]::before { border-color:rgba(99,111,128,.46); box-shadow:var(--dcb-turn-shadow),0 0 0 1px rgba(99,111,128,.18); }
  ${bt} [data-dcb-turn-head][data-dcb-turn-row][data-dcb-turn-focused]::before { border-color:#ffffff8c; box-shadow:var(--dcb-turn-shadow),0 0 0 1px #ffffff26; }
  ${ye}[data-dcb-turn-jump="up"]::before { animation:dcb-turn-pull-down ${G.time.scene}ms ${G.ease.smooth}; }
  ${ye}[data-dcb-turn-jump="down"]::before { animation:dcb-turn-pull-up ${G.time.scene}ms ${G.ease.smooth}; }
  @keyframes dcb-turn-pull-down { from { transform:translateY(-10px) scale(.985); } to { transform:translateY(0) scale(1); } }
  @keyframes dcb-turn-pull-up { from { transform:translateY(10px) scale(.985); } to { transform:translateY(0) scale(1); } }
  @keyframes dcb-turn-card-in { from { opacity:0; transform:translateY(10px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
  @media(max-width:600px) { ${Ne} [data-dcb-turn-row] { padding-inline:14px; } ${ye}::before { border-radius:18px; } }
  @media(prefers-reduced-motion:reduce) { ${ye}::before { animation:none!important; transition:none!important; } }
  @media(forced-colors:active) { ${ye}::before { background:Canvas!important; border-color:CanvasText!important; box-shadow:none!important; backdrop-filter:none!important; -webkit-backdrop-filter:none!important; animation:none!important; transition:none!important; } }
`;function Nr(t,e,{enabled:n=!0,style:r="css"}={}){let o=new Map,i=new WeakMap,c=new Set,g=new Set,d=e.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)"),b=!1,u=0,x=0,R=n,$=r==="milk"?"css":r,h=0,D=new WeakMap,f=qr(t,e,{groupById:(s,E)=>o.get(s)?.byId?.get(E),groupAt:(s,E)=>{let C=i.get(s.closest(`[${gt}]`));if(C)return C;let V=o.get(s.closest(ht));if(!V)return null;for(let _ of V.groups)if(_.visible.size){let Z=_.head.getBoundingClientRect(),L=_.tail.getBoundingClientRect();if(E.clientX>=Z.left&&E.clientX<=Z.right&&E.clientY>=Z.top&&E.clientY<=L.bottom)return _}return null}}),S=(s,E,C="")=>{s.getAttribute(E)!==C&&s.setAttribute(E,C)},y=s=>{for(let E of Rr)s.removeAttribute(E);s.style.removeProperty(Qe)},k=s=>{y(s);for(let E of s.querySelectorAll(Ho))y(E)},v=s=>{g.add(s),!x&&!b&&(x=e.requestAnimationFrame(T))};function T(){x=0;let s=[];for(let E of g){if(!E.live||!E.head.isConnected)continue;let C=E.head.getBoundingClientRect(),V=E.tail.getBoundingClientRect();C.width>0&&V.bottom>C.top&&s.push([E,Math.round((V.bottom-C.top)*100)/100+"px"])}g.clear();for(let[E,C]of s)E.head.style.getPropertyValue(Qe)!==C&&E.head.style.setProperty(Qe,C)}let a=new e.ResizeObserver(s=>{for(let{target:E}of s){let C=i.get(E);C&&v(C)}}),p=new e.IntersectionObserver(s=>{let E=new Set;for(let C of s){let V=i.get(C.target);V&&(C.isIntersecting?V.visible.add(C.target):V.visible.delete(C.target),E.add(V))}for(let C of E)C.visible.size?S(C.head,zt):C.head.removeAttribute(zt)},{rootMargin:"80px 0px"});function l(s){s.live=!1,g.delete(s),e.clearTimeout(s.timer);for(let E of s.rows)a.unobserve(E),p.unobserve(E),i.delete(E),y(E)}let M=s=>s.matches("[data-submission-echo], [data-pending-steering]");function U(s){let E=s.getAttribute("data-chat-turn");return E!==null&&/^\d+$/.test(E)?"turn:"+E:M(s)?(D.has(s)||D.set(s,++h),"pending:"+D.get(s)):null}function A(s){f.clearRoot(s.root);for(let E of s.groups)l(E);y(s.root),s.groups=[],s.byId=new Map}function w(s){let E=o.get(s);E||(k(s),E={root:s,groups:[],maxTurn:-1,seeded:!1,session:null},o.set(s,E));let C=s.closest("[data-conversation-session]")?.getAttribute("data-conversation-session")||"";E.session!==C&&(A(E),E.seeded=!1,E.maxTurn=-1,E.session=C);let V=[...s.children].find(P=>P.getAttribute("data-slot")==="conversation.chat.flow")||s;E.list=V,S(s,vt,$);let _=[];for(let P of V.children){let K=U(P);if(!K||P.matches('[hidden], [data-turn-process-hidden="true"], :empty, :has(>[data-slot="conversation.chat.node"]:empty)'))continue;let ee=_.at(-1);ee?.id===K?ee.rows.push(P):_.push({id:K,rows:[P]})}let Z=E.groups.some(P=>P.id.startsWith("pending:")&&!P.head.isConnected),L=new Map(E.groups.map(P=>[P.id,P])),F=[],B=[];for(let P of _){let K=L.get(P.id);K&&K.rows.length===P.rows.length&&K.rows.every((ee,re)=>ee===P.rows[re])?(L.delete(P.id),F.push(K)):(K&&(L.delete(P.id),l(K)),B.push(P),F.push(P))}for(let P of L.values())l(P);for(let P of B){P.root=s,P.head=P.rows[0],P.tail=P.rows.at(-1),P.visible=new Set,P.live=!0;for(let ee of P.rows)y(ee),S(ee,gt),i.set(ee,P),a.observe(ee),p.observe(ee);S(P.head,_t),S(P.tail,Or),v(P);let K=Number(P.id.split(":")[1]);!d.matches&&s.closest("[data-chat-following-tail]")&&(P.id.startsWith("pending:")||!Z&&E.seeded&&K>E.maxTurn)&&(S(P.head,jt),P.timer=e.setTimeout(()=>{P.live&&P.head.removeAttribute(jt)},G.time.standard+30))}for(let P=0;P<F.length;P++)P===0?S(F[P].head,It):F[P].head.removeAttribute(It);E.groups=F,E.byId=new Map(F.map(P=>[P.id,P])),f.refresh();for(let P of F)P.id.startsWith("turn:")&&(E.maxTurn=Math.max(E.maxTurn,Number(P.id.slice(5))));F.length&&(E.seeded=!0)}function O(){if(u=0,b)return;for(let[E,C]of o)(!E.isConnected||!R)&&(A(C),o.delete(E));let s=[...c];if(c.clear(),R)for(let E of s)E.isConnected&&w(E)}let q=s=>{s&&c.add(s),!u&&!b&&(u=e.requestAnimationFrame(O))};function m(s){if(s.nodeType===1){s.matches(ht)&&q(s);for(let E of s.querySelectorAll(ht))q(E)}}let N=new e.MutationObserver(s=>{if(!(!R||b))for(let E of s){let C=E.target,V=C.closest(ht);if(V){let _=o.get(V);(!_||C===V||C===_.list||E.type==="attributes"&&C.parentElement===_.list)&&q(V)}else if(E.type==="attributes")m(C);else{for(let _ of E.addedNodes)m(_);E.removedNodes.length&&o.size&&q()}}});return N.observe(t.body,{subtree:!0,childList:!0,attributes:!0,attributeFilter:["data-chat-turn","data-conversation-session","hidden","data-turn-process-hidden"]}),t.body.removeAttribute(Le),k(t.body),R&&t.body.setAttribute(Le,""),R&&m(t.body),{setOptions(s){let E=R,C=s.style==="milk"?"css":s.style||"css",V=R!==s.enabled||C!==$;if(R=s.enabled,$=C,!!V)if(R)E||k(t.body),t.body.setAttribute(Le,""),m(t.body);else{t.body.removeAttribute(Le),e.cancelAnimationFrame(u),u=0,e.cancelAnimationFrame(x),x=0,c.clear();for(let _ of o.values())A(_);o.clear(),g.clear(),k(t.body)}},dispose(){b=!0,t.body.removeAttribute(Le),f.dispose(),N.disconnect(),a.disconnect(),p.disconnect(),e.cancelAnimationFrame(u),e.cancelAnimationFrame(x);for(let s of o.values())A(s);o.clear(),c.clear(),g.clear(),k(t.body)}}}var xt="M 9 0 C 32 0 68 0 91 0 C 96 0 100 4 100 9 C 100 13 100 19 100 23 C 100 28 96 32 91 32 C 68 32 32 32 9 32 C 4 32 0 28 0 23 C 0 19 0 13 0 9 C 0 4 4 0 9 0 Z",Yo="M 9 6 C 30 8 58 13 74 3 C 84 -2 100 0 100 9 C 100 13 100 19 100 23 C 100 32 84 34 74 29 C 58 19 30 24 9 26 C 4 27 0 25 0 21 C 0 18 0 14 0 11 C 0 7 4 5 9 6 Z",Xo="M 26 3 C 42 13 70 8 91 6 C 96 5 100 7 100 11 C 100 14 100 18 100 21 C 100 25 96 27 91 26 C 70 24 42 19 26 29 C 16 34 0 32 0 23 C 0 19 0 13 0 9 C 0 0 16 -2 26 3 Z",yt=t=>`path("${t}")`,Lr=`
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
`;function Wr(t,e,n){let r=t.createElement;return function({value:i,onChange:c}){let g=t.useRef(null),d=t.useRef(null);return t.useLayoutEffect(()=>{let b=g.current,u=b.querySelector(".dcb-scope-indicator"),x=b.querySelector("path"),R=n.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)"),$=null,h=null,D=[],f=!1;function S(){for(let T of D)T.cancel();D=[],b.removeAttribute("data-moving")}function y(T,a=!0,p=!1){if(f)return;let l=b.querySelector(`button[data-value="${T}"]`);if(!l)return;let M=$!==null&&$!==T;$=T;let U=b.getBoundingClientRect(),A=l.getBoundingClientRect(),w=n.getComputedStyle(b),O=U.width/parseFloat(w.width)||1,q=(A.left-U.left)/O-parseFloat(w.borderLeftWidth)-4,m=A.width/O;if(!p&&h&&Math.abs(h.x-q)<.05&&Math.abs(h.width-m)<.05)return;let N=n.getComputedStyle(u),s={transform:N.transform,width:N.width},E=new n.DOMMatrix(N.transform).m41,C=parseFloat(N.width),V=n.getComputedStyle(x).d||yt(xt);S();let _={transform:`translateX(${q}px)`,width:`${m}px`};if(Object.assign(u.style,_),h={x:q,width:m},!(!a||!M||R.matches||e.hidden||m<1||typeof u.animate!="function"))try{let Z=q+m/2>=E+C/2,L=Z?E+(q-E)*.06:q,F=Z?q+m:E+C+(q+m-E-C)*.06,B="cubic-bezier(.22,.8,.26,1)",P="cubic-bezier(.4,0,.2,1)",K={duration:G.time.standard,easing:"linear",fill:"both"},ee=u.animate([{...s,easing:B},{transform:`translateX(${L}px)`,width:`${Math.max(m,F-L)}px`,offset:.46,easing:P},_],{...K,id:"dcb-scope-position"});D.push(ee),n.CSS?.supports?.("d",yt(xt))&&D.push(x.animate([{d:V,easing:B},{d:yt(Z?Yo:Xo),offset:.46,easing:P},{d:yt(xt)}],{...K,id:"dcb-scope-liquid"})),b.setAttribute("data-moving",""),ee.finished.then(()=>{D.includes(ee)&&S()},()=>{D.includes(ee)&&S()})}catch{S()}}let k=new n.ResizeObserver(()=>y($,!1));k.observe(b);for(let T of b.querySelectorAll("button"))k.observe(T);let v=()=>y($,!1,!0);return R.addEventListener("change",v),e.addEventListener("visibilitychange",v),d.current={select:y},()=>{f=!0,S(),k.disconnect(),d.current=null,R.removeEventListener("change",v),e.removeEventListener("visibilitychange",v)}},[]),t.useLayoutEffect(()=>{d.current?.select(i)},[i]),r("div",{className:"dcb-scope-switch",ref:g,role:"group","aria-label":"\u67E5\u770B\u8303\u56F4","data-scope":i},r("span",{className:"dcb-scope-indicator","aria-hidden":!0},r("svg",{viewBox:"0 0 100 32",preserveAspectRatio:"none",focusable:"false"},r("path",{d:xt}))),[["turn","\u5F53\u524D\u8F6E\u6B21"],["all","\u5168\u90E8\u8F6E\u6B21"]].map(([b,u])=>r("button",{type:"button",key:b,"data-value":b,"aria-pressed":i===b,onClick:()=>c(b)},r("span",{className:"dcb-scope-label"},u))))}}var Fr=512*1024,Gr=t=>/\.x?html?$/i.test(String(t)),Pr=t=>typeof t=="string"&&/^(?:[a-z]:[/\\]|\/|\\\\)/i.test(t)&&!t.includes("\0");function Vr(t,e,n){let r=new Set,o=!1,i=!1,c=()=>{try{return typeof e.__dshOpenFilePreview=="function"&&typeof e.__dshCanPreviewPath=="function"}catch{return!1}},g=()=>{if(i)return;let u=c();if(u!==o){o=u;for(let x of r)x()}},d=u=>{try{return c()&&e.__dshCanPreviewPath(u)===!0}catch{return!1}},b=new e.MutationObserver(()=>e.queueMicrotask(g));return t.head&&b.observe(t.head,{childList:!0}),t.body&&b.observe(t.body,{childList:!0}),e.addEventListener("focus",g),t.addEventListener("visibilitychange",g),g(),{subscribe(u){return r.add(u),()=>r.delete(u)},getSnapshot:()=>o,supports:d,sync:g,async open(u,x,R,$,h){if(g(),!i&&d(x)){if(n){try{if(n.open({sessionId:u,path:x,read:h,fallback:()=>$(x)})!==!1)return}catch{}return $(x)}try{let D=Pr(x)?x:await R?.(u,x);if(!i&&Pr(D)&&d(D)&&await e.__dshOpenFilePreview(D)!==!1)return}catch{}}if(!i)return $(x)},dispose(){i=!0,b.disconnect(),e.removeEventListener("focus",g),t.removeEventListener("visibilitychange",g),r.clear()}}}function Ir(t,e){return async(n,r)=>{let o=t.current;if(!o)return null;let i=await o.stat(e,n,r);if(!i?.ok||!Number.isFinite(Number(i.value?.bytes))||Number(i.value.bytes)>Fr)return null;let c=await o.readBytes(e,n,{},r);if(!c?.ok||!c.value?.data)return null;let g=c.value.data instanceof Uint8Array?c.value.data:Uint8Array.from(c.value.data);return g.byteLength>Fr?null:new TextDecoder("utf-8",{fatal:!0}).decode(g)}}function Ko(t){return`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><style>html{overflow:hidden;scrollbar-width:none}body{margin:0}*{animation-play-state:paused!important;transition:none!important}</style>${t}`}var zr=`
  .dcb-artifact { position: relative; overflow: hidden; margin: 8px 0; border: 1px solid var(--dcb-content-border, #dedede); border-radius: 10px; background: var(--dcb-content-tile, #fff); }
  .dcb-artifact-cover { display: block; position: relative; overflow: hidden; aspect-ratio: 2 / 1; background: #fff; color: #333; pointer-events: none; }
  .dcb-artifact-cover iframe { display: block; position: absolute; top: 0; left: 0; width: 640px; height: 320px; border: 0; transform-origin: top left; pointer-events: none; }
  .dcb-artifact-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 100%; background: linear-gradient(135deg, #fafafa, #ececec); color: #777; font-size: 12px; }
  .dcb-artifact-placeholder b { font-size: 28px; line-height: 1; font-weight: 500; }
  .dcb-artifact .dcb-artifact-open { position: static; display: flex; width: 100%; gap: 10px; margin: 0; padding: 10px; border-radius: 0; text-align: left; }
  .dcb-artifact-open::after { content: ''; position: absolute; inset: 0; }
  .dcb-artifact-caption { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
  .dcb-artifact-caption > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dcb-artifact-caption small { color: var(--dcb-ink-muted, #888); font-size: 11px; line-height: 16px; }
  .dcb-artifact-cover[data-ready] { animation: dcb-artifact-reveal ${G.time.standard}ms ${G.ease.smooth}; }
  @keyframes dcb-artifact-reveal { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  body[data-ds-dark-theme] .dcb-artifact { border-color: var(--dcb-content-border, #454545); background: var(--dcb-content-tile, #292929); }
  body[data-ds-dark-theme] .dcb-artifact-placeholder { background: linear-gradient(135deg, #303030, #202020); color: #bbb; }
  @media(prefers-reduced-motion:reduce), (forced-colors:active) { .dcb-artifact-cover[data-ready] { animation: none; } }
  @media(forced-colors:active) { .dcb-artifact { border: 1px solid CanvasText; } }
`;function jr(t,e){let n=t.createElement;return function({file:o,sessionId:i,readPreview:c,onOpen:g,active:d}){let b=`${i}\0${o.path}\0${o.seq??""}`,[u,x]=t.useState(null),R=t.useRef(null),$=u?.key===b?u.source:null;t.useEffect(()=>{if(!d||!c||u?.key===b)return;let D=new e.AbortController,f=!0;return Promise.resolve().then(()=>c(o.path,D.signal)).then(S=>{f&&x({key:b,source:S})},()=>{f&&x({key:b,source:null})}),()=>{f=!1,D.abort()}},[b,c,d]),t.useLayoutEffect(()=>{let D=R.current;if(!D)return;let f=new e.ResizeObserver(()=>{let S=D.querySelector("iframe");S&&(S.style.transform=`scale(${D.clientWidth/640})`)});return f.observe(D),()=>f.disconnect()},[$]);let h=String(o.path).replaceAll("\\","/").split("/").at(-1);return n("div",{className:"dcb-artifact","data-preview-state":$?"ready":u?.key===b?"unavailable":"pending"},n("span",{className:"dcb-artifact-cover",ref:R,"aria-hidden":!0,"data-ready":$?"":void 0},$?n("iframe",{srcDoc:Ko($),sandbox:"",tabIndex:-1,inert:!0,loading:"lazy",title:`${h} \u9759\u6001\u9884\u89C8`}):n("span",{className:"dcb-artifact-placeholder"},n("b",null,"</>"),n("span",null,"HTML \u7F51\u9875"))),n("button",{type:"button",className:"dcb-output dcb-artifact-open",title:o.description||h,"aria-label":`${h}\uFF0C\u6253\u5F00\u9884\u89C8`,onClick:()=>g(o.path)},n("span",{className:"dcb-artifact-caption"},n("span",null,h.replace(/\.x?html?$/i,"")),n("small",null,"HTML \xB7 \u9884\u89C8")),n("span",{"aria-hidden":!0},"\u2197")))}}var Jo=2*1024*1024,Qo=8*1024*1024,en=/^(?:py|js|mjs|cjs|ts|tsx|jsx|sh|bash|zsh|css|scss|less|yaml|yml|toml|ini|conf|cfg|env|xml|sql|rs|go|java|c|h|cpp|hpp|cs|rb|php|kt|swift|txt|log|lock)$/;function Zt(t){let e=String(t).split(/[\\/]/).at(-1).split(".").at(-1).toLowerCase();return/^(?:png|jpe?g|gif|webp|avif|ico|svg|bmp)$/.test(e)?{kind:"image",ext:e,label:"\u56FE\u7247",mime:`image/${e==="svg"?"svg+xml":e==="jpg"?"jpeg":e==="ico"?"x-icon":e}`}:/^(?:html?|xhtml)$/.test(e)?{kind:"html",ext:e,label:"\u7F51\u9875"}:/^(?:md|markdown)$/.test(e)?{kind:"markdown",ext:e,label:"Markdown"}:e==="csv"?{kind:"csv",ext:e,label:"\u8868\u683C"}:e==="json"?{kind:"json",ext:e,label:"JSON"}:en.test(e)?{kind:"code",ext:e,label:e.toUpperCase()}:null}function _r(t){return async(e,n,r)=>{let o=Zt(n),i=t.current;if(!o||!i)throw new Error("\u6587\u4EF6\u9884\u89C8\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7528 DSH \u6253\u5F00\u3002");if(r?.aborted)throw new DOMException("Aborted","AbortError");let c=await i.stat(e,n,r);if(r?.aborted)throw new DOMException("Aborted","AbortError");if(!c?.ok)throw new Error("\u6587\u4EF6\u4E0D\u5B58\u5728\u6216\u5F53\u524D\u4F1A\u8BDD\u65E0\u6CD5\u8BFB\u53D6\u3002");let g=Number(c.value?.bytes),d=o.kind==="image"?Qo:Jo;if(!Number.isFinite(g)||g<0||g>d)throw new Error(`\u6587\u4EF6\u8D85\u8FC7 ${d/1024/1024} MB \u9884\u89C8\u4E0A\u9650\uFF0C\u53EF\u7528 DSH \u6253\u5F00\u3002`);let b=await i.readBytes(e,n,{},r);if(r?.aborted)throw new DOMException("Aborted","AbortError");if(!b?.ok||!b.value?.data)throw new Error("\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u6216\u7528 DSH \u6253\u5F00\u3002");let u=b.value.data instanceof Uint8Array?b.value.data:Uint8Array.from(b.value.data);if(u.length>d)throw new Error("\u6587\u4EF6\u8FC7\u5927\uFF0C\u8BF7\u7528 DSH \u6253\u5F00\u3002");if(o.kind==="image")return{...o,size:u.length,bytes:u};let x;try{x=new TextDecoder("utf-8",{fatal:!0}).decode(u)}catch{throw new Error("\u6682\u4E0D\u652F\u6301\u6B64\u6587\u4EF6\u7684\u6587\u5B57\u7F16\u7801\uFF0C\u8BF7\u7528 DSH \u6253\u5F00\u3002")}return{...o,size:u.length,text:x}}}function tn(t,e=501){let n=[],r=[],o="",i=!1,c=!1,g=()=>{r.push(o),o="",n.push(r),r=[]},d=t.replace(/^\uFEFF/,"");for(let b=0;b<d.length;b++){let u=d[b];if(u==='"')i&&d[b+1]==='"'?(o+='"',b++):i||!o?i=!i:o+=u;else if(u===","&&!i)r.length<99?(r.push(o),o=""):o+=u;else if((u===`
`||u==="\r")&&!i){if(u==="\r"&&d[b+1]===`
`&&b++,g(),n.length>=e){c=b<d.length-1;break}}else o+=u}return!c&&(o||r.length)&&g(),{rows:n.slice(0,e),truncated:c}}function rn(t){return`<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer">${t}`}var Zr=`
  .dcb-file-viewer { position:fixed; inset:max(12px,calc(var(--dsh-windows-titlebar-height,24px) + 12px)) 12px 12px auto; z-index:2147482991; display:flex; flex-direction:column; width:min(560px,calc(100vw - 24px)); max-width:calc(100vw - 24px); min-width:min(280px,calc(100vw - 24px)); border:1px solid #ffffffb3; border-radius:20px; background:rgba(249,250,252,.94); color:#24272d; box-shadow:0 18px 64px #17213624,inset 0 1px 0 #fff; backdrop-filter:blur(12px); overflow:hidden; font:13px/1.6 system-ui,sans-serif; }
  .dcb-file-viewer,.dcb-file-viewer * { box-sizing:border-box; }
  .dcb-file-viewer-head { display:flex; align-items:center; flex:none; gap:12px; min-height:70px; padding:16px 18px 12px; border-bottom:1px solid #202a3c14; background:rgba(255,255,255,.62); backdrop-filter:blur(14px) saturate(1.15); }
  .dcb-file-viewer-icon { display:grid; place-items:center; width:36px; height:40px; flex:none; border:1px solid #202a3c14; border-radius:10px; background:#ffffff90; color:#646c77; font-size:11px; font-weight:600; }
  .dcb-file-viewer-title { flex:1; min-width:0; }
  .dcb-file-viewer-title strong { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; font-weight:600; }
  .dcb-file-viewer-title small { display:block; color:#757e8c; font-size:11px; }
  .dcb-file-viewer button { font:inherit; color:inherit; cursor:pointer; border:0; background:transparent; }
  .dcb-file-viewer .dcb-file-action { display:grid; place-items:center; width:30px; height:30px; padding:0; flex:none; border-radius:8px; font-size:17px; transition:background-color 180ms ease,transform 180ms ease; }
  .dcb-file-viewer button:hover { background:#202a3c0c; }
  .dcb-file-viewer button:active { transform:scale(.94); }
  .dcb-file-viewer button:focus-visible { outline:2px solid #888; outline-offset:2px; }
  .dcb-file-viewer-toolbar { display:flex; align-items:center; gap:8px; padding:10px 18px; flex:none; }
  .dcb-file-modes { display:inline-flex; gap:2px; padding:3px; border:1px solid #202a3c16; border-radius:10px; }
  .dcb-file-modes button { padding:4px 14px; border-radius:7px; font-size:12px; transition:background-color 180ms ease,color 180ms ease; }
  .dcb-file-modes button[aria-pressed=true] { background:#24272d; color:#fff; }
  .dcb-file-location { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right; color:#838a94; font-size:11px; }
  .dcb-file-viewer-body { position:relative; flex:1; min-height:0; margin:0 12px 10px; border:1px solid #202a3c14; border-radius:12px; overflow:auto; overscroll-behavior:contain; background:#fff; scrollbar-width:thin; }
  .dcb-file-viewer-content { width:100%; max-width:none; margin:0; min-height:100%; padding:24px; overflow-wrap:anywhere; }
  .dcb-file-viewer-content p { color:inherit; }
  .dcb-file-viewer-content > :first-child { margin-top:0; }
  .dcb-file-viewer-content h1 { font-size:25px; line-height:1.4; }
  .dcb-file-viewer-content h2 { font-size:20px; }
  .dcb-file-viewer-content pre { white-space:pre-wrap; font:12px/1.7 Consolas,monospace; }
  .dcb-file-viewer-body > iframe { display:block; width:100%; height:100%; min-height:360px; border:0; background:#fff; }
  .dcb-file-viewer-body > img { display:block; max-width:100%; max-height:100%; margin:auto; object-fit:contain; }
  .dcb-file-table { overflow:auto; }
  .dcb-file-table table { border-collapse:collapse; width:100%; font-size:12px; }
  .dcb-file-table :is(th,td) { padding:10px 14px; border-bottom:1px solid #8882; text-align:left; white-space:pre-wrap; min-width:80px; }
  .dcb-file-table th { position:sticky; top:0; background:#f4f5f7; color:#4e5663; font-weight:600; }
  .dcb-file-table tr:nth-child(even) { background:#88888806; }
  .dcb-file-viewer-status { flex:none; padding:0 20px 12px; color:#8b929c; font-size:11px; }
  .dcb-file-loading,.dcb-file-error { padding:40px 28px; text-align:center; color:#7b8492; }
  .dcb-file-error strong { display:block; margin-bottom:8px; color:inherit; font-size:14px; }
  .dcb-file-error button { margin:14px 4px 0; padding:5px 12px; border:1px solid #8884; border-radius:8px; }
  .dcb-file-viewer-moving { will-change:opacity,transform,filter; }
  .dcb-file-resizer { position:absolute; inset:0 auto 0 0; width:6px; z-index:2; cursor:ew-resize; touch-action:none; }
  .dcb-file-resizer:hover { background:#8882; }
  .dcb-file-viewer[data-dragging] iframe { pointer-events:none; }
  body[data-ds-dark-theme] .dcb-file-viewer { background:rgba(30,33,39,.96); color:#e4e8ef; border-color:#ffffff29; box-shadow:0 18px 64px #0008,inset 0 1px 0 #ffffff12; }
  body[data-ds-dark-theme] .dcb-file-viewer-head { background:#ffffff08; border-color:#ffffff16; }
  body[data-ds-dark-theme] .dcb-file-viewer-icon { background:#ffffff0c; border-color:#ffffff20; color:#c1cad6; }
  body[data-ds-dark-theme] :is(.dcb-file-viewer-title small,.dcb-file-viewer-status,.dcb-file-location,.dcb-file-loading,.dcb-file-error) { color:#9ca7b7; }
  body[data-ds-dark-theme] .dcb-file-viewer-body { background:#202329; border-color:#ffffff16; }
  body[data-ds-dark-theme] .dcb-file-modes { border-color:#ffffff20; }
  body[data-ds-dark-theme] .dcb-file-modes button[aria-pressed=true] { background:#e4e8ef; color:#202329; }
  body[data-ds-dark-theme] .dcb-file-viewer button:hover { background:#ffffff12; }
  body[data-ds-dark-theme] .dcb-file-table th { background:#292d35; color:#d2d9e4; }
  @media(max-width:600px) { .dcb-file-viewer { inset:max(8px,calc(var(--dsh-windows-titlebar-height,24px) + 8px)) 8px 8px; width:auto!important; max-width:none; min-width:0; border-radius:16px; } .dcb-file-viewer-content { padding:18px; } .dcb-file-location,.dcb-file-resizer { display:none; } }
  @media(prefers-reduced-motion:reduce) { .dcb-file-viewer button { transition:none; } }
  @media(forced-colors:active) { .dcb-file-viewer,.dcb-file-viewer-head,.dcb-file-viewer-body { background:Canvas!important; color:CanvasText!important; border:1px solid CanvasText!important; box-shadow:none!important; backdrop-filter:none!important; } .dcb-file-modes button[aria-pressed=true] { background:Highlight!important; color:HighlightText!important; } }
`;function Br(t,e,n,{createPortal:r,MarkdownText:o,CodeBlock:i}={}){let c=t.createElement,g=new Set,d=n.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)"),b={present:!1,open:!1},u=null,x=!1,R=!1,$=0,h="",D=null,f=null,S=p=>{b={...b,...p};for(let l of g)l()},y=()=>{u?.abort(),u=null,h&&(n.URL.revokeObjectURL(h),h="")};function k(p=!0){y(),$++,S({open:!1}),p&&[D,f].find(M=>M?.isConnected&&!M.closest("[inert]")&&M.getClientRects().length)?.focus({preventScroll:!0})}function v(){let p=b.fallback;k(),p?.()}async function T(){y();let p=++$;u=new n.AbortController;let l=u.signal;S({status:"loading",file:null,error:"",mode:"preview"});try{let M=await b.read(b.sessionId,b.path,l);if(x||l.aborted||p!==$)return;M.kind==="image"&&(h=n.URL.createObjectURL(new Blob([M.bytes],{type:M.mime}))),S({status:"ready",file:{...M,url:h}})}catch(M){!x&&!l.aborted&&p===$&&S({status:"error",error:M.message||"\u5185\u5BB9\u52A0\u8F7D\u5931\u8D25\u3002"})}}function a({sessionId:p}){let l=t.useSyncExternalStore(C=>(g.add(C),()=>g.delete(C)),()=>b,()=>b),M=t.useRef(null),U=t.useRef(null),A=t.useRef(null),w=t.useRef(null),O=l.present&&l.sessionId===p;if(t.useLayoutEffect(()=>{let C=M.current;if(!C||!O){A.current?.cancel(),A.current=null;return}l.open&&!C.contains(e.activeElement)&&C.querySelector('[aria-label="\u5173\u95ED\u6587\u4EF6\u9884\u89C8"]')?.focus({preventScroll:!0});let V=A.current,_=V&&n.getComputedStyle(C),Z=_?{opacity:_.opacity,transform:_.transform,filter:_.filter}:l.open?{opacity:0,transform:"translateX(24px) scale(.97)",filter:"blur(2px)"}:{opacity:1,transform:"none",filter:"none"};V?.cancel(),A.current=null;let L=()=>{C.classList.remove("dcb-file-viewer-moving"),!l.open&&!b.open&&S({present:!1,file:null,read:null,fallback:null})};if(d.matches||typeof C.animate!="function"){L();return}C.classList.add("dcb-file-viewer-moving");let F=C.animate([Z,l.open?{opacity:1,transform:"translateX(0) scale(1)",filter:"blur(0)"}:{opacity:0,transform:"translateX(18px) scale(.98)",filter:"blur(2px)"}],{duration:l.open?G.time.standard:G.time.control,easing:l.open?G.ease.smooth:"cubic-bezier(.4,0,.2,1)",fill:"both",id:"dcb-output-viewer"});A.current=F,F.finished.then(()=>{A.current===F&&(A.current=null,F.cancel(),L())},()=>{})},[l.open,O]),t.useEffect(()=>()=>A.current?.cancel(),[]),t.useLayoutEffect(()=>{let C=U.current;if(!C||!O||!l.open||d.matches||typeof C.animate!="function")return;C.style.willChange="opacity,transform,filter";let V=C.animate([{opacity:.25,transform:"translateY(8px)",filter:"blur(2px)"},{opacity:1,transform:"none",filter:"none"}],{duration:G.time.control,easing:G.ease.smooth,id:"dcb-output-content"}),_=()=>C.style.removeProperty("will-change");return V.finished.then(_,()=>{}),()=>{V.cancel(),_()}},[O,l.open,l.path,l.status,l.mode]),t.useLayoutEffect(()=>{U.current&&(U.current.scrollTop=0)},[l.path,l.sessionId,l.mode]),!O||typeof r!="function")return null;let q=l.file,m=l.path.replaceAll("\\","/").split("/").at(-1),N=Zt(l.path),s=(C,V)=>i?c(i,{code:C,lang:V,showHeader:!1}):c("pre",null,c("code",null,C)),E;if(l.status==="loading")E=c("div",{className:"dcb-file-loading",role:"status"},"\u6B63\u5728\u8BFB\u53D6\u6587\u4EF6\u2026");else if(l.status==="error")E=c("div",{className:"dcb-file-error",role:"alert"},c("strong",null,"\u6682\u65F6\u65E0\u6CD5\u9884\u89C8"),l.error,c("div",null,c("button",{onClick:T},"\u91CD\u8BD5"),c("button",{onClick:v},"\u7528 DSH \u6253\u5F00")));else if(q)if(l.mode==="source")E=c("div",{className:"dcb-file-viewer-content"},s(q.text||"",q.ext));else if(q.kind==="html")E=c("iframe",{title:m,srcDoc:rn(q.text),sandbox:"allow-scripts",referrerPolicy:"no-referrer"});else if(q.kind==="image")E=c("img",{src:q.url,alt:m});else if(q.kind==="csv"){let C=tn(q.text);E=c("div",{className:"dcb-file-table"},c("table",null,c("thead",null,c("tr",null,C.rows[0]?.map((V,_)=>c("th",{key:_},V)))),c("tbody",null,C.rows.slice(1).map((V,_)=>c("tr",{key:_},V.map((Z,L)=>c("td",{key:L},Z)))))),C.truncated&&c("p",{className:"dcb-file-loading"},"\u4EC5\u663E\u793A\u524D 500 \u884C\u3002"))}else if(q.kind==="markdown")E=c("article",{className:"dcb-file-viewer-content"},o?c(o,{text:q.text,streaming:!1}):c("pre",null,q.text));else{let C=q.text;if(q.kind==="json")try{C=JSON.stringify(JSON.parse(C),null,2)}catch{}E=c("div",{className:"dcb-file-viewer-content"},s(C,q.ext))}return r(c("aside",{className:"dcb-file-viewer",ref:M,role:"region","aria-label":"\u6587\u4EF6\u9884\u89C8","aria-hidden":!l.open,inert:!l.open,"data-state":l.open?"open":"closing",style:{width:`${l.width}px`},onKeyDown:C=>{C.key==="Escape"&&(C.stopPropagation(),k())}},c("div",{className:"dcb-file-resizer",role:"separator","aria-label":"\u8C03\u6574\u9884\u89C8\u5BBD\u5EA6",tabIndex:0,"aria-orientation":"vertical","aria-valuemin":280,"aria-valuemax":Math.max(280,n.innerWidth-24),"aria-valuenow":Math.round(l.width),onPointerDown:C=>{C.button===0&&(w.current={x:C.clientX,width:M.current.offsetWidth},C.currentTarget.setPointerCapture(C.pointerId),M.current.setAttribute("data-dragging",""))},onPointerMove:C=>{w.current&&S({width:Math.max(280,Math.min(n.innerWidth-24,w.current.width+w.current.x-C.clientX))})},onPointerUp:()=>{w.current=null,M.current.removeAttribute("data-dragging")},onPointerCancel:()=>{w.current=null,M.current?.removeAttribute("data-dragging")},onLostPointerCapture:()=>{w.current=null,M.current?.removeAttribute("data-dragging")},onKeyDown:C=>{["ArrowLeft","ArrowRight"].includes(C.key)&&(C.preventDefault(),S({width:Math.max(280,Math.min(n.innerWidth-24,l.width+(C.key==="ArrowLeft"?24:-24)))}))}}),c("div",{className:"dcb-file-viewer-head"},c("span",{className:"dcb-file-viewer-icon","aria-hidden":!0},N?.ext.toUpperCase().slice(0,4)||"\u6587\u4EF6"),c("div",{className:"dcb-file-viewer-title"},c("strong",{title:m},m),c("small",null,`${N?.label||"\u6587\u4EF6"} \xB7 \u8F93\u51FA\u9884\u89C8`)),c("button",{className:"dcb-file-action",title:"\u7528 DSH \u6253\u5F00","aria-label":"\u7528 DSH \u6253\u5F00",onClick:v},"\u2197"),c("button",{className:"dcb-file-action","aria-label":"\u5173\u95ED\u6587\u4EF6\u9884\u89C8",onClick:k},"\xD7")),c("div",{className:"dcb-file-viewer-toolbar"},q?.kind!=="image"&&c("div",{className:"dcb-file-modes",role:"group","aria-label":"\u9884\u89C8\u65B9\u5F0F"},["preview","source"].map(C=>c("button",{key:C,"aria-pressed":l.mode===C,onClick:()=>S({mode:C})},C==="preview"?"\u9884\u89C8":"\u6E90\u7801"))),c("span",{className:"dcb-file-location",title:l.path},l.path),c("button",{className:"dcb-file-action","aria-label":"\u91CD\u65B0\u52A0\u8F7D\u6587\u4EF6",onClick:T},"\u21BB")),c("div",{className:"dcb-file-viewer-body",ref:U,"data-content-status":l.status},E),c("div",{className:"dcb-file-viewer-status"},l.status==="ready"?`${N?.label||"\u6587\u4EF6"} \xB7 ${q.size<1024?`${q.size} B`:`${Math.ceil(q.size/1024)} KB`}`:l.status==="loading"?"\u52A0\u8F7D\u4E2D":"\u53EF\u91CD\u8BD5\u6216\u7528 DSH \u6253\u5F00")),e.body)}return{View:a,isOpen(p){return!x&&b.open&&b.sessionId===p},contains(p,l){return b.present&&b.sessionId===p&&!!l?.nodeType&&!!e.querySelector(".dcb-file-viewer")?.contains(l)},open({sessionId:p,path:l,read:M,fallback:U}){if(x||R||typeof r!="function"||typeof M!="function"||!Zt(l))return!1;let A=e.getElementById("__dsh_artifact_preview__");if(A?.getAttribute("data-open")==="1"&&A.__state?.hide?.(),e.activeElement!==e.body&&!e.querySelector(".dcb-file-viewer")?.contains(e.activeElement)){D=e.activeElement;let w=D.closest(".dcb-summary")?.id;f=w?Array.from(e.querySelectorAll("[aria-controls]")).find(O=>O.getAttribute("aria-controls")===w):null}return S({sessionId:p,path:l,read:M,fallback:U,present:!0,open:!0,width:b.width||Math.min(560,n.innerWidth-24),mode:"preview"}),T(),!0},fail(){R=!0,$++,y();let p=b.open?b.fallback:null;S({present:!1,open:!1,file:null,read:null,fallback:null});try{p?.()}catch{}},closeForSession(p){b.present&&b.sessionId===p&&(y(),$++,S({present:!1,open:!1,file:null,read:null,fallback:null}))},dispose(){x=!0,$++,y(),S({present:!1,open:!1,file:null,read:null,fallback:null}),g.clear()}}}var wt=[[0,0],[.3,0],[.5,.12],[.68,.62],[.84,.9],[1,1]],Hr=typeof CSS<"u"&&CSS.supports?.("animation-timing-function","linear(0, 1)"),Yr=Hr?`linear(${wt.map(([t,e])=>`${e} ${t*100}%`).join(",")})`:G.ease.smooth;function on(t){let e=Math.max(1,wt.findIndex(([c])=>c>=t)),[n,r]=wt[e-1],[o,i]=wt[e];return r+(i-r)*(t-n)/(o-n)}function Xr(t,e,n,r,o,i){let c=.55228475,g=b=>e+b*i,d=g(-r-o);return`M${t} ${d} C${t+n*c} ${d} ${t+n} ${g(-r*c)} ${t+n} ${e} C${t+n} ${g(r*c)} ${t+n*c} ${g(r)} ${t} ${g(r)} C${t-n*c} ${g(r)} ${t-n} ${g(r*c)} ${t-n} ${e} C${t-n} ${g(-r*c)} ${t-n*c} ${d} ${t} ${d} Z`}var nn=(t,e,n=0,r=0,o=1)=>Xr(t,e,4-n*.4+r*1.7,4+n*2.4-r*1.2,n*12,o);function Kr(t,e){let n=e.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)"),r=null,o=null,i=!1,c=()=>{let u=o;if(o=null,!!u){u.animation.cancel(),u.svg.remove();for(let x of u.hidden)x.removeAttribute("data-dcb-flow-hidden");u.layer.removeAttribute("data-dcb-liquid-active")}},g=()=>{n.matches&&c()},d=()=>{c(),r=null};n.addEventListener("change",g),e.addEventListener("resize",d);function b({layer:u,host:x,list:R,context:$,plan:h,todos:D,active:f,manual:S=!1}){if(i)return;let y=D.findIndex(L=>L.status==="in_progress");if(!f||S||!u||!x||!R||!x.getClientRects().length||x.closest('[inert], [aria-hidden="true"]')){c(),r=null;return}let k=r,v=k?.context===$&&k.plan===h,T=R.querySelector(`.dcb-step[data-step-index="${y}"] .dcb-status`),a=x.getBoundingClientRect(),p=a.width/x.offsetWidth||1,l=a.height/x.offsetHeight||1,M=T?.getBoundingClientRect(),U=new e.DOMMatrixReadOnly(e.getComputedStyle(R).transform).m42,A=M?{x:(M.left+M.width/2-a.left)/p,y:(M.top+M.height/2-a.top)/l-U}:null;if(y<0){(!v||D.every(L=>L.status==="completed"))&&(c(),r=null);return}if(r={context:$,plan:h,index:y,point:A},!v||k.index===y||!k.point||!A||n.matches){(!v||n.matches)&&c();return}let w=R.getAnimations().find(L=>L.id==="dcb-step-roll-in");if(w&&!Hr){c();return}let O=w?new e.DOMMatrixReadOnly(w.effect.getKeyframes()[0].transform).m42:0,q=k.point,m=null,N=null;if(o){m=e.getComputedStyle(o.path).d;let L=m.match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi)?.map(Number);L?.length>=14&&(q={x:L[0],y:L[7]},N={rx:L[6]-L[0],ry:Math.abs(L[13]-L[7]),tail:Math.max(0,Math.abs(L[7]-L[1])-Math.abs(L[13]-L[7])),direction:Math.sign(L[13]-L[7])||1})}c();let s=x.offsetHeight;if(q.y<-16||q.y>s+16||A.y<-16||A.y>s+16)return;let E=t.createElementNS("http://www.w3.org/2000/svg","svg");E.setAttribute("class","dcb-progress-liquid"),E.setAttribute("aria-hidden","true"),E.setAttribute("viewBox",`0 0 ${x.offsetWidth} ${s}`),E.style.color=e.getComputedStyle(T).color;let C=t.createElementNS(E.namespaceURI,"path");C.setAttribute("fill","currentColor"),C.setAttribute("d",nn(q.x,q.y)),E.append(C),u.append(E);let V=Math.sign(A.y+O-q.y)||1,_=Array.from({length:31},(L,F)=>{let B=F/30,P=Math.min(1,B/.65),K=P*P*(3-2*P),ee=q.y+(A.y+O-q.y)*K-O*on(B),re=Math.sin(Math.PI*K),ae=B>.7?Math.sin(Math.PI*(B-.7)/.3):0,se=4-re*.4+ae*1.7+(N?(N.rx-4)*(1-K):0),Y=4+re*2.4-ae*1.2+(N?(N.ry-4)*(1-K):0),W=Math.min(16,re*12+(N?.tail||0)*(1-K));return{offset:B,d:F===0&&m?m:`path('${Xr(q.x+(A.x-q.x)*K,ee,se,Y,W,N&&K<.5?N.direction:V)}')`}});if(!e.CSS?.supports?.("d",_.at(-1).d)){E.remove();return}let Z=[T];T.setAttribute("data-dcb-flow-hidden","");for(let L of x.querySelectorAll('.dcb-step-ghost .dcb-step[data-status="in_progress"] .dcb-status'))L.setAttribute("data-dcb-flow-hidden",""),Z.push(L);u.setAttribute("data-dcb-liquid-active","");try{let L=C.animate(_,{id:"dcb-progress-liquid",duration:G.time.scene,easing:"linear",fill:"both"}),F={animation:L,svg:E,path:C,layer:u,hidden:Z};o=F,L.finished.then(()=>{o===F&&c()},()=>{})}catch{E.remove();for(let L of Z)L.removeAttribute("data-dcb-flow-hidden");u.removeAttribute("data-dcb-liquid-active")}}return{sync:b,dispose(){i=!0,c(),r=null,n.removeEventListener("change",g),e.removeEventListener("resize",d)}}}var an=':is([class$="_sidebarCol"],[class*="_sidebarCol "])',et=`[data-composer-card], .dcb-summary, .dcb-settings, .dcb-style-swatch, [data-testid="todo-panel"], [data-conversation-tabs], ${an}`,Jr=`${et}, [data-conversation-content], [data-chat-flow]`,eo=t=>t?.nodeType===1?t:t?.parentElement,Qr=t=>t?.nodeType===1&&(t.matches(Jr)||t.querySelector(Jr));function to(t){return t.some(e=>{let n=eo(e.target);return n?e.type==="attributes"?n===n.ownerDocument.body||n===n.ownerDocument.documentElement||n.closest(et)?!0:n.closest("[data-chat-flow]")?!1:!!Qr(n):n.closest(et)?!0:[...e.addedNodes,...e.removedNodes].some(Qr):!1})}function ro(t,e){if(t===e||t===e.documentElement||t===e.body)return!0;let n=eo(t);return!!n&&(!!n.closest(`${et}, [data-conversation-scroll]`)||!!n.querySelector(et))}var oo="data-dcb-lens-canvas";function sn(t,e){let n=new Map,r=e.matchMedia("(forced-colors: active)"),o=!1,i=[],c=f=>f.isConnected&&f.getClientRects().length&&e.getComputedStyle(f).visibility!=="hidden",g=(f,S,y)=>{f.style[S]!==y&&(f.style[S]=y)},d=f=>{let S=f.match(/[\d.]+/g)?.map(Number);return S?.length>=3?[S[0],S[1],S[2],S[3]??1]:[0,0,0,0]};function b(f){let S=f.getBoundingClientRect(),y=t.elementsFromPoint(S.left+S.width/2,S.top+S.height/2),k=t.body.hasAttribute("data-ds-dark-theme")?[24,28,36]:[247,248,250];for(let v of y.reverse()){if(v===f||f.contains(v)||v.hasAttribute(oo)||v.closest("[data-dcb-lens-stage]"))continue;let T=d(e.getComputedStyle(v).backgroundColor);k=k.map((a,p)=>a*(1-T[3])+T[p]*T[3])}return k}function u(f){f.destroyed=!0,e.cancelAnimationFrame(f.frame),f.resize.disconnect(),f.state.disconnect(),f.composer.removeEventListener("pointermove",f.pointer),f.composer.removeEventListener("pointerdown",f.press),f.renderer.destroy(),f.stage.remove();for(let[S,y]of f.tiles)y.remove(),S.removeAttribute("data-dcb-lens-ready")}function x(f){let S=t.createElement("div"),y=t.createElement("canvas");S.setAttribute("data-dcb-lens-stage",""),S.setAttribute("aria-hidden","true"),S.append(y),t.body.append(S);let k={composer:f,stage:S,canvas:y,tiles:new Map,buttons:[],frame:0,destroyed:!1,colors:[]},v=(a,{width:p,height:l,dpr:M})=>{let U=t.body.hasAttribute("data-ds-dark-theme"),A=S.getBoundingClientRect();a.fillStyle=U?"#181c24":"#f7f8fa",a.fillRect(0,0,p,l);for(let{rect:w,color:O}of k.colors)a.fillStyle=`rgb(${O.join(",")})`,a.fillRect((w.left-A.left-24)*M,0,(w.width+48)*M,l)};k.renderer=new tt(y,S,{scene:"grid",artwork:v,motion:!1,brightness:1,refraction:.65,blur:.06,dispersion:.35}),k.renderer.readGeometry=()=>{let a=S.getBoundingClientRect(),p=k.renderer.dpr;k.renderer.geometry=k.buttons.filter(c).map(l=>{let M=l.getBoundingClientRect(),U=e.getComputedStyle(l);return{el:l,kind:"free",opacity:1,selected:0,x:(M.left-a.left)*p,y:(a.bottom-M.bottom)*p,w:M.width*p,h:M.height*p,r:Math.min(parseFloat(U.borderTopLeftRadius)||M.width/2,M.width/2,M.height/2)*p,localW:M.width*p,localH:M.height*p,inverse:[1,0,0,1],clip:{left:0,bottom:0,right:a.width*p,top:a.height*p}}}),k.renderer.rectDirty=!1};let T=k.renderer.render.bind(k.renderer);return k.renderer.render=a=>{if(T(a),y.dataset.gpuState!=="active")return;let p=S.getBoundingClientRect(),l=k.renderer.dpr;for(let[M,U]of k.tiles){if(!c(M))continue;let A=M.getBoundingClientRect(),w=Math.max(1,Math.round(A.width*l)),O=Math.max(1,Math.round(A.height*l));(U.width!==w||U.height!==O)&&(U.width=w,U.height=O);let q=U.getContext("2d");q.clearRect(0,0,w,O),q.drawImage(y,(A.left-p.left)*l,(A.top-p.top)*l,A.width*l,A.height*l,0,0,w,O),M.hasAttribute("data-dcb-lens-ready")||M.setAttribute("data-dcb-lens-ready","")}},k.pointer=a=>{let p=S.getBoundingClientRect(),l=k.renderer.dpr;k.renderer.pointer={x:(a.clientX-p.left)*l,y:(p.bottom-a.clientY)*l},k.renderer.invalidate(180,!1)},k.press=()=>k.renderer.invalidate(180,!1),f.addEventListener("pointermove",k.pointer,{passive:!0}),f.addEventListener("pointerdown",k.press,{passive:!0}),k.resize=new e.ResizeObserver(()=>$(k)),k.resize.observe(f),k.state=new e.MutationObserver(()=>{if(y.dataset.gpuState!=="active")for(let a of k.tiles.keys())a.removeAttribute("data-dcb-lens-ready")}),k.state.observe(y,{attributes:!0,attributeFilter:["data-gpu-state"]}),k}function R(f){if(f.frame=0,o||f.destroyed)return;let S=f.buttons.filter(c);if(!S.length)return;let y=S.map(N=>N.getBoundingClientRect()),k=10,v=Math.max(0,Math.min(...y.map(N=>N.left))-k),T=Math.max(0,Math.min(...y.map(N=>N.top))-k),a=Math.min(e.innerWidth,Math.max(...y.map(N=>N.right))+k),p=Math.min(e.innerHeight,Math.max(...y.map(N=>N.bottom))+k),l={left:v,top:T,width:Math.max(1,a-v),height:Math.max(1,p-T)},M=[e.devicePixelRatio,...Object.values(l),...y.flatMap(N=>[N.left,N.top,N.width,N.height])].join(":"),U=S.map((N,s)=>({rect:y[s],color:b(N)})),A=[t.body.hasAttribute("data-ds-dark-theme"),l.width,l.height,e.devicePixelRatio,...U.flatMap(({rect:N,color:s})=>[N.left-v,N.width,...s])].join(":"),w=f.geometryKey!==M,O=f.artworkKey!==A;if(f.colors=U,!w&&!O&&!f.buttonsChanged)return;for(let[N,s]of Object.entries(l))g(f.stage,N,`${s}px`);let q=f.renderer.width,m=f.renderer.height;f.renderer.resize(),O&&q===f.renderer.width&&m===f.renderer.height&&f.renderer.setScene("grid"),f.geometryKey=M,f.artworkKey=A,f.buttonsChanged=!1,f.renderer.invalidate()}function $(f){!f.frame&&!f.destroyed&&(f.frame=e.requestAnimationFrame(()=>R(f)))}function h(f){if(o)return;i=[...f];let S=new Map;if(!r.matches)for(let y of i){let k=y.closest("[data-composer-card]");k&&c(y)&&(S.has(k)||S.set(k,[]),S.get(k).push(y))}for(let[y,k]of n)S.has(y)||(u(k),n.delete(y));for(let[y,k]of S){let v=n.get(y);v||(v=x(y),n.set(y,v)),v.buttonsChanged=v.buttonsChanged||v.buttons.length!==k.length||v.buttons.some((T,a)=>T!==k[a]),v.buttons=k;for(let[T,a]of v.tiles)k.includes(T)||(a.remove(),T.removeAttribute("data-dcb-lens-ready"),v.tiles.delete(T));for(let T of k){let a=v.tiles.get(T);a||(a=t.createElement("canvas"),a.setAttribute(oo,""),a.setAttribute("aria-hidden","true"),v.tiles.set(T,a)),a.parentElement!==T&&T.prepend(a)}$(v)}}let D=()=>h(i);return r.addEventListener("change",D),{sync:h,dispose(){o=!0,r.removeEventListener("change",D);for(let f of n.values())u(f);n.clear()}}}return lo(cn);})();
    /* DCB_LENS_BUNDLE_END */
    const { FishLogo, FISH_LOGO_PATH, FISH_LOGO_VIEWBOX, MarkdownText, CodeBlock } = require('@deepseek-ai/dsh-client-ui-primitives')
    let createPortal
    try { createPortal = require('react-dom').createPortal } catch { /* Optional output viewer falls back to the host. */ }
    const MOTION = DcbLens.motion
    const NAME = 'dsh-claude-beautify'
    const DISPLAY_NAME = 'UI动效美化'
    const KEY = `${NAME}:settings:v1`
    const PANEL = '[data-testid="todo-panel"]'
    const MARK = 'data-dcb-task-panel'
    const COMPOSER_FLAG = 'data-dcb-composer-glass'
    const CHAT_UNDER_COMPOSER_FLAG = 'data-dcb-chat-under-composer'
    const CHAT_UNDER_COMPOSER = `body[${CHAT_UNDER_COMPOSER_FLAG}] [data-conversation-content][data-content-phase="active"] > [data-conversation-scroll]:not(:has([data-conversation-composer-overlay])) > [data-composer-seat]`
    const COMPOSER_CARD = '[data-composer-seat] [data-composer-card]'
    const COMPOSER_MARK = 'data-dcb-composer-style'
    const SIDEBAR_MARK = 'data-dcb-sidebar-style'
    const COMPOSER_GLASS = `body[${COMPOSER_FLAG}] [${COMPOSER_MARK}]`
    const COMPOSER_ACTION_MARK = 'data-dcb-composer-action'
    const COMPOSER_ACTION_KIND = 'data-dcb-composer-action-kind'
    const MODEL_MENU_MARK = 'data-dcb-model-menu-glass'
    const COMPOSER_ACTION_SURFACE = `body ${COMPOSER_CARD} button[${COMPOSER_ACTION_MARK}]`
    const COMPOSER_ACTION_DARK = COMPOSER_ACTION_SURFACE.replace('body', 'body[data-ds-dark-theme]')
    const MATERIAL_SURFACE = `:is(.dcb-summary, [${MARK}], .dcb-style-swatch, [${COMPOSER_MARK}], [${COMPOSER_ACTION_MARK}], [${SIDEBAR_MARK}], [${MODEL_MENU_MARK}])`
    const MATERIAL_BASE = `${MATERIAL_SURFACE}:is([data-card-style], [${COMPOSER_MARK}], [${COMPOSER_ACTION_MARK}], [${SIDEBAR_MARK}], [${MODEL_MENU_MARK}])`
    const material = value => `${MATERIAL_SURFACE}:is([data-card-style="${value}"], [${COMPOSER_MARK}="${value}"], [${COMPOSER_ACTION_MARK}="${value}"], [${SIDEBAR_MARK}="${value}"], [${MODEL_MENU_MARK}="${value}"])`
    const CARD_STYLES = ['milk', 'clear', 'css', 'glass']
    const MATERIALS = [['milk', '默认', '保留原始配色与样式'], ['clear', '透明玻璃', '液态折射，通透亮边'], ['css', '轻量玻璃', '柔和亮边，轻微模糊'], ['glass', '毛玻璃', '朦胧磨砂，柔和悬浮']]
    const DEFAULTS = { enabled: true, sidebarStyle: 'milk', sidebarMotion: true, composerStyle: 'milk', chatUnderComposer: true, messageMotion: true, width: 320, cardStyle: 'milk', modules: { progress: true, outputs: true, resources: true }, progressView: { count: 3, previous: false, future: false }, toolDetails: false }
    const VARIABLES = ['--dcb-left', '--dcb-top', '--dcb-width', '--dcb-list-height']

    function materialCost(style, scope, buttonGlass = false) {
      if (scope === 'composer' && buttonGlass && (style === 'milk' || style === 'css')) return { level: 'medium', label: '中等开销', detail: `${style === 'milk' ? '输入框沿用原样' : '输入框使用轻量模糊'}；小按钮的动态玻璃另有绘制开销，可单独关闭。` }
      if (style === 'milk') return { level: 'low', label: '低开销', detail: '沿用原始外观，不增加玻璃特效。' }
      if (style === 'css') return { level: 'low', label: '较低开销', detail: '轻微模糊与静态亮边，适合希望保留玻璃观感又减少负担时使用。' }
      const detail = style === 'clear' ? '动态折射与追光会增加显卡负担。' : '较强的背景模糊会增加显卡负担。'
      return { level: 'high', label: '较高开销', detail: detail + (scope === 'sidebar' ? '侧栏面积越大，绘制负担越明显。' : scope === 'composer' ? buttonGlass ? '小按钮玻璃还会叠加绘制开销。' : '已关闭小按钮玻璃，仍需绘制输入框背景。' : '任务卡片展开、背景变化时开销更明显。') }
    }

    function normalize(value) {
      // Fold the retired enable switch into the style; never leave a hidden gate.
      const composerStyle = value?.composerGlass === false ? 'milk' : CARD_STYLES.includes(value?.composerStyle) ? value.composerStyle : value?.composerGlass === true ? 'css' : DEFAULTS.composerStyle
      return {
        enabled: typeof value?.enabled === 'boolean' ? value.enabled : true,
        sidebarStyle: CARD_STYLES.includes(value?.sidebarStyle) ? value.sidebarStyle : DEFAULTS.sidebarStyle,
        sidebarMotion: typeof value?.sidebarMotion === 'boolean' ? value.sidebarMotion : DEFAULTS.sidebarMotion,
        composerStyle,
        // Preserve old button appearance once; subsequent choices are independent.
        composerButtonGlass: typeof value?.composerButtonGlass === 'boolean' ? value.composerButtonGlass : composerStyle !== 'milk',
        chatUnderComposer: composerStyle !== 'milk' && (typeof value?.chatUnderComposer === 'boolean' ? value.chatUnderComposer : DEFAULTS.chatUnderComposer),
        messageMotion: typeof value?.messageMotion === 'boolean' ? value.messageMotion : DEFAULTS.messageMotion,
        turnGlass: typeof value?.turnGlass === 'boolean' ? value.turnGlass : true,
        ...DcbLens.normalizeParticles(value),
        ...DcbLens.normalizeWelcome(value),
        width: Number.isFinite(value?.width) ? Math.round(Math.max(280, Math.min(480, value.width))) : 320,
        // Keep the existing glass value for the frosted material when upgrading.
        cardStyle: CARD_STYLES.includes(value?.cardStyle) ? value.cardStyle : 'milk',
        modules: Object.fromEntries(Object.keys(DEFAULTS.modules).map(key => [key, typeof value?.modules?.[key] === 'boolean' ? value.modules[key] : true])),
        progressView: { count: value?.progressView?.count === 2 ? 2 : 3, previous: value?.progressView?.previous === true, future: value?.progressView?.future === true },
        toolDetails: value?.toolDetails === true,
        skillDetails: value?.skillDetails === true,
        summaryScope: value?.summaryScope === 'all' ? 'all' : 'turn',
      }
    }

    function readSettings() {
      try { return normalize(JSON.parse(window.localStorage.getItem(KEY))) }
      catch { return normalize(null) }
    }

    function composerActionKind(button) {
      if (button.closest('[data-composer-overlay], [data-composer-input], [role="menu"], [role="listbox"], .dcs-model-menu')) return null
      const classes = [...button.classList]
      // Module-local suffixes survive host build hashes. Only the model trigger
      // joins the icon controls; permission selectors and menu rows stay native.
      if (classes.some(name => /_primary$/.test(name))) return 'accent'
      if (classes.some(name => /_(add|roundButton)$/.test(name))) return 'neutral'
      // Claude Slider replaces the native model seat and omits its ARIA link.
      // Its named label distinguishes the selector from its error/retry button.
      if (button.matches('.dcs-root .dcs-model-trigger') && button.querySelector('.dcs-trigger-text')) return 'model'
      if (classes.some(name => /_trigger$/.test(name)) && button.getAttribute('aria-haspopup') === 'menu' &&
        button.querySelector('[data-model-id], [class$="_triggerLabel"], [class*="_triggerLabel "]')) return 'model'
      const iconOnly = button.querySelector('svg') && !button.textContent.trim()
      if (iconOnly && (classes.some(name => /_trigger$/.test(name)) || /语音|麦克风|录音|voice|microphone|dictation|speech/i.test(button.getAttribute('aria-label') || ''))) {
        // Sample an unfamiliar voice provider before styling it, so a filled
        // control keeps its accent and white glyph. Later syncs reuse that kind.
        if (button.hasAttribute(COMPOSER_ACTION_MARK)) return button.getAttribute(COMPOSER_ACTION_KIND) === 'accent' ? 'accent' : 'neutral'
        const fill = window.getComputedStyle(button).backgroundColor.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 0]
        return (fill[3] ?? 1) > .25 && Math.max(...fill.slice(0, 3)) - Math.min(...fill.slice(0, 3)) > 40 ? 'accent' : 'neutral'
      }
      return null
    }

    const h = React.createElement
    const emptyActivity = { files: [], resources: [], hasMore: false }
    const basename = path => path.replaceAll('\\', '/').split('/').filter(Boolean).at(-1) || path
    const THUMBNAIL_LIMIT = 4 * 1024 * 1024
    const EXTENSION = /\.([^./\\]+)$/
    function imageExtension(name) {
      const extension = EXTENSION.exec(basename(String(name || '')))?.[1]?.toLowerCase() || ''
      return /^(?:png|jpe?g|webp|gif|avif|bmp)$/.test(extension) ? extension : ''
    }
    function tileLabel(name) {
      const extension = EXTENSION.exec(basename(String(name || '')))?.[1] || ''
      return (extension || '文件').slice(0, 4).toUpperCase()
    }
    function mimeFor(extension) {
      return `image/${extension === 'jpg' ? 'jpeg' : extension}`
    }
    // One blob URL per session+path: the card re-renders often, the bytes must not.
    const thumbnails = new Map()
    function thumbnailReader(binding, sessionId) {
      return async (path, extension, signal) => {
        const face = binding.current
        if (!face) return null
        const stat = await face.stat(sessionId, path, signal)
        if (!stat?.ok) return null
        const bytes = Number(stat.value?.bytes)
        if (Number.isFinite(bytes) && bytes > THUMBNAIL_LIMIT) return null
        const file = await face.readBytes(sessionId, path, {}, signal)
        if (!file?.ok || !file.value?.data) return null
        return { data: file.value.data, type: mimeFor(extension) }
      }
    }
    function useThumbnail(sessionId, path, read) {
      const extension = imageExtension(path)
      const key = `${sessionId}\u0000${path}`
      const [url, setUrl] = React.useState(() => thumbnails.get(key) || '')
      React.useEffect(() => {
        if (!extension || !read || thumbnails.has(key)) return undefined
        let live = true
        const controller = typeof AbortController === 'function' ? new AbortController() : null
        Promise.resolve(read(path, extension, controller?.signal)).then(result => {
          if (!live || !result?.data) return
          const bytes = result.data instanceof Uint8Array ? result.data : Uint8Array.from(result.data)
          const blob = URL.createObjectURL(new Blob([bytes], { type: result.type }))
          thumbnails.set(key, blob)
          setUrl(blob)
        }).catch(() => {})
        return () => { live = false; controller?.abort() }
      }, [key, extension, read])
      return url
    }
    function argumentsOf(value) {
      try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return parsed && typeof parsed === 'object' ? parsed : {} }
      catch { return {} }
    }
    function fileAddress(sessionId, path) {
      const normalized = path.replaceAll('\\', '/').replace(/^(?:\.\/)+/, '')
      return `dsh-resource://file/session/${encodeURIComponent(sessionId)}/${normalized.split('/').map(encodeURIComponent).join('/')}`
    }
    function activityFrom(entries, hasMore = false) {
      const files = new Map()
      const calls = new Map()
      const results = new Map()
      for (const entry of entries) {
        const event = entry?.event
        const data = event?.data
        if (!data) continue
        if (event.type === 'deliverables/presented' && Array.isArray(data.files)) {
          for (const file of data.files) if (typeof file?.path === 'string' && file.path.trim()) {
            files.set(file.path.replaceAll('\\', '/'), { path: file.path, description: typeof file.description === 'string' ? file.description : '', seq: event.seq })
          }
        }
        if (['tool/call', 'tool/ptc-dispatch-start', 'tool/ptc-dispatch'].includes(event.type) && typeof data.name === 'string') {
          const id = data.callId || data.subCallId
          if (id) calls.set(id, { name: data.name, args: argumentsOf(data.arguments), order: calls.get(id)?.order ?? calls.size })
          if (event.type === 'tool/ptc-dispatch') results.set(id, data.isError !== true)
        }
        if (event.type === 'tool/result') {
          const id = data.message?.source?.callId || data.callId
          if (id) results.set(id, data.message?.isError !== true && data.isError !== true)
        }
      }
      const resources = new Map()
      for (const [id, call] of calls) {
        const { name, args } = call
        const lower = name.toLowerCase()
        const path = args.path || args.file_path || args.filePath
        const success = results.get(id) === true
        let item
        if (/^(?:skill|load_skill|skill_load)$/.test(lower) && success && typeof args.name === 'string') {
          item = { kind: 'skill', label: 'Skills', detail: args.name }
        } else if (/^(?:read|read_file)$/.test(lower) && success && typeof path === 'string' && /(?:^|[/\\])SKILL\.md$/i.test(path)) {
          item = { kind: 'skill', label: 'Skills', detail: basename(path.replace(/[/\\]SKILL\.md$/i, '')), path }
        } else if (/(?:^|[_/.-])memor(?:y|ies)(?:$|[_/.-])/.test(lower)) {
          const modifies = /write|save|add|update|delete|create/.test(`${lower} ${args.action || ''}`)
          item = { kind: 'memory', label: '记忆', detail: success ? modifies ? '已使用' : '已读取' : results.has(id) ? '调用失败' : '调用中' }
        } else if (/^(?:read|read_file)$/.test(lower) && success && typeof path === 'string' && /(?:^|[/\\])(?:memory|memories)(?:[/\\]|\.md$)/i.test(path)) {
          item = { kind: 'memory', label: '记忆', detail: `已读取 · ${basename(path)}`, path }
        } else if (/web_search|web_fetch|search_web|browser_search/.test(lower)) {
          item = { kind: 'web', label: '网页搜索', detail: lower.includes('fetch') ? '网页读取' : '搜索' }
        } else if (/github/.test(lower)) {
          item = { kind: 'github', label: 'GitHub', detail: '仓库工具' }
        } else if (!/^(?:read|read_file|todo_write|present|skill|load_skill|skill_load)$/.test(lower)) {
          item = { kind: 'tool', label: name, detail: results.has(id) ? success ? '已使用' : '调用失败' : '调用中' }
        }
        if (item) {
          const key = `${item.kind}:${item.label}:${item.path || (item.kind === 'skill' ? item.detail : '')}`
          if (item.kind === 'tool') {
            const previous = resources.get(key)
            item.count = (previous?.count || 0) + 1
            item.running = (previous?.running || 0) + (results.has(id) ? 0 : 1)
            item.failed = (previous?.failed || 0) + (results.get(id) === false ? 1 : 0)
            item.lastActiveOrder = Math.max(previous?.lastActiveOrder ?? -1, results.has(id) ? -1 : call.order)
            item.detail = item.running ? '调用中' : item.failed ? '调用失败' : '已使用'
          }
          resources.set(key, item)
        }
      }
      return { files: [...files.values()], resources: [...resources.values()], hasMore }
    }
    const TOOL_CATEGORIES = {
      command: { id: 'command', label: '命令', icon: 'terminal' },
      edit: { id: 'edit', label: '编辑', icon: 'file-edit' },
      read: { id: 'read', label: '读取', icon: 'file-read' },
      image: { id: 'image', label: '图像', icon: 'image' },
      process: { id: 'process', label: '进程', icon: 'process' },
      interaction: { id: 'interaction', label: '交互', icon: 'message' },
      search: { id: 'search', label: '检索', icon: 'search' },
      agent: { id: 'agent', label: '协作', icon: 'network' },
      plan: { id: 'plan', label: '计划', icon: 'checklist' },
      other: { id: 'other', label: '其他', icon: 'tool' },
    }
    function toolCategory(name) {
      const normalized = typeof name === 'string' ? name.trim().toLowerCase() : ''
      const leaf = normalized.split(/__|[./:]/).filter(Boolean).at(-1)?.replace(/[\s-]+/g, '_') || ''
      // Match tool identifiers, not arbitrary substrings inside a provider's name.
      if (/^(?:todo[/_.-](?:write|read)|todo)$/.test(normalized) || /^(?:todo_(?:write|read)|write_todos|read_todos|update_plan|set_plan|plan)$/.test(leaf)) return TOOL_CATEGORIES.plan
      if (/^(?:ops_bash|bash|shell|terminal|exec|exec_command|run_command|execute_command|run_shell|execute_code|run_code|powershell|cmd)$/.test(leaf)) return TOOL_CATEGORIES.command
      if (/^(?:write|write_file|writefile|edit|edit_file|editfile|apply_patch|replace_in_file|multi_edit|str_replace|str_replace_editor|create_file|delete_file|move_file|rename_file|append_file)$/.test(leaf)) return TOOL_CATEGORIES.edit
      if (/^(?:read|read_file|readfile|read_text_file|cat|view_file|list_files|list_directory|directory_tree|get_file_info|ls)$/.test(leaf)) return TOOL_CATEGORIES.read
      if (/^(?:read_image|view_image|open_image|imagegen|image_gen|generate_image|edit_image)$/.test(leaf)) return TOOL_CATEGORIES.image
      if (/^(?:(?:job|process|background)_(?:kill|cancel|stop|terminate|output|status|list|wait|poll)|kill_process|list_processes|write_stdin)$/.test(leaf)) return TOOL_CATEGORIES.process
      if (/^(?:ask_user(?:_question)?|request_user_input(?:_async)?|ask_followup_question|ask_question|question)$/.test(leaf)) return TOOL_CATEGORIES.interaction
      if (/^(?:search|search_files|search_code|file_search|rg|grep|glob|find_files)$/.test(leaf)) return TOOL_CATEGORIES.search
      if (/^(?:(?:spawn|delegate|handoff|send_message_to|wait|list|interrupt|followup)_agents?|spawn_subagent|send_message_to_thread|create_thread)$/.test(leaf)) return TOOL_CATEGORIES.agent
      return TOOL_CATEGORIES.other
    }
    function toolSummary(resources) {
      const tools = resources.filter(item => item.kind === 'tool')
      return {
        featured: resources.filter(item => item.kind !== 'tool'), tools, count: tools.length,
        calls: tools.reduce((sum, item) => sum + item.count, 0),
        active: tools.filter(item => (item.activeRunning ?? item.running) > 0).sort((a, b) => b.lastActiveOrder - a.lastActiveOrder),
        failed: tools.reduce((sum, item) => sum + item.failed, 0),
      }
    }
    function activitySource(events) {
      let previous
      let current = emptyActivity
      const relevant = event => ['turn/start', 'turn/end', 'todo/write', 'deliverables/presented', 'tool/call', 'tool/result', 'tool/ptc-dispatch-start', 'tool/ptc-dispatch'].includes(event?.type)
      function getSnapshot() {
        const next = events?.getSnapshot()
        if (!next || next === previous) return current
        const changed = next.change?.kind !== 'append' || next.change.entries?.some(entry => relevant(entry.event))
        previous = next
        if (current === emptyActivity || changed) current = turnActivityFrom(next.entries || [], next.hasMore)
        return current
      }
      return { getSnapshot, subscribe: listener => events?.subscribe(() => { const old = current; if (getSnapshot() !== old) listener() }) || (() => {}) }
    }
    function turnActivityFrom(entries, hasMore = false) {
      const turns = new Map()
      const owners = new Map()
      let current = null
      for (const entry of entries) {
        const event = entry?.event
        const data = event?.data
        if (!data) continue
        if (event.type === 'turn/start' && Number.isSafeInteger(data.turn) && data.turn >= 0) {
          current = { turn: data.turn, todos: null, entries: [], ended: false, complete: true }
          turns.set(data.turn, current)
        }
        let owner = current
        if (Number.isSafeInteger(data.turn) && data.turn >= 0) {
          if (!turns.has(data.turn)) turns.set(data.turn, { turn: data.turn, todos: null, entries: [], ended: false, complete: false })
          owner = turns.get(data.turn)
        }
        const id = data.callId || data.subCallId || data.message?.source?.callId
        const toolEvent = ['tool/call', 'tool/result', 'tool/ptc-dispatch-start', 'tool/ptc-dispatch'].includes(event.type)
        if (toolEvent) owner = owners.get(id) || owners.get(data.parentCallId) || owners.get(data.rootCallId) || owner
        if (!owner) continue
        if (id && toolEvent && !owners.has(id)) owners.set(id, owner)
        owner.entries.push(entry)
        if (event.type === 'todo/write' && Array.isArray(data.todos)) owner.todos = data.todos.filter(item => typeof item?.content === 'string' && ['pending', 'in_progress', 'completed'].includes(item.status)).map(item => ({ content: item.content, status: item.status }))
        if (event.type === 'turn/end') owner.ended = true
      }
      if (!turns.size) return activityFrom(entries, hasMore)
      const snapshots = [...turns.values()].sort((a, b) => a.turn - b.turn).map(({ entries, ...turn }) => ({ ...turn, activity: activityFrom(entries, !turn.complete) }))
      return { ...snapshots.at(-1).activity, turns: snapshots, latestTurn: snapshots.at(-1).turn, hasMore, aggregate: activityFrom(entries, hasMore) }
    }
    function allTurnView(history, liveTodos, latestTurn, turnNumbers = []) {
      const snapshots = history.turns || []
      const aggregate = history.aggregate || history
      const latest = snapshots.find(item => item.turn === latestTurn)
      const active = new Map((latest?.ended ? [] : latest?.activity.resources || (!snapshots.length ? history.resources : []) || []).filter(item => item.kind === 'tool').map(item => [item.label, item.running]))
      const activity = { ...aggregate, resources: aggregate.resources.map(item => item.kind === 'tool' ? { ...item, activeRunning: active.get(item.label) || 0 } : item) }
      // A todo/write is a replacement snapshot, not a new list. Each turn owns
      // its last recorded plan; never copy the persistent live projection into
      // a later turn that did not write a plan of its own.
      const plans = snapshots.length ? snapshots : [{ turn: latestTurn, todos: liveTodos, ended: false, complete: !history.hasMore }]
      const groups = plans.filter(item => item.todos?.length > 0).map(item => ({ turn: item.turn, todos: item.todos, ended: item.ended, complete: item.complete, completed: item.todos.filter(todo => todo.status === 'completed').length }))
      const known = new Set(snapshots.map(item => item.turn))
      const partial = history.hasMore || snapshots.some(item => !item.complete) || turnNumbers.some(turn => !known.has(turn))
      return { activity, groups, taskCount: groups.reduce((sum, group) => sum + group.todos.length, 0), completed: groups.reduce((sum, group) => sum + group.completed, 0), turnCount: turnNumbers.length || snapshots.length || (groups.length || activity.resources.length || activity.files.length ? 1 : 0), partial: !!partial }
    }
    function useReadingTurn(sessionId, outline, turns) {
      const [reading, setReading] = React.useState({ sessionId, turn: null })
      const outlineIds = (Array.isArray(outline) ? outline : []).filter(item => Number.isSafeInteger(item?.seq) && item.seq >= 0 && Number.isSafeInteger(item?.turn) && item.turn >= 0).map(item => item.turn)
      const ids = [...new Set([...outlineIds, ...(turns || []).map(item => item.turn)])].sort((a, b) => a - b)
      const key = `${[...outlineIds].sort((a, b) => a - b).join(',')}|${ids.join(',')}`
      React.useLayoutEffect(() => {
        let frame = 0
        const sample = () => {
          frame = 0
          const container = [...document.querySelectorAll('[data-conversation-content]')].find(node => node.dataset.conversationSession === sessionId && node.getClientRects().length)
          let turn = null
          if (container) {
            const column = container.querySelector('[data-chat-flow]')
            const flow = column?.querySelector(':scope > [data-slot="conversation.chat.flow"]') || column
            const rows = flow ? [...flow.children].filter(row => row.hasAttribute('data-chat-turn')) : [...container.querySelectorAll('[data-chat-turn]')].filter(row => !row.parentElement.closest('[data-chat-turn]'))
            // Event-only empty turns have no native rail item and must not shift its indices.
            const known = [...new Set([...outlineIds, ...rows.map(row => Number(row.dataset.chatTurn))].filter(value => Number.isSafeInteger(value) && value >= 0))].sort((a, b) => a - b)
            const mark = container.querySelector('nav button[data-index][aria-current="true"]')
            if (container.querySelector('[data-chat-following-tail]')) {
              const latest = Math.max(known.at(-1) ?? -1, ids.at(-1) ?? -1)
              turn = latest >= 0 ? latest : null
            }
            else if (mark) turn = known[Number(mark.dataset.index)] ?? null
            if (turn === null && rows.length) {
              const scroller = (flow || rows[0])?.closest('[data-conversation-scroll]') || container.querySelector('[data-conversation-scroll]') || container
              const bounds = scroller.getBoundingClientRect()
              const line = bounds.top + Math.min(96, bounds.height * .2)
              const visible = rows.filter(row => !row.closest('[hidden]') && row.getClientRects().length)
              const row = visible.findLast(item => item.getBoundingClientRect().top <= line) || visible[0]
              if (row) turn = Number(row.dataset.chatTurn)
            }
          }
          setReading(old => old.sessionId === sessionId && old.turn === turn ? old : { sessionId, turn })
        }
        const schedule = () => { if (!frame) frame = requestAnimationFrame(sample) }
        const observer = new MutationObserver(records => {
          if (records.some(record => {
            const target = record.target.nodeType === 1 ? record.target : record.target.parentElement
            if (!target || target.closest('[data-dcb-summary-for]')) return false
            return record.type === 'attributes' ? target.matches('nav button[data-index], [data-chat-turn]') || record.attributeName === 'data-chat-following-tail' : !!target.closest('[data-conversation-content]') || [...record.addedNodes].some(node => node.nodeType === 1 && (node.matches('[data-conversation-content]') || node.querySelector('[data-conversation-content]')))
          })) schedule()
        })
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current', 'data-index', 'data-chat-turn', 'data-chat-following-tail', 'hidden'] })
        const scroll = event => { if (!event.target?.closest?.('[data-dcb-summary-for]')) schedule() }
        document.addEventListener('scroll', scroll, true)
        window.addEventListener('resize', schedule)
        sample()
        return () => { observer.disconnect(); document.removeEventListener('scroll', scroll, true); window.removeEventListener('resize', schedule); if (frame) cancelAnimationFrame(frame) }
      }, [sessionId, key])
      return reading.sessionId === sessionId ? reading.turn : null
    }
    function useContextTransition(context, active) {
      const viewport = React.useRef(null)
      const content = React.useRef(null)
      const ghost = React.useRef(null)
      const state = React.useRef({ snapshot: null, animations: null, frame: 0, waiting: null })
      const stop = () => {
        const animations = state.current.animations
        state.current.animations = null
        animations?.forEach(animation => { animation.effect?.target?.style.removeProperty('will-change'); animation.cancel() })
        ghost.current?.replaceChildren()
      }
      const snapshot = () => {
        const current = state.current
        if (!current.snapshot || !content.current || current.frame || current.waiting) return
        current.frame = requestAnimationFrame(() => {
          current.frame = 0
          const node = content.current
          if (!current.snapshot || !node) return
          // A transition may mutate the small step stage every frame. Cache the
          // complete card once it settles, rather than cloning every intermediate.
          const moving = node.getAnimations({ subtree: true }).filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity && animation.playState !== 'finished' && animation.playState !== 'idle')
          if (current.animations || moving.length) {
            const pending = {}
            current.waiting = pending
            Promise.all([...moving, ...(current.animations || [])].map(animation => animation.finished.catch(() => {}))).then(() => {
              if (current.waiting === pending) { current.waiting = null; snapshot() }
            })
            return
          }
          current.snapshot.height = node.offsetHeight
          current.snapshot.clone = node.cloneNode(true)
        })
      }
      React.useLayoutEffect(() => {
        const node = content.current
        const old = state.current.snapshot
        if (!active || !node) { stop(); state.current.snapshot = null; return }
        if (old?.context === context) return
        const fromHeight = state.current.animations ? viewport.current.getBoundingClientRect().height : old?.height
        const fromStyle = state.current.animations ? getComputedStyle(node) : null
        const fromY = fromStyle ? new DOMMatrixReadOnly(fromStyle.transform).m42 : 0
        const fromOpacity = fromStyle?.opacity || 1
        const fromBlur = fromStyle?.filter || 'blur(0px)'
        stop()
        state.current.snapshot = { context, height: node.offsetHeight, clone: node.cloneNode(true) }
        if (!old || window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches) return
        for (const item of old.clone.querySelectorAll('.dcb-step-ghost')) item.replaceChildren()
        for (const item of old.clone.querySelectorAll('[id]')) item.removeAttribute('id')
        for (const item of old.clone.querySelectorAll('[data-working]')) item.setAttribute('data-working', 'false')
        ghost.current.replaceChildren(old.clone)
        const options = { duration: MOTION.time.standard, easing: MOTION.ease.smooth, fill: 'both' }
        const exit = { ...options, easing: MOTION.ease.exit }
        node.style.willChange = old.clone.style.willChange = 'opacity, transform, filter'
        viewport.current.style.willChange = 'height'
        const animations = [
          node.animate([{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(2px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }], { ...options, id: 'dcb-context-in' }),
          old.clone.animate([{ opacity: fromOpacity, transform: `translateY(${fromY}px)`, filter: fromBlur }, { opacity: 0, transform: 'translateY(-8px)', filter: 'blur(2px)' }], { ...exit, id: 'dcb-context-out' }),
          viewport.current.animate([{ height: `${fromHeight}px` }, { height: `${node.offsetHeight}px` }], { ...exit, id: 'dcb-context-height' }),
        ]
        const items = [...node.querySelectorAll('.dcb-recent-steps > li, .dcb-output, .dcb-resource')].filter(item => !item.closest('[inert]')).slice(0, 6)
        items.forEach((item, index) => {
          item.style.willChange = 'opacity, transform, filter'
          animations.push(item.animate([{ opacity: 0, transform: 'translateY(6px)', filter: 'blur(2px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }], { ...options, duration: MOTION.time.quick, delay: index * MOTION.stagger, id: 'dcb-context-item' }))
        })
        state.current.animations = animations
        Promise.all(animations.map(animation => animation.finished)).then(() => { if (state.current.animations === animations) { stop(); snapshot() } }).catch(() => {})
      })
      React.useLayoutEffect(() => {
        const observer = new MutationObserver(records => {
          if (records.some(record => !record.target.closest?.('.dcb-step-ghost, .dcb-context-ghost'))) snapshot()
        })
        const resize = new ResizeObserver(snapshot)
        if (active && content.current) { observer.observe(content.current, { childList: true, subtree: true, attributes: true, characterData: true }); resize.observe(content.current) }
        const preference = window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
        const changed = () => { if (preference.matches) { stop(); snapshot() } }
        preference.addEventListener('change', changed)
        return () => {
          observer.disconnect(); resize.disconnect(); preference.removeEventListener('change', changed); stop()
          if (state.current.frame) cancelAnimationFrame(state.current.frame)
          state.current.frame = 0
          state.current.waiting = null
          state.current.snapshot = null
        }
      }, [active])
      return { viewport, content, ghost }
    }
    function useToolDisclosure(expanded, revision, kind = 'tools') {
      const viewport = React.useRef(null)
      const body = React.useRef(null)
      const latest = React.useRef(expanded)
      latest.current = expanded
      const state = React.useRef({ previous: null, animations: null })
      const stop = () => {
        const animations = state.current.animations
        state.current.animations = null
        animations?.forEach(animation => { animation.effect?.target?.style.removeProperty('will-change'); animation.cancel() })
      }
      const settle = () => {
        stop()
        if (viewport.current) viewport.current.hidden = !latest.current
        state.current.previous = { expanded: latest.current, height: latest.current ? body.current?.offsetHeight || 0 : 0 }
      }
      React.useLayoutEffect(() => {
        const node = viewport.current, content = body.current, previous = state.current.previous
        if (!node || !content) return
        const interrupted = state.current.animations !== null
        const style = interrupted ? getComputedStyle(node) : null
        const from = { height: `${interrupted ? node.getBoundingClientRect().height : previous?.height || 0}px`, opacity: style?.opacity || (previous?.expanded ? 1 : 0), filter: style?.filter || (previous?.expanded ? 'blur(0px)' : 'blur(2px)') }
        const fromY = interrupted ? getComputedStyle(content).transform : previous?.expanded ? 'translateY(0)' : 'translateY(-6px)'
        stop()
        node.hidden = false
        const height = content.offsetHeight
        state.current.previous = { expanded, height: expanded ? height : 0 }
        if (!previous || window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches || !expanded && !previous.expanded && !interrupted) { settle(); return }
        const options = { duration: expanded ? MOTION.time.standard : MOTION.time.control, easing: MOTION.ease.smooth, fill: 'both' }
        node.style.willChange = 'height, opacity, filter'
        content.style.willChange = 'transform'
        const animations = [
          node.animate([from, { height: `${expanded ? height : 0}px`, opacity: expanded ? 1 : 0, filter: expanded ? 'blur(0px)' : 'blur(2px)' }], { ...options, id: `dcb-${kind}-height` }),
          content.animate([{ transform: fromY }, { transform: expanded ? 'translateY(0)' : 'translateY(-6px)' }], { ...options, id: `dcb-${kind}-body` }),
        ]
        if (expanded && !previous.expanded) [...content.children].forEach((item, index) => {
          item.style.willChange = 'opacity, transform, filter'
          animations.push(item.animate([{ opacity: 0, transform: 'translateY(6px)', filter: 'blur(2px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }], { ...options, duration: MOTION.time.quick, delay: Math.min(index * MOTION.stagger, 120), id: `dcb-${kind}-item` }))
        })
        state.current.animations = animations
        Promise.all(animations.map(animation => animation.finished)).then(() => { if (state.current.animations === animations) settle() }).catch(() => {})
      }, [expanded, revision])
      React.useLayoutEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
        const changed = () => { if (preference.matches) settle() }
        preference.addEventListener('change', changed)
        return () => { preference.removeEventListener('change', changed); stop() }
      }, [])
      return { viewport, body }
    }
    function progressItems(todos, count = 3, offset) {
      const active = todos.findIndex(item => item.status === 'in_progress')
      const pending = todos.findIndex(item => item.status === 'pending')
      const current = active >= 0 ? active : pending >= 0 ? pending : todos.length - 1
      const limit = count === 2 ? 2 : 3
      const start = Math.max(0, Math.min(Number.isInteger(offset) ? offset : current - (limit === 3 ? 1 : 0), todos.length - limit))
      const end = Math.min(todos.length, start + limit)
      return { previous: todos.slice(0, start), items: todos.slice(start, end), future: todos.slice(end), start, end, step: current + 1, total: todos.length }
    }
    function useStepRoll({ sessionId, plan, count, start, todos, active, folds, manual }) {
      const viewport = React.useRef(null)
      const list = React.useRef(null)
      const ghost = React.useRef(null)
      const previous = React.useRef(null)
      const future = React.useRef(null)
      const state = React.useRef({ snapshot: null, roll: null })
      const stop = (keepStage = false) => {
        const roll = state.current.roll
        state.current.roll = null
        roll?.forEach(animation => { animation.effect?.target?.style.removeProperty('will-change'); animation.cancel() })
        if (!keepStage) ghost.current?.replaceChildren()
      }
      React.useLayoutEffect(() => {
        const node = viewport.current
        const items = list.current
        const old = state.current.snapshot
        const interrupted = state.current.roll !== null
        if (interrupted && active && old?.sessionId === sessionId && old.plan === plan && old.count === count && old.start === start && old.folds === folds) {
          state.current.snapshot = { ...old, clone: items.cloneNode(true) }
          return
        }
        const y = interrupted && items ? new DOMMatrixReadOnly(getComputedStyle(items).transform).m42 : 0
        const height = interrupted && node ? node.getBoundingClientRect().height : old?.height
        const groupHeights = interrupted ? [previous.current?.getBoundingClientRect().height || 0, future.current?.getBoundingClientRect().height || 0] : old?.groups
        // Freeze only rows currently on screen. The stage stays flat and bounded
        // even if the next wheel frame arrives before this transition finishes.
        const candidates = new Map()
        if (old) [...old.clone.children].forEach((row, index) => {
          const geometry = old.rows[index]
          const top = geometry.top + y
          if (top < height && top + geometry.height > 0) candidates.set(geometry.index, { node: row, ...geometry, top })
        })
        const stage = ghost.current?.firstElementChild
        if (stage) {
          const stageY = new DOMMatrixReadOnly(getComputedStyle(stage).transform).m42
          for (const row of stage.children) {
            const top = parseFloat(row.style.top) + stageY
            const rowHeight = row.offsetHeight
            const index = Number(row.dataset.stepIndex)
            if (!candidates.has(index) && top < height && top + rowHeight > 0) candidates.set(index, { node: row, index, top, height: rowHeight })
          }
        }
        stop(true)
        if (!active || !node || !items) { stop(); state.current.snapshot = null; return }
        const rows = [...items.children].map(row => ({ index: Number(row.dataset.stepIndex), top: row.offsetTop, height: row.offsetHeight }))
        const next = { sessionId, plan, count, start, folds, rows, current: todos.findIndex(item => item.status === 'in_progress'), height: items.offsetHeight, groups: [previous.current?.offsetHeight || 0, future.current?.offsetHeight || 0], clone: items.cloneNode(true) }
        state.current.snapshot = next
        if (!old || old.sessionId !== sessionId || old.plan !== plan || old.count !== count || old.start === start || old.folds !== folds ||
            window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches) { stop(); return }
        const shared = rows.find(row => candidates.has(row.index))
        const distance = shared ? candidates.get(shared.index).top - shared.top : Math.sign(start - old.start) * Math.max(height, next.height)
        const outgoing = stage || document.createElement('ol')
        outgoing.className = 'dcb-timeline dcb-roll-stage'
        outgoing.setAttribute('data-working', 'false')
        outgoing.style.position = 'relative'
        outgoing.style.height = `${height}px`
        const leaving = [...candidates.values()].filter(row => !rows.some(item => item.index === row.index))
        for (const row of leaving) Object.assign(row.node.style, { position: 'absolute', boxSizing: 'border-box', top: `${row.top}px`, left: '0', right: '0', height: `${row.height}px` })
        outgoing.replaceChildren(...leaving.map(row => row.node))
        if (!stage) ghost.current.replaceChildren(outgoing)
        const handoff = !manual && old.current >= 0 && next.current >= 0 && old.current !== next.current
        const options = { duration: manual ? MOTION.time.quick : handoff ? MOTION.time.scene : MOTION.time.standard, easing: handoff ? DcbLens.progressRollEase : MOTION.ease.smooth, fill: 'both' }
        items.style.willChange = outgoing.style.willChange = 'transform'
        const roll = [
          items.animate([{ transform: `translateY(${distance}px)` }, { transform: 'translateY(0)' }], { ...options, id: 'dcb-step-roll-in' }),
          outgoing.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-distance}px)` }], { ...options, id: 'dcb-step-roll-out' }),
        ]
        if (Math.abs(height - next.height) > .5) {
          node.style.willChange = 'height'
          roll.push(node.animate([{ height: `${height}px` }, { height: `${next.height}px` }], { ...options, id: 'dcb-step-roll-height' }))
        }
        for (const [index, group] of [previous.current, future.current].entries()) {
          if (group && Math.abs(groupHeights[index] - next.groups[index]) > .5) roll.push(group.animate([{ height: `${groupHeights[index]}px` }, { height: `${next.groups[index]}px` }], { ...options, id: 'dcb-step-roll-group' }))
        }
        state.current.roll = roll
        Promise.all(roll.map(animation => animation.finished)).then(() => { if (state.current.roll === roll) stop() }).catch(() => {})
      }, [sessionId, plan, count, start, todos, active, folds, manual])
      React.useLayoutEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
        const changed = () => { if (preference.matches) stop() }
        preference.addEventListener('change', changed)
        const observer = new ResizeObserver(() => {
          const snapshot = state.current.snapshot
          if (!snapshot || state.current.roll || !list.current) return
          snapshot.height = list.current.offsetHeight
          snapshot.rows = [...list.current.children].map(row => ({ index: Number(row.dataset.stepIndex), top: row.offsetTop, height: row.offsetHeight }))
          snapshot.groups = [previous.current?.offsetHeight || 0, future.current?.offsetHeight || 0]
        })
        if (active) for (const node of [list.current, previous.current, future.current]) if (node) observer.observe(node)
        return () => { observer.disconnect(); preference.removeEventListener('change', changed); stop(); state.current.snapshot = null }
      }, [sessionId, active])
      return { viewport, list, ghost, previous, future }
    }
    function useProgressLiquid({ host, list, context, plan, todos, active, manual }) {
      const layer = React.useRef(null), controller = React.useRef(null)
      React.useLayoutEffect(() => {
        controller.current ||= DcbLens.createProgressLiquid(document, window)
        controller.current.sync({ layer: layer.current, host: host.current, list: list.current, context, plan, todos, active, manual })
      })
      React.useLayoutEffect(() => () => { controller.current?.dispose(); controller.current = null }, [])
      return layer
    }
    function useStepNavigation(viewport, navigate, active, sessionId, plan, count) {
      const latest = React.useRef(navigate)
      const cancelInput = React.useRef(() => {})
      latest.current = navigate
      React.useLayoutEffect(() => {
        const node = viewport.current
        if (!active || !node) return
        let accumulated = 0, lastInput = 0, frame = 0, kind = '', touch = null
        const cancel = () => { if (frame) cancelAnimationFrame(frame); frame = 0; accumulated = 0; kind = '' }
        cancelInput.current = cancel
        const flush = () => {
          frame = 0
          const rows = [...(node.querySelector(':scope > ol')?.children || [])]
          const pitch = Math.max(24, rows.length ? rows.reduce((sum, row) => sum + row.offsetHeight, 0) / rows.length : 30)
          const steps = Math.trunc(accumulated / pitch)
          if (!steps) return
          accumulated -= steps * pitch
          if (!latest.current(steps) || !latest.current(Math.sign(steps), true)) accumulated = 0
        }
        const reserve = (delta, source) => {
          if (!latest.current(Math.sign(delta), true)) { cancel(); return false }
          const now = performance.now()
          if (source !== kind || now - lastInput > 180 || Math.sign(delta) !== Math.sign(accumulated)) accumulated = 0
          kind = source
          lastInput = now
          accumulated += delta
          if (!frame) frame = requestAnimationFrame(flush)
          return true
        }
        const wheel = event => {
          if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return
          const delta = event.deltaY * (event.deltaMode === 1 ? parseFloat(getComputedStyle(node).lineHeight) || 16 : event.deltaMode === 2 ? node.clientHeight : 1)
          if (reserve(delta, 'wheel')) event.preventDefault()
        }
        const touchStart = event => { cancel(); touch = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null }
        const touchMove = event => {
          if (!touch || event.touches.length !== 1) return
          const finger = event.touches[0]
          const dy = touch.y - finger.clientY
          const dx = touch.x - finger.clientX
          touch = { x: finger.clientX, y: finger.clientY }
          if (Math.abs(dy) > Math.abs(dx) && dy && reserve(dy, 'touch')) event.preventDefault()
        }
        const touchEnd = () => { touch = null }
        const keyboard = event => {
          if (event.target !== node || event.altKey || event.ctrlKey || event.metaKey) return
          const delta = { ArrowUp: -1, ArrowDown: 1, Home: -Infinity, End: Infinity }[event.key]
          if (delta !== undefined) { cancel(); if (latest.current(delta)) event.preventDefault() }
        }
        node.addEventListener('wheel', wheel, { passive: false })
        node.addEventListener('touchstart', touchStart, { passive: true })
        node.addEventListener('touchmove', touchMove, { passive: false })
        node.addEventListener('touchend', touchEnd)
        node.addEventListener('touchcancel', touchEnd)
        node.addEventListener('keydown', keyboard)
        return () => {
          cancel()
          cancelInput.current = () => {}
          node.removeEventListener('wheel', wheel); node.removeEventListener('touchstart', touchStart); node.removeEventListener('touchmove', touchMove)
          node.removeEventListener('touchend', touchEnd); node.removeEventListener('touchcancel', touchEnd); node.removeEventListener('keydown', keyboard)
        }
      }, [active, sessionId, plan, count])
      return { cancel: () => cancelInput.current() }
    }
    function Icon({ kind, size = 16, className }) {
      const paths = {
        file: 'M6 3h8l4 4v14H6z M14 3v5h4',
        archive: 'M4 4h16v5H4z M6 9v12h12V9 M10 13h4',
        web: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c-5 5-5 13 0 18 M12 3c5 5 5 13 0 18',
        memory: 'M4 8a9 9 0 1 1-1 7 M4 3v5h5 M8 12h.01 M12 14c2 0 3-1 4-2',
        skill: 'M4 4h10v12H4z M10 16v4h10V10h-6',
        github: 'M8 20v-3c-4 1-4-2-5-2 M16 20v-4c0-1-.3-2-1-2 4-.5 5-2 5-5 0-1-.3-2-1-3V3l-4 2c-2-.5-4-.5-6 0L5 3v3C4 7 4 8 4 9c0 3 1 4.5 5 5-.7 0-1 1-1 2',
        toolbox: 'M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1 M3 12h7 M14 12h7 M10 11h4v3h-4z',
        terminal: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1 M7 9l3 3-3 3 M13 15h4',
        'file-edit': 'M13 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h6 M13 3v5h5V8l-5-5 M14 17l5.5-5.5a1.4 1.4 0 0 1 2 2L16 19l-3 1z M18 13l2 2',
        'file-read': 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5 M14 3v5h5 M9 12h6 M9 16h6',
        image: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1 M3 16l5-5 4 4 3-3 6 6 M16 8a1 1 0 1 0 0 .01',
        process: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M9 9h6v6H9z',
        message: 'M21 11a8 8 0 0 1-8 8H8l-5 3V7a4 4 0 0 1 4-4h6a8 8 0 0 1 8 8 M9.5 8a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4 M12 15h.01',
        search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',
        network: 'M12 8v5 M6 17v-4h12v4 M15 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M9 20a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 20a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
        checklist: 'm3 6 2 2 3-4 M11 6h10 m-18 8 2 2 3-4 M11 14h10 M4 21h3 M11 21h10',
        tool: 'M14 6a5 5 0 0 0-6 6L3.5 16.5a2.8 2.8 0 0 0 4 4L12 16a5 5 0 0 0 6-6l-3 3-4-4z',
        close: 'M6 6l12 12 M18 6 6 18',
        chevron: 'm7 10 5 5 5-5',
      }
      return h('svg', { key: kind, className, 'data-icon': kind, width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, h('path', { d: paths[kind] || paths.tool }))
    }

    // Anchor to the conversation column, so an open right sidebar stays clear.
    function placement(rect, viewport, width, composerTop) {
      const leftEdge = Math.max(0, rect.left)
      const rightEdge = Math.min(viewport.width, rect.right)
      const topEdge = Math.max(0, rect.top)
      const bottomEdge = Math.min(viewport.height, rect.bottom)
      if (rightEdge - leftEdge < 180 || bottomEdge - topEdge < 160) return null
      const margin = rightEdge - leftEdge < 480 ? 8 : 16
      const panelWidth = Math.min(width, rightEdge - leftEdge - margin * 2)
      const top = topEdge + margin
      const bottom = Number.isFinite(composerTop) && composerTop > top + 100
        ? Math.min(bottomEdge - margin, composerTop - 12) : bottomEdge - margin
      return {
        left: Math.round(rightEdge - margin - panelWidth),
        top: Math.round(top),
        width: Math.round(panelWidth),
        listHeight: Math.max(64, Math.min(310, Math.floor(bottom - top - 64))),
      }
    }

    function createLiquidNormalMap(width, height, radius = 14) {
      const requestedWidth = Number.isFinite(Number(width)) ? Math.max(1, Math.round(Number(width))) : 1
      const requestedHeight = Number.isFinite(Number(height)) ? Math.max(1, Math.round(Number(height))) : 1
      const ratio = Math.min(1, 1024 / requestedWidth, 2048 / requestedHeight, Math.sqrt(1048576 / (requestedWidth * requestedHeight)))
      width = Math.max(1, Math.floor(requestedWidth * ratio))
      height = Math.max(1, Math.floor(requestedHeight * ratio))
      radius = Math.max(0, Math.min((Number.isFinite(Number(radius)) ? Number(radius) : 0) * ratio, width / 2, height / 2))
      const band = Math.max(.5, Math.min(24 * ratio, width / 3, height / 3))
      const data = new Uint8ClampedArray(width * height * 4)
      // Interior normals are identical. Fill them once and evaluate the curved
      // distance function only in the outer band, preserving the exact pixels.
      data.fill(128)
      for (let offset = 3; offset < data.length; offset += 4) data[offset] = 255
      const edge = Math.ceil(radius + band)
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        if (y >= edge && y < height - edge && x === edge && x < width - edge) x = width - edge
        const px = x + .5 - width / 2, py = y + .5 - height / 2
        const qx = Math.abs(px) - (width / 2 - radius), qy = Math.abs(py) - (height / 2 - radius)
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0), outside = Math.hypot(ox, oy)
        const distance = -(outside + Math.min(Math.max(qx, qy), 0) - radius)
        let nx = 0, ny = 0
        if (outside > 0) { nx = ox / outside * Math.sign(px); ny = oy / outside * Math.sign(py) }
        else if (qx > qy) nx = Math.sign(px)
        else ny = Math.sign(py)
        const weight = distance >= 0 && distance < band ? Math.cos(distance / band * Math.PI / 2) ** 2 : 0
        const offset = (y * width + x) * 4
        data[offset] = Math.round(128 + nx * 127 * weight)
        data[offset + 1] = Math.round(128 + ny * 127 * weight)
        data[offset + 2] = 128
        data[offset + 3] = 255
      }
      return { width, height, data }
    }

    function createLiquidGlassManager(document, window) {
      const supported = /(?:Chrome|Chromium)\//.test(window.navigator?.userAgent || '') &&
        window.CSS?.supports?.('backdrop-filter', 'url("#dcb-liquid-probe")') && typeof window.ResizeObserver === 'function'
      if (!supported) return { sync() {}, dispose() {} }
      const namespace = 'http://www.w3.org/2000/svg'
      const prefix = `dcb-liquid-${Math.random().toString(36).slice(2, 10)}`
      const records = new Map(), cache = new Map()
      const forced = window.matchMedia('(forced-colors: active)')
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
      const motionProperties = ['--dcb-glint-x', '--dcb-glint-y', '--dcb-glint-strength', '--dcb-interaction-depth']
      let disposed = false, svg = null, defs = null, serial = 0, lastElements = []
      const create = (name, attributes = {}) => {
        const node = document.createElementNS(namespace, name)
        for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value))
        return node
      }
      const geometry = element => {
        const width = Math.round(element.offsetWidth), height = Math.round(element.offsetHeight)
        if (!width || !height || !element.getClientRects().length) return null
        const value = window.getComputedStyle(element).borderTopLeftRadius
        const radius = parseFloat(value) * (value.endsWith('%') ? Math.min(width, height) / 100 : 1) || 0
        return { width, height, radius, key: `${width}:${height}:${radius}` }
      }
      const ensureDefs = () => {
        if (defs) return
        svg = create('svg', { width: 0, height: 0, 'aria-hidden': true, focusable: false, 'data-dcb-liquid-defs': '' })
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
        defs = create('defs'); svg.append(defs); document.body.append(svg)
      }
      const cachedMap = shape => {
        if (cache.has(shape.key)) {
          const value = cache.get(shape.key); cache.delete(shape.key); cache.set(shape.key, value); return value
        }
        const map = createLiquidNormalMap(shape.width, shape.height, shape.radius)
        const canvas = document.createElement('canvas'); canvas.width = map.width; canvas.height = map.height
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas is unavailable')
        const image = context.createImageData(map.width, map.height); image.data.set(map.data); context.putImageData(image, 0, 0)
        const url = canvas.toDataURL('image/png')
        // Decode before exposing the SVG filter, so an empty map cannot shift the
        // whole backdrop while its image is still loading.
        const bitmap = new window.Image(); bitmap.src = url
        const ready = typeof bitmap.decode === 'function' ? bitmap.decode() : Promise.resolve()
        const value = { url, ready }; cache.set(shape.key, value)
        while (cache.size > 8) cache.delete(cache.keys().next().value)
        return value
      }
      const setScale = (record, scale) => {
        const value = String(Math.round(Math.max(0, Math.min(16, scale)) * 1000) / 1000)
        if (record.displacement.getAttribute('scale') !== value) record.displacement.setAttribute('scale', value)
      }
      const remove = record => {
        if (records.get(record.element) !== record) return
        records.delete(record.element); record.live = false
        resize.unobserve(record.element)
        if (record.frame) window.cancelAnimationFrame(record.frame)
        if (record.inputFrame) window.cancelAnimationFrame(record.inputFrame)
        if (record.resizeTimer) window.clearTimeout(record.resizeTimer)
        for (const [name, listener] of Object.entries(record.pointerListeners)) record.element.removeEventListener(name, listener)
        for (const [name, value, priority] of record.previousMotion) {
          if (value) record.element.style.setProperty(name, value, priority)
          else record.element.style.removeProperty(name)
        }
        record.filter.remove()
        if (record.previousFilter) record.element.style.setProperty('--dcb-liquid-filter', record.previousFilter, record.previousPriority)
        else record.element.style.removeProperty('--dcb-liquid-filter')
        for (const name of ['data-dcb-liquid', 'data-dcb-liquid-map', 'data-dcb-liquid-generation']) record.element.removeAttribute(name)
        if (!records.size) { svg?.remove(); svg = defs = null }
      }
      const eligible = element => element?.isConnected && element.getClientRects().length > 0
      const tick = record => {
        if (record.frame) window.cancelAnimationFrame(record.frame)
        record.frame = 0
        if (disposed || !record.live || forced.matches || !eligible(record.element)) { remove(record); return }
        if (!record.ready) return
        const style = window.getComputedStyle(record.element)
        const parsed = Number.parseFloat(style.getPropertyValue('--dcb-refraction-scale'))
        const base = reduced.matches || !Number.isFinite(parsed) ? record.target : parsed
        const depth = reduced.matches ? 0 : Number.parseFloat(style.getPropertyValue('--dcb-interaction-depth')) || 0
        const scale = base * (1 + depth / 12)
        setScale(record, scale)
        const transitions = record.element.getAnimations().filter(animation => ['--dcb-refraction-scale', '--dcb-interaction-depth'].includes(animation.transitionProperty) && !['finished', 'idle'].includes(animation.playState))
        for (const animation of transitions) if (!record.watched.has(animation)) {
          record.watched.add(animation)
          animation.finished.then(() => { if (record.live && !disposed) tick(record) }).catch(() => {})
        }
        if (!record.target && scale < .01 && !transitions.length) { remove(record); return }
        // Sampling is finite and runs only during optical transitions. A paused
        // test transition keeps its sampled value; its finish promise settles it.
        if (!reduced.matches && window.performance.now() < record.deadline && (transitions.length || Math.abs(base - record.target) > .01)) record.frame = window.requestAnimationFrame(() => tick(record))
      }
      const resetMotion = record => {
        if (record.inputFrame) window.cancelAnimationFrame(record.inputFrame)
        record.inputFrame = 0
        record.pendingPointer = null
        for (const name of motionProperties) record.element.style.removeProperty(name)
        record.deadline = window.performance.now() + 400
        tick(record)
      }
      const moveLight = (record, event) => {
        if (reduced.matches || forced.matches || !record.live || record.target <= 0) return
        record.pendingPointer = { x: event.clientX, y: event.clientY, pressed: event.type === 'pointerdown' || event.buttons > 0 }
        if (record.inputFrame) return
        // Coalesce pointer bursts; never rerasterize the map, move the card, or
        // prevent touch scrolling. CSS interpolates only the optical properties.
        record.inputFrame = window.requestAnimationFrame(() => {
          record.inputFrame = 0
          if (!record.live || !eligible(record.element) || reduced.matches || record.target <= 0) return
          const pointer = record.pendingPointer, bounds = record.element.getBoundingClientRect()
          if (!pointer || !bounds.width || !bounds.height) return
          const x = Math.max(0, Math.min(100, (pointer.x - bounds.left) / bounds.width * 100))
          const y = Math.max(0, Math.min(100, (pointer.y - bounds.top) / bounds.height * 100))
          record.element.style.setProperty('--dcb-glint-x', `${x.toFixed(2)}%`)
          record.element.style.setProperty('--dcb-glint-y', `${y.toFixed(2)}%`)
          record.element.style.setProperty('--dcb-glint-strength', pointer.pressed ? '1.25' : '1')
          record.element.style.setProperty('--dcb-interaction-depth', pointer.pressed ? '4' : '2')
          record.deadline = window.performance.now() + 400
          tick(record)
        })
      }
      const bindMotion = record => {
        record.pointerListeners = {
          pointermove: event => moveLight(record, event),
          pointerdown: event => moveLight(record, event),
          pointerup: event => event.pointerType === 'touch' ? resetMotion(record) : moveLight(record, event),
          pointerleave: () => resetMotion(record),
          pointercancel: () => resetMotion(record),
        }
        for (const [name, listener] of Object.entries(record.pointerListeners)) record.element.addEventListener(name, listener, { passive: true })
      }
      const applyGeometry = (record, shape) => {
        if (!shape || !record.live || shape.key === record.key) return
        let map
        try { map = cachedMap(shape) } catch { dispose(); return }
        record.key = shape.key; record.generation++; record.ready = false
        record.element.setAttribute('data-dcb-liquid-map', `${shape.width}x${shape.height}`)
        record.element.setAttribute('data-dcb-liquid-generation', String(record.generation))
        map.ready.then(() => {
          if (disposed || !record.live || record.key !== shape.key || !eligible(record.element)) return
          record.image.setAttribute('width', shape.width); record.image.setAttribute('height', shape.height)
          record.image.setAttribute('href', map.url)
          record.ready = true
          record.element.style.setProperty('--dcb-liquid-filter', `url("#${record.id}")`)
          tick(record)
        }, dispose)
      }
      const queueGeometry = record => {
        if (!record?.live) return
        if (record.resizeTimer) window.clearTimeout(record.resizeTimer)
        record.resizeTimer = window.setTimeout(() => {
          record.resizeTimer = 0
          if (!record.live || disposed) return
          if (!eligible(record.element)) { remove(record); return }
          applyGeometry(record, geometry(record.element))
        }, 100)
      }
      const resize = new window.ResizeObserver(entries => {
        for (const { target } of entries) {
          const record = records.get(target)
          if (record && geometry(target)?.key !== record.key) queueGeometry(record)
        }
      })
      const sync = elements => {
        if (disposed) return
        lastElements = Array.from(elements || [])
        const incoming = new Set(lastElements)
        for (const record of records.values()) if (forced.matches || !incoming.has(record.element) || !eligible(record.element)) remove(record)
        if (forced.matches) return
        for (const element of lastElements) {
          if (!eligible(element)) continue
          const target = (element.getAttribute(COMPOSER_ACTION_MARK) || element.getAttribute(COMPOSER_MARK) || element.getAttribute(SIDEBAR_MARK) || element.getAttribute('data-card-style')) === 'clear' ? element.hasAttribute(COMPOSER_ACTION_MARK) ? 4 : 12 : 0
          let record = records.get(element)
          if (!target && !record) continue
          if (!record) {
            const shape = geometry(element)
            if (!shape) continue
            ensureDefs()
            const id = `${prefix}-${++serial}`
            const filter = create('filter', { id, x: 0, y: 0, width: '100%', height: '100%', 'color-interpolation-filters': 'sRGB' })
            const image = create('feImage', { x: 0, y: 0, preserveAspectRatio: 'none', result: 'normal' })
            const displacement = create('feDisplacementMap', { in: 'SourceGraphic', in2: 'normal', scale: 0, xChannelSelector: 'R', yChannelSelector: 'G' })
            filter.append(image, displacement); defs.append(filter)
            record = { element, id, filter, image, displacement, target: null, key: null, generation: 0, frame: 0, inputFrame: 0, resizeTimer: 0, ready: false, live: true, watched: new WeakSet(), pointerListeners: {}, previousMotion: motionProperties.map(name => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]), previousFilter: element.style.getPropertyValue('--dcb-liquid-filter'), previousPriority: element.style.getPropertyPriority('--dcb-liquid-filter') }
            records.set(element, record); bindMotion(record); resize.observe(element); applyGeometry(record, shape)
            if (disposed) return
          } else if (geometry(element)?.key !== record.key) queueGeometry(record)
          if (record.target !== target) {
            record.target = target; record.deadline = window.performance.now() + 400
            element.setAttribute('data-dcb-liquid', target ? 'active' : 'settling')
            if (!target) resetMotion(record)
            if (record.frame) window.cancelAnimationFrame(record.frame)
            tick(record)
          }
        }
      }
      const preferences = () => {
        if (disposed) return
        if (forced.matches) { for (const record of [...records.values()]) remove(record) }
        else {
          sync(lastElements)
          if (reduced.matches) for (const record of [...records.values()]) resetMotion(record)
        }
      }
      const blur = () => { for (const record of records.values()) resetMotion(record) }
      forced.addEventListener('change', preferences); reduced.addEventListener('change', preferences)
      window.addEventListener('blur', blur)
      function dispose() {
        if (disposed) return
        disposed = true
        forced.removeEventListener('change', preferences); reduced.removeEventListener('change', preferences)
        window.removeEventListener('blur', blur)
        for (const record of [...records.values()]) remove(record)
        resize.disconnect(); cache.clear(); lastElements = []
      }
      return { sync, dispose }
    }

    const GLASS_PANEL = `:is(.dcb-summary, [${MARK}]):is([data-card-style="clear"], [data-card-style="css"], [data-card-style="glass"])`
    const css = `
      [${MARK}] {
        position: fixed !important;
        inset: var(--dcb-top) auto auto var(--dcb-left) !important;
        width: var(--dcb-width) !important;
        max-width: none !important;
        margin: 0 !important;
        z-index: 8;
        box-sizing: border-box;
        border: 1px solid #e4e4e4 !important;
        border-radius: 14px !important;
        background: #fff !important;
        color: #38362f;
        box-shadow: 0 4px 20px #29251c0b, 0 1px 3px #29251c08 !important;
        backdrop-filter: none !important;
        overflow: hidden;
        -webkit-app-region: no-drag;
      }
      [${MARK}] > div { padding: 12px 14px !important; gap: 12px !important; }
      [${MARK}] button {
        min-height: 28px;
        border-radius: 5px;
        gap: 8px !important;
        color: inherit;
      }
      [${MARK}] button:focus-visible { outline: 2px solid #b76e50; outline-offset: 3px; }
      [${MARK}] button > span:first-child { color: #a46950 !important; }
      [${MARK}] button > span:nth-child(2) { color: inherit !important; font-weight: 600 !important; }
      [${MARK}] button > span:nth-child(3) { color: #827d72 !important; font-size: 11px !important; }
      [${MARK}] button > span:last-child { color: #827d72 !important; }
      [${MARK}] ul {
        max-height: var(--dcb-list-height) !important;
        gap: 0 !important;
        padding-top: 6px !important;
        border-top: 1px solid #e7e3db;
        overscroll-behavior: contain;
        scrollbar-width: thin;
      }
      [${MARK}] li { align-items: flex-start !important; padding: 8px 0; gap: 9px !important; }
      [${MARK}] li > span:first-child { margin-top: 2px; }
      [${MARK}] li > span:last-child {
        white-space: normal !important;
        overflow-wrap: anywhere;
        text-overflow: clip !important;
        line-height: 21px;
        color: #57534b;
      }
      [${MARK}] li[data-status="completed"] > span:last-child { color: #918c82; }
      [${MARK}] li[data-status="in_progress"] > span:last-child { color: #a65f43; font-weight: 700; }
      body[data-ds-dark-theme] [${MARK}] {
        background: #292824 !important; border-color: #45423b !important; color: #eeeae2;
        box-shadow: 0 6px 24px #0003 !important;
      }
      body[data-ds-dark-theme] [${MARK}] ul { border-color: #423f38; }
      body[data-ds-dark-theme] [${MARK}] li > span:last-child { color: #d4cec2; }
      body[data-ds-dark-theme] [${MARK}] li[data-status="completed"] > span:last-child { color: #969084; }
      body[data-ds-dark-theme] [${MARK}] li[data-status="in_progress"] > span:last-child { color: #d99c7c; }
      body[data-ds-dark-theme] [${MARK}] button > span:first-child { color: #d99c7c !important; }
      body[data-ds-dark-theme] [${MARK}] button > span:nth-child(3),
      body[data-ds-dark-theme] [${MARK}] button > span:last-child { color: #aaa294 !important; }
      /* Same standalone settings surface tokens as dsh-settings-groups. */
      .dcb-settings {
        --dsh-settings-accent: var(--dsw-alias-state-info-primary, #5b5bf6);
        --dsh-settings-text: var(--dsw-alias-label-primary, #1f1f22);
        --dsh-settings-secondary: var(--dsw-alias-label-secondary, #666);
        --dsh-settings-surface: var(--dsw-alias-bg-layer-1, #fff);
        --dsh-settings-subtle: rgba(127,127,127,.055);
        --dsh-settings-border: rgba(127,127,127,.1);
        --dsh-settings-shadow: 0 1px 2px rgba(0,0,0,.05),0 6px 20px -6px rgba(0,0,0,.1);
        --dsh-settings-radius: 16px;
        --dsh-settings-padding: 20px 22px;
        --dcb-switch-off: #d0d0d0;
        --dcb-switch-on: #171717;
        --dcb-switch-border: #858585;
        --dcb-switch-on-border: #171717;
        --dcb-switch-hover-off: #bfbfbf;
        --dcb-switch-hover-on: #292929;
        --dcb-switch-focus: #666;
        overflow-anchor: none; display: flex; flex-direction: column; gap: 18px; box-sizing: border-box; width: 100%; max-width: 100%; min-width: 0; padding: 0; color: var(--dsh-settings-text); font-size: 14px;
      }
      .dcb-settings-hero { display: flex; align-items: flex-start; gap: 12px; padding: 2px 2px 8px; }
      .dcb-settings-hero-mark { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 11px; background: color-mix(in srgb, var(--dsh-settings-accent) 11%, transparent); color: var(--dsh-settings-accent); }
      .dcb-settings-hero h1 { margin: 0; font-size: 21px; font-weight: 700; line-height: 28px; letter-spacing: -.01em; }
      .dcb-settings-hero p { margin: 5px 0 0; color: var(--dsh-settings-secondary); font-size: 13.5px; line-height: 20px; }
      .dcb-settings-card { box-sizing: border-box; position: relative; width: 100%; padding: var(--dsh-settings-padding); border: 1px solid var(--dsh-settings-border); border-radius: var(--dsh-settings-radius); background: var(--dsh-settings-surface); box-shadow: var(--dsh-settings-shadow); animation: dcb-settings-enter ${MOTION.time.standard}ms ${MOTION.ease.smooth} backwards; }
      .dcb-settings-card:nth-of-type(2) { animation-delay: ${MOTION.stagger}ms; }
      .dcb-settings-card:nth-of-type(3) { animation-delay: ${MOTION.stagger * 2}ms; }
      .dcb-settings-card:nth-of-type(4) { animation-delay: ${MOTION.stagger * 3}ms; }
      .dcb-settings-header { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
      .dcb-settings-header > div { min-width: 0; }
      .dcb-settings-card h2 { margin: 0; font-size: 14px; font-weight: 700; line-height: 20px; }
      .dcb-settings-card p { margin: 4px 0 0; font-size: 12.5px; line-height: 19px; color: var(--dsh-settings-secondary); }
      .dcb-settings-section { margin-bottom: 18px; }
      .dcb-settings-section-title, .dcb-style-picker legend { display: block; padding: 0; margin: 0 0 10px; color: var(--dsh-settings-secondary); font-size: 12.5px; font-weight: 600; line-height: 19px; }
      .dcb-settings-row { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 16px 18px; border: 0; border-radius: 13px; background: var(--dsh-settings-subtle); box-shadow: inset 0 1px 2px rgba(0,0,0,.03); font-size: 14px; transition: background-color ${MOTION.time.quick}ms ${MOTION.ease.color}; }
      .dcb-settings-row + .dcb-settings-row { margin-top: 10px; }
      .dcb-settings-copy { flex: 1; min-width: 0; }
      .dcb-settings-row-title { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 14px; font-weight: 400; line-height: 20px; }
      .dcb-settings-card .dcb-settings-row-desc { margin-top: 3px; line-height: 1.45; }
      .dcb-settings-status { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border: 1px solid #9ba1a529; border-radius: 7px; background: #9ba1a51a; color: #697078; font-size: 11px; font-weight: 600; line-height: 1.4; transition: background-color ${MOTION.time.control}ms ${MOTION.ease.color}, border-color ${MOTION.time.control}ms ${MOTION.ease.color}, color ${MOTION.time.control}ms ${MOTION.ease.color}; }
      .dcb-settings-status[data-enabled="true"] { border-color: #49b9954a; background: #49b99524; color: #26735b; }
      .dcb-settings-controls { display: flex; align-items: center; gap: 14px; flex: 0 1 48%; min-width: 150px; }
      .dcb-settings-info { display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px; border: 0; border-radius: 12px; background: var(--dsh-settings-subtle); box-shadow: 0 1px 2px rgba(0,0,0,.03),0 4px 12px -6px rgba(0,0,0,.06); color: var(--dsh-settings-secondary); font-size: 13px; line-height: 19px; }
      .dcb-settings-info::before { content: ''; flex: none; width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; background: var(--dsh-settings-accent); }
      .dcb-motion-preview { margin-top: 18px; }
      .dcb-motion-preview-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      .dcb-motion-preview-head small { color: var(--dsh-settings-secondary); }
      .dcb-message-demo { display: grid; gap: 14px; padding: 20px; border: 1px solid var(--dsw-alias-border-l3, #8882); border-radius: 14px; background: #88888808; overflow: hidden; }
      .dcb-message-demo-row { width: fit-content; max-width: 85%; padding: 9px 14px; border-radius: 13px; font-size: 13px; line-height: 1.7; color: var(--dsw-alias-label-primary, #252631); background: var(--dsw-specific-input-major, #f4f5f7); }
      .dcb-message-demo-row[data-message-demo="user"] { justify-self: end; background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #777aff) 13%, transparent); border-bottom-right-radius: 4px; }
      .dcb-message-demo-row[data-message-demo="assistant"] { border-bottom-left-radius: 4px; }
      .dcb-settings-card .dcb-settings-footnote { margin-top: 12px; font-size: 11px; }
      .dcb-cost-tag { display: inline-flex; align-items: center; flex: none; padding: 2px 6px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #333) 12%, transparent); border-radius: 6px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #333) 4%, transparent); color: var(--dsh-settings-secondary); font-size: 10px; font-weight: 500; line-height: 1.5; white-space: nowrap; }
      .dcb-cost-tag[data-cost="high"] { background: #b423180d; border-color: #b4231852; color: #b42318; }
      body[data-ds-dark-theme] .dcb-cost-tag[data-cost="high"] { background: #ffb4ab14; border-color: #ffb4ab66; color: #ffb4ab; }
      .dcb-settings-card .dcb-cost-guide { margin: 0 0 18px; padding: 10px 12px; border: 1px solid #8882; border-radius: 10px; font-size: 12px; line-height: 1.6; }
      .dcb-settings-card .dcb-cost-description { margin: 9px 0 0; font-size: 11px; line-height: 1.6; }
      .dcb-style-name { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 5px; }
      @media(forced-colors:active) { .dcb-cost-tag,.dcb-cost-tag[data-cost="high"],body[data-ds-dark-theme] .dcb-cost-tag[data-cost="high"],.dcb-cost-guide { background: Canvas; color: CanvasText; border-color: CanvasText; } }
      @keyframes dcb-settings-enter { from { opacity: 0; transform: translateY(8px); filter: blur(2px); } to { opacity: 1; transform: translateY(0); filter: blur(0px); } }
      .dcb-settings-row button, .dcb-style-option, .dcb-count-option { font-family: inherit; }
      .dcb-switch { box-sizing: border-box; position: relative; flex: none; width: 42px; height: 24px; padding: 0; border: 1px solid var(--dcb-switch-border); border-radius: 999px; background: var(--dcb-switch-off); cursor: pointer; transition: background-color ${MOTION.time.quick}ms ${MOTION.ease.color}, border-color ${MOTION.time.quick}ms ${MOTION.ease.color}, opacity ${MOTION.time.quick}ms ${MOTION.ease.color}; }
      .dcb-switch:disabled { cursor: not-allowed; opacity: .55; }
      .dcb-switch::after { content: ''; position: absolute; left: 1px; top: 1px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.24); transform: translateX(0); transition: transform ${MOTION.time.control}ms ${MOTION.ease.snappy}; }
      .dcb-switch[aria-checked="true"] { background: var(--dcb-switch-on); border-color: var(--dcb-switch-on-border); }
      .dcb-switch[aria-checked="true"]::after { transform: translateX(18px); }
      .dcb-settings :is(.dcb-switch, .dcb-width-slider, .dcb-count-button, .dcb-count-option):focus-visible { outline: 2px solid #777; outline-offset: 3px; }
      .dcb-settings .dcb-switch:focus-visible { outline-color: var(--dcb-switch-focus); }
      @media (hover: hover) and (forced-colors: none) {
        .dcb-switch:hover:enabled { background: var(--dcb-switch-hover-off); }
        .dcb-switch[aria-checked="true"]:hover:enabled { background: var(--dcb-switch-hover-on); }
      }
      .dcb-width-slider { position: relative; flex: 1; min-width: 80px; height: 28px; cursor: ew-resize; touch-action: none; user-select: none; border-radius: 6px; }
      .dcb-width-track, .dcb-width-fill { position: absolute; top: 12px; left: 0; height: 4px; border-radius: 4px; background: #dedede; width: 100%; }
      .dcb-width-fill { width: var(--dcb-width-percent); background: #555; transition: width ${MOTION.time.quick}ms ${MOTION.ease.smooth}; }
      .dcb-width-thumb { position: absolute; left: var(--dcb-width-percent); top: 6px; width: 16px; height: 16px; border: 1px solid #bbb; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px #0002; transform: translateX(-50%); transition: left ${MOTION.time.quick}ms ${MOTION.ease.smooth}, box-shadow ${MOTION.time.quick}ms ${MOTION.ease.color}; }
      .dcb-width-slider[data-dragging="true"] :is(.dcb-width-fill, .dcb-width-thumb) { transition-duration: 0ms; }
      .dcb-width-slider:hover .dcb-width-thumb { box-shadow: 0 0 0 4px #8882, 0 1px 4px #0002; }
      .dcb-width-value { min-width: 47px; padding: 4px 8px; border-radius: 6px; background: #0000000a; color: var(--dsh-settings-text); font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; text-align: center; white-space: nowrap; }
      .dcb-count-picker { position: relative; flex: none; }
      .dcb-count-button { display: flex; align-items: center; gap: 20px; min-width: 116px; height: 26px; padding: 0 9px; border: 1px solid rgba(127,127,127,.26); border-radius: 6px; background: transparent; color: var(--dsh-settings-text); font-size: 12.5px; font-weight: 400; cursor: pointer; transition: border-color ${MOTION.time.quick}ms ${MOTION.ease.color}, box-shadow ${MOTION.time.quick}ms ${MOTION.ease.color}; }
      .dcb-count-button:hover, .dcb-count-button[aria-expanded="true"] { border-color: #999; box-shadow: 0 0 0 2px #8881; }
      .dcb-count-caret { width: 6px; height: 6px; margin: -3px 2px 0 auto; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(45deg); transition: transform ${MOTION.time.control}ms ${MOTION.ease.smooth}; }
      .dcb-count-button[aria-expanded="true"] .dcb-count-caret { transform: translateY(3px) rotate(225deg); }
      .dcb-count-menu { position: absolute; right: 0; top: calc(100% + 4px); z-index: 12; display: grid; gap: 1px; min-width: 132px; padding: 3px; border: 1px solid rgba(127,127,127,.18); border-radius: 8px; background: var(--dsh-settings-surface); box-shadow: 0 8px 24px rgba(0,0,0,.14); transform-origin: top right; }
      .dcb-count-option { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 6px 10px; border: 0; border-radius: 5px; background: transparent; color: var(--dsh-settings-text); font-size: 13px; text-align: left; cursor: pointer; transition: background-color ${MOTION.time.quick}ms ${MOTION.ease.color}; }
      .dcb-count-option:hover, .dcb-count-option[aria-selected="true"] { background: #8882; }
      body[data-ds-dark-theme] .dcb-settings {
        --dsh-settings-accent: var(--dsw-alias-state-info-primary, #a3a5ff);
        --dsh-settings-text: var(--dsw-alias-label-primary, #eee);
        --dsh-settings-secondary: var(--dsw-alias-label-secondary, #b3b3b3);
        --dsh-settings-surface: var(--dsw-alias-bg-layer-1, #252525);
        --dcb-switch-off: #4a4a4a;
        --dcb-switch-on: #111;
        --dcb-switch-border: #7f7f7f;
        --dcb-switch-on-border: #9a9a9a;
        --dcb-switch-hover-off: #585858;
        --dcb-switch-focus: #b6b6b6;
      }
      body[data-ds-dark-theme] .dcb-settings-status { color: #adb3bb; }
      body[data-ds-dark-theme] .dcb-settings-status[data-enabled="true"] { color: #70d5b3; }
      body[data-ds-dark-theme] .dcb-width-value { background: #ffffff14; }
      body[data-ds-dark-theme] .dcb-width-track { background: #555; }
      body[data-ds-dark-theme] .dcb-width-fill { background: #bbb; }
      @media (prefers-reduced-motion: reduce) {
        .dcb-settings-card { animation: none; }
        .dcb-settings :is(.dcb-switch, .dcb-width-fill, .dcb-width-thumb, .dcb-count-button, .dcb-count-caret, .dcb-count-option, .dcb-style-option), .dcb-settings .dcb-switch::after, .dcb-settings .dcb-style-option::after { transition: none; }
        .dcb-settings :is(.dcb-settings-row, .dcb-settings-status) { transition: none; }
      }
      [data-dcb-native-hidden] { display: none !important; }
      [data-slot="conversation.header"]:has(.dcb-anchor) { position: relative; z-index: 20; }
      .dcb-anchor { position: relative; display: inline-flex; z-index: 20; -webkit-app-region: no-drag; }
      .dcb-entry { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; flex: none; gap: 6px; min-width: 28px; height: 24px; padding: 0 7px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-primary, #343434); font-family: inherit; font-size: 13px; font-weight: 400; line-height: 18px; white-space: nowrap; cursor: pointer; }
      .dcb-entry .dcb-logo { display: block; flex: none; }
      .dcb-entry[aria-expanded="true"], .dcb-entry:hover { background: var(--dsw-alias-interactive-bg-hover, #f1f0ed); }
      .dcb-entry[data-working="true"] { background: var(--dsw-alias-interactive-bg-hover, #f1f0ed); white-space: nowrap; font-variant-numeric: tabular-nums; }
      .dcb-context-window { position: relative; overflow: hidden; }
      .dcb-context-ghost { position: absolute; inset: 0; pointer-events: none; }
      .dcb-context-ghost * { animation: none !important; }
      .dcb-context-empty { margin: 0; color: #95918a; font-size: 12px; line-height: 20px; }
      .dcb-turn-navigation { display: flex; align-items: center; gap: 6px; min-height: 24px; margin-bottom: 10px; color: var(--dcb-ink-muted, #95918a); font-size: 11px; }
      .dcb-turn-navigation > span { flex: 1; min-width: 0; }
      .dcb-turn-navigation button { border: 0; border-radius: 4px; padding: 0 5px; min-width: 24px; line-height: 22px; color: inherit; background: transparent; transition: background-color ${MOTION.time.quick}ms ${MOTION.ease.color}; }
      .dcb-turn-navigation button:hover:enabled { background: #8882; }
      .dcb-turn-navigation button:disabled { opacity: .35; cursor: default; }
      .dcb-plan-group + .dcb-plan-group { margin-top: 8px; }
      .dcb-plan-toggle { display: flex; width: 100%; align-items: center; gap: 6px; border: 0; padding: 5px 2px; border-radius: 5px; color: inherit; background: transparent; text-align: left; font-size: 12px; }
      .dcb-plan-toggle > span:first-child { flex: 1; }
      .dcb-plan-count, .dcb-plan-status { color: var(--dcb-ink-muted, #95918a); font-size: 11px; font-weight: 400; }
      .dcb-plan-group .dcb-tool-chevron { margin-left: 2px; }
      .dcb-plan-toggle[aria-expanded="true"] .dcb-tool-chevron { transform: rotate(180deg); }
      .dcb-plan-disclosure { position: relative; overflow: hidden; }
      .dcb-plan-disclosure .dcb-timeline { padding-top: 4px; }
      .dcb-plan-group .dcb-step > span:nth-child(2) { flex: 1; min-width: 0; overflow-wrap: anywhere; }
      .dcb-plan-state { margin-left: auto; flex: none; color: var(--dcb-ink-muted, #95918a); font-size: 11px; }
      .dcb-scope-note { margin: 8px 0 0; color: var(--dcb-ink-muted, #95918a); font-size: 11px; }
      @media(prefers-reduced-motion:reduce), (forced-colors:active) { .dcb-turn-navigation button { transition: none; } }
      .dcb-summary { box-sizing: border-box; position: absolute; top: calc(100% + 12px); right: 0; width: min(var(--dcb-card-width, 320px), calc(100vw - 24px)); max-height: var(--dcb-card-height, calc(100vh - 100px)); overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; border: 1px solid #e4e3df; border-radius: 14px; background: #fff; color: #242424; box-shadow: 0 2px 4px #0000000a; padding: 16px; text-align: left; font: 13px/1.6 system-ui, sans-serif; }
      .dcb-summary section + section { border-top: 1px solid #eee; margin-top: 14px; padding-top: 14px; }
      .dcb-summary h3 { display: flex; align-items: center; justify-content: space-between; font-size: 13px; line-height: 20px; font-weight: 500; margin: 0; }
      .dcb-summary button { font-family: inherit; cursor: pointer; }
      .dcb-summary button:focus-visible, .dcb-entry:focus-visible { outline: 2px solid #a46950; outline-offset: 3px; }
      .dcb-close { display: grid; place-items: center; width: 24px; height: 24px; margin: -2px -2px -2px 0; padding: 3px; border: 0; border-radius: 5px; background: transparent; color: inherit; }
      .dcb-close:hover { background: #f5f5f5; }
      .dcb-timeline { list-style: none; margin: 0; padding: 0; }
      .dcb-step-window { position: relative; overflow: hidden; }
      .dcb-progress-liquid-layer { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
      .dcb-progress-liquid { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
      .dcb-progress-liquid path { will-change: d; }
      .dcb-status[data-dcb-flow-hidden] > .dcb-status-dot { visibility: hidden; }
      @media(prefers-reduced-motion:reduce), (forced-colors:active) { .dcb-progress-liquid-layer { display: none; } .dcb-status[data-dcb-flow-hidden] > .dcb-status-dot { visibility: visible; } }
      .dcb-step-window:focus-visible { outline: 1px solid #a46950; outline-offset: -1px; border-radius: 4px; }
      .dcb-recent-steps { position: relative; }
      .dcb-step-ghost { position: absolute; top: 0; right: 0; left: 0; pointer-events: none; }
      .dcb-step-group { overflow: hidden; }
      .dcb-summary .dcb-follow { border: 0; padding: 0 4px; background: transparent; color: #95918a; font-size: 11px; line-height: 20px; }
      .dcb-summary .dcb-follow:hover { color: inherit; }
      .dcb-step, .dcb-history { position: relative; display: flex; gap: 10px; align-items: flex-start; min-height: 30px; padding: 4px 0; font-size: 13px; line-height: 21px; color: #66645f; }
      .dcb-step { --dcb-line-gap: 8px; }
      .dcb-step[data-status="in_progress"] { --dcb-line-gap: 10px; }
      .dcb-step[data-link-before]::before, .dcb-step[data-link-after]::after, .dcb-history::before { content: ''; position: absolute; left: 9.25px; width: 0; border-left: 1.5px solid var(--dcb-timeline-line, #e5e5e5); pointer-events: none; }
      .dcb-step[data-link-before]::before { top: 0; height: calc(14.5px - var(--dcb-line-gap)); }
      .dcb-step[data-link-after]::after { top: calc(14.5px + var(--dcb-line-gap)); bottom: 0; }
      .dcb-step[data-link-before="dashed"]::before, .dcb-step[data-link-after="dashed"]::after, .dcb-history::before { border-left-style: dashed; }
      .dcb-history::before { top: 5px; bottom: 0; }
      .dcb-future::before { top: 0; bottom: 9px; }
      .dcb-future[aria-expanded="true"]::before { bottom: 0; }
      .dcb-step[data-status="completed"], .dcb-step[data-status="pending"] { color: #9a9a9a; }
      .dcb-step[data-status="in_progress"] { color: #202020; font-weight: 700; }
      .dcb-status { position: relative; z-index: 1; display: grid; place-items: center; flex: 0 0 20px; width: 20px; height: 21px; }
      .dcb-status > .dcb-status-dot { position: absolute; display: block; width: 24px; height: 24px; left: 50%; top: 50%; transform: translate(-50%, -50%); overflow: visible; shape-rendering: geometricPrecision; }
      .dcb-status-core { fill: none; stroke: currentColor; stroke-width: 1px; }
      .dcb-step[data-status="completed"] .dcb-status-core, .dcb-step[data-status="in_progress"] .dcb-status-core { fill: currentColor; }
      .dcb-status-orbit, .dcb-status-ripple { display: none; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; transform-box: view-box; transform-origin: 50% 50%; }
      .dcb-step-text { overflow-wrap: anywhere; min-width: 0; }
      @media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
        .dcb-timeline[data-working="true"] .dcb-step[data-status="in_progress"] .dcb-status-orbit { display: inline; animation: dcb-orbit 1.35s linear infinite; }
        .dcb-timeline[data-working="true"] .dcb-step[data-status="in_progress"] .dcb-status-ripple { display: inline; animation: dcb-ripple 1.9s cubic-bezier(.15,.6,.3,1) infinite; }
        .dcb-timeline[data-working="true"] .dcb-step[data-status="in_progress"] .dcb-step-text { background-image: linear-gradient(100deg, var(--dcb-shimmer-base, currentColor) 38%, var(--dcb-shimmer-shoulder, #c5c5c5) 46%, var(--dcb-shimmer-peak, #fff) 50%, var(--dcb-shimmer-shoulder, #c5c5c5) 54%, var(--dcb-shimmer-base, currentColor) 62%); background-size: 250% 100%; background-repeat: no-repeat; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: dcb-text-shimmer 2.4s linear infinite; }
      }
      @media (forced-colors: active) { .dcb-summary { --dcb-timeline-line: GrayText; } .dcb-step-text { -webkit-text-fill-color: CanvasText; } }
      .dcb-history { border: 0; background: transparent; width: 100%; text-align: left; color: #95918a; font-size: 12px; padding-top: 0; }
      .dcb-summary .dcb-history:focus-visible { outline-offset: -2px; border-radius: 5px; }
      .dcb-history .dcb-status { color: #d8d6d1; }
      .dcb-history-label { display: inline-flex; align-items: center; gap: 5px; }
      .dcb-history-label svg { transition: transform ${MOTION.time.standard}ms ${MOTION.ease.smooth}; }
      .dcb-history[aria-expanded="true"] svg { transform: rotate(180deg); }
      .dcb-output { display: flex; align-items: center; gap: 10px; width: 100%; padding: 5px 2px; background: transparent; border: 0; text-align: left; color: #66645f; border-radius: 6px; font-size: 13px; }
      .dcb-output:hover { background: #f5f5f5; }
      .dcb-tile { display: grid; place-items: center; flex: 0 0 30px; width: 30px; height: 30px; border-radius: 7px; overflow: hidden; background: #f1f0ec; color: #8b8679; font-size: 9px; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; }
      .dcb-tile > img { display: block; width: 100%; height: 100%; object-fit: cover; }
      .dcb-tile[data-kind="image"]:not(:has(img)) { color: #a8a294; }
      .dcb-file-name { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dcb-file-type { flex: none; color: #95918a; font-size: 11px; text-transform: uppercase; }
      .dcb-module-toggle { display: inline-flex; align-items: center; gap: 6px; background: none; border: 0; padding: 0; color: inherit; font-size: 13px; }
      .dcb-module-toggle svg { color: #9a9790; transition: transform ${MOTION.time.standard}ms ${MOTION.ease.smooth}; }
      .dcb-module-toggle[aria-expanded="false"] svg { transform: rotate(-90deg); }
      .dcb-collapse { display: grid; grid-template-rows: 1fr; opacity: 1; overflow: hidden; transition: grid-template-rows ${MOTION.time.standard}ms ${MOTION.ease.smooth}, opacity ${MOTION.time.control}ms ${MOTION.ease.color}; }
      .dcb-collapse[aria-hidden="true"] { grid-template-rows: 0fr; opacity: 0; }
      .dcb-collapse-inner { min-height: 0; overflow: hidden; }
      .dcb-module-body { padding-top: 10px; }
      .dcb-resource { display: flex; align-items: center; gap: 10px; padding: 7px 2px; color: #66645f; font-size: 13px; }
      .dcb-resource > svg, .dcb-output > svg { flex: 0 0 18px; }
      .dcb-resource-label { flex-shrink: 0; max-width: 50%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dcb-resource-detail { margin-left: auto; min-width: 0; color: #95918a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
      .dcb-resource-summary { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 32px; padding: 5px 2px; border: 0; border-radius: 5px; background: transparent; text-align: left; color: #66645f; font-size: 13px; }
      .dcb-resource-summary:hover { background: #f5f5f5; }
      .dcb-resource-summary > svg { flex: none; }
      .dcb-tool-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dcb-tool-count { flex: none; color: #95918a; font-size: 11px; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .dcb-tool-failed { flex: none; color: #9b6662; font-size: 11px; white-space: nowrap; }
      .dcb-tool-chevron { color: #95918a; transition: transform ${MOTION.time.material}ms ${MOTION.ease.color}; }
      .dcb-resource-summary[aria-expanded="true"] .dcb-tool-chevron { transform: rotate(180deg); }
      .dcb-tools-disclosure, .dcb-skills-disclosure { overflow: hidden; }
      .dcb-tools-body, .dcb-skills-body { padding-top: 4px; }
      :is(.dcb-tools-body, .dcb-skills-body) .dcb-resource { padding-block: 5px; }
      .dcb-tool-row .dcb-resource-label { flex: 1; min-width: 0; max-width: none; }
      .dcb-tool-category { flex: none; color: #95918a; font-size: 10px; line-height: 16px; }
      .dcb-tool-row .dcb-resource-detail { flex: 0 1 auto; }
      .dcb-tool-symbol { animation: dcb-tool-icon-in ${MOTION.time.control}ms ${MOTION.ease.smooth}; }
      @keyframes dcb-tool-icon-in { from { opacity: 0; transform: translateY(6px) scale(.9); filter: blur(2px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
      .dcb-resource-summary[data-working="true"], .dcb-tool-row[data-working="true"] { color: #202020; --dcb-shimmer-base: #202020; }
      @media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
        .dcb-resource-summary[data-working="true"] .dcb-tool-name { background-image: linear-gradient(100deg, var(--dcb-shimmer-base) 44%, var(--dcb-tool-sheen, #767676) 50%, var(--dcb-shimmer-base) 56%); background-size: 250% 100%; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: dcb-text-shimmer 2.4s linear infinite; }
      }
      @media (prefers-reduced-motion: reduce), (forced-colors: active) { .dcb-tool-chevron { transition: none; } .dcb-tool-symbol { animation: none; } }
      .dcb-note { font-size: 11px; color: #9a9790; margin: 8px 0 0; }
      @keyframes dcb-orbit { to { transform: rotate(360deg); } }
      @keyframes dcb-ripple { 0% { transform: scale(.85); opacity: .35; } 75%, 100% { transform: scale(1.8); opacity: 0; } }
      @keyframes dcb-text-shimmer { 0% { background-position: 100% 0; } 70%, 100% { background-position: 0% 0; } }
      @media (prefers-reduced-motion: reduce) { .dcb-collapse, .dcb-module-toggle svg, .dcb-history-label svg { transition: none; } }
      body[data-ds-dark-theme] .dcb-summary { --dcb-timeline-line: #4d4b46; background: #292824; color: #eeeae2; border-color: #45423b; box-shadow: 0 2px 6px #0003; }
      body[data-ds-dark-theme] .dcb-summary section + section { border-color: #45423b; }
      body[data-ds-dark-theme] .dcb-step, body[data-ds-dark-theme] .dcb-output, body[data-ds-dark-theme] .dcb-resource { color: #cec9bd; }
      body[data-ds-dark-theme] .dcb-resource-summary { color: #cec9bd; }
      body[data-ds-dark-theme] .dcb-tool-category { color: #aaa294; }
      body[data-ds-dark-theme] .dcb-resource-summary:hover { background: #37352f; }
      body[data-ds-dark-theme] .dcb-resource-summary[data-working="true"], body[data-ds-dark-theme] .dcb-tool-row[data-working="true"] { color: #f2f2f2; --dcb-shimmer-base: #d2d2d2; --dcb-tool-sheen: #fff; }
      body[data-ds-dark-theme] .dcb-tool-failed { color: #e9b0a9; }
      body[data-ds-dark-theme] .dcb-output:hover, body[data-ds-dark-theme] .dcb-close:hover { background: #37352f; }
      body[data-ds-dark-theme] .dcb-tile { background: #37352f; color: #b8b1a3; }
      body[data-ds-dark-theme] .dcb-step[data-status="completed"], body[data-ds-dark-theme] .dcb-step[data-status="pending"] { color: #8d8d8d; }
      body[data-ds-dark-theme] .dcb-step[data-status="in_progress"] { color: #f2f2f2; --dcb-shimmer-base: #d2d2d2; }
      @media (max-width: 600px) { .dcb-summary { padding: 14px; } }
      .dcb-style-picker { border: 0; padding: 0; margin: 0 0 18px; min-width: 0; }
      .dcb-settings-card .dcb-style-picker > p { margin: -3px 0 12px; font-size: 11px; }
      .dcb-settings-card .dcb-style-picker > .dcb-cost-description { margin: 12px 0 0; }
      .dcb-style-options { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-auto-rows: 1fr; gap: 12px; }
      .dcb-settings .dcb-style-option { position: relative; display: grid; grid-template-rows: 66px auto 1fr; justify-items: center; gap: 8px; min-width: 0; padding: 14px 12px 13px; border: 1px solid rgba(127,127,127,.26); border-radius: 13px; background: var(--dsh-settings-subtle); text-align: center; cursor: pointer; transition: border-color ${MOTION.time.control}ms ${MOTION.ease.color}, background-color ${MOTION.time.control}ms ${MOTION.ease.color}, box-shadow ${MOTION.time.control}ms ${MOTION.ease.color}; }
      .dcb-settings .dcb-style-option:hover { background: rgba(127,127,127,.09); border-color: rgba(127,127,127,.45); }
      .dcb-settings .dcb-style-option[aria-checked="true"] { background: color-mix(in srgb, var(--dsh-settings-accent) 5%, transparent); border-color: var(--dsh-settings-accent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--dsh-settings-accent) 12%, transparent); }
      .dcb-style-option:focus-visible { outline: 2px solid #777; outline-offset: 3px; }
      .dcb-style-option::after { content: ''; position: absolute; top: 11px; right: 11px; width: 7px; height: 7px; border: 1px solid #7f87926b; border-radius: 50%; background: var(--dsh-settings-surface); opacity: .65; transition: background-color ${MOTION.time.control}ms ${MOTION.ease.color}, border-color ${MOTION.time.control}ms ${MOTION.ease.color}, opacity ${MOTION.time.control}ms ${MOTION.ease.color}; }
      .dcb-style-option[aria-checked="true"]::after { background: var(--dsh-settings-accent); border-color: var(--dsh-settings-accent); opacity: 1; }
      .dcb-style-scene { display: grid; place-items: center; width: 100%; height: 66px; overflow: hidden; border-radius: 8px; background: linear-gradient(125deg, transparent 38%, #ffffffb3 38% 44%, transparent 44%), radial-gradient(ellipse at 15% 30%, #a6cbd0, transparent 60%), radial-gradient(ellipse at 85% 80%, #d9b59b, transparent 60%), #e8e4dc; }
      .dcb-style-swatch { box-sizing: border-box; position: relative; display: grid; align-content: center; justify-items: start; gap: 6px; width: 82px; height: 48px; padding: 12px; border: 1px solid; border-radius: 12px; opacity: 1; transform: translateY(0); transition: transform ${MOTION.time.material}ms ${MOTION.ease.smooth}; }
      .dcb-style-option[aria-checked="true"] .dcb-style-swatch { transform: translateY(-6px); }
      .dcb-style-swatch i { width: 45px; height: 3px; border-radius: 3px; background: #847b72; opacity: .5; }
      .dcb-style-swatch i:last-child { width: 30px; opacity: .3; }
      [data-dcb-composer-style-picker] .dcb-style-swatch[data-card-style="milk"] { background: var(--dsw-specific-input-major, #f4f5f7) !important; border-color: var(--dsw-alias-border-l2, #d9dde5) !important; box-shadow: var(--dsw-elevation-soft, 0 1px 5px #0002) !important; }
      .dcb-style-name { font-size: 14px; font-weight: 600; color: var(--dsh-settings-text); line-height: 1.4; }
      .dcb-style-option small { color: var(--dsh-settings-secondary); font-size: 11px; line-height: 1.45; }
      body[data-ds-dark-theme] .dcb-style-scene { background: linear-gradient(125deg, transparent 38%, #ffffff40 38% 44%, transparent 44%), radial-gradient(ellipse at 15% 30%, #416b72, transparent 60%), radial-gradient(ellipse at 85% 80%, #7b5540, transparent 60%), #302e29; }
      body[data-ds-dark-theme] .dcb-style-swatch i { background: #e3ddd4; }
      @media (min-width: 601px) and (max-width: 900px) {
        .dcb-style-options { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 600px) {
        .dcb-settings { --dsh-settings-padding: 18px 16px; }
        .dcb-settings-header { gap: 10px; }
        .dcb-style-options { grid-template-columns: minmax(0, 1fr); }
        .dcb-settings-controls { flex-basis: 100%; }
        .dcb-settings-row[data-setting="width"] { flex-wrap: wrap; gap: 8px; }
      }
      @media (forced-colors: active) {
        .dcb-settings-card, .dcb-settings :is(.dcb-settings-row, .dcb-settings-info, .dcb-settings-badge, .dcb-settings-status, .dcb-style-option, .dcb-count-button, .dcb-count-menu) { background: Canvas !important; border-color: CanvasText !important; color: CanvasText !important; box-shadow: none !important; }
        .dcb-settings-card p, .dcb-settings :is(.dcb-settings-section-title, .dcb-style-name, .dcb-style-option small, .dcb-style-picker legend) { color: CanvasText !important; }
        .dcb-settings .dcb-style-option[aria-checked="true"] { outline: 2px solid Highlight; outline-offset: -2px; }
        .dcb-settings .dcb-style-option[aria-checked="true"]::after, .dcb-settings-info::before { background: Highlight; border-color: Highlight; box-shadow: none; }
        .dcb-settings .dcb-switch { background: ButtonFace; border-color: ButtonText; box-shadow: none; }
        .dcb-settings .dcb-switch[aria-checked="true"] { background: Highlight; border-color: Highlight; }
        .dcb-settings .dcb-switch::after { background: ButtonText; }
        .dcb-settings .dcb-switch[aria-checked="true"]::after { background: HighlightText; }
        .dcb-settings :is(.dcb-width-track, .dcb-width-fill, .dcb-width-thumb) { background: ButtonText; border-color: ButtonText; }
      }
      @property --dcb-backdrop-blur { syntax: "<length>"; inherits: false; initial-value: 0px; }
      @property --dcb-backdrop-saturation { syntax: "<number>"; inherits: false; initial-value: 1; }
      @property --dcb-refraction-scale { syntax: "<number>"; inherits: false; initial-value: 0; }
      @property --dcb-sheen-opacity { syntax: "<number>"; inherits: false; initial-value: 0; }
      @property --dcb-glint-x { syntax: "<percentage>"; inherits: false; initial-value: 8%; }
      @property --dcb-glint-y { syntax: "<percentage>"; inherits: false; initial-value: 0%; }
      @property --dcb-glint-strength { syntax: "<number>"; inherits: false; initial-value: 0; }
      @property --dcb-interaction-depth { syntax: "<number>"; inherits: false; initial-value: 0; }
      body ${MATERIAL_BASE} {
        --dcb-surface-background: #fff; --dcb-surface-border: #e4e4e4; --dcb-surface-shadow: 0 4px 14px rgba(0,0,0,.07);
        --dcb-backdrop-blur: 0px; --dcb-backdrop-saturation: 1; --dcb-refraction-scale: 0; --dcb-sheen-opacity: 0;
        background-color: var(--dcb-surface-background) !important;
        --dcb-surface-image: radial-gradient(ellipse at var(--dcb-glint-x) var(--dcb-glint-y), rgb(255 255 255 / calc(var(--dcb-glint-strength) * var(--dcb-sheen-opacity) * .14)), transparent 60%), radial-gradient(ellipse at 8% 0%, rgb(255 255 255 / calc(var(--dcb-sheen-opacity) * .28)), transparent 56%), linear-gradient(123deg, rgb(255 255 255 / calc(var(--dcb-sheen-opacity) * .1)), transparent 28% 72%, rgb(255 255 255 / calc(var(--dcb-sheen-opacity) * .08)));
        background-image: var(--dcb-surface-image) !important;
        background-origin: border-box; border-color: var(--dcb-surface-border) !important; box-shadow: var(--dcb-surface-shadow) !important;
        /* A URL makes ordinary filter transitions discrete. Typed values retain smooth interpolation. */
        --dcb-surface-backdrop: var(--dcb-liquid-filter,) blur(var(--dcb-backdrop-blur)) saturate(var(--dcb-backdrop-saturation));
        backdrop-filter: var(--dcb-surface-backdrop) !important;
        -webkit-backdrop-filter: var(--dcb-surface-backdrop) !important;
        transition: background-color ${MOTION.time.material}ms ${MOTION.ease.color}, border-color ${MOTION.time.material}ms ${MOTION.ease.color}, box-shadow ${MOTION.time.material}ms ${MOTION.ease.color}, --dcb-backdrop-blur ${MOTION.time.material}ms ${MOTION.ease.color}, --dcb-backdrop-saturation ${MOTION.time.material}ms ${MOTION.ease.color}, --dcb-refraction-scale ${MOTION.time.material}ms ${MOTION.ease.color}, --dcb-sheen-opacity ${MOTION.time.material}ms ${MOTION.ease.color}, --dcb-glint-x ${MOTION.time.quick}ms ${MOTION.ease.smooth}, --dcb-glint-y ${MOTION.time.quick}ms ${MOTION.ease.smooth}, --dcb-glint-strength ${MOTION.time.material}ms ${MOTION.ease.color}, --dcb-interaction-depth ${MOTION.time.material}ms ${MOTION.ease.color};
      }
      body[data-ds-dark-theme] ${MATERIAL_BASE} { --dcb-surface-background: #292824; --dcb-surface-border: #45423b; --dcb-surface-shadow: 0 4px 16px #00000038; }
      body:not([data-ds-dark-theme]) .dcb-summary[data-card-style="milk"] { --dcb-content-tile: #fff; --dcb-content-border: #e4e4e4; }
      body:not([data-ds-dark-theme]) .dcb-summary[data-card-style="milk"] :is(.dcb-tile, .dcb-artifact-placeholder) { background: #fff; }
      body:not([data-ds-dark-theme]) .dcb-summary[data-card-style="milk"] .dcb-tile { box-shadow: inset 0 0 0 1px var(--dcb-content-border); }
      body ${material('clear')} {
        --dcb-surface-background: rgba(255,255,255,.56); --dcb-surface-border: rgba(255,255,255,.74); --dcb-backdrop-saturation: 1.15; --dcb-refraction-scale: 12; --dcb-sheen-opacity: 1;
        --dcb-surface-shadow: 0 2px 6px rgba(28,32,40,.035), 0 10px 28px rgba(28,32,40,.09), inset 0 1px 0 rgba(255,255,255,.92), inset 1px 0 0 rgba(255,255,255,.42), inset -1px -1px 0 rgba(255,255,255,.18);
      }
      body[data-ds-dark-theme] ${material('clear')} {
        --dcb-surface-background: rgba(24,28,36,.22); --dcb-surface-border: rgba(255,255,255,.4); --dcb-sheen-opacity: .52;
        --dcb-surface-shadow: 0 2px 6px #00000014, 0 10px 28px #00000042, inset 0 1px 0 #ffffff42, inset 1px 0 0 #ffffff1a, inset -1px -1px 0 #ffffff0c;
      }
      /* A separate CSS surface: no displacement map, pointer light, or overlay
         over the content. Its subtle rim uses the existing material properties. */
      body ${material('css')} {
        --dcb-surface-background: rgba(255,255,255,.56); --dcb-surface-border: rgba(255,255,255,.6);
        --dcb-backdrop-blur: 2px; --dcb-backdrop-saturation: 1.15; --dcb-sheen-opacity: .6;
        --dcb-surface-shadow: 0 5px 18px rgba(26,34,46,.1), inset 0 1px 1px rgba(255,255,255,.92), inset 1px 0 1px rgba(255,255,255,.52), inset 0 -1px 1px rgba(255,255,255,.45), inset 0 0 2px rgba(10,20,40,.16);
      }
      body[data-ds-dark-theme] ${material('css')} {
        --dcb-surface-background: rgba(24,28,36,.78); --dcb-surface-border: rgba(255,255,255,.35); --dcb-sheen-opacity: .14;
        --dcb-surface-shadow: 0 5px 18px #00000052, inset 0 1px 1px #ffffff8f, inset 1px 0 1px #ffffff33, inset 0 -1px 1px #ffffff20, inset 0 0 2px #00000029;
      }
      ${COMPOSER_GLASS} {
        outline: 1px solid var(--dcb-surface-border); outline-offset: -1px;
      }
      /* The host already scrolls behind its sticky seat and reserves tail space.
         Reveal that content without changing scroll geometry or input hit areas. */
      ${CHAT_UNDER_COMPOSER} { background: transparent !important; }
      body ${material('glass')} {
        --dcb-surface-background: rgba(236,242,248,.62); --dcb-surface-border: rgba(255,255,255,.72); --dcb-backdrop-blur: 22px; --dcb-backdrop-saturation: 1.45; --dcb-sheen-opacity: .22;
        --dcb-surface-shadow: 0 12px 32px rgba(28,32,40,.1), inset 0 1px 0 rgba(255,255,255,.9), inset 1px 0 0 rgba(255,255,255,.45), inset -1px -1px 0 rgba(255,255,255,.2);
      }
      body[data-ds-dark-theme] ${material('glass')} {
        --dcb-surface-background: rgba(160,174,190,.26); --dcb-surface-border: rgba(255,255,255,.34); --dcb-sheen-opacity: .32;
        --dcb-surface-shadow: 0 12px 32px #0005, inset 0 1px 0 #ffffff52, inset 1px 0 0 #ffffff24, inset -1px -1px 0 #ffffff14;
      }
      ${COMPOSER_ACTION_SURFACE} {
        /* The center is the real browser backdrop; Lens only paints the rim. */
        --dcb-liquid-filter: initial;
        position: relative; isolation: isolate;
        background: transparent !important;
        border-color: transparent !important;
        backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
        box-shadow: 0 2px 5px #18203012, inset 0 1px .7px #ffffffb8, inset 0 -1px .7px #18203035 !important;
        color: var(--dsw-alias-label-primary, #20242a) !important;
        outline: 1px solid #ffffff70; outline-offset: -1px;
        text-shadow: none;
      }
      ${COMPOSER_ACTION_SURFACE} svg { filter: none; }
      ${COMPOSER_ACTION_SURFACE}[${COMPOSER_ACTION_KIND}="model"]:disabled { color: var(--dsw-alias-label-dimmed, var(--dsw-alias-label-caption, #737982)) !important; }
      ${COMPOSER_ACTION_DARK} { outline-color: #ffffff42; box-shadow: 0 2px 5px #0002, inset 0 1px .7px #ffffff70, inset 0 -1px .7px #0008 !important; }
      ${COMPOSER_ACTION_SURFACE}:hover:not(:disabled) { outline-color: #ffffffb3; box-shadow: 0 3px 8px #18203014, inset 0 1px .7px #fffffff0, inset 0 -1px .7px #18203042 !important; }
      ${COMPOSER_ACTION_DARK}:hover:not(:disabled) { outline-color: #ffffff66; box-shadow: 0 3px 8px #0003, inset 0 1px .7px #ffffffa6, inset 0 -1px .7px #0009 !important; }
      ${COMPOSER_ACTION_SURFACE}:active:not(:disabled) { box-shadow: 0 1px 3px #18203012, inset 0 2px 3px #18203028, inset 0 -1px .7px #ffffff9c !important; }
      ${COMPOSER_ACTION_DARK}:active:not(:disabled) { box-shadow: 0 1px 3px #0002, inset 0 2px 3px #0007, inset 0 -1px .7px #ffffff52 !important; }
      ${COMPOSER_ACTION_SURFACE}[aria-pressed="true"] { color: var(--dsw-alias-state-business-primary, #777aff) !important; }
      [data-dcb-lens-stage] { position: fixed; width: 1px; height: 1px; pointer-events: none; opacity: 0; overflow: hidden; contain: strict; }
      [data-dcb-lens-stage] > canvas { display: block; width: 100%; height: 100%; }
      ${COMPOSER_ACTION_SURFACE} > [data-dcb-lens-canvas] {
        display: none; position: absolute; inset: 0; width: 100%; height: 100%; border-radius: inherit;
        pointer-events: none; z-index: -1;
        mask-image: radial-gradient(ellipse, transparent 62%, #0005 88%, #000a 100%);
        -webkit-mask-image: radial-gradient(ellipse, transparent 62%, #0005 88%, #000a 100%);
      }
      ${COMPOSER_ACTION_SURFACE}[data-dcb-lens-ready] > [data-dcb-lens-canvas] { display: block; }
      ${COMPOSER_ACTION_SURFACE}:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #777aff); outline-offset: 2px; }
      body [${MODEL_MENU_MARK}]:is([role="menu"], [role="group"], .dcs-model-menu) {
        --dcb-backdrop-blur: 12px;
        color: var(--dsw-alias-label-primary, #20242a);
        outline: 1px solid var(--dcb-surface-border); outline-offset: -1px;
      }
      [${MODEL_MENU_MARK}].dcs-model-menu { animation: dcb-model-menu-in ${MOTION.time.control}ms ${MOTION.ease.smooth}; }
      @keyframes dcb-model-menu-in { from { opacity: 0; transform: translateY(8px) scale(.96); filter: blur(2px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
      @media(prefers-reduced-motion:reduce), (forced-colors:active) { [${MODEL_MENU_MARK}].dcs-model-menu { animation: none; } }
      [data-dcb-sidebar-column] { background: transparent !important; border-color: transparent !important; }
      [data-dcb-sidebar-frame-motion="true"] { transition: grid-template-columns ${MOTION.time.sidebar}ms ${MOTION.ease.smooth} !important; }
      [data-dcb-sidebar-frame-motion] > :is([class$="_sidebarCol"], [class*="_sidebarCol "]) { position: relative; }
      [data-dcb-sidebar-frame-motion="false"], [data-dcb-sidebar-frame-motion][data-dragging], [data-dcb-sidebar-frame-motion][data-dcb-sidebar-resizing], [data-dcb-sidebar-frame-motion][data-rightbar-instant], [data-dcb-sidebar-frame-motion][data-rightbar-fullscreen] { transition: none !important; }
      [data-dcb-sidebar-ghost], [data-dcb-sidebar-ghost] * { pointer-events: none !important; animation: none !important; transition: none !important; }
      body [data-dcb-sidebar-ghost]::before { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
      /* A backdrop filter on the root traps the host's fixed titlebar buttons
         in the sidebar's containing block; Windows collapses that column to 0.
         Paint the glass behind the content so those buttons stay viewport-fixed. */
      body [${SIDEBAR_MARK}] { position: relative; isolation: isolate; box-sizing: border-box; width: calc(var(--dcb-sidebar-expanded-width, 100%) - 12px) !important; height: calc(100% - 12px); margin: 6px; border-radius: 20px; outline: 1px solid var(--dcb-surface-border); outline-offset: -1px; }
      body [${SIDEBAR_MARK}][${SIDEBAR_MARK}] { background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
      body [${SIDEBAR_MARK}]::before { content: ''; position: absolute; inset: 0; z-index: -2; pointer-events: none; border-radius: inherit; background-color: var(--dcb-surface-background); background-image: var(--dcb-surface-image); backdrop-filter: var(--dcb-surface-backdrop); -webkit-backdrop-filter: var(--dcb-surface-backdrop); transition: background-color ${MOTION.time.material}ms ${MOTION.ease.color}; }
      body [${SIDEBAR_MARK}][data-dcb-sidebar-moving]::before { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
      [data-dcb-sidebar-toggle="true"] { transition: transform ${MOTION.time.quick}ms ${MOTION.ease.snappy}, background-color ${MOTION.time.quick}ms ${MOTION.ease.color}, box-shadow ${MOTION.time.quick}ms ${MOTION.ease.color}; }
      [data-dcb-sidebar-toggle="true"]:hover { box-shadow: 0 0 0 3px #8881; }
      [data-dcb-sidebar-toggle="true"]:active { transform: scale(.96); }
      /* Keep the native panel icon discoverable after collapse, including hosts
         that replace it with a brand mark until the pointer hovers the button. */
      [data-dcb-sidebar-toggle][data-dcb-sidebar-toggle-state="collapsed"] :is([class$="_panelIcon"], [class*="_panelIcon "]) { display: inline !important; }
      [data-dcb-sidebar-toggle][data-dcb-sidebar-toggle-state="collapsed"] :is([class$="_railMark"], [class*="_railMark "]) { display: none !important; }
      [data-dcb-sidebar-toggle="true"][data-dcb-sidebar-toggle-state="collapsed"] :is(svg, [class$="_panelIcon"], [class*="_panelIcon "]) { transform: scaleX(-1); }
      body[data-ds-dark-theme] [${SIDEBAR_MARK}="clear"][${SIDEBAR_MARK}] { --dcb-surface-background: rgba(24,28,36,.55); }
      body[data-ds-dark-theme] [${SIDEBAR_MARK}="glass"][${SIDEBAR_MARK}] { --dcb-surface-background: rgba(24,28,36,.62); }
      [data-sidebar-collapsed="true"] [${SIDEBAR_MARK}] { width: calc(100% - 8px) !important; height: calc(100% - 8px); margin: 4px; border-radius: 16px; padding-inline: 6px; }
      [${SIDEBAR_MARK}] :is([role="treeitem"], [class$="_panelRow"], [class*="_panelRow "], [class$="_newSession"], [class*="_newSession "]) { border-radius: 12px; }
      [${SIDEBAR_MARK}] :is([role="treeitem"], [class$="_panelRow"], [class*="_panelRow "]):hover { background-color: color-mix(in srgb, var(--dsw-alias-label-primary, #20242a) 5%, transparent); }
      [${SIDEBAR_MARK}] [aria-selected="true"] { background: transparent !important; }
      .dcb-sidebar-indicator { position: absolute; top: 0; left: 0; pointer-events: none; z-index: -1; border-radius: 12px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #20242a) 7%, transparent); box-shadow: inset 0 1px 0 #ffffff70, 0 2px 7px #18203008; outline: 1px solid #ffffff42; outline-offset: -1px; }
      [data-dcb-sidebar-motion="true"] .dcb-sidebar-indicator[data-ready="true"] { transition: transform ${MOTION.time.control}ms ${MOTION.ease.snappy}, width ${MOTION.time.control}ms ${MOTION.ease.snappy}, height ${MOTION.time.control}ms ${MOTION.ease.snappy}; }
      [data-dcb-sidebar-motion="true"] :is([role="treeitem"], [class$="_panelRow"], [class*="_panelRow "]) { transition: background-color ${MOTION.time.quick}ms ${MOTION.ease.color}, border-radius ${MOTION.time.control}ms ${MOTION.ease.color}; }
      .dcb-sidebar-style-track { position: relative; isolation: isolate; display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); padding: 4px; border-radius: 13px; background: var(--dsh-settings-subtle); border: 1px solid rgba(127,127,127,.26); }
      .dcb-sidebar-style-indicator { position: absolute; z-index: -1; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 8px) / 4); border-radius: 9px; background: var(--dsh-settings-surface); box-shadow: 0 1px 3px rgba(0,0,0,.12); transition: transform ${MOTION.time.control}ms ${MOTION.ease.snappy}; }
      .dcb-sidebar-style-track button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; min-width: 0; min-height: 48px; padding: 10px 3px; border: 0; border-radius: 9px; background: transparent; color: var(--dsh-settings-secondary); font-size: 12px; cursor: pointer; transition: color ${MOTION.time.control}ms ${MOTION.ease.color}; }
      .dcb-sidebar-style-track button[aria-checked="true"] { color: var(--dsh-settings-text); font-weight: 600; }
      .dcb-sidebar-style-track button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #777aff); outline-offset: -2px; }
      @media(prefers-reduced-motion:reduce), (forced-colors:active) { [data-dcb-sidebar-frame-motion] { transition: none !important; } [data-dcb-sidebar-toggle] { transform: none !important; transition: none !important; } }
      @media(prefers-reduced-motion:reduce) { [${SIDEBAR_MARK}], [${SIDEBAR_MARK}]::before, [${SIDEBAR_MARK}] *, .dcb-sidebar-style-track * { transition: none !important; animation: none !important; } }
      @media(forced-colors:active) { [data-dcb-sidebar-column], body [${SIDEBAR_MARK}] { background: Canvas !important; outline-color: CanvasText !important; } body [${SIDEBAR_MARK}]::before { content: none; backdrop-filter: none; -webkit-backdrop-filter: none; } .dcb-sidebar-indicator, .dcb-sidebar-style-indicator { background: Highlight; outline: 1px solid Highlight; box-shadow: none; } .dcb-sidebar-style-track button[aria-checked="true"] { color: HighlightText; } }
      /* Glass needs its own foreground palette; the default material keeps its original colors. */
      body ${GLASS_PANEL} {
        --dcb-ink-primary: #20242a; --dcb-ink-body: #414852; --dcb-ink-muted: #59616d; --dcb-ink-active: #16191d;
        --dcb-ink-failure: #a3443d; --dcb-content-separator: rgba(30,42,58,.16); --dcb-timeline-line: #aab2bd;
        --dcb-content-hover: rgba(0,0,0,.045); --dcb-content-tile: rgba(30,42,58,.07);
        --dcb-ink-sheen-base: #16191d; --dcb-shimmer-shoulder: #b4bcc7; --dcb-shimmer-peak: #fff; --dcb-tool-sheen: #778494;
        color: var(--dcb-ink-primary);
      }
      body[data-ds-dark-theme] ${GLASS_PANEL} {
        --dcb-ink-primary: #f4f6f8; --dcb-ink-body: #dce2e9; --dcb-ink-muted: #c8d0da; --dcb-ink-active: #fff;
        --dcb-ink-failure: #ffc1ba; --dcb-content-separator: rgba(225,233,242,.22); --dcb-timeline-line: #818b98;
        --dcb-content-hover: rgba(255,255,255,.08); --dcb-content-tile: rgba(225,233,242,.1);
        --dcb-ink-sheen-base: #dce2e9; --dcb-shimmer-shoulder: #edf1f5; --dcb-tool-sheen: #fff;
      }
      body ${GLASS_PANEL} section + section { border-color: var(--dcb-content-separator); }
      body ${GLASS_PANEL} :is(.dcb-step, .dcb-output, .dcb-resource, .dcb-resource-summary) { color: var(--dcb-ink-body); }
      body ${GLASS_PANEL} :is(.dcb-step[data-status="completed"], .dcb-step[data-status="pending"], .dcb-history, .dcb-follow,
        .dcb-resource-detail, .dcb-file-type, .dcb-tool-count, .dcb-tool-category, .dcb-tool-chevron, .dcb-note, .dcb-context-empty) { color: var(--dcb-ink-muted); }
      body ${GLASS_PANEL} .dcb-history .dcb-status { color: var(--dcb-timeline-line); }
      body ${GLASS_PANEL} :is(.dcb-step[data-status="in_progress"], .dcb-resource-summary[data-working="true"], .dcb-tool-row[data-working="true"]) {
        color: var(--dcb-ink-active); --dcb-shimmer-base: var(--dcb-ink-sheen-base);
      }
      body ${GLASS_PANEL} .dcb-follow:hover { color: var(--dcb-ink-active); }
      body ${GLASS_PANEL} .dcb-tool-failed { color: var(--dcb-ink-failure); }
      body ${GLASS_PANEL} .dcb-tile { background: var(--dcb-content-tile); color: var(--dcb-ink-body); }
      body ${GLASS_PANEL} .dcb-tile[data-kind="image"]:not(:has(img)) { color: var(--dcb-ink-muted); }
      body ${GLASS_PANEL} :is(.dcb-step, .dcb-history, .dcb-follow, .dcb-output, .dcb-resource, .dcb-resource-summary,
        .dcb-resource-detail, .dcb-file-type, .dcb-tool-count, .dcb-tool-category, .dcb-note, .dcb-context-empty) {
        transition: color ${MOTION.time.quick}ms ${MOTION.ease.color}, background-color ${MOTION.time.quick}ms ${MOTION.ease.color};
      }
      body ${GLASS_PANEL} :focus-visible { outline-color: var(--dcb-ink-muted); }
      body [${MARK}]:is([data-card-style="clear"], [data-card-style="css"], [data-card-style="glass"]) button > span { color: var(--dcb-ink-body) !important; }
      body [${MARK}]:is([data-card-style="clear"], [data-card-style="css"], [data-card-style="glass"]) button > span:first-child { color: var(--dcb-ink-body) !important; }
      body [${MARK}]:is([data-card-style="clear"], [data-card-style="css"], [data-card-style="glass"]) button > :is(span:nth-child(3), span:last-child) { color: var(--dcb-ink-muted) !important; }
      body [${MARK}]:is([data-card-style="clear"], [data-card-style="css"], [data-card-style="glass"]) li { color: var(--dcb-ink-muted); }
      body [${MARK}]:is([data-card-style="clear"], [data-card-style="css"], [data-card-style="glass"]) li[data-status="in_progress"] { color: var(--dcb-ink-active); font-weight: 700; }
      body [${MARK}]:is([data-card-style="clear"], [data-card-style="css"], [data-card-style="glass"]) li > span:last-child { color: inherit !important; }
      body .dcb-style-swatch[data-card-style] { transition: background-color ${MOTION.time.material}ms ${MOTION.ease.color}, border-color ${MOTION.time.material}ms ${MOTION.ease.color}, box-shadow ${MOTION.time.material}ms ${MOTION.ease.color}, --dcb-backdrop-blur ${MOTION.time.material}ms ${MOTION.ease.color}, --dcb-backdrop-saturation ${MOTION.time.material}ms ${MOTION.ease.color}, --dcb-refraction-scale ${MOTION.time.material}ms ${MOTION.ease.color}, --dcb-sheen-opacity ${MOTION.time.material}ms ${MOTION.ease.color}, --dcb-glint-x ${MOTION.time.quick}ms ${MOTION.ease.smooth}, --dcb-glint-y ${MOTION.time.quick}ms ${MOTION.ease.smooth}, --dcb-glint-strength ${MOTION.time.material}ms ${MOTION.ease.color}, --dcb-interaction-depth ${MOTION.time.material}ms ${MOTION.ease.color}, transform ${MOTION.time.material}ms ${MOTION.ease.smooth}; }
      .dcb-summary :is(.dcb-resource-summary, .dcb-output, .dcb-close) { transition: background-color ${MOTION.time.quick}ms ${MOTION.ease.color}; }
      body ${GLASS_PANEL} :is(.dcb-resource-summary, .dcb-output, .dcb-close):hover { background: var(--dcb-content-hover); }
      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        body ${material('css')} { --dcb-surface-background: rgba(255,255,255,.96); }
        body[data-ds-dark-theme] ${material('css')} { --dcb-surface-background: rgba(24,28,36,.96); }
        body ${material('glass')} { --dcb-surface-background: rgba(236,242,248,.96); }
        body[data-ds-dark-theme] ${material('glass')} { --dcb-surface-background: rgba(65,72,81,.96); }
      }
      @media (prefers-reduced-motion: reduce), (forced-colors: active) {
        ${COMPOSER_GLASS} { transition: none; }
        body ${MATERIAL_BASE}, .dcb-settings .dcb-style-option, .dcb-summary :is(.dcb-resource-summary, .dcb-output, .dcb-close) { transition: none; }
        body ${GLASS_PANEL} :is(.dcb-step, .dcb-history, .dcb-follow, .dcb-output, .dcb-resource, .dcb-resource-summary,
          .dcb-resource-detail, .dcb-file-type, .dcb-tool-count, .dcb-tool-category, .dcb-note, .dcb-context-empty) { transition: none; }
      }
      @media (forced-colors: active) {
        [data-dcb-lens-stage], [data-dcb-lens-canvas] { display: none !important; }
        ${COMPOSER_GLASS} { background: Canvas !important; color: CanvasText !important; box-shadow: none !important; outline-color: CanvasText; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
        ${CHAT_UNDER_COMPOSER} { background: Canvas !important; }
        ${COMPOSER_ACTION_SURFACE} { background: ButtonFace !important; color: ButtonText !important; outline-color: ButtonText; }
        ${COMPOSER_ACTION_SURFACE}, ${COMPOSER_ACTION_SURFACE} svg { text-shadow: none; filter: none; }
        ${COMPOSER_ACTION_SURFACE}:focus-visible { outline-color: Highlight; }
        body ${MATERIAL_BASE} { background: Canvas !important; border-color: CanvasText !important; box-shadow: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
        body ${GLASS_PANEL}, body[data-ds-dark-theme] ${GLASS_PANEL} {
          --dcb-ink-primary: CanvasText; --dcb-ink-body: CanvasText; --dcb-ink-muted: CanvasText; --dcb-ink-active: CanvasText;
          --dcb-ink-failure: CanvasText; --dcb-timeline-line: GrayText; --dcb-content-separator: GrayText; --dcb-content-hover: ButtonFace; --dcb-content-tile: ButtonFace;
        }
        body ${GLASS_PANEL} :focus-visible { outline-color: Highlight; }
      }
    `

    function messageEntrance(kind) {
      const user = kind === 'user'
      return {
        frames: [
          { opacity: 0, translate: user ? '8px 18px' : '-6px 16px', scale: '.99', offset: 0 },
          { opacity: 1, translate: '0px 0px', scale: '1', offset: 1 },
        ],
        options: { duration: user ? MOTION.time.standard : MOTION.time.scene, easing: MOTION.ease.smooth, id: `dcb-message-${kind}` },
      }
    }

    // Observe native message seats without replacing React-owned content or
    // driving the host scroll controller. Only new, visible tail messages enter.
    function createMessageMotion(document, window, initiallyEnabled = true) {
      // Process groups expose a nested flow too. Its first streaming children
      // are live arrivals, not a newly loaded conversation to seed as history.
      const FLOW = '[data-chat-flow]:not([data-step-process-content])'
      const ASSISTANT = '[data-chat-flow-kind="assistant-step"], [data-chat-flow-kind="assistant"]'
      const ROW = `[data-chat-flow-kind="user"], [data-chat-flow-kind="steering"], ${ASSISTANT}, [data-submission-echo], [data-pending-steering]`
      const preference = window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
      const states = new WeakMap(), pending = new Set(), waiting = new Set(), active = new Map(), echoCredits = new WeakMap(), arriving = new Map()
      let enabled = initiallyEnabled, disposed = false, frame = 0, intent = null, intentTimer = 0
      const now = () => window.performance.now()
      const containerOf = root => root.closest('[data-conversation-content]')
      const sessionOf = root => containerOf(root)?.getAttribute('data-conversation-session') || ''
      const rowsOf = root => [...root.querySelectorAll(ROW)].filter(row => row.parentElement.closest(ROW) === null)
      const echo = row => row.matches('[data-submission-echo], [data-pending-steering]')
      const kindOf = row => row.matches(ASSISTANT) ? 'assistant' : 'user'
      const keyOf = row => row.getAttribute('data-chat-flow-key') || row.getAttribute('data-chat-node-key')
      const turnOf = row => {
        const value = row.getAttribute('data-chat-turn')
        return value !== null && Number.isFinite(Number(value)) ? Number(value) : null
      }
      function remember(state, row) {
        if (echo(row) && !state.nodes.has(row)) {
          const credit = { row, lostAt: null }
          state.credits.push(credit); echoCredits.set(row, credit)
          if (state.credits.length > 16) state.credits.shift()
        }
        state.nodes.add(row)
        const key = keyOf(row)
        if (key) { state.keys.add(key); if (state.keys.size > 4096) state.keys.delete(state.keys.values().next().value) }
        const turn = turnOf(row)
        if (turn !== null) state.turn = Math.max(state.turn, turn)
        if (!state.tail?.isConnected || state.tail.compareDocumentPosition(row) & 4) state.tail = row
      }
      function hasIntent(root) {
        return intent && now() - intent.at < 4000 &&
          (intent.container === containerOf(root) || !intent.session || intent.session === sessionOf(root))
      }
      function stateFor(root) {
        let state = states.get(root)
        if (!state || state.session !== sessionOf(root)) {
          state = { session: sessionOf(root), nodes: new WeakSet(), keys: new Set(), turn: -Infinity, tail: null, ready: false, credits: [] }
          states.set(root, state)
        }
        return state
      }
      function seed(root, allowIntent = false) {
        const state = stateFor(root), rows = rowsOf(root)
        const latest = rows.reduce((value, row) => Math.max(value, turnOf(row) ?? -Infinity), -Infinity)
        const fresh = allowIntent && hasIntent(root)
        state.ready = rows.length > 0
        for (const row of rows) {
          if (fresh && (echo(row) || turnOf(row) === latest)) pending.add(row)
          else remember(state, row)
        }
        if (pending.size) schedule()
      }
      function visible(row, root) {
        if (document.hidden || row.closest('[hidden], [inert], [data-turn-process-hidden="true"]')) return false
        const scroller = root.closest('[data-conversation-scroll]') || root.parentElement
        const bounds = row.getBoundingClientRect(), viewport = scroller.getBoundingClientRect()
        return bounds.width > 0 && bounds.height > 0 && bounds.bottom > Math.max(0, viewport.top) &&
          bounds.top < Math.min(window.innerHeight, viewport.bottom) && window.getComputedStyle(row).visibility !== 'hidden'
      }
      function cancel(record) {
        record.animation.cancel()
        active.delete(record.target)
      }
      function cancelAll() { for (const record of [...active.values()]) cancel(record) }
      // The host can scroll to a just-appended row on the next frame. Wait for
      // that visibility briefly, without scrolling or polling every frame.
      const exposure = typeof window.IntersectionObserver === 'function' ? new window.IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting && arriving.has(entry.target)) pending.add(entry.target)
        if (pending.size) schedule()
      }) : null
      function releaseArrival(row) {
        const arrival = arriving.get(row)
        if (!arrival) return
        window.clearTimeout(arrival.timer); exposure?.unobserve(row); arriving.delete(row)
      }
      function waitForHostScroll(row, root) {
        if (!exposure || !row.getClientRects().length || row.closest('[hidden], [inert], [data-turn-process-hidden="true"]')) { remember(stateFor(root), row); return }
        if (arriving.has(row)) return
        const session = sessionOf(root)
        const timer = window.setTimeout(() => {
          releaseArrival(row)
          if (row.isConnected && sessionOf(root) === session) remember(stateFor(root), row)
        }, 600)
        arriving.set(row, { timer }); exposure.observe(row)
      }
      function enter(row, root, kind) {
        let target = row.querySelector(':scope > [data-slot="conversation.chat.node"]') || row.firstElementChild || row
        // Factory slot wrappers may be display:contents and cannot be painted.
        while (target !== row && window.getComputedStyle(target).display === 'contents') target = target.firstElementChild || row
        if (typeof target.animate !== 'function') return
        const effect = messageEntrance(kind)
        const animation = target.animate(effect.frames, effect.options)
        const record = { target, root, animation, session: sessionOf(root) }
        active.set(target, record)
        const finish = () => { if (active.get(target) === record) cancel(record) }
        animation.finished.then(finish, finish)
      }
      function flush() {
        frame = 0
        if (disposed) return
        for (const record of [...active.values()]) if (!record.target.isConnected || record.session !== sessionOf(record.root)) cancel(record)
        for (const row of waiting) if (!row.isConnected) waiting.delete(row)
        for (const row of arriving.keys()) if (!row.isConnected) releaseArrival(row)
        const batch = [...pending]; pending.clear()
        const roots = new Set(batch.map(row => row.closest(FLOW)).filter(Boolean))
        for (const root of roots) {
          const state = stateFor(root)
          if (!state.ready) {
            const rows = rowsOf(root)
            state.ready = rows.length > 0
            if (!hasIntent(root)) { for (const row of rows) remember(state, row) }
          }
        }
        for (const row of batch) {
          const root = row.closest(FLOW)
          if (!root || !row.isConnected) continue
          const state = stateFor(root), key = keyOf(row), kind = kindOf(row), turn = turnOf(row)
          if (state.nodes.has(row) || key && state.keys.has(key)) { remember(state, row); waiting.delete(row); releaseArrival(row); continue }
          const historical = turn !== null && turn < state.turn || state.tail?.isConnected && Boolean(row.compareDocumentPosition(state.tail) & 4)
          const following = root.closest('[data-chat-following-tail]') !== null || hasIntent(root)
          if (historical || !following || !enabled || preference.matches) {
            remember(state, row); waiting.delete(row); releaseArrival(row); continue
          }
          // Empty streaming seats wait for the first actual text/image. Later
          // token updates never rescan or animate an already admitted message.
          if (!row.textContent.trim() && !row.querySelector('img, video, canvas, pre')) { waiting.add(row); continue }
          waiting.delete(row)
          if (!visible(row, root)) { waitForHostScroll(row, root); continue }
          releaseArrival(row)
          state.credits = state.credits.filter(credit => credit.row.isConnected || credit.lostAt !== null && now() - credit.lostAt < 1500)
          const replacement = kind === 'user' && !echo(row) && state.credits.findIndex(credit => !credit.row.isConnected)
          if (replacement !== false && replacement >= 0) state.credits.splice(replacement, 1)
          else enter(row, root, kind)
          remember(state, row)
        }
      }
      function schedule() { if (!frame && !disposed) frame = window.requestAnimationFrame(flush) }
      function collect(element) {
        if (element.nodeType !== 1) return
        if (element.matches(FLOW) && !states.has(element)) seed(element, true)
        for (const root of element.querySelectorAll(FLOW)) if (!states.has(root)) seed(root, true)
        const root = element.closest(FLOW)
        if (root) {
          const row = element.closest(ROW)
          if (row && (waiting.has(row) || !stateFor(root).nodes.has(row))) pending.add(row)
          for (const child of element.querySelectorAll(ROW)) if (child.parentElement.closest(ROW) === null && !stateFor(root).nodes.has(child)) pending.add(child)
        }
      }
      const observer = new window.MutationObserver(records => {
        let detached = false
        for (const record of records) {
          if (record.type === 'attributes') {
            for (const root of record.target.querySelectorAll(FLOW)) seed(root, true)
            if (active.size) schedule()
          } else if (record.type === 'characterData') {
            const row = record.target.parentElement?.closest(ROW)
            if (waiting.has(row)) pending.add(row)
          } else {
            if (record.removedNodes.length) detached = true
            for (const node of record.removedNodes) if (node.nodeType === 1) {
              const echoes = node.matches('[data-submission-echo], [data-pending-steering]') ? [node] : node.querySelectorAll('[data-submission-echo], [data-pending-steering]')
              for (const element of echoes) {
                const credit = echoCredits.get(element)
                if (credit) credit.lostAt = now()
              }
            }
            // A streaming text replacement only matters while its seat is empty.
            const row = record.target.closest?.(ROW)
            if (waiting.has(row)) pending.add(row)
            for (const node of record.addedNodes) collect(node)
          }
        }
        if (pending.size || detached && (active.size || waiting.size || arriving.size)) schedule()
      })
      function sendIntent(event) {
        const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement
        const seat = target?.closest('[data-composer-seat]')
        if (!seat || event.defaultPrevented) return
        if (event.type === 'keydown') {
          if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229 || event.repeat ||
              !target.closest('[data-composer-input], textarea, [contenteditable="true"]')) return
        } else {
          const button = target.closest('button')
          if (!button || button.disabled || ![...button.classList].some(name => /_primary$/.test(name))) return
        }
        const container = seat.closest('[data-conversation-content]')
        intent = { at: now(), container, session: container?.getAttribute('data-conversation-session') || '' }
        window.clearTimeout(intentTimer)
        intentTimer = window.setTimeout(() => { intent = null; intentTimer = 0 }, 4000)
      }
      for (const root of document.querySelectorAll(FLOW)) seed(root)
      observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-conversation-session'] })
      document.addEventListener('keydown', sendIntent, true)
      document.addEventListener('click', sendIntent, true)
      const changed = () => {
        if (!preference.matches) return
        cancelAll()
        for (const row of arriving.keys()) {
          const root = row.closest(FLOW)
          if (root) remember(stateFor(root), row)
          releaseArrival(row)
        }
      }
      preference.addEventListener('change', changed)
      return {
        setEnabled(value) {
          if (enabled === value) return
          enabled = value; cancelAll(); waiting.clear(); pending.clear()
          for (const row of arriving.keys()) releaseArrival(row)
          for (const root of document.querySelectorAll(FLOW)) seed(root)
        },
        dispose() {
          disposed = true; observer.disconnect(); cancelAll(); waiting.clear(); pending.clear(); intent = null
          for (const row of arriving.keys()) releaseArrival(row)
          exposure?.disconnect()
          if (frame) window.cancelAnimationFrame(frame)
          window.clearTimeout(intentTimer)
          preference.removeEventListener('change', changed)
          document.removeEventListener('keydown', sendIntent, true)
          document.removeEventListener('click', sendIntent, true)
        },
      }
    }

    function apply(ctx) {
      let settings = readSettings()
      let frame = 0
      let disposed = false
      const listeners = new Set()
      const stylePreviewListeners = new Set()
      const previewStyle = active => { for (const listener of stylePreviewListeners) listener(active) }
      const originals = new Map()
      const observed = new Set()
      const summaryOwners = new Map()
      const openedBySession = new Map()
      const autoOpenedSessions = new Set()
      // Track real plan changes separately from tool/output activity and hover previews.
      const planRuns = new Map()
      const originalComposerFlag = document.body.getAttribute(COMPOSER_FLAG)
      const originalChatUnderComposerFlag = document.body.getAttribute(CHAT_UNDER_COMPOSER_FLAG)
      const composerOriginals = new Map()
      const composerActionOriginals = new Map()
      const modelMenuOriginals = new Map()
      const style = document.createElement('style')
      style.dataset.plugin = NAME
      style.textContent = css + DcbLens.themeToggleCss + DcbLens.focusModeCss + DcbLens.composerSlotsCss + DcbLens.conversationTabsCss + DcbLens.turnCardsCss + DcbLens.scopeSwitchCss + DcbLens.outputPreviewCss + DcbLens.outputViewerCss + DcbLens.welcomeSettingsCss + DcbLens.settingsTabsCss + DcbLens.contextParticlesCss + DcbLens.particleSettingsCss
      document.head.appendChild(style)
      const liquid = createLiquidGlassManager(document, window)
      const lensActions = DcbLens.createLensActions(document, window)
      const sidebarGlass = DcbLens.createSidebarGlass(document, window, schedule)
      const composerSlots = DcbLens.createComposerSlots(document, window, schedule)
      const conversationTabs = DcbLens.createConversationTabs(document, window, schedule)
      const messageMotion = createMessageMotion(document, window, settings.messageMotion)
      const turnCards = DcbLens.createTurnCards(document, window, { enabled: settings.turnGlass, style: settings.sidebarStyle })
      const themeToggle = DcbLens.createThemeToggle(React, document, window)
      const focusMode = DcbLens.createFocusMode(React, document, window, schedule)
      const contextParticles = DcbLens.createContextParticles(document, window, { logoPath: FISH_LOGO_PATH, logoBox: FISH_LOGO_VIEWBOX })
      const ParticleSettings = DcbLens.createParticleSettings(React, document, window, { particles: contextParticles, FishLogo })
      const ScopeSwitch = DcbLens.createScopeSwitch(React, document, window)
      const outputViewer = DcbLens.createOutputViewer(React, document, window, { createPortal, MarkdownText, CodeBlock })
      const outputPreview = DcbLens.createOutputPreviewBridge(document, window, outputViewer)
      const OutputArtifact = DcbLens.createOutputArtifact(React, window)
      const welcomeMediaStore = DcbLens.createWelcomeMediaStore(window)
      const WelcomeSettings = DcbLens.createWelcomeSettings(React, document, window, { mediaStore: welcomeMediaStore, FishLogo })
      const SettingsTabs = DcbLens.createSettingsTabs(React, document, window)
      const createWelcomeLogo = () => {
        if (typeof FISH_LOGO_PATH !== 'string' || !FISH_LOGO_VIEWBOX?.width || !FISH_LOGO_VIEWBOX?.height) return null
        const node = document.createElement('div'), svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        svg.setAttribute('viewBox', `0 0 ${FISH_LOGO_VIEWBOX.width} ${FISH_LOGO_VIEWBOX.height}`)
        svg.setAttribute('aria-hidden', 'true'); path.setAttribute('d', FISH_LOGO_PATH); path.setAttribute('fill', 'currentColor')
        svg.append(path); node.append(svg)
        return { node }
      }
      if (typeof ctx.inject === 'function') ctx.inject(['theme'], scope => {
        if (!scope.theme) return
        themeToggle.connect(scope.theme)
        scope.on?.('theme/change', themeToggle.sync)
        scope.effect(() => () => themeToggle.connect(null), `${NAME}: theme binding`)
      })

      function restore(panel) {
        panel.removeAttribute('data-dcb-native-hidden')
        const saved = originals.get(panel)
        if (!saved) return
        for (const [key, value, priority] of saved.variables) {
          if (value) panel.style.setProperty(key, value, priority)
          else panel.style.removeProperty(key)
        }
        panel.removeAttribute(MARK)
        if (saved.cardStyle === null) panel.removeAttribute('data-card-style')
        else panel.setAttribute('data-card-style', saved.cardStyle)
        originals.delete(panel)
      }

      const resize = new ResizeObserver(() => schedule())
      function restoreComposer(element) {
        if (!composerOriginals.has(element)) return
        const previous = composerOriginals.get(element)
        if (previous === null) element.removeAttribute(COMPOSER_MARK)
        else element.setAttribute(COMPOSER_MARK, previous)
        composerOriginals.delete(element)
      }
      function restoreComposerAction(element) {
        for (const [name, value] of composerActionOriginals.get(element) || []) {
          if (value === null) element.removeAttribute(name)
          else element.setAttribute(name, value)
        }
        composerActionOriginals.delete(element)
      }
      function restoreModelMenu(element) {
        const previous = modelMenuOriginals.get(element)
        if (previous === null) element.removeAttribute(MODEL_MENU_MARK)
        else element.setAttribute(MODEL_MENU_MARK, previous)
        modelMenuOriginals.delete(element)
      }
      function sync() {
        frame = 0
        if (disposed) return
        const composerEnabled = settings.composerStyle !== 'milk'
        document.body.toggleAttribute(COMPOSER_FLAG, composerEnabled)
        document.body.toggleAttribute(CHAT_UNDER_COMPOSER_FLAG, settings.chatUnderComposer)
        composerSlots.sync()
        conversationTabs.sync()
        outputPreview.sync()
        contextParticles.sync(settings)
        const allComposers = composerEnabled || settings.composerButtonGlass ? [...document.querySelectorAll(COMPOSER_CARD)] : []
        const composers = new Set(composerEnabled ? allComposers : [])
        for (const element of composerOriginals.keys()) if (!composers.has(element)) restoreComposer(element)
        for (const element of composers) {
          if (!composerOriginals.has(element)) composerOriginals.set(element, element.getAttribute(COMPOSER_MARK))
          if (element.getAttribute(COMPOSER_MARK) !== settings.composerStyle) element.setAttribute(COMPOSER_MARK, settings.composerStyle)
        }
        const actions = new Map()
        if (settings.composerButtonGlass) for (const composer of allComposers) for (const button of composer.querySelectorAll('button')) {
          const kind = composerActionKind(button)
          if (kind) actions.set(button, kind)
        }
        for (const element of composerActionOriginals.keys()) if (!actions.has(element)) restoreComposerAction(element)
        for (const [element, kind] of actions) {
          if (!composerActionOriginals.has(element)) composerActionOriginals.set(element, [COMPOSER_ACTION_MARK, COMPOSER_ACTION_KIND].map(name => [name, element.getAttribute(name)]))
          if (element.getAttribute(COMPOSER_ACTION_MARK) !== 'lens') element.setAttribute(COMPOSER_ACTION_MARK, 'lens')
          if (element.getAttribute(COMPOSER_ACTION_KIND) !== kind) element.setAttribute(COMPOSER_ACTION_KIND, kind)
        }
        // Native menus use an ARIA link. Claude Slider keeps its menu beside
        // the trigger without that link; bind it only within the same root.
        const modelMenus = new Set()
        for (const [button, kind] of actions) if (kind === 'model') {
          if (button.matches('.dcs-model-trigger')) {
            const root = button.closest('.dcs-root')
            for (const menu of root?.querySelectorAll('.dcs-model-menu') || []) if (menu.closest('.dcs-root') === root) modelMenus.add(menu)
          } else if (button.getAttribute('aria-expanded') === 'true') {
            const menu = document.getElementById(button.getAttribute('aria-controls'))
            if (menu && ['menu', 'group'].includes(menu.getAttribute('role'))) modelMenus.add(menu)
          }
        }
        for (const element of modelMenuOriginals.keys()) if (!modelMenus.has(element)) restoreModelMenu(element)
        for (const menu of modelMenus) {
          if (!modelMenuOriginals.has(menu)) modelMenuOriginals.set(menu, menu.getAttribute(MODEL_MENU_MARK))
          if (menu.getAttribute(MODEL_MENU_MARK) !== 'css') menu.setAttribute(MODEL_MENU_MARK, 'css')
        }
        const panels = settings.enabled ? [...document.querySelectorAll(PANEL)] : []
        for (const panel of document.querySelectorAll('[data-dcb-native-hidden]')) {
          if (!settings.enabled || !summaryOwners.has(panel.closest('[data-conversation-content]')?.dataset.conversationSession)) panel.removeAttribute('data-dcb-native-hidden')
        }
        const containers = new Set()
        for (const panel of [...originals.keys()]) if (!panels.includes(panel)) restore(panel)
        for (const panel of panels) {
          const container = panel.closest('[data-conversation-content]')
          if (!container || container.getClientRects().length === 0 ||
              window.getComputedStyle(container).visibility === 'hidden') {
            restore(panel)
            continue
          }
          containers.add(container)
          if (summaryOwners.has(container.dataset.conversationSession)) {
            restore(panel)
            panel.setAttribute('data-dcb-native-hidden', '')
            continue
          }
          const composer = panel.closest('[data-composer-seat]')
          const position = placement(container.getBoundingClientRect(), {
            width: window.innerWidth, height: window.innerHeight,
          }, settings.width, composer?.getBoundingClientRect().top)
          if (!position) { restore(panel); continue }
          if (!originals.has(panel)) {
            originals.set(panel, { variables: VARIABLES.map(key => [key, panel.style.getPropertyValue(key), panel.style.getPropertyPriority(key)]), cardStyle: panel.getAttribute('data-card-style') })
          }
          const values = [position.left, position.top, position.width, position.listHeight]
          VARIABLES.forEach((key, index) => {
            const next = `${values[index]}px`
            if (panel.style.getPropertyValue(key) !== next) panel.style.setProperty(key, next)
          })
          if (!panel.hasAttribute(MARK)) panel.setAttribute(MARK, '')
          if (panel.dataset.cardStyle !== settings.cardStyle) panel.dataset.cardStyle = settings.cardStyle
        }
        for (const container of observed) if (!containers.has(container)) { resize.unobserve(container); observed.delete(container) }
        for (const container of containers) if (!observed.has(container)) { resize.observe(container); observed.add(container) }
        const sidebars = sidebarGlass.sync(settings.sidebarStyle, settings.sidebarMotion)
        liquid.sync([...document.querySelectorAll(`.dcb-summary[data-card-style], [${MARK}][data-card-style], .dcb-style-swatch[data-card-style], [${COMPOSER_MARK}]`), ...sidebars])
        lensActions.sync(actions.keys())
      }
      function schedule() { if (!frame && !disposed) frame = window.requestAnimationFrame(sync) }
      function update(patch, persist = true) {
        settings = normalize({ ...settings, ...patch })
        messageMotion.setEnabled(settings.messageMotion)
        turnCards.setOptions({ enabled: settings.turnGlass, style: settings.sidebarStyle })
        startupMotion.setEnabled(settings.welcomeEnabled)
        if (persist) {
          try { window.localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* private browsing */ }
        }
        schedule()
        for (const listener of listeners) listener()
      }
      const onStorage = event => { if (event.key === KEY || event.key === null) update(readSettings(), false) }
      const observer = new MutationObserver(records => { if (DcbLens.affectsPresentation(records)) schedule() })
      observer.observe(document.body, { childList: true, subtree: true, attributes: true,
        attributeFilter: ['data-conversation-session', 'data-content-phase', 'data-sidebar-collapsed', 'data-card-style', 'data-composer-card', 'aria-label', 'aria-selected', 'aria-current', 'aria-pressed', 'aria-expanded', 'aria-controls', 'disabled', 'data-ds-dark-theme', 'hidden', 'class'] })
      window.addEventListener('resize', schedule)
      // Capture scroll also handles embedded conversation columns and moved panes.
      const onScroll = event => { if (DcbLens.affectsScroll(event.target, document)) schedule() }
      document.addEventListener('scroll', onScroll, true)
      window.addEventListener('storage', onStorage)
      sync()
      const startupMotion = DcbLens.createStartupMotion(document, window, settings, { mediaStore: welcomeMediaStore, createLogo: createWelcomeLogo })
      if (typeof ctx.inject === 'function') ctx.inject(['uiWorkspace'], scope => {
        const selection = (scope.get?.('uiWorkspace') || scope.uiWorkspace)?.selection
        if (!selection?.getSnapshot || !selection?.subscribe) return
        const restore = () => { const saved = selection.getSnapshot(); startupMotion.setRestorationTarget(saved?.sessionId || saved?.subagentAddress) }
        restore()
        scope.effect(() => selection.subscribe(restore), `${NAME}: opening selection`)
      })

      function WidthSlider() {
        const [dragging, setDragging] = React.useState(false)
        const setWidth = value => {
          const width = Math.max(280, Math.min(480, Math.round(value / 10) * 10))
          if (settings.width !== width) update({ width })
        }
        const move = event => {
          const box = event.currentTarget.getBoundingClientRect()
          if (box.width) setWidth(280 + Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)) * 200)
        }
        const stop = event => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
          setDragging(false)
        }
        return h('div', { className: 'dcb-width-slider', role: 'slider', tabIndex: 0, 'aria-label': '面板宽度',
          'aria-valuemin': 280, 'aria-valuemax': 480, 'aria-valuenow': settings.width, 'aria-valuetext': `${settings.width} 像素`,
          'data-dragging': dragging, style: { '--dcb-width-percent': `${(settings.width - 280) / 2}%` },
          onPointerDown: event => {
            if (event.button !== 0) return
            event.preventDefault()
            event.currentTarget.focus()
            event.currentTarget.setPointerCapture(event.pointerId)
            setDragging(true)
            move(event)
          },
          onPointerMove: event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event) },
          onPointerUp: stop, onPointerCancel: stop, onLostPointerCapture: () => setDragging(false),
          onKeyDown: event => {
            const value = { Home: 280, End: 480, ArrowRight: settings.width + 10, ArrowUp: settings.width + 10,
              ArrowLeft: settings.width - 10, ArrowDown: settings.width - 10, PageUp: settings.width + 50, PageDown: settings.width - 50 }[event.key]
            if (value === undefined) return
            event.preventDefault()
            setWidth(value)
          } }, h('span', { className: 'dcb-width-track', 'aria-hidden': true }), h('span', { className: 'dcb-width-fill', 'aria-hidden': true }), h('span', { className: 'dcb-width-thumb', 'aria-hidden': true }))
      }

      function StepCountPicker() {
        const [open, setOpen] = React.useState(false)
        const [present, setPresent] = React.useState(false)
        const box = React.useRef(null)
        const menu = React.useRef(null)
        const button = React.useRef(null)
        const focusIndex = React.useRef(null)
        const motion = React.useRef(null)
        const id = React.useId()
        const values = [2, 3]
        const show = index => {
          focusIndex.current = index
          if (open && index !== null) {
            menu.current?.querySelectorAll('[role="option"]')[index]?.focus()
            focusIndex.current = null
          }
          setPresent(true)
          setOpen(true)
        }
        const dismiss = restore => { setOpen(false); if (restore) button.current?.focus() }
        React.useLayoutEffect(() => () => { motion.current?.cancel(); motion.current = null }, [])
        React.useLayoutEffect(() => {
          const node = menu.current
          const previous = motion.current
          const hidden = { opacity: 0, transform: 'translateY(-8px) scale(.94)', filter: 'blur(2px)' }
          const visible = { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' }
          let from = open ? hidden : visible
          if (node && previous?.effect?.target === node) {
            const style = getComputedStyle(node)
            from = { opacity: style.opacity, transform: style.transform, filter: style.filter }
          }
          previous?.cancel()
          motion.current = null
          if (!present || !node) return
          const animation = node.animate([from, open ? visible : hidden], {
            duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : open ? MOTION.time.control : MOTION.time.quick,
            easing: open ? MOTION.ease.smooth : MOTION.ease.exit, fill: 'both',
          })
          motion.current = animation
          if (open && focusIndex.current !== null) {
            node.querySelectorAll('[role="option"]')[focusIndex.current]?.focus()
            focusIndex.current = null
          }
          animation.finished.then(() => {
            if (motion.current !== animation) return
            if (open) { motion.current = null; animation.cancel() }
            else setPresent(false)
          }).catch(() => {})
        }, [open, present])
        React.useEffect(() => {
          if (!open) return
          const away = event => { if (!box.current?.contains(event.target)) dismiss(false) }
          const escape = event => { if (event.key === 'Escape') { event.preventDefault(); dismiss(true) } }
          document.addEventListener('pointerdown', away)
          document.addEventListener('keydown', escape)
          return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', escape) }
        }, [open])
        return h('div', { className: 'dcb-count-picker', ref: box,
          onKeyDown: event => { if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(true) } },
          onBlur: event => { if (!event.currentTarget.contains(event.relatedTarget)) dismiss(false) } },
          h('button', { type: 'button', className: 'dcb-count-button', ref: button, 'aria-label': '默认显示步骤数',
            'aria-haspopup': 'listbox', 'aria-expanded': open, 'aria-controls': present ? id : undefined,
            onClick: () => open ? dismiss(false) : show(null),
            onKeyDown: event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                if (open) dismiss(false)
                else show(values.indexOf(settings.progressView.count))
                return
              }
              if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              show(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : values.indexOf(settings.progressView.count))
            } }, `${settings.progressView.count} 个步骤`, h('span', { className: 'dcb-count-caret', 'aria-hidden': true })),
          present && h('div', { id, className: 'dcb-count-menu', ref: menu, role: 'listbox', 'aria-label': '默认显示步骤数选项', 'aria-hidden': !open, inert: !open, 'data-state': open ? 'open' : 'closing',
            onKeyDown: event => {
              const options = [...event.currentTarget.querySelectorAll('[role="option"]')]
              const index = options.indexOf(document.activeElement)
              const next = { ArrowDown: (index + 1) % 2, ArrowUp: (index + 1) % 2, Home: 0, End: 1 }[event.key]
              if (next === undefined) return
              event.preventDefault()
              options[next]?.focus()
            } }, values.map(value => h('button', { type: 'button', role: 'option', className: 'dcb-count-option', key: value,
              'aria-selected': settings.progressView.count === value, tabIndex: open ? 0 : -1,
              onClick: () => { update({ progressView: { ...settings.progressView, count: value } }); dismiss(true) } }, `${value} 个步骤`, h('span', { 'aria-hidden': true }, settings.progressView.count === value ? '✓' : '')))))
      }

      function StylePicker({ scope, value, onChange }) {
        const composer = scope === 'composer'
        const sidebar = scope === 'sidebar'
        const label = composer ? '输入栏样式' : sidebar ? '侧栏样式' : '卡片样式'
        const costId = React.useId()
        return h('fieldset', { className: 'dcb-style-picker', 'data-dcb-card-style-picker': !composer && !sidebar ? '' : undefined, 'data-dcb-composer-style-picker': composer ? '' : undefined, 'data-dcb-sidebar-style-picker': sidebar ? '' : undefined },
          h('legend', null, label), h('p', null, composer ? '这里只改变输入框材质；附件、语音、发送等小按钮由上方开关独立控制。' : sidebar ? '侧栏与任务卡片、输入栏独立保存。默认恢复 DSH 原样。' : '选择后实时预览当前任务卡片；当前轮次没有内容时保持隐藏。'),
          h('div', { className: 'dcb-style-options', role: 'radiogroup', 'aria-label': label }, MATERIALS.map(([style, name, description], index) =>
            h('button', { type: 'button', role: 'radio', className: 'dcb-style-option', key: style, 'aria-label': composer ? `输入栏：${name}` : sidebar ? `侧栏：${name}` : name, 'aria-checked': value === style,
              'aria-describedby': `${costId}-${style}`, 'data-material-cost': materialCost(style, scope, settings.composerButtonGlass).level,
              tabIndex: value === style ? 0 : -1, onClick: () => onChange(style),
              onKeyDown: event => {
                const count = MATERIALS.length
                const next = { ArrowRight: (index + 1) % count, ArrowDown: (index + 1) % count, ArrowLeft: (index + count - 1) % count, ArrowUp: (index + count - 1) % count, Home: 0, End: count - 1 }[event.key]
                if (next === undefined) return
                event.preventDefault(); onChange(MATERIALS[next][0])
                event.currentTarget.parentElement.children[next]?.focus()
              } },
              h('span', { className: 'dcb-style-scene', 'aria-hidden': true }, h('span', { className: 'dcb-style-swatch', 'data-card-style': style }, h('i'), h('i'))),
              h('span', { className: 'dcb-style-name' }, name, h('span', { className: 'dcb-cost-tag', 'data-cost': materialCost(style, scope, settings.composerButtonGlass).level }, materialCost(style, scope, settings.composerButtonGlass).label)),
              h('small', { id: `${costId}-${style}` }, description, ' · ', materialCost(style, scope, settings.composerButtonGlass).detail)))),
          sidebar && h('p', { className: 'dcb-cost-description', role: 'status' }, materialCost(value, 'sidebar').detail))
      }

      function MessageMotionPreview({ enabled }) {
        const user = React.useRef(null), assistant = React.useRef(null), animations = React.useRef([])
        const stop = () => { for (const animation of animations.current) animation.cancel(); animations.current = [] }
        React.useEffect(() => {
          const preference = window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
          preference.addEventListener('change', stop)
          return () => { preference.removeEventListener('change', stop); stop() }
        }, [])
        React.useEffect(() => stop(), [enabled])
        const play = () => {
          stop()
          if (window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches) return
          animations.current = [[user, 'user', 0], [assistant, 'assistant', 110]].map(([ref, kind, delay]) => {
            const effect = messageEntrance(kind)
            const animation = ref.current.animate(effect.frames, { ...effect.options, delay, fill: 'both' })
            animation.finished.then(() => {
              animation.cancel(); animations.current = animations.current.filter(item => item !== animation)
            }).catch(() => {})
            return animation
          })
        }
        return h('div', { className: 'dcb-motion-preview' },
          h('div', { className: 'dcb-motion-preview-head' }, h('small', null, '仅预览，不发送消息'),
            h('button', { type: 'button', className: 'dcb-count-button', onClick: play, 'aria-label': '播放消息动效预览' }, '↻ 播放预览')),
          h('div', { className: 'dcb-message-demo', 'aria-label': '消息动效预览' },
            h('div', { ref: user, className: 'dcb-message-demo-row', 'data-message-demo': 'user' }, '刚发送的消息'),
            h('div', { ref: assistant, className: 'dcb-message-demo-row', 'data-message-demo': 'assistant' }, '模型的新回复会这样出现。')))
      }
      function Settings() {
        const [, render] = React.useReducer(value => value + 1, 0)
        React.useEffect(() => { listeners.add(render); return () => listeners.delete(render) }, [])
        React.useEffect(() => () => previewStyle(false), [])
        const h = React.createElement
        const materialName = MATERIALS.find(([value]) => value === settings.cardStyle)?.[1] || '默认'
        const composerName = MATERIALS.find(([value]) => value === settings.composerStyle)?.[1] || '默认'
        return h('div', { className: 'dcb-settings' },
          h('div', { className: 'dcb-settings-hero' },
            h('span', { className: 'dcb-settings-hero-mark', 'aria-hidden': true }, h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round' }, h('path', { d: 'M12 3l2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3Z' }))),
            h('div', null, h('h1', null, DISPLAY_NAME), h('p', null, '统一配置侧栏、任务卡片、输入栏外观与界面动效。'))),
          h(SettingsTabs, { onLeave: () => previewStyle(false) },
          h('section', { className: 'dcb-settings-block dcb-settings-card', 'data-dcb-settings-block': 'panel' },
            h('div', { className: 'dcb-settings-header' },
              h('div', null, h('h2', null, '任务面板'), h('p', null, '右上角任务卡片的外观、材质与进度布局'))),
            h('p', { className: 'dcb-cost-guide' }, '性能提示：透明玻璃与毛玻璃更吃显卡；卡顿时优先改为默认或轻量玻璃。以下为效果的相对开销，实际表现还受分辨率、窗口大小与显卡影响。'),
            h('div', { className: 'dcb-settings-section' },
              h('div', { className: 'dcb-settings-section-title' }, '面板开关'),
              h('div', { className: 'dcb-settings-row dcb-panel-toggle' },
                h('div', { className: 'dcb-settings-copy' },
                  h('div', { className: 'dcb-settings-row-title' }, '右上角任务面板'),
                  h('p', { className: 'dcb-settings-row-desc' }, '查看任务进度、输出文件和工具使用记录；悬停预览，点击展开。')),
                h('button', { type: 'button', role: 'switch', className: 'dcb-switch', 'aria-label': '启用右上角任务面板', 'aria-checked': settings.enabled,
                  onClick: () => update({ enabled: !settings.enabled }) }))),
            h(StylePicker, { scope: 'card', value: settings.cardStyle, onChange: cardStyle => { update({ cardStyle }); previewStyle(true) } }),
            h('div', { className: 'dcb-settings-section' },
              h('div', { className: 'dcb-settings-section-title' }, '布局与显示'),
              h('div', { className: 'dcb-settings-row', 'data-setting': 'width' },
                h('div', { className: 'dcb-settings-copy' }, h('span', { className: 'dcb-settings-row-title dcb-width-label' }, '面板宽度', h('span', { className: 'dcb-cost-tag' }, '面积相关')), h('p', { className: 'dcb-settings-row-desc' }, '玻璃样式下，面板越宽绘制面积越大；窄屏会自动适应可用空间。')),
                h('div', { className: 'dcb-settings-controls' }, h(WidthSlider), h('span', { className: 'dcb-width-value' }, `${settings.width} px`))),
              h('div', { className: 'dcb-settings-row' },
                h('div', { className: 'dcb-settings-copy' }, h('span', { className: 'dcb-settings-row-title' }, '进度默认显示'), h('p', { className: 'dcb-settings-row-desc' }, '显示当前步骤附近的任务，支持上下滚动。')),
                h(StepCountPicker))),
            h('div', { className: 'dcb-settings-info', role: 'status' }, `${settings.enabled ? '当前生效' : '面板已关闭'}：${materialName} · ${settings.width} px · ${settings.progressView.count} 个步骤`),
            h('p', { className: 'dcb-settings-footnote' }, '展开偏好会自动记住。自动展开的面板仅点 X 收起，手动打开可点外部收起；普通推理或工具调用不会自动展开。输出图片较多时，缩略图会占用额外内存。设置保存在当前浏览器。')),
          h('section', { className: 'dcb-settings-block dcb-settings-card', 'data-dcb-settings-block': 'composer' },
            h('div', { className: 'dcb-settings-header' }, h('div', null, h('h2', null, '输入栏外观'), h('p', null, '底部输入框的样式独立保存，切换即时生效'))),
            h('div', { className: 'dcb-settings-section' },
              h('div', { className: 'dcb-settings-row', 'data-setting': 'button-glass' },
                h('div', { className: 'dcb-settings-copy' }, h('span', { className: 'dcb-settings-row-title' }, '小按钮玻璃材质', h('span', { className: 'dcb-cost-tag', 'data-cost': 'medium' }, '额外开销')), h('p', { className: 'dcb-settings-row-desc', id: 'dcb-button-glass-description' }, '独立控制模型选择及其菜单、附件、语音、发送等按钮，与任意输入框样式搭配。关闭后恢复原生外观并释放玻璃绘制资源。')),
                h('button', { type: 'button', role: 'switch', className: 'dcb-switch', 'aria-label': '小按钮玻璃材质', 'aria-describedby': 'dcb-button-glass-description', 'aria-checked': settings.composerButtonGlass,
                  onClick: () => update({ composerButtonGlass: !settings.composerButtonGlass }) })),
              h('div', { className: 'dcb-settings-row' },
                h('div', { className: 'dcb-settings-copy' }, h('span', { className: 'dcb-settings-row-title' }, '对话延伸到输入栏后方', h('span', { className: 'dcb-cost-tag', 'data-cost': 'medium' }, '滚动时叠加')), h('p', { className: 'dcb-settings-row-desc' }, settings.composerStyle === 'milk' ? '默认样式下自动关闭；选择玻璃样式后可开启。' : '滚动时让聊天透过玻璃显现；背景变化会叠加玻璃绘制开销，卡顿时可先关闭。')),
                h('button', { type: 'button', role: 'switch', className: 'dcb-switch', 'aria-label': '对话延伸到输入栏后方', 'aria-checked': settings.chatUnderComposer, disabled: settings.composerStyle === 'milk',
                  onClick: () => update({ chatUnderComposer: !settings.chatUnderComposer }) }))),
            h(StylePicker, { scope: 'composer', value: settings.composerStyle, onChange: composerStyle => update({ composerStyle }) }),
            h('div', { className: 'dcb-settings-info', role: 'status' }, `输入栏样式：${composerName} · 小按钮玻璃：${settings.composerButtonGlass ? '开启' : '关闭'}`)),
          h('section', { className: 'dcb-settings-block dcb-settings-card', 'data-dcb-settings-block': 'sidebar' },
            h('div', { className: 'dcb-settings-header' }, h('div', null, h('h2', null, '左侧栏外观'), h('p', null, '圆角玻璃与平滑选中动效'))),
            h(StylePicker, { scope: 'sidebar', value: settings.sidebarStyle, onChange: sidebarStyle => update({ sidebarStyle }) }),
            h('div', { className: 'dcb-settings-row' }, h('div', { className: 'dcb-settings-copy' }, h('span', { className: 'dcb-settings-row-title' }, '侧栏切换动效', h('span', { className: 'dcb-cost-tag' }, '短时开销')), h('p', { className: 'dcb-settings-row-desc' }, '切换与开合时短暂绘制，通常比大面积玻璃负担小；减少动态效果时自动停用。')),
              h('button', { type: 'button', className: 'dcb-switch', role: 'switch', 'aria-label': '侧栏切换动效', 'aria-checked': settings.sidebarMotion, onClick: () => update({ sidebarMotion: !settings.sidebarMotion }) }))),
          h(WelcomeSettings, { value: settings, onChange: update }),
          h(ParticleSettings, { value: settings, onChange: update }),
          h('section', { className: 'dcb-settings-block dcb-settings-card', 'data-dcb-settings-block': 'messages' },
            h('div', { className: 'dcb-settings-header' }, h('div', null, h('h2', null, '对话卡片与动效'), h('p', null, '每轮提问与回复分开呈现，并保留新消息入场过渡'))),
            h('div', { className: 'dcb-settings-row' },
              h('div', { className: 'dcb-settings-copy' }, h('span', { className: 'dcb-settings-row-title' }, '对话分轮玻璃', h('span', { className: 'dcb-cost-tag', 'data-cost': 'high' }, '大面积绘制')), h('p', { className: 'dcb-settings-row-desc' }, '每轮提问和对应回复共用圆角玻璃底板，轮次间留出间距。材质跟随侧栏；侧栏为默认时使用轻量玻璃。仅可见区域启用模糊，较多卡片或毛玻璃仍会增加显卡负担，可单独关闭。')),
              h('button', { type: 'button', role: 'switch', className: 'dcb-switch', 'aria-label': '对话分轮玻璃', 'aria-checked': settings.turnGlass,
                onClick: () => update({ turnGlass: !settings.turnGlass }) })),
            h('div', { className: 'dcb-settings-row' },
              h('div', { className: 'dcb-settings-copy' }, h('span', { className: 'dcb-settings-row-title' }, '新消息入场动效', h('span', { className: 'dcb-cost-tag' }, '短时开销')), h('p', { className: 'dcb-settings-row-desc' }, '仅新消息出现时短暂绘制；流式文字不重复入场，通常不是持续卡顿的主要来源。')),
              h('button', { type: 'button', role: 'switch', className: 'dcb-switch', 'aria-label': '新消息入场动效', 'aria-checked': settings.messageMotion,
                onClick: () => update({ messageMotion: !settings.messageMotion }) })),
            h(MessageMotionPreview, { enabled: settings.messageMotion }),
            h('p', { className: 'dcb-cost-description' }, '开屏与日夜切换也是短时开销。日夜按钮中的太阳、云和星点会持续轻动，但区域很小；任务卡片运行时的扫光与状态动画也有持续绘制开销。'))))
      }
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section', id: NAME, order: 26, label: DISPLAY_NAME,
      }, Settings))
      function OutputRow({ file, sessionId, readThumbnail, readPreview, onOpen, featured, active }) {
        const previewAvailable = React.useSyncExternalStore(outputPreview.subscribe, outputPreview.getSnapshot, outputPreview.getSnapshot)
        const name = basename(file.path)
        const extension = (/\.([^.]+)$/.exec(name)?.[1] || '').toLowerCase()
        const image = imageExtension(name)
        const url = useThumbnail(sessionId, file.path, readThumbnail)
        if (featured && previewAvailable && outputPreview.supports(file.path)) return h(OutputArtifact, { file, sessionId, readPreview, onOpen, active })
        return h('button', { type: 'button', className: 'dcb-output', title: file.description || name, 'data-thumbnail': image ? url ? 'image' : 'pending' : undefined, onClick: () => onOpen(file.path) },
          h('span', { className: 'dcb-tile', 'data-kind': image ? 'image' : 'file', 'aria-hidden': true },
            url ? h('img', { src: url, alt: '', loading: 'lazy' }) : tileLabel(name)),
          h('span', { className: 'dcb-file-name' }, name.replace(/\.[^.]+$/, '')), h('span', { className: 'dcb-file-type' }, extension || '文件'))
      }
      function ToolResources({ summary, running, id }) {
        const expanded = settings.toolDetails
        const disclosure = useToolDisclosure(expanded, summary.tools.map(item => item.label).join('\u0000'))
        const active = running ? summary.active : []
        const working = active.length > 0
        const unresolved = summary.tools.reduce((sum, item) => sum + item.running, 0)
        const name = working ? `${active[0].label}${active.length > 1 ? ` +${active.length - 1}` : ''}` : '工具调用'
        const currentCategory = working ? toolCategory(active[0].label) : null
        const count = `${summary.count} 种 · ${summary.calls} 次`
        const status = working ? `调用中 · ${summary.count} 种` : unresolved ? `未返回 · ${summary.count} 种` : count
        const title = `${working ? `正在调用 ${active.map(item => item.label).join('、')}，` : ''}${count}${summary.failed ? `，${summary.failed} 次失败` : ''}，${expanded ? '收起' : '展开'}工具明细`
        return h('div', { className: 'dcb-tools' },
          h('button', { type: 'button', className: 'dcb-tool-summary dcb-resource-summary', 'aria-label': expanded ? '收起工具明细' : '展开工具明细', 'aria-expanded': expanded, 'aria-controls': id, 'data-working': working, title,
            onClick: () => update({ toolDetails: !settings.toolDetails }) },
            h(Icon, { kind: currentCategory?.icon || 'toolbox', className: 'dcb-tool-symbol' }), h('span', { className: 'dcb-tool-name' }, name),
            h('span', { className: 'dcb-tool-count' }, status),
            summary.failed > 0 && h('span', { className: 'dcb-tool-failed' }, `失败 ${summary.failed}`),
            h('span', { className: 'dcb-tool-chevron', 'aria-hidden': true }, h(Icon, { kind: 'chevron', size: 12 }))),
          h('div', { id, className: 'dcb-tools-disclosure', ref: disclosure.viewport, role: 'group', 'aria-label': '工具明细', 'aria-hidden': !expanded, inert: !expanded },
            h('div', { className: 'dcb-tools-body', ref: disclosure.body }, summary.tools.map(item => {
              const liveCount = item.activeRunning ?? item.running
              const state = item.running > 0 ? running && liveCount > 0 ? `调用中${liveCount > 1 ? ` ${liveCount}` : ''}${item.running > liveCount ? ` · 未返回 ${item.running - liveCount}` : ''}` : '未返回' : item.failed ? `失败 ${item.failed}` : '已使用'
              const detail = `${item.count} 次 · ${state}${item.running > 0 && item.failed ? ` · 失败 ${item.failed}` : ''}`
              const category = toolCategory(item.label)
              return h('div', { className: 'dcb-resource dcb-tool-row', key: item.label, 'data-tool-category': category.id, 'data-working': running && liveCount > 0, title: `${category.label} · ${item.label}` }, h(Icon, { kind: category.icon, className: 'dcb-tool-symbol' }), h('span', { className: 'dcb-resource-label', title: item.label }, item.label), h('span', { className: 'dcb-tool-category' }, category.label), h('span', { className: 'dcb-resource-detail', title: detail }, detail))
            }))))
      }
      function SkillResources({ items, id }) {
        const expanded = settings.skillDetails
        const disclosure = useToolDisclosure(expanded, items.map(item => `${item.path || ''}:${item.detail}`).join('\u0000'), 'skills')
        return h('div', { className: 'dcb-skills' },
          h('button', { type: 'button', className: 'dcb-skill-summary dcb-resource-summary', 'aria-label': expanded ? '收起技能明细' : '展开技能明细', 'aria-expanded': expanded, 'aria-controls': id,
            title: `${items.length} 个技能，${expanded ? '收起' : '展开'}技能明细`, onClick: () => update({ skillDetails: !settings.skillDetails }) },
            h(Icon, { kind: 'skill' }), h('span', { className: 'dcb-tool-name' }, 'Skills'), h('span', { className: 'dcb-tool-count' }, `${items.length} 个`),
            h('span', { className: 'dcb-tool-chevron', 'aria-hidden': true }, h(Icon, { kind: 'chevron', size: 12 }))),
          h('div', { id, className: 'dcb-skills-disclosure', ref: disclosure.viewport, role: 'group', 'aria-label': '技能明细', 'aria-hidden': !expanded, inert: !expanded },
            h('div', { className: 'dcb-skills-body', ref: disclosure.body }, items.map(item =>
              h('div', { className: 'dcb-resource dcb-skill-row', key: `${item.path || ''}:${item.detail}`, title: item.path || item.detail },
                h(Icon, { kind: 'skill' }), h('span', { className: 'dcb-resource-label', title: item.detail }, item.detail), h('span', { className: 'dcb-resource-detail' }, '已使用'))))))
      }
      function TurnTaskGroup({ group, sessionId, current, defaultOpen, running, id }) {
        const [choice, setChoice] = React.useState(null)
        const groupKey = `${sessionId}:${group.turn ?? 'live'}`
        const expanded = choice?.key === groupKey ? choice.expanded : defaultOpen
        const disclosure = useToolDisclosure(expanded, JSON.stringify(group.todos), 'plan')
        const active = current && running && !group.ended && group.todos.some(item => item.status === 'in_progress')
        const liquid = useProgressLiquid({ host: disclosure.viewport, list: disclosure.body, context: groupKey, plan: JSON.stringify(group.todos.map(item => item.content)), todos: group.todos, active: current && running && !group.ended && expanded })
        const label = group.turn === null ? '当前任务' : `第 ${group.turn} 轮`
        return h('div', { className: 'dcb-plan-group', 'data-plan-turn': group.turn ?? 'live' },
          h('button', { type: 'button', className: 'dcb-plan-toggle', 'aria-label': `${expanded ? '收起' : '展开'}${label}任务`, 'aria-expanded': expanded, 'aria-controls': id, onClick: () => setChoice({ key: groupKey, expanded: !expanded }) },
            h('span', null, label), h('span', { className: 'dcb-plan-status' }, active ? '进行中' : group.completed === group.todos.length ? '已完成' : '有未完成项'),
            h('span', { className: 'dcb-plan-count' }, `${group.completed}/${group.todos.length}`), h('span', { className: 'dcb-tool-chevron', 'aria-hidden': true }, h(Icon, { kind: 'chevron', size: 12 }))),
          h('div', { id, className: 'dcb-plan-disclosure', ref: disclosure.viewport, role: 'group', 'aria-label': `${label}任务`, 'aria-hidden': !expanded, inert: !expanded },
            h('ol', { className: 'dcb-timeline', ref: disclosure.body, 'data-working': active }, group.todos.map((item, index) => {
              const state = item.status === 'completed' ? '已完成' : active && item.status === 'in_progress' ? '进行中' : item.status === 'in_progress' ? '未完成' : '待处理'
              return h('li', { key: `${index}:${item.content}`, className: 'dcb-step', 'data-step-index': index, 'data-status': item.status, 'data-link-before': index ? 'solid' : undefined, 'data-link-after': index < group.todos.length - 1 ? 'solid' : undefined },
                h('span', { className: 'dcb-status', role: 'img', 'aria-label': state }, h('svg', { className: 'dcb-status-dot', width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true },
                  h('circle', { className: 'dcb-status-core', cx: 12, cy: 12, r: 3.5 }))),
                h('span', null, item.content), h('span', { className: 'dcb-plan-state' }, state))
            })), h('div', { className: 'dcb-progress-liquid-layer', ref: liquid, 'aria-hidden': true, inert: true })),
          group.complete === false && h('p', { className: 'dcb-scope-note' }, '本轮记录未完整加载'))
      }
      function Summary({ sessionId, useProjection, useTaskActivity, useSession, openOutput, readThumbnail, readPreview }) {
        const liveTodos = useProjection('todos') || []
        const outline = useProjection('turnOutline')
        const history = useTaskActivity(value => value)
        const readingTurn = useReadingTurn(sessionId, outline, history.turns)
        const latestTurn = [history.latestTurn, ...(Array.isArray(outline) ? outline.filter(item => Number.isSafeInteger(item?.seq) && item.seq >= 0).map(item => item?.turn) : [])].filter(value => Number.isSafeInteger(value) && value >= 0).reduce((latest, turn) => latest === null || turn > latest ? turn : latest, null)
        const turnNumbers = [...new Set([...(history.turns || []).map(item => item.turn), ...(Array.isArray(outline) ? outline.filter(item => Number.isSafeInteger(item?.seq) && item.seq >= 0).map(item => item.turn) : [])].filter(turn => Number.isSafeInteger(turn) && turn >= 0))].sort((a, b) => a - b)
        const [pickedTurn, setPickedTurn] = React.useState(null)
        const manualTurn = pickedTurn?.sessionId === sessionId && turnNumbers.includes(pickedTurn.turn) ? pickedTurn.turn : null
        const selectedTurn = manualTurn ?? readingTurn ?? latestTurn
        const turnSnapshot = history.turns?.find(item => item.turn === selectedTurn)
        const allTurns = settings.summaryScope === 'all'
        const all = React.useMemo(() => allTurnView(history, liveTodos, latestTurn, turnNumbers), [history, liveTodos, latestTurn, turnNumbers.join(':')])
        const viewingHistory = !allTurns && selectedTurn !== null && selectedTurn !== latestTurn
        const todos = allTurns ? all.groups.flatMap(group => group.todos) : viewingHistory ? turnSnapshot?.todos || [] : liveTodos
        const activity = allTurns ? all.activity : selectedTurn === null ? history : turnSnapshot?.activity || emptyActivity
        const featuredOutputs = new Set(activity.files.filter(file => DcbLens.isHtmlOutput(file.path)).sort((a, b) => (a.seq || 0) - (b.seq || 0)).slice(-3))
        const resources = toolSummary(activity.resources)
        const skills = resources.featured.filter(item => item.kind === 'skill')
        const liveRunning = useSession ? useSession(value => value.running) === true : liveTodos.some(item => item.status === 'in_progress')
        const running = liveRunning && !viewingHistory && (allTurns ? history.turns?.find(item => item.turn === latestTurn)?.ended !== true : turnSnapshot?.ended !== true)
        const contextKey = `${sessionId}:${allTurns ? 'all' : selectedTurn ?? 'live'}`
        const [openState, setOpenState] = React.useState(() => ({ sessionId, value: openedBySession.get(sessionId) ?? false, automatic: autoOpenedSessions.has(sessionId) }))
        const [hoverSession, setHoverSession] = React.useState(null)
        const [stylePreviewSession, setStylePreviewSession] = React.useState(null)
        const [exitingSession, setExitingSession] = React.useState(null)
        const [reveal, setReveal] = React.useState(0)
        const [browsing, setBrowsing] = React.useState(null)
        const [, refresh] = React.useReducer(value => value + 1, 0)
        const anchor = React.useRef(null)
        const button = React.useRef(null)
        const card = React.useRef(null)
        const hoverTimer = React.useRef(null)
        const dropdown = React.useRef(null)
        const pinned = openState.sessionId === sessionId ? openState.value : openedBySession.get(sessionId) ?? false
        const automaticallyOpened = pinned && (openState.sessionId === sessionId ? openState.automatic : autoOpenedSessions.has(sessionId))
        const stylePreview = stylePreviewSession === sessionId
        const open = pinned || hoverSession === sessionId || stylePreview
        const present = open || exitingSession === sessionId
        const modules = settings.modules
        const hasContent = todos.length > 0 || activity.files.length > 0 || activity.resources.length > 0
        const visible = settings.enabled && (hasContent || selectedTurn !== null && present || all.activity.resources.length > 0 || all.activity.files.length > 0 || all.groups.length > 0)
        const ownsNative = settings.enabled && (visible || selectedTurn !== null)
        const working = running && (allTurns ? all.groups.some(group => group.turn === latestTurn && !group.ended && group.todos.some(item => item.status === 'in_progress')) : todos.length > 0)
        const planRevision = JSON.stringify(todos.map(item => item.content))
        const livePlanRevision = JSON.stringify(liveTodos.map(item => item.content))
        const automatic = progressItems(todos, settings.progressView.count)
        const browsingValid = browsing?.contextKey === contextKey && browsing.plan === planRevision && browsing.count === settings.progressView.count
        const progress = browsingValid ? progressItems(todos, settings.progressView.count, browsing.start) : automatic
        const cursor = React.useRef(progress.start)
        cursor.current = progress.start
        const rollActive = !allTurns && visible && open && modules.progress && todos.length > 0
        const roll = useStepRoll({ sessionId: contextKey, plan: planRevision, count: settings.progressView.count, start: progress.start, todos, active: rollActive, folds: `${settings.progressView.previous}:${settings.progressView.future}`, manual: browsingValid })
        const liquid = useProgressLiquid({ host: roll.viewport, list: roll.list, context: contextKey, plan: planRevision, todos, active: rollActive && working, manual: browsingValid })
        const navigation = useStepNavigation(roll.viewport, (delta, probe = false) => {
          const start = Math.max(0, Math.min(Math.max(0, todos.length - settings.progressView.count), cursor.current + delta))
          if (start === cursor.current) return false
          if (!probe) { cursor.current = start; setBrowsing({ contextKey, plan: planRevision, count: settings.progressView.count, start }) }
          return true
        }, rollActive, contextKey, planRevision, settings.progressView.count)
        const transition = useContextTransition(contextKey, visible && open)
        const entryLabel = allTurns ? `全部 ${all.turnCount} 轮` : viewingHistory ? `第 ${selectedTurn} 轮` : working ? `第 ${progress.step} 步，共 ${progress.total} 步` : activity.files.length || todos.length || activity.resources.length
        React.useEffect(() => { listeners.add(refresh); return () => listeners.delete(refresh) }, [])
        // Appearance previews are temporary and never rewrite the per-chat pin state.
        React.useEffect(() => {
          const preview = active => {
            if (active) {
              if (!settings.enabled || !hasContent || !anchor.current?.getClientRects().length) return
              window.clearTimeout(hoverTimer.current)
              setHoverSession(null)
              setExitingSession(null)
              setStylePreviewSession(sessionId)
            } else {
              setStylePreviewSession(null)
              if (stylePreview && !pinned && hoverSession !== sessionId) setExitingSession(sessionId)
            }
          }
          stylePreviewListeners.add(preview)
          return () => stylePreviewListeners.delete(preview)
        }, [sessionId, hasContent, pinned, hoverSession, stylePreview])
        // Hover previews must not overwrite the persistent per-session open state.
        React.useEffect(() => {
          setHoverSession(null)
          setStylePreviewSession(null)
          setExitingSession(null)
          return () => window.clearTimeout(hoverTimer.current)
        }, [sessionId, visible])
        React.useLayoutEffect(() => () => {
          dropdown.current?.cancel()
          dropdown.current = null
        }, [sessionId, visible])
        React.useEffect(() => {
          if (!open || !visible || automaticallyOpened) return
          const outside = event => {
            if (autoOpenedSessions.has(sessionId)) return
            const node = anchor.current
            if (!node || event.composedPath().includes(node)) return
            if (outputViewer.contains(sessionId, event.target)) return
            if (event.target?.closest?.('[data-dcb-card-style-picker]')) return
            if (stylePreview && event.target?.closest?.('.dcb-settings')) return
            const navigation = event.target?.closest?.('nav')
            if (navigation?.querySelector('button[data-index]') && navigation.closest('[data-conversation-content]')?.dataset.conversationSession === sessionId) return
            window.clearTimeout(hoverTimer.current)
            openedBySession.set(sessionId, false)
            setOpenState({ sessionId, value: false, automatic: false })
            setHoverSession(null)
            setStylePreviewSession(null)
            setExitingSession(sessionId)
          }
          // Observe outside presses without blocking the clicked control or moving focus.
          document.addEventListener('pointerdown', outside, true)
          return () => document.removeEventListener('pointerdown', outside, true)
        }, [sessionId, open, visible, stylePreview, automaticallyOpened])
        // Only a new/edited plan during a run can pin the card open. Existing history,
        // status-only progress, generic inference, tools and outputs cannot trigger it.
        React.useEffect(() => {
          const run = planRuns.get(sessionId)
          if (!run) {
            planRuns.set(sessionId, { running: liveRunning, plan: livePlanRevision, revealed: false })
            return
          }
          const changed = run.plan !== livePlanRevision
          if (run.running !== liveRunning) run.revealed = false
          run.running = liveRunning
          run.plan = livePlanRevision
          if (!liveRunning || viewingHistory || !visible || liveTodos.length === 0 || !changed || run.revealed) return
          run.revealed = true
          openedBySession.set(sessionId, true)
          autoOpenedSessions.add(sessionId)
          setOpenState({ sessionId, value: true, automatic: true })
          setExitingSession(null)
          setReveal(value => value + 1)
        }, [sessionId, visible, liveRunning, livePlanRevision, viewingHistory])
        React.useLayoutEffect(() => {
          const node = card.current
          const previous = dropdown.current
          // Reveal the card and its shadow together; clipping at the border would
          // hide the outer shadow until the finished animation is removed.
          const hidden = { opacity: 0, transform: 'translateY(-6px)', clipPath: 'inset(-64px -64px calc(100% + 64px) -64px round 14px)' }
          const shown = { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(-64px -64px -64px -64px round 14px)' }
          let from = open ? hidden : shown
          // Read the current animated frame before canceling so rapid re-entry is continuous.
          if (previous?.effect?.target === node && node) {
            const style = getComputedStyle(node)
            from = { opacity: style.opacity, transform: style.transform, clipPath: style.clipPath }
          }
          previous?.cancel()
          dropdown.current = null
          if (!present || !visible || !node) return
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            if (!open) setExitingSession(null)
            return
          }
          const animation = node.animate([from, open ? shown : hidden], {
            id: open ? 'dcb-dropdown' : 'dcb-hover-dismiss', duration: open ? MOTION.time.standard : MOTION.time.control,
            easing: open ? MOTION.ease.smooth : MOTION.ease.exit, fill: 'forwards',
          })
          dropdown.current = animation
          animation.finished.then(() => {
            if (dropdown.current !== animation) return
            if (open) { dropdown.current = null; animation.cancel() }
            else setExitingSession(null)
          }).catch(() => {})
        }, [sessionId, open, present, visible, reveal])
        React.useEffect(() => {
          if (!ownsNative) return
          summaryOwners.set(sessionId, (summaryOwners.get(sessionId) || 0) + 1)
          schedule()
          return () => {
            const remaining = (summaryOwners.get(sessionId) || 1) - 1
            if (remaining) summaryOwners.set(sessionId, remaining)
            else summaryOwners.delete(sessionId)
            schedule()
          }
        }, [sessionId, ownsNative])
        React.useLayoutEffect(() => {
          if (!visible || !anchor.current) return
          const node = anchor.current
          const container = [...document.querySelectorAll('[data-conversation-content]')].find(el => el.dataset.conversationSession === sessionId && el.getClientRects().length)
          const size = () => {
            const rect = node.getBoundingClientRect()
            const available = container?.getBoundingClientRect().width ?? window.innerWidth
            node.style.setProperty('--dcb-card-width', `${Math.max(200, Math.min(settings.width, available - 24, rect.right - 12))}px`)
            node.style.setProperty('--dcb-card-height', `${Math.max(160, window.innerHeight - rect.bottom - 32)}px`)
          }
          const observer = new ResizeObserver(size)
          observer.observe(container || node.parentElement)
          window.addEventListener('resize', size)
          size()
          return () => { observer.disconnect(); window.removeEventListener('resize', size) }
        }, [sessionId, visible, settings.width])
        if (!visible) return null
        const setOpen = value => { window.clearTimeout(hoverTimer.current); setHoverSession(null); setStylePreviewSession(null); setExitingSession(null); openedBySession.set(sessionId, value); autoOpenedSessions.delete(sessionId); setOpenState({ sessionId, value, automatic: false }) }
        const close = () => {
          const automatic = autoOpenedSessions.has(sessionId)
          setOpen(false)
          if (automatic) setExitingSession(sessionId)
          button.current?.focus()
        }
        const closeControl = h('button', { type: 'button', className: 'dcb-close', 'aria-label': '关闭进度面板', onClick: close }, h(Icon, { kind: 'close', size: 16 }))
        const cardId = `${NAME}-summary-${sessionId}-${allTurns ? 'all' : selectedTurn ?? 'live'}`
        const collapsible = (id, expanded, children, className) =>
          h('div', { id, className: `dcb-collapse ${className}`, 'aria-hidden': !expanded, inert: !expanded },
            h('div', { className: 'dcb-collapse-inner' }, children))
        const step = (item, index) => {
          const hasPrevious = progress.previous.length > 0
          const hasFuture = progress.future.length > 0
          const dashedBefore = index === 0 || (index === progress.start && hasPrevious && !settings.progressView.previous) || (index === progress.end && hasFuture)
          const before = index > 0 || hasPrevious ? (dashedBefore ? 'dashed' : 'solid') : undefined
          const after = index < todos.length - 1 ? (index === progress.end - 1 && hasFuture ? 'dashed' : 'solid') : undefined
          return h('li', { key: `${index}:${item.content}`, className: 'dcb-step', 'data-step-index': index, 'data-status': item.status, 'data-link-before': before, 'data-link-after': after, 'aria-current': item.status === 'in_progress' ? 'step' : undefined },
          h('span', { className: 'dcb-status', role: 'img', 'aria-label': { completed: '已完成', in_progress: '进行中', pending: '待处理' }[item.status] || item.status },
            h('svg', { className: 'dcb-status-dot', width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false },
              item.status === 'in_progress' && h(React.Fragment, null,
                h('circle', { className: 'dcb-status-ripple', cx: 12, cy: 12, r: 6, strokeWidth: 1 }),
                h('g', { className: 'dcb-status-orbit' },
                  h('circle', { cx: 12, cy: 12, r: 7.5, pathLength: 100, strokeWidth: 1.4, strokeDasharray: '36 64' }))),
              h('circle', { className: 'dcb-status-core', cx: 12, cy: 12, r: 3.5 }))),
          h('span', { className: 'dcb-step-text' }, item.content))
        }
        const stepGroup = (kind, label, entries, offset) => {
          const expanded = settings.progressView[kind]
          const contentId = `${cardId}-${kind}`
          return h('div', { key: kind, className: 'dcb-step-group', ref: roll[kind], 'aria-hidden': !entries.length, inert: !entries.length }, entries.length > 0 && h(React.Fragment, null,
            h('button', { type: 'button', className: `dcb-history${kind === 'future' ? ' dcb-future' : ''}`, 'aria-expanded': expanded, 'aria-controls': contentId,
              onClick: () => update({ progressView: { ...settings.progressView, [kind]: !settings.progressView[kind] } }) },
              h('span', { className: 'dcb-status', 'aria-hidden': true }), h('span', { className: 'dcb-history-label' }, expanded ? `收起${label}` : `${entries.length} 个${label}`, h(Icon, { kind: 'chevron', size: 12 }))),
            collapsible(contentId, expanded, h('ol', { className: 'dcb-timeline', start: offset + 1 }, entries.map((item, index) => step(item, offset + index))), kind === 'previous' ? 'dcb-history-content' : 'dcb-future-content')))
        }
        const section = (kind, label, children, withClose) => {
          const expanded = modules[kind]
          const contentId = `${cardId}-${kind}`
          const toggle = () => {
            update({ modules: { ...settings.modules, [kind]: !settings.modules[kind] } })
          }
          return h('section', { key: kind, 'data-testid': `dcb-${kind}`, 'data-collapsed': !expanded },
            h('h3', null, h('button', { type: 'button', className: 'dcb-module-toggle', 'aria-expanded': expanded, 'aria-controls': contentId, onClick: toggle }, label, h(Icon, { kind: 'chevron', size: 14 })), kind === 'progress' && !allTurns && browsingValid && h('button', { type: 'button', className: 'dcb-follow', onClick: () => { navigation.cancel(); setBrowsing(null) } }, '回到当前步骤'), withClose && closeControl),
            collapsible(contentId, expanded, h('div', { className: 'dcb-module-body' }, children), 'dcb-module-content'))
        }
        return h('div', { className: 'dcb-anchor', ref: anchor, 'data-dcb-summary-for': sessionId,
          onPointerEnter: event => {
            if (event.pointerType !== 'mouse') return
            window.clearTimeout(hoverTimer.current)
            setExitingSession(null)
            if (!pinned) setHoverSession(sessionId)
          },
          onPointerLeave: event => {
            if (event.pointerType !== 'mouse' || hoverSession !== sessionId || pinned || outputViewer.isOpen(sessionId)) return
            window.clearTimeout(hoverTimer.current)
            hoverTimer.current = window.setTimeout(() => {
              if (!openedBySession.get(sessionId) && !outputViewer.isOpen(sessionId) && !card.current?.contains(document.activeElement)) {
                setExitingSession(sessionId)
                setHoverSession(null)
              }
            }, 220)
          },
          onKeyDown: event => { if (event.key === 'Escape' && open) { event.stopPropagation(); if (autoOpenedSessions.has(sessionId)) event.preventDefault(); else close() } } },
          h('button', { type: 'button', className: 'dcb-entry', ref: button, 'data-working': working, title: allTurns ? '当前聊天 · 全部轮次合计' : selectedTurn === null ? '会话进度与输出' : `第 ${selectedTurn} 轮 · 会话进度与输出`, 'aria-label': '会话进度与输出', 'aria-expanded': open, 'aria-controls': cardId, onClick: () => { if (!autoOpenedSessions.has(sessionId)) setOpen(!pinned) } },
            h(FishLogo, { size: 16, className: 'dcb-logo' }), h('span', { 'aria-live': 'polite', 'aria-atomic': true }, entryLabel)),
          present && h('aside', { key: sessionId, className: 'dcb-summary', ref: card, id: cardId, 'data-card-style': settings.cardStyle, 'data-open-origin': open ? automaticallyOpened ? 'automatic' : pinned ? 'manual' : stylePreview ? 'preview' : 'hover' : undefined, 'aria-label': '会话进度与输出', 'aria-hidden': !open, inert: !open, 'data-dcb-turn': allTurns ? 'all' : selectedTurn ?? undefined, 'data-state': open ? 'open' : 'closing', 'data-testid': 'dcb-summary' },
            h(ScopeSwitch, { value: settings.summaryScope, onChange: summaryScope => update({ summaryScope }) }),
            h('div', { className: 'dcb-turn-navigation' },
              h('span', null, allTurns ? `${all.turnCount} 轮 · ${all.groups.length} 组任务` : selectedTurn === null ? '当前记录' : `第 ${selectedTurn} 轮`),
              !allTurns && h(React.Fragment, null,
                manualTurn !== null && h('button', { type: 'button', onClick: () => setPickedTurn(null) }, '跟随阅读'),
                h('button', { type: 'button', 'aria-label': '上一轮', disabled: turnNumbers.indexOf(selectedTurn) <= 0, onClick: () => setPickedTurn({ sessionId, turn: turnNumbers[turnNumbers.indexOf(selectedTurn) - 1] }) }, '‹'),
                h('button', { type: 'button', 'aria-label': '下一轮', disabled: turnNumbers.indexOf(selectedTurn) < 0 || turnNumbers.indexOf(selectedTurn) >= turnNumbers.length - 1, onClick: () => setPickedTurn({ sessionId, turn: turnNumbers[turnNumbers.indexOf(selectedTurn) + 1] }) }, '›'))),
            h('div', { className: 'dcb-context-window', ref: transition.viewport }, h('div', { className: 'dcb-context-content', ref: transition.content },
            allTurns && all.groups.length > 0 && section('progress', '任务列表', h(React.Fragment, null,
              h('p', { className: 'dcb-scope-note dcb-plan-total' }, `共 ${all.taskCount} 项，已完成 ${all.completed} 项`),
              all.groups.map((group, index) => h(TurnTaskGroup, { key: `${sessionId}:${group.turn ?? 'live'}`, group, sessionId, current: group.turn === latestTurn, running, defaultOpen: index === all.groups.length - 1, id: `${cardId}-plan-${group.turn ?? 'live'}` }))), true),
            !allTurns && todos.length > 0 && section('progress', '进度',
              h(React.Fragment, null,
                stepGroup('previous', '先前步骤', progress.previous, 0),
                h('div', { className: 'dcb-step-window', ref: roll.viewport, tabIndex: 0, role: 'group', 'aria-label': '任务步骤，可上下滚动查看', 'aria-keyshortcuts': 'ArrowUp ArrowDown Home End' },
                  h('ol', { className: 'dcb-timeline dcb-recent-steps', ref: roll.list, 'data-working': working, start: progress.start + 1 }, progress.items.map((item, index) => step(item, index + progress.start))),
                  h('div', { className: 'dcb-step-ghost', ref: roll.ghost, 'aria-hidden': true, inert: true }),
                  h('div', { className: 'dcb-progress-liquid-layer', ref: liquid, 'aria-hidden': true, inert: true })),
                stepGroup('future', '后续步骤', progress.future, progress.end)), true),
            activity.files.length > 0 && section('outputs', '输出', activity.files.map(file =>
              h(OutputRow, { key: file.path, file, sessionId, readThumbnail, readPreview, onOpen: openOutput, active: open && modules.outputs, featured: featuredOutputs.has(file) })), todos.length === 0),
            activity.resources.length > 0 && section('resources', allTurns ? '全部轮次中已使用' : '本次会话中已使用', h(React.Fragment, null,
              skills.length > 1 && h(SkillResources, { items: skills, id: `${cardId}-skills` }),
              resources.featured.filter(item => item.kind !== 'skill' || skills.length < 2).map((item, index) => h('div', { className: 'dcb-resource', key: `${item.kind}:${item.path || item.detail}` }, h(Icon, { kind: item.kind }), h('span', { className: 'dcb-resource-label', title: item.label }, item.label), h('span', { className: 'dcb-resource-detail', title: item.detail }, item.detail))),
              resources.count > 0 && h(ToolResources, { summary: resources, running, id: `${cardId}-tools` }),
              activity.hasMore && selectedTurn === null && h('p', { className: 'dcb-note' }, '基于已加载的会话记录')), todos.length === 0 && activity.files.length === 0),
            allTurns && all.partial && h('p', { className: 'dcb-scope-note' }, '仅合计已加载记录；更早轮次尚未完整加载。'),
            !allTurns && hasContent && turnSnapshot?.complete === false && h('p', { className: 'dcb-note' }, '本轮记录尚未完整加载'),
            !hasContent && h(React.Fragment, null, h('h3', null, allTurns ? '全部轮次' : `第 ${selectedTurn} 轮`, closeControl), h('p', { className: 'dcb-context-empty' }, allTurns ? '当前已加载记录没有任务、输出或已用资源' : selectedTurn !== null && (!turnSnapshot || !turnSnapshot.complete) ? '本轮记录尚未完整加载' : '这一轮没有任务、输出或已用资源'))),
            h('div', { className: 'dcb-context-ghost', ref: transition.ghost, 'aria-hidden': true, inert: true }))))
      }
      class OutputPreviewBoundary extends React.Component {
        state = { failed: false }
        static getDerivedStateFromError() { return { failed: true } }
        componentDidCatch() { outputViewer.fail() }
        render() { return this.state.failed ? null : this.props.children }
      }
      function ParticleBinding({ sessionId, useProjection }) {
        const pressure = typeof useProjection === 'function' ? useProjection('contextPressure') : null
        const owner = React.useRef(Symbol('context-particles'))
        React.useLayoutEffect(() => { contextParticles.publish(sessionId, pressure, owner.current) }, [sessionId, pressure?.projectedTokens, pressure?.pressureTokens, pressure?.contextWindow])
        React.useEffect(() => () => contextParticles.forget(sessionId, owner.current), [sessionId])
        return null
      }
      function Header(props) {
        const openState = typeof props.useSession === 'function' ? props.useSession(value => value?.openState) : undefined
        React.useLayoutEffect(() => { startupMotion.setSessionState(props.sessionId, openState) }, [props.sessionId, openState])
        React.useEffect(() => () => outputViewer.closeForSession(props.sessionId), [props.sessionId])
        return h(React.Fragment, null, h(ParticleBinding, props), h(themeToggle.Button), h(focusMode.Button), h(Summary, props), h(OutputPreviewBoundary, { key: props.sessionId }, h(outputViewer.View, { sessionId: props.sessionId })))
      }
      if (typeof ctx.inject === 'function') ctx.inject(['sessions', 'sidebarRight'], scope => {
        const sources = new WeakMap()
        const readers = new Map()
        const previewReaders = new Map()
        // Thumbnails are optional: without the workspace-files Remote the rows keep their type tile.
        const remote = { current: null }
        const readOutputContent = DcbLens.outputContentReader(remote)
        const bind = face => { if (face && typeof face.readBytes === 'function' && typeof face.stat === 'function') remote.current = face }
        try { bind(scope.get?.('remote')?.workspaceFiles) } catch { /* service not mounted yet */ }
        try {
          scope.inject?.(['remote', 'remote.workspaceFiles'], inner => {
            try { bind(inner.get?.('remote.workspaceFiles') || inner.remote?.workspaceFiles) } catch { /* dereferenced namespace */ }
          })
        } catch { /* optional injection unsupported */ }
        const readerFor = sessionId => {
          if (!readers.has(sessionId)) readers.set(sessionId, thumbnailReader(remote, sessionId))
          return readers.get(sessionId)
        }
        const previewReaderFor = sessionId => {
          if (!previewReaders.has(sessionId)) previewReaders.set(sessionId, DcbLens.outputPreviewReader(remote, sessionId))
          return previewReaders.get(sessionId)
        }
        const resolvePreviewPath = async (sessionId, path) => {
          const stat = await remote.current?.stat(sessionId, path)
          return stat?.ok ? stat.value?.absolutePath : null
        }
        scope.slots.inject('conversation.session.header.utilities', () => scope.slots.register({
          name: 'conversation.session.header.utilities', id: NAME, order: 5,
          inject: sessionId => {
            const binding = scope.sessions.binding(sessionId)
            if (!binding) throw new Error(`${NAME}: session binding unavailable`)
            let source = sources.get(binding)
            if (!source) { source = activitySource(binding.eventSource); sources.set(binding, source) }
            return { hooks: { taskActivity: source }, readThumbnail: readerFor(sessionId), readPreview: previewReaderFor(sessionId), openOutput: path => outputPreview.open(sessionId, path, resolvePreviewPath, original => scope.sidebarRight.openResource(fileAddress(sessionId, original)), readOutputContent) }
          },
        }, Header))
      })
      ctx.effect(() => () => {
        disposed = true
        observer.disconnect()
        resize.disconnect()
        liquid.dispose()
        lensActions.dispose()
        composerSlots.dispose()
        conversationTabs.dispose()
        sidebarGlass.dispose()
        messageMotion.dispose()
        turnCards.dispose()
        themeToggle.dispose()
        focusMode.dispose()
        contextParticles.dispose()
        outputPreview.dispose()
        outputViewer.dispose()
        startupMotion.dispose()
        welcomeMediaStore.dispose()
        for (const element of composerActionOriginals.keys()) restoreComposerAction(element)
        for (const element of modelMenuOriginals.keys()) restoreModelMenu(element)
        for (const element of composerOriginals.keys()) restoreComposer(element)
        if (originalComposerFlag === null) document.body.removeAttribute(COMPOSER_FLAG)
        else document.body.setAttribute(COMPOSER_FLAG, originalComposerFlag)
        if (originalChatUnderComposerFlag === null) document.body.removeAttribute(CHAT_UNDER_COMPOSER_FLAG)
        else document.body.setAttribute(CHAT_UNDER_COMPOSER_FLAG, originalChatUnderComposerFlag)
        if (frame) window.cancelAnimationFrame(frame)
        window.removeEventListener('resize', schedule)
        window.removeEventListener('storage', onStorage)
        document.removeEventListener('scroll', onScroll, true)
        for (const panel of [...originals.keys()]) restore(panel)
        for (const panel of document.querySelectorAll('[data-dcb-native-hidden]')) panel.removeAttribute('data-dcb-native-hidden')
        for (const url of thumbnails.values()) URL.revokeObjectURL(url)
        thumbnails.clear()
        style.remove()
        listeners.clear()
        stylePreviewListeners.clear()
      }, `${NAME}: presentation`)
    }
    return { apply, inject: ['slots'], __test: { normalize, placement, activityFrom, activitySource, turnActivityFrom, allTurnView, toolSummary, toolCategory, createLiquidNormalMap, createMessageMotion, progressItems, fileAddress, imageExtension, tileLabel, mimeFor } }
  },
})
