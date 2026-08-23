import { z } from 'zod';
import { router, publicProcedure } from '../../trpc/context';
import { exchangeRates, currencies } from '@vaultbill/db/schemas/tenant';
import { db } from '@vaultbill/db';
import { desc, eq } from 'drizzle-orm';

export const rateRouter = router({
  latest: publicProcedure.query(() =>
    db.select().from(exchangeRates).orderBy(desc(exchangeRates.fetchedAt)).limit(50),
  ),

  currencies: publicProcedure.query(() =>
    db.select().from(currencies).orderBy(currencies.code),
  ),

  convert: publicProcedure
    .input(z.object({ from: z.string().length(3), to: z.string().length(3), amount: z.coerce.number() }))
    .query(async ({ input }) => {
      const [rate] = await db
        .select()
        .from(exchangeRates)
        .where(eq(exchangeRates.baseCurrency, input.from))
        .orderBy(desc(exchangeRates.fetchedAt))
        .limit(1);

      if (!rate) throw new Error(`No rate found for ${input.from}->${input.to}`);
      const converted = input.amount * Number(rate.rate);
      return { rate: Number(rate.rate), converted: Math.round(converted * 100) / 100 };
    }),
});