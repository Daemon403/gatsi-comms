'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getEmployees } from '@/lib/actions/employees';
import { submitOp } from '@/lib/offline/sync';
import { EXPENSE_CATEGORIES } from '@/lib/types';
import type { Employee } from '@/generated/prisma/client';

export default function NewExpensePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    getEmployees()
      .then((result) => {
        if (result.data) setEmployees(result.data);
      })
      .catch(() => {
        /* offline — leave list empty */
      });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOfflineSaved(false);
    const formData = new FormData(e.currentTarget);

    const payload = {
      id: crypto.randomUUID(),
      branchId: (formData.get('branchId') as string) || null,
      employeeId: (formData.get('employeeId') as string) || null,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      date: (formData.get('date') as string) || null,
      receipt: (formData.get('receipt') as string) || null,
    };

    startTransition(async () => {
      try {
        const res = await submitOp('expense.create', payload);
        if (res.queued) {
          setOfflineSaved(true);
          e.currentTarget.reset();
        } else if (res.result?.error) {
          setError(res.result.error);
        } else {
          router.push('/expenses');
        }
      } catch {
        setError('Failed to create expense. Please try again.');
      }
    });
  }

  return (
    <div className="flex flex-col bg-[#f8fafc]">
      <Header title="Add Expense" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Expense Details</h3>
            <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            )}

            {offlineSaved && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                Expense saved on this device. It will sync to the server when you&apos;re back online.
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="mb-1 block text-sm font-medium text-gray-700">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div>
                <label htmlFor="date" className="mb-1 block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div>
                <label htmlFor="employeeId" className="mb-1 block text-sm font-medium text-gray-700">
                  Employee
                </label>
                <select
                  id="employeeId"
                  name="employeeId"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">None</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}{emp.role ? ` (${emp.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="receipt" className="mb-1 block text-sm font-medium text-gray-700">
                  Receipt #
                </label>
                <input
                  type="text"
                  id="receipt"
                  name="receipt"
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
                  'Create Expense'
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
