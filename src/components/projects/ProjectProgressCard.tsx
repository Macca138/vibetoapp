'use client';

import { useState } from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import { Calendar, Clock, CheckCircle, Circle, ArrowRight, Play, Trash2, MoreVertical } from 'lucide-react';

interface ProjectProgress {
  projectId: string;
  projectName: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  currentStep: number;
  completedSteps: number;
  totalSteps: number;
  isCompleted: boolean;
  completedAt?: Date;
  estimatedTimeRemaining?: number; // in minutes
  lastActivity?: Date;
  stepStatuses: {
    stepId: number;
    title: string;
    completed: boolean;
    hasData: boolean;
  }[];
}

interface ProjectProgressCardProps {
  project: ProjectProgress;
  onResume?: (projectId: string, stepId: number) => void;
  onDelete?: (projectId: string) => void;
}

export default function ProjectProgressCard({ 
  project, 
  onResume,
  onDelete
}: ProjectProgressCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const progressPercentage = (project.completedSteps / project.totalSteps) * 100;
  const nextStep = project.isCompleted ? null : project.currentStep;

  const getStatusColor = () => {
    if (project.isCompleted) return 'text-green-600';
    if (project.completedSteps === 0) return 'text-gray-500';
    if (project.completedSteps < project.totalSteps / 2) return 'text-orange-500';
    return 'text-blue-600';
  };

  const getStatusText = () => {
    if (project.isCompleted) return 'Completed';
    if (project.completedSteps === 0) return 'Not Started';
    if (project.completedSteps < project.totalSteps) return 'In Progress';
    return 'Ready to Complete';
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatLastActivity = (date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(project.projectId);
    }
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  return (
    <m.div
      className="group relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-lg transition-all duration-200 relative">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <Link href={`/projects/${project.projectId}`} className="flex-1 min-w-0 cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                {project.projectName}
              </h3>
              {project.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
            </Link>
            
            <div className="flex items-center space-x-2 ml-4">
              <div className={`flex items-center space-x-1 text-sm font-medium ${getStatusColor()}`}>
                {project.isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
                <span>{getStatusText()}</span>
              </div>
              
              {/* Actions Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{project.completedSteps} of {project.totalSteps} steps</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <m.div
                className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(progressPercentage)}% complete
            </div>
          </div>

          {/* Step Indicators */}
          <div className="mb-4">
            <div className="flex items-center space-x-1 overflow-x-auto pb-1">
              {project.stepStatuses.map((step) => (
                <div
                  key={step.stepId}
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                    step.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : step.stepId === project.currentStep
                      ? 'bg-purple-500 border-purple-500 text-white'
                      : step.hasData
                      ? 'bg-blue-100 border-blue-300 text-blue-600'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}
                  title={`Step ${step.stepId}: ${step.title}`}
                >
                  {step.completed ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    step.stepId
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              {project.lastActivity && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Last worked {formatLastActivity(project.lastActivity)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {!project.isCompleted && project.estimatedTimeRemaining && (
                <span className="text-orange-600 text-xs">
                  ~{formatTimeRemaining(project.estimatedTimeRemaining)} remaining
                </span>
              )}
              {!project.isCompleted && nextStep && (
                <div className="flex items-center space-x-1 text-purple-600">
                  <Play className="w-3 h-3" />
                  <span>Next: Step {nextStep}</span>
                </div>
              )}
            </div>
          </div>

          {/* Completion Badge */}
          {project.isCompleted && project.completedAt && (
            <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed {new Date(project.completedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
          <div className="flex items-center justify-between">
            <Link 
              href={`/projects/${project.projectId}`}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium cursor-pointer"
            >
              View Project
            </Link>
            
            {!project.isCompleted && nextStep && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onResume?.(project.projectId, nextStep);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Resume Step {nextStep}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{project.projectName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </m.div>
  );
}