import { cn } from '@/lib/utils';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/lib/types';

interface StatusBadgeProps {
  status: string;
}

const ALL_LABELS: Record<string, string> = {
  ...ORDER_STATUS_LABELS,
  ...PAYMENT_STATUS_LABELS,
};

const STATUS_STYLES: Record<string, string> = {
  RECEIVED: 'bg-blue-50 text-blue-700 ring-blue-600/10',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  CLEANING: 'bg-violet-50 text-violet-700 ring-violet-600/10',
  TAILORING: 'bg-purple-50 text-purple-700 ring-purple-600/10',
  QUALITY_CHECK: 'bg-orange-50 text-orange-700 ring-orange-600/10',
  READY_FOR_COLLECTION: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  COLLECTED: 'bg-gray-50 text-gray-600 ring-gray-500/10',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  UNPAID: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  PARTIALLY_PAID: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  DEPOSIT_PAID: 'bg-blue-50 text-blue-700 ring-blue-600/10',
  FULLY_PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  INACTIVE: 'bg-gray-50 text-gray-600 ring-gray-500/10',
};

const STATUS_DOTS: Record<string, string> = {
  RECEIVED: 'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  CLEANING: 'bg-violet-500',
  TAILORING: 'bg-purple-500',
  QUALITY_CHECK: 'bg-orange-500',
  READY_FOR_COLLECTION: 'bg-emerald-500',
  COLLECTED: 'bg-gray-400',
  CANCELLED: 'bg-rose-500',
  UNPAID: 'bg-rose-500',
  PARTIALLY_PAID: 'bg-amber-500',
  DEPOSIT_PAID: 'bg-blue-500',
  FULLY_PAID: 'bg-emerald-500',
  ACTIVE: 'bg-emerald-500',
  INACTIVE: 'bg-gray-400',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label =
    ALL_LABELS[status] ?? status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const style = STATUS_STYLES[status] ?? 'bg-gray-50 text-gray-600 ring-gray-500/10';
  const dot = STATUS_DOTS[status] ?? 'bg-gray-400';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset capitalize',
        style,
      )}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
