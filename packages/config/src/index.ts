import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

function initEnv() {
  let current = path.resolve(process.cwd());
  while (true) {
    const candidate = path.join(current, '.env');
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      break;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      dotenv.config();
      break;
    }
    current = parent;
  }
}

initEnv();

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  MINIO_ENDPOINT: z.string(),
  MINIO_PORT: z.coerce.number(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET: z.string(),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3001),
  WEB_PORT: z.coerce.number().default(3000),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  initEnv();
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten());
    process.exit(1);
  }
  return result.data;
}

export const TCS_THRESHOLD_INR = 700_000;
export const LRS_ANNUAL_LIMIT_USD = 250_000;
export const FEMA_REALIZATION_DAYS = 270;
export const FEMA_WARNING_DAYS = 180;
export const FEMA_CRITICAL_DAYS = 240;

export { seedPurposeCodes, getPurposeCode, searchPurposeCodes } from './purpose-codes';