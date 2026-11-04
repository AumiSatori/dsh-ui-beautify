// Reads the host whale from a rendered logo node for the cube opening; the
// opening never draws a substitute. Kept apart from the scene so the
// early-opening launcher does not bundle it.
const PATH=/^[MmLlHhVvCcSsQqTtAaZz\d\s.,eE+-]+$/,BOX=/^[-\d.\s]+$/
export function cubeLogo(node){
  const svg=node?.matches?.('svg')?node:node?.querySelector?.('svg'),path=svg?.querySelector('path')
  const viewBox=svg?.getAttribute('viewBox')||'',d=path?.getAttribute('d')||''
  return BOX.test(viewBox)&&PATH.test(d)?{viewBox,path:d}:null
}
