/**
 * 60-second launch video: the 8-model comparison and the champion. Rendered frame by frame (t in seconds).
 * Stage is 1536x864 CSS px, captured at device scale 1.25 = 1920x1080. No zoom: only translate, opacity,
 * clip/size growth, colour and number changes. Real app pieces: ModelCard, Card, Tag, OwnerChip, Icon, AlertCount.
 */
import type { CSSProperties, ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { Card, OwnerChip, Tag } from '../components/ui'
import { memberColor, models, site, type Model, type ModelKey } from '../lib/site'
import { ModelCard } from '../pages/Models'
import preds from './predictions.json'
import { E_IN, E_MOVE, E_OUT, clamp, lerp, prog, vis } from './anim'

const W = 1536, H = 864, PX = 88
const byKey = (k: ModelKey) => models.find((m) => m.key === k)!
const RANK: ModelKey[] = models.map((m) => m.key)
const BY_MEMBER: ModelKey[] = ['logistic_regression', 'knn', 'decision_tree', 'adaboost', 'naive_bayes', 'linear_svm', 'random_forest', 'xgboost']
const SC = { s1: [0, 5.0], s2: [5.0, 12.6], s3: [12.6, 22.2], s4: [22.2, 34.6], s5: [34.6, 47.0], s6: [47.0, 55.5], s7: [55.5, 60.1] } as const
const on = (t: number, [a, b]: readonly [number, number]) => t >= a - 0.05 && t < b + 0.05

function Abs({ x, y, w, h, style, children }: { x: number; y: number; w?: number; h?: number; style?: CSSProperties; children: ReactNode }) {
  return <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...style }}>{children}</div>
}

/** Left-to-right wipe: the real value is never replaced by an in-between number. */
function Reveal({ t, a, d = 0.8, children }: { t: number; a: number; d?: number; children: ReactNode }) {
  const k = prog(t, a, d)
  return <span style={{ display: 'inline-block', clipPath: `inset(-10% ${(1 - k) * 100}% -10% 0)`, transform: `translateY(${(1 - k) * 6}px)` }}>{children}</span>
}

/** One readable line of type: fades and rises in at `a`, drifts out at `out`. */
function Line({ t, a, out, x = PX, y, size = 44, w = W - 2 * PX, color = 'var(--title)', weight = 700, align = 'left', children }:
  { t: number; a: number; out?: number; x?: number; y: number; size?: number; w?: number; color?: string; weight?: number; align?: 'left' | 'center'; children: ReactNode }) {
  return (
    <Abs x={x} y={y} w={w} style={{ ...vis(t, a, out ?? Infinity, 16, 0.9), fontSize: size, lineHeight: 1.15, fontWeight: weight, color, letterSpacing: '-0.015em', textAlign: align }}>
      {children}
    </Abs>
  )
}

/* ---- Scene 1 + 2: eight real model cards, grouped by teammate, then re-ordered by rank -------------------- */
const GX = PX, GY = 214, GW = W - 2 * PX, CW = (GW - 3 * 20) / 4, CH = 262
const slot = (i: number) => ({ x: GX + (i % 4) * (CW + 20), y: GY + Math.floor(i / 4) * (CH + 20) })

function Cards({ t }: { t: number }) {
  const exit = prog(t, 12.0, 0.45, E_OUT)
  return (
    <>
      <style>{`.vcard p:first-of-type{opacity:var(--o)} .vcard .mt-auto{opacity:var(--s);clip-path:inset(0 calc(var(--c) * 100%) 0 0)} .vcard li{height:${CH}px}`}</style>
      {BY_MEMBER.map((key, k) => {
        const m = byKey(key)
        const r = RANK.indexOf(key)
        const a = slot(k), b = slot(r)
        const mv = prog(t, 5.5 + r * 0.07, 0.95, E_MOVE)
        const enter = prog(t, 0.55 + k * 0.11, 0.85)
        const owner = prog(t, 0.95 + k * 0.11, 0.7)
        const tint = prog(t, 8.7 + r * 0.1, 0.8)
        const shown = { ...m, served: false }
        const plain: Model = { ...shown, status: { kind: 'ok', flags: [] } }
        const x = lerp(a.x, b.x, mv), y = lerp(a.y, b.y, mv) + (1 - enter) * 20 + exit * 8
        const vars = { '--o': owner, '--s': prog(t, 6.6 + r * 0.09, 0.6), '--c': 1 - prog(t, 6.6 + r * 0.09, 0.9) } as CSSProperties
        return (
          <Abs key={key} x={x} y={y} w={CW} h={CH} style={{ opacity: enter * (1 - exit), zIndex: mv > 0 && mv < 1 ? 2 : 1 }}>
            <ul className="vcard m-0 list-none p-0" style={{ ...vars, position: 'absolute', inset: 0 }}><ModelCard m={plain} /></ul>
            <ul className="vcard m-0 list-none p-0" style={{ ...vars, position: 'absolute', inset: 0, opacity: tint }}><ModelCard m={shown} /></ul>
          </Abs>
        )
      })}
    </>
  )
}

