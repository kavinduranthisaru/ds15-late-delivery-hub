import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Page } from '../components/Page'
import { Card, CardTitle, CodeBlock, Tag } from '../components/ui'
import { PAGES } from '../lib/nav'
import { memberColor, modelByKey, site } from '../lib/site'

export default function About() {
  return (
    <Page page={PAGES[6]}>
      {(tab) => {
        if (tab === 'limits') return (
          <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
            {site.data_limits.map((d, i) => (
              <Card as="li" key={d.title} className="p-5" tint={i >= 3 ? 'evidence' : 'none'}>
                <p className="flex items-center gap-2 text-[16px] font-bold text-ink">
                  <Icon name={i >= 3 ? 'circle-alert' : 'about'} className={i >= 3 ? 'text-warn' : 'text-muted'} />{d.title}
                </p>
                <p className="mt-2 text-[14px] text-ink-2">{d.body}</p>
              </Card>
            ))}
          </ul>
        )
        if (tab === 'cite') return (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <CardTitle sub="Plain-text citation for the report">How to cite this work</CardTitle>
              <CodeBlock code={site.cite} />
            </Card>
            <Card className="p-5">
              <CardTitle sub="Fingerprint checked by every notebook and by this app">Dataset</CardTitle>
              <p className="text-[15px] text-ink-2"><a href={site.dataset.url} target="_blank" rel="noreferrer" className="font-semibold text-ink underline underline-offset-2">{site.dataset.name}</a>, by {site.dataset.authors}. {site.dataset.source}, published {site.dataset.published}, DOI {site.dataset.doi}, licence {site.dataset.licence}.</p>
              <div className="mt-3"><CodeBlock code={site.dataset.cite} label="Copy dataset citation" /></div>
              <div className="mt-3"><CodeBlock code={`SHA-256 ${site.dataset.sha256}`} /></div>
              <p className="mt-3 text-[13px] text-muted">Sources for every number: {site.meta.sources.join(', ')}. Built {site.meta.built}.</p>
            </Card>
          </div>
        )
        return (
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-4">
            {site.members.map((m) => (
              <Card as="li" key={m.id} className="flex flex-col p-5">
                <span className="grid size-14 place-items-center rounded-full text-[22px] font-bold text-white" style={{ background: memberColor(m.id) }} aria-hidden="true">
                  {m.short[0]}
                </span>
                <h2 className="mt-3 text-[18px] font-bold text-ink">{m.name}</h2>
                <p className="tnum text-[14px] text-muted">{m.id}</p>
                <p className="label mt-4 mb-2">Models</p>
                <div className="flex flex-col gap-2">
                  {m.models.map((k) => {
                    const md = modelByKey(k)!
                    return (
                      <Link key={k} to={`/models/${k}`} className="flex h-11 items-center justify-between rounded-full bg-surface-2 pr-1.5 pl-4 text-[14px] font-medium text-ink no-underline hover:bg-surface-3">
                        {md.name}
                        <span className="flex items-center gap-1.5">{md.champion && <Tag tone="green">champion</Tag>}<Tag tone="grey">#{md.rank}</Tag></span>
                      </Link>
                    )
                  })}
                </div>
              </Card>
            ))}
          </ul>
        )
      }}
    </Page>
  )
}
