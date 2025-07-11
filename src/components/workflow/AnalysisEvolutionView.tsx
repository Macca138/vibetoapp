'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, History, Sparkles } from 'lucide-react';
import { AnalysisIteration } from '@/lib/workflow/types';

interface AnalysisEvolutionViewProps {
  iterations: AnalysisIteration[];
  currentIteration: number;
  onViewIteration?: (index: number) => void;
  className?: string;
}

export default function AnalysisEvolutionView({
  iterations,
  currentIteration,
  onViewIteration,
  className = ""
}: AnalysisEvolutionViewProps) {
  const [showHistory, setShowHistory] = useState(false);

  if (iterations.length <= 1) {
    return null;
  }

  const currentAnalysis = iterations[currentIteration];
  const previousAnalysis = iterations[currentIteration - 1];
  
  // Handle different data structures (Step1 uses 'output', others use 'analysis')
  const getCurrentData = (iteration: AnalysisIteration) => {
    return (iteration as any).output || (iteration as any).analysis;
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'bg-gray-200 text-gray-600';
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceText = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CardTitle>Analysis Evolution</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              {showHistory ? 'Hide' : 'Show'} History
            </Button>
          </div>
          <CardDescription>
            Your analysis has improved through {iterations.length} iteration{iterations.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <Sparkles className="h-6 w-6 text-blue-500" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">
                Current Analysis (Iteration {currentIteration + 1})
              </h4>
              <p className="text-blue-700 text-sm">
                {currentAnalysis.changesFromPrevious?.length 
                  ? `${currentAnalysis.changesFromPrevious.length} improvements made`
                  : 'Initial analysis completed'
                }
              </p>
            </div>
            {getCurrentData(currentAnalysis)?.confidenceScore && (
              <Badge className={getConfidenceColor(getCurrentData(currentAnalysis).confidenceScore)}>
                {getConfidenceText(getCurrentData(currentAnalysis).confidenceScore)} Confidence
              </Badge>
            )}
            {getCurrentData(currentAnalysis)?.readyForNextStep !== undefined && (
              <Badge className={getCurrentData(currentAnalysis).readyForNextStep ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {getCurrentData(currentAnalysis).readyForNextStep ? 'Ready' : 'Needs Clarification'}
              </Badge>
            )}
          </div>

          {/* Changes from Previous */}
          {currentAnalysis.changesFromPrevious && currentAnalysis.changesFromPrevious.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Latest Improvements
              </h4>
              <ul className="space-y-1 ml-6">
                {currentAnalysis.changesFromPrevious.map((change, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Iteration History */}
          {showHistory && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <h4 className="font-semibold text-gray-900 border-t pt-4">
                Iteration History
              </h4>
              <div className="space-y-2">
                {iterations.map((iteration, index) => (
                  <div
                    key={iteration.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      index === currentIteration
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => onViewIteration?.(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === currentIteration
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {index === 0 ? 'Initial Analysis' : `Iteration ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {iteration.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCurrentData(iteration)?.confidenceScore && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getConfidenceColor(getCurrentData(iteration).confidenceScore)}`}
                          >
                            {Math.round(getCurrentData(iteration).confidenceScore * 100)}%
                          </Badge>
                        )}
                        {getCurrentData(iteration)?.readyForNextStep !== undefined && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCurrentData(iteration).readyForNextStep ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                          >
                            {getCurrentData(iteration).readyForNextStep ? 'Ready' : 'Clarification'}
                          </Badge>
                        )}
                        {index === currentIteration && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                        {onViewIteration && (
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Questions and Responses for this iteration */}
                    {iteration.questionsAsked && iteration.questionsAsked.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">Questions asked:</span> {iteration.questionsAsked.length}
                        {iteration.responsesReceived && (
                          <span className="ml-2">
                            • <span className="font-medium">Responses:</span> {Object.keys(iteration.responsesReceived).length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </m.div>
          )}

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${((currentIteration + 1) / Math.max(iterations.length, 3)) * 100}%` 
                }}
              />
            </div>
            <span className="text-sm text-gray-600 font-medium">
              {currentIteration + 1}/{Math.max(iterations.length, 3)} iterations
            </span>
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}