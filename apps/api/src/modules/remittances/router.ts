import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { remittances, rbiPurposeCodes } from '@vaultbill/db/schemas/tenant';
import { eq, desc, sql } from 'drizzle-orm';
import { calculateTcs } from '@vaultbill/shared';
import { LRS_ANNUAL_LIMIT_USD, seedPurposeCodes } from '@vaultbill/config';

export const remittanceRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.select().from(remittances).orderBy(desc(remittances.createdAt)),
  ),

  get: protectedProcedure.input(z.string().uuid()).query(({ ctx, input }) =>
    ctx.db.select().from(remittances).where(eq(remittances.id, input)).limit(1).then((r) => r[0] ?? null),
  ),

  purposeCodes: protectedProcedure.query(async ({ ctx }) => {
    const existing = await ctx.db.select().from(rbiPurposeCodes).limit(1);
    if (existing.length === 0) {
      const codes = seedPurposeCodes();
      await ctx.db.insert(rbiPurposeCodes).values(codes.map((c) => ({ code: c.code, category: c.category, description: c.description })));
      return codes;
    }
    return existing;
  }),

  cumulative: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ total: sql<number>`COALESCE(SUM(amount_inr::numeric), 0)` })
        .from(remittances)
        .where(eq(remittances.remitterPan, input));
      return { pan: input, total: Number(row?.total ?? 0), limit: LRS_ANNUAL_LIMIT_USD, remaining: Math.max(LRS_ANNUAL_LIMIT_USD - Number(row?.total ?? 0), 0) };
    }),

  create: protectedProcedure
    .input(z.object({
      remitterName: z.string().min(1),
      remitterPan: z.string().min(1),
      remitterAadhaar: z.string().optional(),
      remitterAccount: z.string().optional(),
      beneficiaryName: z.string().min(1),
      beneficiaryBankDetails: z.string().optional(),
      beneficiaryCountry: z.string().min(2),
      purposeCode: z.string().min(1),
      purposeDescription: z.string().optional(),
      amountForeign: z.coerce.number().positive(),
      currency: z.string().length(3),
      exchangeRate: z.coerce.number().positive(),
      tcsCategory: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const amountInr = Math.round(input.amountForeign * input.exchangeRate * 100) / 100;

      const [cumulative] = await ctx.db
        .select({ total: sql<number>`COALESCE(SUM(amount_inr::numeric), 0)` })
        .from(remittances)
        .where(eq(remittances.remitterPan, input.remitterPan));

      const tcs = calculateTcs(amountInr, input.tcsCategory ?? 'other', Number(cumulative?.total ?? 0));
      const newCumulative = Number(cumulative?.total ?? 0) + amountInr;

      return ctx.db.transaction(async (tx) => {
        const [result] = await tx.insert(remittances).values({
          remitterName: input.remitterName,
          remitterPan: input.remitterPan,
          remitterAadhaar: input.remitterAadhaar ?? null,
          remitterAccount: input.remitterAccount ?? null,
          beneficiaryName: input.beneficiaryName,
          beneficiaryBankDetails: input.beneficiaryBankDetails ?? null,
          beneficiaryCountry: input.beneficiaryCountry,
          purposeCode: input.purposeCode,
          purposeDescription: input.purposeDescription ?? null,
          amountForeign: String(input.amountForeign),
          currency: input.currency,
          exchangeRate: String(input.exchangeRate),
          amountInr: String(amountInr),
          tcsPercentage: String(tcs.tcsPercentage),
          tcsAmount: String(tcs.tcsAmount),
          panFinancialYearRemitted: String(newCumulative),
          status: 'completed',
        }).returning() as any;
        const rows = result ?? [];
        if (!rows[0]) throw new Error('Failed to create remittance');
        return rows[0];
      });
    }),
});
