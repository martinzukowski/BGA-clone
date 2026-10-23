// Serves dist/ locally the way Vercel will: directory URLs get a trailing
// slash and their index.html, unknown paths get 404.html, and /api/<name>/
// runs the matching function in api/<name>.js (its exported GET/POST/...).
//
//   npm run preview            http://localhost:4173
//   PORT=8080 npm run preview
//   ANTHROPIC_API_KEY=... npm run preview    (to try Deep Cut's answer judge)

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const port = Number(process.env.PORT) || 4173

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
}

if (!fs.existsSync(dist)) {
  console.error('dist/ not found - run `npm run build` first.')
  process.exit(1)
}

// Runs a Vercel-style function: builds a web Request from the Node request and streams back its Response.
async function api(req, res, url) {
  const name = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '')
  const file = path.join(root, 'api', `${name}.js`)
  if (!/^[a-z0-9-]+$/.test(name) || !fs.existsSync(file)) return res.writeHead(404).end()
  const handler = (await import(pathToFileURL(file).href))[req.method]
  if (!handler) return res.writeHead(405).end()
  const chunks = []
  for await (const c of req) chunks.push(c)
  const request = new Request(url, {
    method: req.method,
    headers: { ...req.headers, 'x-forwarded-for': req.socket.remoteAddress ?? 'local' },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
  })
  const response = await handler(request)
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
}

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (url.pathname.startsWith('/api/')) {
      api(req, res, url).catch(err => { console.error(err); if (!res.headersSent) res.writeHead(500); res.end() })
      return
    }
    const requested = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
    let file = path.join(dist, requested)
    if (!file.startsWith(dist)) {
      res.writeHead(403).end()
      return
    }

    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!url.pathname.endsWith('/')) {
        res.writeHead(308, { Location: `${url.pathname}/${url.search}` }).end()
        return
      }
      file = path.join(file, 'index.html')
    }

    if (!fs.existsSync(file)) {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] })
      fs.createReadStream(path.join(dist, '404.html')).pipe(res)
      return
    }

    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
  .listen(port, () => console.log(`Game Center preview: http://localhost:${port}`))
