import { Briefcase, ClipboardList, Home, ListTodo, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'היום', icon: Home, end: true },
  { to: '/jobs', label: 'עבודות', icon: ListTodo },
  { to: '/employees', label: 'עובדים', icon: Users },
  { to: '/clients', label: 'לקוחות', icon: Briefcase },
  { to: '/reports', label: 'דוחות', icon: ClipboardList },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold sm:text-xs ${
                isActive ? 'text-ink' : 'text-muted'
              }`
            }
          >
            <t.icon className="h-5 w-5" />
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
