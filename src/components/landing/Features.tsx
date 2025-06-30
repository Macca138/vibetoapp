'use client';

import { motion } from 'framer-motion';
import { fadeInUp, scaleIn, containerVariants } from '@/lib/animations';

const features = [
  {
    step: 1,
    name: 'Describe Your Idea',
    description: 'Start with a simple description of your app idea, no matter how vague or rough.',
  },
  {
    step: 2,
    name: 'Define Core Purpose',
    description: 'AI helps you clarify the main problem your app solves and its core value proposition.',
  },
  {
    step: 3,
    name: 'Identify Target Users',
    description: 'Discover and define your ideal users with AI-powered persona generation.',
  },
  {
    step: 4,
    name: 'Feature Discovery',
    description: 'Brainstorm and prioritize features that deliver maximum value to your users.',
  },
  {
    step: 5,
    name: 'User Flow Mapping',
    description: 'Create intuitive user journeys and interaction flows for seamless experiences.',
  },
  {
    step: 6,
    name: 'Technical Architecture',
    description: 'Get AI recommendations for tech stack, integrations, and system design.',
  },
  {
    step: 7,
    name: 'Revenue Model',
    description: 'Explore monetization strategies tailored to your app and target market.',
  },
  {
    step: 8,
    name: 'MVP Definition',
    description: 'Define your minimum viable product with clear milestones and priorities.',
  },
  {
    step: 9,
    name: 'Export & Execute',
    description: 'Export your complete app specification in multiple formats ready for development.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div 
          className="mx-auto max-w-2xl text-center"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.h2 
            className="text-base font-semibold leading-7 text-indigo-600"
            variants={fadeInUp}
          >
            AI-Powered Workflow
          </motion.h2>
          <motion.p 
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            variants={fadeInUp}
          >
            Your 9-Step Journey to App Success
          </motion.p>
          <motion.p 
            className="mt-6 text-lg leading-8 text-gray-600"
            variants={fadeInUp}
          >
            Our proven process guides you from initial concept to development-ready specifications
          </motion.p>
        </motion.div>
        
        <motion.div 
          className="mx-auto mt-16 max-w-7xl"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <motion.div 
                key={feature.step} 
                className="relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                variants={scaleIn}
                whileHover={{
                  y: -8,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  transition: { duration: 0.3, ease: 'easeOut' }
                }}
              >
                <div className="flex items-center gap-x-4">
                  <motion.div 
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-white font-semibold">{feature.step}</span>
                  </motion.div>
                  <h3 className="text-lg font-semibold leading-7 text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                    {feature.name}
                  </h3>
                </div>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}