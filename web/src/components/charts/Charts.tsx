import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts'
import { useSyncExternalStore } from 'react'
import { memberColor, models, site } from '../../lib/site'

const mq = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)') : null
const useNarrow = () => useSyncExternalStore((cb) => { mq?.addEventListener('change', cb); return () => mq?.removeEventListener('change', cb) }, () => !!mq?.matches)

const AXIS = { fontSize: 12, fill: 'var(--muted)' }
const GRID = <CartesianGrid stroke="var(--grid)" strokeDasharray="0" vertical={false} />
const shortName = (n: string) => n.replace('Logistic Regression', 'Log. Regression')

function Tip({ active, payload }: { active?: boolean; payload?: { payload: Record<string, unknown> }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as { label: string; lines: string[] }
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-2 text-[13px] shadow-[var(--shadow-lg)]">
      <p className="font-semibold text-ink">{d.label}</p>
      {d.lines.map((l) => <p key={l} className="tnum text-ink-2">{l}</p>)}
    </div>
  )
}

/** CV PR-AUC against CV ROC-AUC: the AdaBoost / XGBoost PR drop is a tie effect. */
export function PrVsRoc() {
  const data = models.map((m) => ({ x: m.cv_roc, y: m.cv_pr, label: m.label, fill: memberColor(m.owner_id),
    lines: [`CV ROC-AUC ${m.cv_roc.toFixed(4)}`, `CV PR-AUC ${m.cv_pr.toFixed(4)}`], name: m.name }))
  const rule = [
    { x: site.baseline.cv_roc, y: site.baseline.cv_pr, label: 'Simple rule as scored', lines: ['PR-AUC 0.8018 (ties count against it)'], name: 'Rule as scored' },
    { x: site.baseline.cv_roc, y: site.baseline.cv_pr_ties_fair, label: 'Simple rule, ties broken fairly', lines: ['PR-AUC 0.8562'], name: 'Rule, ties fair' },
  ]
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 8 }}>
        {GRID}
        <XAxis type="number" dataKey="x" domain={[0.768, 0.777]} tick={AXIS} tickFormatter={(v) => v.toFixed(3)}
          label={{ value: 'CV ROC-AUC (ignores ties)', position: 'bottom', offset: 8, ...AXIS }} />
        <YAxis type="number" dataKey="y" domain={[0.795, 0.862]} tick={AXIS} tickFormatter={(v) => v.toFixed(2)} width={44}
          label={{ value: 'CV PR-AUC', angle: -90, position: 'insideLeft', offset: 10, ...AXIS }} />
        <ZAxis range={[110, 110]} />
        <Tooltip content={<Tip />} cursor={false} />
        <ReferenceArea x1={0.7738} x2={0.7758} y1={0.799} y2={0.806} fill="var(--peach-bg)" fillOpacity={0.9} ifOverflow="visible"
          label={{ value: 'AdaBoost, XGBoost and the rule as scored: 0.8018', position: 'insideTopRight', fontSize: 12, fill: 'var(--peach-fg)' }} />
        <ReferenceLine y={site.baseline.cv_pr_ties_fair} stroke="var(--rule-model)" strokeDasharray="4 4"
          label={{ value: 'rule with ties broken fairly: 0.8562', position: 'insideBottomLeft', fontSize: 12, fill: 'var(--ink-2)' }} />
        <Scatter data={rule} shape="star" fill="var(--rule-model)" isAnimationActive={false} />
        <Scatter data={data} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.label} fill={d.fill} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

