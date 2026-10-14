import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Bus, 
  Bell, 
  Database, 
  Save, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus,
  ArrowUp,
  ArrowDown,
  LogOut
} from 'lucide-react';
import type { CVRRoute, CVRRouteStop } from '../data/cvrRoutes';
import type { TransportAdvisory } from '../types/transit';
import { 
  getFirebaseConnectionDiagnostics 
} from '../services/firebaseConfig';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: CVRRoute[];
  advisories: TransportAdvisory[];
  syncStatus: string;
  onUpdateRoute: (routeId: string, updates: Partial<CVRRoute>, passkey: string) => Promise<{ success: boolean; error?: string }>;
  onPublishAdvisory: (advisory: Omit<TransportAdvisory, 'id' | 'createdAt' | 'updatedAt' | 'date'>, passkey: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateAdvisory: (id: string, updates: Partial<TransportAdvisory>, passkey: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteAdvisory: (id: string, passkey: string) => Promise<{ success: boolean; error?: string }>;
  onResetRouteDefaults: (passkey: string) => Promise<{ success: boolean; error?: string }>;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  routes,
  advisories,
  syncStatus,
  onUpdateRoute,
  onPublishAdvisory,
  onUpdateAdvisory,
  onDeleteAdvisory,
  onResetRouteDefaults,
}) => {
  // Authentication State
  const [passkeyInput, setPasskeyInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab: 'routes' | 'advisories' | 'database'
  const [activeTab, setActiveTab] = useState<'routes' | 'advisories' | 'database'>('routes');

  // Selected route for editing
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || 'cvr-route-1');
  const [searchFilter, setSearchFilter] = useState('');

  // Editing Route Form State
  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const [editDepartureTime, setEditDepartureTime] = useState(activeRoute?.departureTime || '');
  const [editStartingLocation, setEditStartingLocation] = useState(activeRoute?.startingLocation || '');
  const [editDestination, setEditDestination] = useState(activeRoute?.destination || 'College (CVR Campus)');
  const [editStops, setEditStops] = useState<CVRRouteStop[]>(activeRoute?.stops || []);
  const [newStopName, setNewStopName] = useState('');

  // New Advisory Form State
  const [newAdvTitle, setNewAdvTitle] = useState('');
  const [newAdvMessage, setNewAdvMessage] = useState('');
  const [newAdvRouteNumber, setNewAdvRouteNumber] = useState('All Routes');
  const [newAdvType, setNewAdvType] = useState<'notice' | 'guideline' | 'verification' | 'alert'>('notice');
  const [newAdvSeverity, setNewAdvSeverity] = useState<'low' | 'medium' | 'high'>('low');

  // Feedback notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectRoute = (route: CVRRoute) => {
    setSelectedRouteId(route.id);
    setEditDepartureTime(route.departureTime);
    setEditStartingLocation(route.startingLocation);
    setEditDestination(route.destination);
    setEditStops([...route.stops]);
  };

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkeyInput.trim() === 'CVR-TRANS-2026') {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Invalid administrator passkey. Please check authorized credentials.');
    }
  };

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setActionError(null);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const showError = (msg: string) => {
    setActionError(msg);
    setActionSuccess(null);
  };

  // Route Save Handler
  const handleSaveRoute = async () => {
    if (!activeRoute) return;
    setIsSaving(true);
    setActionError(null);

    const result = await onUpdateRoute(
      activeRoute.id,
      {
        departureTime: editDepartureTime.trim(),
        startingLocation: editStartingLocation.trim(),
        destination: editDestination.trim(),
        stops: editStops,
        isIncomplete: editStops.length === 0,
      },
      passkeyInput
    );

    setIsSaving(false);
    if (result.success) {
      showSuccess(`${activeRoute.routeLabel} schedule and corridor updated successfully! Changes are live in student view.`);
    } else {
      showError(result.error || 'Failed to update route');
    }
  };

  // Publish Advisory Handler
  const handlePublishAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvTitle.trim() || !newAdvMessage.trim()) {
      showError('Please fill in both the advisory title and message.');
      return;
    }

    setIsSaving(true);
    const result = await onPublishAdvisory(
      {
        title: newAdvTitle.trim(),
        message: newAdvMessage.trim(),
        routeNumber: newAdvRouteNumber === 'All Routes' ? undefined : newAdvRouteNumber,
        type: newAdvType,
        severity: newAdvSeverity,
        status: 'ACTIVE',
      },
      passkeyInput
    );

    setIsSaving(false);
    if (result.success) {
      setNewAdvTitle('');
      setNewAdvMessage('');
      showSuccess('Service advisory published! It is now active on the student interface.');
    } else {
      showError(result.error || 'Failed to publish advisory');
    }
  };

  // Stop Reordering
  const moveStop = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= editStops.length) return;
    const newStops = [...editStops];
    const temp = newStops[index];
    newStops[index] = newStops[targetIdx];
    newStops[targetIdx] = temp;
    // Re-index stopOrder
    const reordered = newStops.map((s, idx) => ({ ...s, stopOrder: idx + 1 }));
    setEditStops(reordered);
  };

  const handleAddStop = () => {
    if (!newStopName.trim()) return;
    const stop: CVRRouteStop = {
      id: `${activeRoute.id}-custom-${Date.now()}`,
      name: newStopName.trim(),
      isStartingPoint: editStops.length === 0,
      isDestination: false,
      stopOrder: editStops.length + 1,
    };
    setEditStops([...editStops, stop]);
    setNewStopName('');
  };

  const handleRemoveStop = (stopId: string) => {
    const filtered = editStops.filter((s) => s.id !== stopId);
    setEditStops(filtered.map((s, idx) => ({ ...s, stopOrder: idx + 1 })));
  };

  const filteredRoutes = routes.filter((r) =>
    r.routeLabel.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.startingLocation.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const diagnostics = getFirebaseConnectionDiagnostics();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F1E36]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full border border-[#DCD8D0] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-[#0F1E36] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Bus className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">Transport Administration</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CVRCE In-Charge
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Official Schedule Management & Service Advisory Publisher
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setIsAuthenticated(false)}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-slate-200 flex items-center gap-1 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              title="Close admin portal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {actionSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-900 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-xs text-red-900 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Content Area */}
        {!isAuthenticated ? (
          /* Authentication Screen */
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-amber-600" />
            </div>

            <div>
              <h3 className="text-lg font-black text-[#0F1E36]">Authorized Staff Access</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the CVR Transport Department administrator passkey to manage routes, modify schedules, and publish advisories.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="text-left">
                <label className="block text-xs font-bold text-[#0F1E36] mb-1">
                  Administrator Passkey
                </label>
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter administrator passkey..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD8D0] focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10 text-sm font-medium outline-none"
                  autoFocus
                />
              </div>

              {authError && (
                <p className="text-xs text-red-600 font-semibold">{authError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
              >
                Authorize Transport Console
              </button>
            </form>

            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E2DC] text-[11px] text-slate-500 font-mono">
              Demo Test Passkey: <strong className="text-[#0F1E36]">CVR-TRANS-2026</strong>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Tab Navigation */}
            <div className="flex items-center border-b border-[#E5E2DC] bg-[#FAF9F5] px-4 pt-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('routes')}
                className={`px-4 py-2.5 rounded-t-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'routes'
                    ? 'bg-white text-[#0F1E36] border-t border-x border-[#E5E2DC] -mb-[1px] shadow-2xs'
                    : 'text-slate-500 hover:text-[#0F1E36]'
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                <span>Routes & Schedules ({routes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('advisories')}
                className={`px-4 py-2.5 rounded-t-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'advisories'
                    ? 'bg-white text-[#0F1E36] border-t border-x border-[#E5E2DC] -mb-[1px] shadow-2xs'
                    : 'text-slate-500 hover:text-[#0F1E36]'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Service Advisories ({advisories.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('database')}
                className={`px-4 py-2.5 rounded-t-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'database'
                    ? 'bg-white text-[#0F1E36] border-t border-x border-[#E5E2DC] -mb-[1px] shadow-2xs'
                    : 'text-slate-500 hover:text-[#0F1E36]'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Cloud & Security</span>
              </button>
            </div>

            {/* Tab 1: Routes & Schedule Administration */}
            {activeTab === 'routes' && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                
                {/* Left Route Selector List */}
                <div className="md:col-span-4 border-r border-[#E5E2DC] p-3 flex flex-col gap-2 overflow-hidden bg-[#FAF9F5]">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter route number or origin..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#DCD8D0] bg-white outline-none focus:border-amber-600"
                  />

                  <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                    {filteredRoutes.map((route) => (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => handleSelectRoute(route)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                          selectedRouteId === route.id
                            ? 'bg-[#0F1E36] text-white font-bold shadow-xs'
                            : 'hover:bg-white text-slate-700 bg-white/60 border border-[#E5E2DC]'
                        }`}
                      >
                        <div className="truncate">
                          <span className="block font-bold">{route.routeLabel}</span>
                          <span className="block text-[11px] opacity-80 truncate">{route.startingLocation}</span>
                        </div>
                        <span className="font-mono text-[11px] shrink-0 ml-2">
                          {route.departureTime}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Route Editor */}
                <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto space-y-4">
                  {activeRoute ? (
                    <>
                      <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-[#0F1E36]">{activeRoute.routeLabel}</h3>
                            {activeRoute.isIncomplete && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Incomplete Record
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">Route #{activeRoute.routeNumber} Official Schedule</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onResetRouteDefaults(passkeyInput).then(() => showSuccess('Routes reset to official circular records'))}
                            className="px-2.5 py-1.5 rounded-lg border border-[#DCD8D0] hover:bg-[#FAF9F5] text-slate-600 text-xs font-semibold flex items-center gap-1"
                            title="Reset all routes to circular default"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Reset Defaults</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveRoute}
                            disabled={isSaving}
                            className="px-4 py-1.5 rounded-lg bg-[#0F1E36] hover:bg-[#1A2F50] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                          >
                            <Save className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isSaving ? 'Saving...' : 'Save Updates'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Schedule Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-[#0F1E36] mb-1">
                            Departure Time
                          </label>
                          <div className="relative flex items-center">
                            <Clock className="w-3.5 h-3.5 text-amber-600 absolute left-3 pointer-events-none" />
                            <input
                              type="text"
                              value={editDepartureTime}
                              onChange={(e) => setEditDepartureTime(e.target.value)}
                              placeholder="e.g. 7:05 AM"
                              className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#DCD8D0] text-xs font-mono font-bold text-[#0F1E36] outline-none focus:border-amber-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-[#0F1E36] mb-1">
                            Starting Location
                          </label>
                          <input
                            type="text"
                            value={editStartingLocation}
                            onChange={(e) => setEditStartingLocation(e.target.value)}
                            placeholder="Starting terminal name..."
                            className="w-full px-3 py-2 rounded-lg border border-[#DCD8D0] text-xs font-semibold text-[#0F1E36] outline-none focus:border-amber-600"
                          />
                        </div>
                      </div>

                      {/* Destination Field */}
                      <div className="text-xs">
                        <label className="block font-bold text-[#0F1E36] mb-1">
                          Destination
                        </label>
                        <input
                          type="text"
                          value={editDestination}
                          onChange={(e) => setEditDestination(e.target.value)}
                          placeholder="Destination..."
                          className="w-full px-3 py-2 rounded-lg border border-[#DCD8D0] text-xs font-semibold text-[#0F1E36] outline-none focus:border-amber-600"
                        />
                      </div>

                      {/* Stops Sequencer */}
                      <div className="space-y-2 pt-2 border-t border-[#E5E2DC]">
                        <div className="flex items-center justify-between">
                          <label className="block font-bold text-[#0F1E36] text-xs uppercase tracking-wider">
                            Ordered Stop Sequence ({editStops.length} stops)
                          </label>
                        </div>

                        {/* Add Stop Input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newStopName}
                            onChange={(e) => setNewStopName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStop())}
                            placeholder="Add new stop name..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#DCD8D0] text-xs outline-none focus:border-amber-600"
                          />
                          <button
                            type="button"
                            onClick={handleAddStop}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Stop</span>
                          </button>
                        </div>

                        {/* Stops Ordered List */}
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {editStops.map((stop, idx) => (
                            <div
                              key={stop.id}
                              className="p-2 rounded-lg border border-[#E5E2DC] bg-[#FAF9F5] flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-mono text-slate-400 text-[10px] w-5">
                                  {idx + 1}.
                                </span>
                                <input
                                  type="text"
                                  value={stop.name}
                                  onChange={(e) => {
                                    const updated = [...editStops];
                                    updated[idx] = { ...stop, name: e.target.value };
                                    setEditStops(updated);
                                  }}
                                  className="flex-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-600 outline-none text-xs font-medium text-[#0F1E36]"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveStop(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                  title="Move up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveStop(idx, 'down')}
                                  disabled={idx === editStops.length - 1}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                  title="Move down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStop(stop.id)}
                                  className="p-1 rounded text-red-500 hover:bg-red-50"
                                  title="Remove stop"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">Select a route to edit details.</p>
                  )}
                </div>

              </div>
            )}

            {/* Tab 2: Service Advisories Publisher */}
            {activeTab === 'advisories' && (
              <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
                
                {/* Publish Form */}
                <div className="bg-[#FAF9F5] p-4 sm:p-5 rounded-xl border border-[#E5E2DC] space-y-3">
                  <h3 className="text-xs font-bold text-[#0F1E36] uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>Publish Official Service Advisory</span>
                  </h3>

                  <form onSubmit={handlePublishAdvisory} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-[#0F1E36] mb-1">
                          Advisory Headline
                        </label>
                        <input
                          type="text"
                          value={newAdvTitle}
                          onChange={(e) => setNewAdvTitle(e.target.value)}
                          placeholder="e.g. Route 14 Departure Rescheduled by 10 Minutes..."
                          className="w-full px-3 py-2 rounded-lg border border-[#DCD8D0] text-xs outline-none focus:border-amber-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#0F1E36] mb-1">
                          Associated Route
                        </label>
                        <select
                          value={newAdvRouteNumber}
                          onChange={(e) => setNewAdvRouteNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#DCD8D0] text-xs bg-white outline-none focus:border-amber-600"
                        >
                          <option value="All Routes">All Fleet Corridors</option>
                          {routes.map((r) => (
                            <option key={r.id} value={r.routeLabel}>
                              {r.routeLabel} ({r.startingLocation})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#0F1E36] mb-1">
                        Advisory Message
                      </label>
                      <textarea
                        value={newAdvMessage}
                        onChange={(e) => setNewAdvMessage(e.target.value)}
                        placeholder="Detailed guidance for students regarding schedule adjustments, diversions, or notices..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[#DCD8D0] text-xs outline-none focus:border-amber-600 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 text-xs">
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 mr-1.5">Type:</span>
                          <select
                            value={newAdvType}
                            onChange={(e) => setNewAdvType(e.target.value as any)}
                            className="px-2 py-1 rounded border border-[#DCD8D0] text-xs bg-white"
                          >
                            <option value="notice">Notice</option>
                            <option value="guideline">Guideline</option>
                            <option value="verification">Verification</option>
                            <option value="alert">Alert</option>
                          </select>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-slate-500 mr-1.5">Severity:</span>
                          <select
                            value={newAdvSeverity}
                            onChange={(e) => setNewAdvSeverity(e.target.value as any)}
                            className="px-2 py-1 rounded border border-[#DCD8D0] text-xs bg-white"
                          >
                            <option value="low">Standard (Low)</option>
                            <option value="medium">Important (Medium)</option>
                            <option value="high">Urgent (High)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg bg-[#0F1E36] hover:bg-[#1A2F50] text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        Publish Advisory to Students
                      </button>
                    </div>
                  </form>
                </div>

                {/* Published Advisories List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#0F1E36] uppercase tracking-wider">
                    Published Advisories ({advisories.length})
                  </h3>

                  <div className="space-y-2">
                    {advisories.map((adv) => (
                      <div
                        key={adv.id}
                        className={`p-3.5 rounded-xl border text-xs bg-white flex items-start justify-between gap-3 ${
                          adv.status === 'RESOLVED' ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-[#E5E2DC]'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {adv.routeNumber && (
                              <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-900 text-[10px]">
                                {adv.routeNumber}
                              </span>
                            )}
                            <span className="font-bold text-[#0F1E36]">{adv.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              adv.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {adv.status || 'ACTIVE'}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">{adv.message}</p>
                          <span className="text-[10px] font-mono text-slate-400 block">{adv.date}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateAdvisory(
                                adv.id,
                                { status: adv.status === 'ACTIVE' ? 'RESOLVED' : 'ACTIVE' },
                                passkeyInput
                              ).then(() => showSuccess('Advisory status updated'))
                            }
                            className="px-2.5 py-1 rounded text-xs font-semibold border border-[#DCD8D0] hover:bg-[#FAF9F5]"
                          >
                            {adv.status === 'ACTIVE' ? 'Mark Resolved' : 'Reactivate'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onDeleteAdvisory(adv.id, passkeyInput).then(() =>
                                showSuccess('Advisory removed')
                              )
                            }
                            className="p-1.5 rounded text-red-500 hover:bg-red-50"
                            title="Delete advisory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Tab 3: Cloud Database & Security Settings */}
            {activeTab === 'database' && (
              <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
                
                <div className="p-4 rounded-xl border border-[#E5E2DC] bg-[#FAF9F5] space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0F1E36]">
                    <Database className="w-4 h-4 text-amber-600" />
                    <span>Firebase Realtime Database Diagnostics</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white border border-[#E5E2DC]">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Sync Engine State</span>
                      <span className="text-xs font-bold text-[#0F1E36]">{syncStatus}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-[#E5E2DC]">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Fallback Guarantee</span>
                      <span className="text-xs font-bold text-emerald-800">
                        {diagnostics.isConfigured ? 'Cloud Active + Local Sync' : 'Verified Local Fallback Active'}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-[#E5E2DC] sm:col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Database Endpoint</span>
                      <span className="text-xs font-mono text-slate-700 break-all">{diagnostics.databaseURL}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-950">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Database Security Rules (`database.rules.json`)</span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed text-[11px]">
                    Public read access is granted for students to query bus routes and published service advisories. Unrestricted writes are strictly disabled. Only authenticated administrators with the transport in-charge authorization can commit schedule updates.
                  </p>
                </div>

              </div>
            )}

          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 bg-[#FAF9F5] border-t border-[#E5E2DC] flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            CVR College of Engineering • Transport Department Console
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0F1E36] text-white font-bold text-xs hover:bg-[#1A2F50]"
          >
            Close Console
          </button>
        </div>

      </div>
    </div>
  );
};
