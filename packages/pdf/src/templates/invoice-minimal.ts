import { CashMemoData, fmt, fmtRate, escapeHtml } from './types';

export function renderMinimalInvoice(data: CashMemoData): string {
  const bp = data.businessProfile;
  const isCashMemo = !data.invoiceType || data.invoiceType === 'cash_memo' || data.invoiceType === 'tax_invoice';

  const docTitle = isCashMemo ? 'CASH MEMO' : 'TAX INVOICE';
  const stateDisplay = bp?.stateCode ? `(${bp.stateCode}) ${bp?.state ?? ''}` : (bp?.state ?? '');

  const itemRows = data.items.map((item, idx) => {
    const amtForeign = Number(item.amountForeign ?? item.quantity ?? 0);
    const rate = Number(item.itemExchangeRate ?? item.unitPrice ?? 0);
    const amtInr = Number(item.amountInr ?? item.amount ?? 0);
    const currencyLabel = item.currencyName ?? item.description ?? '';
    const sac = item.sacCode ?? '997157';
    return `<tr>
      <td style="text-align:left;padding:8px 0;border-bottom:1px solid #e5e5e5;font-family:monospace;color:#737373;">${idx + 1}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e5e5;font-weight:600;color:#171717;">${escapeHtml(currencyLabel)}</td>
      <td style="text-align:center;padding:8px 0;border-bottom:1px solid #e5e5e5;font-family:monospace;color:#737373;font-size:10px;">${escapeHtml(sac)}</td>
      <td style="text-align:right;padding:8px 0;border-bottom:1px solid #e5e5e5;font-family:monospace;">${fmt(amtForeign)}</td>
      <td style="text-align:right;padding:8px 0;border-bottom:1px solid #e5e5e5;font-family:monospace;color:#737373;">${fmtRate(rate)}</td>
      <td style="text-align:right;padding:8px 0;border-bottom:1px solid #e5e5e5;font-weight:700;font-family:monospace;color:#171717;">₹ ${fmt(amtInr)}</td>
    </tr>`;
  }).join('');

  const cgst = Number(data.cgstAmount ?? 0);
  const sgst = Number(data.sgstAmount ?? 0);
  const igst = Number(data.igstAmount ?? 0);
  const roundOff = Number(data.roundOff ?? 0);
  const gstTaxable = Number(data.gstTaxableAmount ?? 0);
  const tcsAmt = Number(data.tcsAmount ?? 0);

  const gstRows = data.useIgst
    ? `<tr><td style="text-align:right;padding:3px 0;color:#737373;font-size:10px;">IGST (${data.igstRate ?? 18}%):</td><td style="text-align:right;padding:3px 0;font-weight:600;font-family:monospace;">₹ ${fmt(igst)}</td></tr>`
    : `<tr><td style="text-align:right;padding:3px 0;color:#737373;font-size:10px;">CGST (${data.cgstRate ?? 9}%):</td><td style="text-align:right;padding:3px 0;font-weight:600;font-family:monospace;">₹ ${fmt(cgst)}</td></tr>
       <tr><td style="text-align:right;padding:3px 0;color:#737373;font-size:10px;">SGST (${data.sgstRate ?? 9}%):</td><td style="text-align:right;padding:3px 0;font-weight:600;font-family:monospace;">₹ ${fmt(sgst)}</td></tr>`;

  const tcsRow = data.tcsApplicable && tcsAmt > 0
    ? `<tr><td style="text-align:right;padding:3px 0;color:#737373;font-size:10px;">TCS (Sec 206C(1G)):</td><td style="text-align:right;padding:3px 0;font-weight:600;font-family:monospace;">₹ ${fmt(tcsAmt)}</td></tr>`
    : '';

  const logoHtml = bp?.logoBase64
    ? `<img src="${bp.logoBase64}" style="max-height:50px;max-width:160px;object-fit:contain;" alt="logo" />`
    : `<div style="font-size:18px;font-weight:800;letter-spacing:-0.5px;color:#171717;">${escapeHtml(bp?.companyName ?? 'COMPANY')}</div>`;

  const sigHtml = bp?.signatureBase64
    ? `<img src="${bp.signatureBase64}" style="max-height:44px;object-fit:contain;" alt="signature" />`
    : `<div style="height:36px;"></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${docTitle} – ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 10.5px; color: #171717; background: #fff; padding: 32px; line-height: 1.4; }
    .hr { border-bottom: 1px solid #171717; margin: 16px 0; }
    .hr-light { border-bottom: 1px solid #e5e5e5; margin: 12px 0; }
    table.min-table { width: 100%; border-collapse: collapse; text-align: left; }
    table.min-table th { padding: 8px 0; border-bottom: 1.5px solid #171717; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #171717; }
  </style>
</head>
<body>

  <!-- Top Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
    <div>
      ${logoHtml}
      <div style="font-size: 10px; color: #525252; margin-top: 6px; max-width: 280px;">
        ${escapeHtml(bp?.address1 ?? '')}${bp?.address2 ? ', ' + escapeHtml(bp.address2) : ''}<br>
        ${[bp?.city, bp?.pincode].filter(Boolean).map(escapeHtml).join(' ')} ${escapeHtml(stateDisplay)}<br>
        ${bp?.phone ? 'T ' + escapeHtml(bp.phone) : ''} ${bp?.email ? '· E ' + escapeHtml(bp.email) : ''}
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 18px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">${docTitle}</div>
      <div style="font-family: monospace; font-size: 11px; color: #525252; margin-top: 2px;">${escapeHtml(data.invoiceNumber)}</div>
      <div style="font-size: 10px; color: #737373; margin-top: 4px;">Date: ${escapeHtml(data.invoiceDate)}</div>
    </div>
  </div>

  <!-- Regulatory Line -->
  <div style="display: flex; justify-content: space-between; font-size: 9px; color: #737373; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5; padding: 6px 0; margin-bottom: 20px;">
    ${bp?.rbiLicenceNo ? `<div>RBI LIC: <span style="font-family:monospace;color:#171717;">${escapeHtml(bp.rbiLicenceNo)}</span></div>` : ''}
    ${bp?.cin ? `<div>CIN: <span style="font-family:monospace;color:#171717;">${escapeHtml(bp.cin)}</span></div>` : ''}
    ${bp?.pan ? `<div>PAN: <span style="font-family:monospace;color:#171717;">${escapeHtml(bp.pan)}</span></div>` : ''}
    ${bp?.gstin ? `<div>GSTIN: <span style="font-family:monospace;color:#171717;">${escapeHtml(bp.gstin)}</span></div>` : ''}
  </div>

  <!-- Customer KYC Row -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px;">
    <div>
      <div style="font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #737373; margin-bottom: 4px;">Customer Details</div>
      <div style="font-size: 12px; font-weight: 700; color: #171717;">
        ${escapeHtml(data.customerGender ? data.customerGender + ' ' : '')}${escapeHtml(data.customerName)}
      </div>
      ${data.customerAddress ? `<div style="font-size:9.5px;color:#525252;margin-top:2px;">${escapeHtml(data.customerAddress)}</div>` : ''}
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 9px; color: #525252;">
      ${data.customerPassport ? `<div>Passport: <strong style="font-family:monospace;color:#171717;">${escapeHtml(data.customerPassport)}</strong></div>` : ''}
      ${data.customerNationality ? `<div>Nationality: <strong style="color:#171717;">${escapeHtml(data.customerNationality)}</strong></div>` : ''}
      ${data.customerPan ? `<div>PAN: <strong style="font-family:monospace;color:#171717;">${escapeHtml(data.customerPan)}</strong></div>` : ''}
      ${data.customerPurpose ? `<div>Purpose: <strong style="color:#171717;">${escapeHtml(data.customerPurpose)}</strong></div>` : ''}
      ${data.placeOfSupply ? `<div>Place of Supply: <strong style="color:#171717;">${escapeHtml(data.placeOfSupply)}</strong></div>` : ''}
      ${data.customerDestinationCountry ? `<div>Destination: <strong style="color:#171717;">${escapeHtml(data.customerDestinationCountry)}</strong></div>` : ''}
    </div>
  </div>

  <!-- Narrative -->
  ${data.transactionNarrative ? `
  <div style="padding: 6px 0; font-size: 9.5px; color: #525252; border-top: 1px solid #f5f5f5; border-bottom: 1px solid #f5f5f5; margin-bottom: 20px;">
    ${escapeHtml(data.transactionNarrative)}
  </div>` : ''}

  <!-- Items Table -->
  <table class="min-table" style="margin-bottom: 20px;">
    <thead>
      <tr>
        <th style="width:30px;">#</th>
        <th>Item Description</th>
        <th style="width:70px;text-align:center;">SAC</th>
        <th style="width:90px;text-align:right;">Amount (FC)</th>
        <th style="width:110px;text-align:right;">Exchange Rate</th>
        <th style="width:120px;text-align:right;">Equivalent INR</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- Calculation Matrix -->
  <div style="display: grid; grid-template-columns: 1fr 240px; gap: 32px; margin-bottom: 24px;">
    <div>
      <div style="font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #737373; margin-bottom: 4px;">Amount in Words</div>
      <div style="font-size: 10.5px; font-weight: 600; color: #171717; text-transform: capitalize;">
        ${escapeHtml(data.amountInWords ?? 'Rupees ' + fmt(data.total) + ' Only')}
      </div>
      <div style="font-size: 8px; color: #737373; line-height: 1.4; margin-top: 12px;">
        ${data.disclaimer1 ? `<p>• ${escapeHtml(data.disclaimer1)}</p>` : ''}
        ${data.disclaimer2 ? `<p>• ${escapeHtml(data.disclaimer2)}</p>` : ''}
      </div>
    </div>

    <div>
      <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
        <tr>
          <td style="color:#737373;padding:3px 0;">Taxable Base:</td>
          <td style="text-align:right;font-family:monospace;font-weight:600;">₹ ${fmt(gstTaxable)}</td>
        </tr>
        ${gstRows}
        ${tcsRow}
        ${roundOff !== 0 ? `<tr><td style="color:#737373;padding:3px 0;">Round Off:</td><td style="text-align:right;font-family:monospace;">₹ ${fmt(roundOff)}</td></tr>` : ''}
        <tr style="border-top: 1.5px solid #171717;">
          <td style="padding: 8px 0 0; font-size: 11px; font-weight: 800;">TOTAL (INR):</td>
          <td style="padding: 8px 0 0; text-align: right; font-size: 14px; font-weight: 800; font-family: monospace;">
            ₹ ${fmt(data.total)}
          </td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Signatures & Verification -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #171717; padding-top: 16px; margin-top: 24px;">
    <div>
      <div style="border-top: 1px solid #737373; width: 140px; padding-top: 4px; font-size: 9px; color: #737373;">
        Customer Signature
      </div>
    </div>
    <div style="text-align: right;">
      ${sigHtml}
      <div style="border-top: 1px solid #171717; width: 180px; padding-top: 4px; font-size: 9px; font-weight: 700;">
        For ${escapeHtml(bp?.companyName ?? 'Authorized Signatory')}
      </div>
    </div>
  </div>

</body>
</html>`;
}
