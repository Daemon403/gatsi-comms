'use server';

import { prisma } from '@/lib/prisma';
import { requireAccess } from '@/lib/auth';

export async function getBranches() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });
    return { data: branches, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch branches' };
  }
}

export async function getBranch(id: string) {
  try {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) return { data: null, error: 'Branch not found' };
    return { data: branch, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch branch' };
  }
}

export async function createBranch(formData: FormData) {
  try {
    await requireAccess('ADMIN');

    const name = formData.get('name') as string;
    const address = (formData.get('address') as string) || null;
    const phone = (formData.get('phone') as string) || null;
    const email = (formData.get('email') as string) || null;

    if (!name) {
      return { data: null, error: 'Branch name is required' };
    }

    const branch = await prisma.branch.create({
      data: { name, address, phone, email },
    });

    return { data: branch, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create branch' };
  }
}

export async function updateBranch(id: string, formData: FormData) {
  try {
    await requireAccess('ADMIN');

    const name = formData.get('name') as string;
    const address = (formData.get('address') as string) || null;
    const phone = (formData.get('phone') as string) || null;
    const email = (formData.get('email') as string) || null;

    if (!name) {
      return { data: null, error: 'Branch name is required' };
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: { name, address, phone, email },
    });

    return { data: branch, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update branch' };
  }
}

export async function deleteBranch(id: string) {
  try {
    await requireAccess('ADMIN');

    await prisma.branch.delete({ where: { id } });
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete branch' };
  }
}
