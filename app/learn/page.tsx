'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { dbService, Level } from '@/lib/database';
import { ArrowLeft, GraduationCap, MessageCircle, BookOpen, BookMarked, Lock, Unlock, Play } from 'lucide-react';

const colorMap: Record<string, string> = {
  green: 'bg-emerald-500',
  blue: 'bg-primary-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
};

const defaultLevels: Level[] = [
  { id: '1', title: 'Beginner', description: 'Learn the basics of Kinyarwanda', price: 0, icon: 'graduation-cap', color: 'green', order: 1, isActive: true },
  { id: '2', title: 'Practice', description: 'Practice with AI conversation partner', price: 9.99, icon: 'message-circle', color: 'blue', order: 2, isActive: true },
  { id: '3', title: 'Intermediate', description: 'Expand vocabulary and grammar rules', price: 14.99, icon: 'book-open', color: 'purple', order: 3, isActive: true },
  { id: '4', title: 'Fluent', description: 'Stories and advanced content', price: 19.99, icon: 'book-marked', color: 'amber', order: 4, isActive: true },
];

export default function LearnPage() {
  const { userData } = useAuth();
  const purchasedLevels = userData?.purchasedLevels || [];
  const [levels, setLevels] = useState<Level[]>(defaultLevels);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      const dbLevels = await dbService.getLevels();
      if (dbLevels.length > 0) {
        setLevels(dbLevels);
      }
    } catch (error) {
      console.log('Using default levels');
    }
    setLoading(false);
  };

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
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading levels...</p>
              </div>
            ) : (
              levels.map((level) => {
                const isUnlocked = purchasedLevels.includes(parseInt(level.id));
                const levelColor = colorMap[level.color] || 'bg-gray-500';
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
                    <div className={`w-12 h-12 ${levelColor} rounded-xl flex items-center justify-center text-white`}>
                      <Play size={24} />
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
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}