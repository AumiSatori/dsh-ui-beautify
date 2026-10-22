import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { build } from 'esbuild'
import { chromium } from '@playwright/test'

// Exercise the real material picker and rendered card. Background samples come
// from the same Chromium surface with only its foreground temporarily hidden.
const project = fileURLToPath(new URL('..', import.meta.url))
const output = resolve(process.env.DSH_CLAUDE_OUTPUT_DIR || resolve(project, '..', '.scratch', 'claude-beautify'), 'theme-palette')
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
const page = await browser.newPage({ viewport: { width: 1000, height: 950 }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', error => errors.push(error.message))
const card = page.getByTestId('dcb-summary')
const key = 'dsh-claude-beautify:settings:v1'
const labels = { clear: '透明玻璃', css: '轻量玻璃', glass: '毛玻璃', milk: '默认' }
const todos = [
  { content: '确认界面与主题需求', status: 'completed' },
  { content: '梳理模块与信息层级', status: 'completed' },
  { content: '完成材质背景与边缘', status: 'completed' },
  { content: '正在调整浅深主题文字', status: 'in_progress' },
  { content: '检查工具分类与输出', status: 'pending' },
  { content: '验证切换与展开记忆', status: 'pending' },
  { content: '整理验收结果', status: 'pending' },
]
const event = (type, seq, data) => ({ event: { type, seq, data } })
const records = [
  event('tool/call', 1, { callId: 'theme-command', name: 'exec_command', arguments: '{"command":"synthetic preview"}' }),
  event('tool/result', 2, { message: { source: { callId: 'theme-command' }, isError: false } }),
  event('tool/call', 3, { callId: 'theme-edit', name: 'apply_patch', arguments: '{}' }),
  event('tool/result', 4, { message: { source: { callId: 'theme-edit' }, isError: false } }),
  event('tool/call', 5, { callId: 'theme-skill', name: 'load_skill', arguments: '{"name":"theme-preview"}' }),
  event('tool/result', 6, { message: { source: { callId: 'theme-skill' }, isError: false } }),
  event('deliverables/presented', 7, { files: [{ path: 'outputs/theme-preview.zip', description: '主题预览工程' }] }),
]
const results = {}
let passed = 0
async function check(name, run) { await run(); passed++; console.log(`PASS ${name}`) }
async function settled() {
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))))
  await page.evaluate(() => new Promise(done => requestAnimationFrame(done)))
}
async function material(value) {
  await page.evaluate(() => window.fixture.settings(true))
  await page.getByRole('radio', { name: labels[value], exact: true }).click()
  await page.evaluate(() => window.fixture.settings(false))
  await settled()
  assert.equal(await card.getAttribute('data-card-style'), value)
}
function luminance(rgb) {
  return rgb.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, channel) => sum + value * [.2126, .7152, .0722][channel], 0)
}
function contrast(color, background) {
  const a = luminance(color.match(/[\d.]+/g).slice(0, 3).map(Number)), b = luminance(background)
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
}
const selectors = {
  heading: '.dcb-module-toggle', completed: '.dcb-recent-steps [data-status="completed"] .dcb-step-text',
  current: '.dcb-recent-steps [data-status="in_progress"] .dcb-step-text', pending: '.dcb-recent-steps [data-status="pending"] .dcb-step-text',
  previous: '.dcb-history:not(.dcb-future) .dcb-history-label', future: '.dcb-future .dcb-history-label',
  output: '.dcb-file-name', fileType: '.dcb-file-type', resource: '.dcb-resource-label', detail: '.dcb-resource-detail',
  tool: '.dcb-tool-name', count: '.dcb-tool-count', category: '.dcb-tool-category',
}
async function capture(theme, value) {
  const details = await card.evaluate((element, selectors) => {
    const bounds = element.getBoundingClientRect()
    const data = Object.fromEntries(Object.entries(selectors).map(([name, selector]) => {
      const target = element.querySelector(selector)
      if (!target) throw new Error(`Missing palette surface: ${name}`)
      const style = getComputedStyle(target), rect = target.getBoundingClientRect()
      return [name, { color: style.color, weight: Number(style.fontWeight), x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height }]
    }))
    const style = getComputedStyle(element)
    return { elements: data, background: style.backgroundColor, color: style.color }
  }, selectors)
  await card.screenshot({ path: resolve(output, `${theme}-${value}.png`), scale: 'css' })
  const hide = await page.addStyleTag({ content: '.dcb-summary *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}.dcb-summary svg{visibility:hidden!important}.dcb-summary .dcb-step-text,.dcb-summary .dcb-tool-name{background-image:none!important}' })
  let bytes
  try { bytes = await card.screenshot({ scale: 'css' }) } finally { await hide.evaluate(element => element.remove()) }
  const pixels = await page.evaluate(async ({ data, rects }) => {
    const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob())
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width; canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    context.drawImage(bitmap, 0, 0); bitmap.close()
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    return Object.fromEntries(Object.entries(rects).map(([name, rect]) => {
      const samples = []
      for (const fx of [.2, .5, .8]) for (const fy of [.25, .5, .75]) {
        const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(rect.x + rect.width * fx)))
        const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(rect.y + rect.height * fy)))
        const offset = (y * canvas.width + x) * 4
        samples.push(Array.from(pixels.slice(offset, offset + 3)))
      }
      return [name, samples]
    }))
  }, { data: bytes.toString('base64'), rects: details.elements })
  for (const [name, element] of Object.entries(details.elements)) {
    element.backgroundSamples = pixels[name]
    element.contrast = Math.min(...pixels[name].map(background => contrast(element.color, background)))
  }
  return details
}
try {
  await page.goto(url)
  await page.getByTestId('todo-panel').waitFor()
  await page.evaluate(key => {
    localStorage.setItem(key, JSON.stringify({ enabled: true, width: 320, cardStyle: 'milk', modules: { progress: true, outputs: true, resources: true }, progressView: { count: 3, previous: false, future: false }, toolDetails: true }))
    window.cleanups = []
    const FishLogo = () => window.fixtureReact.createElement('svg', { width: 16, height: 12, viewBox: '0 0 24 18', 'aria-hidden': true }, window.fixtureReact.createElement('path', { d: 'M1 6Q7 1 13 6L22 1V9L17 8Q13 18 5 14Q1 11 1 6Z', fill: 'currentColor' }))
    window.__ModuleLoader__ = { load(spec) { window.plugin = spec.factory(name => name === '@deepseek-ai/dsh-client-ui-primitives' ? { FishLogo } : window.fixtureReact) } }
  }, key)
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
      sessions: { binding: id => window.fixtureBinding(id) }, sidebarRight: { openResource() {} },
      effect(callback) { window.cleanups.push(callback()) }, inject(_names, callback) { callback(ctx) },
    }
    window.plugin.apply(ctx)
    window.fixture.refresh()
  })
  await page.getByRole('button', { name: '会话进度与输出', exact: true }).waitFor()
  await page.evaluate(({ todos, records }) => { window.fixture.running(true); window.fixture.update(todos); window.fixture.records(records) }, { todos, records })
  await card.waitFor()
  await settled()
  assert.equal(await card.getAttribute('data-open-origin'), 'automatic')
  await card.evaluate(element => { window.paletteCard = element })
  await page.mouse.move(10, 500)
  // Both neutral surfaces and a soft color field are present behind the glass.
  // The dark field matches the user's actual #141414 chat background.
  await page.addStyleTag({ content: '[data-conversation-content]{background:var(--theme-palette-background)!important}.scroll{background:transparent!important}' })
  for (const dark of [true, false]) {
    const theme = dark ? 'dark' : 'light'
    await page.evaluate(dark => {
      document.body.toggleAttribute('data-ds-dark-theme', dark)
      document.body.style.setProperty('--theme-palette-background', dark ? 'radial-gradient(ellipse at 70% 30%,#24343d90,transparent 65%),#141414' : 'radial-gradient(ellipse at 70% 30%,#bed3e090,transparent 65%),#e4e7ec')
    }, dark)
    await settled()
    for (const value of Object.keys(labels)) {
      await material(value)
      await check(`${theme} ${value} keeps task, resource and secondary text legible`, async () => {
        const data = await capture(theme, value)
        results[`${theme}-${value}`] = data
        assert.equal(data.elements.completed.color, data.elements.pending.color, 'Completed and pending retain a consistent neutral gray')
        assert.equal(data.elements.current.weight, 700, 'The current task remains bold')
        const currentLuminance = luminance(data.elements.current.color.match(/[\d.]+/g).slice(0, 3).map(Number))
        const mutedLuminance = luminance(data.elements.completed.color.match(/[\d.]+/g).slice(0, 3).map(Number))
        assert.ok(dark ? currentLuminance > mutedLuminance : currentLuminance < mutedLuminance, 'Current text stands out in the correct direction for the theme')
        if (value !== 'milk') {
          for (const [name, element] of Object.entries(data.elements)) assert.ok(element.contrast >= 4.5, `${theme}/${value} ${name} contrast ${element.contrast.toFixed(2)} must be at least 4.5`)
        } else {
          assert.equal(data.background, dark ? 'rgb(41, 40, 36)' : 'rgb(255, 253, 249)', 'Default keeps its original surface')
          assert.equal(data.color, dark ? 'rgb(238, 234, 226)' : 'rgb(36, 36, 36)', 'Default keeps its original primary foreground')
          assert.equal(data.elements.completed.color, dark ? 'rgb(141, 141, 141)' : 'rgb(154, 154, 154)', 'Default keeps its original inactive foreground')
          assert.equal(data.elements.fileType.color, 'rgb(149, 145, 138)', 'Default keeps its original secondary foreground')
        }
      })
      await check(`${theme} ${value} switches retain the card, preferences and automatic close rule`, async () => {
        assert.equal(await card.evaluate(element => element === window.paletteCard), true)
        assert.equal(await card.getAttribute('data-open-origin'), 'automatic')
        const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)
        assert.deepEqual(stored.progressView, { count: 3, previous: false, future: false })
        assert.equal(stored.toolDetails, true)
        await page.locator('article h1').click()
        await page.keyboard.press('Escape')
        await page.getByRole('button', { name: '会话进度与输出', exact: true }).click()
        await page.mouse.move(10, 500)
        await settled()
        assert.equal(await card.getAttribute('data-state'), 'open', 'Theme/material changes cannot unlock outside, Escape or entry dismissal')
        assert.equal(await card.getAttribute('data-open-origin'), 'automatic')
      })
    }
  }
  await check('transparent and frosted glass use independent foreground palettes in light and dark themes', async () => {
    for (const value of ['clear', 'css', 'glass']) for (const field of ['heading', 'completed', 'current', 'detail', 'fileType', 'category']) {
      assert.notEqual(results[`dark-${value}`].elements[field].color, results[`light-${value}`].elements[field].color, `${value} ${field} must be theme-specific`)
    }
  })
  await check('the automatic card still closes using its X button', async () => {
    await card.getByRole('button', { name: '关闭进度面板', exact: true }).click()
    await card.waitFor({ state: 'detached' })
  })
  assert.deepEqual(errors, [])
  writeFileSync(resolve(output, 'results.json'), `${JSON.stringify(results, null, 2)}\n`)
  const comparison = await browser.newPage({ viewport: { width: 1480, height: 1300 }, deviceScaleFactor: 1 })
  const row = theme => `<section class="${theme}"><p>${theme === 'dark' ? '深色' : '浅色'} · 独立文字与次要信息配色</p><div>${Object.entries(labels).map(([value, label]) => `<figure><figcaption>${label}</figcaption><img src="data:image/png;base64,${readFileSync(resolve(output, `${theme}-${value}.png`)).toString('base64')}"/></figure>`).join('')}</div></section>`
  await comparison.setContent(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;font:14px system-ui,sans-serif}section{padding:22px 40px 24px}section.dark{background:#141414;color:#eee}section.light{background:#e4e7ec;color:#242424}p{margin:0 0 14px;font-size:13px;opacity:.75}section>div{display:flex;gap:30px}figure{margin:0;width:320px}figcaption{margin-bottom:12px}img{display:block;width:320px}</style>${row('dark')}${row('light')}</html>`)
  await comparison.screenshot({ path: resolve(output, 'theme-comparison.png'), fullPage: true })
  await comparison.close()
  console.log(`\n${passed} theme palette checks passed; artifacts: ${output}`)
} finally {
  if (Object.keys(results).length) writeFileSync(resolve(output, 'results.json'), `${JSON.stringify(results, null, 2)}\n`)
  await browser.close()
  await new Promise(done => server.close(done))
}
