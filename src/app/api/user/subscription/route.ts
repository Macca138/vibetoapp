import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserSubscription, getUserPaymentHistory } from '@/lib/subscription';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user subscription status
    const subscription = await getUserSubscription(session.user.id);
    
    // Get payment history
    const payments = await getUserPaymentHistory(session.user.id);

    return NextResponse.json({
      subscription,
      payments,
      hasAccess: subscription?.hasAccess || false,
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription information' },
      { status: 500 }
    );
  }
}