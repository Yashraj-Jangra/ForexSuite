import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { invoices, invoiceItems, customers } from '@vaultbill/db/schemas/tenant';
import { db } from '@vaultbill/db';
import { eq, desc, and, like, sql } from 'drizzle-orm';

const lineItemInput = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
});

const createInvoiceInput = z.object({
  customerId: z.string().uuid(),
  currency: z.string().length(3),
  exchangeRate: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
  dueAt: z.string().optional(),
  items: z.array(lineItemInput).min(1),
});

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const [row] = await db
    .select({ max: sql<number>`COALESCE(MAX(NULLIF(REGEXP_REPLACE(invoice_number, '\\D', '', 'g'), '')::int), 0)` })
    .from(invoices)
    .where(like(invoices.invoiceNumber, `INV-${year}-%`));
  const next = (row?.max ?? 0) + 1;
  return `INV-${year}-${String(next).padStart(4, '0')}`;
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
    .query(({ input }) =>
      db
        .select()
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .orderBy(desc(invoices.createdAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0),
    ),

  get: protectedProcedure.input(z.string().uuid()).query(async ({ input }) => {
    const [inv] = await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.id, input))
      .limit(1);
    if (!inv) return null;

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, input));

    return { ...inv, items };
  }),

  create: protectedProcedure
    .input(createInvoiceInput)
    .mutation(async ({ input }) => {
      const invoiceNumber = await nextInvoiceNumber();
      const subtotal = input.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

      const [inv] = await db
        .insert(invoices)
        .values({
          customerId: input.customerId,
          currency: input.currency,
          exchangeRate: input.exchangeRate ? String(input.exchangeRate) : null,
          subtotal: String(subtotal),
          taxAmount: '0',
          total: String(subtotal),
          invoiceNumber,
          dueAt: input.dueAt ? new Date(input.dueAt) : null,
          notes: input.notes,
        })
        .returning();

      if (!inv) throw new Error('Failed to create invoice');

      const values = input.items.map((i) => ({
        invoiceId: inv.id,
        description: i.description,
        quantity: String(i.quantity),
        unitPrice: String(i.unitPrice),
        amount: String(i.quantity * i.unitPrice),
      }));

      await db.insert(invoiceItems).values(values);

      return { ...inv, items: values };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string().uuid(), status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']) }))
    .mutation(({ input }) =>
      db.update(invoices).set({ status: input.status }).where(eq(invoices.id, input.id)).returning().then((r) => r[0]),
    ),

  delete: protectedProcedure.input(z.string().uuid()).mutation(({ input }) => {
    db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, input));
    return db.delete(invoices).where(eq(invoices.id, input)).then((r) => ({ deleted: r.rowCount ?? 0 }));
  }),
});