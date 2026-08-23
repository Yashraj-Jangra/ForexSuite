import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@vaultbill/db';
import * as authSchema from '@vaultbill/db/schemas/auth';
import { loadEnv } from '@vaultbill/config';

const env = loadEnv();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: authSchema.user,
      session: authSchema.session,
      account: authSchema.account,
      verification: authSchema.verification,
    },
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000', env.BETTER_AUTH_URL],
  baseURL: `http://localhost:${env.API_PORT}`,
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
});