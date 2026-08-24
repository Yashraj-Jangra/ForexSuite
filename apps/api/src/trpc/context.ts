import type { FastifyRequest } from 'fastify';
import { initTRPC, TRPCError, type inferAsyncReturnType } from '@trpc/server';
import { getSessionFromCookie } from '../auth/session';
import { db, getTenantDb } from '@vaultbill/db';
import { tenantMembers, tenants, platformAuditLog } from '@vaultbill/db/schemas/public';
import { user } from '@vaultbill/db/schemas/auth';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

type AnyDb = NodePgDatabase<any>;

export async function createContext({ req }: { req: FastifyRequest }) {
  const sessionData = await getSessionFromCookie(req.headers as Record<string, string | string[] | undefined>);

  let tenantId: string | null = null;
  let isSuperAdmin = false;
  let isBanned = false;
  let isImpersonating = false;
  let impersonatedTenantId: string | null = null;
  let currentUser = sessionData?.user ?? null;

  if (sessionData?.user?.id) {
    // Check user record for super admin and ban status
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, sessionData.user.id))
      .limit(1);

    if (dbUser) {
      currentUser = {
        ...sessionData.user,
        name: dbUser.name,
        email: dbUser.email,
      };

      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const superAdminIds = (process.env.SUPER_ADMIN_IDS ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      // User is super admin if DB flag is true OR email/id is in env list
      isSuperAdmin =
        Boolean(dbUser.isSuperAdmin) ||
        (dbUser.email ? superAdminEmails.includes(dbUser.email.toLowerCase()) : false) ||
        superAdminIds.includes(dbUser.id);

      isBanned = Boolean(dbUser.banned);
    }

    // Check for super admin impersonation header
    const impersonateHeader = req.headers['x-impersonate-tenant-id'];
    const targetTenantId = Array.isArray(impersonateHeader) ? impersonateHeader[0] : impersonateHeader;

    if (isSuperAdmin && targetTenantId) {
      // Validate target tenant exists
      const [targetTenant] = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.id, targetTenantId))
        .limit(1);

      if (targetTenant) {
        tenantId = targetTenant.id;
        isImpersonating = true;
        impersonatedTenantId = targetTenant.id;
      }
    }

    // Normal tenant resolution if not impersonating
    if (!tenantId) {
      const [membership] = await db
        .select({ tenantId: tenantMembers.tenantId })
        .from(tenantMembers)
        .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
        .where(eq(tenantMembers.userId, sessionData.user.id))
        .limit(1);
      if (membership) {
        tenantId = membership.tenantId;
      }
    }
  }

  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1';
  const userAgent = (req.headers['user-agent'] as string) || 'Unknown';

  return {
    req,
    session: sessionData?.session ?? null,
    user: currentUser,
    userId: sessionData?.user?.id ?? null,
    userEmail: currentUser?.email ?? null,
    userName: currentUser?.name ?? null,
    isAuthenticated: !!sessionData,
    isSuperAdmin,
    isBanned,
    isImpersonating,
    impersonatedTenantId,
    tenantId,
    db: (tenantId ? getTenantDb(tenantId) : db) as unknown as AnyDb,
    publicDb: db as unknown as AnyDb,
    clientIp,
    userAgent,
    logAdminAction: async (action: string, targetType: string, targetId?: string, payload?: any) => {
      try {
        await db.insert(platformAuditLog).values({
          adminUserId: sessionData?.user?.id ?? null,
          adminEmail: currentUser?.email ?? null,
          action,
          targetType,
          targetId: targetId ?? null,
          payload: payload ?? null,
          ipAddress: clientIp,
          userAgent,
        });
      } catch (err) {
        console.error('[PlatformAuditLog] Failed to log admin action:', err);
      }
    },
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isAuthenticated || !ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  if (ctx.isBanned) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Your account has been suspended by platform administration.' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const superAdminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isAuthenticated || !ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Super admin authentication required' });
  }
  if (!ctx.isSuperAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied: Super admin privileges required' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId, isSuperAdmin: true } });
});