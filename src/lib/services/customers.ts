import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

export interface CreateCustomerInput {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  preferredContact?: string | null;
  branchId?: string | null;
  measurements?: Prisma.InputJsonValue | null;
}

function isUniqueError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';
}

export async function createCustomerRecord(input: CreateCustomerInput) {
  if (!input.firstName || !input.lastName || !input.phone) {
    throw new Error('First name, last name, and phone are required');
  }

  try {
    return await prisma.customer.create({
      data: {
        id: input.id,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email || null,
        address: input.address || null,
        notes: input.notes || null,
        preferredContact: input.preferredContact || 'SMS',
        measurements: input.measurements || undefined,
        ...(input.branchId ? { branch: { connect: { id: input.branchId } } } : {}),
      },
    });
  } catch (error) {
    if (isUniqueError(error)) {
      const existing = await prisma.customer.findUnique({ where: { id: input.id } });
      if (existing) return existing;
    }
    throw error;
  }
}
