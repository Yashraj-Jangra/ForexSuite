import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  boolean,
  integer,
  date,
  index,
  jsonb,
  bigint,
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
  // KYC / Identity fields for FFMC Cash Memo
  passportNumber: text('passport_number'),
  nationality: text('nationality').default('INDIAN'),
  gender: text('gender').default('Ms.'),            // Mr. / Ms. / M/s.
  defaultPurpose: text('default_purpose'),          // PRIVATE VISIT, BUSINESS, EDUCATION, MEDICAL
  placeOfSupply: text('place_of_supply'),           // e.g. (06) HARYANA
  defaultDestinationCountry: text('default_destination_country'),
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
}, (table) => ({
  baseCurrencyIdx: index('exchange_rates_base_currency_idx').on(table.baseCurrency),
  targetCurrencyIdx: index('exchange_rates_target_currency_idx').on(table.targetCurrency),
}));

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  invoiceType: text('invoice_type').default('tax_invoice'), // cash_memo | tax_invoice | export_invoice
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
  // Cash Memo / Forex fields
  saleDate: date('sale_date'),
  placeOfSupply: text('place_of_supply'),
  paymentMode: text('payment_mode').default('CASH'),       // CASH | CARD | UPI | NEFT
  paymentReference: text('payment_reference'),
  transactionNarrative: text('transaction_narrative'),
  gstTaxableAmount: numeric('gst_taxable_amount'),
  cgstRate: numeric('cgst_rate'),
  cgstAmount: numeric('cgst_amount'),
  sgstRate: numeric('sgst_rate'),
  sgstAmount: numeric('sgst_amount'),
  igstRate: numeric('igst_rate'),
  igstAmount: numeric('igst_amount'),
  roundOff: numeric('round_off'),
  lrsLine: text('lrs_line'),
  amountInWords: text('amount_in_words'),
  disclaimer1: text('disclaimer1'),
  disclaimer2: text('disclaimer2'),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  dueAt: timestamp('due_at'),
  // Soft delete — financial records must never be hard-deleted (FEMA 5-year retention)
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdIdx: index('invoices_customer_id_idx').on(table.customerId),
}));

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
  // Forex / Cash Memo specific
  currencyName: text('currency_name'),                    // e.g. EURO CURRENCY - -CN
  sacCode: text('sac_code'),                              // default 997157
  amountForeign: numeric('amount_foreign'),               // foreign currency amount
  itemExchangeRate: numeric('item_exchange_rate'),         // rate used for this line
  amountInr: numeric('amount_inr'),                       // computed: amountForeign * rate
}, (table) => ({
  invoiceIdIdx: index('invoice_items_invoice_id_idx').on(table.invoiceId),
}));

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
  // GST portal acknowledgment (Form RFD-11)
  gstPortalAckNumber: text('gst_portal_ack_number'),
  financialYear: text('financial_year'),            // e.g. '2025-26'
  autoRenewReminder: boolean('auto_renew_reminder').default(true),
  reminderSentAt: timestamp('reminder_sent_at'),
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
  // e-FIRC / EDPMS fields (FEMA 2026 compliance)
  eFircReference: text('e_firc_reference'),         // EDPMS reference number
  adBankName: text('ad_bank_name'),                 // Authorized Dealer bank
  remitterName: text('remitter_name'),              // Foreign sender name
  shortRealizationFlag: boolean('short_realization_flag').default(false),
  shortRealizationAmount: numeric('short_realization_amount'),
  shortRealizationReason: text('short_realization_reason'), // 'bank_charges' | 'rate_difference' | 'other'
  compoundingRequired: boolean('compounding_required').default(false),
  edpmsStatus: text('edpms_status').default('pending'), // 'pending' | 'reported' | 'closed'
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
}, (table) => ({
  remitterPanIdx: index('remittances_remitter_pan_idx').on(table.remitterPan),
}));

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
  // Extended KYC + FLM register fields (RBI FFMC compliance)
  customerPassportExpiry: date('customer_passport_expiry'),
  customerPan: text('customer_pan'),
  transactionSlipNumber: text('transaction_slip_number'), // Sequential slip for FLM-2/3
  denominationDetails: jsonb('denomination_details'),     // [{denomination:50, count:10, amount:500}]
  isRectified: boolean('is_rectified').default(false),    // Correction entry marker for FLM
  verifiedById: uuid('verified_by_id'),                   // User who verified (for multi-user)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  transactionDateIdx: index('forex_transactions_date_idx').on(table.transactionDate),
}));

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const businessProfile = pgTable('business_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Company identity
  companyName: text('company_name').notNull().default(''),
  address1: text('address1').default(''),
  address2: text('address2').default(''),
  city: text('city').default(''),
  state: text('state').default(''),
  stateCode: text('state_code').default(''),
  pincode: text('pincode').default(''),
  phone: text('phone').default(''),
  email: text('email').default(''),
  website: text('website').default(''),
  // Regulatory identifiers
  rbiLicenceNo: text('rbi_licence_no').default(''),
  cin: text('cin').default(''),
  pan: text('pan').default(''),
  gstin: text('gstin').default(''),
  // Assets
  logoBase64: text('logo_base64'),
  signatureBase64: text('signature_base64'),
  // Invoice number configuration
  invoiceNumberFormat: text('invoice_number_format').default('INV-{YY}-{SEQ}'),
  invoiceNumberSeed: integer('invoice_number_seed').default(0),
  // Invoice styling & template selection
  invoiceTemplate: text('invoice_template').default('modern'), // 'modern' | 'executive' | 'classic' | 'minimal' | 'corporate'
  invoiceAccentColor: text('invoice_accent_color').default('#2563eb'),
  // GST defaults
  defaultSacCode: text('default_sac_code').default('997157'),
  defaultCgstRate: numeric('default_cgst_rate').default('9'),
  defaultSgstRate: numeric('default_sgst_rate').default('9'),
  defaultIgstRate: numeric('default_igst_rate').default('18'),
  defaultGstTaxableBasePct: numeric('default_gst_taxable_base_pct').default('1'),
  // Defaults
  disclaimer1: text('disclaimer1').default('Please count your money before leaving the counter.'),
  disclaimer2: text('disclaimer2').default('If any dispute arises against this invoice by any Law Enforcement Agency/Cyber Crime Cell/Any Regulating Authority, Clients will be solely responsible for the same.'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Email Settings ───────────────────────────────────────────────────────────
// Stores per-tenant email delivery config: VaultBill-hosted / Gmail OAuth / custom SMTP
export const emailSettings = pgTable('email_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  mode: text('mode').notNull().default('vaultbill'), // 'vaultbill' | 'gmail_oauth' | 'smtp'
  // Gmail OAuth (tokens encrypted AES-256-GCM server-side)
  gmailAccessToken: text('gmail_access_token'),
  gmailRefreshToken: text('gmail_refresh_token'),
  gmailEmail: text('gmail_email'),
  // Custom SMTP (password encrypted AES-256-GCM)
  smtpHost: text('smtp_host'),
  smtpPort: integer('smtp_port').default(587),
  smtpUser: text('smtp_user'),
  smtpPass: text('smtp_pass'),      // stored encrypted
  smtpFromName: text('smtp_from_name'),
  smtpFromEmail: text('smtp_from_email'),
  smtpSecure: boolean('smtp_secure').default(false),
  // Last test send status
  lastTestAt: timestamp('last_test_at'),
  lastTestStatus: text('last_test_status'), // 'ok' | 'failed'
  lastTestError: text('last_test_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Backup Configuration ─────────────────────────────────────────────────────
export const backupConfig = pgTable('backup_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleInterval: text('schedule_interval').default('4h'), // '4h' | '12h' | '24h'
  retentionDays: integer('retention_days').default(90),
  // Google Drive destination
  gdriveEnabled: boolean('gdrive_enabled').default(false),
  gdriveTokens: text('gdrive_tokens'),     // encrypted JSON {access_token, refresh_token}
  gdriveFolderId: text('gdrive_folder_id'),
  gdriveEmail: text('gdrive_email'),
  // S3 / MinIO destination
  s3Enabled: boolean('s3_enabled').default(false),
  s3Bucket: text('s3_bucket'),
  s3AccessKey: text('s3_access_key'),
  s3SecretKey: text('s3_secret_key'),      // encrypted
  s3Region: text('s3_region').default('ap-south-1'),
  s3Endpoint: text('s3_endpoint'),         // for MinIO custom endpoints
  // Status
  lastBackupAt: timestamp('last_backup_at'),
  lastBackupStatus: text('last_backup_status'), // 'success' | 'failed'
  lastBackupError: text('last_backup_error'),
  lastBackupSizeBytes: bigint('last_backup_size_bytes', { mode: 'number' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Audit Log ────────────────────────────────────────────────────────────────
// FEMA requires 5-year retention of all financial records and their change history
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: text('entity_type').notNull(), // 'invoice'|'firc'|'customer'|'remittance'|'lut'|'forex_transaction'|'edf'
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(),          // 'created'|'updated'|'status_changed'|'matched'|'exported'|'deleted'
  userId: text('user_id'),                   // null = system job
  diff: jsonb('diff'),                       // { before: {...}, after: {...} }
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  meta: jsonb('meta'),                       // extra context (e.g. matched FIRC ref, status transition)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  entityTypeIdx: index('audit_log_entity_type_idx').on(table.entityType),
  entityIdIdx: index('audit_log_entity_id_idx').on(table.entityId),
  createdAtIdx: index('audit_log_created_at_idx').on(table.createdAt),
}));

// ─── EDF Records (SOFTEX replacement — mandatory from Oct 1, 2026) ────────────
export const edfRecords = pgTable('edf_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  edfNumber: text('edf_number'),             // EDF reference assigned by AD bank
  financialYear: text('financial_year').notNull(), // '2026-27'
  buyerName: text('buyer_name').notNull(),
  buyerCountry: text('buyer_country').notNull(),
  buyerAddress: text('buyer_address'),
  purposeCode: text('purpose_code').notNull(), // e.g. 'P0802'
  amountForeign: numeric('amount_foreign').notNull(),
  currency: text('currency').notNull(),
  amountInr: numeric('amount_inr'),
  adBankName: text('ad_bank_name'),           // Authorized Dealer bank
  adBranchCity: text('ad_branch_city'),
  softexNumber: text('softex_number'),        // Legacy SOFTEX ref if migrating old records
  status: text('status').notNull().default('draft'), // 'draft'|'submitted'|'acknowledged'|'closed'
  submittedAt: timestamp('submitted_at'),
  acknowledgedAt: timestamp('acknowledged_at'),
  pdfPath: text('pdf_path'),                  // Uploaded signed EDF PDF
  notes: text('notes'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  invoiceIdIdx: index('edf_records_invoice_id_idx').on(table.invoiceId),
  statusIdx: index('edf_records_status_idx').on(table.status),
}));
