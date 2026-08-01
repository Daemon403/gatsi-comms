'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CreditCard,
  UserCog,
  Receipt,
  Package,
  BarChart3,
  Bell,
  Menu,
  X,
  Sparkles,
  LayoutGrid,
  Building2,
  ShoppingCart,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { employeeLogout } from '@/lib/actions/auth';
import type { AccessLevel } from '@/lib/roles';

interface SidebarEmployee {
  firstName: string;
  lastName: string;
  role: string;
  accessLevel: AccessLevel;
  branch: { name: string } | null;
}

const navLinks: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: AccessLevel[];
}[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
  { href: '/orders', label: 'Orders', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { href: '/tasks', label: 'Task Board', icon: LayoutGrid, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { href: '/payments', label: 'Payments', icon: CreditCard, roles: ['ADMIN', 'MANAGER'] },
  { href: '/employees', label: 'Employees', icon: UserCog, roles: ['ADMIN'] },
  { href: '/branches', label: 'Branches', icon: Building2, roles: ['ADMIN'] },
  { href: '/expenses', label: 'Expenses', icon: Receipt, roles: ['ADMIN', 'MANAGER'] },
  { href: '/inventory', label: 'Inventory', icon: Package, roles: ['ADMIN', 'MANAGER'] },
  { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { href: '/notifications', label: 'Notifications', icon: Bell, roles: ['ADMIN', 'MANAGER'] },
];

const quickLinks: {
  href: string;
  label: string;
  icon: typeof ShoppingCart;
  roles: AccessLevel[];
}[] = [
  { href: '/orders/new', label: 'New Order', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { href: '/customers/new', label: 'Intake Customer', icon: UserPlus, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
];

export default function Sidebar({ employee }: { employee: SidebarEmployee }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allowedLinks = navLinks.filter((l) => l.roles.includes(employee.accessLevel));
  const allowedQuickLinks = quickLinks.filter((l) => l.roles.includes(employee.accessLevel));
  const showQuickLinks = employee.accessLevel === 'STAFF';

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    await employeeLogout();
    router.push('/login');
    router.refresh();
  }

  const initials = `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase() || 'U';

  const navContent = (
    <nav className="flex flex-col gap-1 px-3">
      {allowedLinks.map(({ href, label, icon: Icon }) => {
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
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-emerald-400 to-accent-400" />
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

      {showQuickLinks && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-widest text-indigo-300/40">
            Quick Actions
          </p>
          {allowedQuickLinks.map(({ href, label, icon: Icon }) => {
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
      )}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-xl bg-gradient-to-br from-indigo-900 to-indigo-800 p-2.5 text-white shadow-lg shadow-indigo-900/30 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 z-40 flex w-64 flex-col bg-gradient-sidebar transition-[left] duration-300 lg:left-0 ${
          mobileOpen ? 'left-0' : '-left-64'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-accent-400 shadow-lg shadow-emerald-500/30">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">GATSI COMMS</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-indigo-300/60">
              Management System
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">{navContent}</div>

        <div className="border-t border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-500 text-xs font-bold text-white shadow-md shadow-accent-500/30">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {employee.firstName} {employee.lastName}
              </p>
              <p className="truncate text-[11px] text-indigo-300/50">
                {employee.role}
                {employee.branch ? ` · ${employee.branch.name}` : ''}
              </p>
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
