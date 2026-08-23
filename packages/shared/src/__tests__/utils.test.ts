import { describe, it, expect } from 'vitest';
import { daysSince, financialYearStart, formatCurrency } from '../utils';

describe('daysSince', () => {
  it('returns 0 for today', () => {
    expect(daysSince(new Date())).toBe(0);
  });

  it('returns positive for past dates', () => {
    const past = new Date(Date.now() - 10 * 86400000);
    expect(daysSince(past)).toBe(10);
  });
});

describe('financialYearStart', () => {
  it('returns April 1 of current year', () => {
    const fy = financialYearStart();
    expect(fy.getMonth()).toBe(3);
    expect(fy.getDate()).toBe(1);
  });
});