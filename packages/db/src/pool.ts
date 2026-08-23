import pg from 'pg';
import { loadEnv } from '@vaultbill/config';

const env = loadEnv();

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });