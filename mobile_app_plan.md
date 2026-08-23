# VaultBill Mobile App Plan

> Save for later — implement after web app is feature-complete.

## Strategy: React Native + Expo (`apps/mobile`)

Expo SDK 52+ with Expo Router (file-based routing matching Next.js mental model).

## Architecture

```
apps/mobile/
├── app/                         # File-based routing
│   ├── _layout.tsx              # Root layout + providers
│   ├── (auth)/                  # Login / signup screens
│   ├── (tabs)/                  # Bottom tab navigator
│   │   ├── _layout.tsx
│   │   ├── index.tsx            # Dashboard
│   │   ├── invoices/
│   │   │   ├── index.tsx        # Invoice list
│   │   │   ├── [id].tsx         # Invoice detail + PDF view
│   │   │   └── create.tsx       # New invoice
│   │   └── downloads.tsx        # Offline PDF library
├── src/
│   ├── lib/
│   │   ├── api-client.ts        # Fetch wrapper (auth headers, base URL)
│   │   └── storage.ts           # AsyncStorage + offline queue
│   ├── components/              # Mobile-first UI components
│   ├── hooks/                   # useInvoices, useAuth, etc.
│   └── providers/               # QueryProvider, AuthProvider
├── package.json
├── app.json                     # Expo config
├── tsconfig.json
└── tailwind.config.js           # NativeWind
```

## Reused from Existing Monorepo

| Package | Reused in mobile |
|---|---|
| `@vaultbill/shared` | All Zod schemas, types, utils, date/currency helpers |
| `@vaultbill/config` | Env validation, RBI constants, TCS thresholds, purpose codes |
| `apps/api` | Same Fastify REST endpoints |

## Key Dependencies

| Concern | Library |
|---|---|
| Routing | `expo-router` |
| Styling | `nativewind` (TailwindCSS for RN) |
| Data fetching | `@tanstack/react-query` (already used in web) |
| PDF viewing | `expo-print` + `react-native-pdf` |
| PDF download | `expo-file-system` + `expo-sharing` |
| Push notifications | `expo-notifications` |
| Offline cache | `@react-native-async-storage/async-storage` + React Query persist |
| Icons | `lucide-react-native` |

## MVP Feature Map

| Feature | Implementation |
|---|---|
| Dashboard | Summary cards via `@tanstack/react-query` |
| Invoice list | FlatList + pull-to-refresh + paginated API |
| Invoice detail + PDF | View data, tap to render PDF via `react-native-pdf` |
| Download PDF | `expo-file-system` download → `expo-sharing` |
| Create invoice | Form wizard using shared Zod schemas for validation |
| Push notifications | FEMA 270-day alerts via `expo-notifications` |
| Offline mode | React Query persist + AsyncStorage + mutation queue |

## Integration Points to Add Later

1. `packages/shared` — add `api-client.ts` (typed fetch wrapper, used by both web + mobile)
2. `turbo.json` — add mobile build task
3. `.env.example` — add `EXPO_PUBLIC_API_URL`
4. GitHub Actions — add EAS Build workflow for app store deployments