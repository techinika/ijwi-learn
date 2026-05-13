'use client';

import { useState } from 'react';
import { X, CreditCard, Smartphone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { initiatePayment, formatCurrency, paymentMethods } from '@/lib/payment';

interface PaymentModalProps {
  level: {
    id: number;
    title: string;
    price: number;
  };
  userId: string;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ level, userId, userEmail, onClose, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    if ((selectedMethod === 'mtn' || selectedMethod === 'airtel') && !phone) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    const result = await initiatePayment(
      {
        amount: level.price,
        currency: 'USD',
        levelId: level.id,
        levelName: level.title,
        userId,
        userEmail,
      },
      selectedMethod
    );

    setLoading(false);

    if (result.success) {
      if (selectedMethod === 'pesapal') {
        setSuccess(true);
        onSuccess();
      } else {
        setSuccess(true);
        onSuccess();
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Unlock {level.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Monthly subscription</span>
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(level.price)}/mo</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Payment Method
            </label>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    method.type === 'card' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {method.type === 'card' ? <CreditCard size={24} /> : <Smartphone size={24} />}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900">{method.name}</div>
                    <div className="text-sm text-gray-500">
                      {method.type === 'card' ? 'Visa, Mastercard' : 'Instant payment'}
                    </div>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle size={24} className="text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {(selectedMethod === 'mtn' || selectedMethod === 'airtel') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedMethod === 'mtn' ? 'MTN' : 'Airtel'} Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={selectedMethod === 'mtn' ? '078XXXXXXX' : '072XXXXXXX'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
              <p className="text-sm text-gray-500 mt-2">
                You will receive an STK push on your phone
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl mb-4">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-600 rounded-xl mb-4">
              <CheckCircle size={20} />
              <span className="text-sm">Payment initiated! Redirecting...</span>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading || !selectedMethod}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${formatCurrency(level.price)}`
            )}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Secured by Pesapal & PayPack
          </p>
        </div>
      </div>
    </div>
  );
}