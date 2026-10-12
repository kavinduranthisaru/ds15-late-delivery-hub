import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Page } from '../components/Page'
import { AlertCount, Card, Empty, OwnerChip, RoundLink, Tag, type Tint } from '../components/ui'
import { PAGES } from '../lib/nav'
import { f1, f4, models, site, type Model } from '../lib/site'

const TINT: Record<Model['status']['kind'], Tint> = { champion: 'champion', ok: 'none', evidence: 'evidence', fail: 'fail' }
const FAMILY_TONE = (m: Model) => (m.status.kind === 'fail' ? 'pink' : m.status.kind === 'evidence' ? 'peach' : 'mint') as 'pink' | 'peach' | 'mint'

export function ModelCard({ m }: { m: Model }) {
  const fails = m.status.flags.filter((f) => f.level === 'fail')
  const warns = m.status.flags.filter((f) => f.level === 'warn')
  return (
    <Card as="li" tint={TINT[m.status.kind]} className="flex min-h-0 flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[18px] leading-6 font-bold text-ink">{m.name}</h2>
          <p className="mt-1 text-[13px] text-muted">Owner: <OwnerChip name={m.owner_short} id={m.owner_id} /></p>
        </div>
        <RoundLink to={`/models/${m.key}`} label={`Open ${m.label}`} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag tone={FAMILY_TONE(m)}>{m.family}</Tag>
        <Tag tone="grey">#{m.rank}</Tag>
        {m.served && <Tag tone="green" icon="predict">served</Tag>}
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] text-ink-2">{m.main_reason}</p>
      <p className="tnum mt-2 text-[13px] text-muted">CV ROC <b className="text-ink">{f4(m.cv_roc)}</b> · Test ROC <b className="text-ink">{f4(m.test_roc)}</b></p>
      <div className="mt-auto flex items-center gap-3 pt-3">
        <span className="tnum inline-flex items-center gap-1.5 text-[19px] font-bold text-ink">
          <Icon name="star" size={20} /><span className="sr-only">Score</span>{f1(m.score)}<span className="text-[13px] font-medium text-muted">/100</span>
        </span>
        <span className="ml-auto flex items-center gap-3">
          {fails.length > 0 && <AlertCount level="fail" count={fails.length} title={fails.map((f) => f.text).join('; ')} />}
          {warns.length > 0 && <AlertCount level="warn" count={warns.length} title={warns.map((f) => f.text).join('; ')} />}
        </span>
      </div>
    </Card>
  )
}

type SortKey = 'rank_order' | 'name' | 'score' | 'cv_roc' | 'cv_pr' | 'test_roc' | 'test_pr' | 'test_brier'
const COLS: { key: SortKey; label: string; num?: boolean }[] = [
  { key: 'rank_order', label: 'Rank' }, { key: 'name', label: 'Model' }, { key: 'score', label: 'Score', num: true },
  { key: 'cv_roc', label: 'CV ROC', num: true }, { key: 'cv_pr', label: 'CV PR', num: true }, { key: 'test_roc', label: 'Test ROC', num: true },
  { key: 'test_pr', label: 'Test PR', num: true }, { key: 'test_brier', label: 'Test Brier', num: true },
]

