// WCAG contrast check for the colour tokens in src/styles/index.css (text 4.5:1, chart marks 3:1).
import { readFileSync } from 'node:fs'
const css = readFileSync(new URL('../src/styles/index.css', import.meta.url), 'utf8')
const block = (sel) => Object.fromEntries([...css.slice(css.indexOf(sel)).split('}')[0].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]))
const light = block(':root {'), dark = { ...light, ...block(":root[data-theme='dark'] {") }
const L = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
const cr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const TEXT = [['ink', 'surface'], ['ink', 'app'], ['title', 'app'], ['ink-2', 'surface'], ['muted', 'surface'], ['muted', 'app'],
  ['on-green', 'green'], ['primary-fg', 'primary-bg'], ['mint-fg', 'mint-bg'], ['pink-fg', 'pink-bg'], ['pink-fg', 'pink-card'],
  ['peach-fg', 'peach-bg'], ['peach-fg', 'peach-card'], ['blue-fg', 'blue-bg'], ['grey-fg', 'grey-bg'], ['ink', 'champ-card'],
  ['ink-2', 'champ-card'], ['muted', 'surface-2'], ['ink-2', 'pink-card'], ['ink-2', 'peach-card'],
  ['m-madushani', 'surface'], ['m-ranthisaru', 'surface'], ['m-ratnaweera', 'surface'], ['m-maheepala', 'surface']]
const MARKS = [['danger', 'surface'], ['warn', 'surface'], ['danger', 'pink-card'], ['warn', 'peach-card'], ['ok', 'surface']]
let bad = 0
for (const [name, t] of [['light', light], ['dark', dark]]) {
  for (const [list, min] of [[TEXT, 4.5], [MARKS, 3]]) for (const [fg, bg] of list) {
    if (!t[fg] || !t[bg]) continue
    const r = cr(t[fg], t[bg]); const ok = r >= min; if (!ok) bad++
    if (!ok || process.argv.includes('-v')) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${fg} on ${bg}: ${r.toFixed(2)} (need ${min})`)
  }
}
console.log(bad ? `${bad} pairs below WCAG AA` : 'All colour pairs pass WCAG AA.')
process.exit(bad ? 1 : 0)
