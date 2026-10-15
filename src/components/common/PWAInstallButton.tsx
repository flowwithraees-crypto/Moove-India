import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 text-xs font-bold shadow-md transition-all active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install PWA</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>iOS App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" /> Install RoamLite on iPhone
                </h3>
                <button 
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-300 space-y-2 leading-relaxed">
                1. Tap the <strong className="text-white">Share</strong> button in Safari toolbar.<br />
                2. Scroll down and choose <strong className="text-amber-400">Add to Home Screen</strong>.<br />
                3. Enjoy instant offline India backpacker maps!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
