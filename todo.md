# todo.md — VaultBill Project Tracker

## Session 5 — 2026-08-24 (Customizable Multi-Style PDF Invoice Engine & Live Preview)

### ✅ Completed — 5 PDF Invoice Design Archetypes & Customizer

#### PDF Rendering Engine (`packages/pdf`)
- **`invoice-modern.ts`**: Modern Minimalist layout with subtle rounded borders, refined typography, pill badges, and right-aligned summary card.
- **`invoice-executive.ts`**: Executive Slate layout with deep slate header band, dual-tone table rows, authoritative corporate seal styling, and prominent framed totals.
- **`invoice-classic.ts`**: Classic Heritage FFMC layout with traditional full double-border box grid, formal serif typography, and authentic money-changer look.
- **`invoice-minimal.ts`**: Clean Swiss Monochrome layout with high-contrast typography, sharp rules, and zero background ink waste (ideal for thermal/laser printers).
- **`invoice-corporate.ts`**: Neo-Corporate layout with gradient top accent line, floating card modules, and badge pills for SAC & purpose codes.
- **`invoice.ts`**: Dynamic dispatcher routing to the selected template style while guaranteeing 100% data fidelity across all RBI/FEMA/GST regulatory fields.

#### Database & Schema (`packages/db`)
- Added `invoiceTemplate` ('modern' | 'executive' | 'classic' | 'minimal' | 'corporate') and `invoiceAccentColor` to `businessProfile` schema in `tenant.ts`.
- Pushed schema changes via `drizzle-kit push` (`[✓] Changes applied`).

#### Backend API (`apps/api`)
- Updated `invoices/pdf.ts` to pass tenant's default `invoiceTemplate` and `invoiceAccentColor` (with support for per-request overrides).
- Added `previewHtml` tRPC query in `business-profile/router.ts` to render real-time sample Cash Memos in the browser for any template and accent color combination.

#### Web Settings & Live Preview (`apps/web`)
- Updated `settings/profile/page.tsx` with:
  - Visual template selector cards with archetype badges and layout descriptions.
  - Accent color picker with 7 curated business color presets (Sapphire, Slate, Emerald, Indigo, Ruby, Amber, Monochrome).
  - **Live PDF Preview Modal** with iframe rendering of actual invoice output before saving.

#### Verification & Typechecks
- `@vaultbill/api`: `tsc --noEmit` → **0 errors (Exit 0)** ✅
- `@vaultbill/web`: `tsc --noEmit` → **0 errors (Exit 0)** ✅
- `@vaultbill/db`: `tsc --noEmit` → **0 errors (Exit 0)** ✅
- `@vaultbill/pdf`: `tsc --noEmit` → **0 errors (Exit 0)** ✅

#### Git History
- Commit: `🎨 add 5 customizable pdf invoice templates and rendering engine`
- Commit: `✨ add invoice template visual picker and live preview to settings`
- Commit: `🐛 fix invoice pdf preview rendering and screen modal positioning`

---

## Session 4 — 2026-08-24 (System Audit, Verification & Code Integrity Fixes)
- Invoice Soft-Delete Isolation (`isNull(deletedAt)`)
- Customer KYC Editing Modal with auto-fill
- e-FIRC & EDPMS Reconciliation API & UI
- LUT Registry Form GST RFD-11 Tracking

---

## Session 3 — 2026-08-24 (Super Admin Control Plane Launch)
- Public Schema Control Plane (`platformAuditLog`, `featureFlags`, `platformSmtp`, `platformBackups`)
- Dedicated `/admin` route group & layout
- Command Center, Tenants Directory, Global Users, Platform SMTP, Backups, Flags, System Health, Audit Trail

---

## Next Steps (Priority Order)

1. **BullMQ Background Workers** — Wire background queue workers for scheduled 4h backups and 30-day LUT expiry checks.
2. **Gmail / GDrive OAuth Endpoints** — Wire OAuth callback routes (`/api/auth/gmail` & `/api/auth/gdrive`) for 1-click Google integrations.
3. **Dynamic QR Code Payload** — Dynamic UPI / invoice verification payload encoding.
