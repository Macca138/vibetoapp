import { ArrowLeft, Download, Eye, Clock, Calendar, User, FileText, Lightbulb, Code, Target, Palette, Settings, CircleCheck, Rocket, Brain, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  projectServiceGetProject,
  projectServiceGetProjectExport,
  projectServiceCompleteProject,
  type Project 
} from "@/lib/sdk";


export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      const response = await projectServiceGetProject({
        body: { project_id: projectId }
      });
      
      if (response.data) {
        setProject(response.data);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!projectId) return;
    
    try {
      setIsExporting(true);
      const response = await projectServiceGetProjectExport({
        body: { project_id: projectId }
      });
      
      if (response.data) {
        // Create and download the export file
        const exportData = JSON.stringify(response.data, null, 2);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project?.project_name || 'project'}-specification.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export project:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCompleteProject = async () => {
    if (!projectId) return;
    
    try {
      setIsCompleting(true);
      const response = await projectServiceCompleteProject({
        body: { project_id: projectId }
      });
      
      if (response.data) {
        setProject(response.data);
      }
    } catch (error) {
      console.error("Failed to complete project:", error);
    } finally {
      setIsCompleting(false);
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

  const planningSteps = [
    {
      id: "step1",
      icon: <Lightbulb className="h-5 w-5" />,
      title: "Idea Fleshing Out",
      description: "Transform your rough idea into a precise execution plan"
    },
    {
      id: "step2", 
      icon: <Code className="h-5 w-5" />,
      title: "Technical Structure",
      description: "Design your app's architecture with AI guidance"
    },
    {
      id: "step3",
      icon: <Target className="h-5 w-5" />,
      title: "Feature Stories",
      description: "Detail user stories and UX/UI considerations"
    },
    {
      id: "step4",
      icon: <Palette className="h-5 w-5" />,
      title: "State & Style",
      description: "Define your comprehensive design system"
    },
    {
      id: "step5",
      icon: <Settings className="h-5 w-5" />,
      title: "Technical Specification",
      description: "Create detailed API designs and data schemas"
    },
    {
      id: "step6",
      icon: <CircleCheck className="h-5 w-5" />,
      title: "Rules & Constraints",
      description: "Define business rules and system constraints"
    },
    {
      id: "step7",
      icon: <Rocket className="h-5 w-5" />,
      title: "Implementation Plan",
      description: "Generate a step-by-step development roadmap"
    },
    {
      id: "step8",
      icon: <Brain className="h-5 w-5" />,
      title: "Final Review",
      description: "Synthesize everything into a polished specification"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Project not found</div>
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/dashboard")}
                className="text-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-bold text-white">{project.project_name}</h1>
                <p className="text-sm text-gray-400">Project Overview</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={handleExport}
                disabled={isExporting}
                variant="outline"
                size="sm"
                className="text-gray-300 border-gray-600"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
              {project.status !== "COMPLETED" && (
                <Button 
                  onClick={handleCompleteProject}
                  disabled={isCompleting}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CircleCheck className="h-4 w-4 mr-2" />
                  {isCompleting ? "Completing..." : "Mark Complete"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl">{project.project_name}</CardTitle>
                    {project.description && (
                      <CardDescription className="text-gray-400 mt-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  {getStatusBadge(project.status || "IN_PROGRESS")}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(project.created_at!).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Updated:</span>
                    <span className="text-white">{new Date(project.updated_at!).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Target className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Progress:</span>
                    <span className="text-white">{getProgressPercentage(project.current_step || 1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planning Steps */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Planning Steps</CardTitle>
                <CardDescription className="text-gray-400">
                  Your progress through the 8-step planning methodology
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planningSteps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber < (project.current_step || 1);
                    const isCurrent = stepNumber === (project.current_step || 1);
                    const hasData = project.planning_data && project.planning_data[step.id];
                    
                    return (
                      <div 
                        key={step.id}
                        className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
                          isCompleted 
                            ? "bg-green-500/10 border-green-500/30" 
                            : isCurrent 
                            ? "bg-purple-500/10 border-purple-500/30" 
                            : "bg-slate-700/30 border-slate-600"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          isCompleted 
                            ? "bg-green-500/20 text-green-400" 
                            : isCurrent 
                            ? "bg-purple-500/20 text-purple-400" 
                            : "bg-slate-600/20 text-gray-400"
                        }`}>
                          {step.icon}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className={`font-medium ${
                            isCompleted || isCurrent ? "text-white" : "text-gray-400"
                          }`}>
                            {step.title}
                          </h3>
                          <p className="text-sm text-gray-400">{step.description}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isCompleted && (
                            <CircleCheck className="h-5 w-5 text-green-400" />
                          )}
                          {hasData && (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                          <Button 
                            size="sm"
                            variant={isCurrent ? "default" : "outline"}
                            onClick={() => navigate(`/project/${projectId}/step/${step.id}`)}
                            className={isCurrent ? "bg-purple-600 hover:bg-purple-700" : "border-slate-600 text-slate-300"}
                          >
                            {isCompleted ? "Review" : isCurrent ? "Continue" : "Start"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Overall Progress</span>
                      <span className="text-purple-400 font-medium">{getProgressPercentage(project.current_step || 1)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                        style={{ width: `${getProgressPercentage(project.current_step || 1)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Step {project.current_step || 1} of 8 completed
                    </div>
                  </div>
                  
                  <Separator className="bg-slate-600" />
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {(project.current_step || 1) - 1}
                      </div>
                      <div className="text-xs text-gray-400">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">
                        {8 - (project.current_step || 1) + 1}
                      </div>
                      <div className="text-xs text-gray-400">Remaining</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate(`/project/${projectId}/step/step${project.current_step || 1}`)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Continue Planning
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isExporting ? "Exporting..." : "Export Spec"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}