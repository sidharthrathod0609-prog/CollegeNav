import React, { useState } from 'react';
import { MapPin, ArrowDownUp, X, Search, Check, Sparkles, Navigation2 } from 'lucide-react';
import type { RouteSortOption } from '../types/transit';

interface SearchBarProps {
  origin: string;
  setOrigin: (origin: string) => void;
  destination: string;
  setDestination: (destination: string) => void;
  sortBy: RouteSortOption;
  setSortBy: (sort: RouteSortOption) => void;
  popularStops: string[];
  onQuickSelectOrigin: (stopName: string) => void;
  onExecuteSearch?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  origin,
  setOrigin,
  destination,
  setDestination,
  sortBy,
  setSortBy,
  popularStops,
  onQuickSelectOrigin,
  onExecuteSearch,
}) => {
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState(false);

  const filteredOriginStops = popularStops.filter((s) =>
    s.toLowerCase().includes(origin.toLowerCase().trim())
  );

  const filteredDestStops = ['College (CVR Campus)', ...popularStops].filter((s) =>
    s.toLowerCase().includes(destination.toLowerCase().trim())
  );

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowOriginSuggestions(false);
    setShowDestSuggestions(false);
    setSearchFeedback(true);
    setTimeout(() => setSearchFeedback(false), 800);
    if (onExecuteSearch) onExecuteSearch();
  };

  // Major transit confluence hubs in CVR routes
  const quickHubs = [
    'LB Nagar',
    'Dilsukhnagar',
    'Uppal',
    'Koti',
    'ECIL',
    'Tarnaka',
    'Mehdipatnam',
    'Kukatpally',
  ];

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_10px_35px_-8px_rgba(15,30,54,0.07)] overflow-hidden transition-all">
      {/* Top Subtle Accent Gradient */}
      <div className="h-1.5 bg-gradient-to-r from-amber-500 via-[#0F1E36] to-amber-500" />

      <div className="p-5 sm:p-7 space-y-5">
        
        {/* Header Hero Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Intelligent Corridor Discovery
              </span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                54 Scheduled Corridors
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F1E36] tracking-tight">
              Find your college bus route
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
              Search by your locality, intermediate boarding stop, or official CVR bus route number.
            </p>
          </div>
        </div>

        {/* Unified Search Input Grid */}
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr,auto] gap-2.5 sm:gap-3 items-end">
            
            {/* Origin Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-[#0F1E36] mb-1.5 flex items-center justify-between">
                <span>Pickup Stop or Locality</span>
                <span className="text-[10px] text-slate-400 font-normal">Step 1</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <MapPin className="w-4 h-4 text-amber-600" />
                </div>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => {
                    setOrigin(e.target.value);
                    setShowOriginSuggestions(true);
                  }}
                  onFocus={() => setShowOriginSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                  placeholder="e.g. LB Nagar, Uppal, Dilsukhnagar, Route 20..."
                  className="w-full pl-10 pr-9 py-3 rounded-2xl border border-[#DCD8D0] focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 text-sm font-semibold text-[#0F1E36] placeholder-slate-400 bg-[#FAF9F5]/50 focus:bg-white outline-none min-h-[50px] transition-all"
                />
                {origin && (
                  <button
                    type="button"
                    onClick={() => setOrigin('')}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                    title="Clear origin"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showOriginSuggestions && filteredOriginStops.length > 0 && origin.trim().length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-[#DCD8D0] shadow-2xl max-h-60 overflow-y-auto py-1.5 animate-in fade-in duration-100">
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 mb-1">
                    Matched CVR Boarding Stops
                  </div>
                  {filteredOriginStops.slice(0, 8).map((stopName, idx) => (
                    <button
                      key={`${stopName}-${idx}`}
                      type="button"
                      onMouseDown={() => {
                        setOrigin(stopName);
                        setShowOriginSuggestions(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#FAF9F5] flex items-center justify-between text-xs transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-semibold text-[#0F1E36] group-hover:text-amber-800">{stopName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">CVR Stop</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direction Swap Button */}
            <div className="flex justify-center my-0.5 md:my-0 md:mb-1">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap pickup and destination"
                className="p-3 rounded-2xl border border-[#DCD8D0] bg-[#FAF9F5] hover:bg-amber-50 hover:border-amber-300 text-slate-600 hover:text-amber-800 transition-all rotate-90 md:rotate-0 min-h-[50px] min-w-[50px] flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95"
              >
                <ArrowDownUp className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-[#0F1E36] mb-1.5 flex items-center justify-between">
                <span>College Destination</span>
                <span className="text-[10px] text-emerald-700 font-semibold font-mono">Campus Terminus</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <Navigation2 className="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setShowDestSuggestions(true);
                  }}
                  onFocus={() => setShowDestSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
                  placeholder="e.g. College (CVR Campus)..."
                  className="w-full pl-10 pr-9 py-3 rounded-2xl border border-[#DCD8D0] focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold text-[#0F1E36] placeholder-slate-400 bg-[#FAF9F5]/50 focus:bg-white outline-none min-h-[50px] transition-all"
                />
                {destination && (
                  <button
                    type="button"
                    onClick={() => setDestination('')}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                    title="Clear destination"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Destination Suggestions */}
              {showDestSuggestions && filteredDestStops.length > 0 && destination.trim().length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-[#DCD8D0] shadow-2xl max-h-56 overflow-y-auto py-1.5 animate-in fade-in duration-100">
                  {filteredDestStops.slice(0, 6).map((stopName, idx) => (
                    <button
                      key={`${stopName}-${idx}`}
                      type="button"
                      onMouseDown={() => {
                        setDestination(stopName);
                        setShowDestSuggestions(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#FAF9F5] flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Navigation2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-[#0F1E36]">{stopName}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-mono font-semibold">Campus</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prominent Search Routes Button */}
            <div>
              <button
                type="submit"
                className="w-full md:w-auto px-7 py-3 rounded-2xl bg-[#0F1E36] hover:bg-[#1A2F50] text-amber-400 hover:text-amber-300 font-bold text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all min-h-[50px] border border-[#0F1E36] active:scale-98"
              >
                {searchFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-bold">Routes Updated</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-amber-400" />
                    <span>Search Routes</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </form>

        {/* Secondary: Popular Confluence Hubs & Sorting */}
        <div className="pt-3.5 border-t border-[#F0EEE9] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* Quick Hub Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 md:pb-0 no-scrollbar w-full md:w-auto">
            <span className="text-slate-400 text-xs shrink-0 font-medium mr-0.5">Popular hubs:</span>
            {quickHubs.map((hub) => {
              const isSelected = origin.toLowerCase() === hub.toLowerCase();
              return (
                <button
                  key={hub}
                  type="button"
                  onClick={() => onQuickSelectOrigin(hub)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-[#0F1E36] text-amber-400 border-[#0F1E36] shadow-2xs font-bold'
                      : 'bg-[#FAF9F5] hover:bg-[#F2EFE9] text-slate-700 border-[#E2E8F0]'
                  }`}
                >
                  {hub}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 pt-1 md:pt-0">
            <span className="text-slate-400 text-xs font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as RouteSortOption)}
              className="px-3 py-1.5 rounded-xl border border-[#DCD8D0] bg-white text-xs font-bold text-[#0F1E36] outline-none focus:border-amber-600 shadow-2xs cursor-pointer"
            >
              <option value="recommendation">Recommended Match</option>
              <option value="departure">Earliest Departure Time</option>
              <option value="stops">Fewest Intermediate Stops</option>
              <option value="routeNumber">Route Number (1 - 54)</option>
            </select>
          </div>

        </div>

      </div>
    </div>
  );
};
