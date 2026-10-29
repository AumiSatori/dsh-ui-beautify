// The wallpaper sits directly behind plain message text, so a bright or busy
// picture can swallow the host's muted greys. This samples the picture under
// each chat row and deepens only the muted label colours that row needs:
// body text and the image stay untouched, readable rows keep their original
// ink, and nothing is written until a row really falls below the readable ratio.

// Body copy (primary) is never rewritten; only secondary ink is corrected.
const LABELS = ['secondary', 'tertiary', 'caption']
const TARGET = { secondary: 5.5, tertiary: 4.5, caption: 4.5 }
// Corrected muted ink stays at least this ratio away from the body text, so
// the two never become indistinguishable.
const HIERARCHY = 1.25
const MARK = 'data-dcb-auto-ink'
const GRID = 96
const CELLS = 420
const POSITION = { center: [.5, .5], top: [.5, 0], bottom: [.5, 1], left: [0, .5], right: [1, .5] }

// Code blocks keep the host's own ink: inside them the row's correction is
// undone back to the colours the host had before this feature touched the row.
const CODE = 'pre,code,.md-code-block,[data-code-block-banner],[data-code-block-content]'
export const backgroundInkCss = `
  body[data-dcb-background] [${MARK}] :is(${CODE}) { ${LABELS.map(label => `--dsw-alias-label-${label}:var(--dcb-ink-host-${label});`).join(' ')} }
`

const channel = value => { const v = value / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }
export const inkLuminance = ([r, g, b]) => .2126 * channel(r) + .7152 * channel(g) + .0722 * channel(b)
export const inkContrast = (a, b) => { const hi = Math.max(a, b), lo = Math.min(a, b); return (hi + .05) / (lo + .05) }
const mix = ([r, g, b], amount, dark) => dark
  ? [r * amount, g * amount, b * amount]
  : [r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount]

// Move one colour towards black (dark ink) or white until it clears `target`.
// The search returns the smallest change that works, so untouched rows stay so.
// `limit` is a luminance the colour may not pass (the body text's hierarchy).
export function deepenInk(color, target, background, dark, limit = null) {
  if (inkContrast(inkLuminance(color), background) >= target) return color
  let need = dark ? (background + .05) / target - .05 : target * (background + .05) - .05
  if (limit !== null) need = dark ? Math.max(need, limit) : Math.min(need, limit)
  let low = 0, high = 1
  for (let step = 0; step < 14; step++) {
    const amount = (low + high) / 2
    const luminance = inkLuminance(mix(color, amount, dark))
    const enough = dark ? luminance <= need : luminance >= need
    if (dark) { if (enough) low = amount; else high = amount }
    else if (enough) high = amount
    else low = amount
  }
  return mix(color, dark ? low : high, dark)
}

// Only the three channels matter: the alias tokens are opaque, and an alpha
// component would make `rgb()` invalid inside a custom property.
const rounded = ([r, g, b]) => `rgb(${[r, g, b].map(value => Math.round(Math.max(0, Math.min(255, value)))).join(', ')})`

