'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Story, Level, Difficulty, Category, Language } from '@/lib/database';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Save, X, BookMarked, Search, 
  ChevronRight, Bold, Italic, Image, Link as LinkIcon, List, 
  Quote, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight,
  Upload, Eye, EyeOff
} from 'lucide-react';

export default function StoriesPage() {
  const { user, isAdmin, isTeacher } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNewStory, setIsNewStory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [title, setTitle] = useState('');
  const [titleTranslations, setTitleTranslations] = useState<Record<string, string>>({});
  const [levelId, setLevelId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');

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
    setContent('');
    setCoverImage('');
    setShowPreview(false);
  }, []);

  const selectStory = async (story: Story) => {
    setSelectedId(story.id);
    setIsNewStory(false);
    setTitle(story.title || '');
    setTitleTranslations(story.titleTranslations ? { ...story.titleTranslations } : {});
    setLevelId(story.levelId || '');
    setDifficulty(story.difficulty || '');
    setCategory(story.category || '');
    setIsActive(story.isActive ?? true);
    setContent(story.content || '');
    setCoverImage(story.coverImage || '');
  };

  const newStory = () => {
    setSelectedId(null);
    setIsNewStory(true);
    resetForm();
  };

  const handleSave = async () => {
    if (!title.trim() || !levelId || !difficulty || !category) {
      alert('Please fill in all required fields: Title, Level, Difficulty, and Category');
      return;
    }
    setSaving(true);
    const data = {
      title: title.trim(),
      titleTranslations,
      levelId,
      difficulty,
      category,
      isActive,
      content,
      coverImage,
      sentences: [],
    };
    try {
      if (selectedId) {
        await dbService.updateStory(selectedId, data);
      } else {
        const newId = await dbService.createStory(data as any);
        setSelectedId(newId);
      }
      await loadStories();
      setIsNewStory(false);
    } catch (e) {
      console.error('Failed to save story', e);
      alert('Failed to save story');
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

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter link URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          execCommand('insertImage', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Story Editor</h1>
              <p className="text-primary-100 mt-1">Create and edit Rwandan tales with rich formatting</p>
            </div>
            <button
              onClick={newStory}
              className="flex items-center gap-2 bg-white text-primary-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              <Plus size={18} />
              New Story
            </button>
          </div>

          <div className="flex gap-6">
            {/* Left Panel - Story List */}
            <div className="w-80 shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-28">
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

                <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                  ) : filteredStories.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No stories found.</div>
                  ) : filteredStories.map(story => (
                    <button
                      key={story.id}
                      onClick={() => selectStory(story)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                        selectedId === story.id ? 'bg-primary-50 border-l-4 border-primary-600' : 'border-l-4 border-transparent'
                      }`}
                    >
                      {story.coverImage && (
                        <img src={story.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      )}
                      {!story.coverImage && (
                        <BookMarked size={20} className="text-gray-400 mt-1 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm truncate">{story.title || 'Untitled'}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{getLevelTitle(story.levelId)}</span>
                          {!story.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 mt-1 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Editor */}
            <div className="flex-1 min-w-0">
              {!isNewStory && selectedId === null && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                  <BookMarked size={64} className="text-gray-200 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No Story Selected</h3>
                  <p className="text-gray-400 mb-6">Select a story from the list or create a new one.</p>
                  <button
                    onClick={newStory}
                    className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    <Plus size={18} />
                    Create New Story
                  </button>
                </div>
              )}

              {(isNewStory || selectedId !== null) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                      {isNewStory ? 'Create New Story' : 'Edit Story'}
                    </h2>
                    <div className="flex items-center gap-3">
                      {selectedId && (
                        <>
                          <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              showPreview ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Eye size={16} />
                            {showPreview ? 'Hide Preview' : 'Preview'}
                          </button>
                          <button
                            onClick={() => handleDelete(selectedId!)}
                            className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </>
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

                  {!showPreview ? (
                    <>
                      <div className="p-6 border-b border-gray-100 space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Story Title (Kinyarwanda) *
                            </label>
                            <input
                              type="text"
                              value={title}
                              onChange={e => setTitle(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                              placeholder="Izina ry'akazi"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cover Image URL
                            </label>
                            <input
                              type="url"
                              value={coverImage}
                              onChange={e => setCoverImage(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title Translations
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {activeLanguages.map(lang => (
                              <div key={lang.code} className="flex items-center gap-3">
                                <span className="text-xl">{lang.flag}</span>
                                <span className="text-sm text-gray-600 w-28 shrink-0">{lang.name}</span>
                                <input
                                  type="text"
                                  value={titleTranslations[lang.code] || ''}
                                  onChange={e => setTitleTranslations(p => ({ ...p, [lang.code]: e.target.value }))}
                                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                                  placeholder={`Title in ${lang.name}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Level *</label>
                            <select
                              value={levelId}
                              onChange={e => setLevelId(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
                            >
                              <option value="">Select level</option>
                              {levels.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty *</label>
                            <select
                              value={difficulty}
                              onChange={e => setDifficulty(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
                            >
                              <option value="">Select difficulty</option>
                              {difficulties.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            <select
                              value={category}
                              onChange={e => setCategory(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
                            >
                              <option value="">Select category</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={e => setIsActive(e.target.checked)}
                              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-600"
                            />
                            <span className="text-sm font-medium text-gray-700">Published (Active)</span>
                          </label>
                        </div>
                      </div>

                      {/* Rich Text Editor */}
                      <div className="p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Story Content (Rich Text)
                        </label>
                        
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 rounded-t-xl border border-b-0 border-gray-300">
                          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                            <select
                              onChange={e => execCommand('fontSize', e.target.value)}
                              className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                              defaultValue="4"
                            >
                              <option value="1">Small</option>
                              <option value="4">Normal</option>
                              <option value="5">Large</option>
                              <option value="7">Huge</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                            <button
                              type="button"
                              onClick={() => execCommand('formatBlock', '<h1>')}
                              className="p-2 hover:bg-white rounded transition"
                              title="Heading 1"
                            >
                              <Heading1 size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execCommand('formatBlock', '<h2>')}
                              className="p-2 hover:bg-white rounded transition"
                              title="Heading 2"
                            >
                              <Heading2 size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execCommand('formatBlock', '<p>')}
                              className="p-2 hover:bg-white rounded transition"
                              title="Paragraph"
                            >
                              <AlignLeft size={18} />
                            </button>
                          </div>

                          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                            <button
                              type="button"
                              onClick={() => execCommand('bold')}
                              className="p-2 hover:bg-white rounded transition"
                              title="Bold"
                            >
                              <Bold size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execCommand('italic')}
                              className="p-2 hover:bg-white rounded transition"
                              title="Italic"
                            >
                              <Italic size={18} />
                            </button>
                          </div>

                          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                            <button
                              type="button"
                              onClick={() => execCommand('justifyLeft')}
                              className="p-2 hover:bg-white rounded transition"
                              title="Align Left"
                            >
                              <AlignLeft size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execCommand('justifyCenter')}
                              className="p-2 hover:bg-white rounded transition"
                              title="Center"
                            >
                              <AlignCenter size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execCommand('justifyRight')}
                              className="p-2 hover:bg-white rounded transition"
                              title="Align Right"
                            >
                              <AlignRight size={18} />
                            </button>
                          </div>

                          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                            <button
                              type="button"
                              onClick={() => execCommand('insertUnorderedList')}
                              className="p-2 hover:bg-white rounded transition"
                              title="Bullet List"
                            >
                              <List size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execCommand('formatBlock', '<blockquote>')}
                              className="p-2 hover:bg-white rounded transition"
                              title="Quote"
                            >
                              <Quote size={18} />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={insertImage}
                              className="p-2 hover:bg-white rounded transition"
                              title="Insert Image"
                            >
                              <Image size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={insertLink}
                              className="p-2 hover:bg-white rounded transition"
                              title="Insert Link"
                            >
                              <LinkIcon size={18} />
                            </button>
                            <label className="p-2 hover:bg-white rounded transition cursor-pointer" title="Upload Image">
                              <Upload size={18} />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Editor Area */}
                        <div
                          id="story-editor"
                          contentEditable
                          suppressContentEditableWarning
                          onInput={(e) => setContent(e.currentTarget.innerHTML)}
                          className="min-h-[500px] w-full border border-gray-300 rounded-b-xl p-6 focus:outline-none focus:ring-2 focus:ring-primary-600 prose prose-sm max-w-none overflow-auto"
                          style={{ fontFamily: 'Georgia, serif' }}
                          dangerouslySetInnerHTML={{ __html: content }}
                        />
                      </div>
                    </>
                  ) : (
                    /* Preview Mode */
                    <div className="p-8 max-w-3xl mx-auto">
                      {coverImage && (
                        <img src={coverImage} alt={title} className="w-full h-64 object-cover rounded-xl mb-6" />
                      )}
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title || 'Untitled'}</h1>
                      {Object.entries(titleTranslations).map(([code, translation]) => (
                        <p key={code} className="text-lg text-gray-500 mb-1">{translation}</p>
                      ))}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                          {getLevelTitle(levelId)}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          {getDifficultyName(difficulty)}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          {getCategoryName(category)}
                        </span>
                      </div>
                      <div 
                        className="mt-8 prose prose-lg max-w-none"
                        style={{ fontFamily: 'Georgia, serif' }}
                        dangerouslySetInnerHTML={{ __html: content }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}