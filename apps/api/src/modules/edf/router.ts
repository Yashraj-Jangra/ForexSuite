import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { edfRecords } from '@vaultbill/db/schemas/tenant';
import { eq, desc, and, isNull } from 'drizzle-orm';

const RBI_PURPOSE_CODES = [
  { code: 'P0802', description: 'Software services' },
  { code: 'P1006', description: 'Consultancy services' },
  { code: 'P0016', description: 'Currency exchange / FFMC sales' },
  { code: 'P0101', description: 'Export of goods' },
  { code: 'S0001', description: 'LRS - Private visit abroad' },
  { code: 'S0002', description: 'LRS - Business travel' },
  { code: 'S0004', description: 'LRS - Education abroad' },
  { code: 'S0005', description: 'LRS - Medical treatment abroad' },
];

export const edfRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().default(50) }).optional())
    .query(({ ctx, input }) =>
      ctx.db
        .select()
        .from(edfRecords)
        .where(isNull(edfRecords.deletedAt))
        .orderBy(desc(edfRecords.createdAt))
        .limit(input?.limit ?? 50),
    ),

  get: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const [record] = await ctx.db
      .select()
      .from(edfRecords)
      .where(and(eq(edfRecords.id, input), isNull(edfRecords.deletedAt)))
      .limit(1);
    return record ?? null;
  }),

  create: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string().uuid().optional(),
        financialYear: z.string().min(1),
        buyerName: z.string().min(1),
        buyerCountry: z.string().min(1),
        buyerAddress: z.string().optional(),
        purposeCode: z.string().min(1),
        amountForeign: z.coerce.number().positive(),
        currency: z.string().length(3),
        amountInr: z.coerce.number().optional(),
        adBankName: z.string().optional(),
        adBranchCity: z.string().optional(),
        softexNumber: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [record] = await ctx.db.insert(edfRecords).values({
        invoiceId: input.invoiceId ?? null,
        financialYear: input.financialYear,
        buyerName: input.buyerName,
        buyerCountry: input.buyerCountry,
        buyerAddress: input.buyerAddress,
        purposeCode: input.purposeCode,
        amountForeign: String(input.amountForeign),
        currency: input.currency,
        amountInr: input.amountInr ? String(input.amountInr) : null,
        adBankName: input.adBankName,
        adBranchCity: input.adBranchCity,
        softexNumber: input.softexNumber,
        notes: input.notes,
        status: 'draft',
      }).returning();
      return record;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['draft', 'submitted', 'acknowledged', 'closed']),
        edfNumber: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {
        status: input.status,
        updatedAt: new Date(),
      };
      if (input.edfNumber) updates.edfNumber = input.edfNumber;
      if (input.status === 'submitted') updates.submittedAt = new Date();
      if (input.status === 'acknowledged') updates.acknowledgedAt = new Date();

      const [updated] = await ctx.db
        .update(edfRecords)
        .set(updates as Parameters<typeof ctx.db.update>[0] extends infer T ? T : never)
        .where(eq(edfRecords.id, input.id))
        .returning();
      return updated;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        buyerName: z.string().optional(),
        buyerCountry: z.string().optional(),
        buyerAddress: z.string().optional(),
        purposeCode: z.string().optional(),
        amountForeign: z.coerce.number().optional(),
        currency: z.string().optional(),
        amountInr: z.coerce.number().optional(),
        adBankName: z.string().optional(),
        adBranchCity: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined) updates[k] = typeof v === 'number' ? String(v) : v;
      }
      const [updated] = await ctx.db
        .update(edfRecords)
        .set(updates as Parameters<typeof ctx.db.update>[0] extends infer T ? T : never)
        .where(eq(edfRecords.id, id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(edfRecords)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(edfRecords.id, input));
    return { deleted: true };
  }),

  purposeCodes: protectedProcedure.query(() => RBI_PURPOSE_CODES),

  // Summary: pending + submitted counts for dashboard widget
  summary: protectedProcedure.query(async ({ ctx }) => {
    const all = await ctx.db
      .select({ status: edfRecords.status })
      .from(edfRecords)
      .where(isNull(edfRecords.deletedAt));

    const counts = { draft: 0, submitted: 0, acknowledged: 0, closed: 0 };
    for (const row of all) {
      if (row.status in counts) counts[row.status as keyof typeof counts]++;
    }
    return counts;
  }),
});
