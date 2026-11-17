import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { chromium } from '@playwright/test'

const project = fileURLToPath(new URL('..', import.meta.url))
const output = resolve(process.env.DSH_CLAUDE_OUTPUT_DIR || resolve(project, '../../outputs/beautify-progress-sync-20261117/progress-status'))
mkdirSync(output, { recursive: true })
const built = await build({ entryPoints: [resolve(project, 'test/fixture.jsx')], bundle: true, write: false, format: 'iife' })
const routes = {
  '/': ['text/html; charset=utf-8', readFileSync(resolve(project, 'test/fixture.html'), 'utf8')],
  '/fixture.js': ['text/javascript', built.outputFiles[0].text],
  '/client.js': ['text/javascript', readFileSync(resolve(project, 'client.js'), 'utf8')],
  '/dsh-ui-beautify/running/pack.json': ['application/json', JSON.stringify({ format: 'dsh-running-pack', version: 1, name: 'Synthetic running assets', actions: [{ id: 'fixture', file: 'fixture.png' }] })],
}
const server = createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204).end(); return }
  const route = routes[req.url]
  if (!route) { res.writeHead(404).end(); return }
  res.writeHead(200, { 'Content-Type': route[0] }).end(route[1])
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.5 })
const failures = { console: [], page: [], requests: [], responses: [] }
page.on('console', message => { if (message.type() === 'error') failures.console.push(message.text()) })
page.on('pageerror', error => failures.page.push(error.message))
page.on('requestfailed', request => { if (!request.url().endsWith('/favicon.ico')) failures.requests.push({ url: request.url(), error: request.failure()?.errorText }) })
page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) failures.responses.push({ url: response.url(), status: response.status() }) })

const card = page.getByTestId('dcb-summary')
const content = card.locator('.dcb-context-window > .dcb-context-content')
const steps = () => content.locator('.dcb-recent-steps > .dcb-step')
const note = () => content.locator('.dcb-progress-note[role="status"]')
const plan = [
  { content: '整理合成需求', status: 'in_progress' },
  { content: '实现合成修改', status: 'pending' },
  { content: '核对合成结果', status: 'pending' },
]
const entries = []
const record = (type, data) => entries.push({ event: { type, data, seq: entries.length + 1 } })
record('turn/start', { turn: 1 })
record('todo/write', { todos: plan })
let passed = 0
const results = []
async function check(name, run) {
  await run()
  passed++
  results.push(name)
  console.log('PASS ' + name)
}
async function settled() {
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))))
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
}
async function open() {
  const entry = page.getByRole('button', { name: '会话进度与输出', exact: true })
  if (await entry.getAttribute('aria-expanded') !== 'true') await entry.click()
  await settled()
}
async function replaceRecords() {
  await page.evaluate(entries => window.fixture.records(entries), entries)
}
async function finishContext() {
  await page.evaluate(() => {
    window.pauseProgressContext = false
    for (const animation of document.getAnimations().filter(animation => animation.id.startsWith('dcb-context-'))) animation.finish()
  })
  await settled()
}
async function assertUnfinished() {
  assert.equal(await steps().first().getAttribute('data-status'), 'unfinished')
  assert.equal(await steps().first().getAttribute('aria-current'), null)
  assert.equal(await content.locator('.dcb-step[data-status="in_progress"]').count(), 0)
  assert.equal(await note().innerText(), '本轮已结束，仍有 3 项未标记完成')
  assert.equal(await note().isVisible(), true)
}

