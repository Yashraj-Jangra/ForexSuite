import 'dotenv/config';
import { Queue, Worker } from 'bullmq';
import { loadEnv } from '@vaultbill/config';
import { sendNotification } from './jobs/processors';
import type { NotificationPayload } from './jobs/processors';

const env = loadEnv();
const connection = { url: env.REDIS_URL };

const worker = new Worker<NotificationPayload>(
  'notifications',
  async (job) => {
    console.log(`Processing ${job.data.type} via ${job.data.channel}`);
    const result = await sendNotification(job.data);
    console.log(`Done: ${JSON.stringify(result)}`);
  },
  { connection },
);

const closeGracefully = async (signal: string) => {
  console.log(`Received ${signal}, shutting down worker gracefully`);
  await worker.close();
  process.exit(0);
};
process.on('SIGTERM', () => closeGracefully('SIGTERM'));
process.on('SIGINT', () => closeGracefully('SIGINT'));

console.log('Worker started — listening for notifications');