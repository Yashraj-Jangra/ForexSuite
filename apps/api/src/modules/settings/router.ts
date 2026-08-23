import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { settings } from '@vaultbill/db/schemas/tenant';
import { eq, sql } from 'drizzle-orm';

export const settingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) return {};
    const rows = await ctx.db.select().from(settings).limit(100);
    const result: Record<string, string> = {};
    for (const row of rows) {
      try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = row.value; }
    }
    return result;
  }),

  set: protectedProcedure
    .input(z.object({ key: z.string(), value: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const stringValue = typeof input.value === 'string' ? input.value : JSON.stringify(input.value);
      const existing = await ctx.db.select().from(settings).where(eq(settings.key, input.key)).limit(1);
      if (existing.length > 0) {
        await ctx.db.update(settings).set({ value: stringValue, updatedAt: sql`now()` }).where(eq(settings.key, input.key));
      } else {
        await ctx.db.insert(settings).values({ key: input.key, value: stringValue });
      }
      return { saved: true, key: input.key };
    }),
});