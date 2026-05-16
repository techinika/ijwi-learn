'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Level, Test, TestQuestion } from '@/lib/database';
import { ArrowLeft, Award, CheckCircle, RefreshCw } from 'lucide-react';
import { Loading } from '@/app/AppLoading';

export default function TestAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userData, incrementTestsCompleted, incrementConsecutivePasses, resetConsecutivePasses, completeLevel } = useAuth();
  
  const levelId = params.id as string;
  const [test, setTest] = useState<Test | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [testAttempts, setTestAttempts] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<{ levelId: number; difficulty: string }[]>([]);
  
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consecutivePasses, setConsecutivePasses] = useState(userData?.consecutivePasses || 0);
  const [currentDifficulty, setCurrentDifficulty] = useState('');

  useEffect(() => {
    loadData();
  }, [levelId]);

  const loadData = async () => {
    try {
      const [dbLevels, dbTests, attempts, certs] = await Promise.all([
        dbService.getLevels(),
        dbService.getTests(),
        user ? dbService.getTestAttempts(user.uid) : Promise.resolve([]),
        user ? dbService.getCertificates(user.uid) : Promise.resolve([]),
      ]);
      
      setLevels(dbLevels);
      setTestAttempts(attempts);
      setCertificates(certs.map(c => ({ levelId: c.levelId, difficulty: c.difficulty })));
      
      const foundTest = dbTests.find(t => t.levelId === levelId);
      if (foundTest) {
        setTest(foundTest);
        const vidLevel = dbLevels.find(l => l.id === foundTest.levelId);
        if (vidLevel) setLevel(vidLevel);
        setCurrentDifficulty(foundTest.difficulty || '');
        
        const allQuestions = foundTest.questions;
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(10, shuffled.length));
        setTestQuestions(selected);
      }
    } catch (e) {
      console.error('Failed to load test', e);
    }
    setLoading(false);
  };

  const calculateScore = () => {
    return testQuestions.reduce((score, q, idx) =>
      score + (q.correctAnswer === answers[idx] ? 1 : 0), 0);
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

      const levelNum = parseInt(levelId || '0');
      const existingCert = certificates.find(c => c.levelId === levelNum && c.difficulty === currentDifficulty);
      const hasAttemptedBefore = testAttempts.some(a => a.levelId === levelId);

      if (user && levelId) {
        await dbService.createTestAttempt({
          userId: user.uid,
          testId: levelId,
          levelId: levelId,
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

      if (user && !hasAttemptedBefore) {
        await dbService.awardPoints(user.uid, 10, 'Completed a test', 'test');
      }

      if (passed) {
        await incrementConsecutivePasses();
        if (user && levelId) {
          const passedLevel = levels.find(l => l.id === levelId);
          const score = calculateScore();

          if (!existingCert && passedLevel) {
            await dbService.awardPoints(user.uid, 20, 'Test passed (80%+)', 'test');
            await completeLevel(passedLevel.order);
            await dbService.createCertificate({
              userId: user.uid,
              levelId: levelNum,
              levelName: passedLevel.title,
              difficulty: currentDifficulty,
              score: Math.round((score / testQuestions.length) * 100),
              completedAt: new Date(),
              certificateId: `CERT-${user.uid.slice(0, 8)}-${levelId}-${currentDifficulty}-${Date.now()}`,
            });
            await dbService.awardPoints(user.uid, 100, 'Achieved certificate', 'merit');
            await dbService.awardPoints(user.uid, 50, 'Certificate merit bonus', 'merit');
          } else if (hasAttemptedBefore) {
            await dbService.awardPoints(user.uid, 5, 'Practice test completed', 'practice');
          }
        }
      } else {
        await resetConsecutivePasses();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-28 flex items-center justify-center">
          <Loading text="Loading test..." />
        </div>
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
            <button onClick={() => router.push('/tests')} className="text-primary-600 hover:underline">Back to Tests</button>
          </div>
        </main>
      </div>
    );
  }

  if (showResult) {
    const score = calculateScore();
    const percentage = Math.round((score / testQuestions.length) * 100);
    const passed = percentage >= 80;

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              {passed ? <CheckCircle size={40} className="text-emerald-600" /> : <Award size={40} className="text-amber-600" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {passed ? 'Congratulations!' : 'Keep Practicing!'}
            </h2>
            <div className="text-5xl font-bold text-primary-600 mb-4">{percentage}%</div>
            <p className="text-gray-600 mb-4">
              You got {score} out of {testQuestions.length} correct.
            </p>
            <p className="text-gray-500 mb-8">
              Current streak: {passed ? consecutivePasses + 1 : 0}
            </p>

            <div className="flex justify-center gap-3">
              <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                <RefreshCw size={18} />
                Try Again
              </button>
              <button onClick={() => router.push('/tests')} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                Back to Tests
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const question = testQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => router.push('/tests')} className="text-primary-600 hover:underline flex items-center gap-2 text-sm font-medium">
              <ArrowLeft size={18} />
              Exit Test
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