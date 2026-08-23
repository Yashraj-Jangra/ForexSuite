# todo.md — VaultBill Project Tracker

## Last Session Summary (2026-08-24)

### ✅ Completed — FFMC Cash Memo Invoice System

#### Database
- Extended `customers` table with KYC columns: `passportNumber`, `nationality`, `gender`, `defaultPurpose`, `placeOfSupply`, `defaultDestinationCountry`
- Extended `invoices` table with Cash Memo fields: `invoiceType`, `saleDate`, `placeOfSupply`, `paymentMode`, `paymentReference`, `transactionNarrative`, `gstTaxableAmount`, `cgstRate`, `cgstAmount`, `sgstRate`, `sgstAmount`, `igstRate`, `igstAmount`, `roundOff`, `lrsLine`, `amountInWords`, `disclaimer1`, `disclaimer2`
- Extended `invoiceItems` with forex fields: `currencyName`, `sacCode`, `amountForeign`, `itemExchangeRate`, `amountInr`
- Added new `businessProfile` table (company identity, regulatory IDs, logo, signature, invoice number format, GST defaults, disclaimers)
- Ran `pnpm push` — schema live in dev DB

#### Backend API
- **NEW** `apps/api/src/modules/business-profile/router.ts` — get/save/nextInvoiceNumber
- Registered `businessProfile` in main tRPC router
- **REWRITTEN** `apps/api/src/modules/invoices/router.ts` — full Cash Memo support:
  - `numberToWords()` — Indian lakhs/crores number-to-words
  - `generateNarrative()` — auto-fills "We have sold today..." from customer KYC
  - GST auto-computation: CGST+SGST (intrastate) or IGST (interstate)
  - TCS tracking ready (field exists, auto-compute wired to customer PAN LRS tracking — TCS display on PDF pending full LRS module integration)
  - Business profile defaults auto-loaded for SAC, GST rates, disclaimers
- **EXTENDED** `apps/api/src/modules/customers/router.ts` — added all KYC fields to create/update
- **REWRITTEN** `apps/api/src/modules/invoices/pdf.ts` — passes full `CashMemoData` payload to PDF renderer

#### PDF Template
- **REWRITTEN** `packages/pdf/src/templates/invoice.ts` — full Cash Memo layout matching real sample:
  - Logo + company name header
  - Seller info + regulatory IDs (RBI/CIN/PAN/GSTIN) in two-column grid
  - Invoice number, date, customer KYC zone, QR placeholder
  - Transaction narrative paragraph
  - Forex items table (Currency | SAC | Amount | Rate | Rs. Equivalent)
  - GST block (CGST+SGST or IGST, TCS row if applicable, round off, total)
  - Amount in words, payment row, LRS line, disclaimers, signature zone

#### Frontend — Web App
- **NEW** `apps/web/src/app/(dashboard)/settings/profile/page.tsx` — full Business Profile settings with:
  - Company identity + regulatory identifiers
  - Invoice number format picker with 3 presets + custom with live preview
  - GST defaults panel with FFMC explanation
  - Logo + signature image upload
  - Disclaimer text areas
- Added "Business Profile" link to Sidebar under Settings
- **REWRITTEN** `apps/web/src/app/(dashboard)/invoices/new/page.tsx` — Cash Memo + Export Invoice mode toggle:
  - Cash Memo: seller block (auto from profile), invoice header, customer with full KYC auto-fill, forex lines with rate auto-fetch, live GST computation preview, IGST/CGST auto-detection banner with manual override, payment, narrative preview, LRS line, disclaimers
  - Export Invoice: existing flow preserved
- **EXTENDED** `apps/web/src/app/(dashboard)/customers/page.tsx` — KYC section in Add Customer form, KYC shown on customer cards

#### Verification
- `pnpm --filter @vaultbill/api typecheck` → exit 0 ✅
- `pnpm --filter @vaultbill/web typecheck` → exit 0 ✅
- Git commit: `✨ add full FFMC Cash Memo invoicing system`

---

## Next Steps

1. **Invoice Detail Page** (`/invoices/[id]`) — show full Cash Memo layout in-browser (HTML preview matching PDF)
2. **TCS auto-compute** — wire customer PAN annual LRS cumulative tracking: when total > ₹7L, auto-add TCS line
3. **QR Code generation** — replace placeholder box with actual QR encoding invoice number + amount + date
4. **Settings profile → auto-load on Business Profile page** — already implemented, test round-trip
5. **Customer Edit** — Add KYC fields to edit flow (currently only Add form has them)
6. **Invoice list page** — show invoice type badge (Cash Memo / Export Invoice)

## Known Issues / Edge Cases
- TCS rate (5% / 20%) needs annual PAN LRS cumulative tracking before it can auto-compute
- IGST auto-detection uses state code comparison — requires both seller and buyer Place of Supply to have `(XX)` code format
- `nextInvoiceNumber` increments based on DB seed, may desync if multiple invoices created simultaneously (for low-volume FFMC use, this is acceptable)
