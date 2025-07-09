'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Rocket, Target, Calendar, TrendingUp, CheckCircle, AlertCircle, Users, Zap } from 'lucide-react';
import { useAutoSave } from '@/hooks/useAutoSave';
import AutoSaveIndicator from '../AutoSaveIndicator';

interface Step8Data {
  mvpScope: string;
  successMetrics: string;
  developmentTimeline: string;
  launchStrategy: string;
  postLaunchPlans: string;
}

interface MVPAnalysis {
  scopeAnalysis: {
    coreFeatures: Array<{
      feature: string;
      priority: string;
      complexity: string;
      estimatedEffort: string;
      userValue: string;
    }>;
    featuresRecommendations: {
      essential: string[];
      consider: string[];
      defer: string[];
    };
    scopeRisk: {
      riskLevel: string;
      concerns: string[];
      mitigations: string[];
    };
  };
  timelineAnalysis: {
    developmentPhases: Array<{
      phase: string;
      duration: string;
      deliverables: string[];
      dependencies: string[];
      risks: string[];
    }>;
    criticalPath: string[];
    bufferRecommendations: string;
    teamRequirements: {
      roles: string[];
      skills: string[];
      teamSize: string;
    };
  };
  launchStrategy: {
    prelaunchActivities: Array<{
      activity: string;
      timeline: string;
      importance: string;
      description: string;
    }>;
    launchChannels: Array<{
      channel: string;
      effectiveness: string;
      cost: string;
      timeline: string;
    }>;
    successProbability: {
      score: number;
      factors: string[];
      improvements: string[];
    };
  };
  metricsFramework: {
    kpiCategories: Array<{
      category: string;
      metrics: Array<{
        metric: string;
        target: string;
        measurement: string;
        importance: string;
      }>;
    }>;
    trackingRecommendations: string[];
    reportingSchedule: string;
  };
}

interface Step8Props {
  projectId: string;
  initialData?: Step8Data;
  onComplete: (data: any) => void;
  onNext: () => void;
}

