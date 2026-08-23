# VaultBill — Production-Ready Build Plan

## Decisions Locked

| Decision | Choice |
|----------|--------|
| API layer | tRPC between Next.js ↔ Fastify |
| ESLint | Flat config (`eslint.config.js`) |
| Testing | Business logic only (vitest on TCS, GST, FLM-8, FIRC matching) |
| Multi-tenancy | Schema-per-tenant (PostgreSQL) |
| Compliance | Per-workspace toggles (exporter + money changer) |
| Rate cache TTL | Configurable from settings panel (default: 1h) |
| Dev env | Windows (pnpm dev) + WSL (Docker containers) |
| Prod env | VPS + docker-compose + Caddy + GitHub Actions |

---

## Build -1 — Pre-Flight Fixes

- ESLint flat config — every package.json has `"lint": "eslint src/"` but no ESLint exists
- DB migration includes tenant tables (currently only public.ts is configured)
- Illustration SVGs for landing page (16 references, directory is empty)
- Clean root config (empty .npmrc, dead manifest ref, .gitignore gaps)
- `pnpm-workspace.yaml` has interactive artifact text — clean up

---

## Phase 1 — Auth & Multi-Tenancy Backbone (Weeks 1-2)

### 1A — Better Auth

- Better Auth config with PostgreSQL adapter, email/password, sessions in cookies
- Fastify `onRequest` middleware for session validation, injects `req.user` and `req.tenant`
- Auth routes: signup, login, logout, session, forgot/reset password
- tRPC context created from auth session (user + tenant info)
- Root tRPC router plugging into Fastify via `@trpc/server/adapters/fastify`

### 1B — Tenant Schema Provisioning

- `provisionTenantSchema(tenantId)` — creates `tenant_{id}` schema, runs tenant template migration, seeds defaults
- `createTenantDb(tenantId)` — returns drizzle instance scoped to tenant schema
- Tenant middleware sets DB scope per request

### 1C — Auth Pages (`apps/web`)

- Login, signup pages with forms
- tRPC + React Query provider wrapping the app
- Next.js middleware: redirect authenticated to /dashboard, unauthenticated to /login

### 1D — App Shell

- Dashboard layout with sidebar nav + topbar
- Collapsible sidebar (Dashboard, Invoices, Customers, Compliance, Settings)
- Shell pages: dashboard, customers list, invoices list, settings/compliance, settings/rates

---

## Phase 2 — Customers + Vendors + Currencies (Week 3)

- tRPC routers: customers CRUD, vendors CRUD
- Vendor additional fields: bank details for remittance
- Currencies: enable/disable per workspace, set default. Pre-seed 20 major currencies on tenant creation
- Web pages: `/customers` table + search, `/customers/[id]`, `/vendors` same pattern

---

## Phase 3 — Invoice Engine (Weeks 4-5)

### 3A — Invoice CRUD

- tRPC router with auto-increment invoice numbers, subtotal calc, tax, exchange rate snapshot at generation
- Status lifecycle: draft → sent → paid/overdue/cancelled
- Nested line items (one transaction)

### 3B — PDF Generation

- Rewrite Puppeteer invoice template: proper HTML, items table, tax breakdown, multi-currency (FCY + INR), logo from MinIO
- Template system: shared base wrapper + invoice template + Form A2 template
- Form A2 RBI template layout

### 3C — Currency Rates

- Frankfurter API fetch → Redis cache → DB history
- BullMQ repeatable job (interval from tenant settings)
- Settings UI: last sync time, manual refresh, interval config
- Snapshot rate on invoice at generation time

### 3D — Invoice UI

- `/invoices` table with filters, `/invoices/new` wizard, `/invoices/[id]` detail + actions

---

## Phase 4 — GST Tax Engine (Week 6)

- Tax config per tenant: GSTIN, business state, HSN codes
- CGST/SGST/IGST split rules (same state vs different state)
- Zero-rated export with valid LUT
- HSN code seed data + smart suggestions
- Invoice integration: auto-detect tax split, display on PDF
- Vitest: GST split rules, GSTIN validation

---

## Phase 5 — Exporter Compliance (Weeks 7-8)

### 5A — LUT Registry

- CRUD for LUT registrations (reference, dates, authority, PDF upload to MinIO)
- Auto-apply to export invoices, expiry warnings on dashboard

### 5B — FIRC Manager

- CRUD for FIRC documents with unmapped balance tracking
- Interactive invoice-matching board: link FIRCs to invoices, real-time reconciliation
- PDF upload to MinIO

### 5C — FEMA 270-Day Tracker

- Daily BullMQ cron: query unpaid export invoices, flag by age
- Statuses: ok (<180 days), warning (180-239), critical (240+)
- Dashboard widget: compliance scorecard with alert counts
- Vitest: FEMA aging logic, FIRC matching math

---

## Phase 6 — LRS Remittances + Form A2 (Weeks 9-10)

### 6A — Remittances Engine

- CRUD for outbound remittance records with remitter/bank/beneficiary details
- PAN-wise financial year cumulative tracking
- $250K LRS annual limit warning on dashboard

### 6B — TCS Engine

