import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import '../styles/index.css'
import { Video } from './Video'

const root = createRoot(document.getElementById('stage')!)
const render = (t: number) => flushSync(() => root.render(<MemoryRouter><Video t={t} /></MemoryRouter>))
declare global { interface Window { __render: (t: number) => Promise<void>; __ready: Promise<void> } }
window.__render = async (t) => { render(t) }
window.__ready = document.fonts.ready.then(() => { render(0) })
render(Number(new URLSearchParams(location.search).get('t') ?? 0))
