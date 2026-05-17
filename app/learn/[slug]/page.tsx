'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Loading, FetchLoading } from '@/app/AppLoading';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Shuffle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dbService, Category, Level, Difficulty, Vocabulary } from '@/lib/database';
import type { Vocabulary as VocabType } from '@/lib/database';

interface TopicItem {
  id: string;
  title: string;
  slug: string;
  icon: React.ReactNode;
}

export default function LevelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { userData, user, recordLearningActivity, addViewedVocabulary } = useAuth();
  const preferredLang = userData?.preferredLanguage || 'en';
  const [level, setLevel] = useState<Level | null>(null);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>('');
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [activeDifficulty, setActiveDifficulty] = useState<string>('');
  const [vocabulary, setVocabulary] = useState<VocabType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [fetchingVocab, setFetchingVocab] = useState(false);
  const [viewedWords, setViewedWords] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      setLoading(true);
      await loadData();
      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [slug]);

  useEffect(() => {
    if (activeTopic && !loading) {
      setCurrentIndex(0);
      setViewedWords(new Set());
      loadVocabulary();
    }
  }, [activeTopic, activeDifficulty]);

  useEffect(() => {
    if (!user || !vocabulary[currentIndex]?.id) return;
    const wordId = vocabulary[currentIndex].id;
    const alreadyViewed = viewedWords.has(wordId) ||
      (userData?.viewedVocabulary || []).includes(wordId);
    if (alreadyViewed) return;
    setViewedWords(prev => {
      const newSet = new Set(prev);
      newSet.add(wordId);
      return newSet;
    });
    addViewedVocabulary(wordId);
    dbService.awardPoints(user.uid, 1, 'Read vocabulary', 'vocabulary');
    recordLearningActivity();
  }, [currentIndex, user, vocabulary, userData?.viewedVocabulary]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dbLevels, dbCategories, dbDifficulties] = await Promise.all([
        dbService.getLevels(),
        dbService.getCategories(),
        dbService.getDifficulties(),
      ]);

      const currentLevel = dbLevels.find(l => l.slug === slug);
      if (!currentLevel) {
        setRedirecting(true);
        router.push('/learn');
        return;
      }

      const purchased = (userData?.purchasedLevels || []) as (string | number)[];
      const hasAccess = purchased.includes(currentLevel.order) ||
                        purchased.includes(currentLevel.id) ||
                        purchased.includes(String(currentLevel.id));
      if (!hasAccess) {
        setRedirecting(true);
        router.push('/learn');
        return;
      }

      setLevel(currentLevel);

      const levelDifficulties = dbDifficulties.filter(d =>
        d.levelIds?.includes(currentLevel.id) || !d.levelIds?.length
      );
      setDifficulties(levelDifficulties);

      const levelCategories = dbCategories.filter(c =>
        c.levelIds?.includes(currentLevel.id) || !c.levelIds?.length
      );

      const topicItems: TopicItem[] = [
        { id: 'all', title: 'All', slug: '', icon: <Shuffle size={16} /> },
        ...levelCategories.map((cat) => ({
          id: cat.id,
          title: cat.name,
          slug: cat.slug,
          icon: <BookOpen size={16} />,
        })),
      ];

      setTopics(topicItems);
      setActiveTopic('all');
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const loadVocabulary = async () => {
    if (!level) return;
    setFetchingVocab(true);
    try {
      let filters: { levelId?: string; category?: string; difficulty?: string } = {};

      if (activeTopic === 'all') {
        filters = { levelId: level.id };
      } else if (activeTopic) {
        filters = { levelId: level.id, category: activeTopic };
      }
      if (activeDifficulty) {
        filters.difficulty = activeDifficulty;
      }

      const items = await dbService.getVocabulary(filters);
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      setVocabulary(shuffled);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
      setVocabulary([]);
    } finally {
      setFetchingVocab(false);
    }
  };

  const items = vocabulary;
  const currentItem = items[currentIndex] || {
    word: '',
    wordKinyarwanda: '',
    translations: {},
    pronunciation: ''
  };

  const nextCard = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const prevCard = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  const getTranslation = (item: VocabType) => {
    return item.translations?.[preferredLang] || item.translations?.en || item.word || '';
  };

  const getDisplayWord = (item: VocabType) => {
    return item.wordKinyarwanda || item.word || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/learn" className="flex items-center gap-2 text-primary-600 hover:underline font-medium">
              <ArrowLeft size={18} />
              Back
            </Link>
          </div>

          {level && (
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-5 mb-6 text-white">
              <h1 className="text-xl font-bold mb-1">{level.title}</h1>
              <p className="text-primary-100 text-sm">{level.description}</p>
            </div>
          )}

          {loading || redirecting ? (
            <Loading fullScreen />
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => { setActiveTopic(topic.id); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                      activeTopic === topic.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {topic.title}
                  </button>
                ))}
              </div>

              {difficulties.length > 0 && (
                <div className="mb-4">
                  <div className="sm:hidden">
                    <select
                      value={activeDifficulty || ''}
                      onChange={(e) => setActiveDifficulty(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                    >
                      <option value="">All</option>
                      {difficulties.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden sm:flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                    <button
                      onClick={() => setActiveDifficulty('')}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition shrink-0 ${
                        !activeDifficulty
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {difficulties.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setActiveDifficulty(d.id)}
                        className={`px-2 py-1 rounded-md text-xs font-medium transition shrink-0 ${
                          activeDifficulty === d.id
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {items.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No Vocabulary Yet</h3>
                  <p className="text-gray-500 text-sm">Vocabulary will appear here once added by an admin.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 flex justify-between items-center">
                      <span className="text-white text-sm font-medium">{currentIndex + 1} / {items.length}</span>
                      <button
                        onClick={loadVocabulary}
                        className="flex items-center gap-1 text-white/80 hover:text-white text-xs"
                      >
                        <RefreshCw size={14} />
                        Refresh
                      </button>
                    </div>

                    <div className="p-6 min-h-[260px] flex items-center justify-center">
                      <FetchLoading isLoading={fetchingVocab} fallback={
                        <div className="text-center">
                          <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p className="text-xs text-gray-500">Loading...</p>
                        </div>
                      }>
                        <div className="text-center w-full">
                          <div className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                            {getDisplayWord(currentItem)}
                          </div>
                          {currentItem.pronunciation && (
                            <div className="text-sm text-gray-400 mb-2">
                              [{currentItem.pronunciation}]
                            </div>
                          )}
                          <div className="text-lg text-emerald-600">
                            {getTranslation(currentItem)}
                          </div>
                        </div>
                      </FetchLoading>
                    </div>

                    <div className="border-t border-gray-100 p-3 flex justify-between">
                      <button
                        onClick={prevCard}
                        disabled={items.length <= 1}
                        className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                        Prev
                      </button>
                      <button
                        onClick={nextCard}
                        disabled={items.length <= 1}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center gap-1.5 mt-3 flex-wrap">
                    {Array.from({ length: Math.min(items.length, 10) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          i === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                        aria-label={`Go to word ${i + 1}`}
                      />
                    ))}
                    {items.length > 10 && (
                      <span className="text-xs text-gray-400 self-center ml-1">
                        +{items.length - 10}
                      </span>
                    )}
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