'use client';

import { useState } from 'react';
import { X, CreditCard, Smartphone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency, convertToRWF } from '@/lib/payment';

interface PaymentModalProps {
  level: {
    id: string;
    slug: string;
    title: string;
    price: number;
  };
  invoiceId?: string;
  user: {
    uid: string;
    email: string;
    displayName: string;
  };
  onClose: () => void;
  onSuccess: () => void;
  isSubscription?: boolean;
  billingDate?: string;
  subscriptionId?: string;
}

export default function PaymentModal({ 
  level, 
  invoiceId, 
  user, 
  onClose, 
  onSuccess, 
  isSubscription = false, 
  billingDate,
  subscriptionId 
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCardPayment = async () => {
    setLoading(true);
    setError('');

    try {
      const requestBody: Record<string, unknown> = {
        amount: convertToRWF(level.price),
        currency: 'RWF',
        description: isSubscription 
          ? `Monthly Subscription for ${level.title} - IJWI-LEARN`
          : `One-time payment for ${level.title} Level - IJWI-LEARN`,
        callbackUrl: `${window.location.origin}/payment/callback`,
        reference: invoiceId || `LEVEL-${level.id}-${user.uid}-${Date.now()}`,
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName,
        },
        invoiceId,
        levelId: level.id,
        levelTitle: level.title,
        levelSlug: level.slug,
        paymentType: isSubscription ? 'subscription' : 'one_time',
      };

      if (isSubscription && billingDate) {
        const startDate = new Date();
        const endDate = new Date(billingDate);
        requestBody.account_number = invoiceId;
        requestBody.subscription_details = {
          start_date: formatDateForPesapal(startDate),
          end_date: formatDateForPesapal(endDate),
          frequency: 'MONTHLY',
        };
      }

      const response = await fetch('/api/payments/pesapal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        window.open(data.paymentUrl, '_blank');
        setSuccess(true);
        onSuccess();
      } else {
        setError(data.message || 'Payment failed');
      }
    } catch (err) {
      setError('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleMobileMoneyPayment = async () => {
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestBody: Record<string, unknown> = {
        amount: convertToRWF(level.price),
        phone: phone,
        network: 'mtn',
        reference: invoiceId || `LEVEL-${level.id}-${user.uid}-${Date.now()}`,
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName,
        },
        invoiceId,
        levelId: level.id,
        levelTitle: level.title,
        levelSlug: level.slug,
        paymentType: isSubscription ? 'subscription' : 'one_time',
        subscriptionId,
      };

      const response = await fetch('/api/payments/paypack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        onSuccess();
      } else {
        setError(data.message || 'Payment failed');
      }
    } catch (err) {
      setError('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    if (selectedMethod === 'card') {
      await handleCardPayment();
    } else {
      await handleMobileMoneyPayment();
    }
  };

  const formatDateForPesapal = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isSubscription ? 'Pay Subscription' : `Unlock ${level.title}`}
            </h2>
            {billingDate && (
              <p className="text-sm text-gray-500 mt-1">Billing Date: {billingDate}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">
                {isSubscription ? 'Monthly subscription' : level.title}
              </span>
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(level.price, 'RWF')}/mo</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Payment Method
            </label>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedMethod('card');
                  setError('');
                  setSuccess(false);
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                  selectedMethod === 'card'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <CreditCard size={24} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-gray-900">Credit/Debit Card</div>
                  <div className="text-sm text-gray-500">
                    {isSubscription ? 'Set up recurring monthly payment' : 'Visa, Mastercard'}
                  </div>
                </div>
                {selectedMethod === 'card' && (
                  <CheckCircle size={24} className="text-blue-600" />
                )}
              </button>

              <button
                onClick={() => {
                  setSelectedMethod('mtn');
                  setError('');
                  setSuccess(false);
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                  selectedMethod === 'mtn'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Smartphone size={24} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-gray-900">MTN MoMo</div>
                  <div className="text-sm text-gray-500">Mobile money payment</div>
                </div>
                {selectedMethod === 'mtn' && (
                  <CheckCircle size={24} className="text-blue-600" />
                )}
              </button>
            </div>
          </div>

          {selectedMethod === 'mtn' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MTN Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="078XXXXXXX"
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
              <span className="text-sm">Payment initiated! Check your phone or payment page.</span>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={
              loading ||
              !selectedMethod ||
              (selectedMethod === 'mtn' && !phone)
            }
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : selectedMethod === 'card' ? (
              isSubscription ? 'Set Up Recurring Payment' : 'Continue to Payment'
            ) : (
              `Pay ${formatCurrency(level.price, 'RWF')}`
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