import React from 'react';
import { 
  ArrowRight, 
  MapPin,
  AlertTriangle,
  FileCheck,
  CalendarCheck2,
  Ticket,
  Clock,
  Sparkles,
  Navigation2
} from 'lucide-react';
import type { RouteSearchResult } from '../types/transit';

interface RouteCardProps {
  result: RouteSearchResult;
  isSelected: boolean;
  onSelect: (result: RouteSearchResult) => void;
  onOpenMap: (result: RouteSearchResult) => void;
  onRequestBoarding?: (result: RouteSearchResult) => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  result,
  isSelected,
  onSelect,
  onOpenMap,
  onRequestBoarding,
}) => {
  const { route, originStop, destinationStop, intermediateStopCount, isRecommended } = result;

  return (
    <div
      onClick={() => onSelect(result)}
      className={`group bg-white rounded-2xl border transition-all duration-200 cursor-pointer p-5 sm:p-6 relative overflow-hidden ${
        isSelected
          ? 'border-[#0F1E36] ring-2 ring-[#0F1E36]/15 shadow-md'
          : 'border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-md shadow-2xs hover:-translate-y-0.5'
      }`}
    >
      {/* Top Left Selection Highlight Bar */}
      {isSelected && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#0F1E36] to-amber-500" />
      )}

      {/* Top Row: Route Identification & Status Badges */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Stylized Route Badge */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 font-black text-sm shrink-0 bg-[#0F1E36] shadow-sm border border-amber-500/30">
            #{route.routeNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[#0F1E36] group-hover:text-amber-700 transition-colors">
                {route.routeLabel}
              </h3>
              {route.isIncomplete && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                  Stops Unlisted
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Origin: <strong className="text-slate-800 font-semibold">{route.startingLocation}</strong>
            </p>
          </div>
        </div>

        {/* Quality & Recommendation Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {isRecommended && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Recommended
            </span>
          )}

          {route.isIncomplete ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
              Needs verification
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CalendarCheck2 className="w-3 h-3 text-emerald-600" />
              Scheduled
            </span>
          )}
        </div>
      </div>

      {/* Grounded Transit Journey Stage Box */}
      <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-[#FAF9F5] border border-[#EBE8E0]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* Origin Boarding Point */}
          <div className="flex items-start gap-2.5 min-w-0 max-w-[45%]">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-amber-700" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-900 bg-amber-200/60 px-1.5 py-0.5 rounded">
                  Boarding Point
                </span>
                <span className="text-xs font-mono font-bold text-amber-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  {result.departureTime}
                </span>
              </div>
              <p className="font-bold text-xs sm:text-sm text-[#0F1E36] truncate mt-0.5" title={originStop.name}>
                {originStop.name}
              </p>
            </div>
          </div>

          {/* Connected Route Corridor Track Indicator */}
          <div className="flex flex-col items-center justify-center shrink-0 px-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#DCD8D0] shadow-2xs">
              <span className="text-[10px] font-mono font-bold text-[#0F1E36]">
                {intermediateStopCount} {intermediateStopCount === 1 ? 'stop' : 'stops'}
              </span>
              <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />
            </div>
            <span className="text-[9px] font-mono text-slate-400 mt-0.5">
              Direct Corridor
            </span>
          </div>

          {/* Terminus Destination */}
          <div className="flex items-start gap-2.5 min-w-0 max-w-[45%] text-right">
            <div className="min-w-0">
              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-900 bg-emerald-200/60 px-1.5 py-0.5 rounded">
                  Campus Terminus
                </span>
                <span className="text-xs font-bold text-emerald-800 font-mono">CVR Vastunagar</span>
              </div>
              <p className="font-bold text-xs sm:text-sm text-[#0F1E36] truncate mt-0.5" title={destinationStop.name}>
                {destinationStop.name}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center shrink-0 mt-0.5">
              <Navigation2 className="w-4 h-4 text-emerald-700" />
            </div>
          </div>

        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="mt-4 pt-3.5 border-t border-[#F0EEE9] flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
          <FileCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Official Circular Record</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Missed Bus Seat Request */}
          {onRequestBoarding && !route.isIncomplete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestBoarding(result);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              title="Request seat on this bus"
            >
              <Ticket className="w-3.5 h-3.5 text-amber-700" />
              <span>Request Seat</span>
            </button>
          )}

          {/* Open Corridor on Map */}
          {!route.isIncomplete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMap(result);
              }}
              className="px-3 py-1.5 rounded-xl border border-[#DCD8D0] hover:bg-[#FAF9F5] text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              title="Inspect route corridor on interactive map"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Map</span>
            </button>
          )}

          {/* View Full Stop Order */}
          <button
            type="button"
            onClick={() => onSelect(result)}
            className="px-3.5 py-1.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
          >
            <span>Stop Order</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

    </div>
  );
};
