'use client';

import { useState } from 'react';
import { WifiOff, CloudUpload, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useSyncStatus, flushOutbox } from '@/lib/offline/sync';

export default function SyncStatusBar() {
  const { online, pending, syncing, failures } = useSyncStatus();
  const [manualSyncing, setManualSyncing] = useState(false);

  if (online && pending === 0 && failures.length === 0) {
    return null;
  }

  if (!online) {
    return (
      <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-xs font-medium text-white">
        <WifiOff size={14} />
        <span>
          You&apos;re offline — viewing saved data.
          {pending > 0 ? ` ${pending} change${pending === 1 ? '' : 's'} will sync when you're back online.` : ''}
        </span>
      </div>
    );
  }

  if (syncing || manualSyncing) {
    return (
      <div className="flex items-center justify-center gap-2 bg-blue-600 px-4 py-2 text-xs font-medium text-white">
        <RefreshCw size={14} className="animate-spin" />
        <span>Syncing your changes…</span>
      </div>
    );
  }

  if (failures.length > 0) {
    return (
      <div className="flex items-center justify-center gap-2 bg-rose-600 px-4 py-2 text-xs font-medium text-white">
        <AlertTriangle size={14} />
        <span>
          {failures.length} change{failures.length === 1 ? '' : 's'} could not be synced. Contact your administrator.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-blue-600 px-4 py-2 text-xs font-medium text-white">
      <CloudUpload size={14} />
      <span>
        {pending} change{pending === 1 ? '' : 's'} saved offline and waiting to sync.
      </span>
      <button
        type="button"
        onClick={async () => {
          setManualSyncing(true);
          try {
            await flushOutbox();
          } finally {
            setManualSyncing(false);
          }
        }}
        className="ml-1 inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 font-semibold text-white transition-colors hover:bg-white/30"
      >
        <CheckCircle2 size={12} />
        Sync now
      </button>
    </div>
  );
}
