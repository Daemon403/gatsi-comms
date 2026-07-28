'use client';

import { useState } from 'react';
import Link from 'next/link';
import AssignEmployee from '@/components/AssignEmployee';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface OrderEmployeeSectionProps {
  orderId: string;
  employee: Employee | null;
}

export default function OrderEmployeeSection({ orderId, employee }: OrderEmployeeSectionProps) {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(employee);

  return (
    <div>
      <p className="text-gray-500">Employee</p>
      {currentEmployee ? (
        <Link
          href={`/employees/${currentEmployee.id}`}
          className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
        >
          {currentEmployee.firstName} {currentEmployee.lastName}
        </Link>
      ) : null}
      <div className="mt-1">
        <AssignEmployee
          orderId={orderId}
          currentEmployeeId={currentEmployee?.id || null}
          onAssigned={(emp) => setCurrentEmployee(emp)}
        />
      </div>
    </div>
  );
}
