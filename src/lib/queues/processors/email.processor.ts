import { Job } from 'bull';
import { emailQueue } from '../index';
import { prisma } from '@/lib/prisma';
import { 
  sendEmail, 
  createExportCompletedEmail, 
  createExportFailedEmail,
  ExportCompletedEmailData,
  ExportFailedEmailData 
} from '@/lib/resend';

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

export interface ExportCompletedEmailJob {
  to: string;
  data: ExportCompletedEmailData;
  exportJobId?: string;
  userId: string;
}

export interface ExportFailedEmailJob {
  to: string;
  data: ExportFailedEmailData;
  exportJobId?: string;
  userId: string;
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
    case 'export-completed':
      await sendExportCompletedEmail(data as ExportCompletedEmailJob);
      break;
    case 'export-failed':
      await sendExportFailedEmail(data as ExportFailedEmailJob);
      break;
    default:
      throw new Error(`Unknown email job type: ${type}`);
  }
};

// Email sending functions
async function sendWelcomeEmail(data: WelcomeEmailJob) {
  console.log('Sending welcome email:', {
    to: data.to,
    name: data.name,
    subject: 'Welcome to VibeToApp!',
  });
  
  // TODO: Create proper welcome email template
  const result = await sendEmail({
    to: data.to,
    subject: 'Welcome to VibeToApp!',
    html: `<h1>Welcome ${data.name || 'there'}!</h1><p>Thanks for joining VibeToApp.</p>`,
    text: `Welcome ${data.name || 'there'}! Thanks for joining VibeToApp.`,
  });
  
  if (!result.success) {
    throw new Error(`Failed to send welcome email: ${result.error}`);
  }
}

async function sendWaitlistWelcomeEmail(data: WaitlistWelcomeJob) {
  console.log('Sending waitlist welcome email:', {
    to: data.to,
    name: data.name,
    subject: 'You\'re on the VibeToApp waitlist!',
    position: data.position,
  });
  
  // TODO: Create proper waitlist email template
  const result = await sendEmail({
    to: data.to,
    subject: 'You\'re on the VibeToApp waitlist!',
    html: `<h1>Thanks for joining our waitlist!</h1><p>You're ${data.position ? `#${data.position}` : ''} on the list.</p>`,
    text: `Thanks for joining our waitlist! You're ${data.position ? `#${data.position}` : ''} on the list.`,
  });
  
  if (!result.success) {
    throw new Error(`Failed to send waitlist email: ${result.error}`);
  }
}

async function sendProjectCreatedEmail(data: ProjectCreatedJob) {
  console.log('Sending project created email:', {
    to: data.to,
    projectName: data.projectName,
    subject: `Project "${data.projectName}" created successfully`,
  });
  
  // TODO: Create proper project created email template
  const result = await sendEmail({
    to: data.to,
    subject: `Project "${data.projectName}" created successfully`,
    html: `<h1>Project Created!</h1><p>Your project "${data.projectName}" has been created successfully.</p>`,
    text: `Project Created! Your project "${data.projectName}" has been created successfully.`,
  });
  
  if (!result.success) {
    throw new Error(`Failed to send project created email: ${result.error}`);
  }
}

async function sendExportCompletedEmail(data: ExportCompletedEmailJob) {
  console.log('Sending export completed email:', {
    to: data.to,
    projectName: data.data.projectName,
    format: data.data.format,
  });
  
  const emailTemplate = createExportCompletedEmail(data.data);
  
  // Create email log record
  const emailLog = await prisma.emailLog.create({
    data: {
      userId: data.userId,
      exportJobId: data.exportJobId || null,
      recipientEmail: data.to,
      emailType: 'export-completed',
      subject: emailTemplate.subject,
      status: 'pending',
    },
  });
  
  try {
    const result = await sendEmail({
      to: data.to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });
    
    if (!result.success) {
      // Update log with failure
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'failed',
          errorMessage: result.error,
        },
      });
      throw new Error(`Failed to send export completed email: ${result.error}`);
    }
    
    // Update log with success
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'sent',
        resendId: result.id,
        sentAt: new Date(),
      },
    });
    
    console.log(`Export completed email sent successfully to ${data.to} (ID: ${result.id})`);
  } catch (error) {
    // Update log with failure if not already updated
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}

async function sendExportFailedEmail(data: ExportFailedEmailJob) {
  console.log('Sending export failed email:', {
    to: data.to,
    projectName: data.data.projectName,
    format: data.data.format,
    error: data.data.errorMessage,
  });
  
  const emailTemplate = createExportFailedEmail(data.data);
  
  // Create email log record
  const emailLog = await prisma.emailLog.create({
    data: {
      userId: data.userId,
      exportJobId: data.exportJobId || null,
      recipientEmail: data.to,
      emailType: 'export-failed',
      subject: emailTemplate.subject,
      status: 'pending',
    },
  });
  
  try {
    const result = await sendEmail({
      to: data.to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });
    
    if (!result.success) {
      // Update log with failure
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'failed',
          errorMessage: result.error,
        },
      });
      throw new Error(`Failed to send export failed email: ${result.error}`);
    }
    
    // Update log with success
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'sent',
        resendId: result.id,
        sentAt: new Date(),
      },
    });
    
    console.log(`Export failed email sent successfully to ${data.to} (ID: ${result.id})`);
  } catch (error) {
    // Update log with failure if not already updated
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
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

export const sendExportCompletedEmailJob = async (data: ExportCompletedEmailJob) => {
  return emailQueue.add(
    {
      type: 'export-completed',
      data,
    },
    {
      priority: 2, // High priority for user notifications
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );
};

export const sendExportFailedEmailJob = async (data: ExportFailedEmailJob) => {
  return emailQueue.add(
    {
      type: 'export-failed',
      data,
    },
    {
      priority: 1, // Highest priority for error notifications
      attempts: 5, // More attempts for error notifications
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    }
  );
};