const bounded=(v,min,max,fallback)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback
export function normalizeParticles(value){
  const start=Math.round(bounded(value?.particleStart,0,95,0))
  return{
    particleEnabled:value?.particleEnabled!==false,
    particleShape:['logo','whale','custom'].includes(value?.particleShape)?value.particleShape:'logo',
    particleCount:Math.round(bounded(value?.particleCount,500,10000,6400)/100)*100,
    particleStart:start,particleFull:Math.round(bounded(value?.particleFull,start+1,100,80)),
    particleSvgRevision:typeof value?.particleSvgRevision==='string'?value.particleSvgRevision.slice(0,100):'',
    particleSvgName:typeof value?.particleSvgName==='string'?value.particleSvgName.slice(0,160):'',
  }
}
// Same numerator precedence, integer rounding and clamp as the host ContextMeter.
export function particleOccupancy(pressure){
  const used=pressure?.projectedTokens??pressure?.pressureTokens,capacity=pressure?.contextWindow
  if(!Number.isFinite(used)||used<0||!Number.isFinite(capacity)||capacity<=0)return null
  return Math.max(0,Math.min(100,Math.round(used/capacity*100)))
}
export function particleProgress(percent,start,full){return percent===null?0:Math.max(0,Math.min(1,(percent-start)/(full-start)))}
