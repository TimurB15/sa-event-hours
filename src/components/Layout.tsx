import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function Layout() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-24">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur">
        <img
          src="/brand/sa-event-logistics-logo.png"
          alt="SA Event Logistics"
          className="h-10 w-10 rounded-full border border-line object-cover"
        />
        <div>
          <h1 className="text-base font-extrabold leading-tight text-ink">שעות עובדים</h1>
          <p className="text-[11px] font-medium leading-tight text-muted">SA Event Logistics</p>
        </div>
      </header>
      <main className="px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
