import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const DemoNoticeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-50/70 border-b border-amber-200/60 text-xs py-2 px-4 shadow-2xs backdrop-blur-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          </span>
          <p className="leading-tight text-slate-700 text-xs truncate sm:text-clip">
            <strong className="font-bold text-[#0F1E36]">Official Transit Directory:</strong>{' '}
            All <strong className="text-[#0F1E36]">54 scheduled CVR routes</strong> extracted directly from the official transport circular. Personal contact numbers excluded for privacy.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors shrink-0"
          title="Dismiss notification"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
