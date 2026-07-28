'use client';

import Link from 'next/link';
import { Search, Plus, Bell } from 'lucide-react';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="glass sticky top-0 z-30 border-b border-gray-200/60 px-6 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <div className="mt-0.5 h-1 w-12 rounded-full bg-gradient-brand" />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 sm:w-64"
            />
          </div>

          <NotificationBell />

          <Link
            href="/orders/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-brand-600 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.98]"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">New Order</span>
          </Link>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white shadow-md shadow-brand-500/30">
            GC
          </div>
        </div>
      </div>
    </header>
  );
}
