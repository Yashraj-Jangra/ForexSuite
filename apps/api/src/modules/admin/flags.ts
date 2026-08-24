import { z } from 'zod';
import { router, superAdminProcedure, publicProcedure } from '../../trpc/context';
import { featureFlags } from '@vaultbill/db/schemas/public';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const DEFAULT_FLAGS = [
  {
    key: 'edf_module',
    name: 'EDF / SOFTEX Compliance Module',
    description: 'Export Declaration Form wizard for Oct 1, 2026 FEMA compliance deadline',
    category: 'release',
    enabled: true,
    isKillSwitch: false,
  },
  {
    key: 'outbound_email_delivery',
    name: 'Outbound Email Delivery Service',
    description: 'Emergency kill switch for all outbound platform email traffic',
    category: 'kill_switch',
    enabled: true,
    isKillSwitch: true,
  },
  {
    key: 'automated_backups',
    name: 'Automated 4h Scheduled Backups',
    description: 'Master toggle for pg_dump and S3/GDrive backup workers',
    category: 'kill_switch',
    enabled: true,
    isKillSwitch: true,
  },
  {
    key: 'flm_register_suite',
    name: 'FLM-1 to FLM-8 FFMC Registers',
    description: 'RBI daily registers and monthly statutory return generators',
    category: 'release',
    enabled: true,
    isKillSwitch: false,
  },
  {
    key: 'team_multi_user_rbac',
    name: 'Team Invites & RBAC Matrix',
    description: 'Multi-user role access controls per tenant workspace',
    category: 'release',
    enabled: true,
    isKillSwitch: false,
  },
  {
    key: 'tcs_lrs_engine',
    name: 'TCS Progressive Tax Calculator',
    description: 'Cumulative PAN-based LRS tracking with 20% bracket thresholding',
    category: 'release',
    enabled: true,
    isKillSwitch: false,
  },
  {
    key: 'firc_edpms_reconciliation',
    name: 'e-FIRC & EDPMS Reconciliation',
    description: 'Short-realization flagging and AD bank matching wizard',
    category: 'release',
    enabled: true,
    isKillSwitch: false,
  },
];

export const adminFlagsRouter = router({
  list: superAdminProcedure.query(async ({ ctx }) => {
    let rows = await ctx.publicDb
      .select()
      .from(featureFlags)
      .orderBy(desc(featureFlags.isKillSwitch), desc(featureFlags.createdAt));

    // Seed defaults if empty
    if (rows.length === 0) {
      for (const f of DEFAULT_FLAGS) {
        await ctx.publicDb.insert(featureFlags).values(f);
      }
      rows = await ctx.publicDb.select().from(featureFlags).orderBy(desc(featureFlags.isKillSwitch));
    }

    return rows;
  }),

  // Public endpoint for checking flags in user-facing client or tenant middleware
  check: publicProcedure
    .input(z.object({ key: z.string(), tenantId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const [flag] = await ctx.publicDb
        .select()
        .from(featureFlags)
        .where(eq(featureFlags.key, input.key))
        .limit(1);

      if (!flag) return { enabled: true }; // default permissive

      if (input.tenantId) {
        const enabledTenants = (flag.enabledTenants as string[]) || [];
        const disabledTenants = (flag.disabledTenants as string[]) || [];

        if (disabledTenants.includes(input.tenantId)) return { enabled: false };
        if (enabledTenants.includes(input.tenantId)) return { enabled: true };
      }

      return { enabled: flag.enabled };
    }),

  toggle: superAdminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.publicDb
        .update(featureFlags)
        .set({
          enabled: input.enabled,
          updatedBy: ctx.userEmail ?? ctx.userId,
          updatedAt: new Date(),
        })
        .where(eq(featureFlags.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Feature flag not found' });
      }

      await ctx.logAdminAction('feature_flag.toggle', 'flag', input.id, {
        key: updated.key,
        enabled: input.enabled,
        isKillSwitch: updated.isKillSwitch,
      });

      return updated;
    }),

  toggleTenantOverride: superAdminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        tenantId: z.string().uuid(),
        override: z.enum(['enable', 'disable', 'reset']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [flag] = await ctx.publicDb
        .select()
        .from(featureFlags)
        .where(eq(featureFlags.id, input.id))
        .limit(1);

      if (!flag) throw new TRPCError({ code: 'NOT_FOUND', message: 'Flag not found' });

      let enabledList = ((flag.enabledTenants as string[]) || []).filter((id) => id !== input.tenantId);
      let disabledList = ((flag.disabledTenants as string[]) || []).filter((id) => id !== input.tenantId);

      if (input.override === 'enable') {
        enabledList.push(input.tenantId);
      } else if (input.override === 'disable') {
        disabledList.push(input.tenantId);
      }

      const [updated] = await ctx.publicDb
        .update(featureFlags)
        .set({
          enabledTenants: enabledList,
          disabledTenants: disabledList,
          updatedBy: ctx.userEmail ?? ctx.userId,
          updatedAt: new Date(),
        })
        .where(eq(featureFlags.id, input.id))
        .returning();

      await ctx.logAdminAction('feature_flag.tenant_override', 'flag', input.id, {
        key: flag.key,
        tenantId: input.tenantId,
        override: input.override,
      });

      return updated;
    }),

  create: superAdminProcedure
    .input(
      z.object({
        key: z.string().min(2).regex(/^[a-z0-9_]+$/, 'Key must be lowercase snake_case'),
        name: z.string().min(2),
        description: z.string().optional(),
        category: z.enum(['release', 'kill_switch', 'entitlement', 'experiment']).default('release'),
        enabled: z.boolean().default(true),
        isKillSwitch: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.publicDb
        .insert(featureFlags)
        .values({
          ...input,
          updatedBy: ctx.userEmail ?? ctx.userId,
        })
        .returning();

      if (created) {
        await ctx.logAdminAction('feature_flag.create', 'flag', created.id, {
          key: input.key,
          name: input.name,
        });
      }

      return created;
    }),

  delete: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.publicDb
        .delete(featureFlags)
        .where(eq(featureFlags.id, input.id))
        .returning();

      if (deleted) {
        await ctx.logAdminAction('feature_flag.delete', 'flag', input.id, {
          key: deleted.key,
        });
      }

      return { success: true };
    }),
});
