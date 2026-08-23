import { router, protectedProcedure } from '../../trpc/context';
import { invoices, customers } from '@vaultbill/db/schemas/tenant';
import { eq, and, sql } from 'drizzle-orm';

export const femaRouter = router({
  alerts: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();

    const flagged = await ctx.db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(eq(invoices.isExport, true), sql`${invoices.dateOfExport} IS NOT NULL`))
      .orderBy(invoices.dateOfExport);

    const alerts = flagged
      .filter((r) => r.invoices.dateOfExport)
      .map((r) => {
        const exportDate = new Date(r.invoices.dateOfExport!);
        const daysSince = Math.floor((now.getTime() - exportDate.getTime()) / 86400000);
        const status = daysSince >= 240 ? 'critical' : daysSince >= 180 ? 'warning' : 'ok';
        return { ...r, daysSince, status };
      });

    return {
      critical: alerts.filter((a) => a.status === 'critical').slice(0, 100),
      warning: alerts.filter((a) => a.status === 'warning').slice(0, 100),
      ok: alerts.filter((a) => a.status === 'ok').slice(0, 100),
      total: alerts.length,
    };
  }),
});