"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectProgressCard from "./ProjectProgressCard";

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
  estimatedTimeRemaining?: number;
  lastActivity?: Date;
  stepStatuses: {
    stepId: number;
    title: string;
    completed: boolean;
    hasData: boolean;
  }[];
}

interface ProjectStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
}

interface ProjectListProps {
  onProjectCreated?: () => void;
}

export default function ProjectList({ onProjectCreated }: ProjectListProps) {
  const [projects, setProjects] = useState<ProjectProgress[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/projects/progress");
      
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      
      const data = await response.json();
      setProjects(data.projects);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = (projectId: string, stepId: number) => {
    router.push(`/projects/${projectId}?step=${stepId}`);
  };

  const handleDelete = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      // Refresh the project list
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [onProjectCreated]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg">
        Error loading projects: {error}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-3 rounded-full bg-purple-500/20 w-fit mx-auto mb-4">
          <svg
            className="h-8 w-8 text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
        <p className="text-gray-300 mb-6">
          Get started by creating your first project and turning your ideas into reality.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-300">Total Projects</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-gray-300">Completed</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
            <div className="text-sm text-gray-300">In Progress</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{stats.completionRate}%</div>
            <div className="text-sm text-gray-300">Completion Rate</div>
          </div>
        </div>
      )}

      {/* Project Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectProgressCard
            key={project.projectId}
            project={project}
            onResume={handleResume}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}