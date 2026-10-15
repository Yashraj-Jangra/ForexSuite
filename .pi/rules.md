# Pi Agent Harness Rules — VaultBill

This file provides runtime operational instructions for Pi agents operating in the VaultBill repository.

---

## 🚦 Verification Gates

Before completing any task or ending a turn:

1. Run `pnpm typecheck` to verify zero TypeScript errors across all 7 monorepo packages.
2. Run `pnpm --filter @vaultbill/shared test` to ensure statutory calculations (GST, TCS, FLM-8) remain mathematically sound.
3. Keep diffs minimal, precise, and targeted.

---

## 📝 Commit Conventions

- Use Gitmoji + type prefix: `<emoji> <type>: short description`.
- Examples:
  - `✨ feat: ...`
  - `🐛 fix: ...`
  - `🎨 style: ...`
  - `🗃️ db: ...`
  - `🔧 config: ...`
  - `✅ test: ...`
  - `🧹 chore: ...`
- Commit after each completed task.
- Squash failed trial attempts so the repository history remains clean and confident.
- Do not push or force-push without explicit user approval.

---

## 🎨 UI & Design Principles

- Follow `DESIGN_SYSTEM.md`: "Less Div, Sleek & Focused".
- Use semantic HSL tokens: `bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-accent`.
- Typography: Plus Jakarta Sans for UI copy; JetBrains Mono (`font-mono`) for all monetary amounts, exchange rates, invoice numbers, SWIFT codes, and PANs.
- Avoid unnecessary wrapper `div` layers. Single-level cards with `p-4` to `p-6` padding.

---

## 🏛️ Domain Architecture

- **Multi-Tenancy**: Schema-per-tenant (`tenant_{uuid}`) in PostgreSQL 16. Fastify injects scoped `ctx.tenantDb`.
- **Forex Engine**: 4-Tier fallback (Tier 1: FBIL Reference Rates; Tier 2: FEDAI Interbank; Tier 3: ECB; Tier 4: Offline static cache).
- **Statutory Rules**:
  - FEMA Realization: 270 days.
  - TCS Section 206C(1G): ₹7,00,000 threshold per FY.
  - LRS Annual Ceiling: $250,000 USD per PAN.
  - GST: Zero-rated with LUT; intra-state CGST+SGST, inter-state IGST.
  - FLM-8: $\text{Closing} = \text{Opening} + \text{Purchases} - \text{Sales}$.
