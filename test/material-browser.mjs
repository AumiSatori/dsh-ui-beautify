import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { build } from 'esbuild'
import { chromium } from '@playwright/test'

// The compact, tools-only card is the least favorable real use case for telling
// the three materials apart. Measure rendered padding pixels, not just CSS flags.
const project = fileURLToPath(new URL('..', import.meta.url))
const output = resolve(process.env.DSH_CLAUDE_OUTPUT_DIR || resolve(project, '..', '..', 'outputs', 'dsh-claude-beautify'), 'material-regression')
mkdirSync(output, { recursive: true })
const built = await build({ entryPoints: [resolve(project, 'test/fixture.jsx')], bundle: true, write: false, format: 'iife' })
const routes = {
  '/': ['text/html; charset=utf-8', readFileSync(resolve(project, 'test/fixture.html'), 'utf8')],
  '/fixture.js': ['text/javascript', built.outputFiles[0].text],
  '/client.js': ['text/javascript', readFileSync(resolve(project, 'client.js'), 'utf8')],
}
const server = createServer((request, response) => {
  const route = routes[request.url]
  if (!route) { response.writeHead(404).end(); return }
  response.writeHead(200, { 'Content-Type': route[0] }).end(route[1])
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const url = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' })
const page = await browser.newPage({ viewport: { width: 1000, height: 720 }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', error => errors.push(error.message))
const card = page.getByTestId('dcb-summary')
const key = 'dsh-claude-beautify:settings:v1'
const labels = { clear: '透明玻璃', glass: '毛玻璃', milk: '默认' }
const records = [
  { event: { type: 'tool/call', seq: 1, data: { callId: 'synthetic-command', name: 'exec_command', arguments: '{"command":"synthetic preview"}' } } },
  { event: { type: 'tool/result', seq: 2, data: { message: { source: { callId: 'synthetic-command' }, isError: false } } } },
]
const results = {}
let passed = 0
async function check(name, run) { await run(); passed++; console.log(`PASS ${name}`) }
async function settled() {
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))))
  await page.evaluate(() => new Promise(done => requestAnimationFrame(done)))
}
async function material(value, settle = true) {
  await page.evaluate(() => window.fixture.settings(true))
  const radio = page.getByRole('radio', { name: labels[value], exact: true })
  await radio.click()
  assert.equal(await radio.getAttribute('aria-checked'), 'true', 'The real settings picker selects the requested style')
  assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).cardStyle, key), value, 'The picker persists the chosen material')
  await page.evaluate(() => window.fixture.settings(false))
  if (settle) await settled()
  assert.equal(await card.getAttribute('data-card-style'), value)
}
const readMaterial = () => card.evaluate(element => {
  const style = getComputedStyle(element)
  const channels = style.backgroundColor.match(/[\d.]+/g).map(Number)
  const filter = style.backdropFilter || style.webkitBackdropFilter
  const tools = element.querySelector('.dcb-tool-summary')
  return {
    background: style.backgroundColor, alpha: channels[3] ?? 1,
    filter, blur: Number(filter.match(/blur\(([\d.]+)px\)/)?.[1] || 0),
    color: style.color, toolColor: getComputedStyle(tools).color,
    toolBackground: getComputedStyle(tools).backgroundColor,
    width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height,
  }
})
async function capture(name) {
  const bytes = await card.screenshot({ path: resolve(output, `${name}.png`), scale: 'css' })
  return page.evaluate(async data => {
    const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob())
    const canvas = document.createElement('canvas')
    canvas.width = image.width; canvas.height = image.height
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0); image.close()
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    const band = []
    // Bottom padding avoids text, hover backgrounds, rounded rims and borders.
    for (let x = 40; x < canvas.width - 40; x++) {
      const offset = ((canvas.height - 9) * canvas.width + x) * 4
      band.push(Array.from(pixels.slice(offset, offset + 3)))
    }
    const mean = [0, 1, 2].map(channel => band.reduce((sum, pixel) => sum + pixel[channel], 0) / band.length)
    const luminance = band.map(pixel => pixel.reduce((sum, value) => sum + value, 0) / 3)
    const average = luminance.reduce((sum, value) => sum + value, 0) / luminance.length
    const deviation = Math.sqrt(luminance.reduce((sum, value) => sum + (value - average) ** 2, 0) / luminance.length)
    return { mean, deviation }
  }, bytes.toString('base64'))
}
function difference(first, second) { return first.mean.reduce((sum, value, channel) => sum + Math.abs(value - second.mean[channel]), 0) / 3 }
function contrast(color, background) {
  const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number)
  const luminance = values => values.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, channel) => sum + value * [.2126, .7152, .0722][channel], 0)
  const values = [luminance(rgb), luminance(background)].sort((a, b) => b - a)
  return (values[0] + .05) / (values[1] + .05)
}
try {
  await page.goto(url)
  await page.getByTestId('todo-panel').waitFor()
  await page.evaluate(() => {
    window.cleanups = []
    const FishLogo = () => window.fixtureReact.createElement('svg', { width: 16, height: 12, viewBox: '0 0 24 18', 'aria-hidden': true }, window.fixtureReact.createElement('path', { d: 'M1 6Q7 1 13 6L22 1V9L17 8Q13 18 5 14Q1 11 1 6Z', fill: 'currentColor' }))
    window.__ModuleLoader__ = { load(spec) { window.plugin = spec.factory(name => name === '@deepseek-ai/dsh-client-ui-primitives' ? { FishLogo } : window.fixtureReact) } }
  })
  await page.addScriptTag({ url: `${url}/client.js` })
  await page.evaluate(() => {
    const ctx = {
      slots: {
        inject(_name, callback) { callback() },
        register(spec, component) {
          if (spec.name === 'settings.section') window.fixtureSettings = component
          else { window.fixtureHeader = component; window.fixtureHeaderSpec = spec }
          return () => {}
        },
      },
      sessions: { binding: id => window.fixtureBinding(id) },
      sidebarRight: { openResource() {} },
      effect(callback) { window.cleanups.push(callback()) },
      inject(_names, callback) { callback(ctx) },
    }
    window.plugin.apply(ctx)
    window.fixture.refresh()
  })
  await page.getByRole('button', { name: '会话进度与输出', exact: true }).waitFor()
  await page.evaluate(records => { window.fixture.records(records); window.fixture.update([]) }, records)
  await settled()
  await page.getByRole('button', { name: '会话进度与输出', exact: true }).evaluate(element => element.click())
  await card.waitFor()
  await settled()
  await page.mouse.move(10, 500)
  await page.addStyleTag({ content: '[data-conversation-content]{background:var(--material-test-background)!important} .scroll{background:transparent!important}' })
  for (const dark of [true, false]) {
    const theme = dark ? 'dark' : 'light'
    await page.evaluate(dark => {
      document.body.toggleAttribute('data-ds-dark-theme', dark)
      document.body.style.setProperty('--material-test-background', dark ? '#141414' : '#e4e7ec')
    }, dark)
    await settled()
    const flat = {}, styles = {}, patterned = {}
    await check(`${theme} tools-only card has three visible materials on a flat chat background`, async () => {
      for (const value of ['clear', 'glass', 'milk']) {
        await material(value)
        styles[value] = await readMaterial()
        flat[value] = await capture(`${theme}-flat-${value}`)
        assert.ok(styles[value].height < 130, 'The tools-only card stays compact')
        assert.ok(contrast(styles[value].color, flat[value].mean) >= 4.5, 'The title retains readable contrast')
        assert.ok(contrast(styles[value].toolColor, flat[value].mean) >= 4.5, 'The compact tool summary retains readable contrast')
      }
      assert.ok(styles.clear.alpha > 0 && styles.clear.alpha < styles.glass.alpha)
      assert.ok(styles.glass.alpha < 1)
      assert.equal(styles.milk.alpha, 1)
      assert.equal(styles.milk.background, dark ? 'rgb(41, 40, 36)' : 'rgb(255, 253, 249)', 'Renaming the default material preserves its original surface color')
      assert.equal(styles.clear.blur, 0)
      assert.equal(styles.glass.blur, 22)
      assert.equal(styles.milk.blur, 0)
      for (const [first, second] of [['clear', 'glass'], ['clear', 'milk'], ['glass', 'milk']]) {
        const delta = difference(flat[first], flat[second])
        assert.ok(delta >= 6, `${first} and ${second} must differ in actual flat-background RGB (${delta.toFixed(2)})`)
      }
    })
    await check(`${theme} hovering the tool summary keeps the chosen material visible`, async () => {
      for (const value of ['clear', 'glass', 'milk']) {
        await material(value)
        await card.getByRole('button', { name: '展开工具明细', exact: true }).hover()
        await settled()
        const hovered = await readMaterial()
        if (value !== 'milk') {
          const overlay = hovered.toolBackground.match(/[\d.]+/g).map(Number)
          assert.ok(overlay.length === 4 && overlay[3] > 0 && overlay[3] <= .12, `Hover uses a translucent overlay, not an opaque block (${hovered.toolBackground})`)
        }
        await capture(`${theme}-hover-${value}`)
        await page.mouse.move(10, 500)
        await settled()
      }
    })
    await check(`${theme} clear glass preserves background texture, frost blurs it and milk masks it`, async () => {
      await page.evaluate(() => document.body.style.setProperty('--material-test-background', 'repeating-linear-gradient(90deg,#222 0 4px,#bbb 4px 8px)'))
      for (const value of ['clear', 'glass', 'milk']) {
        await material(value)
        patterned[value] = await capture(`${theme}-pattern-${value}`)
      }
      assert.ok(patterned.clear.deviation >= 8, `Transparent glass keeps real backdrop texture (${patterned.clear.deviation.toFixed(2)})`)
      assert.ok(patterned.glass.deviation < patterned.clear.deviation * .3, `Frost suppresses fine backdrop texture (${patterned.glass.deviation.toFixed(2)})`)
      assert.ok(patterned.milk.deviation < patterned.clear.deviation * .2, 'Opaque milk does not expose backdrop texture')
    })
    await check(`${theme} material switches retain intermediate alpha and blur without replacing the card`, async () => {
      await material('clear')
      await card.evaluate(element => { window.materialNode = element })
      await material('glass', false)
      await card.evaluate(async element => {
        await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))
        window.materialAnimations = element.getAnimations().filter(animation => 'transitionProperty' in animation)
        for (const animation of window.materialAnimations) { animation.pause(); animation.currentTime = 120 }
      })
      const middle = await readMaterial()
      assert.ok(middle.alpha > styles.clear.alpha && middle.alpha < styles.glass.alpha, `Alpha interpolates rather than jumping (${middle.alpha})`)
      assert.ok(middle.blur > 0 && middle.blur < 22, `Blur interpolates rather than jumping (${middle.blur})`)
      assert.equal(await card.evaluate(element => element === window.materialNode), true)
      await capture(`${theme}-transition-120`)
      await page.evaluate(() => window.materialAnimations.forEach(animation => animation.finish()))
      await settled()
    })
    results[theme] = { flat, styles, patterned }
  }
  assert.deepEqual(errors, [])
  writeFileSync(resolve(output, 'results.json'), `${JSON.stringify(results, null, 2)}\n`)
  const comparison = await browser.newPage({ viewport: { width: 1100, height: 640 }, deviceScaleFactor: 1 })
  const row = (theme, kind, description) => `<section class="${theme}"><p>${description}</p><div>${Object.entries(labels).map(([value, label]) => `<figure><figcaption>${label}</figcaption><img src="data:image/png;base64,${readFileSync(resolve(output, `${theme}-${kind}-${value}.png`)).toString('base64')}"/></figure>`).join('')}</div></section>`
  await comparison.setContent(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;font:14px system-ui,sans-serif;background:#e4e7ec}section{padding:18px 34px 22px}section.dark{background:#141414;color:#e8e8e8}section.light{background:#e4e7ec;color:#242424}p{margin:0 0 13px;font-size:13px;opacity:.7}section>div{display:flex;gap:28px}figure{margin:0;width:320px}figcaption{margin-bottom:10px;font-size:14px}img{display:block;width:320px;height:96px}</style>${row('dark', 'hover', '深色 · 与用户截图相同的工具摘要悬浮状态')}${row('light', 'hover', '浅色 · 相同内容，相同位置')}${row('dark', 'pattern', '背景纹理 · 透明保留，毛玻璃模糊，默认遮挡')}</html>`)
  await comparison.screenshot({ path: resolve(output, 'material-comparison.png'), fullPage: true })
  await comparison.close()
  console.log(`\n${passed} material regression checks passed; artifacts: ${output}`)
} finally {
  await browser.close()
  await new Promise(done => server.close(done))
}
