import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/auth";

function addHeader(doc: jsPDF, title: string) {
  doc.setFontSize(18);
  doc.text("GATSI COMMS", 14, 22);
  doc.setFontSize(10);
  doc.text("Laundry & Garment Services", 14, 28);
  doc.setFontSize(14);
  doc.text(title, 14, 38);
  doc.setDrawColor(0);
  doc.line(14, 41, 196, 41);
}

export async function POST(request: NextRequest) {
  try {
    try {
      await requireAccess("MANAGER");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const status = message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: message || "Not authenticated" }, { status });
    }

    const { reportType, dateFrom, dateTo } = await request.json();

    if (!reportType || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "reportType, dateFrom, and dateTo are required" },
        { status: 400 }
      );
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const doc = new jsPDF();

    if (reportType === "revenue") {
      addHeader(doc, `Revenue Report (${dateFrom} to ${dateTo})`);

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

      const rows = Object.entries(grouped)
        .map(([date, values]) => [
          date,
          values.revenue.toFixed(2),
          values.paid.toFixed(2),
          values.count.toString(),
        ])
        .sort((a, b) => a[0].localeCompare(b[0]));

      autoTable(doc, {
        startY: 48,
        head: [["Date", "Revenue (GHS)", "Paid (GHS)", "Orders"]],
        body: rows,
      });
    } else if (reportType === "profitability") {
      addHeader(doc, `Profitability Report (${dateFrom} to ${dateTo})`);

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
          select: {
            category: true,
            description: true,
            amount: true,
            date: true,
          },
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

      autoTable(doc, {
        startY: 48,
        head: [["Metric", "Value (GHS)"]],
        body: [
          ["Total Revenue", totalRevenue.toFixed(2)],
          ["Total Expenses", totalExpenses.toFixed(2)],
          ["Net Profit", (totalRevenue - totalExpenses).toFixed(2)],
          ["Order Count", orders.length.toString()],
        ],
      });

      const expenseRows = expenses.map((e: { date: Date; category: string; description: string; amount: unknown }) => [
        new Date(e.date).toISOString().split("T")[0],
        e.category,
        e.description,
        Number(e.amount).toFixed(2),
      ]);

      const afterTable = (doc as jsPDF & { lastAutoTable: { finalY: number } })
        .lastAutoTable.finalY;

      autoTable(doc, {
        startY: afterTable + 10,
        head: [["Date", "Category", "Description", "Amount (GHS)"]],
        body: expenseRows,
      });
    } else if (reportType === "orders") {
      addHeader(doc, `Orders Report (${dateFrom} to ${dateTo})`);

      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: from, lte: to },
        },
        include: {
          customer: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      const rows = orders.map((order: {
        orderNumber: string;
        customer: { firstName: string; lastName: string };
        status: string;
        totalAmount: unknown;
        paidAmount: unknown;
        createdAt: Date;
      }) => [
        order.orderNumber,
        `${order.customer.firstName} ${order.customer.lastName}`,
        order.status,
        Number(order.totalAmount).toFixed(2),
        Number(order.paidAmount).toFixed(2),
        new Date(order.createdAt).toISOString().split("T")[0],
      ]);

      autoTable(doc, {
        startY: 48,
        head: [
          [
            "Order #",
            "Customer",
            "Status",
            "Total (GHS)",
            "Paid (GHS)",
            "Date",
          ],
        ],
        body: rows,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid reportType. Use: revenue, profitability, or orders" },
        { status: 400 }
      );
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportType}-report-${dateFrom}-to-${dateTo}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF report" },
      { status: 500 }
    );
  }
}
