'use server';

import { prisma } from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/utils';
import { notifyOrderCreated, notifyOrderStatusUpdated } from '@/lib/notifications';
import { revalidatePath, refresh } from 'next/cache';
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

interface OrderItemInput {
  serviceId?: string;
  garmentType: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  instructions?: string;
}

export async function createOrder(formData: FormData) {
  try {
    const customerId = formData.get('customerId') as string;
    const branchId = (formData.get('branchId') as string) || null;
    const employeeId = (formData.get('employeeId') as string) || null;
    const expectedCompletion = (formData.get('expectedCompletion') as string) || null;
    const notes = (formData.get('notes') as string) || null;
    const itemsJson = formData.get('items') as string;

    if (!customerId) {
      return { data: null, error: 'Customer is required' };
    }

    if (!itemsJson) {
      return { data: null, error: 'Order items are required' };
    }

    const items: OrderItemInput[] = JSON.parse(itemsJson);

    if (items.length === 0) {
      return { data: null, error: 'At least one item is required' };
    }

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customer: { connect: { id: customerId } },
        expectedCompletion: expectedCompletion ? new Date(expectedCompletion) : null,
        notes,
        totalAmount,
        status: 'RECEIVED',
        ...(branchId ? { branch: { connect: { id: branchId } } } : {}),
        ...(employeeId ? { employee: { connect: { id: employeeId } } } : {}),
        items: {
          create: items.map((item) => ({
            serviceId: item.serviceId || null,
            garmentType: item.garmentType,
            description: item.description || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            instructions: item.instructions || null,
          })),
        },
        statusHistory: {
          create: {
            status: 'RECEIVED',
            notes: 'Order created',
          },
        },
      },
      include: {
        items: true,
        statusHistory: true,
      },
    });

    notifyOrderCreated(order.id);
    revalidatePath('/');
    refresh();

    return { data: order, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create order' };
  }
}

export async function updateOrderStatus(id: string, status: string) {
  try {
    const updateData: Record<string, unknown> = { status };

    if (status === 'COLLECTED') {
      updateData.collectedAt = new Date();
    }

    if (status === 'READY_FOR_COLLECTION') {
      updateData.completedAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...updateData,
        statusHistory: {
          create: {
            status,
          },
        },
      },
      include: {
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    notifyOrderStatusUpdated(id, status);
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
