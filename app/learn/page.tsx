'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, MessageCircle, BookOpen, BookMarked, Lock, Unlock } from 'lucide-react';

const colorMap: Record<string, string> = {
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
};

const iconMap: Record<string, React.ReactNode> = {
  'graduation-cap': <GraduationCap size={24} />,
  'message-circle': <MessageCircle size={24} />,
  'book-open': <BookOpen size={24} />,
  'book-marked': <BookMarked size={24} />,
};

export default function LearnPage() {
  const { userData } = useAuth();
  const purchasedLevels = userData?.purchasedLevels || [];

  const levels = [
    { id: 1, title: 'Beginner', description: 'Learn the basics of Kinyarwanda', icon: 'graduation-cap', color: 'green' },
    { id: 2, title: 'Practice', description: 'Practice with AI conversation partner', icon: 'message-circle', color: 'blue' },
    { id: 3, title: 'Intermediate', description: 'Expand vocabulary and grammar rules', icon: 'book-open', color: 'purple' },
    { id: 4, title: 'Fluent', description: 'Stories and advanced content', icon: 'book-marked', color: 'amber' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="text-blue-600 hover:underline text-sm font-medium">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Learning Levels</h1>
          </div>

          <div className="space-y-3">
            {levels.map((level) => {
              const isUnlocked = purchasedLevels.includes(level.id);
              return (
                <Link
                  key={level.id}
                  href={isUnlocked ? `/learn/${level.title.toLowerCase()}` : '#'}
                  className={`flex items-center gap-5 p-5 rounded-xl transition ${
                    isUnlocked 
                      ? 'bg-white hover:shadow-md border border-gray-200' 
                      : 'bg-gray-100 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-12 h-12 ${colorMap[level.color]} rounded-xl flex items-center justify-center text-white`}>
                    {iconMap[level.icon]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{level.title}</h3>
                    <p className="text-sm text-gray-500">{level.description}</p>
                  </div>
                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                      <Unlock size={16} />
                      Available
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400 text-sm font-medium">
                      <Lock size={16} />
                      Locked
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}