'use client';

import Link from 'next/link';
import { Plus, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import { getInventoryItems } from '@/lib/actions/inventory';
import { formatCurrency } from '@/lib/utils';
import { Package } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = async (searchTerm?: string) => {
    setLoading(true);
    const result = await getInventoryItems(searchTerm);
    if (result.error) {
      setError(result.error);
    } else {
      setItems(result.data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get('search') ?? '';
    setSearch(initialSearch);
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
    window.history.replaceState(null, '', `/inventory?${params.toString()}`);
  };

  const allItems = items;
  const lowStockItems = allItems.filter((item) => item.quantity <= item.minQuantity);
  const totalValue = allItems.reduce((sum: number, item) => sum + item.quantity * Number(item.unitCost), 0);

  const tableData = allItems.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    minQuantity: item.minQuantity,
    unitCost: Number(item.unitCost),
    supplier: item.supplier || '-',
    isLow: item.quantity <= item.minQuantity,
  }));

  if (error) {
    return (
      <div className="flex flex-col">
        <Header title="Inventory" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Inventory" />
      <div className="flex-1 p-6">
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <StatsCard
            title="Total Items"
            value={allItems.length}
            change={0}
            icon={<Package size={22} />}
            trend="up"
          />
          <StatsCard
            title="Inventory Value"
            value={formatCurrency(totalValue)}
            change={0}
            icon={<Package size={22} />}
            trend="up"
          />
          <StatsCard
            title="Low Stock Items"
            value={lowStockItems.length}
            change={0}
            icon={<AlertTriangle size={22} />}
            trend="down"
          />
        </div>

        {lowStockItems.length > 0 && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-600" />
              <h4 className="text-sm font-semibold text-yellow-800">
                Low Stock Alert ({lowStockItems.length} item(s) below minimum)
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"
                >
                  {item.name}: {item.quantity}/{item.minQuantity} {item.unit}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search inventory..."
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
            href="/inventory/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Item
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'category', label: 'Category' },
              {
                key: 'quantity',
                label: 'Quantity',
                render: (row) => (
                  <span className={(row.isLow as boolean) ? 'font-semibold text-red-600' : 'text-gray-700'}>
                    {String(row.quantity)} {String(row.unit)}
                  </span>
                ),
              },
              { key: 'minQuantity', label: 'Min Qty' },
              {
                key: 'unitCost',
                label: 'Unit Cost',
                render: (row) => formatCurrency(row.unitCost as number),
              },
              { key: 'supplier', label: 'Supplier' },
            ]}
            data={tableData}
            emptyMessage="No inventory items found"
          />
        )}
      </div>
    </div>
  );
}
