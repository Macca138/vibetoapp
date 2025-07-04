import { prisma } from '@/lib/prisma';

export interface UserSubscription {
  id: string;
  status: string;
  type: string;
  isActive: boolean;
  hasAccess: boolean;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
}

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const subscription = await prisma.userSubscription.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!subscription) {
      return null;
    }

    const now = new Date();
    const isActive = ['active', 'trialing'].includes(subscription.status);
    const isPeriodValid = !subscription.currentPeriodEnd || subscription.currentPeriodEnd > now;
    const hasAccess = isActive && isPeriodValid;

    return {
      id: subscription.id,
      status: subscription.status,
      type: subscription.type,
      isActive,
      hasAccess,
      currentPeriodEnd: subscription.currentPeriodEnd || undefined,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
}

export async function hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
  try {
    // Check if user has an active subscription
    const subscription = await getUserSubscription(userId);
    if (subscription?.hasAccess) {
      return true;
    }

    // Check if user has paid for this specific project
    const projectPayment = await prisma.paymentRecord.findFirst({
      where: {
        userId,
        projectId,
        status: 'succeeded',
        type: 'project_unlock',
      },
    });

    return !!projectPayment;
  } catch (error) {
    console.error('Error checking project access:', error);
    return false;
  }
}

export async function getUserPaymentHistory(userId: string) {
  try {
    const payments = await prisma.paymentRecord.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
}

export function getSubscriptionDisplayName(type: string): string {
  switch (type) {
    case 'subscription':
      return 'Unlimited Subscription';
    case 'project':
      return 'Project-based Access';
    default:
      return 'Unknown Plan';
  }
}

export function getSubscriptionStatusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'text-green-600';
    case 'past_due':
      return 'text-yellow-600';
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
      return 'text-red-600';
    case 'unpaid':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
}

export function getSubscriptionStatusText(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Trial Period';
    case 'past_due':
      return 'Payment Due';
    case 'canceled':
      return 'Canceled';
    case 'incomplete':
      return 'Setup Required';
    case 'incomplete_expired':
      return 'Setup Expired';
    case 'unpaid':
      return 'Payment Failed';
    default:
      return 'Unknown';
  }
}