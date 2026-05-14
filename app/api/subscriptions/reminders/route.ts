import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getAdminDb } from '@/db/firebaseAdmin';

export async function GET() {
  try {
    const adminDb = getAdminDb();
    const today = new Date();
    const reminderDays = 3;
    let usersToNotify: any[] = [];
    let expiredCount = 0;

    const subscriptions = await adminDb
      .collection('subscriptions')
      .where('status', '==', 'active')
      .get();

    for (const subDoc of subscriptions.docs) {
      const sub = subDoc.data();
      const nextBilling = sub.nextBillingDate?.toDate?.() || new Date(sub.nextBillingDate);
      const daysUntilBilling = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (nextBilling < today) {
        const batch = adminDb.batch();
        
        batch.update(subDoc.ref, {
          status: 'expired',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const userRef = adminDb.collection('users').doc(sub.userId);
        batch.update(userRef, {
          purchasedLevels: admin.firestore.FieldValue.arrayRemove(sub.levelId),
        });

        const invoiceQuery = await adminDb
          .collection('invoices')
          .where('subscriptionId', '==', subDoc.id)
          .where('status', '==', 'unpaid')
          .get();

        for (const invoiceDoc of invoiceQuery.docs) {
          batch.update(invoiceDoc.ref, {
            status: 'overdue',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        await batch.commit();
        expiredCount++;
      } else if (daysUntilBilling <= reminderDays && !sub.reminderSent) {
        usersToNotify.push({
          userId: sub.userId,
          email: sub.userEmail,
          name: sub.userName,
          levelTitle: sub.levelTitle,
          amount: sub.levelPrice,
          billingDate: nextBilling,
          daysUntil: daysUntilBilling,
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalActive: subscriptions.size,
        expiredCount,
        usersToNotify: usersToNotify.length,
        reminderDays,
      },
      notifications: usersToNotify,
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return NextResponse.json({ success: false, message: 'Failed to process reminders' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const adminDb = getAdminDb();
    const today = new Date();
    const reminderDays = 3;
    let expiredCount = 0;
    let notifiedCount = 0;

    const subscriptions = await adminDb
      .collection('subscriptions')
      .where('status', '==', 'active')
      .get();

    for (const subDoc of subscriptions.docs) {
      const sub = subDoc.data();
      const nextBilling = sub.nextBillingDate?.toDate?.() || new Date(sub.nextBillingDate);
      const daysUntilBilling = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (nextBilling < today) {
        await subDoc.ref.update({
          status: 'expired',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await adminDb.collection('users').doc(sub.userId).update({
          purchasedLevels: admin.firestore.FieldValue.arrayRemove(sub.levelId),
        });

        const invoiceQuery = await adminDb
          .collection('invoices')
          .where('subscriptionId', '==', subDoc.id)
          .where('status', '==', 'unpaid')
          .get();

        for (const invoiceDoc of invoiceQuery.docs) {
          await invoiceDoc.ref.update({
            status: 'overdue',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        expiredCount++;
        console.log(`[REMINDER JOB] Expired subscription for ${sub.userEmail}, level ${sub.levelTitle}`);
      } else if (daysUntilBilling <= reminderDays && !sub.reminderSent) {
        await subDoc.ref.update({
          reminderSent: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        notifiedCount++;
        console.log(`[REMINDER JOB] Would notify ${sub.userEmail} about ${sub.levelTitle} billing in ${daysUntilBilling} days`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${subscriptions.size} subscriptions: ${expiredCount} expired, ${notifiedCount} reminders sent`,
      expiredCount,
      notifiedCount,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({ success: false, message: 'Failed to send reminders' }, { status: 500 });
  }
}