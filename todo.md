# todo.md — VaultBill Project Tracker

## Session 6 — 2026-08-24 (Personal Account Management, Telemetry & Session Control)

### ✅ Completed — Account Management & Security

#### Database & Schema (`packages/db`)
- Added `phone`, `designation`, and `lastLoginAt` columns to `user` table in `auth.ts`.
- Synchronized schema via `drizzle-kit push` (`[✓] Changes applied`).

#### Backend API (`apps/api`)
- Created `accountRouter` (`apps/api/src/modules/account/router.ts`) with:
  - `account.get`: Returns consolidated user profile (Name, Email, Phone, Designation, Avatar, Role, Super Admin status, Workspace Joined Date, Last Accessed timestamp, IP address, and browser User Agent).
  - `account.update`: Allows updating legal name, phone number, job designation, and avatar photo.
  - `account.sessions`: Lists all active login sessions sorted chronologically.
  - `account.revokeSession`: Terminates remote device sessions.
- Registered `account: accountRouter` in `appRouter`.

#### Frontend UI (`apps/web`)
- Created [`/settings/account`](file:///d:/Projects/Currency%20Manager/apps/web/src/app/(dashboard)/settings/account/page.tsx):
  - User identity hero card with role badge, verified email pill, and avatar upload.
  - Profile edit form for legal name, phone number, and designation.
  - Access timeline snapshot (Last accessed relative time, IP & device parse, creation & workspace join dates).
  - Active device session manager with one-click remote session termination.
- Linked user footer pill in [`Sidebar.tsx`](file:///d:/Projects/Currency%20Manager/apps/web/src/components/Sidebar.tsx) directly to `/settings/account`.
- Added **Account & Security** card to [`/settings`](file:///d:/Projects/Currency%20Manager/apps/web/src/app/(dashboard)/settings/page.tsx).

#### Verification & Typechecks
- `@vaultbill/api`: `tsc --noEmit` → **0 errors (Exit 0)** ✅
- `@vaultbill/web`: `tsc --noEmit` → **0 errors (Exit 0)** ✅
- `@vaultbill/db`: `tsc --noEmit` → **0 errors (Exit 0)** ✅

#### Git History
- Commit: `🗄️ add phone, designation, and last login columns to user schema and account router`
- Commit: `✨ add personal account management, details telemetry, and session manager`

---

## Session 5 — 2026-08-24 (Customizable Multi-Style PDF Invoice Engine & Live Preview)
- 5 PDF Invoice Design Archetypes (`modern`, `executive`, `classic`, `minimal`, `corporate`)
- Suite Customization & Color Swatches
- Real-Time Live Preview Modal & Split Preview Window
- Dark theme refined to neutral charcoal grey (`hsl(240 5% 9%)`)

---

## Session 4 — 2026-08-24 (System Audit, Verification & Code Integrity Fixes)
- Invoice Soft-Delete Isolation (`isNull(deletedAt)`)
- Customer KYC Editing Modal with auto-fill
- e-FIRC & EDPMS Reconciliation API & UI
- LUT Registry Form GST RFD-11 Tracking

---

## Next Steps (Priority Order)

1. **BullMQ Background Workers** — Wire background queue workers for scheduled 4h backups and 30-day LUT expiry checks.
2. **Gmail / GDrive OAuth Endpoints** — Wire OAuth callback routes (`/api/auth/gmail` & `/api/auth/gdrive`) for 1-click Google integrations.
3. **Dynamic QR Code Payload** — Dynamic UPI / invoice verification payload encoding.
