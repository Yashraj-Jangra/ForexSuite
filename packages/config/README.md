# @vaultbill/config

Runtime environment validation, statutory constants, thresholds, and RBI purpose code directories for **VaultBill**.

---

## 🔑 Key Exports

- **`loadEnv()`**:
  Validates process environment variables at startup against a strict Zod schema (`envSchema`). Exits with non-zero code if critical variables (`DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`) are missing or malformed.
- **Statutory Thresholds**:
  - `TCS_THRESHOLD_INR = 700_000` (Income Tax Section 206C(1G))
  - `LRS_ANNUAL_LIMIT_USD = 250_000` (RBI Liberalised Remittance Scheme)
  - `FEMA_REALIZATION_DAYS = 270` (Section 7, FEMA 1999)
  - `FEMA_WARNING_DAYS = 180`
  - `FEMA_CRITICAL_DAYS = 240`
- **RBI Purpose Codes (`src/purpose-codes.ts`)**:
  - `searchPurposeCodes(query: string)`
  - `getPurposeCode(code: string)`
  - `seedPurposeCodes`

---

## 🚀 Commands

```bash
# Typecheck
pnpm --filter @vaultbill/config typecheck
```
