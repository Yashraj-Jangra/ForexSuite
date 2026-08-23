import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  boolean,
  integer,
  date,
} from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country').notNull(),
  pincode: text('pincode'),
  gstin: text('gstin'),
  pan: text('pan'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const currencies = pgTable('currencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  decimalPlaces: integer('decimal_places').notNull().default(2),
});

export const exchangeRates = pgTable('exchange_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  baseCurrency: text('base_currency').notNull(),
  targetCurrency: text('target_currency').notNull(),
  rate: numeric('rate').notNull(),
  source: text('source').notNull(),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id),
  currency: text('currency').notNull(),
  exchangeRate: numeric('exchange_rate'),
  subtotal: numeric('subtotal').notNull(),
  taxAmount: numeric('tax_amount').notNull().default('0'),
  total: numeric('total').notNull(),
  status: text('status').notNull().default('draft'),
  notes: text('notes'),
  isExport: boolean('is_export').default(false),
  lutNumber: text('lut_number'),
  fircId: uuid('firc_id'),
  shippingBillNumber: text('shipping_bill_number'),
  portOfLoading: text('port_of_loading'),
  dateOfExport: date('date_of_export'),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  dueAt: timestamp('due_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id),
  description: text('description').notNull(),
  quantity: numeric('quantity').notNull(),
  unitPrice: numeric('unit_price').notNull(),
  amount: numeric('amount').notNull(),
  hsnCode: text('hsn_code'),
  gstRate: numeric('gst_rate'),
});

export const vendors = pgTable('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country').notNull(),
  pincode: text('pincode'),
  gstin: text('gstin'),
  pan: text('pan'),
  bankName: text('bank_name'),
  bankAccountNumber: text('bank_account_number'),
  bankIfsc: text('bank_ifsc'),
  bankSwift: text('bank_swift'),
  bankAddress: text('bank_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const lutRegistrations = pgTable('lut_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  referenceNumber: text('reference_number').notNull(),
  issuedDate: date('issued_date').notNull(),
  expiryDate: date('expiry_date').notNull(),
  issuingAuthority: text('issuing_authority').notNull(),
  pdfPath: text('pdf_path'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const fircs = pgTable('fircs', {
  id: uuid('id').primaryKey().defaultRandom(),
  fircNumber: text('firc_number').notNull(),
  issuingBank: text('issuing_bank').notNull(),
  dateOfIssuance: date('date_of_issuance').notNull(),
  amount: numeric('amount').notNull(),
  currency: text('currency').notNull(),
  exchangeRate: numeric('exchange_rate'),
  amountInr: numeric('amount_inr'),
  purposeCode: text('purpose_code'),
  pdfPath: text('pdf_path'),
  unmappedAmountInr: numeric('unmapped_amount_inr'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const remittances = pgTable('remittances', {
  id: uuid('id').primaryKey().defaultRandom(),
  remitterName: text('remitter_name').notNull(),
  remitterPan: text('remitter_pan').notNull(),
  remitterAadhaar: text('remitter_aadhaar'),
  remitterAccount: text('remitter_account'),
  beneficiaryName: text('beneficiary_name').notNull(),
  beneficiaryBankDetails: text('beneficiary_bank_details'),
  beneficiaryCountry: text('beneficiary_country').notNull(),
  purposeCode: text('purpose_code').notNull(),
  purposeDescription: text('purpose_description'),
  amountForeign: numeric('amount_foreign').notNull(),
  currency: text('currency').notNull(),
  exchangeRate: numeric('exchange_rate'),
  amountInr: numeric('amount_inr'),
  tcsPercentage: numeric('tcs_percentage'),
  tcsAmount: numeric('tcs_amount'),
  panFinancialYearRemitted: numeric('pan_financial_year_remitted_total'),
  formA2PdfPath: text('form_a2_pdf_path'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rbiPurposeCodes = pgTable('rbi_purpose_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  category: text('category').notNull(),
  description: text('description').notNull(),
});

export const forexTransactions = pgTable('forex_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionDate: date('transaction_date').notNull(),
  currency: text('currency').notNull(),
  transactionType: text('transaction_type').$type<'purchase' | 'sale'>().notNull(),
  category: text('category').notNull(),
  amount: numeric('amount').notNull(),
  conversionRate: numeric('conversion_rate'),
  customerName: text('customer_name'),
  customerPassportKyc: text('customer_passport_kyc'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});