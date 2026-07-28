'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import StatusUpdateButtons from './StatusUpdateButtons';
import OrderEmployeeSection from './OrderEmployeeSection';
import PaymentForm from '@/components/PaymentForm';
import { useOrderPolling } from '@/hooks/useOrderPolling';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { ORDER_STATUS_FLOW } from '@/lib/types';

interface OrderDetailClientProps {
  orderId: string;
}

export default function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const { order, loading, error, refresh } = useOrderPolling(orderId);

  if (loading) {
    return (
      <div className="flex flex-col bg-[#f8fafc]">
        <Header title="Order Details" />
        <div className="flex-1 p-6">
          <div className="text-center text-gray-500 py-8">Loading order...</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col bg-[#f8fafc]">
        <Header title="Order Not Found" />
        <div className="flex-1 p-6">
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-4">{error || 'Order not found'}</p>
            <Link href="/orders" className="text-brand-600 hover:text-brand-700 underline text-sm">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const paidAmount = Number(order.paidAmount);
  const totalAmount = Number(order.totalAmount);
  const balance = totalAmount - paidAmount;

  const statusIndex = ORDER_STATUS_FLOW.indexOf(order.status as typeof ORDER_STATUS_FLOW[number]);
  const nextStatus = statusIndex >= 0 && statusIndex < ORDER_STATUS_FLOW.length - 1
    ? ORDER_STATUS_FLOW[statusIndex + 1]
    : null;

  return (
    <div className="flex flex-col bg-[#f8fafc]">
      <Header title={`Order ${order.orderNumber}`} />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/receipt/${order.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              <Printer size={16} />
              Print Receipt
            </Link>
            {nextStatus && (
              <StatusUpdateButtons
                orderId={order.id}
                orderNumber={order.orderNumber}
                currentStatus={order.status}
                nextStatus={nextStatus}
                onStatusUpdated={refresh}
              />
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Order Information</h3>
                  <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Order Number</p>
                  <p className="font-medium text-gray-900">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Customer</p>
                  <Link href={`/customers/${order.customerId}`} className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
                    {order.customer.firstName} {order.customer.lastName}
                  </Link>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">{formatDateTime(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Expected Completion</p>
                  <p className="font-medium text-gray-900">
                    {order.expectedCompletion ? formatDate(order.expectedCompletion) : 'N/A'}
                  </p>
                </div>
                <div>
                  <OrderEmployeeSection
                    orderId={order.id}
                    employee={order.employee}
                  />
                </div>
                <div>
                  <p className="text-gray-500">Branch</p>
                  <p className="font-medium text-gray-900">{order.branch?.name || 'N/A'}</p>
                </div>
                {order.notes && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Notes</p>
                    <p className="font-medium text-gray-900">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Order Items</h3>
              <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="pb-3">Garment</th>
                      <th className="pb-3">Service</th>
                      <th className="pb-3 text-center">Qty</th>
                      <th className="pb-3 text-right">Unit Price</th>
                      <th className="pb-3 text-right">Total</th>
                      <th className="pb-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 font-medium text-gray-900">{item.garmentType}</td>
                        <td className="py-3 text-gray-600">{item.service?.name || '-'}</td>
                        <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-600">{formatCurrency(Number(item.unitPrice))}</td>
                        <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(Number(item.totalPrice))}</td>
                        <td className="py-3 text-gray-500">{item.instructions || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-100">
                      <td colSpan={4} className="py-3 text-right font-semibold text-gray-900">Total</td>
                      <td className="py-3 text-right font-bold text-gray-900">{formatCurrency(totalAmount)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Payment Summary</h3>
              <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Amount</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Paid</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Balance</span>
                  <span className={`font-semibold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(balance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <StatusBadge status={order.paymentStatus} />
                </div>
              </div>

              {order.payments.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <h4 className="mb-2 text-sm font-semibold text-gray-700">Payment History</h4>
                  <div className="space-y-2">
                    {order.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-gray-500">{formatDate(payment.createdAt)}</span>
                          <span className="mx-1 text-gray-300">|</span>
                          <span className="font-medium text-gray-700">{payment.method}</span>
                          {payment.reference && (
                            <span className="ml-1 text-gray-400">({payment.reference})</span>
                          )}
                        </div>
                        <span className="font-semibold text-emerald-600">{formatCurrency(Number(payment.amount))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-gray-100 pt-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-700">Add Payment</h4>
                <PaymentForm orderId={order.id} remainingBalance={balance} onPaymentSuccess={refresh} />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">QR Code</h3>
              <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
              <div className="mt-4 flex justify-center">
                <Image
                  src={`/api/qr/${order.id}`}
                  alt={`QR code for ${order.orderNumber}`}
                  width={160}
                  height={160}
                  className="rounded-xl border border-gray-100"
                />
              </div>
              <p className="mt-3 text-center text-xs text-gray-500">
                Scan to view order details
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Status Timeline</h3>
          <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
          <div className="relative mt-4 ml-3 border-l-2 border-gray-100 pl-6">
            {order.statusHistory.map((entry, index) => (
              <div key={entry.id} className="relative mb-6 last:mb-0">
                <div className={`absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${
                  index === 0 ? 'bg-brand-600' : 'bg-gray-300'
                }`} />
                <div>
                  <StatusBadge status={entry.status} />
                  <p className="mt-1 text-xs text-gray-500">{formatDateTime(entry.createdAt)}</p>
                  {entry.notes && (
                    <p className="mt-0.5 text-sm text-gray-600">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