function RankingTable({ rows }: { rows: Model[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'rank_order', dir: 1 })
  const navigate = useNavigate()
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const va = a[sort.key], vb = b[sort.key]
    if (va == null) return 1
    if (vb == null) return -1
    return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir
  }), [rows, sort])
  const click = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'name' || key === 'rank_order' || key === 'test_brier' ? 1 : -1 }))
  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="scroll-y min-h-0 flex-1 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-[14px]">
          <caption className="sr-only">Final ranking of the eight models. Click a column to sort, a row to open the model.</caption>
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-line">
              {COLS.map((c) => (
                <th key={c.key} scope="col" aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
                  className={`px-4 py-2 font-semibold text-muted ${c.num ? 'text-right' : 'text-left'}`}>
                  <button type="button" onClick={() => click(c.key)} className={`inline-flex h-9 items-center gap-1 rounded-full px-2 hover:bg-surface-2 ${sort.key === c.key ? 'text-ink' : ''}`}>
                    {c.label}<Icon name={sort.key === c.key && sort.dir === -1 ? 'chevron-down' : 'chevron-up'} size={14} className={sort.key === c.key ? '' : 'opacity-30'} />
                  </button>
                </th>
              ))}
              <th scope="col" className="px-4 py-2 text-left font-semibold text-muted">Main reason</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr key={m.key} onClick={() => navigate(`/models/${m.key}`)} className={`cursor-pointer border-b border-line last:border-0 hover:bg-surface-2 ${m.champion ? 'bg-[var(--champ-card)]' : ''}`}>
                <td className="tnum px-4 py-3 font-bold text-ink">{m.rank}</td>
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  <a href={`/models/${m.key}`} onClick={(e) => { e.preventDefault(); navigate(`/models/${m.key}`) }} className="font-semibold text-ink no-underline hover:underline">{m.name}</a>
                  {m.champion && <span className="ml-2"><Tag tone="green">champion</Tag></span>}
                  <span className="block"><OwnerChip name={m.owner_short} id={m.owner_id} /></span>
                </th>
                <td className="tnum px-4 py-3 text-right font-semibold">{f1(m.score)}</td>
                <td className="tnum px-4 py-3 text-right">{f4(m.cv_roc)}</td>
                <td className="tnum px-4 py-3 text-right">{f4(m.cv_pr)}</td>
                <td className="tnum px-4 py-3 text-right">{f4(m.test_roc)}</td>
                <td className="tnum px-4 py-3 text-right">{f4(m.test_pr)}</td>
                <td className={`tnum px-4 py-3 text-right ${m.test_brier == null ? 'text-muted' : ''}`}>{f4(m.test_brier)}</td>
                <td className="max-w-[260px] px-4 py-3 text-ink-2">{m.main_reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="shrink-0 border-t border-line px-4 py-2.5 text-[12px] text-muted">
        Simple rule: CV ROC {f4(site.baseline.cv_roc)} · Test ROC {f4(site.baseline.test_roc)} · Test Brier {f4(site.baseline.test_brier)}.
        Ranked by the scorecard, never by accuracy or F1 at 0.5. Places 1 to 5 are a tie-break order.
      </p>
    </Card>
  )
}

export default function Models() {
  const [q, setQ] = useState('')
  const [owner, setOwner] = useState('all')
  const rows = models.filter((m) => (owner === 'all' || m.owner_id === owner) &&
    (!q || `${m.label} ${m.family} ${m.main_reason}`.toLowerCase().includes(q.toLowerCase())))
  const toolbar = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <label className="flex h-11 w-full min-w-0 items-center gap-2 rounded-full bg-surface px-4 shadow-[var(--shadow)] sm:w-64">
        <Icon name="search" size={18} className="text-muted" />
        <span className="sr-only">Search models</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted" />
      </label>
      <label className="flex h-11 w-full items-center gap-1 rounded-full bg-surface pr-1 pl-4 shadow-[var(--shadow)] sm:w-auto">
        <span className="text-[14px] text-muted">Owner</span>
        <select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Filter by owner"
          className="h-9 min-w-0 flex-1 rounded-full bg-transparent px-2 text-[14px] font-medium text-ink outline-none">
          <option value="all">All</option>
          {site.members.map((m) => <option key={m.id} value={m.id}>{m.short} {m.id}</option>)}
        </select>
        <span className="grid size-9 place-items-center rounded-full bg-surface-2" aria-hidden="true"><Icon name="filter" size={16} /></span>
      </label>
    </div>
  )
  return (
    <Page page={PAGES[1]} toolbar={toolbar}>
      {(tab) => rows.length === 0 ? <Empty>No model matches this search. Clear the search or pick another owner.</Empty>
        : tab === 'table' ? <RankingTable rows={rows} />
          : (
            <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-4" aria-label="Models">
              {rows.map((m) => <ModelCard key={m.key} m={m} />)}
            </ul>
          )}
    </Page>
  )
}

