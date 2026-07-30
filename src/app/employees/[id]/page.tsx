'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Building2, Edit, Trash2, ClipboardList, DollarSign, Clock, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { getEmployee, deleteEmployee, reactivateEmployee } from '@/lib/actions/employees';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  branchId: string | null;
  branch: { id: string; name: string } | null;
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    createdAt: Date;
    customer: { firstName: string; lastName: string };
    items: { garmentType: string; quantity: number }[];
  }[];
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      getEmployee(id).then((result) => {
        if (result.data) {
          setEmployee(result.data as unknown as Employee);
        } else {
          setError(result.error || 'Employee not found');
        }
        setLoading(false);
      });
    });
  }, [params]);

  async function handleDelete() {
    if (!employee) return;
    if (!confirm('Are you sure you want to deactivate this employee?')) return;
    const result = await deleteEmployee(employee.id);
    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
      setEmployee({ ...employee, isActive: false });
    }
  }

  async function handleReactivate() {
    if (!employee) return;
    const result = await reactivateEmployee(employee.id);
    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
      setEmployee({ ...employee, isActive: true });
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <Header title="Employee Details" />
        <div className="flex-1 p-6">
          <div className="text-center text-gray-500 py-8">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col">
        <Header title="Employee Not Found" />
        <div className="flex-1 p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{error || 'Employee not found'}</p>
            <Link href="/employees" className="text-brand-600 hover:text-brand-700 underline">
              Back to Employees
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeOrders = employee.orders.filter(o => !['COLLECTED', 'CANCELLED'].includes(o.status));
  const completedOrders = employee.orders.filter(o => ['COLLECTED', 'READY_FOR_COLLECTION'].includes(o.status));
  const totalRevenue = employee.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const totalPaid = employee.orders.reduce((sum, o) => sum + Number(o.paidAmount), 0);

  return (
    <div className="flex flex-col">
      <Header title={`${employee.firstName} ${employee.lastName}`} />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/employees"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Back to Employees
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/employees/${employee.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              <Edit size={16} />
              Edit
            </Link>
            {employee.isActive ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50"
              >
                <Trash2 size={16} />
                Deactivate
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReactivate}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-600 transition-all hover:bg-emerald-50"
              >
                <CheckCircle size={16} />
                Reactivate
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-2xl font-bold text-white shadow-lg shadow-brand-500/25">
                  {employee.firstName[0]}{employee.lastName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <StatusBadge status={employee.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <UserCog size={16} className="text-gray-400" />
                  <span className="text-gray-500">Role:</span>
                  <span className="font-medium text-gray-900">{employee.role}</span>
                </div>
                {employee.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium text-gray-900">{employee.email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium text-gray-900">{employee.phone}</span>
                  </div>
                )}
                {employee.branch && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 size={16} className="text-gray-400" />
                    <span className="text-gray-500">Branch:</span>
                    <span className="font-medium text-gray-900">{employee.branch.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-500">Joined:</span>
                  <span className="font-medium text-gray-900">{formatDate(employee.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Performance</h3>
              <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-brand-50/80 p-4 text-center">
                  <ClipboardList size={20} className="mx-auto mb-1 text-brand-600" />
                  <p className="text-2xl font-bold text-brand-600">{employee.orders.length}</p>
                  <p className="text-xs text-brand-500">Total Orders</p>
                </div>
                <div className="rounded-xl bg-emerald-50/80 p-4 text-center">
                  <CheckCircle size={20} className="mx-auto mb-1 text-emerald-600" />
                  <p className="text-2xl font-bold text-emerald-600">{completedOrders.length}</p>
                  <p className="text-xs text-emerald-500">Completed</p>
                </div>
                <div className="rounded-xl bg-amber-50/80 p-4 text-center">
                  <Clock size={20} className="mx-auto mb-1 text-amber-600" />
                  <p className="text-2xl font-bold text-amber-600">{activeOrders.length}</p>
                  <p className="text-xs text-amber-500">In Progress</p>
                </div>
                <div className="rounded-xl bg-violet-50/80 p-4 text-center">
                  <DollarSign size={20} className="mx-auto mb-1 text-violet-600" />
                  <p className="text-2xl font-bold text-violet-600">{formatCurrency(totalRevenue)}</p>
                  <p className="text-xs text-violet-500">Revenue</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Assigned Orders</h3>
              <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />

              {employee.orders.length === 0 ? (
                <div className="mt-8 text-center text-gray-500">
                  <ClipboardList size={40} className="mx-auto mb-3 text-gray-300" />
                  <p>No orders assigned yet</p>
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <th className="pb-3">Order</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Items</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {employee.orders.map((order) => (
                        <tr
                          key={order.id}
                          className="cursor-pointer transition-colors hover:bg-gray-50"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <td className="py-3 font-medium text-brand-600">{order.orderNumber}</td>
                          <td className="py-3 text-gray-700">
                            {order.customer.firstName} {order.customer.lastName}
                          </td>
                          <td className="py-3 text-gray-500">
                            {order.items.length} item(s)
                          </td>
                          <td className="py-3 text-right font-medium text-gray-900">
                            {formatCurrency(Number(order.totalAmount))}
                          </td>
                          <td className="py-3">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserCog(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
