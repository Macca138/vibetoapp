'use client';

import { m } from 'framer-motion';
import { WORKFLOW_STEPS } from '@/lib/workflow/config';
import { getStepStatus } from '@/lib/workflow/navigation';
import { ProjectWorkflow } from '@/lib/workflow/types';

interface StepNavigationProps {
  workflow: ProjectWorkflow;
  currentStep: number;
  onStepClick: (stepId: number) => void;
  className?: string;
}

export default function StepNavigation({ 
  workflow, 
  onStepClick, 
  className = '' 
}: StepNavigationProps) {
  return (
    <nav className={`${className}`}>
      <ol className="space-y-2">
        {WORKFLOW_STEPS.map((step, index) => {
          const status = getStepStatus(step.id, workflow);
          const isClickable = status !== 'locked';
          
          return (
            <m.li 
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  status === 'current'
                    ? 'bg-indigo-50 border-2 border-indigo-500 shadow-sm'
                    : status === 'completed'
                    ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                    : status === 'available'
                    ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    : 'bg-gray-100 border border-gray-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    status === 'current'
                      ? 'bg-indigo-500 text-white'
                      : status === 'completed'
                      ? 'bg-green-500 text-white'
                      : status === 'available'
                      ? 'bg-gray-300 text-gray-700'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {status === 'completed' ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      status === 'current'
                        ? 'text-indigo-900'
                        : status === 'completed'
                        ? 'text-green-900'
                        : status === 'available'
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                    <p className={`text-xs ${
                      status === 'current'
                        ? 'text-indigo-600'
                        : status === 'completed'
                        ? 'text-green-600'
                        : status === 'available'
                        ? 'text-gray-500'
                        : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  
                  {status === 'locked' && (
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            </m.li>
          );
        })}
      </ol>
    </nav>
  );
}