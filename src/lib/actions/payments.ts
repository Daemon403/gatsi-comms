'use server';

import { prisma } from '@/lib/prisma';
import { notifyPaymentReceived, notifyPaymentComplete } from '@/lib/notifications';

export async function getPayments(orderId?: string) {
  try {
    const where: Record<string, unknown> = {};

    if (orderId) {
      where.orderId = orderId;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: { order: { include: { customer: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return { data: payments, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch payments' };
  }
}

async function recalculateOrderPayment(orderId: string) {
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

export async function createPayment(orderId: string, formData: FormData) {
  try {
    const amount = parseFloat(formData.get('amount') as string);
    const method = formData.get('method') as string;
    const reference = (formData.get('reference') as string) || null;
    const notes = (formData.get('notes') as string) || null;

    if (!amount || amount <= 0) {
      return { data: null, error: 'Valid payment amount is required' };
    }

    if (!method) {
      return { data: null, error: 'Payment method is required' };
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount,
        method,
        reference,
        notes,
      },
    });

    await recalculateOrderPayment(orderId);

    notifyPaymentReceived(orderId, amount, method);

    const updatedOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (updatedOrder && updatedOrder.paymentStatus === 'FULLY_PAID') {
      notifyPaymentComplete(orderId);
    }

    return { data: payment, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create payment' };
  }
}

export async function deletePayment(id: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return { error: 'Payment not found' };
    }

    const orderId = payment.orderId;

    await prisma.payment.delete({
      where: { id },
    });

    await recalculateOrderPayment(orderId);

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete payment' };
  }
}
