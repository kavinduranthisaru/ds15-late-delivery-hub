// Champion scoring in the browser: the exact linear form of the saved Logistic Regression pipeline
// (exported by api/scripts/export_browser_model.py). Pure functions, shared by the app and scripts/parity.mjs.

/** Notebook 02 Step 5 for one order: the time features, read from the "YYYY-MM-DDTHH:MM" text (no time zone). */
export function engineer(order) {
  const [date, time = '00:00'] = order.order_date.split('T')
  const [y, mo, d] = date.split('-').map(Number)
  const hour = Number(time.split(':')[0])
  const dow = (new Date(Date.UTC(y, mo - 1, d)).getUTCDay() + 6) % 7   // Monday = 0, like pandas
  const cyc = (v, period) => [Math.sin((2 * Math.PI * v) / period), Math.cos((2 * Math.PI * v) / period)]
  const [hour_sin, hour_cos] = cyc(hour, 24), [dow_sin, dow_cos] = cyc(dow, 7), [month_sin, month_cos] = cyc(mo - 1, 12)
  return {
    shipping_mode: order.shipping_mode, market: order.market, order_region: order.order_region,
    customer_segment: order.customer_segment, payment_type: order.payment_type,
    n_lines: +order.n_lines, total_qty: +order.total_qty, gross_sales: +order.gross_sales,
    total_discount: +order.total_discount, discount_rate: order.total_discount / order.gross_sales,
    max_unit_price: +order.max_unit_price,
    hour_sin, hour_cos, dow_sin, dow_cos, month_sin, month_cos,
    is_after_noon: hour >= 12 ? 1 : 0, is_weekend: dow >= 5 ? 1 : 0,
    same_day_after_cutoff: order.shipping_mode === 'Same Day' && hour >= 12 ? 1 : 0,
  }
}

const value = (t, f) =>
  t.kind === 'num' ? (f[t.feature] - t.mean) / t.scale : t.kind === 'onehot' ? (String(f[t.feature]) === t.category ? 1 : 0) : f[t.feature]

/** P(late) and the per-feature contributions to the log-odds. */
export function score(model, order) {
  const f = engineer(order)
  let z = model.intercept
  const contrib = {}
  for (const t of model.terms) {
    const c = t.coef * value(t, f)
    z += c
    contrib[t.feature] = (contrib[t.feature] ?? 0) + c
  }
  return { probability: 1 / (1 + Math.exp(-z)), contrib, features: f }
}

const FRIENDLY = {
  shipping_mode: 'shipping mode', same_day_after_cutoff: 'the Same Day noon cut-off', market: 'market', order_region: 'region',
  customer_segment: 'customer segment', payment_type: 'payment type', n_lines: 'number of lines', total_qty: 'quantity',
  gross_sales: 'order value', total_discount: 'discount', discount_rate: 'discount rate', max_unit_price: 'highest product price',
  hour_sin: 'time of day', hour_cos: 'time of day', dow_sin: 'day of the week', dow_cos: 'day of the week',
  month_sin: 'month', month_cos: 'month', is_after_noon: 'ordering after 12:00', is_weekend: 'weekend ordering',
}
const pct = (v) => `${Math.round(v * 100)}%`
const n = (v) => v.toLocaleString('en-US')

/** The same plain-English reason as api/app/explain.py. */
export function reason(contrib, f, reference) {
  const g = reference.rule_groups.find((r) => r.shipping_mode === f.shipping_mode && r.same_day_after_cutoff === f.same_day_after_cutoff)
  const base = f.shipping_mode === 'Same Day'
    ? `In the training data, ${pct(g.late_rate)} of Same Day orders placed ${g.same_day_after_cutoff ? 'after' : 'before'} 12:00 were late (${n(g.orders)} orders).`
    : `In the training data, ${pct(g.late_rate)} of ${f.shipping_mode} orders were late (${n(g.orders)} orders).`
  const top = Object.entries(contrib).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]
  if (!top) return base
  const [feat, c] = top, dir = c > 0 ? 'raises' : 'lowers'
  const lead = feat === 'shipping_mode' ? `The main reason is the shipping mode (${f.shipping_mode}), which ${dir} the risk the most.`
    : feat === 'same_day_after_cutoff' ? 'The main reason is the Same Day noon cut-off: this order came in after 12:00, which raises the risk the most.'
      : `The biggest push comes from ${FRIENDLY[feat] ?? feat}, which ${dir} the risk.`
  return `${lead} ${base}`
}

export function predict(model, reference, order) {
  const { probability, contrib, features } = score(model, order)
  const p = probability
  const notes = Object.entries(reference.numeric)
    .filter(([k, r]) => order[k] < r.min || order[k] > r.max)
    .map(([k, r]) => `${k} = ${order[k]} is outside the training range (${r.min} to ${r.max}).`)
  return {
    probability: p, cutoff: model.cutoff, predicted_late: p >= model.cutoff,
    tier: p >= model.tiers.High ? 'High' : p >= model.tiers.Medium ? 'Medium' : 'Low',
    reason: reason(contrib, features, reference), note: notes.length ? notes.join(' ') : null,
  }
}
