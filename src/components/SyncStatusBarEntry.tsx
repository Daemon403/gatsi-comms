'use client';

import dynamic from 'next/dynamic';

const SyncStatusBar = dynamic(() => import('./SyncStatusBar'), {
  ssr: false,
});

export default function SyncStatusBarEntry() {
  return <SyncStatusBar />;
}
