'use client';

import Link from 'next/link';
import { XCircle, ArrowRight, RefreshCw } from 'lucide-react';

export default function PaymentFailed() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Failed</h1>
        <p className="text-gray-600 mb-8">
          Unfortunately, your payment could not be processed. Please try again.
        </p>
        <div className="space-y-3">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Back to Dashboard
            <ArrowRight size={18} />
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}