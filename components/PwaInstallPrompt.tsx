'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

const DISMISSAL_KEY = 'pwa-install-dismissed';
const DISMISSAL_HOURS = 1;

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const dismissed = localStorage.getItem(DISMISSAL_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const hoursSinceDismissal = Math.floor((now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60));
      if (hoursSinceDismissal < DISMISSAL_HOURS) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 1000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISSAL_KEY, new Date().toISOString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm mx-auto animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
            <Download size={28} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Install IJWI-LEARN
          </h2>

          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Install our app for a better learning experience. Access lessons, videos, and tests anytime, anywhere — even offline.
          </p>

          <div className="space-y-2 mb-6 text-left">
            {[
              'Learn anytime, anywhere',
              'Faster loading & offline support',
              'Seamless mobile experience',
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                {benefit}
              </div>
            ))}
          </div>

          <button
            onClick={handleInstall}
            className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-md transition mb-2"
          >
            Install App
          </button>

          <button
            onClick={handleDismiss}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition font-medium"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
