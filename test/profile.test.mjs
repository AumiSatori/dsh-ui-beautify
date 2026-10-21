import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, lstatSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

test('profile integration preserves other plugins, patch text and lock entries; install is idempotent and reversible', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dcb-profile-'))
  const profile = join(dir, 'profiles', 'desktop')
  mkdirSync(profile, { recursive: true })
  const pkg = { dependencies: { existing: '1.2.3' }, dsh: { profile: { bundles: ['existing'] } }, custom: { retained: true } }
  const patch = '# existing overrides\n- id: existing\n  config: {}\n'
  writeFileSync(join(profile, 'package.json'), JSON.stringify(pkg))
  writeFileSync(join(profile, 'cordis.patch.yml'), patch)
  const lock = "lockfileVersion: '9.0'\n\nimporters:\n\n  .:\n    dependencies:\n      existing:\n        specifier: 1.2.3\n        version: 1.2.3\n\npackages: {}\n"
  writeFileSync(join(profile, 'pnpm-lock.yaml'), lock)
  const run = mode => spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/profile.mjs', import.meta.url)), mode], {
    encoding: 'utf8', env: { ...process.env, DSH_HOME: dir, DSH_CLAUDE_DATA_DIR: join(dir, 'backups') },
  })
  try {
    const installed = run('install')
    assert.equal(installed.status, 0, installed.stderr)
    assert.equal(run('check').status, 0)
    assert.ok(lstatSync(join(profile, 'node_modules', 'dsh-claude-beautify')).isSymbolicLink())
    const afterFirst = readFileSync(join(profile, 'package.json'), 'utf8')
    const afterLock = readFileSync(join(profile, 'pnpm-lock.yaml'), 'utf8')
    assert.equal(run('install').status, 0)
    assert.equal(readFileSync(join(profile, 'package.json'), 'utf8'), afterFirst)
    assert.equal(readFileSync(join(profile, 'pnpm-lock.yaml'), 'utf8'), afterLock)
    assert.equal(readFileSync(join(profile, 'cordis.patch.yml'), 'utf8'), patch)
    const removed = run('uninstall')
    assert.equal(removed.status, 0, removed.stderr)
    assert.deepEqual(JSON.parse(readFileSync(join(profile, 'package.json'), 'utf8')), pkg)
    assert.equal(readFileSync(join(profile, 'pnpm-lock.yaml'), 'utf8'), lock)
    assert.equal(run('check').status, 1)
  } finally {
    // Remove only this test's verified OS temporary directory.
    assert.ok(dir.startsWith(join(tmpdir(), 'dcb-profile-')))
    rmSync(dir, { recursive: true, force: true })
  }
})
