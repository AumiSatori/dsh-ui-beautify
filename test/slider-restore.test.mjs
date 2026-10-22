import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import vm from 'node:vm'

const script = fileURLToPath(new URL('../scripts/restore-claude-slider.mjs', import.meta.url))
// Only the public registration/export shape and our former patch are fixtures.
// No third-party client bundle is redistributed by these tests.
const section = `      ctx.slots.inject(SLOT_SETTINGS, () => {
        return ctx.slots.register({
          name: SLOT_SETTINGS,
          id: "claude-reasoning-slider",
          order: 26,
          label: () => "推理滑块 (Claude)"
        }, () => h(ClaudeSettingsPage));
      });`
const guarded = `      // dsh-claude-beautify hosts this page inside its own "Claude 美化" settings
      // entry, so only register a standalone section when that host is absent from
      // the boot graph (or has not announced itself before we apply).
      const hostedElsewhere = (() => {
        try {
          if (window.__dsbHostsClaudeSettings === true) return true;
          const boot = window.__DSH_BOOT__;
          return !!(boot && Array.isArray(boot.entries) && boot.entries.some((row) => row && (row.id === "dsh-claude-beautify" || row.id === "dsh-claude-beautify/client")));
        } catch (error) {
          return false;
        }
      })();
      if (!hostedElsewhere) {
        ctx.slots.inject(SLOT_SETTINGS, () => {
          return ctx.slots.register({
            name: SLOT_SETTINGS,
            id: "claude-reasoning-slider",
            order: 26,
            label: () => "推理滑块 (Claude)"
          }, () => h(ClaudeSettingsPage));
        });
      }`
const configExport = '    exports.configStore = configStore;'
const mergedExport = `    exports.configStore = configStore;
    // Consumed by dsh-claude-beautify, which renders this page inside its merged
    // "Claude 美化" settings section.
    exports.ClaudeSettingsPage = ClaudeSettingsPage;`
const fixture = `const SLOT_SETTINGS = 'settings.section';
const configStore = {};
function ClaudeSettingsPage() {}
const h = value => value;
function apply(ctx) {
${section}
}
${configExport}
exports.apply = apply;
// Unrelated third-party customization must survive byte for byte.
exports.customTheme = 'unchanged';
`
const merged = fixture.replace(section, guarded).replace(configExport, mergedExport)

