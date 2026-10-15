# VaultBill (Currency Manager)

<p align="center">
  <img src="https://raw.githubusercontent.com/yashraj/vaultbill/master/apps/web/public/logo.svg" alt="VaultBill Logo" width="80" height="80" onerror="this.style.display='none'"/>
</p>

<p align="center">
  <strong>Open-Source Multi-Currency Invoicing, Statutory Forex Management & Regulatory Compliance Engine for Cross-Border Indian Businesses.</strong>
</p>

<p align="center">
  <a href="#core-features"><img src="https://img.shields.io/badge/Next.js-14%20(App%20Router)-black?style=flat-square&logo=next.js" alt="Next.js 14"></a>
  <a href="#core-features"><img src="https://img.shields.io/badge/Fastify-v4-000000?style=flat-square&logo=fastify" alt="Fastify"></a>
  <a href="#core-features"><img src="https://img.shields.io/badge/tRPC-v10%2Fv11-25c2a0?style=flat-square&logo=trpc" alt="tRPC"></a>
  <a href="#core-features"><img src="https://img.shields.io/badge/TypeScript-Strict-3178c6?style=flat-square&logo=typescript" alt="TypeScript Strict"></a>
  <a href="#core-features"><img src="https://img.shields.io/badge/PostgreSQL-16%20(Schema--Per--Tenant)-336791?style=flat-square&logo=postgresql" alt="PostgreSQL"></a>
  <a href="#core-features"><img src="https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square&logo=drizzle" alt="Drizzle ORM"></a>
  <a href="#core-features"><img src="https://img.shields.io/badge/Redis-7%20%2B%20BullMQ-DC382D?style=flat-square&logo=redis" alt="Redis + BullMQ"></a>
  <a href="#core-features"><img src="https://img.shields.io/badge/MinIO-S3%20Compatible-C72C48?style=flat-square&logo=minio" alt="MinIO"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache--2.0-blue?style=flat-square" alt="Apache 2.0"></a>
</p>

---

## 📌 Executive Overview

For cross-border Indian software agencies, export houses, freelance consultants, and Authorized Dealer Category-II / Full-Fledged Money Changers (FFMC), managing global billing involves far more than simply calculating currency conversion. It demands navigating stringent, high-friction statutory mandates governed by the Reserve Bank of India (RBI), the Directorate General of Foreign Trade (DGFT), and the Goods and Services Tax (GST) Council.

**VaultBill** is an enterprise-grade, open-source fintech platform engineered specifically to solve these operational bottlenecks:
- **Zero-Guesswork Statutory Forex**: Synchronizes official daily reference rates published by **Financial Benchmarks India Pvt. Ltd. (FBIL)** under RBI mandate, coupled with **FEDAI** interbank feeds for GCC currencies.
- **Automated FEMA 270-Day Realization Tracking**: Proactively monitors inward remittances to avoid regulatory penalties under FEMA regulations.
- **e-FIRC & EDPMS Reconciliation Board**: Bridges the gap between foreign bank inward remittance certificates and open export invoices.
- **GST Zero-Rated Export (LUT) Validation**: Auto-detects CGST/SGST/IGST tax splits and monitors 30-day Letter of Undertaking validity.
- **Liberalised Remittance Scheme (LRS) & TCS Engine**: Tracks PAN-wise cumulative annual limits toward the $250,000 USD ceiling and calculates Section 206C(1G) Tax Collected at Source (TCS) with instant RBI Form A2 PDF generation.
- **FFMC FLM-8 Statements**: Solves cash currency note trade equations (`Closing = Opening + Purchases - Sales`) with structured RBI monthly reports.
- **True Multi-Tenancy**: Complete database isolation using dynamic PostgreSQL schema-per-tenant architecture (`tenant_{id}`).
- **Precision Design System**: A clean, Linear-inspired, high-density minimal UI designed for finance operators, devoid of cluttered divs and terminal gimmicks.

---

## 🚀 Core Features

