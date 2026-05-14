'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/lib/database';

const PaymentModal = dynamic(() => import('@/components/PaymentModal'), { ssr: false });
import Link from 'next/link';
import { 
  GraduationCap, MessageCircle, BookOpen, BookMarked, 
  Play, FileText, Award, MessageSquare, CheckCircle,
  ArrowRight, Lock, Unlock, ChevronDown, ChevronUp
} from 'lucide-react';

const colorMap: Record<string, string> = {
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
};

const iconMap: Record<string, React.ReactNode> = {
  'graduation-cap': <GraduationCap size={28} />,
  'message-circle': <MessageCircle size={28} />,
  'book-open': <BookOpen size={28} />,
  'book-marked': <BookMarked size={28} />,
};

interface LevelData {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  icon: string;
  color: string;
  order: number;
}

interface SubscriptionData {
  id: string;
  levelId: string;
  status: string;
  nextBillingDate: Date;
}

const defaultLevels: LevelData[] = [
  { id: '1', slug: 'beginner', title: 'Beginner', description: 'Learn the basics of Kinyarwanda', price: 0, icon: 'graduation-cap', color: 'green', order: 1 },
  { id: '2', slug: 'practice', title: 'Practice', description: 'AI-powered conversation practice', price: 9.99, icon: 'message-circle', color: 'blue', order: 2 },
  { id: '3', slug: 'intermediate', title: 'Intermediate', description: 'Expand vocabulary and grammar rules', price: 14.99, icon: 'book-open', color: 'purple', order: 3 },
  { id: '4', slug: 'fluent', title: 'Fluent', description: 'Stories and advanced content', price: 19.99, icon: 'book-marked', color: 'amber', order: 4 },
];

