import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { invoices, invoiceItems, customers, lutRegistrations, businessProfile } from '@vaultbill/db/schemas/tenant';
import { eq, desc, like, and, gt, isNull } from 'drizzle-orm';
import { getHsnRate } from '@vaultbill/shared';

// ─── Utilities ───────────────────────────────────────────────────────────────

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertHundreds(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n]!;
  if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 !== 0 ? ' ' + ones[n % 10] : ''}`;
  return `${ones[Math.floor(n / 100)]} Hundred${n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : ''}`;
}

export function numberToWords(n: number): string {
  const num = Math.round(n);
  if (num === 0) return 'Zero';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;
  let result = '';
  if (crore) result += convertHundreds(crore) + ' Crore ';
  if (lakh) result += convertHundreds(lakh) + ' Lakh ';
  if (thousand) result += convertHundreds(thousand) + ' Thousand ';
  if (rest) result += convertHundreds(rest);
  return result.trim() + ' Only';
}

export function generateNarrative(customer: { name: string; gender?: string | null; passportNumber?: string | null; nationality?: string | null; destinationCountry?: string | null; defaultDestinationCountry?: string | null }, transactionType: 'sell' | 'buy' = 'sell'): string {
  const title = customer.gender ?? 'Ms.';
  const passport = customer.passportNumber ?? 'N/A';
  const nationality = customer.nationality ?? 'INDIAN';
  const destination = customer.destinationCountry ?? customer.defaultDestinationCountry ?? 'N/A';
  if (transactionType === 'sell') {
    return `We have sold today Foreign Exchange to ${title} ${customer.name} holder of PASSPORT ${passport} Nationality ${nationality} Proceeding to ${destination} against Indian Rupees as per the details given below :`;
  }
  return `We have purchased today Foreign Exchange from ${title} ${customer.name} holder of PASSPORT ${passport} Nationality ${nationality} against Indian Rupees as per the details given below :`;
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

async function nextInvoiceNumber(ctxDb: any): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  // Check if we have a business profile with custom format
  const [profile] = await ctxDb.select().from(businessProfile).limit(1);
  const format = profile?.invoiceNumberFormat ?? 'INV-{YY}-{SEQ}';

  // Find the latest invoice matching the current year pattern
  const [row] = await ctxDb
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .orderBy(desc(invoices.createdAt))
    .limit(1);

  let nextSeed = (profile?.invoiceNumberSeed ?? 0) + 1;
  if (row?.invoiceNumber) {
    // Extract trailing number
    const match = row.invoiceNumber.match(/(\d+)$/);
    if (match) {
      const lastNum = parseInt(match[1]!, 10);
      if (!isNaN(lastNum)) nextSeed = Math.max(nextSeed, lastNum + 1);
    }
  }

  const yyyy = new Date().getFullYear().toString();
  const seq = String(nextSeed).padStart(4, '0');
  return format
    .replace('{SEQ}', seq)
    .replace('{YY}', year)
    .replace('{YYYY}', yyyy);
}

// ─── Input Schemas ────────────────────────────────────────────────────────────

const forexLineItemInput = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive().optional().default(1),
  unitPrice: z.coerce.number().optional().default(0),
  hsnCode: z.string().optional(),
  gstRate: z.coerce.number().optional(),
  // Forex / Cash Memo specific
  currencyName: z.string().optional(),
  sacCode: z.string().optional(),
  amountForeign: z.coerce.number().optional(),
  itemExchangeRate: z.coerce.number().optional(),
  amountInr: z.coerce.number().optional(),
});

const createInvoiceInput = z.object({
  customerId: z.string().uuid(),
  currency: z.string().length(3),
  exchangeRate: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
  dueAt: z.string().optional(),
  isExport: z.boolean().default(false),
  items: z.array(forexLineItemInput).min(1),
  // Invoice type
  invoiceType: z.enum(['cash_memo', 'tax_invoice', 'export_invoice']).default('tax_invoice'),
  // Cash Memo fields
  saleDate: z.string().optional(),
  placeOfSupply: z.string().optional(),
  paymentMode: z.enum(['CASH', 'CARD', 'UPI', 'NEFT']).optional().default('CASH'),
  paymentReference: z.string().optional(),
  // GST overrides (if not provided, auto-computed)
  cgstRate: z.coerce.number().optional(),
  sgstRate: z.coerce.number().optional(),
  igstRate: z.coerce.number().optional(),
  useIgst: z.boolean().optional().default(false),
  gstTaxableBasePct: z.coerce.number().optional(),
  // Overridable auto-generated fields
  transactionNarrative: z.string().optional(),
  lrsLine: z.string().optional(),
  disclaimer1: z.string().optional(),
  disclaimer2: z.string().optional(),
  // Customer KYC overrides for this specific invoice (can differ from saved profile)
  customerDestinationCountry: z.string().optional(),
  customerPurpose: z.string().optional(),
  customerGender: z.string().optional(),
  customerPassport: z.string().optional(),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const invoiceRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
        includeDeleted: z.boolean().default(false),
        limit: z.number().int().max(100).default(50),
        offset: z.number().int().default(0),
      }).optional(),
    )
    .query(({ ctx, input }) => {
      const conditions: any[] = [];
      if (!input?.includeDeleted) {
        conditions.push(isNull(invoices.deletedAt));
      }
      if (input?.status) {
        conditions.push(eq(invoices.status, input.status));
      }
      return ctx.db
        .select()
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(invoices.createdAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);
    }),

  get: protectedProcedure
    .input(
      z.union([
        z.string().uuid(),
        z.object({
          id: z.string().uuid(),
          includeDeleted: z.boolean().default(false),
        }),
      ]),
    )
    .query(async ({ ctx, input }) => {
      const id = typeof input === 'string' ? input : input.id;
      const includeDeleted = typeof input === 'string' ? false : input.includeDeleted;

      const conditions: any[] = [eq(invoices.id, id)];
      if (!includeDeleted) {
        conditions.push(isNull(invoices.deletedAt));
      }

      const [inv] = await ctx.db
        .select()
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(and(...conditions))
        .limit(1);
      if (!inv) return null;
      const items = await ctx.db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
      return { ...inv, items };
    }),

  create: protectedProcedure
    .input(createInvoiceInput)
    .mutation(async ({ ctx, input }) => {
      // Load customer and business profile for auto-computation
      const [customer] = await ctx.db.select().from(customers).where(eq(customers.id, input.customerId)).limit(1);
      const [profile] = await ctx.db.select().from(businessProfile).limit(1);

      // Compute INR totals from forex lines
      const inrTotal = input.items.reduce((s, i) => {
        if (i.amountInr) return s + i.amountInr;
        if (i.amountForeign && i.itemExchangeRate) return s + i.amountForeign * i.itemExchangeRate;
        return s + i.quantity * i.unitPrice;
      }, 0);

      // GST computation
      const gstBasePct = input.gstTaxableBasePct ?? Number(profile?.defaultGstTaxableBasePct ?? 1);
      const gstTaxableAmount = Math.round(inrTotal * gstBasePct) / 100;
      const cgstRate = input.cgstRate ?? Number(profile?.defaultCgstRate ?? 9);
      const sgstRate = input.sgstRate ?? Number(profile?.defaultSgstRate ?? 9);
      const igstRate = input.igstRate ?? Number(profile?.defaultIgstRate ?? 18);
      const useIgst = input.useIgst ?? false;

      let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
      if (useIgst) {
        igstAmount = Math.round(gstTaxableAmount * igstRate) / 100;
      } else {
        cgstAmount = Math.round(gstTaxableAmount * cgstRate * 100) / 10000;
        sgstAmount = Math.round(gstTaxableAmount * sgstRate * 100) / 10000;
      }

      const rawTotal = inrTotal + cgstAmount + sgstAmount + igstAmount;
      const total = Math.round(rawTotal);
      const roundOff = Math.round((total - rawTotal) * 100) / 100;

      // LRS line
      const customerPan = customer?.pan ?? '';
      const lrsLine = input.lrsLine ?? (customer ? `${customer.name}(Self), PAN - ${customerPan}` : '');

      // Amount in words
      const amountInWords = numberToWords(total);

      // Transaction narrative
      let transactionNarrative = input.transactionNarrative ?? '';
      if (!transactionNarrative && customer && input.invoiceType === 'cash_memo') {
        const customerForNarrative = {
          name: customer.name,
          gender: input.customerGender ?? customer.gender,
          passportNumber: input.customerPassport ?? customer.passportNumber,
          nationality: customer.nationality,
          destinationCountry: input.customerDestinationCountry ?? customer.defaultDestinationCountry,
        };
        transactionNarrative = generateNarrative(customerForNarrative);
      }

      // LUT for export invoices
      let lutNumber: string | null = null;
      if (input.isExport) {
        const lut = await getActiveLut(ctx.db);
        if (lut) lutNumber = lut.referenceNumber;
      }

      const subtotal = inrTotal;
      const taxAmount = cgstAmount + sgstAmount + igstAmount;

      let lastError: unknown;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const invoiceNumber = await nextInvoiceNumber(ctx.db);

          const result = await ctx.db.transaction(async (tx) => {
            const [inv] = await tx.insert(invoices).values({
              customerId: input.customerId,
              currency: input.currency,
              exchangeRate: input.exchangeRate ? String(input.exchangeRate) : null,
              subtotal: String(subtotal),
              taxAmount: String(taxAmount),
              total: String(total),
              invoiceNumber,
              invoiceType: input.invoiceType,
              isExport: input.isExport,
              lutNumber,
              dueAt: input.dueAt ? new Date(input.dueAt) : null,
              notes: input.notes,
              saleDate: input.saleDate ?? new Date().toISOString().split('T')[0],
              placeOfSupply: input.placeOfSupply,
              paymentMode: input.paymentMode,
              paymentReference: input.paymentReference,
              transactionNarrative,
              gstTaxableAmount: String(gstTaxableAmount),
              cgstRate: String(cgstRate),
              cgstAmount: String(cgstAmount),
              sgstRate: String(sgstRate),
              sgstAmount: String(sgstAmount),
              igstRate: String(igstRate),
              igstAmount: String(igstAmount),
              roundOff: String(roundOff),
              lrsLine,
              amountInWords,
              disclaimer1: input.disclaimer1 ?? profile?.disclaimer1,
              disclaimer2: input.disclaimer2 ?? profile?.disclaimer2,
            }).returning();

            if (!inv) throw new Error('Failed to create invoice');

            const values = input.items.map((i) => {
              const rate = i.gstRate ?? (i.hsnCode ? getHsnRate(i.hsnCode) : 0);
              const amtInr = i.amountInr ?? (i.amountForeign && i.itemExchangeRate ? i.amountForeign * i.itemExchangeRate : i.quantity * i.unitPrice);
              return {
                invoiceId: inv.id,
                description: i.description,
                quantity: String(i.quantity),
                unitPrice: String(i.unitPrice),
                amount: String(amtInr),
                hsnCode: i.hsnCode ?? null,
                gstRate: String(rate),
                currencyName: i.currencyName ?? null,
                sacCode: i.sacCode ?? profile?.defaultSacCode ?? '997157',
                amountForeign: i.amountForeign ? String(i.amountForeign) : null,
                itemExchangeRate: i.itemExchangeRate ? String(i.itemExchangeRate) : null,
                amountInr: String(amtInr),
              };
            });

            await tx.insert(invoiceItems).values(values);
            return { ...inv, items: values };
          });

          return result;
        } catch (err: any) {
          lastError = err;
          if (err?.code === '23505') continue;
          throw err;
        }
      }
      throw lastError;
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string().uuid(), status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']) }))
    .mutation(async ({ ctx, input }) => {
      // Fetch current invoice status for validation
      const [existing] = await ctx.db
        .select({ status: invoices.status })
        .from(invoices)
        .where(eq(invoices.id, input.id))
        .limit(1);

      if (!existing) {
        throw new (await import('@trpc/server')).TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
      }

      const { TRPCError } = await import('@trpc/server');

      // Once paid or cancelled, the invoice is fully immutable
      if (existing.status === 'paid' || existing.status === 'cancelled') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Invoice is ${existing.status} and fully immutable. No further changes are allowed.`,
        });
      }

      return ctx.db
        .update(invoices)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(invoices.id, input.id))
        .returning()
        .then((r) => r[0]);
    }),

  // Soft-delete only — FEMA mandates 5-year retention of financial records
  delete: protectedProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db
      .select({ status: invoices.status })
      .from(invoices)
      .where(eq(invoices.id, input))
      .limit(1);

    const { TRPCError } = await import('@trpc/server');

    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });

    // Cannot delete finalized invoices
    if (existing.status === 'sent' || existing.status === 'paid') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Finalized invoices cannot be deleted. Cancel the invoice first.',
      });
    }

    // Soft delete: set deletedAt timestamp, keep all data
    await ctx.db
      .update(invoices)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(invoices.id, input));

    return { deleted: true };
  }),
});
