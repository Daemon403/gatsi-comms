'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { getNotifications, markAsRead } from '@/lib/actions/notifications';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: string;
  channel: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  order?: {
    orderNumber: string;
  };
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  useEffect(() => {
    getNotifications().then((result) => {
      if (result.data) {
        setNotifications(
          result.data.map((n) => ({
            id: n.id,
            type: n.type,
            channel: n.channel,
            message: n.message,
            readAt: n.readAt ? String(n.readAt) : null,
            createdAt: String(n.createdAt),
            order: n.order ? { orderNumber: n.order.orderNumber } : undefined,
          }))
        );
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleMarkAsRead(id: string) {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-1 text-[10px] font-bold text-white shadow-md shadow-rose-500/30">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-brand-50/50 to-white px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 border-b border-gray-50 px-4 py-3 transition-all hover:bg-gray-50/80 ${
                    !notification.readAt ? 'bg-brand-50/30' : ''
                  }`}
                >
                  <div className="mt-0.5">
                    <div className={`h-2 w-2 rounded-full ${!notification.readAt ? 'bg-brand-500 animate-pulse-soft' : 'bg-gray-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{notification.type}</p>
                    <p className="mt-0.5 text-sm text-gray-700 line-clamp-2">{notification.message}</p>
                    {notification.order && (
                      <p className="mt-0.5 text-xs font-medium text-brand-600">
                        Order #{notification.order.orderNumber}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.readAt && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-emerald-50 hover:text-emerald-600"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
