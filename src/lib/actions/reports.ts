'use server';

import { prisma } from '@/lib/prisma';

export async function getRevenueReport(dateFrom: Date, dateTo: Date, groupBy: 'day' | 'week' | 'month') {
  try {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        status: { not: 'CANCELLED' },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
        createdAt: true,
      },
    });

    const grouped: Record<string, { revenue: number; paid: number; count: number }> = {};

    for (const order of orders) {
      let key: string;
      const date = new Date(order.createdAt);

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = startOfWeek.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, paid: 0, count: 0 };
      }

      grouped[key].revenue += Number(order.totalAmount);
      grouped[key].paid += Number(order.paidAmount);
      grouped[key].count += 1;
    }

    const data = Object.entries(grouped)
      .map(([period, values]) => ({ period, ...values }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to generate revenue report' };
  }
}

export async function getRevenueByService(dateFrom: Date, dateTo: Date) {
  try {
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: dateFrom, lte: dateTo },
          status: { not: 'CANCELLED' },
        },
      },
      select: {
        totalPrice: true,
        service: {
          select: { name: true, category: true },
        },
      },
    });

    const byService: Record<string, { revenue: number; count: number }> = {};

    for (const item of items) {
      const key = item.service?.category || 'Uncategorized';

      if (!byService[key]) {
        byService[key] = { revenue: 0, count: 0 };
      }

      byService[key].revenue += Number(item.totalPrice);
      byService[key].count += 1;
    }

    const data = Object.entries(byService)
      .map(([category, values]) => ({ category, ...values }))
      .sort((a, b) => b.revenue - a.revenue);

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to generate service revenue report' };
  }
}

export async function getProfitabilityReport(dateFrom: Date, dateTo: Date) {
  try {
    const [orders, expenses] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
          status: { not: 'CANCELLED' },
        },
        select: { totalAmount: true, paidAmount: true },
      }),
      prisma.expense.findMany({
        where: {
          date: { gte: dateFrom, lte: dateTo },
        },
        select: { amount: true },
      }),
    ]);

    const totalRevenue = orders.reduce<number>((sum: number, o: { totalAmount: unknown }) => sum + Number(o.totalAmount), 0);
    const totalCollected = orders.reduce<number>((sum: number, o: { paidAmount: unknown }) => sum + Number(o.paidAmount), 0);
    const totalExpenses = expenses.reduce<number>((sum: number, e: { amount: unknown }) => sum + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      data: {
        totalRevenue,
        totalCollected,
        totalExpenses,
        netProfit,
        orderCount: orders.length,
        expenseCount: expenses.length,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to generate profitability report' };
  }
}

