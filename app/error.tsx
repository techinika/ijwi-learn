'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
        <p className="text-gray-600 mb-8">
          An unexpected error occurred. Please try again or return to the home page.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}