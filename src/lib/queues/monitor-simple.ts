import { exportQueue, emailQueue, type QueueJob } from './simple-queue';

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
  try {
    const exportStats = await exportQueue.getStats();
    const emailStats = await emailQueue.getStats();

    return [
      {
        name: 'export',
        waiting: exportStats.pending,
        active: exportStats.processing,
        completed: exportStats.completed,
        failed: exportStats.failed,
        delayed: 0,
        paused: false,
      },
      {
        name: 'email',
        waiting: emailStats.pending,
        active: emailStats.processing,
        completed: emailStats.completed,
        failed: emailStats.failed,
        delayed: 0,
        paused: false,
      },
    ];
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return [];
  }
}

// Get jobs for a specific queue
export async function getQueueJobs(
  queueName: string,
  status: 'waiting' | 'active' | 'completed' | 'failed' = 'waiting',
  start = 0,
  end = 50
): Promise<JobInfo[]> {
  try {
    const queue = queueName === 'export' ? exportQueue : emailQueue;
    const jobs = await queue.getJobs(queueName as 'export' | 'email');
    
    const filteredJobs = jobs.filter(job => {
      switch (status) {
        case 'waiting': return job.status === 'pending';
        case 'active': return job.status === 'processing';
        case 'completed': return job.status === 'completed';
        case 'failed': return job.status === 'failed';
        default: return true;
      }
    });

    return filteredJobs.slice(start, end + 1).map(job => ({
      id: job.id,
      name: job.type,
      data: job.data,
      progress: job.status === 'completed' ? 100 : job.status === 'processing' ? 50 : 0,
      processedOn: job.status === 'processing' ? job.createdAt.getTime() : undefined,
      finishedOn: job.completedAt?.getTime(),
      failedReason: job.error,
      delay: 0,
      timestamp: job.createdAt.getTime(),
      attemptsMade: 1,
      opts: {
        attempts: 1,
        delay: 0,
      },
    }));
  } catch (error) {
    console.error(`Error getting jobs for queue ${queueName}:`, error);
    return [];
  }
}

// Remove a job
export async function removeJob(queueName: string, jobId: string): Promise<boolean> {
  try {
    const queue = queueName === 'export' ? exportQueue : emailQueue;
    return await queue.removeJob(jobId);
  } catch (error) {
    console.error(`Error removing job ${jobId} from queue ${queueName}:`, error);
    return false;
  }
}

// Retry a failed job
export async function retryJob(queueName: string, jobId: string): Promise<boolean> {
  try {
    const queue = queueName === 'export' ? exportQueue : emailQueue;
    const job = await queue.getJob(jobId);
    
    if (!job || job.status !== 'failed') {
      return false;
    }

    // Create a new job with the same data
    await queue.add(job.type, job.data);
    
    // Remove the old failed job
    await queue.removeJob(jobId);
    
    return true;
  } catch (error) {
    console.error(`Error retrying job ${jobId} in queue ${queueName}:`, error);
    return false;
  }
}

// Get queue health status
export async function getQueueHealth(): Promise<{
  healthy: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  try {
    const stats = await getAllQueueStats();
    
    // Check for too many failed jobs
    stats.forEach(stat => {
      if (stat.failed > 10) {
        issues.push(`Queue ${stat.name} has ${stat.failed} failed jobs`);
      }
      
      if (stat.waiting > 100) {
        issues.push(`Queue ${stat.name} has ${stat.waiting} waiting jobs (possible backlog)`);
      }
    });
    
    return {
      healthy: issues.length === 0,
      issues,
    };
  } catch (error) {
    return {
      healthy: false,
      issues: [`Failed to check queue health: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}