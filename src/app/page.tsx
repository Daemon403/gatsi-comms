export const dynamic = 'force-dynamic';

import { ClipboardList, DollarSign, Clock, Users, AlertTriangle, TrendingUp, UserPlus, BarChart3, CreditCard, Package, CheckCircle2, Crown, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import StatusBadge from '@/components/StatusBadge';
import { getDashboardStats, getOverdueOrders, getTopCustomers, getRecentActivity } from '@/lib/actions/reports';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { ORDER_STATUS_LABELS } from '@/lib/types';
import type { OrderStatus } from '@/lib/types';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  CLEANING: 'bg-violet-500',
  TAILORING: 'bg-purple-500',
  QUALITY_CHECK: 'bg-orange-500',
  READY_FOR_COLLECTION: 'bg-emerald-500',
  COLLECTED: 'bg-gray-400',
  CANCELLED: 'bg-rose-500',
};

const STATUS_BG: Record<string, string> = {
  RECEIVED: 'from-blue-50 to-blue-100/50 border-blue-200',
  IN_PROGRESS: 'from-amber-50 to-amber-100/50 border-amber-200',
  CLEANING: 'from-violet-50 to-violet-100/50 border-violet-200',
  TAILORING: 'from-purple-50 to-purple-100/50 border-purple-200',
  QUALITY_CHECK: 'from-orange-50 to-orange-100/50 border-orange-200',
  READY_FOR_COLLECTION: 'from-emerald-50 to-emerald-100/50 border-emerald-200',
  COLLECTED: 'from-gray-50 to-gray-100/50 border-gray-200',
  CANCELLED: 'from-rose-50 to-rose-100/50 border-rose-200',
};

const STATUS_BAR_COLORS: Record<string, string> = {
  RECEIVED: 'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  CLEANING: 'bg-violet-500',
  TAILORING: 'bg-purple-500',
  QUALITY_CHECK: 'bg-orange-500',
  READY_FOR_COLLECTION: 'bg-emerald-500',
  COLLECTED: 'bg-gray-400',
  CANCELLED: 'bg-rose-500',
};

function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

const ACTIVITY_ICONS: Record<string, { icon: React.ReactNode; bg: string }> = {
  order: {
    icon: <ClipboardList size={16} />,
    bg: 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700',
  },
  payment: {
    icon: <DollarSign size={16} />,
    bg: 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700',
  },
  completed: {
    icon: <CheckCircle2 size={16} />,
    bg: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700',
  },
};