async function sandbox(run) {
  const root = await mkdtemp(join(tmpdir(), 'dcb-slider-restore-'))
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

test('slider restore removes only the legacy merge and preserves unrelated edits and LF/CRLF', async () => {
  for (const newline of ['\n', '\r\n']) await sandbox(async ({ target, cli }) => {
    const original = merged.replaceAll('\n', newline)
    await writeFile(target, original)
    const check = cli('--check', target)
    assert.equal(check.status, 1)
    assert.match(check.stdout, /legacy merged settings found/)
    assert.ok(check.stdout.length < 1024, 'The check reports state instead of printing bundle source')
    assert.equal(await readFile(target, 'utf8'), original, 'Checking never edits the bundle')
    assert.equal(cli(target).status, 0)
    const restored = await readFile(target, 'utf8')
    assert.equal(restored, fixture.replaceAll('\n', newline))
    assert.equal(cli(target, '--check').status, 0)
    for (const window of [{}, { __dsbHostsClaudeSettings: true }, { __DSH_BOOT__: { entries: [{ id: 'dsh-claude-beautify' }] } }]) {
      const actual = registrations(restored, window)
      assert.equal(actual.slots.length, 1, 'The slider always registers its independent settings')
      assert.equal(actual.slots[0].id, 'claude-reasoning-slider')
      assert.equal(actual.exports.ClaudeSettingsPage, undefined)
      assert.equal(actual.exports.customTheme, 'unchanged')
    }
    assert.equal(cli(target).status, 0)
    assert.equal(await readFile(target, 'utf8'), restored, 'Repeated migration is byte-identical')
  })
})

test('slider restore keeps mixed line endings outside and inside the retained section', async () => {
  await sandbox(async ({ target, cli }) => {
    const lines = guarded.split('\n')
    const mixedGuard = lines.map((line, index) => line + (index === lines.length - 1 ? '' : index % 2 ? '\n' : '\r\n')).join('')
    const retained = mixedGuard.split(/(?<=\n)/).slice(13, -1).join('').replace(/\r?\n$/, '').replace(/^  /gm, '')
    const before = '// before\r\n' + fixture.replace(section, mixedGuard).replace(configExport, mergedExport) + '// after\r\n'
    const expected = '// before\r\n' + fixture.replace(section, retained) + '// after\r\n'
    await writeFile(target, before)
    assert.equal(cli(target).status, 0)
    assert.equal(await readFile(target, 'utf8'), expected)
  })
})

test('slider restore leaves original bundles intact and handles complete guard-only or export-only patches', async () => {
  for (const source of [fixture, fixture.replace(section, guarded), fixture.replace(configExport, mergedExport)]) {
    await sandbox(async ({ target, cli }) => {
      await writeFile(target, source)
      assert.equal(cli('--check', target).status, source === fixture ? 0 : 1)
      assert.equal(await readFile(target, 'utf8'), source)
      assert.equal(cli(target).status, 0)
      assert.equal(await readFile(target, 'utf8'), fixture)
      assert.equal(cli('--check', target).status, 0)
    })
  }
})

test('slider restore rejects changed anchors, incomplete patches and duplicate registrations atomically', async () => {
  const unknown = [
    fixture.replace('order: 26', 'order: 99'),
    merged.replace('order: 26', 'order: 99'),
    merged.replace('exports.configStore = configStore;', 'exports.other = configStore;'),
    merged.replace('    exports.ClaudeSettingsPage = ClaudeSettingsPage;\n', ''),
    fixture.replace(configExport, configExport + '\n    exports.ClaudeSettingsPage = ClaudeSettingsPage;'),
    fixture + '\n// __dsbHostsClaudeSettings\n',
    fixture.replace(section, section + '\n' + section),
  ]
  await sandbox(async ({ target, cli }) => {
    for (const source of unknown) {
      await writeFile(target, source)
      for (const args of [[target], ['--check', target]]) {
        const result = cli(...args)
        assert.equal(result.status, 1)
        assert.match(result.stderr, /unexpected.*no changes written/s)
        assert.equal(await readFile(target, 'utf8'), source, 'Unknown shapes must never be partially changed')
      }
    }
  })
})

test('slider restore CLI resolves profiles but never falls back from an explicit missing target', async () => {
  await sandbox(async ({ root, target, cli }) => {
    const defaultTarget = join(root, 'profiles', 'desktop', 'node_modules', 'dsh-claude-slider', 'lib', 'client.js')
    await mkdir(join(defaultTarget, '..'), { recursive: true })
    await writeFile(defaultTarget, merged)
    await writeFile(join(root, '--check'), 'unrelated file')
    const check = cli('--check')
    assert.equal(check.status, 1)
    assert.ok(check.stdout.includes(defaultTarget))
    assert.equal(cli(target).status, 1)
    assert.equal(cli('--check', target).status, 1)
    assert.equal(await readFile(defaultTarget, 'utf8'), merged)
    assert.equal(cli('--unknown').status, 1)
    assert.equal(cli(defaultTarget, target).status, 1)
    assert.equal(await readFile(defaultTarget, 'utf8'), merged)
    assert.equal(cli().status, 0)
    assert.equal(cli('--check').status, 0)
    assert.equal(await readFile(defaultTarget, 'utf8'), fixture)
    assert.equal(await readFile(join(root, '--check'), 'utf8'), 'unrelated file')
  })
  await sandbox(async ({ root, cli }) => {
    assert.equal(cli().status, 1)
    const defaultTarget = join(root, 'profiles', 'default', 'node_modules', 'dsh-claude-slider', 'lib', 'client.js')
    await mkdir(join(defaultTarget, '..'), { recursive: true })
    await writeFile(defaultTarget, fixture)
    assert.equal(cli('--check').status, 0)
    assert.equal(cli().status, 0)
    assert.equal(await readFile(defaultTarget, 'utf8'), fixture)
  })
})
