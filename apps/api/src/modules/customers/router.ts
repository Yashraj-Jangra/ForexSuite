import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { customers } from '@vaultbill/db/schemas/tenant';
import { eq } from 'drizzle-orm';

export const customerRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.select().from(customers).orderBy(customers.createdAt),
  ),

  get: protectedProcedure.input(z.string().uuid()).query(({ ctx, input }) =>
    ctx.db.select().from(customers).where(eq(customers.id, input)).limit(1).then((r) => r[0] ?? null),
  ),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().min(2),
      pincode: z.string().optional(),
      gstin: z.string().optional(),
      pan: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(customers).values(input).returning().then((r) => r[0]),
    ),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().min(2).optional(),
        pincode: z.string().optional(),
        gstin: z.string().optional(),
        pan: z.string().optional(),
      }),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(customers).set(input.data).where(eq(customers.id, input.id)).returning().then((r) => r[0]),
    ),

  delete: protectedProcedure.input(z.string().uuid()).mutation(({ ctx, input }) =>
    ctx.db.delete(customers).where(eq(customers.id, input)),
  ),
});
