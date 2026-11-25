// Expanded native sidebar width across DSH layouts. Older layouts size the
// sidebar slot root inline; current ones render that root as display:contents,
// so neither its style nor its box carries a width. Read what the host itself
// publishes on the frame first: the Windows titlebar variable, then the first
// inline grid track (overlay CSS overrides the track, not the inline value).
export const NATIVE_SIDEBAR_WIDTH='--dsh-windows-sidebar-width'

function positivePixels(value){
  const match=/^\s*(\d+(?:\.\d+)?)px\s*$/.exec(value||'')
  return match&&Number(match[1])>0?Number(match[1]):null
}

export function nativeSidebarWidth(frame,root,{allowMeasured=true}={}){
  const published=positivePixels(frame?.style?.getPropertyValue(NATIVE_SIDEBAR_WIDTH))
  if(published>0)return published
  const track=/^\s*(\d+(?:\.\d+)?)px(?:\s|$)/.exec(frame?.style?.gridTemplateColumns||'')
  if(track&&+track[1]>0)return +track[1]
  const inline=positivePixels(root?.style?.width)
  if(inline>0)return inline
  // A measured width inside our overlay may come from our own fixed track.
  const box=allowMeasured?root?.getBoundingClientRect?.().width:null
  return box>0?box:null
}
