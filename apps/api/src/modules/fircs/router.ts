import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { fircs, invoices } from '@vaultbill/db/schemas/tenant';
import { eq, desc } from 'drizzle-orm';

const fircInputSchema = z.object({
  fircNumber: z.string().min(1),
  issuingBank: z.string().min(1),
  dateOfIssuance: z.string(),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3),
  exchangeRate: z.coerce.number().positive().optional(),
  amountInr: z.coerce.number().optional(),
  purposeCode: z.string().optional(),
  pdfPath: z.string().optional(),
  // e-FIRC & EDPMS fields
  eFircReference: z.string().optional(),
  adBankName: z.string().optional(),
  remitterName: z.string().optional(),
  shortRealizationFlag: z.boolean().default(false),
  shortRealizationAmount: z.coerce.number().optional(),
  shortRealizationReason: z.string().optional(),
  compoundingRequired: z.boolean().default(false),
  edpmsStatus: z.enum(['pending', 'reported', 'closed']).default('pending'),
});

export const fircRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.select().from(fircs).orderBy(desc(fircs.dateOfIssuance)).limit(200),
  ),

  get: protectedProcedure.input(z.string().uuid()).query(({ ctx, input }) =>
    ctx.db.select().from(fircs).where(eq(fircs.id, input)).limit(1).then((r) => r[0] ?? null),
  ),

  create: protectedProcedure
    .input(fircInputSchema)
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
        eFircReference: input.eFircReference ?? null,
        adBankName: input.adBankName ?? null,
        remitterName: input.remitterName ?? null,
        shortRealizationFlag: input.shortRealizationFlag,
        shortRealizationAmount: input.shortRealizationAmount ? String(input.shortRealizationAmount) : null,
        shortRealizationReason: input.shortRealizationReason ?? null,
        compoundingRequired: input.compoundingRequired,
        edpmsStatus: input.edpmsStatus,
      }).returning().then((r) => r[0]);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: fircInputSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;
      const updates: any = { updatedAt: new Date() };

      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined) {
          updates[k] = typeof v === 'number' ? String(v) : v;
        }
      }

      return ctx.db
        .update(fircs)
        .set(updates)
        .where(eq(fircs.id, id))
        .returning()
        .then((r) => r[0]);
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