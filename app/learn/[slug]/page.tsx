'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Loading, FetchLoading } from '@/app/AppLoading';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Shuffle, RefreshCw, Filter } from 'lucide-react';
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
    loadData();
  }, [slug]);

  useEffect(() => {
    if (activeTopic) {
      loadVocabulary();
      setViewedWords(new Set());
    }
  }, [activeTopic]);

  useEffect(() => {
    setActiveDifficulty('');
  }, [activeTopic]);

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
        { id: 'all', title: 'All', slug: '', icon: <Shuffle size={20} /> },
        ...levelCategories.map((cat) => ({
          id: cat.id,
          title: cat.name,
          slug: cat.slug,
          icon: <BookOpen size={20} />,
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
          <div className="flex items-center gap-4 mb-8">
            <Link href="/learn" className="flex items-center gap-2 text-primary-600 hover:underline font-medium">
              <ArrowLeft size={20} />
              Back
            </Link>
          </div>

          {level && (
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 mb-8 text-white">
              <h1 className="text-2xl font-bold mb-2">{level.title}</h1>
              <p className="text-primary-100">{level.description}</p>
            </div>
          )}

          {loading || redirecting ? (
            <Loading fullScreen />
          ) : (
            <>
              <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-thin">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => { setActiveTopic(topic.id); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all shrink-0 min-w-[100px] ${
                      activeTopic === topic.id
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'bg-white border border-gray-100 text-gray-700 hover:border-primary-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      {topic.icon}
                    </div>
                    <span className="font-medium text-xs">{topic.title}</span>
                  </button>
                ))}
              </div>

              {difficulties.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Difficulty:</span>
                  </div>
                  <div className="sm:hidden">
                    <select
                      value={activeDifficulty || ''}
                      onChange={(e) => setActiveDifficulty(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-white"
                    >
                      <option value="">All</option>
                      {difficulties.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden sm:flex gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveDifficulty('')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        !activeDifficulty
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      All
                    </button>
                    {difficulties.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setActiveDifficulty(d.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                          activeDifficulty === d.id
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {items.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vocabulary Yet</h3>
                  <p className="text-gray-500">Vocabulary will appear here once added by an admin.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 flex justify-between items-center">
                      <span className="text-white font-medium">{currentIndex + 1} / {items.length}</span>
                      <button
                        onClick={loadVocabulary}
                        className="flex items-center gap-1 text-white/80 hover:text-white text-sm"
                      >
                        <RefreshCw size={16} />
                        Refresh
                      </button>
                    </div>

                    <div className="p-8 min-h-[320px] flex items-center justify-center">
                      <FetchLoading isLoading={fetchingVocab} fallback={
                        <div className="text-center">
                          <div className="animate-spin w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                          <p className="text-sm text-gray-500">Loading vocabulary...</p>
                        </div>
                      }>
                        <div className="text-center w-full">
                          <div className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                            {getDisplayWord(currentItem)}
                          </div>
                          {currentItem.pronunciation && (
                            <div className="text-lg text-gray-400 italic mb-4">
                              [{currentItem.pronunciation}]
                            </div>
                          )}
                          <div className="text-2xl text-emerald-600">
                            {getTranslation(currentItem)}
                          </div>
                        </div>
                      </FetchLoading>
                    </div>

                    <div className="border-t border-gray-100 p-4 flex justify-between">
                      <button
                        onClick={prevCard}
                        disabled={items.length <= 1}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={20} />
                        Previous
                      </button>
                      <button
                        onClick={nextCard}
                        disabled={items.length <= 1}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center gap-2 mt-4 flex-wrap">
                    {Array.from({ length: Math.min(items.length, 10) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-4 h-4 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${
                          i === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                        aria-label={`Go to word ${i + 1}`}
                      />
                    ))}
                    {items.length > 10 && (
                      <span className="text-xs text-gray-400 self-center ml-1">
                        +{items.length - 10} more
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