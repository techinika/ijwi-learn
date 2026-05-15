'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Level, Test, TestQuestion, PointHistory, TestAttempt } from '@/lib/database';
import { ArrowLeft, Award, CheckCircle, RefreshCw, Target, TrendingUp, Play, ChevronLeft as PrevPage, ChevronRight as NextPage, BarChart3, History, X } from 'lucide-react';
import { Loading, FetchLoading } from '@/app/AppLoading';

const TESTS_PER_PAGE = 6;

function TestsPageContent() {
  const { user, userData, incrementTestsCompleted, incrementConsecutivePasses, resetConsecutivePasses, completeLevel } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [recommendationLevel, setRecommendationLevel] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const startParam = searchParams.get('start');
    if (startParam && tests.length > 0) {
      const testExists = tests.some(t => t.levelId === startParam);
      if (testExists) {
        startTest(startParam);
      }
    }
  }, [searchParams, tests]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dbLevels, dbTests, history, attempts] = await Promise.all([
        dbService.getLevels(),
        dbService.getTests(),
        user ? dbService.getPointHistory(user.uid) : Promise.resolve([]),
        user ? dbService.getTestAttempts(user.uid) : Promise.resolve([]),
      ]);
      setLevels(dbLevels);
      setTests(dbTests);
      setPointHistory(history);
      setTestAttempts(attempts);
    } catch (e) {
      console.error('Failed to load tests', e);
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = pointHistory.reduce((sum, p) => sum + p.points, 0);
  const meritPoints = pointHistory.filter(p => p.type === 'merit').reduce((sum, p) => sum + p.points, 0);
  const vocabularyPoints = pointHistory.filter(p => p.type === 'vocabulary').reduce((sum, p) => sum + p.points, 0);
  const testPoints = pointHistory.filter(p => p.type === 'test').reduce((sum, p) => sum + p.points, 0);

  const purchasedLevels = userData?.purchasedLevels || [];
  const consecutivePasses = userData?.consecutivePasses || 0;

  const startTest = async (levelId: string) => {
    const levelTests = tests.filter(t => t.levelId === levelId);
    if (levelTests.length === 0) return;

    const test = levelTests[0];
    const allQuestions = test.questions;
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setTestQuestions(selected);
    setSelectedLevel(levelId);
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
    setShowRecommendation(false);
  };

  const handleAnswer = async (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQuestion < testQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const score = calculateScore();
      const percentage = Math.round((score / testQuestions.length) * 100);
      const passed = percentage >= 80;
      setShowResult(true);

      if (user && selectedLevel) {
        const level = levels.find(l => l.id === selectedLevel);
        await dbService.createTestAttempt({
          userId: user.uid,
          testId: selectedLevel,
          levelId: selectedLevel,
          levelTitle: level?.title || 'Unknown',
          score,
          totalQuestions: testQuestions.length,
          percentage,
          passed,
          answers: newAnswers,
          createdAt: new Date(),
        });
      }

      await incrementTestsCompleted();

      if (user) {
        await dbService.awardPoints(user.uid, 10, 'Completed a test', 'test');
      }

      if (passed) {
        await incrementConsecutivePasses();
        if (user && selectedLevel) {
          await dbService.awardPoints(user.uid, 20, 'Test passed (80%+)', 'test');

          const level = levels.find(l => l.id === selectedLevel);
          const score = calculateScore();
          if (level) {
            await completeLevel(level.order);
            await dbService.createCertificate({
              userId: user.uid,
              levelId: parseInt(selectedLevel),
              levelName: level.title,
              score: Math.round((score / testQuestions.length) * 100),
              completedAt: new Date(),
              certificateId: `CERT-${user.uid.slice(0, 8)}-${selectedLevel}-${Date.now()}`,
            });
            await dbService.awardPoints(user.uid, 100, 'Achieved certificate', 'merit');
            await dbService.awardPoints(user.uid, 50, 'Certificate merit bonus', 'merit');
          }
        }

        if (consecutivePasses + 1 >= 10) {
          const currentLevelIndex = levels.findIndex(l => l.id === selectedLevel);
          const nextLevelIndex = currentLevelIndex + 1;
          if (nextLevelIndex < levels.length) {
            setRecommendationLevel(levels[nextLevelIndex].title);
            setShowRecommendation(true);
          }
        }
      } else {
        await resetConsecutivePasses();
      }
      await loadData();
    }
  };

  const calculateScore = () => {
    return testQuestions.reduce((score, q, idx) =>
      score + (q.correctAnswer === answers[idx] ? 1 : 0), 0);
  };

  const passed = () => (calculateScore() / testQuestions.length) >= 0.8;

  const handleUpgrade = async () => {
    if (recommendationLevel) {
      const nextLevel = levels.find(l => l.title === recommendationLevel);
      if (nextLevel && !purchasedLevels.includes(levels.indexOf(nextLevel) + 1)) {
        // purchaseLevel would be called here
      }
    }
    setShowRecommendation(false);
  };

  const levelOptions = ['all', ...levels.map(l => l.title)];

  const availableTests = tests.filter(t => {
    const levelIdx = levels.findIndex(l => l.id === t.levelId) + 1;
    return purchasedLevels.includes(levelIdx);
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

  const passedLevelIds = new Set(testAttempts.filter(a => a.passed).map(a => a.levelId));

  useEffect(() => {
    setCurrentPage(1);
  }, [filterLevel]);

  if (selectedLevel !== null && !showResult && testQuestions.length > 0) {
    const question = testQuestions[currentQuestion];

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => { setSelectedLevel(null); setTestQuestions([]); }} className="text-primary-600 hover:underline flex items-center gap-2 text-sm font-medium">
                <ArrowLeft size={18} />
                Back
              </button>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Streak: {consecutivePasses} </span>
                <span className="text-gray-500 text-sm">Question {currentQuestion + 1} of {testQuestions.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{question.question}</h2>

              <div className="space-y-3">
                {question.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={answers[currentQuestion] !== undefined}
                    className="w-full p-4 text-left rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition text-gray-700 font-medium disabled:opacity-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (showResult && testQuestions.length > 0) {
    const score = calculateScore();
    const percentage = Math.round((score / testQuestions.length) * 100);
    const level = levels.find(l => l.id === selectedLevel);

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${passed() ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              {passed() ? <CheckCircle size={40} className="text-emerald-600" /> : <Award size={40} className="text-amber-600" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {passed() ? 'Congratulations!' : 'Keep Practicing!'}
            </h2>
            <div className="text-5xl font-bold text-primary-600 mb-4">{percentage}%</div>
            <p className="text-gray-600 mb-4">
              You got {score} out of {testQuestions.length} correct.
            </p>
            <p className="text-gray-500 mb-8">
              Current streak: {passed() ? consecutivePasses + 1 : 0}
            </p>

            {showRecommendation && recommendationLevel && (
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white mb-8">
                <p className="mb-4">
                  You&apos;ve passed 10 tests consecutively! You&apos;re ready to move to {recommendationLevel} level.
                </p>
                <button
                  onClick={handleUpgrade}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium"
                >
                  Upgrade to {recommendationLevel}
                </button>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button onClick={() => startTest(selectedLevel!)} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                <RefreshCw size={18} />
                Try Again
              </button>
              <button onClick={() => { setSelectedLevel(null); setTestQuestions([]); loadData(); }} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                Back to Tests
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="text-primary-600 hover:underline font-medium flex items-center gap-2">
              <ArrowLeft size={18} />
              Back
            </Link>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8">
            <h1 className="text-2xl font-bold mb-2">Tests</h1>
            <p className="text-primary-100">Take a test to earn your certificate. You need 80% or higher to pass.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mx-auto mb-2">
                <Target size={18} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalPoints}</div>
              <div className="text-xs sm:text-sm text-gray-500">Total Points</div>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mx-auto mb-2">
                <TrendingUp size={18} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{consecutivePasses}</div>
              <div className="text-xs sm:text-sm text-gray-500">Streak</div>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mx-auto mb-2">
                <Award size={18} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{userData?.testsCompleted || 0}</div>
              <div className="text-xs sm:text-sm text-gray-500">Tests Done</div>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mx-auto mb-2">
                <Award size={18} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{meritPoints}</div>
              <div className="text-xs sm:text-sm text-gray-500">Merit Points</div>
            </div>
          </div>

          <FetchLoading isLoading={loading} fallback={<Loading text="Loading tests..." />}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700 self-center">Filter:</span>
                <div className="sm:hidden w-full">
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium bg-white"
                  >
                    {levelOptions.map(level => (
                      <option key={level} value={level}>{level === 'all' ? 'All Levels' : level}</option>
                    ))}
                  </select>
                </div>
                <div className="hidden sm:flex gap-2 flex-wrap">
                  {levelOptions.map(level => (
                    <button
                      key={level}
                      onClick={() => setFilterLevel(level)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        filterLevel === level
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {level === 'all' ? 'All Levels' : level}
                    </button>
                  ))}
                </div>
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
                const level = levels.find(l => l.id === test.levelId);
                const colorMap: Record<string, string> = {
                  green: 'bg-emerald-500',
                  blue: 'bg-primary-500',
                  purple: 'bg-purple-500',
                  amber: 'bg-amber-500',
                };
                const bgColor = colorMap[level?.color || 'blue'] || 'bg-gray-500';
                return (
                  <Link
                    key={test.id}
                    href={`/tests/${test.levelId}`}
                    className="bg-white p-5 rounded-xl border-2 border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all block"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center text-white`}>
                        <Play size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{test.title}</h3>
                        <p className="text-gray-500 text-sm">
                          {test.questions.length} questions available
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium text-sm shadow-md text-center">
                        {passedLevelIds.has(test.levelId) ? 'View Details' : 'Start Test'}
                      </span>
                      {passedLevelIds.has(test.levelId) && (
                        <span className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-medium whitespace-nowrap">
                          Passed
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
                  <PrevPage size={20} />
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                >
                  <NextPage size={20} />
                </button>
              </div>
            )}

            {filteredTests.length === 0 && (
              <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500">No tests available for this level.</p>
              </div>
            )}
          </FetchLoading>
        </div>
      </main>

      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <BarChart3 size={20} className="text-primary-600" />
                <h2 className="text-lg font-bold text-gray-900">Test History & Improvement</h2>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {testAttempts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No test attempts yet.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Overall Stats</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-gray-900">{testAttempts.length}</div>
                        <div className="text-xs text-gray-500">Total Attempts</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-emerald-600">{testAttempts.filter(a => a.passed).length}</div>
                        <div className="text-xs text-gray-500">Passed</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {testAttempts.length > 0 ? Math.round(testAttempts.reduce((s, a) => s + a.percentage, 0) / testAttempts.length) : 0}%
                        </div>
                        <div className="text-xs text-gray-500">Avg Score</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Score Trend</h3>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-end gap-1.5 h-32">
                        {[...testAttempts].reverse().slice(-20).map((attempt, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className={`w-full rounded-t ${
                                attempt.passed ? 'bg-emerald-500' : 'bg-red-400'
                              } transition-all hover:opacity-80 min-h-[4px]`}
                              style={{ height: `${attempt.percentage}%` }}
                              title={`${attempt.levelTitle}: ${attempt.percentage}% (${attempt.score}/${attempt.totalQuestions})`}
                            />
                            <div className="text-[10px] text-gray-400 -rotate-45 origin-left whitespace-nowrap">
                              {i === 0 || i === [...testAttempts].reverse().slice(-20).length - 1 || i % 5 === 0
                                ? new Date(attempt.createdAt).toLocaleDateString().slice(0, 5)
                                : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Attempt History</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {testAttempts.map((attempt) => (
                        <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              attempt.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {attempt.percentage}%
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{attempt.levelTitle}</div>
                              <div className="text-xs text-gray-500">
                                {attempt.score}/{attempt.totalQuestions} correct
                                {' · '}
                                {new Date(attempt.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            attempt.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button onClick={() => setShowHistory(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"><Navbar /><div className="pt-28 pb-12 px-4 text-center"><Loading text="Loading..." /></div></div>}>
      <TestsPageContent />
    </Suspense>
  );
}