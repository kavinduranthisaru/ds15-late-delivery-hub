import { Icon } from '../components/Icon'
import { Page } from '../components/Page'
import { Card, CardTitle, CodeBlock, OwnerChip, Tag } from '../components/ui'
import { PAGES } from '../lib/nav'
import { modelByKey, site } from '../lib/site'

function Ladder() {
  const tab = site.method.find((t) => t.key === 'ladder')!
  return (
    <div className="flex h-full flex-col gap-4">
      <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-2 xl:grid-cols-4">
        {site.ladder.map((s) => (
          <Card as="li" key={s.step} className="flex flex-col p-4" tint={s.out.length ? 'fail' : 'none'}>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-primary text-[15px] font-bold text-on-primary">{s.step}</span>
              <h2 className="text-[17px] font-bold text-ink">{s.name}</h2>
            </div>
            <p className="label mt-3">Why it exists</p>
            <p className="mt-1 text-[13px] text-ink-2">{s.why}</p>
            <p className="label mt-3">How we applied it</p>
            <p className="mt-1 text-[13px] text-ink-2">{s.how}</p>
            <p className="label mt-3">What it showed</p>
            <p className="mt-1 text-[13px] font-medium text-ink">{s.showed}</p>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
              {s.out.length ? s.out.map((k) => { const m = modelByKey(k)!; return (
                <span key={k} className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[13px] font-medium" style={{ background: 'var(--pink-bg)', color: 'var(--pink-fg)' }}>
                  <Icon name="alert" size={14} />Out: {m.name} <span className="tnum">{m.owner_id}</span>
                </span>) })
                : <Tag tone="mint" icon="check">Nobody removed</Tag>}
            </div>
          </Card>
        ))}
      </ol>
      <details className="rounded-2xl bg-surface-2 px-4 py-2 text-[14px]"><summary className="flex min-h-11 cursor-pointer items-center font-medium text-ink">The ladder as four rules</summary>
        <div className="pb-2"><CodeBlock code={tab.formula} /></div></details>
    </div>
  )
}

export default function Method() {
  return (
    <Page page={PAGES[4]}>
      {(key) => {
        if (key === 'ladder') return <Ladder />
        const t = site.method.find((x) => x.key === key)!
        return (
          <div className="grid gap-4 lg:h-full lg:grid-cols-2">
            <Card className="scroll-y p-5">
              <p className="mb-2 flex items-center gap-2"><Tag tone="blue" icon="book">Theory</Tag></p>
              <CardTitle sub={t.why_title ? `From the comparison summary: ${t.why_title}` : undefined}>Why it exists</CardTitle>
              <div className="flex flex-col gap-2.5">{(t.why ?? []).map((p) => <p key={p} className="text-[15px] text-ink-2">{p}</p>)}</div>
              <div className="mt-4"><CodeBlock code={t.formula} /></div>
            </Card>
            <Card className="scroll-y p-5" tint="champion">
              <p className="mb-2 flex items-center gap-2"><Tag tone="green" icon="check">Result</Tag></p>
              <CardTitle>What it showed</CardTitle>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {(t.showed ?? []).map((p) => {
                  const m = site.models.find((x) => p.startsWith(x.name) || (p.startsWith('AdaBoost and XGBoost') && x.key === 'adaboost'))
                  return (
                    <li key={p} className="flex gap-2.5 text-[14px] text-ink-2">
                      <Icon name="arrow-right" size={16} className="mt-0.5 text-muted" />
                      <span>{p}{m && key === 'scorecard' && <span className="mt-1 block"><OwnerChip name={m.owner_short} id={m.owner_id} /></span>}</span>
                    </li>
                  )
                })}
              </ul>
            </Card>
          </div>
        )
      }}
    </Page>
  )
}
