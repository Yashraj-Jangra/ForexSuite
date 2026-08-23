import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { auth } from './config';

export async function registerAuthPlugin(fastify: FastifyInstance) {
  const handler = async (request: FastifyRequest, reply: FastifyReply) => {
    const protocol = request.protocol || 'http';
    const host = request.headers.host || 'localhost:3001';
    const url = new URL(request.url, `${protocol}://${host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const v of value) {
            headers.append(key, v);
          }
        } else {
          headers.set(key, value);
        }
      }
    }

    const hasBody = !['GET', 'HEAD'].includes(request.method);
    const req = new Request(url.toString(), {
      method: request.method,
      headers,
      body: hasBody ? JSON.stringify(request.body) : undefined,
    });

    const res = await auth.handler(req);

    reply.status(res.status);
    res.headers.forEach((value, key) => {
      reply.header(key, value);
    });

    const body = await res.text();
    return reply.send(body);
  };

  fastify.all('/api/auth/*', handler);
  fastify.all('/api/auth', handler);

  fastify.log.info('Auth plugin registered at /api/auth');
}