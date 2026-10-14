import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Bell, AlertTriangle, CheckCircle2, History } from 'lucide-react';
import type { TransportAdvisory } from '../types/transit';

interface ServiceAlertsSectionProps {
  advisories: TransportAdvisory[];
  onSelectRouteAlert?: (routeId: string) => void;
  isCloudConnected?: boolean;
}

export const ServiceAlertsSection: React.FC<ServiceAlertsSectionProps> = ({
  advisories,
  onSelectRouteAlert,
  isCloudConnected = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  const activeAdvisories = advisories.filter((a) => a.status !== 'RESOLVED');
  const resolvedAdvisories = advisories.filter((a) => a.status === 'RESOLVED');

  const topAdvisory = activeAdvisories[0];

  return (
    <div className="bg-white rounded-xl border border-[#E5E2DC] shadow-[0_1px_3px_rgba(15,30,54,0.03)] overflow-hidden transition-all text-xs">
      {/* Compact Advisory Bar */}
      <div 
        className="px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF9F5] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
            activeAdvisories.length > 0
              ? 'bg-amber-50 border border-amber-200 text-amber-700'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
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
                ? `Transport Advisories (${activeAdvisories.length})`
                : 'Service Status:'}
            </span>
            <span className="truncate">
              {topAdvisory ? topAdvisory.title : 'All 54 college corridors operating on schedule'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isCloudConnected && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Feed
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-slate-500 hover:text-[#0F1E36] flex items-center gap-1 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          >
            <span>{expanded ? 'Hide' : 'View all'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded List */}
      {expanded && (
        <div className="border-t border-[#E5E2DC] bg-[#FAF9F5] p-3 sm:p-4 space-y-3">
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
                className={`p-3 rounded-lg border text-xs bg-white ${
                  advisory.type === 'verification' || advisory.severity === 'high'
                    ? 'border-amber-300 bg-amber-50/40'
                    : 'border-[#E5E2DC]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {advisory.routeNumber && (
                      <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200 text-[11px]">
                        {advisory.routeNumber}
                      </span>
                    )}
                    {advisory.type === 'verification' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    )}
                    <span className="font-bold text-[#0F1E36]">{advisory.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{advisory.date}</span>
                </div>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  {advisory.message}
                </p>
                {advisory.routeNumber && onSelectRouteAlert && (
                  <button
                    type="button"
                    onClick={() => onSelectRouteAlert('cvr-route-21')}
                    className="mt-2 text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 hover:underline"
                  >
                    View route in schedule
                  </button>
                )}
              </div>
            ))
          )}

          {/* Past / Resolved Advisories Toggle */}
          {resolvedAdvisories.length > 0 && (
            <div className="pt-2 border-t border-[#E5E2DC]">
              <button
                type="button"
                onClick={() => setShowResolved(!showResolved)}
                className="text-xs font-bold text-slate-600 hover:text-[#0F1E36] flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {showResolved ? 'Hide Resolved Notices' : `View Past Resolved Notices (${resolvedAdvisories.length})`}
                </span>
              </button>

              {showResolved && (
                <div className="mt-2 space-y-2">
                  {resolvedAdvisories.map((advisory) => (
                    <div
                      key={advisory.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white/70 text-xs opacity-75"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-700 line-through">{advisory.title}</span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          RESOLVED
                        </span>
                      </div>
                      <p className="mt-1 text-slate-500 text-[11px]">{advisory.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
