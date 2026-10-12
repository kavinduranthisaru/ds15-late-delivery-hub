import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { TabDef } from '../lib/nav'
import { memberColor } from '../lib/site'
import { Icon, type IconName } from './Icon'

/* ---- Card: white, 22 px radius, 1 px line, soft shadow. Tints for champion / fail / caution. ---- */
export type Tint = 'none' | 'champion' | 'fail' | 'evidence'
const TINT: Record<Tint, React.CSSProperties> = {
  none: {},
  champion: { background: 'var(--champ-card)', borderColor: 'var(--champ-line)' },
  fail: { background: 'var(--pink-card)', borderColor: 'var(--pink-line)' },
  evidence: { background: 'var(--peach-card)', borderColor: 'var(--peach-line)' },
}
export function Card({ children, className = '', tint = 'none', as: As = 'section', ...rest }:
  { children: ReactNode; className?: string; tint?: Tint; as?: 'section' | 'article' | 'div' | 'li' } & Record<string, unknown>) {
  return (
    <As className={`rounded-[22px] border border-line bg-surface shadow-[var(--shadow)] ${className}`} style={TINT[tint]} {...rest}>
      {children}
    </As>
  )
}

export function CardTitle({ children, id, sub }: { children: ReactNode; id?: string; sub?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 id={id} className="text-[17px] leading-[22px] font-semibold text-ink">{children}</h2>
      {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
    </div>
  )
}

/* ---- Tags (pills) --------------------------------------------------------------------------------- */
export type TagTone = 'mint' | 'pink' | 'peach' | 'blue' | 'grey' | 'green'
const TONE: Record<TagTone, React.CSSProperties> = {
  mint: { background: 'var(--mint-bg)', color: 'var(--mint-fg)' },
  pink: { background: 'var(--pink-bg)', color: 'var(--pink-fg)' },
  peach: { background: 'var(--peach-bg)', color: 'var(--peach-fg)' },
  blue: { background: 'var(--blue-bg)', color: 'var(--blue-fg)' },
  grey: { background: 'var(--grey-bg)', color: 'var(--grey-fg)' },
  green: { background: 'var(--green)', color: 'var(--on-green)' },
}
export function Tag({ children, tone = 'grey', icon }: { children: ReactNode; tone?: TagTone; icon?: IconName }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-full px-3 text-[13px] font-medium whitespace-nowrap" style={TONE[tone]}>
      {icon && <Icon name={icon} size={14} />}{children}
    </span>
  )
}

/* ---- Round icon buttons and links ------------------------------------------------------------------ */
export function RoundLink({ to, label, icon = 'arrow-right' }: { to: string; label: string; icon?: IconName }) {
  return (
    <Link to={to} aria-label={label}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-ink transition-colors hover:bg-green hover:text-on-green">
      <Icon name={icon} size={19} />
    </Link>
  )
}
export function RoundButton({ onClick, label, icon, pressed }: { onClick: () => void; label: string; icon: IconName; pressed?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={pressed}
      className={`grid size-11 shrink-0 place-items-center rounded-full transition-colors ${pressed ? 'bg-green text-on-green' : 'bg-surface-2 text-ink hover:bg-surface-3'}`}>
      <Icon name={icon} size={19} />
    </button>
  )
}

export function PrimaryLink({ to, children, icon = 'arrow-right' }: { to: string; children: ReactNode; icon?: IconName }) {
  return (
    <Link to={to} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-on-primary no-underline hover:opacity-90">
      {children} <Icon name={icon} size={18} />
    </Link>
  )
}
export function PrimaryButton({ children, icon, type = 'button', onClick, disabled }:
  { children: ReactNode; icon?: IconName; type?: 'button' | 'submit'; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-50">
      {icon && <Icon name={icon} size={18} />}{children}
    </button>
  )
}

/* ---- Segmented tabs (WAI-ARIA tabs pattern): icon + label pills, the active one green ---------------- */
export function SegTabs({ tabs, current, onChange, idBase, label }:
  { tabs: TabDef[]; current: string; onChange: (k: string) => void; idBase: string; label: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = tabs.length
    const next = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (next < 0) return
    e.preventDefault()
    onChange(tabs[next].key)
    refs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className="scroll-x -mx-4 flex gap-2 px-4 md:mx-0 md:px-0">
      {tabs.map((t, i) => {
        const active = t.key === current
        return (
          <button key={t.key} ref={(el) => { refs.current[i] = el }} type="button" role="tab" id={`${idBase}-tab-${t.key}`}
            aria-selected={active} aria-controls={`${idBase}-panel`} tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.key)} onKeyDown={(e) => onKey(e, i)}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] whitespace-nowrap transition-colors ${
              active ? 'bg-green font-semibold text-on-green' : 'font-medium text-ink-2 hover:bg-surface hover:text-ink'}`}>
            {t.icon && <Icon name={t.icon} size={18} />}{t.label}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ idBase, current, children, className = '' }: { idBase: string; current: string; children: ReactNode; className?: string }) {
  return (
    <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${current}`} tabIndex={0}
      key={current} className={`tab-enter outline-none ${className}`}>
      {children}
    </div>
  )
}

/* ---- People ----------------------------------------------------------------------------------------- */
export function OwnerChip({ name, id, compact }: { name: string; id: string; compact?: boolean }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[14px] text-ink-2">
      <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: memberColor(id) }} />
      <span className="truncate">{compact ? name.split(' ')[0] : name}</span>
      <span className="tnum shrink-0 text-[13px] text-muted">{id}</span>
    </span>
  )
}

