import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { loadEnv } from '@vaultbill/config';
import { registerAuthPlugin } from './auth/plugin';
import { registerTrpcPlugin } from './trpc/plugin';

const env = loadEnv();

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(helmet, { contentSecurityPolicy: false });

  await app.register(registerAuthPlugin);
  await app.register(registerTrpcPlugin);

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  const closeGracefully = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => closeGracefully('SIGTERM'));
  process.on('SIGINT', () => closeGracefully('SIGINT'));

  try {
    await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();