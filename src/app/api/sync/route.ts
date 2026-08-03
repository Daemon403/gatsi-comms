import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createOrderRecord, updateOrderStatusRecord } from '@/lib/services/orders';
import { createPaymentRecord } from '@/lib/services/payments';
import { createExpenseRecord } from '@/lib/services/expenses';
import { createCustomerRecord } from '@/lib/services/customers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BATCH = 50;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const ops = Array.isArray((body as { ops?: unknown })?.ops)
    ? ((body as { ops: unknown[] }).ops as { opId: string; type: string; payload: Record<string, unknown> }[]).slice(0, MAX_BATCH)
    : [];

  const results: { opId: string; ok: boolean; error?: string; data?: unknown }[] = [];

  for (const op of ops) {
    const { opId, type, payload } = op;
    try {
      const data = await applyOp(type, payload);
      results.push({ opId, ok: true, data });
    } catch (error) {
      results.push({
        opId,
        ok: false,
        error: error instanceof Error ? error.message : 'Operation failed',
      });
    }
  }

  return NextResponse.json({ results, syncedAt: new Date().toISOString() });
}

async function applyOp(type: string, payload: Record<string, unknown>) {
  switch (type) {
    case 'customer.create':
      return createCustomerRecord({ id: (payload.id as string) || crypto.randomUUID(), ...payload } as Parameters<typeof createCustomerRecord>[0]);
    case 'order.create':
      return createOrderRecord({ id: (payload.id as string) || crypto.randomUUID(), ...payload } as Parameters<typeof createOrderRecord>[0]);
    case 'order.status':
      return updateOrderStatusRecord(payload.orderId as string, payload.status as string);
    case 'payment.create':
      return createPaymentRecord({ id: (payload.id as string) || crypto.randomUUID(), ...payload } as Parameters<typeof createPaymentRecord>[0]);
    case 'expense.create':
      return createExpenseRecord({ id: (payload.id as string) || crypto.randomUUID(), ...payload } as Parameters<typeof createExpenseRecord>[0]);
    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
}
