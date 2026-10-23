import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const [asset, output] = process.argv.slice(2)
if (!asset || !output) throw new Error('Usage: node build.mjs <reference.jpg> <output.html>')
const source = await readFile(resolve(asset))
const template = await readFile(resolve(here, 'preview.html'), 'utf8')
if (!template.includes('__REFERENCE_IMAGE__')) throw new Error('Missing image marker')
const svgImport = await readFile(resolve(here, 'svg-import.js'), 'utf8')
const shellStyle = await readFile(resolve(here, 'shell.css'), 'utf8')
const shellMarkup = await readFile(resolve(here, 'shell.html'), 'utf8')
const shellCode = await readFile(resolve(here, 'shell.js'), 'utf8')
const html = template.replace('__REFERENCE_IMAGE__', () => `data:image/jpeg;base64,${source.toString('base64')}`)
  .replace('__SVG_IMPORT_CODE__', () => svgImport)
  .replace('__SHELL_STYLE__', () => shellStyle)
  .replace('__SHELL_MARKUP__', () => shellMarkup)
  .replace('__SHELL_CODE__', () => shellCode)
await mkdir(dirname(resolve(output)), { recursive: true })
await writeFile(resolve(output), html, 'utf8')
console.log(`Built ${resolve(output)} (${Buffer.byteLength(html)} bytes); image embedded, no external dependencies`)
