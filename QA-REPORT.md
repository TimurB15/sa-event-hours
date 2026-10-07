# QA Report — SA Event Logistics (shiurei-ovdim)

**Date:** 2026-10-07 (Asia/Jerusalem)  
**Scope:** Code review of `src/` + asset checks + formula/claim unit checks + HTTP smoke on `http://127.0.0.1:5174/`  
**Method:** No browser automation available; verified via source, `tsc -b`, curl, mirrored calc/claim scripts.  
**Preview:** `vite preview` on `:5174` → HTTP **200** (/, /jobs, /employees, /clients, /reports, /shift/new); logo/favicon/floral pattern **200**.

## Overall: **PASS**

Core product requirements are implemented correctly: LocalStorage CRUD, shift math, open-jobs claim → shift, reports + CSV, RTL nav, black/white brand. Minor UX/wording gaps only; nothing blocking a friend demo via tunnel (with LocalStorage caveats below).

---

## Checklist

| # | Requirement | Result | Notes |
|---|-------------|--------|-------|
| 1 | Employees CRUD (name + default hourly rate, edit/delete) | **Pass** | `Employees.tsx` + `store.add/update/deleteEmployee`. Seed rates 40/50/60. |
| 2 | Clients CRUD (e.g. טל/עידו/אבי) | **Pass** | Full CRUD in `Clients.tsx`. Seed clients are כהן/לוי/מזרחי; טל/עידו/אבי are seed **employees** (examples only). |
| 3 | Shift: date, employee, client, morning/evening, hours or start–end, rate default/override, amount = hours × rate | **Pass** | `ShiftForm.tsx`; `shiftAmount` / `hoursFromRange` in `storage.ts`. Overnight range handled. |
| 4 | Reports: by employee / by client / date range; export CSV/Excel columns | **Pass*** | Totals + tabs in `Reports.tsx`. CSV export with BOM (`exportCsv`). No native `.xlsx` (CSV opens in Excel). Columns: תאריך, עובד, אצל מי, משמרת, שעות, תעריף, סכום (where ≡ client). |
| 5 | LocalStorage only; optional seed 3 clients + 2–3 employees @ 40/50/60; no fake stats | **Pass** | Key `shiurei-ovdim-v1`. Seed: 3 employees + 3 clients; `shifts: []`, `jobs: []`. No backend/`fetch`. |
| 6 | Open jobs board: publish, claim «אני לוקח» immediate → shift, leave open list; manager edit/cancel | **Pass** | `Jobs.tsx` + `claimJob` in `store.tsx`. Status `open`→`claimed`; creates shift; double-claim blocked. |
| 7 | Nav: היום · עבודות · עובדים · לקוחות · דוחות | **Pass** | `BottomNav.tsx` exact labels/routes. |
| 8 | Brand: white/black, floral #D0D0D0, primary black, no purple/green/gradients; logo + favicon | **Pass** | `index.css`, `floral-branches.svg` stroke `#D0D0D0`, header logo, `favicon.png`. Unused template `src/assets/vite.svg` has purple but is **not imported**. |

\*CSV/Excel: CSV only (Excel-compatible); acceptable for demo.

---

## Calculation & claim verification

| Check | Result |
|-------|--------|
| `shiftAmount`: 8×50=400, 7.5×40=300, 6.25×60=375 | Pass |
| `hoursFromRange`: 08:00–16:00=8, 22:00–06:00=8, 09:30–13:00=3.5 | Pass |
| Claim: open → claimed + shift (hours=estimated or **8**); leaves open filter; second claim fails | Pass |
| Rate on claim = employee `defaultRate` | Pass (`store.tsx` ~106–114) |

Key code:

- Amount: `src/lib/storage.ts:68-69` — `Math.round(s.hours * s.rate * 100) / 100`
- Claim: `src/lib/store.tsx:102-129` — status gate, shift insert, job claimed atomically

---

## Bugs / gaps

| Sev | Issue | Location |
|-----|-------|----------|
| **Low** | Rate field labeled «תעריף ליום» but value is hourly ₪/שעה | `ShiftForm.tsx:173` |
| **Low** | No native Excel (`.xlsx`); CSV-only export | `storage.ts:90-114`, `Reports.tsx:69` |
| **Low** | Claim without `estimatedHours` hardcodes **8** hours — can overstate pay if publish forgot estimate | `store.tsx:106` |
| **Info** | Seed uses טל/עידו/אבי as employees, not clients (spec “e.g.”) | `storage.ts:9-19` |
| **Info** | Single-device demo: claim picks employee from dropdown (no worker login) | `Jobs.tsx:211-227` |
| **Info** | `resetDemo` in store has no UI button | `store.tsx:131` |
| **Info** | Leftover purple Vite logo asset unused | `src/assets/vite.svg` |

No High/Critical functional bugs found in reviewed paths.

---

## Tunnel / friend-demo notes

**Safe to show** for a product walkthrough, with expectations:

1. Data is **browser LocalStorage only** — friend’s phone/PC gets its own empty→seeded store; not shared with the publisher’s data.
2. Manager + worker are the same UI (no roles/auth).
3. Tunnel already pointed at `:5174` (cloudflared process observed); SPA routes return 200.

---

## Files reviewed

`types.ts`, `storage.ts`, `store.tsx`, `App.tsx`, `main.tsx`, `index.css`, `index.html`, `Layout.tsx`, `BottomNav.tsx`, pages: `Home`, `Jobs`, `Employees`, `Clients`, `Reports`, `ShiftForm`, `public/brand/*`, `public/favicon*`, `public/patterns/floral-branches.svg`.
