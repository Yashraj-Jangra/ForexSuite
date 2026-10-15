# @vaultbill/pdf

Headless Puppeteer PDF generation engine, HTML/CSS template suite, and statutory export documents for **VaultBill**.

---

## 🎨 Invoice Design Archetypes

`packages/pdf` provides 5 distinct invoice design templates rendered at high-DPI A4 print specifications:

| Archetype | Characteristics | Typical Use Case |
|---|---|---|
| **Modern** | Sleek, contemporary layout with subtle divider borders and brand badges. | SaaS, agencies, tech startups |
| **Executive** | High-contrast, structured layout with bold headings and formal financial seals. | Law firms, consultancies, leadership |
| **Classic** | Traditional corporate typography and tabular ledger arrangements. | Manufacturing, traditional trading |
| **Minimal** | Ultra-lean, high-density layout prioritizing white space and essential line items. | Freelancers, creative studios |
| **Corporate** | Robust multi-column layout optimized for multi-stakeholder invoices. | Enterprise accounts, holding companies |

---

## 🏛️ Statutory PDF Generators

- **RBI Form A2 (`src/templates/formA2.ts`)**:
  Generates the official declaration required for outward remittances under the Liberalised Remittance Scheme (LRS), pre-populated with beneficiary details, remitter PAN, and RBI purpose codes.

---

## 🚀 Commands

```bash
# Build template bundles
pnpm --filter @vaultbill/pdf build

# Typecheck
pnpm --filter @vaultbill/pdf typecheck
```
