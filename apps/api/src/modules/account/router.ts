import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc/context';
import { user, session } from '@vaultbill/db/schemas/auth';
import { tenantMembers } from '@vaultbill/db/schemas/public';
import { eq, desc, and } from 'drizzle-orm';

export const accountRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [foundUser] = await ctx.publicDb
      .select()
      .from(user)
      .where(eq(user.id, ctx.userId))
      .limit(1);

    if (!foundUser) throw new Error('User not found');

    // Get current tenant membership details
    let currentRole = 'member';
    let joinedAt = foundUser.createdAt;

    if (ctx.tenantId) {
      const [membership] = await ctx.publicDb
        .select()
        .from(tenantMembers)
        .where(
          and(
            eq(tenantMembers.userId, ctx.userId),
            eq(tenantMembers.tenantId, ctx.tenantId),
          ),
        )
        .limit(1);

      if (membership) {
        currentRole = membership.role;
        joinedAt = membership.joinedAt;
      }
    }

    // Get most recent session info
    const [latestSession] = await ctx.publicDb
      .select()
      .from(session)
      .where(eq(session.userId, ctx.userId))
      .orderBy(desc(session.updatedAt))
      .limit(1);

    return {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      phone: foundUser.phone ?? null,
      designation: foundUser.designation ?? null,
      image: foundUser.image ?? null,
      isSuperAdmin: foundUser.isSuperAdmin,
      role: currentRole,
      joinedAt: joinedAt?.toISOString() ?? new Date().toISOString(),
      createdAt: foundUser.createdAt.toISOString(),
      lastAccessedAt: (latestSession?.updatedAt ?? foundUser.updatedAt).toISOString(),
      lastIpAddress: latestSession?.ipAddress ?? null,
      lastUserAgent: latestSession?.userAgent ?? null,
    };
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required'),
        phone: z.string().optional(),
        designation: z.string().optional(),
        image: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.publicDb
        .update(user)
        .set({
          name: input.name,
          phone: input.phone || null,
          designation: input.designation || null,
          image: input.image || null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, ctx.userId))
        .returning();

      return updated;
    }),

  sessions: protectedProcedure.query(async ({ ctx }) => {
    const activeSessions = await ctx.publicDb
      .select()
      .from(session)
      .where(eq(session.userId, ctx.userId))
      .orderBy(desc(session.updatedAt))
      .limit(20);

    return activeSessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      expiresAt: s.expiresAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }),

  revokeSession: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.publicDb
        .delete(session)
        .where(
          and(
            eq(session.id, input),
            eq(session.userId, ctx.userId),
          ),
        );
      return { revoked: true };
    }),
});
