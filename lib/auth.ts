import { NextRequest } from 'next/server';
import { getIdToken, currentUser } from '@/lib/firebase';

export async function getAuthenticatedUser() {
  try {
    const user = await currentUser();
    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}