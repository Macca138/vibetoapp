import { Brain, Lightbulb, Rocket, Target, Code, Palette, Settings, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/auth/AuthProvider";


export default function LandingPage() {
  const { login } = useAuthContext();

  const handleGetStarted = () => {
    login();
  };

  const steps = [
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Idea Fleshing Out",
      description: "Transform your rough idea into a precise execution plan"
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "Technical Structure", 
      description: "Design your app's architecture with AI guidance"
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Feature Stories",
      description: "Detail user stories and UX/UI considerations"
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: "State & Style",
      description: "Define your comprehensive design system"
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Technical Specification",
      description: "Create detailed API designs and data schemas"
    },
    {
      icon: <CircleCheck className="h-6 w-6" />,
      title: "Rules & Constraints",
      description: "Define business rules and system constraints"
    },
    {
      icon: <Rocket className="h-6 w-6" />,
      title: "Implementation Plan",
      description: "Generate a step-by-step development roadmap"
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Final Review",
      description: "Synthesize everything into a polished specification"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">Vibe Coder</span>
          </div>
          <Button onClick={handleGetStarted} className="bg-purple-600 hover:bg-purple-700 text-white border-0">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Transform Vague Ideas into 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {" "}Concrete Plans
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Stop jumping into development without a plan. Our AI-powered 8-step methodology 
            guides you from rough concepts to detailed, actionable project specifications.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="text-lg px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
          >
            Start Planning Now
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Why Most "Vibe Coders" Fail
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-red-400">Scope Creep</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Projects spiral out of control without clear boundaries and constraints
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-red-400">Context Switching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Constantly jumping between planning tools and AI assistants creates friction
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-red-400">Unfinished Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Without structured guidance, ideas become abandoned "half-hearted" results
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 8-Step Process */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            The 8-Step Planning Journey
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                      {step.icon}
                    </div>
                    <div>
                      <div className="text-sm text-purple-400 font-medium">
                        Step {index + 1}
                      </div>
                      <CardTitle className="text-white text-sm">
                        {step.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Build with Confidence
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-left">
              <h3 className="text-xl font-semibold text-purple-400 mb-4">Integrated AI Assistance</h3>
              <p className="text-gray-300">
                No more context switching. Get AI refinement at every step without leaving the platform.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-purple-400 mb-4">Proven Methodology</h3>
              <p className="text-gray-300">
                Our 8-step process prevents common failure patterns and ensures focused development.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-purple-400 mb-4">Export-Ready Specs</h3>
              <p className="text-gray-300">
                Generate comprehensive project specifications ready for development teams.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-purple-400 mb-4">Constraint-Driven</h3>
              <p className="text-gray-300">
                Define clear boundaries that keep your project on track and prevent scope creep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Plan Like a Pro?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of vibe coders who've transformed their chaotic ideas into successful projects.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="text-lg px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
          >
            Start Your First Project
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-slate-700">
        <div className="text-center text-gray-400">
          <p>&copy; 2025 Vibe Coder. Transform ideas into reality.</p>
        </div>
      </footer>
    </div>
  );
}