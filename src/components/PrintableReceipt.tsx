'use client';

import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptPayment {
  method: string;
  amount: number;
  date: string;
}

interface ReceiptProps {
  orderNumber: string;
  createdAt: string;
  customer: { name: string; phone: string };
  items: ReceiptItem[];
  payments: ReceiptPayment[];
  totalAmount: number;
  paidAmount: number;
}

export default function PrintableReceipt({
  orderNumber,
  createdAt,
  customer,
  items,
  payments,
  totalAmount,
  paidAmount,
}: ReceiptProps) {
  const balance = totalAmount - paidAmount;

  return (
    <>
      <button
        onClick={() => window.print()}
        className="mb-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-brand-600 print:hidden"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
        </svg>
        Print Receipt
      </button>

      <div className="receipt-container mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg print:shadow-none print:border-0 print:p-0 print:max-w-none">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">GATSI COMMS</h1>
          <p className="text-xs text-gray-500">Textile & Dry Cleaning Services</p>
        </div>

        <div className="mb-4 rounded-xl bg-gray-50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Order #:</span>
            <span className="font-bold text-gray-900">{orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date:</span>
            <span className="text-gray-700">{formatDateTime(createdAt)}</span>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-brand-50/50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-700">Customer</p>
          <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
          <p className="text-sm text-gray-600">{customer.phone}</p>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Items</p>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 space-y-2 rounded-xl bg-gray-50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Amount:</span>
            <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount Paid:</span>
            <span className="font-semibold text-brand-700">{formatCurrency(paidAmount)}</span>
          </div>
          {balance > 0 && (
            <div className="flex justify-between border-t border-gray-200 pt-2 text-sm">
              <span className="font-semibold text-gray-700">Balance Due:</span>
              <span className="font-bold text-rose-600">{formatCurrency(balance)}</span>
            </div>
          )}
        </div>

        {payments.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Payment History</p>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
              {payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2">
                  <div>
                    <span className="text-xs text-gray-500">{formatDate(p.date)}</span>
                    <span className="mx-1 text-gray-300">|</span>
                    <span className="text-xs font-medium text-gray-700">{p.method}</span>
                  </div>
                  <span className="text-xs font-semibold text-brand-700">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">Thank you for your business</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-container,
          .receipt-container * {
            visibility: visible;
          }
          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}
