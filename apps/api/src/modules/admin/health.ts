import { router, superAdminProcedure } from '../../trpc/context';
import { tenants, tenantMembers, platformAuditLog, platformBackups, platformSmtp } from '@vaultbill/db/schemas/public';
import { user } from '@vaultbill/db/schemas/auth';
import { sql, count, desc, gte } from 'drizzle-orm';

export const adminHealthRouter = router({
  overview: superAdminProcedure.query(async ({ ctx }) => {
    const dbPingStart = Date.now();
    await ctx.publicDb.execute(sql`SELECT 1`);
    const dbLatencyMs = Date.now() - dbPingStart;

    const [totalTenantsRes] = await ctx.publicDb.select({ count: count() }).from(tenants);
    const [activeTenantsRes] = await ctx.publicDb
      .select({ count: count() })
      .from(tenants)
      .where(sql`${tenants.status} = 'active'`);
    const [totalUsersRes] = await ctx.publicDb.select({ count: count() }).from(user);
    const [totalAuditsRes] = await ctx.publicDb.select({ count: count() }).from(platformAuditLog);

    const [smtp] = await ctx.publicDb.select().from(platformSmtp).limit(1);
    const [backup] = await ctx.publicDb.select().from(platformBackups).limit(1);

    const mem = process.memoryUsage();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      db: {
        status: 'connected',
        latencyMs: dbLatencyMs,
      },
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      metrics: {
        totalTenants: totalTenantsRes?.count ?? 0,
        activeTenants: activeTenantsRes?.count ?? 0,
        totalUsers: totalUsersRes?.count ?? 0,
        totalAdminAudits: totalAuditsRes?.count ?? 0,
      },
      services: {
        smtp: {
          configured: !!smtp,
          lastStatus: smtp?.lastTestStatus ?? 'untested',
          lastTestAt: smtp?.lastTestAt ?? null,
        },
        backups: {
          configured: !!backup,
          lastStatus: backup?.lastBackupStatus ?? 'untested',
          lastBackupAt: backup?.lastBackupAt ?? null,
        },
      },
    };
  }),

  recentAudits: superAdminProcedure.query(async ({ ctx }) => {
    return ctx.publicDb
      .select()
      .from(platformAuditLog)
      .orderBy(desc(platformAuditLog.createdAt))
      .limit(20);
  }),
});
