'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  ArrowRight,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { getCurrentEmployee } from '@/lib/actions/auth';
import { getOrders } from '@/lib/actions/orders';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

interface Employee {
  id: string;
  firstName: string;
  role: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  expectedCompletion: string | null;
  createdAt: Date;
  notes: string | null;
  customer: { firstName: string; lastName: string; phone: string };
  items: { id: string; garmentType: string; quantity: number; totalPrice: number; instructions: string | null }[];
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');

  useEffect(() => {
    async function loadData() {
      const emp = await getCurrentEmployee();
      if (!emp) {
        router.push('/employee/login');
        return;
      }
      setEmployee(emp as Employee);

      const ordersResult = await getOrders({ employeeId: emp.id });
      if (ordersResult.data) {
        setOrders(ordersResult.data as unknown as Order[]);
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 py-8">Loading...</div>
      </div>
    );
  }

  if (!employee) return null;

  const activeOrders = orders.filter(o => !['COLLECTED', 'CANCELLED'].includes(o.status));
  const completedOrders = orders.filter(o => ['COLLECTED', 'READY_FOR_COLLECTION'].includes(o.status));
  const urgentOrders = orders.filter(o => {
    if (['COLLECTED', 'CANCELLED'].includes(o.status)) return false;
    if (!o.expectedCompletion) return false;
    const due = new Date(o.expectedCompletion);
    const now = new Date();
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDue < 24 && hoursUntilDue > 0;
  });

  const filteredOrders = activeTab === 'active'
    ? activeOrders
    : activeTab === 'completed'
      ? completedOrders
      : orders;

  return (
    <div className="p-6">
      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {employee.firstName}!
        </h2>
        <p className="mt-1 text-sm text-gray-500">Here are your assigned orders</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Orders</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{activeOrders.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
              <ClipboardList size={22} className="text-brand-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="mt-1 text-3xl font-bold text-emerald-600">{completedOrders.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <CheckCircle size={22} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Due Today</p>
              <p className="mt-1 text-3xl font-bold text-amber-600">{urgentOrders.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
              <AlertCircle size={22} className="text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatCurrency(orders.reduce((sum, o) => sum + Number(o.totalAmount), 0))}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
              <Package size={22} className="text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Orders Alert */}
      {urgentOrders.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">
              {urgentOrders.length} order(s) due within 24 hours
            </h3>
          </div>
          <div className="space-y-2">
            {urgentOrders.slice(0, 3).map((order) => (
              <Link
                key={order.id}
                href={`/employee/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl border border-amber-200/50 bg-white p-3 transition-all hover:border-amber-300 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-amber-600">{order.orderNumber}</span>
                  <span className="text-sm text-gray-700">
                    {order.customer.firstName} {order.customer.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-500" />
                  <span className="text-xs text-amber-700">
                    Due: {formatDate(order.expectedCompletion!)}
                  </span>
                  <ArrowRight size={14} className="text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">My Orders</h3>
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            {(['active', 'completed', 'all'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'active' ? `Active (${activeOrders.length})` :
                 tab === 'completed' ? `Completed (${completedOrders.length})` :
                 `All (${orders.length})`}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No orders to display</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Link
                key={order.id}
                href={`/employee/orders/${order.id}`}
                className="block rounded-xl border border-gray-100 p-4 transition-all hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-brand-600">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-gray-900">
                      {order.customer.firstName} {order.customer.lastName}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{order.customer.phone}</p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {order.items.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                        >
                          <Package size={10} />
                          {item.garmentType} x{item.quantity}
                        </span>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="mt-2 text-xs text-gray-400 italic">{order.notes}</p>
                    )}
                  </div>

                  <div className="ml-4 text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(order.totalAmount))}</p>
                    {order.expectedCompletion && (
                      <p className="mt-1 text-xs text-gray-500">
                        Due: {formatDate(order.expectedCompletion)}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
