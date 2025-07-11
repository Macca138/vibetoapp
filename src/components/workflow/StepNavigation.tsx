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
  currentStep,
  onStepClick, 
  className = '' 
}: StepNavigationProps) {
  return (
    <nav className={`${className}`}>
      <ol className="space-y-2">
        {WORKFLOW_STEPS.map((step, index) => {
          const status = getStepStatus(step.id, { ...workflow, currentStep });
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
                className={`group w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  status === 'current'
                    ? 'bg-indigo-100 border-2 border-indigo-500 shadow-md cursor-pointer'
                    : status === 'completed'
                    ? 'bg-green-100 border border-green-300 hover:bg-green-150 hover:border-green-400 hover:shadow-md cursor-pointer transform hover:scale-[1.02]'
                    : status === 'available'
                    ? 'bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm cursor-pointer transform hover:scale-[1.02]'
                    : 'bg-gray-50 border border-gray-300 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    status === 'current'
                      ? 'bg-indigo-600 text-white'
                      : status === 'completed'
                      ? 'bg-green-600 text-white group-hover:bg-green-700 group-hover:scale-110'
                      : status === 'available'
                      ? 'bg-gray-600 text-white group-hover:bg-gray-700'
                      : 'bg-gray-400 text-gray-100'
                  }`}>
                    {status === 'completed' ? (
                      <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
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
                        : 'text-gray-600'
                    }`}>
                      {step.title}
                    </p>
                    <p className={`text-xs ${
                      status === 'current'
                        ? 'text-indigo-700'
                        : status === 'completed'
                        ? 'text-green-700'
                        : status === 'available'
                        ? 'text-gray-700'
                        : 'text-gray-500'
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