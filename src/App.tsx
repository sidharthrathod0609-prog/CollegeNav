import { useState, useMemo } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  DemoNoticeBanner 
} from './components/DemoNoticeBanner';
import { 
  ServiceAlertsSection 
} from './components/ServiceAlertsSection';
import { 
  SearchBar 
} from './components/SearchBar';
import { 
  RouteCard 
} from './components/RouteCard';
import { 
  RouteDetailsModal 
} from './components/RouteDetailsModal';
import { 
  InteractiveMap 
} from './components/InteractiveMap';
import { 
  EmptyState 
} from './components/EmptyState';
import { 
  AdminPortalModal 
} from './components/AdminPortalModal';
import { 
  StudentBoardingModal 
} from './components/StudentBoardingModal';
import { 
  ConductorPortalModal 
} from './components/ConductorPortalModal';

import { 
  useTransportData 
} from './services/transportDataService';
import {
  useBoardingData
} from './services/boardingService';
import { 
  searchAndRankRoutes 
} from './utils/recommendations';
import type { 
  RouteSearchResult, 
  CVRRoute,
  RouteSortOption 
} from './types/transit';
import { 
  Map, 
  ListFilter, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export function App() {
  // Transport Data Hook (Synchronized with Firebase RTDB / Local Fallback)
  const {
    routes,
    advisories,
    syncStatus,
    updateRouteSchedule,
    publishTransportAdvisory,
    updateTransportAdvisory,
    deleteTransportAdvisory,
    resetToCircularDefault,
  } = useTransportData();

  // Boarding Data Hook (Trips & Student Boarding Requests)
  const {
    trips: boardingTrips,
    requests: boardingRequests,
  } = useBoardingData();

  // Search State
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('College (CVR Campus)');
  const [sortBy, setSortBy] = useState<RouteSortOption>('recommendation');
  
  // Selection and Modal State
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [modalRoute, setModalRoute] = useState<CVRRoute | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | undefined>(undefined);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isBoardingModalOpen, setIsBoardingModalOpen] = useState(false);
  const [boardingInitialRoute, setBoardingInitialRoute] = useState<number | undefined>(undefined);
  const [boardingInitialPickupStop, setBoardingInitialPickupStop] = useState<string | undefined>(undefined);
  const [isConductorModalOpen, setIsConductorModalOpen] = useState(false);

  const handleOpenBoardingModal = (routeNumber?: number, stopName?: string) => {
    setBoardingInitialRoute(routeNumber);
    setBoardingInitialPickupStop(stopName);
    setIsBoardingModalOpen(true);
  };
  
  // View mode on mobile/tablet (List vs Map)
  const [activeTab, setActiveTab] = useState<'routes' | 'map'>('routes');

  // Extract popular hubs dynamically from currently active routes
  const popularStops = useMemo(() => {
    return [
      'LB Nagar',
      'Dilsukhnagar',
      'Uppal',
      'ECIL',
      'Koti',
      'Secunderabad',
      'Mehdipatnam',
      'Kukatpally',
      'Tarnaka',
      'Hayathnagar',
      'Hasthinapuram',
      'BN Reddy',
    ];
  }, []);

  // Perform Route Search & Ranking against active CVR routes
  const searchResults: RouteSearchResult[] = useMemo(() => {
    return searchAndRankRoutes(routes, origin, destination, sortBy);
  }, [routes, origin, destination, sortBy]);

  const isSearching = origin.trim().length > 0;
  const [showAllUnfiltered, setShowAllUnfiltered] = useState(false);

  // When not searching, show only 1 to 2 routes as requested. When searching, show exact search matches.
  const displayedResults: RouteSearchResult[] = useMemo(() => {
    if (isSearching || showAllUnfiltered) {
      return searchResults;
    }
    return searchResults.slice(0, 2);
  }, [searchResults, isSearching, showAllUnfiltered]);

  // Derived selected result
  const activeResult: RouteSearchResult | null = useMemo(() => {
    if (selectedRouteId) {
      const match = displayedResults.find((r) => r.route.id === selectedRouteId);
      if (match) return match;
    }
    return displayedResults[0] ?? null;
  }, [selectedRouteId, displayedResults]);

  // Handlers
  const handleSelectRouteAlert = (routeId: string) => {
    const foundRoute = routes.find((r) => r.id === routeId);
    if (foundRoute) {
      setModalRoute(foundRoute);
      setSelectedRouteId(foundRoute.id);
    }
  };

  const handleOpenMap = (result: RouteSearchResult) => {
    setSelectedRouteId(result.route.id);
    setActiveTab('map');
  };

  const handleResetSearch = () => {
    setOrigin('');
    setDestination('College (CVR Campus)');
    setSortBy('recommendation');
    setSelectedRouteId(null);
  };

  const handleQuickSelectOrigin = (stopName: string) => {
    setOrigin(stopName);
  };

  const activeRouteForMap = activeResult ? activeResult.route : (searchResults[0]?.route || routes[0]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#0F1E36] flex flex-col font-sans selection:bg-amber-600 selection:text-white overflow-x-hidden">
      {/* Top Header */}
      <Header
        totalRoutesCount={routes.length}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenBoardingRequest={() => handleOpenBoardingModal()}
        onOpenConductor={() => setIsConductorModalOpen(true)}
        isCloudConnected={syncStatus === 'CONNECTED_CLOUD'}
      />

      {/* Official Dataset Banner */}
      <DemoNoticeBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6">
        
        {/* 1. Hero Search Section */}
        <SearchBar
          origin={origin}
          setOrigin={setOrigin}
          destination={destination}
          setDestination={setDestination}
          sortBy={sortBy}
          setSortBy={setSortBy}
          popularStops={popularStops}
          onQuickSelectOrigin={handleQuickSelectOrigin}
          onExecuteSearch={() => {
            if (activeTab === 'map') setActiveTab('routes');
          }}
        />

        {/* 2. Official Transport Advisories (Live Dynamic Feed) */}
        <ServiceAlertsSection
          advisories={advisories}
          onSelectRouteAlert={handleSelectRouteAlert}
          isCloudConnected={syncStatus === 'CONNECTED_CLOUD'}
        />

        {/* 3. Mobile View Switcher */}
        <div className="lg:hidden flex rounded-xl bg-[#F0EEE9] p-1 border border-[#E5E2DC]">
          <button
            type="button"
            onClick={() => setActiveTab('routes')}
            className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'routes'
                ? 'bg-white text-[#0F1E36] shadow-xs'
                : 'text-slate-600 hover:text-[#0F1E36]'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>{isSearching ? `Matching Routes (${searchResults.length})` : `Sample Routes (${displayedResults.length})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'map'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-slate-600 hover:text-[#0F1E36]'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Dedicated Map View</span>
          </button>
        </div>

        {/* 4. Main Responsive Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* Left Column: Route Cards or Empty State */}
          <div className={`lg:col-span-7 space-y-3.5 sm:space-y-4 ${activeTab === 'map' ? 'hidden lg:block' : 'block'}`}>
            
            {/* Header info bar */}
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#0F1E36]">
                  {isSearching
                    ? `Matching Routes for "${origin}"`
                    : showAllUnfiltered
                    ? 'All Official Bus Routes'
                    : 'Sample Bus Routes'}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#FAF9F5] text-[#0F1E36] border border-[#E5E2DC]">
                  {isSearching ? searchResults.length : showAllUnfiltered ? '54 of 54' : `${displayedResults.length} of 54`}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                {isSearching ? 'Exact route search results' : 'Search above to find your exact route'}
              </span>
            </div>

            {/* Results List */}
            {displayedResults.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {displayedResults.map((result) => (
                  <RouteCard
                    key={result.route.id}
                    result={result}
                    isSelected={activeResult?.route.id === result.route.id}
                    onSelect={(res) => {
                      setSelectedRouteId(res.route.id);
                      setModalRoute(res.route);
                    }}
                    onOpenMap={handleOpenMap}
                    onRequestBoarding={(res) => handleOpenBoardingModal(res.route.routeNumber, res.originStop.name)}
                  />
                ))}

                {!isSearching && (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-center space-y-2">
                    <p className="text-xs font-medium text-amber-950">
                      Showing {displayedResults.length} sample routes. <strong>Use the search bar above</strong> to find your exact college bus route by pickup point or route number.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAllUnfiltered(!showAllUnfiltered)}
                      className="text-xs font-bold text-amber-900 underline hover:text-amber-950"
                    >
                      {showAllUnfiltered ? 'Show only sample routes' : 'Or view all 54 routes list'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                origin={origin}
                destination={destination}
                onReset={handleResetSearch}
                onSelectHub={handleQuickSelectOrigin}
              />
            )}

          </div>

          {/* Right Column: Interactive Route Map & Stops Timeline */}
          <div className={`lg:col-span-5 space-y-4 ${activeTab === 'routes' ? 'hidden lg:block' : 'block'}`}>
            
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm sm:text-base font-bold text-[#0F1E36]">
                  {activeResult ? `${activeResult.route.routeLabel} Corridor` : 'Interactive Route Map'}
                </h3>
              </div>
              {activeResult && !activeResult.route.isIncomplete && (
                <span className="text-xs font-semibold text-[#0F1E36] bg-[#FAF9F5] px-2 py-0.5 rounded border border-[#E5E2DC]">
                  {activeResult.route.stops.length} stops
                </span>
              )}
            </div>

            {/* The Leaflet Map Component */}
            <div className="h-[420px] sm:h-[460px] lg:h-[480px] w-full">
              <InteractiveMap
                route={activeRouteForMap}
                allRoutes={routes}
                selectedStopId={selectedStopId}
                onSelectStop={(stop) => setSelectedStopId(stop.id)}
              />
            </div>

            {/* Map Sidebar Stop Quick Navigator */}
            {activeResult && !activeResult.route.isIncomplete && activeResult.route.stops.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E5E2DC] p-3.5 sm:p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F1E36] uppercase tracking-wider">
                    {activeResult.route.routeLabel} Stop Order
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalRoute(activeResult.route)}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 hover:underline"
                  >
                    <span>Full Stop List</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {activeResult.route.stops.map((stop, idx) => (
                    <button
                      key={stop.id}
                      type="button"
                      onClick={() => setSelectedStopId(stop.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        selectedStopId === stop.id
                          ? 'bg-amber-50 text-amber-950 font-bold border border-amber-300'
                          : 'hover:bg-[#FAF9F5] text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-4 text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                        <span className="truncate">{stop.name}</span>
                      </div>
                      {stop.scheduledTime && (
                        <span className="font-mono text-[11px] text-amber-900 bg-amber-50 px-1 rounded font-semibold shrink-0 ml-2">
                          {stop.scheduledTime}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Route Details Modal */}
      <RouteDetailsModal
        route={modalRoute}
        recommendationReasons={
          modalRoute && activeResult?.route.id === modalRoute.id
            ? activeResult.recommendationReasons
            : undefined
        }
        onClose={() => setModalRoute(null)}
        selectedStopId={selectedStopId}
        onSelectStop={(stop) => setSelectedStopId(stop.id)}
        onRequestBoarding={(r) => handleOpenBoardingModal(r.routeNumber, r.startingLocation)}
      />

      {/* Student Missed Bus & Boarding Request Modal */}
      <StudentBoardingModal
        isOpen={isBoardingModalOpen}
        onClose={() => setIsBoardingModalOpen(false)}
        initialRouteNumber={boardingInitialRoute}
        initialPickupStop={boardingInitialPickupStop}
      />

      {/* Authorized Driver & Conductor Console Modal */}
      <ConductorPortalModal
        isOpen={isConductorModalOpen}
        onClose={() => setIsConductorModalOpen(false)}
      />

      {/* Transport Administration Portal Modal */}
      <AdminPortalModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        routes={routes}
        advisories={advisories}
        syncStatus={syncStatus}
        trips={boardingTrips}
        boardingRequests={boardingRequests}
        onUpdateRoute={updateRouteSchedule}
        onPublishAdvisory={publishTransportAdvisory}
        onUpdateAdvisory={updateTransportAdvisory}
        onDeleteAdvisory={deleteTransportAdvisory}
        onResetRouteDefaults={resetToCircularDefault}
      />

      {/* Refined Footer */}
      <footer className="mt-12 bg-white border-t border-[#E5E2DC] py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-bold text-[#0F1E36]">CollegeNav</span>
            <span className="text-slate-300">•</span>
            <span>Intelligent Bus Route Navigation</span>
            <span className="text-slate-300">•</span>
            <span className="font-medium text-slate-700">CVR College of Engineering</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] justify-center">
            <span>{routes.length} Scheduled Routes</span>
            <span>•</span>
            <span className="text-emerald-800 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
              {syncStatus === 'CONNECTED_CLOUD' ? 'Cloud Synchronized' : 'Verified Circular Dataset'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
