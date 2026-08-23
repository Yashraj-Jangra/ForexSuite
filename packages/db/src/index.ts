import { drizzle } from 'drizzle-orm/node-postgres';
import { pool } from './pool';

export const db = drizzle(pool);

export * from './schemas/public';
export * from './schemas/tenant';
export * from './tenant-db';