- Progressive rules: 0% under ₹7L, 0.5%/5%/20% above threshold based on purpose
- Unit-tested: threshold crossing, FY boundaries, multiple remittances

### 6C — Form A2 PDF

- RBI Form A2 generator with seeded purpose code directory
- Auto-fill from remittance record, downloadable PDF

### 6D — Compliance UI

- `/compliance/lrs` — PAN-wise dashboard, Form A2 wizard
- RBI purpose codes seeded in `@vaultbill/config`

---

## Phase 7 — FLM-8 Money Changer (Weeks 11-12)

### 7A — Forex Transactions

- Cash note trade CRUD (purchase/sale by category)
- KYC tracking (customer name, passport)

### 7B — FLM-8 Monthly Statement

- Monthly aggregator: opening balance, category-wise purchases/sales, closing balance
- Balance equation validator: Closing = Opening + Purchases - Sales
- Excel/CSV export matching RBI template format

### 7C — Compliance Toggle Wiring

- `/settings/compliance` toggles enable Exporter or Money Changer features
- Sidebar dynamically shows/hides compliance sections
- Vitest: FLM-8 balance solver, category aggregation

---

## Phase 8 — Communications & Delivery (Week 13-14)

- Resend email via BullMQ worker (invoice PDFs, payment reminders, FEMA alerts)
- WhatsApp Cloud API integration (gated on Meta approval)
- HTML email templates
- Delivery status tracking on invoice detail page
- Tenant email settings

---

## Phase 9 — PWA & Offline (Week 15)

- `manifest.json`, service worker, app shell caching
- Offline invoice creation via IndexedDB, background sync
- Push notifications for FEMA alerts and payment reminders
- Lighthouse PWA score >90

---

## Phase 10 — Production Infrastructure (Week 16-17)

### 10A — Dockerfiles

- Multi-stage Dockerfiles: api (node:22-alpine), web (Next.js standalone), worker (BullMQ only)
- Entrypoint: migrate → start server
- Health checks, graceful shutdown, resource limits

### 10B — Production Compose + Caddy

- `docker/compose.prod.yml` — all 5 services + Caddy reverse proxy
- `docker/Caddyfile` — routing, SSL via Let's Encrypt, security headers
- Volume persistence, restart policies

### 10C — CI/CD

- `.github/workflows/ci.yml` — lint, typecheck, test on PR
- `.github/workflows/deploy.yml` — build images, push to ghcr.io, SSH deploy to VPS on push to main
- Automated pg_dump backups to MinIO, retention: 7 daily + 4 weekly + 3 monthly

---

## Phase 11 — Polish & Docs (Week 18)

- Error boundaries, loading states (skeletons), empty states with CTAs
- Dashboard analytics: revenue trends, invoice aging, compliance health
- README, deployment guide, dev setup guide, API docs, architecture doc
- Security audit: SQL injection, CORS, session security, file upload validation, secrets handling

---

## Defect Log

| # | Issue | Phase |
|---|-------|-------|
| 1 | No ESLint config | Build -1 |
| 2 | `drizzle.config.ts` only includes public schema | Build -1 |
| 3 | Illustration SVGs missing | Build -1 |
| 4 | `manifest.json` referenced but doesn't exist | Build -1 |
| 5 | `pnpm-workspace.yaml` has interactive artifact text | Build -1 |
| 6 | Tenant schema defined but no provisioning | Phase 1 |
| 7 | API only has `/health` — no auth, no routes | Phase 1 |
| 8 | Worker is a no-op | Phase 3 |
| 9 | PDF template uses naive string replace | Phase 3 |
| 10 | No shared API types (will get from tRPC) | Phase 1 |
| 11 | No route protection — all pages public | Phase 1 |
| 12 | `@vaultbill/config` missing RBI codes, HSN, TCS rules | Phase 4/6 |
| 13 | `@vaultbill/shared` missing GST/TCS calc functions | Phase 4/6 |
| 14 | PWA referenced but no files | Phase 9 |

---

## Gates Per Phase

| Phase | Lint | Typecheck | Tests | Manual Verification |
|-------|------|-----------|-------|---------------------|
| -1 | ✓ | ✓ | - | ESLint runs, migrations generate, SVGs render |
| 1 | ✓ | ✓ | auth unit | Login/signup flow, tenant schema created |
| 2 | ✓ | ✓ | - | Customer CRUD, tenant isolation verified |
| 3 | ✓ | ✓ | totals, rates | Invoice → PDF renders, rates synced |
| 4 | ✓ | ✓ | GST splits, GSTIN | Same/inter-state/export invoices |
| 5 | ✓ | ✓ | FEMA aging, FIRC math | FIRC matching, 270-day alert |
| 6 | ✓ | ✓ | TCS rules, PAN cumulative | Form A2 PDF, $250K warning |
| 7 | ✓ | ✓ | FLM-8 balance solver | Monthly statement export |
| 8 | ✓ | ✓ | - | Invoice email delivered |
| 9 | ✓ | ✓ | - | PWA installable, offline works |
| 10 | ✓ | ✓ | - | Full stack boots on fresh VPS |
| 11 | ✓ | ✓ | - | Docs reviewed, security checklist cleared |