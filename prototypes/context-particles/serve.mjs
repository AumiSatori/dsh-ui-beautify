import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const [file, port = '0'] = process.argv.slice(2)
if (!file) throw new Error('Usage: node serve.mjs <built.html> [port]')
await readFile(resolve(file))
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://127.0.0.1').pathname
  if (path === '/favicon.ico') { res.writeHead(204).end(); return }
  if (path !== '/' && path !== '/preview.html') { res.writeHead(404).end(); return }
  try {
    const html = await readFile(resolve(file))
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(html)
  } catch { res.writeHead(500).end('Preview unavailable') }
})
server.listen(Number(port), '127.0.0.1', () => console.log(`http://127.0.0.1:${server.address().port}/preview.html`))
