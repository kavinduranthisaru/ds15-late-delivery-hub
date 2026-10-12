import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { PAGES, PHONE_TABS, type PageDef } from '../lib/nav'
import { models, site, memberColor } from '../lib/site'
import { Icon } from './Icon'
import { SearchDialog } from './Search'
import { useInstall } from '../lib/install'

/* ---- Theme ------------------------------------------------------------------------------------------- */
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'))
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('theme', next) } catch { /* private mode */ }
    setTheme(next)
  }
  return { theme, toggle }
}

function ThemeButton({ withLabel = false }: { withLabel?: boolean }) {
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? 'Light theme' : 'Dark theme'
  return (
    <button type="button" onClick={toggle} aria-label={`Switch to ${label.toLowerCase()}`}
      className={`flex h-11 items-center gap-3 rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink ${withLabel ? 'w-full px-3' : 'w-11 justify-center'}`}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      {withLabel && <span className="text-[15px]">{label}</span>}
    </button>
  )
}

/* ---- Sidebar ----------------------------------------------------------------------------------------- */
function Sidebar({ collapsed, onToggle, onSearch }: { collapsed: boolean; onToggle: () => void; onSearch: () => void }) {
  const sections: PageDef['section'][] = ['Handbook', 'Tools']
  return (
    <aside className={`hidden shrink-0 flex-col border-r border-line bg-surface md:flex ${collapsed ? 'w-[76px]' : 'w-[76px] lg:w-[248px]'}`}
      aria-label="Main navigation">
      <div className="flex h-[76px] items-center gap-2 border-b border-line px-4">
        <Link to="/" className="flex min-w-0 flex-1 items-center gap-2.5 no-underline" aria-label="DS-15 Hub, home">
          <img src="/icons/icon.svg" alt="" width={36} height={36} className="size-9 shrink-0 rounded-[10px]" />
          <span className={`truncate text-[19px] font-bold text-ink ${collapsed ? 'hidden' : 'hidden lg:inline'}`}>DS-15 Hub</span>
        </Link>
        <button type="button" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}
          className={`size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2 hover:text-ink ${collapsed ? 'hidden' : 'hidden lg:grid'}`}>
          <Icon name="chevrons-left" size={18} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
        <button type="button" onClick={onSearch} aria-label="Search the handbook"
          className="mb-4 flex h-11 items-center gap-2.5 rounded-full bg-surface-2 px-3.5 text-left text-[15px] text-muted hover:text-ink">
          <Icon name="search" size={19} />
          <span className={`flex-1 ${collapsed ? 'hidden' : 'hidden lg:inline'}`}>Global search</span>
          <kbd className={`rounded-md bg-surface px-1.5 text-[12px] ${collapsed ? 'hidden' : 'hidden lg:inline'}`}>⌘K</kbd>
        </button>

        <nav className="scroll-y flex min-h-0 flex-1 flex-col gap-0.5">
          {sections.map((s) => (
            <div key={s} className="mb-3">
              <p className={`label mb-1.5 px-3 ${collapsed ? 'sr-only' : 'sr-only lg:not-sr-only lg:block'}`}>{s}</p>
              {PAGES.filter((p) => p.section === s).map((p) => (
                <NavLink key={p.path} to={p.path} end={p.path === '/'} title={p.title}
                  className={({ isActive }) =>
                    `relative flex h-11 items-center gap-3 rounded-full px-3 text-[15px] no-underline transition-colors ${
                      isActive ? 'bg-green font-semibold text-on-green' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'}`}>
                  {({ isActive }) => (
                    <>
                      {isActive && <span aria-hidden="true" className="absolute top-2 -left-3 h-7 w-1.5 rounded-r-full bg-ink" />}
                      <Icon name={p.icon} />
                      <span className={`flex-1 ${collapsed ? 'sr-only' : 'sr-only lg:not-sr-only'}`}>{p.title}</span>
                      {p.path === '/models' && (
                        <span className={`tnum min-w-7 rounded-full px-2 text-center text-[12px] font-bold ${isActive ? 'bg-surface text-ink' : 'bg-green text-on-green'} ${collapsed ? 'hidden' : 'hidden lg:inline'}`}
                         >{models.length}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
          {collapsed
            ? <button type="button" onClick={onToggle} aria-label="Expand sidebar" className="grid size-11 place-items-center rounded-full bg-surface-2 text-ink-2"><Icon name="chevrons-right" size={18} /></button>
            : null}
          <span className={collapsed ? '' : 'lg:hidden'}><ThemeButton /></span>
          <span className={collapsed ? 'hidden' : 'hidden lg:block'}><ThemeButton withLabel /></span>
          <Link to="/about" className={`items-center gap-2 rounded-full bg-surface-2 p-1.5 pr-3 no-underline ${collapsed ? 'hidden' : 'hidden lg:flex'}`}>
            <span className="flex -space-x-2" aria-hidden="true">
              {site.members.map((m) => (
                <span key={m.id} className="grid size-8 place-items-center rounded-full border-2 border-surface-2 text-[11px] font-bold text-white"
                  style={{ background: memberColor(m.id) }}>{m.short[0]}</span>
              ))}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-semibold text-ink">Group DS-15</span>
              <span className="block truncate text-[12px] text-muted">4 members · IT3091 ML</span>
            </span>
          </Link>
        </div>
      </div>
    </aside>
  )
}

/* ---- Phone: bottom tab bar and sheet ------------------------------------------------------------------- */
function BottomTabs({ onMore }: { onMore: () => void }) {
  const { pathname } = useLocation()
  const inMore = !PHONE_TABS.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)))
  return (
    <nav aria-label="Main pages" className="grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {PHONE_TABS.map((path) => {
        const p = PAGES.find((x) => x.path === path)!
        return (
          <NavLink key={path} to={path} end={path === '/'}
            className={({ isActive }) => `flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[12px] no-underline ${isActive ? 'font-semibold text-ink' : 'text-muted'}`}>
            {({ isActive }) => (
              <>
                <span className={`grid h-7 w-12 place-items-center rounded-full ${isActive ? 'bg-green text-on-green' : ''}`}><Icon name={p.icon} size={20} /></span>
                {p.short}
              </>
            )}
          </NavLink>
        )
      })}
      <button type="button" onClick={onMore} aria-haspopup="dialog"
        className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[12px] ${inMore ? 'font-semibold text-ink' : 'text-muted'}`}>
        <span className={`grid h-7 w-12 place-items-center rounded-full ${inMore ? 'bg-green text-on-green' : ''}`}><Icon name="more-h" size={20} /></span>More
      </button>
    </nav>
  )
}

function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('a,button')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); prev?.focus() }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div ref={ref} className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-surface px-5 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))] [animation:sheet-in_220ms_var(--ease)]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line-2" />
        <div className="mb-2 flex items-center justify-between">
          <p className="label">{title}</p>
          <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full bg-surface-2" aria-label="Close"><Icon name="close" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ---- Shell --------------------------------------------------------------------------------------------- */
export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [more, setMore] = useState(false)
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('sidebar') === 'collapsed' } catch { return false } })
  const install = useInstall()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => setMore(false), [pathname])
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem('sidebar', c ? 'open' : 'collapsed') } catch { /* */ } return !c })

  return (
    <div className="flex h-dvh flex-col bg-canvas lg:p-3">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-surface focus:p-3">Skip to content</a>
      <div className="flex min-h-0 flex-1 overflow-hidden bg-app lg:rounded-[28px] lg:shadow-[var(--shadow-lg)]">
        <Sidebar collapsed={collapsed} onToggle={toggle} onSearch={() => setSearchOpen(true)} />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* phone top bar */}
          <header className="flex h-14 shrink-0 items-center gap-1 border-b border-line bg-surface px-3 md:hidden">
            <Link to="/" className="flex flex-1 items-center gap-2 no-underline">
              <img src="/icons/icon.svg" alt="" width={30} height={30} className="size-[30px] rounded-[9px]" />
              <span className="text-[17px] font-bold text-ink">DS-15 Hub</span>
            </Link>
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className="grid size-11 place-items-center rounded-full text-ink-2"><Icon name="search" /></button>
            <ThemeButton />
          </header>
          <main id="main" className="flex min-h-0 flex-1 flex-col" key={pathname}>
            <div className="page-enter flex min-h-0 flex-1 flex-col">{children}</div>
          </main>
          <BottomTabs onMore={() => setMore(true)} />
        </div>
      </div>

      <Sheet open={more} onClose={() => setMore(false)} title="All pages">
        <nav className="grid grid-cols-2 gap-2" aria-label="All pages">
          {PAGES.map((p) => (
            <NavLink key={p.path} to={p.path} end={p.path === '/'}
              className={({ isActive }) => `flex h-14 items-center gap-2.5 rounded-2xl px-4 text-[15px] no-underline ${isActive ? 'bg-green font-semibold text-on-green' : 'bg-surface-2 text-ink'}`}>
              <Icon name={p.icon} /> {p.title}
            </NavLink>
          ))}
        </nav>
        {install && (
          <button type="button" onClick={install} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-on-primary">
            <Icon name="download" size={18} /> Install app
          </button>
        )}
      </Sheet>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

