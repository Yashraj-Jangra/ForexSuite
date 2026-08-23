import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { lutRegistrations } from '@vaultbill/db/schemas/tenant';
import { db } from '@vaultbill/db';
import { eq, and, gt } from 'drizzle-orm';

export const lutRouter = router({
  list: protectedProcedure.query(() =>
    db.select().from(lutRegistrations).orderBy(lutRegistrations.issuedDate),
  ),

  active: protectedProcedure.query(() => {
    const today = new Date().toISOString().split('T')[0] ?? '';
    return db
      .select()
      .from(lutRegistrations)
      .where(and(eq(lutRegistrations.isActive, true), gt(lutRegistrations.expiryDate, today)));
  }),

  create: protectedProcedure
    .input(z.object({
      referenceNumber: z.string().min(1),
      issuedDate: z.string(),
      expiryDate: z.string(),
      issuingAuthority: z.string().min(1),
    }))
    .mutation(({ input }) =>
      db.insert(lutRegistrations).values(input).returning().then((r) => r[0]),
    ),

  deactivate: protectedProcedure.input(z.string().uuid()).mutation(({ input }) =>
    db.update(lutRegistrations).set({ isActive: false }).where(eq(lutRegistrations.id, input)).returning().then((r) => r[0]),
  ),
});