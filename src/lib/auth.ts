import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const SESSION_COOKIE = 'employee_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'gatsi-comms-secret-key-change-in-production';

export interface SessionData {
  employeeId: string;
  email: string;
  name: string;
  role: string;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, hash] = passwordHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

function createSessionToken(data: SessionData): string {
  const payload = JSON.stringify(data);
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(SESSION_SECRET, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptSessionToken(token: string): SessionData | null {
  try {
    const [ivHex, encrypted] = token.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(SESSION_SECRET, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted) as SessionData;
  } catch {
    return null;
  }
}

export async function createSession(employeeId: string): Promise<void> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  if (!employee) throw new Error('Employee not found');

  const sessionData: SessionData = {
    employeeId: employee.id,
    email: employee.email || '',
    name: `${employee.firstName} ${employee.lastName}`,
    role: employee.role,
  };

  const token = createSessionToken(sessionData);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decryptSessionToken(token);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireEmployeeSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  return session;
}
