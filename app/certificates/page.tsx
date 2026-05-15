'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Level } from '@/lib/database';

const Certificate = dynamic(() => import('@/components/Certificate'), { ssr: false });
import type { CertificateProps } from '@/components/Certificate';
import { ArrowLeft, Award, CheckCircle, FileText, Download, Eye, X } from 'lucide-react';
import { generateCertificateId, formatDate, downloadCertificateAsPDF } from '@/lib/certificate';

interface UserCertificate {
  id: string;
  levelId: number;
  levelName: string;
  score: number;
  completedAt: Date;
  certificateId: string;
}

export default function CertificatesPage() {
  const { user, userData } = useAuth();
  const [viewingCertificate, setViewingCertificate] = useState<UserCertificate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [dbCerts, dbLevels] = await Promise.all([
        dbService.getCertificates(user.uid),
        dbService.getLevels(),
      ]);
      setLevels(dbLevels);
      setCertificates(dbCerts.map(c => {
        let completedAt: Date;
        const raw = c.completedAt;
        if (raw instanceof Date) {
          completedAt = raw;
        } else if (raw && typeof raw === 'object' && 'seconds' in raw) {
          completedAt = new Date((raw as any).seconds * 1000);
        } else {
          completedAt = new Date(raw as any);
        }
        return {
          id: c.id,
          levelId: c.levelId,
          levelName: c.levelName,
          score: c.score,
          completedAt,
          certificateId: c.certificateId,
        };
      }));
    } catch (error) {
      console.log('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleDownload = async (cert: UserCertificate) => {
    if (!user) return;

    const certificateData: CertificateProps = {
      userName: user.displayName || 'Learner',
      level: cert.levelName,
      score: cert.score,
      date: formatDate(cert.completedAt),
      certificateId: cert.certificateId || generateCertificateId(user.uid, cert.levelName),
    };

    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '-9999px';
    div.style.left = '-9999px';
    div.style.zIndex = '-1';
    document.body.appendChild(div);

    const root = document.createElement('div');
    div.appendChild(root);

    const { createRoot } = await import('react-dom/client');
    const CertificateComponent = (await import('@/components/Certificate')).default;
    const rootInstance = createRoot(root);
    rootInstance.render(<CertificateComponent {...certificateData} />);

    await new Promise(r => setTimeout(r, 300));

    const capturedDiv = div.querySelector('div') as HTMLElement;
    if (capturedDiv) {
      await downloadCertificateAsPDF(capturedDiv, certificateData);
    }

    rootInstance.unmount();
    document.body.removeChild(div);
  };

  const getLevelInfo = (levelId: number) => {
    const level = levels.find(l => l.id === levelId.toString());
    if (!level) return { icon: Award, color: 'bg-gray-500' };
    return {
      icon: Award,
      color: level.color === 'green' ? 'bg-emerald-500' : 
             level.color === 'blue' ? 'bg-primary-500' : 
             level.color === 'purple' ? 'bg-purple-500' : 
             level.color === 'amber' ? 'bg-amber-500' : 'bg-gray-500',
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="text-primary-600 hover:underline">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          </div>

          {user ? (
            <>
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8">
                <h2 className="text-xl font-semibold mb-2">Your Achievements</h2>
                <p className="text-primary-100">
                  {loading ? 'Loading...' : `${certificates.length} certificate${certificates.length !== 1 ? 's' : ''} earned`}
                </p>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading certificates...</p>
                </div>
              ) : certificates.length > 0 ? (
                <div className="space-y-4">
                  {certificates.map((cert) => {
                    const levelInfo = getLevelInfo(cert.levelId);
                    const LevelIcon = levelInfo.icon;
                    return (
                      <div key={cert.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 ${levelInfo.color} rounded-xl flex items-center justify-center text-white`}>
                              <LevelIcon size={24} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{cert.levelName} Certificate</h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-gray-500 text-sm">
                                  Completed: {formatDate(cert.completedAt)}
                                </span>
                                <span className="text-emerald-600 font-medium text-sm">
                                  Score: {cert.score}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                              <CheckCircle size={16} />
                              Verified
                            </span>
                            <button
                              onClick={() => {
                                setViewingCertificate(cert);
                                setShowPreview(true);
                              }}
                              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                            >
                              <Eye size={20} />
                            </button>
                            <button
                              onClick={() => handleDownload(cert)}
                              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                            >
                              <Download size={16} />
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
                  <p className="text-gray-500 mb-6">Complete tests to earn certificates!</p>
                  <Link href="/tests" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                    Take a Test
                  </Link>
                </div>
              )}

              <div className="mt-12">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Available Certificates</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {levels.map((level) => {
                    const hasCert = certificates.some(c => c.levelId === parseInt(level.id));
                    const colorClass = level.color === 'green' ? 'bg-emerald-500' : 
                                       level.color === 'blue' ? 'bg-primary-500' : 
                                       level.color === 'purple' ? 'bg-purple-500' : 
                                       level.color === 'amber' ? 'bg-amber-500' : 'bg-gray-500';
                    return (
                      <div
                        key={level.id}
                        className={`p-5 rounded-xl border transition ${
                          hasCert
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-white border-gray-200 hover:border-primary-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center text-white`}>
                            <Award size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{level.title}</div>
                            <div className="text-sm text-gray-500">
                              {hasCert ? 'Completed' : 'Not yet completed'}
                            </div>
                          </div>
                          {hasCert && (
                            <CheckCircle size={20} className="text-emerald-600 ml-auto" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <Award size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign In Required</h3>
              <p className="text-gray-500">Sign in to view your certificates.</p>
            </div>
          )}
        </div>
      </main>

      {showPreview && viewingCertificate && user && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Certificate Preview</h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setViewingCertificate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[80vh] flex justify-center">
              <Certificate
                userName={user.displayName || 'Learner'}
                level={viewingCertificate.levelName}
                score={viewingCertificate.score}
                date={formatDate(viewingCertificate.completedAt)}
                certificateId={generateCertificateId(user.uid, viewingCertificate.levelName)}
              />
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setViewingCertificate(null);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(viewingCertificate)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                <Download size={18} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
