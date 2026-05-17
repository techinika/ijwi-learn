'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { dbService, Level } from '@/lib/database';
import { ArrowLeft, Trophy, Medal, Crown, BookOpen, FileText, MessageCircle, Play, ChevronRight, Search } from 'lucide-react';

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

const defaultLevels = [
  { id: '1', title: 'Beginner' },
  { id: '2', title: 'Practice' },
  { id: '3', title: 'Intermediate' },
  { id: '4', title: 'Fluent' },
];

const LEAGUE_SIZE = 15;
const BUBBLE_SIZE = 3;

export default function LeaderboardPage() {
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [levels, setLevels] = useState<Level[]>(defaultLevels as Level[]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedLevel]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, dbLevels] = await Promise.all([
        dbService.getUsers(),
        dbService.getLevels(),
      ]);
      setLeaderboard(users as any);
      if (dbLevels.length > 0) {
        setLevels(dbLevels);
      }
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
  const filteredUsers = searchQuery.trim() 
    ? sortedUsers.filter(u => u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
    : sortedUsers;
  const league = filteredUsers.slice(0, LEAGUE_SIZE);
  const bubble = filteredUsers.slice(LEAGUE_SIZE, LEAGUE_SIZE + BUBBLE_SIZE);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown size={24} className="text-amber-500" />;
    if (rank === 1) return <Medal size={24} className="text-gray-400" />;
    if (rank === 2) return <Medal size={24} className="text-amber-700" />;
    return null;
  };

  const getRankBg = (rank: number) => {
    if (rank === 0) return 'bg-amber-50';
    if (rank === 1) return 'bg-gray-50';
    if (rank === 2) return 'bg-amber-50/50';
    return '';
  };

  const getBubblePlaceholder = (rank: number) => {
    const placeholders = ['1st Reserve', '2nd Reserve', '3rd Reserve'];
    return placeholders[rank] || '';
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

          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search learner..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-28 px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.title}</option>
              ))}
            </select>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-28 px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
            >
              <option value="">All</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>{level.title}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading leaderboard...</div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy size={24} className="text-amber-500" />
                  <h2 className="text-xl font-bold text-gray-900">Champions League</h2>
                  <span className="text-sm text-gray-400">Top {LEAGUE_SIZE}</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                  <table className="w-full min-w-[500px]">
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
                      {league.map((learner, idx) => {
                        const rank = idx + 1;
                        return (
                          <tr key={learner.id} className={`hover:bg-gray-50 ${getRankBg(idx)}`}>
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
                  {league.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No learners in the league yet</div>
                  )}
                </div>
              </div>

              {bubble.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <ChevronRight size={24} className="text-gray-400" />
                    <h2 className="text-xl font-bold text-gray-900">On the Bubble</h2>
                    <span className="text-sm text-gray-400">Next {BUBBLE_SIZE} to enter</span>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto border-dashed">
                    <table className="w-full min-w-[500px]">
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
                        {bubble.map((learner, idx) => {
                          const globalRank = LEAGUE_SIZE + idx + 1;
                          return (
                            <tr key={learner.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center w-8">
                                  <span className="text-lg font-bold text-gray-400">#{globalRank}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-gray-400">
                                    {learner.displayName?.charAt(0) || 'U'}
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-900">{learner.displayName}</span>
                                    <span className="block text-xs text-gray-400">{getBubblePlaceholder(idx)}</span>
                                  </div>
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
