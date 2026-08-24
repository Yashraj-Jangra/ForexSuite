import { CashMemoData, fmt, fmtRate, escapeHtml } from './types';

export function renderClassicInvoice(data: CashMemoData): string {
  const bp = data.businessProfile;
  const isCashMemo = !data.invoiceType || data.invoiceType === 'cash_memo' || data.invoiceType === 'tax_invoice';

  const stateDisplay = bp?.stateCode ? `State: (${bp.stateCode}) ${bp?.state ?? ''}` : (bp?.state ?? '');
  const docTitle = isCashMemo ? 'CASH MEMO' : 'TAX INVOICE';
  const docSubtitle = isCashMemo ? '(ORIGINAL COPY)<br><strong>(Tax Invoice under GST)</strong>' : '(ORIGINAL COPY)';

  const itemRows = data.items.map((item, idx) => {
    const amtForeign = Number(item.amountForeign ?? item.quantity ?? 0);
    const rate = Number(item.itemExchangeRate ?? item.unitPrice ?? 0);
    const amtInr = Number(item.amountInr ?? item.amount ?? 0);
    const currencyLabel = item.currencyName ?? item.description ?? '';
    const sac = item.sacCode ?? '997157';
    return `<tr>
      <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #000;border-right:1px solid #000;">${idx + 1}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #000;border-right:1px solid #000;font-weight:bold;">${escapeHtml(currencyLabel)}</td>
      <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #000;border-right:1px solid #000;font-family:monospace;">${escapeHtml(sac)}</td>
      <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #000;border-right:1px solid #000;font-family:monospace;">${fmt(amtForeign)}</td>
      <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #000;border-right:1px solid #000;font-family:monospace;">${fmtRate(rate)}</td>
      <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #000;font-weight:bold;font-family:monospace;">${fmt(amtInr)}</td>
    </tr>`;
  }).join('');

  const cgst = Number(data.cgstAmount ?? 0);
  const sgst = Number(data.sgstAmount ?? 0);
  const igst = Number(data.igstAmount ?? 0);
  const roundOff = Number(data.roundOff ?? 0);
  const gstTaxable = Number(data.gstTaxableAmount ?? 0);
  const tcsAmt = Number(data.tcsAmount ?? 0);

  const gstRows = data.useIgst
    ? `<tr><td style="text-align:right;padding:3px 8px;"><strong>IGST @ ${data.igstRate ?? 18}%:</strong></td><td style="text-align:right;padding:3px 8px;min-width:90px;font-family:monospace;">${fmt(igst)}</td></tr>`
    : `<tr><td style="text-align:right;padding:3px 8px;"><strong>CGST @ ${data.cgstRate ?? 9}%:</strong></td><td style="text-align:right;padding:3px 8px;min-width:90px;font-family:monospace;">${fmt(cgst)}</td></tr>
       <tr><td style="text-align:right;padding:3px 8px;"><strong>SGST @ ${data.sgstRate ?? 9}%:</strong></td><td style="text-align:right;padding:3px 8px;min-width:90px;font-family:monospace;">${fmt(sgst)}</td></tr>`;

  const tcsRow = data.tcsApplicable && tcsAmt > 0
    ? `<tr><td style="text-align:right;padding:3px 8px;"><strong>TCS @ ${data.tcsRate ?? 5}%:</strong></td><td style="text-align:right;padding:3px 8px;min-width:90px;font-family:monospace;">${fmt(tcsAmt)}</td></tr>`
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
  <title>${docTitle} – ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Times New Roman", Times, Georgia, serif; font-size: 11px; color: #000; padding: 18px; background: #fff; line-height: 1.35; }
    .outer-border { border: 2px solid #000; }
    .section { border-bottom: 1.5px solid #000; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; }
    .two-col > div:first-child { border-right: 1.5px solid #000; }
    .pad { padding: 8px 10px; }
    table.items { width: 100%; border-collapse: collapse; }
    table.items th { background: #000; color: #fff; padding: 6px 8px; text-align: center; font-size: 10px; text-transform: uppercase; font-family: Arial, sans-serif; letter-spacing: 0.5px; border-right: 1px solid #333; }
    table.items th:last-child { border-right: none; }
    table.items td { font-size: 10.5px; }
    .gst-block { display: grid; grid-template-columns: 1fr auto; align-items: end; padding: 6px 10px; }
    .total-row { border-top: 1.5px solid #000; padding: 6px 10px; display: flex; justify-content: flex-end; align-items: center; gap: 30px; font-size: 13px; font-weight: 900; }
    .sig-row { display: grid; grid-template-columns: 1fr 1fr; min-height: 70px; }
    .sig-row > div:first-child { border-right: 1.5px solid #000; padding: 8px 10px; }
    .sig-row > div:last-child { padding: 8px 10px; text-align: right; }
    .brand-header { display: flex; flex-direction: column; align-items: center; padding: 10px; border-bottom: 1.5px solid #000; }
    p { line-height: 1.4; }
    strong { font-weight: 700; }
  </style>
</head>
<body>
<div class="outer-border">

  <!-- Brand Header -->
  <div class="brand-header">
    ${logoHtml}
    <h1 style="font-size: 16px; font-weight: 900; text-align: center; letter-spacing: 1.5px; text-transform: uppercase;">
      ${escapeHtml(bp?.companyName ?? 'AUTHORISED MONEY CHANGER')}
    </h1>
  </div>

  <!-- Document Title Banner -->
  <div class="section" style="padding:6px;text-align:center;background:#f8f8f8;">
    <div style="font-size:14px;font-weight:900;letter-spacing:2px;font-family:Arial,sans-serif;">${docTitle}</div>
    <div style="font-size:10px;margin-top:2px;">${docSubtitle}</div>
  </div>

  <!-- Seller + Regulatory Info -->
  <div class="section two-col">
    <div class="pad">
      <p><strong>${escapeHtml(bp?.companyName ?? '')}</strong></p>
      <p>${escapeHtml(bp?.address1 ?? '')}</p>
      ${bp?.address2 ? `<p>${escapeHtml(bp.address2)}</p>` : ''}
      <p>${[bp?.city, bp?.pincode].filter(Boolean).map(escapeHtml).join(' - ')}</p>
      ${bp?.phone ? `<p>Phone: ${escapeHtml(bp.phone)}</p>` : ''}
      <p>${escapeHtml(stateDisplay)}</p>
    </div>
    <div class="pad">
      ${bp?.rbiLicenceNo ? `<p>RBI Licence No: <strong style="font-family:monospace;">${escapeHtml(bp.rbiLicenceNo)}</strong></p>` : ''}
      ${bp?.cin ? `<p>CIN No: <strong style="font-family:monospace;">${escapeHtml(bp.cin)}</strong></p>` : ''}
      ${bp?.pan ? `<p>PAN No: <strong style="font-family:monospace;">${escapeHtml(bp.pan)}</strong></p>` : ''}
      ${bp?.gstin ? `<p>GSTIN: <strong style="font-family:monospace;">${escapeHtml(bp.gstin)}</strong></p>` : ''}
    </div>
  </div>

  <!-- Invoice Header + Customer + QR -->
  <div class="section two-col">
    <div class="pad" style="padding-right:16px;">
      <p style="margin-bottom:6px;font-family:Arial,sans-serif;font-size:11px;">
        <strong>INVOICE NO: <span style="font-family:monospace;">${escapeHtml(data.invoiceNumber)}</span></strong>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <strong>DATE: ${escapeHtml(data.invoiceDate)}</strong>
      </p>
      <p><strong>M/s / Shri / Smt:</strong> ${escapeHtml(data.customerGender ? data.customerGender + ' ' : '')}${escapeHtml(data.customerName)}</p>
      ${data.customerAddress ? `<p>Address: ${escapeHtml(data.customerAddress)}</p>` : ''}
      ${data.customerPurpose ? `<p>Purpose of Travel: <strong>${escapeHtml(data.customerPurpose)}</strong></p>` : ''}
      ${data.placeOfSupply ? `<p>Place Of Supply: <strong>${escapeHtml(data.placeOfSupply)}</strong></p>` : ''}
      ${data.saleDate ? `<p>Sale Date: ${escapeHtml(data.saleDate)}</p>` : ''}
      ${data.customerPan ? `<p>PAN: <strong style="font-family:monospace;">${escapeHtml(data.customerPan)}</strong></p>` : ''}
      ${data.customerPassport ? `<p>Passport No: <strong style="font-family:monospace;">${escapeHtml(data.customerPassport)}</strong></p>` : ''}
      ${data.customerNationality ? `<p>Nationality: <strong>${escapeHtml(data.customerNationality)}</strong></p>` : ''}
    </div>
    <div class="pad" style="display:flex;align-items:center;justify-content:center;">
      <div style="width:96px;height:96px;border:1.5px solid #000;display:flex;align-items:center;justify-content:center;font-size:9px;color:#000;text-align:center;font-family:monospace;">
        VERIFY QR<br/>${escapeHtml(data.invoiceNumber)}
      </div>
    </div>
  </div>

  <!-- Narrative -->
  ${data.transactionNarrative ? `<div class="section pad"><p style="font-style:italic;">${escapeHtml(data.transactionNarrative)}</p></div>` : ''}

  <!-- Transaction Table -->
  <div class="section">
    <table class="items">
      <thead>
        <tr>
          <th style="width:40px;">S.No.</th>
          <th style="text-align:left;">Currency / Particulars</th>
          <th style="width:70px;">SAC</th>
          <th style="width:90px;text-align:right;">Amount (FC)</th>
          <th style="width:110px;text-align:right;">Rate</th>
          <th style="width:110px;text-align:right;">Rs. Equivalent</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <!-- GST Block -->
  <div class="section">
    <div class="gst-block">
      <div>
        <strong>GST Taxable Value:</strong>
        <span style="margin-left:20px;font-family:monospace;font-weight:bold;">₹ ${fmt(gstTaxable)}</span>
      </div>
      <table style="border-collapse:collapse;">
        ${gstRows}
        ${tcsRow}
        ${roundOff !== 0 ? `<tr><td style="text-align:right;padding:3px 8px;"><strong>Round Off:</strong></td><td style="text-align:right;padding:3px 8px;font-family:monospace;">₹ ${fmt(roundOff)}</td></tr>` : ''}
      </table>
    </div>
  </div>

  <!-- Total Row -->
  <div class="section total-row">
    <span>TOTAL PAYABLE (INR):</span>
    <span style="font-family:monospace;font-size:15px;">₹ ${fmt(data.total)}</span>
  </div>

  <!-- Amount in words -->
  <div class="section pad">
    <p><strong>Amount in Words:</strong> ${escapeHtml(data.amountInWords ?? 'Rupees ' + fmt(data.total) + ' Only')}</p>
  </div>

  <!-- Disclaimers & Notes -->
  <div class="section pad" style="font-size:8.5px;line-height:1.4;">
    ${data.disclaimer1 ? `<p>1. ${escapeHtml(data.disclaimer1)}</p>` : ''}
    ${data.disclaimer2 ? `<p>2. ${escapeHtml(data.disclaimer2)}</p>` : ''}
    ${data.lrsLine ? `<p>3. ${escapeHtml(data.lrsLine)}</p>` : ''}
  </div>

  <!-- Signatures -->
  <div class="sig-row">
    <div>
      <p style="margin-bottom:32px;">Client's Signature:</p>
      <p style="font-size:9.5px;color:#555;">(Signature of the Purchaser / Authorised Rep.)</p>
    </div>
    <div>
      <p style="margin-bottom:4px;">For <strong>${escapeHtml(bp?.companyName ?? 'Authorized Signatory')}</strong></p>
      ${sigHtml}
      <p style="margin-top:4px;font-size:9.5px;font-weight:bold;">Authorised Signatory</p>
    </div>
  </div>

</div>
</body>
</html>`;
}
