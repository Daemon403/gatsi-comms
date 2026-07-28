import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { reportType, dateFrom, dateTo } = await request.json();

    if (!reportType || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "reportType, dateFrom, and dateTo are required" },
        { status: 400 }
      );
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const workbook = XLSX.utils.book_new();

    if (reportType === "revenue") {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          status: { not: "CANCELLED" },
        },
        select: {
          orderNumber: true,
          totalAmount: true,
          paidAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const grouped: Record<
        string,
        { revenue: number; paid: number; count: number }
      > = {};

      for (const order of orders) {
        const key = new Date(order.createdAt).toISOString().split("T")[0];
        if (!grouped[key]) {
          grouped[key] = { revenue: 0, paid: 0, count: 0 };
        }
        grouped[key].revenue += Number(order.totalAmount);
        grouped[key].paid += Number(order.paidAmount);
        grouped[key].count += 1;
      }

      const data = Object.entries(grouped)
        .map(([date, values]) => ({
          Date: date,
          "Total Revenue": values.revenue,
          "Amount Paid": values.paid,
          "Order Count": values.count,
        }))
        .sort((a, b) => a.Date.localeCompare(b.Date));

      const sheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, sheet, "Revenue");
    } else if (reportType === "profitability") {
      const [orders, expenses] = await Promise.all([
        prisma.order.findMany({
          where: {
            createdAt: { gte: from, lte: to },
            status: { not: "CANCELLED" },
          },
          select: { totalAmount: true, paidAmount: true },
        }),
        prisma.expense.findMany({
          where: { date: { gte: from, lte: to } },
          select: { category: true, description: true, amount: true, date: true },
        }),
      ]);

      const totalRevenue = orders.reduce<number>(
        (sum: number, o: { totalAmount: unknown }) => sum + Number(o.totalAmount),
        0
      );
      const totalExpenses = expenses.reduce<number>(
        (sum: number, e: { amount: unknown }) => sum + Number(e.amount),
        0
      );

      const summaryData = [
        { Metric: "Total Revenue", Value: totalRevenue },
        { Metric: "Total Expenses", Value: totalExpenses },
        { Metric: "Net Profit", Value: totalRevenue - totalExpenses },
        { Metric: "Order Count", Value: orders.length },
      ];

      const expenseData = expenses.map(
        (e: { date: Date; category: string; description: string; amount: unknown }) => ({
          Date: new Date(e.date).toISOString().split("T")[0],
          Category: e.category,
          Description: e.description,
          Amount: Number(e.amount),
        })
      );

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      const expenseSheet = XLSX.utils.json_to_sheet(expenseData);
      XLSX.utils.book_append_sheet(workbook, expenseSheet, "Expenses");
    } else if (reportType === "orders") {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: from, lte: to },
        },
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true } },
          items: { select: { garmentType: true, totalPrice: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      const data = orders.map(
        (order: {
          orderNumber: string;
          customer: { firstName: string; lastName: string; phone: string };
          status: string;
          totalAmount: unknown;
          paidAmount: unknown;
          paymentStatus: string;
          items: { garmentType: string }[];
          createdAt: Date;
        }) => ({
          "Order Number": order.orderNumber,
          Customer: `${order.customer.firstName} ${order.customer.lastName}`,
          Phone: order.customer.phone,
          Status: order.status,
          "Total Amount": Number(order.totalAmount),
          "Paid Amount": Number(order.paidAmount),
          "Payment Status": order.paymentStatus,
          Items: order.items.map((i: { garmentType: string }) => i.garmentType).join(", "),
          Created: new Date(order.createdAt).toISOString().split("T")[0],
        })
      );

      const sheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, sheet, "Orders");
    } else {
      return NextResponse.json(
        { error: "Invalid reportType. Use: revenue, profitability, or orders" },
        { status: 400 }
      );
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${reportType}-report-${dateFrom}-to-${dateTo}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Excel export error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel report" },
      { status: 500 }
    );
  }
}
