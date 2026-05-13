'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Story, Level, Difficulty } from '@/lib/database';
import { ArrowLeft, BookOpen, Lock, ChevronLeft, RefreshCw, Image } from 'lucide-react';

export default function FluentPage() {
  const { userData } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [allLevels, setAllLevels] = useState<Level[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [loading, setLoading] = useState(true);
  const canAccess = userData?.purchasedLevels?.includes(4);
  const preferredLang = userData?.preferredLanguage || 'en';

  useEffect(() => {
    loadDifficulties();
    loadLevels();
  }, []);

  useEffect(() => {
    loadStories();
  }, [filterDifficulty]);

  const loadLevels = async () => {
    try {
      const levels = await dbService.getLevels();
      setAllLevels(levels);
    } catch (e) {
      console.log('Error loading levels');
    }
  };

  const loadDifficulties = async () => {
    try {
      const diffs = await dbService.getDifficulties({ levelId: '4' });
      setDifficulties(diffs);
    } catch (e) {
      console.log('Error loading difficulties');
    }
  };

  const loadStories = async () => {
    setLoading(true);
    try {
      const purchasedLevels = userData?.purchasedLevels || [];
      const levelIdMap = new Map(allLevels.map((l, idx) => [idx + 1, l.id]));
      const unlockedLevelIds = purchasedLevels.map(idx => levelIdMap.get(idx) || '');
      
      const filters: { levelIds?: string[]; difficulty?: string } = {};
      if (unlockedLevelIds.length > 0) {
        filters.levelIds = unlockedLevelIds;
      }
      if (filterDifficulty) filters.difficulty = filterDifficulty;
      
      const items = await dbService.getStories(filters);
      setStories(items);
      setSelectedStory(null);
    } catch (e) {
      console.log('Error loading stories');
    }
    setLoading(false);
  };

  const getTitleTranslation = (story: Story) => {
    return story.titleTranslations?.[preferredLang] || story.titleTranslations?.en || '';
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} className="text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Level Locked</h1>
            <p className="text-gray-600 mb-6">Upgrade to access stories and advanced content.</p>
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
              <ArrowLeft size={18} />
              Back to Levels
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-primary-600 hover:underline">
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Fluent Level</h1>
            </div>
            <button
              onClick={loadStories}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <p className="text-gray-600 mb-6">Read stories to improve your reading comprehension.</p>

          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setFilterDifficulty('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filterDifficulty === ''
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
              }`}
            >
              All
            </button>
            {difficulties.map(d => (
              <button
                key={d.id}
                onClick={() => setFilterDifficulty(d.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filterDifficulty === d.slug
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading stories...</p>
            </div>
          ) : !selectedStory ? (
            <>
              {stories.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stories Available</h3>
                  <p className="text-gray-500">Stories will appear here once they're added by an admin.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories.map(story => (
                    <button
                      key={story.id}
                      onClick={() => setSelectedStory(story)}
                      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all text-left"
                    >
                      {story.coverImage ? (
                        <div className="aspect-video bg-gray-100">
                          <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                          <BookOpen size={48} className="text-primary-300" />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 text-lg mb-2">{story.title || 'Untitled'}</h3>
                        {getTitleTranslation(story) && (
                          <p className="text-gray-500 text-sm mb-3">{getTitleTranslation(story)}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                            {story.difficulty}
                          </span>
                          {story.category && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {story.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedStory(null)}
                    className="flex items-center gap-2 text-primary-600 hover:underline text-sm font-medium"
                  >
                    <ChevronLeft size={18} />
                    Back to Stories
                  </button>
                  <h2 className="text-xl font-bold text-gray-900">{selectedStory.title || 'Untitled'}</h2>
                </div>
              </div>
              
              {selectedStory.coverImage && (
                <div className="aspect-video bg-gray-100">
                  <img src={selectedStory.coverImage} alt={selectedStory.title} className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="p-8 max-w-3xl mx-auto">
                {getTitleTranslation(selectedStory) && (
                  <p className="text-xl text-gray-500 mb-6 italic">{getTitleTranslation(selectedStory)}</p>
                )}
                
                {selectedStory.content ? (
                  <div 
                    className="prose prose-lg max-w-none"
                    style={{ fontFamily: 'Georgia, serif' }}
                    dangerouslySetInnerHTML={{ __html: selectedStory.content }}
                  />
                ) : (
                  <div className="space-y-6">
                    {selectedStory.sentences?.map((sentence, idx) => (
                      <div key={idx} className="border-b border-gray-100 pb-6 last:border-0">
                        <p 
                          className="text-lg text-gray-900 leading-relaxed mb-3"
                          style={{ fontFamily: 'Georgia, serif' }}
                          dangerouslySetInnerHTML={{
                            __html: sentence.kinyarwanda
                              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.+?)\*/g, '<em>$1</em>')
                          }}
                        />
                        {sentence.translations?.[preferredLang] && (
                          <p className="text-gray-500 leading-relaxed">
                            {sentence.translations[preferredLang]}
                          </p>
                        )}
                        {sentence.translations?.en && preferredLang !== 'en' && (
                          <p className="text-gray-400 text-sm mt-1">
                            English: {sentence.translations.en}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}