export default async function DashboardPage() {
  const [statsResult, overdueResult, topCustomersResult, recentActivityResult] = await Promise.all([
    getDashboardStats(),
    getOverdueOrders(),
    getTopCustomers(5),
    getRecentActivity(8),
  ]);

  const stats = statsResult.data;
  const overdueOrders = overdueResult.data ?? [];
  const topCustomers = topCustomersResult.data ?? [];
  const recentActivity = recentActivityResult.data ?? [];

  const statusEntries = stats
    ? Object.entries(stats.byStatus).sort((a, b) => b[1] - a[1])
    : [];

  const totalOrders = statusEntries.reduce((sum, [, count]) => sum + count, 0);

  const maxRevenue = stats
    ? Math.max(...stats.revenueTrend.map((d) => d.revenue), 1)
    : 1;

  return (
    <div className="flex flex-col">
      <Header title="Dashboard" />

      <div className="flex-1 p-6">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatsCard
            title="Today's Orders"
            value={stats?.todayOrders ?? 0}
            change={0}
            icon={<ClipboardList size={22} />}
            trend="up"
            color="brand"
          />
          <StatsCard
            title="Monthly Revenue"
            value={formatCurrency(stats?.monthlyRevenue ?? 0)}
            change={0}
            icon={<DollarSign size={22} />}
            trend="up"
            color="accent"
          />
          <StatsCard
            title="Pending Payments"
            value={stats?.pendingPayments ?? 0}
            change={0}
            icon={<Clock size={22} />}
            trend="down"
            color="rose"
          />
          <StatsCard
            title="Active Customers"
            value={stats?.activeCustomers ?? 0}
            change={0}
            icon={<Users size={22} />}
            trend="up"
            color="blue"
          />
          <StatsCard
            title="New This Month"
            value={stats?.newThisMonth ?? 0}
            change={0}
            icon={<UserPlus size={22} />}
            trend="up"
            color="violet"
          />
          <StatsCard
            title="Avg Order Value"
            value={formatCurrency(stats?.avgOrderValue ?? 0)}
            change={0}
            icon={<BarChart3 size={22} />}
            trend="up"
            color="teal"
          />
        </div>

        {/* Revenue Trend + Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Revenue Trend (30 days)</h3>
                <p className="mt-0.5 text-sm text-gray-500">Daily collected revenue</p>
              </div>
            </div>
            <div className="flex h-56 items-end gap-1">
              {stats?.revenueTrend.map((d) => (
                <div
                  key={d.date}
                  className="group/bar relative flex flex-1 flex-col items-center gap-1"
                >
                  <div className="absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg group-hover/bar:block">
                    {formatDate(d.date)}: {formatCurrency(d.revenue)}
                  </div>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-300 transition-all duration-200 hover:from-brand-700 hover:to-brand-400"
                    style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: d.revenue > 0 ? '4px' : '0' }}
                  />
                </div>
              ))}
              {(!stats?.revenueTrend || stats.revenueTrend.length === 0) && (
                <p className="w-full pb-16 text-center text-sm text-gray-500">No revenue data yet</p>
              )}
            </div>
            <div className="mt-3 flex justify-between text-xs text-gray-400">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                <p className="mt-0.5 text-sm text-gray-500">Common tasks</p>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/orders/new"
                className="flex items-center gap-3 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-brand-100/50 p-3.5 transition-all hover:scale-[1.01] hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25">
                  <ClipboardList size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">New Order</p>
                  <p className="text-xs text-gray-500">Create a new job card</p>
                </div>
              </Link>
              <Link
                href="/customers/new"
                className="flex items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/50 p-3.5 transition-all hover:scale-[1.01] hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Add Customer</p>
                  <p className="text-xs text-gray-500">Register new customer</p>
                </div>
              </Link>
              <Link
                href="/reports"
                className="flex items-center gap-3 rounded-xl border border-accent-200 bg-gradient-to-r from-accent-50 to-accent-100/50 p-3.5 transition-all hover:scale-[1.01] hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-md shadow-accent-500/25">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">View Reports</p>
                  <p className="text-xs text-gray-500">Financial analytics</p>
                </div>
              </Link>
              <Link
                href="/expenses/new"
                className="flex items-center gap-3 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100/50 p-3.5 transition-all hover:scale-[1.01] hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/25">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Record Expense</p>
                  <p className="text-xs text-gray-500">Log a new expense</p>
                </div>
              </Link>
              <Link
                href="/inventory"
                className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-3.5 transition-all hover:scale-[1.01] hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25">
                  <Package size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Check Inventory</p>
                  <p className="text-xs text-gray-500">View stock levels</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Orders by Status with Progress Bars */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Orders by Status</h3>
              <p className="mt-0.5 text-sm text-gray-500">Current order distribution ({totalOrders} total)</p>
            </div>
            <Link
              href="/orders"
              className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statusEntries.map(([status, count]) => {
              const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
              return (
                <div
                  key={status}
                  className={`rounded-xl border bg-gradient-to-br p-4 transition-all hover:scale-[1.02] ${STATUS_BG[status] ?? 'from-gray-50 to-gray-100/50 border-gray-200'}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-400'} shadow-sm`} />
                      <p className="text-[11px] font-medium text-gray-500">
                        {ORDER_STATUS_LABELS[status as OrderStatus] ?? status}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${STATUS_BAR_COLORS[status] ?? 'bg-gray-400'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-right text-[10px] font-medium text-gray-400">{percentage.toFixed(1)}%</p>
                </div>
              );
            })}
            {statusEntries.length === 0 && (
              <p className="col-span-4 py-8 text-center text-sm text-gray-500">No orders yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity + Top Customers */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <p className="mt-0.5 text-sm text-gray-500">Latest actions across the system</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {recentActivity.map((activity) => {
                const iconStyle = ACTIVITY_ICONS[activity.type] ?? ACTIVITY_ICONS.order;
                return (
                  <div key={activity.id} className="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3 transition-colors hover:bg-gray-100/80">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconStyle.bg}`}>
                      {iconStyle.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                      <p className="truncate text-xs text-gray-500">{activity.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {activity.amount !== null && (
                        <p className={`text-sm font-bold ${activity.type === 'payment' ? 'text-emerald-700' : 'text-gray-900'}`}>
                          {formatCurrency(activity.amount)}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400">{getRelativeTime(activity.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              {recentActivity.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Top Customers</h3>
                <p className="mt-0.5 text-sm text-gray-500">Highest spending customers</p>
              </div>
              <Link
                href="/customers"
                className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2.5">
              {topCustomers.map((customer, i) => (
                <div key={customer.id} className="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3 transition-colors hover:bg-gray-100/80">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm ${
                    i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                    i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                    i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500' :
                    'bg-gradient-to-br from-gray-200 to-gray-400'
                  }`}>
                    {i < 3 ? <Crown size={16} /> : <span className="text-xs">{i + 1}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{customer.firstName} {customer.lastName}</p>
                    <p className="text-xs text-gray-500">{customer._count.orders} orders &middot; {customer.loyaltyPoints} pts</p>
                  </div>
                  <p className="text-sm font-bold text-brand-700 shrink-0">{formatCurrency(customer.totalSpent)}</p>
                </div>
              ))}
              {topCustomers.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">No customers yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Orders */}
        {overdueOrders.length > 0 && (
          <div className="animate-fade-in overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100/30">
            <div className="border-b border-rose-200/60 bg-white/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                    <AlertTriangle size={18} className="text-rose-600" />
                  </div>
                  <h3 className="text-lg font-bold text-rose-800">
                    Overdue Orders ({overdueOrders.length})
                  </h3>
                </div>
                <Link
                  href="/orders?status=OVERDUE"
                  className="text-sm font-semibold text-rose-600 transition-colors hover:text-rose-800"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto bg-white/40">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-rose-200/60 text-left text-xs font-semibold uppercase text-rose-600">
                    <th className="px-6 py-3">Order #</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Expected</th>
                    <th className="px-6 py-3">Days Late</th>
                    <th className="px-6 py-3">Items</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  {overdueOrders.map((order) => {
                    const daysOverdue = order.expectedCompletion
                      ? Math.floor((Date.now() - new Date(order.expectedCompletion).getTime()) / 86400000)
                      : 0;
                    return (
                      <tr key={order.id} className="transition-colors hover:bg-rose-50/50">
                        <td className="px-6 py-3">
                          <Link href={`/orders/${order.id}`} className="font-semibold text-rose-700 hover:text-rose-900 hover:underline">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-3 font-medium text-rose-700">
                          {order.customer.firstName} {order.customer.lastName}
                        </td>
                        <td className="px-6 py-3 text-rose-600">
                          {order.customer.phone}
                        </td>
                        <td className="px-6 py-3 text-rose-600">
                          {order.expectedCompletion ? formatDate(order.expectedCompletion) : 'N/A'}
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            <Calendar size={10} />
                            {daysOverdue}d
                          </span>
                        </td>
                        <td className="px-6 py-3 text-rose-600">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-rose-700">
                          {formatCurrency(Number(order.totalAmount))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
