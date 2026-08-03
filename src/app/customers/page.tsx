'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { getCustomers } from '@/lib/actions/customers';
import { cacheRead, getCachedRead } from '@/lib/offline/queue';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type CustomerData = NonNullable<Awaited<ReturnType<typeof getCustomers>>['data']>;

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const result = await getCustomers(searchTerm);
      if (result.error) {
        setError(result.error);
      } else {
        const data = result.data ?? [];
        setCustomers(data);
        if (!searchTerm) cacheRead('customers', data);
      }
    } catch {
      // offline — keep last-seen data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get('search') ?? '';
    setSearch(initialSearch);
    if (!initialSearch) {
      getCachedRead<CustomerData>('customers').then((cached) => {
        if (cached && cached.length > 0) setCustomers(cached);
      });
    }
    fetchData(initialSearch || undefined);
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get('search') as string) || '';
    setSearch(q);
    fetchData(q || undefined);
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    window.history.replaceState(null, '', `/customers?${params.toString()}`);
  };

  const tableData = customers.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    phone: c.phone,
    email: c.email || '-',
    totalSpent: Number(c.totalSpent),
    loyaltyPoints: c.loyaltyPoints,
    status: c.isActive ? 'ACTIVE' : 'INACTIVE',
  }));

  if (error) {
    return (
      <div className="flex flex-col">
        <Header title="Customers" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Customers" />
      <div className="flex-1 p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search customers..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-80"
            />
            <button
              type="submit"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Search
            </button>
          </form>
          <Link
            href="/customers/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Customer
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'phone', label: 'Phone' },
              { key: 'email', label: 'Email' },
              {
                key: 'totalSpent',
                label: 'Total Spent',
                render: (row) => formatCurrency(row.totalSpent as number),
              },
              { key: 'loyaltyPoints', label: 'Loyalty Points' },
              {
                key: 'status',
                label: 'Status',
                render: (row) => (
                  <StatusBadge status={row.status as string} />
                ),
              },
            ]}
            data={tableData}
            onRowClick={(row) => router.push(`/customers/${row.id}`)}
            emptyMessage="No customers found"
          />
        )}
      </div>
    </div>
  );
}
