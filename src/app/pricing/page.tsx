'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { m } from 'framer-motion';
import { Check, Star, Zap, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { PRICING_PLANS, formatCurrency } from '@/lib/pricing';

interface PricingCardProps {
  plan: keyof typeof PRICING_PLANS;
  planData: typeof PRICING_PLANS[keyof typeof PRICING_PLANS];
  isPopular?: boolean;
  isLoading?: boolean;
  onSelect: (plan: keyof typeof PRICING_PLANS) => void;
}

function PricingCard({ plan, planData, isPopular, isLoading, onSelect }: PricingCardProps) {
  const getIcon = () => {
    switch (plan) {
      case 'PROJECT_UNLOCK':
        return <Zap className="w-8 h-8" />;
      case 'MONTHLY_SUBSCRIPTION':
        return <Star className="w-8 h-8" />;
      case 'YEARLY_SUBSCRIPTION':
        return <Crown className="w-8 h-8" />;
      default:
        return <Zap className="w-8 h-8" />;
    }
  };

  const getButtonText = () => {
    switch (plan) {
      case 'PROJECT_UNLOCK':
        return 'Unlock Project';
      case 'MONTHLY_SUBSCRIPTION':
        return 'Start Monthly Plan';
      case 'YEARLY_SUBSCRIPTION':
        return 'Start Yearly Plan';
      default:
        return 'Get Started';
    }
  };

  return (
    <m.div
      className={`relative bg-white rounded-2xl border-2 p-8 transition-all duration-300 hover:shadow-2xl ${
        isPopular 
          ? 'border-purple-500 shadow-xl scale-105' 
          : 'border-gray-200 hover:border-purple-300'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </div>
        </div>
      )}

      <div className="text-center">
        {/* Icon */}
        <div className={`inline-flex p-3 rounded-full mb-4 ${
          isPopular 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {getIcon()}
        </div>

        {/* Plan Name */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {planData.name}
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          {planData.description}
        </p>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold text-gray-900">
              {formatCurrency(planData.price)}
            </span>
            {planData.type === 'subscription' && (
              <span className="text-gray-600 ml-2">
                /{planData.interval}
              </span>
            )}
          </div>
          {plan === 'YEARLY_SUBSCRIPTION' && (
            <p className="text-sm text-green-600 mt-1">
              Save $59.94 per year
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 text-left">
          {planData.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(plan)}
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
            isPopular
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {getButtonText()}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </div>
    </m.div>
  );
}

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handlePlanSelect = async (plan: keyof typeof PRICING_PLANS) => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/pricing');
      return;
    }

    setIsLoading(plan);

    try {
      const paymentType = plan === 'PROJECT_UNLOCK' 
        ? 'project_unlock' 
        : plan === 'MONTHLY_SUBSCRIPTION'
        ? 'monthly_subscription'
        : 'yearly_subscription';

      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: paymentType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Pricing</h1>
              <p className="mt-1 text-gray-300">
                Choose the plan that works best for you
              </p>
            </div>
            {session && (
              <button
                onClick={() => router.push('/dashboard')}
                className="text-purple-400 hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <m.h2
            className="text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Simple, Transparent Pricing
          </m.h2>
          <m.p
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Transform your app ideas into detailed specifications with AI-powered workflows.
            Choose between project-based pricing or unlimited access.
          </m.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            plan="PROJECT_UNLOCK"
            planData={PRICING_PLANS.PROJECT_UNLOCK}
            isLoading={isLoading === 'PROJECT_UNLOCK'}
            onSelect={handlePlanSelect}
          />
          
          <PricingCard
            plan="MONTHLY_SUBSCRIPTION"
            planData={PRICING_PLANS.MONTHLY_SUBSCRIPTION}
            isPopular
            isLoading={isLoading === 'MONTHLY_SUBSCRIPTION'}
            onSelect={handlePlanSelect}
          />
          
          <PricingCard
            plan="YEARLY_SUBSCRIPTION"
            planData={PRICING_PLANS.YEARLY_SUBSCRIPTION}
            isLoading={isLoading === 'YEARLY_SUBSCRIPTION'}
            onSelect={handlePlanSelect}
          />
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <m.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h3>
          </m.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <m.div
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h4 className="text-lg font-semibold text-white mb-2">
                What's included in the AI workflow?
              </h4>
              <p className="text-gray-300">
                Our 9-step AI-powered workflow guides you through idea articulation, 
                target user identification, feature discovery, user flow mapping, 
                technical architecture, and more.
              </p>
            </m.div>

            <m.div
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h4 className="text-lg font-semibold text-white mb-2">
                Can I cancel my subscription anytime?
              </h4>
              <p className="text-gray-300">
                Yes, you can cancel your subscription at any time. You'll continue 
                to have access until the end of your current billing period.
              </p>
            </m.div>
          </div>
        </div>
      </div>
    </div>
  );
}