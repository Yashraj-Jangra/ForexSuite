# @vaultbill/api

The backend REST & tRPC API server for **VaultBill**, built on **Fastify** and **@trpc/server**.

---

## 🏛️ Core Architecture

- **Fastify Server (`src/index.ts`)**: Fast, low-overhead HTTP engine running on port 3001.
- **Better Auth Integration (`src/auth/`)**: Session-based authentication with secure `HttpOnly` cookies, tenant context resolution, and user lifecycle.
- **Dynamic Tenant Scoping (`src/trpc/context.ts`)**: Every authenticated tRPC request resolves the active tenant ID and instantiates an isolated `ctx.tenantDb` client scoped directly to PostgreSQL schema `tenant_{uuid}`.
- **tRPC Router Matrix (`src/modules/`)**: Type-safe end-to-end API procedures consumed directly by `apps/web`.

---

## 📁 Modules

| Module | Responsibilities |
|---|---|
| `account/` | Personal profile management, device telemetry, active sessions revocation. |
| `admin/` | Platform administration, audit logs, tenant management, health monitors. |
| `backups/` | Automated schema dumps, encryption, and MinIO S3 sync. |
| `currencies/` | Tenant-enabled currency management and default currency configuration. |
| `customers/` | Customer master, PAN/GSTIN validation, currency preferences. |
| `fema/` | FEMA 270-day export realization aging sweeps and alert triggers. |
| `fircs/` | Foreign Inward Remittance Certificate ingestion and invoice reconciliation. |
| `forex/` | FFMC cash note trades and FLM-8 monthly statements. |
| `invoices/` | Invoice creation, auto-numbering, status transitions, PDF streaming. |
| `luts/` | GST Letter of Undertaking registration and 30-day expiration alerts. |
| `rates/` | 4-tier forex rates query, historical trend series, and live sync dispatch. |
| `remittances/` | LRS transfers, Section 206C(1G) TCS calculations, Form A2 PDF triggers. |
| `settings/` | Tenant settings, appearance preferences, rate sync frequency. |
| `tax/` | GST calculation and HSN/SAC code catalog search. |
| `vendors/` | Vendor master records and international bank details. |

---

## 🚀 Running the API

```bash
# Inside workspace root
pnpm --filter @vaultbill/api dev

# Typecheck
pnpm --filter @vaultbill/api typecheck
```
API server runs on `http://localhost:3001`.
