import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Import pricing configuration from client-safe file
export { PRICING_PLANS } from './pricing';

// Helper function to create a Stripe Customer
export async function createStripeCustomer(
  email: string,
  name?: string,
  userId?: string
): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId: userId || '',
    },
  });

  return customer;
}

// Helper function to create a checkout session
export async function createCheckoutSession({
  priceId,
  customerId,
  customerEmail,
  successUrl,
  cancelUrl,
  mode = 'payment',
  metadata = {},
}: {
  priceId?: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  mode?: 'payment' | 'subscription';
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  };

  // Set customer information
  if (customerId) {
    sessionParams.customer = customerId;
  } else if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  // Set price information
  if (priceId) {
    sessionParams.line_items = [
      {
        price: priceId,
        quantity: 1,
      },
    ];
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

// Helper function to create a price for project unlock
export async function createProjectUnlockPrice(
  projectId: string,
  amount: number = PRICING_PLANS.PROJECT_UNLOCK.price
): Promise<Stripe.Price> {
  // Create a product for this specific project unlock
  const product = await stripe.products.create({
    name: `Project Unlock - ${projectId}`,
    description: 'Unlock AI-powered app development workflow for this project',
    metadata: {
      type: 'project_unlock',
      projectId,
    },
  });

  // Create a price for the product
  const price = await stripe.prices.create({
    unit_amount: amount,
    currency: 'usd',
    product: product.id,
    metadata: {
      type: 'project_unlock',
      projectId,
    },
  });

  return price;
}

// Helper function to retrieve subscription status
export async function getSubscriptionStatus(
  stripeSubscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

// Helper function to cancel subscription
export async function cancelSubscription(
  stripeSubscriptionId: string,
  immediately = false
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: !immediately,
  });

  if (immediately) {
    await stripe.subscriptions.cancel(stripeSubscriptionId);
  }

  return subscription;
}

// Helper function to verify webhook signature
export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string,
  endpointSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, endpointSecret);
}

// Export formatCurrency from client-safe file
export { formatCurrency } from './pricing';

export default stripe;