'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, FileText, Send, CheckCircle, Star, Gift, Sparkles } from 'lucide-react';
import { useAutoSave } from '@/hooks/useAutoSave';
import AutoSaveIndicator from '../AutoSaveIndicator';

interface Step9Data {
  documentFormat: string[];
  nextSteps: string;
  additionalHelp: string[];
  feedback: string;
}

interface ExportStatus {
  isGenerating: boolean;
  completed: string[];
  failed: string[];
  downloadLinks: Record<string, string>;
}

interface Step9Props {
  projectId: string;
  initialData?: Step9Data;
  onComplete: (data: any) => void;
  onNext: () => void;
}

export default function Step9ExportExecute({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext 
}: Step9Props) {
  const [formData, setFormData] = useState<Step9Data>({
    documentFormat: initialData?.documentFormat || [],
    nextSteps: initialData?.nextSteps || '',
    additionalHelp: initialData?.additionalHelp || [],
    feedback: initialData?.feedback || '',
  });
  
  const [exportStatus, setExportStatus] = useState<ExportStatus>({
    isGenerating: false,
    completed: [],
    failed: [],
    downloadLinks: {}
  });
  
  const [showCongratulations, setShowCongratulations] = useState(false);

  const { saveStatus, lastSaved } = useAutoSave(
    formData,
    (data) => onComplete(data),
    1000
  );

  const documentFormatOptions = [
    'PDF Report',
    'Developer Requirements Doc',
    'Business Plan Summary',
    'User Stories',
    'Technical Specifications',
    'Pitch Deck Outline'
  ];

  const nextStepsOptions = [
    'Find a developer/team',
    'Learn to code myself',
    'Seek funding/investment',
    'Create a prototype',
    'Validate with users',
    'Refine the concept more'
  ];

  const additionalHelpOptions = [
    'Finding developers',
    'Cost estimation',
    'Legal/IP advice',
    'Marketing strategy',
    'Funding guidance',
    'Technical mentorship'
  ];

  const handleDocumentFormatChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      documentFormat: checked 
        ? [...prev.documentFormat, option]
        : prev.documentFormat.filter(format => format !== option)
    }));
  };

  const handleAdditionalHelpChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      additionalHelp: checked 
        ? [...prev.additionalHelp, option]
        : prev.additionalHelp.filter(help => help !== option)
    }));
  };

  const handleInputChange = (field: keyof Step9Data, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateDocuments = async () => {
    if (!formData.documentFormat.length) {
      return;
    }

    setExportStatus(prev => ({
      ...prev,
      isGenerating: true,
      completed: [],
      failed: []
    }));

    try {
      const response = await fetch('/api/export/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          formats: formData.documentFormat,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setExportStatus(prev => ({
          ...prev,
          isGenerating: false,
          completed: result.completed || [],
          failed: result.failed || [],
          downloadLinks: result.downloadLinks || {}
        }));
        
        if (result.completed && result.completed.length > 0) {
          setShowCongratulations(true);
        }
      } else {
        setExportStatus(prev => ({
          ...prev,
          isGenerating: false,
          failed: formData.documentFormat
        }));
      }
    } catch (error) {
      console.error('Document generation failed:', error);
      setExportStatus(prev => ({
        ...prev,
        isGenerating: false,
        failed: formData.documentFormat
      }));
    }
  };

  const downloadDocument = (format: string) => {
    const link = exportStatus.downloadLinks[format];
    if (link) {
      window.open(link, '_blank');
    }
  };

  const canProceed = formData.documentFormat.length > 0 && formData.nextSteps.length > 0;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Export & Execute</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Congratulations! Let's package everything into actionable documentation 
            and prepare you for the next phase of your app development journey.
          </p>
        </motion.div>
      </div>

      {showCongratulations && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Gift className="h-5 w-5" />
                🎉 Congratulations!
              </CardTitle>
              <CardDescription className="text-purple-600">
                You've successfully completed the 9-step VibeToApp workflow! Your app idea is now ready for development.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">9</div>
                  <div className="text-sm text-gray-600">Steps Completed</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{exportStatus.completed.length}</div>
                  <div className="text-sm text-gray-600">Documents Generated</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">Ready</div>
                  <div className="text-sm text-gray-600">For Development</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Export Formats
            </CardTitle>
            <CardDescription>
              Choose which formats you'd like to export your app specification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentFormatOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={formData.documentFormat.includes(option)}
                  onCheckedChange={(checked) => handleDocumentFormatChange(option, checked as boolean)}
                />
                <Label htmlFor={option} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {option}
                </Label>
              </div>
            ))}
            
            {formData.documentFormat.length > 0 && (
              <div className="pt-4">
                <Button 
                  onClick={generateDocuments}
                  disabled={exportStatus.isGenerating}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {exportStatus.isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Documents...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate Documents
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {(exportStatus.completed.length > 0 || exportStatus.failed.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Your Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exportStatus.completed.map((format) => (
                  <div key={format} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{format}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => downloadDocument(format)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
                
                {exportStatus.failed.map((format) => (
                  <div key={format} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-red-600 rounded-full" />
                      <span className="text-sm font-medium">{format}</span>
                    </div>
                    <span className="text-sm text-red-600">Failed to generate</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Next Steps
              </CardTitle>
              <CardDescription>
                What's your next step with this app specification?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={formData.nextSteps} onValueChange={(value) => handleInputChange('nextSteps', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your next step" />
                </SelectTrigger>
                <SelectContent>
                  {nextStepsOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-500 mt-2">
                What will you do with this specification?
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Additional Help
              </CardTitle>
              <CardDescription>
                What additional help do you need?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {additionalHelpOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={formData.additionalHelp.includes(option)}
                    onCheckedChange={(checked) => handleAdditionalHelpChange(option, checked as boolean)}
                  />
                  <Label htmlFor={option} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {option}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Feedback
            </CardTitle>
            <CardDescription>
              How was your VibeToApp experience?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="This process helped me clarify my app idea, understand the technical requirements, and create a clear roadmap for development..."
              value={formData.feedback}
              onChange={(e) => handleInputChange('feedback', e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="text-sm text-gray-500 mt-2">
              Share your thoughts on this workflow ({formData.feedback.length}/500)
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {formData.nextSteps && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Recommended Next Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formData.nextSteps === 'Find a developer/team' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">🔍 Finding the Right Developer/Team:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Use your technical specifications document to brief potential developers</li>
                      <li>• Consider platforms like Upwork, Toptal, or local development agencies</li>
                      <li>• Ask for portfolio examples similar to your app requirements</li>
                      <li>• Budget 10-20% more than initial estimates for unexpected requirements</li>
                    </ul>
                  </div>
                )}
                
                {formData.nextSteps === 'Learn to code myself' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">📚 Learning to Code:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Start with your recommended tech stack from Step 6</li>
                      <li>• Consider online courses (Coursera, Udemy, freeCodeCamp)</li>
                      <li>• Build smaller projects before tackling your main app</li>
                      <li>• Join developer communities and forums for support</li>
                    </ul>
                  </div>
                )}
                
                {formData.nextSteps === 'Seek funding/investment' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">💰 Seeking Funding:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Use your business plan summary and pitch deck outline</li>
                      <li>• Consider angel investors, VCs, or startup accelerators</li>
                      <li>• Prepare for questions about market size, competition, and revenue model</li>
                      <li>• Consider bootstrapping with a simpler MVP first</li>
                    </ul>
                  </div>
                )}
                
                {formData.nextSteps === 'Create a prototype' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">🎯 Creating a Prototype:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Use your user flow mapping and wireframes as a starting point</li>
                      <li>• Consider tools like Figma, Sketch, or Adobe XD</li>
                      <li>• Focus on core user journeys first</li>
                      <li>• Test with potential users early and iterate</li>
                    </ul>
                  </div>
                )}
                
                {formData.nextSteps === 'Validate with users' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">✅ User Validation:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Use your target user personas to find test subjects</li>
                      <li>• Create surveys or conduct interviews about your concept</li>
                      <li>• Test your prototype with 5-10 potential users</li>
                      <li>• Iterate based on feedback before development</li>
                    </ul>
                  </div>
                )}
                
                {formData.nextSteps === 'Refine the concept more' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">🔄 Refining Your Concept:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Review your workflow responses and identify gaps</li>
                      <li>• Research competitors more thoroughly</li>
                      <li>• Consider conducting market research or user interviews</li>
                      <li>• You can always return to refine specific steps</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex justify-between items-center pt-8">
        <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
        
        <div className="flex gap-4">
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
          >
            Back to Dashboard
          </Button>
          <Button 
            onClick={() => setShowCongratulations(true)}
            disabled={!canProceed}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Complete Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}