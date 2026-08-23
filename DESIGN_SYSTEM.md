# VaultBill Design System

A minimal, sleek design system built for a multi-currency invoicing platform. Mobile-first, user-experience optimized, with first-class dark mode support.

---

## Color System

All colors are defined as HSL custom properties in `src/design-system/tokens.css`. Tailwind references these via `hsl(var(--token))`.

### Semantic Tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | `40 30% 98%` (warm off-white) | `150 15% 4%` (deep green-black) | Page background |
| `--foreground` | `24 10% 15%` (soft black) | `40 30% 93%` (warm light) | Primary text |
| `--card` | `0 0% 100%` | `150 12% 7%` | Cards, surfaces |
| `--primary` | `var(--accent)` | `var(--accent)` | Primary actions, links |
| `--secondary` | `40 20% 94%` | `150 10% 12%` | Secondary surfaces |
| `--muted` | `40 20% 94%` | `150 10% 12%` | Muted backgrounds |
| `--muted-foreground` | `30 8% 42%` | `150 8% 62%` | Secondary text |
| `--border` | `30 8% 88%` | `150 10% 15%` | Borders, dividers |
| `--destructive` | `0 72% 51%` | `0 62% 45%` | Errors, delete actions |
| `--success` | `142 40% 45%` | `142 40% 45%` | Success states |
| `--warning` | `36 100% 50%` | `36 100% 48%` | Warnings |

### Accent Presets

Users can pick from 6 accent colors via `data-accent` attribute on `<html>`:

| ID | Name | Light HSL | Dark HSL |
|---|---|---|---|
| `sage` | Sage (default) | `155 40% 35%` | `155 50% 48%` |
| `mint` | Mint | `160 55% 40%` | `160 50% 50%` |
| `teal` | Teal | `175 50% 38%` | `175 45% 48%` |
| `olive` | Olive | `65 30% 35%` | `65 30% 47%` |
| `forest` | Forest | `145 35% 28%` | `145 38% 40%` |
| `emerald` | Emerald | `150 50% 42%` | `150 45% 52%` |

### Contrast Ratios (WCAG AA)

- Foreground on Background: **4.8:1** (light), **5.2:1** (dark) — passes AA for normal text
- Primary on Background: **4.2:1** (light), **4.5:1** (dark) — passes AA for large text

---

## Typography

| Role | Font | Weight | Size | Tracking |
|---|---|---|---|---|
| Headings | `Inter` | 600 (semibold) | `3rem`–`4.5rem` | `-0.025em` |
| Body | `Inter` | 400 | `1rem` | normal |
| Accent/cursive | `Caveat`, `Reenie Beanie` | 400 | variable | normal |
| Small/captions | `Inter` | 400–500 | `0.75rem`–`0.875rem` | normal |

### Scale

`text-2xs` → `text-xs` → `text-sm` → `text-base` → `text-lg` → `text-xl` → `text-2xl` → `text-3xl` → `text-4xl` → `text-5xl` → `text-6xl` → `text-7xl`

**Rule**: Use sentence case for all headings. No all-caps. No title case.

---

## Spacing & Layout

- Base unit: **4px** (Tailwind default)
- Section vertical padding: `py-20` (80px)
- Container max widths: `sm` (3xl/768px), `md` (5xl/1024px), `lg` (6xl/1152px), `xl` (7xl/1280px)
- Card padding: `sm` (16px), `md` (24px), `lg` (32-40px)
- Mobile-first: all layouts start single-column, expand at `sm:` (640px) or `md:` (768px)

---

## Border Radius

Configurable via `data-radius` attribute:

| Preset | `--radius` | `--radius-sm` | `--radius-md` | `--radius-lg` |
|---|---|---|---|---|
| `sharp` | `0.375rem` | `0.25rem` | `0.375rem` | `0.5rem` |
| `rounded` (default) | `1rem` | `0.5rem` | `0.75rem` | `1.25rem` |
| `pill` | `2rem` | `1rem` | `1.5rem` | `2rem` |

Buttons always use `rounded-full` regardless of radius setting.

---

## Shadows

| Token | Value |
|---|---|
| `--shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.04)` |
| `--shadow-md` | `0 4px 20px -2px rgb(0 0 0 / 0.05)` |
| `--shadow-lg` | `0 12px 40px -8px rgb(0 0 0 / 0.08)` |
| `--shadow-xl` | `0 20px 60px -12px rgb(0 0 0 / 0.10)` |

Dark mode shadows use higher opacity (0.3–0.5) to remain visible against dark backgrounds.

---

## Animations

