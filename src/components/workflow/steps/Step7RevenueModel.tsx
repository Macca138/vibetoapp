'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, DollarSign, TrendingUp, Target, CreditCard, PiggyBank, Users, Zap } from 'lucide-react';
import { useAutoSave } from '@/hooks/useAutoSave';
import AutoSaveIndicator from '../AutoSaveIndicator';

interface Step7Data {
  revenueModel: string[];
  pricingStrategy: string;
  valueJustification: string;
  competitorPricing: string;
}

interface RevenueAnalysis {
  recommendedStrategy: {
    primaryModel: string;
    reasoning: string;
    fitScore: number;
    implementationDifficulty: string;
    timeToRevenue: string;
    expectedRevenue: string;
  };
  pricingRecommendations: {
    suggestedPricing: {
      model: string;
      price: string;
      reasoning: string;
      marketPosition: string;
    }[];
    pricingConsiderations: string[];
    testingStrategy: string;
  };
  monetizationRoadmap: {
    phase1: {
      timeline: string;
      focus: string;
      expectedRevenue: string;
      keyMetrics: string[];
    };
    phase2: {
      timeline: string;
      focus: string;
      expectedRevenue: string;
      optimizations: string[];
    };
    phase3: {
      timeline: string;
      focus: string;
      expectedRevenue: string;
      advancedFeatures: string[];
    };
  };
  competitiveAnalysis: {
    marketOverview: string;
    competitorPricing: Array<{
      competitor: string;
      model: string;
      pricing: string;
      strengths: string[];
      weaknesses: string[];
    }>;
    positioning: string;
    differentiationOpportunities: string[];
  };
}

interface Step7Props {
  projectId: string;
  initialData?: Step7Data;
  onComplete: (data: any) => void;
  onNext: () => void;
}

export default function Step7RevenueModel({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext 
}: Step7Props) {
  const [formData, setFormData] = useState<Step7Data>({
    revenueModel: initialData?.revenueModel || [],
    pricingStrategy: initialData?.pricingStrategy || '',
    valueJustification: initialData?.valueJustification || '',
    competitorPricing: initialData?.competitorPricing || '',
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<RevenueAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const { saveStatus, lastSaved } = useAutoSave(
    formData,
    (data) => onComplete(data),
    1000
  );

  const revenueModelOptions = [
    'Freemium (Free with premium features)',
    'Subscription (Monthly/yearly)',
    'One-time purchase',
    'In-app purchases',
    'Advertising',
    'Commission/Transaction fees',
    'Enterprise/B2B sales'
  ];

  const handleRevenueModelChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      revenueModel: checked 
        ? [...prev.revenueModel, option]
        : prev.revenueModel.filter(model => model !== option)
    }));
  };

  const handleInputChange = (field: keyof Step7Data, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const analyzeRevenue = async () => {
    if (!formData.revenueModel.length || !formData.valueJustification.trim()) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai/analyze-revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          revenueData: formData,
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        setAiAnalysis(analysis);
        setShowAnalysis(true);
      }
    } catch (error) {
      console.error('Revenue analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceed = formData.revenueModel.length > 0 && formData.valueJustification.trim().length > 0;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Revenue Model</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore monetization strategies tailored to your app and target market. 
            Let's determine how your app will generate sustainable revenue.
          </p>
        </m.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Models
              </CardTitle>
              <CardDescription>
                Select all monetization strategies you're considering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {revenueModelOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={formData.revenueModel.includes(option)}
                    onCheckedChange={(checked) => handleRevenueModelChange(option, checked as boolean)}
                  />
                  <Label htmlFor={option} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {option}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </m.div>

        <m.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pricing Strategy
              </CardTitle>
              <CardDescription>
                What pricing are you considering for your app?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="$9.99/month, $99/year, $2.99 one-time..."
                value={formData.pricingStrategy}
                onChange={(e) => handleInputChange('pricingStrategy', e.target.value)}
                className="min-h-[100px]"
                maxLength={300}
              />
              <div className="text-sm text-gray-500 mt-2">
                Rough pricing ideas for your monetization ({formData.pricingStrategy.length}/300)
              </div>
            </CardContent>
          </Card>
        </m.div>
      </div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Value Justification
            </CardTitle>
            <CardDescription>
              Why would users pay for your app? What value justifies the cost?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Users will pay because it saves them time, increases productivity, solves a major pain point..."
              value={formData.valueJustification}
              onChange={(e) => handleInputChange('valueJustification', e.target.value)}
              className="min-h-[120px]"
              maxLength={500}
              required
            />
            <div className="text-sm text-gray-500 mt-2">
              Focus on the unique value your app provides ({formData.valueJustification.length}/500)
            </div>
          </CardContent>
        </Card>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Competitor Pricing
            </CardTitle>
            <CardDescription>
              How do similar apps price their solutions?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Similar apps charge $5-15/month, most offer free trials, premium features cost extra..."
              value={formData.competitorPricing}
              onChange={(e) => handleInputChange('competitorPricing', e.target.value)}
              className="min-h-[100px]"
              maxLength={400}
            />
            <div className="text-sm text-gray-500 mt-2">
              Research on existing market pricing ({formData.competitorPricing.length}/400)
            </div>
          </CardContent>
        </Card>
      </m.div>

      {canProceed && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                AI Revenue Analysis
              </CardTitle>
              <CardDescription>
                Get AI-powered insights on your monetization strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={analyzeRevenue}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Revenue Strategy...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Analyze Revenue Model
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </m.div>
      )}

      {showAnalysis && aiAnalysis && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-green-600" />
                Recommended Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-700">{aiAnalysis.recommendedStrategy.primaryModel}</h4>
                  <p className="text-gray-600 mt-1">{aiAnalysis.recommendedStrategy.reasoning}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Fit Score:</span>
                    <div className="text-green-600 font-bold">{aiAnalysis.recommendedStrategy.fitScore}/10</div>
                  </div>
                  <div>
                    <span className="font-medium">Difficulty:</span>
                    <div className="text-blue-600">{aiAnalysis.recommendedStrategy.implementationDifficulty}</div>
                  </div>
                  <div>
                    <span className="font-medium">Time to Revenue:</span>
                    <div className="text-purple-600">{aiAnalysis.recommendedStrategy.timeToRevenue}</div>
                  </div>
                  <div>
                    <span className="font-medium">Expected Revenue:</span>
                    <div className="text-green-600 font-bold">{aiAnalysis.recommendedStrategy.expectedRevenue}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiAnalysis.pricingRecommendations.suggestedPricing.map((pricing, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="font-semibold">{pricing.model}: {pricing.price}</div>
                      <div className="text-sm text-gray-600">{pricing.reasoning}</div>
                      <div className="text-xs text-blue-600 mt-1">Market Position: {pricing.marketPosition}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monetization Roadmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(aiAnalysis.monetizationRoadmap).map(([phase, data]) => (
                    <div key={phase} className="border-l-4 border-green-500 pl-4">
                      <div className="font-semibold capitalize">{phase}: {data.timeline}</div>
                      <div className="text-sm text-gray-600">{data.focus}</div>
                      <div className="text-xs text-green-600 mt-1">Target: {data.expectedRevenue}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </m.div>
      )}

      <div className="flex justify-between items-center pt-8">
        <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
        
        <div className="flex gap-4">
          <Button 
            onClick={onNext}
            disabled={!canProceed}
            className="bg-green-600 hover:bg-green-700"
          >
            Continue to MVP Definition
          </Button>
        </div>
      </div>
    </div>
  );
}