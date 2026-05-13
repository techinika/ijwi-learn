'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ArrowLeft, ChevronLeft, ChevronRight, Hand, Hash, MessageSquare, BookOpen, Shuffle, RefreshCw, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getRandomVocabulary } from '@/lib/content';
import type { Vocabulary } from '@/lib/content-types';

const topics = [
  { id: 'vocabulary', title: 'Vocabulary', icon: <BookOpen size={20} /> },
  { id: 'phrases', title: 'Phrases', icon: <MessageSquare size={20} /> },
  { id: 'numbers', title: 'Numbers', icon: <Hash size={20} /> },
  { id: 'all', title: 'All Random', icon: <Shuffle size={20} /> },
];

export default function BeginnerPage() {
  const { userData } = useAuth();
  const preferredLang = userData?.preferredLanguage || 'en';
  const [activeTopic, setActiveTopic] = useState('all');
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffled, setShuffled] = useState(false);

  useEffect(() => {
    loadVocabulary();
  }, [activeTopic]);

  const loadVocabulary = async () => {
    const category = activeTopic === 'all' ? undefined : 
                     activeTopic === 'numbers' ? 'number' : 
                     activeTopic === 'phrases' ? 'phrase' : 'vocabulary';
    
    const items = await getRandomVocabulary(20, { levelId: '1', category });
    setVocabulary(items);
    setCurrentIndex(0);
    setShuffled(false);
  };

  const shuffleCards = () => {
    const shuffledItems = [...vocabulary].sort(() => Math.random() - 0.5);
    setVocabulary(shuffledItems);
    setCurrentIndex(0);
    setShuffled(true);
  };

  const items = vocabulary;
  const currentItem = items[currentIndex] || { word: '', wordKinyarwanda: '', translation: '', pronunciation: '' };

  const nextCard = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const prevCard = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="flex items-center gap-2 text-primary-600 hover:underline font-medium">
              <ArrowLeft size={20} />
              Back
            </Link>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 mb-8 text-white">
            <h1 className="text-2xl font-bold mb-2">Beginner Level</h1>
            <p className="text-primary-100">Master the fundamentals of Kinyarwanda</p>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => { setActiveTopic(topic.id); }}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${
                  activeTopic === topic.id
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-100 text-gray-700 hover:border-primary-200 hover:shadow-md'
                }`}
              >
                <div className={`p-2 rounded-xl ${activeTopic === topic.id ? 'bg-white/20' : 'bg-primary-100 text-primary-600'}`}>
                  {topic.icon}
                </div>
                <span className="text-sm font-semibold">{topic.title}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-end mb-4">
            <button 
              onClick={shuffleCards} 
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 text-sm font-medium transition"
            >
              <RefreshCw size={16} className={shuffled ? 'animate-spin' : ''} />
              Shuffle
            </button>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {activeTopic === 'all' ? 'All Random Words' : 
                 activeTopic === 'vocabulary' ? 'Vocabulary' :
                 activeTopic === 'phrases' ? 'Phrases' : 'Numbers'}
              </h2>
              <span className="bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium">
                {currentIndex + 1} of {items.length}
              </span>
            </div>

            {items.length > 0 ? (
              <>
                <div className="flex justify-center mb-8">
                  <div className="w-full max-w-sm">
                    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-12 text-center text-white shadow-xl">
                      <div className="text-5xl font-bold mb-4">{currentItem.wordKinyarwanda}</div>
                      <div className="text-2xl text-primary-100 mb-2">{currentItem.translations?.[preferredLang] || currentItem.word}</div>
                      {currentItem.pronunciation && (
                        <div className="text-lg text-primary-200 mt-3 font-medium">[{currentItem.pronunciation}]</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center items-center gap-6">
                  <button 
                    onClick={prevCard} 
                    className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-semibold text-sm transition"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>
                  <div className="flex gap-2">
                    {items.slice(0, 10).map((_, idx) => (
                      <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-primary-600' : 'bg-gray-200'}`} />
                    ))}
                    {items.length > 10 && <div className="w-2 h-2 rounded-full bg-gray-300" />}
                  </div>
                  <button 
                    onClick={nextCard} 
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold text-sm shadow-md transition"
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No vocabulary available</p>
                <p className="text-gray-400">Please try again later</p>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">All Words ({items.length})</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                    <div>
                      <span className="font-bold text-gray-900 text-lg">{item.wordKinyarwanda}</span>
                      <span className="text-gray-500 ml-3">({item.translations?.[preferredLang] || item.word})</span>
                    </div>
                    <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full capitalize">{item.category}</span>
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