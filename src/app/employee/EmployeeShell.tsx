'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import EmployeeNavbar from '@/components/EmployeeNavbar';
import { getCurrentEmployee } from '@/lib/actions/auth';

interface Employee {
  firstName: string;
  lastName: string;
  role: string;
  branch: { name: string } | null;
}

export default function EmployeeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === '/employee/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    getCurrentEmployee().then((emp) => {
      if (!emp) {
        router.push('/employee/login');
      } else {
        setEmployee(emp as Employee);
      }
      setLoading(false);
    });
  }, [isLoginPage, router, pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="flex h-full">
      <EmployeeNavbar employee={employee} />
      <main className="flex-1 overflow-auto lg:ml-64">
        {children}
      </main>
    </div>
  );
}
