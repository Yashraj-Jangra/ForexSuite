import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { vendors } from '@vaultbill/db/schemas/tenant';
import { db } from '@vaultbill/db';
import { eq } from 'drizzle-orm';

export const vendorRouter = router({
  list: protectedProcedure.query(() =>
    db.select().from(vendors).orderBy(vendors.createdAt),
  ),

  get: protectedProcedure.input(z.string().uuid()).query(({ input }) =>
    db.select().from(vendors).where(eq(vendors.id, input)).limit(1).then((r) => r[0] ?? null),
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
      bankName: z.string().optional(),
      bankAccountNumber: z.string().optional(),
      bankIfsc: z.string().optional(),
      bankSwift: z.string().optional(),
      bankAddress: z.string().optional(),
    }))
    .mutation(({ input }) =>
      db.insert(vendors).values(input).returning().then((r) => r[0]),
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
        bankName: z.string().optional(),
        bankAccountNumber: z.string().optional(),
        bankIfsc: z.string().optional(),
        bankSwift: z.string().optional(),
        bankAddress: z.string().optional(),
      }),
    }))
    .mutation(({ input }) =>
      db.update(vendors).set(input.data).where(eq(vendors.id, input.id)).returning().then((r) => r[0]),
    ),

  delete: protectedProcedure.input(z.string().uuid()).mutation(({ input }) =>
    db.delete(vendors).where(eq(vendors.id, input)),
  ),
});