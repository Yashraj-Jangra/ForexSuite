import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { invoices, invoiceItems, customers, lutRegistrations } from '@vaultbill/db/schemas/tenant';
import { eq, desc, like, sql, and, gt } from 'drizzle-orm';
import { getHsnRate } from '@vaultbill/shared';

const lineItemInput = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
  hsnCode: z.string().optional(),
  gstRate: z.coerce.number().optional(),
});

const createInvoiceInput = z.object({
  customerId: z.string().uuid(),
  currency: z.string().length(3),
  exchangeRate: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
  dueAt: z.string().optional(),
  isExport: z.boolean().default(false),
  items: z.array(lineItemInput).min(1),
});

async function nextInvoiceNumber(ctxDb: any): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const [row] = await ctxDb
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(like(invoices.invoiceNumber, `INV-${year}-%`))
    .orderBy(desc(invoices.createdAt))
    .limit(1);

  if (!row?.invoiceNumber) {
    return `INV-${year}-0001`;
  }

  const parts = row.invoiceNumber.split('-');
  const lastNum = parseInt(parts[parts.length - 1] || '0', 10);
  const next = isNaN(lastNum) ? 1 : lastNum + 1;
  return `INV-${year}-${String(next).padStart(4, '0')}`;
}


async function getActiveLut(ctxDb: any) {
  const today = new Date().toISOString().split('T')[0] ?? '';
  const [lut] = await ctxDb
    .select()
    .from(lutRegistrations)
    .where(and(eq(lutRegistrations.isActive, true), gt(lutRegistrations.expiryDate, today)))
    .limit(1);
  return lut ?? null;
}

export const invoiceRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
        limit: z.number().int().max(100).default(50),
        offset: z.number().int().default(0),
      }).optional(),
    )
    .query(({ ctx, input }) =>
      ctx.db
        .select()
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .orderBy(desc(invoices.createdAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0),
    ),

  get: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const [inv] = await ctx.db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.id, input))
      .limit(1);
    if (!inv) return null;

    const items = await ctx.db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, input));

    return { ...inv, items };
  }),

  create: protectedProcedure
    .input(createInvoiceInput)
    .mutation(async ({ ctx, input }) => {
      const subtotal = input.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

      let lutNumber: string | null = null;
      if (input.isExport) {
        const lut = await getActiveLut(ctx.db);
        if (lut) lutNumber = lut.referenceNumber;
      }

      const taxAmount = input.items.reduce((s, i) => {
        const rate = i.gstRate ?? (i.hsnCode ? getHsnRate(i.hsnCode) : 0);
        const lineTotal = i.quantity * i.unitPrice;
        return s + Math.round(lineTotal * rate) / 100;
      }, 0);

      const total = Math.round((subtotal + taxAmount) * 100) / 100;

      let lastError: unknown;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const invoiceNumber = await nextInvoiceNumber(ctx.db);

          const result = await ctx.db.transaction(async (tx) => {
            const [inv] = await tx
              .insert(invoices)
              .values({
                customerId: input.customerId,
                currency: input.currency,
                exchangeRate: input.exchangeRate ? String(input.exchangeRate) : null,
                subtotal: String(subtotal),
                taxAmount: String(taxAmount),
                total: String(total),
                invoiceNumber,
                isExport: input.isExport,
                lutNumber,
                dueAt: input.dueAt ? new Date(input.dueAt) : null,
                notes: input.notes,
              })
              .returning();

            if (!inv) throw new Error('Failed to create invoice');

            const values = input.items.map((i) => {
              const rate = i.gstRate ?? (i.hsnCode ? getHsnRate(i.hsnCode) : 0);
              return {
                invoiceId: inv.id,
                description: i.description,
                quantity: String(i.quantity),
                unitPrice: String(i.unitPrice),
                amount: String(i.quantity * i.unitPrice),
                hsnCode: i.hsnCode ?? null,
                gstRate: String(rate),
              };
            });

            await tx.insert(invoiceItems).values(values);

            return { ...inv, items: values };
          });

          return result;
        } catch (err: any) {
          lastError = err;
          if (err?.code === '23505') {
            continue;
          }
          throw err;
        }
      }

      throw lastError;
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string().uuid(), status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']) }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(invoices).set({ status: input.status }).where(eq(invoices.id, input.id)).returning().then((r) => r[0]),
    ),

  delete: protectedProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    const result = await ctx.db.transaction(async (tx) => {
      await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, input));
      return tx.delete(invoices).where(eq(invoices.id, input));
    });
    return { deleted: result.rowCount ?? 0 };
  }),
});
