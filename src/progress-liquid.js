import {motion} from './motion.js'

// Let the bead leave its old seat before the three-row window follows it.
const stops = [[0,0],[.3,0],[.5,.12],[.68,.62],[.84,.9],[1,1]]
const sampledRoll = typeof CSS !== 'undefined' && CSS.supports?.('animation-timing-function','linear(0, 1)')
export const progressRollEase = sampledRoll ? `linear(${stops.map(([t,p]) => `${p} ${t*100}%`).join(',')})` : motion.ease.smooth
export function progressRollProgress(t) {
  const i = Math.max(1, stops.findIndex(([end]) => end >= t))
  const [a,p] = stops[i-1], [b,q] = stops[i]
  return p + (q-p) * (t-a) / (b-a)
}

// Four compatible cubic segments: round bead -> tapered falling drop -> landing.
function dropPath(x, y, rx, ry, tail, direction) {
  const k = .55228475, at = offset => y+offset*direction, top = at(-ry-tail)
  return `M${x} ${top} C${x+rx*k} ${top} ${x+rx} ${at(-ry*k)} ${x+rx} ${y} C${x+rx} ${at(ry*k)} ${x+rx*k} ${at(ry)} ${x} ${at(ry)} C${x-rx*k} ${at(ry)} ${x-rx} ${at(ry*k)} ${x-rx} ${y} C${x-rx} ${at(-ry*k)} ${x-rx*k} ${top} ${x} ${top} Z`
}
export const progressDropPath = (x,y,wave=0,squash=0,direction=1) => dropPath(x,y,4-wave*.4+squash*1.7,4+wave*2.4-squash*1.2,wave*12,direction)

export function createProgressLiquid(doc, win) {
  const preference = win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)')
  let snapshot = null, flight = null, disposed = false
  const stop = () => {
    const old = flight; flight = null
    if (!old) return
    old.animation.cancel(); old.svg.remove()
    for (const node of old.hidden) node.removeAttribute('data-dcb-flow-hidden')
    old.layer.removeAttribute('data-dcb-liquid-active')
  }
  const changed = () => { if (preference.matches) stop() }
  const resized = () => { stop(); snapshot = null }
  preference.addEventListener('change', changed)
  win.addEventListener('resize', resized)
  function sync({layer, host, list, context, plan, todos, active, manual = false}) {
    if (disposed) return
    const index = todos.findIndex(item => item.status === 'in_progress')
    if (!active || manual || !layer || !host || !list || !host.getClientRects().length || host.closest('[inert], [aria-hidden="true"]')) {
      stop(); snapshot = null; return
    }
    const before = snapshot, samePlan = before?.context === context && before.plan === plan
    const target = list.querySelector(`.dcb-step[data-step-index="${index}"] .dcb-status`)
    const bounds = host.getBoundingClientRect(), scaleX = bounds.width/host.offsetWidth || 1, scaleY = bounds.height/host.offsetHeight || 1
    const rect = target?.getBoundingClientRect()
    const listY = new win.DOMMatrixReadOnly(win.getComputedStyle(list).transform).m42
    const point = rect ? {x:(rect.left+rect.width/2-bounds.left)/scaleX, y:(rect.top+rect.height/2-bounds.top)/scaleY-listY} : null
    if (index < 0) {
      // Some hosts publish completion and the next activation in two writes.
      if (!samePlan || todos.every(item => item.status === 'completed')) { stop(); snapshot = null }
      return
    }
    snapshot = {context, plan, index, point}
    if (!samePlan || before.index === index || !before.point || !point || preference.matches) {
      if (!samePlan || preference.matches) stop()
      return
    }
    const roll = list.getAnimations().find(a => a.id === 'dcb-step-roll-in')
    if (roll && !sampledRoll) { stop(); return }
    const rollY = roll ? new win.DOMMatrixReadOnly(roll.effect.getKeyframes()[0].transform).m42 : 0
    let from = before.point, firstPath = null, shape = null
    if (flight) {
      firstPath = win.getComputedStyle(flight.path).d
      const n = firstPath.match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi)?.map(Number)
      if (n?.length >= 14) {
        from = {x:n[0], y:n[7]}
        shape = {rx:n[6]-n[0],ry:Math.abs(n[13]-n[7]),tail:Math.max(0,Math.abs(n[7]-n[1])-Math.abs(n[13]-n[7])),direction:Math.sign(n[13]-n[7])||1}
      }
    }
    stop()
    const height = host.offsetHeight
    if (from.y < -16 || from.y > height+16 || point.y < -16 || point.y > height+16) return
    const svg = doc.createElementNS('http://www.w3.org/2000/svg','svg')
    svg.setAttribute('class','dcb-progress-liquid'); svg.setAttribute('aria-hidden','true')
    svg.setAttribute('viewBox',`0 0 ${host.offsetWidth} ${height}`)
    svg.style.color = win.getComputedStyle(target).color
    const path = doc.createElementNS(svg.namespaceURI,'path')
    path.setAttribute('fill','currentColor'); path.setAttribute('d',progressDropPath(from.x,from.y))
    svg.append(path); layer.append(svg)
    const direction = Math.sign(point.y+rollY-from.y) || 1
    const frames = Array.from({length:31},(_,i) => {
      const t = i/30, q = Math.min(1,t/.65), p = q*q*(3-2*q)
      const y = from.y + (point.y+rollY-from.y)*p - rollY*progressRollProgress(t)
      const wave = Math.sin(Math.PI*p), squash = t > .7 ? Math.sin(Math.PI*(t-.7)/.3) : 0
      const rx=4-wave*.4+squash*1.7+(shape ? (shape.rx-4)*(1-p) : 0), ry=4+wave*2.4-squash*1.2+(shape ? (shape.ry-4)*(1-p) : 0)
      const tail=Math.min(16,wave*12+(shape?.tail||0)*(1-p))
      return {offset:t,d:i===0 && firstPath ? firstPath : `path('${dropPath(from.x+(point.x-from.x)*p,y,rx,ry,tail,shape && p<.5 ? shape.direction : direction)}')`}
    })
    if (!win.CSS?.supports?.('d',frames.at(-1).d)) { svg.remove(); return }
    const hidden = [target]
    target.setAttribute('data-dcb-flow-hidden','')
    // A rolling exit layer contains a frozen copy; hide its active decoration too.
    for (const dot of host.querySelectorAll('.dcb-step-ghost .dcb-step[data-status="in_progress"] .dcb-status')) { dot.setAttribute('data-dcb-flow-hidden',''); hidden.push(dot) }
    layer.setAttribute('data-dcb-liquid-active','')
    try {
      const animation = path.animate(frames,{id:'dcb-progress-liquid',duration:motion.time.scene,easing:'linear',fill:'both'})
      const job = {animation,svg,path,layer,hidden}; flight = job
      animation.finished.then(() => { if (flight===job) stop() },() => {})
    } catch { svg.remove(); for (const node of hidden) node.removeAttribute('data-dcb-flow-hidden'); layer.removeAttribute('data-dcb-liquid-active') }
  }
  return {sync,dispose(){disposed=true;stop();snapshot=null;preference.removeEventListener('change',changed);win.removeEventListener('resize',resized)}}
}
