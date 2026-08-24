import { tenantMembers, tenants } from '@vaultbill/db/schemas/public';
import { user } from '@vaultbill/db/schemas/auth';
import { provisionTenantSchema } from '@vaultbill/db/provision';
import { db } from '@vaultbill/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './context';
import { customerRouter } from '../modules/customers/router';
import { vendorRouter } from '../modules/vendors/router';
import { currencyRouter } from '../modules/currencies/router';
import { invoiceRouter } from '../modules/invoices/router';
import { pdfRouter } from '../modules/invoices/pdf';
import { rateRouter } from '../modules/rates/router';
import { lutRouter } from '../modules/luts/router';
import { taxRouter } from '../modules/tax/router';
import { fircRouter } from '../modules/fircs/router';
import { femaRouter } from '../modules/fema/router';
import { remittanceRouter } from '../modules/remittances/router';
import { forexRouter } from '../modules/forex/router';
import { notificationRouter } from '../modules/notifications/router';
import { settingsRouter } from '../modules/settings/router';
import { businessProfileRouter } from '../modules/business-profile/router';
import { edfRouter } from '../modules/edf/router';
import { emailRouter } from '../modules/email/router';
import { backupRouter } from '../modules/backups/router';
import { adminRouter } from '../modules/admin/router';

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),

  me: protectedProcedure.query(async ({ ctx }) => {
    const [found] = await db.select().from(user).where(eq(user.id, ctx.userId)).limit(1);
    return found ?? null;
  }),

  tenants: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(tenantMembers)
      .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
      .where(eq(tenantMembers.userId, ctx.userId));
  }),

  createTenant: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100), slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Unauthorized');

      const result = await db.transaction(async (tx) => {
        const [tenant] = await tx
          .insert(tenants)
          .values({ name: input.name, slug: input.slug })
          .returning();

        if (!tenant) throw new Error('Failed to create tenant');

        await tx
          .insert(tenantMembers)
          .values({ tenantId: tenant.id, userId: ctx.userId, role: 'admin' });

        return tenant;
      });

      await provisionTenantSchema(result.id);

      return result;
    }),

  customers: customerRouter,
  vendors: vendorRouter,
  currencies: currencyRouter,
  invoices: invoiceRouter,
  pdf: pdfRouter,
  rates: rateRouter,
  luts: lutRouter,
  tax: taxRouter,
  fircs: fircRouter,
  fema: femaRouter,
  remittances: remittanceRouter,
  forex: forexRouter,
  notifications: notificationRouter,
  settings: settingsRouter,
  businessProfile: businessProfileRouter,
  edf: edfRouter,
  email: emailRouter,
  backups: backupRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;