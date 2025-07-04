"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProjectList from "@/components/projects/ProjectList";
import CreateProjectForm from "@/components/projects/CreateProjectForm";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/auth/signin");
  }

  const handleProjectCreated = () => {
    setShowCreateForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="mt-1 text-gray-300">
                Welcome back, {session?.user?.name || session?.user?.email}!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-purple-400 bg-slate-800/50 border border-purple-500/50 hover:bg-slate-800/70 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Upgrade
              </Link>
              
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Project
              </button>
              
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                {session?.user?.image && (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={session.user.image}
                    alt={session?.user?.name || "User avatar"}
                  />
                )}
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 border border-slate-600 text-sm font-medium rounded-md text-white bg-slate-800/50 hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4">Your Projects</h2>
          <ProjectList key={refreshTrigger} onProjectCreated={() => setRefreshTrigger(prev => prev + 1)} />
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateForm && (
        <CreateProjectForm
          onProjectCreated={handleProjectCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}