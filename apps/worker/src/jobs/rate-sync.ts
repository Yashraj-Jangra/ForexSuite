import { db, exchangeRates } from '@vaultbill/db';
import { loadEnv } from '@vaultbill/config';
import Redis from 'ioredis';

// Primary source: FBIL (official RBI-mandated benchmark, api.frankfurter.dev providers=FBIL)
const FBIL_API = 'https://api.frankfurter.dev/v1/latest?from=INR&providers=FBIL';
// Secondary source: open.er-api for Gulf currencies not covered by FBIL
const GULF_API = 'https://open.er-api.com/v6/latest/USD';

// Gulf currencies not published by FBIL — use FEDAI interbank rates
const FEDAI_ONLY = new Set(['AED', 'SAR', 'KWD', 'QAR', 'OMR', 'BHD']);

export async function syncRates() {
  const today = new Date().toISOString().split('T')[0]!;
  console.log('[rate-sync] Fetching FBIL official rates...');

  const env = loadEnv();
  const redis = new Redis(env.REDIS_URL);

  let fbilDate = today;

  // ── Strategy 1: FBIL Official Rates ─────────────────────────────────────────
  try {
    const res = await fetch(FBIL_API);
    if (res.ok) {
      const data = (await res.json()) as { amount: number; base: string; date: string; rates: Record<string, number> };
      fbilDate = data.date || today;
      const fbilRates = data.rates; // 1 INR = X foreign

      for (const [target, inverseRate] of Object.entries(fbilRates)) {
        if (!inverseRate || inverseRate <= 0) continue;
        const rateInInr = Math.round((1 / inverseRate) * 10000) / 10000;
        const redisKey = `vaultbill:rates:INR:${target}`;
        await redis.set(redisKey, JSON.stringify({ rate: rateInInr, sourceProvider: 'FBIL', rateDate: fbilDate, fetchedAt: new Date().toISOString() }), 'EX', 86400);

        await db.insert(exchangeRates).values({
          baseCurrency: 'INR',
          targetCurrency: target,
          rate: String(rateInInr),
          inverseRate: String(inverseRate),
          source: `RBI/FBIL Official Reference Rates (${fbilDate})`,
          sourceProvider: 'FBIL',
          rateDate: fbilDate,
        }).onConflictDoNothing();
      }
      console.log(`[rate-sync] Synced ${Object.keys(fbilRates).length} FBIL rates for date ${fbilDate}`);
    }
  } catch (err) {
    console.error('[rate-sync] FBIL API failed:', err);
  }

  // ── Strategy 2: FEDAI Gulf Rates ────────────────────────────────────────────
  try {
    const res = await fetch(GULF_API);
    if (res.ok) {
      const data = (await res.json()) as any;
      const usdRates = data?.rates as Record<string, number>;
      const inrPerUsd = usdRates?.INR;

      if (inrPerUsd && inrPerUsd > 0) {
        for (const curr of FEDAI_ONLY) {
          const currPerUsd = usdRates?.[curr];
          if (!currPerUsd || currPerUsd <= 0) continue;
          const rateInInr = Math.round((inrPerUsd / currPerUsd) * 10000) / 10000;
          const redisKey = `vaultbill:rates:INR:${curr}`;
          await redis.set(redisKey, JSON.stringify({ rate: rateInInr, sourceProvider: 'FEDAI', rateDate: today, fetchedAt: new Date().toISOString() }), 'EX', 86400);

          await db.insert(exchangeRates).values({
            baseCurrency: 'INR',
            targetCurrency: curr,
            rate: String(rateInInr),
            inverseRate: String(Math.round((1 / rateInInr) * 100000) / 100000),
            source: 'FEDAI Interbank Market Rates',
            sourceProvider: 'FEDAI',
            rateDate: today,
          }).onConflictDoNothing();
        }
        console.log(`[rate-sync] Synced ${FEDAI_ONLY.size} FEDAI Gulf rates`);
      }
    }
  } catch (err) {
    console.error('[rate-sync] FEDAI (open.er-api) Gulf API failed:', err);
  }

  await redis.quit();
  console.log('[rate-sync] Rate sync complete');
}