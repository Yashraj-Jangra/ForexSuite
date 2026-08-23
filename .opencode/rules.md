# Git Rules

## Commit Style

Use gitmoji + type prefix, keep it casual.

| Emoji | Type | When |
|-------|------|------|
| ✨ | feat | new feature |
| 🐛 | fix | bug fix |
| 🎨 | style | ui/styling |
| ♻️ | refactor | code restructuring |
| 🔧 | config | config/setup changes |
| 🗃️ | db | database/schema/migrations |
| 🚀 | deploy/ci | deploy, CI/CD |
| 🧹 | chore | cleanup, formatting |
| ✅ | test | tests |
| 🏗️ | scaffold | boilerplate, project init |
| 🔒 | security | security fixes |

**Format:** `<emoji> <type>: short description`

Examples:
- `✨ feat: invoice pdf generation`
- `🐛 fix: gst split wrong for interstate`
- `🎨 style: dashboard layout tweaks`
- `🔧 config: swap minio ports`
- `🗃️ db: drizzle setup and first migration`
- `🏗️ scaffold: monorepo setup`

No periods, lowercase, say what changed.

## Commit After Every Task

Commit after every meaningful unit of work. Don't leave uncommitted changes around. Multiple commits per feature is fine.

## Never Push Unless I Say So

Only sync to origin when explicitly told to.

## Cleaning Up Failed Attempts

If you try something 3 times and the first 2 fail, squash them into one clean commit. History should look like you got it right first try.

```
Before:
  fix: try port 9000
  fix: port 9002 attempt
  🐛 fix: actually use port 9003

After:
  🐛 fix: minio port to 9003
```

Use `git rebase -i` to squash. If there were day gaps between attempts, adjust the commit date so it doesn't look like dead days.

## When I Say "Clean Commit History"

- Squash all fix-attempt commits for the same thing into one
- Fill timeline gaps — if we didn't commit for a few days, redistribute dates so it looks continuous
- Keep the final working commit, clean and casual
- Only rewrite local history, never force-push unless I approved it

## Quality Check

- `pnpm typecheck` should pass before committing
- Don't commit broken builds
- One thing per commit, focused diffs