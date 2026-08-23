import { describe, it, expect } from 'vitest';
import { calculateTcs, TCS_THRESHOLD_INR } from '../tcs';

describe('calculateTcs', () => {
  it('no TCS below threshold', () => {
    const r = calculateTcs(500000, 'other', 0);
    expect(r.tcsAmount).toBe(0);
    expect(r.tcsPercentage).toBe(0);
  });

  it('20% TCS on amount above threshold for other', () => {
    const r = calculateTcs(200000, 'other', 600000);
    expect(r.tcsAmount).toBe(20000);
    expect(r.thresholdMet).toBe(true);
  });

  it('5% TCS for education self', () => {
    const r = calculateTcs(200000, 'education_self', 600000);
    expect(r.tcsAmount).toBe(5000);
  });

  it('0.5% TCS for education loan', () => {
    const r = calculateTcs(200000, 'education_loan', 600000);
    expect(r.tcsAmount).toBe(500);
  });

  it('exact threshold boundary', () => {
    const r = calculateTcs(1, 'other', 700000);
    expect(r.tcsAmount).toBe(0.2);
  });

  it('cumulative already over threshold', () => {
    const r = calculateTcs(100000, 'other', 800000);
    expect(r.tcsAmount).toBe(20000);
  });

  it('unknown category defaults to other (20%)', () => {
    const r = calculateTcs(100000, 'unknown_cat', 700000);
    expect(r.tcsPercentage).toBe(20);
  });
});