import type { FastifyRequest } from 'fastify';
import { initTRPC, type inferAsyncReturnType } from '@trpc/server';
import { getSessionFromCookie } from '../auth/session';

export async function createContext({ req }: { req: FastifyRequest }) {
  const session = await getSessionFromCookie(req.headers.cookie);
  return {
    session,
    userId: session?.userId ?? null,
    isAuthenticated: !!session,
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
  return next({ ctx: { ...ctx, userId: ctx.userId! } });
});