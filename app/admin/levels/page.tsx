'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Level } from '@/lib/database';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Layers } from 'lucide-react';

const COLOR_OPTIONS = [
  { value: 'emerald', label: 'Green / Emerald' },
  { value: 'primary', label: 'Blue / Primary' },
  { value: 'purple', label: 'Purple' },
  { value: 'amber', label: 'Amber' },
];

export default function LevelsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Level | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', description: '', price: 0, icon: '', color: 'primary', order: 1, isActive: true });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await dbService.getLevels();
      setItems(data);
    } catch (e) {
      console.error('Failed to load levels', e);
    }
    setLoading(false);
  };

const openAdd = () => {
    setForm({ title: '', slug: '', description: '', price: 0, icon: '', color: 'primary', order: items.length + 1, isActive: true });
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (item: Level) => {
    setForm({ title: item.title, slug: item.slug || '', description: item.description, price: item.price, icon: item.icon, color: item.color, order: item.order, isActive: item.isActive });
    setEditing(item);
    setShowModal(true);
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleSave = async () => {
    if (!form.title) return;
    const slug = form.slug || generateSlug(form.title);
    const data = { title: form.title, slug, description: form.description, price: Number(form.price), icon: form.icon, color: form.color, order: Number(form.order), isActive: form.isActive };
    try {
      if (editing) {
        await dbService.updateLevel(editing.id, data);
      } else {
        await dbService.createLevel(data);
      }
      setShowModal(false);
      await loadAll();
    } catch (e) {
      console.error('Failed to save level', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this level?')) return;
    try {
      await dbService.deleteLevel(id);
      await loadAll();
    } catch (e) {
      console.error('Failed to delete level', e);
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

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Layers size={28} />
              <div>
                <h1 className="text-2xl font-bold">Learning Levels</h1>
                <p className="text-primary-100 mt-1">Manage learning levels & pricing</p>
              </div>
            </div>
            <button onClick={openAdd} className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors shrink-0">
              <Plus size={18} />
              Add Level
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Slug</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Price</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Order</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Color</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Active</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">No levels found.</td></tr>
                  ) : items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                      <td className="px-4 py-3 text-gray-500">{item.slug || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.description}</td>
                      <td className="px-4 py-3 text-center font-medium text-gray-900">{item.price} RWF</td>
                      <td className="px-4 py-3 text-center text-gray-700">{item.order}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          item.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                          item.color === 'primary' ? 'bg-primary-100 text-primary-700' :
                          item.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {item.color}
                        </span>
                      </td>
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
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Level' : 'Add Level'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="e.g. Beginner" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input type="text" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="beginner (auto-generated if empty)" />
                <p className="text-xs text-gray-500 mt-1">Used in URL: /learn/{form.slug || 'slug'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="Describe this level..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (RWF)</label>
                  <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input type="text" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="e.g. BookOpen" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <select value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                  {COLOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
