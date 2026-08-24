import { CashMemoData, fmt, fmtRate, escapeHtml } from './types';

export function renderModernInvoice(data: CashMemoData): string {
  const bp = data.businessProfile;
  const isCashMemo = !data.invoiceType || data.invoiceType === 'cash_memo' || data.invoiceType === 'tax_invoice';
  const accent = data.accentColor || '#2563eb';

  const docTitle = isCashMemo ? 'CASH MEMO' : 'TAX INVOICE';
  const docSubtitle = isCashMemo ? 'ORIGINAL FOR RECIPIENT · TAX INVOICE UNDER GST' : 'ORIGINAL FOR RECIPIENT';
  const stateDisplay = bp?.stateCode ? `State: (${bp.stateCode}) ${bp?.state ?? ''}` : (bp?.state ?? '');

  const itemRows = data.items.map((item, idx) => {
    const amtForeign = Number(item.amountForeign ?? item.quantity ?? 0);
    const rate = Number(item.itemExchangeRate ?? item.unitPrice ?? 0);
    const amtInr = Number(item.amountInr ?? item.amount ?? 0);
    const currencyLabel = item.currencyName ?? item.description ?? '';
    const sac = item.sacCode ?? '997157';
    return `<tr>
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #f1f5f9;color:#64748b;font-weight:600;">${idx + 1}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#0f172a;">${escapeHtml(currencyLabel)}</td>
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #f1f5f9;color:#64748b;font-family:monospace;font-size:10px;">${escapeHtml(sac)}</td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #f1f5f9;font-family:monospace;color:#334155;">${fmt(amtForeign)}</td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #f1f5f9;font-family:monospace;color:#64748b;">${fmtRate(rate)}</td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#0f172a;font-family:monospace;">₹ ${fmt(amtInr)}</td>
    </tr>`;
  }).join('');

  const cgst = Number(data.cgstAmount ?? 0);
  const sgst = Number(data.sgstAmount ?? 0);
  const igst = Number(data.igstAmount ?? 0);
  const roundOff = Number(data.roundOff ?? 0);
  const gstTaxable = Number(data.gstTaxableAmount ?? 0);
  const tcsAmt = Number(data.tcsAmount ?? 0);

  const gstRows = data.useIgst
    ? `<tr><td style="text-align:right;padding:4px 8px;color:#64748b;font-size:10px;">IGST @ ${data.igstRate ?? 18}%:</td><td style="text-align:right;padding:4px 8px;font-weight:600;color:#0f172a;font-family:monospace;">₹ ${fmt(igst)}</td></tr>`
    : `<tr><td style="text-align:right;padding:4px 8px;color:#64748b;font-size:10px;">CGST @ ${data.cgstRate ?? 9}%:</td><td style="text-align:right;padding:4px 8px;font-weight:600;color:#0f172a;font-family:monospace;">₹ ${fmt(cgst)}</td></tr>
       <tr><td style="text-align:right;padding:4px 8px;color:#64748b;font-size:10px;">SGST @ ${data.sgstRate ?? 9}%:</td><td style="text-align:right;padding:4px 8px;font-weight:600;color:#0f172a;font-family:monospace;">₹ ${fmt(sgst)}</td></tr>`;

  const tcsRow = data.tcsApplicable && tcsAmt > 0
    ? `<tr><td style="text-align:right;padding:4px 8px;color:#64748b;font-size:10px;">TCS (Sec 206C(1G)) @ ${data.tcsRate ?? 5}%:</td><td style="text-align:right;padding:4px 8px;font-weight:600;color:#0f172a;font-family:monospace;">₹ ${fmt(tcsAmt)}</td></tr>`
    : '';

  const logoHtml = bp?.logoBase64
    ? `<img src="${bp.logoBase64}" style="max-height:54px;max-width:180px;object-fit:contain;" alt="logo" />`
    : `<div style="font-size:20px;font-weight:900;letter-spacing:-0.5px;color:${accent};">${escapeHtml(bp?.companyName ?? 'VAULTBILL FFMC')}</div>`;

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
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; padding: 28px; line-height: 1.45; }
    .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 14px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-primary { background: ${accent}15; color: ${accent}; border: 1px solid ${accent}30; }
    .label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    table.items-tbl { width: 100%; border-collapse: collapse; text-align: left; }
    table.items-tbl th { background: #f8fafc; color: #475569; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
  </style>
</head>
<body>

  <!-- Top Accent Bar -->
  <div style="height: 5px; width: 100%; background: ${accent}; border-radius: 4px; margin-bottom: 20px;"></div>

  <!-- Header: Brand & Document Meta -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
    <div>
      ${logoHtml}
      <div style="font-size: 11px; font-weight: 700; color: #334155; margin-top: 4px;">${escapeHtml(bp?.companyName ?? '')}</div>
      <div style="font-size: 10px; color: #64748b; max-width: 320px; margin-top: 2px;">
        ${escapeHtml(bp?.address1 ?? '')}${bp?.address2 ? ', ' + escapeHtml(bp.address2) : ''}<br>
        ${[bp?.city, bp?.pincode].filter(Boolean).map(escapeHtml).join(' - ')} · ${escapeHtml(stateDisplay)}<br>
        ${bp?.phone ? 'Ph: ' + escapeHtml(bp.phone) : ''} ${bp?.email ? '· ' + escapeHtml(bp.email) : ''}
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">${docTitle}</div>
      <div style="font-size: 9.5px; font-weight: 700; color: ${accent}; text-transform: uppercase; margin-top: 2px;">${docSubtitle}</div>
      <div style="margin-top: 8px; font-family: monospace; font-size: 12px; font-weight: 800; color: #0f172a;">
        ${escapeHtml(data.invoiceNumber)}
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
        Date: <strong style="color:#0f172a;">${escapeHtml(data.invoiceDate)}</strong>
      </div>
    </div>
  </div>

  <!-- Regulatory Pill Bar -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 12px; display: flex; justify-content: space-between; font-size: 9.5px; color: #475569; margin-bottom: 16px;">
    ${bp?.rbiLicenceNo ? `<div>RBI Licence: <strong style="color:#0f172a;font-family:monospace;">${escapeHtml(bp.rbiLicenceNo)}</strong></div>` : ''}
    ${bp?.cin ? `<div>CIN: <strong style="color:#0f172a;font-family:monospace;">${escapeHtml(bp.cin)}</strong></div>` : ''}
    ${bp?.pan ? `<div>PAN: <strong style="color:#0f172a;font-family:monospace;">${escapeHtml(bp.pan)}</strong></div>` : ''}
    ${bp?.gstin ? `<div>GSTIN: <strong style="color:#0f172a;font-family:monospace;">${escapeHtml(bp.gstin)}</strong></div>` : ''}
  </div>

  <!-- Customer KYC & QR Row -->
  <div class="card" style="display: grid; grid-template-columns: 1fr 120px; padding: 14px 16px; gap: 16px; margin-bottom: 14px;">
    <div>
      <div class="label">Billed To (Customer KYC Details)</div>
      <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
        ${escapeHtml(data.customerGender ? data.customerGender + ' ' : '')}${escapeHtml(data.customerName)}
      </div>
      ${data.customerAddress ? `<div style="font-size:10px;color:#475569;margin-bottom:6px;">${escapeHtml(data.customerAddress)}</div>` : ''}
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; font-size: 10px;">
        ${data.customerPassport ? `<div><span style="color:#64748b;">Passport:</span> <strong style="font-family:monospace;color:#0f172a;">${escapeHtml(data.customerPassport)}</strong></div>` : ''}
        ${data.customerNationality ? `<div><span style="color:#64748b;">Nationality:</span> <strong>${escapeHtml(data.customerNationality)}</strong></div>` : ''}
        ${data.customerPan ? `<div><span style="color:#64748b;">PAN:</span> <strong style="font-family:monospace;color:#0f172a;">${escapeHtml(data.customerPan)}</strong></div>` : ''}
        ${data.customerPurpose ? `<div><span style="color:#64748b;">Purpose:</span> <strong>${escapeHtml(data.customerPurpose)}</strong></div>` : ''}
        ${data.customerDestinationCountry ? `<div><span style="color:#64748b;">Destination:</span> <strong>${escapeHtml(data.customerDestinationCountry)}</strong></div>` : ''}
        ${data.placeOfSupply ? `<div><span style="color:#64748b;">Place of Supply:</span> <strong>${escapeHtml(data.placeOfSupply)}</strong></div>` : ''}
      </div>
    </div>

    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid #f1f5f9; padding-left: 12px;">
      <div style="width: 84px; height: 84px; border: 1px dashed #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; text-align: center; font-family: monospace;">
        DIGITAL VERIFY<br>QR CODE
      </div>
    </div>
  </div>

  <!-- Narrative Callout -->
  ${data.transactionNarrative ? `
  <div style="background: #f8fafc; border-left: 3px solid ${accent}; padding: 8px 12px; border-radius: 0 8px 8px 0; font-size: 10px; color: #334155; margin-bottom: 14px;">
    ${escapeHtml(data.transactionNarrative)}
  </div>` : ''}

  <!-- Items Table -->
  <div class="card" style="margin-bottom: 14px;">
    <table class="items-tbl">
      <thead>
        <tr>
          <th style="width:40px;text-align:center;">#</th>
          <th>Currency / Item</th>
          <th style="width:70px;text-align:center;">SAC / HSN</th>
          <th style="width:100px;text-align:right;">Foreign Amount</th>
          <th style="width:120px;text-align:right;">Exchange Rate</th>
          <th style="width:120px;text-align:right;">Equivalent INR</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
  </div>

  <!-- Totals & GST Summary Row -->
  <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; margin-bottom: 14px;">
    <!-- Left: Amount in words & Disclaimers -->
    <div style="display: flex; flex-direction: column; justify-content: space-between;">
      <div class="card" style="padding: 10px 12px; margin-bottom: 8px;">
        <div class="label">Amount in Words (INR)</div>
        <div style="font-size: 10.5px; font-weight: 700; color: #0f172a; text-transform: capitalize;">
          ${escapeHtml(data.amountInWords ?? 'Rupees ' + fmt(data.total) + ' Only')}
        </div>
      </div>
      
      <div style="font-size: 8.5px; color: #64748b; line-height: 1.4; padding: 0 4px;">
        ${data.disclaimer1 ? `<p style="margin-bottom:2px;">• ${escapeHtml(data.disclaimer1)}</p>` : ''}
        ${data.disclaimer2 ? `<p>• ${escapeHtml(data.disclaimer2)}</p>` : ''}
      </div>
    </div>

    <!-- Right: Calculation Matrix -->
    <div class="card" style="padding: 10px 14px;">
      <table style="width: 100%; font-size: 10.5px; border-collapse: collapse;">
        <tr>
          <td style="color:#64748b;padding:3px 0;">GST Taxable Base:</td>
          <td style="text-align:right;font-weight:600;font-family:monospace;color:#0f172a;">₹ ${fmt(gstTaxable)}</td>
        </tr>
        ${gstRows}
        ${tcsRow}
        ${roundOff !== 0 ? `<tr><td style="color:#64748b;padding:3px 0;">Round Off:</td><td style="text-align:right;font-family:monospace;color:#0f172a;">₹ ${fmt(roundOff)}</td></tr>` : ''}
        <tr style="border-top: 1.5px solid #e2e8f0;">
          <td style="padding: 8px 0 4px; font-size: 12px; font-weight: 800; color: #0f172a;">Grand Total:</td>
          <td style="padding: 8px 0 4px; text-align: right; font-size: 15px; font-weight: 900; color: ${accent}; font-family: monospace;">
            ₹ ${fmt(data.total)}
          </td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Signature Block -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
    <div>
      <div style="height: 40px;"></div>
      <div style="border-top: 1px dashed #cbd5e1; width: 160px; padding-top: 4px; font-size: 9.5px; font-weight: 700; color: #64748b;">
        Customer's Signature
      </div>
    </div>
    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
      ${sigHtml}
      <div style="border-top: 1px dashed #cbd5e1; width: 190px; padding-top: 4px; font-size: 9.5px; font-weight: 700; color: #0f172a;">
        For ${escapeHtml(bp?.companyName ?? 'Authorized Signatory')}
      </div>
      <div style="font-size: 8.5px; color: #94a3b8; margin-top: 1px;">Authorized Signatory</div>
    </div>
  </div>

</body>
</html>`;
}
