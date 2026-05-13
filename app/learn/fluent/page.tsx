'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/lib/database';
import type { Story, Difficulty } from '@/lib/content-types';
import { getRandomStories } from '@/lib/content';
import { ArrowLeft, BookOpen, Lock, ChevronLeft, Shuffle, RefreshCw } from 'lucide-react';

export default function FluentPage() {
  const { userData } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const canAccess = userData?.purchasedLevels?.includes(4);
  const preferredLang = userData?.preferredLanguage || 'en';

  useEffect(() => {
    loadDifficulties();
  }, []);

  useEffect(() => {
    loadStories();
  }, [filterDifficulty]);

  const loadDifficulties = async () => {
    try {
      const diffs = await dbService.getDifficulties();
      setDifficulties(diffs);
    } catch (e) {
      console.log('Using fallback data');
    }
  };

  const loadStories = async () => {
    const items = await getRandomStories(10, { levelId: '4', difficulty: filterDifficulty || undefined });
    setStories(items);
    setSelectedStory(null);
  };

  const getTranslation = (story: Story) => {
    if (!story.sentences || story.sentences.length === 0) return '';
    return story.sentences.map(s => s.translations?.[preferredLang] || s.translations?.en || '').filter(Boolean).join(' ');
  };

  const getKinyarwandaPreview = (story: Story) => {
    if (!story.sentences || story.sentences.length === 0) return '';
    return story.sentences.map(s => s.kinyarwanda.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')).join(' ');
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
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="text-primary-600 hover:underline">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Fluent Level</h1>
          </div>

          <p className="text-gray-600 mb-6">Read stories to improve your reading comprehension. Stories are randomly selected from the database.</p>

          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterDifficulty('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filterDifficulty === ''
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                }`}
              >
                All Levels
              </button>
              {difficulties.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setFilterDifficulty(diff.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    filterDifficulty === diff.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {diff.name}
                </button>
              ))}
            </div>
            <button 
              onClick={loadStories}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
            >
              <RefreshCw size={16} />
              Shuffle
            </button>
          </div>

          {!selectedStory ? (
            <div className="space-y-4">
              {stories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="w-full bg-white p-5 rounded-xl text-left hover:shadow-md border border-gray-200 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{story.title}</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {difficulties.find(d => d.id === story.difficulty)?.name || 'General'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm italic line-clamp-2">
                    &ldquo;{getTranslation(story).substring(0, 100)}...&rdquo;
                  </p>
                </button>
              ))}
              {stories.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No stories available. Try a different filter.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <button onClick={() => setSelectedStory(null)} className="text-primary-600 hover:underline mb-6 flex items-center gap-2 text-sm font-medium">
                <ChevronLeft size={18} />
                Back to Stories
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{selectedStory.title}</h2>
              
              <div className="space-y-6">
                {selectedStory.sentences?.map((sentence, idx) => (
                  <div key={idx} className="pb-6 border-b border-gray-100 last:border-0">
                    <div className="flex items-start gap-4">
                      <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Kinyarwanda</p>
                          <p className="text-gray-900 leading-relaxed font-medium" dangerouslySetInnerHTML={{
                            __html: sentence.kinyarwanda
                              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.+?)\*/g, '<em>$1</em>')
                              .replace(/\n/g, '<br/>')
                          }} />
                        </div>
                        {sentence.translations?.[preferredLang] && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Translation</p>
                            <p className="text-gray-600 leading-relaxed">{sentence.translations[preferredLang]}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
