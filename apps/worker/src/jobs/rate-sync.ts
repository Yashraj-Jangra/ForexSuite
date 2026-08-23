import { db, exchangeRates } from '@vaultbill/db';
import { loadEnv } from '@vaultbill/config';
import Redis from 'ioredis';

const FRANKFURTER_API = 'https://api.frankfurter.app/latest?from=USD';

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function syncRates() {
  console.log('[rate-sync] Fetching rates from Frankfurter...');
  const res = await fetch(FRANKFURTER_API);
  if (!res.ok) throw new Error(`Frankfurter API responded with ${res.status}`);
  const data = (await res.json()) as FrankfurterResponse;

  const env = loadEnv();
  const redis = new Redis(env.REDIS_URL);

  for (const [target, rate] of Object.entries(data.rates)) {
    const key = `vaultbill:rates:${data.base}:${target}`;
    await redis.set(key, JSON.stringify({ rate, fetchedAt: new Date().toISOString() }), 'EX', 3600);

    await db
      .insert(exchangeRates)
      .values({
        baseCurrency: data.base,
        targetCurrency: target,
        rate: String(rate),
        source: 'frankfurter',
      })
      .onConflictDoNothing();
  }

  await redis.quit();
  console.log(`[rate-sync] Synced ${Object.keys(data.rates).length} rates`);
}