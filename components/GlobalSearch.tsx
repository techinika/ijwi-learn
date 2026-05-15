'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { dbService, Vocabulary, Story } from '@/lib/database';
import { Search, X, BookOpen, ChevronRight, Volume2, ExternalLink } from 'lucide-react';

interface SearchResult {
  type: 'vocabulary' | 'story';
  item: Vocabulary | Story;
  matchField: string;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [vocab, setVocab] = useState<Vocabulary[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedVocab, setSelectedVocab] = useState<Vocabulary | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadData = useCallback(async () => {
    if (loaded) return;
    try {
      const [v, s] = await Promise.all([
        dbService.getVocabulary(),
        dbService.getStories(),
      ]);
      setVocab(v);
      setStories(s.filter(st => st.isActive));
      setLoaded(true);
    } catch (e) {
      console.error('Search load error:', e);
    }
  }, [loaded]);

  useEffect(() => {
    if (open) {
      loadData();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setSelectedVocab(null);
      setSelectedStory(null);
    }
  }, [open, loadData]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const q = query.toLowerCase();
      const found: SearchResult[] = [];

      for (const item of vocab) {
        const checks: [string, string][] = [
          ['English', item.word],
          ['Kinyarwanda', item.wordKinyarwanda],
        ];
        for (const lang of Object.entries(item.translations || {})) {
          checks.push([`${lang[0]}`, lang[1]]);
        }
        for (const [field, val] of checks) {
          if (val?.toLowerCase().includes(q)) {
            found.push({ type: 'vocabulary', item, matchField: field });
            break;
          }
        }
      }

      for (const item of stories) {
        const titleLower = item.title.toLowerCase();
        const titleTrans = Object.values(item.titleTranslations || {}).join(' ').toLowerCase();
        if (titleLower.includes(q) || titleTrans.includes(q)) {
          found.push({ type: 'story', item, matchField: 'Title' });
          continue;
        }
        for (const sentence of item.sentences || []) {
          if (sentence.kinyarwanda.toLowerCase().includes(q)) {
            found.push({ type: 'story', item, matchField: 'Sentence (Kinyarwanda)' });
            break;
          }
          const transText = Object.values(sentence.translations || {}).join(' ').toLowerCase();
          if (transText.includes(q)) {
            found.push({ type: 'story', item, matchField: 'Sentence' });
            break;
          }
        }
      }

      setResults(found.slice(0, 50));
    }, 200);
  }, [query, vocab, stories]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (selectedVocab || selectedStory) {
        setSelectedVocab(null);
        setSelectedStory(null);
      } else {
        setOpen(false);
      }
    }
  };

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const renderVocabularyDetail = (item: Vocabulary) => (
    <div className="p-6">
      <button onClick={() => setSelectedVocab(null)} className="text-primary-600 hover:underline text-sm mb-4 flex items-center gap-1">
        <ChevronRight size={14} className="rotate-180" />
        Back to results
      </button>
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h3 className="text-3xl font-bold text-gray-900">{item.wordKinyarwanda}</h3>
          {item.pronunciation && (
            <button onClick={() => speakWord(item.wordKinyarwanda)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
              <Volume2 size={20} />
            </button>
          )}
        </div>
        {item.pronunciation && (
          <p className="text-sm text-gray-400 mb-4">[{item.pronunciation}]</p>
        )}
        <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-medium text-lg mb-4">
          {item.word}
        </div>
        {Object.entries(item.translations || {}).filter(([, v]) => v).length > 0 && (
          <div className="mt-4 space-y-1">
            {Object.entries(item.translations || {}).filter(([, v]) => v).map(([lang, val]) => (
              <div key={lang} className="text-sm text-gray-500">
                <span className="font-medium capitalize">{lang}:</span> {val}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStoryDetail = (item: Story) => (
    <div className="p-6">
      <button onClick={() => setSelectedStory(null)} className="text-primary-600 hover:underline text-sm mb-4 flex items-center gap-1">
        <ChevronRight size={14} className="rotate-180" />
        Back to results
      </button>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
      {item.titleTranslations && Object.entries(item.titleTranslations).filter(([, v]) => v).map(([lang, val]) => (
        <p key={lang} className="text-sm text-gray-500 mb-4">
          <span className="font-medium capitalize">{lang}:</span> {val}
        </p>
      ))}
      <div className="prose max-w-none text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-4 max-h-80 overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: item.content || '' }}
      />
      {item.sentences && item.sentences.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Sentences</h4>
          {item.sentences.slice(0, 10).map((s, i) => (
            <div key={i} className="text-sm bg-gray-50 p-2 rounded-lg">
              <div className="font-medium text-gray-900">{s.kinyarwanda}</div>
              {Object.entries(s.translations || {}).filter(([, v]) => v).map(([lang, val]) => (
                <div key={lang} className="text-gray-500 text-xs">{val}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition text-sm"
        title="Search vocabulary, stories, and more"
      >
        <Search size={18} />
        <span className="hidden lg:inline">Search</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24" onClick={() => setOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[70vh] overflow-hidden border border-gray-200"
            onClick={e => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center gap-3 p-4 border-b border-gray-200">
              <Search size={20} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search vocabulary, stories..."
                className="flex-1 text-base outline-none bg-transparent"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {selectedVocab ? renderVocabularyDetail(selectedVocab)
              : selectedStory ? renderStoryDetail(selectedStory)
              : !query.trim() ? (
                <div className="p-8 text-center text-gray-400">
                  <Search size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Type to search across vocabulary and stories</p>
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-sm">No results found for &quot;{query}&quot;</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {results.map((r, i) => (
                    <div
                      key={`${r.type}-${(r.item as any).id}-${i}`}
                      onClick={() => {
                        if (r.type === 'vocabulary') setSelectedVocab(r.item as Vocabulary);
                        else setSelectedStory(r.item as Story);
                      }}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition flex items-start gap-3"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${
                        r.type === 'vocabulary' ? 'bg-primary-500' : 'bg-amber-500'
                      }`}>
                        {r.type === 'vocabulary' ? <BookOpen size={16} /> : <ExternalLink size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm truncate">
                            {r.type === 'vocabulary'
                              ? (r.item as Vocabulary).wordKinyarwanda
                              : (r.item as Story).title
                            }
                          </span>
                          <span className="text-[10px] uppercase text-gray-400 font-medium shrink-0">
                            {r.type === 'vocabulary' ? 'Word' : 'Story'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 truncate mt-0.5">
                          {r.type === 'vocabulary'
                            ? `${(r.item as Vocabulary).word} — matched in ${r.matchField}`
                            : `Matched in ${r.matchField}`
                          }
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
