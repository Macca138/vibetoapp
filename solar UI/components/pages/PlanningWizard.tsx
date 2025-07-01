import { ArrowLeft, ArrowRight, Sparkles, Save, Lightbulb, Code, Target, Palette, Settings, CircleCheck, Rocket, Brain, Loader, MessageCircle, RefreshCw, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  projectServiceGetProject,
  projectServiceRefineWithAi,
  projectServiceSaveStepData,
  finalDocumentServiceGenerateFinalDocument,
  type Project 
} from "@/lib/sdk";


export default function PlanningWizard() {
  const { projectId, stepId } = useParams<{ projectId: string; stepId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [userInput, setUserInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [refinementInput, setRefinementInput] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const stepConfigs = {
    step1: {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Idea Fleshing Out",
      description: "Transform your rough idea into a precise execution plan",
      templateKey: "metaPromptTemplate",
      placeholder: "Describe your project idea here - it can be rough, incomplete, or just a feeling...",
      aiPrompt: "Let's refine your idea using our proven methodology."
    },
    step2: {
      icon: <Code className="h-6 w-6" />,
      title: "Technical Structure",
      description: "Design your app's architecture with AI guidance", 
      templateKey: "technicalArchitectureTemplate",
      placeholder: "What technical features or requirements do you have in mind?",
      aiPrompt: "Let's design the technical architecture for your app."
    },
    step3: {
      icon: <Target className="h-6 w-6" />,
      title: "Feature Stories",
      description: "Detail user stories and UX/UI considerations",
      templateKey: "featureStoryTemplate", 
      placeholder: "Which feature would you like to detail first?",
      aiPrompt: "Let's break down your features into detailed user stories."
    },
    step4: {
      icon: <Palette className="h-6 w-6" />,
      title: "State & Style",
      description: "Define your comprehensive design system",
      templateKey: "designVibeTemplate",
      placeholder: "Describe the visual style and vibe you want for your app...",
      aiPrompt: "Let's create a comprehensive design guide for your app."
    },
    step5: {
      icon: <Settings className="h-6 w-6" />,
      title: "Technical Specification",
      description: "Create detailed API designs and data schemas",
      templateKey: "technicalSpecTemplate",
      placeholder: "Any specific technical requirements or questions?",
      aiPrompt: "Let's create detailed technical specifications."
    },
    step6: {
      icon: <CircleCheck className="h-6 w-6" />,
      title: "Rules & Constraints",
      description: "Define business rules and system constraints",
      templateKey: "rulesTemplate",
      placeholder: "What business rules or constraints should we consider?",
      aiPrompt: "Let's define the rules and constraints for your app."
    },
    step7: {
      icon: <Rocket className="h-6 w-6" />,
      title: "Implementation Plan",
      description: "Generate a step-by-step development roadmap",
      templateKey: "plannerTemplate",
      placeholder: "Any thoughts on timeline or development phases?",
      aiPrompt: "Let's create your implementation roadmap."
    },
    step8: {
      icon: <Brain className="h-6 w-6" />,
      title: "Final Review",
      description: "Synthesize everything into a polished specification",
      templateKey: "finalReviewTemplate",
      placeholder: "Any final thoughts or adjustments?",
      aiPrompt: "Let's create your final project specification."
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    if (project && stepId) {
      // Load existing data for this step
      const existingData = project.planning_data?.[stepId];
      if (existingData) {
        if (typeof existingData === 'string') {
          setAiResponse(existingData);
        } else if (existingData.ai_response) {
          setAiResponse(existingData.ai_response);
          // Load conversation history if available
          if (existingData.conversation_history) {
            setConversationHistory(existingData.conversation_history.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })));
          }
        }
        if (existingData.user_input) {
          setUserInput(existingData.user_input);
        }
      } else {
        // Clear state for new step
        setUserInput("");
        setAiResponse("");
        setConversationHistory([]);
        setRefinementInput("");
        setShowConversation(false);
      }
      setHasUnsavedChanges(false);
    }
  }, [project, stepId]);

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

  const handleRefineWithAI = async () => {
    if (!projectId || !stepId || !userInput.trim()) return;
    
    const config = stepConfigs[stepId as keyof typeof stepConfigs];
    if (!config) return;
    
    try {
      setIsGenerating(true);
      const response = await projectServiceRefineWithAi({
        body: {
          project_id: projectId,
          step_id: stepId,
          user_input: userInput,
          prompt_template_key: config.templateKey
        }
      });
      
      if (response.data && response.data.refined_content) {
        const newResponse = response.data.refined_content as string;
        setAiResponse(newResponse);
        
        // Add to conversation history
        const newHistory = [
          ...conversationHistory,
          { role: 'user' as const, content: userInput, timestamp: new Date() },
          { role: 'assistant' as const, content: newResponse, timestamp: new Date() }
        ];
        setConversationHistory(newHistory);
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Failed to refine with AI:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefineResponse = async () => {
    if (!projectId || !stepId || !refinementInput.trim() || !aiResponse) return;
    
    const config = stepConfigs[stepId as keyof typeof stepConfigs];
    if (!config) return;
    
    try {
      setIsGenerating(true);
      
      // Create refinement context
      const refinementContext = `Previous response:\n${aiResponse}\n\nRefinement request: ${refinementInput}`;
      
      const response = await projectServiceRefineWithAi({
        body: {
          project_id: projectId,
          step_id: stepId,
          user_input: refinementContext,
          prompt_template_key: config.templateKey
        }
      });
      
      if (response.data && response.data.refined_content) {
        const newResponse = response.data.refined_content as string;
        setAiResponse(newResponse);
        
        // Add refinement to conversation history
        const newHistory = [
          ...conversationHistory,
          { role: 'user' as const, content: `Refinement: ${refinementInput}`, timestamp: new Date() },
          { role: 'assistant' as const, content: newResponse, timestamp: new Date() }
        ];
        setConversationHistory(newHistory);
        setRefinementInput("");
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Failed to refine with AI:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (shouldAdvance: boolean = false) => {
    if (!projectId || !stepId) return;
    
    try {
      setIsSaving(true);
      const stepData = {
        user_input: userInput,
        ai_response: aiResponse,
        conversation_history: conversationHistory,
        completed_at: new Date().toISOString()
      };
      
      const response = await projectServiceSaveStepData({
        body: {
          project_id: projectId,
          step_id: stepId,
          step_data: stepData
        }
      });
      
      if (response.data) {
        setProject(response.data);
        setHasUnsavedChanges(false);
        
        if (shouldAdvance) {
          // Navigate to next step or project view
          const currentStepNumber = parseInt(stepId.replace('step', ''));
          if (currentStepNumber < 8) {
            navigate(`/project/${projectId}/step/step${currentStepNumber + 1}`);
          } else {
            navigate(`/project/${projectId}`);
          }
        }
      }
    } catch (error) {
      console.error("Failed to save step:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateFinalDocument = async () => {
    if (!projectId) return;
    
    try {
      setIsGenerating(true);
      
      // Generate the final comprehensive document
      const response = await finalDocumentServiceGenerateFinalDocument({
        body: {
          user: { id: '', email: '' }, // This will be populated by auth
          project_id: projectId
        }
      });
      
      if (response.data) {
        // Navigate to project view to show the completed document
        navigate(`/project/${projectId}`);
      }
    } catch (error) {
      console.error("Failed to generate final document:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Track changes to user input
  useEffect(() => {
    if (userInput && userInput !== (project?.planning_data?.[stepId]?.user_input || "")) {
      setHasUnsavedChanges(true);
    }
  }, [userInput, project, stepId]);

  const getStepNumber = (stepId: string) => {
    return parseInt(stepId.replace('step', ''));
  };

  const getPreviousStep = () => {
    if (!stepId) return null;
    const current = getStepNumber(stepId);
    return current > 1 ? `step${current - 1}` : null;
  };

  const getNextStep = () => {
    if (!stepId) return null;
    const current = getStepNumber(stepId);
    return current < 8 ? `step${current + 1}` : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading planning wizard...</div>
      </div>
    );
  }

  if (!project || !stepId || !stepConfigs[stepId as keyof typeof stepConfigs]) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Step not found</div>
      </div>
    );
  }

  const config = stepConfigs[stepId as keyof typeof stepConfigs];
  const currentStepNumber = getStepNumber(stepId);

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
                onClick={() => navigate(`/project/${projectId}`)}
                className="text-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  {config.icon}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{config.title}</h1>
                  <p className="text-sm text-gray-400">Step {currentStepNumber} of 8</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="border-purple-400 text-purple-400">
              {project.project_name}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Planning Progress</span>
              <span className="text-purple-400">{Math.round((currentStepNumber / 8) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${(currentStepNumber / 8) * 100}%` }}
              />
            </div>
          </div>

          {/* Main Content */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">{config.title}</CardTitle>
              <CardDescription className="text-gray-400">
                {config.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Input */}
              <div className="space-y-2">
                <Label htmlFor="userInput" className="text-gray-300">
                  Your Input
                </Label>
                <Textarea
                  id="userInput"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={config.placeholder}
                  className="min-h-[120px] bg-slate-700 border-slate-600 text-white"
                />
                <Button 
                  onClick={handleRefineWithAI}
                  disabled={isGenerating || !userInput.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {config.aiPrompt}
                    </>
                  )}
                </Button>
              </div>

              {/* AI Response */}
              {aiResponse && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">AI-Refined Output</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowConversation(!showConversation)}
                        className="border-purple-400 text-purple-400 hover:bg-purple-400/10"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {showConversation ? 'Hide' : 'Show'} Conversation
                      </Button>
                      {conversationHistory.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowConversation(true)}
                          className="border-gray-500 text-gray-400 hover:bg-gray-500/10"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {conversationHistory.length} Messages
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/50 border border-slate-600 rounded-md p-4">
                    <pre className="whitespace-pre-wrap text-gray-100 text-sm font-mono">
                      {aiResponse}
                    </pre>
                  </div>
                  
                  {/* Refinement Input */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Refine Response</Label>
                    <div className="flex space-x-2">
                      <Textarea
                        value={refinementInput}
                        onChange={(e) => setRefinementInput(e.target.value)}
                        placeholder="Ask for changes, more detail, different approach..."
                        className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
                      />
                      <Button
                        onClick={handleRefineResponse}
                        disabled={isGenerating || !refinementInput.trim()}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shrink-0"
                      >
                        {isGenerating ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Conversation History */}
                  {showConversation && conversationHistory.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-gray-300">Conversation History</Label>
                      <div className="bg-slate-800/50 border border-slate-600 rounded-md p-4 max-h-60 overflow-y-auto">
                        {conversationHistory.map((message, index) => (
                          <div key={index} className={`mb-3 p-2 rounded ${message.role === 'user' ? 'bg-blue-900/30' : 'bg-purple-900/30'}`}>
                            <div className="text-xs text-gray-400 mb-1">
                              {message.role === 'user' ? 'You' : 'AI'} • {message.timestamp.toLocaleTimeString()}
                            </div>
                            <div className="text-sm text-gray-200">
                              {message.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                <div className="flex space-x-2 items-center">
                  {getPreviousStep() && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (hasUnsavedChanges && !confirm("You have unsaved changes. Continue anyway?")) {
                          return;
                        }
                        navigate(`/project/${projectId}/step/${getPreviousStep()}`);
                      }}
                      className="border-slate-600 text-slate-300"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous Step
                    </Button>
                  )}
                  
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                      Unsaved Changes
                    </Badge>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleSave(false)}
                    disabled={isSaving || !aiResponse}
                    variant="outline"
                    className="border-green-500 text-green-400 hover:bg-green-500/10"
                  >
                    {isSaving ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Step
                      </>
                    )}
                  </Button>
                  
                  {getNextStep() ? (
                    <Button 
                      onClick={() => handleSave(true)}
                      disabled={isSaving || !aiResponse}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Save & Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleGenerateFinalDocument}
                      disabled={isSaving || !aiResponse}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Complete Planning
                      <Rocket className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}