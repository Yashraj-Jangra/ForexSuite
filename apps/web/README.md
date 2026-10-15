# @vaultbill/web

The frontend web application for **VaultBill**, built with **Next.js 14 (App Router)**, **React**, **Tailwind CSS**, and **tRPC**.

---

## 🎨 UI & Design Principles

This application implements the [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) specification:
- **"Less Div, Sleek & Focused"**: Minimalist, flat component hierarchy with single-level cards (`border border-border bg-card`) and generous breathing room (`p-4` to `p-6`).
- **Semantic HSL Design Tokens**: Fully themed light and dark modes with 6 customizable workspace accents (`indigo`, `blue`, `violet`, `emerald`, `rose`, `amber`).
- **Dual Typography**: **Plus Jakarta Sans** for interface text and UI controls; **JetBrains Mono** (`font-mono`) for all monetary amounts, exchange rates, invoice numbers, SWIFT codes, and PANs.
- **Zero Terminal Gimmicks**: Professional fintech aesthetics with no pitch-black terminals or fluorescent neon text.

---

## 📁 Directory Structure

```text
apps/web/src/
├── app/
│   ├── (auth)/             # Split-screen login & signup with showcase panel
│   ├── (dashboard)/        # Main app shell (invoices, forex studio, compliance)
│   │   ├── compliance/     # FEMA 270d, e-FIRC board, LRS Form A2, FLM-8
│   │   ├── customers/      # Customer master directory
│   │   ├── invoices/       # Invoice CRUD, line items, 5 PDF archetypes
│   │   ├── settings/       # Appearance, rates scheduler, team, backups
│   │   └── vendors/        # Vendor master directory
│   ├── globals.css         # Typography, reset, and scrollbar rules
│   └── layout.tsx          # Root layout with ThemeProvider & TRPCProvider
├── components/
│   ├── Sidebar.tsx         # Sleek collapsible sidebar navigation
│   └── ui/                 # Atomic UI primitives (Button, Card, Input, Badge, etc.)
├── design-system/
│   ├── tokens.css          # Semantic HSL color variables
│   └── types.ts            # Accent and radius presets
└── providers/
    ├── ThemeProvider.tsx   # React theme context & localStorage persistence
    └── TrpcProvider.tsx    # React Query + tRPC client wrapper
```

---

## 🚀 Running the Web App

```bash
# Inside workspace root
pnpm --filter @vaultbill/web dev

# Typecheck
pnpm --filter @vaultbill/web typecheck
```
Web app runs on `http://localhost:3000`.
