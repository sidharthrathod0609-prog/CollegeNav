import React, { useState } from 'react';
import { MapPin, ArrowDownUp, X, Search, Check } from 'lucide-react';
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
    <div className="bg-white rounded-2xl border border-[#E5E2DC] shadow-[0_2px_8px_rgba(15,30,54,0.04)] p-4 sm:p-6">
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        
        {/* Main Heading */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F1E36] tracking-tight">
            Find your college bus
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search across 54 official CVR College bus routes by pickup location, intermediate stop, or route number.
          </p>
        </div>

        {/* Origin / Destination Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr,auto] gap-2.5 sm:gap-3 items-end">
          
          {/* Starting Location */}
          <div className="relative">
            <label className="block text-xs font-bold text-[#0F1E36] mb-1">
              Pickup stop or locality
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
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
                className="w-full pl-9 pr-8 py-3 rounded-xl border border-[#DCD8D0] focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10 text-sm font-medium text-[#0F1E36] placeholder-slate-400 bg-white outline-none min-h-[48px]"
              />
              {origin && (
                <button
                  type="button"
                  onClick={() => setOrigin('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1"
                  title="Clear origin"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Origin Autocomplete Suggestions */}
            {showOriginSuggestions && filteredOriginStops.length > 0 && origin.trim().length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl border border-[#DCD8D0] shadow-xl max-h-56 overflow-y-auto py-1">
                {filteredOriginStops.slice(0, 8).map((stopName, idx) => (
                  <button
                    key={`${stopName}-${idx}`}
                    type="button"
                    onMouseDown={() => {
                      setOrigin(stopName);
                      setShowOriginSuggestions(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#FAF9F5] flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="font-semibold text-[#0F1E36]">{stopName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">CVR Stop</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center my-0.5 md:my-0 md:mb-1">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap origin and destination"
              className="p-3 rounded-xl border border-[#DCD8D0] bg-[#FAF9F5] hover:bg-amber-50 text-slate-600 hover:text-amber-800 transition-all rotate-90 md:rotate-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          {/* Destination */}
          <div className="relative">
            <label className="block text-xs font-bold text-[#0F1E36] mb-1">
              Destination
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                <MapPin className="w-4 h-4 text-emerald-600" />
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
                className="w-full pl-9 pr-8 py-3 rounded-xl border border-[#DCD8D0] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 text-sm font-medium text-[#0F1E36] placeholder-slate-400 bg-white outline-none min-h-[48px]"
              />
              {destination && (
                <button
                  type="button"
                  onClick={() => setDestination('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1"
                  title="Clear destination"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Destination Autocomplete Suggestions */}
            {showDestSuggestions && filteredDestStops.length > 0 && destination.trim().length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl border border-[#DCD8D0] shadow-xl max-h-56 overflow-y-auto py-1">
                {filteredDestStops.slice(0, 6).map((stopName, idx) => (
                  <button
                    key={`${stopName}-${idx}`}
                    type="button"
                    onMouseDown={() => {
                      setDestination(stopName);
                      setShowDestSuggestions(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#FAF9F5] flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="font-semibold text-[#0F1E36]">{stopName}</span>
                    <span className="text-[10px] text-emerald-700 font-mono">Destination</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prominent Search Routes Button */}
          <div>
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all min-h-[48px] border border-[#0F1E36] active:scale-[0.99]"
            >
              {searchFeedback ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Showing results</span>
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

        {/* Secondary: Popular Locations & Sort Controls */}
        <div className="pt-3 border-t border-[#F0EEE9] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          
          {/* Popular Pickup Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <span className="text-slate-400 text-xs shrink-0 font-medium">Popular hubs:</span>
            {quickHubs.map((hub) => (
              <button
                key={hub}
                type="button"
                onClick={() => onQuickSelectOrigin(hub)}
                className={`shrink-0 px-2.5 py-1 rounded-md text-xs transition-colors border ${
                  origin === hub
                    ? 'bg-[#0F1E36] text-white border-[#0F1E36] font-semibold'
                    : 'bg-[#FAF9F5] hover:bg-[#F4F2EC] text-slate-600 border-[#E5E2DC]'
                }`}
              >
                {hub}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <span className="text-slate-400 text-xs">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as RouteSortOption)}
              className="bg-[#FAF9F5] border border-[#E5E2DC] text-[#0F1E36] rounded-md px-2 py-1 text-xs font-semibold outline-none cursor-pointer focus:border-amber-600"
            >
              <option value="recommendation">Recommended Match</option>
              <option value="fewest-stops">Fewest Intermediate Stops</option>
              <option value="earliest">Earliest Departure</option>
              <option value="route-number">Route Number (#1 to #54)</option>
            </select>
          </div>

        </div>

      </form>
    </div>
  );
};