export async function getOrderStats(branchId?: string) {
  try {
    const where: Record<string, unknown> = {};

    if (branchId) {
      where.branchId = branchId;
    }

    const [statusCounts, todayStart, todayOrders, inProgress, readyForCollection] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      new Date(new Date().setHours(0, 0, 0, 0)),
      prisma.order.count({
        where: {
          ...where,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.order.count({
        where: {
          ...where,
          status: { in: ['IN_PROGRESS', 'CLEANING', 'TAILORING', 'QUALITY_CHECK'] },
        },
      }),
      prisma.order.count({
        where: {
          ...where,
          status: 'READY_FOR_COLLECTION',
        },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const item of statusCounts) {
      byStatus[item.status] = item._count.id;
    }

    return {
      data: {
        byStatus,
        todayOrders,
        inProgress,
        readyForCollection,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch order stats' };
  }
}

export async function getDashboardStats(branchId?: string) {
  try {
    const where: Record<string, unknown> = {};
    if (branchId) {
      where.branchId = branchId;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      todayOrders,
      monthlyPayments,
      totalAmountResult,
      monthlyOrderCount,
      pendingPayments,
      activeCustomers,
      newCustomersThisMonth,
      statusCounts,
      revenueTrend,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          ...where,
          createdAt: { gte: todayStart },
        },
      }),
      prisma.payment.aggregate({
        where: {
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: {
          ...where,
          createdAt: { gte: monthStart },
          status: { not: 'CANCELLED' },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({
        where: {
          ...where,
          createdAt: { gte: monthStart },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.order.count({
        where: {
          ...where,
          paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.customer.count({
        where: {
          isActive: true,
          ...(branchId ? { branchId } : {}),
        },
      }),
      prisma.customer.count({
        where: {
          createdAt: { gte: monthStart },
          ...(branchId ? { branchId } : {}),
        },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.payment.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          amount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const item of statusCounts) {
      byStatus[item.status] = item._count.id;
    }

    const trend: Record<string, number> = {};
    for (const payment of revenueTrend) {
      const key = new Date(payment.createdAt).toISOString().split('T')[0];
      trend[key] = (trend[key] || 0) + Number(payment.amount);
    }

    const trendData = Object.entries(trend).map(([date, revenue]) => ({ date, revenue }));

    const monthlyRevenue = Number(monthlyPayments._sum.amount || 0);
    const totalOrderValue = Number(totalAmountResult._sum.totalAmount || 0);

    return {
      data: {
        todayOrders,
        monthlyRevenue,
        pendingPayments,
        activeCustomers,
        newThisMonth: newCustomersThisMonth,
        avgOrderValue: monthlyOrderCount > 0 ? totalOrderValue / monthlyOrderCount : 0,
        byStatus,
        revenueTrend: trendData,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' };
  }
}

export async function getOverdueOrders() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        expectedCompletion: { lt: new Date() },
        status: { notIn: ['COLLECTED', 'CANCELLED'] },
      },
      include: {
        customer: true,
        branch: true,
        items: true,
      },
      orderBy: { expectedCompletion: 'asc' },
    });

    return { data: orders, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch overdue orders' };
  }
}

export async function getTopCustomers(limit: number = 5) {
  try {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { totalSpent: 'desc' },
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        totalSpent: true,
        loyaltyPoints: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    return { data: customers, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch top customers' };
  }
}

export async function getRecentActivity(limit: number = 8) {
  try {
    const [recentOrders, recentPayments, recentStatusChanges] = await Promise.all([
      prisma.order.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          totalAmount: true,
          customer: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      prisma.payment.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          method: true,
          createdAt: true,
          order: {
            select: {
              orderNumber: true,
              customer: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),
      prisma.orderStatusHistory.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: {
          status: { in: ['READY_FOR_COLLECTION', 'COLLECTED'] },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          order: {
            select: {
              orderNumber: true,
              customer: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),
    ]);

    type Activity = {
      id: string;
      type: 'order' | 'payment' | 'completed';
      title: string;
      description: string;
      amount: number | null;
      createdAt: Date;
    };

    const activities: Activity[] = [];

    for (const order of recentOrders) {
      activities.push({
        id: order.id,
        type: 'order',
        title: 'New Order',
        description: `${order.customer.firstName} ${order.customer.lastName} - ${order.orderNumber}`,
        amount: Number(order.totalAmount),
        createdAt: order.createdAt,
      });
    }

    for (const payment of recentPayments) {
      activities.push({
        id: payment.id,
        type: 'payment',
        title: 'Payment Received',
        description: `${payment.order.customer.firstName} ${payment.order.customer.lastName} - ${payment.order.orderNumber}`,
        amount: Number(payment.amount),
        createdAt: payment.createdAt,
      });
    }

    for (const change of recentStatusChanges) {
      activities.push({
        id: `status-${change.id}`,
        type: 'completed',
        title: change.status === 'COLLECTED' ? 'Order Collected' : 'Order Ready',
        description: `${change.order.customer.firstName} ${change.order.customer.lastName} - ${change.order.orderNumber}`,
        amount: null,
        createdAt: change.createdAt,
      });
    }

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limited = activities.slice(0, limit);

    return { data: limited, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch recent activity' };
  }
}

export async function getExpenseBreakdown(dateFrom: Date, dateTo: Date) {
  try {
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: dateFrom, lte: dateTo },
      },
      select: {
        amount: true,
        category: true,
      },
    });

    const grouped: Record<string, number> = {};
    for (const expense of expenses) {
      grouped[expense.category] = (grouped[expense.category] || 0) + Number(expense.amount);
    }

    const categories = Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const total = categories.reduce((sum, d) => sum + d.amount, 0);

    return { data: { categories, total }, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch expense breakdown' };
  }
}

export async function getTopServices(dateFrom: Date, dateTo: Date, limit: number = 5) {
  try {
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: dateFrom, lte: dateTo },
          status: { not: 'CANCELLED' },
        },
      },
      select: {
        totalPrice: true,
        quantity: true,
        service: {
          select: { name: true, category: true },
        },
      },
    });

    const byService: Record<string, { name: string; category: string; revenue: number; count: number }> = {};

    for (const item of items) {
      const name = item.service?.name || 'Unknown';
      const category = item.service?.category || 'Uncategorized';
      if (!byService[name]) {
        byService[name] = { name, category, revenue: 0, count: 0 };
      }
      byService[name].revenue += Number(item.totalPrice);
      byService[name].count += item.quantity;
    }

    const data = Object.values(byService)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch top services' };
  }
}

export async function getPreviousPeriodData(dateFrom: Date, dateTo: Date) {
  try {
    const duration = dateTo.getTime() - dateFrom.getTime();
    const prevFrom = new Date(dateFrom.getTime() - duration);
    const prevTo = new Date(dateTo.getTime() - duration);

    return getProfitabilityReport(prevFrom, prevTo);
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch previous period data' };
  }
}
