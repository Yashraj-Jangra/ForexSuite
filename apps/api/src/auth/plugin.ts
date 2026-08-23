import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './config';

export async function registerAuthPlugin(fastify: FastifyInstance) {
  const authHandler = toNodeHandler(auth);

  fastify.all('/api/auth/*', async (request: FastifyRequest, reply: FastifyReply) => {
    await authHandler(request.raw, reply.raw);
  });

  fastify.all('/api/auth', async (request: FastifyRequest, reply: FastifyReply) => {
    await authHandler(request.raw, reply.raw);
  });

  fastify.log.info('Auth plugin registered at /api/auth');
}