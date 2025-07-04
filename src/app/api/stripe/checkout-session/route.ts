import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  stripe, 
  createStripeCustomer, 
  createCheckoutSession, 
  createProjectUnlockPrice,
  PRICING_PLANS 
} from '@/lib/stripe';
import { z } from 'zod';

const checkoutSessionSchema = z.object({
  type: z.enum(['project_unlock', 'monthly_subscription', 'yearly_subscription']),
  projectId: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validationResult = checkoutSessionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { type, projectId, successUrl, cancelUrl } = validationResult.data;

    // Validate project ownership if projectId is provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: session.user.id,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Get or create Stripe customer
    let stripeCustomer;
    const existingSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: session.user.id,
        stripeCustomerId: { not: null },
      },
    });

    if (existingSubscription?.stripeCustomerId) {
      try {
        stripeCustomer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
        if (stripeCustomer.deleted) {
          throw new Error('Customer deleted');
        }
      } catch (error) {
        // Customer doesn't exist in Stripe, create a new one
        stripeCustomer = await createStripeCustomer(
          session.user.email,
          session.user.name || undefined,
          session.user.id
        );
      }
    } else {
      stripeCustomer = await createStripeCustomer(
        session.user.email,
        session.user.name || undefined,
        session.user.id
      );
    }

    // Set default URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const defaultSuccessUrl = successUrl || `${baseUrl}/payment/success`;
    const defaultCancelUrl = cancelUrl || `${baseUrl}/pricing?payment=cancelled`;

    let checkoutSession;
    let priceId: string;

    switch (type) {
      case 'project_unlock':
        if (!projectId) {
          return NextResponse.json(
            { error: 'Project ID is required for project unlock' },
            { status: 400 }
          );
        }

        // Create a price for this specific project
        const projectPrice = await createProjectUnlockPrice(projectId);
        priceId = projectPrice.id;

        checkoutSession = await createCheckoutSession({
          priceId,
          customerId: stripeCustomer.id,
          successUrl: `${defaultSuccessUrl}?type=project&projectId=${projectId}`,
          cancelUrl: defaultCancelUrl,
          mode: 'payment',
          metadata: {
            type: 'project_unlock',
            projectId,
            userId: session.user.id,
          },
        });
        break;

      case 'monthly_subscription':
        // You would need to create these prices in your Stripe dashboard
        // or create them programmatically
        priceId = process.env.STRIPE_MONTHLY_PRICE_ID!;
        
        if (!priceId) {
          return NextResponse.json(
            { error: 'Monthly subscription not configured' },
            { status: 500 }
          );
        }

        checkoutSession = await createCheckoutSession({
          priceId,
          customerId: stripeCustomer.id,
          successUrl: `${defaultSuccessUrl}?type=subscription&plan=monthly`,
          cancelUrl: defaultCancelUrl,
          mode: 'subscription',
          metadata: {
            type: 'monthly_subscription',
            userId: session.user.id,
          },
        });
        break;

      case 'yearly_subscription':
        priceId = process.env.STRIPE_YEARLY_PRICE_ID!;
        
        if (!priceId) {
          return NextResponse.json(
            { error: 'Yearly subscription not configured' },
            { status: 500 }
          );
        }

        checkoutSession = await createCheckoutSession({
          priceId,
          customerId: stripeCustomer.id,
          successUrl: `${defaultSuccessUrl}?type=subscription&plan=yearly`,
          cancelUrl: defaultCancelUrl,
          mode: 'subscription',
          metadata: {
            type: 'yearly_subscription',
            userId: session.user.id,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid payment type' },
          { status: 400 }
        );
    }

    // Store or update customer ID in our database
    await prisma.userSubscription.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        stripeCustomerId: stripeCustomer.id,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        stripeCustomerId: stripeCustomer.id,
        status: 'incomplete',
        type: type.includes('subscription') ? 'subscription' : 'project',
      },
    });

    // Create a payment record to track this checkout session
    await prisma.paymentRecord.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        stripeSessionId: checkoutSession.id,
        stripePaymentId: checkoutSession.payment_intent as string || '',
        amount: type === 'project_unlock' 
          ? PRICING_PLANS.PROJECT_UNLOCK.price 
          : type === 'monthly_subscription'
          ? PRICING_PLANS.MONTHLY_SUBSCRIPTION.price
          : PRICING_PLANS.YEARLY_SUBSCRIPTION.price,
        currency: 'usd',
        status: 'pending',
        type: type === 'project_unlock' ? 'project_unlock' : 'subscription',
        metadata: {
          checkoutSessionId: checkoutSession.id,
          priceId,
        },
      },
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}