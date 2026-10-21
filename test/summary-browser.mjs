import assert from 'node:assert/strict'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { build } from 'esbuild'
import { chromium } from '@playwright/test'

const project = fileURLToPath(new URL('..', import.meta.url))
const output = resolve(process.env.DSH_CLAUDE_OUTPUT_DIR || resolve(project, '..', '..', 'outputs', 'dsh-claude-beautify'))
mkdirSync(output, { recursive: true })
const built = await build({ entryPoints: [resolve(project, 'test/fixture.jsx')], bundle: true, write: false, format: 'iife' })
const routes = {
  '/': ['text/html; charset=utf-8', readFileSync(resolve(project, 'test/fixture.html'), 'utf8')],
  '/fixture.js': ['text/javascript', built.outputFiles[0].text],
  '/client.js': ['text/javascript', readFileSync(resolve(project, 'client.js'), 'utf8')],
}
const server = createServer((req, res) => {
  const route = routes[req.url]
  if (!route) { res.writeHead(404).end(); return }
  res.writeHead(200, { 'Content-Type': route[0] }).end(route[1])
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const url = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' })
const page = await browser.newPage({ viewport: { width: 1706, height: 1018 }, deviceScaleFactor: 1.5 })
const errors = []
page.on('pageerror', error => errors.push(error.message))
const card = page.getByTestId('dcb-summary')
let passed = 0
async function check(name, run) { await run(); passed++; console.log(`PASS ${name}`) }
async function settled() { await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))) }
const rows = []
let seq = 1
const event = (type, data) => rows.push({ event: { type, data, seq: seq++ } })
function call(id, name, args) {
  event('tool/call', { callId: id, name, arguments: JSON.stringify(args) })
  event('tool/result', { message: { source: { callId: id }, isError: false } })
}
event('deliverables/presented', { files: [{ path: 'outputs/Animation preview.zip', description: '动画工程' }, { path: 'outputs/frame.png', description: '抽帧' }, { path: 'outputs/master.png', description: '超大原图' }] })
call('web', 'web_search', { query: 'animation' })
call('memory', 'read', { path: '/work/memory/Character Setting.md' })
call('skill', 'skill', { name: 'remotion-best-practices' })
try {
  await page.goto(url)
  await page.getByTestId('todo-panel').waitFor()
  await page.evaluate(() => {
    window.openedResources = []
    window.cleanups = []
    window.__ModuleLoader__ = { load(spec) { window.plugin = spec.factory(() => window.fixtureReact) } }
  })
  await page.addScriptTag({ url: `${url}/client.js` })
  await page.evaluate(() => {
    const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='), character => character.charCodeAt(0))
    const workspaceFiles = {
      stat: async (_session, path) => ({ ok: true, value: { absolutePath: path, bytes: path.endsWith('master.png') ? 9 * 1024 * 1024 : 68 } }),
      readBytes: async (_session, path) => path.endsWith('.png') ? ({ ok: true, value: { data: png } }) : ({ ok: false, error: { code: 'not-text' } }),
    }
    const ctx = {
      get(name) { return name === 'remote' || name === 'remote.workspaceFiles' ? { workspaceFiles } : undefined },
      slots: {
        inject(name, callback) { callback() },
        register(spec, component) {
          if (spec.name === 'settings.section') window.fixtureSettings = component
          else { window.fixtureHeader = component; window.fixtureHeaderSpec = spec }
          return () => {}
        },
      },
      sessions: { binding: id => window.fixtureBinding(id) },
      sidebarRight: { openResource: address => { window.openedResources.push(address); window.fixture.sidebar(true) } },
      effect(callback) { window.cleanups.push(callback()) },
      inject(names, callback) { callback(ctx) },
    }
    window.plugin.apply(ctx)
    window.fixture.refresh()
  })
  await page.getByRole('button', { name: '会话进度与输出', exact: true }).waitFor()
  await card.waitFor()
  assert.equal(await card.count(), 1, 'The panel opens itself when the session already lists tasks')
  await card.getByRole('button', { name: '关闭进度面板' }).click()
  assert.equal(await card.count(), 0)
  await page.evaluate(() => window.fixture.update([
    { content: '整理需求与界面结构', status: 'completed' },
    { content: '实现右上角任务面板，并保留任务状态的实时更新', status: 'in_progress' },
    { content: '检查窗口缩放与浅色、深色主题', status: 'pending' },
    { content: '完成验证并交付', status: 'pending' },
  ]))
  await settled()
  assert.equal(await card.count(), 0, 'After a manual close, task updates stay quiet for this session')
  await page.getByRole('button', { name: '会话进度与输出', exact: true }).click()
  await card.waitFor()
  await page.evaluate(rows => {
    window.fixture.records(rows)
    window.fixture.update([
      { content: '整理需求', status: 'completed' },
      { content: '准备工程', status: 'completed' },
      { content: '制作并渲染动画', status: 'completed' },
      { content: '检查成片并交付', status: 'completed' },
    ])
  }, rows)
  await settled()
  await check('matches reference proportions: 320px wide, fixed 360px tall, 13px row text', async () => {
    const metrics = await card.evaluate(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, rowFont: getComputedStyle(el.querySelector('.dcb-resource')).fontSize }))
    assert.equal(metrics.width, 320)
    assert.equal(metrics.height, 360)
    assert.equal(metrics.rowFont, '13px')
    assert.equal(await page.locator('[data-dcb-native-hidden]').count(), 1)
    await card.screenshot({ path: resolve(output, 'summary-reference-light.png') })
    await page.screenshot({ path: resolve(output, 'summary-desktop.png') })
  })
  await check('progress folds earlier steps and expands on demand', async () => {
    assert.equal(await card.locator('.dcb-step').count(), 2)
    await card.getByRole('button', { name: '2 个先前步骤' }).click()
    assert.equal(await card.locator('.dcb-step').count(), 4)
    await card.getByRole('button', { name: '收起先前步骤' }).click()
    const entryButton = page.getByRole('button', { name: '会话进度与输出', exact: true })
    await entryButton.click()
    await page.evaluate(() => {
      window.fixture.running(true)
      window.fixture.update([
        { content: '整理需求', status: 'completed' },
        { content: '准备工程', status: 'completed' },
        { content: '制作并渲染动画', status: 'completed' },
        { content: '检查成片并交付', status: 'completed' },
        { content: '设计并构建进度面板页面', status: 'in_progress' },
        { content: '发布并检查页面', status: 'pending' },
      ])
    })
    await settled()
    assert.equal(await card.count(), 0, 'A session auto-opens only once, so later work keeps the manual close')
    assert.ok((await entryButton.innerText()).includes('第 5 步，共 6 步'))
    await entryButton.click()
    assert.equal(await card.locator('.dcb-step').count(), 4)
    assert.equal(await card.locator('.dcb-status-dot').count(), 0, 'Working steps use a rail instead of spinners or checkboxes')
    assert.ok(await card.getByRole('button', { name: '2 个先前步骤' }).count())
    assert.equal(await card.locator('[data-status="in_progress"]').getAttribute('aria-current'), 'step')
    assert.deepEqual(await card.evaluate(el => el.getAnimations({ subtree: true }).map(animation => animation.animationName)), [])
    await card.screenshot({ path: resolve(output, 'summary-working.png') })
    await page.screenshot({ path: resolve(output, 'summary-working-desktop.png') })
    await entryButton.screenshot({ path: resolve(output, 'summary-working-entry.png') })
    await page.evaluate(() => {
      window.fixture.update([
        { content: '整理需求', status: 'completed' }, { content: '准备工程', status: 'completed' },
        { content: '制作并渲染动画', status: 'completed' }, { content: '检查成片并交付', status: 'completed' },
        { content: '设计并构建进度面板页面', status: 'completed' }, { content: '发布并检查页面', status: 'in_progress' },
      ])
    })
    await settled()
    assert.ok((await entryButton.innerText()).includes('第 6 步，共 6 步'))
    await page.evaluate(() => {
      window.fixture.running(false)
      window.fixture.update([
        { content: '整理需求', status: 'completed' }, { content: '准备工程', status: 'completed' },
        { content: '制作并渲染动画', status: 'completed' }, { content: '检查成片并交付', status: 'completed' },
      ])
    })
    await settled()
    assert.ok(!(await entryButton.innerText()).includes('步'))
    assert.equal(await card.locator('.dcb-status-dot').count(), 1)
  })
  await check('declared outputs and actual used resources populate separate sections', async () => {
    assert.equal(await card.locator('.dcb-output').count(), 3)
    assert.equal(await card.locator('.dcb-resource').count(), 3)
    assert.ok(await card.getByText('remotion-best-practices', { exact: true }).count())
    assert.ok(await card.getByText('已读取 · Character Setting.md', { exact: true }).count())
    await card.getByRole('button', { name: '本次会话中已使用' }).click()
    assert.equal(await card.locator('.dcb-resource').count(), 0)
    await card.getByRole('button', { name: '本次会话中已使用' }).click()
  })
  await check('images load a real preview tile while other files keep a short type tile', async () => {
    await page.waitForFunction(() => document.querySelectorAll('.dcb-tile img').length === 1)
    const tiles = await card.locator('.dcb-tile').evaluateAll(nodes => nodes.map(node => ({ label: node.textContent, kind: node.dataset.kind, hasImage: !!node.querySelector('img'), loading: node.querySelector('img')?.getAttribute('loading') })))
    assert.deepEqual(tiles.map(tile => tile.label), ['ZIP', '', 'PNG'])
    assert.deepEqual(tiles.map(tile => tile.kind), ['file', 'image', 'image'])
    assert.deepEqual(tiles.map(tile => tile.hasImage), [false, true, false])
    assert.equal(tiles[1].loading, 'lazy')
    const widths = await card.locator('.dcb-tile').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width))
    assert.deepEqual(widths, [30, 30, 30])
    const source = await card.locator('.dcb-tile img').getAttribute('src')
    assert.ok(source.startsWith('blob:'), 'the preview comes from workspace bytes, not a guessed URL')
    assert.equal(await card.locator('[data-thumbnail="image"]').count(), 1)
    assert.equal(await card.locator('[data-thumbnail="pending"]').count(), 1, 'a file past the size limit keeps its type tile')
    await card.screenshot({ path: resolve(output, 'summary-thumbnails.png') })
    const decoded = await card.locator('.dcb-tile img').evaluate(async image => {
      const bytes = await (await fetch(image.src)).arrayBuffer()
      return { ok: image.complete && image.naturalWidth > 0, bytes: bytes.byteLength }
    })
    assert.deepEqual(decoded, { ok: true, bytes: 68 })
  })
  await check('long content scrolls inside the same fixed card with no horizontal spill', async () => {
    const long = Array.from({ length: 40 }, (_, index) => ({ content: `步骤 ${index}：验证较长内容可以换行并在固定高度面板中滚动。`, status: 'pending' }))
    await page.evaluate(todos => window.fixture.update(todos), long)
    await settled()
    assert.equal((await card.boundingBox()).height, 360)
    assert.ok(await card.evaluate(el => el.scrollHeight > el.clientHeight))
    await card.evaluate(el => { el.scrollTop = el.scrollHeight })
    assert.ok(await card.evaluate(el => el.scrollTop > 0))
    assert.ok(await card.evaluate(el => el.scrollWidth <= el.clientWidth))
  })
  await check('output opens its exact session file address and sidebar resize keeps card in its column', async () => {
    await card.locator('.dcb-output').first().click()
    assert.equal(await page.evaluate(() => window.openedResources[0]), 'dsh-resource://file/session/a/outputs/Animation%20preview.zip')
    await settled()
    const box = await card.boundingBox()
    const column = await page.locator('main').boundingBox()
    assert.ok(box.x >= column.x && box.x + box.width <= column.x + column.width)
    await page.evaluate(() => window.fixture.sidebar(false))
  })
  await check('close button, re-open button, and Escape retain native dock suppression', async () => {
    await card.getByRole('button', { name: '关闭进度面板' }).click()
    assert.equal(await card.count(), 0)
    assert.equal(await page.locator('[data-dcb-native-hidden]').count(), 1)
    await page.getByRole('button', { name: '会话进度与输出', exact: true }).click()
    await page.keyboard.press('Escape')
    assert.equal(await card.count(), 0)
    await page.getByRole('button', { name: '会话进度与输出', exact: true }).click()
  })
  await check('session isolation removes previous outputs and resource records', async () => {
    await page.evaluate(() => window.fixture.update([]))
    await settled()
    assert.equal(await card.getByTestId('dcb-progress').count(), 0)
    assert.equal(await card.getByText('本次会话尚未创建任务清单', { exact: true }).count(), 0)
    assert.equal(await card.getByTestId('dcb-outputs').getByRole('button', { name: '关闭进度面板' }).count(), 1)
    await page.evaluate(rows => window.fixture.records(rows.filter(entry => entry.event.type !== 'deliverables/presented')), rows)
    await settled()
    assert.equal(await card.getByTestId('dcb-outputs').count(), 0)
    assert.equal(await card.getByTestId('dcb-resources').getByRole('button', { name: '关闭进度面板' }).count(), 1)
    assert.equal(await card.getByTestId('dcb-resources').evaluate(el => getComputedStyle(el).borderTopWidth), '0px')
    await card.screenshot({ path: resolve(output, 'summary-resources-only.png') })
    await card.getByRole('button', { name: '关闭进度面板' }).click()
    assert.equal(await card.count(), 0)
    await page.getByRole('button', { name: '会话进度与输出', exact: true }).click()
    await page.evaluate(rows => window.fixture.records(rows), rows)
    await page.evaluate(() => window.fixture.session('b'))
    await settled()
    assert.equal(await card.count(), 1, 'A newly visited session opens itself once its task list appears')
    assert.equal(await card.locator('.dcb-output').count(), 0)
    assert.equal(await card.locator('.dcb-resource').count(), 0)
    assert.ok(await card.getByText('第二个会话的任务', { exact: true }).count())
    await page.evaluate(() => window.fixture.session('empty'))
    await settled()
    assert.equal(await card.count(), 0)
    await page.evaluate(() => window.fixture.session('a'))
    await settled()
  })
  await check('dark theme and phone view preserve compact fonts and fixed scrolling', async () => {
    await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', ''))
    assert.equal(await card.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(41, 40, 36)')
    await card.screenshot({ path: resolve(output, 'summary-reference-dark.png') })
    await page.setViewportSize({ width: 390, height: 700 })
    await settled()
    const box = await card.boundingBox()
    assert.ok(box.x >= 0 && box.x + box.width <= 390)
    assert.equal(box.height, 360)
    assert.equal(await card.locator('.dcb-step').first().evaluate(el => getComputedStyle(el).fontSize), '13px')
    await page.screenshot({ path: resolve(output, 'summary-mobile.png') })
    await page.setViewportSize({ width: 1706, height: 1018 })
    await page.evaluate(() => document.body.removeAttribute('data-ds-dark-theme'))
  })
  await check('disabling restores the original dock; re-enabling hides it only after the card is mounted', async () => {
    await page.evaluate(() => window.fixture.settings(true))
    await page.getByRole('checkbox').uncheck()
    await settled()
    assert.equal(await card.count(), 0)
    assert.equal(await page.locator('[data-dcb-native-hidden]').count(), 0)
    assert.ok(await page.getByTestId('todo-panel').isVisible())
    await page.getByRole('checkbox').check()
    await settled()
    assert.equal(await page.locator('[data-dcb-native-hidden]').count(), 1)
    assert.ok(await card.isVisible())
    const stored = await page.evaluate(() => localStorage.getItem('dsh-claude-beautify:settings:v1'))
    assert.ok(!stored.includes('Character') && !stored.includes('Animation'))
    await page.evaluate(() => window.fixture.settings(false))
  })
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ passed, output }))
} finally { await browser.close(); server.close() }
