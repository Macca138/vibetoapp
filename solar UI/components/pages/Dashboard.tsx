import { Plus, Brain, Trash2, Eye, Calendar, Rocket, LogOut, ChartBar, Loader } from "lucide-react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  projectServiceListUserProjects,
  projectServiceCreateProject,
  projectServiceDeleteProject,
  projectServiceGetUserStats,
  type Project 
} from "@/lib/sdk";


export default function Dashboard() {
  const { userDetails, logout } = useAuthContext();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [projectsResponse, statsResponse] = await Promise.all([
        projectServiceListUserProjects(),
        projectServiceGetUserStats()
      ]);
      
      if (projectsResponse.data) {
        setProjects(projectsResponse.data);
      }
      
      if (statsResponse.data) {
        setUserStats(statsResponse.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      setIsCreating(true);
      const response = await projectServiceCreateProject({
        body: {
          project_name: newProjectName,
          description: newProjectDescription || null
        }
      });
      
      if (response.data) {
        setProjects(prev => [response.data!, ...prev]);
        setNewProjectName("");
        setNewProjectDescription("");
        setShowCreateDialog(false);
        
        // Navigate to the first step of the new project
        navigate(`/project/${response.data.id}/step/step1`);
      } else {
        console.error("No data returned from create project");
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }
    
    try {
      setDeletingProjectId(projectId);
      
      const response = await projectServiceDeleteProject({
        body: { project_id: projectId }
      });
      
      // Only update state if the API call was successful
      if (response.error) {
        throw new Error(response.error.detail || "Failed to delete project");
      }
      
      // Remove project from local state after successful deletion
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success("Project deleted successfully");
      
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      
      // Show user-friendly error messages
      if (error?.status === 401 || error?.message?.includes("Unauthorized") || error?.message?.includes("token")) {
        toast.error("Authentication failed. Please sign in again.");
        logout(); // Force re-authentication
      } else if (error?.status === 404 || error?.message?.includes("not found")) {
        toast.error("Project not found or already deleted.");
        // Refresh the project list to sync with server
        loadDashboardData();
      } else {
        toast.error(error?.message || "Failed to delete project. Please try again.");
      }
    } finally {
      setDeletingProjectId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500/20 text-green-400">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500/20 text-blue-400">In Progress</Badge>;
      case "ARCHIVED":
        return <Badge className="bg-gray-500/20 text-gray-400">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProgressPercentage = (currentStep: number) => {
    return Math.round((currentStep / 8) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Vibe Coder</h1>
                <p className="text-sm text-gray-400">Welcome back, {userDetails?.email}</p>
              </div>
            </div>
            <Button onClick={logout} size="sm" className="bg-red-600 hover:bg-red-700 text-white border-0">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        {userStats && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Projects</CardTitle>
                <Rocket className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{userStats.total_projects}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Completed</CardTitle>
                <ChartBar className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {userStats.project_stats?.find((s: any) => s.status === 'COMPLETED')?.count || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">In Progress</CardTitle>
                <Calendar className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {userStats.project_stats?.find((s: any) => s.status === 'IN_PROGRESS')?.count || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Projects Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Your Projects</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Project</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Start a new AI app planning journey with our 8-step methodology.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-gray-300">Project Name</Label>
                  <Input
                    id="name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Awesome AI App"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Brief description of your project idea..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={handleCreateProject}
                  disabled={isCreating || !newProjectName.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isCreating ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Brain className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
              <p className="text-gray-400 text-center mb-6">
                Create your first project to start planning your AI app with our guided 8-step process.
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">{project.project_name}</CardTitle>
                      {project.description && (
                        <CardDescription className="text-gray-400 text-sm">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    {getStatusBadge(project.status || "IN_PROGRESS")}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-purple-400">{getProgressPercentage(project.current_step || 1)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                          style={{ width: `${getProgressPercentage(project.current_step || 1)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Step {project.current_step || 1} of 8
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/project/${project.id}`)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/project/${project.id}/step/step${project.current_step || 1}`)}
                        className="flex-1 border-purple-400 text-purple-400 hover:bg-purple-400/10"
                      >
                        Continue
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteProject(project.id!)}
                        disabled={deletingProjectId === project.id}
                        className="border-red-400 text-red-400 hover:bg-red-400/10 disabled:opacity-50"
                      >
                        {deletingProjectId === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-gray-500">
                      Updated {new Date(project.updated_at!).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}