# todo.md — VaultBill Project Tracker

## Session 2 — 2026-08-24 (6-Pillar Improvement Sprint)

### ✅ Completed

#### DB Schema (`packages/db/src/schemas/tenant.ts`)
- Extended `invoices` — added `deletedAt` (soft-delete for FEMA 5-year retention)
- Extended `fircs` — added e-FIRC / EDPMS fields: `eFircReference`, `adBankName`, `remitterName`, `shortRealizationFlag/Amount/Reason`, `compoundingRequired`, `edpmsStatus`
- Extended `lutRegistrations` — added `gstPortalAckNumber`, `financialYear`, `autoRenewReminder`, `reminderSentAt`
- Extended `forexTransactions` — added `transactionSlipNumber`, `denominationDetails` (jsonb), `isRectified`, `verifiedById`, `customerPan`, `customerPassportExpiry`
- NEW `emailSettings` table — 3-mode: VaultBill / Gmail OAuth / SMTP (encrypted)
- NEW `backupConfig` table — schedule + GDrive + S3/MinIO config (secrets encrypted)
- NEW `edfRecords` table — EDF/SOFTEX replacement (FEMA 2026, Oct 1 deadline)
- NEW `tenantMembers` table — per-tenant RBAC (owner/admin/accountant/viewer)
- `audit_log` table — already existed; push succeeded

#### API Modules
- **NEW** `apps/api/src/modules/edf/router.ts` — full CRUD, status lifecycle, purpose codes, summary
- **NEW** `apps/api/src/modules/email/router.ts` — AES-256-GCM encrypted SMTP, Gmail OAuth stub, test send
- **NEW** `apps/api/src/modules/backups/router.ts` — schedule config, S3 config (encrypted), manual trigger
- **UPDATED** `apps/api/src/modules/invoices/router.ts` — invoice freeze at API level:
  - `updateStatus`: blocks mutations on `paid`/`cancelled` with FORBIDDEN TRPCError
  - `delete`: soft-delete only; blocks `sent`/`paid` from deletion
- Registered `edf`, `email`, `backups` in main tRPC router

#### Frontend — Web App
- **NEW** `apps/web/src/context/business-profile-context.tsx` — single-fetch context provider
- **UPDATED** `apps/web/src/app/(dashboard)/layout.tsx` — wraps in BusinessProfileProvider, shows tenant logo or initials fallback in header
- **UPDATED** `apps/web/src/components/Sidebar.tsx` — dynamic company name/logo, EDF (NEW badge), FLM Registers, Email Settings, Team & Access, Backups nav links
- **NEW** `/compliance/edf/page.tsx` — EDF filing tracker, regulatory notice, purpose code selector, status lifecycle, filing checklist
- **NEW** `/compliance/flm1-7/page.tsx` — FLM-1 daily summary, FLM-2/3 purchase/sale registers with filters
- **NEW** `/settings/email/page.tsx` — 3-mode email delivery, SMTP config, test send
- **NEW** `/settings/backups/page.tsx` — 3-tier backup destinations, schedule, danger-zone restore
- **NEW** `/settings/team/page.tsx` — invite modal, role selector, permissions matrix
- **UPDATED** `apps/web/src/app/(dashboard)/invoices/[id]/page.tsx` — freeze banner, action buttons hidden for finalized invoices

#### Git
- Commit: `✨ add branding, edf, email, backups, team, flm registers, invoice freeze` (15 files, +2614 lines)

---

## Previous Session — 2026-08-24 (FFMC Cash Memo)
- Full Cash Memo PDF with RBI/GSTIN/CIN/PAN header, KYC, forex table, GST block
- Business Profile settings, Customer KYC fields
- Commit: `✨ add full FFMC Cash Memo invoicing system`

---

## Next Steps (Priority Order)

1. **TCS Engine** — `packages/shared/src/tcs.ts` progressive rate (7% ≤ ₹7L, 20% > ₹7L LRS)
   Wire into `remittances/router.ts`; create `/compliance/lrs/pan-dashboard`
2. **FIRC e-FIRC UI** — Update FIRC create/edit forms to surface EDPMS/short-realization fields
3. **LUT Expiry Cron** — BullMQ `lut-expiry-checker` job in worker (fires 30 days before expiry)
4. **Audit Log UI** — `/settings/audit-log/page.tsx`
5. **Dashboard Health Widget** — lastBackupAt, DB status, LUT expiry countdown
6. **QR Code on invoices** — replace placeholder
7. **Customer Edit** — KYC fields in edit flow

## Known Issues / Edge Cases
- `nextInvoiceNumber` may desync under concurrent creates (acceptable for FFMC low-volume)
- Gmail OAuth callback (`/api/auth/gmail`) not yet wired — redirects to 404
- GDrive connect (`/api/auth/gdrive`) not yet wired — same
- `backups.triggerManual` returns `queued: true` but BullMQ job not yet registered in worker
- `forexTransactions` denomination JSON shape not yet validated on frontend (raw jsonb)
