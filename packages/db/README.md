# @vaultbill/db

Database abstraction layer, Drizzle ORM schemas, migration engine, and multi-tenant schema manager for **VaultBill**.

---

## 🏛️ Schema Architecture

VaultBill enforces a PostgreSQL **schema-per-tenant** multi-tenancy model:

```text
packages/db/src/
├── index.ts                # Package entrypoint, exports Drizzle clients and types
├── pool.ts                 # PostgreSQL connection pool manager
├── provision.ts            # Dynamic tenant schema creation & template migrations
├── tenant-db.ts            # Factory for creating tenant-scoped Drizzle instances
└── schemas/
    ├── auth.ts             # Better Auth tables (user, session, account, verification)
    ├── public.ts           # Global tenants, tenant_members, exchange_rates, audit_logs
    └── tenant.ts           # Invoices, items, customers, vendors, fircs, luts, remittances
```

---

## 🔑 Key Utilities

- `provisionTenantSchema(tenantId: string)`:
  Creates `tenant_{tenantId}` PostgreSQL schema, executes Drizzle migrations, and seeds default tenant settings and currency configurations.
- `createTenantDb(tenantId: string)`:
  Instantiates a Drizzle ORM client pre-configured with search path scoped to `"tenant_{tenantId}", public`.

---

## 🚀 Commands

```bash
# Push schema changes to database
pnpm --filter @vaultbill/db push

# Generate migration SQL
pnpm --filter @vaultbill/db generate

# Typecheck
pnpm --filter @vaultbill/db typecheck
```
