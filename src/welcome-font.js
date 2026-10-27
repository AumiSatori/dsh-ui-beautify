// Derive short pen paths from a small, local glyph raster. The final ink is the
// native font itself, clipped by those paths; no font file or glyph is shipped.
import {normalizeWelcomeCode} from './welcome-code-modes.js'
let artId=0
export const WELCOME_TEXT_LIMIT=32
export const welcomeDefaults=Object.freeze({welcomeEnabled:true,welcomeText:'Deepseek Harness',welcomeFont:'Lolita',welcomeDuration:1700,welcomeLogo:true,welcomeMode:'characters',welcomeMediaFit:'contain',welcomeWindowScale:true,welcomeMediaDuration:3000,welcomeMediaRevision:'',welcomeCodeDuration:3000,welcomeCodeInteractive:false,welcomeCodeModes:Object.freeze({timed:Object.freeze({revision:'',name:''}),interactive:Object.freeze({revision:'',name:''})}),welcomeCodeRevision:'',welcomeCodeName:'',welcomeCharacters:'DEEPSEEK HARNESS <> {} / * + ='})
export function normalizeWelcome(value){
  const clean=(text,max,fallback)=>typeof text==='string'?[...text.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim()].slice(0,max).join('')||fallback:fallback
  return {welcomeEnabled:typeof value?.welcomeEnabled==='boolean'?value.welcomeEnabled:true,
    welcomeText:clean(value?.welcomeText,WELCOME_TEXT_LIMIT,welcomeDefaults.welcomeText),welcomeFont:clean(value?.welcomeFont,80,welcomeDefaults.welcomeFont),
    welcomeDuration:Number.isFinite(value?.welcomeDuration)?Math.round(Math.min(4000,Math.max(900,value.welcomeDuration))):1700,
    welcomeLogo:value?.welcomeLogo!==false,welcomeMode:value?.welcomeMode==='text'?'characters':['media','code','characters'].includes(value?.welcomeMode)?value.welcomeMode:'characters',welcomeMediaFit:value?.welcomeMediaFit==='cover'?'cover':'contain',
    welcomeWindowScale:value?.welcomeWindowScale!==false,
    welcomeMediaDuration:Number.isFinite(value?.welcomeMediaDuration)?Math.round(Math.min(10000,Math.max(1000,value.welcomeMediaDuration))):3000,
    welcomeMediaRevision:clean(value?.welcomeMediaRevision,80,''),welcomeCodeDuration:Number.isFinite(value?.welcomeCodeDuration)?Math.round(Math.min(15000,Math.max(1000,value.welcomeCodeDuration))):3000,
    ...normalizeWelcomeCode(value),welcomeCharacters:clean(value?.welcomeCharacters,64,welcomeDefaults.welcomeCharacters)}
}

// Zhang-Suen thinning, bounded by a 128px glyph and 24 passes. Paths are a
// drawing approximation, not Chinese stroke-order data from the font.
export function traceInk(alpha,width,height){
  const ink=Uint8Array.from(alpha,value=>value>48?1:0),thin=ink.slice(),radius=new Float32Array(ink.length)
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const i=y*width+x
    if(ink[i])radius[i]=1+Math.min(radius[i-1],radius[i-width],radius[i-width-1])
  }
  for(let y=height-2;y>0;y--)for(let x=width-2;x>0;x--){const i=y*width+x;if(ink[i])radius[i]=Math.min(radius[i],1+Math.min(radius[i+1],radius[i+width],radius[i+width+1]))}
  for(let pass=0;pass<24;pass++){
    let changed=0
    for(let step=0;step<2;step++){
      const remove=[]
      for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
        const i=y*width+x;if(!thin[i])continue
        const p=[thin[i-width],thin[i-width+1],thin[i+1],thin[i+width+1],thin[i+width],thin[i+width-1],thin[i-1],thin[i-width-1]],sum=p.reduce((a,b)=>a+b,0)
        if(sum<2||sum>6)continue
        let changes=0;for(let n=0;n<8;n++)if(!p[n]&&p[(n+1)%8])changes++
        if(changes!==1)continue
        if(step===0?p[0]*p[2]*p[4]||p[2]*p[4]*p[6]:p[0]*p[2]*p[6]||p[0]*p[4]*p[6])continue
        remove.push(i)
      }
      for(const i of remove)thin[i]=0
      changed+=remove.length
    }
    if(!changed)break
  }
  const neighbors=i=>{
    const result=[],x=i%width,y=Math.floor(i/width)
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy||x+dx<0||x+dx>=width||y+dy<0||y+dy>=height)continue
      const next=i+dy*width+dx
      if(thin[next]&&!(dx&&dy&&(thin[i+dx]||thin[i+dy*width])))result.push(next)
    }
    return result
  }
  const points=[];for(let i=0;i<thin.length;i++)if(thin[i])points.push(i)
  const graph=new Map(points.map(i=>[i,neighbors(i)])),used=new Set(),edge=(a,b)=>a<b?a*thin.length+b:b*thin.length+a
  const available=i=>graph.get(i).filter(next=>!used.has(edge(i,next))),paths=[]
  // Endpoints first; preserve direction across a crossing before lifting pen.
  const ordered=[...points.filter(i=>graph.get(i).length===1),...points]
  for(const start of ordered){
    if(paths.length>=48)break
    while(available(start).length&&paths.length<48){
      const chain=[start];let current=start,previous=null,maxRadius=radius[start]
      for(let count=0;count<2048;count++){
        const nexts=available(current);if(!nexts.length)break
        const dx=previous===null?1:current%width-previous%width,dy=previous===null?1:Math.floor(current/width)-Math.floor(previous/width)
        nexts.sort((a,b)=>{
          const score=n=>{const x=n%width-current%width,y=Math.floor(n/width)-Math.floor(current/width);return(dx*x+dy*y)/Math.hypot(x,y)}
          return score(b)-score(a)
        })
        const next=nexts[0];used.add(edge(current,next));previous=current;current=next;chain.push(next);maxRadius=Math.max(maxRadius,radius[next])
      }
      if(chain.length>2)paths.push({points:chain.map(i=>[i%width,Math.floor(i/width)]),width:Math.max(5,maxRadius*2.8+2)})
    }
  }
  // Tiny dots use a short round stroke. The final mask also settles any edges.
  for(const i of points)if(!graph.get(i).length&&paths.length<48)paths.push({points:[[i%width,Math.floor(i/width)],[i%width+.1,Math.floor(i/width)]],width:Math.max(5,radius[i]*3+2)})
  return paths
}

