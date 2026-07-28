'use client';

import { useTransition } from 'react';
import { ArrowRight, X, AlertCircle, CheckCircle } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '@/lib/types';
import type { OrderStatus } from '@/lib/types';

interface StatusConfirmModalProps {
  isOpen: boolean;
  currentStatus: string;
  nextStatus: string;
  orderNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  CLEANING: 'bg-violet-100 text-violet-700',
  TAILORING: 'bg-violet-100 text-violet-700',
  QUALITY_CHECK: 'bg-cyan-100 text-cyan-700',
  READY_FOR_COLLECTION: 'bg-emerald-100 text-emerald-700',
  COLLECTED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

const STATUS_ICONS: Record<string, string> = {
  RECEIVED: '📦',
  IN_PROGRESS: '🔄',
  CLEANING: '🧼',
  TAILORING: '✂️',
  QUALITY_CHECK: '✅',
  READY_FOR_COLLECTION: '👔',
  COLLECTED: '🎉',
  CANCELLED: '❌',
};

export default function StatusConfirmModal({
  isOpen,
  currentStatus,
  nextStatus,
  orderNumber,
  onConfirm,
  onCancel,
  isPending,
  error,
}: StatusConfirmModalProps) {
  if (!isOpen) return null;

  const currentLabel = ORDER_STATUS_LABELS[currentStatus as OrderStatus] ?? currentStatus;
  const nextLabel = ORDER_STATUS_LABELS[nextStatus as OrderStatus] ?? nextStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100">
            <AlertCircle size={24} className="text-brand-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Confirm Status Change</h3>
            <p className="text-sm text-gray-500">Order {orderNumber}</p>
          </div>
        </div>

        {/* Status Transition */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-center gap-4">
            {/* Current Status */}
            <div className="text-center">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Current</p>
              <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${STATUS_COLORS[currentStatus] || 'bg-gray-100 text-gray-700'}`}>
                <span>{STATUS_ICONS[currentStatus] || '📋'}</span>
                {currentLabel}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100">
              <ArrowRight size={16} className="text-brand-600" />
            </div>

            {/* New Status */}
            <div className="text-center">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">New</p>
              <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${STATUS_COLORS[nextStatus] || 'bg-gray-100 text-gray-700'}`}>
                <span>{STATUS_ICONS[nextStatus] || '📋'}</span>
                {nextLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-brand-600 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Confirm Change
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
