#!/usr/bin/env node

import 'dotenv/config';
import { emailQueue, aiProcessingQueue, dataExportQueue } from '@/lib/queues';
import { processEmailJob } from '@/lib/queues/processors/email.processor';
import { processExportJob } from '@/lib/queues/processors/export.processor';

console.log('🚀 Starting queue workers...');

// Email Queue Worker
emailQueue.process(async (job) => {
  console.log(`Processing email job ${job.id}: ${job.data.type}`);
  return await processEmailJob(job);
});

// Export Queue Worker
dataExportQueue.process(async (job) => {
  console.log(`Processing export job ${job.id}: ${job.data.format}`);
  return await processExportJob(job);
});

// AI Processing Queue Worker (if needed)
aiProcessingQueue.process(async (job) => {
  console.log(`Processing AI job ${job.id}: ${job.data.type}`);
  // Add AI processing logic here when needed
  return { success: true };
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing queues...');
  await emailQueue.close();
  await dataExportQueue.close();
  await aiProcessingQueue.close();
  process.exit(0);
});

console.log('✅ Queue workers started successfully');
console.log('📧 Email queue: Active');
console.log('📁 Export queue: Active');
console.log('🤖 AI queue: Active');
console.log('\nWaiting for jobs...');