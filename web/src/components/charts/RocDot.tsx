import { Link } from 'react-router-dom'
import { memberColor, models, site, type ModelKey } from '../../lib/site'

const LO = 0.766, HI = 0.781
const x = (v: number) => ((v - LO) / (HI - LO)) * 100

/**
 * CV ROC-AUC per model as a dot plot with the tie zone (rule ± 0.005) shaded. One row per model so every label
 * stays readable at 360 px. `highlight` marks one model (used by the linked notes on Overview).
 */
export function RocDot({ highlight, onHover }: { highlight?: ModelKey | null; onHover?: (k: ModelKey | null) => void }) {
  const rule = site.baseline.cv_roc, tz = site.facts.tie_zone
  const ticks = [0.768, 0.772, 0.776, 0.78]
  return (
    <figure className="m-0" aria-labelledby="roc-dot-caption">
      <div className="grid grid-cols-[minmax(0,130px)_minmax(0,1fr)] gap-x-3 md:grid-cols-[minmax(0,210px)_minmax(0,1fr)]">
        <div />
        <div className="relative mb-1 h-5 text-[12px] text-muted">
          <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${x(rule)}%` }}>rule {rule.toFixed(4)} ± 0.005</span>
        </div>
        {models.map((m) => {
          const dim = highlight && highlight !== m.key
          const outside = m.cv_roc < rule - tz
          return (
            <Link key={m.key} to={`/models/${m.key}`} onMouseEnter={() => onHover?.(m.key)} onMouseLeave={() => onHover?.(null)}
              onFocus={() => onHover?.(m.key)} onBlur={() => onHover?.(null)}
              aria-label={`${m.label}: CV ROC-AUC ${m.cv_roc.toFixed(4)}${outside ? ', outside the tie zone' : ', inside the tie zone'}`}
              className={`col-span-2 grid min-h-10 grid-cols-subgrid items-center rounded-xl no-underline transition-colors ${highlight === m.key ? 'bg-green/40' : 'hover:bg-surface-2'}`}>
              <span className="flex min-w-0 flex-col py-0.5 pl-2 leading-tight">
                <span className="truncate text-[13px] font-semibold text-ink">{m.name}</span>
                <span className="tnum truncate text-[11px] text-muted">{m.owner_short} {m.owner_id}</span>
              </span>
              <span className="relative h-full">
                <span aria-hidden="true" className="absolute inset-y-0 bg-[var(--mint-bg)]" style={{ left: `${x(rule - tz)}%`, width: `${x(rule + tz) - x(rule - tz)}%` }} />
                <span aria-hidden="true" className="absolute inset-y-0 w-px bg-[var(--rule-model)]" style={{ left: `${x(rule)}%` }} />
                <span className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-1.5 transition-opacity ${dim ? 'opacity-40' : ''}`} style={{ left: `calc(${x(m.cv_roc)}% - 6px)` }}>
                  <span aria-hidden="true" className={`block size-3 rounded-full ${outside ? 'border-2 bg-surface' : ''}`}
                    style={outside ? { borderColor: memberColor(m.owner_id) } : { background: memberColor(m.owner_id) }} />
                  <span className="tnum rounded bg-surface/80 px-0.5 text-[12px] font-semibold text-ink-2">{m.cv_roc.toFixed(4)}{outside && ' · outside'}</span>
                </span>
              </span>
            </Link>
          )
        })}
        <div />
        <div className="relative mt-1 h-5 border-t border-line text-[11px] text-muted">
          {ticks.map((t) => <span key={t} className="tnum absolute -translate-x-1/2 pt-0.5" style={{ left: `${x(t)}%` }}>{t.toFixed(3)}</span>)}
        </div>
      </div>
      <figcaption id="roc-dot-caption" className="mt-3 text-[13px] text-muted">
        Cross-validated ROC-AUC. Green band = tie zone around the simple rule (vertical line). Only Naive Bayes sits outside it (hollow dot).
      </figcaption>
    </figure>
  )
}
