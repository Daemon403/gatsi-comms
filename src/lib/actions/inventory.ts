'use server';

import { prisma } from '@/lib/prisma';

export async function getInventoryItems(search?: string) {
  try {
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return { data: items, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch inventory items' };
  }
}

export async function createInventoryItem(formData: FormData) {
  try {
    const data = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      quantity: parseInt(formData.get('quantity') as string, 10) || 0,
      unit: formData.get('unit') as string,
      minQuantity: parseInt(formData.get('minQuantity') as string, 10) || 0,
      unitCost: parseFloat(formData.get('unitCost') as string) || 0,
      supplier: (formData.get('supplier') as string) || null,
    };

    if (!data.name || !data.category || !data.unit) {
      return { data: null, error: 'Name, category, and unit are required' };
    }

    const item = await prisma.inventoryItem.create({ data });
    return { data: item, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create inventory item' };
  }
}

export async function updateInventoryItem(id: string, formData: FormData) {
  try {
    const data: Record<string, unknown> = {};

    const fields = ['name', 'category', 'quantity', 'unit', 'minQuantity', 'unitCost', 'supplier'];
    for (const field of fields) {
      const value = formData.get(field);
      if (value !== null) {
        if (field === 'quantity' || field === 'minQuantity') {
          data[field] = parseInt(value as string, 10) || 0;
        } else if (field === 'unitCost') {
          data[field] = parseFloat(value as string) || 0;
        } else {
          data[field] = value === '' ? null : value;
        }
      }
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    return { data: item, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update inventory item' };
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    await prisma.inventoryItem.delete({
      where: { id },
    });

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete inventory item' };
  }
}

export async function restockItem(id: string, quantity: number) {
  try {
    if (quantity <= 0) {
      return { data: null, error: 'Quantity must be greater than zero' };
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: { increment: quantity },
        lastRestocked: new Date(),
      },
    });

    return { data: item, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to restock item' };
  }
}
