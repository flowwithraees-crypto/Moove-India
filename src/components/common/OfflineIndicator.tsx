import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-sm flex items-center justify-between gap-3 rounded-xl bg-amber-600/95 backdrop-blur border border-amber-400 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-2xl">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 animate-bounce" />
        <span>Offline Mode — Cached India map & spots active.</span>
      </div>
      <span className="bg-slate-950 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
        OFFLINE
      </span>
    </div>
  );
};
