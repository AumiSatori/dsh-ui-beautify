import dayArt from '../assets/mirror-sea/day.webp'
import nightArt from '../assets/mirror-sea/night.webp'

// Horizon of the artwork: 0.528 of the 1672x941 source frame.
const HORIZON=.528
// Both frames are inlined as data URLs at build time; the iframe CSP allows
// nothing but data:/blob: images, so the preset must never fetch anything.
export const mirrorSeaArtwork={day:dayArt,night:nightArt}

export const mirrorSeaHtml=`<style>html,body{margin:0;height:100%;overflow:hidden;background:#081226}#mirror-sea{display:block;width:100vw;height:100vh}</style>
<canvas id="mirror-sea" aria-hidden="true"></canvas>
<script>
(function(){
'use strict';
var DAY='${dayArt}',NIGHT='${nightArt}',HORIZON=${HORIZON};
var canvas=document.getElementById('mirror-sea'),ctx=canvas.getContext('2d',{alpha:false});
var reduced=matchMedia('(prefers-reduced-motion: reduce)');
var base=document.createElement('canvas'),bctx=base.getContext('2d');
var day=new Image(),night=new Image();
var W=1,H=1,M=0,fit={x:0,y:0,w:1,h:1},phase=0,target=0,phaseDrawn=-1,loaded=0,t=0,last=0,px=.5,py=.5,tx=0,ty=0,raf=0,spark=null,i=0;
var scheme=matchMedia('(prefers-color-scheme: dark)'),themeSeen=false;
var motes=[];
for(i=0;i<28;i++){var r=Math.random();motes.push({x:Math.random(),y:Math.random(),s:2+r*r*26,v:.004+Math.random()*.016,ph:Math.random()*6.283,tw:.5+Math.random()*1.5,sw:.5+Math.random()*.9,a:.16+Math.random()*.5})}
// The host theme picks the frame: light theme shows the day art, dark theme the
// night art. The host pushes it as {type:'dcb-background-theme',theme:'light'|'dark'};
// without that message the OS colour scheme is only a fallback.
function applyTheme(dark){
  var first=!themeSeen;
  themeSeen=true;target=dark?1:0;
  if(first||reduced.matches||loaded<2){phase=target;if(loaded>=2)compose();if(reduced.matches)paintStatic()}
}
function fitCover(){
  var iw=day.naturalWidth||1672,ih=day.naturalHeight||941,s=Math.max(base.width/iw,base.height/ih);
  fit={x:(base.width-iw*s)/2,y:(base.height-ih*s)/2,w:iw*s,h:ih*s};
}
function buildSpark(){
  var size=64,c=document.createElement('canvas'),g=c.getContext('2d');
  c.width=c.height=size;
  var cr=Math.round(255-(255-178)*phase),cg=Math.round(226-(226-214)*phase),cb=Math.round(178+(255-178)*phase);
  var grad=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  grad.addColorStop(0,'rgba('+cr+','+cg+','+cb+',.95)');
  grad.addColorStop(.32,'rgba('+cr+','+cg+','+cb+',.32)');
  grad.addColorStop(1,'rgba('+cr+','+cg+','+cb+',0)');
  g.fillStyle=grad;g.fillRect(0,0,size,size);
  return c;
}
function paintStatic(){
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#081226';ctx.fillRect(0,0,W,H);
  if(loaded>=2)ctx.drawImage(base,M,M,W,H,0,0,W,H);
}
function paint(){
  if(reduced.matches||loaded<2){paintStatic();return}
  var sx=M+tx,sy=M+ty,horizon=fit.y+fit.h*HORIZON-sy;
  var cr=Math.round(255-(255-198)*phase),cg=Math.round(244-(244-226)*phase),cb=Math.round(214+(255-214)*phase);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  ctx.drawImage(base,sx,sy,W,H,0,0,W,H);
  var top=horizon>0?horizon:0,j=0;
  if(horizon<H-2){
    var water=H-top,rows=Math.max(12,Math.min(40,Math.round(water/24))),bh=water/rows;
    // Per-scanline displacement: calm at the horizon, wider swells near the viewer.
    for(j=0;j<rows;j++){
      var y=top+j*bh,d=(y-top)/water,amp=1.1+19*d*d;
      var dx=Math.sin(y*.05+t*1.7)*amp*.62+Math.sin(y*.019-t*1.05+1.7)*amp*.5;
      var dy=Math.sin(y*.031+t*1.35+.6)*d*3.1;
      ctx.drawImage(base,sx+dx,sy+top+j*bh+dy,W,bh+1,0,y,W,bh+1);
    }
    var sheen=ctx.createLinearGradient(0,horizon-52,0,horizon+64);
    var glow=.06+.15*phase;
    sheen.addColorStop(0,'rgba('+cr+','+cg+','+cb+',0)');
    sheen.addColorStop(.44,'rgba('+cr+','+cg+','+cb+','+glow+')');
    sheen.addColorStop(1,'rgba('+cr+','+cg+','+cb+',0)');
    ctx.fillStyle=sheen;ctx.fillRect(0,horizon-52,W,116);
    // Rings spreading from the reflection on the water.
    var cx=W*.795,cy=horizon+water*.075;
    for(j=0;j<3;j++){
      var p=(t*.13+j/3)%1;
      ctx.strokeStyle='rgba('+cr+','+cg+','+cb+','+(.16*(1-p))+')';
      ctx.lineWidth=Math.max(1,W/1400);
      ctx.beginPath();ctx.ellipse(cx,cy,(28+p*230)*(W/1440),(5+p*44)*(W/1440),0,0,6.2832);ctx.stroke();
    }
  }
  if(spark){
    ctx.globalCompositeOperation='lighter';
    for(i=0;i<motes.length;i++){
      var m=motes[i],my=((m.y-t*m.v)%1+1)%1,mx=m.x+Math.sin(t*m.sw+m.ph)*.018;
      var size=m.s*(1+.14*Math.sin(t*m.tw+m.ph));
      ctx.globalAlpha=Math.min(.85,m.a*(.35+.65*Math.abs(Math.sin(t*m.tw*.85+m.ph)))*(.55+.45*phase));
      ctx.drawImage(spark,mx*W+tx*2.2-size/2,my*H+ty*1.6-size/2,size,size);
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
}
function compose(){
  if(loaded<2)return;
  bctx.globalAlpha=1;bctx.globalCompositeOperation='source-over';
  bctx.fillStyle='#081226';bctx.fillRect(0,0,base.width,base.height);
  bctx.drawImage(day,fit.x,fit.y,fit.w,fit.h);
  if(phase>.002){bctx.globalAlpha=phase;bctx.drawImage(night,fit.x,fit.y,fit.w,fit.h);bctx.globalAlpha=1}
  spark=buildSpark();phaseDrawn=phase;
  if(reduced.matches)paintStatic();
}
function resize(){
  var dpr=Math.min(window.devicePixelRatio||1,1.25);
  W=Math.max(1,Math.round(innerWidth*dpr));H=Math.max(1,Math.round(innerHeight*dpr));
  M=Math.round(Math.min(W,H)*.055);
  canvas.width=W;canvas.height=H;
  base.width=W+M*2;base.height=H+M*2;
  fitCover();phaseDrawn=-1;
  if(loaded>=2){phase=target;compose()}
  // Paint the first frame synchronously so a throttled or paused frame clock
  // still shows the artwork instead of a blank canvas.
  if(reduced.matches||loaded<2)paintStatic();else paint();
}
function loop(now){
  raf=requestAnimationFrame(loop);
  if(reduced.matches||loaded<2)return;
  if(now-last<33)return;
  var dt=Math.min(.1,(now-last)/1000);last=now;
  t+=dt;
  if(phase!==target){phase+=(target-phase)*Math.min(1,dt*4);if(Math.abs(target-phase)<.002)phase=target}
  if(phaseDrawn<0||Math.abs(phase-phaseDrawn)>.02){compose()}
  tx+=((px-.5)*16-tx)*Math.min(1,dt*5);
  ty+=((py-.5)*12-ty)*Math.min(1,dt*5);
  paint();
}
function onReduced(){
  cancelAnimationFrame(raf);raf=0;
  if(reduced.matches){phase=target;compose();paintStatic()}
  else{last=0;raf=requestAnimationFrame(loop)}
}
function onArt(){
  if(++loaded<2)return;
  resize();
  if(!reduced.matches&&!raf){last=0;raf=requestAnimationFrame(loop)}
}
day.onload=night.onload=onArt;
day.src=DAY;night.src=NIGHT;
addEventListener('resize',resize);
if(window.ResizeObserver)new ResizeObserver(resize).observe(document.documentElement);
addEventListener('pointermove',function(e){px=e.clientX/(innerWidth||1);py=e.clientY/(innerHeight||1)},{passive:true});
addEventListener('message',function(e){
  if(e.source!==parent||!e.data)return;
  var d=e.data;
  if(d.type==='dcb-background-pointer'){px=Number(d.x)||0;py=Number(d.y)||0}
  else if(d.type==='dcb-background-theme')applyTheme(d.theme==='dark')
});
if(reduced.addEventListener)reduced.addEventListener('change',onReduced);
else if(reduced.addListener)reduced.addListener(onReduced);
if(scheme.addEventListener)scheme.addEventListener('change',function(e){if(!themeSeen){target=e.matches?1:0;phase=target;if(loaded>=2)compose();if(reduced.matches)paintStatic()}});
target=scheme.matches?1:0;phase=target;
resize();
})();
</script>`

let posterTask=null
// Settings thumbnail: night base with the day frame mixed in at dusk strength.
export function mirrorSeaPoster(){
  if(posterTask)return posterTask
  posterTask=new Promise(resolve=>{
    const canvas=document.createElement('canvas'),width=480,height=270
    canvas.width=width;canvas.height=height
    const ctx=canvas.getContext('2d'),day=new Image(),night=new Image()
    let done=0
    const draw=()=>{
      if(++done<2)return
      const iw=day.naturalWidth||1672,ih=day.naturalHeight||941,scale=Math.max(width/iw,height/ih)
      const x=(width-iw*scale)/2,y=(height-ih*scale)/2
      ctx.fillStyle='#081226';ctx.fillRect(0,0,width,height)
      ctx.drawImage(night,x,y,iw*scale,ih*scale)
      ctx.globalAlpha=.42;ctx.drawImage(day,x,y,iw*scale,ih*scale);ctx.globalAlpha=1
      let url=''
      try{url=canvas.toDataURL('image/webp',.72)}catch{url=''}
      resolve(url)
    }
    day.onload=draw;night.onload=draw;day.onerror=night.onerror=()=>resolve('')
    day.src=dayArt;night.src=nightArt
  })
  return posterTask
}
