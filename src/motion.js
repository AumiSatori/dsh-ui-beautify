// Web approximation informed by Apple's HIG Motion and WWDC23 springs talk.
// These are this plugin's timings, not private iOS/macOS system constants.
// Compile the spring response once; CSS/WAAPI runs it without a JS frame loop.
export function springSamples({ damping = 1, frequency = 8, steps = 40 } = {}) {
  const response = t => {
    if (damping === 1) return 1 - (1 + frequency * t) * Math.exp(-frequency * t)
    const w = frequency * Math.sqrt(1 - damping * damping)
    return 1 - Math.exp(-damping * frequency * t) * (Math.cos(w * t) + damping * frequency / w * Math.sin(w * t))
  }
  const end = response(1)
  return Array.from({ length: steps + 1 }, (_, index) => index === 0 ? 0 : index === steps ? 1 : response(index / steps) / end)
}
const curve = values => `linear(${values.map(value => Number(value.toFixed(5))).join(',')})`
const linear = typeof CSS !== 'undefined' && CSS.supports?.('animation-timing-function', 'linear(0, 1)')
export const motion = Object.freeze({
  time: Object.freeze({ quick: 180, control: 220, material: 240, standard: 280, scene: 300, sidebar: 500 }),
  ease: Object.freeze({
    smooth: linear ? curve(springSamples()) : 'cubic-bezier(.22,.8,.26,1)',
    snappy: linear ? curve(springSamples({ damping: .86, frequency: 9 })) : 'cubic-bezier(.2,.8,.25,1)',
    exit: 'cubic-bezier(.4,0,.8,1)',
    color: 'cubic-bezier(.25,.1,.25,1)',
  }),
  stagger: 24,
  blur: 2,
})
