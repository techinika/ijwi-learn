'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, RefreshCw, Package, Palette, FileText, Lock } from 'lucide-react';

const grammarTopics = [
  { id: 'verbs', title: 'Verb Conjugation', icon: <RefreshCw size={24} /> },
  { id: 'nouns', title: 'Noun Classes', icon: <Package size={24} /> },
  { id: 'adjectives', title: 'Adjectives', icon: <Palette size={24} /> },
  { id: 'sentences', title: 'Sentence Structure', icon: <FileText size={24} /> },
];

const content: Record<string, any> = {
  verbs: {
    title: 'Verb Conjugation',
    description: 'Learn how to conjugate verbs in Kinyarwanda',
    rules: [
      { pattern: '-ra', example: 'ndaraba (I run)', description: 'Present continuous' },
      { pattern: '-ze/-la', example: 'naraze (I have finished)', description: 'Past tense' },
      { pattern: '-za', example: 'nzarahabwa (I will come)', description: 'Future tense' },
    ],
  },
  nouns: {
    title: 'Noun Classes',
    description: 'Kinyarwanda has 16 noun classes grouped in pairs',
    classes: [
      { class: 'U-/I-', examples: 'umugabo/ibigabo (man/men)', description: 'Class 1/2' },
      { class: 'U-/I-', examples: 'inkoni/amakoni (stick/sticks)', description: 'Class 3/4' },
      { class: 'I-/A-', examples: 'igitabo/ibitabo (book/books)', description: 'Class 5/6' },
    ],
  },
  adjectives: {
    title: 'Adjectives',
    description: 'Adjectives must agree with the noun class',
    examples: [
      { adj: 'mugabo', noun: 'umugabo', result: 'umugabo mugabo', translation: 'a big man' },
      { adj: 'mugabo', noun: 'inkoni', result: 'inkoni nemugabo', translation: 'a big stick' },
    ],
  },
  sentences: {
    title: 'Sentence Structure',
    description: 'Basic sentence patterns in Kinyarwanda',
    patterns: [
      { pattern: 'Subject + Verb + Object', example: 'John aragura ibitabo', translation: 'John buys books' },
      { pattern: 'Location + Subject + Verb', example: 'Muri kigali ndahagarara', translation: 'I stand in Kigali' },
    ],
  },
};

export default function IntermediatePage() {
  const { userData } = useAuth();
  const [activeTopic, setActiveTopic] = useState('verbs');
  const canAccess = userData?.purchasedLevels?.includes(3);

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
            <p className="text-gray-600 mb-6">Upgrade to access intermediate grammar and vocabulary.</p>
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
              <ArrowLeft size={18} />
              Back to Levels
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const topicContent = content[activeTopic];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="text-primary-600 hover:underline">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Intermediate Level</h1>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-8">
            {grammarTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition ${
                  activeTopic === topic.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-purple-300'
                }`}
              >
                <div className={activeTopic === topic.id ? 'text-white' : 'text-purple-600'}>
                  {topic.icon}
                </div>
                <span className="text-sm font-medium">{topic.title}</span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{topicContent.title}</h2>
            <p className="text-gray-600 mb-6">{topicContent.description}</p>

            {activeTopic === 'verbs' && (
              <div className="space-y-4">
                {topicContent.rules.map((rule: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-purple-500 pl-5 py-2">
                    <div className="font-semibold text-gray-900">{rule.pattern}</div>
                    <div className="text-purple-600 font-medium">{rule.example}</div>
                    <div className="text-gray-500 text-sm">{rule.description}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTopic === 'nouns' && (
              <div className="grid sm:grid-cols-2 gap-4">
                {topicContent.classes.map((cls: any, idx: number) => (
                  <div key={idx} className="bg-purple-50 p-4 rounded-xl">
                    <div className="font-semibold text-purple-700 mb-2">{cls.class}</div>
                    <div className="text-gray-900 font-medium mb-1">{cls.examples}</div>
                    <div className="text-gray-500 text-sm">{cls.description}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTopic === 'adjectives' && (
              <div className="space-y-3">
                {topicContent.examples.map((ex: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="text-gray-900 font-medium">{ex.adj} + {ex.noun}</div>
                      <div className="text-purple-600 font-semibold">{ex.result}</div>
                    </div>
                    <div className="text-gray-500 text-sm">{ex.translation}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTopic === 'sentences' && (
              <div className="space-y-3">
                {topicContent.patterns.map((pat: any, idx: number) => (
                  <div key={idx} className="bg-primary-50 p-4 rounded-xl">
                    <div className="font-medium text-gray-700 mb-1">{pat.pattern}</div>
                    <div className="text-purple-600 font-semibold mb-1">{pat.example}</div>
                    <div className="text-gray-500 text-sm">{pat.translation}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}