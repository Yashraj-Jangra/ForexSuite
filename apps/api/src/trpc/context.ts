import type { FastifyRequest } from 'fastify';
import { initTRPC, type inferAsyncReturnType } from '@trpc/server';
import { getSessionFromCookie } from '../auth/session';
import { db, getTenantDb } from '@vaultbill/db';
import { tenantMembers, tenants } from '@vaultbill/db/schemas/public';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

type AnyDb = NodePgDatabase<any>;

export async function createContext({ req }: { req: FastifyRequest }) {
  const sessionData = await getSessionFromCookie(req.headers as Record<string, string | string[] | undefined>);

  let tenantId: string | null = null;
  if (sessionData?.user?.id) {
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

  return {
    session: sessionData?.session ?? null,
    user: sessionData?.user ?? null,
    userId: sessionData?.user?.id ?? null,
    isAuthenticated: !!sessionData,
    tenantId,
    db: (tenantId ? getTenantDb(tenantId) : db) as unknown as AnyDb,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isAuthenticated || !ctx.userId) {
    throw new Error('Unauthorized');
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});