### 1. Multi-Currency Invoicing & 5 PDF Design Archetypes
- Create multi-currency line items with automatic dual currency presentation (foreign currency + INR parity at spot rate).
- Instant PDF generation via headless Puppeteer with 5 production-grade design archetypes:
  - **Modern**: Clean, sleek, contemporary layout with subtle divider borders and brand badges.
  - **Executive**: High-contrast, structured layout with bold headings and formal financial seals.
  - **Classic**: Traditional corporate typography and tabular ledger arrangements.
  - **Minimal**: Ultra-lean, high-density layout prioritizing white space and essential line items.
  - **Corporate**: Robust multi-column layout optimized for multi-stakeholder and departmental invoices.
- Direct PDF storage to MinIO (S3-compatible) with pre-signed download tokens.

### 2. 4-Tier Statutory RBI/FBIL & FEDAI Forex Sync Engine
- **Tier 1 (Authoritative Statutory Reference)**: Direct daily sync of **FBIL Reference Rates** per RBI mandate (`api.frankfurter.dev?from=INR&providers=FBIL`) covering USD, EUR, GBP, JPY, AUD, CAD, CHF, SGD, and more.
- **Tier 2 (FEDAI Interbank Sourcing)**: Automated fallback for non-FBIL GCC pairs (AED, SAR, KWD, QAR, OMR, BHD) adhering to FEMA Rule 7 / FEDAI guidelines.
- **Tier 3 (ECB Resilience)**: European Central Bank live rates fallback.
- **Tier 4 (Offline Baseline)**: Resilient static cache fallback ensuring zero operational downtime.
- **Interactive Rates Studio**: Visual SVG historical trend charts (7D / 30D / 90D), dual-axis hover HUD, 24-hour rate delta tickers, and bi-directional currency conversion calculator.

### 3. Exporter Regulatory Compliance Suite
- **FEMA 270-Day Realization Clock**: Scheduled BullMQ cron analyzes export invoice ages. Visual status badges indicate compliance health:
  - 🟢 **Compliant**: `< 180 days` elapsed since export invoice issue date.
  - 🟡 **Warning**: `180 – 239 days` elapsed (statutory realization deadline approaching).
  - 🔴 **Critical**: `240+ days` elapsed (escalation required before FEMA non-compliance report).
- **e-FIRC Reconciler**: Maintain inward remittance documents with real-time tracking of unmapped foreign balances. Link individual FIRCs to multiple export invoices or aggregate multiple remittances against a single master invoice.
- **GST & LUT Management**: Verifies 15-character GSTIN checksums and state codes, automatically categorizes inter-state (IGST) vs intra-state (CGST + SGST), validates zero-rated export declarations, and alerts teams 30 days before LUT expiration.

### 4. LRS Outbound Remittance & TCS Engine
- Comprehensive tracking of outbound transfers under RBI's Liberalised Remittance Scheme against the annual **$250,000 USD** limit per PAN.
- **Income Tax Section 206C(1G) TCS Rules**:
  - `0%` for remittances below the ₹7,00,000 threshold across the financial year.
  - `0.5%` for overseas education funded via recognized financial institution loans.
  - `5.0%` for self-funded education and overseas medical treatments.
  - `20.0%` for investments, foreign travel tour packages, gifts, and other capital remittances.
- **Statutory Form A2 Generator**: Generates formal RBI-prescribed Form A2 declaration PDFs pre-filled with remitter details, beneficiary bank SWIFT identifiers, and searchable RBI purpose codes (e.g., `S0305`, `S1002`).

### 5. Money Changer (FFMC / AD-II) Returns
- Maintain physical foreign currency note inventory with customer KYC verification.
- **FLM-8 Monthly Statement Generator**: Validates balance equation integrity across 20+ denominations:
  $$\text{Closing Balance} = \text{Opening Balance} + \text{Purchases} - \text{Sales}$$
- Export statutory CSV/Excel worksheets matching RBI inspection formats.

### 6. Architectural Multi-Tenancy & Data Isolation
- Physical isolation of tenant data through PostgreSQL `schema-per-tenant`.
- Public schema maintains authentication credentials, tenant memberships, and audit logs.
- Dynamic `tenant_{uuid}` schemas encapsulate invoices, customers, remittances, FIRCs, and rates history.
- Zero cross-tenant data leakage risks by construction.

