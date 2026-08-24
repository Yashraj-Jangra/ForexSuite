# todo.md — VaultBill Project Tracker

## Session 3 — 2026-08-24 (Super Admin Control Plane & Maintainer Ops)

### ✅ Completed — Platform Super Admin Architecture

#### Database & Schema (`packages/db/src/schemas/public.ts` & `auth.ts`)
- Added `isSuperAdmin`, `banned`, `bannedAt`, `bannedReason` columns to `user` in `auth.ts`
- Extended `tenants` table with `status` ('active' | 'suspended' | 'deleted'), `plan`, `planExpiresAt`, `notes`, `suspendedAt`, `suspendedReason`, `deletedAt`, `customDomain`
- NEW `platformAuditLog` table — immutable 5-year security audit trail for all maintainer actions
- NEW `featureFlags` table — release rollouts, kill switches, and per-tenant overrides
- NEW `platformSmtp` table — default platform relay configuration with AES-256-GCM encryption
- NEW `platformBackups` table — cross-tenant backup orchestration policy & telemetry
- Ran `pnpm push` — all tables and indexes pushed cleanly to PostgreSQL

#### Backend Infrastructure (`apps/api`)
- **`apps/api/src/trpc/context.ts`**:
  - Implemented `superAdminProcedure` enforcing master admin privileges
  - Added cross-tenant impersonation resolution via `x-impersonate-tenant-id` header
  - Added `logAdminAction()` helper recording IP, user agent, actor email, target, and payload
- **`apps/api/src/modules/admin/`**:
  - `tenants.ts` — list, deep inspect, suspend, activate, setPlan, addNote, peek isolated records, delete
  - `users.ts` — global user directory, session termination / force logout, ban/unban, delegate super admin
  - `smtp.ts` — platform SMTP settings, encrypted password storage, live socket diagnostic test
  - `backups.ts` — cross-tenant backup status directory, trigger global backup, trigger single tenant
  - `flags.ts` — feature flags & emergency kill switches toggle, create, delete, tenant overrides
  - `health.ts` — live PostgreSQL socket latency ping, Node runtime RSS/heap memory, uptime
  - `audit.ts` — search and filter immutable platform audit logs
  - `router.ts` — master admin router registered under `admin:` in `appRouter`
- Verified: `pnpm --filter @vaultbill/api typecheck` → Exit 0 ✅

#### Frontend Web Application (`apps/web/src/app/(admin)/`)
- **Dedicated Layout (`(admin)/layout.tsx`)**:
  - Red top bar: "👑 SUPER ADMIN · PLATFORM MAINTAINER CONTROL PLANE"
  - Impersonation status pill with 1-click exit
  - Dedicated admin navigation sidebar (Overview, Tenants, Users, Platform SMTP, Backups, Flags, Health, Audit Log)
  - Theme toggle & tenant workspace switcher
- **Pages**:
  - `/admin` — Master command center, KPIs, database socket latency, memory pressure, quick actions
  - `/admin/tenants` — Tenants directory with plan manager, suspension modal, and workspace impersonator
  - `/admin/tenants/[id]` — Deep tenant inspector, member accounts, business profile, and live database peek
  - `/admin/users` — Global user accounts, session termination, ban enforcement, admin role toggle
  - `/admin/smtp` — Platform default mailer configuration, provider presets, and live test sender
  - `/admin/backups` — Cross-tenant backup policy, multi-cloud S3 sync, and manual snapshot trigger
  - `/admin/flags` — Feature flags & emergency circuit breakers / kill switches
  - `/admin/health` — Real-time telemetry, memory footprint graph, and live polling
  - `/admin/audit-log` — Platform audit trail explorer with JSON payload inspector and CSV exporter
- **Tenant Sidebar Integration (`Sidebar.tsx`)**:
  - Dynamically renders "👑 Super Admin Ops" link for authenticated super administrators
- Verified: `pnpm --filter @vaultbill/web typecheck` → Exit 0 ✅

#### Git History
- Commit: `✨ add super admin backend schema and trpc modules`
- Commit: `🚀 launch super admin control plane with health and audit logs`

---

## Session 2 — 2026-08-24 (6-Pillar Compliance & Branding Sprint)
- Business Profile Context & Custom Logos on Dashboard
- Invoice Freeze API middleware (paid/cancelled locked)
- EDF / SOFTEX compliance module (Oct 1 FEMA 2026 deadline)
- Tenant Email Settings (VaultBill hosted / Gmail OAuth / SMTP)
- Tenant Backups (Local + GDrive + S3)
- FLM-1 to FLM-7 RBI Registers
- Team & Access RBAC

---

## Session 1 — 2026-08-24 (FFMC Cash Memo)
- Full Cash Memo PDF with RBI/GSTIN/CIN/PAN header, KYC, forex table, GST block
- Business Profile settings, Customer KYC fields

---

## Next Steps (Priority Order)

1. **TCS Engine** — Progressive rate computation (7% ≤ ₹7L, 20% > ₹7L) & PAN LRS dashboard
2. **FIRC UI Enhancements** — Surface e-FIRC, EDPMS status, and short-realization flags
3. **LUT Expiry Background Cron** — Automated 30-day renewal reminder
4. **QR Code Generator on Invoices** — Dynamic payload encoding
5. **Customer Edit Dialog** — Add KYC fields to customer edit flow
