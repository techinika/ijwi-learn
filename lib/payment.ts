export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'mobile_money';
  icon: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  levelId: number;
  levelName: string;
  userId: string;
  userEmail: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message: string;
}

export const paymentMethods: PaymentMethod[] = [
  { id: 'pesapal', name: 'Credit/Debit Card', type: 'card', icon: 'credit-card' },
  { id: 'mtn', name: 'MTN MoMo', type: 'mobile_money', icon: 'smartphone' },
  { id: 'airtel', name: 'Airtel Money', type: 'mobile_money', icon: 'smartphone' },
];

export async function initiatePayment(request: PaymentRequest, method: string): Promise<PaymentResult> {
  console.log(`Initiating payment via ${method} for level ${request.levelId}`);
  
  switch (method) {
    case 'pesapal':
      return await processPesapalPayment(request);
    case 'mtn':
    case 'airtel':
      return await processPaypackPayment(request, method);
    default:
      return { success: false, message: 'Invalid payment method' };
  }
}

async function processPesapalPayment(request: PaymentRequest): Promise<PaymentResult> {
  try {
    const response = await fetch('/api/payments/pesapal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        description: `Unlock ${request.levelName} Level - IJWI-LEARN`,
        callbackUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/callback`,
        reference: `LEVEL-${request.levelId}-${request.userId}-${Date.now()}`,
      }),
    });

    const data = await response.json();
    
    if (data.success && data.paymentUrl) {
      window.location.href = data.paymentUrl;
      return { success: true, message: 'Redirecting to payment...' };
    }
    
    return { success: false, message: data.message || 'Payment failed' };
  } catch (error) {
    console.error('Pesapal payment error:', error);
    return { success: false, message: 'Failed to initiate payment' };
  }
}

async function processPaypackPayment(request: PaymentRequest, network: string): Promise<PaymentResult> {
  try {
    const response = await fetch('/api/payments/paypack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: request.amount,
        network: network === 'mtn' ? 'mtn' : 'airtel',
        phone: '',
        reference: `LEVEL-${request.levelId}-${request.userId}-${Date.now()}`,
        callbackUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/callback`,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      return { 
        success: true, 
        message: `STK push sent to your ${network === 'mtn' ? 'MTN' : 'Airtel'} number. Please check and confirm.`,
        transactionId: data.transactionId 
      };
    }
    
    return { success: false, message: data.message || 'Payment failed' };
  } catch (error) {
    console.error('Paypack payment error:', error);
    return { success: false, message: 'Failed to initiate payment' };
  }
}

export async function verifyPayment(transactionId: string): Promise<PaymentResult> {
  try {
    const response = await fetch(`/api/payments/verify?transactionId=${transactionId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to verify payment' };
  }
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}