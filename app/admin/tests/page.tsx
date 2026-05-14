'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Test, TestQuestion, Level, Difficulty } from '@/lib/database';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, FileText, CheckCircle } from 'lucide-react';

interface TestFormData {
  title: string;
  levelId: string;
  difficulty: string;
  passingScore: number;
  questions: TestQuestion[];
}

const defaultFormData: TestFormData = {
  title: '',
  levelId: '',
  difficulty: '',
  passingScore: 80,
  questions: [],
};

export default function AdminTestsPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [formData, setFormData] = useState<TestFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testsData, levelsData, difficultiesData] = await Promise.all([
        dbService.getTests(),
        dbService.getLevels(),
        dbService.getDifficulties(),
      ]);
      setTests(testsData);
      setLevels(levelsData);
      setDifficulties(difficultiesData);
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.levelId || formData.questions.length === 0) {
      alert('Please fill in all required fields and add at least one question');
      return;
    }

    setSaving(true);
    try {
      if (editingTest) {
        await dbService.updateTest(editingTest.id, formData);
      } else {
        await dbService.createTest(formData as Omit<Test, 'id'>);
      }
      await loadData();
      resetForm();
    } catch (e) {
      console.error('Error saving test:', e);
      alert('Failed to save test');
    }
    setSaving(false);
  };

  const handleEdit = (test: Test) => {
    setEditingTest(test);
    setFormData({
      title: test.title,
      levelId: test.levelId,
      difficulty: test.difficulty,
      passingScore: test.passingScore,
      questions: test.questions,
    });
    setShowForm(true);
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    try {
      await dbService.deleteTest(testId);
      await loadData();
    } catch (e) {
      console.error('Error deleting test:', e);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingTest(null);
    setShowForm(false);
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          questionTranslations: {},
          options: ['', '', '', ''],
          optionsTranslations: [{}, {}, {}, {}],
          correctAnswer: 0,
        },
      ],
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const getLevelTitle = (levelId: string) => levels.find(l => l.id === levelId)?.title || 'Unknown';

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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <a href="/admin" className="text-primary-600 hover:underline flex items-center gap-2">
              <ArrowLeft size={18} />
              Back to Admin
            </a>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8">
            <h1 className="text-2xl font-bold mb-2">Tests Management</h1>
            <p className="text-primary-100">Create and manage tests for each level</p>
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
                  {editingTest ? 'Edit Test' : 'Create New Test'}
                </h2>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter test title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                    <select
                      value={formData.levelId}
                      onChange={e => setFormData(prev => ({ ...prev, levelId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a level</option>
                      {levels.map(level => (
                        <option key={level.id} value={level.id}>{level.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={e => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select a difficulty</option>
                      {difficulties.map(diff => (
                        <option key={diff.id} value={diff.slug}>{diff.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
                    <input
                      type="number"
                      value={formData.passingScore}
                      onChange={e => setFormData(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <Plus size={18} />
                      Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.questions.map((q, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-medium text-gray-700">Question {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeQuestion(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Question (English)</label>
                            <input
                              type="text"
                              value={q.question}
                              onChange={e => updateQuestion(idx, 'question', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Enter question text"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Question (Kinyarwanda)</label>
                            <input
                              type="text"
                              value={q.questionTranslations?.['rw'] || ''}
                              onChange={e => updateQuestion(idx, 'questionTranslations', { ...q.questionTranslations, 'rw': e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Ibyo ushaka kubaza muri Kinyarwanda"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-600">Options (select correct answer)</label>
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${idx}`}
                                    checked={q.correctAnswer === optIdx}
                                    onChange={() => updateQuestion(idx, 'correctAnswer', optIdx)}
                                    className="text-primary-600"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={e => {
                                      const newOptions = [...q.options];
                                      newOptions[optIdx] = e.target.value;
                                      updateQuestion(idx, 'options', newOptions);
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder={`Option ${optIdx + 1}`}
                                  />
                                </div>
                                <input
                                  type="text"
                                  value={q.optionsTranslations?.[optIdx]?.['rw'] || ''}
                                  onChange={e => {
                                    const newTranslations = [...(q.optionsTranslations || [{}, {}, {}, {}])];
                                    newTranslations[optIdx] = { ...newTranslations[optIdx], 'rw': e.target.value };
                                    updateQuestion(idx, 'optionsTranslations', newTranslations);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm ml-6"
                                  placeholder={`Kinyarwanda translation for option ${optIdx + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
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
                    {saving ? 'Saving...' : 'Save Test'}
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
                  Add New Test
                </button>
              </div>

              {tests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tests Yet</h3>
                  <p className="text-gray-500 mb-4">Create tests to assess learner progress.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                  >
                    <Plus size={18} />
                    Create First Test
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tests.map(test => (
                    <div key={test.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{test.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="px-2.5 py-1 bg-primary-100 text-primary-700 rounded-full">
                              {getLevelTitle(test.levelId)}
                            </span>
                            <span className="capitalize">{test.difficulty}</span>
                            <span>{test.questions.length} questions</span>
                            <span className="flex items-center gap-1">
                              <CheckCircle size={14} className="text-emerald-500" />
                              {test.passingScore}% to pass
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(test)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                          >
                            <Edit size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(test.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}