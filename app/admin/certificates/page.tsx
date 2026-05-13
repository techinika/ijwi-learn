'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Certificate, Level, UserProfile } from '@/lib/database';
import { ArrowLeft, Award, Trash2, Eye, User, Calendar, CheckCircle, Search, X } from 'lucide-react';

export default function AdminCertificatesPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [certsData, levelsData, usersData] = await Promise.all([
        dbService.getAllCertificates(),
        dbService.getLevels(),
        dbService.getUsers(),
      ]);
      setCertificates(certsData);
      setLevels(levelsData);
      setUsers(usersData);
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const handleDelete = async (certId: string) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;
    try {
      await dbService.deleteCertificate(certId);
      await loadData();
    } catch (e) {
      console.error('Error deleting certificate:', e);
    }
  };

  const getLevelTitle = (levelId: number) => levels.find(l => l.id === levelId.toString())?.title || `Level ${levelId}`;
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.displayName || 'Unknown User';

  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredCerts = certificates.filter(cert => {
    if (!searchTerm) return true;
    const user = users.find(u => u.id === cert.userId);
    const searchLower = searchTerm.toLowerCase();
    return (
      cert.certificateId.toLowerCase().includes(searchLower) ||
      cert.levelName.toLowerCase().includes(searchLower) ||
      (user?.displayName || '').toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: certificates.length,
    byLevel: certificates.reduce((acc, cert) => {
      acc[cert.levelName] = (acc[cert.levelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgScore: certificates.length > 0
      ? Math.round(certificates.reduce((sum, c) => sum + c.score, 0) / certificates.length)
      : 0,
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <a href="/admin" className="text-primary-600 hover:underline flex items-center gap-2">
              <ArrowLeft size={18} />
              Back to Admin
            </a>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8">
            <h1 className="text-2xl font-bold mb-2">Certificates Management</h1>
            <p className="text-primary-100">View and manage all issued certificates</p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-primary-600">{stats.total}</div>
                  <div className="text-sm text-gray-500">Total Certificates</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-emerald-600">{stats.avgScore}%</div>
                  <div className="text-sm text-gray-500">Average Score</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-purple-600">{Object.keys(stats.byLevel).length}</div>
                  <div className="text-sm text-gray-500">Levels Completed</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-amber-600">
                    {new Set(certificates.map(c => c.userId)).size}
                  </div>
                  <div className="text-sm text-gray-500">Unique Earners</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search by certificate ID, level, or user name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              {filteredCerts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <Award size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No Certificates Found' : 'No Certificates Yet'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm
                      ? 'Try adjusting your search criteria.'
                      : 'Certificates will appear here when users complete tests.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCerts.map(cert => (
                    <div key={cert.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                            <Award size={24} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{cert.levelName} Certificate</h3>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                {getUserName(cert.userId)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(cert.completedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle size={14} className="text-emerald-500" />
                                Score: {cert.score}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-2">ID: {cert.certificateId}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedCert(cert)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(cert.id)}
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

      {selectedCert && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Certificate Details</h3>
              <button onClick={() => setSelectedCert(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Certificate ID</label>
                <div className="font-medium text-gray-900">{selectedCert.certificateId}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Level</label>
                <div className="font-medium text-gray-900">{selectedCert.levelName}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">User</label>
                <div className="font-medium text-gray-900">{getUserName(selectedCert.userId)}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Score</label>
                <div className="font-medium text-gray-900">{selectedCert.score}%</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Completed At</label>
                <div className="font-medium text-gray-900">{formatDate(selectedCert.completedAt)}</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}