---

## 🏗️ Architecture & Monorepo Structure

VaultBill is structured as an optimized Turborepo monorepo powered by `pnpm`:

```
currency-manager/
├── apps/
│   ├── api/            # Fastify backend, tRPC v10/v11 root routers, Better Auth
│   ├── web/            # Next.js 14 App Router, React 18/19, Tailwind, Design System
│   └── worker/         # BullMQ background job processor (Forex sync, FEMA checks, backups)
├── packages/
│   ├── config/         # Environment schema (Zod), statutory constants, RBI purpose codes
│   ├── db/             # Drizzle ORM schema (public + tenant), migrations, pool manager
│   ├── pdf/            # Puppeteer rendering engine & 5 invoice templates + Form A2
│   └── shared/         # Tax calculators (GST, TCS, FLM-8), Zod contracts, utility helpers
├── docker/
│   ├── compose.dev.yml # Dev services: PostgreSQL 16, Redis 7, MinIO
│   ├── compose.prod.yml# Full production stack with Caddy reverse proxy
│   └── Caddyfile       # Automatic SSL/TLS & reverse proxy configuration
├── .github/            # GitHub Actions CI/CD workflows and issue/PR templates
├── ARCHITECTURE.md     # In-depth architectural & data-isolation specification
├── CONTRIBUTING.md     # Contributor guide, zero-error policy, gitmoji rules
├── DESIGN_SYSTEM.md    # HSL color tokens, typography, and "Less Div" UI principles
├── AGENT_RULES.md      # AI agentic workflow rules and verification gates
└── LICENSE             # Apache 2.0 Open Source License
```

```mermaid
graph TD
    Client[Next.js 14 Frontend\napps/web :3000] -->|Type-Safe tRPC| API[Fastify API Server\napps/api :3001]
    API -->|Auth Session Cookie| BetterAuth[Better Auth Engine]
    API -->|Scoped Connection| TenantDB[(PostgreSQL 16\nSchema-Per-Tenant :5434)]
    API -->|Dispatch Jobs| Redis[(Redis 7 Queue :6380)]
    Worker[BullMQ Worker\napps/worker] -->|Consume Jobs| Redis
    Worker -->|Fetch Rates| FBIL[RBI / FBIL API]
    Worker -->|Fetch GCC Pairs| FEDAI[FEDAI / Open-ER API]
    Worker -->|Sync| TenantDB
    API -->|Generate PDF| PDFEngine[Puppeteer Engine\npackages/pdf]
    PDFEngine -->|Upload Stream| MinIO[(MinIO S3 Storage :9003)]
```

---

## ⚡ Quickstart & Local Setup

### Prerequisites
- **Node.js**: `>= 22.0.0`
- **Package Manager**: `pnpm` (`^11.0.0` or `11.22.0`)
- **Docker**: Docker Desktop or Docker Engine + Docker Compose (or WSL on Windows)

