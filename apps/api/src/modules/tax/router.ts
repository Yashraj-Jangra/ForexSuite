import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { validateGstin, calculateGst, searchHsn, getHsnRate, getGstStateCode } from '@vaultbill/shared';

export const taxRouter = router({
  validateGstin: protectedProcedure.input(z.string()).query(({ input }) => validateGstin(input)),

  calculate: protectedProcedure
    .input(z.object({
      amount: z.number().positive(),
      rate: z.number().min(0).max(28),
      fromGstin: z.string(),
      toGstin: z.string(),
      isExport: z.boolean().default(false),
    }))
    .query(({ input }) => {
      const fromCode = getGstStateCode(input.fromGstin);
      const toCode = getGstStateCode(input.toGstin);
      if (!fromCode || !toCode) throw new Error('Invalid GSTIN');
      return calculateGst(input.amount, input.rate, fromCode, toCode, input.isExport);
    }),

  searchHsn: protectedProcedure.input(z.string()).query(({ input }) => searchHsn(input)),

  hsnRate: protectedProcedure.input(z.string()).query(({ input }) => ({ rate: getHsnRate(input) })),
});