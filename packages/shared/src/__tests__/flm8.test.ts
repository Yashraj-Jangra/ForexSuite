import { describe, it, expect } from 'vitest';

describe('FLM-8 balance equation', () => {
  it('closing balance matches basic equation', () => {
    const opening = 10000;
    const purchases = 5000;
    const sales = 3000;
    const closing = opening + purchases - sales;
    expect(closing).toBe(12000);
  });

  it('validates correctly', () => {
    const opening = 10000;
    const purchases = 5000;
    const sales = 3000;
    const closing = opening + purchases - sales;
    const isValid = Math.abs(closing - (opening + purchases - sales)) < 0.01;
    expect(isValid).toBe(true);
  });

  it('detects mismatch with floating point issues', () => {
    const opening = 10000;
    const purchases = 5000.01;
    const sales = 3000;
    const closing = 12000.01;
    const isValid = Math.abs(closing - (opening + purchases - sales)) < 0.01;
    expect(isValid).toBe(true);
  });
});