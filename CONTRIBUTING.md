# Contributing to VaultBill

Thank you for your interest in contributing to **VaultBill**! We are building the open-source standard for multi-currency invoicing, statutory Indian forex management, and cross-border regulatory compliance.

To maintain the highest level of software reliability required by fintech and financial systems, we enforce a strict **"Zero-Error & High-Soundness"** standard. Please read this guide carefully before submitting issues or pull requests.

---

## 🏛️ Guiding Principles

1. **Fintech Precision First**: Financial numbers, statutory formulas (FEMA, TCS, GST, FLM-8), and tax split calculations must be mathematically exact, strictly typed, and thoroughly tested.
2. **Zero Errors Policy**: We do not merge pull requests with type errors, lint warnings, failing tests, or unhandled promise rejections.
3. **Clean, Minimal UI**: All interface work must honor our "Less Div, Sleek & Focused" design system. Avoid unnecessary nesting, raw pitch-black terminals, or neon gimmicks.
4. **Disciplined Git Hygiene**: Atomic commits, expressive gitmoji prefixes, and squashed trial attempts keep our project history pristine.

---

## 🛠️ Local Development Setup

### Prerequisites

- **Node.js**: `>= 22.0.0`
- **pnpm**: `^11.0.0` (or `11.22.0`)
- **Docker**: Docker Desktop / Docker Engine + Compose

### Step-by-Step Environment Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-username>/vaultbill.git
cd vaultbill

# 2. Install workspace dependencies
pnpm install

# 3. Start local infrastructure (PostgreSQL 16, Redis 7, MinIO)
pnpm infra:up

# 4. Initialize environment variables
cp .env.example .env

# 5. Push initial Drizzle schemas to PostgreSQL
pnpm db:migrate

# 6. Launch dev cluster in watch mode
pnpm dev
```

Visit:

- **Web Interface**: `http://localhost:3000`
- **API Server & tRPC**: `http://localhost:3001`
- **MinIO S3 Console**: `http://localhost:9004` (Credentials: `vaultbill_admin` / `vaultbill_minio_dev`)

---

## 🚦 Verification Gates ("Zero-Error" Policy)

Before committing or opening a Pull Request, your branch must satisfy the following checks locally:

```bash
# 1. Typecheck: Must pass across all 7 packages with 0 errors
pnpm typecheck

# 2. Linter: Must pass ESLint flat config with 0 errors
pnpm lint

# 3. Unit Tests: All statutory math & utility tests must pass
pnpm test

# 4. Formatting: Ensure Prettier formatting is applied
pnpm format
```

> **Important**: Pull Requests that fail automated CI runs (`pnpm typecheck`, `pnpm lint`, `pnpm test`) will not be reviewed until all errors are resolved.

---

## 📝 Git Commit Style & Conventions

We follow the **Gitmoji + Type Prefix** commit standard. Keep commit titles casual, lowercase, imperative, and without trailing periods.

### Format

```text
<emoji> <type>: <short description>
```

### Commit Types Matrix

| Emoji | Type        | Purpose                                   | Example                                                   |
| ----- | ----------- | ----------------------------------------- | --------------------------------------------------------- |
| ✨    | `feat`      | New feature or capability                 | `✨ feat: add form a2 rbi purpose code search`            |
| 🐛    | `fix`       | Bug fix or calculation patch              | `🐛 fix: gst split calculation for sead inter-state`      |
| 🎨    | `style`     | UI polish, theme tokens, styling          | `🎨 style: polish rates chart hover crosshair tooltips`   |
| ♻️    | `refactor`  | Code restructuring without feature change | `♻️ refactor: extract fbil rate normalizer to shared`     |
| 🔧    | `config`    | Configuration, environment, Docker        | `🔧 config: update minio dev port to 9003`                |
| 🗃️    | `db`        | Database schema, Drizzle, migrations      | `🗃️ db: add rate date and source provider columns`        |
| 🚀    | `deploy/ci` | CI/CD, GitHub Actions, Dockerfiles        | `🚀 deploy/ci: add vitest step to pr workflow`            |
| 🧹    | `chore`     | Maintenance, dependency updates, cleanups | `🧹 chore: cleanup unused workspace artifacts`            |
| ✅    | `test`      | Adding or updating unit tests             | `✅ test: add tcs threshold crossing test cases`          |
| 🏗️    | `scaffold`  | Monorepo scaffolding, boilerplate init    | `🏗️ scaffold: initialize worker package structure`        |
| 🔒    | `security`  | Security fix, permission hardening        | `🔒 security: enforce session revocation in fastify hook` |

