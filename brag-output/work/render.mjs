// Render every frame (pure function of time) from video.html and pipe it straight into ffmpeg (no frames on disk).
// Usage: node render.mjs [fps=30] [seconds=60]
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
const require = createRequire('/Users/dexter_kr/Projects/ds15-webapp/web/package.json')
const puppeteer = require('puppeteer-core')
const fps = Number(process.argv[2] ?? 30), secs = Number(process.argv[3] ?? 60)
const here = new URL('./', import.meta.url).pathname
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${here}video_noaudio.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] })
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const p = await b.newPage()
const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
await p.setViewport({ width: 1536, height: 864, deviceScaleFactor: 1.25 })
await p.goto('http://127.0.0.1:5174/video.html', { waitUntil: 'networkidle0' })
await p.evaluate(() => window.__ready)
const total = Math.round(fps * secs), t0 = Date.now()
for (let i = 0; i < total; i++) {
  await p.evaluate((t) => window.__render(t), i / fps)
  const png = await p.screenshot({ type: 'png', optimizeForSpeed: true })
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r))
  if (i % 150 === 0) console.log(`frame ${i}/${total} (${((Date.now() - t0) / 1000).toFixed(0)} s)`)
}
ff.stdin.end()
await new Promise((r) => ff.on('close', r))
await b.close()
console.log(`done: ${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s, page errors ${errs.length}`)
