import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { fircs, invoices } from '@vaultbill/db/schemas/tenant';
import { eq } from 'drizzle-orm';

export const fircRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.select().from(fircs).orderBy(fircs.dateOfIssuance).limit(200),
  ),

  get: protectedProcedure.input(z.string().uuid()).query(({ ctx, input }) =>
    ctx.db.select().from(fircs).where(eq(fircs.id, input)).limit(1).then((r) => r[0] ?? null),
  ),

  create: protectedProcedure
    .input(z.object({
      fircNumber: z.string().min(1),
      issuingBank: z.string().min(1),
      dateOfIssuance: z.string(),
      amount: z.coerce.number().positive(),
      currency: z.string().length(3),
      exchangeRate: z.coerce.number().positive().optional(),
      amountInr: z.coerce.number().optional(),
      purposeCode: z.string().optional(),
      pdfPath: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const unmapped = input.amountInr ?? input.amount;
      return ctx.db.insert(fircs).values({
        fircNumber: input.fircNumber,
        issuingBank: input.issuingBank,
        dateOfIssuance: input.dateOfIssuance,
        amount: String(input.amount),
        currency: input.currency,
        exchangeRate: input.exchangeRate ? String(input.exchangeRate) : null,
        amountInr: input.amountInr ? String(input.amountInr) : null,
        purposeCode: input.purposeCode ?? null,
        pdfPath: input.pdfPath ?? null,
        unmappedAmountInr: String(unmapped),
      }).returning().then((r) => r[0]);
    }),

  linkInvoice: protectedProcedure
    .input(z.object({ fircId: z.string().uuid(), invoiceId: z.string().uuid(), amount: z.coerce.number() }))
    .mutation(async ({ ctx, input }) => {
      const [firc] = await ctx.db.select().from(fircs).where(eq(fircs.id, input.fircId)).limit(1);
      if (!firc) throw new Error('FIRC not found');

      const currentUnmapped = Number(firc.unmappedAmountInr ?? firc.amountInr ?? firc.amount);
      const newUnmapped = Math.round((currentUnmapped - input.amount) * 100) / 100;
      if (newUnmapped < 0) throw new Error('Amount exceeds unmapped balance');

      await ctx.db.transaction(async (tx) => {
        await tx.update(fircs).set({ unmappedAmountInr: String(Math.max(newUnmapped, 0)) }).where(eq(fircs.id, input.fircId));
        await tx.update(invoices).set({ fircId: input.fircId }).where(eq(invoices.id, input.invoiceId));
      });

      return { linked: true };
    }),

  delete: protectedProcedure.input(z.string().uuid()).mutation(({ ctx, input }) =>
    ctx.db.delete(fircs).where(eq(fircs.id, input)),
  ),
});