# todo.md — VaultBill Project Tracker

## Session 8 — 2026-08-24 (Exchange Rates Engine, Live Forex Studio & Historical Charts)

### ✅ Completed — Exchange Rates Accuracy & Live Sync Studio
- **Indian Standard Forex Notation**: Standardized all exchange rates across VaultBill as `1 Foreign Currency Unit = INR Price` (e.g. `1 USD = ₹86.85`, `1 EUR = ₹94.40`, `1 AED = ₹23.65`).
- **Multi-Provider Live Sync Engine (`apps/api`)**:
  - Live upstream fetch from `open.er-api.com` with `api.frankfurter.app` fallback.
  - Calculated 24h % change, 24h high/low, inverse rates, and 7/30/90-day time-series history generator.
- **Redesigned Exchange Rates Studio (`apps/web/src/app/(dashboard)/settings/rates/page.tsx`)**:
  - Live status indicator & last sync relative time
  - Interactive SVG historical rate trend chart with 7D / 30D / 90D timeframes
  - Searchable 25+ global currency pairs matrix with 24h change indicators
  - Two-way interactive currency conversion calculator with quick swap
  - Sync frequency schedule preferences (15m, 1h, 6h, daily)
- **Live Dashboard Ticker (`apps/web/src/app/(dashboard)/dashboard/page.tsx`)**:
  - Dynamic spot rate ticker powered directly by database quotes
  - Expanded quick converter with 25+ global currency options
- **Verification & Local Commits**:
  - `@vaultbill/api`, `@vaultbill/web`, `@vaultbill/db` typechecks passing with 0 errors.
  - Commit: `✨ overhaul exchange rates engine with live sync, 30d history charts, and dashboard ticker`
  - Commit: `🎨 polish rates trend chart with theme tokens, hover crosshair tooltips, and sourcing notes`
  - Commit: `🐛 fix chart hover and display area alignment with native svg tooltip coordinates`
  - Commit: `🎨 add dual-axis XY coordinate crosshairs and high-precision matrix hover HUD to rates chart`

---

## Session 7 — 2026-08-24 (Split-Screen Auth Redesign & Auto-Redirect Engine)

### ✅ Completed — Authentication Overhaul & Visual Showcase

#### Authentication Redesign & UX (`apps/web`)
- **Split-Screen Layout**:
  - **Form Pane (48% width)**: Clean modern inputs, password visibility toggle (Eye/EyeOff), remember-me checkbox, error banners, theme mode toggle, and smooth routing.
  - **Showcase Pane (52% width)**: Deep neutral charcoal/slate gradient backdrop, live Forex Rates ticker card (USD, GBP, EUR), 5-Pillar Statutory Compliance Seal (FLM-1 to FLM-8, LRS Form A2, e-FIRC & EDPMS, 5 PDF Archetypes), and 256-bit encryption trust indicators.
- **Automated Dashboard Redirect**:
  - **Server-side (`middleware.ts`)**: Automatically redirects authenticated users with active session cookies from `/login` and `/signup` to `/dashboard`.
  - **Client-side (`login/page.tsx` & `signup/page.tsx`)**: Mounted auth probe via `/api/trpc/me` that smoothly pushes to `/dashboard` if an active session is detected.

#### Verification & Typechecks
- `@vaultbill/api`: `tsc --noEmit` → **0 errors (Exit 0)** ✅
- `@vaultbill/web`: `tsc --noEmit` → **0 errors (Exit 0)** ✅
- `@vaultbill/db`: `tsc --noEmit` → **0 errors (Exit 0)** ✅

#### Git History
- Commit: `🎨 redesign auth login and signup with split-screen hero showcase and auto-redirect`
- Commit: `🎨 integrate new undraw illustration library and replace old placeholders across all pages`

---

## Session 6 — 2026-08-24 (Personal Account Management, Telemetry & Session Control)
- Personal Profile Management (Name, Email, Phone, Designation, Avatar)
- Security Telemetry Snapshot (Last accessed time, IP, parsed device)
- Active Login Sessions Manager with remote revocation
- Widescreen Side-by-Side PDF Studio & Fullscreen Modal Scrolling Fix
- Aligned `tenant_members.tenant_id` to UUID foreign key

---

## Session 5 — 2026-08-24 (Customizable Multi-Style PDF Invoice Engine & Live Preview)
- 5 PDF Invoice Design Archetypes (`modern`, `executive`, `classic`, `minimal`, `corporate`)
- Suite Customization & Color Swatches
- Real-Time Live Preview Modal & Split Preview Window
- Dark theme refined to neutral charcoal grey (`hsl(240 5% 9%)`)

---

## Next Steps (Priority Order)

1. **BullMQ Background Workers** — Wire background queue workers for scheduled 4h backups and 30-day LUT expiry checks.
2. **Gmail / GDrive OAuth Endpoints** — Wire OAuth callback routes (`/api/auth/gmail` & `/api/auth/gdrive`) for 1-click Google integrations.
3. **Dynamic QR Code Payload** — Dynamic UPI / invoice verification payload encoding.
