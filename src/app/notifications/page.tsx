import Header from '@/components/Header';
import { getNotifications, markAsRead } from '@/lib/actions/notifications';
import { formatDateTime } from '@/lib/utils';
import { Bell, Mail, MessageSquare, Check } from 'lucide-react';

interface NotificationsPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const params = await searchParams;
  const { data: notifications, error } = await getNotifications();

  if (error) {
    return (
      <div className="flex flex-col">
        <Header title="Notifications" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  const allNotifications = notifications ?? [];
  const filteredNotifications = params.type
    ? allNotifications.filter((n) => n.type === params.type)
    : allNotifications;

  const unreadCount = allNotifications.filter((n) => !n.readAt).length;

  const types = [...new Set(allNotifications.map((n) => n.type))] as string[];

  const TYPE_ICONS: Record<string, typeof Bell> = {
    SMS: MessageSquare,
    EMAIL: Mail,
    WHATSAPP: Bell,
  };

  return (
    <div className="flex flex-col">
      <Header title="Notifications" />
      <div className="flex-1 p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white">
              {unreadCount} unread
            </span>
            <div className="flex flex-wrap gap-2">
              <a
                href="/notifications"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  !params.type
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </a>
              {types.map((t: string) => (
                <a
                  key={t}
                  href={`/notifications?type=${t}`}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    params.type === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] ?? Bell;
            const isUnread = !notification.readAt;

            return (
              <div
                key={notification.id}
                className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
                  isUnread
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  isUnread ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      isUnread ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {notification.type}
                    </span>
                    <span className="text-xs text-gray-400">{notification.channel}</span>
                    {notification.recipient && (
                      <span className="text-xs text-gray-400">to {notification.recipient}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
                  {notification.order && (
                    <p className="mt-1 text-xs text-gray-500">
                      Order: {notification.order.orderNumber} - {notification.order.customer.firstName} {notification.order.customer.lastName}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">{formatDateTime(notification.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isUnread && (
                    <form action={async () => { await markAsRead(notification.id); }}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        <Check size={12} />
                        Mark Read
                      </button>
                    </form>
                  )}
                  {notification.readAt && (
                    <span className="text-xs text-gray-400">Read</span>
                  )}
                </div>
              </div>
            );
          })}
          {filteredNotifications.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <Bell size={40} className="mx-auto text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No notifications found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
