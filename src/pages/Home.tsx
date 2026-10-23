import { ArrowUpLeft, CalendarDays, Clock3, Plus, UsersRound, BriefcaseBusiness, Cloud, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { formatILS, shiftAmount, todayISO } from '../lib/storage'
export default function Home() {
  const { data } = useStore()
  const today = todayISO()
  const recent = [...data.shifts].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5)
  const todayJobs = data.jobs.filter(j => j.date === today && j.status !== 'cancelled')
  const open = data.jobs.filter(j => j.status === 'open')
  const todayShifts = data.shifts.filter(s => s.date === today)
  const monthShifts = data.shifts.filter(s => s.date.startsWith(today.slice(0,7)))
  const total = monthShifts.reduce((sum,s) => sum + shiftAmount(s), 0)
  const dayTitle = new Intl.DateTimeFormat('he-IL',{timeZone:'Asia/Jerusalem',weekday:'long',day:'numeric',month:'long'}).format(new Date())
  return <div className="dashboard">
    <div className="page-heading"><div><p className="eyebrow">{dayTitle}</p><h1>כל האירוע. בשליטה.</h1><p className="supporting">הצוות, העבודות והשעות — במקום אחד.</p></div><span className="avatar">SA</span></div>
    <section className="overview-card" aria-label="תמונת מצב"><div className="overview-top"><span className="light-label">תמונת מצב · החודש</span><span className="live-pill"><span/> יומן מקומי</span></div><p className="overview-caption">שכר עובדים שנרשם</p><strong className="overview-amount" dir="ltr">{formatILS(total)}</strong><div className="overview-foot"><span><Clock3 size={15}/>{Math.round(monthShifts.reduce((a,s)=>a+s.hours,0)*100)/100} שעות מדווחות</span><Link to="/reports">לדוח המלא <ArrowUpLeft size={16}/></Link></div></section>
    <div className="metric-grid"><Link className="metric-card" to="/jobs"><span className="metric-icon"><CalendarDays size={20}/></span><strong>{todayJobs.length}</strong><span>עבודות היום</span><small>{open.length} עבודות פתוחות</small></Link><Link className="metric-card" to="/employees"><span className="metric-icon"><UsersRound size={20}/></span><strong>{data.employees.length}</strong><span>אנשי צוות</span><small>{todayShifts.length} משמרות נרשמו היום</small></Link></div>
    <div className="section-heading"><h2>מכאן מתחילים</h2><span>פחות הקלדות. יותר עשייה.</span></div>
    <div className="quick-actions"><Link to="/shift/new" className="quick-action"><span className="quick-icon solid"><Plus size={23}/></span><strong>רישום משמרת</strong><small>שעות ושכר</small></Link><Link to="/jobs" className="quick-action"><span className="quick-icon"><BriefcaseBusiness size={23}/></span><strong>לוח עבודות</strong><small>פרסום ושיבוץ</small></Link><Link to="/cloud" className="quick-action"><span className="quick-icon"><Cloud size={23}/></span><strong>עבודה משותפת</strong><small>כניסה לצוות</small></Link></div>
    <div className="section-heading"><h2>הפעילות האחרונה</h2><Link to="/reports">הצג הכל <ArrowUpLeft size={15}/></Link></div>
    {recent.length ? <div className="activity-list">{recent.map(s => <Link to={`/shift/${s.id}`} key={s.id} className="activity-row"><span className="person-avatar">{data.employees.find(e=>e.id===s.employeeId)?.name.slice(0,1)??'—'}</span><div className="activity-copy"><strong>{data.employees.find(e=>e.id===s.employeeId)?.name??'—'}</strong><span>{data.clients.find(c=>c.id===s.clientId)?.name??'—'} · {s.date} · {s.hours} שע׳</span></div><div className="activity-amount"><strong>{formatILS(shiftAmount(s))}</strong><span><Check size={12}/> נרשם ביומן</span></div></Link>)}</div> : <div className="empty-state"><span className="empty-icon"><CalendarDays size={29}/></span><h3>אירוע מוצלח מתחיל בסדר</h3><p>הוסיפו משמרת או פרסמו עבודה ראשונה.<br/>הפעילות והסיכומים יופיעו כאן.</p><Link to="/shift/new" className="btn-primary"><Plus size={18}/> רישום משמרת ראשונה</Link></div>}
    <div className="local-note"><Cloud size={17}/><p>היומן הזה נשמר במכשיר בלבד. <Link to="/cloud">כניסה לסביבת העבודה המשותפת</Link></p></div>
  </div>
}
