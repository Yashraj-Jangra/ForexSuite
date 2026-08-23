import { db } from './index';
import { sql } from 'drizzle-orm';

const TENANT_TABLES = [
  `CREATE TABLE "tenant_{id}"."customers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "email" text, "phone" text, "address" text,
    "city" text, "state" text,
    "country" text NOT NULL, "pincode" text,
    "gstin" text, "pan" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE "tenant_{id}"."invoices" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "invoice_number" text NOT NULL,
    "customer_id" uuid, "currency" text NOT NULL,
    "exchange_rate" numeric, "subtotal" numeric NOT NULL,
    "tax_amount" numeric DEFAULT '0' NOT NULL,
    "total" numeric NOT NULL, "status" text DEFAULT 'draft' NOT NULL,
    "notes" text, "is_export" boolean DEFAULT false,
    "lut_number" text, "firc_id" uuid,
    "shipping_bill_number" text, "port_of_loading" text,
    "date_of_export" date,
    "issued_at" timestamp DEFAULT now() NOT NULL,
    "due_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "tenant_{id}_invoices_number_unique" UNIQUE("invoice_number")
  )`,
  `CREATE TABLE "tenant_{id}"."invoice_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "invoice_id" uuid NOT NULL,
    "description" text NOT NULL,
    "quantity" numeric NOT NULL,
    "unit_price" numeric NOT NULL,
    "amount" numeric NOT NULL,
    "hsn_code" text, "gst_rate" numeric
  )`,
  `CREATE TABLE "tenant_{id}"."currencies" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "code" text NOT NULL, "name" text NOT NULL,
    "symbol" text NOT NULL,
    "decimal_places" integer DEFAULT 2 NOT NULL,
    CONSTRAINT "tenant_{id}_currencies_code_unique" UNIQUE("code")
  )`,
  `CREATE TABLE "tenant_{id}"."exchange_rates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "base_currency" text NOT NULL,
    "target_currency" text NOT NULL,
    "rate" numeric NOT NULL,
    "source" text NOT NULL,
    "fetched_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE "tenant_{id}"."vendors" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL, "email" text, "phone" text,
    "address" text, "city" text, "state" text,
    "country" text NOT NULL, "pincode" text,
    "gstin" text, "pan" text,
    "bank_name" text, "bank_account_number" text,
    "bank_ifsc" text, "bank_swift" text, "bank_address" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE "tenant_{id}"."lut_registrations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "reference_number" text NOT NULL,
    "issued_date" date NOT NULL,
    "expiry_date" date NOT NULL,
    "issuing_authority" text NOT NULL,
    "pdf_path" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE "tenant_{id}"."fircs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "firc_number" text NOT NULL,
    "issuing_bank" text NOT NULL,
    "date_of_issuance" date NOT NULL,
    "amount" numeric NOT NULL,
    "currency" text NOT NULL,
    "exchange_rate" numeric,
    "amount_inr" numeric,
    "purpose_code" text,
    "pdf_path" text,
    "unmapped_amount_inr" numeric,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE "tenant_{id}"."remittances" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "remitter_name" text NOT NULL,
    "remitter_pan" text NOT NULL,
    "remitter_aadhaar" text,
    "remitter_account" text,
    "beneficiary_name" text NOT NULL,
    "beneficiary_bank_details" text,
    "beneficiary_country" text NOT NULL,
    "purpose_code" text NOT NULL,
    "purpose_description" text,
    "amount_foreign" numeric NOT NULL,
    "currency" text NOT NULL,
    "exchange_rate" numeric,
    "amount_inr" numeric,
    "tcs_percentage" numeric,
    "tcs_amount" numeric,
    "pan_financial_year_remitted_total" numeric,
    "form_a2_pdf_path" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE "tenant_{id}"."rbi_purpose_codes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "code" text NOT NULL,
    "category" text NOT NULL,
    "description" text NOT NULL,
    CONSTRAINT "tenant_{id}_purpose_codes_unique" UNIQUE("code")
  )`,
];

const TENANT_FOREIGN_KEYS = [
  `ALTER TABLE "tenant_{id}"."invoice_items"
   ADD CONSTRAINT "tenant_{id}_items_invoice_fk"
   FOREIGN KEY ("invoice_id") REFERENCES "tenant_{id}"."invoices"("id")`,
  `ALTER TABLE "tenant_{id}"."invoices"
   ADD CONSTRAINT "tenant_{id}_invoices_customer_fk"
   FOREIGN KEY ("customer_id") REFERENCES "tenant_{id}"."customers"("id")`,
];

const DEFAULT_CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', decimalPlaces: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimalPlaces: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimalPlaces: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimalPlaces: 0 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimalPlaces: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalPlaces: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', decimalPlaces: 2 },
];

function t(sql: string, tenantId: string): string {
  return sql.replace(/\{id\}/g, tenantId);
}

export async function provisionTenantSchema(tenantId: string) {
  await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS "tenant_${tenantId}"`));

  for (const tableSql of TENANT_TABLES) {
    await db.execute(sql.raw(t(tableSql, tenantId)));
  }

  for (const fkSql of TENANT_FOREIGN_KEYS) {
    await db.execute(sql.raw(t(fkSql, tenantId)));
  }

  for (const curr of DEFAULT_CURRENCIES) {
    await db.execute(
      sql.raw(
        `INSERT INTO "tenant_${tenantId}"."currencies" ("code", "name", "symbol", "decimal_places")
         VALUES ('${curr.code}', '${curr.name}', '${curr.symbol}', ${curr.decimalPlaces})`,
      ),
    );
  }

  return { tenantId, seeded: DEFAULT_CURRENCIES.length };
}