/* ---- Scene 3: one narrow band (CV ROC-AUC dot plot with the tie zone) ---------------------------------- */
function Band({ t }: { t: number }) {
  const rule = site.baseline.cv_roc, tz = site.facts.tie_zone, LO = 0.766, HI = 0.781
  const cardIn = prog(t, 12.65, 0.9), out = prog(t, 21.7, 0.45, E_OUT)
  const PW = 560, LW = 196, ROW = 54, TOP = 64
  const X = (v: number) => ((v - LO) / (HI - LO)) * PW
  const ruleH = prog(t, 15.9, 0.8, E_MOVE), zone = prog(t, 16.6, 1.0, E_MOVE)
  const plotH = ROW * 8
  return (
    <>
      <Abs x={PX} y={268} w={440} style={vis(t, 13.2, 21.7)}><span className="label" style={{ fontSize: 14 }}>CV ROC-AUC · 5 time-ordered folds</span></Abs>
      <Line t={t} a={14.1} out={19.0} y={300} w={430} size={42}>All eight sit inside a 0.006 band.</Line>
      <Line t={t} a={19.25} out={21.7} y={300} w={430} size={42}>None beats the simple shipping-mode rule (0.7748).</Line>
      <Abs x={PX} y={540} w={420} style={{ ...vis(t, 17.1, 21.7), fontSize: 18, color: 'var(--ink-2)' }}>Green band = tie zone, the rule ± 0.005. Smaller gaps than fold-to-fold noise are luck.</Abs>
      <Abs x={560} y={128} w={888} h={640} style={{ opacity: cardIn * (1 - out), transform: `translateY(${(1 - cardIn) * 24 + out * 8}px)` }}>
        <Card className="h-full p-8">
          <div style={{ position: 'relative', height: '100%' }}>
            <div style={{ position: 'absolute', left: LW + X(rule), top: 22, transform: 'translateX(-50%)', fontSize: 14, color: 'var(--ink-2)', whiteSpace: 'nowrap', opacity: ruleH }}>rule {rule.toFixed(4)}</div>
            <div style={{ position: 'absolute', left: LW + X(rule - tz) + (1 - zone) * (X(rule + tz) - X(rule - tz)) / 2, top: TOP, width: (X(rule + tz) - X(rule - tz)) * zone, height: plotH, background: 'var(--mint-bg)', borderRadius: 10 }} />
            <div style={{ position: 'absolute', left: LW + X(rule), top: TOP, width: 2, height: plotH * ruleH, background: 'var(--rule-model)' }} />
            {models.map((m, i) => {
              const lab = prog(t, 13.0 + i * 0.08, 0.7)
              const dot = prog(t, 13.8 + i * 0.12, 1.15, E_MOVE)
              const val = prog(t, 14.8 + i * 0.12, 0.5)
              const outside = m.cv_roc < rule - tz
              const hollow = outside ? prog(t, 17.8, 0.5) : 0
              const c = memberColor(m.owner_id)
              return (
                <div key={m.key} style={{ position: 'absolute', left: 0, top: TOP + i * ROW, width: '100%', height: ROW }}>
                  <div style={{ position: 'absolute', left: 0, top: 9, width: LW - 16, opacity: lab, transform: `translateY(${(1 - lab) * 10}px)` }}>
                    <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>{m.name}</div>
                    <div className="tnum" style={{ fontSize: 13, color: 'var(--muted)' }}>{m.owner_short} {m.owner_id}</div>
                  </div>
                  <div style={{ position: 'absolute', left: LW + X(m.cv_roc) * dot - 9, top: ROW / 2 - 9, width: 18, height: 18, borderRadius: 9, opacity: dot > 0 ? 1 : 0,
                    background: c, boxShadow: `inset 0 0 0 ${3 + hollow * 6}px ${c}`, border: '0 solid' }}>
                    <div style={{ position: 'absolute', inset: 3, borderRadius: 6, background: 'var(--surface)', opacity: hollow }} />
                  </div>
                  <div className="tnum" style={{ position: 'absolute', left: LW + X(m.cv_roc) + 14, top: ROW / 2 - 12, fontSize: 15, fontWeight: 700, color: 'var(--ink-2)', opacity: val, background: 'var(--surface)', borderRadius: 6, padding: '0 4px' }}>
                    {m.cv_roc.toFixed(4)}<span style={{ opacity: hollow, color: 'var(--pink-fg)' }}>{outside ? '  · outside' : ''}</span>
                  </div>
                </div>
              )
            })}
            <div style={{ position: 'absolute', left: LW, top: TOP + plotH + 8, width: PW, borderTop: '1px solid var(--line)', opacity: prog(t, 13.4, 0.8) }}>
              {[0.768, 0.772, 0.776, 0.78].map((v) => <span key={v} className="tnum" style={{ position: 'absolute', left: X(v), top: 6, transform: 'translateX(-50%)', fontSize: 13, color: 'var(--muted)' }}>{v.toFixed(3)}</span>)}
            </div>
          </div>
        </Card>
      </Abs>
    </>
  )
}

