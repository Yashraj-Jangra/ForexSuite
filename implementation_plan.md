# VaultBill — Multi-Currency Invoicing & Compliance Platform
### Complete Architecture & Implementation Plan (Updated)

---

## Product Name Suggestions

| Name | Why it works |
|---|---|
| **VaultBill** ⭐ | Vault = secure/stored money, Bill = invoicing. Crisp, premium feel. |
| **Rupaya** | INR-first global invoicing. Rooted in South Asian finance culture. |
| **Ledgr** | Modern fintech name, implies financial records. |
| **CurrencyDesk** | Describes exactly what it does — multi-currency + invoicing. |

> **Recommended: VaultBill** — it's unique, memorable, doesn't conflict with major trademarks, and sounds professional for a financial SaaS product.

---

## Project Summary

**VaultBill** is a self-hosted, multi-tenant SaaS invoicing and compliance platform for business owners who deal with multi-currency transactions and outward/inward remittance compliance. Each business gets its own isolated workspace. The platform supports:
- Real-time currency exchange rates (RBI + open APIs)
- Full GST (India), VAT (EU/UAE/UK), Sales Tax (USA), TDS/TCS support
- **LRS (Liberalised Remittance Scheme) Compliance**: Form A2 PDF auto-generation, annual limit tracking ($250,000 USD limit per individual), and progressive TCS calculation engine.
- **FLM-8 RBI Reporting**: Automated monthly return builder for money changers (FFMCs/AD Cat-II) tracking cash note balances, purchases, and sales.
- **FEMA Export Realization Tracking**: Age analysis of unpaid export invoices against the RBI-mandated 270-day (9-month) realization limit.
- **LUT (Letter of Undertaking) & FIRC (Foreign Inward Remittance Certificate) Mapping**: Storing active LUTs and linking FIRC bank documents to export invoices for audits.
- PDF invoice generation + email (SMTP/SendGrid/Resend) + WhatsApp Business delivery
- UPI QR codes + Razorpay/Stripe payment links on invoices
- PWA (installable mobile app from browser — no app store)
- Smart dashboards with revenue, due payments, compliance health check, analytics
- Automated database backups
- CI/CD pipeline for zero-downtime deployments

---

## Open Questions / Design Decisions

> [!IMPORTANT]
> **Double Compliance Modes (Money Changer vs. Business Owner):** 
> - **Mode A (Exporter/Business Owner):** Focuses on invoicing, LRS (Form A2) for outbound payments, FIRC matching, FEMA 270-day realization alerts, and GST/LUT.
> - **Mode B (Money Changer / FFMC / AD Cat-II):** Focuses on cash/currency note trade, customer KYC, and compiling the RBI FLM-8 monthly statements.
> *Proposal:* We will make the compliance module configurable per-workspace (e.g. toggle "Enable Money Changer / FLM-8 Compliance" and "Enable Import/Export Compliance") so that both exporters and money-exchange operators can use the same platform. Confirm if this is acceptable.

> [!IMPORTANT]
> **Multi-tenancy isolation level:** Since this is internal-only (not monetized), we recommend **schema-per-tenant** in PostgreSQL. Every business gets its own DB schema (`tenant_acme`, `tenant_xyz`), giving strong data isolation with no extra infra cost.

> [!IMPORTANT]
> **RBI Exchange Rate API:** RBI's official FBIL rates are published daily (not real-time). For intraday rate updates, we'll supplement with `api.exchangerate-api.com` or `frankfurter.app` (free, open-source). Should we cache & update rates every **1 hour** or every **24 hours**?

