'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Level, Test } from '@/lib/database';
import { ArrowLeft, Play, Award, Target, Clock, CheckCircle } from 'lucide-react';

export default function TestDetailPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  
  const [test, setTest] = useState<Test | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [testAttempts, setTestAttempts] = useState<{ passed: boolean; percentage: number }[]>([]);
  
  useEffect(() => {
    loadData();
  }, [testId]);

  const loadData = async () => {
    try {
      const [dbLevels, dbTests, attempts] = await Promise.all([
        dbService.getLevels(),
        dbService.getTests(),
        user ? dbService.getTestAttempts(user.uid) : Promise.resolve([]),
      ]);
      
      setLevels(dbLevels);
      
      const foundTest = dbTests.find(t => t.levelId === testId);
      if (foundTest) {
        setTest(foundTest);
        const vidLevel = dbLevels.find(l => l.id === foundTest.levelId);
        if (vidLevel) setLevel(vidLevel);
        
        const testAttempts = attempts.filter((a: any) => a.levelId === testId);
        setTestAttempts(testAttempts.map((a: any) => ({ passed: a.passed, percentage: a.percentage })));
      }
    } catch (e) {
      console.error('Failed to load test', e);
    }
    setLoading(false);
  };

  const hasPassed = testAttempts.some(a => a.passed);
  const bestScore = testAttempts.length > 0 
    ? Math.max(...testAttempts.map(a => a.percentage))
    : null;

  const handleStartTest = () => {
    router.push(`/tests/${testId}/attempt`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading test...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Test Not Found</h1>
            <Link href="/tests" className="text-primary-600 hover:underline">Back to Tests</Link>
          </div>
        </main>
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    green: 'bg-emerald-500',
    blue: 'bg-primary-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
  };
  const bgColor = colorMap[level?.color || 'blue'] || 'bg-gray-500';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <main className="pt-20 md:pt-30 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/tests" className="text-primary-600 hover:underline font-medium flex items-center gap-2">
              <ArrowLeft size={18} />
              Back to Tests
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className={`h-2 ${bgColor}`}></div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-16 h-16 ${bgColor} rounded-2xl flex items-center justify-center text-white shrink-0`}>
                  <Target size={32} />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{test.title}</h1>
                  {level && (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 ${bgColor} text-white rounded-full text-xs font-medium`}>
                      <Award size={12} />
                      {level.title}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{test.questions.length}</div>
                  <div className="text-sm text-gray-500">Questions</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">80%</div>
                  <div className="text-sm text-gray-500">To Pass</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{bestScore !== null ? `${bestScore}%` : '-'}</div>
                  <div className="text-sm text-gray-500">Best Score</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold ${hasPassed ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {hasPassed ? <CheckCircle size={24} className="inline" /> : testAttempts.length}
                  </div>
                  <div className="text-sm text-gray-500">{hasPassed ? 'Passed' : 'Attempts'}</div>
                </div>
              </div>

              {testAttempts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Attempts</h3>
                  <div className="flex gap-2 flex-wrap">
                    {testAttempts.slice(-5).reverse().map((attempt, idx) => (
                      <span 
                        key={idx}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          attempt.passed 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {attempt.percentage}% {attempt.passed ? '✓' : '✗'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleStartTest}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold text-lg shadow-md transition-all"
              >
                <Play size={24} />
                {hasPassed ? 'Retry Test' : 'Start Test'}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                You need 80% or higher to pass and earn a certificate
              </p>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Test Tips</h3>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• Read each question carefully before selecting an answer</li>
              <li>• You can skip questions and come back to them</li>
              <li>• Take your time - there's no time limit</li>
              <li>• You can retry the test as many times as you want</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}