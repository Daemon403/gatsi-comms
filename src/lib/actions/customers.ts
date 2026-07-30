'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, refresh } from 'next/cache';

export async function getCustomers(search?: string, branchId?: string) {
  try {
    const where: Record<string, unknown> = { isActive: true };

    if (branchId) {
      where.branchId = branchId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: { branch: true },
      orderBy: { createdAt: 'desc' },
    });

    return { data: customers, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch customers' };
  }
}

export async function getCustomer(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        branch: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { items: true, payments: true },
        },
      },
    });

    if (!customer) {
      return { data: null, error: 'Customer not found' };
    }

    return { data: customer, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch customer' };
  }
}

export async function createCustomer(formData: FormData) {
  try {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phone = formData.get('phone') as string;
    const email = (formData.get('email') as string) || null;
    const address = (formData.get('address') as string) || null;
    const notes = (formData.get('notes') as string) || null;
    const preferredContact = (formData.get('preferredContact') as string) || 'SMS';
    const branchId = (formData.get('branchId') as string) || null;
    const measurementsRaw = (formData.get('measurements') as string) || null;

    if (!firstName || !lastName || !phone) {
      return { data: null, error: 'First name, last name, and phone are required' };
    }

    let measurements = null;
    if (measurementsRaw) {
      try { measurements = JSON.parse(measurementsRaw); } catch { /* ignore */ }
    }

    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        address,
        notes,
        preferredContact,
        measurements,
        ...(branchId ? { branch: { connect: { id: branchId } } } : {}),
      },
    });
    revalidatePath('/');
    refresh();
    return { data: customer, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create customer' };
  }
}

export async function updateCustomer(id: string, formData: FormData) {
  try {
    const scalarFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'notes', 'preferredContact'];
    const data: Record<string, unknown> = {};

    for (const field of scalarFields) {
      const value = formData.get(field);
      if (value !== null) {
        data[field] = value === '' ? null : value;
      }
    }

    const measurementsRaw = (formData.get('measurements') as string) || null;
    if (measurementsRaw !== null) {
      try { data.measurements = JSON.parse(measurementsRaw); } catch { /* ignore */ }
    }

    const branchId = formData.get('branchId');
    if (branchId !== null) {
      data.branch = branchId === '' ? { disconnect: true } : { connect: { id: branchId as string } };
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    return { data: customer, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update customer' };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath('/');
    refresh();

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete customer' };
  }
}
