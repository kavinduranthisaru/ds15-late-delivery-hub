import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import examplesRaw from '../data/examples.json'
import referenceRaw from '../data/reference.json'
import { Icon } from '../components/Icon'
import { Page } from '../components/Page'
import { Card, ErrorCard, OwnerChip, PrimaryButton, Skeleton, Tag } from '../components/ui'
import { type Example, type Order, type Prediction, type Reference } from '../lib/api'
import { predict, type ChampionModel } from '../lib/champion-core.mjs'
import modelRaw from '../data/champion_model.json'
import { PAGES } from '../lib/nav'
import { champion, site } from '../lib/site'

const REF = referenceRaw as unknown as Reference
const MODEL = modelRaw as unknown as ChampionModel
const EXAMPLES = examplesRaw as unknown as Example[]
const CUT = site.facts.champion_cutoff
const TIERS = site.facts.tiers

const DEFAULT: Order = {
  order_date: '2017-08-14T10:30', shipping_mode: 'Standard Class', market: 'Europe', order_region: 'Western Europe',
  customer_segment: 'Consumer', payment_type: 'DEBIT', n_lines: 3, total_qty: 6, gross_sales: 560, total_discount: 51.5, max_unit_price: 200,
}
type Errors = Partial<Record<keyof Order | 'form', string>>

function check(o: Order): Errors {
  const e: Errors = {}
  if (!o.order_date) e.order_date = 'Pick a date and time.'
  if (!REF.market_regions[o.market]?.includes(o.order_region)) e.order_region = `Pick a region in ${o.market}.`
  if (!(o.n_lines >= 1 && o.n_lines <= 5)) e.n_lines = 'Between 1 and 5 lines.'
  if (!(o.total_qty >= o.n_lines)) e.total_qty = 'At least one item per line.'
  if (!(o.gross_sales > 0)) e.gross_sales = 'Must be more than 0.'
  if (!(o.total_discount >= 0)) e.total_discount = 'Cannot be negative.'
  else if (!(o.total_discount < o.gross_sales)) e.total_discount = 'Must be less than the order value.'
  if (!(o.max_unit_price > 0)) e.max_unit_price = 'Must be more than 0.'
  else if (o.max_unit_price > o.gross_sales) e.max_unit_price = 'Cannot be more than the order value.'
  return e
}

/* ---- Form fields ------------------------------------------------------------------------------------- */
const inputCls = 'h-11 w-full rounded-2xl border border-line bg-surface px-3.5 text-[15px] text-ink outline-none focus:border-ink aria-[invalid=true]:border-danger'
function Field({ id, label, help, error, children }: { id: string; label: string; help?: string; error?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-[13px] font-semibold text-ink">{label}</label>
      {children}
      {(error || help) && <p id={`${id}-help`} className={`mt-0.5 text-[12px] leading-snug ${error ? 'font-medium text-danger' : 'text-muted'}`}>{error ?? help}</p>}
    </div>
  )
}

