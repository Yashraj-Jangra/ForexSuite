# todo.md — VaultBill Project Tracker

## Session 4 — 2026-08-24 (System Audit, Verification & Code Integrity Fixes)

### ✅ Completed — Security & Integrity Hardening

#### API & Data Integrity
- **Invoice Soft-Delete Isolation**: Updated `invoices.list` and `invoices.get` to filter out soft-deleted records (`isNull(invoices.deletedAt)`) by default, with an optional `includeDeleted: boolean` flag for compliance reporting.
- **e-FIRC & EDPMS Router**: Extended `apps/api/src/modules/fircs/router.ts` with `eFircReference`, `adBankName`, `remitterName`, `shortRealizationFlag`, `shortRealizationAmount`, `shortRealizationReason`, and `edpmsStatus` support for both create and update operations.
- **LUT Registry with GST ARN**: Extended `apps/api/src/modules/luts/router.ts` with GST Portal Acknowledgment Number (ARN), financial year tracking, and auto-renew reminder flags.

#### Frontend UI & Regulatory Workflows
- **Customer KYC Edit Modal**: Enhanced `apps/web/src/app/(dashboard)/customers/page.tsx` with a live editing modal for full KYC profiles (Passport, Gender, Nationality, Place of Supply, Purpose, Destination), delete confirmation, and feedback notifications.
- **e-FIRC & EDPMS Reconciliation Interface**: Enhanced `apps/web/src/app/(dashboard)/compliance/firc/page.tsx` with short-realization indicators, AD bank details, EDPMS status badges, and invoice matching.
- **LUT Registry Management**: Enhanced `apps/web/src/app/(dashboard)/compliance/lut/page.tsx` with GST ARN tracking, FY selector, and active status indicators.
- **Super Admin Impersonation Wiring**: Injected `x-impersonate-tenant-id` header in `TrpcProvider.tsx` and added a sticky Impersonation Mode banner with 1-click Exit in `(dashboard)/layout.tsx`.

#### Verification & Typechecks
- `@vaultbill/api`: `tsc --noEmit` → **0 errors (Exit 0)** ✅
- `@vaultbill/web`: `tsc --noEmit` → **0 errors (Exit 0)** ✅
- `@vaultbill/db`: `tsc --noEmit` → **0 errors (Exit 0)** ✅
- `@vaultbill/shared`: `tsc --noEmit` → **0 errors (Exit 0)** ✅
- `@vaultbill/pdf`: `tsc --noEmit` → **0 errors (Exit 0)** ✅

#### Git History
- Commit: `🛡️ filter soft-deleted invoices and add e-firc edpms fields`
- Commit: `✨ add customer kyc editing modal and edpms reconciliation ui`

---

## Session 3 — 2026-08-24 (Super Admin Control Plane Launch)
- Public Schema Control Plane (`platformAuditLog`, `featureFlags`, `platformSmtp`, `platformBackups`)
- Dedicated `/admin` route group & layout
- Command Center, Tenants Directory, Global Users, Platform SMTP, Backups, Flags & Kill Switches, System Health Telemetry, Audit Trail

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

1. **BullMQ Background Workers** — Wire background queue workers for scheduled 4h backups and 30-day LUT expiry checks.
2. **Gmail / GDrive OAuth Endpoints** — Wire OAuth callback routes (`/api/auth/gmail` & `/api/auth/gdrive`) for 1-click Google integrations.
3. **QR Code Generator on Invoices** — Replace QR placeholder with dynamic UPI / invoice verification payload.
