import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth';
import { formatCurrency } from '@/lib/payment';

const db = dbService;

function generateInvoicePDF(invoice: any): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusColor: Record<string, string> = {
    paid: '#10b981',
    unpaid: '#f59e0b',
    overdue: '#ef4444',
    cancelled: '#6b7280',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
    .invoice-title { font-size: 32px; color: #333; }
    .status { color: ${statusColor}; font-weight: bold; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
    .info-section h3 { font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; }
    .info-section p { margin-bottom: 4px; }
    .divider { border-top: 2px solid #e5e7eb; margin: 20px 0; }
    .billing-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .billing-table th, .billing-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .billing-table th { background: #f9fafb; font-weight: 600; }
    .total-row { display: flex; justify-content: flex-end; margin: 20px 0; }
    .total-box { background: #f9fafb; padding: 20px 40px; border-radius: 8px; }
    .total-box .label { color: #666; }
    .total-box .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">IJWI-LEARN</div>
      <p>Kinyarwanda Language Learning Platform</p>
    </div>
    <div style="text-align: right;">
      <div class="invoice-title">INVOICE</div>
      <p><strong>${invoice.invoiceNumber}</strong></p>
      <p>Status: <span class="status">${invoice.status.toUpperCase()}</span></p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-section">
      <h3>Bill To</h3>
      <p><strong>${invoice.userName}</strong></p>
      <p>${invoice.userEmail}</p>
    </div>
    <div class="info-section" style="text-align: right;">
      <h3>Invoice Details</h3>
      <p><strong>Date:</strong> ${formatDate(invoice.createdAt)}</p>
      <p><strong>Billing Period:</strong></p>
      <p>${formatDate(invoice.billingPeriodStart)} - ${formatDate(invoice.billingPeriodEnd)}</p>
      ${invoice.paidAt ? `<p><strong>Paid On:</strong> ${formatDate(invoice.paidAt)}</p>` : ''}
    </div>
  </div>

  <div class="divider"></div>

  <table class="billing-table">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${invoice.levelTitle} - Monthly Subscription</strong>
          <br>
          <span style="color: #666; font-size: 14px;">Access to ${invoice.levelTitle} level content</span>
        </td>
        <td style="text-align: right;">${formatCurrency(invoice.amount, 'RWF')}</td>
      </tr>
    </tbody>
  </table>

  <div class="total-row">
    <div class="total-box">
      <div class="label">Total Due</div>
      <div class="amount">${formatCurrency(invoice.amount, 'RWF')}</div>
    </div>
  </div>

  ${invoice.transactionId ? `
  <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
    <p><strong>Transaction ID:</strong> ${invoice.transactionId}</p>
    <p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>IJWI-LEARN - Kinyarwanda Language Learning Platform</p>
    <p>Questions? Contact support@ijwi-learn.com</p>
  </div>
</body>
</html>
  `.trim();
}

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

    const html = generateInvoicePDF(invoice);
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ success: false, message: 'Failed to generate PDF' }, { status: 500 });
  }
}