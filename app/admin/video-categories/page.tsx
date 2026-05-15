'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, VideoCategory, Level } from '@/lib/database';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Folder, GripVertical } from 'lucide-react';

interface CategoryFormData {
  name: string;
  slug: string;
  levelIds: string[];
  order: number;
  isActive: boolean;
}

const defaultFormData: CategoryFormData = {
  name: '',
  slug: '',
  levelIds: [],
  order: 0,
  isActive: true,
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminVideoCategoriesPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VideoCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cats, levs] = await Promise.all([
        dbService.getVideoCategories(),
        dbService.getLevels(),
      ]);
      setCategories(cats);
      setLevels(levs);
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const getLevelTitle = (id: string) => levels.find(l => l.id === id)?.title || id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter a category name');
      return;
    }

    const slug = formData.slug || generateSlug(formData.name);
    setSaving(true);
    try {
      if (editingCategory) {
        await dbService.updateVideoCategory(editingCategory.id, { ...formData, slug });
      } else {
        await dbService.createVideoCategory({ ...formData, slug });
      }
      await loadAll();
      resetForm();
    } catch (e) {
      console.error('Error saving category:', e);
      alert('Failed to save category');
    }
    setSaving(false);
  };

  const handleEdit = (category: VideoCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      levelIds: category.levelIds || [],
      order: category.order,
      isActive: category.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await dbService.deleteVideoCategory(categoryId);
      await loadAll();
    } catch (e) {
      console.error('Error deleting category:', e);
    }
  };

  const handleToggleActive = async (category: VideoCategory) => {
    try {
      await dbService.updateVideoCategory(category.id, { isActive: !category.isActive });
      await loadAll();
    } catch (e) {
      console.error('Error toggling category status:', e);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
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
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <a href="/admin" className="text-primary-600 hover:underline flex items-center gap-2">
              <ArrowLeft size={18} />
              Back to Admin
            </a>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8">
            <h1 className="text-2xl font-bold mb-2">Video Categories</h1>
            <p className="text-primary-100">Manage categories for video lessons</p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : showForm ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => handleNameChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Basics, Grammar, Culture"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL)</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., basics, grammar"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Levels</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-xl p-3">
                      {levels.map(l => (
                        <label key={l.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.levelIds.includes(l.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, levelIds: [...prev.levelIds, l.id] }));
                              } else {
                                setFormData(prev => ({ ...prev, levelIds: prev.levelIds.filter(id => id !== l.id) }));
                              }
                            }}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                          />
                          <span className="text-sm text-gray-700">{l.title}</span>
                        </label>
                      ))}
                      {levels.length === 0 && <p className="text-sm text-gray-400">No levels available</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={e => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-5 h-5 text-primary-600 rounded"
                      />
                      <span className="text-gray-700">Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium disabled:opacity-50"
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Category'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium"
                >
                  <Plus size={18} />
                  Add Category
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <Folder size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Categories Yet</h3>
                  <p className="text-gray-500 mb-4">Create categories to organize your videos.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                  >
                    <Plus size={18} />
                    Add First Category
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Levels</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {categories.sort((a, b) => a.order - b.order).map((category) => (
                            <tr key={category.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <GripVertical size={16} className="text-gray-400 cursor-move" />
                                  {category.order}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{category.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{category.slug}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {(category.levelIds || []).map(id => (
                                    <span key={id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700">
                                      {getLevelTitle(id)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleToggleActive(category)}
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                    category.isActive
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {category.isActive ? 'Active' : 'Inactive'}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleEdit(category)}
                                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                  >
                                    <Edit size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(category.id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}