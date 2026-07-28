import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { ORDER_STATUS_LABELS } from '@/lib/types';
import type { OrderStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface CustomerInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  preferredContact: string;
}

interface OrderInfo {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  createdAt: Date;
  expectedCompletion: Date | null;
  items: { garmentType: string; service?: { name: string } | null; quantity: number }[];
  payments: { amount: number; method: string; reference: string | null; createdAt: Date }[];
}

type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_UPDATED'
  | 'ORDER_READY'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_COMPLETE';

function getChannelFromPreference(preferredContact: string): string {
  switch (preferredContact) {
    case 'EMAIL': return 'EMAIL';
    case 'WHATSAPP': return 'WHATSAPP';
    case 'SMS':
    default: return 'SMS';
  }
}

function getRecipient(customer: CustomerInfo, channel: string): string | null {
  switch (channel) {
    case 'EMAIL': return customer.email;
    case 'SMS': return customer.phone;
    case 'WHATSAPP': return customer.phone;
    default: return customer.phone;
  }
}

function buildOrderCreatedMessage(customer: CustomerInfo, order: OrderInfo): string {
  const itemList = order.items
    .map((i) => `${i.quantity}x ${i.garmentType}${i.service ? ` (${i.service.name})` : ''}`)
    .join(', ');
  const expected = order.expectedCompletion
    ? ` Expected completion: ${new Date(order.expectedCompletion).toLocaleDateString()}.`
    : '';
  return `Hi ${customer.firstName}, your order ${order.orderNumber} has been received. Items: ${itemList}. Total: ${formatCurrency(order.totalAmount)}.${expected} Thank you for choosing GATSI COMMS!`;
}

function buildStatusUpdatedMessage(customer: CustomerInfo, order: OrderInfo, newStatus: string): string {
  const label = ORDER_STATUS_LABELS[newStatus as OrderStatus] ?? newStatus;
  return `Hi ${customer.firstName}, your order ${order.orderNumber} status has been updated to: ${label}. ${newStatus === 'READY_FOR_COLLECTION' ? 'Your order is ready for collection!' : 'We will notify you when there are further updates.'} - GATSI COMMS`;
}

function buildPaymentReceivedMessage(customer: CustomerInfo, order: OrderInfo, amount: number, method: string): string {
  const balance = order.totalAmount - order.paidAmount;
  return `Hi ${customer.firstName}, payment of ${formatCurrency(amount)} (${method}) received for order ${order.orderNumber}. Balance remaining: ${formatCurrency(balance)}. Thank you! - GATSI COMMS`;
}

function buildPaymentCompleteMessage(customer: CustomerInfo, order: OrderInfo): string {
  const itemList = order.items
    .map((i) => `${i.quantity}x ${i.garmentType}`)
    .join(', ');
  const paymentSummary = order.payments
    .map((p) => `${formatCurrency(p.amount)} (${p.method})`)
    .join(', ');
  return `Hi ${customer.firstName}, your order ${order.orderNumber} is now fully paid! Total: ${formatCurrency(order.totalAmount)}. Payments: ${paymentSummary}. Items: ${itemList}. Thank you for your business! - GATSI COMMS`;
}

