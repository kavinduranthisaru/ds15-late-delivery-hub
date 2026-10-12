import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Page } from '../components/Page'
import { RocDot } from '../components/charts/RocDot'
import { Card, CardTitle, CountUp, OwnerChip, PrimaryLink, RoundLink, Stat, Tag } from '../components/ui'
import { PAGES } from '../lib/nav'
import { champion, int, modelByKey, models, site, type ModelKey } from '../lib/site'

function ChampionCard() {
  const c = champion
  return (
    <Card tint="champion" as="article" className="flex h-full flex-col p-5 md:p-6" aria-labelledby="champ">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Tag tone="green" icon="trophy">Champion · rank 1 of 8</Tag>
            <Tag tone="grey">{c.family}</Tag>
          </div>
          <h2 id="champ" className="mt-3 text-[26px] leading-8 font-bold text-ink md:text-[30px] md:leading-9">{c.name}</h2>
          <div className="mt-1"><OwnerChip name={c.owner_name} id={c.owner_id} /></div>
        </div>
        <div className="text-right">
          <p className="tnum text-[30px] leading-9 font-bold text-ink"><CountUp value={c.score} digits={1} /></p>
          <p className="text-[13px] text-muted">out of 100</p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--champ-line)] pt-4 sm:grid-cols-4">
        {[['CV ROC-AUC', c.cv_roc], ['Test ROC-AUC', c.test_roc], ['Test PR-AUC', c.test_pr], ['Test Brier', c.test_brier!]].map(([k, v]) => (
          <div key={k as string}><dt className="text-[13px] text-muted">{k}</dt>
            <dd className="tnum m-0 text-[22px] font-bold text-ink"><CountUp value={v as number} /></dd></div>
        ))}
      </dl>
      <p className="mt-4 flex flex-wrap gap-2">
        <Tag tone="grey">C = 0.1</Tag><Tag tone="grey">L2</Tag><Tag tone="grey">20 columns</Tag><Tag tone="mint">cut-off 0.6040</Tag>
      </p>
      <p className="mt-3 text-[14px] text-ink-2 md:hidden">{c.main_reason}. It matches the best ranking numbers while being the simplest to explain.</p>
      <Drivers />
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
        <PrimaryLink to="/predict">Try a prediction</PrimaryLink>
        <RoundLink to={`/models/${c.key}`} label="Open the Logistic Regression page" />
      </div>
    </Card>
  )
}

