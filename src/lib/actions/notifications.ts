'use server';

import { prisma } from '@/lib/prisma';

export async function getNotifications(orderId?: string) {
  try {
    const where: Record<string, unknown> = {};

    if (orderId) {
      where.orderId = orderId;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: { order: { include: { customer: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return { data: notifications, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch notifications' };
  }
}

export async function createNotification(
  orderId: string,
  type: string,
  channel: string,
  message: string,
  recipient?: string
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        orderId,
        type,
        channel,
        recipient: recipient || null,
        message,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    return { data: notification, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create notification' };
  }
}

export async function markAsRead(id: string) {
  try {
    const notification = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return { data: notification, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to mark notification as read' };
  }
}
