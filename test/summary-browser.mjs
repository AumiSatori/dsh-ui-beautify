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
const context = await browser.newContext({ viewport: { width: 1706, height: 1018 }, deviceScaleFactor: 1.5 })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
await page.addInitScript(() => {
  window.dropdownReveals = []
  window.hoverDismissals = []
  const animate = Element.prototype.animate
  Element.prototype.animate = function(frames, options) {
    if (options?.id === 'dcb-dropdown') window.dropdownReveals.push({ target: this.id, frames, duration: options.duration })
    if (options?.id === 'dcb-hover-dismiss') window.hoverDismissals.push({ target: this.id, frames, duration: options.duration })
    return animate.call(this, frames, options)
  }
})
const card = page.getByTestId('dcb-summary')
let passed = 0
async function check(name, run) { await run(); passed++; console.log(`PASS ${name}`) }
async function settled() {
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))))
}
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
async function mountPlugin(target = page) {
  await target.getByTestId('todo-panel').waitFor()
  await target.evaluate(() => {
    window.openedResources = []
    window.cleanups = []
    window.__ModuleLoader__ = { load(spec) { window.plugin = spec.factory(() => window.fixtureReact) } }
  })
  await target.addScriptTag({ url: `${url}/client.js` })
  await target.evaluate(() => {
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
  await target.getByRole('button', { name: '会话进度与输出', exact: true }).waitFor()
}
try {
  await page.goto(url)
  await mountPlugin()
  await settled()
  assert.equal(await card.count(), 0, 'Idle history does not automatically open the panel')
  await page.evaluate(() => window.fixture.update([
    { content: '整理需求与界面结构', status: 'completed' },
    { content: '实现右上角任务面板，并保留任务状态的实时更新', status: 'in_progress' },
    { content: '检查窗口缩放与浅色、深色主题', status: 'pending' },
    { content: '完成验证并交付', status: 'pending' },
  ]))
  await settled()
  assert.equal(await card.count(), 0, 'Idle task updates do not automatically open the panel')
  await check('mouse hover previews without a click, bridges the gap, and preserves explicit open and close', async () => {
    const entry = page.getByRole('button', { name: '会话进度与输出', exact: true })
    const outside = () => page.mouse.move(40, 400)
    await entry.hover()
    await card.waitFor()
    await settled()
    const entryBox = await entry.boundingBox()
    const cardBox = await card.boundingBox()
    await page.mouse.move(entryBox.x + entryBox.width / 2, entryBox.y + entryBox.height + 6)
    await page.waitForTimeout(100)
    assert.equal(await card.count(), 1, 'Crossing the gap does not immediately dismiss the preview')
    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + 20)
    await page.waitForTimeout(280)
    assert.equal(await card.count(), 1, 'Entering the card cancels the delayed close')
    await outside()
    assert.equal(await card.count(), 1)
    await card.waitFor({ state: 'hidden' })
    await entry.dispatchEvent('pointerover', { pointerType: 'touch', isPrimary: true })
    assert.equal(await card.count(), 0, 'Touch contact does not trigger mouse hover')
    await entry.hover()
    await card.waitFor()
    await entry.click()
    await outside()
    await page.waitForTimeout(280)
    assert.equal(await card.count(), 1, 'Clicking a hover preview pins it rather than immediately closing it')
    await card.getByRole('button', { name: '关闭进度面板' }).click()
    assert.equal(await card.count(), 0)
    await outside()
    await entry.hover()
    await card.waitFor()
    await card.getByRole('button', { name: '进度', exact: true }).focus()
    await outside()
    await page.waitForTimeout(280)
    assert.equal(await card.count(), 1, 'Keyboard focus inside the card keeps it available')
    await page.keyboard.press('Escape')
    assert.equal(await card.count(), 0, 'Escape also dismisses hover previews')
    await entry.hover()
    await card.waitFor()
    await outside()
    await page.evaluate(() => window.fixture.session('b'))
    await settled()
    await page.waitForTimeout(280)
    assert.equal(await card.count(), 0, 'An old session\'s hover timer cannot affect the new session')
    await entry.hover()
    await card.waitFor()
    await page.evaluate(() => window.fixture.session('a'))
    await settled()
    assert.equal(await card.count(), 0, 'Hover previews are not persisted when returning to a session')
    await outside()
  })
  await check('hover dismissal fades and retracts before unmounting, and re-entry reverses the current frame', async () => {
    const entry = page.getByRole('button', { name: '会话进度与输出', exact: true })
    const outside = () => page.mouse.move(40, 400)
    const waitClosing = () => page.waitForFunction(() => document.querySelector('.dcb-summary')?.dataset.state === 'closing')
    await entry.hover()
    await settled()
    await outside()
    await waitClosing()
    const samples = await page.evaluate(async () => {
      const node = document.querySelector('.dcb-summary')
      const frames = []
      await new Promise(done => {
        const sample = () => {
          if (!node.isConnected) { done(); return }
          const style = getComputedStyle(node)
          frames.push({ opacity: Number(style.opacity), top: node.getBoundingClientRect().top, clip: style.clipPath })
          requestAnimationFrame(sample)
        }
        sample()
      })
      return frames
    })
    assert.ok(samples.length >= 4, 'The card stays mounted through multiple exit frames')
    assert.ok(samples.some(frame => frame.opacity > 0 && frame.opacity < 1))
    assert.ok(samples.slice(1).every((frame, index) => frame.opacity <= samples[index].opacity + .001))
    assert.ok(samples.at(-1).top < samples[0].top, 'The card retracts upward as it fades')
    assert.notEqual(samples.at(-1).clip, samples[0].clip)
    assert.equal(await card.count(), 0)
    assert.equal(await page.evaluate(() => window.hoverDismissals.at(-1).duration), 180)
    await entry.hover()
    await settled()
    await outside()
    await waitClosing()
    const before = await card.evaluate(el => {
      window.hoverCardNode = el
      const animation = el.getAnimations().find(value => value.id === 'dcb-hover-dismiss')
      animation.pause()
      animation.currentTime = 80
      const style = getComputedStyle(el)
      return { opacity: Number(style.opacity), clip: style.clipPath }
    })
    assert.ok(before.opacity > 0 && before.opacity < 1)
    assert.equal(await card.getAttribute('aria-hidden'), 'true')
    assert.equal(await card.evaluate(el => el.inert), true, 'Exiting content is excluded from keyboard and assistive interaction')
    await card.screenshot({ path: resolve(output, 'summary-hover-exit-midway.png') })
    await entry.hover()
    const resumed = await card.evaluate(el => {
      const frame = el.getAnimations().find(value => value.id === 'dcb-dropdown').effect.getKeyframes()[0]
      return { opacity: Number(frame.opacity), clip: frame.clipPath, sameNode: el === window.hoverCardNode }
    })
    assert.ok(Math.abs(resumed.opacity - before.opacity) < .001, 'Re-entry continues from the exit opacity instead of jumping')
    assert.equal(resumed.clip, before.clip)
    assert.equal(resumed.sameNode, true, 'Re-entry retains the card and its thumbnails')
    await settled()
    await page.waitForTimeout(220)
    assert.equal(await card.getAttribute('aria-hidden'), 'false')
    assert.equal(await card.evaluate(el => el.inert), false)
    await outside()
    await waitClosing()
    await page.evaluate(() => {
      window.fixture.running(true)
      window.fixture.update([{ content: '重新安排当前任务步骤', status: 'pending' }])
    })
    await settled()
    await page.waitForTimeout(220)
    assert.equal(await card.getAttribute('data-state'), 'open', 'A new plan cancels an in-flight hover dismissal and pins the card')
    await page.evaluate(() => window.fixture.running(false))
    await card.getByRole('button', { name: '关闭进度面板' }).click()
    await outside()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const beforeReduced = await page.evaluate(() => window.hoverDismissals.length)
    await entry.hover()
    await settled()
    await outside()
    await card.waitFor({ state: 'hidden' })
    assert.equal(await page.evaluate(() => window.hoverDismissals.length), beforeReduced, 'Reduced motion skips the exit animation')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await entry.hover()
    await settled()
    await outside()
    await waitClosing()
    await page.evaluate(() => window.fixture.session('b'))
    await settled()
    await page.waitForTimeout(220)
    assert.equal(await card.count(), 0, 'Session switches remove the old card and cancel its exit completion')
    await page.evaluate(() => window.fixture.session('a'))
    await settled()
    assert.equal(await card.count(), 0)
  })
  await check('only real plan edits auto-open as pinned panels; tools, files and ordinary runs do not', async () => {
    const entry = page.getByRole('button', { name: '会话进度与输出', exact: true })
    const baseline = await page.evaluate(() => window.dropdownReveals.length)
    await page.evaluate(() => window.fixture.running(true))
    await settled()
    assert.equal(await card.count(), 0, 'Starting a run with existing tasks stays closed')
    await page.evaluate(rows => window.fixture.records(rows), rows)
    await settled()
    assert.equal(await card.count(), 0, 'Tool calls and delivered files do not auto-open, even with an existing plan')
    await page.evaluate(() => window.fixture.update([
      { content: '整理需求与界面结构', status: 'completed' },
      { content: '实现右上角任务面板，并保留任务状态的实时更新', status: 'completed' },
      { content: '检查窗口缩放与浅色、深色主题', status: 'in_progress' },
      { content: '完成验证并交付', status: 'pending' },
    ]))
    await settled()
    assert.equal(await card.count(), 0, 'Updating only step statuses does not count as arranging a plan')
    assert.equal(await page.evaluate(() => window.dropdownReveals.length), baseline)
    await page.evaluate(() => window.fixture.update([
      { content: '整理新的步骤安排', status: 'completed' },
      { content: '实现计划触发展开', status: 'in_progress' },
      { content: '核对面板交互', status: 'pending' },
    ]))
    await settled()
    assert.equal(await card.getAttribute('data-state'), 'open')
    assert.equal(await page.evaluate(() => window.dropdownReveals.length), baseline + 1)
    await page.mouse.move(40, 400)
    await page.waitForTimeout(450)
    assert.equal(await card.count(), 1, 'A plan-triggered opening is pinned like a click, not dismissed like hover')
    await page.locator('article h1').click()
    await card.waitFor({ state: 'detached' })
    await page.evaluate(() => window.fixture.update([{ content: '本轮再次调整步骤', status: 'pending' }]))
    await settled()
    assert.equal(await card.count(), 0, 'A manual close stays closed for the rest of that run')
    await page.evaluate(() => window.fixture.running(false))
    await settled()
    await page.evaluate(() => window.fixture.running(true))
    await settled()
    assert.equal(await card.count(), 0, 'The next run also waits for an actual plan update')
    await entry.hover()
    await settled()
    await page.mouse.move(40, 400)
    await card.waitFor({ state: 'detached' })
    await page.evaluate(() => window.fixture.running(false))
    await page.evaluate(rows => window.fixture.records(rows), [])
    await settled()
  })
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
  await check('matches reference width and typography with three naturally sized modules', async () => {
    const metrics = await card.evaluate(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, rowFont: getComputedStyle(el.querySelector('.dcb-resource')).fontSize }))
    assert.equal(metrics.width, 320)
    // The three-step default adds one 38px row to the previous two-step fixture.
    assert.ok(metrics.height > 300 && metrics.height < 540, JSON.stringify(metrics))
    assert.equal(metrics.rowFont, '13px')
    assert.equal(await card.locator('.dcb-module-toggle').count(), 3)
    assert.equal(await page.locator('[data-dcb-native-hidden]').count(), 1)
    await card.screenshot({ path: resolve(output, 'summary-reference-light.png') })
    await page.screenshot({ path: resolve(output, 'summary-desktop.png') })
  })
  await check('prior steps animate both ways, reverse smoothly and retain recent rows', async () => {
    const history = card.locator('.dcb-history-content')
    const initialHeight = (await card.boundingBox()).height
    await page.evaluate(() => { window.recentStepsNode = document.querySelector('.dcb-recent-steps') })
    assert.equal(await card.getByRole('listitem').count(), 3)
    assert.equal(await history.evaluate(el => el.inert && el.getBoundingClientRect().height === 0), true)
    const sampleToggle = () => page.evaluate(async () => {
      const card = document.querySelector('.dcb-summary')
      const history = card.querySelector('.dcb-history-content')
      const recent = card.querySelector('.dcb-recent-steps')
      const sample = () => ({ history: history.getBoundingClientRect().height, card: card.getBoundingClientRect().height, recent: recent.getBoundingClientRect().top })
      const samples = [sample()]
      card.querySelector('.dcb-history').click()
      const start = performance.now()
      await new Promise(done => {
        const frame = now => {
          samples.push(sample())
          if (now - start < 380) requestAnimationFrame(frame)
          else done()
        }
        requestAnimationFrame(frame)
      })
      return samples
    })
    const expansion = await sampleToggle()
    for (const key of ['history', 'card', 'recent']) {
      assert.ok(new Set(expansion.map(frame => Math.round(frame[key]))).size >= 4, `${key} grows through intermediate frames`)
      assert.ok(expansion.slice(1).every((frame, index) => frame[key] >= expansion[index][key] - 1))
    }
    assert.equal(await card.getByRole('listitem').count(), 4)
    assert.equal(await history.evaluate(el => el.inert), false)
    assert.equal(await card.locator('.dcb-history').getAttribute('aria-controls'), await history.getAttribute('id'))
    await card.screenshot({ path: resolve(output, 'summary-history-expanded.png') })
    const contraction = await sampleToggle()
    for (const key of ['history', 'card', 'recent']) {
      assert.ok(new Set(contraction.map(frame => Math.round(frame[key]))).size >= 4, `${key} contracts through intermediate frames`)
      assert.ok(contraction.slice(1).every((frame, index) => frame[key] <= contraction[index][key] + 1))
    }
    assert.equal(contraction.at(-1).history, 0)
    const reversal = await page.evaluate(async () => {
      const toggle = document.querySelector('.dcb-history')
      const height = () => document.querySelector('.dcb-history-content').getBoundingClientRect().height
      toggle.click()
      await new Promise(done => setTimeout(done, 90))
      const midway = height()
      toggle.click()
      await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))
      return { midway, reversed: height() }
    })
    assert.ok(reversal.midway > 5)
    assert.ok(reversal.reversed > 0 && reversal.reversed <= reversal.midway + 1, 'Reversing does not jump to the collapsed height')
    await settled()
    assert.equal(await history.evaluate(el => el.getBoundingClientRect().height), 0)
    assert.equal(await page.evaluate(() => document.querySelector('.dcb-recent-steps') === window.recentStepsNode), true)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await card.locator('.dcb-history').focus()
    await page.keyboard.press('Enter')
    await settled()
    assert.equal(await card.getByRole('listitem').count(), 4)
    assert.equal(await history.evaluate(el => getComputedStyle(el).transitionDuration), '0s')
    assert.equal(await card.evaluate(el => el.getAnimations({ subtree: true }).length), 0)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await card.getByRole('button', { name: '进度', exact: true }).click()
    await settled()
    assert.equal(await card.getByRole('listitem').count(), 0)
    await card.getByRole('button', { name: '进度', exact: true }).click()
    await settled()
    assert.equal(await card.getByRole('listitem').count(), 4, 'The outer module preserves the expanded history')
    await card.locator('.dcb-history').focus()
    await page.keyboard.press('Space')
    await settled()
    assert.equal(await card.getByRole('listitem').count(), 3)
    assert.ok(Math.abs((await card.boundingBox()).height - initialHeight) < 1)
    await card.screenshot({ path: resolve(output, 'summary-history-keyboard.png') })
    await card.locator('.dcb-history').evaluate(el => el.blur())
    await card.screenshot({ path: resolve(output, 'summary-history-collapsed.png') })
  })
  await check('progress folds earlier steps and expands on demand', async () => {
    assert.equal(await card.getByRole('listitem').count(), 3)
    await card.getByRole('button', { name: '1 个先前步骤' }).click()
    await settled()
    assert.equal(await card.getByRole('listitem').count(), 4)
    await card.getByRole('button', { name: '收起先前步骤' }).click()
    await settled()
    const entryButton = page.getByRole('button', { name: '会话进度与输出', exact: true })
    await entryButton.click()
    const beforeStart = await page.evaluate(() => window.dropdownReveals.length)
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
    assert.equal(await card.count(), 1, 'Arranging new steps during a run automatically pins and reveals the panel')
    assert.equal(await page.evaluate(() => window.dropdownReveals.length), beforeStart + 1)
    assert.ok((await entryButton.innerText()).includes('第 5 步，共 6 步'))
    assert.equal(await card.getByRole('listitem').count(), 3)
    assert.equal(await card.locator('.dcb-recent-steps .dcb-status-dot').count(), 3, 'The working window is limited to three steps')
    const activeDot = card.locator('[data-status="in_progress"] .dcb-status-dot')
    assert.equal(await activeDot.evaluate(el => getComputedStyle(el).animationName), 'none', 'The solid core stays steady')
    assert.equal(await activeDot.locator('.dcb-status-orbit').evaluate(el => getComputedStyle(el).animationName), 'dcb-orbit')
    assert.equal(await activeDot.locator('.dcb-status-ripple').evaluate(el => getComputedStyle(el).animationName), 'dcb-ripple')
    assert.ok(await card.getByRole('button', { name: '3 个先前步骤' }).count())
    assert.equal(await card.locator('[data-status="in_progress"]').getAttribute('aria-current'), 'step')
    assert.ok((await card.evaluate(el => el.getAnimations({ subtree: true }).map(animation => animation.animationName))).every(name => ['dcb-orbit', 'dcb-ripple', 'dcb-text-shimmer'].includes(name)))
    const reveal = await page.evaluate(() => window.dropdownReveals.at(-1))
    assert.equal(reveal.duration, 240)
    assert.ok(reveal.frames[0].clipPath.includes('100%') && reveal.frames[1].transform === 'translateY(0)')
    await card.screenshot({ path: resolve(output, 'summary-working.png') })
    await page.screenshot({ path: resolve(output, 'summary-working-desktop.png') })
    await entryButton.screenshot({ path: resolve(output, 'summary-working-entry.png') })
    await card.getByRole('button', { name: '关闭进度面板' }).click()
    await page.evaluate(() => {
      window.fixture.update([
        { content: '整理需求', status: 'completed' }, { content: '准备工程', status: 'completed' },
        { content: '制作并渲染动画', status: 'completed' }, { content: '检查成片并交付', status: 'completed' },
        { content: '设计并构建进度面板页面', status: 'completed' }, { content: '发布并检查页面', status: 'in_progress' },
      ])
    })
    await settled()
    assert.equal(await card.count(), 0, 'Task progress does not reopen a panel manually closed during the same run')
    assert.ok((await entryButton.innerText()).includes('第 6 步，共 6 步'))
    await entryButton.click()
    await page.evaluate(() => {
      window.fixture.running(false)
      window.fixture.update([
        { content: '整理需求', status: 'completed' }, { content: '准备工程', status: 'completed' },
        { content: '制作并渲染动画', status: 'completed' }, { content: '检查成片并交付', status: 'completed' },
      ])
    })
    await settled()
    assert.ok(!(await entryButton.innerText()).includes('步'))
    assert.equal(await card.locator('.dcb-status-dot svg').count(), 0, 'Completed steps retain the same solid gray dot, including the final step')
    await card.getByRole('button', { name: '关闭进度面板' }).click()
    const beforeNextRun = await page.evaluate(() => window.dropdownReveals.length)
    await page.evaluate(() => window.fixture.running(true))
    await settled()
    assert.equal(await card.count(), 0, 'A new run by itself does not reveal an old plan')
    await page.evaluate(() => window.fixture.update([{ content: '安排下一轮计划', status: 'pending' }]))
    await settled()
    assert.equal(await card.count(), 1, 'Arranging a new plan in the next run reveals again')
    assert.equal(await page.evaluate(() => window.dropdownReveals.length), beforeNextRun + 1)
    const whileOpen = await page.evaluate(() => window.dropdownReveals.length)
    await page.evaluate(() => window.fixture.running(false))
    await settled()
    await page.evaluate(() => { window.fixture.running(true); window.fixture.update([{ content: '安排另一轮计划', status: 'pending' }]) })
    await settled()
    assert.equal(await page.evaluate(() => window.dropdownReveals.length), whileOpen + 1, 'An already-open panel replays its dropdown for a new plan')
    await page.evaluate(() => window.fixture.running(false))
    await settled()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await card.getByRole('button', { name: '关闭进度面板' }).click()
    const beforeReducedMotion = await page.evaluate(() => window.dropdownReveals.length)
    await page.evaluate(() => { window.fixture.running(true); window.fixture.update([{ content: '减少动态效果下的新计划', status: 'pending' }]) })
    await settled()
    assert.equal(await card.count(), 1)
    assert.equal(await page.evaluate(() => window.dropdownReveals.length), beforeReducedMotion, 'Reduced motion opens without a dropdown animation')
    await page.evaluate(() => window.fixture.running(false))
    await settled()
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })
  await check('active indicator has continuous orbit and expanding ripple around a stable solid core', async () => {
    const todos = [
      { content: '准备素材与工程', status: 'completed' },
      { content: '正在生成并渲染动画', status: 'in_progress' },
      { content: '检查成片并交付', status: 'pending' },
    ]
    await page.evaluate(todos => { window.fixture.update(todos); window.fixture.running(true) }, todos)
    await settled()
    const dot = card.locator('[data-status="in_progress"] .dcb-status-dot')
    const size = await dot.boundingBox()
    const phase = time => card.evaluate((el, time) => {
      for (const animation of el.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = time }
      const dot = el.querySelector('[data-status="in_progress"] .dcb-status-dot')
      const core = getComputedStyle(dot.querySelector('.dcb-status-core'))
      const orbit = getComputedStyle(dot.querySelector('.dcb-status-orbit'))
      const ripple = getComputedStyle(dot.querySelector('.dcb-status-ripple'))
      return { color: core.fill, opacity: core.opacity, orbit: orbit.transform, ripple: ripple.transform, rippleOpacity: Number(ripple.opacity) }
    }, time)
    const before = await phase(0)
    const firstFrame = await card.getByTestId('dcb-progress').screenshot({ path: resolve(output, 'summary-indicator-before.png') })
    const during = await phase(450)
    const secondFrame = await card.getByTestId('dcb-progress').screenshot({ path: resolve(output, 'summary-indicator-during.png') })
    assert.notEqual(during.orbit, before.orbit, 'The arc travels around the core rather than blinking in place')
    assert.notEqual(during.ripple, before.ripple, 'The outer halo expands')
    assert.ok(during.rippleOpacity < before.rippleOpacity)
    assert.equal(during.color, 'rgb(32, 32, 32)')
    assert.equal(during.opacity, '1')
    assert.equal(before.color, during.color)
    assert.notDeepEqual(firstFrame, secondFrame, 'Animation phases produce different rendered pixels')
    assert.deepEqual(await dot.boundingBox(), size, 'Decorative motion does not move the core or task text')
    const geometry = await dot.evaluate(el => {
      const core = el.querySelector('.dcb-status-core')
      const box = core.getBoundingClientRect()
      return { tag: core.tagName, width: box.width, height: box.height, stroke: getComputedStyle(core).strokeWidth,
        arcs: [...el.querySelectorAll('.dcb-status-orbit circle')].map(arc => ({ tag: arc.tagName, cap: getComputedStyle(arc).strokeLinecap, join: getComputedStyle(arc).strokeLinejoin, radius: arc.r.baseVal.value })) }
    })
    assert.equal(geometry.tag, 'circle')
    assert.equal(geometry.width, geometry.height, 'The vector core has identical horizontal and vertical diameters')
    assert.equal(geometry.width + Number.parseFloat(geometry.stroke), 8)
    assert.equal(geometry.arcs.length, 1, 'Only one arc rotates; the secondary gray arc is removed')
    assert.ok(geometry.arcs.every(arc => arc.tag === 'circle' && arc.cap === 'round' && arc.join === 'round' && arc.radius === 7.5), 'The orbit follows a circular path with rounded endpoints')
    assert.equal(await card.locator('[data-status="completed"] .dcb-status-orbit, [data-status="pending"] .dcb-status-orbit').count(), 0)
    // Deterministic frames for a compact animation preview; synthetic task text only.
    for (let index = 0; index < 36; index++) {
      await phase(index * 75)
      await card.getByTestId('dcb-progress').screenshot({ path: resolve(output, `summary-indicator-frame-${String(index).padStart(2, '0')}.png`) })
    }
    await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', ''))
    const dark = await phase(450)
    assert.equal(dark.color, 'rgb(242, 242, 242)')
    await card.getByTestId('dcb-progress').screenshot({ path: resolve(output, 'summary-indicator-dark.png') })
    await page.evaluate(() => document.body.removeAttribute('data-ds-dark-theme'))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await dot.locator('.dcb-status-orbit').evaluate(el => getComputedStyle(el).display), 'none')
    assert.equal(await card.evaluate(el => el.getAnimations({ subtree: true }).length), 0)
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' })
    assert.equal(await dot.locator('.dcb-status-orbit').evaluate(el => getComputedStyle(el).display), 'none')
    assert.equal(await card.evaluate(el => el.getAnimations({ subtree: true }).length), 0)
    await page.emulateMedia({ forcedColors: 'none' })
    await page.evaluate(() => window.fixture.running(false))
    await settled()
    assert.equal(await dot.locator('.dcb-status-orbit').evaluate(el => getComputedStyle(el).display), 'none', 'Stopping the run removes the decorative motion')
    await page.evaluate(todos => { window.fixture.running(true); window.fixture.update(todos.map(todo => ({ ...todo, status: 'completed' }))) }, todos)
    await settled()
    assert.equal(await card.evaluate(el => el.getAnimations({ subtree: true }).length), 0, 'Completing the active step stops all indicator effects')
    await page.evaluate(() => window.fixture.running(false))
  })
  await check('only live in-progress text has a white sweep, with readable motion and contrast fallbacks', async () => {
    const todos = [
      { content: '整理需求', status: 'completed' },
      { content: '实现右上角任务面板，并保留任务状态的实时更新与动画效果', status: 'in_progress' },
      { content: '检查窗口缩放与深色主题', status: 'pending' },
    ]
    await page.evaluate(todos => { window.fixture.update(todos); window.fixture.running(true) }, todos)
    await settled()
    const activeText = card.locator('[data-status="in_progress"] .dcb-step-text')
    assert.equal(await activeText.evaluate(el => getComputedStyle(el).animationName), 'dcb-text-shimmer')
    assert.ok(await card.locator('[data-status="completed"] .dcb-step-text, [data-status="pending"] .dcb-step-text').evaluateAll(nodes => nodes.every(el => el.getAnimations().length === 0)))
    const phase = time => activeText.evaluate((el, time) => {
      const animation = el.getAnimations().find(animation => animation.animationName === 'dcb-text-shimmer')
      animation.pause()
      animation.currentTime = time
      return parseFloat(getComputedStyle(el).backgroundPositionX)
    }, time)
    const size = await activeText.boundingBox()
    assert.equal(await phase(0), 100)
    const before = await activeText.screenshot({ path: resolve(output, 'summary-shimmer-text-before.png') })
    assert.equal(await phase(840), 50)
    const during = await activeText.screenshot({ path: resolve(output, 'summary-shimmer-text-during.png') })
    assert.notDeepEqual(before, during, 'The sweep visibly changes the rendered text pixels')
    assert.deepEqual(await activeText.boundingBox(), size, 'The highlight does not resize or move the text')
    assert.equal(await phase(1680), 0, 'Decreasing background position moves the oversized highlight from left to right')
    await phase(840)
    await card.screenshot({ path: resolve(output, 'summary-shimmer-light.png') })
    await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', ''))
    await phase(0)
    const darkBefore = await activeText.screenshot()
    await phase(840)
    const darkDuring = await activeText.screenshot()
    assert.notDeepEqual(darkBefore, darkDuring, 'The highlight is also visible in dark mode')
    await card.screenshot({ path: resolve(output, 'summary-shimmer-dark.png') })
    await page.evaluate(() => document.body.removeAttribute('data-ds-dark-theme'))
    const staticReadableText = async () => {
      const style = await activeText.evaluate(el => {
        const style = getComputedStyle(el)
        return { animation: style.animationName, fill: style.webkitTextFillColor, color: style.color, image: style.backgroundImage }
      })
      assert.equal(style.animation, 'none')
      assert.equal(style.fill, style.color)
      assert.notEqual(style.fill, 'rgba(0, 0, 0, 0)')
      assert.equal(style.image, 'none')
    }
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await staticReadableText()
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' })
    await staticReadableText()
    await page.emulateMedia({ forcedColors: 'none' })
    await page.evaluate(() => window.fixture.running(false))
    await settled()
    await staticReadableText()
    await page.evaluate(todos => { window.fixture.running(true); window.fixture.update(todos.map(todo => ({ ...todo, status: 'completed' }))) }, todos)
    await settled()
    assert.equal(await card.locator('.dcb-step-text').evaluateAll(nodes => nodes.flatMap(el => el.getAnimations()).length), 0, 'Completing a task stops its sweep even before the run finishes')
    await page.evaluate(() => {
      window.fixture.running(false)
      window.fixture.update([
        { content: '整理需求', status: 'completed' }, { content: '准备工程', status: 'completed' },
        { content: '制作并渲染动画', status: 'completed' }, { content: '检查成片并交付', status: 'completed' },
      ])
    })
    await settled()
  })
  await check('declared outputs and actual used resources populate separate sections', async () => {
    assert.equal(await card.locator('.dcb-output').count(), 3)
    assert.equal(await card.locator('.dcb-resource').count(), 3)
    assert.ok(await card.getByText('remotion-best-practices', { exact: true }).count())
    assert.ok(await card.getByText('已读取 · Character Setting.md', { exact: true }).count())
    await card.getByRole('button', { name: '本次会话中已使用' }).click()
    await settled()
    assert.equal(await card.getByTestId('dcb-resources').locator('.dcb-module-content').getAttribute('aria-hidden'), 'true')
    assert.equal(await card.getByTestId('dcb-resources').locator('.dcb-module-content').evaluate(el => el.inert && el.getBoundingClientRect().height === 0), true)
    await card.getByRole('button', { name: '本次会话中已使用' }).click()
    await settled()
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
  await check('each module collapses smoothly and independently while preserving output previews', async () => {
    const originalHeight = (await card.boundingBox()).height
    const source = await card.locator('.dcb-tile img').getAttribute('src')
    await page.evaluate(() => { window.previewNode = document.querySelector('.dcb-tile img') })
    const frames = await page.evaluate(async () => {
      const card = document.querySelector('.dcb-summary')
      const toggle = card.querySelector('[data-testid="dcb-progress"] .dcb-module-toggle')
      const samples = [card.getBoundingClientRect().height]
      toggle.click()
      const start = performance.now()
      await new Promise(done => {
        const sample = now => {
          samples.push(card.getBoundingClientRect().height)
          if (now - start < 380) requestAnimationFrame(sample)
          else done()
        }
        requestAnimationFrame(sample)
      })
      return samples
    })
    assert.ok(new Set(frames.map(value => Math.round(value))).size >= 4, 'Collapse must render multiple intermediate card heights')
    assert.ok(frames.slice(1).every((value, index) => value <= frames[index] + 1), 'The card contracts continuously')
    assert.ok(frames.at(-1) < originalHeight - 30)
    assert.deepEqual(await card.locator('.dcb-module-toggle').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-expanded'))), ['false', 'true', 'true'])
    await card.screenshot({ path: resolve(output, 'summary-progress-collapsed.png') })
    await card.getByRole('button', { name: '输出', exact: true }).click()
    await card.getByRole('button', { name: '本次会话中已使用' }).click()
    await settled()
    assert.ok((await card.boundingBox()).height < 180, 'All folded modules leave only compact headings')
    assert.deepEqual(await card.locator('.dcb-module-content').evaluateAll(nodes => nodes.map(node => ({ height: node.getBoundingClientRect().height, inert: node.inert }))), Array(3).fill({ height: 0, inert: true }))
    await card.screenshot({ path: resolve(output, 'summary-all-collapsed.png') })
    await card.getByRole('button', { name: '进度', exact: true }).click()
    await card.getByRole('button', { name: '输出', exact: true }).click()
    await card.getByRole('button', { name: '本次会话中已使用' }).click()
    await settled()
    assert.ok(Math.abs((await card.boundingBox()).height - originalHeight) < 1)
    assert.equal(await card.locator('.dcb-tile img').getAttribute('src'), source)
    assert.equal(await page.evaluate(() => document.querySelector('.dcb-tile img') === window.previewNode), true, 'Folding does not replace or reload thumbnails')
  })
  await check('rapid reversal continues from current height and reduced motion settles immediately', async () => {
    const result = await page.evaluate(async () => {
      const card = document.querySelector('.dcb-summary')
      const toggle = card.querySelector('[data-testid="dcb-outputs"] .dcb-module-toggle')
      const height = () => card.getBoundingClientRect().height
      const initial = height()
      toggle.click()
      await new Promise(done => setTimeout(done, 90))
      const midway = height()
      toggle.click()
      await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))
      return { initial, midway, reversed: height() }
    })
    assert.ok(result.midway < result.initial - 5)
    assert.ok(result.reversed < result.initial - 1, 'Reversing does not jump to the expanded height')
    assert.ok(result.reversed >= result.midway - 5)
    await settled()
    assert.ok(Math.abs((await card.boundingBox()).height - result.initial) < 1)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await card.getByRole('button', { name: '输出', exact: true }).click()
    await settled()
    assert.equal(await card.getByTestId('dcb-outputs').locator('.dcb-module-content').evaluate(el => el.getBoundingClientRect().height), 0)
    assert.equal(await card.evaluate(el => el.getAnimations({ subtree: true }).length), 0)
    await card.getByRole('button', { name: '输出', exact: true }).click()
    await settled()
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })
  await check('long modules have no internal scroll and folding restores a compact card', async () => {
    const long = Array.from({ length: 40 }, (_, index) => ({ content: `步骤 ${index}：验证较长内容换行，使用标题箭头收起整个模块。`, status: 'pending' }))
    await page.evaluate(todos => window.fixture.update(todos), long)
    await settled()
    const box = await card.boundingBox()
    assert.ok(box.y + box.height <= 1018)
    assert.equal(await card.getByRole('listitem').count(), 3)
    assert.ok(await card.getByRole('button', { name: '37 个后续步骤' }).count())
    assert.ok(await card.evaluate(el => el.scrollHeight <= el.clientHeight), 'Many future tasks are folded by default')
    await card.getByRole('button', { name: '37 个后续步骤' }).click()
    await settled()
    assert.ok(await card.evaluate(el => el.scrollHeight > el.clientHeight))
    await card.evaluate(el => { el.scrollTop = el.scrollHeight })
    assert.ok(await card.evaluate(el => el.scrollTop > 0))
    assert.ok(await card.evaluate(el => el.scrollWidth <= el.clientWidth))
    assert.ok(await card.locator('section, .dcb-collapse, .dcb-collapse-inner, .dcb-module-body').evaluateAll(nodes => nodes.every(node => !['auto', 'scroll'].includes(getComputedStyle(node).overflowY))))
    await card.evaluate(el => { el.scrollTop = 0 })
    await card.getByRole('button', { name: '收起后续步骤' }).click()
    await settled()
    assert.equal(await card.getByRole('listitem').count(), 3)
    assert.ok(await card.evaluate(el => el.scrollHeight <= el.clientHeight))
    await page.evaluate(() => window.fixture.update([
      { content: '整理需求', status: 'completed' }, { content: '准备工程', status: 'completed' },
      { content: '制作并渲染动画', status: 'completed' }, { content: '检查成片并交付', status: 'completed' },
    ]))
    await settled()
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
  await check('outside presses dismiss pinned, automatic and hover panels without blocking the clicked control', async () => {
    const entry = page.getByRole('button', { name: '会话进度与输出', exact: true })
    const stored = await page.evaluate(() => localStorage.getItem('dsh-claude-beautify:settings:v1'))
    await card.getByRole('button', { name: '进度', exact: true }).click()
    await settled()
    assert.equal(await card.getAttribute('data-state'), 'open', 'Module controls stay inside the panel')
    await card.getByRole('button', { name: '进度', exact: true }).click()
    await settled()
    await page.locator('article h1').click()
    assert.equal(await card.getAttribute('data-state'), 'closing', 'Clicking the chat begins the existing exit animation')
    assert.equal(await entry.getAttribute('aria-expanded'), 'false')
    await card.waitFor({ state: 'detached' })
    await page.evaluate(() => {
      window.outsideClickCount = 0
      const control = document.createElement('button')
      control.id = 'fixture-outside-control'
      control.textContent = '面板外按钮'
      control.style.cssText = 'position:fixed;left:250px;top:300px;z-index:100'
      control.onpointerdown = event => event.stopPropagation()
      control.onclick = () => window.outsideClickCount++
      document.body.append(control)
    })
    const outside = page.getByRole('button', { name: '面板外按钮' })
    try {
      await entry.click()
      await settled()
      await outside.click()
      await card.waitFor({ state: 'detached' })
      assert.equal(await page.evaluate(() => window.outsideClickCount), 1, 'The underlying click still runs even if it stops propagation')
      assert.equal(await outside.evaluate(el => el === document.activeElement), true, 'Outside dismissal does not steal focus')
      await entry.hover()
      await settled()
      await outside.click()
      await card.waitFor({ state: 'detached' })
      assert.equal(await page.evaluate(() => window.outsideClickCount), 2)
      await page.evaluate(() => { window.fixture.running(true); window.fixture.update([{ content: '核对外部关闭的新计划', status: 'pending' }]) })
      await settled()
      assert.equal(await card.getAttribute('data-state'), 'open')
      await outside.click()
      await card.waitFor({ state: 'detached' })
      await page.evaluate(() => window.fixture.refresh())
      await settled()
      assert.equal(await card.count(), 0, 'A dismissed automatic panel stays closed for the current run')
      await page.evaluate(() => window.fixture.running(false))
      await settled()
      await page.evaluate(() => { window.fixture.running(true); window.fixture.update([{ content: '核对下一轮计划', status: 'pending' }]) })
      await settled()
      assert.equal(await card.getAttribute('data-state'), 'open', 'A new plan in the next run can still auto-open')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await outside.click()
      await settled()
      assert.equal(await card.count(), 0, 'Reduced motion dismisses immediately')
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.evaluate(() => window.fixture.running(false))
      await settled()
      assert.equal(await page.evaluate(() => localStorage.getItem('dsh-claude-beautify:settings:v1')), stored, 'Outside dismissal preserves module preferences')
    } finally { await page.evaluate(() => document.getElementById('fixture-outside-control')?.remove()) }
    await entry.click()
    await settled()
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
    await card.getByRole('button', { name: '本次会话中已使用' }).click()
    await settled()
    await page.evaluate(() => window.fixture.session('b'))
    await settled()
    assert.equal(await card.count(), 0, 'A newly visited idle session stays closed')
    await page.getByRole('button', { name: '会话进度与输出', exact: true }).click()
    assert.equal(await card.locator('.dcb-output').count(), 0)
    assert.equal(await card.locator('.dcb-resource').count(), 0)
    assert.ok(await card.getByText('第二个会话的任务', { exact: true }).count())
    assert.equal(await card.getByRole('button', { name: '进度', exact: true }).getAttribute('aria-expanded'), 'true', 'A new session uses the saved module preferences')
    await card.getByRole('button', { name: '进度', exact: true }).click()
    await settled()
    await page.evaluate(() => window.fixture.session('empty'))
    await settled()
    assert.equal(await card.count(), 0)
    await page.evaluate(() => window.fixture.running(true))
    await settled()
    assert.equal(await card.count(), 0, 'A run with no real content waits rather than revealing an empty card')
    await page.evaluate(rows => window.fixture.records(rows), rows)
    await settled()
    assert.equal(await card.count(), 0, 'Tool and output records arriving after the run starts do not auto-open')
    await page.getByRole('button', { name: '会话进度与输出', exact: true }).click()
    await settled()
    assert.equal(await card.getByTestId('dcb-progress').count(), 0)
    await page.evaluate(() => window.fixture.session('a'))
    await settled()
    assert.equal(await card.getByRole('button', { name: '本次会话中已使用' }).getAttribute('aria-expanded'), 'false', 'A saved collapsed module remains collapsed across sessions')
    await card.getByRole('button', { name: '本次会话中已使用' }).click()
    await page.evaluate(() => window.fixture.update([
      { content: '整理需求', status: 'completed' }, { content: '准备工程', status: 'completed' },
      { content: '制作并渲染动画', status: 'completed' }, { content: '检查成片并交付', status: 'completed' },
    ]))
    await settled()
    assert.equal(await card.getByRole('button', { name: '进度', exact: true }).getAttribute('aria-expanded'), 'false', 'Display preferences follow the user while task data stays session-scoped')
    await card.getByRole('button', { name: '进度', exact: true }).click()
    await settled()
  })
  await check('dark theme and phone view preserve compact fonts and natural height', async () => {
    await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', ''))
    assert.equal(await card.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(41, 40, 36)')
    await card.screenshot({ path: resolve(output, 'summary-reference-dark.png') })
    await page.setViewportSize({ width: 390, height: 700 })
    await settled()
    const box = await card.boundingBox()
    assert.ok(box.x >= 0 && box.x + box.width <= 390)
    assert.ok(box.height > 150 && box.y + box.height <= 700)
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
    assert.equal(await card.count(), 0, 'Clicking settings outside the panel dismissed its pinned state')
    await page.evaluate(() => window.fixture.settings(false))
    await page.getByRole('button', { name: '会话进度与输出', exact: true }).click()
    await settled()
    assert.ok(await card.isVisible())
    const stored = await page.evaluate(() => localStorage.getItem('dsh-claude-beautify:settings:v1'))
    assert.ok(!stored.includes('Character') && !stored.includes('Animation'))
  })
  await check('module choices survive reopening and reload, synchronize across windows, and persist no task data', async () => {
    const toggles = panel => panel.locator('.dcb-module-toggle').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-expanded')))
    await card.getByRole('button', { name: '进度', exact: true }).click()
    await card.getByRole('button', { name: '输出', exact: true }).click()
    await settled()
    assert.deepEqual(await toggles(card), ['false', 'false', 'true'])
    await card.getByRole('button', { name: '关闭进度面板' }).click()
    await page.mouse.move(40, 400)
    await page.getByRole('button', { name: '会话进度与输出', exact: true }).hover()
    await card.waitFor()
    assert.deepEqual(await toggles(card), ['false', 'false', 'true'], 'Hover opening preserves saved folds')
    await page.evaluate(() => { window.fixture.running(true); window.fixture.update([{ content: '记忆模块偏好时的新计划', status: 'pending' }]) })
    await settled()
    assert.deepEqual(await toggles(card), ['false', 'false', 'true'], 'Plan-triggered opening preserves saved folds')
    await page.mouse.move(40, 400)
    await page.reload()
    await mountPlugin()
    await settled()
    assert.equal(await card.count(), 0, 'Saving module preferences does not force idle cards to open after reload')
    await page.evaluate(rows => window.fixture.records(rows), rows)
    await page.getByRole('button', { name: '会话进度与输出', exact: true }).click()
    await settled()
    assert.deepEqual(await toggles(card), ['false', 'false', 'true'], 'A fresh plugin instance restores the saved folds')
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('dsh-claude-beautify:settings:v1')))
    assert.deepEqual(Object.keys(stored).sort(), ['enabled', 'modules', 'progressView', 'width'])
    assert.deepEqual(stored.modules, { progress: false, outputs: false, resources: true })
    const other = await page.context().newPage()
    other.on('pageerror', error => errors.push(error.message))
    try {
      await other.goto(url)
      await mountPlugin(other)
      await other.evaluate(rows => window.fixture.records(rows), rows)
      await other.getByRole('button', { name: '会话进度与输出', exact: true }).click()
      const otherCard = other.getByTestId('dcb-summary')
      assert.deepEqual(await toggles(otherCard), ['false', 'false', 'true'], 'Another window restores the same preferences')
      await otherCard.getByRole('button', { name: '进度', exact: true }).click()
      await page.waitForFunction(() => document.querySelector('[data-testid="dcb-progress"] .dcb-module-toggle').getAttribute('aria-expanded') === 'true')
      await settled()
      assert.deepEqual(await toggles(card), ['true', 'false', 'true'], 'A change in another window updates only the shared presentation preference')
      await card.screenshot({ path: resolve(output, 'summary-remembered-folds.png') })
    } finally { await other.close() }
    await page.mouse.move(40, 400)
    await page.reload()
    await mountPlugin()
    await page.evaluate(rows => window.fixture.records(rows), rows)
    await page.getByRole('button', { name: '会话进度与输出', exact: true }).click()
    await settled()
    assert.deepEqual(await toggles(card), ['true', 'false', 'true'], 'Re-expanding a module also survives reload')
  })
  await check('previous and future groups fold independently, animate smoothly and remember the two-or-three step preference', async () => {
    const tasks = Array.from({ length: 9 }, (_, index) => ({ content: `任务步骤 ${index + 1}`, status: index < 4 ? 'completed' : index === 4 ? 'in_progress' : 'pending' }))
    await page.evaluate(tasks => { window.fixture.update(tasks); window.fixture.running(true) }, tasks)
    await settled()
    assert.equal(await card.getByRole('listitem').count(), 3)
    assert.ok(await card.getByRole('button', { name: '3 个先前步骤' }).count())
    assert.ok(await card.getByRole('button', { name: '3 个后续步骤' }).count())
    assert.equal(await card.locator('[aria-current="step"]').innerText(), '任务步骤 5')
    await card.screenshot({ path: resolve(output, 'summary-steps-both-folded.png') })
    const animation = await page.evaluate(async () => {
      const card = document.querySelector('.dcb-summary')
      const content = card.querySelector('.dcb-future-content')
      const heights = [content.getBoundingClientRect().height]
      card.querySelector('.dcb-future').click()
      const start = performance.now()
      await new Promise(done => {
        const frame = now => {
          heights.push(content.getBoundingClientRect().height)
          if (now - start < 380) requestAnimationFrame(frame)
          else done()
        }
        requestAnimationFrame(frame)
      })
      return heights
    })
    assert.ok(new Set(animation.map(Math.round)).size >= 4, 'Future steps also pass through multiple expansion frames')
    assert.ok(animation.slice(1).every((height, index) => height >= animation[index] - 1))
    assert.equal(await card.getByRole('listitem').count(), 6)
    assert.equal(await card.getByRole('button', { name: '3 个先前步骤' }).getAttribute('aria-expanded'), 'false')
    await card.getByRole('button', { name: '3 个先前步骤' }).click()
    await settled()
    assert.equal(await card.getByRole('listitem').count(), 9)
    await card.getByRole('button', { name: '收起先前步骤' }).click()
    await settled()
    assert.equal(await card.getByRole('listitem').count(), 6, 'Folding previous steps keeps future steps expanded')
    await card.getByRole('button', { name: '收起后续步骤' }).click()
    await settled()
    await page.evaluate(() => window.fixture.settings(true))
    await page.getByRole('combobox', { name: '默认显示步骤数' }).selectOption('2')
    await page.evaluate(() => window.fixture.settings(false))
    const entry = page.getByRole('button', { name: '会话进度与输出', exact: true })
    // A real settings interaction can dismiss the card through the outside handler.
    if (!(await card.count()) || await entry.getAttribute('aria-expanded') === 'false') await entry.click()
    await settled()
    assert.equal(await card.getByRole('listitem').count(), 2)
    assert.ok(await card.getByRole('button', { name: '4 个先前步骤' }).count())
    assert.ok(await card.getByRole('button', { name: '3 个后续步骤' }).count())
    await card.getByRole('button', { name: '3 个后续步骤' }).click()
    await settled()
    await card.screenshot({ path: resolve(output, 'summary-steps-future-expanded.png') })
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dsh-claude-beautify:settings:v1')).progressView)
    assert.deepEqual(saved, { count: 2, previous: false, future: true })
    await page.reload()
    await mountPlugin()
    await page.evaluate(tasks => window.fixture.update(tasks), tasks)
    await entry.click()
    await settled()
    assert.equal(await card.getByRole('listitem').count(), 5, 'Reload restores two recent steps plus the explicitly expanded future group')
    assert.equal(await card.getByRole('button', { name: '4 个先前步骤' }).getAttribute('aria-expanded'), 'false')
    assert.equal(await card.getByRole('button', { name: '收起后续步骤' }).getAttribute('aria-expanded'), 'true')
    await card.getByRole('button', { name: '收起后续步骤' }).click()
    await settled()
    await card.getByRole('button', { name: '4 个先前步骤' }).click()
    await settled()
    await page.reload()
    await mountPlugin()
    await page.evaluate(tasks => window.fixture.update(tasks), tasks)
    await entry.click()
    await settled()
    assert.equal(await card.getByRole('listitem').count(), 6, 'Previous and future choices each survive a fresh plugin instance')
    assert.equal(await card.getByRole('button', { name: '3 个后续步骤' }).getAttribute('aria-expanded'), 'false')
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('dsh-claude-beautify:settings:v1')))
    assert.deepEqual(stored.progressView, { count: 2, previous: true, future: false })
    assert.equal(JSON.stringify(stored).includes('任务步骤'), false)
  })
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ passed, output }))
} finally { await browser.close(); server.close() }
