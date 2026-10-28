import React, { useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-slate-900/90 border-b border-cyan-500/20 px-4 py-2 text-xs text-slate-300 flex items-center justify-between backdrop-blur-md">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <span className="flex h-2 w-2 relative flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <div className="truncate">
          <span className="font-semibold text-cyan-400 font-mono-code uppercase mr-2 tracking-wider">
            [PROTOTYPE DISCLOSURE]
          </span>
          <span className="text-slate-400">
            ARMORSENSE is trained on industrial machinery telemetry (10,000 records). Physical vehicle/OBD-II hardware is currently simulated. Model outputs provide decision-support probabilities, not safety guarantees or RUL estimates.
          </span>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-200 transition-colors p-1 ml-3 flex-shrink-0"
        title="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