try {
  await page.goto(`http://127.0.0.1:${server.address().port}/`)
  await page.waitForFunction(() => window.fixture && window.fixtureReact)
  await page.evaluate(() => {
    localStorage.setItem('dsh-ui-beautify:settings:v1', JSON.stringify({
      enabled: true, width: 360, summaryScope: 'turn', welcomeEnabled: false, particleEnabled: false, runningAnimationEnabled: false,
      modules: { progress: true, outputs: false, resources: false },
      panelModules: { progress: true, outputs: false, resources: false },
    }))
    window.cleanups = []
    window.__ModuleLoader__ = { load(spec) { window.plugin = spec.factory(name => name === '@deepseek-ai/dsh-client-ui-primitives' ? { FishLogo: () => null } : window.fixtureReact) } }
    const animate = Element.prototype.animate
    Element.prototype.animate = function (frames, options) {
      const animation = animate.call(this, frames, options)
      if (window.pauseProgressContext && options?.id?.startsWith('dcb-context-')) { animation.pause(); animation.currentTime = 0 }
      return animation
    }
  })
  await page.addScriptTag({ url: `http://127.0.0.1:${server.address().port}/client.js` })
  await page.evaluate(({ entries, plan }) => {
    const ctx = {
      slots: { inject(_name, callback) { callback() }, register(spec, component) {
        if (spec.name === 'settings.section') window.fixtureSettings = component
        else { window.fixtureHeader = component; window.fixtureHeaderSpec = spec }
        return () => {}
      } },
      sessions: { binding: id => window.fixtureBinding(id) }, sidebarRight: { openResource() {} },
      effect(callback) { window.cleanups.push(callback()) }, inject(_names, callback) { callback(ctx) },
    }
    window.plugin.apply(ctx)
    window.fixture.refresh()
    window.fixture.records(entries)
    window.fixture.update(plan)
    window.fixture.running(true)
    window.fixture.history({ turns: [{ turn: 1, seq: 1, prompt: '合成任务' }], initial: 1, tail: true })
  }, { entries, plan })
  await open()

  await check('a running step remains active and identifies the current step', async () => {
    assert.equal(await steps().first().getAttribute('data-status'), 'in_progress')
    assert.equal(await steps().first().getAttribute('aria-current'), 'step')
    assert.equal(await content.locator('.dcb-timeline').getAttribute('data-working'), 'true')
    assert.equal(await note().count(), 0)
  })

  await check('stopping without a new plan removes the false active state without inventing completion', async () => {
    await page.evaluate(() => window.fixture.running(false))
    await settled()
    assert.equal(await steps().first().getAttribute('data-status'), 'unfinished')
    assert.equal(await steps().first().getAttribute('aria-current'), null)
    assert.deepEqual(await steps().evaluateAll(nodes => nodes.map(node => node.dataset.status)), ['unfinished', 'pending', 'pending'])
    assert.equal(await note().count(), 0, 'The end-of-turn notice waits for an actual turn/end event')
  })

  await check('a late end event animates the visible explanation and expands the content height', async () => {
    const before = await content.evaluate(node => node.parentElement.getBoundingClientRect().height)
    await page.evaluate(() => window.pauseProgressContext = true)
    record('turn/end', { turn: 1 })
    await replaceRecords()
    await page.waitForFunction(() => document.getAnimations().some(animation => animation.id === 'dcb-context-in'))
    await page.evaluate(() => { for (const animation of document.getAnimations().filter(animation => animation.id.startsWith('dcb-context-'))) animation.currentTime = 100 })
    const middle = await content.evaluate(node => {
      const style = getComputedStyle(node)
      return { opacity: Number(style.opacity), y: new DOMMatrixReadOnly(style.transform).m42, blur: parseFloat(style.filter.replace('blur(', '')), height: node.parentElement.getBoundingClientRect().height, natural: node.offsetHeight }
    })
    assert.ok(middle.opacity > 0 && middle.opacity < 1, 'The incoming content fades through an intermediate opacity')
    assert.ok(middle.y > 0 && middle.y < 10, 'The incoming content visibly moves into position')
    assert.ok(middle.blur > 0 && middle.blur < 2, 'The incoming content clears its temporary blur')
    assert.ok(middle.natural > before + 10, 'The explanation occupies real content height')
    assert.ok(middle.height > before && middle.height < middle.natural, 'The viewport grows continuously with the explanation')
    await card.screenshot({ path: resolve(output, 'ended-notice-midframe.png') })
    writeFileSync(resolve(output, 'ended-notice-midframe.json'), JSON.stringify({ before, ...middle }, null, 2))
    await finishContext()
    await assertUnfinished()
    assert.equal(await content.evaluate(node => node.style.willChange + node.parentElement.style.willChange + node.parentElement.style.height), '')
    assert.equal(await card.locator('.dcb-context-ghost > *').count(), 0)
    await card.screenshot({ path: resolve(output, 'ended-unfinished.png') })
  })

  await check('closing and reopening retains the unfinished explanation without reviving activity', async () => {
    await card.getByRole('button', { name: '关闭进度面板', exact: true }).click()
    await page.mouse.move(10, 900)
    await settled()
    await open()
    await assertUnfinished()
    assert.equal(await content.locator('.dcb-timeline').getAttribute('data-working'), 'false')
  })

  await check('an explicitly completed plan displays completed states without an unsynchronized-plan notice', async () => {
    const completed = plan.map(item => ({ ...item, status: 'completed' }))
    entries.splice(entries.length - 1, 0, { event: { type: 'todo/write', data: { todos: completed }, seq: entries.length } })
    entries.at(-1).event.seq = entries.length
    await page.evaluate(({ entries, completed }) => { window.fixture.records(entries); window.fixture.update(completed) }, { entries, completed })
    await settled()
    assert.deepEqual(await steps().evaluateAll(nodes => nodes.map(node => node.dataset.status)), ['completed', 'completed', 'completed'])
    assert.equal(await content.locator('[aria-current="step"]').count(), 0)
    assert.equal(await note().count(), 0)
  })

  await check('historical and all-turn views retain unfinished tasks and never mark them active', async () => {
    entries.splice(2, 1)
    entries.forEach((entry, index) => { entry.event.seq = index + 1 })
    record('turn/start', { turn: 2 })
    await page.evaluate(({ entries }) => {
      window.fixture.records(entries)
      window.fixture.update([])
      window.fixture.running(true)
      window.fixture.history({ turns: [{ turn: 1, seq: 1 }, { turn: 2, seq: 4 }], initial: 2, tail: true })
    }, { entries })
    await settled()
    await card.getByRole('button', { name: '上一轮', exact: true }).click()
    await settled()
    assert.equal(await card.getAttribute('data-dcb-turn'), '1')
    await assertUnfinished()
    await card.getByRole('button', { name: '全部轮次', exact: true }).click()
    await settled()
    const group = content.locator('[data-plan-turn="1"]')
    assert.equal(await group.locator('.dcb-plan-status').innerText(), '有未完成项')
    assert.equal(await group.locator('.dcb-step').count(), 3)
    assert.equal(await group.locator('.dcb-step[data-status="in_progress"]').count(), 0)
    assert.equal(await group.locator('.dcb-step[data-status="unfinished"]').count(), 1)
    assert.equal(await group.locator('[aria-current="step"]').count(), 0)
    assert.equal(await content.locator('[data-plan-turn="2"]').count(), 0)
    assert.equal(await content.locator('.dcb-plan-total').innerText(), '共 3 项，已完成 0 项')
    await card.screenshot({ path: resolve(output, 'all-turns-unfinished.png') })
  })

  await check('a new turn with no plan does not inherit the previous unfinished tasks', async () => {
    await card.getByRole('button', { name: '当前轮次', exact: true }).click()
    await settled()
    await card.getByRole('button', { name: '下一轮', exact: true }).click()
    await settled()
    assert.equal(await card.getAttribute('data-dcb-turn'), '2')
    assert.equal(await content.locator('.dcb-step').count(), 0)
    assert.equal(await note().count(), 0)
    assert.match(await content.innerText(), /这一轮没有任务、输出或已用资源/)
  })

  await check('the isolated page has no console errors, uncaught errors or failed requests', async () => {
    assert.deepEqual(failures, { console: [], page: [], requests: [], responses: [] })
  })
  console.log(JSON.stringify({ passed, output }))
} finally {
  writeFileSync(resolve(output, 'report.json'), JSON.stringify({ passed, checks: results, failures }, null, 2))
  await browser.close()
  await new Promise(done => server.close(done))
}
