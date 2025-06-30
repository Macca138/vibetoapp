import { Job } from 'bull';
import { emailQueue } from '../index';

// Email job types
export interface WelcomeEmailJob {
  to: string;
  name?: string;
  userId: string;
}

export interface WaitlistWelcomeJob {
  to: string;
  name?: string;
  position?: number;
}

export interface ProjectCreatedJob {
  to: string;
  projectName: string;
  projectId: string;
  userName?: string;
}

// Email processor
const processEmailJob = async (job: Job) => {
  const { type, data } = job.data;

  switch (type) {
    case 'welcome':
      await sendWelcomeEmail(data as WelcomeEmailJob);
      break;
    case 'waitlist-welcome':
      await sendWaitlistWelcomeEmail(data as WaitlistWelcomeJob);
      break;
    case 'project-created':
      await sendProjectCreatedEmail(data as ProjectCreatedJob);
      break;
    default:
      throw new Error(`Unknown email job type: ${type}`);
  }
};

// Email sending functions (placeholders for now)
async function sendWelcomeEmail(data: WelcomeEmailJob) {
  console.log('Sending welcome email:', {
    to: data.to,
    name: data.name,
    subject: 'Welcome to VibeToApp!',
  });
  
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  // For now, just simulate sending
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function sendWaitlistWelcomeEmail(data: WaitlistWelcomeJob) {
  console.log('Sending waitlist welcome email:', {
    to: data.to,
    name: data.name,
    subject: 'You\'re on the VibeToApp waitlist!',
    position: data.position,
  });
  
  // TODO: Integrate with email service
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function sendProjectCreatedEmail(data: ProjectCreatedJob) {
  console.log('Sending project created email:', {
    to: data.to,
    projectName: data.projectName,
    subject: `Project "${data.projectName}" created successfully`,
  });
  
  // TODO: Integrate with email service
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Register the processor
emailQueue.process(async (job: Job) => {
  console.log(`Processing email job ${job.id} of type ${job.data.type}`);
  await processEmailJob(job);
});

// Helper functions to add jobs to the queue
export const sendWelcomeEmailJob = async (data: WelcomeEmailJob) => {
  return emailQueue.add({
    type: 'welcome',
    data,
  });
};

export const sendWaitlistWelcomeJob = async (data: WaitlistWelcomeJob) => {
  return emailQueue.add({
    type: 'waitlist-welcome',
    data,
  });
};

export const sendProjectCreatedJob = async (data: ProjectCreatedJob) => {
  return emailQueue.add({
    type: 'project-created',
    data,
  });
};