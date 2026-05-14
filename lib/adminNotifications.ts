import { getAdminDb } from '@/db/firebaseAdmin';
import admin from 'firebase-admin';

interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  actorId?: string;
  actorName?: string;
}

export async function createNotification(data: NotificationData): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection('notifications').add({
      ...data,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}