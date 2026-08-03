'use server';

import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { revalidatePath, refresh } from 'next/cache';
import { createOrderRecord, updateOrderStatusRecord } from '@/lib/services/orders';
import type { OrderItemInput } from '@/lib/services/orders';
import type { OrderStatus } from '@/lib/types';

interface OrderFilters {
  status?: string;
  customerId?: string;
  employeeId?: string;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getOrders(filters: OrderFilters = {}) {
  try {
    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        (where.createdAt as Record<string, unknown>).lte = new Date(filters.dateTo);
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        branch: true,
        employee: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: orders, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch orders' };
  }
}

export async function getOrder(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        branch: true,
        employee: true,
        items: { include: { service: true } },
        payments: { orderBy: { createdAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      return { data: null, error: 'Order not found' };
    }

    return { data: order, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch order' };
  }
}

export async function createOrder(formData: FormData) {
  try {
    const itemsRaw = formData.get('items');
    const items: OrderItemInput[] = itemsRaw ? (JSON.parse(itemsRaw as string) as OrderItemInput[]) : [];

    const order = await createOrderRecord({
      id: crypto.randomUUID(),
      customerId: formData.get('customerId') as string,
      branchId: (formData.get('branchId') as string) || null,
      employeeId: (formData.get('employeeId') as string) || null,
      expectedCompletion: (formData.get('expectedCompletion') as string) || null,
      notes: (formData.get('notes') as string) || null,
      items,
    });

    revalidatePath('/');
    refresh();

    return { data: order, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create order' };
  }
}

export async function updateOrderStatus(id: string, status: string) {
  try {
    const order = await updateOrderStatusRecord(id, status);
    revalidatePath('/');
    refresh();

    return { data: order, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update order status' };
  }
}

export async function assignOrder(orderId: string, employeeId: string | null) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { employeeId: employeeId || null },
      include: { employee: true },
    });

    return { data: order, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to assign order' };
  }
}

export async function deleteOrder(id: string) {
  try {
    await prisma.order.delete({
      where: { id },
    });
    revalidatePath('/');
    refresh();

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete order' };
  }
}
