import { db, invoices, customers } from '@vaultbill/db';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { FEMA_WARNING_DAYS, FEMA_CRITICAL_DAYS } from '@vaultbill/config';
import { Queue } from 'bullmq';
import { loadEnv } from '@vaultbill/config';

export async function checkFemaAlerts() {
  console.log('[fema-check] Checking unpaid export invoices...');

  const unpaidExports = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      dateOfExport: invoices.dateOfExport,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(
      and(
        eq(invoices.isExport, true),
        isNotNull(invoices.dateOfExport),
        sql`${invoices.status} NOT IN ('paid', 'cancelled')`,
      ),
    );

  const warning: typeof unpaidExports = [];
  const critical: typeof unpaidExports = [];

  for (const inv of unpaidExports) {
    if (!inv.dateOfExport) continue;
    const daysSince = Math.floor(
      (Date.now() - new Date(inv.dateOfExport).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSince >= FEMA_CRITICAL_DAYS) {
      critical.push(inv);
    } else if (daysSince >= FEMA_WARNING_DAYS) {
      warning.push(inv);
    }
  }

  console.log(`[fema-check] Warning: ${warning.length}, Critical: ${critical.length}`);

  const env = loadEnv();
  const queue = new Queue('notifications', { connection: { url: env.REDIS_URL } });

  for (const inv of critical) {
    const daysSince = Math.floor(
      (Date.now() - new Date(inv.dateOfExport!).getTime()) / (1000 * 60 * 60 * 24),
    );
    await queue.add('fema_alert', {
      type: 'fema_alert',
      to: inv.customerEmail ?? '',
      channel: 'email' as const,
      data: {
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName ?? 'Unknown',
        daysSince,
        status: 'critical',
        customerEmail: inv.customerEmail ?? undefined,
      },
    });
  }

  for (const inv of warning) {
    const daysSince = Math.floor(
      (Date.now() - new Date(inv.dateOfExport!).getTime()) / (1000 * 60 * 60 * 24),
    );
    await queue.add('fema_alert', {
      type: 'fema_alert',
      to: inv.customerEmail ?? '',
      channel: 'email' as const,
      data: {
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName ?? 'Unknown',
        daysSince,
        status: 'warning',
        customerEmail: inv.customerEmail ?? undefined,
      },
    });
  }

  await queue.close();
}