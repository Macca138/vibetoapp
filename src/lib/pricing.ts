// Client-safe pricing configuration (no Stripe client initialization)

export const PRICING_PLANS = {
  PROJECT_UNLOCK: {
    name: 'Project Unlock',
    description: 'Unlock a single project with full AI-powered workflow',
    price: 997, // $9.97 in cents
    currency: 'usd',
    type: 'one_time' as const,
    features: [
      'Complete 9-step AI workflow',
      'Detailed project specifications',
      'Export to multiple formats',
      'Lifetime access to project',
    ],
  },
  MONTHLY_SUBSCRIPTION: {
    name: 'Monthly Subscription',
    description: 'Unlimited projects with monthly billing',
    price: 2997, // $29.97 in cents
    currency: 'usd',
    type: 'subscription' as const,
    interval: 'month' as const,
    features: [
      'Unlimited projects',
      'All AI workflow features',
      'Priority support',
      'Export to all formats',
      'Advanced analytics',
    ],
  },
  YEARLY_SUBSCRIPTION: {
    name: 'Yearly Subscription',
    description: 'Unlimited projects with yearly billing (2 months free)',
    price: 29970, // $299.70 in cents (normally $359.64)
    currency: 'usd',
    type: 'subscription' as const,
    interval: 'year' as const,
    features: [
      'Unlimited projects',
      'All AI workflow features',
      'Priority support',
      'Export to all formats',
      'Advanced analytics',
      '2 months free',
    ],
  },
} as const;

// Helper function to format currency (client-safe)
export function formatCurrency(
  amount: number,
  currency: string = 'usd'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
}