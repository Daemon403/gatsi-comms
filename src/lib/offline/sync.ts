'use client';

import { useEffect, useState } from 'react';
import {
  appendFailure,
  enqueueOp,
  getFailures,
  getPendingOps,
  getMeta,
  setMeta,
  notifyQueue,
  subscribeQueue,
  updateOp,
  removeOps,
} from './queue';
import type { PendingOp, SyncFailure } from './queue';

export type SubmitResult =
  | { queued: true; opId: string }
  | { queued: false; result: { error?: string | null; data?: unknown } | null };

export interface FlushResult {
  synced: number;
  remaining: number;
  httpError: string | null;
}

let flushing = false;

async function postOps(
  ops: PendingOp[]
): Promise<{
  applied: Set<string>;
  appliedData: Map<string, unknown>;
  failed: { opId: string; error: string }[];
  httpError: string | null;
}> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ops: ops.map((o) => ({ opId: o.opId, type: o.type, payload: o.payload })) }),
    });

    if (res.status === 401) {
      return { applied: new Set(), appliedData: new Map(), failed: [], httpError: 'auth' };
    }

    if (!res.ok) {
      return { applied: new Set(), appliedData: new Map(), failed: [], httpError: `http ${res.status}` };
    }

    const body = (await res.json()) as { results?: { opId: string; ok: boolean; error?: string; data?: unknown }[] };
    const applied = new Set<string>();
    const appliedData = new Map<string, unknown>();
    const failed: { opId: string; error: string }[] = [];
    for (const r of body.results || []) {
      if (r.ok) {
        applied.add(r.opId);
        if ('data' in r) appliedData.set(r.opId, r.data);
      } else {
        failed.push({ opId: r.opId, error: r.error || 'Sync failed' });
      }
    }
    return { applied, appliedData, failed, httpError: null };
  } catch {
    return { applied: new Set(), appliedData: new Map(), failed: [], httpError: 'network' };
  }
}

const MAX_ATTEMPTS = 5;

export async function flushOutbox(): Promise<FlushResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, remaining: 0, httpError: 'offline' };
  }
  if (flushing) return { synced: 0, remaining: 0, httpError: null };
  flushing = true;

  try {
    const ops = await getPendingOps();
    if (ops.length === 0) {
      await setMeta('lastSyncedAt', new Date().toISOString());
      notifyQueue();
      return { synced: 0, remaining: 0, httpError: null };
    }

    const { applied, failed, httpError } = await postOps(ops);

    const toRemove: string[] = [];
    const toUpdate: PendingOp[] = [];

    for (const op of ops) {
      if (applied.has(op.opId)) {
        toRemove.push(op.opId);
        continue;
      }
      const opError = failed.find((f) => f.opId === op.opId);
      if (opError) {
        const attempts = op.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) {
          toRemove.push(op.opId);
          await appendFailure({
            opId: op.opId,
            type: op.type,
            error: opError.error,
            at: new Date().toISOString(),
          });
        } else {
          toUpdate.push({ ...op, attempts });
        }
      } else {
        toUpdate.push(op);
      }
    }

    await removeOps(toRemove);
    for (const op of toUpdate) {
      await updateOp(op);
    }

    if (applied.size > 0) {
      await setMeta('lastSyncedAt', new Date().toISOString());
    }

    notifyQueue();
    return { synced: applied.size, remaining: toUpdate.length, httpError };
  } finally {
    flushing = false;
  }
}

export async function submitOp(type: string, payload: Record<string, unknown>): Promise<SubmitResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const op = await enqueueOp(type, payload);
    return { queued: true, opId: op.opId };
  }

  const op: PendingOp = {
    opId: crypto.randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  const { applied, appliedData, failed, httpError } = await postOps([op]);

  if (applied.has(op.opId)) {
    return { queued: false, result: { error: null, data: appliedData.get(op.opId) } };
  }

  const opError = failed.find((f) => f.opId === op.opId);
  if (opError && httpError === null) {
    return { queued: false, result: { error: opError.error } };
  }

  // Transport failure (offline edge / server unreachable) — keep the change locally.
  const enqueued = await enqueueOp(type, payload);
  return { queued: true, opId: enqueued.opId };
}

export interface SyncStatus {
  online: boolean;
  pending: number;
  syncing: boolean;
  lastSyncedAt: string | null;
  failures: SyncFailure[];
}

export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>({
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    pending: 0,
    syncing: false,
    lastSyncedAt: null,
    failures: [],
  });

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const [ops, failures, lastSyncedAt] = await Promise.all([
        getPendingOps(),
        getFailures(),
        getMeta('lastSyncedAt'),
      ]);
      if (cancelled) return;
      setStatus((s) => ({
        ...s,
        pending: ops.length,
        failures,
        lastSyncedAt: (lastSyncedAt as string | null) || null,
      }));
    };

    refresh();

    const unsubscribe = subscribeQueue(refresh);

    const onOnline = () => {
      setStatus((s) => ({ ...s, online: true, syncing: true }));
      flushOutbox().finally(() => {
        if (!cancelled) setStatus((s) => ({ ...s, syncing: false }));
      });
    };
    const onOffline = () => setStatus((s) => ({ ...s, online: false }));

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    flushOutbox().finally(() => {
      if (!cancelled) setStatus((s) => ({ ...s, syncing: false }));
    });

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return status;
}
