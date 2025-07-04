import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/stripe';
import Stripe from 'stripe';

// Disable body parsing to get raw body for webhook signature verification
export const dynamic = 'force-dynamic';

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const type = session.metadata?.type;
  const projectId = session.metadata?.projectId;

  if (!userId) {
    console.error('No userId found in checkout session metadata');
    return;
  }

  try {
    // Update payment record
    await prisma.paymentRecord.updateMany({
      where: {
        stripeSessionId: session.id,
        userId,
      },
      data: {
        status: 'succeeded',
        stripePaymentId: session.payment_intent as string,
        updatedAt: new Date(),
      },
    });

    if (type === 'project_unlock' && projectId) {
      // For project unlock, we could add project-specific access logic here
      // For now, we'll just record the successful payment
      console.log(`Project ${projectId} unlocked for user ${userId}`);
      
      // Optionally, you could add a project access table or flag
      // await prisma.project.update({
      //   where: { id: projectId },
      //   data: { isPaid: true }
      // });
      
    } else if (type?.includes('subscription')) {
      // Handle subscription creation
      const subscription = session.subscription as string;
      
      if (subscription) {
        await prisma.userSubscription.upsert({
          where: { userId },
          update: {
            stripeSubscriptionId: subscription,
            status: 'active',
            type: 'subscription',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + (type === 'yearly_subscription' ? 365 : 30) * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
          create: {
            userId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription,
            status: 'active',
            type: 'subscription',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + (type === 'yearly_subscription' ? 365 : 30) * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    console.log(`Successfully processed checkout session: ${session.id} for user: ${userId}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.error('No subscription ID found in invoice');
    return;
  }

  try {
    // Find user by Stripe customer ID
    const userSubscription = await prisma.userSubscription.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!userSubscription) {
      console.error(`No user found for customer ID: ${customerId}`);
      return;
    }

    // Update subscription with new period dates
    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: {
        status: 'active',
        currentPeriodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : undefined,
        currentPeriodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
        updatedAt: new Date(),
      },
    });

    // Create payment record for the invoice
    await prisma.paymentRecord.create({
      data: {
        userId: userSubscription.userId,
        stripePaymentId: invoice.payment_intent as string || `invoice_${invoice.id}`,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        type: 'subscription',
        metadata: {
          invoiceId: invoice.id,
          subscriptionId,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
        },
      },
    });

    console.log(`Successfully processed invoice payment for subscription: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  try {
    // Find user by Stripe customer ID
    const userSubscription = await prisma.userSubscription.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!userSubscription) {
      console.error(`No user found for customer ID: ${customerId}`);
      return;
    }

    // Update subscription status to past_due
    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: {
        status: 'past_due',
        updatedAt: new Date(),
      },
    });

    // Create failed payment record
    await prisma.paymentRecord.create({
      data: {
        userId: userSubscription.userId,
        stripePaymentId: invoice.payment_intent as string || `failed_invoice_${invoice.id}`,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        type: 'subscription',
        metadata: {
          invoiceId: invoice.id,
          subscriptionId,
          failureReason: 'payment_failed',
        },
      },
    });

    console.log(`Payment failed for subscription: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}

async function handleCustomerSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  try {
    // Find user by Stripe customer ID
    const userSubscription = await prisma.userSubscription.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!userSubscription) {
      console.error(`No user found for customer ID: ${customerId}`);
      return;
    }

    // Update subscription status and period
    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: {
        status: subscription.status,
        stripePriceId: subscription.items.data[0]?.price.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date(),
      },
    });

    console.log(`Updated subscription: ${subscription.id} status: ${subscription.status}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

async function handleCustomerSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  try {
    // Find user by Stripe customer ID
    const userSubscription = await prisma.userSubscription.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!userSubscription) {
      console.error(`No user found for customer ID: ${customerId}`);
      return;
    }

    // Update subscription status to canceled
    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: {
        status: 'canceled',
        updatedAt: new Date(),
      },
    });

    console.log(`Canceled subscription: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('No Stripe signature found');
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    );
  }

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = verifyWebhookSignature(body, signature, endpointSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log(`Received webhook event: ${event.type}`);

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleCustomerSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'payment_intent.succeeded':
        // Handle successful one-time payments
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        
        // Update payment record if exists
        await prisma.paymentRecord.updateMany({
          where: {
            stripePaymentId: paymentIntent.id,
          },
          data: {
            status: 'succeeded',
            updatedAt: new Date(),
          },
        });
        break;

      case 'payment_intent.payment_failed':
        // Handle failed one-time payments
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${failedPayment.id}`);
        
        // Update payment record
        await prisma.paymentRecord.updateMany({
          where: {
            stripePaymentId: failedPayment.id,
          },
          data: {
            status: 'failed',
            updatedAt: new Date(),
          },
        });
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}