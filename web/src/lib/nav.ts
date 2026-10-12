import type { IconName } from '../components/Icon'

export interface TabDef { key: string; label: string; icon?: IconName }
export interface PageDef {
  path: string; title: string; short: string; summary: string; icon: IconName
  section: 'Handbook' | 'Tools'; tabs: TabDef[]
}

export const PAGES: PageDef[] = [
  { path: '/', title: 'Overview', short: 'Overview', icon: 'overview', section: 'Handbook',
    summary: 'The problem, the data, the headline result and the champion model.',
    tabs: [{ key: 'summary', label: 'Summary', icon: 'star' }, { key: 'data', label: 'Problem & data', icon: 'database' },
           { key: 'result', label: 'Headline result', icon: 'chart' }] },
  { path: '/models', title: 'Models', short: 'Models', icon: 'grid', section: 'Handbook',
    summary: 'All eight models ranked by the group scorecard. Open any model for its full page.',
    tabs: [{ key: 'cards', label: 'Cards', icon: 'grid' }, { key: 'table', label: 'Ranking table', icon: 'table' }] },
  { path: '/compare', title: 'Compare', short: 'Compare', icon: 'compare', section: 'Handbook',
    summary: 'Pick two or three models and read them side by side.',
    tabs: [{ key: 'metrics', label: 'Metrics', icon: 'chart' }, { key: 'settings', label: 'Settings', icon: 'sliders' },
           { key: 'notes', label: 'Strengths & weaknesses', icon: 'scale' }] },
  { path: '/charts', title: 'Charts', short: 'Charts', icon: 'chart', section: 'Handbook',
    summary: 'Ranking power, ties, fit, probability honesty and how robust the ranking is.',
    tabs: [{ key: 'roc', label: 'ROC & tie zone' }, { key: 'prroc', label: 'PR vs ROC' }, { key: 'fit', label: 'Fit gap' },
           { key: 'brier', label: 'Brier' }, { key: 'scorecard', label: 'Scorecard' }, { key: 'robust', label: 'Robustness' }] },
  { path: '/method', title: 'Method', short: 'Method', icon: 'book', section: 'Handbook',
    summary: 'The rules behind the ranking: why each exists and what it showed.',
    tabs: [{ key: 'ladder', label: 'Decision ladder' }, { key: 'cv', label: 'Time-ordered CV' },
           { key: 'metrics', label: 'ROC vs PR & ties' }, { key: 'brier', label: 'Brier & calibration' },
           { key: 'scorecard', label: 'Scorecard' }, { key: 'sensitivity', label: 'Sensitivity' }] },
  { path: '/predict', title: 'Predict', short: 'Predict', icon: 'predict', section: 'Tools',
    summary: 'Enter an order and get a late-delivery risk from the champion model.',
    tabs: [{ key: 'order', label: 'Order', icon: 'form' }, { key: 'result', label: 'Result', icon: 'gauge' }] },
  { path: '/about', title: 'About', short: 'About', icon: 'about', section: 'Tools',
    summary: 'The team, the limits of the data and how to cite this work.',
    tabs: [{ key: 'team', label: 'Team', icon: 'people' }, { key: 'limits', label: 'Data limits', icon: 'alert' },
           { key: 'cite', label: 'Cite', icon: 'quote' }] },
]

/** Bottom tab bar on phones: four main pages plus "More". */
export const PHONE_TABS = ['/', '/models', '/charts', '/predict']

export const pageFor = (pathname: string) =>
  PAGES.find((p) => p.path === pathname) ?? (pathname.startsWith('/models/') ? PAGES[1] : undefined)
