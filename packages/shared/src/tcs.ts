const TCS_THRESHOLD_INR = 700_000;

const TCS_RULES = [
  { category: 'education_loan', rate: 0.5, label: 'Education (via bank loan)' },
  { category: 'education_self', rate: 5, label: 'Education / Medical (self-funded)' },
  { category: 'medical', rate: 5, label: 'Medical treatment' },
  { category: 'investment', rate: 20, label: 'Investment in overseas assets' },
  { category: 'travel', rate: 20, label: 'Foreign travel' },
  { category: 'gift', rate: 20, label: 'Gift / Donation' },
  { category: 'other', rate: 20, label: 'Other purposes' },
] as const;

export function calculateTcs(
  amountInr: number,
  category: string,
  cumulativeFyRemitted: number,
) {
  const rule = TCS_RULES.find((r) => r.category === category) ?? TCS_RULES[6];
  const totalAfter = cumulativeFyRemitted + amountInr;

  if (totalAfter <= TCS_THRESHOLD_INR) {
    return { tcsPercentage: 0, tcsAmount: 0, thresholdMet: false, taxableAmount: 0 };
  }

  const overThreshold = totalAfter - TCS_THRESHOLD_INR;
  const taxable = Math.min(overThreshold, amountInr);
  const tcsAmount = Math.round((taxable * rule.rate) / 100 * 100) / 100;

  return {
    tcsPercentage: rule.rate,
    tcsAmount,
    thresholdMet: true,
    taxableAmount: taxable,
    rule: rule.label,
  };
}

export function getTcsRules() {
  return TCS_RULES;
}

export { TCS_THRESHOLD_INR, TCS_RULES };