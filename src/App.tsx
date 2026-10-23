import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider } from './lib/store'
import { lazy, Suspense } from 'react'
import { Loading } from './components/Feedback'
const CloudWorkspace = lazy(() => import('./pages/Cloud'))
const Home = lazy(() => import('./pages/Home'))
const Employees = lazy(() => import('./pages/Employees'))
const Clients = lazy(() => import('./pages/Clients'))
const Reports = lazy(() => import('./pages/Reports'))
const ShiftForm = lazy(() => import('./pages/ShiftForm'))
const Jobs = lazy(() => import('./pages/Jobs'))

export default function App() {
  return (
    <StoreProvider>
      <HashRouter><Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="cloud" element={<CloudWorkspace />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="employees" element={<Employees />} />
            <Route path="clients" element={<Clients />} />
            <Route path="reports" element={<Reports />} />
            <Route path="shift/new" element={<ShiftForm />} />
            <Route path="shift/:id" element={<ShiftForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense></HashRouter>
    </StoreProvider>
  )
}
