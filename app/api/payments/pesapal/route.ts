import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, description, callbackUrl, reference } = body;

    const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
    const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
    const PESAPAL_ENV = process.env.PESAPAL_ENV || 'sandbox';

    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      return NextResponse.json({
        success: false,
        message: 'Payment configuration not available',
      });
    }

    const auth = Buffer.from(`${PESAPAL_CONSUMER_KEY}:${PESAPAL_CONSUMER_SECRET}`).toString('base64');

    const tokenResponse = await fetch(
      `https://${PESAPAL_ENV === 'live' ? 'pay.pesapal.com' : 'staging.pesapal.com'}/api/Auth/RequestToken`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
          consumer_key: PESAPAL_CONSUMER_KEY,
          consumer_secret: PESAPAL_CONSUMER_SECRET,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.token) {
      return NextResponse.json({
        success: false,
        message: 'Failed to get payment token',
      });
    }

    const iframeResponse = await fetch(
      `https://${PESAPAL_ENV === 'live' ? 'pay.pesapal.com' : 'staging.pesapal.com'}/api/PostOrderXMLPay`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Authorization': `Bearer ${tokenData.token}`,
        },
        body: `
          <?xml version="1.0" encoding="utf-8"?>
          <Order>
            <OrderId>${reference}</OrderId>
            <Amount>${amount}</Amount>
            <Currency>${currency}</Currency>
            <Description>${description}</Description>
            <CallbackUrl>${callbackUrl}</CallbackUrl>
            <Branch>IJWI-LEARN</Branch>
            <Customer>
              <Email></Email>
              <PhoneNumber></PhoneNumber>
            </Customer>
          </Order>
        `,
      }
    );

    const iframeData = await iframeResponse.text();

    if (iframeData.includes('OrderURL')) {
      const urlMatch = iframeData.match(/<OrderURL>(.*?)<\/OrderURL>/);
      if (urlMatch) {
        return NextResponse.json({
          success: true,
          paymentUrl: urlMatch[1],
        });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to create payment',
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({
      success: false,
      message: 'Payment processing error',
    });
  }
}