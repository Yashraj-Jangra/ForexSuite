import type { FastifyInstance } from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter, type AppRouter } from './router';
import { createContext } from './context';

export async function registerTrpcPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyTRPCPlugin<AppRouter>, {
    prefix: '/api/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  });

  fastify.log.info('tRPC plugin registered at /api/trpc');
}