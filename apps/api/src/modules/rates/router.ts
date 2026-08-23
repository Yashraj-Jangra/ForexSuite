import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../../trpc/context';
import { exchangeRates, currencies } from '@vaultbill/db/schemas/tenant';
import { desc, eq } from 'drizzle-orm';

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export const rateRouter = router({
  latest: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(exchangeRates).orderBy(desc(exchangeRates.fetchedAt)).limit(50);
  }),

  currencies: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(currencies).orderBy(currencies.code),
  ),

  convert: publicProcedure
    .input(z.object({ from: z.string().length(3), to: z.string().length(3), amount: z.coerce.number() }))
    .query(async ({ ctx, input }) => {
      const from = input.from.toUpperCase();
      const to = input.to.toUpperCase();

      if (from === to) {
        return { rate: 1, converted: input.amount };
      }

      // 1. Direct match: from -> to
      const [direct] = await ctx.db
        .select()
        .from(exchangeRates)
        .where(eq(exchangeRates.baseCurrency, from))
        .orderBy(desc(exchangeRates.fetchedAt))
        .limit(1);

      if (direct && direct.targetCurrency === to) {
        const rate = Number(direct.rate);
        return { rate, converted: Math.round(input.amount * rate * 100) / 100 };
      }

      // 2. USD based lookup
      const allRates = await ctx.db.select().from(exchangeRates).limit(100);
      const usdFrom = from === 'USD' ? 1 : Number(allRates.find((r) => r.targetCurrency === from)?.rate ?? 0);
      const usdTo = to === 'USD' ? 1 : Number(allRates.find((r) => r.targetCurrency === to)?.rate ?? 0);

      if (usdFrom > 0 && usdTo > 0) {
        const crossRate = usdTo / usdFrom;
        return { rate: crossRate, converted: Math.round(input.amount * crossRate * 100) / 100 };
      }

      return { rate: 1, converted: input.amount };
    }),

  syncNow: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD');
      if (!res.ok) throw new Error(`Rate API returned ${res.status}`);
      const data = (await res.json()) as FrankfurterResponse;

      for (const [target, rate] of Object.entries(data.rates)) {
        await ctx.db
          .insert(exchangeRates)
          .values({
            baseCurrency: data.base,
            targetCurrency: target,
            rate: String(rate),
            source: 'frankfurter',
          });
      }

      return { success: true, count: Object.keys(data.rates).length, timestamp: new Date().toISOString() };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to sync rates' };
    }
  }),
});
