'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Category, Level } from '@/lib/database';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Type } from 'lucide-react';

export default function CategoriesPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Category[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', nameKinyarwanda: '', slug: '', levelId: '', isActive: true });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cats, levs] = await Promise.all([
        dbService.getCategories(),
        dbService.getLevels(),
      ]);
      setItems(cats);
      setLevels(levs);
    } catch (e) {
      console.error('Failed to load data', e);
    }
    setLoading(false);
  };

  const getLevelTitle = (id: string) => levels.find(l => l.id === id)?.title || id;

  const openAdd = () => {
    setForm({ name: '', nameKinyarwanda: '', slug: '', levelId: '', isActive: true });
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (item: Category) => {
    setForm({ name: item.name, nameKinyarwanda: item.nameKinyarwanda, slug: item.slug, levelId: item.levelId, isActive: item.isActive });
    setEditing(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.nameKinyarwanda || !form.slug || !form.levelId) return;
    const data = { name: form.name, nameKinyarwanda: form.nameKinyarwanda, slug: form.slug, levelId: form.levelId, isActive: form.isActive };
    try {
      if (editing) {
        await dbService.updateCategory(editing.id, data);
      } else {
        await dbService.createCategory(data);
      }
      setShowModal(false);
      await loadAll();
    } catch (e) {
      console.error('Failed to save category', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await dbService.deleteCategory(id);
      await loadAll();
    } catch (e) {
      console.error('Failed to delete category', e);
    }
  };

  if (!isAdmin) {
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
              <h1 className="text-2xl font-bold">Categories</h1>
              <p className="text-primary-100 mt-1">Manage vocabulary categories</p>
            </div>
            <button onClick={openAdd} className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
              <Plus size={18} />
              Add Category
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Kinyarwanda</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Slug</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Level</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Active</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No categories found.</td></tr>
                  ) : items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-gray-700">{item.nameKinyarwanda}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.slug}</td>
                      <td className="px-4 py-3">{getLevelTitle(item.levelId)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="e.g. Animals" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kinyarwanda *</label>
                <input type="text" value={form.nameKinyarwanda} onChange={e => setForm(p => ({ ...p, nameKinyarwanda: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="e.g. Inyamaswa" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input type="text" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="e.g. animals" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                <select value={form.levelId} onChange={e => setForm(p => ({ ...p, levelId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                  <option value="">Select level</option>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600" />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
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
    </div>
  );
}
