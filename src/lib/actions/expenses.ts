'use server';

import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { revalidatePath, refresh } from 'next/cache';
import { createExpenseRecord } from '@/lib/services/expenses';

interface ExpenseFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
}

export async function getExpenses(filters: ExpenseFilters = {}) {
  try {
    const where: Record<string, unknown> = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        (where.date as Record<string, unknown>).gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        (where.date as Record<string, unknown>).lte = new Date(filters.dateTo);
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { branch: true, employee: true },
      orderBy: { date: 'desc' },
    });

    return { data: expenses, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch expenses' };
  }
}

export async function createExpense(formData: FormData) {
  try {
    const expense = await createExpenseRecord({
      id: crypto.randomUUID(),
      branchId: (formData.get('branchId') as string) || null,
      employeeId: (formData.get('employeeId') as string) || null,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      date: (formData.get('date') as string) || null,
      receipt: (formData.get('receipt') as string) || null,
    });
    revalidatePath('/');
    refresh();
    return { data: expense, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create expense' };
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({
      where: { id },
    });
    revalidatePath('/');
    refresh();

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete expense' };
  }
}
