import { tenantMembers, tenants, users } from '@vaultbill/db/schemas/public';
import { db } from '@vaultbill/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './context';

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.select().from(users).where(eq(users.id, ctx.userId)).limit(1);
    return user[0] ?? null;
  }),

  tenants: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(tenantMembers)
      .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
      .where(eq(tenantMembers.userId, ctx.userId));
  }),

  createTenant: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100), slug: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const [tenant] = await db
        .insert(tenants)
        .values({ name: input.name, slug: input.slug })
        .returning();

      if (!tenant) throw new Error('Failed to create tenant');

      await db
        .insert(tenantMembers)
        .values({ tenantId: tenant.id, userId: ctx.userId, role: 'admin' });

      return tenant;
    }),
});

export type AppRouter = typeof appRouter;