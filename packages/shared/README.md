# @vaultbill/shared

Stateless business logic calculators, tax math engines, statutory formulas, validation schemas, and shared utilities for **VaultBill**.

---

## 📐 Modules & Calculators

| Module | Functions & Exports | Description |
|---|---|---|
| `gst.ts` | `calculateGst()`, `validateGstin()`, `searchHsn()`, `getHsnRate()` | Computes intra-state (CGST + SGST) vs inter-state (IGST) tax splits, validates 15-character GSTINs, supports zero-rated export declarations under LUT. |
| `tcs.ts` | `calculateTcs()`, `getTcsRules()`, `TCS_THRESHOLD_INR` | Computes Tax Collected at Source under Section 206C(1G) against the ₹7,00,000 FY threshold with purpose-based progressive rates (0.5%, 5%, 20%). |
| `schemas.ts` | Zod contracts & DTO schemas | Common request and payload schemas shared between Fastify API and Next.js frontend. |
| `utils.ts` | Currency & date helpers | Formatters adhering to the Indian forex notation standard: `1 Foreign Unit = INR Price`. |

---

## 🧪 Testing

Business logic calculations must maintain 100% test pass rates:

```bash
# Run Vitest test suite
pnpm --filter @vaultbill/shared test

# Typecheck
pnpm --filter @vaultbill/shared typecheck
```
