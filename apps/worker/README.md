# @vaultbill/worker

Background task execution daemon and queue processor for **VaultBill**, built on **BullMQ** and **Redis**.

---

## ⚙️ Background Jobs

| Job Worker | Schedule / Trigger | Purpose |
|---|---|---|
| `rate-sync.ts` | Scheduled Cron / On-Demand | Executes 4-tier statutory forex sync (FBIL primary, FEDAI for GCC, ECB fallback) and records historical rate series. |
| `fema-check.ts` | Daily Cron (Midnight) | Analyzes open export invoices; flags invoices approaching the statutory 270-day realization deadline (Warning: 180d, Critical: 240d). |
| `backup.ts` | Scheduled (Every 4h) | Triggers automated encrypted database schema dumps and persists them to MinIO S3 storage. |
| `sender.ts` | Event-Driven Queue | Dispatches transaction notification emails and payment reminder alerts via Resend. |

---

## 🚀 Running the Worker

```bash
# Inside workspace root
pnpm --filter @vaultbill/worker dev

# Typecheck
pnpm --filter @vaultbill/worker typecheck
```
Worker connects to Redis at `REDIS_URL` (default `localhost:6380`).
