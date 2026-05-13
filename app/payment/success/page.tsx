'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Your payment has been processed successfully. You now have access to the level.
        </p>
        <div className="space-y-3">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Go to Dashboard
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}