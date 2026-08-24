import { CashMemoData, fmt, fmtRate, escapeHtml } from './types';

export function renderCorporateInvoice(data: CashMemoData): string {
  const bp = data.businessProfile;
  const isCashMemo = !data.invoiceType || data.invoiceType === 'cash_memo' || data.invoiceType === 'tax_invoice';
  const accent = data.accentColor || '#6366f1';

  const docTitle = isCashMemo ? 'CASH MEMO' : 'TAX INVOICE';
  const docSubtitle = isCashMemo ? 'TAX INVOICE UNDER SECTION 31 OF CGST ACT, 2017' : 'ORIGINAL FOR RECIPIENT';
  const stateDisplay = bp?.stateCode ? `State: (${bp.stateCode}) ${bp?.state ?? ''}` : (bp?.state ?? '');

  const itemRows = data.items.map((item, idx) => {
    const amtForeign = Number(item.amountForeign ?? item.quantity ?? 0);
    const rate = Number(item.itemExchangeRate ?? item.unitPrice ?? 0);
    const amtInr = Number(item.amountInr ?? item.amount ?? 0);
    const currencyLabel = item.currencyName ?? item.description ?? '';
    const sac = item.sacCode ?? '997157';
    return `<tr>
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#94a3b8;">${idx + 1}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#1e1b4b;">
        ${escapeHtml(currencyLabel)}
      </td>
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #f1f5f9;">
        <span style="background:${accent}10;color:${accent};padding:2px 6px;border-radius:4px;font-family:monospace;font-size:9.5px;font-weight:700;">${escapeHtml(sac)}</span>
      </td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #f1f5f9;font-family:monospace;color:#334155;">${fmt(amtForeign)}</td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #f1f5f9;font-family:monospace;color:#64748b;">${fmtRate(rate)}</td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #f1f5f9;font-weight:800;color:#1e1b4b;font-family:monospace;">₹ ${fmt(amtInr)}</td>
    </tr>`;
  }).join('');

  const cgst = Number(data.cgstAmount ?? 0);
  const sgst = Number(data.sgstAmount ?? 0);
  const igst = Number(data.igstAmount ?? 0);
  const roundOff = Number(data.roundOff ?? 0);
  const gstTaxable = Number(data.gstTaxableAmount ?? 0);
  const tcsAmt = Number(data.tcsAmount ?? 0);

  const gstRows = data.useIgst
    ? `<tr><td style="text-align:right;padding:3px 8px;color:#64748b;font-size:10px;">IGST @ ${data.igstRate ?? 18}%:</td><td style="text-align:right;padding:3px 8px;font-weight:700;color:#1e1b4b;font-family:monospace;">₹ ${fmt(igst)}</td></tr>`
    : `<tr><td style="text-align:right;padding:3px 8px;color:#64748b;font-size:10px;">CGST @ ${data.cgstRate ?? 9}%:</td><td style="text-align:right;padding:3px 8px;font-weight:700;color:#1e1b4b;font-family:monospace;">₹ ${fmt(cgst)}</td></tr>
       <tr><td style="text-align:right;padding:3px 8px;color:#64748b;font-size:10px;">SGST @ ${data.sgstRate ?? 9}%:</td><td style="text-align:right;padding:3px 8px;font-weight:700;color:#1e1b4b;font-family:monospace;">₹ ${fmt(sgst)}</td></tr>`;

  const tcsRow = data.tcsApplicable && tcsAmt > 0
    ? `<tr><td style="text-align:right;padding:3px 8px;color:#64748b;font-size:10px;">TCS @ ${data.tcsRate ?? 5}%:</td><td style="text-align:right;padding:3px 8px;font-weight:700;color:#1e1b4b;font-family:monospace;">₹ ${fmt(tcsAmt)}</td></tr>`
    : '';

  const logoHtml = bp?.logoBase64
    ? `<img src="${bp.logoBase64}" style="max-height:56px;max-width:180px;object-fit:contain;" alt="logo" />`
    : `<div style="font-size:20px;font-weight:900;letter-spacing:-0.5px;color:${accent};">${escapeHtml(bp?.companyName ?? 'NEO FFMC SUITE')}</div>`;

  const sigHtml = bp?.signatureBase64
    ? `<img src="${bp.signatureBase64}" style="max-height:46px;object-fit:contain;" alt="signature" />`
    : `<div style="height:38px;"></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${docTitle} – ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 11px; color: #1e1b4b; background: #fff; padding: 26px; line-height: 1.45; }
    .panel { background: #ffffff; border: 1px solid #e0e7ff; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; }
    .badge-bar { background: linear-gradient(135deg, ${accent}10 0%, #f8fafc 100%); border: 1px solid #e0e7ff; border-radius: 8px; padding: 8px 14px; display: flex; justify-content: space-between; font-size: 9.5px; color: #4338ca; margin-bottom: 14px; }
    table.corp-tbl { width: 100%; border-collapse: collapse; text-align: left; }
    table.corp-tbl th { background: #f5f3ff; color: #4338ca; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; padding: 10px 8px; border-bottom: 1px solid #e0e7ff; }
  </style>
</head>
<body>

  <!-- Top Gradient Accent Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px;">
    <div>
      ${logoHtml}
      <div style="font-size: 11px; font-weight: 700; color: #312e81; margin-top: 4px;">${escapeHtml(bp?.companyName ?? '')}</div>
      <div style="font-size: 10px; color: #64748b; max-width: 320px; margin-top: 2px;">
        ${escapeHtml(bp?.address1 ?? '')}${bp?.address2 ? ', ' + escapeHtml(bp.address2) : ''}<br>
        ${[bp?.city, bp?.pincode].filter(Boolean).map(escapeHtml).join(' - ')} · ${escapeHtml(stateDisplay)}<br>
        ${bp?.phone ? 'Ph: ' + escapeHtml(bp.phone) : ''}
      </div>
    </div>

    <div style="text-align: right;">
      <span style="background:${accent};color:#ffffff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:900;letter-spacing:1px;display:inline-block;">
        ${docTitle}
      </span>
      <div style="font-size: 8.5px; font-weight: 700; color: #6366f1; text-transform: uppercase; margin-top: 4px;">${docSubtitle}</div>
      <div style="margin-top: 6px; font-family: monospace; font-size: 12px; font-weight: 800; color: #1e1b4b;">
        # ${escapeHtml(data.invoiceNumber)}
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 1px;">
        Date: <strong style="color:#1e1b4b;">${escapeHtml(data.invoiceDate)}</strong>
      </div>
    </div>
  </div>

  <!-- Regulatory Ribbon -->
  <div class="badge-bar">
    ${bp?.rbiLicenceNo ? `<div>RBI LICENCE: <strong style="font-family:monospace;color:#1e1b4b;">${escapeHtml(bp.rbiLicenceNo)}</strong></div>` : ''}
    ${bp?.cin ? `<div>CIN: <strong style="font-family:monospace;color:#1e1b4b;">${escapeHtml(bp.cin)}</strong></div>` : ''}
    ${bp?.pan ? `<div>PAN: <strong style="font-family:monospace;color:#1e1b4b;">${escapeHtml(bp.pan)}</strong></div>` : ''}
    ${bp?.gstin ? `<div>GSTIN: <strong style="font-family:monospace;color:#1e1b4b;">${escapeHtml(bp.gstin)}</strong></div>` : ''}
  </div>

  <!-- Customer KYC & QR Card -->
  <div class="panel" style="display: grid; grid-template-columns: 1fr 110px; gap: 16px;">
    <div>
      <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #6366f1; margin-bottom: 2px;">
        Customer Identification &amp; KYC
      </div>
      <div style="font-size: 13px; font-weight: 800; color: #1e1b4b; margin-bottom: 3px;">
        ${escapeHtml(data.customerGender ? data.customerGender + ' ' : '')}${escapeHtml(data.customerName)}
      </div>
      ${data.customerAddress ? `<div style="font-size:10px;color:#475569;margin-bottom:6px;">${escapeHtml(data.customerAddress)}</div>` : ''}

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 8px; font-size: 9.5px;">
        ${data.customerPassport ? `<div><span style="color:#64748b;">Passport:</span> <strong style="font-family:monospace;color:#1e1b4b;">${escapeHtml(data.customerPassport)}</strong></div>` : ''}
        ${data.customerNationality ? `<div><span style="color:#64748b;">Nationality:</span> <strong>${escapeHtml(data.customerNationality)}</strong></div>` : ''}
        ${data.customerPan ? `<div><span style="color:#64748b;">PAN:</span> <strong style="font-family:monospace;color:#1e1b4b;">${escapeHtml(data.customerPan)}</strong></div>` : ''}
        ${data.customerPurpose ? `<div><span style="color:#64748b;">Purpose:</span> <strong>${escapeHtml(data.customerPurpose)}</strong></div>` : ''}
        ${data.customerDestinationCountry ? `<div><span style="color:#64748b;">Destination:</span> <strong>${escapeHtml(data.customerDestinationCountry)}</strong></div>` : ''}
        ${data.placeOfSupply ? `<div><span style="color:#64748b;">Supply:</span> <strong>${escapeHtml(data.placeOfSupply)}</strong></div>` : ''}
      </div>
    </div>

    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid #e0e7ff; padding-left: 12px;">
      <div style="width: 80px; height: 80px; border: 1px dashed ${accent}60; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: ${accent}; font-family: monospace; text-align: center;">
        QR CODE
      </div>
    </div>
  </div>

  <!-- Narrative -->
  ${data.transactionNarrative ? `
  <div style="background: #faf5ff; border-left: 3px solid ${accent}; padding: 8px 12px; border-radius: 0 8px 8px 0; font-size: 10px; color: #3730a3; margin-bottom: 14px;">
    ${escapeHtml(data.transactionNarrative)}
  </div>` : ''}

  <!-- Items Table -->
  <div style="border: 1px solid #e0e7ff; border-radius: 10px; overflow: hidden; margin-bottom: 14px;">
    <table class="corp-tbl">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">#</th>
          <th>Currency / Service</th>
          <th style="width:70px;text-align:center;">SAC / HSN</th>
          <th style="width:95px;text-align:right;">Amount (FC)</th>
          <th style="width:115px;text-align:right;">Exchange Rate</th>
          <th style="width:125px;text-align:right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
  </div>

  <!-- Calculations & Summary -->
  <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; margin-bottom: 16px;">
    <div>
      <div class="panel" style="margin-bottom: 8px; padding: 10px 12px;">
        <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #6366f1; margin-bottom: 2px;">Amount in Words</div>
        <div style="font-size: 10.5px; font-weight: 800; color: #1e1b4b; text-transform: capitalize;">
          ${escapeHtml(data.amountInWords ?? 'Rupees ' + fmt(data.total) + ' Only')}
        </div>
      </div>
      <div style="font-size: 8.5px; color: #64748b; line-height: 1.35; padding: 0 4px;">
        ${data.disclaimer1 ? `<p style="margin-bottom:2px;">• ${escapeHtml(data.disclaimer1)}</p>` : ''}
        ${data.disclaimer2 ? `<p>• ${escapeHtml(data.disclaimer2)}</p>` : ''}
      </div>
    </div>

    <div class="panel" style="padding: 10px 14px; background: #faf5ff; border-color: #e0e7ff;">
      <table style="width: 100%; font-size: 10.5px; border-collapse: collapse;">
        <tr>
          <td style="color:#64748b;padding:3px 0;">GST Taxable Value:</td>
          <td style="text-align:right;font-weight:700;font-family:monospace;color:#1e1b4b;">₹ ${fmt(gstTaxable)}</td>
        </tr>
        ${gstRows}
        ${tcsRow}
        ${roundOff !== 0 ? `<tr><td style="color:#64748b;padding:3px 0;">Round Off:</td><td style="text-align:right;font-family:monospace;color:#1e1b4b;">₹ ${fmt(roundOff)}</td></tr>` : ''}
        <tr style="border-top: 1.5px solid #c7d2fe;">
          <td style="padding: 8px 0 2px; font-size: 12px; font-weight: 800; color: #1e1b4b;">Total Amount:</td>
          <td style="padding: 8px 0 2px; text-align: right; font-size: 15px; font-weight: 900; color: ${accent}; font-family: monospace;">
            ₹ ${fmt(data.total)}
          </td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Signatures -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; padding-top: 12px; border-top: 1px solid #e0e7ff;">
    <div>
      <div style="height: 38px;"></div>
      <div style="border-top: 1px dashed #a5b4fc; width: 150px; padding-top: 4px; font-size: 9px; font-weight: 700; color: #64748b;">
        Customer's Signature
      </div>
    </div>
    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
      ${sigHtml}
      <div style="border-top: 1px dashed #a5b4fc; width: 190px; padding-top: 4px; font-size: 9px; font-weight: 700; color: #1e1b4b;">
        For ${escapeHtml(bp?.companyName ?? 'Authorized Signatory')}
      </div>
      <div style="font-size: 8px; color: #94a3b8; margin-top: 1px;">Authorized Signatory</div>
    </div>
  </div>

</body>
</html>`;
}