export default function Home() {
  const { user, userData, loading, signInWithGoogle, purchaseLevel } = useAuth();
  const [showFeatures, setShowFeatures] = useState(false);
  const [levels, setLevels] = useState<LevelData[]>(defaultLevels);
  const [paymentLevel, setPaymentLevel] = useState<LevelData | null>(null);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);

  useEffect(() => {
    loadLevels();
    if (user?.uid) {
      loadSubscriptions();
    }
  }, [user?.uid]);

  const loadLevels = async () => {
    setLevelsLoading(true);
    try {
      const dbLevels = await dbService.getLevels();
      if (dbLevels.length > 0) {
        setLevels(dbLevels as any);
      }
    } catch (error) {
      console.log('Using default levels');
    }
    setLevelsLoading(false);
  };

  const loadSubscriptions = async () => {
    try {
      const res = await fetch('/api/profile/subscriptions');
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  };

  const isLevelAccessible = (levelId: string | number): boolean => {
    const levelIdStr = String(levelId);
    const levelIdNum = typeof levelId === 'number' ? levelId : parseInt(levelId);
    const activeSub = subscriptions.find(
      (s) => s.levelId === levelIdStr && s.status === 'active'
    );
    if (activeSub) {
      const nextBilling = new Date(activeSub.nextBillingDate);
      if (nextBilling > new Date()) {
        return true;
      }
    }
    const purchased = (userData?.purchasedLevels || []) as (string | number)[];
    return purchased.includes(levelIdStr) || purchased.includes(levelIdNum);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || !userData) {
    return <LandingPage showFeatures={showFeatures} setShowFeatures={setShowFeatures} signInWithGoogle={signInWithGoogle} />;
  }

  const purchasedLevels = userData?.purchasedLevels || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-8 text-white mb-10 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user.displayName?.split(' ')[0] || 'Learner'}!
                </h1>
                <p className="text-primary-100 text-lg">Continue your Kinyarwanda journey</p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold">{userData?.totalPoints || 0}</div>
                  <div className="text-primary-200 text-sm">Points</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{userData?.testsCompleted || 0}</div>
                  <div className="text-primary-200 text-sm">Tests</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{userData?.consecutivePasses || 0}</div>
                  <div className="text-primary-200 text-sm">Streak</div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Learning Levels</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {levels.map((level) => {
              const isUnlocked = isLevelAccessible(level.order);
              
              return (
                <div key={level.id} className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${isUnlocked ? 'border-gray-200 hover:border-primary-300 hover:shadow-md' : 'border-gray-100 opacity-90'}`}>
                  <div className="flex items-start gap-5 mb-5">
                    <div className={`w-14 h-14 ${colorMap[level.color]} rounded-2xl flex items-center justify-center text-white shadow-md`}>
                      {iconMap[level.icon]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{level.title}</h3>
                        {isUnlocked ? (
                          <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                            <Unlock size={14} />
                            Unlocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm font-medium">
                            <Lock size={14} />
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500">{level.price === 0 ? 'Free' : `${level.price.toLocaleString()} RWF/mo`}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-5">{level.description}</p>

                  {isUnlocked ? (
                    <Link
                      href={`/learn/${level.slug || level.title.toLowerCase()}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-semibold"
                    >
                      Continue Learning
                      <ArrowRight size={18} />
                    </Link>
                  ) : level.price === 0 ? (
                    <button
                      onClick={() => purchaseLevel(parseInt(level.id))}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-md"
                    >
                      Unlock Free
                    </button>
                  ) : (
                    <button
                      onClick={() => setPaymentLevel(level)}
                      className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold shadow-md"
                    >
                      Subscribe for {level.price.toLocaleString()} RWF/mo
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6">Quick Access</h2>
          <div className="grid grid-cols-3 gap-5">
            {[
              { href: '/videos', icon: <Play size={24} />, title: 'Videos', desc: 'Learn visually', color: 'bg-red-100 text-red-600' },
              { href: '/tests', icon: <FileText size={24} />, title: 'Tests', desc: 'Track progress', color: 'bg-amber-100 text-amber-600' },
              { href: '/chat', icon: <MessageSquare size={24} />, title: 'Chat', desc: 'Ask teachers', color: 'bg-emerald-100 text-emerald-600' },
            ].map((item, i) => (
              <Link key={i} href={item.href} className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all">
                <div className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center`}>
                  {item.icon}
                </div>
                <span className="font-semibold text-gray-800">{item.title}</span>
                <span className="text-sm text-gray-500">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {paymentLevel && (
        <PaymentModal
          level={{
            id: paymentLevel.id,
            slug: paymentLevel.slug || '',
            title: paymentLevel.title,
            price: paymentLevel.price,
          }}
          user={{
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
          }}
          onClose={() => setPaymentLevel(null)}
          onSuccess={async () => {
            await loadSubscriptions();
            setPaymentLevel(null);
          }}
          isSubscription={true}
          billingDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
        />
      )}

      <footer className="bg-white border-t border-gray-100 py-6 text-center text-sm text-gray-500">
        © 2026 IJWI-LEARN
      </footer>
    </div>
  );
}

function LandingPage({ showFeatures, setShowFeatures, signInWithGoogle }: { 
  showFeatures: boolean; 
  setShowFeatures: (v: boolean) => void; 
  signInWithGoogle: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-28">
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-transparent to-emerald-50"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-100 rounded-full opacity-30 blur-3xl"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-sm">
                <GraduationCap size={18} />
                Learn Kinyarwanda Today
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
                Speak Kinyarwanda
                <span className="block text-primary-600">With Confidence</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
                The modern way to learn Rwanda's beautiful language. 
                From basics to fluency, at your own pace.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button
                  onClick={() => signInWithGoogle()}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={() => setShowFeatures(!showFeatures)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition font-medium text-lg"
                >
                  {showFeatures ? 'Hide Features' : 'See Features'}
                  {showFeatures ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              <p className="text-base text-gray-500">
                Beginner level is free &bull; No credit card required
              </p>
            </div>

            <div className="mt-24 grid grid-cols-3 max-w-lg mx-auto gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
                  <GraduationCap size={28} />
                </div>
                <p className="text-base font-semibold text-gray-800">Beginner</p>
                <p className="text-sm text-gray-500 mt-1">Start here</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
                  <MessageCircle size={28} />
                </div>
                <p className="text-base font-semibold text-gray-800">Practice</p>
                <p className="text-sm text-gray-500 mt-1">AI chat</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
                  <BookOpen size={28} />
                </div>
                <p className="text-base font-semibold text-gray-800">Master</p>
                <p className="text-sm text-gray-500 mt-1">Advanced</p>
              </div>
            </div>

            <div className="mt-16 flex justify-center gap-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">4</div>
                <div className="text-sm text-gray-500">Proficiency Levels</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-500">Vocabulary Words</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">100+</div>
                <div className="text-sm text-gray-500">Stories</div>
              </div>
            </div>
          </div>
        </section>

        {showFeatures && (
          <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                A complete learning platform designed to take you from beginner to fluent
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: <MessageCircle size={28} />, title: 'AI Practice', desc: 'Practice conversations with intelligent AI that adapts to your level', color: 'bg-primary-100 text-primary-600' },
                  { icon: <Play size={28} />, title: 'Video Lessons', desc: 'Learn with engaging video content from native speakers', color: 'bg-red-100 text-red-600' },
                  { icon: <FileText size={28} />, title: 'Tests', desc: 'Track your progress with interactive quizzes and assessments', color: 'bg-amber-100 text-amber-600' },
                  { icon: <Award size={28} />, title: 'Certificates', desc: 'Earn recognized certificates upon completing each level', color: 'bg-emerald-100 text-emerald-600' },
                  { icon: <MessageSquare size={28} />, title: 'Teacher Support', desc: 'Get help from experienced teachers whenever you need it', color: 'bg-purple-100 text-purple-600' },
                  { icon: <BookMarked size={28} />, title: 'Stories', desc: 'Read engaging stories in Kinyarwanda with translations', color: 'bg-indigo-100 text-indigo-600' },
                ].map((f, i) => (
                  <div key={i} className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary-200 transition-all duration-300 group">
                    <div className={`w-14 h-14 ${f.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      {f.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12">
              Choose the level that fits your goals
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {defaultLevels.map((level, idx) => (
                <div key={level.id} className={`relative bg-white p-8 rounded-2xl border-2 ${idx === 0 ? 'border-primary-200 shadow-lg' : 'border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-200'} transition-all`}>
                  {idx === 0 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <div className={`w-16 h-16 ${colorMap[level.color]} rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-md`}>
                    {iconMap[level.icon]}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{level.title}</h3>
                  <p className="text-gray-500 text-center mb-4">{level.description}</p>
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold text-gray-900">{level.price === 0 ? 'Free' : `${level.price.toLocaleString()} RWF`}</span>
                    {level.price > 0 && <span className="text-gray-500">/mo</span>}
                  </div>
                  <button
                    onClick={() => signInWithGoogle()}
                    className={`w-full py-3 rounded-xl font-semibold transition ${idx === 0 ? 'bg-primary-600 text-white hover:bg-primary-700' : 'border-2 border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'}`}
                  >
                    {level.price === 0 ? 'Start Free' : 'Get Started'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-5"></div>
          <div className="absolute top-0 left-10 w-40 h-40 bg-white opacity-10 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white opacity-10 rounded-full"></div>
          <div className="max-w-3xl mx-auto text-center relative">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Start?
            </h2>
            <p className="text-xl text-primary-100 mb-10 leading-relaxed">
              Join thousands of learners mastering Kinyarwanda one step at a time
            </p>
            <button
              onClick={() => signInWithGoogle()}
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-primary-700 rounded-2xl hover:bg-primary-50 transition font-bold text-lg shadow-xl hover:shadow-2xl"
            >
              Sign In with Google
              <ArrowRight size={22} />
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <div>
            <span className="font-semibold text-white">IJWI-LEARN</span>
          </div>
          <div className="flex gap-6">
            <span>© 2026 IJWI-LEARN</span>
          </div>
        </div>
      </footer>
    </div>
  );
}