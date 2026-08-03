'use client';

import { useState, useTransition } from 'react';
import { submitOp } from '@/lib/offline/sync';
import { formatCurrency } from '@/lib/utils';

interface PaymentFormProps {
  orderId: string;
  remainingBalance: number;
  onPaymentSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Card' },
];

export default function PaymentForm({ orderId, remainingBalance, onPaymentSuccess }: PaymentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Payment recorded successfully!');
  const [amount, setAmount] = useState(remainingBalance > 0 ? remainingBalance.toString() : '');
  const [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const res = await submitOp('payment.create', {
        id: crypto.randomUUID(),
        orderId,
        amount: parseFloat(amount),
        method,
        reference,
        notes,
      });

      if (res.queued) {
        setSuccess(true);
        setSuccessMessage('Payment saved on this device. It will sync when you are back online.');
        setAmount('');
        setReference('');
        setNotes('');
        setTimeout(() => setSuccess(false), 4000);
        return;
      }

      if (res.result?.error) {
        setError(res.result.error);
      } else {
        setSuccess(true);
        setSuccessMessage('Payment recorded successfully!');
        setAmount('');
        setReference('');
        setNotes('');
        onPaymentSuccess?.();
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          {successMessage}
        </div>
      )}

      <div>
        <label htmlFor="pay-amount" className="mb-1 block text-xs font-medium text-gray-500">
          Amount ($)
        </label>
        <input
          type="number"
          id="pay-amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          required
          placeholder="0.00"
          className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
        {remainingBalance > 0 && (
          <button
            type="button"
            onClick={() => setAmount(remainingBalance.toString())}
            className="mt-1 text-xs text-brand-600 hover:text-brand-700 hover:underline"
          >
            Pay full balance ({formatCurrency(remainingBalance)})
          </button>
        )}
      </div>

      <div>
        <label htmlFor="pay-method" className="mb-1 block text-xs font-medium text-gray-500">
          Method
        </label>
        <select
          id="pay-method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          required
          className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="pay-reference" className="mb-1 block text-xs font-medium text-gray-500">
          Reference
        </label>
        <input
          type="text"
          id="pay-reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label htmlFor="pay-notes" className="mb-1 block text-xs font-medium text-gray-500">
          Notes
        </label>
        <input
          type="text"
          id="pay-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || remainingBalance <= 0}
        className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-brand-600 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing...
          </span>
        ) : (
          'Record Payment'
        )}
      </button>
    </form>
  );
}
