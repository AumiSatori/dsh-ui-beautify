import {test} from 'node:test'
import assert from 'node:assert/strict'
import {deepenInk,inkContrast,inkLuminance,backgroundInkCss} from '../src/background-ink.js'
import {normalizeBackground,themeBackground,backgroundThemeSelection} from '../src/background-media.js'

const PAPER=[255,255,255],MID=[150,150,150],DARK=[16,16,16],GREY=[138,147,163],BODY=[15,17,21]

test('luminance and contrast follow the readable-ratio definition',()=>{
  assert.equal(Math.round(inkLuminance([0,0,0])*1000),0)
  assert.equal(Math.round(inkLuminance([255,255,255])*1000),1000)
  assert.equal(Math.round(inkContrast(inkLuminance(PAPER),inkLuminance([0,0,0]))*100)/100,21)
  assert.equal(inkContrast(inkLuminance(MID),inkLuminance(MID)),1)
})

test('a muted grey over a bright picture is deepened until it clears the ratio',()=>{
  const background=inkLuminance(PAPER),before=inkContrast(inkLuminance(GREY),background)
  assert.ok(before<4.5,'the fixture starts below the readable ratio')
  const after=deepenInk(GREY,4.5,background,true)
  assert.ok(inkContrast(inkLuminance(after),background)>=4.5)
  // Deepening is the smallest change that works: hue survives, nothing turns black.
  assert.ok(after[0]>0&&after[2]>after[0])
})

test('light ink on the dark theme only brightens until it clears the ratio',()=>{
  const background=inkLuminance(DARK)
  assert.ok(inkContrast(inkLuminance(BODY),background)<4.5)
  const lifted=deepenInk(BODY,7,background,false)
  assert.ok(inkContrast(inkLuminance(lifted),background)>=7)
  assert.ok(lifted.every((value,index)=>value>BODY[index]))
})

test('dark ink never turns light: over a dark picture it goes as deep as it can',()=>{
  const background=inkLuminance(DARK)
  const deepened=deepenInk(GREY,7,background,true)
  assert.ok(deepened.every((value,index)=>value<=GREY[index]))
  assert.deepEqual(deepened,[0,0,0])
})

test('already readable ink is returned untouched',()=>{
  const background=inkLuminance(PAPER)
  assert.deepEqual(deepenInk(BODY,7,background,true),BODY)
  assert.deepEqual(deepenInk([60,70,90],4.5,background,true),[60,70,90])
})

test('a limit keeps corrected muted ink from reaching the body text',()=>{
  const background=inkLuminance([255,255,255]),body=inkLuminance([17,17,17]),limit=(body+.05)*1.25-.05
  // Pure black would clear 21:1, but that would match the body text; it stops at the limit.
  const capped=deepenInk(GREY,21,background,true,limit)
  assert.ok(inkLuminance(capped)>=limit-1e-3)
  assert.ok(inkLuminance(capped)<inkLuminance(GREY))
})

test('a hopeless background still returns the strongest available ink',()=>{
  const background=inkLuminance([120,120,120])
  const deepest=deepenInk(GREY,21,background,true)
  assert.deepEqual(deepest,[0,0,0])
})

test('the correction is on by default and can be switched off per theme',()=>{
  assert.equal(normalizeBackground({}).backgroundInk,true)
  assert.equal(normalizeBackground({backgroundInk:false}).backgroundInk,false)
  const light=backgroundThemeSelection({},'light',{revision:'day',name:'日间'})
  assert.equal(themeBackground(light,'light').backgroundInk,true)
  const off={...light,backgroundThemes:{...light.backgroundThemes,light:{...light.backgroundThemes.light,backgroundInk:false}}}
  assert.equal(themeBackground(off,'light').backgroundInk,false)
  assert.equal(themeBackground(off,'dark').backgroundInk,true)
})

test('the style sheet only touches rows that were actually corrected',()=>{
  assert.ok(backgroundInkCss.includes('data-dcb-auto-ink'))
  assert.equal(backgroundInkCss.includes('body {'),false)
  // Code blocks fall back to the host's own ink, and body text gets no rim.
  assert.ok(backgroundInkCss.includes('.md-code-block')&&backgroundInkCss.includes('--dsw-alias-label-secondary:var(--dcb-ink-host-secondary)'))
  assert.equal(backgroundInkCss.includes('text-shadow'),false)
  assert.equal(backgroundInkCss.includes('label-primary'),false)
})

test('a row in the middle of the screen is measured against the picture behind it',async()=>{
  const {createBackgroundInk}=await import('../src/background-ink.js')
  // A 960x540 picture: left half black, right half white, shown full-bleed on a 960x540 screen.
  const listeners={},rowRect={left:600,right:900,top:200,bottom:240,width:300,height:40}
  const row={getBoundingClientRect:()=>rowRect,getClientRects:()=>[rowRect],children:[],style:{props:{},setProperty(k,v){this.props[k]=v},removeProperty(k){delete this.props[k]}},setAttribute(){},removeAttribute(){},isConnected:true}
  const flow={children:[row]}
  const pixels=(w,h)=>{const data=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=x<w/2?0:255,i=(y*w+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255}return data}
  const canvas={width:0,height:0,getContext:()=>({drawImage(){},getImageData:(x,y,w,h)=>({data:pixels(w,h)}),set fillStyle(v){this._f=v},get fillStyle(){return this._f}})}
  const doc={createElement:()=>canvas,querySelectorAll:s=>s==='[data-chat-flow]'?[flow]:[],documentElement:{},body:{hasAttribute:()=>false},addEventListener(){},removeEventListener(){}}
  const win={innerHeight:540,performance:{now:()=>1e6},requestAnimationFrame:()=>0,cancelAnimationFrame(){},setTimeout:()=>0,clearTimeout(){},addEventListener(){},removeEventListener(){},
    getComputedStyle:el=>el===doc.body?{color:'#111111',backgroundColor:'#ffffff',getPropertyValue:name=>name.endsWith('primary')?'#111111':'#999999'}:{backgroundColor:'#ffffff'}}
  const media={naturalWidth:960,naturalHeight:540,getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})}
  const ink=createBackgroundInk(doc,win,()=>({media,kind:'image',fit:'cover',position:'center',opacity:1}))
  ink.refresh()
  // Over the white half the muted grey is deepened, body text is left alone,
  // and the muted ink stays visibly lighter than the body copy.
  assert.equal(ink.active,true)
  assert.equal(row.style.props['--dsw-alias-label-primary'],undefined)
  // The host colour is kept beside the correction so code blocks can restore it.
  assert.equal(row.style.props['--dcb-ink-host-secondary'],'rgb(153, 153, 153)')
  const secondary=row.style.props['--dsw-alias-label-secondary'].match(/\d+/g).map(Number)
  assert.ok(inkLuminance(secondary)<inkLuminance([153,153,153]),'the muted ink was deepened')
  assert.ok(inkContrast(inkLuminance(secondary),inkLuminance([17,17,17]))>=1.24,'it stays distinguishable from body text')
  ink.dispose()
})
