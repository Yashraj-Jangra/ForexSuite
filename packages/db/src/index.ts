import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { loadEnv } from '@vaultbill/config';

const env = loadEnv();

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool);

export * from './schemas/public';
export * from './schemas/tenant';