function buildReceiptMessage(customer: CustomerInfo, order: OrderInfo): string {
  const lines: string[] = [];
  lines.push(`--- GATSI COMMS RECEIPT ---`);
  lines.push(`Order: ${order.orderNumber}`);
  lines.push(`Customer: ${customer.firstName} ${customer.lastName}`);
  lines.push(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
  lines.push('');
  lines.push('ITEMS:');
  order.items.forEach((i) => {
    lines.push(`  ${i.quantity}x ${i.garmentType}${i.service ? ` - ${i.service.name}` : ''}`);
  });
  lines.push('');
  lines.push(`Total: ${formatCurrency(order.totalAmount)}`);
  lines.push(`Paid: ${formatCurrency(order.paidAmount)}`);
  lines.push(`Balance: ${formatCurrency(order.totalAmount - order.paidAmount)}`);
  lines.push('');
  if (order.payments.length > 0) {
    lines.push('PAYMENTS:');
    order.payments.forEach((p) => {
      lines.push(`  ${formatCurrency(p.amount)} via ${p.method}${p.reference ? ` (Ref: ${p.reference})` : ''} on ${new Date(p.createdAt).toLocaleDateString()}`);
    });
  }
  lines.push('');
  lines.push('Thank you for choosing GATSI COMMS!');
  return lines.join('\n');
}

function logNotification(type: string, channel: string, recipient: string | null, message: string) {
  console.log(`\n[NOTIFICATION] ${type} via ${channel}${recipient ? ` to ${recipient}` : ''}`);
  console.log(`[NOTIFICATION] ${message}\n`);
}

const NOTIFICATION_SUBJECTS: Record<string, string> = {
  ORDER_CREATED: 'Order Received',
  ORDER_STATUS_UPDATED: 'Order Status Update',
  ORDER_READY: 'Order Ready for Collection',
  PAYMENT_RECEIVED: 'Payment Received',
  PAYMENT_COMPLETE: 'Payment Complete',
  RECEIPT: 'Your Receipt',
};

async function sendEmail(
  recipient: string,
  subject: string,
  message: string,
  orderId: string,
  orderNumber: string
): Promise<boolean> {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: recipient,
      subject: `GATSI COMMS — ${subject}`,
      html: buildEmailHtml(orderNumber, subject, message),
    });
    return true;
  } catch (error) {
    console.error('[NOTIFICATION] Failed to send email via Resend:', error);
    return false;
  }
}

function buildEmailHtml(orderNumber: string, subject: string, message: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#059669,#10b981);padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">GATSI COMMS</h1>
          <p style="margin:4px 0 0;color:#d1fae5;font-size:13px;">Textile & Dry Cleaning Management</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Order ${orderNumber}</p>
          <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px;">${subject}</h2>
          <div style="white-space:pre-wrap;color:#334155;font-size:14px;line-height:1.6;">${message}</div>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated message from GATSI COMMS. Please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function saveNotification(
  orderId: string,
  type: string,
  channel: string,
  recipient: string | null,
  message: string,
  status: string = 'SENT'
) {
  return prisma.notification.create({
    data: {
      orderId,
      type,
      channel,
      recipient,
      message,
      status,
      sentAt: new Date(),
    },
  });
}

export async function notifyOrderCreated(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: { include: { service: true } },
      },
    });

    if (!order || !order.customer) return;

    const customer = order.customer as CustomerInfo;
    const channel = getChannelFromPreference(customer.preferredContact);
    const recipient = getRecipient(customer, channel);
    const message = buildOrderCreatedMessage(customer, order as unknown as OrderInfo);

    logNotification('ORDER_CREATED', channel, recipient, message);

    let status = 'SENT';
    if (channel === 'EMAIL' && recipient) {
      const sent = await sendEmail(recipient, NOTIFICATION_SUBJECTS.ORDER_CREATED, message, orderId, order.orderNumber);
      if (!sent) status = 'FAILED';
    } else if (channel === 'WHATSAPP' && recipient) {
      const sent = await sendWhatsAppMessage(recipient, message);
      if (!sent) status = 'FAILED';
    }

    await saveNotification(orderId, 'ORDER_CREATED', channel, recipient, message, status);
  } catch (error) {
    console.error('[NOTIFICATION] Failed to send ORDER_CREATED:', error);
  }
}

