import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, network, phone, reference, callbackUrl } = body;

    const PAYPACK_CLIENT_ID = process.env.PAYPACK_CLIENT_ID;
    const PAYPACK_CLIENT_SECRET = process.env.PAYPACK_CLIENT_SECRET;
    const PAYPACK_ENV = process.env.PAYPACK_ENV || 'sandbox';

    if (!PAYPACK_CLIENT_ID || !PAYPACK_CLIENT_SECRET) {
      return NextResponse.json({
        success: false,
        message: 'PayPack not configured',
      });
    }

    const baseUrl = PAYPACK_ENV === 'live' 
      ? 'https://paypack.rw/api' 
      : 'https://paypack-staging.paypack.rw/api';

    const authResponse = await fetch(`${baseUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PAYPACK_CLIENT_ID,
        client_secret: PAYPACK_CLIENT_SECRET,
      }),
    });

    const authData = await authResponse.json();

    if (!authData.access_token) {
      return NextResponse.json({
        success: false,
        message: 'Failed to authenticate with PayPack',
      });
    }

    const checkoutResponse = await fetch(`${baseUrl}/transactions/cashin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 1000),
        network: network,
        phone: phone,
        reference: reference,
      }),
    });

    const checkoutData = await checkoutResponse.json();

    if (checkoutData.status === 'pending' || checkoutData.status === 'initiated') {
      return NextResponse.json({
        success: true,
        message: 'STK push sent. Please check your phone to confirm.',
        transactionId: checkoutData.ref,
      });
    }

    return NextResponse.json({
      success: false,
      message: checkoutData.message || 'Payment failed',
    });

  } catch (error) {
    console.error('PayPack error:', error);
    return NextResponse.json({
      success: false,
      message: 'Payment processing error',
    });
  }
}