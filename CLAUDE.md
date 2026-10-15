# Claude Code & AI Agent Guidelines — VaultBill

Welcome! This file provides quick-reference project instructions and conventions for Claude Code and paired AI agents working in this repository. For complete specifications, see [AGENT_RULES.md](AGENT_RULES.md) and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

---

## ⚡ Essential Commands

```bash
# Start local containers (PostgreSQL :5434, Redis :6380, MinIO :9003)
pnpm infra:up

# Push Drizzle schema changes to database
pnpm db:migrate

# Start Next.js web (:3000), Fastify API (:3001), and worker
pnpm dev

# TYPECHECK (Strict Zero-Error Gate — run before finishing turn!)
pnpm typecheck

# RUN BUSINESS LOGIC TESTS
pnpm --filter @vaultbill/shared test

# LINT & FORMAT
pnpm lint
pnpm format
```

---

## 🏛️ Non-Negotiable Agent Rules

1. **Zero-Error Verification Gate**:
   - Always run `pnpm typecheck` before concluding any turn.
   - If modifying tax, statutory, or utility logic, run `pnpm --filter @vaultbill/shared test`.
   - Never present a solution that leaves compilation errors.

2. **Read-Before-Edit Protocol**:
   - Inspect schemas in `packages/db/src/schemas/` (`public.ts`, `tenant.ts`, `auth.ts`) before writing or modifying queries.
   - Use `ctx.tenantDb` for tenant operations; never query tenant tables through global `db`.
   - Make minimal, targeted diffs. Do not rewrite whole files when a focused edit suffices.

3. **Git Commit Style (Gitmoji + Type)**:
   - Format: `<emoji> <type>: short description` (lowercase, casual, imperative, no trailing period).
   - Examples:
     - `✨ feat: add form a2 rbi purpose code search`
     - `🐛 fix: gst split calculation for interstate export`
     - `🎨 style: polish rates chart crosshair hover tooltip`
     - `🗃️ db: add rate date and source provider columns`
   - Commit after every unit of work. Squash failed trial attempts before opening PR.
   - Never push (`git push`, `git push --force`) without explicit human instruction.

4. **UI & Design System Rules**:
   - **"Less Div, Sleek & Focused"**: Flat hierarchy, single-level cards (`border border-border bg-card`), generous padding (`p-4` to `p-6`). Avoid gratuitous nested divs.
   - **Typography**: **Plus Jakarta Sans** for interface text; **JetBrains Mono** (`font-mono`) strictly required for monetary amounts, exchange rates, invoice numbers, SWIFT codes, and PANs.
   - **Colors**: Use semantic HSL tokens only (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`). No hardcoded hex values or pitch-black/neon gimmicks.
   - Reuse existing components in `apps/web/src/components/ui/` (`Button`, `Card`, `Input`, `Badge`, `Divider`).

5. **Statutory Domain Invariants**:
   - **Forex Notation**: `1 Foreign Currency Unit = INR Price` (e.g. `1 USD = ₹86.85`).
   - **FEMA Realization**: 270 days statutory limit for export payments (Warning at 180d, Critical at 240d).
   - **TCS Section 206C(1G)**: ₹7,00,000 INR threshold per financial year (0.5% loan education, 5% self education/medical, 20% other).
   - **LRS Ceiling**: $250,000 USD per financial year per PAN.
   - **GST Split**: Same state = CGST + SGST (50/50); Different state = IGST; Export with LUT = 0%.
   - **FLM-8 Balance**: $\text{Closing} = \text{Opening} + \text{Purchases} - \text{Sales}$.
