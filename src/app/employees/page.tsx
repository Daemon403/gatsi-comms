'use client';

import Link from 'next/link';
import { Plus, ClipboardList, DollarSign } from 'lucide-react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { getEmployees } from '@/lib/actions/employees';
import { getOrders } from '@/lib/actions/orders';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface EmployeeWithStats {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  branch: { name: string } | null;
  activeOrders: number;
  totalRevenue: number;
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [empResult, ordersResult] = await Promise.all([
        getEmployees(),
        getOrders(),
      ]);

      if (empResult.data && ordersResult.data) {
        const empStats = empResult.data.map((emp) => {
          const empOrders = ordersResult.data!.filter(o => o.employeeId === emp.id);
          const activeOrders = empOrders.filter(o => !['COLLECTED', 'CANCELLED'].includes(o.status));
          const totalRevenue = empOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
          return {
            ...emp,
            activeOrders: activeOrders.length,
            totalRevenue,
          };
        });
        setEmployees(empStats);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const tableData = employees.map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
    role: e.role,
    branch: e.branch?.name || '-',
    email: e.email || '-',
    phone: e.phone || '-',
    activeOrders: e.activeOrders,
    totalRevenue: e.totalRevenue,
    status: e.isActive ? 'ACTIVE' : 'INACTIVE',
  }));

  return (
    <div className="flex flex-col">
      <Header title="Employees" />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{employees.length} employee(s)</p>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                <ClipboardList size={14} />
                {employees.reduce((sum, e) => sum + e.activeOrders, 0)} active orders
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <DollarSign size={14} />
                {formatCurrency(employees.reduce((sum, e) => sum + e.totalRevenue, 0))} total revenue
              </div>
            </div>
          </div>
          <Link
            href="/employees/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-brand-600 hover:shadow-xl active:scale-[0.98]"
          >
            <Plus size={18} />
            Add Staff
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'role', label: 'Role' },
              { key: 'branch', label: 'Branch' },
              {
                key: 'activeOrders',
                label: 'Active Orders',
                render: (row) => (
                  <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    row.activeOrders > 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {row.activeOrders}
                  </span>
                ),
              },
              {
                key: 'totalRevenue',
                label: 'Revenue',
                render: (row) => (
                  <span className="font-medium text-gray-900">{formatCurrency(row.totalRevenue)}</span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (row) => <StatusBadge status={row.status as string} />,
              },
            ]}
            data={tableData}
            onRowClick={(row) => router.push(`/employees/${row.id}`)}
            emptyMessage="No employees found"
          />
        )}
      </div>
    </div>
  );
}
