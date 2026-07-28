'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function getEmployees(branchId?: string) {
  try {
    const where: Record<string, unknown> = { isActive: true };

    if (branchId) {
      where.branchId = branchId;
    }

    const employees = await prisma.employee.findMany({
      where,
      include: { branch: true },
      orderBy: { createdAt: 'desc' },
    });

    return { data: employees, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch employees' };
  }
}

export async function getEmployee(id: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        branch: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { items: true, customer: true },
        },
      },
    });

    if (!employee) {
      return { data: null, error: 'Employee not found' };
    }

    return { data: employee, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch employee' };
  }
}

export async function createEmployee(formData: FormData) {
  try {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const role = formData.get('role') as string;
    const password = (formData.get('password') as string) || null;

    if (!firstName || !lastName || !role) {
      return { data: null, error: 'First name, last name, and role are required' };
    }

    const branchId = (formData.get('branchId') as string) || null;

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email: (formData.get('email') as string) || null,
        phone: (formData.get('phone') as string) || null,
        role,
        ...(password ? { passwordHash: hashPassword(password) } : {}),
        ...(branchId ? { branch: { connect: { id: branchId } } } : {}),
      },
    });

    return { data: employee, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create employee' };
  }
}

export async function updateEmployee(id: string, formData: FormData) {
  try {
    const scalarFields = ['firstName', 'lastName', 'email', 'phone', 'role'];
    const data: Record<string, unknown> = {};

    for (const field of scalarFields) {
      const value = formData.get(field);
      if (value !== null) {
        data[field] = value === '' ? null : value;
      }
    }

    const branchId = formData.get('branchId');
    if (branchId !== null) {
      data.branch = branchId === '' ? { disconnect: true } : { connect: { id: branchId as string } };
    }

    const password = (formData.get('password') as string) || null;
    if (password) {
      data.passwordHash = hashPassword(password);
    }

    const employee = await prisma.employee.update({
      where: { id },
      data,
    });

    return { data: employee, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update employee' };
  }
}

export async function deleteEmployee(id: string) {
  try {
    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete employee' };
  }
}
