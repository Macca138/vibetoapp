'use client';

import { m } from 'framer-motion';
import { WorkflowProgress } from '@/lib/workflow/types';

interface ProgressBarProps {
  progress: WorkflowProgress;
  className?: string;
}

export default function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-800">
          Step {progress.currentStep} of {progress.totalSteps}
        </span>
        <span className="text-sm text-gray-700">
          {progress.percentComplete}% complete
        </span>
      </div>
      
      <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
        <m.div
          className="h-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentComplete}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      
      {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
        <div className="mt-2 text-xs text-gray-700">
          Estimated time remaining: {progress.estimatedTimeRemaining} minutes
        </div>
      )}
    </div>
  );
}