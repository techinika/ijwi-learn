'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Level, Test, TestAttempt } from '@/lib/database';
import { ArrowLeft, Play, Award, History } from 'lucide-react';
import { Loading, FetchLoading } from '@/app/AppLoading';

interface TestWithLevel extends Test {
  levelTitle: string;
  levelColor: string;
}

const TESTS_PER_PAGE = 8;

export default function TestsClient() {
  const { user, userData } = useAuth();
  const [filterLevel, setFilterLevel] = useState('all');
  const [tests, setTests] = useState<TestWithLevel[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [dbTests, dbLevels] = await Promise.all([
        dbService.getTests(),
        dbService.getLevels(),
      ]);
      setLevels(dbLevels);

      const colorMap: Record<string, string> = {
        green: 'bg-emerald-500',
        blue: 'bg-primary-500',
        purple: 'bg-purple-500',
        amber: 'bg-amber-500',
      };

      setTests(dbTests.map(test => {
        const level = dbLevels.find(l => l.id === test.levelId);
        return {
          ...test,
          levelTitle: level?.title || 'Unknown',
          levelColor: colorMap[level?.color || 'blue'] || 'bg-gray-500',
        };
      }));

      if (user) {
        const attempts = await dbService.getTestAttempts(user.uid);
        setTestAttempts(attempts);
      }
    } catch (e) {
      console.error('Failed to load tests', e);
    }
    setLoading(false);
  };

  const levelOptions = ['all', ...levels.map(l => l.title)];

  const purchasedLevels = userData?.purchasedLevels || [];
  const levelIdToOrder = new Map(levels.map((l, idx) => [l.id, idx + 1]));

  const availableTests = tests.filter(t => {
    const levelOrder = levelIdToOrder.get(t.levelId);
    return levelOrder ? purchasedLevels.includes(levelOrder) : true;
  });

  const filteredTests = filterLevel === 'all' 
    ? availableTests 
    : availableTests.filter(t => {
        const level = levels.find(l => l.id === t.levelId);
        return level?.title === filterLevel;
      });

  const totalPages = Math.ceil(filteredTests.length / TESTS_PER_PAGE);
  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * TESTS_PER_PAGE,
    currentPage * TESTS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterLevel]);

  const getBestScore = (testId: string) => {
    const attempts = testAttempts.filter(a => a.testId === testId);
    if (attempts.length === 0) return null;
    return Math.max(...attempts.map(a => a.score));
  };

  const getMeritPoints = () => {
    return testAttempts.reduce((sum, a) => sum + (a.passed ? 10 : 2), 0);
  };

  const meritPoints = getMeritPoints();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-28 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Loading text="Loading tests..." />
          </div>
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Link href="/" className="text-primary-600 hover:underline font-medium flex items-center gap-2">
                <ArrowLeft size={18} />
                Back
              </Link>
            </div>
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <Play size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tests Available</h3>
              <p className="text-gray-500">Purchase a level to access tests.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 md:pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="text-primary-600 hover:underline font-medium flex items-center gap-2">
              <ArrowLeft size={18} />
              Back
            </Link>
          </div>

          <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-6 text-white mb-6">
            <h1 className="text-2xl font-bold mb-2">Tests</h1>
            <p className="text-violet-100">Test your Kinyarwanda knowledge.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-xl p-4 border border-gray-200 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Award size={20} className="text-amber-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{testAttempts.length}</div>
              <div className="text-xs sm:text-sm text-gray-500">Tests Taken</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Award size={20} className="text-green-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{meritPoints}</div>
              <div className="text-xs sm:text-sm text-gray-500">Merit Points</div>
            </div>
          </div>

          <FetchLoading isLoading={loading} fallback={<Loading text="Loading tests..." />}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex gap-2 flex-1">
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                >
                  {levelOptions.map(level => (
                    <option key={level} value={level}>{level === 'all' ? 'All Levels' : level}</option>
                  ))}
                </select>
              </div>
              {testAttempts.length > 0 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition"
                >
                  <History size={16} />
                  View History
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {paginatedTests.map((test) => {
                const bestScore = getBestScore(test.id);
                return (
                  <Link
                    key={test.id}
                    href={`/tests/${test.levelId}`}
                    className="bg-white p-5 rounded-xl border-2 border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all block"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 ${test.levelColor} rounded-xl flex items-center justify-center text-white`}>
                        <Play size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{test.title}</h3>
                        <p className="text-gray-500 text-sm">
                          {test.questions.length} questions available
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{test.levelTitle}</span>
                      {bestScore !== null && (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          Best: {bestScore}%
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                >
                  ←
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                >
                  →
                </button>
              </div>
            )}
          </FetchLoading>
        </div>
      </main>
    </div>
  );
}