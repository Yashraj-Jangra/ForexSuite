# AI Agentic Workflow Rules & Operating Protocol

This document defines the operating rules, verification gates, and architectural discipline required for all autonomous or paired AI coding agents (Pi, Claude Code, Cursor, GitHub Copilot, Codex, OpenCode, and Antigravity) operating in the **VaultBill** codebase.

---

## 🏛️ The 5 Pillars of Agentic Discipline

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      VAULTBILL AGENTIC DISCIPLINE                      │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Zero-Error Gate│ 2. Read-Before-   │ 3. Git Hygiene                 │
│    • tsc 0 errors │    Edit           │    • Gitmoji + type prefix     │
│    • vitest passes│    • Schema check │    • Atomic task commits       │
│    • 0 regressions│    • Minimal diffs│    • Squash trial attempts     │
├───────────────────┴───────────────────┴────────────────────────────────┤
│ 4. Clean Minimal UI                   │ 5. Statutory Domain Soundness  │
│    • "Less Div, Sleek & Focused"      │    • FEMA 270d / LRS $250k     │
│    • HSL tokens & JetBrains Mono      │    • TCS 206C(1G) / GST splits │
│    • No terminal / neon gimmicks      │    • FBIL vs FEDAI rates       │
└───────────────────────────────────────┴────────────────────────────────┘
```

---

## Pillar 1: Zero-Error Verification Gate

Financial software demands deterministic soundness. An AI agent must never consider a task complete, declare victory, or present work as finished if errors exist.

### Verification Checklist Before Ending Any Turn

1. **Typecheck Soundness**:
   ```bash
   pnpm typecheck
   ```
   Must exit with code `0` across all 7 packages. No implicit `any`, no unresolved imports, no ignored type mismatches.
2. **Business Logic Test Verification**:
   When modifying calculations, tax logic, forex conversions, or utility functions:
   ```bash
   pnpm --filter @vaultbill/shared test
   ```
   Must pass 100% of test cases. Never modify test assertions just to force a pass without mathematical justification.
3. **Linter Gate**:
   Ensure modifications do not introduce new ESLint errors.
   - Attach causes to thrown errors: `throw new Error('message', { cause: err })`.
   - Prefer `const` over `let` for variables that are not reassigned.
   - Do not leave unused imports or dead assignments.

---

## Pillar 2: Read-Before-Edit Protocol

AI agents frequently hallucinate schema fields or route parameters when coding blindly. In VaultBill:

1. **Inspect Schemas First**:
   - Before writing or modifying queries, read the corresponding Drizzle schema in `packages/db/src/schemas/` (`public.ts`, `tenant.ts`, or `auth.ts`).
   - Check column names, nullable constraints, and default values.
2. **Minimal, Targeted Diffs**:
   - Make precise targeted replacements.
   - Do not rewrite entire files or components when adding a field or fixing a line.
   - Preserve existing code comments, formatting, and file organization.
3. **Verify Context Injection**:
   - In `apps/api`, check whether the procedure is public or protected.
   - Use `ctx.tenantDb` for tenant operations; never query tenant tables through the root `db` connection.

---

## Pillar 3: Git Hygiene & Commit Discipline

All commits authored by or with AI agents must follow the repository's established Gitmoji standard:

### 1. Commit Format

```text
<emoji> <type>: <short description>
```

- Lowercase, casual, imperative tone.
- No trailing period.
- Explain _what_ changed, not just that a file was modified.

### 2. Common Commit Prefixes

- `✨ feat: add form a2 rbi purpose code search`
- `🐛 fix: gst split calculation for inter-state export`
- `🎨 style: polish rates chart hover crosshair tooltips`
- `🗃️ db: add rate date and source provider columns`
- `♻️ refactor: extract fbil rate normalizer to shared`
- `🔧 config: update minio dev port to 9003`
- `✅ test: add tcs threshold crossing test cases`
- `🧹 chore: cleanup unused workspace artifacts`

### 3. Commit Rules

- **Commit After Every Meaningful Task**: Don't accumulate sprawling unstaged modifications across unrelated packages.
- **Squash Failed Attempts**: If an agent takes 3 attempts to solve an issue, squash intermediate failed commits into one clean, well-described commit. The Git history should reflect confidence and precision.
- **Never Push Without Instruction**: Agents must never run `git push`, `git push --force`, `git reset --hard`, or delete remote branches unless explicitly commanded by the user.

---

## Pillar 4: Minimalist UI & Design System Adherence

VaultBill has a polished fintech aesthetic inspired by Linear and Stripe. When creating or modifying UI components in `apps/web`:

1. **"Less Div, Sleek & Focused"**:
   - Do not wrap elements in excessive, unnecessary wrapper divs.
   - Rely on single-level cards: `border border-border bg-card` with clean internal padding (`p-4` to `p-6`).
   - Use flat, scannable layouts: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`.
