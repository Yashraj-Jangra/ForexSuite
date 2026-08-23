import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { invoices, invoiceItems, customers } from '@vaultbill/db/schemas/tenant';
import { db } from '@vaultbill/db';
import { eq } from 'drizzle-orm';
import { generatePdf, renderInvoiceHtml } from '@vaultbill/pdf';

export const pdfRouter = router({
  download: protectedProcedure.input(z.string().uuid()).query(async ({ input }) => {
    const [inv] = await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.id, input))
      .limit(1);

    if (!inv) throw new Error('Invoice not found');

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, input));

    const html = renderInvoiceHtml({
      invoiceNumber: inv.invoices.invoiceNumber,
      date: inv.invoices.issuedAt?.toISOString().split('T')[0] ?? '',
      customerName: inv.customers?.name ?? '',
      customerAddress: inv.customers?.address ?? '',
      currency: inv.invoices.currency,
      total: inv.invoices.total,
      items: items
        .map(
          (i) =>
            `<tr><td>${i.description}</td><td>${i.quantity}</td><td>${i.unitPrice}</td><td>${i.amount}</td></tr>`,
        )
        .join(''),
      companyName: 'VaultBill',
    });

    const pdf = await generatePdf(html);
    return { pdf: pdf.toString('base64'), filename: `${inv.invoices.invoiceNumber}.pdf` };
  }),
});