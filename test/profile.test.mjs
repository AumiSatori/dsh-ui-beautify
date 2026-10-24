import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, lstatSync, rmSync, symlinkSync, existsSync } from 'node:fs'
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
    assert.ok(lstatSync(join(profile, 'node_modules', 'dsh-ui-beautify')).isSymbolicLink())
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

test('renaming a linked installation migrates only its dependency, bundle and junction', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dcb-profile-'))
  const profile = join(dir, 'profiles', 'desktop'), modules = join(profile, 'node_modules')
  const source = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '')
  const spec = `link:${source.replaceAll('\\', '/')}`
  mkdirSync(modules, { recursive: true })
  const original = { dependencies: { existing: '1.2.3', 'dsh-claude-beautify': spec }, dsh: { profile: { bundles: ['existing', 'dsh-claude-beautify'] } } }
  const pkgPath = join(profile, 'package.json'), lockPath = join(profile, 'pnpm-lock.yaml'), oldLink = join(modules, 'dsh-claude-beautify')
  writeFileSync(pkgPath, JSON.stringify(original))
  writeFileSync(lockPath, `lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      existing:\n        specifier: 1.2.3\n        version: 1.2.3\n      dsh-claude-beautify:\n        specifier: ${spec}\n        version: ${spec}\npackages: {}\n`)
  symlinkSync(source, oldLink, process.platform === 'win32' ? 'junction' : 'dir')
  const run = mode => spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/profile.mjs', import.meta.url)), mode], {
    encoding: 'utf8', env: { ...process.env, DSH_HOME: dir, DSH_UI_DATA_DIR: join(dir, 'backups') },
  })
  try {
    assert.equal(run('check').status, 1)
    const result = run('install'); assert.equal(result.status, 0, result.stderr)
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    assert.deepEqual(pkg.dependencies, { existing: '1.2.3', 'dsh-ui-beautify': spec })
    assert.deepEqual(pkg.dsh.profile.bundles, ['existing', 'dsh-ui-beautify'])
    assert.equal(existsSync(oldLink), false)
    assert.ok(lstatSync(join(modules, 'dsh-ui-beautify')).isSymbolicLink())
    assert.doesNotMatch(readFileSync(lockPath, 'utf8'), /^      dsh-claude-beautify:/m)
    assert.match(readFileSync(lockPath, 'utf8'), /existing:\n        specifier: 1.2.3/)
    assert.equal(run('check').status, 0)
    const installed = readFileSync(pkgPath, 'utf8')
    assert.equal(run('install').status, 0); assert.equal(readFileSync(pkgPath, 'utf8'), installed)
  } finally {
    assert.ok(dir.startsWith(join(tmpdir(), 'dcb-profile-')))
    rmSync(dir, { recursive: true, force: true })
  }
})

test('renaming refuses a separately installed old package before mutating any profile files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dcb-profile-')), profile = join(dir, 'profiles', 'desktop')
  mkdirSync(join(profile, 'node_modules', 'dsh-claude-beautify'), { recursive: true })
  const pkgPath = join(profile, 'package.json'), raw = JSON.stringify({ dependencies: { 'dsh-claude-beautify': '^0.3.70' }, dsh: { profile: { bundles: ['dsh-claude-beautify'] } } })
  writeFileSync(pkgPath, raw)
  try {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/profile.mjs', import.meta.url)), 'install'], { encoding: 'utf8', env: { ...process.env, DSH_HOME: dir } })
    assert.equal(result.status, 1); assert.match(result.stderr, /different installation/)
    assert.equal(readFileSync(pkgPath, 'utf8'), raw)
    assert.equal(existsSync(join(profile, 'node_modules', 'dsh-ui-beautify')), false)
  } finally {
    assert.ok(dir.startsWith(join(tmpdir(), 'dcb-profile-')))
    rmSync(dir, { recursive: true, force: true })
  }
})
