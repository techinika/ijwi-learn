'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { dbService } from '@/lib/database';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  phone?: string;
  currentLevel: number;
  purchasedLevels: number[];
  completedLevels: number[];
  isAdmin: boolean;
  isTeacher: boolean;
  totalPoints: number;
  meritPoints: number;
  testsCompleted: number;
  consecutivePasses: number;
  lastActivityDate: string;
  vocabularyLearned: number;
  viewedVocabulary: string[];
  preferredLanguage: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  purchaseLevel: (level: number) => Promise<void>;
  completeLevel: (order: number) => Promise<void>;
  addPoints: (points: number) => Promise<void>;
  incrementTestsCompleted: () => Promise<void>;
  incrementConsecutivePasses: () => Promise<void>;
  resetConsecutivePasses: () => Promise<void>;
  recordLearningActivity: () => Promise<void>;
  addViewedVocabulary: (wordId: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; phone?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = userData?.isAdmin || false;
  const isTeacher = userData?.isTeacher || false;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            data.createdAt = data.createdAt.toDate();
          }
          setUserData(data as UserData);
        } else {
          const newUserData: UserData = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || '',
            currentLevel: 1,
            purchasedLevels: [1],
            completedLevels: [],
            isAdmin: false,
            isTeacher: false,
            totalPoints: 0,
            meritPoints: 0,
            testsCompleted: 0,
            consecutivePasses: 0,
            lastActivityDate: new Date().toISOString().split('T')[0],
            vocabularyLearned: 0,
            viewedVocabulary: [],
            preferredLanguage: 'en',
            createdAt: new Date(),
          };
          await setDoc(doc(db, 'users', currentUser.uid), newUserData);
          setUserData(newUserData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return;
    const updatedData = { ...userData, ...data };
    await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
    setUserData(updatedData as UserData);
  };

  const purchaseLevel = async (level: number) => {
    if (!user || !userData) return;
    const allUpToLevel = Array.from({ length: level }, (_, i) => i + 1);
    const newPurchasedLevels = [...new Set([...userData.purchasedLevels, ...allUpToLevel])];
    const isNewLevel = !userData.purchasedLevels.includes(level);
    await updateUserData({ purchasedLevels: newPurchasedLevels });
    if (isNewLevel) {
      await dbService.awardPoints(user.uid, 50, 'Level upgrade', 'merit');
    }
  };

  const completeLevel = async (order: number) => {
    if (!user || !userData) return;
    const newCompletedLevels = [...new Set([...(userData.completedLevels || []), order])];
    await updateUserData({ completedLevels: newCompletedLevels });
  };

  const addPoints = async (points: number) => {
    if (!user || !userData) return;
    const newPoints = (userData.totalPoints || 0) + points;
    await updateUserData({ totalPoints: newPoints });
  };

  const incrementTestsCompleted = async () => {
    if (!user || !userData) return;
    const newCount = (userData.testsCompleted || 0) + 1;
    await updateUserData({ testsCompleted: newCount });
  };

  const incrementConsecutivePasses = async () => {
    if (!user || !userData) return;
    const newCount = (userData.consecutivePasses || 0) + 1;
    await updateUserData({ consecutivePasses: newCount });
  };

  const resetConsecutivePasses = async () => {
    if (!user) return;
    await updateUserData({ consecutivePasses: 0 });
  };

  const recordLearningActivity = async () => {
    if (!user || !userData) return;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastActivity = userData.lastActivityDate;

    if (lastActivity === today) return;

    let newStreak = 1;
    if (lastActivity === yesterday) {
      newStreak = (userData.consecutivePasses || 0) + 1;
    }

    await updateUserData({
      lastActivityDate: today,
      consecutivePasses: newStreak,
    });
  };

  const addViewedVocabulary = async (wordId: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      viewedVocabulary: arrayUnion(wordId),
    });
    setUserData(prev => prev ? {
      ...prev,
      viewedVocabulary: [...(prev.viewedVocabulary || []), wordId],
      vocabularyLearned: (prev.vocabularyLearned || 0) + 1,
    } : prev);
  };

  const updateUserProfile = async (data: { displayName?: string; phone?: string }) => {
    if (!user) return;
    const updates: Partial<UserData> = {};
    if (data.displayName !== undefined) {
      updates.displayName = data.displayName;
    }
    if (data.phone !== undefined) {
      updates.phone = data.phone;
    }
    await updateUserData(updates);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isAdmin,
        isTeacher,
        signInWithGoogle,
        logout,
        updateUserData,
        purchaseLevel,
        completeLevel,
        addPoints,
        incrementTestsCompleted,
        incrementConsecutivePasses,
        resetConsecutivePasses,
        recordLearningActivity,
        addViewedVocabulary,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}