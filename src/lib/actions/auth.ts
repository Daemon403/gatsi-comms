'use server';

import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession, destroySession, getSession } from '@/lib/auth';
import { getAccessLevel } from '@/lib/roles';
import type { AccessLevel } from '@/lib/roles';

export async function employeeLogin(email: string, password: string) {
  try {
    if (!email || !password) {
      return { error: 'Email and password are required' };
    }

    const employee = await prisma.employee.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
    });

    if (!employee) {
      return { error: 'Invalid email or password' };
    }

    if (!employee.passwordHash) {
      return { error: 'Account not set up for login. Please contact your administrator.' };
    }

    const isValid = verifyPassword(password, employee.passwordHash);
    if (!isValid) {
      return { error: 'Invalid email or password' };
    }

    await createSession(employee.id);

    return {
      data: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        role: employee.role,
        accessLevel: getAccessLevel(employee.role),
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Login failed' };
  }
}

export async function employeeLogout() {
  await destroySession();
  return { error: null };
}

export async function getCurrentEmployee() {
  const session = await getSession();
  if (!session) return null;

  const employee = await prisma.employee.findUnique({
    where: { id: session.employeeId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      branch: { select: { name: true } },
    },
  });

  if (!employee) return null;

  return {
    ...employee,
    accessLevel: getAccessLevel(employee.role) as AccessLevel,
  };
}
