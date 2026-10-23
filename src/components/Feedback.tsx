import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
export function Loading() {
  return <div className="skeleton-stack" role="status" aria-label="טוען"><div className="skeleton h-36"/><div className="grid grid-cols-2 gap-3"><div className="skeleton h-24"/><div className="skeleton h-24"/></div><div className="skeleton h-44"/></div>
}
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <main className="recovery" dir="rtl"><AlertTriangle size={32}/><h1>לא ניתן לטעון את האפליקציה</h1><p>הנתונים המקומיים המקוריים נשמרו. נסו לטעון שוב; אם הבעיה נמשכת, שמרו גיבוי לפני התקנה מחדש.</p><button className="btn-primary" onClick={() => location.reload()}>טעינה מחדש</button><button className="btn-secondary" onClick={() => { const raw = localStorage.getItem('shiurei-ovdim-v1'); if (raw) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' })); a.download = 'sa-recovery.json'; a.click() } }}>שמור נתונים מקוריים</button></main> : this.props.children
  }
}
