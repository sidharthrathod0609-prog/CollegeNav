import React from 'react';
import { SearchX, RotateCcw, MapPin, Compass } from 'lucide-react';

interface EmptyStateProps {
  origin: string;
  destination: string;
  onReset: () => void;
  onSelectHub: (hubName: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  origin,
  destination,
  onReset,
  onSelectHub,
}) => {
  const suggestedHubs = [
    'LB Nagar',
    'Dilsukhnagar',
    'Uppal',
    'Koti',
    'ECIL',
    'Tarnaka',
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-4">
        <SearchX className="w-7 h-7 text-amber-600" />
      </div>

      <h3 className="text-lg sm:text-xl font-black text-[#0F1E36] tracking-tight">
        No Matching Bus Route Found
      </h3>

      <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
        No scheduled CVR college bus route directly connects{' '}
        <span className="font-bold text-[#0F1E36]">"{origin || 'your search'}"</span> and{' '}
        <span className="font-bold text-[#0F1E36]">"{destination || 'College (CVR Campus)'}"</span>.
      </p>

      {/* Suggested Transit Confluence Hubs */}
      <div className="mt-6 p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC] text-left">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F1E36] uppercase tracking-wider mb-2">
          <Compass className="w-3.5 h-3.5 text-amber-600" />
          <span>Major Transit Confluence Hubs</span>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          CVR college buses converge at these major junctions before proceeding to the Vastunagar Mangalpally campus:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {suggestedHubs.map((hub) => (
            <button
              key={hub}
              type="button"
              onClick={() => onSelectHub(hub)}
              className="text-left px-3 py-2 rounded-xl bg-white hover:bg-amber-50/60 hover:border-amber-300 border border-[#DCD8D0] text-xs font-semibold text-[#0F1E36] flex items-center justify-between transition-colors group"
            >
              <span className="truncate">{hub}</span>
              <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0 ml-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Reset Action */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Reset Search & View All 54 Routes</span>
        </button>
      </div>

      <p className="mt-4 text-[11px] font-mono text-slate-400">
        CVR Transport Notice: All 54 official routes operate on radial corridors toward CVRCE Vastunagar, Mangalpally.
      </p>
    </div>
  );
};
