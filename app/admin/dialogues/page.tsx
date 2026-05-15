'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Level, Difficulty, Dialogue, DialogueLine } from '@/lib/database';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, MessageSquare, Eye, EyeOff, Users, GripVertical, Trash } from 'lucide-react';

export default function DialoguesPage() {
  const { isAdmin } = useAuth();
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Dialogue | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    levelId: '',
    difficulty: '',
    speakers: ['', ''],
    lines: [{ speakerIndex: 0, kinyarwanda: '', english: '' }],
    isActive: true,
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dbDialogues, dbLevels, dbDifficulties] = await Promise.all([
        dbService.getDialogues(),
        dbService.getLevels(),
        dbService.getDifficulties(),
      ]);
      setDialogues(dbDialogues);
      setLevels(dbLevels);
      setDifficulties(dbDifficulties.filter(d => d.isActive));
    } catch (e) {
      console.error('Failed to load dialogues', e);
    }
    setLoading(false);
  };

  const openAdd = () => {
    setForm({
      title: '',
      description: '',
      levelId: levels[0]?.id || '',
      difficulty: difficulties[0]?.id || '',
      speakers: ['', ''],
      lines: [{ speakerIndex: 0, kinyarwanda: '', english: '' }],
      isActive: true,
    });
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (dialogue: Dialogue) => {
    setForm({
      title: dialogue.title,
      description: dialogue.description,
      levelId: dialogue.levelId,
      difficulty: dialogue.difficulty,
      speakers: [...dialogue.speakers],
      lines: dialogue.lines.map(l => ({ ...l })),
      isActive: dialogue.isActive,
    });
    setEditing(dialogue);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.levelId || !form.difficulty || form.speakers.filter(s => s.trim()).length < 2) {
      alert('Please fill in title, select level and difficulty, and add at least 2 speakers');
      return;
    }
    const validLines = form.lines.filter(l => l.kinyarwanda.trim() && l.english.trim());
    if (validLines.length === 0) {
      alert('Please add at least one dialogue line with both Kinyarwanda and English text');
      return;
    }
    try {
      const data = {
        title: form.title,
        description: form.description,
        levelId: form.levelId,
        difficulty: form.difficulty,
        speakers: form.speakers.filter(s => s.trim()),
        lines: validLines,
        isActive: form.isActive,
      };
      if (editing) {
        await dbService.updateDialogue(editing.id, data);
      } else {
        await dbService.createDialogue(data);
      }
      setShowModal(false);
      await loadAll();
    } catch (e) {
      console.error('Failed to save dialogue', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this dialogue?')) return;
    try {
      await dbService.deleteDialogue(id);
      await loadAll();
    } catch (e) {
      console.error('Failed to delete dialogue', e);
    }
  };

  const handleToggleActive = async (dialogue: Dialogue) => {
    try {
      await dbService.updateDialogue(dialogue.id, { isActive: !dialogue.isActive });
      await loadAll();
    } catch (e) {
      console.error('Failed to toggle dialogue', e);
    }
  };

  const addSpeaker = () => {
    setForm(f => ({ ...f, speakers: [...f.speakers, ''] }));
  };

  const removeSpeaker = (index: number) => {
    if (form.speakers.length <= 2) {
      alert('Dialogue must have at least 2 speakers');
      return;
    }
    const newSpeakers = form.speakers.filter((_, i) => i !== index);
    const newLines = form.lines.map(line => ({
      ...line,
      speakerIndex: line.speakerIndex >= index ? line.speakerIndex - 1 : line.speakerIndex,
    }));
    setForm(f => ({ ...f, speakers: newSpeakers, lines: newLines }));
  };

  const addLine = () => {
    setForm(f => ({
      ...f,
      lines: [...f.lines, { speakerIndex: 0, kinyarwanda: '', english: '' }],
    }));
  };

  const removeLine = (index: number) => {
    setForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== index) }));
  };

  const updateLine = (index: number, field: keyof DialogueLine, value: string | number) => {
    const newLines = [...form.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setForm(f => ({ ...f, lines: newLines }));
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
              <MessageSquare size={28} />
              <div>
                <h1 className="text-2xl font-bold">Dialogues</h1>
                <p className="text-primary-100 mt-1">Manage conversation dialogues for learners</p>
              </div>
            </div>
            <button onClick={openAdd} className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors shrink-0">
              <Plus size={18} />
              Add Dialogue
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Level</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Difficulty</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Speakers</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Lines</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : dialogues.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No dialogues found.</td></tr>
                  ) : dialogues.map(dialogue => {
                    const level = levels.find(l => l.id === dialogue.levelId);
                    const difficulty = difficulties.find(d => d.id === dialogue.difficulty);
                    return (
                      <tr key={dialogue.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{dialogue.title}</td>
                        <td className="px-4 py-3 text-gray-600">{level?.title || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{difficulty?.name || '-'}</td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          <div className="flex items-center justify-center gap-1">
                            <Users size={14} />
                            {dialogue.speakers.length}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{dialogue.lines.length}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleActive(dialogue)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              dialogue.isActive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {dialogue.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                            {dialogue.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(dialogue)}
                              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(dialogue.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Edit Dialogue' : 'Add New Dialogue'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="e.g., At the Market"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  rows={2}
                  placeholder="Brief description of the dialogue context"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={form.levelId}
                    onChange={e => setForm(f => ({ ...f, levelId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  >
                    {levels.map(level => (
                      <option key={level.id} value={level.id}>{level.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  >
                    {difficulties.map(diff => (
                      <option key={diff.id} value={diff.id}>{diff.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Speakers</label>
                <button
                  type="button"
                  onClick={addSpeaker}
                  className="text-sm text-primary-600 hover:underline"
                >
                  + Add Speaker
                </button>
              </div>
              <div className="space-y-2">
                {form.speakers.map((speaker, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={speaker}
                      onChange={e => {
                        const newSpeakers = [...form.speakers];
                        newSpeakers[idx] = e.target.value;
                        setForm(f => ({ ...f, speakers: newSpeakers }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                      placeholder={`Speaker ${idx + 1} name (e.g., John, Mary)`}
                    />
                    {form.speakers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeSpeaker(idx)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Dialogue Lines</label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    + Add Line
                  </button>
                </div>
                <div className="space-y-3">
                  {form.lines.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={line.speakerIndex}
                        onChange={e => updateLine(idx, 'speakerIndex', parseInt(e.target.value))}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 shrink-0"
                      >
                        {form.speakers.map((sp, i) => (
                          <option key={i} value={i}>{sp || `Speaker ${i + 1}`}</option>
                        ))}
                      </select>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={line.kinyarwanda}
                          onChange={e => updateLine(idx, 'kinyarwanda', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                          placeholder="Kinyarwanda text"
                        />
                        <input
                          type="text"
                          value={line.english}
                          onChange={e => updateLine(idx, 'english', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                          placeholder="English translation"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-gray-400 hover:text-red-500 shrink-0"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active (visible to learners)</label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                <Save size={18} />
                {editing ? 'Update Dialogue' : 'Save Dialogue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}