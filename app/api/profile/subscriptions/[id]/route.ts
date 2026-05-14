import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth';

const db = dbService;

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const subscription = await db.getSubscription(id);
    if (!subscription) {
      return NextResponse.json({ success: false, message: 'Subscription not found' }, { status: 404 });
    }

    if (subscription.userId !== user.uid) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'cancel') {
      await db.updateSubscription(id, { status: 'cancelled' });
      return NextResponse.json({ success: true, message: 'Subscription cancelled' });
    }

    if (action === 'resume') {
      const now = new Date();
      const nextBilling = new Date(now);
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      
      await db.updateSubscription(id, {
        status: 'active',
        nextBillingDate: nextBilling,
        reminderSent: false,
      });
      return NextResponse.json({ success: true, message: 'Subscription resumed' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ success: false, message: 'Failed to update subscription' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const subscription = await db.getSubscription(id);
    if (!subscription) {
      return NextResponse.json({ success: false, message: 'Subscription not found' }, { status: 404 });
    }

    if (subscription.userId !== user.uid) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await db.cancelSubscription(id);
    return NextResponse.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ success: false, message: 'Failed to cancel subscription' }, { status: 500 });
  }
}