import { useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Page } from '../components/Page'
import { Card, OwnerChip, RoundLink } from '../components/ui'
import { PAGES } from '../lib/nav'
import { f1, f4, memberColor, models, signed, type Model, type ModelKey } from '../lib/site'

const DEFAULT: ModelKey[] = ['logistic_regression', 'knn', 'linear_svm']
const ROWS: { label: string; get: (m: Model) => number | null; fmt: (v: number | null) => string; better: 'high' | 'low' | 'zero' }[] = [
  { label: 'Scorecard (/100)', get: (m) => m.score, fmt: (v) => (v == null ? '' : f1(v)), better: 'high' },
  { label: 'CV ROC-AUC', get: (m) => m.cv_roc, fmt: f4, better: 'high' },
  { label: 'CV PR-AUC', get: (m) => m.cv_pr, fmt: f4, better: 'high' },
  { label: 'Test ROC-AUC', get: (m) => m.test_roc, fmt: f4, better: 'high' },
  { label: 'Test PR-AUC', get: (m) => m.test_pr, fmt: f4, better: 'high' },
  { label: 'Test Brier', get: (m) => m.test_brier, fmt: f4, better: 'low' },
  { label: 'Fit gap', get: (m) => m.fit_gap, fmt: (v) => (v == null ? '' : signed(v)), better: 'zero' },
]

function useSelection() {
  const [params, setParams] = useSearchParams()
  const raw = (params.get('m') ?? '').split(',').filter((k) => models.some((m) => m.key === k)) as ModelKey[]
  const sel = raw.length >= 2 ? raw.slice(0, 3) : DEFAULT
  const toggle = (k: ModelKey) => {
    const next = sel.includes(k) ? sel.filter((x) => x !== k) : sel.length < 3 ? [...sel, k] : [...sel.slice(1), k]
    if (next.length < 2) return
    setParams((p) => { const n = new URLSearchParams(p); n.set('m', next.join(',')); return n })
  }
  return [sel, toggle] as const
}

function Columns({ picked, render }: { picked: Model[]; render: (m: Model) => React.ReactNode }) {
  return (
    <div className={`grid gap-4 ${picked.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
      {picked.map((m) => (
        <Card key={m.key} className="p-5" tint={m.champion ? 'champion' : 'none'}>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0"><h2 className="text-[17px] font-bold text-ink">{m.name}</h2><OwnerChip name={m.owner_short} id={m.owner_id} /></div>
            <RoundLink to={`/models/${m.key}`} label={`Open ${m.label}`} />
          </div>
          {render(m)}
        </Card>
      ))}
    </div>
  )
}

export default function Compare() {
  const [sel, toggle] = useSelection()
  const picked = sel.map((k) => models.find((m) => m.key === k)!)
  const picker = (
    <fieldset className="scroll-x -mx-4 flex w-[calc(100%+2rem)] gap-2 px-4 md:mx-0 md:w-auto md:flex-wrap md:px-0">
      <legend className="sr-only">Pick two or three models</legend>
      {models.map((m) => {
        const on = sel.includes(m.key)
        return (
          <button key={m.key} type="button" aria-pressed={on} onClick={() => toggle(m.key)}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-[14px] font-medium transition-colors ${on ? 'bg-primary text-on-primary' : 'bg-surface text-ink-2 shadow-[var(--shadow)] hover:text-ink'}`}>
            <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: memberColor(m.owner_id) }} />
            {m.name}{on && <Icon name="check" size={16} />}
          </button>
        )
      })}
    </fieldset>
  )
  return (
    <Page page={PAGES[2]} toolbar={picker}>
      {(tab) => {
        if (tab === 'settings') return <Columns picked={picked} render={(m) => (
          <dl className="m-0 divide-y divide-[var(--line)]">
            {Object.entries(m.settings).map(([k, v]) => (
              <div key={k} className="py-2"><dt className="text-[13px] text-muted">{k}</dt><dd className="m-0 text-[14px] font-medium text-ink">{v}</dd></div>
            ))}
          </dl>)} />
        if (tab === 'notes') return <Columns picked={picked} render={(m) => (
          <div className="flex flex-col gap-3">
            <div><p className="label mb-1.5">Strengths</p>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">{m.strengths.map((s) => <li key={s} className="flex gap-2 text-[14px] text-ink-2"><Icon name="check" size={16} className="mt-0.5 text-ok" />{s}</li>)}</ul></div>
            <div><p className="label mb-1.5">Weaknesses</p>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">{m.weaknesses.map((s) => <li key={s} className="flex gap-2 text-[14px] text-ink-2"><Icon name="alert" size={16} className="mt-0.5 text-warn" />{s}</li>)}</ul></div>
          </div>)} />
        return (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[14px]">
              <caption className="sr-only">Side-by-side metrics. The best value in each row is marked “best”.</caption>
              <thead><tr className="border-b border-line">
                <th scope="col" className="px-5 py-3 text-left font-semibold text-muted">Metric</th>
                {picked.map((m) => <th key={m.key} scope="col" className="px-5 py-3 text-right"><span className="block font-bold text-ink">{m.name}</span><span className="text-[12px] font-normal text-muted">{m.owner_short} {m.owner_id}</span></th>)}
              </tr></thead>
              <tbody>
                {ROWS.map((r) => {
                  const vals = picked.map(r.get)
                  const real = vals.filter((v): v is number => v != null)
                  const best = real.length < 2 ? null : r.better === 'high' ? Math.max(...real) : r.better === 'low' ? Math.min(...real) : real.reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a))
                  const tie = real.filter((v) => v === best).length === real.length
                  return (
                    <tr key={r.label} className="border-b border-line last:border-0">
                      <th scope="row" className="px-5 py-3 text-left font-medium text-ink-2">{r.label}</th>
                      {vals.map((v, i) => {
                        const isBest = v != null && v === best && !tie
                        return (
                          <td key={picked[i].key} className={`tnum px-5 py-3 text-right ${v == null ? 'text-muted' : 'text-ink'} ${isBest ? 'font-bold' : ''}`}>
                            {v == null ? 'not reported' : r.fmt(v)}
                            {isBest && <span className="ml-2 inline-flex h-6 items-center gap-1 rounded-full bg-[var(--mint-bg)] px-2 text-[12px] font-semibold text-[var(--mint-fg)]"><Icon name="check" size={12} strokeWidth={2.4} />best</span>}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="border-t border-line px-5 py-3 text-[12px] text-muted">Differences under 0.005 ROC-AUC are inside the tie zone, so “best” here does not mean a real gap.</p>
          </Card>
        )
      }}
    </Page>
  )
}
