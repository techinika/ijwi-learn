'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  currentLevel: number;
  purchasedLevels: number[];
  isAdmin: boolean;
  isTeacher: boolean;
  totalPoints: number;
  testsCompleted: number;
  consecutivePasses: number;
  vocabularyLearned: number;
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
  addPoints: (points: number) => Promise<void>;
  incrementTestsCompleted: () => Promise<void>;
  incrementConsecutivePasses: () => Promise<void>;
  resetConsecutivePasses: () => Promise<void>;
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
          setUserData(userDoc.data() as UserData);
        } else {
          const newUserData: UserData = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || '',
            currentLevel: 1,
            purchasedLevels: [1],
            isAdmin: false,
            isTeacher: false,
            totalPoints: 0,
            testsCompleted: 0,
            consecutivePasses: 0,
            vocabularyLearned: 0,
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
    const newPurchasedLevels = [...new Set([...userData.purchasedLevels, level])];
    await updateUserData({ purchasedLevels: newPurchasedLevels });
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
        addPoints,
        incrementTestsCompleted,
        incrementConsecutivePasses,
        resetConsecutivePasses,
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