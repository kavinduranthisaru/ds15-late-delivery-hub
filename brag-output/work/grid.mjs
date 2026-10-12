import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const require = createRequire('/Users/dexter_kr/Projects/ds15-webapp/web/package.json')
const puppeteer = require('puppeteer-core')
const [,, out, ...files] = process.argv
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const p = await b.newPage()
await p.setViewport({ width: 1940, height: 600 })
await p.setContent(`<body style="margin:0;background:#555;display:grid;grid-template-columns:960px 960px;gap:10px;padding:5px">${files.map((f) => `<div style="position:relative"><img style="width:960px;display:block" src="data:image/png;base64,${readFileSync(f).toString('base64')}"><span style="position:absolute;left:6px;top:4px;background:#000;color:#fff;font:14px sans-serif;padding:2px 5px">${f.split('/').pop()}</span></div>`).join('')}</body>`)
await p.screenshot({ path: out, fullPage: true })
await b.close()
