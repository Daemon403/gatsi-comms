'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import { getExpenses } from '@/lib/actions/expenses';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/lib/types';
import { DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = async (filters: { category?: string; dateFrom?: string; dateTo?: string }) => {
    setLoading(true);
    const result = await getExpenses(filters);
    if (result.error) {
      setError(result.error);
    } else {
      setExpenses(result.data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get('category') ?? '';
    const initialDateFrom = params.get('dateFrom') ?? '';
    const initialDateTo = params.get('dateTo') ?? '';
    setCategory(initialCategory);
    setDateFrom(initialDateFrom);
    setDateTo(initialDateTo);
    fetchData({
      category: initialCategory || undefined,
      dateFrom: initialDateFrom || undefined,
      dateTo: initialDateTo || undefined,
    });
  }, []);

  const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cat = (formData.get('category') as string) || '';
    const from = (formData.get('dateFrom') as string) || '';
    const to = (formData.get('dateTo') as string) || '';
    setCategory(cat);
    setDateFrom(from);
    setDateTo(to);
    fetchData({
      category: cat || undefined,
      dateFrom: from || undefined,
      dateTo: to || undefined,
    });
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    if (from) params.set('dateFrom', from);
    if (to) params.set('dateTo', to);
    window.history.replaceState(null, '', `/expenses?${params.toString()}`);
  };

  const allExpenses = expenses;
  const totalExpenses = allExpenses.reduce((sum: number, e: { amount: unknown }) => sum + Number(e.amount), 0);

  const tableData = allExpenses.map((e) => ({
    id: e.id,
    date: e.date,
    category: e.category,
    description: e.description,
    amount: Number(e.amount),
    employee: e.employee ? `${e.employee.firstName} ${e.employee.lastName}` : '-',
    receipt: e.receipt || '-',
  }));

  if (error) {
    return (
      <div className="flex flex-col">
        <Header title="Expenses" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Expenses" />
      <div className="flex-1 p-6">
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <StatsCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            change={0}
            icon={<DollarSign size={22} />}
            trend="down"
          />
          <StatsCard
            title="Expense Count"
            value={allExpenses.length}
            change={0}
            icon={<DollarSign size={22} />}
            trend="up"
          />
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                defaultValue={category}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
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

          <Link
            href="/expenses/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Expense
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <DataTable
            columns={[
              {
                key: 'date',
                label: 'Date',
                render: (row) => formatDate(String(row.date)),
              },
              {
                key: 'category',
                label: 'Category',
                render: (row) => (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {row.category as string}
                  </span>
                ),
              },
              { key: 'description', label: 'Description' },
              {
                key: 'amount',
                label: 'Amount',
                render: (row) => (
                  <span className="font-medium text-red-600">{formatCurrency(row.amount as number)}</span>
                ),
              },
              { key: 'employee', label: 'Employee' },
            ]}
            data={tableData}
            emptyMessage="No expenses found"
          />
        )}
      </div>
    </div>
  );
}
