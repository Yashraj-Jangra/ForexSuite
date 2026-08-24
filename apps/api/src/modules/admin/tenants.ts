import { z } from 'zod';
import { router, superAdminProcedure } from '../../trpc/context';
import { tenants, tenantMembers } from '@vaultbill/db/schemas/public';
import { user } from '@vaultbill/db/schemas/auth';
import { businessProfile, invoices, fircs, edfRecords, customers } from '@vaultbill/db/schemas/tenant';
import { getTenantDb } from '@vaultbill/db';
import { eq, desc, and, like, or, sql, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const adminTenantsRouter = router({
  list: superAdminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(['all', 'active', 'suspended', 'deleted']).default('all'),
        plan: z.enum(['all', 'free', 'starter', 'pro', 'enterprise']).default('all'),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const search = input?.search?.trim();
      const status = input?.status ?? 'all';
      const plan = input?.plan ?? 'all';
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      const conditions: any[] = [];

      if (search) {
        conditions.push(
          or(
            like(sql`LOWER(${tenants.name})`, `%${search.toLowerCase()}%`),
            like(sql`LOWER(${tenants.slug})`, `%${search.toLowerCase()}%`),
          ),
        );
      }

      if (status !== 'all') {
        conditions.push(eq(tenants.status, status));
      }

      if (plan !== 'all') {
        conditions.push(eq(tenants.plan, plan));
      }

      const rows = await ctx.publicDb
        .select({
          id: tenants.id,
          name: tenants.name,
          slug: tenants.slug,
          status: tenants.status,
          plan: tenants.plan,
          planExpiresAt: tenants.planExpiresAt,
          notes: tenants.notes,
          suspendedAt: tenants.suspendedAt,
          suspendedReason: tenants.suspendedReason,
          deletedAt: tenants.deletedAt,
          customDomain: tenants.customDomain,
          createdAt: tenants.createdAt,
          updatedAt: tenants.updatedAt,
        })
        .from(tenants)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(tenants.createdAt))
        .limit(limit)
        .offset(offset);

      // Fetch member counts for each tenant
      const result = await Promise.all(
        rows.map(async (t: typeof rows[number]) => {
          const [memberCountRes] = await ctx.publicDb
            .select({ count: count() })
            .from(tenantMembers)
            .where(eq(tenantMembers.tenantId, t.id));

          return {
            ...t,
            memberCount: memberCountRes?.count ?? 0,
          };
        }),
      );

      const [totalCountRes] = await ctx.publicDb
        .select({ count: count() })
        .from(tenants)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        tenants: result,
        total: totalCountRes?.count ?? 0,
      };
    }),

  get: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [tenant] = await ctx.publicDb
        .select()
        .from(tenants)
        .where(eq(tenants.id, input.id))
        .limit(1);

      if (!tenant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
      }

      // Fetch all members with user details
      const members = await ctx.publicDb
        .select({
          id: tenantMembers.id,
          role: tenantMembers.role,
          joinedAt: tenantMembers.joinedAt,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          isSuperAdmin: user.isSuperAdmin,
          banned: user.banned,
        })
        .from(tenantMembers)
        .innerJoin(user, eq(tenantMembers.userId, user.id))
        .where(eq(tenantMembers.tenantId, tenant.id));

      // Attempt to load live statistics from tenant schema
      let tenantStats = {
        invoicesCount: 0,
        customersCount: 0,
        fircsCount: 0,
        edfCount: 0,
        businessProfile: null as any,
      };

      try {
        const tenantDb = getTenantDb(tenant.id);
        const [invCount] = await tenantDb.select({ count: count() }).from(invoices);
        const [custCount] = await tenantDb.select({ count: count() }).from(customers);
        const [fircCount] = await tenantDb.select({ count: count() }).from(fircs);
        const [edfCount] = await tenantDb.select({ count: count() }).from(edfRecords);
        const [biz] = await tenantDb.select().from(businessProfile).limit(1);

        tenantStats = {
          invoicesCount: invCount?.count ?? 0,
          customersCount: custCount?.count ?? 0,
          fircsCount: fircCount?.count ?? 0,
          edfCount: edfCount?.count ?? 0,
          businessProfile: biz ?? null,
        };
      } catch (err) {
        console.warn(`Could not read tenant schema for ${tenant.id}:`, err);
      }

      return {
        tenant,
        members,
        stats: tenantStats,
      };
    }),

  suspend: superAdminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().min(1, 'Suspension reason is required'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.publicDb
        .update(tenants)
        .set({
          status: 'suspended',
          suspendedAt: new Date(),
          suspendedReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
      }

      await ctx.logAdminAction('tenant.suspend', 'tenant', input.id, {
        tenantName: updated.name,
        reason: input.reason,
      });

      return updated;
    }),

  activate: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.publicDb
        .update(tenants)
        .set({
          status: 'active',
          suspendedAt: null,
          suspendedReason: null,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
      }

      await ctx.logAdminAction('tenant.activate', 'tenant', input.id, {
        tenantName: updated.name,
      });

      return updated;
    }),

  setPlan: superAdminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        plan: z.enum(['free', 'starter', 'pro', 'enterprise']),
        expiresAt: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.publicDb
        .update(tenants)
        .set({
          plan: input.plan,
          planExpiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
      }

      await ctx.logAdminAction('tenant.setPlan', 'tenant', input.id, {
        tenantName: updated.name,
        plan: input.plan,
        expiresAt: input.expiresAt,
      });

      return updated;
    }),

  addNote: superAdminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        note: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.publicDb
        .update(tenants)
        .set({
          notes: input.note,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
      }

      await ctx.logAdminAction('tenant.addNote', 'tenant', input.id, {
        tenantName: updated.name,
      });

      return updated;
    }),

  delete: superAdminProcedure
    .input(z.object({ id: z.string().uuid(), permanent: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const [tenant] = await ctx.publicDb
        .select()
        .from(tenants)
        .where(eq(tenants.id, input.id))
        .limit(1);

      if (!tenant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
      }

      if (input.permanent) {
        await ctx.publicDb.delete(tenants).where(eq(tenants.id, input.id));
        await ctx.logAdminAction('tenant.hard_delete', 'tenant', input.id, {
          tenantName: tenant.name,
          slug: tenant.slug,
        });
      } else {
        await ctx.publicDb
          .update(tenants)
          .set({ status: 'deleted', deletedAt: new Date(), updatedAt: new Date() })
          .where(eq(tenants.id, input.id));
        await ctx.logAdminAction('tenant.soft_delete', 'tenant', input.id, {
          tenantName: tenant.name,
          slug: tenant.slug,
        });
      }

      return { success: true };
    }),

  peekRecords: superAdminProcedure
    .input(
      z.object({
        tenantId: z.string().uuid(),
        recordType: z.enum(['invoices', 'customers', 'fircs', 'edf', 'profile']),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ input }) => {
      const tenantDb = getTenantDb(input.tenantId);

      switch (input.recordType) {
        case 'invoices':
          return tenantDb.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(input.limit);
        case 'customers':
          return tenantDb.select().from(customers).orderBy(desc(customers.createdAt)).limit(input.limit);
        case 'fircs':
          return tenantDb.select().from(fircs).orderBy(desc(fircs.createdAt)).limit(input.limit);
        case 'edf':
          return tenantDb.select().from(edfRecords).orderBy(desc(edfRecords.createdAt)).limit(input.limit);
        case 'profile':
          return tenantDb.select().from(businessProfile).limit(1);
        default:
          return [];
      }
    }),
});
