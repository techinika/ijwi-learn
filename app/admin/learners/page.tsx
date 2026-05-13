'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, UserProfile } from '@/lib/database';
import { ArrowLeft, Users, Shield, ShieldOff } from 'lucide-react';

export default function LearnersPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

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

  const toggleTeacher = async (user: UserProfile) => {
    try {
      await dbService.updateUser(user.id, { isTeacher: !user.isTeacher });
      setItems(prev => prev.map(u => u.id === user.id ? { ...u, isTeacher: !u.isTeacher } : u));
    } catch (e) {
      console.error('Failed to update user', e);
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
                          <span className="font-medium text-gray-900">{item.displayName}</span>
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
                        {item.isTeacher ? (
                          <button onClick={() => toggleTeacher(item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors">
                            <ShieldOff size={14} />
                            Remove Teacher
                          </button>
                        ) : (
                          <button onClick={() => toggleTeacher(item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg transition-colors">
                            <Shield size={14} />
                            Make Teacher
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
