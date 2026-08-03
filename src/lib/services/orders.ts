import { prisma } from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/utils';
import { notifyOrderCreated, notifyOrderStatusUpdated } from '@/lib/notifications';

export interface OrderItemInput {
  serviceId?: string;
  garmentType: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  instructions?: string;
}

export interface CreateOrderInput {
  id: string;
  customerId: string;
  branchId?: string | null;
  employeeId?: string | null;
  expectedCompletion?: string | null;
  notes?: string | null;
  items: OrderItemInput[];
}

function isUniqueError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';
}

const ORDER_WITH_HISTORY = {
  items: true,
  statusHistory: true,
} as const;

export async function createOrderRecord(input: CreateOrderInput) {
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    select: { id: true },
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  if (!input.items || input.items.length === 0) {
    throw new Error('At least one item is required');
  }

  const totalAmount = input.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const orderNumber = generateOrderNumber();

  try {
    const order = await prisma.order.create({
      data: {
        id: input.id,
        orderNumber,
        customer: { connect: { id: input.customerId } },
        expectedCompletion: input.expectedCompletion ? new Date(input.expectedCompletion) : null,
        notes: input.notes || null,
        totalAmount,
        status: 'RECEIVED',
        ...(input.branchId ? { branch: { connect: { id: input.branchId } } } : {}),
        ...(input.employeeId ? { employee: { connect: { id: input.employeeId } } } : {}),
        items: {
          create: input.items.map((item) => ({
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
          create: { status: 'RECEIVED', notes: 'Order created' },
        },
      },
      include: ORDER_WITH_HISTORY,
    });

    notifyOrderCreated(order.id);
    return order;
  } catch (error) {
    if (isUniqueError(error)) {
      const existing = await prisma.order.findUnique({
        where: { id: input.id },
        include: ORDER_WITH_HISTORY,
      });
      if (existing) return existing;
    }
    throw error;
  }
}

export async function updateOrderStatusRecord(orderId: string, status: string) {
  const updateData: Record<string, unknown> = { status };

  if (status === 'COLLECTED') {
    updateData.collectedAt = new Date();
  }

  if (status === 'READY_FOR_COLLECTION') {
    updateData.completedAt = new Date();
  }

  const latestHistory = await prisma.orderStatusHistory.findFirst({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });

  const isReplay =
    !!latestHistory &&
    latestHistory.status === status &&
    Date.now() - new Date(latestHistory.createdAt).getTime() < 60 * 1000;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      ...updateData,
      statusHistory: isReplay ? undefined : { create: { status } },
    },
    include: {
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });

  notifyOrderStatusUpdated(orderId, status);
  return order;
}