function Drivers() {
  const d = champion.drivers ?? []
  const max = Math.max(...d.map((x) => Math.abs(x.coef)))
  return (
    <div className="mt-4 hidden rounded-2xl bg-surface/70 p-4 md:block">
      <p className="label mb-2">What drives its score · simple, readable, clean fit</p>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {d.map((x) => (
          <li key={x.feature} className="grid grid-cols-[160px_minmax(0,1fr)_72px] items-center gap-3 text-[13px]">
            <span className="truncate text-ink-2">{x.feature}</span>
            <span className="relative h-2.5 rounded-full bg-surface-2" aria-hidden="true">
              <span className="absolute inset-y-0 rounded-full" style={{ width: `${(Math.abs(x.coef) / max) * 50}%`,
                left: x.coef >= 0 ? '50%' : `${50 - (Math.abs(x.coef) / max) * 50}%`, background: x.coef >= 0 ? 'var(--danger)' : 'var(--ok)' }} />
              <span className="absolute inset-y-[-3px] left-1/2 w-px bg-line-2" />
            </span>
            <span className="tnum text-right font-semibold text-ink">{x.coef > 0 ? '+' : '−'}{Math.abs(x.coef).toFixed(4)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12px] text-muted">Red raises the late risk, green lowers it. Region, day and hour weights are close to zero.</p>
    </div>
  )
}

function RestOfRanking() {
  return (
    <Card className="flex min-h-0 flex-col p-4">
      <div className="mb-2 flex items-center justify-between"><p className="text-[15px] font-semibold text-ink">The other seven</p>
        <Link to="/models?tab=table" className="text-[13px] font-medium text-muted underline-offset-2 hover:underline">Full ranking</Link></div>
      <ol className="scroll-y m-0 flex min-h-0 list-none flex-col p-0">
        {models.filter((m) => !m.champion).map((m) => (
          <li key={m.key}>
            <Link to={`/models/${m.key}`} className="grid min-h-11 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2 no-underline hover:bg-surface-2">
              <span className="tnum text-[13px] font-bold text-muted">#{m.rank}</span>
              <span className="min-w-0"><span className="block truncate text-[14px] font-semibold text-ink">{m.name}</span>
                <span className="block truncate text-[12px] text-muted">{m.owner_short} {m.owner_id}</span></span>
              <span className="tnum text-[14px] font-bold text-ink">{m.score.toFixed(1)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function Summary() {
  const rule = site.baseline
  return (
    <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
      <div className="lg:row-span-2"><ChampionCard /></div>
      <Card tint="evidence" className="p-5" role="note" aria-labelledby="readfirst">
        <p className="flex items-center gap-2"><Icon name="circle-alert" className="text-warn" />
          <span id="readfirst" className="text-[16px] font-semibold text-ink">Read this first</span></p>
        <p className="mt-2 text-[15px] text-ink-2">
          Places 1 to 5 are a <strong className="text-ink">tie-break order</strong>, not a real performance gap. All eight models score almost the
          same, and <strong className="text-ink">no model beats the simple shipping-mode rule</strong> (CV ROC-AUC <span className="tnum font-semibold">{rule.cv_roc.toFixed(4)}</span>).
        </p>
      </Card>
      <div className="flex min-h-0 flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3.5"><Stat label="Orders" value={int(site.facts.orders_total)} /></Card>
          <Card className="p-3.5"><Stat label="Late rate" value={site.facts.late_rate.toFixed(3)} /></Card>
          <Card className="p-3.5"><Stat label="Ceiling" value={`≈${site.facts.ceiling_roc}`} sub="ROC-AUC" /></Card>
        </div>
        <RestOfRanking />
      </div>
    </div>
  )
}

function ProblemAndData() {
  const { train, validation, test } = site.facts.splits
  const total = train + validation + test
  const parts = [
    { name: 'Train', n: train, dates: site.facts.split_dates.train, use: 'Learning and 5-fold time-ordered CV', color: 'var(--ink-2)' },
    { name: 'Validation', n: validation, dates: site.facts.split_dates.validation, use: 'Calibration and cut-off only', color: 'var(--m-madushani)' },
    { name: 'Test', n: test, dates: site.facts.split_dates.test, use: 'Scored once, for reporting', color: 'var(--m-maheepala)' },
  ]
  return (
    <div className="grid gap-4 lg:h-full lg:grid-cols-2">
      <Card className="p-5">
        <CardTitle sub="Logistics and supply chain · decision lens: late-delivery risk">The problem</CardTitle>
        <p className="text-[15px] text-ink-2">A logistics company wants to improve delivery reliability and reduce delays. At the moment an order is
          confirmed, each model gives a risk score between 0 and 1: the chance that the shipment arrives late
          (<code className="rounded bg-surface-2 px-1 text-[13px]">Late_delivery_risk = 1</code>). A cut-off turns the score into a yes or no answer.</p>
        <p className="mt-3 text-[15px] text-ink-2">Only fields known at order time are used: shipping mode, market and region, customer segment, payment
          type, the basket, and the date and time. The models never see the real shipping days or the delivery status, because those would leak the answer.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Tag tone="blue">20 input features</Tag><Tag tone="blue">54 model columns</Tag><Tag tone="mint">target: late = 1</Tag>
        </div>
      </Card>
      <Card className="p-5">
        <CardTitle sub={<>
          <a href={site.dataset.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">DataCo Smart Supply Chain</a>, cancelled and
          suspected-fraud orders removed</>}>The data</CardTitle>
        <div className="flex h-3 gap-1 overflow-hidden rounded-full" aria-hidden="true">
          {parts.map((p) => <span key={p.name} style={{ flex: p.n / total, background: p.color }} />)}
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {parts.map((p) => (
            <li key={p.name} className="rounded-2xl bg-surface-2 p-3">
              <span className="flex items-center gap-1.5 text-[14px] font-semibold text-ink"><span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: p.color }} />{p.name}</span>
              <span className="tnum block text-[20px] font-bold text-ink">{int(p.n)}</span>
              <span className="tnum block text-[12px] text-muted">{p.dates}</span>
              <span className="block text-[13px] text-ink-2">{p.use}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-muted">Split by date with 7-day gaps: models always learn from older orders and are tested on newer ones.
          About 57 in 100 orders are late, so accuracy is never used to rank.</p>
      </Card>
    </div>
  )
}

const NOTES: { key: ModelKey; text: (m: NonNullable<ReturnType<typeof modelByKey>>) => React.ReactNode }[] = [
  { key: 'knn', text: (m) => <>The gap is tiny: CV ROC-AUC runs only from 0.7693 to 0.7756. {m.name} has the highest dot
    (ROC <b className="tnum text-ink">{m.cv_roc.toFixed(4)}</b>), but its lead of 0.0008 over the rule is noise.</> },
  { key: 'naive_bayes', text: (m) => <>Only {m.name} falls outside the tie zone: ROC <b className="tnum text-ink">{m.cv_roc.toFixed(4)}</b> is
    0.0055 below the rule, so it fails step 2 of the decision ladder.</> },
  { key: 'logistic_regression', text: (m) => <>{m.name} sits inside the band like the others (ROC <b className="tnum text-ink">{m.cv_roc.toFixed(4)}</b>)
    and ranks first on the tie-breakers: fit health, honest probabilities, stability and simplicity.</> },
]

function HeadlineResult() {
  const [hover, setHover] = useState<ModelKey | null>(null)
  const [picked, setPicked] = useState<ModelKey>('knn')
  const active = hover ?? picked
  return (
    <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Card className="p-5">
        <CardTitle sub="Tap a note or a row to highlight a model">Eight models, one narrow band</CardTitle>
        <RocDot highlight={active} onHover={setHover} />
      </Card>
      <div className="flex flex-col gap-3">
        <Card className="p-4"><p className="text-[14px] text-ink-2">{site.headline}</p></Card>
        {NOTES.map(({ key, text }) => {
          const m = modelByKey(key)!
          const on = active === key
          return (
            <button key={key} type="button" onClick={() => setPicked(key)} aria-pressed={on}
              className={`rounded-[22px] border p-4 text-left text-[14px] text-ink-2 transition-colors ${on ? 'border-[var(--champ-line)] bg-[var(--champ-card)]' : 'border-line bg-surface hover:border-line-2'}`}>
              <span className="mb-1 block"><OwnerChip name={m.name} id={m.owner_id} /></span>
              {text(m)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Overview() {
  return (
    <Page page={PAGES[0]} title="Late delivery risk"
      summary="Eight models predict whether a DataCo order will arrive late. Here is how they compare, and the best one to try.">
      {(tab) => (tab === 'data' ? <ProblemAndData /> : tab === 'result' ? <HeadlineResult /> : <Summary />)}
    </Page>
  )
}
