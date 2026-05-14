import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth';

const db = dbService;

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const invoices = await db.getInvoices({ userId: user.uid });
    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch invoices' }, { status: 500 });
  }
}