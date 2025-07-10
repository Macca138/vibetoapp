import Bull from 'bull';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create separate Redis connections for Bull
const createRedisClient = () => {
  return new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

// Queue options
const defaultQueueOptions = {
  createClient: (type: 'client' | 'subscriber' | 'bclient') => {
    switch (type) {
      case 'client':
        return createRedisClient();
      case 'subscriber':
        return createRedisClient();
      case 'bclient':
        return createRedisClient();
      default:
        return createRedisClient();
    }
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Create queues for different job types
export const emailQueue = new Bull('email', defaultQueueOptions);
export const aiProcessingQueue = new Bull('ai-processing', defaultQueueOptions);
export const dataExportQueue = new Bull('data-export', defaultQueueOptions);
export const notificationQueue = new Bull('notifications', defaultQueueOptions);

// Queue event handlers
const setupQueueEvents = (queue: Bull.Queue, name: string) => {
  queue.on('completed', (job) => {
    console.log(`[${name}] Job ${job.id} completed`);
  });

  queue.on('failed', (job, err) => {
    console.error(`[${name}] Job ${job.id} failed:`, err);
  });

  queue.on('stalled', (job) => {
    console.warn(`[${name}] Job ${job.id} stalled`);
  });
};

// Setup events for all queues
setupQueueEvents(emailQueue, 'Email');
setupQueueEvents(aiProcessingQueue, 'AI Processing');
setupQueueEvents(dataExportQueue, 'Data Export');
setupQueueEvents(notificationQueue, 'Notifications');

// Export all queues
export const queues = {
  email: emailQueue,
  aiProcessing: aiProcessingQueue,
  dataExport: dataExportQueue,
  notifications: notificationQueue,
};

// Setup export processor
import { processExportJob } from './processors/export.processor';

dataExportQueue.process('export-project', async (job) => {
  console.log(`Processing export job ${job.id} for project ${job.data.projectId}`);
  
  // Update job progress
  job.progress(5);
  
  const result = await processExportJob(job);
  
  job.progress(100);
  return result;
});

// Graceful shutdown
export const closeQueues = async () => {
  await Promise.all([
    emailQueue.close(),
    aiProcessingQueue.close(),
    dataExportQueue.close(),
    notificationQueue.close(),
  ]);
};

process.on('SIGTERM', closeQueues);
process.on('SIGINT', closeQueues);