'use client';

import { useState, useEffect, useRef } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Send, Bot, User, CheckCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  stepId: number;
  stepTitle: string;
  stepDescription: string;
  projectId: string;
  initialData?: any;
  onStepComplete: (data: any) => void;
  onNext: () => void;
  onPrevious?: () => void;
}

export default function ChatWindow({
  stepId,
  stepTitle,
  stepDescription,
  projectId,
  initialData,
  onStepComplete,
  onNext,
  onPrevious
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [stepOutput, setStepOutput] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: `welcome-${stepId}`,
      role: 'system',
      content: `Welcome to ${stepTitle}! ${stepDescription}`,
      timestamp: new Date()
    };

    // Add initial agent message based on step
    const agentMessage: Message = {
      id: `agent-${stepId}`,
      role: 'assistant',
      content: getInitialAgentMessage(stepId),
      timestamp: new Date()
    };

    setMessages([welcomeMessage, agentMessage]);
  }, [stepId, stepTitle, stepDescription]);

  const getInitialAgentMessage = (stepId: number): string => {
    const agentMessages = {
      1: "Hi! I'm your Prompt Generator expert. I specialize in helping you articulate and refine your app ideas. Tell me about your app concept - what problem does it solve and who would use it?",
      2: "Hello! I'm your SaaS Founder advisor. I'll help you develop a solid business strategy for your app. Based on your initial idea, let's define your value proposition and core features.",
      3: "Hey there! I'm your Senior Software Engineer. I'll design the technical architecture for your app. Let's discuss your technical requirements and scalability needs.",
      4: "Hi! I'm your Product Designer and Manager. I'll help you create detailed user stories and UX flows. Let's break down your features into user-centered requirements.",
      5: "Hello! I'm your Industry-Veteran Designer. I'll create a comprehensive design system for your app. Let's establish your visual identity and style guide.",
      6: "Hi! I'm your Senior Product Designer. I'll specify detailed screen states and interactions. Let's define how each screen will look and behave.",
      7: "Hello! I'm your Software Architect. I'll create implementation-ready technical specifications. Let's document everything developers need to build your app.",
      8: "Hi! I'm your Development Standards expert. I'll integrate best practices and coding standards. Let's establish development rules for your tech stack.",
      9: "Hello! I'm your AI Implementation Engineer. I'll create a detailed implementation plan. Let's break down your project into actionable development tasks."
    };
    return agentMessages[stepId] || "Hello! I'm your AI assistant for this step.";
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/workflow/step${stepId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          message: input,
          previousMessages: messages,
          stepId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const result = await response.json();
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if step is complete
      if (result.stepComplete) {
        setIsComplete(true);
        setStepOutput(result.stepOutput);
        onStepComplete(result.stepOutput);
        
        // Add completion message
        const completionMessage: Message = {
          id: `completion-${Date.now()}`,
          role: 'system',
          content: "Great! This step is complete. Review the analysis above and click 'Continue to Next Step' when you're ready to proceed.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completionMessage]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{stepTitle}</h2>
        <p className="text-gray-600">{stepDescription}</p>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 p-4 overflow-y-auto min-h-0">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.role === 'system'
                      ? 'bg-gray-100 text-gray-700 border'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <Bot className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    )}
                    {message.role === 'user' && (
                      <User className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-blue-500" />
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex-shrink-0 flex justify-between items-center mt-4">
        <div>
          {onPrevious && (
            <Button onClick={onPrevious} variant="outline" className="px-6">
              ← Previous Step
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {isComplete && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Step Complete</span>
            </div>
          )}
          <Button
            onClick={onNext}
            disabled={!isComplete}
            className="px-6"
          >
            Continue to Next Step →
          </Button>
        </div>
      </div>
    </div>
  );
}