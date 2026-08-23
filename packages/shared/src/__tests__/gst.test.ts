import { describe, it, expect } from 'vitest';
import { calculateGst, validateGstin, getHsnRate, searchHsn } from '../gst';

describe('calculateGst', () => {
  it('same state returns CGST + SGST', () => {
    const result = calculateGst(1000, 18, '27', '27', false);
    expect(result.cgst).toBe(90);
    expect(result.sgst).toBe(90);
    expect(result.igst).toBe(0);
    expect(result.totalGst).toBe(180);
  });

  it('different state returns IGST', () => {
    const result = calculateGst(1000, 18, '27', '08', false);
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.igst).toBe(180);
  });

  it('export returns zero GST', () => {
    const result = calculateGst(1000, 18, '27', '08', true);
    expect(result.totalGst).toBe(0);
  });

  it('rounds correctly for odd amounts', () => {
    const result = calculateGst(333, 18, '27', '27', false);
    expect(result.cgst + result.sgst).toBe(result.totalGst);
  });
});

describe('validateGstin', () => {
  it('valid GSTIN passes', () => {
    const r = validateGstin('27AABCU1234D1Z5');
    expect(r.valid).toBe(true);
  });

  it('invalid format fails', () => {
    const r = validateGstin('invalid');
    expect(r.valid).toBe(false);
  });

  it('empty GSTIN fails', () => {
    const r = validateGstin('');
    expect(r.valid).toBe(false);
  });
});

describe('getHsnRate', () => {
  it('returns correct rate for known HSN', () => {
    expect(getHsnRate('8471')).toBe(18);
  });

  it('returns default 18 for unknown HSN', () => {
    expect(getHsnRate('9999')).toBe(18);
  });
});

describe('searchHsn', () => {
  it('returns results for partial match', () => {
    const results = searchHsn('comput');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.description.toLowerCase().includes('comput'))).toBe(true);
  });
});