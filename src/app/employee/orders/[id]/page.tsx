'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Package, Check } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import StatusConfirmModal from '@/components/StatusConfirmModal';
import { useOrderPolling } from '@/hooks/useOrderPolling';
import { updateOrderStatus } from '@/lib/actions/orders';
import { getCurrentEmployee } from '@/lib/actions/auth';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from '@/lib/types';
import type { OrderStatus } from '@/lib/types';

export default function EmployeeOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionTarget, setActionTarget] = useState<string | null>(null);

  const { order, loading: orderLoading, error, refresh } = useOrderPolling(orderId || '');

  useEffect(() => {
    async function init() {
      const emp = await getCurrentEmployee();
      if (!emp) {
        router.push('/employee/login');
        return;
      }
      setEmployeeId(emp.id);
      const { id } = await params;
      setOrderId(id);
      setAuthChecked(true);
    }
    init();
  }, [params, router]);

  const loading = !authChecked || orderLoading;

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 py-8">Loading order...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-4">{error || 'Order not found'}</p>
          <Link href="/employee/dashboard" className="text-brand-600 hover:text-brand-700 underline text-sm">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (employeeId && order.employeeId !== employeeId) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-4">This order is not assigned to you</p>
          <Link href="/employee/dashboard" className="text-brand-600 hover:text-brand-700 underline text-sm">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount = Number(order.totalAmount);
  const paidAmount = Number(order.paidAmount);
  const balance = totalAmount - paidAmount;

  const statusIndex = ORDER_STATUS_FLOW.indexOf(order.status as typeof ORDER_STATUS_FLOW[number]);
  const nextStatus = statusIndex >= 0 && statusIndex < ORDER_STATUS_FLOW.length - 1
    ? ORDER_STATUS_FLOW[statusIndex + 1]
    : null;

  const canMarkInProgress = order.status === 'RECEIVED';
  const canMarkComplete = !['READY_FOR_COLLECTION', 'COLLECTED', 'CANCELLED'].includes(order.status);
  const canAdvance = nextStatus && !['READY_FOR_COLLECTION', 'COLLECTED'].includes(order.status);

  function handleAction(target: string) {
    setActionTarget(target);
    setShowModal(true);
  }

  function handleConfirmStatus() {
    if (!order || !actionTarget) return;

    startTransition(async () => {
      const result = await updateOrderStatus(order.id, actionTarget);
      if (result.error) {
        setShowModal(false);
        setActionTarget(null);
      } else {
        setSuccessMsg(`Order marked as ${ORDER_STATUS_LABELS[actionTarget as OrderStatus]}`);
        setShowModal(false);
        setActionTarget(null);
        refresh();
      }
    });
  }

  const modalNextStatus = actionTarget || nextStatus;

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/employee/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {canMarkInProgress && (
            <button
              type="button"
              onClick={() => handleAction('IN_PROGRESS')}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-brand-600 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && actionTarget === 'IN_PROGRESS' ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ArrowRight size={16} />
              )}
              Start Working
            </button>
          )}
          {canAdvance && order.status !== 'RECEIVED' && (
            <button
              type="button"
              onClick={() => handleAction(nextStatus!)}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && actionTarget === nextStatus ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
              ) : (
                <ArrowRight size={16} />
              )}
              Next Step
            </button>
          )}
          {canMarkComplete && order.status !== 'RECEIVED' && order.status !== 'IN_PROGRESS' && (
            <button
              type="button"
              onClick={() => handleAction('READY_FOR_COLLECTION')}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && actionTarget === 'READY_FOR_COLLECTION' ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Check size={16} />
              )}
              Mark Complete
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-center gap-2">
          <Check size={16} />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
            <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Order Number</p>
                <p className="font-bold text-brand-600">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium text-gray-900">{formatDateTime(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium text-gray-900">
                  {order.customer.firstName} {order.customer.lastName}
                </p>
                <p className="text-xs text-gray-500">{order.customer.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Expected Completion</p>
                <p className="font-medium text-gray-900">
                  {order.expectedCompletion ? formatDate(order.expectedCompletion) : 'N/A'}
                </p>
              </div>
              {order.notes && (
                <div className="col-span-2">
                  <p className="text-gray-500">Notes</p>
                  <p className="font-medium text-gray-900">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Items</h3>
            <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/80 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                        <Package size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.garmentType}</p>
                        <p className="text-xs text-gray-500">
                          {item.service?.name || 'Custom'} &middot; Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">{formatCurrency(Number(item.totalPrice))}</p>
                  </div>
                  {item.instructions && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                      Note: {item.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50/50 p-4">
              <span className="text-sm font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-brand-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Payment Info */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Payment</h3>
            <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Paid</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Balance</span>
                <span className={`font-semibold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>

            {order.payments.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h4 className="mb-2 text-xs font-semibold text-gray-700">Payment History</h4>
                <div className="space-y-2">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-gray-500">{formatDate(payment.createdAt)}</span>
                        <span className="mx-1 text-gray-300">|</span>
                        <span className="font-medium text-gray-700">{payment.method}</span>
                      </div>
                      <span className="font-semibold text-emerald-600">{formatCurrency(Number(payment.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Status History</h3>
            <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
            <div className="relative mt-4 ml-3 border-l-2 border-gray-100 pl-6">
              {order.statusHistory.map((entry, index) => (
                <div key={entry.id} className="relative mb-4 last:mb-0">
                  <div className={`absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${
                    index === 0 ? 'bg-brand-600' : 'bg-gray-300'
                  }`} />
                  <div>
                    <StatusBadge status={entry.status} />
                    <p className="mt-1 text-[10px] text-gray-400">{formatDateTime(entry.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Confirm Modal */}
      {order && modalNextStatus && (
        <StatusConfirmModal
          isOpen={showModal}
          currentStatus={order.status}
          nextStatus={modalNextStatus}
          orderNumber={order.orderNumber}
          onConfirm={handleConfirmStatus}
          onCancel={() => { setShowModal(false); setActionTarget(null); }}
          isPending={isPending}
          error={error}
        />
      )}
    </div>
  );
}
