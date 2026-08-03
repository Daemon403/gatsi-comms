import { prisma } from '@/lib/prisma';

export interface CreateExpenseInput {
  id: string;
  branchId?: string | null;
  employeeId?: string | null;
  category: string;
  description: string;
  amount: number;
  date?: string | null;
  receipt?: string | null;
}

function isUniqueError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';
}

export async function createExpenseRecord(input: CreateExpenseInput) {
  if (!input.category || !input.description || isNaN(input.amount) || input.amount <= 0) {
    throw new Error('Category, description, and valid amount are required');
  }

  if (input.employeeId) {
    const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
    if (!employee) {
      throw new Error('Employee not found. Please select a valid employee.');
    }
  }

  try {
    return await prisma.expense.create({
      data: {
        id: input.id,
        category: input.category,
        description: input.description,
        amount: input.amount,
        date: input.date ? new Date(input.date) : new Date(),
        receipt: input.receipt || null,
        ...(input.branchId ? { branch: { connect: { id: input.branchId } } } : {}),
        ...(input.employeeId ? { employee: { connect: { id: input.employeeId } } } : {}),
      },
    });
  } catch (error) {
    if (isUniqueError(error)) {
      const existing = await prisma.expense.findUnique({ where: { id: input.id } });
      if (existing) return existing;
    }
    throw error;
  }
}
