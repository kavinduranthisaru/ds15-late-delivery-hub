// Capture review stills at given times: node stills.mjs 2.5 6 ...
import { createRequire } from 'node:module'
const require = createRequire('/Users/dexter_kr/Projects/ds15-webapp/web/package.json')
const puppeteer = require('puppeteer-core')
const out = new URL('./stills/', import.meta.url).pathname
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const p = await b.newPage()
const errs = []; p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(String(e)))
await p.setViewport({ width: 1536, height: 864, deviceScaleFactor: 1.25 })
await p.goto('http://127.0.0.1:5174/video.html', { waitUntil: 'networkidle0' })
await p.evaluate(() => window.__ready)
for (const s of process.argv.slice(2)) {
  await p.evaluate((t) => window.__render(t), Number(s))
  await p.screenshot({ path: `${out}t${String(s).padStart(5, '0')}.png` })
}
console.log('errors:', errs.length, errs.slice(0, 3))
await b.close()
