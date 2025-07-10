// Simple queue implementation for Next.js compatibility
// This replaces Bull queue to avoid module resolution issues

interface QueueJob {
  id: string;
  data: any;
  type: 'export' | 'email';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

class SimpleQueue {
  private jobs: Map<string, QueueJob> = new Map();
  private processing = false;

  async add(type: 'export' | 'email', data: any): Promise<string> {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: QueueJob = {
      id,
      data,
      type,
      status: 'pending',
      createdAt: new Date()
    };

    this.jobs.set(id, job);
    
    // Process immediately for now (synchronous processing)
    setTimeout(() => this.processJobs(), 0);
    
    return id;
  }

  async getJob(id: string): Promise<QueueJob | undefined> {
    return this.jobs.get(id);
  }

  async getJobs(type?: 'export' | 'email'): Promise<QueueJob[]> {
    const allJobs = Array.from(this.jobs.values());
    return type ? allJobs.filter(job => job.type === type) : allJobs;
  }

  private async processJobs() {
    if (this.processing) return;
    this.processing = true;

    try {
      const pendingJobs = Array.from(this.jobs.values())
        .filter(job => job.status === 'pending');

      for (const job of pendingJobs) {
        await this.processJob(job);
      }
    } finally {
      this.processing = false;
    }
  }

  private async processJob(job: QueueJob) {
    try {
      job.status = 'processing';
      this.jobs.set(job.id, job);

      // Simple processing logic
      if (job.type === 'export') {
        await this.processExportJob(job);
      } else if (job.type === 'email') {
        await this.processEmailJob(job);
      }

      job.status = 'completed';
      job.completedAt = new Date();
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      this.jobs.set(job.id, job);
    }
  }

  private async processExportJob(job: QueueJob) {
    // Placeholder for export processing
    // In a real implementation, this would generate the PDF/Markdown
    console.log('Processing export job:', job.id);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update job data with result
    job.data.result = {
      fileUrl: `/exports/${job.id}.pdf`,
      filename: `export_${job.id}.pdf`,
      fileSize: 1024 * 100 // 100KB placeholder
    };
  }

  private async processEmailJob(job: QueueJob) {
    // Placeholder for email processing
    console.log('Processing email job:', job.id);
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async removeJob(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    };
  }
}

// Create singleton instance
const exportQueue = new SimpleQueue();
const emailQueue = new SimpleQueue();

export { exportQueue, emailQueue };
export type { QueueJob };