| Name | Duration | Easing | Usage |
|---|---|---|---|
| `reveal-up` | 0.8s | ease-out | Scroll-reveal content |
| `reveal-down` | 0.6s | ease-out | Drop-in elements (nav, modals) |
| `float` | 6s | ease-in-out | Background blobs (translateY ±10px) |
| `float-slow` | 10s | ease-in-out | Large background elements (+scale) |
| `pulse-soft` | 4s | ease-in-out | Breathing UI elements |
| `grain` | 8s | steps(10) | Grain texture animation |

**Rules**:
- Transitions on colors/opacity/shadow: `duration-200` to `duration-300`
- No animation exceeds 800ms for interactive elements
- Respect `prefers-reduced-motion`: all animations become 0.01ms
- User can toggle reduced motion in `/settings/appearance`

---

## Semantic HTML First

Prefer semantic elements over `<div>`:

| Instead of `<div>` | Use |
|---|---|
| Page wrapper | `<main>` |
| Navigation | `<nav>` |
| Content grouping | `<section>` |
| Self-contained unit | `<article>` |
| Sidebar | `<aside>` |
| Page header | `<header>` |
| Page footer | `<footer>` |
| Form group | `<fieldset>` |
| Text paragraph | `<p>` |
| Label | `<label>` |

The `<Container>` component accepts an `as` prop to render any semantic element. The `<Card>` component defaults to `<article>`.

---

## Component Conventions

1. **Composition over configuration**: Every component accepts `className` for Tailwind overrides.
2. **Use `cn()`** from `@/lib/utils` to merge classes, never manual string concatenation.
3. **`forwardRef`** on all interactive components for accessibility (focus management, react-hook-form).
4. **No hardcoded colors**: Use Tailwind semantic tokens (`text-foreground`, `bg-card`, `text-muted-foreground`, etc.) — never raw hex/HSL values in components.
5. **Variant via props, not CSS classes**: Use discriminated union props (e.g., `variant="outline"`) mapped to Tailwind classes internally.

---

## Illustration Usage

Illustrations live in `public/illustrations/`. The `<Illustration>` component references them by name via `src/illustrations/index.ts`.

```tsx
import { Illustration } from '@/components/ui/illustration';

<Illustration name="hero" alt="" className="max-w-sm" />
```

**Rules**:
- Each page/section should use a different illustration name
- Always provide `alt=""` for decorative illustrations (empty string, not missing)
- Illustrations are `pointer-events: none` and `select-none` by default
- If an illustration file is missing, the `<img>` automatically hides (no broken image)

### Available Illustration Names

`hero`, `dashboard`, `invoices`, `compliance`, `security`, `currency`, `empty`, `error`, `success`, `team`, `growth`, `shield`, `globe`, `chart`, `onboarding`, `notification`

---

## Grain Overlay

A fixed-position SVG noise overlay gives the UI a paper-like, analog feel. It uses `feTurbulence` with `baseFrequency="0.65"`, mixed via `mix-blend-mode: overlay` at 35% opacity.

- **z-index**: 9999
- **pointer-events**: none (doesn't block interaction)
- **Rendered once** in the root layout, not per page
- Can be disabled globally by removing the `<span className="grain-overlay" />` element (future setting)

---

## Theme Persistence

Theme preferences are stored in `localStorage` under `vaultbill-theme` and applied immediately via an inline `<script>` in `<ThemeProvider>` to prevent FOUC (flash of unstyled content).

- **Mode**: `light` | `dark` | `system`
- **Accent**: one of the 6 preset IDs
- **Radius**: one of the 3 preset IDs
- **Reduced motion**: boolean

The `data-*` attributes on `<html>` enable pure CSS overrides without JavaScript class manipulation per element.

---

## File Map

```
apps/web/src/
├── design-system/
│   ├── tokens.css          # All CSS custom properties (light + dark + accent presets)
│   ├── types.ts            # ThemeConfig type, ACCENT_PRESETS, RADIUS_PRESETS
│   └── index.ts            # Barrel exports
├── providers/
│   └── ThemeProvider.tsx    # React context + localStorage + system preference sync
├── components/ui/
│   ├── button.tsx           # Primary/secondary/outline/ghost/destructive/link
│   ├── card.tsx             # Semantic card with hover variant
│   ├── input.tsx            # Accessible input with label, hint, error, icons
│   ├── illustration.tsx     # Named illustration loader with fallback
│   ├── badge.tsx            # Status and label badges
│   ├── divider.tsx          # Horizontal rule with optional label
│   ├── container.tsx        # Responsive max-width container
│   └── logo.tsx             # VaultBill SVG logo
├── illustrations/
│   └── index.ts             # Illustration name → file path mapping
├── app/
│   ├── globals.css          # Tailwind directives + animations + grain + base resets
│   ├── layout.tsx           # Root layout (ThemeProvider + grain overlay)
│   ├── page.tsx             # Landing page
│   └── settings/appearance/
│       └── page.tsx         # Theme customization UI
└── lib/
    └── utils.ts             # cn() + formatHSL()
```