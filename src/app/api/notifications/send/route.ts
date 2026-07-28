import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { orderId, type, channel, message } = await request.json();

    if (!orderId || !type || !channel || !message) {
      return NextResponse.json(
        { error: "orderId, type, channel, and message are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    console.log(
      `[NOTIFICATION] Sending ${type} via ${channel} for order ${order.orderNumber}: ${message}`
    );

    const notification = await prisma.notification.create({
      data: {
        orderId,
        type,
        channel,
        recipient: null,
        message,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    console.log(
      `[NOTIFICATION] Successfully sent notification ${notification.id} for order ${order.orderNumber}`
    );

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        orderId: notification.orderId,
        type: notification.type,
        channel: notification.channel,
        message: notification.message,
        sentAt: notification.sentAt,
      },
    });
  } catch (error) {
    console.error("Notification send error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
