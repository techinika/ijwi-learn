'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, UserProfile } from '@/lib/database';
import { ArrowLeft, Users, Shield, ShieldOff, Crown, Star, X, Mail, Trophy, BookOpen, ClipboardCheck, Zap, Layers } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

export default function LearnersPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ user: UserProfile; type: 'admin' | 'teacher' } | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await dbService.getUsers();
      setItems(data);
    } catch (e) {
      console.error('Failed to load learners', e);
    }
    setLoading(false);
  };

  const toggleAdmin = async (user: UserProfile) => {
    try {
      await dbService.updateUser(user.id, { isAdmin: !user.isAdmin });
      setItems(prev => prev.map(u => u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u));
    } catch (e) {
      console.error('Failed to update user', e);
    }
    setConfirmToggle(null);
  };

  const handleToggleTeacher = (user: UserProfile) => {
    setConfirmToggle({ user, type: 'teacher' });
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

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8 flex items-center gap-3">
            <Users size={28} />
            <div>
              <h1 className="text-2xl font-bold">Learners</h1>
              <p className="text-primary-100 mt-1">View and manage learners ({items.length})</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Points</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Tests</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Streak</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Level</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No learners found.</td></tr>
                  ) : items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.photoURL ? (
                            <img src={item.photoURL} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-sm font-bold">
                              {item.displayName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <button onClick={() => setViewingUser(item)} className="font-medium text-gray-900 hover:text-primary-600 text-left">
                            {item.displayName}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.email}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">{item.totalPoints}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{item.testsCompleted}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${(item.consecutivePasses || 0) >= 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {item.consecutivePasses || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                          Level {item.currentLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {item.isAdmin ? (
                              <button onClick={() => setConfirmToggle({ user: item, type: 'admin' })} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors" title="Remove Admin">
                                <Crown size={14} />
                                Admin
                              </button>
                            ) : (
                              <button onClick={() => setConfirmToggle({ user: item, type: 'admin' })} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Make Admin">
                                <Crown size={14} />
                                Make Admin
                              </button>
                            )}
                            {item.isTeacher ? (
                              <button onClick={() => handleToggleTeacher(item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors" title="Remove Teacher">
                                <ShieldOff size={14} />
                                Teacher
                              </button>
                            ) : (
                              <button onClick={() => handleToggleTeacher(item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg transition-colors" title="Make Teacher">
                                <Shield size={14} />
                                Teacher
                              </button>
                            )}
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

      <ConfirmModal
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => {
          if (confirmToggle?.type === 'admin') {
            toggleAdmin(confirmToggle.user);
          } else if (confirmToggle?.type === 'teacher') {
            dbService.updateUser(confirmToggle.user.id, { isTeacher: !confirmToggle.user.isTeacher }).then(() => {
              setItems(prev => prev.map(u => u.id === confirmToggle.user.id ? { ...u, isTeacher: !u.isTeacher } : u));
            });
            setConfirmToggle(null);
          }
        }}
        title={confirmToggle?.type === 'admin'
          ? `${confirmToggle?.user.isAdmin ? 'Remove' : 'Make'} Admin`
          : `${confirmToggle?.user.isTeacher ? 'Remove' : 'Make'} Teacher`}
        message={`Are you sure you want to ${confirmToggle?.type === 'admin'
          ? (confirmToggle?.user.isAdmin ? 'remove' : 'make') + ' this user admin'
          : (confirmToggle?.user.isTeacher ? 'remove' : 'make') + ' this user a teacher'}?`}
        confirmLabel={confirmToggle?.type === 'admin'
          ? (confirmToggle?.user.isAdmin ? 'Remove Admin' : 'Make Admin')
          : (confirmToggle?.user.isTeacher ? 'Remove Teacher' : 'Make Teacher')}
        variant="warning"
      />

      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {viewingUser.photoURL ? (
                  <img src={viewingUser.photoURL} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-sm font-bold">
                    {viewingUser.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{viewingUser.displayName}</h2>
                  <p className="text-sm text-gray-500">{viewingUser.email}</p>
                </div>
              </div>
              <button onClick={() => setViewingUser(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Trophy size={20} className="mx-auto mb-2 text-amber-500" />
                  <div className="text-2xl font-bold text-gray-900">{viewingUser.totalPoints || 0}</div>
                  <div className="text-xs text-gray-500">Total Points</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <ClipboardCheck size={20} className="mx-auto mb-2 text-primary-500" />
                  <div className="text-2xl font-bold text-gray-900">{viewingUser.testsCompleted || 0}</div>
                  <div className="text-xs text-gray-500">Tests Completed</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Zap size={20} className="mx-auto mb-2 text-amber-500" />
                  <div className="text-2xl font-bold text-gray-900">{viewingUser.consecutivePasses || 0}</div>
                  <div className="text-xs text-gray-500">Streak</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <BookOpen size={20} className="mx-auto mb-2 text-emerald-500" />
                  <div className="text-2xl font-bold text-gray-900">{viewingUser.vocabularyLearned || 0}</div>
                  <div className="text-xs text-gray-500">Words Learned</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Level & Roles</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Current Level</span><span className="font-medium text-gray-900">Level {viewingUser.currentLevel || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Admin</span><span className={`font-medium ${viewingUser.isAdmin ? 'text-purple-600' : 'text-gray-400'}`}>{viewingUser.isAdmin ? 'Yes' : 'No'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Teacher</span><span className={`font-medium ${viewingUser.isTeacher ? 'text-amber-600' : 'text-gray-400'}`}>{viewingUser.isTeacher ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
              {viewingUser.purchasedLevels && viewingUser.purchasedLevels.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Purchased Levels</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {viewingUser.purchasedLevels.map((level: any) => (
                      <span key={level} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                        Level {level}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button onClick={() => setViewingUser(null)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
