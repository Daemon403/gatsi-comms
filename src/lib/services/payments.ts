import { prisma } from '@/lib/prisma';
import { notifyPaymentReceived, notifyPaymentComplete } from '@/lib/notifications';

export interface CreatePaymentInput {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  reference?: string | null;
  notes?: string | null;
}

function isUniqueError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';
}

export async function recalculateOrderPayment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });

  if (!order) return;

  const paidAmount = order.payments.reduce<number>(
    (sum: number, p: { amount: unknown }) => sum + Number(p.amount),
    0
  );

  const totalAmount = Number(order.totalAmount);
  let paymentStatus: string;

  if (paidAmount <= 0) {
    paymentStatus = 'UNPAID';
  } else if (paidAmount >= totalAmount) {
    paymentStatus = 'FULLY_PAID';
  } else if (paidAmount >= totalAmount * 0.3) {
    paymentStatus = 'DEPOSIT_PAID';
  } else {
    paymentStatus = 'PARTIALLY_PAID';
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { paidAmount, paymentStatus },
  });
}

export async function createPaymentRecord(input: CreatePaymentInput) {
  if (!input.amount || input.amount <= 0) {
    throw new Error('Valid payment amount is required');
  }

  if (!input.method) {
    throw new Error('Payment method is required');
  }

  try {
    const payment = await prisma.payment.create({
      data: {
        id: input.id,
        orderId: input.orderId,
        amount: input.amount,
        method: input.method,
        reference: input.reference || null,
        notes: input.notes || null,
      },
    });

    await recalculateOrderPayment(input.orderId);
    notifyPaymentReceived(input.orderId, input.amount, input.method);

    const updatedOrder = await prisma.order.findUnique({ where: { id: input.orderId } });
    if (updatedOrder && updatedOrder.paymentStatus === 'FULLY_PAID') {
      notifyPaymentComplete(input.orderId);
    }

    return payment;
  } catch (error) {
    if (isUniqueError(error)) {
      const existing = await prisma.payment.findUnique({ where: { id: input.id } });
      if (existing) return existing;
    }
    throw error;
  }
}
