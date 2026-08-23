import { router, protectedProcedure } from '../../trpc/context';
import { invoices, customers } from '@vaultbill/db/schemas/tenant';
import { db } from '@vaultbill/db';
import { eq, and, lt, sql } from 'drizzle-orm';

export const femaRouter = router({
  alerts: protectedProcedure.query(async () => {
    const now = new Date();
    const warningDate = new Date(now.getTime() - 180 * 86400000).toISOString().split('T')[0];
    const criticalDate = new Date(now.getTime() - 240 * 86400000).toISOString().split('T')[0];

    const flagged = await db
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
      critical: alerts.filter((a) => a.status === 'critical'),
      warning: alerts.filter((a) => a.status === 'warning'),
      ok: alerts.filter((a) => a.status === 'ok'),
      total: alerts.length,
    };
  }),
});