/* ---- Scene 4: the decision ladder ------------------------------------------------------------------------ */
const LAD_Y = 128, LAD_H = 150, PAN_Y = 304, PAN_H = 492
function Ladder({ t }: { t: number }) {
  const out = prog(t, 34.15, 0.45, E_OUT)
  const active = t < 27.0 ? 1 : t < 30.2 ? 2 : t < 32.6 ? 3 : 4
  const fails = [prog(t, 26.35, 0.6), prog(t, 29.65, 0.6), 0, 0]
  const checks = [0, 0, prog(t, 31.55, 0.6), prog(t, 33.4, 0.6)]
  return (
    <div style={{ opacity: 1 - out, transform: `translateY(${out * 8}px)` }}>
      <Line t={t} a={22.45} out={24.05} y={50} size={38}>The decision ladder</Line>
      <Line t={t} a={24.2} out={26.95} y={50} size={38}>Overfit? Out.</Line>
      <Line t={t} a={27.05} out={30.1} y={50} size={38}>Below the rule? Out.</Line>
      <Line t={t} a={30.3} y={50} size={38}>Still tied? Pick the simplest, most honest model.</Line>
      {site.ladder.map((s, i) => {
        const x = PX + i * ((W - 2 * PX - 60) / 4 + 20), w = (W - 2 * PX - 60) / 4
        const ring = active === s.step ? prog(t, [22.6, 24.1, 27.0, 30.2, 32.6][s.step], 0.5) : 0
        return (
          <Abs key={s.step} x={x} y={LAD_Y} w={w} h={LAD_H} style={vis(t, 22.6 + i * 0.12, Infinity, 20, 0.85)}>
            <div className="h-full rounded-[22px] border p-4" style={{ position: 'relative', background: 'var(--surface)', borderColor: 'var(--line)', boxShadow: `0 0 0 ${ring * 2}px var(--ink), var(--shadow)` }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: 'var(--pink-card)', opacity: fails[i] }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: 'var(--champ-card)', opacity: checks[i] }} />
              <div style={{ position: 'relative' }}>
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-full text-[15px] font-bold" style={{ background: 'var(--primary-bg)', color: 'var(--primary-fg)' }}>{s.step}</span>
                  <span className="text-[19px] font-bold text-ink">{s.name}</span>
                  {fails[i] > 0 && <span style={{ marginLeft: 'auto', opacity: fails[i] }}><Icon name="alert" size={22} className="text-danger" /></span>}
                  {checks[i] > 0 && <span style={{ marginLeft: 'auto', opacity: checks[i] }}><Icon name="check" size={22} className="text-ok" /></span>}
                </div>
                <p className="mt-3 text-[15px] leading-snug text-ink-2">{s.how}</p>
              </div>
            </div>
          </Abs>
        )
      })}
      <Abs x={PX} y={PAN_Y} w={W - 2 * PX} h={PAN_H} style={vis(t, 23.4, Infinity, 20, 0.9)}>
        <Card className="h-full p-8"><div style={{ position: 'relative', height: '100%' }}>
          <FitGapStep t={t} />
          <RuleStep t={t} />
          <TieStep t={t} />
        </div></Card>
      </Abs>
    </div>
  )
}

