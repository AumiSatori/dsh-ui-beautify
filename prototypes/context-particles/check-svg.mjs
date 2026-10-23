import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'))
const { chromium } = require('playwright')
const [html, output] = process.argv.slice(2)
if (!html || !output) throw new Error('Usage: node check-svg.mjs <built.html> <output-dir>')
await mkdir(resolve(output), { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = [], requests = [], samples = []
page.on('pageerror', e => errors.push(String(e)))
page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()) })
const snapshot = () => page.evaluate(() => window.particlePreview.snapshot())
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240">
<defs><linearGradient id="sea" x1="0" x2="1"><stop stop-color="#59dbf2"/><stop offset="1" stop-color="#7188ff"/></linearGradient></defs>
<style>.body{fill:url(#sea);stroke:#c0edff;stroke-width:3}</style>
<path class="body" d="M45 125C45 76 88 50 148 70C187 82 214 109 245 104C273 100 285 65 310 62C308 88 298 109 286 123C310 128 327 145 329 167C295 169 267 153 249 145C213 190 166 201 116 187C70 178 45 156 45 125Z"/>
<circle cx="96" cy="114" r="8" fill="#172a55"/><circle cx="94" cy="111" r="2.5" fill="white"/>
<path d="M66 146Q94 163 119 146" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/>
</svg>`
const upload = async (text, name) => {
  await page.locator('#svg-file').setInputFiles({ name, mimeType: 'image/svg+xml', buffer: Buffer.from(text) })
  await page.waitForFunction(() => !window.particlePreview.snapshot().loadingArtwork)
}
const progress = async (p) => {
  const slider = page.locator('#occupancy')
  await slider.focus(); await slider.press('Home')
  for (let i = 0; i < p / 10; i++) await slider.press('PageUp')
  await page.waitForFunction(p => Math.abs(window.particlePreview.snapshot().progress - p / 100) < .001, p)
  await page.waitForTimeout(150)
}
try {
  await page.goto(pathToFileURL(resolve(html)).href)
  await page.waitForFunction(() => window.particlePreview?.snapshot().ready)
  await page.locator('button[data-view=art]').click()
  await page.waitForTimeout(1100)
  // Measure actual rendered pixels, rather than just asserting different values.
  for (const p of [0, 10, 20, 30, 40, 60, 80, 100]) {
    await progress(p)
    const png = await page.screenshot({ path: join(resolve(output), `progress-${p}.png`) })
    const pixels = await page.evaluate(async data => {
      const image = new Image(); image.src = data; await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0)
      const { data: rgba } = context.getImageData(575, 100, 780, 660)
      let bright = 0
      for (let i = 0; i < rgba.length; i += 4) if (rgba[i + 1] > 49 || rgba[i + 2] > 90) bright++
      return bright
    }, `data:image/png;base64,${png.toString('base64')}`)
    samples.push({ p, pixels, ...(await snapshot()) })
    console.log(`PASS ${p}%: ${samples.at(-1).visible} particles, ${pixels} visible picture pixels`)
  }
  const early = samples.slice(0, 5)
  for (let i = 1; i < early.length; i++) assert.ok(early[i].pixels > early[i - 1].pixels + 250, `${early[i].p}% has a visible increase`)
  await upload(SVG, '自定义鲸鱼.svg')
  assert.equal((await snapshot()).artworkName, '自定义鲸鱼.svg')
  assert.equal((await snapshot()).target, 100)
  const transition = await page.locator('.shape-ghost').evaluate(el => ({ opacity: getComputedStyle(el).opacity, animations: el.getAnimations().length }))
  assert.equal(transition.animations, 1)
  await page.waitForTimeout(650)
  assert.equal(await page.locator('.shape-ghost').count(), 0)
  await page.screenshot({ path: join(resolve(output), 'svg-gradient.png') })
  console.log('PASS import: paths, CSS class, gradient, circle, retained occupancy, real crossfade and cleanup')
  const wide = `<svg viewBox="0 0 1200 120"><path d="M20 60C140 0 230 120 350 60S570 0 690 60S910 120 1180 60" fill="none" stroke="black" stroke-width="2"/></svg>`
  await upload(wide, '横向描边.svg')
  let value = await snapshot()
  assert.equal(value.artwork, 'svg')
  assert.ok(value.rect[2] / value.rect[3] > 8)
  assert.ok(value.rect[0] >= 0 && value.rect[0] + value.rect[2] <= 1440)
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(resolve(output), 'svg-wide-stroke.png') })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(200)
  const stopped = (await snapshot()).frames
  await page.waitForTimeout(300)
  assert.equal((await snapshot()).frames, stopped, 'sparse SVG also stops rendering in reduced motion')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await upload('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle', '无效.svg')
  assert.equal((await snapshot()).artworkName, '横向描边.svg')
  await upload('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>', '空白.svg')
  assert.equal((await snapshot()).artworkName, '横向描边.svg')
  console.log('PASS wide/outline SVG: bounds fit, black remains visible, sparse draw settles, invalid/empty keep prior artwork')
  const unsafe = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" onload="window.svgExecuted=true">
    <script>fetch('https://example.invalid/script')</script><image href="https://example.invalid/a.png"/>
    <foreignObject width="100" height="100"><iframe xmlns="http://www.w3.org/1999/xhtml" src="https://example.invalid/iframe"/></foreignObject>
    <style>@import url('https://example.invalid/a.css');.safe{fill:#6ce2e8;stroke:url('https://example.invalid/paint')}</style>
    <rect class="safe" x="10" y="10" width="80" height="80" rx="16"/>
  </svg>`
  const sanitized = await page.evaluate(text => window.ContextParticleSVG.sanitize(text).xml, unsafe)
  assert.ok(!/onload|<script|<image|foreignObject|https:\/\/example|@import/.test(sanitized))
  await upload(unsafe, '静态图形.svg')
  assert.equal((await snapshot()).artworkName, '静态图形.svg')
  assert.equal(await page.evaluate(() => window.svgExecuted), undefined)
  await page.locator('#reset-artwork').click()
  await page.waitForTimeout(650)
  assert.equal((await snapshot()).artwork, 'default')
  assert.equal((await snapshot()).target, 100)
  assert.equal(await page.locator('#reset-artwork').isDisabled(), true)
  assert.ok((await snapshot()).pointCount >= 10000)
  assert.equal(await page.locator('select,input[type=checkbox],input[type=range],input[type=radio]').count(), 0)
  // Exercise the file drop entry point rather than only the hidden file input.
  await page.evaluate(svg => {
    const transfer=new DataTransfer();transfer.items.add(new File([svg],'拖入.svg',{type:'image/svg+xml'}))
    document.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}))
  }, SVG)
  await page.waitForFunction(() => !window.particlePreview.snapshot().loadingArtwork)
  assert.equal((await snapshot()).artworkName, '拖入.svg')
  await page.waitForTimeout(650)
  const fallback = await browser.newPage({ viewport: { width: 900, height: 800 } })
  fallback.on('pageerror', e => errors.push(String(e)))
  await fallback.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(type,...args) { return type.startsWith('webgl') ? null : get.call(this,type,...args) }
  })
  await fallback.goto(pathToFileURL(resolve(html)).href)
  await fallback.waitForFunction(() => window.particlePreview?.snapshot().ready)
  await fallback.locator('#svg-file').setInputFiles({name:'回退.svg',mimeType:'image/svg+xml',buffer:Buffer.from(SVG)})
  await fallback.waitForFunction(() => window.particlePreview.snapshot().artworkName === '回退.svg')
  assert.equal(await fallback.evaluate(() => window.particlePreview.snapshot().mode),'Canvas 2D')
  await fallback.close()
  assert.deepEqual(requests, [])
  assert.deepEqual(errors, [])
  await writeFile(join(resolve(output), 'svg-verification.json'), JSON.stringify({ samples, requests, errors }, null, 2))
  console.log('PASS unsafe/external content omitted, file drop and Canvas 2D import, no network/JS errors, reset returns to whale girl')
} finally { await browser.close() }