### 1. Clone the Repository
```bash
git clone https://github.com/yashraj/vaultbill.git
cd vaultbill
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start Local Infrastructure
Boot local PostgreSQL (port 5434), Redis (port 6380), and MinIO (ports 9003 & 9004):
```bash
pnpm infra:up
```
*(To stop containers later, run `pnpm infra:down`)*

### 4. Configure Environment Variables
Copy the template `.env.example` into `.env`:
```bash
cp .env.example .env
```
Default connection strings are pre-configured to match the local Docker container ports:
```env
DATABASE_URL=postgresql://vaultbill:vaultbill_dev@localhost:5434/vaultbill
REDIS_URL=redis://localhost:6380
MINIO_ENDPOINT=localhost
MINIO_PORT=9003
MINIO_ACCESS_KEY=vaultbill_admin
MINIO_SECRET_KEY=vaultbill_minio_dev
MINIO_BUCKET=vaultbill-storage
BETTER_AUTH_SECRET=change-me-to-a-random-secret-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3000
API_PORT=3001
WEB_PORT=3000
```

### 5. Provision Database Schemas
Push initial Drizzle ORM schemas into the database:
```bash
pnpm db:migrate
```

### 6. Run the Development Cluster
Launch all applications simultaneously via Turborepo:
```bash
pnpm dev
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **API Server & tRPC**: [http://localhost:3001](http://localhost:3001)
- **MinIO Console**: [http://localhost:9004](http://localhost:9004) (`vaultbill_admin` / `vaultbill_minio_dev`)

---

## 📜 Monorepo Scripts Reference

| Command | Description |
|---|---|
| `pnpm dev` | Starts Next.js web, Fastify API, and BullMQ worker in watch mode via Turborepo. |
| `pnpm build` | Builds all packages and applications for production. |
| `pnpm typecheck` | Runs `tsc --noEmit` across all 7 packages. Strict zero-error gate. |
| `pnpm test` | Runs the Vitest test suites (business math: TCS, GST, FLM-8, FEMA). |
| `pnpm lint` | Runs ESLint flat config across the monorepo. |
| `pnpm format` | Formats the codebase using Prettier. |
| `pnpm infra:up` | Boots PostgreSQL, Redis, and MinIO Docker containers in the background. |
| `pnpm infra:down` | Stops and tears down the local Docker infrastructure. |
| `pnpm infra:logs` | Streams live Docker container logs. |
| `pnpm db:migrate` | Pushes the Drizzle schema directly to PostgreSQL. |
| `pnpm clean` | Purges Turborepo caches and build artifacts. |

---

## 🛡️ Quality Standards & Zero-Error Policy

VaultBill maintains an uncompromised **"Zero Errors & Strict Soundness"** policy:
1. **Zero TypeScript Errors**: Every push and PR must pass `pnpm typecheck` with `0` errors. Unchecked `any` casts or unjustified `@ts-ignore` comments are disallowed.
2. **Deterministic Business Math**: Core statutory engines (GST splits, Section 206C(1G) TCS thresholds, FEMA realization aging, and FLM-8 balance equations) are strictly unit-tested in `@vaultbill/shared` and must never rely on floating-point approximations.
3. **Atomic Git History**: Commits must use descriptive Gitmoji prefixes (e.g. `✨ feat:`, `🐛 fix:`, `🎨 style:`, `🗃️ db:`) with clear imperative messages. Trial-and-error commits are squashed before merging.
4. **Sleek, Minimal UI**: UI implementations must adhere to `DESIGN_SYSTEM.md`. We enforce flat component hierarchies, standard HSL theme tokens, and **JetBrains Mono** for all numerical and monetary quantities.

For complete developer standards, please review [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 🤖 AI Agentic Workflows

VaultBill was built pairing human architects with advanced AI coding agents. To ensure consistent quality across autonomous runs:
- Read [AGENT_RULES.md](AGENT_RULES.md) before initiating tasks.
- Agents must execute `pnpm typecheck` and relevant test suites prior to completing any turn.
- Agents must follow the **Read-Before-Edit** protocol and verify statutory formulas in `@vaultbill/config` and `@vaultbill/shared` before modifying tax or forex logic.
- Runtime configurations for AI tools are maintained in `CLAUDE.md` and `.pi/rules.md`.

---

## 📚 Documentation Index

| Document | Purpose |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Deep technical architecture, schema-per-tenant isolation, tRPC pipelines, and forex engines. |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | HSL design tokens, Plus Jakarta Sans / JetBrains Mono typography, 6 accent palettes, and UI rules. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributor guidelines, zero-error policies, gitmoji conventions, and PR checklists. |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards and Contributor Covenant v2.1 expectations. |
| [SECURITY.md](SECURITY.md) | Security vulnerability disclosure policy, tenant data boundaries, and audit logging. |
| [AGENT_RULES.md](AGENT_RULES.md) | Instructions and verification gates for AI pair-programming and autonomous agents. |

---

## 📄 License

VaultBill is open-source software licensed under the **[Apache License 2.0](LICENSE)**.
Commercial friendly, includes explicit patent grants, and provides legal clarity for contributors and organizations.
