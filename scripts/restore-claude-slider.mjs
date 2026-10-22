#!/usr/bin/env node
// One-time migration for copies modified by the former merged-settings patch.
// Current dsh-claude-slider versions keep their own settings without any patch.
// Only the two exact integration blocks below are removed; unrelated source and
// its line endings remain untouched. Unknown or incomplete blocks are not edited.
//
// Usage:
//   node scripts/restore-claude-slider.mjs          # desktop, then default profile
//   node scripts/restore-claude-slider.mjs --check  # read-only standalone check
//   node scripts/restore-claude-slider.mjs <path>   # explicit client.js only
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const SECTION_OLD = `      ctx.slots.inject(SLOT_SETTINGS, () => {
        return ctx.slots.register({
          name: SLOT_SETTINGS,
          id: "claude-reasoning-slider",
          order: 26,
          label: () => "推理滑块 (Claude)"
        }, () => h(ClaudeSettingsPage));
      });`

const SECTION_NEW = `      // dsh-claude-beautify hosts this page inside its own "Claude 美化" settings
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

const EXPORT_OLD = `    exports.configStore = configStore;`
const EXPORT_NEW = `    exports.configStore = configStore;
    // Consumed by dsh-claude-beautify, which renders this page inside its merged
    // "Claude 美化" settings section.
    exports.ClaudeSettingsPage = ClaudeSettingsPage;`

function exactBlock(block) {
  const escaped = block.split('\n').map(line => line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`^${escaped.join('\\r?\\n')}(?=\\r?\\n|$)`, 'gm')
}

function argumentsFor(args) {
  const options = { checkOnly: false, target: null }
  for (const arg of args) {
    if (arg === '--check') options.checkOnly = true
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`)
    else if (options.target !== null) throw new Error('Provide at most one client.js path.')
    else options.target = arg
  }
  return options
}

function locate(explicitTarget) {
  // Missing explicit targets must not select another installed copy instead.
  if (explicitTarget !== null) {
    if (!existsSync(explicitTarget)) throw new Error(`dsh-claude-slider client not found: ${explicitTarget}`)
    return explicitTarget
  }
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  const candidates = [
    join(home, 'profiles', 'desktop', 'node_modules', 'dsh-claude-slider', 'lib', 'client.js'),
    join(home, 'profiles', 'default', 'node_modules', 'dsh-claude-slider', 'lib', 'client.js'),
  ]
  return candidates.find(candidate => existsSync(candidate)) ?? null
}

function restoreSource(original) {
  const guards = [...original.matchAll(exactBlock(SECTION_NEW))]
  const sections = [...original.matchAll(exactBlock(SECTION_OLD))]
  const exports = [...original.matchAll(exactBlock(EXPORT_NEW))]
  const configExports = [...original.matchAll(exactBlock(EXPORT_OLD))]
  if (guards.length + sections.length !== 1 || exports.length > 1 || configExports.length !== 1) {
    throw new Error('unexpected dsh-claude-slider build: standalone settings anchors are not uniquely recognized; no changes written')
  }
  let next = original
  if (guards.length) {
    const block = guards[0][0]
    // Keep the original injection's individual LF/CRLF endings while removing
    // the known wrapper and its extra two spaces of indentation.
    const lines = block.split(/(?<=\n)/)
    const start = lines.findIndex(line => line.startsWith('        ctx.slots.inject'))
    const standalone = lines.slice(start, -1).join('').replace(/\r?\n$/, '').replace(/^  /gm, '')
    next = next.replace(exactBlock(SECTION_NEW), () => standalone)
  }
  if (exports.length) next = next.replace(exactBlock(EXPORT_NEW), () => EXPORT_OLD)
  // Refuse altered or truncated integration blocks before writing either part.
  // A known guard-only or export-only patch is safe; a partial block is not.
  if (/__dsbHostsClaudeSettings|\bhostedElsewhere\b|exports\s*\.\s*ClaudeSettingsPage|dsh-claude-beautify hosts this page|Consumed by dsh-claude-beautify/.test(next)) {
    throw new Error('unexpected or incomplete merged-settings patch; no changes written')
  }
  return { source: next, guard: guards.length === 1, settingsExport: exports.length === 1 }
}

async function main() {
  const options = argumentsFor(process.argv.slice(2))
  const target = locate(options.target)
  if (!target) throw new Error('dsh-claude-slider not found; no migration needed until it is installed.')
  const original = await readFile(target, 'utf8')
  const result = restoreSource(original)
  const independent = !result.guard && !result.settingsExport
  if (options.checkOnly) {
    console.log(`${independent ? 'standalone settings ready' : 'legacy merged settings found'}: ${target} (merge guard: ${result.guard ? 'present' : 'absent'}, extra settings export: ${result.settingsExport ? 'present' : 'absent'})`)
    process.exitCode = independent ? 0 : 1
    return
  }
  if (independent) {
    console.log(`already standalone: ${target}`)
    return
  }
  await writeFile(target, result.source, 'utf8')
  console.log(`restored standalone settings: ${target}`)
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
