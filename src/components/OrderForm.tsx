'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Package, UserPlus, Check } from 'lucide-react';
import { getCustomers } from '@/lib/actions/customers';
import { getEmployees } from '@/lib/actions/employees';
import { submitOp } from '@/lib/offline/sync';
import { SERVICE_CATEGORIES } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
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

export default function OrderForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [localCustomerIds, setLocalCustomerIds] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [expectedCompletion, setExpectedCompletion] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ ...EMPTY_ITEM }]);

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [newCustomerError, setNewCustomerError] = useState<string | null>(null);

  useEffect(() => {
    getCustomers()
      .then((result) => {
        if (result.data) setCustomers(result.data);
      })
      .catch(() => {
        /* offline — leave list as-is */
      });
    getEmployees()
      .then((result) => {
        if (result.data) setEmployees(result.data);
      })
      .catch(() => {
        /* offline — leave list as-is */
      });
  }, []);

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

  async function handleAddNewCustomer() {
    setNewCustomerError(null);
    const first = newCustomer.firstName.trim();
    const last = newCustomer.lastName.trim();
    const phone = newCustomer.phone.trim();

    if (!first || !last || !phone) {
      setNewCustomerError('First name, last name, and phone are required');
      return;
    }

    const customerId = crypto.randomUUID();
    await submitOp('customer.create', {
      id: customerId,
      firstName: first,
      lastName: last,
      phone,
      email: newCustomer.email.trim() || null,
    });

    setCustomers((prev) => [...prev, { id: customerId, firstName: first, lastName: last, phone }]);
    setLocalCustomerIds((prev) => [...prev, customerId]);
    setSelectedCustomerId(customerId);
    setNewCustomer({ firstName: '', lastName: '', phone: '', email: '' });
    setShowNewCustomer(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOfflineSaved(false);

    if (!selectedCustomerId) {
      setError('Please select a customer or add a new one');
      return;
    }

    const validItems = items.filter((item) => item.garmentType && item.unitPrice > 0);
    if (validItems.length === 0) {
      setError('Please add at least one item with a garment type and price');
      return;
    }

    const payload = {
      id: crypto.randomUUID(),
      customerId: selectedCustomerId,
      branchId: null,
      employeeId: selectedEmployeeId || null,
      expectedCompletion: expectedCompletion || null,
      notes: notes || null,
      items: validItems.map(({ garmentType, description, quantity, unitPrice, totalPrice, instructions }) => ({
        garmentType,
        description: description || null,
        quantity,
        unitPrice,
        totalPrice,
        instructions: instructions || null,
      })),
    };

    startTransition(async () => {
      try {
        const res = await submitOp('order.create', payload);
        if (res.queued) {
          setOfflineSaved(true);
          setItems([{ ...EMPTY_ITEM }]);
          setNotes('');
          setExpectedCompletion('');
        } else if (res.result?.error) {
          setError(res.result.error);
        } else if (res.result?.data) {
          router.push(`/orders/${(res.result.data as { id: string }).id}`);
        }
      } catch {
        setError('Failed to create order. Please try again.');
      }
    });
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100';

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">Create New Order</h3>
      <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {offlineSaved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <Check size={16} />
          Order saved on this device. It will sync to the server when you&apos;re back online.
        </div>
      )}

      <div className="mt-6 mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700">
              Customer *
            </label>
            <button
              type="button"
              onClick={() => setShowNewCustomer((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              <UserPlus size={13} />
              {showNewCustomer ? 'Cancel new customer' : 'New customer'}
            </button>
          </div>
          <select
            id="customer"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} - {c.phone}
              </option>
            ))}
          </select>
          {localCustomerIds.includes(selectedCustomerId) && (
            <p className="mt-1 text-xs text-amber-600">Selected customer was added on this device and is pending sync.</p>
          )}
        </div>

        {showNewCustomer && (
          <div className="sm:col-span-2 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-800">Add a new customer</p>
            {newCustomerError && (
              <p className="mb-2 text-xs text-rose-600">{newCustomerError}</p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input
                type="text"
                placeholder="First name *"
                value={newCustomer.firstName}
                onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Last name *"
                value={newCustomer.lastName}
                onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                className={inputClass}
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className={inputClass}
              />
              <input
                type="email"
                placeholder="Email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={handleAddNewCustomer}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <UserPlus size={15} />
              Add &amp; Select Customer
            </button>
          </div>
        )}

        <div>
          <label htmlFor="employee" className="mb-1 block text-sm font-medium text-gray-700">
            Assign to Staff
          </label>
          <select
            id="employee"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Unassigned</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="expectedCompletion" className="mb-1 block text-sm font-medium text-gray-700">
            Expected Completion
          </label>
          <input
            type="date"
            id="expectedCompletion"
            value={expectedCompletion}
            onChange={(e) => setExpectedCompletion(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

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
  );
}
