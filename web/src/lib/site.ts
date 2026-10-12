import raw from '../data/site_data.json'

export type ModelKey =
  | 'logistic_regression' | 'adaboost' | 'xgboost' | 'linear_svm' | 'knn' | 'naive_bayes' | 'decision_tree' | 'random_forest'

export interface Flag { level: 'fail' | 'warn'; text: string }
export interface Model {
  key: ModelKey; rank: string; rank_order: number; name: string
  owner_id: string; owner_name: string; owner_short: string; label: string
  score: number; cv_roc: number; test_roc: number; test_pr: number; test_brier: number | null
  cv_pr: number; fit_gap: number; main_reason: string; champion: boolean; served: boolean
  status: { kind: 'champion' | 'ok' | 'evidence' | 'fail'; flags: Flag[] }
  family: string; source: string; how: string; settings: Record<string, string>
  strengths: string[]; weaknesses: string[]; improve: string[]
  drivers?: { feature: string; coef: number; odds_ratio: number }[]
}
export interface Theory { label: string; title: string; body: string[] }
export interface LadderStep { step: number; name: string; why: string; how: string; showed: string; out: ModelKey[] }
export interface MethodTab { key: string; title: string; why?: string[]; why_title?: string; showed?: string[]; formula: string }
export interface Member { id: string; name: string; short: string; models: ModelKey[] }

interface SiteData {
  meta: { title: string; group: string; module: string; built: string; sources: string[] }
  members: Member[]
  facts: {
    target: string; late_rate: number; splits: { train: number; validation: number; test: number }
    split_dates: { train: string; validation: string; test: string }
    cv: { folds: number; gap_orders: number; scheme: string }
    orders_total: number; input_features: number; model_columns: number; ceiling_roc: number
    tie_zone: number; fit_limit: number; champion_cutoff: number; tiers: { Medium: number; High: number }
  }
  baseline: { name: string; cv_roc: number; test_roc: number; test_brier: number; cv_pr: number; cv_pr_ties_fair: number; test_pr: number; how: string }
  no_skill: { cv_pr: number; cv_roc: number; brier: number }
  models: Model[]
  headline: string; glance_notes: string[]; how_we_ranked: string
  scorecard_weights: Record<string, number>
  theory: Theory[]; ladder: LadderStep[]; method: MethodTab[]
  ranking_power_text: string[]; fit_text: string[]; fit_gap_note: string
  rank_reasons: string[]; sensitivity_text: string[]; fixes: string[]; report_wording: string
  data_limits: { title: string; body: string }[]
  figures: Record<string, { src: string; caption: string; source: string; alt: string }>
  cite: string
  dataset: { name: string; url: string; sha256: string; source: string; authors: string; published: string; doi: string; licence: string; cite: string }
}

export const site = raw as unknown as SiteData
export const models = site.models
export const champion = models.find((m) => m.champion)!
export const modelByKey = (k: string | undefined) => models.find((m) => m.key === k)
export const memberById = (id: string) => site.members.find((m) => m.id === id)!

/** Fixed colour per team member, used the same way in every chart, chip and table. */
export const MEMBER_VAR: Record<string, string> = {
  IT24102928: 'var(--m-madushani)', IT24102255: 'var(--m-ranthisaru)',
  IT24102397: 'var(--m-ratnaweera)', IT24102901: 'var(--m-maheepala)',
}
export const memberColor = (ownerId: string) => MEMBER_VAR[ownerId] ?? 'var(--ink-2)'

export const f4 = (v: number | null | undefined) => (v == null ? 'not reported' : v.toFixed(4))
export const f1 = (v: number) => v.toFixed(1)
export const int = (v: number) => v.toLocaleString('en-US')
export const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : '+'}${Math.abs(v).toFixed(4)}`
