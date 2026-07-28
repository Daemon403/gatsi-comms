'use client';

import { useState, useTransition, useEffect } from 'react';
import { UserPlus, UserMinus, Check, X } from 'lucide-react';
import { assignOrder } from '@/lib/actions/orders';
import { getEmployees } from '@/lib/actions/employees';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AssignEmployeeProps {
  orderId: string;
  currentEmployeeId: string | null;
  onAssigned?: (employee: Employee | null) => void;
}

export default function AssignEmployee({ orderId, currentEmployeeId, onAssigned }: AssignEmployeeProps) {
  const [isPending, startTransition] = useTransition();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<string>(currentEmployeeId || '');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEmployees().then((result) => {
      if (result.data) {
        setEmployees(result.data);
      }
    });
  }, []);

  function handleAssign() {
    setError(null);
    startTransition(async () => {
      const result = await assignOrder(orderId, selectedId || null);
      if (result.error) {
        setError(result.error);
      } else {
        setIsEditing(false);
        if (onAssigned) {
          const emp = selectedId ? employees.find(e => e.id === selectedId) || null : null;
          onAssigned(emp);
        }
      }
    });
  }

  function handleCancel() {
    setSelectedId(currentEmployeeId || '');
    setIsEditing(false);
    setError(null);
  }

  const currentEmployee = employees.find(e => e.id === currentEmployeeId);

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          {currentEmployee
            ? `${currentEmployee.firstName} ${currentEmployee.lastName}`
            : 'Unassigned'}
        </span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50"
        >
          <UserPlus size={14} />
          {currentEmployee ? 'Reassign' : 'Assign'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Unassigned</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName} ({emp.role})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAssign}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Check size={14} />
          )}
          Save
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
        >
          <X size={14} />
        </button>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
