import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import vm from 'node:vm'

const script = fileURLToPath(new URL('../scripts/patch-claude-slider.mjs', import.meta.url))
// Only the public registration/export shape is represented; no third-party bundle.
const section = `      ctx.slots.inject(SLOT_SETTINGS, () => {
        return ctx.slots.register({
          name: SLOT_SETTINGS,
          id: "claude-reasoning-slider",
          order: 26,
          label: () => "推理滑块 (Claude)"
        }, () => h(ClaudeSettingsPage));
      });`
const fixture = `const SLOT_SETTINGS = 'settings.section';
const configStore = {};
function ClaudeSettingsPage() {}
const h = value => value;
function apply(ctx) {
${section}
}
    exports.configStore = configStore;
exports.apply = apply;
`

async function sandbox(run) {
  const root = await mkdtemp(join(tmpdir(), 'dcb-slider-patch-'))
  const target = join(root, 'client.js')
  const cli = (...args) => spawnSync(process.execPath, [script, ...args], {
    cwd: root, env: { ...process.env, DSH_HOME: root }, encoding: 'utf8',
  })
  try { await run({ root, target, cli }) }
  finally { await rm(root, { recursive: true, force: true }) }
}

function registrations(source, window) {
  const exports = {}
  const slots = []
  vm.runInNewContext(source, { exports, window })
  exports.apply({ slots: { inject: (_name, callback) => callback(), register: spec => slots.push(spec) } })
  return { exports, slots }
}

test('slider patch merges settings while preserving standalone use, exports and line endings', async () => {
  for (const newline of ['\n', '\r\n']) await sandbox(async ({ target, cli }) => {
    await writeFile(target, fixture.replaceAll('\n', newline))
    assert.equal(cli('--check', target).status, 1)
    assert.equal(cli(target).status, 0)
    const patched = await readFile(target, 'utf8')
    assert.equal(cli(target, '--check').status, 0)
    assert.equal(patched.includes('\r\n'), newline === '\r\n')
    assert.equal(registrations(patched, {}).slots.length, 1)
    assert.equal(registrations(patched, { __dsbHostsClaudeSettings: true }).slots.length, 0)
    for (const id of ['dsh-claude-beautify', 'dsh-claude-beautify/client']) {
      assert.equal(registrations(patched, { __DSH_BOOT__: { entries: [{ id }] } }).slots.length, 0)
    }
    assert.equal(typeof registrations(patched, {}).exports.ClaudeSettingsPage, 'function')
    assert.equal(cli(target).status, 0)
    assert.equal(await readFile(target, 'utf8'), patched, 'Applying twice leaves the bundle identical')
  })
})

test('slider check rejects a marker-only patch and each missing integration piece; patch repairs known partial shapes', async () => {
  await sandbox(async ({ target, cli }) => {
    await writeFile(target, fixture)
    assert.equal(cli(target).status, 0)
    const complete = await readFile(target, 'utf8')
    const guardStart = complete.indexOf('      // dsh-claude-beautify hosts')
    const guardEnd = complete.indexOf('\n}\n    exports.configStore', guardStart)
    assert.ok(guardStart >= 0 && guardEnd > guardStart)
    const partials = [
      fixture + '\n// __dsbHostsClaudeSettings\n',
      complete.replace('    exports.ClaudeSettingsPage = ClaudeSettingsPage;\n', ''),
      complete.slice(0, guardStart) + section + complete.slice(guardEnd),
    ]
    for (const partial of partials) {
      await writeFile(target, partial)
      assert.equal(cli('--check', target).status, 1)
      assert.equal(await readFile(target, 'utf8'), partial, 'Checking never writes')
      assert.equal(cli(target).status, 0)
      assert.equal(cli('--check', target).status, 0)
      const repaired = await readFile(target, 'utf8')
      assert.equal(registrations(repaired, { __dsbHostsClaudeSettings: true }).slots.length, 0)
      assert.equal(typeof registrations(repaired, {}).exports.ClaudeSettingsPage, 'function')
    }
  })
})

test('slider patch refuses unrecognized anchors without partially writing the file', async () => {
  await sandbox(async ({ target, cli }) => {
    for (const source of [fixture.replace('order: 26', 'order: 99'), fixture.replace('exports.configStore = configStore;', 'exports.other = configStore;')]) {
      await writeFile(target, source)
      const result = cli(target)
      assert.equal(result.status, 1)
      assert.match(result.stderr, /patch anchors not found/)
      assert.equal(await readFile(target, 'utf8'), source)
    }
  })
})

test('slider CLI parses check separately and never falls back from an explicit missing target', async () => {
  await sandbox(async ({ root, target, cli }) => {
    const defaultTarget = join(root, 'profiles', 'desktop', 'node_modules', 'dsh-claude-slider', 'lib', 'client.js')
    await mkdir(join(defaultTarget, '..'), { recursive: true })
    await writeFile(defaultTarget, fixture)
    // A filename matching the flag must not become the selected bundle.
    await writeFile(join(root, '--check'), 'unrelated file')
    const check = cli('--check')
    assert.equal(check.status, 1)
    assert.ok(check.stdout.includes(defaultTarget))
    assert.equal(cli(target).status, 1)
    assert.equal(cli('--check', target).status, 1)
    assert.equal(await readFile(defaultTarget, 'utf8'), fixture)
    assert.equal(cli('--unknown').status, 1)
    assert.equal(cli(defaultTarget, target).status, 1)
    assert.equal(await readFile(defaultTarget, 'utf8'), fixture)
    assert.equal(cli().status, 0)
    assert.equal(cli('--check').status, 0)
  })
})
