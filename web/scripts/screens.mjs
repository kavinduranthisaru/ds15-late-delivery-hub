// Screenshots and checks for every page and tab at 375 px (phone) and 1280 px (desktop), light and dark.
// Fails on: console errors, horizontal page scroll, and (desktop) a page taller than the viewport.
// Usage: node scripts/screens.mjs [baseUrl] [--only=/path?tab=x] [--no-shots]
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const base = args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:4173'
const only = args.find((a) => a.startsWith('--only='))?.slice(7)
const shots = !args.includes('--no-shots')
const out = fileURLToPath(new URL('../../screenshots/', import.meta.url))
mkdirSync(out, { recursive: true })

const ROUTES = [
  '/?tab=summary', '/?tab=data', '/?tab=result',
  '/models?tab=cards', '/models?tab=table',
  '/models/logistic_regression?tab=overview', '/models/random_forest?tab=notes', '/models/knn?tab=settings',
  '/compare?tab=metrics', '/compare?tab=settings', '/compare?tab=notes',
  '/charts?tab=roc', '/charts?tab=prroc', '/charts?tab=fit', '/charts?tab=brier', '/charts?tab=scorecard', '/charts?tab=robust',
  '/method?tab=ladder', '/method?tab=cv', '/method?tab=metrics', '/method?tab=brier', '/method?tab=scorecard', '/method?tab=sensitivity',
  '/predict', '/about?tab=team', '/about?tab=limits', '/about?tab=cite', '/nope',
].filter((r) => !only || r === only)
const VIEWS = [
  { name: '375', width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: '1280', width: 1280, height: 800, deviceScaleFactor: 1 },
]

const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
let problems = 0
for (const view of VIEWS) {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage()
    await page.setViewport(view)
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }, { name: 'prefers-reduced-motion', value: 'reduce' }])
    for (const route of ROUTES) {
      const errors = []
      const onConsole = (m) => m.type() === 'error' && errors.push(m.text())
      const onError = (e) => errors.push(String(e))
      page.on('console', onConsole); page.on('pageerror', onError)
      const sep = route.includes('?') ? '&' : '?'
      await page.goto(`${base}${route}${sep}theme=${theme}`, { waitUntil: 'networkidle0' })
      if (route === '/predict') {   // run the High example so the result card is captured
        const btn = await page.$('button[aria-pressed][title*="afternoon"]')
        if (btn) { await btn.click(); await page.waitForSelector('[aria-labelledby="result-title"]', { timeout: 5000 }).catch(() => errors.push('no result card')) }
      }
      await new Promise((r) => setTimeout(r, 350))
      const m = await page.evaluate(() => {
        // the tab panel scrolls on its own; report how much content overflows it
        const panel = document.querySelector('main .scroll-y')
        return { overflowX: document.documentElement.scrollWidth - window.innerWidth,
          pageExtra: document.documentElement.scrollHeight - window.innerHeight,
          panelExtra: panel ? Math.max(0, panel.scrollHeight - panel.clientHeight) : 0 }
      })
      const desktop = view.name === '1280'
      const ok = !errors.length && m.overflowX <= 0 && (!desktop || m.pageExtra <= 0)
      if (!ok) problems++
      const slug = route.replace(/^\/(\?|$)/, 'overview$1').replace(/^\//, '').replace(/[/?=&]/g, '-')
      if (shots && (theme === 'light' || route.includes('summary') || route === '/predict' || route.includes('cards'))) {
        await page.screenshot({ path: `${out}${slug}-${view.name}-${theme}.png` })
      }
      console.log(`${ok ? 'OK  ' : 'FAIL'} ${view.name} ${theme.padEnd(5)} ${route.padEnd(42)} errors ${errors.length} · x-overflow ${m.overflowX} · page scroll ${m.pageExtra} · panel scroll ${m.panelExtra}${errors.length ? '\n     ' + errors.join('\n     ') : ''}`)
      page.off('console', onConsole); page.off('pageerror', onError)
    }
    await page.close()
  }
}
await browser.close()
console.log(problems ? `${problems} problems` : 'All pages pass.')
process.exit(problems ? 1 : 0)
