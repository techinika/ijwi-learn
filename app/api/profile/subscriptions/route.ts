import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth';

const db = dbService;

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { levelId, levelTitle, levelSlug, levelPrice } = body;

    if (!levelId || !levelTitle || !levelPrice) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const existingSub = await db.getActiveSubscription(user.uid, levelId);
    if (existingSub) {
      return NextResponse.json({ success: false, message: 'Already subscribed to this level' }, { status: 400 });
    }

    const invoiceNumber = await db.generateInvoiceNumber();
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    const billingPeriodEnd = new Date(now);
    billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);

    const subscriptionId = await db.createSubscription({
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.displayName || '',
      levelId,
      levelTitle,
      levelSlug,
      levelPrice,
      status: 'active',
      startDate: now,
      endDate: billingPeriodEnd,
      nextBillingDate: nextBilling,
      reminderSent: false,
    });

    const invoiceId = await db.createInvoice({
      invoiceNumber,
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.displayName || '',
      subscriptionId,
      levelId,
      levelTitle,
      levelSlug,
      amount: levelPrice,
      currency: 'RWF',
      status: 'unpaid',
      billingPeriodStart: now,
      billingPeriodEnd: billingPeriodEnd,
    });

    return NextResponse.json({
      success: true,
      subscriptionId,
      invoiceId,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ success: false, message: 'Failed to create subscription' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await db.getSubscriptions({ userId: user.uid });
    return NextResponse.json({ success: true, subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}