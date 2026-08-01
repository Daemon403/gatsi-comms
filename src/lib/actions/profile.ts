'use server';

import { prisma } from '@/lib/prisma';
import {
  createSession,
  hashPassword,
  requireEmployeeSession,
  verifyPassword,
} from '@/lib/auth';

function cleanValue(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function updateProfile(formData: FormData) {
  try {
    const session = await requireEmployeeSession();

    const firstName = cleanValue(formData.get('firstName'));
    const lastName = cleanValue(formData.get('lastName'));
    const email = cleanValue(formData.get('email')).toLowerCase();
    const phone = cleanValue(formData.get('phone'));

    if (!firstName || !lastName) {
      return { data: null, error: 'First name and last name are required' };
    }

    if (email) {
      const existing = await prisma.employee.findFirst({
        where: { email, id: { not: session.employeeId }, isActive: true },
        select: { id: true },
      });
      if (existing) {
        return { data: null, error: 'That email is already in use by another employee' };
      }
    }

    const employee = await prisma.employee.update({
      where: { id: session.employeeId },
      data: { firstName, lastName, email: email || null, phone: phone || null },
    });

    await createSession(employee.id);

    return {
      data: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const session = await requireEmployeeSession();

    if (!currentPassword) {
      return { error: 'Enter your current password' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { error: 'New password must be at least 6 characters' };
    }

    const employee = await prisma.employee.findUnique({
      where: { id: session.employeeId },
      select: { passwordHash: true },
    });

    if (!employee?.passwordHash) {
      return { error: 'This account does not have a password set up' };
    }

    if (!verifyPassword(currentPassword, employee.passwordHash)) {
      return { error: 'Current password is incorrect' };
    }

    await prisma.employee.update({
      where: { id: session.employeeId },
      data: { passwordHash: hashPassword(newPassword) },
    });

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to change password',
    };
  }
}
