import { Job } from 'bull';
import { prisma } from '@/lib/prisma';
import { generateProjectPDF } from '@/lib/export/pdf';
import { generateProjectMarkdown } from '@/lib/export/markdown';
import { formatFileSize } from '@/lib/export';
import { sendExportCompletedEmailJob, sendExportFailedEmailJob } from './email.processor';
import { EMAIL_CONFIG } from '@/lib/resend';
import fs from 'fs/promises';
import path from 'path';

export interface ExportJobData {
  exportJobId: string;
  userId: string;
  projectId: string;
  format: 'pdf' | 'markdown';
  emailNotification?: boolean;
}

export async function processExportJob(job: Job<ExportJobData>) {
  const { exportJobId, userId, projectId, format, emailNotification = true } = job.data;
  
  console.log(`Starting export job ${exportJobId} for project ${projectId}, format: ${format}`);
  
  try {
    // Update job status to processing
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: 'processing',
        startedAt: new Date(),
        jobId: job.id.toString(),
      },
    });

    // Get project data with workflow responses
    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        userId: userId, // Ensure user owns the project
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        workflow: {
          include: {
            responses: {
              orderBy: { stepId: 'asc' },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    if (!project.workflow) {
      throw new Error('Project has no workflow data to export');
    }

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'public', 'exports');
    await fs.mkdir(exportsDir, { recursive: true });

    let filename: string;
    let fileBuffer: Buffer;
    let fileSize: number;

    // Generate export based on format
    if (format === 'pdf') {
      const pdfResult = await generateProjectPDF(project);
      fileBuffer = pdfResult.buffer;
      filename = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
    } else if (format === 'markdown') {
      const markdownResult = await generateProjectMarkdown(project);
      fileBuffer = Buffer.from(markdownResult.content, 'utf-8');
      filename = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.md`;
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }

    // Save file to disk
    const filePath = path.join(exportsDir, filename);
    await fs.writeFile(filePath, fileBuffer);
    fileSize = fileBuffer.length;

    // Generate download URL
    const fileUrl = `/exports/${filename}`;
    
    // Set expiration to 7 days from now
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update export job with completion data
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: 'completed',
        filename,
        fileUrl,
        fileSize,
        completedAt: new Date(),
        expiresAt,
      },
    });

    console.log(`Export job ${exportJobId} completed successfully. File: ${filename}, Size: ${fileSize} bytes`);

    // Send completion email notification if enabled
    if (emailNotification) {
      try {
        await sendExportCompletedEmailJob({
          to: project.user.email,
          userId,
          exportJobId,
          data: {
            userName: project.user.name || project.user.email,
            projectName: project.name,
            format,
            downloadUrl: `${EMAIL_CONFIG.baseUrl}${fileUrl}`,
            fileSize: formatFileSize(fileSize),
            expiresAt,
          },
        });
        console.log(`Export completion email queued for ${project.user.email}`);
      } catch (emailError) {
        console.error('Failed to queue export completion email:', emailError);
        // Don't fail the export if email fails
      }
    }
    
    return {
      success: true,
      filename,
      fileUrl,
      fileSize,
    };

  } catch (error) {
    console.error(`Export job ${exportJobId} failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Update job status to failed
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
      },
    });

    // Send failure email notification if enabled
    if (emailNotification) {
      try {
        // Get user info for email (we might not have project if it failed early)
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });

        if (user) {
          await sendExportFailedEmailJob({
            to: user.email,
            userId,
            exportJobId,
            data: {
              userName: user.name || user.email,
              projectName: project?.name || 'Unknown Project',
              format,
              errorMessage,
              supportUrl: `${EMAIL_CONFIG.baseUrl}/support`,
            },
          });
          console.log(`Export failure email queued for ${user.email}`);
        }
      } catch (emailError) {
        console.error('Failed to queue export failure email:', emailError);
        // Don't fail the export further if email fails
      }
    }

    throw error;
  }
}

// Clean up expired export files
export async function cleanupExpiredExports() {
  try {
    const expiredExports = await prisma.exportJob.findMany({
      where: {
        status: 'completed',
        expiresAt: {
          lt: new Date(),
        },
        fileUrl: {
          not: null,
        },
      },
    });

    for (const exportJob of expiredExports) {
      if (exportJob.filename) {
        const filePath = path.join(process.cwd(), 'public', 'exports', exportJob.filename);
        
        try {
          await fs.unlink(filePath);
          console.log(`Deleted expired export file: ${exportJob.filename}`);
        } catch (error) {
          console.warn(`Failed to delete expired export file ${exportJob.filename}:`, error);
        }
      }

      // Update database record
      await prisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          fileUrl: null,
          filename: null,
        },
      });
    }

    console.log(`Cleaned up ${expiredExports.length} expired export files`);
  } catch (error) {
    console.error('Error cleaning up expired exports:', error);
  }
}