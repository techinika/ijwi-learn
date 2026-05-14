import admin from 'firebase-admin';

export function getAdminDb(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || '',
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
        }),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      });
    } catch (e) {
      console.error('Firebase Admin init failed:', e);
    }
  }
  return admin.firestore();
}

export function getAdminAuth(): admin.auth.Auth {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || '',
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
        }),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      });
    } catch (e) {
      console.error('Firebase Admin init failed:', e);
    }
  }
  return admin.auth();
}