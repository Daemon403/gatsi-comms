'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { createInventoryItem } from '@/lib/actions/inventory';

const INVENTORY_CATEGORIES = [
  'Detergents',
  'Fabric',
  'Accessories',
  'Packaging',
  'Equipment',
  'Chemicals',
  'Tools',
  'Other',
];

const UNITS = ['kg', 'litres', 'pieces', 'rolls', 'meters', 'boxes', 'pairs'];

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createInventoryItem(formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/inventory');
      }
    });
  }

  return (
    <div className="flex flex-col bg-[#f8fafc]">
      <Header title="Add Inventory Item" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Item Details</h3>
            <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div>
                <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Select category</option>
                  {INVENTORY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="unit" className="mb-1 block text-sm font-medium text-gray-700">
                  Unit *
                </label>
                <select
                  id="unit"
                  name="unit"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Select unit</option>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="0"
                  defaultValue="0"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div>
                <label htmlFor="minQuantity" className="mb-1 block text-sm font-medium text-gray-700">
                  Minimum Quantity
                </label>
                <input
                  type="number"
                  id="minQuantity"
                  name="minQuantity"
                  min="0"
                  defaultValue="0"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div>
                <label htmlFor="unitCost" className="mb-1 block text-sm font-medium text-gray-700">
                  Unit Cost ($)
                </label>
                <input
                  type="number"
                  id="unitCost"
                  name="unitCost"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div>
                <label htmlFor="supplier" className="mb-1 block text-sm font-medium text-gray-700">
                  Supplier
                </label>
                <input
                  type="text"
                  id="supplier"
                  name="supplier"
                  placeholder="Optional"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-brand-600 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  'Add Item'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
