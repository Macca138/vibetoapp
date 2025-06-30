'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import WaitlistForm from './WaitlistForm';
import { fadeInUp, fadeIn, containerVariants } from '@/lib/animations';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div 
          className="mx-auto max-w-2xl text-center"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          <motion.h1 
            className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
            variants={fadeInUp}
          >
            Transform Your App Ideas Into Reality
          </motion.h1>
          <motion.p 
            className="mt-6 text-lg leading-8 text-gray-600"
            variants={fadeInUp}
          >
            VibeToApp guides you through a powerful 9-step AI-powered workflow to articulate, 
            refine, and perfect your app concept. From vague ideas to detailed specifications.
          </motion.p>
          
          {/* Waitlist Form for Hero */}
          <motion.div className="mt-10" variants={fadeIn}>
            <p className="text-sm font-semibold text-gray-900 mb-4">
              Join the waitlist to get early access
            </p>
            <div className="flex justify-center">
              <WaitlistForm source="hero" />
            </div>
          </motion.div>
          
          <motion.div 
            className="mt-6 flex items-center justify-center gap-x-6"
            variants={fadeInUp}
          >
            <Link
              href="#features"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-indigo-600 transition-colors duration-200"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/auth/signin"
              className="text-sm font-semibold leading-6 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Already have an account?
            </Link>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
    </section>
  );
}