import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { businessProfile } from '@vaultbill/db/schemas/tenant';
import { renderInvoiceHtml } from '@vaultbill/pdf';

const profileInput = z.object({
  companyName: z.string().default(''),
  address1: z.string().default(''),
  address2: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  stateCode: z.string().default(''),
  pincode: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
  website: z.string().default(''),
  rbiLicenceNo: z.string().default(''),
  cin: z.string().default(''),
  pan: z.string().default(''),
  gstin: z.string().default(''),
  logoBase64: z.string().optional(),
  signatureBase64: z.string().optional(),
  invoiceNumberFormat: z.string().default('INV-{YY}-{SEQ}'),
  invoiceNumberSeed: z.number().int().default(0),
  invoiceTemplate: z.enum(['modern', 'executive', 'classic', 'minimal', 'corporate']).default('modern'),
  invoiceAccentColor: z.string().default('#2563eb'),
  defaultSacCode: z.string().default('997157'),
  defaultCgstRate: z.coerce.number().default(9),
  defaultSgstRate: z.coerce.number().default(9),
  defaultIgstRate: z.coerce.number().default(18),
  defaultGstTaxableBasePct: z.coerce.number().default(1),
  disclaimer1: z.string().default('Please count your money before leaving the counter.'),
  disclaimer2: z.string().default('If any dispute arises against this invoice by any Law Enforcement Agency/Cyber Crime Cell/Any Regulating Authority, Clients will be solely responsible for the same.'),
});

export const businessProfileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await ctx.db.select().from(businessProfile).limit(1);
    return profile ?? null;
  }),

  save: protectedProcedure
    .input(profileInput)
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(businessProfile).limit(1);
      if (existing) {
        const [updated] = await ctx.db
          .update(businessProfile)
          .set({
            ...input,
            defaultCgstRate: String(input.defaultCgstRate),
            defaultSgstRate: String(input.defaultSgstRate),
            defaultIgstRate: String(input.defaultIgstRate),
            defaultGstTaxableBasePct: String(input.defaultGstTaxableBasePct),
            updatedAt: new Date(),
          })
          .returning();
        return updated;
      }
      const [created] = await ctx.db
        .insert(businessProfile)
        .values({
          ...input,
          defaultCgstRate: String(input.defaultCgstRate),
          defaultSgstRate: String(input.defaultSgstRate),
          defaultIgstRate: String(input.defaultIgstRate),
          defaultGstTaxableBasePct: String(input.defaultGstTaxableBasePct),
        })
        .returning();
      return created;
    }),

  previewHtml: protectedProcedure
    .input(
      z.object({
        template: z.enum(['modern', 'executive', 'classic', 'minimal', 'corporate']).default('modern'),
        accentColor: z.string().default('#2563eb'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [profile] = await ctx.db.select().from(businessProfile).limit(1);

      const sampleHtml = renderInvoiceHtml({
        businessProfile: profile ? {
          companyName: profile.companyName || 'ACME FOREX & MONEY CHANGER PVT LTD',
          address1: profile.address1 || 'Suite 401, Financial Express Towers',
          address2: profile.address2 || 'Nariman Point',
          city: profile.city || 'Mumbai',
          state: profile.state || 'Maharashtra',
          stateCode: profile.stateCode || '27',
          pincode: profile.pincode || '400021',
          phone: profile.phone || '+91 22 2847 9000',
          email: profile.email || 'compliance@acmeforex.com',
          website: profile.website || 'www.acmeforex.com',
          rbiLicenceNo: profile.rbiLicenceNo || 'FE.MUM.FFMC/0421/2024',
          cin: profile.cin || 'U74999MH2024PTC123456',
          pan: profile.pan || 'AABCA1234F',
          gstin: profile.gstin || '27AABCA1234F1Z5',
          logoBase64: profile.logoBase64,
          signatureBase64: profile.signatureBase64,
          disclaimer1: profile.disclaimer1 || 'Please count your money before leaving the counter.',
          disclaimer2: profile.disclaimer2 || 'All transactions are subject to FEMA guidelines and RBI master circulars.',
        } : {
          companyName: 'ACME FOREX & MONEY CHANGER PVT LTD',
          address1: 'Suite 401, Financial Express Towers',
          city: 'Mumbai',
          state: 'Maharashtra',
          stateCode: '27',
          pincode: '400021',
          rbiLicenceNo: 'FE.MUM.FFMC/0421/2024',
          cin: 'U74999MH2024PTC123456',
          pan: 'AABCA1234F',
          gstin: '27AABCA1234F1Z5',
        },
        invoiceNumber: 'CM-26-0421',
        invoiceType: 'cash_memo',
        invoiceDate: new Date().toISOString().split('T')[0] ?? '2026-08-24',
        saleDate: new Date().toISOString().split('T')[0] ?? '2026-08-24',
        placeOfSupply: '(27) MAHARASHTRA',
        customerName: 'Ms. Sarah Jenkins',
        customerAddress: 'Flat 12B, Sea Green Heights, Worli, Mumbai',
        customerPan: 'ABCDE9876K',
        customerPassport: 'Z9876543',
        customerNationality: 'BRITISH',
        customerDestinationCountry: 'UNITED KINGDOM',
        customerPurpose: 'PRIVATE VISIT',
        customerGender: 'Ms.',
        transactionNarrative: 'BEING FOREIGN CURRENCY PURCHASED AGAINST BRITISH PASSPORT NO. Z9876543 FOR PRIVATE OVERSEAS TRAVEL UNDER LIBERALISED REMITTANCE SCHEME (LRS).',
        items: [
          {
            description: 'US DOLLAR CURRENCY NOTES',
            currencyName: 'USD - US Dollar',
            sacCode: '997157',
            amountForeign: 2500,
            itemExchangeRate: 86.45,
            amountInr: 216125,
          },
          {
            description: 'BRITISH POUND CURRENCY NOTES',
            currencyName: 'GBP - British Pound',
            sacCode: '997157',
            amountForeign: 1000,
            itemExchangeRate: 111.20,
            amountInr: 111200,
          },
        ],
        gstTaxableAmount: 3273.25,
        cgstRate: 9,
        cgstAmount: 294.59,
        sgstRate: 9,
        sgstAmount: 294.59,
        roundOff: -0.18,
        total: 327914,
        amountInWords: 'Rupees Three Lakh Twenty Seven Thousand Nine Hundred Fourteen Only',
        paymentMode: 'NEFT / RTGS',
        paymentReference: 'HDFCR520260824987',
        template: input.template,
        accentColor: input.accentColor,
      });

      return { html: sampleHtml };
    }),

  nextInvoiceNumber: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await ctx.db.select().from(businessProfile).limit(1);
    const format = profile?.invoiceNumberFormat ?? 'INV-{YY}-{SEQ}';
    const seed = (profile?.invoiceNumberSeed ?? 0) + 1;
    const yy = new Date().getFullYear().toString().slice(-2);
    const yyyy = new Date().getFullYear().toString();
    const seq = String(seed).padStart(4, '0');
    const number = format
      .replace('{SEQ}', seq)
      .replace('{YY}', yy)
      .replace('{YYYY}', yyyy);
    return { number, seed };
  }),
});
