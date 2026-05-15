'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Level, Difficulty, Dialogue } from '@/lib/database';
import { ArrowLeft, MessageSquare, Users, BookOpen, ChevronRight } from 'lucide-react';
import { Loading, FetchLoading } from '@/app/AppLoading';

const DIALOGUES_PER_PAGE = 12;

export default function DialoguesPage() {
  const { userData } = useAuth();
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dbDialogues, dbLevels, dbDifficulties] = await Promise.all([
        dbService.getDialogues({ isActive: true }),
        dbService.getLevels(),
        dbService.getDifficulties(),
      ]);
      setLevels(dbLevels);
      setDifficulties(dbDifficulties.filter(d => d.isActive));
      setDialogues(dbDialogues);
    } catch (e) {
      console.error('Failed to load dialogues', e);
    }
    setLoading(false);
  };

  const purchasedLevels = userData?.purchasedLevels || [];

  const availableDialogues = dialogues.filter(d => {
    const levelIdx = levels.findIndex(l => l.id === d.levelId) + 1;
    return purchasedLevels.includes(levelIdx);
  });

  const filteredDialogues = availableDialogues.filter(d => {
    if (filterLevel !== 'all' && d.levelId !== filterLevel) return false;
    if (filterDifficulty !== 'all' && d.difficulty !== filterDifficulty) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredDialogues.length / DIALOGUES_PER_PAGE);
  const paginatedDialogues = filteredDialogues.slice(
    (currentPage - 1) * DIALOGUES_PER_PAGE,
    currentPage * DIALOGUES_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterLevel, filterDifficulty]);

  const getLevelTitle = (levelId: string) => levels.find(l => l.id === levelId)?.title || '';
  const getDifficultyName = (difficultyId: string) => difficulties.find(d => d.id === difficultyId)?.name || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-28 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Loading text="Loading dialogues..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <main className="pt-20 md:pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="text-primary-600 hover:underline font-medium flex items-center gap-2">
              <ArrowLeft size={18} />
              Back
            </Link>
          </div>

          <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-2xl p-6 text-white mb-8">
            <h1 className="text-2xl font-bold mb-2">Dialogues</h1>
            <p className="text-cyan-100">Practice real conversations in Kinyarwanda with dialogues.</p>
          </div>

          <FetchLoading isLoading={loading} fallback={<Loading text="Loading..." />}>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-primary-500"
                >
                  <option value="all">All Levels</option>
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>{level.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-primary-500"
                >
                  <option value="all">All Difficulties</option>
                  {difficulties.map(diff => (
                    <option key={diff.id} value={diff.id}>{diff.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {paginatedDialogues.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Dialogues Available</h3>
                <p className="text-gray-500 mb-6">
                  {availableDialogues.length === 0 
                    ? 'Purchase a level to access dialogues.'
                    : 'No dialogues match your current filters.'}
                </p>
                {availableDialogues.length === 0 && (
                  <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                    View Levels
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-5">
                  {paginatedDialogues.map((dialogue) => (
                    <Link
                      key={dialogue.id}
                      href={`/dialogues/${dialogue.id}`}
                      className="bg-white p-5 rounded-xl border-2 border-gray-200 hover:shadow-lg hover:border-cyan-300 transition-all block"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 shrink-0">
                          <MessageSquare size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{dialogue.title}</h3>
                          <p className="text-gray-500 text-sm line-clamp-2">{dialogue.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {dialogue.speakers.length}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen size={14} />
                            {dialogue.lines.length} lines
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {getLevelTitle(dialogue.levelId)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </FetchLoading>
        </div>
      </main>
    </div>
  );
}