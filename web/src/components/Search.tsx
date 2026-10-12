import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PAGES } from '../lib/nav'
import { models, site } from '../lib/site'
import { Icon } from './Icon'

interface Entry { title: string; where: string; to: string; text: string }

function buildIndex(): Entry[] {
  const out: Entry[] = []
  for (const p of PAGES) {
    out.push({ title: p.title, where: 'Page', to: p.path, text: p.summary })
    for (const t of p.tabs) out.push({ title: `${p.title}: ${t.label}`, where: 'Tab', to: `${p.path}?tab=${t.key}`, text: t.label })
  }
  for (const m of models) {
    out.push({ title: m.label, where: `Model · rank ${m.rank}`, to: `/models/${m.key}`,
      text: [m.family, m.how, m.main_reason, ...m.strengths, ...m.weaknesses, ...Object.keys(m.settings)].join(' ') })
  }
  for (const t of site.method) out.push({ title: t.title, where: 'Method', to: `/method?tab=${t.key}`, text: [...(t.why ?? []), ...(t.showed ?? [])].join(' ') })
  for (const s of site.ladder) out.push({ title: `Step ${s.step}: ${s.name}`, where: 'Decision ladder', to: '/method?tab=ladder', text: `${s.why} ${s.how} ${s.showed}` })
  for (const mem of site.members) out.push({ title: `${mem.name} ${mem.id}`, where: 'Team', to: '/about?tab=team', text: mem.models.join(' ') })
  return out
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const index = useMemo(buildIndex, [])
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return index.filter((e) => e.where === 'Page')
    return index
      .map((e) => {
        const title = e.title.toLowerCase(), body = e.text.toLowerCase()
        const ok = words.every((w) => title.includes(w) || body.includes(w))
        return { e, s: ok ? words.reduce((a, w) => a + (title.includes(w) ? 3 : 1), 0) : 0 }
      })
      .filter((r) => r.s > 0).sort((a, b) => b.s - a.s).slice(0, 10).map((r) => r.e)
  }, [q, index])

  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => input.current?.focus(), 0) } }, [open])
  useEffect(() => setSel(0), [q])
  if (!open) return null

  const go = (e: Entry) => { onClose(); navigate(e.to) }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]" role="dialog" aria-modal="true" aria-label="Search the handbook">
      <button type="button" aria-label="Close search" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[560px] overflow-hidden rounded-[22px] border border-line bg-surface shadow-[var(--shadow-lg)]">
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Icon name="search" className="text-muted" />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search models, rules, people"
            aria-label="Search" role="combobox" aria-expanded="true" aria-controls="search-results"
            aria-activedescendant={results[sel] ? `sr-${sel}` : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
              if (e.key === 'Enter' && results[sel]) go(results[sel])
            }}
            className="h-14 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-muted" />
          <kbd className="hidden rounded-md bg-surface-2 px-1.5 text-[12px] text-muted md:block">esc</kbd>
        </div>
        <ul id="search-results" role="listbox" className="scroll-y max-h-[50dvh] p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-muted">No matches. Try a model name, an ID number or a rule.</li>}
          {results.map((r, i) => (
            <li key={r.title + r.to} id={`sr-${i}`} role="option" aria-selected={i === sel}>
              <button type="button" onClick={() => go(r)} onMouseEnter={() => setSel(i)}
                className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left ${i === sel ? 'bg-green text-on-green' : ''}`}>
                <span className="text-[15px] font-medium">{r.title}</span>
                <span className={`text-[12px] ${i === sel ? '' : 'text-muted'}`}>{r.where}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