export function createBackgroundInk(doc, win, source = () => null) {
  const parse = colorReader(doc, win)
  const applied = new Map()
  let sample = null, sampleKey = '', sampleAt = 0, frame = 0, timer = 0, lastRun = 0, disposed = false, failed = false, capturing = false
  let surface = null, context = null

  function unpaint(row) {
    for (const label of LABELS) { row.style.removeProperty(`--dsw-alias-label-${label}`); row.style.removeProperty(`--dcb-ink-host-${label}`) }
    row.removeAttribute(MARK)
  }

  function release() {
    for (const [row, key] of applied) {
      unpaint(row)
    }
    applied.clear()
  }

  function grid(media) {
    const width = media.naturalWidth || media.videoWidth, height = media.naturalHeight || media.videoHeight
    return width && height ? { width, height, gw: GRID, gh: Math.max(8, Math.round(GRID * height / width)) } : null
  }
  function build(media, frameSource = media) {
    const size = grid(media)
    if (!size) return null
    const { width, height, gw, gh } = size
    // One surface is reused, so a playing video does not allocate a canvas per beat.
    if (!surface) surface = doc.createElement('canvas')
    if (surface.width !== gw || surface.height !== gh) { surface.width = gw; surface.height = gh; context = null }
    const texture = context || (context = surface.getContext('2d', { willReadFrequently: true }))
    if (!texture) return null
    try { texture.drawImage(frameSource, 0, 0, gw, gh) } catch { return null }
    const data = texture.getImageData(0, 0, gw, gh).data, pixels = new Float32Array(gw * gh * 3)
    for (let index = 0, target = 0; index < data.length; index += 4, target += 3) {
      pixels[target] = data[index]; pixels[target + 1] = data[index + 1]; pixels[target + 2] = data[index + 2]
    }
    return { width, height, gw, gh, pixels }
  }

  // A video frame is scaled down by the browser off the main thread first, so
  // the read-back is a 96px thumbnail instead of a full 2K frame per beat.
  function captureVideo(media, key) {
    const size = grid(media)
    if (capturing || !size || typeof win.createImageBitmap !== 'function') return false
    capturing = true
    win.createImageBitmap(media, { resizeWidth: size.gw, resizeHeight: size.gh, resizeQuality: 'low' }).then(bitmap => {
      capturing = false
      if (disposed) { bitmap.close(); return }
      const next = build(media, bitmap); bitmap.close()
      if (!next) return
      const fresh = key !== sampleKey
      sample = next; sampleKey = key; sampleAt = Date.now()
      if (fresh) release()
      lastRun = 0; schedule()
    }, () => { capturing = false })
    return true
  }

  // Average the picture under one viewport rect, following the layer's own
  // object-fit and object-position instead of assuming a full-bleed image.
  function measure(rect, box, fit, position) {
    const [fx, fy] = POSITION[position] || POSITION.center
    let scaleX, scaleY
    if (fit === 'fill') { scaleX = box.width / sample.width; scaleY = box.height / sample.height }
    else {
      const scale = fit === 'contain' ? Math.min(box.width / sample.width, box.height / sample.height) : Math.max(box.width / sample.width, box.height / sample.height)
      scaleX = scaleY = scale
    }
    const drawnWidth = sample.width * scaleX, drawnHeight = sample.height * scaleY
    const left = box.left + (box.width - drawnWidth) * fx, top = box.top + (box.height - drawnHeight) * fy
    // Screen pixels per thumbnail cell: the sample grid is far smaller than the source.
    const cellX = drawnWidth / sample.gw, cellY = drawnHeight / sample.gh
    const x0 = Math.max(0, Math.floor((Math.max(rect.left, left) - left) / cellX))
    const x1 = Math.min(sample.gw, Math.ceil((Math.min(rect.right, left + drawnWidth) - left) / cellX))
    const y0 = Math.max(0, Math.floor((Math.max(rect.top, top) - top) / cellY))
    const y1 = Math.min(sample.gh, Math.ceil((Math.min(rect.bottom, top + drawnHeight) - top) / cellY))
    if (x1 <= x0 || y1 <= y0) return null
    const stride = Math.max(1, Math.floor(Math.sqrt((x1 - x0) * (y1 - y0) / CELLS)))
    let r = 0, g = 0, b = 0, count = 0
    for (let y = y0; y < y1; y += stride) for (let x = x0; x < x1; x += stride) {
      const index = (y * sample.gw + x) * 3
      r += sample.pixels[index]; g += sample.pixels[index + 1]; b += sample.pixels[index + 2]; count++
    }
    return count ? [r / count, g / count, b / count] : null
  }

  function base() {
    const layers = [parse(win.getComputedStyle(doc.documentElement).backgroundColor), parse(win.getComputedStyle(doc.body).backgroundColor)]
    let color = [255, 255, 255]
    for (const layer of layers) {
      if (!layer) continue
      const alpha = layer[3] ?? 1
      if (alpha <= 0) continue
      color = color.map((value, index) => value * (1 - alpha) + layer[index] * alpha)
    }
    return color
  }

  // Rows sit in vertical order: find the first one reaching the viewport, then
  // read on only until a row starts below it. Long histories cost a few reads.
  function rows() {
    const found = [], bottom = win.innerHeight
    const flows = doc.querySelectorAll('[data-chat-flow]')
    const visit = list => {
      let low = 0, high = list.length
      while (low < high) { const mid = (low + high) >>> 1; if (list[mid].getBoundingClientRect().bottom < 0) low = mid + 1; else high = mid }
      for (let index = low; index < list.length; index++) {
        const row = list[index], rect = row.getBoundingClientRect()
        if (rect.top > bottom) break
        if (rect.bottom >= 0 && (rect.width || rect.height)) found.push([row, rect])
      }
    }
    // The host wraps its rows in box-less slots (display: contents); step
    // through them to the rows that actually occupy the page.
    const unwrap = list => list.flatMap(el => el.getClientRects().length || !el.children.length ? [el] : unwrap([...el.children]))
    // Each turn nests its own process flow; the outermost flow already covers it.
    for (const flow of flows) if (!flow.parentElement?.closest('[data-chat-flow]')) visit(unwrap([...flow.children]))
    // Turns rendered outside a flow container still carry host text.
    if (!found.length) visit([...doc.querySelectorAll('[data-chat-turn]')])
    return found
  }

  // Reading pixels is best-effort: an odd picture or a blocked canvas must
  // leave the host's own colours in place instead of breaking the wallpaper.
  function refresh() {
    if (disposed || failed) return
    try { paint() } catch (error) { failed = true; release(); console.warn('文字自动加深已停用', error) }
  }

  function paint() {
    frame = 0
    if (disposed) return
    // Streaming appends one row per frame; keep the sampling off that beat.
    const tick = win.performance.now()
    if (tick - lastRun < 150) {
      if (!timer) timer = win.setTimeout(() => { timer = 0; refresh() }, 150 - (tick - lastRun))
      return
    }
    lastRun = tick
    const state = source()
    if (!state?.media) { release(); return }
    const media = state.media
    const key = `${media.currentSrc || media.src || ''}:${media.naturalWidth || media.videoWidth}x${media.naturalHeight || media.videoHeight}`
    const now = Date.now()
    // A video is re-sampled on a slow beat; a still needs the picture once.
    if (key !== sampleKey || !sample || (state.kind === 'video' && now - sampleAt > 1200)) {
      // Until a fresh video frame arrives the previous measurement keeps serving.
      if (state.kind === 'video' && captureVideo(media, key)) { if (key !== sampleKey || !sample) return }
      else if (!capturing) {
        const next = build(media)
        if (!next) { release(); return }
        sample = next; sampleKey = key; sampleAt = now; release()
      } else if (key !== sampleKey || !sample) return
    }
    const paper = base(), opacity = state.opacity
    const style = win.getComputedStyle(doc.body), own = parse(style.color), baseline = {}
    for (const label of LABELS) baseline[label] = parse(style.getPropertyValue(`--dsw-alias-label-${label}`)) || own
    const body = parse(style.getPropertyValue('--dsw-alias-label-primary')) || own
    if (!body || !baseline.secondary) return
    // Read every rect before writing any custom property: mixing the two would
    // force a fresh style pass for each row.
    // Ink keeps its own polarity: dark text only deepens on the light theme,
    // light text only brightens on the dark theme. It never flips.
    const dark = !doc.body.hasAttribute('data-ds-dark-theme'), box = media.getBoundingClientRect()
    const bodyLuminance = inkLuminance(body)
    const limit = dark ? (bodyLuminance + .05) * HIERARCHY - .05 : (bodyLuminance + .05) / HIERARCHY - .05
    const host = LABELS.map(label => rounded(baseline[label]))
    const plan = []
    for (const [row, rect] of rows()) {
      const average = measure(rect, box, state.fit, state.position)
      if (!average) continue
      const local = paper.map((value, index) => value * (1 - opacity) + average[index] * opacity)
      const background = inkLuminance(local)
      const colors = LABELS.map(label => rounded(deepenInk(baseline[label], TARGET[label], background, dark, limit)))
      // An untouched row keeps no trace of this feature at all.
      if (colors.every((color, index) => color === rounded(baseline[LABELS[index]]))) plan.push({ row, signature: '', colors: null })
      else plan.push({ row, signature: colors.join('|'), colors })
    }
    const seen = new Set()
    for (const { row, signature, colors } of plan) {
      seen.add(row)
      if (applied.get(row) === signature) continue
      if (colors) {
        LABELS.forEach((label, index) => { row.style.setProperty(`--dcb-ink-host-${label}`, host[index]); row.style.setProperty(`--dsw-alias-label-${label}`, colors[index]) })
        row.setAttribute(MARK, '')
        applied.set(row, signature)
      } else {
        unpaint(row); applied.delete(row)
      }
    }
    for (const row of [...applied.keys()]) if (!seen.has(row) || !row.isConnected) {
      unpaint(row); applied.delete(row)
    }
  }

  // Read row geometry just after the frame that changed it has painted: the
  // layout is clean then, so sampling never pays for the host's own reflow.
  const schedule = () => {
    if (disposed || frame || timer) return
    frame = win.requestAnimationFrame(() => { frame = 0; if (!disposed && !timer) timer = win.setTimeout(() => { timer = 0; refresh() }, 0) })
  }

  doc.addEventListener('scroll', schedule, { capture: true, passive: true })
  win.addEventListener('resize', schedule, { passive: true })
  return {
    refresh: () => { if (!frame && !timer) refresh() },
    schedule,
    get active() { return applied.size > 0 },
    dispose() {
      disposed = true
      win.cancelAnimationFrame(frame); frame = 0
      win.clearTimeout(timer); timer = 0
      doc.removeEventListener('scroll', schedule, true)
      win.removeEventListener('resize', schedule)
      release()
      sample = null; sampleKey = ''
    },
  }
}

// Canvas normalises every host colour syntax (hex, rgb, oklch, ...) into the
// one shape this module can measure.
function colorReader(doc, win) {
  const cache = new Map()
  let context = null
  return value => {
    if (!value) return null
    if (cache.has(value)) return cache.get(value)
    let color = null
    try {
      if (!context) { const canvas = doc.createElement('canvas'); canvas.width = canvas.height = 1; context = canvas.getContext('2d') }
      context.fillStyle = '#000'; context.fillStyle = value
      const text = String(context.fillStyle)
      const hex = /^#([\da-f]{6})$/i.exec(text)
      if (hex) color = [parseInt(hex[1].slice(0, 2), 16), parseInt(hex[1].slice(2, 4), 16), parseInt(hex[1].slice(4, 6), 16), 1]
      else {
        const parts = text.match(/[\d.]+/g)
        if (parts && parts.length >= 3) color = [Number(parts[0]), Number(parts[1]), Number(parts[2]), parts.length > 3 ? Number(parts[3]) : 1]
      }
    } catch { color = null }
    cache.set(value, color)
    return color
  }
}
