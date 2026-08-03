'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { getOrders } from '@/lib/actions/orders';
import { cacheRead, getCachedRead } from '@/lib/offline/queue';
import { formatCurrency, formatDate } from '@/lib/utils';

type OrderData = NonNullable<Awaited<ReturnType<typeof getOrders>>['data']>;
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'TAILORING', label: 'Tailoring' },
  { value: 'QUALITY_CHECK', label: 'QC' },
  { value: 'READY_FOR_COLLECTION', label: 'Ready' },
  { value: 'COLLECTED', label: 'Collected' },
];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async (status?: string) => {
    setLoading(true);
    try {
      const result = await getOrders({ status: status || undefined });
      if (result.error) {
        setError(result.error);
      } else {
        const data = result.data ?? [];
        setOrders(data);
        if (!status) cacheRead('orders', data);
      }
    } catch {
      // offline — keep last-seen data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialStatus = params.get('status') ?? '';
    setStatusFilter(initialStatus);
    if (!initialStatus) {
      getCachedRead<OrderData>('orders').then((cached) => {
        if (cached && cached.length > 0) setOrders(cached);
      });
    }
    fetchData(initialStatus || undefined);
  }, []);

  const handleFilter = (value: string) => {
    setStatusFilter(value);
    fetchData(value || undefined);
    const params = new URLSearchParams();
    if (value) params.set('status', value);
    window.history.replaceState(null, '', `/orders?${params.toString()}`);
  };

  const tableData = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customer: `${o.customer.firstName} ${o.customer.lastName}`,
    items: o.items.length,
    status: o.status,
    totalAmount: Number(o.totalAmount),
    paidAmount: Number(o.paidAmount),
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
  }));

  if (error) {
    return (
      <div className="flex flex-col">
        <Header title="Orders" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Orders" />
      <div className="flex-1 p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  (statusFilter ?? '') === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={18} />
            New Order
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <DataTable
            columns={[
              { key: 'orderNumber', label: 'Order #' },
              { key: 'customer', label: 'Customer' },
              { key: 'items', label: 'Items', render: (row) => `${row.items} item(s)` },
              {
                key: 'status',
                label: 'Status',
                render: (row) => <StatusBadge status={row.status as string} />,
              },
              {
                key: 'totalAmount',
                label: 'Total',
                render: (row) => formatCurrency(row.totalAmount as number),
              },
              {
                key: 'paymentStatus',
                label: 'Paid',
                render: (row) => (
                  <StatusBadge status={row.paymentStatus as string} />
                ),
              },
              {
                key: 'createdAt',
                label: 'Date',
                render: (row) => formatDate(String(row.createdAt)),
              },
            ]}
            data={tableData}
            onRowClick={(row) => router.push(`/orders/${row.id}`)}
            emptyMessage="No orders found"
          />
        )}
      </div>
    </div>
  );
}
