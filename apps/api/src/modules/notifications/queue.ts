import { Queue } from 'bullmq';
import { loadEnv } from '@vaultbill/config';

const env = loadEnv();
const connection = { url: env.REDIS_URL };

export const notificationQueue = new Queue('notifications', { connection });

export async function sendNotification(type: string, payload: Record<string, unknown>) {
  await notificationQueue.add(type, payload);
  return { queued: true };
}