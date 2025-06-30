import { queues } from './index';

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface JobInfo {
  id: string;
  name: string;
  data: Record<string, unknown>;
  progress: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  delay?: number;
  timestamp: number;
  attemptsMade: number;
  opts: {
    attempts: number;
    delay?: number;
  };
}

// Get stats for all queues
export async function getAllQueueStats(): Promise<QueueStats[]> {
  const stats = await Promise.all(
    Object.entries(queues).map(async ([name, queue]) => {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      return {
        name,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: await queue.isPaused(),
      };
    })
  );

  return stats;
}

// Get detailed job information
export async function getQueueJobs(
  queueName: string,
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' = 'waiting',
  start = 0,
  end = 50
): Promise<JobInfo[]> {
  const queue = queues[queueName as keyof typeof queues];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  let jobs: any[];
  switch (status) {
    case 'waiting':
      jobs = await queue.getWaiting(start, end);
      break;
    case 'active':
      jobs = await queue.getActive(start, end);
      break;
    case 'completed':
      jobs = await queue.getCompleted(start, end);
      break;
    case 'failed':
      jobs = await queue.getFailed(start, end);
      break;
    case 'delayed':
      jobs = await queue.getDelayed(start, end);
      break;
    default:
      jobs = [];
  }

  return jobs.map(job => ({
    id: job.id?.toString() || 'unknown',
    name: job.name || 'unknown',
    data: job.data || {},
    progress: typeof job.progress === 'function' ? job.progress() : 0,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
    delay: job.delay,
    timestamp: job.timestamp,
    attemptsMade: job.attemptsMade,
    opts: job.opts,
  }));
}

// Queue management functions
export async function pauseQueue(queueName: string): Promise<void> {
  const queue = queues[queueName as keyof typeof queues];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }
  await queue.pause();
}

export async function resumeQueue(queueName: string): Promise<void> {
  const queue = queues[queueName as keyof typeof queues];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }
  await queue.resume();
}

export async function cleanQueue(
  queueName: string,
  grace: number = 1000,
  status: 'completed' | 'failed' = 'completed'
): Promise<any[]> {
  const queue = queues[queueName as keyof typeof queues];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }
  
  return await queue.clean(grace, status);
}

// Retry failed job
export async function retryFailedJob(queueName: string, jobId: string): Promise<void> {
  const queue = queues[queueName as keyof typeof queues];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  const job = await queue.getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  await job.retry();
}

// Get queue health check
export async function getQueueHealth(): Promise<{
  healthy: boolean;
  queues: Array<{ name: string; healthy: boolean; error?: string }>;
}> {
  const queueHealth = await Promise.all(
    Object.entries(queues).map(async ([name, queue]) => {
      try {
        // Simple health check - try to get queue stats
        await queue.getWaiting();
        return { name, healthy: true };
      } catch (error) {
        return { 
          name, 
          healthy: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    })
  );

  const allHealthy = queueHealth.every(q => q.healthy);

  return {
    healthy: allHealthy,
    queues: queueHealth,
  };
}