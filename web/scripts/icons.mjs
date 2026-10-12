// Render the PWA PNG icons from public/icons/icon.svg with headless Chrome.
import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const svg = readFileSync(fileURLToPath(new URL('../public/icons/icon.svg', import.meta.url)), 'utf8').replace('rx="16"', 'rx="0"')
const b = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const p = await b.newPage()
for (const n of [192, 512]) {
  await p.setViewport({ width: n, height: n })
  await p.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${n}" height="${n}" `)}</body>`)
  await p.screenshot({ path: fileURLToPath(new URL(`../public/icons/icon-${n}.png`, import.meta.url)) })
}
await b.close()