export function createFontWelcomeArt(doc,options){
  const {welcomeText,welcomeFont}=normalizeWelcome(options),ns='http://www.w3.org/2000/svg'
  const make=(name,attrs={})=>{const node=doc.createElementNS(ns,name);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);return node}
  const svg=make('svg',{'aria-hidden':'true','data-dcb-welcome-art':'','data-welcome-font':welcomeFont}),defs=make('defs'),strokes=[],finishes=[]
  svg.append(defs)
  const canvas=doc.createElement('canvas');canvas.width=160;canvas.height=128
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Local font drawing unavailable')
  const family=welcomeFont==='hand'?'KaiTi':welcomeFont,font=`96px ${JSON.stringify(family)}, cursive`
  ctx.font=font
  let x=0
  const cache=new Map()
  for(const char of welcomeText){
    let glyph=cache.get(char)
    if(!glyph){
      ctx.clearRect(0,0,160,128);ctx.font=font;ctx.fillStyle='#000';ctx.fillText(char,12,104)
      const pixels=ctx.getImageData(0,0,160,128).data,alpha=new Uint8Array(160*128)
      for(let i=0;i<alpha.length;i++)alpha[i]=pixels[i*4+3]
      glyph={paths:traceInk(alpha,160,128),advance:Math.min(140,Math.max(24,ctx.measureText(char).width))+12};cache.set(char,glyph)
    }
    const group=make('g',{transform:`translate(${x} 0)`,'data-welcome-character':char}),id=`dcb-welcome-ink-${++artId}`
    const mask=make('mask',{id,maskUnits:'userSpaceOnUse',x:0,y:0,width:160,height:128,style:'mask-type:luminance'})
    for(const line of glyph.paths){
      const path=make('path',{d:line.points.map(([px,py],i)=>`${i?'L':'M'}${px} ${py}`).join(' '),stroke:'#fff',pathLength:1,'data-dcb-welcome-stroke':''})
      path.style.strokeWidth=String(line.width);mask.append(path);strokes.push(path)
    }
    const finish=make('rect',{x:0,y:0,width:160,height:128,fill:'#fff',opacity:0});mask.append(finish);finishes.push(finish);defs.append(mask)
    const text=make('text',{x:12,y:104,'font-size':96,'font-weight':400,fill:'currentColor',mask:`url(#${id})`})
    text.style.fontFamily=`${JSON.stringify(family)}, cursive`;text.textContent=char;group.append(text);svg.append(group);x+=glyph.advance
  }
  svg.setAttribute('viewBox',`0 0 ${Math.max(40,x+12)} 128`)
  return{svg,strokes,finishes}
}

export function playWelcomeInk(art,duration=1700){
  const animations=[],lengths=art.strokes.map(path=>Math.max(12,path.getTotalLength())),total=lengths.reduce((a,b)=>a+b,0)
  let offset=120
  try{
    for(const [index,path]of art.strokes.entries()){
      const time=(duration-220)*lengths[index]/total
      const a=path.animate([{strokeDashoffset:1},{strokeDashoffset:0}],{duration:time,delay:offset,easing:'cubic-bezier(.35,0,.25,1)',fill:'both'})
      a.id=`dcb-startup-ink-${index}`;animations.push(a);offset+=time
    }
    for(const [index,rect]of (art.finishes||[]).entries()){
      const a=rect.animate([{opacity:0},{opacity:1}],{duration:100,delay:duration-100,fill:'both'})
      a.id=`dcb-startup-ink-finish-${index}`;animations.push(a)
    }
    return animations
  }catch(error){for(const a of animations)a.cancel();throw error}
}
