'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Vocabulary, Level, Category, Difficulty, Language } from '@/lib/database';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, BookOpen, Search, Upload, FileText } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

export default function VocabularyPage() {
  const { user, isAdmin, isTeacher } = useAuth();
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Vocabulary | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkLevelId, setBulkLevelId] = useState('');
  const [bulkDifficulty, setBulkDifficulty] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkPreview, setBulkPreview] = useState<Vocabulary[]>([]);
  const [savingBulk, setSavingBulk] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const emptyForm = {
    wordKinyarwanda: '',
    word: '',
    levelId: '',
    difficulty: '',
    category: '',
    pronunciation: '',
    translations: {} as Record<string, string>,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  useEffect(() => {
    loadVocabulary();
  }, [filterLevel, filterDifficulty, filterCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterLevel, filterDifficulty, filterCategory]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [l, c, d, lang] = await Promise.all([
        dbService.getLevels(),
        dbService.getCategories(),
        dbService.getDifficulties(),
        dbService.getLanguages(),
      ]);
      setLevels(l);
      setCategories(c);
      setDifficulties(d);
      setLanguages(lang);
      if (lang.length > 0) {
        const initialTranslations: Record<string, string> = {};
        lang.forEach(lg => { initialTranslations[lg.code] = ''; });
        setForm(prev => ({ ...prev, translations: initialTranslations }));
      }
    } catch (e) {
      console.error('Failed to load reference data', e);
    }
    setLoading(false);
  };

  const loadVocabulary = async () => {
    try {
      const filters: { levelId?: string; difficulty?: string; category?: string } = {};
      if (filterLevel) filters.levelId = filterLevel;
      if (filterDifficulty) filters.difficulty = filterDifficulty;
      if (filterCategory) filters.category = filterCategory;
      const data = await dbService.getVocabulary(filters);
      setVocabulary(data);
    } catch (e) {
      console.error('Failed to load vocabulary', e);
    }
  };

  const getLevelTitle = (id: string) => levels.find(l => l.id === id)?.title || id;
  const getDifficultyName = (id: string) => difficulties.find(d => d.id === id)?.name || id;
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;

  const openAdd = () => {
    const initialTranslations: Record<string, string> = {};
    languages.forEach(lg => { initialTranslations[lg.code] = ''; });
    setForm({ ...emptyForm, translations: initialTranslations });
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (item: Vocabulary) => {
    const initialTranslations: Record<string, string> = {};
    languages.forEach(lg => { initialTranslations[lg.code] = item.translations?.[lg.code] || ''; });
    setForm({ ...emptyForm, ...item, translations: initialTranslations });
    setEditing(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.wordKinyarwanda || !form.word || !form.levelId || !form.difficulty || !form.category) return;
    const data = {
      wordKinyarwanda: form.wordKinyarwanda,
      word: form.word,
      levelId: form.levelId,
      difficulty: form.difficulty,
      category: form.category,
      pronunciation: form.pronunciation,
      translations: form.translations,
    };
    try {
      if (editing) {
        await dbService.updateVocabulary(editing.id, data);
      } else {
        await dbService.createVocabulary(data);
      }
      setShowModal(false);
      await loadVocabulary();
    } catch (e) {
      console.error('Failed to save vocabulary', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dbService.deleteVocabulary(id);
      await loadVocabulary();
    } catch (e) {
      console.error('Failed to delete vocabulary', e);
    }
    setConfirmDelete(null);
  };

  const parseBulkVocabulary = () => {
    if (!bulkLevelId || !bulkDifficulty || !bulkCategory) {
      setAlertMsg('Please select level, difficulty, and category first.');
      return;
    }
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    const parsed: Vocabulary[] = [];
    const initialTranslations: Record<string, string> = {};
    languages.forEach(lg => { initialTranslations[lg.code] = ''; });

    lines.forEach(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        parsed.push({
          id: '',
          wordKinyarwanda: parts[0],
          word: parts[1],
          levelId: bulkLevelId,
          difficulty: bulkDifficulty,
          category: bulkCategory,
          pronunciation: parts[2] || '',
          translations: { ...initialTranslations },
        });
      }
    });

    setBulkPreview(parsed);
  };

  const saveBulkVocabulary = async () => {
    if (bulkPreview.length === 0) return;
    setSavingBulk(true);
    try {
      for (const item of bulkPreview) {
        await dbService.createVocabulary({
          wordKinyarwanda: item.wordKinyarwanda,
          word: item.word,
          levelId: item.levelId,
          difficulty: item.difficulty,
          category: item.category,
          pronunciation: item.pronunciation,
          translations: item.translations,
        });
      }
      setShowBulkModal(false);
      setBulkText('');
      setBulkPreview([]);
      await loadVocabulary();
    } catch (e) {
      console.error('Failed to save bulk vocabulary', e);
    } finally {
      setSavingBulk(false);
    }
  };

  const translationsCount = (item: Vocabulary) => {
    return Object.values(item.translations || {}).filter(v => v.trim()).length;
  };

  const filtered = vocabulary.filter(v =>
    !searchTerm || v.wordKinyarwanda.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.word.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors">
              <ArrowLeft size={20} />
              <span>Back to Admin</span>
            </Link>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Vocabulary Management</h1>
              <p className="text-primary-100 mt-1">Add, edit, and manage Kinyarwanda vocabulary words</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors">
                <Upload size={18} />
                Bulk Add
              </button>
              <button onClick={openAdd} className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                <Plus size={18} />
                Add Vocabulary
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by word..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 border-b border-gray-300 py-1.5 text-sm focus:outline-none focus:border-primary-600"
                />
              </div>
              <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                <option value="">All Levels</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
              <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                <option value="">All Difficulties</option>
                {difficulties.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Kinyarwanda</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">English</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Difficulty</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Level</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Translations</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : paginatedItems.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No vocabulary found.</td></tr>
                  ) : paginatedItems.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.wordKinyarwanda}</td>
                      <td className="px-4 py-3 text-gray-700">{item.word}</td>
                      <td className="px-4 py-3">{getDifficultyName(item.difficulty)}</td>
                      <td className="px-4 py-3">{getCategoryName(item.category)}</td>
                      <td className="px-4 py-3">{getLevelTitle(item.levelId)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full font-medium">
                          <BookOpen size={12} />
                          {translationsCount(item)}/{languages.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setConfirmDelete({ id: item.id })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-500 ml-2">
                {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Vocabulary' : 'Add Vocabulary'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kinyarwanda *</label>
                <input type="text" value={form.wordKinyarwanda} onChange={e => setForm(p => ({ ...p, wordKinyarwanda: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="e.g. amata" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">English *</label>
                <input type="text" value={form.word} onChange={e => setForm(p => ({ ...p, word: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="e.g. milk" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                <select value={form.levelId} onChange={e => setForm(p => ({ ...p, levelId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                  <option value="">Select level</option>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
                <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                  <option value="">Select difficulty</option>
                  {difficulties.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pronunciation</label>
                <input type="text" value={form.pronunciation || ''} onChange={e => setForm(p => ({ ...p, pronunciation: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="Phonetic pronunciation" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Translations</label>
                <div className="space-y-2">
                  {languages.map(lang => (
                    <div key={lang.code} className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 w-8 text-center">{lang.flag}</span>
                      <span className="text-sm text-gray-600 w-24">{lang.name}</span>
                      <input
                        type="text"
                        value={form.translations[lang.code] || ''}
                        onChange={e => setForm(p => ({ ...p, translations: { ...p.translations, [lang.code]: e.target.value } }))}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder={`${lang.name} translation`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                <Save size={16} />
                {editing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Upload size={20} className="text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Bulk Add Vocabulary</h2>
                  <p className="text-sm text-gray-500">Add multiple words at once</p>
                </div>
              </div>
              <button onClick={() => { setShowBulkModal(false); setBulkPreview([]); }} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText size={20} className="text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Format: Kinyarwanda | English | Pronunciation</h3>
                    <p className="text-xs text-blue-700 mt-1">One word per line. Use pipe (|) to separate fields.</p>
                    <p className="text-xs text-blue-700">Example: <span className="font-mono">ibibili | milk | bee-bee-lee</span></p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                  <select value={bulkLevelId} onChange={e => setBulkLevelId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                    <option value="">Select level</option>
                    {levels.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
                  <select value={bulkDifficulty} onChange={e => setBulkDifficulty(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                    <option value="">Select difficulty</option>
                    {difficulties.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vocabulary Items</label>
                <textarea
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  rows={10}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 font-mono"
                  placeholder={`ibibili | milk | bee-bee-lee\namazi | water\ngusoma | to read`}
                />
              </div>
              {bulkPreview.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Preview ({bulkPreview.length} items)</h3>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Kinyarwanda</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">English</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Pronunciation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkPreview.map((item, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-3 py-2">{item.wordKinyarwanda}</td>
                            <td className="px-3 py-2">{item.word}</td>
                            <td className="px-3 py-2 text-gray-500">{item.pronunciation || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={() => { setShowBulkModal(false); setBulkPreview([]); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={parseBulkVocabulary} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">Preview</button>
              <button onClick={saveBulkVocabulary} disabled={bulkPreview.length === 0 || savingBulk} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50">
                <Save size={16} />
                {savingBulk ? 'Saving...' : `Save ${bulkPreview.length} Items`}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete!.id)}
        title="Delete Vocabulary"
        message="Are you sure you want to delete this vocabulary item?"
        confirmLabel="Delete"
        variant="danger"
      />
      <ConfirmModal
        isOpen={!!alertMsg}
        onClose={() => setAlertMsg(null)}
        onConfirm={() => setAlertMsg(null)}
        title="Notice"
        message={alertMsg || ''}
        confirmLabel="OK"
        variant="info"
        hideCancel
      />
    </div>
  );
}
