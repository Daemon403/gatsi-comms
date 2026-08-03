'use client';

export interface PendingOp {
  opId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
}

export interface SyncFailure {
  opId: string;
  type: string;
  error: string;
  at: string;
}

const DB_NAME = 'gatsi-comms-offline';
const DB_VERSION = 1;
const OUTBOX = 'outbox';
const META = 'meta';
const READS = 'reads';

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeQueue(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function notifyQueue() {
  listeners.forEach((fn) => fn());
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OUTBOX)) {
        db.createObjectStore(OUTBOX, { keyPath: 'opId' });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(READS)) {
        db.createObjectStore(READS, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
  return dbPromise;
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

function getAll<T>(store: string): Promise<T[]> {
  return run(store, 'readonly', (s) => s.getAll());
}

function put(store: string, value: unknown): Promise<IDBValidKey> {
  return run(store, 'readwrite', (s) => s.put(value));
}

function deleteKeys(store: string, keys: string[]): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const objStore = tx.objectStore(store);
        keys.forEach((k) => objStore.delete(k));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

export async function enqueueOp(type: string, payload: Record<string, unknown>): Promise<PendingOp> {
  const op: PendingOp = {
    opId: crypto.randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  await put(OUTBOX, op);
  notifyQueue();
  return op;
}

export async function getPendingOps(): Promise<PendingOp[]> {
  const ops = await getAll<PendingOp>(OUTBOX);
  return ops.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function removeOps(opIds: string[]): Promise<void> {
  if (opIds.length === 0) return;
  await deleteKeys(OUTBOX, opIds);
}

export async function updateOp(op: PendingOp): Promise<void> {
  await put(OUTBOX, op);
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await put(META, { key, value });
}

export async function getMeta(key: string): Promise<unknown> {
  return run(META, 'readonly', (s) => s.get(key)).then((row) =>
    row && typeof row === 'object' && 'value' in row ? (row as { value: unknown }).value : undefined
  );
}

export async function getFailures(): Promise<SyncFailure[]> {
  const failures = await getMeta('failures');
  return Array.isArray(failures) ? (failures as SyncFailure[]) : [];
}

export async function appendFailure(failure: SyncFailure): Promise<void> {
  const current = await getFailures();
  const next = [...current, failure].slice(-50);
  await setMeta('failures', next);
}

export async function clearFailures(): Promise<void> {
  await setMeta('failures', []);
}

export async function cacheRead(key: string, data: unknown): Promise<void> {
  await put(READS, { key, data, at: new Date().toISOString() });
}

export async function getCachedRead<T>(key: string): Promise<T | null> {
  return run(READS, 'readonly', (s) => s.get(key)).then((row) =>
    row && typeof row === 'object' && 'data' in row ? (row as { data: T }).data : null
  );
}
