import { z } from 'zod';
import { router, superAdminProcedure } from '../../trpc/context';
import { user, session } from '@vaultbill/db/schemas/auth';
import { tenantMembers, tenants } from '@vaultbill/db/schemas/public';
import { eq, desc, and, like, or, sql, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const adminUsersRouter = router({
  list: superAdminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        filter: z.enum(['all', 'super_admins', 'banned', 'active']).default('all'),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const search = input?.search?.trim();
      const filter = input?.filter ?? 'all';
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      const conditions: any[] = [];

      if (search) {
        conditions.push(
          or(
            like(sql`LOWER(${user.name})`, `%${search.toLowerCase()}%`),
            like(sql`LOWER(${user.email})`, `%${search.toLowerCase()}%`),
          ),
        );
      }

      if (filter === 'super_admins') {
        conditions.push(eq(user.isSuperAdmin, true));
      } else if (filter === 'banned') {
        conditions.push(eq(user.banned, true));
      } else if (filter === 'active') {
        conditions.push(eq(user.banned, false));
      }

      const rows = await ctx.publicDb
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          isSuperAdmin: user.isSuperAdmin,
          banned: user.banned,
          bannedAt: user.bannedAt,
          bannedReason: user.bannedReason,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset);

      // Fetch tenants and active session count for each user
      const enrichedUsers = await Promise.all(
        rows.map(async (u: typeof rows[number]) => {
          const userTenants = await ctx.publicDb
            .select({
              tenantId: tenants.id,
              tenantName: tenants.name,
              tenantSlug: tenants.slug,
              role: tenantMembers.role,
            })
            .from(tenantMembers)
            .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
            .where(eq(tenantMembers.userId, u.id));

          const [activeSessions] = await ctx.publicDb
            .select({ count: count() })
            .from(session)
            .where(and(eq(session.userId, u.id), sql`${session.expiresAt} > NOW()`));

          return {
            ...u,
            tenants: userTenants,
            activeSessionCount: activeSessions?.count ?? 0,
          };
        }),
      );

      const [totalRes] = await ctx.publicDb
        .select({ count: count() })
        .from(user)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        users: enrichedUsers,
        total: totalRes?.count ?? 0,
      };
    }),

  get: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [foundUser] = await ctx.publicDb
        .select()
        .from(user)
        .where(eq(user.id, input.id))
        .limit(1);

      if (!foundUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const userTenants = await ctx.publicDb
        .select({
          tenantId: tenants.id,
          tenantName: tenants.name,
          tenantSlug: tenants.slug,
          tenantStatus: tenants.status,
          role: tenantMembers.role,
          joinedAt: tenantMembers.joinedAt,
        })
        .from(tenantMembers)
        .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
        .where(eq(tenantMembers.userId, foundUser.id));

      const sessions = await ctx.publicDb
        .select()
        .from(session)
        .where(eq(session.userId, foundUser.id))
        .orderBy(desc(session.createdAt))
        .limit(10);

      return {
        user: foundUser,
        tenants: userTenants,
        sessions,
      };
    }),

  ban: superAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().min(1, 'Ban reason is required'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot ban your own super admin account' });
      }

      const [updated] = await ctx.publicDb
        .update(user)
        .set({
          banned: true,
          bannedAt: new Date(),
          bannedReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(user.id, input.userId))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Also terminate all active sessions
      await ctx.publicDb.delete(session).where(eq(session.userId, input.userId));

      await ctx.logAdminAction('user.ban', 'user', input.userId, {
        userName: updated.name,
        userEmail: updated.email,
        reason: input.reason,
      });

      return updated;
    }),

  unban: superAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.publicDb
        .update(user)
        .set({
          banned: false,
          bannedAt: null,
          bannedReason: null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, input.userId))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      await ctx.logAdminAction('user.unban', 'user', input.userId, {
        userName: updated.name,
        userEmail: updated.email,
      });

      return updated;
    }),

  forceLogout: superAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.publicDb.delete(session).where(eq(session.userId, input.userId));

      await ctx.logAdminAction('user.force_logout', 'user', input.userId, {
        terminatedSessions: result.rowCount ?? 0,
      });

      return { success: true, terminatedCount: result.rowCount ?? 0 };
    }),

  toggleAdminRole: superAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        isSuperAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId && !input.isSuperAdmin) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot revoke your own super admin rights' });
      }

      const [updated] = await ctx.publicDb
        .update(user)
        .set({
          isSuperAdmin: input.isSuperAdmin,
          updatedAt: new Date(),
        })
        .where(eq(user.id, input.userId))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      await ctx.logAdminAction('user.toggle_super_admin', 'user', input.userId, {
        targetEmail: updated.email,
        isSuperAdmin: input.isSuperAdmin,
      });

      return updated;
    }),
});