function FitGapStep({ t }: { t: number }) {
  const show = prog(t, 23.9, 0.7) * (1 - prog(t, 26.95, 0.45, E_OUT))
  if (show <= 0) return null
  const rows = [...models].sort((a, b) => b.fit_gap - a.fit_gap)
  const LW = 270, PW = 640, LO = -0.005, HI = 0.035, X = (v: number) => ((v - LO) / (HI - LO)) * PW
  const lim = prog(t, 24.2, 0.7, E_MOVE), rfOut = prog(t, 26.35, 0.6)
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: show }}>
      <span className="label" style={{ fontSize: 14 }}>Fit gap · train minus unseen PR-AUC · out limit 0.03</span>
      {rows.map((m, i) => {
        const g = prog(t, 24.45 + i * 0.08, 0.95, E_MOVE)
        const v = m.fit_gap * g
        const x0 = X(0), x1 = X(v)
        const isRF = m.key === 'random_forest'
        return (
          <div key={m.key} style={{ position: 'absolute', left: 0, top: 36 + i * 45, width: '100%', height: 40 }}>
            {isRF && <div style={{ position: 'absolute', left: -12, right: -12, top: 0, bottom: 0, borderRadius: 12, background: 'var(--pink-card)', opacity: rfOut }} />}
            <div style={{ position: 'absolute', left: 0, top: 9, width: LW - 20, fontSize: 16, color: 'var(--ink)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {m.name} <span className="tnum" style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>{m.owner_id}</span>
            </div>
            <div style={{ position: 'absolute', left: LW + Math.min(x0, x1), top: 10, width: Math.abs(x1 - x0), height: 20, borderRadius: 6, background: memberColor(m.owner_id) }} />
            <div className="tnum" style={{ position: 'absolute', left: LW + Math.max(x0, x1) + 10, top: 9, fontSize: 15, fontWeight: 700, color: 'var(--ink)', opacity: prog(t, 25.3 + i * 0.08, 0.4) }}>
              {m.fit_gap > 0 ? '+' : m.fit_gap < 0 ? '−' : ''}{Math.abs(m.fit_gap).toFixed(4)}
            </div>
            {isRF && <div style={{ position: 'absolute', left: LW + PW + 96, top: 4, opacity: rfOut, transform: `translateY(${(1 - rfOut) * 8}px)` }}>
              <Tag tone="pink" icon="alert">Out: Random Forest IT24102397</Tag></div>}
          </div>
        )
      })}
      <div style={{ position: 'absolute', left: LW + X(0), top: 36, width: 1, height: 8 * 45, background: 'var(--line-2)' }} />
      <div style={{ position: 'absolute', left: LW + X(0.03), top: 30, width: 0, height: (8 * 45 + 12) * lim, borderLeft: '2px dashed var(--danger)' }} />
      <div className="tnum" style={{ position: 'absolute', left: LW + X(0.03) - 30, top: 8 * 45 + 46, fontSize: 13, color: 'var(--danger)', opacity: lim }}>limit 0.03</div>
    </div>
  )
}

