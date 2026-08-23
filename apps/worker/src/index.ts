import 'dotenv/config';
import { Queue, Worker } from 'bullmq';
import { loadEnv } from '@vaultbill/config';

const env = loadEnv();

const connection = { url: env.REDIS_URL };

const _rateSyncQueue = new Queue('rate-sync', { connection });

const worker = new Worker(
  'rate-sync',
  async (job) => {
    console.log(`Processing job: ${job.id}`);
  },
  { connection },
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

console.log('Worker started');