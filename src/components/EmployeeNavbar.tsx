'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  LayoutDashboard,
  ClipboardList,
  UserPlus,
  ShoppingCart,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { employeeLogout } from '@/lib/actions/auth';

interface EmployeeNavbarProps {
  employee: {
    firstName: string;
    lastName: string;
    role: string;
    branch: { name: string } | null;
  };
}

const navLinks = [
  { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/orders', label: 'My Orders', icon: ClipboardList },
  { href: '/employee/orders/new', label: 'New Order', icon: ShoppingCart },
  { href: '/employee/customers/new', label: 'Intake Customer', icon: UserPlus },
];

export default function EmployeeNavbar({ employee }: EmployeeNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/employee/dashboard') return pathname === '/employee/dashboard';
    if (href === '/employee/orders/new') return pathname === '/employee/orders/new';
    if (href === '/employee/customers/new') return pathname === '/employee/customers/new';
    if (href === '/employee/orders') return pathname === '/employee/orders' || (pathname.startsWith('/employee/orders/') && pathname !== '/employee/orders/new');
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    await employeeLogout();
    router.push('/employee/login');
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-xl bg-gradient-to-br from-indigo-900 to-indigo-800 p-2.5 text-white shadow-lg shadow-indigo-900/30 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 z-40 flex w-64 flex-col bg-gradient-to-b from-indigo-950 via-indigo-900 to-indigo-800 transition-[left] duration-300 lg:left-0 ${
          mobileOpen ? 'left-0' : '-left-64'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-accent-400 shadow-lg shadow-emerald-500/30">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">GATSI COMMS</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-indigo-300/60">
              Employee Portal
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white/15 text-white shadow-lg shadow-black/20'
                      : 'text-indigo-200/70 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-emerald-400 to-accent-400" />
                  )}
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30'
                        : 'bg-white/5 text-indigo-300/50 group-hover:bg-white/10 group-hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Employee Info + Logout */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-500 text-xs font-bold text-white shadow-md shadow-brand-500/30">
              {employee.firstName[0]}{employee.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{employee.firstName} {employee.lastName}</p>
              <p className="text-[11px] text-indigo-300/50 truncate">{employee.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-indigo-300/60 transition-all hover:bg-white/8 hover:text-white"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