> [!WARNING]
> **WhatsApp Business API** requires a Meta Business Account and approval process (can take 1–2 weeks). We'll design the integration but you'll need to register at [business.whatsapp.com](https://business.whatsapp.com) separately.

---

## Proposed Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Backend** | **Node.js + TypeScript (Fastify)** | Fastest JSON APIs, first-class TypeScript, huge ecosystem |
| **Frontend** | **Next.js 14 (App Router) + TypeScript** | SSR/RSC for SEO and performance, built-in API routes, PWA-ready |
| **Database** | **PostgreSQL 16** | ACID transactions, schema-per-tenant, mature, battle-tested |
| **ORM** | **Drizzle ORM** | Type-safe, lightweight, works perfectly with schema-per-tenant |
| **Queue / Jobs** | **BullMQ + Redis** | Background jobs: email sending, PDF generation, backup scheduling, rate sync, FEMA realization checks |
| **Cache** | **Redis** | Exchange rate caching, session store, job queue |
| **PDF Generation** | **Puppeteer (headless Chrome)** | HTML→PDF for pixel-perfect invoices, Form A2 RBI templates |
| **Auth** | **Better Auth** | Self-hostable, multi-tenant aware, sessions in PostgreSQL |
| **File Storage** | **MinIO (self-hosted S3)** | Store PDFs, business logos, FIRC bank receipts, database backups |
| **Styling** | **Vanilla CSS + Tailwind CSS + shadcn/ui** | Modern responsive dashboard, glassmorphism UI, premium layout |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│  Browser (PWA) ─── Mobile (PWA installable) ─── Print   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (Caddy + Let's Encrypt)
┌──────────────────────▼──────────────────────────────────┐
│                   NEXT.JS FRONTEND                       │
│  App Router │ RSC │ PWA Manifest │ Service Worker        │
└──────────────────────┬──────────────────────────────────┘
                       │ REST / tRPC
┌──────────────────────▼──────────────────────────────────┐
│               FASTIFY API BACKEND                        │
│  Auth │ Invoice Engine │ Tax Engine │ Currency Engine     │
│  Compliance (Form A2, FLM-8, FEMA) │ Notification Hub    │
└──┬──────────┬──────────────┬──────────────┬─────────────┘
   │          │              │              │
   ▼          ▼              ▼              ▼
PostgreSQL   Redis         MinIO          BullMQ Workers
(Schema per  (Cache +      (PDFs + FIRCs  (Email, PDF,
  tenant)    Sessions)     + Backups)     Rates, Backups)
```

---

## Database Architecture

### Multi-Tenancy: Schema-per-Tenant

```sql
-- Public schema: platform-wide tables
public.tenants          -- workspace registry
public.users            -- global user accounts  
public.tenant_members   -- user ↔ tenant membership

-- Per-tenant schema (created on workspace signup)
tenant_{id}.customers
tenant_{id}.vendors
tenant_{id}.invoices
tenant_{id}.invoice_items
tenant_{id}.payments
tenant_{id}.currencies
tenant_{id}.exchange_rates
tenant_{id}.tax_configs
tenant_{id}.settings

-- Compliance Tables (New)
tenant_{id}.remittances             -- LRS transactions, Form A2 inputs, TCS audit trail
tenant_{id}.forex_transactions      -- Cash note trades for FLM-8
tenant_{id}.fircs                   -- Foreign Inward Remittance Certificates mapped to invoices
tenant_{id}.lut_registrations       -- GST Letter of Undertaking registry
tenant_{id}.rbi_purpose_codes       -- RBI Purpose Codes index (read-only reference)
```

### Key Tables Detail (per tenant)

**`tenant_{id}.remittances` (LRS Form A2 & TCS tracker)**
```
id, remitter_name, remitter_pan, remitter_aadhaar, remitter_account,
beneficiary_name, beneficiary_bank_details, beneficiary_country,
purpose_code_id (foreign key), purpose_description,
amount_foreign, currency, exchange_rate, amount_inr,
tcs_percentage, tcs_amount,
pan_financial_year_remitted_total,  -- Tracks current financial year cumulative total for this PAN
form_a2_pdf_path, status (pending|completed|failed), created_at, updated_at
```

**`tenant_{id}.forex_transactions` (FLM-8 Ledger)**
```
id, transaction_date, currency, transaction_type (purchase|sale),
category, -- 'public' | 'franchisee' | 'ffmc_ad' for purchases; 'btq' | 'business' | 'ffmc_ad' for sales
amount, conversion_rate, customer_name, customer_passport_kyc,
created_at
```

**`tenant_{id}.fircs` (FIRC Document registry)**
```
id, firc_number, issuing_bank, date_of_issuance,
amount, currency, exchange_rate, amount_inr,
purpose_code_id, pdf_path,
unmapped_amount_inr, -- Balance amount not yet linked to an invoice
created_at
```

**`tenant_{id}.invoices` (with Export additions)**
```
...,
is_export (boolean),
lut_number (text),          -- Applied automatically if is_export is true and active LUT exists
firc_id (foreign key),      -- Maps invoice to bank inward clearance
shipping_bill_number (text), -- Custom declaration number
port_of_loading (text),
date_of_export (date)
```

---

## Backend Modules

### 1. Currency Engine
- Fetches RBI FBIL rates daily (official) and parses major exchange rates.
- Fallback: Frankfurter.app / ExchangeRate-API for real-time intraday conversions.
- Caches rates in Redis with configurable TTL (1h or 24h).
- Stores historical rate snapshots on invoices at generation time.

### 2. Invoice & Tax Engine
- Template system rendering pixel-perfect HTML to PDF via Puppeteer.
- Auto-detects GST splits (CGST + SGST vs. IGST) based on customer state code vs. vendor business profile.
- **Export Invoices (LUT):** Supports zero-rated GST export invoices, auto-injecting LUT details.
- Multi-currency ledger tracking both primary billing currency and display currency.

### 3. Compliance & Regulatory Engine (New)
- **Form A2 (LRS) PDF Compiler:** Gathers remitter details, beneficiary coordinates, amount, and RBI purpose codes. Evaluates historical PAN remittances in the current financial year to warn when approaching the $250,000 USD limit and calculates progressive TCS:
  - Education (via Bank Loan): 0.5% TCS above ₹7 Lakhs.
  - Education/Medical (Self-funded): 5% TCS above ₹7 Lakhs.
  - Others (Investments/Travel): 20% TCS above ₹7 Lakhs.
- **FLM-8 Monthly Statement Aggregator:** Processes transactions in `forex_transactions` to compile RBI monthly returns:
  - Organizes opening balance, category-wise inflows (public, agents, other FFMCs), and category-wise outflows (BTQ, business travel, exports to FFMCs).
  - Validates balance equation: `Closing Balance = Opening Balance + Total Purchases - Total Sales`.
  - Exporters to CSV/XLSX.
- **FEMA Aging & Alert Monitor:**
  - Standard FEMA rules require export invoice realizations within **270 days (9 months)**.
  - Background cron checks all unpaid export invoices daily and flags warning highlights at **180 days** and **240 days** (critical threshold).
- **FIRC & LUT Lifecycle Tracker:** Links incoming wire certificates (FIRCs) to outstanding export invoices, reconciling invoice amounts against bank deposits.

### 4. Notification Hub
- Delivery engine using Resend SDK and official Meta Cloud WhatsApp Business API.
- Delivers PDF invoices, Form A2 PDFs, payment reminders, and FEMA aging alerts.

---

## Frontend Pages & Components

### Public
- `/` — Landing page
- `/login` — Auth (email + password, OAuth)
- `/signup` — Workspace creation

### Dashboard (authenticated)
- `/dashboard` — Revenue overview, compliance scorecard (FEMA alerts, LRS limits, missing FIRCs), live currency widget
- `/invoices` — Invoice list with export markers and LUT/IGST filters
- `/invoices/new` — Wizard supporting standard invoice and export invoice types
- `/compliance` — Main regulatory control center
  - `/compliance/lrs` — Dashboard tracking annual USD limits by individual (PAN), list of remittances, and Form A2 generator
  - `/compliance/flm8` — Monthly FLM-8 statement engine (select month, review transactions, verify closing stock, export Excel)
  - `/compliance/firc` — FIRC uploader, ledger, and interactive invoice matching board
  - `/compliance/lut` — Register and track validity of GST Letter of Undertakings
- `/settings/compliance` — Toggle switch to enable Exporter Mode, Money Changer Mode, or both.

---

## Exchange Rate Integration

### Primary: RBI FBIL (Official)
- Scraped/parsed daily at 5:30 PM IST (post market close).
- Covers major pairs: USD, EUR, GBP, JPY, CHF, AUD vs. INR.

### Secondary: Frankfurter.app (Open Source)
- Used for intraday calculations, real-time rate warnings, and currencies not listed by the RBI.

---

## Phased Rollout

### Phase 1 — Scaffold & Core Invoicing (Weeks 1–4)
- [ ] Initialize monorepo, Fastify API, Next.js dashboard, PostgreSQL schema, and migrations.
- [ ] Integrate Better Auth for multi-tenant workspace isolation.
- [ ] Build basic customer/vendor registry, invoice creator, and Puppeteer PDF renderer.
- [ ] Set up currency rate sync (Frankfurter + Redis caching).

### Phase 2 — Indian Taxation & Exporter Compliance (Weeks 5–8)
- [ ] Implement Indian GST engine (CGST/SGST/IGST splits based on GSTIN).
- [ ] Add LUT registry and export invoice type with auto-applied LUT numbers.
- [ ] Build **FEMA Export Realization Tracker** (270-day invoice age monitoring and notifications).
- [ ] Create **FIRC Manager** for document upload (MinIO) and mapping transactions to invoices.

### Phase 3 — Outward Remittance & Money Exchange (Weeks 9–12)
- [ ] Add **LRS Outward Remittance Tracker** with PAN-based cumulative limit warning ($250k).
- [ ] Implement **TCS Calculation Rules** (0.5% / 5% / 20% thresholds).
- [ ] Develop **Form A2 PDF Auto-Generator** with searchable RBI Purpose Codes directory.
- [ ] Develop **FLM-8 Monthly Return Engine** with inventory balancing check and Excel/CSV exporter.

### Phase 4 — Communications & Infrastructure (Weeks 13+)
- [ ] Integrate Resend Email and Meta Cloud WhatsApp API for delivery.
- [ ] Enable PWA features (offline creation, push reminders for FEMA limits).
- [ ] Set up automated pg_dump backups to MinIO/Backblaze B2.
- [ ] Configure Coolify deployment pipeline with Caddy SSL setup.

---

## Verification Plan

### Automated Tests
- `vitest` unit tests for:
  - TCS calculation logic (checking threshold limits across financial years).
  - FLM-8 closing balance equation solver.
  - GST split rules and HSN code mapping.
- Integration tests mapping `FIRC` credits to outstanding invoices.

### Manual Verification
- Generate Form A2 and inspect PDF layout correctness.
- Simulate an export invoice exceeding 270 days and verify FEMA dashboard alerts.
- Insert sample cash purchases/sales and generate FLM-8 spreadsheet to check match with RBI templates.
- Confirm schema separation by performing workspace cross-checks.