export async function notifyOrderStatusUpdated(orderId: string, newStatus: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: { include: { service: true } },
      },
    });

    if (!order || !order.customer) return;

    const customer = order.customer as CustomerInfo;
    const channel = getChannelFromPreference(customer.preferredContact);
    const recipient = getRecipient(customer, channel);
    const message = buildStatusUpdatedMessage(customer, order as unknown as OrderInfo, newStatus);

    logNotification('ORDER_STATUS_UPDATED', channel, recipient, message);

    let status = 'SENT';
    if (channel === 'EMAIL' && recipient) {
      const sent = await sendEmail(recipient, NOTIFICATION_SUBJECTS.ORDER_STATUS_UPDATED, message, orderId, order.orderNumber);
      if (!sent) status = 'FAILED';
    } else if (channel === 'WHATSAPP' && recipient) {
      const sent = await sendWhatsAppMessage(recipient, message);
      if (!sent) status = 'FAILED';
    }

    await saveNotification(orderId, 'ORDER_STATUS_UPDATED', channel, recipient, message, status);
  } catch (error) {
    console.error('[NOTIFICATION] Failed to send ORDER_STATUS_UPDATED:', error);
  }
}

export async function notifyPaymentReceived(orderId: string, amount: number, method: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: { include: { service: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order || !order.customer) return;

    const customer = order.customer as CustomerInfo;
    const channel = getChannelFromPreference(customer.preferredContact);
    const recipient = getRecipient(customer, channel);
    const message = buildPaymentReceivedMessage(customer, order as unknown as OrderInfo, amount, method);

    logNotification('PAYMENT_RECEIVED', channel, recipient, message);

    let status = 'SENT';
    if (channel === 'EMAIL' && recipient) {
      const sent = await sendEmail(recipient, NOTIFICATION_SUBJECTS.PAYMENT_RECEIVED, message, orderId, order.orderNumber);
      if (!sent) status = 'FAILED';
    } else if (channel === 'WHATSAPP' && recipient) {
      const sent = await sendWhatsAppMessage(recipient, message);
      if (!sent) status = 'FAILED';
    }

    await saveNotification(orderId, 'PAYMENT_RECEIVED', channel, recipient, message, status);
  } catch (error) {
    console.error('[NOTIFICATION] Failed to send PAYMENT_RECEIVED:', error);
  }
}

export async function notifyPaymentComplete(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: { include: { service: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order || !order.customer) return;

    const customer = order.customer as CustomerInfo;
    const channel = getChannelFromPreference(customer.preferredContact);
    const recipient = getRecipient(customer, channel);

    const statusMessage = buildPaymentCompleteMessage(customer, order as unknown as OrderInfo);
    logNotification('PAYMENT_COMPLETE', channel, recipient, statusMessage);

    let paymentStatus = 'SENT';
    if (channel === 'EMAIL' && recipient) {
      const sent = await sendEmail(recipient, NOTIFICATION_SUBJECTS.PAYMENT_COMPLETE, statusMessage, orderId, order.orderNumber);
      if (!sent) paymentStatus = 'FAILED';
    } else if (channel === 'WHATSAPP' && recipient) {
      const sent = await sendWhatsAppMessage(recipient, statusMessage);
      if (!sent) paymentStatus = 'FAILED';
    }

    await saveNotification(orderId, 'PAYMENT_COMPLETE', channel, recipient, statusMessage, paymentStatus);

    const receiptMessage = buildReceiptMessage(customer, order as unknown as OrderInfo);
    logNotification('RECEIPT', channel, recipient, receiptMessage);

    let receiptStatus = 'SENT';
    if (channel === 'EMAIL' && recipient) {
      const sent = await sendEmail(recipient, NOTIFICATION_SUBJECTS.RECEIPT, receiptMessage, orderId, order.orderNumber);
      if (!sent) receiptStatus = 'FAILED';
    } else if (channel === 'WHATSAPP' && recipient) {
      const sent = await sendWhatsAppMessage(recipient, receiptMessage);
      if (!sent) receiptStatus = 'FAILED';
    }

    await saveNotification(orderId, 'RECEIPT', channel, recipient, receiptMessage, receiptStatus);
  } catch (error) {
    console.error('[NOTIFICATION] Failed to send PAYMENT_COMPLETE:', error);
  }
}
