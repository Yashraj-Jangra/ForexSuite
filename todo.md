# todo.md — VaultBill Project Tracker

## Session 10 — 2026-08-25 (Comprehensive Documentation Suite, AI Agentic Workflows & Open Source Standards)

### ✅ Completed — Full Open Source Documentation & Engineering Governance
- **Root Documentation**:
  - `README.md`: Complete project overview, multi-currency invoicing, 4-tier statutory RBI/FBIL forex engine, FEMA 270d, LRS TCS, e-FIRC, FLM-8, architecture ASCII & Mermaid diagrams, quickstart, Docker commands, scripts table.
  - `ARCHITECTURE.md`: Deep technical specifications covering PostgreSQL schema-per-tenant isolation, tRPC pipelines, 4-tier forex hierarchy, Puppeteer PDF rendering, and statutory calculation formulas.
  - `CONTRIBUTING.md`: Contributor guide, zero-error policy (`pnpm typecheck`, `pnpm lint`, `pnpm test`), Gitmoji commit conventions, clean minimal UI guidelines ("Less Div, Sleek & Focused", HSL tokens, Plus Jakarta Sans + JetBrains Mono), code good practices.
  - `CODE_OF_CONDUCT.md`: Contributor Covenant v2.1.
  - `SECURITY.md`: Security guarantees, multi-tenant physical isolation, session security, MinIO path scoping, disclosure SLA.
  - `LICENSE`: Apache License 2.0.
- **AI Agentic Workflows**:
  - `AGENT_RULES.md`: 5 Pillars of Agentic Discipline (Zero-Error Verification Gate, Read-Before-Edit Protocol, Git Hygiene & Atomic Commits, Minimalist UI, Statutory Domain Invariants).
  - `CLAUDE.md`: Universal quick-reference configuration for Claude Code and coding agents.
  - `.pi/rules.md`: Dedicated runtime instructions for Pi agent harness.
- **GitHub Repository Automation**:
  - `.github/pull_request_template.md`: Verification checklist for PR submissions.
  - `.github/ISSUE_TEMPLATE/bug_report.md` & `feature_request.md`: Standardized issue templates.
- **Monorepo Package Documentation**:
  - `apps/web/README.md`, `apps/api/README.md`, `apps/worker/README.md`
  - `packages/db/README.md`, `packages/shared/README.md`, `packages/pdf/README.md`, `packages/config/README.md`
- **Verification & Local Quality Gates**:
  - `pnpm typecheck`: 8 successful out of 8 total tasks (0 errors).
  - `pnpm --filter @vaultbill/shared test`: 23/23 tests passing (100% green).

---

## Session 9 — 2026-08-24 (RBI/FBIL Official Exchange Rate Compliance Engine & Audit Infrastructure)

### ✅ Completed — RBI/FBIL Statutory Reference Rates & Source Transparency
- **DB Schema & Telemetry Migration (`packages/db`)**:
  - Added `sourceProvider` (`FBIL | FEDAI | ECB | BASELINE`) and `rateDate` columns with indexing to `exchange_rates` table.
  - Successfully migrated database schema with `drizzle-kit push`.
- **FBIL-First 4-Tier Synchronization Engine (`apps/api`)**:
  - **Tier 1 (Authoritative Primary)**: `https://api.frankfurter.dev/v1/latest?from=INR&providers=FBIL` pulling daily reference rates computed by Financial Benchmarks India Ltd (FBIL) per RBI mandate (covers USD, EUR, GBP, JPY, AUD, CAD, CHF, SGD, NZD, MYR, THB, HKD, SEK, NOK, DKK, TRY, CNY, ZAR).
  - **Tier 2 (FEDAI Interbank)**: `https://open.er-api.com/v6/latest/USD` for Gulf pairs not published by FBIL (AED, SAR, KWD, QAR, OMR, BHD) adhering to FEMA Rule 7 / FEDAI guidelines.
  - **Tier 3 (ECB Resilience)**: Fallback European Central Bank rates.
  - **Tier 4 (Offline Baseline)**: Resilient static cache fallback.
- **Forex Studio & Provider Filter Matrix (`apps/web/src/app/(dashboard)/settings/rates/page.tsx`)**:
  - Interactive source tabs: `All Sources`, `🔴 RBI/FBIL`, `🟠 FEDAI`, `🔵 ECB`.
  - Color-coded source badges and rate vintage dates on every currency row.
  - Statutory compliance panel detailing RBI/FBIL reference mandate vs FEDAI interbank distinction with direct links to `fbil.org.in` and `RBI Reference Rate Archive`.
- **Site-Wide Currency Rate Integration & Transparency**:
  - **Invoices (`invoices/new/page.tsx`)**: Auto-fetches live RBI/FBIL or FEDAI rates and renders source verification pill.
  - **LRS Compliance (`compliance/lrs/page.tsx`)**: Removed hardcoded `'86.85'` fallback; dynamic conversion with `🔴 RBI/FBIL Official` / `🟠 FEDAI` source tags.
  - **Dashboard (`dashboard/page.tsx`)**: Upgraded live ticker with source indicator dots and updated subtitle copy.
  - **Landing Page (`page.tsx`)**: Sourcing FAQ and features updated to reflect statutory RBI/FBIL daily reference rates.
  - **Background Worker (`apps/worker/src/jobs/rate-sync.ts`)**: Upgraded to FBIL-first dual-strategy syncing.
- **Verification & Local Commits**:
  - All packages (`@vaultbill/api`, `@vaultbill/web`, `@vaultbill/db`, `@vaultbill/worker`) compile with 0 errors.
  - Browser subagent verified filtering, source indicators, and live sync execution.

---

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
  - Commit: `🐛 fix rates sync mutation permissions and payload parsing`
  - Commit: `🎨 polish rates chart tooltip spacing, typography hierarchy, and remove raw XY labels`

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
