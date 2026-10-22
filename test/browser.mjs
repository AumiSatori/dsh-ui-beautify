import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, openSync, readSync, closeSync } from 'node:fs'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { build } from 'esbuild'
import { chromium } from '@playwright/test'

const project = fileURLToPath(new URL('..', import.meta.url))
const output = resolve(process.env.DSH_CLAUDE_OUTPUT_DIR || resolve(project, '..', '..', 'outputs', 'dsh-claude-beautify'))
mkdirSync(output, { recursive: true })
const built = await build({ entryPoints: [resolve(project, 'test/fixture.jsx')], bundle: true, write: false, format: 'iife' })
let nativeScript = ''
if (process.env.DSH_ASAR) {
  const fd = openSync(process.env.DSH_ASAR, 'r')
  try {
    const head = Buffer.alloc(16)
    readSync(fd, head, 0, 16, 0)
    const json = Buffer.alloc(head.readUInt32LE(12))
    readSync(fd, json, 0, json.length, 16)
    let entry = JSON.parse(json.toString('utf8'))
    for (const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js'.split('/')) entry = entry.files[part]
    const data = Buffer.alloc(entry.size)
    readSync(fd, data, 0, data.length, 8 + head.readUInt32LE(4) + Number(entry.offset))
    const source = data.toString('utf8')
    const start = source.indexOf('//#region lib/types/client/skeleton/TodoPanel.js')
    assert.ok(start >= 0, 'Host TodoPanel contract must exist')
    const end = source.indexOf('//#endregion', start)
    assert.ok(end > start)
    nativeScript = `window.nativeTodoFactory = function(react, react_jsx_runtime, TodoPanel_module_css_default, _deepseek_ai_dsh_client_ui_primitives) { ${source.slice(start, end)}; return TodoPanel; };`
  } finally { closeSync(fd) }
}
const html = readFileSync(resolve(project, 'test/fixture.html'), 'utf8').replace('<script src="/fixture.js">', '<script src="/native.js"></script><script src="/fixture.js">')
const server = createServer((req, res) => {
  const routes = {
    '/': ['text/html; charset=utf-8', html],
    '/fixture.js': ['text/javascript', built.outputFiles[0].text],
    '/native.js': ['text/javascript', nativeScript],
    '/client.js': ['text/javascript', readFileSync(resolve(project, 'client.js'), 'utf8')],
  }
  const route = routes[req.url]
  if (!route) { res.writeHead(404).end(); return }
  res.writeHead(200, { 'Content-Type': route[0] }).end(route[1])
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const url = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', error => errors.push(error.message))
const panel = page.getByTestId('todo-panel')
let passed = 0
async function check(name, run) { await run(); passed++; console.log(`PASS ${name}`) }
async function settled() {
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))))
}
async function bounds() {
  return page.evaluate(() => {
    const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width } }
    return { panel: box('[data-testid="todo-panel"]'), container: box('[data-conversation-content]'), composer: box('[data-composer-seat]') }
  })
}
try {
  await page.goto(url)
  await panel.waitFor()
  await page.evaluate(() => {
    window.cleanups = []
    window.__ModuleLoader__ = { load(spec) { window.plugin = spec.factory(name => (name === 'dsh-claude-slider' && window.fixtureSliderModule) || window.fixtureReact) } }
  })
  await page.addScriptTag({ url: `${url}/client.js` })
  await page.evaluate(() => window.plugin.apply({
    slots: {
      inject(name, callback) { callback() },
      register(spec, component) { window.fixtureSettings = component; return () => {} },
    },
    effect(callback) { window.cleanups.push(callback()) },
  }))
  await page.waitForSelector('[data-dcb-task-panel]')
  await check('native node stays owned by React and docks at the top right', async () => {
    const b = await bounds()
    assert.equal(b.panel.width, 320)
    assert.ok(Math.abs(b.panel.right - (b.container.right - 16)) < 2)
    assert.ok(Math.abs(b.panel.top - (b.container.top + 16)) < 2)
    assert.ok(b.panel.bottom < b.composer.top)
    assert.equal(await panel.count(), 1)
  })
  await check('native expand/collapse handler and keyboard work', async () => {
    await panel.locator('button').focus()
    await page.keyboard.press('Enter')
    await panel.locator('li').first().waitFor()
    assert.equal(await panel.locator('li').count(), 4)
    await panel.locator('button').click()
    assert.equal(await panel.locator('li').count(), 0)
    await panel.locator('button').click()
  })
  await page.screenshot({ path: resolve(output, 'desktop-light.png') })
  await check('streamed state changes render through the actual component', async () => {
    await page.evaluate(() => window.fixture.update([
      { content: '新的实时任务', status: 'in_progress' },
      { content: '已完成的任务', status: 'completed' },
    ]))
    await page.getByText('新的实时任务', { exact: true }).waitFor()
    assert.equal(await panel.locator('[data-status="completed"]').count(), 1)
  })
  await check('session switches replace tasks and empty sessions remove the panel', async () => {
    await page.evaluate(() => window.fixture.session('b'))
    await settled()
    await panel.locator('button').click()
    await page.getByText('第二个会话的任务', { exact: true }).waitFor()
    assert.equal(await page.getByText('新的实时任务', { exact: true }).count(), 0)
    await page.evaluate(() => window.fixture.session('empty'))
    await settled()
    assert.equal(await panel.count(), 0)
    await page.evaluate(() => window.fixture.session('a'))
    await settled()
    await panel.locator('button').click()
  })
  await check('resizing the right sidebar keeps tasks clear of the preview pane', async () => {
    await page.evaluate(() => window.fixture.sidebar(true))
    await settled()
    const b = await bounds()
    assert.ok(b.panel.right <= b.container.right - 15)
    await page.evaluate(() => window.fixture.sidebar(false))
  })
  await check('long task text wraps, a large task list scrolls', async () => {
    await page.evaluate(() => window.fixture.update(Array.from({ length: 30 }, (_, i) => ({ content: `验证任务 ${i}：较长的任务说明应该完整换行显示，避免省略导致看不到正在执行的内容。`, status: i ? 'pending' : 'in_progress' }))))
    await settled()
    assert.ok(await panel.locator('ul').evaluate(el => el.scrollHeight > el.clientHeight))
    assert.equal(await panel.locator('li > span:last-child').first().evaluate(el => getComputedStyle(el).whiteSpace), 'normal')
  })
  await check('dark theme remains legible', async () => {
    await page.evaluate(() => { document.body.setAttribute('data-ds-dark-theme', ''); window.fixture.session('b') })
    await settled()
    await panel.locator('button').click()
    assert.equal(await panel.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(41, 40, 36)')
    await page.screenshot({ path: resolve(output, 'desktop-dark.png') })
    await page.evaluate(() => document.body.removeAttribute('data-ds-dark-theme'))
  })
  await check('phone viewport fits without horizontal overflow', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    await settled()
    const b = await bounds()
    assert.ok(b.panel.left >= 0 && b.panel.right <= 390)
    assert.ok(b.panel.bottom < b.composer.top)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: resolve(output, 'mobile.png') })
    await page.setViewportSize({ width: 1440, height: 960 })
  })
  await check('settings merge hosts the reasoning-slider page above the panel block', async () => {
    await page.evaluate(() => window.fixture.settings(true))
    await page.getByText('滑块设置页暂不可用', { exact: false }).waitFor()
    await page.evaluate(() => {
      const h = window.fixtureReact.createElement
      window.fixtureSliderModule = { ClaudeSettingsPage: () => h('div', { 'data-fake-slider-page': '' }, '推理滑块页面') }
      window.fixture.settings(false)
    })
    await settled()
    await page.evaluate(() => window.fixture.settings(true))
    await page.getByText('推理滑块页面').waitFor()
    assert.equal(await page.locator('[data-dcb-settings-block="slider"]').count(), 1)
    assert.equal(await page.locator('[data-dcb-settings-block="panel"]').count(), 1)
    const order = await page.evaluate(() => {
      const slider = document.querySelector('[data-dcb-settings-block="slider"]')
      const panel = document.querySelector('[data-dcb-settings-block="panel"]')
      return slider.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING ? 'slider-first' : 'panel-first'
    })
    assert.equal(order, 'slider-first')
    await page.screenshot({ path: resolve(output, 'settings-merged.png') })
    await page.evaluate(() => { window.fixtureSliderModule = undefined; window.fixture.settings(false) })
  })
  await check('settings turn it off and on and persist its width', async () => {
    await page.evaluate(() => window.fixture.settings(true))
    const controls = page.locator('[data-dcb-settings-block="panel"]')
    assert.equal(await controls.locator('select, input[type="checkbox"], input[type="radio"], input[type="range"]').count(), 0)
    const toggle = controls.getByRole('switch', { name: '启用右上角任务面板' })
    assert.equal(await toggle.getAttribute('aria-checked'), 'true')
    await toggle.click()
    await settled()
    assert.equal(await toggle.getAttribute('aria-checked'), 'false')
    assert.equal(await page.locator('[data-dcb-task-panel]').count(), 0)
    assert.ok((await bounds()).panel.top > 500)
    await toggle.focus()
    await page.keyboard.press('Space')
    const width = controls.getByRole('slider', { name: '面板宽度' })
    await width.focus()
    await page.keyboard.press('End')
    assert.equal(await width.getAttribute('aria-valuenow'), '480')
    await page.keyboard.press('Home')
    for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight')
    await settled()
    assert.equal(await width.getAttribute('aria-valuenow'), '400')
    assert.equal((await bounds()).panel.width, 400)
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dsh-claude-beautify:settings:v1')).width), 400)
    const sliderBox = await width.boundingBox()
    await page.mouse.move(sliderBox.x + sliderBox.width * .5, sliderBox.y + sliderBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(sliderBox.x + sliderBox.width * .75, sliderBox.y + sliderBox.height / 2, { steps: 4 })
    await page.mouse.up()
    assert.equal(await width.getAttribute('aria-valuenow'), '430')
    await width.focus()
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowLeft')
    await page.evaluate(() => window.fixture.settings(false))
  })
  await check('custom material radios support roving focus and persist selection', async () => {
    await page.evaluate(() => window.fixture.settings(true))
    const choices = page.getByRole('radiogroup', { name: '卡片样式' })
    const clear = choices.getByRole('radio', { name: '透明玻璃', exact: true })
    const glass = choices.getByRole('radio', { name: '毛玻璃', exact: true })
    const milk = choices.getByRole('radio', { name: '奶白块', exact: true })
    await clear.click()
    assert.equal(await clear.getAttribute('aria-checked'), 'true')
    assert.equal(await clear.getAttribute('tabindex'), '0')
    assert.equal(await glass.getAttribute('tabindex'), '-1')
    await page.keyboard.press('ArrowRight')
    assert.equal(await glass.getAttribute('aria-checked'), 'true')
    assert.equal(await glass.evaluate(node => node === document.activeElement), true)
    await page.keyboard.press('End')
    assert.equal(await milk.getAttribute('aria-checked'), 'true')
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dsh-claude-beautify:settings:v1')).cardStyle), 'milk')
    await page.evaluate(() => window.fixture.settings(false))
  })
  await check('step count dropdown animates, supports keyboard, and dismisses outside or with Escape', async () => {
    await page.evaluate(() => window.fixture.settings(true))
    const picker = page.getByRole('button', { name: '默认显示步骤数', exact: true })
    const menu = page.locator('.dcb-count-menu')
    await picker.click()
    await menu.waitFor()
    const entering = await menu.evaluate(node => {
      const animation = node.getAnimations()[0]
      animation.pause()
      animation.currentTime = 90
      const style = getComputedStyle(node)
      return { opacity: Number(style.opacity), filter: style.filter, transform: style.transform }
    })
    assert.ok(entering.opacity > 0 && entering.opacity < 1)
    assert.match(entering.filter, /^blur\((?!0px)/)
    assert.notEqual(entering.transform, 'none')
    await menu.evaluate(node => node.getAnimations()[0].finish())
    await picker.focus()
    await page.keyboard.press('ArrowDown')
    assert.equal(await page.getByRole('option', { name: '3 个步骤', exact: true }).evaluate(node => node === document.activeElement), true)
    await page.keyboard.press('Escape')
    const exiting = await menu.evaluate(node => {
      const animation = node.getAnimations()[0]
      animation.pause()
      animation.currentTime = 90
      return { state: node.dataset.state, opacity: Number(getComputedStyle(node).opacity), filter: getComputedStyle(node).filter }
    })
    assert.equal(exiting.state, 'closing')
    assert.ok(exiting.opacity > 0 && exiting.opacity < 1)
    assert.match(exiting.filter, /^blur\((?!0px)/)
    await picker.click()
    const reversed = await menu.evaluate(node => {
      const animation = node.getAnimations()[0]
      animation.pause()
      animation.currentTime = 0
      return { state: node.dataset.state, opacity: Number(getComputedStyle(node).opacity) }
    })
    assert.equal(reversed.state, 'open')
    assert.ok(Math.abs(reversed.opacity - exiting.opacity) < .02)
    await menu.evaluate(node => node.getAnimations()[0].finish())
    await page.keyboard.press('Escape')
    await menu.evaluate(node => node.getAnimations()[0].finish())
    await menu.waitFor({ state: 'detached' })
    assert.equal(await picker.getAttribute('aria-expanded'), 'false')
    assert.equal(await picker.evaluate(node => node === document.activeElement), true)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Home')
    await page.keyboard.press('Enter')
    await settled()
    assert.equal(await picker.textContent(), '2 个步骤')
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dsh-claude-beautify:settings:v1')).progressView.count), 2)
    await picker.click()
    await page.getByRole('option', { name: '3 个步骤', exact: true }).click()
    await settled()
    assert.equal(await picker.textContent(), '3 个步骤')
    await picker.click()
    await page.locator('[data-dcb-settings-block="panel"] h2').click()
    await settled()
    assert.equal(await menu.count(), 0)
    await page.screenshot({ path: resolve(output, 'settings-custom-controls.png') })
    await page.evaluate(() => window.fixture.settings(false))
  })
  await check('unmount/remount releases stale nodes and attaches only the new panel', async () => {
    await page.evaluate(() => window.fixture.detach(true))
    await settled()
    assert.equal(await panel.count(), 0)
    await page.evaluate(() => window.fixture.detach(false))
    await settled()
    assert.equal(await page.locator('[data-dcb-task-panel]').count(), 1)
  })
  await check('plugin disposal restores native position and styles', async () => {
    await page.evaluate(() => { for (const cleanup of window.cleanups) cleanup() })
    await settled()
    assert.equal(await page.locator('[data-dcb-task-panel]').count(), 0)
    assert.equal(await page.locator('style[data-plugin="dsh-claude-beautify"]').count(), 0)
    assert.equal(await panel.evaluate(el => el.style.getPropertyValue('--dcb-left')), '')
    assert.ok((await bounds()).panel.top > 500)
  })
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ passed, source: nativeScript ? 'installed DSH TodoPanel from app.asar' : 'synthetic React fixture', output }))
} finally {
  await browser.close()
  server.close()
}
