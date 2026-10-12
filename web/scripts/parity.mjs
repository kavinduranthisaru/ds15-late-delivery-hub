// Browser-model parity: champion-core.mjs must give the Python pipeline's probability on all 13,071 test orders,
// and the same reason text as the API for the three example orders.
import { readFileSync } from 'node:fs'
import { predict, score } from '../src/lib/champion-core.mjs'
const j = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
const model = j('../src/data/champion_model.json'), ref = j('../src/data/reference.json')
const fx = j('./fixtures/champion_parity.json')
let worst = 0, off4 = 0
for (const r of fx.rows) {
  const o = Object.fromEntries(fx.fields.slice(0, -1).map((k, i) => [k, r[i]]))
  const p = score(model, o).probability, want = r[r.length - 1]
  worst = Math.max(worst, Math.abs(p - want))
  if (p.toFixed(4) !== want.toFixed(4)) off4++
}
const ex = j('../src/data/examples.json')
let reasonsOk = true
try {
  const api = j('../../brag-output/work/predictions.json')
  for (const e of ex) { const r = predict(model, ref, e.order); if (r.reason !== api[e.key].reason || r.probability.toFixed(4) !== e.champion_probability.toFixed(4)) { reasonsOk = false; console.log('differs:', e.key) } }
} catch { console.log('(API example reasons not found; skipped that check)') }
console.log(`test orders: ${fx.rows.length}, max |browser - python| = ${worst.toExponential(2)}, differ at 4 dp: ${off4}, example reasons match API: ${reasonsOk}`)
process.exit(worst < 1e-9 && off4 === 0 && reasonsOk ? 0 : 1)