/* ---- Alert counts like the reference (red triangle, orange circle) -------------------------------- */
export function AlertCount({ level, count, title }: { level: 'fail' | 'warn'; count: number; title: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[15px] font-bold" title={title} role="img" aria-label={`${count} ${level === 'fail' ? 'ladder failure' : 'evidence issue'}${count > 1 ? 's' : ''}: ${title}`}>
      <Icon name={level === 'fail' ? 'alert' : 'circle-alert'} size={20} className={level === 'fail' ? 'text-danger' : 'text-warn'} />
      <span aria-hidden="true" className="text-ink">{count}</span>
    </span>
  )
}

/* ---- Metric chips that explain themselves -------------------------------------------------------- */
export const METRIC_DEFS: Record<string, string> = {
  ROC: 'ROC-AUC: the chance that a random late order gets a higher risk score than a random on-time order. 0.5 is a coin flip, 1.0 is perfect.',
  PR: 'PR-AUC: how precision holds up as recall rises, for the late class. No skill = the late rate (0.574). Tied scores pull it down.',
  Brier: 'Brier score: the average squared gap between the predicted probability and what happened. 0 is perfect, lower is better. No skill = 0.2445.',
  Score: 'Scorecard total out of 100: ranking power 25, fit health 15, probability honesty 15, fold stability 10, simplicity and speed 20, evidence quality 15.',
  Gap: 'Fit gap: train PR-AUC minus unseen PR-AUC. Near zero is healthy. Above 0.03 counts as overfitting.',
}
export function MetricChip({ metric, value, label }: { metric: keyof typeof METRIC_DEFS; value: string; label?: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <span ref={ref} className="relative inline-block">
      <button type="button" aria-expanded={open} aria-describedby={open ? id : undefined} onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        className="tnum inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[14px] font-semibold text-ink hover:bg-surface-3">
        <span className="font-medium text-muted">{label ?? metric}</span>{value}
      </button>
      {open && (
        <span role="tooltip" id={id}
          className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-[260px] rounded-2xl border border-line bg-surface p-3 text-[13px] leading-snug font-normal text-ink-2 shadow-[var(--shadow-lg)]">
          {METRIC_DEFS[metric]}
        </span>
      )}
    </span>
  )
}

/* ---- Big stat --------------------------------------------------------------------------------------- */
export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="tnum text-[22px] leading-7 font-bold text-ink">{value}</p>
      {sub && <p className="text-[12px] text-muted">{sub}</p>}
    </div>
  )
}

/* ---- Code block with a copy button -------------------------------------------------------------------- */
export function CodeBlock({ code, label = 'Copy' }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ }
  }
  return (
    <div className="relative rounded-2xl bg-surface-2">
      <pre className="scroll-x m-0 p-4 pr-24 text-[13px] leading-relaxed text-ink"><code className="font-mono">{code}</code></pre>
      <button type="button" onClick={copy} aria-label={`${label}: ${copied ? 'copied' : 'copy to clipboard'}`}
        className="absolute top-2 right-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-[13px] font-medium text-ink shadow-[var(--shadow)]">
        <Icon name={copied ? 'check' : 'copy'} size={15} />{copied ? 'Copied' : 'Copy'}
      </button>
      <span role="status" className="sr-only">{copied ? 'Copied to clipboard' : ''}</span>
    </div>
  )
}

/* ---- States ------------------------------------------------------------------------------------------- */
export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />
}
export function ErrorCard({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <Card tint="fail" className="p-5" role="alert">
      <p className="flex items-center gap-2 text-[16px] font-semibold text-ink"><Icon name="alert" className="text-danger" />{title}</p>
      <p className="mt-1 text-[14px] text-ink-2">{message}</p>
      {onRetry && <div className="mt-3"><PrimaryButton icon="refresh" onClick={onRetry}>Try again</PrimaryButton></div>}
    </Card>
  )
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line-2 p-6 text-center text-[14px] text-muted">{children}</p>
}

/* ---- Count-up for the champion's numbers (lands exactly on the value; off with reduced motion) ------ */
export function CountUp({ value, digits = 4, ms = 600 }: { value: number; digits?: number; ms?: number }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [v, setV] = useState(reduce ? value : value * 0.9)
  useEffect(() => {
    if (reduce) return
    let raf = 0
    const t0 = performance.now(), from = value * 0.9
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      setV(from + (value - from) * (1 - (1 - k) ** 3))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const done = setTimeout(() => setV(value), ms + 50)
    return () => { cancelAnimationFrame(raf); clearTimeout(done) }
  }, [value, ms, reduce])
  return <span><span className="sr-only">{value.toFixed(digits)}</span><span aria-hidden="true">{v.toFixed(digits)}</span></span>
}

/* ---- Figure image from the docx ------------------------------------------------------------------------ */
export function FigureImage({ src, alt, caption, source }: { src: string; alt: string; caption: string; source: string }) {
  return (
    <figure className="m-0 flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl bg-white p-2">
        <img src={src} alt={alt} loading="lazy" className="mx-auto h-full max-h-full w-auto max-w-full object-contain" />
      </div>
      <figcaption className="mt-2 text-[13px] text-muted">{caption} Source: {source}.</figcaption>
    </figure>
  )
}
