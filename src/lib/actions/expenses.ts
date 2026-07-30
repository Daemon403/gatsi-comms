'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
    const branchId = (formData.get('branchId') as string) || null;
    const employeeId = (formData.get('employeeId') as string) || null;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const date = formData.get('date') ? new Date(formData.get('date') as string) : new Date();
    const receipt = (formData.get('receipt') as string) || null;

    if (!category || !description || isNaN(amount) || amount <= 0) {
      return { data: null, error: 'Category, description, and valid amount are required' };
    }

    if (employeeId) {
      const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
      if (!employee) {
        return { data: null, error: 'Employee not found. Please select a valid employee.' };
      }
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        description,
        amount,
        date,
        receipt,
        ...(branchId ? { branch: { connect: { id: branchId } } } : {}),
        ...(employeeId ? { employee: { connect: { id: employeeId } } } : {}),
      },
    });
    revalidatePath('/');
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

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete expense' };
  }
}
