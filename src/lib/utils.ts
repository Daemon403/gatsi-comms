import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `GAT-${year}${month}-${random}`;
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
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
  };
  return colors[status] || 'bg-gray-50 text-gray-600 ring-gray-500/10';
}
