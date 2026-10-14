import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Bell, CheckCircle2 } from 'lucide-react';
import type { TransportAdvisory } from '../types/transit';

interface ServiceAlertsSectionProps {
  advisories: TransportAdvisory[];
  onSelectRouteAlert?: (routeId: string) => void;
  isCloudConnected?: boolean;
}

export const ServiceAlertsSection: React.FC<ServiceAlertsSectionProps> = ({
  advisories,
  isCloudConnected = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const activeAdvisories = advisories.filter((a) => a.status !== 'RESOLVED');
  const topAdvisory = activeAdvisories[0];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden transition-all text-xs">
      {/* Compact Advisory Bar */}
      <div 
        className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF9F5] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
            activeAdvisories.length > 0
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {activeAdvisories.length > 0 ? (
              <Bell className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </div>

          <div className="truncate text-slate-600 flex items-center gap-2">
            <span className="text-[#0F1E36] font-bold">
              {activeAdvisories.length > 0
                ? `Transport Advisory (${activeAdvisories.length})`
                : 'Corridor Status:'}
            </span>
            <span className="truncate text-slate-700 font-medium">
              {topAdvisory ? topAdvisory.title : 'All 54 college corridors operating on schedule'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isCloudConnected && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-slate-600 hover:text-[#0F1E36] flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span>{expanded ? 'Hide Details' : 'View Notices'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded List */}
      {expanded && (
        <div className="border-t border-[#E5E2DC] bg-[#FAF9F5] p-4 sm:p-5 space-y-3 animate-in fade-in duration-150">
          {activeAdvisories.length === 0 ? (
            <div className="p-4 rounded-xl bg-white border border-[#E5E2DC] text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="font-bold text-[#0F1E36] text-xs">No Active Service Advisories</p>
              <p className="text-[11px] text-slate-500">
                All 54 official bus routes are operating according to the college circular timetable.
              </p>
            </div>
          ) : (
            activeAdvisories.map((advisory) => (
              <div
                key={advisory.id}
                className={`p-3.5 rounded-xl border text-xs bg-white space-y-2 shadow-2xs ${
                  advisory.type === 'verification' || advisory.severity === 'high'
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-[#E5E2DC]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {advisory.routeNumber && (
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#FAF9F5] text-amber-900 border border-[#E5E2DC] text-[10px]">
                        {advisory.routeNumber}
                      </span>
                    )}
                    <span className="font-bold text-[#0F1E36]">{advisory.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      advisory.severity === 'high' ? 'bg-red-50 text-red-700 border border-red-200' :
                      advisory.severity === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {advisory.severity || 'low'} priority
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{advisory.date}</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-xs">{advisory.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