/** Horizontal bars with a limit line; values written next to every bar. */
function HBars({ rows, domain, limit, limitLabel, format }: {
  rows: { label: string; value: number | null; fill: string; note?: string }[]
  domain: [number, number]; limit: number; limitLabel: string; format: (v: number) => string
}) {
  const narrow = useNarrow()
  const data = rows.map((r) => ({ ...r, v: r.value ?? 0, text: r.value == null ? (r.note ?? 'not reported') : format(r.value),
    lines: [r.value == null ? (r.note ?? 'not reported') : format(r.value)] }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 22, right: narrow ? 64 : 96, bottom: 4, left: 0 }} barCategoryGap={6}>
        <CartesianGrid stroke="var(--grid)" horizontal={false} />
        <XAxis type="number" domain={domain} tick={AXIS} tickFormatter={format} />
        <YAxis type="category" dataKey="label" tick={{ ...AXIS, fill: 'var(--ink-2)' }} width={narrow ? 92 : 128} interval={0} />
        <Tooltip content={<Tip />} cursor={{ fill: 'var(--surface-2)' }} />
        <ReferenceLine x={limit} stroke="var(--danger)" strokeDasharray="5 4" label={{ value: limitLabel, position: 'top', fontSize: 12, fill: 'var(--danger)' }} />
        <Bar dataKey="v" radius={[0, 8, 8, 0]} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.label} fill={d.value == null ? 'transparent' : d.fill} />)}
          <LabelList dataKey="text" content={(props) => {
            // Always write the value just right of the bar's right end (for negative bars that is the zero line).
            const { x = 0, y = 0, width = 0, height = 0, value } = props as { x?: number; y?: number; width?: number; height?: number; value?: string }
            return <text x={Math.max(Number(x), Number(x) + Number(width)) + 6} y={Number(y) + Number(height) / 2} dominantBaseline="central"
              fontSize={12} fontWeight={600} fill="var(--ink)">{value}</text>
          }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function FitGap() {
  const rows = [...models].sort((a, b) => b.fit_gap - a.fit_gap)
    .map((m) => ({ label: `${shortName(m.name)} · ${m.owner_id}`, value: m.fit_gap, fill: memberColor(m.owner_id) }))
  return <HBars rows={rows} domain={[-0.005, 0.035]} limit={site.facts.fit_limit} limitLabel="out limit 0.03"
    format={(v) => (v > 0 ? '+' : '') + v.toFixed(4)} />
}

export function Brier() {
  const rows = [...models].sort((a, b) => (a.test_brier ?? 9) - (b.test_brier ?? 9))
    .map((m) => ({ label: `${shortName(m.name)} · ${m.owner_id}`, value: m.test_brier, fill: memberColor(m.owner_id) }))
  return <HBars rows={rows} domain={[0.17, 0.178]} limit={site.baseline.test_brier} limitLabel="rule 0.1733"
    format={(v) => v.toFixed(4)} />
}

/** Recharts version of the ROC dot plot (used on the Charts page for hover values). */
export function RocBars() {
  const narrow = useNarrow()
  const rule = site.baseline.cv_roc, tz = site.facts.tie_zone
  const rows = models.map((m) => ({ label: `${shortName(m.name)} · ${m.owner_id}`, value: m.cv_roc, fill: memberColor(m.owner_id) }))
  const data = rows.map((r) => ({ ...r, lines: [`CV ROC-AUC ${r.value.toFixed(4)}`] }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart layout="vertical" margin={{ top: 22, right: narrow ? 52 : 60, bottom: 4, left: 0 }}>
        <CartesianGrid stroke="var(--grid)" horizontal={false} />
        <ReferenceArea x1={rule - tz} x2={rule + tz} fill="var(--mint-bg)" fillOpacity={1} ifOverflow="visible"
          label={{ value: 'tie zone', position: 'insideTop', fontSize: 12, fill: 'var(--mint-fg)' }} />
        <ReferenceLine x={rule} stroke="var(--rule-model)" label={{ value: `rule ${rule}`, position: 'top', fontSize: 12, fill: 'var(--ink-2)' }} />
        <XAxis type="number" dataKey="value" domain={[0.766, 0.781]} tick={AXIS} tickFormatter={(v) => v.toFixed(3)} />
        <YAxis type="category" dataKey="label" tick={{ ...AXIS, fill: 'var(--ink-2)' }} width={narrow ? 92 : 128} interval={0} allowDuplicatedCategory={false} />
        <ZAxis range={[120, 120]} />
        <Tooltip content={<Tip />} cursor={false} />
        <Scatter data={data} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.label} fill={d.fill} />)}
          <LabelList dataKey="value" position="right" formatter={(v: number) => v.toFixed(4)} style={{ fontSize: 12, fill: 'var(--ink)', fontWeight: 600 }} />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

/** Key for the PR vs ROC chart: points overlap, so names and values are listed instead of drawn on the chart. */
export function PrVsRocKey() {
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-1 p-0 text-[12px] sm:grid-cols-2">
      {models.map((m) => (
        <li key={m.key} className="flex items-center gap-1.5 text-ink-2">
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: memberColor(m.owner_id) }} />
          <span className="truncate">{m.name} <span className="text-muted">{m.owner_id}</span></span>
          <span className="tnum ml-auto font-semibold text-ink">{m.cv_pr.toFixed(4)}</span>
        </li>
      ))}
    </ul>
  )
}
