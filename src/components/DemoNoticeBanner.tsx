import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const DemoNoticeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-[#FEF3C7] border-b border-amber-200/90 text-amber-950 text-xs sm:text-sm py-2 px-4 shadow-[0_1px_2px_rgba(217,119,6,0.05)]">
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-tight">
            <strong className="font-bold text-amber-950">Official CVR Transit Dataset:</strong>{' '}
            CollegeNav now operates on all 54 official bus routes extracted from the CVR College circular.{' '}
            <span className="font-semibold">Driver phone numbers have been omitted for privacy. Live GPS tracking hardware integration is scheduled for Phase 4.</span>
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-800 hover:text-amber-950 p-1 rounded-md transition-colors shrink-0"
          title="Dismiss notification"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
