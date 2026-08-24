import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { invoices, invoiceItems, customers, businessProfile } from '@vaultbill/db/schemas/tenant';
import { eq } from 'drizzle-orm';
import { generatePdf, renderInvoiceHtml, InvoiceTemplateId } from '@vaultbill/pdf';

export const pdfRouter = router({
  download: protectedProcedure
    .input(
      z.union([
        z.string().uuid(),
        z.object({
          id: z.string().uuid(),
          template: z.enum(['modern', 'executive', 'classic', 'minimal', 'corporate']).optional(),
          accentColor: z.string().optional(),
        }),
      ]),
    )
    .query(async ({ ctx, input }) => {
      const invoiceId = typeof input === 'string' ? input : input.id;
      const requestedTemplate = typeof input === 'object' ? input.template : undefined;
      const requestedAccent = typeof input === 'object' ? input.accentColor : undefined;

      const [inv] = await ctx.db
        .select()
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(eq(invoices.id, invoiceId))
        .limit(1);

      if (!inv) throw new Error('Invoice not found');

      const [profile] = await ctx.db.select().from(businessProfile).limit(1);
      const items = await ctx.db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

      const customer = inv.customers;
      const invoice = inv.invoices;

      const activeTemplate = (requestedTemplate || profile?.invoiceTemplate || 'modern') as InvoiceTemplateId;
      const activeAccent = requestedAccent || profile?.invoiceAccentColor || '#2563eb';

      const html = renderInvoiceHtml({
        businessProfile: profile ? {
          companyName: profile.companyName,
          address1: profile.address1 ?? undefined,
          address2: profile.address2 ?? undefined,
          city: profile.city ?? undefined,
          state: profile.state ?? undefined,
          stateCode: profile.stateCode ?? undefined,
          pincode: profile.pincode ?? undefined,
          phone: profile.phone ?? undefined,
          email: profile.email ?? undefined,
          website: profile.website ?? undefined,
          rbiLicenceNo: profile.rbiLicenceNo ?? undefined,
          cin: profile.cin ?? undefined,
          pan: profile.pan ?? undefined,
          gstin: profile.gstin ?? undefined,
          logoBase64: profile.logoBase64 ?? undefined,
          signatureBase64: profile.signatureBase64 ?? undefined,
          disclaimer1: profile.disclaimer1 ?? undefined,
          disclaimer2: profile.disclaimer2 ?? undefined,
        } : null,
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.invoiceType,
        invoiceDate: invoice.issuedAt?.toISOString().split('T')[0] ?? '',
        saleDate: invoice.saleDate ?? undefined,
        placeOfSupply: invoice.placeOfSupply ?? undefined,
        customerName: customer?.name ?? '',
        customerAddress: customer?.address ?? undefined,
        customerPan: customer?.pan ?? undefined,
        customerPassport: customer?.passportNumber ?? undefined,
        customerNationality: customer?.nationality ?? undefined,
        customerDestinationCountry: customer?.defaultDestinationCountry ?? undefined,
        customerPurpose: customer?.defaultPurpose ?? undefined,
        customerGender: customer?.gender ?? undefined,
        transactionNarrative: invoice.transactionNarrative ?? undefined,
        items: items.map((i) => ({
          description: i.description,
          currencyName: i.currencyName,
          sacCode: i.sacCode,
          amountForeign: i.amountForeign,
          itemExchangeRate: i.itemExchangeRate,
          amountInr: i.amountInr,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: i.amount,
        })),
        gstTaxableAmount: invoice.gstTaxableAmount ? Number(invoice.gstTaxableAmount) : null,
        cgstRate: invoice.cgstRate ? Number(invoice.cgstRate) : null,
        cgstAmount: invoice.cgstAmount ? Number(invoice.cgstAmount) : null,
        sgstRate: invoice.sgstRate ? Number(invoice.sgstRate) : null,
        sgstAmount: invoice.sgstAmount ? Number(invoice.sgstAmount) : null,
        igstRate: invoice.igstRate ? Number(invoice.igstRate) : null,
        igstAmount: invoice.igstAmount ? Number(invoice.igstAmount) : null,
        roundOff: invoice.roundOff ? Number(invoice.roundOff) : null,
        total: Number(invoice.total),
        amountInWords: invoice.amountInWords ?? undefined,
        paymentMode: invoice.paymentMode ?? undefined,
        paymentReference: invoice.paymentReference ?? undefined,
        lrsLine: invoice.lrsLine ?? undefined,
        disclaimer1: invoice.disclaimer1 ?? profile?.disclaimer1 ?? undefined,
        disclaimer2: invoice.disclaimer2 ?? profile?.disclaimer2 ?? undefined,
        template: activeTemplate,
        accentColor: activeAccent,
      });

      const pdf = await generatePdf(html);
      return { pdf: pdf.toString('base64'), filename: `${invoice.invoiceNumber}.pdf` };
    }),
});
