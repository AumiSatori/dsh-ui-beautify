let nextId=0
const NS='http://www.w3.org/2000/svg'
// Reuse the host's exact brand silhouette. Only the character rows are drawn;
// no bitmap or solid logo is placed behind the mask.
export function createCharacterWelcomeArt(doc,logoNode,characters='DEEPSEEK HARNESS <> {} / * + ='){
  const native=logoNode?.matches?.('svg')?logoNode:logoNode?.querySelector?.('svg')
  if(!native)return null
  const make=(name,attrs={})=>{const el=doc.createElementNS(NS,name);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,String(value));return el}
  const svg=make('svg',{viewBox:'0 0 640 420','aria-hidden':'true','data-dcb-welcome-character-logo':''}),defs=make('defs'),id=`dcb-welcome-characters-${++nextId}`
  const mask=make('mask',{id,maskUnits:'userSpaceOnUse',x:0,y:0,width:640,height:420,style:'mask-type:alpha'})
  const silhouette=native.cloneNode(true);silhouette.setAttribute('x','20');silhouette.setAttribute('y','20');silhouette.setAttribute('width','600');silhouette.setAttribute('height','380');silhouette.style.color='#fff';silhouette.setAttribute('preserveAspectRatio','xMidYMid meet');mask.append(silhouette);defs.append(mask);svg.append(defs)
  const group=make('g',{mask:`url(#${id})`,fill:'currentColor','font-family':'ui-monospace,Consolas,monospace','font-size':10.5,'font-weight':600}),rows=[]
  const seed=[...String(characters).replace(/[\u0000-\u001f\u007f]/g,' ').trim()].slice(0,64).join('')||'DEEPSEEK HARNESS <> {} / * + ='
  for(let row=0;row<33;row++){
    const text=make('text',{x:-20,y:row*13+10,'data-dcb-character-row':''});text.textContent=(seed+' ').repeat(Math.ceil(110/(seed.length+1)));group.append(text);rows.push(text)
  }
  svg.append(group)
  return{svg,rows}
}
export function playCharacterWelcome(art,duration=1700){
  const animations=[]
  try{for(const [i,row]of art.rows.entries()){
    const delay=i*duration*.42/art.rows.length
    const animation=row.animate([{opacity:0,transform:`translateX(${i%2?-12:12}px)`},{opacity:.65,offset:.4},{opacity:1,transform:'translateX(0px)'}],{duration:Math.max(300,duration-delay),delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'})
    animation.id=`dcb-startup-characters-${i}`;animations.push(animation)
  }return animations}catch(error){for(const animation of animations)animation.cancel();throw error}
}
