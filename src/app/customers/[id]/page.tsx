import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import CustomerDetailActions from '@/components/CustomerDetailActions';
import { getCustomer, deleteCustomer } from '@/lib/actions/customers';
import { formatCurrency, formatDate } from '@/lib/utils';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CustomerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await getCustomer(id);
  return {
    title: data ? `${data.firstName} ${data.lastName} - GATSI COMMS` : 'Customer Not Found',
  };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const { data: customer, error } = await getCustomer(id);

  if (error || !customer) {
    notFound();
  }

  async function handleDelete() {
    'use server';
    await deleteCustomer(id);
    redirect('/customers');
  }

  const totalSpent = customer.orders.reduce(
    (sum: number, order: { totalAmount: unknown }) => sum + Number(order.totalAmount),
    0
  );

  const totalPaid = customer.orders.reduce(
    (sum: number, order: { paidAmount: unknown }) => sum + Number(order.paidAmount),
    0
  );

  return (
    <div className="flex flex-col bg-[#f8fafc]">
      <Header title={`${customer.firstName} ${customer.lastName}`} />
      <div className="flex-1 p-6">
        <div className="mb-6">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Back to Customers
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Customer Details</h3>
                  <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
                </div>
                <CustomerDetailActions customerId={customer.id} onDelete={handleDelete} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{customer.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">{customer.address || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Preferred Contact</p>
                  <p className="font-medium text-gray-900">{customer.preferredContact || 'SMS'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Branch</p>
                  <p className="font-medium text-gray-900">{customer.branch?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium text-gray-900">{customer.notes || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <StatusBadge status={customer.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium text-gray-900">{formatDate(customer.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Summary</h3>
              <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Orders</span>
                  <span className="font-semibold text-gray-900">{customer.orders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Spent</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(totalSpent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Paid</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Outstanding</span>
                  <span className={`font-semibold ${totalSpent - totalPaid > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(totalSpent - totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Loyalty Points</span>
                  <span className="font-semibold text-brand-600">{customer.loyaltyPoints}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Order History</h3>
          <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="pb-3">Order #</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customer.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-600">{formatDate(order.createdAt)}</td>
                    <td className="py-3 text-gray-600">{order.items.length} item(s)</td>
                    <td className="py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatCurrency(Number(order.totalAmount))}
                    </td>
                  </tr>
                ))}
                {customer.orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
