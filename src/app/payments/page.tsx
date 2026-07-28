'use client';

import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { getPayments } from '@/lib/actions/payments';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import StatsCard from '@/components/StatsCard';
import { DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PaymentsPage() {
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDateFrom(params.get('dateFrom') ?? '');
    setDateTo(params.get('dateTo') ?? '');

    getPayments().then((result) => {
      if (result.error) {
        setError(result.error);
      } else {
        setAllPayments(result.data ?? []);
      }
      setLoading(false);
    });
  }, []);

  let filteredPayments = allPayments;
  if (dateFrom) {
    const from = new Date(dateFrom);
    filteredPayments = filteredPayments.filter((p) => new Date(p.createdAt) >= from);
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    filteredPayments = filteredPayments.filter((p) => new Date(p.createdAt) <= to);
  }

  const totalPayments = filteredPayments.reduce((sum: number, p) => sum + Number(p.amount), 0);

  const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const from = (formData.get('dateFrom') as string) || '';
    const to = (formData.get('dateTo') as string) || '';
    setDateFrom(from);
    setDateTo(to);
    const params = new URLSearchParams();
    if (from) params.set('dateFrom', from);
    if (to) params.set('dateTo', to);
    window.history.replaceState(null, '', `/payments?${params.toString()}`);
  };

  const tableData = filteredPayments.map((p) => ({
    id: p.id,
    createdAt: p.createdAt,
    orderNumber: p.order.orderNumber,
    customer: `${p.order.customer.firstName} ${p.order.customer.lastName}`,
    amount: Number(p.amount),
    method: p.method,
    reference: p.reference || '-',
  }));

  if (error) {
    return (
      <div className="flex flex-col">
        <Header title="Payments" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Payments" />
      <div className="flex-1 p-6">
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <StatsCard
            title="Total Payments"
            value={formatCurrency(totalPayments)}
            change={0}
            icon={<DollarSign size={22} />}
            trend="up"
          />
          <StatsCard
            title="Payment Count"
            value={filteredPayments.length}
            change={0}
            icon={<DollarSign size={22} />}
            trend="up"
          />
          <StatsCard
            title="Avg Payment"
            value={filteredPayments.length > 0 ? formatCurrency(totalPayments / filteredPayments.length) : formatCurrency(0)}
            change={0}
            icon={<DollarSign size={22} />}
            trend="up"
          />
        </div>

        <div className="mb-6">
          <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="dateFrom" className="mb-1 block text-sm font-medium text-gray-700">
                From
              </label>
              <input
                type="date"
                id="dateFrom"
                name="dateFrom"
                defaultValue={dateFrom}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="mb-1 block text-sm font-medium text-gray-700">
                To
              </label>
              <input
                type="date"
                id="dateTo"
                name="dateTo"
                defaultValue={dateTo}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Filter
            </button>
          </form>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <DataTable
            columns={[
              {
                key: 'createdAt',
                label: 'Date',
                render: (row) => formatDateTime(String(row.createdAt)),
              },
              { key: 'orderNumber', label: 'Order #' },
              { key: 'customer', label: 'Customer' },
              {
                key: 'amount',
                label: 'Amount',
                render: (row) => (
                  <span className="font-medium text-green-600">{formatCurrency(row.amount as number)}</span>
                ),
              },
              {
                key: 'method',
                label: 'Method',
                render: (row) => (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {(String(row.method)).replace(/_/g, ' ')}
                  </span>
                ),
              },
              { key: 'reference', label: 'Reference' },
            ]}
            data={tableData}
            emptyMessage="No payments found"
          />
        )}
      </div>
    </div>
  );
}
