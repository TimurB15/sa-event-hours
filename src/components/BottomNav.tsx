import { BriefcaseBusiness, ChartNoAxesCombined, House, UsersRound, CalendarDays } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { tapFeedback } from '../lib/native'
const tabs = [
  { to: '/', label: 'בית', icon: House, end: true },
  { to: '/jobs', label: 'עבודות', icon: CalendarDays },
  { to: '/employees', label: 'הצוות', icon: UsersRound },
  { to: '/clients', label: 'לקוחות', icon: BriefcaseBusiness },
  { to: '/reports', label: 'דוחות', icon: ChartNoAxesCombined },
]
export function BottomNav() {
  return <nav className="bottom-nav" aria-label="ניווט ראשי"><div className="bottom-nav-inner">{tabs.map(t => <NavLink key={t.to} to={t.to} end={t.end} onClick={() => void tapFeedback()} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon"><t.icon size={21} strokeWidth={1.8}/></span><span>{t.label}</span></NavLink>)}</div></nav>
}
