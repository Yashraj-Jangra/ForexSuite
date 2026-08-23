# VaultBill Design System (v2.0)

A sleek, minimal, and modern fintech design system crafted for multi-currency invoicing, forex management, and statutory regulatory compliance (RBI/FEMA, GST LUT, Form A2, FLM-8).

Designed for real business owners, finance teams, and international founders — not raw developer terminals.

---

## 1. Color System

All colors use HSL tokens defined in `src/design-system/tokens.css` and exposed via Tailwind CSS semantic classes (`text-foreground`, `bg-card`, `bg-accent`, `border-border`).

### Semantic Color Tokens

| Token | Light Mode (Clean Slate) | Dark Mode (Midnight Slate) | Role & Usage |
|---|---|---|---|
| `--background` | `210 40% 98%` (soft slate white) | `222 47% 11%` (rich charcoal slate) | Main viewport canvas |
| `--foreground` | `222 47% 11%` (deep high-contrast slate) | `210 40% 98%` (crisp white) | Primary typography |
| `--card` | `0 0% 100%` (pure white) | `217 33% 15%` (elevated surface) | Cards, panels, tables |
| `--card-foreground`| `222 47% 11%` | `210 40% 98%` | Text on card surfaces |
| `--primary` / `--accent` | `221 83% 53%` (Royal Indigo) | `217 91% 60%` (Electric Indigo) | Primary buttons, active tabs |
| `--secondary` | `210 40% 96%` | `217 33% 18%` | Secondary button fills |
| `--muted` | `210 40% 96%` | `217 33% 18%` | Subdued surface backgrounds |
| `--muted-foreground` | `215 16% 47%` (balanced slate) | `215 20% 65%` (neutral slate) | Captions, hints, subtitles |
| `--border` | `214 32% 91%` (crisp subtle line) | `217 33% 22%` (clean divider) | 1px dividers, card outlines |
| `--destructive` | `0 84% 60%` (Rose Red) | `0 72% 51%` | Overdue, errors, deletion |
| `--success` | `142 71% 45%` (Emerald) | `142 60% 45%` | Paid status, balanced statement |
| `--warning` | `38 92% 50%` (Amber Gold) | `38 92% 50%` | FEMA realization warnings |

### Accent Presets

Users can customize the workspace accent in **Settings → Appearance**:

| ID | Preset Name | Light HSL | Dark HSL | Style Character |
|---|---|---|---|---|
| `indigo` *(Default)* | Royal Indigo | `221 83% 53%` | `217 91% 60%` | Modern SaaS, Linear-inspired |
| `blue` | Ocean Blue | `212 100% 48%` | `212 100% 60%` | Trustworthy, corporate fintech |
| `violet` | Modern Violet | `262 83% 58%` | `263 70% 66%` | Premium, elegant |
| `emerald` | Emerald | `160 84% 39%` | `158 64% 52%` | Wealth, currency, growth |
| `rose` | Rose | `346 87% 53%` | `349 89% 62%` | Dynamic, bold |
| `amber` | Amber | `38 92% 50%` | `43 96% 56%` | Warm, gold, high-visibility |

---

## 2. Typography

We use **Plus Jakarta Sans** as our primary interface font for clean, friendly geometric legibility, paired with **JetBrains Mono** for monetary amounts, invoice numbers, SWIFT codes, and PANs.

### Hierarchy & Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| **Display / H1** | `24px` – `30px` (`text-2xl` / `text-3xl`) | `700` (Bold) | `1.2` | `-0.025em` | Page main headers |
| **Section / H2** | `18px` – `20px` (`text-lg` / `text-xl`) | `700` (Bold) | `1.3` | `-0.02em` | Card groups, major panels |
| **Subsection / H3** | `14px` – `16px` (`text-sm` / `text-base`) | `600` (Semibold) | `1.4` | `-0.01em` | Form section headings, modal titles |
| **Body (Regular)** | `13px` – `14px` (`text-xs` / `text-sm`) | `400` / `500` | `1.5` | `normal` | Descriptions, body copy |
| **Subtext / Captions** | `11px` – `12px` (`text-[11px]` / `text-xs`) | `500` / `600` | `1.4` | `normal` | Helper hints, dates, metadata |
| **Numbers / Currency** | `12px` – `24px` | `700` (`font-mono`) | `1.2` | `tight` | Monetary values, forex rates, IDs |

---

## 3. UI/UX Principles: "Less Div, Sleek & Focused"

1. **Flat Hierarchy**: Avoid deeply nested card-in-card containers. Use single-level clean cards with subtle `border border-border` and generous internal padding (`p-4` to `p-6`).
2. **High Information Density with Visual Breathing Room**: Clean grid arrangements (`grid gap-4 sm:grid-cols-2 lg:grid-cols-4`) so users can scan financial metrics in milliseconds.
3. **No Terminal Gimmicks**: Avoid pitch-black backgrounds, neon terminal text, or heavy noise grain overlays. Maintain warm, professional contrast suitable for everyday business workflows.
4. **Instant Actionability**: Primary actions ("New Invoice", "Download Form A2 PDF", "Sync Rates Now") are always prominent with clear icons and immediate visual feedback.
5. **Multi-Currency Clarity**: Every currency amount displays both currency code and properly formatted commas (e.g. `USD 15,000` / `₹1,298,400`).

---

## 4. Elevation & Radius

| Preset | `--radius` | Usage |
|---|---|---|
| `sharp` | `0.375rem` (6px) | Dense data / compact tabular views |
| `rounded` *(Default)* | `0.875rem` (14px) | Standard cards, dialogs, buttons |
| `pill` | `1.5rem` (24px) | Soft organic UI elements |

---

## 5. File Map

```
apps/web/src/
├── design-system/
│   ├── tokens.css          # Core HSL custom properties (light + dark + 6 accent presets)
│   ├── types.ts            # ThemeConfig, ACCENT_PRESETS, RADIUS_PRESETS
│   └── index.ts            # Exports
├── providers/
│   └── ThemeProvider.tsx    # React theme context & localStorage persistence
├── components/
│   ├── Sidebar.tsx          # Minimal sleek sidebar navigation
│   └── ui/                  # Button, Card, Input, Container, Logo, etc.
└── app/
    ├── globals.css          # Base resets, Plus Jakarta Sans font, clean scrollbar
    ├── layout.tsx           # Clean root layout with theme initialization
    └── (dashboard)/         # Clean dashboard, invoices, compliance, and settings pages
```