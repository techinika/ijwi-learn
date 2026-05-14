import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth';

const db = dbService;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const invoice = await db.getInvoice(id);
    if (!invoice) {
      return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.userId !== user.uid) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch invoice' }, { status: 500 });
  }
}