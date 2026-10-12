import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Skeleton } from './components/ui'
import Overview from './pages/Overview'

// Overview loads first; every other page (and Recharts) is split into its own chunk.
const Models = lazy(() => import('./pages/Models'))
const ModelDetail = lazy(() => import('./pages/ModelDetail'))
const Compare = lazy(() => import('./pages/Compare'))
const Charts = lazy(() => import('./pages/Charts'))
const Method = lazy(() => import('./pages/Method'))
const Predict = lazy(() => import('./pages/Predict'))
const About = lazy(() => import('./pages/About'))

function Loading() {
  return (
    <div className="flex flex-col gap-4 p-7" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-80" />
      <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="p-7">
      <h1 className="text-[30px] font-bold text-title">Page not found</h1>
      <p className="mt-2 text-muted">That address is not part of the handbook. <Link to="/" className="underline">Go to the overview</Link> or press Cmd+K to search.</p>
    </div>
  )
}

export default function App() {
  return (
    <Shell>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/models" element={<Models />} />
          <Route path="/models/:key" element={<ModelDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/method" element={<Method />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Shell>
  )
}
