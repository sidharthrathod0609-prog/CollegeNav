import React from 'react';
import { 
  X, 
  Bus, 
  ShieldAlert, 
  Navigation,
  FileText,
  AlertTriangle,
  Clock,
  MapPin,
  Ticket
} from 'lucide-react';
import type { CVRRoute, CVRRouteStop } from '../data/cvrRoutes';

interface RouteDetailsModalProps {
  route: CVRRoute | null;
  recommendationReasons?: string[];
  onClose: () => void;
  selectedStopId?: string;
  onSelectStop?: (stop: CVRRouteStop) => void;
  onRequestBoarding?: (route: CVRRoute) => void;
}

export const RouteDetailsModal: React.FC<RouteDetailsModalProps> = ({
  route,
  recommendationReasons,
  onClose,
  selectedStopId,
  onSelectStop,
  onRequestBoarding,
}) => {
  if (!route) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F1E36]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full border border-[#DCD8D0] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div 
          className="p-5 sm:p-6 text-white relative flex items-start justify-between bg-[#0F1E36]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">{route.routeLabel}</h2>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-white/20 text-white">
                  Official Record
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium mt-0.5">
                {route.startingLocation} ➔ {route.destination}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Circular Sub-banner */}
        <div className="bg-[#FAF9F5] border-b border-[#E5E2DC] px-5 py-2.5 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="font-semibold text-[#0F1E36]">CVR Transport Schedule</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Twin Cities to Vastunagar Campus</span>
          </div>
          <span className="text-emerald-800 text-[11px] font-mono font-semibold">
            {route.verificationStatus === 'OFFICIAL_ROUTE_SHEET' ? 'VERIFIED SHEET RECORD' : 'NEEDS MANUAL VERIFICATION'}
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Key Verified Route Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Departure Time</span>
              <span className="text-sm sm:text-base font-bold text-[#0F1E36] font-mono flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {route.departureTime}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Origin Terminal</span>
              <span className="text-xs sm:text-sm font-bold text-[#0F1E36] truncate block mt-0.5" title={route.startingLocation}>
                {route.startingLocation}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destination</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-700 block mt-0.5">
                CVR Campus
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stops</span>
              <span className="text-sm sm:text-base font-bold text-[#0F1E36] font-mono block mt-0.5">
                {route.stops.length}
              </span>
            </div>
          </div>

          {/* Incomplete Route Alert (if applicable) */}
          {route.isIncomplete && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Incomplete Entry: Route Stops Not Listed</span>
              </div>
              <p className="leading-relaxed">
                This route is listed on the official CVR transport route sheet, but its specific intermediate stops were marked as <em>"Route stops not listed"</em>. Please contact the college transport in-charge for routing details.
              </p>
            </div>
          )}

          {/* Recommendation Reasons (if available) */}
          {recommendationReasons && recommendationReasons.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
              <span className="font-bold text-amber-950 block uppercase tracking-wider text-[10px]">
                Why this route is recommended:
              </span>
              {recommendationReasons.map((reason, idx) => (
                <div key={idx} className="flex items-center gap-2 text-amber-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* Ordered Stops Timeline */}
          {route.stops.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-[#0F1E36] uppercase tracking-wider flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-amber-600" />
                  <span>Official Ordered Stop Sequence ({route.stops.length} Stops)</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Origin ➔ Destination Order
                </span>
              </div>

              <div className="relative pl-6 space-y-2 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E5E2DC]">
                {route.stops.map((stop, idx) => {
                  const isFirst = idx === 0;
                  const isCampus = stop.isDestination || idx === route.stops.length - 1;
                  const isSelected = stop.id === selectedStopId;

                  return (
                    <div
                      key={stop.id}
                      onClick={() => onSelectStop && onSelectStop(stop)}
                      className={`relative pl-3 cursor-pointer group transition-all p-2.5 rounded-xl border ${
                        isSelected
                          ? 'bg-amber-50/80 border-amber-300'
                          : isCampus
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : isFirst
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-white border-transparent hover:border-[#E5E2DC] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      {/* Stepper Dot */}
                      <div className="absolute -left-[27px] top-3.5">
                        {isCampus ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                            🎓
                          </div>
                        ) : isFirst ? (
                          <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                            📍
                          </div>
                        ) : (
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                            isSelected
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'bg-white border-[#DCD8D0] text-slate-500 group-hover:border-amber-600'
                          }`}>
                            {idx + 1}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isCampus ? 'text-emerald-950' : 'text-[#0F1E36]'}`}>
                            {stop.name}
                          </span>
                          {isCampus && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white">
                              Campus Terminal
                            </span>
                          )}
                          {isFirst && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                              Origin Terminal
                            </span>
                          )}
                        </div>

                        {stop.scheduledTime && (
                          <div className="text-right shrink-0">
                            <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block">
                              Departs: {stop.scheduledTime}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#FAF9F5] rounded-xl border border-[#E5E2DC]">
              <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No stop sequence listed in circular for this route.</p>
            </div>
          )}

          {/* Privacy & Verification Notice */}
          <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC] text-slate-600 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-semibold text-[#0F1E36]">Data Source & Privacy Notice:</strong> Route and stop information is extracted directly from the official CVR College Transport circular. Personal phone numbers have been omitted to protect driver privacy.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-[#FAF9F5] border-t border-[#E5E2DC] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <FileText className="w-3.5 h-3.5" />
            <span>CVR College of Engineering Transport</span>
          </div>

          <div className="flex items-center gap-2">
            {onRequestBoarding && !route.isIncomplete && (
              <button
                type="button"
                onClick={() => {
                  onRequestBoarding(route);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#0F1E36] text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-2xs border border-amber-600/30"
              >
                <Ticket className="w-4 h-4" />
                <span>Request Boarding Assistance</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] text-white text-xs sm:text-sm font-bold transition-colors"
            >
              Close Stops
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
