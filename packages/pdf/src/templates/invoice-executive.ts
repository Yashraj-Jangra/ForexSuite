import { CashMemoData, fmt, fmtRate, escapeHtml } from './types';

export function renderExecutiveInvoice(data: CashMemoData): string {
  const bp = data.businessProfile;
  const isCashMemo = !data.invoiceType || data.invoiceType === 'cash_memo' || data.invoiceType === 'tax_invoice';
  const accent = data.accentColor || '#0ea5e9';

  const docTitle = isCashMemo ? 'CASH MEMO / TAX INVOICE' : 'TAX INVOICE';
  const docSubtitle = isCashMemo ? 'AUTHORISED FULL FLEDGED MONEY CHANGER (FFMC)' : 'ORIGINAL FOR RECIPIENT';
  const stateDisplay = bp?.stateCode ? `State: (${bp.stateCode}) ${bp?.state ?? ''}` : (bp?.state ?? '');

  const itemRows = data.items.map((item, idx) => {
    const amtForeign = Number(item.amountForeign ?? item.quantity ?? 0);
    const rate = Number(item.itemExchangeRate ?? item.unitPrice ?? 0);
    const amtInr = Number(item.amountInr ?? item.amount ?? 0);
    const currencyLabel = item.currencyName ?? item.description ?? '';
    const sac = item.sacCode ?? '997157';
    const rowBg = idx % 2 === 1 ? '#f8fafc' : '#ffffff';
    return `<tr style="background:${rowBg};">
      <td style="text-align:center;padding:9px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-weight:700;color:#64748b;">${String(idx + 1).padStart(2, '0')}</td>
      <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${escapeHtml(currencyLabel)}</td>
      <td style="text-align:center;padding:9px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;color:#475569;font-size:10px;">${escapeHtml(sac)}</td>
      <td style="text-align:right;padding:9px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;color:#334155;font-weight:600;">${fmt(amtForeign)}</td>
      <td style="text-align:right;padding:9px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;color:#64748b;">${fmtRate(rate)}</td>
      <td style="text-align:right;padding:9px 8px;border-bottom:1px solid #e2e8f0;font-weight:800;color:#0f172a;font-family:monospace;">₹ ${fmt(amtInr)}</td>
    </tr>`;
  }).join('');

  const cgst = Number(data.cgstAmount ?? 0);
  const sgst = Number(data.sgstAmount ?? 0);
  const igst = Number(data.igstAmount ?? 0);
  const roundOff = Number(data.roundOff ?? 0);
  const gstTaxable = Number(data.gstTaxableAmount ?? 0);
  const tcsAmt = Number(data.tcsAmount ?? 0);

  const gstRows = data.useIgst
    ? `<tr><td style="text-align:right;padding:3px 8px;color:#cbd5e1;font-size:10px;">IGST @ ${data.igstRate ?? 18}%:</td><td style="text-align:right;padding:3px 8px;font-weight:700;color:#ffffff;font-family:monospace;">₹ ${fmt(igst)}</td></tr>`
    : `<tr><td style="text-align:right;padding:3px 8px;color:#cbd5e1;font-size:10px;">CGST @ ${data.cgstRate ?? 9}%:</td><td style="text-align:right;padding:3px 8px;font-weight:700;color:#ffffff;font-family:monospace;">₹ ${fmt(cgst)}</td></tr>
       <tr><td style="text-align:right;padding:3px 8px;color:#cbd5e1;font-size:10px;">SGST @ ${data.sgstRate ?? 9}%:</td><td style="text-align:right;padding:3px 8px;font-weight:700;color:#ffffff;font-family:monospace;">₹ ${fmt(sgst)}</td></tr>`;

  const tcsRow = data.tcsApplicable && tcsAmt > 0
    ? `<tr><td style="text-align:right;padding:3px 8px;color:#cbd5e1;font-size:10px;">TCS @ ${data.tcsRate ?? 5}%:</td><td style="text-align:right;padding:3px 8px;font-weight:700;color:#ffffff;font-family:monospace;">₹ ${fmt(tcsAmt)}</td></tr>`
    : '';

  const logoHtml = bp?.logoBase64
    ? `<img src="${bp.logoBase64}" style="max-height:56px;max-width:180px;object-fit:contain;" alt="logo" />`
    : `<div style="font-size:22px;font-weight:900;letter-spacing:1px;color:#ffffff;">${escapeHtml(bp?.companyName ?? 'VAULTBILL EXECUTIVE')}</div>`;

  const sigHtml = bp?.signatureBase64
    ? `<img src="${bp.signatureBase64}" style="max-height:48px;object-fit:contain;" alt="signature" />`
    : `<div style="height:40px;"></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${docTitle} – ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 11px; color: #0f172a; background: #fff; line-height: 1.45; }
    .exec-header { background: #0f172a; color: #ffffff; padding: 24px 32px; border-bottom: 3px solid ${accent}; }
    .content { padding: 24px 32px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; background: #ffffff; }
    .title-pill { font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 4px; }
    table.exec-table { width: 100%; border-collapse: collapse; text-align: left; }
    table.exec-table th { background: #1e293b; color: #ffffff; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; padding: 10px 8px; }
  </style>
</head>
<body>

  <!-- Slate Executive Banner -->
  <div class="exec-header">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        ${logoHtml}
        <div style="font-size: 10px; color: #94a3b8; margin-top: 4px; max-width: 320px;">
          ${escapeHtml(bp?.address1 ?? '')}${bp?.address2 ? ', ' + escapeHtml(bp.address2) : ''}<br>
          ${[bp?.city, bp?.pincode].filter(Boolean).map(escapeHtml).join(' - ')} · ${escapeHtml(stateDisplay)}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 18px; font-weight: 900; letter-spacing: 1px; color: ${accent};">${docTitle}</div>
        <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 2px;">${docSubtitle}</div>
        <div style="margin-top: 8px; font-family: monospace; font-size: 13px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
          NO: ${escapeHtml(data.invoiceNumber)}
        </div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">
          Date: <strong style="color:#ffffff;">${escapeHtml(data.invoiceDate)}</strong>
        </div>
      </div>
    </div>

    <!-- Regulatory Ribbon inside header -->
    <div style="margin-top: 16px; pt-3; border-top: 1px solid #334155; display: flex; justify-content: space-between; font-size: 9.5px; color: #cbd5e1;">
      ${bp?.rbiLicenceNo ? `<div>RBI LICENCE: <strong style="color:#ffffff;font-family:monospace;">${escapeHtml(bp.rbiLicenceNo)}</strong></div>` : ''}
      ${bp?.cin ? `<div>CIN: <strong style="color:#ffffff;font-family:monospace;">${escapeHtml(bp.cin)}</strong></div>` : ''}
      ${bp?.pan ? `<div>PAN: <strong style="color:#ffffff;font-family:monospace;">${escapeHtml(bp.pan)}</strong></div>` : ''}
      ${bp?.gstin ? `<div>GSTIN: <strong style="color:#ffffff;font-family:monospace;">${escapeHtml(bp.gstin)}</strong></div>` : ''}
    </div>
  </div>

  <div class="content">
    <!-- KYC & Dispatch Matrix -->
    <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; margin-bottom: 18px;">
      <div class="box">
        <div class="title-pill">Client KYC Identification</div>
        <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 4px;">
          ${escapeHtml(data.customerGender ? data.customerGender + ' ' : '')}${escapeHtml(data.customerName)}
        </div>
        ${data.customerAddress ? `<div style="font-size:10px;color:#475569;margin-bottom:6px;">${escapeHtml(data.customerAddress)}</div>` : ''}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px; font-size: 9.5px;">
          ${data.customerPassport ? `<div>Passport: <strong style="font-family:monospace;color:#0f172a;">${escapeHtml(data.customerPassport)}</strong></div>` : ''}
          ${data.customerNationality ? `<div>Nationality: <strong style="color:#0f172a;">${escapeHtml(data.customerNationality)}</strong></div>` : ''}
          ${data.customerPan ? `<div>PAN: <strong style="font-family:monospace;color:#0f172a;">${escapeHtml(data.customerPan)}</strong></div>` : ''}
          ${data.placeOfSupply ? `<div>Place of Supply: <strong style="color:#0f172a;">${escapeHtml(data.placeOfSupply)}</strong></div>` : ''}
          ${data.customerPurpose ? `<div>Purpose: <strong style="color:#0f172a;">${escapeHtml(data.customerPurpose)}</strong></div>` : ''}
          ${data.customerDestinationCountry ? `<div>Destination: <strong style="color:#0f172a;">${escapeHtml(data.customerDestinationCountry)}</strong></div>` : ''}
        </div>
      </div>

      <div class="box" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div class="title-pill">Transaction Verification</div>
          <div style="font-size: 10px; color: #475569; margin-top: 4px;">
            ${data.saleDate ? `<div>Date of Sale: <strong style="color:#0f172a;">${escapeHtml(data.saleDate)}</strong></div>` : ''}
            ${data.paymentMode ? `<div>Payment Mode: <strong style="color:#0f172a;text-transform:uppercase;">${escapeHtml(data.paymentMode)}</strong></div>` : ''}
            ${data.paymentReference ? `<div>Ref: <span style="font-family:monospace;color:#0f172a;">${escapeHtml(data.paymentReference)}</span></div>` : ''}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; border-top: 1px solid #f1f5f9; padding-top: 8px;">
          <div style="width: 48px; height: 48px; border: 1px dashed #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 7px; color: #94a3b8; font-family: monospace;">QR</div>
          <div style="font-size: 8.5px; color: #64748b;">Digitally signed &amp; certified under FEMA (1999) regulations.</div>
        </div>
      </div>
    </div>

    <!-- Narrative -->
    ${data.transactionNarrative ? `
    <div style="background: #f1f5f9; border-left: 3px solid #0f172a; padding: 9px 14px; border-radius: 4px; font-size: 10px; color: #334155; margin-bottom: 18px;">
      ${escapeHtml(data.transactionNarrative)}
    </div>` : ''}

    <!-- Table -->
    <div style="border: 1px solid #1e293b; border-radius: 6px; overflow: hidden; margin-bottom: 18px;">
      <table class="exec-table">
        <thead>
          <tr>
            <th style="width:40px;text-align:center;">#</th>
            <th>Description / Currency</th>
            <th style="width:80px;text-align:center;">SAC / HSN</th>
            <th style="width:110px;text-align:right;">Amount Foreign</th>
            <th style="width:120px;text-align:right;">Exchange Rate</th>
            <th style="width:130px;text-align:right;">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <!-- Totals & Calculations Block -->
    <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div>
        <div class="box" style="margin-bottom: 8px;">
          <div class="title-pill">Rupees in Words</div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: capitalize;">
            ${escapeHtml(data.amountInWords ?? 'Rupees ' + fmt(data.total) + ' Only')}
          </div>
        </div>
        <div style="font-size: 8.5px; color: #64748b; line-height: 1.4; padding: 0 4px;">
          ${data.disclaimer1 ? `<p style="margin-bottom:2px;">• ${escapeHtml(data.disclaimer1)}</p>` : ''}
          ${data.disclaimer2 ? `<p>• ${escapeHtml(data.disclaimer2)}</p>` : ''}
        </div>
      </div>

      <div style="background: #0f172a; color: #ffffff; border-radius: 8px; padding: 14px 18px;">
        <table style="width: 100%; font-size: 10.5px; border-collapse: collapse;">
          <tr>
            <td style="color:#94a3b8;padding:3px 0;">GST Taxable Base:</td>
            <td style="text-align:right;font-weight:700;font-family:monospace;color:#ffffff;">₹ ${fmt(gstTaxable)}</td>
          </tr>
          ${gstRows}
          ${tcsRow}
          ${roundOff !== 0 ? `<tr><td style="color:#94a3b8;padding:3px 0;">Round Off:</td><td style="text-align:right;font-family:monospace;color:#ffffff;">₹ ${fmt(roundOff)}</td></tr>` : ''}
          <tr style="border-top: 1px solid #334155;">
            <td style="padding: 10px 0 4px; font-size: 12px; font-weight: 800; color: #ffffff;">NET TOTAL PAYABLE:</td>
            <td style="padding: 10px 0 4px; text-align: right; font-size: 16px; font-weight: 900; color: ${accent}; font-family: monospace;">
              ₹ ${fmt(data.total)}
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Signatures -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
      <div>
        <div style="height: 44px;"></div>
        <div style="border-top: 1.5px solid #0f172a; width: 170px; padding-top: 4px; font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
          Customer's Signature
        </div>
      </div>
      <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
        ${sigHtml}
        <div style="border-top: 1.5px solid #0f172a; width: 200px; padding-top: 4px; font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
          For ${escapeHtml(bp?.companyName ?? 'Authorized Signatory')}
        </div>
        <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">Authorized Signatory</div>
      </div>
    </div>

  </div>

</body>
</html>`;
}
