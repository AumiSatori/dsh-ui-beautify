// Original hand-drawn centerlines: 欢 / 迎 / 回 / 来. No font, image, or network
// dependency; pathLength makes every stroke drawable with one small CSS value.
import {createFontWelcomeArt,normalizeWelcome} from './welcome-font.js'
export const welcomeStrokes = [
  [
    'M16 39 Q33 35 50 38 Q43 67 16 91',
    'M19 55 Q34 70 51 88',
    'M77 20 Q70 40 59 49',
    'M70 41 Q89 37 106 40 Q104 49 99 55',
    'M82 50 Q80 83 55 105',
    'M82 67 Q92 93 111 102',
  ],
  [
    'M52 26 Q43 33 34 36',
    'M34 36 L33 75 Q44 73 51 67',
    'M56 28 Q54 56 55 87',
    'M58 33 Q72 30 82 33 L81 69 Q80 79 68 73',
    'M12 29 Q20 32 24 39',
    'M11 54 Q19 51 26 54 Q23 68 18 78',
    'M17 81 Q28 93 46 95 Q76 99 108 93',
  ],
  [
    'M19 27 Q16 65 20 103',
    'M20 27 Q55 23 97 27 Q100 65 95 103',
    'M39 47 Q38 63 39 80',
    'M40 47 Q60 45 77 47 L77 80',
    'M40 80 Q58 78 77 80',
    'M21 103 Q58 105 95 103',
  ],
  [
    'M19 36 Q57 32 99 34',
    'M34 44 Q40 49 44 55',
    'M83 42 Q78 51 71 57',
    'M14 63 Q59 58 106 61',
    'M61 20 Q58 62 60 109',
    'M57 66 Q37 91 12 100',
    'M64 67 Q83 89 109 99',
  ],
]

export function createWelcomeArt(doc,options) {
  const settings=normalizeWelcome(options)
  if(settings.welcomeFont!=='hand'||settings.welcomeText!=='欢迎回来')return createFontWelcomeArt(doc,settings)
  const ns = 'http://www.w3.org/2000/svg'
  const svg = doc.createElementNS(ns, 'svg')
  svg.setAttribute('viewBox', '0 0 540 136')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('data-dcb-welcome-art', '')
  const strokes = []
  for (const [index, paths] of welcomeStrokes.entries()) {
    const group = doc.createElementNS(ns, 'g')
    group.setAttribute('transform', `translate(${index * 136 + 4} 5)`)
    group.setAttribute('data-welcome-character', '欢迎回来'[index])
    group.setAttribute('stroke', 'currentColor')
    for (const d of paths) {
      const path = doc.createElementNS(ns, 'path')
      path.setAttribute('d', d); path.setAttribute('pathLength', '1')
      path.setAttribute('data-dcb-welcome-stroke', '')
      group.append(path); strokes.push(path)
    }
    svg.append(group)
  }
  return {svg, strokes}
}