### Commit Hygiene Rules

1. **Commit After Every Meaningful Unit of Work**: Do not create massive multi-day uncommitted diffs. Multiple small, clear commits per feature are preferred.
2. **Squash Failed Attempts**: If an implementation took 3 attempts to get right, squash the failed attempts before requesting review. The final history should read cleanly as if it worked the first time:
   ```text
   Before (Messy):
     fix: try port 9000
     fix: port 9002 attempt
     🐛 fix: actually use port 9003

   After (Clean):
     🐛 fix: update minio service port to 9003
   ```
3. **Never Force-Push to Protected Branches**: Only rewrite your local feature branch before submission. Never push or force-push to `main` without explicit approval.

---

## 🎨 Clean Minimal UI Guidelines

When building or refining interface components, adhere strictly to the rules in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md):

1. **"Less Div, Sleek & Focused"**:
   - Avoid deep div-soup wrapping containers (`<div><div><div>...</div></div></div>`).
   - Use flat, single-level cards with subtle 1px borders: `border border-border bg-card`.
   - Maintain generous internal breathing room: `p-4` to `p-6`.
2. **Semantic HSL Design Tokens**:
   - Never hardcode arbitrary hex colors (e.g. avoid `bg-[#1a1b1e]`).
   - Use semantic Tailwind classes: `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-accent`.
3. **Typography Standards**:
   - **Plus Jakarta Sans**: Default primary font for interface copy, titles, buttons, and navigation.
   - **JetBrains Mono**: Strictly required for all monetary amounts, exchange rates, invoice numbers, GSTINs, SWIFT codes, and PANs.
4. **No Terminal Gimmicks**:
   - Maintain warm, professional fintech contrast (`hsl(222 47% 11%)` dark slate canvas).
   - Avoid pitch-black backgrounds, neon green text, or noisy grain textures.

---

## 💻 Code Best Practices

### 1. TypeScript & Type Safety

- Strict mode is enabled across the monorepo.
- Do not use `any`. If a payload type is unknown at compile time, use `unknown` and parse it through a **Zod** schema.
- Validate external inputs (Fastify request bodies, tRPC inputs, environment variables) using Zod.

### 2. Database Multi-Tenancy & Drizzle

- Always operate within the tenant context (`ctx.tenantDb`) for tenant-specific tables (invoices, customers, remittances, FIRCs, etc.).
- Never run cross-schema joins between a tenant schema and the `public` schema directly in application queries.
- Wrap multi-table operations (e.g. creating an invoice along with multiple line items) in database transactions.

### 3. Safe Error Handling

- Never swallow errors silently in catch blocks.
- Preserve error causes when re-throwing custom operational errors:
  ```typescript
  try {
    await sendEmail(...);
  } catch (error) {
    throw new Error('Failed to dispatch invoice email', { cause: error });
  }
  ```

---

## 🔄 Pull Request Lifecycle

1. **Branch Naming**:
   - `feat/<short-description>`
   - `fix/<short-description>`
   - `docs/<short-description>`
   - `perf/<short-description>`
2. **Open a PR**:
   - Fill out the provided Pull Request Template (`.github/pull_request_template.md`).
   - Link any related issue (e.g. `Closes #42`).
   - Ensure the PR description details what changed and why.
3. **Automated CI Validation**:
   - GitHub Actions will run `pnpm typecheck`, `pnpm lint`, and `pnpm test`.
4. **Code Review**:
   - Maintainers will review the code for correctness, performance, test coverage, and design system adherence.
   - Address feedback using atomic fix commits, then squash if requested.
