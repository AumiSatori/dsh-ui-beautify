#!/usr/bin/env node
// Re-apply the dsh-claude-slider integration patch after reinstalling the npm package.
//
// dsh-claude-slider is installed from npm (third party). We only need two small
// changes in its client bundle:
//   1. export its settings page component, so this plugin can render it;
//   2. fall back to registering its own settings section only when nobody hosts it,
//      which keeps the settings sidebar at a single "Claude 美化" entry.
//
// Usage:
//   node scripts/patch-claude-slider.mjs            # patch the desktop profile copy
//   node scripts/patch-claude-slider.mjs --check    # exit 1 when the patch is missing
//   node scripts/patch-claude-slider.mjs <path>     # patch an explicit client.js
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
  // An explicit path must never silently fall back to a different installed copy.
  if (explicitTarget !== null) {
    if (!existsSync(explicitTarget)) throw new Error(`dsh-claude-slider client not found: ${explicitTarget}`)
    return explicitTarget
  }
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  const candidates = [
    join(home, 'profiles', 'desktop', 'node_modules', 'dsh-claude-slider', 'lib', 'client.js'),
    join(home, 'profiles', 'default', 'node_modules', 'dsh-claude-slider', 'lib', 'client.js'),
  ]
  for (const candidate of candidates) if (existsSync(candidate)) return candidate
  return null
}

async function main() {
  const options = argumentsFor(process.argv.slice(2))
  const target = locate(options.target)
  if (!target) {
    console.error('dsh-claude-slider not found — install it first (pnpm add dsh-claude-slider).')
    process.exit(1)
  }
  const original = await readFile(target, 'utf8')
  const source = original.replaceAll('\r\n', '\n')
  const hasGuard = source.includes(SECTION_NEW)
  const hasExport = source.includes('    exports.ClaudeSettingsPage = ClaudeSettingsPage;')
  const patched = hasGuard && hasExport
  if (options.checkOnly) {
    console.log(`${patched ? 'patch present' : 'patch missing'}: ${target} (settings guard: ${hasGuard ? 'present' : 'missing'}, settings export: ${hasExport ? 'present' : 'missing'})`)
    process.exitCode = patched ? 0 : 1
    return
  }
  if (patched) {
    console.log(`already patched: ${target}`)
    return
  }
  // Validate every missing piece before writing; partial patches can be repaired
  // only when their remaining upstream anchors are still recognizable.
  if ((!hasGuard && !source.includes(SECTION_OLD)) || (!hasExport && !source.includes(EXPORT_OLD))) {
    console.error(`unexpected dsh-claude-slider build — patch anchors not found in ${target}`)
    console.error('The plugin probably changed shape upstream; re-check scripts/patch-claude-slider.mjs.')
    process.exit(1)
  }
  let next = hasGuard ? source : source.replace(SECTION_OLD, SECTION_NEW)
  if (!hasExport) next = next.replace(EXPORT_OLD, EXPORT_NEW)
  await writeFile(target, original.includes('\r\n') ? next.replaceAll('\n', '\r\n') : next, 'utf8')
  console.log(`patched: ${target}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
