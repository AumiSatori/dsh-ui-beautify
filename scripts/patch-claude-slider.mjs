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

const MARK = '__dsbHostsClaudeSettings'

function candidates() {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  return [
    process.argv[2],
    join(home, 'profiles', 'desktop', 'node_modules', 'dsh-claude-slider', 'lib', 'client.js'),
    join(home, 'profiles', 'default', 'node_modules', 'dsh-claude-slider', 'lib', 'client.js'),
  ].filter(Boolean)
}

function locate() {
  for (const candidate of candidates()) if (existsSync(candidate)) return candidate
  return null
}

async function main() {
  const checkOnly = process.argv.includes('--check')
  const target = locate()
  if (!target) {
    console.error('dsh-claude-slider not found — install it first (pnpm add dsh-claude-slider).')
    process.exit(1)
  }
  const source = await readFile(target, 'utf8')
  const patched = source.includes(MARK)
  if (checkOnly) {
    console.log(patched ? `patch present: ${target}` : `patch missing: ${target}`)
    process.exit(patched ? 0 : 1)
  }
  if (patched) {
    console.log(`already patched: ${target}`)
    return
  }
  if (!source.includes(SECTION_OLD) || !source.includes(EXPORT_OLD)) {
    console.error(`unexpected dsh-claude-slider build — patch anchors not found in ${target}`)
    console.error('The plugin probably changed shape upstream; re-check scripts/patch-claude-slider.mjs.')
    process.exit(1)
  }
  const next = source.replace(SECTION_OLD, SECTION_NEW).replace(EXPORT_OLD, EXPORT_NEW)
  await writeFile(target, next, 'utf8')
  console.log(`patched: ${target}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
