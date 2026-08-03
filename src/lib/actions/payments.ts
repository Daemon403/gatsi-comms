'use server';

import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { revalidatePath, refresh } from 'next/cache';
import { createPaymentRecord, recalculateOrderPayment } from '@/lib/services/payments';

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

export async function createPayment(orderId: string, formData: FormData) {
  try {
    const payment = await createPaymentRecord({
      id: crypto.randomUUID(),
      orderId,
      amount: parseFloat(formData.get('amount') as string),
      method: formData.get('method') as string,
      reference: (formData.get('reference') as string) || null,
      notes: (formData.get('notes') as string) || null,
    });

    revalidatePath('/');
    refresh();

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
    revalidatePath('/');
    refresh();

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete payment' };
  }
}
