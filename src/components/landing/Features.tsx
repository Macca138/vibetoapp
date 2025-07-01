'use client';

import { m } from 'framer-motion';
import { fadeInUp, scaleIn, containerVariants } from '@/lib/animations';
import { 
  Lightbulb, 
  Target, 
  Users, 
  Layers, 
  GitBranch, 
  Code, 
  DollarSign, 
  Rocket, 
  FileText 
} from 'lucide-react';

const features = [
  {
    step: 1,
    icon: <Lightbulb className="h-6 w-6" />,
    name: 'Describe Your Idea',
    description: 'Start with a simple description of your app idea, no matter how vague or rough.',
  },
  {
    step: 2,
    icon: <Target className="h-6 w-6" />,
    name: 'Define Core Purpose',
    description: 'AI helps you clarify the main problem your app solves and its core value proposition.',
  },
  {
    step: 3,
    icon: <Users className="h-6 w-6" />,
    name: 'Identify Target Users',
    description: 'Discover and define your ideal users with AI-powered persona generation.',
  },
  {
    step: 4,
    icon: <Layers className="h-6 w-6" />,
    name: 'Feature Discovery',
    description: 'Brainstorm and prioritize features that deliver maximum value to your users.',
  },
  {
    step: 5,
    icon: <GitBranch className="h-6 w-6" />,
    name: 'User Flow Mapping',
    description: 'Create intuitive user journeys and interaction flows for seamless experiences.',
  },
  {
    step: 6,
    icon: <Code className="h-6 w-6" />,
    name: 'Technical Architecture',
    description: 'Get AI recommendations for tech stack, integrations, and system design.',
  },
  {
    step: 7,
    icon: <DollarSign className="h-6 w-6" />,
    name: 'Revenue Model',
    description: 'Explore monetization strategies tailored to your app and target market.',
  },
  {
    step: 8,
    icon: <Rocket className="h-6 w-6" />,
    name: 'MVP Definition',
    description: 'Define your minimum viable product with clear milestones and priorities.',
  },
  {
    step: 9,
    icon: <FileText className="h-6 w-6" />,
    name: 'Export & Execute',
    description: 'Export your complete app specification in multiple formats ready for development.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <m.div 
          className="mx-auto max-w-2xl text-center"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <m.h2 
            className="text-base font-semibold leading-7 text-purple-400"
            variants={fadeInUp}
          >
            AI-Powered Workflow
          </m.h2>
          <m.p 
            className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl"
            variants={fadeInUp}
          >
            The 9-Step Planning Journey
          </m.p>
          <m.p 
            className="mt-6 text-lg leading-8 text-gray-300"
            variants={fadeInUp}
          >
            Our proven process guides you from initial concept to development-ready specifications
          </m.p>
        </m.div>
        
        <m.div 
          className="mx-auto mt-16 max-w-7xl"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <m.div 
                key={feature.step} 
                className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl hover:bg-slate-800/70 transition-colors cursor-pointer group"
                variants={scaleIn}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.3, ease: 'easeOut' }
                }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                    {feature.icon}
                  </div>
                  <div>
                    <div className="text-sm text-purple-400 font-medium">
                      Step {feature.step}
                    </div>
                    <h3 className="text-white text-sm font-semibold">
                      {feature.name}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-6">
                  {feature.description}
                </p>
              </m.div>
            ))}
          </div>
        </m.div>
      </div>
    </section>
  );
}