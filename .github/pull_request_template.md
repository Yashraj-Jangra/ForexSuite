# Pull Request

## 📋 Description

<!-- Provide a concise explanation of what this PR introduces, fixes, or refactors. -->

Closes #<!-- issue number if applicable -->

---

## 🏷️ Type of Change

- [ ] ✨ `feat`: New feature or capability
- [ ] 🐛 `fix`: Bug fix or calculation correction
- [ ] 🎨 `style`: UI polish, theme tokens, styling
- [ ] ♻️ `refactor`: Code restructuring without functional changes
- [ ] 🗃️ `db`: Database schema, Drizzle, migrations
- [ ] 🔧 `config`: Configuration, environment, Docker
- [ ] 🚀 `deploy/ci`: CI/CD, GitHub Actions, Dockerfiles
- [ ] ✅ `test`: Adding or updating tests
- [ ] 📝 `docs`: Documentation updates or additions
- [ ] 🧹 `chore`: Dependency updates, tooling, cleanup

---

## 🚦 Verification & Quality Checklist

Please confirm that all items are checked before requesting review:

- [ ] **Typecheck Passed**: `pnpm typecheck` exits with 0 errors across all 7 packages.
- [ ] **Linter Passed**: `pnpm lint` exits with 0 errors.
- [ ] **Tests Passed**: `pnpm test` (or `pnpm --filter @vaultbill/shared test`) runs green.
- [ ] **Clean Minimal UI**: If touching UI, verified adherence to `DESIGN_SYSTEM.md` ("Less Div", Plus Jakarta Sans, JetBrains Mono for numbers, HSL tokens).
- [ ] **Commit Hygiene**: Commits follow the Gitmoji standard (`<emoji> <type>: description`) and failed trial attempts have been squashed.
- [ ] **No Secret Leaks**: Verified no API keys, secrets, or `.env` credentials are committed.