/** The 7 models still in after step 1, as chips; Naive Bayes drops out at step 2, the other 6 re-centre for the tie-break. */
const CHIP_W = 176, CHIP_GAP = 10
function chipX(i: number, n: number, panelW: number) { const total = n * CHIP_W + (n - 1) * CHIP_GAP; return (panelW - total) / 2 + i * (CHIP_W + CHIP_GAP) }
function RuleStep({ t }: { t: number }) {
  const show = prog(t, 27.15, 0.7) * (1 - prog(t, 30.2, 0.4, E_OUT))
  if (show <= 0) return null
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: show }}>
      <span className="label" style={{ fontSize: 14 }}>Rule check · CV ROC-AUC vs the rule 0.7748 · out if below 0.7698</span>
      <Chips t={t} phase="rule" />
    </div>
  )
}
function TieStep({ t }: { t: number }) {
  const show = prog(t, 30.25, 0.6)
  if (show <= 0) return null
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: show }}>
      <span className="label" style={{ fontSize: 14 }}>Head-to-head and tie-break</span>
      <Chips t={t} phase="tie" />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', justifyContent: 'center', ...vis(t, 31.45, Infinity, 12, 0.7) }}>
        <Tag tone="mint" icon="check">Nobody clearly beaten: every gap is inside the 0.005 noise margin</Tag>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', fontSize: 20, color: 'var(--ink-2)', ...vis(t, 32.4, Infinity, 12, 0.8) }}>
        Tie-break: simplicity · stability · honest probabilities · evidence quality
      </div>
    </div>
  )
}
function Chips({ t, phase }: { t: number; phase: 'rule' | 'tie' }) {
  const panelW = W - 2 * PX - 64
  const seven = models.filter((m) => m.key !== 'random_forest')
  const six = seven.filter((m) => m.key !== 'naive_bayes')
  return (
    <>
      {seven.map((m, i) => {
        const isNB = m.key === 'naive_bayes'
        if (phase === 'tie' && isNB) return null
        const enter = phase === 'rule' ? prog(t, 27.3 + i * 0.09, 0.8) : 1
        const nb = isNB ? prog(t, 29.65, 0.75, E_MOVE) : 0
        const mv = phase === 'tie' ? prog(t, 30.45, 0.9, E_MOVE) : 0
        const x = lerp(chipX(i, 7, panelW), chipX(six.indexOf(m), 6, panelW), mv)
        const champ = phase === 'tie' && m.champion ? prog(t, 33.55, 0.7) : 0
        return (
          <div key={m.key} style={{ position: 'absolute', left: x, top: 150 + nb * 40 + (1 - enter) * 16, width: CHIP_W, opacity: enter }}>
            <div className="rounded-[18px] border p-3" style={{ position: 'relative', background: 'var(--surface)', borderColor: isNB && nb > 0 ? 'var(--pink-line)' : 'var(--line)', boxShadow: `0 0 0 ${champ * 3}px var(--green)` }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'var(--pink-card)', opacity: nb }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'var(--champ-card)', opacity: champ }} />
              <div style={{ position: 'relative' }}>
                <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: memberColor(m.owner_id) }} /><span className="text-[15px] leading-tight font-bold text-ink" style={{ whiteSpace: 'nowrap', fontSize: m.name.length > 14 ? 13.5 : 15 }}>{m.name}</span></div>
                <div className="tnum text-[12px] text-muted">{m.owner_short} {m.owner_id}</div>
                <div className="tnum mt-2 text-[22px] font-bold text-ink">{m.cv_roc.toFixed(4)}</div>
                <div className="text-[12px] text-muted">CV ROC-AUC</div>
              </div>
            </div>
            {isNB && <div style={{ marginTop: 10, opacity: nb }}><Tag tone="pink" icon="alert">Out: 0.0055 below</Tag></div>}
            {champ > 0 && <div style={{ marginTop: 10, opacity: champ }}><Tag tone="green" icon="trophy">Champion</Tag></div>}
          </div>
        )
      })}
    </>
  )
}