export default function Step8MVPDefinition({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext 
}: Step8Props) {
  const [formData, setFormData] = useState<Step8Data>({
    mvpScope: initialData?.mvpScope || '',
    successMetrics: initialData?.successMetrics || '',
    developmentTimeline: initialData?.developmentTimeline || '',
    launchStrategy: initialData?.launchStrategy || '',
    postLaunchPlans: initialData?.postLaunchPlans || '',
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<MVPAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const { saveStatus, lastSaved } = useAutoSave(
    formData,
    (data) => onComplete(data),
    1000
  );

  const handleInputChange = (field: keyof Step8Data, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const analyzeMVP = async () => {
    if (!formData.mvpScope.trim() || !formData.successMetrics.trim()) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai/analyze-mvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          mvpData: formData,
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        setAiAnalysis(analysis);
        setShowAnalysis(true);
      }
    } catch (error) {
      console.error('MVP analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceed = formData.mvpScope.trim().length > 0 && formData.successMetrics.trim().length > 0;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Rocket className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">MVP Definition</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Define your minimum viable product with clear milestones and priorities. 
            Let's create a roadmap that gets you to market quickly and efficiently.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              MVP Scope
            </CardTitle>
            <CardDescription>
              What will be included in your minimum viable product?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Core features for version 1.0: user authentication, basic dashboard, core functionality X, Y, Z..."
              value={formData.mvpScope}
              onChange={(e) => handleInputChange('mvpScope', e.target.value)}
              className="min-h-[120px]"
              maxLength={600}
              required
            />
            <div className="text-sm text-gray-500 mt-2">
              Minimum features needed to validate your concept ({formData.mvpScope.length}/600)
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Success Metrics
            </CardTitle>
            <CardDescription>
              How will you measure MVP success?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="User signups: 1000+ in first month, engagement rate: 40%+, retention: 20% after 30 days, revenue: $1000+ MRR..."
              value={formData.successMetrics}
              onChange={(e) => handleInputChange('successMetrics', e.target.value)}
              className="min-h-[120px]"
              maxLength={400}
              required
            />
            <div className="text-sm text-gray-500 mt-2">
              Key metrics to track your app's performance ({formData.successMetrics.length}/400)
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Development Timeline
              </CardTitle>
              <CardDescription>
                What's your target timeline for development?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="3 months for MVP development, 1 month for testing, 2 weeks for launch preparation..."
                value={formData.developmentTimeline}
                onChange={(e) => handleInputChange('developmentTimeline', e.target.value)}
                className="min-h-[100px]"
                maxLength={300}
              />
              <div className="text-sm text-gray-500 mt-2">
                Realistic timeline for development and launch ({formData.developmentTimeline.length}/300)
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Launch Strategy
              </CardTitle>
              <CardDescription>
                How will you launch and promote your app?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Beta testing with 50 users, social media campaign, product hunt launch, email marketing, influencer outreach..."
                value={formData.launchStrategy}
                onChange={(e) => handleInputChange('launchStrategy', e.target.value)}
                className="min-h-[100px]"
                maxLength={500}
              />
              <div className="text-sm text-gray-500 mt-2">
                Your go-to-market strategy ({formData.launchStrategy.length}/500)
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Post-Launch Plans
            </CardTitle>
            <CardDescription>
              What are your plans after launching the MVP?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Feature updates based on user feedback, performance optimization, user acquisition campaigns, v2 feature development..."
              value={formData.postLaunchPlans}
              onChange={(e) => handleInputChange('postLaunchPlans', e.target.value)}
              className="min-h-[100px]"
              maxLength={400}
            />
            <div className="text-sm text-gray-500 mt-2">
              How will you iterate after launch ({formData.postLaunchPlans.length}/400)
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {canProceed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                AI MVP Analysis
              </CardTitle>
              <CardDescription>
                Get AI-powered insights on your MVP strategy and timeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={analyzeMVP}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing MVP Strategy...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Analyze MVP Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {showAnalysis && aiAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Scope Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Essential Features</h4>
                    <ul className="text-sm space-y-1">
                      {aiAnalysis.scopeAnalysis.featuresRecommendations.essential.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-600 mb-2">Consider</h4>
                    <ul className="text-sm space-y-1">
                      {aiAnalysis.scopeAnalysis.featuresRecommendations.consider.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">Defer</h4>
                    <ul className="text-sm space-y-1">
                      {aiAnalysis.scopeAnalysis.featuresRecommendations.defer.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Scope Risk: {aiAnalysis.scopeAnalysis.scopeRisk.riskLevel}</h4>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">Concerns:</span>
                      <ul className="ml-4 mt-1">
                        {aiAnalysis.scopeAnalysis.scopeRisk.concerns.map((concern, index) => (
                          <li key={index} className="list-disc">{concern}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium">Mitigations:</span>
                      <ul className="ml-4 mt-1">
                        {aiAnalysis.scopeAnalysis.scopeRisk.mitigations.map((mitigation, index) => (
                          <li key={index} className="list-disc">{mitigation}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Development Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiAnalysis.timelineAnalysis.developmentPhases.map((phase, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="font-semibold">{phase.phase} - {phase.duration}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div><strong>Deliverables:</strong> {phase.deliverables.join(', ')}</div>
                        {phase.dependencies.length > 0 && (
                          <div><strong>Dependencies:</strong> {phase.dependencies.join(', ')}</div>
                        )}
                        {phase.risks.length > 0 && (
                          <div className="text-red-600"><strong>Risks:</strong> {phase.risks.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-semibold text-blue-800">Buffer Recommendations</div>
                    <div className="text-sm text-blue-700">{aiAnalysis.timelineAnalysis.bufferRecommendations}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Launch Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="font-semibold text-green-800">
                      Success Probability: {aiAnalysis.launchStrategy.successProbability.score}/10
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      <div><strong>Success Factors:</strong></div>
                      <ul className="ml-4 mt-1">
                        {aiAnalysis.launchStrategy.successProbability.factors.map((factor, index) => (
                          <li key={index} className="list-disc">{factor}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Recommended Channels</h4>
                    <div className="space-y-2">
                      {aiAnalysis.launchStrategy.launchChannels.map((channel, index) => (
                        <div key={index} className="text-sm border-l-4 border-green-500 pl-3">
                          <div className="font-medium">{channel.channel}</div>
                          <div className="text-gray-600">
                            Effectiveness: {channel.effectiveness} | Cost: {channel.cost}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between items-center pt-8">
        <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
        
        <div className="flex gap-4">
          <Button 
            onClick={onNext}
            disabled={!canProceed}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continue to Export & Execute
          </Button>
        </div>
      </div>
    </div>
  );
}