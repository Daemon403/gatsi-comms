export type AccessLevel = 'ADMIN' | 'MANAGER' | 'STAFF';

export const ACCESS_LEVELS: AccessLevel[] = ['ADMIN', 'MANAGER', 'STAFF'];

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  STAFF: 'Staff',
};

const ACCESS_RANK: Record<AccessLevel, number> = {
  ADMIN: 2,
  MANAGER: 1,
  STAFF: 0,
};

/**
 * Maps a free-form employee role/job title to one of the three canonical
 * access tiers used for authorization. Roles containing "admin" or
 * "manager" are promoted; every other job title is treated as STAFF.
 */
export function getAccessLevel(role: string | null | undefined): AccessLevel {
  const normalized = (role || '').toLowerCase();
  if (normalized.includes('admin')) return 'ADMIN';
  if (normalized.includes('manager')) return 'MANAGER';
  return 'STAFF';
}

export function atLeast(level: AccessLevel, required: AccessLevel): boolean {
  return ACCESS_RANK[level] >= ACCESS_RANK[required];
}

export function getHomeRoute(level: AccessLevel): string {
  return level === 'STAFF' ? '/tasks' : '/';
}

interface RouteRule {
  prefix: string;
  levels: AccessLevel[];
}

/**
 * Access matrix:
 *   ADMIN   -> everything
 *   MANAGER -> everything except Employees + Branches
 *   STAFF   -> tasks + orders (+ customer intake, receipts)
 */
const ROUTE_ACCESS: RouteRule[] = [
  { prefix: '/customers/new', levels: ['ADMIN', 'MANAGER', 'STAFF'] },
  { prefix: '/customers', levels: ['ADMIN', 'MANAGER'] },
  { prefix: '/orders', levels: ['ADMIN', 'MANAGER', 'STAFF'] },
  { prefix: '/receipt', levels: ['ADMIN', 'MANAGER', 'STAFF'] },
  { prefix: '/tasks', levels: ['ADMIN', 'MANAGER', 'STAFF'] },
  { prefix: '/payments', levels: ['ADMIN', 'MANAGER'] },
  { prefix: '/employees', levels: ['ADMIN'] },
  { prefix: '/branches', levels: ['ADMIN'] },
  { prefix: '/expenses', levels: ['ADMIN', 'MANAGER'] },
  { prefix: '/inventory', levels: ['ADMIN', 'MANAGER'] },
  { prefix: '/reports', levels: ['ADMIN', 'MANAGER'] },
  { prefix: '/notifications', levels: ['ADMIN', 'MANAGER'] },
];

export function hasRouteAccess(level: AccessLevel, pathname: string): boolean {
  const path = pathname || '/';
  if (path === '/') return level !== 'STAFF';

  const match = ROUTE_ACCESS.filter(
    ({ prefix }) => path === prefix || path.startsWith(`${prefix}/`)
  ).sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (!match) return true;
  return match.levels.includes(level);
}
