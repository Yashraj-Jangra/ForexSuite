const RBI_PURPOSE_CODES = [
  { code: 'S0001', category: 'travel', description: 'Private visit abroad (business/pleasure)' },
  { code: 'S0002', category: 'travel', description: 'Travel for education (including fees, hostel, etc.)' },
  { code: 'S0003', category: 'travel', description: 'Travel for medical treatment' },
  { code: 'S0004', category: 'travel', description: 'Travel for pilgrimage' },
  { code: 'S0101', category: 'education', description: 'Education expenses abroad' },
  { code: 'S0102', category: 'medical', description: 'Medical treatment abroad' },
  { code: 'S0201', category: 'investment', description: 'Investment in equity/debt securities abroad' },
  { code: 'S0202', category: 'investment', description: 'Investment in real estate abroad' },
  { code: 'S0203', category: 'investment', description: 'Setting up Wholly Owned Subsidiary abroad' },
  { code: 'S0301', category: 'gift', description: 'Gift to non-resident relative' },
  { code: 'S0302', category: 'gift', description: 'Donation to charitable institution abroad' },
  { code: 'S0401', category: 'loan', description: 'Repayment of foreign loan' },
  { code: 'S0402', category: 'loan', description: 'Loan to non-resident relative' },
  { code: 'S0501', category: 'business', description: 'Business travel' },
  { code: 'S0502', category: 'business', description: 'Professional services' },
  { code: 'S0601', category: 'maintenance', description: 'Maintenance of close relatives abroad' },
  { code: 'S0602', category: 'maintenance', description: 'Emigration expenses' },
  { code: 'S0701', category: 'other', description: 'Credit card payments while abroad' },
  { code: 'S0702', category: 'other', description: 'Other remittances not classified elsewhere' },
  { code: 'S0801', category: 'education_loan', description: 'Remittance under education loan scheme' },
];

export function seedPurposeCodes() {
  return RBI_PURPOSE_CODES;
}

export function getPurposeCode(code: string) {
  return RBI_PURPOSE_CODES.find((p) => p.code === code) ?? null;
}

export function searchPurposeCodes(q: string) {
  const query = q.toLowerCase();
  return RBI_PURPOSE_CODES.filter(
    (p) => p.code.toLowerCase().includes(query) || p.description.toLowerCase().includes(query),
  );
}