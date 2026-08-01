import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getAccessLevel, getHomeRoute, hasRouteAccess } from '@/lib/roles';
import type { AccessLevel } from '@/lib/roles';

const SESSION_COOKIE = 'employee_session';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'gatsi-comms-secret-key-change-in-production';

let cachedKey: Buffer | null = null;
function sessionKey(): Buffer {
  if (!cachedKey) cachedKey = crypto.scryptSync(SESSION_SECRET, 'salt', 32);
  return cachedKey;
}

interface ProxySession {
  employeeId: string;
  email: string;
  name: string;
  role: string;
  accessLevel: AccessLevel;
}

function readSession(request: NextRequest): ProxySession | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const [ivHex, encrypted] = token.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', sessionKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const data = JSON.parse(decrypted) as Partial<ProxySession>;
    return {
      employeeId: data.employeeId || '',
      email: data.email || '',
      name: data.name || '',
      role: data.role || '',
      accessLevel: data.accessLevel || getAccessLevel(data.role),
    };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = readSession(request);
  const isAuthenticated = session !== null;

  // Public: the unified login page. Signed-in users skip straight to the app.
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Retired legacy employee portal -> unified app.
  if (pathname.startsWith('/employee/')) {
    const target = isAuthenticated
      ? getHomeRoute(session!.accessLevel)
      : '/login';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Every other route is protected.
  if (!isAuthenticated) {
    if (request.method !== 'GET') {
      return new NextResponse(null, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const level = session!.accessLevel;

  if (!hasRouteAccess(level, pathname)) {
    if (request.method !== 'GET') {
      return new NextResponse(null, { status: 403 });
    }
    return NextResponse.redirect(new URL(getHomeRoute(level), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|sitemap.xml|robots.txt|.*\\.(?:png|svg|jpg|jpeg|ico|webp|avif|gif|webmanifest|map)$).*)',
  ],
};