function OrderForm({ order, setOrder, errors, onSubmit, busy, exampleKey, onExample, onClear }: {
  order: Order; setOrder: (o: Order) => void; errors: Errors; onSubmit: (e: FormEvent) => void; busy: boolean
  exampleKey: string | null; onExample: (e: Example) => void; onClear: () => void
}) {
  const set = <K extends keyof Order>(k: K, v: Order[K]) => setOrder({ ...order, [k]: v })
  const num = (k: keyof Order) => ({
    id: k, type: 'number', inputMode: 'decimal' as const, value: Number.isFinite(order[k] as number) ? String(order[k]) : '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, (e.target.value === '' ? NaN : Number(e.target.value)) as never),
    'aria-invalid': !!errors[k], 'aria-describedby': `${k}-help`, className: inputCls,
  })
  const sel = (k: 'shipping_mode' | 'market' | 'order_region' | 'customer_segment' | 'payment_type', opts: string[]) => (
    <select id={k} value={order[k]} aria-invalid={!!errors[k]} aria-describedby={`${k}-help`} className={inputCls}
      onChange={(e) => k === 'market'
        ? setOrder({ ...order, market: e.target.value, order_region: REF.market_regions[e.target.value][0] })
        : set(k, e.target.value)}>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
  return (
    <Card as="section" className="flex h-full min-h-0 flex-col p-5" aria-labelledby="order-title">
      <h2 id="order-title" className="sr-only">The order</h2>
      <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Example orders">
        <span className="text-[13px] text-muted">Examples:</span>
        {EXAMPLES.map((e) => (
          <button key={e.key} type="button" onClick={() => onExample(e)} aria-pressed={exampleKey === e.key} title={e.why}
            className={`inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium ${exampleKey === e.key ? 'bg-primary text-on-primary'
              : e.key === 'low' ? 'bg-[var(--mint-bg)] text-[var(--mint-fg)]' : e.key === 'mixed' ? 'bg-[var(--peach-bg)] text-[var(--peach-fg)]' : 'bg-[var(--pink-bg)] text-[var(--pink-fg)]'}`}>
            {e.title}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} noValidate className="scroll-y -mx-1 flex min-h-0 flex-1 flex-col px-1">
        <fieldset className="m-0 border-0 p-0">
          <legend className="label mb-1.5">Shipping</legend>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <Field id="shipping_mode" label="Shipping mode" help="The biggest driver" error={errors.shipping_mode}>{sel('shipping_mode', REF.categories.shipping_mode)}</Field>
            <Field id="order_date" label="Order date and time" help="Same Day after 12:00 misses the cut-off" error={errors.order_date}>
              <input id="order_date" type="datetime-local" value={order.order_date} onChange={(e) => set('order_date', e.target.value)}
                aria-invalid={!!errors.order_date} aria-describedby="order_date-help" className={inputCls} />
            </Field>
          </div>
        </fieldset>
        <fieldset className="m-0 mt-2 border-0 p-0">
          <legend className="label mb-1.5">Customer</legend>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <Field id="market" label="Market" error={errors.market}>{sel('market', REF.categories.market)}</Field>
            <Field id="order_region" label="Region" error={errors.order_region}>{sel('order_region', REF.market_regions[order.market] ?? [])}</Field>
            <Field id="customer_segment" label="Customer segment" error={errors.customer_segment}>{sel('customer_segment', REF.categories.customer_segment)}</Field>
            <Field id="payment_type" label="Payment type" error={errors.payment_type}>{sel('payment_type', REF.categories.payment_type)}</Field>
          </div>
        </fieldset>
        <fieldset className="m-0 mt-2 border-0 p-0">
          <legend className="label mb-1.5">Basket</legend>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
            <Field id="n_lines" label="Product lines (1 to 5)" error={errors.n_lines}><input {...num('n_lines')} min={1} max={5} step={1} /></Field>
            <Field id="total_qty" label="Total items" error={errors.total_qty}><input {...num('total_qty')} min={1} step={1} /></Field>
            <Field id="gross_sales" label="Order value ($)" help="Before discount" error={errors.gross_sales}><input {...num('gross_sales')} min={0} step={0.01} /></Field>
            <Field id="total_discount" label="Discount ($)" error={errors.total_discount}><input {...num('total_discount')} min={0} step={0.01} /></Field>
            <Field id="max_unit_price" label="Highest item price ($)" error={errors.max_unit_price}><input {...num('max_unit_price')} min={0} step={0.01} /></Field>
          </div>
        </fieldset>
        {errors.form && <p role="alert" className="mt-3 rounded-2xl bg-[var(--pink-bg)] p-3 text-[14px] text-[var(--pink-fg)]">{errors.form}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
          <PrimaryButton type="submit" icon="predict" disabled={busy}>{busy ? 'Predicting…' : 'Predict'}</PrimaryButton>
          <button type="button" onClick={onClear} title="Reset the form to the default order and remove the current prediction"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-surface-2 px-4 text-[14px] font-medium text-ink hover:bg-surface-3">
            <Icon name="close" size={16} /> Clear
          </button>
        </div>
      </form>
    </Card>
  )
}

/* ---- Result ------------------------------------------------------------------------------------------- */
function Gauge({ p }: { p: number }) {
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`
  return (
    <div className="mt-2" role="img" aria-label={`Late probability ${p.toFixed(4)} on a scale from 0 to 1. Cut-off at ${CUT.toFixed(4)}.`}>
      <div className="relative h-4 rounded-full bg-surface-2">
        <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
          style={{ width: pct(p), background: p >= CUT ? 'var(--danger)' : 'var(--ok)' }} />
        <div className="absolute -inset-y-1.5 w-0.5 rounded bg-ink" style={{ left: pct(CUT) }} />
      </div>
      <div className="relative mt-1.5 h-9 text-[12px] text-muted">
        <span className="absolute left-0">0</span>
        <span className="tnum absolute -translate-x-1/2 text-center font-semibold whitespace-nowrap text-ink" style={{ left: pct(CUT) }}>cut-off<br />{CUT.toFixed(4)}</span>
        <span className="absolute right-0">1</span>
      </div>
    </div>
  )
}

function Result({ state, onRetry }: { state: { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string } | { status: 'done'; r: Prediction; example?: Example }; onRetry: () => void }) {
  if (state.status === 'loading') return (
    <Card className="flex h-full flex-col gap-4 p-5" aria-busy="true"><Skeleton className="h-6 w-40" /><Skeleton className="h-16 w-56" /><Skeleton className="h-4 w-full" /><Skeleton className="h-20 w-full" /></Card>
  )
  if (state.status === 'error') return <ErrorCard title="No prediction" message={state.message} onRetry={onRetry} />
  if (state.status === 'idle') return (
    <Card className="flex h-full flex-col items-center justify-center p-8 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-green text-on-green"><Icon name="gauge" size={26} /></span>
      <p className="mt-4 text-[17px] font-semibold text-ink">No prediction yet</p>
      <p className="mt-1 max-w-[320px] text-[14px] text-muted">Fill in the order, or pick an example, then press Predict. The champion model scores it in a few milliseconds.</p>
    </Card>
  )
  const { r, example } = state
  const p = r.probability!
  const late = !!r.predicted_late
  return (
    <Card tint={late ? 'fail' : 'champion'} className="flex h-full flex-col p-5" aria-live="polite" aria-labelledby="result-title">
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone={late ? 'pink' : 'mint'} icon={late ? 'alert' : 'check'}>{late ? 'Flag as late' : 'Likely on time'}</Tag>
        <Tag tone={r.tier === 'High' ? 'pink' : r.tier === 'Medium' ? 'peach' : 'mint'}>{r.tier} risk tier</Tag>
      </div>
      <h2 id="result-title" className="mt-3 text-[15px] font-medium text-ink-2">Chance this order arrives late</h2>
      <p className="tnum text-[48px] leading-none font-bold text-ink">{Math.round(p * 100)}%<span className="ml-2 text-[18px] font-semibold text-muted">{p.toFixed(4)}</span></p>
      <Gauge p={p} />
      <p className="text-[15px] text-ink">{r.reason}</p>
      {r.note && <p className="mt-2 flex gap-2 rounded-2xl bg-[var(--peach-bg)] p-3 text-[13px] text-[var(--peach-fg)]"><Icon name="circle-alert" size={16} className="mt-0.5" />{r.note}</p>}
      {example && <p className="mt-2 text-[13px] text-muted">Example order {example.order_id} from the test set. It actually arrived {example.actual_late ? 'late' : 'on time'}.</p>}
      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-3 text-[13px] text-muted">
        <span className="flex flex-wrap items-center gap-1.5">Model used: <b className="text-ink">{champion.name}</b> <OwnerChip name={champion.owner_short} id={champion.owner_id} /></span>
        <span>{r.provenance}; runs in your browser with the model's exported weights. Cut-off {CUT.toFixed(4)} ({r.cutoff_source}). Tiers: Medium from {TIERS.Medium.toFixed(2)}, High from {TIERS.High.toFixed(2)} (provisional).</span>
      </div>
    </Card>
  )
}

export default function Predict() {
  const [order, setOrder] = useState<Order>(DEFAULT)
  const [errors, setErrors] = useState<Errors>({})
  const [exampleKey, setExampleKey] = useState<string | null>(null)
  const [state, setState] = useState<Parameters<typeof Result>[0]['state']>({ status: 'idle' })
  const [, setParams] = useSearchParams()
  const requestId = useRef(0)   // a response that arrives after Clear (or a newer request) is ignored

  const run = async (o: Order, example?: Example) => {
    const e = check(o)
    setErrors(e)
    if (Object.keys(e).length) return
    const id = ++requestId.current
    setState({ status: 'loading' })
    setParams((p) => { const n = new URLSearchParams(p); n.set('tab', 'result'); return n })
    try {
      // The champion runs in the browser: the exact linear form of the saved pipeline (see lib/champion-core.mjs).
      const out = predict(MODEL, REF, o)
      const r: Prediction = {
        model: 'logistic_regression', label: champion.label, owner_name: champion.owner_name, owner_id: champion.owner_id,
        available: true, probability: out.probability, cutoff: out.cutoff, cutoff_source: 'own cut-off, set on validation',
        predicted_late: out.predicted_late, tier: out.tier, reason: out.reason, provenance: MODEL.provenance, note: out.note,
      }
      if (id !== requestId.current) return
      setState({ status: 'done', r, example })
    } catch (err) {
      if (id !== requestId.current) return
      setState({ status: 'error', message: `The model could not score this order: ${(err as Error).message}` })
    }
  }
  const onExample = (e: Example) => { setExampleKey(e.key); setOrder(e.order); run(e.order, e) }
  const setOrderManual = (o: Order) => { setExampleKey(null); setOrder(o) }
  const clear = () => {
    requestId.current++
    setOrder(DEFAULT); setErrors({}); setExampleKey(null); setState({ status: 'idle' })
    setParams((p) => { const n = new URLSearchParams(p); n.set('tab', 'order'); return n })
  }

  return (
    <Page page={PAGES[5]} tabsPhoneOnly>
      {(tab) => (
        <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className={`${tab === 'order' ? '' : 'hidden'} min-h-0 lg:block`}>
            <OrderForm order={order} setOrder={setOrderManual} errors={errors} busy={state.status === 'loading'}
              onSubmit={(e) => { e.preventDefault(); run(order) }} exampleKey={exampleKey} onExample={onExample} onClear={clear} />
          </div>
          <div className={`${tab === 'result' ? '' : 'hidden'} min-h-0 lg:block`}>
            <Result state={state} onRetry={() => run(order)} />
          </div>
        </div>
      )}
    </Page>
  )
}
