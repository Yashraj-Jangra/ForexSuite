export type InvoiceTemplateId = 'modern' | 'executive' | 'classic' | 'minimal' | 'corporate';

export interface BusinessProfile {
  companyName: string;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  stateCode?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  rbiLicenceNo?: string | null;
  cin?: string | null;
  pan?: string | null;
  gstin?: string | null;
  logoBase64?: string | null;
  signatureBase64?: string | null;
  disclaimer1?: string | null;
  disclaimer2?: string | null;
}

export interface InvoiceItem {
  description: string;
  currencyName?: string | null;
  sacCode?: string | null;
  amountForeign?: string | number | null;
  itemExchangeRate?: string | number | null;
  amountInr?: string | number | null;
  quantity?: string | number | null;
  unitPrice?: string | number | null;
  amount?: string | number | null;
}

export interface CashMemoData {
  // Business
  businessProfile?: BusinessProfile | null;
  // Invoice
  invoiceNumber: string;
  invoiceType?: string | null;
  invoiceDate: string;
  saleDate?: string | null;
  placeOfSupply?: string | null;
  // Customer
  customerName: string;
  customerAddress?: string | null;
  customerPan?: string | null;
  customerPassport?: string | null;
  customerNationality?: string | null;
  customerDestinationCountry?: string | null;
  customerPurpose?: string | null;
  customerGender?: string | null;
  // Narrative
  transactionNarrative?: string | null;
  // Line items
  items: InvoiceItem[];
  // GST
  gstTaxableAmount?: number | null;
  cgstRate?: number | null;
  cgstAmount?: number | null;
  sgstRate?: number | null;
  sgstAmount?: number | null;
  igstRate?: number | null;
  igstAmount?: number | null;
  useIgst?: boolean;
  roundOff?: number | null;
  // Totals
  subtotal?: number | null;
  total: number;
  amountInWords?: string | null;
  // TCS
  tcsRate?: number | null;
  tcsAmount?: number | null;
  tcsApplicable?: boolean;
  // Payment
  paymentMode?: string | null;
  paymentReference?: string | null;
  // LRS
  lrsLine?: string | null;
  // Disclaimers
  disclaimer1?: string | null;
  disclaimer2?: string | null;
  // Styling
  template?: InvoiceTemplateId;
  accentColor?: string;
}

export function fmt(n: number | string | null | undefined, decimals = 2): string {
  const num = Number(n ?? 0);
  return num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtRate(n: number | string | null | undefined): string {
  return Number(n ?? 0).toFixed(6);
}

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
