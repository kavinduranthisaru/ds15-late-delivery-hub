import type { ReactNode } from 'react'
import type { PageDef } from '../lib/nav'
import { useInstall } from '../lib/install'
import { useTab } from '../lib/useTab'
import { Icon } from './Icon'
import { SegTabs, TabPanel } from './ui'

/**
 * Page frame: navy title, one-line summary, optional actions, the segmented tab row, then the active tab.
 * On desktop the panel is sized to the viewport so the page itself never scrolls.
 */
export function Page({ page, children, actions, title, summary, toolbar, tabsOverride, tabsPhoneOnly }: {
  page: PageDef
  children: (tab: string) => ReactNode
  actions?: ReactNode
  title?: ReactNode
  summary?: ReactNode
  toolbar?: ReactNode
  tabsOverride?: PageDef['tabs']
  /** Show the tab row on phones only (the desktop layout shows every tab at once). */
  tabsPhoneOnly?: boolean
}) {
  const tabs = tabsOverride ?? page.tabs
  const [tab, setTab] = useTab(tabs)
  const install = useInstall()
  const idBase = page.path.replace(/\W/g, '') || 'home'
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-4 pt-5 md:px-7 md:pt-6">
        <div className="min-w-0">
          <h1 className="text-[26px] leading-8 font-bold text-title md:text-[30px] md:leading-9">{title ?? page.title}</h1>
          <p className="mt-1 line-clamp-2 text-[13px] text-muted md:text-[15px]">{summary ?? page.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {install && (
            <button type="button" onClick={install} className="hidden h-11 items-center gap-2 rounded-full bg-surface px-4 text-[14px] font-semibold text-ink shadow-[var(--shadow)] md:inline-flex">
              <Icon name="download" size={18} /> Install app
            </button>
          )}
        </div>
      </header>
      <div className={`flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3 md:px-7 ${tabsPhoneOnly ? 'lg:pt-2 lg:pb-1 lg:[&>[role=tablist]]:hidden' : ''}`}>
        {tabs.length > 1 ? <SegTabs tabs={tabs} current={tab} onChange={setTab} idBase={idBase} label={`${page.title} sections`} /> : <span />}
        {toolbar}
      </div>
      <div className="scroll-y min-h-0 flex-1 px-4 pb-6 md:px-7">
        <TabPanel idBase={idBase} current={tab} className="h-full">{children(tab)}</TabPanel>
      </div>
    </div>
  )
}
