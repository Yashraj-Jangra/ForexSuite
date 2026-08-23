import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { businessProfile } from '@vaultbill/db/schemas/tenant';
import { sql } from 'drizzle-orm';

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
