import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Page } from '../components/Page'
import { AlertCount, Card, CardTitle, CodeBlock, MetricChip, OwnerChip, PrimaryLink, RoundLink, Tag } from '../components/ui'
import { PAGES, type PageDef } from '../lib/nav'
import { f1, f4, modelByKey, models, signed, site } from '../lib/site'

const DETAIL: PageDef = {
  ...PAGES[1], path: '/models/detail',
  tabs: [{ key: 'overview', label: 'Overview', icon: 'overview' }, { key: 'settings', label: 'Settings', icon: 'sliders' },
         { key: 'notes', label: 'Strengths & weaknesses', icon: 'scale' }, { key: 'improve', label: 'How to improve', icon: 'predict' }],
}

function List({ items, icon, tone }: { items: string[]; icon: 'check' | 'alert' | 'arrow-right'; tone: string }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5 text-[15px] text-ink-2">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full" style={{ background: `var(--${tone}-bg)`, color: `var(--${tone}-fg)` }}>
            <Icon name={icon} size={14} strokeWidth={2.2} />
          </span>{t}
        </li>
      ))}
    </ul>
  )
}

export default function ModelDetail() {
  const { key } = useParams()
  const m = modelByKey(key)
  if (!m) {
    return (
      <div className="p-7">
        <h1 className="text-[28px] font-bold text-title">Model not found</h1>
        <p className="mt-2 text-muted">There is no model called “{key}”. <Link to="/models" className="underline">See all eight models</Link>.</p>
      </div>
    )
  }
  const i = models.indexOf(m)
  const prev = models[(i - 1 + models.length) % models.length], next = models[(i + 1) % models.length]
  const settingsCode = Object.entries(m.settings).map(([k, v]) => `${k.padEnd(18)} ${v}`).join('\n')
  const actions = (
    <>
      <RoundLink to={`/models/${prev.key}`} icon="arrow-left" label={`Previous model: ${prev.label}`} />
      <RoundLink to={`/models/${next.key}`} icon="arrow-right" label={`Next model: ${next.label}`} />
    </>
  )
  const title = (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Link to="/models" className="text-[15px] font-medium text-muted no-underline hover:text-ink" aria-label="Back to all models">Models /</Link>
      {m.name}
    </span>
  )
  return (
    <Page page={DETAIL} title={title} actions={actions}
      summary={<span className="inline-flex flex-wrap items-center gap-2"><OwnerChip name={m.owner_name} id={m.owner_id} /> · {m.family} · rank {m.rank} of 8</span>}>
      {(tab) => {
        if (tab === 'settings') return (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <CardTitle sub={`From ${m.source}`}>Final settings</CardTitle>
              <dl className="m-0 divide-y divide-[var(--line)]">
                {Object.entries(m.settings).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[minmax(0,150px)_minmax(0,1fr)] gap-3 py-2.5">
                    <dt className="text-[14px] text-muted">{k}</dt><dd className="m-0 text-[14px] font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card className="p-5">
              <CardTitle sub="Copy into the report or a notebook">Settings as text</CardTitle>
              <CodeBlock code={settingsCode} />
              {m.served && <p className="mt-3 text-[13px] text-muted">This model serves the Predict page. It was retrained by this app from these settings and reproduces every reported number exactly.</p>}
            </Card>
          </div>
        )
        if (tab === 'notes') return (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5"><CardTitle>Strengths</CardTitle><List items={m.strengths} icon="check" tone="mint" /></Card>
            <Card className="p-5" tint={m.status.kind === 'fail' ? 'fail' : m.status.kind === 'evidence' ? 'evidence' : 'none'}>
              <CardTitle>Weaknesses</CardTitle><List items={m.weaknesses} icon="alert" tone={m.status.kind === 'fail' ? 'pink' : 'peach'} />
            </Card>
          </div>
        )
        if (tab === 'improve') return (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5"><CardTitle>What to improve</CardTitle><List items={m.improve} icon="arrow-right" tone="blue" /></Card>
            <Card className="p-5">
              <CardTitle>Group fixes before submission</CardTitle>
              <List items={site.fixes} icon="arrow-right" tone="blue" />
            </Card>
          </div>
        )
        return (
          <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Card className="p-5" tint={m.champion ? 'champion' : 'none'}>
              <div className="flex flex-wrap gap-2">
                {m.champion && <Tag tone="green" icon="trophy">Champion</Tag>}
                <Tag tone="grey">Rank {m.rank}</Tag>
                <Tag tone="blue">{m.family}</Tag>
                {m.status.flags.map((f) => <Tag key={f.text} tone={f.level === 'fail' ? 'pink' : 'peach'} icon={f.level === 'fail' ? 'alert' : 'circle-alert'}>{f.text}</Tag>)}
              </div>
              <p className="tnum mt-4 text-[40px] leading-none font-bold text-ink">{f1(m.score)}<span className="text-[16px] font-medium text-muted"> / 100 scorecard</span></p>
              <div className="mt-4 flex flex-wrap gap-2">
                <MetricChip metric="ROC" label="CV ROC" value={f4(m.cv_roc)} />
                <MetricChip metric="ROC" label="Test ROC" value={f4(m.test_roc)} />
                <MetricChip metric="PR" label="CV PR" value={f4(m.cv_pr)} />
                <MetricChip metric="PR" label="Test PR" value={f4(m.test_pr)} />
                <MetricChip metric="Brier" label="Brier" value={f4(m.test_brier)} />
                <MetricChip metric="Gap" label="Fit gap" value={signed(m.fit_gap)} />
              </div>
              <p className="mt-4 text-[13px] text-muted">Simple rule for reference: CV ROC {f4(site.baseline.cv_roc)}, test ROC {f4(site.baseline.test_roc)}, Brier {f4(site.baseline.test_brier)}.</p>
              {m.served && <div className="mt-4"><PrimaryLink to="/predict">Try a prediction</PrimaryLink></div>}
            </Card>
            <div className="flex flex-col gap-4">
              <Card className="p-5"><CardTitle>How it works</CardTitle><p className="text-[15px] text-ink-2">{m.how}</p></Card>
              <Card className="p-5">
                <CardTitle>Why rank {m.rank}</CardTitle>
                <p className="text-[15px] text-ink-2">{m.main_reason}.</p>
                <p className="mt-2 text-[14px] text-ink-2">{site.rank_reasons.find((r) => r.startsWith(m.name) || (m.key === 'xgboost' && r.startsWith('AdaBoost and XGBoost')) || (m.key === 'adaboost' && r.startsWith('AdaBoost and XGBoost')))}</p>
                <div className="mt-3 flex items-center gap-3">
                  {m.status.flags.filter((f) => f.level === 'fail').length > 0 && <AlertCount level="fail" count={m.status.flags.filter((f) => f.level === 'fail').length} title="Ladder failures" />}
                  {m.status.flags.filter((f) => f.level === 'warn').length > 0 && <AlertCount level="warn" count={m.status.flags.filter((f) => f.level === 'warn').length} title="Evidence issues" />}
                  <span className="text-[13px] text-muted">Source: {m.source}</span>
                </div>
              </Card>
            </div>
          </div>
        )
      }}
    </Page>
  )
}
