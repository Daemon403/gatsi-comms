'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus } from '@/lib/actions/orders';
import { ArrowRight } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '@/lib/types';
import type { OrderStatus } from '@/lib/types';
import StatusConfirmModal from '@/components/StatusConfirmModal';

interface StatusUpdateButtonsProps {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  nextStatus: string;
  onStatusUpdated?: () => void;
}

export default function StatusUpdateButtons({ orderId, orderNumber, currentStatus, nextStatus, onStatusUpdated }: StatusUpdateButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus);
      if (result.error) {
        setError(result.error);
      } else {
        setShowModal(false);
        onStatusUpdated?.();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        <ArrowRight size={16} />
        Mark as {ORDER_STATUS_LABELS[nextStatus as OrderStatus] ?? nextStatus}
      </button>

      <StatusConfirmModal
        isOpen={showModal}
        currentStatus={currentStatus}
        nextStatus={nextStatus}
        orderNumber={orderNumber}
        onConfirm={handleConfirm}
        onCancel={() => { setShowModal(false); setError(null); }}
        isPending={isPending}
        error={error}
      />
    </>
  );
}