2. **Strict Design Tokens**:
   - Never introduce hardcoded hex colors (e.g. `text-[#333]`). Use semantic CSS classes: `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-card`, `border-border`, `bg-accent`.
   - Support light mode and dark mode natively through semantic tokens.
3. **Typography Discipline**:
   - **Plus Jakarta Sans**: Used for headings, body text, badges, and button labels.
   - **JetBrains Mono** (`font-mono`): Strictly required for all monetary amounts, forex exchange rates, invoice numbers, SWIFT codes, GSTINs, and PANs.
4. **No Terminal Gimmicks**:
   - Avoid pitch-black terminal backdrops (`#000`), neon green terminal text, or grainy noise textures.
   - Maintain warm, professional slate contrast (`hsl(222 47% 11%)` canvas in dark mode).
5. **Component Reuse**:
   - Always reuse existing primitives in `apps/web/src/components/ui/`: `Button`, `Card`, `Input`, `Badge`, `Divider`, `Container`, `Illustration`.

---

## Pillar 5: Fintech Domain & Statutory Soundness

When dealing with Indian regulatory and cross-border billing features, agents must strictly respect codified statutory rules:

1. **Forex Rate Notation**:
   - Always format currency rates as `1 Foreign Currency Unit = INR Price` (e.g. `1 USD = ₹86.85`, `1 EUR = ₹94.40`).
   - Distinguish **Tier 1 FBIL Reference Rates** (mandated by RBI for customs and official valuation) from **Tier 2 FEDAI Rates** (interbank rates for GCC pairs like AED, SAR).
2. **FEMA 270-Day Export Realization**:
   - Full export proceeds must be realized within 270 days from invoice issuance under Section 7 of FEMA 1999.
   - Alert thresholds: `< 180 days` (Normal), `180 – 239 days` (Warning), `240+ days` (Critical).
3. **LRS & TCS Section 206C(1G)**:
   - Annual LRS ceiling: `$250,000 USD` per financial year per PAN.
   - TCS threshold: `₹7,00,000 INR` cumulative per financial year.
   - Rates: `0.5%` for loan-backed education, `5.0%` for medical/self-education, `20.0%` for foreign tour packages and investments.
4. **GST & Zero-Rated Exports**:
   - First 2 digits of GSTIN represent state code.
   - Intra-state = CGST (rate / 2) + SGST (rate / 2).
   - Inter-state = IGST (rate).
   - Export with valid LUT = 0% GST (Zero-Rated).
5. **FLM-8 Money Changer Equation**:
   - $\text{Closing Balance} = \text{Opening Balance} + \text{Purchases} - \text{Sales}$.

---

## 🤖 Agent Execution Workflow Summary

```text
1. Receive Task
      │
2. Read Schema & Existing Code (Read-Before-Edit)
      │
3. Implement Solution with Minimal, Precise Edits
      │
4. Verify: Run `pnpm typecheck` & `pnpm --filter @vaultbill/shared test`
      │
5. Check UI: Adheres to DESIGN_SYSTEM.md ("Less Div", JetBrains Mono)
      │
6. Stage & Commit: `git commit -m "<emoji> <type>: description"`
      │
7. Report Completion with Specific Evidence
```
