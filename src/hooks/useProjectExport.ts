import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface EmailLog {
  id: string;
  recipientEmail: string;
  emailType: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  createdAt: Date;
}

interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  format: 'pdf' | 'markdown';
  filename?: string;
  fileUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  progress?: {
    percentage: number;
    estimatedTimeRemaining?: string;
  };
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  emailLogs?: EmailLog[];
}

interface UseProjectExportOptions {
  projectId: string;
  onExportComplete?: (job: ExportJob) => void;
  onExportError?: (error: string) => void;
}

export function useProjectExport({
  projectId,
  onExportComplete,
  onExportError,
}: UseProjectExportOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);

  // Start export
  const startExport = useCallback(async (format: 'pdf' | 'markdown', options?: { emailNotification?: boolean }) => {
    try {
      setIsExporting(true);
      
      const response = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          format,
          emailNotification: options?.emailNotification ?? true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start export');
      }

      const newJob: ExportJob = {
        id: data.exportJobId,
        status: 'pending',
        format,
        createdAt: new Date(),
      };

      setCurrentJob(newJob);
      setExportJobs(prev => [newJob, ...prev]);

      // Start polling for job status
      pollJobStatus(data.exportJobId);

      toast.success(`${format.toUpperCase()} export started! You'll be notified when it's ready.`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(errorMessage);
      onExportError?.(errorMessage);
      setIsExporting(false);
    }
  }, [projectId, onExportComplete, onExportError]);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/export/${jobId}`);
        const jobData = await response.json();

        if (!response.ok) {
          throw new Error(jobData.error || 'Failed to fetch job status');
        }

        const updatedJob: ExportJob = {
          id: jobData.id,
          status: jobData.status,
          format: jobData.format,
          filename: jobData.filename,
          fileUrl: jobData.fileUrl,
          fileSize: jobData.fileSize,
          errorMessage: jobData.errorMessage,
          progress: jobData.progress,
          createdAt: new Date(jobData.createdAt),
          completedAt: jobData.completedAt ? new Date(jobData.completedAt) : undefined,
          expiresAt: jobData.expiresAt ? new Date(jobData.expiresAt) : undefined,
        };

        setCurrentJob(updatedJob);
        setExportJobs(prev => 
          prev.map(job => job.id === jobId ? updatedJob : job)
        );

        // Stop polling if job is complete or failed
        if (['completed', 'failed', 'expired'].includes(jobData.status)) {
          clearInterval(pollInterval);
          setIsExporting(false);

          if (jobData.status === 'completed') {
            toast.success(`Export completed! Your ${jobData.format} is ready for download.`);
            onExportComplete?.(updatedJob);
          } else if (jobData.status === 'failed') {
            toast.error(`Export failed: ${jobData.errorMessage || 'Unknown error'}`);
            onExportError?.(jobData.errorMessage || 'Export failed');
          } else if (jobData.status === 'expired') {
            toast.error('Export file has expired and is no longer available.');
            onExportError?.('Export expired');
          }
        }

      } catch (error) {
        console.error('Error polling job status:', error);
        clearInterval(pollInterval);
        setIsExporting(false);
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to check export status';
        toast.error(errorMessage);
        onExportError?.(errorMessage);
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup function
    return () => clearInterval(pollInterval);
  }, [onExportComplete, onExportError]);

  // Fetch existing export jobs
  const fetchExportJobs = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/export`);
      const data = await response.json();

      if (response.ok) {
        const jobs: ExportJob[] = data.exportJobs.map((job: any) => ({
          id: job.id,
          status: job.status,
          format: job.format,
          filename: job.filename,
          fileUrl: job.fileUrl,
          fileSize: job.fileSize,
          errorMessage: job.errorMessage,
          createdAt: new Date(job.createdAt),
          completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
          expiresAt: job.expiresAt ? new Date(job.expiresAt) : undefined,
        }));

        setExportJobs(jobs);
      }
    } catch (error) {
      console.error('Error fetching export jobs:', error);
    }
  }, [projectId]);

  // Download export file
  const downloadExport = useCallback((job: ExportJob) => {
    if (job.fileUrl && job.status === 'completed') {
      const link = document.createElement('a');
      link.href = job.fileUrl;
      link.download = job.filename || `export_${job.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started!');
    } else {
      toast.error('Export file is not available for download');
    }
  }, []);

  // Cancel export
  const cancelExport = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/export/${jobId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentJob(null);
        setIsExporting(false);
        setExportJobs(prev =>
          prev.map(job =>
            job.id === jobId
              ? { ...job, status: 'failed', errorMessage: 'Cancelled by user' }
              : job
          )
        );
        toast.success('Export cancelled');
      } else {
        throw new Error(data.error || 'Failed to cancel export');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel export';
      toast.error(errorMessage);
    }
  }, []);

  // Fetch email logs for export job
  const fetchEmailLogs = useCallback(async (exportJobId: string): Promise<EmailLog[]> => {
    try {
      const response = await fetch(`/api/export/${exportJobId}/emails`);
      const data = await response.json();

      if (response.ok) {
        return data.emailLogs.map((log: any) => ({
          ...log,
          createdAt: new Date(log.createdAt),
          sentAt: log.sentAt ? new Date(log.sentAt) : undefined,
          deliveredAt: log.deliveredAt ? new Date(log.deliveredAt) : undefined,
          openedAt: log.openedAt ? new Date(log.openedAt) : undefined,
          clickedAt: log.clickedAt ? new Date(log.clickedAt) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching email logs:', error);
      return [];
    }
  }, []);

  return {
    // State
    isExporting,
    exportJobs,
    currentJob,
    
    // Actions
    startExport,
    downloadExport,
    cancelExport,
    fetchExportJobs,
    fetchEmailLogs,
  };
}