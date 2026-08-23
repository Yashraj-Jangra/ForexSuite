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
}

function fmt(n: number | string | null | undefined, decimals = 2): string {
  const num = Number(n ?? 0);
  return num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtRate(n: number | string | null | undefined): string {
  return Number(n ?? 0).toFixed(9);
}

export function renderInvoiceHtml(data: CashMemoData): string {
  const bp = data.businessProfile;
  const isCashMemo = !data.invoiceType || data.invoiceType === 'cash_memo' || data.invoiceType === 'tax_invoice';

  const stateDisplay = bp?.stateCode ? `State: (${bp.stateCode}) ${bp?.state ?? ''}` : (bp?.state ?? '');
  const docTitle = isCashMemo ? 'CASH MEMO' : 'TAX INVOICE';
  const docSubtitle = isCashMemo ? '(ORIGINAL COPY)<br><strong>(Tax Invoice)</strong>' : '';

  const itemRows = data.items.map((item, idx) => {
    const amtForeign = Number(item.amountForeign ?? item.quantity ?? 0);
    const rate = Number(item.itemExchangeRate ?? item.unitPrice ?? 0);
    const amtInr = Number(item.amountInr ?? item.amount ?? 0);
    const currencyLabel = item.currencyName ?? item.description ?? '';
    const sac = item.sacCode ?? '997157';
    return `<tr>
      <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #ddd;">${idx + 1}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;">${currencyLabel}</td>
      <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #ddd;">${sac}</td>
      <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #ddd;">${fmt(amtForeign)}</td>
      <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #ddd;font-family:monospace;">${fmtRate(rate)}</td>
      <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #ddd;font-weight:600;">${fmt(amtInr)}</td>
    </tr>`;
  }).join('');

  const cgst = Number(data.cgstAmount ?? 0);
  const sgst = Number(data.sgstAmount ?? 0);
  const igst = Number(data.igstAmount ?? 0);
  const roundOff = Number(data.roundOff ?? 0);
  const gstTaxable = Number(data.gstTaxableAmount ?? 0);
  const tcsAmt = Number(data.tcsAmount ?? 0);

  const gstRows = data.useIgst
    ? `<tr><td style="text-align:right;padding:3px 8px;"><strong>IGST @ ${data.igstRate ?? 18}%:</strong></td><td style="text-align:right;padding:3px 8px;min-width:80px;">${fmt(igst)}</td></tr>`
    : `<tr><td style="text-align:right;padding:3px 8px;"><strong>CGST @ ${data.cgstRate ?? 9}%:</strong></td><td style="text-align:right;padding:3px 8px;min-width:80px;">${fmt(cgst)}</td></tr>
       <tr><td style="text-align:right;padding:3px 8px;"><strong>SGST @ ${data.sgstRate ?? 9}%:</strong></td><td style="text-align:right;padding:3px 8px;min-width:80px;">${fmt(sgst)}</td></tr>`;

  const tcsRow = data.tcsApplicable && tcsAmt > 0
    ? `<tr><td style="text-align:right;padding:3px 8px;"><strong>TCS @ ${data.tcsRate ?? 5}%:</strong></td><td style="text-align:right;padding:3px 8px;min-width:80px;">${fmt(tcsAmt)}</td></tr>`
    : '';

  const logoHtml = bp?.logoBase64
    ? `<img src="${bp.logoBase64}" style="height:60px;object-fit:contain;margin-bottom:4px;" alt="logo" />`
    : '';

  const sigHtml = bp?.signatureBase64
    ? `<img src="${bp.signatureBase64}" style="height:50px;object-fit:contain;" alt="signature" />`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${docTitle} – ${data.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 20px; background: #fff; }
    h1.doc-title { font-size: 15px; font-weight: 900; text-align: center; letter-spacing: 1px; }
    .doc-subtitle { font-size: 11px; text-align: center; margin-bottom: 4px; }
    .outer-border { border: 2px solid #000; }
    .section { border-bottom: 1.5px solid #000; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; }
    .two-col > div:first-child { border-right: 1.5px solid #000; }
    .pad { padding: 8px 10px; }
    table.items { width: 100%; border-collapse: collapse; }
    table.items th { background: #000; color: #fff; padding: 6px 8px; text-align: center; font-size: 10.5px; }
    table.items td { font-size: 10.5px; }
    .gst-block { display: grid; grid-template-columns: 1fr auto; align-items: end; padding: 6px 10px; }
    .total-row { border-top: 1.5px solid #000; padding: 6px 10px; display: flex; justify-content: flex-end; align-items: center; gap: 30px; font-size: 12px; font-weight: 900; }
    .sig-row { display: grid; grid-template-columns: 1fr 1fr; min-height: 70px; }
    .sig-row > div:first-child { border-right: 1.5px solid #000; padding: 8px 10px; }
    .sig-row > div:last-child { padding: 8px 10px; text-align: right; }
    .brand-header { display: flex; flex-direction: column; align-items: center; padding: 10px; border-bottom: 1.5px solid #000; }
    .lbl { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
    p { line-height: 1.5; }
    strong { font-weight: 700; }
  </style>
</head>
<body>
<div class="outer-border">

  <!-- Brand Header -->
  <div class="brand-header">
    ${logoHtml}
    <h1 class="doc-title">${bp?.companyName ?? 'COMPANY NAME'}</h1>
  </div>

  <!-- Document Title -->
  <div class="section" style="padding:6px;text-align:center;">
    <div style="font-size:14px;font-weight:900;letter-spacing:2px;">${docTitle}</div>
    <div class="doc-subtitle">${docSubtitle}</div>
  </div>

  <!-- Seller + Regulatory Info -->
  <div class="section two-col">
    <div class="pad">
      <p>${bp?.address1 ?? ''}</p>
      ${bp?.address2 ? `<p>${bp.address2}</p>` : ''}
      <p>${[bp?.city, bp?.pincode].filter(Boolean).join(' - ')}</p>
      ${bp?.phone ? `<p>Phone: ${bp.phone}</p>` : ''}
      <p>${stateDisplay}</p>
    </div>
    <div class="pad">
      ${bp?.rbiLicenceNo ? `<p>RBI Licence No: <strong>${bp.rbiLicenceNo}</strong></p>` : ''}
      ${bp?.cin ? `<p>CIN No: <strong>${bp.cin}</strong></p>` : ''}
      ${bp?.pan ? `<p>PAN No: <strong>${bp.pan}</strong></p>` : ''}
      ${bp?.gstin ? `<p>GSTIN: <strong>${bp.gstin}</strong></p>` : ''}
    </div>
  </div>

  <!-- Invoice Header + Customer + QR -->
  <div class="section two-col">
    <div class="pad" style="padding-right:16px;">
      <p style="margin-bottom:10px;">
        <strong>Invoice No.: ${data.invoiceNumber}</strong>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <strong>Date: ${data.invoiceDate}</strong>
      </p>
      <p><strong>${data.customerName}</strong></p>
      ${data.customerAddress ? `<p>${data.customerAddress}</p>` : ''}
      ${data.customerPurpose ? `<p>Purpose: <strong>${data.customerPurpose}</strong></p>` : ''}
      ${data.placeOfSupply ? `<p>Place Of Supply: <strong>${data.placeOfSupply}</strong></p>` : ''}
      ${data.saleDate ? `<p>Sale Date: <strong>${data.saleDate}</strong></p>` : ''}
      ${data.customerPan ? `<p>PAN: <strong>${data.customerPan}</strong></p>` : ''}
      ${data.customerPassport ? `<p>Passport: <strong>${data.customerPassport}</strong></p>` : ''}
      ${data.customerNationality ? `<p>Nationality: <strong>${data.customerNationality}</strong></p>` : ''}
    </div>
    <div class="pad" style="display:flex;align-items:center;justify-content:center;">
      <div style="width:110px;height:110px;border:2px solid #000;display:flex;align-items:center;justify-content:center;font-size:9px;color:#777;text-align:center;">QR CODE<br/>${data.invoiceNumber}</div>
    </div>
  </div>

  <!-- Narrative -->
  ${data.transactionNarrative ? `<div class="section pad"><p>${data.transactionNarrative}</p></div>` : ''}

  <!-- Transaction Table -->
  <div class="section">
    <table class="items">
      <thead>
        <tr>
          <th style="width:40px;">S.No.</th>
          <th style="text-align:left;">Currency Sold</th>
          <th style="width:70px;">SAC</th>
          <th style="width:80px;text-align:right;">Amount</th>
          <th style="width:120px;text-align:right;">Rate</th>
          <th style="width:100px;text-align:right;">Rs. Equivalent</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <!-- GST Block -->
  <div class="section">
    <div class="gst-block">
      <div>
        <strong>GST Taxable Amount:</strong>
        <span style="margin-left:20px;">${fmt(gstTaxable)}</span>
      </div>
      <table style="border-collapse:collapse;">
        <tbody>
          ${gstRows}
          ${tcsRow}
          <tr><td style="text-align:right;padding:3px 8px;"><strong>ROUND OFF:</strong></td><td style="text-align:right;padding:3px 8px;min-width:80px;">${fmt(Math.abs(roundOff))}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="total-row">
      <span>Total Amount:</span>
      <span style="font-size:14px;">${fmt(data.total)}</span>
    </div>
  </div>

  <!-- Summary Lines -->
  <div class="section pad">
    <p><strong>Total Value(Inclusive of GST${data.tcsApplicable ? ' and TCS' : ''}) (In Figures):</strong> ${fmt(data.total)}</p>
    <p><strong>Total Value (In Words):</strong> ${data.amountInWords ?? ''}</p>
  </div>

  <!-- Payment Row -->
  <div class="section" style="padding:6px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:5px 10px;width:40px;border-right:1.5px solid #ccc;text-align:center;">1</td>
        <td style="padding:5px 10px;font-weight:700;">${data.paymentMode ?? 'CASH'}</td>
        <td style="padding:5px 10px;border-left:1.5px solid #ccc;">${data.paymentMode ?? 'CASH'}</td>
        <td style="padding:5px 10px;"></td>
        <td style="padding:5px 10px;text-align:right;font-weight:700;">${fmt(data.total)}</td>
      </tr>
    </table>
  </div>

  <!-- LRS Line -->
  ${data.lrsLine ? `<div class="section pad"><p>LRS :- ${data.lrsLine}</p></div>` : ''}

  <!-- Disclaimers -->
  <div class="section pad">
    ${data.disclaimer1 ? `<p>${data.disclaimer1}</p>` : ''}
    ${data.disclaimer2 ? `<p style="margin-top:3px;">${data.disclaimer2}</p>` : ''}
  </div>

  <!-- Signatures -->
  <div class="sig-row">
    <div>
      <p><strong>Signature of Customer</strong></p>
      <p style="margin-top:4px;font-size:10px;">Add: ${data.customerAddress ?? ''}</p>
    </div>
    <div>
      <p><strong>Signature of Authorised Official</strong></p>
      <div style="margin-top:8px;">${sigHtml}</div>
    </div>
  </div>

</div>
</body>
</html>`;
}