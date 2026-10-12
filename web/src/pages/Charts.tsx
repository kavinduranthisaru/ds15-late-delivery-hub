import type { ReactNode } from 'react'
import { Page } from '../components/Page'
import { Brier, FitGap, PrVsRoc, PrVsRocKey, RocBars } from '../components/charts/Charts'
import { Card, CardTitle, FigureImage } from '../components/ui'
import { PAGES } from '../lib/nav'
import { site } from '../lib/site'

const FIGS = site.figures
const TABS: Record<string, { title: string; sub: string; chart: ReactNode; shows: string[] }> = {
  roc: { title: 'CV ROC-AUC with the tie zone', sub: 'Figure 2 · hover or tap a dot for its value', chart: <RocBars />,
    shows: [site.ranking_power_text[0], 'The tie zone is the rule plus or minus 0.005, bigger than normal fold-to-fold noise (0.001 to 0.003).'] },
  prroc: { title: 'PR-AUC vs ROC-AUC', sub: 'Figure 3 · stars = the simple rule · hover a dot for its values', chart: <div className="flex h-full flex-col gap-3"><div className="min-h-0 flex-1"><PrVsRoc /></div><PrVsRocKey /></div>,
    shows: ['AdaBoost and XGBoost score 0.8018 PR-AUC, but so does the rule when ties count against it. With ties broken fairly the rule scores 0.8562.',
      'Lower PR-AUC for AdaBoost and XGBoost is a tie effect, not worse ranking, so they are judged by ROC-AUC.'] },
  fit: { title: 'Fit gap: train minus unseen PR-AUC', sub: 'Figure 4 · the out limit is 0.03', chart: <FitGap />,
    shows: [site.fit_text[0] ?? '', site.fit_gap_note] },
  brier: { title: 'Test Brier score (lower is better)', sub: 'Figure 5 · Decision Tree and Random Forest did not report Brier', chart: <Brier />,
    shows: ['Five models land within 0.0003 of the rule\'s 0.1733. Naive Bayes is worse at 0.1763.', 'Decision Tree and Random Forest did not report a Brier score, so they have no bar.'] },
  scorecard: { title: 'Scorecard heatmap', sub: FIGS.scorecard_heatmap.caption,
    chart: <FigureImage {...FIGS.scorecard_heatmap} />, shows: site.rank_reasons },
  robust: { title: 'Does the ranking hold?', sub: FIGS.rank_robustness.caption,
    chart: <FigureImage {...FIGS.rank_robustness} />, shows: site.sensitivity_text },
}

export default function Charts() {
  return (
    <Page page={PAGES[3]}>
      {(tab) => {
        const t = TABS[tab]
        return (
          <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="flex min-h-[560px] flex-col p-5 lg:min-h-0">
              <CardTitle sub={t.sub}>{t.title}</CardTitle>
              <div className="min-h-0 flex-1">{t.chart}</div>
            </Card>
            <Card className="scroll-y p-5">
              <CardTitle>What it shows</CardTitle>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {t.shows.filter(Boolean).map((s) => <li key={s} className="border-l-2 border-[var(--green)] pl-3 text-[14px] text-ink-2">{s}</li>)}
              </ul>
            </Card>
          </div>
        )
      }}
    </Page>
  )
}
