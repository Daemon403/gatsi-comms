'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { getOrders } from '@/lib/actions/orders';
import { getEmployees } from '@/lib/actions/employees';
import { cacheRead, getCachedRead } from '@/lib/offline/queue';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from '@/lib/types';
import type { OrderStatus } from '@/lib/types';
import { User, Clock, DollarSign, GripVertical } from 'lucide-react';

type OrderData = NonNullable<Awaited<ReturnType<typeof getOrders>>['data']>;
type EmployeeData = NonNullable<Awaited<ReturnType<typeof getEmployees>>['data']>;

export default function TaskBoardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData>([]);
  const [employees, setEmployees] = useState<EmployeeData>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState('');

  useEffect(() => {
    async function loadData() {
      getCachedRead<OrderData>('orders').then((cached) => {
        if (cached && cached.length > 0) setOrders(cached);
      });
      getCachedRead<EmployeeData>('employees').then((cached) => {
        if (cached && cached.length > 0) setEmployees(cached);
      });
      try {
        const [ordersResult, empResult] = await Promise.all([
          getOrders(),
          getEmployees(),
        ]);
        if (ordersResult.data) {
          setOrders(ordersResult.data);
          cacheRead('orders', ordersResult.data);
        }
        if (empResult.data) {
          setEmployees(empResult.data);
          cacheRead('employees', empResult.data);
        }
      } catch {
        // offline — keep last-seen data
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredOrders = filterEmployee
    ? orders.filter(o => o.employeeId === filterEmployee)
    : orders;

  const activeStatuses = ORDER_STATUS_FLOW.filter(s =>
    !['COLLECTED', 'CANCELLED'].includes(s)
  );

  const columns = activeStatuses.map(status => ({
    status,
    label: ORDER_STATUS_LABELS[status as OrderStatus] ?? status,
    orders: filteredOrders.filter(o => o.status === status),
  }));

  return (
    <div className="flex flex-col">
      <Header title="Task Board" />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All Staff</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500">
              {filteredOrders.length} order(s)
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {columns.map((col) => (
              <div key={col.status} className="flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={col.status} />
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                      {col.orders.length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-3">
                  {col.orders.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                      No orders
                    </div>
                  ) : (
                    col.orders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="cursor-pointer rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-brand-200"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-600">{order.orderNumber}</span>
                          <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.customer.firstName} {order.customer.lastName}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {order.items.slice(0, 3).map((item, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                            >
                              {item.garmentType} x{item.quantity}
                            </span>
                          ))}
                          {order.items.length > 3 && (
                            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                              +{order.items.length - 3} more
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                          <div className="flex items-center gap-1.5">
                            {order.employee ? (
                              <div className="flex items-center gap-1">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[9px] font-bold text-brand-700">
                                  {order.employee.firstName[0]}{order.employee.lastName[0]}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {order.employee.firstName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Unassigned</span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-900">
                            {formatCurrency(Number(order.totalAmount))}
                          </span>
                        </div>
                        {order.expectedCompletion && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={12} />
                            Due: {formatDate(order.expectedCompletion)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
