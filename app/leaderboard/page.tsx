'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { dbService, Level, UserProfile } from '@/lib/database';
import { ArrowLeft, Trophy, Medal, Crown, BookOpen, FileText, MessageCircle, ChevronRight, Search } from 'lucide-react';
import { Loading } from '@/app/AppLoading';

const categories = [
  { id: 'overall', title: 'Overall', icon: <Crown size={20} /> },
  { id: 'vocabulary', title: 'Vocabulary', icon: <BookOpen size={20} /> },
  { id: 'tests', title: 'Tests', icon: <FileText size={20} /> },
  { id: 'practice', title: 'Practice', icon: <MessageCircle size={20} /> },
];

const LEAGUE_SIZE = 15;
const BUBBLE_SIZE = 3;

export default function LeaderboardPage() {
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!dataLoaded) {
      loadData();
      setDataLoaded(true);
    }
  }, [dataLoaded]);

  const loadData = async () => {
    try {
      const [users, dbLevels] = await Promise.all([
        dbService.getUsers(),
        dbService.getLevels(),
      ]);
      setLeaderboard(users as UserProfile[]);
      if (dbLevels.length > 0) {
        setLevels(dbLevels);
      }
    } catch (error) {
      console.log('Using fallback leaderboard data');
      setLeaderboard([
        { id: '1', displayName: 'John Smith', photoURL: '', totalPoints: 2500, testsCompleted: 15, vocabularyLearned: 200, consecutivePasses: 8 } as UserProfile,
        { id: '2', displayName: 'Sarah Johnson', photoURL: '', totalPoints: 2200, testsCompleted: 12, vocabularyLearned: 180, consecutivePasses: 5 } as UserProfile,
        { id: '3', displayName: 'Mike Davis', photoURL: '', totalPoints: 1800, testsCompleted: 10, vocabularyLearned: 150, consecutivePasses: 3 } as UserProfile,
      ]);
    }
    setLoading(false);
  };

  const getCategoryValue = (user: UserProfile) => {
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

  const getActualRank = (userId: string) => sortedUsers.findIndex(u => u.id === userId) + 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-28 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Loading text="Loading leaderboard..." />
          </div>
        </div>
      </div>
    );
  }

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
                      {selectedCategory === 'vocabulary' ? 'Words' : selectedCategory === 'tests' ? 'Tests' : selectedCategory === 'practice' ? 'Practice' : 'Points'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {league.map((user, index) => {
                    const actualRank = searchQuery.trim() ? getActualRank(user.id) : index + 1;
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {actualRank === 1 ? (
                            <Crown size={18} className="text-amber-500" />
                          ) : actualRank === 2 ? (
                            <Medal size={18} className="text-gray-400" />
                          ) : actualRank === 3 ? (
                            <Medal size={18} className="text-amber-700" />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">#{actualRank}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
                              {user.displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{user.displayName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {getCategoryValue(user).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {bubble.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">?</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">On the Bubble</h2>
                <span className="text-sm text-gray-400">Next {BUBBLE_SIZE}</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Learner</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bubble.map((user) => {
                      const actualRank = getActualRank(user.id);
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-600">#{actualRank}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
                                {user.displayName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">{user.displayName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">
                            {getCategoryValue(user).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}