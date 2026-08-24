import { z } from 'zod';
import { router, superAdminProcedure } from '../../trpc/context';
import { platformAuditLog } from '@vaultbill/db/schemas/public';
import { desc, and, eq, like, sql, count } from 'drizzle-orm';

export const adminAuditRouter = router({
  list: superAdminProcedure
    .input(
      z.object({
        action: z.string().optional(),
        targetType: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;
      const conditions: any[] = [];

      if (input?.action && input.action !== 'all') {
        conditions.push(eq(platformAuditLog.action, input.action));
      }

      if (input?.targetType && input.targetType !== 'all') {
        conditions.push(eq(platformAuditLog.targetType, input.targetType));
      }

      if (input?.search) {
        conditions.push(
          sql`(LOWER(${platformAuditLog.action}) LIKE ${`%${input.search.toLowerCase()}%`} OR LOWER(${platformAuditLog.adminEmail}) LIKE ${`%${input.search.toLowerCase()}%`} OR ${platformAuditLog.targetId} LIKE ${`%${input.search}%`})`,
        );
      }

      const rows = await ctx.publicDb
        .select()
        .from(platformAuditLog)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(platformAuditLog.createdAt))
        .limit(limit)
        .offset(offset);

      const [totalRes] = await ctx.publicDb
        .select({ count: count() })
        .from(platformAuditLog)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        logs: rows,
        total: totalRes?.count ?? 0,
      };
    }),
});
