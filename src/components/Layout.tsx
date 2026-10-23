import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Cloud, Moon, Sun, WifiOff } from 'lucide-react'
import { BottomNav } from './BottomNav'

export function Layout() {
  const [online, setOnline] = useState(navigator.onLine)
  const [dark, setDark] = useState(() => localStorage.getItem('sa-appearance') === 'dark')
  const location = useLocation()
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    addEventListener('online', update); addEventListener('offline', update)
    return () => { removeEventListener('online', update); removeEventListener('offline', update) }
  }, [])
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('sa-appearance', dark ? 'dark' : 'light') }, [dark])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [location.pathname])
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand-lockup" aria-label="SA Event Logistics — בית">
          <img src={`${import.meta.env.BASE_URL}brand/sa-event-logistics-logo.png`} alt="" />
          <div><span className="brand-name" dir="ltr">SA EVENT</span><span className="brand-subtitle" dir="ltr">LOGISTICS & PEOPLE</span></div>
        </Link>
        <div className="header-actions"><button className="icon-button" aria-label={dark ? 'מצב בהיר' : 'מצב כהה'} onClick={() => setDark(v => !v)}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button><Link className="icon-button" to="/cloud" aria-label="סביבת עבודה משותפת"><Cloud size={20}/></Link></div>
      </header>
      {!online && <div className="offline-banner" role="status"><WifiOff size={16}/> אין חיבור לרשת — המידע המקומי זמין במכשיר הזה</div>}
      <main className="page-content"><Outlet /></main>
      <BottomNav />
    </div>
  )
}
