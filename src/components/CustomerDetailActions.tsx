'use client';

import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';

interface CustomerDetailActionsProps {
  customerId: string;
  onDelete: () => void;
}

export default function CustomerDetailActions({ customerId, onDelete }: CustomerDetailActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/customers/${customerId}/edit`}
        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
      >
        <Pencil size={14} />
        Edit
      </Link>
      <form action={onDelete}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </form>
    </div>
  );
}
