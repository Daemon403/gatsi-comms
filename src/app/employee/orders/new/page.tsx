'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Package, Search } from 'lucide-react';
import { createOrder } from '@/lib/actions/orders';
import { getCustomers } from '@/lib/actions/customers';
import { getCurrentEmployee } from '@/lib/actions/auth';
import { SERVICE_CATEGORIES } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
}

interface OrderItem {
  garmentType: string;
  serviceCategory: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  instructions: string;
}

const EMPTY_ITEM: OrderItem = {
  garmentType: '',
  serviceCategory: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
  instructions: '',
};

export default function EmployeeNewOrderPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [expectedCompletion, setExpectedCompletion] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ ...EMPTY_ITEM }]);

  useEffect(() => {
    getCurrentEmployee().then((emp) => {
      if (!emp) {
        router.push('/employee/login');
      } else {
        setEmployeeId(emp.id);
      }
    });
    getCustomers().then((result) => {
      if (result.data) {
        setCustomers(result.data);
      }
    });
  }, [router]);

  const filteredCustomers = customerSearch
    ? customers.filter(c =>
        c.firstName.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.lastName.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
      )
    : customers;

  function addItem() {
    setItems([...items, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice;
    }

    setItems(updated);
  }

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError('Please select a customer');
      return;
    }

    const validItems = items.filter((item) => item.garmentType && item.unitPrice > 0);
    if (validItems.length === 0) {
      setError('Please add at least one item with a garment type and price');
      return;
    }

    const formData = new FormData();
    formData.set('customerId', selectedCustomerId);
    if (employeeId) {
      formData.set('employeeId', employeeId);
    }
    formData.set('expectedCompletion', expectedCompletion);
    formData.set('notes', notes);
    formData.set('items', JSON.stringify(validItems));

    startTransition(async () => {
      try {
        const result = await createOrder(formData);
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          router.push(`/employee/orders/${result.data.id}`);
        }
      } catch {
        setError('Failed to create order. Check that the server is running.');
      }
    });
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/employee/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">New Order Intake</h2>
              <p className="text-sm text-gray-500">Create a new order for a customer</p>
            </div>
          </div>
          <Link
            href="/employee/customers/new"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700 transition-all hover:bg-brand-100"
          >
            <Plus size={16} />
            New Customer
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">Customer *</label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 p-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedCustomerId(''); setCustomerSearch(''); }}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                {customerSearch && (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No customers found.{' '}
                        <Link href="/employee/customers/new" className="text-brand-600 hover:underline">
                          Create one
                        </Link>
                      </div>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(customer.id);
                            setCustomerSearch('');
                          }}
                          className="flex w-full items-center justify-between border-b border-gray-50 p-3 text-left transition-colors hover:bg-gray-50 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{customer.phone}</p>
                          </div>
                          <Plus size={14} className="text-gray-400" />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expected Completion */}
          <div className="mb-6">
            <label htmlFor="expectedCompletion" className="mb-1 block text-sm font-medium text-gray-700">
              Expected Completion
            </label>
            <input
              type="date"
              id="expectedCompletion"
              value={expectedCompletion}
              onChange={(e) => setExpectedCompletion(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">Order Items</h4>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50"
              >
                <Plus size={14} />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-100 bg-gray-50/80 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-brand-500" />
                      <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-rose-500 transition-colors hover:text-rose-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Garment Type *
                      </label>
                      <input
                        type="text"
                        value={item.garmentType}
                        onChange={(e) => updateItem(index, 'garmentType', e.target.value)}
                        placeholder="e.g., Suit, Dress, Shirt"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Service Category
                      </label>
                      <select
                        value={item.serviceCategory}
                        onChange={(e) => updateItem(index, 'serviceCategory', e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      >
                        <option value="">Select service</option>
                        {SERVICE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        min="1"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Unit Price ($) *
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Instructions
                      </label>
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                        placeholder="Special instructions..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="w-full rounded-xl border border-gray-100 bg-white px-3 py-2 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
              Order Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional notes..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Total & Submit */}
          <div className="mb-6 flex items-center justify-between rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50/80 to-white p-4">
            <span className="text-lg font-bold text-gray-900">Order Total</span>
            <span className="text-2xl font-bold text-brand-600">{formatCurrency(totalAmount)}</span>
          </div>

          <div className="flex items-center gap-3">
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
                'Create Order'
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
  );
}