/* ---- Scene 5: the champion ---------------------------------------------------------------------------- */
function Champion({ t }: { t: number }) {
  const c = byKey('logistic_regression')
  const out = prog(t, 46.5, 0.45, E_OUT)
  const surf = prog(t, 34.85, 0.9)
  const count = (a: number, v: number, digits = 4, d = 0.9) => <Reveal t={t} a={a} d={d}>{v.toFixed(digits)}</Reveal>
  const metrics: [string, number][] = [['CV ROC-AUC', c.cv_roc], ['Test ROC-AUC', c.test_roc], ['Test PR-AUC', c.test_pr], ['Test Brier', c.test_brier!]]
  const drivers = c.drivers ?? []
  const max = Math.max(...drivers.map((d) => Math.abs(d.coef)))
  return (
    <div style={{ opacity: 1 - out, transform: `translateY(${out * 8}px)` }}>
      <Line t={t} a={35.35} out={42.6} y={50} size={38}>Logistic Regression by Madushani G.R.</Line>
      <Line t={t} a={43.0} y={50} size={38}>Simple. Readable. Honest probabilities.</Line>
      <Abs x={PX} y={140} w={720} h={600} style={{ opacity: surf, transform: `translateY(${(1 - surf) * 24}px)` }}>
        <Card tint="champion" className="h-full p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex gap-2" style={vis(t, 35.2, Infinity, 12, 0.7)}><Tag tone="green" icon="trophy">Champion · rank 1 of 8</Tag><Tag tone="grey">{c.family}</Tag></div>
              <div className="mt-4 text-[46px] leading-[52px] font-bold text-ink" style={vis(t, 35.55, Infinity, 16, 0.9)}>{c.name}</div>
              <div className="mt-2" style={vis(t, 36.3, Infinity, 10, 0.7)}><span style={{ fontSize: 18 }}><OwnerChip name={c.owner_name} id={c.owner_id} /></span></div>
            </div>
            <div className="text-right" style={vis(t, 36.6, Infinity, 10, 0.7)}>
              <div className="tnum text-[56px] leading-[60px] font-bold text-ink">{count(36.7, c.score, 1, 1.2)}</div>
              <div className="text-[16px] text-muted">out of 100</div>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-x-8 gap-y-6 border-t pt-6" style={{ borderColor: 'var(--champ-line)' }}>
            {metrics.map(([k, v], i) => (
              <div key={k} style={vis(t, 39.3 + i * 0.45, Infinity, 12, 0.7)}>
                <div className="text-[16px] text-muted">{k}</div>
                <div className="tnum text-[40px] leading-[46px] font-bold text-ink">{count(39.4 + i * 0.45, v)}</div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {['C = 0.1', 'L2', '20 columns', 'cut-off 0.6040'].map((s, i) => <span key={s} style={vis(t, 41.6 + i * 0.1, Infinity, 10, 0.6)}><Tag tone={i === 3 ? 'mint' : 'grey'}>{s}</Tag></span>)}
          </div>
          <div className="mt-6 text-[18px] text-ink-2" style={vis(t, 42.2, Infinity, 10, 0.7)}>{c.main_reason}. Fit gap +0.0019: no overfitting.</div>
        </Card>
      </Abs>
      <Abs x={PX + 752} y={140} w={W - 2 * PX - 752} h={600} style={vis(t, 42.4, Infinity, 24, 0.9)}>
        <Card className="h-full p-8">
          <div className="text-[22px] font-bold text-ink">What drives its score</div>
          <div className="mt-1 text-[15px] text-muted">Weights from Madushani's report (IT24102928)</div>
          <div className="mt-8 flex flex-col gap-6">
            {drivers.map((d, i) => {
              const g = prog(t, 42.9 + i * 0.13, 1.0, E_MOVE)
              const w = (Math.abs(d.coef) / max) * 46 * g
              return (
                <div key={d.feature}>
                  <div className="flex justify-between text-[17px]"><span className="text-ink-2">{d.feature}</span>
                    <span className="tnum font-bold text-ink" style={{ opacity: prog(t, 43.5 + i * 0.13, 0.5) }}>{d.coef > 0 ? '+' : '−'}{Math.abs(d.coef).toFixed(4)}</span></div>
                  <div className="relative mt-2 h-3 rounded-full" style={{ background: 'var(--surface-2)' }}>
                    <div className="absolute inset-y-0 rounded-full" style={{ left: d.coef >= 0 ? '50%' : `${50 - w}%`, width: `${w}%`, background: d.coef >= 0 ? 'var(--danger)' : 'var(--ok)' }} />
                    <div className="absolute -inset-y-1 left-1/2 w-px" style={{ background: 'var(--line-2)' }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-8 text-[15px] text-muted" style={vis(t, 43.9, Infinity, 8, 0.7)}>Red raises the late risk, green lowers it. Region, day and hour weights are close to zero.</div>
        </Card>
      </Abs>
    </div>
  )
}

/* ---- Scene 6: the champion at work (Predict form and result) ------------------------------------------- */
const DEF = { shipping_mode: 'Standard Class', order_date: '2017-08-14, 10:30 AM', market: 'Europe', order_region: 'Western Europe', customer_segment: 'Consumer', payment_type: 'DEBIT', n_lines: '3', total_qty: '6', gross_sales: '560', total_discount: '51.5', max_unit_price: '200' }
const HI_ORDER = preds.high.order
const HIGH = { shipping_mode: HI_ORDER.shipping_mode, order_date: '2017-12-16, 07:30 PM', market: HI_ORDER.market, order_region: HI_ORDER.order_region, customer_segment: HI_ORDER.customer_segment, payment_type: HI_ORDER.payment_type, n_lines: String(HI_ORDER.n_lines), total_qty: String(HI_ORDER.total_qty), gross_sales: String(HI_ORDER.gross_sales), total_discount: String(HI_ORDER.total_discount), max_unit_price: String(HI_ORDER.max_unit_price) }
const FIELDS: [keyof typeof DEF, string, number][] = [['shipping_mode', 'Shipping mode', 0], ['order_date', 'Order date and time', 0], ['market', 'Market', 1], ['order_region', 'Region', 1],
  ['customer_segment', 'Customer segment', 2], ['payment_type', 'Payment type', 2], ['n_lines', 'Product lines', 3], ['total_qty', 'Total items', 3], ['gross_sales', 'Order value ($)', 3], ['total_discount', 'Discount ($)', 4], ['max_unit_price', 'Highest item price ($)', 4]]
export const CLICK_T = 48.9, GAUGE_T = 49.8, GAUGE_D = 1.9

function Field({ label, a, b, k, select }: { label: string; a: string; b: string; k: number; select: boolean }) {
  return (
    <div>
      <div className="mb-1 text-[14px] font-semibold text-ink">{label}</div>
      <div className="relative flex h-11 items-center rounded-2xl border px-3.5 text-[16px] text-ink" style={{ background: 'var(--surface)', borderColor: k > 0 && k < 1 ? 'var(--ok)' : 'var(--line)' }}>
        <span style={{ opacity: 1 - k, position: 'absolute' }}>{a}</span><span style={{ opacity: k }}>{b}</span>
        {select && <span className="ml-auto text-muted"><Icon name="chevron-down" size={16} /></span>}
      </div>
    </div>
  )
}

function AtWork({ t }: { t: number }) {
  const out = prog(t, 55.05, 0.45, E_OUT)
  const swap = (i: number) => { const k = clamp((t - (CLICK_T + 0.2 + i * 0.05)) / 0.45); return E_IN(k) }
  const press = clamp(1 - Math.abs(t - (CLICK_T + 0.05)) / 0.12)
  const pressed = t >= CLICK_T
  const p = preds.high
  const g = p.probability * prog(t, GAUGE_T, GAUGE_D, E_MOVE)
  const idle = 1 - prog(t, 49.25, 0.4, E_OUT)
  const res = prog(t, 49.5, 0.7)
  const typed = Math.round(p.reason.length * clamp((t - 51.95) / 2.1))
  const tags = prog(t, 54.45, 0.5)
  // cursor path (eased quadratic curve) to the "High risk" chip
  const cp = prog(t, 47.9, 1.0, E_MOVE)
  const sx = 1120, sy = 760, ex = 474, ey = 196, qx = 820, qy = 340
  const cx = (1 - cp) ** 2 * sx + 2 * (1 - cp) * cp * qx + cp ** 2 * ex, cy = (1 - cp) ** 2 * sy + 2 * (1 - cp) * cp * qy + cp ** 2 * ey
  const cursor = prog(t, 47.7, 0.4) * (1 - prog(t, 50.2, 0.5, E_OUT))
  return (
    <div style={{ opacity: 1 - out, transform: `translateY(${out * 8}px)` }}>
      <Line t={t} a={47.2} y={50} size={38}>Give it an order.</Line>
      <Abs x={PX} y={128} w={760} h={660} style={vis(t, 47.15, Infinity, 24, 0.9)}>
        <Card className="h-full p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-[14px] text-muted">Examples:</span>
            <span className="inline-flex h-10 items-center rounded-full px-4 text-[15px] font-medium" style={{ background: 'var(--mint-bg)', color: 'var(--mint-fg)' }}>Low risk</span>
            <span className="inline-flex h-10 items-center rounded-full px-4 text-[15px] font-medium" style={{ background: 'var(--peach-bg)', color: 'var(--peach-fg)' }}>Mixed</span>
            <span className="inline-flex h-10 items-center rounded-full px-4 text-[15px] font-medium" style={{ background: pressed ? 'var(--primary-bg)' : 'var(--pink-bg)', color: pressed ? 'var(--primary-fg)' : 'var(--pink-fg)', transform: `translateY(${press * 2}px)` }}>High risk</span>
          </div>
          {[['Shipping', [0, 1]], ['Customer', [2, 3, 4, 5]], ['Basket', [6, 7, 8, 9, 10]]].map(([title, idx]) => (
            <div key={title as string} className="mb-4">
              <div className="label mb-2">{title as string}</div>
              <div className={`grid gap-3 ${title === 'Basket' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {(idx as number[]).map((i) => { const [key, label] = FIELDS[i]; return <Field key={key} label={label} a={DEF[key]} b={HIGH[key]} k={swap(i)} select={i !== 1 && i < 6} /> })}
              </div>
            </div>
          ))}
        </Card>
      </Abs>
      <Abs x={PX + 788} y={128} w={W - 2 * PX - 788} h={660} style={vis(t, 47.35, Infinity, 24, 0.9)}>
        <Card className="relative h-full overflow-hidden p-7">
          <div style={{ position: 'absolute', inset: 0, background: 'var(--pink-card)', opacity: res }} />
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: idle }}>
            <div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-full" style={{ background: 'var(--green)', color: 'var(--on-green)' }}><Icon name="gauge" size={26} /></span>
              <div className="mt-4 text-[18px] font-semibold text-ink">No prediction yet</div></div>
          </div>
          <div style={{ position: 'relative', opacity: res }}>
            <div className="flex gap-2" style={{ opacity: tags, transform: `translateY(${(1 - tags) * 6}px)`, height: 28 }}>
              <Tag tone="pink" icon="alert">Flag as late</Tag><Tag tone="pink">High risk tier</Tag>
            </div>
            <div className="mt-4 text-[18px] font-medium text-ink-2">Chance this order arrives late</div>
            <div className="tnum text-[84px] leading-[88px] font-bold text-ink" style={{ minHeight: 88 }}><Reveal t={t} a={GAUGE_T + GAUGE_D - 0.25} d={0.7}>{Math.round(p.probability * 100)}%</Reveal>
              <span className="ml-3 text-[26px] font-semibold text-muted" style={{ opacity: prog(t, GAUGE_T + GAUGE_D, 0.5) }}>{p.probability.toFixed(4)}</span></div>
            <div className="relative mt-4 h-5 rounded-full" style={{ background: 'var(--surface-2)' }}>
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${g * 100}%`, background: g >= p.cutoff ? 'var(--danger)' : 'var(--ok)' }} />
              <div className="absolute -inset-y-2 w-0.5 rounded" style={{ left: `${p.cutoff * 100}%`, background: 'var(--ink)' }} />
            </div>
            <div className="relative mt-2 h-10 text-[14px] text-muted">
              <span className="absolute left-0">0</span>
              <span className="tnum absolute -translate-x-1/2 text-center font-semibold text-ink" style={{ left: `${p.cutoff * 100}%` }}>cut-off<br />{p.cutoff.toFixed(4)}</span>
              <span className="absolute right-0">1</span>
            </div>
            <p className="mt-4 text-[19px] leading-relaxed text-ink">{p.reason.slice(0, typed)}</p>
          </div>
          <div className="absolute inset-x-7 bottom-6 border-t pt-3 text-[15px] text-muted" style={{ borderColor: 'var(--line)', opacity: prog(t, 52.6, 0.6) }}>
            Model used: <b className="text-ink">Logistic Regression</b> · Madushani IT24102928 · cut-off 0.6040
          </div>
        </Card>
      </Abs>
      <svg width="28" height="28" viewBox="0 0 24 24" style={{ position: 'absolute', left: cx, top: cy, opacity: cursor, filter: 'drop-shadow(0 2px 3px rgb(0 0 0 / .25))' }}>
        <path d="M4 3l15 7.5-6.5 1.8L9.5 19z" fill="#131313" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/* ---- Scene 7: punchline ---------------------------------------------------------------------------------- */
function Punchline({ t }: { t: number }) {
  return (
    <>
      <Line t={t} a={55.65} y={250} size={58} align="center">No model beats the rule.</Line>
      <Line t={t} a={56.85} y={326} size={58} align="center" color="var(--ink)">So we chose the one you can explain.</Line>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 500, display: 'flex', justifyContent: 'center', gap: 14 }}>
        {site.members.map((m, i) => (
          <div key={m.id} className="flex items-center gap-2.5 rounded-full p-1.5 pr-4" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow)', ...vis(t, 57.35 + i * 0.1, Infinity, 14, 0.8) }}>
            <span className="grid size-9 place-items-center rounded-full text-[14px] font-bold text-white" style={{ background: memberColor(m.id) }}>{m.short[0]}</span>
            <span className="text-[16px] font-semibold text-ink">{m.name}</span><span className="tnum text-[14px] text-muted">{m.id}</span>
          </div>
        ))}
      </div>
      <Line t={t} a={57.9} y={590} size={18} weight={600} align="center" color="var(--muted)">IT3091 Machine Learning · Group 2026-DS-15 · DataCo Smart Supply Chain</Line>
    </>
  )
}

export function Video({ t }: { t: number }) {
  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', background: 'var(--canvas)', fontFamily: 'var(--font)' }}>
      {on(t, SC.s1) || on(t, SC.s2) ? (
        <>
          <Line t={t} a={0.3} out={4.6} y={64} size={44}>8 models. 1 question: will this order arrive late?</Line>
          <Line t={t} a={5.25} out={12.0} y={64} size={44}>Ranked on a 100-point scorecard. Never on accuracy.</Line>
          <Abs x={PX} y={122} w={900} style={vis(t, 1.2, 4.6)}><span className="text-[18px] text-ink-2">Four teammates, two models each, one shared pipeline.</span></Abs>
          <Cards t={t} />
        </>
      ) : null}
      {on(t, SC.s3) && <Band t={t} />}
      {on(t, SC.s4) && <Ladder t={t} />}
      {on(t, SC.s5) && <Champion t={t} />}
      {on(t, SC.s6) && <AtWork t={t} />}
      {on(t, SC.s7) && <Punchline t={t} />}
      <div style={{ position: 'absolute', left: PX, bottom: 26, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', opacity: (1 - prog(t, 55.2, 0.5, E_OUT)) * prog(t, 0.2, 0.8) }}>
        IT3091 · Group 2026-DS-15 · 62,897 DataCo orders
      </div>
    </div>
  )
}

