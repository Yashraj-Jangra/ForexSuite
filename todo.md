# VaultBill Project Progress

- [x] Project Setup & Monorepo Configuration
  - [x] Initialize git repository
  - [x] Initialize npm workspace / monorepo structure
  - [x] Create core configuration files (`tsconfig.json`, `.gitignore`, `eslint.config.js`)
- [x] Database Setup
  - [x] Configure PostgreSQL with Docker Compose
  - [x] Setup Drizzle ORM schema & migrations (Core)
  - [ ] Setup compliance tables (remittances, forex_transactions, fircs, lut_registrations)
- [x] Backend API Development (Fastify)
  - [x] Scaffold Fastify API with health endpoint
  - [x] Auth module (Better Auth integration with Fastify handler)
  - [x] Currency rate engine (Frankfurter + RBI APIs)
  - [ ] Invoice & PDF generator (with zero-rated GST LUT support)
  - [ ] Tax & TCS engine (GST splits and progressive LRS TCS)
  - [ ] Compliance engine (Form A2 generator, FLM-8 statements, FEMA alerts, FIRC linking)
- [ ] Frontend Development (Next.js 14)
  - [x] Set up Next.js app with Tailwind CSS + shadcn/ui
  - [x] Multi-tenant workspace dashboard & onboarding flow
  - [ ] Invoice builder interface (Standard & Export invoice modes)
  - [ ] Compliance pages (/compliance/lrs, /compliance/flm8, /compliance/firc, /compliance/lut)
- [ ] CI/CD & Self-Hosting Pipeline
  - [ ] Dockerfiles for services
  - [ ] GitHub Actions CI workflow
  - [ ] Deployment docs (Docker Compose manual)

### Build 0 — Foundations ✓
- [x] pnpm + Turborepo monorepo (apps/api, apps/web, apps/worker, packages/db, shared, config, pdf)
- [x] Dev Docker Compose (PostgreSQL 16, Redis 7, MinIO, Mailpit) with WSL docker fallback
- [x] Drizzle ORM schema (public: tenants, user, session, account, verification, tenant_members; tenant: customers, invoices, currencies, etc.)
- [x] Better Auth Fastify integration with same-origin Next.js proxying
- [x] Welcome page, auth pages, and onboarding flow with glassmorphism UI
- [x] TypeScript typecheck passes across all 7 workspace packages
- [x] Migration pushed to dev DB
