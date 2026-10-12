import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TabDef } from './nav'

/** The active tab lives in the URL (?tab=), so back/forward and deep links work. */
export function useTab(tabs: TabDef[]) {
  const [params, setParams] = useSearchParams()
  const current = tabs.find((t) => t.key === params.get('tab'))?.key ?? tabs[0].key
  const set = useCallback((key: string) => {
    setParams((p) => { const n = new URLSearchParams(p); n.set('tab', key); return n }, { replace: false })
  }, [setParams])
  return [current, set] as const
}
