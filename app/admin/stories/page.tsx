'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Story, StorySentence, Level, Difficulty, Category, Language } from '@/lib/database';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, BookMarked, Search, GripVertical, ChevronRight, Bold, Italic } from 'lucide-react';

export default function StoriesPage() {
  const { user, isAdmin, isTeacher } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [titleTranslations, setTitleTranslations] = useState<Record<string, string>>({});
  const [levelId, setLevelId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sentences, setSentences] = useState<StorySentence[]>([]);

  const activeLanguages = languages.filter(l => l.isActive);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  useEffect(() => {
    loadStories();
  }, [filterLevel]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [l, d, c, lang] = await Promise.all([
        dbService.getLevels(),
        dbService.getDifficulties(),
        dbService.getCategories(),
        dbService.getLanguages(),
      ]);
      setLevels(l);
      setDifficulties(d);
      setCategories(c);
      setLanguages(lang);
    } catch (e) {
      console.error('Failed to load reference data', e);
    }
    setLoading(false);
  };

  const loadStories = async () => {
    try {
      const filters: { levelId?: string } = {};
      if (filterLevel) filters.levelId = filterLevel;
      const data = await dbService.getStories(filters);
      setStories(data);
    } catch (e) {
      console.error('Failed to load stories', e);
    }
  };

  const resetForm = useCallback(() => {
    setTitle('');
    setTitleTranslations({});
    setLevelId('');
    setDifficulty('');
    setCategory('');
    setIsActive(true);
    setSentences([]);
  }, []);

  const selectStory = async (story: Story) => {
    setSelectedId(story.id);
    setTitle(story.title);
    setTitleTranslations({ ...story.titleTranslations });
    setLevelId(story.levelId);
    setDifficulty(story.difficulty);
    setCategory(story.category);
    setIsActive(story.isActive);
    setSentences(story.sentences.map(s => ({ kinyarwanda: s.kinyarwanda, translations: { ...s.translations } })));
  };

  const newStory = () => {
    setSelectedId(null);
    resetForm();
  };

  const addSentence = () => {
    const initial: Record<string, string> = {};
    activeLanguages.forEach(lang => { initial[lang.code] = ''; });
    setSentences(prev => [...prev, { kinyarwanda: '', translations: initial }]);
  };

  const removeSentence = (index: number) => {
    setSentences(prev => prev.filter((_, i) => i !== index));
  };

  const updateSentenceKinyarwanda = (index: number, value: string) => {
    setSentences(prev => prev.map((s, i) => i === index ? { ...s, kinyarwanda: value } : s));
  };

  const updateSentenceTranslation = (index: number, langCode: string, value: string) => {
    setSentences(prev => prev.map((s, i) =>
      i === index ? { ...s, translations: { ...s.translations, [langCode]: value } } : s
    ));
  };

  const handleSave = async () => {
    if (!title.trim() || !levelId || !difficulty || !category) return;
    setSaving(true);
    const data = {
      title: title.trim(),
      titleTranslations,
      levelId,
      difficulty,
      category,
      isActive,
      sentences,
    };
    try {
      if (selectedId) {
        await dbService.updateStory(selectedId, data);
      } else {
        await dbService.createStory(data);
      }
      await loadStories();
    } catch (e) {
      console.error('Failed to save story', e);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    try {
      await dbService.deleteStory(id);
      if (selectedId === id) {
        setSelectedId(null);
        resetForm();
      }
      await loadStories();
    } catch (e) {
      console.error('Failed to delete story', e);
    }
  };

  const getLevelTitle = (id: string) => levels.find(l => l.id === id)?.title || id;
  const getDifficultyName = (id: string) => difficulties.find(d => d.id === id)?.name || id;
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;

  const filteredStories = stories.filter(s =>
    !searchTerm || s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentStory = stories.find(s => s.id === selectedId);

  if (!isAdmin && !isTeacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors">
              <ArrowLeft size={20} />
              <span>Back to Admin</span>
            </Link>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8">
            <h1 className="text-2xl font-bold">Story Editor</h1>
            <p className="text-primary-100 mt-1">Create and edit stories with sentence-by-sentence WYSIWYG editing</p>
          </div>

          <div className="flex gap-6">
            {/* Left Panel - Story List */}
            <div className="w-96 shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <button
                    onClick={newStory}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    <Plus size={18} />
                    New Story
                  </button>
                </div>

                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <Search size={16} className="text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search stories..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
                    />
                  </div>
                  <select
                    value={filterLevel}
                    onChange={e => setFilterLevel(e.target.value)}
                    className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
                  >
                    <option value="">All Levels</option>
                    {levels.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>

                <div className="divide-y divide-gray-100 max-h-[calc(100vh-22rem)] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                  ) : filteredStories.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No stories found.</div>
                  ) : filteredStories.map(story => (
                    <button
                      key={story.id}
                      onClick={() => selectStory(story)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                        selectedId === story.id ? 'bg-primary-50 border-l-2 border-primary-600' : 'border-l-2 border-transparent'
                      }`}
                    >
                      <BookMarked size={18} className="text-gray-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm truncate">{story.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{getLevelTitle(story.levelId)}</span>
                          {!story.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{story.sentences?.length || 0} sentences</div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 mt-1 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Editor */}
            <div className="flex-1 min-w-0">
              {selectedId === null && !currentStory && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                  <BookMarked size={48} className="text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-1">No Story Selected</h3>
                  <p className="text-sm text-gray-400">Select a story from the list or create a new one.</p>
                </div>
              )}

              {(selectedId !== null || currentStory) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-gray-900">
                        {selectedId ? 'Edit Story' : 'New Story'}
                      </h2>
                      <div className="flex items-center gap-2">
                        {selectedId && (
                          <button
                            onClick={() => handleDelete(selectedId!)}
                            className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        )}
                        <button
                          onClick={handleSave}
                          disabled={saving || !title.trim() || !levelId || !difficulty || !category}
                          className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save size={16} />
                          {saving ? 'Saving...' : selectedId ? 'Update Story' : 'Create Story'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title (Kinyarwanda) *</label>
                        <input
                          type="text"
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                          placeholder="Story title in Kinyarwanda"
                        />
                      </div>
                      <div />
                    </div>

                    <div className="space-y-2 mb-4">
                      <label className="block text-sm font-medium text-gray-700">Title Translations</label>
                      <div className="grid grid-cols-2 gap-3">
                        {activeLanguages.map(lang => (
                          <div key={lang.code} className="flex items-center gap-2">
                            <span className="text-base">{lang.flag}</span>
                            <span className="text-sm text-gray-600 w-24 shrink-0">{lang.name}</span>
                            <input
                              type="text"
                              value={titleTranslations[lang.code] || ''}
                              onChange={e => setTitleTranslations(p => ({ ...p, [lang.code]: e.target.value }))}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                              placeholder={`${lang.name} title`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                        <select
                          value={levelId}
                          onChange={e => setLevelId(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                        >
                          <option value="">Select level</option>
                          {levels.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
                        <select
                          value={difficulty}
                          onChange={e => setDifficulty(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                        >
                          <option value="">Select difficulty</option>
                          {difficulties.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                        <select
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                        >
                          <option value="">Select category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={e => setIsActive(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
                      </label>
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </div>
                  </div>

                  {/* Sentences Section */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-gray-900">
                        Sentences
                        <span className="ml-2 text-sm font-normal text-gray-400">({sentences.length})</span>
                      </h3>
                      <button
                        onClick={addSentence}
                        className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Plus size={16} />
                        Add Sentence
                      </button>
                    </div>

                    {sentences.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-sm text-gray-400">No sentences yet. Click "Add Sentence" to start building your story.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sentences.map((sentence, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                          >
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100/50 border-b border-gray-200">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-primary-600 text-white text-xs font-bold rounded-full">
                                  {idx + 1}
                                </span>
                                <span className="text-sm font-medium text-gray-700">Sentence {idx + 1}</span>
                              </div>
                              <button
                                onClick={() => removeSentence(idx)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove sentence"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>

                            <div className="p-4 space-y-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-xs font-medium text-gray-500">Kinyarwanda</label>
                                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const ta = document.getElementById(`sentence-ta-${idx}`) as HTMLTextAreaElement;
                                        if (!ta) return;
                                        const start = ta.selectionStart;
                                        const end = ta.selectionEnd;
                                        const text = ta.value;
                                        const selected = text.substring(start, end);
                                        const wrapped = `**${selected}**`;
                                        const updated = text.substring(0, start) + wrapped + text.substring(end);
                                        updateSentenceKinyarwanda(idx, updated);
                                        setTimeout(() => { ta.focus(); ta.setSelectionRange(start + 2, start + 2 + selected.length); }, 0);
                                      }}
                                      className="p-1.5 text-gray-600 hover:bg-white rounded transition"
                                      title="Bold (Ctrl+B)"
                                    >
                                      <Bold size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const ta = document.getElementById(`sentence-ta-${idx}`) as HTMLTextAreaElement;
                                        if (!ta) return;
                                        const start = ta.selectionStart;
                                        const end = ta.selectionEnd;
                                        const text = ta.value;
                                        const selected = text.substring(start, end);
                                        const wrapped = `*${selected}*`;
                                        const updated = text.substring(0, start) + wrapped + text.substring(end);
                                        updateSentenceKinyarwanda(idx, updated);
                                        setTimeout(() => { ta.focus(); ta.setSelectionRange(start + 1, start + 1 + selected.length); }, 0);
                                      }}
                                      className="p-1.5 text-gray-600 hover:bg-white rounded transition"
                                      title="Italic (Ctrl+I)"
                                    >
                                      <Italic size={14} />
                                    </button>
                                  </div>
                                </div>
                                <textarea
                                  id={`sentence-ta-${idx}`}
                                  value={sentence.kinyarwanda}
                                  onChange={e => updateSentenceKinyarwanda(idx, e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none font-mono"
                                  rows={3}
                                  placeholder="Enter the Kinyarwanda sentence... Use **bold** and *italic* markers"
                                />
                                {sentence.kinyarwanda.includes('**') || sentence.kinyarwanda.includes('*') ? (
                                  <div className="mt-1.5 p-2 bg-primary-50 rounded-lg border border-primary-100">
                                    <div className="text-xs text-gray-500 mb-1">Preview:</div>
                                    <div className="text-sm text-gray-900 leading-relaxed" dangerouslySetInnerHTML={{
                                      __html: sentence.kinyarwanda
                                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                                        .replace(/\n/g, '<br/>')
                                    }} />
                                  </div>
                                ) : null}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                {activeLanguages.map(lang => (
                                  <div key={lang.code}>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                      <span className="mr-1">{lang.flag}</span>
                                      {lang.name}
                                    </label>
                                    <textarea
                                      value={sentence.translations[lang.code] || ''}
                                      onChange={e => updateSentenceTranslation(idx, lang.code, e.target.value)}
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none"
                                      rows={2}
                                      placeholder={`${lang.name} translation...`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {sentences.length > 1 && (
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={addSentence}
                          className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg transition-colors border border-dashed border-primary-300"
                        >
                          <Plus size={16} />
                          Add Another Sentence
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
