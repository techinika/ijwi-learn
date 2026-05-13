'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { dbService } from '@/lib/database';
import { ArrowLeft, Trophy, Medal, Crown, BookOpen, GraduationCap, FileText, MessageCircle } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  displayName: string;
  photoURL: string;
  totalPoints: number;
  testsCompleted: number;
  vocabularyLearned: number;
  consecutivePasses: number;
}

const categories = [
  { id: 'overall', title: 'Overall', icon: <Crown size={20} /> },
  { id: 'vocabulary', title: 'Vocabulary', icon: <BookOpen size={20} /> },
  { id: 'tests', title: 'Tests', icon: <FileText size={20} /> },
  { id: 'practice', title: 'Practice', icon: <MessageCircle size={20} /> },
];

const levels = [
  { id: '1', title: 'Beginner', icon: <GraduationCap size={20} /> },
  { id: '2', title: 'Practice', icon: <MessageCircle size={20} /> },
  { id: '3', title: 'Intermediate', icon: <BookOpen size={20} /> },
  { id: '4', title: 'Fluent', icon: <Crown size={20} /> },
];

export default function LeaderboardPage() {
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedCategory, selectedLevel]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const users = await dbService.getUsers();
      setLeaderboard(users as any);
    } catch (error) {
      console.log('Using fallback leaderboard data');
      setLeaderboard([
        { id: '1', displayName: 'John Smith', photoURL: '', totalPoints: 2500, testsCompleted: 15, vocabularyLearned: 200, consecutivePasses: 8 },
        { id: '2', displayName: 'Sarah Johnson', photoURL: '', totalPoints: 2200, testsCompleted: 12, vocabularyLearned: 180, consecutivePasses: 5 },
        { id: '3', displayName: 'Mike Davis', photoURL: '', totalPoints: 1800, testsCompleted: 10, vocabularyLearned: 150, consecutivePasses: 3 },
      ]);
    }
    setLoading(false);
  };

  const getCategoryValue = (user: LeaderboardUser) => {
    switch (selectedCategory) {
      case 'vocabulary': return user.vocabularyLearned;
      case 'tests': return user.testsCompleted;
      case 'practice': return user.consecutivePasses;
      default: return user.totalPoints;
    }
  };

  const sortedUsers = [...leaderboard].sort((a, b) => getCategoryValue(b) - getCategoryValue(a));

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown size={24} className="text-amber-500" />;
    if (rank === 1) return <Medal size={24} className="text-gray-400" />;
    if (rank === 2) return <Medal size={24} className="text-amber-700" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="text-primary-600 hover:underline">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl transition ${
                  selectedCategory === cat.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                }`}
              >
                {cat.icon}
                <span className="font-medium text-sm">{cat.title}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedLevel('')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                selectedLevel === '' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              All Levels
            </button>
            {levels.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  selectedLevel === level.id ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {level.icon}
                {level.title}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading leaderboard...</div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Learner</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {selectedCategory === 'vocabulary' ? 'Words' : selectedCategory === 'tests' ? 'Tests' : selectedCategory === 'practice' ? 'Streak' : 'Points'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tests</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Streak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedUsers.map((learner, idx) => {
                      const rank = idx + 1;
                      return (
                        <tr key={learner.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center w-8">
                              {getRankIcon(idx) || <span className="text-lg font-bold text-gray-500">#{rank}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-600">
                                {learner.displayName?.charAt(0) || 'U'}
                              </div>
                              <span className="font-medium text-gray-900">{learner.displayName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-900">
                              {selectedCategory === 'vocabulary' ? learner.vocabularyLearned :
                               selectedCategory === 'tests' ? learner.testsCompleted :
                               selectedCategory === 'practice' ? learner.consecutivePasses :
                               learner.totalPoints}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{learner.testsCompleted}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              learner.consecutivePasses >= 5 ? 'bg-emerald-100 text-emerald-700' :
                              learner.consecutivePasses >= 3 ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {learner.consecutivePasses} 🔥
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {sortedUsers.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No learners found</div>
                )}
              </div>

              {sortedUsers.length >= 3 && (
                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
                    <Trophy size={32} className="mx-auto mb-2 text-amber-500" />
                    <div className="text-2xl font-bold text-gray-900">{sortedUsers[0]?.displayName || '-'}</div>
                    <div className="text-sm text-gray-500">Top Learner</div>
                  </div>
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
                    <Medal size={32} className="mx-auto mb-2 text-gray-400" />
                    <div className="text-2xl font-bold text-gray-900">{sortedUsers[1]?.displayName || '-'}</div>
                    <div className="text-sm text-gray-500">2nd Place</div>
                  </div>
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
                    <Medal size={32} className="mx-auto mb-2 text-amber-700" />
                    <div className="text-2xl font-bold text-gray-900">{sortedUsers[2]?.displayName || '-'}</div>
                    <div className="text-sm text-gray-500">3rd Place</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}