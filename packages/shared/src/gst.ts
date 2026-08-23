const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
  '24': 'Gujarat', '25': 'Daman and Diu', '26': 'Dadra and Nagar Haveli', '27': 'Maharashtra',
  '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar',
  '36': 'Telangana', '37': 'Andhra Pradesh (New)',
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28] as const;

export function validateGstin(gstin: string): { valid: boolean; stateCode?: string; stateName?: string; error?: string } {
  if (!gstin) return { valid: false, error: 'GSTIN is required' };
  const code = gstin.slice(0, 2);
  const stateName = GST_STATE_CODES[code];
  if (!stateName) return { valid: false, error: 'Invalid state code in GSTIN' };
  if (!GSTIN_REGEX.test(gstin)) return { valid: false, error: 'Invalid GSTIN format' };
  return { valid: true, stateCode: code, stateName };
}

export function getGstStateCode(gstin: string): string | null {
  return GST_STATE_CODES[gstin.slice(0, 2)] ? gstin.slice(0, 2) : null;
}

export function calculateGst(
  amount: number,
  rate: number,
  fromStateCode: string,
  toStateCode: string,
  isExport: boolean,
) {
  if (isExport) return { cgst: 0, sgst: 0, igst: 0, totalGst: 0, rate: 0 };

  const taxAmount = Math.round((amount * rate) / 100 * 100) / 100;

  if (fromStateCode === toStateCode) {
    return {
      cgst: Math.round((taxAmount / 2) * 100) / 100,
      sgst: Math.round((taxAmount / 2) * 100) / 100,
      igst: 0,
      totalGst: taxAmount,
      rate,
    };
  }

  return {
    cgst: 0,
    sgst: 0,
    igst: taxAmount,
    totalGst: taxAmount,
    rate,
  };
}

const HSN_CODES: { code: string; description: string; rate: number }[] = [
  { code: '8471', description: 'Computers and laptops', rate: 18 },
  { code: '8473', description: 'Computer accessories', rate: 18 },
  { code: '6109', description: 'T-shirts and singlets', rate: 12 },
  { code: '6204', description: 'Suits and co-ordinate sets', rate: 12 },
  { code: '6403', description: 'Leather footwear', rate: 18 },
  { code: '9403', description: 'Furniture', rate: 18 },
  { code: '3401', description: 'Soap and washing preparations', rate: 18 },
  { code: '1905', description: 'Bakery products', rate: 18 },
  { code: '0402', description: 'Milk and cream', rate: 5 },
  { code: '1001', description: 'Wheat and meslin', rate: 0 },
  { code: '2106', description: 'Food preparations', rate: 18 },
  { code: '3004', description: 'Medicines', rate: 12 },
  { code: '3924', description: 'Tableware and kitchenware', rate: 18 },
  { code: '4202', description: 'Luggage and bags', rate: 18 },
  { code: '4802', description: 'Paper and paperboard', rate: 12 },
  { code: '4901', description: 'Printed books', rate: 0 },
  { code: '5007', description: 'Woven silk fabrics', rate: 5 },
  { code: '5208', description: 'Cotton fabrics', rate: 5 },
  { code: '6206', description: 'Shirts for women', rate: 12 },
  { code: '6901', description: 'Bricks and tiles', rate: 5 },
];

export function searchHsn(query: string): { code: string; description: string; rate: number }[] {
  const q = query.toLowerCase();
  return HSN_CODES.filter(
    (h) => h.code.includes(q) || h.description.toLowerCase().includes(q),
  ).slice(0, 10);
}

export function getHsnRate(code: string): number {
  return HSN_CODES.find((h) => h.code === code)?.rate ?? 18;
}

export { GST_STATE_CODES, GST_RATES, GSTIN_REGEX, HSN_CODES };