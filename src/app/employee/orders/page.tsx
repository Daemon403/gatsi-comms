'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Package, Clock, ArrowRight } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { getCurrentEmployee } from '@/lib/actions/auth';
import { getOrders } from '@/lib/actions/orders';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  expectedCompletion: string | null;
  createdAt: Date;
  customer: { firstName: string; lastName: string; phone: string };
  items: { id: string; garmentType: string; quantity: number }[];
}

export default function EmployeeOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    async function loadData() {
      const emp = await getCurrentEmployee();
      if (!emp) {
        router.push('/employee/login');
        return;
      }

      const ordersResult = await getOrders({ employeeId: emp.id });
      if (ordersResult.data) {
        setOrders(ordersResult.data as unknown as Order[]);
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  const filteredOrders = filter === 'active'
    ? orders.filter(o => !['COLLECTED', 'CANCELLED'].includes(o.status))
    : filter === 'completed'
      ? orders.filter(o => ['COLLECTED', 'READY_FOR_COLLECTION'].includes(o.status))
      : orders;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
          <p className="mt-1 text-sm text-gray-500">All orders assigned to you</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {(['all', 'active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                filter === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab} ({tab === 'all' ? orders.length : tab === 'active'
                ? orders.filter(o => !['COLLECTED', 'CANCELLED'].includes(o.status)).length
                : orders.filter(o => ['COLLECTED', 'READY_FOR_COLLECTION'].includes(o.status)).length})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
          <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              href={`/employee/orders/${order.id}`}
              className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-brand-600">{order.orderNumber}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{order.customer.phone}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
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
                </div>

                <div className="ml-4 flex flex-col items-end gap-2">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(order.totalAmount))}</p>
                  {order.expectedCompletion && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      Due: {formatDate(order.expectedCompletion)}
                    </div>
                  )}
                  <ArrowRight size={16} className="text-gray-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
