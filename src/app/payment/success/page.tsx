'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { m } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  const paymentType = searchParams.get('type');
  const projectId = searchParams.get('projectId');
  const plan = searchParams.get('plan');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      // Small delay to ensure webhook has processed
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status, router]);

  const getSuccessMessage = () => {
    switch (paymentType) {
      case 'project':
        return {
          title: 'Project Unlocked!',
          description: 'Your project has been successfully unlocked with full AI workflow access.',
          nextAction: 'Continue to Project',
          nextUrl: projectId ? `/projects/${projectId}` : '/dashboard',
        };
      case 'subscription':
        return {
          title: `${plan === 'monthly' ? 'Monthly' : 'Yearly'} Subscription Activated!`,
          description: 'You now have unlimited access to all AI-powered workflows and features.',
          nextAction: 'Go to Dashboard',
          nextUrl: '/dashboard',
        };
      default:
        return {
          title: 'Payment Successful!',
          description: 'Your payment has been processed successfully.',
          nextAction: 'Go to Dashboard',
          nextUrl: '/dashboard',
        };
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white text-lg">Processing your payment...</p>
          <p className="text-gray-300 text-sm mt-2">Please wait while we confirm your transaction.</p>
        </div>
      </div>
    );
  }

  const { title, description, nextAction, nextUrl } = getSuccessMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center"
      >
        {/* Success Icon */}
        <div
          className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        {/* Success Message */}
        <m.h1
          className="text-2xl font-bold text-gray-900 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {title}
        </m.h1>

        <m.p
          className="text-gray-600 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {description}
        </m.p>

        {/* User Info */}
        {session?.user && (
          <div
            className="bg-gray-50 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-gray-600">
              Payment confirmed for
            </p>
            <p className="font-semibold text-gray-900">
              {session.user.name || session.user.email}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link
              href={nextUrl}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
            >
              {nextAction}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>

          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link
              href="/pricing"
              className="w-full inline-flex items-center justify-center px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              View Pricing Plans
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div
          className="mt-8 pt-6 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-xs text-gray-500">
            You will receive an email confirmation shortly. If you have any questions, 
            please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}