import { getAdminDb } from '@/db/firebaseAdmin';
import admin from 'firebase-admin';

export async function checkUserLevelAccess(userId: string, levelId: string): Promise<boolean> {
  const adminDb = getAdminDb();
  
  const subscriptionQuery = await adminDb
    .collection('subscriptions')
    .where('userId', '==', userId)
    .where('levelId', '==', levelId)
    .where('status', '==', 'active')
    .get();

  if (!subscriptionQuery.empty) {
    const sub = subscriptionQuery.docs[0].data();
    const nextBilling = sub.nextBillingDate?.toDate?.() || new Date(sub.nextBillingDate);
    
    if (nextBilling > new Date()) {
      return true;
    }
  }

  const userDoc = await adminDb.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  if (userData?.purchasedLevels?.includes(levelId)) {
    const hasActiveSubscription = !subscriptionQuery.empty;
    
    if (!hasActiveSubscription) {
      return true;
    }
  }

  return false;
}

export async function lockUserLevel(userId: string, levelId: string): Promise<void> {
  const adminDb = getAdminDb();
  
  await adminDb.collection('users').doc(userId).update({
    purchasedLevels: admin.firestore.FieldValue.arrayRemove(levelId),
  });
}

export async function checkAndLockExpiredSubscriptions(): Promise<{ locked: number; notified: number }> {
  const adminDb = getAdminDb();
  const now = new Date();
  let locked = 0;
  let notified = 0;

  const expiredSubscriptions = await adminDb
    .collection('subscriptions')
    .where('status', '==', 'active')
    .get();

  for (const subDoc of expiredSubscriptions.docs) {
    const sub = subDoc.data();
    const nextBilling = sub.nextBillingDate?.toDate?.() || new Date(sub.nextBillingDate);

    if (nextBilling < now) {
      await subDoc.ref.update({
        status: 'expired',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await lockUserLevel(sub.userId, sub.levelId);
      locked++;

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
    }
  }

  const reminderThreshold = new Date(now);
  reminderThreshold.setDate(reminderThreshold.getDate() + 3);

  const upcomingSubscriptions = await adminDb
    .collection('subscriptions')
    .where('status', '==', 'active')
    .where('reminderSent', '==', false)
    .get();

  for (const subDoc of upcomingSubscriptions.docs) {
    const sub = subDoc.data();
    const nextBilling = sub.nextBillingDate?.toDate?.() || new Date(sub.nextBillingDate);

    if (nextBilling <= reminderThreshold && nextBilling > now) {
      await subDoc.ref.update({
        reminderSent: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      notified++;

      console.log(`[SUBSCRIPTION] Would notify ${sub.userEmail} about billing for ${sub.levelTitle} on ${nextBilling.toISOString()}`);
    }
  }

  return { locked, notified };
}