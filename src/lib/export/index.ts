export { generateProjectPDF } from './pdf';
export { generateProjectMarkdown, validateMarkdownContent, getMarkdownMetadata } from './markdown';

// Export types
export interface ExportRequest {
  projectId: string;
  format: 'pdf' | 'markdown';
  userId: string;
}

export interface ExportStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  format: 'pdf' | 'markdown';
  progress?: {
    percentage: number;
    estimatedTimeRemaining?: string;
  };
  result?: {
    filename: string;
    fileUrl: string;
    fileSize: number;
  };
  error?: string;
  timestamps: {
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    expiresAt?: Date;
  };
}

export interface ExportMetadata {
  projectName: string;
  generatedAt: Date;
  format: 'pdf' | 'markdown';
  fileSize?: number;
  wordCount?: number;
  totalSteps: number;
  completedSteps: number;
}

// Utility functions
export function getExportFilename(projectName: string, format: 'pdf' | 'markdown'): string {
  const sanitizedName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = Date.now();
  return `${sanitizedName}_${timestamp}.${format === 'pdf' ? 'pdf' : 'md'}`;
}

export function getExportMimeType(format: 'pdf' | 'markdown'): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'markdown':
      return 'text/markdown';
    default:
      return 'application/octet-stream';
  }
}

export function getExportEstimatedDuration(format: 'pdf' | 'markdown'): string {
  switch (format) {
    case 'pdf':
      return '2-3 minutes';
    case 'markdown':
      return '30-60 seconds';
    default:
      return 'Unknown';
  }
}

export function isExportExpired(expiresAt?: Date): boolean {
  if (!expiresAt) return false;
  return expiresAt < new Date();
}

export function getExportExpirationDate(): Date {
  // Export files expire after 7 days
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export validation
export function validateExportFormat(format: string): format is 'pdf' | 'markdown' {
  return ['pdf', 'markdown'].includes(format);
}

export function validateProjectForExport(project: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!project) {
    errors.push('Project not found');
    return { isValid: false, errors };
  }
  
  if (!project.workflow) {
    errors.push('Project has no workflow data');
  } else if (!project.workflow.responses || project.workflow.responses.length === 0) {
    errors.push('Project has no workflow responses to export');
  }
  
  if (!project.name) {
    errors.push('Project has no name');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}