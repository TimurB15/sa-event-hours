import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider } from './lib/store'
import Home from './pages/Home'
import Employees from './pages/Employees'
import Clients from './pages/Clients'
import Reports from './pages/Reports'
import ShiftForm from './pages/ShiftForm'
import Jobs from './pages/Jobs'

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="employees" element={<Employees />} />
            <Route path="clients" element={<Clients />} />
            <Route path="reports" element={<Reports />} />
            <Route path="shift/new" element={<ShiftForm />} />
            <Route path="shift/:id" element={<ShiftForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
