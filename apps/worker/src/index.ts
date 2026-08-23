import 'dotenv/config';
import { Queue, Worker } from 'bullmq';
import { loadEnv } from '@vaultbill/config';
import { sendNotification } from './jobs/processors';
import type { NotificationPayload } from './jobs/processors';

const env = loadEnv();
const connection = { url: env.REDIS_URL };

new Worker<NotificationPayload>(
  'notifications',
  async (job) => {
    console.log(`Processing ${job.data.type} via ${job.data.channel}`);
    const result = await sendNotification(job.data);
    console.log(`Done: ${JSON.stringify(result)}`);
  },
  { connection },
);

console.log('Worker started — listening for notifications');