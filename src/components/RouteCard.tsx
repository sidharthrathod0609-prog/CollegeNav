import React from 'react';
import { 
  ArrowRight, 
  MapPin,
  AlertTriangle,
  FileCheck,
  CalendarCheck2,
  Ticket
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
      className={`group bg-white rounded-xl border transition-all duration-150 cursor-pointer p-4 sm:p-5 ${
        isSelected
          ? 'border-[#0F1E36] ring-2 ring-[#0F1E36]/10 shadow-sm'
          : 'border-[#E5E2DC] hover:border-[#CBD5E1] shadow-[0_1px_3px_rgba(15,30,54,0.03)]'
      }`}
    >
      {/* Top Row: Route Number, Status Badges */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 bg-[#0F1E36]">
            #{route.routeNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#0F1E36] group-hover:text-amber-800 transition-colors">
                {route.routeLabel}
              </h3>
              {route.isIncomplete && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                  Stops Unlisted
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium line-clamp-1">
              Starting from: <strong className="text-slate-700">{route.startingLocation}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isRecommended && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-950 border border-amber-300">
              Recommended match
            </span>
          )}

          {route.isIncomplete ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
              Needs verification
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CalendarCheck2 className="w-3 h-3 text-emerald-600" />
              Scheduled Route
            </span>
          )}
        </div>
      </div>

      {/* Transit Journey Summary: Pickup ➔ Intermediate Corridor ➔ College Destination */}
      <div className="mt-3.5 pt-3.5 border-t border-[#F0EEE9] grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-xs sm:text-sm">
        
        {/* Origin Pickup */}
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Boarding Point</span>
          <p className="font-semibold text-[#0F1E36] truncate" title={originStop.name}>
            {originStop.name}
          </p>
          <span className="font-mono text-xs font-bold text-amber-800">
            {result.departureTime}
          </span>
        </div>

        {/* Intermediate Corridor Stops */}
        <div className="flex flex-col items-center px-2 text-center shrink-0">
          {route.isIncomplete ? (
            <span className="text-[11px] font-semibold text-amber-800">
              Stops not listed
            </span>
          ) : (
            <>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {intermediateStopCount} stop{intermediateStopCount === 1 ? '' : 's'}
              </span>
              <div className="w-14 sm:w-20 h-0.5 bg-[#DCD8D0] relative my-1">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-600"></div>
              </div>
              <span className="text-[11px] text-slate-500">
                to destination
              </span>
            </>
          )}
        </div>

        {/* Destination: College */}
        <div className="min-w-0 text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destination</span>
          <p className="font-semibold text-[#0F1E36] truncate" title={destinationStop.name}>
            {destinationStop.name}
          </p>
          <span className="text-[11px] text-emerald-800 font-semibold block">
            CVR Campus
          </span>
        </div>

      </div>

      {/* Card Actions: Clear "View Route Details" & Map */}
      <div className="mt-4 pt-3 border-t border-[#F0EEE9] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
          <FileCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Official Circular Record</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {onRequestBoarding && !route.isIncomplete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestBoarding(result);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Request smart boarding on this bus"
            >
              <Ticket className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden xs:inline">Request Seat</span>
              <span className="xs:hidden">Seat</span>
            </button>
          )}

          {!route.isIncomplete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMap(result);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[#DCD8D0] hover:bg-[#FAF9F5] text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Inspect route corridor on map"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>Map</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelect(result)}
            className="px-3 py-1.5 rounded-lg bg-[#0F1E36] hover:bg-[#1A2F50] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>View Stops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
