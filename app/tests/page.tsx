'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Level } from '@/lib/database';
import { ArrowLeft, Award, CheckCircle, XCircle, RefreshCw, GraduationCap, MessageCircle, BookOpen, BookMarked, ArrowRight, Lightbulb, Target, TrendingUp, Play } from 'lucide-react';
import { generateTestQuestions } from '@/lib/content';

interface TestQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface LevelInfo {
  id: number;
  title: string;
  color: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  nextLevel: string | null;
}

export default function TestsPage() {
  const { user, userData, incrementTestsCompleted, incrementConsecutivePasses, resetConsecutivePasses, purchaseLevel } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [recommendationLevel, setRecommendationLevel] = useState<string | null>(null);
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      const dbLevels = await dbService.getLevels();
      if (dbLevels.length > 0) {
        const mappedLevels = dbLevels.map((l, idx) => ({
          id: idx + 1,
          title: l.title,
          color: l.color,
          difficulty: 'beginner' as const,
          nextLevel: dbLevels[idx + 1]?.title || null,
        }));
        setLevels(mappedLevels);
      }
    } catch (error) {
      console.log('Error loading levels:', error);
    }
    setLoading(false);
  };

  const purchasedLevels = userData?.purchasedLevels || [];
  const consecutivePasses = userData?.consecutivePasses || 0;
  const totalPoints = userData?.totalPoints || 0;

  const startTest = async (level: number) => {
    const levelData = levels.find(l => l.id === level);
    const testQuestions = await generateTestQuestions(10, level.toString(), levelData?.difficulty);
    setQuestions(testQuestions);
    setSelectedLevel(level);
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
    setShowRecommendation(false);
  };

  const handleAnswer = async (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const passed = calculateScore() / questions.length >= 0.8;
      setShowResult(true);
      
      await incrementTestsCompleted();
      
      if (user) {
        await dbService.awardPoints(user.uid, 10, 'Completed a test', 'test');
      }
      
      if (passed) {
        await incrementConsecutivePasses();
        if (user) {
          await dbService.awardPoints(user.uid, 20, 'Test passed (80%+)', 'test');
        }
        
        if (consecutivePasses + 1 >= 10) {
          const currentLevelData = levels.find(l => l.id === selectedLevel);
          if (currentLevelData?.nextLevel) {
            setRecommendationLevel(currentLevelData.nextLevel);
            setShowRecommendation(true);
          }
        }
      } else {
        await resetConsecutivePasses();
      }
    }
  };

  const calculateScore = () => {
    return questions.reduce((score, q, idx) => 
      score + (q.correctAnswer === answers[idx] ? 1 : 0), 0);
  };

  const passed = () => (calculateScore() / questions.length) >= 0.8;

  const handleUpgrade = async () => {
    if (recommendationLevel) {
      const levelData = levels.find(l => l.title === recommendationLevel);
      if (levelData && !purchasedLevels.includes(levelData.id)) {
        await purchaseLevel(levelData.id);
      }
    }
    setShowRecommendation(false);
  };

  if (selectedLevel !== null && !showResult && questions.length > 0) {
    const question = questions[currentQuestion];
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => { setSelectedLevel(null); setQuestions([]); }} className="text-primary-600 hover:underline flex items-center gap-2 text-sm font-medium">
                <ArrowLeft size={18} />
                Back
              </button>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Streak: {consecutivePasses} 🔥</span>
                <span className="text-gray-500 text-sm">Question {currentQuestion + 1} of {questions.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{question.question}</h2>
              
              <div className="space-y-3">
                {question.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="w-full p-4 text-left rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition text-gray-700 font-medium"
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

  if (showResult && questions.length > 0) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    const levelData = levels.find(l => l.id === selectedLevel);

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
              You got {score} out of {questions.length} correct.
            </p>
            <p className="text-gray-500 mb-8">
              Current streak: {passed() ? consecutivePasses + 1 : 0} 🔥
            </p>

            {showRecommendation && recommendationLevel && (
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb size={24} />
                  <span className="text-xl font-bold">Recommendation</span>
                </div>
                <p className="mb-4">
                  You've passed 10 tests consecutively! You're ready to move to {recommendationLevel} level.
                </p>
                <button
                  onClick={handleUpgrade}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium"
                >
                  Upgrade to {recommendationLevel}
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button onClick={() => startTest(selectedLevel!)} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                <RefreshCw size={18} />
                Try Again
              </button>
              <button onClick={() => { setSelectedLevel(null); setQuestions([]); }} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
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
            <p className="text-primary-100">Test your knowledge and earn points</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mx-auto mb-2">
                <Target size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalPoints}</div>
              <div className="text-sm text-gray-500">Total Points</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mx-auto mb-2">
                <TrendingUp size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{consecutivePasses}</div>
              <div className="text-sm text-gray-500">Streak</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mx-auto mb-2">
                <Award size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{userData?.testsCompleted || 0}</div>
              <div className="text-sm text-gray-500">Tests Done</div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading tests...</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-8">Take a test to earn your certificate. You need 80% or higher to pass.</p>

<div className="grid sm:grid-cols-2 gap-5">
                {levels.map((level) => {
                  const isUnlocked = purchasedLevels.includes(level.id);
                  const colorMap: Record<string, string> = {
                    green: 'bg-emerald-500',
                    blue: 'bg-primary-500',
                    purple: 'bg-purple-500',
                    amber: 'bg-amber-500',
                  };
                  const bgColor = colorMap[level.color] || 'bg-gray-500';
                  return (
                    <div
                      key={level.id}
                      onClick={() => isUnlocked && startTest(level.id)}
                      className={`bg-white p-5 rounded-xl border-2 transition-all ${isUnlocked ? 'cursor-pointer hover:shadow-lg hover:border-primary-300 border-gray-200' : 'opacity-60 border-gray-100'}`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center text-white`}>
                          <Play size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{level.title} Test</h3>
                          <p className="text-gray-500 text-sm">10 random questions</p>
                        </div>
                      </div>
                      {isUnlocked ? (
                        <button className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium text-sm shadow-md">
                      Start Test
                    </button>
                      ) : (
                        <span className="block text-center py-2.5 text-gray-400 text-sm font-medium">Locked</span>
                      )}
                    </div>
                  );
                })}
              </div>
          </>
        )}
        </div>
      </main>
    </div>
  );
}