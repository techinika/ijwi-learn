import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const reference = searchParams.get('reference');
  const orderTrackingId = searchParams.get('order_tracking_id');

  if (status === 'completed') {
    if (reference?.startsWith('INV-') || orderTrackingId) {
      return NextResponse.redirect(new URL(`/profile?payment=success&ref=${reference}`, request.url));
    }
    return NextResponse.redirect(new URL('/payment/success?ref=' + reference, request.url));
  }

  return NextResponse.redirect(new URL('/payment/failed?ref=' + reference, request.url));
}